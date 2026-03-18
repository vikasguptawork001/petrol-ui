import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TransactionLoader from '../components/TransactionLoader';
import './Party.css';
import './PetrolPump.css';
import '../styles/petrolpump-theme.css';

const Nozzles = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [nozzles, setNozzles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin')) {
      fetchNozzles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchNozzles = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(config.api.nozzles);
      setNozzles(res.data.nozzles || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load nozzles');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ name: '' });
    setShowForm(true);
  };

  const openEdit = (n) => {
    setEditingId(n.id);
    setFormData({ name: n.name });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nozzle name is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { name: formData.name.trim() };
      if (editingId) {
        await apiClient.put(`${config.api.nozzles}/${editingId}`, payload);
        toast.success('Nozzle updated');
      } else {
        await apiClient.post(config.api.nozzles, payload);
        toast.success('Nozzle added');
      }
      closeForm();
      fetchNozzles();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save nozzle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this nozzle? It will be archived and hidden from the list. You can restore it later.')) return;
    setDeleting(true);
    try {
      await apiClient.delete(`${config.api.nozzles}/${id}`);
      toast.success('Nozzle deleted');
      fetchNozzles();
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
          <p style={{ color: '#dc3545', textAlign: 'center', padding: '24px' }}>Access denied. Only Admin and Super Admin can manage nozzles.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pp-page">
        <div className="pp-page-header">
          <div className="pp-header-content">
            <h1 className="pp-page-title">Nozzles</h1>
            <p className="pp-page-subtitle">Manage pump nozzles. Delete hides a nozzle from the list (archived internally).</p>
          </div>
          <div className="pp-header-actions">
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              + Add Nozzle
            </button>
          </div>
        </div>

        <div className="pp-card">
          <h2 className="pp-card-title">Nozzle list</h2>
          {loading ? (
            <TransactionLoader type="petrol" message="Loading nozzles..." />
          ) : nozzles.length === 0 ? (
            <div className="pp-empty">No nozzles yet. Add one to get started.</div>
          ) : (
            <div className="pp-table-wrap">
              <table className="pp-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nozzles.map((n, i) => (
                    <tr key={n.id}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: '600', color: '#1e293b' }}>{n.name}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => openEdit(n)}>Edit</button>
                        <button type="button" className="btn btn-danger" onClick={() => handleDelete(n.id)} disabled={deleting}>Delete</button>
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
              <h3>{editingId ? 'Edit Nozzle' : 'Add Nozzle'}</h3>
              <button type="button" className="pp-modal-close" onClick={closeForm} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="pp-modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Nozzle 1"
                    required
                    autoFocus
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

export default Nozzles;
