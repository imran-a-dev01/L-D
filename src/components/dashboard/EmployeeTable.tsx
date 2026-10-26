import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Table as TableIcon, 
  LayoutGrid, 
  Download, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  Eye, 
  Edit2, 
  Trash2, 
  UserX, 
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Briefcase,
  Building2,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { Employee } from '../../types/employee';
import { DomainExpertise, TechnicalSkill } from '../../types/skill';
import { SkillIcon } from '../common/SkillIcon';
import { SkillChipGroup } from '../common/SkillChipGroup';
import { DeployableRolesGroup } from '../common/DeployableRolesGroup';

const SKILL_CATEGORY_ORDER = [
  'Frontend',
  'Backend',
  'Database',
  'Cloud',
  'Data',
  'DevOps & Tools',
  'Domain Expertise',
];

interface ExpandedSkillsSectionProps {
  skills: TechnicalSkill[];
}

const ExpandedSkillsSection: React.FC<ExpandedSkillsSectionProps> = ({ skills = [] }) => {
  const [showAll, setShowAll] = useState(false);

  if (!skills || skills.length === 0) {
    return (
      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400 italic">
        <span>Skills:</span>
        <span>No skills recorded</span>
      </div>
    );
  }

  // Group by category
  const grouped = skills.reduce<Record<string, TechnicalSkill[]>>((acc, s) => {
    const cat = s.category?.trim() || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  // Sort categories according to preferred taxonomy order
  const categories = Object.keys(grouped).sort((a, b) => {
    const idxA = SKILL_CATEGORY_ORDER.indexOf(a);
    const idxB = SKILL_CATEGORY_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const totalSkills = skills.length;
  const isCapped = totalSkills > 12 && !showAll;

  // Compute up to 12 skills across categories if capped
  let remainingBudget = isCapped ? 12 : Infinity;
  const displayedCategories: { name: string; skills: TechnicalSkill[]; total: number }[] = [];

  for (const cat of categories) {
    const allCatSkills = grouped[cat];
    if (remainingBudget <= 0) break;
    const take = Math.min(allCatSkills.length, remainingBudget);
    displayedCategories.push({
      name: cat,
      skills: allCatSkills.slice(0, take),
      total: allCatSkills.length,
    });
    remainingBudget -= take;
  }

  return (
    <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
          Total Skills ({totalSkills})
        </span>
        {totalSkills > 12 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowAll(!showAll);
            }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1265FF] hover:underline cursor-pointer"
          >
            {showAll ? (
              <>
                <span>Show less</span>
                <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>Show all ({totalSkills})</span>
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayedCategories.map((cat) => (
          <div key={cat.name} className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-[#475569] bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
              {cat.name} ({cat.total}):
            </span>
            {cat.skills.map((s) => (
              <span
                key={s.id || s.name}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1E40AF] text-[10px] font-medium border border-blue-100"
                title={`${s.name} (${s.proficiency}${s.experienceYears ? ` • ${s.experienceYears}y exp` : ''})`}
              >
                <SkillIcon name={s.name} category={s.category} size="xs" />
                <span>{s.name} ({s.proficiency})</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

interface ExpandedDomainsSectionProps {
  domains?: DomainExpertise[];
}

const ExpandedDomainsSection: React.FC<ExpandedDomainsSectionProps> = ({ domains = [] }) => {
  const [showAll, setShowAll] = useState(false);

  if (!domains || domains.length === 0) {
    return (
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400 italic">
        <span>Domains:</span>
        <span>No domain expertise listed</span>
      </div>
    );
  }

  const total = domains.length;
  const visible = total > 6 && !showAll ? domains.slice(0, 6) : domains;

  return (
    <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
          Domains ({total})
        </span>
        {total > 6 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowAll(!showAll);
            }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1265FF] hover:underline cursor-pointer"
          >
            {showAll ? (
              <>
                <span>Show less</span>
                <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>Show all ({total})</span>
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((d) => (
          <span
            key={d.id || d.domain}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF5FF] text-[#6B21A8] text-[10px] font-medium border border-purple-100"
            title={`${d.domain === 'Others' ? d.customDomain : d.domain} (${d.proficiency}${d.experienceYears ? ` • ${d.experienceYears}y exp` : ''})`}
          >
            <Layers className="w-3 h-3 text-purple-500" />
            <span>
              {d.domain === 'Others' ? d.customDomain : d.domain} ({d.proficiency})
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

interface EmployeeTableProps {
  employees: Employee[];
  totalEmployeesCount?: number;
  onViewEmployee: (emp: Employee) => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (empId: string) => void;
  onExportCsv: (selectedEmployees?: Employee[]) => void;
  onResetFilters: () => void;
}

type SortColumn = 'id' | 'name' | 'designation' | 'businessUnit' | 'totalExperience';

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  onViewEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onExportCsv,
  onResetFilters,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Expandable row detail state (Spectrum UI renderDetail animation)
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<SortColumn>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedEmployees = useMemo(() => {
    const list = [...employees];
    list.sort((a, b) => {
      let valA: any = a[sortColumn as keyof Employee];
      let valB: any = b[sortColumn as keyof Employee];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [employees, sortColumn, sortDirection]);

  const pageSize = 5;
  const totalPages = Math.ceil(sortedEmployees.length / pageSize) || 1;
  const paginatedEmployees = sortedEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isAllSelected = paginatedEmployees.length > 0 && paginatedEmployees.every((e) => selectedIds.includes(e.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paginatedEmployees.some((e) => e.id === id)));
    } else {
      const pageIds = paginatedEmployees.map((e) => e.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectRow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleExpandRow = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const handleExportAll = () => {
    onExportCsv();
  };

  const handleExportSelected = () => {
    const selected = employees.filter((e) => selectedIds.includes(e.id));
    onExportCsv(selected.length > 0 ? selected : undefined);
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => onDeleteEmployee(id));
    setSelectedIds([]);
  };

  return (
    <div className="neumorph-card rounded-2xl overflow-hidden relative">
      {/* Table Header Bar matching Screenshot */}
      <div className="p-4 px-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#DFE5EE]">
        {/* Title + Count pill badge */}
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold text-[#0B1B4D] tracking-tight">
            Employees
          </h2>
          <span className="text-xs bg-blue-100 text-[#1265FF] font-bold px-2.5 py-0.5 rounded-full">
            {employees.length}
          </span>
          {selectedIds.length > 0 && (
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md border border-emerald-100"
            >
              {selectedIds.length} selected
            </motion.span>
          )}
        </div>

        {/* View toggles & Export */}
        <div className="flex items-center gap-3">
          {/* Table / Card View Toggle with smooth indicator */}
          <div className="flex items-center p-0.5 bg-[#F8FAFD] rounded-xl border border-[#DFE5EE]">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#1265FF] shadow-xs border border-blue-100'
                  : 'text-[#64748B] hover:text-[#0B1B4D]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-white text-[#1265FF] shadow-xs border border-blue-100'
                  : 'text-[#64748B] hover:text-[#0B1B4D]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Card</span>
            </button>
          </div>

          {/* Export button */}
          <button
            type="button"
            onClick={selectedIds.length > 0 ? handleExportSelected : handleExportAll}
            className="btn-shake-secondary inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-[#DFE5EE] text-[#0B1B4D] hover:text-[#016DD9] rounded-full text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {employees.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-[#1265FF] flex items-center justify-center mb-3">
            <UserX className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#0B1B4D]">No records found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 mb-4">
            No matching employee records found for your current filter criteria.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="btn-shake px-5 py-2 text-xs font-semibold transition-colors cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'table' ? (
            /* Dense Animated Data Table with Spectrum UI Expandable Row Details */
            <motion.div
              key="table-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-x-auto"
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFD] border-b border-[#DFE5EE] text-[#64748B] font-semibold select-none">
                    <th className="py-3 px-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded text-[#1265FF] border-slate-300 focus:ring-[#1265FF] cursor-pointer"
                      />
                    </th>

                    <th 
                      onClick={() => handleSort('id')}
                      className="py-3 px-3 w-28 font-semibold cursor-pointer hover:text-[#0B1B4D] transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Employee ID</span>
                        {sortColumn === 'id' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1265FF]" /> : <ArrowDown className="w-3 h-3 text-[#1265FF]" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60" />
                        )}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('name')}
                      className="py-3 px-4 min-w-[170px] font-semibold cursor-pointer hover:text-[#0B1B4D] transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Employee</span>
                        {sortColumn === 'name' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1265FF]" /> : <ArrowDown className="w-3 h-3 text-[#1265FF]" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60" />
                        )}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('designation')}
                      className="py-3 px-3 min-w-[120px] font-semibold cursor-pointer hover:text-[#0B1B4D] transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Designation</span>
                        {sortColumn === 'designation' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1265FF]" /> : <ArrowDown className="w-3 h-3 text-[#1265FF]" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60" />
                        )}
                      </div>
                    </th>

                    <th 
                      onClick={() => handleSort('businessUnit')}
                      className="py-3 px-3 min-w-[110px] font-semibold cursor-pointer hover:text-[#0B1B4D] transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Practice</span>
                        {sortColumn === 'businessUnit' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1265FF]" /> : <ArrowDown className="w-3 h-3 text-[#1265FF]" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60" />
                        )}
                      </div>
                    </th>

                    <th className="py-3 px-3 min-w-[110px] font-semibold">Location</th>
                    <th className="py-3 px-4 min-w-[210px] font-semibold">Primary Skills</th>

                    <th 
                      onClick={() => handleSort('totalExperience')}
                      className="py-3 px-3 w-28 font-semibold cursor-pointer hover:text-[#0B1B4D] transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Experience</span>
                        {sortColumn === 'totalExperience' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#1265FF]" /> : <ArrowDown className="w-3 h-3 text-[#1265FF]" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-60" />
                        )}
                      </div>
                    </th>

                    <th className="py-3 px-4 w-16 text-center font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#DFE5EE]">
                  {paginatedEmployees.map((emp, index) => {
                    const isChecked = selectedIds.includes(emp.id);
                    const isExpanded = expandedRowId === emp.id;
                    const initials = emp.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2);

                    return (
                      <React.Fragment key={emp.id}>
                        {/* Animated Table Row */}
                        <motion.tr
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22, delay: index * 0.035, ease: [0.16, 1, 0.3, 1] }}
                          onClick={() => toggleExpandRow(emp.id)}
                          className={`hover:bg-blue-50/50 transition-colors group cursor-pointer ${
                            isChecked ? 'bg-blue-50/30' : isExpanded ? 'bg-slate-50/70' : 'bg-white'
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => toggleSelectRow(emp.id, e as any)}
                              className="w-4 h-4 rounded text-[#1265FF] border-slate-300 focus:ring-[#1265FF] cursor-pointer"
                            />
                          </td>

                          {/* Employee ID with chevron */}
                          <td className="py-4 px-3 font-medium text-[#0B1B4D]">
                            <div className="flex items-center gap-2">
                              <span className="text-[#94A3B8] group-hover:text-[#1265FF] transition-colors">
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                                )}
                              </span>
                              <span>{emp.id}</span>
                            </div>
                          </td>

                          {/* Employee Name + Avatar + Email */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                                emp.avatarColor || 'bg-blue-100 text-[#1265FF]'
                              }`}>
                                {initials}
                              </div>
                              <div>
                                <div className="font-bold text-[#0B1B4D] group-hover:text-[#1265FF] transition-colors">
                                  {emp.name}
                                </div>
                                <div className="text-[11px] text-[#64748B]">
                                  {emp.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Designation */}
                          <td className="py-4 px-3 text-[#0B1B4D] font-normal leading-tight">
                            {emp.designation?.trim() || '—'}
                          </td>

                          {/* Practice */}
                          <td className="py-4 px-3 text-[#0B1B4D] font-normal">
                            {emp.businessUnit?.trim() || '—'}
                          </td>

                          {/* Location */}
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-1.5 text-[#64748B]">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{emp.location?.trim() || '—'}</span>
                            </div>
                          </td>

                          {/* Primary Skills */}
                          <td className="py-4 px-4 min-w-[210px]">
                            <SkillChipGroup
                              skills={emp.technicalSkills}
                              maxVisible={2}
                              popoverTitle={`${emp.name}'s Total Skills`}
                            />
                          </td>

                          {/* Experience */}
                          <td className="py-4 px-3 text-[#0B1B4D] font-normal whitespace-nowrap">
                            {emp.totalExperience} Years
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setActiveMenuId(activeMenuId === emp.id ? null : emp.id)}
                              className="p-1 rounded-md text-[#94A3B8] hover:text-[#0B1B4D] hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === emp.id && (
                              <div className="absolute right-4 top-10 w-36 bg-white rounded-xl shadow-xl border border-[#DFE5EE] p-1.5 z-30 text-left text-xs animate-in fade-in duration-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onViewEmployee(emp);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-[#0B1B4D] transition-colors text-left cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#64748B]" />
                                  <span>View Profile</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onEditEmployee(emp);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-[#0B1B4D] transition-colors text-left cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-[#64748B]" />
                                  <span>Edit Profile</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteEmployee(emp.id);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors text-left cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </motion.tr>

                        {/* Spectrum UI Expandable Row Details (renderDetail Accordion Animation) */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr key={`${emp.id}-detail`} className="bg-slate-50/70">
                              <td colSpan={9} className="p-0 border-b border-[#DFE5EE]">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                  className="overflow-hidden px-8 py-5"
                                >
                                  <div className="bg-white rounded-xl p-4 border border-[#DFE5EE] shadow-2xs">
                                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                                      <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-[#1265FF]" />
                                        <span className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider">
                                          Capability & Assignment Details — {emp.name}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onViewEmployee(emp);
                                        }}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#1265FF] hover:underline cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Open Full Profile Dossier</span>
                                      </button>
                                    </div>

                                    {/* Metadata 5-Column DL matching Spectrum UI renderDetail */}
                                    <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
                                      <div>
                                        <dt className="text-[11px] font-medium text-[#64748B]">Reporting Manager</dt>
                                        <dd className="mt-1 font-semibold text-[#0B1B4D]">
                                          {emp.reportingManager?.trim() ? (
                                            <div>
                                              <div>{emp.reportingManager.trim()}</div>
                                              {emp.reportingManagerEmail?.trim() && (
                                                <div className="text-[11px] text-[#64748B] font-normal">
                                                  {emp.reportingManagerEmail.trim()}
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            '—'
                                          )}
                                        </dd>
                                      </div>

                                      <div>
                                        <dt className="text-[11px] font-medium text-[#64748B]">Current Project / Customer</dt>
                                        <dd className="mt-1 font-semibold text-[#0B1B4D]">
                                          {[emp.currentProject?.trim(), emp.currentCustomer?.trim()].filter(Boolean).join(' • ') || '—'}
                                        </dd>
                                      </div>

                                      <div>
                                        <dt className="text-[11px] font-medium text-[#64748B]">Deployable Roles</dt>
                                        <dd className="mt-1">
                                          <DeployableRolesGroup roles={emp.deployableRoles} maxVisible={3} />
                                        </dd>
                                      </div>

                                      <div>
                                        <dt className="text-[11px] font-medium text-[#64748B]">Total Skills</dt>
                                        <dd className="mt-1 font-semibold text-emerald-600">
                                          {(emp.technicalSkills?.length || 0) + (emp.domainExpertise?.length || 0)} Standardized Skills
                                        </dd>
                                      </div>

                                      <div>
                                        <dt className="text-[11px] font-medium text-[#64748B]">Profile Completion</dt>
                                        <dd className="mt-1 flex items-center gap-2">
                                          <span className="font-bold text-[#0B1B4D]">
                                            {emp.profileCompletion}%
                                          </span>
                                          <div className="w-16 h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                                            <div
                                              style={{ width: `${emp.profileCompletion}%` }}
                                              className={`h-full rounded-full ${
                                                emp.profileCompletion >= 80
                                                  ? 'bg-[#10B981]'
                                                  : emp.profileCompletion >= 50
                                                  ? 'bg-[#F59E0B]'
                                                  : 'bg-[#EF4444]'
                                              }`}
                                            />
                                          </div>
                                          {emp.profileCompletion >= 80 ? (
                                            <span title={emp.status} className="inline-flex">
                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            </span>
                                          ) : (
                                            <span title={emp.status} className="inline-flex">
                                              <AlertCircle
                                                className={`w-3.5 h-3.5 shrink-0 ${
                                                  emp.profileCompletion >= 50 ? 'text-amber-500' : 'text-rose-500'
                                                }`}
                                              />
                                            </span>
                                          )}
                                        </dd>
                                      </div>
                                    </dl>

                                    {/* Skills grouped by category with 12-limit toggle */}
                                    <ExpandedSkillsSection skills={emp.technicalSkills} />

                                    {/* Domain Expertise with 6-limit toggle */}
                                    <ExpandedDomainsSection domains={emp.domainExpertise} />
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          ) : (
            /* Animated Card View Mode */
            <motion.div
              key="card-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {paginatedEmployees.map((emp, index) => (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: index * 0.04 }}
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  className="bg-white rounded-2xl p-4 border border-[#DFE5EE] hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-2xs ${
                          emp.avatarColor || 'bg-blue-100 text-[#1265FF]'
                        }`}>
                          {emp.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <h4 
                            className="font-bold text-sm text-[#0B1B4D] hover:text-[#1265FF] cursor-pointer" 
                            onClick={() => onViewEmployee(emp)}
                          >
                            {emp.name}
                          </h4>
                          <div className="text-xs text-[#64748B]">{emp.designation?.trim() || '—'}</div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#64748B] bg-slate-100 px-2 py-0.5 rounded">
                        {emp.id}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between text-[#64748B]">
                        <span>Practice:</span>
                        <span className="font-medium text-[#0B1B4D]">{emp.businessUnit?.trim() || '—'}</span>
                      </div>
                      <div className="flex justify-between text-[#64748B]">
                        <span>Experience:</span>
                        <span className="font-medium text-[#0B1B4D]">{emp.totalExperience || 0} Years</span>
                      </div>
                      <div className="flex justify-between text-[#64748B]">
                        <span>Location:</span>
                        <span className="font-medium text-[#0B1B4D]">{emp.location?.trim() || '—'}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-[11px] font-semibold text-[#64748B] uppercase mb-1.5">
                        Total Skills ({(emp.technicalSkills?.length || 0) + (emp.domainExpertise?.length || 0)})
                      </div>
                      <SkillChipGroup
                        skills={emp.technicalSkills}
                        maxVisible={3}
                        popoverTitle={`${emp.name}'s Total Skills`}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0B1B4D]">
                        {emp.profileCompletion}% Complete
                      </span>
                      {emp.profileCompletion >= 80 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onViewEmployee(emp)}
                        className="p-1.5 text-[#64748B] hover:text-[#1265FF] hover:bg-blue-50 rounded-lg cursor-pointer"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditEmployee(emp)}
                        className="p-1.5 text-[#64748B] hover:text-[#1265FF] hover:bg-blue-50 rounded-lg cursor-pointer"
                        title="Edit Profile"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Pagination Footer matching exact screenshot */}
      <div className="p-4 px-6 border-t border-[#DFE5EE] flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748B]">
        <div>
          Showing {employees.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} –{' '}
          {Math.min(currentPage * pageSize, employees.length)} of {employees.length} employees
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-lg border border-[#DFE5EE] hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[#64748B] cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => setCurrentPage(pageNum)}
              className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-all cursor-pointer ${
                currentPage === pageNum
                  ? 'bg-[#1265FF] text-white shadow-xs'
                  : 'hover:bg-slate-50 text-[#0B1B4D]'
              }`}
            >
              {pageNum}
            </button>
          ))}

          {totalPages > 6 && (
            <>
              <span className="w-6 text-center text-[#94A3B8]">...</span>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-all cursor-pointer ${
                  currentPage === totalPages
                    ? 'bg-[#1265FF] text-white shadow-xs'
                    : 'hover:bg-slate-50 text-[#0B1B4D]'
                }`}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-lg border border-[#DFE5EE] hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[#64748B] cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Spectrum UI Floating Animated Bulk Actions Capsule Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 32, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0B1B4D] text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-blue-900/60 backdrop-blur-lg"
          >
            <div className="flex items-center gap-2 pr-3 border-r border-slate-700/80 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#1265FF] animate-pulse" />
              <span>{selectedIds.length} employee{selectedIds.length > 1 ? 's' : ''} selected</span>
            </div>

            <button
              type="button"
              onClick={handleExportSelected}
              className="btn-shake-secondary flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-100 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              className="btn-shake-secondary flex items-center gap-1.5 px-3 py-1 bg-rose-950/60 hover:bg-rose-900/80 text-xs font-semibold text-rose-300 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-400 hover:text-slate-200 ml-1 underline cursor-pointer"
              title="Clear selection"
            >
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
;
