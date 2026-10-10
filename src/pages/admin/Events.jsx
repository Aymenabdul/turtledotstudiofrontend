import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Plus, 
  Search, 
  MapPin, 
  QrCode, 
  Image as ImageIcon, 
  X, 
  Trash2, 
  Pencil,
  FileText,
  Tag,
  Users,
  Check,
  Mail,
  UserCheck
} from 'lucide-react';
import api from '../../api/axios';
import { useAlert } from '../../context/AlertContext';
import { CustomSelect } from '../../components/CustomSelect';

const EVENT_TYPE_OPTIONS = [
  { value: 'Wedding', label: 'Wedding' },
  { value: 'Reception', label: 'Reception' },
  { value: 'Pre-Wedding', label: 'Pre-Wedding' },
  { value: 'Engagement', label: 'Engagement' },
  { value: 'Maternity', label: 'Maternity' },
  { value: 'Baby Shower', label: 'Baby Shower' },
  { value: 'Birthday', label: 'Birthday' },
  { value: 'Corporate', label: 'Corporate' },
  { value: 'Fashion', label: 'Fashion' },
  { value: 'Portrait', label: 'Portrait' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Other', label: 'Other' },
];

const EVENT_STATUS_OPTIONS = [
  { value: 'UPCOMING', label: 'Upcoming', badge: 'Upcoming', badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200' },
  { value: 'IN_PROGRESS', label: 'In Progress', badge: 'In Progress', badgeColor: 'bg-sky-50 text-sky-800 border border-sky-200' },
  { value: 'COMPLETED', label: 'Completed', badge: 'Completed', badgeColor: 'bg-purple-50 text-purple-800 border border-purple-200' },
  { value: 'DELIVERED', label: 'Delivered', badge: 'Delivered', badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200' },
];

export const Events = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const alert = useAlert();

  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createData, setCreateData] = useState({
    clientId: '',
    eventName: '',
    eventType: 'Wedding',
    eventDate: '',
    location: '',
    description: '',
    status: 'UPCOMING',
    assignedEmployeeIds: [],
  });

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editData, setEditData] = useState({
    clientId: '',
    eventName: '',
    eventType: 'Wedding',
    eventDate: '',
    location: '',
    description: '',
    status: 'UPCOMING',
    assignedEmployeeIds: [],
  });

  // Fetch events
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['all-events', search, selectedClient, selectedStatus],
    queryFn: async () => {
      const params = { size: 50 };
      if (search) params.search = search;
      if (selectedClient) params.clientId = selectedClient;
      if (selectedStatus) params.status = selectedStatus;
      const res = await api.get('/events', { params });
      return res.data.data.content || [];
    },
  });

  // Fetch clients for dropdown
  const { data: clients } = useQuery({
    queryKey: ['clients-dropdown'],
    queryFn: async () => {
      const res = await api.get('/clients', { params: { size: 100 } });
      return res.data.data.content || [];
    },
  });

  // Fetch employees for assignment
  const { data: employees } = useQuery({
    queryKey: ['employees-dropdown'],
    queryFn: async () => {
      const res = await api.get('/employees', { params: { size: 100 } });
      return res.data.data.content || [];
    },
  });

  const clientOptions = (clients || []).map((c) => ({
    value: c.id,
    label: c.name,
    subtext: c.clientCode,
  }));

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/events', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminUpcomingEvents'] });
      queryClient.invalidateQueries({ queryKey: ['employeeUpcomingEvents'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['all-clients-list'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-dropdown'] });
      setCreateModalOpen(false);
      setCreateData({
        clientId: '',
        eventName: '',
        eventType: 'Wedding',
        eventDate: '',
        location: '',
        description: '',
        status: 'UPCOMING',
        assignedEmployeeIds: [],
      });
      alert.success('Event scheduled successfully! Assignment & booking emails dispatched.', 'Event Created');
    },
    onError: (err) => {
      alert.error(err.response?.data?.message || 'Failed to create event. Please verify details.', 'Booking Error');
    }
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/events/${id}`, payload),
    onSuccess: (res) => {
      const updatedEvent = res?.data?.data;
      if (updatedEvent) {
        queryClient.setQueriesData({ queryKey: ['all-events'] }, (old) => {
          if (!old) return old;
          if (Array.isArray(old)) {
            return old.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev);
          }
          if (old.content && Array.isArray(old.content)) {
            return {
              ...old,
              content: old.content.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev)
            };
          }
          return old;
        });
      }
      queryClient.invalidateQueries({ queryKey: ['all-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminUpcomingEvents'] });
      queryClient.invalidateQueries({ queryKey: ['employeeUpcomingEvents'] });
      queryClient.invalidateQueries({ queryKey: ['events-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['all-clients-list'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-dropdown'] });
      setEditModalOpen(false);
      setEditingEventId(null);
      alert.success('Event details and crew assignments updated successfully!', 'Event Updated');
    },
    onError: (err) => {
      alert.error(err.response?.data?.message || 'Failed to update event.', 'Update Error');
    }
  });

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: (eventId) => api.delete(`/events/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminUpcomingEvents'] });
      queryClient.invalidateQueries({ queryKey: ['employeeUpcomingEvents'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['all-clients-list'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['events-dropdown'] });
      alert.success('Event and all associated media have been removed.', 'Event Deleted');
    },
    onError: (err) => {
      alert.error(err.response?.data?.message || 'Failed to delete event.', 'Delete Error');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!createData.clientId) {
      alert.warning('Please select a client for this event.', 'Client Required');
      return;
    }
    createMutation.mutate(createData);
  };

  const handleOpenEdit = (ev) => {
    setEditingEventId(ev.id);
    setEditData({
      clientId: ev.clientId || '',
      eventName: ev.eventName || '',
      eventType: ev.eventType || 'Wedding',
      eventDate: ev.eventDate || '',
      location: ev.location || '',
      description: ev.description || '',
      status: ev.status || 'UPCOMING',
      assignedEmployeeIds: ev.assignedEmployeeIds ? [...ev.assignedEmployeeIds] : [],
    });
    setEditModalOpen(true);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editData.clientId) {
      alert.warning('Please select a client for this event.', 'Client Required');
      return;
    }
    updateMutation.mutate({
      id: editingEventId,
      payload: editData,
    });
  };

  const handleDeletePrompt = (ev) => {
    alert.confirm({
      title: 'Delete Event',
      message: `Are you sure you want to permanently delete event "${ev.eventName}" (${ev.eventCode})? All associated albums, media items, and client QR gallery tokens will be permanently removed.`,
      confirmText: 'Delete Event',
      variant: 'danger',
      onConfirm: () => deleteMutation.mutate(ev.id),
    });
  };

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight drop-shadow-xs">Events Management</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 font-normal leading-relaxed">
            Track all client photo shoots, weddings, receptions, and scheduled portrait sessions.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="neu-glass-btn-primary px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Event</span>
        </button>
      </div>

      {/* Filters with Custom Selects */}
      <div className="neu-glass-panel p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search events by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full neu-glass-input text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600/60 shadow-[inset_2px_2px_5px_rgba(166,178,197,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Custom Select for Clients */}
          <CustomSelect
            value={selectedClient}
            onChange={setSelectedClient}
            placeholder="All Clients"
            options={[
              { value: '', label: 'All Clients' },
              ...clientOptions,
            ]}
            className="w-48 neu-glass-pill rounded-full px-3.5 py-2 text-xs font-semibold text-stone-700"
          />

          {/* Custom Select for Status */}
          <CustomSelect
            value={selectedStatus}
            onChange={setSelectedStatus}
            placeholder="All Statuses"
            options={[
              { value: '', label: 'All Statuses' },
              ...EVENT_STATUS_OPTIONS,
            ]}
            className="w-40 neu-glass-pill rounded-full px-3.5 py-2 text-xs font-semibold text-stone-700"
          />
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-stone-400">
            <span className="inline-block w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : eventsData?.length === 0 ? (
          <div className="col-span-full neu-glass-panel py-16 text-center text-stone-400 rounded-3xl">
            <Calendar className="w-8 h-8 mx-auto text-stone-300 mb-2" />
            <p className="font-semibold text-stone-700 text-sm">No events found matching your criteria</p>
            <p className="text-xs text-stone-400 mt-1">Book a new event for one of your clients.</p>
          </div>
        ) : (
          eventsData.map((ev) => (
            <div
              key={ev.id}
              className="neu-glass-card p-6 sm:p-7 rounded-3xl flex flex-col justify-between group hover:-translate-y-1 transition-all duration-200 border border-white/80 shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-50/90 border border-amber-200/80 px-2.5 py-1 rounded-xl shadow-2xs">
                    {ev.eventCode}
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs ${
                    ev.status === 'DELIVERED' 
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-200' 
                      : ev.status === 'UPCOMING'
                      ? 'text-amber-800 bg-amber-50 border-amber-200'
                      : ev.status === 'COMPLETED'
                      ? 'text-purple-800 bg-purple-50 border-purple-200'
                      : 'text-sky-800 bg-sky-50 border-sky-200'
                  }`}>
                    {ev.status}
                  </span>
                </div>

                <h3 className="text-lg font-black text-stone-900 group-hover:text-amber-800 transition tracking-tight leading-snug">
                  {ev.eventName}
                </h3>
                <p className="text-xs text-stone-500 mt-1.5 font-medium flex items-center gap-1.5">
                  <span className="text-stone-400">Client:</span>
                  <span className="text-stone-800 font-bold">{ev.clientName}</span>
                </p>

                <div className="mt-4 pt-3.5 border-t border-stone-200/50 space-y-2.5 text-xs text-stone-600">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60 shadow-2xs">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-stone-800">{ev.eventType}</span>
                    <span className="text-stone-300">•</span>
                    <span className="font-mono text-stone-600 font-medium">{ev.eventDate}</span>
                  </div>
                  {ev.location && (
                    <div className="flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded-lg bg-stone-100 text-stone-500 flex items-center justify-center shrink-0 border border-stone-200/60 shadow-2xs">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate text-stone-600 font-medium">{ev.location}</span>
                    </div>
                  )}
                </div>

                {/* Assigned Crew Section */}
                <div className="mt-4 pt-3 border-t border-stone-200/50">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-600" />
                      <span>Assigned Crew</span>
                    </span>
                    {ev.assignedEmployeeNames?.length > 0 && (
                      <span className="text-amber-800 font-mono font-semibold text-[10px]">
                        {ev.assignedEmployeeNames.length} {ev.assignedEmployeeNames.length === 1 ? 'member' : 'members'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ev.assignedEmployeeNames && ev.assignedEmployeeNames.length > 0 ? (
                      ev.assignedEmployeeNames.map((name, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-900 bg-amber-50/90 border border-amber-200/80 px-2.5 py-1 rounded-xl shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                          <span>{name}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-stone-400 italic">
                        Unassigned staff
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-stone-200/60 space-y-3">
                {/* Stats & Edit/Delete Utility Row */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-stone-600 bg-stone-100/80 border border-stone-200/70 px-3 py-1 rounded-xl whitespace-nowrap shadow-2xs">
                    {ev.albumCount} {ev.albumCount === 1 ? 'Album' : 'Albums'} • {ev.mediaCount} {ev.mediaCount === 1 ? 'Asset' : 'Assets'}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleOpenEdit(ev)}
                      className="p-2 neu-glass-btn text-stone-500 hover:text-amber-800 rounded-xl transition cursor-pointer"
                      title="Edit Event"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePrompt(ev)}
                      className="p-2 neu-glass-btn text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Primary Action Buttons (Spacious & Grid Aligned) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => navigate(`/admin/albums?eventId=${ev.id}`)}
                    className="neu-glass-btn px-3 py-2 rounded-2xl text-stone-800 hover:text-amber-900 font-extrabold text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs hover:shadow-md"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
                    <span>Albums</span>
                  </button>

                  {ev.qrToken ? (
                    <a
                      href={`/gallery/${ev.qrToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="neu-glass-btn-primary px-3 py-2 rounded-2xl text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs hover:shadow-md"
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
          ))
        )}
      </div>

      {/* Book New Event Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-white border border-stone-200 w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Schedule New Event</h3>
                  <p className="text-[11px] text-stone-500">Book shoot date, location, and assign creative crew</p>
                </div>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 mt-4 text-xs overflow-y-auto pr-1">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Select Client *</label>
                <CustomSelect
                  value={createData.clientId}
                  onChange={(val) => {
                    const clientEmpIds = (employees || [])
                      .filter(emp => emp.assignedClientIds?.includes(Number(val)))
                      .map(emp => emp.id);
                    setCreateData(prev => ({
                      ...prev,
                      clientId: val,
                      assignedEmployeeIds: prev.assignedEmployeeIds && prev.assignedEmployeeIds.length > 0 
                        ? prev.assignedEmployeeIds 
                        : clientEmpIds
                    }));
                  }}
                  placeholder="-- Choose Client --"
                  options={clientOptions}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus-within:bg-white focus-within:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wedding Reception & Dance Party"
                  value={createData.eventName}
                  onChange={(e) => setCreateData({ ...createData, eventName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Type *</label>
                  <CustomSelect
                    value={createData.eventType}
                    onChange={(val) => setCreateData({ ...createData, eventType: val })}
                    options={EVENT_TYPE_OPTIONS}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus-within:bg-white focus-within:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={createData.eventDate}
                    onChange={(e) => setCreateData({ ...createData, eventDate: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Location / Venue</label>
                <input
                  type="text"
                  placeholder="Grand Ballroom, Hotel Plaza, NY"
                  value={createData.location}
                  onChange={(e) => setCreateData({ ...createData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600"
                />
              </div>

              {/* Assign Employees / Photographers Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-stone-700 font-semibold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>Assign Staff Photographers / Crew</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {createData.assignedEmployeeIds.length} selected
                  </span>
                </div>
                
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 max-h-44 overflow-y-auto space-y-1.5">
                  {employees && employees.length > 0 ? (
                    employees.map((emp) => {
                      const isSelected = createData.assignedEmployeeIds.includes(emp.id);
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            if (!isSelected && (createData.assignedEmployeeIds?.length || 0) >= 3) {
                              alert.warning('Maximum 3 crew members can be assigned to an event/client.', 'Capacity Reached');
                              return;
                            }
                            setCreateData(prev => ({
                              ...prev,
                              assignedEmployeeIds: isSelected
                                ? prev.assignedEmployeeIds.filter(id => id !== emp.id)
                                : [...prev.assignedEmployeeIds, emp.id]
                            }));
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-amber-50/90 border-amber-300 shadow-2xs' 
                              : 'bg-white border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              isSelected ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
                            }`}>
                              {emp.fullName?.charAt(0) || 'E'}
                            </div>
                            <div className="min-w-0 truncate">
                              <p className="font-bold text-stone-900 truncate leading-snug">{emp.fullName}</p>
                              <p className="text-[10px] text-stone-500 truncate">
                                <span className="font-mono text-amber-800 font-medium mr-1">{emp.employeeCode}</span>
                                • {emp.designation || 'Staff'}
                              </p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                            isSelected 
                              ? 'bg-amber-600 border-amber-600 text-white' 
                              : 'border-stone-300 bg-stone-50'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-stone-400 py-3 text-center text-[11px]">
                      No employee accounts created yet. Add photographers in Staff Management.
                    </div>
                  )}
                </div>

                <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-900 bg-amber-50/90 p-2.5 rounded-xl border border-amber-200/80">
                  <Mail className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Automatic Notifications:</strong> An event assignment email will be sent to the assigned staff, and an event booking confirmation will be sent to the client.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional shoot schedule, client preferences, or special instructions..."
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl disabled:opacity-50 shadow-sm transition"
                >
                  {createMutation.isPending ? 'Booking & Dispatching...' : 'Book Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-white border border-stone-200 w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Edit Event Details</h3>
                  <p className="text-[11px] text-stone-500">Update scheduled shoot parameters and assigned crew</p>
                </div>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3.5 mt-4 text-xs overflow-y-auto pr-1">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Client *</label>
                <CustomSelect
                  value={editData.clientId}
                  onChange={(val) => setEditData({ ...editData, clientId: val })}
                  placeholder="-- Choose Client --"
                  options={clientOptions}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus-within:bg-white focus-within:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Event title"
                  value={editData.eventName}
                  onChange={(e) => setEditData({ ...editData, eventName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Type *</label>
                  <CustomSelect
                    value={editData.eventType}
                    onChange={(val) => setEditData({ ...editData, eventType: val })}
                    options={EVENT_TYPE_OPTIONS}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus-within:bg-white focus-within:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={editData.eventDate}
                    onChange={(e) => setEditData({ ...editData, eventDate: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                  <label className="block text-stone-700 font-medium mb-1">Status *</label>
                  <CustomSelect
                    value={editData.status}
                    onChange={(val) => setEditData({ ...editData, status: val })}
                    options={EVENT_STATUS_OPTIONS}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus-within:bg-white focus-within:border-amber-600"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-stone-700 font-medium mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Venue location"
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Assign Employees / Photographers Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-stone-700 font-semibold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>Assign Staff Photographers / Crew</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {editData.assignedEmployeeIds.length} selected
                  </span>
                </div>
                
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 max-h-44 overflow-y-auto space-y-1.5">
                  {employees && employees.length > 0 ? (
                    employees.map((emp) => {
                      const isSelected = editData.assignedEmployeeIds.includes(emp.id);
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            if (!isSelected && (editData.assignedEmployeeIds?.length || 0) >= 3) {
                              alert.warning('Maximum 3 crew members can be assigned to an event/client.', 'Capacity Reached');
                              return;
                            }
                            setEditData(prev => ({
                              ...prev,
                              assignedEmployeeIds: isSelected
                                ? prev.assignedEmployeeIds.filter(id => id !== emp.id)
                                : [...prev.assignedEmployeeIds, emp.id]
                            }));
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-amber-50/90 border-amber-300 shadow-2xs' 
                              : 'bg-white border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                              isSelected ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
                            }`}>
                              {emp.fullName?.charAt(0) || 'E'}
                            </div>
                            <div className="min-w-0 truncate">
                              <p className="font-bold text-stone-900 truncate leading-snug">{emp.fullName}</p>
                              <p className="text-[10px] text-stone-500 truncate">
                                <span className="font-mono text-amber-800 font-medium mr-1">{emp.employeeCode}</span>
                                • {emp.designation || 'Staff'}
                              </p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                            isSelected 
                              ? 'bg-amber-600 border-amber-600 text-white' 
                              : 'border-stone-300 bg-stone-50'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-stone-400 py-3 text-center text-[11px]">
                      No employee accounts created yet.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or details..."
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 focus:bg-white focus:outline-none focus:border-amber-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl disabled:opacity-50 shadow-sm transition"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
