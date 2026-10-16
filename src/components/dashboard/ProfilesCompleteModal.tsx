import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, CheckCircle2, AlertCircle, Clock, FileText, ArrowUpRight, Eye } from 'lucide-react';
import { Employee } from '../../types/employee';

interface ProfilesCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onViewEmployee: (emp: Employee) => void;
}

export const ProfilesCompleteModal: React.FC<ProfilesCompleteModalProps> = ({
  isOpen,
  onClose,
  employees,
  onViewEmployee,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Complete' | 'In Progress' | 'Needs Review'>('All');

  // Breakdown statistics
  const stats = useMemo(() => {
    const complete = employees.filter((e) => e.profileCompletion >= 80).length;
    const inProgress = employees.filter((e) => e.profileCompletion >= 50 && e.profileCompletion < 80).length;
    const needsReview = employees.filter((e) => e.profileCompletion < 50).length;
    const average = Math.round(
      employees.reduce((acc, curr) => acc + curr.profileCompletion, 0) / (employees.length || 1)
    );
    return { complete, inProgress, needsReview, average };
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.id.toLowerCase().includes(search.toLowerCase()) ||
        emp.designation.toLowerCase().includes(search.toLowerCase()) ||
        emp.businessUnit.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Complete'
          ? emp.profileCompletion >= 80
          : statusFilter === 'In Progress'
          ? emp.profileCompletion >= 50 && emp.profileCompletion < 80
          : emp.profileCompletion < 50;

      return matchesSearch && matchesStatus;
    });
  }, [employees, search, statusFilter]);

  // Lock background body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Dialog - Perfectly Centered in Viewport */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#DFE5EE] overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[min(90vh,760px)]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#DFE5EE] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
                  Profile Completion Breakdown
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                  {stats.average}% Avg Completion
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Detailed verification status, completed credentials and pending upskilling details
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#94A3B8] hover:text-[#0B1B4D] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Metric Cards Highlight */}
        <div className="p-4 sm:px-6 bg-[#F8FAFD] border-b border-[#DFE5EE] grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div
            onClick={() => setStatusFilter(statusFilter === 'Complete' ? 'All' : 'Complete')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'Complete'
                ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs'
                : 'bg-white border-[#E3EAF5] hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748B]">Complete (≥80%)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0B1B4D]">{stats.complete}</span>
              <span className="text-xs font-semibold text-emerald-600">
                {Math.round((stats.complete / employees.length) * 100)}%
              </span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'In Progress' ? 'All' : 'In Progress')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'In Progress'
                ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
                : 'bg-white border-[#E3EAF5] hover:border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748B]">In Progress (50-79%)</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0B1B4D]">{stats.inProgress}</span>
              <span className="text-xs font-semibold text-amber-600">
                {Math.round((stats.inProgress / employees.length) * 100)}%
              </span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter(statusFilter === 'Needs Review' ? 'All' : 'Needs Review')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'Needs Review'
                ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/20 shadow-xs'
                : 'bg-white border-[#E3EAF5] hover:border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748B]">Needs Review (&lt;50%)</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0B1B4D]">{stats.needsReview}</span>
              <span className="text-xs font-semibold text-rose-600">
                {Math.round((stats.needsReview / employees.length) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Filter Tabs and Search Bar */}
        <div className="px-4 sm:px-6 py-3 bg-white border-b border-[#DFE5EE] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['All', 'Complete', 'In Progress', 'Needs Review'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === tab
                    ? 'bg-[#016DD9] text-white shadow-xs'
                    : 'bg-slate-100 text-[#64748B] hover:bg-slate-200/70 hover:text-[#0B1B4D]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee or role..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#F8FAFD] border border-[#DFE5EE] focus:border-[#016DD9] rounded-xl text-xs text-[#0B1B4D] font-medium focus:outline-none"
            />
          </div>
        </div>

        {/* Employee List with Detailed Progress */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 divide-y divide-slate-100">
          {filteredEmployees.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B]">
              No employees match the selected completion category or search query.
            </div>
          ) : (
            filteredEmployees.map((emp) => {
              const isHigh = emp.profileCompletion >= 80;
              const isMedium = emp.profileCompletion >= 50 && emp.profileCompletion < 80;

              return (
                <div
                  key={emp.id}
                  className="py-4 px-3 flex flex-wrap items-center justify-between gap-4 hover:bg-[#F8FAFD] rounded-2xl transition-colors group"
                >
                  {/* Left: Employee Info */}
                  <div className="min-w-[240px] flex-1 flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                        emp.avatarColor || 'bg-blue-100 text-[#016DD9]'
                      }`}
                    >
                      {emp.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0B1B4D] group-hover:text-[#016DD9] transition-colors">
                          {emp.name}
                        </span>
                        <span className="text-[11px] font-semibold text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-md">
                          {emp.id}
                        </span>
                      </div>
                      <div className="text-xs text-[#64748B] mt-0.5">
                        {emp.designation} • <span className="text-[#0B1B4D] font-medium">{emp.businessUnit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Detailed Completion Breakdown Progress */}
                  <div className="min-w-[260px] flex-1 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#64748B]">
                        {emp.technicalSkills.length} Skills • {emp.domainExpertise?.length || 0} Domains
                      </span>
                      <span
                        className={`font-bold ${
                          isHigh ? 'text-emerald-600' : isMedium ? 'text-amber-600' : 'text-rose-600'
                        }`}
                      >
                        {emp.profileCompletion}% Complete
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isHigh
                            ? 'bg-emerald-500'
                            : isMedium
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${emp.profileCompletion}%` }}
                      />
                    </div>

                    <div className="text-[11px] text-[#94A3B8]">
                      {isHigh ? (
                        <span className="text-emerald-700 font-medium">✓ Fully verified & deployment-ready</span>
                      ) : isMedium ? (
                        <span className="text-amber-700 font-medium">⚠ Pending domain depth verification</span>
                      ) : (
                        <span className="text-rose-600 font-medium">✗ Basic details logged, skills missing</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Review Button */}
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onViewEmployee(emp);
                        onClose();
                      }}
                      className="btn-shake-secondary inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-emerald-50 border border-[#DFE5EE] text-[#0B1B4D] hover:text-emerald-700 text-xs font-semibold rounded-full shadow-2xs transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Profile</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-[#DFE5EE] bg-[#F8FAFD] flex items-center justify-between text-xs text-[#64748B] shrink-0">
          <span>
            Showing <strong className="text-[#0B1B4D]">{filteredEmployees.length}</strong> of{' '}
            {employees.length} employee profiles
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-shake-secondary px-5 py-2 bg-white border border-[#DFE5EE] hover:bg-slate-100 rounded-full font-semibold text-[#0B1B4D] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
