// Patient OT Allocations API service
import { apiRequest } from './base';
import { PatientOTAllocation } from '../types';
import { formatDateIST } from '../utils/timeUtils';

// API Response types
interface PatientOTAllocationResponseItem {
  PatientOTAllocationId: number;
  PatientId: string;
  PatientAppointmentId?: number | null;
  EmergencyBedSlotId?: number | null;
  OTId: number;
  SurgeryId?: number | null;
  LeadSurgeonId: number;
  AssistantDoctorId?: number | null;
  AnaesthetistId?: number | null;
  NurseId?: number | null;
  OTAllocationDate: string | Date;
  DateOfOperation?: string | string[] | Date | Date[] | null;
  Duration?: number | null;
  OTStartTime?: string | null;
  OTEndTime?: string | null;
  OTActualStartTime?: string | null;
  OTActualEndTime?: string | null;
  OperationDescription?: string | null;
  OperationStatus: string; // "Scheduled" | "In Progress" | "Completed" | "Cancelled" | "Postponed"
  PreOperationNotes?: string | null;
  PostOperationNotes?: string | null;
  OTDocuments?: string | null;
  BillId?: number | null;
  OTAllocationCreatedBy?: number | null;
  OTAllocationCreatedAt?: string | Date;
  Status: string; // "Active" | "Inactive"
  // Additional response fields
  PatientName?: string | null;
  PatientNo?: string | null;
  OTNo?: string | null;
  SurgeryName?: string | null;
  LeadSurgeonName?: string | null;
  AssistantDoctorName?: string | null;
  AnaesthetistName?: string | null;
  NurseName?: string | null;
  BillNo?: string | null;
  CreatedByName?: string | null;
  // OT Slot fields (from GET by ID endpoint)
  OTSlotNo?: number | null;
  SlotStartTime?: string | null;
  SlotEndTime?: string | null;
  OTSlotStatus?: string | null; // "Active" | "InActive"
  // Array of slot IDs for this allocation
  OTSlotIds?: number[] | null;
}

interface PatientOTAllocationAPIResponse {
  success: boolean;
  count: number;
  data: PatientOTAllocationResponseItem[];
}

interface PatientOTAllocationCreateResponse {
  success: boolean;
  message: string;
  data: PatientOTAllocationResponseItem;
}

interface PatientOTAllocationGetByIdResponse {
  success: boolean;
  data: PatientOTAllocationResponseItem;
}


// Map backend response to frontend format
function mapPatientOTAllocationFromBackend(backendData: PatientOTAllocationResponseItem): PatientOTAllocation {
  try {
    // Map OperationStatus: "In Progress" -> "InProgress" for frontend compatibility
    let operationStatus: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled' | 'Postponed' = 'Scheduled';
    if (backendData.OperationStatus) {
      const status = backendData.OperationStatus.trim();
      if (status === 'In Progress') {
        operationStatus = 'InProgress';
      } else if (status === 'Scheduled' || status === 'Completed' || status === 'Cancelled' || status === 'Postponed') {
        operationStatus = status as 'Scheduled' | 'Completed' | 'Cancelled' | 'Postponed';
      } else if (status === 'InProgress') {
        operationStatus = 'InProgress';
      }
    }

    return {
      id: backendData.PatientOTAllocationId,
      patientOTAllocationId: backendData.PatientOTAllocationId,
      patientId: backendData.PatientId,
      patientAppointmentId: backendData.PatientAppointmentId?.toString(),
      emergencyBedSlotId: backendData.EmergencyBedSlotId,
      otId: backendData.OTId,
      surgeryId: backendData.SurgeryId,
      leadSurgeonId: backendData.LeadSurgeonId,
      assistantDoctorId: backendData.AssistantDoctorId,
      anaesthetistId: backendData.AnaesthetistId,
      nurseId: backendData.NurseId,
      otAllocationDate: formatDateIST(backendData.OTAllocationDate),
      dateOfOperation: backendData.DateOfOperation 
        ? (Array.isArray(backendData.DateOfOperation) 
            ? backendData.DateOfOperation.map(d => formatDateIST(d))
            : formatDateIST(backendData.DateOfOperation))
        : undefined,
      duration: backendData.Duration?.toString(),
      otStartTime: backendData.OTStartTime || undefined,
      otEndTime: backendData.OTEndTime || undefined,
      otActualStartTime: backendData.OTActualStartTime || undefined,
      otActualEndTime: backendData.OTActualEndTime || undefined,
      operationDescription: backendData.OperationDescription || undefined,
      operationStatus,
      preOperationNotes: backendData.PreOperationNotes || undefined,
      postOperationNotes: backendData.PostOperationNotes || undefined,
      otDocuments: backendData.OTDocuments || undefined,
      billId: backendData.BillId,
      otAllocationCreatedBy: backendData.OTAllocationCreatedBy,
      otAllocationCreatedAt: backendData.OTAllocationCreatedAt 
        ? (typeof backendData.OTAllocationCreatedAt === 'string' 
            ? backendData.OTAllocationCreatedAt 
            : new Date(backendData.OTAllocationCreatedAt).toISOString())
        : undefined,
      status: backendData.Status?.toLowerCase() === 'active' ? 'Active' : 'InActive',
      otSlotIds: backendData.OTSlotIds || undefined,
    };
  } catch (error) {
    console.error('Error mapping PatientOTAllocation from backend:', error, backendData);
    throw error;
  }
}

export interface CreatePatientOTAllocationDto {
  patientId?: string;
  roomAdmissionId?: number;
  patientAppointmentId?: string | number;
  emergencyBedSlotId?: number;
  otId: number;
  surgeryId?: number;
  leadSurgeonId: number;
  assistantDoctorId?: number;
  anaesthetistId?: number;
  nurseId?: number;
  otAllocationDate: string;
  dateOfOperation?: string | string[];
  duration?: string | number;
  otStartTime?: string;
  otEndTime?: string;
  operationDescription?: string;
  operationStatus?: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled' | 'Postponed';
  preOperationNotes?: string;
  postOperationNotes?: string;
  otDocuments?: string;
  billId?: number;
  otSlotIds?: number[];
}

export interface UpdatePatientOTAllocationDto {
  id: number;
  patientId?: string;
  roomAdmissionId?: number;
  patientAppointmentId?: string | number;
  emergencyBedSlotId?: number;
  otId?: number;
  surgeryId?: number;
  leadSurgeonId?: number;
  assistantDoctorId?: number;
  anaesthetistId?: number;
  nurseId?: number;
  otAllocationDate?: string;
  dateOfOperation?: string | string[];
  duration?: string | number;
  otStartTime?: string;
  otEndTime?: string;
  otActualStartTime?: string;
  otActualEndTime?: string;
  operationDescription?: string;
  operationStatus?: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled' | 'Postponed';
  preOperationNotes?: string;
  postOperationNotes?: string;
  otDocuments?: string;
  billId?: number;
  otSlotIds?: number[];
}

export const patientOTAllocationsApi = {
  /**
   * Get all patient OT allocations
   */
  async getAll(): Promise<PatientOTAllocation[]> {
    try {
      const response = await apiRequest<PatientOTAllocationAPIResponse>('/patient-ot-allocations');
      if (response.success && response.data) {
        return response.data.map(mapPatientOTAllocationFromBackend);
      }
      return [];
    } catch (error) {
      console.error('Error fetching patient OT allocations:', error);
      throw error;
    }
  },

  /**
   * Get patient OT allocation by ID
   */
  async getById(id: number): Promise<PatientOTAllocation> {
    try {
      const response = await apiRequest<PatientOTAllocationGetByIdResponse>(`/patient-ot-allocations/${id}`);
      if (response.success && response.data) {
        return mapPatientOTAllocationFromBackend(response.data);
      }
      throw new Error('Failed to fetch patient OT allocation');
    } catch (error) {
      console.error('Error fetching patient OT allocation by ID:', error);
      throw error;
    }
  },

  /**
   * Create a new patient OT allocation
   */
  async create(data: CreatePatientOTAllocationDto): Promise<PatientOTAllocation> {
    try {
      const response = await apiRequest<PatientOTAllocationCreateResponse>('/patient-ot-allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (response.success && response.data) {
        return mapPatientOTAllocationFromBackend(response.data);
      }
      throw new Error(response.message || 'Failed to create patient OT allocation');
    } catch (error) {
      console.error('Error creating patient OT allocation:', error);
      throw error;
    }
  },

  /**
   * Update a patient OT allocation
   */
  async update(data: UpdatePatientOTAllocationDto): Promise<PatientOTAllocation> {
    try {
      const { id, ...updateData } = data;
      const response = await apiRequest<PatientOTAllocationCreateResponse>(`/patient-ot-allocations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      if (response.success && response.data) {
        return mapPatientOTAllocationFromBackend(response.data);
      }
      throw new Error(response.message || 'Failed to update patient OT allocation');
    } catch (error) {
      console.error('Error updating patient OT allocation:', error);
      throw error;
    }
  },

  /**
   * Delete a patient OT allocation
   */
  async delete(id: number): Promise<void> {
    try {
      await apiRequest<{ success: boolean; message: string }>(`/patient-ot-allocations/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting patient OT allocation:', error);
      throw error;
    }
  },
};

