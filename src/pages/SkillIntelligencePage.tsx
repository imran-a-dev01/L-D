import React, { useState } from 'react';
import { 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Edit2, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  Sparkles,
  Layout,
  Server,
  Database,
  Cloud,
  BarChart3,
  Wrench,
  Briefcase
} from 'lucide-react';
import { SkillCategory, TechnicalSkill } from '../types/skill';
import { SkillIcon } from '../components/common/SkillIcon';
import { AddSkillDrawer } from '../components/skills/AddSkillDrawer';
import { useToast } from '../components/common/Toast';
import { useDropdowns } from '../hooks/useDropdowns';

interface SkillIntelligencePageProps {
  skills: TechnicalSkill[];
  onAddSkill: (skill: TechnicalSkill) => void;
  onDeleteSkill: (skillId: string) => void;
  onEditSkill: (skill: TechnicalSkill) => void;
}

export const SkillIntelligencePage: React.FC<SkillIntelligencePageProps> = ({
  skills,
  onAddSkill,
  onDeleteSkill,
  onEditSkill,
}) => {
  const { toast } = useToast();
  const dropdownOptions = useDropdowns();
  const allCategories = dropdownOptions.skillCategories.length > 0 ? dropdownOptions.skillCategories : [] as string[];
  const [activeTab, setActiveTab] = useState<SkillCategory | 'All'>('Frontend');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ['Frontend', 'Backend', 'Database', 'Cloud', 'Data', 'DevOps & Tools', 'Domain Expertise'].forEach((cat, i) => {
      initial[cat] = i === 0;
    });
    return initial;
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDrawerCategory, setSelectedDrawerCategory] = useState<SkillCategory>('Frontend');

  const toggleSection = (cat: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const openAddDrawer = (cat: SkillCategory) => {
    setSelectedDrawerCategory(cat);
    setIsDrawerOpen(true);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Frontend': return Layout;
      case 'Backend': return Server;
      case 'Database': return Database;
      case 'Cloud': return Cloud;
      case 'Data': return BarChart3;
      case 'DevOps & Tools': return Wrench;
      case 'Domain Expertise': return Briefcase;
      default: return Layout;
    }
  };

  const getCategoryDescription = (cat: string) => {
    switch (cat) {
      case 'Frontend': return 'Manage frontend technologies and frameworks';
      case 'Backend': return 'Manage backend technologies and frameworks';
      case 'Database': return 'Manage database technologies';
      case 'Cloud': return 'Manage cloud platforms and services';
      case 'Data': return 'Manage data platforms and tools';
      case 'DevOps & Tools': return 'Manage DevOps tools and CI/CD platforms';
      case 'Domain Expertise': return 'Manage domain knowledge and industry expertise';
      default: return 'Manage workforce skills';
    }
  };

  const getProficiencyBadgeClass = (p: string) => {
    switch (p) {
      case 'Expert': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Advanced': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Intermediate': return 'bg-blue-50 text-[#1265FF] border-blue-200';
      case 'Beginner': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const displayedCategories = activeTab === 'All' ? allCategories : [activeTab];

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5 mb-1">
            <span>Skill Intelligence</span>
            <span>›</span>
            <span className="text-[#0B1B4D]">Technical Skills</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0B1B4D] tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            Technical Skills
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Standardize capability data across the workforce
          </p>
        </div>

        {/* Right Info Widget: Circular Completeness Ring */}
        <div className="flex items-center gap-4">
          {(() => {
            const filledCategories = allCategories.filter((cat) => skills.some((s) => s.category === cat)).length;
            const totalCategories = allCategories.length;
            const completenessPercent = totalCategories > 0 ? Math.round((filledCategories / totalCategories) * 100) : 0;
            return (
              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-[#E3EAF5] shadow-2xs">
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#1265FF]"
                      strokeDasharray={`${completenessPercent}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[11px] font-extrabold text-[#0B1B4D]">{completenessPercent}%</span>
                </div>
                <div className="text-left text-xs">
                  <div className="font-bold text-[#0B1B4D]">Taxonomy Coverage</div>
                  <div className="text-[11px] text-[#64748B]">{filledCategories} of {totalCategories} skill categories filled</div>
                  <a href="#details" onClick={(e) => { e.preventDefault(); toast('All core skill taxonomy metrics verified', 'info', 'Taxonomy Verified'); }} className="text-[11px] font-semibold text-[#1265FF] hover:underline cursor-pointer">
                    View Details →
                  </a>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Category Tabs (Matches Screenshot 3) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E3EAF5]">
        {allCategories.map((cat) => {
          const Icon = getCategoryIcon(cat);
          const isActive = activeTab === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveTab(cat as SkillCategory | 'All');
                setExpandedSections((prev) => ({ ...prev, [cat]: true }));
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 text-[#1265FF] border border-blue-200 shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0B1B4D] hover:bg-slate-100/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#1265FF]' : 'text-[#64748B]'}`} />
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Accordion Categories List */}
      <div className="space-y-4">
        {displayedCategories.map((cat) => {
          const Icon = getCategoryIcon(cat);
          const isExpanded = !!expandedSections[cat];
          const catSkills = skills.filter((s) => s.category === cat);

          return (
            <div
              key={cat}
              className="bg-white rounded-2xl border border-[#E3EAF5] shadow-xs overflow-hidden transition-all duration-150"
            >
              {/* Category Accordion Header */}
              <div className="p-4 md:p-5 flex items-center justify-between gap-4 bg-white border-b border-slate-100">
                <div 
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => toggleSection(cat)}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1265FF] border border-blue-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0B1B4D] flex items-center gap-2">
                      <span>{cat} Skills</span>
                      <span className="text-xs font-normal text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-md">
                        {catSkills.length} skills
                      </span>
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {getCategoryDescription(cat)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAddDrawer(cat as SkillCategory)}
                    className="btn-shake inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Skill</span>
                  </button>

                  <button
                    onClick={() => toggleSection(cat)}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0B1B4D] hover:bg-slate-100 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Table Body when Expanded */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  {catSkills.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#64748B]">
                      No skills added to {cat} yet.{' '}
                      <button
                        onClick={() => openAddDrawer(cat as SkillCategory)}
                        className="text-[#1265FF] font-semibold hover:underline ml-1"
                      >
                        + Add first skill
                      </button>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#F8FAFD] border-b border-[#E3EAF5] text-[#64748B] font-semibold">
                          <th className="py-3 px-5">Skill</th>
                          <th className="py-3 px-3">Experience (Years)</th>
                          <th className="py-3 px-3">Proficiency</th>
                          <th className="py-3 px-3">Last Used</th>
                          <th className="py-3 px-3">Last Project</th>
                          <th className="py-3 px-3">Specialization</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E3EAF5]">
                        {catSkills.map((skill) => (
                          <tr key={skill.id} className="hover:bg-blue-50/30 transition-colors">
                            {/* Skill with Icon */}
                            <td className="py-3.5 px-5 font-bold text-[#0B1B4D]">
                              <div className="flex items-center gap-2.5">
                                <SkillIcon name={skill.name} category={cat as SkillCategory} size="sm" />
                                <span>{skill.name}</span>
                              </div>
                            </td>

                            {/* Experience */}
                            <td className="py-3.5 px-3 font-medium text-[#0B1B4D]">
                              {skill.experienceYears}
                            </td>

                            {/* Proficiency Badge */}
                            <td className="py-3.5 px-3">
                              <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getProficiencyBadgeClass(skill.proficiency)}`}>
                                {skill.proficiency}
                              </span>
                            </td>

                            {/* Last Used */}
                            <td className="py-3.5 px-3 text-[#64748B]">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>{skill.lastUsed}</span>
                              </div>
                            </td>

                            {/* Last Project */}
                            <td className="py-3.5 px-3 text-[#0B1B4D]">
                              {skill.lastProject || '—'}
                            </td>

                            {/* Specialization */}
                            <td className="py-3.5 px-3 text-[#64748B]">
                              {skill.specialization || '—'}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    openAddDrawer(cat as SkillCategory);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-[#1265FF] hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit Skill"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    onDeleteSkill(skill.id);
                                    toast(`Removed "${skill.name}" from taxonomy catalog`, 'info', 'Skill Removed');
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Skill"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Skill Drawer Component */}
      <AddSkillDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        initialCategory={selectedDrawerCategory}
        onAddSkill={onAddSkill}
        existingSkills={skills}
      />
    </div>
  );
};
