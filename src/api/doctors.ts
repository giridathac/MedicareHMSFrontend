// Doctors API service
import { apiRequest } from './base';
import { Doctor } from '../types';

export interface CreateDoctorDto {
  name: string;
  specialty: string;
  type: 'inhouse' | 'consulting';
}

export interface UpdateDoctorDto extends Partial<CreateDoctorDto> {
  id: number;
}

export interface CreateAttendanceDto {
  doctorId: number;
  date: string;
  status: 'present' | 'absent' | 'on-leave' | 'half-day';
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: number;
  doctorId: number;
  date: string;
  status: 'present' | 'absent' | 'on-leave' | 'half-day';
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

export const doctorsApi = {
  async getAll(): Promise<Doctor[]> {
    let apiData: Doctor[] = [];
    
    try {
      const response = await apiRequest<any>('/users');
      // Handle different response structures: { data: [...] } or direct array
      const doctorsData = response?.data || response || [];
      
      if (Array.isArray(doctorsData) && doctorsData.length > 0) {
        // Map API response to Doctor format
        apiData = doctorsData
          .filter((user: any) => {
            // Filter for doctors/surgeons - this might need adjustment based on your API structure
            const roleName = user.RoleName || user.roleName || '';
            return roleName.toLowerCase().includes('doctor') || roleName.toLowerCase().includes('surgeon');
          })
          .map((user: any) => ({
            id: user.UserId || user.id || 0,
            name: user.UserName || user.name || '',
            specialty: user.DoctorDepartmentName || user.specialty || 'General Medicine',
            type: (user.DoctorType === 'INHOUSE' ? 'inhouse' : 'consulting') as 'inhouse' | 'consulting',
          }));
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
    
    return apiData;
  },

  async getById(id: number): Promise<Doctor> {
    try {
      const response = await apiRequest<any>(`/users/${id}`);
      // Handle different response structures: { data: {...} } or direct object
      const userData = response?.data || response;
      
      if (userData) {
        // Map API response to Doctor format
        const doctor: Doctor = {
          id: userData.UserId || userData.id || id,
          name: userData.UserName || userData.name || '',
          specialty: userData.DoctorDepartmentName || userData.specialty || 'General Medicine',
          type: (userData.DoctorType === 'INHOUSE' ? 'inhouse' : 'consulting') as 'inhouse' | 'consulting',
        };
        return doctor;
      }
      
      throw new Error(`Doctor with id ${id} not found`);
    } catch (error) {
      console.error(`Error fetching doctor with id ${id}:`, error);
      throw error;
    }
  },

  async create(data: CreateDoctorDto): Promise<Doctor> {
    try {
      const response = await apiRequest<any>('/doctors', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const doctorData = response?.data || response;
      return {
        id: doctorData.id || doctorData.UserId || 0,
        name: doctorData.name || doctorData.UserName || data.name,
        specialty: doctorData.specialty || doctorData.DoctorDepartmentName || data.specialty,
        type: doctorData.type || (doctorData.DoctorType === 'INHOUSE' ? 'inhouse' : 'consulting') as 'inhouse' | 'consulting',
      };
    } catch (error) {
      console.error('Error creating doctor:', error);
      throw error;
    }
  },

  async update(data: UpdateDoctorDto): Promise<Doctor> {
    try {
      const response = await apiRequest<any>(`/doctors/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const doctorData = response?.data || response;
      return {
        id: doctorData.id || doctorData.UserId || data.id,
        name: doctorData.name || doctorData.UserName || data.name || '',
        specialty: doctorData.specialty || doctorData.DoctorDepartmentName || data.specialty || '',
        type: doctorData.type || (doctorData.DoctorType === 'INHOUSE' ? 'inhouse' : 'consulting') as 'inhouse' | 'consulting',
      };
    } catch (error) {
      console.error('Error updating doctor:', error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await apiRequest<void>(`/doctors/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting doctor:', error);
      throw error;
    }
  },

  // Attendance methods
  async getAttendance(doctorId?: number, date?: string): Promise<AttendanceRecord[]> {
    try {
      let endpoint = '/doctors/attendance';
      const queryParams: string[] = [];
      if (doctorId) {
        queryParams.push(`doctorId=${doctorId}`);
      }
      if (date) {
        queryParams.push(`date=${date}`);
      }
      if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
      }
      const response = await apiRequest<AttendanceRecord[]>(endpoint);
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  },

  async createAttendance(data: CreateAttendanceDto): Promise<AttendanceRecord> {
    try {
      const response = await apiRequest<AttendanceRecord>('/doctors/attendance', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response?.data || response;
    } catch (error) {
      console.error('Error creating attendance:', error);
      throw error;
    }
  },

  async updateAttendance(id: number, data: Partial<CreateAttendanceDto>): Promise<AttendanceRecord> {
    try {
      const response = await apiRequest<AttendanceRecord>(`/doctors/attendance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response?.data || response;
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  },
};

