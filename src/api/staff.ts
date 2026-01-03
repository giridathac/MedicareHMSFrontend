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

  async resetPasswordWithNewPassword(id: number, newPassword: string): Promise<void> {

    console.log('Making reset password request for user ID:', id);
    try {
      // Make direct fetch call without token for Super Admin password reset
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
      const url = `${API_BASE_URL}/auth/reset-password-for-userid`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ UserId: id, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Password reset failed:', errorData.message);
        throw new Error(errorData.message || 'Failed to reset password');
      }

      const responseData = await response.json();
      console.log('AAAAAAAAAAAAAAAAAReceived response from reset password request:', responseData);
      if (!responseData.success) {
        console.error('Password reset failed:', responseData.message);
        throw new Error(responseData.message || 'Failed to reset password');
      }

      console.log('Password reset successful for user ID:', id);
    } catch (error) {
      console.error('Error during password reset request:', error);
      throw error;
    }
  },
};

