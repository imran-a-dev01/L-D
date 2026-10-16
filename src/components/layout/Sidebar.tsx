import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users, 
  CheckCircle2,
  GripVertical
} from 'lucide-react';

export type NavigationItem = 
  | 'overview' 
  | 'employee' 
  | 'profile-complete' 
  | 'directory';

interface SidebarProps {
  activeItem: NavigationItem;
  onSelect: (item: NavigationItem) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 200;
const MAX_WIDTH = 420;

export const Sidebar: React.FC<SidebarProps> = ({
  activeItem,
  onSelect,
  isCollapsed,
  onToggleCollapse,
  className = '',
}) => {
  // Load saved sidebar width from localStorage
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('nexus_sidebar_width');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
        return parsed;
      }
    }
    return DEFAULT_WIDTH;
  });

  const [isResizing, setIsResizing] = useState<boolean>(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Mouse drag handler for adjusting sidebar width
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing && sidebarRef.current) {
        const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
        if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
          setSidebarWidth(newWidth);
          localStorage.setItem('nexus_sidebar_width', String(newWidth));
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resize, stopResizing]);

  // Double click reset to default width
  const handleResetWidth = () => {
    setSidebarWidth(DEFAULT_WIDTH);
    localStorage.setItem('nexus_sidebar_width', String(DEFAULT_WIDTH));
  };

  // Only the 3 items requested by user: Overview, Employee, Profile Complete
  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: Home },
    { id: 'employee' as const, label: 'Employee', icon: Users },
    { id: 'profile-complete' as const, label: 'Profile Complete', icon: CheckCircle2 },
  ];

  return (
    <aside
      ref={sidebarRef}
      style={{
        width: isCollapsed ? '76px' : `${sidebarWidth}px`,
        transition: isResizing ? 'none' : 'width 240ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`relative shrink-0 bg-white border-r border-[#DFE5EE] shadow-[2px_0_12px_rgba(11,27,77,0.02)] h-full max-h-[calc(100vh-4rem)] flex flex-col justify-between p-3.5 select-none z-20 ${className}`}
    >
      {/* Floating Open/Close Toggle Button with Uiverse.io by Galahhad Animation */}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{ position: 'absolute', right: '-14px', top: '24px' }}
        className={`uiverse-burger z-30 ${isCollapsed ? 'is-active' : ''}`}
        title={isCollapsed ? 'Expand sidebar (Ctrl + B)' : 'Collapse sidebar (Ctrl + B)'}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Drag-to-Resize Right Handle (Active when expanded) */}
      {!isCollapsed && (
        <div
          onMouseDown={startResizing}
          onDoubleClick={handleResetWidth}
          style={{ position: 'absolute', top: 0, right: 0 }}
          className={`sidebar-resizer w-1.5 h-full cursor-col-resize z-20 group transition-all ${
            isResizing ? 'bg-[#016DD9] opacity-100' : 'hover:bg-[#016DD9]/40 opacity-0 hover:opacity-100'
          }`}
          title="Drag to adjust width • Double-click to reset (256px)"
        >
          <div className="absolute top-1/2 -translate-y-1/2 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-[#CBD5E1] rounded-sm py-1 shadow-xs pointer-events-none">
            <GripVertical className="w-3 h-3 text-[#64748B]" />
          </div>
        </div>
      )}

      {/* Top Section: Navigation Items with independent scroll when content exceeds */}
      <div className="flex-1 flex flex-col min-h-0 pt-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <nav className="space-y-3.5 pr-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Check active state (handle 'directory' mapping to 'employee' if needed)
            const isActive = activeItem === item.id || (item.id === 'employee' && activeItem === 'directory');

            return (
              <motion.button
                key={item.id}
                type="button"
                whileHover={{ x: isCollapsed ? 0 : 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`relative w-full flex items-center rounded-2xl text-[15px] font-semibold transition-colors duration-200 cursor-pointer overflow-hidden ${
                  isCollapsed
                    ? 'justify-center p-3.5'
                    : 'justify-start gap-3.5 px-4 py-3.5'
                } ${
                  isActive
                    ? 'text-[#016DD9] font-bold'
                    : 'text-[#64748B] hover:text-[#0B1B4D] hover:bg-slate-50/80'
                }`}
              >
                {/* Clear Active Pill Animation with Framer Motion spring physics */}
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-[#016DD9]/10 border-2 border-[#016DD9] rounded-2xl shadow-sm z-0"
                  />
                )}

                {/* Left Glowing Accent Bar Indicator */}
                {isActive && !isCollapsed && (
                  <motion.div
                    layoutId="sidebarActiveBar"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute left-0 top-2.5 bottom-2.5 w-1.5 bg-[#016DD9] rounded-r-full shadow-[0_0_10px_rgba(1,109,217,0.7)] z-10"
                  />
                )}

                {/* Navigation Icon */}
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform duration-200 relative z-10 ${
                    isActive ? 'text-[#016DD9] scale-110 drop-shadow-xs' : 'text-[#64748B]'
                  }`}
                />

                {/* Text Label */}
                {!isCollapsed && (
                  <span className="truncate whitespace-nowrap relative z-10 tracking-tight">
                    {item.label}
                  </span>
                )}

                {/* Active Indicator Dot on Right */}
                {isActive && !isCollapsed && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="ml-auto w-2 h-2 rounded-full bg-[#016DD9] shadow-[0_0_8px_rgba(1,109,217,0.6)] relative z-10" 
                  />
                )}
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Note: Bottom promo card completely removed per user request */}
    </aside>
  );
};

