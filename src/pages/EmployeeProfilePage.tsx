import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Edit3,
  Eye,
  Clock
} from 'lucide-react';
import { Employee } from '../types/employee';
import { api } from '../services/api';
import { useToast } from '../components/common/Toast';
import { CreateEmployeePage } from './CreateEmployeePage';
import { EmployeeProfileView } from '../components/employees/EmployeeProfileView';
import { PageContainer } from '../components/layout/PageContainer';

type ProfileFlowState = 
  | 'identify' 
  | 'new-wizard' 
  | 'view-profile' 
  | 'edit-wizard' 
  | 'success';

export const EmployeeProfilePage: React.FC = () => {
  const { toast } = useToast();

  const [flowState, setFlowState] = useState<ProfileFlowState>('identify');
  const [employeeIdInput, setEmployeeIdInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Active employee data loaded or created
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [activeNormalizedId, setActiveNormalizedId] = useState('');

  // Success summary details
  const [savedTime, setSavedTime] = useState('');
  const [savedCompletion, setSavedCompletion] = useState(0);

  const idInputRef = useRef<HTMLInputElement>(null);

  // Auto focus input on initial load
  useEffect(() => {
    if (flowState === 'identify') {
      setTimeout(() => {
        idInputRef.current?.focus();
      }, 50);
    }
  }, [flowState]);

  // Warn before leaving page with unsaved changes in wizard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (flowState === 'new-wizard' || flowState === 'edit-wizard') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [flowState]);

  // Sync flow state with browser history for back button support
  const isPopstateRef = useRef(false);

  useEffect(() => {
    if (isPopstateRef.current) {
      isPopstateRef.current = false;
      return;
    }
    window.history.pushState({ flowState }, '');
  }, [flowState]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const prevState = e.state?.flowState as ProfileFlowState | undefined;
      isPopstateRef.current = true;

      if (flowState === 'new-wizard' || flowState === 'edit-wizard') {
        if (!window.confirm('Are you sure you want to go back? Any unsaved changes will be lost.')) {
          window.history.pushState({ flowState }, '');
          return;
        }
      }

      if (prevState) {
        setFlowState(prevState);
        if (prevState === 'identify') setCurrentEmployee(null);
      } else {
        setFlowState('identify');
        setCurrentEmployee(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [flowState]);

  // Smooth scroll to top whenever flow state transitions
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [flowState]);

  const handleIdSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInputError('');

    const trimmed = employeeIdInput.trim();
    if (!trimmed) {
      setInputError('Please enter your Employee ID');
      return;
    }

    if (/\s/.test(trimmed)) {
      setInputError('Employee ID must not contain spaces');
      return;
    }

    const normalized = trimmed.toUpperCase();
    setActiveNormalizedId(normalized);
    setIsCheckingId(true);

    try {
      // Lookup employee without loading full list
      const res = await api.getEmployeeById(normalized);
      if (res && res.employee) {
        setCurrentEmployee(res.employee);
        setFlowState('view-profile');
        toast(`Profile found for ${res.employee.name}`, 'info', 'Profile Found');
      } else {
        // No employee returned
        setCurrentEmployee(null);
        setFlowState('new-wizard');
      }
    } catch (err: any) {
      // 404 means no profile found yet -> Step 2a: Create new profile
      if (err.message?.includes('404') || err.message?.toLowerCase().includes('not found')) {
        setCurrentEmployee(null);
        setFlowState('new-wizard');
      } else {
        setInputError(err.message || 'Error checking employee profile. Please try again.');
        toast(err.message || 'Error checking employee profile', 'error');
      }
    } finally {
      setIsCheckingId(false);
    }
  };

  const handleSaveEmployee = async (employeeData: Employee) => {
    setIsSaving(true);
    const isUpdate = flowState === 'edit-wizard' || !!currentEmployee;

    try {
      let saved: Employee;
      if (isUpdate) {
        const res = await api.updateEmployee(activeNormalizedId, employeeData);
        saved = res.employee;
        toast('Profile updated successfully!', 'success', 'Profile Updated');
      } else {
        try {
          const res = await api.createEmployee(employeeData);
          saved = res.employee;
          toast('Profile created successfully!', 'success', 'Profile Created');
        } catch (postErr: any) {
          // If 409 (someone created in the meantime), load existing and inform user
          if (postErr.message?.includes('409') || postErr.message?.toLowerCase().includes('already exists')) {
            toast('This ID was already registered. Loading existing profile...', 'info', 'Already Exists');
            const fetched = await api.getEmployeeById(activeNormalizedId);
            setCurrentEmployee(fetched.employee);
            setFlowState('view-profile');
            return;
          }
          throw postErr;
        }
      }

      setCurrentEmployee(saved);
      setSavedCompletion(saved.profileCompletion || 0);
      setSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setFlowState('success');
    } catch (err: any) {
      toast(err.message || 'Failed to save profile. Please review your information.', 'error', 'Save Failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelWizard = () => {
    if (window.confirm('Are you sure you want to go back? Any unsaved changes will be lost.')) {
      setFlowState('identify');
      setCurrentEmployee(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#EEF4FF] via-[#F4F7FC] to-[#E9EFF9] text-[#0B1B4D] flex flex-col font-['Inter',sans-serif] selection:bg-blue-100 selection:text-blue-900">
      {/* Slim Top Bar */}
      <header className="h-14 sm:h-16 bg-white/80 backdrop-blur-md border-b border-[#DFE5EE] sticky top-0 z-30 shadow-2xs">
        <PageContainer className="h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl md:text-2xl font-black tracking-tight text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif] select-none">
              OwlSure
            </span>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs font-semibold text-[#64748B] tracking-wide uppercase">
              Learning & Development
            </span>
          </div>
        </PageContainer>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full flex flex-col justify-start">
        <PageContainer className="flex-1 py-4 sm:py-6 md:py-8 flex flex-col justify-start">
          <AnimatePresence mode="wait">
          {/* STEP 1: IDENTIFY */}
          {flowState === 'identify' && (
            <motion.div
              key="identify"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="my-auto py-8 sm:py-16 max-w-lg mx-auto w-full"
            >
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#DFE5EE] shadow-xl shadow-blue-900/5 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1265FF] to-blue-400 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">
                    Skill Profile Registry
                  </h1>
                  <p className="text-xs sm:text-sm text-[#64748B]">
                    Enter your Employee ID to register or update your skill profile
                  </p>
                </div>

                <form onSubmit={handleIdSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="employee-id-input"
                      className="block text-xs font-bold text-[#0B1B4D] uppercase tracking-wider"
                    >
                      Employee ID
                    </label>
                    <div className="relative">
                      <input
                        id="employee-id-input"
                        ref={idInputRef}
                        type="text"
                        value={employeeIdInput}
                        onChange={(e) => {
                          setEmployeeIdInput(e.target.value);
                          if (inputError) setInputError('');
                        }}
                        disabled={isCheckingId}
                        placeholder="e.g. 105511 or EMP001"
                        className={`w-full px-4 py-3.5 bg-[#F8FAFD] hover:bg-white focus:bg-white border ${
                          inputError ? 'border-rose-400 ring-2 ring-rose-100' : 'border-[#DFE5EE] focus:border-[#1265FF] focus:ring-4 focus:ring-blue-100'
                        } rounded-2xl text-base sm:text-lg text-[#0B1B4D] font-bold tracking-wide placeholder:font-normal placeholder:text-slate-400 focus:outline-none transition-all shadow-inner uppercase`}
                      />
                    </div>
                    {inputError && (
                      <p className="text-xs text-rose-500 font-medium flex items-center gap-1.5 pt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{inputError}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isCheckingId}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#1265FF] hover:bg-[#0E52D4] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isCheckingId ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Checking profile...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 border-t border-slate-100 text-center">
                  <span className="text-[11px] text-[#64748B]">
                    New employees will be guided through profile setup. Existing profiles will be available for review and updates.
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2a: NEW PROFILE WIZARD */}
          {flowState === 'new-wizard' && (
            <motion.div
              key="new-wizard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Reused Multi-step Wizard */}
              <CreateEmployeePage
                initialId={activeNormalizedId}
                lockId={true}
                onSave={handleSaveEmployee}
                onCancel={handleCancelWizard}
                isSaving={isSaving}
              />
            </motion.div>
          )}

          {/* STEP 2b: EXISTING PROFILE FOUND VIEW */}
          {flowState === 'view-profile' && currentEmployee && (
            <motion.div
              key="view-profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Full Saved Profile Display Component */}
              <EmployeeProfileView
                employee={currentEmployee}
                onEdit={() => setFlowState('edit-wizard')}
                onChangeId={() => {
                  setFlowState('identify');
                  setCurrentEmployee(null);
                }}
                showChangeIdButton={true}
              />
            </motion.div>
          )}

          {/* STEP 2b -> EDIT WIZARD */}
          {flowState === 'edit-wizard' && currentEmployee && (
            <motion.div
              key="edit-wizard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <CreateEmployeePage
                initialEmployee={currentEmployee}
                lockId={true}
                onSave={handleSaveEmployee}
                onCancel={() => setFlowState('view-profile')}
                isSaving={isSaving}
              />
            </motion.div>
          )}

          {/* STEP 3: SUCCESS SCREEN */}
          {flowState === 'success' && currentEmployee && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="my-auto py-8 sm:py-16 max-w-3xl mx-auto w-full"
            >
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#DFE5EE] shadow-xl shadow-blue-900/5 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-2xl font-black text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">
                    Profile Saved Successfully!
                  </h2>
                  <p className="text-xs sm:text-sm text-[#64748B]">
                    Your skills and competencies have been successfully registered in the enterprise directory.
                  </p>
                </div>

                {/* Summary Card with multi-column layout */}
                <div className="bg-[#F8FAFD] rounded-2xl p-5 border border-[#E3EAF5] text-left space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200/60 gap-2">
                    <div>
                      <div className="font-bold text-base text-[#0B1B4D]">{currentEmployee.name}</div>
                      <div className="text-xs text-[#64748B]">ID: {currentEmployee.id} • {currentEmployee.designation || 'Specialist'}</div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                        {currentEmployee.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-[#E3EAF5]">
                      <span className="text-[#64748B] block text-[11px] font-medium uppercase tracking-wider">Completion</span>
                      <span className="font-extrabold text-base text-[#1265FF] font-['Plus_Jakarta_Sans',sans-serif]">
                        {savedCompletion}%
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#E3EAF5]">
                      <span className="text-[#64748B] block text-[11px] font-medium uppercase tracking-wider">Practice</span>
                      <span className="font-bold text-xs text-[#0B1B4D] truncate block mt-0.5">
                        {currentEmployee.businessUnit || '—'}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#E3EAF5]">
                      <span className="text-[#64748B] block text-[11px] font-medium uppercase tracking-wider">Location</span>
                      <span className="font-bold text-xs text-[#0B1B4D] truncate block mt-0.5">
                        {currentEmployee.location || '—'}
                      </span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-[#E3EAF5]">
                      <span className="text-[#64748B] block text-[11px] font-medium uppercase tracking-wider">Saved At</span>
                      <span className="font-semibold text-xs text-[#0B1B4D] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{savedTime || 'Just now'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setFlowState('view-profile')}
                    className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-[#1265FF] hover:bg-[#0E52D4] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View my profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlowState('edit-wizard')}
                    className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Edit3 className="w-4 h-4 text-slate-500" />
                    <span>Edit again</span>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFlowState('identify');
                      setEmployeeIdInput('');
                      setCurrentEmployee(null);
                    }}
                    className="text-xs text-[#64748B] hover:text-[#1265FF] hover:underline cursor-pointer"
                  >
                    Return to Employee ID lookup
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageContainer>
    </main>
  </div>
  );
};
