// Patient Appointments API service
import { apiRequest } from './base';
import { PatientAppointment } from '../types';

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
  AadharId: string | null;
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
  // Log the raw API response to verify structure
  console.log('Mapping appointment from backend:', {
    PatientAppointmentId: backendData.PatientAppointmentId,
    PatientId: backendData.PatientId,
    PatientNo: (backendData as any).PatientNo, // May be present in response
    TokenNo: backendData.TokenNo,
  });
  
  const appointment: PatientAppointment = {
    id: backendData.PatientAppointmentId,
    patientAppointmentId: `PA-${backendData.PatientAppointmentId}`, // Format as string ID
    patientId: backendData.PatientId, // This should be UUID from API
    doctorId: backendData.DoctorId.toString(), // Convert number to string
    appointmentDate: typeof backendData.AppointmentDate === 'string' 
      ? backendData.AppointmentDate.split('T')[0] 
      : new Date(backendData.AppointmentDate).toISOString().split('T')[0],
    appointmentTime: backendData.AppointmentTime,
    tokenNo: backendData.TokenNo, // This should be the token number from API
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
    aadharId: backendData.AadharId || undefined,
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
      throw error;
    }
    
    // Return API data
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
    try {
      console.log('Fetching patient appointment by ID from API:', id);
      
      // Ensure id is a valid integer
      const appointmentId = Number(id);
      if (isNaN(appointmentId) || !Number.isInteger(appointmentId) || appointmentId <= 0) {
        throw new Error(`Invalid PatientAppointmentId: ${id}. Must be a positive integer.`);
      }
      
      // Call the API endpoint: GET /patient-appointments/:id
      const response = await apiRequest<ApiResponse>(`/patient-appointments/${appointmentId}`);
      
      console.log('Patient appointment getById API response:', response);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || `PatientAppointment with id ${appointmentId} not found`);
      }
      
      // Map backend response (PascalCase) to frontend PatientAppointment type (camelCase)
      const appointment = mapPatientAppointmentFromBackend(response.data);
      
      console.log('Mapped patient appointment from API:', appointment);
      return appointment;
    } catch (error) {
      console.error('Error fetching patient appointment by ID:', error);
      throw error;
    }
  },

  async getByPatientId(patientId: string): Promise<PatientAppointment[]> {
    try {
      const response = await apiRequest<GetAllPatientAppointmentsResponse>(`/patient-appointments/patient/${patientId}`);
      if (response.success && Array.isArray(response.data)) {
        return response.data.map(mapPatientAppointmentFromBackend);
      }
      return [];
    } catch (error) {
      console.error('Error fetching appointments by patient ID:', error);
      throw error;
    }
  },

  async getByDoctorId(doctorId: string): Promise<PatientAppointment[]> {
    try {
      const response = await apiRequest<GetAllPatientAppointmentsResponse>(`/patient-appointments?doctorId=${doctorId}`);
      if (response.success && Array.isArray(response.data)) {
        return response.data.map(mapPatientAppointmentFromBackend);
      }
      return [];
    } catch (error) {
      console.error('Error fetching appointments by doctor ID:', error);
      throw error;
    }
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

