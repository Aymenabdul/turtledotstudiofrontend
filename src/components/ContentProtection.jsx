import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Shield, ShieldAlert, Lock, AlertTriangle, EyeOff, CheckCircle2 } from 'lucide-react';

const ContentProtectionContext = createContext({
  isProtected: true,
  triggerWarning: () => {},
});

export const useContentProtection = () => useContext(ContentProtectionContext);

/**
 * Status Badge for DRM Protection
 */
export const SecurityBadge = ({ className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold tracking-wide backdrop-blur-md hover:bg-emerald-900/50 transition cursor-help select-none"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Shield className="w-3.5 h-3.5 text-emerald-400" />
        <span>DRM Protected</span>
      </button>

      {showTooltip && (
        <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-50 w-72 p-3 bg-stone-900/95 border border-amber-500/30 rounded-xl shadow-2xl backdrop-blur-xl text-left text-xs text-stone-300 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-bold">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Anti-Capture Protection Active</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed">
            Screenshots, screen recording, printing, and unauthorized media extraction are restricted on this gallery to protect copyright.
          </p>
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1.5 text-[10px] text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Encrypted Delivery & Image Protection Shield</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main ContentProtectionProvider Component
 * Comprehensive Anti-Screenshot, Anti-Screen Recording, and Content Protection Wrapper
 */
export default function ContentProtectionProvider({
  children,
  enabled = true,
  blurOnFocusLoss = true,
  blockShortcuts = true,
  blockContextMenu = true,
  blockDisplayMedia = true,
  clientName = '',
  eventName = '',
  studioName = 'Turtledot Studio',
}) {
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [securityToast, setSecurityToast] = useState(null);
  const [isFlashActive, setIsFlashActive] = useState(false);

  const showSecurityWarning = useCallback((message, duration = 3500) => {
    setSecurityToast(message);
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 800);
    setTimeout(() => {
      setSecurityToast((prev) => (prev === message ? null : prev));
    }, duration);
  }, []);

  // 1. Focus Loss & Visibility Change Detection (The Anti-Snipping Tool / Focus Steal Defense)
  useEffect(() => {
    if (!enabled || !blurOnFocusLoss) return;

    const handleBlur = () => {
      setIsWindowBlurred(true);
      // Pause any playing videos so screen recorders cannot capture them in the background
      document.querySelectorAll('video').forEach((v) => {
        try {
          if (!v.paused) v.pause();
        } catch (e) {
          // ignore error
        }
      });
    };

    const handleFocus = () => {
      setIsWindowBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowBlurred(true);
        document.querySelectorAll('video').forEach((v) => {
          try {
            if (!v.paused) v.pause();
          } catch (e) {
            // ignore error
          }
        });
      } else {
        setIsWindowBlurred(false);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, blurOnFocusLoss]);

  // 2. Keyboard Capture Interception & Clipboard Sanitization
  useEffect(() => {
    if (!enabled || !blockShortcuts) return;

    const handleKeyDown = (e) => {
      const key = e.key ? e.key.toLowerCase() : '';
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // PrintScreen Key (Windows standard)
      if (e.key === 'PrintScreen' || key === 'printscreen') {
        e.preventDefault();
        e.stopPropagation();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('').catch(() => {});
        }
        showSecurityWarning('⚠️ Screenshot Restricted: Screenshots are disabled on this gallery to protect copyrighted media.');
        setIsWindowBlurred(true);
        setTimeout(() => setIsWindowBlurred(false), 2000);
        return false;
      }

      // macOS Screenshot combinations (Cmd + Shift + 3 / 4 / 5)
      if (cmdOrCtrl && e.shiftKey && ['3', '4', '5'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityWarning('⚠️ Screen Capture Restricted: Media capture is blocked on this platform.');
        setIsWindowBlurred(true);
        setTimeout(() => setIsWindowBlurred(false), 2500);
        return false;
      }

      // Windows Snipping shortcut (Win + Shift + S or Ctrl + Shift + S)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 's') {
        e.preventDefault();
        e.stopPropagation();
        showSecurityWarning('⚠️ Snipping Tool Restricted: Media capture is blocked.');
        setIsWindowBlurred(true);
        setTimeout(() => setIsWindowBlurred(false), 2500);
        return false;
      }

      // Print shortcut (Ctrl + P / Cmd + P)
      if (cmdOrCtrl && key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        showSecurityWarning('⚠️ Printing Restricted: Gallery assets cannot be printed or saved to PDF.');
        return false;
      }

      // Save page shortcut (Ctrl + S / Cmd + S)
      if (cmdOrCtrl && key === 's') {
        e.preventDefault();
        e.stopPropagation();
        showSecurityWarning('⚠️ Page Save Restricted: Direct saving of gallery media is restricted.');
        return false;
      }

      // DevTools Inspection shortcuts (F12, Ctrl+Shift+I/J/C, Cmd+Option+I/J/C)
      if (
        key === 'f12' ||
        (cmdOrCtrl && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (e.altKey && e.metaKey && ['i', 'j', 'c'].includes(key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        showSecurityWarning('⚠️ Developer Tools Restricted: Source inspection is restricted on protected galleries.');
        return false;
      }

      // View Source (Ctrl + U / Cmd + Option + U)
      if (cmdOrCtrl && key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        showSecurityWarning('⚠️ View Source Restricted: Page source viewing is disabled for protected assets.');
        return false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, blockShortcuts, showSecurityWarning]);

  // 3. Right-Click Context Menu, Drag & Drop, and Copy Interception
  useEffect(() => {
    if (!enabled || !blockContextMenu) return;

    const handleContextMenu = (e) => {
      // Check if clicked element or parent is media or protected
      const target = e.target;
      const isMedia =
        target.tagName === 'IMG' ||
        target.tagName === 'VIDEO' ||
        target.closest('.group') ||
        target.closest('.lightbox-stage') ||
        target.closest('.drm-protected');

      if (isMedia || true) {
        e.preventDefault();
        showSecurityWarning('🔒 Right-click menu disabled to protect studio photography & client media.');
        return false;
      }
    };

    const handleDragStart = (e) => {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO' || e.target.closest('img')) {
        e.preventDefault();
        return false;
      }
    };

    const handleCopy = (e) => {
      const selection = window.getSelection()?.toString();
      if (selection) {
        // Allow copying plain text if needed, but not images
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('copy', handleCopy);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('copy', handleCopy);
    };
  }, [enabled, blockContextMenu, showSecurityWarning]);

  // 4. Screen Recording & Screen Sharing Interception (getDisplayMedia API Guard)
  useEffect(() => {
    if (!enabled || !blockDisplayMedia) return;

    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getDisplayMedia
    ) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);

      navigator.mediaDevices.getDisplayMedia = async function (...args) {
        showSecurityWarning('🚨 Screen Recording Blocked: Active display capture detected and halted.');
        setIsWindowBlurred(true);
        setTimeout(() => setIsWindowBlurred(false), 3000);
        throw new DOMException('Screen recording is restricted for protected gallery content.', 'NotAllowedError');
      };

      return () => {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      };
    }
  }, [enabled, blockDisplayMedia, showSecurityWarning]);

  return (
    <ContentProtectionContext.Provider value={{ isProtected: enabled, triggerWarning: showSecurityWarning }}>
      <div className={`relative ${enabled ? 'drm-protected select-none' : ''}`}>
        {children}

        {/* Security Warning Toast Notification */}
        {securityToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100000] px-5 py-3 rounded-2xl bg-stone-900/95 text-stone-100 border border-amber-500/40 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 max-w-md pointer-events-auto">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium leading-snug">{securityToast}</p>
          </div>
        )}

        {/* Temporary Red/Amber Screen Flash on Capture Attempt */}
        {isFlashActive && (
          <div className="fixed inset-0 z-[99998] pointer-events-none bg-amber-600/10 border-8 border-amber-500/40 transition-opacity duration-300" />
        )}

        {/* Impenetrable Focus-Loss / Anti-Snipping Tool Privacy Curtain */}
        {enabled && blurOnFocusLoss && isWindowBlurred && (
          <div
            onClick={() => setIsWindowBlurred(false)}
            className="fixed inset-0 z-[99999] bg-stone-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer animate-in fade-in duration-150"
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-2xl shadow-amber-500/20">
                <Shield className="w-10 h-10" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-stone-900 border-2 border-stone-950 flex items-center justify-center text-amber-400 shadow-md">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              DRM Content Protection
            </span>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 max-w-md">
              Screen Capture Restricted
            </h2>

            <p className="text-sm text-stone-400 mt-2 max-w-md leading-relaxed">
              This gallery is protected by Turtledot Studio copyright protocols. Screen capture utilities, snipping tools, and background recorders are restricted.
            </p>

            <div className="mt-8 px-5 py-2.5 rounded-xl bg-amber-600/30 border border-amber-500/50 text-amber-200 text-xs font-semibold hover:bg-amber-600/40 transition">
              Click anywhere inside this window to resume viewing
            </div>
          </div>
        )}
      </div>
    </ContentProtectionContext.Provider>
  );
}
