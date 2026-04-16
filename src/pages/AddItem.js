import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TransactionLoader from '../components/TransactionLoader';
import { validateItemRates } from '../utils/itemRateValidation';
import { STANDARD_SALE_UNITS } from '../utils/saleUnits';
import './AddItem.css';

const AddItem = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const itemSearchInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // New Item Form State
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [newItem, setNewItem] = useState({
    product_name: '',
    unit: 'PCS',
    brand: '',
    tax_rate: 18,
    sale_rate: 0,
    min_sale_rate: 0,
    purchase_rate: 0,
    quantity: 0,
    alert_quantity: 0,
    rack_number: '',
    remarks: ''
  });
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Inline edit: which cell is being edited { rowIndex, field: 'purchase_rate' | 'sale_rate' }
  const [editingCell, setEditingCell] = useState(null);
  const rowInputRefs = useRef({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      alert('Only managers and owners can add products to stock. Ask your administrator if you need access.');
      navigate('/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  // Debounce search query - update debouncedSearchQuery after 1 second of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedQuery = searchQuery.trim();
      setDebouncedSearchQuery(trimmedQuery);
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const trimmedQuery = debouncedSearchQuery.trim();
    if (trimmedQuery.length >= 2) {
      searchItems();
    } else {
      setSuggestedItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery]);

  const searchItems = async () => {
    setIsLoadingItems(true);
    try {
      const trimmedQuery = debouncedSearchQuery.trim();
      const response = await apiClient.get(config.api.itemsSearch, {
        params: { 
          q: trimmedQuery,
          include_purchase_rate: 'true'
        }
      });
      setSuggestedItems(response.data.items);
    } catch (error) {
      console.error('Error searching items:', error);
    } finally {
      setIsLoadingItems(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleToggleItemSelection = (itemId) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // eslint-disable-next-line no-unused-vars
  const handleAddSelectedItems = async () => {
    if (selectedItemIds.size === 0) {
      toast.warning('Please select at least one item');
      return;
    }

    const itemsToAdd = suggestedItems.filter(item => selectedItemIds.has(item.id));
    let successCount = 0;
    let errorCount = 0;
    
    try {
      // Fetch all item details in a single batch API call
      const itemIds = itemsToAdd.map(item => item.id);
      const response = await apiClient.post(config.api.itemsDetails, {
        item_ids: itemIds,
        include_purchase_rate: true
      });

      // Create a map of item_id -> item details for quick lookup
      const itemsDetailsMap = new Map();
      if (response.data && response.data.items) {
        response.data.items.forEach(item => {
          itemsDetailsMap.set(item.id, item);
        });
      }

      const batchDuplicateNames = new Set();
      // Add items to cart using batch API data
      setSelectedItems(prev => {
        const updatedItems = [...prev];
        itemsToAdd.forEach(item => {
          const itemDetails = itemsDetailsMap.get(item.id);
          if (!itemDetails) {
            errorCount++;
            return;
          }

          // Parse tax_rate
          const taxRateValue = itemDetails.tax_rate !== undefined && itemDetails.tax_rate !== null
            ? parseFloat(itemDetails.tax_rate)
            : 18;
          const validTaxRates = [5, 18, 28];
          const finalTaxRate = !isNaN(taxRateValue) && validTaxRates.includes(taxRateValue) 
            ? taxRateValue 
            : 18;

          const existingItemIndex = updatedItems.findIndex(i => i.item_id === item.id);
          if (existingItemIndex >= 0) {
            // If item already in cart, just increment quantity
            const prevQty = updatedItems[existingItemIndex].quantity;
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: prevQty + 1
            };
            batchDuplicateNames.add(itemDetails.product_name);
          } else {
            // Add new item to cart - use search data which now includes purchase_rate
            // Note: current_quantity should be the actual stock from the database
            // The quantity field is the purchase quantity (how many we're buying)
            updatedItems.push({
              item_id: itemDetails.id,
              product_name: itemDetails.product_name,
              unit: itemDetails.unit || '',
              brand: itemDetails.brand || '',
              tax_rate: finalTaxRate,
              sale_rate: parseFloat(itemDetails.sale_rate) || 0,
              min_sale_rate: itemDetails.min_sale_rate != null && itemDetails.min_sale_rate !== '' ? parseFloat(itemDetails.min_sale_rate) : null,
              purchase_rate: parseFloat(itemDetails.purchase_rate) || 0,
              quantity: 1, // Purchase quantity (how many we're buying) - starts at 1
              alert_quantity: 0, // Will be set when submitting
              rack_number: '', // Will be set when submitting
              remarks: '', // Will be set when submitting
              current_quantity: parseInt(itemDetails.quantity) || 0 // Actual stock from database
            });
          }
          successCount++;
        });
        return updatedItems;
      });
      if (batchDuplicateNames.size > 0) {
        const uniq = [...batchDuplicateNames];
        toast.info(
          uniq.length === 1
            ? `"${uniq[0]}" was already in your list — quantity increased.`
            : `${uniq.length} item(s) were already in your list — quantities updated.`
        );
      }
    } catch (error) {
      console.error('Error fetching batch item details:', error);
      toast.error('Error loading item details');
      errorCount += itemsToAdd.length;
    }
    
    if (successCount > 0) {
      toast.success(`Added ${successCount} item${successCount !== 1 ? 's' : ''} to list`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to add ${errorCount} item${errorCount !== 1 ? 's' : ''}`);
    }
    
    setSelectedItemIds(new Set());
    setSearchQuery('');
    setSuggestedItems([]);
  };

  const addItemToCart = async (item) => {
    try {
      // Note: We allow adding items even if out of stock, since this is for filling inventory
      // Use search data directly (which now includes purchase_rate) instead of making another API call
      // The search API already returns all necessary fields including purchase_rate
      
      // Parse tax_rate to ensure it's a number (backend might send it as string)
      const taxRateValue = item.tax_rate !== undefined && item.tax_rate !== null
        ? parseFloat(item.tax_rate)
        : 18;
      const validTaxRates = [5, 18, 28];
      const finalTaxRate = !isNaN(taxRateValue) && validTaxRates.includes(taxRateValue) 
        ? taxRateValue 
        : 18;
      
      const existingItem = selectedItems.find(i => i.item_id === item.id);
      if (existingItem) {
        setSelectedItems(prev => prev.map(i =>
          i.item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ));
        toast.info(`"${item.product_name}" is already in your list — quantity increased by 1.`);
      } else {
        // Add item using search data (which includes purchase_rate)
        // Note: current_quantity should be the actual stock from the database
        // The quantity field is the purchase quantity (how many we're buying)
        setSelectedItems(prev => [...prev, {
          item_id: item.id,
          product_name: item.product_name,
          unit: item.unit || '',
          brand: item.brand || '',
          tax_rate: finalTaxRate, // Use the parsed and validated tax rate
          sale_rate: parseFloat(item.sale_rate) || 0,
          min_sale_rate: item.min_sale_rate != null && item.min_sale_rate !== '' ? parseFloat(item.min_sale_rate) : null,
          purchase_rate: parseFloat(item.purchase_rate) || 0,
          quantity: 1, // Purchase quantity (how many we're buying) - starts at 1
          alert_quantity: 0, // Will be set when submitting
          rack_number: '', // Will be set when submitting
          remarks: '', // Will be set when submitting
          current_quantity: parseInt(item.quantity) || 0 // Actual stock from database (for reference only)
        }]);
      }
      
      // Don't clear search or close modal - allow adding multiple items
      // Keep UX smooth: no toast spam on every item add
    } catch (error) {
      console.error('Error fetching item details:', error);
      toast.error('Error loading item details');
    }
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    setSuggestedItems([]);
    setActiveSuggestionIndex(-1);
  };

  // Close suggestions when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.table-search-wrapper')) {
        setSuggestedItems([]);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        handleSearchClear();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const updateItem = (itemId, field, value) => {
    setSelectedItems(selectedItems.map(item =>
      item.item_id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (itemId) => {
    setSelectedItems(selectedItems.filter(item => item.item_id !== itemId));
  };

  const focusCell = (rowIndex, field) => {
    if (field === 'purchase_rate' || field === 'sale_rate' || field === 'min_sale_rate') {
      setEditingCell({ rowIndex, field });
      setTimeout(() => {
        const el = rowInputRefs.current[`${rowIndex}-${field}`];
        if (el) { el.focus(); el.select?.(); }
      }, 0);
    } else {
      const el = rowInputRefs.current[`${rowIndex}-${field}`];
      if (el) el.focus();
    }
  };

  const focusNext = (rowIndex, currentField) => {
    const next = currentField === 'purchase_rate' ? { rowIndex, field: 'sale_rate' }
      : currentField === 'sale_rate' ? { rowIndex, field: 'min_sale_rate' }
      : currentField === 'min_sale_rate' ? { rowIndex, field: 'quantity' }
      : rowIndex + 1 < selectedItems.length ? { rowIndex: rowIndex + 1, field: 'purchase_rate' }
      : { rowIndex: 0, field: 'purchase_rate' };
    focusCell(next.rowIndex, next.field);
  };

  const handleSaveRates = async () => {
    if (selectedItems.length === 0) {
      toast.warning('No items to save');
      return;
    }
    setIsSaving(true);
    let success = 0;
    let failed = 0;
    try {
      for (const item of selectedItems) {
        try {
          const sale_rate = parseFloat(item.sale_rate) || 0;
          const purchase_rate = parseFloat(item.purchase_rate) || 0;
          const min_sale_rate = item.min_sale_rate != null && item.min_sale_rate !== '' && !isNaN(parseFloat(item.min_sale_rate)) && parseFloat(item.min_sale_rate) >= 0 ? parseFloat(item.min_sale_rate) : null;

          const vr = validateItemRates({
            sale_rate,
            purchase_rate,
            min_sale_rate,
            productLabel: item.product_name,
            requirePositivePurchase: true
          });
          if (!vr.ok) {
            toast.error(vr.message);
            setIsSaving(false);
            return;
          }

          const payload = {
            sale_rate,
            purchase_rate,
            min_sale_rate
          };
          await apiClient.patch(`${config.api.items}/${item.item_id}`, payload);
          success++;
        } catch (e) {
          failed++;
          console.error('Failed to update item', item.item_id, e);
        }
      }
      if (failed === 0) toast.success(`Saved rates for ${success} item(s)`);
      else if (success > 0) toast.warning(`Saved ${success}, failed ${failed}`);
      else toast.error('Failed to save rates');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitPurchase = async () => {
    if (selectedItems.length === 0) {
      toast.warning('No items to purchase');
      return;
    }

    // Validate that all items have required fields
    for (const item of selectedItems) {
      if (!item.purchase_rate || item.purchase_rate <= 0) {
        toast.error(`Purchase rate is required for ${item.product_name}`);
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        toast.error(`Quantity must be greater than 0 for ${item.product_name}`);
        return;
      }

      const vr = validateItemRates({
        sale_rate: item.sale_rate,
        purchase_rate: item.purchase_rate,
        min_sale_rate: item.min_sale_rate,
        productLabel: item.product_name,
        requirePositivePurchase: true
      });
      if (!vr.ok) {
        toast.error(vr.message);
        return;
      }
    }

    setIsSubmittingPurchase(true);
    try {
      // Prepare items for purchase API
      const purchaseItems = selectedItems.map(item => ({
        item_id: item.item_id,
        product_name: item.product_name,
        product_code: item.product_code || '',
        brand: item.brand || '',
        hsn_number: item.hsn_number || '',
        tax_rate: item.tax_rate || 18,
        sale_rate: parseFloat(item.sale_rate) || 0,
        purchase_rate: parseFloat(item.purchase_rate) || 0,
        quantity: parseInt(item.quantity) || 0,
        alert_quantity: parseInt(item.alert_quantity) || 0,
        rack_number: item.rack_number || '',
        remarks: item.remarks || ''
      }));

      // For inventory addition, we don't need a buyer party, so we'll use a dummy or null value
      // The backend should handle inventory-only purchases
      const payload = {
        buyer_party_id: null, // No buyer for inventory addition
        items: purchaseItems,
        payment_status: 'fully_paid', // No payment needed for inventory addition
        paid_amount: 0
      };

      await apiClient.post(config.api.itemsPurchase, payload);

      toast.success(`Successfully added ${selectedItems.length} item(s) to inventory!`);
      
      // Clear the list after successful submission
      setSelectedItems([]);
      setEditingCell(null);
      
    } catch (error) {
      console.error('Purchase submission error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add items to inventory';
      toast.error(errorMessage);
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  const closeAddItemModal = () => {
    setShowAddItemForm(false);
    setNewItem({
      product_name: '',
      unit: 'PCS',
      product_code: '',
      brand: '',
      tax_rate: 18,
      sale_rate: 0,
      min_sale_rate: 0,
      purchase_rate: 0,
      quantity: 0,
      alert_quantity: 0,
      rack_number: '',
      remarks: ''
    });
  };
  const handleAddNewItem = async () => {
    // Validate required fields
    if (!newItem.product_name) {
      toast.warning('Product name is required');
      return;
    }
    if (!newItem.unit || !String(newItem.unit).trim()) {
      toast.warning('Unit is required');
      return;
    }
    const qty = Number(newItem.quantity);
    if (qty < 0 || isNaN(qty)) {
      toast.warning('Valid quantity is required (use 0 or more)');
      return;
    }
    if (!newItem.purchase_rate || newItem.purchase_rate < 0) {
      toast.warning('Purchase rate is required');
      return;
    }
    const vrNew = validateItemRates({
      sale_rate: newItem.sale_rate,
      purchase_rate: newItem.purchase_rate,
      min_sale_rate: newItem.min_sale_rate,
      productLabel: newItem.product_name,
      requirePositivePurchase: true
    });
    if (!vrNew.ok) {
      toast.error(vrNew.message);
      return;
    }

    setIsAddingNewItem(true);
    try {
      const payload = {
        product_name: newItem.product_name,
        unit: String(newItem.unit).trim(),
        brand: newItem.brand || '',
        tax_rate: newItem.tax_rate,
        purchase_rate: newItem.purchase_rate,
        sale_rate: newItem.sale_rate,
        min_sale_rate: (newItem.min_sale_rate !== undefined && newItem.min_sale_rate !== '' && !isNaN(parseFloat(newItem.min_sale_rate)) && parseFloat(newItem.min_sale_rate) >= 0) ? parseFloat(newItem.min_sale_rate) : null,
        quantity: newItem.quantity,
        alert_quantity: newItem.alert_quantity || 0,
        rack_number: newItem.rack_number || '',
        remarks: newItem.remarks || ''
      };
      
      await apiClient.post(config.api.items, payload);

      toast.success(`Product "${newItem.product_name}" created. Add it to your list by searching below.`);
      closeAddItemModal();
      
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      toast.error('Error adding item: ' + errorMessage);
    } finally {
      setIsAddingNewItem(false);
    }
  };


  // Show access denied message if sales user somehow reaches here
  if (user && user.role !== 'admin' && user.role !== 'super_admin') {
    return (
      <Layout>
        <div className="add-item">
          <div style={{ padding: '20px', textAlign: 'center', color: '#ff6b6b' }}>
            <h2>Access Denied</h2>
            <p>Only Admin and Super Admin can add items to inventory.</p>
            <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '20px' }}>
              Go to Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }


  return (
    <Layout>
      <TransactionLoader
        isLoading={isAddingNewItem || isSaving || isSubmittingPurchase || isLoadingItems}
        message={isSaving ? 'Saving changes...' : isSubmittingPurchase ? 'Recording purchase...' : isLoadingItems ? 'Loading...' : undefined}
        type="purchase"
      />
      <div className="add-item">
        <div className="pp-page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Add Item to Inventory</h2>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--pp-text-muted, #6c7f8f)' }}>Search to add existing items, or use the button to create new.</p>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: selectedItems.length > 0 ? '12px' : '0' }}>
            {selectedItems.length > 0 
              ? <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--pp-text-primary, #eef2f8)' }}>Your list ({selectedItems.length} items)</h3>
              : <span style={{ fontSize: '12px', color: 'var(--pp-text-muted, #6c7f8f)' }}>Search below to add existing items to your list</span>
            }
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {selectedItems.length > 0 && (
                <button
                  onClick={() => { if (window.confirm('Clear all items from list?')) { setSelectedItems([]); toast.info('List cleared'); } }}
                  className="btn btn-danger"
                  style={{ minWidth: '120px' }}
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAddItemForm(true)}
                className="btn btn-primary"
                style={{ minWidth: '120px' }}
              >
                + New Item
              </button>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--pp-text-muted, #6c7f8f)', lineHeight: 1.45 }}>
              Set <strong>Quantity</strong> to the units you are adding to stock, then use <strong>Add to inventory (updates stock)</strong>. Use <strong>Save rates only</strong> when you only change prices (no stock change).
            </p>
          )}

          <div className="table-responsive-container">
            <table className="table">
                  <thead style={{ background: '#0d1523' }}>
                    <tr>
                      <th style={{ textAlign: 'center', padding: '10px 8px', width: '48px', color: 'var(--pp-text-secondary, #9aaebf)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>S.No</th>
                      <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--pp-text-secondary, #9aaebf)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Product Details</th>
                      <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--pp-text-secondary, #9aaebf)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Brand</th>
                      <th style={{ textAlign: 'right', padding: '10px 14px', color: 'var(--pp-text-secondary, #9aaebf)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Purchase Rate</th>
                      <th style={{ textAlign: 'right', padding: '10px 14px', color: 'var(--pp-text-secondary, #9aaebf)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Sale Rate</th>
                      <th style={{ textAlign: 'right', padding: '10px 14px', color: 'var(--pp-text-secondary, #9aaebf)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Min Sale Rate</th>
                      <th style={{ textAlign: 'right', padding: '10px 14px', color: 'var(--pp-text-secondary, #9aaebf)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Tax Rate</th>
                      <th style={{ textAlign: 'right', padding: '10px 14px', color: 'var(--pp-text-secondary, #9aaebf)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, width: '90px' }}>Current Qty</th>
                      <th style={{ textAlign: 'right', padding: '10px 14px', color: 'var(--pp-text-secondary, #9aaebf)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, width: '100px' }}>Quantity</th>
                      <th style={{ textAlign: 'right', padding: '10px 14px', color: 'var(--pp-text-secondary, #9aaebf)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Total</th>
                      <th style={{ textAlign: 'center', padding: '10px 14px', color: 'var(--pp-text-secondary, #9aaebf)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item, index) => (
                      <tr key={index}>
                        <td style={{ textAlign: 'center', padding: '10px 8px', color: 'var(--pp-text-muted, #6c7f8f)', fontWeight: 600, fontSize: '13px' }}>
                          {index + 1}
                        </td>
                        <td style={{ textAlign: 'left', padding: '10px 14px' }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--pp-text-primary, #eef2f8)' }}>{item.product_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--pp-text-muted, #6c7f8f)', marginTop: '2px' }}>
                            {item.unit ? `Unit: ${item.unit}` : ''}
                          </div>
                        </td>
                        <td style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--pp-text-secondary, #9aaebf)' }}>{item.brand || '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: '600', padding: '6px' }}>
                          {editingCell?.rowIndex === index && editingCell?.field === 'purchase_rate' ? (
                            <input
                              ref={(el) => { rowInputRefs.current[`${index}-purchase_rate`] = el; }}
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.purchase_rate === 0 || item.purchase_rate === undefined || item.purchase_rate === '' ? '' : item.purchase_rate}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateItem(item.item_id, 'purchase_rate', val === '' ? 0 : parseFloat(val) || 0);
                              }}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); setEditingCell(null); focusNext(index, 'purchase_rate'); }
                              }}
                              className="table-search-input"
                              style={{ width: '90px', textAlign: 'right', padding: '4px 6px' }}
                            />
                          ) : (
                            <span
                              onClick={() => focusCell(index, 'purchase_rate')}
                              style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                              title="Click to edit"
                            >
                              ₹{parseFloat(item.purchase_rate || 0).toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '600', padding: '6px' }}>
                          {editingCell?.rowIndex === index && editingCell?.field === 'sale_rate' ? (
                            <input
                              ref={(el) => { rowInputRefs.current[`${index}-sale_rate`] = el; }}
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.sale_rate === 0 || item.sale_rate === undefined || item.sale_rate === '' ? '' : item.sale_rate}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateItem(item.item_id, 'sale_rate', val === '' ? 0 : parseFloat(val) || 0);
                              }}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); setEditingCell(null); focusNext(index, 'sale_rate'); }
                              }}
                              className="table-search-input"
                              style={{ width: '90px', textAlign: 'right', padding: '4px 6px' }}
                            />
                          ) : (
                            <span
                              onClick={() => focusCell(index, 'sale_rate')}
                              style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                              title="Click to edit"
                            >
                              ₹{parseFloat(item.sale_rate || 0).toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '600', padding: '6px' }}>
                          {editingCell?.rowIndex === index && editingCell?.field === 'min_sale_rate' ? (
                            <input
                              ref={(el) => { rowInputRefs.current[`${index}-min_sale_rate`] = el; }}
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.min_sale_rate === null || item.min_sale_rate === undefined || item.min_sale_rate === '' ? '' : item.min_sale_rate}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateItem(item.item_id, 'min_sale_rate', val === '' ? null : parseFloat(val) || null);
                              }}
                              onBlur={() => setEditingCell(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); setEditingCell(null); focusNext(index, 'min_sale_rate'); }
                              }}
                              className="table-search-input"
                              style={{ width: '90px', textAlign: 'right', padding: '4px 6px' }}
                            />
                          ) : (
                            <span
                              onClick={() => focusCell(index, 'min_sale_rate')}
                              style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                              title="Click to edit"
                            >
                              {item.min_sale_rate != null && item.min_sale_rate !== '' ? `₹${parseFloat(item.min_sale_rate).toFixed(2)}` : '—'}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>{item.tax_rate || 0}%</td>
                        <td style={{ textAlign: 'right', fontWeight: '500', color: '#555' }} title="Stock in inventory">
                          {item.current_quantity != null && item.current_quantity !== '' ? Number(item.current_quantity) : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            ref={(el) => { rowInputRefs.current[`${index}-quantity`] = el; }}
                            type="number"
                            min="0"
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              const qty = val === '' ? 0 : parseInt(val) || 0;
                              updateItem(item.item_id, 'quantity', qty);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); focusNext(index, 'quantity'); }
                            }}
                            className="table-search-input"
                            style={{ width: '80px', textAlign: 'center', padding: '6px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--pp-orange, #f59a30)', padding: '10px 14px' }}>
                          ₹{(parseFloat(item.purchase_rate || 0) * (parseInt(item.quantity) || 0)).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center', padding: '6px 10px' }}>
                          <button
                            onClick={() => removeItem(item.item_id)}
                            className="btn btn-danger"
                            style={{ padding: '5px 10px', fontSize: '13px' }}
                            title="Remove"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Search row - next to last item, like Return page */}
                    <tr className="table-search-row">
                      <td style={{ verticalAlign: 'middle' }}></td>
                      <td colSpan="4" style={{ position: 'relative', overflow: 'visible', zIndex: 10005 }}>
                        <div className="table-search-wrapper">
                          <input
                            type="text"
                            className="table-search-input"
                            placeholder="Type product name or brand to search and add items..."
                            value={searchQuery}
                            ref={itemSearchInputRef}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setActiveSuggestionIndex(-1);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setActiveSuggestionIndex(prev => Math.min(prev + 1, suggestedItems.length - 1));
                              } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setActiveSuggestionIndex(prev => Math.max(prev - 1, -1));
                              } else if (e.key === 'Enter') {
                                e.preventDefault();
                                if (activeSuggestionIndex >= 0 && suggestedItems[activeSuggestionIndex]) {
                                  addItemToCart(suggestedItems[activeSuggestionIndex]);
                                  handleSearchClear();
                                } else if (suggestedItems.length > 0) {
                                  addItemToCart(suggestedItems[0]);
                                  handleSearchClear();
                                }
                              } else if (e.key === 'Escape') {
                                handleSearchClear();
                              }
                            }}
                          />
                          {searchQuery.trim().length >= 2 && (
                            <div className="table-suggestions">
                              <div className="table-suggestions-header">
                                <span>Product Suggestions</span>
                                {isLoadingItems && <div className="search-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>}
                              </div>
                              <div className="table-suggestions-body">
                                {isLoadingItems && suggestedItems.length === 0 && (
                                  <div className="search-loader-container">
                                    <div className="search-spinner"></div>
                                    <span>Searching inventory...</span>
                                  </div>
                                )}
                                {!isLoadingItems && suggestedItems.length === 0 && (
                                  <div className="no-results-container">
                                    <div className="no-results-icon" aria-hidden />
                                    <div>No products found for &quot;{searchQuery}&quot;</div>
                                  </div>
                                )}
                                {suggestedItems.map((item, idx) => {
                                  const isAlreadyInCart = selectedItems.some(it => it.item_id === item.id);
                                  const stockLevel = item.quantity || 0;
                                  const stockClass = stockLevel <= 0 ? 'none' : (stockLevel < 10 ? 'low' : 'good');
                                  const stockLabel = stockLevel <= 0 ? 'Out' : stockLevel < 10 ? 'Low' : 'OK';

                                  return (
                                    <div
                                      key={item.id}
                                      className={`table-suggestion-item ${idx === activeSuggestionIndex ? 'active' : ''} ${isAlreadyInCart ? 'already-selected' : ''}`}
                                      onClick={() => {
                                        addItemToCart(item);
                                        handleSearchClear();
                                        itemSearchInputRef.current?.focus();
                                      }}
                                    >
                                      <div className="table-suggestion-info">
                                        <div className="table-suggestion-name">
                                          {item.product_name}
                                          {isAlreadyInCart && <span className="selected-badge">In Cart</span>}
                                        </div>
                                        <div className="table-suggestion-meta">
                                          <span>{item.brand}</span>
                                          <span className={`stock-pill ${stockClass}`}>
                                            {stockLabel} · {stockLevel} in stock
                                          </span>
                                          {item.unit && <span>Unit: {item.unit}</span>}
                                        </div>
                                      </div>
                                      <div className="table-suggestion-right">
                                        <div className="table-suggestion-rate" style={{ color: '#2c3e50', fontSize: '15px' }}>
                                          Purchase: <span style={{ color: '#27ae60', fontWeight: '800' }}>₹{parseFloat(item.purchase_rate || 0).toFixed(2)}</span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>Sale: ₹{parseFloat(item.sale_rate || 0).toFixed(2)}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              {suggestedItems.length > 0 && (
                                <div className="table-suggestions-footer">
                                  <span>{suggestedItems.length} results found</span>
                                  <span>Up/Down to navigate · Enter to add</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td colSpan="5" style={{ color: 'var(--pp-text-muted, #6c7f8f)', fontStyle: 'italic', fontSize: '12px', verticalAlign: 'middle' }}>
                        Search and add existing items
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

          {selectedItems.length > 0 && (
            <div className="add-item__submit-bar" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--pp-text-muted, #6c7f8f)' }}>Click a rate to edit · Enter moves to the next field</span>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleSaveRates}
                  disabled={isSaving}
                  className="btn btn-secondary"
                  style={{ opacity: isSaving ? 0.6 : 1 }}
                  type="button"
                >
                  {isSaving ? 'Saving...' : 'Save rates only'}
                </button>
                <button
                  onClick={handleSubmitPurchase}
                  disabled={isSubmittingPurchase}
                  className="btn btn-success"
                  style={{ opacity: isSubmittingPurchase ? 0.6 : 1 }}
                  type="button"
                >
                  {isSubmittingPurchase ? 'Adding...' : 'Add to inventory (updates stock)'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Clear the list?')) {
                      setSelectedItems([]);
                      setEditingCell(null);
                      toast.info('List cleared');
                    }
                  }}
                  className="btn btn-danger"
                >
                  Clear List
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ height: '40px' }} />

      {/* Add New Item modal - portaled to body */}
      {showAddItemForm && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '12px' }}>
          <div style={{ background: '#141b26', borderRadius: '10px', width: '100%', maxWidth: '620px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid #2a3340', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #2a3340' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Create New</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#eef2f8' }}>Add Product to Inventory</div>
              </div>
              <button type="button" onClick={closeAddItemModal} style={{ background: 'none', border: 'none', color: '#9aaebf', cursor: 'pointer', fontSize: '22px', lineHeight: 1, padding: '4px' }} aria-label="Close">&times;</button>
            </div>

            {/* Modal Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '16px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

                {/* Product Name */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '10px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', fontWeight: 600 }}>Product Name *</label>
                  <input
                    type="text"
                    value={newItem.product_name}
                    onChange={(e) => setNewItem({ ...newItem, product_name: e.target.value })}
                    placeholder="Enter product name"
                    required
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: '#0f151f', border: '1px solid #2a3340', borderRadius: '6px', color: '#eef2f8', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Brand */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', fontWeight: 600 }}>Brand</label>
                  <input
                    type="text"
                    value={newItem.brand}
                    onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                    placeholder="e.g. Castrol, Shell"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: '#0f151f', border: '1px solid #2a3340', borderRadius: '6px', color: '#eef2f8', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Unit — presets + free text (matches bill / DB) */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', fontWeight: 600 }}>Unit *</label>
                  <input
                    type="text"
                    list="add-item-unit-presets"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="e.g. PCS, LTR, or custom"
                    maxLength={20}
                    required
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: '#0f151f', border: '1px solid #2a3340', borderRadius: '6px', color: '#eef2f8', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <datalist id="add-item-unit-presets">
                    {STANDARD_SALE_UNITS.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Defaults to PCS; pick a preset or type your own.</div>
                </div>

                {/* Purchase Rate */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', fontWeight: 600 }}>Purchase Rate *</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={newItem.purchase_rate === 0 ? '' : newItem.purchase_rate}
                    onChange={(e) => { const val = e.target.value; setNewItem({ ...newItem, purchase_rate: val === '' ? 0 : parseFloat(val) || 0 }); }}
                    placeholder="0.00" required
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: '#0f151f', border: `1px solid ${newItem.sale_rate > 0 && newItem.purchase_rate > 0 && newItem.sale_rate < newItem.purchase_rate ? '#e8593c' : '#2a3340'}`, borderRadius: '6px', color: '#eef2f8', outline: 'none', boxSizing: 'border-box' }}
                  />
                  {newItem.sale_rate > 0 && newItem.purchase_rate > 0 && newItem.sale_rate < newItem.purchase_rate && (
                    <div style={{ color: '#e8593c', fontSize: '11px', marginTop: '4px' }}>Purchase rate cannot exceed sale rate</div>
                  )}
                </div>

                {/* Sale Rate */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', fontWeight: 600 }}>Sale Rate *</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={newItem.sale_rate === 0 ? '' : newItem.sale_rate}
                    onChange={(e) => { const val = e.target.value; setNewItem({ ...newItem, sale_rate: val === '' ? 0 : parseFloat(val) || 0 }); }}
                    placeholder="0.00" required
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: '#0f151f', border: `1px solid ${newItem.sale_rate > 0 && newItem.purchase_rate > 0 && newItem.sale_rate < newItem.purchase_rate ? '#e8593c' : '#2a3340'}`, borderRadius: '6px', color: '#eef2f8', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Tax Rate */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', fontWeight: 600 }}>Tax Rate (%)</label>
                  <select
                    value={newItem.tax_rate}
                    onChange={(e) => { const r = parseFloat(e.target.value); setNewItem({ ...newItem, tax_rate: [5,18,28].includes(r) ? r : 18 }); }}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: '#0f151f', border: '1px solid #2a3340', borderRadius: '6px', color: '#eef2f8', outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="5">5%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>

                {/* Min Sale Rate */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', fontWeight: 600 }}>Min Sale Rate</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={newItem.min_sale_rate === 0 ? '' : newItem.min_sale_rate}
                    onChange={(e) => { const val = e.target.value; setNewItem({ ...newItem, min_sale_rate: val === '' ? 0 : parseFloat(val) || 0 }); }}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: '#0f151f', border: '1px solid #2a3340', borderRadius: '6px', color: '#eef2f8', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', fontWeight: 600 }}>Quantity *</label>
                  <input
                    type="number"
                    value={newItem.quantity === 0 ? '' : newItem.quantity}
                    onChange={(e) => { const val = e.target.value; setNewItem({ ...newItem, quantity: val === '' ? 0 : parseInt(val) || 0 }); }}
                    placeholder="0" required
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: '#0f151f', border: '1px solid #2a3340', borderRadius: '6px', color: '#eef2f8', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Alert Quantity */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', fontWeight: 600 }}>Alert Quantity</label>
                  <input
                    type="number"
                    value={newItem.alert_quantity === 0 ? '' : newItem.alert_quantity}
                    onChange={(e) => { const val = e.target.value; setNewItem({ ...newItem, alert_quantity: val === '' ? 0 : parseInt(val) || 0 }); }}
                    placeholder="0"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: '#0f151f', border: '1px solid #2a3340', borderRadius: '6px', color: '#eef2f8', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Rack Number */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', fontWeight: 600 }}>Rack Number</label>
                  <input
                    type="text"
                    value={newItem.rack_number}
                    onChange={(e) => setNewItem({ ...newItem, rack_number: e.target.value })}
                    placeholder="e.g. A-12"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: '#0f151f', border: '1px solid #2a3340', borderRadius: '6px', color: '#eef2f8', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Remarks */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: '10px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px', fontWeight: 600 }}>Remarks</label>
                  <textarea
                    value={newItem.remarks}
                    onChange={(e) => { if (e.target.value.length <= 200) setNewItem({ ...newItem, remarks: e.target.value }); }}
                    rows={3} maxLength={200}
                    placeholder="Enter any notes or remarks..."
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', background: '#0f151f', border: '1px solid #2a3340', borderRadius: '6px', color: '#eef2f8', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                  <div style={{ textAlign: 'right', fontSize: '11px', color: (newItem.remarks?.length || 0) >= 180 ? '#e8593c' : '#6c7f8f', marginTop: '3px' }}>
                    {newItem.remarks?.length || 0}/200
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 18px', borderTop: '1px solid #2a3340', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={closeAddItemModal} style={{ padding: '7px 16px', fontSize: '12px', background: 'transparent', border: '1px solid #2a3340', borderRadius: '5px', cursor: 'pointer', color: '#9aaebf', fontWeight: 500 }}>
                Cancel
              </button>
              <button
                onClick={handleAddNewItem}
                disabled={isAddingNewItem}
                style={{ padding: '7px 20px', fontSize: '12px', background: '#f59a30', border: 'none', borderRadius: '5px', cursor: isAddingNewItem ? 'not-allowed' : 'pointer', color: '#1a1200', fontWeight: 700, opacity: isAddingNewItem ? 0.6 : 1 }}
              >
                {isAddingNewItem ? 'Adding...' : '+ Add to Inventory'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </Layout>
  );
};

export default AddItem;



