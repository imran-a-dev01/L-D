import { api, DropdownOptionsResponse } from './api';

export interface DropdownData {
  practices: string[];
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

const DEFAULT_DROPDOWNS: DropdownData = {
  practices: [],
  locations: [],
  designations: [],
  owlsureDesignations: [],
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

const CACHE_KEY = 'nexus_db_dropdowns_v5';

class DropdownService {
  private cache: DropdownData = DEFAULT_DROPDOWNS;
  private listeners: Set<(data: DropdownData) => void> = new Set();
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

    // Immediately trigger background fetch from SQLite database
    this.fetchAll();
  }

  get(): DropdownData {
    return this.cache;
  }

  subscribe(listener: (data: DropdownData) => void): () => void {
    this.listeners.add(listener);
    listener(this.cache);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.cache));
  }

  async addOption(type: string, value: string, email?: string): Promise<boolean> {
    try {
      await api.addDropdownOption(type, value, email);
      await this.fetchAll();
      return true;
    } catch (err) {
      console.warn('Failed to save custom dropdown option:', err);
      return false;
    }
  }

  async fetchAll(): Promise<DropdownData> {
    if (this.fetchPromise) return this.fetchPromise;

    this.fetchPromise = api
      .getDropdowns()
      .then((res: DropdownOptionsResponse) => {
        const data: DropdownData = {
          practices: res.practices || res.businessUnits || [],
          locations: res.locations || [],
          designations: res.designations || [],
          owlsureDesignations: res.owlsureDesignations || [],
          currentRoles: res.currentRoles || [],
          deployableRoles: res.deployableRoles || [],
          projects: res.projects || [],
          customers: res.customers || [],
          managers: res.managers || [],
          skillCategories: res.skillCategories && res.skillCategories.length > 0 ? res.skillCategories : DEFAULT_DROPDOWNS.skillCategories,
          domains: res.domains || [],
          proficiencies: res.proficiencies && res.proficiencies.length > 0 ? res.proficiencies : DEFAULT_DROPDOWNS.proficiencies,
          profileStatuses: res.profileStatuses && res.profileStatuses.length > 0 ? res.profileStatuses : DEFAULT_DROPDOWNS.profileStatuses,
        };
        this.cache = data;
        this.isLoaded = true;
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
        return this.cache;
      })
      .finally(() => {
        this.fetchPromise = null;
      });

    return this.fetchPromise;
  }
}

export const dropdownService = new DropdownService();
