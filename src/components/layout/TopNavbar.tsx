import React, { useState } from 'react';
import { 
  Bell, 
  Grid, 
  ChevronDown, 
  LogOut, 
  RotateCcw, 
  UserCheck, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface TopNavbarProps {
  onOpenSearch?: () => void;
  onNavigate: (view: 'dashboard' | 'create-employee' | 'skills' | 'login') => void;
  onResetData: () => void;
  userRole?: string;
  userName?: string;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onNavigate,
  onResetData,
  userRole = 'Admin workspace',
  userName = 'Admin',
  onToggleSidebar,
  isSidebarCollapsed = false,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAppLauncher, setShowAppLauncher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-white border-b border-[#DFE5EE] shadow-[0_2px_10px_rgba(11,27,77,0.025)] px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Brand Name: L & T */}
      <div className="flex items-center">
        <button 
          onClick={() => onNavigate('dashboard')} 
          className="hover:opacity-80 transition-opacity focus:outline-none cursor-pointer flex items-center py-1"
          title="L & T"
        >
          <span className="text-xl md:text-2xl font-black tracking-tight text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">
            L & T
          </span>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 relative">

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowAppLauncher(false);
              setShowUserMenu(false);
            }}
            className="relative p-2 text-[#64748B] hover:text-[#0B1B4D] hover:bg-[#F1F5FD] rounded-xl transition-colors focus:outline-none"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E3EAF5] p-3 z-50 animate-in fade-in duration-100">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="font-semibold text-xs text-[#0B1B4D] uppercase tracking-wider">Notifications</span>
              </div>
              <div className="py-6 text-center text-xs text-[#64748B]">
                No new notifications
              </div>
            </div>
          )}
        </div>

        {/* App Launcher (9 dots) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowAppLauncher(!showAppLauncher);
              setShowNotifications(false);
              setShowUserMenu(false);
            }}
            className="p-2 text-[#64748B] hover:text-[#0B1B4D] hover:bg-[#F1F5FD] rounded-xl transition-colors focus:outline-none"
            title="Enterprise Applications"
          >
            <Grid className="w-5 h-5" />
          </button>

          {/* App Launcher Popover */}
          {showAppLauncher && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E3EAF5] p-3 z-50 animate-in fade-in duration-100">
              <div className="font-semibold text-xs text-[#0B1B4D] uppercase tracking-wider pb-2 mb-2 border-b border-slate-100">
                NEXUS Enterprise Ecosystem
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-left hover:bg-blue-100/60 cursor-pointer transition-colors">
                  <div className="font-bold text-[#1265FF] flex items-center justify-between">
                    L&D Portal
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Active Suite</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-left opacity-60">
                  <div className="font-semibold text-[#64748B]">Talent Cloud</div>
                  <div className="text-[11px] text-slate-400 mt-1">Coming Soon</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-left opacity-60">
                  <div className="font-semibold text-[#64748B]">OwlSure LMS</div>
                  <div className="text-[11px] text-slate-400 mt-1">Coming Soon</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-left opacity-60">
                  <div className="font-semibold text-[#64748B]">Performance IQ</div>
                  <div className="text-[11px] text-slate-400 mt-1">Coming Soon</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* Admin Avatar & Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
              setShowAppLauncher(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#F1F5FD] transition-colors focus:outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-[#1265FF] text-white font-bold text-sm flex items-center justify-center shadow-xs">
              {userName.substring(0, 1)}
            </div>
            <div className="text-left hidden lg:block leading-tight pr-1">
              <div className="text-sm font-semibold text-[#0B1B4D]">{userName}</div>
              <div className="text-[11px] text-[#64748B]">{userRole}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#94A3B8] hidden lg:block" />
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E3EAF5] p-2 z-50 animate-in fade-in duration-100 divide-y divide-slate-100">
              <div className="px-3 py-2">
                <div className="text-sm font-bold text-[#0B1B4D]">{userName}</div>
                <div className="text-xs text-[#64748B]">{userRole}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Authenticated
                </div>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    onResetData();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Reset System</span>
                </button>
              </div>
              <div className="pt-1">
                <button
                  onClick={() => {
                    onNavigate('login');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign out securely</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
