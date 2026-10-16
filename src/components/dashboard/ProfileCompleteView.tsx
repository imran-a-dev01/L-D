import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  Eye, 
  Building2, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { Employee } from '../../types/employee';

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

  // Business Unit Completion Averages
  const practiceStats = useMemo(() => {
    const map = new Map<string, { total: number; sum: number }>();
    employees.forEach((emp) => {
      const bu = emp.businessUnit || 'General';
      const curr = map.get(bu) || { total: 0, sum: 0 };
      curr.total += 1;
      curr.sum += emp.profileCompletion;
      map.set(bu, curr);
    });

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      avg: Math.round(data.sum / data.total),
      count: data.total,
    })).sort((a, b) => b.avg - a.avg);
  }, [employees]);

  // Filtered employees list
  const filteredList = useMemo(() => {
    return employees.filter((emp) => {
      // Search match
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches = 
          emp.name.toLowerCase().includes(q) ||
          emp.id.toLowerCase().includes(q) ||
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
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#DFE5EE] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full pointer-events-none opacity-40 bg-gradient-to-l from-emerald-100/60 via-teal-50/30 to-transparent" />
        
        <div className="relative z-10">
          <div className="text-xs font-semibold text-[#64748B] flex items-center gap-2 mb-2">
            <span>Home</span>
            <span className="text-slate-300">›</span>
            <span className="text-[#016DD9] font-medium">Profile Complete</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B1B4D] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
              Profile Complete Intelligence
            </h1>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
              {stats.avg}% Overall Average
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#64748B] mt-1 font-normal">
            Track verification progress, competency coverage, and profile completion across {stats.total} enterprise employees.
          </p>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Completion */}
        <div className="bg-white rounded-2xl p-5 border border-[#DFE5EE] shadow-sm flex flex-col justify-between hover:border-[#016DD9]/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Avg Completion</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#016DD9] flex items-center justify-center border border-blue-100">
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
            <div className="bg-[#016DD9] h-full rounded-full transition-all duration-500" style={{ width: `${stats.avg}%` }} />
          </div>
        </div>

        {/* Fully Completed Profiles */}
        <div 
          onClick={() => setFilterTab(filterTab === 'complete' ? 'all' : 'complete')}
          className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
            filterTab === 'complete' ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20' : 'border-[#DFE5EE] hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Verified (≥80%)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">{stats.complete}</div>
            <div className="text-xs text-[#64748B] mt-1">Ready for deployment</div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${(stats.complete / stats.total) * 100}%` }} />
          </div>
        </div>

        {/* In Progress */}
        <div 
          onClick={() => setFilterTab(filterTab === 'progress' ? 'all' : 'progress')}
          className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
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
            <div className="text-xs text-[#64748B] mt-1">Pending skill verification</div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${(stats.progress / stats.total) * 100}%` }} />
          </div>
        </div>

        {/* Action Required */}
        <div 
          onClick={() => setFilterTab(filterTab === 'needs-attention' ? 'all' : 'needs-attention')}
          className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
            filterTab === 'needs-attention' ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20' : 'border-[#DFE5EE] hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Action Needed (&lt;50%)</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">{stats.attention}</div>
            <div className="text-xs text-[#64748B] mt-1">Missing primary credentials</div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${(stats.attention / stats.total) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Practice / Business Unit Breakdown Cards */}
      <div className="bg-white rounded-2xl p-6 border border-[#DFE5EE] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">
              Practice Completion Breakdown
            </h3>
            <p className="text-xs text-[#64748B]">Average profile completion percentage categorized by business unit</p>
          </div>
          <Building2 className="w-5 h-5 text-[#64748B]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {practiceStats.map((item) => (
            <div key={item.name} className="p-3.5 rounded-xl bg-[#F8FAFD] border border-[#E3EAF5] flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0B1B4D] truncate max-w-[180px]">{item.name}</span>
                <span className="text-xs font-extrabold text-[#016DD9] bg-white px-2 py-0.5 rounded-md border border-[#E3EAF5]">
                  {item.avg}%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${item.avg >= 80 ? 'bg-emerald-500' : item.avg >= 60 ? 'bg-[#016DD9]' : 'bg-amber-500'}`}
                  style={{ width: `${item.avg}%` }}
                />
              </div>
              <span className="text-[11px] text-[#64748B]">{item.count} profiles registered</span>
            </div>
          ))}
        </div>
      </div>

      {/* Employee List with Profile Completion Details */}
      <div className="bg-white rounded-2xl border border-[#DFE5EE] shadow-sm overflow-hidden">
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
              Needs Attention ({stats.attention})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by name, ID, role..."
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
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Skills Count</th>
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
                      <div className="text-[#0B1B4D] font-medium">{emp.designation}</div>
                      <div className="text-[11px] text-[#64748B]">{emp.businessUnit}</div>
                    </td>

                    {/* Completion Bar */}
                    <td className="py-4 px-6">
                      <div className="w-48">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#0B1B4D]">{emp.profileCompletion}%</span>
                          <span className="text-[10px] text-[#64748B]">
                            {isComplete ? 'Verified' : isProgress ? 'Incomplete' : 'Critical'}
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

                    {/* Status */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        isComplete
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isProgress
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-emerald-500' : isProgress ? 'bg-amber-500' : 'bg-rose-500'}`} />
                        {isComplete ? 'Verified' : isProgress ? 'In Progress' : 'Needs Review'}
                      </span>
                    </td>

                    {/* Skills count */}
                    <td className="py-4 px-6 text-[#64748B]">
                      <span className="font-semibold text-[#0B1B4D]">{emp.technicalSkills.length}</span> verified skills
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
