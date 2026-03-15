import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Party.css';
import './PetrolPump.css';

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

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      fetchAttendants();
    }
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attendant? They will be hidden from the list (archived internally).')) return;
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

  if (user && user.role !== 'admin' && user.role !== 'super_admin') {
    return (
      <Layout>
        <div className="pp-page">
          <p style={{ color: '#dc3545', textAlign: 'center', padding: '24px' }}>Access denied. Only Admin and Super Admin can manage attendants.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pp-page">
        <div className="pp-page-header">
          <div>
            <h1 className="pp-page-title">Attendants</h1>
            <p className="pp-page-subtitle">Manage staff. Attendance ID and mobile (10 digits) are optional. Nozzle is chosen per reading. Delete hides from list (archived internally).</p>
          </div>
          <div className="pp-header-actions">
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              + Add Attendant
            </button>
          </div>
        </div>

        <div className="pp-card">
          <h2 className="pp-card-title">Attendant list</h2>
          {loading ? (
            <div className="pp-loading">Loading…</div>
          ) : attendants.length === 0 ? (
            <div className="pp-empty">No attendants yet. Add one. Nozzle is chosen per reading in Daily Nozzle Reading.</div>
          ) : (
            <div className="pp-table-wrap">
              <table className="pp-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Attendance ID</th>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendants.map((a, i) => (
                    <tr key={a.id}>
                      <td>{i + 1}</td>
                      <td>{a.attendance_id || '—'}</td>
                      <td style={{ fontWeight: '600', color: '#1e293b' }}>{a.name}</td>
                      <td>{a.mobile_number || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => openEdit(a)}>Edit</button>
                        <button type="button" className="btn btn-danger" onClick={() => handleDelete(a.id)} disabled={deleting}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="pp-modal-overlay" onClick={closeForm}>
          <div className="pp-modal" onClick={e => e.stopPropagation()}>
            <div className="pp-modal-header">
              <h3>{editingId ? 'Edit Attendant' : 'Add Attendant'}</h3>
              <button type="button" className="pp-modal-close" onClick={closeForm} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="pp-modal-body">
                <div className="form-group">
                  <label>Attendance ID</label>
                  <input
                    type="text"
                    value={formData.attendance_id}
                    onChange={e => setFormData({ ...formData, attendance_id: e.target.value })}
                    placeholder="e.g. ATT001"
                    className="pp-input"
                  />
                </div>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Attendant name"
                    required
                    autoFocus
                    className="pp-input"
                  />
                </div>
                <div className="form-group">
                  <label>Mobile (10 digits)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    value={formData.mobile_number}
                    onChange={e => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="9876543210"
                    className="pp-input"
                  />
                </div>
              </div>
              <div className="pp-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : (editingId ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Attendants;
