# Global IST (Indian Standard Time) Configuration Guide

This document outlines how Indian Standard Time (IST) is applied globally across the application.

## Overview

All dates and times in the application should use **Indian Standard Time (IST, UTC+5:30)**. This ensures consistency across all components and prevents timezone-related issues.

## IST Utilities

All IST-related utilities are located in `src/utils/timeUtils.ts`:

- `convertToIST(date)` - Converts any date to IST
- `formatDateIST(date)` - Formats date as YYYY-MM-DD in IST
- `formatDateToDDMMYYYY(date)` - Formats date as dd-mm-yyyy in IST
- `formatDateTimeIST(dateTime)` - Formats datetime in IST
- `formatTimeOnlyIST(dateTime)` - Formats time only in IST
- `getTodayIST()` - Gets today's date in IST (YYYY-MM-DD)
- `formatTimeIST(timeString)` - Formats time string in IST

## ISTDatePicker Component

A global wrapper component `ISTDatePicker` has been created at `src/components/ui/ISTDatePicker.tsx` that automatically handles IST conversion for all date pickers.

### Usage

**Before (using react-datepicker directly):**
```tsx
import DatePicker from 'react-datepicker';

<DatePicker
  selected={date}
  onChange={(date: Date | null) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      setFormData({ ...formData, date: dateStr });
    }
  }}
/>
```

**After (using ISTDatePicker):**
```tsx
import ISTDatePicker from './ui/ISTDatePicker';

<ISTDatePicker
  selected={formData.date || null}
  onChange={(dateStr, date) => {
    setFormData({ ...formData, date: dateStr || '' });
  }}
/>
```

### Benefits

- Automatic IST conversion
- Consistent date formatting (YYYY-MM-DD)
- No manual date parsing needed
- Handles minDate/maxDate in IST automatically

## Components Updated

The following components have been updated to use IST globally:

1. ✅ **FrontDesk.tsx** - All appointment dates/times use IST
2. ✅ **Laboratory.tsx** - Test dates use IST
3. ✅ **OTManagement.tsx** - OT allocation dates use IST
4. ✅ **Emergency.tsx** - Emergency admission dates use IST

## Components That Need Updates

The following components still need to be updated to use IST:

- PatientRegistration.tsx
- ManageIPDAdmission.tsx
- EditAdmission.tsx
- Admissions.tsx
- DoctorConsultation.tsx
- ICUManagement.tsx
- ICUNurseVisitVitals.tsx
- ICUBedsManagement.tsx
- RoomBeds.tsx
- Reports.tsx
- Appointments.tsx

## Migration Guide

To update a component to use IST:

1. **Replace DatePicker imports:**
   ```tsx
   // Old
   import DatePicker from 'react-datepicker';
   
   // New
   import ISTDatePicker from './ui/ISTDatePicker';
   ```

2. **Update DatePicker usage:**
   ```tsx
   // Old
   <DatePicker
     selected={dateState}
     onChange={(date: Date | null) => {
       // Manual date formatting
     }}
   />
   
   // New
   <ISTDatePicker
     selected={formData.dateField || null}
     onChange={(dateStr, date) => {
       setFormData({ ...formData, dateField: dateStr || '' });
     }}
   />
   ```

3. **Update date initialization:**
   ```tsx
   // Old
   const today = new Date();
   
   // New
   import { getTodayIST, convertToIST } from '../utils/timeUtils';
   const todayIST = getTodayIST(); // Returns YYYY-MM-DD string
   const todayDate = convertToIST(new Date()); // Returns Date object in IST
   ```

4. **Update date display:**
   ```tsx
   // Old
   {date ? new Date(date).toLocaleDateString() : '-'}
   
   // New
   import { formatDateToDDMMYYYY } from '../utils/timeUtils';
   {date ? formatDateToDDMMYYYY(date) : '-'}
   ```

5. **Update time display:**
   ```tsx
   // Old
   {time}
   
   // New
   import { formatTimeToDisplay } from '../utils/timeUtils';
   // Or use formatTimeOnlyIST for full datetime strings
   {time ? formatTimeOnlyIST(time) : '-'}
   ```

## Best Practices

1. **Always use IST utilities** for date/time operations
2. **Use ISTDatePicker** instead of react-datepicker directly
3. **Store dates as YYYY-MM-DD strings** in IST format
4. **Display dates using formatDateToDDMMYYYY** for user-friendly format
5. **Never use `new Date()` directly** without converting to IST
6. **Never use `getFullYear()`, `getMonth()`, `getDate()`** directly - use IST utilities instead

## Testing

When testing date/time functionality:

1. Verify dates are displayed in IST format (dd-mm-yyyy)
2. Verify times are displayed in IST (12-hour format with AM/PM)
3. Verify date selection uses IST calendar
4. Verify date comparisons use IST

## Configuration

IST configuration is defined in `src/config/timezone.ts`:
- `DEFAULT_TIMEZONE` - "Asia/Kolkata"
- `IST_OFFSET_MS` - 19800000 (5:30 hours in milliseconds)
- `IST_OFFSET_STRING` - "+05:30"

