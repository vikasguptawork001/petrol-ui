import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getLocalDateString, getLocalISOString } from '../utils/dateUtils';
import Pagination from '../components/Pagination';
import PetrolNozzleLoader from '../components/PetrolNozzleLoader';
import './Report.css';
import './PetrolPump.css';

const TABS = [
  { id: 'both', label: 'Opening & closing together' },
  { id: 'opening_only', label: 'Opening only' },
  { id: 'add_closing', label: 'Add closing' }
];

const formatDateTime = (s) => {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
};

const NozzleReading = () => {
  const { user } = useAuth();
  const toast = useToast();
  const canManageNozzlesAttendants = user?.role === 'admin' || user?.role === 'super_admin';
  const [activeTab, setActiveTab] = useState('both');
  const [attendants, setAttendants] = useState([]);
  const [nozzles, setNozzles] = useState([]);
  const [form, setForm] = useState({
    attendant_id: '',
    nozzle_id: '',
    reading_date: new Date(),
    opening_reading: '',
    closing_reading: '',
    opening_at: new Date(),
    closing_at: new Date()
  });
  const [submitting, setSubmitting] = useState(false);
  const [readings, setReadings] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [nozzleFilter, setNozzleFilter] = useState('');
  const [attendantFilter, setAttendantFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [pagination, setPagination] = useState(null);

  // Pending closings (opening-only records) for "Add closing" tab
  const [pendingReadings, setPendingReadings] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [pendingFromDate, setPendingFromDate] = useState(new Date());
  const [pendingToDate, setPendingToDate] = useState(new Date());
  const [addingClosingForId, setAddingClosingForId] = useState(null);
  const [closingForm, setClosingForm] = useState({ closing_reading: '', closing_at: new Date() });
  const [submittingClosing, setSubmittingClosing] = useState(false);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [attRes, nozRes] = await Promise.all([
          apiClient.get(config.api.attendants),
          apiClient.get(config.api.nozzles)
        ]);
        setAttendants(attRes.data.attendants || []);
        setNozzles(nozRes.data.nozzles || []);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load attendants/nozzles');
      }
    };
    fetchMeta();
  }, [toast]);

  useEffect(() => {
    fetchReadings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, nozzleFilter, attendantFilter, page, limit]);

  const fetchReadings = async () => {
    setLoadingReport(true);
    try {
      const params = {
        from_date: getLocalDateString(fromDate),
        to_date: getLocalDateString(toDate),
        page,
        limit
      };
      if (nozzleFilter) params.nozzle_id = nozzleFilter;
      if (attendantFilter) params.attendant_id = attendantFilter;
      const res = await apiClient.get(config.api.nozzleReadings, { params });
      setReadings(res.data.readings || []);
      setPagination(res.data.pagination || null);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load readings');
    } finally {
      setLoadingReport(false);
    }
  };

  const fetchPendingReadings = async () => {
    setLoadingPending(true);
    try {
      const params = {
        from_date: getLocalDateString(pendingFromDate),
        to_date: getLocalDateString(pendingToDate),
        pending_closing: '1',
        limit: 200
      };
      const res = await apiClient.get(config.api.nozzleReadings, { params });
      setPendingReadings(res.data.readings || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load pending readings');
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'add_closing') {
      fetchPendingReadings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pendingFromDate, pendingToDate]);

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

    if (activeTab === 'both') {
      const opening = parseFloat(form.opening_reading);
      const closing = parseFloat(form.closing_reading);
      if (isNaN(opening) || isNaN(closing) || opening < 0 || closing < 0) {
        toast.error('Enter valid opening and closing readings');
        return;
      }
      if (closing <= opening) {
        toast.error('Closing reading must be greater than opening reading');
        return;
      }
      payload.opening_reading = opening;
      payload.closing_reading = closing;
    } else {
      const opening = parseFloat(form.opening_reading);
      if (isNaN(opening) || opening < 0) {
        toast.error('Enter valid opening reading');
        return;
      }
      payload.opening_reading = opening;
    }

    setSubmitting(true);
    try {
      await apiClient.post(config.api.nozzleReadings, payload);
      toast.success('Reading saved');
      setForm({
        ...form,
        opening_reading: '',
        closing_reading: '',
        opening_at: new Date(),
        closing_at: new Date()
      });
      fetchReadings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save reading');
    } finally {
      setSubmitting(false);
    }
  };

  const openAddClosing = (reading) => {
    setAddingClosingForId(reading.id);
    setClosingForm({
      closing_reading: '',
      closing_at: new Date()
    });
  };

  const cancelAddClosing = () => {
    setAddingClosingForId(null);
  };

  const handleSaveClosing = async (reading) => {
    const closing = parseFloat(closingForm.closing_reading);
    if (isNaN(closing) || closing < 0) {
      toast.error('Enter valid closing reading');
      return;
    }
    const opening = Number(reading.opening_reading);
    if (closing <= opening) {
      toast.error('Closing reading must be greater than opening reading');
      return;
    }
    setSubmittingClosing(true);
    try {
      await apiClient.post(config.api.nozzleReadings, {
        attendant_id: reading.attendant_id,
        nozzle_id: reading.nozzle_id,
        reading_date: reading.reading_date,
        closing_reading: closing,
        closing_at: getLocalISOString(closingForm.closing_at)
      });
      toast.success('Closing recorded');
      setAddingClosingForId(null);
      fetchPendingReadings();
      fetchReadings();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save closing');
    } finally {
      setSubmittingClosing(false);
    }
  };

  return (
    <Layout>
      <div className="pp-page">
        <div className="pp-page-header">
          <div>
            <h1 className="pp-page-title">Daily Nozzle Reading</h1>
            <p className="pp-page-subtitle">
              Record opening and closing meter readings with timestamps. Attendant is not tied to a nozzle — choose per reading. You can add opening only and add closing later from the Add closing tab.
            </p>
          </div>
          {canManageNozzlesAttendants && (
            <div className="pp-header-actions" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <Link to="/nozzles" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                Manage Nozzles
              </Link>
              <Link to="/attendants" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                Manage Attendants
              </Link>
            </div>
          )}
        </div>

        <div className="pp-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`pp-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'both' && (
          <div className="pp-card">
            <h2 className="pp-card-title">Record opening and closing together</h2>
            <form onSubmit={handleSubmit}>
              <div className="pp-form-row">
                <div className="form-group pp-input">
                  <label>Attendant *</label>
                  <select value={form.attendant_id} onChange={(e) => setForm({ ...form, attendant_id: e.target.value })} required>
                    <option value="">— Select —</option>
                    {attendants.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="form-group pp-input">
                  <label>Nozzle No. *</label>
                  <select value={form.nozzle_id} onChange={(e) => setForm({ ...form, nozzle_id: e.target.value })} required>
                    <option value="">— Select —</option>
                    {nozzles.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <DatePicker selected={form.reading_date} onChange={(date) => setForm({ ...form, reading_date: date })} dateFormat="dd-MM-yyyy" className="pp-input" style={{ width: '100%' }} />
                </div>
                <div className="form-group">
                  <label>Opening reading *</label>
                  <input type="number" step="0.01" min="0" value={form.opening_reading} onChange={(e) => setForm({ ...form, opening_reading: e.target.value })} placeholder="0" className="pp-input" required />
                </div>
                <div className="form-group">
                  <label>Opening at</label>
                  <DatePicker selected={form.opening_at} onChange={(date) => setForm({ ...form, opening_at: date })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yyyy HH:mm" className="pp-input" style={{ width: '100%' }} />
                </div>
                <div className="form-group">
                  <label>Closing reading *</label>
                  <input type="number" step="0.01" min="0" value={form.closing_reading} onChange={(e) => setForm({ ...form, closing_reading: e.target.value })} placeholder="0" className="pp-input" required />
                </div>
                <div className="form-group">
                  <label>Closing at</label>
                  <DatePicker selected={form.closing_at} onChange={(date) => setForm({ ...form, closing_at: date })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yyyy HH:mm" className="pp-input" style={{ width: '100%' }} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save reading'}</button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'opening_only' && (
          <div className="pp-card">
            <h2 className="pp-card-title">Record opening only</h2>
            <p className="pp-card-body" style={{ marginBottom: '20px' }}>Add closing later from the &quot;Add closing&quot; tab.</p>
            <form onSubmit={handleSubmit}>
              <div className="pp-form-row">
                <div className="form-group pp-input">
                  <label>Attendant *</label>
                  <select value={form.attendant_id} onChange={(e) => setForm({ ...form, attendant_id: e.target.value })} required>
                    <option value="">— Select —</option>
                    {attendants.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="form-group pp-input">
                  <label>Nozzle No. *</label>
                  <select value={form.nozzle_id} onChange={(e) => setForm({ ...form, nozzle_id: e.target.value })} required>
                    <option value="">— Select —</option>
                    {nozzles.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <DatePicker selected={form.reading_date} onChange={(date) => setForm({ ...form, reading_date: date })} dateFormat="dd-MM-yyyy" className="pp-input" style={{ width: '100%' }} />
                </div>
                <div className="form-group">
                  <label>Opening reading *</label>
                  <input type="number" step="0.01" min="0" value={form.opening_reading} onChange={(e) => setForm({ ...form, opening_reading: e.target.value })} placeholder="0" className="pp-input" required />
                </div>
                <div className="form-group">
                  <label>Opening at</label>
                  <DatePicker selected={form.opening_at} onChange={(date) => setForm({ ...form, opening_at: date })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yyyy HH:mm" className="pp-input" style={{ width: '100%' }} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving…' : 'Save opening'}</button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'add_closing' && (
          <div className="pp-card">
            <h2 className="pp-card-title">Add closing to existing openings</h2>
            <p className="pp-card-body" style={{ marginBottom: '16px' }}>Select a date range to see readings that have opening but no closing. Click &quot;Add closing&quot; to record closing reading and time.</p>
            <div className="pp-filters">
              <div className="form-group">
                <label>From date</label>
                <DatePicker selected={pendingFromDate} onChange={setPendingFromDate} dateFormat="dd-MM-yyyy" className="pp-input" style={{ width: '100%' }} />
              </div>
              <div className="form-group">
                <label>To date</label>
                <DatePicker selected={pendingToDate} onChange={setPendingToDate} dateFormat="dd-MM-yyyy" className="pp-input" style={{ width: '100%' }} />
              </div>
              <button type="button" className="btn btn-secondary" onClick={fetchPendingReadings}>Refresh</button>
            </div>
            {loadingPending ? (
              <div className="pp-loading">
                <PetrolNozzleLoader size="small" />
                <span>Loading…</span>
              </div>
            ) : pendingReadings.length === 0 ? (
              <div className="pp-empty">No opening-only records in this date range. Add opening from the Opening only tab first.</div>
            ) : (
              <div className="pp-table-wrap">
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Attendant</th>
                      <th>Nozzle No.</th>
                      <th style={{ textAlign: 'right' }}>Opening</th>
                      <th>Opening at</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReadings.map((r) => (
                      <React.Fragment key={r.id}>
                        <tr>
                          <td>{r.reading_date}</td>
                          <td>{r.attendant_name}</td>
                          <td>{r.nozzle_name}</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Number(r.opening_reading).toFixed(2)}</td>
                          <td style={{ fontSize: '0.875rem' }}>{formatDateTime(r.opening_at)}</td>
                          <td style={{ textAlign: 'center' }}>
                            {addingClosingForId === r.id ? '—' : (
                              <button type="button" className="btn btn-primary" onClick={() => openAddClosing(r)}>Add closing</button>
                            )}
                          </td>
                        </tr>
                        {addingClosingForId === r.id && (
                          <tr>
                            <td colSpan={6} style={{ padding: '12px', verticalAlign: 'middle' }}>
                              <div className="pp-inline-form">
                                <div className="form-group">
                                  <label>Closing reading *</label>
                                  <input type="number" step="0.01" min="0" value={closingForm.closing_reading} onChange={(e) => setClosingForm({ ...closingForm, closing_reading: e.target.value })} placeholder="0" className="pp-input" autoFocus />
                                </div>
                                <div className="form-group">
                                  <label>Closing at</label>
                                  <DatePicker selected={closingForm.closing_at} onChange={(date) => setClosingForm({ ...closingForm, closing_at: date })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="dd-MM-yyyy HH:mm" className="pp-input" style={{ width: '100%' }} />
                                </div>
                                <button type="button" className="btn btn-primary" onClick={() => handleSaveClosing(r)} disabled={submittingClosing}>{submittingClosing ? 'Saving…' : 'Save closing'}</button>
                                <button type="button" className="btn btn-secondary" onClick={cancelAddClosing}>Cancel</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="pp-card">
          <h2 className="pp-card-title">Daily Nozzle Report</h2>
          <div className="pp-filters">
            <div className="form-group">
              <label>From Date</label>
              <DatePicker selected={fromDate} onChange={setFromDate} dateFormat="dd-MM-yyyy" className="pp-input" style={{ width: '100%' }} />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <DatePicker selected={toDate} onChange={setToDate} dateFormat="dd-MM-yyyy" className="pp-input" style={{ width: '100%' }} />
            </div>
            <div className="form-group">
              <label>Nozzle</label>
              <select value={nozzleFilter} onChange={(e) => { setNozzleFilter(e.target.value); setPage(1); }} className="pp-input">
                <option value="">All</option>
                {nozzles.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Attendant</label>
              <select value={attendantFilter} onChange={(e) => { setAttendantFilter(e.target.value); setPage(1); }} className="pp-input">
                <option value="">All</option>
                {attendants.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
          {loadingReport ? (
            <div className="pp-loading">
              <PetrolNozzleLoader size="small" />
              <span>Loading…</span>
            </div>
          ) : (
            <>
              <div className="pp-table-wrap">
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Attendant</th>
                      <th>Nozzle No.</th>
                      <th style={{ textAlign: 'right' }}>Opening</th>
                      <th>Opening at</th>
                      <th style={{ textAlign: 'right' }}>Closing</th>
                      <th>Closing at</th>
                      <th style={{ textAlign: 'right' }}>Sale (Qty)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>No readings found</td></tr>
                    ) : (
                      readings.map((r) => (
                        <tr key={r.id}>
                          <td>{r.reading_date}</td>
                          <td>{r.attendant_name}</td>
                          <td>{r.nozzle_name}</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Number(r.opening_reading).toFixed(2)}</td>
                          <td style={{ fontSize: '0.875rem' }}>{formatDateTime(r.opening_at)}</td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.closing_reading != null ? Number(r.closing_reading).toFixed(2) : '—'}</td>
                          <td style={{ fontSize: '0.875rem' }}>{formatDateTime(r.closing_at)}</td>
                          <td style={{ textAlign: 'right', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>{r.sale_quantity != null ? Number(r.sale_quantity).toFixed(2) : '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {pagination && pagination.totalPages > 1 && (
                <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} totalRecords={pagination.totalRecords} showTotalRecords />
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default NozzleReading;
