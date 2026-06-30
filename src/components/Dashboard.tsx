/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  CommunityIssue,
  CitizenProfile,
  IssueCategory,
  IssueStatus,
} from "../types";
import MapView from "./MapView";
import IssueReportForm from "./IssueReportForm";
import AdminPortal from "./AdminPortal";
import SocialHub from "./SocialHub";
import MyProfileActivity from "./MyProfileActivity";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import {
  Landmark,
  Map,
  Grid,
  PlusCircle,
  Award,
  Eye,
  ThumbsUp,
  ShieldAlert,
  CheckCircle,
  ChevronRight,
  Calendar,
  User,
  UserCheck,
  UserCog,
  Coins,
  Trophy,
  Sparkles,
  AlertCircle,
  ShoppingBag,
  Edit2,
  Check,
  MessageSquare,
  ArrowLeft,
  LogOut,
  X,
  Star,
  CheckSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import StatusBadge from "./StatusBadge";
import ConfirmationModal from "./ConfirmationModal";

const getInitials = (name: string) => {
  if (!name) return "CO";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-emerald-100 text-emerald-800 border-emerald-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
    "bg-amber-100 text-amber-800 border-amber-200",
    "bg-rose-100 text-rose-800 border-rose-200",
    "bg-sky-100 text-sky-800 border-sky-200",
    "bg-violet-100 text-violet-800 border-violet-200",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

interface DashboardProps {
  initialRole: "citizen" | "admin";
  onLogout: () => void;
}

export default function Dashboard({ initialRole, onLogout }: DashboardProps) {
  const [role, setRole] = useState<"citizen" | "admin">(initialRole);
  const [issues, setIssues] = useState<CommunityIssue[]>([]);
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const { showToast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    "feed" | "map" | "leaderboard" | "social" | "profile"
  >("feed");
  const [reportInitialLocation, setReportInitialLocation] = useState<
    { address: string; ward: string; lat: number; lng: number } | undefined
  >(undefined);

  // Track session reported IDs
  const [myReportedIds, setMyReportedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("my_reported_ids") || "[]");
    } catch {
      return [];
    }
  });

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedWard, setSelectedWard] = useState<string | null>(null);

  // Selected issue detail overlay
  const [viewingIssue, setViewingIssue] = useState<CommunityIssue | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState<string>("");

  useEffect(() => {
    if (viewingIssue) {
      setSelectedRating(viewingIssue.satisfactionRating || 0);
      setRatingComment(viewingIssue.satisfactionFeedback || "");
    } else {
      setSelectedRating(0);
      setRatingComment("");
    }
  }, [viewingIssue]);

  // Form modal
  const [showReportForm, setShowReportForm] = useState(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  // Confirmation modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "danger";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => {},
  });
  const [pendingReportData, setPendingReportData] = useState<any | null>(null);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    }
  };

  // Load initial data
  const loadData = async () => {
    try {
      const issuesRes = await fetch("/api/issues");
      if (issuesRes.ok) {
        const issuesData = await issuesRes.json();
        setIssues(issuesData);
      }
      const profileRes = await fetch("/api/profile");
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        setEditName(profileData.name);
        setEditAvatar(profileData.avatar);
      }
      fetchLeaderboard();
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpvote = async (issueId: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/upvote`, {
        method: "POST",
      });
      if (res.ok) {
        const updated = await res.json();
        setIssues((prev) =>
          prev.map((issue) => (issue.id === issueId ? updated : issue)),
        );
        if (viewingIssue?.id === issueId) setViewingIssue(updated);

        if (updated.userUpvoted) {
          showToast(
            "Earned +10 Civic Coins! 🪙",
            "reward",
            "Thanks for upvoting and highlighting this community issue!",
          );
        } else {
          showToast("Upvote removed", "info");
        }

        // Refresh profile coins
        const profRes = await fetch("/api/profile");
        if (profRes.ok) {
          const updatedProfile = await profRes.json();
          setProfile(updatedProfile);
        }
        fetchLeaderboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (issueId: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/verify`, {
        method: "POST",
      });
      if (res.ok) {
        const { issue, profile: updatedProfile } = await res.json();
        setIssues((prev) => prev.map((i) => (i.id === issueId ? issue : i)));
        if (viewingIssue?.id === issueId) setViewingIssue(issue);

        if (
          updatedProfile.verificationsCount > (profile?.verificationsCount || 0)
        ) {
          showToast(
            "Earned +25 Civic Coins! 🪙",
            "reward",
            "Thanks for performing civic verification!",
          );
        } else {
          showToast("Verification retracted", "info");
        }

        // Check for badge unlocks
        if (updatedProfile.badges.length > (profile?.badges.length || 0)) {
          const newlyUnlocked =
            updatedProfile.badges[updatedProfile.badges.length - 1];
          showToast(
            `Unlocked '${newlyUnlocked.name}' Badge! 🏆`,
            "reward",
            newlyUnlocked.description,
          );
        }

        setProfile(updatedProfile);
        fetchLeaderboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFlag = async (issueId: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/flag`, {
        method: "POST",
      });
      if (res.ok) {
        const updated = await res.json();
        setIssues((prev) => prev.map((i) => (i.id === issueId ? updated : i)));
        if (viewingIssue?.id === issueId) setViewingIssue(updated);
        showToast(
          updated.userFlagged ? "Issue flagged for review" : "Flag removed",
          "info",
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReportSubmit = (formData: any) => {
    setPendingReportData(formData);
    setConfirmModal({
      isOpen: true,
      title: "Submit Complaint Report?",
      message: `Are you sure you want to submit "${formData.title}"? This will log the issue with the Gram Panchayat and assign it for official review.`,
      type: "info",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/issues", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });
          if (res.ok) {
            const { issue, profile: updatedProfile } = await res.json();
            setIssues((prev) => [issue, ...prev]);

            showToast(
              "Complaint Logged Successfully!",
              "success",
              "Your reported issue has been registered with the Gram Panchayat.",
            );
            showToast(
              "Earned +50 Civic Coins! 🪙",
              "reward",
              "Thank you for reporting this issue!",
            );

            // Check for badge unlocks
            if (updatedProfile.badges.length > (profile?.badges.length || 0)) {
              const newlyUnlocked =
                updatedProfile.badges[updatedProfile.badges.length - 1];
              showToast(
                `Unlocked '${newlyUnlocked.name}' Badge! 🏆`,
                "reward",
                newlyUnlocked.description,
              );
            }

            setMyReportedIds((prev) => {
              const next = [...prev, issue.id];
              localStorage.setItem("my_reported_ids", JSON.stringify(next));
              return next;
            });

            setProfile(updatedProfile);
            setShowReportForm(false);
            setActiveTab("feed");
            fetchLeaderboard();
          }
        } catch (err) {
          console.error(err);
        } finally {
          setPendingReportData(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleProfileSave = async () => {
    if (!editName.trim()) {
      showToast("Name cannot be empty", "warning");
      return;
    }
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, avatar: editAvatar }),
      });
      if (res.ok) {
        const updatedProfile = await res.json();
        setProfile(updatedProfile);
        setIsEditingProfile(false);
        showToast(
          "Profile Updated Successfully! 👤",
          "success",
          "Your village identity is now synchronized.",
        );
        fetchLeaderboard();
      }
    } catch (err) {
      console.error("Failed to save profile", err);
      showToast("Failed to save profile", "warning");
    }
  };

  const handleUpdateProfileDirect = async (name: string, avatar: string) => {
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar }),
      });
      if (res.ok) {
        const updatedProfile = await res.json();
        setProfile(updatedProfile);
        setEditName(updatedProfile.name);
        setEditAvatar(updatedProfile.avatar);
        showToast(
          "Profile Updated Successfully! 👤",
          "success",
          "Your village identity is now synchronized.",
        );
        fetchLeaderboard();
      }
    } catch (err) {
      console.error("Failed to save profile", err);
      showToast("Failed to save profile", "warning");
    }
  };

  const handleUpdateIssueDirect = async (
    issueId: string,
    updatedFields: any,
  ) => {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues);
        setProfile(data.profile);
        showToast(
          "Complaint updated successfully!",
          "success",
          "The issue details have been updated.",
        );
        fetchLeaderboard();
        return true;
      } else {
        showToast("Failed to update complaint", "warning");
        return false;
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating complaint", "warning");
      return false;
    }
  };

  const handleDeleteIssueDirect = async (issueId: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        setIssues(data.issues);
        setProfile(data.profile);
        showToast(
          "Complaint deleted successfully!",
          "success",
          "The issue has been retracted.",
        );
        setMyReportedIds((prev) => {
          const next = prev.filter((id) => id !== issueId);
          localStorage.setItem("my_reported_ids", JSON.stringify(next));
          return next;
        });
        fetchLeaderboard();
        return true;
      } else {
        showToast("Failed to delete complaint", "warning");
        return false;
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting complaint", "warning");
      return false;
    }
  };

  const handleAdminUpdate = async (issueId: string, updateData: any) => {
    try {
      const res = await fetch(`/api/issues/${issueId}/admin-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (res.ok) {
        const updated = await res.json();
        setIssues((prev) => prev.map((i) => (i.id === issueId ? updated : i)));
        if (viewingIssue?.id === issueId) setViewingIssue(updated);
        showToast(
          `Complaint marked as ${updateData.status || "Updated"}`,
          "success",
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    const matchCategory =
      selectedCategory === "All" || issue.category === selectedCategory;
    const matchStatus =
      selectedStatus === "All" || issue.status === selectedStatus;
    const matchWard =
      !selectedWard || issue.location.ward.includes(selectedWard.split(" ")[0]);
    return matchCategory && matchStatus && matchWard;
  });

  // Calculate metrics
  const totalReports = issues.length;
  const resolvedReports = issues.filter(
    (i) => i.status === IssueStatus.RESOLVED,
  ).length;
  const activeRepairs = issues.filter(
    (i) => i.status === IssueStatus.IN_PROGRESS,
  ).length;
  const pendingAssignment = issues.filter(
    (i) =>
      i.status === IssueStatus.SUBMITTED || i.status === IssueStatus.VERIFIED,
  ).length;
  const citizenSatisfaction =
    totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 100;

  // Store redeemables mock
  const REDEEMABLES = [
    {
      name: "Panchayat Community Hall Booking",
      cost: 200,
      desc: "Reserve community hall for personal/family ceremony.",
      icon: Landmark,
    },
    {
      name: "Solar-Powered Water Pump Coupon",
      cost: 400,
      desc: "Get 25% subsidy coupon on installing farm solar pumps.",
      icon: Coins,
    },
    {
      name: "Organic Tree Sapling Pack",
      cost: 50,
      desc: "Receive pack of 5 fruit/shade tree saplings for garden.",
      icon: Sparkles,
    },
    {
      name: "Digital Learning Tablet Subsidy",
      cost: 600,
      desc: "Acquire high-subsidized tablet for children education.",
      icon: Trophy,
    },
  ];

  return (
    <div
      id="app-dashboard"
      className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col"
    >
      {/* Top Banner Accent */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-white to-emerald-600 w-full" />

      {/* Main Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center p-0.5 shadow-sm overflow-hidden">
              <svg
                id="panchayat-official-logo"
                viewBox="0 0 500 500"
                className="w-full h-full"
              >
                <defs>
                  {/* Sky Gradient */}
                  <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#bae6fd" />
                    <stop offset="50%" stopColor="#e0f2fe" />
                    <stop offset="100%" stopColor="#fef08a" />
                  </linearGradient>

                  {/* Hill Gradients */}
                  <linearGradient id="hill-grad-1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#047857" />
                    <stop offset="100%" stopColor="#064e3b" />
                  </linearGradient>
                  <linearGradient id="hill-grad-2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#065f46" />
                  </linearGradient>

                  {/* Glistening River Gradient */}
                  <linearGradient id="river-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#bae6fd" />
                  </linearGradient>

                  {/* Terracotta Roof Gradient */}
                  <linearGradient id="roof-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ea580c" />
                    <stop offset="100%" stopColor="#9a3412" />
                  </linearGradient>

                  {/* Sun Glow */}
                  <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Outer Ring - Emerald */}
                <circle
                  cx="250"
                  cy="250"
                  r="235"
                  fill="none"
                  stroke="#047857"
                  strokeWidth="12"
                />
                {/* Inner Gold Accent Ring */}
                <circle
                  cx="250"
                  cy="250"
                  r="225"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="3"
                />

                {/* Clipped content inside circular frame */}
                <g clipPath="url(#logo-circle-clip)">
                  <clipPath id="logo-circle-clip">
                    <circle cx="250" cy="250" r="223" />
                  </clipPath>

                  {/* Morning Sky */}
                  <rect
                    x="0"
                    y="0"
                    width="500"
                    height="500"
                    fill="url(#sky-grad)"
                  />

                  {/* Glowing Sun */}
                  <circle cx="250" cy="180" r="80" fill="url(#sun-glow)" />
                  <circle cx="250" cy="180" r="45" fill="#f59e0b" />

                  {/* Sun rays */}
                  <polygon points="250,110 246,90 254,90" fill="#f59e0b" />
                  <polygon points="190,135 175,120 182,113" fill="#f59e0b" />
                  <polygon points="310,135 325,120 318,113" fill="#f59e0b" />
                  <polygon points="170,180 150,176 150,184" fill="#f59e0b" />
                  <polygon points="330,180 350,176 350,184" fill="#f59e0b" />

                  {/* Flying Birds */}
                  <path
                    d="M 160,100 Q 166,93 172,100 Q 178,93 184,100"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 200,115 Q 205,109 210,115 Q 215,109 220,115"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 130,125 Q 134,120 138,125 Q 142,120 146,125"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />

                  {/* Back Hills / Mountains */}
                  <path
                    d="M 0,270 Q 130,180 260,240 T 500,200 L 500,500 L 0,500 Z"
                    fill="url(#hill-grad-1)"
                  />

                  {/* Front Rolling Hills */}
                  <path
                    d="M 0,310 Q 160,230 310,280 T 500,250 L 500,500 L 0,500 Z"
                    fill="url(#hill-grad-2)"
                  />

                  {/* Lush Paddy Fields Grid on Left */}
                  <polygon
                    points="0,310 160,275 220,380 0,390"
                    fill="#047857"
                    opacity="0.85"
                  />
                  <polygon
                    points="0,390 220,380 150,500 0,500"
                    fill="#065f46"
                  />

                  {/* Bright Farm Terraces on Right */}
                  <polygon
                    points="250,265 500,250 500,400 280,380"
                    fill="#10b981"
                  />
                  <polygon
                    points="280,380 500,400 500,500 150,500"
                    fill="#15803d"
                  />

                  {/* Golden crop rows / rows of paddy */}
                  <line
                    x1="320"
                    y1="285"
                    x2="380"
                    y2="370"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1="360"
                    y1="280"
                    x2="430"
                    y2="365"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1="400"
                    y1="275"
                    x2="480"
                    y2="360"
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1="220"
                    y1="410"
                    x2="380"
                    y2="495"
                    stroke="#a3e635"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                  />
                  <line
                    x1="260"
                    y1="400"
                    x2="440"
                    y2="485"
                    stroke="#a3e635"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                  />

                  {/* Winding Blue River / Canal */}
                  <path
                    d="M 230,255 C 220,290 270,320 190,380 C 110,440 180,470 140,500 L 210,500 C 240,470 180,440 260,380 C 340,320 250,290 250,255 Z"
                    fill="url(#river-grad)"
                  />

                  {/* Traditional Village Huts */}
                  {/* Main Hut */}
                  <g id="main-village-hut">
                    {/* Wall */}
                    <polygon
                      points="80,345 130,345 130,385 80,385"
                      fill="#fef3c7"
                      stroke="#b45309"
                      strokeWidth="1.5"
                    />
                    {/* Roof */}
                    <polygon
                      points="70,345 105,315 140,345"
                      fill="url(#roof-grad)"
                      stroke="#9a3412"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    {/* Door */}
                    <rect
                      x="98"
                      y="358"
                      width="14"
                      height="27"
                      fill="#78350f"
                      rx="1"
                    />
                    {/* Window */}
                    <rect
                      x="114"
                      y="353"
                      width="10"
                      height="10"
                      fill="#3c2f2f"
                      stroke="#b45309"
                      strokeWidth="1"
                    />
                  </g>

                  {/* Secondary Nested Hut */}
                  <g id="nested-village-hut">
                    {/* Wall */}
                    <rect
                      x="345"
                      y="315"
                      width="45"
                      height="35"
                      fill="#ffedd5"
                      stroke="#b45309"
                      strokeWidth="1.2"
                    />
                    {/* Roof */}
                    <polygon
                      points="335,315 367,290 400,315"
                      fill="url(#roof-grad)"
                      stroke="#9a3412"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    {/* Door */}
                    <rect
                      x="360"
                      y="327"
                      width="12"
                      height="23"
                      fill="#78350f"
                      rx="1"
                    />
                  </g>

                  {/* Tall Coconut Palm Tree (Left Side) */}
                  <g id="coconut-palm-tree">
                    {/* Trunk */}
                    <path
                      d="M 55,370 Q 40,285 75,215"
                      fill="none"
                      stroke="#78350f"
                      strokeWidth="6.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 55,370 Q 40,285 75,215"
                      fill="none"
                      stroke="#92400e"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeDasharray="8 8"
                    />
                    {/* Palm Leaves */}
                    <path
                      d="M 75,215 Q 90,200 115,200"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 75,215 Q 95,215 120,225"
                      fill="none"
                      stroke="#15803d"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 75,215 Q 60,205 35,200"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 75,215 Q 60,225 35,240"
                      fill="none"
                      stroke="#14532d"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 75,215 Q 75,235 85,255"
                      fill="none"
                      stroke="#15803d"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 75,215 Q 50,220 45,230"
                      fill="none"
                      stroke="#166534"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* Coconuts */}
                    <circle cx="70" cy="220" r="5" fill="#854d0e" />
                    <circle cx="78" cy="221" r="4.5" fill="#854d0e" />
                    <circle cx="74" cy="226" r="4" fill="#a16207" />
                  </g>

                  {/* Majestic Shade Tree (Right Side) */}
                  <g id="banyan-shade-tree">
                    {/* Trunk */}
                    <path
                      d="M 425,340 L 425,280"
                      stroke="#78350f"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    {/* Canopy */}
                    <circle cx="425" cy="260" r="35" fill="#15803d" />
                    <circle cx="400" cy="270" r="28" fill="#166534" />
                    <circle cx="450" cy="270" r="28" fill="#14532d" />
                    <circle cx="425" cy="240" r="25" fill="#22c55e" />
                  </g>

                  {/* Traditional Fence */}
                  <g
                    id="village-fence"
                    stroke="#78350f"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="138" y1="365" x2="175" y2="365" />
                    <line x1="138" y1="375" x2="175" y2="375" />
                    <line x1="145" y1="360" x2="145" y2="385" />
                    <line x1="158" y1="360" x2="158" y2="385" />
                    <line x1="171" y1="360" x2="171" y2="385" />
                  </g>

                  {/* Green Leaves Cradling the bottom of the logo */}
                  {/* Left Leaf */}
                  <path
                    d="M 246,430 C 190,425 140,380 125,305 C 160,345 205,375 246,380 Z"
                    fill="#15803d"
                  />
                  <path
                    d="M 246,380 C 205,375 160,345 125,305 C 165,325 210,345 246,355 Z"
                    fill="#22c55e"
                  />

                  {/* Right Leaf */}
                  <path
                    d="M 254,430 C 310,425 360,380 375,305 C 340,345 295,375 254,380 Z"
                    fill="#15803d"
                  />
                  <path
                    d="M 254,380 C 295,375 340,345 375,305 C 335,325 290,345 254,355 Z"
                    fill="#22c55e"
                  />
                </g>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight font-display flex items-center gap-1.5 uppercase">
                {t("Panchayat")} <span className="text-indigo-600">Online</span>
              </h1>
              <p className="text-[9px] text-indigo-600 font-bold font-mono tracking-widest uppercase">
                {t("Nizamabad Division, Telangana")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {profile && (
              <div className="hidden sm:flex gap-4 items-center mr-1">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                    {t("Coins")}
                  </span>
                  <span className="text-xs font-black text-indigo-600">
                    {profile.coins} {t("Coins")}
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-200 self-center"></div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                    {t("Impact Rank")}
                  </span>
                  <span className="text-xs font-black text-emerald-600">
                    {profile.rankName}
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-200 self-center mx-2"></div>
              </div>
            )}

            {/* Compact Dashboard Language Toggle */}
            <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-xl p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`text-[10px] px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("te")}
                className={`text-[10px] px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                  language === "te"
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                తె
              </button>
              <button
                type="button"
                onClick={() => setLanguage("hi")}
                className={`text-[10px] px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                  language === "hi"
                    ? "bg-white text-indigo-700 shadow-xs border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                हि
              </button>
            </div>

            {/* Active Profile Indicator */}
            <button
              type="button"
              onClick={() => {
                if (role !== "admin") {
                  setActiveTab("profile");
                  setShowReportForm(false);
                }
              }}
              className={`text-xs font-bold py-2 px-3.5 rounded-xl border flex items-center gap-1.5 transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                role === "admin"
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 select-none"
                  : activeTab === "profile" && !showReportForm
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/60"
              }`}
            >
              {role === "admin" ? (
                <UserCheck className="h-3.5 w-3.5" />
              ) : (
                <UserCog className="h-3.5 w-3.5" />
              )}
              <span className="hidden md:inline">
                {role === "admin" ? t("Officer Profile") : t("Citizen Profile")}
              </span>
              <span className="inline md:hidden">
                {role === "admin" ? t("Officer") : t("Profile")}
              </span>
            </button>

            <button
              onClick={onLogout}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50/70 hover:bg-rose-100/85 border border-rose-200/60 py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 hover:shadow-xs active:scale-95 duration-250 hover:-translate-x-0.5"
              title="Logout from Account"
            >
              <LogOut className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">{t("Logout")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full space-y-6">
        {/* Conditional Portal layouts */}
        {role === "admin" ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-3xl border border-indigo-950 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold font-display">
                  {t("Panchayat Administration Portal")}
                </h2>
                <p className="text-xs text-indigo-200 mt-1">
                  {t(
                    "Review active village complaints, update repair statuses, and upload work order logs.",
                  )}
                </p>
              </div>
              <span className="bg-indigo-800 text-indigo-100 font-mono text-[10px] px-3 py-1 rounded-full border border-indigo-700 font-bold">
                {t("Authorized Sarpanch Account")}
              </span>
            </div>
            <AdminPortal issues={issues} onUpdateIssue={handleAdminUpdate} />
          </div>
        ) : (
          /* CITIZEN WORKSPACE VIEW */
          <div className="space-y-6">
            {/* Quick Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto">
                {[
                  { id: "feed", label: "Complaints Feed", icon: Grid },
                  { id: "map", label: "Live Map", icon: Map },
                  {
                    id: "leaderboard",
                    label: "Leaderboard & Rewards",
                    icon: Award,
                  },
                  { id: "social", label: "Social Hub", icon: MessageSquare },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    id={`tab-btn-${tab.id}`}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setShowReportForm(false);
                      setReportInitialLocation(undefined);
                    }}
                    className={`flex items-center gap-2 text-xs font-bold py-2.5 px-4 rounded-xl border whitespace-nowrap transition-all cursor-pointer relative ${
                      activeTab === tab.id && !showReportForm
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {t(tab.label)}
                  </button>
                ))}
              </div>

              <button
                id="file-issue-trigger-btn"
                onClick={() => {
                  setReportInitialLocation(undefined);
                  setShowReportForm(true);
                }}
                className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:from-indigo-700 hover:via-violet-700 hover:to-pink-700 text-white font-black text-xs py-3 px-6 rounded-2xl shadow-xl shadow-indigo-200/60 flex items-center gap-2 cursor-pointer self-start sm:self-auto hover:scale-[1.05] active:scale-95 transition-all duration-300 ring-4 ring-indigo-500/20 hover:ring-indigo-500/40"
              >
                <PlusCircle className="h-4 w-4 animate-bounce-slow" />
                {t("Report New Issue")}
              </button>
            </div>

            {/* Sub Screens Router */}
            {showReportForm ? (
              <IssueReportForm
                onSubmit={handleReportSubmit}
                onCancel={() => setShowReportForm(false)}
                initialLocation={reportInitialLocation}
              />
            ) : (
              <div>
                {/* 1. MAP WORKSPACE */}
                {activeTab === "map" && (
                  <MapView
                    issues={issues}
                    selectedIssue={viewingIssue}
                    onSelectIssue={(issue) => {
                      setViewingIssue(issue);
                      setActiveTab("feed");
                    }}
                    selectedWard={selectedWard}
                    onSelectWard={(ward) => setSelectedWard(ward)}
                    onReportFromLocation={(locationData) => {
                      setReportInitialLocation(locationData);
                      setShowReportForm(true);
                    }}
                    onAddIssues={(newIssues) => {
                      setIssues((prev) => {
                        const existingIds = new Set(prev.map((i) => i.id));
                        const filtered = newIssues.filter(
                          (i) => !existingIds.has(i.id),
                        );
                        return [...filtered, ...prev];
                      });
                    }}
                  />
                )}

                {/* 3. GAMIFICATION / REWARDS WORKSPACE */}
                {activeTab === "leaderboard" && (
                  <div className="space-y-6 font-sans">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left Column: profile diagnostics - 4/12 */}
                      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 space-y-5 h-fit shadow-sm">
                        {profile && (
                          <div className="space-y-4">
                            {isEditingProfile ? (
                              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                                  Edit Profile Details
                                </h4>
                                <div className="space-y-2">
                                  <label className="text-[10px] text-slate-400 font-bold block">
                                    NAME
                                  </label>
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) =>
                                      setEditName(e.target.value)
                                    }
                                    className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="Enter name"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] text-slate-400 font-bold block">
                                    CHOOSE AVATAR
                                  </label>
                                  <div className="flex gap-2 justify-center py-1 flex-wrap">
                                    {[
                                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
                                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
                                      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
                                      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
                                      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
                                    ].map((url, i) => (
                                      <button
                                        key={i}
                                        onClick={() => setEditAvatar(url)}
                                        className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                                          editAvatar === url
                                            ? "border-indigo-600 scale-110 shadow-md"
                                            : "border-transparent opacity-60 hover:opacity-100"
                                        }`}
                                      >
                                        <img
                                          src={url}
                                          alt={`Avatar ${i}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                  <button
                                    onClick={() => setIsEditingProfile(false)}
                                    className="flex-1 text-center text-xs py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleProfileSave}
                                    className="flex-1 text-center text-xs py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow cursor-pointer"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center space-y-3 pb-4 border-b border-slate-100">
                                <div className="relative inline-block">
                                  <img
                                    src={profile.avatar}
                                    alt="Citizen Avatar"
                                    className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-indigo-400 shadow"
                                  />
                                  <span className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full text-[9px] font-bold p-1 border-2 border-white flex items-center gap-0.5">
                                    <Coins className="h-2.5 w-2.5" />
                                  </span>
                                </div>
                                <div>
                                  <h3 className="text-sm font-bold text-slate-800">
                                    {profile.name}
                                  </h3>
                                  <p className="text-[10px] text-indigo-700 font-bold font-mono tracking-wider uppercase mt-1 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 inline-block">
                                    {profile.rankName}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-center pt-2">
                                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2">
                                    <span className="text-[9px] text-slate-400 block font-mono font-bold">
                                      REPORTS
                                    </span>
                                    <span className="text-sm font-black text-slate-800">
                                      {profile.reportsCount}
                                    </span>
                                  </div>
                                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2">
                                    <span className="text-[9px] text-slate-400 block font-mono font-bold">
                                      VERIFIED
                                    </span>
                                    <span className="text-sm font-black text-slate-800">
                                      {profile.verificationsCount}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setEditName(profile.name);
                                    setEditAvatar(profile.avatar);
                                    setIsEditingProfile(true);
                                  }}
                                  className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-bold border border-indigo-200 hover:bg-indigo-50/50 py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 w-full transition-all cursor-pointer"
                                >
                                  <Edit2 className="h-3 w-3" />
                                  Edit Profile
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Badges showcase */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            Earned Digital Badges ({profile?.badges.length || 0}
                            )
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {profile?.badges.map((badge) => (
                              <div
                                key={badge.id}
                                className={`p-3.5 rounded-2xl border text-center space-y-1.5 ${badge.color}`}
                              >
                                <span className="text-xs font-black block leading-tight">
                                  {badge.name}
                                </span>
                                <p className="text-[9px] leading-relaxed opacity-90">
                                  {badge.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Middle Column: Point-Based Leaderboard - 4/12 */}
                      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col items-center h-fit shadow-md relative overflow-hidden">
                        {/* Decorative Competitive Background Background */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50/80 to-transparent pointer-events-none" />

                        <div className="text-center z-10 w-full space-y-1 mb-6">
                          <h3 className="text-lg font-black text-slate-800 flex justify-center items-center gap-2 font-display">
                            <Award className="h-5 w-5 text-indigo-600" />
                            Village Leaderboard
                          </h3>
                          <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
                            Nizamabad Zip League
                          </p>
                        </div>

                        {/* Top 3 Podium (Visible if >= 3 users) */}
                        {leaderboard.length >= 3 && (
                          <div className="flex items-end justify-center gap-2 mb-6 h-36 w-full z-10 mt-2 px-2">
                            {/* Rank 2 */}
                            <div className="flex flex-col items-center w-1/3">
                              <div
                                className={`w-11 h-11 rounded-full border-[3px] border-slate-200 flex items-center justify-center font-bold text-xs shadow-sm mb-2 relative ${getAvatarColor(leaderboard[1].name)}`}
                              >
                                {getInitials(leaderboard[1].name)}
                                <span className="absolute -bottom-2.5 bg-slate-200 text-slate-700 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white">
                                  2
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-800 line-clamp-1">
                                {leaderboard[1].name.split(" ")[0]}
                              </span>
                              <span className="text-[10px] font-black font-mono text-indigo-600">
                                {leaderboard[1].coins}
                              </span>
                              <div className="w-full bg-slate-50 h-16 rounded-t-xl border-t border-x border-slate-200 mt-2 shadow-inner" />
                            </div>
                            {/* Rank 1 */}
                            <div className="flex flex-col items-center w-1/3 z-10">
                              <div
                                className={`w-14 h-14 rounded-full border-[3px] border-amber-400 flex items-center justify-center font-bold text-sm shadow-md mb-2 relative ${getAvatarColor(leaderboard[0].name)}`}
                              >
                                {getInitials(leaderboard[0].name)}
                                <span className="absolute -bottom-2.5 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-white">
                                  1
                                </span>
                              </div>
                              <span className="text-[11px] font-black text-slate-900 line-clamp-1">
                                {leaderboard[0].name.split(" ")[0]}
                              </span>
                              <span className="text-[11px] font-black font-mono text-indigo-600">
                                {leaderboard[0].coins}
                              </span>
                              <div className="w-full bg-indigo-50/80 h-24 rounded-t-xl border-t border-x border-indigo-200 mt-2 shadow-inner" />
                            </div>
                            {/* Rank 3 */}
                            <div className="flex flex-col items-center w-1/3">
                              <div
                                className={`w-11 h-11 rounded-full border-[3px] border-orange-200 flex items-center justify-center font-bold text-xs shadow-sm mb-2 relative ${getAvatarColor(leaderboard[2].name)}`}
                              >
                                {getInitials(leaderboard[2].name)}
                                <span className="absolute -bottom-2.5 bg-orange-200 text-orange-900 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white">
                                  3
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-800 line-clamp-1">
                                {leaderboard[2].name.split(" ")[0]}
                              </span>
                              <span className="text-[10px] font-black font-mono text-indigo-600">
                                {leaderboard[2].coins}
                              </span>
                              <div className="w-full bg-slate-50 h-12 rounded-t-xl border-t border-x border-slate-200 mt-2 shadow-inner" />
                            </div>
                          </div>
                        )}

                        <div className="w-full space-y-2 z-10">
                          {(leaderboard.length >= 3
                            ? leaderboard.slice(3)
                            : leaderboard
                          ).map((user, localIdx) => {
                            const isMe = user.isCurrentUser;
                            const rank =
                              leaderboard.length >= 3
                                ? localIdx + 4
                                : localIdx + 1;

                            return (
                              <div
                                key={rank}
                                className={`p-3 rounded-2xl flex items-center justify-between transition-all group cursor-default ${
                                  isMe
                                    ? "bg-indigo-600 border-indigo-600 shadow-md text-white scale-[1.02]"
                                    : "bg-slate-50/80 border border-slate-100 hover:bg-slate-100 hover:border-slate-200"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-6 text-center shrink-0 font-mono font-bold text-xs ${isMe ? "text-indigo-200" : "text-slate-400"}`}
                                  >
                                    {rank}
                                  </div>

                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 select-none shadow-xs ${isMe ? "bg-white/20 text-white" : getAvatarColor(user.name)}`}
                                  >
                                    {getInitials(user.name)}
                                  </div>

                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`text-xs font-bold line-clamp-1 ${isMe ? "text-white" : "text-slate-800"}`}
                                      >
                                        {user.name}
                                      </span>
                                      {isMe && (
                                        <span className="bg-white/20 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                          You
                                        </span>
                                      )}
                                    </div>
                                    <p
                                      className={`text-[9px] font-mono ${isMe ? "text-indigo-200" : "text-slate-400"}`}
                                    >
                                      {user.rankName}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span
                                    className={`text-sm font-black flex items-center justify-end gap-1 ${isMe ? "text-white" : "text-slate-800"}`}
                                  >
                                    {user.coins}
                                  </span>
                                  <span
                                    className={`text-[8px] font-mono uppercase tracking-wider ${isMe ? "text-indigo-200" : "text-slate-400"}`}
                                  >
                                    PTS
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Column: rewards store - 4/12 */}
                      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 space-y-4 h-fit shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                          <ShoppingBag className="h-4 w-4 text-indigo-600" />
                          Panchayat Coin Store
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Spend your earned <b>Civic Coins</b> on real local
                          benefits. Higher participation equals higher rewards!
                        </p>

                        <div className="space-y-3.5 pt-2">
                          {REDEEMABLES.map((item, i) => {
                            const canAfford =
                              profile && profile.coins >= item.cost;

                            return (
                              <div
                                key={i}
                                className="border border-slate-150 p-4 rounded-2xl flex flex-col justify-between hover:bg-slate-50/50 hover:border-slate-200 transition-all hover:shadow-xs space-y-3"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-start">
                                    <h4 className="text-xs font-bold text-slate-800 pr-2 leading-tight">
                                      {item.name}
                                    </h4>
                                    <span className="bg-amber-100 text-amber-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-0.5 shrink-0">
                                      <Coins className="h-2.5 w-2.5" />
                                      {item.cost}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 leading-relaxed">
                                    {item.desc}
                                  </p>
                                </div>
                                <button
                                  disabled={!canAfford}
                                  onClick={() => {
                                    setConfirmModal({
                                      isOpen: true,
                                      title: "Redeem Reward Perk?",
                                      message: `Are you sure you want to spend ${item.cost} Civic Coins to claim "${item.name}"? Your redemption code will be dispatched to your registered email.`,
                                      type: "success",
                                      onConfirm: () => {
                                        showToast(
                                          `Successfully Redeemed ${item.name}! 🎁`,
                                          "success",
                                          "Your redemption code is dispatched to your email.",
                                        );
                                        setProfile((prev) =>
                                          prev
                                            ? {
                                                ...prev,
                                                coins: prev.coins - item.cost,
                                              }
                                            : null,
                                        );
                                        fetchLeaderboard();
                                        setConfirmModal((prev) => ({
                                          ...prev,
                                          isOpen: false,
                                        }));
                                      },
                                    });
                                  }}
                                  className={`w-full text-center text-[10px] font-bold py-2 px-3 rounded-lg border transition-all cursor-pointer ${
                                    canAfford
                                      ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 hover:shadow"
                                      : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                  }`}
                                >
                                  Redeem Perk
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. SOCIAL HUB WORKSPACE */}
                {activeTab === "social" && (
                  <SocialHub
                    currentUser={profile}
                    currentWard={selectedWard || "Ward 1 (Panchayat Center)"}
                  />
                )}

                {/* 7. CITIZEN PROFILE CRUD WORKSPACE */}
                {activeTab === "profile" && (
                  <MyProfileActivity
                    profile={profile}
                    issues={issues}
                    myReportedIds={myReportedIds}
                    onUpdateIssue={handleUpdateIssueDirect}
                    onDeleteIssue={handleDeleteIssueDirect}
                    onUpdateProfile={handleUpdateProfileDirect}
                    onBackToFeed={() => setActiveTab("feed")}
                    onOpenReportForm={() => setShowReportForm(true)}
                  />
                )}

                {/* 4. MAIN FEED WORKSPACE */}
                {activeTab === "feed" && (
                  <div className="space-y-6 min-h-[500px]">
                    {/* Search / filter control toolbar */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-4 flex flex-wrap gap-3 items-center justify-between shadow-sm">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Category Filter dropdown */}
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="text-xs border border-slate-200 p-2.5 rounded-xl bg-white focus:outline-none font-medium text-slate-700"
                        >
                          <option value="All">{t("All Categories")}</option>
                          {Object.values(IssueCategory).map((cat) => (
                            <option key={cat} value={cat}>
                              {t(cat)}
                            </option>
                          ))}
                        </select>

                        {/* Status Filter dropdown */}
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="text-xs border border-slate-200 p-2.5 rounded-xl bg-white focus:outline-none font-medium text-slate-700"
                        >
                          <option value="All">{t("All Statuses")}</option>
                          {Object.values(IssueStatus).map((st) => (
                            <option key={st} value={st}>
                              {t(st)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedWard && (
                        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          {t(selectedWard)}
                          <button
                            onClick={() => setSelectedWard(null)}
                            className="font-bold cursor-pointer ml-1 text-slate-400 hover:text-slate-900"
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>

                    {/* Complaints Feed Cards - Gorgeous Full Width Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredIssues.length > 0 ? (
                        filteredIssues.map((issue) => {
                          const isSelected = viewingIssue?.id === issue.id;

                          return (
                            <motion.div
                              key={issue.id}
                              id={`issue-feed-card-${issue.id}`}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              onClick={() => setViewingIssue(issue)}
                              className={`bg-white border rounded-3xl p-5 cursor-pointer transition-all hover:shadow-md ${
                                isSelected
                                  ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="space-y-3.5">
                                {/* Top Row: category and status badges */}
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                                      {t(issue.category)}
                                    </span>
                                    <span
                                      className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                                        issue.urgency === "Critical"
                                          ? "bg-rose-100 text-rose-800 border-rose-200"
                                          : issue.urgency === "High"
                                            ? "bg-amber-100 text-amber-800 border-amber-200"
                                            : "bg-indigo-50 text-indigo-800 border-indigo-200"
                                      }`}
                                    >
                                      {t(issue.urgency)} {t("Priority")}
                                    </span>
                                    <StatusBadge status={issue.status} />
                                  </div>
                                  <span className="text-[9px] font-mono text-slate-400">
                                    {new Date(
                                      issue.createdAt,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>

                                {/* Body: title and description */}
                                <div className="flex gap-4">
                                  <div className="flex-grow space-y-1">
                                    <h3 className="text-xs font-bold text-slate-800 line-clamp-1">
                                      {t(issue.title)}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                      {t(issue.description)}
                                    </p>
                                  </div>
                                  {issue.image && (
                                    <img
                                      src={issue.image}
                                      alt={issue.title}
                                      referrerPolicy="no-referrer"
                                      className="w-16 h-12 object-cover rounded-xl border border-slate-100 shrink-0"
                                    />
                                  )}
                                </div>

                                {/* Bottom Row: social engagement upvote / verify */}
                                <div className="flex justify-between items-center border-t border-slate-50/80 pt-3 text-[10px] text-slate-500 font-mono">
                                  <span>{t(issue.location.ward)}</span>
                                  <div
                                    className="flex items-center gap-3"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => handleUpvote(issue.id)}
                                      className={`flex items-center gap-1.5 py-1 px-3 rounded-xl border transition-colors cursor-pointer ${
                                        issue.userUpvoted
                                          ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold"
                                          : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      <ThumbsUp
                                        className={`h-3 w-3 ${issue.userUpvoted ? "fill-indigo-500 text-indigo-600" : ""}`}
                                      />
                                      <span>
                                        {issue.upvotes} {t("Upvotes")}
                                      </span>
                                    </button>

                                    <button
                                      onClick={() => handleVerify(issue.id)}
                                      className={`flex items-center gap-1.5 py-1 px-3 rounded-xl border transition-colors cursor-pointer ${
                                        issue.userVerified
                                          ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
                                          : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      <CheckCircle
                                        className={`h-3 w-3 ${issue.userVerified ? "fill-emerald-500 text-emerald-600" : ""}`}
                                      />
                                      <span>
                                        {issue.verifiedByCount} {t("Verified")}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white border border-slate-100 rounded-3xl min-h-[300px] text-slate-400 text-center">
                          <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
                          <p className="text-xs">
                            {t(
                              "No community concerns match selected filter combinations.",
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <AnimatePresence>
        {viewingIssue && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-100 rounded-3xl overflow-hidden max-w-2xl w-full relative shadow-2xl text-left flex flex-col max-h-[90vh]"
            >
              {/* Header banner image / fallback graphic */}
              <div className="relative h-40 sm:h-60 bg-gradient-to-r from-slate-100 to-indigo-50/30 flex items-center justify-center overflow-hidden shrink-0">
                {viewingIssue.image ? (
                  <img
                    src={viewingIssue.image}
                    alt={viewingIssue.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <Landmark className="h-16 w-16 mb-2 text-indigo-500/20" />
                    <span className="text-[10px] uppercase tracking-widest font-mono text-slate-450 font-bold">
                      Nizamabad Civic Portal
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <button
                  onClick={() => setViewingIssue(null)}
                  className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/75 transition-colors p-2 rounded-full cursor-pointer z-10"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-4 left-5 right-5 text-white">
                  <div className="flex gap-2 mb-2 items-center flex-wrap">
                    <span className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider font-mono px-2.5 py-0.5 rounded shadow-sm">
                      {t(viewingIssue.category)}
                    </span>
                    <span
                      className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded shadow-sm ${
                        viewingIssue.urgency === "Critical"
                          ? "bg-rose-600 text-white"
                          : viewingIssue.urgency === "High"
                            ? "bg-amber-500 text-slate-900 font-black"
                            : "bg-indigo-500 text-white"
                      }`}
                    >
                      {t(viewingIssue.urgency)} {t("Priority")}
                    </span>
                    <StatusBadge status={viewingIssue.status} />
                  </div>
                  <h3 className="text-lg md:text-xl font-black font-display leading-tight text-white drop-shadow-sm">
                    {t(viewingIssue.title)}
                  </h3>
                </div>
              </div>

              {/* Scrollable details */}
              <div className="p-6 md:p-8 space-y-5 overflow-y-auto">
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 border-b border-slate-100 pb-3 font-mono">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold">
                      {t("Reported On")}:{" "}
                      {new Date(viewingIssue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-slate-200">|</span>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold">
                      {t("Reported By")}:{" "}
                      {viewingIssue.isAnonymous
                        ? t("🕵️ Anonymous Citizen")
                        : viewingIssue.reporter?.name || t("Citizen")}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs space-y-3">
                    <p className="text-slate-700 leading-relaxed font-sans text-xs">
                      <b className="text-slate-950 font-bold block mb-1 text-[11px] uppercase tracking-wider font-mono text-slate-500">
                        {t("Description Detail")}:
                      </b>
                      {t(viewingIssue.description)}
                    </p>
                    <div className="border-t border-slate-200/40 pt-2 grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="text-slate-400 block uppercase">
                          {t("WARD AREA")}:
                        </span>
                        <span className="font-bold text-slate-700">
                          {t(viewingIssue.location.ward)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase">
                          {t("ASSIGNED WING")}:
                        </span>
                        <span className="font-bold text-slate-700">
                          {t(
                            viewingIssue.assignedDept || "Panchayat Core Team",
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Citizen Interactive Actions Panel */}
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      {t("Citizen Actions")}:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpvote(viewingIssue.id)}
                        className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl border text-[11px] font-mono transition-colors cursor-pointer ${
                          viewingIssue.userUpvoted
                            ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        <ThumbsUp
                          className={`h-3.5 w-3.5 ${viewingIssue.userUpvoted ? "fill-indigo-500 text-indigo-600" : ""}`}
                        />
                        <span>
                          {viewingIssue.upvotes} {t("Upvotes")}
                        </span>
                      </button>

                      <button
                        onClick={() => handleVerify(viewingIssue.id)}
                        className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl border text-[11px] font-mono transition-colors cursor-pointer ${
                          viewingIssue.userVerified
                            ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        <CheckCircle
                          className={`h-3.5 w-3.5 ${viewingIssue.userVerified ? "fill-emerald-500 text-emerald-600" : ""}`}
                        />
                        <span>
                          {viewingIssue.verifiedByCount} {t("Verified")}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Video Attachment Segment */}
                  {viewingIssue.video && (
                    <div className="relative border border-slate-100 rounded-2xl overflow-hidden shadow-inner bg-slate-950">
                      <video
                        src={viewingIssue.video}
                        controls
                        className="w-full h-44 object-contain"
                      />
                      <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[9px] py-0.5 px-2 rounded-md font-mono flex items-center gap-1">
                        🎥 {t("Live Video Proof")}
                      </div>
                    </div>
                  )}

                  {/* Before & After Proof Comparative Visualizer */}
                  {(viewingIssue.beforeImage ||
                    viewingIssue.image ||
                    viewingIssue.afterImage ||
                    viewingIssue.resolutionImage) && (
                    <div className="border border-slate-150 rounded-2xl p-4 space-y-3 bg-slate-50/50">
                      <span className="text-slate-800 font-black block font-mono text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                        {t("Before & After Work Verification Evidence")}
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">
                            {t("Before Repair")}
                          </span>
                          <div className="rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-100">
                            <img
                              referrerPolicy="no-referrer"
                              src={
                                viewingIssue.beforeImage ||
                                viewingIssue.image ||
                                "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80"
                              }
                              alt="Before"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">
                            {t("After Repair")}
                          </span>
                          <div className="rounded-lg overflow-hidden border border-slate-200 h-24 bg-slate-100">
                            <img
                              referrerPolicy="no-referrer"
                              src={
                                viewingIssue.afterImage ||
                                viewingIssue.resolutionImage ||
                                "https://images.unsplash.com/photo-1547989453-11e67ffb3885?auto=format&fit=crop&w=800&q=80"
                              }
                              alt="After"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Official administrative resolution / remarks */}
                  {viewingIssue.officialRemarks && (
                    <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl text-xs space-y-2">
                      <span className="text-emerald-900 font-bold block font-mono text-[10px] uppercase tracking-wider">
                        {t("Sarpanch / official remarks")}:
                      </span>
                      <p className="text-emerald-800 leading-relaxed italic">
                        "{t(viewingIssue.officialRemarks)}"
                      </p>

                      {viewingIssue.resolutionImage && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-emerald-200 shadow-sm max-w-md mx-auto">
                          <img
                            referrerPolicy="no-referrer"
                            src={viewingIssue.resolutionImage}
                            alt="Resolution"
                            className="w-full h-32 object-cover"
                          />
                          <div className="bg-emerald-100 text-emerald-800 text-[9px] py-1 text-center font-bold font-mono">
                            {t("Official Resolution Evidence Photo")}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Citizen satisfaction feedback rating form */}
                  {(viewingIssue.status === "Resolved" ||
                    viewingIssue.status === "Work Completed") && (
                    <div className="bg-indigo-50/40 border border-indigo-100/60 p-4 rounded-2xl text-xs space-y-3">
                      <span className="text-indigo-950 font-black block font-mono text-[10px] uppercase tracking-wider">
                        ⭐ {t("Rate Resolution Quality & Feedback")}
                      </span>

                      {viewingIssue.satisfactionRating ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < (viewingIssue.satisfactionRating || 5)
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-300"
                                }`}
                              />
                            ))}
                            <span className="text-[10px] font-black text-slate-700 ml-1">
                              ({viewingIssue.satisfactionRating}/5)
                            </span>
                          </div>
                          {viewingIssue.satisfactionFeedback && (
                            <p className="text-slate-650 leading-relaxed italic bg-white p-2.5 rounded-xl border border-slate-100">
                              "{viewingIssue.satisfactionFeedback}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-[10px] text-slate-500">
                            {t(
                              "Please rate the resolved work quality to help the Panchayat improve transparency and auditing metrics.",
                            )}
                          </p>

                          <div className="flex flex-wrap gap-4 items-center">
                            {/* Stars rating selection */}
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((starVal) => (
                                <button
                                  type="button"
                                  key={starVal}
                                  onClick={() => setSelectedRating(starVal)}
                                  className="text-slate-300 hover:text-amber-400 cursor-pointer"
                                >
                                  <Star
                                    className={`h-5 w-5 ${
                                      starVal <= selectedRating
                                        ? "text-amber-400 fill-amber-400"
                                        : "text-slate-200"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>

                            <input
                              type="text"
                              value={ratingComment}
                              onChange={(e) => setRatingComment(e.target.value)}
                              placeholder={t(
                                "Leave an optional resolution comment...",
                              )}
                              className="flex-grow bg-white border border-slate-200 text-xs p-2 rounded-xl focus:outline-none min-w-[150px]"
                            />

                            <button
                              type="button"
                              onClick={async () => {
                                if (selectedRating === 0) {
                                  showToast(
                                    "Please choose a star rating!",
                                    "warning",
                                  );
                                  return;
                                }
                                const ok = await handleUpdateIssueDirect(
                                  viewingIssue.id,
                                  {
                                    satisfactionRating: selectedRating,
                                    satisfactionFeedback:
                                      ratingComment ||
                                      "Satisfied with complaint resolution.",
                                  },
                                );
                                if (ok) {
                                  showToast(
                                    "Feedback Received! Thank you. 💖",
                                    "success",
                                    "Your feedback was synced instantly to Panchayat audit logs.",
                                  );
                                  setViewingIssue((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          satisfactionRating: selectedRating,
                                          satisfactionFeedback:
                                            ratingComment ||
                                            "Satisfied with complaint resolution.",
                                        }
                                      : null,
                                  );
                                }
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] px-3.5 py-2 rounded-xl cursor-pointer"
                            >
                              {t("Submit")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vertical Progress Activity Timeline */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      {t("Complaint Activity Log")}
                    </h4>
                    <div className="relative border-l border-slate-200 pl-4 ml-2.5 space-y-4">
                      {viewingIssue.timeline.map((event, idx) => (
                        <div key={idx} className="relative">
                          {/* Inner circle pin */}
                          <span className="absolute -left-[21px] top-0.5 bg-white border border-slate-300 rounded-full w-2.5 h-2.5 flex items-center justify-center ring-4 ring-white" />

                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="font-bold text-slate-800">
                                {t(event.title)}
                              </span>
                              <span className="text-slate-400">
                                {new Date(event.timestamp).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-550 leading-normal">
                              {t(event.description)}
                            </p>
                            {event.actor && (
                              <span className="text-[9px] text-slate-400 font-mono italic block">
                                {t("Actor")}: {t(event.actor)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button Footer */}
              <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setViewingIssue(null)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-5 rounded-xl cursor-pointer transition-all"
                >
                  {t("Close Details")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
