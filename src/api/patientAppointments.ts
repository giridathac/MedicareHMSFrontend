// Patient Appointments API service
import { apiRequest, ENABLE_STUB_DATA } from './base';
import { PatientAppointment } from '../types';

// Stub data
const stubPatientAppointments: PatientAppointment[] = [
  {
    id: 1,
    patientAppointmentId: 'PA-2025-001',
    patientId: 'PAT-2025-0001',
    doctorId: '1',
    appointmentDate: '2025-01-15',
    appointmentTime: '10:00',
    tokenNo: 'HP-001',
    appointmentStatus: 'Waiting',
    consultationCharge: 500,
    diagnosis: '',
    followUpDetails: '',
    prescriptionsUrl: '',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 2,
    patientAppointmentId: 'PA-2025-002',
    patientId: 'PAT-2025-0002',
    doctorId: '2',
    appointmentDate: '2025-01-15',
    appointmentTime: '10:30',
    tokenNo: 'GP-001',
    appointmentStatus: 'Consulting',
    consultationCharge: 300,
    diagnosis: 'Common cold',
    followUpDetails: 'Follow up in 3 days',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-002',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 3,
    patientAppointmentId: 'PA-2025-003',
    patientId: 'PAT-2025-0003',
    doctorId: '1',
    appointmentDate: '2025-01-15',
    appointmentTime: '11:00',
    tokenNo: 'HP-002',
    appointmentStatus: 'Completed',
    consultationCharge: 500,
    diagnosis: 'Hypertension',
    followUpDetails: 'Follow up in 1 week',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-003',
    toBeAdmitted: true,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 4,
    patientAppointmentId: 'PA-2025-004',
    patientId: 'PAT-2025-0004',
    doctorId: '3',
    appointmentDate: '2025-01-16',
    appointmentTime: '09:00',
    tokenNo: 'JM-001',
    appointmentStatus: 'Waiting',
    consultationCharge: 400,
    diagnosis: '',
    followUpDetails: '',
    prescriptionsUrl: '',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 5,
    patientAppointmentId: 'PA-2025-005',
    patientId: 'PAT-2025-0005',
    doctorId: '4',
    appointmentDate: '2025-01-16',
    appointmentTime: '09:30',
    tokenNo: 'ED-001',
    appointmentStatus: 'Consulting',
    consultationCharge: 300,
    diagnosis: 'Lower back strain',
    followUpDetails: 'Follow up in 1 week',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-005',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 6,
    patientAppointmentId: 'PA-2025-006',
    patientId: 'PAT-2025-0006',
    doctorId: '5',
    appointmentDate: '2025-01-16',
    appointmentTime: '10:00',
    tokenNo: 'RL-001',
    appointmentStatus: 'Completed',
    consultationCharge: 350,
    diagnosis: 'Seasonal allergies',
    followUpDetails: 'Follow up in 2 weeks',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-006',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 7,
    patientAppointmentId: 'PA-2025-007',
    patientId: 'PAT-2025-0007',
    doctorId: '6',
    appointmentDate: '2025-01-16',
    appointmentTime: '10:30',
    tokenNo: 'MG-001',
    appointmentStatus: 'Waiting',
    consultationCharge: 500,
    diagnosis: '',
    followUpDetails: '',
    prescriptionsUrl: '',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 8,
    patientAppointmentId: 'PA-2025-008',
    patientId: 'PAT-2025-0008',
    doctorId: '7',
    appointmentDate: '2025-01-16',
    appointmentTime: '11:00',
    tokenNo: 'DW-001',
    appointmentStatus: 'Consulting',
    consultationCharge: 400,
    diagnosis: 'Skin condition',
    followUpDetails: 'Follow up in 1 week',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-008',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 9,
    patientAppointmentId: 'PA-2025-009',
    patientId: 'PAT-2025-0009',
    doctorId: '1',
    appointmentDate: '2025-01-17',
    appointmentTime: '09:00',
    tokenNo: 'HP-003',
    appointmentStatus: 'Completed',
    consultationCharge: 500,
    diagnosis: 'Chest pain - further tests needed',
    followUpDetails: 'Follow up after tests',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-009',
    toBeAdmitted: true,
    referToAnotherDoctor: true,
    transferToIPDOTICU: false,
  },
  {
    id: 10,
    patientAppointmentId: 'PA-2025-010',
    patientId: 'PAT-2025-0010',
    doctorId: '2',
    appointmentDate: '2025-01-17',
    appointmentTime: '09:30',
    tokenNo: 'MC-002',
    appointmentStatus: 'Waiting',
    consultationCharge: 600,
    diagnosis: '',
    followUpDetails: '',
    prescriptionsUrl: '',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 11,
    patientAppointmentId: 'PA-2025-011',
    patientId: 'PAT-2025-0011',
    doctorId: '3',
    appointmentDate: '2025-01-17',
    appointmentTime: '10:00',
    tokenNo: 'JM-002',
    appointmentStatus: 'Consulting',
    consultationCharge: 400,
    diagnosis: 'Chronic cough',
    followUpDetails: 'Follow up in 3 days',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-011',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 12,
    patientAppointmentId: 'PA-2025-012',
    patientId: 'PAT-2025-0012',
    doctorId: '4',
    appointmentDate: '2025-01-17',
    appointmentTime: '10:30',
    tokenNo: 'ED-002',
    appointmentStatus: 'Completed',
    consultationCharge: 300,
    diagnosis: 'Skin rash - contact dermatitis',
    followUpDetails: 'Follow up in 1 week',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-012',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 13,
    patientAppointmentId: 'PA-2025-013',
    patientId: 'PAT-2025-0013',
    doctorId: '5',
    appointmentDate: '2025-01-17',
    appointmentTime: '11:00',
    tokenNo: 'RL-002',
    appointmentStatus: 'Waiting',
    consultationCharge: 350,
    diagnosis: '',
    followUpDetails: '',
    prescriptionsUrl: '',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 14,
    patientAppointmentId: 'PA-2025-014',
    patientId: 'PAT-2025-0014',
    doctorId: '6',
    appointmentDate: '2025-01-17',
    appointmentTime: '11:30',
    tokenNo: 'MG-002',
    appointmentStatus: 'Consulting',
    consultationCharge: 500,
    diagnosis: 'Abdominal pain',
    followUpDetails: 'Follow up in 2 days',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-014',
    toBeAdmitted: true,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 15,
    patientAppointmentId: 'PA-2025-015',
    patientId: 'PAT-2025-0015',
    doctorId: '7',
    appointmentDate: '2025-01-17',
    appointmentTime: '12:00',
    tokenNo: 'DW-002',
    appointmentStatus: 'Completed',
    consultationCharge: 400,
    diagnosis: 'Fever and chills - viral infection',
    followUpDetails: 'Follow up if symptoms persist',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-015',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 16,
    patientAppointmentId: 'PA-2025-016',
    patientId: 'PAT-2025-0016',
    doctorId: '1',
    appointmentDate: '2025-01-18',
    appointmentTime: '09:00',
    tokenNo: 'HP-004',
    appointmentStatus: 'Waiting',
    consultationCharge: 500,
    diagnosis: '',
    followUpDetails: '',
    prescriptionsUrl: '',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 17,
    patientAppointmentId: 'PA-2025-017',
    patientId: 'PAT-2025-0017',
    doctorId: '2',
    appointmentDate: '2025-01-18',
    appointmentTime: '09:30',
    tokenNo: 'MC-003',
    appointmentStatus: 'Consulting',
    consultationCharge: 600,
    diagnosis: 'Joint swelling',
    followUpDetails: 'Follow up in 1 week',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-017',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 18,
    patientAppointmentId: 'PA-2025-018',
    patientId: 'PAT-2025-0018',
    doctorId: '3',
    appointmentDate: '2025-01-18',
    appointmentTime: '10:00',
    tokenNo: 'JM-003',
    appointmentStatus: 'Completed',
    consultationCharge: 400,
    diagnosis: 'Nausea and vomiting - food poisoning',
    followUpDetails: 'Follow up if symptoms worsen',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-018',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 19,
    patientAppointmentId: 'PA-2025-019',
    patientId: 'PAT-2025-0019',
    doctorId: '4',
    appointmentDate: '2025-01-18',
    appointmentTime: '10:30',
    tokenNo: 'ED-003',
    appointmentStatus: 'Waiting',
    consultationCharge: 300,
    diagnosis: '',
    followUpDetails: '',
    prescriptionsUrl: '',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 20,
    patientAppointmentId: 'PA-2025-020',
    patientId: 'PAT-2025-0020',
    doctorId: '5',
    appointmentDate: '2025-01-18',
    appointmentTime: '11:00',
    tokenNo: 'RL-003',
    appointmentStatus: 'Consulting',
    consultationCharge: 350,
    diagnosis: 'Dizziness',
    followUpDetails: 'Follow up in 3 days',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-020',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 21,
    patientAppointmentId: 'PA-2025-021',
    patientId: 'PAT-2025-0021',
    doctorId: '6',
    appointmentDate: '2025-01-18',
    appointmentTime: '11:30',
    tokenNo: 'MG-003',
    appointmentStatus: 'Completed',
    consultationCharge: 500,
    diagnosis: 'Back pain - muscle strain',
    followUpDetails: 'Follow up in 1 week',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-021',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 22,
    patientAppointmentId: 'PA-2025-022',
    patientId: 'PAT-2025-0022',
    doctorId: '7',
    appointmentDate: '2025-01-18',
    appointmentTime: '12:00',
    tokenNo: 'DW-003',
    appointmentStatus: 'Waiting',
    consultationCharge: 400,
    diagnosis: '',
    followUpDetails: '',
    prescriptionsUrl: '',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 23,
    patientAppointmentId: 'PA-2025-023',
    patientId: 'PAT-2025-0023',
    doctorId: '1',
    appointmentDate: '2025-01-19',
    appointmentTime: '09:00',
    tokenNo: 'HP-005',
    appointmentStatus: 'Consulting',
    consultationCharge: 500,
    diagnosis: 'Shortness of breath',
    followUpDetails: 'Follow up after tests',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-023',
    toBeAdmitted: true,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 24,
    patientAppointmentId: 'PA-2025-024',
    patientId: 'PAT-2025-0024',
    doctorId: '2',
    appointmentDate: '2025-01-19',
    appointmentTime: '09:30',
    tokenNo: 'MC-004',
    appointmentStatus: 'Completed',
    consultationCharge: 600,
    diagnosis: 'Headache - tension headache',
    followUpDetails: 'Follow up in 1 week',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-024',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 25,
    patientAppointmentId: 'PA-2025-025',
    patientId: 'PAT-2025-0025',
    doctorId: '3',
    appointmentDate: '2025-01-19',
    appointmentTime: '10:00',
    tokenNo: 'JM-004',
    appointmentStatus: 'Waiting',
    consultationCharge: 400,
    diagnosis: '',
    followUpDetails: '',
    prescriptionsUrl: '',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 26,
    patientAppointmentId: 'PA-2025-026',
    patientId: 'PAT-2025-0026',
    doctorId: '4',
    appointmentDate: '2025-01-19',
    appointmentTime: '10:30',
    tokenNo: 'ED-004',
    appointmentStatus: 'Consulting',
    consultationCharge: 300,
    diagnosis: 'Chest pain',
    followUpDetails: 'Follow up after ECG',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-026',
    toBeAdmitted: false,
    referToAnotherDoctor: true,
    transferToIPDOTICU: false,
  },
  {
    id: 27,
    patientAppointmentId: 'PA-2025-027',
    patientId: 'PAT-2025-0027',
    doctorId: '5',
    appointmentDate: '2025-01-19',
    appointmentTime: '11:00',
    tokenNo: 'RL-004',
    appointmentStatus: 'Completed',
    consultationCharge: 350,
    diagnosis: 'Fatigue',
    followUpDetails: 'Follow up in 2 weeks',
    prescriptionsUrl: 'https://prescriptions.example.com/PA-2025-027',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
  {
    id: 28,
    patientAppointmentId: 'PA-2025-028',
    patientId: 'PAT-2025-0028',
    doctorId: '6',
    appointmentDate: '2025-01-19',
    appointmentTime: '11:30',
    tokenNo: 'MG-004',
    appointmentStatus: 'Waiting',
    consultationCharge: 500,
    diagnosis: '',
    followUpDetails: '',
    prescriptionsUrl: '',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    transferToIPDOTICU: false,
  },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate Patient Appointment ID in format PA-YYYY-XXX
function generatePatientAppointmentId(): string {
  const year = new Date().getFullYear();
  const count = stubPatientAppointments.length + 1;
  return `PA-${year}-${count.toString().padStart(3, '0')}`;
}

// Generate Token No in format DoctorName-XXX (e.g., HP-001, GP-001)
function generateTokenNo(doctorName: string): string {
  // Extract first letter of first name and first letter of last name
  const nameParts = doctorName.trim().split(/\s+/);
  let prefix = '';
  if (nameParts.length >= 2) {
    // If doctor has first and last name, use first letter of each
    prefix = (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  } else if (nameParts.length === 1) {
    // If only one name, use first two letters
    prefix = nameParts[0].substring(0, 2).toUpperCase();
  } else {
    // Fallback
    prefix = 'DR';
  }
  
  // Find existing tokens with the same prefix
  const existingTokens = stubPatientAppointments
    .filter(apt => apt.tokenNo.startsWith(prefix + '-'))
    .map(apt => {
      const parts = apt.tokenNo.split('-');
      if (parts.length >= 2) {
        const num = parseInt(parts[parts.length - 1]);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    });
  
  const nextNum = existingTokens.length > 0 ? Math.max(...existingTokens) + 1 : 1;
  return `${prefix}-${nextNum.toString().padStart(3, '0')}`;
}

// Backend request DTO (PascalCase) - matches API specification
export interface CreatePatientAppointmentRequestDto {
  PatientId: string; // UUID (required)
  DoctorId: number; // (required)
  AppointmentDate: string; // YYYY-MM-DD format (required)
  AppointmentTime: string; // HH:MM or HH:MM:SS format (required)
  AppointmentStatus?: string; // "Waiting" | "Consulting" | "Completed", defaults to "Waiting"
  ConsultationCharge?: number;
  Diagnosis?: string;
  FollowUpDetails?: string;
  PrescriptionsUrl?: string;
  ToBeAdmitted?: string; // "Yes" | "No", defaults to "No"
  ReferToAnotherDoctor?: string; // "Yes" | "No", defaults to "No"
  ReferredDoctorId?: number; // Required if ReferToAnotherDoctor is "Yes"
  TransferToIPDOTICU?: string; // "Yes" | "No", defaults to "No"
  TransferTo?: string; // "IPD Room Admission" | "ICU" | "OT"
  TransferDetails?: string;
  BillId?: number;
  Status?: string; // "Active" | "Inactive", defaults to "Active"
  CreatedBy?: number;
}

// Backend response DTO (PascalCase)
interface CreatePatientAppointmentResponseDto {
  PatientAppointmentId: number;
  PatientId: string; // UUID
  DoctorId: number;
  AppointmentDate: Date | string;
  AppointmentTime: string;
  TokenNo: string; // Auto-generated (T-0001, T-0002, etc.)
  AppointmentStatus: string;
  ConsultationCharge: number | null;
  Diagnosis: string | null;
  FollowUpDetails: string | null;
  PrescriptionsUrl: string | null;
  ToBeAdmitted: string;
  ReferToAnotherDoctor: string;
  ReferredDoctorId: number | null;
  ReferredDoctorName: string | null;
  TransferToIPDOTICU: string;
  TransferTo: string | null;
  TransferDetails: string | null;
  BillId: number | null;
  BillNo: string | null;
  Status: string;
  CreatedBy: number | null;
  CreatedDate: Date | string;
  PatientName: string | null;
  PatientNo: string | null;
  DoctorName: string | null;
  CreatedByName: string | null;
}

// API response wrapper for create
interface ApiResponse {
  success: boolean;
  message: string;
  data: CreatePatientAppointmentResponseDto;
}

// API response wrapper for getAll
interface GetAllPatientAppointmentsResponse {
  success: boolean;
  count: number;
  data: CreatePatientAppointmentResponseDto[];
}

// Query parameters for getAll
export interface GetAllPatientAppointmentsParams {
  status?: string; // "Active" | "Inactive"
  appointmentStatus?: string; // "Waiting" | "Consulting" | "Completed"
  patientId?: string; // UUID
  doctorId?: number;
  appointmentDate?: string; // YYYY-MM-DD format
  page?: number; // Page number for pagination
  limit?: number; // Limit per page for pagination
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Frontend DTO (camelCase) - for backward compatibility
export interface CreatePatientAppointmentDto {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentStatus?: 'Waiting' | 'Consulting' | 'Completed';
  consultationCharge: number;
  diagnosis?: string;
  followUpDetails?: string;
  prescriptionsUrl?: string;
  toBeAdmitted?: boolean;
  referToAnotherDoctor?: boolean;
  referredDoctorId?: string;
  transferToIPDOTICU?: boolean;
  transferTo?: 'IPD Room Admission' | 'ICU' | 'OT';
  transferDetails?: string;
  billId?: string;
  status?: boolean; // true = "Active", false = "InActive"
}

export interface UpdatePatientAppointmentDto extends Partial<CreatePatientAppointmentDto> {
  id: number;
}

// Map backend response (PascalCase) to frontend PatientAppointment (camelCase)
function mapPatientAppointmentFromBackend(backendData: CreatePatientAppointmentResponseDto): PatientAppointment {
  const appointment: PatientAppointment = {
    id: backendData.PatientAppointmentId,
    patientAppointmentId: `PA-${backendData.PatientAppointmentId}`, // Format as string ID
    patientId: backendData.PatientId,
    doctorId: backendData.DoctorId.toString(), // Convert number to string
    appointmentDate: typeof backendData.AppointmentDate === 'string' 
      ? backendData.AppointmentDate.split('T')[0] 
      : new Date(backendData.AppointmentDate).toISOString().split('T')[0],
    appointmentTime: backendData.AppointmentTime,
    tokenNo: backendData.TokenNo,
    appointmentStatus: backendData.AppointmentStatus as 'Waiting' | 'Consulting' | 'Completed',
    consultationCharge: backendData.ConsultationCharge || 0,
    diagnosis: backendData.Diagnosis || undefined,
    followUpDetails: backendData.FollowUpDetails || undefined,
    prescriptionsUrl: backendData.PrescriptionsUrl || undefined,
    toBeAdmitted: backendData.ToBeAdmitted === 'Yes',
    referToAnotherDoctor: backendData.ReferToAnotherDoctor === 'Yes',
    referredDoctorId: backendData.ReferredDoctorId ? backendData.ReferredDoctorId.toString() : undefined,
    transferToIPDOTICU: backendData.TransferToIPDOTICU === 'Yes',
    transferTo: backendData.TransferTo as 'IPD Room Admission' | 'ICU' | 'OT' | undefined,
    transferDetails: backendData.TransferDetails || undefined,
    billId: backendData.BillId ? backendData.BillId.toString() : undefined,
  };
  // Add status as a property (not in PatientAppointment interface, but needed for UI)
  (appointment as any).status = backendData.Status || 'Active';
  return appointment;
}

export const patientAppointmentsApi = {
  async getAll(params?: GetAllPatientAppointmentsParams): Promise<PaginatedResponse<PatientAppointment>> {
    let apiData: PatientAppointment[] = [];
    let totalCount = 0;
    let totalPages = 0;
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    let isBackendPaginated = false;
    
    try {
      console.log('Fetching patient appointments from API endpoint: /patient-appointments', params);
      
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params?.status) {
        queryParams.append('status', params.status);
      }
      if (params?.appointmentStatus) {
        queryParams.append('appointmentStatus', params.appointmentStatus);
      }
      if (params?.patientId) {
        queryParams.append('patientId', params.patientId);
      }
      if (params?.doctorId !== undefined) {
        queryParams.append('doctorId', params.doctorId.toString());
      }
      if (params?.appointmentDate) {
        queryParams.append('appointmentDate', params.appointmentDate);
      }
      // Add pagination parameters
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      const queryString = queryParams.toString();
      const endpoint = `/patient-appointments${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiRequest<GetAllPatientAppointmentsResponse>(endpoint);
      console.log('Patient appointments API response:', response);
      
      if (response.success && Array.isArray(response.data)) {
        // Check if backend supports pagination by looking for pagination metadata
        // Check for totalCount, total, totalPages, or count fields
        if ((response as any).totalCount !== undefined || (response as any).total !== undefined || 
            (response as any).totalPages !== undefined || response.count !== undefined) {
          isBackendPaginated = true;
          totalCount = (response as any).totalCount || (response as any).total || response.count || response.data.length;
          totalPages = (response as any).totalPages || Math.ceil(totalCount / limit);
          console.log('Found paginated patient appointments:', response.data.length, { totalCount, totalPages, isBackendPaginated });
        } else {
          isBackendPaginated = false;
          totalCount = response.data.length;
          totalPages = Math.ceil(totalCount / limit);
          console.log('Found non-paginated patient appointments (all data, backend does not support pagination):', response.data.length, { totalCount });
        }
        
        // Map each appointment from backend format to frontend format
        if (response.data.length > 0) {
          apiData = response.data.map((appointment) => {
          try {
            return mapPatientAppointmentFromBackend(appointment);
          } catch (err) {
            console.error('Error mapping patient appointment:', err, appointment);
            // Return a minimal appointment object to prevent crashes
            const errorAppointment: PatientAppointment = {
              id: appointment.PatientAppointmentId || 0,
              patientAppointmentId: `PA-${appointment.PatientAppointmentId || 0}`,
              patientId: appointment.PatientId || '',
              doctorId: appointment.DoctorId?.toString() || '',
              appointmentDate: typeof appointment.AppointmentDate === 'string' 
                ? appointment.AppointmentDate.split('T')[0] 
                : new Date().toISOString().split('T')[0],
              appointmentTime: appointment.AppointmentTime || '',
              tokenNo: appointment.TokenNo || '',
              appointmentStatus: (appointment.AppointmentStatus as 'Waiting' | 'Consulting' | 'Completed') || 'Waiting',
              consultationCharge: appointment.ConsultationCharge || 0,
              toBeAdmitted: appointment.ToBeAdmitted === 'Yes',
              referToAnotherDoctor: appointment.ReferToAnotherDoctor === 'Yes',
              transferToIPDOTICU: appointment.TransferToIPDOTICU === 'Yes',
            } as PatientAppointment;
            // Add status as a property (not in PatientAppointment interface, but needed for UI)
            (errorAppointment as any).status = appointment.Status || 'Active';
            return errorAppointment;
          }
          });
          
          console.log(`Mapped ${apiData.length} patient appointments`);
        }
      } else if (response.success && Array.isArray(response.data)) {
        // Empty array response
        isBackendPaginated = false;
        totalCount = 0;
        totalPages = 0;
      }
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      // If stub data is disabled and API fails, throw the error
      if (!ENABLE_STUB_DATA) {
        throw error;
      }
    }
    
    // Append stub data if enabled
    if (ENABLE_STUB_DATA) {
      // Filter out stub data that might conflict with API data (by patientAppointmentId)
      const apiIds = new Set(apiData.map(a => a.patientAppointmentId || a.id.toString()));
      let filteredStubData = stubPatientAppointments.filter(a => {
        const stubId = a.patientAppointmentId || a.id.toString();
        return !apiIds.has(stubId);
      });
      
      // Apply filters to stub data if params are provided
      if (params) {
        if (params.patientId) {
          filteredStubData = filteredStubData.filter(a => a.patientId === params.patientId);
        }
        if (params.doctorId !== undefined) {
          filteredStubData = filteredStubData.filter(a => a.doctorId === params.doctorId.toString());
        }
        if (params.appointmentStatus) {
          filteredStubData = filteredStubData.filter(a => a.appointmentStatus === params.appointmentStatus);
        }
        if (params.appointmentDate) {
          filteredStubData = filteredStubData.filter(a => a.appointmentDate === params.appointmentDate);
        }
      }
      
      if (filteredStubData.length > 0) {
        console.log(`Appending ${filteredStubData.length} stub patient appointments to ${apiData.length} API records`);
      }
      
      // Combine API data with stub data
      const allData = [...apiData, ...filteredStubData];
      totalCount = allData.length;
      totalPages = Math.ceil(totalCount / limit);
      
      // If backend supports pagination, apply server-side pagination
      // Otherwise, return all data and let client handle pagination
      let paginatedData = allData;
      if (isBackendPaginated) {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        paginatedData = allData.slice(startIndex, endIndex);
      }
      const hasMore = isBackendPaginated ? (page < totalPages) : ((page * limit) < totalCount);
      
      // If API returned no data, use stub data as fallback
      if (apiData.length === 0 && filteredStubData.length > 0) {
        console.warn('No patient appointments data received from API, using stub data');
        await delay(300);
      }
      
      return {
        data: paginatedData,
        total: totalCount,
        page: page,
        limit: limit,
        hasMore: hasMore,
      };
    }
    
    // Return only API data if stub data is disabled
    // If backend doesn't support pagination, return all data (client will paginate)
    const hasMore = isBackendPaginated ? (page < totalPages) : ((page * limit) < totalCount);
    return {
      data: apiData,
      total: totalCount,
      page: page,
      limit: limit,
      hasMore: hasMore,
    };
  },

  async getById(id: number): Promise<PatientAppointment> {
    // Replace with: return apiRequest<PatientAppointment>(`/patientappointments/${id}`);
    await delay(200);
    const appointment = stubPatientAppointments.find(a => a.id === id);
    if (!appointment) {
      throw new Error(`PatientAppointment with id ${id} not found`);
    }
    return Promise.resolve(appointment);
  },

  async getByPatientId(patientId: string): Promise<PatientAppointment[]> {
    // Replace with: return apiRequest<PatientAppointment[]>(`/patientappointments?patientId=${patientId}`);
    await delay(200);
    return Promise.resolve(stubPatientAppointments.filter(a => a.patientId === patientId));
  },

  async getByDoctorId(doctorId: string): Promise<PatientAppointment[]> {
    // Replace with: return apiRequest<PatientAppointment[]>(`/patientappointments?doctorId=${doctorId}`);
    await delay(200);
    return Promise.resolve(stubPatientAppointments.filter(a => a.doctorId === doctorId));
  },

  async create(data: CreatePatientAppointmentDto, doctorName: string): Promise<PatientAppointment> {
    try {
      console.log('Creating patient appointment via API:', data);
      
      // Convert frontend DTO (camelCase) to backend request (PascalCase)
      const backendRequest: CreatePatientAppointmentRequestDto = {
        PatientId: data.patientId,
        DoctorId: Number(data.doctorId), // Convert string to number
        AppointmentDate: data.appointmentDate,
        AppointmentTime: data.appointmentTime,
        AppointmentStatus: data.appointmentStatus || 'Waiting',
        ConsultationCharge: data.consultationCharge,
        Diagnosis: data.diagnosis,
        FollowUpDetails: data.followUpDetails,
        PrescriptionsUrl: data.prescriptionsUrl,
        ToBeAdmitted: data.toBeAdmitted ? 'Yes' : 'No',
        ReferToAnotherDoctor: data.referToAnotherDoctor ? 'Yes' : 'No',
        ReferredDoctorId: data.referToAnotherDoctor && data.referredDoctorId 
          ? Number(data.referredDoctorId) 
          : undefined,
        TransferToIPDOTICU: data.transferToIPDOTICU ? 'Yes' : 'No',
        TransferTo: data.transferToIPDOTICU ? data.transferTo : undefined,
        TransferDetails: data.transferDetails,
        BillId: data.billId ? Number(data.billId) : undefined,
        Status: data.status !== undefined ? (data.status ? 'Active' : 'Inactive') : 'Active', // Convert boolean to string
      };
      
      console.log('Backend request (PascalCase):', backendRequest);
      
      const response = await apiRequest<ApiResponse>('/patient-appointments', {
        method: 'POST',
        body: JSON.stringify(backendRequest),
      });
      
      console.log('Patient appointment creation response:', response);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create patient appointment');
      }
      
      const backendData = response.data;
      
      // Map backend response (PascalCase) to frontend PatientAppointment type (camelCase)
      const appointment: PatientAppointment = {
        id: backendData.PatientAppointmentId,
        patientAppointmentId: `PA-${backendData.PatientAppointmentId}`, // Format as string ID
        patientId: backendData.PatientId,
        doctorId: backendData.DoctorId.toString(), // Convert number to string
        appointmentDate: typeof backendData.AppointmentDate === 'string' 
          ? backendData.AppointmentDate.split('T')[0] 
          : new Date(backendData.AppointmentDate).toISOString().split('T')[0],
        appointmentTime: backendData.AppointmentTime,
        tokenNo: backendData.TokenNo,
        appointmentStatus: backendData.AppointmentStatus as 'Waiting' | 'Consulting' | 'Completed',
        consultationCharge: backendData.ConsultationCharge || 0,
        diagnosis: backendData.Diagnosis || undefined,
        followUpDetails: backendData.FollowUpDetails || undefined,
        prescriptionsUrl: backendData.PrescriptionsUrl || undefined,
        toBeAdmitted: backendData.ToBeAdmitted === 'Yes',
        referToAnotherDoctor: backendData.ReferToAnotherDoctor === 'Yes',
        referredDoctorId: backendData.ReferredDoctorId ? backendData.ReferredDoctorId.toString() : undefined,
        transferToIPDOTICU: backendData.TransferToIPDOTICU === 'Yes',
        transferTo: backendData.TransferTo as 'IPD Room Admission' | 'ICU' | 'OT' | undefined,
        transferDetails: backendData.TransferDetails || undefined,
        billId: backendData.BillId ? backendData.BillId.toString() : undefined,
      };
      // Add status as a property (not in PatientAppointment interface, but needed for UI)
      (appointment as any).status = backendData.Status || 'Active';
      
      console.log('Mapped patient appointment:', appointment);
      return appointment;
    } catch (error) {
      console.error('Error creating patient appointment:', error);
      throw error;
    }
  },

  async update(data: UpdatePatientAppointmentDto): Promise<PatientAppointment> {
    try {
      console.log('Updating patient appointment via API:', data);
      
      // Convert frontend DTO (camelCase) to backend request (PascalCase)
      const backendRequest: any = {};
      
      if (data.patientId !== undefined) {
        backendRequest.PatientId = data.patientId;
      }
      if (data.doctorId !== undefined) {
        backendRequest.DoctorId = Number(data.doctorId); // Convert string to number
      }
      if (data.appointmentDate !== undefined) {
        backendRequest.AppointmentDate = data.appointmentDate;
      }
      if (data.appointmentTime !== undefined) {
        backendRequest.AppointmentTime = data.appointmentTime;
      }
      if (data.appointmentStatus !== undefined) {
        backendRequest.AppointmentStatus = data.appointmentStatus;
      }
      if (data.consultationCharge !== undefined) {
        backendRequest.ConsultationCharge = data.consultationCharge;
      }
      if (data.diagnosis !== undefined) {
        backendRequest.Diagnosis = data.diagnosis;
      }
      if (data.followUpDetails !== undefined) {
        backendRequest.FollowUpDetails = data.followUpDetails;
      }
      if (data.prescriptionsUrl !== undefined) {
        backendRequest.PrescriptionsUrl = data.prescriptionsUrl;
      }
      if (data.toBeAdmitted !== undefined) {
        backendRequest.ToBeAdmitted = data.toBeAdmitted ? 'Yes' : 'No';
      }
      if (data.referToAnotherDoctor !== undefined) {
        backendRequest.ReferToAnotherDoctor = data.referToAnotherDoctor ? 'Yes' : 'No';
      }
      if (data.referredDoctorId !== undefined) {
        backendRequest.ReferredDoctorId = data.referredDoctorId ? Number(data.referredDoctorId) : null;
      }
      if (data.transferToIPDOTICU !== undefined) {
        backendRequest.TransferToIPDOTICU = data.transferToIPDOTICU ? 'Yes' : 'No';
      }
      if (data.transferTo !== undefined) {
        backendRequest.TransferTo = data.transferTo;
      }
      if (data.transferDetails !== undefined) {
        backendRequest.TransferDetails = data.transferDetails;
      }
      if (data.billId !== undefined) {
        backendRequest.BillId = data.billId ? Number(data.billId) : null;
      }
      if (data.status !== undefined) {
        // Convert boolean to string: true -> "Active", false -> "Inactive"
        backendRequest.Status = data.status ? 'Active' : 'Inactive';
      }
      
      console.log('Backend update request:', backendRequest);
      
      const response = await apiRequest<ApiResponse>(`/patient-appointments/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(backendRequest),
      });
      
      console.log('Patient appointment update response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update patient appointment');
      }
      
      // Map backend response to frontend format
      const appointment = mapPatientAppointmentFromBackend(response.data);
      console.log('Mapped updated patient appointment:', appointment);
      return appointment;
    } catch (error) {
      console.error('Error updating patient appointment:', error);
      
      // Fallback to stub data if enabled
      if (ENABLE_STUB_DATA) {
        console.warn('API update failed, using stub data fallback');
        await delay(400);
        const index = stubPatientAppointments.findIndex(a => a.id === data.id);
        if (index === -1) {
          throw new Error(`PatientAppointment with id ${data.id} not found`);
        }
        
        // Update stub data with provided fields
        const updated = { ...stubPatientAppointments[index] };
        if (data.patientId !== undefined) updated.patientId = data.patientId;
        if (data.doctorId !== undefined) updated.doctorId = data.doctorId;
        if (data.appointmentDate !== undefined) updated.appointmentDate = data.appointmentDate;
        if (data.appointmentTime !== undefined) updated.appointmentTime = data.appointmentTime;
        if (data.appointmentStatus !== undefined) updated.appointmentStatus = data.appointmentStatus;
        if (data.consultationCharge !== undefined) updated.consultationCharge = data.consultationCharge;
        if (data.diagnosis !== undefined) updated.diagnosis = data.diagnosis;
        if (data.followUpDetails !== undefined) updated.followUpDetails = data.followUpDetails;
        if (data.prescriptionsUrl !== undefined) updated.prescriptionsUrl = data.prescriptionsUrl;
        if (data.toBeAdmitted !== undefined) updated.toBeAdmitted = data.toBeAdmitted;
        if (data.referToAnotherDoctor !== undefined) updated.referToAnotherDoctor = data.referToAnotherDoctor;
        if (data.referredDoctorId !== undefined) updated.referredDoctorId = data.referredDoctorId;
        if (data.transferToIPDOTICU !== undefined) updated.transferToIPDOTICU = data.transferToIPDOTICU;
        if (data.transferTo !== undefined) updated.transferTo = data.transferTo;
        if (data.transferDetails !== undefined) updated.transferDetails = data.transferDetails;
        if (data.billId !== undefined) updated.billId = data.billId;
        
        stubPatientAppointments[index] = updated;
        return Promise.resolve(updated);
      }
      
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      // Ensure id is a valid integer
      const appointmentId = Number(id);
      if (isNaN(appointmentId) || !Number.isInteger(appointmentId) || appointmentId <= 0) {
        throw new Error(`Invalid PatientAppointmentId: ${id}. Must be a positive integer.`);
      }
      
      console.log('Deleting patient appointment via API:', appointmentId);
      
      const response = await apiRequest<ApiResponse>(`/patient-appointments/${appointmentId}`, {
        method: 'DELETE',
      });
      
      console.log('Patient appointment deletion response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete patient appointment');
      }
      
      // Return void on success
      return;
    } catch (error) {
      console.error('Error deleting patient appointment:', error);
      throw error;
    }
  },
};

