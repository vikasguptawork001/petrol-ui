// import React, { useEffect, useRef, useState } from 'react';
// import Layout from '../components/Layout';
// import apiClient from '../config/axios';
// import config from '../config/config';
// import { useAuth } from '../context/AuthContext';
// import { useToast } from '../context/ToastContext';
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
// import Pagination from '../components/Pagination';
// import TransactionLoader from '../components/TransactionLoader';
// import { getLocalDateString } from '../utils/dateUtils';
// import './DueSheet.css';
// import '../styles/petrolpump-theme.css';

// /** Full Due Sheet UI — use on `/due-sheet` or embedded on the home dashboard (`embedded`). */
// export function DueSheetPanel({ embedded = false }) {
//   const { user } = useAuth();
//   const toast = useToast();

//   const [fromDueDate, setFromDueDate] = useState(null);
//   const [toDueDate, setToDueDate] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
//   const [parties, setParties] = useState([]);
//   const [summary, setSummary] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [page, setPage] = useState(1);
//   const [limit, setLimit] = useState(50);
//   const [pagination, setPagination] = useState(null);
//   const [editingDueDateId, setEditingDueDateId] = useState(null);
//   const [editingDueDateValue, setEditingDueDateValue] = useState(null);
//   const [dueDateSaving, setDueDateSaving] = useState(false);

//   const abortControllerRef = useRef(null);

//   useEffect(() => {
//     if (!user || user.role === 'super_admin') return;
//     if (!embedded) {
//       toast.error('Access denied. Due Sheet is visible only to Super Admin.');
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user, embedded]);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedSearchQuery(searchQuery.trim());
//       setPage(1);
//     }, 500);
//     return () => clearTimeout(timer);
//   }, [searchQuery]);

//   useEffect(() => {
//     fetchDueSheet();
//     return () => {
//       if (abortControllerRef.current) {
//         abortControllerRef.current.abort();
//       }
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [fromDueDate, toDueDate, debouncedSearchQuery, page, limit, user]);

//   const fetchDueSheet = async () => {
//     if (!user || user.role !== 'super_admin') {
//       setLoading(false);
//       setParties([]);
//       setSummary(null);
//       setPagination(null);
//       return;
//     }

//     if (abortControllerRef.current) {
//       abortControllerRef.current.abort();
//     }
//     const abortController = new AbortController();
//     abortControllerRef.current = abortController;

//     try {
//       setLoading(true);
//       const params = {
//         page,
//         limit
//       };
//       if (fromDueDate) {
//         params.from_due_date = getLocalDateString(fromDueDate);
//       }
//       if (toDueDate) {
//         params.to_due_date = getLocalDateString(toDueDate);
//       }
//       if (debouncedSearchQuery) {
//         params.search = debouncedSearchQuery;
//       }

//       const response = await apiClient.get(config.api.dueSheet, {
//         params,
//         signal: abortController.signal
//       });

//       if (!abortController.signal.aborted) {
//         setParties(response.data.parties || []);
//         setSummary(response.data.summary || null);
//         setPagination(response.data.pagination || null);
//       }
//     } catch (error) {
//       if (error.name === 'CanceledError' || error.name === 'AbortError') {
//         return;
//       }
//       console.error('Error fetching due sheet:', error);
//       toast.error('Failed to load due sheet');
//     } finally {
//       if (!abortController.signal.aborted) {
//         setLoading(false);
//       }
//     }
//   };

//   const handleResetFilters = () => {
//     setFromDueDate(null);
//     setToDueDate(null);
//     setSearchQuery('');
//     setPage(1);
//     setLimit(50);
//   };

//   const startEditDueDate = (p) => {
//     setEditingDueDateId(p.id);
//     setEditingDueDateValue(p.due_date ? new Date(p.due_date) : new Date());
//   };

//   const handleSaveDueDate = async (partyId) => {
//     if (editingDueDateValue == null) return;
//     setDueDateSaving(true);
//     try {
//       await apiClient.patch(`${config.api.sellers}/${partyId}`, {
//         due_date: getLocalDateString(editingDueDateValue)
//       });
//       setEditingDueDateId(null);
//       setEditingDueDateValue(null);
//       toast.success('Due date updated');
//       fetchDueSheet();
//     } catch (e) {
//       toast.error(e.response?.data?.error || 'Failed to update due date');
//     } finally {
//       setDueDateSaving(false);
//     }
//   };

//   const formatDate = (value) => {
//     if (!value) return '-';
//     try {
//       const d = new Date(value);
//       if (Number.isNaN(d.getTime())) return '-';
//       return d.toLocaleDateString('en-IN', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric'
//       });
//     } catch {
//       return '-';
//     }
//   };

//   const formatCurrency = (amount) => {
//     const num = Number(amount || 0);
//     if (Number.isNaN(num)) return '0';
//     return num.toLocaleString('en-IN', {
//       maximumFractionDigits: 2,
//       minimumFractionDigits: 0
//     });
//   };

//   const computeDaysOverdue = (dueDate) => {
//     if (!dueDate) return '-';
//     const d = new Date(dueDate);
//     const today = new Date();
//     d.setHours(0, 0, 0, 0);
//     today.setHours(0, 0, 0, 0);
//     const diff = Math.floor((today - d) / (1000 * 60 * 60 * 24));
//     if (diff <= 0) return '0';
//     return diff.toString();
//   };

//   if (!user) return null;

//   if (user.role !== 'super_admin') {
//     if (embedded) {
//       return (
//         <div className="card dashboard-hub-panel">
//           <p className="dashboard-hub-muted">Due Sheet is visible only to Super Admin.</p>
//         </div>
//       );
//     }
//     return (
//       <div className="ds-page">
//         <div style={{ padding: 24, textAlign: 'center', color: '#b91c1c', fontWeight: 600 }}>
//           Access denied. Due Sheet is visible only to Super Admin.
//         </div>
//       </div>
//     );
//   }

//   const inner = (
//     <div className={`ds-page ${embedded ? 'ds-page--embedded' : ''}`}>
//       {!embedded && (
//         <div className="pp-page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
//           <div>
//             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//               <span style={{ fontSize: '24px' }}>📋</span>
//               <h2 style={{ color: '#fff', margin: 0 }}>Due Sheet</h2>
//             </div>
//             <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Outstanding balances and credit recovery. Track overdue payments globally.</p>
//           </div>
//         </div>
//       )}

//       {embedded && <p className="ds-embedded-hint">Filters, summary, change due date, pagination — same as /due-sheet.</p>}

//       <div className="ds-card">
//         <h2 className="ds-card-title">Filters</h2>
//         <div className="ds-filters">
//           <div className="ds-filter-group">
//             <label>From Due Date</label>
//             <DatePicker
//               selected={fromDueDate}
//               onChange={setFromDueDate}
//               dateFormat="dd/MM/yyyy"
//               className="ds-input react-datepicker-wrapper"
//               placeholderText="From date"
//               isClearable
//             />
//           </div>
//           <div className="ds-filter-group">
//             <label>To Due Date</label>
//             <DatePicker
//               selected={toDueDate}
//               onChange={setToDueDate}
//               dateFormat="dd/MM/yyyy"
//               className="ds-input react-datepicker-wrapper"
//               placeholderText="To date"
//               isClearable
//             />
//           </div>
//           <div className="ds-filter-group ds-filter-search">
//             <label>Search</label>
//             <input
//               type="text"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               placeholder="Name, mobile, address, vehicle..."
//               className="ds-input"
//             />
//           </div>
//           <div className="ds-filter-group">
//             <label>&nbsp;</label>
//             <button type="button" className="ds-btn ds-btn-outline" onClick={handleResetFilters}>
//               Reset
//             </button>
//           </div>
//         </div>
//       </div>

//       {summary && (
//         <div className="ds-summary-row">
//           <div className="ds-summary-card ds-summary-total">
//             <span className="ds-summary-label">Total Creditors</span>
//             <span className="ds-summary-value">{summary.total_creditors || 0}</span>
//           </div>
//           <div className="ds-summary-card ds-summary-balance">
//             <span className="ds-summary-label">Total Outstanding</span>
//             <span className="ds-summary-value">₹ {formatCurrency(summary.total_balance)}</span>
//           </div>
//           <div className="ds-summary-card ds-summary-overdue">
//             <span className="ds-summary-label">Overdue</span>
//             <span className="ds-summary-value">{summary.overdue_count || 0}</span>
//           </div>
//         </div>
//       )}

//       <div className="ds-table-wrap">
//         {loading ? (
//           <div className="ds-loading">
//             <TransactionLoader message="Loading due sheet..." />
//           </div>
//         ) : parties.length === 0 ? (
//           <div className="ds-empty">No creditors found for the selected filters.</div>
//         ) : (
//           <div className="table-scroll">
//             <table className="ds-table">
//               <thead>
//                 <tr>
//                   <th>#</th>
//                   <th>Creditor Name</th>
//                   <th>Mobile</th>
//                   <th>Vehicle</th>
//                   <th>Address</th>
//                   <th className="numeric">Opening (₹)</th>
//                   <th className="numeric">Closing (₹)</th>
//                   <th className="numeric">Outstanding (₹)</th>
//                   <th>Due Date</th>
//                   <th className="numeric">Days Overdue</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {parties.map((p, idx) => {
//                   const daysOverdue = computeDaysOverdue(p.due_date);
//                   const isOverdue = daysOverdue !== '-' && parseInt(daysOverdue, 10) > 0;
//                   const isEditing = editingDueDateId === p.id;
//                   return (
//                     <tr key={p.id}>
//                       <td>{(page - 1) * limit + idx + 1}</td>
//                       <td><strong>{p.party_name}</strong></td>
//                       <td>{p.mobile_number || '—'}</td>
//                       <td>{p.vehicle_number || '—'}</td>
//                       <td style={{ maxWidth: 260 }}>{p.address || '—'}</td>
//                       <td className="numeric">{formatCurrency(p.opening_balance)}</td>
//                       <td className="numeric">{formatCurrency(p.closing_balance)}</td>
//                       <td className="numeric ds-cell-outstanding">₹ {formatCurrency(p.balance_amount)}</td>
//                       <td>
//                         {isEditing ? (
//                           <span className="ds-edit-due-date-wrap">
//                             <DatePicker
//                               selected={editingDueDateValue}
//                               onChange={setEditingDueDateValue}
//                               dateFormat="dd/MM/yyyy"
//                               className="ds-input react-datepicker-wrapper ds-inline-date"
//                               placeholderText="Due date"
//                             />
//                             <button
//                               type="button"
//                               className="ds-btn ds-btn-sm ds-btn-primary"
//                               onClick={() => handleSaveDueDate(p.id)}
//                               disabled={dueDateSaving}
//                             >
//                               {dueDateSaving ? 'Saving...' : 'Save'}
//                             </button>
//                             <button
//                               type="button"
//                               className="ds-btn ds-btn-sm ds-btn-outline"
//                               onClick={() => { setEditingDueDateId(null); setEditingDueDateValue(null); }}
//                               disabled={dueDateSaving}
//                             >
//                               Cancel
//                             </button>
//                           </span>
//                         ) : (
//                           formatDate(p.due_date)
//                         )}
//                       </td>
//                       <td className={`numeric ${isOverdue ? 'ds-cell-overdue' : ''}`}>
//                         {daysOverdue}
//                       </td>
//                       <td>
//                         {isEditing ? null : (
//                           <button
//                             type="button"
//                             className="ds-btn ds-btn-sm ds-btn-outline"
//                             onClick={() => startEditDueDate(p)}
//                           >
//                             Change date
//                           </button>
//                         )}
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {pagination && pagination.totalPages > 1 && (
//         <div className="ds-pagination-wrap">
//           <Pagination
//             currentPage={pagination.page}
//             totalPages={pagination.totalPages}
//             onPageChange={setPage}
//             totalRecords={pagination.totalRecords}
//             showTotalRecords
//           />
//         </div>
//       )}
//     </div>
//   );

//   return inner;
// }

// const DueSheet = () => (
//   <Layout>
//     <DueSheetPanel embedded={false} />
//   </Layout>
// );

// export default DueSheet;



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
import * as XLSX from 'xlsx';
import './DueSheet.css';
import '../styles/petrolpump-theme.css';

// Minimal Icons
const Icon = ({ name, size = 14 }) => {
  const icons = {
    due: <><path d="M3 6h18" /><path d="M8 6v4" /><path d="M16 6v4" /><rect x="3" y="10" width="18" height="12" rx="2" /><path d="M3 14h18" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
    search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
    reset: <><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />,
    location: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
    edit: <><path d="M17 3l4 4-7 7H10v-4l7-7z" /><path d="M4 20h16" /></>,
    close: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      {icons[name]}
    </svg>
  );
};

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
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [exporting, setExporting] = useState(false);

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
  }, [fromDueDate, toDueDate, debouncedSearchQuery, page, limit, overdueOnly, user]);

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
      const params = { page, limit };
      if (fromDueDate) params.from_due_date = getLocalDateString(fromDueDate);
      if (toDueDate) params.to_due_date = getLocalDateString(toDueDate);
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;
      if (overdueOnly) params.overdue_only = true;

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
      if (error.name === 'CanceledError' || error.name === 'AbortError') return;
      console.error('Error fetching due sheet:', error);
      toast.error('Failed to load due sheet');
    } finally {
      if (!abortController.signal.aborted) setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFromDueDate(null);
    setToDueDate(null);
    setSearchQuery('');
    setPage(1);
    setLimit(50);
    setOverdueOnly(false);
  };

  const exportToExcel = () => {
    if (exporting || parties.length === 0) return;
    setExporting(true);
    try {
      const rows = parties.map((p, idx) => {
        const daysOverdue = computeDaysOverdue(p.due_date);
        return {
          'S.No': (page - 1) * limit + idx + 1,
          'Creditor Name': p.party_name || '-',
          Mobile: p.mobile_number || '-',
          Vehicle: p.vehicle_number || '-',
          Address: p.address || '-',
          'Opening (INR)': Number(p.opening_balance || 0),
          'Closing (INR)': Number(p.closing_balance || 0),
          'Outstanding (INR)': Number(p.balance_amount || 0),
          'Due Date': formatDate(p.due_date),
          'Days Overdue': daysOverdue === '-' ? 0 : Number(daysOverdue)
        };
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Due Sheet');
      XLSX.writeFile(wb, `due_sheet_${getLocalDateString(new Date())}.xlsx`);
      toast.success('Due sheet exported');
    } catch (error) {
      toast.error('Failed to export due sheet');
    } finally {
      setExporting(false);
    }
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
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount) => {
    const num = Number(amount || 0);
    if (Number.isNaN(num)) return '0';
    return num.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
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
        <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
          Due Sheet is visible only to Super Admin.
        </div>
      );
    }
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#e8593c', fontWeight: 500 }}>
        Access denied. Due Sheet is visible only to Super Admin.
      </div>
    );
  }

  const inner = (
    <div style={{ padding: embedded ? '0' : '8px 12px', maxWidth: '1600px', margin: '0 auto' }}>
      {!embedded && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="due" size={18} />
              <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#fff' }}>Due Sheet</h1>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '2px 0 0 0' }}>Outstanding balances and credit recovery</p>
          </div>
        </div>
      )}

      {/* Filters - Compact */}
      <div style={{ background: '#0f151f', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', marginBottom: '8px' }}>
          <div>
            <label style={{ fontSize: '9px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>From Due Date</label>
            <DatePicker selected={fromDueDate} onChange={setFromDueDate} dateFormat="dd/MM/yy" className="pp-input" style={inputStyle} placeholderText="From" isClearable />
          </div>
          <div>
            <label style={{ fontSize: '9px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>To Due Date</label>
            <DatePicker selected={toDueDate} onChange={setToDueDate} dateFormat="dd/MM/yy" className="pp-input" style={inputStyle} placeholderText="To" isClearable />
          </div>
          <div>
            <label style={{ fontSize: '9px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Search</label>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Name, mobile, address..." style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <label style={{ fontSize: '9px', color: 'transparent', display: 'block', marginBottom: '2px' }}>&nbsp;</label>
            <button onClick={handleResetFilters} style={{ ...btnStyle, background: '#2a3340', width: '100%' }}>Reset</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <label style={{ fontSize: '9px', color: 'transparent', display: 'block', marginBottom: '2px' }}>&nbsp;</label>
            <button
              onClick={() => { setOverdueOnly((prev) => !prev); setPage(1); }}
              style={{
                ...btnStyle,
                width: '100%',
                background: overdueOnly ? '#e8593c' : '#2a3340',
                color: overdueOnly ? '#ffffff' : '#9aaebf'
              }}
            >
              Overdue Only
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <label style={{ fontSize: '9px', color: 'transparent', display: 'block', marginBottom: '2px' }}>&nbsp;</label>
            <button
              onClick={exportToExcel}
              disabled={exporting || parties.length === 0}
              style={{ ...btnStyle, width: '100%', background: '#1d9e75', color: '#ffffff', opacity: exporting || parties.length === 0 ? 0.6 : 1 }}
            >
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards - Compact */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
          <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #3b82f6' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>Total Creditors</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{summary.total_creditors || 0}</div>
          </div>
          <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #f59a30' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>Total Due Amount</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59a30' }}>₹{formatCurrency(summary.total_balance)}</div>
          </div>
          <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #e8593c' }}>
            <div style={{ fontSize: '9px', color: '#94a3b8' }}>Overdue</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#e8593c' }}>{summary.overdue_count || 0}</div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid #2a3340' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><TransactionLoader message="Loading..." /></div>
        ) : parties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '12px' }}>No creditors found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#0f151f' }}>
                <th style={{ padding: '8px 6px', textAlign: 'center', width: '40px' }}>#</th>
                <th style={{ padding: '8px 6px', textAlign: 'left' }}>Creditor</th>
                <th style={{ padding: '8px 6px', textAlign: 'left' }}>Mobile</th>
                <th style={{ padding: '8px 6px', textAlign: 'left' }}>Address</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>Opening</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>Outstanding</th>
                <th style={{ padding: '8px 6px', textAlign: 'left' }}>Due Date</th>
                <th style={{ padding: '8px 6px', textAlign: 'right', width: '70px' }}>Days</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', width: '80px' }}>Actions</th>
               </tr>
            </thead>
            <tbody>
              {parties.map((p, idx) => {
                const daysOverdue = computeDaysOverdue(p.due_date);
                const isOverdue = daysOverdue !== '-' && parseInt(daysOverdue, 10) > 0;
                const isEditing = editingDueDateId === p.id;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #2a3340' }}>
                    <td style={{ padding: '8px 6px', textAlign: 'center', color: '#6c7f8f' }}>{(page - 1) * limit + idx + 1} </td>
                    <td style={{ padding: '8px 6px', fontWeight: 500 }}>{p.party_name}</td>
                    <td style={{ padding: '8px 6px', color: '#9aaebf' }}>{p.mobile_number || '—'}</td>
                    <td style={{ padding: '8px 6px', color: '#9aaebf', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address || '—'}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', color: '#9aaebf' }}>₹{formatCurrency(p.opening_balance)}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: '#f59a30' }}>₹{formatCurrency(p.balance_amount)}</td>
                    <td style={{ padding: '8px 6px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <DatePicker selected={editingDueDateValue} onChange={setEditingDueDateValue} dateFormat="dd/MM/yy" className="pp-input" style={{ ...inputStyle, width: '100px', padding: '2px 4px' }} />
                          <button onClick={() => handleSaveDueDate(p.id)} disabled={dueDateSaving} style={{ padding: '2px 6px', fontSize: '9px', background: '#22c55e', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Save</button>
                          <button onClick={() => { setEditingDueDateId(null); setEditingDueDateValue(null); }} style={{ padding: '2px 6px', fontSize: '9px', background: '#2a3340', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
                        </div>
                      ) : (
                        <span style={{ color: isOverdue ? '#e8593c' : '#9aaebf' }}>{formatDate(p.due_date)}</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 600, color: isOverdue ? '#e8593c' : '#9aaebf' }}>{daysOverdue}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                      {!isEditing && (
                        <button onClick={() => startEditDueDate(p)} style={{ padding: '2px 6px', fontSize: '9px', background: '#3b82f6', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                          Change
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ marginTop: '12px' }}>
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

// Styles
const inputStyle = {
  padding: '6px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #2a3340',
  background: '#0f151f', color: '#fff', width: '100%', boxSizing: 'border-box'
};

const btnStyle = {
  padding: '6px 12px', fontSize: '11px', fontWeight: 500, background: '#f59a30',
  border: 'none', borderRadius: '4px', cursor: 'pointer'
};