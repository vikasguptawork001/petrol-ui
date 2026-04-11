import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getLocalDateString, formatDateInIndia } from '../utils/dateUtils';
import * as XLSX from 'xlsx';
import TransactionLoader from '../components/TransactionLoader';
import Pagination from '../components/Pagination';
import './Report.css';

const fmt = (v) => Math.round(parseFloat(v || 0) * 100) / 100;
const fmtMoney = (v) => `₹${fmt(v).toFixed(2)}`;

const emptyForm = () => ({
  expense_date: getLocalDateString(new Date()),
  amount: '',
  purpose: '',
  paid_to: '',
  reason: '',
  notes: ''
});

const Expenses = () => {
  const [tab, setTab] = useState('record');

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [listFrom, setListFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d;
  });
  const [listTo, setListTo] = useState(new Date());
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [listLoading, setListLoading] = useState(false);

  const [reportFrom, setReportFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d;
  });
  const [reportTo, setReportTo] = useState(new Date());
  const [reportByDay, setReportByDay] = useState([]);
  const [reportByPurpose, setReportByPurpose] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [exporting, setExporting] = useState(false);
  const listAbortRef = useRef(null);
  const reportAbortRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [listFrom, listTo, debouncedSearch]);

  const inp = {
    padding: '8px 10px',
    fontSize: '12px',
    background: '#0f151f',
    border: '1px solid #2a3340',
    borderRadius: '6px',
    color: '#eef2f8',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  };
  const lbl = {
    fontSize: '10px',
    color: '#9aaebf',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
    display: 'block'
  };

  const loadList = async () => {
    listAbortRef.current?.abort();
    const ctrl = new AbortController();
    listAbortRef.current = ctrl;
    setListLoading(true);
    try {
      const res = await apiClient.get(config.api.expenses, {
        params: {
          from_date: getLocalDateString(listFrom),
          to_date: getLocalDateString(listTo),
          search: debouncedSearch || undefined,
          page,
          limit
        },
        signal: ctrl.signal
      });
      if (!ctrl.signal.aborted) {
        setExpenses(res.data?.expenses || []);
        setPagination(res.data?.pagination || null);
      }
    } catch (e) {
      if (e.name === 'CanceledError' || e.name === 'AbortError') return;
    } finally {
      if (!ctrl.signal.aborted) setListLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== 'record') return;
    loadList();
    return () => listAbortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, listFrom, listTo, debouncedSearch, page, limit]);

  useEffect(() => {
    if (tab !== 'report') return;
    reportAbortRef.current?.abort();
    const ctrl = new AbortController();
    reportAbortRef.current = ctrl;
    setReportLoading(true);
    const params = {
      from_date: getLocalDateString(reportFrom),
      to_date: getLocalDateString(reportTo)
    };
    Promise.all([
      apiClient.get(config.api.expensesReportSummary, { params, signal: ctrl.signal }),
      apiClient.get(config.api.expensesReportByPurpose, { params, signal: ctrl.signal })
    ])
      .then(([sumRes, purRes]) => {
        if (ctrl.signal.aborted) return;
        setReportByDay(sumRes.data?.by_day || []);
        setReportSummary(sumRes.data?.summary || null);
        setReportByPurpose(purRes.data?.rows || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!ctrl.signal.aborted) setReportLoading(false);
      });
    return () => ctrl.abort();
  }, [tab, reportFrom, reportTo]);

  const displayDate = (d) => {
    if (!d) return '—';
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
      const [y, m, day] = d.split(/[-T]/);
      return formatDateInIndia(new Date(Number(y), Number(m) - 1, Number(day)));
    }
    return formatDateInIndia(d);
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!form.purpose.trim()) {
      alert('Purpose is required.');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      alert('Enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        expense_date: form.expense_date,
        amount: amt,
        purpose: form.purpose.trim(),
        paid_to: form.paid_to.trim() || null,
        reason: form.reason.trim() || null,
        notes: form.notes.trim() || null
      };
      if (editingId) {
        await apiClient.put(`${config.api.expenses}/${editingId}`, payload);
      } else {
        await apiClient.post(config.api.expenses, payload);
      }
      resetForm();
      loadList();
    } catch (err) {
      alert(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      expense_date: String(row.expense_date).slice(0, 10),
      amount: String(row.amount ?? ''),
      purpose: row.purpose || '',
      paid_to: row.paid_to || '',
      reason: row.reason || '',
      notes: row.notes || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense entry?')) return;
    try {
      await apiClient.delete(`${config.api.expenses}/${id}`);
      if (editingId === id) resetForm();
      loadList();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  const exportReportExcel = () => {
    if (exporting || reportByDay.length === 0) return;
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      const daily = reportByDay.map((r) => ({
        Date: displayDate(r.expense_date),
        Entries: r.expense_count,
        'Total (₹)': fmt(r.total_amount)
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(daily), 'By day');
      const purpose = reportByPurpose.map((r) => ({
        Purpose: r.purpose,
        Entries: r.expense_count,
        'Total (₹)': fmt(r.total_amount)
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purpose), 'By purpose');
      XLSX.writeFile(
        wb,
        `expenses_report_${getLocalDateString(reportFrom)}_${getLocalDateString(reportTo)}.xlsx`
      );
    } catch (e) {
      alert('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const exportListExcel = () => {
    if (exporting || expenses.length === 0) return;
    setExporting(true);
    try {
      const data = expenses.map((r) => ({
        Date: displayDate(r.expense_date),
        Amount: fmt(r.amount),
        Purpose: r.purpose,
        'Paid to': r.paid_to || '',
        Why: r.reason || '',
        Notes: r.notes || ''
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
      XLSX.writeFile(wb, `expenses_list_${getLocalDateString(listFrom)}_${getLocalDateString(listTo)}.xlsx`);
    } catch (e) {
      alert('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const pill = (label, val, color) => (
    <div
      style={{
        background: '#141b26',
        borderRadius: '8px',
        padding: '10px 14px',
        border: '1px solid #2a3340',
        borderLeft: `3px solid ${color}`,
        minWidth: '120px'
      }}
    >
      <div
        style={{
          fontSize: '9px',
          color: '#9aaebf',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '4px'
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 700, color }}>{val}</div>
    </div>
  );

  return (
    <Layout>
      <TransactionLoader
        isLoading={listLoading || reportLoading || saving}
        type="transaction"
        message={saving ? 'Saving…' : 'Loading…'}
      />
      <div style={{ padding: '10px 14px', maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>💸</span>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#eef2f8' }}>Expenses</h1>
            </div>
            <p style={{ fontSize: '11px', color: '#9aaebf', margin: '2px 0 0 0' }}>
              Track what you spent, who you paid, and why — then see totals by day and by category
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setTab('record')}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid #2a3340',
                cursor: 'pointer',
                background: tab === 'record' ? '#f59a30' : 'transparent',
                color: tab === 'record' ? '#1a1200' : '#9aaebf'
              }}
            >
              Record
            </button>
            <button
              type="button"
              onClick={() => setTab('report')}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid #2a3340',
                cursor: 'pointer',
                background: tab === 'report' ? '#f59a30' : 'transparent',
                color: tab === 'report' ? '#1a1200' : '#9aaebf'
              }}
            >
              Report
            </button>
          </div>
        </div>

        {tab === 'record' && (
          <>
            <form
              onSubmit={handleSubmit}
              style={{
                background: '#0f151f',
                border: '1px solid #2a3340',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '14px'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#eef2f8', marginBottom: '10px' }}>
                {editingId ? `Edit expense #${editingId}` : 'New expense'}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '12px',
                  marginBottom: '12px'
                }}
              >
                <div>
                  <label style={lbl}>Date</label>
                  <DatePicker
                    selected={form.expense_date ? new Date(form.expense_date + 'T12:00:00') : new Date()}
                    onChange={(d) =>
                      setForm((f) => ({ ...f, expense_date: d ? getLocalDateString(d) : '' }))
                    }
                    dateFormat="dd-MM-yy"
                    className="pp-datepicker-compact"
                  />
                </div>
                <div>
                  <label style={lbl}>Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    style={inp}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div style={{ gridColumn: 'span 1' }}>
                  <label style={lbl}>Purpose</label>
                  <input
                    value={form.purpose}
                    onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                    style={inp}
                    placeholder="e.g. Fuel, repairs, wages"
                    required
                  />
                </div>
                <div>
                  <label style={lbl}>Paid to (whom)</label>
                  <input
                    value={form.paid_to}
                    onChange={(e) => setForm((f) => ({ ...f, paid_to: e.target.value }))}
                    style={inp}
                    placeholder="Person or vendor"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Reason (why this payment)</label>
                  <textarea
                    value={form.reason}
                    onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                    style={{ ...inp, minHeight: '64px', resize: 'vertical' }}
                    placeholder="Short note — e.g. diesel for generator, shop rent"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={lbl}>Notes (optional)</label>
                  <input
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    style={inp}
                    placeholder="Reference, bill no., etc."
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '8px 18px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: '#22c55e',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: saving ? 'wait' : 'pointer',
                    color: '#0a1f0f'
                  }}
                >
                  {editingId ? 'Update' : 'Save expense'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12px',
                      background: 'transparent',
                      border: '1px solid #2a3340',
                      borderRadius: '6px',
                      color: '#9aaebf',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>

            <div
              style={{
                background: '#0f151f',
                border: '1px solid #2a3340',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '12px'
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
                <div>
                  <label style={lbl}>From</label>
                  <DatePicker
                    selected={listFrom}
                    onChange={(d) => {
                      setListFrom(d);
                      if (d && listTo && d > listTo) setListTo(d);
                    }}
                    dateFormat="dd-MM-yy"
                    maxDate={listTo}
                    className="pp-datepicker-compact"
                  />
                </div>
                <div>
                  <label style={lbl}>To</label>
                  <DatePicker
                    selected={listTo}
                    onChange={(d) => {
                      setListTo(d);
                      if (d && listFrom && d < listFrom) setListFrom(d);
                    }}
                    dateFormat="dd-MM-yy"
                    minDate={listFrom}
                    className="pp-datepicker-compact"
                  />
                </div>
                <div style={{ flex: '1', minWidth: '180px' }}>
                  <label style={lbl}>Search</label>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={inp}
                    placeholder="Purpose, paid to, reason…"
                  />
                </div>
                <button
                  type="button"
                  onClick={exportListExcel}
                  disabled={exporting || expenses.length === 0}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: '#f59a30',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: expenses.length === 0 ? 'not-allowed' : 'pointer',
                    color: '#1a1200',
                    opacity: expenses.length === 0 ? 0.5 : 1
                  }}
                >
                  Export list
                </button>
              </div>
            </div>

            <div style={{ background: '#0f151f', border: '1px solid #2a3340', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#0d1320', borderBottom: '1px solid #2a3340' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Amount</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Purpose</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Paid to</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Reason</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', color: '#9aaebf', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#9aaebf' }}>
                        No expenses in this range
                      </td>
                    </tr>
                  ) : (
                    expenses.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #1a2330' }}>
                        <td style={{ padding: '7px 10px', color: '#eef2f8', whiteSpace: 'nowrap' }}>
                          {displayDate(r.expense_date)}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#f59a30' }}>
                          {fmtMoney(r.amount)}
                        </td>
                        <td style={{ padding: '7px 10px', color: '#eef2f8', maxWidth: '140px' }}>{r.purpose}</td>
                        <td style={{ padding: '7px 10px', color: '#9aaebf', maxWidth: '120px' }}>{r.paid_to || '—'}</td>
                        <td style={{ padding: '7px 10px', color: '#9aaebf', maxWidth: '220px' }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.reason || ''}>
                            {r.reason || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            onClick={() => startEdit(r)}
                            style={{
                              marginRight: '6px',
                              padding: '4px 8px',
                              fontSize: '10px',
                              background: 'transparent',
                              border: '1px solid #2a3340',
                              borderRadius: '4px',
                              color: '#93c5fd',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '10px',
                              background: 'transparent',
                              border: '1px solid #7f1d1d',
                              borderRadius: '4px',
                              color: '#fca5a5',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {pagination && pagination.totalPages > 1 && (
                <div style={{ padding: '8px 12px', borderTop: '1px solid #2a3340' }}>
                  <Pagination
                    currentPage={page}
                    totalPages={pagination.totalPages}
                    onPageChange={(p) => {
                      setPage(p);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    totalRecords={pagination.totalRecords}
                    showTotalRecords
                  />
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'report' && (
          <>
            <div
              style={{
                background: '#0f151f',
                border: '1px solid #2a3340',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '12px'
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
                <div>
                  <label style={lbl}>From</label>
                  <DatePicker
                    selected={reportFrom}
                    onChange={(d) => {
                      setReportFrom(d);
                      if (d && reportTo && d > reportTo) setReportTo(d);
                    }}
                    dateFormat="dd-MM-yy"
                    maxDate={reportTo}
                    className="pp-datepicker-compact"
                  />
                </div>
                <div>
                  <label style={lbl}>To</label>
                  <DatePicker
                    selected={reportTo}
                    onChange={(d) => {
                      setReportTo(d);
                      if (d && reportFrom && d < reportFrom) setReportFrom(d);
                    }}
                    dateFormat="dd-MM-yy"
                    minDate={reportFrom}
                    className="pp-datepicker-compact"
                  />
                </div>
                <button
                  type="button"
                  onClick={exportReportExcel}
                  disabled={exporting || reportByDay.length === 0}
                  style={{
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: '#f59a30',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: reportByDay.length === 0 ? 'not-allowed' : 'pointer',
                    color: '#1a1200',
                    opacity: reportByDay.length === 0 ? 0.5 : 1
                  }}
                >
                  Export Excel
                </button>
              </div>
            </div>

            {reportSummary && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                {pill('Total spent', fmtMoney(reportSummary.total_amount), '#e8593c')}
                {pill('Entries', reportSummary.expense_count, '#9aaebf')}
                {pill('Days with expenses', reportSummary.days_with_expenses, '#22c55e')}
              </div>
            )}

            <div style={{ marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: '#9aaebf' }}>By day</div>
            <div
              style={{
                background: '#0f151f',
                border: '1px solid #2a3340',
                borderRadius: '8px',
                overflowX: 'auto',
                marginBottom: '16px'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#0d1320', borderBottom: '1px solid #2a3340' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Entries</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportByDay.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '32px', color: '#9aaebf' }}>
                        No data for this range
                      </td>
                    </tr>
                  ) : (
                    reportByDay.map((r) => (
                      <tr key={String(r.expense_date)} style={{ borderBottom: '1px solid #1a2330' }}>
                        <td style={{ padding: '7px 10px', color: '#eef2f8' }}>{displayDate(r.expense_date)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#9aaebf' }}>{r.expense_count}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#e8593c' }}>
                          {fmtMoney(r.total_amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: '#9aaebf' }}>By purpose</div>
            <div style={{ background: '#0f151f', border: '1px solid #2a3340', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#0d1320', borderBottom: '1px solid #2a3340' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Purpose</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Entries</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportByPurpose.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '32px', color: '#9aaebf' }}>
                        —
                      </td>
                    </tr>
                  ) : (
                    reportByPurpose.map((r) => (
                      <tr key={r.purpose} style={{ borderBottom: '1px solid #1a2330' }}>
                        <td style={{ padding: '7px 10px', color: '#eef2f8' }}>{r.purpose}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#9aaebf' }}>{r.expense_count}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#f59a30' }}>
                          {fmtMoney(r.total_amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Expenses;
