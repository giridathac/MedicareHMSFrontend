// Staff API service
import { apiRequest, ENABLE_STUB_DATA } from './base';
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

// Stub data for doctors (staff with doctor/surgeon roles)
// Role IDs match stub roles: 'stub-3' = Doctorinhouse, 'stub-4' = Doctorconsulting, 'stub-5' = Surgeon
const stubDoctors: Staff[] = [
  {
    UserId: 1001,
    RoleId: 'stub-3', // Doctorinhouse
    UserName: 'Dr. Sarah Johnson',
    PhoneNo: '+1-555-0101',
    EmailId: 'sarah.johnson@hospital.com',
    DoctorDepartmentId: '5', // Cardiology
    DoctorQualification: 'MD, DM Cardiology',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 1500,
    DoctorSurgeryCharge: 50000,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'Yes',
    ICUVisits: 'Yes',
    Status: 'Active',
  },
  {
    UserId: 1002,
    RoleId: 'stub-5', // Surgeon
    UserName: 'Dr. Michael Chen',
    PhoneNo: '+1-555-0102',
    EmailId: 'michael.chen@hospital.com',
    DoctorDepartmentId: '8', // Orthopedics
    DoctorQualification: 'MS Orthopedics, DNB',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 2000,
    DoctorSurgeryCharge: 75000,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'Yes',
    ICUVisits: 'No',
    Status: 'Active',
  },
  {
    UserId: 1003,
    RoleId: 'stub-4', // Doctorconsulting
    UserName: 'Dr. James Miller',
    PhoneNo: '+1-555-0103',
    EmailId: 'james.miller@hospital.com',
    DoctorDepartmentId: '6', // Neurology
    DoctorQualification: 'MD, DM Neurology',
    DoctorType: 'VISITING',
    DoctorOPDCharge: 1800,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'No',
    ICUVisits: 'Yes',
    Status: 'Active',
  },
  {
    UserId: 1004,
    RoleId: 'stub-3', // Doctorinhouse
    UserName: 'Dr. Emily Davis',
    PhoneNo: '+1-555-0104',
    EmailId: 'emily.davis@hospital.com',
    DoctorDepartmentId: '1', // Medicine
    DoctorQualification: 'MD General Medicine',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 1200,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'No',
    ICUVisits: 'Yes',
    Status: 'Active',
  },
  {
    UserId: 1005,
    RoleId: 'stub-3', // Doctorinhouse
    UserName: 'Dr. Robert Lee',
    PhoneNo: '+1-555-0105',
    EmailId: 'robert.lee@hospital.com',
    DoctorDepartmentId: '2', // Pediatrics
    DoctorQualification: 'MD Pediatrics, DCH',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 1300,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'No',
    ICUVisits: 'Yes',
    Status: 'Active',
  },
  {
    UserId: 1006,
    RoleId: 'stub-5', // Surgeon
    UserName: 'Dr. Maria Garcia',
    PhoneNo: '+1-555-0106',
    EmailId: 'maria.garcia@hospital.com',
    DoctorDepartmentId: '30', // Gynecology
    DoctorQualification: 'MS Obstetrics & Gynecology',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 1600,
    DoctorSurgeryCharge: 60000,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'Yes',
    ICUVisits: 'No',
    Status: 'Active',
  },
  {
    UserId: 1007,
    RoleId: 'stub-4', // Doctorconsulting
    UserName: 'Dr. David Wilson',
    PhoneNo: '+1-555-0107',
    EmailId: 'david.wilson@hospital.com',
    DoctorDepartmentId: '4', // Dermatology
    DoctorQualification: 'MD Dermatology',
    DoctorType: 'VISITING',
    DoctorOPDCharge: 1400,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'No',
    OTHandle: 'No',
    ICUVisits: 'No',
    Status: 'Active',
  },
  {
    UserId: 1008,
    RoleId: 'stub-3', // Doctorinhouse
    UserName: 'Dr. Jennifer Martinez',
    PhoneNo: '+1-555-0108',
    EmailId: 'jennifer.martinez@hospital.com',
    DoctorDepartmentId: '23', // Oncology
    DoctorQualification: 'MD, DM Medical Oncology',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 2000,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'No',
    ICUVisits: 'Yes',
    Status: 'Active',
  },
  {
    UserId: 1009,
    RoleId: 'stub-5', // Surgeon
    UserName: 'Dr. Christopher Brown',
    PhoneNo: '+1-555-0109',
    EmailId: 'christopher.brown@hospital.com',
    DoctorDepartmentId: '25', // Urology
    DoctorQualification: 'MS Urology, MCh',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 1700,
    DoctorSurgeryCharge: 55000,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'Yes',
    ICUVisits: 'No',
    Status: 'Active',
  },
  {
    UserId: 1010,
    RoleId: 'stub-4', // Doctorconsulting
    UserName: 'Dr. Amanda White',
    PhoneNo: '+1-555-0110',
    EmailId: 'amanda.white@hospital.com',
    DoctorDepartmentId: '24', // Psychiatry
    DoctorQualification: 'MD Psychiatry',
    DoctorType: 'VISITING',
    DoctorOPDCharge: 1500,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'No',
    ICUVisits: 'No',
    Status: 'Active',
  },
  {
    UserId: 1011,
    RoleId: 'stub-3', // Doctorinhouse
    UserName: 'Dr. Daniel Harris',
    PhoneNo: '+1-555-0111',
    EmailId: 'daniel.harris@hospital.com',
    DoctorDepartmentId: '17', // Gastroenterology
    DoctorQualification: 'MD, DM Gastroenterology',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 1800,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'No',
    ICUVisits: 'Yes',
    Status: 'Active',
  },
  {
    UserId: 1012,
    RoleId: 'stub-3', // Doctorinhouse
    UserName: 'Dr. Lauren Clark',
    PhoneNo: '+1-555-0112',
    EmailId: 'lauren.clark@hospital.com',
    DoctorDepartmentId: '18', // Endocrinology
    DoctorQualification: 'MD, DM Endocrinology',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 1600,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'No',
    ICUVisits: 'No',
    Status: 'Active',
  },
  {
    UserId: 1013,
    RoleId: 'stub-4', // Doctorconsulting
    UserName: 'Dr. Ryan Lewis',
    PhoneNo: '+1-555-0113',
    EmailId: 'ryan.lewis@hospital.com',
    DoctorDepartmentId: '19', // Pulmonology
    DoctorQualification: 'MD, DM Pulmonology',
    DoctorType: 'VISITING',
    DoctorOPDCharge: 1700,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'No',
    ICUVisits: 'Yes',
    Status: 'Active',
  },
  {
    UserId: 1014,
    RoleId: 'stub-3', // Doctorinhouse
    UserName: 'Dr. Nicole Walker',
    PhoneNo: '+1-555-0114',
    EmailId: 'nicole.walker@hospital.com',
    DoctorDepartmentId: '20', // Rheumatology
    DoctorQualification: 'MD, DM Rheumatology',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 1500,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'No',
    ICUVisits: 'No',
    Status: 'Active',
  },
  {
    UserId: 1015,
    RoleId: 'stub-3', // Doctorinhouse
    UserName: 'Dr. Kevin Allen',
    PhoneNo: '+1-555-0115',
    EmailId: 'kevin.allen@hospital.com',
    DoctorDepartmentId: '21', // Nephrology
    DoctorQualification: 'MD, DM Nephrology',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 1800,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'No',
    ICUVisits: 'Yes',
    Status: 'Active',
  },
  {
    UserId: 1016,
    RoleId: 'stub-4', // Doctorconsulting
    UserName: 'Dr. Samantha Young',
    PhoneNo: '+1-555-0116',
    EmailId: 'samantha.young@hospital.com',
    DoctorDepartmentId: '22', // Hematology
    DoctorQualification: 'MD, DM Hematology',
    DoctorType: 'VISITING',
    DoctorOPDCharge: 2000,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'No',
    ICUVisits: 'Yes',
    Status: 'Active',
  },
  {
    UserId: 1017,
    RoleId: 'stub-3', // Doctorinhouse
    UserName: 'Dr. Brandon King',
    PhoneNo: '+1-555-0117',
    EmailId: 'brandon.king@hospital.com',
    DoctorDepartmentId: '14', // Emergency
    DoctorQualification: 'MD Emergency Medicine',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 1500,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'No',
    ICUVisits: 'Yes',
    Status: 'Active',
  },
  {
    UserId: 1018,
    RoleId: 'stub-5', // Surgeon
    UserName: 'Dr. Justin Lopez',
    PhoneNo: '+1-555-0118',
    EmailId: 'justin.lopez@hospital.com',
    DoctorDepartmentId: '10', // Cardiac Surgery
    DoctorQualification: 'MS Cardiac Surgery, MCh',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 2500,
    DoctorSurgeryCharge: 100000,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'Yes',
    ICUVisits: 'Yes',
    Status: 'Active',
  },
  {
    UserId: 1019,
    RoleId: 'stub-5', // Surgeon
    UserName: 'Dr. Michelle Hill',
    PhoneNo: '+1-555-0119',
    EmailId: 'michelle.hill@hospital.com',
    DoctorDepartmentId: '26', // Plastic Surgery
    DoctorQualification: 'MS Plastic Surgery, MCh',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 2200,
    DoctorSurgeryCharge: 80000,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'Yes',
    ICUVisits: 'No',
    Status: 'Active',
  },
  {
    UserId: 1020,
    RoleId: 'stub-5', // Surgeon
    UserName: 'Dr. Tyler Scott',
    PhoneNo: '+1-555-0120',
    EmailId: 'tyler.scott@hospital.com',
    DoctorDepartmentId: '27', // Vascular Surgery
    DoctorQualification: 'MS Vascular Surgery, MCh',
    DoctorType: 'VISITING',
    DoctorOPDCharge: 2300,
    DoctorSurgeryCharge: 90000,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'Yes',
    ICUVisits: 'No',
    Status: 'Active',
  },
  {
    UserId: 1021,
    RoleId: 'stub-5', // Surgeon
    UserName: 'Dr. Stephanie Green',
    PhoneNo: '+1-555-0121',
    EmailId: 'stephanie.green@hospital.com',
    DoctorDepartmentId: '28', // Thoracic Surgery
    DoctorQualification: 'MS Thoracic Surgery, MCh',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 2400,
    DoctorSurgeryCharge: 95000,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'Yes',
    ICUVisits: 'Yes',
    Status: 'Active',
  },
  {
    UserId: 1022,
    RoleId: 'stub-5', // Surgeon
    UserName: 'Dr. Eric Adams',
    PhoneNo: '+1-555-0122',
    EmailId: 'eric.adams@hospital.com',
    DoctorDepartmentId: '29', // Ophthalmology
    DoctorQualification: 'MS Ophthalmology, DNB',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 1800,
    DoctorSurgeryCharge: 45000,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'Yes',
    ICUVisits: 'No',
    Status: 'Active',
  },
  {
    UserId: 1023,
    RoleId: 'stub-3', // Doctorinhouse
    UserName: 'Dr. Melissa Baker',
    PhoneNo: '+1-555-0123',
    EmailId: 'melissa.baker@hospital.com',
    DoctorDepartmentId: '32', // Anesthesiology
    DoctorQualification: 'MD Anesthesiology, DA',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 1600,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'No',
    IPDVisit: 'Yes',
    OTHandle: 'Yes',
    ICUVisits: 'Yes',
    Status: 'Active',
  },
  {
    UserId: 1024,
    RoleId: 'stub-3', // Doctorinhouse
    UserName: 'Dr. Jason Nelson',
    PhoneNo: '+1-555-0124',
    EmailId: 'jason.nelson@hospital.com',
    DoctorDepartmentId: '14', // Emergency
    DoctorQualification: 'MD Emergency Medicine, DNB',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 1500,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'No',
    ICUVisits: 'Yes',
    Status: 'Active',
  },
  {
    UserId: 1025,
    RoleId: 'stub-3', // Doctorinhouse
    UserName: 'Dr. Ashley Carter',
    PhoneNo: '+1-555-0125',
    EmailId: 'ashley.carter@hospital.com',
    DoctorDepartmentId: '11', // Radiology
    DoctorQualification: 'MD Radiology, DNB',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 1700,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'No',
    ICUVisits: 'No',
    Status: 'Active',
  },
  {
    UserId: 1026,
    RoleId: 'stub-3', // Doctorinhouse
    UserName: 'Dr. Nathan Mitchell',
    PhoneNo: '+1-555-0126',
    EmailId: 'nathan.mitchell@hospital.com',
    DoctorDepartmentId: '12', // Laboratory
    DoctorQualification: 'MD Pathology, DNB',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 1500,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'No',
    ICUVisits: 'No',
    Status: 'Active',
  },
  {
    UserId: 1027,
    RoleId: 'stub-4', // Doctorconsulting
    UserName: 'Dr. Rachel Wright',
    PhoneNo: '+1-555-0127',
    EmailId: 'rachel.wright@hospital.com',
    DoctorDepartmentId: '3', // ENT
    DoctorQualification: 'MS ENT, DNB',
    DoctorType: 'VISITING',
    DoctorOPDCharge: 1600,
    DoctorSurgeryCharge: 0,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'No',
    ICUVisits: 'No',
    Status: 'InActive',
  },
  {
    UserId: 1028,
    RoleId: 'stub-5', // Surgeon
    UserName: 'Dr. Thomas Anderson',
    PhoneNo: '+1-555-0128',
    EmailId: 'thomas.anderson@hospital.com',
    DoctorDepartmentId: '9', // Neurosurgery
    DoctorQualification: 'MS Neurosurgery, MCh',
    DoctorType: 'INHOUSE',
    DoctorOPDCharge: 2600,
    DoctorSurgeryCharge: 120000,
    OPDConsultation: 'Yes',
    IPDVisit: 'Yes',
    OTHandle: 'Yes',
    ICUVisits: 'Yes',
    Status: 'Active',
  },
];

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
      // If stub data is disabled and API fails, throw the error
      if (!ENABLE_STUB_DATA) {
        throw error;
      }
    }
    
    // Append stub data if enabled
    if (ENABLE_STUB_DATA) {
      // Filter out stub data that might conflict with API data (by UserId)
      const apiIds = new Set(apiData.map(staff => staff.UserId).filter((id): id is number => id !== undefined));
      const uniqueStubData = stubDoctors.filter(doctor => !apiIds.has(doctor.UserId || 0));
      
      if (uniqueStubData.length > 0) {
        console.log(`Appending ${uniqueStubData.length} stub doctors to ${apiData.length} API records`);
      }
      
      // If API returned no data, use stub data as fallback
      if (apiData.length === 0) {
        console.warn('No staff data received from API, using stub data');
        await delay(300);
        return [...stubDoctors];
      }
      
      // Combine API data with stub data
      return [...apiData, ...uniqueStubData];
    }
    
    // Return only API data if stub data is disabled
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

