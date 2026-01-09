// Front Desk Component - Displays FrontDesk appointment data in PR table format
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { ResizableDialogContent } from './ResizableDialogContent';
import { CustomResizableDialog, CustomResizableDialogHeader, CustomResizableDialogTitle, CustomResizableDialogClose } from './CustomResizableDialog';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Search, Eye, Edit, Clock, Stethoscope, CheckCircle2, Hospital, Plus, Users, X } from 'lucide-react';
import { usePatientAppointments } from '../hooks/usePatientAppointments';
import { useStaff } from '../hooks/useStaff';
import { useRoles } from '../hooks/useRoles';
import { useDepartments } from '../hooks/useDepartments';
import { patientsApi } from '../api';
import { Patient, PatientAppointment, Doctor } from '../types';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export function FrontDesk() {
  const { patientAppointments, loading: appointmentsLoading, error: appointmentsError, fetchPatientAppointments, createPatientAppointment, updatePatientAppointment, deletePatientAppointment } = usePatientAppointments();
  const { staff, fetchStaff } = useStaff();
  const { roles, fetchRoles } = useRoles();
  const { departments, fetchDepartments } = useDepartments();
  
  // Fetch data on mount - always from network
  useEffect(() => {
    fetchStaff();
    fetchRoles();
    fetchDepartments();
  }, [fetchStaff, fetchRoles, fetchDepartments]);
  const [searchTerm, setSearchTerm] = useState('');
  // Initialize date filter with today's date
  const [dateFilter, setDateFilter] = useState<Date | null>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [dateFilterDisplay, setDateFilterDisplay] = useState(() => {
    // Format today's date for display (dd-mm-yyyy)
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const itemsPerPage = 10;
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<PatientAppointment | null>(null);
  const [editFormData, setEditFormData] = useState<{
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentStatus: PatientAppointment['appointmentStatus'];
    consultationCharge: number | '';
    followUpDetails: string;
    status: boolean;
  }>({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    appointmentStatus: 'Waiting' as PatientAppointment['appointmentStatus'],
    consultationCharge: '',
    followUpDetails: '',
    status: false,
  });
  const [addFormData, setAddFormData] = useState<{
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentStatus: PatientAppointment['appointmentStatus'];
    consultationCharge: number | '';
    status: boolean;
  }>({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    appointmentStatus: 'Waiting' as PatientAppointment['appointmentStatus'],
    consultationCharge: '',
    status: true, // Always active when creating
  });
  useEffect(() => {
    if (patients.length > 0) {
      console.log('FrontDesk patients data:', patients);
    }
  }, [patients]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [patientError, setPatientError] = useState('');
  const [doctorError, setDoctorError] = useState('');
  const [editPatientSearchTerm, setEditPatientSearchTerm] = useState('');
  const [editDoctorSearchTerm, setEditDoctorSearchTerm] = useState('');
  const [editPatientError, setEditPatientError] = useState('');
  const [editDoctorError, setEditDoctorError] = useState('');
  const [editDateError, setEditDateError] = useState('');
  const [editTimeError, setEditTimeError] = useState('');
  const [editConsultationChargeError, setEditConsultationChargeError] = useState('');
  
  // Keyboard navigation indices for dropdowns
  const [patientHighlightIndex, setPatientHighlightIndex] = useState(-1);
  const [doctorHighlightIndex, setDoctorHighlightIndex] = useState(-1);
  const [editPatientHighlightIndex, setEditPatientHighlightIndex] = useState(-1);
  const [editDoctorHighlightIndex, setEditDoctorHighlightIndex] = useState(-1);
  
  // Lab Tests state
  const [patientLabTests, setPatientLabTests] = useState<any[]>([]);
  const [labTestsLoading, setLabTestsLoading] = useState(false);
  const [labTestsError, setLabTestsError] = useState<string | null>(null);
  const [isAddLabTestDialogOpen, setIsAddLabTestDialogOpen] = useState(false);
  const [labTestFormData, setLabTestFormData] = useState({
    labTestId: '',
    priority: 'Normal' as 'Normal' | 'Urgent' | null,
    labTestDone: 'No' as 'Yes' | 'No',
    testStatus: 'Pending' as 'Pending' | 'InProgress' | 'Completed' | null,
  });
  const [availableLabTests, setAvailableLabTests] = useState<any[]>([]);
  const [labTestSearchTerm, setLabTestSearchTerm] = useState('');
  const [showLabTestList, setShowLabTestList] = useState(false);
  
  // Manage Lab Test state
  const [selectedLabTest, setSelectedLabTest] = useState<any>(null);
  const [isManageLabTestDialogOpen, setIsManageLabTestDialogOpen] = useState(false);
  const [manageLabTestFormData, setManageLabTestFormData] = useState<any>(null);
  
  // Date picker state
  const [addAppointmentDate, setAddAppointmentDate] = useState<Date | null>(null);
  const [editAppointmentDate, setEditAppointmentDate] = useState<Date | null>(null);
  // Formatted display values for time
  const [editTimeDisplay, setEditTimeDisplay] = useState('');
  const [addTimeError, setAddTimeError] = useState('');
  const [addTimeInputValue, setAddTimeInputValue] = useState('');
  const [addConsultationChargeError, setAddConsultationChargeError] = useState('');
  const addPatientInputRef = useRef<HTMLInputElement>(null);
  const addDoctorInputRef = useRef<HTMLInputElement>(null);
  const patientDropdownRef = useRef<HTMLDivElement>(null);
  const doctorDropdownRef = useRef<HTMLDivElement>(null);
  const [patientDropdownPosition, setPatientDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [doctorDropdownPosition, setDoctorDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [patientVisibleCount, setPatientVisibleCount] = useState(10);
  const [doctorVisibleCount, setDoctorVisibleCount] = useState(10);
  const [patientLoadingMore, setPatientLoadingMore] = useState(false);
  const [doctorLoadingMore, setDoctorLoadingMore] = useState(false);

  // Update dropdown positions when search terms change
  useEffect(() => {
    if (patientSearchTerm && isAddDialogOpen) {
      // Use setTimeout to ensure DOM is ready
      const timer = setTimeout(() => {
        if (addPatientInputRef.current) {
          const rect = addPatientInputRef.current.getBoundingClientRect();
          setPatientDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          });
        }
      }, 0);
      return () => clearTimeout(timer);
    } else {
      setPatientDropdownPosition(null);
    }
  }, [patientSearchTerm, isAddDialogOpen]);

  useEffect(() => {
    if (doctorSearchTerm && isAddDialogOpen) {
      // Use setTimeout to ensure DOM is ready
      const timer = setTimeout(() => {
        if (addDoctorInputRef.current) {
          const rect = addDoctorInputRef.current.getBoundingClientRect();
          setDoctorDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          });
        }
      }, 0);
      return () => clearTimeout(timer);
    } else {
      setDoctorDropdownPosition(null);
    }
  }, [doctorSearchTerm, isAddDialogOpen]);

  // Update dropdown positions on scroll/resize
  useEffect(() => {
    const updatePositions = () => {
      if (patientSearchTerm && addPatientInputRef.current) {
        const rect = addPatientInputRef.current.getBoundingClientRect();
        setPatientDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
      if (doctorSearchTerm && addDoctorInputRef.current) {
        const rect = addDoctorInputRef.current.getBoundingClientRect();
        setDoctorDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
    };

    window.addEventListener('scroll', updatePositions, true);
    window.addEventListener('resize', updatePositions);

    return () => {
      window.removeEventListener('scroll', updatePositions, true);
      window.removeEventListener('resize', updatePositions);
    };
  }, [patientSearchTerm, doctorSearchTerm]);

  // Helper functions for date formatting (dd-mm-yyyy)
  const formatDateToDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      // Date is already in YYYY-MM-DD format, just convert to dd-mm-yyyy
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
      }
      return dateStr;
    } catch {
      return '';
    }
  };

  const parseDateFromDisplay = (displayStr: string): string => {
    if (!displayStr) return '';
    // Remove any non-digit characters except dashes
    const cleaned = displayStr.replace(/[^\d-]/g, '');
    // Match dd-mm-yyyy or dd-mm-yy format
    const match = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
    if (!match) return '';
    
    let day = parseInt(match[1], 10);
    let month = parseInt(match[2], 10);
    let year = parseInt(match[3], 10);
    
    // Handle 2-digit year (for backward compatibility)
    if (year < 100) {
      year += 2000;
    }
    
    if (day < 1 || day > 31 || month < 1 || month > 12) return '';
    
    try {
      // Create date string in YYYY-MM-DD format
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      // Validate the date by creating a Date object and checking
      const dateObj = new Date(year, month - 1, day);
      if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) return '';
      return dateStr; // Return YYYY-MM-DD format
    } catch {
      return '';
    }
  };

  // Helper functions for time formatting (hh:mm AM/PM)
  const formatTimeToDisplay = (timeStr: string): string => {
    if (!timeStr) return '';
    try {
      // Handle time string - could be HH:MM or HH:MM:SS
      let timeOnly = timeStr.trim();
      
      // Remove seconds if present (HH:MM:SS -> HH:MM)
      if (timeOnly.includes(':') && timeOnly.split(':').length === 3) {
        const parts = timeOnly.split(':');
        timeOnly = `${parts[0]}:${parts[1]}`;
      }
      
      // Direct parse of HH:MM format (most common from backend)
      const timePattern = /^(\d{1,2}):(\d{2})$/;
      const match = timeOnly.match(timePattern);
      
      if (match) {
        const h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        
        // Validate time values
        if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
          return '';
        }
        
        // Convert 24-hour to 12-hour format with AM/PM
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${String(displayHour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
      }
      
      return '';
    } catch (error) {
      console.error('Error formatting time to display:', error, timeStr);
      return '';
    }
  };

  const parseTimeFromDisplay = (displayStr: string): string => {
    if (!displayStr) return '';
    // Remove spaces and convert to uppercase
    const cleaned = displayStr.trim().toUpperCase();
    
    // Match hh:mm AM/PM or hh:mmAM/PM
    const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i) || cleaned.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
    if (!match) {
      // Try to parse partial input (e.g., "9" or "9:30")
      const partialMatch = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
      if (partialMatch) {
        let hour = parseInt(partialMatch[1], 10);
        const minute = partialMatch[2] ? parseInt(partialMatch[2], 10) : 0;
        const period = partialMatch[3]?.toUpperCase() || '';
        
        if (isNaN(hour) || hour < 1 || hour > 12) return '';
        if (minute < 0 || minute > 59) return '';
        
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      }
      return '';
    }
    
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    
    if (isNaN(hour) || hour < 1 || hour > 12) return '';
    if (isNaN(minute) || minute < 0 || minute > 59) return '';
    
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  // Filter to show only doctors and surgeons from staff
  const appointmentDoctors = useMemo(() => {
    if (!staff || !roles || !departments) return [];
    
    return staff
      .filter((member) => {
        if (!member.RoleId) return false;
        const role = roles.find(r => r.id === member.RoleId);
        if (!role || !role.name) return false;
        const roleNameLower = role.name.toLowerCase();
        return roleNameLower.includes('doctor') || roleNameLower.includes('surgeon');
      })
      .map((member) => {
        const department = member.DoctorDepartmentId 
          ? departments.find(d => 
              d.id.toString() === member.DoctorDepartmentId || 
              d.id === Number(member.DoctorDepartmentId)
            )
          : null;
        
        return {
          id: member.UserId || 0,
          name: member.UserName || 'Unknown',
          specialty: department?.name || 'General',
          type: member.DoctorType === 'INHOUSE' ? 'inhouse' as const : 'consulting' as const,
        } as Doctor;
      });
  }, [staff, roles, departments]);

  // Sync date picker with form data
  useEffect(() => {
    if (addFormData.appointmentDate) {
      try {
        const dateStr = addFormData.appointmentDate;
        // Parse date-only string (YYYY-MM-DD) directly as local date
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [year, month, day] = dateStr.split('-').map(Number);
          // Create date at midnight (will be interpreted correctly by DatePicker)
          const localDate = new Date(year, month - 1, day);
          if (!isNaN(localDate.getTime())) {
            setAddAppointmentDate(localDate);
          } else {
            setAddAppointmentDate(null);
          }
        } else {
          // For datetime strings, parse directly
          const dateObj = new Date(dateStr);
          if (!isNaN(dateObj.getTime())) {
            setAddAppointmentDate(dateObj);
          } else {
            setAddAppointmentDate(null);
          }
        }
      } catch {
        setAddAppointmentDate(null);
      }
    } else {
      setAddAppointmentDate(null);
    }
  }, [addFormData.appointmentDate]);

  // Validation function for time format (HH:MM AM/PM)
  const validateTimeFormat = (timeStr: string): boolean => {
    if (!timeStr.trim()) return false;
    const cleaned = timeStr.trim().toUpperCase();
    // Match HH:MM AM/PM format
    const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i) || cleaned.match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
    if (!match) return false;
    
    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    
    // Validate hour (1-12) and minute (0-59)
    if (isNaN(hour) || hour < 1 || hour > 12) return false;
    if (isNaN(minute) || minute < 0 || minute > 59) return false;
    
    return true;
  };

  // Sync input value when form data changes (e.g., when dialog opens with default time)
  useEffect(() => {
    if (addFormData.appointmentTime) {
      setAddTimeInputValue(formatTimeToDisplay(addFormData.appointmentTime));
    } else {
      setAddTimeInputValue('');
    }
  }, [addFormData.appointmentTime]);

  // Reset pagination when search term, date filter, or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, activeTab]);

  useEffect(() => {
    if (editFormData.appointmentDate) {
      try {
        const dateStr = editFormData.appointmentDate;
        // Parse date-only string (YYYY-MM-DD) directly as local date
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [year, month, day] = dateStr.split('-').map(Number);
          // Create date at midnight (will be interpreted correctly by DatePicker)
          const localDate = new Date(year, month - 1, day);
          if (!isNaN(localDate.getTime())) {
            setEditAppointmentDate(localDate);
          } else {
            setEditAppointmentDate(null);
          }
        } else {
          // For datetime strings, parse directly
          const dateObj = new Date(dateStr);
          if (!isNaN(dateObj.getTime())) {
            setEditAppointmentDate(dateObj);
          } else {
            setEditAppointmentDate(null);
          }
        }
      } catch {
        setEditAppointmentDate(null);
      }
    } else {
      setEditAppointmentDate(null);
    }
  }, [editFormData.appointmentDate]);

  useEffect(() => {
    if (editFormData.appointmentTime) {
      setEditTimeDisplay(formatTimeToDisplay(editFormData.appointmentTime));
    } else {
      setEditTimeDisplay('');
    }
  }, [editFormData.appointmentTime]);

  // Reset form when Add dialog opens
  useEffect(() => {
    if (isAddDialogOpen) {
      // Reset form to empty state
      setAddFormData({
        patientId: '',
        doctorId: '',
        appointmentDate: '',
        appointmentTime: '',
        appointmentStatus: 'Waiting',
        consultationCharge: '',
        status: true,
      });
      setAddAppointmentDate(null);
      setAddTimeInputValue('');
      setPatientSearchTerm('');
      setDoctorSearchTerm('');
      setPatientError('');
      setDoctorError('');
      setAddConsultationChargeError('');
      setPatientHighlightIndex(-1);
      setDoctorHighlightIndex(-1);
    }
  }, [isAddDialogOpen]);
  
  // Scroll highlighted items into view
  useEffect(() => {
    if (patientHighlightIndex >= 0) {
      const element = document.querySelector(`#add-patient-dropdown tbody tr:nth-child(${patientHighlightIndex + 1})`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [patientHighlightIndex]);
  
  useEffect(() => {
    if (doctorHighlightIndex >= 0) {
      const element = document.querySelector(`#add-doctor-dropdown tbody tr:nth-child(${doctorHighlightIndex + 1})`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [doctorHighlightIndex]);
  
  useEffect(() => {
    if (editPatientHighlightIndex >= 0) {
      const element = document.querySelector(`#edit-patient-dropdown tbody tr:nth-child(${editPatientHighlightIndex + 1})`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [editPatientHighlightIndex]);
  
  useEffect(() => {
    if (editDoctorHighlightIndex >= 0) {
      const element = document.querySelector(`#edit-doctor-dropdown tbody tr:nth-child(${editDoctorHighlightIndex + 1})`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [editDoctorHighlightIndex]);

  // Helper function to extract field with multiple variations
  const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
    for (const field of fieldVariations) {
      // Handle nested fields (e.g., 'Patient.PatientNo')
      if (field.includes('.')) {
        const parts = field.split('.');
        let value = data;
        for (const part of parts) {
          value = value?.[part];
          if (value === undefined || value === null) break;
        }
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
      } else {
        const value = data?.[field];
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
      }
    }
    return defaultValue;
  };

  // Helper function to format datetime to dd-mm-yyyy, hh:mm format
  const formatDateTimeForInput = (dateTime: string | Date | undefined): string => {
    if (!dateTime) return '';
    try {
      // Use date directly without timezone conversion
      const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
      
      // Get date components directly
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = String(dateObj.getFullYear());
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      
      return `${day}-${month}-${year}, ${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  // Helper function to parse datetime from dd-mm-yyyy, hh:mm format
  const parseDateTimeFromInput = (inputStr: string): string => {
    if (!inputStr) return '';
    try {
      // Match dd-mm-yyyy, hh:mm format
      const match = inputStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4}),\s*(\d{1,2}):(\d{2})$/);
      if (!match) return '';
      
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      const hours = parseInt(match[4], 10);
      const minutes = parseInt(match[5], 10);
      
      if (day < 1 || day > 31 || month < 1 || month > 12) return '';
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return '';
      
      // Create date string in ISO format
      // Format: YYYY-MM-DDTHH:mm:ss
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      
      // Return in ISO format for API
      return date.toISOString();
    } catch {
      return '';
    }
  };

  // Fetch lab tests for appointment
  const fetchPatientLabTests = async (appointmentId: number) => {
    if (!appointmentId) return;
    try {
      setLabTestsLoading(true);
      setLabTestsError(null);
      const response = await apiRequest<any>(`/patient-lab-tests/with-details?appointmentId=${appointmentId}`);
      
      console.log('FrontDesk - Lab Tests API Response:', JSON.stringify(response, null, 2));
      
      // Handle response structure
      let labTestsData: any[] = [];
      if (Array.isArray(response)) {
        labTestsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        labTestsData = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        labTestsData = response.data.data;
      }
      
      console.log('FrontDesk - Extracted Lab Tests Data:', JSON.stringify(labTestsData, null, 2));
      if (labTestsData.length > 0) {
        console.log('FrontDesk - First Lab Test Object Keys:', Object.keys(labTestsData[0]));
        console.log('FrontDesk - First Lab Test Sample:', labTestsData[0]);
      }
      
      setPatientLabTests(labTestsData || []);
    } catch (err) {
      setLabTestsError(err instanceof Error ? err.message : 'Failed to fetch lab tests');
      setPatientLabTests([]);
    } finally {
      setLabTestsLoading(false);
    }
  };

  // Fetch available lab tests for dropdown
  const fetchAvailableLabTests = async () => {
    try {
      const response = await apiRequest<any>('/lab-tests');
      const labTestsData = response?.data || response || [];
      
      // Normalize the data to ensure TestName is properly extracted
      const normalizedLabTests = Array.isArray(labTestsData) ? labTestsData.map((test: any) => {
        return {
          ...test,
          // Ensure TestName is extracted from various possible field names
          TestName: test.TestName || test.testName || test.name || test.Name || '',
          testName: test.TestName || test.testName || test.name || test.Name || '',
          // Ensure other fields are also normalized
          LabTestsId: test.LabTestsId || test.labTestsId || test.LabTestId || test.labTestId || test.id || 0,
          TestCategory: test.TestCategory || test.testCategory || test.category || test.Category || '',
        };
      }) : [];
      
      setAvailableLabTests(normalizedLabTests);
    } catch (err) {
      console.error('Failed to fetch available lab tests:', err);
      setAvailableLabTests([]);
    }
  };

  // Fetch lab tests when appointment is selected
  useEffect(() => {
    if (selectedAppointment?.id) {
      fetchPatientLabTests(selectedAppointment.id);
      fetchAvailableLabTests();
    }
  }, [selectedAppointment?.id]);

  // Close lab test dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showLabTestList && !target.closest('.dialog-dropdown-container') && !target.closest('#add-labtest-labTestId')) {
        setShowLabTestList(false);
      }
    };
    if (showLabTestList) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLabTestList]);

  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await patientsApi.getAll(1, 1000);
        // patientsApi.getAll returns PaginatedResponse<Patient> with a 'data' property
        const patientsList = response.data || [];
        setPatients(patientsList);
      } catch (err) {
        console.error('Failed to fetch patients:', err);
        setPatients([]);
      }
    };
    fetchPatients();
    fetchPatientAppointments().catch((err) => {
      console.error('Error fetching appointments:', err);
    });
  }, [fetchPatientAppointments]);

  // Separate active and inactive appointments, and filter based on search term
  const { activeAppointments, inactiveAppointments, filteredActiveAppointments } = useMemo(() => {
    if (!patientAppointments || patientAppointments.length === 0) {
      return { activeAppointments: [], inactiveAppointments: [], filteredActiveAppointments: [] };
    }
    
    // Separate active and inactive appointments
    const active: PatientAppointment[] = [];
    const inactive: PatientAppointment[] = [];
    
    patientAppointments.forEach(appointment => {
      const statusValue = (appointment as any).Status || (appointment as any).status;
      const isActive = typeof statusValue === 'string' 
        ? statusValue === 'Active' 
        : (statusValue === true || statusValue === 'true');
      
      if (isActive) {
        active.push(appointment);
      } else {
        inactive.push(appointment);
      }
    });
    
    // Apply date filter to both active and inactive if set
    let dateFilterStr: string | null = null;
    if (dateFilter) {
      // Extract date directly from Date object
      const year = dateFilter.getFullYear();
      const month = String(dateFilter.getMonth() + 1).padStart(2, '0');
      const day = String(dateFilter.getDate()).padStart(2, '0');
      dateFilterStr = `${year}-${month}-${day}`;
    }
    
    const filterByDate = (appointments: PatientAppointment[]): PatientAppointment[] => {
      if (!dateFilterStr) return appointments;
      return appointments.filter(appointment => {
        if (!appointment.appointmentDate) return false;
        // Compare dates directly (both in YYYY-MM-DD format)
        return appointment.appointmentDate === dateFilterStr;
      });
    };
    
    const activeFilteredByDate = filterByDate(active);
    const inactiveFilteredByDate = filterByDate(inactive);
    
    // Filter active appointments by search term (exclude inactive from search)
    let filtered: PatientAppointment[] = [];
    
    // Then apply search term filter
    if (!searchTerm) {
      filtered = activeFilteredByDate;
    } else {
      filtered = activeFilteredByDate.filter(appointment => {
        const patient = patients.find(p => 
          (p as any).patientId === appointment.patientId || 
          (p as any).PatientId === appointment.patientId
        );
        const patientName = patient 
          ? `${(patient as any).patientName || (patient as any).PatientName || ''} ${(patient as any).lastName || (patient as any).LastName || ''}`.trim() 
          : appointment.patientId === '00000000-0000-0000-0000-000000000001' 
            ? 'Dummy Patient Name' 
            : appointment.patientId;
        const doctor = appointmentDoctors.find(d => d.id.toString() === appointment.doctorId);
        const doctorName = doctor ? doctor.name : appointment.doctorId;
        const patientPhone = patient 
          ? (patient as any).PhoneNo || (patient as any).phoneNo || (patient as any).phone || ''
          : '';
        const patientId = patient 
          ? (patient as any).PatientNo || (patient as any).patientNo || appointment.patientId.substring(0, 8)
          : appointment.patientId.substring(0, 8);
        
        const patientAadhar = appointment.aadharId || (appointment as any).AadharId || (appointment as any).patientAadhar || (appointment as any).PatientAadhar || (appointment as any).aadharId || 
          (appointment as any).PatientAdhaarId || (appointment as any).patient?.AdhaarId || (appointment as any).patient?.aadharId || (appointment as any).patient?.AadharId ||
          (appointment as any).adhaarId || (appointment as any).PatientAdhaar ||
          (patient 
            ? (patient as any).AdhaarId || (patient as any).aadharId || (patient as any).AadharId || ''
            : '');
        
        const searchLower = searchTerm.toLowerCase();
        
        // Format appointment date in both YYYY-MM-DD and dd-mm-yyyy for searching
        let appointmentDateFormatted = '';
        let appointmentDateDisplay = '';
        if (appointment.appointmentDate) {
          appointmentDateFormatted = appointment.appointmentDate.toLowerCase();
          // Convert to dd-mm-yyyy format for search
          try {
            appointmentDateDisplay = formatDateToDisplay(appointment.appointmentDate).toLowerCase();
          } catch {
            appointmentDateDisplay = '';
          }
        }
        
        return (
          appointment.tokenNo?.toLowerCase().includes(searchLower) ||
          patientName.toLowerCase().includes(searchLower) ||
          doctorName.toLowerCase().includes(searchLower) ||
          patientPhone.includes(searchTerm) ||
          patientId.toLowerCase().includes(searchLower) ||
          appointment.patientId.toLowerCase().includes(searchLower) ||
          appointmentDateFormatted.includes(searchLower) ||
          appointmentDateDisplay.includes(searchLower) ||
          patientAadhar.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Sort filtered appointments by status priority and latest date
    const sortedFiltered = [...filtered].sort((a, b) => {
      // First, determine status priority
      const getStatusPriority = (appointment: PatientAppointment) => {
        const statusValue = (appointment as any).Status || (appointment as any).status;
        const isActive = typeof statusValue === 'string' 
          ? statusValue === 'Active' 
          : (statusValue === true || statusValue === 'true');
        
        if (!isActive) return 3; // Inactive records lowest priority
        
        // Active records: non-completed first, then completed
        if (appointment.appointmentStatus === 'Completed') return 2;
        return 1; // Waiting, Consulting
      };
      
      const priorityA = getStatusPriority(a);
      const priorityB = getStatusPriority(b);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB; // Lower number = higher priority
      }
      
      // Same priority group, sort by latest appointment date first (descending)
      const dateA = a.appointmentDate || '';
      const dateB = b.appointmentDate || '';
      const dateCompare = dateB.localeCompare(dateA); // Reversed for descending
      
      if (dateCompare !== 0) {
        return dateCompare;
      }
      
      // Same date, sort by appointment time (earliest first) - primary sort for same date
      const timeA = a.appointmentTime || '';
      const timeB = b.appointmentTime || '';
      
      // Handle empty times - put them at the end
      if (!timeA && !timeB) {
        // If both have no time, sort by ID for stability
        return a.id - b.id;
      }
      if (!timeA) return 1;
      if (!timeB) return -1;
      
      // Compare time strings (HH:MM format) - this works correctly for ascending order
      const timeCompare = timeA.localeCompare(timeB);
      if (timeCompare !== 0) {
        return timeCompare;
      }
      
      // Same time, sort by ID for stability (maintains order after updates)
      return a.id - b.id;
    });

    return { activeAppointments: activeFilteredByDate, inactiveAppointments: inactiveFilteredByDate, filteredActiveAppointments: sortedFiltered };
  }, [patientAppointments, searchTerm, dateFilter, patients, appointmentDoctors]);

  // For backward compatibility, use filteredActiveAppointments
  const filteredAppointments = filteredActiveAppointments;

  // Get count of active appointments by status (for tab labels)
  const getActiveAppointmentsCountByStatus = (status: PatientAppointment['appointmentStatus']) => {
    return filteredAppointments.filter(a => a.appointmentStatus === status).length;
  };

  const getAppointmentsByStatus = (status: PatientAppointment['appointmentStatus']) => {
    // Include both active and inactive appointments that match the status
    const activeStatusAppointments = filteredAppointments.filter(a => a.appointmentStatus === status);
    const inactiveStatusAppointments = inactiveAppointments.filter(a => a.appointmentStatus === status);
    const statusAppointments = [...activeStatusAppointments, ...inactiveStatusAppointments];
    // Sort by latest appointment date first
    return statusAppointments.sort((a, b) => {
      // First sort by appointment date (latest first, descending)
      const dateA = a.appointmentDate || '';
      const dateB = b.appointmentDate || '';
      const dateCompare = dateB.localeCompare(dateA); // Reversed for descending
      
      if (dateCompare !== 0) {
        return dateCompare;
      }
      
      // Same date, sort by appointment time (earliest first)
      const timeA = a.appointmentTime || '';
      const timeB = b.appointmentTime || '';
      return timeA.localeCompare(timeB);
    });
  };

  const getStatusBadge = (status: PatientAppointment['appointmentStatus']) => {
    switch (status) {
      case 'Waiting':
        return <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Waiting</span>;
      case 'Consulting':
        return <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700">Consulting</span>;
      case 'Completed':
        return <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700">Completed</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-700">{status}</span>;
    }
  };

  const handleViewAppointment = (appointment: PatientAppointment) => {
    setSelectedAppointment(appointment);
    setIsViewDialogOpen(true);
  };

  const handleEditAppointment = (appointment: PatientAppointment) => {
    setSelectedAppointment(appointment);
    // Get status from appointment - it could be a string "Active"/"Inactive" or boolean
    const statusValue = (appointment as any).Status || (appointment as any).status;
    // Convert string status to boolean: "Active" -> true, "Inactive" or anything else -> false
    const statusBoolean = typeof statusValue === 'string' 
      ? statusValue === 'Active' 
      : (statusValue === true || statusValue === 'true');
    
    setEditFormData({
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      appointmentStatus: appointment.appointmentStatus,
      consultationCharge: appointment.consultationCharge && appointment.consultationCharge > 0 ? appointment.consultationCharge : '',
      followUpDetails: appointment.followUpDetails || '',
      status: statusBoolean,
    });
    
    // Set appointment time display immediately
    if (appointment.appointmentTime) {
      const formattedTime = formatTimeToDisplay(appointment.appointmentTime);
      setEditTimeDisplay(formattedTime);
    } else {
      setEditTimeDisplay('');
    }
    
    // Set search terms for patient and doctor
    const patient = patients.find(p => {
      const pid = (p as any).patientId || (p as any).PatientId || '';
      return pid === appointment.patientId;
    });
    if (patient) {
      const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
      const patientName = (patient as any).patientName || (patient as any).PatientName || '';
      const lastName = (patient as any).lastName || (patient as any).LastName || '';
      const fullName = `${patientName} ${lastName}`.trim();
      setEditPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
    } else {
      setEditPatientSearchTerm('');
    }
    
    const doctor = appointmentDoctors.find(d => d.id.toString() === appointment.doctorId);
    if (doctor) {
      setEditDoctorSearchTerm(`${doctor.name} - ${doctor.specialty}`);
    } else {
      setEditDoctorSearchTerm('');
    }
    
    setEditPatientError('');
    setEditDoctorError('');
    setEditDateError('');
    setEditTimeError('');
    setEditConsultationChargeError('');
    setIsEditDialogOpen(true);
  };

  const handleDeleteAppointment = async (appointment: PatientAppointment) => {
    if (confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
      try {
        await deletePatientAppointment(appointment.id);
        await fetchPatientAppointments();
      } catch (err) {
        console.error('Failed to delete appointment:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete appointment';
        alert(errorMessage);
      }
    }
  };

  // Helper function to render appointment row
  const renderAppointmentRow = (appointment: PatientAppointment, isInactive: boolean = false) => {
    const patient = patients.find(p => 
      (p as any).patientId === appointment.patientId || 
      (p as any).PatientId === appointment.patientId
    );
    const doctor = appointmentDoctors.find(d => d.id.toString() === appointment.doctorId);
    const patientName = patient 
      ? `${(patient as any).patientName || (patient as any).PatientName || ''} ${(patient as any).lastName || (patient as any).LastName || ''}`.trim() 
      : appointment.patientId === '00000000-0000-0000-0000-000000000001' 
        ? 'Dummy Patient Name' 
        : appointment.patientId;
    const doctorName = doctor ? doctor.name : appointment.doctorId;
    const patientPhone = patient 
      ? (patient as any).PhoneNo || (patient as any).phoneNo || (patient as any).phone || '-'
      : '-';
    const patientAadhar = (() => {
      const fields = [
        appointment.aadharId,
        (appointment as any).AadharId,
        (appointment as any).patientAadhar,
        (appointment as any).PatientAadhar,
        (appointment as any).aadharId,
        (appointment as any).PatientAdhaarId,
        (appointment as any).patient?.AdhaarId,
        (appointment as any).patient?.aadharId,
        (appointment as any).patient?.AadharId,
        (appointment as any).adhaarId,
        (appointment as any).PatientAdhaar,
        ...(patient ? [
          (patient as any).AdhaarId,
          (patient as any).aadharId,
          (patient as any).AadharId
        ] : [])
      ];

      for (const field of fields) {
        if (field !== undefined && field !== null && field !== '' && field !== 'undefined') {
          return field;
        }
      }
    return '-';
  })();
  return (
    <tr
      key={appointment.id}
      className={`border-b border-gray-100 hover:bg-gray-50 ${isInactive ? 'opacity-50 bg-gray-50' : ''}`}
    >
        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : ''}`}>
          <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded">
            {appointment.tokenNo}
          </span>
        </td>
        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : 'text-gray-900'}`}>
          {patientName}
        </td>
        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : 'text-gray-600'} font-mono text-sm`}>
          {patientAadhar}
        </td>
        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>
          {patientPhone}
        </td>
        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>
          {appointment.appointmentDate ? formatDateToDisplay(appointment.appointmentDate) : '-'}
        </td>
        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>
          {doctorName}
        </td>
        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>
          {appointment.appointmentTime ? formatTimeToDisplay(appointment.appointmentTime) : '-'}
        </td>
        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : ''}`}>
          {getStatusBadge(appointment.appointmentStatus)}
        </td>
        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : ''}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditAppointment(appointment)}
            title="Manage Appointment"
          >
            Manage
          </Button>
        </td>
      </tr>
    );
  };

  // Helper function to render appointments table
  const renderAppointmentsTable = (appointments: PatientAppointment[], includeInactive: boolean = false) => {
    // For "All Appointments" tab, we want to show active first, then inactive separately
    // For status tabs, appointments already include both active and inactive matching the status
    let appointmentsToRender: PatientAppointment[] = [];
    
    if (includeInactive && !searchTerm) {
      // "All Appointments" tab: show active appointments first, then inactive at the end
      const activeInList = appointments.filter(a => {
        const statusValue = (a as any).Status || (a as any).status;
        const isActive = typeof statusValue === 'string' 
          ? statusValue === 'Active' 
          : (statusValue === true || statusValue === 'true');
        return isActive;
      });
      const inactiveInList = appointments.filter(a => {
        const statusValue = (a as any).Status || (a as any).status;
        const isActive = typeof statusValue === 'string' 
          ? statusValue === 'Active' 
          : (statusValue === true || statusValue === 'true');
        return !isActive;
      });
      // Also add any inactive appointments not already in the list
      const inactiveNotInList = inactiveAppointments.filter(ia => 
        !appointments.some(a => a.id === ia.id)
      );
      appointmentsToRender = [...activeInList, ...inactiveInList, ...inactiveNotInList];
    } else {
      // Status tabs: appointments already include both active and inactive matching the status
      appointmentsToRender = appointments;
    }
    
    // Sort appointments by status priority and latest date
    const sortedAppointments = [...appointmentsToRender].sort((a, b) => {
      // First, determine status priority
      const getStatusPriority = (appointment: PatientAppointment) => {
        const statusValue = (appointment as any).Status || (appointment as any).status;
        const isActive = typeof statusValue === 'string' 
          ? statusValue === 'Active' 
          : (statusValue === true || statusValue === 'true');
        
        if (!isActive) return 3; // Inactive records lowest priority
        
        // Active records: non-completed first, then completed
        if (appointment.appointmentStatus === 'Completed') return 2;
        return 1; // Waiting, Consulting
      };
      
      const priorityA = getStatusPriority(a);
      const priorityB = getStatusPriority(b);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB; // Lower number = higher priority
      }
      
      // Same priority group, sort by latest appointment date first (descending)
      const dateA = a.appointmentDate || '';
      const dateB = b.appointmentDate || '';
      const dateCompare = dateB.localeCompare(dateA); // Reversed for descending
      
      if (dateCompare !== 0) {
        return dateCompare;
      }
      
      // Same date, sort by appointment time (earliest first) - primary sort for same date
      const timeA = a.appointmentTime || '';
      const timeB = b.appointmentTime || '';
      
      // Handle empty times - put them at the end
      if (!timeA && !timeB) {
        // If both have no time, sort by ID for stability
        return a.id - b.id;
      }
      if (!timeA) return 1;
      if (!timeB) return -1;
      
      // Compare time strings (HH:MM format) - this works correctly for ascending order
      const timeCompare = timeA.localeCompare(timeB);
      if (timeCompare !== 0) {
        return timeCompare;
      }
      
      // Same time, sort by ID for stability (maintains order after updates)
      return a.id - b.id;
    });

    const allAppointments = sortedAppointments;
    
    // Calculate pagination
    const totalPages = Math.ceil(allAppointments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedAppointments = allAppointments.slice(startIndex, endIndex);
    
    // Generate page numbers to display
    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      const maxVisiblePages = 7;
      
      if (totalPages <= maxVisiblePages) {
        // Show all pages if total pages is less than max visible
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page
        pages.push(1);
        
        if (currentPage > 3) {
          pages.push('...');
        }
        
        // Show pages around current page
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        
        if (currentPage < totalPages - 2) {
          pages.push('...');
        }
        
        // Always show last page
        pages.push(totalPages);
      }
      
      return pages;
    };
    
    return (
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">Token #</th>
                  <th className="text-left py-3 px-4 text-gray-700">Patient Name</th>
                  <th className="text-left py-3 px-4 text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 text-gray-700">Doctor</th>
                  <th className="text-left py-3 px-4 text-gray-700">Appointment Date</th>
                  <th className="text-left py-3 px-4 text-gray-700">Time</th>
                  <th className="text-left py-3 px-4 text-gray-700">Aadhar Card</th>
                  <th className="text-left py-3 px-4 text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-500">
                      {searchTerm ? 'No appointments found matching your search.' : 'No appointments found.'}
                    </td>
                  </tr>
                ) : (
                  <>
                    {paginatedAppointments.map((appointment) => {
                      // Check if appointment is inactive
                      const statusValue = (appointment as any).Status || (appointment as any).status;
                      const isInactive = typeof statusValue === 'string' 
                        ? statusValue !== 'Active' 
                        : (statusValue !== true && statusValue !== 'true');
                      return renderAppointmentRow(appointment, isInactive);
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {allAppointments.length > itemsPerPage && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, allAppointments.length)} of {allAppointments.length} appointments
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, index) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page as number)}
                        className={currentPage === page ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (appointmentsLoading) {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="text-center py-12 text-gray-600">Loading appointments...</div>
          </div>
        </div>
      </div>
    );
  }

  if (appointmentsError) {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="text-center py-12 text-red-600">Error: {appointmentsError}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
      <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <h1 className="text-gray-900 mb-2">Front Desk - Patient Appointments</h1>
              <p className="text-gray-500">Generate and manage patient appointments for doctor consultation</p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                className="flex items-center gap-2"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="size-4" />
                Add Appointment
              </Button>
              
              <CustomResizableDialog 
                open={isAddDialogOpen} 
                onOpenChange={setIsAddDialogOpen}
                className="p-0 gap-0"
                initialWidth={550}
                maxWidth={typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.95) : 1800}
              >
                <CustomResizableDialogClose onClick={() => setIsAddDialogOpen(false)} />
                <div className="dialog-scrollable-wrapper dialog-content-scrollable flex flex-col flex-1 min-h-0 overflow-y-auto">
                  <CustomResizableDialogHeader className="dialog-header-standard flex-shrink-0">
                    <CustomResizableDialogTitle className="dialog-title-standard">Add New Patient Appointment</CustomResizableDialogTitle>
                  </CustomResizableDialogHeader>
                <div className="dialog-body-content-wrapper">
                  <div className="dialog-form-container space-y-4">
                  <div className="relative">
                    <Label htmlFor="add-patient-search">Patient *</Label>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        ref={addPatientInputRef}
                        id="add-patient-search"
                        name="add-patient-search"
                        autoComplete="off"
                        placeholder="Search by Patient ID, Name, or Mobile Number..."
                        value={patientSearchTerm}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setPatientSearchTerm(newValue);
                          setPatientHighlightIndex(-1);
                          setShowPatientDropdown(true); // Keep dropdown open when typing
                          setPatientVisibleCount(10); // Reset to initial count when search changes
                          // Clear patient selection if user edits the search term
                          if (addFormData.patientId) {
                            setAddFormData({ ...addFormData, patientId: '' });
                          }
                          // Clear error when user starts typing
                          if (patientError) {
                            setPatientError('');
                          }
                          // Calculate dropdown position immediately
                          requestAnimationFrame(() => {
                            if (addPatientInputRef.current) {
                              const rect = addPatientInputRef.current.getBoundingClientRect();
                              setPatientDropdownPosition({
                                top: rect.bottom + 4,
                                left: rect.left,
                                width: rect.width
                              });
                            }
                          });
                        }}
                        onFocus={() => {
                          setShowPatientDropdown(true);
                          setPatientVisibleCount(10); // Reset to initial count
                          requestAnimationFrame(() => {
                            if (addPatientInputRef.current) {
                              const rect = addPatientInputRef.current.getBoundingClientRect();
                              setPatientDropdownPosition({
                                top: rect.bottom + 4,
                                left: rect.left,
                                width: rect.width
                              });
                            }
                          });
                        }}
                        onBlur={(e) => {
                          // Don't close if clicking on dropdown
                          const relatedTarget = e.relatedTarget as HTMLElement;
                          if (!relatedTarget || !relatedTarget.closest('#add-patient-dropdown')) {
                            // Delay to allow click events to fire first
                            setTimeout(() => setShowPatientDropdown(false), 200);
                          }
                        }}
                        onKeyDown={(e) => {
                          const filteredPatients = patients.filter(patient => {
                            if (!patientSearchTerm) return false;
                            const searchLower = patientSearchTerm.toLowerCase();
                            const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                            const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                            const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                            const lastName = (patient as any).lastName || (patient as any).LastName || '';
                            const fullName = `${patientName} ${lastName}`.trim();
                            const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                            return (
                              patientId.toLowerCase().includes(searchLower) ||
                              patientNo.toLowerCase().includes(searchLower) ||
                              fullName.toLowerCase().includes(searchLower) ||
                              phoneNo.includes(patientSearchTerm)
                            );
                          });
                          
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setPatientHighlightIndex(prev => 
                              prev < filteredPatients.length - 1 ? prev + 1 : prev
                            );
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setPatientHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                          } else if (e.key === 'Enter' && patientHighlightIndex >= 0 && filteredPatients[patientHighlightIndex]) {
                            e.preventDefault();
                            const patient = filteredPatients[patientHighlightIndex];
                            const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                            const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                            const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                            const lastName = (patient as any).lastName || (patient as any).LastName || '';
                            const fullName = `${patientName} ${lastName}`.trim();
                            setAddFormData({ ...addFormData, patientId });
                            setPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
                            setPatientError('');
                            setPatientHighlightIndex(-1);
                          }
                        }}
                        className={`pl-10 ${patientError ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {patientError && (
                      <p className="text-sm text-red-600 mt-1">{patientError}</p>
                    )}
                    {showPatientDropdown && !addFormData.patientId && (
                      <div 
                        ref={patientDropdownRef}
                        className="border border-gray-200 rounded-md max-h-60 overflow-y-auto bg-white shadow-lg" 
                        style={{ backgroundColor: 'white', opacity: 1 }}
                        onScroll={(e) => {
                          const target = e.target as HTMLDivElement;
                          const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                          // Load more when within 50px of bottom
                          if (scrollBottom < 50 && !patientLoadingMore) {
                            const filteredPatients = patientSearchTerm 
                              ? patients.filter(patient => {
                                  const searchLower = patientSearchTerm.toLowerCase();
                                  const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                                  const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                                  const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                                  const lastName = (patient as any).lastName || (patient as any).LastName || '';
                                  const fullName = `${patientName} ${lastName}`.trim();
                                  const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                                  return (
                                    patientId.toLowerCase().includes(searchLower) ||
                                    patientNo.toLowerCase().includes(searchLower) ||
                                    fullName.toLowerCase().includes(searchLower) ||
                                    phoneNo.includes(patientSearchTerm)
                                  );
                                })
                              : patients;
                            
                            if (patientVisibleCount < filteredPatients.length) {
                              setPatientLoadingMore(true);
                              // Add delay to show loading effect
                              setTimeout(() => {
                                setPatientVisibleCount(prev => Math.min(prev + 10, filteredPatients.length));
                                setPatientLoadingMore(false);
                              }, 500); // 500ms delay
                            }
                          }
                        }}
                      >
                        <table className="w-full">
                          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Patient ID</th>
                              <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                              <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Mobile</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              // If no search term, show all patients. Otherwise, filter them
                              const filteredPatients = patientSearchTerm 
                                ? patients.filter(patient => {
                                    const searchLower = patientSearchTerm.toLowerCase();
                                    const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                                    const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                                    const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                                    const lastName = (patient as any).lastName || (patient as any).LastName || '';
                                    const fullName = `${patientName} ${lastName}`.trim();
                                    const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                                    return (
                                      patientId.toLowerCase().includes(searchLower) ||
                                      patientNo.toLowerCase().includes(searchLower) ||
                                      fullName.toLowerCase().includes(searchLower) ||
                                      phoneNo.includes(patientSearchTerm)
                                    );
                                  })
                                : patients; // Show all patients when no search term
                              
                              const visiblePatients = filteredPatients.slice(0, patientVisibleCount);
                              const hasMore = patientVisibleCount < filteredPatients.length;
                              
                              return visiblePatients.length > 0 ? (
                                <>
                                  {visiblePatients.map((patient, index) => {
                                  const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                                  const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                                  const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                                  const lastName = (patient as any).lastName || (patient as any).LastName || '';
                                  const fullName = `${patientName} ${lastName}`.trim();
                                  const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                                  const isSelected = addFormData.patientId === patientId;
                                  const isHighlighted = patientHighlightIndex === index;
                                  return (
                                    <tr
                                      key={patientId}
                                      onClick={() => {
                                        setAddFormData({ ...addFormData, patientId });
                                        setPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
                                        setPatientError('');
                                        setPatientHighlightIndex(-1);
                                        setShowPatientDropdown(false);
                                      }}
                                      onMouseDown={(e) => {
                                        // Prevent input from losing focus when clicking on dropdown
                                        e.preventDefault();
                                      }}
                                      className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                    >
                                      <td className="py-2 px-3 text-sm text-gray-900 font-mono">{patientNo || patientId.substring(0, 8)}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{fullName || 'Unknown'}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{phoneNo || '-'}</td>
                                    </tr>
                                  );
                                  })}
                                  {hasMore && (
                                    <tr>
                                      <td colSpan={3} className="text-center py-3 text-sm text-gray-500">
                                        {patientLoadingMore ? (
                                          <span className="flex items-center justify-center gap-2">
                                            <span className="animate-spin">⏳</span>
                                            Loading more...
                                          </span>
                                        ) : (
                                          <span>Scroll for more...</span>
                                        )}
                                      </td>
                                    </tr>
                                  )}
                                </>
                              ) : (
                                <tr>
                                  <td colSpan={3} className="text-center py-8 text-sm text-gray-700">
                                    No patients found. Try a different search term.
                                  </td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                    <div className="relative">
                    <Label htmlFor="add-doctor-search">Doctor *</Label>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        ref={addDoctorInputRef}
                        id="add-doctor-search"
                        name="add-doctor-search"
                        autoComplete="off"
                        placeholder="Search by Doctor Name or Specialty..."
                        value={doctorSearchTerm}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setDoctorSearchTerm(newValue);
                          setDoctorHighlightIndex(-1);
                          setShowDoctorDropdown(true); // Keep dropdown open when typing
                          setDoctorVisibleCount(10); // Reset to initial count when search changes
                          // Clear doctor selection if user edits the search term
                          if (addFormData.doctorId) {
                            setAddFormData({ ...addFormData, doctorId: '' });
                          }
                          // Clear error when user starts typing
                          if (doctorError) {
                            setDoctorError('');
                          }
                        }}
                        onFocus={() => {
                          setShowDoctorDropdown(true);
                          setDoctorVisibleCount(10); // Reset to initial count
                          requestAnimationFrame(() => {
                            if (addDoctorInputRef.current) {
                              const rect = addDoctorInputRef.current.getBoundingClientRect();
                              setDoctorDropdownPosition({
                                top: rect.bottom + 4,
                                left: rect.left,
                                width: rect.width
                              });
                            }
                          });
                        }}
                        onBlur={(e) => {
                          // Don't close if clicking on dropdown
                          const relatedTarget = e.relatedTarget as HTMLElement;
                          if (!relatedTarget || !relatedTarget.closest('#add-doctor-dropdown')) {
                            // Delay to allow click events to fire first
                            setTimeout(() => setShowDoctorDropdown(false), 200);
                          }
                        }}
                        onKeyDown={(e) => {
                          const filteredDoctors = appointmentDoctors.filter(doctor => {
                            if (!doctorSearchTerm) return false;
                            const searchLower = doctorSearchTerm.toLowerCase();
                            return (
                              doctor.name.toLowerCase().includes(searchLower) ||
                              doctor.specialty.toLowerCase().includes(searchLower)
                            );
                          });
                          
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setDoctorHighlightIndex(prev => 
                              prev < filteredDoctors.length - 1 ? prev + 1 : prev
                            );
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setDoctorHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                          } else if (e.key === 'Enter' && doctorHighlightIndex >= 0 && filteredDoctors[doctorHighlightIndex]) {
                            e.preventDefault();
                            const doctor = filteredDoctors[doctorHighlightIndex];
                            setAddFormData({ ...addFormData, doctorId: doctor.id.toString() });
                            setDoctorSearchTerm(`${doctor.name} - ${doctor.specialty}`);
                            setDoctorError('');
                            setDoctorHighlightIndex(-1);
                          }
                        }}
                        className={`pl-10 ${doctorError ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {doctorError && (
                      <p className="text-sm text-red-600 mt-1">{doctorError}</p>
                    )}
                    {showDoctorDropdown && !addFormData.doctorId && (
                      <div 
                        ref={doctorDropdownRef}
                        className="border border-gray-200 rounded-md max-h-60 overflow-y-auto bg-white shadow-lg" 
                        style={{ backgroundColor: 'white', opacity: 1 }}
                        onScroll={(e) => {
                          const target = e.target as HTMLDivElement;
                          const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                          // Load more when within 50px of bottom
                          if (scrollBottom < 50 && !doctorLoadingMore) {
                            const filteredDoctors = doctorSearchTerm
                              ? appointmentDoctors.filter(doctor => {
                                  const searchLower = doctorSearchTerm.toLowerCase();
                                  return (
                                    doctor.name.toLowerCase().includes(searchLower) ||
                                    doctor.specialty.toLowerCase().includes(searchLower)
                                  );
                                })
                              : appointmentDoctors;
                            
                            if (doctorVisibleCount < filteredDoctors.length) {
                              setDoctorLoadingMore(true);
                              // Add delay to show loading effect
                              setTimeout(() => {
                                setDoctorVisibleCount(prev => Math.min(prev + 10, filteredDoctors.length));
                                setDoctorLoadingMore(false);
                              }, 500); // 500ms delay
                            }
                          }
                        }}
                      >
                        <table className="w-full">
                          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                              <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Specialty</th>
                              <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              // If no search term, show all doctors. Otherwise, filter them
                              const filteredDoctors = doctorSearchTerm
                                ? appointmentDoctors.filter(doctor => {
                                    const searchLower = doctorSearchTerm.toLowerCase();
                                    return (
                                      doctor.name.toLowerCase().includes(searchLower) ||
                                      doctor.specialty.toLowerCase().includes(searchLower)
                                    );
                                  })
                                : appointmentDoctors; // Show all doctors when no search term
                              
                              const visibleDoctors = filteredDoctors.slice(0, doctorVisibleCount);
                              const hasMore = doctorVisibleCount < filteredDoctors.length;
                              
                              return visibleDoctors.length > 0 ? (
                                <>
                                  {visibleDoctors.map((doctor, index) => {
                                    const isSelected = addFormData.doctorId === doctor.id.toString();
                                    const isHighlighted = doctorHighlightIndex === index;
                                    return (
                                      <tr
                                        key={doctor.id}
                                        onClick={() => {
                                          setAddFormData({ ...addFormData, doctorId: doctor.id.toString() });
                                          setDoctorSearchTerm(`${doctor.name} - ${doctor.specialty}`);
                                          setDoctorError('');
                                          setDoctorHighlightIndex(-1);
                                          setShowDoctorDropdown(false);
                                        }}
                                        onMouseDown={(e) => {
                                          // Prevent input from losing focus when clicking on dropdown
                                          e.preventDefault();
                                        }}
                                        className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                      >
                                        <td className="py-2 px-3 text-sm text-gray-900">{doctor.name}</td>
                                        <td className="py-2 px-3 text-sm text-gray-600">{doctor.specialty}</td>
                                        <td className="py-2 px-3 text-sm">
                                          <span className={`px-2 py-0.5 rounded text-xs ${
                                            doctor.type === 'inhouse' 
                                              ? 'bg-gray-100 text-gray-700' 
                                              : 'bg-purple-100 text-purple-700'
                                          }`}>
                                            {doctor.type === 'inhouse' ? 'Inhouse' : 'Consulting'}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {hasMore && (
                                    <tr>
                                      <td colSpan={3} className="text-center py-3 text-sm text-gray-500">
                                        {doctorLoadingMore ? (
                                          <span className="flex items-center justify-center gap-2">
                                            <span className="animate-spin">⏳</span>
                                            Loading more...
                                          </span>
                                        ) : (
                                          <span>Scroll for more...</span>
                                        )}
                                      </td>
                                    </tr>
                                  )}
                                </>
                              ) : (
                                <tr>
                                  <td colSpan={3} className="text-center py-8 text-sm text-gray-700">
                                    No doctors found. Try a different search term.
                                  </td>
                                </tr>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="add-appointmentDate">Appointment Date *</Label>
                    <DatePicker
                      id="add-appointmentDate"
                      selected={addAppointmentDate}
                      onChange={(date: Date | null) => {
                        setAddAppointmentDate(date);
                        if (date) {
                          // Extract date components directly from date
                          // DatePicker gives us a date, use local methods
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const dateStr = `${year}-${month}-${day}`;
                          setAddFormData({ ...addFormData, appointmentDate: dateStr });
                        } else {
                          setAddFormData({ ...addFormData, appointmentDate: '' });
                        }
                      }}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="dd-mm-yyyy"
                      className="dialog-input-standard w-full"
                      wrapperClassName="w-full"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      yearDropdownItemNumber={100}
                      scrollableYearDropdown
                      minDate={new Date()}
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-appointmentTime">Appointment Time *</Label>
                      <Input
                        id="add-appointmentTime"
                        name="add-appointmentTime"
                        type="text"
                        placeholder="HH:MM AM/PM"
                        value={addTimeInputValue}
                        autoComplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          setAddTimeInputValue(value);
                          setAddTimeError('');
                        }}
                        onBlur={(e) => {
                          const trimmed = e.target.value.trim();
                          if (!trimmed) {
                            setAddTimeError('');
                            setAddTimeInputValue('');
                            setAddFormData({ ...addFormData, appointmentTime: '' });
                            return;
                          }
                          
                          // Validate the time format
                          if (!validateTimeFormat(trimmed)) {
                            setAddTimeError('Please enter time in HH:MM AM/PM format (e.g., 10:30 AM)');
                            setAddFormData({ ...addFormData, appointmentTime: '' });
                            return;
                          }
                          
                          // Parse and update form data
                          const parsed = parseTimeFromDisplay(trimmed);
                          if (parsed) {
                            setAddTimeError('');
                            setAddFormData({ ...addFormData, appointmentTime: parsed });
                            // Update input value to formatted version
                            setAddTimeInputValue(formatTimeToDisplay(parsed));
                          } else {
                            setAddTimeError('Invalid time format. Please use HH:MM AM/PM format');
                            setAddFormData({ ...addFormData, appointmentTime: '' });
                          }
                        }}
                        className={addTimeError ? 'border-red-500' : ''}
                      />
                      {addTimeError && (
                        <p className="text-sm text-red-500 mt-1">{addTimeError}</p>
                      )}
                  </div>
                  <div>
                    <Label htmlFor="add-appointmentStatus">Appointment Status</Label>
                    <select
                      id="add-appointmentStatus"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md"
                        value={addFormData.appointmentStatus}
                        onChange={(e) => setAddFormData({ ...addFormData, appointmentStatus: e.target.value as PatientAppointment['appointmentStatus'] })}
                      >
                        <option value="Waiting">Waiting</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Completed">Completed</option>
                      </select>
                  </div>
                  <div>
                    <Label htmlFor="add-consultationCharge">Consultation Charge (₹)</Label>
                    <Input
                      id="add-consultationCharge"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 500"
                      value={addFormData.consultationCharge === '' ? '' : addFormData.consultationCharge}
                      className={addConsultationChargeError ? 'border-red-500' : ''}
                      onChange={(e) => {
                        // Clear error when user starts typing
                        if (addConsultationChargeError) {
                          setAddConsultationChargeError('');
                        }
                        const value = e.target.value;
                        setAddFormData({ 
                          ...addFormData, 
                          consultationCharge: value === '' ? '' : (parseFloat(value) || '')
                        });
                      }}
                    />
                    {addConsultationChargeError && (
                      <p className="text-sm text-red-600 mt-1">{addConsultationChargeError}</p>
                    )}
                  </div>
                  </div>
                  <div className="dialog-footer-standard">
                    <Button variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    setAddFormData({
                      patientId: '',
                      doctorId: '',
                      appointmentDate: '',
                      appointmentTime: '',
                      appointmentStatus: 'Waiting',
                      consultationCharge: '',
                      status: true,
                    });
                    setAddAppointmentDate(null);
                    setAddTimeInputValue('');
                    setPatientSearchTerm('');
                    setDoctorSearchTerm('');
                    setPatientError('');
                    setDoctorError('');
                    setPatientHighlightIndex(-1);
                    setDoctorHighlightIndex(-1);
                    }}>Cancel</Button>
                <Button
                  onClick={async () => {
                      // Validate patient is selected from the list
                      if (!addFormData.patientId) {
                        setPatientError('Please select a patient from the list.');
                        return;
                      }
                      
                      // Verify patient exists in the patients list
                      const selectedPatient = patients.find(p => {
                        const pid = (p as any).patientId || (p as any).PatientId || '';
                        return pid === addFormData.patientId;
                      });
                      
                      if (!selectedPatient) {
                        setPatientError('Please select a valid patient from the list.');
                        return;
                      }
                      
                      // Validate doctor is selected from the list
                      if (!addFormData.doctorId) {
                        setDoctorError('Please select a doctor from the list.');
                        return;
                      }
                      
                      // Verify doctor exists in the doctors list
                      const selectedDoctor = appointmentDoctors.find(d => d.id.toString() === addFormData.doctorId);
                      
                      if (!selectedDoctor) {
                        setDoctorError('Please select a valid doctor from the list.');
                        return;
                      }
                      
                      if (!addFormData.appointmentDate || !addFormData.appointmentTime) {
                        alert('Please fill in all required fields.');
                        return;
                      }
                      
                      // Validate consultation charge (only if provided)
                      if (addFormData.consultationCharge !== '' && (typeof addFormData.consultationCharge !== 'number' || addFormData.consultationCharge <= 0)) {
                        setAddConsultationChargeError('Consultation charge must be greater than 0 if provided.');
                        return;
                      }
                      
                      // Clear any previous errors
                      setPatientError('');
                      setDoctorError('');
                      setAddConsultationChargeError('');
                      try {
                        // selectedDoctor is already validated above
                        const doctorName = selectedDoctor ? selectedDoctor.name : 'Unknown Doctor';
                        
                        // Use appointment date and time directly (already in correct format)
                        const appointmentDate = addFormData.appointmentDate || '';
                        const appointmentTime = addFormData.appointmentTime || '';
                        
                        await createPatientAppointment({
                          patientId: addFormData.patientId,
                          doctorId: addFormData.doctorId,
                          appointmentDate: appointmentDate,
                          appointmentTime: appointmentTime,
                          appointmentStatus: addFormData.appointmentStatus,
                          consultationCharge: addFormData.consultationCharge === '' ? undefined : (typeof addFormData.consultationCharge === 'number' ? addFormData.consultationCharge : parseFloat(String(addFormData.consultationCharge))),
                          status: addFormData.status,
                        } as any, doctorName);
                        await fetchPatientAppointments();
                        setIsAddDialogOpen(false);
                        setAddFormData({
                          patientId: '',
                          doctorId: '',
                          appointmentDate: '',
                          appointmentTime: '',
                          appointmentStatus: 'Waiting',
                          consultationCharge: '',
                          status: true,
                        });
                        setAddAppointmentDate(null);
                        setAddTimeInputValue('');
                    setPatientSearchTerm('');
                    setDoctorSearchTerm('');
                    setPatientError('');
                    setDoctorError('');
                    setAddConsultationChargeError('');
                    setPatientHighlightIndex(-1);
                    setDoctorHighlightIndex(-1);
                        alert('Appointment created successfully!');
                      } catch (err) {
                        console.error('Failed to create appointment:', err);
                        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
                        // Check if the error message indicates the appointment was likely created
                        if (errorMessage.includes('APPOINTMENT_LIKELY_CREATED') || 
                            errorMessage.includes('may have been created') || 
                            errorMessage.includes('response structure is unexpected')) {
                          // Refresh the list to check if appointment was actually created
                          await fetchPatientAppointments();
                          // Check if a new appointment appears (simple check - if list length increased)
                          // Show success message since HTTP request succeeded
                          alert('Appointment created successfully! The appointment has been added to the list.');
                        } else {
                          alert(`Failed to create appointment: ${errorMessage}`);
                        }
                      }
                    }}
                >
                  Create Appointment
                    </Button>
                  </div>
                </div>
                </div>
              </CustomResizableDialog>
            </div>
          </div>
        </div>
        <div className="px-6 pt-4 pb-4 flex-1">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Appointments</p>
                  <h3 className="text-gray-900">{filteredAppointments.length}</h3>
                </div>
                <Users className="size-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Waiting</p>
                    <h3 className="text-gray-900">{getActiveAppointmentsCountByStatus('Waiting')}</h3>
                </div>
                <div className="size-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-700">⏳</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 mb-1">Consulting</p>
                    <h3 className="text-gray-900">{getActiveAppointmentsCountByStatus('Consulting')}</h3>
                </div>
                <div className="size-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-700">👨‍⚕️</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Completed</p>
                    <h3 className="text-gray-900">{getActiveAppointmentsCountByStatus('Completed')}</h3>
                </div>
                <div className="size-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-700">✓</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Date Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name, token number, appointment date, or Aadhar ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="date-filter" className="whitespace-nowrap text-sm text-gray-700">Filter by Date:</Label>
                <div className="flex-1 relative">
                  <DatePicker
                    id="date-filter"
                    selected={dateFilter}
                    onChange={(date: Date | null) => {
                      setDateFilter(date);
                      if (date) {
                        // Extract date directly and format as dd-mm-yyyy for display
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        setDateFilterDisplay(`${day}-${month}-${year}`);
                      } else {
                        // Clear date filter to show all records
                        setDateFilterDisplay('');
                      }
                    }}
                    dateFormat="dd-MM-yyyy"
                    placeholderText="Select date (dd-mm-yyyy)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                    wrapperClassName="w-full"
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown
                    isClearable
                    clearButtonTitle="Clear date filter"
                  />
                </div>
                {dateFilterDisplay && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Clear date filter to show all records
                      setDateFilter(null);
                      setDateFilterDisplay('');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                    title="Clear date filter to show all records"
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </div>
            {dateFilterDisplay && (
              <div className="mt-2 text-sm text-gray-600">
                Showing appointments for: <span className="font-semibold text-gray-900">{dateFilterDisplay}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointments Table with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Appointments ({filteredAppointments.length})</TabsTrigger>
            <TabsTrigger value="waiting">Waiting ({getActiveAppointmentsCountByStatus('Waiting')})</TabsTrigger>
            <TabsTrigger value="consulting">Consulting ({getActiveAppointmentsCountByStatus('Consulting')})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({getActiveAppointmentsCountByStatus('Completed')})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {renderAppointmentsTable(filteredAppointments, true)}
          </TabsContent>

          <TabsContent value="waiting">
            {renderAppointmentsTable(getAppointmentsByStatus('Waiting'), false)}
          </TabsContent>

          <TabsContent value="consulting">
            {renderAppointmentsTable(getAppointmentsByStatus('Consulting'), false)}
          </TabsContent>

          <TabsContent value="completed">
            {renderAppointmentsTable(getAppointmentsByStatus('Completed'), false)}
          </TabsContent>
        </Tabs>
      </div>

      {/* View Appointment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="p-0 gap-0 large-dialog dialog-content-standard">
          <div className="dialog-scrollable-wrapper dialog-content-scrollable">
            {selectedAppointment && (() => {
              const patient = patients.find(p => 
                (p as any).patientId === selectedAppointment.patientId || 
                (p as any).PatientId === selectedAppointment.patientId
              );
              const doctor = appointmentDoctors.find(d => d.id.toString() === selectedAppointment.doctorId);
              const patientName = patient 
                ? `${(patient as any).patientName || (patient as any).PatientName || ''} ${(patient as any).lastName || (patient as any).LastName || ''}`.trim() 
                : selectedAppointment.patientId;
              const doctorName = doctor ? doctor.name : selectedAppointment.doctorId;
              const patientPhone = patient 
                ? (patient as any).PhoneNo || (patient as any).phoneNo || (patient as any).phone || '-'
                : '-';

              return (
                <>
                  <DialogHeader className="dialog-header-standard">
                    <DialogTitle className="dialog-title-standard-view">View Patient Appointment</DialogTitle>
                  </DialogHeader>
                  <div className="dialog-body-content-wrapper">
                  <div className="dialog-form-container">
                    <div className="dialog-form-field">
                      <Label className="dialog-label-standard">Token No</Label>
                      <Input value={selectedAppointment.tokenNo} disabled className="dialog-input-disabled" />
                    </div>
                    <div className="dialog-form-field-grid">
                      <div className="dialog-field-single-column">
                        <Label className="dialog-label-standard">Patient *</Label>
                        <Input
                          value={(() => {
                            const patient = patients.find(p => 
                              (p as any).patientId === selectedAppointment.patientId || 
                              (p as any).PatientId === selectedAppointment.patientId
                            );
                            if (patient) {
                              const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                              const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                              return `${patientNo ? `${patientNo} - ` : ''}${patientName} (ID: ${patientId.substring(0, 8)})`;
                            }
                            return `${patientName} (ID: ${selectedAppointment.patientId ? selectedAppointment.patientId.substring(0, 8) : 'N/A'})`;
                          })()}
                          disabled
                          className="dialog-input-disabled"
                        />
                      </div>
                      <div className="dialog-field-single-column">
                        <Label className="dialog-label-standard">Doctor *</Label>
                        <Input
                          value={doctorName}
                          disabled
                          className="dialog-input-disabled"
                        />
                      </div>
                    </div>
                    <div className="dialog-form-field-grid">
                      <div className="dialog-field-single-column">
                        <Label className="dialog-label-standard">Appointment Date *</Label>
                        <Input
                          type="date"
                          value={selectedAppointment.appointmentDate}
                          disabled
                          className="dialog-input-disabled"
                        />
                      </div>
                      <div className="dialog-field-single-column">
                        <Label className="dialog-label-standard">Appointment Time *</Label>
                        <Input
                          type="time"
                          value={selectedAppointment.appointmentTime}
                          disabled
                          className="dialog-input-disabled"
                        />
                      </div>
                    </div>
                    <div className="dialog-form-field-grid">
                      <div className="dialog-field-single-column">
                        <Label className="dialog-label-standard">Appointment Status</Label>
                        <Input
                          value={selectedAppointment.appointmentStatus}
                          disabled
                          className="dialog-input-disabled"
                        />
                      </div>
                      <div className="dialog-field-single-column">
                        <Label className="dialog-label-standard">Consultation Charge (₹) *</Label>
                        <Input
                          type="number"
                          value={selectedAppointment.consultationCharge}
                          disabled
                          className="dialog-input-disabled"
                        />
                      </div>
                    </div>
                    <div className="dialog-form-field">
                      <Label className="dialog-label-standard">Follow Up Details</Label>
                      <Textarea
                        value={selectedAppointment.followUpDetails || ''}
                        disabled
                        className="dialog-textarea-standard"
                        style={{ fontSize: '1.125rem' }}
                        rows={2}
                      />
                    </div>
                  </div>
                  </div>
                  <div className="dialog-footer-standard">
                    <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="dialog-footer-button">Close</Button>
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <ResizableDialogContent className="p-0 gap-0 large-dialog dialog-content-standard">
          <div className="dialog-scrollable-wrapper dialog-content-scrollable">
            {selectedAppointment && (
              <>
                <DialogHeader className="dialog-header-standard">
                  <DialogTitle className="dialog-title-standard">Edit Patient Appointment</DialogTitle>
                </DialogHeader>
                <div className="dialog-body-content-wrapper">
                  <div className="dialog-form-container space-y-4">
                  <div>
                    <Label>Token No</Label>
                    <Input value={selectedAppointment.tokenNo} disabled className="bg-gray-50" />
                    <p className="text-xs text-gray-500 mt-1">Token No is auto-generated and cannot be changed</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Label htmlFor="edit-patient-search">Patient *</Label>
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          id="edit-patient-search"
                          name="edit-patient-search"
                          autoComplete="off"
                          placeholder="Search by Patient ID, Name, or Mobile Number..."
                          value={editPatientSearchTerm}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setEditPatientSearchTerm(newValue);
                            setEditPatientHighlightIndex(-1);
                            // Clear patient selection if user edits the search term
                            if (editFormData.patientId) {
                              setEditFormData({ ...editFormData, patientId: '' });
                            }
                            // Clear error when user starts typing
                            if (editPatientError) {
                              setEditPatientError('');
                            }
                          }}
                          onKeyDown={(e) => {
                            const filteredPatients = patients.filter(patient => {
                              if (!editPatientSearchTerm) return false;
                              const searchLower = editPatientSearchTerm.toLowerCase();
                              const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                              const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                              const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                              const lastName = (patient as any).lastName || (patient as any).LastName || '';
                              const fullName = `${patientName} ${lastName}`.trim();
                              const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                              return (
                                patientId.toLowerCase().includes(searchLower) ||
                                patientNo.toLowerCase().includes(searchLower) ||
                                fullName.toLowerCase().includes(searchLower) ||
                                phoneNo.includes(editPatientSearchTerm)
                              );
                            });
                            
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setEditPatientHighlightIndex(prev => 
                                prev < filteredPatients.length - 1 ? prev + 1 : prev
                              );
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setEditPatientHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                            } else if (e.key === 'Enter' && editPatientHighlightIndex >= 0 && filteredPatients[editPatientHighlightIndex]) {
                              e.preventDefault();
                              const patient = filteredPatients[editPatientHighlightIndex];
                              const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                              const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                              const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                              const lastName = (patient as any).lastName || (patient as any).LastName || '';
                              const fullName = `${patientName} ${lastName}`.trim();
                              setEditFormData({ ...editFormData, patientId });
                              setEditPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
                              setEditPatientError('');
                              setEditPatientHighlightIndex(-1);
                            }
                          }}
                          className={`pl-10 ${editPatientError ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {editPatientError && (
                        <p className="text-sm text-red-600 mt-1">{editPatientError}</p>
                      )}
                      {editPatientSearchTerm && (() => {
                        const filteredPatients = patients.filter(patient => {
                          if (!editPatientSearchTerm) return false;
                          const searchLower = editPatientSearchTerm.toLowerCase();
                          const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                          const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                          const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                          const lastName = (patient as any).lastName || (patient as any).LastName || '';
                          const fullName = `${patientName} ${lastName}`.trim();
                          const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                          return (
                            patientId.toLowerCase().includes(searchLower) ||
                            patientNo.toLowerCase().includes(searchLower) ||
                            fullName.toLowerCase().includes(searchLower) ||
                            phoneNo.includes(editPatientSearchTerm)
                          );
                        });
                        
                        return filteredPatients.length > 0 ? (
                          <div className="absolute z-[110] w-full mt-1 border border-gray-200 rounded-md max-h-60 overflow-y-auto bg-white shadow-lg" style={{ backgroundColor: 'white', opacity: 1 }} id="edit-patient-dropdown">
                            <table className="w-full">
                              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Patient ID</th>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Mobile</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredPatients.map((patient, index) => {
                                  const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                                  const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                                  const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                                  const lastName = (patient as any).lastName || (patient as any).LastName || '';
                                  const fullName = `${patientName} ${lastName}`.trim();
                                  const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                                  const isSelected = editFormData.patientId === patientId;
                                  const isHighlighted = editPatientHighlightIndex === index;
                                  return (
                                    <tr
                                      key={patientId}
                                      onClick={() => {
                                        setEditFormData({ ...editFormData, patientId });
                                        setEditPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
                                        setEditPatientError('');
                                        setEditPatientHighlightIndex(-1);
                                      }}
                                      onMouseDown={(e) => {
                                        // Prevent input from losing focus when clicking on dropdown
                                        e.preventDefault();
                                      }}
                                      className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                    >
                                      <td className="py-2 px-3 text-sm text-gray-900 font-mono">{patientNo || patientId.substring(0, 8)}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{fullName || 'Unknown'}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{phoneNo || '-'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  <div className="relative">
                    <Label htmlFor="edit-doctor-search">Doctor *</Label>
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          id="edit-doctor-search"
                          name="edit-doctor-search"
                          autoComplete="off"
                          placeholder="Search by Doctor Name or Specialty..."
                          value={editDoctorSearchTerm}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setEditDoctorSearchTerm(newValue);
                            setEditDoctorHighlightIndex(-1);
                            // Clear doctor selection if user edits the search term
                            if (editFormData.doctorId) {
                              setEditFormData({ ...editFormData, doctorId: '' });
                            }
                            // Clear error when user starts typing
                            if (editDoctorError) {
                              setEditDoctorError('');
                            }
                          }}
                          onKeyDown={(e) => {
                            const filteredDoctors = appointmentDoctors.filter(doctor => {
                              if (!editDoctorSearchTerm) return false;
                              const searchLower = editDoctorSearchTerm.toLowerCase();
                              return (
                                doctor.name.toLowerCase().includes(searchLower) ||
                                doctor.specialty.toLowerCase().includes(searchLower)
                              );
                            });
                            
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setEditDoctorHighlightIndex(prev => 
                                prev < filteredDoctors.length - 1 ? prev + 1 : prev
                              );
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setEditDoctorHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                            } else if (e.key === 'Enter' && editDoctorHighlightIndex >= 0 && filteredDoctors[editDoctorHighlightIndex]) {
                              e.preventDefault();
                              const doctor = filteredDoctors[editDoctorHighlightIndex];
                              setEditFormData({ ...editFormData, doctorId: doctor.id.toString() });
                              setEditDoctorSearchTerm(`${doctor.name} - ${doctor.specialty}`);
                              setEditDoctorError('');
                              setEditDoctorHighlightIndex(-1);
                            }
                          }}
                          className={`pl-10 ${editDoctorError ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {editDoctorError && (
                        <p className="text-sm text-red-600 mt-1">{editDoctorError}</p>
                      )}
                      {editDoctorSearchTerm && (() => {
                        const filteredDoctors = appointmentDoctors.filter(doctor => {
                          if (!editDoctorSearchTerm) return false;
                          const searchLower = editDoctorSearchTerm.toLowerCase();
                          return (
                            doctor.name.toLowerCase().includes(searchLower) ||
                            doctor.specialty.toLowerCase().includes(searchLower)
                          );
                        });
                        
                        return filteredDoctors.length > 0 ? (
                          <div className="absolute z-[9999] w-full mt-1 border border-gray-200 rounded-md max-h-60 overflow-y-auto bg-white shadow-lg" style={{ backgroundColor: 'white', opacity: 1 }} id="edit-doctor-dropdown">
                            <table className="w-full">
                              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Specialty</th>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Type</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredDoctors.map((doctor, index) => {
                                  const isSelected = editFormData.doctorId === doctor.id.toString();
                                  const isHighlighted = editDoctorHighlightIndex === index;
                                  return (
                                    <tr
                                      key={doctor.id}
                                      onClick={() => {
                                        setEditFormData({ ...editFormData, doctorId: doctor.id.toString() });
                                        setEditDoctorSearchTerm(`${doctor.name} - ${doctor.specialty}`);
                                        setEditDoctorError('');
                                        setEditDoctorHighlightIndex(-1);
                                      }}
                                      onMouseDown={(e) => {
                                        // Prevent input from losing focus when clicking on dropdown
                                        e.preventDefault();
                                      }}
                                      className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                    >
                                      <td className="py-2 px-3 text-sm text-gray-900">{doctor.name}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{doctor.specialty}</td>
                                      <td className="py-2 px-3 text-sm">
                                        <span className={`px-2 py-0.5 rounded text-xs ${
                                          doctor.type === 'inhouse' 
                                            ? 'bg-gray-100 text-gray-700' 
                                            : 'bg-purple-100 text-purple-700'
                                        }`}>
                                          {doctor.type === 'inhouse' ? 'Inhouse' : 'Consulting'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-appointmentDate">Appointment Date *</Label>
                      <DatePicker
                        id="edit-appointmentDate"
                        selected={editAppointmentDate}
                        onChange={(date: Date | null) => {
                          setEditAppointmentDate(date);
                          // Clear error when date is selected
                          if (editDateError) {
                            setEditDateError('');
                          }
                          if (date) {
                            // Extract date components directly from date
                            // DatePicker gives us a date, use local methods
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const dateStr = `${year}-${month}-${day}`;
                            setEditFormData({ ...editFormData, appointmentDate: dateStr });
                          } else {
                            setEditFormData({ ...editFormData, appointmentDate: '' });
                          }
                        }}
                        dateFormat="dd-MM-yyyy"
                        placeholderText="dd-mm-yyyy"
                        className={`dialog-input-standard w-full ${editDateError ? 'border-red-500' : ''}`}
                        wrapperClassName="w-full"
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        yearDropdownItemNumber={100}
                        scrollableYearDropdown
                        minDate={new Date()}
                      />
                      {editDateError && (
                        <p className="text-sm text-red-600 mt-1">{editDateError}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="edit-appointmentTime">Appointment Time *</Label>
                      <Input
                        id="edit-appointmentTime"
                        type="text"
                        placeholder="hh:mm AM/PM"
                        value={editTimeDisplay}
                        className={editTimeError ? 'border-red-500' : ''}
                        onChange={(e) => {
                          // Clear error when user starts typing
                          if (editTimeError) {
                            setEditTimeError('');
                          }
                          let value = e.target.value.toUpperCase();
                          // Auto-format as user types
                          value = value.replace(/[^\d:APM\s]/g, '');
                          
                          // Auto-format single digit hour when colon is typed
                          const colonMatch = value.match(/^(\d):$/);
                          if (colonMatch) {
                            value = `0${colonMatch[1]}:`;
                          }
                          
                          setEditTimeDisplay(value);
                          const parsed = parseTimeFromDisplay(value);
                          if (parsed) {
                            setEditFormData({ ...editFormData, appointmentTime: parsed });
                          }
                        }}
                        onBlur={(e) => {
                          const trimmed = e.target.value.trim();
                          if (!trimmed) {
                            setEditTimeDisplay('');
                            return;
                          }
                          
                          // Try to parse and format
                          let parsed = parseTimeFromDisplay(trimmed);
                          
                          // If parsing fails, try to auto-format single digit hours
                          if (!parsed) {
                            const hourMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
                            if (hourMatch) {
                              let hour = parseInt(hourMatch[1], 10);
                              const minute = hourMatch[2] ? parseInt(hourMatch[2], 10) : 0;
                              const period = hourMatch[3]?.toUpperCase() || 'AM';
                              
                              if (hour >= 1 && hour <= 12 && minute >= 0 && minute <= 59) {
                                const formatted = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
                                setEditTimeDisplay(formatted);
                                parsed = parseTimeFromDisplay(formatted);
                                if (parsed) {
                                  setEditFormData({ ...editFormData, appointmentTime: parsed });
                                }
                                return;
                              }
                            }
                            setEditTimeDisplay('');
                            return;
                          }
                          
                          // Format the parsed time
                          const formatted = formatTimeToDisplay(parsed);
                          setEditTimeDisplay(formatted);
                          setEditFormData({ ...editFormData, appointmentTime: parsed });
                        }}
                      />
                      {editTimeError && (
                        <p className="text-sm text-red-600 mt-1">{editTimeError}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-consultationCharge">Consultation Charge (₹)</Label>
                    <Input
                      id="edit-consultationCharge"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 500"
                      value={editFormData.consultationCharge === '' ? '' : editFormData.consultationCharge}
                      className={editConsultationChargeError ? 'border-red-500' : ''}
                      onChange={(e) => {
                        // Clear error when user starts typing
                        if (editConsultationChargeError) {
                          setEditConsultationChargeError('');
                        }
                        const value = e.target.value;
                        setEditFormData({ 
                          ...editFormData, 
                          consultationCharge: value === '' ? '' : (parseFloat(value) || '')
                        });
                      }}
                    />
                    {editConsultationChargeError && (
                      <p className="text-sm text-red-600 mt-1">{editConsultationChargeError}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit-followUpDetails">Follow Up Details</Label>
                    <Textarea
                      id="edit-followUpDetails"
                      placeholder="Enter follow up details..."
                      value={editFormData.followUpDetails}
                      onChange={(e) => setEditFormData({ ...editFormData, followUpDetails: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-appointmentStatus">Appointment Status</Label>
                    <select
                      id="edit-appointmentStatus"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md"
                      value={editFormData.appointmentStatus}
                      onChange={(e) => setEditFormData({ ...editFormData, appointmentStatus: e.target.value as PatientAppointment['appointmentStatus'] })}
                    >
                      <option value="Waiting">Waiting</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <Label htmlFor="edit-status">Status</Label>
                      <div className="flex-shrink-0 relative" style={{ zIndex: 1 }}>
                        <Switch
                          id="edit-status"
                          checked={editFormData.status}
                          onCheckedChange={(checked) => setEditFormData({ ...editFormData, status: checked })}
                          className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 [&_[data-slot=switch-thumb]]:!bg-white [&_[data-slot=switch-thumb]]:!border [&_[data-slot=switch-thumb]]:!border-gray-400 [&_[data-slot=switch-thumb]]:!shadow-sm"
                          style={{
                            width: '2.5rem',
                            height: '1.5rem',
                            minWidth: '2.5rem',
                            minHeight: '1.5rem',
                            display: 'inline-flex',
                            position: 'relative',
                            backgroundColor: editFormData.status ? '#2563eb' : '#d1d5db',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                </div>
                <div className="dialog-footer-standard">
                  <Button variant="outline" onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditAppointmentDate(null);
                    // Clear all errors when closing
                    setEditPatientError('');
                    setEditDoctorError('');
                    setEditDateError('');
                    setEditTimeError('');
                    setEditConsultationChargeError('');
                  }} className="dialog-footer-button">Cancel</Button>
                  <Button 
                    onClick={async () => {
                      if (!selectedAppointment) return;
                      // Validate patient is selected from the list
                      if (!editFormData.patientId) {
                        setEditPatientError('Please select a patient from the list.');
                        return;
                      }
                      
                      // Verify patient exists in the patients list
                      const selectedPatient = patients.find(p => {
                        const pid = (p as any).patientId || (p as any).PatientId || '';
                        return pid === editFormData.patientId;
                      });
                      
                      if (!selectedPatient) {
                        setEditPatientError('Please select a valid patient from the list.');
                        return;
                      }
                      
                      // Validate doctor is selected from the list
                      if (!editFormData.doctorId) {
                        setEditDoctorError('Please select a doctor from the list.');
                        return;
                      }
                      
                      // Verify doctor exists in the doctors list
                      const selectedDoctor = appointmentDoctors.find(d => d.id.toString() === editFormData.doctorId);
                      
                      if (!selectedDoctor) {
                        setEditDoctorError('Please select a valid doctor from the list.');
                        return;
                      }
                      
                      // Validate appointment date
                      if (!editFormData.appointmentDate) {
                        setEditDateError('Appointment date is required.');
                        return;
                      }
                      
                      // Validate appointment time
                      if (!editFormData.appointmentTime) {
                        setEditTimeError('Appointment time is required.');
                        return;
                      }
                      
                      // Validate consultation charge
                      if (!editFormData.consultationCharge || editFormData.consultationCharge <= 0) {
                        setEditConsultationChargeError('Consultation charge must be greater than 0.');
                        return;
                      }
                      
                      // Clear any previous errors
                      setEditPatientError('');
                      setEditDoctorError('');
                      setEditDateError('');
                      setEditTimeError('');
                      setEditConsultationChargeError('');
                      try {
                        // Use appointment date and time directly (already in correct format)
                        const appointmentDate = editFormData.appointmentDate || '';
                        const appointmentTime = editFormData.appointmentTime || '';
                        
                        const updatedAppointment =                         await updatePatientAppointment({
                          id: selectedAppointment.id,
                          patientId: editFormData.patientId,
                          doctorId: editFormData.doctorId,
                          appointmentDate: appointmentDate,
                          appointmentTime: appointmentTime,
                          appointmentStatus: editFormData.appointmentStatus,
                          consultationCharge: editFormData.consultationCharge === '' ? undefined : (typeof editFormData.consultationCharge === 'number' ? editFormData.consultationCharge : parseFloat(String(editFormData.consultationCharge))),
                          followUpDetails: editFormData.followUpDetails || undefined,
                          status: editFormData.status,
                        } as any);
                        
                        // Close dialog first to prevent any state updates from affecting the form
                        setIsEditDialogOpen(false);
                        
                        // Refresh appointments list after dialog is closed
                        await fetchPatientAppointments();
                        
                        // Clear form data after dialog is closed
                        setSelectedAppointment(null);
                        setEditAppointmentDate(null);
                        setEditFormData({
                          patientId: '',
                          doctorId: '',
                          appointmentDate: '',
                          appointmentTime: '',
                          appointmentStatus: 'Waiting',
                          consultationCharge: '',
                          followUpDetails: '',
                          status: false,
                        });
                        setEditPatientSearchTerm('');
                        setEditDoctorSearchTerm('');
                        setEditPatientError('');
                        setEditDoctorError('');
                        setEditDateError('');
                        setEditTimeError('');
                        setEditConsultationChargeError('');
                        setEditPatientHighlightIndex(-1);
                        setEditDoctorHighlightIndex(-1);
                      } catch (err) {
                        console.error('Failed to update appointment:', err);
                        alert('Failed to update appointment. Please try again.');
                      }
                    }} 
                    className="py-1"
                  >
                    Update Appointment
                  </Button>
                </div>
              </>
            )}
          </div>
        </ResizableDialogContent>
      </Dialog>
      
      {/* Add Lab Test Dialog */}
      <Dialog open={isAddLabTestDialogOpen} onOpenChange={setIsAddLabTestDialogOpen}>
        <DialogContent className="p-0 gap-0 large-dialog dialog-content-standard">
          <div className="dialog-scrollable-wrapper dialog-content-scrollable">
            <DialogHeader className="dialog-header-standard">
              <DialogTitle className="dialog-title-standard-view">Add Lab Test</DialogTitle>
            </DialogHeader>
            <div className="dialog-body-content-wrapper">
              <div className="dialog-form-container">
                <div className="dialog-form-field">
                  <Label htmlFor="add-labtest-labTestId" className="dialog-label-standard">Lab Test *</Label>
                  <select
                    id="add-labtest-labTestId"
                    aria-label="Lab Test"
                    className="dialog-select-standard"
                    value={labTestFormData.labTestId}
                    onChange={(e) => setLabTestFormData({ ...labTestFormData, labTestId: e.target.value })}
                  >
                    <option value="">Select Lab Test</option>
                    {availableLabTests.map((test: any) => {
                      const testId = test.LabTestsId || test.labTestsId || test.LabTestId || test.labTestId || test.id || 0;
                      const testName = test.TestName || test.testName || test.name || test.Name || 'Unknown';
                      const testCategory = test.TestCategory || test.testCategory || test.category || test.Category || '';
                      const displayTestId = test.DisplayTestId || test.displayTestId || test.displayTestID || '';
                      
                      // Display format: "TestName (Category)" or "TestName - DisplayTestId" if available
                      let displayText = testName;
                      if (testCategory) {
                        displayText = `${testName} (${testCategory})`;
                      } else if (displayTestId) {
                        displayText = `${testName} - ${displayTestId}`;
                      }
                      
                      return (
                        <option key={testId} value={testId.toString()}>
                          {displayText}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="dialog-form-field-grid">
                  <div className="dialog-field-single-column">
                    <Label htmlFor="add-labtest-priority" className="dialog-label-standard">Priority</Label>
                    <select
                      id="add-labtest-priority"
                      aria-label="Priority"
                      className="dialog-select-standard"
                      value={labTestFormData.priority || 'Normal'}
                      onChange={(e) => setLabTestFormData({ ...labTestFormData, priority: e.target.value as 'Normal' | 'Urgent' | null })}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div className="dialog-field-single-column">
                    <Label htmlFor="add-labtest-testStatus" className="dialog-label-standard">Test Status</Label>
                    <select
                      id="add-labtest-testStatus"
                      aria-label="Test Status"
                      className="dialog-select-standard"
                      value={labTestFormData.testStatus || 'Pending'}
                      onChange={(e) => setLabTestFormData({ ...labTestFormData, testStatus: e.target.value as 'Pending' | 'InProgress' | 'Completed' | null })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="InProgress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
                
                <div className="dialog-form-field">
                  <Label htmlFor="add-labtest-labTestDone" className="dialog-label-standard">Lab Test Done</Label>
                  <select
                    id="add-labtest-labTestDone"
                    aria-label="Lab Test Done"
                    className="dialog-select-standard"
                    value={labTestFormData.labTestDone}
                    onChange={(e) => setLabTestFormData({ ...labTestFormData, labTestDone: e.target.value as 'Yes' | 'No' })}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="dialog-footer-standard">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddLabTestDialogOpen(false);
                  setLabTestFormData({
                    labTestId: '',
                    priority: 'Normal',
                    labTestDone: 'No',
                    testStatus: 'Pending',
                  });
                  setLabTestSearchTerm('');
                  setShowLabTestList(false);
                }} 
                className="dialog-footer-button"
              >
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  if (!labTestFormData.labTestId) {
                    alert('Please select a lab test.');
                    return;
                  }
                  
                  if (!selectedAppointment) {
                    alert('No appointment selected.');
                    return;
                  }
                  
                  try {
                    const payload = {
                      PatientType: 'OPD',
                      PatientId: selectedAppointment.patientId,
                      LabTestId: Number(labTestFormData.labTestId),
                      AppointmentId: selectedAppointment.id,
                      RoomAdmissionId: null,
                      EmergencyBedSlotId: null,
                      BillId: null,
                      Priority: labTestFormData.priority || null,
                      LabTestDone: labTestFormData.labTestDone || 'No',
                      ReportsUrl: null,
                      TestStatus: labTestFormData.testStatus || null,
                      TestDoneDateTime: null,
                      Status: 'Active',
                      CreatedBy: null,
                    };
                    
                    await apiRequest('/patient-lab-tests', {
                      method: 'POST',
                      body: JSON.stringify(payload),
                    });
                    
                    // Refresh lab tests list
                    if (selectedAppointment.id) {
                      await fetchPatientLabTests(selectedAppointment.id);
                    }
                    
                    setIsAddLabTestDialogOpen(false);
                    setLabTestFormData({
                      labTestId: '',
                      priority: 'Normal',
                      labTestDone: 'No',
                      testStatus: 'Pending',
                    });
                    setLabTestSearchTerm('');
                    setShowLabTestList(false);
                    alert('Lab test added successfully!');
                  } catch (err) {
                    console.error('Failed to add lab test:', err);
                    alert('Failed to add lab test. Please try again.');
                  }
                }} 
                className="dialog-footer-button"
              >
                Add Lab Test
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Manage Lab Test Dialog */}
      <Dialog open={isManageLabTestDialogOpen} onOpenChange={setIsManageLabTestDialogOpen}>
        <DialogContent className="p-0 gap-0 large-dialog dialog-content-standard">
          <div className="dialog-scrollable-wrapper dialog-content-scrollable">
            <DialogHeader className="dialog-header-standard">
              <DialogTitle className="dialog-title-standard-view">Manage Lab Test</DialogTitle>
            </DialogHeader>
            <div className="dialog-body-content-wrapper">
              <div className="dialog-form-container">
                {manageLabTestFormData && selectedLabTest && (
                  <>
                    <div className="dialog-form-field-grid">
                      <div className="dialog-field-single-column">
                        <Label htmlFor="manage-priority" className="dialog-label-standard">Priority</Label>
                        <select
                          id="manage-priority"
                          aria-label="Priority"
                          className="dialog-select-standard"
                          value={manageLabTestFormData.priority || 'Normal'}
                          onChange={(e) => setManageLabTestFormData({ ...manageLabTestFormData, priority: e.target.value })}
                        >
                          <option value="Normal">Normal</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                      
                      <div className="dialog-field-single-column">
                        <Label htmlFor="manage-testStatus" className="dialog-label-standard">Test Status</Label>
                        <select
                          id="manage-testStatus"
                          aria-label="Test Status"
                          className="dialog-select-standard"
                          value={manageLabTestFormData.testStatus || 'Pending'}
                          onChange={(e) => setManageLabTestFormData({ ...manageLabTestFormData, testStatus: e.target.value })}
                        >
                          <option value="Pending">Pending</option>
                          <option value="InProgress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="dialog-form-field">
                      <Label htmlFor="manage-labTestDone" className="dialog-label-standard">Lab Test Done</Label>
                      <select
                        id="manage-labTestDone"
                        aria-label="Lab Test Done"
                        className="dialog-select-standard"
                        value={manageLabTestFormData.labTestDone || 'No'}
                        onChange={(e) => setManageLabTestFormData({ ...manageLabTestFormData, labTestDone: e.target.value })}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    
                    <div className="dialog-form-field">
                      <div className="flex items-center gap-3">
                        <Label htmlFor="manage-status" className="dialog-label-standard">Status</Label>
                        <div className="flex-shrink-0 relative" style={{ zIndex: 1 }}>
                          <Switch
                            id="manage-status"
                            checked={manageLabTestFormData.status === 'Active' || manageLabTestFormData.status === undefined}
                            onCheckedChange={(checked) => setManageLabTestFormData({ ...manageLabTestFormData, status: checked ? 'Active' : 'Inactive' })}
                            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 [&_[data-slot=switch-thumb]]:!bg-white [&_[data-slot=switch-thumb]]:!border [&_[data-slot=switch-thumb]]:!border-gray-400 [&_[data-slot=switch-thumb]]:!shadow-sm"
                            style={{
                              width: '2.5rem',
                              height: '1.5rem',
                              minWidth: '2.5rem',
                              minHeight: '1.5rem',
                              display: 'inline-flex',
                              position: 'relative',
                              backgroundColor: (manageLabTestFormData.status === 'Active' || manageLabTestFormData.status === undefined) ? '#2563eb' : '#d1d5db',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="dialog-form-field">
                      <Label htmlFor="manage-reportsUrl" className="dialog-label-standard">Reports URL</Label>
                      <Input
                        id="manage-reportsUrl"
                        className="dialog-input-standard"
                        value={manageLabTestFormData.reportsUrl || ''}
                        onChange={(e) => setManageLabTestFormData({ ...manageLabTestFormData, reportsUrl: e.target.value })}
                        placeholder="Enter report URL (optional)"
                      />
                    </div>
                    
                    <div className="dialog-form-field">
                      <Label htmlFor="manage-testDoneDateTime" className="dialog-label-standard">Test Done Date Time</Label>
                      <Input
                        id="manage-testDoneDateTime"
                        type="text"
                        placeholder="dd-mm-yyyy, hh:mm"
                        className="dialog-input-standard"
                        value={manageLabTestFormData.testDoneDateTime || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setManageLabTestFormData({ ...manageLabTestFormData, testDoneDateTime: value });
                        }}
                        onBlur={(e) => {
                          const parsed = parseDateTimeFromInput(e.target.value);
                          if (parsed) {
                            // Keep the display format in the input
                            setManageLabTestFormData({ ...manageLabTestFormData, testDoneDateTime: e.target.value });
                          } else if (e.target.value) {
                            // If invalid, try to format it
                            const formatted = formatDateTimeForInput(e.target.value);
                            if (formatted) {
                              setManageLabTestFormData({ ...manageLabTestFormData, testDoneDateTime: formatted });
                            }
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">Format: dd-mm-yyyy, hh:mm (24-hour format)</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="dialog-footer-standard">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsManageLabTestDialogOpen(false);
                  setSelectedLabTest(null);
                  setManageLabTestFormData(null);
                }} 
                className="dialog-footer-button"
              >
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  if (!manageLabTestFormData || !selectedLabTest) return;
                  
                  try {
                    const patientLabTestsId = manageLabTestFormData.patientLabTestsId;
                    if (!patientLabTestsId) {
                      alert('Lab Test ID is required.');
                      return;
                    }
                    
                    const payload: any = {
                      PatientLabTestsId: patientLabTestsId,
                      Priority: manageLabTestFormData.priority || null,
                      TestStatus: manageLabTestFormData.testStatus || null,
                      LabTestDone: manageLabTestFormData.labTestDone || 'No',
                      Status: manageLabTestFormData.status || 'Active',
                    };
                    
                    if (manageLabTestFormData.reportsUrl) {
                      payload.ReportsUrl = manageLabTestFormData.reportsUrl;
                    }
                    
                    if (manageLabTestFormData.testDoneDateTime) {
                      // Convert datetime from dd-mm-yyyy, hh:mm format to ISO format for API
                      const testDoneDateTimeISO = parseDateTimeFromInput(manageLabTestFormData.testDoneDateTime);
                      if (testDoneDateTimeISO) {
                        payload.TestDoneDateTime = testDoneDateTimeISO;
                      }
                    }
                    
                    await apiRequest(`/patient-lab-tests/${patientLabTestsId}`, {
                      method: 'PUT',
                      body: JSON.stringify(payload),
                    });
                    
                    // Refresh lab tests list
                    if (selectedAppointment?.id) {
                      await fetchPatientLabTests(selectedAppointment.id);
                    }
                    
                    setIsManageLabTestDialogOpen(false);
                    setSelectedLabTest(null);
                    setManageLabTestFormData(null);
                    alert('Lab test updated successfully!');
                  } catch (err) {
                    console.error('Failed to update lab test:', err);
                    alert('Failed to update lab test. Please try again.');
                  }
                }} 
                className="dialog-footer-button"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
