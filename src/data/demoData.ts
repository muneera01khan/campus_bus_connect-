import type {
  BusRestrictedDetail,
  BusSchedule,
  FacultyAccessRequest,
  UserProfile,
  UserRole,
} from '../types/campus';

export const INITIAL_DEMO_BUSES: BusSchedule[] = [
  {
    id: 'demo-bus-g01',
    busNumber: 'G-01',
    routeName: 'Indore to Campus',
    firstShiftEntry: '08:00 AM',
    firstShiftExit: '02:40 PM',
    secondShiftEntry: '10:30 AM',
    secondShiftExit: '05:35 PM',
    status: 'active',
    updatedBy: 'demo-tdc-1',
    isDemo: true,
  },
  {
    id: 'demo-bus-g02',
    busNumber: 'G-02',
    routeName: 'Vijay Nagar to Campus',
    firstShiftEntry: '08:00 AM',
    firstShiftExit: '02:40 PM',
    secondShiftEntry: '10:30 AM',
    secondShiftExit: '05:35 PM',
    status: 'active',
    updatedBy: 'demo-tdc-1',
    isDemo: true,
  },
];

export const INITIAL_DEMO_BUS_DETAILS: Record<string, BusRestrictedDetail> = {
  'demo-bus-g01': {
    busId: 'demo-bus-g01',
    busNumber: 'G-01',
    driverName: 'Ramesh Sharma (DEMO)',
    driverContact: '+91 98260 11201',
    conductorName: 'Suresh Patel (DEMO)',
    conductorContact: '+91 98260 11202',
    vehicleRegistration: 'MP-09-FA-1001',
    seatingCapacity: 48,
    permitNumber: 'DEMO-PRM-G01',
    insuranceExpiry: '2027-06-30',
    emergencyContact: 'Transport Control: +91 731 4730001',
    operationalNotes: 'Sample DEMO record — Morning express via AB Road; Bay 1 parking.',
    updatedBy: 'demo-tdc-1',
  },
  'demo-bus-g02': {
    busId: 'demo-bus-g02',
    busNumber: 'G-02',
    driverName: 'Mahesh Verma (DEMO)',
    driverContact: '+91 98260 22301',
    conductorName: 'Dinesh Yadav (DEMO)',
    conductorContact: '+91 98260 22302',
    vehicleRegistration: 'MP-09-FA-1002',
    seatingCapacity: 52,
    permitNumber: 'DEMO-PRM-G02',
    insuranceExpiry: '2027-08-15',
    emergencyContact: 'Transport Control: +91 731 4730002',
    operationalNotes: 'Sample DEMO record — Direct Bypass corridor; Bay 2 parking.',
    updatedBy: 'demo-tdc-1',
  },
};

export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  student: {
    uid: 'demo-student-1',
    email: 'student.demo@campus.edu',
    displayName: 'Aarav Patel (Demo Student)',
    role: 'student',
    department: 'Computer Science',
    identifier: 'CS-2026-042',
  },
  faculty: {
    uid: 'demo-faculty-1',
    email: 'faculty.demo@campus.edu',
    displayName: 'Prof. Ananya Kulkarni (Demo Faculty)',
    role: 'faculty',
    department: 'Information Technology',
    identifier: 'FAC-104',
  },
  hod: {
    uid: 'demo-hod-1',
    email: 'hod.demo@campus.edu',
    displayName: 'Dr. Vikram Mehta (Demo HOD / Director)',
    role: 'hod',
    department: 'Administration',
    identifier: 'DIR-001',
  },
  tdc: {
    uid: 'demo-tdc-1',
    email: 'tdc.demo@campus.edu',
    displayName: 'Rajendra Singh (Demo TDC)',
    role: 'tdc',
    department: 'Transport Department',
    identifier: 'TDC-009',
  },
};

export const INITIAL_DEMO_REQUESTS: FacultyAccessRequest[] = [];
