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
import '../styles/petrolpump-theme.css';

const ItemWiseSellReport = () => {
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [gstFilter, setGstFilter] = useState('all'); // 'all' | 'with_gst' | 'without_gst'
  const [nozzleFilter, setNozzleFilter] = useState(''); // '' = All nozzles, or nozzle id
  const [partyFilter, setPartyFilter] = useState(''); // seller_party_id
  const [attendantFilter, setAttendantFilter] = useState(''); // attendant_id
  const [nozzles, setNozzles] = useState([]);
  const [sellerParties, setSellerParties] = useState([]);
  const [attendants, setAttendants] = useState([]);
  const [itemQuery, setItemQuery] = useState('');
  const [debouncedItemQuery, setDebouncedItemQuery] = useState('');
  const debounceTimerRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [pagination, setPagination] = useState(null);
  
  // Use ref to track and cancel previous requests
  const abortControllerRef = useRef(null);

  // Debounce itemQuery for auto-search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      const trimmedQuery = itemQuery.trim();
      setDebouncedItemQuery(trimmedQuery);
      setPage(1); // Reset to first page when search changes
    }, 1000); // 1 second debounce delay

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [itemQuery]);

  // Validate dates
  const validateDates = () => {
    if (fromDate && toDate && fromDate > toDate) {
      alert('From date cannot be after To date. Please select valid dates.');
      return false;
    }
    return true;
  };

  const params = useMemo(() => {
    const from = getLocalDateString(fromDate);
    const to = getLocalDateString(toDate);
    const p = {
      from_date: from,
      to_date: to,
      gst_filter: gstFilter,
      nozzle_id: nozzleFilter || undefined,
      item_query: debouncedItemQuery?.trim() || undefined,
      page,
      limit
    };
    if (partyFilter) p.seller_party_id = partyFilter;
    if (attendantFilter) p.attendant_id = attendantFilter;
    return p;
  }, [fromDate, toDate, gstFilter, nozzleFilter, partyFilter, attendantFilter, debouncedItemQuery, page, limit]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [nozzlesRes, partiesRes, attendantsRes] = await Promise.all([
          apiClient.get(config.api.nozzles),
          apiClient.get(config.api.sellers),
          apiClient.get(config.api.attendants)
        ]);
        setNozzles(nozzlesRes.data.nozzles || []);
        setSellerParties(partiesRes.data.parties || partiesRes.data.sellers || []);
        setAttendants(attendantsRes.data.attendants || []);
      } catch (e) {
        console.error('Error fetching filter options:', e);
      }
    };
    fetchOptions();
  }, []);

  const fetchReport = async () => {
    if (!validateDates()) {
      return;
    }
    
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      setLoading(true);
      const response = await apiClient.get(config.api.itemWiseSalesReport, { 
        params,
        signal: abortController.signal
      });
      
      // Only update state if request wasn't aborted
      if (!abortController.signal.aborted) {
        setRows(response.data.items || []);
        setSummary(response.data.summary || null);
        setPagination(response.data.pagination || null);
      }
    } catch (error) {
      // Ignore abort errors
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return;
      }
      console.error('Error fetching item-wise sales report:', error);
      alert('Error fetching item-wise sales report');
    } finally {
      // Only update loading state if this is still the current request
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const exportToExcel = () => {
    if (rows.length === 0) return;
    
    try {
      // Export only the data currently showing on screen (visible/filtered data)
      const data = rows.map(r => ({
        'Product': r.product_name,
        'Brand': r.brand || '-',
        'HSN': r.hsn_number || '-',
        'Tax %': Math.round(Number(r.tax_rate || 0) * 100) / 100,
        'Qty': Number(r.total_quantity || 0).toFixed(0),
        'Gross': Math.round(Number(r.gross_amount || 0) * 100) / 100,
        'Discount': Math.round(Number(r.discount_amount || 0) * 100) / 100,
        'Taxable/Net': Math.round(Number(r.taxable_or_net_amount || 0) * 100) / 100,
        'GST': Math.round(Number(r.gst_amount || 0) * 100) / 100,
        'Net': Math.round(Number(r.net_amount || 0) * 100) / 100,
        'Bills': r.bills_count
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      
      // Calculate column widths based on content
      const colWidths = [];
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxWidth = 10;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[cellAddress];
          if (cell && cell.v) {
            const cellValue = String(cell.v);
            const cellLength = cellValue.length;
            if (cellLength > maxWidth) {
              maxWidth = cellLength;
            }
          }
        }
        colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
      }
      ws['!cols'] = colWidths;
      
      // Apply text wrapping and auto row height to all cells
      if (!ws['!rows']) ws['!rows'] = [];
      for (let R = range.s.r; R <= range.e.r; ++R) {
        if (!ws['!rows'][R]) ws['!rows'][R] = {};
        ws['!rows'][R].hpt = undefined; // Auto height
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;
          if (!ws[cellAddress].s) ws[cellAddress].s = {};
          ws[cellAddress].s.wrapText = true;
          ws[cellAddress].s.alignment = { wrapText: true, vertical: 'top' };
        }
      }
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Item Wise Sales');
      
      const from = getLocalDateString(fromDate);
      const to = getLocalDateString(toDate);
      XLSX.writeFile(wb, `item_wise_sales_${from}_${to}.xlsx`);
      alert('Excel file exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export. Please try again.');
    }
  };

  useEffect(() => {
    if (validateDates()) {
      fetchReport();
    }
    // Cleanup: cancel request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.from_date, params.to_date, params.gst_filter, params.nozzle_id, params.seller_party_id, params.attendant_id, params.item_query, params.page, params.limit]);

  return (
    <Layout>
      <TransactionLoader isLoading={loading} type="transaction" message="Loading item-wise sales report..." />
      <div className="report">
        <div className="pp-page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>📦</span>
              <h2 style={{ color: '#fff', margin: 0 }}>Item-wise Sell Report</h2>
            </div>
            <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Direct item sales summary. Track profit and quantity sold per product.</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={exportToExcel} 
              className="btn btn-pp-primary"
              disabled={rows.length === 0 || loading}
              style={{ padding: '10px 20px', fontWeight: '600' }}
            >
              📁 Export to Excel
            </button>
          </div>
        </div>

        <div className="card">
          <div className="date-filters">
            <div className="form-group">
              <label>From Date</label>
              <DatePicker
                selected={fromDate}
                onChange={(date) => setFromDate(date)}
                dateFormat="dd-MM-yyyy"
                className="date-input"
              />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <DatePicker
                selected={toDate}
                onChange={(date) => setToDate(date)}
                dateFormat="dd-MM-yyyy"
                className="date-input"
              />
            </div>
            <div className="form-group">
              <label>GST Filter</label>
              <select
                value={gstFilter}
                onChange={(e) => setGstFilter(e.target.value)}
                className="date-input"
              >
                <option value="all">All Bills</option>
                <option value="with_gst">With GST</option>
                <option value="without_gst">Without GST</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nozzle</label>
              <select
                value={nozzleFilter}
                onChange={(e) => { setNozzleFilter(e.target.value || ''); setPage(1); }}
                className="date-input"
              >
                <option value="">All nozzles</option>
                {(nozzles || []).filter(n => !n.is_archived).map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Party</label>
              <select
                value={partyFilter}
                onChange={(e) => { setPartyFilter(e.target.value || ''); setPage(1); }}
                className="date-input"
              >
                <option value="">All parties</option>
                {(sellerParties || []).map(p => (
                  <option key={p.id} value={p.id}>{p.party_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Attendant</label>
              <select
                value={attendantFilter}
                onChange={(e) => { setAttendantFilter(e.target.value || ''); setPage(1); }}
                className="date-input"
              >
                <option value="">All attendants</option>
                {(attendants || []).filter(a => !a.is_archived).map(a => (
                  <option key={a.id} value={a.id}>{a.name || `Attendant ${a.id}`}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Item Search</label>
              <input
                className="date-input"
                placeholder="Product / Brand / HSN..."
                value={itemQuery}
                onChange={(e) => setItemQuery(e.target.value)}
              />
            </div>

            <button 
              onClick={() => { 
                setFromDate(new Date());
                setToDate(new Date());
                setGstFilter('all');
                setNozzleFilter('');
                setPartyFilter('');
                setAttendantFilter('');
                setItemQuery('');
                setDebouncedItemQuery('');
                setPage(1);
                setLimit(50);
              }} 
              className="btn btn-primary"
            >
              Refresh
            </button>
            <div className="form-group">
              <label>Records per page</label>
              <select
                value={limit >= (pagination?.totalRecords || 0) ? 'all' : limit}
                onChange={(e) => { 
                  const newLimit = e.target.value === 'all' ? (pagination?.totalRecords || 10000) : Number(e.target.value);
                  setLimit(newLimit); 
                  setPage(1); 
                }}
                className="date-input"
                disabled={loading}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value="all">All ({pagination?.totalRecords || 0} records)</option>
              </select>
            </div>
          </div>
        </div>

        {summary && (
          <div className="card summary-card">
            <h3>Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <label>Total Items:</label>
                <span>{summary.totalItems}</span>
              </div>
              <div className="summary-item">
                <label>Total Quantity:</label>
                <span>{Number(summary.totalQuantity || 0).toFixed(0)}</span>
              </div>
              <div className="summary-item">
                <label>Gross Amount:</label>
                <span>₹{Number(summary.totalGross || 0).toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <label>Total Discount:</label>
                <span>₹{Number(summary.totalDiscount || 0).toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <label>Total GST:</label>
                <span>₹{Number(summary.totalGst || 0).toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <label>Net Amount:</label>
                <span>₹{Number(summary.totalNet || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="table-container">
            <table className="table item-wise-sell-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 8px' }}>Product</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px' }}>Brand</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px' }}>HSN</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px' }}>Tax %</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px' }}>Gross</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px' }}>Discount</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px' }}>Taxable/Net</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px' }}>GST</th>
                  <th style={{ textAlign: 'right', padding: '12px 8px' }}>Net</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', minWidth: '70px' }}>Bills</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '12px 8px' }}>
                      No records found
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.item_id}>
                      <td style={{ textAlign: 'left', padding: '12px 8px' }}>{r.product_name}</td>
                      <td style={{ textAlign: 'left', padding: '12px 8px' }}>{r.brand || '-'}</td>
                      <td style={{ textAlign: 'left', padding: '12px 8px' }}>{r.hsn_number || '-'}</td>
                      <td style={{ textAlign: 'right', padding: '12px 8px' }}>{Number(r.tax_rate || 0).toFixed(2)}%</td>
                      <td style={{ textAlign: 'right', padding: '12px 8px' }}>{Number(r.total_quantity || 0).toFixed(0)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 8px' }}>₹{Number(r.gross_amount || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 8px' }}>₹{Number(r.discount_amount || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 8px' }}>₹{Number(r.taxable_or_net_amount || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 8px' }}>₹{Number(r.gst_amount || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '12px 8px' }}>₹{Number(r.net_amount || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'center', padding: '12px 8px' }}>{r.bills_count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {pagination && !loading && (
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={(newPage) => {
                  if (!loading) {
                    setPage(newPage);
                  }
                }}
                totalRecords={pagination.totalRecords}
                showTotalRecords={true}
              />
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ItemWiseSellReport;



