# Panchayat Online - Hackathon Submission

**Problem Statement Selected:** Community Hero - Hyperlocal Problem Solver

## Background
Communities frequently face issues such as potholes, water leakages, damaged streetlights, waste management concerns, and public infrastructure challenges. Reporting these issues is often fragmented, difficult to track, and lacks transparency.

## Challenge
Build a platform that enables citizens to identify, report, validate, track, and resolve community issues through collaboration, data, and intelligent automation. The solution should encourage transparency, accountability, and community participation.

## Detailed Solution Overview (Panchayat Online)
Panchayat Online is a hyper-local, AI-driven civic engagement platform built specifically to bridge the communication gap between citizens and local governance (Panchayats and municipalities). It centralizes the entire lifecycle of a community issue—from the moment a citizen spots a pothole or water leak, to the moment it is verified, assigned, and resolved by administrators.

By leveraging artificial intelligence and gamification, the platform removes friction from the reporting process. Citizens can use voice or text to explain a problem, while AI automatically categorizes the issue and generates contextual visualizations. To combat civic apathy, the platform introduces "Impact Ranks" and reward coins, incentivizing users to verify others' claims and actively participate in their neighborhood's upkeep. Administrators receive a prioritized, deduplicated feed of community issues, complete with predictive insights on potential future hazards.

## Detailed Key Features
1. **AI-Powered Audio Reporting:** Citizens can report issues using voice. The platform uses AI to transcribe audio into text, instantly extracting the core problem without requiring manual typing.
2. **Automated Categorization & Structuring:** AI analyzes the unstructured description and automatically assigns the correct civic category (e.g., Infrastructure, Water, Electricity) for efficient routing to the right department.
3. **AI Cover Image Generation:** If a user cannot provide a photo safely, the platform uses AI image generation to create a highly accurate, photorealistic representation of the issue based on the description, providing immediate visual context to administrators.
4. **Predictive Civic Insights:** An AI hazard-analysis module predicts secondary risks (e.g., predicting mosquito outbreaks from reported stagnant water) to help officers prioritize preventative measures.
5. **Gamification & Social Verification:** The platform prevents spam through a community verification system. Citizens earn "Coins" and level up their "Impact Rank" by reporting genuine issues and verifying/upvoting issues reported by neighbors.
6. **Interactive Live Map:** A geospatial visualization of all active reports, allowing citizens and admins to spot clusters of infrastructure failures in specific wards.
7. **Dual-Portal System:** Seamlessly integrated views for both Citizens (to track their reports) and Panchayat Officers (a centralized dashboard to update statuses to 'In Progress' or 'Resolved').

## Detailed Technologies Used
* **Frontend Ecosystem:** React.js 18, Vite, TypeScript, Tailwind CSS (for utility-first, responsive design), Lucide React (for iconography), Recharts (for civic data visualization).
* **Backend Server:** Node.js with Express.js handling secure API routing, rate limiting, and business logic.
* **Database & State Management:** Firebase Firestore (NoSQL) for real-time, durable cloud persistence. Ensures that when an admin updates a status, citizens see it instantly.
* **Deployment & Architecture:** Containerized full-stack application running on Google Cloud Run.

## Detailed Google Technologies Utilized
* **Google Gemini API (via @google/genai SDK):**
  * **gemini-3.5-flash:** Powers the Natural Language Processing (NLP) pipeline. Used specifically for:
    * *Audio Transcription:* Converting citizen voice reports to text.
    * *Semantic Categorization:* Extracting categories and urgency from raw text.
    * *Predictive Insights Engine:* Analyzing historical/current data to warn about systemic neighborhood risks.
  * **gemini-3.1-flash-image:** Powers the visual context engine. Used to generate synthetic, realistic representations of reported civic issues when user-uploaded photos are unavailable.
* **Firebase / Google Cloud:**
  * **Firestore Database:** The primary data backbone of the application. It stores the entire civic schema (Users, Issues, Votes, Comments) providing high availability and real-time syncing across the community.
