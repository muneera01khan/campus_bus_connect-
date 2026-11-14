export type UserRole = 'student' | 'faculty' | 'hod' | 'tdc';

export type BusStatus = 'active' | 'maintenance' | 'inactive';

export type FacultyRequestStatus = 'pending' | 'approved' | 'rejected';

export const FIELD_LIMITS = {
  DISPLAY_NAME_MAX: 100,
  EMAIL_MAX: 160,
  DEPARTMENT_MAX: 80,
  IDENTIFIER_MAX: 40,
  BUS_NUMBER_MAX: 32,
  ROUTE_NAME_MAX: 120,
  ROUTE_STOPS_MAX_COUNT: 15,
  ROUTE_STOP_MAX_LEN: 80,
  TIME_MAX: 24,
  DRIVER_NAME_MAX: 80,
  CONTACT_MAX: 30,
  REGISTRATION_MAX: 32,
  PERMIT_MAX: 50,
  INSURANCE_MAX: 30,
  EMERGENCY_MAX: 40,
  NOTES_MAX: 500,
  REASON_MIN: 5,
  REASON_MAX: 500,
  REVIEW_NOTE_MAX: 300,
  CAPACITY_MIN: 1,
  CAPACITY_MAX: 120,
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  faculty: 'Faculty',
  hod: 'HOD / Director',
  tdc: 'TDC (Transport Coordinator)',
};

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  department: string;
  identifier: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RoleAssignment {
  id: string;
  email: string;
  role: UserRole;
  department: string;
  assignedBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BusSchedule {
  id: string;
  busNumber: string;
  routeName: string;
  routeStops: string[];
  morningPickupTime: string;
  morningCampusArrival: string;
  afternoonCampusDeparture: string;
  afternoonDropTime: string;
  morningShiftActive: boolean;
  afternoonShiftActive: boolean;
  status: BusStatus;
  updatedBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BusRestrictedDetail {
  busId: string;
  busNumber: string;
  driverName: string;
  driverContact: string;
  conductorName: string;
  conductorContact: string;
  vehicleRegistration: string;
  seatingCapacity: number;
  permitNumber: string;
  insuranceExpiry: string;
  emergencyContact: string;
  operationalNotes: string;
  updatedBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FacultyAccessRequest {
  facultyUid: string;
  facultyName: string;
  facultyEmail: string;
  department: string;
  employeeId: string;
  reason: string;
  status: FacultyRequestStatus;
  reviewedBy: string;
  reviewerName: string;
  reviewNote: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BusScheduleInput {
  busNumber: string;
  routeName: string;
  routeStops: string[];
  morningPickupTime: string;
  morningCampusArrival: string;
  afternoonCampusDeparture: string;
  afternoonDropTime: string;
  morningShiftActive: boolean;
  afternoonShiftActive: boolean;
  status: BusStatus;
}

export interface BusRestrictedDetailInput {
  driverName: string;
  driverContact: string;
  conductorName: string;
  conductorContact: string;
  vehicleRegistration: string;
  seatingCapacity: number;
  permitNumber: string;
  insuranceExpiry: string;
  emergencyContact: string;
  operationalNotes: string;
}
