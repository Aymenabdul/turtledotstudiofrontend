import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { ShieldCheck, Activity, Clock, RefreshCw } from 'lucide-react';

export default function EmployeeActivity() {
  const { data: activities, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['employeeMyActivity'],
    queryFn: async () => {
      const res = await api.get('/audit/my-activity');
      return res.data.data || [];
    },
  });

  return (
    <div className="space-y-6 sm:space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight drop-shadow-xs">My Action & Upload Activity</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Personal log of all client media uploads, album modifications, and entries made under your employee account.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="neu-glass-btn flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-stone-700 transition self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-amber-600' : 'text-stone-400'}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="neu-glass-panel rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-stone-400 text-xs">Loading activity feed...</div>
        ) : activities.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs">
            <Activity className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="font-bold text-stone-700 text-sm">No actions recorded yet</p>
            <p className="text-xs text-stone-400 mt-1">When you upload media or edit albums, records will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-200/60">
            {activities.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 text-xs hover:bg-stone-50/70 transition">
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="px-3 py-1 rounded-full font-mono text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                    {item.action}
                  </span>
                  <div className="min-w-0">
                    <p className="text-stone-900 font-bold text-xs sm:text-sm truncate">{item.description}</p>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">
                      {item.entityType} {item.entityId ? `#${item.entityId}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 text-xs text-stone-500 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
