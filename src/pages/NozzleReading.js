// // import React, { useState, useEffect } from 'react';
// // import Layout from '../components/Layout';
// // import apiClient from '../config/axios';
// // import config from '../config/config';
// // import { useToast } from '../context/ToastContext';
// // import DatePicker from 'react-datepicker';
// // import 'react-datepicker/dist/react-datepicker.css';
// // import { getLocalDateString, getLocalISOString } from '../utils/dateUtils';
// // import Pagination from '../components/Pagination';
// // import PetrolNozzleLoader from '../components/PetrolNozzleLoader';
// // import './Report.css';
// // import './PetrolPump.css';
// // import './Party.css';

// // const RECORD_MODES = [
// //   { id: 'both', title: 'Full shift', desc: 'Record opening and closing in one step' },
// //   { id: 'opening_only', title: 'Opening only', desc: 'Start of shift — add closing later' },
// //   { id: 'add_closing', title: 'Add closing', desc: 'Complete readings that have opening only' }
// // ];

// // const formatDateTime = (s) => {
// //   if (!s) return '—';
// //   const d = new Date(s);
// //   if (isNaN(d.getTime())) return s;
// //   return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
// // };

// // export function NozzleReadingPanel({ embedded = false }) {
// //   const toast = useToast();
// //   const [showRecordModal, setShowRecordModal] = useState(false);
// //   const [recordMode, setRecordMode] = useState('both');
// //   const [attendants, setAttendants] = useState([]);
// //   const [nozzles, setNozzles] = useState([]);
// //   const [form, setForm] = useState({
// //     attendant_id: '',
// //     nozzle_id: '',
// //     reading_date: new Date(),
// //     opening_reading: '',
// //     closing_reading: '',
// //     opening_at: new Date(),
// //     closing_at: new Date()
// //   });
// //   const [submitting, setSubmitting] = useState(false);
// //   const [readings, setReadings] = useState([]);
// //   const [loadingReport, setLoadingReport] = useState(false);
// //   const [fromDate, setFromDate] = useState(new Date());
// //   const [toDate, setToDate] = useState(new Date());
// //   const [nozzleFilter, setNozzleFilter] = useState('');
// //   const [attendantFilter, setAttendantFilter] = useState('');
// //   const [page, setPage] = useState(1);
// //   const [limit] = useState(50);
// //   const [pagination, setPagination] = useState(null);

// //   // Pending closings (opening-only records) for "Add closing" tab
// //   const [pendingReadings, setPendingReadings] = useState([]);
// //   const [loadingPending, setLoadingPending] = useState(false);
// //   const [pendingFromDate, setPendingFromDate] = useState(() => {
// //     const d = new Date();
// //     d.setDate(d.getDate() - 7);
// //     return d;
// //   });
// //   const [reportTab, setReportTab] = useState('details'); // details, nozzle, attendant
// //   const [pendingToDate, setPendingToDate] = useState(new Date());
// //   const [addingClosingForId, setAddingClosingForId] = useState(null);
// //   const [closingForm, setClosingForm] = useState({ closing_reading: '', closing_at: new Date() });
// //   const [submittingClosing, setSubmittingClosing] = useState(false);

// //   useEffect(() => {
// //     const fetchMeta = async () => {
// //       try {
// //         const [attRes, nozRes] = await Promise.all([
// //           apiClient.get(config.api.attendants),
// //           apiClient.get(config.api.nozzles)
// //         ]);
// //         setAttendants(attRes.data.attendants || []);
// //         setNozzles(nozRes.data.nozzles || []);
// //       } catch (e) {
// //         console.error(e);
// //         toast.error('Failed to load attendants/nozzles');
// //       }
// //     };
// //     fetchMeta();
// //   }, [toast]);

// //   useEffect(() => {
// //     fetchReadings();
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [fromDate, toDate, nozzleFilter, attendantFilter, page, limit]);

// //   const fetchReadings = async () => {
// //     setLoadingReport(true);
// //     try {
// //       const params = {
// //         from_date: getLocalDateString(fromDate),
// //         to_date: getLocalDateString(toDate),
// //         page,
// //         limit
// //       };
// //       if (nozzleFilter) params.nozzle_id = nozzleFilter;
// //       if (attendantFilter) params.attendant_id = attendantFilter;
// //       const res = await apiClient.get(config.api.nozzleReadings, { params });
// //       setReadings(res.data.readings || []);
// //       setPagination(res.data.pagination || null);
// //     } catch (e) {
// //       console.error(e);
// //       toast.error('Failed to load readings');
// //     } finally {
// //       setLoadingReport(false);
// //     }
// //   };

// //   const fetchPendingReadings = async () => {
// //     setLoadingPending(true);
// //     try {
// //       const params = {
// //         from_date: getLocalDateString(pendingFromDate),
// //         to_date: getLocalDateString(pendingToDate),
// //         pending_closing: '1',
// //         limit: 200
// //       };
// //       const res = await apiClient.get(config.api.nozzleReadings, { params });
// //       setPendingReadings(res.data.readings || []);
// //     } catch (e) {
// //       console.error(e);
// //       toast.error('Failed to load pending readings');
// //     } finally {
// //       setLoadingPending(false);
// //     }
// //   };

// //   useEffect(() => {
// //     if (showRecordModal && recordMode === 'add_closing') {
// //       fetchPendingReadings();
// //     }
// //   // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [showRecordModal, recordMode, pendingFromDate, pendingToDate]);

// //   useEffect(() => {
// //     const fetchLastReading = async () => {
// //       if (!form.nozzle_id) return;
// //       try {
// //         const res = await apiClient.get(`${config.api.nozzleReadings}/last/${form.nozzle_id}`);
// //         if (res.data && res.data.last_closing_reading !== '') {
// //           setForm(prev => ({ ...prev, opening_reading: res.data.last_closing_reading }));
// //         }
// //       } catch (err) {
// //         console.error('Error fetching last reading:', err);
// //       }
// //     };
// //     if (showRecordModal && (recordMode === 'both' || recordMode === 'opening_only')) {
// //       fetchLastReading();
// //     }
// //   }, [form.nozzle_id, showRecordModal, recordMode]);

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     if (!form.attendant_id || !form.nozzle_id) {
// //       toast.error('Select attendant and nozzle');
// //       return;
// //     }
// //     const payload = {
// //       attendant_id: form.attendant_id,
// //       nozzle_id: form.nozzle_id,
// //       reading_date: getLocalDateString(form.reading_date),
// //       opening_at: getLocalISOString(form.opening_at),
// //       closing_at: getLocalISOString(form.closing_at)
// //     };

// //     if (recordMode === 'both') {
// //       const opening = parseFloat(form.opening_reading);
// //       const closing = parseFloat(form.closing_reading);
// //       if (isNaN(opening) || isNaN(closing) || opening < 0 || closing < 0) {
// //         toast.error('Enter valid opening and closing readings');
// //         return;
// //       }
// //       if (closing <= opening) {
// //         toast.error('Closing reading must be greater than opening reading');
// //         return;
// //       }
// //       payload.opening_reading = opening;
// //       payload.closing_reading = closing;
// //     } else {
// //       const opening = parseFloat(form.opening_reading);
// //       if (isNaN(opening) || opening < 0) {
// //         toast.error('Enter valid opening reading');
// //         return;
// //       }
// //       payload.opening_reading = opening;
// //     }

// //     setSubmitting(true);
// //     try {
// //       await apiClient.post(config.api.nozzleReadings, payload);
// //       toast.success('Reading saved');
// //       setForm({
// //         ...form,
// //         opening_reading: '',
// //         closing_reading: '',
// //         opening_at: new Date(),
// //         closing_at: new Date()
// //       });
// //       fetchReadings();
// //       setShowRecordModal(false);
// //     } catch (err) {
// //       toast.error(err.response?.data?.error || 'Failed to save reading');
// //     } finally {
// //       setSubmitting(false);
// //     }
// //   };

// //   const openAddClosing = (reading) => {
// //     setAddingClosingForId(reading.id);
// //     setClosingForm({
// //       closing_reading: '',
// //       closing_at: new Date()
// //     });
// //   };

// //   const cancelAddClosing = () => {
// //     setAddingClosingForId(null);
// //   };

// //   const handleSaveClosing = async (reading) => {
// //     const closing = parseFloat(closingForm.closing_reading);
// //     if (isNaN(closing) || closing < 0) {
// //       toast.error('Enter valid closing reading');
// //       return;
// //     }
// //     const opening = Number(reading.opening_reading);
// //     if (closing <= opening) {
// //       toast.error('Closing reading must be greater than opening reading');
// //       return;
// //     }
// //     setSubmittingClosing(true);
// //     try {
// //       await apiClient.post(config.api.nozzleReadings, {
// //         id: reading.id,
// //         attendant_id: reading.attendant_id,
// //         nozzle_id: reading.nozzle_id,
// //         reading_date: typeof reading.reading_date === 'string' ? reading.reading_date.substring(0, 10) : getLocalDateString(reading.reading_date),
// //         closing_reading: closing,
// //         closing_at: getLocalISOString(closingForm.closing_at)
// //       });
// //       toast.success('Closing recorded');
// //       setAddingClosingForId(null);
// //       fetchPendingReadings();
// //       fetchReadings();
// //       setShowRecordModal(false);
// //     } catch (err) {
// //       toast.error(err.response?.data?.error || 'Failed to save closing');
// //     } finally {
// //       setSubmittingClosing(false);
// //     }
// //   };

// //   return (
// //     <div className={`pp-page ${embedded ? 'pp-page--embedded' : ''}`}>
// //         <div className="pp-page-header" style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
// //           <div>
// //             <h1 className="pp-page-title">Daily Nozzle Reading</h1>
// //             <p className="pp-page-subtitle" style={{ maxWidth: '640px' }}>
// //               {embedded
// //                 ? 'Date range, filters, full report table, and Record (opening / closing / add closing).'
// //                 : 'The report below loads by default. Manage nozzles and attendants from the sidebar menu. Tap Record to enter readings in a guided flow.'}
// //             </p>
// //           </div>
// //           <button
// //             type="button"
// //             className="btn btn-primary"
// //             onClick={() => { setShowRecordModal(true); setRecordMode('both'); }}
// //             style={{ padding: '12px 22px', fontWeight: 600, borderRadius: '10px', flexShrink: 0 }}
// //           >
// //             Record nozzle reading
// //           </button>
// //         </div>

// //         <div className="pp-card">
// //           <h2 className="pp-card-title">Daily Nozzle Report</h2>
// //           <div className="pp-filters">
// //             <div className="form-group">
// //               <label>From Date</label>
// //               <DatePicker selected={fromDate} onChange={setFromDate} dateFormat="dd-MM-yyyy" className="pp-input" style={{ width: '100%' }} />
// //             </div>
// //             <div className="form-group">
// //               <label>To Date</label>
// //               <DatePicker selected={toDate} onChange={setToDate} dateFormat="dd-MM-yyyy" className="pp-input" style={{ width: '100%' }} />
// //             </div>
// //             <div className="form-group">
// //               <label>Nozzle</label>
// //               <select value={nozzleFilter} onChange={(e) => { setNozzleFilter(e.target.value); setPage(1); }} className="pp-input">
// //                 <option value="">All</option>
// //                 {nozzles.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
// //               </select>
// //             </div>
// //             <div className="form-group">
// //               <label>Attendant</label>
// //               <select value={attendantFilter} onChange={(e) => { setAttendantFilter(e.target.value); setPage(1); }} className="pp-input">
// //                 <option value="">All</option>
// //                 {attendants.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
// //               </select>
// //             </div>
// //           </div>

// //           <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', borderBottom: '1px solid var(--pp-border, #2a3340)', paddingBottom: '12px' }}>
// //             <button className={`btn ${reportTab === 'details' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setReportTab('details')} style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '6px' }}>All Readings</button>
// //             <button className={`btn ${reportTab === 'nozzle' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setReportTab('nozzle')} style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '6px' }}>Nozzle-wise Sale summary</button>
// //             <button className={`btn ${reportTab === 'attendant' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setReportTab('attendant')} style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '6px' }}>Attendant-wise Sale summary</button>
// //           </div>

// //           {loadingReport ? (
// //             <div className="pp-loading">
// //               <PetrolNozzleLoader size="small" />
// //               <span>Loading…</span>
// //             </div>
// //           ) : (
// //             <>
// //               {reportTab === 'details' && (
// //                 <>
// //                   <div className="pp-table-wrap">
// //                     <table className="pp-table">
// //                       <thead>
// //                         <tr>
// //                           <th>Date</th>
// //                           <th>Attendant</th>
// //                           <th>Nozzle No.</th>
// //                           <th style={{ textAlign: 'right' }}>Opening</th>
// //                           <th>Opening at</th>
// //                           <th style={{ textAlign: 'right' }}>Closing</th>
// //                           <th>Closing at</th>
// //                           <th style={{ textAlign: 'right' }}>Sale (Qty)</th>
// //                         </tr>
// //                       </thead>
// //                       <tbody>
// //                         {readings.length === 0 ? (
// //                           <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--pp-text-secondary, #9aaebf)' }}>No readings found</td></tr>
// //                         ) : (
// //                           readings.map((r) => (
// //                             <tr key={r.id}>
// //                               <td>{typeof r.reading_date === 'string' ? r.reading_date.substring(0, 10) : String(r.reading_date)}</td>
// //                               <td>{r.attendant_name}</td>
// //                               <td>{r.nozzle_name}</td>
// //                               <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Number(r.opening_reading).toFixed(2)}</td>
// //                               <td style={{ fontSize: '0.875rem' }}>{formatDateTime(r.opening_at)}</td>
// //                               <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
// //                                 {r.closing_reading != null ? (
// //                                   Number(r.closing_reading).toFixed(2)
// //                                 ) : (
// //                                   <span style={{ fontSize: '11px', background: '#f59a3020', color: '#f59a30', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Active Shift</span>
// //                                 )}
// //                               </td>
// //                               <td style={{ fontSize: '0.875rem' }}>{formatDateTime(r.closing_at)}</td>
// //                               <td style={{ textAlign: 'right', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{r.sale_quantity != null ? Number(r.sale_quantity).toFixed(2) : '—'}</td>
// //                             </tr>
// //                           ))
// //                         )}
// //                       </tbody>
// //                     </table>
// //                   </div>
// //                   {pagination && pagination.totalPages > 1 && (
// //                     <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} totalRecords={pagination.totalRecords} showTotalRecords />
// //                   )}
// //                 </>
// //               )}

// //               {reportTab === 'nozzle' && (
// //                 <div className="pp-table-wrap" style={{ maxWidth: '600px' }}>
// //                   <table className="pp-table">
// //                     <thead>
// //                       <tr>
// //                         <th>Nozzle Name</th>
// //                         <th style={{ textAlign: 'right' }}>Total Sale (Qty)</th>
// //                       </tr>
// //                     </thead>
// //                     <tbody>
// //                       {Object.entries(
// //                         readings.reduce((acc, r) => {
// //                           if (r.sale_quantity != null && !isNaN(parseFloat(r.sale_quantity))) {
// //                             acc[r.nozzle_name] = (acc[r.nozzle_name] || 0) + parseFloat(r.sale_quantity);
// //                           }
// //                           return acc;
// //                         }, {})
// //                       ).length === 0 ? (
// //                         <tr><td colSpan={2} style={{ textAlign: 'center', padding: '24px', color: 'var(--pp-text-secondary, #9aaebf)' }}>No sales recorded in current view</td></tr>
// //                       ) : (
// //                         Object.entries(
// //                           readings.reduce((acc, r) => {
// //                             if (r.sale_quantity != null && !isNaN(parseFloat(r.sale_quantity))) {
// //                               acc[r.nozzle_name] = (acc[r.nozzle_name] || 0) + parseFloat(r.sale_quantity);
// //                             }
// //                             return acc;
// //                           }, {})
// //                         ).sort((a, b) => b[1] - a[1]).map(([name, total]) => (
// //                           <tr key={'noz-'+name}>
// //                             <td style={{ fontWeight: 600 }}>{name}</td>
// //                             <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--pp-info, #3b82f6)' }}>{total.toFixed(2)}</td>
// //                           </tr>
// //                         ))
// //                       )}
// //                     </tbody>
// //                   </table>
// //                 </div>
// //               )}

// //               {reportTab === 'attendant' && (
// //                 <div className="pp-table-wrap" style={{ maxWidth: '600px' }}>
// //                   <table className="pp-table">
// //                     <thead>
// //                       <tr>
// //                         <th>Attendant Name</th>
// //                         <th style={{ textAlign: 'right' }}>Total Sale (Qty)</th>
// //                       </tr>
// //                     </thead>
// //                     <tbody>
// //                       {Object.entries(
// //                         readings.reduce((acc, r) => {
// //                           if (r.sale_quantity != null && !isNaN(parseFloat(r.sale_quantity))) {
// //                             acc[r.attendant_name] = (acc[r.attendant_name] || 0) + parseFloat(r.sale_quantity);
// //                           }
// //                           return acc;
// //                         }, {})
// //                       ).length === 0 ? (
// //                         <tr><td colSpan={2} style={{ textAlign: 'center', padding: '24px', color: 'var(--pp-text-secondary, #9aaebf)' }}>No sales recorded in current view</td></tr>
// //                       ) : (
// //                         Object.entries(
// //                           readings.reduce((acc, r) => {
// //                             if (r.sale_quantity != null && !isNaN(parseFloat(r.sale_quantity))) {
// //                               acc[r.attendant_name] = (acc[r.attendant_name] || 0) + parseFloat(r.sale_quantity);
// //                             }
// //                             return acc;
// //                           }, {})
// //                         ).sort((a, b) => b[1] - a[1]).map(([name, total]) => (
// //                           <tr key={'att-'+name}>
// //                             <td style={{ fontWeight: 600 }}>{name}</td>
// //                             <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: 'var(--pp-success, #22c55e)' }}>{total.toFixed(2)}</td>
// //                           </tr>
// //                         ))
// //                       )}
// //                     </tbody>
// //                   </table>
// //                 </div>
// //               )}
// //             </>
// //           )}
// //         </div>

// //         {showRecordModal && (
// //           <div className="modal-overlay" style={{ zIndex: 1200 }} role="presentation" onClick={() => setShowRecordModal(false)}>
// //             <div className="modal-content" style={{ maxWidth: 920, maxHeight: '92vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="nozzle-record-title">
// //               <div className="modal-header">
// //                 <h3 id="nozzle-record-title">Record nozzle reading</h3>
// //                 <button type="button" className="modal-close" onClick={() => setShowRecordModal(false)} aria-label="Close">×</button>
// //               </div>
// //               <div className="modal-body">
// //                 <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px' }}>Choose how you are recording, then complete the fields below.</p>
// //                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
// //                   {RECORD_MODES.map((m) => (
// //                     <button
// //                       key={m.id}
// //                       type="button"
// //                       onClick={() => setRecordMode(m.id)}
// //                       style={{
// //                         textAlign: 'left',
// //                         padding: '10px 14px',
// //                         borderRadius: '10px',
// //                         border: recordMode === m.id ? '2px solid var(--pp-info, #3b82f6)' : '1px solid var(--pp-border, #2a3340)',
// //                         background: recordMode === m.id ? 'rgba(59, 130, 246, 0.15)' : 'var(--pp-bg-elevated, #1a2330)',
// //                         cursor: 'pointer',
// //                         boxShadow: recordMode === m.id ? '0 4px 16px rgba(59, 130, 246, 0.2)' : 'none',
// //                         transition: 'all 0.2s ease'
// //                       }}
// //                     >
// //                       <div style={{ fontWeight: 700, fontSize: '14px', color: recordMode === m.id ? 'var(--pp-info, #3b82f6)' : 'var(--pp-text-primary, #eef2f8)', marginBottom: '4px' }}>{m.title}</div>
// //                       <div style={{ fontSize: '12px', color: 'var(--pp-text-secondary, #9aaebf)', lineHeight: 1.3 }}>{m.desc}</div>
// //                     </button>
// //                   ))}
// //                 </div>

// //                 {recordMode === 'both' && (
// //                   <div className="pp-card" style={{ boxShadow: 'none', border: '1px solid var(--pp-border, #2a3340)' }}>
// //                     <h4 className="pp-card-title" style={{ fontSize: '16px' }}>Opening &amp; closing</h4>
// //                     <form onSubmit={handleSubmit}>
// //                       <div className="pp-form-row">
// //                         <div className="form-group pp-input">
// //                           <label>Attendant *</label>
// //                           <select value={form.attendant_id} onChange={(e) => setForm({ ...form, attendant_id: e.target.value })} required>
// //                             <option value="">— Select —</option>
// //                             {attendants.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
// //                           </select>
// //                         </div>
// //                         <div className="form-group pp-input">
// //                           <label>Nozzle No. *</label>
// //                           <select value={form.nozzle_id} onChange={(e) => setForm({ ...form, nozzle_id: e.target.value })} required>
// //                             <option value="">— Select —</option>
// //                             {nozzles.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
// //                           </select>
// //                         </div>
// //                         <div className="form-group">
// //                           <label>Date *</label>
// //                           <DatePicker selected={form.reading_date} onChange={(date) => setForm({ ...form, reading_date: date })} dateFormat="dd-MM-yyyy" className="pp-input" style={{ width: '100%' }} />
// //                         </div>
// //                         <div className="form-group">
// //                           <label>Opening reading *</label>
// //                           <input type="number" step="0.01" min="0" value={form.opening_reading} onChange={(e) => setForm({ ...form, opening_reading: e.target.value })} placeholder="0" className="pp-input" required />
// //                         </div>
// //                         <div className="form-group">
// //                           <label>Opening at</label>
// //                           <DatePicker selected={form.opening_at} onChange={(date) => setForm({ ...form, opening_at: date })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yyyy HH:mm" className="pp-input" style={{ width: '100%' }} />
// //                         </div>
// //                         <div className="form-group">
// //                           <label>Closing reading *</label>
// //                           <input type="number" step="0.01" min="0" value={form.closing_reading} onChange={(e) => setForm({ ...form, closing_reading: e.target.value })} placeholder="0" className="pp-input" required />
// //                         </div>
// //                         <div className="form-group">
// //                           <label>Closing at</label>
// //                           <DatePicker selected={form.closing_at} onChange={(date) => setForm({ ...form, closing_at: date })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yyyy HH:mm" className="pp-input" style={{ width: '100%' }} />
// //                         </div>
// //                         <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save reading'}</button>
// //                       </div>
// //                     </form>
// //                   </div>
// //                 )}

// //                 {recordMode === 'opening_only' && (
// //                   <div className="pp-card" style={{ boxShadow: 'none', border: '1px solid var(--pp-border, #2a3340)' }}>
// //                     <h4 className="pp-card-title" style={{ fontSize: '16px' }}>Opening only</h4>
// //                     <p className="pp-card-body" style={{ marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>Closing can be added later using &quot;Add closing&quot; in this window.</p>
// //                     <form onSubmit={handleSubmit}>
// //                       <div className="pp-form-row">
// //                         <div className="form-group pp-input">
// //                           <label>Attendant *</label>
// //                           <select value={form.attendant_id} onChange={(e) => setForm({ ...form, attendant_id: e.target.value })} required>
// //                             <option value="">— Select —</option>
// //                             {attendants.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
// //                           </select>
// //                         </div>
// //                         <div className="form-group pp-input">
// //                           <label>Nozzle No. *</label>
// //                           <select value={form.nozzle_id} onChange={(e) => setForm({ ...form, nozzle_id: e.target.value })} required>
// //                             <option value="">— Select —</option>
// //                             {nozzles.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
// //                           </select>
// //                         </div>
// //                         <div className="form-group">
// //                           <label>Date *</label>
// //                           <DatePicker selected={form.reading_date} onChange={(date) => setForm({ ...form, reading_date: date })} dateFormat="dd-MM-yyyy" className="pp-input" style={{ width: '100%' }} />
// //                         </div>
// //                         <div className="form-group">
// //                           <label>Opening reading *</label>
// //                           <input type="number" step="0.01" min="0" value={form.opening_reading} onChange={(e) => setForm({ ...form, opening_reading: e.target.value })} placeholder="0" className="pp-input" required />
// //                         </div>
// //                         <div className="form-group">
// //                           <label>Opening at</label>
// //                           <DatePicker selected={form.opening_at} onChange={(date) => setForm({ ...form, opening_at: date })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yyyy HH:mm" className="pp-input" style={{ width: '100%' }} />
// //                         </div>
// //                         <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save opening'}</button>
// //                       </div>
// //                     </form>
// //                   </div>
// //                 )}

// //                 {recordMode === 'add_closing' && (
// //                   <div className="pp-card" style={{ boxShadow: 'none', border: '1px solid var(--pp-border, #2a3340)' }}>
// //                     <h4 className="pp-card-title" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
// //                       <span style={{ color: '#2563eb' }}>◴</span> Add closing reading
// //                     </h4>
// //                     <p className="pp-card-body" style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--pp-text-secondary, #9aaebf)', background: 'var(--pp-bg, #0a0f1a)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--pp-border, #2a3340)' }}>
// //                       Select a pending shift from the list below and finalize it with a closing reading.
// //                     </p>
// //                     <div className="pp-filters">
// //                       <div className="form-group">
// //                         <label>From date</label>
// //                         <DatePicker selected={pendingFromDate} onChange={setPendingFromDate} dateFormat="dd-MM-yyyy" className="pp-input" style={{ width: '100%' }} />
// //                       </div>
// //                       <div className="form-group">
// //                         <label>To date</label>
// //                         <DatePicker selected={pendingToDate} onChange={setPendingToDate} dateFormat="dd-MM-yyyy" className="pp-input" style={{ width: '100%' }} />
// //                       </div>
// //                       <button type="button" className="btn btn-secondary" onClick={fetchPendingReadings}>Refresh</button>
// //                     </div>
// //                     {loadingPending ? (
// //                       <div className="pp-loading">
// //                         <PetrolNozzleLoader size="small" />
// //                         <span>Loading…</span>
// //                       </div>
// //                     ) : pendingReadings.length === 0 ? (
// //                       <div className="pp-empty">No pending openings in this range. Record an opening first (Full shift or Opening only).</div>
// //                     ) : (
// //                       <div className="pp-table-wrap">
// //                         <table className="pp-table">
// //                           <thead>
// //                             <tr>
// //                               <th>Date</th>
// //                               <th>Attendant</th>
// //                               <th>Nozzle No.</th>
// //                               <th style={{ textAlign: 'right' }}>Opening</th>
// //                               <th>Opening at</th>
// //                               <th>Action</th>
// //                             </tr>
// //                           </thead>
// //                           <tbody>
// //                             {pendingReadings.map((r) => (
// //                               <React.Fragment key={r.id}>
// //                                 <tr>
// //                                   <td>{typeof r.reading_date === 'string' ? r.reading_date.substring(0, 10) : String(r.reading_date)}</td>
// //                                   <td>{r.attendant_name}</td>
// //                                   <td>{r.nozzle_name}</td>
// //                                   <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Number(r.opening_reading).toFixed(2)}</td>
// //                                   <td style={{ fontSize: '0.875rem' }}>{formatDateTime(r.opening_at)}</td>
// //                                   <td style={{ textAlign: 'center' }}>
// //                                     {addingClosingForId === r.id ? (
// //                                       <span style={{ fontWeight: 600, color: '#64748b' }}>Selecting...</span>
// //                                     ) : (
// //                                       <button type="button" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px' }} onClick={() => openAddClosing(r)}>Add closing</button>
// //                                     )}
// //                                   </td>
// //                                 </tr>
// //                                 {addingClosingForId === r.id && (
// //                                   <tr>
// //                                     <td colSpan={6} style={{ padding: '16px', background: 'var(--pp-bg, #0a0f1a)', borderTop: 'none' }}>
// //                                       <div className="pp-inline-form" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', background: 'var(--pp-bg-elevated, #1a2330)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--pp-border, #2a3340)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
// //                                         <div style={{ flex: 1, minWidth: '150px' }}>
// //                                           <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--pp-text-primary, #eef2f8)' }}>Closing reading *</label>
// //                                           <input type="number" step="0.01" min="0" value={closingForm.closing_reading} onChange={(e) => setClosingForm({ ...closingForm, closing_reading: e.target.value })} placeholder="0" className="pp-input" autoFocus />
// //                                         </div>
// //                                         <div style={{ flex: 1, minWidth: '180px' }}>
// //                                           <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--pp-text-primary, #eef2f8)' }}>Closing at time</label>
// //                                           <DatePicker selected={closingForm.closing_at} onChange={(date) => setClosingForm({ ...closingForm, closing_at: date })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yyyy HH:mm" className="pp-input" style={{ width: '100%' }} />
// //                                         </div>
// //                                         <div style={{ display: 'flex', gap: '10px' }}>
// //                                           <button type="button" className="btn btn-primary" style={{ padding: '8px 16px', fontWeight: 600 }} onClick={() => handleSaveClosing(r)} disabled={submittingClosing}>{submittingClosing ? 'Saving…' : '✓ Save closing'}</button>
// //                                           <button type="button" className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={cancelAddClosing}>Cancel</button>
// //                                         </div>
// //                                       </div>
// //                                     </td>
// //                                   </tr>
// //                                 )}
// //                               </React.Fragment>
// //                             ))}
// //                           </tbody>
// //                         </table>
// //                       </div>
// //                     )}
// //                   </div>
// //                 )}
// //               </div>
// //               <div className="modal-footer">
// //                 <button type="button" className="btn btn-secondary" onClick={() => setShowRecordModal(false)}>Close</button>
// //               </div>
// //             </div>
// //           </div>
// //         )}
// //     </div>
// //   );
// // }

// // const NozzleReading = () => (
// //   <Layout>
// //     <NozzleReadingPanel embedded={false} />
// //   </Layout>
// // );

// // export default NozzleReading;







// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import Layout from '../components/Layout';
// import apiClient from '../config/axios';
// import config from '../config/config';
// import { useToast } from '../context/ToastContext';
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';
// import { getLocalDateString, getLocalISOString } from '../utils/dateUtils';
// import Pagination from '../components/Pagination';
// import PetrolNozzleLoader from '../components/PetrolNozzleLoader';
// import './Report.css';
// import './PetrolPump.css';
// import './Party.css';

// // Minimal Icons
// const Icon = ({ name, size = 14 }) => {
//   const icons = {
//     nozzle: <><path d="M4 22h16" /><path d="M18 4L8 14" /><path d="M6 12l4-4" /><circle cx="19" cy="5" r="2" /></>,
//     attendant: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
//     calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
//     plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
//     check: <polyline points="20 6 9 17 4 12" />,
//     close: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
//     refresh: <><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>,
//     filter: <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3" />
//   };
//   return (
//     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
//       {icons[name]}
//     </svg>
//   );
// };

// const formatDateTime = (s) => {
//   if (!s) return '—';
//   const d = new Date(s);
//   if (isNaN(d.getTime())) return s;
//   return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
// };

// const RECORD_MODES = [
//   { id: 'both', title: 'Full Shift', desc: 'Opening + closing', icon: 'check', color: '#22c55e' },
//   { id: 'opening_only', title: 'Opening Only', desc: 'Start shift', icon: 'plus', color: '#f59a30' },
//   { id: 'add_closing', title: 'Add Closing', desc: 'Complete shift', icon: 'refresh', color: '#3b82f6' }
// ];

// export function NozzleReadingPanel({ embedded = false }) {
//   const toast = useToast();
//   const [showModal, setShowModal] = useState(false);
//   const [recordMode, setRecordMode] = useState('both');
//   const [attendants, setAttendants] = useState([]);
//   const [nozzles, setNozzles] = useState([]);
//   const [form, setForm] = useState({
//     attendant_id: '', nozzle_id: '', reading_date: new Date(),
//     opening_reading: '', closing_reading: '',
//     opening_at: new Date(), closing_at: new Date()
//   });
//   const [submitting, setSubmitting] = useState(false);
//   const [readings, setReadings] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [filters, setFilters] = useState({ from: new Date(), to: new Date(), nozzle: '', attendant: '' });
//   const [page, setPage] = useState(1);
//   const [pagination, setPagination] = useState(null);
//   const [pendingReadings, setPendingReadings] = useState([]);
//   const [loadingPending, setLoadingPending] = useState(false);
//   const [addingClosing, setAddingClosing] = useState(null);
//   const [closingForm, setClosingForm] = useState({ reading: '', time: new Date() });
//   const [submittingClosing, setSubmittingClosing] = useState(false);
//   const [activeTab, setActiveTab] = useState('details'); // details, nozzle, attendant

//   useEffect(() => {
//     fetchMeta();
//     fetchReadings();
//   }, []);

//   useEffect(() => {
//     fetchReadings();
//   }, [filters, page]);

//   useEffect(() => {
//     if (showModal && recordMode === 'add_closing') fetchPendingReadings();
//   }, [showModal, recordMode, filters.from, filters.to]);

//   useEffect(() => {
//     if (!showModal || !form.nozzle_id || recordMode === 'add_closing') return;
//     const fetchLast = async () => {
//       try {
//         const res = await apiClient.get(`${config.api.nozzleReadings}/last/${form.nozzle_id}`);
//         if (res.data?.last_closing_reading !== '') {
//           setForm(prev => ({ ...prev, opening_reading: res.data.last_closing_reading }));
//         }
//       } catch (err) {}
//     };
//     fetchLast();
//   }, [form.nozzle_id, showModal, recordMode]);

//   const fetchMeta = async () => {
//     try {
//       const [attRes, nozRes] = await Promise.all([
//         apiClient.get(config.api.attendants),
//         apiClient.get(config.api.nozzles)
//       ]);
//       setAttendants(attRes.data.attendants || []);
//       setNozzles(nozRes.data.nozzles || []);
//     } catch (e) {
//       toast.error('Failed to load data');
//     }
//   };

//   const fetchReadings = async () => {
//     setLoading(true);
//     try {
//       const params = {
//         from_date: getLocalDateString(filters.from),
//         to_date: getLocalDateString(filters.to),
//         page, limit: 50
//       };
//       if (filters.nozzle) params.nozzle_id = filters.nozzle;
//       if (filters.attendant) params.attendant_id = filters.attendant;
//       const res = await apiClient.get(config.api.nozzleReadings, { params });
//       setReadings(res.data.readings || []);
//       setPagination(res.data.pagination);
//     } catch (e) {
//       toast.error('Failed to load readings');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchPendingReadings = async () => {
//     setLoadingPending(true);
//     try {
//       const res = await apiClient.get(config.api.nozzleReadings, {
//         params: {
//           from_date: getLocalDateString(filters.from),
//           to_date: getLocalDateString(filters.to),
//           pending_closing: '1',
//           limit: 200
//         }
//       });
//       setPendingReadings(res.data.readings || []);
//     } catch (e) {
//       toast.error('Failed to load pending');
//     } finally {
//       setLoadingPending(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.attendant_id || !form.nozzle_id) {
//       toast.error('Select attendant and nozzle');
//       return;
//     }

//     const payload = {
//       attendant_id: form.attendant_id,
//       nozzle_id: form.nozzle_id,
//       reading_date: getLocalDateString(form.reading_date),
//       opening_at: getLocalISOString(form.opening_at),
//       closing_at: getLocalISOString(form.closing_at)
//     };

//     if (recordMode === 'both') {
//       const open = parseFloat(form.opening_reading);
//       const close = parseFloat(form.closing_reading);
//       if (isNaN(open) || isNaN(close) || open < 0 || close < 0) {
//         toast.error('Valid readings required');
//         return;
//       }
//       if (close <= open) {
//         toast.error('Closing must be greater than opening');
//         return;
//       }
//       payload.opening_reading = open;
//       payload.closing_reading = close;
//     } else {
//       const open = parseFloat(form.opening_reading);
//       if (isNaN(open) || open < 0) {
//         toast.error('Valid opening reading required');
//         return;
//       }
//       payload.opening_reading = open;
//     }

//     setSubmitting(true);
//     try {
//       await apiClient.post(config.api.nozzleReadings, payload);
//       toast.success(recordMode === 'both' ? 'Reading saved' : 'Opening saved');
//       setForm({ ...form, opening_reading: '', closing_reading: '' });
//       fetchReadings();
//       setShowModal(false);
//     } catch (err) {
//       toast.error(err.response?.data?.error || 'Failed to save');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleAddClosing = async (reading) => {
//     const close = parseFloat(closingForm.reading);
//     if (isNaN(close) || close <= 0) {
//       toast.error('Valid closing reading required');
//       return;
//     }
//     if (close <= Number(reading.opening_reading)) {
//       toast.error('Closing must be greater than opening');
//       return;
//     }

//     setSubmittingClosing(true);
//     try {
//       await apiClient.post(config.api.nozzleReadings, {
//         id: reading.id,
//         attendant_id: reading.attendant_id,
//         nozzle_id: reading.nozzle_id,
//         reading_date: reading.reading_date?.substring(0, 10) || getLocalDateString(reading.reading_date),
//         closing_reading: close,
//         closing_at: getLocalISOString(closingForm.time)
//       });
//       toast.success('Closing recorded');
//       setAddingClosing(null);
//       setClosingForm({ reading: '', time: new Date() });
//       fetchPendingReadings();
//       fetchReadings();
//       setShowModal(false);
//     } catch (err) {
//       toast.error(err.response?.data?.error || 'Failed to save');
//     } finally {
//       setSubmittingClosing(false);
//     }
//   };

//   const summaries = useMemo(() => {
//     const nozzleMap = new Map();
//     const attendantMap = new Map();
//     readings.forEach(r => {
//       if (r.sale_quantity != null && !isNaN(r.sale_quantity)) {
//         nozzleMap.set(r.nozzle_name, (nozzleMap.get(r.nozzle_name) || 0) + r.sale_quantity);
//         attendantMap.set(r.attendant_name, (attendantMap.get(r.attendant_name) || 0) + r.sale_quantity);
//       }
//     });
//     return {
//       nozzle: Array.from(nozzleMap.entries()).sort((a, b) => b[1] - a[1]),
//       attendant: Array.from(attendantMap.entries()).sort((a, b) => b[1] - a[1])
//     };
//   }, [readings]);

//   return (
//     <div style={{ padding: '8px 12px', maxWidth: '1400px', margin: '0 auto' }}>
//       {/* Header */}
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
//         <div>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//             <Icon name="nozzle" size={18} />
//             <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#fff' }}>Nozzle Readings</h1>
//           </div>
//           <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '2px 0 0 0' }}>Daily shift readings & sales summary</p>
//         </div>
//         <button onClick={() => { setShowModal(true); setRecordMode('both'); }} style={{ padding: '6px 14px', background: '#f59a30', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
//           <Icon name="plus" size={12} /> Record
//         </button>
//       </div>

//       {/* Filters - Compact */}
//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '12px', background: '#0f151f', padding: '8px', borderRadius: '8px' }}>
//         <div>
//           <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>From</label>
//           <DatePicker selected={filters.from} onChange={d => setFilters({ ...filters, from: d })} dateFormat="dd-MM-yy" className="pp-input" style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }} />
//         </div>
//         <div>
//           <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>To</label>
//           <DatePicker selected={filters.to} onChange={d => setFilters({ ...filters, to: d })} dateFormat="dd-MM-yy" className="pp-input" style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }} />
//         </div>
//         <div>
//           <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Nozzle</label>
//           <select value={filters.nozzle} onChange={e => { setFilters({ ...filters, nozzle: e.target.value }); setPage(1); }} style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #2a3340', background: '#0f151f', color: '#fff' }}>
//             <option value="">All</option>
//             {nozzles.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
//           </select>
//         </div>
//         <div>
//           <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Attendant</label>
//           <select value={filters.attendant} onChange={e => { setFilters({ ...filters, attendant: e.target.value }); setPage(1); }} style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #2a3340', background: '#0f151f', color: '#fff' }}>
//             <option value="">All</option>
//             {attendants.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
//           </select>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', borderBottom: '1px solid #2a3340' }}>
//         {[
//           { id: 'details', label: 'All Readings', icon: 'nozzle' },
//           { id: 'nozzle', label: 'By Nozzle', icon: 'filter' },
//           { id: 'attendant', label: 'By Attendant', icon: 'attendant' }
//         ].map(tab => (
//           <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
//             padding: '6px 12px', fontSize: '11px', fontWeight: 500, background: 'transparent', border: 'none',
//             color: activeTab === tab.id ? '#f59a30' : '#94a3b8', borderBottom: activeTab === tab.id ? '2px solid #f59a30' : 'none', cursor: 'pointer'
//           }}>
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       {/* Content */}
//       {loading ? (
//         <div style={{ textAlign: 'center', padding: '40px' }}><PetrolNozzleLoader size="small" /></div>
//       ) : (
//         <>
//           {activeTab === 'details' && (
//             <>
//               <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid #2a3340' }}>
//                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
//                   <thead>
//                     <tr style={{ background: '#0f151f' }}>
//                       <th style={{ padding: '6px 6px', textAlign: 'left' }}>Date</th>
//                       <th style={{ padding: '6px 6px', textAlign: 'left' }}>Attendant</th>
//                       <th style={{ padding: '6px 6px', textAlign: 'left' }}>Nozzle</th>
//                       <th style={{ padding: '6px 6px', textAlign: 'right' }}>Opening</th>
//                       <th style={{ padding: '6px 6px', textAlign: 'left' }}>Open Time</th>
//                       <th style={{ padding: '6px 6px', textAlign: 'right' }}>Closing</th>
//                       <th style={{ padding: '6px 6px', textAlign: 'left' }}>Close Time</th>
//                       <th style={{ padding: '6px 6px', textAlign: 'right' }}>Sale (Ltrs)</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {readings.length === 0 ? (
//                       <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#6c7f8f' }}>No readings found</td></tr>
//                     ) : (
//                       readings.map(r => (
//                         <tr key={r.id} style={{ borderBottom: '1px solid #2a3340' }}>
//                           <td style={{ padding: '6px 6px' }}>{r.reading_date?.substring(0, 10)}</td>
//                           <td style={{ padding: '6px 6px' }}>{r.attendant_name}</td>
//                           <td style={{ padding: '6px 6px' }}>{r.nozzle_name}</td>
//                           <td style={{ padding: '6px 6px', textAlign: 'right' }}>{Number(r.opening_reading).toFixed(2)}</td>
//                           <td style={{ padding: '6px 6px', fontSize: '10px' }}>{formatDateTime(r.opening_at)}</td>
//                           <td style={{ padding: '6px 6px', textAlign: 'right' }}>
//                             {r.closing_reading != null ? Number(r.closing_reading).toFixed(2) : <span style={{ color: '#f59a30', fontSize: '9px', background: '#f59a3020', padding: '2px 6px', borderRadius: '10px' }}>Active</span>}
//                           </td>
//                           <td style={{ padding: '6px 6px', fontSize: '10px' }}>{formatDateTime(r.closing_at)}</td>
//                           <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 600, color: '#22c55e' }}>{r.sale_quantity != null ? Number(r.sale_quantity).toFixed(2) : '—'}</td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//               {pagination && pagination.totalPages > 1 && (
//                 <div style={{ marginTop: '12px' }}>
//                   <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} totalRecords={pagination.totalRecords} showTotalRecords />
//                 </div>
//               )}
//             </>
//           )}

//           {activeTab === 'nozzle' && (
//             <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid #2a3340', maxWidth: '400px' }}>
//               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
//                 <thead>
//                   <tr style={{ background: '#0f151f' }}><th style={{ padding: '8px 10px' }}>Nozzle</th><th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Sale (Ltrs)</th></tr>
//                 </thead>
//                 <tbody>
//                   {summaries.nozzle.length === 0 ? (
//                     <tr><td colSpan={2} style={{ textAlign: 'center', padding: '30px', color: '#6c7f8f' }}>No sales data</td></tr>
//                   ) : (
//                     summaries.nozzle.map(([name, total]) => (
//                       <tr key={name} style={{ borderBottom: '1px solid #2a3340' }}>
//                         <td style={{ padding: '6px 10px', fontWeight: 500 }}>{name}</td>
//                         <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: '#3b82f6' }}>{total.toFixed(2)}</td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}

//           {activeTab === 'attendant' && (
//             <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid #2a3340', maxWidth: '400px' }}>
//               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
//                 <thead>
//                   <tr style={{ background: '#0f151f' }}><th style={{ padding: '8px 10px' }}>Attendant</th><th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Sale (Ltrs)</th></tr>
//                 </thead>
//                 <tbody>
//                   {summaries.attendant.length === 0 ? (
//                     <tr><td colSpan={2} style={{ textAlign: 'center', padding: '30px', color: '#6c7f8f' }}>No sales data</td></tr>
//                   ) : (
//                     summaries.attendant.map(([name, total]) => (
//                       <tr key={name} style={{ borderBottom: '1px solid #2a3340' }}>
//                         <td style={{ padding: '6px 10px', fontWeight: 500 }}>{name}</td>
//                         <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: '#22c55e' }}>{total.toFixed(2)}</td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </>
//       )}

//       {/* Record Modal */}
//       {showModal && (
//         <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
//           <div style={{ background: '#141b26', borderRadius: '10px', width: '100%', maxWidth: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', border: '1px solid #2a3340' }}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #2a3340' }}>
//               <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Record Nozzle Reading</h3>
//               <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Icon name="close" size={14} /></button>
//             </div>
//             <div style={{ padding: '14px', overflowY: 'auto', flex: 1 }}>
//               {/* Mode Selector */}
//               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
//                 {RECORD_MODES.map(m => (
//                   <button key={m.id} onClick={() => setRecordMode(m.id)} style={{
//                     padding: '8px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer',
//                     background: recordMode === m.id ? `${m.color}20` : '#0f151f',
//                     border: recordMode === m.id ? `1px solid ${m.color}` : '1px solid #2a3340'
//                   }}>
//                     <div style={{ fontWeight: 600, fontSize: '12px', color: recordMode === m.id ? m.color : '#fff' }}>{m.title}</div>
//                     <div style={{ fontSize: '10px', color: '#94a3b8' }}>{m.desc}</div>
//                   </button>
//                 ))}
//               </div>

//               {/* Both Mode */}
//               {recordMode === 'both' && (
//                 <form onSubmit={handleSubmit}>
//                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
//                     <select value={form.attendant_id} onChange={e => setForm({ ...form, attendant_id: e.target.value })} required style={inputStyle}>
//                       <option value="">Attendant *</option>
//                       {attendants.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
//                     </select>
//                     <select value={form.nozzle_id} onChange={e => setForm({ ...form, nozzle_id: e.target.value })} required style={inputStyle}>
//                       <option value="">Nozzle *</option>
//                       {nozzles.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
//                     </select>
//                     <DatePicker selected={form.reading_date} onChange={d => setForm({ ...form, reading_date: d })} dateFormat="dd-MM-yy" className="pp-input" style={inputStyle} placeholderText="Date" />
//                     <input type="number" step="0.01" placeholder="Opening Reading *" value={form.opening_reading} onChange={e => setForm({ ...form, opening_reading: e.target.value })} style={inputStyle} />
//                     <DatePicker selected={form.opening_at} onChange={d => setForm({ ...form, opening_at: d })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yy HH:mm" className="pp-input" style={inputStyle} placeholderText="Opening Time" />
//                     <input type="number" step="0.01" placeholder="Closing Reading *" value={form.closing_reading} onChange={e => setForm({ ...form, closing_reading: e.target.value })} style={inputStyle} />
//                     <DatePicker selected={form.closing_at} onChange={d => setForm({ ...form, closing_at: d })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yy HH:mm" className="pp-input" style={inputStyle} placeholderText="Closing Time" />
//                   </div>
//                   <button type="submit" disabled={submitting} style={{ ...btnStyle, marginTop: '12px', width: '100%' }}>{submitting ? 'Saving...' : 'Save Reading'}</button>
//                 </form>
//               )}

//               {/* Opening Only Mode */}
//               {recordMode === 'opening_only' && (
//                 <form onSubmit={handleSubmit}>
//                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
//                     <select value={form.attendant_id} onChange={e => setForm({ ...form, attendant_id: e.target.value })} required style={inputStyle}>
//                       <option value="">Attendant *</option>
//                       {attendants.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
//                     </select>
//                     <select value={form.nozzle_id} onChange={e => setForm({ ...form, nozzle_id: e.target.value })} required style={inputStyle}>
//                       <option value="">Nozzle *</option>
//                       {nozzles.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
//                     </select>
//                     <DatePicker selected={form.reading_date} onChange={d => setForm({ ...form, reading_date: d })} dateFormat="dd-MM-yy" className="pp-input" style={inputStyle} placeholderText="Date" />
//                     <input type="number" step="0.01" placeholder="Opening Reading *" value={form.opening_reading} onChange={e => setForm({ ...form, opening_reading: e.target.value })} style={inputStyle} />
//                     <DatePicker selected={form.opening_at} onChange={d => setForm({ ...form, opening_at: d })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yy HH:mm" className="pp-input" style={inputStyle} placeholderText="Opening Time" />
//                   </div>
//                   <button type="submit" disabled={submitting} style={{ ...btnStyle, marginTop: '12px', width: '100%' }}>{submitting ? 'Saving...' : 'Save Opening'}</button>
//                 </form>
//               )}

//               {/* Add Closing Mode */}
//               {recordMode === 'add_closing' && (
//                 <div>
//                   <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
//                     <DatePicker selected={filters.from} onChange={d => setFilters({ ...filters, from: d })} dateFormat="dd-MM-yy" className="pp-input" style={{ flex: 1 }} />
//                     <DatePicker selected={filters.to} onChange={d => setFilters({ ...filters, to: d })} dateFormat="dd-MM-yy" className="pp-input" style={{ flex: 1 }} />
//                     <button onClick={fetchPendingReadings} style={{ padding: '4px 12px', background: '#3b82f6', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Refresh</button>
//                   </div>
//                   {loadingPending ? (
//                     <div style={{ textAlign: 'center', padding: '20px' }}><PetrolNozzleLoader size="small" /></div>
//                   ) : pendingReadings.length === 0 ? (
//                     <div style={{ textAlign: 'center', padding: '30px', color: '#6c7f8f', fontSize: '12px' }}>No pending shifts found</div>
//                   ) : (
//                     <div style={{ overflowX: 'auto' }}>
//                       <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
//                         <thead><tr style={{ background: '#0f151f' }}>
//                           <th style={{ padding: '6px' }}>Date</th><th>Attendant</th><th>Nozzle</th><th style={{ textAlign: 'right' }}>Opening</th><th>Open Time</th><th style={{ width: '100px' }}>Action</th>
//                         </tr></thead>
//                         <tbody>
//                           {pendingReadings.map(r => (
//                             <React.Fragment key={r.id}>
//                               <tr style={{ borderBottom: '1px solid #2a3340' }}>
//                                 <td style={{ padding: '6px' }}>{r.reading_date?.substring(0, 10)}</td>
//                                 <td>{r.attendant_name}</td>
//                                 <td>{r.nozzle_name}</td>
//                                 <td style={{ textAlign: 'right' }}>{Number(r.opening_reading).toFixed(2)}</td>
//                                 <td style={{ fontSize: '10px' }}>{formatDateTime(r.opening_at)}</td>
//                                 <td>
//                                   {addingClosing === r.id ? (
//                                     <span style={{ color: '#f59a30', fontSize: '10px' }}>Adding...</span>
//                                   ) : (
//                                     <button onClick={() => setAddingClosing(r.id)} style={{ padding: '2px 8px', fontSize: '10px', background: '#f59a30', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Add Closing</button>
//                                   )}
//                                 </td>
//                               </tr>
//                               {addingClosing === r.id && (
//                                 <tr><td colSpan={6} style={{ padding: '10px', background: '#0f151f' }}>
//                                   <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
//                                     <input type="number" step="0.01" placeholder="Closing Reading *" value={closingForm.reading} onChange={e => setClosingForm({ ...closingForm, reading: e.target.value })} style={{ ...inputStyle, width: '150px' }} autoFocus />
//                                     <DatePicker selected={closingForm.time} onChange={d => setClosingForm({ ...closingForm, time: d })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yy HH:mm" className="pp-input" style={{ ...inputStyle, width: '160px' }} />
//                                     <button onClick={() => handleAddClosing(r)} disabled={submittingClosing} style={{ ...btnStyle, padding: '4px 12px' }}>{submittingClosing ? '...' : 'Save'}</button>
//                                     <button onClick={() => { setAddingClosing(null); setClosingForm({ reading: '', time: new Date() }); }} style={{ padding: '4px 12px', background: 'transparent', border: '1px solid #2a3340', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}>Cancel</button>
//                                   </div>
//                                 </td></tr>
//                               )}
//                             </React.Fragment>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//             <div style={{ padding: '10px 14px', borderTop: '1px solid #2a3340', display: 'flex', justifyContent: 'flex-end' }}>
//               <button onClick={() => setShowModal(false)} style={{ padding: '5px 12px', fontSize: '11px', background: 'transparent', border: '1px solid #2a3340', borderRadius: '4px', cursor: 'pointer', color: '#94a3b8' }}>Close</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// const inputStyle = {
//   padding: '6px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #2a3340',
//   background: '#0f151f', color: '#fff', width: '100%', boxSizing: 'border-box'
// };

// const btnStyle = {
//   padding: '6px 12px', fontSize: '11px', fontWeight: 500, background: '#f59a30',
//   border: 'none', borderRadius: '4px', cursor: 'pointer'
// };

// const NozzleReading = () => (
//   <Layout>
//     <NozzleReadingPanel embedded={false} />
//   </Layout>
// );

// export default NozzleReading;



import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import { useToast } from '../context/ToastContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getLocalDateString, getLocalISOString, formatInIndiaTime, parseMysqlDatetimeIST } from '../utils/dateUtils';
import Pagination from '../components/Pagination';
import PetrolNozzleLoader from '../components/PetrolNozzleLoader';
import TransactionLoader from '../components/TransactionLoader';
import * as XLSX from 'xlsx';
import './Report.css';
import './PetrolPump.css';
import './Party.css';

// Minimal Icons
const Icon = ({ name, size = 14 }) => {
  const icons = {
    nozzle: <><path d="M4 22h16" /><path d="M18 4L8 14" /><path d="M6 12l4-4" /><circle cx="19" cy="5" r="2" /></>,
    attendant: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    close: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    refresh: <><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>,
    filter: <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3" />,
    fuel: <><path d="M3 22h18" /><path d="M6 18h12" /><path d="M7 10h10" /><path d="M12 2v6" /><path d="M9 5l3-3 3 3" /></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      {icons[name]}
    </svg>
  );
};

const formatDateTime = (s) => {
  if (!s) return '—';
  const d = parseMysqlDatetimeIST(s);
  if (!d || Number.isNaN(d.getTime())) return '—';
  return formatInIndiaTime(d);
};

const daysInclusive = (from, to) => {
  if (!from || !to) return 1;
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  const ms = b - a;
  return Math.max(1, Math.floor(ms / 86400000) + 1);
};

const RECORD_MODES = [
  { id: 'both', title: 'Full Shift', desc: 'Opening + closing', color: '#22c55e' },
  { id: 'opening_only', title: 'Opening Only', desc: 'Start shift', color: '#f59a30' },
  { id: 'add_closing', title: 'Add Closing', desc: 'Complete shift', color: '#3b82f6' }
];

export function NozzleReadingPanel({ embedded = false }) {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [recordMode, setRecordMode] = useState('both');
  const [attendants, setAttendants] = useState([]);
  const [nozzles, setNozzles] = useState([]);
  const [form, setForm] = useState({
    attendant_id: '', nozzle_id: '', reading_date: new Date(),
    opening_reading: '', closing_reading: '',
    opening_at: new Date(), closing_at: new Date()
  });
  const [submitting, setSubmitting] = useState(false);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ from: new Date(), to: new Date(), nozzle: '', attendant: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [periodSummary, setPeriodSummary] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [pendingReadings, setPendingReadings] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [addingClosing, setAddingClosing] = useState(null);
  const [closingForm, setClosingForm] = useState({ reading: '', time: new Date() });
  const [submittingClosing, setSubmittingClosing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const rangeDayCount = useMemo(() => daysInclusive(filters.from, filters.to), [filters.from, filters.to]);

  const panelBusy =
    loading || submitting || loadingPending || submittingClosing || exporting;

  useEffect(() => {
    fetchMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReadingsAndSummary = useCallback(async () => {
    setLoading(true);
    try {
      const listParams = {
        from_date: getLocalDateString(filters.from),
        to_date: getLocalDateString(filters.to),
        page,
        limit: 50
      };
      if (filters.nozzle) listParams.nozzle_id = filters.nozzle;
      if (filters.attendant) listParams.attendant_id = filters.attendant;
      const sumParams = {
        from_date: getLocalDateString(filters.from),
        to_date: getLocalDateString(filters.to)
      };
      if (filters.nozzle) sumParams.nozzle_id = filters.nozzle;
      if (filters.attendant) sumParams.attendant_id = filters.attendant;
      const [resList, resSum] = await Promise.all([
        apiClient.get(config.api.nozzleReadings, { params: listParams }),
        apiClient.get(`${config.api.nozzleReadings}/summary`, { params: sumParams })
      ]);
      setReadings(resList.data.readings || []);
      setPagination(resList.data.pagination);
      setPeriodSummary(resSum.data);
    } catch (e) {
      setPeriodSummary(null);
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load readings');
    } finally {
      setLoading(false);
    }
  }, [filters, page, toast]);

  useEffect(() => {
    fetchReadingsAndSummary();
  }, [fetchReadingsAndSummary]);

  useEffect(() => {
    if (showModal && recordMode === 'add_closing') fetchPendingReadings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, recordMode, filters.from, filters.to]);

  useEffect(() => {
    if (!showModal || !form.nozzle_id || recordMode === 'add_closing') return;
    const fetchLast = async () => {
      try {
        const res = await apiClient.get(`${config.api.nozzleReadings}/last/${form.nozzle_id}`);
        if (res.data?.last_closing_reading !== '') {
          setForm(prev => ({ ...prev, opening_reading: res.data.last_closing_reading }));
        }
      } catch (err) {}
    };
    fetchLast();
  }, [form.nozzle_id, showModal, recordMode]);

  const fetchMeta = async () => {
    try {
      const [attRes, nozRes] = await Promise.all([
        apiClient.get(config.api.attendants),
        apiClient.get(config.api.nozzles)
      ]);
      setAttendants(attRes.data.attendants || []);
      setNozzles(nozRes.data.nozzles || []);
    } catch (e) {
      toast.error('Failed to load data');
    }
  };

  const applyDatePreset = (preset) => {
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    let start = new Date(end);
    if (preset === 'today') {
      start = end;
    } else if (preset === '7d') {
      start.setDate(start.getDate() - 6);
    } else if (preset === '30d') {
      start.setDate(start.getDate() - 29);
    } else if (preset === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    setFilters((f) => ({ ...f, from: start, to: end }));
    setPage(1);
  };

  const exportReadingsToExcel = async () => {
    setExporting(true);
    try {
      const params = {
        from_date: getLocalDateString(filters.from),
        to_date: getLocalDateString(filters.to),
        page: 1,
        limit: 5000
      };
      if (filters.nozzle) params.nozzle_id = filters.nozzle;
      if (filters.attendant) params.attendant_id = filters.attendant;
      const res = await apiClient.get(config.api.nozzleReadings, { params });
      const rows = res.data.readings || [];
      if (rows.length === 0) {
        toast.error('No rows to export for this range');
        return;
      }
      const sheetRows = rows.map((r) => ({
        Date: r.reading_date?.substring(0, 10) ?? '',
        Attendant: r.attendant_name ?? '',
        Nozzle: r.nozzle_name ?? '',
        Opening: r.opening_reading != null ? Number(r.opening_reading) : '',
        Open_time: r.opening_at ?? '',
        Closing: r.closing_reading != null ? Number(r.closing_reading) : '',
        Close_time: r.closing_at ?? '',
        Sale_Ltrs: r.sale_quantity != null ? Number(r.sale_quantity) : '',
        Status: r.closing_reading != null ? 'Closed' : 'Active'
      }));
      const ws = XLSX.utils.json_to_sheet(sheetRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Nozzle readings');
      const fname = `nozzle-readings_${getLocalDateString(filters.from)}_${getLocalDateString(filters.to)}.xlsx`;
      XLSX.writeFile(wb, fname);
      toast.success(`Exported ${rows.length} row(s)`);
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const fetchPendingReadings = async () => {
    setLoadingPending(true);
    try {
      const res = await apiClient.get(config.api.nozzleReadings, {
        params: {
          from_date: getLocalDateString(filters.from),
          to_date: getLocalDateString(filters.to),
          pending_closing: '1',
          limit: 200
        }
      });
      setPendingReadings(res.data.readings || []);
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load pending');
    } finally {
      setLoadingPending(false);
    }
  };

  // Calculate summaries safely
  const summaries = useMemo(() => {
    const nozzleMap = new Map();
    const attendantMap = new Map();
    let totalSales = 0;
    
    readings.forEach(r => {
      if (r.sale_quantity != null && !isNaN(parseFloat(r.sale_quantity))) {
        const qty = parseFloat(r.sale_quantity);
        totalSales += qty;
        
        if (r.nozzle_name) {
          nozzleMap.set(r.nozzle_name, (nozzleMap.get(r.nozzle_name) || 0) + qty);
        }
        if (r.attendant_name) {
          attendantMap.set(r.attendant_name, (attendantMap.get(r.attendant_name) || 0) + qty);
        }
      }
    });
    
    return {
      totalSales: totalSales,
      nozzle: Array.from(nozzleMap.entries()).map(([name, total]) => ({ name, total: typeof total === 'number' ? total : 0 })).sort((a, b) => b.total - a.total),
      attendant: Array.from(attendantMap.entries()).map(([name, total]) => ({ name, total: typeof total === 'number' ? total : 0 })).sort((a, b) => b.total - a.total)
    };
  }, [readings]);

  const displayTotals = useMemo(() => {
    if (periodSummary) {
      return {
        totalSales: periodSummary.total_sale_liters ?? 0,
        nozzle: periodSummary.by_nozzle || [],
        attendant: periodSummary.by_attendant || [],
        completedShifts: periodSummary.completed_shifts ?? 0,
        pendingShifts: periodSummary.pending_shifts ?? 0,
        totalShifts: periodSummary.total_shifts ?? 0
      };
    }
    return {
      totalSales: summaries.totalSales,
      nozzle: summaries.nozzle,
      attendant: summaries.attendant,
      completedShifts: readings.filter((r) => r.closing_reading != null).length,
      pendingShifts: readings.filter((r) => r.closing_reading == null).length,
      totalShifts: readings.length
    };
  }, [periodSummary, summaries, readings]);

  const avgDailyLiters = displayTotals.totalSales / rangeDayCount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.attendant_id || !form.nozzle_id) {
      toast.error('Select attendant and nozzle');
      return;
    }

    const payload = {
      attendant_id: form.attendant_id,
      nozzle_id: form.nozzle_id,
      reading_date: getLocalDateString(form.reading_date),
      opening_at: getLocalISOString(form.opening_at),
      closing_at: getLocalISOString(form.closing_at)
    };

    if (recordMode === 'both') {
      const open = parseFloat(form.opening_reading);
      const close = parseFloat(form.closing_reading);
      if (isNaN(open) || isNaN(close) || open < 0 || close < 0) {
        toast.error('Valid readings required');
        return;
      }
      if (close <= open) {
        toast.error('Closing must be greater than opening');
        return;
      }
      payload.opening_reading = open;
      payload.closing_reading = close;
    } else {
      const open = parseFloat(form.opening_reading);
      if (isNaN(open) || open < 0) {
        toast.error('Valid opening reading required');
        return;
      }
      payload.opening_reading = open;
    }

    setSubmitting(true);
    try {
      await apiClient.post(config.api.nozzleReadings, payload);
      toast.success(recordMode === 'both' ? 'Reading saved' : 'Opening saved');
      setForm({ ...form, opening_reading: '', closing_reading: '' });
      fetchReadingsAndSummary();
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddClosing = async (reading) => {
    const close = parseFloat(closingForm.reading);
    if (isNaN(close) || close <= 0) {
      toast.error('Valid closing reading required');
      return;
    }
    if (close <= Number(reading.opening_reading)) {
      toast.error('Closing must be greater than opening');
      return;
    }

    setSubmittingClosing(true);
    try {
      await apiClient.post(config.api.nozzleReadings, {
        id: reading.id,
        attendant_id: reading.attendant_id,
        nozzle_id: reading.nozzle_id,
        reading_date: reading.reading_date?.substring(0, 10) || getLocalDateString(reading.reading_date),
        closing_reading: close,
        closing_at: getLocalISOString(closingForm.time)
      });
      toast.success('Closing recorded');
      setAddingClosing(null);
      setClosingForm({ reading: '', time: new Date() });
      fetchPendingReadings();
      fetchReadingsAndSummary();
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to save');
    } finally {
      setSubmittingClosing(false);
    }
  };

  return (
    <>
      <TransactionLoader
        isLoading={panelBusy}
        message={
          submitting
            ? 'Saving reading…'
            : submittingClosing
              ? 'Saving closing…'
              : exporting
                ? 'Exporting…'
                : loadingPending
                  ? 'Loading pending…'
                  : loading
                    ? 'Loading readings…'
                    : undefined
        }
        type="transaction"
      />
    <div style={{ padding: '8px 12px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="nozzle" size={18} />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#fff' }}>Nozzle Readings</h1>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '2px 0 0 0' }}>Daily shift readings & sales summary</p>
        </div>
        <button type="button" onClick={() => { setShowModal(true); setRecordMode('both'); }} disabled={panelBusy} style={{ padding: '6px 14px', background: '#f59a30', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 500, cursor: panelBusy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: panelBusy ? 0.65 : 1 }}>
          <Icon name="plus" size={12} /> Record
        </button>
      </div>

      {/* High Level Info Cards - Professional & Compact */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '12px' }}>
        {/* Total Sales Card */}
        <div style={{ background: 'linear-gradient(135deg, #1e2a3a 0%, #0f151f 100%)', borderRadius: '8px', padding: '10px 12px', border: '1px solid #2a3340', borderLeft: `3px solid #22c55e` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sales</span>
            <Icon name="fuel" size={16} style={{ color: '#22c55e' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{displayTotals.totalSales.toFixed(2)} <span style={{ fontSize: '12px', color: '#94a3b8' }}>Ltrs</span></div>
          <div style={{ fontSize: '10px', color: '#6c7f8f', marginTop: '4px', textAlign: 'center' }}>
            Avg {avgDailyLiters.toFixed(2)} L/day · {rangeDayCount} day(s) · <strong style={{ color: '#22c55e' }}>{displayTotals.completedShifts} done</strong> / <strong style={{ color: '#f59a30' }}>{displayTotals.pendingShifts} pending</strong> · {displayTotals.totalShifts} shifts
          </div>
          <div style={{ fontSize: '10px', color: '#6c7f8f', marginTop: '2px' }}>Period: {getLocalDateString(filters.from)} — {getLocalDateString(filters.to)}</div>
        </div>

        {/* Top Nozzle Card */}
        <div style={{ background: 'linear-gradient(135deg, #1e2a3a 0%, #0f151f 100%)', borderRadius: '8px', padding: '10px 12px', border: '1px solid #2a3340', borderLeft: `3px solid #f59a30` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Nozzle</span>
            <Icon name="nozzle" size={16} style={{ color: '#f59a30' }} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
            {displayTotals.nozzle[0] ? displayTotals.nozzle[0].name : '—'}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59a30', marginTop: '4px' }}>
            {displayTotals.nozzle[0] ? `${displayTotals.nozzle[0].total.toFixed(2)} Ltrs` : '0 Ltrs'}
          </div>
        </div>

        {/* Top Attendant Card */}
        <div style={{ background: 'linear-gradient(135deg, #1e2a3a 0%, #0f151f 100%)', borderRadius: '8px', padding: '10px 12px', border: '1px solid #2a3340', borderLeft: `3px solid #3b82f6` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Attendant</span>
            <Icon name="attendant" size={16} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
            {displayTotals.attendant[0] ? displayTotals.attendant[0].name : '—'}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6', marginTop: '4px' }}>
            {displayTotals.attendant[0] ? `${displayTotals.attendant[0].total.toFixed(2)} Ltrs` : '0 Ltrs'}
          </div>
        </div>

        {/* Active Shifts Card */}
        <div style={{ background: 'linear-gradient(135deg, #1e2a3a 0%, #0f151f 100%)', borderRadius: '8px', padding: '10px 12px', border: '1px solid #2a3340', borderLeft: `3px solid #e8593c` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Shifts</span>
            <Icon name="refresh" size={16} style={{ color: '#e8593c' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#e8593c', textAlign: 'center' }}>
            {displayTotals.pendingShifts}
          </div>
          <div style={{ fontSize: '10px', color: '#6c7f8f', marginTop: '4px', textAlign: 'center' }}>Pending (no closing yet)</div>
        </div>
      </div>

      {/* Nozzle-wise Sales Summary - Compact Cards */}
      {displayTotals.nozzle.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Icon name="nozzle" size={12} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Nozzle-wise Sales (full period)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px' }}>
            {displayTotals.nozzle.slice(0, 8).map((item, idx) => (
              <div key={idx} style={{ background: '#0f151f', borderRadius: '6px', padding: '6px 10px', border: '1px solid #2a3340', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#fff' }}>{item.name}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59a30' }}>{item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters - Compact */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginBottom: '8px', background: '#0f151f', padding: '8px', borderRadius: '8px' }}>
        <div>
          <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>From</label>
          <DatePicker selected={filters.from} onChange={d => { if (d) { setFilters({ ...filters, from: d }); setPage(1); } }} dateFormat="dd-MM-yy" className="pp-input" style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }} />
        </div>
        <div>
          <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>To</label>
          <DatePicker selected={filters.to} onChange={d => { if (d) { setFilters({ ...filters, to: d }); setPage(1); } }} dateFormat="dd-MM-yy" className="pp-input" style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }} />
        </div>
        <div>
          <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Nozzle</label>
          <select value={filters.nozzle} onChange={e => { setFilters({ ...filters, nozzle: e.target.value }); setPage(1); }} style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #2a3340', background: '#0f151f', color: '#fff' }}>
            <option value="">All</option>
            {nozzles.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Attendant</label>
          <select value={filters.attendant} onChange={e => { setFilters({ ...filters, attendant: e.target.value }); setPage(1); }} style={{ width: '100%', padding: '4px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #2a3340', background: '#0f151f', color: '#fff' }}>
            <option value="">All</option>
            {attendants.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        <span style={{ fontSize: '10px', color: '#64748b', marginRight: '4px' }}>Quick range:</span>
        {[
          { id: 'today', label: 'Today' },
          { id: '7d', label: '7 days' },
          { id: '30d', label: '30 days' },
          { id: 'month', label: 'This month' }
        ].map((p) => (
          <button key={p.id} type="button" onClick={() => applyDatePreset(p.id)} style={{ padding: '4px 10px', fontSize: '10px', borderRadius: '4px', border: '1px solid #2a3340', background: '#141b26', color: '#94a3b8', cursor: 'pointer' }}>
            {p.label}
          </button>
        ))}
        <span style={{ width: '1px', height: '16px', background: '#2a3340', margin: '0 4px' }} aria-hidden />
        <button type="button" onClick={() => fetchReadingsAndSummary()} disabled={loading} style={{ padding: '4px 12px', fontSize: '10px', borderRadius: '4px', border: '1px solid #2a3340', background: '#141b26', color: '#e2e8f0', cursor: loading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Icon name="refresh" size={12} /> Refresh
        </button>
        <button type="button" onClick={exportReadingsToExcel} disabled={exporting || loading} style={{ padding: '4px 12px', fontSize: '10px', borderRadius: '4px', border: '1px solid #22c55e55', background: '#14532d33', color: '#86efac', cursor: exporting ? 'wait' : 'pointer' }}>
          {exporting ? 'Exporting…' : 'Export Excel'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', borderBottom: '1px solid #2a3340' }}>
        {[
          { id: 'details', label: 'All Readings', icon: 'nozzle' },
          { id: 'nozzle', label: 'By Nozzle', icon: 'filter' },
          { id: 'attendant', label: 'By Attendant', icon: 'attendant' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '6px 12px', fontSize: '11px', fontWeight: 500, background: 'transparent', border: 'none',
            color: activeTab === tab.id ? '#f59a30' : '#94a3b8', borderBottom: activeTab === tab.id ? '2px solid #f59a30' : 'none', cursor: 'pointer'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}><PetrolNozzleLoader size="small" /></div>
      ) : (
        <>
          {activeTab === 'details' && (
            <>
              <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid #2a3340' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#0f151f' }}>
                      <th style={{ padding: '6px 6px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '6px 6px', textAlign: 'left' }}>Attendant</th>
                      <th style={{ padding: '6px 6px', textAlign: 'left' }}>Nozzle</th>
                      <th style={{ padding: '6px 6px', textAlign: 'right' }}>Opening</th>
                      <th style={{ padding: '6px 6px', textAlign: 'left' }}>Open Time</th>
                      <th style={{ padding: '6px 6px', textAlign: 'right' }}>Closing</th>
                      <th style={{ padding: '6px 6px', textAlign: 'left' }}>Close Time</th>
                      <th style={{ padding: '6px 6px', textAlign: 'right' }}>Sale (Ltrs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#6c7f8f' }}>No readings found</td></tr>
                    ) : (
                      readings.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #2a3340' }}>
                          <td style={{ padding: '6px 6px' }}>{r.reading_date?.substring(0, 10)}</td>
                          <td style={{ padding: '6px 6px' }}>{r.attendant_name}</td>
                          <td style={{ padding: '6px 6px' }}>{r.nozzle_name}</td>
                          <td style={{ padding: '6px 6px', textAlign: 'right' }}>{Number(r.opening_reading).toFixed(2)}</td>
                          <td style={{ padding: '6px 6px', fontSize: '10px' }}>{formatDateTime(r.opening_at)}</td>
                          <td style={{ padding: '6px 6px', textAlign: 'right' }}>
                            {r.closing_reading != null ? Number(r.closing_reading).toFixed(2) : <span style={{ color: '#f59a30', fontSize: '9px', background: '#f59a3020', padding: '2px 6px', borderRadius: '10px' }}>Active</span>}
                          </td>
                          <td style={{ padding: '6px 6px', fontSize: '10px' }}>{formatDateTime(r.closing_at)}</td>
                          <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 600, color: '#22c55e' }}>{r.sale_quantity != null ? Number(r.sale_quantity).toFixed(2) : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {pagination && pagination.totalPages > 1 && (
                <div style={{ marginTop: '12px' }}>
                  <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={setPage} totalRecords={pagination.totalRecords} showTotalRecords />
                </div>
              )}
            </>
          )}

          {activeTab === 'nozzle' && (
            <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid #2a3340' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#0f151f' }}><th style={{ padding: '8px 10px' }}>Nozzle</th><th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Sale (Ltrs)</th></tr>
                </thead>
                <tbody>
                  {displayTotals.nozzle.length === 0 ? (
                    <tr><td colSpan={2} style={{ textAlign: 'center', padding: '30px', color: '#6c7f8f' }}>No sales data</td></tr>
                  ) : (
                    displayTotals.nozzle.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #2a3340' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 500 }}>{item.name}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: '#3b82f6' }}>{item.total.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'attendant' && (
            <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid #2a3340' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#0f151f' }}><th style={{ padding: '8px 10px' }}>Attendant</th><th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Sale (Ltrs)</th></tr>
                </thead>
                <tbody>
                  {displayTotals.attendant.length === 0 ? (
                    <tr><td colSpan={2} style={{ textAlign: 'center', padding: '30px', color: '#6c7f8f' }}>No sales data</td></tr>
                  ) : (
                    displayTotals.attendant.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #2a3340' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 500 }}>{item.name}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: '#22c55e' }}>{item.total.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Record Modal - Same as before but with compact styling */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px' }}>
          <div style={{ background: '#141b26', borderRadius: '10px', width: '100%', maxWidth: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', border: '1px solid #2a3340' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #2a3340' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Record Nozzle Reading</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Icon name="close" size={14} /></button>
            </div>
            <div style={{ padding: '14px', overflowY: 'auto', flex: 1 }}>
              {/* Mode Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {RECORD_MODES.map(m => (
                  <button key={m.id} onClick={() => setRecordMode(m.id)} style={{
                    padding: '8px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer',
                    background: recordMode === m.id ? `${m.color}20` : '#0f151f',
                    border: recordMode === m.id ? `1px solid ${m.color}` : '1px solid #2a3340'
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', color: recordMode === m.id ? m.color : '#fff' }}>{m.title}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>{m.desc}</div>
                  </button>
                ))}
              </div>

              {/* Form fields - same as before but compact */}
              {(recordMode === 'both' || recordMode === 'opening_only') && (
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

                    <div>
                      <label style={{ display: 'block', fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '4px' }}>Attendant *</label>
                      <select value={form.attendant_id} onChange={e => setForm({ ...form, attendant_id: e.target.value })} required style={inputStyle}>
                        <option value="">— Select Attendant —</option>
                        {attendants.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '4px' }}>Nozzle *</label>
                      <select value={form.nozzle_id} onChange={e => setForm({ ...form, nozzle_id: e.target.value })} required style={inputStyle}>
                        <option value="">— Select Nozzle —</option>
                        {nozzles.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '4px' }}>Reading Date *</label>
                      <DatePicker selected={form.reading_date} onChange={d => setForm({ ...form, reading_date: d })} dateFormat="dd-MM-yy" className="pp-input" style={inputStyle} placeholderText="Select date" />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '4px' }}>Opening Reading *</label>
                      <input type="number" step="0.01" placeholder="e.g. 60000.00" value={form.opening_reading} onChange={e => setForm({ ...form, opening_reading: e.target.value })} style={inputStyle} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '4px' }}>Opening Time *</label>
                      <DatePicker selected={form.opening_at} onChange={d => setForm({ ...form, opening_at: d })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yy HH:mm" className="pp-input" style={inputStyle} placeholderText="Opening date & time" />
                    </div>

                    {recordMode === 'both' && (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '4px' }}>Closing Reading *</label>
                          <input type="number" step="0.01" placeholder="e.g. 60500.00" value={form.closing_reading} onChange={e => setForm({ ...form, closing_reading: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '4px' }}>Closing Time *</label>
                          <DatePicker selected={form.closing_at} onChange={d => setForm({ ...form, closing_at: d })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yy HH:mm" className="pp-input" style={inputStyle} placeholderText="Closing date & time" />
                        </div>
                      </>
                    )}

                  </div>
                  <button type="submit" disabled={submitting} style={{ ...btnStyle, marginTop: '14px', width: '100%', padding: '8px', fontSize: '12px' }}>{submitting ? 'Saving...' : (recordMode === 'both' ? 'Save Reading' : 'Save Opening')}</button>
                </form>
              )}

              {/* Add Closing Mode */}
              {recordMode === 'add_closing' && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '4px' }}>From Date</label>
                      <DatePicker selected={filters.from} onChange={d => setFilters({ ...filters, from: d })} dateFormat="dd-MM-yy" className="pp-input" style={{ width: '100%' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '4px' }}>To Date</label>
                      <DatePicker selected={filters.to} onChange={d => setFilters({ ...filters, to: d })} dateFormat="dd-MM-yy" className="pp-input" style={{ width: '100%' }} />
                    </div>
                    <button onClick={fetchPendingReadings} style={{ padding: '6px 12px', background: '#3b82f6', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', color: '#fff', whiteSpace: 'nowrap' }}>Refresh</button>
                  </div>
                  {loadingPending ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}><PetrolNozzleLoader size="small" /></div>
                  ) : pendingReadings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#6c7f8f', fontSize: '12px' }}>No pending shifts found</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead><tr style={{ background: '#0f151f' }}>
                          <th style={{ padding: '6px' }}>Date</th><th>Attendant</th><th>Nozzle</th><th style={{ textAlign: 'right' }}>Opening</th><th>Open Time</th><th style={{ width: '100px' }}>Action</th>
                        </tr></thead>
                        <tbody>
                          {pendingReadings.map(r => (
                            <React.Fragment key={r.id}>
                              <tr style={{ borderBottom: '1px solid #2a3340' }}>
                                <td style={{ padding: '6px' }}>{r.reading_date?.substring(0, 10)}</td>
                                <td>{r.attendant_name}</td>
                                <td>{r.nozzle_name}</td>
                                <td style={{ textAlign: 'right' }}>{Number(r.opening_reading).toFixed(2)}</td>
                                <td style={{ fontSize: '10px' }}>{formatDateTime(r.opening_at)}</td>
                                <td>
                                  {addingClosing === r.id ? (
                                    <span style={{ color: '#f59a30', fontSize: '10px' }}>Adding...</span>
                                  ) : (
                                    <button onClick={() => setAddingClosing(r.id)} style={{ padding: '2px 8px', fontSize: '10px', background: '#f59a30', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Add Closing</button>
                                  )}
                                </td>
                              </tr>
                              {addingClosing === r.id && (
                                <tr><td colSpan={6} style={{ padding: '10px', background: '#0f151f' }}>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input type="number" step="0.01" placeholder="Closing Reading *" value={closingForm.reading} onChange={e => setClosingForm({ ...closingForm, reading: e.target.value })} style={{ ...inputStyle, width: '150px' }} autoFocus />
                                    <DatePicker selected={closingForm.time} onChange={d => setClosingForm({ ...closingForm, time: d })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yy HH:mm" className="pp-input" style={{ ...inputStyle, width: '160px' }} />
                                    <button onClick={() => handleAddClosing(r)} disabled={submittingClosing} style={{ ...btnStyle, padding: '4px 12px' }}>{submittingClosing ? '...' : 'Save'}</button>
                                    <button onClick={() => { setAddingClosing(null); setClosingForm({ reading: '', time: new Date() }); }} style={{ padding: '4px 12px', background: 'transparent', border: '1px solid #2a3340', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}>Cancel</button>
                                  </div>
                                </td></tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ padding: '10px 14px', borderTop: '1px solid #2a3340', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '5px 12px', fontSize: '11px', background: 'transparent', border: '1px solid #2a3340', borderRadius: '4px', cursor: 'pointer', color: '#94a3b8' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

const inputStyle = {
  padding: '6px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #2a3340',
  background: '#0f151f', color: '#fff', width: '100%', boxSizing: 'border-box'
};

const btnStyle = {
  padding: '6px 12px', fontSize: '11px', fontWeight: 500, background: '#f59a30',
  border: 'none', borderRadius: '4px', cursor: 'pointer'
};

const NozzleReading = () => (
  <Layout>
    <NozzleReadingPanel embedded={false} />
  </Layout>
);

export default NozzleReading;