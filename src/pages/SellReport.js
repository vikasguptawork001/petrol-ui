import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import { useAuth } from '../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getLocalDateString, formatInIndiaTime, formatDateInIndia } from '../utils/dateUtils';
import * as XLSX from 'xlsx';
import ActionMenu from '../components/ActionMenu';
import Pagination from '../components/Pagination';
import TransactionLoader from '../components/TransactionLoader';
import './Report.css';

const fmt = (v) => Math.round(parseFloat(v || 0) * 100) / 100;

const SellReport = () => {
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [partyFilter, setPartyFilter] = useState('');
  const [nozzleFilter, setNozzleFilter] = useState('');
  const [attendantFilter, setAttendantFilter] = useState('');
  const [sellerParties, setSellerParties] = useState([]);
  const [nozzles, setNozzles] = useState([]);
  const [attendants, setAttendants] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [pagination, setPagination] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [billDetails, setBillDetails] = useState(null);
  const [loadingBill, setLoadingBill] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, nRes, aRes] = await Promise.all([
          apiClient.get(config.api.sellers),
          apiClient.get(config.api.nozzles),
          apiClient.get(config.api.attendants)
        ]);
        setSellerParties(pRes.data.parties || pRes.data.sellers || []);
        setNozzles(nRes.data.nozzles || []);
        setAttendants(aRes.data.attendants || []);
      } catch (e) { /* silent */ }
    };
    load();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchReport(); return () => abortRef.current?.abort(); }, [fromDate, toDate, partyFilter, nozzleFilter, attendantFilter, page, limit]);

  const fetchReport = async () => {
    if (fromDate && toDate && fromDate > toDate) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      setLoading(true);
      const params = { from_date: getLocalDateString(fromDate), to_date: getLocalDateString(toDate), page, limit };
      if (partyFilter) params.seller_party_id = partyFilter;
      if (nozzleFilter) params.nozzle_id = nozzleFilter;
      if (attendantFilter) params.attendant_id = attendantFilter;
      const res = await apiClient.get(config.api.salesReport, { params, signal: ctrl.signal });
      if (!ctrl.signal.aborted) {
        setTransactions(Array.isArray(res.data?.transactions) ? res.data.transactions : []);
        setSummary(res.data?.summary ?? null);
        setPagination(res.data?.pagination ?? null);
      }
    } catch (e) { if (e.name === 'CanceledError' || e.name === 'AbortError') return; }
    finally { if (!abortRef.current?.signal.aborted) setLoading(false); }
  };

  const fetchBillDetails = async (billNumber) => {
    try {
      setLoadingBill(true);
      const res = await apiClient.get(config.api.salesBillDetails(billNumber));
      setBillDetails(res.data);
      setShowBillModal(true);
    } catch (e) { alert('Error fetching bill details.'); }
    finally { setLoadingBill(false); }
  };

  const exportToExcel = () => {
    if (exporting || transactions.length === 0) return;
    setExporting(true);
    try {
      const data = transactions.map(t => ({
        'Date': formatInIndiaTime(t.created_at),
        'Bill Number': t.bill_number,
        'Party': t.party_name,
        'Total (₹)': fmt(t.total_amount),
        'Paid (₹)': fmt(t.paid_amount),
        'Balance (₹)': fmt(t.balance_amount),
        'Status': t.payment_status.replace('_', ' ').toUpperCase()
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sales');
      XLSX.writeFile(wb, `sales_report_${getLocalDateString(fromDate)}_${getLocalDateString(toDate)}.xlsx`);
    } catch (e) { alert('Export failed.'); }
    finally { setExporting(false); }
  };

  const pill = (label, val, color) => (
    <div style={{ background: '#141b26', borderRadius: '8px', padding: '10px 14px', border: `1px solid #2a3340`, borderLeft: `3px solid ${color}`, minWidth: '120px' }}>
      <div style={{ fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '16px', fontWeight: 700, color }}>{val}</div>
    </div>
  );

  const inp = { padding: '5px 8px', fontSize: '11px', background: '#0f151f', border: '1px solid #2a3340', borderRadius: '5px', color: '#eef2f8', outline: 'none' };
  const lbl = { fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px', display: 'block' };

  return (
    <Layout>
      <TransactionLoader isLoading={loading || loadingBill} type="transaction" message={loading ? 'Loading...' : 'Loading bill...'} />
      <div style={{ padding: '10px 14px', maxWidth: '1600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#eef2f8' }}>Sales report</h1>
            </div>
            <p style={{ fontSize: '11px', color: '#9aaebf', margin: '2px 0 0 0' }}>Every bill in the dates you pick — totals, paid amount, and balance</p>
          </div>
          <button
            onClick={exportToExcel}
            disabled={exporting || transactions.length === 0}
            style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 600, background: '#f59a30', border: 'none', borderRadius: '5px', cursor: transactions.length === 0 ? 'not-allowed' : 'pointer', color: '#1a1200', opacity: transactions.length === 0 ? 0.5 : 1 }}
          >
            Export Excel
          </button>
        </div>

        {/* Filters - compact single row */}
        <div style={{ background: '#0f151f', border: '1px solid #2a3340', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
            <div>
              <label style={lbl}>From</label>
              <DatePicker selected={fromDate} onChange={d => { setFromDate(d); if (d && toDate && d > toDate) setToDate(d); }} dateFormat="dd-MM-yy" maxDate={toDate} style={inp} className="pp-datepicker-compact" />
            </div>
            <div>
              <label style={lbl}>To</label>
              <DatePicker selected={toDate} onChange={d => { setToDate(d); if (d && fromDate && d < fromDate) setFromDate(d); }} dateFormat="dd-MM-yy" minDate={fromDate} style={inp} className="pp-datepicker-compact" />
            </div>
            <div>
              <label style={lbl}>Party</label>
              <select value={partyFilter} onChange={e => { setPartyFilter(e.target.value); setPage(1); }} style={inp}>
                <option value="">All Parties</option>
                {sellerParties.map(p => <option key={p.id} value={p.id}>{p.party_name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Nozzle</label>
              <select value={nozzleFilter} onChange={e => { setNozzleFilter(e.target.value); setPage(1); }} style={inp}>
                <option value="">All Nozzles</option>
                {nozzles.filter(n => !n.is_archived).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Attendant</label>
              <select value={attendantFilter} onChange={e => { setAttendantFilter(e.target.value); setPage(1); }} style={inp}>
                <option value="">All Attendants</option>
                {attendants.filter(a => !a.is_archived).map(a => <option key={a.id} value={a.id}>{a.name || `Att. ${a.id}`}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Per Page</label>
              <select value={limit >= (pagination?.totalRecords || 0) ? 'all' : limit} onChange={e => { setLimit(e.target.value === 'all' ? (pagination?.totalRecords || 10000) : Number(e.target.value)); setPage(1); }} style={inp} disabled={loading}>
                <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option><option value={200}>200</option>
                <option value="all">All ({pagination?.totalRecords || 0})</option>
              </select>
            </div>
            <button onClick={() => { setFromDate(new Date()); setToDate(new Date()); setPartyFilter(''); setNozzleFilter(''); setAttendantFilter(''); setPage(1); setLimit(50); }} style={{ padding: '5px 12px', fontSize: '11px', background: 'transparent', border: '1px solid #2a3340', borderRadius: '5px', cursor: 'pointer', color: '#9aaebf' }}>
              ↺ Reset
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            {pill('Total Sales', `₹${fmt(summary.totalSales).toFixed(2)}`, '#f59a30')}
            {pill('Total Paid', `₹${fmt(summary.totalPaid).toFixed(2)}`, '#22c55e')}
            {pill('Total Balance', `₹${fmt(summary.totalBalance).toFixed(2)}`, '#e8593c')}
            {(user?.role === 'super_admin' || user?.role === 'admin') && summary.totalProfit !== null && summary.totalProfit !== undefined &&
              pill('Total Profit', `₹${fmt(summary.totalProfit).toFixed(2)}`, '#3b82f6')}
            {pill('Transactions', summary.totalTransactions, '#9aaebf')}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9aaebf', fontSize: '13px' }}>Loading...</div>
        ) : (
          <div style={{ background: '#0f151f', border: '1px solid #2a3340', borderRadius: '8px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#0d1320', borderBottom: '1px solid #2a3340' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#9aaebf', fontWeight: 600, whiteSpace: 'nowrap' }}>Date / Time</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Bill No.</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Party</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Paid</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Balance</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Attendant</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: '#9aaebf', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', color: '#9aaebf', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9aaebf' }}>No transactions found</td></tr>
                ) : transactions.map(txn => {
                  const bal = parseFloat(txn.balance_amount || 0);
                  const statusColor = txn.payment_status === 'paid' ? '#22c55e' : txn.payment_status === 'partial' ? '#f59a30' : '#e8593c';
                  return (
                    <tr key={txn.id} style={{ borderBottom: '1px solid #1a2330' }}>
                      <td style={{ padding: '7px 10px', whiteSpace: 'nowrap', color: '#9aaebf' }}>{formatInIndiaTime(txn.created_at)}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: '10px', color: '#eef2f8' }}>{txn.bill_number}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 500, color: '#eef2f8', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.party_name || '—'}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#f59a30' }}>₹{fmt(txn.total_amount).toFixed(2)}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: '#22c55e' }}>₹{fmt(txn.paid_amount).toFixed(2)}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: bal > 0 ? '#e8593c' : '#9aaebf' }}>₹{bal.toFixed(2)}</td>
                      <td style={{ padding: '7px 10px', color: '#9aaebf', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.attendant_name || '—'}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                        <span style={{ background: `${statusColor}20`, color: statusColor, padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {txn.payment_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                        <ActionMenu actions={[{ label: 'View Bill', onClick: () => fetchBillDetails(txn.bill_number) }]} itemId={txn.id} itemName={txn.bill_number} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {pagination && (
              <div style={{ padding: '8px 12px', borderTop: '1px solid #2a3340' }}>
                <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} totalRecords={pagination.totalRecords} showTotalRecords />
              </div>
            )}
          </div>
        )}

        {/* Bill Details Modal */}
        {showBillModal && billDetails && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px' }}>
            <div style={{ background: '#141b26', borderRadius: '10px', width: '100%', maxWidth: '900px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', border: '1px solid #2a3340' }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #2a3340' }}>
                <div>
                  <div style={{ fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bill Details</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#eef2f8', fontFamily: 'monospace' }}>{billDetails.bill_number}</div>
                </div>
                <button onClick={() => { setShowBillModal(false); setBillDetails(null); }} style={{ background: 'none', border: 'none', color: '#9aaebf', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
              </div>

              <div style={{ overflowY: 'auto', flex: 1, padding: '14px 16px' }}>
                {loadingBill ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9aaebf' }}>Loading...</div>
                ) : (
                  <>
                    {/* Bill Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px', marginBottom: '14px' }}>
                      {[
                        { l: 'Transaction Date', v: formatDateInIndia(billDetails.transaction_date) },
                        { l: 'Created At', v: formatInIndiaTime(billDetails.created_at) },
                        billDetails.attendant_name != null && { l: 'Attendant', v: billDetails.attendant_name },
                        billDetails.nozzle_name != null && { l: 'Nozzle', v: billDetails.nozzle_name }
                      ].filter(Boolean).map((item, i) => (
                        <div key={i} style={{ background: '#0f151f', borderRadius: '6px', padding: '8px 10px', border: '1px solid #2a3340' }}>
                          <div style={{ fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', marginBottom: '3px' }}>{item.l}</div>
                          <div style={{ fontSize: '12px', fontWeight: 500, color: '#eef2f8' }}>{item.v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Party Info */}
                    {billDetails.party && (
                      <div style={{ background: '#0f151f', border: '1px solid #2a3340', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
                        <div style={{ fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>Party Information</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '6px', fontSize: '11px' }}>
                          <div><span style={{ color: '#9aaebf' }}>Name: </span><span style={{ color: '#eef2f8', fontWeight: 500 }}>{billDetails.party.party_name}</span></div>
                          <div><span style={{ color: '#9aaebf' }}>Mobile: </span><span style={{ color: '#eef2f8' }}>{billDetails.party.mobile_number || '—'}</span></div>
                          <div><span style={{ color: '#9aaebf' }}>Email: </span><span style={{ color: '#eef2f8' }}>{billDetails.party.email || '—'}</span></div>
                          <div><span style={{ color: '#9aaebf' }}>GST: </span><span style={{ color: '#eef2f8' }}>{billDetails.party.gst_number || '—'}</span></div>
                          {billDetails.party.address && <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#9aaebf' }}>Address: </span><span style={{ color: '#eef2f8' }}>{billDetails.party.address}</span></div>}
                        </div>
                      </div>
                    )}

                    {/* Items Table */}
                    {billDetails.items && billDetails.items.length > 0 && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>Items ({billDetails.items.length})</div>
                        <div style={{ overflowX: 'auto', border: '1px solid #2a3340', borderRadius: '6px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                            <thead>
                              <tr style={{ background: '#0d1320', borderBottom: '1px solid #2a3340' }}>
                                {['S.No', 'Product', 'Brand', 'Tax%', 'Qty', 'Rate', 'Discount', 'Gross', 'GST', 'Net'].map(h => (
                                  <th key={h} style={{ padding: '7px 8px', textAlign: h === 'S.No' ? 'center' : h === 'Product' || h === 'Brand' ? 'left' : 'right', color: '#9aaebf', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {billDetails.items.map((item, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #1a2330' }}>
                                  <td style={{ padding: '6px 8px', textAlign: 'center', color: '#9aaebf' }}>{i + 1}</td>
                                  <td style={{ padding: '6px 8px', fontWeight: 500, color: '#eef2f8', whiteSpace: 'nowrap' }}>{item.product_name}</td>
                                  <td style={{ padding: '6px 8px', color: '#9aaebf' }}>{item.brand || '—'}</td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#9aaebf' }}>{item.tax_rate ?? 0}%</td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#eef2f8' }}>{item.quantity ?? 0}</td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#eef2f8' }}>₹{fmt(item.sale_rate).toFixed(2)}</td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#e8593c' }}>
                                    {item.discount_type === 'percentage' ? `${item.discount_percentage ?? 0}%` : `₹${fmt(item.discount_amount ?? item.discount ?? 0).toFixed(2)}`}
                                  </td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#eef2f8' }}>₹{fmt(item.gross_amount).toFixed(2)}</td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#9aaebf' }}>₹{fmt(item.gst_amount).toFixed(2)}</td>
                                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: '#f59a30' }}>₹{fmt(item.net_amount).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {billDetails.summary && (
                      <div style={{ background: '#0f151f', border: '1px solid #2a3340', borderRadius: '8px', padding: '10px 14px' }}>
                        <div style={{ fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', fontWeight: 600 }}>Bill Summary</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                          {[
                            { l: 'Subtotal', v: `₹${fmt(billDetails.summary.subtotal).toFixed(2)}`, c: '#eef2f8' },
                            { l: 'Discount', v: `₹${fmt(billDetails.summary.discount).toFixed(2)}`, c: '#e8593c' },
                            { l: 'Tax Amount', v: `₹${fmt(billDetails.summary.tax_amount).toFixed(2)}`, c: '#9aaebf' },
                            { l: 'Total Amount', v: `₹${fmt(billDetails.summary.total_amount).toFixed(2)}`, c: '#f59a30' },
                            { l: 'Paid Amount', v: `₹${fmt(billDetails.summary.paid_amount).toFixed(2)}`, c: '#22c55e' },
                            { l: 'Balance', v: `₹${fmt(billDetails.summary.balance_amount).toFixed(2)}`, c: parseFloat(billDetails.summary.balance_amount || 0) > 0 ? '#e8593c' : '#22c55e' },
                            { l: 'Total Qty', v: billDetails.summary.total_quantity ?? 0, c: '#eef2f8' },
                            { l: 'Total Items', v: billDetails.summary.total_items ?? 0, c: '#eef2f8' },
                          ].map((s, i) => (
                            <div key={i}>
                              <div style={{ fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', marginBottom: '2px' }}>{s.l}</div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: s.c }}>{s.v}</div>
                            </div>
                          ))}
                          <div>
                            <div style={{ fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', marginBottom: '2px' }}>Status</div>
                            <span style={{ background: billDetails.summary.payment_status === 'paid' ? '#22c55e20' : '#f59a3020', color: billDetails.summary.payment_status === 'paid' ? '#22c55e' : '#f59a30', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
                              {(billDetails.summary.payment_status || 'N/A').replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ padding: '10px 16px', borderTop: '1px solid #2a3340', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowBillModal(false); setBillDetails(null); }} style={{ padding: '6px 16px', fontSize: '11px', background: 'transparent', border: '1px solid #2a3340', borderRadius: '5px', cursor: 'pointer', color: '#9aaebf', fontWeight: 500 }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SellReport;
