// Shared file upload utility
import { convertToIST } from './timeUtils';

// Helper function to format date as dd_mm_yyyy for file suffix
export const formatDateForFileSuffix = (): string => {
  const now = new Date();
  const istDate = convertToIST(now);
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const year = istDate.getUTCFullYear();
  return `${day}_${month}_${year}`;
};

// Helper function to add date suffix to filename
export const addDateSuffixToFileName = (fileName: string): string => {
  const dateSuffix = formatDateForFileSuffix();
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    // No extension
    return `${fileName}_${dateSuffix}`;
  }
  const nameWithoutExt = fileName.substring(0, lastDotIndex);
  const extension = fileName.substring(lastDotIndex);
  return `${nameWithoutExt}_${dateSuffix}${extension}`;
};

// Function to upload files
export const uploadFiles = async (
  files: File[], 
  patientId: string, 
  folder: string
): Promise<string[]> => {
  if (files.length === 0) return [];
  if (!patientId) {
    throw new Error('Patient ID is required for file upload');
  }
  
  const uploadedUrls: string[] = [];
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
  
  for (const file of files) {
    try {
      const formData = new FormData();
      // Add date suffix to filename before uploading
      const fileNameWithSuffix = addDateSuffixToFileName(file.name);
      // Append file with the exact field name 'file' that multer expects
      formData.append('file', file, fileNameWithSuffix);
      // Append folder parameter (required by backend) - must be in FormData
      formData.append('folder', folder);
      // Append PatientId parameter (required by backend, must be UUID) - also in query as fallback
      formData.append('PatientId', patientId);
      
      // Debug: Log form data keys
      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      console.log('FormData entries:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}:`, value);
        }
      }
      
      // Send folder and PatientId as query parameters too (as fallback for multer async issue)
      // Construct URL properly - append /upload to the base URL
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const uploadUrlObj = new URL(`${baseUrl}/upload`);
      uploadUrlObj.searchParams.append('folder', folder);
      uploadUrlObj.searchParams.append('PatientId', patientId);
      const uploadUrl = uploadUrlObj.toString();
      
      console.log('Constructed upload URL:', uploadUrl);
      console.log('File being sent:', { name: file.name, size: file.size, type: file.type });
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to upload ${file.name}`);
      }
      
      const result = await response.json();
      if (result.success && result.url) {
        uploadedUrls.push(result.url);
      } else {
        throw new Error(`Invalid response for ${file.name}: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      throw error;
    }
  }
  
  return uploadedUrls;
};

