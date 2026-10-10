import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
  Users,
  Calendar,
  Image as ImageIcon,
  DollarSign,
  TrendingUp,
  HardDrive,
  Sparkles,
  ArrowUpRight,
  Plus,
  Clock,
  Film,
  QrCode,
  UploadCloud,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // 1. Fetch KPI Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data.data;
    },
  });

  // 2. Fetch Monthly Revenue
  const { data: revenueData } = useQuery({
    queryKey: ['adminMonthlyRevenue'],
    queryFn: async () => {
      const res = await api.get('/dashboard/monthly-revenue');
      return res.data.data || [];
    },
  });

  // 3. Fetch Upcoming Events
  const { data: upcomingEvents } = useQuery({
    queryKey: ['adminUpcomingEvents'],
    queryFn: async () => {
      const res = await api.get('/dashboard/upcoming-events');
      return res.data.data || [];
    },
  });

  // 4. Fetch Recent Studio Activity
  const { data: recentActivity } = useQuery({
    queryKey: ['adminRecentActivity'],
    queryFn: async () => {
      const res = await api.get('/dashboard/recent-activity');
      return res.data.data || [];
    },
  });

  // Storage calculation
  const usedStorageBytes = stats?.totalStorageBytes || 0;
  const quotaBytes = stats?.storageQuotaBytes || 107374182400; // 100 GB
  const storageUsedMB = (usedStorageBytes / (1024 * 1024)).toFixed(1);
  const storageQuotaGB = (quotaBytes / (1024 * 1024 * 1024)).toFixed(0);
  const storagePercent = Math.min(Math.round((usedStorageBytes / quotaBytes) * 100), 100);

  return (
    <div className="space-y-7 transition-colors">

      {/* Top Banner & Quick Actions Console */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight drop-shadow-xs">
              Studio Executive Overview
            </h1>

            {/* Neu-Glass Live Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neu-glass-pill">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-700">
                Live Production
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 mt-1.5">
            Welcome back, <span className="text-amber-800 font-bold">{user?.fullName || 'Studio Director'}</span>. Here is the operational state of your photography studio.
          </p>
        </div>

        {/* Tactile Frosted Neu-Glass Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/admin/clients')}
            className="neu-glass-btn px-4 py-2 rounded-2xl text-xs font-semibold text-stone-700 flex items-center gap-2 active:scale-[0.98]"
            title="Create new client"
          >
            <div className="w-5 h-5 rounded-lg neu-glass-inset-xs flex items-center justify-center text-amber-600">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>New Client</span>
          </button>

          <button
            onClick={() => navigate('/admin/events')}
            className="neu-glass-btn px-4 py-2 rounded-2xl text-xs font-semibold text-stone-700 flex items-center gap-2 active:scale-[0.98]"
            title="Schedule new event"
          >
            <div className="w-5 h-5 rounded-lg neu-glass-inset-xs flex items-center justify-center text-sky-600">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span>New Event</span>
          </button>

          <button
            onClick={() => navigate('/admin/payments')}
            className="neu-glass-btn px-4 py-2 rounded-2xl text-xs font-semibold text-stone-700 flex items-center gap-2 active:scale-[0.98]"
            title="Record client transaction"
          >
            <div className="w-5 h-5 rounded-lg neu-glass-inset-xs flex items-center justify-center text-emerald-600">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
            <span>Record Payment</span>
          </button>

          <button
            onClick={() => navigate('/admin/qr')}
            className="neu-glass-btn-primary px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 active:scale-[0.98]"
            title="Instant QR Code Delivery Gallery"
          >
            <QrCode className="w-4 h-4 drop-shadow-xs" />
            <span>QR Delivery</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid - Neu-Glassmorphic Tactile Panels */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Collected Revenue */}
        <div className="neu-glass-card p-6 rounded-3xl flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Total Collected Revenue
              </span>
              <div className="w-10 h-10 rounded-2xl neu-glass-btn flex items-center justify-center text-emerald-600 group-hover:neu-glass-inset-sm transition-all">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-4 tracking-tight drop-shadow-xs">
              {formatCurrency(stats?.totalRevenue, user?.studioCurrency)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between">
            <span className="text-[11px] text-stone-500 font-medium">Pending Balance</span>
            <span className="neu-glass-inset-xs px-2.5 py-0.5 rounded-full text-[11px] font-bold text-amber-800">
              {formatCurrency(stats?.totalPending, user?.studioCurrency)}
            </span>
          </div>
        </div>

        {/* KPI 2: Active Clients */}
        <div className="neu-glass-card p-6 rounded-3xl flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Active Clients
              </span>
              <div className="w-10 h-10 rounded-2xl neu-glass-btn flex items-center justify-center text-amber-600 group-hover:neu-glass-inset-sm transition-all">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-4 tracking-tight drop-shadow-xs">
              {stats?.totalClients || 0}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
            <span className="text-stone-500 font-medium">Production Events</span>
            <span className="neu-glass-inset-xs px-2.5 py-0.5 rounded-full text-[11px] font-bold text-stone-800">
              {stats?.totalEvents || 0} events
            </span>
          </div>
        </div>

        {/* KPI 3: Media Assets */}
        <div className="neu-glass-card p-6 rounded-3xl flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Photos & Videos
              </span>
              <div className="w-10 h-10 rounded-2xl neu-glass-btn flex items-center justify-center text-indigo-600 group-hover:neu-glass-inset-sm transition-all">
                <ImageIcon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-4 tracking-tight drop-shadow-xs">
              {(stats?.totalPhotos || 0) + (stats?.totalVideos || 0)} Assets
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500 font-medium">
            <span className="neu-glass-inset-xs px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-stone-700">
              {stats?.totalPhotos || 0} Photos
            </span>
            <span>•</span>
            <span className="neu-glass-inset-xs px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-stone-700">
              {stats?.totalVideos || 0} Videos
            </span>
          </div>
        </div>

        {/* KPI 4: Storage Allocated */}
        <div className="neu-glass-card p-6 rounded-3xl flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Storage Allocated
              </span>
              <div className="w-10 h-10 rounded-2xl neu-glass-btn flex items-center justify-center text-sky-600 group-hover:neu-glass-inset-sm transition-all">
                <HardDrive className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-sky-700 mt-4 tracking-tight drop-shadow-xs">
              {storageUsedMB}{' '}
              <span className="text-xs sm:text-sm font-semibold text-stone-500">
                MB / {storageQuotaGB} GB
              </span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200/60 space-y-1.5">
            {/* Sunken Frosted Neu-Glass Track */}
            <div className="w-full neu-glass-inset-sm rounded-full h-3 p-0.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 h-full rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-700"
                style={{ width: `${Math.max(storagePercent, 2)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-500 font-bold px-0.5">
              <span>{storagePercent}% Used</span>
              <span>{(100 - storagePercent).toFixed(0)}% Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Events Row */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Bar Chart (2 cols) */}
        <div className="lg:col-span-2 neu-glass-panel p-6 rounded-3xl flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-stone-900 tracking-tight">
                  Revenue Stream Trend
                </h2>
                <span className="neu-glass-inset-xs px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-800">
                  Last 6 Months
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Past 6 months collected deposits and installments
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/payments')}
              className="neu-glass-btn px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1.5"
            >
              <span>View Ledger</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Frosted Sunken Neu-Glass Well for the Chart Console */}
          <div className="p-4 sm:p-5 rounded-2xl neu-glass-inset w-full flex-1">
            <div className="h-64 w-full">
              {revenueData && revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 12, right: 12, left: -16, bottom: 4 }}>
                    <defs>
                      <linearGradient id="neuGlassBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d97706" stopOpacity={0.92} />
                        <stop offset="100%" stopColor="#b45309" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="neuGlassBarActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                        <stop offset="100%" stopColor="#d97706" stopOpacity={0.92} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} opacity={0.6} />
                    <XAxis
                      dataKey="month"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(val) => {
                        const sym = getCurrencySymbol(user?.studioCurrency);
                        const num = Number(val);
                        if (num >= 1000000) return `${sym}${(num / 1000000).toFixed(1)}M`;
                        if (num >= 1000) return `${sym}${(num / 1000).toFixed(0)}k`;
                        return `${sym}${num}`;
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(203, 213, 225, 0.3)', radius: 8 }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="neu-glass-card p-3.5 rounded-2xl border border-white text-xs">
                              <p className="font-semibold text-stone-500 mb-1">{label}</p>
                              <p className="text-amber-800 font-extrabold text-sm drop-shadow-xs">
                                {formatCurrency(payload[0].value, user?.studioCurrency)}
                              </p>
                              <span className="text-[10px] text-stone-400">Total collected</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="revenue" radius={[8, 8, 2, 2]}>
                      {revenueData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === revenueData.length - 1 ? 'url(#neuGlassBarActive)' : 'url(#neuGlassBarGrad)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 text-xs gap-2">
                  <Activity className="w-8 h-8 opacity-40 text-stone-500" />
                  <span>No revenue history available yet.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Shoots Timeline (1 col) */}
        <div className="neu-glass-panel p-6 rounded-3xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-stone-900 tracking-tight">Upcoming Shoots</h2>
              <p className="text-xs text-stone-500">Scheduled events & sessions</p>
            </div>
            <button
              onClick={() => navigate('/admin/events')}
              className="neu-glass-btn px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1"
            >
              <span>All Events</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[300px] pr-1">
            {upcomingEvents && upcomingEvents.length > 0 ? (
              upcomingEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => navigate('/admin/events')}
                  className="neu-glass-card p-4 rounded-2xl cursor-pointer flex items-start justify-between gap-3 group active:scale-[0.99]"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate group-hover:text-amber-800 transition-colors">
                      {ev.eventName}
                    </p>
                    <p className="text-[11px] text-stone-600 truncate mt-0.5">
                      {ev.clientName}
                    </p>
                    <div className="flex items-center gap-2 mt-2.5 text-[10px] text-stone-500">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-800 neu-glass-inset-xs px-2 py-0.5 rounded-md">
                        <Calendar className="w-3 h-3 text-amber-600" />
                        <span>{ev.eventDate ? new Date(ev.eventDate).toLocaleDateString() : 'TBD'}</span>
                      </span>
                      {ev.location && (
                        <span className="truncate max-w-[120px] text-stone-500">• {ev.location}</span>
                      )}
                    </div>
                  </div>
                  <span className="neu-glass-pill px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-800 shrink-0">
                    {ev.eventType || 'Shoot'}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 neu-glass-inset-sm rounded-2xl">
                <div className="w-12 h-12 rounded-2xl neu-glass-btn flex items-center justify-center text-stone-400 mb-2.5">
                  <Calendar className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-stone-600">No upcoming shoots</p>
                <p className="text-[11px] text-stone-400 mt-0.5">Click "New Event" above to schedule one.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Studio Activity & Compliance Feed */}
      <div className="relative z-10 neu-glass-panel p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-glass-btn flex items-center justify-center text-amber-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-stone-900 tracking-tight">
                Recent Studio Activity & Compliance
              </h2>
              <p className="text-xs text-stone-500">
                Real-time log of staff uploads, client updates, and financial actions
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/audit')}
            className="neu-glass-btn px-4 py-2 rounded-2xl text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1.5"
          >
            <span>View Complete Log</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl neu-glass-inset-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="neu-glass-btn px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-amber-900 shrink-0">
                    {log.action}
                  </span>
                  <p className="text-stone-700 truncate font-semibold">{log.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-stone-500 text-[11px]">
                  <span className="font-medium text-stone-600">{log.userEmail || 'System'}</span>
                  <span>•</span>
                  <span className="neu-glass-inset-xs px-2 py-0.5 rounded-md font-mono text-[10px]">
                    {log.createdAt
                      ? new Date(log.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-stone-400 text-xs neu-glass-inset-sm rounded-2xl">
              No recent activity logged yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
