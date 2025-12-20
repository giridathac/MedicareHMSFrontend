// Admissions API service
import { apiRequest, ApiError, ENABLE_STUB_DATA } from './base';

export interface Admission {
  id: number;
  roomAdmissionId?: number;
  admissionId?: number; // Keep for backward compatibility, but roomAdmissionId is primary
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  admissionDate: string;
  roomType: 'Regular Ward' | 'Special Shared Room' | 'Special Room';
  bedNumber: string;
  admittedBy: string;
  admittingDoctorName?: string; // AdmittingDoctorName from API
  patientNo?: string; // PatientNo from API
  diagnosis: string;
  status: 'Active' | 'Discharged' | 'Moved to ICU' | 'Surgery Scheduled';
  admissionStatus?: string; // Raw admission status from API
  scheduleOT?: string | boolean; // ScheduleOT field from API - can be "Yes"/"No" or boolean
  estimatedStay?: string;
  createdAt?: string;
  createdDate?: string;
  caseSheetDetails?: string; // CaseSheetDetails field from API
  caseSheet?: string; // CaseSheet field from API (separate from caseSheetDetails)
  isLinkedToICU?: boolean | string; // IsLinkedToICU field from API
  patientType?: string; // PatientType field from API (OPD/Emergency/Direct)
  patientAppointmentId?: string | number; // PatientAppointmentId field from API
  appointmentId?: string | number; // AppointmentId field from API (alias for patientAppointmentId)
  appointmentTokenNo?: string; // AppointmentTokenNo field from API
  appointmentDate?: string; // AppointmentDate field from API
  emergencyBedSlotId?: string | number; // EmergencyBedSlotId field from API (kept for backward compatibility)
  emergencyBedNo?: string; // EmergencyBedNo field from API
  eBedSlotNo?: string; // EBedSlotNo field from API
  emergencyAdmissionDate?: string; // EmergencyAdmissionDate field from API
  roomVacantDate?: string; // RoomVacantDate field from API
  shiftToAnotherRoom?: string | boolean; // ShiftToAnotherRoom field from API
  shiftedTo?: string; // ShiftedTo field from API
  shiftedToDetails?: string; // ShiftedToDetails field from API
  otAdmissionId?: string | number; // OTAdmissionId field from API
  icuAdmissionId?: string | number; // ICUAdmissionId field from API
  billId?: string | number; // BillId field from API
}

export interface CreateAdmissionDto {
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  admissionDate: string;
  roomType: 'Regular Ward' | 'Special Shared Room' | 'Special Room';
  bedNumber: string;
  admittedBy: string;
  diagnosis: string;
  status?: 'Active' | 'Discharged' | 'Moved to ICU' | 'Surgery Scheduled';
  estimatedStay?: string;
  patientType?: 'Direct' | 'OPD' | 'Emergency';
  patientAppointmentId?: string;
  emergencyAdmissionId?: string;
  emergencyBedNo?: string;
 
  roomBedsId?: string;
  doctorId?: string;
  admittedByDoctorId?: string;
  roomAllocationDate?: string;
  caseSheet?: string;
  caseSheetDetails?: string;
  isLinkedToICU?: boolean;
  scheduleOT?: boolean | string;
  otAdmissionId?: string;
  icuAdmissionId?: string;
  billId?: string;
  allocatedBy?: string;
  allocatedAt?: string;  
}

export interface UpdateAdmissionDto extends Partial<CreateAdmissionDto> {
  roomAdmissionId: number; // Use roomAdmissionId as primary identifier for updates
  scheduleOT?: boolean | string; // ScheduleOT field - can be boolean or "Yes"/"No" string
}

export interface RoomCapacity {
  total: number;
  occupied: number;
  available: number;
}

export interface RoomCapacityOverview {
  'Regular Ward': RoomCapacity;
  'Special Shared Room': RoomCapacity;
  'Special Room': RoomCapacity;
}

export interface DashboardMetrics {
  totalAdmissions: number;
  activePatients: number;
  bedOccupancy: number; // percentage
  totalOccupied: number;
  totalCapacity: number;
  availableBeds: number;
  avgStay: number; // in days
}

export interface PatientLabTest {
  id?: number;
  patientLabTestId?: number;
  patientLabTestsId?: number; // Primary key from backend
  patientId?: string;
  patientName?: string;
  roomAdmissionId?: number;
  labTestId?: number;
  labTestName?: string;
  testName?: string;
  testCategory?: string;
  displayTestId?: string;
  description?: string;
  priority?: string;
  patientType?: string;
  emergencyBedSlotId?: number | string;
  billId?: number | string;
  labTestDone?: string | boolean;
  reportsUrl?: string;
  testStatus?: string;
  testDoneDateTime?: string;
  status?: string;
  orderedDate?: string;
  orderedBy?: string;
  result?: string;
  reportedDate?: string;
  charges?: number;
  createdBy?: number | string;
  createdDate?: string;
}

export interface PatientDoctorVisit {
  id?: number;
  icuDoctorVisitsId?: number; // Primary key for ICU Doctor Visits
  iCUDoctorVisitId?: number; // Legacy field name support
  patientDoctorVisitId?: number;
  roomAdmissionId?: number;
  patientId?: string;
  doctorId?: number;
  doctorName?: string;
  visitDate?: string;
  visitTime?: string;
  visitType?: string;
  diagnosis?: string;
  notes?: string;
  prescribedMedications?: string;
  followUpDate?: string;
  status?: string;
  doctorVisitedDateTime?: string;
  visitsRemarks?: string;
  patientCondition?: string;
  visitCreatedBy?: string | number;
  visitCreatedAt?: string;
}

export interface PatientNurseVisit {
  id?: number;
  patientNurseVisitId?: number;
  icuNurseVisitsId?: number | string; // Primary key for ICU Nurse Visits
  roomAdmissionId?: number;
  nurseId?: number;
  nurseName?: string;
  visitDate?: string;
  visitTime?: string;
  visitType?: string;
  vitalSigns?: string;
  notes?: string;
  medicationsAdministered?: string;
  nextVisitDate?: string;
  status?: string;
  patientStatus?: string;
  supervisionDetails?: string;
  remarks?: string;
}

export interface ICUNurseVisitVitals {
  id?: number | string;
  icuNurseVisitVitalsId?: number | string;
  icuNurseVisitId?: number | string;
  heartRate?: number;
  bloodPressure?: string;
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  bloodSugar?: number;
  recordedDateTime?: string;
  recordedBy?: string;
  notes?: string;
}

export interface PatientAdmitVisitVitals {
  id?: number;
  patientAdmitVisitVitalsId?: number;
  roomAdmissionId?: number;
  patientId?: string;
  nurseId?: number;
  patientStatus?: string;
  recordedDateTime?: string;
  visitRemarks?: string;
  dailyOrHourlyVitals?: string;
  heartRate?: number;
  bloodPressure?: string;
  temperature?: number;
  o2Saturation?: number;
  respiratoryRate?: number;
  pulseRate?: number;
  vitalsStatus?: string;
  vitalsRemarks?: string;
  vitalsCreatedBy?: string | number;
  vitalsCreatedAt?: string;
  status?: string;
}

// Stub data for Admissions Management
const stubAdmissions: Admission[] = [
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to normalize status
function normalizeStatus(status: any): 'Active' | 'Discharged' | 'Moved to ICU' | 'Surgery Scheduled' {
  if (!status) return 'Active';
  
  const statusStr = String(status).trim();
  const lowerStatus = statusStr.toLowerCase();
  
  // Active status variations
  if (lowerStatus === 'active' || lowerStatus === 'admitted' || lowerStatus === 'inpatient' || lowerStatus === 'in patient') {
    return 'Active';
  }
  
  // Discharged status variations
  if (lowerStatus === 'discharged' || lowerStatus === 'discharge' || lowerStatus === 'discharged patient') {
    return 'Discharged';
  }
  
  // Moved to ICU status variations
  if (lowerStatus === 'moved to icu' || lowerStatus === 'movedtoicu' || lowerStatus === 'moved_to_icu' || 
      lowerStatus === 'transferred to icu' || lowerStatus === 'transferredtoicu' || lowerStatus === 'transferred_to_icu' ||
      lowerStatus === 'icu' || lowerStatus === 'in icu') {
    return 'Moved to ICU';
  }
  
  // Surgery Scheduled status variations
  if (lowerStatus === 'surgery scheduled' || lowerStatus === 'surgeryscheduled' || lowerStatus === 'surgery_scheduled' ||
      lowerStatus === 'scheduled for surgery' || lowerStatus === 'scheduledforsurgery' || lowerStatus === 'scheduled_for_surgery' ||
      lowerStatus === 'surgery' || lowerStatus === 'ot scheduled' || lowerStatus === 'otscheduled' || lowerStatus === 'ot_scheduled') {
    return 'Surgery Scheduled';
  }
  
  // Default to Active if unknown status
  console.warn(`Unknown admission status: "${status}", defaulting to "Active"`);
  return 'Active';
}

// Helper function to normalize room type
function normalizeRoomType(roomType: any): 'Regular Ward' | 'Special Shared Room' | 'Special Room' {
  if (!roomType) {
    console.warn('normalizeRoomType: roomType is empty, defaulting to Regular Ward');
    return 'Regular Ward';
  }
  
  const roomTypeStr = String(roomType).trim();
  const lowerRoomType = roomTypeStr.toLowerCase();
  
  // Regular Ward variations
  if (lowerRoomType === 'regular ward' || lowerRoomType === 'regularward' || lowerRoomType === 'regular_ward' ||
      lowerRoomType === 'regular' || lowerRoomType === 'ward' || lowerRoomType === 'general ward' ||
      lowerRoomType === 'generalward' || lowerRoomType === 'general_ward') {
    return 'Regular Ward';
  }
  
  // Special Shared Room variations
  if (lowerRoomType === 'special shared room' || lowerRoomType === 'specialsharedroom' || lowerRoomType === 'special_shared_room' ||
      lowerRoomType === 'special shared' || lowerRoomType === 'specialshared' || lowerRoomType === 'special_shared' ||
      lowerRoomType === 'shared room' || lowerRoomType === 'sharedroom' || lowerRoomType === 'shared_room' ||
      (lowerRoomType.includes('special') && lowerRoomType.includes('shared'))) {
    return 'Special Shared Room';
  }
  
  // Special Room variations
  if (lowerRoomType === 'special room' || lowerRoomType === 'specialroom' || lowerRoomType === 'special_room' ||
      lowerRoomType === 'special' || lowerRoomType === 'private room' || lowerRoomType === 'privateroom' ||
      lowerRoomType === 'private_room' || (lowerRoomType.includes('special') && !lowerRoomType.includes('shared'))) {
    return 'Special Room';
  }
  
  // Default to Regular Ward if unknown, but log a warning
  console.warn(`normalizeRoomType: Unknown roomType value "${roomTypeStr}", defaulting to Regular Ward`);
  return 'Regular Ward';
}

// Stub data for Room Capacity Overview
const stubRoomCapacity: RoomCapacityOverview = {
  'Regular Ward': { total: 50, occupied: 35, available: 15 },
  'Special Shared Room': { total: 20, occupied: 14, available: 6 },
  'Special Room': { total: 15, occupied: 8, available: 7 },
};

// Module-level array to store ICU admissions extracted from bed layout
let icuAdmissionsArray: any[] = [];

export const admissionsApi = {
  // Get ICU admissions array (populated from getICUBedLayout)
  getICUAdmissions(): any[] {
    return icuAdmissionsArray;
  },

  async getAll(): Promise<Admission[]> {
    let apiData: Admission[] = [];
    
    try {
      console.log('Fetching admissions from API endpoint: /room-admissions/data');
      const response = await apiRequest<any>('/room-admissions/data');
      console.log('', JSON.stringify(response, null, 2));
      
      // Handle different response structures: { data: [...] } or direct array
      const admissionsData = response?.data || response || [];
      console.log('Admissions data extracted:', admissionsData);
     
      if (Array.isArray(admissionsData) && admissionsData.length > 0) {
        console.log(`Processing ${admissionsData.length} admissions from API`);
        // Map and normalize the data to ensure all fields are present

        apiData = admissionsData.map((admission: any, index: number) => {
          // Extract roomAdmissionId first (primary identifier), then fallback to admissionId
          const roomAdmissionId = Number(admission.roomAdmissionId || admission.RoomAdmissionId || admission.room_admission_id || admission.Room_Admission_Id || admission.roomAdmissionID || admission.RoomAdmissionID || null);
          const admissionId = Number(admission.admissionId || admission.AdmissionId || admission.id || admission.Id || admission.AdmissionID || (1000000 + index));
          console.log('Room Admission ID:', roomAdmissionId, 'Admission ID:', admissionId);
          // Helper function to extract value with multiple field name variations (including nested objects)
          const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
            // Ensure fieldVariations is an array
            if (!Array.isArray(fieldVariations)) {
              console.error('extractField: fieldVariations must be an array', fieldVariations);
              return defaultValue;
            }
            if (!data || typeof data !== 'object') {
              return defaultValue;
            }
            
            // Helper to recursively check nested objects
            const checkNested = (obj: any, field: string, depth: number = 0): any => {
              if (depth > 3 || !obj || typeof obj !== 'object' || Array.isArray(obj)) {
                return undefined;
              }
              
              // Check direct property (case-sensitive)
              if (obj.hasOwnProperty(field)) {
                const value = obj[field];
                if (value !== undefined && value !== null && value !== '') {
                  return value;
                }
              }
              
              // Check case-insensitive
              const lowerField = field.toLowerCase();
              for (const key in obj) {
                if (obj.hasOwnProperty(key) && key.toLowerCase() === lowerField) {
                  const value = obj[key];
                  if (value !== undefined && value !== null && value !== '') {
                    return value;
                  }
                }
              }
              
              // Check partial match
              for (const key in obj) {
                if (obj.hasOwnProperty(key) && (key.toLowerCase().includes(lowerField) || lowerField.includes(key.toLowerCase()))) {
                  const value = obj[key];
                  if (value !== undefined && value !== null && value !== '') {
                    return value;
                  }
                }
              }
              
              // Recursively check nested objects
              for (const key in obj) {
                if (obj.hasOwnProperty(key) && typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                  const nestedValue = checkNested(obj[key], field, depth + 1);
                  if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
                    return nestedValue;
                  }
                }
              }
              return undefined;
            };
            
            // Try each field variation
            for (const field of fieldVariations) {
              // Check direct field
              let value = data?.[field];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
              
              // Check nested objects
              const nestedValue = checkNested(data, field);
              if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
                return nestedValue;
              }
              
              // Check nested paths (e.g., Doctor.DoctorName, AdmissionStatus.StatusName)
              if (field.includes('.')) {
                const parts = field.split('.');
                let nestedPathValue = data;
                for (const part of parts) {
                  nestedPathValue = nestedPathValue?.[part];
                  if (nestedPathValue === undefined || nestedPathValue === null) break;
                }
                if (nestedPathValue !== undefined && nestedPathValue !== null && nestedPathValue !== '') {
                  return nestedPathValue;
                }
              }
            }
            return defaultValue;
          };
          
          // Extract patient name with various field name formats
          const patientName = extractField(admission, [
            'patientName', 'PatientName', 'patient_name', 'Patient_Name', 
            'Patient_Name', 'patientFullName', 'PatientFullName',
            'name', 'Name', 'fullName', 'FullName'
          ], '');
          
          // Extract bed number with various field name formats
          const bedNumber = extractField(admission, [
            'bedNumber', 'BedNumber', 'bed_number', 'Bed_Number',
            'Bed_No', 'bedNo', 'BedNo', 'bed', 'Bed',
            'bedId', 'BedId', 'bedID', 'BedID'
          ], '');
          
          // Extract admitted by with various field name formats
          const admittedBy = extractField(admission, [
            'admittedBy', 'AdmittedBy', 'admitted_by', 'Admitted_By',
            'admittedByDoctor', 'AdmittedByDoctor', 'admitted_by_doctor',
            'doctorName', 'DoctorName', 'doctor_name', 'Doctor_Name',
            'admittedByStaff', 'AdmittedByStaff', 'admitted_by_staff',
            'admittedByUser', 'AdmittedByUser', 'admitted_by_user'
          ], '');
          
          // Extract AdmittingDoctorName with various field name formats
          const admittingDoctorName = extractField(admission, [
            'admittingDoctorName', 'AdmittingDoctorName', 'admitting_doctor_name', 'Admitting_Doctor_Name',
            'admittingDoctor', 'AdmittingDoctor', 'admitting_doctor', 'Admitting_Doctor',
            'doctorName', 'DoctorName', 'doctor_name', 'Doctor_Name',
            'admittedByDoctorName', 'AdmittedByDoctorName', 'admitted_by_doctor_name', 'Admitted_By_Doctor_Name'
          ], '');
          
          // Extract age
          const ageValue = extractField(admission, [
            'age', 'Age', 'patientAge', 'PatientAge', 'patient_age', 'Patient_Age'
          ], 0);
          const age = Number(ageValue) || 0;
          
          // Extract gender
          const gender = extractField(admission, [
            'gender', 'Gender', 'sex', 'Sex', 'patientGender', 'PatientGender',
            'patient_gender', 'Patient_Gender'
          ], '');
          
          const mappedAdmission = {
            id: admission.id || admission.Id || roomAdmissionId || admissionId || (1000000 + index),
            roomAdmissionId: roomAdmissionId || undefined,
            admissionId: roomAdmissionId || admissionId, // Use roomAdmissionId as primary, fallback to admissionId
            patientId: extractField(admission, ['patientId', 'PatientId', 'PatientID', 'patient_id', 'Patient_ID'], ''),
            patientName: patientName,
            age: age,
            gender: gender,
            admissionDate: extractField(admission, [
              'admissionDate', 'AdmissionDate', 'admission_date', 'Admission_Date',
              'admitDate', 'AdmitDate', 'admit_date', 'Admit_Date'
            ], new Date().toISOString().split('T')[0]),
            // Extract roomType - prioritize roomType field from API
            roomType: (() => {
              const rawRoomType = extractField(admission, [
                'roomType', 'RoomType', 'room_type', 'Room_Type',
                'roomCategory', 'RoomCategory', 'room_category', 'Room_Category',
                'roomTypeName', 'RoomTypeName', 'room_type_name', 'Room_Type_Name',
                'type', 'Type', 'category', 'Category'
              ], null);
              const normalized = normalizeRoomType(rawRoomType);
              
              // Only warn if the raw value exists but doesn't match any known variation
              if (rawRoomType) {
                const lowerRaw = String(rawRoomType).trim().toLowerCase();
                const knownRegularVariations = ['regular ward', 'regularward', 'regular_ward', 'regular', 'ward', 'general ward', 'generalward', 'general_ward'];
                const knownSpecialSharedVariations = ['special shared room', 'specialsharedroom', 'special_shared_room', 'special shared', 'specialshared', 'special_shared', 'shared room', 'sharedroom', 'shared_room'];
                const knownSpecialVariations = ['special room', 'specialroom', 'special_room', 'special', 'private room', 'privateroom', 'private_room'];
                
                const isKnownVariation = knownRegularVariations.includes(lowerRaw) || 
                                       knownSpecialSharedVariations.includes(lowerRaw) ||
                                       knownSpecialVariations.includes(lowerRaw) ||
                                       (lowerRaw.includes('special') && lowerRaw.includes('shared')) ||
                                       (lowerRaw.includes('special') && !lowerRaw.includes('shared'));
                
                if (!isKnownVariation && normalized === 'Regular Ward') {
                  console.warn(`RoomType mapping: Unknown raw value "${rawRoomType}" was normalized to "Regular Ward" (default) for admission ${admission.id || index}`);
                }
              }
              
              return normalized;
            })(),
            bedNumber: bedNumber,
            admittedBy: admittedBy,
            admittingDoctorName: admittingDoctorName || undefined,
            diagnosis: extractField(admission, [
              'diagnosis', 'Diagnosis', 'diagnosisDescription', 'DiagnosisDescription',
              'diagnosis_desc', 'Diagnosis_Desc', 'condition', 'Condition'
            ], ''),
            // Extract raw admissionStatus before normalizing
            admissionStatus: (() => {
              const statusValue = extractField(admission, [
                'admissionStatus', 'AdmissionStatus', 'admission_status', 'Admission_Status',
                'admissionStatusName', 'AdmissionStatusName', 'admissionStatusName', 'AdmissionStatusName',
                'status', 'Status'
              ], '');
              return statusValue || undefined;
            })(),
            status: normalizeStatus(extractField(admission, [
              'status', 'Status', 'admissionStatus', 'AdmissionStatus',
              'admission_status', 'Admission_Status', 'admissionStatusName', 'AdmissionStatusName'
            ], 'Active')),
            
            scheduleOT: extractField(admission, [
              'scheduleOT', 'ScheduleOT', 'schedule_ot', 'Schedule_OT',
              'scheduleOt', 'ScheduleOt', 'scheduledOT', 'ScheduledOT',
              'scheduled_ot', 'Scheduled_OT', 'isScheduledOT', 'IsScheduledOT'
            ], undefined),
            patientType: extractField(admission, [
              'patientType', 'PatientType', 'patient_type', 'Patient_Type',
              'type', 'Type', 'admissionType', 'AdmissionType', 'admission_type', 'Admission_Type'
            ], undefined),
            patientAppointmentId: extractField(admission, [
              'patientAppointmentId', 'PatientAppointmentId', 'patient_appointment_id', 'Patient_Appointment_Id',
              'appointmentId', 'AppointmentId', 'appointment_id', 'Appointment_Id',
              'PatientAppointmentID', 'patientAppointmentID', 'Patient_Appointment_ID',
              'AppointmentID', 'appointmentID', 'Appointment_ID'
            ], undefined),
            appointmentId: extractField(admission, [
              'appointmentId', 'AppointmentId', 'appointment_id', 'Appointment_Id',
              'patientAppointmentId', 'PatientAppointmentId', 'patient_appointment_id', 'Patient_Appointment_Id',
              'AppointmentID', 'appointmentID', 'Appointment_ID',
              'PatientAppointmentID', 'patientAppointmentID', 'Patient_Appointment_ID'
            ], undefined),
            appointmentTokenNo: extractField(admission, [
              'appointmentTokenNo', 'AppointmentTokenNo', 'appointment_token_no', 'Appointment_Token_No',
              'tokenNo', 'TokenNo', 'token_no', 'Token_No',
              'tokenNumber', 'TokenNumber', 'token_number', 'Token_Number',
              'appointmentToken', 'AppointmentToken', 'appointment_token', 'Appointment_Token'
            ], undefined),
            appointmentDate: extractField(admission, [
              'appointmentDate', 'AppointmentDate', 'appointment_date', 'Appointment_Date',
              'appointmentDateTime', 'AppointmentDateTime', 'appointment_date_time', 'Appointment_Date_Time',
              'apptDate', 'ApptDate', 'appt_date', 'Appt_Date'
            ], undefined),
            emergencyBedSlotId: extractField(admission, [
              'emergencyBedSlotId', 'EmergencyBedSlotId', 'emergency_bed_slot_id', 'Emergency_Bed_Slot_Id',
              'emergencyBedId', 'EmergencyBedId', 'emergency_bed_id', 'Emergency_Bed_Id',
              'bedSlotId', 'BedSlotId', 'bed_slot_id', 'Bed_Slot_Id',
              'EmergencyBedSlotID', 'emergencyBedSlotID', 'Emergency_Bed_Slot_ID',
              'EmergencyBedID', 'emergencyBedID', 'Emergency_Bed_ID',
              'EmergencyAdmissionId', 'emergencyAdmissionId', 'emergency_admission_id', 'Emergency_Admission_Id',
              'EmergencyAdmissionID', 'emergencyAdmissionID', 'Emergency_Admission_ID'
            ], undefined),
            emergencyBedNo: extractField(admission, [
              'emergencyBedNo', 'EmergencyBedNo', 'emergency_bed_no', 'Emergency_Bed_No',
              'emergencyBedNumber', 'EmergencyBedNumber', 'emergency_bed_number', 'Emergency_Bed_Number',
              'bedNo', 'BedNo', 'bed_no', 'Bed_No', 'bedNumber', 'BedNumber', 'bed_number', 'Bed_Number'
            ], undefined),
            eBedSlotNo: extractField(admission, [
              'eBedSlotNo', 'EBedSlotNo', 'e_bed_slot_no', 'E_Bed_Slot_No',
              'bedSlotNo', 'BedSlotNo', 'bed_slot_no', 'Bed_Slot_No',
              'slotNo', 'SlotNo', 'slot_no', 'Slot_No',
              'emergencyBedSlotNo', 'EmergencyBedSlotNo', 'emergency_bed_slot_no', 'Emergency_Bed_Slot_No'
            ], undefined),
            emergencyAdmissionDate: extractField(admission, [
              'emergencyAdmissionDate', 'EmergencyAdmissionDate', 'emergency_admission_date', 'Emergency_Admission_Date',
              'emergencyAdmissionDateTime', 'EmergencyAdmissionDateTime', 'emergency_admission_date_time', 'Emergency_Admission_Date_Time',
              'emergencyAdmitDate', 'EmergencyAdmitDate', 'emergency_admit_date', 'Emergency_Admit_Date',
              'emergencyDate', 'EmergencyDate', 'emergency_date', 'Emergency_Date'
            ], undefined),
            estimatedStay: extractField(admission, [
              'estimatedStay', 'EstimatedStay', 'estimated_stay', 'Estimated_Stay',
              'estimatedDuration', 'EstimatedDuration', 'estimated_duration', 'Estimated_Duration'
            ], undefined),
            createdAt: extractField(admission, [
              'createdAt', 'CreatedAt', 'created_at', 'Created_At',
              'createdDate', 'CreatedDate', 'created_date', 'Created_Date'
            ], new Date().toISOString()),
            createdDate: extractField(admission, [
              'createdDate', 'CreatedDate', 'created_date', 'Created_Date',
              'admissionDate', 'AdmissionDate', 'admission_date', 'Admission_Date'
            ], undefined),
          };
          console.log(`Mapped admission ${index + 1}:`, {
            bedNumber: mappedAdmission.bedNumber,
            patientName: mappedAdmission.patientName,
            age: mappedAdmission.age,
            gender: mappedAdmission.gender,
            admittedBy: mappedAdmission.admittedBy,
            roomType: {
              raw: extractField(admission, ['roomType', 'RoomType', 'room_type', 'Room_Type', 'roomCategory', 'RoomCategory', 'room_category', 'Room_Category', 'roomTypeName', 'RoomTypeName', 'room_type_name', 'Room_Type_Name', 'type', 'Type', 'category', 'Category'], null),
              normalized: mappedAdmission.roomType
            },
            patientType: mappedAdmission.patientType,
            patientAppointmentId: mappedAdmission.patientAppointmentId,
            appointmentId: mappedAdmission.appointmentId,
            appointmentTokenNo: mappedAdmission.appointmentTokenNo,
            appointmentDate: mappedAdmission.appointmentDate,
            emergencyBedSlotId: mappedAdmission.emergencyBedSlotId,
            emergencyBedNo: mappedAdmission.emergencyBedNo,
            eBedSlotNo: mappedAdmission.eBedSlotNo,
            emergencyAdmissionDate: mappedAdmission.emergencyAdmissionDate,
            admissionStatus: mappedAdmission.admissionStatus,
            status: mappedAdmission.status,
            full: mappedAdmission
          });
          return mappedAdmission;
        }) as Admission[];
        console.log(`Successfully mapped ${apiData.length} admissions`);
      } else if (admissionsData && !Array.isArray(admissionsData)) {
        console.warn('Admissions data is not an array:', typeof admissionsData);
      } else {
        console.warn('No admissions data found in API response');
      }
    } catch (error) {
      console.error('Error fetching admissions:', error);
      // If stub data is disabled and API fails, throw the error
      if (!ENABLE_STUB_DATA) {
        throw error;
      }
    }
    
    // Append stub data if enabled
    if (ENABLE_STUB_DATA) {
      // Filter out stub data that might conflict with API data (by ID)
      const apiIds = new Set(apiData.map(admission => admission.id));
      const uniqueStubData = stubAdmissions.filter(admission => !apiIds.has(admission.id));
      
      if (uniqueStubData.length > 0) {
        console.log(`Appending ${uniqueStubData.length} stub admissions to ${apiData.length} API records`);
      }
      
      // If API returned no data, use stub data as fallback
      if (apiData.length === 0) {
        console.warn('No admissions data received from API, using stub data');
        await delay(300);
        return [...stubAdmissions];
      }
      
      // Combine API data with stub data
      return [...apiData, ...uniqueStubData];
    }
    
    // Return only API data if stub data is disabled
    return apiData;
  },

  async getById(admissionId: number): Promise<Admission> {
    try {
      // Validate ID before making API call
      if (!admissionId || admissionId <= 0) {
        throw new Error(`Invalid admission ID: ${admissionId}. Cannot fetch admission data.`);
      }
      
      // Use room-admissions endpoint with the ID
      const response = await apiRequest<any>(`/room-admissions/data/${admissionId}`);
      console.log('Get admission by ID response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures: { data: {...} } or direct object
      const admissionData = response?.data || response;
      console.log('Get admission by ID admissionData:', JSON.stringify(admissionData, null, 2));
      
      if (!admissionData) {
        throw new Error(`Admission with id ${admissionId} not found`);
      }
      
      // Helper function to extract value with multiple field name variations (including nested objects)
      const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
        if (!Array.isArray(fieldVariations)) {
          console.error('extractField: fieldVariations must be an array', fieldVariations);
          return defaultValue;
        }
        if (!data || typeof data !== 'object') {
          return defaultValue;
        }
        
        // Helper to recursively check nested objects
        const checkNested = (obj: any, field: string, depth: number = 0): any => {
          if (depth > 3 || !obj || typeof obj !== 'object' || Array.isArray(obj)) {
            return undefined;
          }
          
          // Check direct property (case-sensitive)
          if (obj.hasOwnProperty(field)) {
            const value = obj[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          
          // Check case-insensitive
          const lowerField = field.toLowerCase();
          for (const key in obj) {
            if (obj.hasOwnProperty(key) && key.toLowerCase() === lowerField) {
              const value = obj[key];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
            }
          }
          
          // Check partial match
          for (const key in obj) {
            if (obj.hasOwnProperty(key) && (key.toLowerCase().includes(lowerField) || lowerField.includes(key.toLowerCase()))) {
              const value = obj[key];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
            }
          }
          
          // Recursively check nested objects
          for (const key in obj) {
            if (obj.hasOwnProperty(key) && typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
              const nestedValue = checkNested(obj[key], field, depth + 1);
              if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
                return nestedValue;
              }
            }
          }
          return undefined;
        };
        
        // Try each field variation
        for (const field of fieldVariations) {
          // Check nested paths (e.g., Patient.PatientId, Patient.patientId)
          if (field.includes('.')) {
            const parts = field.split('.');
            let nestedPathValue = data;
            for (const part of parts) {
              nestedPathValue = nestedPathValue?.[part];
              if (nestedPathValue === undefined || nestedPathValue === null) break;
            }
            if (nestedPathValue !== undefined && nestedPathValue !== null && nestedPathValue !== '') {
              return nestedPathValue;
            }
          }
          
          // Check direct field
          let value = data?.[field];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
          
          // Check nested objects
          const nestedValue = checkNested(data, field);
          if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
            return nestedValue;
          }
        }
        return defaultValue;
      };
      
      // Extract roomAdmissionId from response
      const roomAdmissionId = Number(admissionData.roomAdmissionId || admissionData.RoomAdmissionId || admissionData.room_admission_id || admissionData.Room_Admission_Id || admissionData.roomAdmissionID || admissionData.RoomAdmissionID || null);
      
      // Extract age with more variations
      const ageValue = extractField(admissionData, [
        'age', 'Age', 'patientAge', 'PatientAge', 'patient_age', 'Patient_Age',
        'AgeYears', 'ageYears', 'age_years', 'Age_Years'
      ], null);
      const age = ageValue !== null ? Number(ageValue) || 0 : 0;
      
      // Extract gender with more variations
      const gender = extractField(admissionData, [
        'gender', 'Gender', 'sex', 'Sex', 'patientGender', 'PatientGender',
        'patient_gender', 'Patient_Gender', 'GenderType', 'genderType', 'gender_type', 'Gender_Type'
      ], '');
      
      // Extract admittedBy with more variations
      const admittedBy = extractField(admissionData, [
        'admittedBy', 'AdmittedBy', 'admitted_by', 'Admitted_By',
        'admittedByDoctor', 'AdmittedByDoctor', 'admitted_by_doctor', 'Admitted_By_Doctor',
        'doctorName', 'DoctorName', 'doctor_name', 'Doctor_Name',
        'admittedByStaff', 'AdmittedByStaff', 'admitted_by_staff', 'Admitted_By_Staff',
        'admittedByUser', 'AdmittedByUser', 'admitted_by_user', 'Admitted_By_User',
        'admittedByPerson', 'AdmittedByPerson', 'admitted_by_person', 'Admitted_By_Person',
        'admittedByDoctorName', 'AdmittedByDoctorName', 'admitted_by_doctor_name'
      ], '');
      
      // Extract diagnosis with more variations
      const diagnosis = extractField(admissionData, [
        'diagnosis', 'Diagnosis', 'diagnosisDescription', 'DiagnosisDescription',
        'diagnosis_desc', 'Diagnosis_Desc', 'condition', 'Condition',
        'diagnosisText', 'DiagnosisText', 'diagnosis_text', 'Diagnosis_Text',
        'diagnosisName', 'DiagnosisName', 'diagnosis_name', 'Diagnosis_Name',
        'medicalDiagnosis', 'MedicalDiagnosis', 'medical_diagnosis', 'Medical_Diagnosis'
      ], '');
      
      console.log("caseSheetDetails: ************", admissionData.caseSheetDetails );
      // Normalize the response to match Admission interface
      const normalizedAdmission: Admission = {
        id: admissionData.id || admissionData.Id || roomAdmissionId || admissionId,
        roomAdmissionId: roomAdmissionId || undefined,
        admissionId: Number(roomAdmissionId || admissionData.admissionId || admissionData.AdmissionId || admissionData.id || admissionData.Id || admissionId),
        patientId: extractField(admissionData, [
          'patientId', 'PatientId', 'PatientID', 'patient_id', 'Patient_ID',
          'Patient.patientId', 'Patient.PatientId', 'patient.patientId',
          'PatientId', 'patientID', 'Patient_Id', 'patient_Id'
        ], ''),
        patientName: extractField(admissionData, [
          'patientName', 'PatientName', 'patient_name', 'Patient_Name',
          'patientFullName', 'PatientFullName', 'name', 'Name', 'fullName', 'FullName'
        ], ''),
        age: admissionData.age || admissionData.Age || admissionData.patientAge || admissionData.PatientAge || null,
        gender: gender,
        admissionDate: extractField(admissionData, [
          'admissionDate', 'AdmissionDate', 'admission_date', 'Admission_Date',
          'admitDate', 'AdmitDate', 'admit_date', 'Admit_Date'
        ], new Date().toISOString().split('T')[0]),
        // Extract roomType - prioritize roomType field from API
        roomType: normalizeRoomType(extractField(admissionData, [
          'roomType', 'RoomType', 'room_type', 'Room_Type',
          'roomCategory', 'RoomCategory', 'room_category', 'Room_Category',
          'roomTypeName', 'RoomTypeName', 'room_type_name', 'Room_Type_Name',
          'type', 'Type', 'category', 'Category'
        ], 'Regular Ward')),
        bedNumber: extractField(admissionData, [
          'bedNumber', 'BedNumber', 'bed_number', 'Bed_Number',
          'Bed_No', 'bedNo', 'BedNo', 'bed', 'Bed', 'bedId', 'BedId', 'bedID', 'BedID'
        ], ''),
        admittedBy: admittedBy,
        admittingDoctorName: extractField(admissionData, [
          'admittingDoctorName', 'AdmittingDoctorName', 'admitting_doctor_name', 'Admitting_Doctor_Name',
          'admittingDoctor', 'AdmittingDoctor', 'admitting_doctor', 'Admitting_Doctor',
          'doctorName', 'DoctorName', 'doctor_name', 'Doctor_Name',
          'admittedByDoctorName', 'AdmittedByDoctorName', 'admitted_by_doctor_name', 'Admitted_By_Doctor_Name'
        ], undefined),
        patientNo: extractField(admissionData, [
          'patientNo', 'PatientNo', 'patient_no', 'Patient_No',
          'patientNumber', 'PatientNumber', 'patient_number', 'Patient_Number',
          'patientRegNo', 'PatientRegNo', 'patient_reg_no', 'Patient_Reg_No'
        ], undefined),
        diagnosis: diagnosis,
        // Extract raw admissionStatus before normalizing
        admissionStatus: extractField(admissionData, [
          'admissionStatus', 'AdmissionStatus', 'admission_status', 'Admission_Status',
          'admissionStatusName', 'AdmissionStatusName', 'status', 'Status'
        ], '') || undefined,
        status: normalizeStatus(extractField(admissionData, [
          'status', 'Status', 'admissionStatus', 'AdmissionStatus',
          'admission_status', 'Admission_Status'
        ], 'Active')),
        scheduleOT: extractField(admissionData, [
          'scheduleOT', 'ScheduleOT', 'schedule_ot', 'Schedule_OT',
          'scheduleOt', 'ScheduleOt', 'scheduledOT', 'ScheduledOT',
          'scheduled_ot', 'Scheduled_OT', 'isScheduledOT', 'IsScheduledOT'
        ], undefined),
        estimatedStay: extractField(admissionData, [
          'estimatedStay', 'EstimatedStay', 'estimated_stay', 'Estimated_Stay',
          'estimatedDuration', 'EstimatedDuration', 'estimated_duration', 'Estimated_Duration'
        ], undefined),
        createdAt: extractField(admissionData, [
          'createdAt', 'CreatedAt', 'created_at', 'Created_At',
          'createdDate', 'CreatedDate', 'created_date', 'Created_Date'
        ], new Date().toISOString()),
        createdDate: extractField(admissionData, [
          'createdDate', 'CreatedDate', 'created_date', 'Created_Date',
          'admissionDate', 'AdmissionDate', 'admission_date', 'Admission_Date'
        ], undefined),
        caseSheetDetails: extractField(admissionData, [
          'caseSheetDetails', 'CaseSheetDetails', 'case_sheet_details', 'Case_Sheet_Details',
          'caseDetails', 'CaseDetails', 'case_details', 'Case_Details',
          'sheetDetails', 'SheetDetails', 'sheet_details', 'Sheet_Details',
          'admissionNotes', 'AdmissionNotes', 'admission_notes', 'Admission_Notes',
          'notes', 'Notes', 'caseNotes', 'CaseNotes', 'case_notes', 'Case_Notes'
        ], undefined),
        caseSheet: extractField(admissionData, [
          'caseSheet', 'CaseSheet', 'case_sheet', 'Case_Sheet',
          'caseSheetData', 'CaseSheetData', 'case_sheet_data', 'Case_Sheet_Data'
        ], undefined),
        isLinkedToICU: (() => {
          const value = extractField(admissionData, [
            'isLinkedToICU', 'IsLinkedToICU', 'is_linked_to_icu', 'Is_Linked_To_ICU',
            'linkedToICU', 'LinkedToICU', 'linked_to_icu', 'Linked_To_ICU',
            'isICULinked', 'IsICULinked', 'is_icu_linked', 'Is_ICU_Linked'
          ], undefined);
          if (value === undefined || value === null) return undefined;
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') {
            const lower = value.toLowerCase();
            return lower === 'true' || lower === 'yes' || lower === '1';
          }
          return Boolean(value);
        })(),
        patientType: extractField(admissionData, [
          'patientType', 'PatientType', 'patient_type', 'Patient_Type',
          'type', 'Type', 'admissionType', 'AdmissionType', 'admission_type', 'Admission_Type'
        ], undefined),
        patientAppointmentId: extractField(admissionData, [
          'patientAppointmentId', 'PatientAppointmentId', 'patient_appointment_id', 'Patient_Appointment_Id',
          'appointmentId', 'AppointmentId', 'appointment_id', 'Appointment_Id',
          'PatientAppointmentID', 'patientAppointmentID', 'Patient_Appointment_ID',
          'AppointmentID', 'appointmentID', 'Appointment_ID'
        ], undefined),
        appointmentTokenNo: extractField(admissionData, [
          'appointmentTokenNo', 'AppointmentTokenNo', 'appointment_token_no', 'Appointment_Token_No',
          'tokenNo', 'TokenNo', 'token_no', 'Token_No',
          'tokenNumber', 'TokenNumber', 'token_number', 'Token_Number',
          'appointmentToken', 'AppointmentToken', 'appointment_token', 'Appointment_Token'
        ], undefined),
        appointmentDate: extractField(admissionData, [
          'appointmentDate', 'AppointmentDate', 'appointment_date', 'Appointment_Date',
          'appointmentDateTime', 'AppointmentDateTime', 'appointment_date_time', 'Appointment_Date_Time',
          'apptDate', 'ApptDate', 'appt_date', 'Appt_Date'
        ], undefined),
        emergencyBedSlotId: extractField(admissionData, [
          'emergencyBedSlotId', 'EmergencyBedSlotId', 'emergency_bed_slot_id', 'Emergency_Bed_Slot_Id',
          'emergencyBedId', 'EmergencyBedId', 'emergency_bed_id', 'Emergency_Bed_Id',
          'bedSlotId', 'BedSlotId', 'bed_slot_id', 'Bed_Slot_Id',
          'EmergencyBedSlotID', 'emergencyBedSlotID', 'Emergency_Bed_Slot_ID',
          'EmergencyBedID', 'emergencyBedID', 'Emergency_Bed_ID'
        ], undefined),
        emergencyBedNo: extractField(admissionData, [
          'emergencyBedNo', 'EmergencyBedNo', 'emergency_bed_no', 'Emergency_Bed_No',
          'emergencyBedNumber', 'EmergencyBedNumber', 'emergency_bed_number', 'Emergency_Bed_Number',
          'bedNo', 'BedNo', 'bed_no', 'Bed_No', 'bedNumber', 'BedNumber', 'bed_number', 'Bed_Number'
        ], undefined),
        eBedSlotNo: extractField(admissionData, [
          'eBedSlotNo', 'EBedSlotNo', 'e_bed_slot_no', 'E_Bed_Slot_No',
          'bedSlotNo', 'BedSlotNo', 'bed_slot_no', 'Bed_Slot_No',
          'slotNo', 'SlotNo', 'slot_no', 'Slot_No',
          'emergencyBedSlotNo', 'EmergencyBedSlotNo', 'emergency_bed_slot_no', 'Emergency_Bed_Slot_No'
        ], undefined),
        emergencyAdmissionDate: extractField(admissionData, [
          'emergencyAdmissionDate', 'EmergencyAdmissionDate', 'emergency_admission_date', 'Emergency_Admission_Date',
          'emergencyAdmissionDateTime', 'EmergencyAdmissionDateTime', 'emergency_admission_date_time', 'Emergency_Admission_Date_Time',
          'emergencyAdmitDate', 'EmergencyAdmitDate', 'emergency_admit_date', 'Emergency_Admit_Date',
          'emergencyDate', 'EmergencyDate', 'emergency_date', 'Emergency_Date'
        ], undefined),
        roomVacantDate: extractField(admissionData, [
          'roomVacantDate', 'RoomVacantDate', 'room_vacant_date', 'Room_Vacant_Date',
          'vacantDate', 'VacantDate', 'vacant_date', 'Vacant_Date',
          'roomVacatedDate', 'RoomVacatedDate', 'room_vacated_date', 'Room_Vacated_Date'
        ], undefined),
        shiftToAnotherRoom: extractField(admissionData, [
          'shiftToAnotherRoom', 'ShiftToAnotherRoom', 'shift_to_another_room', 'Shift_To_Another_Room',
          'shiftToRoom', 'ShiftToRoom', 'shift_to_room', 'Shift_To_Room',
          'isShifted', 'IsShifted', 'is_shifted', 'Is_Shifted'
        ], undefined),
        shiftedTo: extractField(admissionData, [
          'shiftedTo', 'ShiftedTo', 'shifted_to', 'Shifted_To',
          'shiftedToRoom', 'ShiftedToRoom', 'shifted_to_room', 'Shifted_To_Room',
          'movedTo', 'MovedTo', 'moved_to', 'Moved_To'
        ], undefined),
        shiftedToDetails: extractField(admissionData, [
          'shiftedToDetails', 'ShiftedToDetails', 'shifted_to_details', 'Shifted_To_Details',
          'shiftDetails', 'ShiftDetails', 'shift_details', 'Shift_Details',
          'shiftNotes', 'ShiftNotes', 'shift_notes', 'Shift_Notes'
        ], undefined),
        otAdmissionId: extractField(admissionData, [
          'otAdmissionId', 'OTAdmissionId', 'ot_admission_id', 'OT_Admission_Id',
          'otAdmissionID', 'OTAdmissionID', 'ot_admission_id', 'OT_Admission_ID',
          'operationTheaterAdmissionId', 'OperationTheaterAdmissionId', 'operation_theater_admission_id', 'Operation_Theater_Admission_Id',
          'surgeryAdmissionId', 'SurgeryAdmissionId', 'surgery_admission_id', 'Surgery_Admission_Id'
        ], undefined),
        icuAdmissionId: extractField(admissionData, [
          'icuAdmissionId', 'ICUAdmissionId', 'icu_admission_id', 'ICU_Admission_Id',
          'icuAdmissionID', 'ICUAdmissionID', 'icu_admission_id', 'ICU_Admission_ID',
          'patientICUAdmissionId', 'PatientICUAdmissionId', 'patient_icu_admission_id', 'Patient_ICU_Admission_Id'
        ], undefined),
        billId: extractField(admissionData, [
          'billId', 'BillId', 'bill_id', 'Bill_ID',
          'billID', 'BillID', 'bill_id', 'Bill_ID',
          'billingId', 'BillingId', 'billing_id', 'Billing_ID',
          'invoiceId', 'InvoiceId', 'invoice_id', 'Invoice_ID'
        ], undefined),
      };
      
      console.log('Normalized admission from getById:', {
        age: normalizedAdmission.age,
        gender: normalizedAdmission.gender,
        admittedBy: normalizedAdmission.admittedBy,
        diagnosis: normalizedAdmission.diagnosis,
        caseSheetDetails: normalizedAdmission.caseSheetDetails,
        availableFields: Object.keys(admissionData).filter(k => 
          k.toLowerCase().includes('age') || 
          k.toLowerCase().includes('gender') || 
          k.toLowerCase().includes('admitted') || 
          k.toLowerCase().includes('diagnosis') ||
          k.toLowerCase().includes('case') ||
          k.toLowerCase().includes('sheet')
        ),
        rawAge: admissionData.age || admissionData.Age || admissionData.patientAge || admissionData.PatientAge,
        rawGender: admissionData.gender || admissionData.Gender || admissionData.sex || admissionData.Sex,
        rawAdmittedBy: admissionData.admittedBy || admissionData.AdmittedBy || admissionData.admitted_by || admissionData.Admitted_By,
        rawDiagnosis: admissionData.diagnosis || admissionData.Diagnosis || admissionData.diagnosisDescription || admissionData.DiagnosisDescription,
        rawCaseSheetDetails: admissionData.caseSheetDetails || admissionData.CaseSheetDetails || admissionData.case_sheet_details || admissionData.Case_Sheet_Details,
        full: normalizedAdmission
      });
      
      return normalizedAdmission;
    } catch (error: any) {
      console.error(`Error fetching admission with id ${admissionId}:`, error);
      
      // Provide more detailed error message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || error.message || `Failed to fetch admission with id ${admissionId}`;
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  },

  async getByPatientId(patientId: string): Promise<Admission[]> {
    try {
      const response = await apiRequest<any>(`/admissions?patientId=${encodeURIComponent(patientId)}`);
      const admissionsData = response?.data || response || [];
      
      if (Array.isArray(admissionsData)) {
        // Helper function to extract value with multiple field name variations
        const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
          for (const field of fieldVariations) {
            const value = data?.[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          return defaultValue;
        };
        
        return admissionsData.map((admission: any, index: number) => {
          // Extract roomAdmissionId first (primary identifier), then fallback to admissionId
          const roomAdmissionId = Number(admission.roomAdmissionId || admission.RoomAdmissionId || admission.room_admission_id || admission.Room_Admission_Id || admission.roomAdmissionID || admission.RoomAdmissionID || null);
          const admissionId = Number(admission.admissionId || admission.AdmissionId || admission.id || admission.Id || (1000000 + index));
          return {
            id: admission.id || admission.Id || roomAdmissionId || admissionId || (1000000 + index),
            roomAdmissionId: roomAdmissionId || undefined,
            admissionId: roomAdmissionId || admissionId, // Use roomAdmissionId as primary, fallback to admissionId
            patientId: extractField(admission, ['patientId', 'PatientId', 'PatientID', 'patient_id', 'Patient_ID'], patientId),
            patientName: extractField(admission, [
              'patientName', 'PatientName', 'patient_name', 'Patient_Name',
              'patientFullName', 'PatientFullName', 'name', 'Name', 'fullName', 'FullName'
            ], ''),
            age: Number(extractField(admission, [
              'age', 'Age', 'patientAge', 'PatientAge', 'patient_age', 'Patient_Age'
            ], 0)) || 0,
            gender: extractField(admission, [
              'gender', 'Gender', 'sex', 'Sex', 'patientGender', 'PatientGender',
              'patient_gender', 'Patient_Gender'
            ], ''),
            admissionDate: extractField(admission, [
              'admissionDate', 'AdmissionDate', 'admission_date', 'Admission_Date',
              'admitDate', 'AdmitDate', 'admit_date', 'Admit_Date'
            ], new Date().toISOString().split('T')[0]),
            // Extract roomType - prioritize roomType field from API
            roomType: normalizeRoomType(extractField(admission, [
              'roomType', 'RoomType', 'room_type', 'Room_Type',
              'roomCategory', 'RoomCategory', 'room_category', 'Room_Category',
              'roomTypeName', 'RoomTypeName', 'room_type_name', 'Room_Type_Name',
              'type', 'Type', 'category', 'Category'
            ], 'Regular Ward')),
            bedNumber: extractField(admission, [
              'bedNumber', 'BedNumber', 'bed_number', 'Bed_Number',
              'Bed_No', 'bedNo', 'BedNo', 'bed', 'Bed', 'bedId', 'BedId', 'bedID', 'BedID'
            ], ''),
            admittedBy: extractField(admission, [
              'admittedBy', 'AdmittedBy', 'admitted_by', 'Admitted_By',
              'admittedByDoctor', 'AdmittedByDoctor', 'admitted_by_doctor',
              'doctorName', 'DoctorName', 'doctor_name', 'Doctor_Name',
              'admittedByStaff', 'AdmittedByStaff', 'admitted_by_staff',
              'admittedByUser', 'AdmittedByUser', 'admitted_by_user'
            ], ''),
            diagnosis: extractField(admission, [
              'diagnosis', 'Diagnosis', 'diagnosisDescription', 'DiagnosisDescription',
              'diagnosis_desc', 'Diagnosis_Desc', 'condition', 'Condition'
            ], ''),
            // Extract raw admissionStatus before normalizing
            admissionStatus: extractField(admission, [
              'admissionStatus', 'AdmissionStatus', 'admission_status', 'Admission_Status',
              'admissionStatusName', 'AdmissionStatusName', 'status', 'Status'
            ], '') || undefined,
            status: normalizeStatus(extractField(admission, [
              'status', 'Status', 'admissionStatus', 'AdmissionStatus',
              'admission_status', 'Admission_Status'
            ], 'Active')),
            estimatedStay: extractField(admission, [
              'estimatedStay', 'EstimatedStay', 'estimated_stay', 'Estimated_Stay',
              'estimatedDuration', 'EstimatedDuration', 'estimated_duration', 'Estimated_Duration'
            ], undefined),
            createdAt: extractField(admission, [
              'createdAt', 'CreatedAt', 'created_at', 'Created_At',
              'createdDate', 'CreatedDate', 'created_date', 'Created_Date'
            ], new Date().toISOString()),
            createdDate: extractField(admission, [
              'createdDate', 'CreatedDate', 'created_date', 'Created_Date',
              'admissionDate', 'AdmissionDate', 'admission_date', 'Admission_Date'
            ], undefined),
          };
        }) as Admission[];
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching admissions by patientId ${patientId}:`, error);
      return [];
    }
  },

  async create(data: CreateAdmissionDto): Promise<Admission> {
    try {
      // Validate required fields
      if (!data.patientId || !data.patientName || !data.bedNumber || !data.admittedBy) {
        throw new Error('PatientId, PatientName, BedNumber, and AdmittedBy are required');
      }

      // Convert camelCase to PascalCase for backend API
      const backendData: any = {
        PatientId: data.patientId.trim(),
        PatientName: data.patientName.trim(),
        Age: Number(data.age),
        Gender: data.gender.trim(),
        AdmissionDate: data.admissionDate.trim(),
        RoomType: data.roomType,
        BedNumber: data.bedNumber.trim(),
        AdmittedBy: data.admittedBy.trim(),
        Diagnosis: data.diagnosis.trim(),
       patientType: data.patientType,
       patientAppointmentId: data.patientAppointmentId,
       emergencyAdmissionId: data.emergencyAdmissionId,
       emergencyBedNo: data.emergencyBedNo,
       
       roomBedsId: data.roomBedsId,
       doctorId: data.doctorId,
       admittedByDoctorId: data.admittedByDoctorId,
       roomAllocationDate: data.roomAllocationDate, 
       caseSheet: data.caseSheet,
       caseSheetDetails: data.caseSheetDetails,
       isLinkedToICU: data.isLinkedToICU,
       scheduleOT: data.scheduleOT,
       otAdmissionId: data.otAdmissionId,
       icuAdmissionId: data.icuAdmissionId,
       billId: data.billId,
       allocatedBy: data.allocatedBy,
       allocatedAt: data.allocatedAt
      };
      
      if (data.status !== undefined && data.status !== null) {
        backendData.Status = data.status;
      } else {
        backendData.Status = 'Active';
      }
      
      if (data.estimatedStay !== undefined && data.estimatedStay !== null) {
        backendData.EstimatedStay = data.estimatedStay.trim();
      }

      // Add new fields if present in data
      if ((data as any).roomBedsId) {
        backendData.RoomBedsId = Number((data as any).roomBedsId);
      }
      if ((data as any).doctorId || (data as any).admittedByDoctorId) {
        backendData.AdmittingDoctorId = Number((data as any).doctorId || (data as any).admittedByDoctorId);
      }
      if ((data as any).roomAllocationDate) {
        backendData.RoomAllocationDate = (data as any).roomAllocationDate.trim();
      }

      console.log('Creating admission with data:', JSON.stringify(backendData, null, 2));

      // Call the actual API endpoint
      const response = await apiRequest<any>('/room-admissions', {
        method: 'POST',
        body: JSON.stringify(backendData),
      });

      console.log('Create admission API response:', response);

      // Handle different response structures: { data: {...} } or direct object
      const admissionData = response?.data || response;

      if (!admissionData) {
        throw new Error('No admission data received from API');
      }

      // Helper function to extract value with multiple field name variations
      const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
        if (!Array.isArray(fieldVariations)) {
          console.error('extractField: fieldVariations must be an array', fieldVariations);
          return defaultValue;
        }
        for (const field of fieldVariations) {
          const value = data?.[field];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
        return defaultValue;
      };

      // Extract roomAdmissionId from response
      const roomAdmissionId = Number(admissionData.roomAdmissionId || admissionData.RoomAdmissionId || admissionData.room_admission_id || admissionData.Room_Admission_Id || admissionData.roomAdmissionID || admissionData.RoomAdmissionID || null);
      
      // Normalize the response to match Admission interface
      const normalizedAdmission: Admission = {
        id: admissionData.id || admissionData.Id || roomAdmissionId || 0,
        roomAdmissionId: roomAdmissionId || undefined,
        admissionId: Number(roomAdmissionId || admissionData.admissionId || admissionData.AdmissionId || admissionData.id || admissionData.Id || 0),
        patientId: admissionData.patientId || admissionData.PatientId || data.patientId,
        patientName: admissionData.patientName || admissionData.PatientName || data.patientName,
        age: Number(admissionData.age || admissionData.Age || data.age),
        gender: admissionData.gender || admissionData.Gender || data.gender,
        admissionDate: admissionData.admissionDate || admissionData.AdmissionDate || data.admissionDate,
        // Extract roomType - prioritize roomType field from API
        roomType: normalizeRoomType(extractField(admissionData, [
          'roomType', 'RoomType', 'room_type', 'Room_Type',
          'roomCategory', 'RoomCategory', 'room_category', 'Room_Category',
          'roomTypeName', 'RoomTypeName', 'room_type_name', 'Room_Type_Name',
          'type', 'Type', 'category', 'Category'
        ], data.roomType || 'Regular Ward')),
        bedNumber: admissionData.bedNumber || admissionData.BedNumber || data.bedNumber,
        admittedBy: admissionData.admittedBy || admissionData.AdmittedBy || data.admittedBy,
        diagnosis: admissionData.diagnosis || admissionData.Diagnosis || data.diagnosis,
        // Extract raw admissionStatus before normalizing
        admissionStatus: extractField(admissionData, [
          'admissionStatus', 'AdmissionStatus', 'admission_status', 'Admission_Status',
          'admissionStatusName', 'AdmissionStatusName', 'status', 'Status'
        ], '') || undefined,
        status: normalizeStatus(extractField(admissionData, [
          'status', 'Status', 'admissionStatus', 'AdmissionStatus',
          'admission_status', 'Admission_Status'
        ], 'Active')),
        scheduleOT: extractField(admissionData, [
          'scheduleOT', 'ScheduleOT', 'schedule_ot', 'Schedule_OT',
          'scheduleOt', 'ScheduleOt', 'scheduledOT', 'ScheduledOT',
          'scheduled_ot', 'Scheduled_OT', 'isScheduledOT', 'IsScheduledOT'
        ], undefined),
        estimatedStay: admissionData.estimatedStay || admissionData.EstimatedStay || data.estimatedStay,
        createdAt: admissionData.createdAt || admissionData.CreatedAt || new Date().toISOString(),
        createdDate: admissionData.createdDate || admissionData.CreatedDate || admissionData.admissionDate || admissionData.AdmissionDate || undefined,
      };

      return normalizedAdmission;
    } catch (error: any) {
      console.error('Error creating admission:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // Re-throw API errors with detailed message
      if (error.name === 'ApiError' || error.status) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || errorData?.error || error.message || 'Failed to create admission';
        const errorDetails = errorData?.errors || errorData?.details;
        
        let fullErrorMessage = errorMessage;
        if (errorDetails) {
          if (Array.isArray(errorDetails)) {
            fullErrorMessage += ': ' + errorDetails.join(', ');
          } else if (typeof errorDetails === 'object') {
            fullErrorMessage += ': ' + JSON.stringify(errorDetails);
          } else {
            fullErrorMessage += ': ' + errorDetails;
          }
        }
        
        throw new Error(fullErrorMessage);
      }
      
      // Re-throw validation errors
      if (error instanceof Error) {
        throw error;
      }
      
      // Fallback error
      throw new Error('Failed to create admission. Please check the console for details.');
    }
  },

  async update(data: UpdateAdmissionDto): Promise<Admission> {
    try {
      // Validate required fields - use roomAdmissionId for update
      if (!data.roomAdmissionId || data.roomAdmissionId <= 0) {
        console.error('Invalid Room Admission ID in update request:', data.roomAdmissionId, 'Full update data:', data);
        throw new Error('Valid Room Admission ID is required for update');
      }
      
      console.log('Updating admission with RoomAdmissionId:', data.roomAdmissionId);

      // Convert frontend camelCase to backend PascalCase
      const backendData: any = {};
      
      if (data.patientId !== undefined) {
        backendData.PatientId = data.patientId.trim();
      }
      if (data.patientName !== undefined) {
        backendData.PatientName = data.patientName.trim();
      }
      if (data.age !== undefined) {
        backendData.Age = Number(data.age);
      }
      if (data.gender !== undefined) {
        backendData.Gender = data.gender.trim();
      }
      if (data.admissionDate !== undefined) {
        backendData.AdmissionDate = data.admissionDate.trim();
      }
      if (data.roomType !== undefined) {
        backendData.RoomType = data.roomType;
      }
      if (data.bedNumber !== undefined) {
        backendData.BedNumber = data.bedNumber.trim();
      }
      if (data.admittedBy !== undefined) {
        backendData.AdmittedBy = data.admittedBy.trim();
      }
      if (data.diagnosis !== undefined) {
        backendData.Diagnosis = data.diagnosis.trim();
      }
      if (data.status !== undefined && data.status !== null) {
        backendData.Status = data.status;
      }
      if (data.estimatedStay !== undefined && data.estimatedStay !== null) {
        backendData.EstimatedStay = data.estimatedStay.trim();
      }
      if (data.scheduleOT !== undefined && data.scheduleOT !== null) {
        // Convert boolean or string to "Yes"/"No" format
        if (typeof data.scheduleOT === 'boolean') {
          backendData.ScheduleOT = data.scheduleOT ? 'Yes' : 'No';
        } else {
          backendData.ScheduleOT = String(data.scheduleOT).trim();
        }
      }
      
      console.log('Updating admission with data:', JSON.stringify(backendData, null, 2));

      // Call the actual API endpoint - use room-admissions prefix and roomAdmissionId in the URL
      const response = await apiRequest<any>(`/room-admissions/${data.roomAdmissionId}`, {
        method: 'PUT',
        body: JSON.stringify(backendData),
      });

      console.log('Update admission API response:', response);

      // Handle different response structures: { data: {...} } or direct object
      const admissionData = response?.data || response;

      if (!admissionData) {
        throw new Error('No admission data received from API');
      }

      // Helper function to extract value with multiple field name variations
      const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
        if (!Array.isArray(fieldVariations)) {
          console.error('extractField: fieldVariations must be an array', fieldVariations);
          return defaultValue;
        }
        for (const field of fieldVariations) {
          const value = data?.[field];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
        return defaultValue;
      };

      // Extract roomAdmissionId from response
      const roomAdmissionId = Number(admissionData.roomAdmissionId || admissionData.RoomAdmissionId || admissionData.room_admission_id || admissionData.Room_Admission_Id || admissionData.roomAdmissionID || admissionData.RoomAdmissionID || null);
      
      // Normalize the response to match Admission interface
      const normalizedAdmission: Admission = {
        id: admissionData.id || admissionData.Id || roomAdmissionId || 0,
        roomAdmissionId: roomAdmissionId || undefined,
        admissionId: Number(roomAdmissionId || admissionData.admissionId || admissionData.AdmissionId || admissionData.id || admissionData.Id || 0),
        patientId: admissionData.patientId || admissionData.PatientId || data.patientId || '',
        patientName: admissionData.patientName || admissionData.PatientName || data.patientName || '',
        age: Number(admissionData.age || admissionData.Age || data.age || 0),
        gender: admissionData.gender || admissionData.Gender || data.gender || '',
        admissionDate: admissionData.admissionDate || admissionData.AdmissionDate || data.admissionDate || new Date().toISOString().split('T')[0],
        // Extract roomType - prioritize roomType field from API
        roomType: normalizeRoomType(extractField(admissionData, [
          'roomType', 'RoomType', 'room_type', 'Room_Type',
          'roomCategory', 'RoomCategory', 'room_category', 'Room_Category',
          'roomTypeName', 'RoomTypeName', 'room_type_name', 'Room_Type_Name',
          'type', 'Type', 'category', 'Category'
        ], data.roomType || 'Regular Ward')),
        bedNumber: admissionData.bedNumber || admissionData.BedNumber || data.bedNumber || '',
        admittedBy: admissionData.admittedBy || admissionData.AdmittedBy || data.admittedBy || '',
        diagnosis: admissionData.diagnosis || admissionData.Diagnosis || data.diagnosis || '',
        // Extract raw admissionStatus before normalizing
        admissionStatus: extractField(admissionData, [
          'admissionStatus', 'AdmissionStatus', 'admission_status', 'Admission_Status',
          'admissionStatusName', 'AdmissionStatusName', 'status', 'Status'
        ], '') || undefined,
        status: normalizeStatus(extractField(admissionData, [
          'status', 'Status', 'admissionStatus', 'AdmissionStatus',
          'admission_status', 'Admission_Status'
        ], 'Active')),
        scheduleOT: extractField(admissionData, [
          'scheduleOT', 'ScheduleOT', 'schedule_ot', 'Schedule_OT',
          'scheduleOt', 'ScheduleOt', 'scheduledOT', 'ScheduledOT',
          'scheduled_ot', 'Scheduled_OT', 'isScheduledOT', 'IsScheduledOT'
        ], undefined),
        estimatedStay: admissionData.estimatedStay || admissionData.EstimatedStay || data.estimatedStay,
        createdAt: admissionData.createdAt || admissionData.CreatedAt || new Date().toISOString(),
        createdDate: admissionData.createdDate || admissionData.CreatedDate || admissionData.admissionDate || admissionData.AdmissionDate || undefined,
      };

      return normalizedAdmission;
    } catch (error: any) {
      console.error('Error updating admission:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // Re-throw API errors with detailed message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || errorData?.error || error.message || 'Failed to update admission';
        const errorDetails = errorData?.errors || errorData?.details;
        
        let fullErrorMessage = errorMessage;
        if (errorDetails) {
          if (Array.isArray(errorDetails)) {
            fullErrorMessage += ': ' + errorDetails.join(', ');
          } else if (typeof errorDetails === 'object') {
            fullErrorMessage += ': ' + JSON.stringify(errorDetails);
          } else {
            fullErrorMessage += ': ' + errorDetails;
          }
        }
        
        throw new Error(fullErrorMessage);
      }
      
      // Re-throw validation errors
      if (error instanceof Error) {
        throw error;
      }
      
      // Fallback error
      throw new Error('Failed to update admission. Please check the console for details.');
    }
  },

  async delete(admissionId: number): Promise<void> {
    try {
      // Validate ID before making API call
      if (!admissionId || admissionId <= 0) {
        throw new Error(`Invalid admission ID: ${admissionId}. Cannot delete admission.`);
      }
      
      console.log(`Deleting admission with AdmissionId: ${admissionId}`);
      
      // Call the actual API endpoint
      const response = await apiRequest<any>(`/admissions/${admissionId}`, { 
        method: 'DELETE',
      });
      
      console.log('Delete admission API response:', response);
    } catch (error: any) {
      console.error(`Error deleting admission with id ${admissionId}:`, error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // Re-throw API errors with detailed message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || errorData?.error || error.message || `Failed to delete admission with id ${admissionId}`;
        const errorDetails = errorData?.errors || errorData?.details;
        
        let fullErrorMessage = errorMessage;
        if (errorDetails) {
          if (Array.isArray(errorDetails)) {
            fullErrorMessage += ': ' + errorDetails.join(', ');
          } else if (typeof errorDetails === 'object') {
            fullErrorMessage += ': ' + JSON.stringify(errorDetails);
          } else {
            fullErrorMessage += ': ' + errorDetails;
          }
        }
        
        throw new Error(fullErrorMessage);
      }
      
      throw error;
    }
  },

  async getRoomCapacityOverview(): Promise<RoomCapacityOverview> {
    try {
      console.log('Room capacity overview API request STARTED********************:');
      const response = await apiRequest<any>('/room-admissions/capacity-overview');
      console.log('Room capacity overview API response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures: { data: {...} } or direct object
      const capacityData = response?.data || response;
      console.log('Room capacity overview capacityData:', JSON.stringify(capacityData, null, 2));
      
      if (!capacityData) {
        throw new Error('No room capacity data received from API');
      }
      
      // Helper function to extract numeric value from various field name formats
      const extractValue = (item: any, fieldVariations: string[]): number => {
        for (const field of fieldVariations) {
          const value = item?.[field];
          if (value !== undefined && value !== null) {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
              return numValue;
            }
          }
        }
        return 0;
      };
      
      // Helper function to normalize room type key
      const normalizeRoomTypeKey = (key: string): 'Regular Ward' | 'Special Shared Room' | 'Special Room' => {
        if (!key) return 'Regular Ward';
        const keyLower = key.toLowerCase().trim();
        if (keyLower.includes('regular') && keyLower.includes('ward')) return 'Regular Ward';
        if (keyLower.includes('special') && keyLower.includes('shared')) return 'Special Shared Room';
        if (keyLower.includes('special') && !keyLower.includes('shared')) return 'Special Room';
        // Default mapping
        return normalizeRoomType(key) as 'Regular Ward' | 'Special Shared Room' | 'Special Room';
      };
      
      // Initialize normalized capacity with defaults
      const normalizedCapacity: RoomCapacityOverview = {
        'Regular Ward': { total: 0, occupied: 0, available: 0 },
        'Special Shared Room': { total: 0, occupied: 0, available: 0 },
        'Special Room': { total: 0, occupied: 0, available: 0 },
      };
      
      // If the API returns data as an array
      if (Array.isArray(capacityData)) {
        console.log('Processing capacity data as array');
        capacityData.forEach((item: any) => {
          const roomType = normalizeRoomTypeKey(item.roomType || item.RoomType || item.type || item.Type || item.roomTypeName || item.RoomTypeName || '');
          if (roomType) {
            const total = extractValue(item, ['total', 'Total', 'totalBeds', 'TotalBeds', 'totalBedsCount', 'TotalBedsCount']);
            const occupied = extractValue(item, ['occupied', 'Occupied', 'occupiedBeds', 'OccupiedBeds', 'occupiedBedsCount', 'OccupiedBedsCount']);
            const available = extractValue(item, ['available', 'Available', 'availableBeds', 'AvailableBeds', 'availableBedsCount', 'AvailableBedsCount']);
            
            normalizedCapacity[roomType] = {
              total: total,
              occupied: occupied,
              available: available > 0 ? available : (total - occupied), // Calculate if not provided
            };
            console.log(`Mapped ${roomType}:`, normalizedCapacity[roomType]);
          }
        });
      } else if (typeof capacityData === 'object' && capacityData !== null) {
        console.log('Processing capacity data as object');
        // Try to find room capacity data in any format
        Object.keys(capacityData).forEach((key) => {
          const roomType = normalizeRoomTypeKey(key);
          const item = capacityData[key];
          
          if (item && typeof item === 'object') {
            const total = extractValue(item, ['total', 'Total', 'totalBeds', 'TotalBeds', 'totalBedsCount', 'TotalBedsCount', 'TotalBedCount']);
            const occupied = extractValue(item, ['occupied', 'Occupied', 'occupiedBeds', 'OccupiedBeds', 'occupiedBedsCount', 'OccupiedBedsCount', 'OccupiedBedCount']);
            const available = extractValue(item, ['available', 'Available', 'availableBeds', 'AvailableBeds', 'availableBedsCount', 'AvailableBedsCount', 'AvailableBedCount']);
            
            normalizedCapacity[roomType] = {
              total: total,
              occupied: occupied,
              available: available > 0 ? available : (total - occupied), // Calculate if not provided
            };
            console.log(`Mapped ${roomType} from key "${key}":`, normalizedCapacity[roomType]);
          } else if (typeof item === 'number') {
            // Handle case where values might be directly numbers
            console.log(`Found numeric value for key "${key}":`, item);
          }
        });
      }
      
      console.log('Final normalized capacity:', JSON.stringify(normalizedCapacity, null, 2));
      return normalizedCapacity;
    } catch (error: any) {
      console.error('Error fetching room capacity overview:', error);
      
      // If stub data is enabled and API fails, return stub data
      if (ENABLE_STUB_DATA) {
        console.warn('No room capacity data received from API, using stub data');
        await delay(300);
        return { ...stubRoomCapacity };
      }
      
      // Provide more detailed error message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || error.message || 'Failed to fetch room capacity overview';
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      console.log('Dashboard metrics API request STARTED********************:');
      const response = await apiRequest<any>('/room-admissions/dashboard-metrics');
      console.log('Dashboard metrics API response (RAW):', JSON.stringify(response, null, 2));

      // Handle different response structures: { data: {...} } or direct object
      const metricsData = response?.data || response;
      console.log('Dashboard metrics data:', JSON.stringify(metricsData, null, 2));

      if (!metricsData) {
        throw new Error('No dashboard metrics data received from API');
      }

      // Helper function to extract numeric value from various field name formats
      const extractValue = (data: any, fieldVariations: string[], defaultValue: number = 0): number => {
        for (const field of fieldVariations) {
          const value = data?.[field];
          if (value !== undefined && value !== null) {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
              return numValue;
            }
          }
        }
        return defaultValue;
      };

      // Map dashboard metrics with various field name variations
      const mappedMetrics: DashboardMetrics = {
        totalAdmissions: extractValue(metricsData, [
          'totalAdmissions', 'TotalAdmissions', 'total_admissions', 'Total_Admissions',
          'totalAdmission', 'TotalAdmission', 'total_admission', 'Total_Admission',
          'admissions', 'Admissions', 'admissionCount', 'AdmissionCount', 'admission_count', 'Admission_Count'
        ], 0),
        activePatients: extractValue(metricsData, [
          'activePatients', 'ActivePatients', 'active_patients', 'Active_Patients',
          'activePatient', 'ActivePatient', 'active_patient', 'Active_Patient',
          'activeCount', 'ActiveCount', 'active_count', 'Active_Count',
          'currentPatients', 'CurrentPatients', 'current_patients', 'Current_Patients'
        ], 0),
        bedOccupancy: extractValue(metricsData, [
          'bedOccupancy', 'BedOccupancy', 'bed_occupancy', 'Bed_Occupancy',
          'occupancyRate', 'OccupancyRate', 'occupancy_rate', 'Occupancy_Rate',
          'occupancy', 'Occupancy', 'occupancyPercentage', 'OccupancyPercentage', 'occupancy_percentage', 'Occupancy_Percentage'
        ], 0),
        totalOccupied: extractValue(metricsData, [
          'totalOccupied', 'TotalOccupied', 'total_occupied', 'Total_Occupied',
          'occupiedBeds', 'OccupiedBeds', 'occupied_beds', 'Occupied_Beds',
          'occupied', 'Occupied', 'occupiedCount', 'OccupiedCount', 'occupied_count', 'Occupied_Count'
        ], 0),
        totalCapacity: extractValue(metricsData, [
          'totalCapacity', 'TotalCapacity', 'total_capacity', 'Total_Capacity',
          'totalBeds', 'TotalBeds', 'total_beds', 'Total_Beds',
          'capacity', 'Capacity', 'bedCapacity', 'BedCapacity', 'bed_capacity', 'Bed_Capacity'
        ], 0),
        availableBeds: extractValue(metricsData, [
          'availableBeds', 'AvailableBeds', 'available_beds', 'Available_Beds',
          'available', 'Available', 'availableCount', 'AvailableCount', 'available_count', 'Available_Count',
          'freeBeds', 'FreeBeds', 'free_beds', 'Free_Beds'
        ], 0),
        avgStay: extractValue(metricsData, [
          'avgStay', 'AvgStay', 'avg_stay', 'Avg_Stay', 'Average_Stay',
          'averageStay', 'AverageStay', 'average_stay', 'Average_Stay',
          'avgDuration', 'AvgDuration', 'avg_duration', 'Avg_Duration',
          'averageDuration', 'AverageDuration', 'average_duration', 'Average_Duration',
          'meanStay', 'MeanStay', 'mean_stay', 'Mean_Stay'
        ], 0),
      };

      // If availableBeds is not provided, calculate it from totalCapacity and totalOccupied
      if (mappedMetrics.availableBeds === 0 && mappedMetrics.totalCapacity > 0) {
        mappedMetrics.availableBeds = mappedMetrics.totalCapacity - mappedMetrics.totalOccupied;
      }

      // If bedOccupancy is not provided, calculate it from totalOccupied and totalCapacity
      if (mappedMetrics.bedOccupancy === 0 && mappedMetrics.totalCapacity > 0) {
        mappedMetrics.bedOccupancy = Math.round((mappedMetrics.totalOccupied / mappedMetrics.totalCapacity) * 100);
      }

      console.log('Mapped dashboard metrics:', mappedMetrics);
      return mappedMetrics;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      
      // If stub data is enabled, return stub data
      if (ENABLE_STUB_DATA) {
        console.log('Using stub dashboard metrics data');
        await delay(300);
        return {
          totalAdmissions: 0,
          activePatients: 0,
          bedOccupancy: 0,
          totalOccupied: 0,
          totalCapacity: 0,
          availableBeds: 0,
          avgStay: 0,
        };
      }
      
      // Provide more detailed error message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || error.message || 'Failed to fetch dashboard metrics';
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  },

  async getPatientLabTests(roomAdmissionId: number): Promise<PatientLabTest[]> {
    try {
      // Validate ID before making API call
      if (!roomAdmissionId || roomAdmissionId <= 0) {
        throw new Error(`Invalid room admission ID: ${roomAdmissionId}. Cannot fetch patient lab tests.`);
      }
      
      console.log(`Fetching patient lab tests for roomAdmissionId: ${roomAdmissionId}`);
      const response = await apiRequest<any>(`/patient-lab-tests/with-details/room-admission/${roomAdmissionId}`);
      console.log('Patient lab tests API response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures: 
      // - { data: { patientLabTests: [...] } } or { patientLabTests: [...] }
      // - { data: [...] } or direct array
      // - { labTests: [...] } or other nested structures
      let labTestsData: any[] = [];
      
      if (Array.isArray(response)) {
        labTestsData = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          labTestsData = response.data;
        } else if (response.data.patientLabTests && Array.isArray(response.data.patientLabTests)) {
          labTestsData = response.data.patientLabTests;
        } else if (response.data.labTests && Array.isArray(response.data.labTests)) {
          labTestsData = response.data.labTests;
        } else if (response.data.PatientLabTests && Array.isArray(response.data.PatientLabTests)) {
          labTestsData = response.data.PatientLabTests;
        }
      } else if (response?.patientLabTests && Array.isArray(response.patientLabTests)) {
        labTestsData = response.patientLabTests;
      } else if (response?.labTests && Array.isArray(response.labTests)) {
        labTestsData = response.labTests;
      } else if (response?.PatientLabTests && Array.isArray(response.PatientLabTests)) {
        labTestsData = response.PatientLabTests;
      }
      
      if (!Array.isArray(labTestsData) || labTestsData.length === 0) {
        console.warn('Patient lab tests response is not an array or is empty:', response);
        return [];
      }
      
      // Helper function to extract value with multiple field name variations (including nested objects)
      const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
        if (!Array.isArray(fieldVariations)) {
          console.error('extractField: fieldVariations must be an array', fieldVariations);
          return defaultValue;
        }
        for (const field of fieldVariations) {
          // Check direct field
          let value = data?.[field];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
          
          // Check nested paths (e.g., Patient.PatientId, LabTest.TestName)
          if (field.includes('.')) {
            const parts = field.split('.');
            let nestedValue = data;
            for (const part of parts) {
              nestedValue = nestedValue?.[part];
              if (nestedValue === undefined || nestedValue === null) break;
            }
            if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
              return nestedValue;
            }
          }
          
          // Check nested objects (Patient, LabTest, etc.)
          if (data?.Patient?.[field]) {
            value = data.Patient[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          if (data?.LabTest?.[field]) {
            value = data.LabTest[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          if (data?.patient?.[field]) {
            value = data.patient[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          if (data?.labTest?.[field]) {
            value = data.labTest[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
        }
        return defaultValue;
      };
      
      // Log raw response for debugging
      if (labTestsData.length > 0) {
        console.log('Raw lab test data sample (first item):', JSON.stringify(labTestsData[0], null, 2));
      }
      
      // Normalize the response to match PatientLabTest interface
      const normalizedLabTests: PatientLabTest[] = labTestsData.map((labTest: any) => {
        const patientLabTestId = Number(extractField(labTest, [
          'patientLabTestId', 'PatientLabTestId', 'patient_lab_test_id', 'Patient_Lab_Test_Id',
          'id', 'Id', 'ID'
        ], 0));
        
        // Extract Lab Test ID with multiple variations (including nested LabTest object)
        const labTestIdValue = Number(extractField(labTest, [
          'labTestId', 'LabTestId', 'lab_test_id', 'Lab_Test_Id',
          'labTestsId', 'LabTestsId', 'lab_tests_id', 'Lab_Tests_Id',
          'labTestID', 'LabTestID', 'testId', 'TestId', 'test_id', 'Test_ID',
          'LabTest.labTestId', 'LabTest.LabTestId', 'labTest.labTestId', 'labTest.LabTestId',
          'LabTest.labTestsId', 'LabTest.LabTestsId', 'labTest.labTestsId', 'labTest.LabTestsId',
          'LabTest.testId', 'LabTest.TestId', 'labTest.testId', 'labTest.TestId'
        ], 0));
        
        // Extract Lab Test Name with multiple variations
        const labTestName = extractField(labTest, [
          'labTestName', 'LabTestName', 'lab_test_name', 'Lab_Test_Name',
          'testName', 'TestName', 'test_name', 'Test_Name',
          'name', 'Name', 'testName', 'TestName'
        ], '');
        
        // Extract Test Name (for backward compatibility, including nested LabTest object)
        const testName = labTestName || extractField(labTest, [
          'testName', 'TestName', 'test_name', 'Test_Name',
          'name', 'Name',
          'LabTest.testName', 'LabTest.TestName', 'labTest.testName', 'labTest.TestName',
          'LabTest.name', 'LabTest.Name', 'labTest.name', 'labTest.Name'
        ], '');
        
        // Extract Category with multiple variations
        const testCategory = extractField(labTest, [
          'testCategory', 'TestCategory', 'test_category', 'Test_Category',
          'category', 'Category', 'labTestCategory', 'LabTestCategory',
          'lab_test_category', 'Lab_Test_Category', 'testType', 'TestType',
          'test_type', 'Test_Type'
        ], '');
        
        // Extract Test ID (displayTestId) with multiple variations
        const displayTestId = extractField(labTest, [
          'displayTestId', 'DisplayTestId', 'display_test_id', 'Display_Test_Id',
          'testId', 'TestId', 'test_id', 'Test_ID',
          'patientLabTestId', 'PatientLabTestId', 'patient_lab_test_id', 'Patient_Lab_Test_Id',
          'displayTestID', 'DisplayTestID', 'displayTestID', 'DisplayTestID'
        ], '');
        
        // Extract Description with multiple variations
        const description = extractField(labTest, [
          'description', 'Description', 'testDescription', 'TestDescription',
          'test_description', 'Test_Description', 'desc', 'Desc',
          'details', 'Details', 'testDetails', 'TestDetails', 'test_details', 'Test_Details'
        ], '');
        
        // Extract Priority with multiple variations
        const priority = extractField(labTest, [
          'priority', 'Priority', 'testPriority', 'TestPriority',
          'test_priority', 'Test_Priority', 'orderPriority', 'OrderPriority',
          'order_priority', 'Order_Priority', 'urgency', 'Urgency'
        ], '');
        
        // Extract Lab Test Done with multiple variations
        const labTestDoneValue = extractField(labTest, [
          'labTestDone', 'LabTestDone', 'lab_test_done', 'Lab_Test_Done',
          'testDone', 'TestDone', 'test_done', 'Test_Done',
          'isDone', 'IsDone', 'is_done', 'Is_Done',
          'completed', 'Completed', 'isCompleted', 'IsCompleted', 'is_completed', 'Is_Completed'
        ], undefined);
        const labTestDone = labTestDoneValue !== undefined ? (typeof labTestDoneValue === 'boolean' ? labTestDoneValue : String(labTestDoneValue).toLowerCase() === 'true' || String(labTestDoneValue).toLowerCase() === 'yes') : undefined;
        
        // Extract Reports URL with multiple variations
        const reportsUrl = extractField(labTest, [
          'reportsUrl', 'ReportsUrl', 'reports_url', 'Reports_Url',
          'reportUrl', 'ReportUrl', 'report_url', 'Report_Url',
          'reportURL', 'ReportURL', 'reportsURL', 'ReportsURL',
          'url', 'Url', 'URL', 'reportLink', 'ReportLink', 'report_link', 'Report_Link'
        ], '');
        
        // Extract Test Status with multiple variations
        const testStatus = extractField(labTest, [
          'testStatus', 'TestStatus', 'test_status', 'Test_Status',
          'status', 'Status', 'labTestStatus', 'LabTestStatus',
          'lab_test_status', 'Lab_Test_Status', 'orderStatus', 'OrderStatus',
          'order_status', 'Order_Status'
        ], '');
        
        // Extract Test Done DateTime with multiple variations
        const testDoneDateTime = extractField(labTest, [
          'testDoneDateTime', 'TestDoneDateTime', 'test_done_date_time', 'Test_Done_Date_Time',
          'doneDateTime', 'DoneDateTime', 'done_date_time', 'Done_Date_Time',
          'completedDateTime', 'CompletedDateTime', 'completed_date_time', 'Completed_Date_Time',
          'testCompletedDateTime', 'TestCompletedDateTime', 'test_completed_date_time', 'Test_Completed_Date_Time',
          'doneDate', 'DoneDate', 'done_date', 'Done_Date', 'completedDate', 'CompletedDate', 'completed_date', 'Completed_Date'
        ], '');
        
        // Extract Status (for backward compatibility)
        const status = testStatus || extractField(labTest, [
          'status', 'Status', 'testStatus', 'TestStatus', 'test_status', 'Test_Status',
          'labTestStatus', 'LabTestStatus', 'lab_test_status', 'Lab_Test_Status',
          'orderStatus', 'OrderStatus', 'order_status', 'Order_Status'
        ], '');
        
        // Extract Ordered Date with multiple variations
        const orderedDate = extractField(labTest, [
          'orderedDate', 'OrderedDate', 'ordered_date', 'Ordered_Date',
          'orderDate', 'OrderDate', 'order_date', 'Order_Date',
          'prescribedDate', 'PrescribedDate', 'prescribed_date', 'Prescribed_Date',
          'createdDate', 'CreatedDate', 'created_date', 'Created_Date',
          'date', 'Date', 'orderDateTime', 'OrderDateTime', 'order_date_time', 'Order_Date_Time'
        ], '');
        
        // Extract Ordered By with multiple variations
        const orderedBy = extractField(labTest, [
          'orderedBy', 'OrderedBy', 'ordered_by', 'Ordered_By',
          'prescribedBy', 'PrescribedBy', 'prescribed_by', 'Prescribed_By',
          'doctorName', 'DoctorName', 'doctor_name', 'Doctor_Name',
          'orderedByDoctor', 'OrderedByDoctor', 'ordered_by_doctor', 'Ordered_By_Doctor',
          'prescribedByDoctor', 'PrescribedByDoctor', 'prescribed_by_doctor', 'Prescribed_By_Doctor',
          'doctor', 'Doctor', 'orderedByUser', 'OrderedByUser', 'ordered_by_user', 'Ordered_By_User'
        ], '');
        
        // Extract Charges with multiple variations
        const chargesValue = extractField(labTest, [
          'charges', 'Charges', 'amount', 'Amount', 'price', 'Price',
          'testCharges', 'TestCharges', 'test_charges', 'Test_Charges',
          'labTestCharges', 'LabTestCharges', 'lab_test_charges', 'Lab_Test_Charges',
          'cost', 'Cost', 'fee', 'Fee', 'testFee', 'TestFee', 'test_fee', 'Test_Fee'
        ], 0);
        const charges = chargesValue !== 0 ? Number(chargesValue) || undefined : undefined;
        
        // Extract PatientLabTestsId (primary key from backend)
        const patientLabTestsId = Number(extractField(labTest, [
          'patientLabTestsId', 'PatientLabTestsId', 'patient_lab_tests_id', 'Patient_Lab_Tests_Id',
          'patientLabTestId', 'PatientLabTestId', 'patient_lab_test_id', 'Patient_Lab_Test_Id',
          'id', 'Id', 'ID'
        ], 0));
        
        // Extract PatientId with multiple variations (including nested Patient object)
        const patientId = extractField(labTest, [
          'patientId', 'PatientId', 'patient_id', 'Patient_ID',
          'patientID', 'PatientID', 'patientUUID', 'PatientUUID',
          'patient_uuid', 'Patient_UUID',
          'Patient.patientId', 'Patient.PatientId', 'patient.patientId', 'patient.PatientId',
          'Patient.patient_id', 'Patient.Patient_ID', 'patient.patient_id', 'patient.Patient_ID'
        ], '');
        
        // Extract PatientName with multiple variations (including nested Patient object)
        const patientName = extractField(labTest, [
          'patientName', 'PatientName', 'patient_name', 'Patient_Name',
          'patientFullName', 'PatientFullName', 'patient_full_name', 'Patient_Full_Name',
          'name', 'Name', 'fullName', 'FullName', 'full_name', 'Full_Name',
          'Patient.patientName', 'Patient.PatientName', 'patient.patientName', 'patient.PatientName',
          'Patient.name', 'Patient.Name', 'patient.name', 'patient.Name',
          'Patient.fullName', 'Patient.FullName', 'patient.fullName', 'patient.FullName'
        ], '');
        
        // Extract PatientType with multiple variations
        const patientType = extractField(labTest, [
          'patientType', 'PatientType', 'patient_type', 'Patient_Type',
          'type', 'Type', 'admissionType', 'AdmissionType', 'admission_type', 'Admission_Type',
          'PatientType', 'patient_type', 'Patient_Type'
        ], '');
        
        // Extract EmergencyBedSlotId with multiple variations
        const emergencyBedSlotId = extractField(labTest, [
          'emergencyBedSlotId', 'EmergencyBedSlotId', 'emergency_bed_slot_id', 'Emergency_Bed_Slot_Id',
          'emergencyBedId', 'EmergencyBedId', 'emergency_bed_id', 'Emergency_Bed_Id',
          'bedSlotId', 'BedSlotId', 'bed_slot_id', 'Bed_Slot_Id'
        ], undefined);
        
        // Extract BillId with multiple variations
        const billId = extractField(labTest, [
          'billId', 'BillId', 'bill_id', 'Bill_ID',
          'billID', 'BillID', 'billingId', 'BillingId', 'billing_id', 'Billing_ID',
          'invoiceId', 'InvoiceId', 'invoice_id', 'Invoice_ID'
        ], undefined);
        
        // Extract CreatedBy with multiple variations
        const createdBy = extractField(labTest, [
          'createdBy', 'CreatedBy', 'created_by', 'Created_By',
          'createdByUser', 'CreatedByUser', 'created_by_user', 'Created_By_User',
          'createdByUserId', 'CreatedByUserId', 'created_by_user_id', 'Created_By_User_Id',
          'createdByUserID', 'CreatedByUserID', 'userId', 'UserId', 'user_id', 'User_ID'
        ], undefined);
        
        // Extract CreatedDate with multiple variations
        const createdDate = extractField(labTest, [
          'createdDate', 'CreatedDate', 'created_date', 'Created_Date',
          'createdAt', 'CreatedAt', 'created_at', 'Created_At',
          'createdDateTime', 'CreatedDateTime', 'created_date_time', 'Created_Date_Time',
          'dateCreated', 'DateCreated', 'date_created', 'Date_Created'
        ], '');
        
        console.log('Mapped lab test fields:', {
          patientLabTestsId,
          patientId,
          patientName,
          labTestId: labTestIdValue,
          labTestName,
          testName,
          patientType,
          emergencyBedSlotId,
          billId,
          priority,
          labTestDone,
          reportsUrl,
          testStatus,
          testDoneDateTime,
          status,
          createdBy,
          createdDate,
          testCategory,
          displayTestId,
          description,
          orderedDate,
          orderedBy,
          charges,
          raw: labTest
        });
        
        return {
          id: patientLabTestsId || patientLabTestId || Number(extractField(labTest, ['id', 'Id', 'ID'], 0)),
          patientLabTestId: patientLabTestId || patientLabTestsId || undefined,
          patientLabTestsId: patientLabTestsId || patientLabTestId || undefined,
          patientId: (patientId && patientId !== '') ? patientId : undefined,
          patientName: (patientName && patientName !== '') ? patientName : undefined,
          roomAdmissionId: Number(extractField(labTest, [
            'roomAdmissionId', 'RoomAdmissionId', 'room_admission_id', 'Room_Admission_Id',
            'admissionId', 'AdmissionId', 'admission_id', 'Admission_Id',
            'roomAdmissionID', 'RoomAdmissionID'
          ], roomAdmissionId)),
          labTestId: labTestIdValue || undefined,
          labTestName: (labTestName && labTestName !== '') ? labTestName : undefined,
          testName: (testName && testName !== '') ? testName : undefined,
          testCategory: (testCategory && testCategory !== '') ? testCategory : undefined,
          displayTestId: (displayTestId && displayTestId !== '') ? displayTestId : undefined,
          description: (description && description !== '') ? description : undefined,
          priority: (priority && priority !== '') ? priority : undefined,
          patientType: (patientType && patientType !== '') ? patientType : undefined,
          emergencyBedSlotId: (emergencyBedSlotId !== undefined && emergencyBedSlotId !== null && emergencyBedSlotId !== '') ? emergencyBedSlotId : undefined,
          billId: (billId !== undefined && billId !== null && billId !== '') ? billId : undefined,
          labTestDone: labTestDone,
          reportsUrl: (reportsUrl && reportsUrl !== '') ? reportsUrl : undefined,
          testStatus: (testStatus && testStatus !== '') ? testStatus : undefined,
          testDoneDateTime: (testDoneDateTime && testDoneDateTime !== '') ? testDoneDateTime : undefined,
          status: (status && status !== '') ? status : undefined,
          orderedDate: (orderedDate && orderedDate !== '') ? orderedDate : undefined,
          orderedBy: (orderedBy && orderedBy !== '') ? orderedBy : undefined,
          result: extractField(labTest, [
            'result', 'Result', 'testResult', 'TestResult', 'test_result', 'Test_Result',
            'labResult', 'LabResult', 'lab_result', 'Lab_Result'
          ], undefined),
          reportedDate: extractField(labTest, [
            'reportedDate', 'ReportedDate', 'reported_date', 'Reported_Date',
            'resultDate', 'ResultDate', 'result_date', 'Result_Date',
            'completedDate', 'CompletedDate', 'completed_date', 'Completed_Date'
          ], undefined),
          charges: charges,
          createdBy: (createdBy !== undefined && createdBy !== null && createdBy !== '') ? createdBy : undefined,
          createdDate: (createdDate && createdDate !== '') ? createdDate : undefined,
        };
      });
      
      console.log('Normalized patient lab tests:', normalizedLabTests);
      return normalizedLabTests;
    } catch (error: any) {
      console.error(`Error fetching patient lab tests for roomAdmissionId ${roomAdmissionId}:`, error);
      throw error;
    }
  },

  async getPatientDoctorVisits(roomAdmissionId: number | string): Promise<PatientDoctorVisit[]> {
    try {
      // Validate ID before making API call
      if (!roomAdmissionId || (typeof roomAdmissionId === 'number' && roomAdmissionId <= 0)) {
        throw new Error(`Invalid room admission ID: ${roomAdmissionId}. Cannot fetch patient doctor visits.`);
      }
      
      console.log(`Fetching patient doctor visits for roomAdmissionId: ${roomAdmissionId} (type: ${typeof roomAdmissionId})`);
      const response = await apiRequest<any>(`/patient-admit-doctor-visits/room-admission/${roomAdmissionId}`);
      console.log('Patient doctor visits API response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures: 
      // - { data: { patientDoctorVisits: [...] } } or { patientDoctorVisits: [...] }
      // - { data: [...] } or direct array
      // - { doctorVisits: [...] } or other nested structures
      let doctorVisitsData: any[] = [];
      
      if (Array.isArray(response)) {
        doctorVisitsData = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          doctorVisitsData = response.data;
        } else if (response.data.patientDoctorVisits && Array.isArray(response.data.patientDoctorVisits)) {
          doctorVisitsData = response.data.patientDoctorVisits;
        } else if (response.data.doctorVisits && Array.isArray(response.data.doctorVisits)) {
          doctorVisitsData = response.data.doctorVisits;
        } else if (response.data.PatientDoctorVisits && Array.isArray(response.data.PatientDoctorVisits)) {
          doctorVisitsData = response.data.PatientDoctorVisits;
        }
      } else if (response?.patientDoctorVisits && Array.isArray(response.patientDoctorVisits)) {
        doctorVisitsData = response.patientDoctorVisits;
      } else if (response?.doctorVisits && Array.isArray(response.doctorVisits)) {
        doctorVisitsData = response.doctorVisits;
      } else if (response?.PatientDoctorVisits && Array.isArray(response.PatientDoctorVisits)) {
        doctorVisitsData = response.PatientDoctorVisits;
      }
      
      if (!Array.isArray(doctorVisitsData) || doctorVisitsData.length === 0) {
        console.warn('Patient doctor visits response is not an array or is empty:', response);
        return [];
      }
      
      // Helper function to extract value with multiple field name variations
      const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
        if (!Array.isArray(fieldVariations)) {
          console.error('extractField: fieldVariations must be an array', fieldVariations);
          return defaultValue;
        }
        for (const field of fieldVariations) {
          const value = data?.[field];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
        return defaultValue;
      };
      
      // Normalize the response to match PatientDoctorVisit interface
      const normalizedDoctorVisits: PatientDoctorVisit[] = doctorVisitsData.map((visit: any) => {
        const patientDoctorVisitId = Number(extractField(visit, [
          'patientDoctorVisitId', 'PatientDoctorVisitId', 'patient_doctor_visit_id', 'Patient_Doctor_Visit_Id',
          'id', 'Id', 'ID'
        ], 0));
        
        // Extract Doctor Name with multiple variations
        const doctorName = extractField(visit, [
          'doctorName', 'DoctorName', 'doctor_name', 'Doctor_Name',
          'doctor', 'Doctor', 'doctorFullName', 'DoctorFullName',
          'doctor_full_name', 'Doctor_Full_Name', 'name', 'Name'
        ], '');
        
        // Extract Visit Date with multiple variations
        const visitDate = extractField(visit, [
          'visitDate', 'VisitDate', 'visit_date', 'Visit_Date',
          'date', 'Date', 'visitDateTime', 'VisitDateTime',
          'visit_date_time', 'Visit_Date_Time', 'createdDate', 'CreatedDate',
          'created_date', 'Created_Date'
        ], '');
        
        // Extract Visit Time with multiple variations
        const visitTime = extractField(visit, [
          'visitTime', 'VisitTime', 'visit_time', 'Visit_Time',
          'time', 'Time', 'visitTimeOnly', 'VisitTimeOnly',
          'visit_time_only', 'Visit_Time_Only'
        ], '');
        
        // Extract Visit Type with multiple variations
        const visitType = extractField(visit, [
          'visitType', 'VisitType', 'visit_type', 'Visit_Type',
          'type', 'Type', 'visitCategory', 'VisitCategory',
          'visit_category', 'Visit_Category'
        ], '');
        
        // Extract Diagnosis with multiple variations
        const diagnosis = extractField(visit, [
          'diagnosis', 'Diagnosis', 'diagnosisDescription', 'DiagnosisDescription',
          'diagnosis_desc', 'Diagnosis_Desc', 'condition', 'Condition',
          'diagnosisText', 'DiagnosisText', 'diagnosis_text', 'Diagnosis_Text'
        ], '');
        
        // Extract Notes with multiple variations
        const notes = extractField(visit, [
          'notes', 'Notes', 'visitNotes', 'VisitNotes',
          'visit_notes', 'Visit_Notes', 'remarks', 'Remarks',
          'comments', 'Comments', 'description', 'Description'
        ], '');
        
        // Extract Prescribed Medications with multiple variations
        const prescribedMedications = extractField(visit, [
          'prescribedMedications', 'PrescribedMedications', 'prescribed_medications', 'Prescribed_Medications',
          'medications', 'Medications', 'medicines', 'Medicines',
          'prescription', 'Prescription', 'prescribedDrugs', 'PrescribedDrugs',
          'prescribed_drugs', 'Prescribed_Drugs'
        ], '');
        
        // Extract Follow Up Date with multiple variations
        const followUpDate = extractField(visit, [
          'followUpDate', 'FollowUpDate', 'follow_up_date', 'Follow_Up_Date',
          'followUp', 'FollowUp', 'followupDate', 'FollowupDate',
          'nextVisitDate', 'NextVisitDate', 'next_visit_date', 'Next_Visit_Date'
        ], undefined);
        
        // Extract Status with multiple variations
        const status = extractField(visit, [
          'status', 'Status', 'visitStatus', 'VisitStatus',
          'visit_status', 'Visit_Status', 'visitState', 'VisitState',
          'visit_state', 'Visit_State'
        ], '');
        
        // Extract Doctor Visited DateTime with multiple variations
        const doctorVisitedDateTime = extractField(visit, [
          'doctorVisitedDateTime', 'DoctorVisitedDateTime', 'doctor_visited_date_time', 'Doctor_Visited_Date_Time',
          'visitedDateTime', 'VisitedDateTime', 'visited_date_time', 'Visited_Date_Time',
          'visitDateTime', 'VisitDateTime', 'visit_date_time', 'Visit_Date_Time',
          'doctorVisitDateTime', 'DoctorVisitDateTime', 'doctor_visit_date_time', 'Doctor_Visit_Date_Time'
        ], '');
        
        // Extract Visits Remarks with multiple variations
        const visitsRemarks = extractField(visit, [
          'visitsRemarks', 'VisitsRemarks', 'visits_remarks', 'Visits_Remarks',
          'visitRemarks', 'VisitRemarks', 'visit_remarks', 'Visit_Remarks',
          'remarks', 'Remarks', 'notes', 'Notes', 'visitNotes', 'VisitNotes',
          'visit_notes', 'Visit_Notes', 'comments', 'Comments'
        ], '');
        
        // Extract Patient Condition with multiple variations
        const patientCondition = extractField(visit, [
          'patientCondition', 'PatientCondition', 'patient_condition', 'Patient_Condition',
          'condition', 'Condition', 'patientStatus', 'PatientStatus',
          'patient_status', 'Patient_Status', 'healthStatus', 'HealthStatus',
          'health_status', 'Health_Status', 'patientHealth', 'PatientHealth',
          'patient_health', 'Patient_Health'
        ], '');
        
        console.log('Mapped doctor visit fields:', {
          doctorId: visit.doctorId || visit.DoctorId || visit.doctor_id || visit.Doctor_Id,
          doctorName,
          visitDate,
          visitTime,
          visitType,
          diagnosis,
          notes,
          prescribedMedications,
          followUpDate,
          status,
          doctorVisitedDateTime,
          visitsRemarks,
          patientCondition,
          raw: visit
        });
        
        return {
          id: patientDoctorVisitId || Number(extractField(visit, ['id', 'Id', 'ID'], 0)),
          patientDoctorVisitId: patientDoctorVisitId || undefined,
          roomAdmissionId: Number(extractField(visit, [
            'roomAdmissionId', 'RoomAdmissionId', 'room_admission_id', 'Room_Admission_Id',
            'admissionId', 'AdmissionId', 'admission_id', 'Admission_Id',
            'roomAdmissionID', 'RoomAdmissionID'
          ], roomAdmissionId)),
          doctorId: Number(extractField(visit, [
            'doctorId', 'DoctorId', 'doctor_id', 'Doctor_Id',
            'doctorID', 'DoctorID', 'doctorID', 'DoctorID'
          ], 0)) || undefined,
          doctorName: doctorName,
          visitDate: visitDate,
          visitTime: visitTime,
          visitType: visitType,
          diagnosis: diagnosis,
          notes: notes,
          prescribedMedications: prescribedMedications,
          followUpDate: followUpDate,
          status: status,
          doctorVisitedDateTime: doctorVisitedDateTime,
          visitsRemarks: visitsRemarks,
          patientCondition: patientCondition,
        };
      });
      
      console.log('Normalized patient doctor visits:', normalizedDoctorVisits);
      return normalizedDoctorVisits;
    } catch (error: any) {
      console.error(`Error fetching patient doctor visits for roomAdmissionId ${roomAdmissionId}:`, error);
      throw error;
    }
  },

  async getPatientNurseVisits(roomAdmissionId: number): Promise<PatientNurseVisit[]> {
    try {
      // Validate ID before making API call
      if (!roomAdmissionId || roomAdmissionId <= 0) {
        throw new Error(`Invalid room admission ID: ${roomAdmissionId}. Cannot fetch patient nurse visits.`);
      }
      
      console.log(`Fetching patient nurse visits for roomAdmissionId: ${roomAdmissionId}`);
      const response = await apiRequest<any>(`/patient-admit-nurse-visits/room-admission/${roomAdmissionId}`);
      console.log('Patient nurse visits API response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures: 
      // - { data: { patientNurseVisits: [...] } } or { patientNurseVisits: [...] }
      // - { data: [...] } or direct array
      // - { nurseVisits: [...] } or other nested structures
      let nurseVisitsData: any[] = [];
      
      if (Array.isArray(response)) {
        nurseVisitsData = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          nurseVisitsData = response.data;
        } else if (response.data.patientNurseVisits && Array.isArray(response.data.patientNurseVisits)) {
          nurseVisitsData = response.data.patientNurseVisits;
        } else if (response.data.nurseVisits && Array.isArray(response.data.nurseVisits)) {
          nurseVisitsData = response.data.nurseVisits;
        } else if (response.data.PatientNurseVisits && Array.isArray(response.data.PatientNurseVisits)) {
          nurseVisitsData = response.data.PatientNurseVisits;
        }
      } else if (response?.patientNurseVisits && Array.isArray(response.patientNurseVisits)) {
        nurseVisitsData = response.patientNurseVisits;
      } else if (response?.nurseVisits && Array.isArray(response.nurseVisits)) {
        nurseVisitsData = response.nurseVisits;
      } else if (response?.PatientNurseVisits && Array.isArray(response.PatientNurseVisits)) {
        nurseVisitsData = response.PatientNurseVisits;
      }
      
      if (!Array.isArray(nurseVisitsData) || nurseVisitsData.length === 0) {
        console.warn('Patient nurse visits response is not an array or is empty:', response);
        return [];
      }
      
      // Helper function to extract value with multiple field name variations
      const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
        if (!Array.isArray(fieldVariations)) {
          console.error('extractField: fieldVariations must be an array', fieldVariations);
          return defaultValue;
        }
        for (const field of fieldVariations) {
          const value = data?.[field];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
        return defaultValue;
      };
      
      // Normalize the response to match PatientNurseVisit interface
      const normalizedNurseVisits: PatientNurseVisit[] = nurseVisitsData.map((visit: any) => {
        const patientNurseVisitId = Number(extractField(visit, [
          'patientNurseVisitId', 'PatientNurseVisitId', 'patient_nurse_visit_id', 'Patient_Nurse_Visit_Id',
          'id', 'Id', 'ID'
        ], 0));
        
        // Extract Nurse Name with multiple variations
        const nurseName = extractField(visit, [
          'nurseName', 'NurseName', 'nurse_name', 'Nurse_Name',
          'nurse', 'Nurse', 'nurseFullName', 'NurseFullName',
          'nurse_full_name', 'Nurse_Full_Name', 'name', 'Name'
        ], '');
        
        // Extract Visit Date with multiple variations
        const visitDate = extractField(visit, [
          'visitDate', 'VisitDate', 'visit_date', 'Visit_Date',
          'date', 'Date', 'visitDateTime', 'VisitDateTime',
          'visit_date_time', 'Visit_Date_Time', 'createdDate', 'CreatedDate',
          'created_date', 'Created_Date'
        ], '');
        
        // Extract Visit Time with multiple variations
        const visitTime = extractField(visit, [
          'visitTime', 'VisitTime', 'visit_time', 'Visit_Time',
          'time', 'Time', 'visitTimeOnly', 'VisitTimeOnly',
          'visit_time_only', 'Visit_Time_Only'
        ], '');
        
        // Extract Visit Type with multiple variations
        const visitType = extractField(visit, [
          'visitType', 'VisitType', 'visit_type', 'Visit_Type',
          'type', 'Type', 'visitCategory', 'VisitCategory',
          'visit_category', 'Visit_Category'
        ], '');
        
        // Extract Vital Signs with multiple variations
        const vitalSigns = extractField(visit, [
          'vitalSigns', 'VitalSigns', 'vital_signs', 'Vital_Signs',
          'vitals', 'Vitals', 'vitalSignsData', 'VitalSignsData',
          'vital_signs_data', 'Vital_Signs_Data', 'vitalSignsInfo', 'VitalSignsInfo'
        ], '');
        
        // Extract Notes with multiple variations
        const notes = extractField(visit, [
          'notes', 'Notes', 'visitNotes', 'VisitNotes',
          'visit_notes', 'Visit_Notes', 'remarks', 'Remarks',
          'comments', 'Comments', 'description', 'Description'
        ], '');
        
        // Extract Medications Administered with multiple variations
        const medicationsAdministered = extractField(visit, [
          'medicationsAdministered', 'MedicationsAdministered', 'medications_administered', 'Medications_Administered',
          'medications', 'Medications', 'medicines', 'Medicines',
          'medicationsGiven', 'MedicationsGiven', 'medications_given', 'Medications_Given',
          'medicationsProvided', 'MedicationsProvided', 'medications_provided', 'Medications_Provided'
        ], '');
        
        // Extract Next Visit Date with multiple variations
        const nextVisitDate = extractField(visit, [
          'nextVisitDate', 'NextVisitDate', 'next_visit_date', 'Next_Visit_Date',
          'nextVisit', 'NextVisit', 'followUpDate', 'FollowUpDate',
          'follow_up_date', 'Follow_Up_Date', 'nextAppointmentDate', 'NextAppointmentDate'
        ], undefined);
        
        // Extract Status with multiple variations
        const status = extractField(visit, [
          'status', 'Status', 'visitStatus', 'VisitStatus',
          'visit_status', 'Visit_Status', 'visitState', 'VisitState',
          'visit_state', 'Visit_State'
        ], '');
        
        // Extract Patient Status with multiple variations
        const patientStatus = extractField(visit, [
          'patientStatus', 'PatientStatus', 'patient_status', 'Patient_Status',
          'patientCondition', 'PatientCondition', 'patient_condition', 'Patient_Condition',
          'condition', 'Condition', 'healthStatus', 'HealthStatus', 'health_status', 'Health_Status'
        ], '');
        
        // Extract Supervision Details with multiple variations
        const supervisionDetails = extractField(visit, [
          'supervisionDetails', 'SupervisionDetails', 'supervision_details', 'Supervision_Details',
          'supervision', 'Supervision', 'supervisionInfo', 'SupervisionInfo',
          'supervision_info', 'Supervision_Info', 'supervisedBy', 'SupervisedBy', 'supervised_by', 'Supervised_By'
        ], '');
        
        // Extract Remarks with multiple variations
        const remarks = extractField(visit, [
          'remarks', 'Remarks', 'note', 'Note', 'notes', 'Notes',
          'visitNotes', 'VisitNotes', 'visit_notes', 'Visit_Notes',
          'comments', 'Comments', 'observation', 'Observation', 'observations', 'Observations'
        ], '');
        
        console.log('Mapped nurse visit fields:', {
          nurseId: visit.nurseId || visit.NurseId || visit.nurse_id || visit.Nurse_Id,
          nurseName,
          visitDate,
          visitTime,
          visitType,
          vitalSigns,
          notes,
          medicationsAdministered,
          nextVisitDate,
          status,
          patientStatus,
          supervisionDetails,
          remarks,
          raw: visit
        });
        
        return {
          id: patientNurseVisitId || Number(extractField(visit, ['id', 'Id', 'ID'], 0)),
          patientNurseVisitId: patientNurseVisitId || undefined,
          roomAdmissionId: Number(extractField(visit, [
            'roomAdmissionId', 'RoomAdmissionId', 'room_admission_id', 'Room_Admission_Id',
            'admissionId', 'AdmissionId', 'admission_id', 'Admission_Id',
            'roomAdmissionID', 'RoomAdmissionID'
          ], roomAdmissionId)),
          nurseId: Number(extractField(visit, [
            'nurseId', 'NurseId', 'nurse_id', 'Nurse_Id',
            'nurseID', 'NurseID', 'nurseID', 'NurseID'
          ], 0)) || undefined,
          nurseName: nurseName,
          visitDate: visitDate,
          visitTime: visitTime,
          visitType: visitType,
          vitalSigns: vitalSigns,
          notes: notes,
          medicationsAdministered: medicationsAdministered,
          nextVisitDate: nextVisitDate,
          status: status,
          patientStatus: patientStatus,
          supervisionDetails: supervisionDetails,
          remarks: remarks,
        };
      });
      
      console.log('Normalized patient nurse visits:', normalizedNurseVisits);
      return normalizedNurseVisits;
    } catch (error: any) {
      console.error(`Error fetching patient nurse visits for roomAdmissionId ${roomAdmissionId}:`, error);
      throw error;
    }
  },

  async getAllPatientICUAdmissions(): Promise<any[]> {
    try {
      console.log('Fetching ICU patient admissions from API endpoint: /patient-icu-admissions/');
      const response = await apiRequest<any>('/patient-icu-admissions/');
      console.log('ICU patient admissions API response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures: { data: [...] } or direct array
      const icuAdmissionsData = response?.data || response || [];
      console.log('ICU patient admissions data extracted:', icuAdmissionsData);
      
      if (Array.isArray(icuAdmissionsData) && icuAdmissionsData.length > 0) {
        console.log(`Processing ${icuAdmissionsData.length} ICU patient admissions from API`);
        return icuAdmissionsData;
      } else if (icuAdmissionsData && !Array.isArray(icuAdmissionsData)) {
        console.warn('ICU patient admissions data is not an array:', typeof icuAdmissionsData);
        return [];
      } else {
        console.warn('No ICU patient admissions data found in API response');
        return [];
      }
    } catch (error) {
      console.error('Error fetching ICU patient admissions:', error);
      throw error;
    }
  },

  async getICUOccupancy(): Promise<{ totalPatients: number; occupiedBeds: number; totalBeds?: number }> {
    try {
      console.log('********************************Fetching ICU occupancy from API endpoint: /patient-icu-admissions/occupancy');
      const response = await apiRequest<any>('/patient-icu-admissions/occupancy');
      console.log('ICU occupancy API response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures: { data: {...} } or direct object
      const occupancyData = response?.data || response || {};
      console.log('ICU occupancy data extracted:', occupancyData);
      
      // Helper function to extract numeric value with multiple field name variations
      const extractValue = (data: any, fieldVariations: string[], defaultValue: number = 0): number => {
        for (const field of fieldVariations) {
          const value = data?.[field];
          if (value !== undefined && value !== null) {
            const numValue = Number(value);
            if (!isNaN(numValue)) {
              return numValue;
            }
          }
        }
        return defaultValue;
      };
      
      // Extract occupancy field - this might represent total patients or occupied beds
      const occupancyValue = extractValue(occupancyData, [
        'occupancy', 'Occupancy', 'occupancyRate', 'OccupancyRate',
        'occupancy_rate', 'Occupancy_Rate', 'bedOccupancy', 'BedOccupancy',
        'bed_occupancy', 'Bed_Occupancy'
      ], -1); // Use -1 as sentinel value to check if occupancy field exists
      
      const hasOccupancyField = occupancyValue !== -1;
      
      // Extract occupied beds - this is the number of beds currently occupied (e.g., 9)
      const occupiedBeds = extractValue(occupancyData, [
        'occupiedBeds', 'OccupiedBeds', 'occupied_beds', 'Occupied_Beds',
        'occupied', 'Occupied', 'occupiedCount', 'OccupiedCount',
        'occupied_bed_count', 'Occupied_Bed_Count', 'occupiedBedCount', 'OccupiedBedCount',
        'totalOccupied', 'TotalOccupied', 'total_occupied', 'Total_Occupied',
        'occupiedPatients', 'OccupiedPatients', 'occupied_patients', 'Occupied_Patients'
      ], hasOccupancyField ? occupancyValue : 0); // Use occupancy field if available
      
      // Extract total beds - this is the total capacity (e.g., 15)
      const totalBeds = extractValue(occupancyData, [
        'totalBeds', 'TotalBeds', 'total_beds', 'Total_Beds',
        'totalCapacity', 'TotalCapacity', 'total_capacity', 'Total_Capacity',
        'capacity', 'Capacity', 'totalBedCount', 'TotalBedCount',
        'bedCapacity', 'BedCapacity', 'bed_capacity', 'Bed_Capacity',
        'maxBeds', 'MaxBeds', 'max_beds', 'Max_Beds'
      ], 15); // Default to 15 if not provided
      
      // Extract total patients - this might be the same as occupiedBeds or a separate count
      // Priority: occupancy field > totalPatients > occupiedBeds
      const totalPatients = extractValue(occupancyData, [
        'occupancy', 'Occupancy', // Map occupancy field to total patients
        'totalPatients', 'TotalPatients', 'total_patients', 'Total_Patients',
        'totalPatientCount', 'TotalPatientCount', 'total_patient_count', 'Total_Patient_Count',
        'patients', 'Patients', 'patientCount', 'PatientCount',
        'currentPatients', 'CurrentPatients', 'current_patients', 'Current_Patients'
      ], hasOccupancyField ? occupancyValue : occupiedBeds); // Use occupancy field if available, otherwise occupiedBeds
      
      // Ensure occupiedBeds doesn't exceed totalBeds
      const finalOccupiedBeds = Math.min(occupiedBeds, totalBeds);
      
      // Use occupancy field for totalPatients if it was found, otherwise use extracted totalPatients or occupiedBeds
      const finalTotalPatients = hasOccupancyField ? occupancyValue : (totalPatients || finalOccupiedBeds);
      
      console.log('Mapped ICU occupancy:', { 
        occupancy: hasOccupancyField ? occupancyValue : null, // Raw occupancy field from API
        totalPatients: finalTotalPatients, 
        occupiedBeds: finalOccupiedBeds, 
        totalBeds,
        rawOccupiedBeds: occupiedBeds 
      });
      
      return {
        totalPatients: finalTotalPatients, // Map occupancy field to totalPatients
        occupiedBeds: finalOccupiedBeds,
        totalBeds,
      };
    } catch (error) {
      console.error('Error fetching ICU occupancy:', error);
      throw error;
    }
  },

  async getICUCriticalCount(): Promise<number> {
    try {
      console.log('Fetching ICU critical patients count from API endpoint: /patient-icu-admissions/count/critical');
      const response = await apiRequest<any>('/patient-icu-admissions/count/critical');
      console.log('ICU critical count API response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures: { data: {...} } or direct object/number
      const countData = response?.data || response;
      console.log('ICU critical count data extracted:', countData);
      
      // Helper function to extract numeric value with multiple field name variations
      const extractValue = (data: any, fieldVariations: string[], defaultValue: number = 0): number => {
        // If data is already a number, return it
        if (typeof data === 'number') {
          return data;
        }
        
        // If data is a string that can be converted to a number
        if (typeof data === 'string') {
          const numValue = Number(data);
          if (!isNaN(numValue)) {
            return numValue;
          }
        }
        
        // Try to extract from object fields
        if (data && typeof data === 'object') {
          for (const field of fieldVariations) {
            const value = data?.[field];
            if (value !== undefined && value !== null) {
              const numValue = Number(value);
              if (!isNaN(numValue)) {
                return numValue;
              }
            }
          }
        }
        
        return defaultValue;
      };
      
      const criticalCount = extractValue(countData, [
        'criticalCount', 'CriticalCount', 'critical_count', 'Critical_Count',
        'criticalPatients', 'CriticalPatients', 'critical_patients', 'Critical_Patients',
        'criticalPatientCount', 'CriticalPatientCount', 'critical_patient_count', 'Critical_Patient_Count',
        'count', 'Count', 'totalCritical', 'TotalCritical', 'total_critical', 'Total_Critical'
      ], 0);
      
      console.log('Mapped ICU critical count:', criticalCount);
      
      return criticalCount;
    } catch (error) {
      console.error('Error fetching ICU critical count:', error);
      throw error;
    }
  },

  async getICUOnVentilatorCount(): Promise<number> {
    try {
      console.log('Fetching ICU on-ventilator patients count from API endpoint: /patient-icu-admissions/count/on-ventilator');
      const response = await apiRequest<any>('/patient-icu-admissions/count/on-ventilator');
      console.log('ICU on-ventilator count API response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures: { data: {...} } or direct object/number
      const countData = response?.data || response;
      console.log('ICU on-ventilator count data extracted:', countData);
      
      // Helper function to extract numeric value with multiple field name variations
      const extractValue = (data: any, fieldVariations: string[], defaultValue: number = 0): number => {
        // If data is already a number, return it
        if (typeof data === 'number') {
          return data;
        }
        
        // If data is a string that can be converted to a number
        if (typeof data === 'string') {
          const numValue = Number(data);
          if (!isNaN(numValue)) {
            return numValue;
          }
        }
        
        // Try to extract from object fields
        if (data && typeof data === 'object') {
          for (const field of fieldVariations) {
            const value = data?.[field];
            if (value !== undefined && value !== null) {
              const numValue = Number(value);
              if (!isNaN(numValue)) {
                return numValue;
              }
            }
          }
        }
        
        return defaultValue;
      };
      
      const onVentilatorCount = extractValue(countData, [
        'onVentilatorCount', 'OnVentilatorCount', 'on_ventilator_count', 'On_Ventilator_Count',
        'ventilatorCount', 'VentilatorCount', 'ventilator_count', 'Ventilator_Count',
        'onVentilator', 'OnVentilator', 'on_ventilator', 'On_Ventilator',
        'ventilatorPatients', 'VentilatorPatients', 'ventilator_patients', 'Ventilator_Patients',
        'count', 'Count', 'totalOnVentilator', 'TotalOnVentilator', 'total_on_ventilator', 'Total_On_Ventilator',
        'onVentilatorPatientCount', 'OnVentilatorPatientCount', 'on_ventilator_patient_count', 'On_Ventilator_Patient_Count',
        'ventilatorSupportCount', 'VentilatorSupportCount', 'ventilator_support_count', 'Ventilator_Support_Count',
        'patientsOnVentilator', 'PatientsOnVentilator', 'patients_on_ventilator', 'Patients_On_Ventilator'
      ], 0);
      
      console.log('Mapped ICU on-ventilator count:', onVentilatorCount);
      
      return onVentilatorCount;
    } catch (error) {
      console.error('Error fetching ICU on-ventilator count:', error);
      throw error;
    }
  },

  async getICUAvailableBedsCount(): Promise<number> {
    try {
      console.log('*****************************************Fetching ICU available beds count from API endpoint: /patient-icu-admissions/available-beds');
      const response = await apiRequest<any>('/patient-icu-admissions/available-beds');
      console.log('ICU available beds API response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures: { data: {...} } or direct object/number
      const countData = response?.data || response;
      console.log('ICU available beds data extracted:', countData);
      
      // Helper function to extract numeric value with multiple field name variations
      const extractValue = (data: any, fieldVariations: string[], defaultValue: number = 0): number => {
        // If data is already a number, return it
        if (typeof data === 'number') {
          return data;
        }
        
        // If data is a string that can be converted to a number
        if (typeof data === 'string') {
          const numValue = Number(data);
          if (!isNaN(numValue)) {
            return numValue;
          }
        }
        
        // Try to extract from object fields
        if (data && typeof data === 'object') {
          for (const field of fieldVariations) {
            const value = data?.[field];
            if (value !== undefined && value !== null) {
              const numValue = Number(value);
              if (!isNaN(numValue)) {
                return numValue;
              }
            }
          }
        }
        
        return defaultValue;
      };
      
      const availableBedsCount = extractValue(countData, [
        'availableICUBeds', 'AvailableICUBeds', 'available_icu_beds', 'Available_ICU_Beds', // Map availableICUBeds field
        'availableBeds', 'AvailableBeds', 'available_beds', 'Available_Beds',
        'availableBedCount', 'AvailableBedCount', 'available_bed_count', 'Available_Bed_Count',
        'available', 'Available', 'availableCount', 'AvailableCount',
        'count', 'Count', 'totalAvailable', 'TotalAvailable', 'total_available', 'Total_Available',
        'freeBeds', 'FreeBeds', 'free_beds', 'Free_Beds',
        'vacantBeds', 'VacantBeds', 'vacant_beds', 'Vacant_Beds',
        'icuAvailableBeds', 'ICUAvailableBeds', 'icu_available_beds', 'ICU_Available_Beds'
      ], 0);
      
      console.log('Mapped ICU available beds count:', availableBedsCount);
      
      return availableBedsCount;
    } catch (error) {
      console.error('Error fetching ICU available beds:', error);
      throw error;
    }
  },

  async getICUBedLayout(): Promise<any[]> {
    try {
      console.log('Fetching ICU bed layout from API endpoint: /patient-icu-admissions/icu-beds-details');
      const response = await apiRequest<any>('/patient-icu-admissions/icu-beds-details');
      console.log('ICU bed layout API response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures: { data: [...] } or direct array
      const bedLayoutData = response?.data || response || [];
      console.log('ICU bed layout data extracted:', bedLayoutData);
      
      // Extract ICU admission data from bed layout response and load into admissions array
      icuAdmissionsArray = []; // Reset the admissions array
      
      if (Array.isArray(bedLayoutData) && bedLayoutData.length > 0) {
        console.log(`Processing ${bedLayoutData.length} ICU beds from API`);
        
        // Extract ICU admission data from each bed
        bedLayoutData.forEach((bed: any) => {
          // Check for patientICUAdmission in various field name formats
          const admission = bed.patientICUAdmission || bed.PatientICUAdmission || 
                           bed.patient_icu_admission || bed.Patient_ICU_Admission ||
                           bed.icuAdmission || bed.ICUAdmission ||
                           bed.admission || bed.Admission ||
                           bed.patientData?.patientICUAdmission || bed.patientData?.PatientICUAdmission ||
                           bed.Patient?.patientICUAdmission || bed.Patient?.PatientICUAdmission;
          
          if (admission) {
            console.log('Extracted ICU admission from bed:', bed.bedNumber || bed.icuBedNo || bed.bedId, 'Admission:', admission);
            // Check if admission already exists to avoid duplicates
            const existingAdmission = icuAdmissionsArray.find(adm => 
              (adm.patientICUAdmissionId || adm.id || adm.PatientICUAdmissionId) === 
              (admission.patientICUAdmissionId || admission.id || admission.PatientICUAdmissionId)
            );
            if (!existingAdmission) {
              icuAdmissionsArray.push(admission);
            }
          }
          
          // Also check if patient data contains admission info
          const patientData = bed.patient || bed.Patient || bed.patientData || bed.PatientData;
          if (patientData) {
            const patientICUAdmissionId = patientData.patientICUAdmissionId || 
                                         patientData.PatientICUAdmissionId || 
                                         patientData.id;
            
            if (patientICUAdmissionId) {
              // If we haven't already added this admission, add the patient data as admission
              const existingAdmission = icuAdmissionsArray.find(adm => 
                (adm.patientICUAdmissionId || adm.id || adm.PatientICUAdmissionId) === patientICUAdmissionId
              );
              if (!existingAdmission) {
                console.log('Extracted ICU admission from patient data for bed:', bed.bedNumber || bed.icuBedNo || bed.bedId);
                icuAdmissionsArray.push({
                  ...patientData,
                  patientICUAdmissionId: patientICUAdmissionId
                });
              }
            }
          }
        });
        
        console.log(`Extracted ${icuAdmissionsArray.length} ICU admissions from bed layout data and loaded into admissions array`);
        
        return bedLayoutData;
      } else if (bedLayoutData && !Array.isArray(bedLayoutData)) {
        console.warn('ICU bed layout data is not an array:', typeof bedLayoutData);
        return [];
      } else {
        console.warn('No ICU bed layout data found in API response');
        return [];
      }
    } catch (error) {
      console.error('Error fetching ICU bed layout:', error);
      throw error;
    }
  },

  async getPatientRegistrations(): Promise<any[]> {
    try {
      console.log('Fetching patients from API endpoint: /patients/');
      const response = await apiRequest<any>('/patients/');
      console.log('Patients API response (RAW):', JSON.stringify(response, null, 2));

      const data = response?.data || response || [];
      if (Array.isArray(data)) {
        return data;
      }
      if (Array.isArray(data?.patients)) {
        return data.patients;
      }
      console.warn('Patients response is not an array; returning empty array');
      return [];
    } catch (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
  },

  async getICUList(): Promise<any[]> {
    try {
      console.log('Fetching ICU list from API endpoint: /icus');
      const response = await apiRequest<any>('/icus');
      console.log('ICU list API response (RAW):', JSON.stringify(response, null, 2));

      const data = response?.data || response || [];
      if (Array.isArray(data)) {
        return data;
      }
      if (Array.isArray(data?.icus)) {
        return data.icus;
      }
      console.warn('ICU list response is not an array; returning empty array');
      return [];
    } catch (error) {
      console.error('Error fetching ICU list:', error);
      return [];
    }
  },

  async createPatientICUAdmission(payload: any): Promise<any> {
    try {
      console.log('Creating patient ICU admission via endpoint: /patient-icu-admissions');
      console.log('Payload:', payload);
      const response = await apiRequest<any>('/patient-icu-admissions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      console.log('Create ICU admission response (RAW):', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('Error creating patient ICU admission:', error);
      throw error;
    }
  },

  async getICUBedDetailsById(icuBedId: string | number): Promise<any> {
    try {
      if (!icuBedId) {
        throw new Error(`Invalid ICU Bed ID: ${icuBedId}. Cannot fetch bed details.`);
      }
      
      console.log(`Fetching ICU bed details for icuBedId: ${icuBedId} (type: ${typeof icuBedId})`);
      const response = await apiRequest<any>(`/patient-icu-admissions/icu-beds-details/${icuBedId}`);
      console.log('ICU bed details API response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures: { data: {...} } or direct object
      const bedDetails = response?.data || response || null;
      console.log('ICU bed details extracted:', bedDetails);
      
      return bedDetails;
    } catch (error) {
      console.error(`Error fetching ICU bed details for icuBedId ${icuBedId}:`, error);
      throw error;
    }
  },

  async getICUNurseVisitVitalsByICUNurseVisitsId(icuNurseVisitId: string | number): Promise<ICUNurseVisitVitals[]> {
    try {
      // Validate ID before making API call
      if (!icuNurseVisitId) {
        throw new Error(`Invalid ICU Nurse Visit ID: ${icuNurseVisitId}. Cannot fetch vitals.`);
      }
      
      console.log(`Fetching ICU nurse visit vitals for icuNurseVisitId: ${icuNurseVisitId} (type: ${typeof icuNurseVisitId})`);
      const response = await apiRequest<any>(`/icu-nurse-visits/${icuNurseVisitId}/vitals`);
      console.log('ICU nurse visit vitals API response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures
      let vitalsData: any[] = [];
      
      if (Array.isArray(response)) {
        vitalsData = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          vitalsData = response.data;
        } else if (response.data.vitals && Array.isArray(response.data.vitals)) {
          vitalsData = response.data.vitals;
        } else if (response.data.icuNurseVisitVitals && Array.isArray(response.data.icuNurseVisitVitals)) {
          vitalsData = response.data.icuNurseVisitVitals;
        } else if (response.data.Vitals && Array.isArray(response.data.Vitals)) {
          vitalsData = response.data.Vitals;
        }
      } else if (response?.vitals && Array.isArray(response.vitals)) {
        vitalsData = response.vitals;
      } else if (response?.icuNurseVisitVitals && Array.isArray(response.icuNurseVisitVitals)) {
        vitalsData = response.icuNurseVisitVitals;
      } else if (response?.Vitals && Array.isArray(response.Vitals)) {
        vitalsData = response.Vitals;
      }
      
      if (!Array.isArray(vitalsData) || vitalsData.length === 0) {
        console.warn('ICU nurse visit vitals response is not an array or is empty:', response);
        return [];
      }
      
      // Helper function to extract value with multiple field name variations
      const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
        if (!Array.isArray(fieldVariations)) {
          console.error('extractField: fieldVariations must be an array', fieldVariations);
          return defaultValue;
        }
        for (const field of fieldVariations) {
          const value = data?.[field];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
        return defaultValue;
      };
      
      // Normalize the response to match ICUNurseVisitVitals interface
      const normalizedVitals: ICUNurseVisitVitals[] = vitalsData.map((vital: any) => {
        const icuNurseVisitVitalsId = extractField(vital, [
          'icuNurseVisitVitalsId', 'ICUNurseVisitVitalsId', 'icu_nurse_visit_vitals_id', 'ICU_Nurse_Visit_Vitals_Id',
          'id', 'Id', 'ID', 'vitalsId', 'VitalsId'
        ], null);
        
        return {
          id: icuNurseVisitVitalsId || extractField(vital, ['id', 'Id', 'ID'], null),
          icuNurseVisitVitalsId: icuNurseVisitVitalsId,
          icuNurseVisitId: extractField(vital, [
            'icuNurseVisitId', 'ICUNurseVisitId', 'icu_nurse_visit_id', 'ICU_Nurse_Visit_Id',
            'nurseVisitId', 'NurseVisitId', 'nurse_visit_id', 'Nurse_Visit_Id'
          ], icuNurseVisitId),
          heartRate: Number(extractField(vital, [
            'heartRate', 'HeartRate', 'heart_rate', 'Heart_Rate',
            'hr', 'HR', 'pulse', 'Pulse'
          ], 0)) || undefined,
          bloodPressure: extractField(vital, [
            'bloodPressure', 'BloodPressure', 'blood_pressure', 'Blood_Pressure',
            'bp', 'BP', 'bloodPressureReading', 'BloodPressureReading'
          ], ''),
          temperature: Number(extractField(vital, [
            'temperature', 'Temperature', 'temp', 'Temp',
            'bodyTemperature', 'BodyTemperature', 'body_temperature', 'Body_Temperature'
          ], 0)) || undefined,
          oxygenSaturation: Number(extractField(vital, [
            'oxygenSaturation', 'OxygenSaturation', 'oxygen_saturation', 'Oxygen_Saturation',
            'o2Sat', 'O2Sat', 'spo2', 'SpO2', 'oxygenLevel', 'OxygenLevel'
          ], 0)) || undefined,
          respiratoryRate: Number(extractField(vital, [
            'respiratoryRate', 'RespiratoryRate', 'respiratory_rate', 'Respiratory_Rate',
            'rr', 'RR', 'breathingRate', 'BreathingRate', 'breathing_rate', 'Breathing_Rate'
          ], 0)) || undefined,
          bloodSugar: Number(extractField(vital, [
            'bloodSugar', 'BloodSugar', 'blood_sugar', 'Blood_Sugar',
            'glucose', 'Glucose', 'bloodGlucose', 'BloodGlucose', 'bs', 'BS'
          ], 0)) || undefined,
          recordedDateTime: extractField(vital, [
            'recordedDateTime', 'RecordedDateTime', 'recorded_date_time', 'Recorded_Date_Time',
            'recordedDate', 'RecordedDate', 'recorded_date', 'Recorded_Date',
            'createdAt', 'CreatedAt', 'created_at', 'Created_At',
            'timestamp', 'Timestamp', 'dateTime', 'DateTime'
          ], ''),
          recordedBy: extractField(vital, [
            'recordedBy', 'RecordedBy', 'recorded_by', 'Recorded_By',
            'createdBy', 'CreatedBy', 'created_by', 'Created_By',
            'nurseName', 'NurseName', 'nurse_name', 'Nurse_Name',
            'recordedByNurse', 'RecordedByNurse', 'recorded_by_nurse', 'Recorded_By_Nurse'
          ], ''),
          notes: extractField(vital, [
            'notes', 'Notes', 'note', 'Note',
            'remarks', 'Remarks', 'comments', 'Comments',
            'observations', 'Observations', 'observation', 'Observation'
          ], ''),
        };
      });
      
      console.log('Normalized ICU nurse visit vitals:', normalizedVitals);
      return normalizedVitals;
    } catch (error: any) {
      console.error(`Error fetching ICU nurse visit vitals for icuNurseVisitId ${icuNurseVisitId}:`, error);
      throw error;
    }
  },
};
