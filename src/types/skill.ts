export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type SkillCategory = 
  | 'Frontend' 
  | 'Backend' 
  | 'Database' 
  | 'Cloud' 
  | 'Data' 
  | 'DevOps & Tools' 
  | 'Domain Expertise';

export interface TechnicalSkill {
  id: string;
  category: SkillCategory;
  name: string;
  slug?: string;
  experienceYears: number;
  proficiency: ProficiencyLevel;
  lastUsed: string; // e.g. "Aug 2025"
  lastProject?: string;
  specialization?: string;
}

export interface DomainExpertise {
  id: string;
  domain: string; // Insurance, Banking, Healthcare, Others
  customDomain?: string;
  experienceYears: number;
  proficiency: ProficiencyLevel;
  lastUsed: string;
  lastProject?: string;
  specialization?: string;
}

export interface CatalogSkill {
  name: string;
  slug: string;
  category: SkillCategory;
  description?: string;
}
