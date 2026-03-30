import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import apiClient from '../config/axios';
import config from '../config/config';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getLocalDateString } from '../utils/dateUtils';
import TransactionLoader from '../components/TransactionLoader';
import Pagination from '../components/Pagination';
import ActionMenu from '../components/ActionMenu';
import './Party.css';
import '../styles/petrolpump-theme.css';

// Minimal Icons
const PAYMENT_METHOD_OPTIONS = ['Cash', 'UPI', 'Card', 'Bank transfer', 'Cheque', 'Other'];

const Icons = {
  User: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  Phone: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
  Email: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  Location: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  Money: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  Close: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  ChevronUp: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>,
  Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  Print: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 9V3h12v6" /><rect x="6" y="18" width="12" height="4" rx="1" /></svg>
};

const Parties = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [parties, setParties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sellerParties, setSellerParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [showPartyDetailsModal, setShowPartyDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [partyDetails, setPartyDetails] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [printingReceipt, setPrintingReceipt] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [editFormData, setEditFormData] = useState({
    party_name: '', mobile_number: '', email: '', address: '',
    opening_balance: '', closing_balance: '', gst_number: ''
  });
  const [updating, setUpdating] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (processingPayment) document.body.classList.add('transaction-loading');
    else document.body.classList.remove('transaction-loading');
    return () => document.body.classList.remove('transaction-loading');
  }, [processingPayment]);

  useEffect(() => {
    fetchParties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchParties = async () => {
    try {
      setLoading(true);
      let allSellers = [];
      let sellerPage = 1;
      let hasMoreSellers = true;

      while (hasMoreSellers) {
        const response = await apiClient.get(config.api.sellers, { 
          params: { page: sellerPage, limit: 5000 } 
        });
        const sellers = response.data.parties || [];
        allSellers = [...allSellers, ...sellers];
        hasMoreSellers = sellers.length === 5000;
        sellerPage++;
      }

      setSellerParties(allSellers);
      setParties(allSellers.map(p => ({ ...p, party_type: 'seller' })));
    } catch (error) {
      console.error('Error fetching parties:', error);
      toast.error('Failed to load parties');
    } finally {
      setLoading(false);
    }
  };

  const filteredParties = useMemo(() => {
    let filtered = parties;
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(party =>
        party.party_name?.toLowerCase().includes(query) ||
        party.mobile_number?.includes(query) ||
        party.email?.toLowerCase().includes(query) ||
        party.address?.toLowerCase().includes(query) ||
        party.gst_number?.toLowerCase().includes(query)
      );
    }
    return filtered.sort((a, b) => a.party_name?.localeCompare(b.party_name));
  }, [parties, debouncedSearchQuery]);

  const totalBalance = useMemo(() => 
    filteredParties.reduce((sum, p) => sum + parseFloat(p.balance_amount || 0), 0), 
    [filteredParties]
  );

  const handleViewDetails = async (party) => {
    setSelectedParty(party);
    setShowPartyDetailsModal(true);
    setHistoryPage(1);
    await fetchPartyDetails(party);
    await fetchTransactionHistory(party, 1);
  };

  const handleMakePayment = async (party) => {
    setPaymentAmount('');
    setPaymentMethod('Cash');
    setPaymentNotes('');
    try {
      const r = await apiClient.get(`${config.api.sellers}/${party.id}`);
      setSelectedParty({ ...party, ...(r.data?.party || {}) });
    } catch {
      setSelectedParty(party);
    }
    setShowPaymentModal(true);
  };

  const handleEdit = (party) => {
    setEditingParty(party);
    setEditFormData({
      party_name: party.party_name || '',
      mobile_number: party.mobile_number || '',
      email: party.email || '',
      address: party.address || '',
      opening_balance: party.opening_balance || '',
      closing_balance: party.closing_balance || '',
      gst_number: party.gst_number || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingParty || updating || !editFormData.party_name?.trim()) {
      toast.error('Party name is required');
      return;
    }

    setUpdating(true);
    try {
      const endpoint = `${config.api.sellers}/${editingParty.id}`;
      const updateData = {};
      if (editFormData.party_name) updateData.party_name = editFormData.party_name.trim();
      if (editFormData.mobile_number) updateData.mobile_number = editFormData.mobile_number.trim();
      if (editFormData.email) updateData.email = editFormData.email.trim().toLowerCase();
      if (editFormData.address) updateData.address = editFormData.address.trim();
      if (editFormData.opening_balance !== '') updateData.opening_balance = parseFloat(editFormData.opening_balance) || 0;
      if (editFormData.closing_balance !== '') updateData.closing_balance = parseFloat(editFormData.closing_balance) || 0;
      if (editFormData.gst_number) updateData.gst_number = editFormData.gst_number.trim();

      await apiClient.patch(endpoint, updateData);
      toast.success('Party updated successfully');
      await fetchParties();
      setShowEditModal(false);
      setEditingParty(null);
    } catch (error) {
      console.error('Error updating party:', error);
      toast.error(error.response?.data?.error || 'Failed to update party');
    } finally {
      setUpdating(false);
    }
  };

  const handleArchive = async (party) => {
    if (!window.confirm(`Delete "${party.party_name}"? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`${config.api.sellers}/${party.id}`);
      toast.success('Party deleted successfully');
      await fetchParties();
    } catch (error) {
      console.error('Error deleting party:', error);
      toast.error(error.response?.data?.error || 'Failed to delete party');
    }
  };

  const fetchPartyDetails = async (party) => {
    try {
      const response = await apiClient.get(`${config.api.sellers}/${party.id}`);
      setPartyDetails(response.data.party);
    } catch (error) {
      console.error('Error fetching party details:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to load party details');
    }
  };

  const fetchTransactionHistory = async (party, pageNum = 1) => {
    try {
      setHistoryLoading(true);
      const response = await apiClient.get(config.api.unifiedTransactionsParty('seller', party.id), {
        params: { page: pageNum, limit: 25 }
      });
      setTransactionHistory(Array.isArray(response.data?.transactions) ? response.data.transactions : []);
      setHistoryPagination(response.data?.pagination ?? null);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to load transaction history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedParty || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setProcessingPayment(true);
    try {
      const partyRes = await apiClient.get(`${config.api.sellers}/${selectedParty.id}`);
      const currentBalance = parseFloat(partyRes.data.party.balance_amount || 0);
      const paymentAmt = parseFloat(paymentAmount);

      const response = await apiClient.post('/api/unified-transactions', {
        party_type: 'seller',
        party_id: selectedParty.id,
        transaction_type: 'payment',
        transaction_date: getLocalDateString(),
        previous_balance: currentBalance,
        transaction_amount: 0,
        paid_amount: paymentAmt,
        balance_after: Math.max(0, currentBalance - paymentAmt),
        payment_method: paymentMethod,
        notes: paymentNotes
      });

      toast.success(`Payment of ₹${paymentAmt.toFixed(2)} recorded successfully`);

      if (response.data.transaction?.id) {
        setReceiptData({
          transactionId: response.data.transaction.id,
          receiptNumber: response.data.transaction.bill_number || response.data.transaction.id,
          amount: paymentAmt,
          partyName: selectedParty.party_name,
          paymentMethod,
          paymentNotes,
          date: getLocalDateString()
        });
        setShowReceiptModal(true);
      }

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNotes('');
      await fetchParties();
      if (showPartyDetailsModal && selectedParty) {
        await fetchPartyDetails(selectedParty);
        await fetchTransactionHistory(selectedParty, historyPage);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptData || downloadingReceipt) return;
    setDownloadingReceipt(true);
    try {
      const response = await apiClient.get(
        `/api/bills/payment/${receiptData.transactionId}/receipt?party_type=seller`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment_receipt_${receiptData.receiptNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Receipt downloaded');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!receiptData || printingReceipt) return;
    setPrintingReceipt(true);
    try {
      const response = await apiClient.get(
        `/api/bills/payment/${receiptData.transactionId}/receipt?party_type=seller`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const printWindow = window.open(url, '_blank');
      if (printWindow) printWindow.onload = () => printWindow.print();
      toast.success('Receipt ready for printing');
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast.error('Failed to print receipt');
    } finally {
      setPrintingReceipt(false);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <Layout>
      <TransactionLoader isLoading={loading || processingPayment} type={processingPayment ? "payment" : "transaction"} />
      
      <div style={{ padding: '12px 16px', maxWidth: '1600px', margin: '0 auto' }}>
        <div
          style={{
            background: 'linear-gradient(145deg, #141b26 0%, #0f151f 100%)',
            border: '1px solid #2a3340',
            borderRadius: '12px',
            padding: '16px 18px',
            marginBottom: '16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,154,48,0.12)', color: '#f59a30' }}>
                  <Icons.User />
                </span>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#f8fafc', letterSpacing: '-0.02em' }}>Creditors &amp; credit parties</h2>
                  <p style={{ fontSize: '0.8125rem', color: '#94a3b8', margin: '4px 0 0 0', lineHeight: 1.5, maxWidth: '560px' }}>
                    Search and review balances, open a party for full history, or record a payment when you are ready.
                  </p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" onClick={fetchParties} disabled={loading} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8125rem', fontWeight: 600, borderRadius: '8px' }}>
                Refresh list
              </button>
              {user?.role !== 'sales' && (
                <Link to="/add-seller-party" className="btn btn-success" style={{ padding: '8px 16px', fontSize: '0.8125rem', fontWeight: 600, borderRadius: '8px', textDecoration: 'none' }}>
                  + New creditor
                </Link>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Directory</span>
            <span style={{ background: 'rgba(245,154,48,0.15)', color: '#fbbf24', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 700 }}>{sellerParties.length} parties</span>
            <span style={{ color: '#475569' }}>|</span>
            <span style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>
              Combined outstanding: <strong style={{ color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>₹{totalBalance.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label htmlFor="creditor-search" style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
            Search creditors
          </label>
          <input
            id="creditor-search"
            type="text"
            placeholder="Name, mobile, email, address, or GST…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#f1f5f9',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div style={{ padding: '14px 16px', background: '#0f151f', borderRadius: '10px', border: '1px solid #2a3340', borderLeft: '4px solid #f59a30' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Parties on file</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59a30', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>{sellerParties.length}</div>
          </div>
          <div style={{ padding: '14px 16px', background: '#0f151f', borderRadius: '10px', border: '1px solid #2a3340', borderLeft: '4px solid #22c55e' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total outstanding</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80', marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>₹{totalBalance.toFixed(2)}</div>
          </div>
        </div>

        {/* Table - Compact, No extra padding */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading...</div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #2a3340' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead style={{ background: '#0f151f' }}>
                <tr>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: '#94a3b8' }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#94a3b8' }}>Party Name</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#94a3b8' }}>Mobile</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#94a3b8' }}>GST No.</th>
                  {(user?.role === 'super_admin' || user?.role === 'admin') && (
                    <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#94a3b8' }}>Balance</th>
                  )}
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: '#94a3b8' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParties.map((party, idx) => (
                  <tr key={party.id} style={{ borderBottom: '1px solid #2a3340' }}>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 500, whiteSpace: 'nowrap' }}>{party.party_name}</td>
                    <td style={{ padding: '8px 10px', color: '#9aaebf' }}>{party.mobile_number || '-'}</td>
                    <td style={{ padding: '8px 10px', color: '#9aaebf', fontFamily: 'monospace', fontSize: '11px' }}>{party.gst_number || '-'}</td>
                    {(user?.role === 'super_admin' || user?.role === 'admin') && (
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: parseFloat(party.balance_amount || 0) > 0 ? '#e8593c' : '#1d9e75' }}>
                        ₹{parseFloat(party.balance_amount || 0).toFixed(2)}
                      </td>
                    )}
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <ActionMenu
                        itemId={party.id}
                        itemName={party.party_name}
                        actions={[
                          {
                            label: 'View Details',
                            icon: '👁️',
                            onClick: () => handleViewDetails(party)
                          },
                          ...(user?.role === 'super_admin' ? [
                            {
                              label: 'Make Payment',
                              icon: '💰',
                              onClick: () => handleMakePayment(party)
                            },
                            {
                              label: 'Edit Creditor',
                              icon: '✏️',
                              onClick: () => handleEdit(party)
                            },
                            {
                              label: 'Delete',
                              icon: '🗑️',
                              danger: true,
                              onClick: () => handleArchive(party)
                            }
                          ] : [])
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              {user?.role === 'super_admin' && filteredParties.length > 0 && (
                <tfoot style={{ background: '#0f151f', borderTop: '1px solid #2a3340' }}>
                  <tr>
                    <td colSpan="4" style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Total Outstanding:</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#f59a30' }}>₹{totalBalance.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
            {filteredParties.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                {searchQuery ? 'No matching creditors found' : 'No creditors found'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Party Details Modal - Compact */}
      {showPartyDetailsModal && selectedParty && partyDetails && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#141b26', borderRadius: '8px', width: '100%', maxWidth: 'min(1200px, 100vw - 32px)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid #2a3340' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #2a3340' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{partyDetails.party_name}</h3>
              <button onClick={() => setShowPartyDetailsModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}><Icons.Close /></button>
            </div>
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
              {/* Party Info Grid - Compact */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', marginBottom: '14px' }}>
                <div style={{ padding: '8px 12px', background: '#0f151f', borderRadius: '6px', border: '1px solid #2a3340' }}>
                  <div style={{ fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', marginBottom: '2px' }}>Mobile</div>
                  <div style={{ fontSize: '12px', fontWeight: 500 }}>{partyDetails.mobile_number || '—'}</div>
                </div>
                <div style={{ padding: '8px 12px', background: '#0f151f', borderRadius: '6px', border: '1px solid #2a3340' }}>
                  <div style={{ fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', marginBottom: '2px' }}>Email</div>
                  <div style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{partyDetails.email || '—'}</div>
                </div>
                <div style={{ padding: '8px 12px', background: '#0f151f', borderRadius: '6px', border: '1px solid #2a3340' }}>
                  <div style={{ fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', marginBottom: '2px' }}>GST No.</div>
                  <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>{partyDetails.gst_number || '—'}</div>
                </div>
                {partyDetails.address && (
                  <div style={{ padding: '8px 12px', background: '#0f151f', borderRadius: '6px', border: '1px solid #2a3340', gridColumn: 'span 2' }}>
                    <div style={{ fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', marginBottom: '2px' }}>Address</div>
                    <div style={{ fontSize: '12px' }}>{partyDetails.address}</div>
                  </div>
                )}
                {(user?.role === 'super_admin' || user?.role === 'admin') && (
                  <div style={{ padding: '8px 12px', background: parseFloat(partyDetails.balance_amount || 0) > 0 ? '#e8593c15' : '#1d9e7515', borderRadius: '6px', border: `1px solid ${parseFloat(partyDetails.balance_amount || 0) > 0 ? '#e8593c40' : '#1d9e7540'}` }}>
                    <div style={{ fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', marginBottom: '2px' }}>Outstanding Balance</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: parseFloat(partyDetails.balance_amount || 0) > 0 ? '#e8593c' : '#1d9e75' }}>
                      ₹{parseFloat(partyDetails.balance_amount || 0).toFixed(2)}
                    </div>
                  </div>
                )}
                {partyDetails.due_date && (
                  <div style={{ padding: '8px 12px', background: '#0f151f', borderRadius: '6px', border: '1px solid #2a3340' }}>
                    <div style={{ fontSize: '9px', color: '#9aaebf', textTransform: 'uppercase', marginBottom: '2px' }}>Credit due date</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: new Date(partyDetails.due_date) < new Date(new Date().toDateString()) ? '#e8593c' : '#9aaebf' }}>
                      {new Date(`${String(partyDetails.due_date).slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ padding: '0 0 12px 0', borderBottom: '1px solid #2a3340', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Transaction History</h4>
                  {user?.role === 'super_admin' && (
                    <button onClick={() => { setShowPartyDetailsModal(false); handleMakePayment(selectedParty); }} className="btn btn-success" style={{ padding: '4px 12px', fontSize: '0.7rem' }}>Make Payment</button>
                  )}
                </div>
              </div>

              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Loading...</div>
              ) : transactionHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No transactions</div>
              ) : (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <thead>
                        <tr style={{ background: '#0f151f', borderBottom: '1px solid #2a3340' }}>
                          <th style={{ padding: '6px 8px', textAlign: 'left', color: '#9aaebf', fontWeight: 600, whiteSpace: 'nowrap' }}>Date &amp; time</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Type</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Bill / ref</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Pay status</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Prev. bal</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Invoice amt</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Paid</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right', color: '#9aaebf', fontWeight: 600 }}>Balance after</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left', color: '#9aaebf', fontWeight: 600, minWidth: '120px' }}>Due (prev → new)</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left', color: '#9aaebf', fontWeight: 600 }}>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactionHistory.map((txn, idx) => {
                          const amount = parseFloat(txn.transaction_amount ?? txn.this_transaction_amount ?? 0);
                          const paid = parseFloat(txn.paid_amount ?? 0);
                          const balance = parseFloat(txn.balance_after ?? 0);
                          const prevBal = parseFloat(txn.previous_balance ?? 0);
                          const txType = txn.transaction_type || '';
                          const typeColor = txType === 'sale' ? '#3b82f6' : txType === 'payment' || txType === 'sale_payment' ? '#22c55e' : txType === 'return' ? '#f59a30' : '#94a3b8';
                          const ts = txn.transaction_timestamp ? new Date(txn.transaction_timestamp) : null;
                          const dateStr = ts && !Number.isNaN(ts.getTime())
                            ? ts.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : (txn.date || txn.transaction_date
                              ? new Date(`${String(txn.date || txn.transaction_date).slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
                              : '—');
                          const fmtDue = (d) => {
                            if (!d) return null;
                            try {
                              return new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
                            } catch {
                              return null;
                            }
                          };
                          const prevDue = fmtDue(txn.previous_due_date);
                          const newDue = fmtDue(txn.new_due_date);
                          const payStatus = txn.payment_status
                            ? String(txn.payment_status).replace(/_/g, ' ')
                            : (txType === 'sale' ? '—' : '—');
                          return (
                            <tr key={txn.id || idx} style={{ borderBottom: '1px solid #1a2330' }}>
                              <td style={{ padding: '6px 8px', color: '#cbd5e1', whiteSpace: 'nowrap', fontSize: '10px' }}>{dateStr}</td>
                              <td style={{ padding: '6px 8px' }}>
                                <span style={{ padding: '2px 7px', borderRadius: '4px', background: `${typeColor}22`, color: typeColor, fontSize: '10px', fontWeight: 600 }}>
                                  {txType === 'sale' ? 'Sale' : txType === 'payment' ? 'Payment' : txType === 'return' ? 'Return' : txType || '—'}
                                </span>
                              </td>
                              <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: '10px', color: '#9aaebf' }}>{txn.bill_number || (txn.reference_id ? `#${txn.reference_id}` : '—')}</td>
                              <td style={{ padding: '6px 8px', fontSize: '10px', color: '#a5b4fc', textTransform: 'capitalize' }}>{payStatus}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#9aaebf' }}>{prevBal !== 0 ? `₹${prevBal.toFixed(2)}` : '—'}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#eef2f8', fontWeight: 600 }}>{amount !== 0 ? `₹${amount.toFixed(2)}` : '—'}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: paid > 0 ? '#4ade80' : '#64748b' }}>{paid > 0 ? `₹${paid.toFixed(2)}` : '—'}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: balance > 0 ? '#fb923c' : '#4ade80' }}>₹{balance.toFixed(2)}</td>
                              <td style={{ padding: '6px 8px', color: '#94a3b8', fontSize: '10px', lineHeight: 1.35 }}>
                                {prevDue || newDue ? (
                                  <>
                                    {prevDue ? <div>Prev: {prevDue}</div> : null}
                                    {newDue ? <div>New: {newDue}</div> : null}
                                  </>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td style={{ padding: '6px 8px', color: '#64748b', fontSize: '10px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={[txn.payment_method, txn.notes].filter(Boolean).join(' · ')}>
                                {[txn.payment_method, txn.notes].filter(Boolean).join(' · ') || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {historyPagination && (
                    <div style={{ marginTop: '12px' }}>
                      <Pagination currentPage={historyPage} totalPages={historyPagination.totalPages} onPageChange={(p) => { setHistoryPage(p); fetchTransactionHistory(selectedParty, p); }} totalRecords={historyPagination.totalRecords} showTotalRecords />
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={{ padding: '14px 18px', borderTop: '1px solid #2a3340', display: 'flex', justifyContent: 'flex-end', background: '#0f151f' }}>
              <button type="button" onClick={() => setShowPartyDetailsModal(false)} className="btn btn-secondary" style={{ padding: '10px 22px', fontSize: '0.875rem', fontWeight: 600, borderRadius: '10px', border: '1px solid #475569' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedParty && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
            style={{
              background: '#141b26',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '440px',
              border: '1px solid #334155',
              boxShadow: '0 24px 48px rgba(0,0,0,0.45)',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 18px', borderBottom: '1px solid #2a3340', gap: '12px' }}>
              <div>
                <div id="payment-modal-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 }}>
                  Record payment
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '6px', wordBreak: 'break-word' }}>{selectedParty.party_name}</div>
              </div>
              <button type="button" onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', flexShrink: 0 }} aria-label="Close">
                <Icons.Close />
              </button>
            </div>
            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Amount due now</div>
                <div
                  style={{
                    padding: '14px 16px',
                    background: parseFloat(selectedParty.balance_amount || 0) > 0 ? 'rgba(232,89,60,0.12)' : 'rgba(34,197,94,0.12)',
                    border: `1px solid ${parseFloat(selectedParty.balance_amount || 0) > 0 ? 'rgba(232,89,60,0.35)' : 'rgba(34,197,94,0.35)'}`,
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: parseFloat(selectedParty.balance_amount || 0) > 0 ? '#fb923c' : '#4ade80',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  ₹{parseFloat(selectedParty.balance_amount || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <label htmlFor="party-pay-amt" style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
                  Payment amount <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  id="party-pay-amt"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={parseFloat(selectedParty.balance_amount || 0)}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #475569',
                    background: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums'
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>Maximum you can apply: ₹{parseFloat(selectedParty.balance_amount || 0).toFixed(2)}</div>
              </div>
              {paymentAmount && parseFloat(paymentAmount) > 0 && (
                <div style={{ padding: '12px 14px', background: '#0f172a', borderRadius: '10px', border: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Balance after this payment</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#e2e8f0', fontVariantNumeric: 'tabular-nums' }}>
                    ₹{Math.max(0, parseFloat(selectedParty.balance_amount || 0) - parseFloat(paymentAmount)).toFixed(2)}
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="party-pay-method" style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
                  Payment method
                </label>
                <select
                  id="party-pay-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1px solid #475569',
                    background: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  {PAYMENT_METHOD_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="party-pay-notes" style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '8px' }}>
                  Notes <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: '#64748b' }}>(optional)</span>
                </label>
                <textarea
                  id="party-pay-notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={3}
                  placeholder="Reference no., bank, UPI id…"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #475569',
                    background: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                    minHeight: '72px',
                    lineHeight: 1.45
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row-reverse',
                flexWrap: 'wrap',
                justifyContent: 'flex-start',
                gap: '10px',
                padding: '16px 18px',
                borderTop: '1px solid #2a3340',
                background: '#0f151f'
              }}
            >
              <button
                type="button"
                onClick={handlePaymentSubmit}
                className="btn btn-success"
                style={{
                  padding: '12px 22px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  minWidth: '160px',
                  border: 'none',
                  cursor: processingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0 ? 'not-allowed' : 'pointer',
                  opacity: processingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0 ? 0.65 : 1
                }}
                disabled={processingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
              >
                {processingPayment ? 'Recording…' : 'Record payment'}
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="btn btn-secondary"
                style={{
                  padding: '12px 20px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  minWidth: '120px',
                  border: '1px solid #475569',
                  background: 'transparent',
                  color: '#e2e8f0',
                  cursor: processingPayment ? 'not-allowed' : 'pointer'
                }}
                disabled={processingPayment}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal - Compact */}
      {showReceiptModal && receiptData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#141b26', borderRadius: '8px', width: '100%', maxWidth: '480px', border: '1px solid #2a3340' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #2a3340' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Payment Receipt</h3>
              <button onClick={() => setShowReceiptModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Icons.Close /></button>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1d9e75' }}>₹{receiptData.amount.toFixed(2)}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Payment Successful</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.75rem' }}>
                <div><strong>Receipt No:</strong><br />{receiptData.receiptNumber}</div>
                <div><strong>Date:</strong><br />{receiptData.date}</div>
                <div><strong>Party:</strong><br />{receiptData.partyName}</div>
                <div><strong>Method:</strong><br />{receiptData.paymentMethod}</div>
                {receiptData.paymentNotes && <div style={{ gridColumn: '1/-1' }}><strong>Notes:</strong><br />{receiptData.paymentNotes}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 16px', borderTop: '1px solid #2a3340' }}>
              <button onClick={() => setShowReceiptModal(false)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Close</button>
              <button onClick={handleDownloadReceipt} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }} disabled={downloadingReceipt}>
                <Icons.Download /> {downloadingReceipt ? '...' : 'Download'}
              </button>
              <button onClick={handlePrintReceipt} className="btn btn-success" style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }} disabled={printingReceipt}>
                <Icons.Print /> {printingReceipt ? '...' : 'Print'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - Compact */}
      {showEditModal && editingParty && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Creditor</h3>
              <button className="modal-close" type="button" onClick={() => setShowEditModal(false)} aria-label="Close">
                <Icons.Close />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Party Name *</label>
                  <input
                    type="text"
                    value={editFormData.party_name}
                    onChange={(e) => setEditFormData({ ...editFormData, party_name: e.target.value })}
                    placeholder="Enter party name"
                  />
                </div>
                <div className="form-group">
                  <label>Mobile</label>
                  <input
                    type="text"
                    value={editFormData.mobile_number}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile_number: e.target.value })}
                    placeholder="Enter mobile number"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Address</label>
                  <textarea
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    rows={3}
                    placeholder="Enter address"
                  />
                </div>
                <div className="form-group">
                  <label>GST Number</label>
                  <input
                    type="text"
                    value={editFormData.gst_number}
                    onChange={(e) => setEditFormData({ ...editFormData, gst_number: e.target.value })}
                    placeholder="Enter GST number"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', flexDirection: 'row-reverse', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-start', padding: '14px 18px' }}>
              <button type="button" onClick={handleUpdate} className="btn btn-primary" disabled={updating} style={{ padding: '10px 22px', fontSize: '0.9rem', fontWeight: 700, borderRadius: '10px', minWidth: '140px' }}>
                {updating ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary" disabled={updating} style={{ padding: '10px 20px', fontSize: '0.9rem', fontWeight: 600, borderRadius: '10px', minWidth: '120px', border: '1px solid #475569' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button onClick={scrollToTop} style={{ position: 'fixed', bottom: '20px', right: '20px', width: '36px', height: '36px', borderRadius: '50%', background: '#f59a30', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 999 }}>
          <Icons.ChevronUp />
        </button>
      )}
    </Layout>
  );
};

export default Parties;