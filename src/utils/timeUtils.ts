/**
 * Utility functions for handling Indian Standard Time (IST) conversions
 * IST is UTC+5:30
 * 
 * Note: The default timezone configuration is defined in src/config/timezone.ts
 * All timezone-related constants should be imported from there.
 */

import { DEFAULT_TIMEZONE, IST_OFFSET_MS, IST_OFFSET_STRING } from '../config/timezone';

/**
 * Convert a UTC date string or Date object to IST
 * @param date - Date string (ISO format) or Date object
 * @returns Date object representing the same moment in IST
 */
export function convertToIST(date: string | Date): Date {
  try {
    if (!date) {
      return new Date();
    }
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to convertToIST:', date);
      return new Date();
    }
    
    // If it's a date-only string (YYYY-MM-DD), treat it as midnight UTC
    // Otherwise, use the actual UTC time from the string
    let utcTime: number;
    
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Date-only string: treat as UTC midnight
      const [year, month, day] = date.split('-').map(Number);
      utcTime = Date.UTC(year, month - 1, day);
    } else {
      // Full datetime string or Date object: use getTime() which returns UTC milliseconds
      utcTime = dateObj.getTime();
    }
    
    // IST is UTC+5:30 - use constant from timezone config
    const istTime = new Date(utcTime + IST_OFFSET_MS);
    
    return istTime;
  } catch (error) {
    console.error('Error in convertToIST:', error, date);
    return new Date();
  }
}

/**
 * Get today's date in IST as YYYY-MM-DD string
 * @returns Today's date in IST format
 */
export function getTodayIST(): string {
  const now = new Date();
  const istDate = convertToIST(now);
  return istDate.toISOString().split('T')[0];
}

/**
 * Format a date to IST date string (YYYY-MM-DD)
 * This extracts just the date part in IST, regardless of the input format
 * @param date - Date string (ISO format with or without time) or Date object
 * @returns Date string in YYYY-MM-DD format (IST)
 */
export function formatDateIST(date: string | Date): string {
  if (!date) return '';
  
  // If it's already a date-only string, return as-is (assuming it's already in the correct format)
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  const istDate = convertToIST(date);
  
  // Get the date components in IST
  // Use UTC methods but with IST offset applied
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format a date to dd-mm-yyyy format (IST)
 * @param date - Date string or Date object
 * @returns Formatted date string in dd-mm-yyyy format
 */
export function formatDateToDDMMYYYY(date: string | Date | undefined): string {
  if (!date) return '';
  try {
    const istDate = formatDateIST(date);
    if (!istDate) return '';
    
    // Parse the YYYY-MM-DD format and convert to dd-mm-yyyy
    const [year, month, day] = istDate.split('-');
    return `${day}-${month}-${year}`;
  } catch {
    return '';
  }
}

/**
 * Format a date to IST date string for display (DD-MM-YYYY or locale format)
 * @param date - Date string or Date object
 * @param format - Format style ('short' | 'long' | 'numeric')
 * @returns Formatted date string
 */
export function formatDateDisplayIST(date: string | Date, format: 'short' | 'long' | 'numeric' = 'short'): string {
  if (!date) return '';
  const istDate = convertToIST(date);
  
  if (format === 'numeric') {
    return istDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  return istDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: format === 'long' ? 'long' : 'short',
    year: 'numeric'
  });
}

/**
 * Format a datetime to IST datetime string for display (dd-mm-yyyy, hh:mm AM/PM)
 * @param dateTime - Date string or Date object
 * @returns Formatted datetime string in IST
 */
export function formatDateTimeIST(dateTime: string | Date | undefined): string {
  if (!dateTime) return '';
  try {
    const istDateTime = convertToIST(dateTime);
    const dateStr = formatDateToDDMMYYYY(istDateTime);
    const timeStr = formatTimeOnlyIST(istDateTime);
    return `${dateStr}, ${timeStr}`;
  } catch {
    return '';
  }
}

/**
 * Format time only to IST time string (hh:mm AM/PM)
 * @param dateTime - Date string or Date object
 * @returns Formatted time string in IST (hh:mm AM/PM)
 */
export function formatTimeOnlyIST(dateTime: string | Date | undefined): string {
  if (!dateTime) return '';
  try {
    const istDateTime = convertToIST(dateTime);
    const hours = istDateTime.getUTCHours();
    const minutes = istDateTime.getUTCMinutes();
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  } catch {
    return '';
  }
}

/**
 * Format a time string (HH:MM) to IST time
 * Note: Simple time strings (HH:MM) are assumed to already be in IST or local time
 * Only full datetime strings need conversion
 * @param timeString - Time string in HH:MM format or full datetime string
 * @param baseDate - Base date to attach the time to (for simple time strings)
 * @returns Time string in HH:MM format (IST)
 */
export function formatTimeIST(timeString: string, baseDate?: string | Date): string {
  if (!timeString) return '';
  
  // If it's a full datetime string (contains 'T' or is ISO format), convert it
  if (timeString.includes('T') || timeString.includes('Z') || timeString.length > 10) {
    try {
      const dateObj = new Date(timeString);
      if (!isNaN(dateObj.getTime())) {
        const istDate = convertToIST(dateObj);
        const istHours = istDate.getUTCHours().toString().padStart(2, '0');
        const istMinutes = istDate.getUTCMinutes().toString().padStart(2, '0');
        return `${istHours}:${istMinutes}`;
      }
    } catch (e) {
      // Fall through to simple time string handling
    }
  }
  
  // For simple time strings (HH:MM), assume they're already in the correct timezone
  // Just validate and return as-is
  const timePattern = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
  const match = timeString.match(timePattern);
  if (match) {
    return timeString; // Return as-is, assuming already in IST
  }
  
  return timeString; // Return original if can't parse
}

/**
 * Compare two dates in IST (for filtering/comparison)
 * @param date1 - First date
 * @param date2 - Second date
 * @returns 0 if equal, negative if date1 < date2, positive if date1 > date2
 */
export function compareDatesIST(date1: string | Date, date2: string | Date): number {
  const ist1 = convertToIST(date1);
  const ist2 = convertToIST(date2);
  const date1Only = ist1.toISOString().split('T')[0];
  const date2Only = ist2.toISOString().split('T')[0];
  return date1Only.localeCompare(date2Only);
}

/**
 * Check if a date is today in IST
 * @param date - Date to check
 * @returns true if the date is today in IST
 */
export function isTodayIST(date: string | Date): boolean {
  const today = getTodayIST();
  const dateStr = formatDateIST(date);
  return today === dateStr;
}

/**
 * Get the previous day's date in IST as YYYY-MM-DD string
 * @param date - Optional date to get previous day from (defaults to today)
 * @returns Previous day's date in IST format (YYYY-MM-DD)
 */
export function getPreviousDayIST(date?: string | Date): string {
  const baseDate = date ? convertToIST(date) : convertToIST(new Date());
  const previousDay = new Date(baseDate);
  previousDay.setUTCDate(previousDay.getUTCDate() - 1);
  
  const year = previousDay.getUTCFullYear();
  const month = String(previousDay.getUTCMonth() + 1).padStart(2, '0');
  const day = String(previousDay.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a time slot spans midnight (starts on one day and ends on the next)
 * @param slotStartTime - Slot start time (HH:mm format)
 * @param slotEndTime - Slot end time (HH:mm format)
 * @returns true if slot spans midnight
 */
export function doesSlotSpanMidnight(slotStartTime: string, slotEndTime: string): boolean {
  if (!slotStartTime || !slotEndTime) return false;
  
  const startParts = slotStartTime.split(':');
  const endParts = slotEndTime.split(':');
  
  if (startParts.length < 2 || endParts.length < 2) return false;
  
  const startHour = parseInt(startParts[0], 10);
  const endHour = parseInt(endParts[0], 10);
  
  // If end hour is less than start hour, it spans midnight
  // Or if start hour is late (>= 20) and end hour is early (<= 6), it likely spans midnight
  return endHour < startHour || (startHour >= 20 && endHour <= 6);
}
