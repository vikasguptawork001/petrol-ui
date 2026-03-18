import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TransactionLoader from '../components/TransactionLoader';
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
    product_code: '',
    brand: '',
    hsn_number: '',
    tax_rate: 18,
    sale_rate: 0,
    min_sale_rate: 0,
    purchase_rate: 0,
    quantity: 0,
    alert_quantity: 0,
    rack_number: '',
    remarks: ''
  });
  const [itemImage, setItemImage] = useState(null);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Inline edit: which cell is being edited { rowIndex, field: 'purchase_rate' | 'sale_rate' }
  const [editingCell, setEditingCell] = useState(null);
  const rowInputRefs = useRef({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      alert('Access Denied: Only Admin and Super Admin can add items to inventory.');
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
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: updatedItems[existingItemIndex].quantity + 1
            };
          } else {
            // Add new item to cart - use search data which now includes purchase_rate
            // Note: current_quantity should be the actual stock from the database
            // The quantity field is the purchase quantity (how many we're buying)
            updatedItems.push({
              item_id: itemDetails.id,
              product_name: itemDetails.product_name,
              product_code: itemDetails.product_code || '',
              brand: itemDetails.brand || '',
              hsn_number: itemDetails.hsn_number || '',
              tax_rate: finalTaxRate,
              sale_rate: parseFloat(itemDetails.sale_rate) || 0,
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
    } catch (error) {
      console.error('Error fetching batch item details:', error);
      toast.error('Error loading item details');
      errorCount += itemsToAdd.length;
    }
    
    if (successCount > 0) {
      toast.success(`✓ Added ${successCount} item${successCount !== 1 ? 's' : ''} to list`);
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
        // If item already in cart, just increment quantity
        setSelectedItems(prev => prev.map(i =>
          i.item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ));
      } else {
        // Add item using search data (which includes purchase_rate)
        // Note: current_quantity should be the actual stock from the database
        // The quantity field is the purchase quantity (how many we're buying)
        setSelectedItems(prev => [...prev, {
          item_id: item.id,
          product_name: item.product_name,
          product_code: item.product_code || '',
          brand: item.brand || '',
          hsn_number: item.hsn_number || '',
          tax_rate: finalTaxRate, // Use the parsed and validated tax rate
          sale_rate: parseFloat(item.sale_rate) || 0,
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
    if (field === 'purchase_rate' || field === 'sale_rate') {
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
      : currentField === 'sale_rate' ? { rowIndex, field: 'quantity' }
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
          const payload = {
            sale_rate: parseFloat(item.sale_rate) || 0,
            purchase_rate: parseFloat(item.purchase_rate) || 0
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

  const closeAddItemModal = () => {
    setShowAddItemForm(false);
    setNewItem({
      product_name: '',
      product_code: '',
      brand: '',
      hsn_number: '',
      tax_rate: 18,
      sale_rate: 0,
      purchase_rate: 0,
      quantity: 0,
      alert_quantity: 0,
      rack_number: '',
      remarks: ''
    });
    setItemImage(null);
  };

  const handleAddNewItem = async () => {
    // Validate required fields
    if (!newItem.product_name) {
      toast.warning('Product name is required');
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
    if (newItem.sale_rate && parseFloat(newItem.sale_rate) < parseFloat(newItem.purchase_rate)) {
      if (!window.confirm('Sale rate is lower than purchase rate. Continue?')) {
        return;
      }
    }

    setIsAddingNewItem(true);
    try {
      const formData = new FormData();
      formData.append('product_name', newItem.product_name);
      if (newItem.product_code) formData.append('product_code', newItem.product_code);
      if (newItem.brand) formData.append('brand', newItem.brand);
      if (newItem.hsn_number) formData.append('hsn_number', newItem.hsn_number);
      formData.append('tax_rate', newItem.tax_rate);
      formData.append('purchase_rate', newItem.purchase_rate);
      formData.append('sale_rate', newItem.sale_rate);
      if (newItem.min_sale_rate !== undefined && newItem.min_sale_rate !== '' && !isNaN(parseFloat(newItem.min_sale_rate)) && parseFloat(newItem.min_sale_rate) >= 0) {
        formData.append('min_sale_rate', parseFloat(newItem.min_sale_rate));
      } else {
        formData.append('min_sale_rate', '');
      }
      formData.append('quantity', newItem.quantity);
      if (newItem.alert_quantity) formData.append('alert_quantity', newItem.alert_quantity);
      if (newItem.rack_number) formData.append('rack_number', newItem.rack_number);
      if (newItem.remarks) formData.append('remarks', newItem.remarks);
      
      if (itemImage) {
        formData.append('image', itemImage);
      }

      await apiClient.post(config.api.items, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

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
      <TransactionLoader isLoading={isAddingNewItem} type="purchase" />
      <div className="add-item">
        <div className="pp-page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>📦</span>
              <h2>Add Item to Inventory</h2>
            </div>
            <p>Create new stock entries or manage existing dispenser items</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddItemForm(true)}
            className="btn btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: '15px',
              fontWeight: '600',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0
            }}
          >
            <span>+</span>
            Add New Item
          </button>
        </div>

        <div className="card">
          <div style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
            <p>Use &quot;Add New Item&quot; to create a product in inventory (it will not appear in the list below). Search below to add <strong>existing</strong> items only to your list.</p>
          </div>

          {selectedItems.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Your list ({selectedItems.length})</h3>
              <button
                onClick={() => {
                  if (window.confirm('Clear all items from list?')) {
                    setSelectedItems([]);
                    toast.info('List cleared');
                  }
                }}
                className="btn btn-danger"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                🗑️ Clear All
              </button>
            </div>
          )}

          <div className="table-responsive-container">
            <table className="table">
                  <thead style={{ backgroundColor: '#34495e', color: '#ffffff' }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '14px 18px' }}>Product Details</th>
                      <th style={{ textAlign: 'left', padding: '14px 18px' }}>Brand</th>
                      <th style={{ textAlign: 'right', padding: '14px 18px' }}>Purchase Rate</th>
                      <th style={{ textAlign: 'right', padding: '14px 18px' }}>Sale Rate</th>
                      <th style={{ textAlign: 'right', padding: '14px 18px' }}>Tax Rate</th>
                      <th style={{ textAlign: 'right', padding: '14px 18px', width: '90px' }}>Current Qty</th>
                      <th style={{ textAlign: 'right', padding: '14px 18px', width: '100px' }}>Quantity</th>
                      <th style={{ textAlign: 'right', padding: '14px 18px' }}>Total</th>
                      <th style={{ textAlign: 'center', padding: '14px 18px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item, index) => (
                      <tr key={index}>
                        <td style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: '700', fontSize: '15px' }}>{item.product_name}</div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                            {item.product_code || 'No Code'} • {item.hsn_number ? `HSN: ${item.hsn_number}` : 'No HSN'}
                          </div>
                        </td>
                        <td style={{ textAlign: 'left' }}>{item.brand || '-'}</td>
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
                        <td style={{ textAlign: 'right' }}>{item.tax_rate || 0}%</td>
                        <td style={{ textAlign: 'right', fontWeight: '500', color: '#555' }} title="Stock in inventory">
                          {item.current_quantity != null && item.current_quantity !== '' ? Number(item.current_quantity) : '–'}
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
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#2c3e50' }}>
                          ₹{(parseFloat(item.purchase_rate || 0) * (parseInt(item.quantity) || 0)).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => removeItem(item.item_id)}
                            style={{ 
                              background: '#fff5f5', 
                              border: '1px solid #feb2b2', 
                              color: '#e53e3e', 
                              cursor: 'pointer', 
                              padding: '6px 10px',
                              borderRadius: '6px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#fed7d7'}
                            onMouseLeave={(e) => e.target.style.background = '#fff5f5'}
                            title="Remove"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Search row - next to last item, like Return page */}
                    <tr className="table-search-row">
                      <td style={{ verticalAlign: 'middle' }}></td>
                      <td colSpan="3" style={{ position: 'relative', overflow: 'visible', zIndex: 10005 }}>
                        <div className="table-search-wrapper">
                          <input
                            type="text"
                            className="table-search-input"
                            placeholder="🔍 Type product name, brand, or HSN to search and add items..."
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
                                    <div className="no-results-icon">🔍</div>
                                    <div>No products found for &quot;{searchQuery}&quot;</div>
                                  </div>
                                )}
                                {suggestedItems.map((item, idx) => {
                                  const isAlreadyInCart = selectedItems.some(it => it.item_id === item.id);
                                  const stockLevel = item.quantity || 0;
                                  const stockClass = stockLevel <= 0 ? 'none' : (stockLevel < 10 ? 'low' : 'good');
                                  const stockIcon = stockLevel <= 0 ? '🚫' : (stockLevel < 10 ? '⚠️' : '📦');

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
                                          <span>🏢 {item.brand}</span>
                                          <span className={`stock-pill ${stockClass}`}>
                                            {stockIcon} {stockLevel} Stock
                                          </span>
                                          {item.hsn_number && <span>HSN: {item.hsn_number}</span>}
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
                                  <span>↑↓ Navigate • Enter to Add</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td colSpan="5" style={{ color: '#95a5a6', fontStyle: 'italic', fontSize: '13px', verticalAlign: 'middle' }}>
                        &nbsp;&nbsp;← Search and add existing items
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

          {selectedItems.length > 0 && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Click rate to edit • Enter → next field</span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSaveRates}
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ padding: '12px 24px', opacity: isSaving ? 0.6 : 1 }}
                >
                  {isSaving ? 'Saving...' : 'Save rates'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Clear the list?')) {
                      setSelectedItems([]);
                      setEditingCell(null);
                      toast.info('List cleared');
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '12px 24px' }}
                >
                  Clear list
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ height: '40px' }} />

      {/* Add New Item modal - portaled to body */}
      {showAddItemForm && createPortal(
        <div className="add-item-modal-overlay modal-overlay">
          <div className="modal-content add-item-modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="modal-header">
              <h3>Add New Product to Inventory</h3>
              <button type="button" className="modal-close" onClick={closeAddItemModal} aria-label="Close">×</button>
            </div>
            <div className="modal-body" style={{ overflow: 'auto', flex: 1, padding: '20px' }}>
              <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
                Fill in the product details below. Fields marked with * are required.
              </p>
              <div className="form-row">
                <div className="form-group">
                  <label>Brand *</label>
                  <input
                    type="text"
                    value={newItem.product_name}
                    onChange={(e) => setNewItem({ ...newItem, product_name: e.target.value })}
                    placeholder="Enter brand name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>HSN Number</label>
                  <input
                    type="text"
                    value={newItem.hsn_number}
                    onChange={(e) => setNewItem({ ...newItem, hsn_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Purchase Rate *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.purchase_rate === 0 ? '' : newItem.purchase_rate}
                    onChange={(e) => {
                      const val = e.target.value;
                      const purchaseRate = val === '' ? 0 : parseFloat(val) || 0;
                      setNewItem({ ...newItem, purchase_rate: purchaseRate });
                    }}
                    placeholder="0.00"
                    required
                    style={{
                      borderColor: newItem.sale_rate > 0 && newItem.purchase_rate > 0 && newItem.sale_rate < newItem.purchase_rate ? '#dc3545' : undefined
                    }}
                  />
                  {newItem.sale_rate > 0 && newItem.purchase_rate > 0 && newItem.sale_rate < newItem.purchase_rate && (
                    <small style={{ color: '#dc3545', display: 'block', marginTop: '5px' }}>
                      ⚠️ Purchase rate cannot be greater than sale rate
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>Tax Rate (%)</label>
                  <select
                    value={newItem.tax_rate}
                    onChange={(e) => {
                      const selectedTaxRate = parseFloat(e.target.value);
                      const validTaxRates = [5, 18, 28];
                      const finalTaxRate = validTaxRates.includes(selectedTaxRate) ? selectedTaxRate : 18;
                      setNewItem({ ...newItem, tax_rate: finalTaxRate });
                    }}
                  >
                    <option value="5">5%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Sale Rate *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.sale_rate === 0 ? '' : newItem.sale_rate}
                    onChange={(e) => {
                      const val = e.target.value;
                      const saleRate = val === '' ? 0 : parseFloat(val) || 0;
                      setNewItem({ ...newItem, sale_rate: saleRate });
                    }}
                    placeholder="0.00"
                    required
                    style={{
                      borderColor: newItem.sale_rate > 0 && newItem.purchase_rate > 0 && newItem.sale_rate < newItem.purchase_rate ? '#dc3545' : undefined
                    }}
                  />
                  {newItem.sale_rate > 0 && newItem.purchase_rate > 0 && newItem.sale_rate < newItem.purchase_rate && (
                    <small style={{ color: '#dc3545', display: 'block', marginTop: '5px' }}>
                      ⚠️ Sale rate must be ≥ purchase rate
                    </small>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Sale Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.min_sale_rate === 0 ? '' : newItem.min_sale_rate}
                    onChange={(e) => {
                      const val = e.target.value;
                      const minSaleRate = val === '' ? 0 : parseFloat(val) || 0;
                      setNewItem({ ...newItem, min_sale_rate: minSaleRate });
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    // min="0"
                    value={newItem.quantity === 0 ? '' : newItem.quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewItem({ ...newItem, quantity: val === '' ? 0 : parseInt(val) || 0 });
                    }}
                    // placeholder="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Alert Quantity</label>
                  <input
                    type="number"
                    value={newItem.alert_quantity === 0 ? '' : newItem.alert_quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewItem({ ...newItem, alert_quantity: val === '' ? 0 : parseInt(val) || 0 });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Rack Number</label>
                  <input
                    type="text"
                    value={newItem.rack_number}
                    onChange={(e) => setNewItem({ ...newItem, rack_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Remarks (Max 200 characters)</label>
                <textarea
                  value={newItem.remarks}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 200) {
                      setNewItem({ ...newItem, remarks: value });
                    }
                  }}
                  rows="3"
                  maxLength={200}
                  placeholder="Enter remarks..."
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  {newItem.remarks?.length || 0}/200 characters
                </small>
              </div>
              <div className="form-group">
                <label>Product Image (Max 3MB)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 3 * 1024 * 1024) {
                        alert('Image size must be less than 3MB');
                        e.target.value = '';
                        return;
                      }
                      setItemImage(file);
                    }
                  }}
                />
                {itemImage && (
                  <div style={{ marginTop: '10px' }}>
                    <img 
                      src={URL.createObjectURL(itemImage)} 
                      alt="Preview" 
                      style={{ maxWidth: '200px', maxHeight: '200px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setItemImage(null);
                        document.querySelector('input[type="file"]').value = '';
                      }}
                      style={{ marginLeft: '10px', padding: '5px 10px' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button 
                  onClick={handleAddNewItem} 
                  className="btn btn-primary"
                  disabled={isAddingNewItem}
                  style={{
                    opacity: isAddingNewItem ? 0.6 : 1,
                    cursor: isAddingNewItem ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isAddingNewItem ? 'Adding...' : 'Add to Inventory'}
                </button>
                <button type="button" onClick={closeAddItemModal} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </Layout>
  );
};

export default AddItem;


