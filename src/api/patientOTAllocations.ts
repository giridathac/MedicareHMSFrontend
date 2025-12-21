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
      // Convert camelCase to PascalCase for backend API
      const backendData: any = {
        PatientId: data.patientId,
        OTId: data.otId,
        LeadSurgeonId: data.leadSurgeonId,
        OTAllocationDate: data.otAllocationDate,
      };

      // Add optional fields if provided
      if (data.roomAdmissionId !== undefined) {
        backendData.RoomAdmissionId = data.roomAdmissionId;
      }
      if (data.patientAppointmentId !== undefined) {
        backendData.PatientAppointmentId = typeof data.patientAppointmentId === 'string' 
          ? Number(data.patientAppointmentId) 
          : data.patientAppointmentId;
      }
      if (data.emergencyBedSlotId !== undefined) {
        backendData.EmergencyBedSlotId = data.emergencyBedSlotId;
      }
      if (data.otSlotIds && data.otSlotIds.length > 0) {
        backendData.OTSlotIds = data.otSlotIds;
      }
      if (data.surgeryId !== undefined && data.surgeryId !== null) {
        backendData.SurgeryId = data.surgeryId;
      }
      if (data.assistantDoctorId !== undefined && data.assistantDoctorId !== null) {
        backendData.AssistantDoctorId = data.assistantDoctorId;
      }
      if (data.anaesthetistId !== undefined && data.anaesthetistId !== null) {
        backendData.AnaesthetistId = data.anaesthetistId;
      }
      if (data.nurseId !== undefined && data.nurseId !== null) {
        backendData.NurseId = data.nurseId;
      }
      if (data.dateOfOperation !== undefined && data.dateOfOperation !== null) {
        backendData.DateOfOperation = data.dateOfOperation;
      }
      if (data.duration !== undefined && data.duration !== null) {
        backendData.Duration = typeof data.duration === 'string' ? Number(data.duration) : data.duration;
      }
      if (data.otStartTime !== undefined && data.otStartTime !== null) {
        backendData.OTStartTime = data.otStartTime;
      }
      if (data.otEndTime !== undefined && data.otEndTime !== null) {
        backendData.OTEndTime = data.otEndTime;
      }
      if (data.otActualStartTime !== undefined && data.otActualStartTime !== null) {
        backendData.OTActualStartTime = data.otActualStartTime;
      }
      if (data.otActualEndTime !== undefined && data.otActualEndTime !== null) {
        backendData.OTActualEndTime = data.otActualEndTime;
      }
      if (data.operationDescription !== undefined && data.operationDescription !== null) {
        backendData.OperationDescription = data.operationDescription;
      }
      if (data.operationStatus !== undefined && data.operationStatus !== null) {
        // Convert "InProgress" to "In Progress" for backend
        backendData.OperationStatus = data.operationStatus === 'InProgress' ? 'In Progress' : data.operationStatus;
      }
      if (data.preOperationNotes !== undefined && data.preOperationNotes !== null) {
        backendData.PreOperationNotes = data.preOperationNotes;
      }
      if (data.postOperationNotes !== undefined && data.postOperationNotes !== null) {
        backendData.PostOperationNotes = data.postOperationNotes;
      }
      if (data.otDocuments !== undefined && data.otDocuments !== null) {
        backendData.OTDocuments = data.otDocuments;
      }
      if (data.billId !== undefined && data.billId !== null) {
        backendData.BillId = data.billId;
      }
      if (data.status !== undefined) {
        backendData.Status = data.status;
      } else {
        backendData.Status = 'Active';
      }

      console.log('Creating patient OT allocation with data:', JSON.stringify(backendData, null, 2));

      const response = await apiRequest<PatientOTAllocationCreateResponse>('/patient-ot-allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
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
      
      // Convert camelCase to PascalCase for backend API
      const backendData: any = {};
      
      if (updateData.patientId !== undefined) {
        backendData.PatientId = updateData.patientId;
      }
      if (updateData.roomAdmissionId !== undefined) {
        backendData.RoomAdmissionId = updateData.roomAdmissionId;
      }
      if (updateData.patientAppointmentId !== undefined) {
        backendData.PatientAppointmentId = typeof updateData.patientAppointmentId === 'string' 
          ? Number(updateData.patientAppointmentId) 
          : updateData.patientAppointmentId;
      }
      if (updateData.emergencyBedSlotId !== undefined) {
        backendData.EmergencyBedSlotId = updateData.emergencyBedSlotId;
      }
      if (updateData.otId !== undefined) {
        backendData.OTId = updateData.otId;
      }
      if (updateData.surgeryId !== undefined && updateData.surgeryId !== null) {
        backendData.SurgeryId = updateData.surgeryId;
      }
      if (updateData.leadSurgeonId !== undefined) {
        backendData.LeadSurgeonId = updateData.leadSurgeonId;
      }
      if (updateData.assistantDoctorId !== undefined && updateData.assistantDoctorId !== null) {
        backendData.AssistantDoctorId = updateData.assistantDoctorId;
      }
      if (updateData.anaesthetistId !== undefined && updateData.anaesthetistId !== null) {
        backendData.AnaesthetistId = updateData.anaesthetistId;
      }
      if (updateData.nurseId !== undefined && updateData.nurseId !== null) {
        backendData.NurseId = updateData.nurseId;
      }
      if (updateData.otAllocationDate !== undefined) {
        backendData.OTAllocationDate = updateData.otAllocationDate;
      }
      if (updateData.dateOfOperation !== undefined && updateData.dateOfOperation !== null) {
        backendData.DateOfOperation = updateData.dateOfOperation;
      }
      if (updateData.duration !== undefined && updateData.duration !== null) {
        backendData.Duration = typeof updateData.duration === 'string' ? Number(updateData.duration) : updateData.duration;
      }
      if (updateData.otStartTime !== undefined && updateData.otStartTime !== null) {
        backendData.OTStartTime = updateData.otStartTime;
      }
      if (updateData.otEndTime !== undefined && updateData.otEndTime !== null) {
        backendData.OTEndTime = updateData.otEndTime;
      }
      if (updateData.otActualStartTime !== undefined && updateData.otActualStartTime !== null) {
        backendData.OTActualStartTime = updateData.otActualStartTime;
      }
      if (updateData.otActualEndTime !== undefined && updateData.otActualEndTime !== null) {
        backendData.OTActualEndTime = updateData.otActualEndTime;
      }
      if (updateData.operationDescription !== undefined && updateData.operationDescription !== null) {
        backendData.OperationDescription = updateData.operationDescription;
      }
      if (updateData.operationStatus !== undefined && updateData.operationStatus !== null) {
        // Convert "InProgress" to "In Progress" for backend
        backendData.OperationStatus = updateData.operationStatus === 'InProgress' ? 'In Progress' : updateData.operationStatus;
      }
      if (updateData.preOperationNotes !== undefined && updateData.preOperationNotes !== null) {
        backendData.PreOperationNotes = updateData.preOperationNotes;
      }
      if (updateData.postOperationNotes !== undefined && updateData.postOperationNotes !== null) {
        backendData.PostOperationNotes = updateData.postOperationNotes;
      }
      if (updateData.otDocuments !== undefined && updateData.otDocuments !== null) {
        backendData.OTDocuments = updateData.otDocuments;
      }
      if (updateData.billId !== undefined && updateData.billId !== null) {
        backendData.BillId = updateData.billId;
      }
      if (updateData.otSlotIds !== undefined && updateData.otSlotIds !== null) {
        backendData.OTSlotIds = updateData.otSlotIds;
      }
      if (updateData.status !== undefined) {
        backendData.Status = updateData.status;
      }

      console.log('Updating patient OT allocation with data:', JSON.stringify(backendData, null, 2));

      const response = await apiRequest<PatientOTAllocationCreateResponse>(`/patient-ot-allocations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
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

