// Emergency Beds API service
import { apiRequest, ApiError } from './base';
import { EmergencyBed } from '../types';

// Helper function to generate a unique emergency bed number
function generateEmergencyBedNo(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ER-${timestamp}-${random}`;
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
      const normalizedEmergencyBeds: EmergencyBed[] = response.data.map((item) => {
        // Map API status values to frontend status values
        // API returns: "Unoccupied", "Occupied", "Inactive"
        // Frontend expects: 'active', 'occupied', 'inactive'
        let status: 'active' | 'inactive' | 'occupied' = 'active';
        const apiStatus = (item.Status || '').toLowerCase();
        if (apiStatus === 'occupied') {
          status = 'occupied';
        } else if (apiStatus === 'inactive') {
          status = 'inactive';
        } else {
          // 'unoccupied' or any other value maps to 'active' (available bed)
          status = 'active';
        }
        
        return {
          id: item.EmergencyBedId || 0,
          emergencyBedId: String(item.EmergencyBedId || ''),
          emergencyBedNo: item.EmergencyBedNo || '',
          emergencyRoomNameNo: item.EmergencyRoomNameNo || undefined,
          emergencyRoomDescription: item.EmergencyRoomDescription || undefined,
          chargesPerDay: item.ChargesPerDay !== null && item.ChargesPerDay !== undefined ? Number(item.ChargesPerDay) : 0,
          createdBy: item.CreatedBy !== null && item.CreatedBy !== undefined ? String(item.CreatedBy) : '',
          createdAt: item.CreatedAt ? (typeof item.CreatedAt === 'string' ? item.CreatedAt : item.CreatedAt.toISOString()) : new Date().toISOString(),
          status: status,
        };
      });

      return normalizedEmergencyBeds;
    } catch (error: any) {
      console.error('Error fetching emergency beds:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });

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
