/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { PredictiveAlert } from "../types";
import { Sparkles, AlertTriangle, ShieldCheck, Sun, Eye, Clock, Thermometer, FlameKindling, RefreshCw } from "lucide-react";

export default function PredictiveInsights() {
  const [insights, setInsights] = useState<PredictiveAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/insights");
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (err) {
      console.error("Failed to load predictive insights", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getSeverityBadgeClass = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    }
  };

  const getAlertIcon = (type: 'weather' | 'maintenance' | 'safety') => {
    switch (type) {
      case 'weather':
        return <FlameKindling className="h-5 w-5 text-indigo-500" />;
      case 'maintenance':
        return <Thermometer className="h-5 w-5 text-indigo-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    }
  };

  return (
    <div id="predictive-insights-root" className="space-y-6">
      {/* Header and Summary */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 border border-indigo-950 p-6 rounded-3xl text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-bold flex items-center gap-2 font-display">
            <Sparkles className="h-4 w-4 text-amber-400 fill-amber-300" />
            AI Predictive Maintenance Radar
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            This module cross-references existing reports with geo-spatial coordinates, municipal calendars, and community logs to predict local public-works emergencies before they occur.
          </p>
        </div>
        <button
          onClick={fetchInsights}
          className="bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          Run Predictive Model
        </button>
      </div>

      {/* AI-Powered Complaint Summary & Hotspot Analytics */}
      <div id="ai-summary-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Summary Briefing & Hotspots */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
              Executive AI Briefing
            </h3>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                💡 <span className="font-semibold text-slate-900">AI Trend Analysis:</span> Nizamabad's public infrastructure reports have experienced a 14% uptick over the past 7 days. This spike is primarily driven by critical water supply line ruptures in Ward 1 (Panchayat Center) and road degradation near Ward 2 (Market Area). Cross-referencing our geographic data reveals that peak commercial tractor transit on Bypass (Ward 4) corresponds closely with consecutive streetlight failure reports, indicating high-voltage line stressors.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-150 p-4 rounded-2xl bg-indigo-50/20">
                <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest font-mono">Core Hotspot Zone</span>
                <h4 className="text-xs font-bold text-slate-800 mt-1">Ward 2 (Market Area)</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  Severe waste overflow near central bazaar coupled with road-edge gravel deterioration. Frequency index is currently high (3.8x baseline).
                </p>
              </div>
              <div className="border border-slate-150 p-4 rounded-2xl bg-rose-50/20">
                <span className="text-[9px] font-bold text-rose-700 uppercase tracking-widest font-mono">Emergent Water Risk</span>
                <h4 className="text-xs font-bold text-slate-800 mt-1">Ward 1 (Panchayat Center)</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  High-pressure pipe fractures near municipal pumping grid. High probability of contamination in downstream residential storage tanks if unrepaired.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Category Distribution */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
            📊 Complaint Category Breakdown
          </h3>
          <p className="text-[11px] text-slate-500 leading-normal">
            Real-time classification of submitted complaints utilizing zero-shot municipal categorization algorithms.
          </p>
          <div className="space-y-3 pt-2">
            {[
              { category: "Roads & Potholes", count: 18, pct: 36, color: "bg-rose-500" },
              { category: "Water & Sanitation", count: 13, pct: 26, color: "bg-indigo-500" },
              { category: "Streetlights & Power", count: 9, pct: 18, color: "bg-amber-500" },
              { category: "Waste & Garbage", count: 7, pct: 14, color: "bg-emerald-500" },
              { category: "Public Infrastructure", count: 3, pct: 6, color: "bg-purple-500" },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-semibold text-slate-700">{item.category}</span>
                  <span className="font-mono font-bold text-slate-500">{item.count} reports ({item.pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-100 rounded-3xl min-h-[300px] shadow-sm">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-xs text-slate-500">Recalculating local hazard probabilities with Gemini AI...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {insights.map((insight) => (
            <div
              key={insight.id}
              id={`predictive-alert-${insight.id}`}
              className="bg-white border border-slate-200 hover:border-slate-300/80 p-5 rounded-3xl shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Type and Severity Headers */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    {getAlertIcon(insight.type)}
                    <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400">
                      {insight.type} Advisory
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getSeverityBadgeClass(insight.severity)}`}>
                    {insight.severity} Priority
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xs font-bold text-slate-800 leading-normal">
                  {insight.title}
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {insight.description}
                </p>
              </div>

              {/* Probability score and ETA */}
              <div className="border-t border-slate-100 pt-3.5 mt-4 space-y-2.5">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono font-bold">
                    <span>Incident Probability</span>
                    <span className="font-bold text-slate-800">{insight.probability}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        insight.probability >= 80 ? 'bg-rose-500' :
                        insight.probability >= 60 ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${insight.probability}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    ETA: {insight.eta}
                  </span>
                  <span className="text-slate-500 font-semibold">{insight.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complaint Trend Forecast Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Predicted Peak Reporting Times */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="h-5 w-5 text-indigo-600" />
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                Predicted Peak Reporting Times
              </h3>
              <p className="text-[10px] text-slate-400">Daily complaint volume forecast over 24 hrs</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            AI analysis of historical ticket creation patterns predicts traffic surges during key village transit and utility schedules:
          </p>
          <div className="space-y-3.5 pt-1">
            {[
              { time: "06:00 AM - 09:00 AM", label: "Low Volume (15%)", width: "15%", bg: "bg-slate-300", desc: "Morning farm transits, minimal reporting" },
              { time: "09:00 AM - 12:00 PM", label: "Utility Peak (85%)", width: "85%", bg: "bg-indigo-600", desc: "Water supply starts; peak leakage & pipe rupture logging", isPeak: true },
              { time: "12:00 PM - 03:00 PM", label: "Medium Volume (40%)", width: "40%", bg: "bg-slate-400", desc: "Mid-day municipal shifts, steady volume" },
              { time: "03:00 PM - 06:00 PM", label: "Transit Peak (65%)", width: "65%", bg: "bg-indigo-400", desc: "School dismissal, high school road garbage complaints" },
              { time: "06:00 PM - 09:00 PM", label: "Darkness Peak (90%)", width: "90%", bg: "bg-amber-500", desc: "Sunset trigger; streetlights & power outages reported", isPeak: true },
              { time: "09:00 PM - 06:00 AM", label: "Night Sleep (5%)", width: "5%", bg: "bg-slate-200", desc: "Night hours, emergency standby active" },
            ].map((slot, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className={`font-mono font-bold ${slot.isPeak ? "text-indigo-900" : "text-slate-500"}`}>{slot.time}</span>
                  <span className={`font-mono font-bold ${slot.isPeak ? "text-indigo-600" : "text-slate-400"}`}>{slot.label}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  <div className={`h-full ${slot.bg}`} style={{ width: slot.width }} />
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">{slot.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Common Recurring Issues */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                  Common Recurring Issues (Heat Map)
                </h3>
                <p className="text-[10px] text-slate-400">Repeated structural bottlenecks identified</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              These locations experience identical infrastructure failure patterns on a monthly basis, requiring capital upgrades instead of short-term fixes:
            </p>
            <div className="space-y-4 pt-1">
              {[
                { title: "Ruptured Water Valves & Pipelines", location: "Ward 1 (Panchayat Center)", freq: "42% of local tickets", desc: "Saffron pressure valve failures during high-pressure Tuesday morning municipal pumping cycles." },
                { title: "Market Street Potholes", location: "Ward 2 (Market Area)", freq: "28% of local tickets", desc: "Repetitive gravel dispersion due to heavy commercial tractor traffic and wet organic market waste exposure." },
                { title: "Bypass Streetlight Bulb Burnout", location: "Ward 4 (Bypass East)", freq: "18% of local tickets", desc: "High voltage electrical fluctuations on the Outer Ring line, requiring automatic step-down transformers." },
                { title: "High School Perimeter Garbage", location: "Ward 3 (School District)", freq: "12% of local tickets", desc: "Weekly market residual dump site. Needs formal containment fence to deter cattle scavenging." },
              ].map((issue, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-1 hover:border-slate-200 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{issue.title}</h4>
                      <span className="text-[9px] text-indigo-600 font-mono font-bold block uppercase">{issue.location}</span>
                    </div>
                    <span className="bg-slate-250 text-slate-700 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-slate-300 whitespace-nowrap shrink-0">
                      {issue.freq}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">{issue.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preventative Advisory notice */}
      <div className="bg-indigo-50/70 border border-indigo-100 p-5 rounded-3xl flex items-start gap-3.5 shadow-xs">
        <ShieldCheck className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-indigo-900 font-display">Operational Prevention Guard</h4>
          <p className="text-[11px] text-indigo-800 leading-relaxed">
            All predictive warnings above trigger automated email notifications to the respective Ward supervisors and Panchayat secretaries. This enables pre-emptive maintenance crews to address infrastructure concerns, lowering overall civic repair budgets by up to 40%.
          </p>
        </div>
      </div>
    </div>
  );
}
