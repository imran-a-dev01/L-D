import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SkillCoverageItem } from '../../services/api';

interface SkillCoverageCardProps {
  data?: SkillCoverageItem[];
  onViewInsights?: () => void;
}

export const SkillCoverageCard: React.FC<SkillCoverageCardProps> = ({ data, onViewInsights }) => {
  const coverageData: SkillCoverageItem[] = data && data.length > 0 ? data : [];

  return (
    <div className="bg-white rounded-3xl border border-[#DFE5EE] p-5 sm:p-6 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full shadow-xs">
      {/* Header matching exact Screenshot: "Skill Coverage Snapshot" */}
      <div className="flex items-center justify-between pb-2 mb-1">
        <h3 className="text-sm font-bold text-[#0B1B4D]">Skill Coverage Snapshot</h3>
        <button
          onClick={onViewInsights}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1265FF] hover:text-blue-700 transition-colors cursor-pointer"
        >
          <span>View insights</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Rows matching Screenshot */}
      <div className="space-y-3 pt-1">
        {coverageData.length === 0 && (
          <div className="text-center py-6 text-xs text-[#64748B]">
            No skill data yet. Add employees with skills to see coverage.
          </div>
        )}
        {coverageData.map((item) => (
          <div key={item.label} className="flex items-center gap-3 text-xs">
            {/* Label */}
            <span className="w-16 font-medium text-[#64748B] shrink-0 text-xs">
              {item.label}
            </span>

            {/* Horizontal progress bar with soft inset depth */}
            <div className="flex-1 h-2.5 rounded-full bg-[#EEF3FA] overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ${item.barColor} shadow-xs`}
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>

            {/* Percentage */}
            <span className="w-9 text-right font-bold text-[#0B1B4D] shrink-0 text-xs">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
