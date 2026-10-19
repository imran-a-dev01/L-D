import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface ChipListProps<T> {
  items: T[];
  limit?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyText?: string;
  showAllToggle?: boolean;
  className?: string;
  itemContainerClassName?: string;
}

export function ChipList<T>({
  items = [],
  limit,
  renderItem,
  emptyText = 'None recorded',
  showAllToggle = true,
  className = '',
  itemContainerClassName = 'flex flex-wrap gap-1.5',
}: ChipListProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!items || items.length === 0) {
    return <span className="text-xs text-slate-400 italic font-normal">{emptyText}</span>;
  }

  const hasLimit = typeof limit === 'number' && limit > 0 && items.length > limit;
  const visibleItems = hasLimit && !isExpanded ? items.slice(0, limit) : items;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className={itemContainerClassName}>
        {visibleItems.map((item, idx) => renderItem(item, idx))}
      </div>

      {hasLimit && showAllToggle && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1265FF] hover:text-[#004dc7] hover:underline cursor-pointer transition-colors"
        >
          {isExpanded ? (
            <>
              <span>Show less</span>
              <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              <span>Show all ({items.length})</span>
              <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
