import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  ExternalLink,
  LogOut
} from 'lucide-react';

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
  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-white border-b border-[#DFE5EE] shadow-[0_2px_10px_rgba(11,27,77,0.025)] px-4 md:px-6 flex items-center justify-between gap-3 md:gap-4 select-none">
      {/* Left side: Brand Logo + Compact Header KPI Chips */}
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 min-w-0">
        {/* Brand Name: L & D */}
        <Link 
          to="/admin"
          className="hover:opacity-80 transition-opacity focus:outline-none cursor-pointer flex items-center py-1 shrink-0"
          title="L & D Dashboard"
        >
          <span className="text-xl md:text-2xl font-black tracking-tight text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">
            L & D
          </span>
        </Link>

        {/* Subtle Vertical Divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block shrink-0" />

        {/* Compact, Premium-Looking Header KPI Chips */}
        <div className="hidden sm:flex items-center gap-2 lg:gap-2.5 min-w-0">
          {/* Total Employees Chip */}
          <button
            type="button"
            onClick={onOpenTotalEmployeesModal}
            className="group relative flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-blue-50/80 border border-[#E2E8F0] hover:border-blue-200 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            title={`Active enterprise workforce directory (${totalEmployees} total employees)`}
          >
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#016DD9] border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider hidden lg:block leading-none mb-0.5">
                Total Employees
              </span>
              <span className="text-sm md:text-base font-extrabold text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif] tabular-nums leading-tight">
                {totalEmployees}
              </span>
            </div>
          </button>

          {/* Profiles Complete Chip */}
          <button
            type="button"
            onClick={onOpenProfilesCompleteModal}
            className="group relative flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-emerald-50/80 border border-[#E2E8F0] hover:border-emerald-200 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            title={`${verifiedCount} of ${totalEmployees} profiles verified (${completionRate}% complete)`}
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider hidden lg:block leading-none mb-0.5">
                Profiles Complete
              </span>
              <span className="text-sm md:text-base font-extrabold text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif] tabular-nums leading-tight">
                {completionRate}%
              </span>
            </div>
          </button>
        </div>
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

        {/* Admin Avatar & Logout */}
        <div className="flex items-center gap-2 py-1 px-1.5 rounded-xl bg-[#F8FAFC] border border-slate-200/60">
          <div className="w-8 h-8 rounded-full bg-[#1265FF] text-white font-bold text-xs flex items-center justify-center shadow-xs">
            A
          </div>
          <div className="text-left hidden sm:block leading-tight pr-1">
            <div className="text-xs font-bold text-[#0B1B4D]">Admin</div>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
