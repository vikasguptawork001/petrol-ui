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

const SellReport = () => {
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gstFilter, setGstFilter] = useState('all'); // 'all', 'with_gst', 'without_gst'
  const [partyFilter, setPartyFilter] = useState(''); // seller_party_id
  const [nozzleFilter, setNozzleFilter] = useState(''); // nozzle_id
  const [attendantFilter, setAttendantFilter] = useState(''); // attendant_id
  const [sellerParties, setSellerParties] = useState([]);
  const [nozzles, setNozzles] = useState([]);
  const [attendants, setAttendants] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [pagination, setPagination] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showBillDetailsModal, setShowBillDetailsModal] = useState(false);
  const [billDetails, setBillDetails] = useState(null);
  const [loadingBillDetails, setLoadingBillDetails] = useState(false);
  
  // Use refs to track and cancel previous requests
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [partiesRes, nozzlesRes, attendantsRes] = await Promise.all([
          apiClient.get(config.api.sellers),
          apiClient.get(config.api.nozzles),
          apiClient.get(config.api.attendants)
        ]);
        setSellerParties(partiesRes.data.parties || partiesRes.data.sellers || []);
        setNozzles(nozzlesRes.data.nozzles || []);
        setAttendants(attendantsRes.data.attendants || []);
      } catch (e) {
        console.error('Error fetching filter options:', e);
      }
    };
    fetchOptions();
  }, []);

  // Validate dates
  const validateDates = () => {
    if (fromDate && toDate && fromDate > toDate) {
      alert('From date cannot be after To date. Please select valid dates.');
      return false;
    }
    return true;
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
  }, [fromDate, toDate, gstFilter, partyFilter, nozzleFilter, attendantFilter, page, limit]);

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
      const from = getLocalDateString(fromDate);
      const to = getLocalDateString(toDate);
      const params = { from_date: from, to_date: to, gst_filter: gstFilter, page, limit };
      if (partyFilter) params.seller_party_id = partyFilter;
      if (nozzleFilter) params.nozzle_id = nozzleFilter;
      if (attendantFilter) params.attendant_id = attendantFilter;
      const response = await apiClient.get(config.api.salesReport, {
        params,
        signal: abortController.signal
      });
      
      // Only update state if request wasn't aborted
      if (!abortController.signal.aborted) {
        setTransactions(response.data.transactions);
        setSummary(response.data.summary);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      // Ignore abort errors
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return;
      }
      console.error('Error fetching report:', error);
    } finally {
      // Only update loading state if this is still the current request
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const fetchBillDetails = async (billNumber) => {
    try {
      setLoadingBillDetails(true);
      const response = await apiClient.get(config.api.salesBillDetails(billNumber));
      setBillDetails(response.data);
      setShowBillDetailsModal(true);
    } catch (error) {
      console.error('Error fetching bill details:', error);
      alert('Error fetching bill details. Please try again.');
    } finally {
      setLoadingBillDetails(false);
    }
  };

  const exportToExcel = () => {
    if (exporting || transactions.length === 0) return;
    
    setExporting(true);
    try {
      // Export only the data currently showing on screen (visible/filtered data)
      const data = transactions.map(txn => ({
        'Date': new Date(txn.created_at).toLocaleString(),
        'Bill Number': txn.bill_number,
        'Party Name': txn.party_name,
        'Total Amount': Math.round(parseFloat(txn.total_amount || 0) * 100) / 100,
        'Paid Amount': Math.round(parseFloat(txn.paid_amount || 0) * 100) / 100,
        'Balance Amount': Math.round(parseFloat(txn.balance_amount || 0) * 100) / 100,
        'Payment Status': txn.payment_status.replace('_', ' ').toUpperCase(),
        'GST': txn.with_gst ? 'GST' : 'Non-GST'
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
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
      
      const from = getLocalDateString(fromDate);
      const to = getLocalDateString(toDate);
      XLSX.writeFile(wb, `sales_report_${from}_${to}.xlsx`);
      alert('Excel file exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <TransactionLoader isLoading={loading || loadingBillDetails} type="transaction" message={loading ? 'Loading sales report...' : loadingBillDetails ? 'Loading bill details...' : ''} />
      <div className="report">
        <div className="report-header">
          <h2>Sell Report</h2>
          <button 
            onClick={exportToExcel} 
            className="btn btn-success"
            disabled={exporting || transactions.length === 0}
            style={{
              opacity: (exporting || transactions.length === 0) ? 0.6 : 1,
              cursor: (exporting || transactions.length === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            {exporting ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>

        <div className="card">
          <div className="date-filters">
            <div className="form-group">
              <label>From Date</label>
              <DatePicker
                selected={fromDate}
                onChange={(date) => {
                  setFromDate(date);
                  // Auto-adjust toDate if fromDate is after toDate
                  if (date && toDate && date > toDate) {
                    setToDate(date);
                  }
                }}
                dateFormat="dd-MM-yyyy"
                className="date-input"
                maxDate={toDate}
              />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <DatePicker
                selected={toDate}
                onChange={(date) => {
                  setToDate(date);
                  // Auto-adjust fromDate if toDate is before fromDate
                  if (date && fromDate && date < fromDate) {
                    setFromDate(date);
                  }
                }}
                dateFormat="dd-MM-yyyy"
                className="date-input"
                minDate={fromDate}
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
              <label>Party</label>
              <select
                value={partyFilter}
                onChange={(e) => { setPartyFilter(e.target.value || ''); setPage(1); }}
                className="date-input"
              >
                <option value="">All Parties</option>
                {sellerParties.map(p => (
                  <option key={p.id} value={p.id}>{p.party_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Nozzle</label>
              <select
                value={nozzleFilter}
                onChange={(e) => { setNozzleFilter(e.target.value || ''); setPage(1); }}
                className="date-input"
              >
                <option value="">All Nozzles</option>
                {(nozzles || []).filter(n => !n.is_archived).map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
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
                <option value="">All Attendants</option>
                {(attendants || []).filter(a => !a.is_archived).map(a => (
                  <option key={a.id} value={a.id}>{a.name || `Attendant ${a.id}`}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => { 
                setFromDate(new Date());
                setToDate(new Date());
                setGstFilter('all');
                setPartyFilter('');
                setNozzleFilter('');
                setAttendantFilter('');
                setPage(1);
                setLimit(50);
              }} 
              className="btn btn-primary"
              disabled={loading}
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
                <label>Total Sales:</label>
                <span>₹{summary.totalSales.toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <label>Total Paid:</label>
                <span>₹{summary.totalPaid.toFixed(2)}</span>
              </div>
              <div className="summary-item">
                <label>Total Balance:</label>
                <span>₹{summary.totalBalance.toFixed(2)}</span>
              </div>
              {user?.role === 'super_admin' && summary.totalProfit !== null && (
                <div className="summary-item">
                  <label>Total Profit:</label>
                  <span>₹{summary.totalProfit.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-item">
                <label>Total Transactions:</label>
                <span>{summary.totalTransactions}</span>
              </div>
              {summary.withGstCount !== undefined && (
                <>
                  <div className="summary-item">
                    <label>With GST Bills:</label>
                    <span>{summary.withGstCount}</span>
                  </div>
                  <div className="summary-item">
                    <label>Without GST Bills:</label>
                    <span>{summary.withoutGstCount}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="table-container">
            <table className="table sell-report-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', padding: '12px 8px' }}>Date / Time</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px' }}>Bill Number</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px' }}>Party Name</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px' }}>Total (₹)</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px' }}>Paid (₹)</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px' }}>Balance (₹)</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px' }}>Attendant</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px' }}>Payment Status</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px' }}>GST</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center' }}>No transactions found</td>
                  </tr>
                ) : (
                  transactions.map((txn) => (
                    <tr key={txn.id}>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{formatInIndiaTime(txn.created_at)}</td>
                      <td style={{ textAlign: 'center' }}>{txn.bill_number}</td>
                      <td style={{ textAlign: 'center' }}>{txn.party_name}</td>
                      <td style={{ textAlign: 'center' }}>₹{parseFloat(txn.total_amount || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>₹{parseFloat(txn.paid_amount || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>₹{parseFloat(txn.balance_amount || 0).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>{txn.attendant_name || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${txn.payment_status}`}>
                          {txn.payment_status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${txn.with_gst ? 'with-gst' : 'without-gst'}`}>
                          {txn.with_gst ? 'GST' : 'Non-GST'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <ActionMenu
                            actions={[
                              {
                                label: 'View',
                                icon: '👁️',
                                onClick: () => fetchBillDetails(txn.bill_number)
                              }
                            ]}
                            itemId={txn.id}
                            itemName={txn.bill_number}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {pagination && (
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                onPageChange={(newPage) => {
                  if (!loading) {
                    setPage(newPage);
                    // Scroll to top when page changes
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                totalRecords={pagination.totalRecords}
                showTotalRecords={true}
              />
            )}
          </div>
        )}

        {/* Bill Details Modal */}
        {showBillDetailsModal && billDetails && (
          <div className="modal-overlay" onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.stopPropagation();
            }
          }}>
            <div className="modal-content" style={{ maxWidth: '1000px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Bill Details - {billDetails.bill_number}</h3>
                <button className="btn-close" onClick={() => {
                  setShowBillDetailsModal(false);
                  setBillDetails(null);
                }}>×</button>
              </div>
              <div className="modal-body">
                {loadingBillDetails ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
                ) : (
                  <>
                    {/* Bill Information */}
                    <div style={{ marginBottom: '30px' }}>
                      <h4 style={{ marginBottom: '15px', color: '#333', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
                        Bill Information
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                        <div>
                          <strong>Bill Number:</strong> {billDetails.bill_number}
                        </div>
                        <div>
                          <strong>Transaction ID:</strong> {billDetails.transaction_id}
                        </div>
                        <div>
                          <strong>Transaction Date:</strong> {formatDateInIndia(billDetails.transaction_date)}
                        </div>
                        <div>
                          <strong>Created At:</strong> {formatInIndiaTime(billDetails.created_at)}
                        </div>
                        {billDetails.attendant_name != null && (
                          <div>
                            <strong>Attendant:</strong> {billDetails.attendant_name}
                          </div>
                        )}
                        {billDetails.nozzle_name != null && (
                          <div>
                            <strong>Nozzle:</strong> {billDetails.nozzle_name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Party Information */}
                    {billDetails.party && (
                      <div style={{ marginBottom: '30px' }}>
                        <h4 style={{ marginBottom: '15px', color: '#333', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
                          Party Information
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                          <div>
                            <strong>Party Name:</strong> {billDetails.party.party_name}
                          </div>
                          <div>
                            <strong>Mobile Number:</strong> {billDetails.party.mobile_number || '-'}
                          </div>
                          <div>
                            <strong>Email:</strong> {billDetails.party.email || '-'}
                          </div>
                          <div>
                            <strong>Address:</strong> {billDetails.party.address || '-'}
                          </div>
                          <div>
                            <strong>GST Number:</strong> {billDetails.party.gst_number || '-'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Items Table */}
                    {billDetails.items && billDetails.items.length > 0 && (
                      <div style={{ marginBottom: '30px' }}>
                        <h4 style={{ marginBottom: '15px', color: '#333', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
                          Items ({billDetails.items.length})
                        </h4>
                        <div style={{ overflowX: 'auto' }}>
                          <table className="table" style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#f8f9fa' }}>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>S.No</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Product Name</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Product Code</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Brand</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>HSN</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Tax Rate</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Qty</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Sale Rate</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Discount</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Gross</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Total</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>GST</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Net</th>
                              </tr>
                            </thead>
                            <tbody>
                              {billDetails.items.map((item, index) => (
                                <tr key={item.item_id} style={{ borderBottom: '1px solid #e9ecef' }}>
                                  <td style={{ padding: '12px', textAlign: 'left', verticalAlign: 'middle' }}>{index + 1}</td>
                                  <td style={{ padding: '12px', textAlign: 'left', verticalAlign: 'middle' }}>{item.product_name}</td>
                                  <td style={{ padding: '12px', textAlign: 'left', verticalAlign: 'middle' }}>{item.product_code || '-'}</td>
                                  <td style={{ padding: '12px', textAlign: 'left', verticalAlign: 'middle' }}>{item.brand || '-'}</td>
                                  <td style={{ padding: '12px', textAlign: 'left', verticalAlign: 'middle' }}>{item.hsn_number || '-'}</td>
                                  <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'middle' }}>{item.tax_rate !== null && item.tax_rate !== undefined ? `${item.tax_rate}%` : '0%'}</td>
                                  <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'middle' }}>{item.quantity !== null && item.quantity !== undefined ? item.quantity : '0'}</td>
                                  <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums' }}>₹{item.sale_rate !== null && item.sale_rate !== undefined 
                                    ? Math.round(parseFloat(item.sale_rate) * 100) / 100 
                                    : '0.00'}</td>
                                  <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums' }}>
                                    {item.discount_type === 'percentage' 
                                      ? `${item.discount_percentage !== null && item.discount_percentage !== undefined ? item.discount_percentage : 0}% (₹${item.discount_amount !== null && item.discount_amount !== undefined ? (Math.round(parseFloat(item.discount_amount) * 100) / 100) : '0.00'})`
                                      : item.discount !== null && item.discount !== undefined && item.discount !== ''
                                        ? `₹${Math.round(parseFloat(item.discount) * 100) / 100}`
                                        : item.discount_amount !== null && item.discount_amount !== undefined && item.discount_amount !== ''
                                          ? `₹${Math.round(parseFloat(item.discount_amount) * 100) / 100}`
                                          : '₹0.00'
                                    }
                                  </td>
                                  <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums' }}>₹{item.gross_amount !== null && item.gross_amount !== undefined 
                                    ? Math.round(parseFloat(item.gross_amount) * 100) / 100 
                                    : '0.00'}</td>
                                  <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums' }}>₹{item.total_amount !== null && item.total_amount !== undefined 
                                    ? Math.round(parseFloat(item.total_amount) * 100) / 100 
                                    : '0.00'}</td>
                                  <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums' }}>₹{item.gst_amount !== null && item.gst_amount !== undefined 
                                    ? Math.round(parseFloat(item.gst_amount) * 100) / 100 
                                    : '0.00'}</td>
                                  <td style={{ padding: '12px', textAlign: 'right', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums' }}>₹{item.net_amount !== null && item.net_amount !== undefined 
                                    ? Math.round(parseFloat(item.net_amount) * 100) / 100 
                                    : '0.00'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {billDetails.summary && (
                      <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ marginBottom: '15px', color: '#333', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
                          Summary
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                          <div>
                            <strong>Subtotal:</strong> ₹{billDetails.summary.subtotal !== null && billDetails.summary.subtotal !== undefined 
                              ? Math.round(parseFloat(billDetails.summary.subtotal) * 100) / 100 
                              : '0.00'}
                          </div>
                          <div>
                            <strong>Discount:</strong> ₹{billDetails.summary.discount !== null && billDetails.summary.discount !== undefined 
                              ? Math.round(parseFloat(billDetails.summary.discount) * 100) / 100 
                              : '0.00'}
                          </div>
                          <div>
                            <strong>Tax Amount:</strong> ₹{billDetails.summary.tax_amount !== null && billDetails.summary.tax_amount !== undefined 
                              ? Math.round(parseFloat(billDetails.summary.tax_amount) * 100) / 100 
                              : '0.00'}
                          </div>
                          <div>
                            <strong>Total Amount:</strong> ₹{billDetails.summary.total_amount !== null && billDetails.summary.total_amount !== undefined 
                              ? Math.round(parseFloat(billDetails.summary.total_amount) * 100) / 100 
                              : '0.00'}
                          </div>
                          <div>
                            <strong>Paid Amount:</strong> ₹{billDetails.summary.paid_amount !== null && billDetails.summary.paid_amount !== undefined 
                              ? Math.round(parseFloat(billDetails.summary.paid_amount) * 100) / 100 
                              : '0.00'}
                          </div>
                          <div>
                            <strong>Balance Amount:</strong> ₹{billDetails.summary.balance_amount !== null && billDetails.summary.balance_amount !== undefined 
                              ? Math.round(parseFloat(billDetails.summary.balance_amount) * 100) / 100 
                              : '0.00'}
                          </div>
                          {billDetails.summary.previous_balance_paid !== null && billDetails.summary.previous_balance_paid !== undefined && (
                            <div>
                              <strong>Previous Balance Paid:</strong> ₹{Math.round(parseFloat(billDetails.summary.previous_balance_paid) * 100) / 100}
                            </div>
                          )}
                          <div>
                            <strong>Payment Status:</strong> 
                            <span className={`status-badge ${billDetails.summary.payment_status || ''}`} style={{ marginLeft: '10px' }}>
                              {billDetails.summary.payment_status ? billDetails.summary.payment_status.replace('_', ' ').toUpperCase() : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <strong>With GST:</strong> {billDetails.summary.with_gst !== null && billDetails.summary.with_gst !== undefined 
                              ? (billDetails.summary.with_gst ? 'Yes' : 'No') 
                              : 'N/A'}
                          </div>
                          <div>
                            <strong>Total Items:</strong> {billDetails.summary.total_items !== null && billDetails.summary.total_items !== undefined 
                              ? billDetails.summary.total_items 
                              : '0'}
                          </div>
                          <div>
                            <strong>Total Quantity:</strong> {billDetails.summary.total_quantity !== null && billDetails.summary.total_quantity !== undefined 
                              ? billDetails.summary.total_quantity 
                              : '0'}
                          </div>
                          <div>
                            <strong>Total Gross:</strong> ₹{billDetails.summary.total_gross !== null && billDetails.summary.total_gross !== undefined 
                              ? Math.round(parseFloat(billDetails.summary.total_gross) * 100) / 100 
                              : '0.00'}
                          </div>
                          <div>
                            <strong>Total Taxable/Net:</strong> ₹{billDetails.summary.total_taxable_or_net !== null && billDetails.summary.total_taxable_or_net !== undefined 
                              ? Math.round(parseFloat(billDetails.summary.total_taxable_or_net) * 100) / 100 
                              : '0.00'}
                          </div>
                          <div>
                            <strong>Total GST:</strong> ₹{billDetails.summary.total_gst !== null && billDetails.summary.total_gst !== undefined 
                              ? Math.round(parseFloat(billDetails.summary.total_gst) * 100) / 100 
                              : '0.00'}
                          </div>
                          <div>
                            <strong>Total Net:</strong> ₹{billDetails.summary.total_net !== null && billDetails.summary.total_net !== undefined 
                              ? Math.round(parseFloat(billDetails.summary.total_net) * 100) / 100 
                              : '0.00'}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#2980b9';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#3498db';
          e.target.style.transform = 'scale(1)';
        }}
        title="Scroll to top"
      >
        ↑
      </button>
    </Layout>
  );
};

export default SellReport;


