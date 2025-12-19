// Doctors API service
import { apiRequest, ENABLE_STUB_DATA } from './base';
import { Doctor } from '../types';

// Stub data
const stubDoctors: Doctor[] = [
  { id: 1, name: 'Dr. Sarah Johnson', specialty: 'Cardiology', type: 'inhouse' },
  { id: 2, name: 'Dr. Michael Chen', specialty: 'Orthopedics', type: 'inhouse' },
  { id: 3, name: 'Dr. James Miller', specialty: 'Neurology', type: 'consulting' },
  { id: 4, name: 'Dr. Emily Davis', specialty: 'General Medicine', type: 'inhouse' },
  { id: 5, name: 'Dr. Robert Lee', specialty: 'Pediatrics', type: 'consulting' },
  { id: 6, name: 'Dr. Maria Garcia', specialty: 'Gynecology', type: 'inhouse' },
  { id: 7, name: 'Dr. David Wilson', specialty: 'Dermatology', type: 'consulting' },
  { id: 8, name: 'Dr. Jennifer Martinez', specialty: 'Oncology', type: 'inhouse' },
  { id: 9, name: 'Dr. Christopher Brown', specialty: 'Urology', type: 'inhouse' },
  { id: 10, name: 'Dr. Amanda White', specialty: 'Psychiatry', type: 'consulting' },
  { id: 11, name: 'Dr. Daniel Harris', specialty: 'Gastroenterology', type: 'inhouse' },
  { id: 12, name: 'Dr. Lauren Clark', specialty: 'Endocrinology', type: 'inhouse' },
  { id: 13, name: 'Dr. Ryan Lewis', specialty: 'Pulmonology', type: 'consulting' },
  { id: 14, name: 'Dr. Nicole Walker', specialty: 'Rheumatology', type: 'inhouse' },
  { id: 15, name: 'Dr. Kevin Allen', specialty: 'Nephrology', type: 'inhouse' },
  { id: 16, name: 'Dr. Samantha Young', specialty: 'Hematology', type: 'consulting' },
  { id: 17, name: 'Dr. Brandon King', specialty: 'Infectious Disease', type: 'inhouse' },
  { id: 18, name: 'Dr. Rachel Wright', specialty: 'Allergy & Immunology', type: 'consulting' },
  { id: 19, name: 'Dr. Justin Lopez', specialty: 'Cardiac Surgery', type: 'inhouse' },
  { id: 20, name: 'Dr. Michelle Hill', specialty: 'Plastic Surgery', type: 'inhouse' },
  { id: 21, name: 'Dr. Tyler Scott', specialty: 'Vascular Surgery', type: 'consulting' },
  { id: 22, name: 'Dr. Stephanie Green', specialty: 'Thoracic Surgery', type: 'inhouse' },
  { id: 23, name: 'Dr. Eric Adams', specialty: 'Ophthalmology', type: 'inhouse' },
  { id: 24, name: 'Dr. Melissa Baker', specialty: 'Anesthesiology', type: 'inhouse' },
  { id: 25, name: 'Dr. Jason Nelson', specialty: 'Emergency Medicine', type: 'inhouse' },
  { id: 26, name: 'Dr. Ashley Carter', specialty: 'Radiology', type: 'consulting' },
  { id: 27, name: 'Dr. Nathan Mitchell', specialty: 'Pathology', type: 'inhouse' },
];

// Attendance stub data
interface AttendanceRecord {
  id: number;
  doctorId: number;
  date: string;
  status: 'present' | 'absent' | 'on-leave' | 'half-day';
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

const stubAttendance: AttendanceRecord[] = [
  { id: 1, doctorId: 1, date: '2025-11-14', status: 'present', checkIn: '08:00 AM', checkOut: '05:00 PM' },
  { id: 2, doctorId: 2, date: '2025-11-14', status: 'present', checkIn: '08:30 AM', checkOut: '04:30 PM' },
  { id: 3, doctorId: 3, date: '2025-11-14', status: 'on-leave' },
  { id: 4, doctorId: 4, date: '2025-11-14', status: 'present', checkIn: '09:00 AM', checkOut: '06:00 PM' },
  { id: 5, doctorId: 5, date: '2025-11-14', status: 'half-day', checkIn: '09:00 AM', checkOut: '01:00 PM' },
  { id: 6, doctorId: 6, date: '2025-11-14', status: 'present', checkIn: '08:00 AM', checkOut: '05:00 PM' },
  { id: 7, doctorId: 7, date: '2025-11-14', status: 'absent' },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
      // If stub data is disabled and API fails, throw the error
      if (!ENABLE_STUB_DATA) {
        throw error;
      }
    }
    
    // Append stub data if enabled
    if (ENABLE_STUB_DATA) {
      // Filter out stub data that might conflict with API data (by ID)
      const apiIds = new Set(apiData.map(d => d.id));
      const uniqueStubData = stubDoctors.filter(d => !apiIds.has(d.id));
      
      if (uniqueStubData.length > 0) {
        console.log(`Appending ${uniqueStubData.length} stub doctors to ${apiData.length} API records`);
      }
      
      // If API returned no data, use stub data as fallback
      if (apiData.length === 0) {
        console.warn('No doctors data received from API, using stub data');
        await delay(300);
        return [...stubDoctors];
      }
      
      // Combine API data with stub data
      return [...apiData, ...uniqueStubData];
    }
    
    // Return only API data if stub data is disabled
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
      
      // If API returns no data and stub data is enabled, fall back to stub
      if (ENABLE_STUB_DATA) {
        await delay(200);
        const doctor = stubDoctors.find(d => d.id === id);
        if (doctor) {
          return Promise.resolve(doctor);
        }
      }
      
      throw new Error(`Doctor with id ${id} not found`);
    } catch (error) {
      console.error(`Error fetching doctor with id ${id}:`, error);
      
      // If stub data is enabled and API fails, try stub data
      if (ENABLE_STUB_DATA) {
        await delay(200);
        const doctor = stubDoctors.find(d => d.id === id);
        if (doctor) {
          return Promise.resolve(doctor);
        }
      }
      
      throw error;
    }
  },

  async create(data: CreateDoctorDto): Promise<Doctor> {
    // Replace with: return apiRequest<Doctor>('/doctors', { method: 'POST', body: JSON.stringify(data) });
    await delay(400);
    const newDoctor: Doctor = {
      id: stubDoctors.length + 1,
      ...data,
    };
    stubDoctors.push(newDoctor);
    return Promise.resolve(newDoctor);
  },

  async update(data: UpdateDoctorDto): Promise<Doctor> {
    // Replace with: return apiRequest<Doctor>(`/doctors/${data.id}`, { method: 'PUT', body: JSON.stringify(data) });
    await delay(400);
    const index = stubDoctors.findIndex(d => d.id === data.id);
    if (index === -1) {
      throw new Error(`Doctor with id ${data.id} not found`);
    }
    stubDoctors[index] = { ...stubDoctors[index], ...data };
    return Promise.resolve(stubDoctors[index]);
  },

  async delete(id: number): Promise<void> {
    // Replace with: return apiRequest<void>(`/doctors/${id}`, { method: 'DELETE' });
    await delay(300);
    const index = stubDoctors.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error(`Doctor with id ${id} not found`);
    }
    stubDoctors.splice(index, 1);
    return Promise.resolve();
  },

  // Attendance methods
  async getAttendance(doctorId?: number, date?: string): Promise<AttendanceRecord[]> {
    // Replace with: return apiRequest<AttendanceRecord[]>(`/doctors/attendance${doctorId ? `?doctorId=${doctorId}` : ''}${date ? `&date=${date}` : ''}`);
    await delay(300);
    let filtered = [...stubAttendance];
    if (doctorId) {
      filtered = filtered.filter(a => a.doctorId === doctorId);
    }
    if (date) {
      filtered = filtered.filter(a => a.date === date);
    }
    return Promise.resolve(filtered);
  },

  async createAttendance(data: CreateAttendanceDto): Promise<AttendanceRecord> {
    // Replace with: return apiRequest<AttendanceRecord>('/doctors/attendance', { method: 'POST', body: JSON.stringify(data) });
    await delay(400);
    const newRecord: AttendanceRecord = {
      id: stubAttendance.length + 1,
      ...data,
    };
    stubAttendance.push(newRecord);
    return Promise.resolve(newRecord);
  },

  async updateAttendance(id: number, data: Partial<CreateAttendanceDto>): Promise<AttendanceRecord> {
    // Replace with: return apiRequest<AttendanceRecord>(`/doctors/attendance/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    await delay(400);
    const index = stubAttendance.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error(`Attendance record with id ${id} not found`);
    }
    stubAttendance[index] = { ...stubAttendance[index], ...data };
    return Promise.resolve(stubAttendance[index]);
  },
};

