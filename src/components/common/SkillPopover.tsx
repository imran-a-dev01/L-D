import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';
import { TechnicalSkill } from '../../types/skill';
import { SkillIcon } from './SkillIcon';

interface SkillPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
  skills: TechnicalSkill[];
  title?: string;
}

const PROFICIENCY_COLORS: Record<string, string> = {
  Expert: 'bg-purple-50 text-purple-700 border-purple-200',
  Advanced: 'bg-blue-50 text-blue-700 border-blue-200',
  Intermediate: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Beginner: 'bg-slate-50 text-slate-700 border-slate-200',
};

export const SkillPopover: React.FC<SkillPopoverProps> = ({
  isOpen,
  onClose,
  anchorRect,
  skills,
  title,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen || !anchorRect) return;

    const popoverWidth = 320;
    const popoverHeight = 280;
    const padding = 12;

    let top = anchorRect.bottom + 6;
    let left = anchorRect.left;

    // Flip up if bottom overflows window
    if (top + popoverHeight > window.innerHeight - padding) {
      top = Math.max(padding, anchorRect.top - popoverHeight - 6);
    }

    // Keep within left/right bounds
    if (left + popoverWidth > window.innerWidth - padding) {
      left = Math.max(padding, window.innerWidth - popoverWidth - padding);
    }
    if (left < padding) {
      left = padding;
    }

    setCoords({ top, left });
  }, [isOpen, anchorRect]);

  // Outside click & Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleScroll = (e: Event) => {
      // If scroll occurs outside the popover, close to prevent detaching
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !anchorRect) return null;

  // Group skills by category
  const groupedByCategory = skills.reduce<Record<string, TechnicalSkill[]>>((acc, s) => {
    const cat = s.category?.trim() || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const categories = Object.keys(groupedByCategory).sort();

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 9999,
      }}
      className="w-80 max-w-[92vw] bg-white rounded-2xl shadow-xl border border-[#DFE5EE] p-3 text-xs animate-in fade-in zoom-in-95 duration-150 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Popover Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-bold text-[#0B1B4D]">
          <Sparkles className="w-3.5 h-3.5 text-[#1265FF]" />
          <span>{title || `All Skills (${skills.length})`}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popover Body - Scrollable Categories */}
      <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
        {categories.map((category) => (
          <div key={category} className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              <span>{category}</span>
              <span className="text-slate-400 font-mono">({groupedByCategory[category].length})</span>
            </div>

            <div className="space-y-1">
              {groupedByCategory[category].map((skill) => (
                <div
                  key={skill.id || skill.name}
                  className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <SkillIcon name={skill.name} category={skill.category} size="xs" />
                    <span className="font-semibold text-[#0B1B4D] truncate" title={skill.name}>
                      {skill.name}
                    </span>
                    {skill.experienceYears ? (
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {skill.experienceYears}y
                      </span>
                    ) : null}
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border shrink-0 ${
                      PROFICIENCY_COLORS[skill.proficiency] || 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {skill.proficiency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
};
