// Emergency Admissions API service
import { apiRequest, ENABLE_STUB_DATA } from './base';
import { EmergencyAdmission, EmergencyAdmissionVitals } from '../types';

// API Response types
interface EmergencyAdmissionResponseItem {
  EmergencyAdmissionId: number;
  DoctorId: number;
  PatientId: string; // UUID
  EmergencyBedSlotId?: number; // Optional - kept for backward compatibility
  EmergencyBedId?: number; // New field - the bed ID
  EmergencyAdmissionDate: string | Date;
  EmergencyStatus: string | null; // "Admitted" | "IPD" | "OT" | "ICU" | "Discharged"
  AllocationFromDate?: Date | null;
  AllocationToDate?: Date | null;
  NumberOfDays?: number | null;
  Diagnosis?: string | null;
  TreatementDetails?: string | null; // Note: API uses typo "TreatementDetails"
  PatientCondition?: string | null; // "Critical" | "Stable"
  Priority?: string | null; // "Low" | "Medium" | "High" | "Critical"
  TransferToIPD?: string | null; // "Yes" | "No"
  TransferToOT?: string | null; // "Yes" | "No"
  TransferToICU?: string | null; // "Yes" | "No"
  TransferTo?: string | null; // "IPD Room Admission" | "ICU" | "OT"
  TransferDetails?: string | null;
  AdmissionCreatedBy?: number | null;
  AdmissionCreatedAt?: string | Date;
  Status: string; // "Active" | "Inactive"
  // Additional response fields (may not be in all responses)
  PatientName?: string | null;
  PatientNo?: string | null;
  DoctorName?: string | null;
  EmergencyBedSlotNo?: string | null;
  EmergencyBedNo?: string | null; // Bed number from backend
  CreatedByName?: string | null;
}

interface EmergencyAdmissionAPIResponse {
  success: boolean;
  count: number;
  data: EmergencyAdmissionResponseItem[];
}

interface EmergencyAdmissionCreateResponse {
  success: boolean;
  message: string;
  data: EmergencyAdmissionResponseItem;
}

interface EmergencyAdmissionGetByIdResponse {
  success: boolean;
  data: EmergencyAdmissionResponseItem;
}

// Stub data
const stubEmergencyAdmissions: EmergencyAdmissionResponseItem[] = [
  {
    EmergencyAdmissionId: 1,
    DoctorId: 1,
    PatientId: '00000000-0000-0000-0000-000000000001',
    EmergencyBedSlotId: 1,
    EmergencyAdmissionDate: '2025-01-15',
    EmergencyStatus: 'Admitted',
    Diagnosis: 'Acute Appendicitis',
    TreatementDetails: 'Emergency surgery required',
    PatientCondition: 'Critical',
    Priority: 'Critical',
    TransferToIPDOTICU: false,
    Status: 'Active',
  },
  {
    EmergencyAdmissionId: 2,
    DoctorId: 2,
    PatientId: '00000000-0000-0000-0000-000000000002',
    EmergencyBedSlotId: 2,
    EmergencyAdmissionDate: '2025-01-16',
    EmergencyStatus: 'IPD',
    Diagnosis: 'Fractured Leg',
    TreatementDetails: 'Surgery completed, recovery in progress',
    PatientCondition: 'Stable',
    Priority: 'High',
    TransferToIPDOTICU: true,
    TransferTo: 'IPD Room Admission',
    TransferDetails: 'Transferred to Room 101, Bed 1',
    Status: 'Active',
  },
];

// Map API response to EmergencyAdmission interface
function mapEmergencyAdmissionResponseToEmergencyAdmission(item: EmergencyAdmissionResponseItem): EmergencyAdmission {
  // Determine transferToIPDOTICU from separate fields or TransferTo
  const transferToIPDOTICU = !!(item.TransferToIPD === 'Yes' || item.TransferToOT === 'Yes' || item.TransferToICU === 'Yes' || item.TransferTo);
  
  return {
    id: item.EmergencyAdmissionId || 0,
    emergencyAdmissionId: item.EmergencyAdmissionId || 0,
    doctorId: item.DoctorId || 0,
    patientId: item.PatientId || '',
    emergencyBedSlotId: item.EmergencyBedSlotId ?? undefined,
    emergencyBedId: item.EmergencyBedId ?? undefined,
    emergencyAdmissionDate: typeof item.EmergencyAdmissionDate === 'string' 
      ? item.EmergencyAdmissionDate 
      : new Date(item.EmergencyAdmissionDate).toISOString().split('T')[0],
    emergencyStatus: (item.EmergencyStatus || 'Admitted') as EmergencyAdmission['emergencyStatus'],
    diagnosis: item.Diagnosis ?? undefined,
    treatmentDetails: item.TreatementDetails ?? undefined, // Map typo to correct field name
    patientCondition: (item.PatientCondition || 'Stable') as EmergencyAdmission['patientCondition'],
    priority: (item.Priority || 'Medium') as EmergencyAdmission['priority'],
    transferToIPDOTICU: transferToIPDOTICU,
    transferTo: item.TransferTo as EmergencyAdmission['transferTo'] | undefined,
    transferDetails: item.TransferDetails ?? undefined,
    admissionCreatedBy: item.AdmissionCreatedBy ?? undefined,
    admissionCreatedAt: typeof item.AdmissionCreatedAt === 'string' 
      ? item.AdmissionCreatedAt 
      : item.AdmissionCreatedAt 
        ? new Date(item.AdmissionCreatedAt).toISOString() 
        : undefined,
    status: item.Status as EmergencyAdmission['status'],
    // Additional response fields
    patientName: item.PatientName ?? undefined,
    patientNo: item.PatientNo ?? undefined,
    doctorName: item.DoctorName ?? undefined,
    emergencyBedSlotNo: item.EmergencyBedSlotNo ?? undefined,
    emergencyBedNo: item.EmergencyBedNo ?? undefined, // Bed number from backend
    createdByName: item.CreatedByName ?? undefined,
  };
}

// DTOs for create and update
export interface CreateEmergencyAdmissionDto {
  doctorId: number; // Required
  patientId: string; // UUID, required
  emergencyBedId: number; // Required
  emergencyAdmissionDate: string; // YYYY-MM-DD, required
  emergencyStatus?: 'Admitted' | 'IPD' | 'OT' | 'ICU' | 'Discharged' | 'Movedout'; // Optional
  allocationFromDate?: string | null; // YYYY-MM-DD format, optional
  allocationToDate?: string | null; // YYYY-MM-DD format, optional
  numberOfDays?: number | null; // Optional
  diagnosis?: string | null;
  treatmentDetails?: string | null;
  patientCondition?: 'Critical' | 'Stable'; // Optional
  priority?: string; // Optional: "Low" | "Medium" | "High" | "Critical"
  transferToIPD?: 'Yes' | 'No' | null; // Optional, defaults to "No"
  transferToOT?: 'Yes' | 'No' | null; // Optional, defaults to "No"
  transferToICU?: 'Yes' | 'No' | null; // Optional, defaults to "No"
  transferTo?: string | null;
  transferDetails?: string | null;
  admissionCreatedBy?: number | null;
  status?: 'Active' | 'Inactive'; // Optional, defaults to "Active"
}

export interface UpdateEmergencyAdmissionDto {
  id: number; // EmergencyAdmissionId
  doctorId?: number;
  patientId?: string; // UUID
  emergencyBedId?: number;
  emergencyAdmissionDate?: string; // YYYY-MM-DD
  emergencyStatus?: 'Admitted' | 'IPD' | 'OT' | 'ICU' | 'Discharged' | 'Movedout';
  allocationFromDate?: string | null; // YYYY-MM-DD format
  allocationToDate?: string | null; // YYYY-MM-DD format
  numberOfDays?: number | null;
  diagnosis?: string | null;
  treatmentDetails?: string | null;
  patientCondition?: 'Critical' | 'Stable';
  priority?: string | null; // "Low" | "Medium" | "High" | "Critical"
  transferToIPD?: 'Yes' | 'No' | null;
  transferToOT?: 'Yes' | 'No' | null;
  transferToICU?: 'Yes' | 'No' | null;
  transferTo?: string | null;
  transferDetails?: string | null;
  admissionCreatedBy?: number | null;
  status?: 'Active' | 'Inactive';
}

export const emergencyAdmissionsApi = {
  async getAll(params?: {
    status?: string;
    emergencyStatus?: string;
    patientId?: string;
    doctorId?: number;
    emergencyBedSlotId?: number;
  }): Promise<EmergencyAdmission[]> {
    try {
      let endpoint = '/emergency-admissions';
      const queryParams: string[] = [];
      
      if (params?.status) {
        queryParams.push(`status=${encodeURIComponent(params.status)}`);
      }
      if (params?.emergencyStatus) {
        queryParams.push(`emergencyStatus=${encodeURIComponent(params.emergencyStatus)}`);
      }
      if (params?.patientId) {
        queryParams.push(`patientId=${encodeURIComponent(params.patientId)}`);
      }
      if (params?.doctorId !== undefined) {
        queryParams.push(`doctorId=${params.doctorId}`);
      }
      if (params?.emergencyBedSlotId !== undefined) {
        queryParams.push(`emergencyBedSlotId=${params.emergencyBedSlotId}`);
      }
      
      if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
      }
      
      const response = await apiRequest<EmergencyAdmissionAPIResponse>(endpoint);
      
      if (response.success && response.data) {
        const apiData = response.data.map(mapEmergencyAdmissionResponseToEmergencyAdmission);
        return apiData;
      }
      
      // If response is not successful, return empty array
      return [];
    } catch (err) {
      console.error('Error fetching emergency admissions:', err);
      
      // Only use stub data if enabled and API fails
      if (ENABLE_STUB_DATA) {
        let filteredStubData = [...stubEmergencyAdmissions];
        
        if (params?.status) {
          filteredStubData = filteredStubData.filter(item => 
            item.Status.toLowerCase() === params.status!.toLowerCase()
          );
        }
        
        if (params?.emergencyStatus) {
          filteredStubData = filteredStubData.filter(item => 
            (item.EmergencyStatus || '').toLowerCase() === params.emergencyStatus!.toLowerCase()
          );
        }
        
        const stubData = filteredStubData.map(mapEmergencyAdmissionResponseToEmergencyAdmission);
        return stubData;
      }
      
      // If stub data is disabled and API fails, throw the error
      throw err;
    }
  },

  async getById(id: number): Promise<EmergencyAdmission> {
    if (!ENABLE_STUB_DATA) {
      try {
        const response = await apiRequest<EmergencyAdmissionGetByIdResponse>(`/emergency-admissions/${id}`);
        if (response.success && response.data) {
          return mapEmergencyAdmissionResponseToEmergencyAdmission(response.data);
        }
        throw new Error('Emergency admission not found');
      } catch (err) {
        console.error('Error fetching emergency admission:', err);
        throw err;
      }
    }
    
    // Stub implementation
    const stubAdmission = stubEmergencyAdmissions.find(a => a.EmergencyAdmissionId === id);
    if (!stubAdmission) {
      throw new Error('Emergency admission not found');
    }
    return mapEmergencyAdmissionResponseToEmergencyAdmission(stubAdmission);
  },

  async create(data: CreateEmergencyAdmissionDto): Promise<EmergencyAdmission> {
    if (!ENABLE_STUB_DATA) {
      try {
        // Map frontend DTO to backend request format
        const backendRequest: any = {
          DoctorId: data.doctorId,
          PatientId: data.patientId,
          EmergencyBedId: data.emergencyBedId, // Required
          EmergencyAdmissionDate: data.emergencyAdmissionDate,
          EmergencyStatus: data.emergencyStatus ?? null,
          AllocationFromDate: data.allocationFromDate ?? null,
          AllocationToDate: data.allocationToDate ?? null,
          NumberOfDays: data.numberOfDays ?? null,
          Diagnosis: data.diagnosis ?? null,
          TreatementDetails: data.treatmentDetails ?? null, // Use API typo
          PatientCondition: data.patientCondition ?? null,
          Priority: data.priority ?? null,
          TransferToIPD: data.transferToIPD ?? 'No',
          TransferToOT: data.transferToOT ?? 'No',
          TransferToICU: data.transferToICU ?? 'No',
          TransferTo: data.transferTo ?? null,
          TransferDetails: data.transferDetails ?? null,
          AdmissionCreatedBy: data.admissionCreatedBy ?? null,
          Status: data.status ?? 'Active',
        };
        
        const response = await apiRequest<EmergencyAdmissionCreateResponse>('/emergency-admissions', {
          method: 'POST',
          body: JSON.stringify(backendRequest),
        });
        
        if (response.success && response.data) {
          return mapEmergencyAdmissionResponseToEmergencyAdmission(response.data);
        }
        throw new Error('Failed to create emergency admission');
      } catch (err) {
        console.error('Error creating emergency admission:', err);
        throw err;
      }
    }
    
    // Stub implementation
    // Note: Response may still have EmergencyBedSlotId for backward compatibility
    // but we use EmergencyBedId in the request
    const newAdmission: EmergencyAdmissionResponseItem = {
      EmergencyAdmissionId: stubEmergencyAdmissions.length + 1,
      DoctorId: data.doctorId,
      PatientId: data.patientId,
      EmergencyBedSlotId: data.emergencyBedId, // Map EmergencyBedId to EmergencyBedSlotId in stub
      EmergencyAdmissionDate: data.emergencyAdmissionDate,
      EmergencyStatus: data.emergencyStatus ?? null,
      AllocationFromDate: data.allocationFromDate ? new Date(data.allocationFromDate) : null,
      AllocationToDate: data.allocationToDate ? new Date(data.allocationToDate) : null,
      NumberOfDays: data.numberOfDays ?? null,
      Diagnosis: data.diagnosis ?? null,
      TreatementDetails: data.treatmentDetails ?? null,
      PatientCondition: data.patientCondition ?? null,
      TransferToIPD: data.transferToIPD ?? 'No',
      TransferToOT: data.transferToOT ?? 'No',
      TransferToICU: data.transferToICU ?? 'No',
      TransferTo: data.transferTo ?? null,
      TransferDetails: data.transferDetails ?? null,
      AdmissionCreatedBy: data.admissionCreatedBy ?? null,
      Status: data.status ?? 'Active',
    };
    stubEmergencyAdmissions.push(newAdmission);
    return mapEmergencyAdmissionResponseToEmergencyAdmission(newAdmission);
  },

  async update(data: UpdateEmergencyAdmissionDto): Promise<EmergencyAdmission> {
    if (!ENABLE_STUB_DATA) {
      try {
        // Map frontend DTO to backend request format
        const backendRequest: any = {};
        
        if (data.doctorId !== undefined) backendRequest.DoctorId = data.doctorId;
        if (data.patientId !== undefined) backendRequest.PatientId = data.patientId;
        if (data.emergencyBedId !== undefined) backendRequest.EmergencyBedId = data.emergencyBedId;
        if (data.emergencyAdmissionDate !== undefined) backendRequest.EmergencyAdmissionDate = data.emergencyAdmissionDate;
        if (data.emergencyStatus !== undefined) backendRequest.EmergencyStatus = data.emergencyStatus;
        if (data.allocationFromDate !== undefined) backendRequest.AllocationFromDate = data.allocationFromDate ?? null;
        if (data.allocationToDate !== undefined) backendRequest.AllocationToDate = data.allocationToDate ?? null;
        if (data.numberOfDays !== undefined) backendRequest.NumberOfDays = data.numberOfDays ?? null;
        if (data.diagnosis !== undefined) backendRequest.Diagnosis = data.diagnosis ?? null;
        if (data.treatmentDetails !== undefined) backendRequest.TreatementDetails = data.treatmentDetails ?? null; // Use API typo
        if (data.patientCondition !== undefined) backendRequest.PatientCondition = data.patientCondition;
        if (data.priority !== undefined) backendRequest.Priority = data.priority ?? null;
        if (data.transferToIPD !== undefined) backendRequest.TransferToIPD = data.transferToIPD ?? null;
        if (data.transferToOT !== undefined) backendRequest.TransferToOT = data.transferToOT ?? null;
        if (data.transferToICU !== undefined) backendRequest.TransferToICU = data.transferToICU ?? null;
        if (data.transferTo !== undefined) backendRequest.TransferTo = data.transferTo ?? null;
        if (data.transferDetails !== undefined) backendRequest.TransferDetails = data.transferDetails ?? null;
        if (data.admissionCreatedBy !== undefined) backendRequest.AdmissionCreatedBy = data.admissionCreatedBy ?? null;
        if (data.status !== undefined) backendRequest.Status = data.status;
        
        const response = await apiRequest<EmergencyAdmissionGetByIdResponse>(`/emergency-admissions/${data.id}`, {
          method: 'PUT',
          body: JSON.stringify(backendRequest),
        });
        
        if (response.success && response.data) {
          return mapEmergencyAdmissionResponseToEmergencyAdmission(response.data);
        }
        throw new Error('Failed to update emergency admission');
      } catch (err) {
        console.error('Error updating emergency admission:', err);
        throw err;
      }
    }
    
    // Stub implementation
    const index = stubEmergencyAdmissions.findIndex(a => a.EmergencyAdmissionId === data.id);
    if (index === -1) {
      throw new Error('Emergency admission not found');
    }
    
    const updated = { ...stubEmergencyAdmissions[index] };
    if (data.doctorId !== undefined) updated.DoctorId = data.doctorId;
    if (data.patientId !== undefined) updated.PatientId = data.patientId;
    // Map EmergencyBedId to EmergencyBedSlotId in stub (response may still use EmergencyBedSlotId)
    if (data.emergencyBedId !== undefined) updated.EmergencyBedSlotId = data.emergencyBedId;
    if (data.emergencyAdmissionDate !== undefined) updated.EmergencyAdmissionDate = data.emergencyAdmissionDate;
    if (data.emergencyStatus !== undefined) updated.EmergencyStatus = data.emergencyStatus;
    if (data.allocationFromDate !== undefined) updated.AllocationFromDate = data.allocationFromDate ? new Date(data.allocationFromDate) : null;
    if (data.allocationToDate !== undefined) updated.AllocationToDate = data.allocationToDate ? new Date(data.allocationToDate) : null;
    if (data.numberOfDays !== undefined) updated.NumberOfDays = data.numberOfDays ?? null;
    if (data.diagnosis !== undefined) updated.Diagnosis = data.diagnosis ?? null;
    if (data.treatmentDetails !== undefined) updated.TreatementDetails = data.treatmentDetails ?? null;
    if (data.patientCondition !== undefined) updated.PatientCondition = data.patientCondition;
    if (data.priority !== undefined) updated.Priority = data.priority ?? null;
    if (data.transferToIPD !== undefined) updated.TransferToIPD = data.transferToIPD ?? null;
    if (data.transferToOT !== undefined) updated.TransferToOT = data.transferToOT ?? null;
    if (data.transferToICU !== undefined) updated.TransferToICU = data.transferToICU ?? null;
    if (data.transferTo !== undefined) updated.TransferTo = data.transferTo ?? null;
    if (data.transferDetails !== undefined) updated.TransferDetails = data.transferDetails ?? null;
    if (data.admissionCreatedBy !== undefined) updated.AdmissionCreatedBy = data.admissionCreatedBy ?? null;
    if (data.status !== undefined) updated.Status = data.status;
    
    stubEmergencyAdmissions[index] = updated;
    return mapEmergencyAdmissionResponseToEmergencyAdmission(updated);
  },

  async delete(id: number): Promise<void> {
    if (!ENABLE_STUB_DATA) {
      try {
        await apiRequest<void>(`/emergency-admissions/${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Error deleting emergency admission:', err);
        throw err;
      }
    } else {
      // Stub implementation
      const index = stubEmergencyAdmissions.findIndex(a => a.EmergencyAdmissionId === id);
      if (index === -1) {
        throw new Error('Emergency admission not found');
      }
      stubEmergencyAdmissions.splice(index, 1);
    }
  },
};

// Vitals API Response types
interface EmergencyAdmissionVitalsResponseItem {
  EmergencyAdmissionVitalsId: number;
  EmergencyAdmissionId: number;
  NurseId: number;
  RecordedDateTime: string | Date;
  HeartRate?: number | null;
  BloodPressure?: string | null;
  Temperature?: number | null;
  O2Saturation?: number | null;
  RespiratoryRate?: number | null;
  PulseRate?: number | null;
  VitalsStatus: string; // "Critical" | "Stable"
  VitalsRemarks?: string | null;
  VitalsCreatedBy?: number | null;
  VitalsCreatedAt?: string | Date;
  Status?: string | null;
  // Additional response fields
  NurseName?: string | null;
  CreatedByName?: string | null;
}

interface EmergencyAdmissionVitalsAPIResponse {
  success: boolean;
  count: number;
  emergencyAdmissionId: number;
  data: EmergencyAdmissionVitalsResponseItem[];
}

interface EmergencyAdmissionVitalsGetByIdResponse {
  success: boolean;
  data: EmergencyAdmissionVitalsResponseItem;
}

interface EmergencyAdmissionVitalsCreateResponse {
  success: boolean;
  message: string;
  data: EmergencyAdmissionVitalsResponseItem;
}

// DTOs for Vitals
export interface CreateEmergencyAdmissionVitalsDto {
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
  status?: string;
}

export interface UpdateEmergencyAdmissionVitalsDto {
  nurseId?: number;
  recordedDateTime?: string;
  heartRate?: number;
  bloodPressure?: string;
  temperature?: number;
  o2Saturation?: number;
  respiratoryRate?: number;
  pulseRate?: number;
  vitalsStatus?: 'Critical' | 'Stable';
  vitalsRemarks?: string;
  status?: string;
}

// Helper function to transform vitals API response to our type
function transformVitalsResponse(item: EmergencyAdmissionVitalsResponseItem): EmergencyAdmissionVitals {
  return {
    emergencyAdmissionVitalsId: item.EmergencyAdmissionVitalsId,
    emergencyAdmissionId: item.EmergencyAdmissionId,
    nurseId: item.NurseId,
    recordedDateTime: typeof item.RecordedDateTime === 'string' ? item.RecordedDateTime : item.RecordedDateTime.toISOString(),
    heartRate: item.HeartRate ?? undefined,
    bloodPressure: item.BloodPressure ?? undefined,
    temperature: item.Temperature ?? undefined,
    o2Saturation: item.O2Saturation ?? undefined,
    respiratoryRate: item.RespiratoryRate ?? undefined,
    pulseRate: item.PulseRate ?? undefined,
    vitalsStatus: item.VitalsStatus as 'Critical' | 'Stable',
    vitalsRemarks: item.VitalsRemarks ?? undefined,
    vitalsCreatedBy: item.VitalsCreatedBy ?? undefined,
    vitalsCreatedAt: item.VitalsCreatedAt ? (typeof item.VitalsCreatedAt === 'string' ? item.VitalsCreatedAt : item.VitalsCreatedAt.toISOString()) : undefined,
    status: item.Status ?? undefined,
    nurseName: item.NurseName ?? undefined,
    createdByName: item.CreatedByName ?? undefined,
  };
}

// Vitals API
export const emergencyAdmissionVitalsApi = {
  async getAll(emergencyAdmissionId: number): Promise<EmergencyAdmissionVitals[]> {
    if (!ENABLE_STUB_DATA) {
      try {
        const response = await apiRequest<EmergencyAdmissionVitalsAPIResponse>(
          `/emergency-admission-vitals/by-emergency-admission/${emergencyAdmissionId}`,
          { method: 'GET' }
        );
        return response.data.map(transformVitalsResponse);
      } catch (err) {
        console.error('Error fetching emergency admission vitals:', err);
        throw err;
      }
    } else {
      // Stub implementation - return empty array for now
      return [];
    }
  },

  async getById(emergencyAdmissionId: number, vitalsId: number): Promise<EmergencyAdmissionVitals> {
    if (!ENABLE_STUB_DATA) {
      try {
        const response = await apiRequest<EmergencyAdmissionVitalsGetByIdResponse>(
          `/emergency-admissions/${emergencyAdmissionId}/vitals/${vitalsId}`,
          { method: 'GET' }
        );
        return transformVitalsResponse(response.data);
      } catch (err) {
        console.error('Error fetching emergency admission vitals by ID:', err);
        throw err;
      }
    } else {
      // Stub implementation
      throw new Error('Stub data not implemented for getById');
    }
  },

  async create(emergencyAdmissionId: number, data: CreateEmergencyAdmissionVitalsDto): Promise<EmergencyAdmissionVitals> {
    if (!ENABLE_STUB_DATA) {
      try {
        // Format RecordedDateTime to YYYY-MM-DD HH:MM:SS format
        const formatDateTime = (dateTimeString: string): string => {
          if (!dateTimeString) return '';
          const date = new Date(dateTimeString);
          if (isNaN(date.getTime())) return dateTimeString;
          
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        };

        const requestBody: any = {
          EmergencyAdmissionId: emergencyAdmissionId,
          NurseId: data.nurseId,
          RecordedDateTime: formatDateTime(data.recordedDateTime),
        };

        // Add optional fields only if they are defined
        if (data.heartRate !== undefined) requestBody.HeartRate = data.heartRate;
        if (data.bloodPressure !== undefined) requestBody.BloodPressure = data.bloodPressure;
        if (data.temperature !== undefined) requestBody.Temperature = data.temperature;
        if (data.o2Saturation !== undefined) requestBody.O2Saturation = data.o2Saturation;
        if (data.respiratoryRate !== undefined) requestBody.RespiratoryRate = data.respiratoryRate;
        if (data.pulseRate !== undefined) requestBody.PulseRate = data.pulseRate;
        if (data.vitalsStatus !== undefined) requestBody.VitalsStatus = data.vitalsStatus;
        if (data.vitalsRemarks !== undefined) requestBody.VitalsRemarks = data.vitalsRemarks;
        if (data.vitalsCreatedBy !== undefined) requestBody.VitalsCreatedBy = data.vitalsCreatedBy;
        if (data.status !== undefined) requestBody.Status = data.status;

        const response = await apiRequest<EmergencyAdmissionVitalsCreateResponse>(
          `/emergency-admission-vitals`,
          {
            method: 'POST',
            body: JSON.stringify(requestBody),
          }
        );
        return transformVitalsResponse(response.data);
      } catch (err) {
        console.error('Error creating emergency admission vitals:', err);
        throw err;
      }
    } else {
      // Stub implementation
      throw new Error('Stub data not implemented for create');
    }
  },

  async update(emergencyAdmissionId: number, vitalsId: number, data: UpdateEmergencyAdmissionVitalsDto): Promise<EmergencyAdmissionVitals> {
    if (!ENABLE_STUB_DATA) {
      try {
        const updateData: any = {};
        if (data.nurseId !== undefined) updateData.NurseId = data.nurseId;
        if (data.recordedDateTime !== undefined) updateData.RecordedDateTime = data.recordedDateTime;
        if (data.heartRate !== undefined) updateData.HeartRate = data.heartRate;
        if (data.bloodPressure !== undefined) updateData.BloodPressure = data.bloodPressure;
        if (data.temperature !== undefined) updateData.Temperature = data.temperature;
        if (data.o2Saturation !== undefined) updateData.O2Saturation = data.o2Saturation;
        if (data.respiratoryRate !== undefined) updateData.RespiratoryRate = data.respiratoryRate;
        if (data.pulseRate !== undefined) updateData.PulseRate = data.pulseRate;
        if (data.vitalsStatus !== undefined) updateData.VitalsStatus = data.vitalsStatus;
        if (data.vitalsRemarks !== undefined) updateData.VitalsRemarks = data.vitalsRemarks;
        if (data.status !== undefined) updateData.Status = data.status;

        const response = await apiRequest<EmergencyAdmissionVitalsGetByIdResponse>(
          `/emergency-admissions/${emergencyAdmissionId}/vitals/${vitalsId}`,
          {
            method: 'PUT',
            body: JSON.stringify(updateData),
          }
        );
        return transformVitalsResponse(response.data);
      } catch (err) {
        console.error('Error updating emergency admission vitals:', err);
        throw err;
      }
    } else {
      // Stub implementation
      throw new Error('Stub data not implemented for update');
    }
  },

  async delete(emergencyAdmissionId: number, vitalsId: number): Promise<void> {
    if (!ENABLE_STUB_DATA) {
      try {
        await apiRequest<void>(
          `/emergency-admissions/${emergencyAdmissionId}/vitals/${vitalsId}`,
          { method: 'DELETE' }
        );
      } catch (err) {
        console.error('Error deleting emergency admission vitals:', err);
        throw err;
      }
    } else {
      // Stub implementation
      throw new Error('Stub data not implemented for delete');
    }
  },
};
