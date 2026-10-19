import React, { useState, useRef } from 'react';
import { TechnicalSkill } from '../../types/skill';
import { SkillIcon } from './SkillIcon';
import { SkillPopover } from './SkillPopover';

interface SkillChipGroupProps {
  skills: TechnicalSkill[];
  maxVisible?: number; // 2 for table, 3 for card
  className?: string;
  popoverTitle?: string;
}

const PROFICIENCY_RANK: Record<string, number> = {
  Expert: 4,
  Advanced: 3,
  Intermediate: 2,
  Beginner: 1,
};

export function sortSkillsByProficiencyAndExp(skills: TechnicalSkill[]): TechnicalSkill[] {
  return [...skills].sort((a, b) => {
    const profA = PROFICIENCY_RANK[a.proficiency] || 0;
    const profB = PROFICIENCY_RANK[b.proficiency] || 0;
    if (profB !== profA) return profB - profA;

    const expA = Number(a.experienceYears) || 0;
    const expB = Number(b.experienceYears) || 0;
    if (expB !== expA) return expB - expA;

    return a.name.localeCompare(b.name);
  });
}

export const SkillChipGroup: React.FC<SkillChipGroupProps> = ({
  skills = [],
  maxVisible = 2,
  className = '',
  popoverTitle,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  if (!skills || skills.length === 0) {
    return <span className="text-xs text-slate-400 font-normal">—</span>;
  }

  const sortedSkills = sortSkillsByProficiencyAndExp(skills);
  const visibleSkills = sortedSkills.slice(0, maxVisible);
  const remainingCount = sortedSkills.length - maxVisible;

  const handleOpenPopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (moreButtonRef.current) {
      setAnchorRect(moreButtonRef.current.getBoundingClientRect());
      setIsPopoverOpen(true);
    }
  };

  return (
    <div className={`flex items-center gap-1.5 flex-nowrap whitespace-nowrap overflow-hidden ${className}`}>
      {visibleSkills.map((s) => (
        <span
          key={s.id || s.name}
          title={`${s.name} (${s.proficiency}${s.experienceYears ? ` • ${s.experienceYears}y exp` : ''})`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#1E40AF] font-medium text-[11px] border border-blue-100/70 whitespace-nowrap shrink-0 max-w-[110px]"
        >
          <SkillIcon name={s.name} category={s.category} size="xs" />
          <span className="truncate">{s.name}</span>
        </span>
      ))}

      {remainingCount > 0 && (
        <>
          <button
            ref={moreButtonRef}
            type="button"
            onClick={handleOpenPopover}
            onMouseEnter={handleOpenPopover}
            className="text-[11px] font-semibold text-[#1265FF] hover:text-[#004dc7] bg-blue-50/90 hover:bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-100 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            title={`Click or hover to view all ${sortedSkills.length} skills`}
          >
            +{remainingCount} more
          </button>

          <SkillPopover
            isOpen={isPopoverOpen}
            onClose={() => setIsPopoverOpen(false)}
            anchorRect={anchorRect}
            skills={sortedSkills}
            title={popoverTitle || `All Skills (${sortedSkills.length})`}
          />
        </>
      )}
    </div>
  );
};
