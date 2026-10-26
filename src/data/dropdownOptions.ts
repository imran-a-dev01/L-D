import { dropdownService } from '../services/dropdownService';

/**
 * Master Reference Options
 * NOTE: All hardcoded data has been eliminated.
 * All options are dynamically fetched directly from the SQLite database via /api/dropdowns.
 */

// Helper to get fresh data snapshot from SQLite cache
export const getDynamicDropdowns = () => dropdownService.get();

// Proxies to ensure all array operations (map, filter, length, indexing) dynamically access SQLite DB data
export const PRACTICES: readonly string[] = new Proxy([] as string[], {
  get(_target, prop) {
    const list = dropdownService.get().practices;
    return Reflect.get(list, prop);
  },
});

export const LOCATIONS: readonly string[] = new Proxy([] as string[], {
  get(_target, prop) {
    const list = dropdownService.get().locations;
    return Reflect.get(list, prop);
  },
});

export const DESIGNATIONS: readonly string[] = new Proxy([] as string[], {
  get(_target, prop) {
    const list = dropdownService.get().designations;
    return Reflect.get(list, prop);
  },
});

export const CURRENT_ROLES: readonly string[] = new Proxy([] as string[], {
  get(_target, prop) {
    const list = dropdownService.get().currentRoles;
    return Reflect.get(list, prop);
  },
});

export const DEPLOYABLE_ROLES_OPTIONS: readonly string[] = new Proxy([] as string[], {
  get(_target, prop) {
    const list = dropdownService.get().deployableRoles;
    return Reflect.get(list, prop);
  },
});

export const PROJECTS: readonly string[] = new Proxy([] as string[], {
  get(_target, prop) {
    const list = dropdownService.get().projects;
    return Reflect.get(list, prop);
  },
});

export const CUSTOMERS: readonly string[] = new Proxy([] as string[], {
  get(_target, prop) {
    const list = dropdownService.get().customers;
    return Reflect.get(list, prop);
  },
});

export const MANAGERS: readonly string[] = new Proxy([] as string[], {
  get(_target, prop) {
    const list = dropdownService.get().managers;
    return Reflect.get(list, prop);
  },
});

export const DOMAINS: readonly string[] = new Proxy([] as string[], {
  get(_target, prop) {
    const list = dropdownService.get().domains;
    return Reflect.get(list, prop);
  },
});
