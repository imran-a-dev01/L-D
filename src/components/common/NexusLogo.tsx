import React from 'react';

interface NexusLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const NexusLogo: React.FC<NexusLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 38 : 30;
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const subtitleSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-sm';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* NEXUS Stylized Ribbon Mark */}
      <div 
        className="relative flex items-center justify-center shrink-0 rounded-lg overflow-hidden"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg viewBox="0 0 40 40" fill="none" className="w-full h-full drop-shadow-sm">
          <defs>
            <linearGradient id="nexusGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1265FF" />
              <stop offset="100%" stopColor="#00C6FF" />
            </linearGradient>
            <linearGradient id="nexusGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0D53D6" />
              <stop offset="100%" stopColor="#1265FF" />
            </linearGradient>
          </defs>
          {/* Folded ribbon polygon geometry */}
          <path
            d="M8 32 L19 9 C19.5 8 21 8 21.6 9 L28 22 L33 11 C33.4 10.2 34.6 10.2 35 11 L35.5 12 C36 13 35.8 14.2 35 15 L26 31 C25.4 32 24 32 23.4 31 L17 19 L11.5 31 C11 32 9.6 32 9 31 Z"
            fill="url(#nexusGrad1)"
          />
          <path
            d="M8 32 L17 19 L19 23 L11.5 31 Z"
            fill="url(#nexusGrad2)"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex items-center gap-2">
        <span className={`font-extrabold tracking-tight text-[#0B1B4D] font-['Plus_Jakarta_Sans',sans-serif] ${textSize}`}>
          L & T
        </span>
        {showSubtitle && (
          <div className="flex items-center gap-2">
            <span className="text-[#CBD5E1] font-light">|</span>
            <span className={`font-medium text-[#64748B] ${subtitleSize}`}>
              L&D Intelligence
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
