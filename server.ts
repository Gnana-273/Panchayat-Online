/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  deleteDoc,
} from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

dotenv.config();

// Initialize Firebase App & Firestore
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Security Enhancements
app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// HTML Sanitization helper to protect against XSS (Cross-Site Scripting)
function sanitizeString(str: any): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
  }
} else {
  console.log(
    "Gemini API Key missing or default. AI services will run in high-fidelity fallback mode.",
  );
}

// In-Memory Data Store (Seeded with realistic Panchayat issues)
interface AppState {
  issues: any[];
  profile: {
    name: string;
    avatar: string;
    email: string;
    coins: number;
    reportsCount: number;
    verificationsCount: number;
    rankName: string;
    badges: any[];
  };
}

const SEED_ISSUES = [
  {
    id: "issue-1",
    title: "Severe Road Cave-In & Deep Potholes on Ward 2 Market Road",
    description:
      "There is a major road cave-in and several deep potholes right in the middle of the main market street near the post office. It is highly hazardous for school buses and motorbikes, especially during late hours. Immediate leveling and tarring are required.",
    category: "Roads & Potholes",
    status: "In Progress",
    urgency: "High",
    location: {
      lat: 17.432,
      lng: 78.448,
      address: "Opposite Post Office, Ward 2 Market Street, Nizamabad",
      ward: "Ward 2 (Market Area)",
    },
    reporter: {
      name: "V. Gnana Shashank",
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      email: "vishwarojugnanashashank@gmail.com",
    },
    upvotes: 24,
    verifiedByCount: 8,
    flagCount: 0,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    image: "/src/assets/images/regenerated_image_1782814301231.png",
    assignedDept: "Public Works Department (PWD)",
    officialRemarks:
      "Our engineering team has inspected the site. Barricading is completed. Soil filling and stone-crush base laying are underway. Tar coating is scheduled for tomorrow morning.",
    timeline: [
      {
        status: "Submitted",
        title: "Issue Reported by Citizen",
        description:
          "Initial report uploaded with active location coordinates and photo verification.",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        actor: "V. Gnana Shashank",
      },
      {
        status: "Verified",
        title: "Community Verified",
        description:
          "8 nearby residents verified this issue as active and accurate. Upvotes reached 20+ threshold.",
        timestamp: new Date(
          Date.now() - 2.5 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        actor: "Ward 2 Committee",
      },
      {
        status: "Assigned",
        title: "Routed to Public Works",
        description:
          "Panchayat Secretary routed the issue to the PWD Roads engineer for immediate work order.",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        actor: "Sarpanch Office",
      },
      {
        status: "In Progress",
        title: "Repair Work Commenced",
        description:
          "PWD repair crew deployed on-site. Excavation of weak topsoil initiated.",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        actor: "PWD Eng. K. Rajesh",
      },
    ],
  },
  {
    id: "issue-2",
    title: "Major Drinking Water Pipeline Leakage near Panchayat Office",
    description:
      "The main underground drinking water connection line has ruptured, resulting in massive drinking water wastage. Thousands of gallons of clean drinking water are flooding the street, and surrounding houses are experiencing drop in water pressure.",
    category: "Water & Sanitation",
    status: "Assigned",
    urgency: "Critical",
    location: {
      lat: 17.438,
      lng: 78.455,
      address: "Water Tank Road, Adjacent to Gram Panchayat Bhavan, Ward 1",
      ward: "Ward 1 (Panchayat Center)",
    },
    reporter: {
      name: "Ramesh Kumar",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      email: "ramesh.k@gmail.com",
    },
    upvotes: 42,
    verifiedByCount: 15,
    flagCount: 0,
    createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    image: "/src/assets/images/regenerated_image_1782814315549.png",
    assignedDept: "Rural Water Supply & Sanitation (RWSS)",
    officialRemarks:
      "RWSS emergency engineers have been contacted. The main valve has been temporarily shut off to restrict water loss. Replacement pipe fittings have been procured and repair crew is dispatched.",
    timeline: [
      {
        status: "Submitted",
        title: "Rupture Reported",
        description: "Rupture reported. Massive water wastage highlighted.",
        timestamp: new Date(
          Date.now() - 1.5 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        actor: "Ramesh Kumar",
      },
      {
        status: "Verified",
        title: "Community Urgently Endorsed",
        description:
          "15 citizens verified the rupture. Urgently escalated due to heavy flooding.",
        timestamp: new Date(
          Date.now() - 1.2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        actor: "Panchayat System",
      },
      {
        status: "Assigned",
        title: "Routed to RWSS Hydrologists",
        description:
          "Assigned to Rural Water Supply Executive Engineer. Saffron gate valve shut down successfully.",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        actor: "Sarpanch Office",
      },
    ],
  },
  {
    id: "issue-3",
    title: "Hazardous Broken Streetlights Plunging Bypass Road into Darkness",
    description:
      "Four successive streetlights on the Bypass Highway section are completely broken. It has become a dark spot, posing severe safety risks for women returning from late work shifts and increasing the risk of highway accidents.",
    category: "Streetlights & Power",
    status: "Submitted",
    urgency: "Medium",
    location: {
      lat: 17.425,
      lng: 78.462,
      address: "Bypass Junction Highway, Ward 4 East Outer Ring",
      ward: "Ward 4 (Bypass)",
    },
    reporter: {
      name: "Priya Sharma",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      email: "priya.sharma@gmail.com",
    },
    upvotes: 12,
    verifiedByCount: 3,
    flagCount: 0,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    image: "/src/assets/images/regenerated_image_1782814326965.png",
    assignedDept: "Gram Panchayat Electrical Wing",
    timeline: [
      {
        status: "Submitted",
        title: "Streetlight Malfunction Submitted",
        description:
          "Citizen reported massive dark spots due to multiple bulb failures on the bypass.",
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        actor: "Priya Sharma",
      },
    ],
  },
  {
    id: "issue-4",
    title: "Illegal Garbage Dumping & Overflowing Bin near High School",
    description:
      "A large garbage bin behind the Government High School is overflowing and has not been cleared for over a week. Strays are scattering the waste everywhere, creating a highly unsanitary smell and breeding mosquitoes right next to the school entrance.",
    category: "Waste & Garbage",
    status: "Resolved",
    urgency: "High",
    location: {
      lat: 17.441,
      lng: 78.435,
      address: "Behind Government High School ground, Ward 3",
      ward: "Ward 3 (School District)",
    },
    reporter: {
      name: "Anil Reddy",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      email: "anil.reddy@gmail.com",
    },
    upvotes: 35,
    verifiedByCount: 11,
    flagCount: 0,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    image:
      "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
    resolutionImage:
      "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80",
    assignedDept: "Sanitation & Solid Waste Management Wing",
    officialRemarks:
      "We deployed a dedicated dumper vehicle and cleared the entire dumping ground. The old broken plastic bin has been replaced with a high-capacity iron bin with a tight lid. Sanitization powder (bleaching powder) was sprayed around the school periphery. Regular daily clearances are scheduled.",
    timeline: [
      {
        status: "Submitted",
        title: "Garbage Pile Logged",
        description:
          "Citizen raised report on unsanitary conditions near the high school.",
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        actor: "Anil Reddy",
      },
      {
        status: "Verified",
        title: "School Board Endorsed",
        description:
          "School staff and 11 community parents verified and upvoted the concern.",
        timestamp: new Date(
          Date.now() - 5.5 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        actor: "Ward 3 PTA",
      },
      {
        status: "Assigned",
        title: "Assigned to Sanitation wing",
        description:
          "Assigned with highest priority to Panchayat Cleanliness Supervisor.",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        actor: "Panchayat Secretary",
      },
      {
        status: "In Progress",
        title: "Cleanliness Drive Active",
        description:
          "Sanitation trucks and sweepers deployed. Garbage removal in progress.",
        timestamp: new Date(
          Date.now() - 3.5 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        actor: "Sanitation Wing",
      },
      {
        status: "Resolved",
        title: "Dumping Area Fully Cleared & Disinfected",
        description:
          "Site fully cleared, new waste bin installed, and area disinfected. Resolution photo uploaded by admin.",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        actor: "Sanitation Inspector",
      },
    ],
  },
];

const INITIAL_PROFILE = {
  name: "V. Gnana Shashank",
  avatar:
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
  email: "vishwarojugnanashashank@gmail.com",
  coins: 350,
  reportsCount: 1, // corresponds to the seeded pothole issue he reported
  verificationsCount: 4,
  rankName: "Panchayat Protector",
  badges: [
    {
      id: "badge-1",
      name: "Eagle Eye",
      description: "First verified community report submitted.",
      icon: "Eye",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "badge-2",
      name: "Civic Pillar",
      description: "Helped verify 3+ active village issues.",
      icon: "Shield",
      color: "bg-amber-100 text-amber-700 border-amber-200",
      unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

const ALL_BADGES = [
  {
    id: "badge-1",
    name: "Eagle Eye",
    description: "First verified community report submitted.",
    icon: "Eye",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    id: "badge-2",
    name: "Civic Pillar",
    description: "Helped verify 3+ active village issues.",
    icon: "Shield",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  {
    id: "badge-3",
    name: "Panchayat Hero",
    description: "Submit 5+ resolved issues to the platform.",
    icon: "Award",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  {
    id: "badge-4",
    name: "Truth Seeker",
    description: "Conduct 10+ accurate community verifications.",
    icon: "CheckCircle",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
];

let state: AppState = {
  issues: SEED_ISSUES,
  profile: INITIAL_PROFILE,
};

let socialPosts: any[] = [
  {
    id: "post-1",
    content:
      "We need more volunteers for the upcoming Swachh Bharat drive this Saturday morning near Ward 1. Bring brooms and bags! #CleanVillage #Nizamabad #SwachhBharat @Sarpanch",
    author: {
      name: "Anil Reddy",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      email: "anil.reddy@gmail.com",
    },
    isAnonymous: false,
    location: {
      lat: 17.435,
      lng: 78.442,
      address: "Panchayat Hall Ground",
      ward: "Ward 1 (Panchayat Center)",
    },
    hashtags: ["CleanVillage", "Nizamabad", "SwachhBharat"],
    mentions: ["Sarpanch"],
    likes: 15,
    userLiked: false,
    comments: [
      {
        id: "comment-1",
        postId: "post-1",
        content:
          "I'll be there! Let's clean up the high school perimeter too @AnilReddy",
        author: {
          name: "V. Gnana Shashank",
          avatar:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
          email: "vishwarojugnanashashank@gmail.com",
        },
        mentions: ["AnilReddy"],
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "post-2",
    content:
      "Panchayat lights on Bypass road are still completely dark after 7 PM. Very unsafe. Hoping for a quick fix from the electrical dept. #Streetlights #Safety @PWD",
    author: {
      name: "Radha Naidu",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      email: "radha.naidu@gmail.com",
    },
    isAnonymous: false,
    location: {
      lat: 17.428,
      lng: 78.455,
      address: "Bypass Junction",
      ward: "Ward 4 (Bypass)",
    },
    hashtags: ["Streetlights", "Safety"],
    mentions: ["PWD"],
    likes: 28,
    userLiked: true,
    comments: [],
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

let notifications: any[] = [
  {
    id: "notif-1",
    issueId: "issue-1",
    title: "Complaint Active 🛠️",
    message:
      "Your reported road cave-in on Ward 2 Market Road has been marked IN PROGRESS by PWD Department.",
    channel: "Both",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    phoneNumber: "+91 ••••• •8492",
    read: false,
  },
  {
    id: "notif-2",
    issueId: "issue-4",
    title: "Complaint Resolved! 🎉",
    message:
      "The illegal garbage dumping site behind Government High School has been disinfected and RESOLVED.",
    channel: "Both",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    phoneNumber: "+91 ••••• •8492",
    read: true,
  },
];

// Firestore Persistent Sync Helpers
async function syncFromFirestore() {
  try {
    console.log("Synchronizing memory state with Firestore...");

    // 1. Sync Issues
    const issuesCol = collection(db, "issues");
    const issuesSnap = await getDocs(issuesCol);
    if (issuesSnap.empty) {
      console.log(
        "Firestore 'issues' collection is empty. Seeding SEED_ISSUES...",
      );
      for (const issue of SEED_ISSUES) {
        await setDoc(doc(db, "issues", issue.id), issue);
      }
      state.issues = SEED_ISSUES;
    } else {
      state.issues = issuesSnap.docs.map((doc) => doc.data() as any);
      console.log(`Loaded ${state.issues.length} issues from Firestore.`);
    }

    // 2. Sync Profile
    const profileDocRef = doc(db, "profiles", INITIAL_PROFILE.email);
    const profileSnap = await getDoc(profileDocRef);
    if (!profileSnap.exists()) {
      console.log(
        "Firestore profile does not exist. Seeding INITIAL_PROFILE...",
      );
      await setDoc(profileDocRef, INITIAL_PROFILE);
      state.profile = INITIAL_PROFILE;
    } else {
      state.profile = profileSnap.data() as any;
      console.log("Loaded profile from Firestore:", state.profile.email);
    }

    // 3. Sync Social Posts
    const postsCol = collection(db, "posts");
    const postsSnap = await getDocs(postsCol);
    if (postsSnap.empty) {
      console.log(
        "Firestore 'posts' collection is empty. Seeding default posts...",
      );
      for (const post of socialPosts) {
        await setDoc(doc(db, "posts", post.id), post);
      }
    } else {
      socialPosts = postsSnap.docs.map((doc) => doc.data() as any);
      console.log(`Loaded ${socialPosts.length} social posts from Firestore.`);
    }

    // 4. Sync Notifications
    const notifsCol = collection(db, "notifications");
    const notifsSnap = await getDocs(notifsCol);
    if (notifsSnap.empty) {
      console.log(
        "Firestore 'notifications' collection is empty. Seeding default notifications...",
      );
      for (const notif of notifications) {
        await setDoc(doc(db, "notifications", notif.id), notif);
      }
    } else {
      notifications = notifsSnap.docs.map((doc) => doc.data() as any);
      console.log(
        `Loaded ${notifications.length} notifications from Firestore.`,
      );
    }

    console.log("Memory state fully synchronized with Firestore! 🚀");
  } catch (error) {
    console.error("Failed to synchronize with Firestore:", error);
  }
}

async function persistIssue(issue: any) {
  try {
    await setDoc(doc(db, "issues", issue.id), issue);
  } catch (err) {
    console.error("Failed to persist issue to Firestore:", err);
  }
}

async function deleteIssueFromFirestore(issueId: string) {
  try {
    await deleteDoc(doc(db, "issues", issueId));
  } catch (err) {
    console.error("Failed to delete issue from Firestore:", err);
  }
}

async function persistProfile(profile: any) {
  try {
    await setDoc(doc(db, "profiles", profile.email), profile);
  } catch (err) {
    console.error("Failed to persist profile to Firestore:", err);
  }
}

async function persistPost(post: any) {
  try {
    await setDoc(doc(db, "posts", post.id), post);
  } catch (err) {
    console.error("Failed to persist post to Firestore:", err);
  }
}

async function persistNotification(notif: any) {
  try {
    await setDoc(doc(db, "notifications", notif.id), notif);
  } catch (err) {
    console.error("Failed to persist notification to Firestore:", err);
  }
}

// API Endpoints

// 1. Get issues
app.get("/api/issues", (req, res) => {
  res.json(state.issues);
});

// 2. Get profile
app.get("/api/profile", (req, res) => {
  res.json(state.profile);
});

// 2a. Update profile
app.post("/api/profile", async (req, res) => {
  const { name, avatar } = req.body;
  if (name) state.profile.name = name;
  if (avatar) state.profile.avatar = avatar;
  await persistProfile(state.profile);
  res.json(state.profile);
});

// 2b. Get leaderboard
app.get("/api/leaderboard", (req, res) => {
  const leaderboard = [
    {
      name: "Sunitha Reddy",
      coins: 420,
      rankName: "Civic Champion",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
      reports: 3,
      verifications: 8,
    },
    {
      name: state.profile.name,
      coins: state.profile.coins,
      rankName: state.profile.rankName,
      avatar: state.profile.avatar,
      reports: state.profile.reportsCount,
      verifications: state.profile.verificationsCount,
      isCurrentUser: true,
    },
    {
      name: "Ramesh Kumar",
      coins: 280,
      rankName: "Panchayat Pillar",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      reports: 2,
      verifications: 6,
    },
    {
      name: "Priya Sharma",
      coins: 190,
      rankName: "Active Resident",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      reports: 1,
      verifications: 4,
    },
    {
      name: "Anil Reddy",
      coins: 150,
      rankName: "Active Resident",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      reports: 1,
      verifications: 2,
    },
  ];

  // Sort by coins descending
  leaderboard.sort((a, b) => b.coins - a.coins);
  res.json(leaderboard);
});

// 3. Upvote issue
app.post("/api/issues/:id/upvote", async (req, res) => {
  const { id } = req.params;
  const issue = state.issues.find((i) => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  if (issue.userUpvoted) {
    issue.upvotes -= 1;
    issue.userUpvoted = false;
  } else {
    issue.upvotes += 1;
    issue.userUpvoted = true;
    state.profile.coins += 10; // 10 coins for participating
  }
  issue.updatedAt = new Date().toISOString();
  await persistIssue(issue);
  await persistProfile(state.profile);
  res.json(issue);
});

// 4. Verify issue
app.post("/api/issues/:id/verify", async (req, res) => {
  const { id } = req.params;
  const issue = state.issues.find((i) => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  if (issue.userVerified) {
    issue.verifiedByCount -= 1;
    issue.userVerified = false;
    state.profile.verificationsCount = Math.max(
      0,
      state.profile.verificationsCount - 1,
    );
  } else {
    issue.verifiedByCount += 1;
    issue.userVerified = true;
    state.profile.verificationsCount += 1;
    state.profile.coins += 25; // 25 coins for active verification

    // Check for "Truth Seeker" badge
    if (
      state.profile.verificationsCount >= 10 &&
      !state.profile.badges.find((b) => b.id === "badge-4")
    ) {
      const badge = ALL_BADGES.find((b) => b.id === "badge-4");
      if (badge) {
        state.profile.badges.push({
          ...badge,
          unlockedAt: new Date().toISOString(),
        });
      }
    }
    // Check for "Civic Pillar" badge
    if (
      state.profile.verificationsCount >= 3 &&
      !state.profile.badges.find((b) => b.id === "badge-2")
    ) {
      const badge = ALL_BADGES.find((b) => b.id === "badge-2");
      if (badge) {
        state.profile.badges.push({
          ...badge,
          unlockedAt: new Date().toISOString(),
        });
      }
    }
  }

  // Auto transition to "VERIFIED" if votes reach threshold
  if (issue.status === "Submitted" && issue.verifiedByCount >= 5) {
    issue.status = "Verified";
    issue.timeline.push({
      status: "Verified",
      title: "Community Verified Active",
      description:
        "This issue has been formally verified by 5+ community members and is queueing for official assignment.",
      timestamp: new Date().toISOString(),
      actor: "Panchayat Automated Desk",
    });
  }

  issue.updatedAt = new Date().toISOString();
  await persistIssue(issue);
  await persistProfile(state.profile);
  res.json({ issue, profile: state.profile });
});

// 5. Flag issue
app.post("/api/issues/:id/flag", async (req, res) => {
  const { id } = req.params;
  const issue = state.issues.find((i) => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  if (issue.userFlagged) {
    issue.flagCount -= 1;
    issue.userFlagged = false;
  } else {
    issue.flagCount += 1;
    issue.userFlagged = true;
  }
  issue.updatedAt = new Date().toISOString();
  await persistIssue(issue);
  res.json(issue);
});

// 6. AI Categorize and Pre-Analyze Report Description (using Gemini 3.5 Flash)
app.post("/api/ai/categorize", async (req, res) => {
  const { description } = req.body;
  if (!description || description.trim() === "") {
    return res.status(400).json({ error: "Description is required" });
  }

  const prompt = `
  You are an expert civic engineering AI deployed in a local village government (Gram Panchayat) web portal called "Panchayat Online".
  Your job is to analyze the reported citizen concern and generate structured civic categorization metadata.

  Citizen issue description:
  "${description}"

  Please categorize this issue into one of these exact categories:
  - "Roads & Potholes"
  - "Water & Sanitation"
  - "Streetlights & Power"
  - "Waste & Garbage"
  - "Public Infrastructure"
  - "Other Community Issues"

  Assign an urgency level from: "Low", "Medium", "High", "Critical".
  Provide a concise, professional, title casing improvement of the title (Max 8 words).
  Determine the exact administrative department responsible for resolving it (e.g., Public Works Department (PWD), Sanitation Wing, Rural Water Supply, Gram Panchayat Electrical Division, etc.)
  Generate an 3-step administrative Action Plan for the Panchayat officers to quickly follow once assigned.
  
  You MUST return ONLY a JSON object with this exact structure:
  {
    "category": "exact category string",
    "urgency": "exact urgency string",
    "improvedTitle": "title string",
    "assignedDept": "department string",
    "actionPlan": ["step 1 string", "step 2 string", "step 3 string"],
    "summary": "a brief 2-sentence formal summary of why this is urgent or important"
  }
  `;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const responseText = response.text || "";
      const result = JSON.parse(responseText.trim());
      return res.json(result);
    } catch (err) {
      console.error("Gemini API Error:", err);
      // Fallback below
    }
  }

  // High-fidelity fallback heuristic matching
  console.log("Running local fallback categorization.");
  let category = "Other Community Issues";
  let urgency = "Medium";
  let assignedDept = "Panchayat General Administration";
  let improvedTitle = "Community Issue Report";
  let actionPlan = [
    "Verify the reported physical damage on-site.",
    "Draft a cost estimate for parts and labor.",
    "Allocate emergency funds and dispatch the technical repair team.",
  ];
  let summary =
    "A citizen has logged a public complaint. Reviewing physical reports and community upvotes to determine urgency.";

  const lowerDesc = description.toLowerCase();
  if (
    lowerDesc.includes("pothole") ||
    lowerDesc.includes("road") ||
    lowerDesc.includes("crack") ||
    lowerDesc.includes("street rep") ||
    lowerDesc.includes("cave")
  ) {
    category = "Roads & Potholes";
    urgency =
      lowerDesc.includes("accident") ||
      lowerDesc.includes("severe") ||
      lowerDesc.includes("danger")
        ? "High"
        : "Medium";
    assignedDept = "Public Works Department (PWD)";
    improvedTitle = "Road & Pothole Damage Verification";
    actionPlan = [
      "Deploy warning barricades and reflective signs on active road damage.",
      "Dispatch PWD road repairs team with ready stone-mix and hot tar supplies.",
      "Fill potholes and complete steam-roller flattening of top surface.",
    ];
    summary =
      "Report indicates significant road damage that poses high hazard to local motorists and school buses.";
  } else if (
    lowerDesc.includes("water") ||
    lowerDesc.includes("leak") ||
    lowerDesc.includes("drain") ||
    lowerDesc.includes("pipe") ||
    lowerDesc.includes("sewage")
  ) {
    category = "Water & Sanitation";
    urgency =
      lowerDesc.includes("burst") ||
      lowerDesc.includes("flood") ||
      lowerDesc.includes("waste")
        ? "Critical"
        : "High";
    assignedDept = "Rural Water Supply & Sanitation (RWSS)";
    improvedTitle = "Water Leakage & Drainage System Repair";
    actionPlan = [
      "Temporarily isolate the main distribution gate valve to arrest fresh water loss.",
      "Excavate and locate exact cracked PVC joint or ruptured iron pipeline section.",
      "Install replacement collars, re-engage supply pressure, and backfill soil.",
    ];
    summary =
      "Report warns of substantial drinking water loss or open sewage leakage. Requires immediate hydro-technical routing.";
  } else if (
    lowerDesc.includes("light") ||
    lowerDesc.includes("wire") ||
    lowerDesc.includes("electric") ||
    lowerDesc.includes("bulb") ||
    lowerDesc.includes("dark")
  ) {
    category = "Streetlights & Power";
    urgency =
      lowerDesc.includes("dark") ||
      lowerDesc.includes("women") ||
      lowerDesc.includes("safety")
        ? "High"
        : "Medium";
    assignedDept = "Gram Panchayat Electrical Wing";
    improvedTitle = "Streetlight Replacement & Cable Maintenance";
    actionPlan = [
      "Inspect the fuse junction box and overhead supply lines for safety trip triggers.",
      "Deploy electric lift utility crane vehicle to replace blown bulbs with energy-efficient LED fixtures.",
      "Check timer settings and restore uniform lighting coverage across the bypass/streets.",
    ];
    summary =
      "Streetlight failure reported, resulting in severe dark spots and safety concerns on local pathways.";
  } else if (
    lowerDesc.includes("garbage") ||
    lowerDesc.includes("waste") ||
    lowerDesc.includes("dump") ||
    lowerDesc.includes("smell") ||
    lowerDesc.includes("bin") ||
    lowerDesc.includes("trash")
  ) {
    category = "Waste & Garbage";
    urgency =
      lowerDesc.includes("school") ||
      lowerDesc.includes("hospital") ||
      lowerDesc.includes("rot")
        ? "High"
        : "Medium";
    assignedDept = "Sanitation & Solid Waste Management Wing";
    improvedTitle = "Urgent Garbage Clearance & Sanitation Clean";
    actionPlan = [
      "Dispatch a high-capacity garbage dumper and loaders to clear all loose waste piles.",
      "Disinfect the perimeter area with bleach/lime powder spray to deter pests and odors.",
      "Introduce daily tracking schedules and replacement of broken, open bins.",
    ];
    summary =
      "Illegal or overflowing garbage causing severe hygienic risks, foul smells, and pest threats to nearby areas.";
  } else if (
    lowerDesc.includes("park") ||
    lowerDesc.includes("bench") ||
    lowerDesc.includes("school") ||
    lowerDesc.includes("wall") ||
    lowerDesc.includes("bridge")
  ) {
    category = "Public Infrastructure";
    urgency = "Medium";
    assignedDept = "Rural Infrastructure Development Board";
    improvedTitle = "Public Property Restoration Project";
    actionPlan = [
      "Conduct a structural survey to gauge structural stability and immediate safety hazards.",
      "Request project materials budget from Panchayat Development Fund.",
      "Employ local skilled masonry/carpenters to carry out robust repairs.",
    ];
    summary =
      "Public infrastructure is damaged or requires structural renovation. Maintenance scheduled accordingly.";
  }

  res.json({
    category,
    urgency,
    improvedTitle,
    assignedDept,
    actionPlan,
    summary,
  });
});

// 6a. Voice-to-text Audio Transcription (using Gemini 3.5 Flash)
app.post("/api/ai/transcribe", async (req, res) => {
  const { audio, mimeType } = req.body;
  if (!audio) {
    return res.status(400).json({ error: "Audio data is required" });
  }

  if (ai) {
    try {
      const audioPart = {
        inlineData: {
          mimeType: mimeType || "audio/webm",
          data: audio,
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          audioPart,
          "You are an expert voice-to-text transcriber for a local village complaint web portal. Please transcribe the spoken audio into text as accurately as possible. Output ONLY the plain text transcription, with proper punctuation and grammar, and absolutely nothing else. Do not add any introductory/concluding remarks or explanations.",
        ],
      });

      const text = response.text || "";
      return res.json({ text: text.trim() });
    } catch (err) {
      console.error("Gemini Transcription Error:", err);
    }
  }

  // Fallback transcribing simulator
  console.log("Running local fallback voice-to-text transcription.");
  const fallbacks = [
    "There is a major pipeline leak near the Panchayat office water tank. The street is flooded and drinking water is being wasted.",
    "The streetlights on the Bypass Road are not working. It's completely dark and dangerous for commuters at night.",
    "There is a huge garbage pile behind the school that has not been cleared for days. Stray dogs are scattering waste everywhere.",
    "The primary road leading to the market area has developed several deep potholes which are causing traffic delays.",
  ];
  const randomFallback =
    fallbacks[Math.floor(Math.random() * fallbacks.length)];
  return res.json({ text: `[SIMULATED TRANSCRIPTION]: ${randomFallback}` });
});

// 7. Report New Issue
app.post("/api/issues", async (req, res) => {
  const {
    title,
    description,
    category,
    urgency,
    address,
    ward,
    image,
    video,
    isAnonymous,
    lat,
    lng,
    assignedDept,
  } = req.body;

  const sanitizedTitle = sanitizeString(title || "New Community Issue");
  const sanitizedDesc = sanitizeString(description || "");
  const sanitizedCategory = sanitizeString(
    category || "Other Community Issues",
  );
  const sanitizedUrgency = sanitizeString(urgency || "Medium");
  const sanitizedAddress = sanitizeString(
    address || "Panchayat Village Road, Nizamabad",
  );
  const sanitizedWard = sanitizeString(ward || "Ward 5 (General Area)");
  const sanitizedAssignedDept = sanitizeString(
    assignedDept || "Gram Panchayat Ward Team",
  );

  const isAnon = !!isAnonymous;
  let finalImage = image;

  if (ai && !video) {
    try {
      console.log("Generating cover photo for issue:", sanitizedTitle);
      const interaction = await ai.interactions.create({
        model: "gemini-3.1-flash-image",
        input: `A realistic, eye-level photograph of a civic issue in a rural Indian village. The issue is described as: ${sanitizedDesc}. Category: ${sanitizedCategory}. Ensure it looks like a photo taken by a citizen on a smartphone.`,
        response_modalities: ["image"],
        generation_config: {
          image_config: {
            aspect_ratio: "16:9",
            image_size: "1K",
          },
        },
      });

      for (const step of interaction.steps) {
        if (step.type === "model_output") {
          const imageContent = step.content?.find((c) => c.type === "image");
          if (imageContent && imageContent.data) {
            const base64EncodeString = imageContent.data;
            const mimeType = imageContent.mime_type || "image/jpeg";
            finalImage = `data:${mimeType};base64,${base64EncodeString}`;
          }
        }
      }
    } catch (err) {
      console.error("Failed to generate image via AI:", err);
    }
  }

  if (!finalImage) {
    finalImage =
      sanitizedCategory === "Roads & Potholes"
        ? "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80"
        : sanitizedCategory === "Water & Sanitation"
          ? "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80"
          : sanitizedCategory === "Streetlights & Power"
            ? "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=800&q=80"
            : sanitizedCategory === "Waste & Garbage"
              ? "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80"
              : sanitizedCategory === "Public Infrastructure"
                ? "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80"
                : "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80";
  }

  const newIssue = {
    id: `issue-${Date.now()}`,
    title: sanitizedTitle,
    description: sanitizedDesc,
    category: sanitizedCategory,
    status: "Submitted",
    urgency: sanitizedUrgency,
    location: {
      lat: lat || 17.43 + (Math.random() - 0.5) * 0.04,
      lng: lng || 78.45 + (Math.random() - 0.5) * 0.04,
      address: sanitizedAddress,
      ward: sanitizedWard,
    },
    reporter: isAnon
      ? {
          name: "Anonymous Citizen",
          avatar:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
          email: "anonymous@panchayat.gov.in",
        }
      : {
          name: state.profile.name,
          avatar: state.profile.avatar,
          email: state.profile.email,
        },
    isAnonymous: isAnon,
    video: video || null,
    upvotes: 1,
    userUpvoted: true,
    verifiedByCount: 0,
    flagCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    image: finalImage,
    assignedDept: sanitizedAssignedDept,
    officialRemarks: null,
    timeline: [
      {
        status: "Submitted",
        title: "Report Submitted Successfully",
        description: `Citizen raised report. Automatically assigned to ${sanitizedAssignedDept} department.`,
        timestamp: new Date().toISOString(),
        actor: isAnon ? "Anonymous Citizen" : state.profile.name,
      },
    ],
  };

  state.issues.unshift(newIssue);
  state.profile.reportsCount += 1;
  state.profile.coins += 50; // 50 coins for submitting an issue

  // Generate real-time Push + SMS multi-channel notification
  const notif = {
    id: `notif-${Date.now()}`,
    issueId: newIssue.id,
    title: "Complaint Logged 📝",
    message: `New report "${newIssue.title}" has been registered successfully in ${newIssue.location.ward}. [SMS Dispatched]`,
    channel: "Both",
    timestamp: new Date().toISOString(),
    phoneNumber: "+91 ••••• •8492",
    read: false,
  };
  notifications.unshift(notif);

  // Check for "Eagle Eye" badge
  if (
    state.profile.reportsCount >= 1 &&
    !state.profile.badges.find((b) => b.id === "badge-1")
  ) {
    const badge = ALL_BADGES.find((b) => b.id === "badge-1");
    if (badge) {
      state.profile.badges.push({
        ...badge,
        unlockedAt: new Date().toISOString(),
      });
    }
  }

  // Persist to Firestore
  await persistIssue(newIssue);
  await persistProfile(state.profile);
  await persistNotification(notif);

  // Check for "Panchayat Hero" if reports reach 5 (conceptually, though they must be resolved)
  res.json({ issue: newIssue, profile: state.profile });
});

// 7a. Update issue (CRUD Edit)
app.put("/api/issues/:id", async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    category,
    urgency,
    address,
    ward,
    image,
    isAnonymous,
    satisfactionRating,
    satisfactionFeedback,
  } = req.body;

  const issueIndex = state.issues.findIndex((i) => i.id === id);
  if (issueIndex === -1) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const issue = state.issues[issueIndex];

  // Update fields
  if (title) issue.title = sanitizeString(title);
  if (description !== undefined)
    issue.description = sanitizeString(description);
  if (category) issue.category = sanitizeString(category);
  if (urgency) issue.urgency = sanitizeString(urgency);
  if (address) issue.location.address = sanitizeString(address);
  if (ward) issue.location.ward = sanitizeString(ward);
  if (image) issue.image = image;
  if (satisfactionRating !== undefined)
    issue.satisfactionRating = Number(satisfactionRating);
  if (satisfactionFeedback !== undefined)
    issue.satisfactionFeedback = sanitizeString(satisfactionFeedback);
  if (isAnonymous !== undefined) {
    issue.isAnonymous = !!isAnonymous;
    if (issue.isAnonymous) {
      issue.reporter = {
        name: "Anonymous Citizen",
        avatar:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        email: "anonymous@panchayat.gov.in",
      };
    } else {
      issue.reporter = {
        name: state.profile.name,
        avatar: state.profile.avatar,
        email: state.profile.email,
      };
    }
  }

  issue.updatedAt = new Date().toISOString();

  // Add an edit event to timeline
  issue.timeline.push({
    status: issue.status,
    title: "Complaint Updated",
    description: "The reporter modified the complaint details for accuracy.",
    timestamp: new Date().toISOString(),
    actor: issue.isAnonymous ? "Anonymous Citizen" : state.profile.name,
  });

  // Persist to Firestore
  await persistIssue(issue);
  await persistProfile(state.profile);

  res.json({ issue, profile: state.profile, issues: state.issues });
});

// 7b. Delete issue (CRUD Delete)
app.delete("/api/issues/:id", async (req, res) => {
  const { id } = req.params;
  const issueIndex = state.issues.findIndex((i) => i.id === id);
  if (issueIndex === -1) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const issue = state.issues[issueIndex];

  // Remove issue
  state.issues.splice(issueIndex, 1);

  // Decrement report count if it matches the current user
  if (!issue.isAnonymous && issue.reporter.email === state.profile.email) {
    state.profile.reportsCount = Math.max(0, state.profile.reportsCount - 1);
  }

  // Delete from Firestore
  await deleteIssueFromFirestore(id);
  await persistProfile(state.profile);

  res.json({ success: true, profile: state.profile, issues: state.issues });
});

// 7b. Seed Nearby Issues around live GPS coordinates
app.post("/api/issues/seed-nearby", async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) {
    return res
      .status(400)
      .json({ error: "Latitude and Longitude are required for local seeding" });
  }

  // Check if we already have issues close to these coordinates (within ~5km / 0.05 degrees)
  const isClose = (l1: number, l2: number) => Math.abs(l1 - l2) < 0.05;
  const nearbyExists = state.issues.some(
    (issue) =>
      isClose(issue.location.lat, lat) && isClose(issue.location.lng, lng),
  );

  // If there are already issues nearby, return them to prevent flooding
  if (nearbyExists) {
    const nearby = state.issues.filter(
      (issue) =>
        isClose(issue.location.lat, lat) && isClose(issue.location.lng, lng),
    );
    return res.json({ success: true, seeded: false, issues: nearby });
  }

  // Generate 5 mock issues
  const categories = [
    {
      category: "Roads & Potholes",
      title: "Deep Hazardous Potholes on Intersection Road",
      desc: "Several wide, deep water-filled potholes have formed on this road segment. Vehicles are frequently swerving into oncoming traffic to avoid them, posing a severe accident risk.",
      urgency: "High",
      assignedDept: "Public Works Department (PWD)",
      image:
        "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80",
      offset: { lat: 0.0024, lng: 0.0018 },
    },
    {
      category: "Water & Sanitation",
      title: "Underground Pipe Rupture & Water Stagnation",
      desc: "Water is continuously bubbling up from beneath the street pavement, indicating a rupture in the clean water pipeline. It has created a muddy, stagnant pool and has reduced water pressure in adjacent homes.",
      urgency: "Critical",
      assignedDept: "Rural Water Supply & Sanitation (RWSS)",
      image:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80",
      offset: { lat: -0.0035, lng: 0.0041 },
    },
    {
      category: "Streetlights & Power",
      title: "Non-functional Streetlights Creating Dark Hazard Zone",
      desc: "Entire stretch of streetlights on this lane has been completely blacked out for the last 5 days. It makes walking at night highly unsafe, especially for women and children.",
      urgency: "Medium",
      assignedDept: "Electricity & Power Board",
      image:
        "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=800&q=80",
      offset: { lat: 0.0012, lng: -0.0036 },
    },
    {
      category: "Waste & Garbage",
      title: "Illegal Garbage Dumping & Stray Animal Gathering",
      desc: "A massive pile of uncollected plastic waste, food scraps, and organic debris has been dumped on the roadside. It is attracting stray dogs and cattle, and emitting a foul smell.",
      urgency: "High",
      assignedDept: "Waste & Sanitation Department",
      image:
        "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
      offset: { lat: -0.0045, lng: -0.0022 },
    },
    {
      category: "Public Infrastructure",
      title: "Cracked Boundary Wall & Broken Benches in Community Park",
      desc: "The brick boundary wall of the neighborhood park is showing structural cracking and leaning precariously. Several concrete benches are also chipped and broken, needing immediate civil restoration.",
      urgency: "Low",
      assignedDept: "Public Infrastructure Wing",
      image:
        "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80",
      offset: { lat: 0.0048, lng: -0.0015 },
    },
  ];

  const seededIssues = [];

  for (let i = 0; i < categories.length; i++) {
    const item = categories[i];
    const issueLat = lat + item.offset.lat;
    const issueLng = lng + item.offset.lng;

    const seededIssue = {
      id: `seeded-${Date.now()}-${i}`,
      title: item.title,
      description: item.desc,
      category: item.category,
      status: "Submitted",
      urgency: item.urgency,
      location: {
        lat: issueLat,
        lng: issueLng,
        address: `Near GPS Location, Live Civic Sector`,
        ward: "Ward Nearby (Your GPS Area)",
      },
      reporter: {
        name: "Local Citizen Agent",
        avatar:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        email: "citizen.agent@panchayat.gov.in",
      },
      isAnonymous: false,
      video: null,
      upvotes: Math.floor(Math.random() * 8) + 2,
      userUpvoted: false,
      verifiedByCount: Math.floor(Math.random() * 3),
      flagCount: 0,
      createdAt: new Date(Date.now() - i * 4 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - i * 4 * 60 * 60 * 1000).toISOString(),
      image: item.image,
      assignedDept: item.assignedDept,
      officialRemarks: null,
      timeline: [
        {
          status: "Submitted",
          title: "Nearby Report Registered",
          description: `Automatically compiled by Local GPS Geofence nearby indexing system.`,
          timestamp: new Date(
            Date.now() - i * 4 * 60 * 60 * 1000,
          ).toISOString(),
          actor: "Community Surveyor",
        },
      ],
    };

    state.issues.unshift(seededIssue);
    seededIssues.push(seededIssue);
    await persistIssue(seededIssue);
  }

  // Also push a system notification
  const scanNotif = {
    id: `notif-${Date.now()}`,
    title: "Nearby Issues Synced 📍",
    message: `Located 5 Panchayat concerns around your current GPS coordinates. Thank you for scanning.`,
    channel: "Push",
    timestamp: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(scanNotif);
  await persistNotification(scanNotif);

  res.json({ success: true, seeded: true, issues: seededIssues });
});

// 8. Update Issue (Panchayat Administrative Action)
app.post("/api/issues/:id/admin-update", async (req, res) => {
  const { id } = req.params;
  const {
    status,
    officialRemarks,
    assignedDept,
    resolutionImage,
    assignedStaff,
    dueDate,
    internalNotes,
    citizenReplies,
    isEscalated,
    escalationReason,
    beforeImage,
    beforeVideo,
    afterImage,
    afterVideo,
    satisfactionRating,
    satisfactionFeedback,
    isDuplicate,
    duplicateOfId,
    urgency,
  } = req.body;

  const issueIndex = state.issues.findIndex((i) => i.id === id);
  if (issueIndex === -1) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const issue = state.issues[issueIndex];
  const oldStatus = issue.status;

  if (status !== undefined) issue.status = status;
  if (officialRemarks !== undefined) issue.officialRemarks = officialRemarks;
  if (assignedDept !== undefined) issue.assignedDept = assignedDept;
  if (resolutionImage !== undefined) issue.resolutionImage = resolutionImage;

  if (assignedStaff !== undefined) issue.assignedStaff = assignedStaff;
  if (dueDate !== undefined) issue.dueDate = dueDate;
  if (internalNotes !== undefined) issue.internalNotes = internalNotes;
  if (citizenReplies !== undefined) issue.citizenReplies = citizenReplies;
  if (isEscalated !== undefined) issue.isEscalated = isEscalated;
  if (escalationReason !== undefined) issue.escalationReason = escalationReason;
  if (beforeImage !== undefined) issue.beforeImage = beforeImage;
  if (beforeVideo !== undefined) issue.beforeVideo = beforeVideo;
  if (afterImage !== undefined) issue.afterImage = afterImage;
  if (afterVideo !== undefined) issue.afterVideo = afterVideo;
  if (satisfactionRating !== undefined)
    issue.satisfactionRating = satisfactionRating;
  if (satisfactionFeedback !== undefined)
    issue.satisfactionFeedback = satisfactionFeedback;
  if (isDuplicate !== undefined) issue.isDuplicate = isDuplicate;
  if (duplicateOfId !== undefined) issue.duplicateOfId = duplicateOfId;
  if (urgency !== undefined) issue.urgency = urgency;

  issue.updatedAt = new Date().toISOString();

  // Add timeline entry
  if (status && status !== oldStatus) {
    issue.timeline.push({
      status: status,
      title: `Status updated to: ${status}`,
      description:
        officialRemarks ||
        `Panchayat administration marked this issue as ${status}.`,
      timestamp: new Date().toISOString(),
      actor: "Sarpanch Desk",
    });
  } else if (
    isEscalated &&
    !issue.timeline.some(
      (t) =>
        t.title.includes("Escalated") &&
        Date.now() - new Date(t.timestamp).getTime() < 5000,
    )
  ) {
    issue.timeline.push({
      status: issue.status,
      title: "Complaint Escalated ⚠️",
      description:
        escalationReason ||
        "This issue has been escalated due to SLA breach or critical emergency.",
      timestamp: new Date().toISOString(),
      actor: "Sarpanch Desk",
    });
  } else if (assignedStaff) {
    issue.timeline.push({
      status: issue.status,
      title: "Staff Assigned 👤",
      description: `Task assigned to ${assignedStaff} (${assignedDept || "General Wing"}) with deadline ${dueDate || "N/A"}.`,
      timestamp: new Date().toISOString(),
      actor: "Sarpanch Desk",
    });
  } else if (officialRemarks) {
    issue.timeline.push({
      status: issue.status,
      title: "Official Remarks Appended",
      description: officialRemarks,
      timestamp: new Date().toISOString(),
      actor: "Sarpanch Desk",
    });
  }

  // Generate multi-channel notification for citizen when status changes
  if (status && status !== oldStatus) {
    const adminNotif = {
      id: `notif-${Date.now()}`,
      issueId: issue.id,
      title: `Complaint Updated: ${status} ⚙️`,
      message: `Your complaint "${issue.title}" is now marked as ${status}. Remarks: ${officialRemarks || "Proceeding to next phase."} [SMS/Push Sent]`,
      channel: "Both",
      timestamp: new Date().toISOString(),
      phoneNumber: "+91 ••••• •8492",
      read: false,
    };
    notifications.unshift(adminNotif);
    await persistNotification(adminNotif);
  }

  await persistIssue(issue);

  res.json(issue);
});

// 9. Predict Community Risks & Preventative insights (using Gemini 3.5 Flash)
app.get("/api/ai/insights", async (req, res) => {
  const issuesSummary = state.issues.map((i) => ({
    id: i.id,
    category: i.category,
    status: i.status,
    urgency: i.urgency,
    ward: i.location.ward,
    date: i.createdAt,
  }));

  const prompt = `
  You are an advanced AI civic predictive model integrated into "Panchayat Online".
  Analyze the current list of village issues reported, identify correlations, patterns, and risks, and produce 3 forward-looking predictive maintenance/safety insights.
  For example, if multiple drainage leakages or water loggings are reported in Ward 1, predict monsoon overflow threats in Ward 1.
  If many streetlights are broken on Bypass, predict high risk of pedestrian safety or thefts in that sector.

  Current reported issues dataset:
  ${JSON.stringify(issuesSummary, null, 2)}

  Return EXACTLY 3 highly professional, distinct predictive alert objects in JSON format inside an array.
  Each object MUST follow this structure:
  {
    "id": "insight-unique-id",
    "title": "Clear catchy warning title (e.g., Ward 1 Monsoon Sewage Overflow Risk)",
    "description": "Full explanation of why this risk is predicted, linking current issue patterns to environmental or scheduling risks.",
    "type": "one of: 'weather', 'maintenance', 'safety'",
    "severity": "one of: 'low', 'medium', 'high'",
    "location": "Name of the target area or Ward",
    "eta": "Estimated Timeline (e.g. Next 7 Days, Mid-Monsoon, Immediate)",
    "probability": number (from 50 to 100 representing probability percentage)
  }

  Ensure that your response is ONLY a JSON array of those 3 objects. Do not include markdown code block characters or any other surrounding text.
  `;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const responseText = response.text || "";
      const result = JSON.parse(responseText.trim());
      return res.json(result);
    } catch (err) {
      console.error("Gemini Insights API Error:", err);
    }
  }

  // Realistic fallback analytics based on current state data
  const fallbackInsights = [
    {
      id: "insight-water",
      title:
        "High probability of Pipeline Silt Contamination & Pressure Failure",
      description:
        "Based on the severe main water rupture logged in Ward 1, soil particles are likely to enter supply pipelines during shut-off periods. Risk of minor silt contamination in neighboring households within 48 hours. Post-repair water testing is highly recommended.",
      type: "maintenance",
      severity: "high",
      location: "Ward 1 (Panchayat Center)",
      eta: "Next 48 Hours",
      probability: 88,
    },
    {
      id: "insight-safety",
      title: "Elevated Pedestrian Dark-Spot Risks & Theft Hazards on Bypass",
      description:
        "The consecutive failure of 4 streetlights on the Ward 4 Bypass Highway, combined with late-evening shift dispersals from neighboring shops, increases pedestrian accident risks and dark-spot vulnerability by 35% until power fixtures are replaced.",
      type: "safety",
      severity: "medium",
      location: "Ward 4 (Bypass East)",
      eta: "Immediate (Night Hours)",
      probability: 72,
    },
    {
      id: "insight-waste",
      title: "School Sanitation Hazard & Vector-Borne Breeding Risk",
      description:
        "The resolved school waste dump behind the Government High School has left residual damp organic materials. Without immediate chemical bleaching and lime-powder disinfection, regional mosquito larvae density is predicted to rise during monsoon dampness.",
      type: "weather",
      severity: "high",
      location: "Ward 3 (School District)",
      eta: "Next 5 Days",
      probability: 80,
    },
  ];

  res.json(fallbackInsights);
});

// 10. Get Social Posts
app.get("/api/posts", (req, res) => {
  res.json(socialPosts);
});

// 11. Create Social Post (supports hashtags, mentions, anonymous, video, location)
app.post("/api/posts", async (req, res) => {
  const { content, isAnonymous, image, video, location } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: "Post content cannot be empty" });
  }

  // Auto-parse hashtags (#hashtag) and mentions (@mention)
  const hashtagRegex = /#(\w+)/g;
  const mentionRegex = /@(\w+)/g;
  const hashtags: string[] = [];
  const mentions: string[] = [];

  let match;
  while ((match = hashtagRegex.exec(content)) !== null) {
    hashtags.push(match[1]);
  }
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  const isAnon = !!isAnonymous;
  const newPost = {
    id: `post-${Date.now()}`,
    content,
    author: isAnon
      ? {
          name: "Anonymous Citizen",
          avatar:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
          email: "anonymous@panchayat.gov.in",
        }
      : {
          name: state.profile.name,
          avatar: state.profile.avatar,
          email: state.profile.email,
        },
    isAnonymous: isAnon,
    location: location || null,
    image: image || null,
    video: video || null,
    hashtags,
    mentions,
    likes: 0,
    userLiked: false,
    comments: [],
    createdAt: new Date().toISOString(),
  };

  socialPosts.unshift(newPost);
  await persistPost(newPost);

  // Generate multi-channel notification for followers or tag mentions
  if (mentions.length > 0) {
    const mentionNotif = {
      id: `notif-${Date.now()}`,
      title: "Social Mention! 💬",
      message: `${newPost.author.name} mentioned you or your department in a new Social Hub post. [SMS Dispatched]`,
      channel: "Both",
      timestamp: new Date().toISOString(),
      phoneNumber: "+91 ••••• •8492",
      read: false,
    };
    notifications.unshift(mentionNotif);
    await persistNotification(mentionNotif);
  }

  res.json(newPost);
});

// 12. Toggle Like Social Post
app.post("/api/posts/:id/like", async (req, res) => {
  const { id } = req.params;
  const post = socialPosts.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  if (post.userLiked) {
    post.likes = Math.max(0, post.likes - 1);
    post.userLiked = false;
  } else {
    post.likes += 1;
    post.userLiked = true;
  }

  await persistPost(post);
  res.json(post);
});

// 13. Create Comment on Social Post
app.post("/api/posts/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { content, isAnonymous } = req.body;

  const post = socialPosts.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: "Comment content cannot be empty" });
  }

  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  const isAnon = !!isAnonymous;
  const newComment = {
    id: `comment-${Date.now()}`,
    postId: id,
    content,
    author: isAnon
      ? {
          name: "Anonymous Citizen",
          avatar:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
          email: "anonymous@panchayat.gov.in",
        }
      : {
          name: state.profile.name,
          avatar: state.profile.avatar,
          email: state.profile.email,
        },
    isAnonymous: isAnon,
    mentions,
    createdAt: new Date().toISOString(),
  };

  post.comments.push(newComment);
  await persistPost(post);

  // Notify original post author if someone else commented
  if (!isAnon && post.author.name !== state.profile.name) {
    const commentNotif = {
      id: `notif-${Date.now()}`,
      title: "New Comment on Post 💬",
      message: `${state.profile.name} commented on your post: "${content.substring(0, 30)}...".`,
      channel: "Push Notification",
      timestamp: new Date().toISOString(),
      read: false,
    };
    notifications.unshift(commentNotif);
    await persistNotification(commentNotif);
  }

  res.json(post);
});

// 14. Get Notifications (Push & SMS logs)
app.get("/api/notifications", (req, res) => {
  res.json(notifications);
});

// 15. Mark Notification as Read
app.post("/api/notifications/:id/read", async (req, res) => {
  const { id } = req.params;
  const notification = notifications.find((n) => n.id === id);
  if (notification) {
    notification.read = true;
    await persistNotification(notification);
  }
  res.json(notifications);
});

// Vite & Static assets mounting
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on port ${PORT}`);
    await syncFromFirestore();
  });
}

startServer();
