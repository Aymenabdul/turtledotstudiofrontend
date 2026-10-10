import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { Users, Calendar, UploadCloud, ShieldCheck, Image as ImageIcon, Film, Clock, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function EmployeeDashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // 1. Fetch employee stats
  const { data: stats } = useQuery({
    queryKey: ['employeeDashboardStats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/employee-stats');
      return res.data.data || {};
    },
  });

  // 2. Fetch upcoming events
  const { data: upcomingEvents } = useQuery({
    queryKey: ['employeeUpcomingEvents'],
    queryFn: async () => {
      const res = await api.get('/dashboard/upcoming-events');
      return res.data.data || [];
    },
  });

  // 3. Fetch personal activity
  const { data: myActivity } = useQuery({
    queryKey: ['employeeMyRecentActivity'],
    queryFn: async () => {
      const res = await api.get('/audit/my-activity');
      return res.data.data || [];
    },
  });

  return (
    <div className="space-y-6 sm:space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight drop-shadow-xs">Staff Field Workspace</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Logged in as <span className="text-amber-800 font-bold">{user?.fullName}</span> ({user?.email}).
          </p>
        </div>
        <Link
          to="/employee/upload"
          className="neu-glass-btn-primary px-5 py-2.5 text-white font-bold text-xs rounded-2xl shadow-md flex items-center space-x-2 transition self-start sm:self-auto cursor-pointer"
        >
          <UploadCloud className="w-4 h-4 stroke-[2.5]" />
          <span>Upload Media</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="neu-glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Assigned Clients</span>
            <div className="w-10 h-10 rounded-2xl bg-sky-100/90 text-sky-800 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-3 tracking-tight">{stats?.assignedClientsCount || 0}</p>
          <p className="text-xs text-stone-500 mt-1.5 font-medium">Directly allocated to your schedule</p>
        </div>

        <div className="neu-glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Photos Uploaded</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-100/90 text-amber-800 flex items-center justify-center shadow-xs">
              <ImageIcon className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-800 mt-3 tracking-tight">{stats?.totalStudioPhotos || 0}</p>
          <p className="text-xs text-stone-500 mt-1.5 font-medium">Stored across studio albums</p>
        </div>

        <div className="neu-glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Studio Video Clips</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-100/90 text-indigo-800 flex items-center justify-center shadow-xs">
              <Film className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-800 mt-3 tracking-tight">{stats?.totalStudioVideos || 0}</p>
          <p className="text-xs text-stone-500 mt-1.5 font-medium">Streaming video assets</p>
        </div>
      </div>

      {/* Shoots & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Shoots */}
        <div className="neu-glass-panel p-6 rounded-3xl flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-200/60">
            <div>
              <h2 className="text-base font-extrabold text-stone-900 tracking-tight">Upcoming Assigned Shoots</h2>
              <p className="text-xs text-stone-500 mt-0.5">Next photography sessions on schedule</p>
            </div>
            <Link to="/employee/clients" className="neu-glass-btn px-3 py-1.5 rounded-xl text-xs text-amber-800 font-bold transition">
              View Clients
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {upcomingEvents && upcomingEvents.length > 0 ? (
              upcomingEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="neu-glass-card p-4 rounded-2xl flex items-center justify-between transition group"
                >
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-stone-900">{ev.eventName}</p>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">{ev.clientName} • {ev.eventType}</p>
                    <p className="text-xs text-amber-800 mt-1.5 flex items-center gap-1.5 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{ev.eventDate ? new Date(ev.eventDate).toLocaleDateString() : 'TBD'}</span>
                    </p>
                  </div>
                  <Link
                    to="/employee/upload"
                    className="neu-glass-btn px-3.5 py-2 rounded-xl text-xs font-bold text-stone-800 hover:text-amber-800 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Upload</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-stone-400 text-xs">No upcoming events scheduled.</div>
            )}
          </div>
        </div>

        {/* My Recent Activity */}
        <div className="neu-glass-panel p-6 rounded-3xl flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-200/60">
            <div>
              <h2 className="text-base font-extrabold text-stone-900 tracking-tight">Recent Personal Activity</h2>
              <p className="text-xs text-stone-500 mt-0.5">Media uploads and album changes</p>
            </div>
            <Link to="/employee/activity" className="neu-glass-btn px-3 py-1.5 rounded-xl text-xs text-amber-800 font-bold transition">
              Full Log
            </Link>
          </div>

          <div className="divide-y divide-stone-200/60 flex-1">
            {myActivity && myActivity.length > 0 ? (
              myActivity.slice(0, 5).map((act) => (
                <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-3">
                    <p className="text-stone-900 truncate font-semibold text-xs">{act.description}</p>
                    <p className="text-[11px] text-stone-400 font-mono mt-0.5">{act.action}</p>
                  </div>
                  <span className="text-[11px] text-stone-500 font-medium shrink-0">
                    {act.createdAt ? new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-stone-400 text-xs">No activity logged yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
