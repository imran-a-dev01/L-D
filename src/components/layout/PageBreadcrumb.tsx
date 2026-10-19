import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

export interface BreadcrumbCrumb {
  label: string;
  href?: string;
}

export interface PageBreadcrumbProps {
  label: string;
  items?: BreadcrumbCrumb[];
  className?: string;
}

export const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({
  label,
  items,
  className = '',
}) => {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-white rounded-xl border border-[#DFE5EE] shadow-2xs text-xs select-none ${className}`}
    >
      {/* Home link navigating to /admin (Overview) */}
      <Link 
        to="/admin" 
        className="flex items-center gap-1.5 text-[#64748B] font-medium hover:text-[#0B1B4D] transition-colors cursor-pointer"
        title="Go to Overview"
      >
        <Home className="w-3.5 h-3.5 text-[#64748B]" />
        <span>Home</span>
      </Link>

      {/* Intermediate breadcrumb items if any */}
      {items && items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 stroke-[2.5]" />
          {item.href ? (
            <Link 
              to={item.href} 
              className="text-[#64748B] font-medium hover:text-[#0B1B4D] transition-colors cursor-pointer"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[#64748B] font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}

      {/* Chevron before active current page */}
      <ChevronRight className="w-3.5 h-3.5 text-slate-300 stroke-[2.5]" />

      {/* Active highlighted blue chip with animated dot */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-50 text-[#1265FF] font-semibold border border-blue-100">
        <span className="w-1.5 h-1.5 rounded-full bg-[#1265FF] animate-pulse" />
        <span>{label}</span>
      </div>
    </nav>
  );
};
