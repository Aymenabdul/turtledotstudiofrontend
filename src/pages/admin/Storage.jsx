import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import {
  HardDrive,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertTriangle,
  FileQuestion,
  Database,
  ShieldCheck,
  FolderTree,
  AlertCircle
} from 'lucide-react';

import { useAlert } from '../../context/AlertContext';

export default function Storage() {
  const queryClient = useQueryClient();
  const alert = useAlert();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [isScanning, setIsScanning] = useState(false);

  // 1. Fetch Storage Sync Report
  const { data: report, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['storageSyncReport'],
    queryFn: async () => {
      const res = await api.get('/storage/sync');
      return res.data.data;
    },
  });

  const handleScanNow = async () => {
    setIsScanning(true);
    try {
      const { data } = await refetch();
      if (data) {
        const diskMBVal = (data.totalDiskBytes / (1024 * 1024)).toFixed(2);
        const orphanCount = data.orphanFiles?.length || 0;
        const missingCount = data.missingFiles?.length || 0;

        if (data.status === 'HEALTHY' || (orphanCount === 0 && missingCount === 0)) {
          alert.success(
            `Filesystem scan complete! Volume is completely healthy with ${data.totalDiskFiles || 0} physical files (${diskMBVal} MB) verified against database records.`,
            'Storage Healthy'
          );
        } else {
          alert.warning(
            `Scan detected discrepancies: ${orphanCount} untracked orphan files and ${missingCount} missing database records found.`,
            'Discrepancies Detected'
          );
        }
      } else {
        alert.info('Storage scan complete.', 'Scan Completed');
      }
    } catch (err) {
      alert.error(
        err.response?.data?.message || 'Failed to scan physical storage volume. Please verify server connection.',
        'Scan Error'
      );
    } finally {
      setIsScanning(false);
    }
  };

  // 2. Prune Orphans Mutation
  const pruneMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/storage/sync/prune');
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['storageSyncReport']);
      queryClient.invalidateQueries(['adminDashboardStats']);
      alert.success(res.message || 'Orphan files successfully removed from physical disk.', 'Pruning Complete');
    },
    onError: (err) => {
      alert.error(err.response?.data?.message || 'Failed to prune orphan files', 'Pruning Failed');
    },
  });

  const handlePrune = () => {
    alert.confirm({
      title: 'Prune Orphan Files',
      message: 'Are you sure you want to delete all untracked orphan files from storage? This action cannot be undone.',
      confirmText: 'Prune Orphans',
      variant: 'danger',
      onConfirm: () => pruneMutation.mutate(),
    });
  };

  const diskMB = report ? (report.totalDiskBytes / (1024 * 1024)).toFixed(2) : '0.00';
  const dbMB = report ? (report.totalDbBytes / (1024 * 1024)).toFixed(2) : '0.00';
  const isHealthy = report?.status === 'HEALTHY';

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight drop-shadow-xs">Storage & Filesystem Sync</h1>
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                isHealthy
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {isHealthy ? 'Filesystem Healthy' : 'Discrepancy Detected'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Detects discrepancies between physical media stored on disk and database metadata records.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {report?.orphanFiles && report.orphanFiles.length > 0 && (
            <button
              onClick={handlePrune}
              disabled={pruneMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition disabled:opacity-50 shadow-md cursor-pointer"
            >
              <Trash2 className="w-4 h-4 stroke-[2.5]" />
              <span>{pruneMutation.isPending ? 'Pruning...' : `Prune ${report.orphanFiles.length} Orphans`}</span>
            </button>
          )}

          <button
            onClick={handleScanNow}
            disabled={isFetching || isScanning}
            className="neu-glass-btn flex items-center gap-2 px-5 py-2.5 rounded-2xl text-amber-900 font-bold text-xs transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-amber-700 ${isFetching || isScanning ? 'animate-spin' : ''}`} />
            <span>{isFetching || isScanning ? 'Scanning Storage...' : 'Scan Storage Now'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Physical Disk */}
        <div className="neu-glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Physical Disk Usage</span>
            <div className="w-10 h-10 rounded-2xl bg-sky-100/90 text-sky-800 flex items-center justify-center shadow-xs">
              <HardDrive className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-3 tracking-tight">{diskMB} MB</p>
          <p className="text-xs text-stone-500 mt-1.5 font-medium">{report?.totalDiskFiles || 0} files found on volume</p>
        </div>

        {/* Database Media */}
        <div className="neu-glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Database Registered</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-100/90 text-amber-800 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-800 mt-3 tracking-tight">{dbMB} MB</p>
          <p className="text-xs text-stone-500 mt-1.5 font-medium">{report?.totalDbRecords || 0} media records</p>
        </div>

        {/* Missing Files */}
        <div className="neu-glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Missing Physical Files</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-100/90 text-rose-800 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-3 tracking-tight">{report?.missingFiles?.length || 0}</p>
          <p className="text-xs text-stone-500 mt-1.5 font-medium">DB records with no disk file</p>
        </div>

        {/* Orphan Files */}
        <div className="neu-glass-card p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Untracked Orphan Files</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-100/90 text-purple-800 flex items-center justify-center shadow-xs">
              <FileQuestion className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-purple-800 mt-3 tracking-tight">{report?.orphanFiles?.length || 0}</p>
          <p className="text-xs text-stone-500 mt-1.5 font-medium">Disk files not linked in DB</p>
        </div>
      </div>

      {/* Missing Files Details (if any) */}
      {report?.missingFiles && report.missingFiles.length > 0 && (
        <div className="neu-glass-panel p-6 rounded-3xl border border-rose-200/80 space-y-4 bg-rose-50/40">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-sm font-extrabold">Missing Physical Files Warning</h3>
          </div>
          <p className="text-xs text-stone-600">
            The following media items exist in your database, but their physical file cannot be found at the designated storage path.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-rose-200/60 text-rose-800 bg-rose-100/40">
                  <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider">Media ID</th>
                  <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider">File Name</th>
                  <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider">Expected Path</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100/60 text-stone-700">
                {report.missingFiles.map((f) => (
                  <tr key={f.mediaId}>
                    <td className="py-3 px-4 font-mono text-stone-600">#{f.mediaId}</td>
                    <td className="py-3 px-4 font-bold text-stone-900">{f.fileName}</td>
                    <td className="py-3 px-4 font-mono text-xs text-stone-500">{f.expectedPath}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Untracked Orphan Files Table */}
      <div className="neu-glass-panel rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-stone-200/60 flex items-center justify-between bg-stone-50/50">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900">Untracked Files on Storage Volume</h3>
            <p className="text-xs text-stone-500 mt-0.5">Files physically residing on disk that have no active media record in the database</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-stone-400 text-xs">Scanning storage volumes...</div>
        ) : !report?.orphanFiles || report.orphanFiles.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs">
            <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
            <p className="font-bold text-stone-700 text-sm">No orphan files detected</p>
            <p className="text-xs text-stone-500 mt-1">Every physical file is properly tracked and accounted for.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200/60 text-stone-600 bg-stone-100/60">
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600">File Name</th>
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600">Relative Path</th>
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600">File Size</th>
                  <th className="py-4 px-5 text-[11px] font-bold uppercase tracking-wider text-stone-600">Last Modified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/60 text-stone-700">
                {report.orphanFiles.map((orphan, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-stone-900">{orphan.fileName}</td>
                    <td className="py-3.5 px-5 font-mono text-xs text-stone-500">{orphan.relativePath}</td>
                    <td className="py-3.5 px-5 font-mono font-bold text-stone-800">
                      {(orphan.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </td>
                    <td className="py-3.5 px-5 text-stone-500">
                      {orphan.lastModified ? new Date(orphan.lastModified).toLocaleString() : '—'}
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
