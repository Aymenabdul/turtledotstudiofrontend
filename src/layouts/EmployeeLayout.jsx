import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UploadCloud, 
  Activity, 
  LogOut, 
  Camera, 
  Menu, 
  X,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import turtledotLogo from '../img/turtledot_app_icon_color.png';

const employeeNavItems = [
  { name: 'My Dashboard', path: '/employee', icon: LayoutDashboard, end: true },
  { name: 'Assigned Clients', path: '/employee/clients', icon: Users },
  { name: 'Bulk Upload Media', path: '/employee/upload', icon: UploadCloud },
  { name: 'My Upload Activity', path: '/employee/activity', icon: Activity },
];

export const EmployeeLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500 shadow-[0_0_6px_#0ea5e9]"></span>
              </span>
              <span className="text-[11px] text-stone-500 uppercase tracking-wider font-bold">
                Staff Workspace
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto min-h-0 scrollbar-none">
          {employeeNavItems.map((item) => {
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

        {/* User Card */}
        <div className="p-4 border-t border-white/70 bg-white/40 backdrop-blur-md shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full neu-glass-btn text-amber-900 font-bold flex items-center justify-center text-xs shrink-0">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'E'}
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

      {/* Main Viewport - ONLY the main content scrolls */}
      <div className="flex-1 flex flex-col h-screen max-h-screen min-w-0 overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
