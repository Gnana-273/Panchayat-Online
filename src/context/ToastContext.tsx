/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertTriangle, Info, Coins, Trophy, X } from "lucide-react";

export type ToastType = "success" | "info" | "warning" | "reward";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  subtitle?: string;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, subtitle?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType, subtitle?: string) => {
    const id = `toast-${Date.now()}`;
    const newToast: Toast = { id, message, type, subtitle };
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-emerald-100/50",
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
        };
      case "warning":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-950 shadow-amber-100/50",
          icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
        };
      case "reward":
        return {
          bg: "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 border-amber-400 text-white shadow-amber-300/30",
          icon: <Coins className="h-5 w-5 text-white animate-bounce shrink-0" />,
        };
      default:
        return {
          bg: "bg-indigo-50 border-indigo-200 text-indigo-950 shadow-indigo-150/50",
          icon: <Info className="h-5 w-5 text-indigo-600 shrink-0" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container portal overlay */}
      <div
        id="global-toast-container"
        className="fixed top-20 right-4 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const styles = getToastStyle(toast.type);
            const isReward = toast.type === "reward";

            return (
              <motion.div
                key={toast.id}
                id={`toast-item-${toast.id}`}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`pointer-events-auto border rounded-2xl p-4 flex gap-3 shadow-lg relative overflow-hidden ${styles.bg}`}
              >
                {/* Visual particle pulse for reward */}
                {isReward && (
                  <div className="absolute inset-0 bg-white/10 opacity-50 pointer-events-none mix-blend-overlay animate-pulse" />
                )}

                <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>

                <div className="flex-grow space-y-0.5">
                  <h4 className={`text-xs font-black ${isReward ? "text-white" : "text-slate-900"}`}>
                    {toast.message}
                  </h4>
                  {toast.subtitle && (
                    <p className={`text-[10px] leading-relaxed ${isReward ? "text-amber-100" : "text-slate-500"}`}>
                      {toast.subtitle}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className={`p-1 rounded-lg hover:bg-black/5 self-start shrink-0 cursor-pointer ${
                    isReward ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
