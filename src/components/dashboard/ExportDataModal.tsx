import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Download, 
  Users, 
  UserCheck, 
  Briefcase, 
  MapPin, 
  Layers, 
  Check, 
  Search, 
  FileSpreadsheet, 
  FileCode,
  ShieldAlert,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Employee } from '../../types/employee';
import { employeeService } from '../../services/employeeService';
import { useToast } from '../common/Toast';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  selectedEmployees?: Employee[];
}

type ExportMode = 'all' | 'manager' | 'practice' | 'location' | 'domain' | 'selected';

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  employees,
  selectedEmployees = [],
}) => {
  const { toast } = useToast();
  const [mode, setMode] = useState<ExportMode>('all');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [selectedManager, setSelectedManager] = useState<string>('All');
  const [selectedPractice, setSelectedPractice] = useState<string>('All');
  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [selectedDomain, setSelectedDomain] = useState<string>('All');
  const [managerSearchQuery, setManagerSearchQuery] = useState('');

  // Lock body scroll while modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Aggregate Managers with direct employee counts
  const managersWithStats = useMemo(() => {
    const map = new Map<string, Employee[]>();
    employees.forEach((emp) => {
      const mgr = emp.reportingManager?.trim() || 'Unassigned Manager';
      if (!map.has(mgr)) map.set(mgr, []);
      map.get(mgr)!.push(emp);
    });
    return Array.from(map.entries())
      .map(([name, reports]) => ({ name, count: reports.length, employees: reports }))
      .sort((a, b) => b.count - a.count);
  }, [employees]);

  // Aggregate Practices with stats
  const practicesWithStats = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach((emp) => {
      const p = emp.businessUnit?.trim() || 'General';
      map.set(p, (map.get(p) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [employees]);

  // Aggregate Locations with stats
  const locationsWithStats = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach((emp) => {
      const loc = emp.location?.trim() || 'Remote';
      map.set(loc, (map.get(loc) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [employees]);

  // Aggregate Domains with stats
  const domainsWithStats = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach((emp) => {
      if (emp.domainExpertise && emp.domainExpertise.length > 0) {
        emp.domainExpertise.forEach((de) => {
          const d = de.domain === 'Others' ? de.customDomain || 'Others' : de.domain;
          map.set(d, (map.get(d) || 0) + 1);
        });
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [employees]);

  // Filtered manager list for quick search inside the modal
  const filteredManagers = useMemo(() => {
    if (!managerSearchQuery.trim()) return managersWithStats;
    const q = managerSearchQuery.toLowerCase();
    return managersWithStats.filter((m) => m.name.toLowerCase().includes(q));
  }, [managersWithStats, managerSearchQuery]);

  // Target employees dynamically filtered based on chosen mode
  const targetEmployees = useMemo(() => {
    switch (mode) {
      case 'all':
        return employees;
      case 'selected':
        return selectedEmployees.length > 0 ? selectedEmployees : employees;
      case 'manager':
        if (!selectedManager || selectedManager === 'All') return employees;
        return employees.filter(
          (e) => (e.reportingManager?.trim() || 'Unassigned Manager') === selectedManager
        );
      case 'practice':
        if (!selectedPractice || selectedPractice === 'All') return employees;
        return employees.filter((e) => e.businessUnit === selectedPractice);
      case 'location':
        if (!selectedLocation || selectedLocation === 'All') return employees;
        return employees.filter((e) => e.location === selectedLocation);
      case 'domain':
        if (!selectedDomain || selectedDomain === 'All') return employees;
        return employees.filter(
          (e) =>
            e.domainExpertise &&
            e.domainExpertise.some((d) => {
              const domName = d.domain === 'Others' ? d.customDomain || 'Others' : d.domain;
              return domName.toLowerCase() === selectedDomain.toLowerCase();
            })
        );
      default:
        return employees;
    }
  }, [
    mode,
    employees,
    selectedEmployees,
    selectedManager,
    selectedPractice,
    selectedLocation,
    selectedDomain,
  ]);

  // Trigger download action
  const handleDownload = () => {
    if (targetEmployees.length === 0) {
      toast('No employees match the chosen export criteria', 'warning', 'Export Empty');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    let scopeSlug = 'all';

    if (mode === 'manager' && selectedManager !== 'All') {
      scopeSlug = `manager_${selectedManager.replace(/\s+/g, '_').toLowerCase()}`;
    } else if (mode === 'practice' && selectedPractice !== 'All') {
      scopeSlug = `practice_${selectedPractice.replace(/\s+/g, '_').toLowerCase()}`;
    } else if (mode === 'location' && selectedLocation !== 'All') {
      scopeSlug = `location_${selectedLocation.replace(/\s+/g, '_').toLowerCase()}`;
    } else if (mode === 'domain' && selectedDomain !== 'All') {
      scopeSlug = `domain_${selectedDomain.replace(/\s+/g, '_').toLowerCase()}`;
    } else if (mode === 'selected') {
      scopeSlug = 'selected_batch';
    }

    const filename = `nexus_${scopeSlug}_${timestamp}.${format}`;

    if (format === 'csv') {
      employeeService.exportCsv(targetEmployees, filename);
    } else {
      employeeService.exportJson(targetEmployees, filename);
    }

    toast(
      `Successfully exported ${targetEmployees.length} employee records to ${filename}!`,
      'success',
      'Export Complete'
    );
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#DFE5EE] overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[min(90vh,760px)]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#DFE5EE] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#1265FF] border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
              <Download className="w-5 h-5 text-[#1265FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
                  Export Workforce Data
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1265FF] font-bold text-xs border border-blue-200">
                  {targetEmployees.length} Records Selected
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Choose export scope: all employees, by reporting manager, business practice, or location
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 text-[#64748B] hover:text-[#0B1B4D] flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area with Tabs & Scope Selector */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
          
          {/* Top Scope Tabs */}
          <div>
            <label className="block text-xs font-bold text-[#0B1B4D] uppercase tracking-wider mb-2">
              1. Select Export Scope
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              
              {/* All Employees */}
              <button
                type="button"
                onClick={() => setMode('all')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  mode === 'all'
                    ? 'border-[#1265FF] bg-blue-50/70 ring-2 ring-blue-100 shadow-2xs'
                    : 'border-[#DFE5EE] bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Users className={`w-4 h-4 ${mode === 'all' ? 'text-[#1265FF]' : 'text-[#64748B]'}`} />
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B4D]">
                    {employees.length}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#0B1B4D]">All Employees</div>
                <div className="text-[10px] text-[#64748B]">Complete directory</div>
              </button>

              {/* By Manager */}
              <button
                type="button"
                onClick={() => setMode('manager')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  mode === 'manager'
                    ? 'border-[#1265FF] bg-blue-50/70 ring-2 ring-blue-100 shadow-2xs'
                    : 'border-[#DFE5EE] bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <UserCheck className={`w-4 h-4 ${mode === 'manager' ? 'text-[#1265FF]' : 'text-[#64748B]'}`} />
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-[#1265FF]">
                    {managersWithStats.length} mgrs
                  </span>
                </div>
                <div className="text-xs font-bold text-[#0B1B4D]">By Manager</div>
                <div className="text-[10px] text-[#64748B]">Direct report teams</div>
              </button>

              {/* By Practice */}
              <button
                type="button"
                onClick={() => setMode('practice')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  mode === 'practice'
                    ? 'border-[#1265FF] bg-blue-50/70 ring-2 ring-blue-100 shadow-2xs'
                    : 'border-[#DFE5EE] bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Briefcase className={`w-4 h-4 ${mode === 'practice' ? 'text-[#1265FF]' : 'text-[#64748B]'}`} />
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B4D]">
                    {practicesWithStats.length}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#0B1B4D]">By Practice</div>
                <div className="text-[10px] text-[#64748B]">Business units</div>
              </button>

              {/* By Location */}
              <button
                type="button"
                onClick={() => setMode('location')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  mode === 'location'
                    ? 'border-[#1265FF] bg-blue-50/70 ring-2 ring-blue-100 shadow-2xs'
                    : 'border-[#DFE5EE] bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <MapPin className={`w-4 h-4 ${mode === 'location' ? 'text-[#1265FF]' : 'text-[#64748B]'}`} />
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B4D]">
                    {locationsWithStats.length}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#0B1B4D]">By Location</div>
                <div className="text-[10px] text-[#64748B]">Delivery hubs</div>
              </button>

              {/* By Domain */}
              <button
                type="button"
                onClick={() => setMode('domain')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  mode === 'domain'
                    ? 'border-[#1265FF] bg-blue-50/70 ring-2 ring-blue-100 shadow-2xs'
                    : 'border-[#DFE5EE] bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Layers className={`w-4 h-4 ${mode === 'domain' ? 'text-[#1265FF]' : 'text-[#64748B]'}`} />
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-[#0B1B4D]">
                    {domainsWithStats.length}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#0B1B4D]">By Domain</div>
                <div className="text-[10px] text-[#64748B]">Industry expertise</div>
              </button>

            </div>
          </div>

          {/* Detailed Selection Section based on chosen mode */}
          {mode === 'manager' && (
            <div className="p-4 bg-[#F8FAFD] rounded-2xl border border-[#DFE5EE] space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#1265FF]" />
                  <span>Choose Reporting Manager to Export</span>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={managerSearchQuery}
                    onChange={(e) => setManagerSearchQuery(e.target.value)}
                    placeholder="Search managers..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#DFE5EE] rounded-xl text-xs text-[#0B1B4D] placeholder-slate-400 focus:outline-none focus:border-[#1265FF]"
                  />
                </div>
              </div>

              {/* Manager cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {/* All Managers option */}
                <div
                  onClick={() => setSelectedManager('All')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedManager === 'All'
                      ? 'border-[#1265FF] bg-white ring-2 ring-blue-100 shadow-2xs font-bold text-[#1265FF]'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-[#0B1B4D]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1265FF] font-bold text-xs flex items-center justify-center">
                      ALL
                    </div>
                    <div>
                      <div className="text-xs font-bold">All Managers</div>
                      <div className="text-[10px] text-[#64748B]">All direct reports</div>
                    </div>
                  </div>
                  {selectedManager === 'All' && <Check className="w-4 h-4 text-[#1265FF]" />}
                </div>

                {filteredManagers.map((m) => {
                  const isSelected = selectedManager === m.name;
                  const initials = m.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <div
                      key={m.name}
                      onClick={() => setSelectedManager(m.name)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-[#1265FF] bg-white ring-2 ring-blue-100 shadow-2xs font-bold text-[#1265FF]'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-[#0B1B4D]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-[#0B1B4D] font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate text-[#0B1B4D]">{m.name}</div>
                          <div className="text-[10px] text-[#64748B]">
                            <span className="font-semibold text-emerald-600">{m.count}</span> direct reports
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#1265FF] shrink-0 ml-1" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Practice Scope options */}
          {mode === 'practice' && (
            <div className="p-4 bg-[#F8FAFD] rounded-2xl border border-[#DFE5EE] space-y-2.5 animate-in fade-in duration-150">
              <div className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-[#1265FF]" />
                <span>Select Business Practice</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPractice('All')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedPractice === 'All'
                      ? 'bg-[#1265FF] text-white shadow-xs'
                      : 'bg-white border border-[#DFE5EE] text-[#0B1B4D] hover:bg-slate-50'
                  }`}
                >
                  All Practices ({employees.length})
                </button>
                {practicesWithStats.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setSelectedPractice(p.name)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                      selectedPractice === p.name
                        ? 'bg-[#1265FF] text-white shadow-xs'
                        : 'bg-white border border-[#DFE5EE] text-[#0B1B4D] hover:bg-slate-50'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        selectedPractice === p.name
                          ? 'bg-blue-400/40 text-white'
                          : 'bg-slate-100 text-[#64748B]'
                      }`}
                    >
                      {p.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Location Scope options */}
          {mode === 'location' && (
            <div className="p-4 bg-[#F8FAFD] rounded-2xl border border-[#DFE5EE] space-y-2.5 animate-in fade-in duration-150">
              <div className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#1265FF]" />
                <span>Select Delivery Hub / Location</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLocation('All')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedLocation === 'All'
                      ? 'bg-[#1265FF] text-white shadow-xs'
                      : 'bg-white border border-[#DFE5EE] text-[#0B1B4D] hover:bg-slate-50'
                  }`}
                >
                  All Locations ({employees.length})
                </button>
                {locationsWithStats.map((l) => (
                  <button
                    key={l.name}
                    type="button"
                    onClick={() => setSelectedLocation(l.name)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                      selectedLocation === l.name
                        ? 'bg-[#1265FF] text-white shadow-xs'
                        : 'bg-white border border-[#DFE5EE] text-[#0B1B4D] hover:bg-slate-50'
                    }`}
                  >
                    <span>{l.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        selectedLocation === l.name
                          ? 'bg-blue-400/40 text-white'
                          : 'bg-slate-100 text-[#64748B]'
                      }`}
                    >
                      {l.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Domain Scope options */}
          {mode === 'domain' && (
            <div className="p-4 bg-[#F8FAFD] rounded-2xl border border-[#DFE5EE] space-y-2.5 animate-in fade-in duration-150">
              <div className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#1265FF]" />
                <span>Select Domain Expertise</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDomain('All')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedDomain === 'All'
                      ? 'bg-[#1265FF] text-white shadow-xs'
                      : 'bg-white border border-[#DFE5EE] text-[#0B1B4D] hover:bg-slate-50'
                  }`}
                >
                  All Domains
                </button>
                {domainsWithStats.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => setSelectedDomain(d.name)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                      selectedDomain === d.name
                        ? 'bg-[#1265FF] text-white shadow-xs'
                        : 'bg-white border border-[#DFE5EE] text-[#0B1B4D] hover:bg-slate-50'
                    }`}
                  >
                    <span>{d.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        selectedDomain === d.name
                          ? 'bg-blue-400/40 text-white'
                          : 'bg-slate-100 text-[#64748B]'
                      }`}
                    >
                      {d.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Format selection */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-[#0B1B4D] uppercase tracking-wider mb-1">
                2. Export File Format
              </label>
              <div className="text-xs text-[#64748B]">Choose preferred data export format</div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  format === 'csv'
                    ? 'bg-blue-50 border border-[#1265FF] text-[#1265FF] shadow-2xs font-bold'
                    : 'bg-white border border-[#DFE5EE] text-[#64748B] hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>CSV Spreadsheet (.csv)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  format === 'json'
                    ? 'bg-blue-50 border border-[#1265FF] text-[#1265FF] shadow-2xs font-bold'
                    : 'bg-white border border-[#DFE5EE] text-[#64748B] hover:bg-slate-50'
                }`}
              >
                <FileCode className="w-4 h-4 text-purple-600" />
                <span>JSON Data (.json)</span>
              </button>
            </div>
          </div>

          {/* Live Preview List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider flex items-center gap-1.5">
                <span>3. Live Records Preview</span>
                <span className="text-slate-400 font-normal">
                  (Showing first 5 of {targetEmployees.length})
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                {targetEmployees.length} records ready
              </span>
            </div>

            <div className="border border-[#DFE5EE] rounded-2xl overflow-hidden bg-white max-h-44 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F8FAFD] border-b border-[#DFE5EE] text-[#64748B] font-semibold text-[11px]">
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Designation</th>
                    <th className="py-2 px-3">Reporting Manager</th>
                    <th className="py-2 px-3">Practice</th>
                    <th className="py-2 px-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFE5EE]">
                  {targetEmployees.slice(0, 5).map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-[#1265FF]">{emp.id}</td>
                      <td className="py-2 px-3 font-bold text-[#0B1B4D]">{emp.name}</td>
                      <td className="py-2 px-3 text-[#64748B]">{emp.designation}</td>
                      <td className="py-2 px-3 text-[#0B1B4D] font-medium">
                        {emp.reportingManager || '—'}
                      </td>
                      <td className="py-2 px-3 text-[#64748B]">{emp.businessUnit}</td>
                      <td className="py-2 px-3 text-[#64748B]">{emp.location}</td>
                    </tr>
                  ))}
                  {targetEmployees.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-slate-400">
                        No employees match the selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#DFE5EE] bg-[#F8FAFD] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0B1B4D] hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-[#0B1B4D]">
                {targetEmployees.length} Employees to Export
              </div>
              <div className="text-[11px] text-[#64748B]">
                Format: <span className="font-semibold uppercase">{format}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={targetEmployees.length === 0}
              className="btn-shake inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 rounded-xl bg-[#1265FF] hover:bg-[#0E52D4] text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download {format.toUpperCase()} Export</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
