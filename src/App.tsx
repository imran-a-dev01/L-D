import React, { useState, useEffect } from 'react';
import { LoginPage } from './pages/LoginPage';
import { SetupPage } from './pages/SetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateEmployeePage } from './pages/CreateEmployeePage';
import { SkillIntelligencePage } from './pages/SkillIntelligencePage';
import { TopNavbar } from './components/layout/TopNavbar';
import { Sidebar, NavigationItem } from './components/layout/Sidebar';
import { CommandPalette } from './components/common/CommandPalette';
import { EmployeeProfileModal } from './components/employees/EmployeeProfileModal';
import { ToastProvider, useToast } from './components/common/Toast';
import { Employee } from './types/employee';
import { TechnicalSkill } from './types/skill';
import { employeeService } from './services/employeeService';
import { skillService } from './services/skillService';
import { dropdownService } from './services/dropdownService';

import { api, UserProfile } from './services/api';

function AppContent() {
  const { toast } = useToast();
  
  // Auth & RBAC state from SQLite
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return api.getUser();
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!api.getToken() && !!api.getUser();
  });

  const [isSaving, setIsSaving] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  // Navigation state
  const [currentView, setCurrentView] = useState<'dashboard' | 'create-employee' | 'skills' | 'login'>('dashboard');
  const [activeSidebarItem, setActiveSidebarItem] = useState<NavigationItem>('overview');
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

  // Data states
  const [employees, setEmployees] = useState<Employee[]>(() => employeeService.getAll());
  const [selectedEmployeeForView, setSelectedEmployeeForView] = useState<Employee | null>(null);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  // Command palette state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Check if first-admin setup is needed
  useEffect(() => {
    api.getAuthStatus()
      .then(({ needsSetup: ns }) => setNeedsSetup(ns))
      .catch(() => setNeedsSetup(false));
  }, []);

  // Sync data from backend ONLY when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    employeeService.fetchAllFromBackend().then((data) => {
      if (data && data.length > 0) {
        setEmployees(data);
      }
    });
    dropdownService.fetchAll();
    skillService.fetchAllFromBackend();
  }, [isAuthenticated]);

  // Global keyboard shortcuts
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

  const handleLoginSuccess = (user: UserProfile) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setNeedsSetup(false);
    setCurrentView('dashboard');
    setActiveSidebarItem('overview');

    toast(`Welcome back, ${user.name}! (${user.roleName})`, 'success', 'Signed In');
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    api.logout();
    setCurrentView('login');
    toast('Signed out securely. See you soon!', 'info', 'Signed Out');
  };

  const handleResetData = () => {
    if (currentUser && currentUser.role !== 'SUPER_ADMIN') {
      toast('Only Super Administrators can reset the system', 'warning', 'Access Restricted');
      return;
    }
    if (!window.confirm('This will delete ALL employees and user accounts. The system will require a new administrator setup. Continue?')) {
      return;
    }
    employeeService.reset().then(() => {
      skillService.reset();
      api.logout();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setEmployees([]);
      setNeedsSetup(true);
      toast('System reset complete. Please set up a new administrator.', 'info', 'System Reset');
    });
  };

  const handleSidebarSelect = (item: NavigationItem) => {
    setActiveSidebarItem(item);
    setCurrentView('dashboard');
  };

  const handleSaveEmployee = async (emp: Employee) => {
    const isEdit = employees.some((e) => e.id === emp.id);

    // RBAC check
    if (!isEdit && currentUser && !currentUser.permissions.includes('employee:create')) {
      toast('Your role does not have permission to add employees', 'error', 'RBAC Restricted');
      return;
    }
    if (isEdit && currentUser && !currentUser.permissions.includes('employee:update')) {
      toast('Your role does not have permission to update employees', 'error', 'RBAC Restricted');
      return;
    }

    setIsSaving(true);
    try {
      const result = await employeeService.save(emp);
      if (result.success) {
        const freshData = await employeeService.fetchAllFromBackend();
        setEmployees(freshData);
        dropdownService.fetchAll();
        setEmployeeToEdit(null);
        setCurrentView('dashboard');
        setActiveSidebarItem('employee');

        if (isEdit) {
          toast(`Profile for "${emp.name}" (${emp.id}) updated in database!`, 'success', 'Profile Updated');
        } else {
          toast(`New employee "${emp.name}" (${emp.id}) added to database!`, 'success', 'Employee Added');
        }
      } else {
        toast(result.error || 'Failed to save employee profile', 'error', 'Save Failed');
      }
    } catch (err: any) {
      toast(err.message || 'Unexpected error saving employee', 'error', 'Save Failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    // RBAC check
    if (currentUser && !currentUser.permissions.includes('employee:delete')) {
      toast('Your role does not have permission to delete employee records', 'error', 'RBAC Restricted');
      return;
    }

    const empToDelete = employees.find((e) => e.id === id);
    const result = await employeeService.delete(id);
    if (result.success) {
      const freshData = await employeeService.fetchAllFromBackend();
      setEmployees(freshData);
      const empName = empToDelete ? `"${empToDelete.name}" (${id})` : `Employee ${id}`;
      toast(`${empName} removed from database`, 'info', 'Employee Removed');
    } else {
      toast(result.error || 'Failed to delete employee', 'error', 'Delete Failed');
    }
  };

  const handleEditEmployee = (emp: Employee) => {
    if (currentUser && !currentUser.permissions.includes('employee:update')) {
      toast('Your role does not have permission to edit employees', 'warning', 'RBAC Restricted');
      return;
    }
    setEmployeeToEdit(emp);
    setSelectedEmployeeForView(null);
    setCurrentView('create-employee');
  };

  // Collect all unique technical skills for the Technical Skills page
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
      skillService.fetchAllFromBackend();
      toast(`New skill "${newSkill.name}" (${newSkill.category}) registered to enterprise catalog!`, 'success', 'Skill Added');
    } catch (err: any) {
      toast(err.message || 'Failed to add skill', 'error', 'Error');
    }
  };

  const handleDeleteGlobalSkill = async (skillId: string) => {
    try {
      await api.deleteSkill(skillId);
      skillService.fetchAllFromBackend();
      toast('Skill removed from enterprise taxonomy catalog', 'info', 'Skill Removed');
    } catch (err: any) {
      toast(err.message || 'Failed to remove skill', 'error', 'Error');
    }
  };

  const mainRef = React.useRef<HTMLElement>(null);

  // Auto reset scroll position to top whenever changing views so headers are never clipped
  React.useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [currentView]);

  // Loading state while checking auth status
  if (needsSetup === null) {
    return (
      <div className="h-screen w-full bg-[#E8EDF4] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // First-admin setup required
  if (needsSetup && !isAuthenticated) {
    return <SetupPage onSetupComplete={handleLoginSuccess} />;
  }

  // Not authenticated — show login
  if (!isAuthenticated || currentView === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen w-full bg-[#E8EDF4] flex flex-col overflow-hidden font-['Inter',sans-serif]">
      {/* Global Top Navbar matching screenshots */}
      <TopNavbar
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        onNavigate={(view) => {
          if (view === 'login') {
            handleSignOut();
          } else {
            setCurrentView(view);
            if (view === 'dashboard') setActiveSidebarItem('overview');
          }
        }}
        onResetData={handleResetData}
        userName={currentUser?.name || 'Admin'}
        userRole={currentUser?.roleName || 'Super Administrator'}
        onToggleSidebar={handleToggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Layout Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden min-h-0 h-[calc(100vh-4rem)]">
        {/* Left Sidebar with collapse/expand & adjustable width capability */}
        <Sidebar
          activeItem={activeSidebarItem}
          onSelect={handleSidebarSelect}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          className="hidden md:flex"
        />

        {/* Dynamic Center/Right Page Area with Independent Middle Scroll */}
        <main ref={mainRef} className="flex-1 p-4 md:px-8 md:py-5 overflow-y-auto min-h-0 h-full max-w-[1600px] mx-auto w-full">
          <div key={currentView} className="animate-page-enter">
            {currentView === 'dashboard' && (
              <DashboardPage
                employees={employees}
                activeTab={activeSidebarItem}
                onAddEmployee={() => {
                  setEmployeeToEdit(null);
                  setCurrentView('create-employee');
                }}
                onViewEmployee={(emp) => setSelectedEmployeeForView(emp)}
                onEditEmployee={handleEditEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onExportCsv={(selected) => {
                  const targetList = selected || employees;
                  employeeService.exportCsv(targetList);
                  toast(`Exported ${targetList.length} employee records to CSV file!`, 'success', 'Export Complete');
                }}
                onNavigateToSkills={() => {
                  setCurrentView('skills');
                }}
              />
            )}

            {currentView === 'create-employee' && (
              <CreateEmployeePage
                initialEmployee={employeeToEdit}
                existingIds={employees.map((e) => e.id)}
                onSave={handleSaveEmployee}
                onCancel={() => {
                  setEmployeeToEdit(null);
                  setCurrentView('dashboard');
                  setActiveSidebarItem('employee');
                }}
                isSaving={isSaving}
              />
            )}

            {currentView === 'skills' && (
              <SkillIntelligencePage
                skills={allCorporateSkills}
                onAddSkill={handleAddGlobalSkill}
                onDeleteSkill={handleDeleteGlobalSkill}
                onEditSkill={() => toast('Standardized skill taxonomy template opened for review', 'info', 'Skill Template')}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        employees={employees}
        onSelectEmployee={(emp) => setSelectedEmployeeForView(emp)}
        onNavigate={(view) => {
          if (view === 'login') {
            handleSignOut();
          } else {
            setCurrentView(view);
            if (view === 'dashboard') setActiveSidebarItem('overview');
          }
        }}
      />

      {/* Employee Detail Modal */}
      <EmployeeProfileModal
        employee={selectedEmployeeForView}
        isOpen={!!selectedEmployeeForView}
        onClose={() => setSelectedEmployeeForView(null)}
        onEdit={handleEditEmployee}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
