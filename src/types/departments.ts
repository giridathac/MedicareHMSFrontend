// Department types and interfaces

export type DepartmentCategory = 'Clinical' | 'Surgical' | 'Diagnostic' | 'Support' | 'Administrative';

export interface Department {
  id: number;
  name: string;
  category: DepartmentCategory;
  description?: string;
  specialisationDetails?: string;
  noOfDoctors?: number;
  status: 'active' | 'inactive';
}

