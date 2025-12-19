// Emergency Bed Slots API service
import { apiRequest, ENABLE_STUB_DATA } from './base';
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

// Stub data for Emergency Bed Slots
const stubEmergencyBedSlots: EmergencyBedSlotResponseItem[] = [
  // ER-001 slots
  { EmergencyBedSlotId: 1, EmergencyBedId: 1, EBedSlotNo: 'ES01', ESlotStartTime: '9:00 AM', ESlotEndTime: '10:00 AM', Status: 'Active' },
  { EmergencyBedSlotId: 2, EmergencyBedId: 1, EBedSlotNo: 'ES02', ESlotStartTime: '10:00 AM', ESlotEndTime: '11:00 AM', Status: 'Active' },
  { EmergencyBedSlotId: 3, EmergencyBedId: 1, EBedSlotNo: 'ES03', ESlotStartTime: '11:00 AM', ESlotEndTime: '12:00 PM', Status: 'Active' },
  { EmergencyBedSlotId: 4, EmergencyBedId: 1, EBedSlotNo: 'ES04', ESlotStartTime: '12:00 PM', ESlotEndTime: '1:00 PM', Status: 'Active' },
  { EmergencyBedSlotId: 5, EmergencyBedId: 1, EBedSlotNo: 'ES05', ESlotStartTime: '1:00 PM', ESlotEndTime: '2:00 PM', Status: 'Active' },
  // ER-002 slots
  { EmergencyBedSlotId: 6, EmergencyBedId: 2, EBedSlotNo: 'ES01', ESlotStartTime: '9:00 AM', ESlotEndTime: '10:00 AM', Status: 'Active' },
  { EmergencyBedSlotId: 7, EmergencyBedId: 2, EBedSlotNo: 'ES02', ESlotStartTime: '10:00 AM', ESlotEndTime: '11:00 AM', Status: 'Active' },
  { EmergencyBedSlotId: 8, EmergencyBedId: 2, EBedSlotNo: 'ES03', ESlotStartTime: '11:00 AM', ESlotEndTime: '12:00 PM', Status: 'Active' },
  // ER-003 slots
  { EmergencyBedSlotId: 9, EmergencyBedId: 3, EBedSlotNo: 'ES01', ESlotStartTime: '9:00 AM', ESlotEndTime: '10:00 AM', Status: 'Active' },
  { EmergencyBedSlotId: 10, EmergencyBedId: 3, EBedSlotNo: 'ES02', ESlotStartTime: '10:00 AM', ESlotEndTime: '11:00 AM', Status: 'Active' },
];

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
      // If stub data is disabled and API fails, throw the error
      if (!ENABLE_STUB_DATA) {
        throw error;
      }
      
      // Only use stub data if enabled and API fails
      let filteredStubData = [...stubEmergencyBedSlots];
      
      // Filter by emergencyBedId if provided
      if (emergencyBedId !== undefined) {
        filteredStubData = filteredStubData.filter(slot => slot.EmergencyBedId === emergencyBedId);
      }
      
      // Filter by status if provided
      if (status) {
        filteredStubData = filteredStubData.filter(slot => slot.Status.toLowerCase() === status.toLowerCase());
      }
      
      const stubData = filteredStubData.map(mapEmergencyBedSlotResponseToEmergencyBedSlot);
      return stubData;
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
      
      if (ENABLE_STUB_DATA) {
        await delay(200);
        const stubSlot = stubEmergencyBedSlots.find(s => s.EmergencyBedSlotId === id);
        if (stubSlot) {
          return mapEmergencyBedSlotResponseToEmergencyBedSlot(stubSlot);
        }
      }
      
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
      
      if (ENABLE_STUB_DATA) {
        await delay(400);
        const newSlot: EmergencyBedSlotResponseItem = {
          EmergencyBedSlotId: stubEmergencyBedSlots.length + 1,
          EmergencyBedId: data.emergencyBedId,
          EBedSlotNo: `ES${String(stubEmergencyBedSlots.length + 1).padStart(2, '0')}`, // Auto-generated
          ESlotStartTime: data.eSlotStartTime,
          ESlotEndTime: data.eSlotEndTime,
          Status: data.status || 'Active',
        };
        stubEmergencyBedSlots.push(newSlot);
        return mapEmergencyBedSlotResponseToEmergencyBedSlot(newSlot);
      }
      
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
      
      if (ENABLE_STUB_DATA) {
        await delay(400);
        const index = stubEmergencyBedSlots.findIndex(s => s.EmergencyBedSlotId === data.id);
        if (index !== -1) {
          if (data.eSlotStartTime !== undefined) stubEmergencyBedSlots[index].ESlotStartTime = data.eSlotStartTime;
          if (data.eSlotEndTime !== undefined) stubEmergencyBedSlots[index].ESlotEndTime = data.eSlotEndTime;
          if (data.status !== undefined) stubEmergencyBedSlots[index].Status = data.status;
          return mapEmergencyBedSlotResponseToEmergencyBedSlot(stubEmergencyBedSlots[index]);
        }
      }
      
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
      
      if (ENABLE_STUB_DATA) {
        await delay(300);
        const index = stubEmergencyBedSlots.findIndex(s => s.EmergencyBedSlotId === id);
        if (index !== -1) {
          stubEmergencyBedSlots.splice(index, 1);
        }
        return;
      }
      
      throw error;
    }
  },
};
