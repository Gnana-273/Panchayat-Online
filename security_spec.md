# Security Specification for Panchayat Online Firestore Rules

This document outlines the zero-trust security specification, data invariants, adversarial threat payloads, and automated test suite rules designed to protect the Gram Panchayat data from privilege escalation, data tempering, and Denial of Wallet attacks.

## 1. Data Invariants

- **Citizen Identity Integrity**: A user can only write, update, or read private fields in their own `CitizenProfile` document (`/profiles/{email}`). They cannot modify other users' coins, rank, or badge achievements directly.
- **Complaint Authorship**: Only the registered reporter of a `CommunityIssue` can edit its details (title, description, category, urgency) or delete/retract it. No user can edit someone else's complaint.
- **Status Lifecycle Control**: Only authorized officers (administrators) can update the state/status of a complaint (e.g., changing from `Submitted` to `In Progress` or `Resolved`). Standard citizens cannot bypass this.
- **Id Poisoning Guard**: Document IDs must be validated string types matching strict regex `^[a-zA-Z0-9_\-]+$` and restricted to standard size constraints to block resource exhaustion attacks.
- **Audit Trails**: All timestamp fields (`createdAt`, `updatedAt`) must be set strictly equal to the server's request time (`request.time`) to maintain audit transparency.

## 2. The "Dirty Dozen" Payloads

The following adversarial payloads must be strictly rejected (returning `PERMISSION_DENIED`):

1. **Self-Awarded Coins**: An authenticated user attempting to write a profile document with 999,999 coins.
2. **Badge Spoofing**: An authenticated user trying to insert a hardcoded list of premium administrative badges into their profile.
3. **Identity Impersonation (Reporter Spoof)**: User `A` submitting an issue where the reporter block claims to be user `B`.
4. **Complaint Tampering**: User `A` trying to modify the description of an issue reported by User `B`.
5. **Unauthorized Status Bypass**: A citizen trying to set an issue's status directly to `Resolved` without administrator review.
6. **Self-Appointed Administrator (Role Escalation)**: A regular citizen attempting to write to `/admins/` or creating an admin document for themselves.
7. **Relational Orphan Creation**: Reporting a community issue targeting a non-existent category or with an invalid ward structure.
8. **ID character poisoning**: Injecting special characters or high-byte payloads into the `{issueId}` path variable to provoke search indices.
9. **Duplicate Upvotes / Upvote Spoofing**: Artificially setting upvote count on an issue without being part of the `upvotedBy` list.
10. **Malicious Delete**: A regular user deleting a community issue reported by someone else.
11. **Shadow Update / Extra fields injection**: Editing an issue and passing extra fields like `isApprovedByPanchayat: true`.
12. **PII Leakage Query**: Attempting a collection group query or blanket read to fetch other citizens' email address profiles.

## 3. The Test Runner (`firestore.rules.test.ts`)

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "orbital-booth-k5jvd",
    firestore: {
      rules: require("fs").readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("Panchayat Online Firestore Security Tests", () => {
  it("should block self-awarded coins (Dirty Dozen #1)", async () => {
    const aliceDb = testEnv.authenticatedContext("alice", { email: "alice@village.in" }).firestore();
    const docRef = doc(aliceDb, "profiles", "alice@village.in");
    await assertFails(setDoc(docRef, {
      email: "alice@village.in",
      name: "Alice",
      avatar: "https://example.com/avatar.png",
      coins: 999999, // Hack!
      reportsCount: 0,
      verificationsCount: 0,
      rankName: "Village Rookie",
      badges: []
    }));
  });

  it("should allow editing of your own profile with safe values", async () => {
    const aliceDb = testEnv.authenticatedContext("alice", { email: "alice@village.in" }).firestore();
    const docRef = doc(aliceDb, "profiles", "alice@village.in");
    await assertSucceeds(setDoc(docRef, {
      email: "alice@village.in",
      name: "Alice",
      avatar: "https://example.com/avatar.png",
      coins: 0,
      reportsCount: 0,
      verificationsCount: 0,
      rankName: "Village Rookie",
      badges: []
    }));
  });
});
```
