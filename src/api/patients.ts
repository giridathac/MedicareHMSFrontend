// Patient API service
import { apiRequest, ApiError, ENABLE_STUB_DATA } from './base';
import { Patient } from '../types';

// Stub data - replace with actual API calls
const stubPatients: Patient[] = [
  { id: 1, PatientId: 'PAT-2025-0001', PatientNo: 'P-001', PatientName: 'John', LastName: 'Smith', Age: 45, Gender: 'Male', PhoneNo: '9876543210', AdhaarId: '123456789012', PANCard: 'ABCDE1234F', Address: '123 Main St, City', ChiefComplaint: 'High blood pressure', Status: 'Active', RegisteredBy: 'Dr. Smith', RegisteredDate: '2025-01-15', PatientType: 'OPD' },
  { id: 2, PatientId: 'PAT-2025-0002', PatientNo: 'P-002', PatientName: 'Emma', LastName: 'Wilson', Age: 32, Gender: 'Female', PhoneNo: '9876543211', AdhaarId: '234567890123', PANCard: 'BCDEF2345G', Address: '456 Oak Ave, City', ChiefComplaint: 'Type 2 Diabetes', Status: 'Active', RegisteredBy: 'Dr. Johnson', RegisteredDate: '2025-01-16', PatientType: 'IPD' },
  { id: 3, PatientId: 'PAT-2025-0003', PatientNo: 'P-003', PatientName: 'Robert', LastName: 'Brown', Age: 58, Gender: 'Male', PhoneNo: '9876543212', AdhaarId: '345678901234', PANCard: 'CDEFG3456H', Address: '789 Pine Rd, City', ChiefComplaint: 'Shortness of breath', Status: 'Active', RegisteredBy: 'Dr. Williams', RegisteredDate: '2025-01-17', PatientType: 'OPD' },
  { id: 4, PatientId: 'PAT-2025-0004', PatientNo: 'P-004', PatientName: 'Lisa', LastName: 'Anderson', Age: 41, Gender: 'Female', PhoneNo: '9876543213', AdhaarId: '456789012345', PANCard: 'DEFGH4567I', Address: '321 Elm St, City', ChiefComplaint: 'Severe headaches', Status: 'Active', RegisteredBy: 'Dr. Brown', RegisteredDate: '2025-01-18', PatientType: 'Emergency' },
  { id: 5, PatientId: 'PAT-2025-0005', PatientNo: 'P-005', PatientName: 'David', LastName: 'Taylor', Age: 29, Gender: 'Male', PhoneNo: '9876543214', AdhaarId: '567890123456', PANCard: 'EFGHI5678J', Address: '654 Maple Dr, City', ChiefComplaint: 'Lower back pain', Status: 'Active', RegisteredBy: 'Dr. Davis', RegisteredDate: '2025-01-19', PatientType: 'OPD' },
  { id: 6, PatientId: 'PAT-2025-0006', PatientNo: 'P-006', PatientName: 'Sarah', LastName: 'Martinez', Age: 36, Gender: 'Female', PhoneNo: '9876543215', AdhaarId: '678901234567', PANCard: 'FGHIJ6789K', Address: '987 Cedar Ln, City', ChiefComplaint: 'Seasonal allergies', Status: 'Active', RegisteredBy: 'Dr. Miller', RegisteredDate: '2025-01-20', PatientType: 'Follow-up' },
  { id: 7, PatientId: 'PAT-2025-0007', PatientNo: 'P-007', PatientName: 'Michael', LastName: 'Chen', Age: 52, Gender: 'Male', PhoneNo: '9876543216', AdhaarId: '789012345678', PANCard: 'GHIJK7890L', Address: '147 Birch Way, City', ChiefComplaint: 'Joint pain and stiffness', Status: 'Active', RegisteredBy: 'Dr. Wilson', RegisteredDate: '2025-01-21', PatientType: 'IPD' },
  { id: 8, PatientId: 'PAT-2025-0008', PatientNo: 'P-008', PatientName: 'Priya', LastName: 'Patel', Age: 28, Gender: 'Female', PhoneNo: '9876543217', AdhaarId: '890123456789', PANCard: 'HIJKL8901M', Address: '258 Spruce St, City', ChiefComplaint: 'Fatigue and weakness', Status: 'Active', RegisteredBy: 'Dr. Anderson', RegisteredDate: '2025-01-22', PatientType: 'OPD' },
  { id: 9, PatientId: 'PAT-2025-0009', PatientNo: 'P-009', PatientName: 'James', LastName: 'Rodriguez', Age: 38, Gender: 'Male', PhoneNo: '9876543218', AdhaarId: '901234567890', PANCard: 'IJKLM9012N', Address: '369 Willow Ave, City', ChiefComplaint: 'Chest pain', Status: 'Active', RegisteredBy: 'Dr. Taylor', RegisteredDate: '2025-01-23', PatientType: 'Emergency' },
  { id: 10, PatientId: 'PAT-2025-0010', PatientNo: 'P-010', PatientName: 'Maria', LastName: 'Garcia', Age: 44, Gender: 'Female', PhoneNo: '9876543219', AdhaarId: '012345678901', PANCard: 'JKLMN0123O', Address: '741 Ash Blvd, City', ChiefComplaint: 'Weight gain and fatigue', Status: 'Active', RegisteredBy: 'Dr. Martinez', RegisteredDate: '2025-01-24', PatientType: 'Follow-up' },
  { id: 11, PatientId: 'PAT-2025-0011', PatientNo: 'P-011', PatientName: 'Thomas', LastName: 'Anderson', Age: 35, Gender: 'Male', PhoneNo: '9876543220', AdhaarId: '123456789012', PANCard: 'KLMNO1234P', Address: '852 Oak St, City', ChiefComplaint: 'Chronic cough', Status: 'Active', RegisteredBy: 'Dr. Johnson', RegisteredDate: '2025-01-25', PatientType: 'OPD' },
  { id: 12, PatientId: 'PAT-2025-0012', PatientNo: 'P-012', PatientName: 'Jennifer', LastName: 'White', Age: 29, Gender: 'Female', PhoneNo: '9876543221', AdhaarId: '234567890123', PANCard: 'LMNOP2345Q', Address: '963 Pine Ave, City', ChiefComplaint: 'Skin rash', Status: 'Active', RegisteredBy: 'Dr. Davis', RegisteredDate: '2025-01-26', PatientType: 'OPD' },
  { id: 13, PatientId: 'PAT-2025-0013', PatientNo: 'P-013', PatientName: 'Christopher', LastName: 'Harris', Age: 51, Gender: 'Male', PhoneNo: '9876543222', AdhaarId: '345678901234', PANCard: 'MNOPQ3456R', Address: '147 Elm Rd, City', ChiefComplaint: 'Chest discomfort', Status: 'Active', RegisteredBy: 'Dr. Wilson', RegisteredDate: '2025-01-27', PatientType: 'Emergency' },
  { id: 14, PatientId: 'PAT-2025-0014', PatientNo: 'P-014', PatientName: 'Amanda', LastName: 'Clark', Age: 38, Gender: 'Female', PhoneNo: '9876543223', AdhaarId: '456789012345', PANCard: 'NOPQR4567S', Address: '258 Maple Dr, City', ChiefComplaint: 'Abdominal pain', Status: 'Active', RegisteredBy: 'Dr. Brown', RegisteredDate: '2025-01-28', PatientType: 'IPD' },
  { id: 15, PatientId: 'PAT-2025-0015', PatientNo: 'P-015', PatientName: 'Daniel', LastName: 'Lewis', Age: 42, Gender: 'Male', PhoneNo: '9876543224', AdhaarId: '567890123456', PANCard: 'OPQRS5678T', Address: '369 Cedar Ln, City', ChiefComplaint: 'Fever and chills', Status: 'Active', RegisteredBy: 'Dr. Miller', RegisteredDate: '2025-01-29', PatientType: 'OPD' },
  { id: 16, PatientId: 'PAT-2025-0016', PatientNo: 'P-016', PatientName: 'Jessica', LastName: 'Walker', Age: 33, Gender: 'Female', PhoneNo: '9876543225', AdhaarId: '678901234567', PANCard: 'PQRST6789U', Address: '741 Birch Way, City', ChiefComplaint: 'Eye irritation', Status: 'Active', RegisteredBy: 'Dr. Taylor', RegisteredDate: '2025-01-30', PatientType: 'OPD' },
  { id: 17, PatientId: 'PAT-2025-0017', PatientNo: 'P-017', PatientName: 'Matthew', LastName: 'Hall', Age: 47, Gender: 'Male', PhoneNo: '9876543226', AdhaarId: '789012345678', PANCard: 'QRSTU7890V', Address: '852 Spruce St, City', ChiefComplaint: 'Joint swelling', Status: 'Active', RegisteredBy: 'Dr. Anderson', RegisteredDate: '2025-02-01', PatientType: 'Follow-up' },
  { id: 18, PatientId: 'PAT-2025-0018', PatientNo: 'P-018', PatientName: 'Lauren', LastName: 'Allen', Age: 26, Gender: 'Female', PhoneNo: '9876543227', AdhaarId: '890123456789', PANCard: 'RSTUV8901W', Address: '963 Willow Ave, City', ChiefComplaint: 'Nausea and vomiting', Status: 'Active', RegisteredBy: 'Dr. Martinez', RegisteredDate: '2025-02-02', PatientType: 'Emergency' },
  { id: 19, PatientId: 'PAT-2025-0019', PatientNo: 'P-019', PatientName: 'Ryan', LastName: 'Young', Age: 39, Gender: 'Male', PhoneNo: '9876543228', AdhaarId: '901234567890', PANCard: 'STUVW9012X', Address: '147 Ash Blvd, City', ChiefComplaint: 'Dizziness', Status: 'Active', RegisteredBy: 'Dr. Johnson', RegisteredDate: '2025-02-03', PatientType: 'OPD' },
  { id: 20, PatientId: 'PAT-2025-0020', PatientNo: 'P-020', PatientName: 'Nicole', LastName: 'King', Age: 31, Gender: 'Female', PhoneNo: '9876543229', AdhaarId: '012345678901', PANCard: 'TUVWX0123Y', Address: '258 Oak St, City', ChiefComplaint: 'Back pain', Status: 'Active', RegisteredBy: 'Dr. Davis', RegisteredDate: '2025-02-04', PatientType: 'OPD' },
  { id: 21, PatientId: 'PAT-2025-0021', PatientNo: 'P-021', PatientName: 'Kevin', LastName: 'Wright', Age: 55, Gender: 'Male', PhoneNo: '9876543230', AdhaarId: '123456789012', PANCard: 'UVWXY1234Z', Address: '369 Pine Ave, City', ChiefComplaint: 'Shortness of breath', Status: 'Active', RegisteredBy: 'Dr. Wilson', RegisteredDate: '2025-02-05', PatientType: 'IPD' },
  { id: 22, PatientId: 'PAT-2025-0022', PatientNo: 'P-022', PatientName: 'Samantha', LastName: 'Lopez', Age: 28, Gender: 'Female', PhoneNo: '9876543231', AdhaarId: '234567890123', PANCard: 'VWXYZ2345A', Address: '741 Elm Rd, City', ChiefComplaint: 'Headache', Status: 'Active', RegisteredBy: 'Dr. Brown', RegisteredDate: '2025-02-06', PatientType: 'OPD' },
  { id: 23, PatientId: 'PAT-2025-0023', PatientNo: 'P-023', PatientName: 'Brandon', LastName: 'Hill', Age: 43, Gender: 'Male', PhoneNo: '9876543232', AdhaarId: '345678901234', PANCard: 'WXYZA3456B', Address: '852 Maple Dr, City', ChiefComplaint: 'Chest pain', Status: 'Active', RegisteredBy: 'Dr. Miller', RegisteredDate: '2025-02-07', PatientType: 'Emergency' },
  { id: 24, PatientId: 'PAT-2025-0024', PatientNo: 'P-024', PatientName: 'Rachel', LastName: 'Scott', Age: 36, Gender: 'Female', PhoneNo: '9876543233', AdhaarId: '456789012345', PANCard: 'XYZAB4567C', Address: '963 Cedar Ln, City', ChiefComplaint: 'Fatigue', Status: 'Active', RegisteredBy: 'Dr. Taylor', RegisteredDate: '2025-02-08', PatientType: 'Follow-up' },
  { id: 25, PatientId: 'PAT-2025-0025', PatientNo: 'P-025', PatientName: 'Justin', LastName: 'Green', Age: 30, Gender: 'Male', PhoneNo: '9876543234', AdhaarId: '567890123456', PANCard: 'YZABC5678D', Address: '147 Birch Way, City', ChiefComplaint: 'Sore throat', Status: 'Active', RegisteredBy: 'Dr. Anderson', RegisteredDate: '2025-02-09', PatientType: 'OPD' },
  { id: 26, PatientId: 'PAT-2025-0026', PatientNo: 'P-026', PatientName: 'Michelle', LastName: 'Adams', Age: 34, Gender: 'Female', PhoneNo: '9876543235', AdhaarId: '678901234567', PANCard: 'ZABCD6789E', Address: '258 Spruce St, City', ChiefComplaint: 'Knee pain', Status: 'Active', RegisteredBy: 'Dr. Martinez', RegisteredDate: '2025-02-10', PatientType: 'OPD' },
  { id: 27, PatientId: 'PAT-2025-0027', PatientNo: 'P-027', PatientName: 'Tyler', LastName: 'Baker', Age: 41, Gender: 'Male', PhoneNo: '9876543236', AdhaarId: '789012345678', PANCard: 'ABCDE7890F', Address: '369 Willow Ave, City', ChiefComplaint: 'Insomnia', Status: 'Active', RegisteredBy: 'Dr. Johnson', RegisteredDate: '2025-02-11', PatientType: 'OPD' },
  { id: 28, PatientId: 'PAT-2025-0028', PatientNo: 'P-028', PatientName: 'Stephanie', LastName: 'Nelson', Age: 27, Gender: 'Female', PhoneNo: '9876543237', AdhaarId: '890123456789', PANCard: 'BCDEF8901G', Address: '741 Ash Blvd, City', ChiefComplaint: 'Allergic reaction', Status: 'Active', RegisteredBy: 'Dr. Davis', RegisteredDate: '2025-02-12', PatientType: 'Emergency' },
  { id: 29, PatientId: 'PAT-2025-0029', PatientNo: 'P-029', PatientName: 'Eric', LastName: 'Carter', Age: 48, Gender: 'Male', PhoneNo: '9876543238', AdhaarId: '901234567890', PANCard: 'CDEFG9012H', Address: '852 Oak St, City', ChiefComplaint: 'High cholesterol', Status: 'Active', RegisteredBy: 'Dr. Wilson', RegisteredDate: '2025-02-13', PatientType: 'Follow-up' },
  { id: 30, PatientId: 'PAT-2025-0030', PatientNo: 'P-030', PatientName: 'Melissa', LastName: 'Mitchell', Age: 32, Gender: 'Female', PhoneNo: '9876543239', AdhaarId: '012345678901', PANCard: 'DEFGH0123I', Address: '963 Pine Ave, City', ChiefComplaint: 'Anxiety', Status: 'Active', RegisteredBy: 'Dr. Brown', RegisteredDate: '2025-02-14', PatientType: 'OPD' },
];

export interface CreatePatientDto {
  PatientNo?: string;
  PatientName: string;
  PatientType?: string;
  LastName?: string;
  AdhaarID?: string;
  PANCard?: string;
  PhoneNo: string;
  Gender: string;
  Age: number;
  Address?: string;
  ChiefComplaint?: string;
  Description?: string;
  Status?: string;
  RegisteredBy?: number;
  RegisteredDate?: string;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {
  PatientId: string;
}

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate unique Patient ID in format PAT-YYYY-XXXX
function generatePatientId(): string {
  const year = new Date().getFullYear();
  const count = stubPatients.length + 1;
  return `PAT-${year}-${count.toString().padStart(4, '0')}`;
}

// Map backend PascalCase response to frontend camelCase format
function mapPatientFromBackend(backendPatient: any, index: number): any {
  // Use PatientId as the primary identifier, fallback to index if missing
  const patientId = backendPatient.PatientId || backendPatient.patientId || `PAT-TEMP-${index}`;
  // Generate a unique id - use existing id if present and unique, otherwise use PatientId hash or index
  // If id exists, use it; otherwise create a unique identifier from PatientId
  const id = backendPatient.id !== undefined && backendPatient.id !== null 
    ? backendPatient.id 
    : (patientId ? `hash-${patientId}-${index}` : index);
  
  return {
    id: id,
    patientId: patientId,
    patientNo: backendPatient.PatientNo || backendPatient.patientNo,
    patientName: backendPatient.PatientName || backendPatient.patientName,
    patientType: backendPatient.PatientType || backendPatient.patientType,
    lastName: backendPatient.LastName || backendPatient.lastName,
    adhaarID: backendPatient.AdhaarId || backendPatient.adhaarID || backendPatient.AdhaarID,
    panCard: backendPatient.PANCard || backendPatient.panCard,
    phoneNo: backendPatient.PhoneNo || backendPatient.phoneNo,
    phone: backendPatient.PhoneNo || backendPatient.phoneNo || backendPatient.phone,
    gender: backendPatient.Gender || backendPatient.gender,
    age: backendPatient.Age || backendPatient.age,
    address: backendPatient.Address || backendPatient.address,
    chiefComplaint: backendPatient.ChiefComplaint || backendPatient.chiefComplaint,
    description: backendPatient.Description || backendPatient.description,
    status: backendPatient.Status || backendPatient.status || 'Active',
    registeredBy: backendPatient.RegisteredBy || backendPatient.registeredBy,
    registeredDate: backendPatient.RegisteredDate || backendPatient.registeredDate,
    // Legacy fields for backward compatibility
    name: backendPatient.PatientName || backendPatient.patientName || backendPatient.name,
    email: backendPatient.email,
    bloodType: backendPatient.bloodType,
    lastVisit: backendPatient.lastVisit,
    condition: backendPatient.condition,
    followUpCount: backendPatient.followUpCount,
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const patientsApi = {
  async getAll(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Patient>> {
    let apiData: Patient[] = [];
    let totalCount = 0;
    let totalPages = 0;
    let isBackendPaginated = false; // Declare at function level
    
    try {
      // Build query parameters for pagination (backend may ignore these if not supported)
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      console.log('Fetching patients from API endpoint: /patients', { page, limit });
      const response = await apiRequest<any>(`/patients?${params.toString()}`);
      console.log('Raw API response:', response);
      
      // Handle different response structures:
      // 1. { success: true, data: [...], totalCount, totalPages, page, limit } - paginated API response
      // 2. { success: true, data: [...] } - standard API response (non-paginated)
      // 3. { data: [...] } - data wrapper (non-paginated)
      // 4. [...] - direct array (non-paginated)
      let patientsData: any[] = [];
      
      if (response?.success && Array.isArray(response.data)) {
        patientsData = response.data;
        // Check if response has pagination metadata
        if (response.totalCount !== undefined || response.total !== undefined || response.totalPages !== undefined) {
          isBackendPaginated = true;
          totalCount = response.totalCount || response.total || patientsData.length;
          totalPages = response.totalPages || Math.ceil(totalCount / limit);
          console.log('Found paginated patients in response.data:', patientsData.length, { totalCount, totalPages, isBackendPaginated });
        } else {
          // Non-paginated response - we have all data, backend doesn't support pagination
          isBackendPaginated = false;
          totalCount = patientsData.length;
          totalPages = Math.ceil(totalCount / limit);
          console.log('Found non-paginated patients in response.data (all data, backend does not support pagination):', patientsData.length, { totalCount });
        }
      } else if (Array.isArray(response?.data)) {
        patientsData = response.data;
        // Check if response has pagination metadata
        if (response.totalCount !== undefined || response.total !== undefined || response.totalPages !== undefined) {
          isBackendPaginated = true;
          totalCount = response.totalCount || response.total || patientsData.length;
          totalPages = response.totalPages || Math.ceil(totalCount / limit);
        } else {
          isBackendPaginated = false;
          totalCount = patientsData.length;
          totalPages = Math.ceil(totalCount / limit);
        }
        console.log('Found patients in response.data (no success field):', patientsData.length, { isBackendPaginated });
      } else if (Array.isArray(response)) {
        patientsData = response;
        isBackendPaginated = false;
        totalCount = patientsData.length;
        totalPages = Math.ceil(totalCount / limit);
        console.log('Found patients as direct array (non-paginated):', patientsData.length);
      } else {
        console.warn('Unexpected response structure:', response);
        isBackendPaginated = false;
        patientsData = [];
        totalCount = 0;
        totalPages = 0;
      }
      
      // Note: If backend doesn't support pagination, we return ALL data
      // Client-side pagination will be handled in the hook
      // Don't slice here - let the hook handle it based on whether backend supports pagination
      
      if (patientsData.length > 0) {
        // Map each patient from backend format to frontend format
        apiData = patientsData.map((patient, index) => {
          try {
            return mapPatientFromBackend(patient, index);
          } catch (err) {
            console.error(`Error mapping patient at index ${index}:`, err, patient);
            // Return a minimal patient object to prevent crashes
            return {
              id: `error-${index}`,
              patientId: `PAT-ERROR-${index}`,
              patientName: 'Error loading patient',
              status: 'Error',
            };
          }
        }) as Patient[];
        
        // Check for duplicate IDs and warn
        const idCounts = new Map();
        apiData.forEach((p, idx) => {
          const key = p.id || p.patientId || idx;
          if (idCounts.has(key)) {
            console.warn(`Duplicate key detected: ${key} at indices ${idCounts.get(key)} and ${idx}`);
            // Make the ID unique by appending index
            p.id = `${key}-${idx}`;
          } else {
            idCounts.set(key, idx);
          }
        });
        
        console.log(`Successfully mapped ${apiData.length} patients`);
      }
      
      // Note: If backend doesn't support pagination, return ALL data
      // Client-side pagination will be handled in the hook
      // Don't slice here - let the hook handle pagination
    } catch (error) {
      console.error('Error fetching patients:', error);
      // If stub data is disabled and API fails, throw the error
      if (!ENABLE_STUB_DATA) {
        throw error;
      }
    }
    
    // Append stub data if enabled
    if (ENABLE_STUB_DATA) {
      // Filter out stub data that might conflict with API data (by PatientId)
      const apiPatientIds = new Set(apiData.map(p => p.PatientId || p.patientId));
      let uniqueStubData = stubPatients.filter(p => {
        const stubPatientId = p.PatientId || p.patientId;
        return !apiPatientIds.has(stubPatientId);
      });
      
      // Combine API data with stub data
      const allData = [...apiData, ...uniqueStubData];
      totalCount = allData.length;
      totalPages = Math.ceil(totalCount / limit);
      
      // If backend supports pagination, apply server-side pagination
      // Otherwise, return all data and let client handle pagination
      let paginatedData = allData;
      if (isBackendPaginated) {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        paginatedData = allData.slice(startIndex, endIndex);
      }
      const hasMore = isBackendPaginated ? (page < totalPages) : ((page * limit) < totalCount);
      
      if (uniqueStubData.length > 0) {
        console.log(`Appending ${uniqueStubData.length} stub patients to ${apiData.length} API records`);
      }
      
      // If API returned no data, use stub data as fallback
      if (apiData.length === 0 && uniqueStubData.length > 0) {
        console.warn('No patients data received from API, using stub data');
        await delay(300);
      }
      
      return {
        data: paginatedData,
        total: totalCount,
        page: page,
        limit: limit,
        hasMore: hasMore,
      };
    }
    
    // Return only API data if stub data is disabled
    // If backend doesn't support pagination, return all data (client will paginate)
    const hasMore = isBackendPaginated ? (page < totalPages) : ((page * limit) < totalCount);
    return {
      data: apiData,
      total: totalCount,
      page: page,
      limit: limit,
      hasMore: hasMore,
    };
  },

  async getById(patientId: string): Promise<Patient> {
    try {
      console.log('Calling getById with PatientId:', patientId);
      const response = await apiRequest<any>(`/patients/${encodeURIComponent(patientId)}`);
      console.log('getById response:', response);
      
      // Handle different response structures: { data: {...} } or direct object
      const patientData = response?.data || response;
      
      if (!patientData) {
        throw new Error(`Patient with PatientId ${patientId} not found`);
      }
      
      // Return the patient data (should match Patient type with PascalCase)
      return patientData as Patient;
    } catch (error) {
      console.error('Error fetching patient by PatientId:', error);
      throw error;
    }
  },

  async create(data: CreatePatientDto | any): Promise<Patient> {
    try {
      // Convert camelCase to PascalCase for backend API
      const backendData: any = {};
      
      // Helper function to clean and add values (removes empty strings, null, undefined)
      const addIfValid = (key: string, value: any) => {
        // Only add if value is not empty string, null, or undefined
        if (value !== undefined && value !== null && value !== '') {
          // Trim strings
          if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed !== '') {
              backendData[key] = trimmed;
            }
          } else {
            backendData[key] = value;
          }
        }
      };
      
      // Map camelCase fields to PascalCase for backend
      // Required fields - these must be present
      const patientName = data.PatientName || data.patientName;
      const phoneNo = data.PhoneNo || data.phoneNo;
      const gender = data.Gender || data.gender;
      const ageValue = data.Age !== undefined ? data.Age : (data.age !== undefined ? data.age : undefined);
      
      // Validate required fields
      if (!patientName || (typeof patientName === 'string' && patientName.trim() === '')) {
        throw new Error('Patient Name is required');
      }
      if (!phoneNo || (typeof phoneNo === 'string' && phoneNo.trim() === '')) {
        throw new Error('Phone Number is required');
      }
      if (!gender || (typeof gender === 'string' && gender.trim() === '')) {
        throw new Error('Gender is required');
      }
      if (ageValue === undefined || ageValue === null || isNaN(Number(ageValue)) || Number(ageValue) <= 0) {
        throw new Error('Age must be a valid positive number');
      }
      
      // Set required fields (always include these)
      backendData.PatientName = typeof patientName === 'string' ? patientName.trim() : patientName;
      backendData.PhoneNo = typeof phoneNo === 'string' ? phoneNo.trim() : phoneNo;
      backendData.Gender = typeof gender === 'string' ? gender.trim() : gender;
      backendData.Age = Number(ageValue);
      
      // Optional fields - only add if they have valid values
      addIfValid('PatientNo', data.PatientNo || data.patientNo);
      addIfValid('PatientType', data.PatientType || data.patientType);
      addIfValid('LastName', data.LastName || data.lastName);
      // AdhaarID - handle both camelCase (adhaarID) and PascalCase (AdhaarID/AdhaarId)
      // Check explicitly for all possible cases to ensure we capture the value
      const adhaarID = data.AdhaarID !== undefined && data.AdhaarID !== null 
        ? data.AdhaarID 
        : (data.AdhaarId !== undefined && data.AdhaarId !== null 
          ? data.AdhaarId 
          : (data.adhaarID !== undefined && data.adhaarID !== null ? data.adhaarID : undefined));
      
      if (adhaarID !== undefined && adhaarID !== null) {
        const trimmedAdhaarID = typeof adhaarID === 'string' ? adhaarID.trim() : String(adhaarID).trim();
        if (trimmedAdhaarID !== '') {
          // Backend expects AdhaarId (with lowercase 'd') based on stub data
          backendData.AdhaarID = trimmedAdhaarID;
          console.log('AdhaarID captured from form and added as AdhaarId:', trimmedAdhaarID);
        } else {
          console.log('AdhaarID was empty after trim, not adding');
        }
      } else {
        console.log('AdhaarID not provided in data:', { 
          AdhaarID: data.AdhaarID, 
          AdhaarId: data.AdhaarId,
          adhaarID: data.adhaarID 
        });
      }
       
      addIfValid('PANCard', data.PANCard || data.panCard);
      addIfValid('Address', data.Address || data.address);
      addIfValid('ChiefComplaint', data.ChiefComplaint || data.chiefComplaint);
      addIfValid('Description', data.Description || data.description);
      
      // RegisteredBy - send as integer (default to 1 if not provided, or get from auth context)
      // TODO: Replace with actual user ID from authentication context
      const registeredBy = data.RegisteredBy !== undefined ? data.RegisteredBy : (data.registeredBy !== undefined ? data.registeredBy : 1);
      // Ensure it's a number
      const registeredById = typeof registeredBy === 'number' ? registeredBy : (typeof registeredBy === 'string' ? parseInt(registeredBy) || 1 : 1);
      backendData.RegisteredBy = registeredById;
      
      // Status and RegisteredDate are not sent - backend will set defaults

      // Final validation - ensure all required fields are present
      if (!backendData.PatientName || !backendData.PhoneNo || !backendData.Gender || !backendData.Age) {
        throw new Error('Missing required fields: PatientName, PhoneNo, Gender, and Age are required');
      }
      console.log('Creating patient with data:', JSON.stringify(backendData, null, 2));
      console.log('Request payload size:', JSON.stringify(backendData).length, 'bytes');
      
      // Call the actual API endpoint
      const response = await apiRequest<any>('/patients', {
        method: 'POST',
        body: JSON.stringify(backendData),
      });
      
      console.log('Create patient API response:', response);
      
      // Handle different response structures: { data: {...} } or direct object
      const patientData = response?.data || response;
      console.log('Patient data***************:', patientData);
      if (!patientData) {
        throw new Error('No patient data received from API');
      }
      
      // Map the response back to Patient type
      return mapPatientFromBackend(patientData, 0);
    } catch (error: any) {
      console.error('Error creating patient:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // Re-throw API errors with detailed message
      if (error instanceof ApiError) {
        // Extract error message from API response
        const errorData = error.data as any;
        const errorMessage = errorData?.message || errorData?.error || error.message || 'Failed to create patient';
        const errorDetails = errorData?.errors || errorData?.details;
        
        let fullErrorMessage = errorMessage;
        if (errorDetails) {
          if (Array.isArray(errorDetails)) {
            fullErrorMessage += ': ' + errorDetails.join(', ');
          } else if (typeof errorDetails === 'object') {
            fullErrorMessage += ': ' + JSON.stringify(errorDetails);
          } else {
            fullErrorMessage += ': ' + errorDetails;
          }
        }
        
        throw new Error(fullErrorMessage);
      }
      
      // Re-throw validation errors
      if (error instanceof Error) {
        throw error;
      }
      
      // Fallback error
      throw new Error('Failed to create patient. Please check the console for details.');
    }
  },

  async update(data: UpdatePatientDto | any): Promise<Patient> {
    try {
      // Validate that PatientId is provided
      const patientId = data.PatientId;
      if (!patientId) {
        throw new Error('PatientId is required for update operation');
      }

      console.log('Updating patient with PatientId:', patientId);
      console.log('Update data being sent (raw):', data);
      
      // Convert camelCase to PascalCase for backend
      // The backend expects PascalCase in the request body
      const backendData: any = {
        PatientId: patientId,
      };
      
      // Map camelCase fields to PascalCase for backend
      // Handle both camelCase (from component) and PascalCase (from DTO) inputs
      if (data.patientNo !== undefined || data.PatientNo !== undefined) {
        backendData.PatientNo = data.PatientNo || data.patientNo;
      }
      if (data.patientName !== undefined || data.PatientName !== undefined) {
        backendData.PatientName = data.PatientName || data.patientName;
      }
      if (data.patientType !== undefined || data.PatientType !== undefined) {
        backendData.PatientType = data.PatientType || data.patientType;
      }
      if (data.lastName !== undefined || data.LastName !== undefined) {
        backendData.LastName = data.LastName || data.lastName;
      }
      if (data.adhaarID !== undefined || data.AdhaarID !== undefined) {
        backendData.AdhaarID = data.AdhaarID || data.adhaarID;
      }
      if (data.panCard !== undefined || data.PANCard !== undefined) {
        backendData.PANCard = data.PANCard || data.panCard;
      }
      if (data.phoneNo !== undefined || data.PhoneNo !== undefined) {
        backendData.PhoneNo = data.PhoneNo || data.phoneNo;
      }
      if (data.gender !== undefined || data.Gender !== undefined) {
        backendData.Gender = data.Gender || data.gender;
      }
      if (data.age !== undefined || data.Age !== undefined) {
        backendData.Age = data.Age || data.age;
      }
      if (data.address !== undefined || data.Address !== undefined) {
        backendData.Address = data.Address || data.address;
      }
      if (data.chiefComplaint !== undefined || data.ChiefComplaint !== undefined) {
        backendData.ChiefComplaint = data.ChiefComplaint || data.chiefComplaint;
      }
      if (data.description !== undefined || data.Description !== undefined) {
        backendData.Description = data.Description || data.description;
      }
      if (data.status !== undefined || data.Status !== undefined) {
        backendData.Status = data.Status || data.status;
      }
      if (data.registeredBy !== undefined || data.RegisteredBy !== undefined) {
        backendData.RegisteredBy = data.RegisteredBy || data.registeredBy;
      }
      if (data.registeredDate !== undefined || data.RegisteredDate !== undefined) {
        backendData.RegisteredDate = data.RegisteredDate || data.registeredDate;
      }
      
      console.log('Backend data format (PascalCase):', backendData);
      
      // The PatientId is used in the URL path: PUT /patients/{PatientId}
      const response = await apiRequest<any>(
        `/patients/${encodeURIComponent(patientId)}`,
        {
          method: 'PUT',
          body: JSON.stringify(backendData),
        }
      );
      
      console.log('Raw API response:', response);
      
      // Handle different response structures
      let patientData: any;
      if (response?.data) {
        patientData = response.data;
      } else if (response?.success && response?.data) {
        patientData = response.data;
      } else if (Array.isArray(response)) {
        // If response is an array, take first item (shouldn't happen for update)
        patientData = response[0];
      } else {
        patientData = response;
      }
      
      console.log('Extracted patientData:', patientData);
            
      // Map the response back to Patient type if needed
      return mapPatientFromBackend(patientData, 0);
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  },

  async incrementFollowUpCount(patientId: number): Promise<Patient> {
    // Replace with: return apiRequest<Patient>(`/patients/${patientId}/follow-up`, { method: 'POST' });
    await delay(300);
    const index = stubPatients.findIndex(p => p.id === patientId);
    if (index === -1) {
      throw new Error(`Patient with id ${patientId} not found`);
    }
    // Note: followUpCount and lastVisit are not in Patient type, so we can't update them here
    // This method should be updated to use real API call
    return Promise.resolve(stubPatients[index]);
  },

  async findByPhone(phone: string): Promise<Patient | null> {
    // Replace with: return apiRequest<Patient | null>(`/patients?phone=${phone}`);
    await delay(200);
    const patient = stubPatients.find(p => p.PhoneNo === phone);
    return Promise.resolve(patient || null);
  },

  async delete(id: number): Promise<void> {
    // Replace with: return apiRequest<void>(`/patients/${id}`, { method: 'DELETE' });
    await delay(300);
    const index = stubPatients.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Patient with id ${id} not found`);
    }
    stubPatients.splice(index, 1);
    return Promise.resolve();
  },
};

