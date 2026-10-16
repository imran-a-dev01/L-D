import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Layers, 
  Target 
} from 'lucide-react';
import { Employee } from '../types/employee';
import { NavigationItem } from '../components/layout/Sidebar';
import { KpiCard } from '../components/dashboard/KpiCard';
import { SkillCoverageCard } from '../components/dashboard/SkillCoverageCard';
import { EmployeeFilters } from '../components/dashboard/EmployeeFilters';
import { EmployeeTable } from '../components/dashboard/EmployeeTable';
import { TotalEmployeesModal } from '../components/dashboard/TotalEmployeesModal';
import { ProfilesCompleteModal } from '../components/dashboard/ProfilesCompleteModal';
import { ExportDataModal } from '../components/dashboard/ExportDataModal';
import { ProfileCompleteView } from '../components/dashboard/ProfileCompleteView';
import { useToast } from '../components/common/Toast';
import { api, AnalyticsResponse } from '../services/api';

interface DashboardPageProps {
  employees: Employee[];
  activeTab?: NavigationItem;
  onAddEmployee: () => void;
  onViewEmployee: (emp: Employee) => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (empId: string) => void;
  onExportCsv: (selected?: Employee[]) => void;
  onNavigateToSkills: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  employees,
  activeTab = 'overview',
  onAddEmployee,
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

  // KPI Modal states
  const [isTotalEmployeesModalOpen, setIsTotalEmployeesModalOpen] = useState(false);
  const [isProfilesCompleteModalOpen, setIsProfilesCompleteModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedForExport, setSelectedForExport] = useState<Employee[]>([]);

  // Live analytics state from SQLite DB
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [dbFilteredEmployees, setDbFilteredEmployees] = useState<Employee[] | null>(null);

  // Sync live KPI metrics from SQLite database
  useEffect(() => {
    api.getAnalytics()
      .then(setAnalytics)
      .catch((err) => console.warn('Could not fetch SQLite analytics:', err));
  }, [employees]);

  // Server-side SQLite query on search/filters
  useEffect(() => {
    const hasFilter =
      search.trim() !== '' ||
      practice !== 'All' ||
      location !== 'All' ||
      proficiency !== 'All' ||
      profileStatus !== 'All' ||
      manager !== 'All' ||
      domain !== 'All' ||
      minExperience > 0;

    if (!hasFilter) {
      setDbFilteredEmployees(null);
      return;
    }

    const timer = setTimeout(() => {
      api
        .getEmployees({
          search: search.trim() || undefined,
          practice: practice !== 'All' ? practice : undefined,
          location: location !== 'All' ? location : undefined,
          proficiency: proficiency !== 'All' ? proficiency : undefined,
          profileStatus: profileStatus !== 'All' ? profileStatus : undefined,
          manager: manager !== 'All' ? manager : undefined,
          domain: domain !== 'All' ? domain : undefined,
          minExperience: minExperience > 0 ? minExperience : undefined,
        })
        .then(({ employees: backendEmps }) => {
          setDbFilteredEmployees(backendEmps);
        })
        .catch((err) => {
          console.warn('Backend SQLite search failed, falling back to local dataset:', err);
        });
    }, 150);

    return () => clearTimeout(timer);
  }, [search, practice, location, proficiency, profileStatus, manager, domain, minExperience]);

  // Filter employees fallback
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search term
      if (search.trim() !== '') {
        const q = search.toLowerCase();
        const matchesName = emp.name.toLowerCase().includes(q);
        const matchesId = emp.id.toLowerCase().includes(q);
        const matchesRole = emp.designation.toLowerCase().includes(q);
        const matchesSkill = emp.technicalSkills.some((s) => s.name.toLowerCase().includes(q));
        const matchesDomain = emp.domainExpertise && emp.domainExpertise.some((de) =>
          de.domain.toLowerCase().includes(q) ||
          (de.customDomain && de.customDomain.toLowerCase().includes(q))
        );
        const matchesManager = emp.reportingManager && emp.reportingManager.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesRole && !matchesSkill && !matchesDomain && !matchesManager) return false;
      }

      // Practice
      if (practice !== 'All' && !emp.businessUnit.toLowerCase().includes(practice.toLowerCase())) {
        return false;
      }

      // Location
      if (location !== 'All' && emp.location !== location) {
        return false;
      }

      // Profile Status
      if (profileStatus !== 'All' && emp.status !== profileStatus) {
        return false;
      }

      // Manager
      if (manager !== 'All' && emp.reportingManager !== manager) {
        return false;
      }

      // Proficiency
      if (proficiency !== 'All') {
        const hasProficiency = emp.technicalSkills.some((s) => s.proficiency === proficiency);
        if (!hasProficiency) return false;
      }

      // Domain Expertise
      if (domain !== 'All') {
        const hasDomain = emp.domainExpertise && emp.domainExpertise.some((de) =>
          de.domain.toLowerCase() === domain.toLowerCase() ||
          (de.customDomain && de.customDomain.toLowerCase() === domain.toLowerCase())
        );
        if (!hasDomain) return false;
      }

      // Min Experience
      if (minExperience > 0 && emp.totalExperience < minExperience) {
        return false;
      }

      return true;
    });
  }, [employees, search, practice, location, proficiency, profileStatus, manager, domain, minExperience]);

  const activeEmployees = dbFilteredEmployees !== null ? dbFilteredEmployees : filteredEmployees;

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

  const isEmployeeTab = activeTab === 'employee' || activeTab === 'directory';

  return (
    <div className="space-y-6">
      {/* Top Banner Card with header.mp4 video background */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-[#DFE5EE] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden min-h-[105px]">
        {/* Background Video: header.mp4 */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center z-0 pointer-events-none"
          src="/header.mp4"
        />

        {/* Soft gradient fade on the left to ensure crisp text legibility while keeping video clearly visible */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/75 via-white/35 to-transparent z-1 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="text-xs font-semibold text-[#64748B] flex items-center gap-2 mb-2">
            <span>Home</span>
            <span className="text-slate-300">›</span>
            <span className="text-[#016DD9] font-medium">
              {isEmployeeTab ? 'Employee' : 'Overview'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B1B4D] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            {isEmployeeTab ? 'Employee Directory' : 'Good afternoon, Admin'}
          </h1>
        </div>
      </div>

      {/* Onboarding card when no employees exist */}
      {employees.length === 0 && !isEmployeeTab && (
        <div className="bg-white rounded-2xl p-8 border border-dashed border-[#016DD9]/30 shadow-sm text-center animate-reveal-1">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#016DD9] border border-blue-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">
            Welcome to NEXUS L&D
          </h2>
          <p className="text-sm text-[#64748B] mt-2 max-w-md mx-auto">
            Your workforce directory is empty. Add your first employee to start building your enterprise skills intelligence.
          </p>
          <button
            onClick={onAddEmployee}
            className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 bg-[#016DD9] hover:bg-[#005bb8] text-white font-bold text-sm rounded-full shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Users className="w-4 h-4" />
            Add First Employee
          </button>
        </div>
      )}

      {/* Top Cards Row (Shown on Overview tab) */}
      {!isEmployeeTab && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-reveal-1">
          <KpiCard
            title="Total Employees"
            value={analytics ? analytics.totalEmployees : employees.length}
            trend={analytics?.trend?.employees || '—'}
            trendUp={true}
            subtitle="Active enterprise workforce directory"
            icon={Users}
            iconBgColor="bg-blue-50/80 border border-blue-100"
            iconTextColor="text-[#016DD9]"
            cardBg="bg-white"
            cardBorder="border-[#DFE5EE]"
            onClick={() => setIsTotalEmployeesModalOpen(true)}
          />

          <KpiCard
            title="Profiles Complete"
            value={analytics ? `${analytics.completionRate}%` : '—'}
            trend={analytics?.trend?.completion || '—'}
            trendUp={true}
            subtitle={
              analytics
                ? `${analytics.verifiedCount} of ${analytics.totalEmployees} profiles verified`
                : 'Loading...'
            }
            icon={FileText}
            iconBgColor="bg-emerald-50/80 border border-emerald-100"
            iconTextColor="text-emerald-600"
            cardBg="bg-white"
            cardBorder="border-[#DFE5EE]"
            onClick={() => setIsProfilesCompleteModalOpen(true)}
          />

          <SkillCoverageCard
            data={analytics?.skillCoverage}
            onViewInsights={onNavigateToSkills}
          />
        </div>
      )}

      {/* Horizontal Filter Bar matching Screenshot */}
      <div className="animate-reveal-2">
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
          onAddEmployee={onAddEmployee}
        />
      </div>

      {/* Dense Data Grid Table matching exact Screenshot */}
      <div className="animate-reveal-3">
        <EmployeeTable
          employees={activeEmployees}
          onViewEmployee={onViewEmployee}
          onEditEmployee={onEditEmployee}
          onDeleteEmployee={onDeleteEmployee}
          onExportCsv={(selected) => {
            setSelectedForExport(selected || []);
            setIsExportModalOpen(true);
          }}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* Total Employees Directory Modal */}
      <TotalEmployeesModal
        isOpen={isTotalEmployeesModalOpen}
        onClose={() => setIsTotalEmployeesModalOpen(false)}
        employees={employees}
        onViewEmployee={onViewEmployee}
      />

      {/* Profiles Complete Intelligence Modal */}
      <ProfilesCompleteModal
        isOpen={isProfilesCompleteModalOpen}
        onClose={() => setIsProfilesCompleteModalOpen(false)}
        employees={employees}
        onViewEmployee={onViewEmployee}
      />

      {/* Multi-Scope Interactive Export Modal */}
      <ExportDataModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        employees={employees}
        selectedEmployees={selectedForExport}
      />
    </div>
  );
};
