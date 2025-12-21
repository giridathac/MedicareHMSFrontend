// ICU Beds API service
import { apiRequest, ApiError, ENABLE_STUB_DATA } from './base';
import { ICUBed } from '../types';

// Stub data for ICU Bed Management
const stubICUBeds: ICUBed[] = [
  // Medical ICU Beds - Floor 1
  { id: 50, icuBedId: 50, icuId: 50, icuBedNo: 'B50', icuType: 'Surgical', icuRoomNameNo: 'R205', icuDescription: 'DummyData', isVentilatorAttached: false, status: 'inactive', createdAt: '2025-01-01T10:00:00Z', createdDate: '2025-01-01' },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to normalize status to 'Active' or 'Inactive' for backend
function normalizeStatusForBackend(status: any): 'Active' | 'Inactive' {
  if (!status) return 'Active';
  
  const statusStr = String(status).trim();
  const lowerStatus = statusStr.toLowerCase();
  
  // Map various status values to 'Active' or 'Inactive'
  if (lowerStatus === 'active') {
    return 'Active';
  }
  if (lowerStatus === 'inactive' || lowerStatus === 'in active') {
    return 'Inactive';
  }
  
  // If it's already 'Active' or 'Inactive' (case-insensitive), return it properly capitalized
  if (statusStr === 'Active' || statusStr === 'active') return 'Active';
  if (statusStr === 'InActive' || statusStr === 'Inactive' || statusStr === 'inactive') return 'Inactive';
  
  // Default to 'Active' if unknown status
  return 'Active';
}

export interface CreateICUBedDto {
  icuBedNo: string;
  icuType: string;
  icuRoomNameNo: string;
  icuDescription?: string;
  isVentilatorAttached: boolean;
  status?: 'active' | 'inactive';
}

export interface UpdateICUBedDto extends Partial<CreateICUBedDto> {
  icuId: number;
}

export const icuBedsApi = {
  async getAll(): Promise<ICUBed[]> {
    let apiData: ICUBed[] = [];
    
    try {
      const response = await apiRequest<any>('/icu');
      // Handle different response structures: { data: [...] } or direct array
      const icuBedsData = response?.data || response || [];
     
      if (Array.isArray(icuBedsData) && icuBedsData.length > 0) {
        console.log('ICU beds fetched from API:', icuBedsData);
        // Map and normalize the data to ensure all fields are present
        apiData = icuBedsData.map((icuBed: any, index: number) => {
          // Prioritize ICUBedId from backend, fallback to id or generate
          const icuBedId = Number(icuBed.icuBedId || icuBed.ICUBedId || icuBed.id || icuBed.Id || (1000000 + index));
          return {
            id: icuBed.id || icuBed.Id || icuBedId || (1000000 + index),
            icuBedId: icuBedId,
            icuId: Number(icuBed.icuId || icuBed.ICUId || icuBed.ICU_ID || 0),
            icuBedNo: icuBed.icuBedNo || icuBed.ICUBedNo || icuBed.ICUBedNo || '',
            icuType: icuBed.icuType || icuBed.ICUType || '',
            icuRoomNameNo: icuBed.icuRoomNameNo || icuBed.ICURoomNameNo || icuBed.ICURoomNameNo || '',
            icuDescription: icuBed.icuDescription || icuBed.ICUDescription || undefined,
            isVentilatorAttached: Boolean(icuBed.isVentilatorAttached !== undefined ? icuBed.isVentilatorAttached : (icuBed.IsVentilatorAttached !== undefined ? icuBed.IsVentilatorAttached : false)),
            status: (icuBed.status || icuBed.Status || 'active').toLowerCase() as 'active' | 'inactive',
            createdAt: icuBed.createdAt || icuBed.CreatedAt || new Date().toISOString(),
            createdDate: icuBed.createdDate || icuBed.CreatedDate || icuBed.createdAt || icuBed.CreatedAt || undefined,
          };
        }) as ICUBed[];
      }
    } catch (error) {
      console.error('Error fetching ICU beds:', error);
      // If stub data is disabled and API fails, throw the error
      if (!ENABLE_STUB_DATA) {
        throw error;
      }
    }
    
    // Append stub data if enabled
    if (ENABLE_STUB_DATA) {
      // Filter out stub data that might conflict with API data (by ID)
      const apiIds = new Set(apiData.map(bed => bed.id));
      const uniqueStubData = stubICUBeds.filter(bed => !apiIds.has(bed.id));
      
      if (uniqueStubData.length > 0) {
        console.log(`Appending ${uniqueStubData.length} stub ICU beds to ${apiData.length} API records`);
      }
      
      // If API returned no data, use stub data as fallback
      if (apiData.length === 0) {
        console.warn('No ICU beds data received from API, using stub data');
        await delay(300);
        return [...stubICUBeds];
      }
      
      // Combine API data with stub data
      return [...apiData, ...uniqueStubData];
    }
    
    // Return only API data if stub data is disabled
    return apiData;
  },

  async getById(icuBedId: number): Promise<ICUBed> {
    try {
      // Validate ID before making API call
      if (!icuBedId || icuBedId <= 0) {
        throw new Error(`Invalid ICU bed ID: ${icuBedId}. Cannot fetch ICU bed data.`);
      }
      
      const response = await apiRequest<any>(`/icu/${icuBedId}`);
      console.log('Get ICU bed by ID response:', response);
      
      // Handle different response structures: { data: {...} } or direct object
      const icuBedData = response?.data || response;
      
      if (!icuBedData) {
        throw new Error(`ICUBed with id ${icuBedId} not found`);
      }
      
      // Normalize the response to match ICUBed interface
      const normalizedICUBed: ICUBed = {
        id: icuBedData.id || icuBedData.Id || icuBedId,
        icuBedId: Number(icuBedData.icuBedId || icuBedData.ICUBedId || icuBedData.id || icuBedData.Id || icuBedId),
        icuId: Number(icuBedData.icuId || icuBedData.ICUId || icuBedData.ICU_ID || 0),
        icuBedNo: icuBedData.icuBedNo || icuBedData.ICUBedNo || icuBedData.ICUBedNo || '',
        icuType: icuBedData.icuType || icuBedData.ICUType || '',
        icuRoomNameNo: icuBedData.icuRoomNameNo || icuBedData.ICURoomNameNo || icuBedData.ICURoomNameNo || '',
        icuDescription: icuBedData.icuDescription || icuBedData.ICUDescription || undefined,
        isVentilatorAttached: Boolean(icuBedData.isVentilatorAttached !== undefined ? icuBedData.isVentilatorAttached : (icuBedData.IsVentilatorAttached !== undefined ? icuBedData.IsVentilatorAttached : false)),
        status: (icuBedData.status || icuBedData.Status || 'active').toLowerCase() as 'active' | 'inactive',
        createdAt: icuBedData.createdAt || icuBedData.CreatedAt || new Date().toISOString(),
        createdDate: icuBedData.createdDate || icuBedData.CreatedDate || icuBedData.createdAt || icuBedData.CreatedAt || undefined,
      };
      
      return normalizedICUBed;
    } catch (error: any) {
      console.error(`Error fetching ICU bed with id ${icuBedId}:`, error);
      
      // Provide more detailed error message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || error.message || `Failed to fetch ICU bed with id ${icuBedId}`;
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  },

  async getByType(type: string): Promise<ICUBed[]> {
    try {
      const response = await apiRequest<any>(`/icu?type=${encodeURIComponent(type)}`);
      const icuBedsData = response?.data || response || [];
      
      if (Array.isArray(icuBedsData)) {
        return icuBedsData.map((icuBed: any, index: number) => {
          const icuBedId = Number(icuBed.icuBedId || icuBed.ICUBedId || icuBed.id || icuBed.Id || (1000000 + index));
          return {
            id: icuBed.id || icuBed.Id || icuBedId || (1000000 + index),
            icuBedId: icuBedId,
            icuId: Number(icuBed.icuId || icuBed.ICUId || icuBed.ICU_ID || 0),
            icuBedNo: icuBed.icuBedNo || icuBed.ICUBedNo || '',
            icuType: icuBed.icuType || icuBed.ICUType || '',
            icuRoomNameNo: icuBed.icuRoomNameNo || icuBed.ICURoomNameNo || '',
            icuDescription: icuBed.icuDescription || icuBed.ICUDescription || undefined,
            isVentilatorAttached: Boolean(icuBed.isVentilatorAttached !== undefined ? icuBed.isVentilatorAttached : (icuBed.IsVentilatorAttached !== undefined ? icuBed.IsVentilatorAttached : false)),
            status: (icuBed.status || icuBed.Status || 'active').toLowerCase() as 'active' | 'inactive',
            createdAt: icuBed.createdAt || icuBed.CreatedAt || new Date().toISOString(),
            createdDate: icuBed.createdDate || icuBed.CreatedDate || icuBed.createdAt || icuBed.CreatedAt || undefined,
          };
        }) as ICUBed[];
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching ICU beds by type ${type}:`, error);
      return [];
    }
  },

  async create(data: CreateICUBedDto): Promise<ICUBed> {
    try {
      // Validate required fields
      if (!data.icuBedNo || !data.icuType || !data.icuRoomNameNo) {
        throw new Error('ICUBedNo, ICUType, and ICURoomNameNo are required');
      }

      // Convert camelCase to PascalCase for backend API
      // Always include IsVentilatorAttached as it's required by the backend (must be "Yes" or "No")
      const isVentilatorAttached = data.isVentilatorAttached !== undefined ? Boolean(data.isVentilatorAttached) : false;
      const backendData: any = {
        ICUBedNo: data.icuBedNo.trim(),
        ICUType: data.icuType.trim(),
        ICURoomNameNo: data.icuRoomNameNo.trim(),
        IsVentilatorAttached: isVentilatorAttached ? 'Yes' : 'No',
      };
      
      console.log('IsVentilatorAttached being sent to API (CREATE):', backendData.IsVentilatorAttached, 'from:', data.isVentilatorAttached);
      
      // Add optional fields if provided
      if (data.icuDescription !== undefined && data.icuDescription !== null && data.icuDescription.trim() !== '') {
        backendData.ICUDescription = data.icuDescription.trim();
      }
      if (data.status !== undefined && data.status !== null) {
        backendData.Status = normalizeStatusForBackend(data.status);
        console.log('Status being sent to API:', backendData.Status, 'from:', data.status);
      } else {
        // Always include status with default value if not provided
        backendData.Status = 'Active';
        console.log('Status not provided, using default: Active');
      }
      
      console.log('IsVentilatorAttached being sent to API:', backendData.IsVentilatorAttached, 'from:', data.isVentilatorAttached);

      console.log('Creating ICU bed with data:', JSON.stringify(backendData, null, 2));

      // Call the actual API endpoint
      const response = await apiRequest<any>('/icu', {
        method: 'POST',
        body: JSON.stringify(backendData),
      });

      console.log('Create ICU bed API response:', response);

      // Handle different response structures: { data: {...} } or direct object
      const icuBedData = response?.data || response;

      if (!icuBedData) {
        throw new Error('No ICU bed data received from API');
      }

      // Normalize the response to match ICUBed interface
      const normalizedICUBed: ICUBed = {
        id: icuBedData.id || icuBedData.Id || 0,
        icuBedId: Number(icuBedData.icuBedId || icuBedData.ICUBedId || icuBedData.id || icuBedData.Id || 0),
        icuId: Number(icuBedData.icuId || icuBedData.ICUId || icuBedData.ICU_ID || 0),
        icuBedNo: icuBedData.icuBedNo || icuBedData.ICUBedNo || data.icuBedNo,
        icuType: icuBedData.icuType || icuBedData.ICUType || data.icuType,
        icuRoomNameNo: icuBedData.icuRoomNameNo || icuBedData.ICURoomNameNo || data.icuRoomNameNo,
        icuDescription: icuBedData.icuDescription || icuBedData.ICUDescription || data.icuDescription,
        isVentilatorAttached: Boolean(icuBedData.isVentilatorAttached !== undefined ? icuBedData.isVentilatorAttached : (icuBedData.IsVentilatorAttached !== undefined ? icuBedData.IsVentilatorAttached : data.isVentilatorAttached)),
        status: (icuBedData.status || icuBedData.Status || data.status || 'active').toLowerCase() as 'active' | 'inactive',
        createdAt: icuBedData.createdAt || icuBedData.CreatedAt || new Date().toISOString(),
        createdDate: icuBedData.createdDate || icuBedData.CreatedDate || icuBedData.createdAt || icuBedData.CreatedAt || undefined,
      };

      return normalizedICUBed;
    } catch (error: any) {
      console.error('Error creating ICU bed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // Re-throw API errors with detailed message
      if (error.name === 'ApiError' || error.status) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || errorData?.error || error.message || 'Failed to create ICU bed';
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
      throw new Error('Failed to create ICU bed. Please check the console for details.');
    }
  },

  async update(data: UpdateICUBedDto): Promise<ICUBed> {
    try {
      // Validate required fields - use icuId for update
      if (!data.icuId || data.icuId <= 0) {
        console.error('Invalid ICU ID in update request:', data.icuId, 'Full update data:', data);
        throw new Error('Valid ICU ID is required for update');
      }
      
      console.log('Updating ICU bed with ICUId:', data.icuId);

      // Convert frontend camelCase to backend PascalCase
      const backendData: any = {};
      
      // Always include IsVentilatorAttached FIRST as it's required by the backend (must be "Yes" or "No")
      // Explicitly convert boolean to "Yes" or "No" string - always include this field
      // Use strict equality check to ensure false is not treated as truthy
      const isVentilatorAttached = data.isVentilatorAttached === true;
      backendData.IsVentilatorAttached = isVentilatorAttached ? 'Yes' : 'No';
      console.log('IsVentilatorAttached being sent to API (UPDATE):', backendData.IsVentilatorAttached, 'from:', data.isVentilatorAttached, 'strict check result:', isVentilatorAttached);
      
      if (data.icuBedNo !== undefined) {
        backendData.ICUBedNo = data.icuBedNo.trim();
      }
      if (data.icuType !== undefined) {
        backendData.ICUType = data.icuType.trim();
      }
      if (data.icuRoomNameNo !== undefined) {
        backendData.ICURoomNameNo = data.icuRoomNameNo.trim();
      }
      if (data.icuDescription !== undefined) {
        if (data.icuDescription === null || data.icuDescription.trim() === '') {
          backendData.ICUDescription = null;
        } else {
          backendData.ICUDescription = data.icuDescription.trim();
        }
      }
      
      if (data.status !== undefined && data.status !== null) {
        backendData.Status = normalizeStatusForBackend(data.status);
        console.log('Status being sent to API:', backendData.Status, 'from:', data.status);
      } else {
        console.log('Status not provided in update data:', data.status);
      }

      // Ensure IsVentilatorAttached is always present in the request
      if (!backendData.hasOwnProperty('IsVentilatorAttached')) {
        console.warn('IsVentilatorAttached missing from backendData, adding default "No"');
        backendData.IsVentilatorAttached = 'No';
      }
      
      console.log('Updating ICU bed with data:', JSON.stringify(backendData, null, 2));
      console.log('IsVentilatorAttached in final payload:', backendData.IsVentilatorAttached);

      // Call the actual API endpoint - use icuId in the URL
      const response = await apiRequest<any>(`/icu/${data.icuId}`, {
        method: 'PUT',
        body: JSON.stringify(backendData),
      });

      console.log('Update ICU bed API response:', response);

      // Handle different response structures: { data: {...} } or direct object
      const icuBedData = response?.data || response;

      if (!icuBedData) {
        throw new Error('No ICU bed data received from API');
      }

      // Normalize the response to match ICUBed interface
      const normalizedICUBed: ICUBed = {
        id: icuBedData.id || icuBedData.Id || 0,
        icuBedId: Number(icuBedData.icuBedId || icuBedData.ICUBedId || icuBedData.id || icuBedData.Id || 0),
        icuId: Number(icuBedData.icuId || icuBedData.ICUId || icuBedData.ICU_ID || 0),
        icuBedNo: icuBedData.icuBedNo || icuBedData.ICUBedNo || data.icuBedNo || '',
        icuType: icuBedData.icuType || icuBedData.ICUType || data.icuType || '',
        icuRoomNameNo: icuBedData.icuRoomNameNo || icuBedData.ICURoomNameNo || data.icuRoomNameNo || '',
        icuDescription: icuBedData.icuDescription || icuBedData.ICUDescription || data.icuDescription,
        isVentilatorAttached: Boolean(icuBedData.isVentilatorAttached !== undefined ? icuBedData.isVentilatorAttached : (icuBedData.IsVentilatorAttached !== undefined ? icuBedData.IsVentilatorAttached : (data.isVentilatorAttached !== undefined ? data.isVentilatorAttached : false))),
        status: (icuBedData.status || icuBedData.Status || data.status || 'active').toLowerCase() as 'active' | 'inactive',
        createdAt: icuBedData.createdAt || icuBedData.CreatedAt || new Date().toISOString(),
        createdDate: icuBedData.createdDate || icuBedData.CreatedDate || icuBedData.createdAt || icuBedData.CreatedAt || undefined,
      };

      return normalizedICUBed;
    } catch (error: any) {
      console.error('Error updating ICU bed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // Re-throw API errors with detailed message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || errorData?.error || error.message || 'Failed to update ICU bed';
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
      throw new Error('Failed to update ICU bed. Please check the console for details.');
    }
  },

  async delete(icuBedId: number): Promise<void> {
    try {
      // Validate ID before making API call
      if (!icuBedId || icuBedId <= 0) {
        throw new Error(`Invalid ICU bed ID: ${icuBedId}. Cannot delete ICU bed.`);
      }
      
      console.log(`Deleting ICU bed with ICUBedId: ${icuBedId}`);
      
      // Call the actual API endpoint
      const response = await apiRequest<any>(`/icu/${icuBedId}`, { 
        method: 'DELETE',
      });
      
      console.log('Delete ICU bed API response:', response);
    } catch (error: any) {
      console.error(`Error deleting ICU bed with id ${icuBedId}:`, error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // Re-throw API errors with detailed message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || errorData?.error || error.message || `Failed to delete ICU bed with id ${icuBedId}`;
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
};

