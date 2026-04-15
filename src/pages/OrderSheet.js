import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import { getLocalDateString } from '../utils/dateUtils';
import * as XLSX from 'xlsx';
import Pagination from '../components/Pagination';
import TransactionLoader from '../components/TransactionLoader';
import './OrderSheet.css';
import '../styles/petrolpump-theme.css';

// Minimal Icons
const Icon = ({ name, size = 14 }) => {
  const icons = {
    order: <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /><rect x="8" y="3" width="8" height="4" rx="1" /></>,
    export: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
    alert: <><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></>,
    chevronUp: <polyline points="18 15 12 9 6 15" />
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      {icons[name]}
    </svg>
  );
};

const OrderSheet = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [pagination, setPagination] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    fetchOrders();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const fetchOrders = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      setLoading(true);
      const response = await apiClient.get(config.api.orders, {
        params: { page, limit },
        signal: abortController.signal
      });
      
      if (!abortController.signal.aborted) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') {
        return;
      }
      console.error('Error fetching orders:', error);
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const exportToExcel = () => {
    if (exporting || orders.length === 0) return;
    
    setExporting(true);
    try {
      const startSerial = (page - 1) * limit;
      const data = orders.map((order, index) => ({
        'S.No': startSerial + index + 1,
        'Product Name': order.product_name,
        'Brand': order.brand || 'N/A',
        'Current Quantity': order.current_quantity,
        'Alert Quantity': order.alert_quantity || 0,
        'Reorder Required': order.current_quantity <= (order.alert_quantity || 0) ? 'Yes' : 'No'
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const colWidths = [{ wch: 8 }, { wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
      ws['!cols'] = colWidths;
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Order Sheet');
      XLSX.writeFile(wb, `order_sheet_${getLocalDateString()}.xlsx`);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <Layout>
      <TransactionLoader isLoading={loading} type="transaction" message="Loading order sheet..." />
      
      <div style={{ padding: '8px 12px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="order" size={18} />
              <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#fff' }}>Order Sheet</h1>
            </div>
            <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '2px 0 0 0' }}>Items requiring restock based on alert quantity</p>
          </div>
          <button 
            onClick={exportToExcel} 
            disabled={exporting || orders.length === 0 || loading}
            style={{ padding: '6px 12px', background: '#1d9e75', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Icon name="export" size={12} /> Export
          </button>
        </div>

        {/* Info Banner - Compact */}
        <div style={{ background: '#f59a3010', borderLeft: '3px solid #f59a30', padding: '6px 10px', borderRadius: '4px', marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: '#f59a30', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="alert" size={12} />
            <span>Items are automatically added when quantity reaches or falls below alert quantity</span>
          </div>
        </div>

        {/* Controls - Compact */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f151f', padding: '4px 8px', borderRadius: '6px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Show:</span>
            <select
              value={limit >= (pagination?.totalRecords || 0) ? 'all' : limit}
              onChange={(e) => { 
                const newLimit = e.target.value === 'all' ? (pagination?.totalRecords || 10000) : Number(e.target.value);
                setLimit(newLimit); 
                setPage(1); 
              }}
              disabled={loading}
              style={{ padding: '4px 8px', background: '#0f151f', border: '1px solid #2a3340', borderRadius: '4px', color: '#fff', fontSize: '11px' }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value="all">All ({pagination?.totalRecords || 0})</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading...</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid #2a3340' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#0f151f' }}>
                    <th style={{ padding: '8px 8px', textAlign: 'center', width: '50px' }}>S.No</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Product Name</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Brand</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center', width: '100px' }}>Current Qty</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center', width: '90px' }}>Alert Qty</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center', width: '90px' }}>Reorder</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#6c7f8f' }}>
                        No pending orders — all stock levels are healthy
                      </td>
                    </tr>
                  ) : (
                    orders.map((order, index) => {
                      const isLow = order.current_quantity <= (order.alert_quantity || 0);
                      return (
                        <tr key={order.id} style={{ borderBottom: '1px solid #2a3340' }}>
                          <td style={{ padding: '8px 8px', textAlign: 'center', color: '#6c7f8f' }}>{(page - 1) * limit + index + 1}</td>
                          <td style={{ padding: '8px 8px', fontWeight: 500 }}>{order.product_name}</td>
                          <td style={{ padding: '8px 8px', color: '#9aaebf' }}>{order.brand || '—'}</td>
                          <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: isLow ? '#e8593c20' : '#1d9e7520',
                              color: isLow ? '#e8593c' : '#1d9e75',
                              fontWeight: 600,
                              fontSize: '11px'
                            }}>
                              {order.current_quantity}
                            </span>
                          </td>
                          <td style={{ padding: '8px 8px', textAlign: 'center', color: '#9aaebf' }}>{order.alert_quantity || 0}</td>
                          <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: isLow ? '#e8593c20' : '#2a3340',
                              color: isLow ? '#e8593c' : '#6c7f8f',
                              fontSize: '10px',
                              fontWeight: 500
                            }}>
                              {isLow ? 'Reorder Needed' : 'Sufficient'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div style={{ marginTop: '12px' }}>
                <Pagination
                  currentPage={page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                  totalRecords={pagination.totalRecords}
                  showTotalRecords
                />
              </div>
            )}

            {/* Summary Footer */}
            {orders.length > 0 && (
              <div style={{ marginTop: '12px', padding: '8px 12px', background: '#0f151f', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#94a3b8' }}>Total Items to Reorder:</span>
                <span style={{ fontWeight: 700, color: '#e8593c' }}>{orders.filter(o => o.current_quantity <= (o.alert_quantity || 0)).length}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button onClick={scrollToTop} style={scrollBtnStyle}>
          <Icon name="chevronUp" size={16} />
        </button>
      )}
    </Layout>
  );
};

const scrollBtnStyle = {
  position: 'fixed', bottom: '16px', right: '16px', width: '32px', height: '32px',
  borderRadius: '50%', background: '#f59a30', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 999
};

export default OrderSheet;