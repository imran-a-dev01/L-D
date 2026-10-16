import { CatalogSkill, SkillCategory } from '../types/skill';

export const ALL_CATEGORIES: SkillCategory[] = [
  'Frontend',
  'Backend',
  'Database',
  'Cloud',
  'Data',
  'DevOps & Tools',
  'Domain Expertise',
];

export const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

export const INITIAL_SKILL_CATALOG: CatalogSkill[] = [
  // Frontend
  { name: 'React', slug: 'react', category: 'Frontend', description: 'React UI Library' },
  { name: 'Next.js', slug: 'nextjs', category: 'Frontend', description: 'React SSR Framework' },
  { name: 'Angular', slug: 'angular', category: 'Frontend', description: 'Enterprise TS Framework' },
  { name: 'Vue.js', slug: 'vue', category: 'Frontend', description: 'Progressive JS Framework' },
  { name: 'TypeScript', slug: 'ts', category: 'Frontend', description: 'Typed JavaScript' },
  { name: 'JavaScript', slug: 'js', category: 'Frontend', description: 'Core Web Scripting' },
  { name: 'Tailwind CSS', slug: 'tailwind', category: 'Frontend', description: 'Utility-first CSS' },

  // Backend
  { name: 'Java', slug: 'java', category: 'Backend', description: 'Enterprise Java Platform' },
  { name: 'Spring Boot', slug: 'spring', category: 'Backend', description: 'Java Microservices' },
  { name: '.NET', slug: 'dotnet', category: 'Backend', description: 'Microsoft .NET Core' },
  { name: 'Node.js', slug: 'nodejs', category: 'Backend', description: 'Server-side JS Runtime' },
  { name: 'Python', slug: 'py', category: 'Backend', description: 'APIs and Scripting' },
  { name: 'Go', slug: 'go', category: 'Backend', description: 'High performance language' },

  // Database
  { name: 'SQL Server', slug: 'mssql', category: 'Database', description: 'Relational Database' },
  { name: 'Oracle', slug: 'oracle', category: 'Database', description: 'Enterprise RDBMS' },
  { name: 'PostgreSQL', slug: 'postgres', category: 'Database', description: 'Open Source Relational DB' },
  { name: 'MySQL', slug: 'mysql', category: 'Database', description: 'Popular Open Source DB' },
  { name: 'MongoDB', slug: 'mongodb', category: 'Database', description: 'Document NoSQL DB' },
  { name: 'Redis', slug: 'redis', category: 'Database', description: 'In-Memory Cache' },

  // Cloud
  { name: 'AWS', slug: 'aws', category: 'Cloud', description: 'Amazon Web Services' },
  { name: 'Azure', slug: 'azure', category: 'Cloud', description: 'Microsoft Azure Cloud' },
  { name: 'GCP', slug: 'gcp', category: 'Cloud', description: 'Google Cloud Platform' },
  { name: 'Docker', slug: 'docker', category: 'Cloud', description: 'Containerization' },
  { name: 'Kubernetes', slug: 'kubernetes', category: 'Cloud', description: 'Container Orchestration' },

  // Data
  { name: 'Snowflake', slug: 'snowflake', category: 'Data', description: 'Cloud Data Warehouse' },
  { name: 'Databricks', slug: 'databricks', category: 'Data', description: 'Data Analytics Platform' },
  { name: 'Kafka', slug: 'kafka', category: 'Data', description: 'Distributed Streaming' },

  // DevOps & Tools
  { name: 'Jenkins', slug: 'jenkins', category: 'DevOps & Tools', description: 'CI/CD Automation' },
  { name: 'ADO / Azure DevOps', slug: 'ado', category: 'DevOps & Tools', description: 'Microsoft DevOps' },
  { name: 'Git', slug: 'git', category: 'DevOps & Tools', description: 'Distributed Version Control' },
  { name: 'Linux', slug: 'linux', category: 'DevOps & Tools', description: 'Linux OS Management' },

  // Domain Expertise
  { name: 'Insurance', slug: 'insurance', category: 'Domain Expertise', description: 'Property, Casualty & Health' },
  { name: 'Banking', slug: 'banking', category: 'Domain Expertise', description: 'Retail & Commercial Banking' },
  { name: 'Healthcare', slug: 'healthcare', category: 'Domain Expertise', description: 'Provider & Life Sciences' },
  { name: 'Others', slug: 'others', category: 'Domain Expertise', description: 'Custom Industry Domain' },
];
