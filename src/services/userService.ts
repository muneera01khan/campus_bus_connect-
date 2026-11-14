import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  FIELD_LIMITS,
  type RoleAssignment,
  type UserProfile,
  type UserRole,
} from '../types/campus';

export const BOOTSTRAPPED_DIRECTOR_EMAIL = 'muneerakhan251416@acropolis.in';

function sanitizeText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      onData(snapshot.data() as UserProfile);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function getPreassignedRole(email: string): Promise<RoleAssignment | null> {
  const emailKey = email.trim().toLowerCase();
  const path = `role_assignments/${emailKey}`;
  try {
    const snap = await getDoc(doc(db, 'role_assignments', emailKey));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<RoleAssignment, 'id'>) };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createUserProfile(params: {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department: string;
  identifier: string;
}): Promise<void> {
  const path = `users/${params.uid}`;
  const payload = {
    uid: params.uid,
    email: sanitizeText(params.email, FIELD_LIMITS.EMAIL_MAX),
    displayName: sanitizeText(params.displayName, FIELD_LIMITS.DISPLAY_NAME_MAX) || 'Campus User',
    role: params.role,
    department: sanitizeText(params.department, FIELD_LIMITS.DEPARTMENT_MAX),
    identifier: sanitizeText(params.identifier, FIELD_LIMITS.IDENTIFIER_MAX),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'users', params.uid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      role,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeAllUsers(
  onData: (users: UserProfile[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = 'users';
  const q = query(collection(db, 'users'), orderBy('displayName', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: UserProfile[] = snapshot.docs.map((d) => d.data() as UserProfile);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeRoleAssignments(
  onData: (assignments: RoleAssignment[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = 'role_assignments';
  const q = query(collection(db, 'role_assignments'), orderBy('email', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: RoleAssignment[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<RoleAssignment, 'id'>),
      }));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function saveRoleAssignment(params: {
  email: string;
  role: UserRole;
  department: string;
  assignedBy: string;
}): Promise<void> {
  const emailKey = sanitizeText(params.email.toLowerCase(), FIELD_LIMITS.EMAIL_MAX);
  const path = `role_assignments/${emailKey}`;
  try {
    const existing = await getDoc(doc(db, 'role_assignments', emailKey));
    if (existing.exists()) {
      await updateDoc(doc(db, 'role_assignments', emailKey), {
        role: params.role,
        department: sanitizeText(params.department, FIELD_LIMITS.DEPARTMENT_MAX),
        assignedBy: params.assignedBy,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'role_assignments', emailKey), {
        email: emailKey,
        role: params.role,
        department: sanitizeText(params.department, FIELD_LIMITS.DEPARTMENT_MAX),
        assignedBy: params.assignedBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteRoleAssignment(emailKey: string): Promise<void> {
  const path = `role_assignments/${emailKey}`;
  try {
    await deleteDoc(doc(db, 'role_assignments', emailKey));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
