/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Megaphone, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  X, 
  Info, 
  Award, 
  Droplet, 
  Globe 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "../context/LanguageContext";

interface NewsItem {
  id: string;
  title: string;
  date: string;
  category: "Government" | "Utilities" | "Development" | "Events";
  tag: string;
  excerpt: string;
  content: string;
  image: string;
  urgency: "Normal" | "Important" | "Critical";
  authority: string;
}

const NEWS_DATA: NewsItem[] = [
  {
    id: "news-1",
    title: "Sub-canal Drinking Water Pipeline Repair Completed",
    date: "June 28, 2026",
    category: "Utilities",
    tag: "Water Supply",
    excerpt: "The major repairs on the sub-canal drinking water pipeline supplying Ward 2 and Ward 3 have been completed ahead of schedule by the sanitation wing.",
    content: "The water supply department is pleased to announce that water line reinforcement and filtering upgrades at the main overhead reservoir have been fully executed. Residents of Ward 2 (Market Area) and Ward 3 (School District) who experienced partial low pressure last week will now receive full-pressure clean filtered water. Water testing has been conducted under WHO guidelines to ensure pristine safety. We thank all citizens for their cooperative patience during the 48-hour scheduled maintenance window.",
    image: "/src/assets/images/regenerated_image_1782739745990.png",
    urgency: "Important",
    authority: "Panchayat Water & Sanitation Committee"
  },
  {
    id: "news-2",
    title: "Annual Gram Panchayat Budget & Electrification Approval",
    date: "June 25, 2026",
    category: "Government",
    tag: "Budget 2026",
    excerpt: "The annual budget allocation meeting has approved ₹45 Lakhs for village electrification, road repaving, and smart water meter setup.",
    content: "Under the chair of the Sarpanch, the public budget review panel approved the development roadmap for the 2026-2027 fiscal year. Major funding highlights include ₹18 Lakhs dedicated to solar-powered LED streetlight expansion, ₹15 Lakhs for Ward 4 Bypass link road repaving, and ₹12 Lakhs for implementing secondary rainwater harvesting basins. All residents are invited to download the transparent budget sheet from the digital registry desk or review it in-person at the Panchayat Center.",
    image: "/src/assets/images/regenerated_image_1782739871984.png",
    urgency: "Normal",
    authority: "Gram Panchayat Budget Council"
  },
  {
    id: "news-3",
    title: "Digital Land Records & Aadhaar Seeding Desk Opens",
    date: "June 22, 2026",
    category: "Development",
    tag: "Digital India",
    excerpt: "A dedicated facilitation kiosk has been launched at the Panchayat office to assist farming families with land digitisation.",
    content: "As part of the digital governance sweep, the land registration desk is conducting a 2-week camp helping residents verify their land records on the national Dharani portal. Our trained computer assistants will help map your land surveys and seed biometric details to your identity records free of cost. This registration ensures eligibility for future farming credit schemes, fertilizers, and subsidy distributions. Please bring a copy of your Aadhaar card, current registration, and phone.",
    image: "/src/assets/images/regenerated_image_1782740373766.png",
    urgency: "Normal",
    authority: "Revenue Department Kiosk"
  },
  {
    id: "news-4",
    title: "Monsoon Preparedness Audit: Drainage Cleansing Drive",
    date: "June 19, 2026",
    category: "Events",
    tag: "Disaster Preparedness",
    excerpt: "A coordinated de-siltation drive is being carried out across major drains in the bypass and school districts to prevent stagnation.",
    content: "To guarantee smooth drainage during the upcoming heavy monsoon season, the Panchayat Sanitation Wing has launched an emergency clearance drive. Heavy excavator machinery has been deployed to de-clog primary canals and reinforce weak banks. Citizens are requested not to deposit plastic waste or garden debris near storm drains. In case of waterlogging or localized blockages, please immediately report the issue in the 'Panchayat Online' portal with a photo for instant routing to our ground response vehicle.",
    image: "/src/assets/images/regenerated_image_1782741875035.png",
    urgency: "Critical",
    authority: "Disaster Management & Safety Committee"
  }
];

export default function PanchayatNews() {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const { t } = useLanguage();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Utilities":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "Government":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Development":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "Events":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "Critical":
        return "bg-rose-500 text-white font-black animate-pulse";
      case "Important":
        return "bg-amber-500 text-white font-bold";
      default:
        return "bg-slate-100 text-slate-600 font-medium";
    }
  };

  return (
    <div id="panchayat-news-root" className="space-y-8">
      {/* Title Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-emerald-800 text-[10px] font-black tracking-widest uppercase font-mono">
          <Megaphone className="h-3 w-3 animate-bounce" />
          {t("Panchayat Notice Board")}
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-[#0a2540] font-display uppercase tracking-tight">
          {t("Panchayat News & Announcements")}
        </h2>
        <p className="text-slate-500 text-xs max-w-lg mx-auto">
          {t("Stay informed with active community news, local utility schedules, and administrative developments.")}
        </p>
        <div className="w-20 h-1 bg-emerald-500 mx-auto rounded-full" />
      </div>

      {/* Grid of news articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {NEWS_DATA.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -4 }}
            className="bg-white border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md rounded-2xl overflow-hidden flex flex-col justify-between text-left transition-all"
          >
            <div>
              {/* Card Image banner */}
              <div className="relative h-44 bg-slate-100 flex items-center justify-center overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className={`w-full h-full ${item.image.startsWith('/src') ? 'object-contain p-2 bg-slate-50' : 'object-cover'}`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 flex gap-1.5 items-center">
                  <span className={`text-[10px] font-black uppercase font-mono px-2.5 py-1 rounded-md border shadow-xs ${getCategoryColor(item.category)}`}>
                    {t(item.category)}
                  </span>
                  <span className={`text-[9px] font-black uppercase font-mono px-2.5 py-1 rounded-md shadow-xs ${getUrgencyBadge(item.urgency)}`}>
                    {t(item.urgency)}
                  </span>
                </div>
              </div>

              {/* Card content details */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono font-bold">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{t(item.date)}</span>
                  <span className="text-slate-200">•</span>
                  <span>{t(item.authority)}</span>
                </div>

                <h3 className="text-base font-black text-slate-900 leading-snug font-display hover:text-emerald-700 transition-colors">
                  {t(item.title)}
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed font-sans line-clamp-3">
                  {t(item.excerpt)}
                </p>
              </div>
            </div>

            {/* Read more footer trigger */}
            <div className="px-5 pb-5 pt-1 border-t border-slate-50/60 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md font-mono">
                #{t(item.tag)}
              </span>
              <button
                onClick={() => setSelectedNews(item)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 group cursor-pointer"
              >
                {t("Read Announcement")}
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modern Overlay Modal for Read More details */}
      <AnimatePresence>
        {selectedNews && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-100 rounded-3xl overflow-hidden max-w-2xl w-full relative shadow-2xl text-left flex flex-col max-h-[90vh]"
            >
              {/* Header banner image */}
              <div className="relative h-60 bg-slate-200 flex items-center justify-center overflow-hidden">
                <img
                  src={selectedNews.image}
                  alt={selectedNews.title}
                  className={`w-full h-full ${selectedNews.image.startsWith('/src') ? 'object-contain p-4 bg-slate-50' : 'object-cover'}`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <button
                  onClick={() => setSelectedNews(null)}
                  className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/75 transition-colors p-2 rounded-full cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-4 left-5 right-5 text-white">
                  <div className="flex gap-2 mb-2 items-center">
                    <span className="bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider font-mono px-2.5 py-0.5 rounded">
                      {t(selectedNews.category)}
                    </span>
                    <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider font-mono px-2.5 py-0.5 rounded">
                      {t(selectedNews.tag)}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black font-display leading-tight text-white drop-shadow-sm">
                    {t(selectedNews.title)}
                  </h3>
                </div>
              </div>

              {/* Scrollable details text */}
              <div className="p-6 md:p-8 space-y-4 overflow-y-auto">
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold">{t(selectedNews.date)}</span>
                  </div>
                  <span className="text-slate-200">|</span>
                  <div className="flex items-center gap-1">
                    <Info className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold">{t("Released by")}: {t(selectedNews.authority)}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic border-l-4 border-emerald-500 pl-4 bg-slate-50 py-2 rounded-r-lg">
                    {t(selectedNews.excerpt)}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed font-sans whitespace-pre-line">
                    {t(selectedNews.content)}
                  </p>
                </div>

                <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3 mt-6">
                  <Globe className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs text-indigo-900">
                    <span className="font-bold block uppercase tracking-wide text-[10px] text-indigo-700">{t("Digital Portal Notice")}</span>
                    <p className="leading-relaxed">
                      {t("This is an official digital broadcast issued by the Gram Panchayat administrative wing. For complaint registration or quick queries regarding this announcement, please use the citizen interactive desk.")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal footer Close */}
              <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setSelectedNews(null)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-5 rounded-lg cursor-pointer transition-all"
                >
                  {t("Close Notice")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
