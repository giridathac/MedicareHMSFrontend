// Shared types and interfaces

export interface Patient {
  id: number;
  PatientId: string;
  PatientNo?: string;
  PatientName: string;
  PatientType?: string;
  LastName?: string;
  AdhaarId?: string;
  PANCard?: string;
  PhoneNo: string;
  Gender: string;
  Age: number;
  Address?: string;
  ChiefComplaint?: string;
  Description?: string;
  Status?: string;
  RegisteredBy?: string;
  RegisteredDate?: string;
  // Legacy fields for backward compatibility
  //Name?: string;
  //Phone?: string;
  //Email?: string;
  //BloodType?: string;
  //LastVisit?: string;
  //Condition?: string;
  //FollowUpCount?: number;
}

export interface Token {
  id: number;
  tokenNumber: string;
  patientName: string;
  patientPhone: string;
  doctorId: number;
  doctorName: string;
  status: 'Waiting' | 'Consulting' | 'Completed' | 'Cancelled';
  issueTime: string;
  consultTime?: string;
  isFollowUp?: boolean;
  patientId?: number;
}

export interface Appointment {
  id: number;
  patient: string;
  doctor: string;
  date: string;
  time: string;
  department: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed';
}

export interface PatientAppointment {
  id: number;
  patientAppointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  tokenNo: string;
  appointmentStatus: 'Waiting' | 'Consulting' | 'Completed';
  consultationCharge: number;
  diagnosis?: string;
  followUpDetails?: string;
  prescriptionsUrl?: string;
  toBeAdmitted: boolean;
  referToAnotherDoctor: boolean;
  referredDoctorId?: string;
  transferToIPDOTICU: boolean;
  transferTo?: 'IPD Room Admission' | 'ICU' | 'OT';
  transferDetails?: string;
  billId?: string;
  aadharId?: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  type: 'inhouse' | 'consulting';
}

export interface DashboardStats {
  opdPatientsToday: number;
  activeTokens: number;
  ipdAdmissions: number;
  otScheduled: number;
  icuOccupied: string;
  totalPatients: number;
}

export interface ChartData {
  day?: string;
  patients?: number;
  name?: string;
  value?: number;
  color?: string;
}

export interface DoctorQueue {
  doctor: string;
  specialty: string;
  type: 'inhouse' | 'consulting';
  waiting: number;
  consulting: number;
  completed: number;
}

export interface RoomBed {
  id: number;
  roomBedId: number; // Integer primary key
  bedNo: string;
  roomNo: string;
  roomCategory: string;
  roomType: string;
  numberOfBeds: number;
  chargesPerDay: number;
  status: 'Active' | 'Inactive';
  createdBy: string;
  createdAt: string;
}

export interface LabTest {
  id: number;
  labTestId: number; // Integer primary key
  displayTestId: string;
  testName: string;
  testCategory: string;
  description?: string;
  charges: number;
  status: 'active' | 'inactive';
}

export interface ICUBed {
  id: number;
  icuBedId: number; // Integer primary key
  icuId: number;
  icuBedNo: string;
  icuType: string;
  icuRoomNameNo: string;
  icuDescription?: string;
  isVentilatorAttached: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  createdDate?: string;
}

export interface OTRoom {
  id: number;
  otId: string;
  otNo: string;
  otType: string;
  otName: string;
  otDescription?: string;
  startTimeofDay: string;
  endTimeofDay: string;
  createdBy: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface OTSlot {
  id: number;
  otSlotId: string;
  otId: string;
  // Raw OTId and OTSlotNo from API
  otIdNumber: number;
  otSlotNo: string;
  // Room information from API
  otNo?: string | null;
  otName?: string | null;
  otType?: string | null;
  slotStartTime: string;
  slotEndTime: string;
  status: 'Active' | 'Inactive';
  // Availability/Occupancy information from backend
  isAvailable?: boolean;
  isOccupied?: boolean;
  availabilityStatus?: string;
  patientOTAllocationId?: number | null;
  operationStatus?: string | null;
  // Patient information for booked slots
  patientId?: string | null;
  patientNo?: string | null;
  patientName?: string | null;
}

export interface Bill {
  id: number;
  billId: string;
  billNo: string;
  patientId: string | null;
  billEntityId: number | null;
  serviceId: string;
  quantity: number;
  rate: number;
  amount: number;
  billDateTime: string;
  modeOfPayment: 'Cash' | 'Card' | 'Insurance' | 'Scheme';
  insuranceReferenceNo?: string;
  insuranceBillAmount?: number;
  schemeReferenceNo?: string;
  paidStatus: 'Paid' | 'NotPaid';
  status: 'active' | 'inactive';
  billGeneratedBy: string;
  billGeneratedAt: string;
}

export interface EmergencyBed {
  id: number;
  emergencyBedId: string;
  emergencyBedNo: string;
  emergencyRoomNameNo?: string;
  emergencyRoomDescription?: string;
  chargesPerDay: number;
  createdBy: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'occupied';
}

export interface EmergencyBedSlot {
  id: number;
  emergencyBedSlotId: string;
  emergencyBedId: number;
  eBedSlotNo: string;
  eSlotStartTime: string;
  eSlotEndTime: string;
  status: 'Active' | 'Inactive';
}

export interface PatientOTAllocation {
  id: number;
  patientOTAllocationId: number;
  patientId: string; // Required (UUID)
  roomAdmissionId?: number; // Kept for backward compatibility but not in new API response
  patientAppointmentId?: string; // Number in API, but kept as string for backward compatibility
  emergencyBedId?: number; // Kept for backward compatibility but not in new API response
  emergencyBedSlotId?: number;
  otId: number;
  surgeryId?: number;
  leadSurgeonId: number;
  assistantDoctorId?: number;
  anaesthetistId?: number;
  nurseId?: number;
  otAllocationDate: string;
  dateOfOperation?: string | string[]; // Can be single date or array of dates (matches OTSlotIds)
  duration?: string; // Number in API, but kept as string for backward compatibility
  otStartTime?: string; // Now nullable
  otEndTime?: string; // Now nullable
  otActualStartTime?: string;
  otActualEndTime?: string;
  operationDescription?: string;
  operationStatus: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled' | 'Postponed';
  preOperationNotes?: string;
  postOperationNotes?: string;
  otDocuments?: string;
  billId?: number;
  otAllocationCreatedBy?: number;
  otAllocationCreatedAt?: string;
  status: 'Active' | 'InActive';
  otSlotIds?: number[];
}

export interface EmergencyAdmission {
  id: number;
  emergencyAdmissionId: number;
  doctorId: number;
  patientId: string; // UUID
  emergencyBedSlotId?: number; // Kept for backward compatibility
  emergencyBedId?: number; // The bed ID (new field)
  emergencyAdmissionDate: string;
  emergencyStatus: 'Admitted' | 'IPD' | 'OT' | 'ICU' | 'Discharged' | 'Movedout';
  numberOfDays?: number | null;
  diagnosis?: string;
  treatmentDetails?: string; // Note: API may use "TreatementDetails" (typo)
  patientCondition: 'Critical' | 'Stable';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  transferToIPDOTICU: boolean;
  transferTo?: 'IPD Room Admission' | 'ICU' | 'OT';
  transferDetails?: string;
  admissionCreatedBy?: number;
  admissionCreatedAt?: string;
  status: 'Active' | 'Inactive';
  // Additional response fields
  patientName?: string;
  patientNo?: string;
  doctorName?: string;
  emergencyBedSlotNo?: string;
  emergencyBedNo?: string; // Bed number from backend
  createdByName?: string;
}

export interface EmergencyAdmissionVitals {
  emergencyAdmissionVitalsId: number;
  emergencyAdmissionId: number;
  nurseId: number;
  recordedDateTime: string;
  heartRate?: number;
  bloodPressure?: string;
  temperature?: number;
  o2Saturation?: number;
  respiratoryRate?: number;
  pulseRate?: number;
  vitalsStatus: 'Critical' | 'Stable';
  vitalsRemarks?: string;
  vitalsCreatedBy?: number;
  vitalsCreatedAt?: string;
  status?: string;
  // Additional response fields
  nurseName?: string;
  createdByName?: string;
}

