import React from 'react';
import { Outlet } from 'react-router-dom';

export const ClientLayout = () => {
  return (
    <div className="min-h-screen bg-[#eef2f7] text-slate-800 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-900 relative overflow-hidden">
      {/* Universal Ambient Diffuse Glowing Orbs */}
      <div className="fixed top-0 left-1/4 w-[38rem] h-[38rem] bg-amber-200/20 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="fixed bottom-0 right-1/4 w-[36rem] h-[36rem] bg-sky-200/20 rounded-full blur-3xl pointer-events-none -z-0"></div>

      <main className="flex-1 relative z-10">
        <Outlet />
      </main>

      <footer className="py-8 text-center text-xs text-stone-500 border-t border-white/80 bg-white/60 backdrop-blur-xl relative z-10">
        <p className="font-medium tracking-wide">Powered by Turtledot Studio Photography Delivery Platform</p>
      </footer>
    </div>
  );
};

export default ClientLayout;
