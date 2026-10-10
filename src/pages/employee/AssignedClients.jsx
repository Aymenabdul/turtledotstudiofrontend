import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Phone, Mail, Calendar, UploadCloud, ArrowRight } from 'lucide-react';
import api from '../../api/axios';

export const AssignedClients = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['employee-assigned-clients', search],
    queryFn: async () => {
      const params = { size: 50 };
      if (search) params.search = search;
      const res = await api.get('/clients', { params });
      return res.data.data.content || [];
    },
  });

  return (
    <div className="space-y-6 sm:space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight drop-shadow-xs">Assigned Client Roster</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Clients you are assigned to photograph, manage albums, and upload media for.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search your clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 neu-glass-input rounded-full text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-stone-400">
            <span className="inline-block w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : clientsData?.length === 0 ? (
          <div className="col-span-full neu-glass-panel py-16 text-center text-stone-400 rounded-3xl">
            <Users className="w-10 h-10 mx-auto text-stone-300 mb-3" />
            <p className="font-bold text-stone-700 text-sm">No clients currently assigned to you</p>
            <p className="text-xs text-stone-400 mt-1">Contact your studio manager to assign shoot schedules.</p>
          </div>
        ) : (
          clientsData.map((client) => (
            <div
              key={client.id}
              className="neu-glass-card p-6 rounded-3xl transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50/80 border border-amber-200/80 px-2.5 py-0.5 rounded-lg">
                    {client.clientCode}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {client.status}
                  </span>
                </div>

                <h3 className="font-extrabold text-stone-900 text-base">{client.name}</h3>

                <div className="mt-3.5 space-y-1.5 text-xs text-stone-600">
                  {client.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.city && (
                    <p className="text-xs text-stone-500 font-medium">{client.city}, {client.state || client.country}</p>
                  )}
                </div>

                {client.notes && (
                  <div className="mt-3.5 p-3 rounded-2xl bg-stone-50/70 border border-stone-200/70 text-xs text-stone-600">
                    <p className="line-clamp-2">{client.notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-stone-200/60 flex items-center justify-between">
                <span className="text-xs text-stone-500 font-bold">
                  {client.eventCount} Events
                </span>
                <button
                  onClick={() => navigate(`/employee/upload?clientId=${client.id}`)}
                  className="neu-glass-btn-primary px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center space-x-1.5 shadow-md transition cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Upload Photos</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignedClients;
