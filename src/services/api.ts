import { Employee } from '../types/employee';
import { CatalogSkill } from '../types/skill';

const API_BASE = '/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'LND_ADMIN' | 'PRACTICE_LEAD' | 'EMPLOYEE';
  roleName: string;
  employeeId?: string | null;
  permissions: string[];
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export interface SkillCoverageItem {
  label: string;
  percentage: number;
  count: number;
  barColor: string;
}

export interface AnalyticsResponse {
  totalEmployees: number;
  verifiedCount: number;
  completionRate: number;
  skillCoverage: SkillCoverageItem[];
  trend: {
    employees: string;
    completion: string;
  };
}

export interface DropdownOptionsResponse {
  practices: string[];
  businessUnits: string[];
  locations: string[];
  designations: string[];
  currentRoles: string[];
  deployableRoles: string[];
  projects: string[];
  customers: string[];
  managers: string[];
  skillCategories: string[];
  domains: string[];
  proficiencies: string[];
  profileStatuses: string[];
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const token = localStorage.getItem('nexus_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('nexus_user');
      window.location.href = '/admin';
    }
    const errorMsg = data.error || `HTTP error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  request,

  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      localStorage.setItem('nexus_token', res.token);
    }
    return res;
  },

  logout() {
    localStorage.removeItem('nexus_token');
  },

  // Master Dropdown Reference Data
  async getDropdowns(): Promise<DropdownOptionsResponse> {
    return request<DropdownOptionsResponse>('/dropdowns');
  },

  async addDropdownOption(type: string, value: string, email?: string): Promise<{ success: boolean; type: string; value: string }> {
    return request<{ success: boolean; type: string; value: string }>('/dropdowns', {
      method: 'POST',
      body: JSON.stringify({ type, value, ...(email ? { email } : {}) }),
    });
  },

  async getDropdownsByType(type: string): Promise<{ type: string; items: Array<{ id: number; name: string; email?: string; sort_order?: number; grade_level?: number }> }> {
    return request(`/dropdowns/${encodeURIComponent(type)}`);
  },

  async updateDropdownOption(type: string, id: number, value: string, email?: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/dropdowns/${encodeURIComponent(type)}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ value, ...(email !== undefined ? { email } : {}) }),
    });
  },

  async deleteDropdownOption(type: string, id: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/dropdowns/${encodeURIComponent(type)}/${id}`, {
      method: 'DELETE',
    });
  },

  async getDropdownUsage(type: string, id: number): Promise<{ type: string; id: number; name: string; usageCount: number }> {
    return request(`/dropdowns/${encodeURIComponent(type)}/${id}/usage`);
  },

  // Employees APIs
  async getEmployees(params?: Record<string, any>): Promise<{ employees: Employee[]; total: number }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, String(val));
        }
      });
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ employees: Employee[]; total: number }>(`/employees${qs}`);
  },

  async getEmployeeById(id: string): Promise<{ employee: Employee }> {
    return request<{ employee: Employee }>(`/employees/${encodeURIComponent(id)}`);
  },

  async createEmployee(employee: Employee): Promise<{ employee: Employee; message: string }> {
    return request<{ employee: Employee; message: string }>('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    });
  },

  async updateEmployee(id: string, employee: Employee): Promise<{ employee: Employee; message: string }> {
    return request<{ employee: Employee; message: string }>(`/employees/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(employee),
    });
  },

  async deleteEmployee(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/employees/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async resetEmployees(): Promise<{ message: string; total: number }> {
    return request<{ message: string; total: number }>('/employees/reset', {
      method: 'POST',
    });
  },

  // Skills Catalog APIs
  async getSkills(): Promise<{ skills: CatalogSkill[] }> {
    return request<{ skills: CatalogSkill[] }>('/skills');
  },

  async createSkill(skill: { name: string; category: string; description?: string }): Promise<{ skill: CatalogSkill; message: string }> {
    return request<{ skill: CatalogSkill; message: string }>('/skills', {
      method: 'POST',
      body: JSON.stringify(skill),
    });
  },

  async updateSkill(id: string, data: { name: string; description?: string }): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/skills/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteSkill(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/skills/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async getSkillUsage(id: string): Promise<{ id: string; name: string; usageCount: number }> {
    return request(`/skills/${encodeURIComponent(id)}/usage`);
  },

  // Master Data Overrides (rename/hide system items)
  async getOverrides(): Promise<{ overrides: Record<string, { label: string | null; hidden: boolean }> }> {
    return request('/master-data/overrides');
  },

  async updateOverride(key: string, data: { label?: string; hidden?: boolean }): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/master-data/overrides/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteOverride(key: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/master-data/overrides/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  },

  // Custom Sections
  async getCustomSections(): Promise<{ sections: Array<{ id: number; label: string; after_key: string }> }> {
    return request('/master-data/sections');
  },

  async createCustomSection(label: string, after_key: string): Promise<{ section: any }> {
    return request('/master-data/sections', {
      method: 'POST',
      body: JSON.stringify({ label, after_key }),
    });
  },

  async updateCustomSection(id: number, label: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/master-data/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ label }),
    });
  },

  async deleteCustomSection(id: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/master-data/sections/${id}`, {
      method: 'DELETE',
    });
  },

  // Custom Master Data Fields & Options
  async getCustomFields(section?: string): Promise<{ fields: Array<{ id: number; section: string; label: string; field_type: string; is_required: number; sort_order: number }> }> {
    const qs = section ? `?section=${encodeURIComponent(section)}` : '';
    return request(`/master-data/fields${qs}`);
  },

  async createCustomField(section: string, label: string, field_type: string = 'dropdown', is_required: boolean = false): Promise<{ field: any }> {
    return request('/master-data/fields', {
      method: 'POST',
      body: JSON.stringify({ section, label, field_type, is_required }),
    });
  },

  async updateCustomField(id: number, label: string, is_required?: boolean): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/master-data/fields/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ label, ...(is_required !== undefined ? { is_required } : {}) }),
    });
  },

  async deleteCustomField(id: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/master-data/fields/${id}`, {
      method: 'DELETE',
    });
  },

  async getCustomFieldOptions(fieldId: number): Promise<{ field: any; options: Array<{ id: number; value: string; sort_order: number }> }> {
    return request(`/master-data/fields/${fieldId}/options`);
  },

  async addCustomFieldOption(fieldId: number, value: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/master-data/fields/${fieldId}/options`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  },

  async updateCustomFieldOption(fieldId: number, optionId: number, value: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/master-data/fields/${fieldId}/options/${optionId}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },

  async deleteCustomFieldOption(fieldId: number, optionId: number): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/master-data/fields/${fieldId}/options/${optionId}`, {
      method: 'DELETE',
    });
  },

  async getCustomFieldOptionUsage(fieldId: number, optionId: number): Promise<{ fieldId: number; optionId: number; name: string; usageCount: number }> {
    return request(`/master-data/fields/${fieldId}/options/${optionId}/usage`);
  },

  // Live Workforce Analytics
  async getAnalytics(): Promise<AnalyticsResponse> {
    return request<AnalyticsResponse>('/analytics/overview');
  },
};
