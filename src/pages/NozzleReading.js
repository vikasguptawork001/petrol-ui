import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import { useToast } from '../context/ToastContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getLocalDateString, getLocalISOString } from '../utils/dateUtils';
import Pagination from '../components/Pagination';
import PetrolNozzleLoader from '../components/PetrolNozzleLoader';
import './Report.css';
import './PetrolPump.css';
import './Party.css';

const RECORD_MODES = [
  { id: 'both', title: 'Full shift', desc: 'Record opening and closing in one step' },
  { id: 'opening_only', title: 'Opening only', desc: 'Start of shift — add closing later' },
  { id: 'add_closing', title: 'Add closing', desc: 'Complete readings that have opening only' }
];

const formatDateTime = (s) => {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
};

export function NozzleReadingPanel({ embedded = false }) {
  const toast = useToast();
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordMode, setRecordMode] = useState('both');
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
    if (showRecordModal && recordMode === 'add_closing') {
      fetchPendingReadings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRecordModal, recordMode, pendingFromDate, pendingToDate]);

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
      setShowRecordModal(false);
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
      setShowRecordModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save closing');
    } finally {
      setSubmittingClosing(false);
    }
  };

  return (
    <div className={`pp-page ${embedded ? 'pp-page--embedded' : ''}`}>
        <div className="pp-page-header" style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 className="pp-page-title">Daily Nozzle Reading</h1>
            <p className="pp-page-subtitle" style={{ maxWidth: '640px' }}>
              {embedded
                ? 'Date range, filters, full report table, and Record (opening / closing / add closing).'
                : 'The report below loads by default. Manage nozzles and attendants from the sidebar menu. Tap Record to enter readings in a guided flow.'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { setShowRecordModal(true); setRecordMode('both'); }}
            style={{ padding: '12px 22px', fontWeight: 600, borderRadius: '10px', flexShrink: 0 }}
          >
            Record nozzle reading
          </button>
        </div>

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

        {showRecordModal && (
          <div className="modal-overlay" style={{ zIndex: 1200 }} role="presentation" onClick={() => setShowRecordModal(false)}>
            <div className="modal-content" style={{ maxWidth: 920, maxHeight: '92vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="nozzle-record-title">
              <div className="modal-header">
                <h3 id="nozzle-record-title">Record nozzle reading</h3>
                <button type="button" className="modal-close" onClick={() => setShowRecordModal(false)} aria-label="Close">×</button>
              </div>
              <div className="modal-body">
                <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px' }}>Choose how you are recording, then complete the fields below.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '22px' }}>
                  {RECORD_MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setRecordMode(m.id)}
                      style={{
                        textAlign: 'left',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: recordMode === m.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: recordMode === m.id ? 'linear-gradient(160deg, #eff6ff 0%, #e0e7ff 100%)' : '#ffffff',
                        cursor: 'pointer',
                        boxShadow: recordMode === m.id ? '0 6px 20px rgba(37, 99, 235, 0.12)' : '0 1px 3px rgba(15, 23, 42, 0.06)',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', marginBottom: '6px' }}>{m.title}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.45 }}>{m.desc}</div>
                    </button>
                  ))}
                </div>

                {recordMode === 'both' && (
                  <div className="pp-card" style={{ boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                    <h4 className="pp-card-title" style={{ fontSize: '16px' }}>Opening &amp; closing</h4>
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

                {recordMode === 'opening_only' && (
                  <div className="pp-card" style={{ boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                    <h4 className="pp-card-title" style={{ fontSize: '16px' }}>Opening only</h4>
                    <p className="pp-card-body" style={{ marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>Closing can be added later using &quot;Add closing&quot; in this window.</p>
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

                {recordMode === 'add_closing' && (
                  <div className="pp-card" style={{ boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                    <h4 className="pp-card-title" style={{ fontSize: '16px' }}>Add closing</h4>
                    <p className="pp-card-body" style={{ marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>Readings that already have an opening but no closing.</p>
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
                      <div className="pp-empty">No pending openings in this range. Record an opening first (Full shift or Opening only).</div>
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
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRecordModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

const NozzleReading = () => (
  <Layout>
    <NozzleReadingPanel embedded={false} />
  </Layout>
);

export default NozzleReading;
