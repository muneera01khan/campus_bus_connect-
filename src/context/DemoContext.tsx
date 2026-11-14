import React, { createContext, useContext, useState } from 'react';
import {
  DEMO_PROFILES,
  INITIAL_DEMO_BUSES,
  INITIAL_DEMO_BUS_DETAILS,
  INITIAL_DEMO_REQUESTS,
} from '../data/demoData';
import type {
  BusRestrictedDetail,
  BusRestrictedDetailInput,
  BusSchedule,
  BusScheduleInput,
  FacultyAccessRequest,
  UserProfile,
  UserRole,
} from '../types/campus';

interface DemoContextValue {
  isDemoMode: boolean;
  demoRole: UserRole;
  demoProfile: UserProfile;
  demoBuses: BusSchedule[];
  demoBusDetails: Record<string, BusRestrictedDetail>;
  demoRequests: FacultyAccessRequest[];
  demoMyRequest: FacultyAccessRequest | null;
  demoUsers: UserProfile[];
  enterDemoMode: (initialRole?: UserRole) => void;
  exitDemoMode: () => void;
  setDemoRole: (role: UserRole) => void;
  resetDemoData: () => void;
  saveDemoBus: (params: {
    busId?: string;
    schedule: BusScheduleInput;
    detail: BusRestrictedDetailInput;
    updatedBy: string;
  }) => string;
  updateDemoBusShifts: (params: {
    busId: string;
    firstShiftEntry: string;
    firstShiftExit: string;
    secondShiftEntry: string;
    secondShiftExit: string;
    updatedBy: string;
  }) => void;
  deleteDemoBus: (busId: string) => void;
  submitDemoFacultyRequest: (params: {
    facultyUid: string;
    facultyName: string;
    facultyEmail: string;
    department: string;
    employeeId: string;
    reason: string;
  }) => void;
  reviewDemoFacultyRequest: (params: {
    facultyUid: string;
    decision: 'approved' | 'rejected';
    reviewerUid: string;
    reviewerName: string;
    reviewNote: string;
  }) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState<UserRole>('student');
  const [demoBuses, setDemoBuses] = useState<BusSchedule[]>(() =>
    INITIAL_DEMO_BUSES.map((b) => ({ ...b }))
  );
  const [demoBusDetails, setDemoBusDetails] = useState<Record<string, BusRestrictedDetail>>(() => ({
    ...INITIAL_DEMO_BUS_DETAILS,
  }));
  const [demoRequests, setDemoRequests] = useState<FacultyAccessRequest[]>(() => [
    ...INITIAL_DEMO_REQUESTS,
  ]);

  const demoProfile = DEMO_PROFILES[demoRole];
  const demoUsers = Object.values(DEMO_PROFILES);
  const demoMyRequest =
    demoRequests.find((r) => r.facultyUid === DEMO_PROFILES.faculty.uid) ?? null;

  const enterDemoMode = (initialRole: UserRole = 'student') => {
    setDemoRole(initialRole);
    setIsDemoMode(true);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
  };

  const resetDemoData = () => {
    setDemoBuses(INITIAL_DEMO_BUSES.map((b) => ({ ...b })));
    setDemoBusDetails({ ...INITIAL_DEMO_BUS_DETAILS });
    setDemoRequests([...INITIAL_DEMO_REQUESTS]);
  };

  const saveDemoBus = (params: {
    busId?: string;
    schedule: BusScheduleInput;
    detail: BusRestrictedDetailInput;
    updatedBy: string;
  }): string => {
    const id = params.busId ?? `demo-bus-${Date.now()}`;
    const busNumber = params.schedule.busNumber.trim();
    const nextBus: BusSchedule = {
      id,
      busNumber,
      routeName: params.schedule.routeName.trim(),
      firstShiftEntry: params.schedule.firstShiftEntry.trim(),
      firstShiftExit: params.schedule.firstShiftExit.trim(),
      secondShiftEntry: params.schedule.secondShiftEntry.trim(),
      secondShiftExit: params.schedule.secondShiftExit.trim(),
      status: params.schedule.status,
      updatedBy: params.updatedBy,
      isDemo: true,
    };

    const nextDetail: BusRestrictedDetail = {
      busId: id,
      busNumber,
      driverName: params.detail.driverName.trim(),
      driverContact: params.detail.driverContact.trim(),
      conductorName: params.detail.conductorName.trim(),
      conductorContact: params.detail.conductorContact.trim(),
      vehicleRegistration: params.detail.vehicleRegistration.trim(),
      seatingCapacity: Number.parseInt(String(params.detail.seatingCapacity), 10) || 40,
      permitNumber: params.detail.permitNumber.trim(),
      insuranceExpiry: params.detail.insuranceExpiry.trim(),
      emergencyContact: params.detail.emergencyContact.trim(),
      operationalNotes: params.detail.operationalNotes.trim(),
      updatedBy: params.updatedBy,
    };

    setDemoBuses((prev) => {
      const exists = prev.some((b) => b.id === id);
      const updated = exists ? prev.map((b) => (b.id === id ? nextBus : b)) : [...prev, nextBus];
      return updated.sort((a, b) => a.busNumber.localeCompare(b.busNumber));
    });
    setDemoBusDetails((prev) => ({ ...prev, [id]: nextDetail }));
    return id;
  };

  const updateDemoBusShifts = (params: {
    busId: string;
    firstShiftEntry: string;
    firstShiftExit: string;
    secondShiftEntry: string;
    secondShiftExit: string;
    updatedBy: string;
  }) => {
    setDemoBuses((prev) =>
      prev.map((bus) =>
        bus.id === params.busId
          ? {
              ...bus,
              firstShiftEntry: params.firstShiftEntry.trim(),
              firstShiftExit: params.firstShiftExit.trim(),
              secondShiftEntry: params.secondShiftEntry.trim(),
              secondShiftExit: params.secondShiftExit.trim(),
              updatedBy: params.updatedBy,
            }
          : bus
      )
    );
  };

  const deleteDemoBus = (busId: string) => {
    setDemoBuses((prev) => prev.filter((b) => b.id !== busId));
    setDemoBusDetails((prev) => {
      const next = { ...prev };
      delete next[busId];
      return next;
    });
  };

  const submitDemoFacultyRequest = (params: {
    facultyUid: string;
    facultyName: string;
    facultyEmail: string;
    department: string;
    employeeId: string;
    reason: string;
  }) => {
    const nextRequest: FacultyAccessRequest = {
      facultyUid: params.facultyUid,
      facultyName: params.facultyName.trim(),
      facultyEmail: params.facultyEmail.trim(),
      department: params.department.trim(),
      employeeId: params.employeeId.trim(),
      reason: params.reason.trim(),
      status: 'pending',
      reviewedBy: '',
      reviewerName: '',
      reviewNote: '',
    };

    setDemoRequests((prev) => {
      const exists = prev.some((r) => r.facultyUid === params.facultyUid);
      return exists
        ? prev.map((r) => (r.facultyUid === params.facultyUid ? nextRequest : r))
        : [nextRequest, ...prev];
    });
  };

  const reviewDemoFacultyRequest = (params: {
    facultyUid: string;
    decision: 'approved' | 'rejected';
    reviewerUid: string;
    reviewerName: string;
    reviewNote: string;
  }) => {
    setDemoRequests((prev) =>
      prev.map((req) =>
        req.facultyUid === params.facultyUid
          ? {
              ...req,
              status: params.decision,
              reviewedBy: params.reviewerUid,
              reviewerName: params.reviewerName.trim() || 'HOD / Director',
              reviewNote: params.reviewNote.trim(),
            }
          : req
      )
    );
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        demoRole,
        demoProfile,
        demoBuses,
        demoBusDetails,
        demoRequests,
        demoMyRequest,
        demoUsers,
        enterDemoMode,
        exitDemoMode,
        setDemoRole,
        resetDemoData,
        saveDemoBus,
        updateDemoBusShifts,
        deleteDemoBus,
        submitDemoFacultyRequest,
        reviewDemoFacultyRequest,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
