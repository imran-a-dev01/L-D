import React from 'react';
import { LucideIcon, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconTextColor: string;
  cardBg?: string;
  cardBorder?: string;
  showMiniChart?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  trend,
  trendUp = true,
  subtitle,
  icon: Icon,
  iconBgColor,
  iconTextColor,
  cardBg = 'bg-white',
  cardBorder = 'border-[#DFE5EE]',
  showMiniChart = false,
  actionLabel,
  onAction,
  onClick,
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`flex flex-col justify-between ${cardBg} rounded-3xl border ${cardBorder} shadow-xs transition-all duration-200 relative overflow-hidden group ${
        isClickable
          ? 'cursor-pointer hover:shadow-lg hover:border-[#016DD9]/50 hover:-translate-y-0.5 active:translate-y-0'
          : 'hover:shadow-md'
      }`}
    >
      {/* Top Content Section */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Title - Fully visible with no truncation */}
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
              {title}
            </h2>
            <p className="mt-1.5 text-xs text-[#64748B] leading-relaxed">
              {subtitle || 'Suitable to grow steadily.'}
            </p>
          </div>
          <div
            className={`w-10 h-10 rounded-2xl ${iconBgColor} ${iconTextColor} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200`}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>

        {/* Big Light Typography Value matching Uiverse.io */}
        <div className="mt-5 flex items-baseline gap-2.5">
          <span className="text-4xl sm:text-5xl font-light tracking-tight text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif]">
            {value}
          </span>
          {trend && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                trendUp
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {trendUp ? (
                <ArrowUp className="w-3 h-3 stroke-[2.5]" />
              ) : (
                <ArrowDown className="w-3 h-3 stroke-[2.5]" />
              )}
              <span>{trend}</span>
            </span>
          )}
        </div>

        {/* Optional mini ascending chart bars for Skills Tracked */}
        {showMiniChart && (
          <div className="mt-3 flex items-end gap-1 opacity-80">
            <div className="w-1.5 h-2 bg-sky-300 rounded-xs"></div>
            <div className="w-1.5 h-3 bg-sky-400 rounded-xs"></div>
            <div className="w-1.5 h-4 bg-sky-400 rounded-xs"></div>
            <div className="w-1.5 h-5 bg-sky-500 rounded-xs"></div>
            <div className="w-1.5 h-6 bg-sky-600 rounded-xs"></div>
          </div>
        )}
      </div>

      {/* Conditional Bottom Section: Button OR Subtle Clickable Hint */}
      {actionLabel ? (
        <div className="flex px-6 pb-6 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAction?.();
            }}
            className="btn-shake flex items-center justify-center w-full px-5 py-2.5 text-center text-xs font-semibold focus:outline-none shadow-xs group-hover:shadow-sm cursor-pointer"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      ) : isClickable ? (
        <div className="px-6 pb-5 pt-0 flex items-center justify-between text-xs text-[#016DD9] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Click to view breakdown</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      ) : null}
    </div>
  );
};
