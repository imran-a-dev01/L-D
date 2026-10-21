import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  ExternalLink,
  LogOut,
  ChevronDown,
  Shield
} from 'lucide-react';

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (target <= 0) { setValue(0); prev.current = 0; return; }
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    let raf: number;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(start + diff * eased));
      if (p < 1) raf = requestAnimationFrame(step);
      else prev.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

interface TopNavbarProps {
  onOpenSearch?: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  totalEmployees: number;
  completionRate: number;
  verifiedCount: number;
  onOpenTotalEmployeesModal: () => void;
  onOpenProfilesCompleteModal: () => void;
  onLogout?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  totalEmployees = 0,
  completionRate = 0,
  verifiedCount = 0,
  onOpenTotalEmployeesModal,
  onOpenProfilesCompleteModal,
  onLogout,
}) => {
  const animatedTotal = useCountUp(totalEmployees);
  const animatedRate = useCountUp(completionRate);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen]);

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-white border-b border-[#DFE5EE] shadow-[0_2px_10px_rgba(11,27,77,0.025)] px-4 md:px-6 flex items-center justify-between gap-3 md:gap-4 select-none">
      {/* Left side: Brand Logo */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Brand Logo: /logo.png | LEARNING & DEVELOPMENT */}
        <Link 
          to="/admin"
          className="hover:opacity-90 transition-opacity focus:outline-none cursor-pointer flex items-center gap-3 py-1 shrink-0"
          title="OwlSure - Learning & Development"
        >
          <img 
            src="/logo.png" 
            alt="OwlSure" 
            className="h-7 sm:h-8 md:h-9 w-auto object-contain shrink-0" 
          />

          <div className="h-5 w-px bg-slate-300 hidden sm:block shrink-0" />

          <span className="text-xs md:text-sm font-bold tracking-wider text-[#526077] uppercase font-['Plus_Jakarta_Sans',sans-serif] hidden sm:block whitespace-nowrap">
            LEARNING & DEVELOPMENT
          </span>
        </Link>
      </div>

      {/* Center: Animated Header KPI Chips Dock */}
      <div className="hidden md:flex items-center gap-2 lg:gap-2.5 absolute left-1/2 -translate-x-1/2 p-1 rounded-2xl bg-slate-100/70 border border-slate-200/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur-xs">
        {/* Total Employees Chip */}
        <button
          type="button"
          onClick={onOpenTotalEmployeesModal}
          className="header-kpi-chip header-kpi-chip--blue group relative flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/90 hover:border-blue-300 transition-all cursor-pointer shadow-xs active:scale-[0.98] overflow-hidden"
          style={{ animationDelay: '0s' }}
          title={`Active enterprise workforce directory (${totalEmployees} total employees)`}
        >
          <div className="header-kpi-shimmer" />
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#016DD9] border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-[#016DD9] group-hover:text-white transition-all duration-300 relative z-[1]">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left relative z-[1]">
            <div className="flex items-center gap-1.5 leading-none mb-0.5">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">
                Total Employees
              </span>
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#016DD9]" />
              </span>
            </div>
            <span className="text-sm md:text-base font-extrabold text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif] tabular-nums leading-tight">
              {animatedTotal}
            </span>
          </div>
        </button>

        {/* Profiles Complete Chip */}
        <button
          type="button"
          onClick={onOpenProfilesCompleteModal}
          className="header-kpi-chip header-kpi-chip--green group relative flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/90 hover:border-emerald-300 transition-all cursor-pointer shadow-xs active:scale-[0.98] overflow-hidden"
          style={{ animationDelay: '0.12s' }}
          title={`${verifiedCount} of ${totalEmployees} profiles verified (${completionRate}% complete)`}
        >
          <div className="header-kpi-shimmer" />
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 relative z-[1]">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left relative z-[1]">
            <div className="flex items-center gap-1.5 leading-none mb-0.5">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">
                Profiles Complete
              </span>
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
            </div>
            <span className="text-sm md:text-base font-extrabold text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif] tabular-nums leading-tight">
              {animatedRate}%
            </span>
          </div>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5 shrink-0 relative">
        {/* Link to Public Employee Profile Form */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 text-[#1265FF] hover:text-blue-700 font-semibold text-xs transition-colors border border-blue-200/60 shadow-2xs"
          title="Open public employee skill profile form (opens in new tab)"
        >
          <span>Employee form</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 mx-0.5"></div>

        {/* Admin Profile — iPhone-style */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 py-1 px-1.5 pr-2.5 rounded-full bg-[#F8FAFC] hover:bg-white border border-slate-200/70 hover:border-slate-300 transition-all cursor-pointer group active:scale-[0.97]"
            style={{
              boxShadow: profileOpen
                ? '0 0 0 2px rgba(18,101,255,0.12), 0 2px 8px rgba(0,0,0,0.06)'
                : '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            {/* Avatar with gradient ring + online dot */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-br from-[#1265FF] via-[#6366F1] to-[#06B6D4]">
                <div className="w-full h-full rounded-full bg-[#1265FF] text-white font-bold text-[11px] flex items-center justify-center">
                  A
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
            </div>
            <span className="text-xs font-semibold text-[#0B1B4D] hidden sm:block">Admin</span>
            <ChevronDown
              className="w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-300"
              style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          {/* Dropdown Panel */}
          <div
            className="absolute right-0 top-[calc(100%+8px)] w-64 z-50 pointer-events-none"
            style={{
              opacity: profileOpen ? 1 : 0,
              transform: profileOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-6px)',
              transition: 'opacity 0.2s cubic-bezier(0.22,1,0.36,1), transform 0.25s cubic-bezier(0.22,1,0.36,1)',
              pointerEvents: profileOpen ? 'auto' : 'none',
            }}
          >
            <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
              {/* Profile header */}
              <div className="p-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-br from-[#1265FF] via-[#6366F1] to-[#06B6D4] shrink-0">
                    <div className="w-full h-full rounded-full bg-[#1265FF] text-white font-bold text-sm flex items-center justify-center">
                      A
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#0B1B4D] truncate">Administrator</div>
                    <div className="text-[11px] text-[#64748B] truncate">L&D Platform Admin</div>
                  </div>
                </div>
              </div>

              {/* Role badge */}
              <div className="px-4 pb-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100">
                  <Shield className="w-3 h-3 text-[#016DD9]" />
                  <span className="text-[10px] font-bold text-[#016DD9] uppercase tracking-wider">Super Admin</span>
                </div>
              </div>

              {/* Separator */}
              <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-3" />

              {/* Sign out */}
              {onLogout && (
                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-rose-50 group/logout cursor-pointer active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-50 group-hover/logout:bg-rose-100 flex items-center justify-center transition-colors">
                      <LogOut className="w-4 h-4 text-rose-500" />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-rose-600">Sign Out</div>
                      <div className="text-[10px] text-[#94A3B8]">End your session</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
