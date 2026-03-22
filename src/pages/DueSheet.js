import React, { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Pagination from '../components/Pagination';
import TransactionLoader from '../components/TransactionLoader';
import { getLocalDateString } from '../utils/dateUtils';
import './DueSheet.css';
import '../styles/petrolpump-theme.css';

/** Full Due Sheet UI — use on `/due-sheet` or embedded on the home dashboard (`embedded`). */
export function DueSheetPanel({ embedded = false }) {
  const { user } = useAuth();
  const toast = useToast();

  const [fromDueDate, setFromDueDate] = useState(null);
  const [toDueDate, setToDueDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [parties, setParties] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [pagination, setPagination] = useState(null);
  const [editingDueDateId, setEditingDueDateId] = useState(null);
  const [editingDueDateValue, setEditingDueDateValue] = useState(null);
  const [dueDateSaving, setDueDateSaving] = useState(false);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!user || user.role === 'super_admin') return;
    if (!embedded) {
      toast.error('Access denied. Due Sheet is visible only to Super Admin.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, embedded]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchDueSheet();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDueDate, toDueDate, debouncedSearchQuery, page, limit, user]);

  const fetchDueSheet = async () => {
    if (!user || user.role !== 'super_admin') {
      setLoading(false);
      setParties([]);
      setSummary(null);
      setPagination(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      const params = {
        page,
        limit
      };
      if (fromDueDate) {
        params.from_due_date = getLocalDateString(fromDueDate);
      }
      if (toDueDate) {
        params.to_due_date = getLocalDateString(toDueDate);
      }
      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery;
      }

      const response = await apiClient.get(config.api.dueSheet, {
        params,
        signal: abortController.signal
      });

      if (!abortController.signal.aborted) {
        setParties(response.data.parties || []);
        setSummary(response.data.summary || null);
        setPagination(response.data.pagination || null);
      }
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return;
      }
      console.error('Error fetching due sheet:', error);
      toast.error('Failed to load due sheet');
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleResetFilters = () => {
    setFromDueDate(null);
    setToDueDate(null);
    setSearchQuery('');
    setPage(1);
    setLimit(50);
  };

  const startEditDueDate = (p) => {
    setEditingDueDateId(p.id);
    setEditingDueDateValue(p.due_date ? new Date(p.due_date) : new Date());
  };

  const handleSaveDueDate = async (partyId) => {
    if (editingDueDateValue == null) return;
    setDueDateSaving(true);
    try {
      await apiClient.patch(`${config.api.sellers}/${partyId}`, {
        due_date: getLocalDateString(editingDueDateValue)
      });
      setEditingDueDateId(null);
      setEditingDueDateValue(null);
      toast.success('Due date updated');
      fetchDueSheet();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to update due date');
    } finally {
      setDueDateSaving(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount) => {
    const num = Number(amount || 0);
    if (Number.isNaN(num)) return '0';
    return num.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    });
  };

  const computeDaysOverdue = (dueDate) => {
    if (!dueDate) return '-';
    const d = new Date(dueDate);
    const today = new Date();
    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return '0';
    return diff.toString();
  };

  if (!user) return null;

  if (user.role !== 'super_admin') {
    if (embedded) {
      return (
        <div className="card dashboard-hub-panel">
          <p className="dashboard-hub-muted">Due Sheet is visible only to Super Admin.</p>
        </div>
      );
    }
    return (
      <div className="ds-page">
        <div style={{ padding: 24, textAlign: 'center', color: '#b91c1c', fontWeight: 600 }}>
          Access denied. Due Sheet is visible only to Super Admin.
        </div>
      </div>
    );
  }

  const inner = (
    <div className={`ds-page ${embedded ? 'ds-page--embedded' : ''}`}>
      {!embedded && (
        <div className="pp-page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>📋</span>
              <h2 style={{ color: '#fff', margin: 0 }}>Due Sheet</h2>
            </div>
            <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Outstanding balances and credit recovery. Track overdue payments globally.</p>
          </div>
        </div>
      )}

      {embedded && <p className="ds-embedded-hint">Filters, summary, change due date, pagination — same as /due-sheet.</p>}

      <div className="ds-card">
        <h2 className="ds-card-title">Filters</h2>
        <div className="ds-filters">
          <div className="ds-filter-group">
            <label>From Due Date</label>
            <DatePicker
              selected={fromDueDate}
              onChange={setFromDueDate}
              dateFormat="dd/MM/yyyy"
              className="ds-input react-datepicker-wrapper"
              placeholderText="From date"
              isClearable
            />
          </div>
          <div className="ds-filter-group">
            <label>To Due Date</label>
            <DatePicker
              selected={toDueDate}
              onChange={setToDueDate}
              dateFormat="dd/MM/yyyy"
              className="ds-input react-datepicker-wrapper"
              placeholderText="To date"
              isClearable
            />
          </div>
          <div className="ds-filter-group ds-filter-search">
            <label>Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, mobile, address, vehicle..."
              className="ds-input"
            />
          </div>
          <div className="ds-filter-group">
            <label>&nbsp;</label>
            <button type="button" className="ds-btn ds-btn-outline" onClick={handleResetFilters}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {summary && (
        <div className="ds-summary-row">
          <div className="ds-summary-card ds-summary-total">
            <span className="ds-summary-label">Total Creditors</span>
            <span className="ds-summary-value">{summary.total_creditors || 0}</span>
          </div>
          <div className="ds-summary-card ds-summary-balance">
            <span className="ds-summary-label">Total Outstanding</span>
            <span className="ds-summary-value">₹ {formatCurrency(summary.total_balance)}</span>
          </div>
          <div className="ds-summary-card ds-summary-overdue">
            <span className="ds-summary-label">Overdue</span>
            <span className="ds-summary-value">{summary.overdue_count || 0}</span>
          </div>
        </div>
      )}

      <div className="ds-table-wrap">
        {loading ? (
          <div className="ds-loading">
            <TransactionLoader message="Loading due sheet..." />
          </div>
        ) : parties.length === 0 ? (
          <div className="ds-empty">No creditors found for the selected filters.</div>
        ) : (
          <div className="table-scroll">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Creditor Name</th>
                  <th>Mobile</th>
                  <th>Vehicle</th>
                  <th>Address</th>
                  <th className="numeric">Opening (₹)</th>
                  <th className="numeric">Closing (₹)</th>
                  <th className="numeric">Outstanding (₹)</th>
                  <th>Due Date</th>
                  <th className="numeric">Days Overdue</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parties.map((p, idx) => {
                  const daysOverdue = computeDaysOverdue(p.due_date);
                  const isOverdue = daysOverdue !== '-' && parseInt(daysOverdue, 10) > 0;
                  const isEditing = editingDueDateId === p.id;
                  return (
                    <tr key={p.id}>
                      <td>{(page - 1) * limit + idx + 1}</td>
                      <td><strong>{p.party_name}</strong></td>
                      <td>{p.mobile_number || '—'}</td>
                      <td>{p.vehicle_number || '—'}</td>
                      <td style={{ maxWidth: 260 }}>{p.address || '—'}</td>
                      <td className="numeric">{formatCurrency(p.opening_balance)}</td>
                      <td className="numeric">{formatCurrency(p.closing_balance)}</td>
                      <td className="numeric ds-cell-outstanding">₹ {formatCurrency(p.balance_amount)}</td>
                      <td>
                        {isEditing ? (
                          <span className="ds-edit-due-date-wrap">
                            <DatePicker
                              selected={editingDueDateValue}
                              onChange={setEditingDueDateValue}
                              dateFormat="dd/MM/yyyy"
                              className="ds-input react-datepicker-wrapper ds-inline-date"
                              placeholderText="Due date"
                            />
                            <button
                              type="button"
                              className="ds-btn ds-btn-sm ds-btn-primary"
                              onClick={() => handleSaveDueDate(p.id)}
                              disabled={dueDateSaving}
                            >
                              {dueDateSaving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              className="ds-btn ds-btn-sm ds-btn-outline"
                              onClick={() => { setEditingDueDateId(null); setEditingDueDateValue(null); }}
                              disabled={dueDateSaving}
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          formatDate(p.due_date)
                        )}
                      </td>
                      <td className={`numeric ${isOverdue ? 'ds-cell-overdue' : ''}`}>
                        {daysOverdue}
                      </td>
                      <td>
                        {isEditing ? null : (
                          <button
                            type="button"
                            className="ds-btn ds-btn-sm ds-btn-outline"
                            onClick={() => startEditDueDate(p)}
                          >
                            Change date
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="ds-pagination-wrap">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            totalRecords={pagination.totalRecords}
            showTotalRecords
          />
        </div>
      )}
    </div>
  );

  return inner;
}

const DueSheet = () => (
  <Layout>
    <DueSheetPanel embedded={false} />
  </Layout>
);

export default DueSheet;
