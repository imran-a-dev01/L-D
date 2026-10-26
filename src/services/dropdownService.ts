import { api, DropdownOptionsResponse } from './api';

export interface DropdownData {
  practices: string[];
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

export interface DropdownState {
  data: DropdownData;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

const DEFAULT_DROPDOWNS: DropdownData = {
  practices: [],
  locations: [],
  designations: [],
  currentRoles: [],
  deployableRoles: [],
  projects: [],
  customers: [],
  managers: [],
  skillCategories: [
    'Frontend',
    'Backend',
    'Database',
    'Cloud',
    'Data',
    'DevOps & Tools',
    'Domain Expertise',
  ],
  domains: [],
  proficiencies: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  profileStatuses: ['Complete', 'In Progress', 'Needs Review'],
};

const CACHE_KEY = 'nexus_db_dropdowns_v7';

function deduplicateStrings(arr: string[]): string[] {
  const seen = new Map<string, string>();
  for (const item of arr) {
    const normalized = item.trim().replace(/\s+/g, ' ').toLowerCase();
    if (normalized && !seen.has(normalized)) {
      seen.set(normalized, item.trim().replace(/\s+/g, ' '));
    }
  }
  return Array.from(seen.values());
}

class DropdownService {
  private cache: DropdownData = DEFAULT_DROPDOWNS;
  private listeners: Set<(state: DropdownState) => void> = new Set();
  private _isLoading: boolean = true;
  private _isError: boolean = false;
  private _error: string | null = null;
  private isLoaded: boolean = false;
  private fetchPromise: Promise<DropdownData> | null = null;

  constructor() {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        this.cache = { ...DEFAULT_DROPDOWNS, ...JSON.parse(stored) };
        this.isLoaded = true;
      }
    } catch (e) {
      console.warn('Error reading cached dropdowns:', e);
    }

    this.fetchAll();
  }

  getState(): DropdownState {
    return {
      data: this.cache,
      isLoading: this._isLoading,
      isError: this._isError,
      error: this._error,
    };
  }

  get(): DropdownData {
    return this.cache;
  }

  subscribe(listener: (state: DropdownState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  async addOption(type: string, value: string, email?: string): Promise<boolean> {
    try {
      const trimmed = value.trim().replace(/\s+/g, ' ');
      if (!trimmed) return false;
      await api.addDropdownOption(type, trimmed, email?.trim());
      await this.fetchAll();
      return true;
    } catch (err) {
      console.warn('Failed to save custom dropdown option:', err);
      return false;
    }
  }

  async updateOption(type: string, id: number, value: string, email?: string): Promise<void> {
    await api.updateDropdownOption(type, id, value, email);
    await this.fetchAll();
  }

  async deleteOption(type: string, id: number): Promise<void> {
    await api.deleteDropdownOption(type, id);
    await this.fetchAll();
  }

  async fetchAll(): Promise<DropdownData> {
    if (this.fetchPromise) return this.fetchPromise;

    this._isLoading = true;
    this._isError = false;
    this._error = null;
    this.notify();

    this.fetchPromise = api
      .getDropdowns()
      .then((res: DropdownOptionsResponse) => {
        const data: DropdownData = {
          practices: deduplicateStrings(res.practices || res.businessUnits || []),
          locations: deduplicateStrings(res.locations || []),
          designations: deduplicateStrings(res.designations || []),
          currentRoles: deduplicateStrings(res.currentRoles || []),
          deployableRoles: deduplicateStrings(res.deployableRoles || []),
          projects: deduplicateStrings(res.projects || []),
          customers: deduplicateStrings(res.customers || []),
          managers: deduplicateStrings(res.managers || []),
          skillCategories: res.skillCategories && res.skillCategories.length > 0 ? deduplicateStrings(res.skillCategories) : DEFAULT_DROPDOWNS.skillCategories,
          domains: deduplicateStrings(res.domains || []),
          proficiencies: res.proficiencies && res.proficiencies.length > 0 ? res.proficiencies : DEFAULT_DROPDOWNS.proficiencies,
          profileStatuses: res.profileStatuses && res.profileStatuses.length > 0 ? res.profileStatuses : DEFAULT_DROPDOWNS.profileStatuses,
        };
        this.cache = data;
        this.isLoaded = true;
        this._isLoading = false;
        this._isError = false;
        this._error = null;
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {
          // ignore storage quota issues
        }
        this.notify();
        return data;
      })
      .catch((err) => {
        console.warn('Error loading dropdown options from SQLite DB:', err);
        this._isLoading = false;
        this._isError = true;
        this._error = err instanceof Error ? err.message : 'Failed to load dropdown options';
        this.notify();
        return this.cache;
      })
      .finally(() => {
        this.fetchPromise = null;
      });

    return this.fetchPromise;
  }
}

export const dropdownService = new DropdownService();
