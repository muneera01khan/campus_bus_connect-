import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  FIELD_LIMITS,
  type BusRestrictedDetail,
  type BusRestrictedDetailInput,
  type BusSchedule,
  type BusScheduleInput,
} from '../types/campus';

function sanitizeText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function subscribeBusSchedules(
  onData: (buses: BusSchedule[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = 'buses';
  const q = query(
    collection(db, 'buses'),
    where('status', 'in', ['active', 'maintenance', 'inactive'])
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const buses: BusSchedule[] = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<BusSchedule, 'id'>),
        }))
        .sort((a, b) => a.busNumber.localeCompare(b.busNumber));
      onData(buses);
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

export async function fetchRestrictedBusDetail(busId: string): Promise<BusRestrictedDetail | null> {
  const path = `bus_details/${busId}`;
  try {
    const snap = await getDoc(doc(db, 'bus_details', busId));
    if (!snap.exists()) return null;
    return snap.data() as BusRestrictedDetail;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveBusRecord(params: {
  busId?: string;
  schedule: BusScheduleInput;
  detail: BusRestrictedDetailInput;
  updatedBy: string;
}): Promise<string> {
  const isNew = !params.busId;
  const busRef = params.busId ? doc(db, 'buses', params.busId) : doc(collection(db, 'buses'));
  const busId = busRef.id;
  const detailRef = doc(db, 'bus_details', busId);

  const busNumber = sanitizeText(params.schedule.busNumber, FIELD_LIMITS.BUS_NUMBER_MAX);
  const routeName = sanitizeText(params.schedule.routeName, FIELD_LIMITS.ROUTE_NAME_MAX);

  const scheduleFields = {
    busNumber,
    routeName,
    firstShiftEntry: sanitizeText(params.schedule.firstShiftEntry, FIELD_LIMITS.TIME_MAX),
    firstShiftExit: sanitizeText(params.schedule.firstShiftExit, FIELD_LIMITS.TIME_MAX),
    secondShiftEntry: sanitizeText(params.schedule.secondShiftEntry, FIELD_LIMITS.TIME_MAX),
    secondShiftExit: sanitizeText(params.schedule.secondShiftExit, FIELD_LIMITS.TIME_MAX),
    status: params.schedule.status,
    updatedBy: params.updatedBy,
    updatedAt: serverTimestamp(),
  };

  const rawCapacity = Number.parseInt(String(params.detail.seatingCapacity), 10);
  const seatingCapacity = Number.isFinite(rawCapacity)
    ? Math.min(FIELD_LIMITS.CAPACITY_MAX, Math.max(FIELD_LIMITS.CAPACITY_MIN, rawCapacity))
    : 40;

  const detailFields = {
    busId,
    busNumber,
    driverName: sanitizeText(params.detail.driverName, FIELD_LIMITS.DRIVER_NAME_MAX),
    driverContact: sanitizeText(params.detail.driverContact, FIELD_LIMITS.CONTACT_MAX),
    conductorName: sanitizeText(params.detail.conductorName, FIELD_LIMITS.DRIVER_NAME_MAX),
    conductorContact: sanitizeText(params.detail.conductorContact, FIELD_LIMITS.CONTACT_MAX),
    vehicleRegistration: sanitizeText(
      params.detail.vehicleRegistration,
      FIELD_LIMITS.REGISTRATION_MAX
    ),
    seatingCapacity,
    permitNumber: sanitizeText(params.detail.permitNumber, FIELD_LIMITS.PERMIT_MAX),
    insuranceExpiry: sanitizeText(params.detail.insuranceExpiry, FIELD_LIMITS.INSURANCE_MAX),
    emergencyContact: sanitizeText(params.detail.emergencyContact, FIELD_LIMITS.EMERGENCY_MAX),
    operationalNotes: sanitizeText(params.detail.operationalNotes, FIELD_LIMITS.NOTES_MAX),
    updatedBy: params.updatedBy,
    updatedAt: serverTimestamp(),
  };

  try {
    const batch = writeBatch(db);
    if (isNew) {
      batch.set(busRef, { ...scheduleFields, createdAt: serverTimestamp() });
      batch.set(detailRef, { ...detailFields, createdAt: serverTimestamp() });
    } else {
      batch.update(busRef, scheduleFields);
      const existingDetail = await getDoc(detailRef);
      if (existingDetail.exists()) {
        batch.update(detailRef, detailFields);
      } else {
        batch.set(detailRef, { ...detailFields, createdAt: serverTimestamp() });
      }
    }
    await batch.commit();
    return busId;
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, `buses/${busId}`);
  }
}

export async function updateBusShifts(params: {
  busId: string;
  firstShiftEntry: string;
  firstShiftExit: string;
  secondShiftEntry: string;
  secondShiftExit: string;
  updatedBy: string;
}): Promise<void> {
  const path = `buses/${params.busId}`;
  try {
    await updateDoc(doc(db, 'buses', params.busId), {
      firstShiftEntry: sanitizeText(params.firstShiftEntry, FIELD_LIMITS.TIME_MAX),
      firstShiftExit: sanitizeText(params.firstShiftExit, FIELD_LIMITS.TIME_MAX),
      secondShiftEntry: sanitizeText(params.secondShiftEntry, FIELD_LIMITS.TIME_MAX),
      secondShiftExit: sanitizeText(params.secondShiftExit, FIELD_LIMITS.TIME_MAX),
      updatedBy: params.updatedBy,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteBusRecord(busId: string): Promise<void> {
  const path = `buses/${busId}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'buses', busId));
    batch.delete(doc(db, 'bus_details', busId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
