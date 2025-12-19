// Roles API service
import { apiRequest, ENABLE_STUB_DATA } from './base';
import { Role, RoleName, RoleDto } from '../types/roles';

// Default roles
const defaultRoles: RoleName[] = [
  'Superadmin',
  'Frontdeskadmin',
  'Doctorinhouse',
  'Doctorconsulting',
  'Surgeon',
  'Labadmin',
  'Icuadmin',
  'Otadmin',
  'Nurse',
  'Pharmacyadmin',
];

// Stub data (for fallback/testing only - will be replaced by API)
const stubRoles: Role[] = defaultRoles.map((name, index) => ({
  id: `stub-${index + 1}`,
  name,
  description: getDefaultDescription(name),
  permissions: getDefaultPermissions(name),
  createdAt: new Date(2024, 0, 1).toISOString(),
  updatedAt: new Date(2024, 0, 1).toISOString(),
  isSuperAdmin: name.toLowerCase() === 'superadmin',
}));

function getDefaultDescription(name: RoleName): string {
  const descriptions: Record<string, string> = {
    'Superadmin': 'Full administrative access to all hospital systems and data (Super Administrator)',
    'Frontdeskadmin': 'Manage front desk operations, patient registration, and token generation',
    'Doctorinhouse': 'Inhouse doctor with access to patient consultations and medical records',
    'Doctorconsulting': 'Consulting doctor with access to patient consultations',
    'Surgeon': 'Surgeon with access to OT management and surgical procedures',
    'Labadmin': 'Manage laboratory operations, test orders, and results',
    'Icuadmin': 'Manage ICU operations, patient monitoring, and critical care',
    'Otadmin': 'Manage operation theater scheduling, surgeries, and OT resources',
    'Nurse': 'Nursing staff with access to patient care and monitoring',
    'Pharmacyadmin': 'Manage pharmacy operations, medicine inventory, and prescriptions',
  };
  return descriptions[name] || '';
}

function getDefaultPermissions(name: RoleName): string[] {
  const permissions: Record<string, string[]> = {
    'Superadmin': ['all'],
    'Frontdeskadmin': ['frontdesk', 'patients', 'tokens', 'appointments'],
    'Doctorinhouse': ['consultations', 'patients', 'prescriptions', 'lab-orders'],
    'Doctorconsulting': ['consultations', 'patients', 'prescriptions'],
    'Surgeon': ['ot-management', 'surgeries', 'patients', 'consultations'],
    'Labadmin': ['laboratory', 'tests', 'results', 'reports'],
    'Icuadmin': ['icu-management', 'patients', 'monitoring', 'reports'],
    'Otadmin': ['ot-management', 'surgeries', 'scheduling', 'resources'],
    'Nurse': ['patient-care', 'vitals', 'medications', 'reports'],
    'Pharmacyadmin': ['pharmacy', 'inventory', 'prescriptions', 'dispensing'],
  };
  return permissions[name] || [];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface CreateRoleDto {
  RoleName: string; // Required - must be unique
  RoleDescription?: string; // Optional
  CreatedBy?: number; // Optional - User ID who created this role
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {
  id: string; // uuid from backend
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface GetRoleResponse {
  success: boolean;
  data: RoleDto;
}

export interface GetRolesResponse {
  success: boolean;
  count: number;
  data: RoleDto[];
}

export const rolesApi = {
  async getAll(): Promise<Role[]> {
    let apiData: Role[] = [];
    
    try {
      const response = await apiRequest<GetRolesResponse>('/roles', {
        method: 'GET',
      });
      
      if (response.success && response.data) {
        // Map backend DTO to frontend Role interface
        apiData = response.data.map((roleDto: RoleDto) => ({
          id: roleDto.RoleId,
          name: roleDto.RoleName,
          description: roleDto.RoleDescription,
          permissions: [], // Permissions not in response, will be empty initially
          createdAt: roleDto.CreatedAt,
          createdBy: roleDto.CreatedBy,
          updatedAt: undefined, // Not in backend response
          isSuperAdmin: roleDto.RoleName.toLowerCase() === 'superadmin', // Compute based on name
        }));
      }
    } catch (error) {
      console.error('Error fetching roles from /api/roles:', error);
      // If stub data is disabled and API fails, throw the error
      if (!ENABLE_STUB_DATA) {
        throw error;
      }
    }
    
    // Append stub data if enabled
    if (ENABLE_STUB_DATA) {
      // Filter out stub data that might conflict with API data (by ID)
      const apiIds = new Set(apiData.map(role => role.id));
      const uniqueStubData = stubRoles.filter(role => !apiIds.has(role.id));
      
      if (uniqueStubData.length > 0) {
        console.log(`Appending ${uniqueStubData.length} stub roles to ${apiData.length} API records`);
      }
      
      // If API returned no data, use stub data as fallback
      if (apiData.length === 0) {
        console.warn('No roles data received from API, using stub data');
        await delay(300);
        return [...stubRoles];
      }
      
      // Combine API data with stub data
      return [...apiData, ...uniqueStubData];
    }
    
    // Return only API data if stub data is disabled
    return apiData;
  },

  async getById(id: string): Promise<Role> {
    const response = await apiRequest<GetRoleResponse>(`/roles/${id}`, {
      method: 'GET',
    });
    
    if (!response.success) {
      throw new Error('Failed to fetch role');
    }
    
    // Map backend DTO to frontend Role interface
    const roleDto = response.data;
    return {
      id: roleDto.RoleId,
      name: roleDto.RoleName,
      description: roleDto.RoleDescription,
      permissions: [],
      createdAt: roleDto.CreatedAt,
      createdBy: roleDto.CreatedBy,
      updatedAt: undefined,
      isSuperAdmin: roleDto.RoleName.toLowerCase() === 'superadmin',
    };
  },

  async create(data: CreateRoleDto): Promise<Role> {
    const response = await apiRequest<ApiResponse<RoleDto>>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to create role');
    }
    
    // Map backend DTO to frontend Role interface
    const roleDto = response.data as RoleDto;
    return {
      id: roleDto.RoleId,
      name: roleDto.RoleName,
      description: roleDto.RoleDescription,
      permissions: [],
      createdAt: roleDto.CreatedAt,
      createdBy: roleDto.CreatedBy,
      updatedAt: undefined,
      isSuperAdmin: roleDto.RoleName.toLowerCase() === 'superadmin',
    };
  },

  async update(data: UpdateRoleDto): Promise<Role> {
    const { id, ...updateData } = data;
    // Only include fields that are present (all optional in request body)
    const requestBody: Partial<{ RoleName: string; RoleDescription: string }> = {};
    if (updateData.RoleName !== undefined) {
      requestBody.RoleName = updateData.RoleName;
    }
    if (updateData.RoleDescription !== undefined) {
      requestBody.RoleDescription = updateData.RoleDescription;
    }
    
    const response = await apiRequest<ApiResponse<RoleDto>>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(requestBody),
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to update role');
    }
    
    // Map backend DTO to frontend Role interface
    const roleDto = response.data;
    return {
      id: roleDto.RoleId,
      name: roleDto.RoleName,
      description: roleDto.RoleDescription,
      permissions: [],
      createdAt: roleDto.CreatedAt,
      createdBy: roleDto.CreatedBy,
      updatedAt: undefined,
      isSuperAdmin: roleDto.RoleName.toLowerCase() === 'superadmin',
    };
  },

  async delete(id: string): Promise<void> {
    const response = await apiRequest<ApiResponse<RoleDto>>(`/roles/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete role');
    }
    
    // DELETE endpoint returns the deleted role in response.data, but we don't need it
    return;
  },
};

