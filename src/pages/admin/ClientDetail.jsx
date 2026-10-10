import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  QrCode, 
  Plus, 
  Image as ImageIcon, 
  DollarSign, 
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/currency';
import { useAlert } from '../../context/AlertContext';
import { CustomSelect } from '../../components/CustomSelect';

export const ClientDetail = () => {
  const alert = useAlert();
  const user = useAuthStore((state) => state.user);
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventData, setEventData] = useState({
    eventName: '',
    eventType: 'Wedding',
    eventDate: '',
    location: '',
    description: '',
    status: 'UPCOMING',
  });

  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Fetch client details
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const res = await api.get(`/clients/${id}`);
      return res.data.data;
    },
  });

  // Fetch client events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['client-events', id],
    queryFn: async () => {
      const res = await api.get('/events', { params: { clientId: id } });
      return res.data.data.content || [];
    },
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (payload) => api.post('/events', { ...payload, clientId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-events', id] });
      setEventModalOpen(false);
      setEventData({
        eventName: '',
        eventType: 'Wedding',
        eventDate: '',
        location: '',
        description: '',
        status: 'UPCOMING',
      });
      alert.success('Event scheduled for client successfully!', 'Event Booked');
    },
    onError: (err) => {
      alert.error(err.response?.data?.message || 'Failed to book event.', 'Booking Error');
    }
  });

  const handleCreateEvent = (e) => {
    e.preventDefault();
    createEventMutation.mutate(eventData);
  };

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (eventId) => api.delete(`/events/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-events', id] });
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['all-events'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      alert.success('Event and media files removed.', 'Event Deleted');
    },
    onError: (err) => {
      alert.error(err.response?.data?.message || 'Failed to delete event', 'Delete Error');
    },
  });

  const handleDeleteEvent = () => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete.id);
    }
  };

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-400">
        <span className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20 text-stone-500">
        <p>Client profile not found</p>
        <button
          onClick={() => navigate('/admin/clients')}
          className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-xs text-stone-800 rounded-xl transition"
        >
          Return to Client Directory
        </button>
      </div>
    );
  }

  const total = Number(client.totalAmount || 0);
  const paid = Number(client.amountPaid || 0);
  const balance = Number(client.balanceAmount || 0);
  const percentPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 100;

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Top Nav Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/clients')}
          className="flex items-center space-x-2 text-xs font-semibold text-stone-600 hover:text-stone-900 px-3.5 py-2 rounded-full neu-glass-btn transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Client Directory</span>
        </button>
      </div>

      {/* Client Header Card */}
      <div className="neu-glass-panel rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-xl text-white shadow-md shadow-amber-600/30 shrink-0">
            {client.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight drop-shadow-xs">{client.name}</h1>
              <span className="text-xs font-mono font-bold text-amber-900 px-2.5 py-1 rounded-full neu-glass-input">
                {client.clientCode}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 mt-2.5 text-xs text-stone-600 font-medium">
              {client.email && (
                <div className="flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-700" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-700" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.city && (
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-700" />
                  <span>{client.city}, {client.state || client.country}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setEventModalOpen(true)}
            className="neu-glass-btn-primary px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Event</span>
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="neu-glass-card rounded-3xl p-6">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Booked Package</span>
          <p className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-2">
            {formatCurrency(total, user?.studioCurrency)}
          </p>
          <div className="w-full bg-stone-200/60 rounded-full h-2 mt-4 overflow-hidden shadow-inner">
            <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${percentPaid}%` }}></div>
          </div>
        </div>

        <div className="neu-glass-card rounded-3xl p-6">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Amount Collected</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight mt-2">
            {formatCurrency(paid, user?.studioCurrency)}
          </p>
          <p className="text-xs font-semibold text-stone-600 mt-2">{percentPaid}% of package collected</p>
        </div>

        <div className="neu-glass-card rounded-3xl p-6">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Balance Outstanding</span>
          <p className={`text-2xl sm:text-3xl font-black tracking-tight mt-2 ${balance > 0 ? 'text-amber-900' : 'text-stone-400'}`}>
            {formatCurrency(balance, user?.studioCurrency)}
          </p>
          <p className="text-xs font-semibold text-stone-600 mt-2">
            {balance > 0 ? 'Payment pending' : 'Zero balance — Fully settled'}
          </p>
        </div>
      </div>

      {/* Events List */}
      <div className="neu-glass-panel rounded-3xl p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-stone-900 tracking-tight">Events for this Client</h2>
            <p className="text-xs font-medium text-stone-500 mt-0.5">All photo shoots, ceremonies, and celebrations</p>
          </div>
        </div>

        {eventsLoading ? (
          <div className="py-12 text-center text-stone-400">
            <span className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin inline-block"></span>
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <Calendar className="w-8 h-8 mx-auto text-stone-300 mb-2" />
            <p className="text-xs font-medium text-stone-500">No events scheduled for this client yet.</p>
            <button
              onClick={() => setEventModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl neu-glass-btn text-xs font-bold text-amber-900 hover:text-amber-950 transition"
            >
              Add First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-5 sm:p-6 rounded-3xl neu-glass-card flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold text-amber-900 neu-glass-input px-2.5 py-0.5 rounded-full">
                      {event.eventCode}
                    </span>
                    <span className="text-[10px] font-bold text-sky-800 bg-sky-100/70 border border-sky-300/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {event.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-stone-900 text-base">{event.eventName}</h3>
                  <p className="text-xs font-medium text-stone-500 mt-1">{event.eventType} • {event.eventDate}</p>
                  {event.location && (
                    <p className="text-xs text-stone-600 mt-2 flex items-center space-x-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-amber-700" />
                      <span>{event.location}</span>
                    </p>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-stone-200/60 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-stone-600 bg-stone-100/80 border border-stone-200/70 px-3 py-1 rounded-xl whitespace-nowrap shadow-2xs">
                      {event.albumCount} {event.albumCount === 1 ? 'Album' : 'Albums'} • {event.mediaCount} {event.mediaCount === 1 ? 'Asset' : 'Assets'}
                    </span>

                    <button
                      onClick={() => {
                        alert.confirm({
                          title: 'Delete Event',
                          message: `Are you sure you want to permanently delete "${event.eventName}"? All associated albums and media will be removed.`,
                          confirmText: 'Delete Event',
                          variant: 'danger',
                          onConfirm: () => deleteEventMutation.mutate(event.id),
                        });
                      }}
                      className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl neu-glass-btn transition cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => navigate(`/admin/albums?eventId=${event.id}`)}
                      className="neu-glass-btn px-3 py-2 rounded-2xl text-stone-800 hover:text-amber-900 font-extrabold text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
                      <span>Albums</span>
                    </button>

                    {event.qrToken ? (
                      <a
                        href={`/gallery/${event.qrToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="neu-glass-btn-primary px-3 py-2 rounded-2xl text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Live Gallery</span>
                      </a>
                    ) : (
                      <span className="px-3 py-2 rounded-2xl bg-stone-100/70 text-stone-400 font-semibold text-xs flex items-center justify-center space-x-1.5 border border-stone-200/50">
                        <QrCode className="w-3.5 h-3.5" />
                        <span>No QR</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Book Event Modal */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-md">
          <div className="neu-glass-panel border border-white/60 w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/60">
              <h3 className="font-extrabold text-stone-900 text-base">Book New Event for {client.name}</h3>
              <button onClick={() => setEventModalOpen(false)} className="p-1 rounded-full neu-glass-btn text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 mt-4 text-xs font-semibold">
              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Event Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding Ceremony & Reception"
                  value={eventData.eventName}
                  onChange={(e) => setEventData({ ...eventData, eventName: e.target.value })}
                  className="w-full px-3.5 py-2.5 neu-glass-input text-stone-900 placeholder-stone-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1.5">Event Type *</label>
                  <CustomSelect
                    value={eventData.eventType}
                    onChange={(val) => setEventData({ ...eventData, eventType: val })}
                    options={[
                      { value: 'Wedding', label: 'Wedding' },
                      { value: 'Reception', label: 'Reception' },
                      { value: 'Pre-Wedding', label: 'Pre-Wedding' },
                      { value: 'Engagement', label: 'Engagement' },
                      { value: 'Birthday', label: 'Birthday' },
                      { value: 'Baby Shoot', label: 'Baby Shoot' },
                      { value: 'Corporate Event', label: 'Corporate Event' },
                      { value: 'Fashion Shoot', label: 'Fashion Shoot' },
                    ]}
                    className="w-full neu-glass-input px-3.5 py-2.5 text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1.5">Date *</label>
                  <input
                    type="date"
                    required
                    value={eventData.eventDate}
                    onChange={(e) => setEventData({ ...eventData, eventDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 neu-glass-input text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Location / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. The Plaza Hotel, NYC"
                  value={eventData.location}
                  onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 neu-glass-input text-stone-900 placeholder-stone-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Notes & Schedule</label>
                <textarea
                  rows="2"
                  placeholder="Ceremony times, team assignment notes..."
                  value={eventData.description}
                  onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 neu-glass-input text-stone-900 placeholder-stone-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-200/60">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 py-2 neu-glass-btn text-stone-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEventMutation.isPending}
                  className="px-5 py-2.5 neu-glass-btn-primary rounded-xl font-bold disabled:opacity-50 transition"
                >
                  {createEventMutation.isPending ? 'Booking...' : 'Book Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Event Confirmation Modal */}
      {deleteModalOpen && eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-md">
          <div className="neu-glass-panel border border-white/60 w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-stone-900 text-base">Delete Event</h3>
                <p className="text-xs font-medium text-stone-500 mt-0.5">
                  Are you sure you want to permanently delete this event?
                </p>
              </div>
              <button 
                onClick={() => { setDeleteModalOpen(false); setEventToDelete(null); }}
                className="p-1 rounded-full neu-glass-btn text-stone-400 hover:text-stone-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 p-4 neu-glass-card rounded-2xl text-xs space-y-2.5 font-medium">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Event:</span>
                <span className="font-bold text-stone-900 truncate max-w-[220px]">{eventToDelete.eventName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Code:</span>
                <span className="font-mono text-amber-900 font-bold neu-glass-input px-2 py-0.5 rounded-full">{eventToDelete.eventCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Type & Date:</span>
                <span className="font-semibold text-stone-800">{eventToDelete.eventType} • {eventToDelete.eventDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Content:</span>
                <span className="text-stone-700 font-semibold">{eventToDelete.albumCount || 0} Albums • {eventToDelete.mediaCount || 0} Media items</span>
              </div>
            </div>

            <div className="mt-4 flex items-start space-x-2.5 text-xs text-rose-800 bg-rose-50/90 border border-rose-200/80 rounded-2xl p-3.5 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-relaxed">
                All associated albums, uploaded media files, and guest QR gallery tokens will be permanently removed. This action cannot be undone.
              </span>
            </div>

            {deleteError && (
              <p className="mt-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {deleteError}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => { setDeleteModalOpen(false); setEventToDelete(null); }}
                className="px-4 py-2 neu-glass-btn text-stone-700 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEvent}
                disabled={deleteEventMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 disabled:opacity-50 shadow-sm transition"
              >
                {deleteEventMutation.isPending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Event</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetail;
