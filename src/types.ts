/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum IssueCategory {
  POTHOLE = "Roads & Potholes",
  WATER_LEAKAGE = "Water & Sanitation",
  STREETLIGHT_DAMAGE = "Streetlights & Power",
  WASTE_MANAGEMENT = "Waste & Garbage",
  INFRASTRUCTURE = "Public Infrastructure",
  OTHER = "Other Community Issues"
}

export enum IssueStatus {
  SUBMITTED = "Submitted",
  VERIFIED = "Verified",
  ASSIGNED = "Assigned",
  IN_PROGRESS = "In Progress",
  WAITING_APPROVAL = "Waiting Approval",
  WORK_COMPLETED = "Work Completed",
  RESOLVED = "Resolved",
  REOPENED = "Reopened",
  DUPLICATE = "Duplicate/Invalid"
}

export enum IssueUrgency {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  CRITICAL = "Critical"
}

export interface IssueTimelineEvent {
  status: IssueStatus;
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
}

export interface CommunityIssue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  urgency: IssueUrgency;
  location: {
    lat: number;
    lng: number;
    address: string;
    ward: string;
  };
  reporter: {
    name: string;
    avatar: string;
    email: string;
  };
  isAnonymous?: boolean;
  video?: string;
  upvotes: number;
  userUpvoted?: boolean;
  verifiedByCount: number;
  userVerified?: boolean;
  flagCount: number;
  userFlagged?: boolean;
  createdAt: string;
  updatedAt: string;
  image?: string;
  resolutionImage?: string;
  officialRemarks?: string;
  assignedDept?: string;
  timeline: IssueTimelineEvent[];
  assignedStaff?: string;
  dueDate?: string;
  internalNotes?: string;
  citizenReplies?: string;
  isEscalated?: boolean;
  escalationReason?: string;
  beforeImage?: string;
  beforeVideo?: string;
  afterImage?: string;
  afterVideo?: string;
  satisfactionRating?: number;
  satisfactionFeedback?: string;
  isDuplicate?: boolean;
  duplicateOfId?: string;
}

export interface CitizenProfile {
  name: string;
  avatar: string;
  email: string;
  coins: number;
  reportsCount: number;
  verificationsCount: number;
  rankName: string;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt?: string;
}

export interface PredictiveAlert {
  id: string;
  title: string;
  description: string;
  type: 'weather' | 'maintenance' | 'safety';
  severity: 'low' | 'medium' | 'high';
  location: string;
  eta: string;
  probability: number; // percentage, e.g. 85
}

export interface WardMetric {
  wardName: string;
  totalIssues: number;
  resolvedIssues: number;
  pendingIssues: number;
  satisfactionRate: number; // 0 to 100
  avgResolutionDays: number;
}

export interface SocialComment {
  id: string;
  postId: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    email: string;
  };
  isAnonymous?: boolean;
  mentions: string[];
  createdAt: string;
}

export interface SocialPost {
  id: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    email: string;
  };
  isAnonymous?: boolean;
  location?: {
    lat: number;
    lng: number;
    address: string;
    ward: string;
  };
  image?: string;
  video?: string;
  hashtags: string[];
  mentions: string[];
  likes: number;
  userLiked?: boolean;
  comments: SocialComment[];
  createdAt: string;
}

export interface PanchayatNotification {
  id: string;
  issueId?: string;
  userId?: string;
  title: string;
  message: string;
  channel: "SMS" | "Push Notification" | "Both";
  timestamp: string;
  phoneNumber?: string;
  read: boolean;
}

