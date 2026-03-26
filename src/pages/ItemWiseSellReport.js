import React, { useEffect, useMemo, useState, useRef } from 'react';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getLocalDateString } from '../utils/dateUtils';
import * as XLSX from 'xlsx';
import Pagination from '../components/Pagination';
import TransactionLoader from '../components/TransactionLoader';
import './Report.css';

const ItemWiseSellReport = () => {
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [nozzleFilter, setNozzleFilter] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [attendantFilter, setAttendantFilter] = useState('');
  const [nozzles, setNozzles] = useState([]);
  const [sellerParties, setSellerParties] = useState([]);
  const [attendants, setAttendants] = useState([]);
  const [itemQuery, setItemQuery] = useState('');
  const [debouncedItemQuery, setDebouncedItemQuery] = useState('');
  const debounceRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [pagination, setPagination] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedItemQuery(itemQuery.trim()); setPage(1); }, 800);
    return () => clearTimeout(debounceRef.current);
  }, [itemQuery]);

  useEffect(() => {
    const load = async () => {
      try {
        const [nRes, pRes, aRes] = await Promise.all([
          apiClient.get(config.api.nozzles),
          apiClient.get(config.api.sellers),
          apiClient.get(config.api.attendants)
        ]);
        setNozzles(nRes.data.nozzles || []);
        setSellerParties(pRes.data.parties || pRes.data.sellers || []);
        setAttendants(aRes.data.attendants || []);
      } catch (e) { /* silent */ }
    };
    load();
  }, []);

  const params = useMemo(() => {
    const p = { from_date: getLocalDateString(fromDate), to_date: getLocalDateString(toDate), gst_filter: 'all', page, limit };
    if (nozzleFilter) p.nozzle_id = nozzleFilter;
    if (partyFilter) p.seller_party_id = partyFilter;
    if (attendantFilter) p.attendant_id = attendantFilter;
    if (debouncedItemQuery) p.item_query = debouncedItemQuery;
    return p;
  }, [fromDate, toDate, nozzleFilter, partyFilter, attendantFilter, debouncedItemQuery, page, limit]);

    useEffect(() => {
      if (fromDate && toDate && fromDate > toDate) return;
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const fetch = async () => {
        try {
          setLoading(true);
          const res = await apiClient.get(config.api.itemWiseSalesReport, { params, signal: ctrl.signal });
          if (!ctrl.signal.aborted) {
            setRows(res.data.items || []);
            setSummary(res.data.summary || null);
            setPagination(res.data.pagination || null);
          }
        } catch (e) { if (e.name === 'CanceledError' || e.name === 'AbortError') return; }
        finally { if (!ctrl.signal.aborted) setLoading(false); }
      };
      fetch();
      return () => ctrl.abort();
    }, [params, fromDate, toDate]);

  const exportToExcel = () => {
    if (!rows.length) return;
    try {
      const data = rows.map(r => ({
        'Product': r.product_name, 'Brand': r.brand || '-', 'HSN': r.hsn_number || '-',
        'Tax%': +Number(r.tax_rate || 0).toFixed(2),
        'Qty': +Number(r.total_quantity || 0).toFixed(0),
        'Gross': +Number(r.gross_amount || 0).toFixed(2),
        'Discount': +Number(r.discount_amount || 0).toFixed(2),
        'Net Sales': +Number(r.taxable_or_net_amount || 0).toFixed(2),
        'GST': +Number(r.gst_amount || 0).toFixed(2),
        'Net': +Number(r.net_amount || 0).toFixed(2),
        'Bills': r.bills_count
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Item-wise Sales');
      XLSX.writeFile(wb, `item_wise_${getLocalDateString(fromDate)}_${getLocalDateString(toDate)}.xlsx`);
    } catch (e) { alert('Export failed.'); }
  };

  const inp = { padding: '5px 8px', fontSize: '11px', background: '#0f151f', border: '1px solid #2a3340', borderRadius: '5px', color: '#eef2f8', outline: 'none' };
  const lbl = { fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px', display: 'block' };
  const fmtN = (v) => +Number(v || 0).toFixed(2);

  return (
    <Layout>
      <TransactionLoader isLoading={loading} type="transaction" message="Loading item-wise report..." />
      <div style={{ padding: '10px 14px', maxWidth: '1600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📦</span>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#eef2f8' }}>Item-wise Sell Report</h1>
            </div>
            <p style={{ fontSize: '11px', color: '#9aaebf', margin: '2px 0 0 0' }}>Sales summary per product with quantity and profit</p>
          </div>
          <button
            onClick={exportToExcel}
            disabled={!rows.length || loading}
            style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 600, background: '#f59a30', border: 'none', borderRadius: '5px', cursor: !rows.length ? 'not-allowed' : 'pointer', color: '#1a1200', opacity: !rows.length ? 0.5 : 1 }}
          >
            📁 Export Excel
          </button>
        </div>

        {/* Filters - compact row */}
        <div style={{ background: '#0f151f', border: '1px solid #2a3340', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
            <div>
              <label style={lbl}>From</label>
              <DatePicker selected={fromDate} onChange={d => setFromDate(d)} dateFormat="dd-MM-yy" className="pp-datepicker-compact" />
            </div>
            <div>
              <label style={lbl}>To</label>
              <DatePicker selected={toDate} onChange={d => setToDate(d)} dateFormat="dd-MM-yy" className="pp-datepicker-compact" />
            </div>
            <div>
              <label style={lbl}>Nozzle</label>
              <select value={nozzleFilter} onChange={e => { setNozzleFilter(e.target.value); setPage(1); }} style={inp}>
                <option value="">All Nozzles</option>
                {nozzles.filter(n => !n.is_archived).map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Party</label>
              <select value={partyFilter} onChange={e => { setPartyFilter(e.target.value); setPage(1); }} style={inp}>
                <option value="">All Parties</option>
                {sellerParties.map(p => <option key={p.id} value={p.id}>{p.party_name}</option>)}
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
              <label style={lbl}>Search Item</label>
              <input style={inp} placeholder="Product / Brand / HSN..." value={itemQuery} onChange={e => setItemQuery(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Per Page</label>
              <select value={limit >= (pagination?.totalRecords || 0) ? 'all' : limit} onChange={e => { setLimit(e.target.value === 'all' ? (pagination?.totalRecords || 10000) : Number(e.target.value)); setPage(1); }} style={inp} disabled={loading}>
                <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option><option value={200}>200</option>
                <option value="all">All ({pagination?.totalRecords || 0})</option>
              </select>
            </div>
            <button onClick={() => { setFromDate(new Date()); setToDate(new Date()); setNozzleFilter(''); setPartyFilter(''); setAttendantFilter(''); setItemQuery(''); setDebouncedItemQuery(''); setPage(1); setLimit(50); }}
              style={{ padding: '5px 12px', fontSize: '11px', background: 'transparent', border: '1px solid #2a3340', borderRadius: '5px', cursor: 'pointer', color: '#9aaebf' }}>
              ↺ Reset
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            {[
              { l: 'Items', v: summary.totalItems, c: '#9aaebf' },
              { l: 'Total Qty', v: Number(summary.totalQuantity || 0).toFixed(0), c: '#eef2f8' },
              { l: 'Gross Amount', v: `₹${fmtN(summary.totalGross).toFixed(2)}`, c: '#f59a30' },
              { l: 'Total Discount', v: `₹${fmtN(summary.totalDiscount).toFixed(2)}`, c: '#e8593c' },
              { l: 'Total GST', v: `₹${fmtN(summary.totalGst).toFixed(2)}`, c: '#9aaebf' },
              { l: 'Net Amount', v: `₹${fmtN(summary.totalNet).toFixed(2)}`, c: '#22c55e' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#141b26', borderRadius: '8px', padding: '10px 14px', border: '1px solid #2a3340', borderLeft: `3px solid ${s.c}`, minWidth: '120px' }}>
                <div style={{ fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{s.l}</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: s.c }}>{s.v}</div>
              </div>
            ))}
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
                  {[
                    { h: 'Product', a: 'left' }, { h: 'Brand', a: 'left' }, { h: 'HSN', a: 'left' },
                    { h: 'Tax%', a: 'right' }, { h: 'Qty', a: 'right' }, { h: 'Gross', a: 'right' },
                    { h: 'Discount', a: 'right' }, { h: 'Net Sales', a: 'right' }, { h: 'GST', a: 'right' },
                    { h: 'Net', a: 'right' }, { h: 'Bills', a: 'center' }
                  ].map(col => (
                    <th key={col.h} style={{ padding: '8px 10px', textAlign: col.a, color: '#9aaebf', fontWeight: 600, whiteSpace: 'nowrap' }}>{col.h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#9aaebf' }}>No records found</td></tr>
                ) : rows.map(r => (
                  <tr key={r.item_id} style={{ borderBottom: '1px solid #1a2330' }}>
                    <td style={{ padding: '7px 10px', fontWeight: 500, color: '#eef2f8' }}>{r.product_name}</td>
                    <td style={{ padding: '7px 10px', color: '#9aaebf' }}>{r.brand || '—'}</td>
                    <td style={{ padding: '7px 10px', color: '#9aaebf', fontFamily: 'monospace', fontSize: '10px' }}>{r.hsn_number || '—'}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: '#9aaebf' }}>{Number(r.tax_rate || 0).toFixed(0)}%</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#eef2f8' }}>{Number(r.total_quantity || 0).toFixed(0)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: '#f59a30' }}>₹{fmtN(r.gross_amount).toFixed(2)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: '#e8593c' }}>₹{fmtN(r.discount_amount).toFixed(2)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: '#eef2f8' }}>₹{fmtN(r.taxable_or_net_amount).toFixed(2)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', color: '#9aaebf' }}>₹{fmtN(r.gst_amount).toFixed(2)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 600, color: '#22c55e' }}>₹{fmtN(r.net_amount).toFixed(2)}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'center', color: '#9aaebf' }}>{r.bills_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination && (
              <div style={{ padding: '8px 12px', borderTop: '1px solid #2a3340' }}>
                <Pagination currentPage={page} totalPages={pagination.totalPages} onPageChange={p => setPage(p)} totalRecords={pagination.totalRecords} showTotalRecords />
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ItemWiseSellReport;
