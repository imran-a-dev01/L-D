import React from 'react';
import { PageBreadcrumb, BreadcrumbCrumb } from './PageBreadcrumb';

export interface PageHeaderProps {
  title: string;
  breadcrumbLabel?: string;
  breadcrumbItems?: BreadcrumbCrumb[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  breadcrumbLabel,
  breadcrumbItems,
  actions,
  className = '',
}) => {
  return (
    <div className={`space-y-4 mb-5 sm:mb-6 ${className}`}>
      {/* Top Row: Reusable PageBreadcrumb + optional right-aligned actions (e.g. Live Sync) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb label={breadcrumbLabel || title} items={breadcrumbItems} />
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Shared Page Heading (h1) */}
      <h1 className="text-2xl sm:text-[28px] md:text-[30px] font-extrabold text-[#0B1B4D] tracking-tight font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
        {title}
      </h1>
    </div>
  );
};
