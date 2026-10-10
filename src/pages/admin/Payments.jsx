import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  CreditCard,
  Building,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  User,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Download
} from 'lucide-react';

import { useAuthStore } from '../../store/authStore';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import { useAlert } from '../../context/AlertContext';
import { CustomSelect } from '../../components/CustomSelect';

export default function Payments() {
  const queryClient = useQueryClient();
  const alert = useAlert();
  const user = useAuthStore((state) => state.user);
  const currencySymbol = getCurrencySymbol(user?.studioCurrency);
  const [page, setPage] = useState(0);
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  const handleDownloadInvoice = async (paymentId, invoiceNo) => {
    try {
      setDownloadingInvoiceId(paymentId);
      const res = await api.get(`/payments/${paymentId}/invoice`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GST_Invoice_${invoiceNo || ('INV_' + paymentId)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      alert.success('Official GST Tax Invoice downloaded successfully.', 'Invoice Downloaded');
    } catch (err) {
      alert.error('Failed to download GST invoice. Please try again.', 'Download Error');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  // 1. Fetch payments list
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['studioPayments', page],
    queryFn: async () => {
      const res = await api.get(`/payments?page=${page}&size=20`);
      return res.data.data;
    },
  });

  // 2. Fetch clients for the dropdown modal
  const { data: clientsList } = useQuery({
    queryKey: ['clientsListSimple'],
    queryFn: async () => {
      const res = await api.get('/clients?size=100');
      return res.data.data.content || [];
    },
  });

  // 3. Fetch events for the selected client
  const { data: clientEvents } = useQuery({
    queryKey: ['clientEventsForPayment', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const res = await api.get(`/events/client/${selectedClientId}`);
      return res.data.data || [];
    },
    enabled: !!selectedClientId,
  });

  // 4. Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/payments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['studioPayments']);
      queryClient.invalidateQueries(['studioStats']);
      queryClient.invalidateQueries(['clientsListSimple']);
      setShowAddModal(false);
      resetForm();
      alert.success('Client payment transaction recorded successfully.', 'Payment Recorded');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to record payment';
      setErrorMsg(msg);
      alert.error(msg, 'Payment Error');
    },
  });

  // 5. Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId) => {
      await api.delete(`/payments/${paymentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['studioPayments']);
      queryClient.invalidateQueries(['studioStats']);
      alert.success('Payment transaction has been deleted.', 'Payment Deleted');
    },
    onError: (err) => {
      alert.error(err.response?.data?.message || 'Failed to delete payment.', 'Error');
    }
  });

  const resetForm = () => {
    setSelectedClientId('');
    setSelectedEventId('');
    setAmount('');
    setPaymentMethod('BANK_TRANSFER');
    setPaymentReference('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setErrorMsg('');
  };

  const handleRecordPayment = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedClientId) {
      setErrorMsg('Please select a client');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than zero');
      return;
    }

    createPaymentMutation.mutate({
      clientId: Number(selectedClientId),
      eventId: selectedEventId ? Number(selectedEventId) : null,
      amount: numAmount,
      paymentMethod,
      paymentReference: paymentReference.trim() || null,
      paymentDate: paymentDate || null,
      notes: notes.trim() || null,
    });
  };

  const payments = paymentsData?.content || [];

  // Filter payments locally by method and search term
  const filteredPayments = payments.filter((p) => {
    const matchesMethod = filterMethod === 'ALL' || p.paymentMethod === filterMethod;
    const matchesSearch =
      searchTerm === '' ||
      p.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.eventName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  // Calculations for summary widgets
  const totalCollections = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  const getMethodBadgeClass = (method) => {
    switch (method) {
      case 'BANK_TRANSFER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CARD':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'UPI':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CASH':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight drop-shadow-xs">Payments & Revenue Ledger</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Track client deposits, installments, milestone payments, and transaction history.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="neu-glass-btn-primary flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white font-bold text-xs shadow-md transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="neu-glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Recorded Payments</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100/90 text-emerald-800 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-3 tracking-tight">
            {formatCurrency(totalCollections, user?.studioCurrency)}
          </p>
          <p className="text-xs text-stone-500 mt-1.5 font-medium">Across all studio projects</p>
        </div>

        <div className="neu-glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Transactions Count</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-100/90 text-amber-800 flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-3 tracking-tight">{paymentsData?.totalElements || payments.length}</p>
          <p className="text-xs text-stone-500 mt-1.5 font-medium">Direct invoices and receipts</p>
        </div>

        <div className="neu-glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Payment Channels</span>
            <div className="w-10 h-10 rounded-2xl bg-sky-100/90 text-sky-800 flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-sky-800 mt-3 tracking-tight">Multi-Channel</p>
          <p className="text-xs text-stone-500 mt-1.5 font-medium">Bank, Card, UPI & Cash reconciled</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="neu-glass-panel p-4 sm:p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by client, event or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full neu-glass-input rounded-full pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        {/* Method Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {['ALL', 'BANK_TRANSFER', 'CARD', 'UPI', 'CASH', 'OTHER'].map((method) => {
            const isActive = filterMethod === method;
            return (
              <button
                key={method}
                onClick={() => setFilterMethod(method)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'neu-glass-pill active bg-amber-600 text-white shadow-xs'
                    : 'neu-glass-pill text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
                }`}
              >
                {method === 'ALL' ? 'All Channels' : method.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Payments Table */}
      <div className="neu-glass-panel rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-stone-400 text-xs">Loading payment transactions...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs">
            <DollarSign className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="font-bold text-stone-700 text-sm">No payment transactions found</p>
            <p className="text-xs text-stone-400 mt-1">Record a deposit or final payment to update client balance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200/60 bg-stone-100/60 text-stone-600">
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600">Client & Project</th>
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600">Invoice No</th>
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600">Amount</th>
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600">Payment Method</th>
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600">Reference ID</th>
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600">Date</th>
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/40 transition-colors group">
                    <td className="py-4 px-5">
                      <div>
                        <p className="font-bold text-stone-900 text-xs sm:text-sm">{p.clientName || 'General Client'}</p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {p.eventName ? (
                            <span className="text-amber-800 font-semibold">{p.eventName}</span>
                          ) : (
                            <span className="italic text-stone-400">General Balance Deposit</span>
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-mono text-xs">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-stone-100/80 border border-stone-200/80 text-stone-700 font-bold">
                        {p.invoiceNumber || `INV-${p.id}`}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-extrabold text-emerald-700 text-sm tracking-tight">
                      {formatCurrency(p.amount, user?.studioCurrency)}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${getMethodBadgeClass(
                          p.paymentMethod
                        )}`}
                      >
                        {p.paymentMethod?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-xs text-stone-600 font-medium">
                      {p.paymentReference || '—'}
                    </td>
                    <td className="py-4 px-5 text-xs text-stone-600 font-medium">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(p.id, p.invoiceNumber)}
                          disabled={downloadingInvoiceId === p.id}
                          className="neu-glass-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 hover:text-amber-950 transition cursor-pointer disabled:opacity-50"
                          title="Download official GST tax invoice as PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-amber-700" />
                          <span>{downloadingInvoiceId === p.id ? 'Saving...' : 'GST Invoice'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            alert.confirm({
                              title: 'Delete Payment',
                              message: `Delete payment of ${formatCurrency(p.amount, user?.studioCurrency)}? This will update the client balance.`,
                              confirmText: 'Delete Payment',
                              variant: 'danger',
                              onConfirm: () => deletePaymentMutation.mutate(p.id),
                            });
                          }}
                          className="neu-glass-btn p-2 rounded-xl text-stone-400 hover:text-rose-600 transition cursor-pointer"
                          title="Delete payment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="neu-glass-panel max-w-lg w-full rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-white/60">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                  <DollarSign className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-stone-900">Record Client Payment</h3>
                  <p className="text-xs text-stone-500">Record incoming client payment transaction</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="neu-glass-btn text-stone-400 hover:text-stone-700 p-2 rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              {/* Client Selection */}
              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Client *</label>
                <CustomSelect
                  value={selectedClientId}
                  onChange={(val) => {
                    setSelectedClientId(val);
                    setSelectedEventId('');
                  }}
                  placeholder="Select a client..."
                  options={clientsList?.map((c) => ({
                    value: c.id,
                    label: c.name,
                    subtext: c.clientCode,
                  })) || []}
                  className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900"
                />
              </div>

              {/* Event Selection (Optional) */}
              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Associated Event (Optional)</label>
                <CustomSelect
                  value={selectedEventId}
                  onChange={(val) => setSelectedEventId(val)}
                  disabled={!selectedClientId}
                  placeholder={!selectedClientId ? 'Select a client first' : 'General client account deposit'}
                  options={[
                    { value: '', label: 'General client account deposit' },
                    ...(clientEvents?.map((ev) => ({
                      value: ev.id,
                      label: ev.eventName,
                      subtext: ev.eventCode,
                    })) || [])
                  ]}
                  className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900 disabled:opacity-50"
                />
              </div>

              {/* Amount & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 font-bold mb-1.5">Amount ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 1500.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1.5">Payment Method *</label>
                  <CustomSelect
                    value={paymentMethod}
                    onChange={(val) => setPaymentMethod(val)}
                    options={[
                      { value: 'BANK_TRANSFER', label: 'Bank Wire / Transfer' },
                      { value: 'CARD', label: 'Credit / Debit Card' },
                      { value: 'UPI', label: 'UPI / Digital QR' },
                      { value: 'CASH', label: 'Cash in Hand' },
                      { value: 'OTHER', label: 'Other Channel' },
                    ]}
                    className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900"
                  />
                </div>
              </div>

              {/* Reference & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 font-bold mb-1.5">Transaction Reference ID</label>
                  <input
                    type="text"
                    placeholder="e.g. WIRE-88429, TXN-991"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1.5">Payment Date *</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900"
                    required
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Internal Notes / Remarks</label>
                <textarea
                  rows="2"
                  placeholder="Optional internal remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full neu-glass-input rounded-2xl px-4 py-2.5 text-stone-900"
                ></textarea>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200/60">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="neu-glass-btn px-4 py-2.5 rounded-2xl text-stone-700 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPaymentMutation.isPending}
                  className="neu-glass-btn-primary px-5 py-2.5 rounded-2xl text-white font-bold transition disabled:opacity-50 shadow-md cursor-pointer"
                >
                  {createPaymentMutation.isPending ? 'Recording...' : 'Confirm & Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
