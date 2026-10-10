import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
  Layers,
  FileText
} from 'lucide-react';

export default function AuditLogs() {
  const [page, setPage] = useState(0);
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['studioAuditLogs', page],
    queryFn: async () => {
      const res = await api.get(`/audit/logs?page=${page}&size=25`);
      return res.data.data;
    },
  });

  const logs = logsData?.content || [];

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesSearch =
      searchTerm === '' ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const uniqueActions = ['ALL', ...Array.from(new Set(logs.map((l) => l.action).filter(Boolean)))];

  const getActionBadgeClass = (action = '') => {
    if (action.includes('DELETE')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (action.includes('PAYMENT')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('UPLOAD')) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (action.includes('QR')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (action.includes('CREATE')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (action.includes('LOGIN')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (action.includes('ARCHIVE')) return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-amber-50 text-amber-800 border-amber-300';
  };

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight drop-shadow-xs">Studio Audit Trail & Activity</h1>
            <span className="px-3 py-1 rounded-full bg-amber-50/90 text-amber-800 border border-amber-300/80 text-[11px] font-bold uppercase tracking-wider">
              Immutable Log
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Complete compliance ledger tracking authentication, media uploads, client changes, QR events, and financial records.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="neu-glass-btn flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-stone-700 transition self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-amber-600' : 'text-stone-400'}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="neu-glass-panel p-4 sm:p-5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by description, user, or entity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full neu-glass-input rounded-full pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {uniqueActions.map((action) => {
            const isActive = filterAction === action;
            return (
              <button
                key={action}
                onClick={() => setFilterAction(action)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'neu-glass-pill active bg-amber-600 text-white shadow-xs'
                    : 'neu-glass-pill text-stone-600 hover:text-stone-900 hover:bg-stone-100/80'
                }`}
              >
                {action === 'ALL' ? 'All Actions' : action.replaceAll('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="neu-glass-panel rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-stone-400 text-xs">Loading audit ledger...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs">
            <ShieldCheck className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="font-bold text-stone-700 text-sm">No audit records found</p>
            <p className="text-xs text-stone-400 mt-1">Actions performed in the studio will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200/60 text-stone-600 bg-stone-100/60">
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600">Timestamp</th>
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600">User</th>
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600">Action</th>
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600">Entity</th>
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600">Details</th>
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60 text-stone-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs text-stone-500 whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-stone-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-amber-100/90 flex items-center justify-center text-xs text-amber-800 font-extrabold shrink-0 border border-amber-300/80 shadow-xs">
                        {log.userName?.charAt(0) || 'U'}
                      </div>
                      <div className="truncate max-w-[140px]">
                        <p className="truncate text-stone-900 font-bold text-xs">{log.userName || 'System'}</p>
                        <p className="truncate text-[11px] text-stone-400">{log.userEmail}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-mono font-bold border ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-stone-700 font-mono text-xs font-semibold whitespace-nowrap">
                      {log.entityType ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200/80 text-[10px] text-stone-700 font-semibold uppercase tracking-wider">
                            {log.entityType}
                          </span>
                          {log.entityId ? <span className="text-stone-400 font-mono text-[11px]">#{log.entityId}</span> : null}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-stone-600 max-w-md">
                      <p className="text-xs break-words" title={log.description}>{log.description || '—'}</p>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-stone-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
