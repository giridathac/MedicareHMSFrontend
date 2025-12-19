// Base API configuration and utilities

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Stub data configuration - only enabled when explicitly set to 'true' in .env
// To enable stub data, set VITE_ENABLE_STUB_DATA=true in your .env file
// Default: false (disabled) - must be explicitly enabled
export const ENABLE_STUB_DATA = import.meta.env.VITE_ENABLE_STUB_DATA === 'true';

// Log the API base URL and stub data status for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
  console.log('Stub Data Enabled:', ENABLE_STUB_DATA);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
    
    // Log the error for debugging
    console.error(`API Request Failed [${response.status}]: ${errorMessage}`, {
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      errorData,
    });
    
    throw new ApiError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status,
      errorData
    );
  }
  
  // Handle 204 No Content (common for DELETE requests) - no body to parse
  if (response.status === 204) {
    return undefined as T;
  }
  
  // Check if response has content to parse
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const text = await response.text();
    return text ? JSON.parse(text) : undefined as T;
  }
  
  // For empty responses or non-JSON, return undefined
  return undefined as T;
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  };

  try {
    console.log('========================================');
    console.log('apiRequest: Making network request');
    console.log('Full URL:', url);
    console.log('Method:', config.method || 'GET');
    console.log('Headers:', config.headers);
    console.log('This should appear in Network tab of DevTools');
    console.log('========================================');
    
    const response = await fetch(url, config);
    console.log(`apiRequest - Response status for ${url}:`, response.status);
    console.log('Response URL:', response.url);
    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      // Log the error for debugging
      console.error(`API Error [${error.status}]: ${error.message}`, {
        url,
        endpoint,
        data: error.data,
      });
      throw error;
    }
    throw new ApiError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      0
    );
  }
}

