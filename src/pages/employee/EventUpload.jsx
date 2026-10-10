import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  Users, 
  Calendar, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  X, 
  Film, 
  Heart, 
  Layers, 
  Play,
  Download,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import api from '../../api/axios';
import BulkUploader from '../../components/BulkUploader';
import { CustomSelect } from '../../components/CustomSelect';
import { useAlert } from '../../context/AlertContext';
import { useAuthStore } from '../../store/authStore';

export const EventUpload = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const clientIdFromUrl = searchParams.get('clientId');
  const eventIdFromUrl = searchParams.get('eventId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const alert = useAlert();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [selectedClientId, setSelectedClientId] = useState(clientIdFromUrl || '');
  const [activeEventId, setActiveEventId] = useState(eventIdFromUrl || '');
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [createAlbumModal, setCreateAlbumModal] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const [albumFormData, setAlbumFormData] = useState({
    name: '',
    description: '',
    isCommercial: false,
    pricePerPhoto: 49,
    allowGuestPurchases: true,
  });

  // 1. Fetch Current Employee Profile & Permissions from Backend
  const { data: myProfile } = useQuery({
    queryKey: ['employee-me'],
    queryFn: async () => {
      const res = await api.get('/employees/me');
      return res.data?.data;
    },
    enabled: !!user,
  });

  // Permissions calculation: Admin has everything, Employee checked against database permissions
  const permissions = isAdmin
    ? [
        'CLIENT_VIEW', 'CLIENT_EDIT', 'ALBUM_CREATE',
        'PHOTO_UPLOAD', 'PHOTO_DELETE', 'VIDEO_UPLOAD',
        'MEDIA_DOWNLOAD', 'ALBUM_DELETE', 'SHARE_MANAGE'
      ]
    : (myProfile?.permissions || user?.permissions || []);

  const canUploadPhotos = permissions.includes('PHOTO_UPLOAD');
  const canUploadVideos = permissions.includes('VIDEO_UPLOAD');
  const canUploadAny = canUploadPhotos || canUploadVideos;
  const canCreateAlbum = permissions.includes('ALBUM_CREATE');
  const canDeleteAlbum = permissions.includes('ALBUM_DELETE');
  const canDeleteMedia = permissions.includes('PHOTO_DELETE') || permissions.includes('VIDEO_DELETE');
  const canDownloadMedia = permissions.includes('MEDIA_DOWNLOAD');

  // 2. Fetch Assigned Clients (Backend automatically filters to this employee's assignments)
  const { data: clientsList = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['employee-assigned-clients'],
    queryFn: async () => {
      const res = await api.get('/clients', { params: { size: 100 } });
      return res.data?.data?.content || [];
    },
  });

  // Auto-select client if URL param is given or if only 1 client is assigned
  useEffect(() => {
    if (clientIdFromUrl) {
      setSelectedClientId(clientIdFromUrl);
    } else if (!selectedClientId && clientsList.length === 1) {
      setSelectedClientId(String(clientsList[0].id));
    }
  }, [clientIdFromUrl, clientsList, selectedClientId]);

  // 3. Fetch Events for selected client
  const { data: eventsList = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['employee-client-events', selectedClientId],
    enabled: !!selectedClientId,
    queryFn: async () => {
      const res = await api.get('/events', { params: { clientId: selectedClientId, size: 100 } });
      return res.data?.data?.content || [];
    },
  });

  // Resolve current active event ID
  const effectiveEventId = activeEventId || (eventsList?.[0]?.id ? String(eventsList[0].id) : null);

  // 4. Fetch Albums for active event
  const { data: albumsData = [], isLoading: albumsLoading } = useQuery({
    queryKey: ['event-albums', effectiveEventId],
    enabled: !!effectiveEventId,
    queryFn: async () => {
      const res = await api.get('/albums', { params: { eventId: effectiveEventId } });
      return res.data?.data || [];
    },
  });

  // 5. Fetch Media for selected album
  const { data: albumMedia = [], isLoading: mediaLoading } = useQuery({
    queryKey: ['album-media', selectedAlbum?.id],
    enabled: !!selectedAlbum?.id,
    queryFn: async () => {
      const res = await api.get(`/media/album/${selectedAlbum.id}`);
      return res.data?.data || [];
    },
  });

  // Lightbox index & keyboard navigation helpers
  const currentMediaIndex = albumMedia ? albumMedia.findIndex((m) => m.id === lightboxMedia?.id) : -1;
  const hasPrevMedia = currentMediaIndex > 0;
  const hasNextMedia = albumMedia && currentMediaIndex >= 0 && currentMediaIndex < albumMedia.length - 1;

  useEffect(() => {
    if (!lightboxMedia || !albumMedia || albumMedia.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxMedia(null);
      } else if (e.key === 'ArrowLeft') {
        const curIdx = albumMedia.findIndex((m) => m.id === lightboxMedia.id);
        if (curIdx > 0) {
          setLightboxMedia(albumMedia[curIdx - 1]);
        }
      } else if (e.key === 'ArrowRight') {
        const curIdx = albumMedia.findIndex((m) => m.id === lightboxMedia.id);
        if (curIdx >= 0 && curIdx < albumMedia.length - 1) {
          setLightboxMedia(albumMedia[curIdx + 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxMedia, albumMedia]);

  // Download Handler for Photos and Videos
  const handleDownloadMedia = async (mediaId, fileName) => {
    if (!canDownloadMedia) {
      alert.error('You do not have permission to download media assets.', 'Permission Denied');
      return;
    }
    setDownloadingId(mediaId);
    try {
      const res = await api.get(`/media/${mediaId}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `media_${mediaId}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(`/api/media/${mediaId}/download`, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  // Mutations
  const createAlbumMutation = useMutation({
    mutationFn: (payload) => api.post('/albums', { ...payload, eventId: effectiveEventId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-albums', effectiveEventId] });
      setCreateAlbumModal(false);
      setAlbumFormData({
        name: '',
        description: '',
        isCommercial: false,
        pricePerPhoto: 49,
        allowGuestPurchases: true,
      });
      alert.success('New album collection created successfully!', 'Album Created');
    },
    onError: (err) => {
      alert.error(err.response?.data?.message || 'Failed to create album.', 'Error');
    }
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: (id) => api.delete(`/albums/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-albums', effectiveEventId] });
      setSelectedAlbum(null);
      alert.success('Album and associated media files deleted.', 'Album Deleted');
    },
    onError: (err) => {
      alert.error(err.response?.data?.message || 'Failed to delete album.', 'Error');
    }
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (id) => api.delete(`/media/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album-media', selectedAlbum?.id] });
      queryClient.invalidateQueries({ queryKey: ['event-albums', effectiveEventId] });
      alert.success('Media file deleted from storage.', 'File Deleted');
    },
    onError: (err) => {
      alert.error(err.response?.data?.message || 'Failed to delete media.', 'Error');
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id) => api.post(`/media/${id}/favorite`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album-media', selectedAlbum?.id] });
    },
  });

  const handleClientChange = (val) => {
    setSelectedClientId(val);
    setActiveEventId('');
    setSelectedAlbum(null);
    if (val) {
      setSearchParams({ clientId: val });
    } else {
      setSearchParams({});
    }
  };

  const handleEventChange = (val) => {
    setActiveEventId(val);
    setSelectedAlbum(null);
    setSearchParams({ clientId: selectedClientId, eventId: val });
  };

  const currentClient = clientsList.find((c) => String(c.id) === String(selectedClientId));
  const currentEvent = eventsList.find((e) => String(e.id) === String(effectiveEventId));

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Top Header Bar: Title on Left, All Dropdowns + Create Album STRICTLY on Same Line on Right */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-4 border-b border-stone-200/60">
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => navigate('/employee')}
            className="neu-glass-btn p-2 rounded-xl text-stone-600 hover:text-stone-900 transition cursor-pointer"
            title="Back to Staff Portal"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight drop-shadow-xs">Staff Media Uploader</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Select assigned client to manage event collections and upload 10 GB media assets.
            </p>
          </div>
        </div>

        {/* Single Line Controls: Assigned Client + Event + Create Album */}
        <div className="flex items-center gap-3 flex-nowrap overflow-x-auto py-1 shrink-0">
          {/* 1. Assigned Client Selector */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <Users className="w-4 h-4 text-amber-600 shrink-0" />
            <CustomSelect
              value={selectedClientId}
              onChange={handleClientChange}
              placeholder={clientsLoading ? 'Loading clients...' : '-- Choose Client --'}
              disabled={clientsLoading || clientsList.length === 0}
              options={clientsList.map((c) => ({
                value: c.id,
                label: c.name,
                subtext: c.clientCode,
              }))}
              className="w-44 sm:w-52 neu-glass-pill rounded-full px-3.5 py-1.5 text-xs text-stone-800"
            />
          </div>

          {/* 2. Event Selector */}
          {selectedClientId && (
            <div className="flex items-center space-x-1.5 shrink-0">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <CustomSelect
                value={effectiveEventId || ''}
                onChange={handleEventChange}
                disabled={eventsLoading || eventsList.length === 0}
                placeholder={
                  eventsLoading 
                    ? 'Loading shoots...' 
                    : eventsList.length === 0 
                      ? 'No events' 
                      : 'Select event / shoot...'
                }
                options={eventsList.map((ev) => ({
                  value: ev.id,
                  label: ev.eventName,
                  subtext: ev.eventDate,
                }))}
                className="w-44 sm:w-52 neu-glass-pill rounded-full px-3.5 py-1.5 text-xs text-stone-800"
              />
            </div>
          )}

          {/* 3. Create Album Button */}
          {selectedClientId && canCreateAlbum && (
            <button
              onClick={() => setCreateAlbumModal(true)}
              disabled={!effectiveEventId}
              className="neu-glass-btn-primary px-4 py-2 text-white font-bold text-xs rounded-2xl shadow-md flex items-center space-x-1.5 transition disabled:opacity-40 shrink-0 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Album</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {!selectedClientId ? (
        /* State 1: No Client Selected Yet */
        <div className="neu-glass-panel py-24 text-center rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-700 mx-auto flex items-center justify-center mb-4 shadow-sm">
            <Users className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-extrabold text-stone-900">Select an Assigned Client</h3>
          <p className="text-xs text-stone-500 mt-2 max-w-md mx-auto leading-relaxed">
            Please choose one of your assigned clients from the dropdown above to view their event shoots, organize ceremony collections, and upload media up to 10 GB per file.
          </p>
          {clientsList.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-stone-400 font-semibold mr-1">Quick pick:</span>
              {clientsList.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleClientChange(String(c.id))}
                  className="neu-glass-pill px-3.5 py-1.5 rounded-full text-stone-700 text-xs font-bold hover:text-amber-900 cursor-pointer"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : selectedAlbum ? (
        /* State 2: Selected Album View (Exact Same as Admin Uploader) */
        <div className="space-y-6">
          {/* Selected Album Command Header Deck */}
          <div className="neu-glass-panel rounded-3xl p-5 sm:p-6 shadow-md border border-white/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedAlbum(null)}
                  className="p-2.5 rounded-2xl neu-glass-btn text-stone-700 hover:text-amber-800 transition active:scale-95 shrink-0 cursor-pointer"
                  title="Back to Collections"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                <div>
                  <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                    <h2 className="text-xl font-black text-stone-900 tracking-tight">{selectedAlbum.name}</h2>
                    <span className="px-3 py-1 rounded-full bg-amber-100/90 border border-amber-200/80 text-amber-900 text-xs font-bold shadow-2xs">
                      {selectedAlbum.eventName || currentEvent?.eventName}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 border border-stone-200/60 text-stone-600 text-xs font-mono font-bold">
                      {albumMedia?.length || 0} {albumMedia?.length === 1 ? 'asset' : 'assets'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1 font-medium">
                    {selectedAlbum.description || 'Collection of high-resolution photos and video streams'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                {/* Upload Button guarded by permissions */}
                {canUploadAny ? (
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="neu-glass-btn-primary px-5 py-2.5 rounded-2xl text-xs font-extrabold flex items-center space-x-2.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer text-white"
                  >
                    <UploadCloud className="w-4 h-4 stroke-[2.5]" />
                    <span>Upload Media</span>
                  </button>
                ) : (
                  <span className="px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Upload Restricted
                  </span>
                )}

                {/* Delete Album guarded by permissions */}
                {canDeleteAlbum && (
                  <button
                    onClick={() => {
                      alert.confirm({
                        title: 'Delete Album',
                        message: `Are you sure you want to permanently delete album "${selectedAlbum.name}" and all associated media files?`,
                        confirmText: 'Delete Album',
                        variant: 'danger',
                        onConfirm: () => deleteAlbumMutation.mutate(selectedAlbum.id),
                      });
                    }}
                    className="p-2.5 rounded-2xl neu-glass-btn text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete Album"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Media Grid */}
          {mediaLoading ? (
            <div className="py-20 text-center text-stone-400">
              <span className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin inline-block"></span>
            </div>
          ) : !albumMedia || albumMedia.length === 0 ? (
            <div className="neu-glass-panel py-20 text-center text-stone-400 rounded-3xl">
              <ImageIcon className="w-10 h-10 mx-auto text-stone-300 mb-3" />
              <p className="text-sm font-bold text-stone-700">This album is empty</p>
              <p className="text-xs text-stone-500 mt-1">
                {canUploadAny
                  ? 'Upload high-res photos or 4K videos up to 10 GB to start.'
                  : 'No media items in this album. Upload permissions are currently disabled.'}
              </p>
              {canUploadAny && (
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="mt-4 neu-glass-btn-primary px-5 py-2.5 text-white font-bold text-xs rounded-2xl shadow-md transition cursor-pointer"
                >
                  Start Uploading
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {(albumMedia || []).map((m) => (
                <div
                  key={m.id}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200 hover:border-amber-400 transition cursor-pointer shadow-sm"
                  onClick={() => setLightboxMedia(m)}
                >
                  {m.mediaType === 'VIDEO' ? (
                    <div className="w-full h-full bg-stone-950 relative overflow-hidden flex items-center justify-center">
                      <video
                        src={`/api/media/${m.id}/stream`}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster={m.thumbnailUrl || m.previewUrl}
                        onMouseEnter={(e) => { e.target.play().catch(() => {}); }}
                        onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-transparent pointer-events-none transition duration-300">
                        <div className="w-11 h-11 rounded-full bg-amber-600/95 text-white flex items-center justify-center shadow-lg group-hover:scale-115 group-hover:bg-amber-600 transition duration-300">
                          <Play className="w-5 h-5 ml-0.5 fill-current" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={m.thumbnailUrl || m.previewUrl || m.fileUrl || `/api/media/${m.id}`}
                      alt={m.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                      onError={(e) => {
                        if (m.fileUrl && e.target.src !== m.fileUrl) {
                          e.target.src = m.fileUrl;
                        }
                      }}
                    />
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex items-center space-x-1">
                    {m.mediaType === 'VIDEO' && (
                      <span className="p-1 rounded-md bg-stone-900/70 text-sky-300 backdrop-blur-sm">
                        <Film className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteMutation.mutate(m.id);
                      }}
                      className={`p-1.5 rounded-full backdrop-blur-sm transition ${
                        m.isFavorite
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                          : 'bg-stone-900/50 text-white/80 hover:text-white'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>

                  {/* Hover Overlay with Download & Delete actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/20 to-transparent opacity-0 group-hover:opacity-100 transition p-2.5 flex flex-col justify-end">
                    <p className="text-[11px] font-medium text-white truncate">{m.fileName}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-stone-300">
                      <span>{(m.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                      <div className="flex items-center gap-1.5">
                        {/* Download button for videos and photos */}
                        {canDownloadMedia && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadMedia(m.id, m.fileName);
                            }}
                            className="text-stone-300 hover:text-amber-400 p-1 rounded transition"
                            title={`Download ${m.mediaType === 'VIDEO' ? 'Video' : 'Photo'}`}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Delete button */}
                        {canDeleteMedia && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              alert.confirm({
                                title: 'Delete Media File',
                                message: `Are you sure you want to permanently delete "${m.fileName}"?`,
                                confirmText: 'Delete File',
                                variant: 'danger',
                                onConfirm: () => deleteMediaMutation.mutate(m.id),
                              });
                            }}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded transition"
                            title="Delete File"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* State 3: Albums Grid (Exact Same as Admin Uploader) */
        <div className="space-y-4">
          {eventsLoading || albumsLoading ? (
            <div className="py-20 text-center text-stone-400">
              <span className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin inline-block"></span>
            </div>
          ) : !effectiveEventId || !eventsList || eventsList.length === 0 ? (
            <div className="neu-glass-panel py-20 text-center text-stone-400 rounded-3xl">
              <Calendar className="w-10 h-10 mx-auto text-stone-300 mb-3" />
              <p className="text-sm font-bold text-stone-700">No Events Scheduled for this Client</p>
              <p className="text-xs text-stone-500 mt-1">
                This client does not have any event shoots assigned yet.
              </p>
            </div>
          ) : !albumsData || albumsData.length === 0 ? (
            <div className="neu-glass-panel py-20 text-center text-stone-400 rounded-3xl">
              <Layers className="w-10 h-10 mx-auto text-stone-300 mb-3" />
              <p className="text-sm font-bold text-stone-700">No albums created for this event yet</p>
              <p className="text-xs text-stone-500 mt-1">Create albums like Ceremony, Reception, Portraits, etc.</p>
              {canCreateAlbum && (
                <button
                  onClick={() => setCreateAlbumModal(true)}
                  className="mt-4 neu-glass-btn-primary px-5 py-2.5 text-white font-bold text-xs rounded-2xl shadow-md transition cursor-pointer"
                >
                  Create First Album
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(albumsData || []).map((album) => (
                <div
                  key={album.id}
                  onClick={() => setSelectedAlbum(album)}
                  className="neu-glass-card rounded-3xl overflow-hidden transition cursor-pointer group flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                    {album.coverImageUrl ? (
                      <img
                        src={album.coverImageUrl}
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                        <ImageIcon className="w-8 h-8 mb-1 text-stone-300" />
                        <span className="text-xs font-medium">No cover photo</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      {album.isCommercial ? (
                        <span className="text-xs font-extrabold bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md px-3 py-1 rounded-xl flex items-center gap-1.5 border border-amber-300/40">
                          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                          Guest Candid • ₹{album.pricePerPhoto || 49}/photo
                        </span>
                      ) : (
                        <span className="text-xs font-bold bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl">
                          {album.photoCount} Photos • {album.videoCount} Videos
                        </span>
                      )}
                      <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg">
                        {album.photoCount} files
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-extrabold text-stone-900 text-base group-hover:text-amber-800 transition">
                      {album.name}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                      {album.description || 'Curated event photos and videos'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Album Modal with Portal */}
      {createAlbumModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-md animate-in fade-in duration-150">
          <div className="neu-glass-panel max-w-md w-full rounded-3xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-150 border border-white/60">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base">Create New Album</h3>
                  <p className="text-xs text-stone-500">Organize event photos and video collections</p>
                </div>
              </div>
              <button onClick={() => setCreateAlbumModal(false)} className="neu-glass-btn p-2 text-stone-400 hover:text-stone-700 rounded-xl transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createAlbumMutation.mutate(albumFormData);
              }}
              className="space-y-4 mt-4 text-xs font-semibold"
            >
              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Album Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Reception, Couple Portraits, Candid Moments"
                  value={albumFormData.name}
                  onChange={(e) => setAlbumFormData({ ...albumFormData, name: e.target.value })}
                  className="w-full px-4 py-2.5 neu-glass-input rounded-2xl text-stone-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1.5">Description</label>
                <textarea
                  rows="3"
                  placeholder="Brief summary of photos in this album..."
                  value={albumFormData.description}
                  onChange={(e) => setAlbumFormData({ ...albumFormData, description: e.target.value })}
                  className="w-full px-4 py-2.5 neu-glass-input rounded-2xl text-stone-900"
                />
              </div>

              {/* Commercial Guest Candid Toggle & Pricing */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setAlbumFormData({ ...albumFormData, isCommercial: !albumFormData.isCommercial })}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-stone-900">Commercial / Guest Candid Album</p>
                      <p className="text-[11px] text-stone-500">Sell candid photos directly to event guests who scan QR</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={albumFormData.isCommercial}
                    onChange={(e) => setAlbumFormData({ ...albumFormData, isCommercial: e.target.checked })}
                    onClick={(e) => e.stopPropagation()}
                    className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                  />
                </div>

                {albumFormData.isCommercial && (
                  <div className="pt-3 border-t border-amber-500/20 space-y-3 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Price per photo (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-stone-500 text-sm">₹</span>
                        <input
                          type="number"
                          min="1"
                          required
                          value={albumFormData.pricePerPhoto}
                          onChange={(e) => setAlbumFormData({ ...albumFormData, pricePerPhoto: Number(e.target.value) })}
                          className="w-full pl-8 pr-4 py-2 neu-glass-input rounded-xl text-stone-900 font-extrabold text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        {[49, 99, 149, 199].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setAlbumFormData({ ...albumFormData, pricePerPhoto: p })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              albumFormData.pricePerPhoto === p
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white/80 text-stone-600 border border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            ₹{p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={albumFormData.allowGuestPurchases}
                        onChange={(e) => setAlbumFormData({ ...albumFormData, allowGuestPurchases: e.target.checked })}
                        className="w-4 h-4 accent-amber-600 rounded"
                      />
                      <span>Allow guests to purchase and download photos</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stone-200/60">
                <button
                  type="button"
                  onClick={() => setCreateAlbumModal(false)}
                  className="neu-glass-btn px-4 py-2.5 text-stone-700 rounded-2xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAlbumMutation.isPending}
                  className="neu-glass-btn-primary px-5 py-2.5 text-white font-bold rounded-2xl disabled:opacity-50 shadow-md transition cursor-pointer"
                >
                  {createAlbumMutation.isPending ? 'Creating...' : 'Create Album'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Upload Media Modal with Portal */}
      {uploadModalOpen && selectedAlbum && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-md animate-in fade-in duration-150">
          <div className="neu-glass-panel max-w-2xl w-full rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/60">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/60 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base">Upload to "{selectedAlbum.name}"</h3>
                  <p className="text-xs text-stone-500">Drag high-resolution files or 4K videos up to 10 GB each to upload.</p>
                </div>
              </div>
              <button onClick={() => setUploadModalOpen(false)} className="neu-glass-btn p-2 text-stone-400 hover:text-stone-700 rounded-xl transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <BulkUploader
              albumId={selectedAlbum.id}
              onUploadComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['album-media', selectedAlbum.id] });
                queryClient.invalidateQueries({ queryKey: ['event-albums', effectiveEventId] });
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Full-Screen Cinema Lightbox with Portal & Tactile High-Visibility Neu-Glass Controls */}
      {lightboxMedia && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex flex-col justify-between bg-[#eef2f7]/85 backdrop-blur-2xl p-4 sm:p-6 select-none animate-in fade-in duration-200"
          onClick={() => setLightboxMedia(null)}
        >
          {/* Ambient Glowing Orbs */}
          <div className="fixed top-1/4 right-1/4 w-[36rem] h-[36rem] bg-amber-500/15 rounded-full blur-3xl pointer-events-none -z-0"></div>
          <div className="fixed bottom-1/4 left-1/4 w-[36rem] h-[36rem] bg-amber-400/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

          {/* Top Bar Controls */}
          <div className="relative z-10 flex items-center justify-between w-full max-w-7xl mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2.5 px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-[4px_4px_12px_rgba(166,178,197,0.35),-4px_-4px_12px_rgba(255,255,255,0.95)]">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-extrabold text-stone-800 tracking-tight">{selectedAlbum?.name || 'Album Media'}</span>
              </div>
              {currentMediaIndex >= 0 && albumMedia?.length > 0 && (
                <span className="px-3 py-1.5 rounded-xl bg-white/90 border border-stone-200/80 shadow-xs text-stone-700 text-xs font-extrabold font-mono">
                  {currentMediaIndex + 1} / {albumMedia.length}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {canDownloadMedia && (
                <button
                  onClick={() => handleDownloadMedia(lightboxMedia.id, lightboxMedia.fileName)}
                  disabled={downloadingId === lightboxMedia.id}
                  className="neu-glass-btn-primary px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center space-x-2 shadow-md hover:shadow-lg active:scale-95 transition cursor-pointer text-white"
                  title="Download Original Asset"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {downloadingId === lightboxMedia.id 
                      ? 'Downloading...' 
                      : `Download ${lightboxMedia.mediaType === 'VIDEO' ? 'Video' : 'Photo'}`}
                  </span>
                </button>
              )}

              <button
                onClick={() => setLightboxMedia(null)}
                className="p-2.5 rounded-2xl bg-white/95 hover:bg-rose-50 text-stone-700 hover:text-rose-600 border border-stone-200/90 shadow-[4px_4px_12px_rgba(166,178,197,0.4),-4px_-4px_12px_rgba(255,255,255,0.95)] active:scale-95 transition cursor-pointer"
                title="Close Viewer (Esc)"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Main Media Area with Left/Right Navigation */}
          <div className="relative z-10 flex-1 flex items-center justify-center my-2 sm:my-4 w-full max-w-7xl mx-auto overflow-hidden">
            {/* Prev Arrow Button */}
            {hasPrevMedia && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxMedia(albumMedia[currentMediaIndex - 1]);
                }}
                className="absolute left-3 sm:left-6 z-20 p-3.5 sm:p-4 rounded-2xl bg-white/95 text-stone-800 hover:text-amber-600 hover:bg-white shadow-[6px_6px_20px_rgba(166,178,197,0.45),-6px_-6px_20px_rgba(255,255,255,0.95),inset_0_1px_1px_rgba(255,255,255,0.9)] border border-stone-200/80 hover:scale-110 active:scale-95 transition cursor-pointer group"
                title="Previous (Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6 stroke-[3] group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Media Item */}
            <div className="relative max-h-[76vh] max-w-[90vw] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              {lightboxMedia.mediaType === 'VIDEO' ? (
                <video
                  key={lightboxMedia.id}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  className="max-w-full max-h-[76vh] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.35),0_8px_20px_rgba(0,0,0,0.2)] bg-black border-2 border-white/80 ring-1 ring-stone-900/10"
                >
                  <source src={`/api/media/${lightboxMedia.id}/stream`} type={lightboxMedia.mimeType || "video/mp4"} />
                  <source src={`/api/media/${lightboxMedia.id}`} type={lightboxMedia.mimeType || "video/mp4"} />
                  Your browser does not support HTML5 video playback.
                </video>
              ) : (
                <img
                  src={lightboxMedia.previewUrl || lightboxMedia.fileUrl || `/api/media/${lightboxMedia.id}`}
                  alt={lightboxMedia.fileName}
                  className="max-w-full max-h-[76vh] object-contain rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.35),0_8px_20px_rgba(0,0,0,0.2)] border-2 border-white/80 ring-1 ring-stone-900/10"
                  onError={(e) => {
                    if (lightboxMedia.fileUrl && e.target.src !== lightboxMedia.fileUrl) {
                      e.target.src = lightboxMedia.fileUrl;
                    }
                  }}
                />
              )}
            </div>

            {/* Next Arrow Button */}
            {hasNextMedia && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxMedia(albumMedia[currentMediaIndex + 1]);
                }}
                className="absolute right-3 sm:right-6 z-20 p-3.5 sm:p-4 rounded-2xl bg-white/95 text-stone-800 hover:text-amber-600 hover:bg-white shadow-[6px_6px_20px_rgba(166,178,197,0.45),-6px_-6px_20px_rgba(255,255,255,0.95),inset_0_1px_1px_rgba(255,255,255,0.9)] border border-stone-200/80 hover:scale-110 active:scale-95 transition cursor-pointer group"
                title="Next (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6 stroke-[3] group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>

          {/* Bottom Floating Metadata Capsule */}
          <div className="relative z-10 flex items-center justify-center w-full" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-3 rounded-full bg-white/95 backdrop-blur-xl border border-stone-200/90 shadow-[6px_6px_22px_rgba(166,178,197,0.45),-6px_-6px_22px_rgba(255,255,255,0.95),inset_0_1px_1px_rgba(255,255,255,0.9)] flex items-center space-x-3.5 text-xs">
              <span className="font-extrabold text-stone-800 truncate max-w-xs sm:max-w-md tracking-tight">
                {lightboxMedia.fileName}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span className="font-mono text-amber-700 font-extrabold bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 rounded-lg shadow-xs">
                {(lightboxMedia.fileSize / (1024 * 1024)).toFixed(1)} MB
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-stone-300"></span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-600 bg-stone-100 border border-stone-200/80 px-2 py-0.5 rounded-lg">
                {lightboxMedia.mediaType}
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default EventUpload;
