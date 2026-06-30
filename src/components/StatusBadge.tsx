/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Check, Clock, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { IssueStatus } from "../types";

interface StatusBadgeProps {
  status: IssueStatus;
  animate?: boolean;
}

export default function StatusBadge({ status, animate = true }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case IssueStatus.RESOLVED:
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: <Check className="h-3 w-3 text-emerald-600 stroke-[3px]" />,
          label: "Resolved",
        };
      case IssueStatus.WORK_COMPLETED:
        return {
          bg: "bg-teal-50 text-teal-800 border-teal-200",
          icon: <Check className="h-3 w-3 text-teal-600" />,
          label: "Work Completed",
        };
      case IssueStatus.WAITING_APPROVAL:
        return {
          bg: "bg-pink-50 text-pink-800 border-pink-200",
          icon: <Clock className="h-3 w-3 text-pink-600" />,
          label: "Waiting Approval",
        };
      case IssueStatus.REOPENED:
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-200",
          icon: <AlertCircle className="h-3 w-3 text-rose-600" />,
          label: "Reopened",
        };
      case IssueStatus.DUPLICATE:
        return {
          bg: "bg-slate-100 text-slate-700 border-slate-300",
          icon: <AlertCircle className="h-3 w-3 text-slate-500" />,
          label: "Duplicate/Invalid",
        };
      case IssueStatus.IN_PROGRESS:
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          icon: <Clock className="h-3 w-3 text-amber-600 animate-spin-slow" />,
          label: "In Progress",
        };
      case IssueStatus.ASSIGNED:
        return {
          bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
          icon: <ArrowRight className="h-3 w-3 text-indigo-600" />,
          label: "Assigned",
        };
      case IssueStatus.VERIFIED:
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          icon: <Clock className="h-3 w-3 text-blue-600" />,
          label: "Verified",
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          icon: <FileText className="h-3 w-3 text-slate-500" />,
          label: "Submitted",
        };
    }
  };

  const { bg, icon, label } = getStatusStyles();

  if (!animate) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${bg}`}>
        {icon}
        {label}
      </span>
    );
  }

  if (status === IssueStatus.IN_PROGRESS) {
    return (
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: [0.95, 1.02, 0.95] }}
        transition={{
          repeat: Infinity,
          duration: 2.2,
          ease: "easeInOut",
        }}
        className={`inline-flex items-center gap-1.5 text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full border shadow-xs relative overflow-hidden ${bg}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span>{label}</span>
      </motion.div>
    );
  }

  if (status === IssueStatus.RESOLVED) {
    return (
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 280,
          damping: 15,
        }}
        className={`inline-flex items-center gap-1 text-[10px] font-black font-mono px-2.5 py-0.5 rounded-full border shadow-xs ${bg}`}
      >
        <motion.div
          initial={{ rotate: -45, scale: 0.5 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          {icon}
        </motion.div>
        <span>{label}</span>
      </motion.span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${bg}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
}
