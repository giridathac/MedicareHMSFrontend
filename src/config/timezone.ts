/**
 * Timezone Configuration
 * 
 * This file defines the default timezone for the application.
 * All date/time operations should use this timezone configuration.
 */

/**
 * Default timezone: Indian Standard Time (IST)
 * IST is UTC+5:30
 * IANA timezone identifier: Asia/Kolkata
 */
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * IST offset in milliseconds
 * IST = UTC + 5 hours 30 minutes = 5.5 * 60 * 60 * 1000 milliseconds
 */
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * IST offset in hours
 */
export const IST_OFFSET_HOURS = 5.5;

/**
 * IST offset string for ISO date strings
 * Format: +05:30
 */
export const IST_OFFSET_STRING = '+05:30';

/**
 * Get current date/time in IST
 * @returns Date object representing current time in IST
 */
export function getCurrentIST(): Date {
  const now = new Date();
  const utcTime = now.getTime();
  const istTime = new Date(utcTime + IST_OFFSET_MS);
  return istTime;
}

/**
 * Get current date in IST as YYYY-MM-DD string
 * @returns Current date in IST format (YYYY-MM-DD)
 */
export function getCurrentDateIST(): string {
  const istDate = getCurrentIST();
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert a date to IST timezone string
 * @param date - Date object or date string
 * @returns ISO string with IST offset (YYYY-MM-DDTHH:mm:ss+05:30)
 */
export function toISTString(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const utcTime = dateObj.getTime();
  const istTime = new Date(utcTime + IST_OFFSET_MS);
  
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const hours = String(istTime.getUTCHours()).padStart(2, '0');
  const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istTime.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${IST_OFFSET_STRING}`;
}

