// OT Rooms API service
import { apiRequest } from './base';
import { OTRoom } from '../types';

// API Response types
interface OTResponseItem {
  OTId: number;
  OTNo: string;
  OTType: string | null;
  OTName: string | null;
  OTDescription: string | null;
  OTStartTimeofDay: string | null;
  OTEndTimeofDay: string | null;
  Status: string;
  CreatedBy: number | null;
  CreatedAt: string | Date;
}

interface OTAPIResponse {
  success: boolean;
  count: number;
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
  data: OTResponseItem[];
}

interface OTCreateResponse {
  success: boolean;
  message: string;
  data: OTResponseItem;
}

// Map API response to OTRoom type
function mapOTResponseToOTRoom(item: OTResponseItem): OTRoom {
  return {
    id: item.OTId,
    otId: `OT-${item.OTId.toString().padStart(2, '0')}`, // Generate otId from OTId if not provided
    otNo: item.OTNo,
    otType: item.OTType || '',
    otName: item.OTName || '',
    otDescription: item.OTDescription || undefined,
    startTimeofDay: item.OTStartTimeofDay || '08:00',
    endTimeofDay: item.OTEndTimeofDay || '20:00',
    createdBy: item.CreatedBy?.toString() || '1',
    createdAt: typeof item.CreatedAt === 'string' 
      ? item.CreatedAt 
      : new Date(item.CreatedAt).toISOString(),
    status: item.Status?.toLowerCase() === 'active' ? 'active' : 'inactive',
  };
}


const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface CreateOTRoomDto {
  otNo: string;
  otType: string;
  otName: string;
  otDescription?: string;
  startTimeofDay: string;
  endTimeofDay: string;
  createdBy: string;
  status?: 'active' | 'inactive';
}

export interface UpdateOTRoomDto extends Partial<CreateOTRoomDto> {
  id: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const otRoomsApi = {
  async getAll(
    page: number = 1, 
    limit: number = 10, 
    status?: string, 
    otType?: string
  ): Promise<PaginatedResponse<OTRoom>> {
    let apiData: OTRoom[] = [];
    let totalCount = 0;
    let totalPages = 0;
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (status) {
        params.append('status', status);
      }
      if (otType) {
        params.append('otType', otType);
      }

      const response = await apiRequest<OTAPIResponse>(`/ot?${params.toString()}`);
      
      if (response.success) {
        apiData = response.data.map(mapOTResponseToOTRoom);
        totalCount = response.totalCount;
        totalPages = response.totalPages;
      }
    } catch (error) {
      console.error('Error fetching OT rooms:', error);
      throw error;
    }
    
    const hasMore = page < totalPages;
    return {
      data: apiData,
      total: totalCount,
      page: page,
      limit: limit,
      hasMore,
    };
  },
  
  async getAllLegacy(): Promise<OTRoom[]> {
    // Legacy method - fetch all pages
    const allRooms: OTRoom[] = [];
    let page = 1;
    let hasMore = true;
    const limit = 100; // Fetch in larger chunks

    while (hasMore) {
      const response = await this.getAll(page, limit);
      allRooms.push(...response.data);
      hasMore = response.hasMore;
      page++;
    }

    return allRooms;
  },

  async getById(id: number): Promise<OTRoom> {
    // Fetch by filtering the paginated endpoint
    const response = await this.getAll(1, 100);
    const otRoom = response.data.find(r => r.id === id);
    if (!otRoom) {
      throw new Error(`OTRoom with id ${id} not found`);
    }
    return otRoom;
  },

  async getByType(type: string): Promise<OTRoom[]> {
    // Use the getAll method with otType filter
    const response = await this.getAll(1, 100, undefined, type);
    return response.data;
  },

  async create(data: CreateOTRoomDto): Promise<OTRoom> {
    try {
      // Map our DTO to API request format
      const requestBody = {
        OTNo: data.otNo,
        OTType: data.otType || null,
        OTName: data.otName || null,
        OTDescription: data.otDescription || null,
        OTStartTimeofDay: data.startTimeofDay || null,
        OTEndTimeofDay: data.endTimeofDay || null,
        Status: data.status === 'inactive' ? 'InActive' : 'Active',
        CreatedBy: data.createdBy ? parseInt(data.createdBy, 10) : null,
      };

      const response = await apiRequest<OTCreateResponse>('/ot', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create OT room');
      }

      // Map API response to our format
      return mapOTResponseToOTRoom(response.data);
    } catch (error) {
      console.error('Error creating OT room:', error);
      throw error;
    }
  },

  async update(data: UpdateOTRoomDto): Promise<OTRoom> {
    try {
      // Map our DTO to API request format (only include fields that are provided)
      const requestBody: Record<string, unknown> = {};
      
      if (data.otNo !== undefined) {
        requestBody.OTNo = data.otNo;
      }
      if (data.otType !== undefined) {
        requestBody.OTType = data.otType || null;
      }
      if (data.otName !== undefined) {
        requestBody.OTName = data.otName || null;
      }
      if (data.otDescription !== undefined) {
        requestBody.OTDescription = data.otDescription || null;
      }
      if (data.startTimeofDay !== undefined) {
        requestBody.OTStartTimeofDay = data.startTimeofDay || null;
      }
      if (data.endTimeofDay !== undefined) {
        requestBody.OTEndTimeofDay = data.endTimeofDay || null;
      }
      if (data.status !== undefined) {
        requestBody.Status = data.status === 'inactive' ? 'InActive' : 'Active';
      }
      if (data.createdBy !== undefined) {
        requestBody.CreatedBy = data.createdBy ? parseInt(data.createdBy, 10) : null;
      }

      const response = await apiRequest<OTCreateResponse>(`/ot/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to update OT room');
      }

      // Map API response to our format
      return mapOTResponseToOTRoom(response.data);
    } catch (error) {
      console.error('Error updating OT room:', error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      const response = await apiRequest<OTCreateResponse>(`/ot/${id}`, {
        method: 'DELETE',
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete OT room');
      }

      // Delete endpoint returns the deleted item in data, but we don't need to return it
      // The method signature is Promise<void>
    } catch (error) {
      console.error('Error deleting OT room:', error);
      throw error;
    }
  },
};

