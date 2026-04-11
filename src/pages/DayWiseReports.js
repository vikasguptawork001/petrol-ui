import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getLocalDateString, formatDateInIndia } from '../utils/dateUtils';
import * as XLSX from 'xlsx';
import TransactionLoader from '../components/TransactionLoader';
import './Report.css';

const fmt = (v) => Math.round(parseFloat(v || 0) * 100) / 100;
const fmtMoney = (v) => `₹${fmt(v).toFixed(2)}`;

const DayWiseReports = () => {
  const [tab, setTab] = useState('nozzle');

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d;
  });
  const [toDate, setToDate] = useState(new Date());

  const [nozzleFilter, setNozzleFilter] = useState('');
  const [nozzles, setNozzles] = useState([]);

  const [partyFilter, setPartyFilter] = useState('');
  const [sellerParties, setSellerParties] = useState([]);
  const [attendantFilter, setAttendantFilter] = useState('');
  const [attendants, setAttendants] = useState([]);
  const [creditOnly, setCreditOnly] = useState(false);

  const [nozzleByDay, setNozzleByDay] = useState([]);
  const [nozzleByDayNozzle, setNozzleByDayNozzle] = useState([]);
  const [nozzleSummary, setNozzleSummary] = useState(null);

  const [salesRows, setSalesRows] = useState([]);
  const [salesSummary, setSalesSummary] = useState(null);
  const [salesCreditOnly, setSalesCreditOnly] = useState(false);

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [nRes, pRes, aRes] = await Promise.all([
          apiClient.get(config.api.nozzles),
          apiClient.get(config.api.sellers),
          apiClient.get(config.api.attendants)
        ]);
        setNozzles(nRes.data.nozzles || []);
        setSellerParties(pRes.data.parties || pRes.data.sellers || []);
        setAttendants(aRes.data.attendants || []);
      } catch (e) {
        /* ignore */
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (fromDate && toDate && fromDate > toDate) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const run = async () => {
      setLoading(true);
      try {
        if (tab === 'nozzle') {
          const params = {
            from_date: getLocalDateString(fromDate),
            to_date: getLocalDateString(toDate)
          };
          if (nozzleFilter) params.nozzle_id = nozzleFilter;
          const res = await apiClient.get(config.api.nozzleReadingsDaywiseReport, {
            params,
            signal: ctrl.signal
          });
          if (!ctrl.signal.aborted) {
            setNozzleByDay(res.data?.by_day || []);
            setNozzleByDayNozzle(res.data?.by_day_nozzle || []);
            setNozzleSummary(res.data?.summary || null);
          }
        } else {
          const params = {
            from_date: getLocalDateString(fromDate),
            to_date: getLocalDateString(toDate),
            credit_only: creditOnly
          };
          if (partyFilter) params.seller_party_id = partyFilter;
          if (nozzleFilter) params.nozzle_id = nozzleFilter;
          if (attendantFilter) params.attendant_id = attendantFilter;
          const res = await apiClient.get(config.api.salesDaywiseReport, {
            params,
            signal: ctrl.signal
          });
          if (!ctrl.signal.aborted) {
            setSalesRows(res.data?.rows || []);
            setSalesSummary(res.data?.summary || null);
            setSalesCreditOnly(!!res.data?.credit_only);
          }
        }
      } catch (e) {
        if (e.name === 'CanceledError' || e.name === 'AbortError') return;
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    };
    run();
    return () => ctrl.abort();
  }, [tab, fromDate, toDate, nozzleFilter, partyFilter, attendantFilter, creditOnly]);

  const displayDate = (d) => {
    if (!d) return '—';
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
      const [y, m, day] = d.split(/[-T]/);
      return formatDateInIndia(new Date(Number(y), Number(m) - 1, Number(day)));
    }
    return formatDateInIndia(d);
  };

  const exportNozzleExcel = () => {
    if (exporting || nozzleByDayNozzle.length === 0) return;
    setExporting(true);
    try {
      const data = nozzleByDayNozzle.map((r) => ({
        Date: displayDate(r.reading_date),
        Nozzle: r.nozzle_name,
        Shifts: r.shift_count,
        Completed: r.completed_shifts,
        Pending: r.pending_shifts,
        'Liters sold': fmt(r.liters_sold)
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Day nozzle');
      XLSX.writeFile(
        wb,
        `nozzle_readings_daywise_${getLocalDateString(fromDate)}_${getLocalDateString(toDate)}.xlsx`
      );
    } catch (e) {
      alert('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const exportSalesExcel = () => {
    if (exporting || salesRows.length === 0) return;
    setExporting(true);
    try {
      const data = salesRows.map((r) => ({
        Date: displayDate(r.transaction_date),
        Bills: r.bill_count,
        'Total sales': fmt(r.total_sales),
        Paid: fmt(r.total_paid),
        'Still pending (₹)': fmt(r.total_due)
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Day sales due');
      const tag = salesCreditOnly ? 'credit_only' : 'all';
      XLSX.writeFile(
        wb,
        `sales_daywise_${tag}_${getLocalDateString(fromDate)}_${getLocalDateString(toDate)}.xlsx`
      );
    } catch (e) {
      alert('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const inp = {
    padding: '5px 8px',
    fontSize: '11px',
    background: '#0f151f',
    border: '1px solid #2a3340',
    borderRadius: '5px',
    color: '#eef2f8',
    outline: 'none'
  };
  const dateInp = { ...inp, width: '100%' };
  const lbl = {
    fontSize: '9px',
    color: '#9aaebf',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '3px',
    display: 'block'
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
      <TransactionLoader isLoading={loading} type="transaction" message="Loading reports..." />
      <div style={{ padding: '10px 14px', maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📅</span>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#eef2f8' }}>Daily summaries</h1>
            </div>
            <p style={{ fontSize: '11px', color: '#9aaebf', margin: '2px 0 0 0' }}>
              See pump meter sales by day, and how much was collected vs still pending each day
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setTab('nozzle')}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid #2a3340',
                cursor: 'pointer',
                background: tab === 'nozzle' ? '#f59a30' : 'transparent',
                color: tab === 'nozzle' ? '#1a1200' : '#9aaebf'
              }}
            >
              Pump meters
            </button>
            <button
              type="button"
              onClick={() => setTab('sales')}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid #2a3340',
                cursor: 'pointer',
                background: tab === 'sales' ? '#f59a30' : 'transparent',
                color: tab === 'sales' ? '#1a1200' : '#9aaebf'
              }}
            >
              Sales & pending
            </button>
            <button
              onClick={tab === 'nozzle' ? exportNozzleExcel : exportSalesExcel}
              disabled={
                exporting ||
                (tab === 'nozzle' ? nozzleByDayNozzle.length === 0 : salesRows.length === 0)
              }
              style={{
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: 600,
                background: '#f59a30',
                border: 'none',
                borderRadius: '5px',
                cursor:
                  tab === 'nozzle'
                    ? nozzleByDayNozzle.length === 0
                      ? 'not-allowed'
                      : 'pointer'
                    : salesRows.length === 0
                      ? 'not-allowed'
                      : 'pointer',
                color: '#1a1200',
                opacity:
                  tab === 'nozzle'
                    ? nozzleByDayNozzle.length === 0
                      ? 0.5
                      : 1
                    : salesRows.length === 0
                      ? 0.5
                      : 1
              }}
            >
              Export Excel
            </button>
          </div>
        </div>

        <div style={{ background: '#0f151f', border: '1px solid #2a3340', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
            <div>
              <label style={lbl}>From</label>
              <DatePicker
                selected={fromDate}
                onChange={(d) => {
                  setFromDate(d);
                  if (d && toDate && d > toDate) setToDate(d);
                }}
                dateFormat="dd-MM-yy"
                maxDate={toDate}
                style={dateInp}
                className="pp-datepicker-compact"
              />
            </div>
            <div>
              <label style={lbl}>To</label>
              <DatePicker
                selected={toDate}
                onChange={(d) => {
                  setToDate(d);
                  if (d && fromDate && d < fromDate) setFromDate(d);
                }}
                dateFormat="dd-MM-yy"
                minDate={fromDate}
                style={dateInp}
                className="pp-datepicker-compact"
              />
            </div>
            <div>
              <label style={lbl}>Nozzle</label>
              <select
                value={nozzleFilter}
                onChange={(e) => setNozzleFilter(e.target.value)}
                style={inp}
              >
                <option value="">All</option>
                {nozzles.filter((n) => !n.is_archived).map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>
            {tab === 'sales' && (
              <>
                <div>
                  <label style={lbl}>Party</label>
                  <select
                    value={partyFilter}
                    onChange={(e) => setPartyFilter(e.target.value)}
                    style={inp}
                  >
                    <option value="">All</option>
                    {sellerParties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.party_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Attendant</label>
                  <select
                    value={attendantFilter}
                    onChange={(e) => setAttendantFilter(e.target.value)}
                    style={inp}
                  >
                    <option value="">All</option>
                    {attendants.filter((a) => !a.is_archived).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name || `Att. ${a.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '4px' }}>
                  <label style={{ ...lbl, marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      checked={creditOnly}
                      onChange={(e) => setCreditOnly(e.target.checked)}
                      style={{ accentColor: '#f59a30' }}
                    />
                    <span>{'Only unpaid / partly paid bills'}</span>
                  </label>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                const f = new Date();
                f.setDate(f.getDate() - 29);
                setFromDate(f);
                setToDate(d);
                setNozzleFilter('');
                setPartyFilter('');
                setAttendantFilter('');
                setCreditOnly(false);
              }}
              style={{
                padding: '5px 12px',
                fontSize: '11px',
                background: 'transparent',
                border: '1px solid #2a3340',
                borderRadius: '5px',
                cursor: 'pointer',
                color: '#9aaebf'
              }}
            >
              ↺ Reset range
            </button>
          </div>
        </div>

        {tab === 'nozzle' && (
          <>
            {nozzleSummary && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                {pill('Total liters (period)', fmt(nozzleSummary.total_liters).toFixed(2), '#3b82f6')}
                {pill('Total shifts', nozzleSummary.total_shifts, '#9aaebf')}
                {pill('Days with readings', nozzleSummary.days, '#22c55e')}
              </div>
            )}
            <div style={{ marginBottom: '8px', fontSize: '11px', color: '#9aaebf', fontWeight: 600 }}>
              By date and pump nozzle
            </div>
            <div style={{ background: '#0f151f', border: '1px solid #2a3340', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#0d1320', borderBottom: '1px solid #2a3340' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Nozzle</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Shifts</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Done</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Pending</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Liters sold</th>
                  </tr>
                </thead>
                <tbody>
                  {nozzleByDayNozzle.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9aaebf' }}>
                        No nozzle readings in this range
                      </td>
                    </tr>
                  ) : (
                    nozzleByDayNozzle.map((r, i) => (
                      <tr key={`${r.reading_date}-${r.nozzle_id}-${i}`} style={{ borderBottom: '1px solid #1a2330' }}>
                        <td style={{ padding: '7px 10px', color: '#eef2f8', whiteSpace: 'nowrap' }}>
                          {displayDate(r.reading_date)}
                        </td>
                        <td style={{ padding: '7px 10px', color: '#eef2f8' }}>{r.nozzle_name}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#9aaebf' }}>{r.shift_count}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#22c55e' }}>{r.completed_shifts}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#f59a30' }}>{r.pending_shifts}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#3b82f6' }}>
                          {fmt(r.liters_sold).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ margin: '16px 0 8px', fontSize: '11px', color: '#9aaebf', fontWeight: 600 }}>
              Daily totals (all pumps combined)
            </div>
            <div style={{ background: '#0f151f', border: '1px solid #2a3340', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#0d1320', borderBottom: '1px solid #2a3340' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Shifts</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Liters sold</th>
                  </tr>
                </thead>
                <tbody>
                  {nozzleByDay.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: '#9aaebf' }}>
                        —
                      </td>
                    </tr>
                  ) : (
                    nozzleByDay.map((r) => (
                      <tr key={String(r.reading_date)} style={{ borderBottom: '1px solid #1a2330' }}>
                        <td style={{ padding: '7px 10px', color: '#eef2f8', whiteSpace: 'nowrap' }}>
                          {displayDate(r.reading_date)}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#9aaebf' }}>{r.shift_count}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#3b82f6' }}>
                          {fmt(r.liters_sold).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'sales' && (
          <>
            {salesSummary && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                {pill('Total sales', fmtMoney(salesSummary.total_sales), '#f59a30')}
                {pill('Total paid', fmtMoney(salesSummary.total_paid), '#22c55e')}
                {pill('Total due', fmtMoney(salesSummary.total_due), '#e8593c')}
                {pill('Bills', salesSummary.bill_count, '#9aaebf')}
                {pill('Days', salesSummary.days, '#64748b')}
              </div>
            )}
            {salesCreditOnly && (
              <p style={{ fontSize: '11px', color: '#f59a30', marginBottom: '8px' }}>
                Only bills that still have money pending are included in these totals.
              </p>
            )}
            <div style={{ background: '#0f151f', border: '1px solid #2a3340', borderRadius: '8px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#0d1320', borderBottom: '1px solid #2a3340' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Bills</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Sales</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Paid</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {salesRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#9aaebf' }}>
                        No sales in this range
                      </td>
                    </tr>
                  ) : (
                    salesRows.map((r) => (
                      <tr key={String(r.transaction_date)} style={{ borderBottom: '1px solid #1a2330' }}>
                        <td style={{ padding: '7px 10px', color: '#eef2f8', whiteSpace: 'nowrap' }}>
                          {displayDate(r.transaction_date)}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#9aaebf' }}>{r.bill_count}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#f59a30' }}>
                          {fmtMoney(r.total_sales)}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#22c55e' }}>{fmtMoney(r.total_paid)}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', color: '#e8593c', fontWeight: 600 }}>
                          {fmtMoney(r.total_due)}
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

export default DayWiseReports;
