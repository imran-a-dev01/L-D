import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Home, CheckCircle2, Layers, ArrowRight, BarChart3 } from 'lucide-react';
import { Employee } from '../../types/employee';
import { SkillIcon } from './SkillIcon';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  onSelectEmployee: (emp: Employee) => void;
  onNavigate: (path: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  employees,
  onSelectEmployee,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  // Lock background body scroll while palette is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredEmployees = query.trim() === '' ? [] : employees.filter((emp) => {
    const q = query.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.id.toLowerCase().includes(q) ||
      emp.businessUnit.toLowerCase().includes(q) ||
      emp.designation.toLowerCase().includes(q) ||
      emp.technicalSkills.some((s) => s.name.toLowerCase().includes(q))
    );
  }).slice(0, 5);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150 overflow-hidden">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E3EAF5] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E3EAF5] gap-3">
          <Search className="w-5 h-5 text-[#64748B] shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees, skills, projects, or commands..."
            className="w-full bg-transparent text-[#0B1B4D] placeholder-[#94A3B8] text-sm focus:outline-none"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-[#94A3B8] hover:text-[#0B1B4D] hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100">
          {/* Quick Actions if query empty */}
          {query.trim() === '' && (
            <div className="p-2 space-y-1">
              <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider px-2 py-1">
                Quick Navigation
              </div>
              <button
                onClick={() => { onNavigate('/admin'); onClose(); }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#0B1B4D] hover:bg-blue-50/70 hover:text-[#1265FF] rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-[#64748B] group-hover:text-[#1265FF]" />
                  <span>Overview Dashboard</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1265FF]" />
              </button>
              <button
                onClick={() => { onNavigate('/admin/profile-complete'); onClose(); }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#0B1B4D] hover:bg-blue-50/70 hover:text-[#1265FF] rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#64748B] group-hover:text-[#1265FF]" />
                  <span>Profile Complete Intelligence</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1265FF]" />
              </button>
              <button
                onClick={() => { onNavigate('/admin/skill-coverage'); onClose(); }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#0B1B4D] hover:bg-blue-50/70 hover:text-[#1265FF] rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-[#64748B] group-hover:text-[#1265FF]" />
                  <span>Skill Coverage Intelligence</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1265FF]" />
              </button>
              <button
                onClick={() => { onNavigate('/admin/skills'); onClose(); }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-[#0B1B4D] hover:bg-blue-50/70 hover:text-[#1265FF] rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[#64748B] group-hover:text-[#1265FF]" />
                  <span>Skill Intelligence & Matrix</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1265FF]" />
              </button>
            </div>
          )}

          {/* Filtered Employees */}
          {query.trim() !== '' && filteredEmployees.length > 0 && (
            <div className="p-2 space-y-1">
              <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider px-2 py-1">
                Matching Employees ({filteredEmployees.length})
              </div>
              {filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => {
                    onSelectEmployee(emp);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 hover:bg-blue-50/60 rounded-xl transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      {emp.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#0B1B4D] group-hover:text-[#1265FF]">
                        {emp.name}
                        <span className="ml-2 text-xs font-normal text-[#64748B]">({emp.id})</span>
                      </div>
                      <div className="text-xs text-[#64748B]">
                        {[emp.designation?.trim(), emp.businessUnit?.trim(), emp.location?.trim()].filter(Boolean).join(' • ') || '—'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {emp.technicalSkills.slice(0, 2).map((s) => (
                      <span key={s.id} className="inline-flex items-center gap-1 text-[11px] bg-white border border-[#E3EAF5] px-2 py-0.5 rounded-md font-medium text-slate-700">
                        <SkillIcon name={s.name} category={s.category} size="xs" />
                        {s.name}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.trim() !== '' && filteredEmployees.length === 0 && (
            <div className="py-8 text-center text-sm text-[#64748B]">
              No employees or skills matching "<span className="text-[#0B1B4D] font-medium">{query}</span>"
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-[#E3EAF5] text-[11px] text-[#64748B] flex items-center justify-between">
          <span>Navigate with <kbd className="px-1.5 py-0.5 bg-white border rounded shadow-xs">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border rounded shadow-xs">↓</kbd></span>
          <span>Press <kbd className="px-1.5 py-0.5 bg-white border rounded shadow-xs">Esc</kbd> to close</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
