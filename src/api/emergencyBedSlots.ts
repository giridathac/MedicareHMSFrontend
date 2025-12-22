// Emergency Bed Slots API service
import { apiRequest } from './base';
import { EmergencyBedSlot } from '../types';

// API Response types
interface EmergencyBedSlotResponseItem {
  EmergencyBedSlotId: number;
  EmergencyBedId: number;
  EBedSlotNo: string;
  ESlotStartTime: string;
  ESlotEndTime: string;
  Status: string;
}

interface EmergencyBedSlotAPIResponse {
  success: boolean;
  count: number;
  data: EmergencyBedSlotResponseItem[];
}

interface EmergencyBedSlotCreateResponse {
  success: boolean;
  message: string;
  data: EmergencyBedSlotResponseItem;
}

interface EmergencyBedSlotGetByIdResponse {
  success: boolean;
  data: EmergencyBedSlotResponseItem;
}


const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Map API response to EmergencyBedSlot interface
function mapEmergencyBedSlotResponseToEmergencyBedSlot(item: EmergencyBedSlotResponseItem): EmergencyBedSlot {
  return {
    id: item.EmergencyBedSlotId || 0,
    emergencyBedSlotId: String(item.EmergencyBedSlotId || ''),
    emergencyBedId: item.EmergencyBedId || 0,
    eBedSlotNo: item.EBedSlotNo || '',
    eSlotStartTime: item.ESlotStartTime || '',
    eSlotEndTime: item.ESlotEndTime || '',
    status: (item.Status === 'Active' || item.Status === 'Inactive' ? item.Status : 'Active') as 'Active' | 'Inactive',
  };
}

export interface CreateEmergencyBedSlotDto {
  emergencyBedId: number;
  eSlotStartTime: string;
  eSlotEndTime: string;
  status?: 'Active' | 'Inactive';
}

export interface UpdateEmergencyBedSlotDto {
  id: number;
  eSlotStartTime?: string;
  eSlotEndTime?: string;
  status?: 'Active' | 'Inactive';
}

export const emergencyBedSlotsApi = {
  async getAll(status?: string, emergencyBedId?: number): Promise<EmergencyBedSlot[]> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (status) {
        params.append('status', status);
      }
      if (emergencyBedId !== undefined) {
        params.append('emergencyBedId', emergencyBedId.toString());
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/emergency-bed-slots?${queryString}` : '/emergency-bed-slots';
      
      const response = await apiRequest<EmergencyBedSlotAPIResponse>(endpoint);
      
      if (response.success && response.data) {
        // Map API response to our format
        const apiData = response.data.map(mapEmergencyBedSlotResponseToEmergencyBedSlot);
        return apiData;
      }
      
      // If response is not successful, return empty array or throw
      return [];
    } catch (error) {
      console.error('Error fetching emergency bed slots:', error);
      throw error;
    }
  },

  async getByEmergencyBedId(emergencyBedId: number): Promise<EmergencyBedSlot[]> {
    return this.getAll(undefined, emergencyBedId);
  },

  async getById(id: number): Promise<EmergencyBedSlot> {
    try {
      const response = await apiRequest<EmergencyBedSlotGetByIdResponse>(`/emergency-bed-slots/${id}`);
      
      if (response.success && response.data) {
        return mapEmergencyBedSlotResponseToEmergencyBedSlot(response.data);
      }
      
      throw new Error('Invalid response format from API');
    } catch (error) {
      console.error('Error fetching emergency bed slot by ID:', error);
      throw error;
    }
  },

  async create(data: CreateEmergencyBedSlotDto): Promise<EmergencyBedSlot> {
    try {
      // Convert frontend camelCase to backend PascalCase
      const backendData: any = {
        EmergencyBedId: data.emergencyBedId,
        ESlotStartTime: data.eSlotStartTime.trim(),
        ESlotEndTime: data.eSlotEndTime.trim(),
        Status: data.status || 'Active',
      };

      const response = await apiRequest<EmergencyBedSlotCreateResponse>('/emergency-bed-slots', {
        method: 'POST',
        body: JSON.stringify(backendData),
      });

      if (response.success && response.data) {
        return mapEmergencyBedSlotResponseToEmergencyBedSlot(response.data);
      }

      throw new Error('Invalid response format from API');
    } catch (error) {
      console.error('Error creating emergency bed slot:', error);
      throw error;
    }
  },

  async update(data: UpdateEmergencyBedSlotDto): Promise<EmergencyBedSlot> {
    try {
      const backendData: any = {};
      
      if (data.eSlotStartTime !== undefined) {
        backendData.ESlotStartTime = data.eSlotStartTime.trim();
      }
      if (data.eSlotEndTime !== undefined) {
        backendData.ESlotEndTime = data.eSlotEndTime.trim();
      }
      if (data.status !== undefined) {
        backendData.Status = data.status;
      }

      const response = await apiRequest<EmergencyBedSlotGetByIdResponse>(`/emergency-bed-slots/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(backendData),
      });

      if (response.success && response.data) {
        return mapEmergencyBedSlotResponseToEmergencyBedSlot(response.data);
      }

      throw new Error('Invalid response format from API');
    } catch (error) {
      console.error('Error updating emergency bed slot:', error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await apiRequest(`/emergency-bed-slots/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting emergency bed slot:', error);
      throw error;
    }
  },
};
