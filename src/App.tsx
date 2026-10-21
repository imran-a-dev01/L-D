import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { EmployeeProfilePage } from './pages/EmployeeProfilePage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SkillCoveragePage } from './pages/SkillCoveragePage';
import { SkillIntelligencePage } from './pages/SkillIntelligencePage';
import { AdminEditPage } from './pages/AdminEditPage';
import { TopNavbar } from './components/layout/TopNavbar';
import { Sidebar, NavigationItem } from './components/layout/Sidebar';
import { PageContainer } from './components/layout/PageContainer';
import { CommandPalette } from './components/common/CommandPalette';
import { EmployeeProfileModal } from './components/employees/EmployeeProfileModal';
import { TotalEmployeesModal } from './components/dashboard/TotalEmployeesModal';
import { ProfilesCompleteModal } from './components/dashboard/ProfilesCompleteModal';
import { ToastProvider, useToast } from './components/common/Toast';
import { Employee } from './types/employee';
import { TechnicalSkill } from './types/skill';
import { employeeService } from './services/employeeService';
import { skillService } from './services/skillService';
import { dropdownService } from './services/dropdownService';
import { api, AnalyticsResponse, UserProfile } from './services/api';

function AdminLayout({ onLogout }: { onLogout: () => void }) {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('nexus_sidebar_collapsed') === 'true';
  });

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('nexus_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Determine active sidebar item from current route path
  const activeSidebarItem = React.useMemo<NavigationItem>(() => {
    const p = location.pathname;
    if (p === '/admin/profile-complete') return 'profile-complete';
    if (p === '/admin/skill-coverage') return 'skill-coverage';
    if (p === '/admin/skills') return 'skills';
    return 'overview';
  }, [location.pathname]);

  // Data states (backend is single source of truth)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Modals state
  const [selectedEmployeeForView, setSelectedEmployeeForView] = useState<Employee | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTotalEmployeesModalOpen, setIsTotalEmployeesModalOpen] = useState(false);
  const [isProfilesCompleteModalOpen, setIsProfilesCompleteModalOpen] = useState(false);

  // Reference to main element for scroll reset
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Primary data fetcher from backend
  const fetchEmployeesFromBackend = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setLoadError(null);
    } else {
      setIsRefreshing(true);
    }

    try {
      const freshEmployees = await employeeService.fetchAllFromBackend();
      
      // Update state only if data actually changed to prevent flicker & maintain UI scroll
      setEmployees((prev) => {
        const prevJson = JSON.stringify(prev);
        const freshJson = JSON.stringify(freshEmployees);
        if (prevJson !== freshJson) {
          return freshEmployees;
        }
        return prev;
      });

      // Update analytics
      api.getAnalytics()
        .then(setAnalytics)
        .catch((err) => console.warn('Could not refresh analytics:', err));

      // Refresh master dropdowns in background
      dropdownService.fetchAll().catch(() => {});
      skillService.fetchAllFromBackend().catch(() => {});

      setLoadError(null);
    } catch (err: any) {
      console.error('Error fetching employees from backend:', err);
      if (!silent) {
        setLoadError(err.message || 'Failed to connect to backend server.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch immediately on entering admin area
  useEffect(() => {
    fetchEmployeesFromBackend(false);
  }, [fetchEmployeesFromBackend]);

  // Auto-refetch: every 30s while visible, and immediately on tab focus or visibilitychange
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchEmployeesFromBackend(true);
      }
    }, 30000);

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchEmployeesFromBackend(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchEmployeesFromBackend(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchEmployeesFromBackend]);

  // Global keyboard shortcuts (Ctrl+B sidebar toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Actions
  const handleSidebarSelect = (item: NavigationItem, path?: string) => {
    if (path) {
      navigate(path);
    } else {
      if (item === 'overview') navigate('/admin');
      else if (item === 'profile-complete') navigate('/admin/profile-complete');
      else if (item === 'skill-coverage') navigate('/admin/skill-coverage');
      else if (item === 'skills') navigate('/admin/skills');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    const empToDelete = employees.find((e) => e.id === id);
    const result = await employeeService.delete(id);
    if (result.success) {
      await fetchEmployeesFromBackend(true);
      const empName = empToDelete ? `"${empToDelete.name}" (${id})` : `Employee ${id}`;
      toast(`${empName} removed from database`, 'info', 'Employee Removed');
    } else {
      toast(result.error || 'Failed to delete employee', 'error', 'Delete Failed');
    }
  };

  const handleEditEmployee = (emp: Employee) => {
    setSelectedEmployeeForView(null);
    navigate(`/admin/employees/${encodeURIComponent(emp.id)}/edit`);
  };

  // Collect unique technical skills for the Technical Skills matrix
  const allCorporateSkills = React.useMemo(() => {
    const skillMap = new Map<string, TechnicalSkill>();
    employees.forEach((emp) => {
      emp.technicalSkills.forEach((s) => {
        const key = `${s.category}_${s.name.toLowerCase()}`;
        if (!skillMap.has(key)) {
          skillMap.set(key, s);
        }
      });
    });
    return Array.from(skillMap.values());
  }, [employees]);

  const handleAddGlobalSkill = async (newSkill: TechnicalSkill) => {
    try {
      await api.createSkill({ name: newSkill.name, category: newSkill.category, description: newSkill.specialization || '' });
      await skillService.fetchAllFromBackend();
      toast(`New skill "${newSkill.name}" (${newSkill.category}) registered to enterprise catalog!`, 'success', 'Skill Added');
    } catch (err: any) {
      toast(err.message || 'Failed to add skill', 'error', 'Error');
    }
  };

  const handleDeleteGlobalSkill = async (skillId: string) => {
    try {
      await api.deleteSkill(skillId);
      await skillService.fetchAllFromBackend();
      toast('Skill removed from enterprise taxonomy catalog', 'info', 'Skill Removed');
    } catch (err: any) {
      toast(err.message || 'Failed to remove skill', 'error', 'Error');
    }
  };

  // Computed KPI counts
  const totalEmployeesCount = analytics ? analytics.totalEmployees : employees.length;
  const verifiedCount = analytics
    ? analytics.verifiedCount
    : employees.filter((e) => e.profileCompletion >= 80 || e.status === 'Complete').length;
  const completionRate = analytics
    ? analytics.completionRate
    : employees.length > 0
    ? Math.round(employees.reduce((acc, curr) => acc + curr.profileCompletion, 0) / employees.length)
    : 0;

  return (
    <div className="h-screen w-full bg-[#E8EDF4] flex flex-col overflow-hidden font-['Inter',sans-serif]">
      {/* Top Navbar */}
      <TopNavbar
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        onToggleSidebar={handleToggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
        totalEmployees={totalEmployeesCount}
        completionRate={completionRate}
        verifiedCount={verifiedCount}
        onOpenTotalEmployeesModal={() => setIsTotalEmployeesModalOpen(true)}
        onOpenProfilesCompleteModal={() => setIsProfilesCompleteModalOpen(true)}
        onLogout={onLogout}
      />

      {/* Main Layout Container: Sidebar + Middle Scroll Content */}
      <div className="flex-1 flex overflow-hidden min-h-0 h-[calc(100vh-4rem)]">
        <Sidebar
          activeItem={activeSidebarItem}
          onSelect={handleSidebarSelect}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          className="hidden md:flex"
        />

        <main ref={mainRef} className="flex-1 overflow-y-auto min-h-0 h-full w-full">
          <PageContainer className="py-4 md:py-5">
            {/* Initial Loading Skeleton */}
            {isLoading && employees.length === 0 && (
              <div className="space-y-6 animate-pulse py-4">
                <div className="h-10 w-48 bg-white/70 rounded-xl" />
                <div className="h-28 w-full bg-white/70 rounded-2xl" />
                <div className="h-96 w-full bg-white/70 rounded-3xl" />
              </div>
            )}

            {/* Error State with Retry Button */}
            {!isLoading && loadError && employees.length === 0 && (
              <div className="my-16 max-w-md mx-auto bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#0B1B4D]">Unable to Load Workforce Data</h3>
                <p className="text-xs text-[#64748B]">{loadError}</p>
                <button
                  type="button"
                  onClick={() => fetchEmployeesFromBackend(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1265FF] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry connection</span>
                </button>
              </div>
            )}

            {/* Active Admin Routes */}
            {(!isLoading || employees.length > 0) && (!loadError || employees.length > 0) && (
              <Routes>
                {/* Route: /admin (Overview) */}
                <Route
                  index
                  element={
                    <DashboardPage
                      employees={employees}
                      activeTab="overview"
                      onViewEmployee={(emp) => setSelectedEmployeeForView(emp)}
                      onEditEmployee={handleEditEmployee}
                      onDeleteEmployee={handleDeleteEmployee}
                      onExportCsv={async (selected) => {
                        const targetList = selected || employees;
                        try {
                          await employeeService.exportXlsx(targetList);
                          toast(`Exported ${targetList.length} employee records to Excel file!`, 'success', 'Export Complete');
                        } catch (err: any) {
                          toast(err?.message || 'Failed to export', 'error', 'Export Failed');
                        }
                      }}
                      onNavigateToSkills={() => navigate('/admin/skill-coverage')}
                    />
                  }
                />

                {/* Route: /admin/employees -> redirects to Overview (/admin) */}
                <Route path="employees" element={<Navigate to="/admin" replace />} />

                {/* Route: /admin/profile-complete */}
                <Route
                  path="profile-complete"
                  element={
                    <DashboardPage
                      employees={employees}
                      activeTab="profile-complete"
                      onViewEmployee={(emp) => setSelectedEmployeeForView(emp)}
                      onEditEmployee={handleEditEmployee}
                      onDeleteEmployee={handleDeleteEmployee}
                      onExportCsv={async (selected) => {
                        const targetList = selected || employees;
                        try {
                          await employeeService.exportXlsx(targetList);
                          toast(`Exported ${targetList.length} employee records to Excel file!`, 'success', 'Export Complete');
                        } catch (err: any) {
                          toast(err?.message || 'Failed to export', 'error', 'Export Failed');
                        }
                      }}
                      onNavigateToSkills={() => navigate('/admin/skill-coverage')}
                    />
                  }
                />

                {/* Route: /admin/skill-coverage */}
                <Route
                  path="skill-coverage"
                  element={
                    <SkillCoveragePage
                      employees={employees}
                      analytics={analytics}
                      onNavigateHome={() => navigate('/admin')}
                      onNavigateToSkills={() => navigate('/admin/skills')}
                      onViewEmployee={(emp) => setSelectedEmployeeForView(emp)}
                    />
                  }
                />

                {/* Route: /admin/skills */}
                <Route
                  path="skills"
                  element={
                    <SkillIntelligencePage
                      skills={allCorporateSkills}
                      onAddSkill={handleAddGlobalSkill}
                      onDeleteSkill={handleDeleteGlobalSkill}
                      onEditSkill={() => toast('Standardized skill taxonomy template opened for review', 'info', 'Skill Template')}
                    />
                  }
                />

                {/* Route: /admin/employees/:id/edit */}
                <Route
                  path="employees/:id/edit"
                  element={
                    <AdminEditPage
                      employees={employees}
                      onEmployeeSaved={() => fetchEmployeesFromBackend(true)}
                    />
                  }
                />

                {/* Catch-all redirect to /admin */}
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            )}
          </PageContainer>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        employees={employees}
        onSelectEmployee={(emp) => setSelectedEmployeeForView(emp)}
        onNavigate={(path) => navigate(path)}
      />

      {/* Employee Detail Modal */}
      <EmployeeProfileModal
        employee={selectedEmployeeForView}
        isOpen={!!selectedEmployeeForView}
        onClose={() => setSelectedEmployeeForView(null)}
        onEdit={handleEditEmployee}
      />

      {/* Total Employees Directory Modal */}
      <TotalEmployeesModal
        isOpen={isTotalEmployeesModalOpen}
        onClose={() => setIsTotalEmployeesModalOpen(false)}
        employees={employees}
        onViewEmployee={(emp) => setSelectedEmployeeForView(emp)}
      />

      {/* Profiles Complete Intelligence Modal */}
      <ProfilesCompleteModal
        isOpen={isProfilesCompleteModalOpen}
        onClose={() => setIsProfilesCompleteModalOpen(false)}
        employees={employees}
        onViewEmployee={(emp) => setSelectedEmployeeForView(emp)}
      />
    </div>
  );
}

function AdminGate() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem('nexus_user');
    const token = localStorage.getItem('nexus_token');
    if (stored && token) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    localStorage.setItem('nexus_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    api.logout();
    localStorage.removeItem('nexus_user');
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminLayout onLogout={handleLogout} />;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Employee Skill Profile Form */}
          <Route path="/" element={<EmployeeProfilePage />} />

          {/* Admin Dashboard Routes — auth gated */}
          <Route path="/admin/*" element={<AdminGate />} />

          {/* Catch-all unknown paths redirect to / */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
