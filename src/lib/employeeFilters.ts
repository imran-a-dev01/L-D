import { Employee } from '../types/employee';

export interface ManagerFilterOption {
  key: string;
  name: string;
  email: string;
  label: string;
}

export interface EmployeeFilterOptionsResult {
  practices: string[];
  locations: string[];
  managers: ManagerFilterOption[];
  domains: string[];
}

export interface EmployeeFilterCriteria {
  search?: string;
  practice?: string;
  location?: string;
  proficiency?: string;
  profileStatus?: string;
  managerKey?: string;
  domain?: string;
  minExperience?: number;
}

/**
 * Normalizes a string for comparison:
 * trim, collapse repeated spaces, convert to lowercase.
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Cleans a string for display:
 * trim, collapse repeated spaces.
 */
export function cleanDisplay(text: string | null | undefined): string {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Manager key helper:
 * getManagerKey(name, email) = normalized name + "|" + normalized email.
 * Two managers with the same name but different emails are different options;
 * the same manager with different letter case is one option.
 */
export function getManagerKey(
  name: string | null | undefined,
  email: string | null | undefined
): string {
  return `${normalizeText(name)}|${normalizeText(email)}`;
}

/**
 * Computes distinct string options grouped by normalized value.
 * For each normalized value, the most frequently used original spelling is chosen (ties broken alphabetically).
 * Options are then sorted alphabetically. Empty values are never included.
 */
function getDistinctOptions(rawValues: (string | null | undefined)[]): string[] {
  const groups = new Map<string, Map<string, number>>();

  for (const raw of rawValues) {
    const norm = normalizeText(raw);
    if (!norm) continue;

    const display = cleanDisplay(raw);
    if (!groups.has(norm)) {
      groups.set(norm, new Map<string, number>());
    }
    const spellings = groups.get(norm)!;
    spellings.set(display, (spellings.get(display) || 0) + 1);
  }

  const result: string[] = [];
  for (const [, spellings] of groups.entries()) {
    const sorted = Array.from(spellings.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]; // Most frequent first
      return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0; // Alphabetical tie-breaker
    });
    result.push(sorted[0][0]);
  }

  return result.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }) || (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * getFilterOptions(employees): returns distinct options computed from the
 * full employee list currently stored in the database.
 */
export function getFilterOptions(employees: Employee[]): EmployeeFilterOptionsResult {
  // 1. Practices: distinct non-empty businessUnit values
  const practices = getDistinctOptions(employees.map((e) => e.businessUnit));

  // 2. Locations: distinct non-empty location values
  const locations = getDistinctOptions(employees.map((e) => e.location));

  // 3. Reporting Managers: distinct non-empty reporting managers as objects { key, name, email, label }
  const managerGroups = new Map<
    string,
    {
      key: string;
      variants: Map<string, { name: string; email: string; count: number }>;
    }
  >();

  for (const emp of employees) {
    const cleanName = cleanDisplay(emp.reportingManager);
    if (!cleanName) continue;

    const cleanEmail = cleanDisplay(emp.reportingManagerEmail || '');
    const key = getManagerKey(cleanName, cleanEmail);

    if (!managerGroups.has(key)) {
      managerGroups.set(key, { key, variants: new Map() });
    }

    const group = managerGroups.get(key)!;
    const variantKey = `${cleanName}:::${cleanEmail}`;
    const existing = group.variants.get(variantKey) || { name: cleanName, email: cleanEmail, count: 0 };
    existing.count += 1;
    group.variants.set(variantKey, existing);
  }

  const managers: ManagerFilterOption[] = [];
  for (const group of managerGroups.values()) {
    const sortedVariants = Array.from(group.variants.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      const nameCmp = a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
      if (nameCmp !== 0) return nameCmp;
      return a.email < b.email ? -1 : a.email > b.email ? 1 : 0;
    });

    const best = sortedVariants[0];
    const label = best.email ? `${best.name} (${best.email})` : best.name;
    managers.push({
      key: group.key,
      name: best.name,
      email: best.email,
      label,
    });
  }

  managers.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }) || (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));

  // 4. Domains: distinct non-empty domains across all employees' domainExpertise (use customDomain when domain is "Others")
  const rawDomains: string[] = [];
  for (const emp of employees) {
    if (Array.isArray(emp.domainExpertise)) {
      for (const d of emp.domainExpertise) {
        const domName = (d.domain === 'Others' || d.domain === '__OTHER__' ? d.customDomain : d.domain) || '';
        if (domName && cleanDisplay(domName)) {
          rawDomains.push(domName);
        }
      }
    }
  }
  const domains = getDistinctOptions(rawDomains);

  return {
    practices,
    locations,
    managers,
    domains,
  };
}

/**
 * applyEmployeeFilters(employees, filters): the single function that filters the list.
 * All case-insensitive and trimmed, all conditions combined with AND:
 * - Practice: exact match on businessUnit
 * - Location: exact match on location
 * - Reporting Manager: match on manager key (name + email)
 * - Domain: employee has that domain (domain or customDomain), exact match
 * - Proficiency: employee has at least one technical skill with that proficiency
 * - Profile Status: exact match on status
 * - Min Experience: totalExperience >= selected value
 * - Search: name, employee ID, email, designation, reporting manager name and email, skill names, domain names, partial match
 */
export function applyEmployeeFilters(
  employees: Employee[],
  filters: EmployeeFilterCriteria
): Employee[] {
  return employees.filter((emp) => {
    // 1. Practice exact match
    if (filters.practice && filters.practice !== 'All') {
      if (normalizeText(emp.businessUnit) !== normalizeText(filters.practice)) {
        return false;
      }
    }

    // 2. Location exact match
    if (filters.location && filters.location !== 'All') {
      if (normalizeText(emp.location) !== normalizeText(filters.location)) {
        return false;
      }
    }

    // 3. Reporting Manager key match
    if (filters.managerKey && filters.managerKey !== 'All') {
      const empManagerKey = getManagerKey(emp.reportingManager, emp.reportingManagerEmail);
      if (empManagerKey !== filters.managerKey) {
        return false;
      }
    }

    // 4. Domain exact match (employee has domain or customDomain)
    if (filters.domain && filters.domain !== 'All') {
      const targetDomainNorm = normalizeText(filters.domain);
      const hasDomain = Array.isArray(emp.domainExpertise) && emp.domainExpertise.some((d) => {
        const domName = (d.domain === 'Others' || d.domain === '__OTHER__' ? d.customDomain : d.domain) || '';
        return normalizeText(domName) === targetDomainNorm;
      });
      if (!hasDomain) return false;
    }

    // 5. Proficiency: employee has at least one technical skill with that proficiency
    if (filters.proficiency && filters.proficiency !== 'All') {
      const targetProfNorm = normalizeText(filters.proficiency);
      const hasSkill = Array.isArray(emp.technicalSkills) && emp.technicalSkills.some((s) => {
        return normalizeText(s.proficiency) === targetProfNorm;
      });
      if (!hasSkill) return false;
    }

    // 6. Profile Status exact match
    if (filters.profileStatus && filters.profileStatus !== 'All' && filters.profileStatus !== 'All Statuses') {
      if (normalizeText(emp.status) !== normalizeText(filters.profileStatus)) {
        return false;
      }
    }

    // 7. Min Experience
    if (typeof filters.minExperience === 'number' && filters.minExperience > 0) {
      if ((emp.totalExperience || 0) < filters.minExperience) {
        return false;
      }
    }

    // 8. Search: name, employee ID, email, designation, reporting manager name and email, skill names, domain names, partial match
    if (filters.search && filters.search.trim() !== '') {
      const q = normalizeText(filters.search);
      const matchesName = normalizeText(emp.name).includes(q);
      const matchesId = normalizeText(emp.id).includes(q);
      const matchesEmail = normalizeText(emp.email).includes(q);
      const matchesDesignation = normalizeText(emp.designation).includes(q);
      const matchesManager = normalizeText(emp.reportingManager).includes(q);
      const matchesManagerEmail = Boolean(emp.reportingManagerEmail && normalizeText(emp.reportingManagerEmail).includes(q));
      const matchesSkill = Array.isArray(emp.technicalSkills) && emp.technicalSkills.some((s) => {
        return normalizeText(s.name).includes(q);
      });
      const matchesDomain = Array.isArray(emp.domainExpertise) && emp.domainExpertise.some((d) => {
        const dName = normalizeText(d.domain);
        const cdName = normalizeText(d.customDomain);
        return dName.includes(q) || cdName.includes(q);
      });

      if (
        !matchesName &&
        !matchesId &&
        !matchesEmail &&
        !matchesDesignation &&
        !matchesManager &&
        !matchesManagerEmail &&
        !matchesSkill &&
        !matchesDomain
      ) {
        return false;
      }
    }

    return true;
  });
}
