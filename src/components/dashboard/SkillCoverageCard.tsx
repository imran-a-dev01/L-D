import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { SkillCoverageItem } from '../../services/api';

// Vibrant gradient palettes for distinct category lines matching original design
const CATEGORY_GRADIENTS: Record<string, string> = {
  frontend: 'linear-gradient(90deg, #3B82F6 0%, #1265FF 100%)', // Vibrant Blue
  backend: 'linear-gradient(90deg, #06B6D4 0%, #00B4D8 100%)', // Ocean Cyan
  database: 'linear-gradient(90deg, #818CF8 0%, #6366F1 100%)', // Indigo Purple
  cloud: 'linear-gradient(90deg, #34D399 0%, #10B981 100%)', // Fresh Emerald
  data: 'linear-gradient(90deg, #A78BFA 0%, #8B5CF6 100%)', // Bright Violet
  'devops & tools': 'linear-gradient(90deg, #F472B6 0%, #EC4899 100%)', // Rose Pink
  devops: 'linear-gradient(90deg, #F472B6 0%, #EC4899 100%)',
  domain: 'linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%)', // Warm Amber
};

const FALLBACK_GRADIENTS = [
  'linear-gradient(90deg, #3B82F6 0%, #1265FF 100%)',
  'linear-gradient(90deg, #06B6D4 0%, #00B4D8 100%)',
  'linear-gradient(90deg, #818CF8 0%, #6366F1 100%)',
  'linear-gradient(90deg, #34D399 0%, #10B981 100%)',
  'linear-gradient(90deg, #A78BFA 0%, #8B5CF6 100%)',
  'linear-gradient(90deg, #F472B6 0%, #EC4899 100%)',
  'linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%)',
];

function getCategoryGradient(label: string, barColor?: string, index: number = 0): string {
  const key = (label || '').toLowerCase().trim();
  if (CATEGORY_GRADIENTS[key]) {
    return CATEGORY_GRADIENTS[key];
  }
  const hexMatch = barColor?.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/);
  if (hexMatch) {
    return `linear-gradient(90deg, ${hexMatch[0]}CC 0%, ${hexMatch[0]} 100%)`;
  }
  return FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
}

interface SkillCoverageCardProps {
  data?: SkillCoverageItem[];
  bgImage?: string;
  onViewInsights?: () => void;
}

export const SkillCoverageCard: React.FC<SkillCoverageCardProps> = ({
  data,
  bgImage = '/kpi-3.png',
  onViewInsights,
}) => {
  const coverageData: SkillCoverageItem[] = data && data.length > 0 ? data : [];
  const [isHovered, setIsHovered] = useState(false);
  const [hasAppeared, setHasAppeared] = useState(false);
  const [animatedPercentages, setAnimatedPercentages] = useState<number[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection observer for entrance
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAppeared(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animate progress bars after appearance
  useEffect(() => {
    if (hasAppeared && coverageData.length > 0) {
      setAnimatedPercentages(coverageData.map(() => 0));
      const timer = setTimeout(() => {
        setAnimatedPercentages(coverageData.map((item) => item.percentage));
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [hasAppeared, coverageData.length]);

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="kpi-card-wrapper rounded-3xl relative overflow-hidden flex flex-col justify-between h-full"
      style={{
        opacity: hasAppeared ? 1 : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s, transform 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s',
      }}
    >
      {/* Animated gradient border */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none kpi-gradient-border"
        style={{
          padding: '1.5px',
          background: isHovered
            ? 'linear-gradient(135deg, #6366F1 0%, #06B6D4 30%, #10B981 60%, #F59E0B 100%)'
            : 'linear-gradient(135deg, #E3EAF5 0%, #DFE5EE 100%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          transition: 'background 0.5s ease',
        }}
      />

      {/* Inner card */}
      <div
        className="relative bg-white rounded-3xl flex flex-col justify-between h-full"
        style={{
          boxShadow: isHovered
            ? '0 8px 32px rgba(99,102,241,0.07), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)'
            : '0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
          transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
          transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        }}
      >
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden"
          style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.5s ease' }}
        >
          <div className="kpi-shimmer" />
        </div>

        {/* Background Graphic Image with high-clarity enterprise visibility */}
        {bgImage && (
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden z-0"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundPosition: 'right bottom',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              opacity: isHovered ? 1 : 0.85,
              filter: 'contrast(1.08) saturate(1.15)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              transform: isHovered ? 'scale(1.02)' : 'scale(1)',
            }}
          />
        )}

        <div className="p-5 sm:p-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-1">
            <h3
              className="text-sm font-bold text-[#0B1B4D]"
              style={{
                backgroundImage: isHovered ? 'linear-gradient(135deg, #0B1B4D 0%, #6366F1 100%)' : 'none',
                WebkitBackgroundClip: isHovered ? 'text' : 'unset',
                WebkitTextFillColor: isHovered ? 'transparent' : '#0B1B4D',
                transition: 'all 0.4s ease',
              }}
            >
              Skill Coverage Snapshot
            </h3>
            <button
              onClick={onViewInsights}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1265FF] hover:text-blue-700 transition-colors cursor-pointer"
              style={{
                transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                transition: 'transform 0.3s ease',
              }}
            >
              <span>View insights</span>
              <ArrowRight
                className="w-3.5 h-3.5"
                style={{
                  transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
                  transition: 'transform 0.3s ease',
                }}
              />
            </button>
          </div>

          {/* Progress Rows with animated bars */}
          <div className="space-y-3 pt-1">
            {coverageData.length === 0 && (
              <div className="text-center py-6 text-xs text-[#64748B]">
                No skill data yet. Add employees with skills to see coverage.
              </div>
            )}
            {coverageData.map((item, idx) => (
              <div
                key={item.label}
                className="flex items-center gap-3 text-xs group/row"
                style={{
                  opacity: hasAppeared ? 1 : 0,
                  transform: hasAppeared ? 'translateX(0)' : 'translateX(-8px)',
                  transition: `all 0.4s cubic-bezier(0.22,1,0.36,1) ${0.1 + idx * 0.06}s`,
                }}
              >
                {/* Label */}
                <span className="w-16 font-medium text-[#64748B] shrink-0 text-xs group-hover/row:text-[#0B1B4D] transition-colors duration-200">
                  {item.label}
                </span>

                {/* Progress bar with gradient fill */}
                <div className="flex-1 h-2.5 rounded-full bg-[#EEF3FA] overflow-hidden shadow-inner relative">
                  <div
                    className="h-full rounded-full relative overflow-hidden"
                    style={{
                      width: `${animatedPercentages[idx] || 0}%`,
                      background: getCategoryGradient(item.label, item.barColor, idx),
                      transition: 'width 1s cubic-bezier(0.22,1,0.36,1)',
                      boxShadow: (animatedPercentages[idx] || 0) > 0
                        ? '0 1px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.25)'
                        : 'none',
                    }}
                  >
                    {/* Subtle shimmer inside bar */}
                    {(animatedPercentages[idx] || 0) > 10 && (
                      <div className="kpi-bar-shimmer" />
                    )}
                  </div>
                </div>

                {/* Percentage */}
                <span
                  className="w-9 text-right font-bold text-[#0B1B4D] shrink-0 text-xs tabular-nums"
                  style={{
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  {animatedPercentages[idx] || 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
