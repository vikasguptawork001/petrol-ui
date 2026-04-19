import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { DueSheetPanel } from './DueSheet';
import { NozzleReadingPanel } from './NozzleReading';
import apiClient from '../config/axios';
import config from '../config/config';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ActionMenu from '../components/ActionMenu';
import Pagination from '../components/Pagination';
import TransactionLoader from '../components/TransactionLoader';
import * as XLSX from 'xlsx';
import { getLocalDateString, formatDateInIndia } from '../utils/dateUtils';
import { validateItemRates } from '../utils/itemRateValidation';
import './Dashboard.css';

// Minimal Icons
const Icon = ({ name, size = 14 }) => {
  const icons = {
    stock: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
    export: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
    filter: <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3" />,
    alert: <><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></>,
    chevronUp: <polyline points="18 15 12 9 6 15" />,
    nozzle: <><path d="M4 22h16" /><path d="M18 4L8 14" /><path d="M6 12l4-4" /><circle cx="19" cy="5" r="2" /></>,
    due: <><path d="M3 6h18" /><path d="M8 6v4" /><path d="M16 6v4" /><rect x="3" y="10" width="18" height="12" rx="2" /><path d="M3 14h18" /></>,
    dashboard: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      {icons[name]}
    </svg>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'items';
  
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchField, setSearchField] = useState('product_name');
  const [sortBy, setSortBy] = useState('product_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState({ product_name: '', unit: '', brand: '', remarks: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuickSaleModal, setShowQuickSaleModal] = useState(false);
  const [quickSaleItem, setQuickSaleItem] = useState(null);
  const [quickSaleQuantity, setQuickSaleQuantity] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [totalStockAmount, setTotalStockAmount] = useState(null);
  const [stockAmountByBrand, setStockAmountByBrand] = useState([]);
  const [showStockAmountModal, setShowStockAmountModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [quickSaleLoading, setQuickSaleLoading] = useState(false);
  const [quickSaleNozzles, setQuickSaleNozzles] = useState([]);
  const [quickSaleAttendants, setQuickSaleAttendants] = useState([]);
  const [quickSaleNozzleId, setQuickSaleNozzleId] = useState('');
  const [quickSaleAttendantId, setQuickSaleAttendantId] = useState('');
  const [quickSaleMetaLoading, setQuickSaleMetaLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [originalItemData, setOriginalItemData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [dueAlertParties, setDueAlertParties] = useState([]);
  const [showDueAlertModal, setShowDueAlertModal] = useState(false);
  const [dueDateEditingId, setDueDateEditingId] = useState(null);
  const [dueDateEditingValue, setDueDateEditingValue] = useState('');
  const [dueDateSaving, setDueDateSaving] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [totalDueAmount, setTotalDueAmount] = useState(0);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    fetchItems();
    return () => window.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!showQuickSaleModal || !quickSaleItem) return undefined;
    let cancelled = false;
    setQuickSaleMetaLoading(true);
    (async () => {
      try {
        const [nRes, aRes] = await Promise.all([
          apiClient.get(config.api.nozzles),
          apiClient.get(config.api.attendants)
        ]);
        if (cancelled) return;
        const nz = (nRes.data.nozzles || []).filter((n) => !n.is_archived);
        const at = (aRes.data.attendants || []).filter((a) => !a.is_archived);
        setQuickSaleNozzles(nz);
        setQuickSaleAttendants(at);
        setQuickSaleNozzleId(nz[0]?.id != null ? String(nz[0].id) : '');
        setQuickSaleAttendantId(at[0]?.id != null ? String(at[0].id) : '');
      } catch (e) {
        if (!cancelled) {
          toast.error('Could not load pumps or staff. Check menu → Pumps & nozzles / Pump staff.');
          setQuickSaleNozzles([]);
          setQuickSaleAttendants([]);
          setQuickSaleNozzleId('');
          setQuickSaleAttendantId('');
        }
      } finally {
        if (!cancelled) setQuickSaleMetaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showQuickSaleModal, quickSaleItem, toast]);

  useEffect(() => {
    if (allItems.length === 0) return;
    setPaginationLoading(true);
    const timer = setTimeout(() => {
      const sourceItems = lowStockOnly
        ? allItems.filter((item) => Number(item.quantity || 0) <= Number(item.alert_quantity || 0))
        : allItems;

      if (!debouncedSearch) {
        if (limit >= sourceItems.length) {
          setItems(sourceItems);
          setTotalPages(1);
        } else {
          setItems(sourceItems.slice((page - 1) * limit, page * limit));
          setTotalPages(Math.ceil(sourceItems.length / limit));
        }
      } else {
        const filtered = sourceItems.filter(item => String(item[searchField] || '').toLowerCase().includes(debouncedSearch.toLowerCase()));
        if (page !== 1) setPage(1);
        else {
          if (limit >= filtered.length) {
            setItems(filtered);
            setTotalPages(1);
          } else {
            setItems(filtered.slice((page - 1) * limit, page * limit));
            setTotalPages(Math.ceil(filtered.length / limit));
          }
        }
      }
      setPaginationLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [debouncedSearch, searchField, allItems, page, limit, lowStockOnly]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      let all = [], p = 1;
      while (true) {
        const res = await apiClient.get(config.api.items, { params: { page: p, limit: 5000 } });
        const data = res.data.items || [];
        all.push(...data);
        if (data.length < 5000) break;
        p++;
      }
      setAllItems(all);
    } catch (err) {
      toast.error('Could not load your stock list. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalStockAmount = async () => {
    try {
      const res = await apiClient.get(config.api.itemsStockTotalByBrand);
      setTotalStockAmount(parseFloat(res.data.total_stock_amount) || 0);
      setStockAmountByBrand(res.data.by_brand || []);
    } catch (err) {}
  };

  useEffect(() => {
    if (user?.role === 'super_admin') fetchTotalStockAmount();
  }, [user]);

  useEffect(() => {
    const loadDueAlerts = async () => {
      if (user?.role !== 'super_admin') return;
      try {
        const res = await apiClient.get(config.api.dueAlerts);
        if (res.data.parties?.length) {
          setDueAlertParties(res.data.parties);
          setShowDueAlertModal(true);
        }
      } catch (err) {}
    };
    loadDueAlerts();
  }, [user]);

  useEffect(() => {
    const fetchDueSummary = async () => {
      if (user?.role !== 'super_admin') {
        setTotalDueAmount(0);
        return;
      }
      try {
        const res = await apiClient.get(config.api.dueSheet, { params: { page: 1, limit: 1 } });
        setTotalDueAmount(Number(res?.data?.summary?.total_balance || 0));
      } catch {
        setTotalDueAmount(0);
      }
    };
    fetchDueSummary();
  }, [user]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const aVal = a[sortBy] || '', bVal = b[sortBy] || '';
      return sortOrder === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
    });
  }, [items, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const handleAdvancedSearch = async () => {
    setSearching(true);
    try {
      const res = await apiClient.post(config.api.itemsAdvancedSearch, advancedSearch);
      setItems(res.data.items || []);
      setTotalPages(1);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const exportToExcel = () => {
    if (exporting || !items.length) return;
    setExporting(true);
    try {
      const data = sortedItems.map((item, idx) => ({
        'S.No': idx + 1,
        'Product Name': item.product_name,
        'Unit': item.unit || '-',
        'Brand': item.brand || '-',
        'Tax (%)': item.tax_rate || 0,
        'Sale Rate': parseFloat(item.sale_rate || 0).toFixed(2),
        'Quantity': item.quantity || 0,
        'Stock Value': (parseFloat(item.purchase_rate || 0) * (item.quantity || 0)).toFixed(2),
        'Alert Qty': item.alert_quantity || 0,
        'Rack No': item.rack_number || '-',
        'Remarks': item.remarks || '-',
        ...(user?.role === 'super_admin' ? { 'Purchase Rate': parseFloat(item.purchase_rate || 0).toFixed(2) } : {})
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Stock Items');
      XLSX.writeFile(wb, lowStockOnly ? 'stock_items_low_stock.xlsx' : 'stock_items.xlsx');
      toast.success('Export successful');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleView = async (item) => {
    setModalLoading(true);
    try {
      const res = await apiClient.get(`${config.api.items}/${item.id}`);
      setViewItem(res.data.item);
      setShowViewModal(true);
    } catch (err) {
      toast.error('Failed to load details');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEdit = async (item) => {
    setModalLoading(true);
    try {
      const res = await apiClient.get(`${config.api.items}/${item.id}`);
      const fullItem = res.data.item;
      setEditingItem(item);
      const original = {
        product_name: fullItem.product_name,
        unit: fullItem.unit || '',
        brand: fullItem.brand || '',
        tax_rate: fullItem.tax_rate || 18,
        sale_rate: fullItem.sale_rate || 0,
        min_sale_rate: fullItem.min_sale_rate || null,
        purchase_rate: fullItem.purchase_rate || 0,
        quantity: fullItem.quantity || 0,
        alert_quantity: fullItem.alert_quantity || 0,
        rack_number: fullItem.rack_number || '',
        remarks: fullItem.remarks || ''
      };
      setOriginalItemData(original);
      setEditFormData({ ...original });
      setShowEditModal(true);
    } catch (err) {
      toast.error('Failed to load item');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem || updating) return;
    if (!editFormData.product_name?.trim()) {
      toast.error('Product name required');
      return;
    }
    const rateCheck = validateItemRates({
      sale_rate: editFormData.sale_rate,
      purchase_rate: user?.role === 'super_admin' ? editFormData.purchase_rate : undefined,
      min_sale_rate: editFormData.min_sale_rate,
      productLabel: editFormData.product_name?.trim() || 'Item',
      requirePositivePurchase: user?.role === 'super_admin'
    });
    if (!rateCheck.ok) {
      toast.error(rateCheck.message);
      return;
    }
    const changed = {};
    Object.keys(editFormData).forEach(key => {
      const cur = editFormData[key];
      const orig = originalItemData[key];
      if (cur !== orig && cur !== undefined && cur !== null) changed[key] = cur;
    });
    if (Object.keys(changed).length === 0) {
      toast.info('No changes');
      return;
    }
    setUpdating(true);
    try {
      await apiClient.patch(`${config.api.items}/${editingItem.id}`, changed);
      toast.success('Item updated');
      setShowEditModal(false);
      fetchItems();
      if (user?.role === 'super_admin') fetchTotalStockAmount();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    setDeleting(true);
    try {
      await apiClient.delete(`${config.api.items}/${id}`);
      toast.success('Item deleted');
      fetchItems();
      if (user?.role === 'super_admin') fetchTotalStockAmount();
    } catch (err) {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleQuickSale = async () => {
    const qty = quickSaleQuantity === '' ? NaN : parseInt(quickSaleQuantity, 10);
    if (!quickSaleItem || !Number.isFinite(qty) || qty <= 0) {
      toast.error('Enter a valid quantity (at least 1)');
      return;
    }
    if (qty > quickSaleItem.quantity) {
      toast.error(`Insufficient stock. Available: ${quickSaleItem.quantity}`);
      return;
    }
    const nozzleId = parseInt(quickSaleNozzleId, 10);
    const attendantId = parseInt(quickSaleAttendantId, 10);
    if (!Number.isFinite(nozzleId) || nozzleId < 1 || !Number.isFinite(attendantId) || attendantId < 1) {
      toast.error('Select pump (nozzle) and attendant before confirming.');
      return;
    }
    setQuickSaleLoading(true);
    try {
      const retail = await apiClient.get(config.api.sellersRetail);
      const retailParty = retail.data?.party;
      if (!retailParty?.id) {
        toast.error(
          'Retail seller for quick bill is missing. Add a supplier named "quick_sell" (or run DB setup), then try again.'
        );
        return;
      }
      await apiClient.post(config.api.sale, {
        seller_party_id: retailParty.id,
        items: [{ item_id: quickSaleItem.id, quantity: qty, sale_rate: parseFloat(quickSaleItem.sale_rate) }],
        payment_status: 'fully_paid',
        paid_amount: quickSaleItem.sale_rate * qty,
        discount: 0,
        with_gst: false,
        nozzle_id: nozzleId,
        attendant_id: attendantId
      });
      toast.success('Sale completed');
      setShowQuickSaleModal(false);
      fetchItems();
      if (user?.role === 'super_admin') fetchTotalStockAmount();
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.error || err.response?.data?.message || '';
      if (status === 404 || /Retail Seller|quick_sell|retail seller/i.test(String(serverMsg))) {
        toast.error(
          'Quick bill needs a retail supplier: create a party named "quick_sell" under Suppliers (or ask your administrator).'
        );
      } else {
        toast.error(serverMsg || err.message || 'Sale failed');
      }
    } finally {
      setQuickSaleLoading(false);
    }
  };

  const handleSaveDueDate = async (partyId) => {
    if (!dueDateEditingValue) return;
    setDueDateSaving(true);
    try {
      await apiClient.patch(`${config.api.sellers}/${partyId}`, { due_date: dueDateEditingValue });
      const today = getLocalDateString(new Date());
      setDueAlertParties(prev => {
        const updated = prev.map(p => p.id === partyId ? { ...p, due_date: dueDateEditingValue } : p);
        return dueDateEditingValue > today ? updated.filter(p => p.id !== partyId) : updated;
      });
      setDueDateEditingId(null);
      toast.success('Due date updated');
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setDueDateSaving(false);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Render content based on current tab
  const renderContent = () => {
    switch (currentTab) {
      case 'nozzles':
        return <NozzleReadingPanel embedded />;
      case 'creditors':
        return <DueSheetPanel embedded />;
      default:
        return renderStockDashboard();
    }
  };

  const renderStockDashboard = () => (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="stock" size={18} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#fff' }}>Stock & products</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={exportToExcel} disabled={exporting || !items.length} style={{ padding: '6px 12px', background: '#1d9e75', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Icon name="export" size={12} /> Export
          </button>
          {user?.role === 'super_admin' && (
            <button onClick={() => { fetchTotalStockAmount(); setShowStockAmountModal(true); }} style={{ padding: '6px 12px', background: '#3b82f6', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>
              Stock Value
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats - Only stock info, not the duplicate */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px', marginBottom: '12px' }}>
        <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #f59a30' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total Items</div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{allItems.length}</div>
        </div>
        <button
          type="button"
          onClick={() => { setLowStockOnly((prev) => !prev); setPage(1); }}
          style={{
            padding: '8px',
            background: lowStockOnly ? '#e8593c22' : '#0f151f',
            borderRadius: '6px',
            borderLeft: '2px solid #e8593c',
            border: lowStockOnly ? '1px solid #e8593c' : '1px solid #2a3340',
            cursor: 'pointer',
            textAlign: 'left'
          }}
          title="Show only products at or below the alert quantity"
        >
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Low stock</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#e8593c' }}>{allItems.filter(i => i.quantity <= (i.alert_quantity || 0)).length}</div>
        </button>
        <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #22c55e' }} title="Sum of (purchase rate × quantity on hand) for all active products.">
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Stock Value</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e' }}>₹{totalStockAmount?.toFixed(2) || '0'}</div>
          <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>Σ (purchase rate × qty)</div>
        </div>
        <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #3b82f6' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total Qty</div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{allItems.reduce((sum, i) => sum + (i.quantity || 0), 0)}</div>
        </div>
        {user?.role === 'super_admin' && (
          <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #a855f7' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Owed to suppliers</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#c084fc' }}>₹{totalDueAmount.toFixed(2)}</div>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', background: '#0f151f', padding: '4px 8px', borderRadius: '6px', flex: '1 1 200px', minWidth: 0 }}>
          <select value={searchField} onChange={e => setSearchField(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '11px' }}>
            <option value="product_name">Name</option>
            <option value="brand">Brand</option>
            <option value="remarks">Remarks</option>
          </select>
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', flex: 1, outline: 'none' }} />
        </div>
        <button onClick={() => setShowAdvancedSearch(!showAdvancedSearch)} style={{ padding: '4px 10px', background: showAdvancedSearch ? '#f59a30' : '#2a3340', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: showAdvancedSearch ? '#1a1200' : '#9aaebf', fontWeight: showAdvancedSearch ? 700 : 400 }}>
          <Icon name="filter" size={10} /> More filters
        </button>
        <select value={limit >= allItems.length ? 'all' : limit} onChange={e => { setLimit(e.target.value === 'all' ? allItems.length : parseInt(e.target.value)); setPage(1); }} style={{ padding: '4px 8px', background: '#0f151f', border: '1px solid #2a3340', borderRadius: '4px', color: '#fff', fontSize: '11px' }}>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="200">200</option>
          <option value="500">500</option>
          <option value="all">All ({allItems.length})</option>
        </select>
      </div>

      {/* Advanced Search Panel */}
      {showAdvancedSearch && (
        <div style={{ background: '#1a2330', border: '1px solid #2a3340', padding: '12px', borderRadius: '8px', marginBottom: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: '8px', alignItems: 'end' }}>
          <input type="text" placeholder="Product Name" value={advancedSearch.product_name} onChange={e => setAdvancedSearch({ ...advancedSearch, product_name: e.target.value })} style={{ ...inputStyle, color: '#eef2f8', background: '#0f151f', border: '1px solid #2a3340' }} />
          <input type="text" placeholder="Unit" value={advancedSearch.unit} onChange={e => setAdvancedSearch({ ...advancedSearch, unit: e.target.value })} style={{ ...inputStyle, color: '#eef2f8', background: '#0f151f', border: '1px solid #2a3340' }} />
          <input type="text" placeholder="Brand" value={advancedSearch.brand} onChange={e => setAdvancedSearch({ ...advancedSearch, brand: e.target.value })} style={{ ...inputStyle, color: '#eef2f8', background: '#0f151f', border: '1px solid #2a3340' }} />
          <input type="text" placeholder="Remarks" value={advancedSearch.remarks} onChange={e => setAdvancedSearch({ ...advancedSearch, remarks: e.target.value })} style={{ ...inputStyle, color: '#eef2f8', background: '#0f151f', border: '1px solid #2a3340' }} />
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', gridColumn: '1 / -1' }}>
            <button onClick={handleAdvancedSearch} disabled={searching} style={{ padding: '6px 14px', background: '#f59a30', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', color: '#1a1200', fontWeight: 600 }}>{searching ? '...' : 'Search'}</button>
            <button onClick={() => { setAdvancedSearch({ product_name: '', unit: '', brand: '', remarks: '' }); setSearch(''); fetchItems(); }} style={{ padding: '6px 10px', background: '#2a3340', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', color: '#9aaebf' }}>Clear</button>
          </div>
        </div>
      )}

      {/* Floating Pagination Bar */}
      {totalPages > 1 && (
        <div style={floatingPaginationStyle}>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, allItems.length)} of {allItems.length} items
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button onClick={() => setPage(1)} disabled={page === 1} style={{ ...pageBtnStyle, background: '#2a3340' }}>⟪</button>
            <button onClick={() => setPage(page - 1)} disabled={page === 1} style={{ ...pageBtnStyle, background: '#2a3340' }}>⟨</button>
            <span style={{ padding: '4px 12px', background: '#f59a30', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{page}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ {totalPages}</span>
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages} style={{ ...pageBtnStyle, background: '#2a3340' }}>⟩</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ ...pageBtnStyle, background: '#2a3340' }}>⟫</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading...</div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid #2a3340', marginBottom: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#0f151f', position: 'sticky', top: 0 }}>
                <th style={{ padding: '8px 8px', textAlign: 'center', width: '44px' }}>S.No</th>
                <th onClick={() => handleSort('product_name')} style={{ padding: '8px 8px', textAlign: 'left', cursor: 'pointer' }}>Product {sortBy === 'product_name' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th style={{ padding: '8px 8px', textAlign: 'center' }}>Unit</th>
                <th onClick={() => handleSort('brand')} style={{ padding: '8px 8px', textAlign: 'center', cursor: 'pointer' }}>Brand {sortBy === 'brand' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th style={{ padding: '8px 8px', textAlign: 'center' }}>GST %</th>
                <th style={{ padding: '8px 8px', textAlign: 'center' }}>Sale Rate</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Stock</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Rack</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', width: '72px' }}>Actions</th>
               </tr>
              </thead>
              <tbody>
                {sortedItems.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #2a3340', background: item.quantity <= (item.alert_quantity || 0) ? '#e8593c10' : 'transparent' }}>
                    <td style={{ padding: '6px', textAlign: 'center', color: '#6c7f8f' }}>{(page - 1) * limit + idx + 1} </td>
                    <td style={{ padding: '6px', fontWeight: 500, textAlign: 'left' }}>{item.product_name}</td>
                    <td style={{ padding: '6px', color: '#9aaebf', textAlign: 'center' }}>{item.unit || '-'}</td>
                    <td style={{ padding: '6px', color: '#9aaebf', textAlign: 'center' }}>{item.brand || '-'}</td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>{item.tax_rate}%</td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>₹{parseFloat(item.sale_rate).toFixed(2)}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'center', fontWeight: 600, color: item.quantity <= (item.alert_quantity || 0) ? '#e8593c' : '#fff' }}>{item.quantity}</td>
                    <td style={{ padding: '6px 12px', textAlign: 'center', color: '#9aaebf' }}>{item.rack_number || '-'}</td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      <ActionMenu
                        itemId={item.id}
                        itemName={item.product_name}
                        disabled={modalLoading || updating || deleting || quickSaleLoading}
                        actions={[
                          { label: 'View Details', onClick: () => handleView(item) },
                          ...((user?.role === 'admin' || user?.role === 'super_admin') ? [{ label: 'Edit', onClick: () => handleEdit(item) }] : []),
                          { label: 'Quick bill', onClick: () => { setQuickSaleItem(item); setQuickSaleQuantity(1); setShowQuickSaleModal(true); } },
                          ...((user?.role === 'super_admin') ? [{ label: 'Delete', danger: true, onClick: (id, name) => handleDelete(id, name) }] : [])
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Pagination */}
        {totalPages > 1 && (
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalRecords={allItems.length} showTotalRecords />
          </div>
        )}
      </>
    );

  return (
    <Layout>
      <TransactionLoader
        isLoading={
          loading ||
          updating ||
          deleting ||
          quickSaleLoading ||
          paginationLoading ||
          searching ||
          exporting ||
          modalLoading ||
          dueDateSaving
        }
        type="transaction"
      />
      
      <div style={{ padding: '8px 12px', width: '100%', maxWidth: 'min(1680px, 100%)', margin: '0 auto', position: 'relative', boxSizing: 'border-box' }}>


        {/* Tab Content */}
        {renderContent()}
      </div>

      {/* Modals - All remain the same */}
      {showEditModal && editingItem && (
        <div style={modalOverlay}>
          <div className="pp-modal-shell-compact" style={{ ...modalContent, maxWidth: '520px' }}>
            <div style={modalHeader}>
              <div>
                <div style={{ fontSize: '11px', color: '#9aaebf', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Edit Item</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#eef2f8' }}>{editingItem.product_name}</div>
              </div>
              <button onClick={() => setShowEditModal(false)} style={closeBtn}>×</button>
            </div>
            <div style={modalBody} className="pp-modal-scroll-compact">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontSize: '10px', color: '#9aaebf', marginBottom: '4px', textTransform: 'uppercase' }}>Product Name *</div>
                  <input type="text" placeholder="Product Name *" value={editFormData.product_name} onChange={e => setEditFormData({ ...editFormData, product_name: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#9aaebf', marginBottom: '4px', textTransform: 'uppercase' }}>Unit</div>
                  <select value={editFormData.unit} onChange={e => setEditFormData({ ...editFormData, unit: e.target.value })} style={inputStyle}>
                    <option value="">— Select Unit —</option><option value="liter">Liter</option><option value="kg">KG</option><option value="packet">Packet</option><option value="pcs">Pcs</option><option value="box">Box</option><option value="mtr">Meter</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#9aaebf', marginBottom: '4px', textTransform: 'uppercase' }}>Brand</div>
                  <input type="text" placeholder="Brand" value={editFormData.brand} onChange={e => setEditFormData({ ...editFormData, brand: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#9aaebf', marginBottom: '4px', textTransform: 'uppercase' }}>Sale Rate *</div>
                  <input type="number" step="0.01" placeholder="Sale Rate" value={editFormData.sale_rate} onChange={e => setEditFormData({ ...editFormData, sale_rate: parseFloat(e.target.value) || 0 })} style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#9aaebf', marginBottom: '4px', textTransform: 'uppercase' }}>Min sale rate</div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Optional floor"
                    value={editFormData.min_sale_rate === null || editFormData.min_sale_rate === undefined || editFormData.min_sale_rate === '' ? '' : editFormData.min_sale_rate}
                    onChange={e => {
                      const v = e.target.value;
                      setEditFormData({
                        ...editFormData,
                        min_sale_rate: v === '' ? null : parseFloat(v) || 0
                      });
                    }}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#9aaebf', marginBottom: '4px', textTransform: 'uppercase' }}>Tax Rate</div>
                  <select value={editFormData.tax_rate} onChange={e => setEditFormData({ ...editFormData, tax_rate: parseInt(e.target.value) })} style={inputStyle}>
                    <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#9aaebf', marginBottom: '4px', textTransform: 'uppercase' }}>Quantity *</div>
                  <input type="number" placeholder="Quantity" value={editFormData.quantity} onChange={e => setEditFormData({ ...editFormData, quantity: parseInt(e.target.value) || 0 })} style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#9aaebf', marginBottom: '4px', textTransform: 'uppercase' }}>Alert Qty</div>
                  <input type="number" placeholder="Alert Qty" value={editFormData.alert_quantity} onChange={e => setEditFormData({ ...editFormData, alert_quantity: parseInt(e.target.value) || 0 })} style={inputStyle} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#9aaebf', marginBottom: '4px', textTransform: 'uppercase' }}>Rack Number</div>
                  <input type="text" placeholder="Rack Number" value={editFormData.rack_number} onChange={e => setEditFormData({ ...editFormData, rack_number: e.target.value })} style={inputStyle} />
                </div>
                {user?.role === 'super_admin' && (
                  <div>
                    <div style={{ fontSize: '10px', color: '#9aaebf', marginBottom: '4px', textTransform: 'uppercase' }}>Purchase Rate</div>
                    <input type="number" step="0.01" placeholder="Purchase Rate" value={editFormData.purchase_rate} onChange={e => setEditFormData({ ...editFormData, purchase_rate: parseFloat(e.target.value) || 0 })} style={inputStyle} />
                  </div>
                )}
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontSize: '10px', color: '#9aaebf', marginBottom: '4px', textTransform: 'uppercase' }}>Remarks</div>
                  <textarea placeholder="Remarks" value={editFormData.remarks} onChange={e => setEditFormData({ ...editFormData, remarks: e.target.value })} rows="2" style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
            </div>
            <div style={modalFooter}>
              <button onClick={() => setShowEditModal(false)} style={secondaryBtn}>Cancel</button>
              <button onClick={handleUpdate} disabled={updating} style={primaryBtn}>{updating ? 'Updating...' : 'Update Item'}</button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && viewItem && (
        <div style={modalOverlay}>
          <div className="pp-modal-shell-compact" style={{ ...modalContent, maxWidth: '560px' }}>
            <div style={{ ...modalHeader, paddingBottom: '12px', flexDirection: 'column', alignItems: 'flex-start', gap: '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Item Details</div>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: '#eef2f8', lineHeight: 1.2 }}>{viewItem.product_name}</div>
                  {viewItem.brand && <div style={{ fontSize: '12px', color: '#f59a30', marginTop: '3px', fontWeight: 600 }}>Brand: {viewItem.brand}</div>}
                </div>
                <button onClick={() => setShowViewModal(false)} style={closeBtn}>×</button>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                {viewItem.unit && <span style={{ background: '#2a3340', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#9aaebf' }}>Unit: {viewItem.unit}</span>}
                <span style={{ background: viewItem.quantity <= (viewItem.alert_quantity || 0) ? 'rgba(232,89,60,0.2)' : 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: viewItem.quantity <= (viewItem.alert_quantity || 0) ? '#e8593c' : '#22c55e', fontWeight: 700 }}>Stock: {viewItem.quantity}</span>
                {viewItem.rack_number && <span style={{ background: '#2a3340', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#9aaebf' }}>Rack: {viewItem.rack_number}</span>}
              </div>
            </div>
            <div style={modalBody} className="pp-modal-scroll-compact">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div style={{ background: '#0f151f', borderRadius: '6px', padding: '10px 12px', border: '1px solid #2a3340' }}>
                  <div style={labelStyle}>Sale Rate</div>
                  <div style={{ ...valueStyle, color: '#f59a30', fontSize: '16px' }}>₹{parseFloat(viewItem.sale_rate).toFixed(2)}</div>
                </div>
                {user?.role === 'super_admin' && (
                  <div style={{ background: '#0f151f', borderRadius: '6px', padding: '10px 12px', border: '1px solid #2a3340' }}>
                    <div style={labelStyle}>Purchase Rate</div>
                    <div style={{ ...valueStyle, fontSize: '16px' }}>₹{parseFloat(viewItem.purchase_rate || 0).toFixed(2)}</div>
                  </div>
                )}
                {viewItem.min_sale_rate > 0 && (
                  <div style={{ background: '#0f151f', borderRadius: '6px', padding: '10px 12px', border: '1px solid #2a3340' }}>
                    <div style={labelStyle}>Min Sale Rate</div>
                    <div style={valueStyle}>₹{parseFloat(viewItem.min_sale_rate).toFixed(2)}</div>
                  </div>
                )}
                <div style={{ background: '#0f151f', borderRadius: '6px', padding: '10px 12px', border: '1px solid #2a3340' }}>
                  <div style={labelStyle}>Tax Rate</div>
                  <div style={valueStyle}>{viewItem.tax_rate}%</div>
                </div>
                <div style={{ background: '#0f151f', borderRadius: '6px', padding: '10px 12px', border: '1px solid #2a3340' }}>
                  <div style={labelStyle}>Alert Qty</div>
                  <div style={valueStyle}>{viewItem.alert_quantity || 0}</div>
                </div>
                {viewItem.hsn_number && (
                  <div style={{ background: '#0f151f', borderRadius: '6px', padding: '10px 12px', border: '1px solid #2a3340' }}>
                    <div style={labelStyle}>HSN Code</div>
                    <div style={valueStyle}>{viewItem.hsn_number}</div>
                  </div>
                )}
              </div>
              {viewItem.remarks && (
                <div style={{ background: '#0f151f', borderRadius: '6px', padding: '10px 12px', border: '1px solid #2a3340' }}>
                  <div style={labelStyle}>Remarks</div>
                  <div style={{ ...valueStyle, fontSize: '12px', color: '#9aaebf' }}>{viewItem.remarks}</div>
                </div>
              )}
            </div>
            <div style={modalFooter}>
              <button onClick={() => setShowViewModal(false)} style={primaryBtn}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showQuickSaleModal && quickSaleItem && (
        <div style={modalOverlay}>
          <div className="pp-modal-shell-compact" style={{ ...modalContent, maxWidth: '420px' }}>
            <div style={modalHeader}>
              <h3 style={{ fontSize: '14px', margin: 0 }}>Quick bill (walk-in sale)</h3>
              <button onClick={() => setShowQuickSaleModal(false)} style={closeBtn}>×</button>
            </div>
            <div style={modalBody} className="pp-modal-scroll-compact">
              <div><strong>{quickSaleItem.product_name}</strong> {quickSaleItem.brand && `(${quickSaleItem.brand})`}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Rate: ₹{quickSaleItem.sale_rate} | Stock: {quickSaleItem.quantity}</div>

              <div style={{ marginTop: '14px' }}>
                <div style={labelStyle}>Pump (nozzle) *</div>
                <select
                  value={quickSaleNozzleId}
                  onChange={(e) => setQuickSaleNozzleId(e.target.value)}
                  disabled={quickSaleMetaLoading}
                  style={{ ...inputStyle, cursor: quickSaleMetaLoading ? 'wait' : 'pointer' }}
                >
                  <option value="">{quickSaleMetaLoading ? 'Loading…' : 'Select pump'}</option>
                  {quickSaleNozzles.map((n) => (
                    <option key={n.id} value={String(n.id)}>{n.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginTop: '10px' }}>
                <div style={labelStyle}>Attendant *</div>
                <select
                  value={quickSaleAttendantId}
                  onChange={(e) => setQuickSaleAttendantId(e.target.value)}
                  disabled={quickSaleMetaLoading}
                  style={{ ...inputStyle, cursor: quickSaleMetaLoading ? 'wait' : 'pointer' }}
                >
                  <option value="">{quickSaleMetaLoading ? 'Loading…' : 'Select attendant'}</option>
                  {quickSaleAttendants.map((a) => (
                    <option key={a.id} value={String(a.id)}>{a.name || `Staff #${a.id}`}</option>
                  ))}
                </select>
              </div>
              {!quickSaleMetaLoading && quickSaleNozzles.length === 0 && (
                <p style={{ fontSize: '11px', color: '#e8593c', marginTop: '10px', marginBottom: 0 }}>
                  No active pumps found. Add one under <strong>Menu → Pumps &amp; nozzles</strong>.
                </p>
              )}
              {!quickSaleMetaLoading && quickSaleAttendants.length === 0 && (
                <p style={{ fontSize: '11px', color: '#e8593c', marginTop: '8px', marginBottom: 0 }}>
                  No active attendants found. Add one under <strong>Menu → Pump staff</strong>.
                </p>
              )}

              <div style={{ marginTop: '12px' }}>
                <div style={labelStyle}>Quantity</div>
                <input
                  type="number"
                  min={1}
                  max={quickSaleItem.quantity}
                  value={quickSaleQuantity}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '') {
                      setQuickSaleQuantity('');
                      return;
                    }
                    const n = parseInt(v, 10);
                    if (Number.isNaN(n)) return;
                    setQuickSaleQuantity(Math.min(Math.max(1, n), quickSaleItem.quantity));
                  }}
                  style={{ ...inputStyle, marginTop: '4px' }}
                />
              </div>
              <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600 }}>
                Total: ₹
                {(quickSaleItem.sale_rate * (quickSaleQuantity === '' ? 0 : Number(quickSaleQuantity))).toFixed(2)}
              </div>
            </div>
            <div style={modalFooter}>
              <button type="button" onClick={() => setShowQuickSaleModal(false)} style={secondaryBtn}>Cancel</button>
              <button
                type="button"
                onClick={handleQuickSale}
                disabled={
                  quickSaleLoading ||
                  quickSaleMetaLoading ||
                  !quickSaleNozzleId ||
                  !quickSaleAttendantId ||
                  quickSaleNozzles.length === 0 ||
                  quickSaleAttendants.length === 0
                }
                style={primaryBtn}
              >
                {quickSaleLoading ? '...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showStockAmountModal && (
        <div style={modalOverlay}>
          <div className="pp-modal-shell-compact" style={{ ...modalContent, maxWidth: '420px' }}>
            <div style={modalHeader}>
              <h3 style={{ fontSize: '14px', margin: 0 }}>Total Stock Value</h3>
              <button onClick={() => setShowStockAmountModal(false)} style={closeBtn}>×</button>
            </div>
            <div style={modalBody} className="pp-modal-scroll-compact">
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59a30' }}>₹{totalStockAmount?.toFixed(2) || '0.00'}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total value of all inventory</div>
              </div>
              {stockAmountByBrand.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: '#94a3b8' }}>By Brand</div>
                  {stockAmountByBrand.slice(0, 5).map((b, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #2a3340', fontSize: '11px' }}>
                      <span>{b.brand || 'Unbranded'}</span>
                      <span style={{ fontWeight: 600 }}>₹{parseFloat(b.total_stock_amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={modalFooter}>
              <button onClick={() => setShowStockAmountModal(false)} style={primaryBtn}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showDueAlertModal && dueAlertParties.length > 0 && (
        <div style={modalOverlay}>
          <div className="pp-modal-shell-compact" style={{ ...modalContent, maxWidth: '580px' }}>
            <div style={{ ...modalHeader, background: '#e8593c10', borderBottomColor: '#e8593c' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="alert" size={18} />
                <h3 style={{ fontSize: '14px', margin: 0 }}>Suppliers — payment overdue</h3>
              </div>
              <button onClick={() => setShowDueAlertModal(false)} style={closeBtn}>×</button>
            </div>
            <div style={modalBody} className="pp-modal-scroll-compact">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', padding: '8px', background: '#0f151f', borderRadius: '6px' }}>
                <span>{dueAlertParties.length} supplier{dueAlertParties.length !== 1 ? 's' : ''}</span>
                <span style={{ color: '#e8593c', fontWeight: 600 }}>₹{dueAlertParties.reduce((s, p) => s + (parseFloat(p.balance_amount) || 0), 0).toFixed(2)}</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '11px',
                    tableLayout: 'fixed'
                  }}
                >
                  <colgroup>
                    <col style={{ width: '36%' }} />
                    <col style={{ width: '30%' }} />
                    <col style={{ width: '18%' }} />
                    <col style={{ width: '16%' }} />
                  </colgroup>
                  <thead>
                    <tr style={{ background: '#0f151f' }}>
                      <th
                        style={{
                          padding: '8px 10px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: '#9aaebf',
                          verticalAlign: 'bottom'
                        }}
                      >
                        Supplier
                      </th>
                      <th
                        style={{
                          padding: '8px 10px',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: '#9aaebf',
                          verticalAlign: 'bottom'
                        }}
                      >
                        Due Date
                      </th>
                      <th
                        style={{
                          padding: '8px 10px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: '#9aaebf',
                          verticalAlign: 'bottom'
                        }}
                      >
                        Amount
                      </th>
                      <th
                        style={{
                          padding: '8px 10px',
                          textAlign: 'center',
                          fontWeight: 600,
                          color: '#9aaebf',
                          verticalAlign: 'bottom'
                        }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dueAlertParties.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #2a3340' }}>
                        <td style={{ padding: '8px 10px', textAlign: 'left', verticalAlign: 'top' }}>
                          <strong>{p.party_name}</strong>
                          <br />
                          <span style={{ fontSize: '9px', color: '#6c7f8f' }}>{p.mobile_number || ''}</span>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                          {dueDateEditingId === p.id ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                              <input type="date" value={dueDateEditingValue} onChange={e => setDueDateEditingValue(e.target.value)} style={{ ...inputStyle, width: '100px', padding: '2px 4px' }} />
                              <button onClick={() => handleSaveDueDate(p.id)} disabled={dueDateSaving} style={{ padding: '2px 6px', fontSize: '9px', background: '#22c55e', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Save</button>
                              <button onClick={() => { setDueDateEditingId(null); }} style={{ padding: '2px 6px', fontSize: '9px', background: '#2a3340', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '6px' }}>
                              <span>{p.due_date ? formatDateInIndia(p.due_date) : '—'}</span>
                              <button type="button" onClick={() => { setDueDateEditingId(p.id); setDueDateEditingValue(p.due_date || ''); }} style={{ fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer', color: '#f59a30', textDecoration: 'underline', padding: 0 }}>Edit</button>
                            </div>
                          )}
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            textAlign: 'right',
                            fontWeight: 600,
                            color: '#e8593c',
                            fontVariantNumeric: 'tabular-nums',
                            verticalAlign: 'middle'
                          }}
                        >
                          ₹{parseFloat(p.balance_amount).toFixed(2)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <button type="button" onClick={() => navigate('/due-sheet')} style={{ padding: '4px 10px', fontSize: '9px', background: '#3b82f6', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#fff' }}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={modalFooter}>
              <button onClick={() => setShowDueAlertModal(false)} style={secondaryBtn}>Close</button>
              <button onClick={() => { setShowDueAlertModal(false); navigate('/due-sheet'); }} style={primaryBtn}>Open full due list</button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button onClick={scrollToTop} style={scrollBtnStyle}>
          <Icon name="chevronUp" size={16} />
        </button>
      )}
    </Layout>
  );
};

// Styles
const inputStyle = {
  padding: '6px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #2a3340',
  background: '#0f151f', color: '#fff', width: '100%', boxSizing: 'border-box'
};

const pageBtnStyle = {
  padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: 'none', cursor: 'pointer', color: '#fff'
};

const floatingPaginationStyle = {
  position: 'sticky',
  top: '60px',
  zIndex: 100,
  background: '#0f151f',
  borderRadius: '8px',
  marginBottom: '12px',
  padding: '6px 12px',
  border: '1px solid #2a3340',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '8px'
};

const modalOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px'
};

const modalContent = {
  background: '#141b26', borderRadius: '8px', width: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #2a3340'
};

const modalHeader = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #2a3340'
};

const modalBody = { padding: '12px', overflowY: 'auto', flex: 1, minHeight: 0 };
const modalFooter = { padding: '10px 12px', borderTop: '1px solid #2a3340', display: 'flex', justifyContent: 'flex-end', gap: '8px' };
const closeBtn = { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' };
const primaryBtn = { padding: '5px 12px', fontSize: '11px', background: '#f59a30', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 500 };
const secondaryBtn = { padding: '5px 12px', fontSize: '11px', background: 'transparent', border: '1px solid #2a3340', borderRadius: '3px', cursor: 'pointer', color: '#94a3b8' };
const labelStyle = { fontSize: '11px', color: '#9aaebf', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 };
const valueStyle = { fontSize: '14px', fontWeight: 600, color: '#eef2f8' };
const scrollBtnStyle = {
  position: 'fixed', bottom: '16px', right: '16px', width: '32px', height: '32px',
  borderRadius: '50%', background: '#f59a30', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 999
};

export default Dashboard;
