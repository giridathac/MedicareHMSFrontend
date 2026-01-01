/**
 * ISTDatePicker - A wrapper around react-datepicker that ensures all dates are in Indian Standard Time (IST)
 * 
 * This component automatically:
 * - Converts selected dates to IST before calling onChange
 * - Formats dates in IST format (YYYY-MM-DD)
 * - Ensures minDate and other date props are in IST
 * - Handles date initialization from IST date strings
 */

import React from 'react';
import DatePicker, { ReactDatePickerProps } from 'react-datepicker';
import { convertToIST, formatDateIST } from '../../utils/timeUtils';

export interface ISTDatePickerProps extends Omit<ReactDatePickerProps, 'onChange' | 'selected' | 'minDate'> {
  /**
   * Selected date value - can be a Date object or YYYY-MM-DD string (in IST)
   */
  selected?: Date | string | null;
  
  /**
   * onChange callback - receives the date string in YYYY-MM-DD format (IST) and the Date object
   */
  onChange?: (dateStr: string | null, date: Date | null) => void;
  
  /**
   * Minimum selectable date - automatically converted to IST
   */
  minDate?: Date | string | null;
  
  /**
   * Maximum selectable date - automatically converted to IST
   */
  maxDate?: Date | string | null;
  
  /**
   * Date format for display (default: "dd-MM-yyyy")
   */
  dateFormat?: string;
  
  /**
   * Placeholder text (default: "dd-mm-yyyy")
   */
  placeholderText?: string;
}

/**
 * ISTDatePicker component that ensures all date operations use Indian Standard Time
 */
export function ISTDatePicker({
  selected,
  onChange,
  minDate,
  maxDate,
  dateFormat = "dd-MM-yyyy",
  placeholderText = "dd-mm-yyyy",
  ...props
}: ISTDatePickerProps) {
  // Convert selected date to IST Date object for DatePicker
  const selectedDate = React.useMemo(() => {
    if (!selected) return null;
    if (selected instanceof Date) {
      return convertToIST(selected);
    }
    if (typeof selected === 'string') {
      return convertToIST(selected);
    }
    return null;
  }, [selected]);

  // Convert minDate to IST
  const minDateIST = React.useMemo(() => {
    if (!minDate) return undefined;
    if (minDate instanceof Date) {
      return convertToIST(minDate);
    }
    if (typeof minDate === 'string') {
      return convertToIST(minDate);
    }
    return undefined;
  }, [minDate]);

  // Convert maxDate to IST
  const maxDateIST = React.useMemo(() => {
    if (!maxDate) return undefined;
    if (maxDate instanceof Date) {
      return convertToIST(maxDate);
    }
    if (typeof maxDate === 'string') {
      return convertToIST(maxDate);
    }
    return undefined;
  }, [maxDate]);

  // Handle date change - convert to IST and format as YYYY-MM-DD
  const handleChange = (date: Date | null) => {
    if (onChange) {
      if (date) {
        // Convert selected date to IST
        const istDate = convertToIST(date);
        // Format as YYYY-MM-DD string in IST
        const dateStr = formatDateIST(istDate);
        onChange(dateStr, istDate);
      } else {
        onChange(null, null);
      }
    }
  };

  return (
    <DatePicker
      {...props}
      selected={selectedDate}
      onChange={handleChange}
      minDate={minDateIST}
      maxDate={maxDateIST}
      dateFormat={dateFormat}
      placeholderText={placeholderText}
    />
  );
}

export default ISTDatePicker;

