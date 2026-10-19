import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, X } from 'lucide-react';

interface DeployableRolesGroupProps {
  roles?: string[];
  maxVisible?: number;
  className?: string;
}

export const DeployableRolesGroup: React.FC<DeployableRolesGroupProps> = ({
  roles = [],
  maxVisible = 3,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const cleanRoles = (roles || []).filter((r) => r && r.trim().length > 0);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen]);

  if (cleanRoles.length === 0) {
    return <span className="text-xs text-slate-400 font-normal">—</span>;
  }

  const visibleRoles = cleanRoles.slice(0, maxVisible);
  const remaining = cleanRoles.length - maxVisible;

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (buttonRef.current) {
      setAnchorRect(buttonRef.current.getBoundingClientRect());
      setIsOpen(true);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {visibleRoles.map((role) => (
        <span
          key={role}
          title={role}
          className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-semibold border border-purple-100 max-w-[130px] truncate"
        >
          {role}
        </span>
      ))}

      {remaining > 0 && (
        <>
          <button
            ref={buttonRef}
            type="button"
            onClick={handleOpen}
            onMouseEnter={handleOpen}
            className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 transition-colors cursor-pointer shrink-0"
            title={`View all ${cleanRoles.length} deployable roles`}
          >
            +{remaining} more
          </button>

          {isOpen &&
            anchorRect &&
            createPortal(
              <div
                ref={popoverRef}
                style={{
                  position: 'fixed',
                  top: `${Math.min(window.innerHeight - 200, anchorRect.bottom + 6)}px`,
                  left: `${Math.min(window.innerWidth - 260, Math.max(10, anchorRect.left))}px`,
                  zIndex: 9999,
                }}
                className="w-64 bg-white rounded-xl shadow-xl border border-[#DFE5EE] p-3 text-xs animate-in fade-in zoom-in-95 duration-150 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 font-bold text-[#0B1B4D]">
                    <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                    <span>Deployable Roles ({cleanRoles.length})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {cleanRoles.map((role) => (
                    <div
                      key={role}
                      className="px-2 py-1 bg-purple-50/60 rounded text-[#0B1B4D] font-medium text-[11px] border border-purple-100/60"
                    >
                      {role}
                    </div>
                  ))}
                </div>
              </div>,
              document.body
            )}
        </>
      )}
    </div>
  );
};
