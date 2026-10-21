import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Info, Check, Calendar, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { SkillCategory, ProficiencyLevel, TechnicalSkill } from '../../types/skill';
import { ALL_CATEGORIES, PROFICIENCY_LEVELS } from '../../data/skillRegistry';
import { skillService } from '../../services/skillService';
import { SkillIcon } from '../common/SkillIcon';
import { CustomSelect } from '../common/CustomSelect';
import { useToast } from '../common/Toast';
import { useDropdowns } from '../../hooks/useDropdowns';
import { dropdownService } from '../../services/dropdownService';

interface AddSkillDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSkill: (skill: TechnicalSkill) => void;
  initialCategory?: SkillCategory;
  existingSkills?: TechnicalSkill[];
}

export const AddSkillDrawer: React.FC<AddSkillDrawerProps> = ({
  isOpen,
  onClose,
  onAddSkill,
  initialCategory = 'Frontend',
  existingSkills = [],
}) => {
  const { toast } = useToast();
  const { isLoading: dropdownsLoading, isError: dropdownsError, retry: retryDropdowns, ...dropdownOptions } = useDropdowns();
  const skillCategories = (dropdownOptions.skillCategories.length > 0 ? dropdownOptions.skillCategories : ALL_CATEGORIES)
    .filter((c) => c !== 'Domain Expertise');
  const proficiencyLevels = dropdownOptions.proficiencies.length > 0 ? dropdownOptions.proficiencies : [...PROFICIENCY_LEVELS];
  const [category, setCategory] = useState<SkillCategory>(initialCategory);
  const [selectedTechName, setSelectedTechName] = useState('');
  const [techSearch, setTechSearch] = useState('');
  const [isTechDropdownOpen, setIsTechDropdownOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customTechInput, setCustomTechInput] = useState('');

  const [proficiency, setProficiency] = useState<ProficiencyLevel>('Intermediate');
  const [experienceYears, setExperienceYears] = useState<number | string>(2.0);
  const [lastUsed, setLastUsed] = useState<string>('');
  const [lastProject, setLastProject] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  // Sync category when initialCategory prop changes
  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  // Auto-activate custom input mode when catalog has no skills for this category
  useEffect(() => {
    if (isOpen) {
      const list = skillService.getByCategory(category) || [];
      if (list.length === 0) {
        setIsCustomMode(true);
      }
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const catalogSkills = skillService.getByCategory(category) || [];
  const filteredCatalog = catalogSkills.filter((s) =>
    (s?.name || '').toLowerCase().includes((techSearch || '').toLowerCase())
  );

  const handleSelectTech = (tech: string) => {
    setSelectedTechName(tech);
    setIsTechDropdownOpen(false);
    setIsCustomMode(false);
    setErrorMsg('');
  };

  const handleAddNewCustomTech = () => {
    if (!customTechInput.trim()) return;
    const added = skillService.addSkill({
      name: customTechInput.trim(),
      category: category,
    });
    setSelectedTechName(added.name);
    setCustomTechInput('');
    setIsCustomMode(false);
    setIsTechDropdownOpen(false);
    toast(`Registered "${added.name}" in ${category} catalog`, 'success', 'Skill Catalog');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTechName = isCustomMode ? customTechInput.trim() : selectedTechName.trim();

    if (!finalTechName) {
      setErrorMsg('Please select or enter a technology/skill.');
      toast('Please select or enter a technology/skill.', 'error', 'Missing Skill');
      return;
    }

    // Check duplicate in existing skills
    const isDuplicate = existingSkills.some(
      (s) => s.name.toLowerCase() === finalTechName.toLowerCase() && s.category === category
    );
    if (isDuplicate) {
      setErrorMsg(`"${finalTechName}" is already added to this profile under ${category}.`);
      toast(`"${finalTechName}" is already added to this profile.`, 'warning', 'Duplicate Skill');
      return;
    }

    // Register to catalog if custom
    if (isCustomMode && customTechInput.trim()) {
      skillService.addSkill({
        name: customTechInput.trim(),
        category,
      });
    }

    const newSkill: TechnicalSkill = {
      id: 'skill_' + Math.random().toString(36).substring(2, 9),
      name: finalTechName,
      category,
      proficiency,
      experienceYears: Number(experienceYears) || 0,
      lastUsed: lastUsed.trim(),
      lastProject: lastProject.trim(),
      specialization: specialization.trim(),
    };

    onAddSkill(newSkill);
    toast(`Added "${finalTechName}" to ${category} skills`, 'success', 'Skill Added');
    onClose();

    // Reset local form state
    setSelectedTechName('');
    setCustomTechInput('');
    setIsCustomMode(false);
    setLastUsed('');
    setLastProject('');
    setSpecialization('');
    setErrorMsg('');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Blurred Backdrop - Locks background and prevents page scrolling */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Centered Modal Window - Sized to fit comfortably in ONE screen */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[#DFE5EE] overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[min(92vh,680px)]">
        
        {/* Fixed Header */}
        <div className="px-6 py-3.5 border-b border-[#DFE5EE] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#016DD9] border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
              <Layers className="w-5 h-5 text-[#016DD9]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
                Add Technical Skill
              </h2>
              <p className="text-[11px] text-[#64748B]">
                Configure technology competency, experience and proficiency details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#0B1B4D] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body (Only inside the popup scrolls if screen is very short) */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3.5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Top Preview Bar - Compact & Sleek */}
          <div className="p-3 sm:px-4 sm:py-3 rounded-2xl bg-[#F8FAFD] border border-[#E3EAF5] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#016DD9] border border-blue-200 flex items-center justify-center font-bold text-base shadow-2xs shrink-0 overflow-hidden">
                {selectedTechName ? (
                  <SkillIcon name={selectedTechName} category={category} size="sm" />
                ) : (
                  <Sparkles className="w-5 h-5 text-[#016DD9]" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-[#0B1B4D] truncate">
                  {selectedTechName || (isCustomMode && customTechInput) || 'Choose Technology'}
                </h3>
                <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                  Category: <span className="font-semibold text-[#0B1B4D]">{category}</span> • Level:{' '}
                  <span className="font-semibold text-[#016DD9]">{proficiency}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#DFE5EE] text-[#016DD9] hover:bg-blue-50 transition-colors shadow-2xs shrink-0 cursor-pointer"
            >
              {isCustomMode ? 'Choose from list' : '+ Custom Skill'}
            </button>
          </div>

          {/* Form Fields: 2-Column Grid with Compact Spacing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            {/* Col 1: Skill Category */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#0B1B4D] uppercase tracking-wide">
                Skill Category <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={category}
                onChange={(val) => {
                  setCategory(val as SkillCategory);
                  setSelectedTechName('');
                }}
                options={skillCategories}
                placeholder="Select category..."
                size="sm"
                allowOther={true}
                otherPlaceholder="Specify custom skill category..."
                onSaveCustomOption={async (val) => dropdownService.addOption('skill_category', val)}
                isLoading={dropdownsLoading}
                isError={dropdownsError}
                onRetry={retryDropdowns}
              />
            </div>

            {/* Col 2: Technology / Skill Selection */}
            <div className="space-y-1 relative">
              <label className="block text-[11px] font-bold text-[#0B1B4D] uppercase tracking-wide">
                Technology / Skill <span className="text-rose-500">*</span>
              </label>

              {isCustomMode ? (
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTechInput}
                      onChange={(e) => setCustomTechInput(e.target.value)}
                      placeholder={`Enter custom ${category} skill...`}
                      className="flex-1 px-3.5 py-2 bg-[#F8FAFD] focus:bg-white border border-[#E3EAF5] focus:border-[#1265FF] focus:ring-2 focus:ring-blue-100 rounded-xl text-xs md:text-sm text-[#0B1B4D] font-medium focus:outline-none shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCustomTech}
                      className="px-3.5 py-2 bg-blue-50 text-[#1265FF] hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors"
                    >
                      Save to Catalog
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Select Trigger Box */}
                  <div
                    onClick={() => setIsTechDropdownOpen(!isTechDropdownOpen)}
                    className="w-full flex items-center justify-between px-3.5 py-2 bg-[#F8FAFD] hover:bg-white border border-[#E3EAF5] focus:border-[#016DD9] rounded-xl text-xs md:text-sm cursor-pointer shadow-2xs transition-colors"
                  >
                    {selectedTechName ? (
                      <div className="flex items-center gap-2 text-[#0B1B4D] font-semibold truncate">
                        <SkillIcon name={selectedTechName} category={category} size="sm" />
                        <span className="truncate">{selectedTechName}</span>
                      </div>
                    ) : (
                      <span className="text-[#94A3B8]">Select a technology...</span>
                    )}
                    <span className="text-[10px] text-[#94A3B8] ml-2">▼</span>
                  </div>

                  {/* Dropdown Popover */}
                  {isTechDropdownOpen && (
                    <div className="absolute top-full mt-1.5 left-0 right-0 z-30 bg-white rounded-2xl shadow-xl border border-[#DFE5EE] p-2 animate-in fade-in duration-100">
                      <div className="flex items-center px-2.5 py-1.5 bg-[#F8FAFD] rounded-xl border border-[#E3EAF5] mb-2">
                        <Search className="w-3.5 h-3.5 text-[#94A3B8] mr-2 shrink-0" />
                        <input
                          autoFocus
                          type="text"
                          value={techSearch}
                          onChange={(e) => setTechSearch(e.target.value)}
                          placeholder={`Search ${category.toLowerCase()} skills...`}
                          className="w-full bg-transparent text-xs text-[#0B1B4D] focus:outline-none"
                        />
                      </div>

                      <div className="max-h-44 overflow-y-auto space-y-1">
                        {filteredCatalog.map((item) => (
                          <div
                            key={item.name}
                            onClick={() => handleSelectTech(item.name)}
                            className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                              selectedTechName === item.name
                                ? 'bg-blue-50 text-[#016DD9] font-bold'
                                : 'hover:bg-slate-50 text-[#0B1B4D]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <SkillIcon name={item.name} category={category} size="sm" />
                              <span className="truncate">{item.name}</span>
                            </div>
                            {selectedTechName === item.name && (
                              <Check className="w-4 h-4 text-[#016DD9] shrink-0" />
                            )}
                          </div>
                        ))}

                        {filteredCatalog.length === 0 && (
                          <div className="p-3 text-center space-y-2">
                            <p className="text-xs text-[#64748B]">No matching skills in {category}.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomMode(true);
                                setIsTechDropdownOpen(false);
                                setCustomTechInput(techSearch);
                              }}
                              className="px-3 py-1.5 bg-blue-50 text-[#1265FF] hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              + Enter Custom Skill
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Col 1: Proficiency Level */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#0B1B4D] uppercase tracking-wide">
                Proficiency Level <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={proficiency}
                onChange={(val) => setProficiency(val as ProficiencyLevel)}
                options={proficiencyLevels}
                placeholder="Select proficiency..."
                size="sm"
                allowOther={false}
              />
            </div>

            {/* Col 2: Total Experience (Years) */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#0B1B4D] uppercase tracking-wide">
                Experience (Years) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="30"
                placeholder="0"
                value={experienceYears}
                onChange={(e) => {
                  const val = e.target.value;
                  setExperienceYears(val === '' ? '' : val);
                }}
                className="w-full px-3.5 py-2 bg-[#F8FAFD] hover:bg-white focus:bg-white border border-[#E3EAF5] focus:border-[#016DD9] rounded-xl text-xs md:text-sm text-[#0B1B4D] font-medium focus:outline-none transition-all shadow-2xs"
              />
            </div>

            {/* Col 1: Last Used (Month / Year) */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#0B1B4D] uppercase tracking-wide">
                Last Used (Month / Year) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={lastUsed}
                  onChange={(e) => setLastUsed(e.target.value)}
                  placeholder="e.g. Oct 2026 or Current"
                  className="w-full pl-9 pr-3.5 py-2 bg-[#F8FAFD] hover:bg-white focus:bg-white border border-[#E3EAF5] focus:border-[#016DD9] rounded-xl text-xs md:text-sm text-[#0B1B4D] font-medium focus:outline-none transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Col 2: Last Project */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#0B1B4D] uppercase tracking-wide">
                Last Project / Client
              </label>
              <input
                type="text"
                value={lastProject}
                onChange={(e) => setLastProject(e.target.value)}
                placeholder="e.g. L&D Portal, Client Platform"
                className="w-full px-3.5 py-2 bg-[#F8FAFD] hover:bg-white focus:bg-white border border-[#E3EAF5] focus:border-[#016DD9] rounded-xl text-xs md:text-sm text-[#0B1B4D] font-medium focus:outline-none transition-all shadow-2xs"
              />
            </div>

            {/* Full Width (Spans 2 Cols): Specialization */}
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-[11px] font-bold text-[#0B1B4D] uppercase tracking-wide">
                Specialization / Focus Area
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Responsive Architecture, State Management, Cloud Deployment"
                className="w-full px-3.5 py-2 bg-[#F8FAFD] hover:bg-white focus:bg-white border border-[#E3EAF5] focus:border-[#016DD9] rounded-xl text-xs md:text-sm text-[#0B1B4D] font-medium focus:outline-none transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Info Notice Box - Compact */}
          <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2 text-xs text-[#0B1B4D]">
            <Info className="w-3.5 h-3.5 text-[#016DD9] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#64748B] leading-relaxed">
              Approved skills are standardized across corporate L&D taxonomy. To request new skill additions, notify your practice leads.
            </div>
          </div>
        </form>

        {/* Fixed Modal Footer - Always visible on screen, never cut off */}
        <div className="px-6 py-3.5 border-t border-[#DFE5EE] bg-[#F8FAFD] flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-shake-secondary px-5 py-2 rounded-full border border-[#DFE5EE] bg-white hover:bg-slate-50 text-xs font-semibold text-[#64748B] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-shake inline-flex items-center gap-2 px-6 py-2 text-xs md:text-sm font-bold shadow-md shadow-blue-500/25 cursor-pointer"
          >
            <span>Add to Profile</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
