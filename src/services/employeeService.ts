import { Employee } from '../types/employee';
import { api } from './api';

const STORAGE_KEY = 'nexus_employees_v4';

export interface SaveResult {
  success: boolean;
  employee?: Employee;
  error?: string;
}

export const employeeService = {
  getAll(): Employee[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading employees from localStorage', e);
    }
    return [];
  },

  async fetchAllFromBackend(): Promise<Employee[]> {
    try {
      const { employees } = await api.getEmployees();
      if (employees && employees.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
        return employees;
      }
    } catch (err) {
      console.warn('Backend unavailable, falling back to local cache:', err);
    }
    return this.getAll();
  },

  getById(id: string): Employee | undefined {
    const list = this.getAll();
    return list.find((emp) => emp.id.toLowerCase() === id.toLowerCase());
  },

  async save(employee: Employee): Promise<SaveResult> {
    const list = this.getAll();
    const existingIndex = list.findIndex((e) => e.id.toLowerCase() === employee.id.toLowerCase());
    const isEdit = existingIndex >= 0;

    employee.profileCompletion = this.calculateCompletion(employee);
    employee.status = employee.profileCompletion >= 85 ? 'Complete' : (employee.profileCompletion >= 65 ? 'In Progress' : 'Needs Review');
    employee.updatedAt = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    try {
      let savedEmployee: Employee;
      if (isEdit) {
        const response = await api.updateEmployee(employee.id, employee);
        savedEmployee = response.employee;
      } else {
        const response = await api.createEmployee(employee);
        savedEmployee = response.employee;
      }

      if (isEdit) {
        list[existingIndex] = savedEmployee;
      } else {
        list.unshift(savedEmployee);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return { success: true, employee: savedEmployee };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to save employee to database' };
    }
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.deleteEmployee(id);
      const list = this.getAll().filter((emp) => emp.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete employee from database' };
    }
  },

  async reset(): Promise<Employee[]> {
    try {
      await api.resetEmployees();
      const { employees } = await api.getEmployees();
      if (employees) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
        return employees;
      }
    } catch (err) {
      console.warn('Could not reset SQLite backend:', err);
    }
    return this.getAll();
  },

  calculateCompletion(emp: Partial<Employee>): number {
    let score = 0;
    const max = 10;

    if (emp.id && emp.name) score += 2;
    if (emp.email) score += 1;
    if (emp.designation) score += 1;
    if (emp.businessUnit) score += 1;
    if (emp.reportingManager) score += 1;
    if (emp.currentProject) score += 1;
    if (emp.location) score += 1;
    if (emp.deployableRoles && emp.deployableRoles.length > 0) score += 1;
    if (emp.technicalSkills && emp.technicalSkills.length > 0) score += 1;

    return Math.min(100, Math.round((score / max) * 100));
  },

  exportCsv(list: Employee[], customFilename?: string) {
    const headers = [
      'Employee ID',
      'Name',
      'Email',
      'Designation',
      'Business Unit',
      'Reporting Manager',
      'Current Project',
      'Current Customer',
      'Location',
      'Total Experience',
      'Current Role',
      'OwlSure Designation',
      'Profile Completion',
      'Status',
      'Deployable Roles',
      'Technical Skills',
      'Domain Expertise',
      'Updated At',
    ];

    const rows = list.map((emp) => [
      `"${emp.id}"`,
      `"${emp.name}"`,
      `"${emp.email}"`,
      `"${emp.designation}"`,
      `"${emp.businessUnit}"`,
      `"${emp.reportingManager}"`,
      `"${emp.currentProject || ''}"`,
      `"${emp.currentCustomer || ''}"`,
      `"${emp.location}"`,
      emp.totalExperience,
      `"${emp.currentRole}"`,
      `"${emp.owlSureDesignation}"`,
      `"${emp.profileCompletion}%"`,
      `"${emp.status}"`,
      `"${(emp.deployableRoles || []).join('; ')}"`,
      `"${(emp.technicalSkills || []).map((s) => `${s.name} (${s.proficiency})`).join('; ')}"`,
      `"${(emp.domainExpertise || []).map((d) => `${d.domain === 'Others' ? d.customDomain || 'Others' : d.domain} (${d.experienceYears}y - ${d.proficiency})`).join('; ')}"`,
      `"${emp.updatedAt}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', customFilename || `nexus_workforce_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportJson(list: Employee[], customFilename?: string) {
    const jsonStr = JSON.stringify(list, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', customFilename || `nexus_workforce_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
