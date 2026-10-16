import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Users, Eye, MapPin, Briefcase, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import { Employee } from '../../types/employee';
import { CustomSelect } from '../common/CustomSelect';
import { useDropdowns } from '../../hooks/useDropdowns';

interface TotalEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onViewEmployee: (emp: Employee) => void;
}

export const TotalEmployeesModal: React.FC<TotalEmployeesModalProps> = ({
  isOpen,
  onClose,
  employees,
  onViewEmployee,
}) => {
  const { practices, locations, domains } = useDropdowns();
  const [search, setSearch] = useState('');
  const [selectedPractice, setSelectedPractice] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedDomain, setSelectedDomain] = useState('All');

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const s = search.toLowerCase();
      const matchesSearch =
        emp.name.toLowerCase().includes(s) ||
        emp.id.toLowerCase().includes(s) ||
        emp.designation.toLowerCase().includes(s) ||
        emp.email.toLowerCase().includes(s) ||
        (emp.domainExpertise && emp.domainExpertise.some((de) =>
          de.domain.toLowerCase().includes(s) ||
          (de.customDomain && de.customDomain.toLowerCase().includes(s))
        ));

      const matchesPractice =
        selectedPractice === 'All' || emp.businessUnit === selectedPractice;

      const matchesLocation =
        selectedLocation === 'All' || emp.location === selectedLocation;

      const matchesDomain =
        selectedDomain === 'All' ||
        (emp.domainExpertise && emp.domainExpertise.some((de) =>
          de.domain.toLowerCase() === selectedDomain.toLowerCase() ||
          (de.customDomain && de.customDomain.toLowerCase() === selectedDomain.toLowerCase())
        ));

      return matchesSearch && matchesPractice && matchesLocation && matchesDomain;
    });
  }, [employees, search, selectedPractice, selectedLocation, selectedDomain]);

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
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-[#DFE5EE] overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[min(90vh,780px)]">
        {/* Header */}
        <div className="p-6 border-b border-[#DFE5EE] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#016DD9] border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
              <Users className="w-6 h-6 text-[#016DD9]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
                  All Employees Directory
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#016DD9] font-bold text-xs border border-blue-200">
                  {employees.length} Total
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Browse workforce profiles, assigned delivery roles and competency coverage
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

        {/* Filter and Search Bar */}
        <div className="p-4 sm:px-6 bg-[#F8FAFD] border-b border-[#DFE5EE] flex flex-wrap items-center gap-3 shrink-0">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, designation, domain..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#DFE5EE] focus:border-[#016DD9] rounded-2xl text-xs md:text-sm text-[#0B1B4D] font-medium shadow-2xs focus:outline-none transition-all"
            />
          </div>

          {/* Practice Filter */}
          <div className="w-38 sm:w-40">
            <CustomSelect
              value={selectedPractice}
              onChange={setSelectedPractice}
              options={[
                { value: 'All', label: 'All Practices' },
                ...practices.map((p) => ({ value: p, label: p })),
              ]}
              size="sm"
              allowOther={false}
            />
          </div>

          {/* Location Filter */}
          <div className="w-36 sm:w-38">
            <CustomSelect
              value={selectedLocation}
              onChange={setSelectedLocation}
              options={[
                { value: 'All', label: 'All Locations' },
                ...locations.map((l) => ({ value: l, label: l })),
              ]}
              size="sm"
              allowOther={false}
            />
          </div>

          {/* Domain Expertise Filter */}
          <div className="w-38 sm:w-42">
            <CustomSelect
              value={selectedDomain}
              onChange={setSelectedDomain}
              options={[
                { value: 'All', label: 'All Domains' },
                ...(domains || []).map((d) => ({ value: d, label: d })),
              ]}
              size="sm"
              allowOther={false}
            />
          </div>
        </div>

        {/* Employee List / Table */}
        <div className="overflow-y-auto overflow-x-auto flex-1 p-4 sm:p-6">
          {filteredEmployees.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#64748B]">
              No employees match your search or filter criteria.
            </div>
          ) : (
            <div className="min-w-[760px] divide-y divide-slate-100">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className="py-3 px-3 flex items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/80 rounded-2xl transition-colors group"
                >
                  {/* Left: Employee Info (Avatar, Name, ID, Designation) */}
                  <div className="flex items-center gap-3 w-[230px] sm:w-[250px] shrink-0 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                        emp.avatarColor || 'bg-blue-100 text-[#016DD9]'
                      }`}
                    >
                      {emp.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-[#0B1B4D] group-hover:text-[#016DD9] transition-colors truncate">
                          {emp.name}
                        </span>
                        <span className="text-[10px] font-semibold text-[#64748B] bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                          {emp.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#016DD9] font-medium truncate mt-0.5">
                        {emp.designation}
                      </div>
                    </div>
                  </div>

                  {/* Practice & Location */}
                  <div className="flex items-center gap-3 text-xs text-[#64748B] w-[180px] sm:w-[200px] shrink-0">
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#0B1B4D] truncate">
                      <Briefcase className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                      <span className="truncate">{emp.businessUnit}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-500 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                      <span className="truncate">{emp.location}</span>
                    </span>
                  </div>

                  {/* Domain Expertise Badge */}
                  <div className="flex-1 min-w-[120px] max-w-[200px] flex items-center justify-start shrink-0 px-1">
                    {emp.domainExpertise && emp.domainExpertise.length > 0 ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 truncate max-w-full"
                        title={emp.domainExpertise.map((d) => d.domain).join(', ')}
                      >
                        <Layers className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="truncate">
                          {emp.domainExpertise.map((d) => d.domain).join(', ')}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-normal italic">
                        —
                      </span>
                    )}
                  </div>

                  {/* Profile Completion Badge */}
                  <div className="flex items-center gap-2 w-28 sm:w-32 shrink-0">
                    <span className="text-xs font-bold text-[#0B1B4D] w-7 text-right">
                      {emp.profileCompletion}%
                    </span>
                    <div className="w-14 sm:w-16 h-2 rounded-full bg-slate-100 overflow-hidden shrink-0">
                      <div
                        className={`h-full rounded-full ${
                          emp.profileCompletion >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${emp.profileCompletion}%` }}
                      />
                    </div>
                    {emp.profileCompletion >= 80 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                  </div>

                  {/* Action View Button - Always strictly aligned right and NEVER wraps */}
                  <div className="shrink-0 pl-2">
                    <button
                      type="button"
                      onClick={() => {
                        onViewEmployee(emp);
                        onClose();
                      }}
                      className="btn-shake-secondary inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 border border-[#DFE5EE] text-[#016DD9] text-xs font-semibold rounded-full shadow-2xs transition-all cursor-pointer whitespace-nowrap group-hover:border-blue-300"
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>View Profile</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-[#DFE5EE] bg-[#F8FAFD] flex items-center justify-between text-xs text-[#64748B] shrink-0">
          <span>
            Showing <strong className="text-[#0B1B4D]">{filteredEmployees.length}</strong> of{' '}
            {employees.length} employees
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
