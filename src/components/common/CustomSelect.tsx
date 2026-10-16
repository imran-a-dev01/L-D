import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, Edit3, X, Sparkles, Save, CheckCircle2 } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
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
  allowOther = true, // Default to true so all dropdowns support "Other" seamlessly
  otherPlaceholder = 'Specify custom value...',
  onSaveCustomOption,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOtherActive, setIsOtherActive] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [maxMenuHeight, setMaxMenuHeight] = useState<number>(240);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic position calculation to ensure dropdown always stays fully visible inside the screen viewport
  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = 220;

    // If bottom space is constrained and space above is larger, flip open UPWARDS
    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      setPlacement('top');
      setMaxMenuHeight(Math.max(120, Math.min(240, spaceAbove - 16)));
    } else {
      setPlacement('bottom');
      setMaxMenuHeight(Math.max(120, Math.min(240, spaceBelow - 16)));
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Normalize options to { value, label, icon } safely, ignoring internal other tokens
  const safeOptions = Array.isArray(options) ? options.filter(Boolean) : [];
  const normalizedOptions: SelectOption[] = safeOptions
    .map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt))
    .filter((opt): opt is SelectOption => Boolean(opt && opt.value != null && opt.value !== '__OTHER__' && opt.value.toLowerCase() !== 'other' && opt.value.toLowerCase() !== 'others'));

  // If allowOther is enabled and list has standard options, append "+ Other"
  const displayOptions: SelectOption[] = allowOther
    ? [
        ...normalizedOptions,
        {
          value: '__OTHER__',
          label: '+ Other (Specify new entry...)',
          icon: <Plus className="w-3.5 h-3.5 text-[#1265FF]" />,
        },
      ]
    : normalizedOptions;

  // Sync internal other state with incoming value
  useEffect(() => {
    if (!allowOther) return;

    const isStandardOption = normalizedOptions.some((opt) => opt.value === value);

    if (value === '__OTHER__' || value.toLowerCase() === 'other' || value.toLowerCase() === 'others') {
      setIsOtherActive(true);
    } else if (!isStandardOption && value && value.trim() !== '') {
      // It's a custom value previously entered
      setIsOtherActive(true);
      setCustomValue(value);
    } else if (isStandardOption) {
      setIsOtherActive(false);
      setCustomValue('');
    }
  }, [value, allowOther, normalizedOptions.length]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (val: string) => {
    if (val === '__OTHER__' || val.toLowerCase() === 'other' || val.toLowerCase() === 'others') {
      setIsOtherActive(true);
      setCustomValue('');
      onChange(''); // clear until user enters custom text
      setIsOpen(false);
    } else {
      setIsOtherActive(false);
      setCustomValue('');
      onChange(val);
      setIsOpen(false);
    }
  };

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const pyPadding = size === 'sm' ? 'py-1.5 px-3 text-xs h-9' : 'py-2.5 px-3.5 text-xs sm:text-sm h-11';

  // DIRECT MANUAL ENTRY MODE: When DB has no saved options yet for this field
  if (allowOther && normalizedOptions.length === 0) {
    return (
      <div ref={containerRef} className={`relative w-full ${className}`}>
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3.5 text-[#1265FF] pointer-events-none">
              {icon}
            </span>
          )}
          <input
            type="text"
            disabled={disabled}
            value={value || customValue}
            onChange={(e) => {
              const val = e.target.value;
              setCustomValue(val);
              onChange(val);
            }}
            onBlur={async () => {
              const val = (value || customValue).trim();
              if (val && onSaveCustomOption) {
                await onSaveCustomOption(val);
              }
            }}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const val = (value || customValue).trim();
                if (val && onSaveCustomOption) {
                  setIsSaving(true);
                  const ok = await onSaveCustomOption(val);
                  setIsSaving(false);
                  if (ok) {
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 2000);
                  }
                }
              }
            }}
            placeholder={otherPlaceholder || placeholder || 'Type custom entry...'}
            className={`w-full ${icon ? 'pl-9.5' : 'pl-3.5'} pr-10 ${pyPadding} bg-[#F8FAFD] hover:bg-white focus:bg-white border ${
              saveSuccess ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-[#E3EAF5] focus:border-[#1265FF] focus:ring-2 focus:ring-blue-100'
            } rounded-xl font-medium transition-all shadow-2xs text-xs sm:text-sm text-[#0B1B4D] placeholder:text-[#94A3B8] disabled:bg-slate-100 disabled:opacity-60`}
          />
          {(value || customValue) && onSaveCustomOption && (
            <div className="absolute right-2.5 flex items-center gap-1">
              {saveSuccess ? (
                <span title="Saved to database">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={async () => {
                    const val = (value || customValue).trim();
                    if (!val) return;
                    setIsSaving(true);
                    const ok = await onSaveCustomOption(val);
                    setIsSaving(false);
                    if (ok) {
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 2000);
                    }
                  }}
                  className="text-[#1265FF] hover:text-[#0D52D6] p-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
                  title="Save to database catalog"
                >
                  {isSaving ? (
                    <div className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-600 font-medium">
          <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
          <span>{saveSuccess ? 'Saved to database' : 'Manual entry • Will be saved to database for future employees'}</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative w-full select-none ${className}`}>
      {/* Trigger Box */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            if (!isOpen) updatePosition();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full flex items-center justify-between ${pyPadding} bg-[#F8FAFD] hover:bg-white focus:bg-white border rounded-xl font-medium transition-all shadow-2xs text-left cursor-pointer ${
          isOpen
            ? 'border-[#016DD9] ring-2 ring-[#016DD9]/15 bg-white'
            : isOtherActive
            ? 'border-[#1265FF] ring-1 ring-[#1265FF]/20 bg-blue-50/20'
            : 'border-[#E3EAF5] hover:border-[#CBD5E1]'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {icon && <span className="text-[#94A3B8] shrink-0">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          
          {isOtherActive ? (
            <span className="truncate flex items-center gap-1.5 font-bold text-[#1265FF]">
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-[#1265FF] uppercase font-bold tracking-wide shrink-0">
                Custom
              </span>
              <span className="truncate text-[#0B1B4D]">
                {customValue || 'Specify custom value below...'}
              </span>
            </span>
          ) : (
            <span className={`truncate ${selectedOption ? 'text-[#0B1B4D] font-semibold' : 'text-[#94A3B8]'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[#94A3B8] transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? (placement === 'top' ? 'text-[#016DD9]' : 'rotate-180 text-[#016DD9]') : ''
          }`}
        />
      </button>

      {/* Modern Popover with Dynamic Auto-Placement (Always inside screen) */}
      {isOpen && (
        <div
          style={{ maxHeight: `${maxMenuHeight}px` }}
          className={`absolute left-0 right-0 z-50 bg-white rounded-2xl shadow-2xl border border-[#DFE5EE] p-1.5 animate-in fade-in zoom-in-95 duration-150 overflow-y-auto ${
            placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {displayOptions.map((opt) => {
            const isOther =
              opt.value === '__OTHER__' ||
              opt.value.toLowerCase() === 'other' ||
              opt.value.toLowerCase() === 'others';
            const isSelected = isOther ? isOtherActive : opt.value === value && !isOtherActive;

            return (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-[#016DD9] font-bold shadow-2xs'
                    : isOther
                    ? 'text-[#1265FF] font-semibold hover:bg-blue-50/60 border-t border-slate-100 mt-1'
                    : 'text-[#0B1B4D] hover:bg-slate-50 hover:text-[#016DD9]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#016DD9] shrink-0 ml-2" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Custom value input when "+ Other" is selected from active dropdown */}
      {allowOther && isOtherActive && (
        <div className="mt-1.5 relative animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-[#1265FF] pointer-events-none">
              <Edit3 className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={customValue}
              onChange={(e) => {
                const val = e.target.value;
                setCustomValue(val);
                onChange(val);
              }}
              onBlur={async () => {
                const val = customValue.trim();
                if (val && onSaveCustomOption) {
                  await onSaveCustomOption(val);
                }
              }}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = customValue.trim();
                  if (val && onSaveCustomOption) {
                    setIsSaving(true);
                    const ok = await onSaveCustomOption(val);
                    setIsSaving(false);
                    if (ok) {
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 2000);
                    }
                  }
                }
              }}
              placeholder={otherPlaceholder}
              className="w-full pl-9 pr-14 py-2 bg-white border border-[#1265FF] rounded-xl text-xs md:text-sm font-semibold text-[#0B1B4D] focus:outline-none focus:ring-2 focus:ring-[#1265FF]/20 shadow-2xs placeholder:text-slate-400 placeholder:font-normal"
              autoFocus
            />
            {customValue && (
              <div className="absolute right-2.5 flex items-center gap-1">
                {onSaveCustomOption && (
                  saveSuccess ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={async () => {
                        if (!customValue.trim()) return;
                        setIsSaving(true);
                        const ok = await onSaveCustomOption(customValue.trim());
                        setIsSaving(false);
                        if (ok) {
                          setSaveSuccess(true);
                          setTimeout(() => setSaveSuccess(false), 2000);
                        }
                      }}
                      className="text-[#016DD9] hover:text-[#005bb8] p-0.5 rounded cursor-pointer disabled:opacity-50"
                      title="Save to database"
                    >
                      {isSaving ? (
                        <div className="w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCustomValue('');
                    setSaveSuccess(false);
                    onChange('');
                  }}
                  className="text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer"
                  title="Clear custom value"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-600 font-medium">
            <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
            <span>{saveSuccess ? 'Saved to database' : 'Will be automatically registered in database for all employees'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
