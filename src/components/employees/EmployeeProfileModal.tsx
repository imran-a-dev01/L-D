import React, { useEffect } from 'react';
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
  Share2
} from 'lucide-react';
import { Employee } from '../../types/employee';
import { SkillIcon } from '../common/SkillIcon';
import { useToast } from '../common/Toast';

interface EmployeeProfileModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employee,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { toast } = useToast();
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

  if (!isOpen || !employee) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overflow-hidden">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-[#E3EAF5] w-full max-w-3xl max-h-[min(90vh,760px)] overflow-y-auto flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-[#E3EAF5] flex items-start justify-between bg-gradient-to-r from-blue-50/50 via-white to-slate-50/50 rounded-t-3xl">
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
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  {employee.status}
                </span>
              </div>
              <div className="text-xs text-[#64748B] mt-0.5 flex flex-wrap items-center gap-3">
                <span className="font-semibold text-[#1265FF]">{employee.designation}</span>
                <span>•</span>
                <span>{employee.businessUnit}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {employee.location}
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
          {/* Key Metric Snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#F8FAFD] rounded-xl border border-[#E3EAF5]">
              <div className="text-[11px] text-[#64748B] font-semibold">Total Experience</div>
              <div className="text-lg font-bold text-[#0B1B4D] mt-0.5">{employee.totalExperience} Years</div>
            </div>
            <div className="p-3 bg-[#F8FAFD] rounded-xl border border-[#E3EAF5]">
              <div className="text-[11px] text-[#64748B] font-semibold">Profile Completion</div>
              <div className="text-lg font-bold text-emerald-600 mt-0.5">{employee.profileCompletion}%</div>
            </div>
            <div className="p-3 bg-[#F8FAFD] rounded-xl border border-[#E3EAF5]">
              <div className="text-[11px] text-[#64748B] font-semibold">Technical Skills</div>
              <div className="text-lg font-bold text-[#1265FF] mt-0.5">{employee.technicalSkills.length} Tracked</div>
            </div>
            <div className="p-3 bg-[#F8FAFD] rounded-xl border border-[#E3EAF5]">
              <div className="text-[11px] text-[#64748B] font-semibold">Deployable Roles</div>
              <div className="text-lg font-bold text-purple-600 mt-0.5">{employee.deployableRoles.length} Active</div>
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
                <span className="font-semibold text-[#0B1B4D]">{employee.reportingManager}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-[#64748B]">Current Project:</span>
                <span className="font-semibold text-[#0B1B4D]">{employee.currentProject}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-[#64748B]">Current Customer:</span>
                <span className="font-semibold text-[#0B1B4D]">{employee.currentCustomer}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-[#64748B]">Current Role:</span>
                <span className="font-semibold text-[#0B1B4D]">{employee.currentRole}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-[#64748B]">OwlSure Designation:</span>
                <span className="font-semibold text-[#0B1B4D]">{employee.owlSureDesignation}</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-[11px] font-semibold text-[#64748B] mb-2">Deployable Roles:</div>
              <div className="flex flex-wrap gap-2">
                {employee.deployableRoles.map((r) => (
                  <span key={r} className="px-3 py-1 rounded-lg bg-blue-50 text-[#1265FF] border border-blue-200 text-xs font-semibold">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Technical Skills Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider">
              Verified Technical Skills ({employee.technicalSkills.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {employee.technicalSkills.map((s) => (
                <div key={s.id} className="p-3 bg-[#F8FAFD] rounded-xl border border-[#E3EAF5] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <SkillIcon name={s.name} category={s.category} size="md" />
                    <div>
                      <div className="font-bold text-xs text-[#0B1B4D]">{s.name}</div>
                      <div className="text-[11px] text-[#64748B]">{s.category} • {s.experienceYears}y exp</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white border border-[#E3EAF5] text-[#0B1B4D]">
                    {s.proficiency}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Domain Expertise */}
          {employee.domainExpertise && employee.domainExpertise.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#0B1B4D] uppercase tracking-wider">
                Domain & Industry Depth
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {employee.domainExpertise.map((d) => (
                  <div key={d.id} className="p-3 bg-white rounded-xl border border-[#E3EAF5] text-xs">
                    <div className="font-bold text-[#0B1B4D]">
                      {d.domain === 'Others' ? d.customDomain : d.domain}
                    </div>
                    <div className="text-[#64748B] mt-0.5">
                      {d.experienceYears} Years • {d.proficiency}
                    </div>
                    {d.specialization && (
                      <div className="text-slate-500 text-[11px] mt-1 italic">
                        Specialization: {d.specialization}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upskilling & Interests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="text-xs font-bold text-[#1265FF] mb-2">Immediate Technologies</div>
              <div className="flex flex-wrap gap-1.5">
                {employee.immediateTechnologies.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-md text-xs font-semibold text-[#0B1B4D] border border-blue-200">
                    <SkillIcon name={t} size="xs" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100">
              <div className="text-xs font-bold text-purple-700 mb-2">Learning Technologies</div>
              <div className="flex flex-wrap gap-1.5">
                {employee.learningTechnologies.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-md text-xs font-semibold text-purple-700 border border-purple-200">
                    <SkillIcon name={t} size="xs" />
                    {t}
                  </span>
                ))}
              </div>
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
