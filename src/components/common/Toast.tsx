import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Auto infer a modern title if not provided
    const inferredTitle = title || (
      type === 'success' ? 'Success' :
      type === 'error' ? 'Attention' :
      type === 'warning' ? 'Warning' : 'Notification'
    );

    const duration = type === 'error' ? 5000 : 3800;

    setToasts((prev) => [...prev, { id, type, message, title: inferredTitle, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Modern Toast Card with rounded corners, glassmorphism, micro-accent and progress bar
  const renderToastContent = (t: ToastItem) => {
    const isSuccess = t.type === 'success';
    const isError = t.type === 'error';
    const isWarning = t.type === 'warning';
    const isInfo = t.type === 'info';

    // Type styles configuration
    const config = {
      success: {
        icon: CheckCircle2,
        iconBg: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-emerald-500/10',
        borderColor: 'border-emerald-200/90',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        shadow: 'shadow-[0_18px_45px_-10px_rgba(16,185,129,0.22),0_8px_20px_-6px_rgba(11,27,77,0.06)]',
        accentBar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
        dot: 'bg-emerald-500 shadow-[0_0_8px_#10B981]'
      },
      error: {
        icon: AlertCircle,
        iconBg: 'bg-rose-500/10 text-rose-600 border border-rose-500/20 shadow-rose-500/10',
        borderColor: 'border-rose-200/90',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        shadow: 'shadow-[0_18px_45px_-10px_rgba(244,63,94,0.22),0_8px_20px_-6px_rgba(11,27,77,0.06)]',
        accentBar: 'bg-gradient-to-r from-rose-500 to-pink-500',
        dot: 'bg-rose-500 shadow-[0_0_8px_#F43F5E]'
      },
      warning: {
        icon: AlertTriangle,
        iconBg: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-amber-500/10',
        borderColor: 'border-amber-200/90',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        shadow: 'shadow-[0_18px_45px_-10px_rgba(245,158,11,0.22),0_8px_20px_-6px_rgba(11,27,77,0.06)]',
        accentBar: 'bg-gradient-to-r from-amber-500 to-orange-400',
        dot: 'bg-amber-500 shadow-[0_0_8px_#F59E0B]'
      },
      info: {
        icon: Sparkles,
        iconBg: 'bg-blue-500/10 text-[#1265FF] border border-blue-500/20 shadow-blue-500/10',
        borderColor: 'border-blue-200/90',
        badgeBg: 'bg-blue-50 text-[#1265FF] border-blue-200',
        shadow: 'shadow-[0_18px_45px_-10px_rgba(18,101,255,0.22),0_8px_20px_-6px_rgba(11,27,77,0.06)]',
        accentBar: 'bg-gradient-to-r from-[#1265FF] to-cyan-400',
        dot: 'bg-[#1265FF] shadow-[0_0_8px_#1265FF]'
      }
    }[t.type];

    const IconComponent = config.icon;

    return (
      <div className={`relative overflow-hidden w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl border ${config.borderColor} ${config.shadow} p-4 text-left pointer-events-auto`}>
        {/* Subtle top reflection sheen */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />

        <div className="flex items-start gap-3.5">
          {/* Glowing Icon Badge with soft round corner */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${config.iconBg}`}>
            <IconComponent className="w-5 h-5" />
          </div>

          {/* Toast Body */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${config.badgeBg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                {t.title}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-[#0B1B4D] leading-snug break-words">
              {t.message}
            </p>
          </div>

          {/* Dismiss Button with rounded hover effect */}
          <button
            onClick={() => removeToast(t.id)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-[#0B1B4D] hover:bg-slate-100/80 transition-colors shrink-0 cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Shrinking Progress Bar */}
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: (t.duration || 3800) / 1000, ease: 'linear' }}
          className={`absolute bottom-0 left-0 h-1 ${config.accentBar} opacity-80`}
        />
      </div>
    );
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container floating at top-right for high visibility and zero obstruction */}
      {isMounted && createPortal(
        <div 
          aria-live="polite"
          className="fixed top-6 right-6 z-[99999] flex flex-col gap-3 pointer-events-none max-w-sm sm:max-w-md w-full px-4 sm:px-0"
        >
          <AnimatePresence mode="popLayout">
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -24, scale: 0.92, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.92, y: -14, filter: 'blur(4px)', transition: { duration: 0.16 } }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 400, 
                  damping: 28,
                  layout: { duration: 0.2 } 
                }}
                className="w-full"
              >
                {renderToastContent(t)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
