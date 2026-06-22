import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
}

interface ToasterProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function Toaster({ toasts, onClose }: ToasterProps) {
  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let Icon = Info;
          let iconColor = 'text-[#D97706]';
          let bgColor = 'bg-white border-[#E5E1D8]';
          let barColor = 'bg-[#D97706]';

          if (toast.type === 'success') {
            Icon = CheckCircle2;
            iconColor = 'text-emerald-600';
            bgColor = 'bg-emerald-50 border-emerald-100';
            barColor = 'bg-emerald-600';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            iconColor = 'text-amber-600';
            bgColor = 'bg-amber-50 border-amber-100';
            barColor = 'bg-amber-600';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            iconColor = 'text-red-600';
            bgColor = 'bg-red-50 border-red-100';
            barColor = 'bg-red-600';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex gap-3 p-4 rounded-xl border shadow-xl ${bgColor} relative overflow-hidden transition-all duration-300 md:mr-0 ml-4`}
            >
              {/* Top tiny progress indicator bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-black/5">
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 4, ease: 'linear' }}
                  className={`h-full ${barColor}`}
                />
              </div>

              {/* Icon Container */}
              <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content Container */}
              <div className="flex-1 space-y-0.5 text-left">
                {toast.title && (
                  <h5 className="font-bold text-xs text-[#2D241E] font-sans">
                    {toast.title}
                  </h5>
                )}
                <p className="text-[11px] text-[#3E2F26] leading-relaxed font-sans font-semibold">
                  {toast.message}
                </p>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => onClose(toast.id)}
                className="shrink-0 p-1 hover:bg-black/5 rounded-lg text-[#8B7E74] hover:text-[#2D241E] transition-colors self-start"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
