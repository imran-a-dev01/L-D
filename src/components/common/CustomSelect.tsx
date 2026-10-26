import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, X, Save, CheckCircle2, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  allowOther?: boolean;
  otherPlaceholder?: string;
  onSaveCustomOption?: (value: string) => Promise<boolean>;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  icon,
  className = '',
  disabled = false,
  size = 'md',
  allowOther = true,
  otherPlaceholder,
  onSaveCustomOption,
  isLoading = false,
  isError = false,
  onRetry,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [maxMenuHeight, setMaxMenuHeight] = useState<number>(240);
  const [dropdownCoords, setDropdownCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputTextRef = useRef('');
  const skipBlurFinalizeRef = useRef(false);

  const syncInputText = (text: string) => {
    setInputText(text);
    inputTextRef.current = text;
  };

  const pyPadding = size === 'sm' ? 'py-1.5 px-3 text-xs h-9' : 'py-2.5 px-3.5 text-xs sm:text-sm h-11';

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = 220;

    let place: 'bottom' | 'top' = 'bottom';
    let maxHeight = 240;

    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      place = 'top';
      maxHeight = Math.max(120, Math.min(240, spaceAbove - 16));
    } else {
      maxHeight = Math.max(120, Math.min(240, spaceBelow - 16));
    }

    setPlacement(place);
    setMaxMenuHeight(maxHeight);

    const width = Math.max(rect.width, 160);
    const left = Math.min(Math.max(8, rect.left), viewportWidth - width - 8);

    if (place === 'top') {
      setDropdownCoords({ bottom: viewportHeight - rect.top + 6, left, width });
    } else {
      setDropdownCoords({ top: rect.bottom + 6, left, width });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    return () => clearTimeout(blurTimeoutRef.current);
  }, []);

  // Normalize and deduplicate options
  const normalizedOptions: SelectOption[] = useMemo(() => {
    const safe = Array.isArray(options) ? options.filter(Boolean) : [];
    const mapped = safe
      .map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt))
      .filter((opt): opt is SelectOption =>
        Boolean(opt && opt.value != null &&
          opt.value !== '__OTHER__' &&
          opt.value.toLowerCase() !== 'other' &&
          opt.value.toLowerCase() !== 'others')
      );
    const seen = new Set<string>();
    return mapped.filter((opt) => {
      const key = opt.value.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [options]);

  // Filter options by search text
  const filteredOptions = useMemo(() => {
    const q = inputText.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(opt =>
      opt.label.toLowerCase().includes(q) ||
      opt.value.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [normalizedOptions, inputText]);

  const selectedOption = useMemo(() =>
    normalizedOptions.find(opt => opt.value === value),
    [normalizedOptions, value]
  );

  const isCustomValue = !!value && value.trim() !== '' && !selectedOption;
  const displayValue = selectedOption ? selectedOption.label : (value || '');

  useEffect(() => { setSaveSuccess(false); }, [value]);

  // --- Handlers ---

  const handleOpen = () => {
    if (disabled) return;
    clearTimeout(blurTimeoutRef.current);
    if (allowOther) {
      syncInputText(displayValue);
    } else {
      syncInputText('');
    }
    setIsOpen(true);
    updatePosition();
    if (allowOther) {
      setTimeout(() => inputRef.current?.select(), 0);
    } else {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSelect = (optValue: string) => {
    clearTimeout(blurTimeoutRef.current);
    skipBlurFinalizeRef.current = true;
    onChange(optValue);
    syncInputText('');
    setIsOpen(false);
    setSaveSuccess(false);
  };

  const handleInputChange = (text: string) => {
    syncInputText(text);
    if (!isOpen) {
      setIsOpen(true);
      updatePosition();
    }
  };

  const finalize = () => {
    const trimmed = inputTextRef.current.trim();

    if (!trimmed) {
      if (allowOther) {
        onChange('');
      }
      return;
    }

    const exactMatch = normalizedOptions.find(opt =>
      opt.label.toLowerCase() === trimmed.toLowerCase() ||
      opt.value.toLowerCase() === trimmed.toLowerCase()
    );

    if (exactMatch) {
      onChange(exactMatch.value);
    } else if (allowOther) {
      onChange(trimmed);
    }
  };

  const handleBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      if (skipBlurFinalizeRef.current) {
        skipBlurFinalizeRef.current = false;
        setIsOpen(false);
        syncInputText('');
        return;
      }
      finalize();
      setIsOpen(false);
      syncInputText('');
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(blurTimeoutRef.current);
      const trimmed = inputText.trim();

      const exactMatch = normalizedOptions.find(opt =>
        opt.label.toLowerCase() === trimmed.toLowerCase() ||
        opt.value.toLowerCase() === trimmed.toLowerCase()
      );

      if (exactMatch) {
        handleSelect(exactMatch.value);
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0].value);
      } else if (allowOther && trimmed) {
        onChange(trimmed);
        syncInputText('');
        setIsOpen(false);
        if (onSaveCustomOption) {
          handleSaveCustom(trimmed);
        }
      }
      skipBlurFinalizeRef.current = true;
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      clearTimeout(blurTimeoutRef.current);
      setIsOpen(false);
      syncInputText('');
      skipBlurFinalizeRef.current = true;
      inputRef.current?.blur();
    }
  };

  const handleSaveCustom = async (val?: string) => {
    const toSave = (val || value || '').trim();
    if (!toSave || !onSaveCustomOption) return;
    setIsSaving(true);
    const ok = await onSaveCustomOption(toSave);
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const showDropdown = isOpen && (normalizedOptions.length > 0 || inputText.trim() !== '');

  // --- Loading State ---
  if (isLoading && normalizedOptions.length === 0) {
    return (
      <div ref={containerRef} className={`relative w-full ${className}`}>
        <div className={`w-full flex items-center gap-2.5 ${pyPadding} bg-[#F8FAFD] border border-[#E3EAF5] rounded-xl`}>
          {icon && <span className="text-[#94A3B8] shrink-0">{icon}</span>}
          <Loader2 className="w-4 h-4 text-[#94A3B8] animate-spin shrink-0" />
          <span className="text-xs text-[#94A3B8] font-medium">Loading options...</span>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (isError && normalizedOptions.length === 0) {
    return (
      <div ref={containerRef} className={`relative w-full ${className}`}>
        <div className={`w-full flex items-center justify-between ${pyPadding} bg-rose-50/50 border border-rose-200 rounded-xl`}>
          <div className="flex items-center gap-2">
            {icon && <span className="text-rose-400 shrink-0">{icon}</span>}
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-xs text-rose-600 font-medium">Failed to load options</span>
          </div>
          {onRetry && (
            <button type="button" onClick={onRetry} className="text-xs text-[#1265FF] hover:text-[#0D52D6] font-semibold flex items-center gap-1 cursor-pointer">
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- Empty State for non-allowOther ---
  if (!allowOther && normalizedOptions.length === 0 && !isLoading) {
    return (
      <div ref={containerRef} className={`relative w-full ${className}`}>
        <div className={`w-full flex items-center gap-2.5 ${pyPadding} bg-[#F8FAFD] border border-[#E3EAF5] rounded-xl opacity-60`}>
          {icon && <span className="text-[#94A3B8] shrink-0">{icon}</span>}
          <span className="text-xs text-[#94A3B8] font-medium">No options available</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative w-full select-none ${className}`}>
      {/* Searchable Input */}
      <div className="relative flex items-center">
        {icon && (
          <span className={`absolute left-3 pointer-events-none z-[1] ${isOpen ? 'text-[#1265FF]' : 'text-[#94A3B8]'}`}>
            {icon}
          </span>
        )}

        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={isOpen ? inputText : displayValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleOpen}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={isOpen
            ? (otherPlaceholder || (allowOther ? 'Search or type custom value...' : 'Search options...'))
            : placeholder
          }
          className={`w-full ${icon ? 'pl-9' : 'pl-3.5'} pr-14 ${pyPadding} bg-[#F8FAFD] hover:bg-white focus:bg-white border rounded-xl font-medium transition-all shadow-2xs text-[#0B1B4D] placeholder:text-[#94A3B8] disabled:bg-slate-100 disabled:opacity-60 cursor-pointer focus:cursor-text ${
            isOpen
              ? 'border-[#016DD9] ring-2 ring-[#016DD9]/15 bg-white'
              : saveSuccess
              ? 'border-emerald-400 ring-1 ring-emerald-200'
              : isCustomValue
              ? 'border-[#1265FF] ring-1 ring-[#1265FF]/20'
              : 'border-[#E3EAF5] hover:border-[#CBD5E1]'
          }`}
        />

        {/* Right-side controls */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {/* Save button for custom values */}
          {isCustomValue && !isOpen && onSaveCustomOption && (
            saveSuccess ? (
              <span title="Saved to database">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </span>
            ) : (
              <button
                type="button"
                disabled={isSaving}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveCustom();
                }}
                className="text-[#1265FF] hover:text-[#0D52D6] p-0.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
                title="Save to database catalog"
              >
                {isSaving ? (
                  <div className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
              </button>
            )
          )}

          {/* Clear button when typing */}
          {isOpen && inputText && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                syncInputText('');
                inputRef.current?.focus();
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Chevron */}
          <ChevronDown
            className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
              isOpen
                ? (placement === 'top' ? 'text-[#016DD9]' : 'rotate-180 text-[#016DD9]')
                : 'text-[#94A3B8]'
            }`}
          />
        </div>
      </div>

      {/* Custom value indicator */}
      {isCustomValue && !isOpen && (
        <div className="mt-0.5">
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-[#1265FF] uppercase font-bold tracking-wide">
            Custom
          </span>
        </div>
      )}

      {/* Dropdown Portal */}
      {showDropdown &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: dropdownCoords.top !== undefined ? `${dropdownCoords.top}px` : undefined,
              bottom: dropdownCoords.bottom !== undefined ? `${dropdownCoords.bottom}px` : undefined,
              left: `${dropdownCoords.left}px`,
              width: `${dropdownCoords.width}px`,
              maxHeight: `${maxMenuHeight}px`,
              zIndex: 99999,
            }}
            className="bg-white rounded-2xl shadow-2xl border border-[#DFE5EE] p-1.5 animate-in fade-in zoom-in-95 duration-150 overflow-y-auto"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(opt.value);
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-[#016DD9] font-bold shadow-2xs'
                        : 'text-[#0B1B4D] hover:bg-slate-50 hover:text-[#016DD9]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[11px] text-[#64748B] font-normal truncate">
                          ({opt.sublabel})
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#016DD9] shrink-0 ml-2" />}
                  </div>
                );
              })
            ) : inputText.trim() && allowOther ? (
              <div className="px-3 py-3 text-center space-y-1">
                <p className="text-xs text-[#64748B]">No matching options</p>
                <p className="text-[11px] text-[#94A3B8]">
                  Press <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px] font-mono border border-slate-200">Enter</kbd> to use &ldquo;<span className="font-semibold text-[#0B1B4D]">{inputText.trim()}</span>&rdquo;
                </p>
              </div>
            ) : (
              <div className="px-3 py-3 text-center">
                <p className="text-xs text-[#94A3B8]">No matching options</p>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
