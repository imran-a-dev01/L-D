import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

/**
 * Standard page container for NEXUS L&D.
 * Provides consistent width and padding across all admin and employee pages:
 * - Full width: w-full mx-auto
 * - Max width: max-w-[1840px] (centered on ultra-wide viewports)
 * - Horizontal gutters: px-4 (16px mobile), sm:px-6 (24px tablet), lg:px-8 (32px desktop)
 * On a 1920px screen, leaves exactly ~32-40px of comfortable gutter on each side.
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  as: Component = 'div',
}) => {
  return (
    <Component className={`w-full mx-auto max-w-[1840px] px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </Component>
  );
};
