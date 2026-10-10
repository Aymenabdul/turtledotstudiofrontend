import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';

export const CustomSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  searchable,
  className = '',
  menuClassName = '',
  align = 'left', // 'left' | 'right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, right: 0, width: 0, showAbove: false });

  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options to uniform { value, label, badge, subtext } format
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value,
        label: opt.label ?? opt.name ?? String(opt.value),
        badge: opt.badge,
        badgeColor: opt.badgeColor,
        subtext: opt.subtext,
        icon: opt.icon,
        disabled: opt.disabled,
      };
    }
    return {
      value: opt,
      label: String(opt),
    };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  // Determine if search should be enabled (auto enabled if > 7 options)
  const isSearchable = searchable !== undefined ? searchable : normalizedOptions.length > 7;

  // Filter options based on search
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const labelMatch = opt.label.toLowerCase().includes(q);
    const subMatch = opt.subtext ? opt.subtext.toLowerCase().includes(q) : false;
    return labelMatch || subMatch;
  });

  // Calculate coordinates relative to viewport for the portal
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < 240 && rect.top > 240;

    setCoords({
      top: showAbove ? rect.top - 6 : rect.bottom + 6,
      left: rect.left,
      right: rect.right,
      width: rect.width,
      showAbove,
    });
  }, []);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (e) => {
      const inContainer = containerRef.current && containerRef.current.contains(e.target);
      const inMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!inContainer && !inMenu) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Track position on open, scroll, resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  // Focus search input when menu opens
  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, isSearchable]);

  // Escape key handler
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (val) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`relative inline-block text-left ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between text-left transition select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <span className="truncate flex items-center space-x-1.5 min-w-0 pr-1">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>}
              <span className="truncate font-medium">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ml-1.5 ${
                  selectedOption.badgeColor || 'bg-stone-100 text-stone-700'
                }`}>
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <span className="text-stone-400 font-normal">{placeholder}</span>
          )}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 shrink-0 ml-1.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-amber-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Portaled to document.body to bypass all stacking contexts & overflow */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: coords.showAbove ? 'auto' : `${coords.top}px`,
              bottom: coords.showAbove ? `${window.innerHeight - coords.top}px` : 'auto',
              ...(align === 'right'
                ? { right: `${Math.max(12, window.innerWidth - coords.right)}px` }
                : { left: `${Math.max(12, coords.left)}px` }
              ),
              minWidth: `${Math.max(coords.width, 180)}px`,
              maxWidth: '380px',
              zIndex: 99999,
            }}
            className={`bg-white/98 backdrop-blur-xl border border-stone-200/95 rounded-2xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-150 ${menuClassName}`}
          >
            {/* Optional Search */}
            {isSearchable && (
              <div className="px-2.5 py-1.5 border-b border-stone-100 mb-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Filter options..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-600 focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto px-1 space-y-0.5 scrollbar-thin">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-3 text-center text-xs text-stone-400">
                  No matching options
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition text-left ${
                        isSelected
                          ? 'bg-amber-50/90 text-amber-900 font-semibold border border-amber-200/60'
                          : opt.disabled
                          ? 'opacity-40 cursor-not-allowed text-stone-400'
                          : 'text-stone-700 hover:bg-stone-100/90 hover:text-stone-900'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center space-x-1.5 truncate">
                          {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                          <span className="truncate">{opt.label}</span>
                          {opt.badge && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                                opt.badgeColor || 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.subtext && (
                          <span className="text-[10px] text-stone-400 truncate mt-0.5">
                            {opt.subtext}
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CustomSelect;
