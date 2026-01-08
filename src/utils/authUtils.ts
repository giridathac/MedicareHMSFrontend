// Authentication utility functions

/**
 * Decodes a JWT token and returns the payload
 * @param token - JWT token string
 * @returns Decoded payload object or null if invalid
 */
export function decodeJWT(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

/**
 * Gets the current user ID from the stored JWT token
 * @returns User ID string or null if not found
 */
export function getCurrentUserId(): string | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('No token found in localStorage');
      return null;
    }

    const decoded = decodeJWT(token);
    if (!decoded) {
      console.warn('Failed to decode token');
      return null;
    }

    // Try different possible field names for user ID
    const userId = decoded.userId || decoded.user_id || decoded.id || decoded.sub;
    if (!userId) {
      console.warn('No user ID found in token payload:', decoded);
      return null;
    }

    return String(userId);
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

/**
 * Gets the current user information from the stored JWT token
 * @returns User object or null if not found
 */
export function getCurrentUser(): any | null {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    const decoded = decodeJWT(token);
    return decoded || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
