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
import './Party.css';
import '../styles/petrolpump-theme.css';

// Minimal Icons
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

  const handleMakePayment = (party) => {
    setSelectedParty(party);
    setPaymentAmount('');
    setPaymentMethod('Cash');
    setPaymentNotes('');
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
      toast.error('Failed to load party details');
    }
  };

  const fetchTransactionHistory = async (party, pageNum = 1) => {
    try {
      setHistoryLoading(true);
      const response = await apiClient.get(`/api/unified-transactions/party/seller/${party.id}`, {
        params: { page: pageNum, limit: 20 }
      });
      setTransactionHistory(response.data.transactions || []);
      setHistoryPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      toast.error('Failed to load transaction history');
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
      toast.error('Failed to process payment: ' + (error.response?.data?.error || 'Unknown error'));
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
        {/* Header - Compact */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.User />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: '#fff' }}>Creditors</h2>
              <span style={{ background: 'rgba(245,154,48,0.2)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', color: '#f59a30' }}>
                {sellerParties.length}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0 0' }}>Manage pump creditors and payments</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={fetchParties} disabled={loading} style={{ padding: '6px 12px', fontSize: '0.75rem' }} className="btn btn-secondary">
              🔄
            </button>
            {user?.role !== 'sales' && (
              <Link to="/add-seller-party" className="btn btn-success" style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 500 }}>
                + Add Creditor
              </Link>
            )}
          </div>
        </div>

        {/* Search - Compact */}
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Search by name, mobile, email, address, GST..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #2a3340', background: '#141b26', color: '#fff', fontSize: '0.85rem' }}
          />
        </div>

        {/* Summary Card - Compact */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
          <div style={{ padding: '10px', background: 'rgba(245,154,48,0.1)', borderRadius: '6px', borderLeft: `3px solid #f59a30` }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Creditors</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59a30' }}>{sellerParties.length}</div>
          </div>
          <div style={{ padding: '10px', background: 'rgba(29,158,117,0.1)', borderRadius: '6px', borderLeft: `3px solid #1d9e75` }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Total Outstanding</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1d9e75' }}>₹{totalBalance.toFixed(2)}</div>
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
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#94a3b8' }}>Email</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#94a3b8' }}>Address</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#94a3b8' }}>GST</th>
                  {user?.role === 'super_admin' && (
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
                    <td style={{ padding: '8px 10px', color: '#9aaebf', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{party.email || '-'}</td>
                    <td style={{ padding: '8px 10px', color: '#9aaebf', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{party.address || '-'}</td>
                    <td style={{ padding: '8px 10px', color: '#9aaebf' }}>{party.gst_number || '-'}</td>
                    {user?.role === 'super_admin' && (
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: parseFloat(party.balance_amount || 0) > 0 ? '#e8593c' : '#1d9e75' }}>
                        ₹{parseFloat(party.balance_amount || 0).toFixed(2)}
                      </td>
                    )}
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button onClick={() => handleViewDetails(party)} style={{ padding: '4px 8px', fontSize: '0.7rem', background: '#1e2a3a', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }} title="View Details">👁️</button>
                        {user?.role === 'super_admin' && (
                          <>
                            <button onClick={() => handleMakePayment(party)} style={{ padding: '4px 8px', fontSize: '0.7rem', background: '#1d9e75', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }} title="Make Payment">💰</button>
                            <button onClick={() => handleEdit(party)} style={{ padding: '4px 8px', fontSize: '0.7rem', background: '#f59a30', border: 'none', borderRadius: '4px', color: '#000', cursor: 'pointer' }} title="Edit">✏️</button>
                            <button onClick={() => handleArchive(party)} style={{ padding: '4px 8px', fontSize: '0.7rem', background: '#e8593c', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }} title="Delete">🗑️</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {user?.role === 'super_admin' && filteredParties.length > 0 && (
                <tfoot style={{ background: '#0f151f', borderTop: '1px solid #2a3340' }}>
                  <tr>
                    <td colSpan="6" style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>Total Outstanding:</td>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={(e) => e.target === e.currentTarget && setShowPartyDetailsModal(false)}>
          <div style={{ background: '#141b26', borderRadius: '8px', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid #2a3340' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #2a3340' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{partyDetails.party_name}</h3>
              <button onClick={() => setShowPartyDetailsModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}><Icons.Close /></button>
            </div>
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
              {/* Party Info Grid - Compact */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                <div style={{ padding: '8px 12px', background: '#0f151f', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Mobile</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{partyDetails.mobile_number || '—'}</div>
                </div>
                <div style={{ padding: '8px 12px', background: '#0f151f', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Email</div>
                  <div style={{ fontSize: '0.85rem' }}>{partyDetails.email || '—'}</div>
                </div>
                <div style={{ padding: '8px 12px', background: '#0f151f', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>GST</div>
                  <div style={{ fontSize: '0.85rem' }}>{partyDetails.gst_number || '—'}</div>
                </div>
                <div style={{ padding: '8px 12px', background: '#f59a3010', borderRadius: '6px', borderLeft: `2px solid #f59a30` }}>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Outstanding</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: parseFloat(partyDetails.balance_amount || 0) > 0 ? '#e8593c' : '#1d9e75' }}>
                    ₹{parseFloat(partyDetails.balance_amount || 0).toFixed(2)}
                  </div>
                </div>
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
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
                      <thead>
                        <tr style={{ background: '#0f151f' }}>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Date</th>
                          <th style={{ padding: '6px 8px', textAlign: 'left' }}>Type</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>Amount</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>Paid</th>
                          <th style={{ padding: '6px 8px', textAlign: 'right' }}>Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactionHistory.map((txn, idx) => {
                          const amount = parseFloat(txn.transaction_amount || txn.amount || 0);
                          const paid = parseFloat(txn.paid_amount || 0);
                          const balance = parseFloat(txn.balance_after || txn.balance_amount || 0);
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #2a3340' }}>
                              <td style={{ padding: '6px 8px' }}>{new Date(txn.transaction_timestamp || txn.created_at).toLocaleDateString()}</td>
                              <td style={{ padding: '6px 8px' }}>
                                <span style={{ padding: '2px 6px', borderRadius: '4px', background: txn.transaction_type === 'sale' ? '#1976d220' : txn.transaction_type === 'payment' ? '#1d9e7520' : '#f59a3020', fontSize: '0.65rem' }}>
                                  {txn.transaction_type === 'sale' ? 'Sale' : txn.transaction_type === 'payment' ? 'Payment' : txn.transaction_type}
                                </span>
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'right' }}>{amount > 0 ? `₹${amount.toFixed(2)}` : '-'}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: paid > 0 ? '#1d9e75' : '#94a3b8' }}>{paid > 0 ? `₹${paid.toFixed(2)}` : '-'}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: balance > 0 ? '#e8593c' : '#1d9e75' }}>₹{balance.toFixed(2)}</td>
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
            <div style={{ padding: '12px 16px', borderTop: '1px solid #2a3340', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowPartyDetailsModal(false)} className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '0.75rem' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal - Compact */}
      {showPaymentModal && selectedParty && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={(e) => e.target === e.currentTarget && setShowPaymentModal(false)}>
          <div style={{ background: '#141b26', borderRadius: '8px', width: '100%', maxWidth: '420px', border: '1px solid #2a3340' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #2a3340' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Make Payment - {selectedParty.party_name}</h3>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Icons.Close /></button>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px' }}>Current Balance</div>
                <div style={{ padding: '10px', background: parseFloat(selectedParty.balance_amount || 0) > 0 ? '#e8593c20' : '#1d9e7520', borderRadius: '6px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 600 }}>
                  ₹{parseFloat(selectedParty.balance_amount || 0).toFixed(2)}
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Payment Amount *</label>
                <input type="number" min="1" max={parseFloat(selectedParty.balance_amount || 0)} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter amount" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2a3340', background: '#0f151f', color: '#fff' }} />
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>Max: ₹{parseFloat(selectedParty.balance_amount || 0).toFixed(2)}</div>
              </div>
              {paymentAmount && parseFloat(paymentAmount) > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px' }}>After Payment</div>
                  <div style={{ padding: '8px', background: '#0f151f', borderRadius: '6px', textAlign: 'center' }}>
                    ₹{(parseFloat(selectedParty.balance_amount || 0) - parseFloat(paymentAmount)).toFixed(2)}
                  </div>
                </div>
              )}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Notes</label>
                <textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows="2" placeholder="Optional notes..." style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2a3340', background: '#0f151f', color: '#fff', fontSize: '0.8rem', resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 16px', borderTop: '1px solid #2a3340' }}>
              <button onClick={() => setShowPaymentModal(false)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} disabled={processingPayment}>Cancel</button>
              <button onClick={handlePaymentSubmit} className="btn btn-success" style={{ padding: '6px 12px', fontSize: '0.75rem' }} disabled={processingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}>
                {processingPayment ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal - Compact */}
      {showReceiptModal && receiptData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={(e) => e.target === e.currentTarget && setShowReceiptModal(false)}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }} onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <div style={{ background: '#141b26', borderRadius: '8px', width: '100%', maxWidth: '520px', border: '1px solid #2a3340' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #2a3340' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Edit Creditor</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Icons.Close /></button>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '10px' }}>
                <input type="text" placeholder="Party Name *" value={editFormData.party_name} onChange={(e) => setEditFormData({ ...editFormData, party_name: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2a3340', background: '#0f151f', color: '#fff', fontSize: '0.85rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <input type="text" placeholder="Mobile" value={editFormData.mobile_number} onChange={(e) => setEditFormData({ ...editFormData, mobile_number: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3340', background: '#0f151f', color: '#fff', fontSize: '0.85rem' }} />
                <input type="email" placeholder="Email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3340', background: '#0f151f', color: '#fff', fontSize: '0.85rem' }} />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <textarea placeholder="Address" value={editFormData.address} onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })} rows="2" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #2a3340', background: '#0f151f', color: '#fff', fontSize: '0.85rem', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <input type="text" placeholder="GST Number" value={editFormData.gst_number} onChange={(e) => setEditFormData({ ...editFormData, gst_number: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #2a3340', background: '#0f151f', color: '#fff', fontSize: '0.85rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 16px', borderTop: '1px solid #2a3340' }}>
              <button onClick={() => setShowEditModal(false)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} disabled={updating}>Cancel</button>
              <button onClick={handleUpdate} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} disabled={updating}>{updating ? 'Updating...' : 'Update'}</button>
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