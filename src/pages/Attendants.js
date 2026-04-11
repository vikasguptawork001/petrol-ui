// import React, { useState, useEffect } from 'react';
// import Layout from '../components/Layout';
// import apiClient from '../config/axios';
// import config from '../config/config';
// import { useAuth } from '../context/AuthContext';
// import { useToast } from '../context/ToastContext';
// import TransactionLoader from '../components/TransactionLoader';
// import './Party.css';
// import './PetrolPump.css';
// import '../styles/petrolpump-theme.css';

// const Attendants = () => {
//   const { user } = useAuth();
//   const toast = useToast();
//   const [attendants, setAttendants] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [formData, setFormData] = useState({ attendance_id: '', name: '', mobile_number: '' });
//   const [submitting, setSubmitting] = useState(false);
//   const [deleting, setDeleting] = useState(false);

//   useEffect(() => {
//     if (user && (user.role === 'admin' || user.role === 'super_admin')) {
//       fetchAttendants();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [user]);

//   const fetchAttendants = async () => {
//     try {
//       setLoading(true);
//       const res = await apiClient.get(config.api.attendants);
//       setAttendants(res.data.attendants || []);
//     } catch (e) {
//       console.error(e);
//       toast.error('Failed to load attendants');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const openAdd = () => {
//     setEditingId(null);
//     setFormData({ attendance_id: '', name: '', mobile_number: '' });
//     setShowForm(true);
//   };

//   const openEdit = (a) => {
//     setEditingId(a.id);
//     setFormData({
//       attendance_id: a.attendance_id ?? '',
//       name: a.name ?? '',
//       mobile_number: a.mobile_number ?? ''
//     });
//     setShowForm(true);
//   };

//   const closeForm = () => {
//     setShowForm(false);
//     setEditingId(null);
//   };

//   const validateMobile = (value) => {
//     if (!value || !String(value).trim()) return null;
//     const digits = String(value).replace(/\D/g, '');
//     if (digits.length !== 10) return 'Mobile number must be exactly 10 digits';
//     return null;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!formData.name.trim()) {
//       toast.error('Attendant name is required');
//       return;
//     }
//     const mobileErr = validateMobile(formData.mobile_number);
//     if (mobileErr) {
//       toast.error(mobileErr);
//       return;
//     }
//     const mobile = formData.mobile_number.trim() ? String(formData.mobile_number).replace(/\D/g, '') : null;
//     setSubmitting(true);
//     try {
//       const payload = {
//         name: formData.name.trim(),
//         attendance_id: formData.attendance_id.trim() || null,
//         mobile_number: mobile || null
//       };
//       if (editingId) {
//         await apiClient.put(`${config.api.attendants}/${editingId}`, payload);
//         toast.success('Attendant updated');
//       } else {
//         await apiClient.post(config.api.attendants, payload);
//         toast.success('Attendant added');
//       }
//       closeForm();
//       fetchAttendants();
//     } catch (err) {
//       toast.error(err.response?.data?.error || 'Failed to save attendant');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm('Delete this attendant? They will be hidden from the list (archived internally).')) return;
//     setDeleting(true);
//     try {
//       await apiClient.delete(`${config.api.attendants}/${id}`);
//       toast.success('Attendant deleted');
//       fetchAttendants();
//     } catch (err) {
//       toast.error(err.response?.data?.error || 'Failed to delete');
//     } finally {
//       setDeleting(false);
//     }
//   };

//   if (user && user.role !== 'admin' && user.role !== 'super_admin') {
//     return (
//       <Layout>
//         <div className="pp-page">
//           <p style={{ color: '#dc3545', textAlign: 'center', padding: '24px' }}>Access denied. Only Admin and Super Admin can manage attendants.</p>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//       <div className="pp-page">
//         <div className="pp-page-header">
//           <div className="pp-header-content">
//             <h1 className="pp-page-title">Attendants</h1>
//             <p className="pp-page-subtitle">Manage staff. Attendance ID and mobile (10 digits) are optional. Nozzle is chosen per reading. Delete hides from list (archived internally).</p>
//           </div>
//           <div className="pp-header-actions">
//             <button type="button" className="btn btn-primary" onClick={openAdd}>
//               + Add Attendant
//             </button>
//           </div>
//         </div>

//         <div className="pp-card">
//           <h2 className="pp-card-title">Attendant list</h2>
//           {loading ? (
//             <TransactionLoader type="petrol" message="Loading attendants..." />
//           ) : attendants.length === 0 ? (
//             <div className="pp-empty">No attendants yet. Add one. Nozzle is chosen per reading in Daily Nozzle Reading.</div>
//           ) : (
//             <div className="pp-table-wrap">
//               <table className="pp-table">
//                 <thead>
//                   <tr>
//                     <th>S.No</th>
//                     <th>Attendance ID</th>
//                     <th>Name</th>
//                     <th>Mobile</th>
//                     <th>Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {attendants.map((a, i) => (
//                     <tr key={a.id}>
//                       <td>{i + 1}</td>
//                       <td>{a.attendance_id || '—'}</td>
//                       <td style={{ fontWeight: '600', color: '#1e293b' }}>{a.name}</td>
//                       <td>{a.mobile_number || '—'}</td>
//                       <td style={{ textAlign: 'center' }}>
//                         <button type="button" className="btn btn-secondary" onClick={() => openEdit(a)}>Edit</button>
//                         <button type="button" className="btn btn-danger" onClick={() => handleDelete(a.id)} disabled={deleting}>Delete</button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>

//       {showForm && (
//         <div className="pp-modal-overlay" onClick={closeForm}>
//           <div className="pp-modal" onClick={e => e.stopPropagation()}>
//             <div className="pp-modal-header">
//               <h3>{editingId ? 'Edit Attendant' : 'Add Attendant'}</h3>
//               <button type="button" className="pp-modal-close" onClick={closeForm} aria-label="Close">×</button>
//             </div>
//             <form onSubmit={handleSubmit}>
//               <div className="pp-modal-body">
//                 <div className="form-group">
//                   <label>Attendance ID</label>
//                   <input
//                     type="text"
//                     value={formData.attendance_id}
//                     onChange={e => setFormData({ ...formData, attendance_id: e.target.value })}
//                     placeholder="e.g. ATT001"
//                     className="pp-input"
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>Name *</label>
//                   <input
//                     type="text"
//                     value={formData.name}
//                     onChange={e => setFormData({ ...formData, name: e.target.value })}
//                     placeholder="Attendant name"
//                     required
//                     autoFocus
//                     className="pp-input"
//                   />
//                 </div>
//                 <div className="form-group">
//                   <label>Mobile (10 digits)</label>
//                   <input
//                     type="text"
//                     inputMode="numeric"
//                     maxLength={12}
//                     value={formData.mobile_number}
//                     onChange={e => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
//                     placeholder="9876543210"
//                     className="pp-input"
//                   />
//                 </div>
//               </div>
//               <div className="pp-modal-footer">
//                 <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button>
//                 <button type="submit" className="btn btn-primary" disabled={submitting}>
//                   {submitting ? 'Saving…' : (editingId ? 'Update' : 'Add')}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </Layout>
//   );
// };

// export default Attendants;







import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getLocalDateString } from '../utils/dateUtils';
import TransactionLoader from '../components/TransactionLoader';
import './Party.css';
import './PetrolPump.css';
import '../styles/petrolpump-theme.css';

// Minimal Icons
const Icon = ({ name, size = 14 }) => {
  const icons = {
    attendant: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />,
    id: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><line x1="8" y1="12" x2="16" y2="12" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    edit: <><path d="M17 3l4 4-7 7H10v-4l7-7z" /><path d="M4 20h16" /></>,
    trash: <><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13" /><path d="M9 3h6" /></>,
    close: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      {icons[name]}
    </svg>
  );
};

const Attendants = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [attendants, setAttendants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ attendance_id: '', name: '', mobile_number: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [reportFrom, setReportFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return getLocalDateString(d);
  });
  const [reportTo, setReportTo] = useState(() => getLocalDateString());
  const [reportRows, setReportRows] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  const formatInr = (n) => {
    const num = Number(n || 0);
    if (Number.isNaN(num)) return '0.00';
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fetchSalesByAttendant = useCallback(async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return;
    setReportLoading(true);
    try {
      const params = { from_date: reportFrom, to_date: reportTo };
      const res = await apiClient.get(config.api.salesByAttendant, { params });
      setReportRows(Array.isArray(res.data?.rows) ? res.data.rows : []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load attendant-wise sales');
      setReportRows([]);
    } finally {
      setReportLoading(false);
    }
  }, [user, reportFrom, reportTo, toast]);

  useEffect(() => {
    fetchSalesByAttendant();
  }, [fetchSalesByAttendant]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      fetchAttendants();
    }
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAttendants = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(config.api.attendants);
      setAttendants(res.data.attendants || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load attendants');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ attendance_id: '', name: '', mobile_number: '' });
    setShowForm(true);
  };

  const openEdit = (a) => {
    setEditingId(a.id);
    setFormData({
      attendance_id: a.attendance_id ?? '',
      name: a.name ?? '',
      mobile_number: a.mobile_number ?? ''
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const validateMobile = (value) => {
    if (!value || !String(value).trim()) return null;
    const digits = String(value).replace(/\D/g, '');
    if (digits.length !== 10) return 'Mobile number must be exactly 10 digits';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Attendant name is required');
      return;
    }
    const mobileErr = validateMobile(formData.mobile_number);
    if (mobileErr) {
      toast.error(mobileErr);
      return;
    }
    const mobile = formData.mobile_number.trim() ? String(formData.mobile_number).replace(/\D/g, '') : null;
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        attendance_id: formData.attendance_id.trim() || null,
        mobile_number: mobile || null
      };
      if (editingId) {
        await apiClient.put(`${config.api.attendants}/${editingId}`, payload);
        toast.success('Attendant updated');
      } else {
        await apiClient.post(config.api.attendants, payload);
        toast.success('Attendant added');
      }
      closeForm();
      fetchAttendants();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save attendant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? They will be archived.`)) return;
    setDeleting(true);
    try {
      await apiClient.delete(`${config.api.attendants}/${id}`);
      toast.success('Attendant deleted');
      fetchAttendants();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const crudBusy = loading || submitting || reportLoading || deleting;

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (user && user.role !== 'admin' && user.role !== 'super_admin') {
    return (
      <Layout>
        <div style={{ padding: '24px', textAlign: 'center', color: '#e8593c', fontWeight: 500 }}>
          Access denied. Only Admin and Super Admin can manage attendants.
        </div>
      </Layout>
    );
  }

  // Calculate stats
  const totalAttendants = attendants.length;
  const withMobile = attendants.filter(a => a.mobile_number).length;

  return (
    <Layout>
      <TransactionLoader
        isLoading={crudBusy}
        message={
          deleting ? 'Archiving attendant…' : submitting ? 'Saving attendant…' : reportLoading ? 'Loading sales…' : 'Loading…'
        }
        type="transaction"
      />
      <div style={{ padding: '8px 12px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="attendant" size={18} />
              <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#fff' }}>Attendants</h1>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0 0', maxWidth: '560px', lineHeight: 1.45 }}>
              Maintain staff who can be linked to each sale. Attendant-wise sales for a date range are below.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
          <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #f59a30' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total Attendants</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{totalAttendants}</div>
          </div>
          <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #3b82f6' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>With Mobile</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>{withMobile}</div>
          </div>
        </div>

        <div style={{ marginBottom: '16px', padding: '16px 18px', background: '#0a0e14', borderRadius: '10px', border: '1px solid #2a3340' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>Attendant roster</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Shown on the sell screen when choosing who served the sale.</div>
            </div>
            <button onClick={openAdd} type="button" disabled={crudBusy} style={{ padding: '8px 16px', background: '#f59a30', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: crudBusy ? 'not-allowed' : 'pointer', color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: crudBusy ? 0.65 : 1 }}>
              <Icon name="plus" size={14} /> Add attendant
            </button>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>Loading roster…</div>
          ) : attendants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px', color: '#6c7f8f', background: '#0f151f', borderRadius: '8px', fontSize: '13px' }}>
              No attendants yet. Use <strong style={{ color: '#e2e8f0' }}>Add attendant</strong>.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #2a3340' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#0f151f' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'center', width: '45px' }}>#</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Attendance ID</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Mobile</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', width: '160px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendants.map((a, idx) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #2a3340' }}>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#6c7f8f' }}>{idx + 1}</td>
                      <td style={{ padding: '10px 12px', color: '#9aaebf' }}>{a.attendance_id || '—'}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{a.name}</td>
                      <td style={{ padding: '10px 12px', color: '#9aaebf' }}>{a.mobile_number || '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => openEdit(a)} disabled={crudBusy} style={{ padding: '6px 12px', background: '#3b82f6', border: 'none', borderRadius: '6px', cursor: crudBusy ? 'not-allowed' : 'pointer', fontSize: '12px', color: '#fff', opacity: crudBusy ? 0.65 : 1 }}>
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDelete(a.id, a.name)} disabled={crudBusy} style={{ padding: '6px 12px', background: 'rgba(232,89,60,0.25)', border: '1px solid #e8593c', borderRadius: '6px', cursor: crudBusy ? 'not-allowed' : 'pointer', fontSize: '12px', color: '#fecaca', opacity: crudBusy ? 0.65 : 1 }}>
                            Archive
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{
          marginBottom: '14px',
          padding: '14px 16px',
          background: '#0f151f',
          borderRadius: '10px',
          border: '1px solid #2a3340',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="chart" size={16} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f3f4f6' }}>Sales by attendant</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Aggregates for the selected range (includes unassigned where no attendant was stored).</div>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchSalesByAttendant}
              disabled={crudBusy}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                background: '#1a2330',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#9aaebf',
                cursor: crudBusy ? 'wait' : 'pointer',
                opacity: crudBusy ? 0.65 : 1
              }}
            >
              {reportLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '10px 12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, color: '#6c7f8f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>From</label>
              <input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #2a3340', background: '#0a0f16', color: '#eef2f8', fontSize: '12px' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, color: '#6c7f8f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>To</label>
              <input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #2a3340', background: '#0a0f16', color: '#eef2f8', fontSize: '12px' }} />
            </div>
          </div>
          {reportLoading && reportRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>Loading sales…</div>
          ) : reportRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6c7f8f', fontSize: '12px', border: '1px dashed #2a3340', borderRadius: '8px' }}>No sale transactions in this period for the selected filters.</div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #2a3340' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#111827' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px', color: '#9aaebf', fontWeight: 700 }}>Attendant</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', color: '#9aaebf', fontWeight: 700 }}>Bills</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', color: '#9aaebf', fontWeight: 700 }}>Total sales (₹)</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', color: '#9aaebf', fontWeight: 700 }}>Paid (₹)</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px', color: '#9aaebf', fontWeight: 700 }}>Balance (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row, i) => (
                    <tr key={`${row.attendant_id ?? 'x'}-${i}`} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#eef2f8' }}>{row.attendant_name}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.bill_count}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#f59a30', fontWeight: 700 }}>{formatInr(row.total_sales)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#9aaebf' }}>{formatInr(row.total_paid)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#e8593c' }}>{formatInr(row.total_balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={modalOverlay} onClick={closeForm}>
          <div style={{ ...modalContent, maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={{ fontSize: '14px', margin: 0 }}>{editingId ? 'Edit Attendant' : 'Add Attendant'}</h3>
              <button onClick={closeForm} style={closeBtn}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={modalBody}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Attendance ID</label>
                  <input
                    type="text"
                    value={formData.attendance_id}
                    onChange={e => setFormData({ ...formData, attendance_id: e.target.value })}
                    placeholder="e.g., ATT001"
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Attendant name"
                    autoFocus
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Mobile (10 digits)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.mobile_number}
                    onChange={e => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="9876543210"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={modalFooter}>
                <button type="button" onClick={closeForm} style={secondaryBtn}>Cancel</button>
                <button type="submit" disabled={submitting} style={primaryBtn}>{submitting ? 'Saving...' : (editingId ? 'Update' : 'Add')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button onClick={scrollToTop} style={scrollBtnStyle}>↑</button>
      )}
    </Layout>
  );
};

// Styles
const inputStyle = {
  padding: '6px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #2a3340',
  background: '#0f151f', color: '#fff', width: '100%', boxSizing: 'border-box'
};

const modalOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px'
};

const modalContent = {
  background: '#141b26', borderRadius: '8px', width: '100%', display: 'flex',
  flexDirection: 'column', border: '1px solid #2a3340'
};

const modalHeader = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '10px 12px', borderBottom: '1px solid #2a3340'
};

const modalBody = { padding: '12px' };
const modalFooter = { padding: '14px 16px', borderTop: '1px solid #2a3340', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' };
const closeBtn = { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '22px', lineHeight: 1, padding: '4px' };
const primaryBtn = { padding: '10px 20px', fontSize: '13px', background: '#f59a30', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#0f172a', minWidth: '120px' };
const secondaryBtn = { padding: '10px 20px', fontSize: '13px', background: 'transparent', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer', color: '#e2e8f0', minWidth: '100px' };
const scrollBtnStyle = {
  position: 'fixed', bottom: '16px', right: '16px', width: '32px', height: '32px',
  borderRadius: '50%', background: '#f59a30', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 999
};

export default Attendants;