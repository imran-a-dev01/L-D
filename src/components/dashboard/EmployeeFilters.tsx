import React, { useState } from 'react';
import { Search, Filter, Plus, ChevronDown, RotateCcw } from 'lucide-react';

import { CustomSelect } from '../common/CustomSelect';
import { useDropdowns } from '../../hooks/useDropdowns';

interface EmployeeFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  practice: string;
  onPracticeChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
  proficiency: string;
  onProficiencyChange: (value: string) => void;
  profileStatus: string;
  onProfileStatusChange: (value: string) => void;
  manager?: string;
  onManagerChange?: (value: string) => void;
  domain?: string;
  onDomainChange?: (value: string) => void;
  minExperience: number;
  onMinExperienceChange: (value: number) => void;
  onResetFilters: () => void;
  onAddEmployee: () => void;
}

export const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  search,
  onSearchChange,
  practice,
  onPracticeChange,
  location,
  onLocationChange,
  proficiency,
  onProficiencyChange,
  profileStatus,
  onProfileStatusChange,
  manager = 'All',
  onManagerChange,
  domain = 'All',
  onDomainChange,
  minExperience,
  onMinExperienceChange,
  onResetFilters,
  onAddEmployee,
}) => {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const { practices, locations, proficiencies, profileStatuses, domains, managers } = useDropdowns();

  const hasActiveFilters = 
    search !== '' || 
    practice !== 'All' || 
    location !== 'All' || 
    proficiency !== 'All' || 
    profileStatus !== 'All' || 
    (manager !== 'All' && manager !== '') ||
    (domain !== 'All' && domain !== '') ||
    minExperience > 0;

  return (
    <div className="space-y-3">
      {/* Primary filter bar with top labels matching the exact screenshot */}
      <div className="neumorph-card rounded-2xl p-4 flex flex-wrap items-end justify-between gap-3">
        
        {/* Search input */}
        <div className="flex-1 min-w-[240px] max-w-sm relative">
          <div className="relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search employees by name, ID, skills, manager..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFD] hover:bg-[#F1F5FD] focus:bg-white border border-[#DFE5EE] rounded-xl text-xs md:text-sm text-[#0B1B4D] placeholder-[#94A3B8] focus:outline-none focus:border-[#1265FF] transition-all"
            />
          </div>
        </div>

        {/* Dropdowns group with top labels */}
        <div className="flex flex-wrap items-end gap-2.5">
          {/* Practice */}
          <div className="flex flex-col space-y-1 min-w-[140px]">
            <label className="text-[11px] font-medium text-[#64748B] pl-0.5">
              Practice
            </label>
            <CustomSelect
              value={practice}
              onChange={onPracticeChange}
              options={[
                { value: 'All', label: 'All Practices' },
                ...practices.map((p) => ({ value: p, label: p }))
              ]}
              size="sm"
              allowOther={false}
            />
          </div>

          {/* Location */}
          <div className="flex flex-col space-y-1 min-w-[130px]">
            <label className="text-[11px] font-medium text-[#64748B] pl-0.5">
              Location
            </label>
            <CustomSelect
              value={location}
              onChange={onLocationChange}
              options={[
                { value: 'All', label: 'All Locations' },
                ...locations.map((loc) => ({ value: loc, label: loc }))
              ]}
              size="sm"
              allowOther={false}
            />
          </div>

          {/* Proficiency */}
          <div className="flex flex-col space-y-1 min-w-[120px]">
            <label className="text-[11px] font-medium text-[#64748B] pl-0.5">
              Proficiency
            </label>
            <CustomSelect
              value={proficiency}
              onChange={onProficiencyChange}
              options={[
                { value: 'All', label: 'All Levels' },
                ...proficiencies.map((lvl) => ({ value: lvl, label: lvl }))
              ]}
              size="sm"
              allowOther={false}
            />
          </div>

          {/* Profile Status */}
          <div className="flex flex-col space-y-1 min-w-[130px]">
            <label className="text-[11px] font-medium text-[#64748B] pl-0.5">
              Profile Status
            </label>
            <CustomSelect
              value={profileStatus}
              onChange={onProfileStatusChange}
              options={[
                { value: 'All', label: 'All Statuses' },
                ...profileStatuses.map((st) => ({ value: st, label: st }))
              ]}
              size="sm"
              allowOther={false}
            />
          </div>

          {/* More filters button */}
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className={`btn-shake-secondary inline-flex items-center gap-1.5 px-3.5 py-2 border rounded-full text-xs font-medium transition-colors shadow-2xs ${
              showMoreFilters || minExperience > 0 || (manager !== 'All' && manager !== '') || (domain !== 'All' && domain !== '')
                ? 'bg-blue-50 border-blue-200 text-[#016DD9]'
                : 'bg-white hover:bg-slate-50 border-[#E3EAF5] text-[#64748B]'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <span>More filters</span>
          </button>

          {/* Reset button if active */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="p-2 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Add Employee CTA */}
          <button
            onClick={onAddEmployee}
            className="btn-shake inline-flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Expanded extra filters */}
      {showMoreFilters && (
        <div className="bg-white rounded-2xl p-4 border border-[#E3EAF5] shadow-xs flex flex-wrap items-center gap-6 animate-in fade-in duration-150 text-xs">
          {/* Reporting Manager Filter */}
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-[#0B1B4D]">Reporting Manager:</span>
            <div className="w-48">
              <CustomSelect
                value={manager}
                onChange={onManagerChange || (() => {})}
                options={[
                  { value: 'All', label: 'All Managers' },
                  ...(managers && managers.length > 0
                    ? managers.map((m) => ({ value: m, label: m }))
                    : []),
                ]}
                size="sm"
                allowOther={false}
              />
            </div>
          </div>

          {/* Domain Expertise Filter */}
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-[#0B1B4D]">Domain Expertise:</span>
            <div className="w-44">
              <CustomSelect
                value={domain}
                onChange={onDomainChange || (() => {})}
                options={[
                  { value: 'All', label: 'All Domains' },
                  ...(domains || []).map((d) => ({ value: d, label: d })),
                ]}
                size="sm"
                allowOther={false}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#0B1B4D]">Min Experience:</span>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={minExperience}
              onChange={(e) => onMinExperienceChange(parseFloat(e.target.value))}
              className="accent-[#1265FF] cursor-pointer"
            />
            <span className="font-bold text-[#1265FF] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
              {minExperience > 0 ? `${minExperience} + Years` : 'Any Experience'}
            </span>
          </div>

          <div className="text-[#64748B]">
            Showing filtered records matching all specified criteria.
          </div>
        </div>
      )}
    </div>
  );
};
