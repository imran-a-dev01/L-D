import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  MapPin, 
  Mail, 
  Briefcase, 
  Calendar, 
  Edit2, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Award,
  Hash,
  Share2,
  Search,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import { Employee } from '../../types/employee';
import { SkillIcon } from '../common/SkillIcon';
import { ChipList } from '../common/ChipList';
import { useToast } from '../common/Toast';
import { api } from '../../services/api';

interface EmployeeProfileModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
}

const PROFICIENCY_BADGES: Record<string, string> = {
  Expert: 'bg-purple-50 text-purple-700 border-purple-200',
  Advanced: 'bg-blue-50 text-blue-700 border-blue-200',
  Intermediate: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Beginner: 'bg-slate-50 text-slate-700 border-slate-200',
};

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employee,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [skillSearch, setSkillSearch] = useState<string>('');
  const [showAllDomains, setShowAllDomains] = useState<boolean>(false);

  const [customFieldLabels, setCustomFieldLabels] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!employee?.customData || Object.keys(employee.customData).length === 0) return;
    (async () => {
      try {
        const res = await api.getCustomFields();
        const map: Record<string, string> = {};
        for (const f of res.fields) map[String(f.id)] = f.label;
        setCustomFieldLabels(map);
      } catch { /* silent */ }
    })();
  }, [employee?.customData]);

  // Lock background body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Reset local search and category when switching employees
  useEffect(() => {
    setSelectedCategory('All');
    setSkillSearch('');
    setShowAllDomains(false);
  }, [employee?.id]);

  // Combined list of technical skills and domain expertise
  const allCombinedSkills = useMemo(() => {
    const tech = (employee?.technicalSkills || []).map((s) => ({
      id: s.id || s.name,
      name: s.name,
      category: s.category || 'Other',
      proficiency: s.proficiency,
      experienceYears: s.experienceYears || 0,
      lastUsed: s.lastUsed,
      lastProject: s.lastProject,
      specialization: s.specialization,
      isDomain: false,
    }));
    const domain = (employee?.domainExpertise || []).map((d) => ({
      id: d.id ? `domain_${d.id}` : `domain_${d.domain}`,
      name: d.domain === 'Others' ? d.customDomain || 'Others' : d.domain,
      category: 'Domain',
      proficiency: d.proficiency,
      experienceYears: d.experienceYears || 0,
      lastUsed: d.lastUsed,
      lastProject: d.lastProject,
      specialization: d.specialization,
      isDomain: true,
    }));
    return [...tech, ...domain];
  }, [employee?.technicalSkills, employee?.domainExpertise]);

  // Category counts including Domain
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCombinedSkills.forEach((s) => {
      const cat = s.category?.trim();
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return counts;
  }, [allCombinedSkills]);

  const totalSkillCount = allCombinedSkills.length;

  const categories = useMemo(() => {
    return ['All', ...Object.keys(categoryCounts).sort()];
  }, [categoryCounts]);

  const filteredSkills = useMemo(() => {
    let list = allCombinedSkills;
    if (selectedCategory !== 'All') {
      list = list.filter((s) => s.category?.trim() === selectedCategory);
    }
    if (skillSearch.trim()) {
      const q = skillSearch.toLowerCase().trim();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || (s.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allCombinedSkills, selectedCategory, skillSearch]);

  if (!isOpen || !employee) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overflow-hidden">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-[#E3EAF5] w-full max-w-3xl max-h-[min(90vh,760px)] overflow-y-auto flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Modal Header with Name, ID, status & Actions */}
        <div className="sticky top-0 z-30 p-6 border-b border-[#E3EAF5] flex items-start justify-between bg-white/95 backdrop-blur-md rounded-t-3xl shadow-2xs">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-xs ${
              employee.avatarColor || 'bg-blue-100 text-[#1265FF]'
            }`}>
              {employee.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">
                  {employee.name}
                </h2>
                <span className="text-xs bg-slate-100 text-[#64748B] font-semibold px-2 py-0.5 rounded-md">
                  {employee.id}
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                  employee.status === 'Complete'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : employee.status === 'In Progress'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {employee.status === 'Complete' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  {employee.status}
                </span>
              </div>
              <div className="text-xs text-[#64748B] mt-0.5 flex flex-wrap items-center gap-3">
                <span className="font-semibold text-[#1265FF]">{employee.designation?.trim() || '—'}</span>
                <span>•</span>
                <span>{employee.businessUnit?.trim() || '—'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {employee.location?.trim() || '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(`${employee.name} (${employee.id}) - ${employee.designation} - ${employee.email}`);
                toast(`Profile summary for ${employee.name} copied to clipboard!`, 'success', 'Profile Shared');
              }}
              className="p-1.5 text-[#64748B] hover:text-[#1265FF] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              title="Share / Copy Profile"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(employee)}
              className="btn-shake inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#94A3B8] hover:text-[#0B1B4D] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Key Metric Snapshot - Stat Cards with Real Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#F8FAFD] rounded-xl border border-[#E3EAF5]">
              <div className="text-[11px] text-[#64748B] font-semibold">Total Experience</div>
              <div className="text-lg font-bold text-[#0B1B4D] mt-0.5">{employee.totalExperience || 0} Years</div>
            </div>
            <div className="p-3 bg-[#F8FAFD] rounded-xl border border-[#E3EAF5]">
              <div className="text-[11px] text-[#64748B] font-semibold">Profile Completion</div>
              <div className="text-lg font-bold text-emerald-600 mt-0.5">{employee.profileCompletion || 0}%</div>
            </div>
            <div className="p-3 bg-[#F8FAFD] rounded-xl border border-[#E3EAF5]">
              <div className="text-[11px] text-[#64748B] font-semibold">Total Skills</div>
              <div className="text-lg font-bold text-[#1265FF] mt-0.5">{totalSkillCount} Tracked</div>
            </div>
            <div className="p-3 bg-[#F8FAFD] rounded-xl border border-[#E3EAF5]">
              <div className="text-[11px] text-[#64748B] font-semibold">Deployable Roles</div>
              <div className="text-lg font-bold text-purple-600 mt-0.5">{employee.deployableRoles?.length || 0} Active</div>
            </div>
          </div>

          {/* Role & Allocation Details */}
          <div className="p-4 rounded-2xl bg-white border border-[#E3EAF5] shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider">
              Deployment & Organizational Context
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-[#64748B]">Work Email:</span>
                <span className="font-semibold text-[#0B1B4D]">{employee.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-[#64748B]">Reporting Manager:</span>
                <span className="font-semibold text-[#0B1B4D]">
                  {employee.reportingManager?.trim() ? (
                    <span className="text-right">
                      <span>{employee.reportingManager.trim()}</span>
                      {employee.reportingManagerEmail?.trim() && (
                        <span className="block text-[11px] text-[#64748B] font-normal">{employee.reportingManagerEmail.trim()}</span>
                      )}
                    </span>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-[#64748B]">Current Project:</span>
                <span className="font-semibold text-[#0B1B4D]">{employee.currentProject?.trim() || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-[#64748B]">Current Customer:</span>
                <span className="font-semibold text-[#0B1B4D]">{employee.currentCustomer?.trim() || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-[#64748B]">Current Role:</span>
                <span className="font-semibold text-[#0B1B4D]">{employee.currentRole?.trim() || '—'}</span>
              </div>
            </div>

            {/* Deployable Roles as Chips with Show All Toggle */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-[#64748B] mb-2">
                Deployable Roles ({employee.deployableRoles?.length || 0}):
              </div>
              <ChipList
                items={employee.deployableRoles || []}
                limit={10}
                emptyText="—"
                renderItem={(r) => (
                  <span
                    key={r}
                    className="px-3 py-1 rounded-lg bg-blue-50 text-[#1265FF] border border-blue-200 text-xs font-semibold"
                  >
                    {r}
                  </span>
                )}
              />
            </div>
          </div>

          {/* Custom Fields */}
          {employee.customData && Object.keys(employee.customData).filter((k) => (employee.customData![k] || '').trim()).length > 0 && (
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider">Additional Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.entries(employee.customData)
                  .filter(([, v]) => (v || '').trim())
                  .map(([fieldId, value]) => (
                    <div key={fieldId} className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-[#64748B]">{customFieldLabels[fieldId] || `Field #${fieldId}`}:</span>
                      <span className="font-semibold text-[#0B1B4D]">{value}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Total Skills Section with Category Filter & Search */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider">
                Total Skills ({totalSkillCount})
              </h4>
            </div>

            {/* Category Filter Pills & Search Input */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {categories.map((cat) => {
                    const count = cat === 'All' ? totalSkillCount : categoryCounts[cat] || 0;
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                          isSelected
                            ? 'bg-[#1265FF] text-white shadow-xs'
                            : 'bg-slate-100 text-[#64748B] hover:bg-slate-200/80 hover:text-[#0B1B4D]'
                        }`}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Search input appears only when skills > 8 */}
                {totalSkillCount > 8 && (
                  <div className="relative w-full sm:w-48 shrink-0">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      placeholder="Search skills..."
                      className="w-full pl-8 pr-3 py-1 bg-white border border-[#DFE5EE] rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#1265FF]"
                    />
                  </div>
                )}
              </div>

              {/* 2-Column Responsive Grid of Skill Cards */}
              {filteredSkills.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 italic bg-[#F8FAFD] rounded-xl border border-dashed border-[#DFE5EE]">
                  {totalSkillCount === 0
                    ? '—'
                    : 'No skills found matching search or category'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {filteredSkills.map((s) => (
                    <div
                      key={s.id || s.name}
                      className="p-3 bg-[#F8FAFD] hover:bg-white hover:shadow-xs rounded-xl border border-[#E3EAF5] flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <SkillIcon name={s.name} category={s.category} size="md" />
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-[#0B1B4D] truncate" title={s.name}>
                            {s.name}
                          </div>
                          <div className="text-[11px] text-[#64748B] truncate">
                            {s.category ? `${s.category} • ` : ''}{s.experienceYears || 0}y exp
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                          PROFICIENCY_BADGES[s.proficiency] || 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {s.proficiency || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Domain & Industry Depth Section with 2-Column Grid and Show All Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider">
                Domain & Industry Depth ({employee.domainExpertise?.length || 0})
              </h4>
              {(employee.domainExpertise?.length || 0) > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllDomains(!showAllDomains)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1265FF] hover:underline cursor-pointer"
                >
                  {showAllDomains ? (
                    <>
                      <span>Show less</span>
                      <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <span>Show all ({employee.domainExpertise?.length || 0})</span>
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>

            {(!employee.domainExpertise || employee.domainExpertise.length === 0) ? (
              <div className="p-4 text-center text-xs text-slate-400 italic bg-[#F8FAFD] rounded-xl border border-dashed border-[#DFE5EE]">
                —
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(showAllDomains ? employee.domainExpertise : employee.domainExpertise.slice(0, 6)).map((d) => (
                  <div key={d.id || d.domain} className="p-3 bg-white rounded-xl border border-[#E3EAF5] text-xs">
                    <div className="font-bold text-[#0B1B4D] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{d.domain === 'Others' ? d.customDomain || '—' : d.domain || '—'}</span>
                    </div>
                    <div className="text-[#64748B] mt-0.5">
                      {d.experienceYears || 0} Years • {d.proficiency || '—'}
                    </div>
                    {d.specialization && (
                      <div className="text-slate-500 text-[11px] mt-1 italic">
                        Specialization: {d.specialization}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upskilling & Interests: Immediate & Learning Technologies with ChipList */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="text-xs font-bold text-[#1265FF] mb-2">
                Immediate Technologies ({employee.immediateTechnologies?.length || 0})
              </div>
              <ChipList
                items={employee.immediateTechnologies || []}
                limit={10}
                emptyText="—"
                renderItem={(t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-md text-xs font-semibold text-[#0B1B4D] border border-blue-200"
                  >
                    <SkillIcon name={t} size="xs" />
                    {t}
                  </span>
                )}
              />
            </div>

            <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100">
              <div className="text-xs font-bold text-purple-700 mb-2">
                Learning Technologies ({employee.learningTechnologies?.length || 0})
              </div>
              <ChipList
                items={employee.learningTechnologies || []}
                limit={10}
                emptyText="—"
                renderItem={(t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-md text-xs font-semibold text-purple-700 border border-purple-200"
                  >
                    <SkillIcon name={t} size="xs" />
                    {t}
                  </span>
                )}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-[#E3EAF5] rounded-b-3xl flex items-center justify-between text-xs text-[#64748B]">
          <span>Last updated: {employee.updatedAt}</span>
          <button
            onClick={onClose}
            className="btn-shake-secondary px-5 py-1.5 bg-white border border-[#E3EAF5] hover:bg-slate-100 rounded-full font-semibold text-[#0B1B4D] text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
