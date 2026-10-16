import { SkillCategory } from '../types/skill';

/**
 * Normalization alias map: Maps common tech names to skillicons.dev slugs.
 * skillicons.dev syntax: https://skillicons.dev/icons?i=<slug>
 */
export const TECH_SLUG_MAP: Record<string, string> = {
  // Frontend
  'react': 'react',
  'react.js': 'react',
  'reactjs': 'react',
  'next.js': 'nextjs',
  'nextjs': 'nextjs',
  'next': 'nextjs',
  'angular': 'angular',
  'angular.js': 'angular',
  'angularjs': 'angular',
  'vue': 'vue',
  'vue.js': 'vue',
  'vuejs': 'vue',
  'typescript': 'ts',
  'ts': 'ts',
  'javascript': 'js',
  'js': 'js',
  'html': 'html',
  'html5': 'html',
  'css': 'css',
  'css3': 'css',
  'tailwind': 'tailwind',
  'tailwindcss': 'tailwind',
  'sass': 'sass',
  'redux': 'redux',
  'graphql': 'graphql',

  // Backend
  'java': 'java',
  'spring': 'spring',
  'springboot': 'spring',
  '.net': 'dotnet',
  'dotnet': 'dotnet',
  'c#': 'cs',
  'node.js': 'nodejs',
  'nodejs': 'nodejs',
  'node': 'nodejs',
  'express': 'express',
  'express.js': 'express',
  'python': 'py',
  'python3': 'py',
  'go': 'go',
  'golang': 'go',
  'rust': 'rust',
  'php': 'php',
  'c++': 'cpp',
  'c': 'c',
  'ruby': 'ruby',
  'rails': 'rails',

  // Database
  'sql': 'postgres',
  'sql server': 'mssql',
  'mssql': 'mssql',
  'oracle': 'oracle',
  'postgresql': 'postgres',
  'postgres': 'postgres',
  'mysql': 'mysql',
  'mongodb': 'mongodb',
  'mongo': 'mongodb',
  'redis': 'redis',
  'sqlite': 'sqlite',
  'cassandra': 'cassandra',

  // Cloud & Containers
  'aws': 'aws',
  'amazon web services': 'aws',
  'azure': 'azure',
  'microsoft azure': 'azure',
  'gcp': 'gcp',
  'google cloud': 'gcp',
  'docker': 'docker',
  'containers': 'docker',
  'kubernetes': 'kubernetes',
  'k8s': 'kubernetes',
  'terraform': 'terraform',

  // DevOps & Tools
  'jenkins': 'jenkins',
  'ado': 'azure',
  'azure devops': 'azure',
  'git': 'git',
  'github': 'github',
  'gitlab': 'gitlab',
  'linux': 'linux',
  'nginx': 'nginx',
  'postman': 'postman',

  // Data & Analytics
  'kafka': 'kafka',
  'rabbitmq': 'rabbitmq',
};

/**
 * Resolves a technology name or slug into a skillicons.dev URL.
 * Returns null if no valid icon slug is mapped.
 */
export function getSkillIconUrl(techName: string): string | null {
  if (!techName) return null;
  const cleanName = techName.trim().toLowerCase();
  const slug = TECH_SLUG_MAP[cleanName] || (Object.values(TECH_SLUG_MAP).includes(cleanName) ? cleanName : null);
  
  if (slug) {
    return `https://skillicons.dev/icons?i=${slug}`;
  }
  return null;
}

/**
 * Suggests default badge colors or accent styling for different skill categories
 */
export function getCategoryBadgeColor(category: SkillCategory): { bg: string; text: string; border: string } {
  switch (category) {
    case 'Frontend':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'Backend':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    case 'Database':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'Cloud':
      return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' };
    case 'Data':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'DevOps & Tools':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'Domain Expertise':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  }
}
