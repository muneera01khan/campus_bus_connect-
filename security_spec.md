# CAMPUS BUS CONNECT — Security Specification & Threat Model

## 1. Data Invariants & Relationship Mapping
- **Master Identity Source**: `/users/{userId}` stores each authenticated user's verified email, UID, and system role (`student`, `faculty`, `hod`, `tdc`).
- **Pre-Assigned Roles**: `/role_assignments/{emailKey}` allows an HOD / Director to pre-assign privileged roles (`hod`, `tdc`) or departmental designations by lowercase email before first login.
- **Public Bus Schedules**: `/buses/{busId}` stores non-PII campus transit schedules (bus number, route name, stops, morning/afternoon shift timings, campus arrival/departure times). Readable by authenticated college users; writable strictly by `tdc` or `hod`.
- **Restricted Bus Details**: `/bus_details/{busId}` stores sensitive operational details (driver name & phone, conductor name & phone, vehicle registration, seating capacity, permit number, insurance expiry, emergency contact, operational notes). Must never be exposed to `student` accounts or unapproved (`pending`/`rejected`) `faculty` accounts. Readable strictly by `hod`, `tdc`, or `faculty` whose `/faculty_requests/{uid}` status is `'approved'`. Writable strictly by `tdc` or `hod` and requires parent `/buses/{busId}` to exist on creation.
- **Faculty Access Requests**: `/faculty_requests/{facultyUid}` tracks access requests submitted by `faculty` users. Faculty can only create a `'pending'` request for their own UID (and resubmit only if previously `'rejected'`). Only `hod` can transition status to `'approved'` or `'rejected'`.

## 2. "Dirty Dozen" Adversarial Payloads (Must Return `PERMISSION_DENIED`)
1. **Self-Assigned HOD Privilege Escalation on Registration**: Student creates `/users/{uid}` with `role: "hod"` without bootstrapped email or `/role_assignments` entry.
2. **Self-Assigned TDC Role Escalation on Update**: Authenticated student updates `/users/{uid}` changing `role` from `"student"` to `"tdc"`.
3. **Student Reading Restricted Bus Details (`get`)**: User with `role: "student"` calls `getDoc(doc(db, "bus_details", "bus-101"))`.
4. **Student Listing Restricted Bus Details (`list`)**: User with `role: "student"` calls `getDocs(collection(db, "bus_details"))`.
5. **Unapproved Faculty Reading Restricted Bus Details**: Faculty with `status: "pending"` or `"rejected"` reads `/bus_details/bus-101`.
6. **Faculty Self-Approval on Request Create**: Faculty creates `/faculty_requests/{uid}` with `status: "approved"`.
7. **Faculty Self-Approval on Request Update**: Faculty updates `/faculty_requests/{uid}` from `status: "pending"` to `status: "approved"`.
8. **Faculty Updating Another User's Request**: Faculty A attempts to update `/faculty_requests/{facultyBUid}`.
9. **Student Creating or Modifying a Bus Schedule**: Student attempts `setDoc` or `updateDoc` on `/buses/bus-101`.
10. **Shadow Field / Ghost Property Injection**: TDC sends `{ ...validBus, isVerified: true }` on `/buses/bus-101` create or update.
11. **Oversized String / Resource Poisoning**: TDC submits a 5,000-character `routeName` or 200-character document ID on `/buses/{busId}`.
12. **Unverified Email / Spoofed Timestamp**: Client submits `createdAt: Timestamp.fromDate(new Date(0))` instead of `serverTimestamp()`, or writes with `email_verified: false`.

## 3. Verification Plan
- Lint `DRAFT_firestore.rules` and `firestore.rules` with `@firebase/eslint-plugin-security-rules`.
- Maintain unit test definitions in `firestore.rules.test.ts` validating all 12 adversarial cases.
- Deploy final `firestore.rules` via `DeployRules` RPC.
