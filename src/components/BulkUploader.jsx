import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  File, 
  Film, 
  RefreshCw, 
  Layers,
  Trash2
} from 'lucide-react';
import api from '../api/axios';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const BulkUploader = ({ albumId, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ total: 0, completed: 0, failed: 0 });
  const fileInputRef = useRef(null);

  const handleFilesAdded = (newFiles) => {
    const fileList = Array.from(newFiles).map((file, idx) => {
      const isTooLarge = file.size > MAX_FILE_SIZE_BYTES;
      const isVideo = file.type.startsWith('video') || /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(file.name);
      return {
        id: `${file.name}-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        name: file.name,
        rawSize: file.size,
        size: formatFileSize(file.size),
        type: isVideo ? 'VIDEO' : 'PHOTO',
        status: isTooLarge ? 'error' : 'pending', // pending, uploading, done, error
        error: isTooLarge ? 'Exceeds 10 GB limit' : '',
        uploadProgress: 0,
        uploadedBytes: '0 B',
      };
    });

    setFiles((prev) => [...prev, ...fileList]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== 'done'));
  };

  const startUpload = async () => {
    const pendingQueue = files.filter((f) => f.status === 'pending' || f.status === 'error');
    if (pendingQueue.length === 0 || uploading) return;

    setUploading(true);
    let completedCount = files.filter((f) => f.status === 'done').length;
    let failedCount = 0;
    const queue = [...pendingQueue];
    setProgress({ total: files.length, completed: completedCount, failed: failedCount });

    // Use concurrency of 2 to ensure maximum stability for large 10GB uploads
    const concurrency = 2;
    let index = 0;

    const uploadNext = async () => {
      if (index >= queue.length) return;
      const currentItem = queue[index++];

      if (currentItem.rawSize > MAX_FILE_SIZE_BYTES) {
        failedCount++;
        setFiles((prev) =>
          prev.map((f) => (f.id === currentItem.id ? { ...f, status: 'error', error: 'Exceeds 10 GB limit' } : f))
        );
        setProgress((prev) => ({ ...prev, failed: failedCount }));
        await uploadNext();
        return;
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === currentItem.id ? { ...f, status: 'uploading', uploadProgress: 0, error: '' } : f))
      );

      const formData = new FormData();
      formData.append('albumId', albumId);
      formData.append('file', currentItem.file);

      try {
        await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 0, // No client-side timeout for 10 GB uploads
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.min(99, Math.round((progressEvent.loaded * 100) / progressEvent.total));
              const loadedFormatted = formatFileSize(progressEvent.loaded);
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === currentItem.id
                    ? { ...f, uploadProgress: percent, uploadedBytes: loadedFormatted }
                    : f
                )
              );
            }
          },
        });

        completedCount++;
        setFiles((prev) =>
          prev.map((f) => (f.id === currentItem.id ? { ...f, status: 'done', uploadProgress: 100 } : f))
        );
      } catch (err) {
        failedCount++;
        const msg = err.response?.data?.message || err.message || 'Upload failed';
        setFiles((prev) =>
          prev.map((f) => (f.id === currentItem.id ? { ...f, status: 'error', error: msg, uploadProgress: 0 } : f))
        );
      } finally {
        setProgress((prev) => ({ ...prev, completed: completedCount, failed: failedCount }));
        await uploadNext();
      }
    };

    const workers = [];
    for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
      workers.push(uploadNext());
    }
    await Promise.all(workers);

    setUploading(false);
    if (onUploadComplete) onUploadComplete();
  };

  const totalFiles = files.length;
  const completedFiles = files.filter((f) => f.status === 'done').length;
  const percentComplete = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;
  const hasPendingOrError = files.some((f) => f.status === 'pending' || f.status === 'error');

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-amber-300/80 hover:border-amber-500 bg-amber-50/20 hover:bg-amber-50/50 rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 group neu-glass-panel"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFilesAdded(e.target.files)}
        />
        <div className="w-14 h-14 rounded-2xl bg-amber-100/90 border border-amber-300 text-amber-800 mx-auto flex items-center justify-center mb-3 shadow-inner group-hover:scale-105 transition-transform">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h4 className="font-extrabold text-stone-900 text-base">Drag & drop high-res photos or 4K/8K videos</h4>
        <p className="text-xs text-stone-500 mt-1.5 font-medium">
          Supports JPG, PNG, RAW, WEBP, MP4, MOV, WEBM up to <span className="text-amber-800 font-bold">10 GB</span> per file
        </p>
        <div className="mt-3.5 flex items-center justify-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full neu-glass-btn text-stone-600 font-bold">
            <Layers className="w-3 h-3 text-amber-700" /> Bulk Multi-Select
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full neu-glass-input text-amber-900 font-bold">
            ⚡ Max 10 GB / File
          </span>
        </div>
      </div>

      {/* Overall Progress Bar when uploading */}
      {uploading && (
        <div className="neu-glass-panel p-5 rounded-2xl border border-amber-300/80 shadow-md">
          <div className="flex items-center justify-between text-xs font-bold mb-2.5 text-stone-800">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              Uploading {completedFiles} of {totalFiles} items
            </span>
            <span className="text-amber-900 font-black">{percentComplete}%</span>
          </div>
          <div className="w-full bg-stone-200/80 rounded-full h-2.5 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percentComplete}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* File Queue List */}
      {files.length > 0 && (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 text-xs custom-scrollbar">
          <div className="flex items-center justify-between py-1 text-stone-600 font-bold text-[11px] border-b border-stone-200/60 pb-2">
            <span>
              Queue ({files.length} {files.length === 1 ? 'file' : 'files'} • {formatFileSize(files.reduce((acc, f) => acc + (f.rawSize || 0), 0))})
            </span>
            <div className="flex items-center gap-2">
              {completedFiles > 0 && !uploading && (
                <button
                  onClick={clearCompleted}
                  className="px-3 py-1.5 text-[11px] text-stone-600 hover:text-stone-900 neu-glass-btn rounded-xl font-bold transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" /> Clear Done
                </button>
              )}
              {hasPendingOrError && !uploading && (
                <button
                  onClick={startUpload}
                  className="px-4 py-2 neu-glass-btn-primary rounded-xl font-bold transition flex items-center gap-2 text-xs"
                >
                  <UploadCloud className="w-3.5 h-3.5" /> Upload All ({files.filter(f => f.status === 'pending' || f.status === 'error').length})
                </button>
              )}
            </div>
          </div>

          {files.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl neu-glass-card space-y-2 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div className="p-1.5 rounded-lg bg-stone-100 shrink-0">
                    {item.type === 'VIDEO' ? (
                      <Film className="w-4 h-4 text-sky-600" />
                    ) : (
                      <File className="w-4 h-4 text-amber-700" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-stone-800 truncate text-[12px]">{item.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-stone-500">
                      <span>{item.size}</span>
                      <span className="text-stone-300">•</span>
                      <span className="font-medium text-stone-600">{item.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {item.status === 'uploading' && (
                    <div className="flex items-center gap-1.5 text-amber-700">
                      <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                      <span className="text-[11px] font-bold">{item.uploadProgress || 0}%</span>
                    </div>
                  )}
                  {item.status === 'done' && (
                    <span className="text-emerald-600 flex items-center space-x-1 font-semibold text-[11px]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Uploaded</span>
                    </span>
                  )}
                  {item.status === 'error' && (
                    <span className="text-rose-600 flex items-center space-x-1 font-semibold text-[11px]" title={item.error}>
                      <AlertCircle className="w-4 h-4" />
                      <span>{item.error || 'Failed'}</span>
                    </span>
                  )}
                  {item.status === 'pending' && !uploading && (
                    <button
                      onClick={() => removeFile(item.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition"
                      title="Remove from queue"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Per-file live progress bar when uploading */}
              {item.status === 'uploading' && (
                <div className="pt-1">
                  <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all duration-150 ease-out"
                      style={{ width: `${item.uploadProgress || 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-stone-400 mt-0.5">
                    <span>Transferred: {item.uploadedBytes || '0 B'}</span>
                    <span>Total: {item.size}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BulkUploader;
