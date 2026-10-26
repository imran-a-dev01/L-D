import React, { useState, useMemo, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  Eye, 
  TrendingUp,
  Mail 
} from 'lucide-react';
import { Employee } from '../../types/employee';
import { PageHeader } from '../layout/PageHeader';

interface ProfileCompleteViewProps {
  employees: Employee[];
  onViewEmployee: (emp: Employee) => void;
  onEditEmployee: (emp: Employee) => void;
}

export const ProfileCompleteView: React.FC<ProfileCompleteViewProps> = ({
  employees,
  onViewEmployee,
}) => {
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'complete' | 'progress' | 'needs-attention'>('all');
  const employeeListRef = useRef<HTMLDivElement>(null);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = employees.length;
    const complete = employees.filter((e) => e.profileCompletion >= 80).length;
    const progress = employees.filter((e) => e.profileCompletion >= 50 && e.profileCompletion < 80).length;
    const attention = employees.filter((e) => e.profileCompletion < 50).length;
    const avg = total > 0 ? Math.round(
      employees.reduce((acc, curr) => acc + curr.profileCompletion, 0) / total
    ) : 0;

    return { total, complete, progress, attention, avg };
  }, [employees]);

  // Click handler for Avg Completion KPI card: shows all, clears search, smoothly scrolls
  const handleShowAll = () => {
    setFilterTab('all');
    setSearch('');
    employeeListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Filtered employees list
  const filteredList = useMemo(() => {
    return employees.filter((emp) => {
      // Search match
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches = 
          emp.name.toLowerCase().includes(q) ||
          emp.id.toLowerCase().includes(q) ||
          (emp.email && emp.email.toLowerCase().includes(q)) ||
          emp.designation.toLowerCase().includes(q) ||
          emp.businessUnit.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Tab filter
      if (filterTab === 'complete') return emp.profileCompletion >= 80;
      if (filterTab === 'progress') return emp.profileCompletion >= 50 && emp.profileCompletion < 80;
      if (filterTab === 'needs-attention') return emp.profileCompletion < 50;
      return true;
    });
  }, [employees, search, filterTab]);

  return (
    <div className="space-y-6">
      {/* Unified Page Header: Reusable Breadcrumb + Heading */}
      <PageHeader title="Profile Complete" />

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Overall Completion - Clickable, always shows All & scrolls to list */}
        <div 
          role="button"
          tabIndex={0}
          aria-label="Avg Completion: Show all employees"
          onClick={handleShowAll}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleShowAll();
            }
          }}
          className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between cursor-pointer transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1265FF] ${
            filterTab === 'all'
              ? 'border-[#1265FF] ring-2 ring-blue-100 bg-blue-50/20'
              : 'border-[#DFE5EE] hover:border-[#1265FF]/40'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Avg Completion</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1265FF] flex items-center justify-center border border-blue-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">{stats.avg}%</div>
            <div className="text-xs text-[#64748B] font-medium mt-1">
              <span>Enterprise average</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-[#1265FF] h-full rounded-full transition-all duration-500" style={{ width: `${stats.avg}%` }} />
          </div>
        </div>

        {/* 2. Fully Completed Profiles */}
        <div 
          role="button"
          tabIndex={0}
          aria-label="Completed: Toggle filter"
          onClick={() => setFilterTab(filterTab === 'complete' ? 'all' : 'complete')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFilterTab(filterTab === 'complete' ? 'all' : 'complete');
            }
          }}
          className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between cursor-pointer transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            filterTab === 'complete' ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20' : 'border-[#DFE5EE] hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Completed (≥80%)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">{stats.complete}</div>
            <div className="text-xs text-[#64748B] mt-1">Fully completed profiles</div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.complete / stats.total) * 100 : 0}%` }} />
          </div>
        </div>

        {/* 3. In Progress */}
        <div 
          role="button"
          tabIndex={0}
          aria-label="In Progress: Toggle filter"
          onClick={() => setFilterTab(filterTab === 'progress' ? 'all' : 'progress')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFilterTab(filterTab === 'progress' ? 'all' : 'progress');
            }
          }}
          className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between cursor-pointer transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
            filterTab === 'progress' ? 'border-amber-500 ring-2 ring-amber-100 bg-amber-50/20' : 'border-[#DFE5EE] hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">In Progress (50-79%)</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">{stats.progress}</div>
            <div className="text-xs text-[#64748B] mt-1">Partially completed profiles</div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.progress / stats.total) * 100 : 0}%` }} />
          </div>
        </div>

        {/* 4. Action Required */}
        <div 
          role="button"
          tabIndex={0}
          aria-label="Incomplete: Toggle filter"
          onClick={() => setFilterTab(filterTab === 'needs-attention' ? 'all' : 'needs-attention')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFilterTab(filterTab === 'needs-attention' ? 'all' : 'needs-attention');
            }
          }}
          className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between cursor-pointer transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
            filterTab === 'needs-attention' ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20' : 'border-[#DFE5EE] hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Incomplete (&lt;50%)</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">{stats.attention}</div>
            <div className="text-xs text-[#64748B] mt-1">Pending profile details</div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.attention / stats.total) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Employee List with Profile Completion Details */}
      <div ref={employeeListRef} className="bg-white rounded-2xl border border-[#DFE5EE] shadow-sm overflow-hidden scroll-mt-6">
        {/* Controls Bar */}
        <div className="p-5 border-b border-[#DFE5EE] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F1F5FD] rounded-xl self-stretch sm:self-auto overflow-x-auto">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'all'
                  ? 'bg-white text-[#016DD9] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0B1B4D]'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilterTab('complete')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'complete'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-[#64748B] hover:text-[#0B1B4D]'
              }`}
            >
              Complete ({stats.complete})
            </button>
            <button
              onClick={() => setFilterTab('progress')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'progress'
                  ? 'bg-white text-amber-600 shadow-xs'
                  : 'text-[#64748B] hover:text-[#0B1B4D]'
              }`}
            >
              In Progress ({stats.progress})
            </button>
            <button
              onClick={() => setFilterTab('needs-attention')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'needs-attention'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-[#64748B] hover:text-[#0B1B4D]'
              }`}
            >
              Incomplete ({stats.attention})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by name, ID, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#F8FAFD] border border-[#DFE5EE] rounded-xl text-[#0B1B4D] placeholder-[#94A3B8] focus:outline-none focus:border-[#016DD9] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Profiles Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFD] border-b border-[#DFE5EE] text-[#64748B] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-6">Employee</th>
                <th className="py-3.5 px-6">Business Unit & Role</th>
                <th className="py-3.5 px-6">Completion Progress</th>
                <th className="py-3.5 px-6">Email</th>
                <th className="py-3.5 px-6">Total Skills</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE5EE]">
              {filteredList.map((emp) => {
                const isComplete = emp.profileCompletion >= 80;
                const isProgress = emp.profileCompletion >= 50 && emp.profileCompletion < 80;

                return (
                  <tr key={emp.id} className="hover:bg-blue-50/40 transition-colors">
                    {/* Employee */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#016DD9] to-sky-400 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                          {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-[#0B1B4D] text-xs">{emp.name}</div>
                          <div className="text-[11px] text-[#64748B] font-mono">{emp.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role & BU */}
                    <td className="py-4 px-6">
                      <div className="text-[#0B1B4D] font-medium">{emp.designation?.trim() || '—'}</div>
                      <div className="text-[11px] text-[#64748B]">{emp.businessUnit?.trim() || '—'}</div>
                    </td>

                    {/* Completion Bar */}
                    <td className="py-4 px-6">
                      <div className="w-48">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#0B1B4D]">{emp.profileCompletion}%</span>
                          <span className="text-[10px] text-[#64748B]">
                            {isComplete ? 'Complete' : isProgress ? 'In Progress' : 'Incomplete'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              isComplete ? 'bg-emerald-500' : isProgress ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${emp.profileCompletion}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-6">
                      {emp.email ? (
                        <a
                          href={`mailto:${emp.email}`}
                          className="inline-flex items-center gap-1.5 text-xs text-[#0B1B4D] hover:text-[#016DD9] font-medium transition-colors group/mail"
                          title={`Email ${emp.email}`}
                        >
                          <Mail className="w-3.5 h-3.5 text-[#94A3B8] group-hover/mail:text-[#016DD9] shrink-0 transition-colors" />
                          <span className="truncate max-w-[200px]">
                            {emp.email}
                          </span>
                        </a>
                      ) : (
                        <span className="text-xs text-[#94A3B8] italic">—</span>
                      )}
                    </td>

                    {/* Skills count */}
                    <td className="py-4 px-6 text-[#64748B]">
                      {(() => {
                        const count = (emp.technicalSkills?.length || 0) + (emp.domainExpertise?.length || 0);
                        return (
                          <>
                            <span className="font-semibold text-[#0B1B4D]">{count}</span>{' '}
                            {count === 1 ? 'total skill' : 'total skills'}
                          </>
                        );
                      })()}
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => onViewEmployee(emp)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-[#016DD9] text-[#016DD9] hover:text-white font-semibold text-xs border border-blue-200 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
