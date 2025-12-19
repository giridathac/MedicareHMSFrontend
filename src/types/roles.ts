// Role types and interfaces

export type RoleName = string; // Role name is now a free text field

// Backend DTO structure
export interface RoleDto {
  RoleId: string; // uuid
  RoleName: string;
  RoleDescription: string | null;
  CreatedAt: string; // timestamp
  CreatedBy: number | null;
}

// Frontend Role interface (mapped from backend)
export interface Role {  
  id: string; // mapped from RoleId (uuid)
  name: string; // mapped from RoleName
  description?: string | null; // mapped from RoleDescription
  permissions?: string[]; // Not in backend response, will be empty initially
  createdAt?: string; // mapped from CreatedAt
  createdBy?: number | null; // mapped from CreatedBy
  updatedAt?: string; // Not in backend response
  isSuperAdmin?: boolean; // Not in backend response, computed if needed
}

