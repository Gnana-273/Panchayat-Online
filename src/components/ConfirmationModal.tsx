/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, HelpCircle, CheckCircle, Info, X, Loader2 } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "info" | "success" | "warning" | "danger";
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  type = "info",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-6 w-6 text-emerald-600" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      case "danger":
        return <AlertTriangle className="h-6 w-6 text-rose-600" />;
      default:
        return <HelpCircle className="h-6 w-6 text-indigo-600" />;
    }
  };

  const getThemeClass = () => {
    switch (type) {
      case "success":
        return {
          iconBg: "bg-emerald-50 border border-emerald-100",
          confirmBtn: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500",
        };
      case "warning":
        return {
          iconBg: "bg-amber-50 border border-amber-100",
          confirmBtn: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400",
        };
      case "danger":
        return {
          iconBg: "bg-rose-50 border border-rose-100",
          confirmBtn: "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500",
        };
      default:
        return {
          iconBg: "bg-indigo-50 border border-indigo-100",
          confirmBtn: "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500",
        };
    }
  };

  const theme = getThemeClass();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
          {/* Backdrop Overlay */}
          <motion.div
            id="confirmation-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && onCancel()}
            className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs ${isSubmitting ? 'cursor-wait' : 'cursor-pointer'}`}
          />

          {/* Modal Container */}
          <motion.div
            id="confirmation-modal-content"
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.38, bounce: 0.15 }}
            className="relative bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 flex flex-col gap-4"
          >
            {/* Close button */}
            <button
              onClick={() => !isSubmitting && onCancel()}
              disabled={isSubmitting}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header / Icon Row */}
            <div className="flex gap-4 items-start pr-6">
              <div className={`p-3 rounded-2xl shrink-0 ${theme.iconBg}`}>
                {getIcon()}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-slate-900 font-display uppercase tracking-tight">
                  {title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100 mt-1">
              <button
                id="confirmation-modal-cancel-btn"
                onClick={onCancel}
                disabled={isSubmitting}
                className={`px-4 py-2.5 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 cursor-pointer'}`}
              >
                {cancelLabel}
              </button>
              <button
                id="confirmation-modal-confirm-btn"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center min-w-[100px] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.99] cursor-pointer'} ${theme.confirmBtn}`}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
