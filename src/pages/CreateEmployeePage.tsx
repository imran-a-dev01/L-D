import React, { useState, useEffect, useMemo } from 'react';
import { 
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
import { CustomSelect, SelectOption } from '../components/common/CustomSelect';
import { useToast } from '../components/common/Toast';
import { useDropdowns } from '../hooks/useDropdowns';
import { dropdownService } from '../services/dropdownService';
import { employeeService } from '../services/employeeService';

interface CreateEmployeePageProps {
  initialEmployee?: Employee | null;
  initialId?: string;
  lockId?: boolean;
  onSave: (employee: Employee) => void;
  onCancel: () => void;
  existingIds?: string[];
  isSaving?: boolean;
}

export const CreateEmployeePage: React.FC<CreateEmployeePageProps> = ({
  initialEmployee,
  initialId = '',
  lockId = false,
  onSave,
  onCancel,
  existingIds = [],
  isSaving = false,
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Dynamic lookup options synced with SQLite master tables
  const { isLoading: dropdownsLoading, isError: dropdownsError, retry: retryDropdowns, ...dropdownOptions } = useDropdowns();

  // Step 1: Employee Information Fields
  const [id, setId] = useState(initialEmployee?.id || initialId || '');
  const [name, setName] = useState(initialEmployee?.name || '');
  const [email, setEmail] = useState(initialEmployee?.email || '');
  const [designation, setDesignation] = useState(initialEmployee?.designation || '');
  const [businessUnit, setBusinessUnit] = useState(initialEmployee?.businessUnit || '');
  const [reportingManager, setReportingManager] = useState(initialEmployee?.reportingManager || '');
  const [reportingManagerEmail, setReportingManagerEmail] = useState(initialEmployee?.reportingManagerEmail || '');
  const [currentProject, setCurrentProject] = useState(initialEmployee?.currentProject || '');
  const [currentCustomer, setCurrentCustomer] = useState(initialEmployee?.currentCustomer || '');
  const [location, setLocation] = useState(initialEmployee?.location || '');
  const [totalExperience, setTotalExperience] = useState<number | string>(initialEmployee?.totalExperience ?? 0);
  const [currentRole, setCurrentRole] = useState(initialEmployee?.currentRole || '');
  const [owlSureDesignation, setOwlSureDesignation] = useState(initialEmployee?.owlSureDesignation || '');
  const [deployableRoles, setDeployableRoles] = useState<string[]>(
    initialEmployee?.deployableRoles || []
  );
  const [deployableRoleInput, setDeployableRoleInput] = useState<string>('');

  // Structure distinct manager options with name as label and email as sublabel
  const managerOptions = useMemo<SelectOption[]>(() => {
    const list: SelectOption[] = [];
    const seenNames = new Map<string, string>(); // name.toLowerCase() -> email

    (dropdownOptions.managers || []).forEach((mgr) => {
      if (!mgr || typeof mgr !== 'string') return;
      const match = mgr.match(/^(.+?)\s*\((.+?@.+?)\)?$/);
      const mgrName = (match ? match[1] : mgr).trim();
      const mgrEmail = (match ? match[2] : '').trim();
      if (!mgrName) return;

      const lower = mgrName.toLowerCase();
      if (!seenNames.has(lower) || (mgrEmail && !seenNames.get(lower))) {
        seenNames.set(lower, mgrEmail);
      }
    });

    seenNames.forEach((emailVal, lower) => {
      const raw = dropdownOptions.managers.find((m) => {
        const match = m.match(/^(.+?)\s*\((.+?@.+?)\)?$/);
        const n = (match ? match[1] : m).trim();
        return n.toLowerCase() === lower;
      });
      const match = raw?.match(/^(.+?)\s*\((.+?@.+?)\)?$/);
      const displayName = (match ? match[1] : (raw || lower)).trim();

      list.push({
        value: displayName,
        label: displayName,
        sublabel: emailVal || undefined,
      });
    });

    return list;
  }, [dropdownOptions.managers]);

  const handleManagerSelect = (val: string) => {
    const match = val.match(/^(.+?)\s*\((.+?@.+?)\)?$/);
    const cleanName = (match ? match[1] : val).trim();
    const extractedEmail = (match ? match[2] : '').trim();

    setReportingManager(cleanName);

    // Auto-fill manager email if available in options and email field is currently empty
    const matchedOpt = managerOptions.find((m) => m.value.toLowerCase() === cleanName.toLowerCase());
    const targetEmail = extractedEmail || matchedOpt?.sublabel || '';
    if (targetEmail && !reportingManagerEmail) {
      setReportingManagerEmail(targetEmail);
    }

    if (errors.reportingManagerEmail) {
      setErrors((prev) => ({ ...prev, reportingManagerEmail: '' }));
    }
  };

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
  const [domainExp, setDomainExp] = useState<number | string>(2.0);
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

    if (reportingManagerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(reportingManagerEmail.trim())) {
        newErrors.reportingManagerEmail = 'Please enter a valid email address';
      }
    }

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
      experienceYears: Number(domainExp) || 0,
      proficiency: domainProficiency,
      lastUsed: domainLastUsed,
      lastProject: domainProject.trim(),
      specialization: domainSpec.trim(),
    };

    setDomainExpertiseList([...domainExpertiseList, entry]);
    setNewDomain('');
  };

  useEffect(() => {
    if (initialEmployee) {
      setId(initialEmployee.id || '');
      setName(initialEmployee.name || '');
      setEmail(initialEmployee.email || '');
      setDesignation(initialEmployee.designation || '');
      setBusinessUnit(initialEmployee.businessUnit || '');
      setReportingManager(initialEmployee.reportingManager || '');
      setReportingManagerEmail(initialEmployee.reportingManagerEmail || '');
      setCurrentProject(initialEmployee.currentProject || '');
      setCurrentCustomer(initialEmployee.currentCustomer || '');
      setLocation(initialEmployee.location || '');
      setTotalExperience(initialEmployee.totalExperience ?? 0);
      setCurrentRole(initialEmployee.currentRole || '');
      setOwlSureDesignation(initialEmployee.owlSureDesignation || '');
      setDeployableRoles(initialEmployee.deployableRoles || []);
      setTechnicalSkills(initialEmployee.technicalSkills || []);
      setDomainExpertiseList(initialEmployee.domainExpertise || []);
      setImmediateTechnologies(initialEmployee.immediateTechnologies || []);
      setLearningTechnologies(initialEmployee.learningTechnologies || []);
    } else if (initialId) {
      setId(initialId);
    }
  }, [initialEmployee, initialId]);

  // Smooth scroll to top when changing wizard steps
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

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
      reportingManager: reportingManager.trim(),
      reportingManagerEmail: reportingManagerEmail.trim(),
      currentProject,
      currentCustomer,
      location,
      totalExperience: Number(totalExperience) || 0,
      currentRole,
      owlSureDesignation,
      deployableRoles,
      technicalSkills: technicalSkills.map((s) => ({
        ...s,
        experienceYears: Number(s.experienceYears) || 0,
      })),
      domainExpertise: domainExpertiseList.map((d) => ({
        ...d,
        experienceYears: Number(d.experienceYears) || 0,
      })),
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
    <div className="space-y-3.5 w-full pb-2">
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

        {/* Top Right Cancel + Save Profile Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                onCancel();
              }
            }}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold shadow-sm transition-all cursor-pointer rounded-xl bg-white hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0B1B4D] border border-[#E3EAF5] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
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
      <div className="bg-white rounded-2xl py-2 px-3 sm:px-5 border border-[#E3EAF5] shadow-xs w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 items-center w-full">
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

      {/* Step 1: Employee Information - Clean, Balanced 4-Column Responsive Grid */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E3EAF5] shadow-xs space-y-5 animate-in fade-in duration-150 w-full">
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

          {/* 4-Column Grid: 1 col on mobile, 2 on md, 3 on lg, 4 on 2xl */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-5 sm:gap-x-6 gap-y-4 sm:gap-y-5">
            
            {/* ROW 1 - Field 1: Employee ID */}
            <div className="flex flex-col justify-start">
              <div className="flex items-center justify-between h-5 mb-2 select-none">
                <label className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1 truncate">
                  <span>Employee ID</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-normal shrink-0 ml-2">Unique ID</span>
              </div>
              <div className="h-11">
                <input
                  type="text"
                  value={id}
                  onChange={(e) => {
                    setId(e.target.value);
                    if (errors.id) setErrors((prev) => ({ ...prev, id: '' }));
                  }}
                  placeholder="e.g. EMP00123"
                  disabled={!!initialEmployee || lockId}
                  className={`w-full px-3.5 py-2.5 bg-white border ${
                    errors.id ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200' : 'border-[#E3EAF5] focus:border-[#1265FF] focus:ring-2 focus:ring-blue-100'
                  } rounded-xl text-xs sm:text-sm text-[#0B1B4D] font-medium focus:outline-none shadow-2xs h-11 disabled:bg-slate-50 transition-all`}
                />
              </div>
              <div className="min-h-[18px] mt-1 text-[11px] text-rose-500 leading-tight">
                {errors.id || ''}
              </div>
            </div>

            {/* ROW 1 - Field 2: Employee Name */}
            <div className="flex flex-col justify-start">
              <div className="flex items-center justify-between h-5 mb-2 select-none">
                <label className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1 truncate">
                  <span>Employee Name</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
              </div>
              <div className="h-11 relative">
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
              <div className="min-h-[18px] mt-1 text-[11px] text-rose-500 leading-tight">
                {errors.name || ''}
              </div>
            </div>

            {/* ROW 1 - Field 3: Email Address */}
            <div className="flex flex-col justify-start">
              <div className="flex items-center justify-between h-5 mb-2 select-none">
                <label className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1 truncate">
                  <span>Email Address</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
              </div>
              <div className="h-11 relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="name@company.com"
                  className={`w-full pl-9 pr-3.5 py-2.5 bg-white border ${
                    errors.email ? 'border-rose-400 ring-1 ring-rose-200' : 'border-[#E3EAF5] focus:border-[#1265FF] focus:ring-2 focus:ring-blue-100'
                  } rounded-xl text-xs sm:text-sm text-[#0B1B4D] font-medium focus:outline-none shadow-2xs h-11 transition-all`}
                />
              </div>
              <div className="min-h-[18px] mt-1 text-[11px] text-rose-500 leading-tight">
                {errors.email || ''}
              </div>
            </div>

            {/* ROW 1 - Field 4: Designation */}
            <div className="flex flex-col justify-start">
              <div className="flex items-center justify-between h-5 mb-2 select-none">
                <label className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1 truncate">
                  <span>Designation</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
              </div>
              <div className="h-11">
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
                  isLoading={dropdownsLoading}
                  isError={dropdownsError}
                  onRetry={retryDropdowns}
                />
              </div>
              <div className="min-h-[18px] mt-1" />
            </div>

            {/* ROW 2 - Field 5: Business Unit / Practice */}
            <div className="flex flex-col justify-start">
              <div className="flex items-center justify-between h-5 mb-2 select-none">
                <label className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1 truncate">
                  <span>Business Unit / Practice</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
              </div>
              <div className="h-11">
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
                  isLoading={dropdownsLoading}
                  isError={dropdownsError}
                  onRetry={retryDropdowns}
                />
              </div>
              <div className="min-h-[18px] mt-1" />
            </div>

            {/* ROW 2 - Field 6: Reporting Manager */}
            <div className="flex flex-col justify-start">
              <div className="flex items-center justify-between h-5 mb-2 select-none">
                <label className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1 truncate">
                  <span>Reporting Manager</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
              </div>
              <div className="h-11">
                <CustomSelect
                  value={reportingManager}
                  onChange={handleManagerSelect}
                  options={managerOptions}
                  icon={<User className="w-4 h-4" />}
                  placeholder="Select manager..."
                  allowOther={true}
                  size="md"
                  otherPlaceholder="Specify manager (e.g. Suresh Kumar)..."
                  onSaveCustomOption={async (val) => {
                    const match = val.match(/^(.+?)\s*\((.+?@.+?)\)?$/);
                    const cleanName = (match ? match[1] : val).trim();
                    const cleanEmail = (match ? match[2] : (reportingManagerEmail || '')).trim();
                    return dropdownService.addOption('manager', cleanName, cleanEmail);
                  }}
                  isLoading={dropdownsLoading}
                  isError={dropdownsError}
                  onRetry={retryDropdowns}
                />
              </div>
              <div className="min-h-[18px] mt-1" />
            </div>

            {/* ROW 2 - Field 7: Reporting Manager Email */}
            <div className="flex flex-col justify-start">
              <div className="flex items-center justify-between h-5 mb-2 select-none">
                <label className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1 truncate">
                  <span>Reporting Manager Email</span>
                </label>
                <span className="text-[11px] text-slate-400 font-normal shrink-0 ml-2">Optional</span>
              </div>
              <div className="h-11 relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={reportingManagerEmail}
                  onChange={(e) => {
                    setReportingManagerEmail(e.target.value);
                    if (errors.reportingManagerEmail) setErrors((prev) => ({ ...prev, reportingManagerEmail: '' }));
                  }}
                  placeholder="manager@company.com (optional)"
                  className={`w-full pl-9 pr-3.5 py-2.5 bg-white border ${
                    errors.reportingManagerEmail ? 'border-rose-400 ring-1 ring-rose-200' : 'border-[#E3EAF5] focus:border-[#1265FF] focus:ring-2 focus:ring-blue-100'
                  } rounded-xl text-xs sm:text-sm text-[#0B1B4D] font-medium focus:outline-none shadow-2xs h-11 transition-all`}
                />
              </div>
              <div className="min-h-[18px] mt-1 text-[11px] text-rose-500 leading-tight">
                {errors.reportingManagerEmail || ''}
              </div>
            </div>

            {/* ROW 2 - Field 8: Location */}
            <div className="flex flex-col justify-start">
              <div className="flex items-center justify-between h-5 mb-2 select-none">
                <label className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1 truncate">
                  <span>Location</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
              </div>
              <div className="h-11">
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
                  isLoading={dropdownsLoading}
                  isError={dropdownsError}
                  onRetry={retryDropdowns}
                />
              </div>
              <div className="min-h-[18px] mt-1" />
            </div>

            {/* ROW 3 - Field 9: Current Project */}
            <div className="flex flex-col justify-start">
              <div className="flex items-center justify-between h-5 mb-2 select-none">
                <label className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1 truncate">
                  <span>Current Project</span>
                  <span title="Active project allocation"><HelpCircle className="w-3.5 h-3.5 text-[#94A3B8] cursor-help inline shrink-0" /></span>
                </label>
              </div>
              <div className="h-11">
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
                  isLoading={dropdownsLoading}
                  isError={dropdownsError}
                  onRetry={retryDropdowns}
                />
              </div>
              <div className="min-h-[18px] mt-1" />
            </div>

            {/* ROW 3 - Field 10: Current Customer */}
            <div className="flex flex-col justify-start">
              <div className="flex items-center justify-between h-5 mb-2 select-none">
                <label className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1 truncate">
                  <span>Current Customer</span>
                  <span title="Client sponsor"><HelpCircle className="w-3.5 h-3.5 text-[#94A3B8] cursor-help inline shrink-0" /></span>
                </label>
              </div>
              <div className="h-11">
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
                  isLoading={dropdownsLoading}
                  isError={dropdownsError}
                  onRetry={retryDropdowns}
                />
              </div>
              <div className="min-h-[18px] mt-1" />
            </div>

            {/* ROW 3 - Field 11: Total Experience */}
            <div className="flex flex-col justify-start">
              <div className="flex items-center justify-between h-5 mb-2 select-none">
                <label className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1 truncate">
                  <span>Total Experience (Years)</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
              </div>
              <div className="h-11 relative">
                <Hash className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="40"
                  placeholder="0"
                  value={totalExperience}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTotalExperience(val === '' ? '' : val);
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-[#E3EAF5] focus:border-[#1265FF] focus:ring-2 focus:ring-blue-100 rounded-xl text-xs sm:text-sm text-[#0B1B4D] font-medium focus:outline-none transition-all shadow-2xs h-11"
                />
              </div>
              <div className="min-h-[18px] mt-1" />
            </div>

            {/* ROW 3 - Field 12: Current Role */}
            <div className="flex flex-col justify-start">
              <div className="flex items-center justify-between h-5 mb-2 select-none">
                <label className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1 truncate">
                  <span>Current Role</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-normal shrink-0 ml-2">Internal</span>
              </div>
              <div className="h-11">
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
                  isLoading={dropdownsLoading}
                  isError={dropdownsError}
                  onRetry={retryDropdowns}
                />
              </div>
              <div className="min-h-[18px] mt-1" />
            </div>

            {/* ROW 4 - Field 13: OwlSure Designation */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1 2xl:col-span-1 flex flex-col justify-start">
              <div className="flex items-center justify-between h-5 mb-2 select-none">
                <label className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1 truncate">
                  <span>Designation as per OwlSure</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
              </div>
              <div className="h-11">
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
                  isLoading={dropdownsLoading}
                  isError={dropdownsError}
                  onRetry={retryDropdowns}
                />
              </div>
              <div className="min-h-[18px] mt-1" />
            </div>

            {/* ROW 4 - Field 14: Deployable Roles */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 2xl:col-span-3 flex flex-col justify-start">
              <div className="flex items-center justify-between h-5 mb-2 select-none">
                <label className="text-xs font-bold text-[#0B1B4D] flex items-center gap-1 truncate">
                  <span>Deployable Roles</span>
                </label>
                <span className="text-[11px] text-slate-400 font-normal shrink-0 ml-2">Multi-select</span>
              </div>
              <div className="min-h-11 p-1 bg-[#F8FAFD] hover:bg-white focus-within:bg-white border border-[#E3EAF5] focus-within:border-[#1265FF] focus-within:ring-2 focus-within:ring-blue-100 rounded-xl transition-all shadow-2xs flex flex-wrap items-center gap-1.5">
                {deployableRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200 shadow-2xs"
                  >
                    <span>{role}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDeployableRole(role)}
                      className="hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
                      title="Remove role"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                
                <div className="flex-1 min-w-[150px] flex items-center gap-1 px-1">
                  <input
                    type="text"
                    value={deployableRoleInput}
                    onChange={(e) => setDeployableRoleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (deployableRoleInput.trim()) {
                          handleAddDeployableRole(deployableRoleInput.trim());
                          setDeployableRoleInput('');
                        }
                      }
                    }}
                    placeholder={deployableRoles.length === 0 ? "Type role & press Enter..." : "+ Add another role..."}
                    className="w-full text-xs text-[#0B1B4D] placeholder-[#94A3B8] bg-transparent focus:outline-none py-1 font-medium"
                  />
                  {deployableRoleInput.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        handleAddDeployableRole(deployableRoleInput.trim());
                        setDeployableRoleInput('');
                      }}
                      className="px-2 py-0.5 text-xs font-bold text-white bg-[#1265FF] hover:bg-[#0E52D4] rounded-lg shrink-0 cursor-pointer transition-all"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
              <div className="min-h-[18px] mt-1 text-[11px] text-[#64748B] flex items-center gap-1.5">
                {dropdownOptions.deployableRoles.length > 0 && (
                  <div className="flex items-center gap-1 overflow-x-auto text-[11px] text-[#64748B] scrollbar-none">
                    <span className="text-slate-400 shrink-0">Suggestions:</span>
                    {dropdownOptions.deployableRoles
                      .filter((r) => !deployableRoles.includes(r))
                      .slice(0, 4)
                      .map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleAddDeployableRole(suggestion)}
                          className="hover:text-[#1265FF] hover:underline cursor-pointer bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px] shrink-0"
                        >
                          +{suggestion}
                        </button>
                      ))}
                  </div>
                )}
              </div>
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

      {/* Step 2: Technical Skills - Balanced Responsive Card Grid (1 / 2 / 3 / 4 Columns) */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAF5] shadow-xs space-y-5 animate-in fade-in duration-150 w-full">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
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

          {/* Category Tabs - Spanning full width */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100 w-full scrollbar-none">
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

          {/* Responsive Card Grid for Technical Skills (1 / 2 / 3 / 4 Columns) */}
          {technicalSkills.filter((s) => s.category === activeCategoryTab).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {technicalSkills
                .filter((s) => s.category === activeCategoryTab)
                .map((skill) => (
                  <div
                    key={skill.id}
                    className="h-full flex flex-col justify-between bg-white hover:bg-blue-50/15 border border-[#E3EAF5] hover:border-blue-200 rounded-2xl p-4 shadow-2xs transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SkillIcon name={skill.name} category={skill.category} size="sm" />
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-[#0B1B4D] truncate" title={skill.name}>
                            {skill.name}
                          </div>
                          <span className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider">
                            {skill.category}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTechnicalSkills(technicalSkills.filter((s) => s.id !== skill.id))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Remove skill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Experience</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="0"
                            value={skill.experienceYears === 0 ? 0 : (skill.experienceYears ?? '')}
                            onChange={(e) => {
                              const val = e.target.value === '' ? '' : e.target.value;
                              setTechnicalSkills(technicalSkills.map((s) => s.id === skill.id ? { ...s, experienceYears: val as any } : s));
                            }}
                            className="w-full px-2.5 py-1 bg-[#F8FAFD] border border-[#E3EAF5] focus:border-[#1265FF] focus:bg-white rounded-lg text-xs font-semibold text-[#0B1B4D] h-8"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">yrs</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Proficiency</label>
                        <select
                          value={skill.proficiency}
                          onChange={(e) => {
                            const val = e.target.value as ProficiencyLevel;
                            setTechnicalSkills(technicalSkills.map((s) => s.id === skill.id ? { ...s, proficiency: val } : s));
                          }}
                          className="w-full px-2 py-1 bg-[#F8FAFD] border border-[#E3EAF5] focus:border-[#1265FF] focus:bg-white rounded-lg text-xs font-semibold text-[#0B1B4D] h-8 cursor-pointer"
                        >
                          {(dropdownOptions.proficiencies.length > 0 ? dropdownOptions.proficiencies : PROFICIENCY_LEVELS).map((lvl) => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>Last used:</span>
                      </span>
                      <span className="font-semibold text-[#0B1B4D]">{skill.lastUsed || 'Recent'}</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="py-12 text-center space-y-2 bg-[#F8FAFD] rounded-2xl border border-dashed border-[#DFE5EE]">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1265FF] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm text-[#64748B]">
                No <span className="font-bold text-[#0B1B4D]">{activeCategoryTab}</span> skills added yet.
              </p>
              <button
                type="button"
                onClick={() => setIsAddSkillDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1265FF] hover:bg-[#0E52D4] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add {activeCategoryTab} skill</span>
              </button>
            </div>
          )}

          {/* Immediate Technologies & Learning Technologies - Full Width */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
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

      {/* Step 3: Domain Expertise - Balanced Responsive Card Grid (1 / 2 / 3 / 4 Columns) */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAF5] shadow-xs space-y-5 animate-in fade-in duration-150 w-full">
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

          {/* Domain Add Box - Responsive multi-column layout */}
          <div className="p-4 sm:p-5 bg-[#F8FAFD] rounded-2xl border border-[#E3EAF5] space-y-3.5 w-full">
            <div className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider flex items-center gap-2">
              <span>Add Domain Entry</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3.5 items-end">
              <div>
                <label className="block text-xs font-bold text-[#0B1B4D] mb-1.5">Domain</label>
                <CustomSelect
                  value={newDomain}
                  onChange={(val) => setNewDomain(val)}
                  options={dropdownOptions.domains}
                  placeholder="Select domain..."
                  size="md"
                  onSaveCustomOption={async (val) => dropdownService.addOption('domain', val)}
                  isLoading={dropdownsLoading}
                  isError={dropdownsError}
                  onRetry={retryDropdowns}
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
                  min="0"
                  placeholder="0"
                  value={domainExp}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDomainExp(val === '' ? '' : val);
                  }}
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

          {/* Responsive Card Grid for Domain Entries (1 / 2 / 3 / 4 Columns) */}
          {domainExpertiseList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {domainExpertiseList.map((de) => (
                <div
                  key={de.id}
                  className="h-full flex flex-col justify-between bg-white hover:bg-blue-50/15 border border-[#E3EAF5] hover:border-blue-200 rounded-2xl p-4 shadow-2xs transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-[#0B1B4D] truncate" title={de.domain === 'Others' ? de.customDomain || '—' : de.domain}>
                        {de.domain === 'Others' ? de.customDomain || '—' : de.domain || '—'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDomainExpertiseList(domainExpertiseList.filter((d) => d.id !== de.id))}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Remove domain"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                      {de.experienceYears} Years Exp
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1265FF] font-bold border border-blue-200 text-[11px]">
                      {de.proficiency}
                    </span>
                  </div>

                  {(de.lastProject || de.specialization) && (
                    <div className="text-[11px] text-[#64748B] space-y-0.5 pt-2 border-t border-slate-100">
                      {de.lastProject && (
                        <div className="truncate">
                          <span className="text-slate-400">Project: </span>
                          <span className="font-medium text-[#0B1B4D]">{de.lastProject}</span>
                        </div>
                      )}
                      {de.specialization && (
                        <div className="truncate">
                          <span className="text-slate-400">Specialization: </span>
                          <span className="font-medium text-[#0B1B4D]">{de.specialization}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center space-y-1 text-xs sm:text-sm text-[#64748B] bg-[#F8FAFD] rounded-2xl border border-dashed border-[#DFE5EE]">
              <p className="font-medium">No domain expertise entries added yet.</p>
              <p className="text-xs text-slate-400">Use the form above to add industry domains and specializations.</p>
            </div>
          )}

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

      {/* Step 4: Final Review and Summary - Multi-column Responsive Layout */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAF5] shadow-xs space-y-5 animate-in fade-in duration-150 w-full">
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

          {/* Overview Cards: 2 cols on lg, 3 on 2xl */}
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E3EAF5] space-y-1.5">
              <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Employee Identity</div>
              <div className="text-base font-extrabold text-[#0B1B4D] truncate">{name.trim() || '—'}</div>
              <div className="text-xs text-[#64748B] truncate">{id} • {email}</div>
              <div className="text-xs font-bold text-[#1265FF] truncate">{designation.trim() || '—'}</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E3EAF5] space-y-1.5">
              <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Assignment & Unit</div>
              <div className="text-sm font-bold text-[#0B1B4D] truncate">{businessUnit.trim() || '—'}</div>
              <div className="text-xs text-[#64748B] truncate">
                Manager: {reportingManager.trim() ? (reportingManagerEmail.trim() ? `${reportingManager.trim()} (${reportingManagerEmail.trim()})` : reportingManager.trim()) : '—'}
              </div>
              <div className="text-xs text-[#64748B] truncate">Project: {currentProject.trim() || '—'} • Customer: {currentCustomer.trim() || '—'}</div>
              <div className="text-xs text-[#64748B] truncate">Location: {location.trim() || '—'} • {totalExperience || 0} Yrs Exp</div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFD] border border-[#E3EAF5] space-y-1.5 col-span-1 lg:col-span-2 2xl:col-span-1">
              <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Roles & Designation</div>
              <div className="text-xs text-[#64748B]">
                <span className="font-semibold text-[#0B1B4D]">Current Role:</span> {currentRole || '—'}
              </div>
              <div className="text-xs text-[#64748B]">
                <span className="font-semibold text-[#0B1B4D]">OwlSure Designation:</span> {owlSureDesignation || '—'}
              </div>
              {deployableRoles.length > 0 && (
                <div className="pt-1.5">
                  <div className="text-[11px] font-semibold text-[#64748B] mb-1">Deployable Roles ({deployableRoles.length}):</div>
                  <div className="flex flex-wrap gap-1.5">
                    {deployableRoles.map((r) => (
                      <span key={r} className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Technical Skills Preview with wrapping chips */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Technical Skills ({technicalSkills.length})</h4>
            <div className="p-3.5 bg-[#F8FAFD] rounded-2xl border border-[#E3EAF5] max-h-72 overflow-y-auto">
              {technicalSkills.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No technical skills added.</span>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                  {technicalSkills.map((s) => (
                    <div key={s.id} className="p-2.5 px-3 rounded-xl border border-[#E3EAF5] bg-white flex items-center justify-between text-xs shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <SkillIcon name={s.name} category={s.category} size="xs" />
                        <span className="font-bold text-[#0B1B4D] truncate" title={s.name}>{s.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[#64748B] text-[11px]">{s.experienceYears}y</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#1265FF] border border-blue-100">
                          {s.proficiency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Domain Expertise Preview with wrapping chips */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Domain Depth ({domainExpertiseList.length})</h4>
            <div className="p-3.5 bg-[#F8FAFD] rounded-2xl border border-[#E3EAF5] max-h-56 overflow-y-auto">
              {domainExpertiseList.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No domain entries added.</span>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-2.5">
                  {domainExpertiseList.map((de) => (
                    <div key={de.id} className="p-2.5 px-3 rounded-xl border border-[#E3EAF5] bg-white text-xs shadow-2xs flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <Layers className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-bold text-[#0B1B4D] truncate">{de.domain === 'Others' ? de.customDomain || '—' : de.domain || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[#64748B] text-[11px]">{de.experienceYears}y</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {de.proficiency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
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
