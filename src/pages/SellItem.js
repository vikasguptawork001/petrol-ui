import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import { useToast } from '../context/ToastContext';
import TransactionLoader from '../components/TransactionLoader';
import { numberToWords } from '../utils/numberToWords';
import { getLocalDateString, formatInIndiaTime, formatDateInIndia } from '../utils/dateUtils';
import { unitOptionsForItem } from '../utils/saleUnits';
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
  updatePreviewItemUnit,
  removePreviewItem,
  updateItemDiscount,
  updateItemUnit,
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
  const [amountPaidLocalValue, setAmountPaidLocalValue] = useState('');
  const [attendants, setAttendants] = useState([]);
  const [nozzles, setNozzles] = useState([]);
  const [dueDateForPartial, setDueDateForPartial] = useState('');
  const [isSellerInputFocused, setIsSellerInputFocused] = useState(false);
  const [sellerSuggestPos, setSellerSuggestPos] = useState(null);
  const [itemSuggestPos, setItemSuggestPos] = useState(null);

  const minFutureDueDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return getLocalDateString(d);
  })();

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

  const sellerDropdownOpen =
    showSellerSuggestions &&
    (filteredSellerParties.length > 0 ||
      (sellerSearchQuery.trim() && filteredSellerParties.length === 0 && sellerParties.length > 0));

  const itemDropdownOpen = searchQuery.trim().length >= 2;

  useLayoutEffect(() => {
    if (!sellerDropdownOpen || !sellerSearchInputRef.current) {
      setSellerSuggestPos(null);
      return;
    }
    const update = () => {
      const el = sellerSearchInputRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setSellerSuggestPos({ left: r.left, top: r.bottom + 4, width: r.width });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [sellerDropdownOpen]);

  useLayoutEffect(() => {
    if (!itemDropdownOpen || !itemSearchInputRef.current) {
      setItemSuggestPos(null);
      return;
    }
    const update = () => {
      const el = itemSearchInputRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setItemSuggestPos({ left: r.left, top: r.bottom + 4, width: r.width });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [itemDropdownOpen]);

  useEffect(() => {
    dispatch(setWithGst(false));
  }, [dispatch]);

  // Ensure seller/creditor suggestions show correctly even if data loads after focus.
  useEffect(() => {
    if (!isSellerInputFocused) return;
    if (!sellerParties || sellerParties.length === 0) return;
    const q = (sellerSearchQuery || '').trim();
    if (!q) {
      dispatch(setShowSellerSuggestions(true));
      return;
    }
    dispatch(setShowSellerSuggestions((filteredSellerParties || []).length > 0));
  }, [
    isSellerInputFocused,
    sellerParties,
    sellerSearchQuery,
    filteredSellerParties,
    dispatch
  ]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerInfo?.id, sellerInfo?.due_date]);

  useEffect(() => {
    if (!selectedSeller) return;
    const sid = Number(selectedSeller);
    if (!sellerInfo || Number(sellerInfo.id) !== sid) {
      dispatch(fetchSellerInfo(sid)).catch((error) => {
        console.error('Error fetching seller info:', error);
        toast.error('Failed to load seller information');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeller, sellerInfo, dispatch, toast]);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedQuery = searchQuery.trim();
      setDebouncedSearchQuery(trimmedQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const trimmedQuery = debouncedSearchQuery.trim();
    if (trimmedQuery.length >= 2) {
      dispatch(searchItems({ query: trimmedQuery, includePurchaseRate: false }));
    } else {
      dispatch(clearSuggestedItems());
    }
  }, [debouncedSearchQuery, dispatch]);

  useEffect(() => {
    if (paymentStatus === 'partially_paid') {
      setAmountPaidLocalValue(paidAmount === 0 || paidAmount === null || paidAmount === undefined ? '' : String(paidAmount));
    } else {
      setAmountPaidLocalValue('');
    }
  }, [paymentStatus, paidAmount]);

  useEffect(() => {
    return () => {
      if (paidAmountDebounceRef.current) {
        clearTimeout(paidAmountDebounceRef.current);
        paidAmountDebounceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showSellerSuggestions &&
        !event.target.closest('.search-wrapper') &&
        !event.target.closest('.seller-suggestions-portal')
      ) {
        dispatch(setShowSellerSuggestions(false));
      }
    };
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (showSellerSuggestions) dispatch(setShowSellerSuggestions(false));
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
      if ((item.quantity || 0) <= 0) {
        toast.warning(`"${item.product_name || item.item_name}" is out of stock and cannot be added`);
        return;
      }
      dispatch(addItemToCart(item));
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

  const isPreviewStale = () => {
    if (!previewData) return true;
    if (previewLoading) return true;
    return !!previewDirty;
  };

  const requirePumpStaff = () => {
    const hasAtt =
      selectedAttendantId !== null &&
      selectedAttendantId !== undefined &&
      String(selectedAttendantId).trim() !== '';
    const hasNz =
      selectedNozzleId !== null &&
      selectedNozzleId !== undefined &&
      String(selectedNozzleId).trim() !== '';
    if (!hasAtt || !hasNz) {
      toast.error('Please select both Attendant and Nozzle before billing.');
      return false;
    }
    return true;
  };

  const handlePreview = async (overrideWithGst = null, overrides = {}, options = {}) => {
    const { silent = false } = options;
    if (!selectedSeller) {
      toast.warning('Please select a seller party first');
      return;
    }
    if (!requirePumpStaff()) return;
    if (selectedItems.length === 0) {
      toast.warning('Please add at least one item to the cart');
      return;
    }
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
    const belowMinRateItems = [];
    for (const item of selectedItems) {
      const saleRate = parseFloat(item.sale_rate) || 0;
      const minRate = item.min_sale_rate != null ? parseFloat(item.min_sale_rate) : null;
      const discount = parseFloat(item.discount || 0);
      const quantity = parseInt(item.quantity) || 1;
      const effectiveRate = saleRate - (discount / quantity);
      if (minRate !== null && effectiveRate < minRate) {
        belowMinRateItems.push(`${item.product_name} (Rate: ₹${effectiveRate.toFixed(2)} < Min: ₹${minRate.toFixed(2)})`);
      }
    }
    if (belowMinRateItems.length > 0) {
      toast.error(`❌ Price after discount cannot be less than minimum sale rate for: ${belowMinRateItems.join(', ')}`);
      return;
    }
    if (hasStockIssue) return;

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
    const previousBalance = parseFloat(currentSellerInfo?.balance_amount || 0);
    const hasPreviousBalance = previousBalance > 0;
    const effectivePayPreviousBalance = hasPreviousBalance;
    const effectivePreviousBalancePaid = hasPreviousBalance ? previousBalance : 0;
    const effectivePaymentStatus = overrides.paymentStatus !== undefined ? overrides.paymentStatus : paymentStatus;
    let effectivePaidAmount = overrides.paidAmount !== undefined ? overrides.paidAmount : paidAmount;
    if (effectivePaymentStatus === 'partially_paid' && (effectivePaidAmount === undefined || effectivePaidAmount === null || effectivePaidAmount === '')) {
      effectivePaidAmount = 0;
    }

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
      if (overrideWithGst !== null) dispatch(setWithGst(currentWithGst));
      if (!silent) toast.success('Bill preview generated successfully');
    } catch (error) {
      console.error('Error in handlePreview:', error);
      toast.error('❌ ' + (error || 'Error calculating preview'));
    }
  };
  handlePreviewRef.current = handlePreview;

  useEffect(() => {
    if (!previewData || !previewDirty || previewLoading || actionInProgress || !selectedSeller || selectedItems.length === 0) return;
    const timer = setTimeout(() => {
      if (handlePreviewRef.current) handlePreviewRef.current(null, {}, { silent: true });
    }, 700);
    return () => clearTimeout(timer);
  }, [previewData, previewDirty, previewLoading, actionInProgress, selectedSeller, selectedItems.length]);

  const handleSubmit = async () => {
    if (loading.submit || actionInProgress) {
      toast.warning('Transaction is already being processed...');
      return;
    }
    let currentPreviewData = previewData;
    if (!currentPreviewData) {
      toast.info('Generating bill preview before confirming sale...');
      try {
        await handlePreview();
        await new Promise(resolve => setTimeout(resolve, 100));
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
    if (isPreviewStale() && currentPreviewData) {
      toast.info('Updating preview and confirming sale...');
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
      toast.warning('Please generate bill preview first.');
      return;
    }
    try {
      if (!requirePumpStaff()) return;
      if (!currentPreviewData.items || currentPreviewData.items.length === 0) {
        toast.error('❌ Please add at least one item to the sale');
        return;
      }
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
      if (hasIssues) return;

      if (!currentPreviewData.paymentStatus) {
        toast.error('❌ Please select a payment status (Fully Paid or Partially Paid)');
        return;
      }
      if (currentPreviewData.paymentStatus === 'partially_paid') {
        const paidAmt = Math.round(paidAmount || 0);
        const grandTotal = currentPreviewData.grandTotal || currentPreviewData.total || 0;
        const roundedGrandTotal = Math.round(grandTotal);
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

      toast.info('Processing your sale transaction...');
      const currentPaidAmount = currentPreviewData.paymentStatus === 'partially_paid'
        ? Math.round(paidAmount || 0)
        : Math.round(currentPreviewData.paidAmount || 0);
      const updatedPreviewData = { ...currentPreviewData, paidAmount: currentPaidAmount };
      const dueDateToSend = currentPreviewData.paymentStatus === 'partially_paid' ? (dueDateForPartial || '').trim() : null;
      const result = await dispatch(submitSale({ previewData: updatedPreviewData, selectedSeller, dueDate: dueDateToSend })).unwrap();
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
        const invoiceTotal = currentPreviewData.total || 0;
        const previousBalancePaid = currentPreviewData.previousBalancePaid || 0;
        const grandTotalBeforeRounding = invoiceTotal + previousBalancePaid;
        const roundedGrandTotal = Math.round(grandTotalBeforeRounding);
        const roundedPaidAmount = Math.round(currentPaidAmount);
        const balanceDue = Math.max(0, roundedGrandTotal - roundedPaidAmount);
        const modalData = {
          transactionId: result.transactionId,
          billNumber: result.billNumber || 'N/A',
          paymentStatus: currentPreviewData.paymentStatus,
          cartAmount: invoiceTotal,
          previousBalancePaid: previousBalancePaid,
          amountPaid: roundedPaidAmount,
          balanceDue: balanceDue,
          grandTotal: roundedGrandTotal,
          partyName: updatedSellerInfo?.party_name || sellerInfo?.party_name || 'N/A',
          partyMobile: updatedSellerInfo?.mobile_number || sellerInfo?.mobile_number || 'N/A',
          partyCheque: updatedSellerInfo?.cheque_number || sellerInfo?.cheque_number || '',
          partyBank: updatedSellerInfo?.bank_name || sellerInfo?.bank_name || '',
          currentBalance: updatedSellerInfo?.balance_amount || sellerInfo?.balance_amount || 0,
          date: formatInIndiaTime(new Date())
        };
        setSuccessModalData(modalData);
        setShowSuccessModal(true);
        toast.success(`Sale completed successfully. Bill number: ${result.billNumber || 'N/A'}`);
      } else {
        toast.success('Sale completed successfully.');
        dispatch(resetAfterSale());
      }
    } catch (error) {
      const errorMessage = error || 'Unknown error occurred';
      console.error('Sale submission error:', error);
      toast.error('❌ Transaction failed: ' + errorMessage);
      setShowSuccessModal(false);
      setSuccessModalData(null);
    }
  };

  const handlePrint = async () => {
    if (printDisabled || printClicked) {
      toast.warning('Please confirm the sale first to enable printing');
      return;
    }
    if (!previewData || !previewData.transactionId) {
      toast.warning('Please complete the sale first to print PDF');
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
      toast.warning('Please complete the sale first to download PDF');
      return;
    }
    setDownloadingPDF(true);
    try {
      toast.info('Preparing PDF download...');
      const response = await apiClient.get(config.api.billPdf(txId), {
        responseType: 'blob', timeout: 30000
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
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('❌ Error downloading PDF: ' + (error.response?.data?.error || error.message || 'Unknown error'));
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handlePrintPDF = async (transactionId) => {
    const txId = transactionId || previewData?.transactionId;
    if (!txId) {
      toast.warning('Please complete the sale first to print PDF');
      return;
    }
    setPrintingPDF(true);
    try {
      toast.info('Preparing PDF for printing...');
      const response = await apiClient.get(config.api.billPdf(txId), {
        responseType: 'blob', timeout: 30000
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
          toast.success('Print dialog opened');
          setTimeout(() => window.URL.revokeObjectURL(url), 2000);
        } catch (printError) {
          console.error('Print error:', printError);
          toast.info('PDF opened in new window. Please use the browser\'s print button.');
          window.URL.revokeObjectURL(url);
        }
      }, 1000);
    } catch (error) {
      console.error('Error fetching PDF for print:', error);
      toast.error('❌ Error loading PDF for printing: ' + (error.response?.data?.error || error.message || 'Unknown error'));
    } finally {
      setPrintingPDF(false);
    }
  };

  const handleDownloadReceipt = async (transactionId, billNumber) => {
    const txId = transactionId || previewData?.transactionId;
    const billNo = billNumber || previewData?.billNumber;
    if (!txId) {
      toast.warning('Please complete the sale first to download receipt');
      return;
    }
    setDownloadingReceipt(true);
    try {
      toast.info('Preparing receipt download...');
      const response = await apiClient.get(config.api.billPdf(txId), {
        responseType: 'blob', timeout: 30000
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
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('❌ Error downloading receipt: ' + (error.response?.data?.error || error.message || 'Unknown error'));
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
    if (actionInProgress) return;
    if (!previewData || !previewData.items.some((i) => i.item_id === itemId)) return;
    setActionInProgress(true);
    try {
      dispatch(removePreviewItem(itemId));
      toast.success('Item removed from preview');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleBackToEdit = async () => {
    if (previewData) {
      if (previewData.selectedSeller) {
        dispatch(setSelectedSeller(previewData.selectedSeller));
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
      if (previewData.previousBalancePaid !== undefined) {
        dispatch(setPreviousBalancePaid(previewData.previousBalancePaid));
        dispatch(setPayPreviousBalance(previewData.previousBalancePaid > 0));
      }
    }
    dispatch(clearPreview());
  };

  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const billPreviewRef = useRef(null);

  useEffect(() => {
    const isProcessing = loading.submit || actionInProgress;
    if (isProcessing) {
      document.body.classList.add('transaction-loading');
    } else {
      document.body.classList.remove('transaction-loading');
    }
    return () => document.body.classList.remove('transaction-loading');
  }, [loading.submit, actionInProgress]);

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
    dispatch(resetSellItem());
    dispatch(clearPreview());
    dispatch(fetchSellerParties());
    setActionInProgress(false);
    setShowSuccessModal(false);
    setSuccessModalData(null);
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

  // ─── PREVIEW VIEW ────────────────────────────────────────────────────────────
  if (previewData) {
    const isTransactionComplete = !!previewData.transactionId;
    const isProcessing = loading.submit || actionInProgress || previewLoading;
    const previewStale = isPreviewStale();
    const effectivePayStatus = previewData?.paymentStatus || paymentStatus;
    const billDueDateRaw =
      previewData?.due_date ||
      previewData?.dueDate ||
      (effectivePayStatus === 'partially_paid' ? dueDateForPartial : '');
    const billDueDateDisplay = billDueDateRaw
      ? formatDateInIndia(`${billDueDateRaw}T00:00:00`)
      : '';

    return (
      <Layout>
        <TransactionLoader
          isLoading={loading.submit || actionInProgress || previewLoading}
          message={loading.submit ? 'Processing sale...' : previewLoading ? 'Processing preview...' : 'Processing...'}
        />
        <div>
        <div className="sell-item">
          <div className="sell-item-wrapper">
            <div className="sell-item-main">
              {/* Preview header */}
              <div className="preview-header" style={{ marginBottom: '20px' }}>
                <div>
                  <h2>Bill Preview</h2>
                  {previewData.billNumber && (
                    <div style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#9aaebf', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Invoice #: <strong style={{ color: '#eef2f8' }}>{previewData.billNumber}</strong></span>
                      <button
                        onClick={handleCopyBillNumber}
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '11px', minHeight: 'auto', minWidth: 'auto' }}
                        title="Copy bill number"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {previewLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', padding: '40px', textAlign: 'center', width: '100%', background: '#0a0f16' }}>
                  <div style={{ display: 'inline-block', width: '48px', height: '48px', border: '4px solid rgba(245, 154, 48, 0.15)', borderTop: '4px solid var(--pp-orange, #f59a30)', borderRadius: '50%', animation: 'si-spin 0.8s linear infinite', marginBottom: '20px' }}></div>
                  <p style={{ marginTop: '0', fontSize: '15px', color: '#9aaebf' }}>Calculating preview...</p>
                </div>
              )}
              {previewData && !previewLoading && (
                <div style={{ position: 'relative' }}>
                  <div
                    ref={billPreviewRef}
                    className="bill-preview"
                    id="bill-print-content"
                    tabIndex={0}
                    style={{ outline: 'none', overflow: 'visible', position: 'relative', paddingBottom: '120px', marginBottom: '80px' }}
                  >
                    {/* Seller Info Card */}
                    <div className="bp-seller-card">
                      <div className="bp-invoice-row">
                        <div className="bp-seller-name">{previewData.seller?.party_name || '-'}</div>
                        <div className="bp-invoice-info">
                          {previewData.billNumber && (
                            <span>Invoice No.: <strong>{previewData.billNumber}</strong></span>
                          )}
                          <span>Date: <strong>{formatDateInIndia(new Date())}</strong></span>
                          {billDueDateDisplay && (
                            <span>Next due date: <strong>{billDueDateDisplay}</strong></span>
                          )}
                        </div>
                      </div>
                      <div className="bp-seller-meta">
                        {previewData.seller?.mobile_number && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {previewData.seller.mobile_number}
                          </div>
                        )}
                        {previewData.seller?.gst_number && (
                          <div className="bp-seller-meta-divider" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#6c7f8f' }}>GSTIN:</span>
                            <span style={{ fontFamily: 'monospace', color: '#eef2f8' }}>{previewData.seller.gst_number}</span>
                          </div>
                        )}
                        {previewData.seller?.address && (
                          <div className="bp-seller-meta-divider" style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#9aaebf' }}>{previewData.seller.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* ── Bill Table ── */}
                    <div className="bp-table-scroll">
                      <table className={`bill-preview-table ${previewData.withGst ? 'has-gst' : 'no-gst'}`}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'center', width: '36px' }}>S.N.</th>
                            <th style={{ textAlign: 'left', width: '80px' }}>Description</th>
                            {previewData.withGst && <th style={{ textAlign: 'center', width: '70px' }}>Code</th>}
                            {/* Qty — narrowed */}
                            <th style={{ textAlign: 'center', width: '50px' }}>Qty.</th>
                            {/* Unit — narrowed */}
                            <th style={{ textAlign: 'center', width: '40px' }}>Unit</th>
                            {/* Price (was MRP) — narrowed */}
                            <th style={{ textAlign: 'right', width: '72px' }}>Price</th>
                            <th style={{ textAlign: 'center', width: '64px' }} title="Discount per unit of quantity">Discount</th>
                            {/* Sale Price (was Price) — narrowed */}
                            <th style={{ textAlign: 'right', width: '72px' }}>Sale Price</th>
                            {previewData.withGst && <th style={{ textAlign: 'center', width: '62px' }}>Tax%</th>}
                            <th style={{ textAlign: 'right', width: '82px' }}>Amount(₹)</th>
                            {!previewData.transactionId && <th style={{ textAlign: 'center', width: '48px' }}>Del</th>}
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
                              <tr key={item.item_id} className={isOverStock ? 'bp-overstock-row' : ''}>
                                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                <td className="bp-name-col">{item.product_name}</td>
                                {previewData.withGst && (
                                  <td style={{ textAlign: 'center' }}>{item.product_code || '-'}</td>
                                )}
                                {/* Qty cell — class bp-qty-cell for CSS (GST on/off column index differs) */}
                                <td className="bp-qty-cell">
                                  {previewData.transactionId ? (
                                    <span style={{ fontWeight: '600', color: '#eef2f8' }}>{quantity}</span>
                                  ) : (
                                    <div className="bp-qty-cell-inner">
                                      <input
                                        type="number"
                                        step="any"
                                        value={item.quantity === '' ? '' : item.quantity}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val !== '' && !/^\d+$/.test(val)) return;
                                          updateQuantityInPreview(item.item_id, val);
                                        }}
                                        onKeyDown={(e) => {
                                          if (['+', '-', '*', '/', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault();
                                        }}
                                        onBlur={(e) => {
                                          const val = e.target.value;
                                          if (val === '' || parseInt(val) <= 0) updateQuantityInPreview(item.item_id, '1');
                                        }}
                                        className={isOverStock ? 'bp-overstock-input' : ''}
                                        style={{ width: '40px' }}
                                        min="1"
                                      />
                                      <span className={isOverStock ? 'bp-avail-line bp-avail-line--warn' : 'bp-avail-line'}>
                                        Available: {availableQty}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                {/* Unit */}
                                <td style={{ textAlign: 'center', color: '#9aaebf', fontSize: '11px' }}>
                                  {!previewData.transactionId ? (
                                    <>
                                      <input
                                        list={`bp-unit-dl-${item.item_id}`}
                                        value={item.unit || 'PCS'}
                                        onChange={(e) => dispatch(updatePreviewItemUnit({ itemId: item.item_id, unit: e.target.value }))}
                                        onBlur={() => { if (handlePreviewRef.current) handlePreviewRef.current(); }}
                                        maxLength={14}
                                        style={{ width: '72px', padding: '2px 4px', fontSize: '11px', background: '#0f151f', border: '1px solid #2a3340', borderRadius: '4px', color: '#eef2f8' }}
                                        title="Unit from product master; type any custom unit"
                                      />
                                      <datalist id={`bp-unit-dl-${item.item_id}`}>
                                        {unitOptionsForItem(item.unit).map((opt) => (
                                          <option key={opt} value={opt} />
                                        ))}
                                      </datalist>
                                    </>
                                  ) : (
                                    item.unit || 'PCS'
                                  )}
                                </td>
                                {/* Price (editable sale_rate input) */}
                                <td style={{ textAlign: 'right' }} className="bp-price-cell">
                                  {!previewData.transactionId ? (
                                    <div className="bp-price-cell-wrap">
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.sale_rate ?? ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const rate = parseFloat(val);
                                          if (!isNaN(rate) && item.min_sale_rate != null && rate < item.min_sale_rate) {
                                            toast.warning(`Sale rate cannot be less than minimum sale rate (₹${parseFloat(item.min_sale_rate).toFixed(2)})`);
                                          }
                                          dispatch(updatePreviewItemSaleRate({ itemId: item.item_id, saleRate: val }));
                                        }}
                                        onBlur={() => { if (handlePreviewRef.current) handlePreviewRef.current(); }}
                                        style={{ width: '56px' }}
                                      />
                                      <div className="bp-min-rate">
                                        Min: ₹{item.min_sale_rate != null ? parseFloat(item.min_sale_rate).toFixed(2) : '0.00'}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bp-price-cell-wrap">
                                      <span style={{ fontFamily: 'monospace', color: '#eef2f8' }}>₹{parseFloat(item.sale_rate || 0).toFixed(2)}</span>
                                      <div className="bp-min-rate">
                                        Min: ₹{item.min_sale_rate != null ? parseFloat(item.min_sale_rate).toFixed(2) : '0.00'}
                                      </div>
                                    </div>
                                  )}
                                </td>
                                {/* Disc(₹/q) */}
                                <td style={{ textAlign: 'center' }}>
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
                                        const val = parseFloat(inputVal);
                                        const effectiveRate = parseFloat(item.sale_rate) - val;
                                        if (item.min_sale_rate != null && effectiveRate < item.min_sale_rate) {
                                          toast.error(`Discounted price (₹${effectiveRate.toFixed(2)}) cannot be less than minimum sale rate (₹${parseFloat(item.min_sale_rate).toFixed(2)})`);
                                          return;
                                        }
                                        dispatch(updatePreviewItemDiscount({ itemId: item.item_id, discount: Math.max(0, val) * q, discountType: 'amount', discountPercentage: null }));
                                      }}
                                      style={{ width: '46px' }}
                                      placeholder="0"
                                      className="discount-input"
                                      title="Discount per quantity"
                                    />
                                  ) : (
                                    <span style={{ fontFamily: 'monospace', color: '#9aaebf', fontSize: '11px' }}>₹{(parseFloat(item.discount) || 0).toFixed(2)}</span>
                                  )}
                                </td>
                                {/* Sale Price (effectiveRate) */}
                                <td style={{ textAlign: 'right' }}>
                                  <span style={{ fontFamily: 'monospace', color: '#eef2f8' }}>₹{parseFloat(item.effectiveRate || item.sale_rate || 0).toFixed(2)}</span>
                                </td>
                                {previewData.withGst && (
                                  <td style={{ textAlign: 'center', color: '#9aaebf', fontSize: '11px' }}>{parseFloat(item.tax_rate || 0).toFixed(2)}%</td>
                                )}
                                <td className="bp-amount-col">₹{parseFloat(item.itemTotalAfterDiscount || itemTotal || 0).toFixed(2)}</td>
                                {!previewData.transactionId && (
                                  <td style={{ textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      className="bp-remove-x-btn"
                                      onClick={() => handleRemoveFromPreview(item.item_id)}
                                      title="Remove row"
                                      aria-label={`Remove ${item.product_name}`}
                                    >
                                      ×
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          {(() => {
                            const totalQty = previewData.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
                            const cartAmount = previewData.total || 0;
                            const totalDiscountAmount = previewData.items.reduce((sum, item) => sum + (parseFloat(item.itemDiscount) || 0), 0);
                            const previousBalancePaid = previewData.previousBalancePaid || 0;
                            const grandTotalBeforeRounding = cartAmount + previousBalancePaid;
                            const roundedOff = Math.round(grandTotalBeforeRounding) - grandTotalBeforeRounding;
                            const finalGrandTotal = Math.round(grandTotalBeforeRounding);
                            const taxableAmt = previewData.subtotal || 0;
                            const cgstAmt = previewData.withGst ? (previewData.taxAmount || 0) / 2 : 0;
                            const sgstAmt = previewData.withGst ? (previewData.taxAmount || 0) / 2 : 0;
                            const totalTax = previewData.taxAmount || 0;
                            const rawPaidAmount = paymentStatus === 'partially_paid' ? (paidAmount || 0) : (previewData.paidAmount || 0);
                            const roundedPaidAmount = Math.round(rawPaidAmount);
                            const balanceDue = Math.max(0, finalGrandTotal - roundedPaidAmount);
                            // colspan depends on GST + action col
                            const colsLeft = previewData.withGst ? 8 : 7;
                            const colsAll = previewData.withGst ? (previewData.transactionId ? 9 : 10) : (previewData.transactionId ? 8 : 9);
                            return (
                              <>
                                <tr>
                                  <td colSpan={colsLeft} style={{ textAlign: 'right' }}>Cart Amount:</td>
                                  <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#eef2f8', fontWeight: 700 }}>₹{cartAmount.toFixed(2)}</td>
                                  {!previewData.transactionId && <td></td>}
                                </tr>
                                {totalDiscountAmount > 0 && (
                                  <tr>
                                    <td colSpan={colsLeft} style={{ textAlign: 'right', color: '#2bc48f' }}>Total Discount:</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#2bc48f' }}>-₹{totalDiscountAmount.toFixed(2)}</td>
                                    {!previewData.transactionId && <td></td>}
                                  </tr>
                                )}
                                {Math.abs(roundedOff) > 0.0001 && (
                                  <tr>
                                    <td colSpan={colsLeft} style={{ textAlign: 'right' }}>Rounded Off ({roundedOff > 0 ? '+' : '-'}):</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: roundedOff > 0 ? '#2bc48f' : '#e8593c' }}>
                                      {roundedOff > 0 ? '+' : ''}₹{Math.abs(roundedOff).toFixed(2)}
                                    </td>
                                    {!previewData.transactionId && <td></td>}
                                  </tr>
                                )}
                                <tr className="bp-grand-total-row">
                                  <td colSpan={previewData.withGst ? 3 : 2} style={{ textAlign: 'left' }}>
                                    Grand Total (Qty): {totalQty.toFixed(2)} PCS
                                  </td>
                                  <td colSpan={previewData.withGst ? 5 : 5} style={{ textAlign: 'right', fontSize: '15px', fontFamily: 'monospace' }}>
                                    Grand Total: ₹{finalGrandTotal.toFixed(2)}
                                  </td>
                                  {!previewData.transactionId && <td></td>}
                                </tr>
                                {previewData.withGst && totalTax > 0 && (
                                  <tr>
                                    <td colSpan={colsLeft} style={{ fontWeight: 700 }}>Tax Summary:</td>
                                    {!previewData.transactionId && <td></td>}
                                  </tr>
                                )}
                                {previewData.withGst && totalTax > 0 && (
                                  <tr>
                                    <td colSpan={2}>Taxable: <span style={{ fontFamily: 'monospace', color: '#eef2f8' }}>₹{taxableAmt.toFixed(2)}</span></td>
                                    <td>CGST: <span style={{ fontFamily: 'monospace', color: '#eef2f8' }}>₹{cgstAmt.toFixed(2)}</span></td>
                                    <td>SGST: <span style={{ fontFamily: 'monospace', color: '#eef2f8' }}>₹{sgstAmt.toFixed(2)}</span></td>
                                    <td colSpan={2} style={{ fontWeight: 700 }}>Total Tax: <span style={{ fontFamily: 'monospace', color: '#eef2f8' }}>₹{totalTax.toFixed(2)}</span></td>
                                    {!previewData.transactionId && <td></td>}
                                  </tr>
                                )}
                                {(previewData.previousBalance || 0) > 0 && (
                                  <tr>
                                    <td colSpan={colsLeft} style={{ textAlign: 'right', color: '#f59f00', fontWeight: 700 }}>Previous Balance:</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#f59f00' }}>+₹{(previewData.previousBalance || 0).toFixed(2)}</td>
                                    {!previewData.transactionId && <td></td>}
                                  </tr>
                                )}
                                <tr className="bp-paid-row">
                                  <td colSpan={colsLeft} style={{ textAlign: 'right', fontWeight: 700 }}>Amount Paid:</td>
                                  <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>₹{roundedPaidAmount.toFixed(2)}</td>
                                  {!previewData.transactionId && <td></td>}
                                </tr>
                                <tr className={balanceDue > 0 ? 'bp-balance-row-red' : 'bp-balance-row-green'}>
                                  <td colSpan={colsLeft} style={{ textAlign: 'right', fontWeight: 700 }}>Balance Due:</td>
                                  <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>₹{balanceDue.toFixed(2)}</td>
                                  {!previewData.transactionId && <td></td>}
                                </tr>
                                <tr className="bp-words-row">
                                  <td colSpan={colsAll}>
                                    <strong>Amount in Words:</strong>
                                    <span>{numberToWords(finalGrandTotal)} Only</span>
                                  </td>
                                </tr>
                              </>
                            );
                          })()}
                        </tfoot>
                      </table>
                    </div>{/* end bp-table-scroll */}
                    {/* Transaction complete summary */}
                    {previewData.transactionId && (
                      <div className="payment-section" style={{
                        background: 'linear-gradient(135deg, rgba(29,158,117,0.12) 0%, rgba(29,158,117,0.06) 100%)',
                        border: '1px solid rgba(29,158,117,0.35)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        marginTop: '20px', marginBottom: '60px', padding: '20px', borderRadius: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(29,158,117,0.3)' }}>
                          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #1d9e75 0%, #2bc48f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', boxShadow: '0 4px 12px rgba(29, 158, 117, 0.4)', flexShrink: 0 }}>OK</div>
                          <div>
                            <h3 style={{ margin: 0, color: '#2bc48f', fontSize: '20px', fontWeight: '700', letterSpacing: '-0.3px' }}>Transaction Completed Successfully</h3>
                            <p style={{ margin: '6px 0 0 0', color: '#9aaebf', fontSize: '14px', fontWeight: '500' }}>
                              Bill number: <strong style={{ fontSize: '15px', color: '#eef2f8' }}>{previewData.billNumber || 'N/A'}</strong>
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '20px', backgroundColor: '#1f2937', borderRadius: '12px', border: '1px solid #374151', marginBottom: '20px' }}>
                          {[
                            { label: 'Payment Status', value: previewData.paymentStatus === 'fully_paid' ? 'Fully paid' : 'Partially paid', color: '#2bc48f', bg: 'rgba(29,158,117,0.08)', border: 'rgba(29,158,117,0.25)' },
                            { label: 'Invoice Amount', value: `₹${(previewData.total || 0).toFixed(2)}`, color: '#eef2f8', bg: 'rgba(255,255,255,0.04)', border: '#2a3340' },
                          ].map((card, i) => (
                            <div key={i} style={{ padding: '14px', background: card.bg, borderRadius: '10px', border: `1px solid ${card.border}` }}>
                              <div style={{ fontSize: '11px', color: '#6c7f8f', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</div>
                              <div style={{ fontSize: '17px', fontWeight: '700', color: card.color, fontFamily: 'var(--pp-font-mono, monospace)' }}>{card.value}</div>
                            </div>
                          ))}
                          {(previewData.previousBalancePaid || 0) > 0 && (
                            <div style={{ padding: '14px', background: 'rgba(245,159,0,0.08)', borderRadius: '10px', border: '1px solid rgba(245,159,0,0.25)' }}>
                              <div style={{ fontSize: '11px', color: '#f59f00', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prev Balance Paid</div>
                              <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59f00', fontFamily: 'monospace' }}>+₹{(previewData.previousBalancePaid || 0).toFixed(2)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Right Panel — preview mode */}
          {createPortal(
            <aside className="sell-item-right-panel">
              <div className="right-panel-section">
                <div className="right-panel-label">Actions</div>
                {isTransactionComplete ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={handleNewSaleClick} className="btn btn-secondary right-panel-btn" disabled={isProcessing}>New Sale</button>
                    <button onClick={handlePrintClick} className="btn btn-primary right-panel-btn" disabled={printDisabled || printClicked || isProcessing}>
                      {printClicked ? 'Printing...' : 'Print'}
                    </button>
                    <button onClick={handleDownloadPDFClick} className="btn btn-success right-panel-btn" disabled={!previewData.transactionId || isProcessing}>Download PDF</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={handleBackToEditClick} className="btn btn-secondary right-panel-btn" disabled={isProcessing} style={{ flex: 1, padding: '8px', fontSize: '13px', margin: 0 }}>Back</button>
                      <button
                        onClick={async () => {
                          if (isProcessing || !previewStale) return;
                          setActionInProgress(true);
                          try { await handlePreview(); toast.success('Bill preview updated'); }
                          finally { setActionInProgress(false); }
                        }}
                        className="btn btn-primary right-panel-btn"
                        disabled={isProcessing || !previewStale}
                        style={{ flex: 1, padding: '8px', fontSize: '13px', margin: 0 }}
                      >
                        {previewStale ? 'Update' : 'Updated'}
                      </button>
                    </div>
                    <button onClick={handleSubmitClick} className="btn btn-success right-panel-btn" disabled={isProcessing || previewStale} style={{ margin: 0 }}>
                      {loading.submit ? 'Processing...' : previewStale ? 'Generate Preview First' : 'Confirm Sale'}
                    </button>
                  </div>
                )}
                {isTransactionComplete && <div className="right-panel-badge success">Sale Confirmed</div>}
              </div>
              {!previewData.transactionId && (
                <div className="right-panel-section">
                  <div className="right-panel-label">Payment</div>
                  <div className="right-panel-radio-group">
                    <label className={`right-panel-radio-option ${paymentStatus === 'fully_paid' ? 'selected' : ''}`}>
                      <input type="radio" name="payStatus" checked={paymentStatus === 'fully_paid'}
                        onChange={async () => {
                          if (actionInProgress) return;
                          setActionInProgress(true);
                          try { dispatch(setPaymentStatus('fully_paid')); await handlePreview(null, { paymentStatus: 'fully_paid' }); }
                          finally { setActionInProgress(false); }
                        }}
                        disabled={actionInProgress} />
                      <span>Fully Paid</span>
                    </label>
                    <label className={`right-panel-radio-option ${paymentStatus === 'partially_paid' ? 'partial-selected' : ''}`}>
                      <input type="radio" name="payStatus" checked={paymentStatus === 'partially_paid'}
                        onChange={async () => {
                          if (actionInProgress) return;
                          setActionInProgress(true);
                          try { dispatch(setPaymentStatus('partially_paid')); dispatch(setPaidAmount(0)); await handlePreview(null, { paymentStatus: 'partially_paid', paidAmount: 0 }); }
                          finally { setActionInProgress(false); }
                        }}
                        disabled={actionInProgress} />
                      <span>Partially Paid</span>
                    </label>
                  </div>
                  {paymentStatus === 'partially_paid' && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <div className="right-panel-section" style={{ flex: 1, marginBottom: 0 }}>
                        <div className="right-panel-label" style={{ fontSize: '12px' }}>Amount (₹)</div>
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
                              if (paidAmountDebounceRef.current) { clearTimeout(paidAmountDebounceRef.current); paidAmountDebounceRef.current = null; }
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
                          style={{ padding: '6px', fontSize: '13px' }}
                        />
                      </div>
                      <div className="right-panel-section" style={{ flex: 1, marginBottom: 0 }}>
                        <div className="right-panel-label" style={{ fontSize: '12px' }}>Due Date <span style={{ color: '#dc3545' }}>*</span></div>
                        <input
                          type="date"
                          className="right-panel-input"
                          value={dueDateForPartial || ''}
                          min={minFutureDueDate}
                          onChange={(e) => {
                            const selected = e.target.value;
                            if (!selected) {
                              setDueDateForPartial('');
                              return;
                            }
                            if (selected < minFutureDueDate) {
                              toast.error('❌ Due date must be a future date');
                              setDueDateForPartial('');
                              return;
                            }
                            setDueDateForPartial(selected);
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== 'Tab') e.preventDefault();
                          }}
                          onPaste={(e) => e.preventDefault()}
                          style={{ padding: '6px', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="right-panel-section">
                <div className="right-panel-label">Summary</div>
                <div className="summary-row"><span>Cart Amount</span><span>₹{(previewData.total || 0).toFixed(2)}</span></div>
                {(() => {
                  const totalDiscount = (previewData.items || []).reduce((s, i) => s + (parseFloat(i.itemDiscount) || 0), 0);
                  return totalDiscount > 0 ? <div className="summary-row"><span>Total Discount</span><span>-₹{totalDiscount.toFixed(2)}</span></div> : null;
                })()}
                {(previewData.previousBalance || 0) > 0 && <div className="summary-row"><span>Prev Balance</span><span>+₹{(previewData.previousBalance || 0).toFixed(2)}</span></div>}
                <div className="summary-row"><span>Grand Total</span><span>₹{Math.round(previewData.grandTotal || previewData.total || 0).toFixed(2)}</span></div>
                <div className="summary-row"><span>Amount Paid</span><span>₹{Math.round(paymentStatus === 'partially_paid' ? (paidAmount || 0) : (previewData.paidAmount || previewData.grandTotal || 0)).toFixed(2)}</span></div>
                <div className="summary-row"><span>Balance Due</span><span>₹{(Math.max(0, Math.round(previewData.grandTotal || previewData.total || 0) - Math.round(paymentStatus === 'partially_paid' ? (paidAmount || 0) : (previewData.paidAmount || previewData.grandTotal || 0)))).toFixed(2)}</span></div>
              </div>
            </aside>,
            document.body
          )}
        </div>
      </div>
    </Layout>
    );
  }
  // ─── CART / EDIT VIEW ────────────────────────────────────────────────────────
  return (
    <Layout>
      <TransactionLoader
        isLoading={loading.submit || actionInProgress || previewLoading}
        message={loading.submit ? 'Processing sale...' : previewLoading ? 'Processing preview...' : 'Processing...'}
      />
      <div className="sell-item">
        <div className="sell-item-wrapper">
          <div className="sell-item-main">
            <div className="pp-page-header" style={{ padding: '8px 12px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>⛽</span>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Create New Sale</h2>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>New customer transaction fuel bills</p>
            </div>
            {/* Sticky search / seller selection */}
            <div className="card sticky-search-section" style={{ padding: '8px 12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-start', marginBottom: '0' }}>
                {/* Attendant */}
                <div className="form-group" style={{ marginBottom: '8px', flex: '1 1 140px', maxWidth: '240px' }}>
                  <label>Attendant</label>
                  <select
                    value={selectedAttendantId || ''}
                    onChange={(e) => dispatch(setSelectedAttendant(e.target.value ? parseInt(e.target.value, 10) : null))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #2a3340', borderRadius: '8px' }}
                  >
                    <option value="">— Select Attendant —</option>
                    {(attendants || []).filter(a => !a.is_archived).map(a => (
                      <option key={a.id} value={a.id}>{a.name || `Attendant ${a.id}`}</option>
                    ))}
                  </select>
                </div>
                {/* Nozzle */}
                <div className="form-group" style={{ marginBottom: '8px', flex: '1 1 140px', maxWidth: '240px' }}>
                  <label>Nozzle</label>
                  <select
                    value={selectedNozzleId || ''}
                    onChange={(e) => dispatch(setSelectedNozzle(e.target.value ? parseInt(e.target.value, 10) : null))}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #2a3340', borderRadius: '8px' }}
                  >
                    <option value="">— Select Nozzle —</option>
                    {(nozzles || []).filter(n => !n.is_archived).map(n => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>
                {/* Seller Selection */}
                <div className="form-group" style={{ marginBottom: '8px', flex: '2 1 200px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Select Seller Party *</span>
                    {sellerInfo && (
                      <span style={{ fontSize: '13px', color: '#f59f00', fontWeight: '700' }}>
                        Balance: ₹{parseFloat(sellerInfo.balance_amount || 0).toFixed(2)}
                      </span>
                    )}
                  </label>
                  {/* FIX 1: Added overflow: 'visible' to search-wrapper */}
                  <div className="search-wrapper" style={{ position: 'relative', overflow: 'visible' }}>
                    <input
                      ref={sellerSearchInputRef}
                      type="text"
                      placeholder="Search party..."
                      value={sellerSearchQuery}
                      onChange={(e) => {
                        dispatch(setSellerSearchQuery(e.target.value));
                        if (!e.target.value.trim()) dispatch(setSelectedSeller(''));
                      }}
                      onFocus={() => {
                        setIsSellerInputFocused(true);
                        dispatch(setShowSellerSuggestions(true));
                      }}
                      onBlur={() => {
                        setIsSellerInputFocused(false);
                      }}
                      required
                    />
                    {selectedSeller && sellerInfo && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          dispatch(setSelectedSeller(''));
                          dispatch(setSellerSearchQuery(''));
                          dispatch(setShowSellerSuggestions(false));
                          setTimeout(() => { if (sellerSearchInputRef.current) sellerSearchInputRef.current.focus(); }, 0);
                        }}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#6c7f8f', padding: '5px 10px', zIndex: 10, lineHeight: '1' }}
                        title="Clear seller selection"
                        onMouseDown={(e) => e.preventDefault()}
                      >×</button>
                    )}
                    {sellerSuggestPos && sellerDropdownOpen && createPortal(
                      <div
                        className="suggestions seller-suggestions seller-suggestions-portal"
                        style={{
                          position: 'fixed',
                          left: sellerSuggestPos.left,
                          top: sellerSuggestPos.top,
                          width: sellerSuggestPos.width,
                          maxHeight: 'min(360px, 55vh)',
                          overflowY: 'auto',
                          zIndex: 20000,
                          boxSizing: 'border-box'
                        }}
                      >
                        {filteredSellerParties.length > 0 ? (
                          filteredSellerParties.map((party) => (
                            <div
                              key={party.id}
                              className="suggestion-item"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                dispatch(selectSellerParty(party));
                                dispatch(setShowSellerSuggestions(false));
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                            >
                              <span style={{ fontWeight: '600' }}>{party.party_name}</span>
                              {party.mobile_number && (
                                <span style={{ fontSize: '12px', color: '#6c7f8f', whiteSpace: 'nowrap' }}>{party.mobile_number}</span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="suggestion-item">No seller party found</div>
                        )}
                      </div>,
                      document.body
                    )}
                  </div>
                  {loading.sellerParties ? (
                    <p style={{ color: '#6c7f8f', fontSize: '13px', marginTop: '5px' }}>Fetching seller parties...</p>
                  ) : errors.sellerParties ? (
                    <p style={{ color: '#ff6b6b', fontSize: '14px', marginTop: '5px' }}>{errors.sellerParties}</p>
                  ) : sellerParties.length === 0 ? (
                    <p style={{ color: '#ff6b6b', fontSize: '14px', marginTop: '5px' }}>
                      No seller parties found. Please <Link to="/add-seller-party">add a seller party</Link> first.
                    </p>
                  ) : null}
                </div>
              </div>
              {/* Seller Info Compact */}
              {sellerInfo && (
                <div className="seller-info-compact" style={{ padding: '6px 10px', marginTop: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <strong style={{ color: '#f3f4f6' }}>{sellerInfo.party_name}</strong>
                  </div>
                  {sellerInfo.mobile_number && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid #374151', paddingLeft: '8px' }}>
                      {sellerInfo.mobile_number}
                    </div>
                  )}
                  {sellerInfo.due_date && (
                    <div style={{ borderLeft: '1px solid #374151', paddingLeft: '8px', color: '#e8593c' }}>
                      <span style={{ fontSize: '12px', marginRight: '4px' }}>Last Due:</span>
                      {formatDateInIndia(sellerInfo.due_date)}
                    </div>
                  )}
                  {sellerInfo.gst_number && (
                    <div style={{ borderLeft: '1px solid #374151', paddingLeft: '8px' }}>
                      <span style={{ fontFamily: 'monospace', color: '#f3f4f6' }}>{sellerInfo.gst_number}</span>
                    </div>
                  )}
                  <div style={{ borderLeft: '1px solid #374151', paddingLeft: '8px', color: '#f59f00', fontWeight: '800' }}>
                    ₹{parseFloat(sellerInfo.balance_amount || 0).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
            {/* Cart Table */}
            {selectedSeller && (
              <div className="card" style={{ padding: '8px 12px' }}>
                <div className="selected-items">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #1f2937' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#eef2f8', letterSpacing: '0.02em' }}>
                      SELECTED ITEMS <span style={{ color: '#6c7f8f', fontSize: '14px', fontWeight: '500' }}>({selectedItems.length})</span>
                    </h3>
                    {selectedItems.length > 0 && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to clear all items from the cart?')) {
                            selectedItems.forEach(item => dispatch(removeItem(item.item_id)));
                            toast.info('All items cleared');
                            setTimeout(() => { itemSearchInputRef.current?.focus?.({ preventScroll: true }); }, 100);
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
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'center', width: '44px', letterSpacing: '0.05em' }}>S.No</th>
                          <th style={{ letterSpacing: '0.05em' }}>PRODUCT</th>
                          <th style={{ textAlign: 'right', width: '100px', letterSpacing: '0.05em' }}>PRICE</th>
                          <th style={{ textAlign: 'center', width: '90px', letterSpacing: '0.05em' }}>QTY</th>
                          <th style={{ textAlign: 'center', width: '72px', letterSpacing: '0.05em' }}>UNIT</th>
                          <th style={{ textAlign: 'center', width: '120px', letterSpacing: '0.05em' }}>DISCOUNT</th>
                          <th style={{ textAlign: 'right', width: '110px', letterSpacing: '0.05em' }}>TOTAL</th>
                          <th style={{ textAlign: 'center', width: '50px', letterSpacing: '0.05em' }}>DEL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItems.map((item, index) => {
                          const availableQty = item.available_quantity || 0;
                          const quantity = item.quantity === '' ? 0 : parseInt(item.quantity) || 0;
                          const isOverStock = quantity > availableQty;
                          const saleRateVal = parseFloat(item.sale_rate || 0);
                          const discountVal = parseFloat(item.discount || 0);
                          const effectiveRate = saleRateVal - (quantity > 0 ? (discountVal / quantity) : 0);
                          const isUnderMinRate = item.min_sale_rate != null && effectiveRate < parseFloat(item.min_sale_rate);
                          return (
                            <tr key={item.item_id} className={isOverStock ? 'over-stock-row' : ''}>
                              <td style={{ textAlign: 'center', fontWeight: '600', color: '#9aaebf', verticalAlign: 'middle' }}>{index + 1}</td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <div style={{ fontWeight: '700', color: '#eef2f8', fontSize: '14px' }}>{item.product_name}</div>
                                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    {item.brand && <span style={{ fontSize: '11px', color: '#6c7f8f', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px' }}>{item.brand}</span>}
                                    {item.product_code && <span style={{ fontSize: '11px', color: '#6c7f8f', fontFamily: 'monospace' }}>#{item.product_code}</span>}
                                  </div>
                                </div>
                              </td>
                              {/* PRICE (was SALE RATE) */}
                              <td style={{ textAlign: 'right' }}>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.sale_rate ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const rate = parseFloat(val);
                                    if (!isNaN(rate) && item.min_sale_rate != null && rate < item.min_sale_rate) {
                                      toast.warning(`Sale rate cannot be less than minimum sale rate (₹${parseFloat(item.min_sale_rate).toFixed(2)})`);
                                    }
                                    dispatch(updateItemSaleRate({ itemId: item.item_id, saleRate: val }));
                                  }}
                                  onBlur={() => { if (previewDirty && handlePreviewRef.current) handlePreviewRef.current(); }}
                                  style={{ width: '75px', textAlign: 'right', padding: '4px 6px', fontWeight: '800', border: isUnderMinRate ? '1px solid #e8593c' : '1px solid #374151', backgroundColor: isUnderMinRate ? 'rgba(232,89,60,0.1)' : '#0a0f16', borderRadius: '4px', color: '#f3f4f6', fontSize: '12px' }}
                                />
                              </td>
                              {/* QTY */}
                              <td className="si-qty-cell">
                                <div className="si-qty-cell-inner">
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
                                      if (val === '' || parseInt(val, 10) <= 0) handleUpdateQuantity(item.item_id, '1');
                                    }}
                                    className={isOverStock ? 'over-stock-input error' : ''}
                                    style={{ width: '70px', textAlign: 'center' }}
                                  />
                                  {isOverStock && <div className="stock-warning">Max: {availableQty}</div>}
                                  {!isOverStock && availableQty > 0 && <div className="stock-info">{availableQty} left</div>}
                                </div>
                              </td>
                              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                <input
                                  list={`cart-unit-dl-${item.item_id}`}
                                  value={item.unit || 'PCS'}
                                  onChange={(e) => dispatch(updateItemUnit({ itemId: item.item_id, unit: e.target.value }))}
                                  onBlur={() => { if (previewDirty && handlePreviewRef.current) handlePreviewRef.current(); }}
                                  maxLength={14}
                                  style={{ width: '64px', padding: '4px 6px', fontSize: '11px', background: '#0a0f16', border: '1px solid #374151', borderRadius: '4px', color: '#e2e8f0' }}
                                  title="Unit from master; type a custom value if needed"
                                />
                                <datalist id={`cart-unit-dl-${item.item_id}`}>
                                  {unitOptionsForItem(item.unit).map((opt) => (
                                    <option key={opt} value={opt} />
                                  ))}
                                </datalist>
                              </td>
                              {/* DISCOUNT */}
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
                                  style={{ border: isUnderMinRate ? '2px solid #e8593c' : '1px solid #2a3340', backgroundColor: isUnderMinRate ? 'rgba(232,89,60,0.1)' : '#0f151f', borderRadius: '6px', color: '#eef2f8' }}
                                  title="Discount per quantity"
                                />
                                {item.min_sale_rate != null && (
                                  <div style={{ marginTop: '4px', fontSize: '11px', color: isUnderMinRate ? '#e8593c' : '#6c7f8f', fontWeight: isUnderMinRate ? '700' : '400' }} title="Minimum sale rate">
                                    Min: ₹{parseFloat(item.min_sale_rate).toFixed(2)}
                                  </div>
                                )}
                              </td>
                              {/* TOTAL */}
                              <td style={{ textAlign: 'right', fontWeight: '700', color: '#f59a30', fontSize: '14px', fontFamily: 'var(--pp-font-mono, monospace)' }}>
                                ₹{(() => {
                                  const rate = parseFloat(item.sale_rate || 0);
                                  const qty = parseInt(item.quantity || 0);
                                  const disc = parseFloat(item.discount || 0);
                                  return Math.max(0, rate * qty - disc).toFixed(2);
                                })()}
                              </td>
                              {/* DELETE */}
                              <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                <button
                                  onClick={() => handleRemoveItem(item.item_id)}
                                  className="remove-btn"
                                  style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '18px' }}
                                  title="Remove Item"
                                >
                                  <span style={{ fontSize: '13px', opacity: 0.8 }}>x</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {/* Search Row */}
                        <tr className="table-search-row">
                          <td style={{ textAlign: 'center', fontWeight: '600', color: '#6c7f8f' }}>{selectedItems.length + 1}</td>
                          <td colSpan="2" style={{ position: 'relative', zIndex: 10005 }}>
                            <div className="table-search-wrapper">
                              <input
                                type="text"
                                className="table-search-input"
                                placeholder="Quick add product..."
                                value={searchQuery}
                                ref={itemSearchInputRef}
                                style={{ padding: '4px 8px', height: '30px' }}
                                onChange={(e) => { dispatch(setSearchQuery(e.target.value)); setActiveSuggestionIndex(-1); }}
                                onKeyDown={(e) => {
                                  if (e.key === 'ArrowDown') { e.preventDefault(); setActiveSuggestionIndex(prev => Math.min(prev + 1, suggestedItems.length - 1)); }
                                  else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveSuggestionIndex(prev => Math.max(prev - 1, -1)); }
                                  else if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const target = activeSuggestionIndex >= 0 ? suggestedItems[activeSuggestionIndex] : suggestedItems[0];
                                    if (target) { handleAddItemToCart(target); dispatch(setSearchQuery('')); setActiveSuggestionIndex(-1); itemSearchInputRef.current?.focus(); }
                                  } else if (e.key === 'Escape') { dispatch(setSearchQuery('')); setActiveSuggestionIndex(-1); }
                                }}
                              />
                              {searchQuery.trim().length >= 2 && itemSuggestPos && createPortal(
                                <div
                                  className="table-suggestions item-suggestions item-suggestions-portal"
                                  style={{
                                    position: 'fixed',
                                    left: itemSuggestPos.left,
                                    top: itemSuggestPos.top,
                                    width: itemSuggestPos.width,
                                    maxHeight: 'min(360px, 55vh)',
                                    overflowY: 'auto',
                                    zIndex: 20000,
                                    boxSizing: 'border-box'
                                  }}
                                >
                                  <div className="table-suggestions-header">
                                    <span>Product Suggestions</span>
                                    {loading.items && <div className="search-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>}
                                  </div>
                                  <div className="table-suggestions-body">
                                    {loading.items && suggestedItems.length === 0 && (
                                      <div className="search-loader-container"><div className="search-spinner"></div><span>Searching inventory...</span></div>
                                    )}
                                    {!loading.items && suggestedItems.length === 0 && (
                                      <div className="no-results-container"><div className="no-results-icon" aria-hidden /><div>No products found for "{searchQuery}"</div></div>
                                    )}
                                    {suggestedItems.map((item, idx) => {
                                      const isOutOfStock = (item.quantity || 0) <= 0;
                                      const isAlreadyInCart = selectedItems.some(cartItem => cartItem.item_id === item.id);
                                      const stockLevel = item.quantity || 0;
                                      const stockClass = stockLevel <= 0 ? 'none' : (stockLevel < 10 ? 'low' : 'good');
                                      const stockLabel = stockLevel <= 0 ? 'Out' : stockLevel < 10 ? 'Low' : 'OK';
                                      return (
                                        <div
                                          key={item.id}
                                          className={`table-suggestion-item ${idx === activeSuggestionIndex ? 'active' : ''} ${isOutOfStock ? 'out-of-stock' : ''} ${isAlreadyInCart ? 'already-selected' : ''}`}
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => {
                                            if (!isOutOfStock) { handleAddItemToCart(item); dispatch(setSearchQuery('')); setActiveSuggestionIndex(-1); itemSearchInputRef.current?.focus(); }
                                            else toast.warning('Product out of stock');
                                          }}
                                        >
                                          <div className="table-suggestion-info">
                                            <div className="table-suggestion-name">
                                              {item.product_name}
                                              {isAlreadyInCart && <span className="selected-badge">In Cart</span>}
                                            </div>
                                            <div className="table-suggestion-meta">
                                              <span>{item.brand}</span>
                                              <span className={`stock-pill ${stockClass}`}>{stockLabel} · {stockLevel} in stock</span>
                                              {item.unit && <span>Unit: {item.unit}</span>}
                                            </div>
                                          </div>
                                          <div className="table-suggestion-right">
                                            <div className="table-suggestion-rate">₹{parseFloat(item.sale_rate || 0).toFixed(2)}</div>
                                            {item.min_sale_rate != null && <div style={{ fontSize: '10px', color: '#6c757d' }}>Min: ₹{parseFloat(item.min_sale_rate).toFixed(2)}</div>}
                                            {isAlreadyInCart && <div style={{ fontSize: '10px', color: '#40c057', fontWeight: '800' }}>SELECTED</div>}
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
                                </div>,
                                document.body
                              )}
                            </div>
                          </td>
                          <td colSpan="5">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6c7f8f', fontSize: '12px', fontStyle: 'italic', paddingLeft: '15px', opacity: 0.7 }}>
                              Type a name above to quickly add more items
                            </div>
                          </td>
                        </tr>
                      </tbody>
                      {/* FIX 2: Added whiteSpace: 'nowrap' to tfoot cells */}
                      <tfoot>
                        <tr className="si-cart-total-row">
                          <td colSpan="6" className="si-cart-total-label">
                            Cart balance
                          </td>
                          <td className="si-cart-total-amount">
                            ₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ border: 'none' }} />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Right Panel — cart mode */}
      {createPortal(
        <aside className="sell-item-right-panel">
          {sellerInfo && (
            <div className="right-panel-section">
              <div className="right-panel-label">Seller / Party</div>
              <div className="right-panel-card">
                <div className="right-panel-card-title">{sellerInfo.party_name}</div>
                {sellerInfo.mobile_number && <div className="right-panel-card-meta">{sellerInfo.mobile_number}</div>}
                <div className="right-panel-card-balance">Balance: ₹{parseFloat(sellerInfo.balance_amount || 0).toFixed(2)}</div>
              </div>
            </div>
          )}
          <div className="right-panel-section">
            <div className="right-panel-label">Cart Summary</div>
            <div className="summary-row"><span>Items</span><span>{selectedItems.length}</span></div>
            <div className="summary-row"><span>Cart Total</span><span>₹{calculateTotal().toFixed(2)}</span></div>
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
            <div className="right-panel-section">
              <button
                onClick={async () => {
                  if (previewLoading || actionInProgress) return;
                  setActionInProgress(true);
                  try { await handlePreview(); }
                  finally { setActionInProgress(false); }
                }}
                className="btn btn-primary right-panel-btn"
                disabled={previewLoading || actionInProgress}
              >
                {previewLoading ? <><span className="right-panel-spinner" />Calculating...</> : 'Preview Bill'}
              </button>
            </div>
          )}
        </aside>,
        document.body
      )}
      {/* Success Modal */}
      {showSuccessModal && successModalData && successModalData.transactionId && createPortal(
        <div
          className="modal-overlay"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '700px', width: '90%', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid #1f2937', color: '#f3f4f6', boxShadow: '0 4px 6px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', padding: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1f2937', padding: '12px', borderBottom: '1px solid #374151' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#28a745', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>OK</span>
                Transaction Completed Successfully
              </h3>
              <button className="modal-close" onClick={() => { setShowSuccessModal(false); setSuccessModalData(null); }}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px', padding: '12px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>Bill Number</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#f3f4f6' }}>{successModalData.billNumber}</div>
              </div>
              <h4 style={{ marginBottom: '15px', color: '#f3f4f6', fontSize: '16px', fontWeight: '600' }}>Transaction Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Payment Status', value: successModalData.paymentStatus === 'fully_paid' ? 'Fully paid' : 'Partially paid', color: '#28a745' },
                  { label: 'Cart Amount', value: `₹${(successModalData.cartAmount || 0).toFixed(2)}`, color: '#f3f4f6' },
                  { label: 'Amount Paid', value: `₹${(successModalData.amountPaid || 0).toFixed(2)}`, color: '#28a745' },
                  { label: 'Balance Due', value: `₹${(successModalData.balanceDue || 0).toFixed(2)}`, color: (successModalData.balanceDue || 0) > 0 ? '#dc3545' : '#28a745' },
                ].map((card, i) => (
                  <div key={i} style={{ padding: '15px', background: '#1f2937', borderRadius: '10px', border: '1px solid #374151' }}>
                    <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: card.color }}>{card.value}</div>
                  </div>
                ))}
                {successModalData.previousBalancePaid > 0 && (
                  <div style={{ padding: '15px', background: '#1f2937', borderRadius: '10px', border: '1px solid #374151' }}>
                    <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Previous Balance Paid</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#e65100' }}>+₹{(successModalData.previousBalancePaid || 0).toFixed(2)}</div>
                  </div>
                )}
              </div>
              <h4 style={{ marginBottom: '15px', color: '#f3f4f6', fontSize: '16px', fontWeight: '600' }}>Party Information</h4>
              <div style={{ padding: '15px', backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151', marginBottom: '15px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase' }}>Party Name</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#f3f4f6' }}>{successModalData.partyName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase' }}>Mobile Number</div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#f3f4f6' }}>{successModalData.partyMobile}</div>
                  </div>
                </div>
                {(successModalData.partyCheque || successModalData.partyBank) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    {successModalData.partyCheque ? (
                      <div>
                        <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase' }}>Cheque no.</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#f3f4f6' }}>{successModalData.partyCheque}</div>
                      </div>
                    ) : null}
                    {successModalData.partyBank ? (
                      <div>
                        <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase' }}>Bank</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#f3f4f6' }}>{successModalData.partyBank}</div>
                      </div>
                    ) : null}
                  </div>
                )}
                <div style={{ paddingTop: '12px', borderTop: '1px solid #374151' }}>
                  <div style={{ fontSize: '11px', color: '#6c757d', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase' }}>Current Balance</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: parseFloat(successModalData.currentBalance) >= 0 ? '#28a745' : '#dc3545' }}>
                    ₹{parseFloat(successModalData.currentBalance).toFixed(2)}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#1f2937', borderRadius: '8px', fontSize: '12px', color: '#6c757d' }}>
                Transaction Date: {successModalData.date}
              </div>
            </div>
            <div className="modal-footer" style={{ position: 'sticky', bottom: 0, backgroundColor: '#1f2937', borderTop: '1px solid #374151', padding: '15px 20px', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={handleNewSale} className="btn btn-primary" disabled={downloadingPDF || printingPDF || downloadingReceipt} style={{ minWidth: '120px' }}>🆕 New Sale</button>
              <button onClick={() => handleDownloadPDF(successModalData.transactionId, successModalData.billNumber)} className="btn btn-primary" disabled={downloadingPDF || printingPDF || downloadingReceipt} style={{ minWidth: '140px' }}>
                {downloadingPDF ? 'Downloading...' : 'Download PDF'}
              </button>
              <button onClick={() => handlePrintPDF(successModalData.transactionId)} className="btn btn-success" disabled={downloadingPDF || printingPDF || downloadingReceipt} style={{ minWidth: '120px' }}>
                {printingPDF ? 'Opening...' : 'Print PDF'}
              </button>
              <button onClick={() => handleDownloadReceipt(successModalData.transactionId, successModalData.billNumber)} className="btn btn-secondary" disabled={downloadingPDF || printingPDF || downloadingReceipt} style={{ minWidth: '140px' }}>
                {downloadingReceipt ? 'Downloading...' : 'Download Receipt'}
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