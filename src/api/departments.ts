// Departments API service
import { apiRequest, ENABLE_STUB_DATA } from './base';
import { Department, DepartmentCategory } from '../types/departments';

// Stub data
const stubDepartments: Department[] = [
  // Clinical Departments
  { id: 1, name: 'Medicine', category: 'Clinical', description: 'General medicine and internal medicine', specialisationDetails: 'General Medicine, Internal Medicine, Family Medicine', noOfDoctors: 12, status: 'active' },
  { id: 2, name: 'Pediatrics', category: 'Clinical', description: 'Child healthcare and pediatrics', specialisationDetails: 'Pediatric Care, Neonatology, Child Development', noOfDoctors: 8, status: 'active' },
  { id: 3, name: 'ENT', category: 'Clinical', description: 'Ear, Nose, and Throat department', specialisationDetails: 'Otolaryngology, Head and Neck Surgery', noOfDoctors: 5, status: 'active' },
  { id: 4, name: 'Dermatology', category: 'Clinical', description: 'Skin and dermatological conditions', specialisationDetails: 'Dermatology, Cosmetic Dermatology, Skin Surgery', noOfDoctors: 4, status: 'active' },
  { id: 5, name: 'Cardiology', category: 'Clinical', description: 'Heart and cardiovascular care', specialisationDetails: 'Cardiology, Interventional Cardiology, Cardiac Rehabilitation', noOfDoctors: 10, status: 'active' },
  { id: 6, name: 'Neurology', category: 'Clinical', description: 'Brain and nervous system disorders', specialisationDetails: 'Neurology, Neurophysiology, Stroke Care', noOfDoctors: 7, status: 'active' },
  
  // Surgical Departments
  { id: 7, name: 'General Surgery', category: 'Surgical', description: 'General surgical procedures', specialisationDetails: 'General Surgery, Laparoscopic Surgery, Trauma Surgery', noOfDoctors: 15, status: 'active' },
  { id: 8, name: 'Orthopedics', category: 'Surgical', description: 'Bone and joint surgery', specialisationDetails: 'Orthopedic Surgery, Joint Replacement, Sports Medicine', noOfDoctors: 12, status: 'active' },
  { id: 9, name: 'Neurosurgery', category: 'Surgical', description: 'Brain and spine surgery', specialisationDetails: 'Neurosurgery, Spine Surgery, Neuro-oncology', noOfDoctors: 6, status: 'active' },
  { id: 10, name: 'Cardiac Surgery', category: 'Surgical', description: 'Heart surgery and procedures', specialisationDetails: 'Cardiac Surgery, Heart Transplant, Vascular Surgery', noOfDoctors: 8, status: 'active' },
  
  // Diagnostic Departments
  { id: 11, name: 'Radiology', category: 'Diagnostic', description: 'Medical imaging and radiology', specialisationDetails: 'Radiology, CT Scan, MRI, Ultrasound, X-Ray', noOfDoctors: 9, status: 'active' },
  { id: 12, name: 'Laboratory', category: 'Diagnostic', description: 'Clinical laboratory and pathology', specialisationDetails: 'Pathology, Clinical Chemistry, Hematology, Microbiology', noOfDoctors: 11, status: 'active' },
  
  // Support Departments
  { id: 13, name: 'Pharmacy', category: 'Support', description: 'Pharmacy and medication dispensing', specialisationDetails: 'Pharmacy Services, Medication Management, Clinical Pharmacy', noOfDoctors: 3, status: 'active' },
  { id: 14, name: 'Emergency', category: 'Support', description: 'Emergency and trauma care', specialisationDetails: 'Emergency Medicine, Trauma Care, Critical Care', noOfDoctors: 20, status: 'active' },
  
  // Administrative Departments
  { id: 15, name: 'Administration', category: 'Administrative', description: 'Hospital administration', specialisationDetails: 'Hospital Administration, Management, Operations', noOfDoctors: 0, status: 'active' },
  { id: 16, name: 'Front Desk', category: 'Administrative', description: 'Front desk and reception', specialisationDetails: 'Patient Registration, Reception Services, Appointment Scheduling', noOfDoctors: 0, status: 'active' },
  { id: 17, name: 'Gastroenterology', category: 'Clinical', description: 'Digestive system and liver disorders', specialisationDetails: 'Gastroenterology, Hepatology, Endoscopy', noOfDoctors: 6, status: 'active' },
  { id: 18, name: 'Endocrinology', category: 'Clinical', description: 'Hormone and metabolic disorders', specialisationDetails: 'Diabetes, Thyroid, Metabolic Disorders', noOfDoctors: 5, status: 'active' },
  { id: 19, name: 'Pulmonology', category: 'Clinical', description: 'Respiratory system and lung diseases', specialisationDetails: 'Pulmonology, Sleep Medicine, Critical Care', noOfDoctors: 8, status: 'active' },
  { id: 20, name: 'Rheumatology', category: 'Clinical', description: 'Joint and autoimmune diseases', specialisationDetails: 'Rheumatology, Arthritis, Autoimmune Disorders', noOfDoctors: 4, status: 'active' },
  { id: 21, name: 'Nephrology', category: 'Clinical', description: 'Kidney diseases and dialysis', specialisationDetails: 'Nephrology, Dialysis, Kidney Transplant', noOfDoctors: 6, status: 'active' },
  { id: 22, name: 'Hematology', category: 'Clinical', description: 'Blood disorders and cancers', specialisationDetails: 'Hematology, Oncology, Blood Transfusion', noOfDoctors: 7, status: 'active' },
  { id: 23, name: 'Oncology', category: 'Clinical', description: 'Cancer treatment and care', specialisationDetails: 'Medical Oncology, Radiation Oncology, Chemotherapy', noOfDoctors: 9, status: 'active' },
  { id: 24, name: 'Psychiatry', category: 'Clinical', description: 'Mental health and behavioral disorders', specialisationDetails: 'Psychiatry, Counseling, Mental Health', noOfDoctors: 8, status: 'active' },
  { id: 25, name: 'Urology', category: 'Clinical', description: 'Urinary tract and male reproductive system', specialisationDetails: 'Urology, Urologic Surgery, Andrology', noOfDoctors: 6, status: 'active' },
  { id: 26, name: 'Plastic Surgery', category: 'Surgical', description: 'Reconstructive and cosmetic surgery', specialisationDetails: 'Plastic Surgery, Reconstructive Surgery, Cosmetic Surgery', noOfDoctors: 5, status: 'active' },
  { id: 27, name: 'Vascular Surgery', category: 'Surgical', description: 'Blood vessel surgery', specialisationDetails: 'Vascular Surgery, Endovascular Procedures', noOfDoctors: 4, status: 'active' },
  { id: 28, name: 'Thoracic Surgery', category: 'Surgical', description: 'Chest and lung surgery', specialisationDetails: 'Thoracic Surgery, Lung Surgery, Esophageal Surgery', noOfDoctors: 5, status: 'active' },
  { id: 29, name: 'Ophthalmology', category: 'Surgical', description: 'Eye surgery and care', specialisationDetails: 'Ophthalmology, Eye Surgery, Retina, Cornea', noOfDoctors: 7, status: 'active' },
  { id: 30, name: 'Gynecology', category: 'Surgical', description: 'Women reproductive health and surgery', specialisationDetails: 'Gynecology, Obstetrics, Gynecologic Surgery', noOfDoctors: 10, status: 'active' },
  { id: 31, name: 'Nuclear Medicine', category: 'Diagnostic', description: 'Nuclear imaging and therapy', specialisationDetails: 'Nuclear Medicine, PET Scan, Radionuclide Therapy', noOfDoctors: 4, status: 'active' },
  { id: 32, name: 'Anesthesiology', category: 'Support', description: 'Anesthesia and pain management', specialisationDetails: 'Anesthesiology, Pain Management, Critical Care', noOfDoctors: 12, status: 'active' },
  { id: 33, name: 'Physiotherapy', category: 'Support', description: 'Physical therapy and rehabilitation', specialisationDetails: 'Physiotherapy, Rehabilitation, Sports Medicine', noOfDoctors: 8, status: 'active' },
  { id: 34, name: 'Nutrition', category: 'Support', description: 'Nutritional counseling and dietetics', specialisationDetails: 'Clinical Nutrition, Dietetics, Nutritional Counseling', noOfDoctors: 5, status: 'active' },
  { id: 35, name: 'Medical Records', category: 'Administrative', description: 'Medical records and documentation', specialisationDetails: 'Medical Records Management, Documentation, Health Information', noOfDoctors: 0, status: 'active' },
  { id: 36, name: 'IT Services', category: 'Administrative', description: 'Information technology and systems', specialisationDetails: 'IT Support, Hospital Information Systems, Network Management', noOfDoctors: 0, status: 'active' },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
      // If stub data is disabled and API fails, throw the error
      if (!ENABLE_STUB_DATA) {
        throw error;
      }
    }
    
    // Append stub data if enabled
    if (ENABLE_STUB_DATA) {
      // Filter out stub data that might conflict with API data (by ID)
      const apiIds = new Set(apiData.map(dept => dept.id));
      const uniqueStubData = stubDepartments.filter(dept => !apiIds.has(dept.id));
      
      if (uniqueStubData.length > 0) {
        console.log(`Appending ${uniqueStubData.length} stub departments to ${apiData.length} API records`);
      }
      
      // If API returned no data, use stub data as fallback
      if (apiData.length === 0) {
        console.warn('No departments data received from API, using stub data');
        await delay(300);
        return [...stubDepartments];
      }
      
      // Combine API data with stub data
      return [...apiData, ...uniqueStubData];
    }
    
    // Return only API data if stub data is disabled
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

