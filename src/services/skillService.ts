import { CatalogSkill, SkillCategory } from '../types/skill';
import { api } from './api';
import { TECH_SLUG_MAP } from '../lib/skillIcons';

const SKILL_CATALOG_KEY = 'nexus_skills_catalog_v3';

class SkillService {
  private cache: CatalogSkill[] = [];
  private isLoaded = false;
  private fetchPromise: Promise<CatalogSkill[]> | null = null;
  private listeners: Set<(skills: CatalogSkill[]) => void> = new Set();

  constructor() {
    try {
      const data = localStorage.getItem(SKILL_CATALOG_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cache = parsed;
          this.isLoaded = true;
        }
      }
    } catch (e) {
      console.warn('Error reading skill catalog from cache:', e);
    }
    this.fetchAllFromBackend();
  }

  subscribe(listener: (skills: CatalogSkill[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.cache);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.cache));
  }

  async fetchAllFromBackend(): Promise<CatalogSkill[]> {
    if (this.fetchPromise) return this.fetchPromise;

    this.fetchPromise = api
      .getSkills()
      .then(({ skills }) => {
        if (skills && skills.length > 0) {
          this.cache = skills;
          this.isLoaded = true;
          try {
            localStorage.setItem(SKILL_CATALOG_KEY, JSON.stringify(skills));
          } catch {
            // ignore quota
          }
          this.notify();
          return skills;
        }
        return this.cache;
      })
      .catch((err) => {
        console.warn('Could not fetch skills from SQLite backend, using cache:', err);
        return this.cache;
      })
      .finally(() => {
        this.fetchPromise = null;
      });

    return this.fetchPromise;
  }

  getCatalog(): CatalogSkill[] {
    return this.cache;
  }

  getByCategory(category: SkillCategory): CatalogSkill[] {
    return this.cache.filter((s) => s.category.toLowerCase() === category.toLowerCase());
  }

  addSkill(newSkill: { name: string; category: SkillCategory; description?: string }): CatalogSkill {
    const cleanName = newSkill.name.trim();
    const existing = this.cache.find(
      (s) => s.name.toLowerCase() === cleanName.toLowerCase() && s.category === newSkill.category
    );
    if (existing) {
      return existing;
    }

    const normalizedKey = cleanName.toLowerCase();
    const slug = TECH_SLUG_MAP[normalizedKey] || normalizedKey.replace(/[^a-z0-9]/g, '');

    const skillItem: CatalogSkill = {
      name: cleanName,
      slug,
      category: newSkill.category,
      description: newSkill.description || `${cleanName} technology`,
    };

    this.cache.push(skillItem);
    try {
      localStorage.setItem(SKILL_CATALOG_KEY, JSON.stringify(this.cache));
    } catch {
      // ignore
    }
    this.notify();

    // Persist to SQLite backend
    api
      .createSkill({
        name: cleanName,
        category: newSkill.category,
        description: newSkill.description,
      })
      .catch((err) => {
        console.warn('Could not persist skill to SQLite:', err.message);
      });

    return skillItem;
  }

  reset(): CatalogSkill[] {
    this.fetchAllFromBackend();
    return this.cache;
  }
}

export const skillService = new SkillService();
