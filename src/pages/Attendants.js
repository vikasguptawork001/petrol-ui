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







import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getLocalDateString, formatInIndiaTime } from '../utils/dateUtils';
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
    close: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
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
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Report states
  const [showReport, setShowReport] = useState(false);
  const [reportAttendant, setReportAttendant] = useState(null);
  const [reportFromDate, setReportFromDate] = useState(new Date());
  const [reportToDate, setReportToDate] = useState(new Date());
  const [reportLoading, setReportLoading] = useState(false);
  const [reportTransactions, setReportTransactions] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);

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
    try {
      await apiClient.delete(`${config.api.attendants}/${id}`);
      toast.success('Attendant deleted');
      fetchAttendants();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const openReport = (a) => {
    setReportAttendant(a);
    setShowReport(true);
    fetchReport(a.id, reportFromDate, reportToDate);
  };

  const fetchReport = async (attendantId, from, to) => {
    try {
      setReportLoading(true);
      const params = {
        from_date: getLocalDateString(from),
        to_date: getLocalDateString(to),
        attendant_id: attendantId,
        limit: 1000 // Get all for the modal
      };
      const res = await apiClient.get(config.api.salesReport, { params });
      setReportTransactions(res.data.transactions || []);
      setReportSummary(res.data.summary || null);
    } catch (err) {
      toast.error('Failed to load report');
    } finally {
      setReportLoading(false);
    }
  };

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
      <div style={{ padding: '8px 12px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="attendant" size={18} />
              <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#fff' }}>Attendants</h1>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '2px 0 0 0' }}>Manage staff. Attendance ID and mobile are optional.</p>
          </div>
          <button onClick={openAdd} style={{ padding: '6px 12px', background: '#f59a30', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Icon name="plus" size={12} /> Add Attendant
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
          <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #f59a30' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total Attendants</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{totalAttendants}</div>
          </div>
          <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #3b82f6' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>With Mobile</div>
            <div style={{ fontSize:  '20px', fontWeight: 700, color: '#3b82f6' }}>{withMobile}</div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading...</div>
        ) : attendants.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c7f8f', background: '#0f151f', borderRadius: '6px' }}>
            No attendants yet. Click "Add Attendant" to get started.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid #2a3340' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#0f151f' }}>
                  <th style={{ padding: '8px 8px', textAlign: 'center', width: '45px' }}>#</th>
                  <th style={{ padding: '8px 8px', textAlign: 'left' }}>Attendance ID</th>
                  <th style={{ padding: '8px 8px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '8px 8px', textAlign: 'left' }}>Mobile</th>
                  <th style={{ padding: '8px 8px', textAlign: 'center', width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendants.map((a, idx) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #2a3340' }}>
                    <td style={{ padding: '8px 8px', textAlign: 'center', color: '#6c7f8f' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 8px', color: '#9aaebf' }}>{a.attendance_id || '—'}</td>
                    <td style={{ padding: '8px 8px', fontWeight: 500 }}>{a.name}</td>
                    <td style={{ padding: '8px 8px', color: '#9aaebf' }}>{a.mobile_number || '—'}</td>
                    <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => openReport(a)} style={{ padding: '4px 8px', background: '#1d9e75', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#fff' }}>
                          📊 Report
                        </button>
                        <button onClick={() => openEdit(a)} style={{ padding: '4px 8px', background: '#3b82f6', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleDelete(a.id, a.name)} style={{ padding: '4px 8px', background: '#e8593c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🗑️ Delete
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

      {/* Report Modal */}
      {showReport && reportAttendant && (
        <div style={modalOverlay} onClick={() => setShowReport(false)}>
          <div style={{ ...modalContent, maxWidth: '1000px', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#1d9e75', padding: '6px', borderRadius: '6px' }}><Icon name="attendant" size={16} /></div>
                <div>
                  <h3 style={{ fontSize: '15px', margin: 0 }}>Sales Report: {reportAttendant.name}</h3>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>{reportAttendant.attendance_id || 'No ID'} | {reportAttendant.mobile_number || 'No Mobile'}</div>
                </div>
              </div>
              <button onClick={() => setShowReport(false)} style={closeBtn}>×</button>
            </div>
            
            <div style={{ ...modalBody, overflowY: 'auto' }}>
              {/* Report Filters */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'flex-end', background: '#0f151f', padding: '10px', borderRadius: '8px', border: '1px solid #2a3340' }}>
                <div>
                  <label style={{ fontSize: '9px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>From Date</label>
                  <DatePicker 
                    selected={reportFromDate} 
                    onChange={d => { setReportFromDate(d); fetchReport(reportAttendant.id, d, reportToDate); }} 
                    dateFormat="dd/MM/yy" 
                    className="pp-input" 
                    style={{ ...inputStyle, width: '100px' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '9px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>To Date</label>
                  <DatePicker 
                    selected={reportToDate} 
                    onChange={d => { setReportToDate(d); fetchReport(reportAttendant.id, reportFromDate, d); }} 
                    dateFormat="dd/MM/yy" 
                    className="pp-input" 
                    style={{ ...inputStyle, width: '100px' }} 
                  />
                </div>
                <button 
                  onClick={() => fetchReport(reportAttendant.id, reportFromDate, reportToDate)} 
                  disabled={reportLoading}
                  style={{ ...primaryBtn, background: '#3b82f6' }}
                >
                  {reportLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {/* Summary Pills */}
              {reportSummary && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                  <div style={{ flex: 1, padding: '10px', background: '#141b26', borderRadius: '8px', border: '1px solid #2a3340', borderLeft: '3px solid #f59a30' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Sales</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59a30' }}>₹{(reportSummary.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div style={{ flex: 1, padding: '10px', background: '#141b26', borderRadius: '8px', border: '1px solid #2a3340', borderLeft: '3px solid #22c55e' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Paid</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>₹{(reportSummary.totalPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div style={{ flex: 1, padding: '10px', background: '#141b26', borderRadius: '8px', border: '1px solid #2a3340', borderLeft: '3px solid #e8593c' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Balance</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#e8593c' }}>₹{(reportSummary.totalBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </div>
                  <div style={{ flex: 1, padding: '10px', background: '#141b26', borderRadius: '8px', border: '1px solid #2a3340', borderLeft: '3px solid #3b82f6' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>Txns</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>{reportSummary.totalTransactions || 0}</div>
                  </div>
                </div>
              )}

              {/* Transactions Table */}
              <div style={{ borderRadius: '6px', border: '1px solid #2a3340', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <thead style={{ background: '#0f151f', color: '#94a3b8' }}>
                    <tr>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Time</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Bill No</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Party</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Paid</th>
                      <th style={{ padding: '8px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportLoading ? (
                      <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}><TransactionLoader message="Fetching..." /></td></tr>
                    ) : reportTransactions.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6c7f8f' }}>No sales for this period</td></tr>
                    ) : (
                      reportTransactions.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid #1a2330' }}>
                          <td style={{ padding: '6px 8px', color: '#9aaebf' }}>{formatInIndiaTime(t.created_at)}</td>
                          <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{t.bill_number}</td>
                          <td style={{ padding: '6px 8px', fontWeight: 500 }}>{t.party_name || '—'}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', color: '#f59a30', fontWeight: 600 }}>₹{parseFloat(t.total_amount).toFixed(2)}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', color: '#22c55e' }}>₹{parseFloat(t.paid_amount).toFixed(2)}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                            <span style={{ 
                              background: t.payment_status === 'paid' ? '#22c55e20' : t.payment_status === 'partial' ? '#f59a3020' : '#e8593c20',
                              color: t.payment_status === 'paid' ? '#22c55e' : t.payment_status === 'partial' ? '#f59a30' : '#e8593c',
                              padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 600
                            }}>
                              {(t.payment_status || '').toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={modalFooter}>
              <button onClick={() => setShowReport(false)} style={secondaryBtn}>Close Report</button>
            </div>
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
const modalFooter = { padding: '10px 12px', borderTop: '1px solid #2a3340', display: 'flex', justifyContent: 'flex-end', gap: '8px' };
const closeBtn = { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' };
const primaryBtn = { padding: '5px 12px', fontSize: '11px', background: '#f59a30', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 500 };
const secondaryBtn = { padding: '5px 12px', fontSize: '11px', background: 'transparent', border: '1px solid #2a3340', borderRadius: '3px', cursor: 'pointer', color: '#94a3b8' };
const scrollBtnStyle = {
  position: 'fixed', bottom: '16px', right: '16px', width: '32px', height: '32px',
  borderRadius: '50%', background: '#f59a30', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 999
};

export default Attendants;