import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import { useToast } from '../context/ToastContext';
import TransactionLoader from '../components/TransactionLoader';
import ActionMenu from '../components/ActionMenu';
import { numberToWords } from '../utils/numberToWords';
import { getLocalDateString } from '../utils/dateUtils';
import {
  fetchSellerParties,
  fetchSellerInfo,
  searchItems,
  calculatePreview,
  submitSale,
  setSelectedSeller,
  setSellerSearchQuery,
  setShowSellerSuggestions,
  selectSellerParty,
  setSearchQuery,
  clearSuggestedItems,
  addItemToCart,
  updateItemQuantity,
  removeItem,
  setPaymentStatus,
  setPaidAmount,
  setWithGst,
  setPreviousBalancePaid,
  setPayPreviousBalance,
  setPrintDisabled,
  setPrintClicked,
  resetAfterSale,
  clearPreview,
  updatePreviewItemQuantity,
  removePreviewItem,
  updateItemDiscount,
  updatePreviewItemDiscount,
  updatePreviewItemSaleRate,
  setSelectedAttendant,
  setSelectedNozzle,
  updateItemSaleRate,
  resetSellItem
} from '../store/slices/sellItemSlice';
import { store } from '../store/store';
import './SellItem.css';

const SellItem = () => {
  const toast = useToast();
  const dispatch = useDispatch();
  const itemSearchInputRef = useRef(null);
  const sellerSearchInputRef = useRef(null);
  const paidAmountDebounceRef = useRef(null);
  const handlePreviewRef = useRef(null);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [printingPDF, setPrintingPDF] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  /** Local value for Amount Paid input so typing is not overwritten by Redux; sync to Redux after 1s of no typing */
  const [amountPaidLocalValue, setAmountPaidLocalValue] = useState('');
  const [attendants, setAttendants] = useState([]);
  const [nozzles, setNozzles] = useState([]);
  const [dueDateForPartial, setDueDateForPartial] = useState('');

  // Redux state
  const {
    sellerParties,
    selectedSeller,
    sellerInfo,
    sellerSearchQuery,
    filteredSellerParties,
    showSellerSuggestions,
    searchQuery,
    suggestedItems,
    selectedItems,
    previewData,
    previewLoading,
    previewDirty,
    paymentStatus,
    paidAmount,
    withGst,
    printDisabled,
    printClicked,
    selectedAttendantId,
    selectedNozzleId,
    loading,
    errors
  } = useSelector((state) => state.sellItem);

  useEffect(() => {
    dispatch(fetchSellerParties()).catch((error) => {
      console.error('Error fetching seller parties:', error);
      toast.error('Failed to load seller parties');
    });
  }, [dispatch, toast]);

  useEffect(() => {
    const fetchAttendants = async () => {
      try {
        const res = await apiClient.get(config.api.attendants);
        setAttendants(res.data.attendants || []);
      } catch (e) {
        console.error('Error fetching attendants:', e);
      }
    };
    fetchAttendants();
  }, []);

  useEffect(() => {
    const fetchNozzles = async () => {
      try {
        const res = await apiClient.get(config.api.nozzles);
        setNozzles(res.data.nozzles || []);
      } catch (e) {
        console.error('Error fetching nozzles:', e);
      }
    };
    fetchNozzles();
  }, []);

  useEffect(() => {
    if (sellerInfo && sellerInfo.due_date) {
      setDueDateForPartial(sellerInfo.due_date);
    } else if (sellerInfo && !sellerInfo.due_date) {
      setDueDateForPartial('');
    }
  }, [sellerInfo?.id, sellerInfo?.due_date]);

  useEffect(() => {
    // Only fetch if seller is selected AND we don't already have the info for this seller
    if (selectedSeller && (!sellerInfo || sellerInfo.id !== selectedSeller)) {
      dispatch(fetchSellerInfo(selectedSeller)).catch((error) => {
        console.error('Error fetching seller info:', error);
        toast.error('Failed to load seller information');
      });
    }
  }, [selectedSeller, sellerInfo, dispatch, toast]);

  // Debounce search query - only search after 1 second of no typing
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedQuery = searchQuery.trim();
      setDebouncedSearchQuery(trimmedQuery);
    }, 300); // 300ms delay for better responsiveness

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const trimmedQuery = debouncedSearchQuery.trim();
    if (trimmedQuery.length >= 2) {
      dispatch(searchItems({ query: trimmedQuery, includePurchaseRate: false })); // Selling doesn't need purchase_rate
    } else {
      dispatch(clearSuggestedItems());
    }
  }, [debouncedSearchQuery, dispatch]);

  // Sync local Amount Paid display from Redux when in partially_paid (e.g. after debounced sync or when switching to partially_paid)
  useEffect(() => {
    if (paymentStatus === 'partially_paid') {
      setAmountPaidLocalValue(paidAmount === 0 || paidAmount === null || paidAmount === undefined ? '' : String(paidAmount));
    } else {
      setAmountPaidLocalValue('');
    }
  }, [paymentStatus, paidAmount]);

  // Clear Amount Paid debounce timer on unmount
  useEffect(() => {
    return () => {
      if (paidAmountDebounceRef.current) {
        clearTimeout(paidAmountDebounceRef.current);
        paidAmountDebounceRef.current = null;
      }
    };
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSellerSuggestions && !event.target.closest('.search-wrapper')) {
        dispatch(setShowSellerSuggestions(false));
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (showSellerSuggestions) {
          dispatch(setShowSellerSuggestions(false));
        }
        if (suggestedItems.length > 0) {
          dispatch(clearSuggestedItems());
          dispatch(setSearchQuery(''));
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showSellerSuggestions, suggestedItems.length, dispatch]);

  const handleAddItemToCart = async (item) => {
    try {
      // Check if item is out of stock
      if ((item.quantity || 0) <= 0) {
        toast.warning(`⚠️ "${item.product_name || item.item_name}" is out of stock and cannot be added`);
        return;
      }
      
      // Let Redux handle adding/incrementing
      dispatch(addItemToCart(item));
      
      // Don't clear search or close modal - allow adding multiple items
      // Keep UX smooth: no toast spam on every item add
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Error adding item');
    }
  };





  const handleUpdateQuantity = (itemId, quantity) => {
    if (quantity === '' || quantity === null || quantity === undefined) {
      dispatch(updateItemQuantity({ itemId, quantity: '' }));
      return;
    }
    const qty = parseInt(quantity) || 0;
    dispatch(updateItemQuantity({ itemId, quantity: qty <= 0 ? '' : qty }));
  };

  const handleUpdateDiscount = (itemId, discountValue) => {
    const rawValue = discountValue === '' ? null : parseFloat(discountValue);
    const discountAmount = (rawValue === null || isNaN(rawValue)) ? 0 : Math.max(0, rawValue);
    if (previewData) {
      dispatch(updatePreviewItemDiscount({ itemId, discount: discountAmount, discountType: 'amount', discountPercentage: null }));
    } else {
      dispatch(updateItemDiscount({ itemId, discount: discountAmount, discountType: 'amount', discountPercentage: null }));
    }
  };

  const updateQuantityInPreview = (itemId, quantity) => {
    dispatch(updatePreviewItemQuantity({ itemId, quantity }));
  };

  const handleRemoveItem = (itemId) => {
    dispatch(removeItem(itemId));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      const saleRate = parseFloat(item.sale_rate || 0);
      const quantity = parseInt(item.quantity || 0);
      const itemTotal = saleRate * quantity;
      const discountAmount = parseFloat(item.discount || 0);
      return total + Math.max(0, itemTotal - discountAmount);
    }, 0);
  };

  /**
   * Check if preview is stale / needs to be (re)generated.
   * Uses a simple flag from Redux that is set whenever inputs change
   * and cleared whenever calculatePreview completes successfully.
   */
  const isPreviewStale = () => {
    if (!previewData) return true;       // No preview exists
    if (previewLoading) return true;     // Currently recalculating
    return !!previewDirty;               // Inputs changed since last preview
  };

  /**
   * Recalculate preview bill.
   * IMPORTANT: Many UI handlers dispatch Redux updates and then immediately call this.
   * Redux state updates are async, so we accept override values to avoid using stale state.
   */
  const handlePreview = async (overrideWithGst = null, overrides = {}, options = {}) => {
    const { silent = false } = options; // silent: skip success toast (e.g. for automatic preview update)
    // Validation checks
    if (!selectedSeller) {
      toast.warning('⚠️ Please select a seller party first');
      return;
    }
    
    if (selectedItems.length === 0) {
      toast.warning('⚠️ Please add at least one item to the cart');
      return;
    }

    // Validate all items have valid quantities
    const invalidItems = [];
    let hasStockIssue = false;
    
    for (const item of selectedItems) {
      const quantity = parseInt(item.quantity) || 0;
      const availableQty = item.available_quantity || 0;
      
      if (quantity <= 0) {
        invalidItems.push(item.product_name);
      } else if (quantity > availableQty) {
        hasStockIssue = true;
        toast.error(`❌ Insufficient stock for "${item.product_name}". Available: ${availableQty}, Requested: ${quantity}`);
      }
    }
    
    if (invalidItems.length > 0) {
      toast.error(`❌ Invalid quantity for: ${invalidItems.join(', ')}. Quantity must be greater than 0`);
      return;
    }
    
    if (hasStockIssue) {
      return;
    }

    // Ensure sellerInfo is available before calculating preview
    let currentSellerInfo = sellerInfo;
    if (!currentSellerInfo || currentSellerInfo.id !== selectedSeller) {
      try {
        const sellerInfoResult = await dispatch(fetchSellerInfo(selectedSeller)).unwrap();
        currentSellerInfo = sellerInfoResult;
      } catch (error) {
        console.error('Error fetching seller info:', error);
        toast.error('❌ Failed to load seller information. Please try again.');
        return;
      }
    }

    if (!currentSellerInfo) {
      toast.error('❌ Seller information is not available. Please select a seller party again.');
      return;
    }

    const currentWithGst = overrideWithGst !== null ? overrideWithGst : withGst;
    
    // Automatically include previous balance if seller has balance
    const previousBalance = parseFloat(currentSellerInfo?.balance_amount || 0);
    const hasPreviousBalance = previousBalance > 0;
    const effectivePayPreviousBalance = hasPreviousBalance; // Always true if there's a balance
    const effectivePreviousBalancePaid = hasPreviousBalance ? previousBalance : 0; // Always full balance if exists
    
    const effectivePaymentStatus =
      overrides.paymentStatus !== undefined ? overrides.paymentStatus : paymentStatus;
    // For partially_paid, always default to 0 if not explicitly provided
    let effectivePaidAmount = overrides.paidAmount !== undefined ? overrides.paidAmount : paidAmount;
    if (effectivePaymentStatus === 'partially_paid' && (effectivePaidAmount === undefined || effectivePaidAmount === null || effectivePaidAmount === '')) {
      effectivePaidAmount = 0;
    }
    
    // Preserve discount values from previewData if it exists
    const itemsToProcess = previewData && previewData.items ? previewData.items.map(pItem => {
      const selectedItem = selectedItems.find(sItem => sItem.item_id === pItem.item_id);
      if (selectedItem) {
        return {
          ...selectedItem,
          discount: pItem.discount !== undefined ? pItem.discount : selectedItem.discount,
          discount_type: pItem.discount_type || selectedItem.discount_type || 'percentage',
          discount_percentage: pItem.discount_percentage !== undefined ? pItem.discount_percentage : selectedItem.discount_percentage
        };
      }
      return selectedItem;
    }).filter(Boolean) : selectedItems;

    try {
      await dispatch(calculatePreview({
        selectedItems: itemsToProcess,
        sellerInfo: currentSellerInfo,
        withGst: currentWithGst,
        payPreviousBalance: effectivePayPreviousBalance,
        previousBalancePaid: effectivePreviousBalancePaid,
        paymentStatus: effectivePaymentStatus,
        paidAmount: effectivePaidAmount
      })).unwrap();
      
      if (overrideWithGst !== null) {
        dispatch(setWithGst(currentWithGst));
      }
      
      if (!silent) toast.success('✅ Bill preview generated successfully');
    } catch (error) {
      console.error('Error in handlePreview:', error);
      toast.error('❌ ' + (error || 'Error calculating preview'));
    }
  };
  handlePreviewRef.current = handlePreview;

  // Automatic bill preview: when user is on preview view and inputs change, recalculate after a short delay
  useEffect(() => {
    if (!previewData || !previewDirty || previewLoading || actionInProgress || !selectedSeller || selectedItems.length === 0) return;
    const timer = setTimeout(() => {
      if (handlePreviewRef.current) handlePreviewRef.current(null, {}, { silent: true });
    }, 700);
    return () => clearTimeout(timer);
  }, [previewData, previewDirty, previewLoading, actionInProgress, selectedSeller, selectedItems.length]);

  const handleSubmit = async () => {
    // Prevent double submission with multiple checks
    if (loading.submit || actionInProgress) {
      toast.warning('⏳ Transaction is already being processed...');
      return;
    }

    // If previewData doesn't exist, generate it first before submitting
    let currentPreviewData = previewData;
    if (!currentPreviewData) {
      toast.info('⏳ Generating bill preview before confirming sale...');
      try {
        await handlePreview();
        // Wait a moment for Redux state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        // Get the updated previewData from Redux state
        const state = store.getState();
        currentPreviewData = state.sellItem.previewData;
        
        if (!currentPreviewData) {
          toast.error('❌ Failed to generate bill preview. Please try again.');
          return;
        }
      } catch (error) {
        console.error('Error generating preview:', error);
        toast.error('❌ Failed to generate bill preview. Please try again.');
        return;
      }
    }

    // If preview is stale but we have preview data, refresh preview first then submit (one-click flow)
    if (isPreviewStale() && currentPreviewData) {
      toast.info('⏳ Updating preview and confirming sale...');
      try {
        await handlePreview();
        await new Promise(resolve => setTimeout(resolve, 150));
        const state = store.getState();
        currentPreviewData = state.sellItem.previewData;
        if (!currentPreviewData) {
          toast.error('❌ Failed to update preview. Please try again.');
          return;
        }
      } catch (err) {
        console.error('Error updating preview before submit:', err);
        toast.error('❌ Failed to update preview. Please try again.');
        return;
      }
    } else if (isPreviewStale()) {
      toast.warning('⚠️ Please generate bill preview first.');
      return;
    }

    try {
      // Comprehensive validation
      if (!currentPreviewData.items || currentPreviewData.items.length === 0) {
        toast.error('❌ Please add at least one item to the sale');
        return;
      }

      // Validate stock and quantities (Petrol/Diesel: quantity is optional, can be 0)
      const isPetrolOrDiesel = (it) => it.product_code === 'PETROL-001' || it.product_code === 'DIESEL-001';
      const withQty = (currentPreviewData.items || []).filter(it => (parseInt(it.quantity, 10) || 0) > 0);
      if (withQty.length === 0) {
        toast.error('❌ At least one item must have quantity greater than 0');
        return;
      }
      let hasIssues = false;
      for (const item of currentPreviewData.items) {
        const availableQty = item.available_quantity || 0;
        const quantity = parseInt(item.quantity) || 0;
        if (quantity <= 0) {
          if (!isPetrolOrDiesel(item)) {
            toast.error(`❌ Invalid quantity for "${item.product_name}". Quantity must be greater than 0`);
            hasIssues = true;
          }
        } else if (quantity > availableQty) {
          toast.error(`❌ Insufficient stock for "${item.product_name}". Available: ${availableQty}, Requested: ${quantity}`);
          hasIssues = true;
        }
      }
      if (hasIssues) {
        return;
      }

      // Validate payment info
      if (!currentPreviewData.paymentStatus) {
        toast.error('❌ Please select a payment status (Fully Paid or Partially Paid)');
        return;
      }

      if (currentPreviewData.paymentStatus === 'partially_paid') {
        // Use Redux state paidAmount as it's the most up-to-date value
        // Round to whole number for validation
        const paidAmt = Math.round(paidAmount || 0);
        const grandTotal = currentPreviewData.grandTotal || currentPreviewData.total || 0;
        const roundedGrandTotal = Math.round(grandTotal);
        
        // Allow 0 for partial payment, only check if negative
        if (paidAmt < 0) {
          toast.error('❌ Paid amount cannot be negative');
          return;
        }
        
        if (paidAmt > roundedGrandTotal) {
          toast.error(`❌ Paid amount (₹${paidAmt.toFixed(2)}) cannot exceed grand total (₹${roundedGrandTotal.toFixed(2)})`);
          return;
        }
        const dueDateVal = (dueDateForPartial || '').trim();
        if (!dueDateVal) {
          toast.error('❌ Please select Due Date for partial payment before proceeding.');
          return;
        }
      }

      toast.info('⏳ Processing your sale transaction...');
      // Use current Redux state for paidAmount to ensure we send the latest value
      // Round to whole number (no decimals)
      const currentPaidAmount = currentPreviewData.paymentStatus === 'partially_paid' 
        ? Math.round(paidAmount || 0)
        : Math.round(currentPreviewData.paidAmount || 0);
      
      // Create updated preview data with current paidAmount (rounded)
      const updatedPreviewData = {
        ...currentPreviewData,
        paidAmount: currentPaidAmount
      };
      
      const dueDateToSend = currentPreviewData.paymentStatus === 'partially_paid' ? (dueDateForPartial || '').trim() : null;
      const result = await dispatch(submitSale({ previewData: updatedPreviewData, selectedSeller, dueDate: dueDateToSend })).unwrap();
      
      // Refresh seller info to get updated balance after transaction
      let updatedSellerInfo = sellerInfo;
      if (selectedSeller) {
        try {
          const sellerInfoResult = await dispatch(fetchSellerInfo(selectedSeller)).unwrap();
          updatedSellerInfo = sellerInfoResult;
        } catch (error) {
          console.error('Error refreshing seller info:', error);
        }
      }
      
      if (result.transactionId) {
        dispatch(setPrintDisabled(false));
        
        // Calculate transaction summary
        const invoiceTotal = currentPreviewData.total || 0; // Total of items only (cart amount)
        const previousBalancePaid = currentPreviewData.previousBalancePaid || 0;
        const grandTotalBeforeRounding = invoiceTotal + previousBalancePaid; // Grand total before rounding
        const roundedGrandTotal = Math.round(grandTotalBeforeRounding);
        const roundedPaidAmount = Math.round(currentPaidAmount);
        const balanceDue = Math.max(0, roundedGrandTotal - roundedPaidAmount);
        
        // Prepare success modal data and show modal immediately
        const modalData = {
          transactionId: result.transactionId,
          billNumber: result.billNumber || 'N/A',
          paymentStatus: currentPreviewData.paymentStatus,
          cartAmount: invoiceTotal, // Cart amount = total of items only (before previous balance)
          previousBalancePaid: previousBalancePaid,
          amountPaid: roundedPaidAmount,
          balanceDue: balanceDue,
          grandTotal: roundedGrandTotal,
          partyName: updatedSellerInfo?.party_name || sellerInfo?.party_name || 'N/A',
          partyMobile: updatedSellerInfo?.mobile_number || sellerInfo?.mobile_number || 'N/A',
          partyEmail: updatedSellerInfo?.email || sellerInfo?.email || 'N/A',
          currentBalance: updatedSellerInfo?.balance_amount || sellerInfo?.balance_amount || 0,
          date: new Date().toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };
        
        // Set modal data and show modal immediately after successful API response
        console.log('Setting modal state:', { modalData, hasTransactionId: !!modalData.transactionId, hasCartAmount: modalData.cartAmount !== undefined });
        setSuccessModalData(modalData);
        setShowSuccessModal(true);
        console.log('Modal state set - showSuccessModal:', true, 'successModalData:', modalData);
        
        // Show success toast
        toast.success(`✅ Sale completed successfully! Bill Number: ${result.billNumber || 'N/A'}`);
      } else {
        toast.success('✅ Sale completed successfully!');
        dispatch(resetAfterSale());
      }

    } catch (error) {
      const errorMessage = error || 'Unknown error occurred';
      console.error('Sale submission error:', error);
      toast.error('❌ Transaction failed: ' + errorMessage);
      // Clear modal state on error
      setShowSuccessModal(false);
      setSuccessModalData(null);
    }
  };

  const handlePrint = async () => {
    if (printDisabled || printClicked) {
      toast.warning('⚠️ Please confirm the sale first to enable printing');
      return;
    }
    
    if (!previewData || !previewData.transactionId) {
      toast.warning('⚠️ Please complete the sale first to print PDF');
      return;
    }
    
    dispatch(setPrintClicked(true));
    await handlePrintPDF(previewData.transactionId);
    dispatch(setPrintClicked(false));
  };

  const handleDownloadPDF = async (transactionId, billNumber) => {
    const txId = transactionId || previewData?.transactionId;
    const billNo = billNumber || previewData?.billNumber;
    
    if (!txId) {
      toast.warning('⚠️ Please complete the sale first to download PDF');
      return;
    }
    
    setDownloadingPDF(true);
    try {
      toast.info('📥 Preparing PDF download...');
      const response = await apiClient.get(config.api.billPdf(txId), {
        responseType: 'blob',
        timeout: 30000 // 30 second timeout
      });
      
      if (!response.data || response.data.size === 0) {
        toast.error('❌ Received empty PDF file');
        return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bill_${billNo || txId}_${getLocalDateString()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('✅ PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      toast.error('❌ Error downloading PDF: ' + errorMsg);
    } finally {
      setDownloadingPDF(false);
    }
  };
  
  const handlePrintPDF = async (transactionId) => {
    const txId = transactionId || previewData?.transactionId;
    
    if (!txId) {
      toast.warning('⚠️ Please complete the sale first to print PDF');
      return;
    }
    
    setPrintingPDF(true);
    try {
      toast.info('🖨️ Preparing PDF for printing...');
      const response = await apiClient.get(config.api.billPdf(txId), {
        responseType: 'blob',
        timeout: 30000
      });
      
      if (!response.data || response.data.size === 0) {
        toast.error('❌ Received empty PDF file');
        return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const printWindow = window.open(url, '_blank');
      if (!printWindow) {
        toast.error('❌ Unable to open print window. Please check your popup blocker settings.');
        window.URL.revokeObjectURL(url);
        return;
      }
      
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
          toast.success('✅ Print dialog opened');
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 2000);
        } catch (printError) {
          console.error('Print error:', printError);
          toast.info('📄 PDF opened in new window. Please use the browser\'s print button.');
          window.URL.revokeObjectURL(url);
        }
      }, 1000);
    } catch (error) {
      console.error('Error fetching PDF for print:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      toast.error('❌ Error loading PDF for printing: ' + errorMsg);
    } finally {
      setPrintingPDF(false);
    }
  };
  
  const handleDownloadReceipt = async (transactionId, billNumber) => {
    const txId = transactionId || previewData?.transactionId;
    const billNo = billNumber || previewData?.billNumber;
    
    if (!txId) {
      toast.warning('⚠️ Please complete the sale first to download receipt');
      return;
    }
    
    setDownloadingReceipt(true);
    try {
      toast.info('📥 Preparing receipt download...');
      const response = await apiClient.get(config.api.billPdf(txId), {
        responseType: 'blob',
        timeout: 30000
      });
      
      if (!response.data || response.data.size === 0) {
        toast.error('❌ Received empty PDF file');
        return;
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${billNo || txId}_${getLocalDateString()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('✅ Receipt downloaded successfully');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      toast.error('❌ Error downloading receipt: ' + errorMsg);
    } finally {
      setDownloadingReceipt(false);
    }
  };
  
  const handleNewSale = () => {
    setShowSuccessModal(false);
    setSuccessModalData(null);
    dispatch(resetAfterSale());
    dispatch(clearPreview());
    dispatch(resetSellItem());
    toast.info('🆕 Starting new sale...');
  };

  const handleRemoveFromPreview = (itemId) => {
    // Remove from preview (and sync selectedItems) in Redux; no API call needed
    if (actionInProgress) return;
    if (!previewData || !previewData.items.some((i) => i.item_id === itemId)) return;
    setActionInProgress(true);
    try {
      dispatch(removePreviewItem(itemId));
      toast.success('✅ Item removed from preview');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleBackToEdit = async () => {
    // Restore all state from previewData to make it persistent
    if (previewData) {
      // Items are already synced in Redux from calculatePreview
      if (previewData.selectedSeller) {
        dispatch(setSelectedSeller(previewData.selectedSeller));
        // Ensure sellerInfo is fetched when going back to edit
        if (!sellerInfo || sellerInfo.id !== previewData.selectedSeller) {
          try {
            await dispatch(fetchSellerInfo(previewData.selectedSeller));
          } catch (error) {
            console.error('Error fetching seller info:', error);
          }
        }
      }
      dispatch(setPaymentStatus(previewData.paymentStatus));
      dispatch(setPaidAmount(previewData.paidAmount));
      // Restore previous balance state if it was set
      if (previewData.previousBalancePaid !== undefined) {
        dispatch(setPreviousBalancePaid(previewData.previousBalancePaid));
        dispatch(setPayPreviousBalance(previewData.previousBalancePaid > 0));
      }
    }
    dispatch(clearPreview());
  };

  // Local state for cart/search UI

  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const billPreviewRef = useRef(null);

  // Manage body scroll when transaction is processing
  useEffect(() => {
    const isProcessing = loading.submit || actionInProgress;
    if (isProcessing) {
      document.body.classList.add('transaction-loading');
    } else {
      document.body.classList.remove('transaction-loading');
    }
    return () => {
      document.body.classList.remove('transaction-loading');
    };
  }, [loading.submit, actionInProgress]);

  // Scroll-to-top functionality disabled - bill preview is no longer scrollable
  // The preview will show completely without internal scrolling

  const handleCopyBillNumber = () => {
    if (previewData?.billNumber) {
      navigator.clipboard.writeText(previewData.billNumber);
      toast.success(`Bill number ${previewData.billNumber} copied to clipboard!`);
    }
  };

  const handleBackToEditClick = async () => {
    if (actionInProgress) return;
    setActionInProgress(true);
    try {
      await handleBackToEdit();
    } finally {
      setActionInProgress(false);
    }
  };

  const handleNewSaleClick = () => {
    if (actionInProgress) return;

    // "Soft refresh" – reset state without reloading the page
    // This clears any old preview/payment/cart/seller selection and brings the UI back to initial state.
    dispatch(resetSellItem());
    dispatch(clearPreview());
    dispatch(fetchSellerParties());

    // Reset local UI flags and clear modal state
    setActionInProgress(false);
    setShowSuccessModal(false);
    setSuccessModalData(null);

    // Nice UX: jump to top so user starts from seller selection again
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

    toast.info('✨ Ready for new sale');
  };

  const handlePrintClick = () => {
    if (actionInProgress || printDisabled || printClicked) return;
    handlePrint();
  };

  const handleDownloadPDFClick = async () => {
    if (actionInProgress || !previewData?.transactionId) return;
    setActionInProgress(true);
    try {
      await handleDownloadPDF(previewData?.transactionId, previewData?.billNumber);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleSubmitClick = async () => {
    if (actionInProgress || previewData?.transactionId || loading.submit) return;
    setActionInProgress(true);
    try {
      await handleSubmit();
    } finally {
      setActionInProgress(false);
    }
  };

  if (previewData) {
    const isTransactionComplete = !!previewData.transactionId;
    const isProcessing = loading.submit || actionInProgress || previewLoading;
    const previewStale = isPreviewStale();

    return (
      <Layout>
        <TransactionLoader
          isLoading={loading.submit || actionInProgress || previewLoading}
          message={loading.submit ? 'Processing sale...' : previewLoading ? 'Processing preview...' : 'Processing...'}
        />
        <div className="sell-item">
          <div className="sell-item-wrapper">
            <div className="sell-item-main">
              {/* Preview title and bill number - on left */}
              <div className="preview-header" style={{ marginBottom: '20px' }}>
                <div>
                  <h2>Bill Preview</h2>
                  {previewData.billNumber && (
                    <div style={{ 
                      margin: '6px 0 0 0', 
                      fontSize: '13px', 
                      color: '#6c757d',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>Invoice #: <strong style={{ color: '#2c3e50' }}>{previewData.billNumber}</strong></span>
                      <button
                        onClick={handleCopyBillNumber}
                        className="btn btn-secondary"
                        aria-label="Copy bill number to clipboard"
                        style={{ padding: '4px 8px', fontSize: '11px', minHeight: 'auto', minWidth: 'auto' }}
                        title="Copy bill number"
                      >
                        📋 Copy
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {/* Actions moved to right panel - placeholder to preserve layout */}
            <div className="preview-actions" style={{ display: 'none' }}>
              {/* Back/New Sale Button */}
              <button 
                onClick={isTransactionComplete ? handleNewSaleClick : handleBackToEditClick}
                className="btn btn-secondary"
                disabled={isProcessing}
                aria-disabled={isProcessing}
                aria-label={isTransactionComplete ? 'Start a new sale' : 'Go back to edit the bill'}
                tabIndex={isProcessing ? -1 : 0}
              >
                {isTransactionComplete ? 'New Sale' : 'Back to Edit'}
              </button>

              {/* Print Button */}
              {isTransactionComplete && (
                <button 
                  onClick={handlePrintClick}
                  className="btn btn-primary"
                  disabled={printDisabled || printClicked || isProcessing}
                  aria-disabled={printDisabled || printClicked || isProcessing}
                  aria-label={printClicked ? 'Printing bill' : 'Print bill'}
                  tabIndex={(printDisabled || printClicked || isProcessing) ? -1 : 0}
                >
                  {printClicked ? (
                    <>
                      <div style={{ 
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid #fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        marginRight: '8px'
                      }}></div>
                      Printing...
                    </>
                  ) : (
                    'Print'
                  )}
                </button>
              )}

              {/* Download PDF Button */}
              {isTransactionComplete && (
                <button 
                  onClick={handleDownloadPDFClick}
                  className="btn btn-success"
                  disabled={!previewData.transactionId || isProcessing}
                  aria-disabled={!previewData.transactionId || isProcessing}
                  aria-label="Download bill as PDF"
                  tabIndex={(!previewData.transactionId || isProcessing) ? -1 : 0}
                >
                  Download PDF
                </button>
              )}

              {/* Update Preview Button (only before transaction is completed) */}
              {!isTransactionComplete && (
                <button
                  onClick={async () => {
                    if (isProcessing || !previewStale) return;
                    if (actionInProgress) return;
                    setActionInProgress(true);
                    try {
                      await handlePreview();
                      toast.success('✅ Bill preview updated');
                    } finally {
                      setActionInProgress(false);
                    }
                  }}
                  className="btn btn-primary"
                  disabled={isProcessing || !previewStale}
                  aria-disabled={isProcessing || !previewStale}
                  aria-label={previewStale ? 'Update bill preview with latest changes' : 'Preview is already up to date'}
                  tabIndex={(isProcessing || !previewStale) ? -1 : 0}
                  style={{
                    fontSize: '15px',
                    padding: '12px 20px',
                    fontWeight: '600',
                    opacity: (!previewStale || isProcessing) ? 0.6 : 1,
                    cursor: (!previewStale || isProcessing) ? 'not-allowed' : 'pointer'
                  }}
                  title={previewStale ? 'Update the bill preview with the latest changes before confirming the sale.' : 'Preview already matches the latest changes.'}
                >
                  {previewStale ? 'Update Preview' : 'Preview Updated'}
                </button>
              )}

              {/* Confirm Sale Button */}
              {!isTransactionComplete && (
                <button 
                  onClick={handleSubmitClick}
                  className="btn btn-success"
                  disabled={isProcessing || previewStale}
                  aria-disabled={isProcessing || previewStale}
                  aria-label={previewStale ? 'Please generate bill preview first' : (loading.submit ? 'Processing sale transaction' : 'Confirm and submit sale')}
                  tabIndex={(isProcessing || previewStale) ? -1 : 0}
                  style={{
                    fontSize: '15px',
                    padding: '12px 28px',
                    fontWeight: '600',
                    opacity: previewStale ? 0.6 : 1,
                    cursor: previewStale ? 'not-allowed' : 'pointer'
                  }}
                  title={previewStale ? 'Please generate bill preview first. Changes detected - preview needs to be regenerated.' : ''}
                >
                  {loading.submit ? (
                    <>
                      <div style={{ 
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid #fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        marginRight: '8px'
                      }}></div>
                      Processing...
                    </>
                  ) : previewStale ? (
                    'Generate Preview First'
                  ) : (
                    'Confirm Sale'
                  )}
                </button>
              )}

              {/* Sale Confirmed Badge */}
              {isTransactionComplete && (
                <div style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  background: '#d4edda',
                  color: '#155724',
                  border: '1px solid #c3e6cb'
                }}>
                  Sale Confirmed
                </div>
              )}
            </div>
          </div>

          {previewLoading && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minHeight: '400px',
              padding: '40px',
              textAlign: 'center',
              width: '100%'
            }}>
              <div style={{ 
                display: 'inline-block',
                width: '50px',
                height: '50px',
                border: '4px solid #e1e8ed',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: '20px'
              }}></div>
              <p style={{ marginTop: '0', fontSize: '16px', color: '#495057' }}>Calculating preview...</p>
            </div>
          )}
          {previewData && !previewLoading && (
            <div style={{ position: 'relative' }}>
              <div
                ref={billPreviewRef}
                className="bill-preview"
                id="bill-print-content"
                tabIndex={0}
                style={{
                  outline: 'none',
                  overflow: 'visible',
                  position: 'relative',
                  paddingBottom: '120px',
                  marginBottom: '80px'
                }}
              >
            {/* Seller Info Only */}
            <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>Customer Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', fontSize: '14px' }}>
                <div>
                  <strong>Name:</strong> {previewData.seller?.party_name || '-'}
                </div>
                {previewData.seller?.address && (
                  <div>
                    <strong>Address:</strong> {previewData.seller.address}
                  </div>
                )}
                {previewData.seller?.mobile_number && (
                  <div>
                    <strong>Mobile No.:</strong> {previewData.seller.mobile_number}
                  </div>
                )}
                {previewData.seller?.gst_number && (
                  <div>
                    <strong>GSTIN / UIN:</strong> {previewData.seller.gst_number}
                  </div>
                )}
                {previewData.billNumber && (
                  <div>
                    <strong>Invoice No.:</strong> {previewData.billNumber}
                  </div>
                )}
                <div>
                  <strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}
                </div>
              </div>
            </div>

            <table className="table bill-preview-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', fontSize: '12px' }}>
              <thead style={{ backgroundColor: '#34495e', color: '#ffffff' }}>
                <tr>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', border: '1px solid #2c3e50', backgroundColor: '#34495e', color: '#ffffff' }}>S.N.</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600', border: '1px solid #2c3e50', backgroundColor: '#34495e', color: '#ffffff' }}>Description of Goods</th>
                  {previewData.withGst && (
                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', border: '1px solid #2c3e50', backgroundColor: '#34495e', color: '#ffffff' }}>HSN/Code</th>
                  )}
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', border: '1px solid #2c3e50', backgroundColor: '#34495e', color: '#ffffff' }}>Qty.</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', border: '1px solid #2c3e50', backgroundColor: '#34495e', color: '#ffffff' }}>Unit</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontWeight: '600', border: '1px solid #2c3e50', backgroundColor: '#34495e', color: '#ffffff' }}>MRP</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', border: '1px solid #2c3e50', backgroundColor: '#34495e', color: '#ffffff' }}>Disc (₹/qty)</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontWeight: '600', border: '1px solid #2c3e50', backgroundColor: '#34495e', color: '#ffffff' }}>Price</th>
                  {previewData.withGst && (
                    <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', border: '1px solid #2c3e50', backgroundColor: '#34495e', color: '#ffffff' }}>Tax Rate</th>
                  )}
                  <th style={{ padding: '8px', textAlign: 'right', fontWeight: '600', border: '1px solid #2c3e50', backgroundColor: '#34495e', color: '#ffffff' }}>Amount(₹)</th>
                  {!previewData.transactionId && <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', border: '1px solid #2c3e50', backgroundColor: '#34495e', color: '#ffffff' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {previewData.items.map((item, index) => {
                  const availableQty = item.available_quantity || 0;
                  const quantity = item.quantity === '' ? 0 : parseInt(item.quantity) || 0;
                  const isOverStock = quantity > availableQty;
                  const saleRate = parseFloat(item.sale_rate) || 0;
                  const itemTotal = saleRate * quantity;
                  return (
                    <tr key={item.item_id} style={{ backgroundColor: isOverStock ? '#ffebee' : 'transparent', border: '1px solid #ddd' }}>
                      <td style={{ textAlign: 'center', padding: '8px', border: '1px solid #ddd' }}>{index + 1}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.product_name}</td>
                      {previewData.withGst && (
                        <td style={{ textAlign: 'center', padding: '8px', border: '1px solid #ddd' }}>{item.hsn_number || '-'}</td>
                      )}
                      <td style={{ textAlign: 'center', padding: '8px', border: '1px solid #ddd' }}>
                        {previewData.transactionId ? (
                          <span style={{ fontWeight: '500' }}>{quantity}</span>
                        ) : (
                          <>
                            <input
                              type="number"
                              step="any"
                              value={item.quantity === '' ? '' : item.quantity}
                              onChange={(e) => {
                                const val = e.target.value;
                                // Only allow digits and empty string
                                // Block mathematical signs: +, -, *, /, e, E, decimal point
                                if (val !== '' && !/^\d+$/.test(val)) return;
                                updateQuantityInPreview(item.item_id, val);
                              }}
                              onKeyDown={(e) => {
                                // Block mathematical signs, 'e', 'E', and decimal point
                                if (['+', '-', '*', '/', 'e', 'E', '.', ','].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onBlur={(e) => {
                                // When user leaves the field, ensure it has a valid value
                                const val = e.target.value;
                                if (val === '' || parseInt(val) <= 0) {
                                  updateQuantityInPreview(item.item_id, '1');
                                }
                              }}
                              style={{
                                width: '80px',
                                border: isOverStock ? '2px solid #f44336' : '1px solid #ddd',
                                backgroundColor: isOverStock ? '#ffcdd2' : 'white'
                              }}
                              min="1"
                            />
                            {isOverStock && (
                              <div style={{ color: '#f44336', fontSize: '12px', marginTop: '5px', fontWeight: 'bold' }}>
                                ⚠️ Available: {availableQty}
                              </div>
                            )}
                            {!isOverStock && availableQty > 0 && (
                              <div style={{ color: '#666', fontSize: '11px', marginTop: '5px' }}>
                                Available: {availableQty}
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px', border: '1px solid #ddd' }}>PCS</td>
                      <td style={{ textAlign: 'right', padding: '8px', border: '1px solid #ddd' }}>
                        {!previewData.transactionId ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.sale_rate ?? ''}
                            onChange={(e) => dispatch(updatePreviewItemSaleRate({ itemId: item.item_id, saleRate: e.target.value }))}
                            onBlur={() => { if (handlePreviewRef.current) handlePreviewRef.current(); }}
                            style={{ width: '72px', fontSize: '11px', textAlign: 'right', padding: '4px' }}
                          />
                        ) : (
                          <span>₹{parseFloat(item.sale_rate || 0).toFixed(2)}</span>
                        )}
                        {item.min_sale_rate != null && (
                          <div style={{ fontSize: '10px', color: '#6c757d', marginTop: '2px' }}>Min: ₹{parseFloat(item.min_sale_rate).toFixed(2)}</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px', border: '1px solid #ddd' }}>
                        {!previewData.transactionId ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={(() => {
                              const q = parseInt(item.quantity, 10) || 0;
                              return q > 0 && (item.discount || 0) > 0 ? ((item.discount || 0) / q) : '';
                            })()}
                            onChange={(e) => {
                              const inputVal = e.target.value;
                              if (inputVal !== '' && !/^[\d.]*$/.test(inputVal)) return;
                              if ((inputVal.match(/\./g) || []).length > 1) return;
                              const q = parseInt(item.quantity, 10) || 0;
                              if (inputVal === '') {
                                dispatch(updatePreviewItemDiscount({ itemId: item.item_id, discount: 0, discountType: 'amount', discountPercentage: null }));
                                return;
                              }
                              const val = parseFloat(inputVal);
                              if (isNaN(val) || val < 0) return;
                              dispatch(updatePreviewItemDiscount({ itemId: item.item_id, discount: val * q, discountType: 'amount', discountPercentage: null }));
                            }}
                            onKeyDown={(e) => { if (['+', '-', '*', '/', 'e', 'E'].includes(e.key)) e.preventDefault(); }}
                            onBlur={(e) => {
                              const inputVal = e.target.value;
                              const q = parseInt(item.quantity, 10) || 0;
                              if (inputVal === '' || isNaN(parseFloat(inputVal))) {
                                dispatch(updatePreviewItemDiscount({ itemId: item.item_id, discount: 0, discountType: 'amount', discountPercentage: null }));
                                return;
                              }
                              dispatch(updatePreviewItemDiscount({ itemId: item.item_id, discount: Math.max(0, parseFloat(inputVal)) * q, discountType: 'amount', discountPercentage: null }));
                            }}
                            style={{ width: '56px', fontSize: '11px', textAlign: 'center', padding: '4px' }}
                            placeholder="₹/qty"
                            className="discount-input"
                            title="Discount per quantity"
                          />
                        ) : (
                          <span>₹{(parseFloat(item.discount) || 0).toFixed(2)}</span>
                        )}
                          </td>
                      <td style={{ textAlign: 'right', padding: '8px', border: '1px solid #ddd' }}>₹{parseFloat(item.effectiveRate || item.sale_rate || 0).toFixed(2)}</td>
                      {previewData.withGst && (
                        <td style={{ textAlign: 'center', padding: '8px', border: '1px solid #ddd' }}>{parseFloat(item.tax_rate || 0).toFixed(2)}%</td>
                      )}
                      <td style={{ textAlign: 'right', padding: '8px', border: '1px solid #ddd', fontWeight: '600' }}>₹{parseFloat(item.itemTotalAfterDiscount || itemTotal || 0).toFixed(2)}</td>
                      {!previewData.transactionId && (
                        <td style={{ textAlign: 'center', padding: '8px', border: '1px solid #ddd' }}>
                          <ActionMenu
                            itemId={item.item_id}
                            itemName={item.product_name}
                            actions={[
                              {
                                label: 'Remove',
                                icon: '🗑️',
                                danger: true,
                                onClick: (id) => handleRemoveFromPreview(id)
                              }
                            ]}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot style={{ backgroundColor: '#f8f9fa' }}>
                {/* Calculate totals */}
                {(() => {
                  const totalQty = previewData.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
                  // Calculate cart amount (items total after discount, NOT including previous balance)
                  const cartAmount = previewData.total || 0; // Total of items only (after discount, before previous balance)
                  // Calculate total discount amount using per-item discount from preview
                  const totalDiscountAmount = previewData.items.reduce(
                    (sum, item) => sum + (parseFloat(item.itemDiscount) || 0),
                    0
                  );
                  const previousBalancePaid = previewData.previousBalancePaid || 0;
                  const grandTotalBeforeRounding = cartAmount + previousBalancePaid; // Grand total before rounding
                  // Calculate rounding on grand total
                  const roundedOff = Math.round(grandTotalBeforeRounding) - grandTotalBeforeRounding;
                  const finalGrandTotal = Math.round(grandTotalBeforeRounding); // Rounded grand total
                  const taxableAmt = previewData.subtotal || 0;
                  const cgstAmt = previewData.withGst ? (previewData.taxAmount || 0) / 2 : 0;
                  const sgstAmt = previewData.withGst ? (previewData.taxAmount || 0) / 2 : 0;
                  const totalTax = previewData.taxAmount || 0;
                  
                  // Round payment amounts to whole numbers (no decimals)
                  const rawPaidAmount = paymentStatus === 'partially_paid' ? (paidAmount || 0) : (previewData.paidAmount || 0);
                  const roundedPaidAmount = Math.round(rawPaidAmount);
                  // Calculate balance due using rounded grand total and rounded paid amount
                  const balanceDue = Math.max(0, finalGrandTotal - roundedPaidAmount);
                  
                  return (
                    <>
                      {/* Cart Amount (Items total after discount, NOT including previous balance) */}
                      <tr>
                        <td colSpan={previewData.withGst ? 8 : 7} style={{ textAlign: 'right', padding: '8px', border: '1px solid #ddd', fontSize: '12px', fontWeight: '600' }}>
                          Cart Amount:
                    </td>
                        <td style={{ textAlign: 'right', padding: '8px', border: '1px solid #ddd', fontWeight: '600', fontSize: '12px' }}>
                          ₹{cartAmount.toFixed(2)}
                    </td>
                        {!previewData.transactionId && <td></td>}
                  </tr>

                      {/* Total Discount Amount */}
                      {totalDiscountAmount > 0 && (
                        <tr>
                          <td colSpan={previewData.withGst ? 8 : 7} style={{ textAlign: 'right', padding: '8px', border: '1px solid #ddd', fontSize: '12px', fontWeight: '600', color: '#28a745' }}>
                            Total Discount:
                    </td>
                          <td style={{ textAlign: 'right', padding: '8px', border: '1px solid #ddd', fontWeight: '600', fontSize: '12px', color: '#28a745' }}>
                            -₹{totalDiscountAmount.toFixed(2)}
                    </td>
                          {!previewData.transactionId && <td></td>}
                        </tr>
                      )}

                      {/* Rounding Off */}
                      {Math.abs(roundedOff) > 0.0001 && (
                  <tr>
                          <td colSpan={previewData.withGst ? 8 : 7} style={{ textAlign: 'right', padding: '8px', border: '1px solid #ddd', fontSize: '12px', fontWeight: '600' }}>
                            Rounded Off ({roundedOff > 0 ? '+' : '-'}):
                    </td>
                          <td style={{ textAlign: 'right', padding: '8px', border: '1px solid #ddd', fontWeight: '600', fontSize: '12px', color: roundedOff > 0 ? '#28a745' : '#dc3545' }}>
                            {roundedOff > 0 ? '+' : ''}₹{Math.abs(roundedOff).toFixed(2)}
                    </td>
                          {!previewData.transactionId && <td></td>}
                  </tr>
                )}

                      {/* Grand Total (Quantity and Amount) */}
                      <tr style={{ backgroundColor: '#e9ecef', borderTop: '2px solid #2c3e50' }}>
                        <td colSpan={previewData.withGst ? 3 : 2} style={{ textAlign: 'left', padding: '10px', border: '1px solid #ddd', fontWeight: '700', fontSize: '13px' }}>
                          Grand Total (Quantity): {totalQty.toFixed(2)} PCS
                  </td>
                        <td colSpan={previewData.withGst ? 5 : 5} style={{ textAlign: 'right', padding: '10px', border: '1px solid #ddd', fontWeight: '700', fontSize: '16px' }}>
                          Grand Total (Amount): ₹{finalGrandTotal.toFixed(2)}
                  </td>
                        {!previewData.transactionId && <td></td>}
                </tr>

                      {/* Tax Summary (only for GST) */}
                      {previewData.withGst && totalTax > 0 && (
                        <tr style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #ddd' }}>
                          <td colSpan={previewData.withGst ? 8 : 7} style={{ padding: '10px', border: '1px solid #ddd', fontSize: '12px', fontWeight: '600' }}>
                            Tax Summary:
                    </td>
                          {!previewData.transactionId && <td></td>}
                  </tr>
                )}
                      {previewData.withGst && totalTax > 0 && (
                        <>
                          <tr>
                            {/* <td colSpan={3} style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px' }}>Tax Rate: {previewData.items[0]?.tax_rate || 0}%</td> */}
                            <td colSpan={2} style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px' }}>Taxable Amt.: ₹{taxableAmt.toFixed(2)}</td>
                            <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px' }}>CGST Amt.: ₹{cgstAmt.toFixed(2)}</td>
                            <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px' }}>SGST Amt.: ₹{sgstAmt.toFixed(2)}</td>
                            <td colSpan={2} style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px', fontWeight: '600' }}>Total Tax: ₹{totalTax.toFixed(2)}</td>
                            {!previewData.transactionId && <td></td>}
                          </tr>
                        </>
                      )}
                      
                      {/* Previous Balance Row */}
                      {(previewData.previousBalance || 0) > 0 && (
                        <tr>
                          <td colSpan={previewData.withGst ? 8 : 7} style={{ textAlign: 'right', padding: '8px', border: '1px solid #ddd', fontSize: '12px', fontWeight: '600', color: '#e65100' }}>
                            Previous Balance:
                  </td>
                          <td style={{ textAlign: 'right', padding: '8px', border: '1px solid #ddd', fontSize: '12px', fontWeight: '600', color: '#e65100' }}>
                            +₹{(previewData.previousBalance || 0).toFixed(2)}
                  </td>
                          {!previewData.transactionId && <td></td>}
                </tr>
                      )}

                      {/* Amount Paid and Balance Due */}
                <tr style={{ backgroundColor: '#d4edda' }}>
                        <td colSpan={previewData.withGst ? 8 : 7} style={{ textAlign: 'right', padding: '8px', border: '1px solid #ddd', fontSize: '12px', fontWeight: '600' }}>
                    Amount Paid:
                  </td>
                        <td style={{ textAlign: 'right', padding: '8px', border: '1px solid #ddd', fontSize: '12px', fontWeight: '600' }}>
                    ₹{roundedPaidAmount.toFixed(2)}
                  </td>
                        {!previewData.transactionId && <td></td>}
                </tr>
                      <tr style={{ backgroundColor: balanceDue > 0 ? '#f8d7da' : '#d4edda' }}>
                        <td colSpan={previewData.withGst ? 8 : 7} style={{ textAlign: 'right', padding: '8px', border: '1px solid #ddd', fontSize: '12px', fontWeight: '700' }}>
                    Balance Due:
                  </td>
                        <td style={{ textAlign: 'right', padding: '8px', border: '1px solid #ddd', fontSize: '12px', fontWeight: '700' }}>
                    ₹{balanceDue.toFixed(2)}
                  </td>
                        {!previewData.transactionId && <td></td>}
                </tr>
                    </>
                  );
                })()}
              </tfoot>
            </table>
            
            {/* White Container for Amount in Words and Payment Configuration */}
            <div style={{ 
              marginTop: '20px', 
              padding: '20px',
              paddingBottom: '50px',
              marginBottom: '50px',
              backgroundColor: '#ffffff', 
              borderRadius: '12px', 
              border: '1px solid #e1e8ed',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
            }}>
              {/* Amount in Words */}
              <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #e9ecef' }}>
                <p style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#212529' }}>
                  <strong>Amount in Words:</strong> {numberToWords(previewData.grandTotal || previewData.total || 0)}
                </p>
              </div>

            {!previewData.transactionId && (
              <div className="payment-section" style={{ marginTop: '0', width: '100%' }}>
                <div style={{
                  marginBottom: '15px',
                  paddingBottom: '10px',
                  borderBottom: '2px solid #e9ecef'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#212529',
                    letterSpacing: '-0.3px'
                  }}>
                    Payment Configuration
                  </h3>
                </div>

                {/* Professional Payment Controls Row */}
                <div className="payment-controls-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto auto 1fr auto',
                  gap: '15px',
                  alignItems: 'center',
                  padding: '15px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  width: '100%'
                }}>
                  {/* GST Selection */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                    minWidth: '160px',
                    height: '42px'
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      margin: 0,
                      width: '100%',
                      color: '#495057'
                    }}>
                      <input
                        type="checkbox"
                        checked={withGst}
                        onChange={async (e) => {
                          if (actionInProgress || previewLoading) return;
                          setActionInProgress(true);
                          try {
                            const newWithGst = e.target.checked;
                            dispatch(setWithGst(newWithGst));
                            await handlePreview(newWithGst);
                          } finally {
                            setActionInProgress(false);
                          }
                        }}
                        disabled={previewLoading || actionInProgress}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: (previewLoading || actionInProgress) ? 'not-allowed' : 'pointer',
                          accentColor: '#28a745'
                        }}
                      />
                      <span>
                        Include GST
                        {withGst && <span style={{ color: '#28a745', marginLeft: '8px', fontWeight: '600' }}>✓</span>}
                      </span>
                    </label>
                  </div>

                  {/* Previous Balance Payment */}
                  {previewData.seller && previewData.seller.balance_amount > 0 && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 15px',
                      backgroundColor: '#fff8e1',
                      borderRadius: '8px',
                      border: '1px solid #ffc107',
                      minWidth: '180px',
                      height: '42px'
                    }}>
                      <span style={{ fontSize: '18px', lineHeight: 1 }}>⚠️</span>
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.3' }}>
                        <div style={{ fontWeight: '600', fontSize: '12px', color: '#856404', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Previous Balance
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#e65100', marginTop: '2px' }}>
                          ₹{parseFloat(previewData.seller?.balance_amount || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Status Radio Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      border: paymentStatus === 'fully_paid' ? '2px solid #28a745' : '1px solid #dee2e6',
                      borderRadius: '8px',
                      backgroundColor: paymentStatus === 'fully_paid' ? '#d4edda' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '130px',
                      justifyContent: 'center',
                      boxShadow: paymentStatus === 'fully_paid' ? '0 2px 4px rgba(40, 167, 69, 0.2)' : 'none'
                    }}>
                      <input
                        type="radio"
                        value="fully_paid"
                        checked={paymentStatus === 'fully_paid'}
                        onChange={async (e) => {
                          if (actionInProgress) return;
                          setActionInProgress(true);
                          try {
                            const newStatus = e.target.value;
                            dispatch(setPaymentStatus(newStatus));
                            await handlePreview(null, { paymentStatus: newStatus });
                          } finally {
                            setActionInProgress(false);
                          }
                        }}
                        disabled={actionInProgress}
                        style={{ margin: 0, accentColor: '#28a745' }}
                      />
                      <span style={{ 
                        fontWeight: '600', 
                        color: paymentStatus === 'fully_paid' ? '#155724' : '#6c757d', 
                        fontSize: '14px',
                        letterSpacing: '0.2px'
                      }}>
                        Fully Paid
                      </span>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      border: paymentStatus === 'partially_paid' ? '2px solid #ffc107' : '1px solid #dee2e6',
                      borderRadius: '8px',
                      backgroundColor: paymentStatus === 'partially_paid' ? '#fff8e1' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '130px',
                      justifyContent: 'center',
                      boxShadow: paymentStatus === 'partially_paid' ? '0 2px 4px rgba(255, 193, 7, 0.2)' : 'none'
                    }}>
                      <input
                        type="radio"
                        value="partially_paid"
                        checked={paymentStatus === 'partially_paid'}
                        onChange={async (e) => {
                          if (actionInProgress) return;
                          setActionInProgress(true);
                          try {
                            const newStatus = e.target.value;
                            dispatch(setPaymentStatus(newStatus));
                            // ALWAYS set paidAmount to 0 when switching to partially_paid
                            if (newStatus === 'partially_paid') {
                              dispatch(setPaidAmount(0));
                              await handlePreview(null, { paymentStatus: newStatus, paidAmount: 0 });
                            } else {
                              await handlePreview(null, { paymentStatus: newStatus });
                            }
                          } finally {
                            setActionInProgress(false);
                          }
                        }}
                        disabled={actionInProgress}
                        style={{ margin: 0, accentColor: '#ffc107' }}
                      />
                      <span style={{ 
                        fontWeight: '600', 
                        color: paymentStatus === 'partially_paid' ? '#856404' : '#6c757d', 
                        fontSize: '14px',
                        letterSpacing: '0.2px'
                      }}>
                        Partially Paid
                      </span>
                    </label>
                  </div>

                  {/* Amount Paid Now & Due Date (required for partial payment) */}
                  {paymentStatus === 'partially_paid' && (
                    <>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      minWidth: '200px'
                    }}>
                      <label style={{ 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        color: '#495057',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Amount Paid
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#6c757d',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}>₹</span>
                        <input
                          type="number"
                          min="0"
                          max={previewData.grandTotal || previewData.total}
                          value={amountPaidLocalValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setAmountPaidLocalValue('');
                              dispatch(setPaidAmount(0));
                              if (paidAmountDebounceRef.current) {
                                clearTimeout(paidAmountDebounceRef.current);
                                paidAmountDebounceRef.current = null;
                              }
                              return;
                            }
                            if (!/^\d+$/.test(val)) return;
                            if (val.length > 1 && val.startsWith('0')) return;
                            setAmountPaidLocalValue(val);
                            if (paidAmountDebounceRef.current) clearTimeout(paidAmountDebounceRef.current);
                            paidAmountDebounceRef.current = setTimeout(() => {
                              const maxAmt = Math.round(previewData.grandTotal || previewData.total || 0);
                              const amt = Math.min(Math.max(0, parseInt(val) || 0), maxAmt);
                              dispatch(setPaidAmount(amt));
                              setAmountPaidLocalValue(amt === 0 ? '' : String(amt));
                              handlePreview(null, { paymentStatus: 'partially_paid', paidAmount: amt });
                              paidAmountDebounceRef.current = null;
                            }, 1000);
                          }}
                          onKeyDown={(e) => {
                            if (['+', '-', '*', '/', 'e', 'E', '.', ','].includes(e.key)) {
                              e.preventDefault();
                            }
                            if (e.key === 'Enter') {
                              e.target.blur();
                            }
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#ced4da';
                            e.target.style.boxShadow = 'none';
                            const parsed = parseInt(amountPaidLocalValue, 10);
                            if (amountPaidLocalValue === '' || isNaN(parsed)) return;
                            const maxAmt = Math.round(previewData.grandTotal || previewData.total || 0);
                            const finalAmount = Math.min(Math.max(0, parsed), maxAmt);
                            if (finalAmount !== paidAmount) dispatch(setPaidAmount(finalAmount));
                            setAmountPaidLocalValue(finalAmount === 0 ? '' : String(finalAmount));
                          }}
                          disabled={actionInProgress}
                          style={{
                            padding: '9px 10px 9px 28px',
                            fontSize: '14px',
                            fontWeight: '600',
                            border: '1px solid #ced4da',
                            borderRadius: '8px',
                            backgroundColor: actionInProgress ? '#f8f9fa' : '#ffffff',
                            width: '100%',
                            color: '#212529',
                            transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
                          }}
                          placeholder="0.00"
                          onFocus={(e) => {
                            e.target.style.borderColor = '#007bff';
                            e.target.style.boxShadow = '0 0 0 0.2rem rgba(0, 123, 255, 0.25)';
                          }}
                        />
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: '#6c757d',
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '2px'
                      }}>
                        <span>Total: <strong style={{ color: '#212529' }}>₹{(() => {
                          const grandTotal = previewData.grandTotal || previewData.total || 0;
                          return Math.round(grandTotal).toFixed(2);
                        })()}</strong></span>
                        {paidAmount > 0 && (
                          <span style={{ color: '#dc3545', fontWeight: '600' }}>
                            Due: ₹{(() => {
                              const grandTotal = previewData.grandTotal || previewData.total || 0;
                              const roundedGrandTotal = Math.round(grandTotal);
                              const roundedPaidAmount = Math.round(paidAmount || 0);
                              return Math.max(0, roundedGrandTotal - roundedPaidAmount).toFixed(2);
                            })()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '180px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '600', color: '#495057', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Due Date <span style={{ color: '#dc3545' }}>*</span>
                      </label>
                      <input
                        type="date"
                        value={dueDateForPartial || ''}
                        onChange={(e) => setDueDateForPartial(e.target.value)}
                        required
                        style={{ padding: '9px 10px', fontSize: '14px', border: '1px solid #ced4da', borderRadius: '8px', width: '100%' }}
                      />
                    </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Action Buttons at Bottom */}
            {!previewData.transactionId && (
              <div style={{ 
                display: 'flex', 
                gap: '15px', 
                marginTop: '20px',
                marginBottom: '30px',
                paddingTop: '15px',
                paddingBottom: '20px',
                borderTop: '2px solid #e9ecef',
                width: '100%'
              }}>
                <button 
                  onClick={handleBackToEditClick}
                  className="btn btn-secondary"
                  disabled={isProcessing}
                  aria-disabled={isProcessing}
                  aria-label="Go back to edit the bill"
                  tabIndex={isProcessing ? -1 : 0}
                  style={{
                    flex: '1 1 auto',
                    padding: '12px 28px',
                    fontSize: '15px',
                    fontWeight: '600',
                    minWidth: '150px'
                  }}
                >
                  Back to Edit
                </button>
                <button 
                  onClick={handleSubmitClick}
                  className="btn btn-success"
                  disabled={isProcessing || previewStale}
                  aria-disabled={isProcessing || previewStale}
                  aria-label={previewStale ? 'Please generate bill preview first' : (loading.submit ? 'Processing sale transaction' : 'Confirm and submit sale')}
                  tabIndex={(isProcessing || previewStale) ? -1 : 0}
                  style={{
                    flex: '1 1 auto',
                    padding: '12px 28px',
                    fontSize: '15px',
                    fontWeight: '600',
                    minWidth: '150px',
                    opacity: previewStale ? 0.6 : 1,
                    cursor: previewStale ? 'not-allowed' : 'pointer'
                  }}
                  title={previewStale ? 'Please generate bill preview first. Changes detected - preview needs to be regenerated.' : ''}
                >
                  {loading.submit ? (
                    <>
                      <div style={{ 
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid #fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        marginRight: '8px'
                      }}></div>
                      Processing...
                    </>
                  ) : previewStale ? (
                    'Generate Preview First'
                  ) : (
                    'Confirm Sale'
                  )}
                </button>
              </div>
            )}
            </div>
            
            {previewData.transactionId && (
              <div className="payment-section" style={{
                background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
                border: '2px solid #28a745',
                boxShadow: '0 4px 16px rgba(40, 167, 69, 0.2)',
                marginTop: '20px',
                marginBottom: '100px',
                padding: '25px',
                paddingBottom: '60px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px', 
                  marginBottom: '25px',
                  paddingBottom: '20px',
                  borderBottom: '2px solid #28a745'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
                  }}>
                    ✅
                  </div>
                  <div>
                    <h3 style={{ 
                      margin: 0, 
                      color: '#155724', 
                      fontSize: '24px', 
                      fontWeight: '700',
                      letterSpacing: '-0.5px'
                    }}>
                      Transaction Completed Successfully
                    </h3>
                    <p style={{ 
                      margin: '8px 0 0 0', 
                      color: '#155724', 
                      fontSize: '15px',
                      fontWeight: '500'
                    }}>
                      📄 Bill Number: <strong style={{ fontSize: '16px' }}>{previewData.billNumber || 'N/A'}</strong>
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '20px',
                  padding: '25px',
                  paddingBottom: '30px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '1px solid #c3e6cb',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    padding: '15px',
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                    borderRadius: '10px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6c757d', 
                      marginBottom: '8px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Payment Status
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: '#155724',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {previewData.paymentStatus === 'fully_paid' ? '✓ Fully Paid' : '⚡ Partially Paid'}
                    </div>
                  </div>
                  <div style={{
                    padding: '15px',
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                    borderRadius: '10px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6c757d', 
                      marginBottom: '8px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Invoice Amount
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: '#2c3e50'
                    }}>
                      ₹{(previewData.total || 0).toFixed(2)}
                    </div>
                  </div>
                  {(previewData.previousBalancePaid || 0) > 0 && (
                    <div style={{
                      padding: '15px',
                      background: 'linear-gradient(135deg, #fff3cd 0%, #ffffff 100%)',
                      borderRadius: '10px',
                      border: '1px solid #ffeaa7'
                    }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#856404', 
                        marginBottom: '8px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Previous Balance Paid
                      </div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: '700', 
                        color: '#e65100'
                      }}>
                        +₹{(previewData.previousBalancePaid || 0).toFixed(2)}
                      </div>
                    </div>
                  )}
                  <div style={{
                    padding: '15px',
                    background: 'linear-gradient(135deg, #d4edda 0%, #ffffff 100%)',
                    borderRadius: '10px',
                    border: '1px solid #c3e6cb'
                  }}>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#155724', 
                      marginBottom: '8px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Amount Paid
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: '#28a745'
                    }}>
                      ₹{(paymentStatus === 'partially_paid' ? (paidAmount || 0) : (previewData.paidAmount || 0)).toFixed(2)}
                    </div>
                  </div>
                  <div style={{
                    padding: '15px',
                    background: ((previewData.grandTotal || previewData.total || 0) - (paymentStatus === 'partially_paid' ? (paidAmount || 0) : (previewData.paidAmount || 0))) > 0 
                      ? 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)'
                      : 'linear-gradient(135deg, #d4edda 0%, #ffffff 100%)',
                    borderRadius: '10px',
                    border: ((previewData.grandTotal || previewData.total || 0) - (paymentStatus === 'partially_paid' ? (paidAmount || 0) : (previewData.paidAmount || 0))) > 0 
                      ? '1px solid #fecaca'
                      : '1px solid #c3e6cb'
                  }}>
                    <div style={{ 
                      fontSize: '12px', 
                      color: ((previewData.grandTotal || previewData.total || 0) - (paymentStatus === 'partially_paid' ? (paidAmount || 0) : (previewData.paidAmount || 0))) > 0 ? '#721c24' : '#155724', 
                      marginBottom: '8px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Balance Due
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: '700', 
                      color: ((previewData.grandTotal || previewData.total || 0) - (paymentStatus === 'partially_paid' ? (paidAmount || 0) : (previewData.paidAmount || 0))) > 0 ? '#dc3545' : '#28a745'
                    }}>
                      ₹{((previewData.grandTotal || previewData.total || 0) - (paymentStatus === 'partially_paid' ? (paidAmount || 0) : (previewData.paidAmount || 0))).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            </div>
            </div>
          )}
            </div>

            {/* Right panel - fixed like Dashboard, rendered via portal */}
            {createPortal(
            <aside className="sell-item-right-panel">
              <div className="right-panel-section">
                <div className="right-panel-label">Actions</div>
                <button onClick={isTransactionComplete ? handleNewSaleClick : handleBackToEditClick} className="btn btn-secondary right-panel-btn" disabled={isProcessing}>
                  {isTransactionComplete ? 'New Sale' : 'Back to Edit'}
                </button>
                {isTransactionComplete && (
                  <>
                    <button onClick={handlePrintClick} className="btn btn-primary right-panel-btn" disabled={printDisabled || printClicked || isProcessing}>
                      {printClicked ? 'Printing...' : 'Print'}
                    </button>
                    <button onClick={handleDownloadPDFClick} className="btn btn-success right-panel-btn" disabled={!previewData.transactionId || isProcessing}>
                      Download PDF
                    </button>
                  </>
                )}
                {!isTransactionComplete && (
                  <>
                    <button onClick={async () => { if (isProcessing || !previewStale) return; setActionInProgress(true); try { await handlePreview(); toast.success('✅ Bill preview updated'); } finally { setActionInProgress(false); } }} className="btn btn-primary right-panel-btn" disabled={isProcessing || !previewStale}>
                      {previewStale ? 'Update Preview' : 'Preview Updated'}
                    </button>
                    <button onClick={handleSubmitClick} className="btn btn-success right-panel-btn" disabled={isProcessing || previewStale}>
                      {loading.submit ? 'Processing...' : previewStale ? 'Generate Preview First' : 'Confirm Sale'}
                    </button>
                  </>
                )}
                {isTransactionComplete && (
                  <div className="right-panel-badge success">Sale Confirmed</div>
                )}
              </div>
              {!previewData.transactionId && (
                <div className="right-panel-section">
                  <div className="right-panel-label">Payment</div>
                  <label className="right-panel-checkbox">
                    <input type="checkbox" checked={withGst} onChange={async (e) => { if (actionInProgress || previewLoading) return; setActionInProgress(true); try { await handlePreview(e.target.checked); } finally { setActionInProgress(false); } }} disabled={previewLoading || actionInProgress} />
                    Include GST
                  </label>
                  <div className="right-panel-radio-group">
                    <label className={`right-panel-radio-option ${paymentStatus === 'fully_paid' ? 'selected' : ''}`}>
                      <input type="radio" name="payStatus" checked={paymentStatus === 'fully_paid'} onChange={async () => { if (actionInProgress) return; setActionInProgress(true); try { dispatch(setPaymentStatus('fully_paid')); await handlePreview(null, { paymentStatus: 'fully_paid' }); } finally { setActionInProgress(false); } }} disabled={actionInProgress} />
                      <span>Fully Paid</span>
                    </label>
                                        <label className={`right-panel-radio-option ${paymentStatus === 'partially_paid' ? 'partial-selected' : ''}`}>
                      <input type="radio" name="payStatus" checked={paymentStatus === 'partially_paid'} onChange={async () => { if (actionInProgress) return; setActionInProgress(true); try { dispatch(setPaymentStatus('partially_paid')); dispatch(setPaidAmount(0)); await handlePreview(null, { paymentStatus: 'partially_paid', paidAmount: 0 }); } finally { setActionInProgress(false); } }} disabled={actionInProgress} />
                      <span>Partially Paid</span>
                    </label>
                  </div>
                  {paymentStatus === 'partially_paid' && (
                    <>
                    <div className="right-panel-section">
                      <div className="right-panel-label">Amount Paid (₹)</div>
                      <input
                        type="number"
                        className="right-panel-input"
                        min="0"
                        max={previewData.grandTotal || previewData.total}
                        value={amountPaidLocalValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setAmountPaidLocalValue('');
                            dispatch(setPaidAmount(0));
                            if (paidAmountDebounceRef.current) {
                              clearTimeout(paidAmountDebounceRef.current);
                              paidAmountDebounceRef.current = null;
                            }
                            return;
                          }
                          if (!/^\d+$/.test(val)) return;
                          setAmountPaidLocalValue(val);
                          if (paidAmountDebounceRef.current) clearTimeout(paidAmountDebounceRef.current);
                          paidAmountDebounceRef.current = setTimeout(() => {
                            const maxAmt = Math.round(previewData.grandTotal || previewData.total || 0);
                            const amt = Math.min(Math.max(0, parseInt(val) || 0), maxAmt);
                            dispatch(setPaidAmount(amt));
                            setAmountPaidLocalValue(amt === 0 ? '' : String(amt));
                            handlePreview(null, { paymentStatus: 'partially_paid', paidAmount: amt });
                            paidAmountDebounceRef.current = null;
                          }, 1000);
                        }}
                        onBlur={() => {
                          const parsed = parseInt(amountPaidLocalValue, 10);
                          if (amountPaidLocalValue === '' || isNaN(parsed)) return;
                          const maxAmt = Math.round(previewData.grandTotal || previewData.total || 0);
                          const finalAmount = Math.min(Math.max(0, parsed), maxAmt);
                          if (finalAmount !== paidAmount) dispatch(setPaidAmount(finalAmount));
                          setAmountPaidLocalValue(finalAmount === 0 ? '' : String(finalAmount));
                        }}
                        placeholder="0"
                      />
                    </div>
                    <div className="right-panel-section">
                      <div className="right-panel-label">Due Date <span style={{ color: '#dc3545' }}>*</span></div>
                      <input
                        type="date"
                        className="right-panel-input"
                        value={dueDateForPartial || ''}
                        onChange={(e) => setDueDateForPartial(e.target.value)}
                      />
                    </div>
                    </>
                  )}
                </div>
              )}
              <div className="right-panel-section">
                <div className="right-panel-label">Summary</div>
                <div className="summary-row"><span>Cart Amount</span><span>₹{(previewData.total || 0).toFixed(2)}</span></div>
                {(() => {
                  const totalDiscount = (previewData.items || []).reduce((s, i) => s + (parseFloat(i.itemDiscount) || 0), 0);
                  return totalDiscount > 0 ? (
                    <div className="summary-row"><span>Total discount</span><span>-₹{totalDiscount.toFixed(2)}</span></div>
                  ) : null;
                })()}
                {(previewData.previousBalance || 0) > 0 && <div className="summary-row"><span>Previous Balance</span><span>+₹{(previewData.previousBalance || 0).toFixed(2)}</span></div>}
                <div className="summary-row"><span>Grand Total</span><span>₹{Math.round(previewData.grandTotal || previewData.total || 0).toFixed(2)}</span></div>
                <div className="summary-row"><span>Amount Paid</span><span>₹{Math.round(paymentStatus === 'partially_paid' ? (paidAmount || 0) : (previewData.paidAmount || previewData.grandTotal || 0)).toFixed(2)}</span></div>
                <div className="summary-row"><span>Balance Due</span><span>₹{(Math.max(0, Math.round(previewData.grandTotal || previewData.total || 0) - Math.round(paymentStatus === 'partially_paid' ? (paidAmount || 0) : (previewData.paidAmount || previewData.grandTotal || 0)))).toFixed(2)}</span></div>
              </div>
            </aside>,
            document.body
            )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <TransactionLoader
        isLoading={loading.submit || actionInProgress || previewLoading}
        message={loading.submit ? 'Processing sale...' : previewLoading ? 'Processing preview...' : 'Processing...'}
      />
      <div className="sell-item">
        <div className="sell-item-wrapper">
          <div className="sell-item-main">
            <h2>Create New Sale</h2>

            {/* Sticky Header Section - Professional Design */}
            <div className="card sticky-search-section">
          {/* Attendant & Nozzle at the beginning — recorded with sale and in reports */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
              <label>Attendant</label>
              <select
                value={selectedAttendantId || ''}
                onChange={(e) => dispatch(setSelectedAttendant(e.target.value ? parseInt(e.target.value, 10) : null))}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
              >
                <option value="">— Select Attendant —</option>
                {(attendants || []).filter(a => !a.is_archived).map(a => (
                  <option key={a.id} value={a.id}>{a.name || `Attendant ${a.id}`}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: '160px' }}>
              <label>Nozzle</label>
              <select
                value={selectedNozzleId || ''}
                onChange={(e) => dispatch(setSelectedNozzle(e.target.value ? parseInt(e.target.value, 10) : null))}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
              >
                <option value="">— Select Nozzle —</option>
                {(nozzles || []).filter(n => !n.is_archived).map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Seller Selection */}
          <div className="form-group">
            <label>Select Seller Party *</label>
            <div className="search-wrapper" style={{ position: 'relative' }}>
              <input
                ref={sellerSearchInputRef}
                type="text"
                placeholder="Search seller party by name, mobile, or address..."
                value={sellerSearchQuery}
                onChange={(e) => {
                  // Store the raw value (with spaces) for display, but trim for filtering
                  dispatch(setSellerSearchQuery(e.target.value));
                  if (!e.target.value.trim()) {
                    dispatch(setSelectedSeller(''));
                  }
                }}
                onFocus={() => {
                  if (sellerSearchQuery) {
                    dispatch(setShowSellerSuggestions(true));
                  }
                }}
                required
              />
              {selectedSeller && sellerInfo && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dispatch(setSelectedSeller(''));
                    dispatch(setSellerSearchQuery(''));
                    dispatch(setShowSellerSuggestions(false));
                    // Refocus input after clearing
                    setTimeout(() => {
                      if (sellerSearchInputRef.current) {
                        sellerSearchInputRef.current.focus();
                      }
                    }, 0);
                  }}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: '#999',
                    padding: '5px 10px',
                    zIndex: 10,
                    lineHeight: '1'
                  }}
                  title="Clear seller selection"
                  onMouseDown={(e) => {
                    // Prevent input from losing focus when clicking clear button
                    e.preventDefault();
                  }}
                >
                  ×
                </button>
              )}
              {showSellerSuggestions && filteredSellerParties.length > 0 && (
                <div className="suggestions" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredSellerParties.map(party => (
                    <div
                      key={party.id}
                      className="suggestion-item"
                      onClick={() => {
                        dispatch(selectSellerParty(party));
                        dispatch(setShowSellerSuggestions(false));
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <span style={{ fontWeight: '600' }}>{party.party_name}</span>
                      {party.mobile_number && (
                        <span style={{ fontSize: '12px', color: '#6c757d', whiteSpace: 'nowrap' }}>
                          📱 {party.mobile_number}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {sellerSearchQuery.trim() && filteredSellerParties.length === 0 && sellerParties.length > 0 && (
                <div className="suggestions" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000 }}>
                  <div className="suggestion-item">No seller party found</div>
                </div>
              )}
            </div>
            {loading.sellerParties ? (
              <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                Fetching seller parties...
              </p>
            ) : errors.sellerParties ? (
              <p style={{ color: '#ff6b6b', fontSize: '14px', marginTop: '5px' }}>
                {errors.sellerParties}
              </p>
            ) : sellerParties.length === 0 ? (
              <p style={{ color: '#ff6b6b', fontSize: '14px', marginTop: '5px' }}>
                No seller parties found. Please <Link to="/add-seller-party">add a seller party</Link> first.
              </p>
            ) : null}
          </div>

          {/* Seller Info Display */}
          {sellerInfo && (
            <div className="seller-info" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '15px',
              marginTop: '15px',
              padding: '15px',
              backgroundColor: '#f9f9f9',
              borderRadius: '5px'
            }}>
              <div><strong>Name:</strong> {sellerInfo.party_name}</div>
              <div><strong>Mobile:</strong> {sellerInfo.mobile_number || 'N/A'}</div>
              <div><strong>Address:</strong> {sellerInfo.address || 'N/A'}</div>
              {sellerInfo.gst_number && <div><strong>GST Number:</strong> {sellerInfo.gst_number}</div>}
              <div><strong>Balance Amount:</strong> ₹{parseFloat(sellerInfo.balance_amount || 0).toFixed(2)}</div>
              <div><strong>Paid Amount:</strong> ₹{parseFloat(sellerInfo.paid_amount || 0).toFixed(2)}</div>
              <div><strong>Due Date:</strong> {sellerInfo.due_date ? new Date(sellerInfo.due_date).toLocaleDateString('en-IN') : 'Not set'}</div>
            </div>
          )}

            </div>

          {/* Selected Items Section - Professional Cart Design */}
          {selectedSeller && (
            <div className="card">
              <div className="selected-items">
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '20px',
                  paddingBottom: '15px',
                  borderBottom: '1px solid #e1e8ed'
                }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#333' }}>
                    Selected Items ({selectedItems.length})
                  </h3>
                  {selectedItems.length > 0 && (
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear all items from the cart?')) {
                          selectedItems.forEach(item => dispatch(removeItem(item.item_id)));
                          toast.info('All items cleared');
                          setTimeout(() => {
                            itemSearchInputRef.current?.focus?.({ preventScroll: true });
                          }, 100);
                        }
                      }}
                      className="btn btn-danger"
                      style={{ padding: '8px 16px', fontSize: '13px', background: '#dc3545', border: 'none' }}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                <div className="table-responsive-container">
                  <table className="table">
                    <thead style={{ backgroundColor: '#34495e', color: '#ffffff' }}>
                      <tr>
                        <th style={{ backgroundColor: '#34495e', color: '#ffffff', textAlign: 'center', padding: '14px 18px', fontWeight: '600', fontSize: '13px', width: '60px' }}>S.No</th>
                        <th style={{ backgroundColor: '#34495e', color: '#ffffff', padding: '14px 18px', fontWeight: '600', fontSize: '13px' }}>Product Name</th>
                        <th style={{ backgroundColor: '#34495e', color: '#ffffff', textAlign: 'right', padding: '14px 18px', fontWeight: '600', fontSize: '13px' }}>Sale Rate</th>
                        <th style={{ backgroundColor: '#34495e', color: '#ffffff', textAlign: 'center', padding: '14px 18px', fontWeight: '600', fontSize: '13px' }}>Quantity</th>
                        <th style={{ backgroundColor: '#34495e', color: '#ffffff', textAlign: 'center', padding: '14px 18px', fontWeight: '600', fontSize: '13px', width: '120px' }}>Discount (₹/qty)</th>
                        <th style={{ backgroundColor: '#34495e', color: '#ffffff', textAlign: 'right', padding: '14px 18px', fontWeight: '600', fontSize: '13px' }}>Total</th>
                        <th style={{ backgroundColor: '#34495e', color: '#ffffff', textAlign: 'center', padding: '14px 18px', fontWeight: '600', fontSize: '13px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map((item, index) => {
                        const availableQty = item.available_quantity || 0;
                        const quantity = item.quantity === '' ? 0 : parseInt(item.quantity) || 0;
                        const isOverStock = quantity > availableQty;
                        return (
                          <tr key={item.item_id} className={isOverStock ? 'over-stock-row' : ''}>
                            <td style={{ textAlign: 'center', fontWeight: '600', color: '#2c3e50', verticalAlign: 'middle' }}>
                              {index + 1}
                            </td>
                            <td>
                              <div style={{ fontWeight: '600', color: '#2c3e50' }}>{item.product_name}</div>
                              {item.brand && <div style={{ fontSize: '12px', color: '#6c757d' }}>{item.brand}</div>}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.sale_rate ?? ''}
                                onChange={(e) => dispatch(updateItemSaleRate({ itemId: item.item_id, saleRate: e.target.value }))}
                                onBlur={() => { if (previewDirty && handlePreviewRef.current) handlePreviewRef.current(); }}
                                style={{ width: '90px', textAlign: 'right', padding: '4px 8px', fontWeight: '600' }}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="number"
                                min="0"
                                value={item.quantity === '' ? '' : item.quantity}
                                onChange={(e) => handleUpdateQuantity(item.item_id, e.target.value)}
                                onBlur={(e) => {
                                  const isPetrolDiesel = item.product_code === 'PETROL-001' || item.product_code === 'DIESEL-001';
                                  const val = e.target.value;
                                  if (isPetrolDiesel && (val === '' || parseInt(val, 10) === 0)) {
                                    dispatch(updateItemQuantity({ itemId: item.item_id, quantity: 0 }));
                                    return;
                                  }
                                  if (val === '' || parseInt(val, 10) <= 0) {
                                    handleUpdateQuantity(item.item_id, '1');
                                  }
                                }}
                                className={isOverStock ? 'over-stock-input error' : ''}
                                style={{ width: '80px', textAlign: 'center' }}
                              />
                              {isOverStock && <div className="stock-warning">Max: {availableQty}</div>}
                              {!isOverStock && availableQty > 0 && <div className="stock-info">{availableQty} left</div>}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="number"
                                placeholder="0"
                                step="0.01"
                                min="0"
                                value={quantity > 0 && (item.discount || 0) > 0 ? ((item.discount || 0) / quantity) : ''}
                                onChange={(e) => {
                                  const v = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                  dispatch(updateItemDiscount({ itemId: item.item_id, discount: Math.max(0, v) * quantity, discountType: 'amount', discountPercentage: null }));
                                }}
                                className="discount-input"
                                title="Discount per quantity"
                              />
                              {item.min_sale_rate != null && (
                                <div style={{ marginTop: '4px', fontSize: '11px', color: '#6c757d' }} title="Minimum sale rate for this product">
                                  Min sale rate: ₹{parseFloat(item.min_sale_rate).toFixed(2)}
                                </div>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '700', color: '#2c3e50', fontSize: '15px' }}>
                              ₹{(() => {
                                const rate = parseFloat(item.sale_rate || 0);
                                const qty = parseInt(item.quantity || 0);
                                const disc = parseFloat(item.discount || 0);
                                const total = rate * qty;
                                return Math.max(0, total - disc).toFixed(2);
                              })()}
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                              <button
                                onClick={() => handleRemoveItem(item.item_id)}
                                className="remove-btn"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#dc3545',
                                  cursor: 'pointer',
                                  fontSize: '18px'
                                }}
                                title="Remove Item"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      
                      {/* Search Row */}
                      <tr className="table-search-row">
                        <td style={{ textAlign: 'center', fontWeight: '600', color: '#95a5a6' }}>
                          {selectedItems.length + 1}
                        </td>
                        <td colSpan="2" style={{ position: 'relative', zIndex: 10005 }}>
                          <div className="table-search-wrapper">
                            <input
                              type="text"
                              className="table-search-input"
                              placeholder="Type product name or brand to search..."
                              value={searchQuery}
                              ref={itemSearchInputRef}
                              onChange={(e) => {
                                dispatch(setSearchQuery(e.target.value));
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
                                    handleAddItemToCart(suggestedItems[activeSuggestionIndex]);
                                    dispatch(setSearchQuery(''));
                                    setActiveSuggestionIndex(-1);
                                    itemSearchInputRef.current?.focus();
                                  } else if (suggestedItems.length > 0) {
                                    handleAddItemToCart(suggestedItems[0]);
                                    dispatch(setSearchQuery(''));
                                    setActiveSuggestionIndex(-1);
                                    itemSearchInputRef.current?.focus();
                                  }
                                } else if (e.key === 'Escape') {
                                  dispatch(setSearchQuery(''));
                                  setActiveSuggestionIndex(-1);
                                }
                              }}
                            />
                              {searchQuery.trim().length >= 2 && (
                                <div className="table-suggestions">
                                  <div className="table-suggestions-header">
                                    <span>Product Suggestions</span>
                                    {loading.items && <div className="search-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>}
                                  </div>

                                  <div className="table-suggestions-body">
                                    {loading.items && suggestedItems.length === 0 && (
                                      <div className="search-loader-container">
                                        <div className="search-spinner"></div>
                                        <span>Searching inventory...</span>
                                      </div>
                                    )}

                                    {!loading.items && suggestedItems.length === 0 && (
                                      <div className="no-results-container">
                                        <div className="no-results-icon">🔍</div>
                                        <div>No products found for "{searchQuery}"</div>
                                      </div>
                                    )}

                                    {suggestedItems.map((item, idx) => {
                                      const isOutOfStock = (item.quantity || 0) <= 0;
                                      const isAlreadyInCart = selectedItems.some(cartItem => cartItem.item_id === item.id);
                                      const stockLevel = item.quantity || 0;
                                      const stockClass = stockLevel <= 0 ? 'none' : (stockLevel < 10 ? 'low' : 'good');
                                      const stockIcon = stockLevel <= 0 ? '🚫' : (stockLevel < 10 ? '⚠️' : '📦');

                                      return (
                                        <div
                                          key={item.id}
                                          className={`table-suggestion-item ${idx === activeSuggestionIndex ? 'active' : ''} ${isOutOfStock ? 'out-of-stock' : ''} ${isAlreadyInCart ? 'already-selected' : ''}`}
                                          onClick={() => {
                                            if (!isOutOfStock) {
                                              handleAddItemToCart(item);
                                              dispatch(setSearchQuery(''));
                                              setActiveSuggestionIndex(-1);
                                              itemSearchInputRef.current?.focus();
                                            } else {
                                              toast.warning('Product out of stock');
                                            }
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
                                            <div className="table-suggestion-rate">₹{parseFloat(item.sale_rate || 0).toFixed(2)}</div>
                                            {item.min_sale_rate != null && (
                                              <div style={{ fontSize: '10px', color: '#6c757d' }}>Min: ₹{parseFloat(item.min_sale_rate).toFixed(2)}</div>
                                            )}
                                            {isAlreadyInCart && <div style={{ fontSize: '10px', color: '#40c057', fontWeight: '800' }}>✓ SELECTED</div>}
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
                        <td colSpan="4">
                          <div style={{ color: '#95a5a6', fontSize: '13px', fontStyle: 'italic', paddingLeft: '10px' }}>
                            Start typing to add more items...
                          </div>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'right', fontSize: '16px', paddingRight: '20px' }}>
                          <strong>Cart Total:</strong>
                        </td>
                        <td style={{ fontWeight: '700', fontSize: '18px', color: '#2c3e50', textAlign: 'right' }}>
                          ₹{calculateTotal().toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Bottom Action buttons */}
                <div style={{ 
                  marginTop: '25px', 
                  display: 'flex', 
                  gap: '15px', 
                  alignItems: 'center',
                  padding: '18px',
                  background: '#f8f9fa',
                  borderRadius: '10px',
                  border: '1px solid #e1e8ed',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px',
                    padding: '8px 16px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e1e8ed'
                  }}>
                    <input
                      type="checkbox"
                      id="include-gst-bottom"
                      checked={withGst}
                      onChange={async (e) => {
                        if (previewLoading || actionInProgress) return;
                        const newWithGst = e.target.checked;
                        dispatch(setWithGst(newWithGst));
                        if (selectedItems.length > 0) {
                          setActionInProgress(true);
                          try { await handlePreview(newWithGst); } 
                          finally { setActionInProgress(false); }
                        }
                      }}
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                    <label htmlFor="include-gst-bottom" style={{ cursor: 'pointer', fontWeight: '500', fontSize: '14px', color: '#333' }}>
                      Include GST
                    </label>
                  </div>
                  <button 
                    onClick={async () => {
                      if (previewLoading || actionInProgress) return;
                      if (selectedItems.length === 0) { toast.error('Add at least one item'); return; }
                      setActionInProgress(true);
                      try { await handlePreview(); } 
                      finally { setActionInProgress(false); }
                    }} 
                    className="btn btn-primary" 
                    disabled={previewLoading || actionInProgress || selectedItems.length === 0}
                    style={{ padding: '12px 28px', fontSize: '15px', fontWeight: '600', minWidth: '180px' }}
                  >
                    {previewLoading ? 'Calculating...' : 'Preview Bill'}
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>


          {/* Right panel - fixed like Dashboard, rendered via portal */}
          {createPortal(
          <aside className="sell-item-right-panel">
            {sellerInfo && (
              <div className="right-panel-section">
                <div className="right-panel-label">Seller / Party</div>
                <div className="right-panel-card">
                  <div className="right-panel-card-title">{sellerInfo.party_name}</div>
                  {sellerInfo.mobile_number && <div className="right-panel-card-meta">📱 {sellerInfo.mobile_number}</div>}
                  <div className="right-panel-card-balance">Balance: ₹{parseFloat(sellerInfo.balance_amount || 0).toFixed(2)}</div>
                </div>
              </div>
            )}
            <div className="right-panel-section">
              <div className="right-panel-label">Cart Summary</div>
              <div className="summary-row">
                <span>Items</span>
                <span>{selectedItems.length}</span>
              </div>
              <div className="summary-row">
                <span>Cart Total</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            <div className="right-panel-section">
              <button
                type="button"
                onClick={() => {
                  if (itemSearchInputRef.current) {
                    itemSearchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => itemSearchInputRef.current?.focus(), 300);
                  }
                }}
                className="btn btn-secondary right-panel-btn"
              >
                Add more items
              </button>
            </div>
            {selectedItems.length > 0 && (
              <>
                <div className="right-panel-section">
                  <label className="right-panel-checkbox">
                    <input
                      type="checkbox"
                      checked={withGst}
                      onChange={async (e) => {
                        if (previewLoading || actionInProgress) return;
                        const newWithGst = e.target.checked;
                        dispatch(setWithGst(newWithGst));
                        if (previewData && selectedItems.length > 0) {
                          setActionInProgress(true);
                          try {
                            await handlePreview(newWithGst);
                          } finally {
                            setActionInProgress(false);
                          }
                        }
                      }}
                      disabled={previewLoading || actionInProgress}
                    />
                    Include GST
                  </label>
                </div>
                <div className="right-panel-section">
                  <button
                    onClick={async () => {
                      if (previewLoading || actionInProgress) return;
                      setActionInProgress(true);
                      try {
                        await handlePreview();
                      } finally {
                        setActionInProgress(false);
                      }
                    }}
                    className="btn btn-primary right-panel-btn"
                    disabled={previewLoading || actionInProgress}
                  >
                    {previewLoading ? (
                      <>
                        <span className="right-panel-spinner" />
                        Calculating...
                      </>
                    ) : (
                      'Preview Bill'
                    )}
                  </button>
                </div>
              </>
            )}
          </aside>,
          document.body
          )}
      {/* Success Modal - Rendered using Portal to ensure it appears above all content */}
      {/* Show modal immediately after successful API response on the preview page */}
      {showSuccessModal && successModalData && successModalData.transactionId && createPortal(
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              // Don't close on outside click - user must use buttons
            }
          }}
        >
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: '700px', 
              width: '90%',
              maxHeight: '90vh', 
              overflowY: 'auto',
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#fff' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  backgroundColor: '#28a745', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}>✓</span>
                Transaction Completed Successfully
              </h3>
              <button className="modal-close" onClick={() => {
                setShowSuccessModal(false);
                setSuccessModalData(null);
              }}>×</button>
            </div>
            
            <div className="modal-body" style={{ padding: '20px' }}>
              {/* Bill Number */}
              <div style={{ textAlign: 'center', marginBottom: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>Bill Number</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>{successModalData.billNumber}</div>
              </div>

              {/* Transaction Summary */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '16px', fontWeight: '600' }}>Transaction Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Payment Status */}
                  <div style={{
                    padding: '15px',
                    background: 'linear-gradient(135deg, #d4edda 0%, #ffffff 100%)',
                    borderRadius: '10px',
                    border: '1px solid #c3e6cb'
                  }}>
                    <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Payment Status
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#28a745', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {successModalData.paymentStatus === 'fully_paid' ? '✓ Fully Paid' : '⚡ Partially Paid'}
                    </div>
                  </div>

                  {/* Cart Amount */}
                  <div style={{
                    padding: '15px',
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                    borderRadius: '10px',
                    border: '1px solid #dee2e6'
                  }}>
                    <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Cart Amount
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#212529' }}>
                      ₹{(successModalData.cartAmount || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* Previous Balance Paid */}
                  {successModalData.previousBalancePaid > 0 && (
                    <div style={{
                      padding: '15px',
                      background: 'linear-gradient(135deg, #fff5e6 0%, #ffffff 100%)',
                      borderRadius: '10px',
                      border: '1px solid #ffd89b'
                    }}>
                      <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Previous Balance Paid
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#e65100' }}>
                        +₹{(successModalData.previousBalancePaid || 0).toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Amount Paid */}
                  <div style={{
                    padding: '15px',
                    background: 'linear-gradient(135deg, #d4edda 0%, #ffffff 100%)',
                    borderRadius: '10px',
                    border: '1px solid #c3e6cb'
                  }}>
                    <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Amount Paid
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#28a745' }}>
                      ₹{(successModalData.amountPaid || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* Balance Due */}
                  <div style={{
                    padding: '15px',
                    background: (successModalData.balanceDue || 0) > 0 
                      ? 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)'
                      : 'linear-gradient(135deg, #d4edda 0%, #ffffff 100%)',
                    borderRadius: '10px',
                    border: (successModalData.balanceDue || 0) > 0 
                      ? '1px solid #fecaca'
                      : '1px solid #c3e6cb'
                  }}>
                    <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Balance Due
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: (successModalData.balanceDue || 0) > 0 ? '#dc3545' : '#28a745' }}>
                      ₹{(successModalData.balanceDue || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Party Information */}
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '16px', fontWeight: '600' }}>Party Information</h4>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase' }}>Party Name</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>{successModalData.partyName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase' }}>Mobile Number</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>{successModalData.partyMobile}</div>
                    </div>
                  </div>
                  {successModalData.partyEmail && successModalData.partyEmail !== 'N/A' && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase' }}>Email</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>{successModalData.partyEmail}</div>
                    </div>
                  )}
                  <div style={{ paddingTop: '12px', borderTop: '1px solid #dee2e6' }}>
                    <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase' }}>Current Balance</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: parseFloat(successModalData.currentBalance) >= 0 ? '#28a745' : '#dc3545' }}>
                      ₹{parseFloat(successModalData.currentBalance).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date */}
              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px', fontSize: '12px', color: '#6c757d' }}>
                Transaction Date: {successModalData.date}
              </div>
            </div>

            <div className="modal-footer" style={{ position: 'sticky', bottom: 0, backgroundColor: '#fff', borderTop: '1px solid #dee2e6', padding: '15px 20px', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                onClick={handleNewSale}
                className="btn btn-primary"
                disabled={downloadingPDF || printingPDF || downloadingReceipt}
                style={{ minWidth: '120px' }}
              >
                🆕 New Sale
              </button>
              <button
                onClick={() => handleDownloadPDF(successModalData.transactionId, successModalData.billNumber)}
                className="btn btn-primary"
                disabled={downloadingPDF || printingPDF || downloadingReceipt}
                style={{ minWidth: '140px' }}
              >
                {downloadingPDF ? '⏳ Downloading...' : '📥 Download PDF'}
              </button>
              <button
                onClick={() => handlePrintPDF(successModalData.transactionId)}
                className="btn btn-success"
                disabled={downloadingPDF || printingPDF || downloadingReceipt}
                style={{ minWidth: '120px' }}
              >
                {printingPDF ? '⏳ Opening...' : '🖨️ Print PDF'}
              </button>
              <button
                onClick={() => handleDownloadReceipt(successModalData.transactionId, successModalData.billNumber)}
                className="btn btn-secondary"
                disabled={downloadingPDF || printingPDF || downloadingReceipt}
                style={{ minWidth: '140px' }}
              >
                {downloadingReceipt ? '⏳ Downloading...' : '📥 Download Receipt'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </Layout>
  );
};

export default SellItem;
