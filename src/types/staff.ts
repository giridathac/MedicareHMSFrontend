// Staff types and interfaces

export interface Staff {
  UserId?: number;
  RoleId: string; // UUID
  UserName: string;
  Password?: string; // Not returned in GET, only for POST
  PhoneNo?: string;
  EmailId?: string;
  DoctorDepartmentId?: string; // UUID, only for doctors
  DoctorQualification?: string; // Only for doctors
  DoctorType?: 'INHOUSE' | 'VISITING'; // Only for doctors
  DoctorOPDCharge?: number; // Only for doctors
  DoctorSurgeryCharge?: number; // Only for doctors
  OPDConsultation?: 'Yes' | 'No'; // Only for doctors
  IPDVisit?: 'Yes' | 'No'; // Only for doctors
  OTHandle?: 'Yes' | 'No'; // Only for doctors
  ICUVisits?: 'Yes' | 'No'; // Only for doctors
  Status?: 'Active' | 'InActive';
  CreatedBy?: number;
}

export interface CreateUserDto {
  RoleId: string; // UUID, required
  UserName: string; // required
  Password: string; // required
  PhoneNo?: string;
  EmailId?: string;
  DoctorDepartmentId?: string; // UUID, optional, only for doctors
  DoctorQualification?: string; // optional, only for doctors
  DoctorType?: 'INHOUSE' | 'VISITING'; // optional, only for doctors
  DoctorOPDCharge?: number; // optional, only for doctors
  DoctorSurgeryCharge?: number; // optional, only for doctors
  OPDConsultation?: 'Yes' | 'No'; // optional, only for doctors
  IPDVisit?: 'Yes' | 'No'; // optional, only for doctors
  OTHandle?: 'Yes' | 'No'; // optional, only for doctors
  ICUVisits?: 'Yes' | 'No'; // optional, only for doctors
  Status?: 'Active' | 'InActive'; // defaults to "Active"
  CreatedBy?: number;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {
  UserId: number;
}

