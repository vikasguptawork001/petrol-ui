import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getLocalDateString, formatDateInIndia, formatInIndiaTime } from '../utils/dateUtils';
import TransactionLoader from '../components/TransactionLoader';
import './Report.css';

const fmt = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n.toFixed(2) : '—';
};

const PumpShiftReports = () => {
  const [tab, setTab] = useState('attendant');

  const [attendants, setAttendants] = useState([]);
  const [nozzles, setNozzles] = useState([]);

  const [attendantId, setAttendantId] = useState('');
  const [ahFrom, setAhFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d;
  });
  const [ahTo, setAhTo] = useState(new Date());
  const [ahShifts, setAhShifts] = useState([]);
  const [ahSummary, setAhSummary] = useState(null);
  const [ahLoading, setAhLoading] = useState(false);

  const [nozzleId, setNozzleId] = useState('');
  const [ndFrom, setNdFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d;
  });
  const [ndTo, setNdTo] = useState(new Date());
  const [ndShifts, setNdShifts] = useState([]);
  const [ndSummary, setNdSummary] = useState(null);
  const [ndLoading, setNdLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, nRes] = await Promise.all([
          apiClient.get(config.api.attendants),
          apiClient.get(config.api.nozzles)
        ]);
        setAttendants(aRes.data.attendants || []);
        setNozzles(nRes.data.nozzles || []);
      } catch (e) {
        /* ignore */
      }
    };
    load();
  }, []);

  const loadAttendantHistory = async () => {
    if (!attendantId) return;
    setAhLoading(true);
    try {
      const res = await apiClient.get(config.api.nozzleReadingsAttendantHistory, {
        params: {
          attendant_id: attendantId,
          from_date: getLocalDateString(ahFrom),
          to_date: getLocalDateString(ahTo)
        }
      });
      setAhShifts(res.data?.shifts || []);
      setAhSummary(res.data?.summary || null);
    } catch (e) {
      setAhShifts([]);
      setAhSummary(null);
    } finally {
      setAhLoading(false);
    }
  };

  const loadNozzleDaily = async () => {
    if (!nozzleId) return;
    setNdLoading(true);
    try {
      const res = await apiClient.get(config.api.nozzleReadingsNozzleDaily, {
        params: {
          nozzle_id: nozzleId,
          from_date: getLocalDateString(ndFrom),
          to_date: getLocalDateString(ndTo)
        }
      });
      setNdShifts(res.data?.shifts || []);
      setNdSummary(res.data?.summary || null);
    } catch (e) {
      setNdShifts([]);
      setNdSummary(null);
    } finally {
      setNdLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'attendant' && attendantId) loadAttendantHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, attendantId, ahFrom, ahTo]);

  useEffect(() => {
    if (tab === 'nozzle' && nozzleId) loadNozzleDaily();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, nozzleId, ndFrom, ndTo]);

  const inp = {
    padding: '6px 10px',
    fontSize: '12px',
    background: '#0f151f',
    border: '1px solid #2a3340',
    borderRadius: '6px',
    color: '#eef2f8',
    minWidth: '160px'
  };
  const lbl = {
    fontSize: '10px',
    color: '#9aaebf',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
    display: 'block'
  };

  const showDate = (d) => {
    if (!d) return '—';
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
      const [y, m, day] = d.split(/[-T]/);
      return formatDateInIndia(new Date(Number(y), Number(m) - 1, Number(day)));
    }
    return formatDateInIndia(d);
  };

  return (
    <Layout>
      <TransactionLoader
        isLoading={ahLoading || ndLoading}
        type="transaction"
        message="Loading shift report…"
      />
      <div style={{ padding: '10px 14px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '14px' }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#eef2f8' }}>
            Pump meter shifts
          </h1>
          <p style={{ fontSize: '11px', color: '#9aaebf', margin: '4px 0 0 0', maxWidth: '720px' }}>
            <strong>Attendant history</strong> — every opening and closing that staff member entered, nozzle by nozzle, day by day.
            <br />
            <strong>Nozzle shifts</strong> — for one nozzle and a date range, shifts in order by day and time (who opened, who closed, and the meter readings).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setTab('attendant')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid #2a3340',
              background: tab === 'attendant' ? '#f59a30' : 'transparent',
              color: tab === 'attendant' ? '#1a1200' : '#9aaebf',
              cursor: 'pointer'
            }}
          >
            Attendant history
          </button>
          <button
            type="button"
            onClick={() => setTab('nozzle')}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid #2a3340',
              background: tab === 'nozzle' ? '#f59a30' : 'transparent',
              color: tab === 'nozzle' ? '#1a1200' : '#9aaebf',
              cursor: 'pointer'
            }}
          >
            Nozzle — date range
          </button>
        </div>

        {tab === 'attendant' && (
          <div>
            <div
              style={{
                background: '#0f151f',
                border: '1px solid #2a3340',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '12px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'flex-end'
              }}
            >
              <div>
                <label style={lbl}>Staff member</label>
                <select
                  value={attendantId}
                  onChange={(e) => setAttendantId(e.target.value)}
                  style={inp}
                >
                  <option value="">Select attendant</option>
                  {attendants.filter((a) => !a.is_archived).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name || `Attendant #${a.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>From</label>
                <DatePicker
                  selected={ahFrom}
                  onChange={(d) => {
                    setAhFrom(d);
                    if (d && ahTo && d > ahTo) setAhTo(d);
                  }}
                  dateFormat="dd-MM-yy"
                  maxDate={ahTo}
                  className="pp-datepicker-compact"
                />
              </div>
              <div>
                <label style={lbl}>To</label>
                <DatePicker
                  selected={ahTo}
                  onChange={(d) => {
                    setAhTo(d);
                    if (d && ahFrom && d < ahFrom) setAhFrom(d);
                  }}
                  dateFormat="dd-MM-yy"
                  minDate={ahFrom}
                  className="pp-datepicker-compact"
                />
              </div>
              <button
                type="button"
                onClick={loadAttendantHistory}
                disabled={!attendantId || ahLoading}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: '#22c55e',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#0a1f0f',
                  cursor: attendantId ? 'pointer' : 'not-allowed',
                  opacity: attendantId ? 1 : 0.5
                }}
              >
                Refresh
              </button>
            </div>

            {ahSummary && attendantId && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <div style={{ background: '#141b26', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                  <div style={{ fontSize: '10px', color: '#9aaebf' }}>Shifts recorded</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#eef2f8' }}>{ahSummary.shifts}</div>
                </div>
                <div style={{ background: '#141b26', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
                  <div style={{ fontSize: '10px', color: '#9aaebf' }}>Completed (closed)</div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{ahSummary.completed_shifts}</div>
                </div>
                <div style={{ background: '#141b26', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #f59a30' }}>
                  <div style={{ fontSize: '10px', color: '#9aaebf' }}>Total liters (closed shifts)</div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{fmt(ahSummary.total_liters)}</div>
                </div>
              </div>
            )}

            <div style={{ background: '#0f151f', border: '1px solid #2a3340', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#0d1320', borderBottom: '1px solid #2a3340' }}>
                    <th style={th}>Date</th>
                    <th style={th}>Nozzle</th>
                    <th style={{ ...th, textAlign: 'right' }}>Opening</th>
                    <th style={{ ...th, textAlign: 'right' }}>Closing</th>
                    <th style={{ ...th, textAlign: 'right' }}>Liters</th>
                    <th style={th}>Opened</th>
                    <th style={th}>Closed</th>
                    <th style={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!attendantId ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '28px', textAlign: 'center', color: '#9aaebf' }}>
                        Choose a staff member to see their meter history.
                      </td>
                    </tr>
                  ) : ahShifts.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '28px', textAlign: 'center', color: '#9aaebf' }}>
                        No readings in this date range.
                      </td>
                    </tr>
                  ) : (
                    ahShifts.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #1a2330' }}>
                        <td style={td}>{showDate(r.reading_date)}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{r.nozzle_name}</td>
                        <td style={{ ...td, textAlign: 'right' }}>{fmt(r.opening_reading)}</td>
                        <td style={{ ...td, textAlign: 'right' }}>{r.closing_reading != null ? fmt(r.closing_reading) : '—'}</td>
                        <td style={{ ...td, textAlign: 'right', color: '#3b82f6' }}>{r.sale_liters != null ? fmt(r.sale_liters) : '—'}</td>
                        <td style={{ ...td, color: '#9aaebf', whiteSpace: 'nowrap' }}>{r.opening_at ? formatInIndiaTime(r.opening_at) : '—'}</td>
                        <td style={{ ...td, color: '#9aaebf', whiteSpace: 'nowrap' }}>{r.closing_at ? formatInIndiaTime(r.closing_at) : '—'}</td>
                        <td style={td}>
                          {r.completed ? (
                            <span style={{ color: '#22c55e', fontWeight: 600 }}>Done</span>
                          ) : (
                            <span style={{ color: '#f59a30', fontWeight: 600 }}>Open</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'nozzle' && (
          <div>
            <div
              style={{
                background: '#0f151f',
                border: '1px solid #2a3340',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '12px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'flex-end'
              }}
            >
              <div>
                <label style={lbl}>Nozzle</label>
                <select value={nozzleId} onChange={(e) => setNozzleId(e.target.value)} style={inp}>
                  <option value="">Select nozzle</option>
                  {nozzles.filter((n) => !n.is_archived).map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>From</label>
                <DatePicker
                  selected={ndFrom}
                  onChange={(d) => {
                    if (!d) return;
                    setNdFrom(d);
                    if (ndTo && d > ndTo) setNdTo(d);
                  }}
                  dateFormat="dd-MM-yy"
                  maxDate={ndTo}
                  className="pp-datepicker-compact"
                />
              </div>
              <div>
                <label style={lbl}>To</label>
                <DatePicker
                  selected={ndTo}
                  onChange={(d) => {
                    if (!d) return;
                    setNdTo(d);
                    if (ndFrom && d < ndFrom) setNdFrom(d);
                  }}
                  dateFormat="dd-MM-yy"
                  minDate={ndFrom}
                  className="pp-datepicker-compact"
                />
              </div>
              <button
                type="button"
                onClick={loadNozzleDaily}
                disabled={!nozzleId || ndLoading}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: '#22c55e',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#0a1f0f',
                  cursor: nozzleId ? 'pointer' : 'not-allowed',
                  opacity: nozzleId ? 1 : 0.5
                }}
              >
                Refresh
              </button>
            </div>

            {ndSummary && nozzleId && (
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>
                {showDate(getLocalDateString(ndFrom))}
                {getLocalDateString(ndFrom) !== getLocalDateString(ndTo)
                  ? ` → ${showDate(getLocalDateString(ndTo))}`
                  : ''}{' '}
                — {ndSummary.shift_count} shift(s), {fmt(ndSummary.total_liters)} L total
                {ndSummary.completed_count < ndSummary.shift_count
                  ? ` (${ndSummary.shift_count - ndSummary.completed_count} still open)`
                  : ''}
              </p>
            )}

            <div style={{ background: '#0f151f', border: '1px solid #2a3340', borderRadius: '8px', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#0d1320', borderBottom: '1px solid #2a3340' }}>
                    <th style={{ ...th, width: '44px' }}>#</th>
                    <th style={th}>Date</th>
                    <th style={th}>Attendant</th>
                    <th style={{ ...th, textAlign: 'right' }}>Opening</th>
                    <th style={{ ...th, textAlign: 'right' }}>Closing</th>
                    <th style={{ ...th, textAlign: 'right' }}>Liters</th>
                    <th style={th}>Opened</th>
                    <th style={th}>Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {!nozzleId ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '28px', textAlign: 'center', color: '#9aaebf' }}>
                        Choose a nozzle and date range to see shifts in order.
                      </td>
                    </tr>
                  ) : ndShifts.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '28px', textAlign: 'center', color: '#9aaebf' }}>
                        No readings for this nozzle in this date range.
                      </td>
                    </tr>
                  ) : (
                    ndShifts.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #1a2330' }}>
                        <td style={{ ...td, color: '#6c7f8f', fontWeight: 700 }}>{r.sequence}</td>
                        <td style={{ ...td, whiteSpace: 'nowrap' }}>{showDate(r.reading_date)}</td>
                        <td style={{ ...td, fontWeight: 600 }}>{r.attendant_name}</td>
                        <td style={{ ...td, textAlign: 'right' }}>{fmt(r.opening_reading)}</td>
                        <td style={{ ...td, textAlign: 'right' }}>{r.closing_reading != null ? fmt(r.closing_reading) : '—'}</td>
                        <td style={{ ...td, textAlign: 'right', color: '#3b82f6' }}>{r.sale_liters != null ? fmt(r.sale_liters) : '—'}</td>
                        <td style={{ ...td, color: '#9aaebf', whiteSpace: 'nowrap' }}>{r.opening_at ? formatInIndiaTime(r.opening_at) : '—'}</td>
                        <td style={{ ...td, color: '#9aaebf', whiteSpace: 'nowrap' }}>{r.closing_at ? formatInIndiaTime(r.closing_at) : '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {ndShifts.length > 0 && (
              <p style={{ fontSize: '10px', color: '#64748b', marginTop: '10px' }}>
                Rows are ordered by calendar day, then opening time on that nozzle (next attendant’s shift follows).
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

const th = {
  padding: '8px 10px',
  textAlign: 'left',
  color: '#9aaebf',
  fontWeight: 600,
  whiteSpace: 'nowrap'
};
const td = { padding: '7px 10px', color: '#eef2f8' };

export default PumpShiftReports;
