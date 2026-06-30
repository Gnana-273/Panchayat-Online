/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  User, Coins, Award, Trophy, Trash2, Edit3, Save, X, Plus, 
  MapPin, Calendar, Check, AlertTriangle, Eye, EyeOff, Loader2, ArrowLeft
} from "lucide-react";
import { CommunityIssue, CitizenProfile, IssueCategory, IssueUrgency } from "../types";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";

interface MyProfileActivityProps {
  profile: CitizenProfile | null;
  issues: CommunityIssue[];
  myReportedIds: string[];
  onUpdateIssue: (issueId: string, updatedFields: any) => Promise<boolean>;
  onDeleteIssue: (issueId: string) => Promise<boolean>;
  onUpdateProfile: (name: string, avatar: string) => Promise<void>;
  onBackToFeed: () => void;
  onOpenReportForm: () => void;
}

export default function MyProfileActivity({
  profile,
  issues,
  myReportedIds,
  onUpdateIssue,
  onDeleteIssue,
  onUpdateProfile,
  onBackToFeed,
  onOpenReportForm
}: MyProfileActivityProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();

  // Filter issues reported by the current user
  const myReports = issues.filter(issue => {
    // Match by user email
    const isUserEmail = profile && issue.reporter?.email === profile.email;
    // Match by user name (fallback)
    const isUserName = profile && issue.reporter?.name === profile.name;
    // Match by tracked local IDs (covers anonymous/new issues)
    const isLocalTracked = myReportedIds.includes(issue.id);
    
    return isUserEmail || isUserName || isLocalTracked;
  });

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(profile?.name || "");
  const [profileAvatar, setProfileAvatar] = useState(profile?.avatar || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Issues editing state
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState<IssueCategory>(IssueCategory.OTHER);
  const [editUrgency, setEditUrgency] = useState<IssueUrgency>(IssueUrgency.MEDIUM);
  const [editWard, setEditWard] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editIsAnonymous, setEditIsAnonymous] = useState(false);
  const [isSavingIssue, setIsSavingIssue] = useState(false);

  // Deleting issue state
  const [deletingIssueId, setDeletingIssueId] = useState<string | null>(null);

  const handleEditProfileClick = () => {
    if (profile) {
      setProfileName(profile.name);
      setProfileAvatar(profile.avatar);
      setIsEditingProfile(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      showToast("Name cannot be empty", "warning");
      return;
    }
    setIsSavingProfile(true);
    try {
      await onUpdateProfile(profileName, profileAvatar);
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleEditIssueClick = (issue: CommunityIssue) => {
    setEditingIssueId(issue.id);
    setEditTitle(issue.title);
    setEditDescription(issue.description);
    setEditCategory(issue.category);
    setEditUrgency(issue.urgency);
    setEditWard(issue.location.ward);
    setEditAddress(issue.location.address);
    setEditImage(issue.image || "");
    setEditIsAnonymous(!!issue.isAnonymous);
  };

  const handleSaveIssue = async (id: string) => {
    if (!editTitle.trim()) {
      showToast("Title is required", "warning");
      return;
    }
    if (!editDescription.trim()) {
      showToast("Description is required", "warning");
      return;
    }
    setIsSavingIssue(true);
    try {
      const success = await onUpdateIssue(id, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        urgency: editUrgency,
        ward: editWard,
        address: editAddress,
        image: editImage,
        isAnonymous: editIsAnonymous
      });
      if (success) {
        setEditingIssueId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingIssue(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingIssueId(id);
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      const success = await onDeleteIssue(id);
      if (success) {
        setDeletingIssueId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header section with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToFeed}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("Back to Complaints Feed")}
        </button>
        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
          {t("My Activity & Profile Portal")}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card & Badges Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-10 -mt-10 pointer-events-none" />
            
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <User className="h-4 w-4 text-indigo-600" />
              {t("Citizen Identity Card")}
            </h3>

            {profile && (
              <div>
                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 font-bold block">{t("FULL NAME")}</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Enter name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 font-bold block">{t("AVATAR PRESET")}</label>
                      <div className="flex gap-2 justify-start py-1 flex-wrap">
                        {[
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
                          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
                          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
                          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80"
                        ].map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setProfileAvatar(url)}
                            className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                              profileAvatar === url ? "border-indigo-600 scale-110 shadow" : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="flex-1 text-center text-xs py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all cursor-pointer"
                      >
                        {t("Cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="flex-1 text-center text-xs py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow cursor-pointer flex items-center justify-center gap-1"
                      >
                        {isSavingProfile ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        {t("Save")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3 pb-2">
                    <div className="relative inline-block">
                      <img 
                        src={profile.avatar} 
                        alt="Citizen Avatar" 
                        className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-indigo-100 shadow-md"
                      />
                      <span className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full text-[9px] font-bold p-1.5 border-2 border-white flex items-center gap-0.5 shadow-sm">
                        <Coins className="h-3 w-3" />
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800">{profile.name}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{profile.email}</p>
                      <p className="text-[10px] text-indigo-700 font-bold font-mono tracking-wider uppercase mt-2 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/60 inline-block">
                        🏆 {t(profile.rankName)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center pt-2">
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                        <span className="text-[9px] text-slate-400 block font-mono font-bold uppercase">{t("Coins")}</span>
                        <span className="text-sm font-black text-indigo-600">{profile.coins}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                        <span className="text-[9px] text-slate-400 block font-mono font-bold uppercase">{t("Verifications")}</span>
                        <span className="text-sm font-black text-emerald-600">{profile.verificationsCount}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleEditProfileClick}
                      className="mt-4 text-xs text-indigo-600 hover:text-indigo-700 font-bold border border-indigo-200 hover:bg-indigo-50/50 py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 w-full transition-all cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      {t("Edit Profile Details")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Badges showcase */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Trophy className="h-4 w-4 text-amber-500" />
              {t("Panchayat Badges")} ({profile?.badges.length || 0})
            </h4>
            {profile && profile.badges.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {profile.badges.map((badge) => (
                  <div key={badge.id} className={`p-3 rounded-2xl border text-center space-y-1.5 transition-all hover:scale-102 ${badge.color}`}>
                    <span className="text-xs font-black block leading-tight">{t(badge.name)}</span>
                    <p className="text-[9px] leading-relaxed opacity-90">{t(badge.description)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4 italic">{t("No badges earned yet. Submit issues or verify reports to earn coins and badges!")}</p>
            )}
          </div>
        </div>

        {/* CRUD Complaints Management Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Award className="h-4.5 w-4.5 text-indigo-600" />
                  {t("My Reported Complaints")}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("Manage, edit, update, or delete all issues you reported in the Panchayat.")}
                </p>
              </div>
              <button
                onClick={onOpenReportForm}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer self-start sm:self-auto hover:scale-102"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("Report New Issue")}
              </button>
            </div>

            {/* List of my reports */}
            {myReports.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                  <AlertTriangle className="h-6 w-6 text-slate-400" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h4 className="text-xs font-black text-slate-800">{t("No complaints registered yet")}</h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {t("You haven't submitted any village issues. Report an issue to help improve our local Panchayat and earn rewards!")}
                  </p>
                </div>
                <button
                  onClick={onOpenReportForm}
                  className="bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer transition-all hover:scale-102"
                >
                  {t("File Your First Complaint")}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myReports.map((issue) => {
                  const isEditing = editingIssueId === issue.id;
                  const isConfirmingDelete = deletingIssueId === issue.id;

                  return (
                    <div 
                      key={issue.id} 
                      className={`border rounded-2xl p-5 transition-all space-y-4 relative ${
                        isEditing 
                          ? "border-indigo-400 bg-indigo-50/10 ring-1 ring-indigo-500/10" 
                          : isConfirmingDelete 
                          ? "border-rose-300 bg-rose-50/10" 
                          : "border-slate-200 bg-white hover:border-slate-300 shadow-xs"
                      }`}
                    >
                      {/* Normal View or Editing View */}
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h4 className="text-xs font-bold text-indigo-700 font-mono tracking-wider uppercase">📝 {t("Edit Complaint Details")}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">{issue.id}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase">{t("Title")}</label>
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase">{t("Category")}</label>
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value as IssueCategory)}
                                className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                {Object.values(IssueCategory).map((cat) => (
                                  <option key={cat} value={cat}>{t(cat)}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase">{t("Urgency Level")}</label>
                              <select
                                value={editUrgency}
                                onChange={(e) => setEditUrgency(e.target.value as IssueUrgency)}
                                className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                {Object.values(IssueUrgency).map((urg) => (
                                  <option key={urg} value={urg}>{t(urg)}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-400 font-bold uppercase">{t("Panchayat Ward")}</label>
                              <select
                                value={editWard}
                                onChange={(e) => setEditWard(e.target.value)}
                                className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="Ward 1 (Panchayat Center)">{t("Ward 1 (Panchayat Center)")}</option>
                                <option value="Ward 2 (Market Area)">{t("Ward 2 (Market Area)")}</option>
                                <option value="Ward 3 (Residential Block A)">{t("Ward 3 (Residential Block A)")}</option>
                                <option value="Ward 4 (Agricultural Outskirts)">{t("Ward 4 (Agricultural Outskirts)")}</option>
                                <option value="Ward 5 (General Area)">{t("Ward 5 (General Area)")}</option>
                              </select>
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[10px] text-slate-400 font-bold uppercase">{t("Detailed Address")}</label>
                              <input
                                type="text"
                                value={editAddress}
                                onChange={(e) => setEditAddress(e.target.value)}
                                className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <label className="text-[10px] text-slate-400 font-bold uppercase">{t("Detailed Description")}</label>
                              <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                rows={3}
                                className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                              />
                            </div>

                            <div className="flex items-center gap-2 md:col-span-2 py-1">
                              <input
                                type="checkbox"
                                id={`edit-anon-${issue.id}`}
                                checked={editIsAnonymous}
                                onChange={(e) => setEditIsAnonymous(e.target.checked)}
                                className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                              />
                              <label htmlFor={`edit-anon-${issue.id}`} className="text-xs text-slate-600 font-medium flex items-center gap-1 cursor-pointer">
                                {editIsAnonymous ? <EyeOff className="h-3.5 w-3.5 text-slate-400" /> : <Eye className="h-3.5 w-3.5 text-slate-400" />}
                                {t("Report anonymously (hide your identity details on feed)")}
                              </label>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setEditingIssueId(null)}
                              className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                            >
                              {t("Cancel")}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveIssue(issue.id)}
                              disabled={isSavingIssue}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              {isSavingIssue ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                              {t("Save Changes")}
                            </button>
                          </div>
                        </div>
                      ) : isConfirmingDelete ? (
                        <div className="space-y-3 text-center py-2">
                          <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                            <AlertTriangle className="h-5 w-5 text-rose-500" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-rose-900">{t("Retract & Delete Complaint?")}</h4>
                            <p className="text-[10px] text-rose-600 mt-1 max-w-md mx-auto leading-normal">
                              {t("Are you absolutely sure you want to delete this report? This will permanently remove the complaint from the Gram Panchayat portal and refund rewards.")}
                            </p>
                          </div>
                          <div className="flex justify-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setDeletingIssueId(null)}
                              className="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-4 py-1.5 rounded-xl cursor-pointer"
                            >
                              {t("Keep Report")}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(issue.id)}
                              className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-4 py-1.5 rounded-xl shadow-md cursor-pointer"
                            >
                              {t("Yes, Delete")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {/* Top row tags & categories */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="bg-slate-100 text-slate-700 text-[9px] font-mono font-bold px-2.5 py-1 rounded-full border border-slate-200/60">
                                {t(issue.category)}
                              </span>
                              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${
                                issue.urgency === "Critical" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                issue.urgency === "High" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                "bg-slate-50 text-slate-600 border-slate-200"
                              }`}>
                                {t(issue.urgency)}
                              </span>
                            </div>
                            
                            {/* Current Status Badge */}
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1 rounded-full border ${
                              issue.status === "Resolved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              issue.status === "In Progress" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                              issue.status === "Assigned" ? "bg-sky-50 text-sky-700 border-sky-200" :
                              "bg-slate-50 text-slate-700 border-slate-200"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                issue.status === "Resolved" ? "bg-emerald-500" :
                                issue.status === "In Progress" ? "bg-indigo-500" :
                                issue.status === "Assigned" ? "bg-sky-500" : "bg-slate-400"
                              }`} />
                              {t(issue.status)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-3">
                            {/* Content Column */}
                            <div className={`${issue.image ? 'md:col-span-8' : 'md:col-span-12'} space-y-2`}>
                              <h4 className="text-xs font-black text-slate-800 leading-snug">{issue.title}</h4>
                              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">{issue.description}</p>
                              
                              <div className="flex flex-col gap-1 text-[10px] text-slate-400 font-medium pt-1.5 border-t border-slate-50">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span className="text-slate-600 font-bold">{t(issue.location.ward)}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="truncate">{issue.location.address}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span>{t("Reported on:")} {new Date(issue.createdAt).toLocaleDateString()}</span>
                                  {issue.isAnonymous && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span className="text-amber-600 font-bold flex items-center gap-0.5">
                                        <EyeOff className="h-3 w-3" /> {t("Anonymous")}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Image Column if present */}
                            {issue.image && (
                              <div className="md:col-span-4 rounded-xl overflow-hidden border border-slate-200 max-h-24 md:max-h-28">
                                <img 
                                  src={issue.image} 
                                  alt={issue.title} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                          </div>

                          {/* Action Bar for CRUD (Edit, Delete, Details) */}
                          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5 mt-4">
                            <div className="flex items-center gap-2">
                              {issue.upvotes > 0 && (
                                <span className="text-[10px] text-slate-400 font-medium font-mono">
                                  👍 {issue.upvotes} {t("upvotes")}
                                </span>
                              )}
                              {issue.verifiedByCount > 0 && (
                                <span className="text-[10px] text-slate-400 font-medium font-mono">
                                  ✅ {issue.verifiedByCount} {t("verifications")}
                                </span>
                              )}
                            </div>

                            {/* Edit / Delete / Status specific constraints */}
                            <div className="flex gap-1.5">
                              {/* Can only edit if status is submitted or assigned (before in-progress/resolved for logical flow) */}
                              <button
                                type="button"
                                onClick={() => handleEditIssueClick(issue)}
                                className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200 rounded-xl transition-all flex items-center gap-1.5 text-[11px] font-bold cursor-pointer"
                                title="Edit complaint"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                <span>{t("Edit")}</span>
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(issue.id)}
                                className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-100 hover:border-rose-200 rounded-xl transition-all flex items-center gap-1.5 text-[11px] font-bold cursor-pointer"
                                title="Delete/Retract complaint"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>{t("Delete")}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
