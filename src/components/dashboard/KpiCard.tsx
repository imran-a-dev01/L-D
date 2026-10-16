import React, { useState, useEffect, useRef } from 'react';
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
  bgImage?: string;
  showMiniChart?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  onClick?: () => void;
}

// Animated counter hook for numbers
function useAnimatedCount(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target <= 0) { setCount(0); return; }

    startTime.current = null;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
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
  bgImage,
  showMiniChart = false,
  actionLabel,
  onAction,
  onClick,
}) => {
  const isClickable = Boolean(onClick);
  const [isHovered, setIsHovered] = useState(false);
  const [hasAppeared, setHasAppeared] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection observer for entrance animation
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

  // Parse numeric value for counter animation
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
  const isNumeric = !isNaN(numericValue) && typeof value === 'number';
  const isPercentage = typeof value === 'string' && value.includes('%');
  const percentNum = isPercentage ? parseFloat(String(value)) : 0;
  const animatedNum = useAnimatedCount(
    isNumeric ? numericValue : isPercentage ? percentNum : 0,
    1400
  );

  const displayValue = isNumeric
    ? animatedNum
    : isPercentage
    ? `${animatedNum}%`
    : value;

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`kpi-card-wrapper flex flex-col justify-between rounded-3xl relative overflow-hidden h-full group ${
        isClickable
          ? 'cursor-pointer'
          : ''
      }`}
      style={{
        opacity: hasAppeared ? 1 : 0,
        transform: hasAppeared ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* Animated gradient border glow */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none kpi-gradient-border"
        style={{
          padding: '1.5px',
          background: isHovered
            ? 'linear-gradient(135deg, #1265FF 0%, #6366F1 30%, #06B6D4 60%, #10B981 100%)'
            : 'linear-gradient(135deg, #E3EAF5 0%, #DFE5EE 100%)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          transition: 'background 0.5s ease',
        }}
      />

      {/* Inner card with glassmorphism */}
      <div
        className={`relative ${cardBg} rounded-3xl flex flex-col justify-between h-full`}
        style={{
          backdropFilter: isHovered ? 'blur(12px)' : 'none',
          background: isHovered
            ? 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,253,0.95) 100%)'
            : 'white',
          boxShadow: isHovered
            ? '0 8px 32px rgba(18,101,255,0.08), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)'
            : '0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
          transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
          transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        }}
      >
        {/* Subtle shimmer overlay on hover */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden"
          style={{
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}
        >
          <div className="kpi-shimmer" />
        </div>

        {/* Decorative ambient glow circle */}
        <div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
          style={{
            background: isHovered
              ? iconTextColor.includes('016DD9')
                ? 'radial-gradient(circle, rgba(18,101,255,0.08) 0%, transparent 70%)'
                : iconTextColor.includes('emerald')
                ? 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)'
              : 'transparent',
            transition: 'background 0.5s ease',
            transform: isHovered ? 'scale(1.3)' : 'scale(1)',
          }}
        />

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

        {/* Top Content Section */}
        <div className="p-6 pb-4 relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
                {title}
              </h2>
              <p className="mt-1.5 text-xs text-[#64748B] leading-relaxed">
                {subtitle || 'Suitable to grow steadily.'}
              </p>
            </div>

            {/* Icon with pulse ring on hover */}
            <div className="relative shrink-0">
              {isHovered && (
                <div
                  className={`absolute inset-0 rounded-2xl ${iconBgColor} kpi-icon-ping`}
                  style={{ opacity: 0.4 }}
                />
              )}
              <div
                className={`w-10 h-10 rounded-2xl ${iconBgColor} ${iconTextColor} flex items-center justify-center relative z-10`}
                style={{
                  transform: isHovered ? 'scale(1.12) rotate(-3deg)' : 'scale(1) rotate(0deg)',
                  transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                  boxShadow: isHovered
                    ? iconTextColor.includes('016DD9')
                      ? '0 4px 16px rgba(18,101,255,0.2)'
                      : iconTextColor.includes('emerald')
                      ? '0 4px 16px rgba(16,185,129,0.2)'
                      : '0 4px 16px rgba(99,102,241,0.2)'
                    : '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Animated Counter Value */}
          <div className="mt-5 flex items-baseline gap-2.5">
            <span
              className="text-4xl sm:text-5xl font-light tracking-tight text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif] kpi-value-text"
              style={{
                backgroundImage: isHovered
                  ? 'linear-gradient(135deg, #0B1B4D 0%, #1265FF 100%)'
                  : 'none',
                WebkitBackgroundClip: isHovered ? 'text' : 'unset',
                WebkitTextFillColor: isHovered ? 'transparent' : '#0B1B4D',
                transition: 'all 0.4s ease',
              }}
            >
              {displayValue}
            </span>
            {trend && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  trendUp
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
                style={{
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 0.3s ease',
                }}
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

          {/* Mini ascending chart bars */}
          {showMiniChart && (
            <div className="mt-3 flex items-end gap-1 opacity-80">
              {[2, 3, 4, 5, 6].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-xs"
                  style={{
                    height: `${h * 4}px`,
                    background: `linear-gradient(180deg, rgba(14,165,233,${0.5 + i * 0.1}) 0%, rgba(14,165,233,${0.3 + i * 0.15}) 100%)`,
                    transform: isHovered ? `scaleY(${1 + i * 0.08})` : 'scaleY(1)',
                    transformOrigin: 'bottom',
                    transition: `transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Section */}
        {actionLabel ? (
          <div className="flex px-6 pb-6 pt-1 relative z-10">
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
          <div
            className="px-6 pb-5 pt-0 flex items-center justify-between text-xs font-semibold relative z-10"
            style={{
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'translateY(0)' : 'translateY(4px)',
              transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <span className="text-[#1265FF]">Click to view breakdown</span>
            <ArrowRight
              className="w-3.5 h-3.5 text-[#1265FF]"
              style={{
                transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                transition: 'transform 0.3s ease',
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};
