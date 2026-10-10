import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Camera,
  Heart,
  Download,
  Share2,
  Calendar,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  Unlock,
  CheckCircle2,
  Shield,
  ShieldCheck,
  CreditCard,
  QrCode,
  Smartphone,
  Check,
  ShoppingBag,
  ExternalLink,
  ArrowRight,
  Search,
  Filter,
  User,
  Phone,
  Mail,
  Loader2,
  AlertCircle
} from 'lucide-react';
import turtledotLogo from '../../img/turtledot_app_icon_color.png';
import ContentProtectionProvider, { SecurityBadge } from '../../components/ContentProtection';

// Diagonal Repeating Watermark for Protected Previews
const DiagonalWatermark = ({ text = "© TURTLEDOT STUDIO • PREVIEW COPY • UNLOCK HD DOWNLOAD" }) => (
  <div className="absolute inset-0 z-10 pointer-events-none select-none overflow-hidden opacity-30 mix-blend-overlay flex items-center justify-center">
    <div className="rotate-[-24deg] scale-125 whitespace-nowrap text-stone-200 font-extrabold tracking-widest text-xs sm:text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase select-none">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="my-5 tracking-[0.2em]">
          {text} &nbsp; • &nbsp; {text} &nbsp; • &nbsp; {text}
        </div>
      ))}
    </div>
  </div>
);

export default function GuestCandidGallery() {
  const { token } = useParams();
  const queryClient = useQueryClient();

  // Selected album & filters
  const [selectedAlbumId, setSelectedAlbumId] = useState('ALL');
  const [guestPhoneFilter, setGuestPhoneFilter] = useState('');
  const [showOnlyPurchased, setShowOnlyPurchased] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Purchase Modal State
  const [purchasingItem, setPurchasingItem] = useState(null);
  const [purchaseStep, setPurchaseStep] = useState('FORM'); // 'FORM' | 'PROCESSING' | 'SUCCESS'
  const [guestForm, setGuestForm] = useState({
    name: '',
    phone: '',
    email: '',
    paymentMethod: 'UPI'
  });
  const [lastPurchaseResult, setLastPurchaseResult] = useState(null);

  // Local purchased photos tracker (stored in localStorage per token)
  const [purchasedMediaIds, setPurchasedMediaIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`guest_purchased_${token}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Local favorites tracker
  const [localFavorites, setLocalFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(`guest_favs_${token}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch Gallery Data
  const { data: gallery, isLoading, error } = useQuery({
    queryKey: ['clientGallery', token],
    queryFn: async () => {
      const res = await axios.get(`/api/qr/gallery/${token}`);
      return res.data?.data;
    },
    staleTime: 60000,
  });

  // Fetch backend list of purchased photos for this token (and optional phone)
  const { data: serverPurchasedIds = [] } = useQuery({
    queryKey: ['guestPurchased', token, guestForm.phone],
    queryFn: async () => {
      const params = guestForm.phone ? { phone: guestForm.phone } : {};
      const res = await axios.get(`/api/qr/gallery/${token}/photos/purchased`, { params });
      return res.data?.data || [];
    },
    enabled: !!token,
  });

  // Merge server & local purchased IDs
  const allPurchasedIds = useMemo(() => {
    const set = new Set([...purchasedMediaIds, ...serverPurchasedIds]);
    return Array.from(set);
  }, [purchasedMediaIds, serverPurchasedIds]);

  // Filter for commercial/guest candid albums
  const commercialAlbums = useMemo(() => {
    if (!gallery?.albums) return [];
    const commercial = gallery.albums.filter((a) => a.isCommercial);
    // If no albums are explicitly marked commercial yet, show all albums so guests still have access
    return commercial.length > 0 ? commercial : gallery.albums;
  }, [gallery]);

  // Aggregate all commercial candid media
  const candidMedia = useMemo(() => {
    let items = [];
    commercialAlbums.forEach((album) => {
      if (album.media) {
        album.media.forEach((m) => {
          if (m.mediaType === 'PHOTO') {
            items.push({
              ...m,
              albumId: album.id,
              albumName: album.name,
              pricePerPhoto: album.pricePerPhoto || 49,
              allowGuestPurchases: album.allowGuestPurchases !== false,
            });
          }
        });
      }
    });
    return items;
  }, [commercialAlbums]);

  // Filtered Media list
  const displayMedia = useMemo(() => {
    let list = candidMedia;

    if (selectedAlbumId !== 'ALL') {
      list = list.filter((m) => m.albumId === Number(selectedAlbumId));
    }

    if (showOnlyPurchased) {
      list = list.filter((m) => allPurchasedIds.includes(m.id));
    }

    if (favoritesOnly) {
      list = list.filter((m) => localFavorites.includes(m.id));
    }

    return list;
  }, [candidMedia, selectedAlbumId, showOnlyPurchased, favoritesOnly, allPurchasedIds, localFavorites]);

  const currentLightboxItem = lightboxIndex !== null ? displayMedia[lightboxIndex] : null;

  // Toggle favorite
  const toggleFavorite = (mediaId) => {
    setLocalFavorites((prev) => {
      const next = prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [...prev, mediaId];
      try {
        localStorage.setItem(`guest_favs_${token}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Lightbox keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev + 1) % displayMedia.length);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev - 1 + displayMedia.length) % displayMedia.length);
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
      }
    },
    [lightboxIndex, displayMedia.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Copy share link
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Direct download if already purchased
  const handleDownloadPurchased = (mediaId, fileName) => {
    const downloadUrl = `/api/qr/gallery/${token}/photos/${mediaId}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', fileName || `Candid_${mediaId}.jpg`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Initiate purchase flow
  const handleInitiatePurchase = (item) => {
    setPurchasingItem(item);
    setPurchaseStep('FORM');
    setLastPurchaseResult(null);
  };

  // Execute purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async ({ mediaId, amount, name, phone, email, paymentMethod }) => {
      const res = await axios.post(`/api/qr/gallery/${token}/photos/purchase`, {
        mediaId,
        amount,
        guestName: name,
        guestPhone: phone,
        guestEmail: email,
        paymentMethod,
        paymentReference: `UPI-${Date.now().toString().slice(-8)}`
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setLastPurchaseResult(data);
      setPurchaseStep('SUCCESS');

      // Update local storage and state
      const nextPurchased = [...purchasedMediaIds, data.mediaId];
      setPurchasedMediaIds(nextPurchased);
      try {
        localStorage.setItem(`guest_purchased_${token}`, JSON.stringify(nextPurchased));
      } catch {}

      queryClient.invalidateQueries(['guestPurchased', token]);

      // Automatically trigger clean download
      if (data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.setAttribute('download', data.mediaFileName || `Candid_${data.mediaId}.jpg`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    onError: (err) => {
      setPurchaseStep('FORM');
      alert(err.response?.data?.message || 'Payment simulation failed. Please try again.');
    }
  });

  const handleConfirmPayment = (e) => {
    e.preventDefault();
    if (!guestForm.phone || guestForm.phone.length < 8) {
      alert('Please enter a valid mobile number for receiving your photo link.');
      return;
    }
    setPurchaseStep('PROCESSING');
    purchaseMutation.mutate({
      mediaId: purchasingItem.id,
      amount: purchasingItem.pricePerPhoto || 49,
      name: guestForm.name || 'Guest Attendee',
      phone: guestForm.phone,
      email: guestForm.email,
      paymentMethod: guestForm.paymentMethod || 'UPI'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center mb-4 animate-spin">
          <Loader2 className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-stone-700">Loading Guest Candid Store...</p>
        <p className="text-xs text-stone-500 mt-1">Preparing high-resolution protected memories</p>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Guest Candid Gallery Unavailable</h2>
        <p className="text-xs text-stone-500 mt-2 max-w-sm">
          {error?.response?.data?.message || 'The QR access token may be expired or disabled.'}
        </p>
      </div>
    );
  }

  const minPrice = commercialAlbums.reduce((min, a) => Math.min(min, a.pricePerPhoto || 49), 49);

  return (
    <ContentProtectionProvider
      enabled={true}
      blurOnFocusLoss={true}
      blockShortcuts={true}
      blockContextMenu={true}
      blockDisplayMedia={true}
      clientName={gallery.clientName}
      eventName={gallery.eventName}
      studioName={gallery.studioName}
    >
      <div className="min-h-screen bg-[#faf8f5] text-stone-800 flex flex-col selection:bg-amber-100 selection:text-amber-900">
        
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-stone-200/80 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
            
            {/* Left: Studio Branding */}
            <div className="flex items-center space-x-3 min-w-0">
              {gallery.studioLogoUrl ? (
                <img src={gallery.studioLogoUrl} alt="Logo" className="w-8 h-8 rounded-xl object-contain shadow-xs shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-stone-900 truncate tracking-tight">
                    {gallery.studioName || 'Turtledot Studio'}
                  </span>
                  <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-800 border border-amber-500/30 text-[10px] font-bold">
                    Candid Store
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 truncate">{gallery.eventName}</p>
              </div>
            </div>

            {/* Right: Security & Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <SecurityBadge />

              <button
                onClick={handleShare}
                className="neu-glass-btn p-2 sm:px-3 sm:py-1.5 rounded-xl text-stone-700 hover:text-stone-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Share Store Link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
              </button>

              <Link
                to={`/gallery/${token}`}
                className="neu-glass-btn px-3 py-1.5 rounded-xl text-stone-700 hover:text-amber-800 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <span>Full Ceremony Gallery</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Banner: Event Info & Monetization Notice */}
        <section className="relative overflow-hidden bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 text-white py-10 sm:py-14 px-4 lg:px-8 shadow-inner">
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px]" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Guest Candid Store • Instant HD Downloads</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-serif font-extrabold tracking-tight text-stone-100">
              Find & Download Your Candid Memories
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl mx-auto leading-relaxed">
              Explore professional candid captures taken during <strong className="text-amber-300">{gallery.eventName}</strong>. 
              Click any photo to preview. Unlock pristine, full-resolution unwatermarked downloads starting at <span className="text-amber-400 font-extrabold">₹{minPrice}/photo</span>.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-stone-400 font-medium">
              {gallery.eventDate && (
                <span className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1 rounded-full border border-stone-700/80">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  {new Date(gallery.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
              {gallery.location && (
                <span className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1 rounded-full border border-stone-700/80">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {gallery.location}
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-stone-800/80 px-3 py-1 rounded-full border border-stone-700/80 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Anti-Screenshot Protected
              </span>
            </div>
          </div>
        </section>

        {/* Filter & Album Navigation Bar */}
        <div className="sticky top-16 z-20 bg-[#faf8f5]/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs py-3 px-4 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Album Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedAlbumId('ALL')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedAlbumId === 'ALL'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 hover:bg-stone-50'
                }`}
              >
                <span>All Candids</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-stone-700 text-stone-200 font-mono">
                  {candidMedia.length}
                </span>
              </button>

              {commercialAlbums.map((album) => {
                const count = album.media?.filter((m) => m.mediaType === 'PHOTO').length || 0;
                const isSelected = selectedAlbumId === album.id;
                return (
                  <button
                    key={album.id}
                    onClick={() => setSelectedAlbumId(album.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 hover:bg-stone-50'
                    }`}
                  >
                    <span>{album.name}</span>
                    <span className="text-[10px] text-amber-600 font-extrabold">₹{album.pricePerPhoto || 49}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-stone-100 text-stone-600 font-mono">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Quick Toggles (Purchased & Favorites) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowOnlyPurchased(!showOnlyPurchased)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  showOnlyPurchased
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>My Unlocked Photos ({allPurchasedIds.length})</span>
              </button>

              <button
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  favoritesOnly
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-white' : ''}`} />
                <span>Favorites ({localFavorites.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Photo Grid */}
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 flex-1 w-full">
          {displayMedia.length === 0 ? (
            <div className="py-24 text-center rounded-3xl border border-stone-200/80 bg-white/80 backdrop-blur-md p-8 shadow-sm">
              <Camera className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-stone-800">No candid photos match your filter</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                {showOnlyPurchased
                  ? 'You haven’t unlocked any photos yet. Click on any photo to purchase and download your high-resolution copy!'
                  : 'There are currently no photos in this album collection.'}
              </p>
              {(showOnlyPurchased || favoritesOnly) && (
                <button
                  onClick={() => {
                    setShowOnlyPurchased(false);
                    setFavoritesOnly(false);
                  }}
                  className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-stone-800 transition"
                >
                  View All Candid Photos
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {displayMedia.map((item, index) => {
                const isPurchased = allPurchasedIds.includes(item.id);
                const isFav = localFavorites.includes(item.id);
                const price = item.pricePerPhoto || 49;

                return (
                  <div
                    key={item.id}
                    onClick={() => setLightboxIndex(index)}
                    className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-stone-200/90 bg-stone-900 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-amber-400 select-none"
                  >
                    {/* Protected Photo Layer */}
                    <img
                      src={item.thumbnailUrl || item.previewUrl || item.fileUrl || `/api/media/${item.id}/thumbnail`}
                      alt={item.fileName}
                      loading="lazy"
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105 pointer-events-none select-none drm-media"
                    />

                    {/* Anti-Screenshot Diagonal Watermark Overlay (Only if not purchased) */}
                    {!isPurchased && <DiagonalWatermark />}

                    {/* Transparent Click Shield Over Image */}
                    <div className="absolute inset-0 z-15 pointer-events-auto" />

                    {/* Top Status Badges */}
                    <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 pointer-events-none">
                      {isPurchased ? (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-600/95 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Unlocked</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-600/95 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-md border border-amber-400/40">
                          <Sparkles className="w-3 h-3" />
                          <span>₹{price}</span>
                        </span>
                      )}
                    </div>

                    {/* Top Right: Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item.id);
                      }}
                      className={`absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isFav
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-stone-900/60 backdrop-blur-md text-white/80 opacity-0 group-hover:opacity-100 hover:bg-stone-900 hover:text-rose-400'
                      }`}
                      title="Favorite"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-white' : ''}`} />
                    </button>

                    {/* Bottom Action Footer on Hover */}
                    <div className="absolute inset-x-0 bottom-0 z-20 p-2.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between text-xs text-white">
                      <span className="truncate text-[11px] text-stone-200 font-medium max-w-[100px]">
                        {item.fileName}
                      </span>

                      {isPurchased ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPurchased(item.id, item.fileName);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-sm transition"
                          title="Download Unwatermarked Original"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInitiatePurchase(item);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-[11px] font-extrabold flex items-center gap-1 shadow-md transition"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>Buy ₹{price}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Lightbox Cinema Modal */}
        {currentLightboxItem && (
          <div
            className="fixed inset-0 z-[99990] bg-stone-950/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Lightbox Bar */}
            <div className="relative z-30 flex items-center justify-between w-full max-w-7xl mx-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center space-x-3 text-white">
                <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md text-xs font-extrabold border border-white/20">
                  {currentLightboxItem.albumName}
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  {lightboxIndex + 1} / {displayMedia.length}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <SecurityBadge />
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Center Image Stage with Anti-Screenshot Watermark */}
            <div
              className="relative flex-1 flex items-center justify-center my-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-w-full max-h-[75vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                <img
                  src={currentLightboxItem.previewUrl || currentLightboxItem.fileUrl || `/api/media/${currentLightboxItem.id}/preview`}
                  alt={currentLightboxItem.fileName}
                  className="max-w-full max-h-[75vh] object-contain pointer-events-none select-none drm-media"
                />

                {/* Diagonal Watermark if unpaid */}
                {!allPurchasedIds.includes(currentLightboxItem.id) && <DiagonalWatermark />}

                {/* Transparent Guard Overlay */}
                <div className="absolute inset-0 z-20 pointer-events-auto" />
              </div>

              {/* Prev / Next Controls */}
              {displayMedia.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((prev) => (prev - 1 + displayMedia.length) % displayMedia.length);
                    }}
                    className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition cursor-pointer z-30"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((prev) => (prev + 1) % displayMedia.length);
                    }}
                    className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 transition cursor-pointer z-30"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Lightbox Action Bar */}
            <div
              className="relative z-30 max-w-xl mx-auto w-full p-4 rounded-2xl bg-stone-900/90 backdrop-blur-xl border border-white/15 text-white flex items-center justify-between shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="min-w-0 pr-4">
                <p className="text-xs font-bold truncate">{currentLightboxItem.fileName}</p>
                <p className="text-[11px] text-stone-400">
                  {allPurchasedIds.includes(currentLightboxItem.id)
                    ? '✓ Full high-resolution license unlocked'
                    : `Original unwatermarked copy • ₹${currentLightboxItem.pricePerPhoto || 49}`}
                </p>
              </div>

              {allPurchasedIds.includes(currentLightboxItem.id) ? (
                <button
                  onClick={() => handleDownloadPurchased(currentLightboxItem.id, currentLightboxItem.fileName)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Clean HD</span>
                </button>
              ) : (
                <button
                  onClick={() => handleInitiatePurchase(currentLightboxItem)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Unlock Photo (₹{currentLightboxItem.pricePerPhoto || 49})</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pay-Per-Photo Checkout Modal */}
        {purchasingItem && (
          <div className="fixed inset-0 z-[99999] bg-stone-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="neu-glass-panel max-w-md w-full rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/70 animate-in zoom-in-95 duration-150 text-stone-900">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-800 flex items-center justify-center shadow-xs">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-base">Instant Photo Download</h3>
                    <p className="text-xs text-stone-500">Unwatermarked Original High-Res Copy</p>
                  </div>
                </div>
                <button
                  onClick={() => setPurchasingItem(null)}
                  className="neu-glass-btn p-2 text-stone-400 hover:text-stone-700 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {purchaseStep === 'FORM' && (
                <form onSubmit={handleConfirmPayment} className="space-y-4 mt-4">
                  
                  {/* Photo Summary Card */}
                  <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-stone-100/80 border border-stone-200/80">
                    <img
                      src={purchasingItem.thumbnailUrl || purchasingItem.previewUrl || `/api/media/${purchasingItem.id}/thumbnail`}
                      alt={purchasingItem.fileName}
                      className="w-14 h-14 rounded-xl object-cover border border-stone-300/80 shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-stone-900 truncate">{purchasingItem.fileName}</p>
                      <p className="text-[11px] text-stone-500">{purchasingItem.albumName}</p>
                      <p className="text-sm font-extrabold text-amber-700 mt-0.5">
                        ₹{purchasingItem.pricePerPhoto || 49}{' '}
                        <span className="text-[10px] font-normal text-stone-500">(inclusive of all taxes)</span>
                      </p>
                    </div>
                  </div>

                  {/* Guest Contact Inputs */}
                  <div className="space-y-3 text-xs font-semibold">
                    <div>
                      <label className="block text-stone-700 font-bold mb-1">Your Name *</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rahul Sharma"
                          value={guestForm.name}
                          onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 neu-glass-input rounded-xl text-stone-900 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-700 font-bold mb-1">Mobile Number (WhatsApp) *</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 9876543210"
                          value={guestForm.phone}
                          onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 neu-glass-input rounded-xl text-stone-900 font-bold"
                        />
                      </div>
                      <p className="text-[10px] text-stone-500 mt-1">Used to verify and retrieve your purchases later</p>
                    </div>

                    {/* Payment Method Selector */}
                    <div>
                      <label className="block text-stone-700 font-bold mb-1.5">Payment Method</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setGuestForm({ ...guestForm, paymentMethod: 'UPI' })}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                            guestForm.paymentMethod === 'UPI'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>UPI / QR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGuestForm({ ...guestForm, paymentMethod: 'CARD' })}
                          className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                            guestForm.paymentMethod === 'CARD'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Card / NetBanking</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit CTA */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={purchaseMutation.isPending}
                      className="w-full neu-glass-btn-primary py-3 rounded-2xl text-white font-extrabold text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>Pay ₹{purchasingItem.pricePerPhoto || 49} & Unlock Photo</span>
                    </button>
                    <p className="text-[10px] text-center text-stone-400 mt-2 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Secure 256-Bit Encrypted Payment • Instant HD Download</span>
                    </p>
                  </div>
                </form>
              )}

              {purchaseStep === 'PROCESSING' && (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-600 mx-auto flex items-center justify-center animate-spin">
                    <Loader2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-stone-900 text-base">Processing Payment...</h4>
                    <p className="text-xs text-stone-500 mt-1">Connecting to UPI Gateway & Generating Download Token</p>
                  </div>
                </div>
              )}

              {purchaseStep === 'SUCCESS' && lastPurchaseResult && (
                <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-md animate-bounce">
                    <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                  </div>
                  
                  <div>
                    <h4 className="font-extrabold text-stone-900 text-lg">Payment Successful!</h4>
                    <p className="text-xs text-stone-500 mt-1">
                      Your high-resolution unwatermarked photo is unlocked.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-left text-xs space-y-1.5">
                    <div className="flex justify-between font-semibold text-stone-700">
                      <span>Receipt:</span>
                      <span className="font-mono text-emerald-800">{lastPurchaseResult.paymentReference}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-stone-700">
                      <span>Amount Paid:</span>
                      <span className="font-extrabold text-stone-900">₹{lastPurchaseResult.amount}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-stone-700">
                      <span>File:</span>
                      <span className="truncate max-w-[160px] text-stone-600">{lastPurchaseResult.mediaFileName}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadPurchased(lastPurchaseResult.mediaId, lastPurchaseResult.mediaFileName)}
                      className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Clean Photo Again</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPurchasingItem(null)}
                      className="w-full neu-glass-btn py-2.5 rounded-2xl text-stone-700 font-bold text-xs transition cursor-pointer"
                    >
                      Browse More Candids
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </ContentProtectionProvider>
  );
}
