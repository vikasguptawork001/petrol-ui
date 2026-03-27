// // // import React, { useState, useEffect, useMemo } from 'react';
// // // import { createPortal } from 'react-dom';
// // // import { useNavigate, useSearchParams } from 'react-router-dom';
// // // import Layout from '../components/Layout';
// // // import { DueSheetPanel } from './DueSheet';
// // // import { NozzleReadingPanel } from './NozzleReading';
// // // import apiClient from '../config/axios';
// // // import config from '../config/config';
// // // import { useAuth } from '../context/AuthContext';
// // // import { useToast } from '../context/ToastContext';
// // // import ActionMenu from '../components/ActionMenu';
// // // import Pagination from '../components/Pagination';
// // // import TransactionLoader from '../components/TransactionLoader';
// // // import * as XLSX from 'xlsx';
// // // import { getLocalDateString } from '../utils/dateUtils';
// // // import './Dashboard.css';

// // // const Dashboard = () => {
// // //   const { user } = useAuth();
// // //   const toast = useToast();
// // //   const navigate = useNavigate();
// // //   const [items, setItems] = useState([]);
// // //   const [allItems, setAllItems] = useState([]); // Store all items from backend for client-side filtering
// // //   const [loading, setLoading] = useState(true);
// // //   const [page, setPage] = useState(1);
// // //   const [limit, setLimit] = useState(200);
// // //   const [totalPages, setTotalPages] = useState(1);
// // //   const [search, setSearch] = useState('');
// // //   const [debouncedSearch, setDebouncedSearch] = useState('');
// // //   const [searchField, setSearchField] = useState('product_name');
// // //   const [sortBy, setSortBy] = useState('product_name');
// // //   const [sortOrder, setSortOrder] = useState('asc');
// // //   const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
// // //   const [advancedSearch, setAdvancedSearch] = useState({
// // //     product_name: '',
// // //     unit: '',
// // //     brand: '',
// // //     remarks: ''
// // //   });
// // //   const [editingItem, setEditingItem] = useState(null);
// // //   const [editFormData, setEditFormData] = useState({});
// // //   const [showEditModal, setShowEditModal] = useState(false);
// // //   const [showQuickSaleModal, setShowQuickSaleModal] = useState(false);
// // //   const [quickSaleItem, setQuickSaleItem] = useState(null);
// // //   const [quickSaleQuantity, setQuickSaleQuantity] = useState(1);
// // //   const [showViewModal, setShowViewModal] = useState(false);
// // //   const [viewItem, setViewItem] = useState(null);
// // //   const [totalStockAmount, setTotalStockAmount] = useState(null);
// // //   const [stockAmountByBrand, setStockAmountByBrand] = useState([]);
// // //   const [showStockAmountModal, setShowStockAmountModal] = useState(false);
// // //   const [exporting, setExporting] = useState(false);
// // //   const [quickSaleLoading, setQuickSaleLoading] = useState(false);
// // //   const [updating, setUpdating] = useState(false);
// // //   const [deleting, setDeleting] = useState(false);
// // //   const [searching, setSearching] = useState(false);
// // //   const [originalItemData, setOriginalItemData] = useState(null);
// // //   const [modalLoading, setModalLoading] = useState(false);
// // //   const [paginationLoading, setPaginationLoading] = useState(false);
// // //   const [dueAlertParties, setDueAlertParties] = useState([]);
// // //   const [showDueAlertModal, setShowDueAlertModal] = useState(false);
// // //   const [dueDateEditingId, setDueDateEditingId] = useState(null);
// // //   const [dueDateEditingValue, setDueDateEditingValue] = useState('');
// // //   const [dueDateSaving, setDueDateSaving] = useState(false);
// // //   const [searchParams] = useSearchParams();
// // //   const homeTab = searchParams.get('tab') || 'items';
// // //   // Fetch items only on mount (not when page/limit changes - those are handled client-side)
// // //   useEffect(() => {
// // //     fetchItems();
// // //     // eslint-disable-next-line react-hooks/exhaustive-deps
// // //   }, []); // Only fetch once on mount

// // //   const handleSaveDueDate = async (partyId) => {
// // //     if (!dueDateEditingValue.trim()) return;
// // //     setDueDateSaving(true);
// // //     try {
// // //       await apiClient.patch(`${config.api.sellers}/${partyId}`, { due_date: dueDateEditingValue });
// // //       const newDate = dueDateEditingValue;
// // //       const today = getLocalDateString(new Date());
// // //       setDueAlertParties((prev) => {
// // //         const updated = prev.map((p) =>
// // //           p.id === partyId ? { ...p, due_date: newDate } : p
// // //         );
// // //         return newDate > today ? updated.filter((p) => p.id !== partyId) : updated;
// // //       });
// // //       setDueDateEditingId(null);
// // //       setDueDateEditingValue('');
// // //       toast.success('Due date updated');
// // //     } catch (e) {
// // //       toast.error(e.response?.data?.error || 'Failed to update due date');
// // //     } finally {
// // //       setDueDateSaving(false);
// // //     }
// // //   };

// // //   const startEditDueDate = (p) => {
// // //     setDueDateEditingId(p.id);
// // //     setDueDateEditingValue(p.due_date ? getLocalDateString(new Date(p.due_date)) : getLocalDateString(new Date()));
// // //   };

// // //   // Load overdue creditors popup for super_admin
// // //   useEffect(() => {
// // //     const loadDueAlerts = async () => {
// // //       if (!user || user.role !== 'super_admin') return;
// // //       try {
// // //         const res = await apiClient.get(config.api.dueAlerts);
// // //         const list = res.data.parties || [];
// // //         if (list.length > 0) {
// // //           setDueAlertParties(list);
// // //           setShowDueAlertModal(true);
// // //         }
// // //       } catch (e) {
// // //         // silent fail, dashboard should not break
// // //       }
// // //     };
// // //     loadDueAlerts();
// // //   }, [user]);

// // //   // Debounce search query - update debouncedSearch after 1 second of no typing
// // //   useEffect(() => {
// // //     const timer = setTimeout(() => {
// // //       const trimmedSearch = search.trim();
// // //       setDebouncedSearch(trimmedSearch);
// // //     }, 1000); // 1 second delay

// // //     return () => clearTimeout(timer);
// // //   }, [search]);

// // //   // Client-side filtering for quick search (using debounced search)
// // //   useEffect(() => {
// // //     if (allItems.length === 0) {
// // //       setPaginationLoading(false);
// // //       return; // Wait for items to be loaded
// // //     }
    
// // //     // Show loader when pagination changes
// // //     setPaginationLoading(true);
    
// // //     // Use setTimeout to ensure UI updates and show loader briefly
// // //     const timer = setTimeout(() => {
// // //       if (!debouncedSearch || debouncedSearch.trim() === '') {
// // //         // If no search query, show paginated items from allItems
// // //         // If limit equals allItems.length, show all items (no pagination)
// // //         if (limit >= allItems.length) {
// // //           setItems(allItems);
// // //           setTotalPages(1);
// // //         } else {
// // //           const startIndex = (page - 1) * limit;
// // //           const endIndex = startIndex + limit;
// // //           setItems(allItems.slice(startIndex, endIndex));
// // //           setTotalPages(Math.ceil(allItems.length / limit));
// // //         }
// // //       } else {
// // //         // Filter items client-side based on debounced search query
// // //         const query = debouncedSearch.toLowerCase().trim();
// // //         const filtered = allItems.filter(item => {
// // //           const fieldValue = String(item[searchField] || '').toLowerCase();
// // //           return fieldValue.includes(query);
// // //         });
        
// // //         // Reset to page 1 when search changes
// // //         if (page !== 1) {
// // //           setPage(1);
// // //           setPaginationLoading(false);
// // //           return; // Will re-run after page is set to 1
// // //         }
        
// // //         // Apply pagination to filtered results
// // //         // If limit equals filtered.length, show all filtered items (no pagination)
// // //         if (limit >= filtered.length) {
// // //           setItems(filtered);
// // //           setTotalPages(1);
// // //         } else {
// // //           const startIndex = (page - 1) * limit;
// // //           const endIndex = startIndex + limit;
// // //           setItems(filtered.slice(startIndex, endIndex));
// // //           setTotalPages(Math.ceil(filtered.length / limit));
// // //         }
// // //       }
      
// // //       // Hide loader after items are updated
// // //       setPaginationLoading(false);
// // //     }, 100); // Small delay to show loader
    
// // //     return () => clearTimeout(timer);
// // //   }, [debouncedSearch, searchField, allItems, page, limit]);

// // //   const fetchItems = async () => {
// // //     try {
// // //       setLoading(true);
// // //       // Fetch items in batches to handle more than 10,000 items
// // //       let allFetchedItems = [];
// // //       let currentPage = 1;
// // //       const batchSize = 10000;
// // //       let hasMore = true;
      
// // //       while (hasMore) {
// // //         const response = await apiClient.get(config.api.items, {
// // //           params: { page: currentPage, limit: batchSize }
// // //         });
        
// // //         const items = response.data.items || [];
// // //         const pagination = response.data.pagination;
        
// // //         allFetchedItems = [...allFetchedItems, ...items];
        
// // //         // Check if there are more pages
// // //         if (pagination && pagination.totalPages) {
// // //           hasMore = currentPage < pagination.totalPages;
// // //           currentPage++;
// // //         } else {
// // //           // If no pagination info, stop if we got less than batchSize items
// // //           hasMore = items.length === batchSize;
// // //           currentPage++;
// // //         }
        
// // //         // No safety limit - fetch ALL items
// // //       }
      
// // //       setAllItems(allFetchedItems);
// // //       // The useEffect for filtering will handle setting items and pagination
// // //     } catch (error) {
// // //       console.error('Error fetching items:', error);
// // //       toast.error('Error loading items');
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   const formatCurrency = (amount) => {
// // //     const num = Number(amount || 0);
// // //     if (Number.isNaN(num)) return '0';
// // //     return num.toLocaleString('en-IN', {
// // //       maximumFractionDigits: 2,
// // //       minimumFractionDigits: 0
// // //     });
// // //   };

// // //   const sortedItems = useMemo(() => {
// // //     return [...items].sort((a, b) => {
// // //       const aValue = a[sortBy] || '';
// // //       const bValue = b[sortBy] || '';
      
// // //       let comparison = 0;
// // //       if (aValue < bValue) {
// // //         comparison = -1;
// // //       } else if (aValue > bValue) {
// // //         comparison = 1;
// // //       }
      
// // //       return sortOrder === 'desc' ? -comparison : comparison;
// // //     });
// // //   }, [items, sortBy, sortOrder]);

// // //   const handleSort = (field) => {
// // //     if (sortBy === field) {
// // //       setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
// // //     } else {
// // //       setSortBy(field);
// // //       setSortOrder('asc');
// // //     }
// // //   };

// // //   const getSortIcon = (field) => {
// // //     if (sortBy !== field) return '';
// // //     return sortOrder === 'asc' ? '↑' : '↓';
// // //   };

// // //   const handleAdvancedSearch = async () => {
// // //     if (searching) return;
    
// // //     try {
// // //       setSearching(true);
// // //       setLoading(true);
// // //       const response = await apiClient.post(config.api.itemsAdvancedSearch, advancedSearch);
// // //       setItems(response.data.items || []);
// // //       setTotalPages(1);
// // //       // Don't update allItems for advanced search - it's a separate search result
// // //     } catch (error) {
// // //       console.error('Error in advanced search:', error);
// // //       toast.error('Search failed. Please try again.');
// // //     } finally {
// // //       setLoading(false);
// // //       setSearching(false);
// // //     }
// // //   };

// // //   const fetchTotalStockAmount = async () => {
// // //     try {
// // //       const response = await apiClient.get(config.api.itemsStockTotalByBrand);
// // //       const total = response.data.total_stock_amount;
// // //       setTotalStockAmount(typeof total === 'number' ? total : (parseFloat(total) || 0));
// // //       setStockAmountByBrand(Array.isArray(response.data.by_brand) ? response.data.by_brand : []);
// // //     } catch (error) {
// // //       console.error('Error fetching total stock amount by brand:', error);
// // //       setTotalStockAmount(0);
// // //       setStockAmountByBrand([]);
// // //     }
// // //   };

// // //   useEffect(() => {
// // //     if (user?.role === 'super_admin') {
// // //       fetchTotalStockAmount();
// // //     }
// // //   }, [user]);

// // //   const exportToExcel = () => {
// // //     if (exporting || items.length === 0) return;
    
// // //     setExporting(true);
// // //     try {
// // //       // Export only the data currently showing on screen (visible/filtered data)
// // //       const data = sortedItems.map((item, index) => {
// // //       const itemData = {
// // //         'S.No': index + 1,
// // //         'Product Name': item.product_name,
// // //         'Unit': item.unit || '-',
// // //         'Brand': item.brand || '-',
// // //         'Tax Rate (%)': item.tax_rate || 0,
// // //         'Sale Rate': parseFloat(item.sale_rate || 0).toFixed(2),
// // //         'Quantity': item.quantity || 0,
// // //         'Stock Value': (parseFloat(item.purchase_rate || 0) * (item.quantity || 0)).toFixed(2),
// // //         'Alert Quantity': item.alert_quantity || 0,
// // //         'Rack No': item.rack_number || '-',
// // //         'Remarks': item.remarks || '-'
// // //       };

// // //       if (user?.role === 'super_admin') {
// // //         itemData['Purchase Rate'] = parseFloat(item.purchase_rate || 0).toFixed(2);
// // //       }
      
// // //       return itemData;
// // //     });

// // //       const ws = XLSX.utils.json_to_sheet(data);
      
// // //       // Calculate column widths based on content
// // //       const colWidths = [];
// // //       const range = XLSX.utils.decode_range(ws['!ref']);
// // //       for (let C = range.s.c; C <= range.e.c; ++C) {
// // //         let maxWidth = 10;
// // //         for (let R = range.s.r; R <= range.e.r; ++R) {
// // //           const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
// // //           const cell = ws[cellAddress];
// // //           if (cell && cell.v) {
// // //             const cellValue = String(cell.v);
// // //             const cellLength = cellValue.length;
// // //             if (cellLength > maxWidth) {
// // //               maxWidth = cellLength;
// // //             }
// // //           }
// // //         }
// // //         colWidths.push({ wch: Math.min(maxWidth + 2, 50) });
// // //       }
// // //       ws['!cols'] = colWidths;
      
// // //       // Apply text wrapping and auto row height to all cells
// // //       if (!ws['!rows']) ws['!rows'] = [];
// // //       for (let R = range.s.r; R <= range.e.r; ++R) {
// // //         if (!ws['!rows'][R]) ws['!rows'][R] = {};
// // //         ws['!rows'][R].hpt = undefined; // Auto height
// // //         for (let C = range.s.c; C <= range.e.c; ++C) {
// // //           const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
// // //           if (!ws[cellAddress]) continue;
// // //           if (!ws[cellAddress].s) ws[cellAddress].s = {};
// // //           ws[cellAddress].s.wrapText = true;
// // //           ws[cellAddress].s.alignment = { wrapText: true, vertical: 'top' };
// // //         }
// // //       }
      
// // //       const wb = XLSX.utils.book_new();
// // //       XLSX.utils.book_append_sheet(wb, ws, 'Stock Items');
// // //       XLSX.writeFile(wb, 'stock_items.xlsx');
// // //       toast.success('Excel file exported successfully!');
// // //     } catch (error) {
// // //       console.error('Export error:', error);
// // //       toast.error('Failed to export. Please try again.');
// // //     } finally {
// // //       setExporting(false);
// // //     }
// // //   };

// // //   // const canEdit = user?.role === 'admin' || user?.role === 'super_admin';
// // //   // const canDelete = user?.role === 'super_admin';

// // //   const handleView = async (item) => {
// // //     if (updating || deleting || quickSaleLoading || modalLoading) return;
// // //     // Prevent opening if another modal is already open
// // //     if (showEditModal || showQuickSaleModal || showStockAmountModal || showViewModal) {
// // //       return;
// // //     }
// // //     setModalLoading(true);
// // //     // Close all other modals first
// // //     setShowEditModal(false);
// // //     setShowQuickSaleModal(false);
// // //     setShowStockAmountModal(false);
// // //     setEditingItem(null);
// // //     setOriginalItemData(null);
// // //     setQuickSaleItem(null);
// // //     try {
// // //       const response = await apiClient.get(`${config.api.items}/${item.id}`);
// // //       setViewItem(response.data.item);
// // //       setShowViewModal(true);
// // //     } catch (error) {
// // //       alert('Error fetching item details: ' + (error.response?.data?.error || 'Unknown error'));
// // //     } finally {
// // //       setModalLoading(false);
// // //     }
// // //   };

// // //   const handleQuickSale = (item) => {
// // //     if (updating || deleting || quickSaleLoading || modalLoading) return;
// // //     // Prevent opening if another modal is already open
// // //     if (showEditModal || showViewModal || showStockAmountModal || showQuickSaleModal) {
// // //       return;
// // //     }
// // //     setModalLoading(true);
// // //     // Close all other modals first
// // //     setShowEditModal(false);
// // //     setShowViewModal(false);
// // //     setShowStockAmountModal(false);
// // //     setEditingItem(null);
// // //     setOriginalItemData(null);
// // //     setViewItem(null);
// // //     setQuickSaleItem(item);
// // //     setQuickSaleQuantity(1);
// // //     setShowQuickSaleModal(true);
// // //     setModalLoading(false);
// // //   };

// // //   const handleQuickSaleSubmit = async () => {
// // //     if (quickSaleLoading) return;
    
// // //     // Parse quantity and validate
// // //     const qty = parseInt(quickSaleQuantity) || 0;
    
// // //     if (!quickSaleItem || qty <= 0) {
// // //       alert('Please enter a valid quantity');
// // //       return;
// // //     }

// // //     if (qty > quickSaleItem.quantity) {
// // //       alert(`Insufficient stock. Available: ${quickSaleItem.quantity}`);
// // //       return;
// // //     }

// // //     setQuickSaleLoading(true);
// // //     try {
// // //       // Get retail seller party for quick sales
// // //       const retailResponse = await apiClient.get(config.api.sellersRetail);
// // //       const retailPartyId = retailResponse.data.party.id;

// // //       // Create sale transaction (using retail buyer as seller party for quick sales)
// // //       await apiClient.post(config.api.sale, {
// // //         seller_party_id: retailPartyId,
// // //         items: [{
// // //           item_id: quickSaleItem.id,
// // //           quantity: qty,
// // //           sale_rate: parseFloat(quickSaleItem.sale_rate) || 0
// // //         }],
// // //         payment_status: 'fully_paid',
// // //         paid_amount: quickSaleItem.sale_rate * qty,
// // //         discount: 0,
// // //         with_gst: false
// // //       });

// // //       toast.success('Quick sale completed successfully!');
// // //       setShowQuickSaleModal(false);
// // //       setQuickSaleItem(null);
// // //       fetchItems();
// // //       if (user?.role === 'super_admin') {
// // //         fetchTotalStockAmount();
// // //       }
// // //     } catch (error) {
// // //       toast.error('Error completing quick sale: ' + (error.response?.data?.error || 'Unknown error'));
// // //     } finally {
// // //       setQuickSaleLoading(false);
// // //     }
// // //   };

// // //   const handleEdit = async (item) => {
// // //     if (updating || deleting || quickSaleLoading || modalLoading) return;
// // //     // Prevent opening if another modal is already open
// // //     if (showViewModal || showQuickSaleModal || showStockAmountModal || showEditModal) {
// // //       return;
// // //     }
// // //     setModalLoading(true);
// // //     // Close all other modals first
// // //     setShowViewModal(false);
// // //     setShowQuickSaleModal(false);
// // //     setShowStockAmountModal(false);
// // //     setViewItem(null);
// // //     setQuickSaleItem(null);
    
// // //     setEditingItem(item);
    
// // //     // Store original values for comparison
// // //     // Handle both purchase_rate and purchase_price field names from API
// // //     // const purchaseRate = item.purchase_rate !== undefined && item.purchase_rate !== null
// // //     //   ? item.purchase_rate
// // //     //   : (item.purchase_price !== undefined && item.purchase_price !== null
// // //     //     ? item.purchase_price
// // //     //     : 0);
    
// // //     setOriginalItemData({
// // //       product_name: item.product_name,
// // //       unit: item.unit || '',
// // //       brand: item.brand || '',
// // //       tax_rate: item.tax_rate || 18,
// // //       sale_rate: item.sale_rate || 0,
// // //       min_sale_rate: item.min_sale_rate || 0,
// // //       purchase_rate: item.purchase_rate || 0,
// // //       quantity: item.quantity || 0,
// // //       alert_quantity: item.alert_quantity || 0,
// // //       rack_number: item.rack_number || '',
// // //       remarks: item.remarks || ''
// // //     });
// // //     setEditFormData({
// // //       product_name: item.product_name,
// // //       unit: item.unit || '',
// // //       brand: item.brand || '',
// // //       tax_rate: item.tax_rate || 18,
// // //       sale_rate: item.sale_rate || 0,
// // //       min_sale_rate: item.min_sale_rate || 0,
// // //       purchase_rate: item.purchase_rate || 0,
// // //       quantity: item.quantity || 0,
// // //       alert_quantity: item.alert_quantity || 0,
// // //       rack_number: item.rack_number || '',
// // //       remarks: item.remarks || ''
// // //     });
// // //     // Fetch full item details to get image and purchase_rate
// // //     try {
// // //       const response = await apiClient.get(`${config.api.items}/${item.id}`);
// // //       const fullItem = response.data.item;
      
// // //       // Update purchase_rate and min_sale_rate from API response if available
// // //       const purchaseRate = fullItem.purchase_rate !== undefined && fullItem.purchase_rate !== null 
// // //         ? fullItem.purchase_rate 
// // //         : (fullItem.purchase_price !== undefined && fullItem.purchase_price !== null 
// // //           ? fullItem.purchase_price 
// // //           : null);
// // //       const minSaleRate = fullItem.min_sale_rate != null && fullItem.min_sale_rate !== '' ? parseFloat(fullItem.min_sale_rate) : null;
// // //       const updatedFormData = {
// // //         ...originalItemData,
// // //         unit: fullItem.unit || '',
// // //         ...(user?.role === 'super_admin' && purchaseRate !== null ? { purchase_rate: parseFloat(purchaseRate) || 0 } : {}),
// // //         ...(minSaleRate !== undefined ? { min_sale_rate: minSaleRate } : {})
// // //       };
// // //       if (updatedFormData.purchase_rate !== originalItemData.purchase_rate || updatedFormData.min_sale_rate !== originalItemData.min_sale_rate || updatedFormData.unit !== originalItemData.unit) {
// // //         setEditFormData(updatedFormData);
// // //         setOriginalItemData(updatedFormData);
// // //       }
// // //     } catch (error) {
// // //       console.error('Error fetching item details:', error);
// // //     } finally {
// // //       setModalLoading(false);
// // //     }
// // //     setEditFormData(originalItemData);
// // //     setShowEditModal(true);
// // //   };

// // //   const handleUpdate = async () => {
// // //     if (!editingItem || updating || !originalItemData) return;

// // //     // Validation for fields that are being updated
// // //     if (editFormData.product_name !== undefined) {
// // //       if (!editFormData.product_name || editFormData.product_name.trim() === '') {
// // //         toast.error('Product name is required');
// // //         return;
// // //       }
// // //     }

// // //     if (editFormData.sale_rate !== undefined) {
// // //       if (!editFormData.sale_rate || editFormData.sale_rate <= 0) {
// // //         toast.error('Sale rate is required and must be greater than 0');
// // //         return;
// // //       }
// // //     }

// // //     if (user?.role === 'super_admin' && editFormData.purchase_rate !== undefined) {
// // //       if (!editFormData.purchase_rate || editFormData.purchase_rate <= 0) {
// // //         toast.error('Purchase rate is required and must be greater than 0');
// // //         return;
// // //       }
// // //     }

// // //     // Validate sale_rate >= purchase_rate (check both current and original values)
// // //     const finalSaleRate = editFormData.sale_rate !== undefined ? editFormData.sale_rate : originalItemData.sale_rate;
// // //     const finalPurchaseRate = editFormData.purchase_rate !== undefined ? editFormData.purchase_rate : originalItemData.purchase_rate;
// // //     const finalMinSaleRate = editFormData.min_sale_rate !== undefined ? editFormData.min_sale_rate : originalItemData.min_sale_rate;

// // //     if (finalSaleRate > 0 && finalPurchaseRate > 0 && parseFloat(finalSaleRate) < parseFloat(finalPurchaseRate)) {
// // //       toast.error('Sale rate must be greater than or equal to purchase rate');
// // //       return;
// // //     }

// // //     if (finalSaleRate > 0 && finalMinSaleRate > 0 && parseFloat(finalSaleRate) < parseFloat(finalMinSaleRate)) {
// // //       toast.error(`Sale rate cannot be less than minimum sale rate (₹${parseFloat(finalMinSaleRate).toFixed(2)})`);
// // //       return;
// // //     }

// // //     if (editFormData.quantity !== undefined && editFormData.quantity < 0) {
// // //       toast.error('Quantity must be 0 or greater');
// // //       return;
// // //     }

// // //     setUpdating(true);
// // //     try {
// // //       // Compare current form data with original data and only include changed fields
// // //       const changedFields = {};
      
// // //       Object.keys(editFormData).forEach(key => {
// // //         const currentValue = editFormData[key];
// // //         const originalValue = originalItemData[key];
        
// // //         // Compare values (handle null/undefined and string trimming)
// // //         const currentVal = currentValue !== null && currentValue !== undefined ? String(currentValue).trim() : '';
// // //         const originalVal = originalValue !== null && originalValue !== undefined ? String(originalValue).trim() : '';
        
// // //         // For numeric fields, compare as numbers
// // //         if (['sale_rate', 'purchase_rate', 'quantity', 'alert_quantity', 'tax_rate'].includes(key)) {
// // //           if (parseFloat(currentVal) !== parseFloat(originalVal)) {
// // //             changedFields[key] = currentValue;
// // //           }
// // //         } else if (key === 'min_sale_rate') {
// // //           const curNum = currentVal === '' || currentValue === null || currentValue === undefined ? null : parseFloat(currentVal);
// // //           const origNum = originalVal === '' || originalValue === null || originalValue === undefined ? null : parseFloat(originalVal);
// // //           const curValid = curNum !== null && !isNaN(curNum);
// // //           const origValid = origNum !== null && !isNaN(origNum);
// // //           if (curValid !== origValid || (curValid && origValid && curNum !== origNum)) {
// // //             changedFields[key] = currentVal === '' || currentValue === null || currentValue === undefined ? null : (isNaN(parseFloat(currentVal)) ? null : parseFloat(currentVal));
// // //           }
// // //         } else {
// // //           // For string fields, compare as strings
// // //           if (currentVal !== originalVal) {
// // //             changedFields[key] = currentValue;
// // //           }
// // //         }
// // //       });


// // //       // If no fields changed, show message and return
// // //       if (Object.keys(changedFields).length === 0) {
// // //         toast.info('No changes detected');
// // //         setUpdating(false);
// // //         return;
// // //       }

// // //       await apiClient.patch(`${config.api.items}/${editingItem.id}`, changedFields);
// // //       toast.success('Item updated successfully!');
// // //       setShowEditModal(false);
// // //       setEditingItem(null);
// // //       setOriginalItemData(null);
// // //       fetchItems(); // Refresh the list
// // //       if (user?.role === 'super_admin') {
// // //         fetchTotalStockAmount();
// // //       }
// // //     } catch (error) {
// // //       toast.error('Error updating item: ' + (error.response?.data?.error || 'Unknown error'));
// // //     } finally {
// // //       setUpdating(false);
// // //     }
// // //   };

// // //   const handleDelete = async (itemId, productName) => {
// // //     if (deleting) return;
    
// // //     if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
// // //       return;
// // //     }

// // //     setDeleting(true);
// // //     try {
// // //       await apiClient.delete(`${config.api.items}/${itemId}`);
// // //       toast.success('Item deleted successfully!');
// // //       fetchItems(); // Refresh the list
// // //       if (user?.role === 'super_admin') {
// // //         fetchTotalStockAmount();
// // //       }
// // //     } catch (error) {
// // //       toast.error('Error deleting item: ' + (error.response?.data?.error || 'Unknown error'));
// // //     } finally {
// // //       setDeleting(false);
// // //     }
// // //   };

// // //   return (
// // //     <Layout>
// // //       {showDueAlertModal && (
// // //         <div className="modal-overlay due-alert-overlay">
// // //           <div className="due-alert-modal" onClick={(e) => e.stopPropagation()}>
// // //             <div className="due-alert-modal-header">
// // //               <div className="due-alert-modal-title-wrap">
// // //                 <span className="due-alert-modal-icon" aria-hidden>⚠</span>
// // //                 <div>
// // //                   <h3 className="due-alert-modal-title">Overdue Creditors</h3>
// // //                   <p className="due-alert-modal-subtitle">
// // //                     Outstanding balances past due date. Review and follow up from Due Sheet.
// // //                   </p>
// // //                 </div>
// // //               </div>
// // //               <button
// // //                 type="button"
// // //                 className="due-alert-modal-close"
// // //                 onClick={() => setShowDueAlertModal(false)}
// // //                 aria-label="Close"
// // //               >
// // //                 ×
// // //               </button>
// // //             </div>
// // //             <div className="due-alert-modal-summary">
// // //               <span className="due-alert-summary-item">
// // //                 <strong>{dueAlertParties.length}</strong> creditor{dueAlertParties.length !== 1 ? 's' : ''}
// // //               </span>
// // //               <span className="due-alert-summary-item due-alert-summary-amount">
// // //                 ₹ {formatCurrency(dueAlertParties.reduce((sum, p) => sum + (Number(p.balance_amount) || 0), 0))} outstanding
// // //               </span>
// // //             </div>
// // //             <div className="due-alert-modal-body">
// // //               <table className="due-alert-table">
// // //                 <thead>
// // //                   <tr>
// // //                     <th style={{ textAlign: 'center' }}>#</th>
// // //                     <th>Creditor</th>
// // //                     <th>Mobile</th>
// // //                     <th>Due Date</th>
// // //                     <th className="due-alert-th-amount">Outstanding</th>
// // //                     <th style={{ textAlign: 'center' }}>Actions</th>
// // //                   </tr>
// // //                 </thead>
// // //                 <tbody>
// // //                   {dueAlertParties.map((p, idx) => (
// // //                     <tr key={p.id}>
// // //                       <td style={{ textAlign: 'center' }}>{idx + 1}</td>
// // //                       <td><strong>{p.party_name}</strong></td>
// // //                       <td>{p.mobile_number || '—'}</td>
// // //                       <td>
// // //                         {dueDateEditingId === p.id ? (
// // //                           <span className="due-alert-edit-date-wrap">
// // //                             <input
// // //                               type="date"
// // //                               value={dueDateEditingValue}
// // //                               onChange={(e) => setDueDateEditingValue(e.target.value)}
// // //                               className="due-alert-date-input"
// // //                             />
// // //                             <button
// // //                               type="button"
// // //                               className="btn btn-primary btn-sm due-alert-date-btn"
// // //                               onClick={() => handleSaveDueDate(p.id)}
// // //                               disabled={dueDateSaving}
// // //                             >
// // //                               {dueDateSaving ? 'Saving...' : 'Save'}
// // //                             </button>
// // //                             <button
// // //                               type="button"
// // //                               className="btn btn-secondary btn-sm due-alert-date-btn"
// // //                               onClick={() => { setDueDateEditingId(null); setDueDateEditingValue(''); }}
// // //                               disabled={dueDateSaving}
// // //                             >
// // //                               Cancel
// // //                             </button>
// // //                           </span>
// // //                         ) : (
// // //                           <>
// // //                             {p.due_date
// // //                               ? new Date(p.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
// // //                               : '—'}
// // //                           </>
// // //                         )}
// // //                       </td>
// // //                       <td className="due-alert-amount-cell">₹ {formatCurrency(p.balance_amount)}</td>
// // //                       <td style={{ textAlign: 'center' }}>
// // //                         {dueDateEditingId === p.id ? null : (
// // //                           <button
// // //                             type="button"
// // //                             className="btn btn-sm btn-outline-secondary due-alert-change-date"
// // //                             onClick={() => startEditDueDate(p)}
// // //                             style={{ margin: '0 auto' }}
// // //                           >
// // //                             Change date
// // //                           </button>
// // //                         )}
// // //                       </td>
// // //                     </tr>
// // //                   ))}
// // //                 </tbody>
// // //               </table>
// // //             </div>
// // //             <div className="due-alert-modal-footer">
// // //               <button
// // //                 type="button"
// // //                 className="btn btn-secondary due-alert-btn-close"
// // //                 onClick={() => setShowDueAlertModal(false)}
// // //               >
// // //                 Close
// // //               </button>
// // //               <button
// // //                 type="button"
// // //                 className="btn btn-primary due-alert-btn-sheet"
// // //                 onClick={() => {
// // //                   setShowDueAlertModal(false);
// // //                   navigate('/due-sheet');
// // //                 }}
// // //               >
// // //                 Open Due Sheet
// // //               </button>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       )}
// // //       <TransactionLoader 
// // //         isLoading={homeTab === 'items' && (loading || updating || deleting || quickSaleLoading || paginationLoading)} 
// // //         type="transaction" 
// // //         message={
// // //           loading ? 'Loading stock inventory...' :
// // //           updating ? 'Updating item...' : 
// // //           deleting ? 'Deleting item...' : 
// // //           quickSaleLoading ? 'Processing quick sale...' : 
// // //           paginationLoading ? 'Loading items...' : 
// // //           ''
// // //         } 
// // //       />
// // //       <div className={`dashboard ${homeTab === 'items' ? 'dashboard--items' : 'dashboard--hub'}`}>
// // //         {/* <header className={`pp-home-hero ${homeTab === 'items' ? 'pp-home-hero--compact' : ''}`}>
// // //           <div className="pp-home-hero__text">
// // //             <p className="pp-home-hero__eyebrow">Operations hub</p>
// // //             <h1 className="pp-home-hero__title">Dashboard</h1>
// // //           </div>
// // //           <nav className="pp-seg" aria-label="Dashboard section">
// // //             {[
// // //               { id: 'items', label: 'Stock & items' },
// // //               { id: 'nozzles', label: 'Nozzle readings' },
// // //               { id: 'creditors', label: 'Due sheet' }
// // //             ].map((t) => (
// // //               <button
// // //                 key={t.id}
// // //                 type="button"
// // //                 className={`pp-seg__btn ${homeTab === t.id ? 'pp-seg__btn--active' : ''}`}
// // //                 onClick={() => setHomeTab(t.id)}
// // //                 aria-current={homeTab === t.id ? 'page' : undefined}
// // //               >
// // //                 {t.label}
// // //               </button>
// // //             ))}
// // //           </nav>
// // //         </header> */}

// // //         {homeTab === 'items' && (
// // //         <>
// // //         <div className="dashboard-wrapper">
// // //           {/* Left: Title + table (scrolls) */}
// // //           <div className="dashboard-main">
// // //             <div className="pp-page-header">
// // //               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
// // //                 <span style={{ fontSize: '24px' }}>📊</span>
// // //                 <h2 className="dashboard-title">Stock Dashboard</h2>
// // //               </div>
// // //             </div>
// // //             <div className="dashboard-scrollable-content">
// // //           {(items.length === 0 && !loading) ? (
// // //             <div className="empty-state" style={{ textAlign: 'center', padding: '40px' }}>
// // //               <span style={{ color: '#94a3b8' }}>No items found in your inventory</span>
// // //             </div>
// // //           ) : (
// // //                <div className="table-scroll dashboard-items-table-scroll" aria-label="Stock table">
// // //                <div className="table-container">
// // //                 <table className="table">
// // //                   <thead>
// // //                     <tr>
// // //                       <th style={{ textAlign: 'left' }}>S.No</th>
// // //                       <th onClick={() => handleSort('product_name')} style={{ cursor: 'pointer' }}>Product Name {getSortIcon('product_name')}</th>
// // //                       <th onClick={() => handleSort('unit')} style={{ cursor: 'pointer' }}>Unit {getSortIcon('unit')}</th>
// // //                       <th onClick={() => handleSort('brand')} style={{ cursor: 'pointer' }}>Brand {getSortIcon('brand')}</th>
// // //                       <th style={{ textAlign: 'right' }}>Tax (%)</th>
// // //                       <th style={{ textAlign: 'right' }}>Sale Rate</th>
// // //                       <th style={{ textAlign: 'left' }}>Remarks</th>
// // //                       <th style={{ textAlign: 'center' }}>Stock</th>
// // //                       <th style={{ textAlign: 'center' }}>Rack</th>
// // //                       <th style={{ textAlign: 'center' }}>Actions</th>
// // //                     </tr>
// // //                   </thead>
// // //                   <tbody>
// // //                     {sortedItems.map((item, index) => {
// // //                       const canEdit = user && (user.role === 'admin' || user.role === 'super_admin');
// // //                       const canDelete = user && user.role === 'super_admin';
// // //                       return (
// // //                         <tr key={item.id} className={item.quantity <= (item.alert_quantity || 0) ? 'stock-alert-row' : ''}>
// // //                           <td style={{ textAlign: 'left' }}>{(page - 1) * limit + index + 1}</td>
// // //                           <td style={{ textAlign: 'left' }}>{item.product_name}</td>
// // //                           <td style={{ textAlign: 'left' }}>{item.unit || <span style={{color: '#999'}}>N/A</span>}</td>
// // //                           <td style={{ textAlign: 'left' }}>{item.brand || <span style={{color: '#999'}}>N/A</span>}</td>
// // //                           <td style={{ textAlign: 'right' }}>{item.tax_rate}%</td>
// // //                           <td style={{ textAlign: 'right' }}>₹{item.sale_rate}</td>
// // //                           <td 
// // //                             style={{ 
// // //                               textAlign: 'left',
// // //                               maxWidth: '200px', 
// // //                               overflow: 'hidden', 
// // //                               textOverflow: 'ellipsis', 
// // //                               whiteSpace: 'nowrap',
// // //                               cursor: item.remarks ? 'pointer' : 'default'
// // //                             }}
// // //                             title={item.remarks ? String(item.remarks).trim() : undefined}
// // //                           >
// // //                             {item.remarks || '-'}
// // //                           </td>
// // //                           <td style={{ textAlign: 'center' }}>{item.quantity}</td>
// // //                           <td style={{ textAlign: 'center' }}>{item.rack_number || '-'}</td>
// // //                           <td style={{ textAlign: 'center', padding: '8px 4px', display: 'table-cell', verticalAlign: 'middle' }}>
// // //                             <ActionMenu
// // //                               itemId={item.id}
// // //                               itemName={item.product_name}
// // //                               disabled={modalLoading || updating || deleting || quickSaleLoading}
// // //                               actions={[
// // //                                 {
// // //                                   label: 'View',
// // //                                   icon: '👁️',
// // //                                   onClick: () => handleView(item)
// // //                                 },
// // //                                 ...(canEdit ? [{
// // //                                   label: 'Edit',
// // //                                   icon: '✏️',
// // //                                   onClick: () => handleEdit(item)
// // //                                 }] : []),
// // //                                 {
// // //                                   label: 'Quick Sale',
// // //                                   icon: '⚡',
// // //                                   onClick: () => handleQuickSale(item)
// // //                                 },
// // //                                 ...(canDelete ? [{
// // //                                   label: 'Delete',
// // //                                   icon: '🗑️',
// // //                                   danger: true,
// // //                                   onClick: (id, name) => handleDelete(id, name)
// // //                                 }] : [])
// // //                               ]}
// // //                             />
// // //                           </td>
// // //                         </tr>
// // //                       );
// // //                     })}
// // //                   </tbody>
// // //                 </table>
// // //               </div>
// // //               </div>
// // //           )}
// // //             </div>
// // //           </div>
// // //         </div>

// // //           {/* Right panel - rendered in body so always visible (not clipped by main-content overflow) */}
// // //           {createPortal(
// // //           <aside className="dashboard-right-panel">
// // //             <div className="right-panel-section">
// // //               {user?.role === 'super_admin' && (
// // //                 <button
// // //                   onClick={async () => {
// // //                     if (totalStockAmount === null) await fetchTotalStockAmount();
// // //                     setShowStockAmountModal(true);
// // //                   }}
// // //                   className="btn btn-primary right-panel-btn"
// // //                 >
// // //                   Total Stock Amount
// // //                 </button>
// // //               )}
// // //               <button
// // //                 onClick={exportToExcel}
// // //                 className="btn btn-success right-panel-btn"
// // //                 disabled={exporting || items.length === 0}
// // //               >
// // //                 {exporting ? 'Exporting...' : 'Export to Excel'}
// // //               </button>
// // //             </div>

// // //             <div className="right-panel-section">
// // //               <label className="right-panel-label">Quick Search</label>
// // //               <select
// // //                 value={searchField}
// // //                 onChange={(e) => setSearchField(e.target.value)}
// // //                 className="right-panel-select"
// // //               >
// // //                 <option value="product_name">Product Name</option>
// // //                 <option value="brand">Brand</option>
// // //                 <option value="remarks">Remarks</option>
// // //               </select>
// // //               <input
// // //                 type="text"
// // //                 placeholder="Search..."
// // //                 value={search}
// // //                 onChange={(e) => setSearch(e.target.value)}
// // //                 className="right-panel-input"
// // //               />
// // //             </div>

// // //             <div className="right-panel-section">
// // //               <button
// // //                 onClick={() => {
// // //                   if (showAdvancedSearch) {
// // //                     setAdvancedSearch({ product_name: '', brand: '', remarks: '' });
// // //                     setPage(1);
// // //                     if (allItems.length > 0) {
// // //                       setItems(allItems.slice(0, limit));
// // //                       setTotalPages(Math.ceil(allItems.length / limit));
// // //                     } else fetchItems();
// // //                   }
// // //                   setShowAdvancedSearch(!showAdvancedSearch);
// // //                 }}
// // //                 className={`btn btn-secondary right-panel-btn full-width ${showAdvancedSearch ? 'active' : ''}`}
// // //               >
// // //                 Advanced Search
// // //               </button>
// // //             </div>

// // //             {showAdvancedSearch && (
// // //               <div className="right-panel-section card advanced-search-panel">
// // //                 <div className="advanced-search-header">
// // //                   <h4 className="advanced-search-title">Advanced Search</h4>
// // //                   <button
// // //                     type="button"
// // //                     onClick={() => {
// // //                       setAdvancedSearch({ product_name: '', brand: '', remarks: '' });
// // //                       setPage(1);
// // //                       if (allItems.length > 0) {
// // //                         setItems(allItems.slice(0, limit));
// // //                         setTotalPages(Math.ceil(allItems.length / limit));
// // //                       } else fetchItems();
// // //                       setShowAdvancedSearch(false);
// // //                     }}
// // //                     className="btn-close-advanced"
// // //                     title="Close Advanced Search"
// // //                   >
// // //                     ×
// // //                   </button>
// // //                 </div>
// // //                 <input
// // //                   type="text"
// // //                   placeholder="Product Name"
// // //                   value={advancedSearch.product_name}
// // //                   onChange={(e) => setAdvancedSearch({ ...advancedSearch, product_name: e.target.value })}
// // //                   className="right-panel-input"
// // //                 />
// // //                 <input
// // //                   type="text"
// // //                   placeholder="Unit"
// // //                   value={advancedSearch.unit}
// // //                   onChange={(e) => setAdvancedSearch({ ...advancedSearch, unit: e.target.value })}
// // //                   className="right-panel-input"
// // //                 />
// // //                 <div className="form-group">
// // //                     <label>Brand</label>
// // //                     <input
// // //                       type="text"
// // //                       value={advancedSearch.brand}
// // //                       onChange={(e) => setAdvancedSearch({...advancedSearch, brand: e.target.value})}
// // //                       placeholder="Brand Name"
// // //                     />
// // //                   </div>
// // //                 <input
// // //                   type="text"
// // //                   placeholder="Remarks"
// // //                   value={advancedSearch.remarks}
// // //                   onChange={(e) => setAdvancedSearch({ ...advancedSearch, remarks: e.target.value })}
// // //                   className="right-panel-input"
// // //                 />
// // //                 <div className="advanced-search-actions">
// // //                   <button
// // //                     onClick={handleAdvancedSearch}
// // //                     className="btn btn-primary"
// // //                     disabled={searching}
// // //                   >
// // //                     {searching ? 'Searching...' : 'Search'}
// // //                   </button>
// // //                   <button
// // //                     onClick={() => {
// // //                       setAdvancedSearch({ product_name: '', unit: '', brand: '', remarks: '' });
// // //                       setSearch('');
// // //                       fetchItems();
// // //                     }}
// // //                     className="btn btn-secondary"
// // //                     disabled={searching || loading}
// // //                   >
// // //                     Clear
// // //                   </button>
// // //                 </div>
// // //                 <button
// // //                   type="button"
// // //                   onClick={() => {
// // //                     setAdvancedSearch({ product_name: '', unit: '', brand: '', remarks: '' });
// // //                     setPage(1);
// // //                     if (allItems.length > 0) {
// // //                       setItems(allItems.slice(0, limit));
// // //                       setTotalPages(Math.ceil(allItems.length / limit));
// // //                     } else fetchItems();
// // //                     setShowAdvancedSearch(false);
// // //                   }}
// // //                   className="btn btn-secondary right-panel-btn full-width"
// // //                 >
// // //                   Close Advanced Search
// // //                 </button>
// // //               </div>
// // //             )}

// // //             <div className="right-panel-section">
// // //               <label className="right-panel-label">Records per page</label>
// // //               <select
// // //                 value={limit >= allItems.length ? 'all' : limit}
// // //                 onChange={(e) => {
// // //                   setPaginationLoading(true);
// // //                   const newLimit = e.target.value === 'all' ? allItems.length : parseInt(e.target.value);
// // //                   setLimit(newLimit);
// // //                   setPage(1);
// // //                 }}
// // //                 disabled={paginationLoading || loading}
// // //                 className="right-panel-select full-width"
// // //               >
// // //                 <option value="200">200 (Default)</option>
// // //                 <option value="500">500</option>
// // //                 <option value="2000">2000</option>
// // //                 <option value="all">All ({allItems.length} items)</option>
// // //               </select>
// // //             </div>

// // //             {totalPages > 1 && (
// // //               <div className="right-panel-section right-panel-pagination">
// // //                 <label className="right-panel-label">Page</label>
// // //                 <Pagination
// // //                   currentPage={page}
// // //                   totalPages={totalPages}
// // //                   onPageChange={(newPage) => {
// // //                     if (!paginationLoading) {
// // //                       setPaginationLoading(true);
// // //                       setPage(newPage);
// // //                       window.scrollTo({ top: 0, behavior: 'smooth' });
// // //                     }
// // //                   }}
// // //                   totalRecords={allItems.length}
// // //                   showTotalRecords={true}
// // //                 />
// // //               </div>
// // //             )}
// // //           </aside>,
// // //           document.body
// // //           )}
// // //         </>
// // //         )}

// // //         {homeTab === 'nozzles' && (
// // //           <div className="dashboard-embedded-wrap">
// // //             <NozzleReadingPanel embedded />
// // //           </div>
// // //         )}

// // //         {homeTab === 'creditors' && (
// // //           <div className="dashboard-embedded-wrap">
// // //             <DueSheetPanel embedded />
// // //           </div>
// // //         )}
        
// // //         {/* Edit Item Modal */}
// // //         {showEditModal && editingItem && (
// // //           <div className="modal-overlay" onClick={(e) => {
// // //             // Prevent closing on backdrop click
// // //             if (e.target === e.currentTarget) {
// // //               e.stopPropagation();
// // //             }
// // //           }}>
// // //             <div className="modal-content" onClick={(e) => e.stopPropagation()}>
// // //               <div className="modal-header">
// // //                 <h3>Edit Item: {editingItem.product_name}</h3>
// // //                 <button className="modal-close" onClick={() => {
// // //                   setShowEditModal(false);
// // //                   setEditingItem(null);
// // //                   setOriginalItemData(null);
// // //                 }}>×</button>
// // //               </div>
// // //               <div className="modal-body">
// // //                 <div className="form-group">
// // //                   <label>Product Name *</label>
// // //                   <input
// // //                     type="text"
// // //                     value={editFormData.product_name}
// // //                     onChange={(e) => setEditFormData({ ...editFormData, product_name: e.target.value })}
// // //                     required
// // //                   />
// // //                 </div>
// // //                 <div className="form-group">
// // //                   <label>Brand</label>
// // //                   <input
// // //                     type="text"
// // //                     value={editFormData.brand}
// // //                     onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
// // //                   />
// // //                 </div>
// // //                 <div className="form-group">
// // //                   <label>Unit (liter / packet / kg) *</label>
// // //                   <select
// // //                     value={editFormData.unit}
// // //                     onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
// // //                     required
// // //                     style={{
// // //                       width: '100%',
// // //                       padding: '10px 12px',
// // //                       border: '1px solid #ddd',
// // //                       borderRadius: '6px',
// // //                       fontSize: '14px'
// // //                     }}
// // //                   >
// // //                     <option value="">Select Unit</option>
// // //                     <option value="liter">Liter</option>
// // //                     <option value="packet">Packet</option>
// // //                     <option value="kg">KG</option>
// // //                     <option value="pcs">Pcs</option>
// // //                     <option value="box">Box</option>
// // //                     <option value="mtr">Meter</option>
// // //                   </select>
// // //                 </div>
// // //                 <div className="form-row">
// // //                   {user?.role === 'super_admin' && (
// // //                     <div className="form-group">
// // //                       <label>Purchase Rate *</label>
// // //                       <div style={{ position: 'relative' }}>
// // //                         <input
// // //                           type="number"
// // //                           step="0.01"
// // //                           min="0"
// // //                           value={editFormData.purchase_rate === 0 ? '' : editFormData.purchase_rate}
// // //                           onChange={(e) => {
// // //                             const val = e.target.value;
// // //                             setEditFormData({ ...editFormData, purchase_rate: val === '' ? 0 : parseFloat(val) || 0 });
// // //                           }}
// // //                           required
// // //                           style={{
// // //                             width: '100%',
// // //                             padding: '10px 12px',
// // //                             border: editFormData.sale_rate > 0 && editFormData.purchase_rate > 0 && editFormData.sale_rate < editFormData.purchase_rate 
// // //                               ? '2px solid #dc3545' 
// // //                               : editFormData.sale_rate > 0 && editFormData.purchase_rate > 0 && editFormData.sale_rate >= editFormData.purchase_rate
// // //                               ? '2px solid #28a745'
// // //                               : '1px solid #ddd',
// // //                             borderRadius: '6px',
// // //                             fontSize: '14px',
// // //                             transition: 'all 0.2s ease',
// // //                             backgroundColor: editFormData.sale_rate > 0 && editFormData.purchase_rate > 0 && editFormData.sale_rate < editFormData.purchase_rate 
// // //                               ? '#fff5f5' 
// // //                               : editFormData.sale_rate > 0 && editFormData.purchase_rate > 0 && editFormData.sale_rate >= editFormData.purchase_rate
// // //                               ? '#f0fff4'
// // //                               : 'white'
// // //                           }}
// // //                         />
// // //                         {editFormData.sale_rate > 0 && editFormData.purchase_rate > 0 && editFormData.sale_rate >= editFormData.purchase_rate && (
// // //                           <span style={{
// // //                             position: 'absolute',
// // //                             right: '12px',
// // //                             top: '50%',
// // //                             transform: 'translateY(-50%)',
// // //                             color: '#28a745',
// // //                             fontSize: '18px'
// // //                           }}>✓</span>
// // //                         )}
// // //                       </div>
// // //                       {editFormData.sale_rate > 0 && editFormData.purchase_rate > 0 && editFormData.sale_rate < editFormData.purchase_rate && (
// // //                         <div style={{ 
// // //                           display: 'flex', 
// // //                           alignItems: 'center', 
// // //                           gap: '6px', 
// // //                           marginTop: '6px',
// // //                           padding: '8px 12px',
// // //                           backgroundColor: '#fff5f5',
// // //                           borderRadius: '6px',
// // //                           border: '1px solid #fecaca'
// // //                         }}>
// // //                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2" style={{ flexShrink: 0 }}>
// // //                             <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
// // //                             <line x1="12" y1="9" x2="12" y2="13"/>
// // //                             <line x1="12" y1="17" x2="12.01" y2="17"/>
// // //                           </svg>
// // //                           <small style={{ color: '#dc3545', fontSize: '13px', fontWeight: '500' }}>
// // //                             Purchase rate (₹{parseFloat(editFormData.purchase_rate).toFixed(2)}) cannot exceed sale rate (₹{parseFloat(editFormData.sale_rate).toFixed(2)})
// // //                           </small>
// // //                         </div>
// // //                       )}
// // //                       {editFormData.sale_rate > 0 && editFormData.purchase_rate > 0 && editFormData.sale_rate >= editFormData.purchase_rate && (
// // //                         <div style={{ 
// // //                           display: 'flex', 
// // //                           alignItems: 'center', 
// // //                           gap: '6px', 
// // //                           marginTop: '6px',
// // //                           padding: '8px 12px',
// // //                           backgroundColor: '#f0fff4',
// // //                           borderRadius: '6px',
// // //                           border: '1px solid #c6f6d5'
// // //                         }}>
// // //                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2" style={{ flexShrink: 0 }}>
// // //                             <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
// // //                             <polyline points="22 4 12 14.01 9 11.01"/>
// // //                           </svg>
// // //                           <small style={{ color: '#28a745', fontSize: '13px', fontWeight: '500' }}>
// // //                             Valid: Profit margin ₹{(editFormData.sale_rate - editFormData.purchase_rate).toFixed(2)} ({(editFormData.purchase_rate > 0 ? (((editFormData.sale_rate - editFormData.purchase_rate) / editFormData.purchase_rate) * 100).toFixed(2) : 0)}%)
// // //                           </small>
// // //                         </div>
// // //                       )}
// // //                     </div>
// // //                   )}
// // //                   <div className="form-group">
// // //                     <label>Tax Rate (%)</label>
// // //                     <select
// // //                       value={editFormData.tax_rate}
// // //                       onChange={(e) => {
// // //                         setEditFormData({ ...editFormData, tax_rate: parseFloat(e.target.value) || 18 });
// // //                       }}
// // //                       style={{
// // //                         width: '100%',
// // //                         padding: '10px 12px',
// // //                         border: '1px solid #ddd',
// // //                         borderRadius: '6px',
// // //                         fontSize: '14px'
// // //                       }}
// // //                     >
// // //                       <option value="5">5%</option>
// // //                       <option value="18">18%</option>
// // //                       <option value="28">28%</option>
// // //                     </select>
// // //                   </div>
// // //                   <div className="form-group">
// // //                     <label>Sale Rate *</label>
// // //                     <div style={{ position: 'relative' }}>
// // //                       <input
// // //                         type="number"
// // //                         step="0.01"
// // //                         min="0"
// // //                         value={editFormData.sale_rate === 0 ? '' : editFormData.sale_rate}
// // //                         onChange={(e) => {
// // //                           const val = e.target.value;
// // //                           setEditFormData({ ...editFormData, sale_rate: val === '' ? 0 : parseFloat(val) || 0 });
// // //                         }}
// // //                         required
// // //                         style={{
// // //                           width: '100%',
// // //                           padding: '10px 12px',
// // //                           border: editFormData.sale_rate > 0 && editFormData.purchase_rate > 0 && editFormData.sale_rate < editFormData.purchase_rate 
// // //                             ? '2px solid #dc3545' 
// // //                             : editFormData.sale_rate > 0 && editFormData.purchase_rate > 0 && editFormData.sale_rate >= editFormData.purchase_rate
// // //                             ? '2px solid #28a745'
// // //                             : '1px solid #ddd',
// // //                           borderRadius: '6px',
// // //                           fontSize: '14px',
// // //                           transition: 'all 0.2s ease',
// // //                           backgroundColor: editFormData.sale_rate > 0 && editFormData.purchase_rate > 0 && editFormData.sale_rate < editFormData.purchase_rate 
// // //                             ? '#fff5f5' 
// // //                             : editFormData.sale_rate > 0 && editFormData.purchase_rate > 0 && editFormData.sale_rate >= editFormData.purchase_rate
// // //                             ? '#f0fff4'
// // //                             : 'white'
// // //                         }}
// // //                       />
// // //                       {editFormData.sale_rate > 0 && editFormData.purchase_rate > 0 && editFormData.sale_rate >= editFormData.purchase_rate && (
// // //                         <span style={{
// // //                           position: 'absolute',
// // //                           right: '12px',
// // //                           top: '50%',
// // //                           transform: 'translateY(-50%)',
// // //                           color: '#28a745',
// // //                           fontSize: '18px'
// // //                         }}>✓</span>
// // //                       )}
// // //                     </div>
// // //                     {editFormData.sale_rate > 0 && editFormData.purchase_rate > 0 && editFormData.sale_rate < editFormData.purchase_rate && (
// // //                       <div style={{ 
// // //                         display: 'flex', 
// // //                         alignItems: 'center', 
// // //                         gap: '6px', 
// // //                         marginTop: '6px',
// // //                         padding: '8px 12px',
// // //                         backgroundColor: '#fff5f5',
// // //                         borderRadius: '6px',
// // //                         border: '1px solid #fecaca'
// // //                       }}>
// // //                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2" style={{ flexShrink: 0 }}>
// // //                           <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
// // //                           <line x1="12" y1="9" x2="12" y2="13"/>
// // //                           <line x1="12" y1="17" x2="12.01" y2="17"/>
// // //                         </svg>
// // //                         <small style={{ color: '#dc3545', fontSize: '13px', fontWeight: '500' }}>
// // //                           Sale rate (₹{parseFloat(editFormData.sale_rate).toFixed(2)}) must be greater than or equal to purchase rate (₹{parseFloat(editFormData.purchase_rate).toFixed(2)})
// // //                         </small>
// // //                       </div>
// // //                     )}
// // //                     {editFormData.sale_rate > 0 && editFormData.purchase_rate > 0 && editFormData.sale_rate >= editFormData.purchase_rate && (
// // //                       <div style={{ 
// // //                         display: 'flex', 
// // //                         alignItems: 'center', 
// // //                         gap: '6px', 
// // //                         marginTop: '6px',
// // //                         padding: '8px 12px',
// // //                         backgroundColor: '#f0fff4',
// // //                         borderRadius: '6px',
// // //                         border: '1px solid #c6f6d5'
// // //                       }}>
// // //                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2" style={{ flexShrink: 0 }}>
// // //                           <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
// // //                           <polyline points="22 4 12 14.01 9 11.01"/>
// // //                         </svg>
// // //                         <small style={{ color: '#28a745', fontSize: '13px', fontWeight: '500' }}>
// // //                           Valid: Profit margin ₹{(editFormData.sale_rate - editFormData.purchase_rate).toFixed(2)} ({(editFormData.purchase_rate > 0 ? (((editFormData.sale_rate - editFormData.purchase_rate) / editFormData.purchase_rate) * 100).toFixed(2) : 0)}%)
// // //                         </small>
// // //                       </div>
// // //                     )}
// // //                   </div>
// // //                 </div>
// // //                 <div className="form-row">
// // //                   <div className="form-group">
// // //                     <label>Minimum Sale Rate (₹)</label>
// // //                     <input
// // //                       type="number"
// // //                       step="0.01"
// // //                       min="0"
// // //                       value={editFormData.min_sale_rate === null || editFormData.min_sale_rate === undefined || editFormData.min_sale_rate === '' ? '' : editFormData.min_sale_rate}
// // //                       onChange={(e) => {
// // //                         const val = e.target.value;
// // //                         setEditFormData({
// // //                           ...editFormData,
// // //                           min_sale_rate: val === '' ? null : (isNaN(parseFloat(val)) ? null : parseFloat(val))
// // //                         });
// // //                       }}
// // //                       placeholder="Optional floor price"
// // //                     />
// // //                     <small style={{ color: '#666', fontSize: '12px' }}>Floor price for sales (optional)</small>
// // //                     {editFormData.sale_rate > 0 && editFormData.min_sale_rate > 0 && parseFloat(editFormData.sale_rate) < parseFloat(editFormData.min_sale_rate) && (
// // //                       <div style={{ 
// // //                         display: 'flex', 
// // //                         alignItems: 'center', 
// // //                         gap: '6px', 
// // //                         marginTop: '6px',
// // //                         padding: '8px 12px',
// // //                         backgroundColor: '#fff5f5',
// // //                         borderRadius: '6px',
// // //                         border: '1px solid #fecaca'
// // //                       }}>
// // //                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2" style={{ flexShrink: 0 }}>
// // //                           <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
// // //                           <line x1="12" y1="9" x2="12" y2="13"/>
// // //                           <line x1="12" y1="17" x2="12.01" y2="17"/>
// // //                         </svg>
// // //                         <small style={{ color: '#dc3545', fontSize: '13px', fontWeight: '500' }}>
// // //                           Warning: Sale rate (₹{parseFloat(editFormData.sale_rate).toFixed(2)}) is below the minimum sale rate (₹{parseFloat(editFormData.min_sale_rate).toFixed(2)})
// // //                         </small>
// // //                       </div>
// // //                     )}
// // //                   </div>
// // //                 </div>
// // //                 <div className="form-row">
// // //                   <div className="form-group">
// // //                     <label>Quantity *</label>
// // //                     <input
// // //                       type="number"
// // //                       min="0"
// // //                       value={editFormData.quantity === 0 ? '' : editFormData.quantity}
// // //                       onChange={(e) => {
// // //                         const val = e.target.value;
// // //                         setEditFormData({ ...editFormData, quantity: val === '' ? 0 : parseInt(val) || 0 });
// // //                       }}
// // //                       required
// // //                     />
// // //                     <small style={{ color: '#666', fontSize: '12px' }}>Current stock quantity</small>
// // //                   </div>
// // //                   <div className="form-group">
// // //                     <label>Alert Quantity</label>
// // //                     <input
// // //                       type="number"
// // //                       min="0"
// // //                       value={editFormData.alert_quantity === 0 ? '' : editFormData.alert_quantity}
// // //                       onChange={(e) => {
// // //                         const val = e.target.value;
// // //                         setEditFormData({ ...editFormData, alert_quantity: val === '' ? 0 : parseInt(val) || 0 });
// // //                       }}
// // //                     />
// // //                   </div>
// // //                   <div className="form-group">
// // //                     <label>Rack Number</label>
// // //                     <input
// // //                       type="text"
// // //                       value={editFormData.rack_number}
// // //                       onChange={(e) => setEditFormData({ ...editFormData, rack_number: e.target.value })}
// // //                     />
// // //                   </div>
// // //                 </div>
// // //                 <div className="form-group">
// // //                   <label>Remarks (Max 200 characters)</label>
// // //                   <textarea
// // //                     value={editFormData.remarks}
// // //                     onChange={(e) => {
// // //                       const value = e.target.value;
// // //                       if (value.length <= 200) {
// // //                         setEditFormData({ ...editFormData, remarks: value });
// // //                       }
// // //                     }}
// // //                     rows="3"
// // //                     maxLength={200}
// // //                     placeholder="Enter remarks..."
// // //                   />
// // //                   <small style={{ color: '#666', fontSize: '12px' }}>
// // //                     {editFormData.remarks?.length || 0}/200 characters
// // //                   </small>
// // //                 </div>

// // //               </div>
// // //               <div className="modal-footer">
// // //                 <button onClick={() => {
// // //                   setShowEditModal(false);
// // //                   setEditingItem(null);
// // //                   setOriginalItemData(null);
// // //                 }} className="btn btn-secondary">
// // //                   Cancel
// // //                 </button>
// // //                 <button 
// // //                   onClick={handleUpdate} 
// // //                   className="btn btn-primary"
// // //                   disabled={updating}
// // //                 >
// // //                   {updating ? 'Updating...' : 'Update Item'}
// // //                 </button>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {/* Quick Sale Modal */}
// // //         {showQuickSaleModal && quickSaleItem && (
// // //           <div className="modal-overlay" onClick={(e) => {
// // //             // Prevent closing on backdrop click
// // //             if (e.target === e.currentTarget) {
// // //               e.stopPropagation();
// // //             }
// // //           }}>
// // //             <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
// // //               <div className="modal-header">
// // //                 <h3>Quick Sale - {quickSaleItem.product_name}</h3>
// // //                 <button className="modal-close" onClick={() => {
// // //                   setShowQuickSaleModal(false);
// // //                   setQuickSaleItem(null);
// // //                   setQuickSaleQuantity(1);
// // //                 }}>×</button>
// // //               </div>
// // //               <div className="modal-body">
// // //                 <div className="form-group">
// // //                   <label>Product: {quickSaleItem.product_name}</label>
// // //                 </div>
// // //                 <div className="form-group">
// // //                   <label>Brand: {quickSaleItem.brand || 'N/A'}</label>
// // //                 </div>
// // //                 <div className="form-group">
// // //                   <label>Sale Rate: ₹{quickSaleItem.sale_rate}</label>
// // //                 </div>
// // //                 <div className="form-group">
// // //                   <label>Available Quantity: {quickSaleItem.quantity} {quickSaleItem.unit || ''}</label>
// // //                 </div>
// // //                 <div className="form-group">
// // //                   <label>Quantity to Sell *</label>
// // //                   <input
// // //                     type="number"
// // //                     min="1"
// // //                     max={quickSaleItem.quantity}
// // //                     value={quickSaleQuantity}
// // //                     onChange={(e) => {
// // //                       const val = e.target.value;
// // //                       // Allow empty string and intermediate states during typing
// // //                       if (val === '') {
// // //                         setQuickSaleQuantity('');
// // //                         return;
// // //                       }
// // //                       const qty = parseInt(val);
// // //                       // Allow any number during typing, we'll validate on blur
// // //                       if (!isNaN(qty) && qty >= 0) {
// // //                         // Clamp to max available quantity
// // //                         const finalQty = Math.min(qty, quickSaleItem.quantity);
// // //                         setQuickSaleQuantity(finalQty);
// // //                       }
// // //                     }}
// // //                     onBlur={(e) => {
// // //                       // Validate and set minimum value on blur
// // //                       const val = e.target.value;
// // //                       const qty = parseInt(val) || 0;
// // //                       if (qty < 1) {
// // //                         setQuickSaleQuantity(1);
// // //                       } else if (qty > quickSaleItem.quantity) {
// // //                         setQuickSaleQuantity(quickSaleItem.quantity);
// // //                       } else {
// // //                         setQuickSaleQuantity(qty);
// // //                       }
// // //                     }}
// // //                     required
// // //                   />
// // //                 </div>
// // //                 <div className="form-group">
// // //                   <label>Total Amount: ₹{((quickSaleItem.sale_rate || 0) * (parseInt(quickSaleQuantity) || 0)).toFixed(2)}</label>
// // //                 </div>
// // //                 <div style={{ padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px', marginTop: '10px' }}>
// // //                   <strong>Note:</strong> This will be sold to the default "Retail Seller" party.
// // //                 </div>
// // //               </div>
// // //               <div className="modal-footer">
// // //                 <button onClick={() => {
// // //                   setShowQuickSaleModal(false);
// // //                   setQuickSaleItem(null);
// // //                   setQuickSaleQuantity(1);
// // //                 }} className="btn btn-secondary">
// // //                   Cancel
// // //                 </button>
// // //                 <button 
// // //                   onClick={handleQuickSaleSubmit} 
// // //                   className="btn btn-primary"
// // //                   disabled={quickSaleLoading}
// // //                 >
// // //                   {quickSaleLoading ? 'Processing...' : 'Confirm Sale'}
// // //                 </button>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {/* View Item Modal */}
// // //         {showViewModal && viewItem && (
// // //           <div className="modal-overlay" onClick={(e) => {
// // //             // Prevent closing on backdrop click
// // //             if (e.target === e.currentTarget) {
// // //               e.stopPropagation();
// // //             }
// // //           }}>
// // //             <div className="modal-content view-item-modal" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
// // //               <div className="modal-header" style={{ 
// // //                 background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
// // //                 color: 'white',
// // //                 borderBottom: 'none',
// // //                 padding: '25px 30px'
// // //               }}>
// // //                 <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
// // //                   <div style={{
// // //                     width: '50px',
// // //                     height: '50px',
// // //                     borderRadius: '12px',
// // //                     background: 'rgba(255, 255, 255, 0.2)',
// // //                     display: 'flex',
// // //                     alignItems: 'center',
// // //                     justifyContent: 'center',
// // //                     backdropFilter: 'blur(10px)'
// // //                   }}>
// // //                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
// // //                       <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
// // //                     </svg>
// // //                   </div>
// // //                   <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
// // //                     <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
// // //                       <div style={{ flex: '1 1 200px', minWidth: '200px' }}>
// // //                         <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
// // //                           Name
// // //                         </div>
// // //                         <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>{viewItem.product_name}</h3>
// // //                       </div>
// // //                     </div>
// // //                   </div>
// // //                 </div>
// // //                 <button className="modal-close" onClick={() => {
// // //                   setShowViewModal(false);
// // //                   setViewItem(null);
// // //                 }} style={{ color: 'white' }}>×</button>
// // //               </div>
// // //               <div className="modal-body" style={{ padding: '30px', background: '#f8f9fa' }}>
// // //                 {/* Stock Status Card */}
// // //                 <div style={{
// // //                   background: 'white',
// // //                   borderRadius: '12px',
// // //                   padding: '20px',
// // //                   marginBottom: '25px',
// // //                   boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
// // //                   borderLeft: `4px solid ${viewItem.quantity <= viewItem.alert_quantity ? '#f44336' : '#4caf50'}`
// // //                 }}>
// // //                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
// // //                     <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#333' }}>Stock Status</h4>
// // //                     <span style={{
// // //                       padding: '6px 12px',
// // //                       borderRadius: '20px',
// // //                       fontSize: '12px',
// // //                       fontWeight: '600',
// // //                       background: viewItem.quantity <= viewItem.alert_quantity ? '#ffebee' : '#e8f5e9',
// // //                       color: viewItem.quantity <= viewItem.alert_quantity ? '#c62828' : '#2e7d32'
// // //                     }}>
// // //                       {viewItem.quantity <= viewItem.alert_quantity ? '⚠️ Low Stock' : '✓ In Stock'}
// // //                     </span>
// // //                   </div>
// // //                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
// // //                     <div>
// // //                       <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: '500' }}>Current Quantity</div>
// // //                       <div style={{ fontSize: '24px', fontWeight: '700', color: '#333' }}>{viewItem.quantity}</div>
// // //                     </div>
// // //                     <div>
// // //                       <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px', fontWeight: '500' }}>Alert Quantity</div>
// // //                       <div style={{ fontSize: '24px', fontWeight: '700', color: '#666' }}>{viewItem.alert_quantity}</div>
// // //                     </div>
// // //                   </div>
// // //                 </div>

// // //                 {/* Product Information Card */}
// // //                 <div style={{
// // //                   background: 'white',
// // //                   borderRadius: '12px',
// // //                   padding: '25px',
// // //                   marginBottom: '25px',
// // //                   boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
// // //                 }}>
// // //                   <h4 style={{ 
// // //                     margin: '0 0 20px 0', 
// // //                     fontSize: '18px', 
// // //                     fontWeight: '600', 
// // //                     color: '#333',
// // //                     paddingBottom: '15px',
// // //                     borderBottom: '2px solid #f0f0f0'
// // //                   }}>
// // //                     Product Information
// // //                   </h4>
// // //                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
// // //                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
// // //                       <div style={{ fontSize: '12px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Brand</div>
// // //                       <div style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>{viewItem.brand || 'N/A'}</div>
// // //                     </div>
// // //                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
// // //                       <div style={{ fontSize: '12px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unit</div>
// // //                       <div style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>{viewItem.unit || 'N/A'}</div>
// // //                     </div>
// // //                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
// // //                       <div style={{ fontSize: '12px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rack Number</div>
// // //                       <div style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>{viewItem.rack_number || 'N/A'}</div>
// // //                     </div>
// // //                     {viewItem.remarks && (
// // //                       <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
// // //                         <div style={{ fontSize: '12px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Remarks</div>
// // //                         <div style={{ 
// // //                           fontSize: '14px', 
// // //                           color: '#555', 
// // //                           padding: '12px',
// // //                           background: '#f8f9fa',
// // //                           borderRadius: '8px',
// // //                           lineHeight: '1.6'
// // //                         }}>{viewItem.remarks}</div>
// // //                       </div>
// // //                     )}
// // //                   </div>
// // //                 </div>

// // //                 {/* Pricing Information Card */}
// // //                 <div style={{
// // //                   background: 'white',
// // //                   borderRadius: '12px',
// // //                   padding: '25px',
// // //                   marginBottom: '25px',
// // //                   boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
// // //                 }}>
// // //                   <h4 style={{ 
// // //                     margin: '0 0 20px 0', 
// // //                     fontSize: '18px', 
// // //                     fontWeight: '600', 
// // //                     color: '#333',
// // //                     paddingBottom: '15px',
// // //                     borderBottom: '2px solid #f0f0f0'
// // //                   }}>
// // //                     Pricing & Tax Information
// // //                   </h4>
// // //                   <div style={{ display: 'grid', gridTemplateColumns: user?.role === 'super_admin' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '20px' }}>
// // //                     {user?.role === 'super_admin' && (
// // //                       <div style={{
// // //                         padding: '15px',
// // //                         background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
// // //                         borderRadius: '10px',
// // //                         border: '1px solid #e0e0e0'
// // //                       }}>
// // //                         <div style={{ fontSize: '12px', color: '#666', fontWeight: '500', marginBottom: '8px' }}>Purchase Rate</div>
// // //                         <div style={{ fontSize: '22px', fontWeight: '700', color: '#667eea' }}>₹{parseFloat(viewItem.purchase_rate || 0).toFixed(2)}</div>
// // //                       </div>
// // //                     )}
// // //                     <div style={{
// // //                       padding: '15px',
// // //                       background: 'linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%)',
// // //                       borderRadius: '10px',
// // //                       border: '1px solid #e0e0e0'
// // //                     }}>
// // //                       <div style={{ fontSize: '12px', color: '#666', fontWeight: '500', marginBottom: '8px' }}>Tax Rate</div>
// // //                       <div style={{ fontSize: '22px', fontWeight: '700', color: '#f5576c' }}>{viewItem.tax_rate}%</div>
// // //                     </div>
// // //                     <div style={{
// // //                       padding: '15px',
// // //                       background: 'linear-gradient(135deg, #4facfe15 0%, #00f2fe15 100%)',
// // //                       borderRadius: '10px',
// // //                       border: '1px solid #e0e0e0'
// // //                     }}>
// // //                       <div style={{ fontSize: '12px', color: '#666', fontWeight: '500', marginBottom: '8px' }}>Sale Rate</div>
// // //                       <div style={{ fontSize: '22px', fontWeight: '700', color: '#4facfe' }}>₹{parseFloat(viewItem.sale_rate || 0).toFixed(2)}</div>
// // //                     </div>
// // //                     {(viewItem.min_sale_rate != null && viewItem.min_sale_rate !== '' && Number(viewItem.min_sale_rate) >= 0) && (
// // //                       <div style={{
// // //                         padding: '15px',
// // //                         background: 'linear-gradient(135deg, #a78bfa15 0%, #c084fc15 100%)',
// // //                         borderRadius: '10px',
// // //                         border: '1px solid #e0e0e0'
// // //                       }}>
// // //                         <div style={{ fontSize: '12px', color: '#666', fontWeight: '500', marginBottom: '8px' }}>Min Sale Price</div>
// // //                         <div style={{ fontSize: '22px', fontWeight: '700', color: '#7c3aed' }}>₹{parseFloat(viewItem.min_sale_rate).toFixed(2)}</div>
// // //                       </div>
// // //                     )}
// // //                     {user?.role === 'super_admin' && viewItem.purchase_rate > 0 && (
// // //                       <div style={{
// // //                         padding: '15px',
// // //                         background: 'linear-gradient(135deg, #43e97b15 0%, #38f9d715 100%)',
// // //                         borderRadius: '10px',
// // //                         border: '1px solid #e0e0e0',
// // //                         gridColumn: '1 / -1'
// // //                       }}>
// // //                         <div style={{ fontSize: '12px', color: '#666', fontWeight: '500', marginBottom: '8px' }}>Profit Margin</div>
// // //                         <div style={{ fontSize: '22px', fontWeight: '700', color: '#43e97b' }}>
// // //                           ₹{(parseFloat(viewItem.sale_rate || 0) - parseFloat(viewItem.purchase_rate || 0)).toFixed(2)} 
// // //                           <span style={{ fontSize: '14px', marginLeft: '8px', color: '#666' }}>
// // //                             ({((parseFloat(viewItem.sale_rate || 0) - parseFloat(viewItem.purchase_rate || 0)) / parseFloat(viewItem.purchase_rate || 1) * 100).toFixed(1)}%)
// // //                           </span>
// // //                         </div>
// // //                       </div>
// // //                     )}
// // //                   </div>
// // //                 </div>

// // //                 {/* Audit Information Card */}
// // //                 {(viewItem.created_by_user || viewItem.created_at) && (
// // //                   <div style={{
// // //                     background: 'white',
// // //                     borderRadius: '12px',
// // //                     padding: '25px',
// // //                     boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
// // //                   }}>
// // //                     <h4 style={{ 
// // //                       margin: '0 0 20px 0', 
// // //                       fontSize: '18px', 
// // //                       fontWeight: '600', 
// // //                       color: '#333',
// // //                       paddingBottom: '15px',
// // //                       borderBottom: '2px solid #f0f0f0'
// // //                     }}>
// // //                       Audit Information
// // //                     </h4>
// // //                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
// // //                       {viewItem.created_by_user && (
// // //                         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
// // //                           <div style={{ fontSize: '12px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created By</div>
// // //                           <div style={{ fontSize: '15px', color: '#333', fontWeight: '500' }}>{viewItem.created_by_user}</div>
// // //                         </div>
// // //                       )}
// // //                       {viewItem.created_at_formatted && (
// // //                         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
// // //                           <div style={{ fontSize: '12px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created At</div>
// // //                           <div style={{ fontSize: '15px', color: '#333', fontWeight: '500' }}>{viewItem.created_at_formatted}</div>
// // //                         </div>
// // //                       )}
// // //                       {viewItem.updated_by_user && (
// // //                         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
// // //                           <div style={{ fontSize: '12px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Updated By</div>
// // //                           <div style={{ fontSize: '15px', color: '#333', fontWeight: '500' }}>{viewItem.updated_by_user}</div>
// // //                         </div>
// // //                       )}
// // //                       {viewItem.updated_at_formatted && (
// // //                         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
// // //                           <div style={{ fontSize: '12px', color: '#666', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Updated At</div>
// // //                           <div style={{ fontSize: '15px', color: '#333', fontWeight: '500' }}>{viewItem.updated_at_formatted}</div>
// // //                         </div>
// // //                       )}
// // //                     </div>
// // //                   </div>
// // //                 )}
// // //               </div>
// // //               <div className="modal-footer" style={{ 
// // //                 padding: '20px 30px',
// // //                 background: 'white',
// // //                 borderTop: '1px solid #f0f0f0',
// // //                 borderRadius: '0 0 12px 12px'
// // //               }}>
// // //                 <button onClick={() => {
// // //                   setShowViewModal(false);
// // //                   setViewItem(null);
// // //                 }} className="btn btn-primary" style={{
// // //                   padding: '12px 30px',
// // //                   fontSize: '15px',
// // //                   fontWeight: '600',
// // //                   borderRadius: '8px',
// // //                   background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
// // //                   border: 'none',
// // //                   color: 'white',
// // //                   cursor: 'pointer',
// // //                   transition: 'all 0.3s ease',
// // //                   boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
// // //                 }}
// // //                 onMouseEnter={(e) => {
// // //                   e.target.style.transform = 'translateY(-2px)';
// // //                   e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
// // //                 }}
// // //                 onMouseLeave={(e) => {
// // //                   e.target.style.transform = 'translateY(0)';
// // //                   e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
// // //                 }}>
// // //                   Close
// // //                 </button>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {/* Total Stock Amount Modal - super_admin only */}
// // //         {showStockAmountModal && (
// // //           <div className="modal-overlay" onClick={(e) => {
// // //             // Prevent closing on backdrop click
// // //             if (e.target === e.currentTarget) {
// // //               e.stopPropagation();
// // //             }
// // //           }}>
// // //             <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
// // //               <div className="modal-header">
// // //                 <h3>Total Stock Amount</h3>
// // //                 <button className="modal-close" onClick={() => setShowStockAmountModal(false)}>×</button>
// // //               </div>
// // //               <div className="modal-body">
// // //                 <div style={{ padding: '10px 0' }}>
// // //                   <div style={{ textAlign: 'center', marginBottom: '20px' }}>
// // //                     <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
// // //                       Total Value of All Stock Items
// // //                     </p>
// // //                     <h2 style={{
// // //                       fontSize: '38px',
// // //                       color: '#4CAF50',
// // //                       margin: '0 0 16px 0',
// // //                       fontWeight: 'bold',
// // //                       fontFamily: 'monospace',
// // //                       display: 'flex',
// // //                       alignItems: 'center',
// // //                       justifyContent: 'center',
// // //                       gap: '4px'
// // //                     }}>
// // //                       <span style={{ fontSize: '38px' }}>₹</span>
// // //                       <span>{totalStockAmount !== null && typeof totalStockAmount === 'number' ? totalStockAmount.toFixed(2) : '0.00'}</span>
// // //                     </h2>
// // //                   </div>
// // //                   {stockAmountByBrand.length > 0 && (
// // //                     <div style={{
// // //                       borderTop: '1px solid #e1e8ed',
// // //                       paddingTop: '16px',
// // //                       maxHeight: '320px',
// // //                       overflowY: 'auto'
// // //                     }}>
// // //                       <p style={{ fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '10px' }}>
// // //                         Brand-wise stock amount
// // //                       </p>
// // //                       <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
// // //                         {stockAmountByBrand.map((row, idx) => (
// // //                           <li
// // //                             key={row.brand + idx}
// // //                             style={{
// // //                               display: 'flex',
// // //                               justifyContent: 'space-between',
// // //                               alignItems: 'center',
// // //                               padding: '10px 12px',
// // //                               backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#fff',
// // //                               borderRadius: '6px',
// // //                               marginBottom: '4px',
// // //                               fontSize: '14px'
// // //                             }}
// // //                           >
// // //                             <span style={{ fontWeight: '500', color: '#1e293b' }}>{row.brand || 'Unbranded'}</span>
// // //                             <span style={{ fontWeight: '700', color: '#059669', fontFamily: 'monospace' }}>
// // //                               ₹{typeof row.total_stock_amount === 'number' ? row.total_stock_amount.toFixed(2) : (parseFloat(row.total_stock_amount) || 0).toFixed(2)}
// // //                             </span>
// // //                           </li>
// // //                         ))}
// // //                       </ul>
// // //                     </div>
// // //                   )}
// // //                   <div style={{
// // //                     backgroundColor: '#f5f5f5',
// // //                     padding: '12px',
// // //                     borderRadius: '8px',
// // //                     marginTop: '16px'
// // //                   }}>
// // //                     <p style={{ color: '#666', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
// // //                       <strong>Calculation:</strong> Sum of (Purchase Rate × Quantity) for all items in inventory
// // //                     </p>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //               <div className="modal-footer">
// // //                 <button
// // //                   onClick={() => {
// // //                     setShowStockAmountModal(false);
// // //                     fetchTotalStockAmount(); // Refresh when closing
// // //                   }}
// // //                   className="btn btn-primary"
// // //                   style={{ width: '100%' }}
// // //                 >
// // //                   Close
// // //                 </button>
// // //               </div>
// // //             </div>
// // //           </div>
// // //         )}

// // //       {/* Scroll to Top Button */}
// // //       <button
// // //         onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
// // //         style={{
// // //           position: 'fixed',
// // //           bottom: '30px',
// // //           right: '30px',
// // //           width: '50px',
// // //           height: '50px',
// // //           borderRadius: '50%',
// // //           backgroundColor: '#3498db',
// // //           color: 'white',
// // //           border: 'none',
// // //           cursor: 'pointer',
// // //           fontSize: '24px',
// // //           display: 'flex',
// // //           alignItems: 'center',
// // //           justifyContent: 'center',
// // //           boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
// // //           zIndex: 1000,
// // //           transition: 'all 0.3s ease'
// // //         }}
// // //         onMouseEnter={(e) => {
// // //           e.target.style.backgroundColor = '#2980b9';
// // //           e.target.style.transform = 'scale(1.1)';
// // //         }}
// // //         onMouseLeave={(e) => {
// // //           e.target.style.backgroundColor = '#3498db';
// // //           e.target.style.transform = 'scale(1)';
// // //         }}
// // //         title="Scroll to top"
// // //       >
// // //         ↑
// // //       </button>
// // //       </div>
// // //     </Layout>
// // //   );
// // // };

// // // export default Dashboard;






// // import React, { useState, useEffect, useMemo } from 'react';
// // import { createPortal } from 'react-dom';
// // import { useNavigate, useSearchParams } from 'react-router-dom';
// // import Layout from '../components/Layout';
// // import { DueSheetPanel } from './DueSheet';
// // import { NozzleReadingPanel } from './NozzleReading';
// // import apiClient from '../config/axios';
// // import config from '../config/config';
// // import { useAuth } from '../context/AuthContext';
// // import { useToast } from '../context/ToastContext';
// // import ActionMenu from '../components/ActionMenu';
// // import Pagination from '../components/Pagination';
// // import TransactionLoader from '../components/TransactionLoader';
// // import * as XLSX from 'xlsx';
// // import { getLocalDateString } from '../utils/dateUtils';
// // import './Dashboard.css';

// // // Minimal Icons
// // const Icon = ({ name, size = 14 }) => {
// //   const icons = {
// //     stock: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
// //     nozzle: <><path d="M4 22h16" /><path d="M18 4L8 14" /><path d="M6 12l4-4" /><circle cx="19" cy="5" r="2" /></>,
// //     due: <><path d="M3 6h18" /><path d="M8 6v4" /><path d="M16 6v4" /><rect x="3" y="10" width="18" height="12" rx="2" /><path d="M3 14h18" /></>,
// //     search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
// //     filter: <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3" />,
// //     export: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
// //     edit: <><path d="M17 3l4 4-7 7H10v-4l7-7z" /><path d="M4 20h16" /></>,
// //     view: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
// //     delete: <><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13" /><path d="M9 3h6" /></>,
// //     close: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
// //     alert: <><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></>,
// //     refresh: <><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>,
// //     user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
// //     phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />,
// //     location: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
// //     money: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
// //     chevronUp: <polyline points="18 15 12 9 6 15" />
// //   };
// //   return (
// //     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
// //       {icons[name]}
// //     </svg>
// //   );
// // };

// // const Dashboard = () => {
// //   const { user } = useAuth();
// //   const toast = useToast();
// //   const navigate = useNavigate();
// //   const [items, setItems] = useState([]);
// //   const [allItems, setAllItems] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [page, setPage] = useState(1);
// //   const [limit, setLimit] = useState(200);
// //   const [totalPages, setTotalPages] = useState(1);
// //   const [search, setSearch] = useState('');
// //   const [debouncedSearch, setDebouncedSearch] = useState('');
// //   const [searchField, setSearchField] = useState('product_name');
// //   const [sortBy, setSortBy] = useState('product_name');
// //   const [sortOrder, setSortOrder] = useState('asc');
// //   const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
// //   const [advancedSearch, setAdvancedSearch] = useState({ product_name: '', unit: '', brand: '', remarks: '' });
// //   const [editingItem, setEditingItem] = useState(null);
// //   const [editFormData, setEditFormData] = useState({});
// //   const [showEditModal, setShowEditModal] = useState(false);
// //   const [showQuickSaleModal, setShowQuickSaleModal] = useState(false);
// //   const [quickSaleItem, setQuickSaleItem] = useState(null);
// //   const [quickSaleQuantity, setQuickSaleQuantity] = useState(1);
// //   const [showViewModal, setShowViewModal] = useState(false);
// //   const [viewItem, setViewItem] = useState(null);
// //   const [totalStockAmount, setTotalStockAmount] = useState(null);
// //   const [stockAmountByBrand, setStockAmountByBrand] = useState([]);
// //   const [showStockAmountModal, setShowStockAmountModal] = useState(false);
// //   const [exporting, setExporting] = useState(false);
// //   const [quickSaleLoading, setQuickSaleLoading] = useState(false);
// //   const [updating, setUpdating] = useState(false);
// //   const [deleting, setDeleting] = useState(false);
// //   const [searching, setSearching] = useState(false);
// //   const [originalItemData, setOriginalItemData] = useState(null);
// //   const [modalLoading, setModalLoading] = useState(false);
// //   const [paginationLoading, setPaginationLoading] = useState(false);
// //   const [dueAlertParties, setDueAlertParties] = useState([]);
// //   const [showDueAlertModal, setShowDueAlertModal] = useState(false);
// //   const [dueDateEditingId, setDueDateEditingId] = useState(null);
// //   const [dueDateEditingValue, setDueDateEditingValue] = useState('');
// //   const [dueDateSaving, setDueDateSaving] = useState(false);
// //   const [searchParams] = useSearchParams();
// //   const homeTab = searchParams.get('tab') || 'items';

// //   useEffect(() => {
// //     fetchItems();
// //   }, []);

// //   useEffect(() => {
// //     const timer = setTimeout(() => setDebouncedSearch(search.trim()), 500);
// //     return () => clearTimeout(timer);
// //   }, [search]);

// //   useEffect(() => {
// //     if (allItems.length === 0) return;
// //     setPaginationLoading(true);
// //     const timer = setTimeout(() => {
// //       if (!debouncedSearch) {
// //         if (limit >= allItems.length) {
// //           setItems(allItems);
// //           setTotalPages(1);
// //         } else {
// //           setItems(allItems.slice((page - 1) * limit, page * limit));
// //           setTotalPages(Math.ceil(allItems.length / limit));
// //         }
// //       } else {
// //         const filtered = allItems.filter(item => String(item[searchField] || '').toLowerCase().includes(debouncedSearch.toLowerCase()));
// //         if (page !== 1) setPage(1);
// //         else {
// //           if (limit >= filtered.length) {
// //             setItems(filtered);
// //             setTotalPages(1);
// //           } else {
// //             setItems(filtered.slice((page - 1) * limit, page * limit));
// //             setTotalPages(Math.ceil(filtered.length / limit));
// //           }
// //         }
// //       }
// //       setPaginationLoading(false);
// //     }, 100);
// //     return () => clearTimeout(timer);
// //   }, [debouncedSearch, searchField, allItems, page, limit]);

// //   const fetchItems = async () => {
// //     try {
// //       setLoading(true);
// //       let all = [], p = 1;
// //       while (true) {
// //         const res = await apiClient.get(config.api.items, { params: { page: p, limit: 5000 } });
// //         const data = res.data.items || [];
// //         all.push(...data);
// //         if (data.length < 5000) break;
// //         p++;
// //       }
// //       setAllItems(all);
// //     } catch (err) {
// //       toast.error('Failed to load items');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const fetchTotalStockAmount = async () => {
// //     try {
// //       const res = await apiClient.get(config.api.itemsStockTotalByBrand);
// //       setTotalStockAmount(parseFloat(res.data.total_stock_amount) || 0);
// //       setStockAmountByBrand(res.data.by_brand || []);
// //     } catch (err) {
// //       console.error(err);
// //     }
// //   };

// //   useEffect(() => {
// //     if (user?.role === 'super_admin') fetchTotalStockAmount();
// //   }, [user]);

// //   useEffect(() => {
// //     const loadDueAlerts = async () => {
// //       if (user?.role !== 'super_admin') return;
// //       try {
// //         const res = await apiClient.get(config.api.dueAlerts);
// //         if (res.data.parties?.length) {
// //           setDueAlertParties(res.data.parties);
// //           setShowDueAlertModal(true);
// //         }
// //       } catch (err) {}
// //     };
// //     loadDueAlerts();
// //   }, [user]);

// //   const sortedItems = useMemo(() => {
// //     return [...items].sort((a, b) => {
// //       const aVal = a[sortBy] || '', bVal = b[sortBy] || '';
// //       return sortOrder === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
// //     });
// //   }, [items, sortBy, sortOrder]);

// //   const handleSort = (field) => {
// //     if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
// //     else { setSortBy(field); setSortOrder('asc'); }
// //   };

// //   const handleAdvancedSearch = async () => {
// //     setSearching(true);
// //     try {
// //       const res = await apiClient.post(config.api.itemsAdvancedSearch, advancedSearch);
// //       setItems(res.data.items || []);
// //       setTotalPages(1);
// //     } catch (err) {
// //       toast.error('Search failed');
// //     } finally {
// //       setSearching(false);
// //     }
// //   };

// //   const exportToExcel = () => {
// //     if (exporting || !items.length) return;
// //     setExporting(true);
// //     try {
// //       const data = sortedItems.map((item, idx) => ({
// //         'S.No': idx + 1,
// //         'Product Name': item.product_name,
// //         'Unit': item.unit || '-',
// //         'Brand': item.brand || '-',
// //         'Tax (%)': item.tax_rate || 0,
// //         'Sale Rate': parseFloat(item.sale_rate || 0).toFixed(2),
// //         'Quantity': item.quantity || 0,
// //         'Stock Value': (parseFloat(item.purchase_rate || 0) * (item.quantity || 0)).toFixed(2),
// //         'Alert Qty': item.alert_quantity || 0,
// //         'Rack No': item.rack_number || '-',
// //         'Remarks': item.remarks || '-',
// //         ...(user?.role === 'super_admin' ? { 'Purchase Rate': parseFloat(item.purchase_rate || 0).toFixed(2) } : {})
// //       }));
// //       const ws = XLSX.utils.json_to_sheet(data);
// //       const wb = XLSX.utils.book_new();
// //       XLSX.utils.book_append_sheet(wb, ws, 'Stock Items');
// //       XLSX.writeFile(wb, 'stock_items.xlsx');
// //       toast.success('Export successful');
// //     } catch (err) {
// //       toast.error('Export failed');
// //     } finally {
// //       setExporting(false);
// //     }
// //   };

// //   const handleView = async (item) => {
// //     setModalLoading(true);
// //     try {
// //       const res = await apiClient.get(`${config.api.items}/${item.id}`);
// //       setViewItem(res.data.item);
// //       setShowViewModal(true);
// //     } catch (err) {
// //       toast.error('Failed to load details');
// //     } finally {
// //       setModalLoading(false);
// //     }
// //   };

// //   const handleEdit = async (item) => {
// //     setModalLoading(true);
// //     try {
// //       const res = await apiClient.get(`${config.api.items}/${item.id}`);
// //       const fullItem = res.data.item;
// //       setEditingItem(item);
// //       const original = {
// //         product_name: fullItem.product_name,
// //         unit: fullItem.unit || '',
// //         brand: fullItem.brand || '',
// //         tax_rate: fullItem.tax_rate || 18,
// //         sale_rate: fullItem.sale_rate || 0,
// //         min_sale_rate: fullItem.min_sale_rate || null,
// //         purchase_rate: fullItem.purchase_rate || 0,
// //         quantity: fullItem.quantity || 0,
// //         alert_quantity: fullItem.alert_quantity || 0,
// //         rack_number: fullItem.rack_number || '',
// //         remarks: fullItem.remarks || ''
// //       };
// //       setOriginalItemData(original);
// //       setEditFormData({ ...original });
// //       setShowEditModal(true);
// //     } catch (err) {
// //       toast.error('Failed to load item');
// //     } finally {
// //       setModalLoading(false);
// //     }
// //   };

// //   const handleUpdate = async () => {
// //     if (!editingItem || updating) return;
// //     if (!editFormData.product_name?.trim()) {
// //       toast.error('Product name required');
// //       return;
// //     }
// //     const changed = {};
// //     Object.keys(editFormData).forEach(key => {
// //       const cur = editFormData[key];
// //       const orig = originalItemData[key];
// //       if (cur !== orig && cur !== undefined && cur !== null) changed[key] = cur;
// //     });
// //     if (Object.keys(changed).length === 0) {
// //       toast.info('No changes');
// //       return;
// //     }
// //     setUpdating(true);
// //     try {
// //       await apiClient.patch(`${config.api.items}/${editingItem.id}`, changed);
// //       toast.success('Item updated');
// //       setShowEditModal(false);
// //       fetchItems();
// //       if (user?.role === 'super_admin') fetchTotalStockAmount();
// //     } catch (err) {
// //       toast.error(err.response?.data?.error || 'Update failed');
// //     } finally {
// //       setUpdating(false);
// //     }
// //   };

// //   const handleDelete = async (id, name) => {
// //     if (!window.confirm(`Delete "${name}"?`)) return;
// //     setDeleting(true);
// //     try {
// //       await apiClient.delete(`${config.api.items}/${id}`);
// //       toast.success('Item deleted');
// //       fetchItems();
// //       if (user?.role === 'super_admin') fetchTotalStockAmount();
// //     } catch (err) {
// //       toast.error('Delete failed');
// //     } finally {
// //       setDeleting(false);
// //     }
// //   };

// //   const handleQuickSale = async () => {
// //     const qty = parseInt(quickSaleQuantity);
// //     if (!quickSaleItem || qty <= 0) {
// //       toast.error('Valid quantity required');
// //       return;
// //     }
// //     if (qty > quickSaleItem.quantity) {
// //       toast.error(`Insufficient stock. Available: ${quickSaleItem.quantity}`);
// //       return;
// //     }
// //     setQuickSaleLoading(true);
// //     try {
// //       const retail = await apiClient.get(config.api.sellersRetail);
// //       await apiClient.post(config.api.sale, {
// //         seller_party_id: retail.data.party.id,
// //         items: [{ item_id: quickSaleItem.id, quantity: qty, sale_rate: parseFloat(quickSaleItem.sale_rate) }],
// //         payment_status: 'fully_paid',
// //         paid_amount: quickSaleItem.sale_rate * qty,
// //         discount: 0,
// //         with_gst: false
// //       });
// //       toast.success('Sale completed');
// //       setShowQuickSaleModal(false);
// //       fetchItems();
// //       if (user?.role === 'super_admin') fetchTotalStockAmount();
// //     } catch (err) {
// //       toast.error('Sale failed');
// //     } finally {
// //       setQuickSaleLoading(false);
// //     }
// //   };

// //   const handleSaveDueDate = async (partyId) => {
// //     if (!dueDateEditingValue) return;
// //     setDueDateSaving(true);
// //     try {
// //       await apiClient.patch(`${config.api.sellers}/${partyId}`, { due_date: dueDateEditingValue });
// //       const today = getLocalDateString(new Date());
// //       setDueAlertParties(prev => {
// //         const updated = prev.map(p => p.id === partyId ? { ...p, due_date: dueDateEditingValue } : p);
// //         return dueDateEditingValue > today ? updated.filter(p => p.id !== partyId) : updated;
// //       });
// //       setDueDateEditingId(null);
// //       toast.success('Due date updated');
// //     } catch (err) {
// //       toast.error('Update failed');
// //     } finally {
// //       setDueDateSaving(false);
// //     }
// //   };

// //   const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
// //   const [showScrollTop, setShowScrollTop] = useState(false);

// //   useEffect(() => {
// //     const handleScroll = () => setShowScrollTop(window.scrollY > 300);
// //     window.addEventListener('scroll', handleScroll);
// //     return () => window.removeEventListener('scroll', handleScroll);
// //   }, []);

// //   return (
// //     <Layout>
// //       <TransactionLoader isLoading={loading || updating || deleting || quickSaleLoading || paginationLoading} type="transaction" />
      
// //       <div style={{ padding: '8px 12px', maxWidth: '1600px', margin: '0 auto' }}>
// //         {/* Header */}
// //         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
// //           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
// //             <Icon name="stock" size={18} />
// //             <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#fff' }}>Stock Dashboard</h1>
// //           </div>
// //           <div style={{ display: 'flex', gap: '8px' }}>
// //             <button onClick={exportToExcel} disabled={exporting || !items.length} style={{ padding: '6px 12px', background: '#1d9e75', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
// //               <Icon name="export" size={12} /> Export
// //             </button>
// //             {user?.role === 'super_admin' && (
// //               <button onClick={() => { fetchTotalStockAmount(); setShowStockAmountModal(true); }} style={{ padding: '6px 12px', background: '#3b82f6', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>
// //                 Stock Value
// //               </button>
// //             )}
// //           </div>
// //         </div>

// //         {/* Quick Stats */}
// //         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
// //           <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #f59a30' }}>
// //             <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total Items</div>
// //             <div style={{ fontSize: '18px', fontWeight: 700 }}>{allItems.length}</div>
// //           </div>
// //           <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #22c55e' }}>
// //             <div style={{ fontSize: '10px', color: '#94a3b8' }}>Low Stock Items</div>
// //             <div style={{ fontSize: '18px', fontWeight: 700, color: '#e8593c' }}>{allItems.filter(i => i.quantity <= (i.alert_quantity || 0)).length}</div>
// //           </div>
// //           <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #3b82f6' }}>
// //             <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total Stock Value</div>
// //             <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59a30' }}>₹{totalStockAmount?.toFixed(2) || '0'}</div>
// //           </div>
// //           <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #e8593c' }}>
// //             <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total Quantity</div>
// //             <div style={{ fontSize: '18px', fontWeight: 700 }}>{allItems.reduce((sum, i) => sum + (i.quantity || 0), 0)}</div>
// //           </div>
// //         </div>

// //         {/* Search & Filters */}
// //         <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', marginBottom: '12px' }}>
// //           <div style={{ display: 'flex', gap: '8px', background: '#0f151f', padding: '4px 8px', borderRadius: '6px' }}>
// //             <select value={searchField} onChange={e => setSearchField(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '11px' }}>
// //               <option value="product_name">Name</option>
// //               <option value="brand">Brand</option>
// //               <option value="remarks">Remarks</option>
// //             </select>
// //             <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', flex: 1, outline: 'none' }} />
// //           </div>
// //           <button onClick={() => setShowAdvancedSearch(!showAdvancedSearch)} style={{ padding: '4px 10px', background: '#2a3340', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
// //             <Icon name="filter" size={10} /> Advanced
// //           </button>
// //           <select value={limit >= allItems.length ? 'all' : limit} onChange={e => { setLimit(e.target.value === 'all' ? allItems.length : parseInt(e.target.value)); setPage(1); }} style={{ padding: '4px 8px', background: '#0f151f', border: '1px solid #2a3340', borderRadius: '4px', color: '#fff', fontSize: '11px' }}>
// //             <option value="200">200</option>
// //             <option value="500">500</option>
// //             <option value="2000">2000</option>
// //             <option value="all">All ({allItems.length})</option>
// //           </select>
// //         </div>

// //         {/* Advanced Search Panel */}
// //         {showAdvancedSearch && (
// //           <div style={{ background: '#0f151f', padding: '10px', borderRadius: '6px', marginBottom: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '8px' }}>
// //             <input type="text" placeholder="Product Name" value={advancedSearch.product_name} onChange={e => setAdvancedSearch({ ...advancedSearch, product_name: e.target.value })} style={inputStyle} />
// //             <input type="text" placeholder="Unit" value={advancedSearch.unit} onChange={e => setAdvancedSearch({ ...advancedSearch, unit: e.target.value })} style={inputStyle} />
// //             <input type="text" placeholder="Brand" value={advancedSearch.brand} onChange={e => setAdvancedSearch({ ...advancedSearch, brand: e.target.value })} style={inputStyle} />
// //             <input type="text" placeholder="Remarks" value={advancedSearch.remarks} onChange={e => setAdvancedSearch({ ...advancedSearch, remarks: e.target.value })} style={inputStyle} />
// //             <div style={{ display: 'flex', gap: '6px' }}>
// //               <button onClick={handleAdvancedSearch} disabled={searching} style={{ padding: '4px 12px', background: '#f59a30', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>{searching ? '...' : 'Search'}</button>
// //               <button onClick={() => { setAdvancedSearch({ product_name: '', unit: '', brand: '', remarks: '' }); setSearch(''); fetchItems(); }} style={{ padding: '4px 12px', background: '#2a3340', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Clear</button>
// //             </div>
// //           </div>
// //         )}

// //         {/* Table */}
// //         {loading ? (
// //           <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading...</div>
// //         ) : (
// //           <>
// //             <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid #2a3340' }}>
// //               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
// //                 <thead>
// //                   <tr style={{ background: '#0f151f' }}>
// //                     <th style={{ padding: '8px 6px', textAlign: 'center', width: '40px' }}>#</th>
// //                     <th onClick={() => handleSort('product_name')} style={{ padding: '8px 6px', textAlign: 'left', cursor: 'pointer' }}>Product {sortBy === 'product_name' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
// //                     <th style={{ padding: '8px 6px', textAlign: 'left' }}>Unit</th>
// //                     <th onClick={() => handleSort('brand')} style={{ padding: '8px 6px', textAlign: 'left', cursor: 'pointer' }}>Brand {sortBy === 'brand' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
// //                     <th style={{ padding: '8px 6px', textAlign: 'right' }}>Tax</th>
// //                     <th style={{ padding: '8px 6px', textAlign: 'right' }}>Sale Rate</th>
// //                     <th style={{ padding: '8px 6px', textAlign: 'right' }}>Stock</th>
// //                     <th style={{ padding: '8px 6px', textAlign: 'left' }}>Rack</th>
// //                     <th style={{ padding: '8px 6px', textAlign: 'center', width: '80px' }}>Actions</th>
// //                    </tr>
// //                 </thead>
// //                 <tbody>
// //                   {sortedItems.map((item, idx) => (
// //                     <tr key={item.id} style={{ borderBottom: '1px solid #2a3340', background: item.quantity <= (item.alert_quantity || 0) ? '#e8593c10' : 'transparent' }}>
// //                       <td style={{ padding: '6px', textAlign: 'center', color: '#6c7f8f' }}>{(page - 1) * limit + idx + 1}</td>
// //                       <td style={{ padding: '6px', fontWeight: 500 }}>{item.product_name}</td>
// //                       <td style={{ padding: '6px', color: '#9aaebf' }}>{item.unit || '-'}</td>
// //                       <td style={{ padding: '6px', color: '#9aaebf' }}>{item.brand || '-'}</td>
// //                       <td style={{ padding: '6px', textAlign: 'right' }}>{item.tax_rate}%</td>
// //                       <td style={{ padding: '6px', textAlign: 'right' }}>₹{parseFloat(item.sale_rate).toFixed(2)}</td>
// //                       <td style={{ padding: '6px', textAlign: 'right', fontWeight: 600, color: item.quantity <= (item.alert_quantity || 0) ? '#e8593c' : '#fff' }}>{item.quantity}</td>
// //                       <td style={{ padding: '6px', color: '#9aaebf' }}>{item.rack_number || '-'}</td>
// //                       <td style={{ padding: '6px', textAlign: 'center' }}>
// //                         <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
// //                           <button onClick={() => handleView(item)} style={actionBtnStyle} title="View"><Icon name="view" size={10} /></button>
// //                           {(user?.role === 'admin' || user?.role === 'super_admin') && (
// //                             <button onClick={() => handleEdit(item)} style={actionBtnStyle} title="Edit"><Icon name="edit" size={10} /></button>
// //                           )}
// //                           <button onClick={() => { setQuickSaleItem(item); setQuickSaleQuantity(1); setShowQuickSaleModal(true); }} style={actionBtnStyle} title="Quick Sale">⚡</button>
// //                           {user?.role === 'super_admin' && (
// //                             <button onClick={() => handleDelete(item.id, item.product_name)} style={{ ...actionBtnStyle, background: '#e8593c' }} title="Delete"><Icon name="delete" size={10} /></button>
// //                           )}
// //                         </div>
// //                       </td>
// //                     </tr>
// //                   ))}
// //                 </tbody>
// //               </table>
// //             </div>
// //             {totalPages > 1 && (
// //               <div style={{ marginTop: '12px' }}>
// //                 <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalRecords={allItems.length} showTotalRecords />
// //               </div>
// //             )}
// //           </>
// //         )}
// //       </div>

// //       {/* Edit Modal */}
// //       {showEditModal && editingItem && (
// //         <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setShowEditModal(false)}>
// //           <div style={{ ...modalContent, maxWidth: '520px' }}>
// //             <div style={modalHeader}>
// //               <h3 style={{ fontSize: '14px', margin: 0 }}>Edit Item</h3>
// //               <button onClick={() => setShowEditModal(false)} style={closeBtn}>×</button>
// //             </div>
// //             <div style={modalBody}>
// //               <input type="text" placeholder="Product Name *" value={editFormData.product_name} onChange={e => setEditFormData({ ...editFormData, product_name: e.target.value })} style={inputStyle} />
// //               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
// //                 <select value={editFormData.unit} onChange={e => setEditFormData({ ...editFormData, unit: e.target.value })} style={inputStyle}>
// //                   <option value="">Unit</option><option value="liter">Liter</option><option value="kg">KG</option><option value="packet">Packet</option><option value="pcs">Pcs</option>
// //                 </select>
// //                 <input type="text" placeholder="Brand" value={editFormData.brand} onChange={e => setEditFormData({ ...editFormData, brand: e.target.value })} style={inputStyle} />
// //               </div>
// //               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
// //                 <input type="number" step="0.01" placeholder="Sale Rate *" value={editFormData.sale_rate} onChange={e => setEditFormData({ ...editFormData, sale_rate: parseFloat(e.target.value) || 0 })} style={inputStyle} />
// //                 <select value={editFormData.tax_rate} onChange={e => setEditFormData({ ...editFormData, tax_rate: parseInt(e.target.value) })} style={inputStyle}>
// //                   <option value="5">5%</option><option value="18">18%</option><option value="28">28%</option>
// //                 </select>
// //               </div>
// //               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
// //                 <input type="number" placeholder="Quantity *" value={editFormData.quantity} onChange={e => setEditFormData({ ...editFormData, quantity: parseInt(e.target.value) || 0 })} style={inputStyle} />
// //                 <input type="number" placeholder="Alert Qty" value={editFormData.alert_quantity} onChange={e => setEditFormData({ ...editFormData, alert_quantity: parseInt(e.target.value) || 0 })} style={inputStyle} />
// //               </div>
// //               <input type="text" placeholder="Rack Number" value={editFormData.rack_number} onChange={e => setEditFormData({ ...editFormData, rack_number: e.target.value })} style={{ ...inputStyle, marginTop: '8px' }} />
// //               <textarea placeholder="Remarks" value={editFormData.remarks} onChange={e => setEditFormData({ ...editFormData, remarks: e.target.value })} rows="2" style={{ ...inputStyle, marginTop: '8px', resize: 'vertical' }} />
// //               {user?.role === 'super_admin' && (
// //                 <input type="number" step="0.01" placeholder="Purchase Rate" value={editFormData.purchase_rate} onChange={e => setEditFormData({ ...editFormData, purchase_rate: parseFloat(e.target.value) || 0 })} style={{ ...inputStyle, marginTop: '8px' }} />
// //               )}
// //             </div>
// //             <div style={modalFooter}>
// //               <button onClick={() => setShowEditModal(false)} style={secondaryBtn}>Cancel</button>
// //               <button onClick={handleUpdate} disabled={updating} style={primaryBtn}>{updating ? '...' : 'Update'}</button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* View Modal */}
// //       {showViewModal && viewItem && (
// //         <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setShowViewModal(false)}>
// //           <div style={{ ...modalContent, maxWidth: '560px' }}>
// //             <div style={modalHeader}>
// //               <h3 style={{ fontSize: '14px', margin: 0 }}>{viewItem.product_name}</h3>
// //               <button onClick={() => setShowViewModal(false)} style={closeBtn}>×</button>
// //             </div>
// //             <div style={modalBody}>
// //               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
// //                 <div><div style={labelStyle}>Brand</div><div style={valueStyle}>{viewItem.brand || '-'}</div></div>
// //                 <div><div style={labelStyle}>Unit</div><div style={valueStyle}>{viewItem.unit || '-'}</div></div>
// //                 <div><div style={labelStyle}>Stock</div><div style={{ ...valueStyle, fontWeight: 700, color: viewItem.quantity <= (viewItem.alert_quantity || 0) ? '#e8593c' : '#22c55e' }}>{viewItem.quantity}</div></div>
// //                 <div><div style={labelStyle}>Alert Qty</div><div style={valueStyle}>{viewItem.alert_quantity || 0}</div></div>
// //                 <div><div style={labelStyle}>Sale Rate</div><div style={valueStyle}>₹{parseFloat(viewItem.sale_rate).toFixed(2)}</div></div>
// //                 <div><div style={labelStyle}>Tax Rate</div><div style={valueStyle}>{viewItem.tax_rate}%</div></div>
// //                 {user?.role === 'super_admin' && <div><div style={labelStyle}>Purchase Rate</div><div style={valueStyle}>₹{parseFloat(viewItem.purchase_rate).toFixed(2)}</div></div>}
// //                 {viewItem.min_sale_rate && viewItem.min_sale_rate > 0 && <div><div style={labelStyle}>Min Sale Rate</div><div style={valueStyle}>₹{parseFloat(viewItem.min_sale_rate).toFixed(2)}</div></div>}
// //                 <div><div style={labelStyle}>Rack No</div><div style={valueStyle}>{viewItem.rack_number || '-'}</div></div>
// //               </div>
// //               {viewItem.remarks && <div style={{ marginTop: '12px' }}><div style={labelStyle}>Remarks</div><div style={valueStyle}>{viewItem.remarks}</div></div>}
// //             </div>
// //             <div style={modalFooter}>
// //               <button onClick={() => setShowViewModal(false)} style={primaryBtn}>Close</button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Quick Sale Modal */}
// //       {showQuickSaleModal && quickSaleItem && (
// //         <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setShowQuickSaleModal(false)}>
// //           <div style={{ ...modalContent, maxWidth: '380px' }}>
// //             <div style={modalHeader}>
// //               <h3 style={{ fontSize: '14px', margin: 0 }}>Quick Sale</h3>
// //               <button onClick={() => setShowQuickSaleModal(false)} style={closeBtn}>×</button>
// //             </div>
// //             <div style={modalBody}>
// //               <div><strong>{quickSaleItem.product_name}</strong> {quickSaleItem.brand && `(${quickSaleItem.brand})`}</div>
// //               <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Rate: ₹{quickSaleItem.sale_rate} | Stock: {quickSaleItem.quantity}</div>
// //               <input type="number" min="1" max={quickSaleItem.quantity} value={quickSaleQuantity} onChange={e => setQuickSaleQuantity(Math.min(parseInt(e.target.value) || 1, quickSaleItem.quantity))} style={{ ...inputStyle, marginTop: '12px' }} />
// //               <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600 }}>Total: ₹{(quickSaleItem.sale_rate * quickSaleQuantity).toFixed(2)}</div>
// //             </div>
// //             <div style={modalFooter}>
// //               <button onClick={() => setShowQuickSaleModal(false)} style={secondaryBtn}>Cancel</button>
// //               <button onClick={handleQuickSale} disabled={quickSaleLoading} style={primaryBtn}>{quickSaleLoading ? '...' : 'Confirm'}</button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Stock Value Modal */}
// //       {showStockAmountModal && (
// //         <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setShowStockAmountModal(false)}>
// //           <div style={{ ...modalContent, maxWidth: '420px' }}>
// //             <div style={modalHeader}>
// //               <h3 style={{ fontSize: '14px', margin: 0 }}>Total Stock Value</h3>
// //               <button onClick={() => setShowStockAmountModal(false)} style={closeBtn}>×</button>
// //             </div>
// //             <div style={modalBody}>
// //               <div style={{ textAlign: 'center', marginBottom: '16px' }}>
// //                 <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59a30' }}>₹{totalStockAmount?.toFixed(2) || '0.00'}</div>
// //                 <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total value of all inventory</div>
// //               </div>
// //               {stockAmountByBrand.length > 0 && (
// //                 <div>
// //                   <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: '#94a3b8' }}>By Brand</div>
// //                   {stockAmountByBrand.slice(0, 5).map((b, i) => (
// //                     <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #2a3340', fontSize: '11px' }}>
// //                       <span>{b.brand || 'Unbranded'}</span>
// //                       <span style={{ fontWeight: 600 }}>₹{parseFloat(b.total_stock_amount).toFixed(2)}</span>
// //                     </div>
// //                   ))}
// //                 </div>
// //               )}
// //             </div>
// //             <div style={modalFooter}>
// //               <button onClick={() => setShowStockAmountModal(false)} style={primaryBtn}>Close</button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Due Alert Modal */}
// //       {showDueAlertModal && dueAlertParties.length > 0 && (
// //         <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setShowDueAlertModal(false)}>
// //           <div style={{ ...modalContent, maxWidth: '580px' }}>
// //             <div style={{ ...modalHeader, background: '#e8593c10', borderBottomColor: '#e8593c' }}>
// //               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
// //                 <Icon name="alert" size={18} />
// //                 <h3 style={{ fontSize: '14px', margin: 0 }}>Overdue Creditors</h3>
// //               </div>
// //               <button onClick={() => setShowDueAlertModal(false)} style={closeBtn}>×</button>
// //             </div>
// //             <div style={modalBody}>
// //               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', padding: '8px', background: '#0f151f', borderRadius: '6px' }}>
// //                 <span>{dueAlertParties.length} creditor{dueAlertParties.length !== 1 ? 's' : ''}</span>
// //                 <span style={{ color: '#e8593c', fontWeight: 600 }}>₹{dueAlertParties.reduce((s, p) => s + (parseFloat(p.balance_amount) || 0), 0).toFixed(2)}</span>
// //               </div>
// //               <div style={{ overflowX: 'auto' }}>
// //                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
// //                   <thead>
// //                     <tr style={{ background: '#0f151f' }}>
// //                       <th style={{ padding: '6px' }}>Creditor</th>
// //                       <th>Due Date</th>
// //                       <th style={{ textAlign: 'right' }}>Amount</th>
// //                       <th style={{ width: '80px' }}>Action</th>
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {dueAlertParties.map((p, i) => (
// //                       <tr key={p.id} style={{ borderBottom: '1px solid #2a3340' }}>
// //                         <td style={{ padding: '6px' }}><strong>{p.party_name}</strong><br /><span style={{ fontSize: '9px', color: '#6c7f8f' }}>{p.mobile_number || ''}</span></td>
// //                         <td style={{ padding: '6px' }}>
// //                           {dueDateEditingId === p.id ? (
// //                             <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
// //                               <input type="date" value={dueDateEditingValue} onChange={e => setDueDateEditingValue(e.target.value)} style={{ ...inputStyle, width: '100px', padding: '2px 4px' }} />
// //                               <button onClick={() => handleSaveDueDate(p.id)} disabled={dueDateSaving} style={{ padding: '2px 6px', fontSize: '9px', background: '#22c55e', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Save</button>
// //                               <button onClick={() => { setDueDateEditingId(null); }} style={{ padding: '2px 6px', fontSize: '9px', background: '#2a3340', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
// //                             </div>
// //                           ) : (
// //                             <span>
// //                               {p.due_date ? new Date(p.due_date).toLocaleDateString() : '—'}
// //                               <button onClick={() => { setDueDateEditingId(p.id); setDueDateEditingValue(p.due_date || ''); }} style={{ marginLeft: '6px', fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer', color: '#f59a30' }}>✏️</button>
// //                             </span>
// //                           )}
// //                         </td>
// //                         <td style={{ padding: '6px', textAlign: 'right', fontWeight: 600, color: '#e8593c' }}>₹{parseFloat(p.balance_amount).toFixed(2)}</td>
// //                         <td style={{ padding: '6px', textAlign: 'center' }}>
// //                           <button onClick={() => navigate('/due-sheet')} style={{ padding: '2px 8px', fontSize: '9px', background: '#3b82f6', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>View</button>
// //                         </td>
// //                       </tr>
// //                     ))}
// //                   </tbody>
// //                 </table>
// //               </div>
// //             </div>
// //             <div style={modalFooter}>
// //               <button onClick={() => setShowDueAlertModal(false)} style={secondaryBtn}>Close</button>
// //               <button onClick={() => { setShowDueAlertModal(false); navigate('/due-sheet'); }} style={primaryBtn}>Open Due Sheet</button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Scroll to Top Button */}
// //       {showScrollTop && (
// //         <button onClick={scrollToTop} style={scrollBtnStyle}>
// //           <Icon name="chevronUp" size={16} />
// //         </button>
// //       )}
// //     </Layout>
// //   );
// // };

// // // Styles
// // const inputStyle = {
// //   padding: '6px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #2a3340',
// //   background: '#0f151f', color: '#fff', width: '100%', boxSizing: 'border-box'
// // };

// // const actionBtnStyle = {
// //   padding: '4px 6px', background: '#1e2a3a', border: 'none', borderRadius: '3px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
// // };

// // const modalOverlay = {
// //   position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px'
// // };

// // const modalContent = {
// //   background: '#141b26', borderRadius: '8px', width: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #2a3340'
// // };

// // const modalHeader = {
// //   display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #2a3340'
// // };

// // const modalBody = { padding: '12px', overflowY: 'auto', flex: 1, maxHeight: '70vh' };
// // const modalFooter = { padding: '10px 12px', borderTop: '1px solid #2a3340', display: 'flex', justifyContent: 'flex-end', gap: '8px' };
// // const closeBtn = { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' };
// // const primaryBtn = { padding: '5px 12px', fontSize: '11px', background: '#f59a30', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 500 };
// // const secondaryBtn = { padding: '5px 12px', fontSize: '11px', background: 'transparent', border: '1px solid #2a3340', borderRadius: '3px', cursor: 'pointer', color: '#94a3b8' };
// // const labelStyle = { fontSize: '9px', color: '#94a3b8', marginBottom: '2px' };
// // const valueStyle = { fontSize: '13px', fontWeight: 500, color: '#fff' };
// // const scrollBtnStyle = {
// //   position: 'fixed', bottom: '16px', right: '16px', width: '32px', height: '32px',
// //   borderRadius: '50%', background: '#f59a30', border: 'none', cursor: 'pointer',
// //   display: 'flex', alignItems: 'center', justifyContent: 'center',
// //   boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 999
// // };

// // export default Dashboard;





// import React, { useState, useEffect, useMemo } from 'react';
// import { createPortal } from 'react-dom';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import Layout from '../components/Layout';
// import { DueSheetPanel } from './DueSheet';
// import { NozzleReadingPanel } from './NozzleReading';
// import apiClient from '../config/axios';
// import config from '../config/config';
// import { useAuth } from '../context/AuthContext';
// import { useToast } from '../context/ToastContext';
// import ActionMenu from '../components/ActionMenu';
// import Pagination from '../components/Pagination';
// import TransactionLoader from '../components/TransactionLoader';
// import * as XLSX from 'xlsx';
// import { getLocalDateString } from '../utils/dateUtils';
// import './Dashboard.css';

// // Minimal Icons
// const Icon = ({ name, size = 14 }) => {
//   const icons = {
//     stock: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
//     export: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
//     filter: <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3" />,
//     alert: <><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></>,
//     chevronUp: <polyline points="18 15 12 9 6 15" />
//   };
//   return (
//     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
//       {icons[name]}
//     </svg>
//   );
// };

// const Dashboard = () => {
//   const { user } = useAuth();
//   const toast = useToast();
//   const navigate = useNavigate();
//   const [items, setItems] = useState([]);
//   const [allItems, setAllItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [limit, setLimit] = useState(100);
//   const [totalPages, setTotalPages] = useState(1);
//   const [search, setSearch] = useState('');
//   const [debouncedSearch, setDebouncedSearch] = useState('');
//   const [searchField, setSearchField] = useState('product_name');
//   const [sortBy, setSortBy] = useState('product_name');
//   const [sortOrder, setSortOrder] = useState('asc');
//   const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
//   const [advancedSearch, setAdvancedSearch] = useState({ product_name: '', unit: '', brand: '', remarks: '' });
//   const [editingItem, setEditingItem] = useState(null);
//   const [editFormData, setEditFormData] = useState({});
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showQuickSaleModal, setShowQuickSaleModal] = useState(false);
//   const [quickSaleItem, setQuickSaleItem] = useState(null);
//   const [quickSaleQuantity, setQuickSaleQuantity] = useState(1);
//   const [showViewModal, setShowViewModal] = useState(false);
//   const [viewItem, setViewItem] = useState(null);
//   const [totalStockAmount, setTotalStockAmount] = useState(null);
//   const [stockAmountByBrand, setStockAmountByBrand] = useState([]);
//   const [showStockAmountModal, setShowStockAmountModal] = useState(false);
//   const [exporting, setExporting] = useState(false);
//   const [quickSaleLoading, setQuickSaleLoading] = useState(false);
//   const [updating, setUpdating] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [searching, setSearching] = useState(false);
//   const [originalItemData, setOriginalItemData] = useState(null);
//   const [modalLoading, setModalLoading] = useState(false);
//   const [paginationLoading, setPaginationLoading] = useState(false);
//   const [dueAlertParties, setDueAlertParties] = useState([]);
//   const [showDueAlertModal, setShowDueAlertModal] = useState(false);
//   const [dueDateEditingId, setDueDateEditingId] = useState(null);
//   const [dueDateEditingValue, setDueDateEditingValue] = useState('');
//   const [dueDateSaving, setDueDateSaving] = useState(false);
//   const [searchParams] = useSearchParams();
//   const homeTab = searchParams.get('tab') || 'items';
//   const [showScrollTop, setShowScrollTop] = useState(false);

//   useEffect(() => {
//     const handleScroll = () => setShowScrollTop(window.scrollY > 300);
//     window.addEventListener('scroll', handleScroll);
//     fetchItems();
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   useEffect(() => {
//     const timer = setTimeout(() => setDebouncedSearch(search.trim()), 500);
//     return () => clearTimeout(timer);
//   }, [search]);

//   useEffect(() => {
//     if (allItems.length === 0) return;
//     setPaginationLoading(true);
//     const timer = setTimeout(() => {
//       if (!debouncedSearch) {
//         if (limit >= allItems.length) {
//           setItems(allItems);
//           setTotalPages(1);
//         } else {
//           setItems(allItems.slice((page - 1) * limit, page * limit));
//           setTotalPages(Math.ceil(allItems.length / limit));
//         }
//       } else {
//         const filtered = allItems.filter(item => String(item[searchField] || '').toLowerCase().includes(debouncedSearch.toLowerCase()));
//         if (page !== 1) setPage(1);
//         else {
//           if (limit >= filtered.length) {
//             setItems(filtered);
//             setTotalPages(1);
//           } else {
//             setItems(filtered.slice((page - 1) * limit, page * limit));
//             setTotalPages(Math.ceil(filtered.length / limit));
//           }
//         }
//       }
//       setPaginationLoading(false);
//     }, 100);
//     return () => clearTimeout(timer);
//   }, [debouncedSearch, searchField, allItems, page, limit]);

//   const fetchItems = async () => {
//     try {
//       setLoading(true);
//       let all = [], p = 1;
//       while (true) {
//         const res = await apiClient.get(config.api.items, { params: { page: p, limit: 5000 } });
//         const data = res.data.items || [];
//         all.push(...data);
//         if (data.length < 5000) break;
//         p++;
//       }
//       setAllItems(all);
//     } catch (err) {
//       toast.error('Failed to load items');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchTotalStockAmount = async () => {
//     try {
//       const res = await apiClient.get(config.api.itemsStockTotalByBrand);
//       setTotalStockAmount(parseFloat(res.data.total_stock_amount) || 0);
//       setStockAmountByBrand(res.data.by_brand || []);
//     } catch (err) {}
//   };

//   useEffect(() => {
//     if (user?.role === 'super_admin') fetchTotalStockAmount();
//   }, [user]);

//   useEffect(() => {
//     const loadDueAlerts = async () => {
//       if (user?.role !== 'super_admin') return;
//       try {
//         const res = await apiClient.get(config.api.dueAlerts);
//         if (res.data.parties?.length) {
//           setDueAlertParties(res.data.parties);
//           setShowDueAlertModal(true);
//         }
//       } catch (err) {}
//     };
//     loadDueAlerts();
//   }, [user]);

//   const sortedItems = useMemo(() => {
//     return [...items].sort((a, b) => {
//       const aVal = a[sortBy] || '', bVal = b[sortBy] || '';
//       return sortOrder === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
//     });
//   }, [items, sortBy, sortOrder]);

//   const handleSort = (field) => {
//     if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
//     else { setSortBy(field); setSortOrder('asc'); }
//   };

//   const handleAdvancedSearch = async () => {
//     setSearching(true);
//     try {
//       const res = await apiClient.post(config.api.itemsAdvancedSearch, advancedSearch);
//       setItems(res.data.items || []);
//       setTotalPages(1);
//     } catch (err) {
//       toast.error('Search failed');
//     } finally {
//       setSearching(false);
//     }
//   };

//   const exportToExcel = () => {
//     if (exporting || !items.length) return;
//     setExporting(true);
//     try {
//       const data = sortedItems.map((item, idx) => ({
//         'S.No': idx + 1,
//         'Product Name': item.product_name,
//         'Unit': item.unit || '-',
//         'Brand': item.brand || '-',
//         'Tax (%)': item.tax_rate || 0,
//         'Sale Rate': parseFloat(item.sale_rate || 0).toFixed(2),
//         'Quantity': item.quantity || 0,
//         'Stock Value': (parseFloat(item.purchase_rate || 0) * (item.quantity || 0)).toFixed(2),
//         'Alert Qty': item.alert_quantity || 0,
//         'Rack No': item.rack_number || '-',
//         'Remarks': item.remarks || '-',
//         ...(user?.role === 'super_admin' ? { 'Purchase Rate': parseFloat(item.purchase_rate || 0).toFixed(2) } : {})
//       }));
//       const ws = XLSX.utils.json_to_sheet(data);
//       const wb = XLSX.utils.book_new();
//       XLSX.utils.book_append_sheet(wb, ws, 'Stock Items');
//       XLSX.writeFile(wb, 'stock_items.xlsx');
//       toast.success('Export successful');
//     } catch (err) {
//       toast.error('Export failed');
//     } finally {
//       setExporting(false);
//     }
//   };

//   const handleView = async (item) => {
//     setModalLoading(true);
//     try {
//       const res = await apiClient.get(`${config.api.items}/${item.id}`);
//       setViewItem(res.data.item);
//       setShowViewModal(true);
//     } catch (err) {
//       toast.error('Failed to load details');
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const handleEdit = async (item) => {
//     setModalLoading(true);
//     try {
//       const res = await apiClient.get(`${config.api.items}/${item.id}`);
//       const fullItem = res.data.item;
//       setEditingItem(item);
//       const original = {
//         product_name: fullItem.product_name,
//         unit: fullItem.unit || '',
//         brand: fullItem.brand || '',
//         tax_rate: fullItem.tax_rate || 18,
//         sale_rate: fullItem.sale_rate || 0,
//         min_sale_rate: fullItem.min_sale_rate || null,
//         purchase_rate: fullItem.purchase_rate || 0,
//         quantity: fullItem.quantity || 0,
//         alert_quantity: fullItem.alert_quantity || 0,
//         rack_number: fullItem.rack_number || '',
//         remarks: fullItem.remarks || ''
//       };
//       setOriginalItemData(original);
//       setEditFormData({ ...original });
//       setShowEditModal(true);
//     } catch (err) {
//       toast.error('Failed to load item');
//     } finally {
//       setModalLoading(false);
//     }
//   };

//   const handleUpdate = async () => {
//     if (!editingItem || updating) return;
//     if (!editFormData.product_name?.trim()) {
//       toast.error('Product name required');
//       return;
//     }
//     const changed = {};
//     Object.keys(editFormData).forEach(key => {
//       const cur = editFormData[key];
//       const orig = originalItemData[key];
//       if (cur !== orig && cur !== undefined && cur !== null) changed[key] = cur;
//     });
//     if (Object.keys(changed).length === 0) {
//       toast.info('No changes');
//       return;
//     }
//     setUpdating(true);
//     try {
//       await apiClient.patch(`${config.api.items}/${editingItem.id}`, changed);
//       toast.success('Item updated');
//       setShowEditModal(false);
//       fetchItems();
//       if (user?.role === 'super_admin') fetchTotalStockAmount();
//     } catch (err) {
//       toast.error(err.response?.data?.error || 'Update failed');
//     } finally {
//       setUpdating(false);
//     }
//   };

//   const handleDelete = async (id, name) => {
//     if (!window.confirm(`Delete "${name}"?`)) return;
//     setDeleting(true);
//     try {
//       await apiClient.delete(`${config.api.items}/${id}`);
//       toast.success('Item deleted');
//       fetchItems();
//       if (user?.role === 'super_admin') fetchTotalStockAmount();
//     } catch (err) {
//       toast.error('Delete failed');
//     } finally {
//       setDeleting(false);
//     }
//   };

//   const handleQuickSale = async () => {
//     const qty = parseInt(quickSaleQuantity);
//     if (!quickSaleItem || qty <= 0) {
//       toast.error('Valid quantity required');
//       return;
//     }
//     if (qty > quickSaleItem.quantity) {
//       toast.error(`Insufficient stock. Available: ${quickSaleItem.quantity}`);
//       return;
//     }
//     setQuickSaleLoading(true);
//     try {
//       const retail = await apiClient.get(config.api.sellersRetail);
//       await apiClient.post(config.api.sale, {
//         seller_party_id: retail.data.party.id,
//         items: [{ item_id: quickSaleItem.id, quantity: qty, sale_rate: parseFloat(quickSaleItem.sale_rate) }],
//         payment_status: 'fully_paid',
//         paid_amount: quickSaleItem.sale_rate * qty,
//         discount: 0,
//         with_gst: false
//       });
//       toast.success('Sale completed');
//       setShowQuickSaleModal(false);
//       fetchItems();
//       if (user?.role === 'super_admin') fetchTotalStockAmount();
//     } catch (err) {
//       toast.error('Sale failed');
//     } finally {
//       setQuickSaleLoading(false);
//     }
//   };

//   const handleSaveDueDate = async (partyId) => {
//     if (!dueDateEditingValue) return;
//     setDueDateSaving(true);
//     try {
//       await apiClient.patch(`${config.api.sellers}/${partyId}`, { due_date: dueDateEditingValue });
//       const today = getLocalDateString(new Date());
//       setDueAlertParties(prev => {
//         const updated = prev.map(p => p.id === partyId ? { ...p, due_date: dueDateEditingValue } : p);
//         return dueDateEditingValue > today ? updated.filter(p => p.id !== partyId) : updated;
//       });
//       setDueDateEditingId(null);
//       toast.success('Due date updated');
//     } catch (err) {
//       toast.error('Update failed');
//     } finally {
//       setDueDateSaving(false);
//     }
//   };

//   const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

//   return (
//     <Layout>
//       <TransactionLoader isLoading={loading || updating || deleting || quickSaleLoading || paginationLoading} type="transaction" />
      
//       <div style={{ padding: '8px 12px', maxWidth: '1600px', margin: '0 auto', position: 'relative' }}>
//         {/* Header */}
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//             <Icon name="stock" size={18} />
//             <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#fff' }}>Stock Dashboard</h1>
//           </div>
//           <div style={{ display: 'flex', gap: '8px' }}>
//             <button onClick={exportToExcel} disabled={exporting || !items.length} style={{ padding: '6px 12px', background: '#1d9e75', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
//               <Icon name="export" size={12} /> Export
//             </button>
//             {user?.role === 'super_admin' && (
//               <button onClick={() => { fetchTotalStockAmount(); setShowStockAmountModal(true); }} style={{ padding: '6px 12px', background: '#3b82f6', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 500, cursor: 'pointer' }}>
//                 Stock Value
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Quick Stats */}
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
//           <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #f59a30' }}>
//             <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total Items</div>
//             <div style={{ fontSize: '18px', fontWeight: 700 }}>{allItems.length}</div>
//           </div>
//           <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #22c55e' }}>
//             <div style={{ fontSize: '10px', color: '#94a3b8' }}>Low Stock</div>
//             <div style={{ fontSize: '18px', fontWeight: 700, color: '#e8593c' }}>{allItems.filter(i => i.quantity <= (i.alert_quantity || 0)).length}</div>
//           </div>
//           <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #3b82f6' }}>
//             <div style={{ fontSize: '10px', color: '#94a3b8' }}>Stock Value</div>
//             <div style={{ fontSize: '18px', fontWeight: 700, color: '#f59a30' }}>₹{totalStockAmount?.toFixed(2) || '0'}</div>
//           </div>
//           <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #e8593c' }}>
//             <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total Qty</div>
//             <div style={{ fontSize: '18px', fontWeight: 700 }}>{allItems.reduce((sum, i) => sum + (i.quantity || 0), 0)}</div>
//           </div>
//         </div>

//         {/* Search & Filters */}
//         <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', marginBottom: '12px' }}>
//           <div style={{ display: 'flex', gap: '8px', background: '#0f151f', padding: '4px 8px', borderRadius: '6px' }}>
//             <select value={searchField} onChange={e => setSearchField(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '11px' }}>
//               <option value="product_name">Name</option>
//               <option value="brand">Brand</option>
//               <option value="remarks">Remarks</option>
//             </select>
//             <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', flex: 1, outline: 'none' }} />
//           </div>
//           <button onClick={() => setShowAdvancedSearch(!showAdvancedSearch)} style={{ padding: '4px 10px', background: '#2a3340', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
//             <Icon name="filter" size={10} /> Advanced
//           </button>
//           <select value={limit >= allItems.length ? 'all' : limit} onChange={e => { setLimit(e.target.value === 'all' ? allItems.length : parseInt(e.target.value)); setPage(1); }} style={{ padding: '4px 8px', background: '#0f151f', border: '1px solid #2a3340', borderRadius: '4px', color: '#fff', fontSize: '11px' }}>
//             <option value="15">50</option>
//             <option value="100">100</option>
//             <option value="200">200</option>
//             <option value="500">500</option>
//             <option value="all">All ({allItems.length})</option>
//           </select>
//         </div>

//         {/* Advanced Search Panel */}
//         {showAdvancedSearch && (
//           <div style={{ background: '#0f151f', padding: '10px', borderRadius: '6px', marginBottom: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '8px' }}>
//             <input type="text" placeholder="Product Name" value={advancedSearch.product_name} onChange={e => setAdvancedSearch({ ...advancedSearch, product_name: e.target.value })} style={inputStyle} />
//             <input type="text" placeholder="Unit" value={advancedSearch.unit} onChange={e => setAdvancedSearch({ ...advancedSearch, unit: e.target.value })} style={inputStyle} />
//             <input type="text" placeholder="Brand" value={advancedSearch.brand} onChange={e => setAdvancedSearch({ ...advancedSearch, brand: e.target.value })} style={inputStyle} />
//             <input type="text" placeholder="Remarks" value={advancedSearch.remarks} onChange={e => setAdvancedSearch({ ...advancedSearch, remarks: e.target.value })} style={inputStyle} />
//             <div style={{ display: 'flex', gap: '6px' }}>
//               <button onClick={handleAdvancedSearch} disabled={searching} style={{ padding: '4px 12px', background: '#f59a30', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>{searching ? '...' : 'Search'}</button>
//               <button onClick={() => { setAdvancedSearch({ product_name: '', unit: '', brand: '', remarks: '' }); setSearch(''); fetchItems(); }} style={{ padding: '4px 12px', background: '#2a3340', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Clear</button>
//             </div>
//           </div>
//         )}

//         {/* Floating Pagination Bar */}
//         {totalPages > 1 && (
//           <div style={{
//             position: 'sticky',
//             top: '60px',
//             zIndex: 100,
//             background: '#0f151f',
//             borderRadius: '8px',
//             marginBottom: '12px',
//             padding: '6px 12px',
//             border: '1px solid #2a3340',
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             flexWrap: 'wrap',
//             gap: '8px'
//           }}>
//             <div style={{ fontSize: '11px', color: '#94a3b8' }}>
//               Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, allItems.length)} of {allItems.length} items
//             </div>
//             <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
//               <button onClick={() => setPage(1)} disabled={page === 1} style={{ ...pageBtnStyle, background: '#2a3340' }}>⟪</button>
//               <button onClick={() => setPage(page - 1)} disabled={page === 1} style={{ ...pageBtnStyle, background: '#2a3340' }}>⟨</button>
//               <span style={{ padding: '4px 12px', background: '#f59a30', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{page}</span>
//               <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ {totalPages}</span>
//               <button onClick={() => setPage(page + 1)} disabled={page === totalPages} style={{ ...pageBtnStyle, background: '#2a3340' }}>⟩</button>
//               <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={{ ...pageBtnStyle, background: '#2a3340' }}>⟫</button>
//             </div>
//           </div>
//         )}

//         {/* Table */}
//         {loading ? (
//           <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading...</div>
//         ) : (
//           <div style={{ overflowX: 'auto', borderRadius: '6px', border: '1px solid #2a3340', marginBottom: '12px' }}>
//             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
//               <thead>
//                 <tr style={{ background: '#0f151f', position: 'sticky', top: 0 }}>
//                   <th style={{ padding: '8px 6px', textAlign: 'center', width: '40px' }}>#</th>
//                   <th onClick={() => handleSort('product_name')} style={{ padding: '8px 6px', textAlign: 'left', cursor: 'pointer' }}>Product {sortBy === 'product_name' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
//                   <th style={{ padding: '8px 6px', textAlign: 'left' }}>Unit</th>
//                   <th onClick={() => handleSort('brand')} style={{ padding: '8px 6px', textAlign: 'left', cursor: 'pointer' }}>Brand {sortBy === 'brand' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
//                   <th style={{ padding: '8px 6px', textAlign: 'right' }}>Tax</th>
//                   <th style={{ padding: '8px 6px', textAlign: 'right' }}>Sale Rate</th>
//                   <th style={{ padding: '8px 6px', textAlign: 'right' }}>Stock</th>
//                   <th style={{ padding: '8px 6px', textAlign: 'left' }}>Rack</th>
//                   <th style={{ padding: '8px 6px', textAlign: 'center', width: '50px' }}>⚡</th>
//                  </tr>
//               </thead>
//               <tbody>
//                 {sortedItems.map((item, idx) => (
//                   <tr key={item.id} style={{ borderBottom: '1px solid #2a3340', background: item.quantity <= (item.alert_quantity || 0) ? '#e8593c10' : 'transparent' }}>
//                     <td style={{ padding: '6px', textAlign: 'center', color: '#6c7f8f' }}>{(page - 1) * limit + idx + 1}</td>
//                     <td style={{ padding: '6px', fontWeight: 500 }}>{item.product_name}</td>
//                     <td style={{ padding: '6px', color: '#9aaebf' }}>{item.unit || '-'}</td>
//                     <td style={{ padding: '6px', color: '#9aaebf' }}>{item.brand || '-'}</td>
//                     <td style={{ padding: '6px', textAlign: 'right' }}>{item.tax_rate}%</td>
//                     <td style={{ padding: '6px', textAlign: 'right' }}>₹{parseFloat(item.sale_rate).toFixed(2)}</td>
//                     <td style={{ padding: '6px', textAlign: 'right', fontWeight: 600, color: item.quantity <= (item.alert_quantity || 0) ? '#e8593c' : '#fff' }}>{item.quantity}</td>
//                     <td style={{ padding: '6px', color: '#9aaebf' }}>{item.rack_number || '-'}</td>
//                     <td style={{ padding: '6px', textAlign: 'center' }}>
//                       <ActionMenu
//                         itemId={item.id}
//                         itemName={item.product_name}
//                         disabled={modalLoading || updating || deleting || quickSaleLoading}
//                         actions={[
//                           { label: 'View Details', icon: '👁️', onClick: () => handleView(item) },
//                           ...((user?.role === 'admin' || user?.role === 'super_admin') ? [{ label: 'Edit', icon: '✏️', onClick: () => handleEdit(item) }] : []),
//                           { label: 'Quick Sale', icon: '⚡', onClick: () => { setQuickSaleItem(item); setQuickSaleQuantity(1); setShowQuickSaleModal(true); } },
//                           ...((user?.role === 'super_admin') ? [{ label: 'Delete', icon: '🗑️', danger: true, onClick: (id, name) => handleDelete(id, name) }] : [])
//                         ]}
//                       />
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* Bottom Pagination (for reference when scrolled down) */}
//         {totalPages > 1 && (
//           <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
//             <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalRecords={allItems.length} showTotalRecords />
//           </div>
//         )}
//       </div>

//       {/* Edit Modal */}
//       {showEditModal && editingItem && (
//         <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setShowEditModal(false)}>
//           <div style={{ ...modalContent, maxWidth: '520px' }}>
//             <div style={modalHeader}>
//               <h3 style={{ fontSize: '14px', margin: 0 }}>Edit Item</h3>
//               <button onClick={() => setShowEditModal(false)} style={closeBtn}>×</button>
//             </div>
//             <div style={modalBody}>
//               <input type="text" placeholder="Product Name *" value={editFormData.product_name} onChange={e => setEditFormData({ ...editFormData, product_name: e.target.value })} style={inputStyle} />
//               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
//                 <select value={editFormData.unit} onChange={e => setEditFormData({ ...editFormData, unit: e.target.value })} style={inputStyle}>
//                   <option value="">Unit</option><option value="liter">Liter</option><option value="kg">KG</option><option value="packet">Packet</option><option value="pcs">Pcs</option>
//                 </select>
//                 <input type="text" placeholder="Brand" value={editFormData.brand} onChange={e => setEditFormData({ ...editFormData, brand: e.target.value })} style={inputStyle} />
//               </div>
//               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
//                 <input type="number" step="0.01" placeholder="Sale Rate *" value={editFormData.sale_rate} onChange={e => setEditFormData({ ...editFormData, sale_rate: parseFloat(e.target.value) || 0 })} style={inputStyle} />
//                 <select value={editFormData.tax_rate} onChange={e => setEditFormData({ ...editFormData, tax_rate: parseInt(e.target.value) })} style={inputStyle}>
//                   <option value="5">5%</option><option value="18">18%</option><option value="28">28%</option>
//                 </select>
//               </div>
//               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
//                 <input type="number" placeholder="Quantity *" value={editFormData.quantity} onChange={e => setEditFormData({ ...editFormData, quantity: parseInt(e.target.value) || 0 })} style={inputStyle} />
//                 <input type="number" placeholder="Alert Qty" value={editFormData.alert_quantity} onChange={e => setEditFormData({ ...editFormData, alert_quantity: parseInt(e.target.value) || 0 })} style={inputStyle} />
//               </div>
//               <input type="text" placeholder="Rack Number" value={editFormData.rack_number} onChange={e => setEditFormData({ ...editFormData, rack_number: e.target.value })} style={{ ...inputStyle, marginTop: '8px' }} />
//               <textarea placeholder="Remarks" value={editFormData.remarks} onChange={e => setEditFormData({ ...editFormData, remarks: e.target.value })} rows="2" style={{ ...inputStyle, marginTop: '8px', resize: 'vertical' }} />
//               {user?.role === 'super_admin' && (
//                 <input type="number" step="0.01" placeholder="Purchase Rate" value={editFormData.purchase_rate} onChange={e => setEditFormData({ ...editFormData, purchase_rate: parseFloat(e.target.value) || 0 })} style={{ ...inputStyle, marginTop: '8px' }} />
//               )}
//             </div>
//             <div style={modalFooter}>
//               <button onClick={() => setShowEditModal(false)} style={secondaryBtn}>Cancel</button>
//               <button onClick={handleUpdate} disabled={updating} style={primaryBtn}>{updating ? '...' : 'Update'}</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* View Modal */}
//       {showViewModal && viewItem && (
//         <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setShowViewModal(false)}>
//           <div style={{ ...modalContent, maxWidth: '560px' }}>
//             <div style={modalHeader}>
//               <h3 style={{ fontSize: '14px', margin: 0 }}>{viewItem.product_name}</h3>
//               <button onClick={() => setShowViewModal(false)} style={closeBtn}>×</button>
//             </div>
//             <div style={modalBody}>
//               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
//                 <div><div style={labelStyle}>Brand</div><div style={valueStyle}>{viewItem.brand || '-'}</div></div>
//                 <div><div style={labelStyle}>Unit</div><div style={valueStyle}>{viewItem.unit || '-'}</div></div>
//                 <div><div style={labelStyle}>Stock</div><div style={{ ...valueStyle, fontWeight: 700, color: viewItem.quantity <= (viewItem.alert_quantity || 0) ? '#e8593c' : '#22c55e' }}>{viewItem.quantity}</div></div>
//                 <div><div style={labelStyle}>Alert Qty</div><div style={valueStyle}>{viewItem.alert_quantity || 0}</div></div>
//                 <div><div style={labelStyle}>Sale Rate</div><div style={valueStyle}>₹{parseFloat(viewItem.sale_rate).toFixed(2)}</div></div>
//                 <div><div style={labelStyle}>Tax Rate</div><div style={valueStyle}>{viewItem.tax_rate}%</div></div>
//                 {user?.role === 'super_admin' && <div><div style={labelStyle}>Purchase Rate</div><div style={valueStyle}>₹{parseFloat(viewItem.purchase_rate).toFixed(2)}</div></div>}
//                 {viewItem.min_sale_rate && viewItem.min_sale_rate > 0 && <div><div style={labelStyle}>Min Sale Rate</div><div style={valueStyle}>₹{parseFloat(viewItem.min_sale_rate).toFixed(2)}</div></div>}
//                 <div><div style={labelStyle}>Rack No</div><div style={valueStyle}>{viewItem.rack_number || '-'}</div></div>
//               </div>
//               {viewItem.remarks && <div style={{ marginTop: '12px' }}><div style={labelStyle}>Remarks</div><div style={valueStyle}>{viewItem.remarks}</div></div>}
//             </div>
//             <div style={modalFooter}>
//               <button onClick={() => setShowViewModal(false)} style={primaryBtn}>Close</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Quick Sale Modal */}
//       {showQuickSaleModal && quickSaleItem && (
//         <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setShowQuickSaleModal(false)}>
//           <div style={{ ...modalContent, maxWidth: '380px' }}>
//             <div style={modalHeader}>
//               <h3 style={{ fontSize: '14px', margin: 0 }}>Quick Sale</h3>
//               <button onClick={() => setShowQuickSaleModal(false)} style={closeBtn}>×</button>
//             </div>
//             <div style={modalBody}>
//               <div><strong>{quickSaleItem.product_name}</strong> {quickSaleItem.brand && `(${quickSaleItem.brand})`}</div>
//               <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Rate: ₹{quickSaleItem.sale_rate} | Stock: {quickSaleItem.quantity}</div>
//               <input type="number" min="1" max={quickSaleItem.quantity} value={quickSaleQuantity} onChange={e => setQuickSaleQuantity(Math.min(parseInt(e.target.value) || 1, quickSaleItem.quantity))} style={{ ...inputStyle, marginTop: '12px' }} />
//               <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600 }}>Total: ₹{(quickSaleItem.sale_rate * quickSaleQuantity).toFixed(2)}</div>
//             </div>
//             <div style={modalFooter}>
//               <button onClick={() => setShowQuickSaleModal(false)} style={secondaryBtn}>Cancel</button>
//               <button onClick={handleQuickSale} disabled={quickSaleLoading} style={primaryBtn}>{quickSaleLoading ? '...' : 'Confirm'}</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Stock Value Modal */}
//       {showStockAmountModal && (
//         <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setShowStockAmountModal(false)}>
//           <div style={{ ...modalContent, maxWidth: '420px' }}>
//             <div style={modalHeader}>
//               <h3 style={{ fontSize: '14px', margin: 0 }}>Total Stock Value</h3>
//               <button onClick={() => setShowStockAmountModal(false)} style={closeBtn}>×</button>
//             </div>
//             <div style={modalBody}>
//               <div style={{ textAlign: 'center', marginBottom: '16px' }}>
//                 <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59a30' }}>₹{totalStockAmount?.toFixed(2) || '0.00'}</div>
//                 <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total value of all inventory</div>
//               </div>
//               {stockAmountByBrand.length > 0 && (
//                 <div>
//                   <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '8px', color: '#94a3b8' }}>By Brand</div>
//                   {stockAmountByBrand.slice(0, 5).map((b, i) => (
//                     <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #2a3340', fontSize: '11px' }}>
//                       <span>{b.brand || 'Unbranded'}</span>
//                       <span style={{ fontWeight: 600 }}>₹{parseFloat(b.total_stock_amount).toFixed(2)}</span>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//             <div style={modalFooter}>
//               <button onClick={() => setShowStockAmountModal(false)} style={primaryBtn}>Close</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Due Alert Modal */}
//       {showDueAlertModal && dueAlertParties.length > 0 && (
//         <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setShowDueAlertModal(false)}>
//           <div style={{ ...modalContent, maxWidth: '580px' }}>
//             <div style={{ ...modalHeader, background: '#e8593c10', borderBottomColor: '#e8593c' }}>
//               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                 <Icon name="alert" size={18} />
//                 <h3 style={{ fontSize: '14px', margin: 0 }}>Overdue Creditors</h3>
//               </div>
//               <button onClick={() => setShowDueAlertModal(false)} style={closeBtn}>×</button>
//             </div>
//             <div style={modalBody}>
//               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', padding: '8px', background: '#0f151f', borderRadius: '6px' }}>
//                 <span>{dueAlertParties.length} creditor{dueAlertParties.length !== 1 ? 's' : ''}</span>
//                 <span style={{ color: '#e8593c', fontWeight: 600 }}>₹{dueAlertParties.reduce((s, p) => s + (parseFloat(p.balance_amount) || 0), 0).toFixed(2)}</span>
//               </div>
//               <div style={{ overflowX: 'auto' }}>
//                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
//                   <thead>
//                     <tr style={{ background: '#0f151f' }}>
//                       <th style={{ padding: '6px' }}>Creditor</th>
//                       <th>Due Date</th>
//                       <th style={{ textAlign: 'right' }}>Amount</th>
//                       <th style={{ width: '80px' }}>Action</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {dueAlertParties.map((p) => (
//                       <tr key={p.id} style={{ borderBottom: '1px solid #2a3340' }}>
//                         <td style={{ padding: '6px' }}><strong>{p.party_name}</strong><br /><span style={{ fontSize: '9px', color: '#6c7f8f' }}>{p.mobile_number || ''}</span></td>
//                         <td style={{ padding: '6px' }}>
//                           {dueDateEditingId === p.id ? (
//                             <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
//                               <input type="date" value={dueDateEditingValue} onChange={e => setDueDateEditingValue(e.target.value)} style={{ ...inputStyle, width: '100px', padding: '2px 4px' }} />
//                               <button onClick={() => handleSaveDueDate(p.id)} disabled={dueDateSaving} style={{ padding: '2px 6px', fontSize: '9px', background: '#22c55e', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Save</button>
//                               <button onClick={() => { setDueDateEditingId(null); }} style={{ padding: '2px 6px', fontSize: '9px', background: '#2a3340', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
//                             </div>
//                           ) : (
//                             <span>
//                               {p.due_date ? new Date(p.due_date).toLocaleDateString() : '—'}
//                               <button onClick={() => { setDueDateEditingId(p.id); setDueDateEditingValue(p.due_date || ''); }} style={{ marginLeft: '6px', fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer', color: '#f59a30' }}>✏️</button>
//                             </span>
//                           )}
//                         </td>
//                         <td style={{ padding: '6px', textAlign: 'right', fontWeight: 600, color: '#e8593c' }}>₹{parseFloat(p.balance_amount).toFixed(2)}</td>
//                         <td style={{ padding: '6px', textAlign: 'center' }}>
//                           <button onClick={() => navigate('/due-sheet')} style={{ padding: '2px 8px', fontSize: '9px', background: '#3b82f6', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>View</button>
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//             <div style={modalFooter}>
//               <button onClick={() => setShowDueAlertModal(false)} style={secondaryBtn}>Close</button>
//               <button onClick={() => { setShowDueAlertModal(false); navigate('/due-sheet'); }} style={primaryBtn}>Open Due Sheet</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Scroll to Top Button */}
//       {showScrollTop && (
//         <button onClick={scrollToTop} style={scrollBtnStyle}>
//           <Icon name="chevronUp" size={16} />
//         </button>
//       )}
//     </Layout>
//   );
// };

// // Styles
// const inputStyle = {
//   padding: '6px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #2a3340',
//   background: '#0f151f', color: '#fff', width: '100%', boxSizing: 'border-box'
// };

// const pageBtnStyle = {
//   padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: 'none', cursor: 'pointer', color: '#fff'
// };

// const modalOverlay = {
//   position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px'
// };

// const modalContent = {
//   background: '#141b26', borderRadius: '8px', width: '100%', display: 'flex', flexDirection: 'column', border: '1px solid #2a3340'
// };

// const modalHeader = {
//   display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #2a3340'
// };

// const modalBody = { padding: '12px', overflowY: 'auto', flex: 1, maxHeight: '70vh' };
// const modalFooter = { padding: '10px 12px', borderTop: '1px solid #2a3340', display: 'flex', justifyContent: 'flex-end', gap: '8px' };
// const closeBtn = { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' };
// const primaryBtn = { padding: '5px 12px', fontSize: '11px', background: '#f59a30', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 500 };
// const secondaryBtn = { padding: '5px 12px', fontSize: '11px', background: 'transparent', border: '1px solid #2a3340', borderRadius: '3px', cursor: 'pointer', color: '#94a3b8' };
// const labelStyle = { fontSize: '9px', color: '#94a3b8', marginBottom: '2px' };
// const valueStyle = { fontSize: '13px', fontWeight: 500, color: '#fff' };
// const scrollBtnStyle = {
//   position: 'fixed', bottom: '16px', right: '16px', width: '32px', height: '32px',
//   borderRadius: '50%', background: '#f59a30', border: 'none', cursor: 'pointer',
//   display: 'flex', alignItems: 'center', justifyContent: 'center',
//   boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 999
// };

// export default Dashboard;











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
import { getLocalDateString } from '../utils/dateUtils';
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
      toast.error('Failed to load items');
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
    const qty = parseInt(quickSaleQuantity);
    if (!quickSaleItem || qty <= 0) {
      toast.error('Valid quantity required');
      return;
    }
    if (qty > quickSaleItem.quantity) {
      toast.error(`Insufficient stock. Available: ${quickSaleItem.quantity}`);
      return;
    }
    setQuickSaleLoading(true);
    try {
      const retail = await apiClient.get(config.api.sellersRetail);
      await apiClient.post(config.api.sale, {
        seller_party_id: retail.data.party.id,
        items: [{ item_id: quickSaleItem.id, quantity: qty, sale_rate: parseFloat(quickSaleItem.sale_rate) }],
        payment_status: 'fully_paid',
        paid_amount: quickSaleItem.sale_rate * qty,
        discount: 0,
        with_gst: false
      });
      toast.success('Sale completed');
      setShowQuickSaleModal(false);
      fetchItems();
      if (user?.role === 'super_admin') fetchTotalStockAmount();
    } catch (err) {
      toast.error('Sale failed');
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
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#fff' }}>Stock Dashboard</h1>
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
          title="Toggle low stock filter"
        >
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Low Stock</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#e8593c' }}>{allItems.filter(i => i.quantity <= (i.alert_quantity || 0)).length}</div>
        </button>
        <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #22c55e' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Stock Value</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#22c55e' }}>₹{totalStockAmount?.toFixed(2) || '0'}</div>
        </div>
        <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #3b82f6' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total Qty</div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{allItems.reduce((sum, i) => sum + (i.quantity || 0), 0)}</div>
        </div>
        {user?.role === 'super_admin' && (
          <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', borderLeft: '2px solid #a855f7' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total Due Amount</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#c084fc' }}>₹{totalDueAmount.toFixed(2)}</div>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', background: '#0f151f', padding: '4px 8px', borderRadius: '6px' }}>
          <select value={searchField} onChange={e => setSearchField(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '11px' }}>
            <option value="product_name">Name</option>
            <option value="brand">Brand</option>
            <option value="remarks">Remarks</option>
          </select>
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', flex: 1, outline: 'none' }} />
        </div>
        <button onClick={() => setShowAdvancedSearch(!showAdvancedSearch)} style={{ padding: '4px 10px', background: showAdvancedSearch ? '#f59a30' : '#2a3340', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: showAdvancedSearch ? '#1a1200' : '#9aaebf', fontWeight: showAdvancedSearch ? 700 : 400 }}>
          <Icon name="filter" size={10} /> Advanced
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
        <div style={{ background: '#1a2330', border: '1px solid #2a3340', padding: '12px', borderRadius: '8px', marginBottom: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '8px' }}>
          <input type="text" placeholder="Product Name" value={advancedSearch.product_name} onChange={e => setAdvancedSearch({ ...advancedSearch, product_name: e.target.value })} style={{ ...inputStyle, color: '#eef2f8', background: '#0f151f', border: '1px solid #2a3340' }} />
          <input type="text" placeholder="Unit" value={advancedSearch.unit} onChange={e => setAdvancedSearch({ ...advancedSearch, unit: e.target.value })} style={{ ...inputStyle, color: '#eef2f8', background: '#0f151f', border: '1px solid #2a3340' }} />
          <input type="text" placeholder="Brand" value={advancedSearch.brand} onChange={e => setAdvancedSearch({ ...advancedSearch, brand: e.target.value })} style={{ ...inputStyle, color: '#eef2f8', background: '#0f151f', border: '1px solid #2a3340' }} />
          <input type="text" placeholder="Remarks" value={advancedSearch.remarks} onChange={e => setAdvancedSearch({ ...advancedSearch, remarks: e.target.value })} style={{ ...inputStyle, color: '#eef2f8', background: '#0f151f', border: '1px solid #2a3340' }} />
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
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
                <th style={{ padding: '8px 6px', textAlign: 'center', width: '40px' }}>#</th>
                <th onClick={() => handleSort('product_name')} style={{ padding: '8px 6px', textAlign: 'left', cursor: 'pointer' }}>Product {sortBy === 'product_name' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th style={{ padding: '8px 6px', textAlign: 'left' }}>Unit</th>
                <th onClick={() => handleSort('brand')} style={{ padding: '8px 6px', textAlign: 'left', cursor: 'pointer' }}>Brand {sortBy === 'brand' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>Tax</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>Sale Rate</th>
                <th style={{ padding: '8px 6px', textAlign: 'right' }}>Stock</th>
                <th style={{ padding: '8px 6px', textAlign: 'left' }}>Rack</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', width: '50px' }}>⚡</th>
               </tr>
              </thead>
              <tbody>
                {sortedItems.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #2a3340', background: item.quantity <= (item.alert_quantity || 0) ? '#e8593c10' : 'transparent' }}>
                    <td style={{ padding: '6px', textAlign: 'center', color: '#6c7f8f' }}>{(page - 1) * limit + idx + 1} </td>
                    <td style={{ padding: '6px', fontWeight: 500 }}>{item.product_name}</td>
                    <td style={{ padding: '6px', color: '#9aaebf' }}>{item.unit || '-'}</td>
                    <td style={{ padding: '6px', color: '#9aaebf' }}>{item.brand || '-'}</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>{item.tax_rate}%</td>
                    <td style={{ padding: '6px', textAlign: 'right' }}>₹{parseFloat(item.sale_rate).toFixed(2)}</td>
                    <td style={{ padding: '6px', textAlign: 'right', fontWeight: 600, color: item.quantity <= (item.alert_quantity || 0) ? '#e8593c' : '#fff' }}>{item.quantity}</td>
                    <td style={{ padding: '6px', color: '#9aaebf' }}>{item.rack_number || '-'}</td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      <ActionMenu
                        itemId={item.id}
                        itemName={item.product_name}
                        disabled={modalLoading || updating || deleting || quickSaleLoading}
                        actions={[
                          { label: 'View Details', icon: '👁️', onClick: () => handleView(item) },
                          ...((user?.role === 'admin' || user?.role === 'super_admin') ? [{ label: 'Edit', icon: '✏️', onClick: () => handleEdit(item) }] : []),
                          { label: 'Quick Sale', icon: '⚡', onClick: () => { setQuickSaleItem(item); setQuickSaleQuantity(1); setShowQuickSaleModal(true); } },
                          ...((user?.role === 'super_admin') ? [{ label: 'Delete', icon: '🗑️', danger: true, onClick: (id, name) => handleDelete(id, name) }] : [])
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
      <TransactionLoader isLoading={loading || updating || deleting || quickSaleLoading || paginationLoading} type="transaction" />
      
      <div style={{ padding: '8px 12px', maxWidth: '1600px', margin: '0 auto', position: 'relative' }}>


        {/* Tab Content */}
        {renderContent()}
      </div>

      {/* Modals - All remain the same */}
      {showEditModal && editingItem && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, maxWidth: '520px' }}>
            <div style={modalHeader}>
              <div>
                <div style={{ fontSize: '11px', color: '#9aaebf', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Edit Item</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#eef2f8' }}>{editingItem.product_name}</div>
              </div>
              <button onClick={() => setShowEditModal(false)} style={closeBtn}>×</button>
            </div>
            <div style={modalBody}>
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
          <div style={{ ...modalContent, maxWidth: '560px' }}>
            <div style={{ ...modalHeader, paddingBottom: '12px', flexDirection: 'column', alignItems: 'flex-start', gap: '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#9aaebf', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Item Details</div>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: '#eef2f8', lineHeight: 1.2 }}>{viewItem.product_name}</div>
                  {viewItem.brand && <div style={{ fontSize: '12px', color: '#f59a30', marginTop: '3px', fontWeight: 600 }}>🏷️ {viewItem.brand}</div>}
                </div>
                <button onClick={() => setShowViewModal(false)} style={closeBtn}>×</button>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                {viewItem.unit && <span style={{ background: '#2a3340', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#9aaebf' }}>📦 {viewItem.unit}</span>}
                <span style={{ background: viewItem.quantity <= (viewItem.alert_quantity || 0) ? 'rgba(232,89,60,0.2)' : 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: viewItem.quantity <= (viewItem.alert_quantity || 0) ? '#e8593c' : '#22c55e', fontWeight: 700 }}>Stock: {viewItem.quantity}</span>
                {viewItem.rack_number && <span style={{ background: '#2a3340', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: '#9aaebf' }}>Rack: {viewItem.rack_number}</span>}
              </div>
            </div>
            <div style={modalBody}>
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
          <div style={{ ...modalContent, maxWidth: '380px' }}>
            <div style={modalHeader}>
              <h3 style={{ fontSize: '14px', margin: 0 }}>Quick Sale</h3>
              <button onClick={() => setShowQuickSaleModal(false)} style={closeBtn}>×</button>
            </div>
            <div style={modalBody}>
              <div><strong>{quickSaleItem.product_name}</strong> {quickSaleItem.brand && `(${quickSaleItem.brand})`}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Rate: ₹{quickSaleItem.sale_rate} | Stock: {quickSaleItem.quantity}</div>
              <input type="number" min="1" max={quickSaleItem.quantity} value={quickSaleQuantity} onChange={e => setQuickSaleQuantity(Math.min(parseInt(e.target.value) || 1, quickSaleItem.quantity))} style={{ ...inputStyle, marginTop: '12px' }} />
              <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 600 }}>Total: ₹{(quickSaleItem.sale_rate * quickSaleQuantity).toFixed(2)}</div>
            </div>
            <div style={modalFooter}>
              <button onClick={() => setShowQuickSaleModal(false)} style={secondaryBtn}>Cancel</button>
              <button onClick={handleQuickSale} disabled={quickSaleLoading} style={primaryBtn}>{quickSaleLoading ? '...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {showStockAmountModal && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, maxWidth: '420px' }}>
            <div style={modalHeader}>
              <h3 style={{ fontSize: '14px', margin: 0 }}>Total Stock Value</h3>
              <button onClick={() => setShowStockAmountModal(false)} style={closeBtn}>×</button>
            </div>
            <div style={modalBody}>
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
          <div style={{ ...modalContent, maxWidth: '580px' }}>
            <div style={{ ...modalHeader, background: '#e8593c10', borderBottomColor: '#e8593c' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="alert" size={18} />
                <h3 style={{ fontSize: '14px', margin: 0 }}>Overdue Creditors</h3>
              </div>
              <button onClick={() => setShowDueAlertModal(false)} style={closeBtn}>×</button>
            </div>
            <div style={modalBody}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', padding: '8px', background: '#0f151f', borderRadius: '6px' }}>
                <span>{dueAlertParties.length} creditor{dueAlertParties.length !== 1 ? 's' : ''}</span>
                <span style={{ color: '#e8593c', fontWeight: 600 }}>₹{dueAlertParties.reduce((s, p) => s + (parseFloat(p.balance_amount) || 0), 0).toFixed(2)}</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#0f151f' }}>
                      <th style={{ padding: '6px' }}>Creditor</th>
                      <th>Due Date</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ width: '80px' }}>Action</th>
                     </tr>
                  </thead>
                  <tbody>
                    {dueAlertParties.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #2a3340' }}>
                        <td style={{ padding: '6px' }}><strong>{p.party_name}</strong><br /><span style={{ fontSize: '9px', color: '#6c7f8f' }}>{p.mobile_number || ''}</span> </td>
                        <td style={{ padding: '6px' }}>
                          {dueDateEditingId === p.id ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <input type="date" value={dueDateEditingValue} onChange={e => setDueDateEditingValue(e.target.value)} style={{ ...inputStyle, width: '100px', padding: '2px 4px' }} />
                              <button onClick={() => handleSaveDueDate(p.id)} disabled={dueDateSaving} style={{ padding: '2px 6px', fontSize: '9px', background: '#22c55e', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Save</button>
                              <button onClick={() => { setDueDateEditingId(null); }} style={{ padding: '2px 6px', fontSize: '9px', background: '#2a3340', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
                            </div>
                          ) : (
                            <span>
                              {p.due_date ? new Date(p.due_date).toLocaleDateString() : '—'}
                              <button onClick={() => { setDueDateEditingId(p.id); setDueDateEditingValue(p.due_date || ''); }} style={{ marginLeft: '6px', fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer', color: '#f59a30' }}>✏️</button>
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '6px', textAlign: 'right', fontWeight: 600, color: '#e8593c' }}>₹{parseFloat(p.balance_amount).toFixed(2)}</td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>
                          <button onClick={() => navigate('/due-sheet')} style={{ padding: '2px 8px', fontSize: '9px', background: '#3b82f6', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={modalFooter}>
              <button onClick={() => setShowDueAlertModal(false)} style={secondaryBtn}>Close</button>
              <button onClick={() => { setShowDueAlertModal(false); navigate('/due-sheet'); }} style={primaryBtn}>Open Due Sheet</button>
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

const modalBody = { padding: '12px', overflowY: 'auto', flex: 1, maxHeight: '70vh' };
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