import { TechnicalSkill, DomainExpertise, ProficiencyLevel } from './skill';

export type ProfileStatus = 'Complete' | 'In Progress' | 'Needs Review';

export interface Employee {
  id: string; // e.g. "EMP001", "EMP00123"
  name: string;
  email: string;
  designation: string; // Designation
  businessUnit: string; // Business Unit / Practice
  reportingManager: string; // Reporting Manager Name
  reportingManagerEmail?: string; // Reporting Manager Email (optional)
  currentProject: string;
  currentCustomer: string;
  location: string;
  totalExperience: number; // e.g. 2.5, 3.5
  currentRole: string; // Current Role (Not Deployable)
  deployableRoles: string[]; // Searchable multi-select chips
  technicalSkills: TechnicalSkill[];
  domainExpertise: DomainExpertise[];
  immediateTechnologies: string[];
  learningTechnologies: string[];
  profileCompletion: number; // 0 to 100 percentage
  status: ProfileStatus;
  updatedAt: string;
  avatarColor?: string;
  customData?: Record<string, string>;
}

export interface EmployeeFilterOptions {
  search: string;
  practice: string;
  location: string;
  proficiency: string;
  profileStatus: string;
  minExperience?: number;
}
