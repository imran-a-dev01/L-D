import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ChevronRight, 
  Search, 
  ShieldAlert, 
  UserCheck, 
  Copy 
} from 'lucide-react';
import { Employee } from '../types/employee';
import { api, AnalyticsResponse, SkillCoverageItem } from '../services/api';
import { useToast } from '../components/common/Toast';
import { PageHeader } from '../components/layout/PageHeader';
import { SkillIcon } from '../components/common/SkillIcon';

interface SkillCoveragePageProps {
  employees: Employee[];
  analytics?: AnalyticsResponse | null;
  onNavigateHome?: () => void;
  onNavigateToSkills?: () => void;
  onViewEmployee?: (emp: Employee) => void;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  frontend: 'linear-gradient(90deg, #3B82F6 0%, #1265FF 100%)',
  backend: 'linear-gradient(90deg, #06B6D4 0%, #00B4D8 100%)',
  database: 'linear-gradient(90deg, #818CF8 0%, #6366F1 100%)',
  cloud: 'linear-gradient(90deg, #34D399 0%, #10B981 100%)',
  data: 'linear-gradient(90deg, #A78BFA 0%, #8B5CF6 100%)',
  'devops & tools': 'linear-gradient(90deg, #F472B6 0%, #EC4899 100%)',
  devops: 'linear-gradient(90deg, #F472B6 0%, #EC4899 100%)',
  domain: 'linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%)',
};

const CATEGORY_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  frontend: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  backend: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  database: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  cloud: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  data: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'devops & tools': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  domain: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

function getCategoryGradient(label: string): string {
  const key = (label || '').toLowerCase().trim();
  return CATEGORY_GRADIENTS[key] || 'linear-gradient(90deg, #3B82F6 0%, #1265FF 100%)';
}

function getCategoryBadge(label: string) {
  const key = (label || '').toLowerCase().trim();
  return CATEGORY_BADGE_COLORS[key] || { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
}

const CATEGORY_ACCENT_COLORS: Record<string, string> = {
  frontend: '#1265FF',
  backend: '#0891B2',
  database: '#6366F1',
  cloud: '#10B981',
  data: '#8B5CF6',
  'devops & tools': '#DB2777',
  devops: '#DB2777',
  domain: '#D97706',
};

function getCategoryAccentColor(label: string): string {
  const key = (label || '').toLowerCase().trim();
  return CATEGORY_ACCENT_COLORS[key] || '#1265FF';
}

export const SkillCoveragePage: React.FC<SkillCoveragePageProps> = ({
  employees,
  analytics: initialAnalytics,
  onNavigateHome: _onNavigateHome,
  onNavigateToSkills: _onNavigateToSkills,
  onViewEmployee,
}) => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(initialAnalytics || null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const hasPermission = true;

  // Refresh analytics if employees change
  useEffect(() => {
    api.getAnalytics()
      .then(setAnalytics)
      .catch((err) => console.warn('Could not fetch analytics for SkillCoveragePage:', err));
  }, [employees]);

  // Total workforce employee count
  const totalEmployees = analytics ? analytics.totalEmployees : employees.length;

  // Helper to compute child skills for any category (Master-Child relationship)
  const getChildSkillsForCategory = useMemo(() => {
    return (catLabel: string): Array<{ name: string; count: number; category: string }> => {
      const cat = catLabel.toLowerCase().trim();
      const skillCountMap = new Map<string, { count: number; category: string; originalName: string }>();

      employees.forEach((emp) => {
        if (cat === 'domain') {
          const empDomains = new Set<string>();
          emp.domainExpertise?.forEach((d) => {
            const rawName = d.domain === 'Others' ? (d.customDomain || 'Others').trim() : (d.domain || '').trim();
            if (rawName) {
              const lower = rawName.toLowerCase();
              if (!empDomains.has(lower)) {
                empDomains.add(lower);
                const cur = skillCountMap.get(lower);
                if (cur) {
                  cur.count += 1;
                } else {
                  skillCountMap.set(lower, { count: 1, category: 'Domain', originalName: rawName });
                }
              }
            }
          });
        } else {
          const empSkills = new Set<string>();
          emp.technicalSkills?.forEach((s) => {
            if (s.category?.toLowerCase().trim() === cat && s.name?.trim()) {
              const rawName = s.name.trim();
              const lower = rawName.toLowerCase();
              if (!empSkills.has(lower)) {
                empSkills.add(lower);
                const cur = skillCountMap.get(lower);
                if (cur) {
                  cur.count += 1;
                } else {
                  skillCountMap.set(lower, { count: 1, category: s.category || catLabel, originalName: rawName });
                }
              }
            }
          });
        }
      });

      return Array.from(skillCountMap.values())
        .map((data) => ({
          name: data.originalName,
          count: data.count,
          category: data.category,
        }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    };
  }, [employees]);

  // Master Categories: merges standard categories, analytics categories & dynamic categories from employees
  const coverageItems: SkillCoverageItem[] = useMemo(() => {
    const total = totalEmployees || employees.length;

    // Default base category order
    const categoryLabels: string[] = [
      'Frontend',
      'Backend',
      'Database',
      'Cloud',
      'Data',
      'DevOps & Tools',
      'Domain',
    ];

    // Merge categories from analytics if provided
    if (analytics?.skillCoverage && analytics.skillCoverage.length > 0) {
      analytics.skillCoverage.forEach((item) => {
        if (!categoryLabels.some((c) => c.toLowerCase() === item.label.toLowerCase())) {
          categoryLabels.push(item.label);
        }
      });
    }

    // Also dynamically discover any custom categories from employee skills
    employees.forEach((emp) => {
      emp.technicalSkills?.forEach((s) => {
        if (s.category?.trim()) {
          const cat = s.category.trim();
          if (!categoryLabels.some((c) => c.toLowerCase() === cat.toLowerCase())) {
            categoryLabels.push(cat);
          }
        }
      });
    });

    return categoryLabels.map((catLabel) => {
      let count = 0;
      if (catLabel.toLowerCase() === 'domain') {
        count = employees.filter((e) => e.domainExpertise && e.domainExpertise.length > 0).length;
      } else {
        count = employees.filter((e) =>
          e.technicalSkills && e.technicalSkills.some((s) => s.category?.toLowerCase() === catLabel.toLowerCase())
        ).length;
      }

      const existingFromAnalytics = analytics?.skillCoverage?.find(
        (i) => i.label.toLowerCase() === catLabel.toLowerCase()
      );

      return {
        label: existingFromAnalytics?.label || catLabel,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        barColor: existingFromAnalytics?.barColor || '#1265FF',
      };
    });
  }, [analytics, employees, totalEmployees]);

  // Filtered categories based on search query (matches category label OR child skill names)
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return coverageItems;
    const q = searchQuery.toLowerCase().trim();
    return coverageItems.filter((c) => {
      if (c.label.toLowerCase().includes(q)) return true;
      const childSkills = getChildSkillsForCategory(c.label);
      return childSkills.some((s) => s.name.toLowerCase().includes(q));
    });
  }, [coverageItems, searchQuery, getChildSkillsForCategory]);

  // Find employees that belong to the selected category (Master)
  const selectedCategoryEmployees = useMemo(() => {
    if (!selectedCategory) return [];
    const cat = selectedCategory.toLowerCase();
    if (cat === 'domain') {
      return employees.filter((e) => e.domainExpertise && e.domainExpertise.length > 0);
    }
    return employees.filter((e) =>
      e.technicalSkills && e.technicalSkills.some((s) => s.category?.toLowerCase() === cat)
    );
  }, [selectedCategory, employees]);

  // Handle category accordion toggle
  const handleToggleCategory = (catLabel: string) => {
    if (selectedCategory === catLabel) {
      setSelectedCategory(null);
      setSelectedSkillFilter(null);
    } else {
      setSelectedCategory(catLabel);
      setSelectedSkillFilter(null);
    }
  };

  // RBAC Access Restricted State
  if (!hasPermission) {
    return (
      <div className="bg-white rounded-2xl p-10 border border-[#DFE5EE] shadow-sm text-center max-w-lg mx-auto mt-12 animate-in fade-in duration-200">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">
          Access Restricted
        </h2>
        <p className="text-sm text-[#64748B] mt-2">
          Your user role does not currently possess the <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 text-xs">skill:view</code> permission required to access enterprise skill coverage analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unified Page Header: Reusable Breadcrumb + Heading */}
      <PageHeader title="Skill Coverage" />

      {/* Main Content Area: Capability Coverage Distribution and Drilldown */}
      <div className="bg-white rounded-2xl border border-[#DFE5EE] shadow-sm overflow-hidden animate-reveal-1">
        {/* Top Header & Search */}
        <div className="p-5 md:p-6 border-b border-[#DFE5EE] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">
              Capability Coverage Distribution
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Real-time percentage and employee headcount across technology verticals. Click any category to view roster.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter categories or skills..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0B1B4D] placeholder-[#94A3B8] focus:outline-none focus:border-[#1265FF] transition-all"
            />
          </div>
        </div>

        {/* Empty State when no employees or categories */}
        {totalEmployees === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1265FF] border border-blue-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">
              No Workforce Skill Data Available
            </h3>
            <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
              Add employees with technical skills or domain expertise to generate real-time capability distribution analytics.
            </p>
            <button
              onClick={() => {
                const url = window.location.origin + '/';
                navigator.clipboard?.writeText(url);
                toast('Employee form link copied to clipboard!', 'success', 'Link Copied');
              }}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2 bg-[#1265FF] hover:bg-[#0E52D4] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy employee form link</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Slim Column Header Row for Desktop Table Alignment */}
            <div className="hidden md:grid md:grid-cols-[170px_150px_1fr_80px_40px] md:gap-4 px-6 py-2.5 bg-[#F8FAFD] border-b border-[#DFE5EE] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider items-center select-none">
              <span>Category</span>
              <span>Employees</span>
              <span>Coverage</span>
              <span className="text-right">Share</span>
              <span className="sr-only">Expand</span>
            </div>

            <div className="divide-y divide-[#DFE5EE]">
              {filteredCategories.map((item, index) => {
                const isSelected = selectedCategory === item.label;
                const badge = getCategoryBadge(item.label);
                const accentColor = getCategoryAccentColor(item.label);

                return (
                  <div key={item.label} className="transition-colors">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isSelected}
                      aria-label={`${item.label} capability: ${item.count} of ${totalEmployees} employees, ${item.percentage}% coverage`}
                      onClick={() => handleToggleCategory(item.label)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleCategory(item.label);
                        }
                      }}
                      className={`p-4 md:px-6 md:py-4 transition-all cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1265FF] focus-visible:ring-inset ${
                        isSelected ? 'bg-blue-50/40 ring-1 ring-inset ring-blue-100' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Mobile Layout (< md) */}
                      <div className="md:hidden flex flex-col gap-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border truncate max-w-[160px] ${badge.bg} ${badge.text} ${badge.border}`}
                            title={item.label}
                          >
                            <span className="truncate">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-base font-extrabold tabular-nums font-['Plus_Jakarta_Sans',sans-serif]"
                              style={{ color: accentColor }}
                            >
                              {item.percentage}%
                            </span>
                            <div
                              className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                                isSelected ? 'rotate-90 bg-blue-50 text-[#1265FF] border-blue-200' : 'border-slate-200 text-slate-400'
                              }`}
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-[#64748B]">
                          <span className="flex items-baseline gap-1">
                            <strong className="text-sm font-bold text-[#0B1B4D] tabular-nums">{item.count}</strong> of {totalEmployees} employees
                          </span>
                        </div>

                        <div className="h-3 rounded-full bg-[#EEF3FA] overflow-hidden shadow-inner relative border border-slate-100/80 w-full">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 0.8, delay: index * 0.05, ease: 'easeOut' }}
                            className="h-full rounded-full relative overflow-hidden"
                            style={{
                              background: getCategoryGradient(item.label),
                              boxShadow: item.percentage > 0 ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                            }}
                          />
                        </div>
                      </div>

                      {/* Desktop Grid Layout (>= md) with Pixel-Perfect Alignment */}
                      <div className="hidden md:grid md:grid-cols-[170px_150px_1fr_80px_40px] md:gap-4 items-center w-full">
                        {/* 1. Category Chip (Fixed 170px column, never pushes adjacent columns) */}
                        <div className="min-w-0 flex items-center">
                          <div
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border truncate max-w-full ${badge.bg} ${badge.text} ${badge.border}`}
                            title={item.label}
                          >
                            <span className="truncate">{item.label}</span>
                          </div>
                        </div>

                        {/* 2. Employee Headcount (Fixed 150px column, bold dark navy number) */}
                        <div className="min-w-0 flex items-baseline gap-1 text-xs text-[#64748B]">
                          <span className="text-base font-bold text-[#0B1B4D] tabular-nums leading-none">
                            {item.count}
                          </span>
                          <span className="text-xs text-[#64748B] font-normal truncate">
                            of {totalEmployees} {totalEmployees === 1 ? 'employee' : 'employees'}
                          </span>
                        </div>

                        {/* 3. Coverage Progress Bar (Flexible 1fr, identical start and end x) */}
                        <div className="min-w-0 w-full">
                          <div className="h-3 rounded-full bg-[#EEF3FA] overflow-hidden shadow-inner relative border border-slate-100/80 w-full">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percentage}%` }}
                              transition={{ duration: 0.8, delay: index * 0.05, ease: 'easeOut' }}
                              className="h-full rounded-full relative overflow-hidden"
                              style={{
                                background: getCategoryGradient(item.label),
                                boxShadow: item.percentage > 0 ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                              }}
                            />
                          </div>
                        </div>

                        {/* 4. Share Percentage (Fixed 80px, bold 18-20px font, matching accent color) */}
                        <div className="text-right">
                          <span
                            className="text-lg md:text-xl font-extrabold tabular-nums font-['Plus_Jakarta_Sans',sans-serif]"
                            style={{ color: accentColor }}
                          >
                            {item.percentage}%
                          </span>
                        </div>

                        {/* 5. Chevron (Fixed 40px, centered/aligned right) */}
                        <div className="flex justify-end">
                          <div
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'rotate-90 bg-blue-50 text-[#1265FF] border-blue-200'
                                : 'border-slate-200 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-600'
                            }`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Drilldown Roster for Category (Master-Child Drilldown) */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="bg-[#F8FAFC] border-t border-[#DFE5EE] px-5 py-4 md:px-6 md:py-5 overflow-hidden"
                        >
                          {(() => {
                            const childSkills = getChildSkillsForCategory(item.label);
                            const isDomain = item.label.toLowerCase() === 'domain';
                            const filterTarget = selectedSkillFilter?.toLowerCase().trim();

                            const displayedEmployees = !filterTarget
                              ? selectedCategoryEmployees
                              : selectedCategoryEmployees.filter((e) => {
                                  if (isDomain) {
                                    return e.domainExpertise?.some((d) => {
                                      const dName = d.domain === 'Others' ? (d.customDomain || 'Others').trim() : (d.domain || '').trim();
                                      return dName.toLowerCase() === filterTarget;
                                    });
                                  }
                                  return e.technicalSkills?.some((s) =>
                                    s.category?.toLowerCase() === item.label.toLowerCase() &&
                                    s.name?.trim().toLowerCase() === filterTarget
                                  );
                                });

                            return (
                              <div className="space-y-4">
                                {/* Header & Dynamic Language / Skill Selector */}
                                <div className="space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider flex items-center gap-2 flex-wrap">
                                      <span>
                                        Employees with {item.label} capability ({selectedCategoryEmployees.length})
                                      </span>
                                      {selectedSkillFilter && (
                                        <span className="text-[#1265FF] font-bold normal-case text-xs bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                                          <span>Filtered by:</span>
                                          <strong>{selectedSkillFilter}</strong>
                                          <span className="text-[#64748B]">({displayedEmployees.length})</span>
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[11px] text-slate-500">
                                      Click employee to inspect full verified profile
                                    </span>
                                  </div>

                                  {/* Dynamic Language / Skill Pills (Master-Child Relationship) */}
                                  {childSkills.length > 0 && (
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
                                      <span className="text-[11px] font-bold text-[#64748B] shrink-0 uppercase tracking-wider">
                                        Skills / Tech:
                                      </span>

                                      {/* All button */}
                                      <button
                                        type="button"
                                        onClick={() => setSelectedSkillFilter(null)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                                          selectedSkillFilter === null
                                            ? 'bg-[#1265FF] text-white shadow-xs'
                                            : 'bg-white border border-[#DFE5EE] text-[#64748B] hover:text-[#0B1B4D] hover:bg-slate-50'
                                        }`}
                                      >
                                        <span>All</span>
                                        <span
                                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                                            selectedSkillFilter === null
                                              ? 'bg-white/20 text-white'
                                              : 'bg-slate-100 text-slate-600'
                                          }`}
                                        >
                                          {selectedCategoryEmployees.length}
                                        </span>
                                      </button>

                                      {/* Child Skill / Technology Buttons */}
                                      {childSkills.map((sk) => {
                                        const isChildActive = selectedSkillFilter?.toLowerCase() === sk.name.toLowerCase();
                                        return (
                                          <button
                                            key={sk.name}
                                            type="button"
                                            onClick={() =>
                                              setSelectedSkillFilter(isChildActive ? null : sk.name)
                                            }
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                                              isChildActive
                                                ? 'bg-[#1265FF] text-white shadow-xs ring-2 ring-blue-300'
                                                : 'bg-white border border-[#DFE5EE] text-[#334155] hover:text-[#0B1B4D] hover:border-blue-300 hover:bg-blue-50/40'
                                            }`}
                                            title={`Filter employees with ${sk.name} (${sk.count})`}
                                          >
                                            <SkillIcon name={sk.name} category={sk.category} size="xs" />
                                            <span>{sk.name}</span>
                                            <span
                                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                                                isChildActive
                                                  ? 'bg-white/20 text-white'
                                                  : 'bg-slate-100 text-slate-600'
                                              }`}
                                            >
                                              {sk.count}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>

                                {/* Employee Cards Grid */}
                                {displayedEmployees.length === 0 ? (
                                  <div className="text-xs text-[#64748B] py-8 text-center bg-white rounded-xl border border-dashed border-[#DFE5EE]">
                                    {selectedSkillFilter
                                      ? `No employees have recorded skill "${selectedSkillFilter}" under ${item.label}.`
                                      : `No employees have verified skills registered under this vertical yet.`}
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {displayedEmployees.map((emp) => {
                                      const empSkillsInCategory = isDomain
                                        ? (emp.domainExpertise || []).map((d) => ({
                                            name: d.domain === 'Others' ? (d.customDomain || 'Others').trim() : (d.domain || '').trim(),
                                            proficiency: d.proficiency,
                                            experienceYears: d.experienceYears,
                                          }))
                                        : (emp.technicalSkills || [])
                                            .filter((s) => s.category?.toLowerCase() === item.label.toLowerCase())
                                            .map((s) => ({
                                              name: s.name.trim(),
                                              proficiency: s.proficiency,
                                              experienceYears: s.experienceYears,
                                            }));

                                      const activeSkill = filterTarget
                                        ? empSkillsInCategory.find((s) => s.name.toLowerCase() === filterTarget)
                                        : null;

                                      return (
                                        <div
                                          key={emp.id}
                                          onClick={() => onViewEmployee && onViewEmployee(emp)}
                                          className="p-3.5 rounded-xl bg-white border border-[#E3EAF5] hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-2.5 group"
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1265FF] font-bold text-xs flex items-center justify-center shrink-0">
                                                {emp.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                                              </div>
                                              <div className="min-w-0">
                                                <div className="text-xs font-bold text-[#0B1B4D] group-hover:text-[#1265FF] truncate transition-colors">
                                                  {emp.name}
                                                </div>
                                                <div className="text-[11px] text-[#64748B] truncate">
                                                  {emp.designation} • {emp.businessUnit}
                                                </div>
                                              </div>
                                            </div>
                                            <UserCheck className="w-4 h-4 text-emerald-500 shrink-0 opacity-70 group-hover:opacity-100 mt-0.5" />
                                          </div>

                                          {/* Skill Tag: Highlights filtered skill OR shows skills in this category */}
                                          {activeSkill ? (
                                            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                                <SkillIcon name={activeSkill.name} category={item.label} size="xs" />
                                                <span>{activeSkill.name}</span>
                                                <span>•</span>
                                                <span>{activeSkill.proficiency}</span>
                                                {activeSkill.experienceYears ? (
                                                  <span>({activeSkill.experienceYears}y exp)</span>
                                                ) : null}
                                              </span>
                                            </div>
                                          ) : empSkillsInCategory.length > 0 ? (
                                            <div className="pt-2 border-t border-slate-100 flex items-center gap-1 flex-wrap">
                                              {empSkillsInCategory.slice(0, 3).map((sk) => (
                                                <span
                                                  key={sk.name}
                                                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1E40AF] border border-blue-100"
                                                  title={`${sk.name} • ${sk.proficiency}${sk.experienceYears ? ` (${sk.experienceYears}y exp)` : ''}`}
                                                >
                                                  <SkillIcon name={sk.name} category={item.label} size="xs" />
                                                  <span className="truncate max-w-[85px]">{sk.name}</span>
                                                </span>
                                              ))}
                                              {empSkillsInCategory.length > 3 && (
                                                <span className="text-[10px] text-slate-400 font-semibold px-1">
                                                  +{empSkillsInCategory.length - 3}
                                                </span>
                                              )}
                                            </div>
                                          ) : null}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
