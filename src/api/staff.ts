// Staff API service
import { apiRequest } from './base';
import { Staff, CreateUserDto, UpdateUserDto } from '../types/staff';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface GetUsersResponse {
  success: boolean;
  count?: number;
  data: Staff[];
}


const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const staffApi = {
  async getAll(): Promise<Staff[]> {
    let apiData: Staff[] = [];
    
    try {
      const response = await apiRequest<GetUsersResponse>('/users', {
        method: 'GET',
      });

      if (response.success && response.data) {
        apiData = response.data;
      }
    } catch (error) {
      console.error('Error fetching staff from /api/users:', error);
      throw error;
    }
    
    return apiData;
  },

  async getById(id: number): Promise<Staff> {
    const response = await apiRequest<ApiResponse<Staff>>(`/users/${id}`, {
      method: 'GET',
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch user');
    }

    return response.data;
  },

  async create(data: CreateUserDto): Promise<Staff> {
    const response = await apiRequest<ApiResponse<Staff>>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create user');
    }

    return response.data;
  },

  async update(data: UpdateUserDto): Promise<Staff> {
    const { UserId, ...updateData } = data;
    const response = await apiRequest<ApiResponse<Staff>>(`/users/${UserId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update user');
    }

    return response.data;
  },

  async delete(id: number): Promise<void> {
    const response = await apiRequest<ApiResponse<void>>(`/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete user');
    }
  },
};

