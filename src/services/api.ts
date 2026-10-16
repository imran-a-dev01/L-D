import { Employee } from '../types/employee';
import { TechnicalSkill, CatalogSkill } from '../types/skill';

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
  owlsureDesignations: string[];
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

export const api = {
  getToken(): string | null {
    return localStorage.getItem('nexus_auth_token');
  },

  setToken(token: string) {
    localStorage.setItem('nexus_auth_token', token);
  },

  removeToken() {
    localStorage.removeItem('nexus_auth_token');
    localStorage.removeItem('nexus_auth_user');
  },

  getUser(): UserProfile | null {
    try {
      const data = localStorage.getItem('nexus_auth_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser(user: UserProfile) {
    localStorage.setItem('nexus_auth_user', JSON.stringify(user));
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || `HTTP error ${response.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  },

  // Auth APIs
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.token) {
      this.setToken(res.token);
      this.setUser(res.user);
    }

    return res;
  },

  async getAuthStatus(): Promise<{ needsSetup: boolean }> {
    const response = await fetch(`${API_BASE}/auth/status`);
    return response.json();
  },

  async setupAdmin(name: string, email: string, password: string): Promise<LoginResponse> {
    const res = await this.request<LoginResponse>('/auth/setup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (res.token) {
      this.setToken(res.token);
      this.setUser(res.user);
    }
    return res;
  },

  async getMe(): Promise<{ user: UserProfile }> {
    return this.request<{ user: UserProfile }>('/auth/me');
  },

  async logout(): Promise<void> {
    this.removeToken();
  },

  // Master Dropdown Reference Data
  async getDropdowns(): Promise<DropdownOptionsResponse> {
    return this.request<DropdownOptionsResponse>('/dropdowns');
  },

  async addDropdownOption(type: string, value: string, email?: string): Promise<{ success: boolean; type: string; value: string }> {
    return this.request<{ success: boolean; type: string; value: string }>('/dropdowns', {
      method: 'POST',
      body: JSON.stringify({ type, value, ...(email ? { email } : {}) }),
    });
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
    return this.request<{ employees: Employee[]; total: number }>(`/employees${qs}`);
  },

  async getEmployeeById(id: string): Promise<{ employee: Employee }> {
    return this.request<{ employee: Employee }>(`/employees/${encodeURIComponent(id)}`);
  },

  async createEmployee(employee: Employee): Promise<{ employee: Employee; message: string }> {
    return this.request<{ employee: Employee; message: string }>('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    });
  },

  async updateEmployee(id: string, employee: Employee): Promise<{ employee: Employee; message: string }> {
    return this.request<{ employee: Employee; message: string }>(`/employees/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(employee),
    });
  },

  async deleteEmployee(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/employees/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async resetEmployees(): Promise<{ message: string; total: number }> {
    return this.request<{ message: string; total: number }>('/employees/reset', {
      method: 'POST',
    });
  },

  // Skills Catalog APIs
  async getSkills(): Promise<{ skills: CatalogSkill[] }> {
    return this.request<{ skills: CatalogSkill[] }>('/skills');
  },

  async createSkill(skill: { name: string; category: string; description?: string }): Promise<{ skill: CatalogSkill; message: string }> {
    return this.request<{ skill: CatalogSkill; message: string }>('/skills', {
      method: 'POST',
      body: JSON.stringify(skill),
    });
  },

  async deleteSkill(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/skills/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Live Workforce Analytics
  async getAnalytics(): Promise<AnalyticsResponse> {
    return this.request<AnalyticsResponse>('/analytics/overview');
  },
};
