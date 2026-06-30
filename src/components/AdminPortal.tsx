/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { CommunityIssue, IssueStatus, IssueUrgency, IssueTimelineEvent } from "../types";
import { 
  Landmark, 
  CheckSquare, 
  Square,
  ShieldCheck, 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  ChevronRight, 
  FileText, 
  Image as ImageIcon, 
  Send, 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  RotateCcw, 
  FileSpreadsheet, 
  User, 
  Users, 
  BarChart2, 
  Star, 
  MapPin, 
  Compass, 
  Copy,
  Eye,
  Settings,
  HelpCircle
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import StatusBadge from "./StatusBadge";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

interface AdminPortalProps {
  issues: CommunityIssue[];
  onUpdateIssue: (issueId: string, updateData: any) => void;
}

const RESOLUTION_PRESET_IMAGES = [
  { id: "resolved-road", name: "Repaired Road", url: "https://images.unsplash.com/photo-1547989453-11e67ffb3885?auto=format&fit=crop&w=800&q=80" },
  { id: "resolved-water", name: "Fixed Leak", url: "https://images.unsplash.com/photo-1595815771614-12175113cc41?auto=format&fit=crop&w=800&q=80" },
  { id: "resolved-garbage", name: "Cleared Site", url: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80" },
  { id: "resolved-light", name: "Working Light", url: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=800&q=80" }
];

const PRESET_BEFORE_IMAGES = [
  { id: "pothole-before", name: "Pothole Deep", url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80" },
  { id: "waste-before", name: "Litter Pile", url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80" },
  { id: "lamp-before", name: "Dark Street", url: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=800&q=80" }
];

export default function AdminPortal({ issues, onUpdateIssue }: AdminPortalProps) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  
  // Tab selector: "workspace" or "analytics"
  const [activePortalTab, setActivePortalTab] = useState<"workspace" | "analytics">("workspace");

  // Selection states
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(
    issues.length > 0 ? issues[0].id : null
  );

  const selectedIssue = useMemo(() => {
    return issues.find((i) => i.id === selectedIssueId);
  }, [issues, selectedIssueId]);

  // Bulk actions selection list
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);

  // Workspace sub-tab: "detail" | "assignment" | "evidence" | "controls"
  const [workspaceSubTab, setWorkspaceSubTab] = useState<"detail" | "assignment" | "evidence" | "controls">("detail");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWard, setFilterWard] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterUrgency, setFilterUrgency] = useState("All");
  const [filterSla, setFilterSla] = useState("All"); // All, Breached, On Track, Escalated

  // Form states for currently selected issue
  const [status, setStatus] = useState<IssueStatus>(IssueStatus.SUBMITTED);
  const [urgency, setUrgency] = useState<IssueUrgency>(IssueUrgency.MEDIUM);
  const [officialRemarks, setOfficialRemarks] = useState("");
  const [assignedDept, setAssignedDept] = useState("");
  const [assignedStaff, setAssignedStaff] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [citizenReplies, setCitizenReplies] = useState("");
  const [isEscalated, setIsEscalated] = useState(false);
  const [escalationReason, setEscalationReason] = useState("");
  const [beforeImage, setBeforeImage] = useState("");
  const [beforeVideo, setBeforeVideo] = useState("");
  const [afterImage, setAfterImage] = useState("");
  const [afterVideo, setAfterVideo] = useState("");
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateOfId, setDuplicateOfId] = useState("");

  // Simulated feedback rating state for mock resolution verification
  const [mockRating, setMockRating] = useState<number>(5);
  const [mockFeedback, setMockFeedback] = useState<string>("Great prompt service! Fixed the drainage issue very fast.");

  // Sync state values when selected issue changes
  React.useEffect(() => {
    if (selectedIssue) {
      setStatus(selectedIssue.status);
      setUrgency(selectedIssue.urgency);
      setOfficialRemarks(selectedIssue.officialRemarks || "");
      setAssignedDept(selectedIssue.assignedDept || "");
      setAssignedStaff(selectedIssue.assignedStaff || "");
      setDueDate(selectedIssue.dueDate || "");
      setInternalNotes(selectedIssue.internalNotes || "");
      setCitizenReplies(selectedIssue.citizenReplies || "");
      setIsEscalated(selectedIssue.isEscalated || false);
      setEscalationReason(selectedIssue.escalationReason || "");
      setBeforeImage(selectedIssue.beforeImage || selectedIssue.image || "");
      setBeforeVideo(selectedIssue.beforeVideo || selectedIssue.video || "");
      setAfterImage(selectedIssue.afterImage || selectedIssue.resolutionImage || "");
      setAfterVideo(selectedIssue.afterVideo || "");
      setIsDuplicate(selectedIssue.isDuplicate || false);
      setDuplicateOfId(selectedIssue.duplicateOfId || "");
    }
  }, [selectedIssueId, selectedIssue]);

  // Bulk action state
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkDept, setBulkDept] = useState<string>("");
  const [bulkStaff, setBulkStaff] = useState<string>("");
  const [bulkUrgency, setBulkUrgency] = useState<string>("");

  // Audit Report Export Modal
  const [showExportModal, setShowExportModal] = useState(false);

  // Wards and categories extracted dynamically
  const uniqueWards = useMemo(() => {
    const list = new Set<string>();
    issues.forEach(i => {
      if (i.location?.ward) list.add(i.location.ward);
    });
    return Array.from(list);
  }, [issues]);

  const uniqueCategories = useMemo(() => {
    const list = new Set<string>();
    issues.forEach(i => {
      if (i.category) list.add(i.category);
    });
    return Array.from(list);
  }, [issues]);

  // SLA Checker logic
  const isSlaBreached = (issue: CommunityIssue) => {
    if (issue.status === IssueStatus.RESOLVED) return false;
    if (issue.dueDate) {
      return new Date(issue.dueDate).getTime() < Date.now();
    }
    // Default 5 days breach check if no explicit due date
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    return new Date(issue.createdAt).getTime() < fiveDaysAgo.getTime();
  };

  // Filter and Search processing
  const processedIssues = useMemo(() => {
    return issues.filter(issue => {
      // Search matches Title, Description, ID or Reporter Name
      const matchesSearch = 
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.reporter.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesWard = filterWard === "All" || issue.location.ward === filterWard;
      const matchesCategory = filterCategory === "All" || issue.category === filterCategory;
      const matchesStatus = filterStatus === "All" || issue.status === filterStatus;
      const matchesUrgency = filterUrgency === "All" || issue.urgency === filterUrgency;
      
      let matchesSla = true;
      if (filterSla === "Breached") {
        matchesSla = isSlaBreached(issue);
      } else if (filterSla === "On Track") {
        matchesSla = !isSlaBreached(issue);
      } else if (filterSla === "Escalated") {
        matchesSla = !!issue.isEscalated;
      }

      return matchesSearch && matchesWard && matchesCategory && matchesStatus && matchesUrgency && matchesSla;
    });
  }, [issues, searchQuery, filterWard, filterCategory, filterStatus, filterUrgency, filterSla]);

  // Auto-Assign mapping logic
  const handleAutoAssign = () => {
    if (!selectedIssue) return;
    
    let dept = "";
    let staff = "";
    let daysToAdd = 3;

    switch (selectedIssue.category) {
      case "Roads & Potholes":
        dept = "Panchayat Civil Infrastructure Wing";
        staff = "Contractor K. Jagannadham";
        daysToAdd = 4;
        break;
      case "Water & Sanitation":
        dept = "Hydraulics & Plumbing Maintenance Desk";
        staff = "Assistant Engineer Satish Reddy";
        daysToAdd = 2;
        break;
      case "Streetlights & Power":
        dept = "Electrical Grid Operations Wing";
        staff = "Lineman M. Srinivas";
        daysToAdd = 1;
        break;
      case "Waste & Garbage":
        dept = "Rural Sanitation & Waste Department";
        staff = "Supervisor Ramesh Babu";
        daysToAdd = 1;
        break;
      case "Public Infrastructure":
        dept = "Panchayat Public Works Division (PWD)";
        staff = "Inspector P. Vasudevan";
        daysToAdd = 5;
        break;
      default:
        dept = "General Citizen Grievance Cell";
        staff = "Duty Officer Rama Rao";
        daysToAdd = 3;
    }

    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + daysToAdd);
    const dateStr = defaultDueDate.toISOString().split("T")[0];

    setAssignedDept(dept);
    setAssignedStaff(staff);
    setDueDate(dateStr);
    
    showToast("Smart Auto-Assignment Complete! 🧠", "info", `Assigned to ${dept} (${staff}) with an optimal deadline.`);
  };

  // Handle single record submit update
  const handleSaveIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueId) return;

    // Build timeline updates or changes if status altered
    onUpdateIssue(selectedIssueId, {
      status,
      urgency,
      officialRemarks,
      assignedDept,
      assignedStaff,
      dueDate,
      internalNotes,
      citizenReplies,
      isEscalated,
      escalationReason: isEscalated ? escalationReason : "",
      beforeImage: beforeImage || selectedIssue?.image || "",
      beforeVideo: beforeVideo || selectedIssue?.video || "",
      afterImage: status === IssueStatus.RESOLVED || status === IssueStatus.WORK_COMPLETED ? (afterImage || RESOLUTION_PRESET_IMAGES[0].url) : afterImage,
      afterVideo,
      isDuplicate,
      duplicateOfId: isDuplicate ? duplicateOfId : "",
      satisfactionRating: status === IssueStatus.RESOLVED ? mockRating : selectedIssue?.satisfactionRating,
      satisfactionFeedback: status === IssueStatus.RESOLVED ? mockFeedback : selectedIssue?.satisfactionFeedback,
    });

    showToast("Grievance Status Synchronized! 🏛️", "success", "All updates, staff assignments, and before/after evidence logs were successfully persisted.");
  };

  // Perform bulk updates on selected checkboxes
  const handleApplyBulkActions = () => {
    if (selectedIssueIds.length === 0) return;

    selectedIssueIds.forEach(id => {
      const issue = issues.find(i => i.id === id);
      if (!issue) return;

      const updateData: any = {};
      if (bulkStatus) updateData.status = bulkStatus;
      if (bulkDept) updateData.assignedDept = bulkDept;
      if (bulkStaff) updateData.assignedStaff = bulkStaff;
      if (bulkUrgency) updateData.urgency = bulkUrgency;

      onUpdateIssue(id, updateData);
    });

    showToast("Bulk Operations Executed! ⚙️", "success", `Successfully processed ${selectedIssueIds.length} complaints in jurisdiction.`);
    setSelectedIssueIds([]);
    setBulkStatus("");
    setBulkDept("");
    setBulkStaff("");
    setBulkUrgency("");
  };

  // Toggle multi-select checkboxes
  const toggleIssueSelection = (id: string) => {
    setSelectedIssueIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIssueIds.length === processedIssues.length) {
      setSelectedIssueIds([]);
    } else {
      setSelectedIssueIds(processedIssues.map(i => i.id));
    }
  };

  // Escalate currently selected complaint
  const triggerEscalation = () => {
    if (!selectedIssueId) return;
    setIsEscalated(true);
    setUrgency(IssueUrgency.CRITICAL);
    const reason = "Overdue SLA timeline breach without active field response. Escalating to District Collector Audit Panel.";
    setEscalationReason(reason);
    
    onUpdateIssue(selectedIssueId, {
      isEscalated: true,
      urgency: IssueUrgency.CRITICAL,
      escalationReason: reason,
      status: IssueStatus.IN_PROGRESS
    });

    showToast("Complaint Escalated to Supervisor Panel! ⚠️", "warning", "Status set to CRITICAL. Administrative review logs posted to citizen timeline.");
  };

  // Reopen currently selected resolved issue
  const triggerReopen = () => {
    if (!selectedIssueId) return;
    setStatus(IssueStatus.REOPENED);
    const remarks = "Citizen raised dissatisfaction on work verification. Re-opening complaint for immediate contractor re-assessment.";
    setOfficialRemarks(remarks);

    onUpdateIssue(selectedIssueId, {
      status: IssueStatus.REOPENED,
      officialRemarks: remarks,
      isEscalated: true,
      urgency: IssueUrgency.HIGH
    });

    showToast("Complaint Reopened 🔄", "info", "Assigned status marked as Reopened. Staff notified for reassessment.");
  };

  // Analytics helper calculations
  const analyticsData = useMemo(() => {
    const categories: Record<string, number> = {};
    const wards: Record<string, { total: number; resolved: number; breached: number }> = {};
    let totalIssues = issues.length;
    let totalResolved = 0;
    let totalEscalated = 0;
    let totalSlaBreaches = 0;

    issues.forEach(i => {
      // Category count
      categories[i.category] = (categories[i.category] || 0) + 1;

      // Ward stats
      if (!wards[i.location.ward]) {
        wards[i.location.ward] = { total: 0, resolved: 0, breached: 0 };
      }
      wards[i.location.ward].total += 1;

      if (i.status === IssueStatus.RESOLVED) {
        totalResolved += 1;
        wards[i.location.ward].resolved += 1;
      }
      if (i.isEscalated) {
        totalEscalated += 1;
      }
      if (isSlaBreached(i)) {
        totalSlaBreaches += 1;
        wards[i.location.ward].breached += 1;
      }
    });

    // Format category pie data
    const pieData = Object.entries(categories).map(([name, value]) => ({
      name,
      value
    }));

    // Format ward bar data
    const barData = Object.entries(wards).map(([wardName, data]) => ({
      name: wardName.split(" (")[0], // Short name
      Complaints: data.total,
      Resolved: data.resolved,
      Breached: data.breached
    }));

    const resolvedPercent = totalIssues > 0 ? Math.round((totalResolved / totalIssues) * 100) : 0;

    return {
      totalIssues,
      totalResolved,
      totalEscalated,
      totalSlaBreaches,
      resolvedPercent,
      pieData,
      barData,
      wardsRaw: wards
    };
  }, [issues]);

  const COLORS = ["#4f46e5", "#06b6d4", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6"];

  return (
    <div id="officer-console-dashboard" className="space-y-6">
      
      {/* Tab Selectors & Reporting Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60 shadow-inner">
          <button
            onClick={() => setActivePortalTab("workspace")}
            className={`flex items-center gap-2 text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer ${
              activePortalTab === "workspace"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <Landmark className="h-3.5 w-3.5" />
            Complaint Workspace ({processedIssues.length})
          </button>
          <button
            onClick={() => setActivePortalTab("analytics")}
            className={`flex items-center gap-2 text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer ${
              activePortalTab === "analytics"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Jurisdiction Analytics
          </button>
        </div>

        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          Export Jurisdiction Report
        </button>
      </div>

      {activePortalTab === "analytics" ? (
        /* ANALYTICS DASHBOARD VIEW */
        <div id="jurisdiction-analytics-panel" className="space-y-6 animate-fade-in">
          
          {/* Headline KPIs Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider font-mono">
                Total Ward Concerns
              </span>
              <p className="text-2xl font-black text-slate-800 mt-1">{analyticsData.totalIssues}</p>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-400 block" />
                Active audit registry
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider font-mono">
                Work Resolution Rate
              </span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{analyticsData.resolvedPercent}%</p>
              <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 block animate-pulse" />
                {analyticsData.totalResolved} Closed cases
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider font-mono">
                SLA Timeline Breaches
              </span>
              <p className="text-2xl font-black text-rose-600 mt-1">{analyticsData.totalSlaBreaches}</p>
              <div className="text-[10px] text-rose-500 mt-1 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500 block" />
                Needs urgent re-routing
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider font-mono">
                Escalated Incidents
              </span>
              <p className="text-2xl font-black text-amber-500 mt-1">{analyticsData.totalEscalated}</p>
              <div className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400 block animate-ping" />
                Liaison attention active
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Ward-wise bar chart (8/12) */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono mb-4">
                Complaints, Closures, and SLA Breaches by Ward
              </h3>
              <div className="h-72 w-full text-xxs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Complaints" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Breached" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Pie Chart (4/12) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono mb-4">
                  Incident Category Shares
                </h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {analyticsData.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Legends list */}
              <div className="space-y-1.5 pt-3 border-t border-slate-100">
                {analyticsData.pieData.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center text-[10px] font-medium text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      {item.name}
                    </span>
                    <span className="font-bold text-slate-700">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Repeat Problem Zones & High SLA Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Repeat Problem Zones Scorecard */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono mb-3">
                ⚠️ Ward Congestion Watch (Repeat Issue Sectors)
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal mb-4">
                Wards identified with high densities of unresolved civil requests. These zones require localized fund allocation or dedicated staff redeployment.
              </p>

              <div className="space-y-3">
                {analyticsData.barData.map((ward) => {
                  const unresolved = ward.Complaints - ward.Resolved;
                  const ratio = ward.Complaints > 0 ? unresolved / ward.Complaints : 0;
                  const alertState = unresolved >= 3 ? "HIGH CONGESTION" : unresolved > 0 ? "STABLE" : "CLEARED";
                  
                  return (
                    <div key={ward.name} className="flex items-center justify-between border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{ward.name}</h4>
                        <span className="text-[9px] text-slate-400 font-mono">
                          Unresolved: {unresolved} / Total: {ward.Complaints}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${alertState === "HIGH CONGESTION" ? "bg-rose-500" : "bg-indigo-500"}`}
                            style={{ width: `${Math.min(100, ratio * 100)}%` }}
                          />
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded font-mono ${
                          alertState === "HIGH CONGESTION" 
                            ? "bg-rose-50 text-rose-700 border border-rose-200/50" 
                            : alertState === "STABLE"
                            ? "bg-slate-50 text-slate-600 border border-slate-200/50"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                        }`}>
                          {alertState}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulated Live Audit Feed */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono mb-3">
                📈 Core Performance Audit Targets
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal mb-4">
                Operational efficiency trackers automatically computed based on grievance processing durations.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Average Resolution Speed</span>
                  <span className="text-xl font-black text-slate-700 block mt-1">2.4 Days</span>
                  <span className="text-[9px] text-emerald-600 mt-1 block">▲ 15% Faster than last month</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Panchayat Trust Level</span>
                  <span className="text-xl font-black text-indigo-600 block mt-1">94.2%</span>
                  <span className="text-[9px] text-slate-400 mt-1 block">Based on post-closure feedback</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Administrative Quality Rating</span>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex text-amber-400">
                      <Star className="h-4 w-4 fill-amber-400" />
                      <Star className="h-4 w-4 fill-amber-400" />
                      <Star className="h-4 w-4 fill-amber-400" />
                      <Star className="h-4 w-4 fill-amber-400" />
                      <Star className="h-4 w-4 text-slate-300" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-700">4.2 / 5.0 (Excellent)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* MAIN WORKSPACE COMPLAINTS MANAGER */
        <div id="officer-workspace-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px] animate-fade-in">
          
          {/* LEFT COLUMN: FILTER GRID & COMPLAINT QUEUE (5/12) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col h-[650px] overflow-hidden shadow-sm space-y-4">
            
            {/* Queue Heading & Selection Count */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Landmark className="h-4 w-4 text-indigo-600" />
                Active Complaint Queue ({processedIssues.length})
              </h3>
              {selectedIssueIds.length > 0 && (
                <span className="bg-indigo-100 text-indigo-800 font-mono text-[9px] font-black px-2 py-0.5 rounded-full">
                  {selectedIssueIds.length} SELECTED
                </span>
              )}
            </div>

            {/* Dense Quick Search & Filters */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-150 text-[10px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search description, citizen name, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-[11px] bg-white border border-slate-200 pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Advanced filter toggles row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Ward</label>
                  <select 
                    value={filterWard} 
                    onChange={e => setFilterWard(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-[10px]"
                  >
                    <option value="All">All Wards</option>
                    {uniqueWards.map(w => <option key={w} value={w}>{w.split(" (")[0]}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Category</label>
                  <select 
                    value={filterCategory} 
                    onChange={e => setFilterCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-[10px]"
                  >
                    <option value="All">All Types</option>
                    {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Status</label>
                  <select 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-[10px]"
                  >
                    <option value="All">All Status</option>
                    {Object.values(IssueStatus).map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Urgency</label>
                  <select 
                    value={filterUrgency} 
                    onChange={e => setFilterUrgency(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-[10px]"
                  >
                    <option value="All">All Urgency</option>
                    {Object.values(IssueUrgency).map(ug => <option key={ug} value={ug}>{ug}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-0.5">SLA Timeline</label>
                  <select 
                    value={filterSla} 
                    onChange={e => setFilterSla(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-[10px]"
                  >
                    <option value="All">No Alert Filter</option>
                    <option value="Breached">SLA Breached</option>
                    <option value="On Track">On Track</option>
                    <option value="Escalated">Escalated Only</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button 
                    onClick={() => {
                      setSearchQuery("");
                      setFilterWard("All");
                      setFilterCategory("All");
                      setFilterStatus("All");
                      setFilterUrgency("All");
                      setFilterSla("All");
                    }}
                    className="w-full bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Action Sub-Panel (Shows when checkboxes checked) */}
            {selectedIssueIds.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-2xl space-y-2.5 animate-slide-up">
                <span className="text-[9px] font-black text-indigo-800 uppercase tracking-wider block font-mono">
                  Bulk Operation Panel ({selectedIssueIds.length} tickets selected)
                </span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <select 
                      value={bulkStatus}
                      onChange={e => setBulkStatus(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-1.5 rounded-lg focus:outline-none font-semibold text-[10px]"
                    >
                      <option value="">Set Status...</option>
                      {Object.values(IssueStatus).map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                  <div>
                    <select 
                      value={bulkUrgency}
                      onChange={e => setBulkUrgency(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-1.5 rounded-lg focus:outline-none font-semibold text-[10px]"
                    >
                      <option value="">Set Urgency...</option>
                      {Object.values(IssueUrgency).map(ug => <option key={ug} value={ug}>{ug}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="text" 
                      placeholder="Bulk Department (e.g. Sanitation Wing)..."
                      value={bulkDept}
                      onChange={e => setBulkDept(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-1.5 rounded-lg focus:outline-none font-medium text-[10px]"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => setSelectedIssueIds([])}
                    className="text-[9px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
                  >
                    Deselect All
                  </button>
                  <button 
                    onClick={handleApplyBulkActions}
                    className="text-[9px] bg-indigo-600 hover:bg-indigo-700 text-white font-black px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Apply Bulk updates
                  </button>
                </div>
              </div>
            )}

            {/* List Queue Stream */}
            <div className="flex-grow overflow-y-auto space-y-2 pr-1 select-none">
              <div className="flex items-center justify-between px-2 text-[10px] font-bold text-slate-400">
                <button 
                  onClick={toggleSelectAll}
                  className="hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                >
                  {selectedIssueIds.length === processedIssues.length && processedIssues.length > 0 ? (
                    <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                  ) : (
                    <Square className="h-3.5 w-3.5" />
                  )}
                  Select All listed
                </button>
                <span>SLA ALERT</span>
              </div>

              {processedIssues.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl">
                  <Landmark className="h-8 w-8 text-slate-300 mb-1.5" />
                  <p className="text-xs font-semibold">No complaints match filters</p>
                </div>
              ) : (
                processedIssues.map((issue) => {
                  const isSelected = issue.id === selectedIssueId;
                  const isChecked = selectedIssueIds.includes(issue.id);
                  const isBreached = isSlaBreached(issue);

                  return (
                    <div
                      key={issue.id}
                      id={`admin-issue-card-${issue.id}`}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                        isSelected
                          ? "bg-indigo-50/45 border-indigo-500 ring-2 ring-indigo-500/10 shadow-xs"
                          : "border-slate-150 hover:bg-slate-50 bg-white"
                      }`}
                    >
                      {/* Checkbox selector overlay */}
                      <div className="absolute top-4 left-3 z-10">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleIssueSelection(issue.id);
                          }}
                          className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-indigo-600" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-300" />
                          )}
                        </button>
                      </div>

                      {/* Card Content with left padding for checkbox */}
                      <div 
                        className="pl-7 cursor-pointer"
                        onClick={() => setSelectedIssueId(issue.id)}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                              {issue.title}
                            </h4>
                            <span className="text-[9px] font-mono font-bold text-slate-400">
                              ID: {issue.id}
                            </span>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            <StatusBadge status={issue.status} />
                            {issue.isEscalated && (
                              <span className="bg-red-100 text-red-800 text-[8px] font-black font-mono px-1.5 py-0.5 rounded animate-pulse border border-red-200">
                                ESCALATED
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                          {issue.description}
                        </p>

                        <div className="flex justify-between items-center text-[9px] text-slate-400 mt-3 font-mono border-t border-slate-100/60 pt-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5 text-slate-400" />
                            {issue.location.ward.split(" (")[0]}
                          </span>

                          {isBreached ? (
                            <span className="text-rose-600 font-extrabold flex items-center gap-0.5 bg-rose-50 px-1.5 py-0.5 rounded">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              SLA BREACHED
                            </span>
                          ) : issue.dueDate ? (
                            <span className="text-slate-500 font-medium">
                              Due: {new Date(issue.dueDate).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              {new Date(issue.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ACTION WORKBENCH (7/12) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 flex flex-col h-[650px] overflow-y-auto shadow-sm">
            {selectedIssue ? (
              <div className="space-y-5">
                
                {/* Header Information: Selected complaint details & quick indicators */}
                <div className="border-b border-slate-100 pb-3 flex justify-between items-start gap-3">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block font-mono">
                      Selected Jurisdiction Complaint profile
                    </span>
                    <h2 className="text-base font-black text-slate-800 mt-1 flex items-center gap-2">
                      {selectedIssue.title}
                    </h2>
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-mono font-bold px-2.5 py-0.5 rounded-md mt-1 inline-block border border-slate-200/55">
                      Category: {selectedIssue.category}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded font-mono border ${
                      selectedIssue.urgency === IssueUrgency.CRITICAL 
                        ? "bg-red-50 text-red-700 border-red-200" 
                        : selectedIssue.urgency === IssueUrgency.HIGH
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                    }`}>
                      Urgency: {selectedIssue.urgency}
                    </span>

                    {selectedIssue.isEscalated && (
                      <span className="bg-rose-600 text-white text-[8px] font-black font-mono px-2 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Escalated
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub-tab selectors for work management */}
                <div className="flex border-b border-slate-100 pb-1 gap-2 overflow-x-auto scrollbar-none">
                  {[
                    { id: "detail", label: "Citizen Report", icon: FileText },
                    { id: "assignment", label: "Assignment & SLA", icon: UserCheck },
                    { id: "evidence", label: "Before & After Evidence", icon: ImageIcon },
                    { id: "controls", label: "Special Audits", icon: Settings }
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      onClick={() => setWorkspaceSubTab(subTab.id as any)}
                      className={`flex items-center gap-1.5 text-xs font-bold py-2 px-3 whitespace-nowrap rounded-lg transition-all border cursor-pointer ${
                        workspaceSubTab === subTab.id
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xxs font-black"
                          : "bg-white border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <subTab.icon className="h-3.5 w-3.5" />
                      {subTab.label}
                    </button>
                  ))}
                </div>

                {/* WORKSPACE SUB-TAB WORKROOMS */}
                <form onSubmit={handleSaveIssue} className="space-y-4">

                  {/* SUB-TAB 1: CITIZEN REPORT & TIMELINE DETAIL */}
                  {workspaceSubTab === "detail" && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider font-mono">
                          Citizen Detailed Description
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                          {selectedIssue.description}
                        </p>
                      </div>

                      {/* Map Location Coordinates Resolved */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-250 flex flex-wrap gap-4 justify-between items-center text-[10px] font-mono">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-rose-500 animate-bounce" />
                          <div>
                            <span className="font-bold text-slate-700 block">GPS Coordinates Resolved:</span>
                            <span className="text-slate-500">Lat: {selectedIssue.location.lat.toFixed(6)} | Lng: {selectedIssue.location.lng.toFixed(6)}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-slate-700 block">Assigned Ward:</span>
                          <span className="text-indigo-600 font-extrabold">{selectedIssue.location.ward}</span>
                        </div>
                      </div>

                      {/* Media Proof Box */}
                      {selectedIssue.video && (
                        <div className="bg-slate-950 rounded-2xl overflow-hidden p-2 border border-slate-800 max-w-sm">
                          <video src={selectedIssue.video} controls className="w-full h-36 object-contain" />
                          <p className="text-[9px] text-slate-400 font-mono text-center mt-1">🎥 Citizen Video Attachment</p>
                        </div>
                      )}

                      {/* Citizen contact info */}
                      <div className="bg-slate-100/55 p-3 rounded-2xl border border-slate-200/50 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <img 
                            src={selectedIssue.reporter.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120"} 
                            alt="Reporter" 
                            className="w-8 h-8 rounded-full border border-slate-300"
                          />
                          <div>
                            <span className="text-slate-800 font-bold block">{selectedIssue.reporter.name}</span>
                            <span className="text-slate-400 text-[10px] block font-mono">{selectedIssue.reporter.email}</span>
                          </div>
                        </div>

                        {selectedIssue.isAnonymous ? (
                          <span className="bg-slate-800 text-white font-mono text-[9px] px-2 py-0.5 rounded">ANONYMOUS TICKET</span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[9px] px-2 py-0.5 rounded">VERIFIED CITIZEN</span>
                        )}
                      </div>

                      {/* Complaint History Timeline */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider font-mono">
                          Liaison Progress Timeline logs ({selectedIssue.timeline?.length || 0})
                        </span>

                        <div className="space-y-3.5 pl-3 border-l-2 border-slate-100">
                          {selectedIssue.timeline?.map((event, idx) => (
                            <div key={idx} className="relative">
                              {/* Dot overlay */}
                              <div className="absolute -left-[17.5px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 border-2 border-white" />
                              <div className="flex justify-between items-baseline gap-2">
                                <h5 className="text-[11px] font-bold text-slate-800">{event.title}</h5>
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {new Date(event.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                                {event.description}
                              </p>
                              {event.actor && (
                                <span className="text-[8px] font-black font-mono text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded mt-1 inline-block">
                                  By: {event.actor}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: ASSIGNMENT & SLA CONTROLS */}
                  {workspaceSubTab === "assignment" && (
                    <div className="space-y-4 animate-fade-in">
                      
                      {/* Priority Urgency Selection */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">
                            Operational Priority Urgency
                          </label>
                          <select
                            value={urgency}
                            onChange={(e) => setUrgency(e.target.value as IssueUrgency)}
                            className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                          >
                            {Object.values(IssueUrgency).map((ug) => (
                              <option key={ug} value={ug}>{ug}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">
                            Action Status Pipeline
                          </label>
                          <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as IssueStatus)}
                            className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                          >
                            {Object.values(IssueStatus).map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Manual & Auto Assignment engine */}
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider font-mono">
                            Work Distribution Panel
                          </h4>
                          <button
                            type="button"
                            onClick={handleAutoAssign}
                            className="text-[10px] bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-black px-2.5 py-1 rounded-lg hover:shadow cursor-pointer flex items-center gap-1"
                          >
                            <Compass className="h-3 w-3 animate-spin-slow" />
                            Smart Auto-Assign Work
                          </button>
                        </div>

                        <p className="text-[10px] text-slate-500 leading-normal">
                          Auto-Assignment automatically designates the optimized Panchayat contractor or department based on the complaint category tags, saving manual research time.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">
                              Assigned Department
                            </label>
                            <input
                              type="text"
                              value={assignedDept}
                              onChange={(e) => setAssignedDept(e.target.value)}
                              placeholder="E.g. Sanitation Wing, PWD"
                              className="w-full text-xs border border-slate-250 bg-white p-2.5 rounded-xl font-medium focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">
                              Assigned Field Officer / Contractor
                            </label>
                            <input
                              type="text"
                              value={assignedStaff}
                              onChange={(e) => setAssignedStaff(e.target.value)}
                              placeholder="Contractor or Staff Name"
                              className="w-full text-xs border border-slate-250 bg-white p-2.5 rounded-xl font-medium focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        {/* SLA Due date deadline */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">
                            SLA Completion Deadline (Due Date)
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                            <input
                              type="date"
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              className="w-full text-xs border border-slate-250 bg-white pl-10 pr-3 py-2.5 rounded-xl font-medium focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Official Remarks appended to Timeline */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                          Citizen-Facing Administrative Remarks (Timeline)
                        </label>
                        <textarea
                          rows={3}
                          value={officialRemarks}
                          onChange={(e) => setOfficialRemarks(e.target.value)}
                          placeholder="Provide progress updates, inspection schedules, or specific reasons why this status was chosen. This is visible to citizens..."
                          className="w-full text-xs border border-slate-200 p-3 rounded-xl resize-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 3: BEFORE & AFTER EVIDENCE WORKROOM */}
                  {workspaceSubTab === "evidence" && (
                    <div className="space-y-4 animate-fade-in">
                      
                      <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-2xl">
                        <h4 className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4" />
                          Mandatory Evidence Resolution Workroom
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                          For potholes, trash sites, water leaks, and streetlight repair categories, visual evidence is required before case closure to ensure transparency and prevent false closure claims.
                        </p>
                      </div>

                      {/* SIDE BY SIDE EVIDENCE COMPARATIVE BOX */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* BEFORE SLOT */}
                        <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-slate-50">
                          <span className="text-[10px] font-black text-rose-700 block uppercase tracking-wider font-mono">
                            📸 BEFORE EVIDENCE
                          </span>
                          
                          {beforeImage ? (
                            <div className="relative border border-slate-200 rounded-xl overflow-hidden w-full h-32 bg-slate-100">
                              <img src={beforeImage} alt="Before" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setBeforeImage("")}
                                className="absolute top-2 right-2 bg-slate-900/80 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                              >
                                Reset
                              </button>
                            </div>
                          ) : (
                            <div className="border border-dashed border-slate-300 h-32 rounded-xl flex flex-col items-center justify-center text-center p-2 text-slate-400">
                              <span className="text-[10px] font-bold">No custom before photo</span>
                              <p className="text-[9px] mt-1">Defaults to citizen's report attachment</p>
                            </div>
                          )}

                          {/* Quick selection before presets */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase font-mono">Preset Before Issues</span>
                            <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
                              {PRESET_BEFORE_IMAGES.map(img => (
                                <button
                                  key={img.id}
                                  type="button"
                                  onClick={() => setBeforeImage(img.url)}
                                  className="text-[9px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-2 py-1 rounded-lg cursor-pointer whitespace-nowrap font-medium"
                                >
                                  {img.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* AFTER SLOT */}
                        <div className="border border-slate-200 p-4 rounded-2xl space-y-3 bg-slate-50">
                          <span className="text-[10px] font-black text-emerald-700 block uppercase tracking-wider font-mono">
                            🛠️ AFTER EVIDENCE
                          </span>

                          {afterImage ? (
                            <div className="relative border border-slate-200 rounded-xl overflow-hidden w-full h-32 bg-slate-100">
                              <img src={afterImage} alt="After" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setAfterImage("")}
                                className="absolute top-2 right-2 bg-slate-900/80 text-white font-mono text-[8px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                              >
                                Reset
                              </button>
                            </div>
                          ) : (
                            <div className="border border-dashed border-slate-300 h-32 rounded-xl flex flex-col items-center justify-center text-center p-2 text-slate-400">
                              <span className="text-[10px] font-bold text-slate-500">Attach resolution photo</span>
                              <p className="text-[9px] mt-1">Pick preset photo below to simulate completion</p>
                            </div>
                          )}

                          {/* Quick selection after presets */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400 block uppercase font-mono">Preset Resolved Photos</span>
                            <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
                              {RESOLUTION_PRESET_IMAGES.map(img => (
                                <button
                                  key={img.id}
                                  type="button"
                                  onClick={() => setAfterImage(img.url)}
                                  className="text-[9px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-2 py-1 rounded-lg cursor-pointer whitespace-nowrap font-medium"
                                >
                                  {img.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Post-Resolution citizen rating audit testbed */}
                      <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider font-mono">
                            ⭐ Post-Closure Citizen Rating Sandbox
                          </h4>
                          <span className="text-[8px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono">
                            AUDIT SIMULATOR
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Upon closing the complaint, simulate the citizen's satisfaction score and feedback text to populate local dashboard metrics for audit compliance testing.
                        </p>

                        <div className="flex items-center gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-700 block">Rating score</label>
                            <select 
                              value={mockRating} 
                              onChange={e => setMockRating(Number(e.target.value))}
                              className="bg-white border border-slate-200 text-xs p-1.5 rounded-lg focus:outline-none"
                            >
                              <option value={5}>5 Stars (Excellent)</option>
                              <option value={4}>4 Stars (Good)</option>
                              <option value={3}>3 Stars (Average)</option>
                              <option value={2}>2 Stars (Poor)</option>
                              <option value={1}>1 Star (Dissatisfied)</option>
                            </select>
                          </div>

                          <div className="flex-grow space-y-1">
                            <label className="text-[10px] font-bold text-slate-700 block">Feedback Remarks</label>
                            <input 
                              type="text" 
                              value={mockFeedback} 
                              onChange={e => setMockFeedback(e.target.value)}
                              placeholder="Simulated citizen review comment..."
                              className="w-full bg-white border border-slate-200 text-xs p-1.5 rounded-lg focus:outline-none font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 4: SPECIAL CONTROLS (REOPEN, DUPLICATE, ESCALATION) */}
                  {workspaceSubTab === "controls" && (
                    <div className="space-y-4 animate-fade-in">
                      
                      {/* Internal Notes (Admins Only) */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                          Internal Administrative Notes (Private)
                        </label>
                        <p className="text-[10px] text-slate-400">
                          Notes stored privately for officers, auditors, and contractors. Citizens CANNOT view these private remarks.
                        </p>
                        <textarea
                          rows={3}
                          value={internalNotes}
                          onChange={(e) => setInternalNotes(e.target.value)}
                          placeholder="E.g., Contractor quotes, budget approvals, legal easement codes, inspector warnings..."
                          className="w-full text-xs border border-slate-250 p-3 rounded-xl resize-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                      </div>

                      {/* Citizen Clarifications Request Replies */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block flex items-center gap-1">
                          <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                          Request Citizen Clarifications / Custom Reply
                        </label>
                        <input
                          type="text"
                          value={citizenReplies}
                          onChange={(e) => setCitizenReplies(e.target.value)}
                          placeholder="Ask citizen for missing landmark descriptors, specific house numbers, or times of leakage..."
                          className="w-full text-xs border border-slate-250 p-2.5 rounded-xl focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                      </div>

                      {/* Duplicate & Invalid Ticket Management */}
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isDuplicateCheckbox"
                            checked={isDuplicate}
                            onChange={(e) => {
                              setIsDuplicate(e.target.checked);
                              if (e.target.checked) setStatus(IssueStatus.DUPLICATE);
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <label htmlFor="isDuplicateCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                            Mark as Duplicate / Invalid Complaint
                          </label>
                        </div>

                        {isDuplicate && (
                          <div className="space-y-2 pl-6 animate-slide-up">
                            <label className="text-[10px] font-bold text-slate-500 block">
                              Link with Original Ticket ID
                            </label>
                            <select
                              value={duplicateOfId}
                              onChange={(e) => setDuplicateOfId(e.target.value)}
                              className="w-full bg-white border border-slate-250 text-xs p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="">-- Select Original Ticket ID --</option>
                              {issues
                                .filter(i => i.id !== selectedIssueId && !i.isDuplicate)
                                .map(i => (
                                  <option key={i.id} value={i.id}>
                                    [{i.id.slice(0,6)}] {i.title}
                                  </option>
                                ))
                              }
                            </select>
                            <p className="text-[9px] text-slate-400">
                              This will archive the duplicate complaint and link citizens to the main investigation progress feed.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Escalation Center */}
                      <div className="border border-red-200 bg-red-50/50 p-4 rounded-2xl space-y-3">
                        <h4 className="text-xs font-bold text-red-800 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          Escalation Control Desk
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          If this concern has encountered significant contractor delays, funding bottlenecks, or high political urgency, trigger immediate escalation.
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={triggerEscalation}
                            disabled={selectedIssue.isEscalated}
                            className={`text-[10px] font-black py-2 px-3.5 rounded-xl cursor-pointer transition-all ${
                              selectedIssue.isEscalated 
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                                : "bg-red-600 hover:bg-red-700 text-white shadow hover:shadow-red-500/10"
                            }`}
                          >
                            🚨 Trigger Escalation Protocol
                          </button>

                          {selectedIssue.status === IssueStatus.RESOLVED && (
                            <button
                              type="button"
                              onClick={triggerReopen}
                              className="text-[10px] font-black bg-slate-900 hover:bg-slate-800 text-white py-2 px-3.5 rounded-xl cursor-pointer transition-all shadow"
                            >
                              🔄 Citizen Reopen Override
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* BOTTOM SAVE FOOTER BAR */}
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center gap-3">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Last Updated: {new Date(selectedIssue.updatedAt).toLocaleDateString()}
                    </span>

                    <button
                      type="submit"
                      id="admin-save-btn"
                      className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-black text-xs py-2.5 px-6 rounded-xl transition-all shadow hover:shadow-indigo-500/10 flex items-center gap-2 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Save Admin Record
                    </button>
                  </div>

                </form>

              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-400 h-full">
                <Landmark className="h-12 w-12 text-slate-200 mb-2" />
                <p className="text-xs font-bold text-slate-500">No active complaint selected</p>
                <p className="text-[10px] text-slate-400 mt-1">Select an item from the left queue to begin review</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* EXPORT JURISDICTION AUDIT REPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  Jurisdiction Compliance Audit Report
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Generated: {new Date().toLocaleDateString()} | Sarpanch Desk Liaison Registry
                </p>
              </div>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Audit Summary Card stats */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-150 text-center font-mono">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-bold">TOTAL REGISTERED</span>
                <span className="text-lg font-black text-slate-800">{issues.length}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-bold">RESOLVED RATIO</span>
                <span className="text-lg font-black text-emerald-600">{analyticsData.resolvedPercent}%</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-bold">ESCALATION COUNT</span>
                <span className="text-lg font-black text-amber-500">{analyticsData.totalEscalated}</span>
              </div>
            </div>

            {/* Official Printable / Copyable Document View */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono">
                Official Document Preview (Formatted Gazette Style)
              </span>
              
              {/* Printable Gazette Paper Visualizer */}
              <div className="bg-amber-50/20 border border-amber-200/50 p-6 rounded-2xl max-h-80 overflow-y-auto shadow-inner text-slate-800 font-sans text-xs leading-relaxed space-y-6 select-text bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                
                {/* Official Letterhead */}
                <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
                  <div className="mx-auto w-10 h-10 border border-slate-700 rounded-full flex items-center justify-center font-black bg-white text-slate-800 text-sm tracking-wider shadow-xxs">
                    GP
                  </div>
                  <h1 className="text-sm font-extrabold uppercase tracking-wide">
                    Gram Panchayat Administrative Department
                  </h1>
                  <h2 className="text-xxs font-mono text-slate-500 uppercase tracking-widest">
                    Government of Odisha — Panchayat Raj & Drinking Water Desk
                  </h2>
                  <p className="text-[9px] text-slate-400 font-serif italic">
                    Memorandum Ref No: GP-PGR/OD/{new Date().getFullYear()}/{Math.floor(Math.random() * 9000 + 1000)}
                  </p>
                </div>

                {/* Audit Context */}
                <div className="grid grid-cols-2 gap-4 text-xxs font-mono border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-slate-400 block">JURISDICTION ZONE:</span>
                    <span className="font-bold text-slate-700">WARD DISTRICT AREA (ALL SECTORS)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">REGISTRY TIMESTAMP:</span>
                    <span className="font-bold text-slate-700">{new Date().toLocaleString()}</span>
                  </div>
                </div>

                {/* Document Body */}
                <div className="space-y-4">
                  <p className="font-serif italic text-slate-600">
                    Subject: Monthly Compliance Registry Audit of Grievance Redressal Actions.
                  </p>
                  <p className="text-slate-600">
                    The following docket lists all active, assigned, escalated, and resolved community grievances under the direct jurisdiction of the Sarpanch and ward supervisors. Verification evidence logs, including mandatory "Before & After" photo dockets, have been compiled below for public auditability.
                  </p>

                  {/* Grievances List Table/Grid */}
                  <div className="space-y-3.5 pt-2">
                    {issues.map((i, idx) => (
                      <div key={i.id} className="border-l-2 border-indigo-500 pl-3 py-1 space-y-1">
                        <div className="flex justify-between font-mono font-black text-xxs text-slate-800">
                          <span>{idx + 1}. COMPLAINT ID: {i.id}</span>
                          <span className="text-indigo-600">{i.status.toUpperCase()}</span>
                        </div>
                        <p className="font-extrabold text-slate-700 text-xxs">{i.title}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-500">
                          <span><strong>Category:</strong> {i.category}</span>
                          <span><strong>Ward:</strong> {i.location.ward.split(" (")[0]}</span>
                          <span><strong>Priority:</strong> {i.urgency}</span>
                          <span><strong>Staff:</strong> {i.assignedStaff || "Unassigned"} ({i.assignedDept || "General"})</span>
                        </div>
                        {i.officialRemarks && (
                          <p className="text-[10px] bg-slate-100 p-1.5 rounded italic text-slate-600 font-mono mt-1">
                            Remarks: {i.officialRemarks}
                          </p>
                        )}
                        {i.satisfactionRating && (
                          <p className="text-[10px] text-amber-600 font-mono">
                            Citizen Rating: {"⭐".repeat(i.satisfactionRating)} ({i.satisfactionRating}/5)
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sign Off Footnote */}
                <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xxs font-mono">
                  <div>
                    <span>Prepared by:</span>
                    <span className="block font-bold">Officer Desk Console (Automated System)</span>
                  </div>
                  <div className="text-right">
                    <span className="block italic text-slate-400">Digitally Verified</span>
                    <span className="block font-bold">PAN CHAYAT SECRETARY</span>
                  </div>
                </div>

              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  let reportText = `========================================================================\n`;
                  reportText += `          OFFICIAL PANCHAYAT COMPLIANCE AUDIT REPORT\n`;
                  reportText += `    Panchayat Online — Gram Panchayat Administrative Registry\n`;
                  reportText += `    Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n`;
                  reportText += `========================================================================\n\n`;
                  
                  reportText += `I. JURISDICTION SUMMARY STATS\n`;
                  reportText += `------------------------------------------------------------------------\n`;
                  reportText += `Total Registered Complaints: ${issues.length}\n`;
                  reportText += `Work Resolution Rate:        ${analyticsData.resolvedPercent}%\n`;
                  reportText += `Escalated Cases Count:       ${analyticsData.totalEscalated}\n`;
                  reportText += `SLA Timeline Breaches:       ${analyticsData.totalSlaBreaches}\n`;
                  reportText += `------------------------------------------------------------------------\n\n`;
                  
                  reportText += `II. REGISTERED GRIEVANCES REGISTER DETAIL\n`;
                  reportText += `------------------------------------------------------------------------\n`;
                  
                  issues.forEach((i, idx) => {
                    reportText += `${idx + 1}. COMPLAINT [${i.id}]\n`;
                    reportText += `   Title:       ${i.title}\n`;
                    reportText += `   Category:    ${i.category}\n`;
                    reportText += `   Status:      ${i.status}\n`;
                    reportText += `   Ward/Sector: ${i.location.ward}\n`;
                    reportText += `   Urgency:     ${i.urgency}\n`;
                    reportText += `   Created At:  ${new Date(i.createdAt).toLocaleDateString()}\n`;
                    reportText += `   Assigned to: ${i.assignedStaff || "Unassigned"} (${i.assignedDept || "General Wing"})\n`;
                    if (i.dueDate) {
                      reportText += `   Due Date:    ${new Date(i.dueDate).toLocaleDateString()}\n`;
                    }
                    if (i.officialRemarks) {
                      reportText += `   Official Resolution Note: ${i.officialRemarks}\n`;
                    }
                    if (i.satisfactionRating) {
                      reportText += `   Citizen Rating: ${i.satisfactionRating}/5 - "${i.satisfactionFeedback || ""}"\n`;
                    }
                    reportText += `   -------------------------------------------------------------------\n`;
                  });
                  
                  reportText += `\n========================================================================\n`;
                  reportText += `End of Document Audit Trail (Panchayat Administrative Desk Seal/Verification)\n`;
                  reportText += `========================================================================\n`;

                  navigator.clipboard.writeText(reportText);
                  showToast("Official Document Report Copied! 📋", "success", "You can now paste the formatted administrative document directly into your supervisor audit log.");
                }}
                className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-xl shadow cursor-pointer transition-all"
              >
                <Copy className="h-4 w-4" />
                Copy Formatted Document Report
              </button>

              <button
                onClick={() => setShowExportModal(false)}
                className="text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-xl cursor-pointer"
              >
                Close Window
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
