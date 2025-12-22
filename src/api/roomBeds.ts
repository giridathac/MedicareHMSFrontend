// RoomBeds API service
import { apiRequest, ApiError } from './base';
import { RoomBed } from '../types';

// Helper function to normalize status to 'Active' or 'Inactive'
function normalizeStatus(status: any): 'Active' | 'Inactive' {
  if (!status) return 'Active';
  
  const statusStr = String(status).trim();
  const lowerStatus = statusStr.toLowerCase();
  
  // Map various status values to 'Active' or 'Inactive'
  if (lowerStatus === 'active' || lowerStatus === 'occupied' || lowerStatus === 'available') {
    return 'Active';
  }
  if (lowerStatus === 'inactive' || lowerStatus === 'maintenance' || lowerStatus === 'unavailable') {
    return 'Inactive';
  }
  
  // If it's already 'Active' or 'Inactive' (case-insensitive), return it capitalized
  if (lowerStatus === 'active') return 'Active';
  if (lowerStatus === 'inactive') return 'Inactive';
  
  // Default to 'Active' if unknown status
  return 'Active';
}

export interface CreateRoomBedDto {
  bedNo: string;
  roomNo: string;
  roomCategory: string;
  roomType: string;
  numberOfBeds: number;
  chargesPerDay: number;
  status?: 'Active' | 'Inactive';
  createdBy: number;
}

export interface UpdateRoomBedDto extends Partial<CreateRoomBedDto> {
  roomBedId: number; // Integer primary key
}

export const roomBedsApi = {
  async getAll(): Promise<RoomBed[]> {
    let apiData: RoomBed[] = [];
    
    try {
      const response = await apiRequest<any>('/room-beds');
      // Handle different response structures: { data: [...] } or direct array
      const roomBedsData = response?.data || response || [];
     
      if (Array.isArray(roomBedsData) && roomBedsData.length > 0) {
        console.log('Room beds fetched from API:', roomBedsData);
        // Map and normalize the data to ensure all fields are present
        apiData = roomBedsData.map((roomBed: any, index: number) => {
          // Handle ChargesPerDay - check both camelCase and PascalCase, handle 0 values correctly
          // Check for all possible field name variations from database
          const chargesPerDayValue = 
            (roomBed.chargesPerDay !== undefined && roomBed.chargesPerDay !== null) ? roomBed.chargesPerDay :
            (roomBed.ChargesPerDay !== undefined && roomBed.ChargesPerDay !== null) ? roomBed.ChargesPerDay :
            (roomBed.Charges !== undefined && roomBed.Charges !== null) ? roomBed.Charges :
            (roomBed.charges !== undefined && roomBed.charges !== null) ? roomBed.charges :
            0;
          
          const chargesPerDay = Number(chargesPerDayValue);
          
          // Log for debugging
          if (roomBed.chargesPerDay === undefined && roomBed.ChargesPerDay === undefined) {
            console.log('ChargesPerDay not found in room bed data:', {
              bedNo: roomBed.bedNo || roomBed.BedNo,
              allKeys: Object.keys(roomBed),
              chargesPerDay: roomBed.chargesPerDay,
              ChargesPerDay: roomBed.ChargesPerDay,
              Charges: roomBed.Charges,
              charges: roomBed.charges
            });
          }
          
            
          // Extract roomBedId (integer) from various possible field names
          // Priority: RoomBedsId (with 's') is the primary key from backend
          const roomBedIdValue = roomBed.RoomBedsId !== undefined && roomBed.RoomBedsId !== null ? roomBed.RoomBedsId :
            roomBed.roomBedsId !== undefined && roomBed.roomBedsId !== null ? roomBed.roomBedsId :
            roomBed.roomBedId !== undefined && roomBed.roomBedId !== null ? roomBed.roomBedId :
            roomBed.RoomBedId !== undefined && roomBed.RoomBedId !== null ? roomBed.RoomBedId :
            roomBed.id !== undefined && roomBed.id !== null ? roomBed.id : 0;
          
          const normalizedRoomBedId = Number(roomBedIdValue);
          
          // Log if roomBedId is missing or invalid
          if (!normalizedRoomBedId || isNaN(normalizedRoomBedId) || normalizedRoomBedId <= 0) {
            console.warn(`Room bed missing or invalid roomBedId (integer)`, {
              id: roomBed.id,
              RoomBedsId: roomBed.RoomBedsId,
              roomBedsId: roomBed.roomBedsId,
              bedNo: roomBed.bedNo || roomBed.BedNo,
              roomNo: roomBed.roomNo || roomBed.RoomNo,
              allKeys: Object.keys(roomBed)
            });
          }
          
          return {
            id: roomBed.id,
            roomBedId: normalizedRoomBedId,
            bedNo: roomBed.bedNo || roomBed.BedNo || '',
            roomNo: roomBed.roomNo || roomBed.RoomNo || '',
            roomCategory: roomBed.roomCategory || roomBed.RoomCategory || '',
            roomType: roomBed.roomType || roomBed.RoomType || '',
            numberOfBeds: roomBed.numberOfBeds || roomBed.NumberOfBeds || roomBed.NoofBeds || 1,
            chargesPerDay: isNaN(chargesPerDay) ? 0 : chargesPerDay,
            status: normalizeStatus(roomBed.status || roomBed.Status || 'Active'),
            createdBy: roomBed.createdBy || roomBed.CreatedBy || '',
            createdAt: roomBed.createdAt || roomBed.CreatedAt || new Date().toISOString(),
          };
        }) as RoomBed[];
      }
    } catch (error) {
      console.error('Error fetching room beds:', error);
      throw error;
    }
    
    return apiData;
  },

  async getById(roomBedId: number): Promise<RoomBed> {
    try {
      // Validate roomBedId (integer) before making API call
      if (!roomBedId || typeof roomBedId !== 'number' || roomBedId <= 0 || isNaN(roomBedId)) {
        throw new Error(`Invalid room bed ID (integer): ${roomBedId}. Cannot fetch room bed data.`);
      }
      
      const response = await apiRequest<any>(`/room-beds/${roomBedId}`);
      console.log('Get room bed by ID response:', response);
      
      // Handle different response structures: { data: {...} } or direct object
      const roomBedData = response?.data || response;
      
      if (!roomBedData) {
        throw new Error(`RoomBed with id ${roomBedId} not found`);
      }
      
      // Extract roomBedId (integer) from various possible field names
      // Priority: RoomBedsId (with 's') is the primary key from backend
      const roomBedIdValue = roomBedData.RoomBedsId !== undefined && roomBedData.RoomBedsId !== null ? roomBedData.RoomBedsId :
        roomBedData.roomBedsId !== undefined && roomBedData.roomBedsId !== null ? roomBedData.roomBedsId :
        roomBedData.roomBedId !== undefined && roomBedData.roomBedId !== null ? roomBedData.roomBedId :
        roomBedData.RoomBedId !== undefined && roomBedData.RoomBedId !== null ? roomBedData.RoomBedId :
        roomBedData.id !== undefined && roomBedData.id !== null ? roomBedData.id : 0;
      
      const normalizedRoomBedId = Number(roomBedIdValue);
      
      // Log if roomBedId is missing or invalid
      if (!normalizedRoomBedId || isNaN(normalizedRoomBedId) || normalizedRoomBedId <= 0) {
        console.warn(`Room bed missing or invalid roomBedId (integer) in getById`, {
          requestedRoomBedId: roomBedId,
          RoomBedsId: roomBedData.RoomBedsId,
          roomBedsId: roomBedData.roomBedsId,
          bedNo: roomBedData.bedNo || roomBedData.BedNo,
          roomNo: roomBedData.roomNo || roomBedData.RoomNo,
          allKeys: Object.keys(roomBedData)
        });
      }
      
      // Normalize the response to match RoomBed interface
      const normalizedRoomBed: RoomBed = {
        id: roomBedData.id || roomBedData.Id || 0,
        roomBedId: normalizedRoomBedId,
        bedNo: roomBedData.bedNo || roomBedData.BedNo || '',
        roomNo: roomBedData.roomNo || roomBedData.RoomNo || '',
        roomCategory: roomBedData.roomCategory || roomBedData.RoomCategory || '',
        roomType: roomBedData.roomType || roomBedData.RoomType || '',
        numberOfBeds: roomBedData.numberOfBeds !== undefined && roomBedData.numberOfBeds !== null
          ? roomBedData.numberOfBeds
          : (roomBedData.NumberOfBeds !== undefined && roomBedData.NumberOfBeds !== null
            ? roomBedData.NumberOfBeds
            : 1),
        chargesPerDay: Number(roomBedData.chargesPerDay || roomBedData.ChargesPerDay || 0),
        status: normalizeStatus(roomBedData.status || roomBedData.Status || 'Active'),
        createdBy: roomBedData.createdBy || roomBedData.CreatedBy || '',
        createdAt: roomBedData.createdAt || roomBedData.CreatedAt || new Date().toISOString(),
      };
      
      return normalizedRoomBed;
    } catch (error: any) {
      console.error(`Error fetching room bed with id ${roomBedId}:`, error);
      
      // Provide more detailed error message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || error.message || `Failed to fetch room bed with id ${roomBedId}`;
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  },

  async getByRoomNo(roomNo: string): Promise<RoomBed[]> {
    try {
      const response = await apiRequest<any>(`/room-beds?roomNo=${encodeURIComponent(roomNo)}`);
      const roomBedsData = response?.data || response || [];
      if (Array.isArray(roomBedsData)) {
        return roomBedsData.map((roomBed: any) => ({
          id: roomBed.id || 0,
          roomBedId: Number(roomBed.RoomBedsId || roomBed.roomBedsId || roomBed.roomBedId || roomBed.RoomBedId || 0),
          bedNo: roomBed.bedNo || roomBed.BedNo || '',
          roomNo: roomBed.roomNo || roomBed.RoomNo || '',
          roomCategory: roomBed.roomCategory || roomBed.RoomCategory || '',
          roomType: roomBed.roomType || roomBed.RoomType || '',
          numberOfBeds: roomBed.numberOfBeds || roomBed.NumberOfBeds || 1,
          chargesPerDay: Number(roomBed.chargesPerDay || roomBed.ChargesPerDay || 0),
          status: normalizeStatus(roomBed.status || roomBed.Status || 'Active'),
          createdBy: roomBed.createdBy || roomBed.CreatedBy || '',
          createdAt: roomBed.createdAt || roomBed.CreatedAt || new Date().toISOString(),
        })) as RoomBed[];
      }
      return [];
    } catch (error) {
      console.error(`Error fetching room beds by room number ${roomNo}:`, error);
      throw error;
    }
  },

  async getByCategory(category: string): Promise<RoomBed[]> {
    try {
      const response = await apiRequest<any>(`/room-beds?category=${encodeURIComponent(category)}`);
      const roomBedsData = response?.data || response || [];
      if (Array.isArray(roomBedsData)) {
        return roomBedsData.map((roomBed: any) => ({
          id: roomBed.id || 0,
          roomBedId: Number(roomBed.RoomBedsId || roomBed.roomBedsId || roomBed.roomBedId || roomBed.RoomBedId || 0),
          bedNo: roomBed.bedNo || roomBed.BedNo || '',
          roomNo: roomBed.roomNo || roomBed.RoomNo || '',
          roomCategory: roomBed.roomCategory || roomBed.RoomCategory || '',
          roomType: roomBed.roomType || roomBed.RoomType || '',
          numberOfBeds: roomBed.numberOfBeds || roomBed.NumberOfBeds || 1,
          chargesPerDay: Number(roomBed.chargesPerDay || roomBed.ChargesPerDay || 0),
          status: normalizeStatus(roomBed.status || roomBed.Status || 'Active'),
          createdBy: roomBed.createdBy || roomBed.CreatedBy || '',
          createdAt: roomBed.createdAt || roomBed.CreatedAt || new Date().toISOString(),
        })) as RoomBed[];
      }
      return [];
    } catch (error) {
      console.error(`Error fetching room beds by category ${category}:`, error);
      throw error;
    }
  },

  async create(data: CreateRoomBedDto): Promise<RoomBed> {
    try {
      // Validate required fields
      if (!data.bedNo || !data.roomNo || !data.roomCategory || !data.roomType) {
        throw new Error('BedNo, RoomNo, RoomCategory, ChargesPerDay and RoomType are required');
      }
      if (data.chargesPerDay === undefined || data.chargesPerDay === null || data.chargesPerDay < 0) {
        throw new Error('ChargesPerDay must be a valid positive number');
      }

      // Convert camelCase to PascalCase for backend API
      const backendData: any = {
        BedNo: data.bedNo.trim(),
        RoomNo: data.roomNo.trim(),
        RoomCategory: data.roomCategory.trim(),
        RoomType: data.roomType.trim(),
        ChargesPerDay: Number(data.chargesPerDay),
        // Createdby Logged in user id should be passed
        CreatedBy: data.createdBy,
      };
      
      // Add Status if provided, normalize to 'Active' or 'Inactive'
      if (data.status !== undefined && data.status !== null) {
        backendData.Status = normalizeStatus(data.status);
      }

      console.log('Creating room bed with data:', JSON.stringify(backendData, null, 2));

      // Call the actual API endpoint
      const response = await apiRequest<any>('/room-beds', {
        method: 'POST',
        body: JSON.stringify(backendData),
      });

      console.log('Create room bed API response:', response);

      // Handle different response structures: { data: {...} } or direct object
      const roomBedData = response?.data || response;

      if (!roomBedData) {
        throw new Error('No room bed data received from API');
      }

      // Extract roomBedId (integer) from various possible field names
      // Priority: RoomBedsId (with 's') is the primary key from backend
      const roomBedIdValue = roomBedData.RoomBedsId !== undefined && roomBedData.RoomBedsId !== null ? roomBedData.RoomBedsId :
        roomBedData.roomBedsId !== undefined && roomBedData.roomBedsId !== null ? roomBedData.roomBedsId :
        roomBedData.roomBedId !== undefined && roomBedData.roomBedId !== null ? roomBedData.roomBedId :
        roomBedData.RoomBedId !== undefined && roomBedData.RoomBedId !== null ? roomBedData.RoomBedId :
        roomBedData.id !== undefined && roomBedData.id !== null ? roomBedData.id : 0;
      
      const normalizedRoomBedId = Number(roomBedIdValue);
      
      // Log if roomBedId is missing or invalid
      if (!normalizedRoomBedId || isNaN(normalizedRoomBedId) || normalizedRoomBedId <= 0) {
        console.warn(`Room bed missing or invalid roomBedId (integer) in create response`, {
          RoomBedsId: roomBedData.RoomBedsId,
          roomBedsId: roomBedData.roomBedsId,
          bedNo: roomBedData.bedNo || roomBedData.BedNo,
          roomNo: roomBedData.roomNo || roomBedData.RoomNo,
          allKeys: Object.keys(roomBedData)
        });
      }

      // Normalize the response to match RoomBed interface
      const normalizedRoomBed: RoomBed = {
        id: roomBedData.id || roomBedData.Id || 0,
        roomBedId: normalizedRoomBedId,
        bedNo: roomBedData.bedNo || roomBedData.BedNo || '',
        roomNo: roomBedData.roomNo || roomBedData.RoomNo || '',
        roomCategory: roomBedData.roomCategory || roomBedData.RoomCategory || '',
        roomType: roomBedData.roomType || roomBedData.RoomType || '',
        numberOfBeds: roomBedData.numberOfBeds !== undefined && roomBedData.numberOfBeds !== null
          ? roomBedData.numberOfBeds
          : (roomBedData.NumberOfBeds !== undefined && roomBedData.NumberOfBeds !== null
            ? roomBedData.NumberOfBeds
            : 1),
        chargesPerDay: Number(roomBedData.chargesPerDay || roomBedData.ChargesPerDay || 0),
        status: normalizeStatus(roomBedData.status || roomBedData.Status || 'Active'),
        createdBy: roomBedData.createdBy || roomBedData.CreatedBy || '',
        createdAt: roomBedData.createdAt || roomBedData.CreatedAt || new Date().toISOString(),
      };

      return normalizedRoomBed;
    } catch (error: any) {
      console.error('Error creating room bed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // Re-throw API errors with detailed message
      if (error.name === 'ApiError' || error.status) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || errorData?.error || error.message || 'Failed to create room bed';
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
      throw new Error('Failed to create room bed. Please check the console for details.');
    }
  },

  async update(data: UpdateRoomBedDto): Promise<RoomBed> {
    try {
      // Validate required fields - roomBedId (integer) is the primary key
      if (!data.roomBedId || typeof data.roomBedId !== 'number' || data.roomBedId <= 0 || isNaN(data.roomBedId)) {
        throw new Error('Valid room bed ID (integer) is required for update');
      }

      // Convert frontend camelCase to backend PascalCase
      const backendData: any = {};
      
      if (data.bedNo !== undefined) {
        backendData.BedNo = data.bedNo.trim();
      }
      if (data.roomNo !== undefined) {
        backendData.RoomNo = data.roomNo.trim();
      }
      if (data.roomCategory !== undefined) {
        backendData.RoomCategory = data.roomCategory.trim();
      }
      if (data.roomType !== undefined) {
        backendData.RoomType = data.roomType.trim();
      }
      if (data.chargesPerDay !== undefined) {
        backendData.ChargesPerDay = Number(data.chargesPerDay);
      }
      // Ensure Status is always included and properly formatted when provided
      // Normalize to 'Active' or 'Inactive' for backend
      if (data.status !== undefined && data.status !== null) {
        const normalizedStatus = normalizeStatus(data.status);
        backendData.Status = normalizedStatus;
        console.log('Status being sent to API:', backendData.Status, 'from:', data.status);
      } else {
        console.log('Status not provided in update data:', data.status);
      }
      if (data.createdBy !== undefined) {
        backendData.CreatedBy = typeof data.createdBy === 'number' ? String(data.createdBy) : data.createdBy;
      }

      // Log what we're sending, especially Status
      console.log('Updating room bed with data:', JSON.stringify(backendData, null, 2));
      console.log('Status in update data:', data.status, 'Status in backendData:', backendData.Status);

      // Call the actual API endpoint using roomBedId (UUID) as primary key
      const response = await apiRequest<any>(`/room-beds/${data.roomBedId}`, {
        method: 'PUT',
        body: JSON.stringify(backendData),
      });

      console.log('Update room bed API response:', response);

      // Handle different response structures: { data: {...} } or direct object
      const roomBedData = response?.data || response;

      if (!roomBedData) {
        throw new Error('No room bed data received from API');
      }

      // Extract roomBedId (integer) from various possible field names
      // Priority: RoomBedsId (with 's') is the primary key from backend
      const roomBedIdValue = roomBedData.RoomBedsId !== undefined && roomBedData.RoomBedsId !== null ? roomBedData.RoomBedsId :
        roomBedData.roomBedsId !== undefined && roomBedData.roomBedsId !== null ? roomBedData.roomBedsId :
        roomBedData.roomBedId !== undefined && roomBedData.roomBedId !== null ? roomBedData.roomBedId :
        roomBedData.RoomBedId !== undefined && roomBedData.RoomBedId !== null ? roomBedData.RoomBedId :
        roomBedData.id !== undefined && roomBedData.id !== null ? roomBedData.id : 0;
      
      const normalizedRoomBedId = Number(roomBedIdValue);
      
      // Log if roomBedId is missing or invalid
      if (!normalizedRoomBedId || isNaN(normalizedRoomBedId) || normalizedRoomBedId <= 0) {
        console.warn(`Room bed missing or invalid roomBedId (integer) in update response`, {
          requestedRoomBedId: data.roomBedId,
          RoomBedsId: roomBedData.RoomBedsId,
          roomBedsId: roomBedData.roomBedsId,
          bedNo: roomBedData.bedNo || roomBedData.BedNo,
          roomNo: roomBedData.roomNo || roomBedData.RoomNo,
          allKeys: Object.keys(roomBedData)
        });
      }

      // Normalize the response to match RoomBed interface
      const normalizedRoomBed: RoomBed = {
        id: roomBedData.id || roomBedData.Id || 0,
        roomBedId: normalizedRoomBedId,
        bedNo: roomBedData.bedNo || roomBedData.BedNo || '',
        roomNo: roomBedData.roomNo || roomBedData.RoomNo || '',
        roomCategory: roomBedData.roomCategory || roomBedData.RoomCategory || '',
        roomType: roomBedData.roomType || roomBedData.RoomType || '',
        numberOfBeds: roomBedData.numberOfBeds !== undefined && roomBedData.numberOfBeds !== null
          ? roomBedData.numberOfBeds
          : (roomBedData.NumberOfBeds !== undefined && roomBedData.NumberOfBeds !== null
            ? roomBedData.NumberOfBeds
            : 1),
        chargesPerDay: Number(roomBedData.chargesPerDay || roomBedData.ChargesPerDay || 0),
        status: normalizeStatus(roomBedData.status || roomBedData.Status || 'Active'),
        createdBy: roomBedData.createdBy || roomBedData.CreatedBy || '',
        createdAt: roomBedData.createdAt || roomBedData.CreatedAt || new Date().toISOString(),
      };

      return normalizedRoomBed;
    } catch (error: any) {
      console.error('Error updating room bed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // Re-throw API errors with detailed message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || errorData?.error || error.message || 'Failed to update room bed';
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
      throw new Error('Failed to update room bed. Please check the console for details.');
    }
  },

  async delete(roomBedId: number): Promise<void> {
    try {
      // Validate roomBedId (integer) before making API call
      if (!roomBedId || typeof roomBedId !== 'number' || roomBedId <= 0 || isNaN(roomBedId)) {
        throw new Error(`Invalid room bed ID (integer): ${roomBedId}. Cannot delete room bed.`);
      }
      
      // Call the actual API endpoint using roomBedId (integer) as primary key
      await apiRequest<void>(`/room-beds/${roomBedId}`, { method: 'DELETE' });
    } catch (error: any) {
      console.error(`Error deleting room bed with id ${roomBedId}:`, error);
      
      // Re-throw API errors with detailed message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || error.message || `Failed to delete room bed with id ${roomBedId}`;
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  },
};


















