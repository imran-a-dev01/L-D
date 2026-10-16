import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Check, 
  CheckCircle2, 
  User, 
  Mail, 
  Award, 
  Briefcase, 
  MapPin, 
  Hash, 
  Lock, 
  Building2, 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  ArrowRight, 
  ArrowLeft,
  X,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles
} from 'lucide-react';
import { Employee } from '../types/employee';
import { TechnicalSkill, DomainExpertise, SkillCategory, ProficiencyLevel } from '../types/skill';
import { ALL_CATEGORIES, PROFICIENCY_LEVELS } from '../data/skillRegistry';

import { SkillIcon } from '../components/common/SkillIcon';
import { AddSkillDrawer } from '../components/skills/AddSkillDrawer';
import { CustomSelect } from '../components/common/CustomSelect';
import { useToast } from '../components/common/Toast';
import { useDropdowns } from '../hooks/useDropdowns';
import { dropdownService } from '../services/dropdownService';
import { employeeService } from '../services/employeeService';

interface CreateEmployeePageProps {
  initialEmployee?: Employee | null;
  onSave: (employee: Employee) => void;
  onCancel: () => void;
  existingIds: string[];
  isSaving?: boolean;
}

export const CreateEmployeePage: React.FC<CreateEmployeePageProps> = ({
  initialEmployee,
  onSave,
  onCancel,
  existingIds,
  isSaving = false,
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Dynamic lookup options synced with SQLite master tables
  const dropdownOptions = useDropdowns();

  // Step 1: Employee Information Fields
  const [id, setId] = useState(initialEmployee?.id || '');
  const [name, setName] = useState(initialEmployee?.name || '');
  const [email, setEmail] = useState(initialEmployee?.email || '');
  const [designation, setDesignation] = useState(initialEmployee?.designation || '');
  const [businessUnit, setBusinessUnit] = useState(initialEmployee?.businessUnit || '');
  const [reportingManager, setReportingManager] = useState(initialEmployee?.reportingManager || '');
  const [currentProject, setCurrentProject] = useState(initialEmployee?.currentProject || '');
  const [currentCustomer, setCurrentCustomer] = useState(initialEmployee?.currentCustomer || '');
  const [location, setLocation] = useState(initialEmployee?.location || '');
  const [totalExperience, setTotalExperience] = useState<number>(initialEmployee?.totalExperience || 0);
  const [currentRole, setCurrentRole] = useState(initialEmployee?.currentRole || '');
  const [owlSureDesignation, setOwlSureDesignation] = useState(initialEmployee?.owlSureDesignation || '');
  const [deployableRoles, setDeployableRoles] = useState<string[]>(
    initialEmployee?.deployableRoles || []
  );

  // Step 2: Technical Skills
  const [technicalSkills, setTechnicalSkills] = useState<TechnicalSkill[]>(
    initialEmployee?.technicalSkills || []
  );
  const [activeCategoryTab, setActiveCategoryTab] = useState<SkillCategory>('Frontend');
  const [isAddSkillDrawerOpen, setIsAddSkillDrawerOpen] = useState(false);

  // Immediate & Learning Technologies
  const [immediateTechnologies, setImmediateTechnologies] = useState<string[]>(
    initialEmployee?.immediateTechnologies || []
  );
  const [learningTechnologies, setLearningTechnologies] = useState<string[]>(
    initialEmployee?.learningTechnologies || []
  );
  const [techChipInput, setTechChipInput] = useState('');
  const [learningChipInput, setLearningChipInput] = useState('');

  // Step 3: Domain Expertise
  const [domainExpertiseList, setDomainExpertiseList] = useState<DomainExpertise[]>(
    initialEmployee?.domainExpertise || []
  );
  const [newDomain, setNewDomain] = useState('');
  const [customDomainText, setCustomDomainText] = useState('');
  const [domainExp, setDomainExp] = useState(2.0);
  const [domainProficiency, setDomainProficiency] = useState<ProficiencyLevel>('Intermediate');
  const [domainLastUsed, setDomainLastUsed] = useState('Oct 2025');
  const [domainProject, setDomainProject] = useState('');
  const [domainSpec, setDomainSpec] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!id.trim()) {
      newErrors.id = 'Employee ID is required';
    } else if (!initialEmployee && existingIds.includes(id.trim().toUpperCase())) {
      newErrors.id = 'Employee ID already exists';
    }

    if (!name.trim()) newErrors.name = 'Employee Name is required';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid Email Address is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) {
        toast('Please resolve the required fields', 'error');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleAddDeployableRole = (role: string) => {
    if (!deployableRoles.includes(role)) {
      setDeployableRoles([...deployableRoles, role]);
    }
  };

  const handleRemoveDeployableRole = (role: string) => {
    setDeployableRoles(deployableRoles.filter((r) => r !== role));
  };

  const handleAddImmediateTech = () => {
    if (techChipInput.trim() && !immediateTechnologies.includes(techChipInput.trim())) {
      setImmediateTechnologies([...immediateTechnologies, techChipInput.trim()]);
      setTechChipInput('');
    }
  };

  const handleAddLearningTech = () => {
    if (learningChipInput.trim() && !learningTechnologies.includes(learningChipInput.trim())) {
      setLearningTechnologies([...learningTechnologies, learningChipInput.trim()]);
      setLearningChipInput('');
    }
  };

  const handleAddDomain = () => {
    const finalDomain = (newDomain === 'Others' || newDomain === '__OTHER__') ? customDomainText.trim() : newDomain.trim();
    if (!finalDomain) {
      toast('Please enter or select a domain', 'error');
      return;
    }

    // Auto-record domain to database
    dropdownService.addOption('domain', finalDomain);

    const entry: DomainExpertise = {
      id: 'de_' + Math.random().toString(36).substring(2, 8),
      domain: finalDomain,
      customDomain: (newDomain === 'Others' || newDomain === '__OTHER__') ? customDomainText.trim() : undefined,
      experienceYears: domainExp,
      proficiency: domainProficiency,
      lastUsed: domainLastUsed,
      lastProject: domainProject || 'Client Project',
      specialization: domainSpec || 'Functional Practice',
    };

    setDomainExpertiseList([...domainExpertiseList, entry]);
    setNewDomain('');
    setCustomDomainText('');
    setDomainProject('');
    setDomainSpec('');
    toast(`Added "${finalDomain}" domain expertise`, 'success');
  };

  const handleSaveDraft = () => {
    if (!id.trim()) {
      toast('Employee ID is required to save a draft', 'error');
      return;
    }
    if (!name.trim()) {
      toast('Employee Name is required to save a draft', 'error');
      return;
    }

    const draftEmployee: Employee = {
      id: id.trim().toUpperCase(),
      name: name.trim(),
      email: email.trim(),
      designation,
      businessUnit,
      reportingManager,
      currentProject,
      currentCustomer,
      location,
      totalExperience: Number(totalExperience) || 0,
      currentRole,
      owlSureDesignation,
      deployableRoles,
      technicalSkills,
      domainExpertise: domainExpertiseList,
      immediateTechnologies,
      learningTechnologies,
      profileCompletion: 0,
      status: 'In Progress',
      updatedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    draftEmployee.profileCompletion = employeeService.calculateCompletion(draftEmployee);
    onSave(draftEmployee);
    toast('Draft saved to database', 'info');
  };

  const handleSaveFinalProfile = () => {
    if (isSaving) return;
    if (!validateStep1()) {
      setCurrentStep(1);
      toast('Please complete required employee information', 'error');
      return;
    }

    const finalEmployee: Employee = {
      id: id.trim().toUpperCase(),
      name: name.trim(),
      email: email.trim(),
      designation,
      businessUnit,
      reportingManager,
      currentProject,
      currentCustomer,
      location,
      totalExperience: Number(totalExperience) || 0,
      currentRole,
      owlSureDesignation,
      deployableRoles,
      technicalSkills,
      domainExpertise: domainExpertiseList,
      immediateTechnologies,
      learningTechnologies,
      profileCompletion: 0,
      status: 'In Progress',
      updatedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };

    finalEmployee.profileCompletion = employeeService.calculateCompletion(finalEmployee);
    finalEmployee.status = finalEmployee.profileCompletion >= 85 ? 'Complete' : (finalEmployee.profileCompletion >= 65 ? 'In Progress' : 'Needs Review');
    onSave(finalEmployee);
  };

  const steps = [
    { num: 1, label: 'Employee Details', sub: 'Basic information' },
    { num: 2, label: 'Technical Skills', sub: 'Add and update skills' },
    { num: 3, label: 'Domain Expertise', sub: 'Industry & functional skills' },
    { num: 4, label: 'Review', sub: 'Verify and submit' },
  ];

  return (
    <div className="space-y-2.5 max-w-6xl mx-auto pb-2">
      {/* Top Header - Compact, clean header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div>
          <div className="text-[11px] font-semibold text-[#64748B] flex items-center gap-1.5">
            <span>Employees</span>
            <span>›</span>
            <span className="text-[#0B1B4D] font-bold">
              {initialEmployee ? 'Edit Employee Profile' : 'Create Employee Profile'}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-[#0B1B4D] tracking-tight font-['Plus_Jakarta_Sans',sans-serif] mt-0.5">
            {initialEmployee ? 'Edit employee profile' : 'Create employee profile'}
          </h1>
        </div>

        {/* Top Right Save Draft & Save Profile Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="btn-shake-secondary inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-[#E3EAF5] rounded-xl text-xs font-semibold text-[#0B1B4D] transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5 text-[#64748B]" />
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>
          <button
            type="button"
            onClick={handleSaveFinalProfile}
            disabled={isSaving}
            className="btn-shake inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold shadow-sm transition-all cursor-pointer rounded-xl bg-[#1265FF] hover:bg-[#0E52D4] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>

      {/* Stepper Bar - Responsive Compact Grid */}
      <div className="bg-white rounded-2xl py-2 px-3 sm:px-5 border border-[#E3EAF5] shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 items-center">
          {steps.map((st, idx) => {
            const isCompleted = currentStep > st.num;
            const isActive = currentStep === st.num;

            return (
              <div
                key={st.num}
                onClick={() => {
                  if (st.num < currentStep || validateStep1()) {
                    setCurrentStep(st.num as 1 | 2 | 3 | 4);
                  }
                }}
                className={`relative flex items-center gap-2.5 p-1.5 rounded-xl transition-all cursor-pointer ${
                  isActive ? 'bg-blue-50/70 ring-1 ring-blue-200' : 'hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 shrink-0 ${
                    isActive
                      ? 'bg-[#1265FF] text-white ring-2 ring-blue-100 shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-[#64748B]'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : st.num}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-xs font-bold truncate ${isActive ? 'text-[#0B1B4D]' : 'text-[#64748B]'}`}>
                    {st.label}
                  </div>
                  <div className="text-[10px] text-[#94A3B8] truncate">{st.sub}</div>
                </div>

                {/* Subtle vertical divider between items for desktop */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-5 bg-slate-200" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Employee Information - Clean, Balanced Single-Screen 3-Column Layout */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E3EAF5] shadow-xs space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-50 text-[#1265FF] font-bold text-xs flex items-center justify-center">
                1
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0B1B4D]">Employee Information</h3>
                <p className="text-xs text-[#64748B] hidden sm:block">Basic details, role context & assignments</p>
              </div>
            </div>
            <span className="text-xs text-[#64748B] flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
              <span className="text-rose-500 font-bold">*</span> Required fields
            </span>
          </div>

          {/* 3-Column Grid: Exactly 4 Clean Rows for all 12 Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 lg:gap-y-5.5">
            
            {/* ROW 1 - Field 1: Employee ID */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#0B1B4D]">
                  Employee ID <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-normal">Unique ID</span>
              </div>
              <input
                type="text"
                value={id}
                onChange={(e) => {
                  setId(e.target.value);
                  if (errors.id) setErrors((prev) => ({ ...prev, id: '' }));
                }}
                placeholder="e.g. EMP00123"
                disabled={!!initialEmployee}
                className={`w-full px-3.5 py-2.5 bg-white border ${
                  errors.id ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200' : 'border-[#E3EAF5] focus:border-[#1265FF] focus:ring-2 focus:ring-blue-100'
                } rounded-xl text-xs sm:text-sm text-[#0B1B4D] font-medium focus:outline-none shadow-2xs h-11 disabled:bg-slate-50 transition-all`}
              />
              {errors.id && <div className="text-[11px] text-rose-500 mt-1">{errors.id}</div>}
            </div>

            {/* ROW 1 - Field 2: Employee Name */}
            <div>
              <label className="block text-xs font-bold text-[#0B1B4D] mb-2">
                Employee Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Imran A"
                  className={`w-full pl-9 pr-3.5 py-2.5 bg-white border ${
                    errors.name ? 'border-rose-400 ring-1 ring-rose-200' : 'border-[#E3EAF5] focus:border-[#1265FF] focus:ring-2 focus:ring-blue-100'
                  } rounded-xl text-xs sm:text-sm text-[#0B1B4D] font-medium focus:outline-none shadow-2xs h-11 transition-all`}
                />
              </div>
              {errors.name && <div className="text-[11px] text-rose-500 mt-1">{errors.name}</div>}
            </div>

            {/* ROW 1 - Field 3: Email Address */}
            <div>
              <label className="block text-xs font-bold text-[#0B1B4D] mb-2">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="imran.a@owlsure.com"
                  className={`w-full pl-9 pr-3.5 py-2.5 bg-white border ${
                    errors.email ? 'border-rose-400 ring-1 ring-rose-200' : 'border-[#E3EAF5] focus:border-[#1265FF] focus:ring-2 focus:ring-blue-100'
                  } rounded-xl text-xs sm:text-sm text-[#0B1B4D] font-medium focus:outline-none shadow-2xs h-11 transition-all`}
                />
              </div>
              {errors.email && <div className="text-[11px] text-rose-500 mt-1">{errors.email}</div>}
            </div>

            {/* ROW 2 - Field 4: Designation / Grade */}
            <div>
              <label className="block text-xs font-bold text-[#0B1B4D] mb-2">
                Designation / Grade <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={designation}
                onChange={(val) => setDesignation(val)}
                options={dropdownOptions.designations}
                icon={<Award className="w-4 h-4" />}
                placeholder="Select designation..."
                allowOther={true}
                size="md"
                otherPlaceholder="Specify custom designation..."
                onSaveCustomOption={async (val) => dropdownService.addOption('designation', val)}
              />
            </div>

            {/* ROW 2 - Field 5: Business Unit / Practice */}
            <div>
              <label className="block text-xs font-bold text-[#0B1B4D] mb-2">
                Business Unit / Practice <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={businessUnit}
                onChange={(val) => setBusinessUnit(val)}
                options={dropdownOptions.practices}
                icon={<Briefcase className="w-4 h-4" />}
                placeholder="Select business unit..."
                allowOther={true}
                size="md"
                otherPlaceholder="Specify custom practice..."
                onSaveCustomOption={async (val) => dropdownService.addOption('business_unit', val)}
              />
            </div>

            {/* ROW 2 - Field 6: Reporting Manager */}
            <div>
              <label className="block text-xs font-bold text-[#0B1B4D] mb-2">
                Reporting Manager <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={reportingManager}
                onChange={(val) => setReportingManager(val)}
                options={dropdownOptions.managers}
                icon={<Mail className="w-4 h-4" />}
                placeholder="Select manager..."
                allowOther={true}
                size="md"
                otherPlaceholder="Specify manager (e.g. Suresh Kumar)..."
                onSaveCustomOption={async (val) => dropdownService.addOption('manager', val, `${val.toLowerCase().replace(/\s/g, '.')}@company.com`)}
              />
            </div>

            {/* ROW 3 - Field 7: Current Project */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <label className="block text-xs font-bold text-[#0B1B4D]">Current Project</label>
                <span title="Active project allocation"><HelpCircle className="w-3.5 h-3.5 text-[#94A3B8]" /></span>
              </div>
              <CustomSelect
                value={currentProject}
                onChange={(val) => setCurrentProject(val)}
                options={dropdownOptions.projects}
                icon={<Briefcase className="w-4 h-4" />}
                placeholder="Select or enter project..."
                allowOther={true}
                size="md"
                otherPlaceholder="Enter project name..."
                onSaveCustomOption={async (val) => dropdownService.addOption('project', val)}
              />
            </div>

            {/* ROW 3 - Field 8: Current Customer */}
            <div>
              <div className="flex items-center gap-1 mb-2">
                <label className="block text-xs font-bold text-[#0B1B4D]">Current Customer</label>
                <span title="Client sponsor"><HelpCircle className="w-3.5 h-3.5 text-[#94A3B8]" /></span>
              </div>
              <CustomSelect
                value={currentCustomer}
                onChange={(val) => setCurrentCustomer(val)}
                options={dropdownOptions.customers}
                icon={<Building2 className="w-4 h-4" />}
                placeholder="Select or enter customer..."
                allowOther={true}
                size="md"
                otherPlaceholder="Enter customer name..."
                onSaveCustomOption={async (val) => dropdownService.addOption('customer', val)}
              />
            </div>

            {/* ROW 3 - Field 9: Location */}
            <div>
              <label className="block text-xs font-bold text-[#0B1B4D] mb-2">
                Location <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={location}
                onChange={(val) => setLocation(val)}
                options={dropdownOptions.locations}
                icon={<MapPin className="w-4 h-4" />}
                placeholder="Select location..."
                allowOther={true}
                size="md"
                otherPlaceholder="Specify custom location..."
                onSaveCustomOption={async (val) => dropdownService.addOption('location', val)}
              />
            </div>

            {/* ROW 4 - Field 10: Total Experience */}
            <div>
              <label className="block text-xs font-bold text-[#0B1B4D] mb-2">
                Total Experience (Years) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="40"
                  value={totalExperience}
                  onChange={(e) => setTotalExperience(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#E3EAF5] focus:border-[#1265FF] focus:ring-2 focus:ring-blue-100 rounded-xl text-xs sm:text-sm text-[#0B1B4D] font-medium focus:outline-none transition-all shadow-2xs h-11"
                />
              </div>
            </div>

            {/* ROW 4 - Field 11: Current Role */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#0B1B4D] truncate">
                  Current Role <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-normal">Internal</span>
              </div>
              <CustomSelect
                value={currentRole}
                onChange={(val) => setCurrentRole(val)}
                options={dropdownOptions.currentRoles}
                icon={<Lock className="w-4 h-4" />}
                placeholder="Select role..."
                allowOther={true}
                size="md"
                otherPlaceholder="Specify custom current role..."
                onSaveCustomOption={async (val) => dropdownService.addOption('current_role', val)}
              />
            </div>

            {/* ROW 4 - Field 12: OwlSure Designation */}
            <div>
              <label className="block text-xs font-bold text-[#0B1B4D] mb-2 truncate">
                Designation as per OwlSure <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={owlSureDesignation}
                onChange={(val) => setOwlSureDesignation(val)}
                options={dropdownOptions.owlsureDesignations}
                icon={<Award className="w-4 h-4" />}
                placeholder="Select OwlSure designation..."
                allowOther={true}
                size="md"
                otherPlaceholder="Specify OwlSure designation..."
                onSaveCustomOption={async (val) => dropdownService.addOption('owlsure_designation', val)}
              />
            </div>

          </div>

          {/* Stepper Footer Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-[#64748B] flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>Step 1 of 4 • Basic details & role context</span>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="btn-shake inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer rounded-xl bg-[#1265FF] hover:bg-[#0E52D4] text-white"
            >
              <span>Continue to Technical Skills</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Technical Skills - Balanced Single-Screen Layout (Spacious & Zero-Scroll) */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAF5] shadow-xs space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1265FF] font-extrabold text-sm flex items-center justify-center">
                2
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0B1B4D]">Technical skills</h3>
                <p className="text-xs text-[#64748B] hidden sm:block">
                  Add and update the employee's technical skills, experience and proficiency levels.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddSkillDrawerOpen(true)}
              className="btn-shake inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer rounded-xl bg-[#1265FF] hover:bg-[#0E52D4] text-white"
            >
              <Plus className="w-4 h-4" />
              <span>Add Skill</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
            {(dropdownOptions.skillCategories.length > 0 ? dropdownOptions.skillCategories : ALL_CATEGORIES)
              .filter((c) => c !== 'Domain Expertise')
              .map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategoryTab(cat as SkillCategory)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategoryTab === cat
                      ? 'bg-blue-50 text-[#1265FF] border border-blue-200 shadow-2xs font-bold'
                      : 'text-[#64748B] hover:text-[#0B1B4D] hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
          </div>

          {/* Table of Skills */}
          <div className="overflow-x-auto rounded-2xl border border-[#E3EAF5]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F8FAFD] border-b border-[#E3EAF5] text-[#64748B] font-bold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Skill</th>
                  <th className="py-3 px-4">Experience (Years)</th>
                  <th className="py-3 px-4">Proficiency</th>
                  <th className="py-3 px-4">Last Used</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3EAF5] bg-white">
                {technicalSkills
                  .filter((s) => s.category === activeCategoryTab)
                  .map((skill, index) => (
                    <tr key={skill.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="py-3 px-4 text-center text-[#64748B] font-semibold">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5 font-bold text-[#0B1B4D]">
                          <SkillIcon name={skill.name} category={skill.category} size="xs" />
                          <span className="text-xs sm:text-sm">{skill.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={skill.experienceYears}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setTechnicalSkills(technicalSkills.map((s) => s.id === skill.id ? { ...s, experienceYears: val } : s));
                          }}
                          className="w-24 px-3 py-1.5 bg-white border border-[#E3EAF5] focus:border-[#1265FF] focus:ring-1 focus:ring-blue-100 rounded-xl text-xs sm:text-sm text-[#0B1B4D] font-medium h-9 transition-all"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={skill.proficiency}
                          onChange={(e) => {
                            const val = e.target.value as ProficiencyLevel;
                            setTechnicalSkills(technicalSkills.map((s) => s.id === skill.id ? { ...s, proficiency: val } : s));
                          }}
                          className="px-3 py-1.5 bg-white border border-[#E3EAF5] focus:border-[#1265FF] focus:ring-1 focus:ring-blue-100 rounded-xl text-xs sm:text-sm font-semibold text-[#0B1B4D] h-9 transition-all"
                        >
                          {(dropdownOptions.proficiencies.length > 0 ? dropdownOptions.proficiencies : PROFICIENCY_LEVELS).map((lvl) => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{skill.lastUsed}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setTechnicalSkills(technicalSkills.filter((s) => s.id !== skill.id))}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Remove skill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {technicalSkills.filter((s) => s.category === activeCategoryTab).length === 0 && (
              <div className="py-8 text-center space-y-1.5">
                <p className="text-xs sm:text-sm text-[#64748B]">
                  No <span className="font-bold text-[#0B1B4D]">{activeCategoryTab}</span> skills added yet.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddSkillDrawerOpen(true)}
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#1265FF] hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add {activeCategoryTab} skill now</span>
                </button>
              </div>
            )}
          </div>

          {/* Immediate Technologies & Learning Technologies */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Immediate Technologies */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0B1B4D]">
                Immediate Technologies (Deployment Ready)
              </label>
              <div className="p-2.5 sm:p-3 bg-[#F8FAFD] rounded-2xl border border-[#E3EAF5] min-h-[46px] flex flex-wrap items-center gap-2">
                {immediateTechnologies.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#E3EAF5] rounded-lg text-xs font-semibold text-[#0B1B4D] shadow-2xs"
                  >
                    <SkillIcon name={tech} size="xs" />
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => setImmediateTechnologies(immediateTechnologies.filter((t) => t !== tech))}
                      className="hover:text-rose-500 cursor-pointer ml-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={techChipInput}
                    onChange={(e) => setTechChipInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImmediateTech())}
                    placeholder="+ Add tech..."
                    className="w-24 text-xs bg-transparent focus:outline-none text-[#0B1B4D] placeholder:text-[#94A3B8] px-1 py-0.5"
                  />
                  {techChipInput && (
                    <button
                      type="button"
                      onClick={handleAddImmediateTech}
                      className="text-xs font-bold text-[#1265FF] hover:underline cursor-pointer"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Learning Technologies */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0B1B4D]">
                Learning Technologies (Upskilling Goals)
              </label>
              <div className="p-2.5 sm:p-3 bg-[#F8FAFD] rounded-2xl border border-[#E3EAF5] min-h-[46px] flex flex-wrap items-center gap-2">
                {learningTechnologies.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-lg text-xs font-semibold text-purple-700 shadow-2xs"
                  >
                    <SkillIcon name={tech} size="xs" />
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => setLearningTechnologies(learningTechnologies.filter((t) => t !== tech))}
                      className="hover:text-rose-500 cursor-pointer ml-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={learningChipInput}
                    onChange={(e) => setLearningChipInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLearningTech())}
                    placeholder="+ Add goal..."
                    className="w-24 text-xs bg-transparent focus:outline-none text-[#0B1B4D] placeholder:text-[#94A3B8] px-1 py-0.5"
                  />
                  {learningChipInput && (
                    <button
                      type="button"
                      onClick={handleAddLearningTech}
                      className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stepper Navigation */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="btn-shake-secondary inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-[#E3EAF5] rounded-xl text-xs sm:text-sm font-semibold text-[#64748B] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="btn-shake inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 cursor-pointer rounded-xl bg-[#1265FF] hover:bg-[#0E52D4] text-white"
            >
              <span>Continue to Domain Expertise</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Domain Expertise - Balanced Single-Screen Layout (Spacious & Zero-Scroll) */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAF5] shadow-xs space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1265FF] font-extrabold text-sm flex items-center justify-center">
                3
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0B1B4D]">Domain expertise</h3>
                <p className="text-xs text-[#64748B] hidden sm:block">
                  Industry domains, functional depth and project delivery experience.
                </p>
              </div>
            </div>
          </div>

          {/* Domain Add Box */}
          <div className="p-4 sm:p-5 bg-[#F8FAFD] rounded-2xl border border-[#E3EAF5] space-y-3.5">
            <div className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider flex items-center gap-2">
              <span>Add Domain Entry</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0B1B4D] mb-1.5">Domain</label>
                <CustomSelect
                  value={newDomain}
                  onChange={(val) => setNewDomain(val)}
                  options={dropdownOptions.domains}
                  placeholder="Select domain..."
                  size="md"
                  onSaveCustomOption={async (val) => dropdownService.addOption('domain', val)}
                />
              </div>

              {newDomain === 'Others' && (
                <div>
                  <label className="block text-xs font-bold text-[#0B1B4D] mb-1.5">Specify Custom Domain</label>
                  <input
                    type="text"
                    value={customDomainText}
                    onChange={(e) => setCustomDomainText(e.target.value)}
                    placeholder="e.g., Supply Chain"
                    className="w-full px-3.5 py-2 bg-white border border-[#E3EAF5] focus:border-[#1265FF] focus:ring-1 focus:ring-blue-100 rounded-xl text-xs sm:text-sm font-medium shadow-2xs focus:outline-none h-11 transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#0B1B4D] mb-1.5">Experience (Years)</label>
                <input
                  type="number"
                  step="0.5"
                  value={domainExp}
                  onChange={(e) => setDomainExp(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E3EAF5] focus:border-[#1265FF] focus:ring-1 focus:ring-blue-100 rounded-xl text-xs sm:text-sm font-medium shadow-2xs focus:outline-none h-11 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1B4D] mb-1.5">Proficiency</label>
                <CustomSelect
                  value={domainProficiency}
                  onChange={(val) => setDomainProficiency(val as ProficiencyLevel)}
                  options={dropdownOptions.proficiencies.length > 0 ? dropdownOptions.proficiencies : [...PROFICIENCY_LEVELS]}
                  placeholder="Select proficiency..."
                  size="md"
                  allowOther={false}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1B4D] mb-1.5">Last Project</label>
                <input
                  type="text"
                  value={domainProject}
                  onChange={(e) => setDomainProject(e.target.value)}
                  placeholder="e.g. Core Policy Admin"
                  className="w-full px-3.5 py-2 bg-white border border-[#E3EAF5] focus:border-[#1265FF] focus:ring-1 focus:ring-blue-100 rounded-xl text-xs sm:text-sm font-medium shadow-2xs focus:outline-none h-11 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B1B4D] mb-1.5">Specialization</label>
                <input
                  type="text"
                  value={domainSpec}
                  onChange={(e) => setDomainSpec(e.target.value)}
                  placeholder="e.g. Claims Settlement"
                  className="w-full px-3.5 py-2 bg-white border border-[#E3EAF5] focus:border-[#1265FF] focus:ring-1 focus:ring-blue-100 rounded-xl text-xs sm:text-sm font-medium shadow-2xs focus:outline-none h-11 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddDomain}
                className="btn-shake inline-flex items-center gap-1.5 px-5 py-2 bg-[#1265FF] hover:bg-[#0D53D6] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Domain Entry</span>
              </button>
            </div>
          </div>

          {/* Domain entries table */}
          <div className="overflow-x-auto rounded-2xl border border-[#E3EAF5]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[#F8FAFD] border-b border-[#E3EAF5] text-[#64748B] font-bold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Experience</th>
                  <th className="py-3 px-4">Proficiency</th>
                  <th className="py-3 px-4">Last Project</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3EAF5] bg-white">
                {domainExpertiseList.map((de) => (
                  <tr key={de.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#0B1B4D]">
                      {de.domain === 'Others' ? de.customDomain || 'Custom Domain' : de.domain}
                    </td>
                    <td className="py-3 px-4 text-[#0B1B4D] font-medium">{de.experienceYears} Years</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1265FF] font-bold border border-blue-200 text-xs">
                        {de.proficiency}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#0B1B4D]">{de.lastProject || '—'}</td>
                    <td className="py-3 px-4 text-[#64748B]">{de.specialization || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setDomainExpertiseList(domainExpertiseList.filter((d) => d.id !== de.id))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Remove domain"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {domainExpertiseList.length === 0 && (
              <div className="py-7 text-center space-y-1 text-xs sm:text-sm text-[#64748B]">
                <p>No domain expertise entries added yet.</p>
                <p className="text-xs text-slate-400">Use the form above to add industry domains and specializations.</p>
              </div>
            )}
          </div>

          {/* Stepper Navigation */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="btn-shake-secondary inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-[#E3EAF5] rounded-xl text-xs sm:text-sm font-semibold text-[#64748B] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="btn-shake inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 cursor-pointer rounded-xl bg-[#1265FF] hover:bg-[#0E52D4] text-white"
            >
              <span>Continue to Final Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Final Review and Summary - Balanced Single-Screen Layout (Spacious & Zero-Scroll) */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAF5] shadow-xs space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1265FF] font-extrabold text-sm flex items-center justify-center">
                4
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0B1B4D]">Review & submit</h3>
                <p className="text-xs text-[#64748B] hidden sm:block">
                  Verify all workforce credentials, skills and delivery roles before final verification.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready for Submission</span>
            </span>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E3EAF5] space-y-1.5">
              <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Employee Identity</div>
              <div className="text-base font-extrabold text-[#0B1B4D] truncate">{name || 'Unnamed'}</div>
              <div className="text-xs text-[#64748B] truncate">{id} • {email}</div>
              <div className="text-xs font-bold text-[#1265FF] truncate">{designation}</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E3EAF5] space-y-1.5">
              <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Assignment & Unit</div>
              <div className="text-sm font-bold text-[#0B1B4D] truncate">{businessUnit}</div>
              <div className="text-xs text-[#64748B] truncate">Project: {currentProject || '—'}</div>
              <div className="text-xs text-[#64748B] truncate">Customer: {currentCustomer || '—'}</div>
              <div className="text-xs text-[#64748B] truncate">Location: {location} • {totalExperience} Yrs Exp</div>
            </div>

            {deployableRoles.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E3EAF5] space-y-1.5">
                <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Deployable Roles</div>
                <div className="flex flex-wrap gap-1.5">
                  {deployableRoles.map((r) => (
                    <span key={r} className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1265FF] border border-blue-200 text-xs font-semibold">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Technical Skills Preview */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Technical Skills ({technicalSkills.length})</h4>
            <div className="p-3 bg-[#F8FAFD] rounded-2xl border border-[#E3EAF5] max-h-[120px] overflow-y-auto flex flex-wrap gap-2">
              {technicalSkills.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No technical skills added.</span>
              ) : (
                technicalSkills.map((s) => (
                  <div key={s.id} className="p-2 px-3 rounded-xl border border-[#E3EAF5] bg-white flex items-center gap-2 text-xs shadow-2xs">
                    <SkillIcon name={s.name} category={s.category} size="xs" />
                    <span className="font-bold text-[#0B1B4D]">{s.name}</span>
                    <span className="text-[#64748B]">({s.experienceYears}y)</span>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {s.proficiency}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Domain Expertise Preview */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Domain Depth ({domainExpertiseList.length})</h4>
            <div className="p-3 bg-[#F8FAFD] rounded-2xl border border-[#E3EAF5] max-h-[100px] overflow-y-auto flex flex-wrap gap-2">
              {domainExpertiseList.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No domain entries added.</span>
              ) : (
                domainExpertiseList.map((de) => (
                  <div key={de.id} className="p-2 px-3 rounded-xl border border-[#E3EAF5] bg-white text-xs shadow-2xs">
                    <span className="font-bold text-[#0B1B4D]">{de.domain === 'Others' ? de.customDomain || 'Custom Domain' : de.domain}</span>
                    <span className="text-[#64748B] ml-1.5">({de.experienceYears}y) • {de.proficiency}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Final Submit Bar */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="btn-shake-secondary inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-[#E3EAF5] rounded-xl text-xs sm:text-sm font-semibold text-[#64748B] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleSaveFinalProfile}
              disabled={isSaving}
              className="btn-shake inline-flex items-center gap-2 px-7 py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer rounded-xl bg-[#1265FF] hover:bg-[#0E52D4] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Submit & Save Profile'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Drawer for adding skill during wizard */}
      <AddSkillDrawer
        isOpen={isAddSkillDrawerOpen}
        onClose={() => setIsAddSkillDrawerOpen(false)}
        initialCategory={activeCategoryTab}
        existingSkills={technicalSkills}
        onAddSkill={(skill) => {
          setTechnicalSkills([...technicalSkills, skill]);
        }}
      />
    </div>
  );
};
