import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Camera,
  Video,
  Heart,
  Download,
  Share2,
  Calendar,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  Play,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Check,
  AlertCircle,
  Phone,
  Mail,
  Layers,
  Film,
  Lock,
  Unlock,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Shield,
  ArrowRight,
  Percent,
  Info,
  Archive,
  FileText,
  Receipt,
  ShoppingBag
} from 'lucide-react';
import turtledotLogo from '../../img/turtledot_app_icon_color.png';
import { formatCurrency } from '../../utils/currency';
import ContentProtectionProvider, { SecurityBadge } from '../../components/ContentProtection';


export default function GalleryHome() {
  const { token } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [selectedAlbumId, setSelectedAlbumId] = useState('ALL');
  const [mediaTypeFilter, setMediaTypeFilter] = useState('ALL'); // 'ALL' | 'IMAGE' | 'VIDEO'
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState(false);

  // DRM Anti-Screenshot Full Image Blur & Protection State
  const [holdingCardId, setHoldingCardId] = useState(null);
  const [isHoldingLightbox, setIsHoldingLightbox] = useState(false);
  const [isModifierKeyPressed, setIsModifierKeyPressed] = useState(false);

  // Keyboard capture detection: if user presses Cmd, Shift, Ctrl, Alt, or PrintScreen, immediately force blur
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key ? e.key.toLowerCase() : '';
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        key === 'meta' ||
        key === 'shift' ||
        key === 'control' ||
        key === 'alt' ||
        key === 'printscreen'
      ) {
        setIsModifierKeyPressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        setIsModifierKeyPressed(false);
      }
    };

    const handleWindowBlur = () => {
      setIsModifierKeyPressed(false);
      setHoldingCardId(null);
      setIsHoldingLightbox(false);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  // Automated Payment & Access Gating State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTierTarget, setPaymentTierTarget] = useState('100%'); // '80%' | '100%' | 'CUSTOM'
  const [customPaymentAmount, setCustomPaymentAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('UPI');
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Fetch gallery data
  const { data: gallery, isLoading, error } = useQuery({
    queryKey: ['clientGallery', token],
    queryFn: async () => {
      const res = await axios.get(`/api/qr/gallery/${token}`);
      return res.data.data;
    },
    enabled: !!token,
    retry: 1,
  });

  // Automated Gallery Payment Mutation
  const payMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axios.post('/api/qr/gallery/pay', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setPaymentSuccessMessage(data.message || 'Payment processed successfully! Access updated.');
      setPaymentError(null);
      queryClient.invalidateQueries(['clientGallery', token]);
    },
    onError: (err) => {
      setPaymentError(err.response?.data?.message || 'Payment processing failed. Please try again.');
    },
  });

  // Favorite toggle mutation
  const favoriteMutation = useMutation({
    mutationFn: async (mediaId) => {
      await axios.post(`/api/media/${mediaId}/favorite`);
    },
    onMutate: async (mediaId) => {
      await queryClient.cancelQueries(['clientGallery', token]);
      const prevData = queryClient.getQueryData(['clientGallery', token]);

      if (prevData) {
        const updatedAlbums = prevData.albums.map((album) => ({
          ...album,
          media: album.media.map((m) =>
            m.id === mediaId ? { ...m, isFavorite: !m.isFavorite } : m
          ),
        }));
        queryClient.setQueryData(['clientGallery', token], {
          ...prevData,
          albums: updatedAlbums,
        });
      }
      return { prevData };
    },
    onError: (err, mediaId, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(['clientGallery', token], context.prevData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(['clientGallery', token]);
    },
  });

  // If an event only contains commercial candid albums, immediately route visitors directly to the Guest Candid Portal!
  useEffect(() => {
    if (gallery?.albums && gallery.albums.length > 0) {
      const hasNonCommercial = gallery.albums.some((a) => !a.isCommercial);
      if (!hasNonCommercial) {
        navigate(`/gallery/${token}/guest`, { replace: true });
      }
    }
  }, [gallery, token, navigate]);

  // Aggregate all media across ceremony albums (excluding commercial guest albums)
  const allMedia = React.useMemo(() => {
    if (!gallery || !gallery.albums) return [];
    let items = [];
    gallery.albums.forEach((album) => {
      // Commercial guest candid albums are kept separate from the host's private ceremony albums
      if (!album.isCommercial && album.media) {
        const taggedMedia = album.media.map((m) => ({
          ...m,
          albumName: album.name,
        }));
        items = [...items, ...taggedMedia];
      }
    });
    return items;
  }, [gallery]);

  // Filter media based on state
  const displayMedia = React.useMemo(() => {
    let list = [];
    if (selectedAlbumId === 'ALL') {
      list = allMedia;
    } else {
      const album = gallery?.albums?.find((a) => a.id === Number(selectedAlbumId));
      list = album?.media?.map((m) => ({ ...m, albumName: album.name })) || [];
    }

    if (mediaTypeFilter !== 'ALL') {
      list = list.filter((m) => m.mediaType === mediaTypeFilter);
    }

    if (favoritesOnly) {
      list = list.filter((m) => m.isFavorite);
    }

    return list;
  }, [gallery, selectedAlbumId, mediaTypeFilter, favoritesOnly, allMedia]);

  const currentItem = lightboxIndex !== null ? displayMedia[lightboxIndex] : null;

  // Keyboard navigation for Lightbox
  const handleKeyDown = useCallback(
    (e) => {
      if (lightboxIndex === null) return;

      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev + 1) % displayMedia.length);
        setZoomLevel(1);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev - 1 + displayMedia.length) % displayMedia.length);
        setZoomLevel(1);
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
        setIsPlayingSlideshow(false);
        setZoomLevel(1);
      }
    },
    [lightboxIndex, displayMedia.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Slideshow effect
  useEffect(() => {
    let timer;
    if (isPlayingSlideshow && lightboxIndex !== null && displayMedia.length > 1) {
      timer = setInterval(() => {
        setLightboxIndex((prev) => (prev + 1) % displayMedia.length);
        setZoomLevel(1);
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlayingSlideshow, lightboxIndex, displayMedia.length]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Download Handler for individual photos and videos (Requires 100% Payment)
  const handleDownload = (mediaId, fileName) => {
    // Check if this media belongs to a commercial guest candid album
    const parentAlbum = gallery?.albums?.find((a) => a.media?.some((m) => m.id === mediaId));
    if (parentAlbum?.isCommercial) {
      navigate(`/gallery/${token}/guest`);
      return;
    }

    if (gallery?.downloadLocked || (gallery?.paidPercentage !== undefined && gallery.paidPercentage < 100)) {
      showToast('Please complete 100% of the payment to download photos, videos, or albums.');
      setPaymentTierTarget('100%');
      setShowPaymentModal(true);
      return;
    }
    const link = document.createElement('a');
    link.href = `/api/media/${mediaId}/download`;
    link.download = fileName || `asset_${mediaId}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Handler for entire Album ZIP (Requires 100% Payment)
  const handleDownloadAlbum = (albumId, albumName) => {
    if (gallery?.downloadLocked || (gallery?.paidPercentage !== undefined && gallery.paidPercentage < 100)) {
      showToast('Please complete 100% of the payment to download photos, videos, or albums.');
      setPaymentTierTarget('100%');
      setShowPaymentModal(true);
      return;
    }
    const link = document.createElement('a');
    link.href = `/api/qr/gallery/${token}/albums/${albumId}/download`;
    link.download = `${albumName || 'Album'}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  const handleDownloadInvoice = async (paymentId = null, invoiceNo = null) => {
    try {
      setDownloadingInvoiceId(paymentId || 'latest');
      const url = paymentId
        ? `/api/qr/gallery/${token}/payments/${paymentId}/invoice`
        : `/api/qr/gallery/${token}/invoice`;

      const res = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `GST_Invoice_${invoiceNo || (paymentId ? `INV_${paymentId}` : token)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showToast('GST Tax Invoice downloaded successfully!');
    } catch (err) {
      showToast('Failed to download invoice. Please try again.');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const handleExecutePayment = (e) => {
    e.preventDefault();
    setPaymentError(null);

    let amountToPay = 0;
    if (paymentTierTarget === '80%') {
      amountToPay = gallery?.amountNeededForVideoAccess || 0;
    } else if (paymentTierTarget === '100%') {
      amountToPay = gallery?.balanceAmount || 0;
    } else {
      amountToPay = parseFloat(customPaymentAmount);
      if (isNaN(amountToPay) || amountToPay <= 0) {
        setPaymentError('Please enter a valid payment amount.');
        return;
      }
    }

    if (amountToPay <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }

    payMutation.mutate({
      tokenValue: token,
      amount: amountToPay,
      paymentMethod: selectedPaymentMethod,
      tierTarget: paymentTierTarget
    });
  };

  // Render Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] text-stone-800 flex flex-col items-center justify-center p-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-amber-600/20 border-t-amber-600 rounded-full animate-spin"></div>
          <Sparkles className="w-6 h-6 text-amber-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="mt-6 text-stone-500 font-serif tracking-widest text-sm uppercase animate-pulse">
          Opening Your Exclusive Studio Gallery...
        </p>
      </div>
    );
  }

  // Render Error / Invalid State
  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-[#faf8f5] text-stone-800 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-rose-600" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-3">
          Gallery Link Expired or Unavailable
        </h1>
        <p className="text-stone-500 max-w-md mb-8 text-sm leading-relaxed">
          The requested QR delivery code could not be verified, has expired, or is currently deactivated by the studio.
        </p>
        <div className="flex gap-4">
          <a
            href="mailto:contact@studio.local"
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-amber-600/20"
          >
            Contact Studio Support
          </a>
        </div>
      </div>
    );
  }

  const favoriteCount = allMedia.filter((m) => m.isFavorite).length;
  const paidPct = gallery.paidPercentage !== undefined ? Math.round(gallery.paidPercentage) : 100;
  const isVideoLocked = Boolean(gallery.videoLocked);
  const isDownloadLocked = Boolean(gallery.downloadLocked || paidPct < 100);

  return (
    <ContentProtectionProvider enabled={isDownloadLocked}>
      <div className={`min-h-screen bg-[#faf8f5] text-stone-800 pb-20 relative ${isDownloadLocked ? 'drm-protected' : ''}`}>
        {/* Dynamic Notification Toast */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 backdrop-blur-md text-amber-200 border border-amber-500/50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm animate-bounce duration-300 max-w-lg w-[90%] sm:w-auto">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="font-medium text-stone-100 flex-1">{toastMessage}</span>
            <button
              onClick={() => {
                setPaymentTierTarget(toastMessage.includes('100%') ? '100%' : '80%');
                setShowPaymentModal(true);
              }}
              className="ml-2 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow transition shrink-0"
            >
              Unlock Now
            </button>
          </div>
        )}

        {/* Top Studio Brand Bar */}
        <header className="sticky top-0 z-30 bg-[#faf8f5]/85 backdrop-blur-xl border-b border-stone-200/90 px-4 lg:px-8 py-3.5 transition-all shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-stone-200/80 p-1 flex items-center justify-center shadow-md shadow-stone-200/50 overflow-hidden shrink-0">
                <img src={gallery.studioLogoUrl || turtledotLogo} alt="Turtledot Studio" className="w-full h-full object-contain" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-stone-900 flex items-center gap-2">
                  {gallery.studioName || 'Turtledot Studio'}
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Client Portal
                  </span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isDownloadLocked ? (
                <>
                  <SecurityBadge />
                  <button
                    onClick={() => {
                      setPaymentTierTarget('100%');
                      setShowPaymentModal(true);
                    }}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-xs font-semibold text-white transition shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Unlock Downloads (100%)</span>
                  </button>
                </>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>All Media & Downloads Unlocked</span>
                </span>
              )}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-xs font-medium text-stone-700 border border-stone-200 transition shadow-sm"
              title="Share Gallery Link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-stone-400" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header Section */}
      <section className="relative overflow-hidden pt-10 pb-12 px-4 lg:px-8 border-b border-stone-200/80 bg-gradient-to-b from-amber-50/50 to-transparent">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-200/20 blur-[130px] rounded-full"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-stone-200 text-amber-800 text-xs font-medium mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Presented for {gallery.clientName}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-stone-900 tracking-tight mb-4">
            {gallery.eventName}
          </h1>

          {gallery.description && (
            <p className="text-stone-600 text-sm sm:text-base max-w-2xl mx-auto mb-6 leading-relaxed">
              {gallery.description}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-stone-600 mb-8">
            {gallery.eventDate && (
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>{new Date(gallery.eventDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </div>
            )}
            {gallery.location && (
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>{gallery.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm">
              <Camera className="w-4 h-4 text-amber-600" />
              <span>{gallery.totalPhotos || 0} Photos</span>
            </div>
            {gallery.totalVideos > 0 && (
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm">
                <Film className="w-4 h-4 text-amber-600" />
                <span>{gallery.totalVideos} Videos</span>
              </div>
            )}
          </div>

          {/* TIERED ACCESS & PAYMENT PROGRESS CARD */}
          <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-md border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-md shadow-stone-200/40 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Media Access & Download Status</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-base font-bold text-stone-900">
                    {paidPct < 50
                      ? 'Tier 0: Deposit Pending (<50%)'
                      : paidPct < 80
                      ? 'Tier 1: Photos Viewable (50%+ Milestone)'
                      : paidPct < 100
                      ? 'Tier 2: Full Viewing Access (80%+ Milestone)'
                      : 'Tier 3: 100% Settled (Full Download Access)'}
                  </h3>
                  {isDownloadLocked ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <Lock className="w-3 h-3" /> Downloads Locked (100% Required)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5" /> 100% Full Access
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isDownloadLocked ? (
                  <button
                    onClick={() => {
                      setPaymentTierTarget('100%');
                      setShowPaymentModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 neu-glass-btn-primary rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Pay {formatCurrency(gallery.amountNeededForDownload || gallery.balanceAmount || 0, gallery.currency)} for 100% Access</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setPaymentTierTarget('100%');
                      setShowPaymentModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold border border-stone-200 transition"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-stone-500" />
                    <span>View Financials</span>
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar with 50%, 80%, and 100% milestones */}
            <div className="relative pt-2 pb-1">
              <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-200 relative">
                <div
                  className={`h-full transition-all duration-700 rounded-full ${
                    isDownloadLocked
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                  }`}
                  style={{ width: `${Math.min(paidPct, 100)}%` }}
                ></div>
              </div>

              {/* Milestone Markers */}
              <div className="relative w-full h-9 mt-1 text-[10px] sm:text-[11px] text-stone-500 font-medium">
                {/* 50% Marker */}
                <div className="absolute top-0 -translate-x-1/2 flex flex-col items-center" style={{ left: '50%' }}>
                  <div className="w-0.5 h-2 bg-stone-300"></div>
                  <span className={`flex items-center gap-0.5 mt-0.5 font-bold ${paidPct >= 50 ? 'text-emerald-700' : 'text-stone-500'}`}>
                    {paidPct >= 50 ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : null} 50% Photos
                  </span>
                </div>

                {/* 80% Marker */}
                <div className="absolute top-0 -translate-x-1/2 flex flex-col items-center" style={{ left: '80%' }}>
                  <div className={`w-0.5 h-2 ${paidPct >= 80 ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                  <span className={`flex items-center gap-0.5 mt-0.5 font-bold ${paidPct >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {paidPct >= 80 ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-amber-600" />}
                    80% Videos
                  </span>
                </div>

                {/* 100% Marker */}
                <div className="absolute top-0 -translate-x-full flex flex-col items-end" style={{ left: '100%' }}>
                  <div className={`w-0.5 h-2 ${paidPct >= 100 ? 'bg-emerald-500' : 'bg-stone-300'}`}></div>
                  <span className={`flex items-center gap-0.5 mt-0.5 font-bold ${paidPct >= 100 ? 'text-emerald-700' : 'text-stone-600'}`}>
                    {paidPct >= 100 ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-amber-600" />}
                    100% Downloads
                  </span>
                </div>
              </div>
            </div>

            {/* Notification Callout when Video or Download is Locked */}
            {isVideoLocked && (
              <div className="mt-2 p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Please complete 80% of the payment to get the full access.</strong> You currently have photo access.
                  </span>
                </div>
                <span className="font-bold text-amber-800 text-[11px] shrink-0 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
                  {paidPct}% Paid
                </span>
              </div>
            )}

            {!isVideoLocked && isDownloadLocked && (
              <div className="mt-2 p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Please complete 100% of the payment to download photos, videos, or albums.</strong> Video streaming is active.
                  </span>
                </div>
                <span className="font-bold text-amber-800 text-[11px] shrink-0 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
                  {paidPct}% Paid
                </span>
              </div>
            )}

            {/* PAYMENT RECEIPTS & GST INVOICES */}
            {gallery?.payments && gallery.payments.length > 0 && (
              <div className="mt-4 pt-3.5 border-t border-stone-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-stone-900">
                      Payment Receipts & GST Tax Invoices ({gallery.payments.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadInvoice(null, 'Latest')}
                    disabled={downloadingInvoiceId !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 hover:text-amber-950 border border-amber-300 transition shadow-xs self-start sm:self-auto"
                    title="Download latest official GST tax invoice"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-700" />
                    <span>Download Latest GST Invoice (PDF)</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {gallery.payments.map((pmt) => (
                    <div
                      key={pmt.id}
                      className="p-3 bg-stone-50/90 rounded-xl border border-stone-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs hover:border-amber-300 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                          ✓
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-stone-900">{formatCurrency(pmt.amount, gallery.currency)}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-200 text-stone-700 font-mono">
                              {pmt.invoiceNumber || `INV-${pmt.id}`}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              PAID
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            {pmt.paymentDate ? new Date(pmt.paymentDate).toLocaleDateString() : '—'} • {pmt.paymentMethod?.replace('_', ' ')}
                            {pmt.paymentReference ? ` • Ref: ${pmt.paymentReference}` : ''}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(pmt.id, pmt.invoiceNumber)}
                        disabled={downloadingInvoiceId === pmt.id}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-stone-700 bg-white hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-stone-300 transition shrink-0 shadow-xs"
                        title="Download GST invoice for this payment"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-700" />
                        <span>{downloadingInvoiceId === pmt.id ? 'Generating...' : 'Download Invoice (PDF)'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Commercial Guest Candid Store Banner */}
      {gallery.albums?.some((a) => a.isCommercial) && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white shadow-sm border-b border-amber-400/40">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 text-center sm:text-left">
              <span className="p-1 rounded-lg bg-white/20 backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-white" />
              </span>
              <p className="text-xs font-bold">
                Guest Candid Store is Live! Guests can preview, purchase, and download their high-resolution candid photos.
              </p>
            </div>
            <Link
              to={`/gallery/${token}/guest`}
              className="px-3.5 py-1.5 rounded-xl bg-white text-stone-900 hover:bg-stone-100 text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
              <span>Open Guest Candid Store</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Control Navigation & Filter Bar */}
      <div className="sticky top-[57px] z-20 bg-[#faf8f5]/95 backdrop-blur-md border-b border-stone-200/80 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2.5 space-y-2.5">
          {/* Top Row: Album Navigation & Primary Album Download Action */}
          <div className="flex items-center justify-between gap-3">
            {/* Album Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <button
                onClick={() => setSelectedAlbumId('ALL')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedAlbumId === 'ALL'
                    ? 'bg-stone-900 text-white shadow-sm font-semibold'
                    : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                <span>All Photos</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    selectedAlbumId === 'ALL'
                      ? 'bg-stone-700 text-stone-200'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {allMedia.length}
                </span>
              </button>

              {gallery.albums &&
                gallery.albums.map((album) => {
                  const isSelected = selectedAlbumId === album.id;
                  const count = album.media?.length || 0;
                  return (
                    <button
                      key={album.id}
                      onClick={() => {
                        if (album.isCommercial) {
                          navigate(`/gallery/${token}/guest`);
                        } else {
                          setSelectedAlbumId(album.id);
                        }
                      }}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        album.isCommercial
                          ? 'bg-amber-500/10 text-amber-900 border border-amber-300 hover:bg-amber-500/20'
                          : isSelected
                          ? 'bg-stone-900 text-white shadow-sm font-semibold'
                          : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/80'
                      }`}
                    >
                      {album.isCommercial && <Sparkles className="w-3.5 h-3.5 text-amber-600" />}
                      <span>{album.name}</span>
                      {album.isCommercial ? (
                        <span className="flex items-center gap-1 text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-extrabold">
                          ₹{album.pricePerPhoto || 49} • Guest Store ↗
                        </span>
                      ) : (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            isSelected
                              ? 'bg-stone-700 text-stone-200'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>

            {/* Album Download ZIP Button / Guest Store Link */}
            {(() => {
              const currentAlbum =
                selectedAlbumId === 'ALL'
                  ? gallery.albums?.find((a) => !a.isCommercial)
                  : gallery.albums?.find((a) => a.id === Number(selectedAlbumId));

              // If current album is commercial or there are no non-commercial albums
              if (!currentAlbum || currentAlbum.isCommercial) {
                const commercialAlbum = gallery.albums?.find((a) => a.isCommercial);
                if (commercialAlbum) {
                  return (
                    <div className="shrink-0">
                      <button
                        onClick={() => navigate(`/gallery/${token}/guest`)}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Open Guest Store (₹{commercialAlbum.pricePerPhoto || 49}/photo)</span>
                      </button>
                    </div>
                  );
                }
                return null;
              }

              return (
                <div className="shrink-0">
                  <button
                    onClick={() => handleDownloadAlbum(currentAlbum.id, currentAlbum.name)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition shadow-sm ${
                      isDownloadLocked
                        ? 'bg-white hover:bg-amber-50/70 border border-amber-200 text-stone-700 hover:text-amber-900'
                        : 'bg-stone-900 hover:bg-stone-800 text-white border border-stone-900 font-semibold'
                    }`}
                    title={
                      isDownloadLocked
                        ? '100% payment required to download album ZIP'
                        : 'Download Album as ZIP'
                    }
                  >
                    {isDownloadLocked ? (
                      <Archive className="w-3.5 h-3.5 text-stone-500" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-white" />
                    )}
                    <span className="hidden sm:inline">
                      {selectedAlbumId === 'ALL'
                        ? 'Download Ceremony Album (ZIP)'
                        : `Download ${currentAlbum.name} (ZIP)`}
                    </span>
                    <span className="sm:hidden">Download ZIP</span>
                    {isDownloadLocked && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300/80">
                        <Lock className="w-2.5 h-2.5 text-amber-700" />
                        100% Required
                      </span>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Bottom Row: Media Filters, Favorites & View Tools */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-200/60">
            {/* Filter Group: Type & Favorites */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type selector */}
              <div className="flex items-center p-0.5 bg-stone-200/60 rounded-lg text-xs">
                <button
                  onClick={() => setMediaTypeFilter('ALL')}
                  className={`px-3 py-1 rounded-md transition font-medium ${
                    mediaTypeFilter === 'ALL'
                      ? 'bg-white text-stone-900 shadow-sm font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setMediaTypeFilter('PHOTO')}
                  className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition font-medium ${
                    mediaTypeFilter === 'PHOTO'
                      ? 'bg-white text-amber-900 shadow-sm font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Camera className="w-3 h-3 text-stone-500" />
                  <span>Photos</span>
                </button>
                <button
                  onClick={() => setMediaTypeFilter('VIDEO')}
                  className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition font-medium ${
                    mediaTypeFilter === 'VIDEO'
                      ? 'bg-white text-amber-900 shadow-sm font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Video className="w-3 h-3 text-stone-500" />
                  <span>Videos</span>
                  {isVideoLocked && (
                    <Lock className="w-2.5 h-2.5 text-amber-700 ml-0.5" />
                  )}
                </button>
              </div>

              {/* Favorite Filter Button */}
              <button
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all shadow-sm ${
                  favoritesOnly
                    ? 'bg-rose-50 border-rose-300 text-rose-700 font-semibold'
                    : 'bg-white border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
                title="Show favorited photos"
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    favoritesOnly ? 'fill-rose-500 text-rose-500' : 'text-stone-400'
                  }`}
                />
                <span>Favorites ({favoriteCount})</span>
              </button>
            </div>

            {/* Right Action Group: Count & Slideshow */}
            <div className="flex items-center gap-3">
              <span className="hidden md:inline text-xs text-stone-500">
                Showing <strong className="text-stone-700">{displayMedia.length}</strong> of{' '}
                {allMedia.length} memories
              </span>

              {displayMedia.length > 0 && (
                <button
                  onClick={() => {
                    setLightboxIndex(0);
                    setIsPlayingSlideshow(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white border border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 text-amber-600" />
                  <span>Play Slideshow</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Gallery Grid */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 mt-8">
        {displayMedia.length === 0 ? (
          <div className="py-24 text-center rounded-2xl border border-stone-200 bg-white shadow-sm">
            <Camera className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-stone-700 mb-1">No media found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {favoritesOnly
                ? 'You have not favorited any photos yet. Click the heart icon on any photo to save your favorites.'
                : 'There are currently no items matching your selected filter in this album.'}
            </p>
            {favoritesOnly && (
              <button
                onClick={() => setFavoritesOnly(false)}
                className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition"
              >
                Clear Favorites Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {displayMedia.map((item, index) => {
              const isVideo = item.mediaType === 'VIDEO';
              const isLockedVideo = isVideo && isVideoLocked;

              return (
                <div
                  key={item.id}
                  className={`group relative aspect-[4/5] rounded-xl overflow-hidden border shadow-sm cursor-pointer transition-all duration-300 ${
                    isLockedVideo
                      ? 'bg-stone-900 border-amber-500/40 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10'
                      : 'bg-stone-100 border-stone-200 hover:border-amber-400/80'
                  }`}
                  onClick={() => {
                    if (isLockedVideo) {
                      showToast('Please complete 80% of the payment to get the full access');
                      setPaymentTierTarget('80%');
                      setShowPaymentModal(true);
                      return;
                    }
                    setLightboxIndex(index);
                    setZoomLevel(1);
                  }}
                >
                  {/* Media Element */}
                  {isVideo ? (
                    isLockedVideo ? (
                      /* Locked Video Card Display */
                      <div className="w-full h-full bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950/60 flex flex-col items-center justify-center p-4 text-center select-none relative overflow-hidden">
                        {(item.thumbnailUrl || item.previewUrl) && (
                          <img
                            src={item.thumbnailUrl || item.previewUrl}
                            alt="Locked preview"
                            className="absolute inset-0 w-full h-full object-cover blur-md opacity-20"
                          />
                        )}

                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-2.5 text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/30 transition duration-300">
                            <Lock className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                            Video Locked
                          </span>
                          <span className="text-[11px] text-stone-300 mt-1 leading-tight font-medium max-w-[140px]">
                            Please complete 80% payment to unlock
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showToast('Please complete 80% of the payment to get the full access');
                              setPaymentTierTarget('80%');
                              setShowPaymentModal(true);
                            }}
                            className="mt-3 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold rounded-lg shadow-md transition"
                          >
                            Unlock (80%)
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Unlocked Video Player Element */
                      <div className="w-full h-full bg-stone-950 relative overflow-hidden flex items-center justify-center">
                        <video
                          src={`/api/media/${item.id}/stream`}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          disablePictureInPicture
                          controlsList="nodownload nofullscreen noremoteplayback"
                          onContextMenu={(e) => e.preventDefault()}
                          poster={item.thumbnailUrl || item.previewUrl}
                          onMouseEnter={(e) => { e.target.play().catch(() => {}); }}
                          onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                          className="w-full h-full object-cover pointer-events-none select-none drm-media"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-transparent pointer-events-none transition duration-300">
                          <div className="w-12 h-12 rounded-full bg-amber-600/95 text-white flex items-center justify-center shadow-xl group-hover:scale-115 group-hover:bg-amber-600 transition duration-300">
                            <Play className="w-6 h-6 ml-0.5 fill-current" />
                          </div>
                        </div>
                        {/* Transparent Guard Overlay */}
                        <div
                          className="absolute inset-0 z-10 select-none cursor-pointer"
                          onContextMenu={(e) => e.preventDefault()}
                          onDragStart={(e) => e.preventDefault()}
                        />
                      </div>
                    )
                  ) : (
                    /* Photo Element with Conditional Blur & "Image is Protected" (Only when unpaid/restricted) */
                    (() => {
                      // If the client has paid in full (isDownloadLocked === false), they CANNOT be restricted!
                      const isRestricted = isDownloadLocked;
                      const isRevealed = !isRestricted || (holdingCardId === item.id && !isModifierKeyPressed);

                      return (
                        <div
                          className={`relative w-full h-full overflow-hidden select-none bg-stone-900 ${
                            isRestricted ? 'cursor-pointer' : ''
                          }`}
                          onMouseDown={() => {
                            if (isRestricted) setHoldingCardId(item.id);
                          }}
                          onMouseUp={() => {
                            if (isRestricted) setHoldingCardId(null);
                          }}
                          onMouseLeave={() => {
                            if (isRestricted) setHoldingCardId(null);
                          }}
                          onTouchStart={() => {
                            if (isRestricted) setHoldingCardId(item.id);
                          }}
                          onTouchEnd={() => {
                            if (isRestricted) setHoldingCardId(null);
                          }}
                          onContextMenu={(e) => {
                            if (isRestricted) e.preventDefault();
                          }}
                          onDragStart={(e) => {
                            if (isRestricted) e.preventDefault();
                          }}
                        >
                          <img
                            src={item.thumbnailUrl || item.previewUrl || item.fileUrl || `/api/media/${item.id}/thumbnail`}
                            alt={item.fileName}
                            loading="lazy"
                            className={`w-full h-full object-cover transition-all duration-300 ${
                              isRestricted
                                ? 'pointer-events-none select-none drm-media'
                                : 'group-hover:scale-105 duration-500 ease-out'
                            } ${
                              isRevealed
                                ? 'filter-none scale-100 opacity-100'
                                : 'filter blur-2xl scale-125 opacity-70'
                            }`}
                            onError={(e) => {
                              if (item.fileUrl && e.target.src !== item.fileUrl) {
                                e.target.src = item.fileUrl;
                              }
                            }}
                          />

                          {/* Full Image Blur Protection Overlay - ONLY shown when restricted (unpaid) */}
                          {isRestricted && !isRevealed && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center bg-black/40 backdrop-blur-xs select-none pointer-events-none transition-opacity duration-200">
                              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-2.5 text-amber-400 shadow-xl group-hover:scale-110 transition duration-300">
                                <Lock className="w-6 h-6" />
                              </div>
                              <span className="text-xs font-bold text-white tracking-wider uppercase drop-shadow-md">
                                Image is Protected
                              </span>
                              <span className="text-[11px] text-amber-200/90 mt-1 font-medium drop-shadow-sm max-w-[150px] leading-tight">
                                Press & hold to view
                              </span>
                            </div>
                          )}

                          {/* Peeking Indicator when revealed in restricted mode */}
                          {isRestricted && isRevealed && (
                            <div className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 flex items-center gap-1 text-[10px] font-semibold pointer-events-none animate-in fade-in duration-150">
                              <Shield className="w-3 h-3 text-emerald-400" />
                              <span>Live Preview</span>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}

                  {/* Video Badge */}
                  {isVideo && (
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-md text-amber-300 border border-amber-500/30 flex items-center gap-1 text-[10px] font-semibold pointer-events-none">
                      {isLockedVideo ? <Lock className="w-3 h-3 text-amber-400" /> : <Video className="w-3 h-3 text-amber-400" />}
                      <span>{isLockedVideo ? 'Locked Video' : 'Video'}</span>
                    </div>
                  )}

                  {/* Favorite Heart Badge */}
                  {!isLockedVideo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        favoriteMutation.mutate(item.id);
                      }}
                      className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        item.isFavorite
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-100'
                          : 'bg-stone-900/50 backdrop-blur-md text-white/80 opacity-0 group-hover:opacity-100 hover:bg-stone-900/80 hover:text-rose-400'
                      }`}
                      title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-white' : ''}`} />
                    </button>
                  )}

                  {/* Bottom Overlay on Hover with Download Interceptor */}
                  <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-stone-950/90 via-stone-950/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between text-xs text-white">
                    <span className="truncate text-[11px] text-stone-200 max-w-[120px]">
                      {item.fileName}
                    </span>
                    {item.isCommercial ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/gallery/${token}/guest`);
                        }}
                        className="px-2.5 py-1 rounded bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                        title="Commercial candid photo - Buy in Guest Candid Store"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Buy ₹{item.pricePerPhoto || 49}</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(item.id, item.fileName);
                        }}
                        className={`p-1 rounded transition ${
                          isDownloadLocked
                            ? 'hover:bg-amber-500/20 text-amber-400'
                            : 'hover:bg-white/20 text-stone-200 hover:text-white'
                        }`}
                        title={isDownloadLocked ? 'Please complete 100% of the payment to download photos, videos, or albums' : 'Download Original'}
                      >
                        {isDownloadLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Download className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Studio Contact / Footer Section */}
      <footer className="max-w-7xl mx-auto px-4 lg:px-8 mt-20 pt-8 border-t border-stone-200 text-stone-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-white border border-stone-200 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
            <img src={gallery.studioLogoUrl || turtledotLogo} alt="Turtledot Studio" className="w-full h-full object-contain" />
          </div>
          <span className="text-stone-800 font-semibold">{gallery.studioName || 'Turtledot Studio'}</span>
          <span className="text-stone-400">•</span>
          <span>Delivered via High-Speed Turtledot Studio Storage</span>
        </div>

        <div className="flex items-center gap-6">
          {gallery.studioPhone && (
            <a href={`tel:${gallery.studioPhone}`} className="flex items-center gap-1.5 hover:text-amber-800 transition">
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              <span>{gallery.studioPhone}</span>
            </a>
          )}
          {gallery.studioEmail && (
            <a href={`mailto:${gallery.studioEmail}`} className="flex items-center gap-1.5 hover:text-amber-800 transition">
              <Mail className="w-3.5 h-3.5 text-amber-600" />
              <span>{gallery.studioEmail}</span>
            </a>
          )}
        </div>
      </footer>

      {/* FULLSCREEN LIGHTBOX VIEWER */}
      {lightboxIndex !== null && currentItem && (
        <div className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-xl flex flex-col select-none">
          {/* Lightbox Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 z-10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                {lightboxIndex + 1} / {displayMedia.length}
              </span>
              <span className="text-xs text-stone-400 hidden sm:inline-block truncate max-w-xs">
                {currentItem.fileName}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Slideshow button */}
              <button
                onClick={() => setIsPlayingSlideshow(!isPlayingSlideshow)}
                className={`p-2 rounded-lg text-xs font-medium border transition ${
                  isPlayingSlideshow
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-white/5 border-white/10 text-stone-300 hover:text-white hover:bg-white/10'
                }`}
                title={isPlayingSlideshow ? 'Pause Slideshow' : 'Play Slideshow'}
              >
                <Play className="w-4 h-4" />
              </button>

              {/* Zoom In/Out (for images) */}
              {currentItem.mediaType === 'IMAGE' && (
                <>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(z + 0.3, 3))}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 transition"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(z - 0.3, 1))}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 transition"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Favorite Button */}
              {!(currentItem.mediaType === 'VIDEO' && isVideoLocked) && (
                <button
                  onClick={() => favoriteMutation.mutate(currentItem.id)}
                  className={`p-2 rounded-lg border transition ${
                    currentItem.isFavorite
                      ? 'bg-rose-500 text-white border-rose-400'
                      : 'bg-white/5 border-white/10 text-stone-300 hover:text-rose-400 hover:bg-white/10'
                  }`}
                  title={currentItem.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                >
                  <Heart className={`w-4 h-4 ${currentItem.isFavorite ? 'fill-white' : ''}`} />
                </button>
              )}

              {/* Download Button with 100% Interceptor or Buy in Guest Store */}
              {currentItem.isCommercial ? (
                <button
                  onClick={() => navigate(`/gallery/${token}/guest`)}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  title="Purchase unwatermarked HD photo in Guest Store"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Buy High-Res (₹{currentItem.pricePerPhoto || 49})</span>
                </button>
              ) : (
                <button
                  onClick={() => handleDownload(currentItem.id, currentItem.fileName)}
                  className={`p-2 rounded-lg border transition ${
                    isDownloadLocked
                      ? 'bg-amber-600/20 border-amber-500/40 text-amber-300 hover:bg-amber-600 hover:text-white'
                      : 'bg-white/5 border-white/10 text-stone-300 hover:text-white hover:bg-white/10'
                  }`}
                  title={isDownloadLocked ? 'Please complete 100% of the payment to download photos, videos, or albums' : 'Download Original Asset'}
                >
                  {isDownloadLocked ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={() => {
                  setLightboxIndex(null);
                  setIsPlayingSlideshow(false);
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-rose-600/80 text-white border border-white/20 transition ml-2"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Media Presentation Stage */}
          <div className="flex-1 relative flex items-center justify-center p-4 sm:p-8 overflow-hidden">
            {/* Prev Button */}
            {displayMedia.length > 1 && (
              <button
                onClick={() => {
                  setLightboxIndex((prev) => (prev - 1 + displayMedia.length) % displayMedia.length);
                  setZoomLevel(1);
                }}
                className="absolute left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition hover:scale-110"
                title="Previous Photo (Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next Button */}
            {displayMedia.length > 1 && (
              <button
                onClick={() => {
                  setLightboxIndex((prev) => (prev + 1) % displayMedia.length);
                  setZoomLevel(1);
                }}
                className="absolute right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition hover:scale-110"
                title="Next Photo (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Display Media Item */}
            <div className="max-w-full max-h-full flex items-center justify-center transition-transform duration-200">
              {currentItem.mediaType === 'VIDEO' ? (
                isVideoLocked ? (
                  /* Locked Lightbox Card for Video View (Below 80%) */
                  <div className="max-w-md w-full bg-stone-900/95 border border-amber-500/40 rounded-3xl p-6 sm:p-8 text-center backdrop-blur-2xl shadow-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-4 text-amber-400">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-stone-100 mb-2">
                      Video Access Locked
                    </h3>
                    <p className="text-sm font-semibold text-amber-300 mb-3">
                      Please complete 80% of the payment to get the full access
                    </p>
                    <p className="text-xs text-stone-400 mb-6 leading-relaxed">
                      You currently have unlocked image gallery access. Reaching the 80% milestone unlocks all 4K video playback and streaming online.
                    </p>

                    <div className="bg-black/50 rounded-2xl p-4 border border-white/10 mb-6 text-left text-xs space-y-2.5">
                      <div className="flex justify-between text-stone-400">
                        <span>Total Event Billing:</span>
                        <span className="font-semibold text-stone-200">{formatCurrency(gallery.totalAmount, gallery.currency)}</span>
                      </div>
                      <div className="flex justify-between text-stone-400">
                        <span>Already Paid ({paidPct}%):</span>
                        <span className="font-semibold text-stone-200">{formatCurrency(gallery.amountPaid, gallery.currency)}</span>
                      </div>
                      <div className="flex justify-between text-amber-400 font-bold border-t border-white/10 pt-2 text-sm">
                        <span>Needed for 80% Video Access:</span>
                        <span>{formatCurrency(gallery.amountNeededForVideoAccess || 0, gallery.currency)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setPaymentTierTarget('80%');
                        setShowPaymentModal(true);
                      }}
                      className="w-full py-3 neu-glass-btn-primary font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Unlock Full Video Access Now
                    </button>
                  </div>
                ) : (
                  <div className="relative max-h-[80vh] max-w-[90vw] overflow-hidden rounded-xl shadow-2xl border border-white/10 bg-black">
                    <video
                      key={currentItem.id}
                      controls
                      autoPlay
                      playsInline
                      preload="auto"
                      disablePictureInPicture
                      controlsList="nodownload nofullscreen noremoteplayback"
                      onContextMenu={(e) => e.preventDefault()}
                      className="max-h-[80vh] max-w-[90vw] rounded-xl bg-black select-none drm-media"
                    >
                      <source src={`/api/media/${currentItem.id}/stream`} type={currentItem.mimeType || "video/mp4"} />
                      <source src={`/api/media/${currentItem.id}`} type={currentItem.mimeType || "video/mp4"} />
                      Your browser does not support HTML5 video streaming.
                    </video>
                  </div>
                )
              ) : (
                (() => {
                  // If the client has paid in full (isDownloadLocked === false), they CANNOT be restricted!
                  const isLbRestricted = isDownloadLocked;
                  const isLbRevealed = !isLbRestricted || (isHoldingLightbox && !isModifierKeyPressed);

                  return (
                    <div
                      className={`relative inline-block max-h-[82vh] max-w-[90vw] overflow-hidden rounded-xl shadow-2xl select-none group/lb bg-stone-950 ${
                        isLbRestricted ? 'cursor-pointer' : 'cursor-zoom-in'
                      }`}
                      onMouseDown={() => {
                        if (isLbRestricted) setIsHoldingLightbox(true);
                      }}
                      onMouseUp={() => {
                        if (isLbRestricted) setIsHoldingLightbox(false);
                      }}
                      onMouseLeave={() => {
                        if (isLbRestricted) setIsHoldingLightbox(false);
                      }}
                      onTouchStart={() => {
                        if (isLbRestricted) setIsHoldingLightbox(true);
                      }}
                      onTouchEnd={() => {
                        if (isLbRestricted) setIsHoldingLightbox(false);
                      }}
                      onClick={() => {
                        if (!isLbRestricted) {
                          setZoomLevel((z) => (z > 1 ? 1 : 2));
                        }
                      }}
                      onContextMenu={(e) => {
                        if (isLbRestricted) e.preventDefault();
                      }}
                      onDragStart={(e) => {
                        if (isLbRestricted) e.preventDefault();
                      }}
                    >
                      <img
                        src={currentItem.previewUrl || currentItem.fileUrl || `/api/media/${currentItem.id}/preview`}
                        alt={currentItem.fileName}
                        style={{ transform: `scale(${zoomLevel})` }}
                        className={`max-h-[82vh] max-w-[90vw] object-contain rounded-xl transition-all duration-200 select-none ${
                          isLbRestricted ? 'pointer-events-none drm-media' : ''
                        } ${
                          isLbRevealed
                            ? 'filter-none scale-100 opacity-100'
                            : 'filter blur-3xl scale-110 opacity-70'
                        }`}
                        onError={(e) => {
                          if (currentItem.fileUrl && e.target.src !== currentItem.fileUrl) {
                            e.target.src = currentItem.fileUrl;
                          }
                        }}
                      />

                      {/* Full Blur Lightbox Protection Overlay - ONLY shown when restricted (unpaid) */}
                      {isLbRestricted && !isLbRevealed && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/45 backdrop-blur-xs select-none pointer-events-none transition-opacity duration-200">
                          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3 text-amber-400 shadow-2xl">
                            <Lock className="w-8 h-8" />
                          </div>
                          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mb-1.5 drop-shadow-md">
                            Image is Protected
                          </h3>
                          <p className="text-xs sm:text-sm text-amber-200 font-medium mb-4 drop-shadow-sm max-w-xs">
                            Press and hold mouse to preview • Screenshots are restricted
                          </p>
                          <div className="px-3.5 py-1 rounded-full bg-stone-900/80 border border-white/20 text-[11px] text-stone-300 flex items-center gap-1.5 shadow-sm">
                            <Shield className="w-3.5 h-3.5 text-amber-400" />
                            <span>Turtledot Studio DRM Protection</span>
                          </div>
                        </div>
                      )}

                      {/* Peeking Indicator when revealed in Lightbox */}
                      {isLbRestricted && isLbRevealed && (
                        <div className="absolute top-4 left-4 z-20 px-2.5 py-1 rounded-md bg-stone-900/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 text-xs font-semibold pointer-events-none animate-in fade-in duration-150">
                          <Shield className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Viewing Protected Preview</span>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>

          {/* Lightbox Footer Bar */}
          <div className="px-6 py-2.5 bg-stone-950/80 border-t border-white/10 flex items-center justify-between text-xs text-stone-400">
            <div className="flex items-center gap-4">
              <span>{currentItem.albumName || 'Album'}</span>
              {currentItem.width && currentItem.height && (
                <span>• {currentItem.width} × {currentItem.height} px</span>
              )}
              {currentItem.fileSize && (
                <span>• {(currentItem.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
              )}
            </div>
            <div className="hidden sm:block text-stone-500">
              Use arrow keys ← → to navigate • ESC to exit
            </div>
          </div>
        </div>
      )}

      {/* AUTOMATED PAYMENT & ACCESS UNLOCK MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-lg">
                    Studio Delivery Checkout
                  </h3>
                  <p className="text-xs text-stone-500">
                    {gallery.eventName} • {gallery.clientName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentSuccessMessage(null);
                  setPaymentError(null);
                }}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Message Banner */}
            {paymentSuccessMessage ? (
              <div className="py-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-stone-900 mb-2">Payment Confirmed & Access Unlocked!</h4>
                <p className="text-sm text-stone-600 max-w-sm mx-auto mb-5 leading-relaxed">
                  {paymentSuccessMessage}
                </p>

                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 mb-6 max-w-sm mx-auto text-left flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-xs font-bold text-stone-900">Official GST Tax Invoice</h5>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Your GST-compliant tax invoice & payment receipt is ready with full SAC breakdown.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(null, 'Latest')}
                      disabled={downloadingInvoiceId !== null}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-500 shadow-xs transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{downloadingInvoiceId === 'latest' ? 'Generating PDF...' : 'Download GST Invoice (PDF)'}</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentSuccessMessage(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition shadow-sm"
                >
                  Continue to Gallery
                </button>
              </div>
            ) : (
              <form onSubmit={handleExecutePayment}>
                {/* Financial Summary */}
                <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 mb-5 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center divide-x divide-stone-200">
                    <div>
                      <span className="text-stone-400 block mb-0.5">Total Event</span>
                      <span className="font-bold text-stone-800 text-sm">
                        {formatCurrency(gallery.totalAmount, gallery.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block mb-0.5">Paid ({paidPct}%)</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {formatCurrency(gallery.amountPaid, gallery.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block mb-0.5">Balance</span>
                      <span className="font-bold text-amber-700 text-sm">
                        {formatCurrency(gallery.balanceAmount, gallery.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tier Selection Radio Cards */}
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
                  Select Payment Milestone
                </label>

                <div className="space-y-3 mb-5">
                  {/* 100% Full Download Access & Settlement Option */}
                  <div
                    onClick={() => setPaymentTierTarget('100%')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
                      paymentTierTarget === '100%'
                        ? 'border-amber-600 bg-amber-50/50'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      paymentTierTarget === '100%' ? 'border-amber-600' : 'border-stone-300'
                    }`}>
                      {paymentTierTarget === '100%' && <div className="w-2 h-2 rounded-full bg-amber-600"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                          100% Full Access & Downloads
                          <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded">
                            Required For Downloads
                          </span>
                        </span>
                        <span className="font-bold text-amber-700 text-sm">
                          {formatCurrency(gallery.amountNeededForDownload || gallery.balanceAmount || 0, gallery.currency)}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                        Completes 100% payment required to <strong>download original photos, 4K videos, and the full album ZIP</strong>, and clears all remaining balance.
                      </p>
                    </div>
                  </div>

                  {/* 80% Full Video Viewing Access Option (Only if video is locked) */}
                  {isVideoLocked && (
                    <div
                      onClick={() => setPaymentTierTarget('80%')}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
                        paymentTierTarget === '80%'
                          ? 'border-amber-600 bg-amber-50/50'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        paymentTierTarget === '80%' ? 'border-amber-600' : 'border-stone-300'
                      }`}>
                        {paymentTierTarget === '80%' && <div className="w-2 h-2 rounded-full bg-amber-600"></div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-stone-900">
                            80% Video Streaming Milestone
                          </span>
                          <span className="font-bold text-stone-900 text-sm">
                            {formatCurrency(gallery.amountNeededForVideoAccess || 0, gallery.currency)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                          Reaches 80% payment to unlock online video watching & streaming (file downloads remain locked until 100%).
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div className="mb-5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                    Payment Gateway
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['UPI', 'CARD', 'BANK_TRANSFER'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setSelectedPaymentMethod(method)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          selectedPaymentMethod === method
                            ? 'border-amber-600 bg-amber-600 text-white shadow-sm'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        {method === 'UPI' && 'UPI / QR'}
                        {method === 'CARD' && 'Card'}
                        {method === 'BANK_TRANSFER' && 'Net Banking'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Banner */}
                {paymentError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={payMutation.isPending}
                  className="w-full py-3.5 neu-glass-btn-primary disabled:opacity-50 font-bold rounded-2xl text-sm transition flex items-center justify-center gap-2"
                >
                  {payMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Authorizing Payment...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        Pay{' '}
                        {formatCurrency(
                          paymentTierTarget === '80%'
                            ? (gallery.amountNeededForVideoAccess || 0)
                            : (gallery.amountNeededForDownload || gallery.balanceAmount || 0),
                          gallery.currency
                        )}{' '}
                        & Unlock
                      </span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      </div>
    </ContentProtectionProvider>
  );
}

