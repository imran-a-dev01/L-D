import React, { useState } from 'react';
import { 
  Code, 
  Server, 
  Database, 
  Cloud, 
  BarChart3, 
  Wrench, 
  Briefcase, 
  ShieldAlert,
  Cpu
} from 'lucide-react';
import { getSkillIconUrl } from '../../lib/skillIcons';
import { SkillCategory } from '../../types/skill';

interface SkillIconProps {
  name: string;
  category?: SkillCategory | string;
  size?: number | 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showFallbackLabel?: boolean;
}

export const SkillIcon: React.FC<SkillIconProps> = ({
  name,
  category,
  size = 'md',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  let pixelSize = 22;
  if (typeof size === 'number') {
    pixelSize = size;
  } else if (size === 'xs') {
    pixelSize = 16;
  } else if (size === 'sm') {
    pixelSize = 18;
  } else if (size === 'md') {
    pixelSize = 22;
  } else if (size === 'lg') {
    pixelSize = 28;
  }

  const iconUrl = !hasError ? getSkillIconUrl(name) : null;

  // Category based fallback icons
  const renderFallbackIcon = () => {
    const iconProps = { size: pixelSize * 0.75, className: 'shrink-0' };
    switch (category) {
      case 'Frontend':
        return <Code {...iconProps} className="text-blue-600" />;
      case 'Backend':
        return <Server {...iconProps} className="text-indigo-600" />;
      case 'Database':
        return <Database {...iconProps} className="text-emerald-600" />;
      case 'Cloud':
        return <Cloud {...iconProps} className="text-sky-600" />;
      case 'Data':
        return <BarChart3 {...iconProps} className="text-purple-600" />;
      case 'DevOps & Tools':
        return <Wrench {...iconProps} className="text-amber-600" />;
      case 'Domain Expertise':
      case 'Domain':
        return <Briefcase {...iconProps} className="text-rose-600" />;
      default:
        return <Cpu {...iconProps} className="text-slate-600" />;
    }
  };

  if (iconUrl) {
    return (
      <div 
        className={`inline-flex items-center justify-center shrink-0 rounded transition-transform duration-150 ${className}`}
        style={{ width: pixelSize, height: pixelSize }}
      >
        <img
          src={iconUrl}
          alt={`${name} icon`}
          width={pixelSize}
          height={pixelSize}
          className="w-full h-full object-contain rounded drop-shadow-xs"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Elegant fallback container
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 rounded bg-slate-100/90 border border-slate-200/80 shadow-xs ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      title={category ? `${name} (${category})` : name}
    >
      {renderFallbackIcon()}
    </div>
  );
};
