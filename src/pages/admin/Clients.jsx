import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit2, 
  Archive, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  X, 
  AlertCircle,
  QrCode,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import { useAlert } from '../../context/AlertContext';
import { CustomSelect } from '../../components/CustomSelect';

export const Clients = () => {
  const alert = useAlert();
  const user = useAuthStore((state) => state.user);
  const currencySymbol = getCurrencySymbol(user?.studioCurrency);
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const [page, setPage] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteModalClient, setDeleteModalClient] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    country: 'USA',
    notes: '',
    totalAmount: '',
    status: 'ACTIVE',
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch clients
  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, search, status],
    queryFn: async () => {
      const params = { page, size: 10 };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await api.get('/clients', { params });
      return res.data.data;
    },
  });

  // Create or Update mutation
  const saveMutation = useMutation({
    mutationFn: async (clientData) => {
      if (editingClient) {
        return api.put(`/clients/${editingClient.id}`, clientData);
      }
      return api.post('/clients', clientData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setModalOpen(false);
      setEditingClient(null);
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (id) => api.patch(`/clients/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: ({ id, code }) => api.delete(`/clients/${id}`, { params: { confirmationCode: code } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setDeleteModalClient(null);
      setDeleteConfirmText('');
    },
    onError: (err) => {
      setDeleteError(err.response?.data?.message || 'Delete failed');
    },
  });

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      alternatePhone: '',
      address: '',
      city: '',
      state: '',
      country: 'USA',
      notes: '',
      totalAmount: '',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      alternatePhone: client.alternatePhone || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      country: client.country || 'USA',
      notes: client.notes || '',
      totalAmount: client.totalAmount ? String(client.totalAmount) : '',
      status: client.status || 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : 0,
    };
    saveMutation.mutate(payload);
  };

  const handleDeleteSubmit = (e) => {
    e.preventDefault();
    setDeleteError('');
    deleteMutation.mutate({ id: deleteModalClient.id, code: deleteConfirmText });
  };

  const clientsList = data?.content || [];

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight drop-shadow-xs">Client Directory</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-normal leading-relaxed">
            Manage your photography studio clients, package billing balances, and associated events.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="neu-glass-btn-primary px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="neu-glass-panel p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by client name, email, code..."
            value={search}
            onChange={(e) => setSearchParams({ search: e.target.value, status })}
            className="w-full pl-10 pr-4 py-2.5 rounded-full neu-glass-input text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-600/60 shadow-[inset_2px_2px_5px_rgba(166,178,197,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-stone-400 shrink-0" />
          <CustomSelect
            value={status}
            onChange={(val) => setSearchParams({ search, status: val })}
            placeholder="All Statuses"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active', badge: 'Active', badgeColor: 'bg-emerald-50 text-emerald-700' },
              { value: 'ARCHIVED', label: 'Archived', badge: 'Archived', badgeColor: 'bg-stone-100 text-stone-600' },
            ]}
            className="w-40 neu-glass-pill rounded-full px-3.5 py-2 text-xs font-semibold text-stone-700"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="neu-glass-panel rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-fixed min-w-[920px]">
            <thead className="bg-stone-100/60 border-b border-stone-200/60 text-stone-600 font-bold tracking-wider text-[11px] uppercase">
              <tr>
                <th className="w-[21%] px-3.5 py-3.5 whitespace-nowrap">Client</th>
                <th className="w-[16%] px-3.5 py-3.5 whitespace-nowrap">Contact</th>
                <th className="w-[11%] px-3.5 py-3.5 whitespace-nowrap">Location</th>
                <th className="w-[10%] px-3.5 py-3.5 whitespace-nowrap">Package</th>
                <th className="w-[10%] px-3.5 py-3.5 whitespace-nowrap">Paid</th>
                <th className="w-[10%] px-3.5 py-3.5 whitespace-nowrap">Balance</th>
                <th className="w-[9%] px-3 py-3.5 whitespace-nowrap text-center">Status</th>
                <th className="w-[13%] px-3.5 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-stone-400">
                    <span className="inline-block w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                  </td>
                </tr>
              ) : clientsList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-16 text-stone-400">
                    <Users className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-700 text-sm">No clients found</p>
                    <p className="text-xs mt-1 text-stone-400">Create your first client to start booking events.</p>
                  </td>
                </tr>
              ) : (
                clientsList.map((client) => {
                  const hasBalance = client.balanceAmount > 0;
                  return (
                    <tr key={client.id} className="hover:bg-amber-50/20 transition-colors group">
                      {/* Client */}
                      <td className="px-3.5 py-3">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/90 text-amber-900 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p 
                              className="font-bold text-stone-900 hover:text-amber-700 transition cursor-pointer text-xs leading-snug truncate"
                              onClick={() => navigate(`/admin/clients/${client.id}`)}
                              title={client.name}
                            >
                              {client.name}
                            </p>
                            <span className="inline-block text-[10px] font-mono text-amber-900 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded mt-0.5 font-semibold">
                              {client.clientCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-3.5 py-3">
                        <div className="space-y-0.5 min-w-0">
                          {client.email && (
                            <div className="flex items-center space-x-1.5 text-stone-700 text-xs font-medium min-w-0" title={client.email}>
                              <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center space-x-1.5 text-stone-500 text-[11px] min-w-0" title={client.phone}>
                              <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                              <span className="truncate">{client.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-3.5 py-3 text-stone-600 text-xs">
                        <span className="truncate block" title={client.city ? `${client.city}, ${client.state || client.country}` : ''}>
                          {client.city ? `${client.city}, ${client.state || client.country}` : <span className="text-stone-300">—</span>}
                        </span>
                      </td>

                      {/* Package */}
                      <td className="px-3.5 py-3 font-bold text-stone-900 text-xs font-mono whitespace-nowrap">
                        {formatCurrency(client.totalAmount, user?.studioCurrency)}
                      </td>

                      {/* Paid */}
                      <td className="px-3.5 py-3 font-bold text-emerald-700 text-xs font-mono whitespace-nowrap">
                        {formatCurrency(client.amountPaid, user?.studioCurrency)}
                      </td>

                      {/* Balance */}
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        {hasBalance ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-amber-900 text-xs font-mono">
                              {formatCurrency(client.balanceAmount, user?.studioCurrency)}
                            </span>
                            <span className="text-[10px] text-amber-700 font-medium">due</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Paid</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-2 py-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          client.status === 'ACTIVE'
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-700'
                            : 'bg-stone-100 border-stone-200 text-stone-600'
                        }`}>
                          {client.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="pl-1 pr-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => navigate(`/admin/clients/${client.id}`)}
                            title="View Profile & Events"
                            className="p-1.5 neu-glass-btn text-stone-500 hover:text-stone-900 rounded-xl transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(client)}
                            title="Edit Client"
                            className="p-1.5 neu-glass-btn text-stone-500 hover:text-amber-800 rounded-xl transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {client.status === 'ACTIVE' && (
                            <button
                              onClick={() => archiveMutation.mutate(client.id)}
                              title="Archive Client"
                              className="p-1.5 neu-glass-btn text-stone-500 hover:text-sky-700 rounded-xl transition"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setDeleteModalClient(client);
                              setDeleteConfirmText('');
                              setDeleteError('');
                            }}
                            title="Permanent Delete"
                            className="p-1.5 neu-glass-btn text-stone-400 hover:text-rose-600 rounded-xl transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-white/80 flex items-center justify-between text-xs text-stone-500 bg-white/40 backdrop-blur-md">
            <span>Showing {clientsList.length} of {data.totalElements} clients</span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 neu-glass-btn text-stone-700 rounded-xl disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-semibold text-stone-700 px-1">Page {page + 1} of {data.totalPages}</span>
              <button
                disabled={data.last}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 neu-glass-btn text-stone-700 rounded-xl disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/45 backdrop-blur-md">
          <div className="neu-glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200/80">
              <h2 className="text-base font-extrabold text-stone-900 tracking-tight">
                {editingClient ? 'Edit Client Details' : 'Create New Client'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 neu-glass-btn text-stone-500 hover:text-stone-900 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Full Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Rajesh Kumar & Priya Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="client@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/10"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Primary Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">City</label>
                  <input
                    type="text"
                    placeholder="New York"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/10"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">State</label>
                  <input
                    type="text"
                    placeholder="NY"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/10"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Total Package ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="5000.00"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/10 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Internal Notes & Shoot Requirements</label>
                <textarea
                  rows="3"
                  placeholder="Destination package details, special requests, venue coordinator contacts..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/10"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-200/80">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 neu-glass-btn text-stone-700 rounded-xl transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="neu-glass-btn-primary px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : editingClient ? 'Update Client' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {deleteModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/45 backdrop-blur-md">
          <div className="neu-glass-panel w-full max-w-md rounded-3xl p-6 sm:p-7 border border-rose-300/80 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-extrabold text-stone-900 tracking-tight">Permanent Client Deletion</h3>
            </div>
            <p className="text-xs text-stone-600 mb-3 leading-relaxed">
              This action cannot be undone. To prevent accidental data loss, you must confirm by typing:
            </p>
            <div className="p-3 rounded-xl neu-glass-inset-sm font-mono text-xs text-rose-700 mb-4 select-all font-bold">
              DELETE {deleteModalClient.clientCode}
            </div>

            {deleteError && (
              <p className="text-xs text-rose-600 mb-3">{deleteError}</p>
            )}

            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              <input
                type="text"
                required
                placeholder={`Type DELETE ${deleteModalClient.clientCode}`}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl neu-glass-input text-xs text-stone-900 focus:outline-none focus:border-rose-500"
              />

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalClient(null)}
                  className="px-4 py-2.5 neu-glass-btn text-stone-700 text-xs rounded-xl transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirmText !== `DELETE ${deleteModalClient.clientCode}` || deleteMutation.isPending}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl disabled:opacity-40 transition shadow-md shadow-rose-600/30"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Confirm Permanent Deletion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
