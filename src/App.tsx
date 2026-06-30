/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import SplashScreen from "./components/SplashScreen";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [role, setRole] = useState<"citizen" | "admin">("citizen");

  const handlePortalEnter = (selectedRole: "citizen" | "admin") => {
    setRole(selectedRole);
    setShowSplash(false);
  };

  const handleLogout = () => {
    setShowSplash(true);
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-100 text-slate-800 flex flex-col sm:items-center sm:justify-center p-0 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1536px] min-h-screen sm:min-h-[92vh] bg-white sm:rounded-[32px] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] overflow-visible sm:overflow-hidden sm:border border-slate-200/50 flex flex-col flex-grow">
        <AnimatePresence mode="wait">
          {showSplash ? (
            <motion.div
              key="splash"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex-grow flex flex-col"
            >
              <SplashScreen onEnter={handlePortalEnter} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full flex-grow flex flex-col"
            >
              <Dashboard initialRole={role} onLogout={handleLogout} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
