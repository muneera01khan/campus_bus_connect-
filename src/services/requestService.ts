import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { FIELD_LIMITS, type FacultyAccessRequest } from '../types/campus';

function sanitizeText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function subscribeMyFacultyRequest(
  uid: string,
  onData: (request: FacultyAccessRequest | null) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = `faculty_requests/${uid}`;
  return onSnapshot(
    doc(db, 'faculty_requests', uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      onData(snapshot.data() as FacultyAccessRequest);
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

export function subscribeAllFacultyRequests(
  onData: (requests: FacultyAccessRequest[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = 'faculty_requests';
  const q = query(collection(db, 'faculty_requests'), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: FacultyAccessRequest[] = snapshot.docs.map(
        (d) => d.data() as FacultyAccessRequest
      );
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

export async function submitFacultyRequest(params: {
  facultyUid: string;
  facultyName: string;
  facultyEmail: string;
  department: string;
  employeeId: string;
  reason: string;
  isResubmit: boolean;
}): Promise<void> {
  const path = `faculty_requests/${params.facultyUid}`;
  const cleanName = sanitizeText(params.facultyName, FIELD_LIMITS.DISPLAY_NAME_MAX);
  const cleanDept = sanitizeText(params.department, FIELD_LIMITS.DEPARTMENT_MAX);
  const cleanEmpId = sanitizeText(params.employeeId, FIELD_LIMITS.IDENTIFIER_MAX);
  const cleanReason = sanitizeText(params.reason, FIELD_LIMITS.REASON_MAX);

  try {
    if (params.isResubmit) {
      await updateDoc(doc(db, 'faculty_requests', params.facultyUid), {
        facultyName: cleanName,
        department: cleanDept,
        employeeId: cleanEmpId,
        reason: cleanReason,
        status: 'pending',
        reviewedBy: '',
        reviewerName: '',
        reviewNote: '',
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'faculty_requests', params.facultyUid), {
        facultyUid: params.facultyUid,
        facultyName: cleanName,
        facultyEmail: sanitizeText(params.facultyEmail, FIELD_LIMITS.EMAIL_MAX),
        department: cleanDept,
        employeeId: cleanEmpId,
        reason: cleanReason,
        status: 'pending',
        reviewedBy: '',
        reviewerName: '',
        reviewNote: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      params.isResubmit ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function reviewFacultyRequest(params: {
  facultyUid: string;
  decision: 'approved' | 'rejected';
  reviewerUid: string;
  reviewerName: string;
  reviewNote: string;
}): Promise<void> {
  const path = `faculty_requests/${params.facultyUid}`;
  try {
    await updateDoc(doc(db, 'faculty_requests', params.facultyUid), {
      status: params.decision,
      reviewedBy: params.reviewerUid,
      reviewerName: sanitizeText(params.reviewerName, FIELD_LIMITS.DISPLAY_NAME_MAX) || 'HOD / Director',
      reviewNote: sanitizeText(params.reviewNote, FIELD_LIMITS.REVIEW_NOTE_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
