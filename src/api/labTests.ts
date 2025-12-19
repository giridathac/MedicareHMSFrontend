// Lab Tests API service
import { apiRequest, ApiError } from './base';
import { LabTest } from '../types';

// Stub data
const stubLabTests: LabTest[] = [
 ];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate display test ID in format LAB_yyyy_mm_dd_01, LAB_yyyy_mm_dd_02, etc.
function generateDisplayTestId(existingLabTests: LabTest[] = []): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePrefix = `${year}_${month}_${day}`;
  const baseId = `LAB_${datePrefix}_`;
  
  // Filter lab tests that match today's date pattern
  const todayPattern = new RegExp(`^${baseId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)$`);
  const todayTests = existingLabTests.filter(test => {
    const displayId = test.displayTestId || '';
    return todayPattern.test(displayId);
  });
  
  // Extract sequence numbers and find the highest
  const sequenceNumbers = todayTests
    .map(test => {
      const match = (test.displayTestId || '').match(todayPattern);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => num > 0);
  
  // Get the next sequence number
  const maxSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0;
  const nextSequence = maxSequence + 1;
  
  return `${baseId}${String(nextSequence).padStart(2, '0')}`;
}

// Helper function to normalize status to 'Active' or 'InActive' for backend
function normalizeStatusForBackend(status: any): 'Active' | 'InActive' {
  if (!status) return 'Active';
  
  const statusStr = String(status).trim();
  const lowerStatus = statusStr.toLowerCase();
  
  // Map various status values to 'Active' or 'InActive'
  if (lowerStatus === 'active') {
    return 'Active';
  }
  if (lowerStatus === 'inactive' || lowerStatus === 'in active') {
    return 'InActive';
  }
  
  // If it's already 'Active' or 'InActive' (case-insensitive), return it properly capitalized
  if (statusStr === 'Active' || statusStr === 'active') return 'Active';
  if (statusStr === 'InActive' || statusStr === 'Inactive' || statusStr === 'inactive') return 'InActive';
  
  // Default to 'Active' if unknown status
  return 'Active';
}

export interface CreateLabTestDto {
  testName: string;
  testCategory: string;
  description?: string;
  charges: number;
  status?: 'active' | 'inactive';
}

export interface UpdateLabTestDto extends Partial<CreateLabTestDto> {
  labTestId: number; // Integer primary key
}

export const labTestsApi = {
  async getAll(): Promise<LabTest[]> {
    try {
      const response = await apiRequest<any>('/lab-tests');
      // Handle different response structures: { data: [...] } or direct array
      const labTestsData = response?.data || response || [];
     
      if (Array.isArray(labTestsData) && labTestsData.length > 0) {
        console.log('Lab tests fetched from API:', labTestsData);
        // Map and normalize the data to ensure all fields are present
        const normalizedLabTests = labTestsData.map((labTest: any) => {
          // Extract labTestId (integer) from various possible field names
          // Priority: LabTestsId (with 's') is the primary key from backend
          const labTestIdValue = labTest.LabTestsId !== undefined && labTest.LabTestsId !== null ? labTest.LabTestsId :
            labTest.labTestsId !== undefined && labTest.labTestsId !== null ? labTest.labTestsId :
            labTest.LabTestId !== undefined && labTest.LabTestId !== null ? labTest.LabTestId :
            labTest.labTestId !== undefined && labTest.labTestId !== null ? labTest.labTestId :
            labTest.id !== undefined && labTest.id !== null ? labTest.id : 0;
          
          const normalizedLabTestId = Number(labTestIdValue);
          
          return {
            id: labTest.id || labTest.Id || 0,
            labTestId: normalizedLabTestId,
            displayTestId: labTest.displayTestId || labTest.DisplayTestId || labTest.displayTestID || labTest.DisplayTestID || '',
            testName: labTest.testName || labTest.TestName || '',
            testCategory: labTest.testCategory || labTest.TestCategory || '',
            description: labTest.description || labTest.Description || undefined,
            charges: Number(labTest.charges || labTest.Charges || 0),
            status: (labTest.status || labTest.Status || 'active').toLowerCase() as 'active' | 'inactive',
          };
        });
        return normalizedLabTests as LabTest[];
      }
      
      // Fallback to stub data if no data received
      console.warn('No lab tests data received, using stub data');
      await delay(300);
      return Promise.resolve([...stubLabTests]);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      // Fallback to stub data on error
      await delay(300);
      return Promise.resolve([...stubLabTests]);
    }
  },

  async getById(labTestId: number): Promise<LabTest> {
    try {
      // Validate labTestId (integer) before making API call
      if (!labTestId || typeof labTestId !== 'number' || labTestId <= 0 || isNaN(labTestId)) {
        throw new Error(`Invalid lab test ID (integer): ${labTestId}. Cannot fetch lab test data.`);
      }
      
      const response = await apiRequest<any>(`/lab-tests/${labTestId}`);
      console.log('Get lab test by ID response:', response);
      
      // Handle different response structures: { data: {...} } or direct object
      const labTestData = response?.data || response;
      
      if (!labTestData) {
        throw new Error(`LabTest with id ${labTestId} not found`);
      }
      
      // Extract labTestId (integer) from various possible field names
      // Priority: LabTestsId (with 's') is the primary key from backend
      const labTestIdValue = labTestData.LabTestsId !== undefined && labTestData.LabTestsId !== null ? labTestData.LabTestsId :
        labTestData.labTestsId !== undefined && labTestData.labTestsId !== null ? labTestData.labTestsId :
        labTestData.LabTestId !== undefined && labTestData.LabTestId !== null ? labTestData.LabTestId :
        labTestData.labTestId !== undefined && labTestData.labTestId !== null ? labTestData.labTestId :
        labTestData.id !== undefined && labTestData.id !== null ? labTestData.id : 0;
      
      const normalizedLabTestId = Number(labTestIdValue);
      
      // Normalize the response to match LabTest interface
      const normalizedLabTest: LabTest = {
        id: labTestData.id || labTestData.Id || 0,
        labTestId: normalizedLabTestId,
        displayTestId: labTestData.displayTestId || labTestData.DisplayTestId || labTestData.displayTestID || labTestData.DisplayTestID || '',
        testName: labTestData.testName || labTestData.TestName || '',
        testCategory: labTestData.testCategory || labTestData.TestCategory || '',
        description: labTestData.description || labTestData.Description || undefined,
        charges: Number(labTestData.charges || labTestData.Charges || 0),
        status: (labTestData.status || labTestData.Status || 'active').toLowerCase() as 'active' | 'inactive',
      };
      
      return normalizedLabTest;
    } catch (error: any) {
      console.error(`Error fetching lab test with id ${labTestId}:`, error);
      
      // Provide more detailed error message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || error.message || `Failed to fetch lab test with id ${labTestId}`;
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  },

  async getByCategory(category: string): Promise<LabTest[]> {
    try {
      const response = await apiRequest<any>(`/lab-tests?category=${encodeURIComponent(category)}`);
      const labTestsData = response?.data || response || [];
      
      if (Array.isArray(labTestsData)) {
        return labTestsData.map((labTest: any) => ({
          id: labTest.id || labTest.Id || 0,
          displayTestId: labTest.displayTestId || labTest.DisplayTestId || '',
          testName: labTest.testName || labTest.TestName || '',
          testCategory: labTest.testCategory || labTest.TestCategory || '',
          description: labTest.description || labTest.Description || undefined,
          charges: Number(labTest.charges || labTest.Charges || 0),
          status: (labTest.status || labTest.Status || 'active').toLowerCase() as 'active' | 'inactive',
        })) as LabTest[];
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching lab tests by category ${category}:`, error);
      return [];
    }
  },

  async create(data: CreateLabTestDto): Promise<LabTest> {
    try {
      // Validate required fields
      if (!data.testName || !data.testCategory) {
        throw new Error('TestName and TestCategory are required');
      }
      if (data.charges === undefined || data.charges === null || data.charges < 0) {
        throw new Error('Charges must be a valid positive number');
      }

      // Fetch existing lab tests to generate sequential ID for today
      let existingLabTests: LabTest[] = [];
      try {
        existingLabTests = await labTestsApi.getAll();
      } catch (error) {
        console.warn('Failed to fetch existing lab tests for ID generation, will use empty array:', error);
      }

      // Convert camelCase to PascalCase for backend API
      const backendData: any = {
        DisplayTestId: generateDisplayTestId(existingLabTests), // Generate DisplayTestId in format LAB_yyyy_mm_dd_01, LAB_yyyy_mm_dd_02, etc.
        TestName: data.testName.trim(),
        TestCategory: data.testCategory.trim(),
        Charges: Number(data.charges),
      };
      
      // Add optional fields if provided
      if (data.description !== undefined && data.description !== null && data.description.trim() !== '') {
        backendData.Description = data.description.trim();
      }
      if (data.status !== undefined && data.status !== null) {
        backendData.Status = normalizeStatusForBackend(data.status);
        console.log('Status being sent to API:', backendData.Status, 'from:', data.status);
      } else {
        // Always include status with default value if not provided
        backendData.Status = 'Active';
        console.log('Status not provided, using default: Active');
      }

      console.log('Creating lab test with data:', JSON.stringify(backendData, null, 2));

      // Call the actual API endpoint
      const response = await apiRequest<any>('/lab-tests', {
        method: 'POST',
        body: JSON.stringify(backendData),
      });

      console.log('Create lab test API response:', response);

      // Handle different response structures: { data: {...} } or direct object
      const labTestData = response?.data || response;

      if (!labTestData) {
        throw new Error('No lab test data received from API');
      }

      // Extract labTestId (integer) from various possible field names
      // Priority: LabTestsId (with 's') is the primary key from backend
      const labTestIdValue = labTestData.LabTestsId !== undefined && labTestData.LabTestsId !== null ? labTestData.LabTestsId :
        labTestData.labTestsId !== undefined && labTestData.labTestsId !== null ? labTestData.labTestsId :
        labTestData.LabTestId !== undefined && labTestData.LabTestId !== null ? labTestData.LabTestId :
        labTestData.labTestId !== undefined && labTestData.labTestId !== null ? labTestData.labTestId :
        labTestData.id !== undefined && labTestData.id !== null ? labTestData.id : 0;
      
      const normalizedLabTestId = Number(labTestIdValue);
      
      // Normalize the response to match LabTest interface
      const normalizedLabTest: LabTest = {
        id: labTestData.id || labTestData.Id || 0,
        labTestId: normalizedLabTestId,
        displayTestId: labTestData.displayTestId || labTestData.DisplayTestId || labTestData.displayTestID || labTestData.DisplayTestID || '',
        testName: labTestData.testName || labTestData.TestName || data.testName,
        testCategory: labTestData.testCategory || labTestData.TestCategory || data.testCategory,
        description: labTestData.description || labTestData.Description || data.description,
        charges: Number(labTestData.charges || labTestData.Charges || data.charges),
        status: (labTestData.status || labTestData.Status || data.status || 'Active').toLowerCase() as 'active' | 'inactive',
      };

      return normalizedLabTest;
    } catch (error: any) {
      console.error('Error creating lab test:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // Re-throw API errors with detailed message
      if (error.name === 'ApiError' || error.status) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || errorData?.error || error.message || 'Failed to create lab test';
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
      throw new Error('Failed to create lab test. Please check the console for details.');
    }
  },

  async update(data: UpdateLabTestDto): Promise<LabTest> {
    try {
      // Validate required fields - labTestId (integer) is the primary key
      if (!data.labTestId || typeof data.labTestId !== 'number' || data.labTestId <= 0 || isNaN(data.labTestId)) {
        throw new Error('Valid lab test ID (integer) is required for update');
      }

      // Convert frontend camelCase to backend PascalCase
      const backendData: any = {
        LabTestsId: data.labTestId, // Include LabTestsId in request body as required by backend
      };
      
      if (data.testName !== undefined) {
        backendData.TestName = data.testName.trim();
      }
      if (data.testCategory !== undefined) {
        backendData.TestCategory = data.testCategory.trim();
      }
      if (data.description !== undefined) {
        if (data.description === null || data.description.trim() === '') {
          backendData.Description = null;
        } else {
          backendData.Description = data.description.trim();
        }
      }
      if (data.charges !== undefined) {
        backendData.Charges = Number(data.charges);
      }
      if (data.status !== undefined && data.status !== null) {
        backendData.Status = normalizeStatusForBackend(data.status);
        console.log('Status being sent to API:', backendData.Status, 'from:', data.status);
      } else {
        console.log('Status not provided in update data:', data.status);
      }

      console.log('Updating lab test with data:', JSON.stringify(backendData, null, 2));

      // Call the actual API endpoint using labTestId (integer) as primary key
      const response = await apiRequest<any>(`/lab-tests/${data.labTestId}`, {
        method: 'PUT',
        body: JSON.stringify(backendData),
      });

      console.log('Update lab test API response:', response);

      // Handle different response structures: { data: {...} } or direct object
      const labTestData = response?.data || response;

      if (!labTestData) {
        throw new Error('No lab test data received from API');
      }

      // Extract labTestId (integer) from various possible field names
      // Priority: LabTestsId (with 's') is the primary key from backend
      const labTestIdValue = labTestData.LabTestsId !== undefined && labTestData.LabTestsId !== null ? labTestData.LabTestsId :
        labTestData.labTestsId !== undefined && labTestData.labTestsId !== null ? labTestData.labTestsId :
        labTestData.LabTestId !== undefined && labTestData.LabTestId !== null ? labTestData.LabTestId :
        labTestData.labTestId !== undefined && labTestData.labTestId !== null ? labTestData.labTestId :
        labTestData.id !== undefined && labTestData.id !== null ? labTestData.id : 0;
      
      const normalizedLabTestId = Number(labTestIdValue);
      
      // Normalize the response to match LabTest interface
      const normalizedLabTest: LabTest = {
        id: labTestData.id || labTestData.Id || 0,
        labTestId: normalizedLabTestId,
        displayTestId: labTestData.displayTestId || labTestData.DisplayTestId || labTestData.displayTestID || labTestData.DisplayTestID || '',
        testName: labTestData.testName || labTestData.TestName || data.testName || '',
        testCategory: labTestData.testCategory || labTestData.TestCategory || data.testCategory || '',
        description: labTestData.description || labTestData.Description || data.description,
        charges: Number(labTestData.charges || labTestData.Charges || data.charges || 0),
        status: (labTestData.status || labTestData.Status || data.status || 'active').toLowerCase() as 'active' | 'inactive',
      };

      return normalizedLabTest;
    } catch (error: any) {
      console.error('Error updating lab test:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // Re-throw API errors with detailed message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || errorData?.error || error.message || 'Failed to update lab test';
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
      throw new Error('Failed to update lab test. Please check the console for details.');
    }
  },

  async delete(labTestId: number): Promise<void> {
    try {
      // Validate labTestId (integer) before making API call
      if (!labTestId || typeof labTestId !== 'number' || labTestId <= 0 || isNaN(labTestId)) {
        throw new Error(`Invalid lab test ID (integer): ${labTestId}. Cannot delete lab test.`);
      }
      
      console.log(`Deleting lab test with LabTestsId: ${labTestId}`);
      
      // Call the actual API endpoint using labTestId (integer) as primary key
      const response = await apiRequest<any>(`/lab-tests/${labTestId}`, { 
        method: 'DELETE',
      });
      
      console.log('Delete lab test API response:', response);
    } catch (error: any) {
      console.error(`Error deleting lab test with id ${labTestId}:`, error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // Re-throw API errors with detailed message
      if (error instanceof ApiError) {
        const errorData = error.data as any;
        const errorMessage = errorData?.message || errorData?.error || error.message || `Failed to delete lab test with id ${labTestId}`;
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
      throw new Error(`Failed to delete lab test. Please check the console for details.`);
    }
  },
};

