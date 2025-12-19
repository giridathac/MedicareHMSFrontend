// Emergency Beds API service
import { apiRequest, ApiError, ENABLE_STUB_DATA } from './base';
import { EmergencyBed } from '../types';

// Stub data
const stubEmergencyBeds: EmergencyBed[] = [
  { id: 1, emergencyBedId: 'ERBED-01', emergencyBedNo: 'ER-001', emergencyRoomDescription: 'Emergency bed with standard monitoring equipment', chargesPerDay: 2500, createdBy: '1', createdAt: '2025-01-01T10:00:00Z', status: 'active' },
  { id: 2, emergencyBedId: 'ERBED-02', emergencyBedNo: 'ER-002', emergencyRoomDescription: 'Emergency bed with advanced life support', chargesPerDay: 3500, createdBy: '1', createdAt: '2025-01-01T10:00:00Z', status: 'active' },
  { id: 3, emergencyBedId: 'ERBED-03', emergencyBedNo: 'ER-003', emergencyRoomDescription: 'Standard emergency bed', chargesPerDay: 2000, createdBy: '1', createdAt: '2025-01-01T10:00:00Z', status: 'active' },
  { id: 4, emergencyBedId: 'ERBED-04', emergencyBedNo: 'ER-004', emergencyRoomDescription: 'Emergency bed with isolation facility', chargesPerDay: 3000, createdBy: '1', createdAt: '2025-01-01T10:00:00Z', status: 'active' },
  { id: 5, emergencyBedId: 'ERBED-05', emergencyBedNo: 'ER-005', emergencyRoomDescription: 'Pediatric emergency bed', chargesPerDay: 2200, createdBy: '1', createdAt: '2025-01-01T10:00:00Z', status: 'active' },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate Emergency Bed ID in format ERBED-XX
function generateEmergencyBedId(): string {
  const count = stubEmergencyBeds.length + 1;
  return `ERBED-${count.toString().padStart(2, '0')}`;
}

// Generate Emergency Bed No in format ER-XXX
function generateEmergencyBedNo(): string {
  const count = stubEmergencyBeds.length + 1;
  return `ER-${count.toString().padStart(3, '0')}`;
}

export interface CreateEmergencyBedDto {
  emergencyBedNo?: string;
  emergencyRoomNameNo?: string;
  emergencyRoomDescription?: string;
  chargesPerDay?: number;
  createdBy?: number;
  status?: 'active' | 'inactive';
}

export interface UpdateEmergencyBedDto {
  id: number;
  emergencyBedNo?: string;
  emergencyRoomNameNo?: string;
  emergencyRoomDescription?: string;
  chargesPerDay?: number;
  createdBy?: number;
  status?: 'active' | 'inactive' | 'occupied';
}

export const emergencyBedsApi = {
  async getAll(status?: string): Promise<EmergencyBed[]> {
    try {
      // Build query string if status is provided
      const queryParams = status ? `?status=${encodeURIComponent(status)}` : '';
      const endpoint = `/emergency-beds${queryParams}`;

      console.log('Fetching emergency beds from:', endpoint);

      // Call the API endpoint
      const response = await apiRequest<{
        success: boolean;
        count: number;
        data: Array<{
          EmergencyBedId: number;
          EmergencyBedNo: string;
          EmergencyRoomNameNo: string | null;
          EmergencyRoomDescription: string | null;
          ChargesPerDay: number | null;
          Status: string;
          CreatedBy: number | null;
          CreatedAt: string | Date;
        }>;
      }>(endpoint, {
        method: 'GET',
      });

      console.log('Get all emergency beds API response:', response);

      // Handle response structure: { success, count, data: [...] }
      if (!response || !response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from API');
      }

      // Normalize the response data to match EmergencyBed interface
      const normalizedEmergencyBeds: EmergencyBed[] = response.data.map((item) => ({
        id: item.EmergencyBedId || 0,
        emergencyBedId: String(item.EmergencyBedId || ''),
        emergencyBedNo: item.EmergencyBedNo || '',
        emergencyRoomNameNo: item.EmergencyRoomNameNo || undefined,
        emergencyRoomDescription: item.EmergencyRoomDescription || undefined,
        chargesPerDay: item.ChargesPerDay !== null && item.ChargesPerDay !== undefined ? Number(item.ChargesPerDay) : 0,
        createdBy: item.CreatedBy !== null && item.CreatedBy !== undefined ? String(item.CreatedBy) : '',
        createdAt: item.CreatedAt ? (typeof item.CreatedAt === 'string' ? item.CreatedAt : item.CreatedAt.toISOString()) : new Date().toISOString(),
        status: (item.Status || 'active').toLowerCase() as 'active' | 'inactive' | 'occupied',
      }));

      return normalizedEmergencyBeds;
    } catch (error: any) {
      console.error('Error fetching emergency beds:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });

      // If stub data is enabled and API fails, fall back to stub data
      if (ENABLE_STUB_DATA) {
        console.warn('API call failed, using stub data for emergency beds');
        await delay(300);
        // Filter by status if provided
        let filteredBeds = [...stubEmergencyBeds];
        if (status) {
          const statusLower = status.toLowerCase();
          filteredBeds = filteredBeds.filter(bed => bed.status.toLowerCase() === statusLower);
        }
        return filteredBeds;
      }

      // Re-throw API errors with detailed message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || errorData?.error || error.message || 'Failed to fetch emergency beds';
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
      throw new Error('Failed to fetch emergency beds. Please check the console for details.');
    }
  },

  async getById(id: number): Promise<EmergencyBed> {
    try {
      const response = await apiRequest<{
        success: boolean;
        data: {
          EmergencyBedId: number;
          EmergencyBedNo: string;
          EmergencyRoomNameNo: string | null;
          EmergencyRoomDescription: string | null;
          ChargesPerDay: number | null;
          Status: string;
          CreatedBy: number | null;
          CreatedAt: string | Date;
        };
      }>(`/emergency-beds/${id}`, {
        method: 'GET',
      });

      if (response && response.data && response.data.EmergencyBedId) {
        const item = response.data;
        return {
          id: item.EmergencyBedId || 0,
          emergencyBedId: String(item.EmergencyBedId || ''),
          emergencyBedNo: item.EmergencyBedNo || '',
          emergencyRoomNameNo: item.EmergencyRoomNameNo || undefined,
          emergencyRoomDescription: item.EmergencyRoomDescription || undefined,
          chargesPerDay: item.ChargesPerDay !== null && item.ChargesPerDay !== undefined ? Number(item.ChargesPerDay) : 0,
          createdBy: item.CreatedBy !== null && item.CreatedBy !== undefined ? String(item.CreatedBy) : '',
          createdAt: item.CreatedAt ? (typeof item.CreatedAt === 'string' ? item.CreatedAt : item.CreatedAt.toISOString()) : new Date().toISOString(),
          status: (item.Status || 'active').toLowerCase() as 'active' | 'inactive' | 'occupied',
        };
      }
      throw new Error(`EmergencyBed with id ${id} not found`);
    } catch (error) {
      console.error('Error fetching emergency bed by id:', error);
      
      // Only use stub data if enabled and API fails
      if (ENABLE_STUB_DATA) {
        await delay(200);
        const emergencyBed = stubEmergencyBeds.find(b => b.id === id);
        if (emergencyBed) {
          return Promise.resolve(emergencyBed);
        }
      }
      
      throw error;
    }
  },

  async create(data: CreateEmergencyBedDto): Promise<EmergencyBed> {
    try {
      // Convert frontend camelCase to backend PascalCase
      const backendData: any = {};
      
      if (data.emergencyBedNo !== undefined && data.emergencyBedNo !== null && data.emergencyBedNo.trim() !== '') {
        backendData.EmergencyBedNo = data.emergencyBedNo.trim();
      }
      if (data.emergencyRoomNameNo !== undefined && data.emergencyRoomNameNo !== null && data.emergencyRoomNameNo.trim() !== '') {
        backendData.EmergencyRoomNameNo = data.emergencyRoomNameNo.trim();
      }
      if (data.emergencyRoomDescription !== undefined && data.emergencyRoomDescription !== null && data.emergencyRoomDescription.trim() !== '') {
        backendData.EmergencyRoomDescription = data.emergencyRoomDescription.trim();
      }
      if (data.chargesPerDay !== undefined && data.chargesPerDay !== null && !isNaN(Number(data.chargesPerDay))) {
        backendData.ChargesPerDay = Number(data.chargesPerDay);
      }
      if (data.createdBy !== undefined && data.createdBy !== null) {
        backendData.CreatedBy = Number(data.createdBy);
      }
      if (data.status !== undefined && data.status !== null) {
        // Normalize status to "Active" or "Inactive" for backend
        backendData.Status = data.status === 'active' ? 'Active' : 'Inactive';
      } else {
        // Default to "Active" if not provided
        backendData.Status = 'Active';
      }

      console.log('Creating emergency bed with data:', JSON.stringify(backendData, null, 2));

      // Call the actual API endpoint
      const response = await apiRequest<any>('/emergency-beds', {
        method: 'POST',
        body: JSON.stringify(backendData),
      });

      console.log('Create emergency bed API response:', response);

      // Handle response structure: { success, message, data: {...} }
      const responseData = response?.data || response;
      
      if (!responseData) {
        throw new Error('No emergency bed data received from API');
      }

      // Normalize the response to match EmergencyBed interface
      const normalizedEmergencyBed: EmergencyBed = {
        id: responseData.EmergencyBedId || responseData.emergencyBedId || 0,
        emergencyBedId: String(responseData.EmergencyBedId || responseData.emergencyBedId || ''),
        emergencyBedNo: responseData.EmergencyBedNo || responseData.emergencyBedNo || generateEmergencyBedNo(),
        emergencyRoomNameNo: responseData.EmergencyRoomNameNo || responseData.emergencyRoomNameNo || undefined,
        emergencyRoomDescription: responseData.EmergencyRoomDescription || responseData.emergencyRoomDescription || undefined,
        chargesPerDay: Number(responseData.ChargesPerDay || responseData.chargesPerDay || 0),
        createdBy: String(responseData.CreatedBy || responseData.createdBy || ''),
        createdAt: responseData.CreatedAt || responseData.createdAt || new Date().toISOString(),
        status: (responseData.Status || responseData.status || 'active').toLowerCase() as 'active' | 'inactive' | 'occupied',
      };

      return normalizedEmergencyBed;
    } catch (error: any) {
      console.error('Error creating emergency bed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // If stub data is enabled and API fails, fall back to stub data
      if (ENABLE_STUB_DATA) {
        console.warn('API call failed, using stub data for emergency bed creation');
        await delay(400);
        const newEmergencyBed: EmergencyBed = {
          id: stubEmergencyBeds.length + 1,
          emergencyBedId: generateEmergencyBedId(),
          emergencyBedNo: data.emergencyBedNo || generateEmergencyBedNo(),
          emergencyRoomNameNo: data.emergencyRoomNameNo,
          emergencyRoomDescription: data.emergencyRoomDescription,
          chargesPerDay: data.chargesPerDay !== undefined && data.chargesPerDay !== null ? data.chargesPerDay : 0,
          createdBy: data.createdBy !== undefined && data.createdBy !== null ? String(data.createdBy) : '1',
          status: data.status || 'active',
          createdAt: new Date().toISOString(),
        };
        stubEmergencyBeds.push(newEmergencyBed);
        return newEmergencyBed;
      }
      
      // Re-throw API errors with detailed message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || errorData?.error || error.message || 'Failed to create emergency bed';
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
      throw new Error('Failed to create emergency bed. Please check the console for details.');
    }
  },

  async update(data: UpdateEmergencyBedDto): Promise<EmergencyBed> {
    try {
      // Validate required fields
      if (!data.id || data.id <= 0) {
        throw new Error('Valid emergency bed ID is required for update');
      }

      // Convert frontend camelCase to backend PascalCase
      const backendData: any = {};
      
      if (data.emergencyBedNo !== undefined && data.emergencyBedNo !== null && data.emergencyBedNo.trim() !== '') {
        backendData.EmergencyBedNo = data.emergencyBedNo.trim();
      }
      if (data.emergencyRoomNameNo !== undefined && data.emergencyRoomNameNo !== null && data.emergencyRoomNameNo.trim() !== '') {
        backendData.EmergencyRoomNameNo = data.emergencyRoomNameNo.trim();
      }
      if (data.emergencyRoomDescription !== undefined && data.emergencyRoomDescription !== null && data.emergencyRoomDescription.trim() !== '') {
        backendData.EmergencyRoomDescription = data.emergencyRoomDescription.trim();
      }
      if (data.chargesPerDay !== undefined && data.chargesPerDay !== null) {
        backendData.ChargesPerDay = Number(data.chargesPerDay);
      }
      if (data.createdBy !== undefined && data.createdBy !== null) {
        backendData.CreatedBy = Number(data.createdBy);
      }
      if (data.status !== undefined && data.status !== null) {
        // Normalize status to "Active", "Inactive", or "Occupied" for backend
        if (data.status === 'active') {
          backendData.Status = 'Active';
        } else if (data.status === 'inactive') {
          backendData.Status = 'Inactive';
        } else if (data.status === 'occupied') {
          backendData.Status = 'Occupied';
        }
        console.log(`[Emergency Bed Update] Setting Status to: "${backendData.Status}" (from frontend status: "${data.status}")`);
      }

      console.log('Updating emergency bed with data:', JSON.stringify(backendData, null, 2));
      console.log('Emergency bed ID:', data.id);
      console.log('[Emergency Bed Update] Request body will be sent to PUT /api/emergency-beds/' + data.id);

      // Call the actual API endpoint
      const response = await apiRequest<any>(`/emergency-beds/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(backendData),
      });

      console.log('Update emergency bed API response:', response);

      // Handle response structure: { success, message, data: {...} }
      const responseData = response?.data || response;
      
      if (!responseData) {
        throw new Error('No emergency bed data received from API');
      }

      // Normalize the response to match EmergencyBed interface
      const normalizedEmergencyBed: EmergencyBed = {
        id: responseData.EmergencyBedId || responseData.emergencyBedId || data.id,
        emergencyBedId: String(responseData.EmergencyBedId || responseData.emergencyBedId || data.id),
        emergencyBedNo: responseData.EmergencyBedNo || responseData.emergencyBedNo || '',
        emergencyRoomNameNo: responseData.EmergencyRoomNameNo || responseData.emergencyRoomNameNo || undefined,
        emergencyRoomDescription: responseData.EmergencyRoomDescription || responseData.emergencyRoomDescription || undefined,
        chargesPerDay: Number(responseData.ChargesPerDay || responseData.chargesPerDay || 0),
        createdBy: String(responseData.CreatedBy || responseData.createdBy || ''),
        createdAt: responseData.CreatedAt || responseData.createdAt || new Date().toISOString(),
        status: (responseData.Status || responseData.status || 'active').toLowerCase() as 'active' | 'inactive' | 'occupied',
      };

      return normalizedEmergencyBed;
    } catch (error: any) {
      console.error('Error updating emergency bed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // If stub data is enabled and API fails, fall back to stub data
      if (ENABLE_STUB_DATA) {
        console.warn('API call failed, using stub data for emergency bed update');
        await delay(400);
        const index = stubEmergencyBeds.findIndex(b => b.id === data.id);
        if (index === -1) {
          throw new Error(`EmergencyBed with id ${data.id} not found`);
        }
        // Convert createdBy to string if it's a number, and ensure all fields match EmergencyBed type
        const updateData: Partial<EmergencyBed> = {};
        if (data.emergencyBedNo !== undefined) updateData.emergencyBedNo = data.emergencyBedNo;
        if (data.emergencyRoomNameNo !== undefined) updateData.emergencyRoomNameNo = data.emergencyRoomNameNo;
        if (data.emergencyRoomDescription !== undefined) updateData.emergencyRoomDescription = data.emergencyRoomDescription;
        if (data.chargesPerDay !== undefined) updateData.chargesPerDay = data.chargesPerDay;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.createdBy !== undefined) {
          updateData.createdBy = String(data.createdBy);
        }
        stubEmergencyBeds[index] = { ...stubEmergencyBeds[index], ...updateData };
        return stubEmergencyBeds[index];
      }
      
      // Re-throw API errors with detailed message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || errorData?.error || error.message || 'Failed to update emergency bed';
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
      throw new Error('Failed to update emergency bed. Please check the console for details.');
    }
  },

  async delete(emergencyBedId: number): Promise<void> {
    try {
      // Validate EmergencyBedId before making API call
      // The id parameter is the EmergencyBedId (Number) from the backend
      if (!emergencyBedId || emergencyBedId <= 0) {
        throw new Error(`Invalid EmergencyBedId: ${emergencyBedId}. Cannot delete emergency bed.`);
      }

      console.log(`Deleting emergency bed with EmergencyBedId: ${emergencyBedId}`);

      // Call the actual API endpoint - DELETE /api/emergency-beds/:id
      // The :id parameter is the EmergencyBedId (Number)
      const response = await apiRequest<any>(`/emergency-beds/${emergencyBedId}`, {
        method: 'DELETE',
      });

      console.log('Delete emergency bed API response:', response);

      // The API returns the deleted emergency bed data in the response
      // We don't need to return it, but we can log it for debugging
      if (response?.data) {
        console.log('Deleted emergency bed:', response.data);
      }

      // Delete operation is successful if we reach here
      return;
    } catch (error: any) {
      console.error(`Error deleting emergency bed with EmergencyBedId ${emergencyBedId}:`, error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // If stub data is enabled and API fails, fall back to stub data
      if (ENABLE_STUB_DATA) {
        console.warn('API call failed, using stub data for emergency bed deletion');
        await delay(300);
        const index = stubEmergencyBeds.findIndex(b => b.id === emergencyBedId);
        if (index === -1) {
          throw new Error(`EmergencyBed with id ${emergencyBedId} not found`);
        }
        stubEmergencyBeds.splice(index, 1);
        return;
      }
      
      // Re-throw API errors with detailed message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || errorData?.error || error.message || `Failed to delete emergency bed with id ${emergencyBedId}`;
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
      throw new Error(`Failed to delete emergency bed with id ${emergencyBedId}. Please check the console for details.`);
    }
  },
};
