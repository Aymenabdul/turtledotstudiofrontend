import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Image as ImageIcon, 
  UserCheck, 
  CreditCard, 
  QrCode, 
  HardDrive, 
  History, 
  Settings, 
  LogOut, 
  Search, 
  Camera, 
  Menu, 
  X,
  Bell,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import turtledotLogo from '../img/turtledot_app_icon_color.png';
import { getCurrencySymbol } from '../utils/currency';

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
  { name: 'Clients', path: '/admin/clients', icon: Users },
  { name: 'Events', path: '/admin/events', icon: Calendar },
  { name: 'Albums & Media', path: '/admin/albums', icon: ImageIcon },
  { name: 'Employees', path: '/admin/employees', icon: UserCheck },
  { name: 'Payments', path: '/admin/payments', icon: CreditCard },
  { name: 'QR Codes', path: '/admin/qr', icon: QrCode },
  { name: 'Storage & Sync', path: '/admin/storage', icon: HardDrive },
  { name: 'Audit Logs', path: '/admin/audit', icon: History },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export const AdminLayout = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  // Live global search
  const { data: searchResults } = useQuery({
    queryKey: ['globalSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim().length < 2) return null;
      const res = await api.get(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      return res.data.data;
    },
    enabled: searchQuery.trim().length >= 2,
  });

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(false);
      navigate(`/admin/clients?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const hasResults =
    searchResults &&
    ((searchResults.clients && searchResults.clients.length > 0) ||
      (searchResults.events && searchResults.events.length > 0) ||
      (searchResults.albums && searchResults.albums.length > 0));

  return (
    <div className="h-screen max-h-screen bg-[#eef2f7] text-slate-800 flex flex-col md:flex-row font-sans selection:bg-amber-500/20 selection:text-amber-900 relative overflow-hidden">
      {/* Universal Ambient Diffuse Glowing Orbs */}
      <div className="fixed -top-24 -left-12 w-[45rem] h-[45rem] bg-amber-200/25 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="fixed bottom-0 right-10 w-[38rem] h-[38rem] bg-sky-200/20 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="fixed top-1/3 left-1/4 w-[32rem] h-[32rem] bg-indigo-200/15 rounded-full blur-3xl pointer-events-none -z-0"></div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white/75 backdrop-blur-xl border-b border-white/80 shadow-xs relative z-30 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl neu-glass-btn p-1 flex items-center justify-center overflow-hidden">
            <img src={user?.studioLogoUrl || turtledotLogo} alt="Turtledot Studio" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-stone-900 text-sm">{user?.studioName || 'Turtledot Studio'}</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl neu-glass-btn text-stone-700 hover:text-stone-900"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation - 100% Static & Pinned */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 h-screen max-h-screen bg-white/70 backdrop-blur-2xl border-r border-white/80 transform transition-transform duration-200 ease-in-out md:sticky md:top-0 md:translate-x-0 flex flex-col shrink-0 shadow-[4px_0_20px_rgba(166,178,197,0.18)] select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Studio Branding */}
        <div className="p-5 border-b border-white/80 flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl neu-glass-btn p-1.5 flex items-center justify-center border border-white/90 overflow-hidden shrink-0">
            <img src={user?.studioLogoUrl || turtledotLogo} alt="Turtledot Studio" className="w-full h-full object-contain" />
          </div>
          <div className="overflow-hidden">
            <h2 className="font-bold text-sm tracking-tight text-stone-900 truncate">
              {user?.studioName || 'Turtledot Studio'}
            </h2>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
              </span>
              <span className="text-[11px] text-stone-500 uppercase tracking-wider font-bold">
                Admin Portal
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto min-h-0 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'neu-glass-btn text-amber-900 font-bold border border-white/90 shadow-[4px_4px_12px_rgba(166,178,197,0.32),-4px_-4px_12px_rgba(255,255,255,0.95)]'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/60 hover:shadow-xs'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-current" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-white/70 bg-white/40 backdrop-blur-md shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full neu-glass-btn text-amber-900 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-stone-900 truncate">{user?.fullName}</p>
                <p className="text-[10px] text-stone-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 neu-glass-btn text-stone-400 hover:text-rose-600 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen max-h-screen min-w-0 overflow-hidden relative z-10">
        {/* Top Header - Fixed & Static with Crisp Neu-Glass Elevation */}
        <header className="hidden md:flex shrink-0 items-center justify-between px-8 py-3.5 bg-white/80 backdrop-blur-2xl border-b border-stone-200/80 shadow-[0_4px_20px_rgba(166,178,197,0.15)] relative z-30">
          <div ref={searchRef} className="relative w-96">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search clients, events, albums..."
                value={searchQuery}
                onFocus={() => setShowSearchResults(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                className="w-full pl-10 pr-14 py-2 rounded-2xl bg-stone-100/75 border border-stone-200/80 text-xs font-semibold text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 shadow-[inset_1px_1px_3px_rgba(166,178,197,0.22),inset_-1px_-1px_3px_rgba(255,255,255,0.95)] transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-stone-400 bg-white/90 border border-stone-200/80 rounded shadow-xs">⌘K</kbd>
              </div>
            </form>

            {/* Live Search Auto-complete Popup */}
            {showSearchResults && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 top-full mt-2 w-96 neu-glass-panel rounded-3xl shadow-2xl overflow-hidden text-xs z-50 animate-in fade-in zoom-in-95 duration-150 border border-white/80">
                {!hasResults ? (
                  <div className="p-4 text-center text-stone-400 font-medium">
                    No matching clients, events, or albums found for "{searchQuery}".
                  </div>
                ) : (
                  <div className="p-2 space-y-3 max-h-96 overflow-y-auto">
                    {/* Clients Section */}
                    {searchResults.clients && searchResults.clients.length > 0 && (
                      <div>
                        <p className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                          Clients
                        </p>
                        {searchResults.clients.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setShowSearchResults(false);
                              navigate(`/admin/clients/${c.id}`);
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/80 transition flex items-center justify-between group cursor-pointer"
                          >
                            <div>
                              <p className="font-bold text-stone-900 group-hover:text-amber-800">{c.name}</p>
                              <p className="text-[10px] text-stone-500">{c.clientCode} • {c.email || c.phone}</p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Events Section */}
                    {searchResults.events && searchResults.events.length > 0 && (
                      <div>
                        <p className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                          Events
                        </p>
                        {searchResults.events.map((ev) => (
                          <button
                            key={ev.id}
                            onClick={() => {
                              setShowSearchResults(false);
                              navigate('/admin/events');
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/80 transition flex items-center justify-between group cursor-pointer"
                          >
                            <div>
                              <p className="font-bold text-stone-900 group-hover:text-amber-800">{ev.name}</p>
                              <p className="text-[10px] text-stone-500">{ev.eventCode} • {ev.clientName}</p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Albums Section */}
                    {searchResults.albums && searchResults.albums.length > 0 && (
                      <div>
                        <p className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-700">
                          Albums
                        </p>
                        {searchResults.albums.map((al) => (
                          <button
                            key={al.id}
                            onClick={() => {
                              setShowSearchResults(false);
                              navigate('/admin/albums');
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-white/80 transition flex items-center justify-between group cursor-pointer"
                          >
                            <div>
                              <p className="font-bold text-stone-900 group-hover:text-amber-800">{al.name}</p>
                              <p className="text-[10px] text-stone-500">{al.eventName} ({al.clientName})</p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3.5">
            {/* Live Studio Status & Currency Capsule */}
            <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-2xl bg-white/95 border border-stone-200/90 shadow-[3px_3px_10px_rgba(166,178,197,0.25),-3px_-3px_10px_rgba(255,255,255,0.95)] text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-stone-700">Studio Active</span>
              <span className="text-stone-300">•</span>
              <span className="text-[11px] font-mono font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70">
                {user?.studioCurrency || 'INR'} ({getCurrencySymbol(user?.studioCurrency)})
              </span>
            </div>

            <div className="h-4 w-px bg-stone-300/60"></div>

            {/* Tactile Notification Bell */}
            <button 
              className="p-2.5 rounded-2xl bg-white/95 hover:bg-white text-stone-600 hover:text-amber-800 border border-stone-200/90 shadow-[3px_3px_10px_rgba(166,178,197,0.25),-3px_-3px_10px_rgba(255,255,255,0.95)] transition active:scale-95 relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4 stroke-[2.2]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_#d97706] ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* Page Viewport - ONLY the main content scrolls */}
        <main className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
