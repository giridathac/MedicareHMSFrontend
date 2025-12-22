// Departments API service
import { apiRequest } from './base';
import { Department, DepartmentCategory } from '../types/departments';

// Frontend DTO (what the component uses)
export interface CreateDepartmentDto {
  name: string;
  category: DepartmentCategory;
  description?: string;
  specialisationDetails?: string;
  noOfDoctors?: number;
  status?: 'active' | 'inactive';
}

// Backend request DTO (what the API expects)
export interface CreateDepartmentRequestDto {
  DepartmentName: string;
  DepartmentCategory?: string;
  SpecialisationDetails?: string;
  NoOfDoctors?: number;
  Status?: string;
  CreatedBy?: number;
}

// Backend response DTO (what the API returns)
export interface DepartmentDto {
  DoctorDepartmentId: number; // Changed from DepartmentId to DoctorDepartmentId
  DepartmentName: string;
  DepartmentCategory: string;
  Description?: string | null;
  SpecialisationDetails?: string | null;
  NoOfDoctors?: number;
  Status: string;
  CreatedAt?: string;
  CreatedBy?: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Backend update request DTO
export interface UpdateDepartmentRequestDto {
  DepartmentName?: string;
  DepartmentCategory?: string;
  Description?: string;
  SpecialisationDetails?: string;
  NoOfDoctors?: number;
  Status?: string;
}

export interface GetDepartmentsResponse {
  success: boolean;
  count?: number;
  data: DepartmentDto[];
}

export interface GetDepartmentResponse {
  success: boolean;
  data: DepartmentDto;
}

export interface UpdateDepartmentDto extends Partial<CreateDepartmentDto> {
  id: number;
}

// Helper function to map backend DTO to frontend Department
function mapDepartmentDtoToDepartment(dto: DepartmentDto): Department {
  const mapped = {
    id: dto.DoctorDepartmentId, // Changed from DepartmentId to DoctorDepartmentId
    name: dto.DepartmentName,
    category: dto.DepartmentCategory as DepartmentCategory,
    description: dto.Description || undefined,
    specialisationDetails: dto.SpecialisationDetails || undefined,
    noOfDoctors: dto.NoOfDoctors,
    status: dto.Status.toLowerCase() === 'active' ? 'active' : 'inactive',
  };
  return mapped;
}

export const departmentsApi = {
  async getAll(): Promise<Department[]> {
    let apiData: Department[] = [];
    
    try {
      console.log('departmentsApi.getAll() - Calling /api/doctor-departments');
      const response = await apiRequest<GetDepartmentsResponse>('/doctor-departments', {
        method: 'GET',
      });
      console.log('departmentsApi.getAll() - Response received:', response);

      if (response.success && response.data) {
        apiData = response.data.map(mapDepartmentDtoToDepartment);
      }
    } catch (error) {
      console.error('Error fetching departments from /api/doctor-departments:', error);
      throw error;
    }
    
    return apiData;
  },

  async getByCategory(category: DepartmentCategory): Promise<Department[]> {
    const response = await apiRequest<GetDepartmentsResponse>(`/doctor-departments?category=${category}`, {
      method: 'GET',
    });

    if (!response.success) {
      throw new Error('Failed to fetch departments by category');
    }

    return response.data.map(mapDepartmentDtoToDepartment);
  },

  async getById(id: number): Promise<Department> {
    const response = await apiRequest<GetDepartmentResponse>(`/doctor-departments/${id}`, {
      method: 'GET',
    });

    if (!response.success) {
      throw new Error('Failed to fetch department');
    }

    return mapDepartmentDtoToDepartment(response.data);
  },

  async create(data: CreateDepartmentDto): Promise<Department> {
    // Map frontend DTO to backend DTO
    const requestBody: CreateDepartmentRequestDto = {
      DepartmentName: data.name,
      DepartmentCategory: data.category,
      SpecialisationDetails: data.specialisationDetails,
      NoOfDoctors: data.noOfDoctors,
      Status: data.status === 'active' ? 'Active' : 'Inactive',
      // CreatedBy can be added later if user context is available
    };

    const response = await apiRequest<ApiResponse<DepartmentDto>>('/doctor-departments', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to create department');
    }

    // Map backend DTO to frontend Department interface
    return mapDepartmentDtoToDepartment(response.data);
  },

  async update(data: UpdateDepartmentDto): Promise<Department> {
    const { id, ...updateData } = data;
    
    // Map frontend DTO to backend DTO (only include fields that are present)
    const requestBody: UpdateDepartmentRequestDto = {};
    if (updateData.name !== undefined) {
      requestBody.DepartmentName = updateData.name;
    }
    if (updateData.category !== undefined) {
      requestBody.DepartmentCategory = updateData.category;
    }
    // Always include description field in update request (backend needs it to update)
    // Send null for empty/undefined descriptions, trimmed string otherwise
    if (updateData.description !== undefined) {
      requestBody.Description = (updateData.description && updateData.description.trim() !== '') 
        ? updateData.description.trim() 
        : null;
    }
    // Note: If description is undefined, we don't include it (partial update)
    // But if it's explicitly provided (even as empty string), we include it
    if (updateData.specialisationDetails !== undefined) {
      requestBody.SpecialisationDetails = updateData.specialisationDetails;
    }
    if (updateData.noOfDoctors !== undefined) {
      requestBody.NoOfDoctors = updateData.noOfDoctors;
    }
    if (updateData.status !== undefined) {
      requestBody.Status = updateData.status === 'active' ? 'Active' : 'Inactive';
    }

    console.log('Updating department with data:', JSON.stringify(requestBody, null, 2));
    console.log('Description value being sent:', requestBody.Description);
    console.log('Full request body:', requestBody);

    const response = await apiRequest<ApiResponse<DepartmentDto>>(`/doctor-departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to update department');
    }

    return mapDepartmentDtoToDepartment(response.data);
  },

  async delete(id: number): Promise<void> {
    const response = await apiRequest<ApiResponse<DepartmentDto>>(`/doctor-departments/${id}`, {
      method: 'DELETE',
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete department');
    }

    // DELETE endpoint returns the deleted department in response.data, but we don't need it
    return;
  },
};

