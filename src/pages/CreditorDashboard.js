import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Party.css';

const CreditorDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [creditors, setCreditors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user && user.role === 'super_admin') {
      fetchCreditors();
    }
  }, [user]);

  const fetchCreditors = async () => {
    try {
      setLoading(true);
      let all = [];
      let page = 1;
      const limit = 500;
      let hasMore = true;
      while (hasMore) {
        const res = await apiClient.get(config.api.sellers, { params: { page, limit } });
        const list = res.data.parties || [];
        all = [...all, ...list];
        hasMore = list.length === limit && (res.data.pagination?.totalPages || 0) > page;
        page++;
      }
      setCreditors(all);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load creditors');
    } finally {
      setLoading(false);
    }
  };

  const filtered = searchQuery.trim()
    ? creditors.filter(c =>
        (c.party_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.mobile_number || '').includes(searchQuery.trim())
      )
    : creditors;
  const totalOutstanding = filtered.reduce((sum, c) => sum + parseFloat(c.balance_amount || 0), 0);

  if (user && user.role !== 'super_admin') {
    return (
      <Layout>
        <div style={{ padding: '20px', textAlign: 'center', color: '#dc3545' }}>
          Access denied. Creditor dashboard is only for Super Admin.
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="party-form">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Creditor Dashboard</h2>
          <Link to="/due-sheet" className="btn btn-primary">View Due Sheet</Link>
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: '#fff3e0', borderRadius: '8px', border: '1px solid #ffb74d' }}>
              <div style={{ fontSize: '14px', color: '#e65100', marginBottom: '4px' }}>Total Creditors</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#bf360c' }}>{filtered.length}</div>
            </div>
            <div style={{ padding: '16px', background: '#ffebee', borderRadius: '8px', border: '1px solid #ef5350' }}>
              <div style={{ fontSize: '14px', color: '#c62828', marginBottom: '4px' }}>Total Outstanding</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#b71c1c' }}>₹{totalOutstanding.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search by name or mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              style={{ maxWidth: '320px', padding: '8px 12px' }}
            />
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead style={{ backgroundColor: '#34495e', color: '#fff' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left' }}>S.No</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Creditor</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Mobile</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Balance (Outstanding)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>No creditors found</td></tr>
                  ) : (
                    filtered.map((c, i) => (
                      <tr key={c.id}>
                        <td style={{ padding: '12px' }}>{i + 1}</td>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{c.party_name}</td>
                        <td style={{ padding: '12px' }}>{c.mobile_number || '—'}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: parseFloat(c.balance_amount || 0) > 0 ? '#c62828' : '#2e7d32' }}>
                          ₹{parseFloat(c.balance_amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CreditorDashboard;
