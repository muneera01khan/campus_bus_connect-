/**
 * CAMPUS BUS CONNECT — Dirty Dozen Adversarial Security Test Matrix
 * Documents and verifies payload boundaries enforced by firestore.rules.
 */

export interface AdversarialTestCase {
  id: string;
  name: string;
  actorRole: 'student' | 'faculty_pending' | 'faculty_rejected' | 'tdc' | 'unverified';
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  targetPath: string;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
  enforcingGate: string;
}

export const DIRTY_DOZEN_CASES: AdversarialTestCase[] = [
  {
    id: 'DD-01',
    name: 'Self-Assigned Privileged Role Escalation on Registration',
    actorRole: 'student',
    operation: 'create',
    targetPath: '/users/student_uid_1',
    payload: {
      uid: 'student_uid_1',
      email: 'student1@college.edu',
      displayName: 'Student One',
      role: 'hod',
      department: 'CSE',
      identifier: 'CS-101',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: "incoming().role == 'student' || hasValidPreassignedRole(incoming().role) || (isAdminDoc() && incoming().role == 'hod')",
  },
  {
    id: 'DD-02',
    name: 'Self-Assigned Faculty/TDC Escalation on Update',
    actorRole: 'student',
    operation: 'update',
    targetPath: '/users/student_uid_1',
    payload: { role: 'tdc' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'incoming().role == existing().role for non-HOD self-updates',
  },
  {
    id: 'DD-03',
    name: 'Student Reading Restricted Bus Details (get)',
    actorRole: 'student',
    operation: 'get',
    targetPath: '/bus_details/bus_101',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'canViewRestrictedBusDetails() requires tdc, hod, or approved faculty',
  },
  {
    id: 'DD-04',
    name: 'Student Listing Restricted Bus Details (list)',
    actorRole: 'student',
    operation: 'list',
    targetPath: '/bus_details',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'allow list: if false on /bus_details/{busId}',
  },
  {
    id: 'DD-05',
    name: 'Pending Faculty Reading Restricted Bus Details',
    actorRole: 'faculty_pending',
    operation: 'get',
    targetPath: '/bus_details/bus_101',
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: "isApprovedFaculty() checks status == 'approved' in /faculty_requests/{uid}",
  },
  {
    id: 'DD-06',
    name: 'Faculty Self-Approval on Request Create',
    actorRole: 'faculty_pending',
    operation: 'create',
    targetPath: '/faculty_requests/faculty_uid_1',
    payload: {
      facultyUid: 'faculty_uid_1',
      status: 'approved',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: "incoming().status == 'pending' on create",
  },
  {
    id: 'DD-07',
    name: 'Faculty Self-Approval on Request Update',
    actorRole: 'faculty_pending',
    operation: 'update',
    targetPath: '/faculty_requests/faculty_uid_1',
    payload: { status: 'approved' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'Only isHod() may set status in [approved, rejected]',
  },
  {
    id: 'DD-08',
    name: 'Faculty Modifying Peer Request',
    actorRole: 'faculty_rejected',
    operation: 'update',
    targetPath: '/faculty_requests/faculty_uid_2',
    payload: { reason: 'Hijacked' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'request.auth.uid == facultyUid',
  },
  {
    id: 'DD-09',
    name: 'Student Modifying Bus Schedule',
    actorRole: 'student',
    operation: 'update',
    targetPath: '/buses/bus_101',
    payload: { firstShiftEntry: '09:00 AM' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'isTdcOrHod() required for write on /buses/{busId}',
  },
  {
    id: 'DD-10',
    name: 'Shadow Ghost Field Injection on Bus Create',
    actorRole: 'tdc',
    operation: 'create',
    targetPath: '/buses/bus_102',
    payload: {
      busNumber: 'BUS-102',
      isVerified: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'isValidBusSchedule() enforces keys().hasOnly([...])',
  },
  {
    id: 'DD-11',
    name: 'Oversized Route Name / ID Poisoning',
    actorRole: 'tdc',
    operation: 'create',
    targetPath: `/buses/${'a'.repeat(200)}`,
    payload: { routeName: 'X'.repeat(5000) },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'isValidId(busId) <= 128 chars && data.routeName.size() <= 120',
  },
  {
    id: 'DD-12',
    name: 'Spoofed Client Timestamp or Unverified Email',
    actorRole: 'unverified',
    operation: 'create',
    targetPath: '/buses/bus_103',
    payload: { createdAt: '1970-01-01T00:00:00Z' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'isEmailVerified() && incoming().createdAt == request.time',
  },
  {
    id: 'DD-13',
    name: 'Self-Assigned Faculty Escalation Without Admin Role Assignment',
    actorRole: 'student',
    operation: 'create',
    targetPath: '/users/student_uid_2',
    payload: {
      uid: 'student_uid_2',
      email: 'newuser@college.edu',
      displayName: 'New User',
      role: 'faculty',
      department: 'IT',
      identifier: 'FAC-999',
    },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'faculty role on create requires verified /role_assignments/{email} entry',
  },
  {
    id: 'DD-14',
    name: 'Client Attempting to Write /admins Allowlist',
    actorRole: 'student',
    operation: 'create',
    targetPath: '/admins/student_uid_1',
    payload: { uid: 'student_uid_1' },
    expectedOutcome: 'PERMISSION_DENIED',
    enforcingGate: 'allow write: if false on /admins/{adminUid}',
  },
];
