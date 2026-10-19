import React, { useState, useMemo, useEffect } from 'react';
import { Users, Copy } from 'lucide-react';
import { Employee } from '../types/employee';
import { NavigationItem } from '../components/layout/Sidebar';
import { EmployeeFilters } from '../components/dashboard/EmployeeFilters';
import { EmployeeTable } from '../components/dashboard/EmployeeTable';
import { ExportDataModal, ActiveFilterChip } from '../components/dashboard/ExportDataModal';
import { ProfileCompleteView } from '../components/dashboard/ProfileCompleteView';
import { PageHeader } from '../components/layout/PageHeader';
import { useToast } from '../components/common/Toast';
import { 
  getFilterOptions, 
  applyEmployeeFilters, 
  normalizeText 
} from '../lib/employeeFilters';

interface DashboardPageProps {
  employees: Employee[];
  activeTab?: NavigationItem;
  onViewEmployee: (emp: Employee) => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (empId: string) => void;
  onExportCsv: (selected?: Employee[]) => void;
  onNavigateToSkills?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  employees,
  activeTab = 'overview',
  onViewEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onExportCsv,
  onNavigateToSkills,
}) => {
  // Filters state
  const [search, setSearch] = useState('');
  const [practice, setPractice] = useState('All');
  const [location, setLocation] = useState('All');
  const [proficiency, setProficiency] = useState('All');
  const [profileStatus, setProfileStatus] = useState('All');
  const [manager, setManager] = useState('All');
  const [domain, setDomain] = useState('All');
  const [minExperience, setMinExperience] = useState<number>(0);

  // Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedForExport, setSelectedForExport] = useState<Employee[]>([]);

  // 1. Derive filter options from active employee records
  const filterOptions = useMemo(() => getFilterOptions(employees), [employees]);

  // 2. Auto-reset selected filter to 'All' if the value no longer exists in options
  useEffect(() => {
    if (practice !== 'All' && !filterOptions.practices.some((p) => normalizeText(p) === normalizeText(practice))) {
      setPractice('All');
    }
    if (location !== 'All' && !filterOptions.locations.some((l) => normalizeText(l) === normalizeText(location))) {
      setLocation('All');
    }
    if (manager !== 'All' && !filterOptions.managers.some((m) => m.key === manager)) {
      setManager('All');
    }
    if (domain !== 'All' && !filterOptions.domains.some((d) => normalizeText(d) === normalizeText(domain))) {
      setDomain('All');
    }
  }, [filterOptions, practice, location, manager, domain]);

  // 3. Single source of truth: filter employees client-side
  const filteredEmployees = useMemo(() => {
    return applyEmployeeFilters(employees, {
      search,
      practice,
      location,
      proficiency,
      profileStatus,
      managerKey: manager,
      domain,
      minExperience,
    });
  }, [employees, search, practice, location, proficiency, profileStatus, manager, domain, minExperience]);

  const activeEmployees = filteredEmployees;

  // Active Level 1 filter chips for Export Modal info line
  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    if (selectedForExport.length > 0) {
      chips.push({ label: 'Selection', value: `${selectedForExport.length} selected rows` });
    }
    if (search.trim()) chips.push({ label: 'Search', value: `"${search.trim()}"` });
    if (practice !== 'All') chips.push({ label: 'Practice', value: practice });
    if (location !== 'All') chips.push({ label: 'Location', value: location });
    if (proficiency !== 'All') chips.push({ label: 'Proficiency', value: proficiency });
    if (profileStatus !== 'All') chips.push({ label: 'Status', value: profileStatus });
    if (manager !== 'All' && manager !== '') {
      const selectedMgr = filterOptions.managers.find((m) => m.key === manager);
      chips.push({ label: 'Manager', value: selectedMgr ? selectedMgr.label : manager });
    }
    if (domain !== 'All' && domain !== '') chips.push({ label: 'Domain', value: domain });
    if (minExperience > 0) chips.push({ label: 'Experience', value: `${minExperience}+ years` });
    return chips;
  }, [selectedForExport, search, practice, location, proficiency, profileStatus, manager, domain, minExperience, filterOptions]);

  // Base employee list for Export (Level 1 filtered list or checked rows)
  const baseExportEmployees = useMemo(() => {
    return selectedForExport.length > 0 ? selectedForExport : activeEmployees;
  }, [selectedForExport, activeEmployees]);

  const { toast } = useToast();

  const handleResetFilters = () => {
    setSearch('');
    setPractice('All');
    setLocation('All');
    setProficiency('All');
    setProfileStatus('All');
    setManager('All');
    setDomain('All');
    setMinExperience(0);
    setSelectedForExport([]);
    toast('All workforce directory filters cleared', 'info', 'Filters Cleared');
  };

  // If Profile Complete view is selected from sidebar
  if (activeTab === 'profile-complete') {
    return (
      <div className="animate-in fade-in duration-200">
        <ProfileCompleteView
          employees={employees}
          onViewEmployee={onViewEmployee}
          onEditEmployee={onEditEmployee}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unified Page Header: Reusable Breadcrumb + Heading */}
      <PageHeader title="Overview" />

      {/* Onboarding card when no employees exist */}
      {employees.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-dashed border-[#016DD9]/30 shadow-sm text-center animate-reveal-1">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#016DD9] border border-blue-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">
            No employee profiles yet
          </h2>
          <p className="text-sm text-[#64748B] mt-2 max-w-md mx-auto">
            Profiles appear here as soon as employees submit them.
          </p>
          <button
            onClick={() => {
              const url = window.location.origin + '/';
              navigator.clipboard?.writeText(url);
              toast('Employee form link copied to clipboard!', 'success', 'Link Copied');
            }}
            className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 bg-[#016DD9] hover:bg-[#005bb8] text-white font-bold text-sm rounded-full shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            <span>Copy employee form link</span>
          </button>
        </div>
      )}

      {/* Horizontal Filter Bar */}
      <div className="animate-reveal-1">
        <EmployeeFilters
          search={search}
          onSearchChange={setSearch}
          practice={practice}
          onPracticeChange={setPractice}
          location={location}
          onLocationChange={setLocation}
          proficiency={proficiency}
          onProficiencyChange={setProficiency}
          profileStatus={profileStatus}
          onProfileStatusChange={setProfileStatus}
          manager={manager}
          onManagerChange={setManager}
          domain={domain}
          onDomainChange={setDomain}
          minExperience={minExperience}
          onMinExperienceChange={setMinExperience}
          onResetFilters={handleResetFilters}
          practices={filterOptions.practices}
          locations={filterOptions.locations}
          managers={filterOptions.managers}
          domains={filterOptions.domains}
        />
      </div>

      {/* Dense Data Grid Table */}
      <div className="animate-reveal-2">
        <EmployeeTable
          employees={activeEmployees}
          onViewEmployee={onViewEmployee}
          onEditEmployee={onEditEmployee}
          onDeleteEmployee={onDeleteEmployee}
          onExportCsv={(selected) => {
            setSelectedForExport(selected && selected.length > 0 ? selected : []);
            setIsExportModalOpen(true);
          }}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* Multi-Scope Interactive Export Modal */}
      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setSelectedForExport([]);
        }}
        employees={baseExportEmployees}
        selectedEmployees={selectedForExport}
        activeFilterChips={activeFilterChips}
      />
    </div>
  );
};
