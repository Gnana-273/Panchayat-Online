/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import PanchayatNews from "./PanchayatNews";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Smartphone,
  Cpu,
  MapPin,
  CheckSquare,
  Play,
  ArrowRight,
  Camera,
  Megaphone,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Users,
  ShieldCheck,
  FileText,
  Clock,
  User,
  X,
  ChevronLeft,
  Mail,
  Lock,
  Phone,
  RefreshCw,
  Video,
  Eye,
  EyeOff,
} from "lucide-react";

interface SplashScreenProps {
  onEnter: (role: "citizen" | "admin") => void;
}

export default function SplashScreen({ onEnter }: SplashScreenProps) {
  const { showToast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Statistics State
  const [liveStats, setLiveStats] = useState<any[]>([
    { category: "Roads", Resolved: 12, Pending: 4 },
    { category: "Water", Resolved: 18, Pending: 3 },
    { category: "Power", Resolved: 15, Pending: 2 },
    { category: "Garbage", Resolved: 22, Pending: 5 },
    { category: "Infrastructure", Resolved: 8, Pending: 2 },
  ]);
  const [statsSummary, setStatsSummary] = useState({
    total: 71,
    resolved: 55,
    pending: 16,
    rate: 77.5,
  });

  useEffect(() => {
    fetch("/api/issues")
      .then((res) => {
        if (!res.ok) throw new Error("API issues failed to load");
        return res.json();
      })
      .then((data: any[]) => {
        if (data && Array.isArray(data) && data.length > 0) {
          const categoriesMap: { [key: string]: string } = {
            "Roads & Potholes": "Roads",
            "Water & Sanitation": "Water",
            "Streetlights & Power": "Power",
            "Waste & Garbage": "Garbage",
            "Public Infrastructure": "Infrastructure",
          };

          const mapped = Object.keys(categoriesMap).map((fullCat) => {
            const catIssues = data.filter((i) => i.category === fullCat);
            const resolved = catIssues.filter(
              (i) => i.status === "Resolved" || i.status === "Closed",
            ).length;
            const pending = catIssues.length - resolved;
            return {
              category: categoriesMap[fullCat],
              Resolved: resolved,
              Pending: pending,
              total: catIssues.length,
            };
          });

          // Filter out categories with zero total items so chart is tight, but if all empty, use defaults
          const nonZeroMapped = mapped.filter((item) => item.total > 0);
          if (nonZeroMapped.length > 0) {
            setLiveStats(nonZeroMapped);
          } else {
            // Include default items if database has issues but they don't match categories
            setLiveStats([
              {
                category: "Roads",
                Resolved: data.filter((i) => i.status === "Resolved").length,
                Pending: data.filter((i) => i.status !== "Resolved").length,
              },
            ]);
          }

          const total = data.length;
          const resolved = data.filter(
            (i) => i.status === "Resolved" || i.status === "Closed",
          ).length;
          const pending = total - resolved;
          const rate =
            total > 0 ? parseFloat(((resolved / total) * 100).toFixed(1)) : 0;
          setStatsSummary({ total, resolved, pending, rate });
        }
      })
      .catch((err) => {
        // Silently use defaults if fetch fails (e.g. server starting)
      });
  }, []);

  const [selectedRole, setSelectedRole] = useState<"citizen" | "admin" | null>(
    null,
  );
  const [loginMethod, setLoginMethod] = useState<"email" | "mobile" | null>(
    null,
  );

  // Form input states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Validation / Error states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleCloseModal = () => {
    setShowRoleModal(false);
    setSelectedRole(null);
    setLoginMethod(null);
    setLoginEmail("");
    setLoginPassword("");
    setLoginPhone("");
    setLoginOtp("");
    setOtpSent(false);
    setEmailError("");
    setPasswordError("");
    setPhoneError("");
    setOtpError("");
    setIsLoggingIn(false);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (selectedRole === "citizen") {
      setLoginEmail("citizen@nizamabad.in");
      setLoginPassword("password123");
    } else {
      setLoginEmail("officer@nizamabad.gov.in");
      setLoginPassword("officer123");
    }
    setEmailError("");
    setPasswordError("");
    showToast(
      "Demo Credentials Loaded! 🔑",
      "info",
      "We have automatically filled your sign-in details for testing.",
    );
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;

    // Email regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!loginEmail.trim()) {
      setEmailError("Email address is required.");
      valid = false;
    } else if (!emailRegex.test(loginEmail)) {
      setEmailError(
        "Please enter a valid email address (e.g. name@domain.com).",
      );
      valid = false;
    } else {
      setEmailError("");
    }

    // Password check
    if (!loginPassword) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (loginPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      valid = false;
    } else {
      setPasswordError("");
    }

    if (valid && selectedRole) {
      if (
        selectedRole === "admin" &&
        loginEmail !== "vishwarojugnanashashank@gmail.com"
      ) {
        setEmailError("Unauthorized email for Admin portal.");
        setIsLoggingIn(false);
        return;
      }
      setIsLoggingIn(true);
      setTimeout(() => {
        setIsLoggingIn(false);
        const savedRole = selectedRole;
        handleCloseModal();
        if (savedRole === "citizen") {
          showToast(
            "Welcome back, Citizen! 🌾",
            "success",
            "Accessing Nizamabad Gram Panchayat secure portal.",
          );
        } else {
          showToast(
            "Authorized Panchayat Administrator 🏛️",
            "success",
            "Administrative controls and system diagnostics loaded.",
          );
        }
        onEnter(savedRole);
      }, 1000);
    }
  };

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneRegex = /^[0-9]{10}$/;
    const digitsOnly = loginPhone.replace(/[^0-9]/g, "");

    if (!loginPhone.trim()) {
      setPhoneError("Mobile number is required.");
    } else if (!phoneRegex.test(digitsOnly)) {
      setPhoneError("Please enter a valid 10-digit mobile number.");
    } else {
      setPhoneError("");
      setIsLoggingIn(true);
      setTimeout(() => {
        setIsLoggingIn(false);
        setOtpSent(true);
        setOtpError("");
      }, 800);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOtp.trim()) {
      setOtpError("OTP code is required.");
    } else if (loginOtp.length !== 4 && loginOtp.length !== 6) {
      setOtpError("Please enter a valid 4 or 6-digit OTP code.");
    } else {
      setOtpError("");
      setIsLoggingIn(true);
      setTimeout(() => {
        setIsLoggingIn(false);
        const savedRole = selectedRole;
        handleCloseModal();
        if (savedRole === "citizen") {
          showToast(
            "Welcome back, Citizen! 🌾",
            "success",
            "Accessing Nizamabad Gram Panchayat secure portal.",
          );
        } else {
          showToast(
            "Authorized Panchayat Administrator 🏛️",
            "success",
            "Administrative controls and system diagnostics loaded.",
          );
        }
        if (savedRole) onEnter(savedRole);
      }, 1000);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const savedRole = selectedRole || "citizen";

      if (
        savedRole === "admin" &&
        user.email !== "vishwarojugnanashashank@gmail.com"
      ) {
        showToast(
          "Unauthorized",
          "error",
          "This Google account is not authorized for Admin access.",
        );
        setIsLoggingIn(false);
        return;
      }

      handleCloseModal();
      if (savedRole === "citizen") {
        showToast(
          `Welcome back, ${user.displayName || "Citizen"}! 🌾`,
          "success",
          "Accessing Nizamabad Gram Panchayat secure portal.",
        );
      } else if (savedRole === "admin") {
        showToast(
          "Authorized Panchayat Administrator 🏛️",
          "success",
          "Administrative controls and system diagnostics loaded.",
        );
      }
      onEnter(savedRole);
    } catch (err) {
      console.error("Google Auth failed:", err);
      showToast(
        "Authentication Failed",
        "warning",
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 3000);
      setEmail("");
    }
  };

  return (
    <div
      id="splash-container"
      className="min-h-screen bg-white text-[#0f172a] font-sans relative overflow-x-hidden"
    >
      {/* 1. Header Navigation */}
      <header className="border-b border-slate-100 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center p-0.5 shadow-sm overflow-hidden">
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
              <span className="text-xl font-black tracking-tight text-[#0a2540] flex items-center gap-1 font-display">
                {t("Panchayat")}{" "}
                <span className="text-emerald-600 font-bold">Online</span>
              </span>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-[#334155]">
            <a
              href="#home"
              className="text-emerald-600 border-b-2 border-emerald-600 pb-1 font-bold"
            >
              {t("Home")}
            </a>
            <a
              href="#services"
              className="hover:text-emerald-600 transition-colors"
            >
              {t("Services")}
            </a>
            <a
              href="#how-it-works"
              className="hover:text-emerald-600 transition-colors"
            >
              {t("How It Works")}
            </a>
          </nav>

          {/* Language Selection and Login/Register CTAs */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-xl p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("te")}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  language === "te"
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                తెలుగు
              </button>
              <button
                type="button"
                onClick={() => setLanguage("hi")}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  language === "hi"
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200/50"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                हिन्दी
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowRoleModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-2.5 px-4 sm:px-5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              <User className="h-4 w-4" />
              <span>{t("Login / Register")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section
        id="home"
        className="relative pt-8 pb-16 bg-[#f8fafc] overflow-hidden"
      >
        {/* Curved white divider at the bottom of the hero background */}
        <div
          className="absolute bottom-0 left-0 right-0 h-20 bg-white"
          style={{ clipPath: "ellipse(60% 100% at 50% 100%)" }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Hero Left Content */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-[#0a2540] font-display leading-tight">
              {t("Your Issue,")} <br />
              <span className="text-emerald-600">
                {t("Our Responsibility")}
              </span>
            </h1>
            <p className="text-slate-600 text-base md:text-lg max-w-lg leading-relaxed">
              {t(
                "Report local problems, track updates and help build a better community together.",
              )}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowRoleModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 px-6 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-900/10 hover:translate-x-0.5"
              >
                {t("Get Started")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Hero Right Illustration */}
          <div className="lg:col-span-7 flex justify-center relative">
            <div className="relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-200 aspect-[16/10]">
              <img
                src="/src/assets/images/regenerated_image_1782739627902.png"
                alt="Indian Village Gram Panchayat Digitalization"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Artistic Overlay representing Gram Panchayat digital connection */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#022c22]/50 via-transparent to-transparent flex flex-col justify-end p-6 text-left">
                <span className="bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest font-mono px-2.5 py-1 rounded-full w-fit mb-2">
                  {t("Gram Panchayat Online Services")}
                </span>
                <p className="text-white text-sm font-semibold opacity-95">
                  {t(
                    "empowering village self-governance via Digital India Initiative.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Overlaid Floating Card (Report your issues here) */}
      <section className="relative z-20 -mt-10 px-4">
        <div className="max-w-4xl mx-auto bg-white border border-slate-100 shadow-xl rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-5 hover:shadow-2xl transition-all">
          <div className="flex items-center gap-4 text-left w-full md:w-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm text-emerald-600">
              <Camera className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0a2540]">
                {t("Report your issues here")}
              </h3>
              <p className="text-slate-500 text-xs mt-0.5 max-w-md">
                {t(
                  "Capture an image or video of the issue and help us solve it faster.",
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowRoleModal(true)}
            className="w-full md:w-auto bg-gradient-panchayat hover:glow-primary text-white font-bold text-sm py-3 px-8 rounded-full flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:scale-[1.02]"
          >
            {t("Get Started")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* 4. How Panchayat Online Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-black text-[#0a2540] font-display uppercase tracking-tight">
              {t("How Panchayat Online Works")}
            </h2>
            <div className="w-24 h-1 bg-emerald-500 mx-auto rounded-full" />
          </div>

          {/* Dotted Connection Grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-4 group">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-105 transition-transform">
                <Smartphone className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-[#0a2540] tracking-wider uppercase font-mono">
                  {t("1. Report")}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed px-4">
                  {t(
                    "Capture and report issues in your area with photos or videos.",
                  )}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-4 group relative">
              <div className="w-16 h-16 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shadow-sm group-hover:scale-105 transition-transform">
                <Cpu className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-[#0a2540] tracking-wider uppercase font-mono">
                  {t("2. AI Categorization")}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed px-4">
                  {t("Our AI automatically categorizes and assigns the issue.")}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-4 group">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-105 transition-transform">
                <MapPin className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-[#0a2540] tracking-wider uppercase font-mono">
                  {t("3. Track")}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed px-4">
                  {t("Track the status of your reported issue in real time.")}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center space-y-4 group">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-105 transition-transform">
                <CheckSquare className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-[#0a2540] tracking-wider uppercase font-mono">
                  {t("4. Resolved")}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed px-4">
                  {t(
                    "Get updates and notifications when the issue is resolved.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5b. Panchayat News notice board section */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PanchayatNews />
        </div>
      </section>

      {/* 6. Footer (Stay Updated & Subscriptions) */}
      <footer className="bg-[#051c42] text-white py-12 relative overflow-hidden">
        {/* Subtle Wave Accent Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8 border-b border-blue-950/60 pb-10">
            {/* Stay Updated Left */}
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-full bg-blue-900/60 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{t("Stay Updated")}</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  {t("Subscribe to get updates and important announcements.")}
                </p>
              </div>
            </div>

            {/* Subscribe Form Center */}
            <form
              onSubmit={handleSubscribe}
              className="w-full max-w-md flex gap-2"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("Enter your email")}
                className="flex-grow text-sm bg-white/10 text-white placeholder-slate-400 border border-white/15 rounded-lg px-4 py-2.5 focus:outline-none focus:border-emerald-500"
                required
              />
              <button
                type="submit"
                className="bg-[#097939] hover:bg-[#075f2c] text-white text-xs font-bold px-6 py-2.5 rounded-lg transition-all cursor-pointer whitespace-nowrap"
              >
                {isSubscribed ? t("Subscribed!") : t("Subscribe")}
              </button>
            </form>

            {/* Social Follow Right */}
            <div className="flex justify-center lg:justify-end items-center gap-3 w-full lg:w-auto">
              <span className="text-xs font-medium text-slate-300">
                This platform is created by V. Gnana Shashank, Click Here -&gt;
              </span>
              <a
                href="https://www.linkedin.com/in/gnana-shashank-vishwaroju-41486631a/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BWPF1BOaRQsSaXetVkqszGQ%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-all shadow-lg hover:shadow-blue-500/50 hover:-translate-y-1 shrink-0"
                title="LinkedIn Profile"
              >
                <Linkedin className="h-5 w-5 text-white" />
              </a>
            </div>
          </div>

          {/* Bottom copyright & Links */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <p className="font-mono text-[11px] text-center md:text-left">
              &copy; 2026 {t("Panchayat Online. All rights reserved.")}
            </p>
            <div className="flex gap-6 font-semibold">
              <a href="#privacy" className="hover:text-white transition-colors">
                {t("Privacy Policy")}
              </a>
              <span className="text-slate-700">|</span>
              <a href="#terms" className="hover:text-white transition-colors">
                {t("Terms of Service")}
              </a>
              <span className="text-slate-700">|</span>
              <a href="#help" className="hover:text-white transition-colors">
                {t("Help Center")}
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Role Selection Interactive Modal */}
      <AnimatePresence>
        {showRoleModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 max-w-md w-full relative shadow-2xl"
            >
              {/* Back Button */}
              {selectedRole !== null && (
                <button
                  onClick={() => {
                    setSelectedRole(null);
                    setLoginMethod(null);
                    setOtpSent(false);
                    setEmailError("");
                    setPasswordError("");
                    setPhoneError("");
                    setOtpError("");
                  }}
                  className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-full hover:bg-slate-50 cursor-pointer flex items-center gap-1 text-xs font-semibold"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("Back")}
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-full hover:bg-slate-50 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-4 pt-4">
                {selectedRole === null ? (
                  /* STEP 1: Select Role */
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto shadow-sm shadow-emerald-100">
                      <svg viewBox="0 0 100 100" className="w-6 h-6">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6"
                        />
                        <circle cx="50" cy="38" r="10" fill="currentColor" />
                        <path
                          d="M25 72 C 30 58, 70 58, 75 72 Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 font-display uppercase tracking-tight">
                        {t("Access Secure Portal")}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {t(
                          "Select your access role below to sign in or get started.",
                        )}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <button
                        onClick={() => {
                          setSelectedRole("citizen");
                          setLoginMethod("email");
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-emerald-950/10 flex items-center justify-center gap-2 group cursor-pointer"
                      >
                        {t("Enter as Citizen")}
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedRole("admin");
                          setLoginMethod("email");
                        }}
                        className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        {t("Enter as Panchayat Officer")}
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* STEP 2: Login Details */
                  <div className="space-y-4">
                    <div className="text-center">
                      <span className="text-[10px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-mono">
                        {selectedRole === "citizen"
                          ? t("Citizen Access")
                          : t("Officer Access")}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 font-display mt-2 uppercase tracking-tight">
                        {loginMethod === "email"
                          ? t("Sign In to Portal")
                          : t("OTP Verification")}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {loginMethod === "email"
                          ? t(
                              "Enter your email credentials to access your secure profile.",
                            )
                          : t(
                              "Authenticate instantly with a mobile verification code.",
                            )}
                      </p>
                    </div>

                    {loginMethod === "email" ? (
                      /* EMAIL AND PASSWORD FORM */
                      <form
                        onSubmit={handleEmailLogin}
                        className="space-y-3 pt-2"
                      >
                        {/* Email Input */}
                        <div className="space-y-1 text-left">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                            {t("Email Address")}
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <input
                              type="email"
                              value={loginEmail}
                              onChange={(e) => {
                                setLoginEmail(e.target.value);
                                if (emailError) setEmailError("");
                              }}
                              placeholder={
                                selectedRole === "citizen"
                                  ? "citizen@nizamabad.in"
                                  : "officer@nizamabad.gov.in"
                              }
                              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border text-xs font-semibold rounded-xl focus:outline-none focus:ring-1 focus:bg-white text-slate-800 transition-all ${
                                emailError
                                  ? "border-rose-500 focus:ring-rose-500"
                                  : "border-slate-200 focus:ring-emerald-500"
                              }`}
                            />
                          </div>
                          {emailError && (
                            <p className="text-[10px] text-rose-500 font-semibold font-mono mt-1">
                              {emailError}
                            </p>
                          )}
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1 text-left">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                              {t("Password")}
                            </label>
                            <button
                              type="button"
                              onClick={handleForgotPassword}
                              className="text-[10px] font-bold text-emerald-600 hover:underline bg-transparent border-none p-0 cursor-pointer"
                            >
                              {t("Forgot?")}
                            </button>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <input
                              type={showPassword ? "text" : "password"}
                              value={loginPassword}
                              onChange={(e) => {
                                setLoginPassword(e.target.value);
                                if (passwordError) setPasswordError("");
                              }}
                              placeholder="••••••••"
                              className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border text-xs font-semibold rounded-xl focus:outline-none focus:ring-1 focus:bg-white text-slate-800 transition-all ${
                                passwordError
                                  ? "border-rose-500 focus:ring-rose-500"
                                  : "border-slate-200 focus:ring-emerald-500"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              title={
                                showPassword ? "Hide password" : "Show password"
                              }
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {passwordError && (
                            <p className="text-[10px] text-rose-500 font-semibold font-mono mt-1">
                              {passwordError}
                            </p>
                          )}
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isLoggingIn}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-md shadow-emerald-950/10 flex items-center justify-center gap-2 cursor-pointer mt-2 h-11"
                        >
                          {isLoggingIn ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              {t("Verifying Access...")}
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-4 w-4" />
                              {t("Secure Sign In")}
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      /* MOBILE NUMBER AND OTP FORM */
                      <div className="pt-2">
                        {!otpSent ? (
                          <form
                            onSubmit={handleMobileSubmit}
                            className="space-y-3"
                          >
                            <div className="space-y-1 text-left">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                                {t("Mobile Number")}
                              </label>
                              <div className="relative">
                                <span className="absolute left-3.5 top-3.5 text-xs font-bold text-slate-400 font-mono">
                                  +91
                                </span>
                                <input
                                  type="tel"
                                  value={loginPhone}
                                  onChange={(e) => {
                                    setLoginPhone(
                                      e.target.value
                                        .replace(/[^0-9]/g, "")
                                        .slice(0, 10),
                                    );
                                    if (phoneError) setPhoneError("");
                                  }}
                                  placeholder="9876543210"
                                  className={`w-full pl-12 pr-4 py-2.5 bg-slate-50 border text-xs font-semibold rounded-xl focus:outline-none focus:ring-1 focus:bg-white text-slate-800 transition-all ${
                                    phoneError
                                      ? "border-rose-500 focus:ring-rose-500"
                                      : "border-slate-200 focus:ring-emerald-500"
                                  }`}
                                />
                              </div>
                              {phoneError && (
                                <p className="text-[10px] text-rose-500 font-semibold font-mono mt-1">
                                  {phoneError}
                                </p>
                              )}
                            </div>

                            <button
                              type="submit"
                              disabled={isLoggingIn}
                              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer h-11"
                            >
                              {isLoggingIn ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  {t("Sending OTP...")}
                                </>
                              ) : (
                                <>
                                  <Phone className="h-4 w-4" />
                                  {t("Send OTP Code")}
                                </>
                              )}
                            </button>
                          </form>
                        ) : (
                          <form
                            onSubmit={handleOtpSubmit}
                            className="space-y-3"
                          >
                            <div className="space-y-1 text-left">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                                  {t("Enter OTP")}
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setOtpSent(false)}
                                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                                >
                                  {t("Change Mobile")}
                                </button>
                              </div>
                              <div className="relative">
                                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                                <input
                                  type="text"
                                  value={loginOtp}
                                  onChange={(e) => {
                                    setLoginOtp(
                                      e.target.value
                                        .replace(/[^0-9]/g, "")
                                        .slice(0, 6),
                                    );
                                    if (otpError) setOtpError("");
                                  }}
                                  placeholder="1234"
                                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border text-xs font-semibold rounded-xl tracking-widest text-center focus:outline-none focus:ring-1 focus:bg-white text-slate-800 transition-all ${
                                    otpError
                                      ? "border-rose-500 focus:ring-rose-500"
                                      : "border-slate-200 focus:ring-emerald-500"
                                  }`}
                                />
                              </div>
                              <div className="flex justify-between items-center mt-1.5">
                                <span className="text-[9px] font-semibold text-emerald-600 font-mono bg-emerald-50 px-2 py-0.5 rounded">
                                  {t("Demo OTP: 1234")}
                                </span>
                                {otpError && (
                                  <p className="text-[10px] text-rose-500 font-semibold font-mono">
                                    {otpError}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={isLoggingIn}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer h-11"
                            >
                              {isLoggingIn ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  {t("Verifying OTP...")}
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-4 w-4" />
                                  {t("Verify & Login")}
                                </>
                              )}
                            </button>
                          </form>
                        )}
                      </div>
                    )}

                    {/* Social/Alternative Login Divider and Buttons */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-[1px] bg-slate-100 flex-grow" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                          {t("Or Continue With")}
                        </span>
                        <div className="h-[1px] bg-slate-100 flex-grow" />
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {/* Continue with Google */}
                        <button
                          type="button"
                          onClick={handleGoogleLogin}
                          disabled={isLoggingIn}
                          className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-[1.01]"
                        >
                          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                              fill="#EA4335"
                            />
                          </svg>
                          {t("Continue with Google")}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
