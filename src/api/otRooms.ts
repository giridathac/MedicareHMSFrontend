// OT Rooms API service
import { apiRequest, ENABLE_STUB_DATA } from './base';
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

// Stub data for fallback
const stubOTRooms: OTRoom[] = [
  { id: 1, otId: 'OT-01', otNo: 'OT-001', otType: 'General', otName: 'General Operating Theatre 1', otDescription: 'General purpose operating room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-01T10:00:00Z', status: 'active' },
  { id: 2, otId: 'OT-02', otNo: 'OT-002', otType: 'Cardiac', otName: 'Cardiac Operating Theatre', otDescription: 'Specialized cardiac surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-01T10:00:00Z', status: 'active' },
  { id: 3, otId: 'OT-03', otNo: 'OT-003', otType: 'Orthopedic', otName: 'Orthopedic Operating Theatre', otDescription: 'Bone and joint surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-01T10:00:00Z', status: 'active' },
  { id: 4, otId: 'OT-04', otNo: 'OT-004', otType: 'Neurosurgery', otName: 'Neurosurgery Operating Theatre', otDescription: 'Brain and spine surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-01T10:00:00Z', status: 'active' },
  { id: 5, otId: 'OT-05', otNo: 'OT-005', otType: 'General', otName: 'General Operating Theatre 2', otDescription: 'General purpose operating room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-02T10:00:00Z', status: 'active' },
  { id: 6, otId: 'OT-06', otNo: 'OT-006', otType: 'Gynecology', otName: 'Gynecology Operating Theatre', otDescription: 'Women reproductive surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-02T10:00:00Z', status: 'active' },
  { id: 7, otId: 'OT-07', otNo: 'OT-007', otType: 'Urology', otName: 'Urology Operating Theatre', otDescription: 'Urinary tract surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-02T10:00:00Z', status: 'active' },
  { id: 8, otId: 'OT-08', otNo: 'OT-008', otType: 'Plastic Surgery', otName: 'Plastic Surgery Operating Theatre', otDescription: 'Reconstructive and cosmetic surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-03T10:00:00Z', status: 'active' },
  { id: 9, otId: 'OT-09', otNo: 'OT-009', otType: 'Ophthalmology', otName: 'Ophthalmology Operating Theatre', otDescription: 'Eye surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-03T10:00:00Z', status: 'active' },
  { id: 10, otId: 'OT-10', otNo: 'OT-010', otType: 'ENT', otName: 'ENT Operating Theatre', otDescription: 'Ear, nose, and throat surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-03T10:00:00Z', status: 'active' },
  { id: 11, otId: 'OT-11', otNo: 'OT-011', otType: 'General', otName: 'General Operating Theatre 3', otDescription: 'General purpose operating room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-04T10:00:00Z', status: 'active' },
  { id: 12, otId: 'OT-12', otNo: 'OT-012', otType: 'Cardiac', otName: 'Cardiac Operating Theatre 2', otDescription: 'Specialized cardiac surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-04T10:00:00Z', status: 'active' },
  { id: 13, otId: 'OT-13', otNo: 'OT-013', otType: 'Orthopedic', otName: 'Orthopedic Operating Theatre 2', otDescription: 'Bone and joint surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-04T10:00:00Z', status: 'active' },
  { id: 14, otId: 'OT-14', otNo: 'OT-014', otType: 'Pediatric', otName: 'Pediatric Operating Theatre', otDescription: 'Children surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-05T10:00:00Z', status: 'active' },
  { id: 15, otId: 'OT-15', otNo: 'OT-015', otType: 'Emergency', otName: 'Emergency Operating Theatre', otDescription: 'Emergency surgery room', startTimeofDay: '00:00', endTimeofDay: '23:59', createdBy: '1', createdAt: '2025-01-05T10:00:00Z', status: 'active' },
  { id: 16, otId: 'OT-16', otNo: 'OT-016', otType: 'General', otName: 'General Operating Theatre 4', otDescription: 'General purpose operating room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-05T10:00:00Z', status: 'active' },
  { id: 17, otId: 'OT-17', otNo: 'OT-017', otType: 'Vascular', otName: 'Vascular Operating Theatre', otDescription: 'Blood vessel surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-06T10:00:00Z', status: 'active' },
  { id: 18, otId: 'OT-18', otNo: 'OT-018', otType: 'Thoracic', otName: 'Thoracic Operating Theatre', otDescription: 'Chest and lung surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-06T10:00:00Z', status: 'active' },
  { id: 19, otId: 'OT-19', otNo: 'OT-019', otType: 'General', otName: 'General Operating Theatre 5', otDescription: 'General purpose operating room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-06T10:00:00Z', status: 'active' },
  { id: 20, otId: 'OT-20', otNo: 'OT-020', otType: 'Cardiac', otName: 'Cardiac Operating Theatre 3', otDescription: 'Specialized cardiac surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-07T10:00:00Z', status: 'active' },
  { id: 21, otId: 'OT-21', otNo: 'OT-021', otType: 'Orthopedic', otName: 'Orthopedic Operating Theatre 3', otDescription: 'Bone and joint surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-07T10:00:00Z', status: 'active' },
  { id: 22, otId: 'OT-22', otNo: 'OT-022', otType: 'Neurosurgery', otName: 'Neurosurgery Operating Theatre 2', otDescription: 'Brain and spine surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-07T10:00:00Z', status: 'active' },
  { id: 23, otId: 'OT-23', otNo: 'OT-023', otType: 'General', otName: 'General Operating Theatre 6', otDescription: 'General purpose operating room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-08T10:00:00Z', status: 'active' },
  { id: 24, otId: 'OT-24', otNo: 'OT-024', otType: 'Gynecology', otName: 'Gynecology Operating Theatre 2', otDescription: 'Women reproductive surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-08T10:00:00Z', status: 'active' },
  { id: 25, otId: 'OT-25', otNo: 'OT-025', otType: 'Urology', otName: 'Urology Operating Theatre 2', otDescription: 'Urinary tract surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-08T10:00:00Z', status: 'active' },
  { id: 26, otId: 'OT-26', otNo: 'OT-026', otType: 'Emergency', otName: 'Emergency Operating Theatre 2', otDescription: 'Emergency surgery room', startTimeofDay: '00:00', endTimeofDay: '23:59', createdBy: '1', createdAt: '2025-01-09T10:00:00Z', status: 'active' },
  { id: 27, otId: 'OT-27', otNo: 'OT-027', otType: 'General', otName: 'General Operating Theatre 7', otDescription: 'General purpose operating room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-09T10:00:00Z', status: 'active' },
  { id: 28, otId: 'OT-28', otNo: 'OT-028', otType: 'Cardiac', otName: 'Cardiac Operating Theatre 4', otDescription: 'Specialized cardiac surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-09T10:00:00Z', status: 'active' },
  { id: 29, otId: 'OT-29', otNo: 'OT-029', otType: 'Orthopedic', otName: 'Orthopedic Operating Theatre 4', otDescription: 'Bone and joint surgery room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-10T10:00:00Z', status: 'active' },
  { id: 30, otId: 'OT-30', otNo: 'OT-030', otType: 'General', otName: 'General Operating Theatre 8', otDescription: 'General purpose operating room', startTimeofDay: '08:00', endTimeofDay: '20:00', createdBy: '1', createdAt: '2025-01-10T10:00:00Z', status: 'active' },
];

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
      // If stub data is disabled and API fails, throw the error
      if (!ENABLE_STUB_DATA) {
        throw error;
      }
    }
    
    // Append stub data if enabled
    if (ENABLE_STUB_DATA) {
      // Filter out stub data that might conflict with API data (by ID)
      const apiIds = new Set(apiData.map(room => room.id));
      let filteredStubData = stubOTRooms.filter(room => !apiIds.has(room.id));
      
      // Apply filters to stub data
      if (status) {
        const statusLower = status.toLowerCase();
        filteredStubData = filteredStubData.filter(room => 
          statusLower === 'active' ? room.status === 'active' : room.status === 'inactive'
        );
      }
      
      if (otType) {
        filteredStubData = filteredStubData.filter(room => 
          room.otType.toLowerCase().includes(otType.toLowerCase())
        );
      }
      
      // Combine API data with stub data
      const combinedData = [...apiData, ...filteredStubData];
      
      // Recalculate pagination for combined data
      totalCount = combinedData.length;
      totalPages = Math.ceil(totalCount / limit);
      
      // Apply pagination to combined data
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = combinedData.slice(startIndex, endIndex);
      const hasMore = page < totalPages;
      
      if (filteredStubData.length > 0) {
        console.log(`Appending ${filteredStubData.length} stub OT rooms to ${apiData.length} API records`);
      }
      
      // If API returned no data, use stub data as fallback
      if (apiData.length === 0 && filteredStubData.length > 0) {
        console.warn('No OT rooms data received from API, using stub data');
        await delay(300);
      }
      
      return {
        data: paginatedData,
        total: totalCount,
        page: page,
        limit: limit,
        hasMore,
      };
    }
    
    // Return only API data if stub data is disabled
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

