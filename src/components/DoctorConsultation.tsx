import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Search, Clock, Stethoscope, CheckCircle2, Hospital, Users, Plus, Edit, X } from 'lucide-react';
import { Switch } from './ui/switch';
import { usePatientAppointments } from '../hooks/usePatientAppointments';
import { useStaff } from '../hooks/useStaff';
import { useRoles } from '../hooks/useRoles';
import { useDepartments } from '../hooks/useDepartments';
import { patientsApi } from '../api/patients';
import { apiRequest } from '../api/base';
import { PatientAppointment, Patient, Doctor } from '../types';
import { formatDateIST, formatTimeIST, formatDateToDDMMYYYY, formatDateTimeIST, convertToIST } from '../utils/timeUtils';
import { getCurrentUserId, getCurrentUser } from '../utils/authUtils';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface DoctorConsultationProps {
  onManageAppointment?: (appointmentId: number) => void;
}

export function DoctorConsultation({ onManageAppointment }: DoctorConsultationProps = {}) {
  const { patientAppointments, loading, error, updatePatientAppointment, fetchPatientAppointments } = usePatientAppointments();
  const { staff } = useStaff();
  const { roles } = useRoles();
  const { departments } = useDepartments();
  
  // Get current user info and check if SuperAdmin
  const currentUser = getCurrentUser();
  const currentUserId = getCurrentUserId();
  const userRole = currentUser?.role || currentUser?.roleName || currentUser?.RoleName || currentUser?.userRole || '';
  const isSuperAdmin = userRole?.toLowerCase() === 'superadmin';
  
  // Get logged-in doctor's ID (UserId from staff table)
  const loggedInDoctorId = useMemo(() => {
    if (isSuperAdmin || !currentUserId) return null;
    
    // Find the staff member that matches the logged-in user's ID
    const loggedInStaff = staff.find(s => 
      s.UserId?.toString() === currentUserId || 
      s.userId?.toString() === currentUserId ||
      s.id?.toString() === currentUserId
    );
    
    return loggedInStaff?.UserId?.toString() || null;
  }, [staff, currentUserId, isSuperAdmin]);
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
  const itemsPerPage = 10;
  const [activeTab, setActiveTab] = useState('all');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<PatientAppointment | null>(null);
  const [editFormData, setEditFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    appointmentStatus: 'Waiting' as PatientAppointment['appointmentStatus'],
    consultationCharge: 0,
    diagnosis: '',
    followUpDetails: '',
    prescriptionsUrl: '',
    toBeAdmitted: false,
    referToAnotherDoctor: false,
    referredDoctorId: '',
    transferToIPDOTICU: false,
    transferTo: undefined as 'IPD Room Admission' | 'ICU' | 'OT' | undefined,
    transferDetails: '',
    billId: '',
  });
  const [editDateDisplay, setEditDateDisplay] = useState('');
  const [editTimeDisplay, setEditTimeDisplay] = useState('');
  
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

  // Helper functions for date formatting (dd-mm-yyyy) in IST
  const formatDateToDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      // Use IST utilities to get date in IST timezone
      const istDate = formatDateIST(dateStr);
      if (!istDate) return '';
      
      // Parse the YYYY-MM-DD format and convert to dd-mm-yyyy
      const [year, month, day] = istDate.split('-');
      return `${day}-${month}-${year}`;
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
      // Create date in IST timezone (Asia/Kolkata)
      // Use UTC methods with IST offset
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      // Validate the date
      const date = new Date(`${dateStr}T00:00:00+05:30`); // IST offset
      if (date.getDate() !== day || date.getMonth() !== month - 1) return '';
      return dateStr; // Return YYYY-MM-DD format
    } catch {
      return '';
    }
  };

  // Helper functions for time formatting (hh:mm AM/PM) in IST
  const formatTimeToDisplay = (timeStr: string): string => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      if (!hours || !minutes) return '';
      const h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);
      if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return '';
      
      // Time is already in IST (HH:mm format from backend)
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${String(displayHour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
    } catch {
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

  // Helper function to extract field with multiple variations
  const extractField = useCallback((data: any, fieldVariations: string[], defaultValue: any = '') => {
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
  }, []);

  // Helper function to format datetime to dd-mm-yyyy, hh:mm format in IST
  const formatDateTimeForInput = useCallback((dateTime: string | Date | undefined): string => {
    if (!dateTime) return '';
    try {
      // Use convertToIST to properly convert to IST
      const istDate = convertToIST(dateTime);
      
      // Get date components in IST
      const day = String(istDate.getUTCDate()).padStart(2, '0');
      const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
      const year = String(istDate.getUTCFullYear());
      const hours = String(istDate.getUTCHours()).padStart(2, '0');
      const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
      
      return `${day}-${month}-${year}, ${hours}:${minutes}`;
    } catch {
      return '';
    }
  }, []);

  // Helper function to parse datetime from dd-mm-yyyy, hh:mm format (assumed to be in IST)
  const parseDateTimeFromInput = useCallback((inputStr: string): string => {
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
      
      // Create date string in IST timezone (UTC+5:30)
      // Format: YYYY-MM-DDTHH:mm:ss+05:30
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+05:30`;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      
      // Return in ISO format (UTC) for API
      // The date object will automatically convert from IST to UTC
      return date.toISOString();
    } catch {
      return '';
    }
  }, []);

  // Fetch lab tests for appointment
  const fetchPatientLabTests = useCallback(async (appointmentId: number) => {
    if (!appointmentId) return;
    try {
      setLabTestsLoading(true);
      setLabTestsError(null);
      const response = await apiRequest<any>(`/patient-lab-tests/with-details?appointmentId=${appointmentId}`);
      
      console.log('DoctorConsultation - Lab Tests API Response:', JSON.stringify(response, null, 2));
      
      // Handle response structure
      let labTestsData: any[] = [];
      if (Array.isArray(response)) {
        labTestsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        labTestsData = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        labTestsData = response.data.data;
      }
      
      console.log('DoctorConsultation - Extracted Lab Tests Data:', JSON.stringify(labTestsData, null, 2));
      if (labTestsData.length > 0) {
        console.log('DoctorConsultation - First Lab Test Object Keys:', Object.keys(labTestsData[0]));
        console.log('DoctorConsultation - First Lab Test Sample:', labTestsData[0]);
      }
      
      setPatientLabTests(labTestsData || []);
    } catch (err) {
      setLabTestsError(err instanceof Error ? err.message : 'Failed to fetch lab tests');
      setPatientLabTests([]);
    } finally {
      setLabTestsLoading(false);
    }
  }, []);

  // Fetch available lab tests for dropdown
  const fetchAvailableLabTests = useCallback(async () => {
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
  }, []);

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

  // Fetch lab tests when appointment is selected
  useEffect(() => {
    if (selectedAppointment?.id && typeof selectedAppointment.id === 'number') {
      fetchPatientLabTests(selectedAppointment.id).catch(err => {
        console.error('Error fetching patient lab tests:', err);
      });
      fetchAvailableLabTests().catch(err => {
        console.error('Error fetching available lab tests:', err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, []);

  // Separate active and inactive appointments, and filter based on search term and date
  const { activeAppointments, inactiveAppointments, filteredActiveAppointments } = useMemo(() => {
    if (!patientAppointments || patientAppointments.length === 0) {
      return { activeAppointments: [], inactiveAppointments: [], filteredActiveAppointments: [] };
    }
    
    // Filter appointments by logged-in doctor's ID if not SuperAdmin
    let appointmentsToProcess = patientAppointments;
    if (!isSuperAdmin && loggedInDoctorId) {
      appointmentsToProcess = patientAppointments.filter(appointment => {
        // Match doctorId (string) with loggedInDoctorId (string)
        return appointment.doctorId?.toString() === loggedInDoctorId;
      });
    }
    
    // Separate active and inactive appointments
    const active: PatientAppointment[] = [];
    const inactive: PatientAppointment[] = [];
    
    appointmentsToProcess.forEach(appointment => {
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
    
    // Apply date filter if set
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
        const appointmentDate = appointment.appointmentDate;
        if (!appointmentDate) return false;
        
        // Handle different date formats
        let appointmentDateStr: string = '';
        if (typeof appointmentDate === 'string') {
          // If it's already in YYYY-MM-DD format
          if (/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)) {
            appointmentDateStr = appointmentDate;
          } else if (appointmentDate.includes('T')) {
            // If it's a datetime string, extract date part
            appointmentDateStr = appointmentDate.split('T')[0];
          } else if (appointmentDate.includes(' ')) {
            // If it's a datetime string with space separator, extract date part
            appointmentDateStr = appointmentDate.split(' ')[0];
          } else {
            // Try to parse as date
            try {
              const dateObj = new Date(appointmentDate);
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const day = String(dateObj.getDate()).padStart(2, '0');
              appointmentDateStr = `${year}-${month}-${day}`;
            } catch {
              return false;
            }
          }
        } else if (appointmentDate instanceof Date) {
          const year = appointmentDate.getFullYear();
          const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
          const day = String(appointmentDate.getDate()).padStart(2, '0');
          appointmentDateStr = `${year}-${month}-${day}`;
        }
        
        // Compare dates directly (both in YYYY-MM-DD format)
        return appointmentDateStr === dateFilterStr;
      });
    };
    
    const activeFilteredByDate = filterByDate(active);
    
    // Filter active appointments by search term (exclude inactive from search)
    let filtered: PatientAppointment[] = [];
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
        
        const searchLower = searchTerm.toLowerCase();
        return (
          appointment.tokenNo.toLowerCase().includes(searchLower) ||
          patientName.toLowerCase().includes(searchLower) ||
          doctorName.toLowerCase().includes(searchLower) ||
          patientPhone.includes(searchTerm) ||
          patientId.toLowerCase().includes(searchLower) ||
          appointment.patientId.toLowerCase().includes(searchLower)
        );
      });
    }
    
    return { activeAppointments: activeFilteredByDate, inactiveAppointments: inactive, filteredActiveAppointments: filtered };
  }, [patientAppointments, searchTerm, dateFilter, patients, appointmentDoctors, isSuperAdmin, loggedInDoctorId]);

  const filteredAppointments = filteredActiveAppointments;
  
  // Reset to page 1 when search term, date filter, or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, activeTab]);
  
  // Generate page numbers to display
  const getPageNumbers = (totalPages: number) => {
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
  
  // Paginate appointments
  const paginateAppointments = (appointments: PatientAppointment[]) => {
    const totalPages = Math.ceil(appointments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = appointments.slice(startIndex, endIndex);
    return { paginated, totalPages, startIndex, endIndex };
  };

  // Get all active appointments only (exclude inactive)
  const getAllAppointments = () => {
    return filteredActiveAppointments;
  };

  // Get count of active appointments by status (for tab labels)
  const getActiveAppointmentsCountByStatus = (status: PatientAppointment['appointmentStatus']) => {
    return filteredActiveAppointments.filter(a => a.appointmentStatus === status).length;
  };

  const getAppointmentsByStatus = (status: PatientAppointment['appointmentStatus']) => {
    // Only include active appointments that match the status
    return filteredActiveAppointments.filter(a => a.appointmentStatus === status);
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h1 className="text-gray-900 mb-2 text-2xl">Doctor Consultation</h1>
                <p className="text-gray-500 text-base">Manage patient consultations</p>
              </div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-4 flex-1">
            <div className="text-center py-12 text-gray-700">Loading appointments...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h1 className="text-gray-900 mb-2 text-2xl">Doctor Consultation</h1>
                <p className="text-gray-500 text-base">Manage patient consultations</p>
              </div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-4 flex-1">
            <div className="text-center py-12 text-red-500">Error: {error}</div>
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
              <h1 className="text-gray-900 mb-2 text-2xl">Doctor Consultation</h1>
              <p className="text-gray-500 text-base">Manage patient consultations</p>
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
                    <h3 className="text-gray-900">{activeAppointments.length}</h3>
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
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    placeholder="Search by token no, patient, or doctor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="date-filter" className="whitespace-nowrap text-sm text-gray-700">Filter by Date:</Label>
                  <div className="relative" style={{ minWidth: '200px' }}>
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
            </CardContent>
          </Card>

          {/* Appointments by Status */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Appointments ({filteredAppointments.length})</TabsTrigger>
              <TabsTrigger value="waiting">Waiting ({getActiveAppointmentsCountByStatus('Waiting')})</TabsTrigger>
              <TabsTrigger value="consulting">Consulting ({getActiveAppointmentsCountByStatus('Consulting')})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({getActiveAppointmentsCountByStatus('Completed')})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {(() => {
                const allAppts = getAllAppointments();
                const { paginated, totalPages, startIndex, endIndex } = paginateAppointments(allAppts);
                return (
                  <>
                    <AppointmentList
                      appointments={paginated}
                      doctors={appointmentDoctors}
                      patients={patients}
                      formatDateToDisplay={formatDateToDisplay}
                      formatTimeToDisplay={formatTimeToDisplay}
                      onManage={(appointment) => {
                  if (onManageAppointment && appointment.id) {
                    onManageAppointment(appointment.id);
                  } else {
                    // Fallback to edit dialog if navigation not available
                    setSelectedAppointment(appointment);
                    setEditFormData({
                      patientId: appointment.patientId,
                      doctorId: appointment.doctorId,
                      appointmentDate: appointment.appointmentDate,
                      appointmentTime: appointment.appointmentTime,
                      appointmentStatus: appointment.appointmentStatus,
                      consultationCharge: appointment.consultationCharge,
                      diagnosis: appointment.diagnosis || '',
                      followUpDetails: appointment.followUpDetails || '',
                      prescriptionsUrl: appointment.prescriptionsUrl || '',
                      toBeAdmitted: appointment.toBeAdmitted,
                      referToAnotherDoctor: appointment.referToAnotherDoctor,
                      referredDoctorId: appointment.referredDoctorId || '',
                      transferToIPDOTICU: appointment.transferToIPDOTICU,
                      transferTo: appointment.transferTo,
                      transferDetails: appointment.transferDetails || '',
                      billId: appointment.billId || '',
                    });
                    setEditDateDisplay(formatDateToDisplay(appointment.appointmentDate));
                    setEditTimeDisplay(formatTimeToDisplay(appointment.appointmentTime));
                    setIsEditDialogOpen(true);
                  }
                }}
              />
              {allAppts.length > itemsPerPage && (
                <div className="mt-4 flex items-center justify-between px-6 pb-4">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, allAppts.length)} of {allAppts.length} appointments
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
                      {getPageNumbers(totalPages).map((page, index) => {
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
                  </>
                );
              })()}
            </TabsContent>
            <TabsContent value="waiting">
              {(() => {
                const waitingAppts = getAppointmentsByStatus('Waiting');
                const { paginated, totalPages, startIndex, endIndex } = paginateAppointments(waitingAppts);
                return (
                  <>
                    <AppointmentList
                      appointments={paginated}
                doctors={appointmentDoctors}
                patients={patients}
                formatDateToDisplay={formatDateToDisplay}
                formatTimeToDisplay={formatTimeToDisplay}
                onManage={(appointment) => {
                  if (onManageAppointment && appointment.id) {
                    onManageAppointment(appointment.id);
                  } else {
                    setSelectedAppointment(appointment);
                    setEditFormData({
                      patientId: appointment.patientId,
                      doctorId: appointment.doctorId,
                      appointmentDate: appointment.appointmentDate,
                      appointmentTime: appointment.appointmentTime,
                      appointmentStatus: appointment.appointmentStatus,
                      consultationCharge: appointment.consultationCharge,
                      diagnosis: appointment.diagnosis || '',
                      followUpDetails: appointment.followUpDetails || '',
                      prescriptionsUrl: appointment.prescriptionsUrl || '',
                      toBeAdmitted: appointment.toBeAdmitted,
                      referToAnotherDoctor: appointment.referToAnotherDoctor,
                      referredDoctorId: appointment.referredDoctorId || '',
                      transferToIPDOTICU: appointment.transferToIPDOTICU,
                      transferTo: appointment.transferTo,
                      transferDetails: appointment.transferDetails || '',
                      billId: appointment.billId || '',
                    });
                    setEditDateDisplay(formatDateToDisplay(appointment.appointmentDate));
                    setEditTimeDisplay(formatTimeToDisplay(appointment.appointmentTime));
                    setIsEditDialogOpen(true);
                  }
                }}
              />
              {waitingAppts.length > itemsPerPage && (
                <div className="mt-4 flex items-center justify-between px-6 pb-4">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, waitingAppts.length)} of {waitingAppts.length} appointments
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
                      {getPageNumbers(totalPages).map((page, index) => {
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
                  </>
                );
              })()}
            </TabsContent>
            <TabsContent value="consulting">
              {(() => {
                const consultingAppts = getAppointmentsByStatus('Consulting');
                const { paginated, totalPages, startIndex, endIndex } = paginateAppointments(consultingAppts);
                return (
                  <>
                    <AppointmentList
                      appointments={paginated}
                doctors={appointmentDoctors}
                patients={patients}
                formatDateToDisplay={formatDateToDisplay}
                formatTimeToDisplay={formatTimeToDisplay}
                onManage={(appointment) => {
                  if (onManageAppointment && appointment.id) {
                    onManageAppointment(appointment.id);
                  } else {
                    setSelectedAppointment(appointment);
                    setEditFormData({
                      patientId: appointment.patientId,
                      doctorId: appointment.doctorId,
                      appointmentDate: appointment.appointmentDate,
                      appointmentTime: appointment.appointmentTime,
                      appointmentStatus: appointment.appointmentStatus,
                      consultationCharge: appointment.consultationCharge,
                      diagnosis: appointment.diagnosis || '',
                      followUpDetails: appointment.followUpDetails || '',
                      prescriptionsUrl: appointment.prescriptionsUrl || '',
                      toBeAdmitted: appointment.toBeAdmitted,
                      referToAnotherDoctor: appointment.referToAnotherDoctor,
                      referredDoctorId: appointment.referredDoctorId || '',
                      transferToIPDOTICU: appointment.transferToIPDOTICU,
                      transferTo: appointment.transferTo,
                      transferDetails: appointment.transferDetails || '',
                      billId: appointment.billId || '',
                    });
                    setEditDateDisplay(formatDateToDisplay(appointment.appointmentDate));
                    setEditTimeDisplay(formatTimeToDisplay(appointment.appointmentTime));
                    setIsEditDialogOpen(true);
                  }
                }}
              />
              {consultingAppts.length > itemsPerPage && (
                <div className="mt-4 flex items-center justify-between px-6 pb-4">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, consultingAppts.length)} of {consultingAppts.length} appointments
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
                      {getPageNumbers(totalPages).map((page, index) => {
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
                  </>
                );
              })()}
            </TabsContent>
            <TabsContent value="completed">
              {(() => {
                const completedAppts = getAppointmentsByStatus('Completed');
                const { paginated, totalPages, startIndex, endIndex } = paginateAppointments(completedAppts);
                return (
                  <>
                    <AppointmentList
                      appointments={paginated}
                doctors={appointmentDoctors}
                patients={patients}
                formatDateToDisplay={formatDateToDisplay}
                formatTimeToDisplay={formatTimeToDisplay}
                onManage={(appointment) => {
                  if (onManageAppointment && appointment.id) {
                    onManageAppointment(appointment.id);
                  } else {
                    setSelectedAppointment(appointment);
                    setEditFormData({
                      patientId: appointment.patientId,
                      doctorId: appointment.doctorId,
                      appointmentDate: appointment.appointmentDate,
                      appointmentTime: appointment.appointmentTime,
                      appointmentStatus: appointment.appointmentStatus,
                      consultationCharge: appointment.consultationCharge,
                      diagnosis: appointment.diagnosis || '',
                      followUpDetails: appointment.followUpDetails || '',
                      prescriptionsUrl: appointment.prescriptionsUrl || '',
                      toBeAdmitted: appointment.toBeAdmitted,
                      referToAnotherDoctor: appointment.referToAnotherDoctor,
                      referredDoctorId: appointment.referredDoctorId || '',
                      transferToIPDOTICU: appointment.transferToIPDOTICU,
                      transferTo: appointment.transferTo,
                      transferDetails: appointment.transferDetails || '',
                      billId: appointment.billId || '',
                    });
                    setEditDateDisplay(formatDateToDisplay(appointment.appointmentDate));
                    setEditTimeDisplay(formatTimeToDisplay(appointment.appointmentTime));
                    setIsEditDialogOpen(true);
                  }
                }}
              />
              {completedAppts.length > itemsPerPage && (
                <div className="mt-4 flex items-center justify-between px-6 pb-4">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, completedAppts.length)} of {completedAppts.length} appointments
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
                      {getPageNumbers(totalPages).map((page, index) => {
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
                  </>
                );
              })()}
            </TabsContent>
          </Tabs>
        </div>
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

              return (
                <>
                  <DialogHeader className="dialog-header-standard">
                    <DialogTitle className="dialog-title-standard-view">View Patient Appointment</DialogTitle>
                  </DialogHeader>
                  <div className="dialog-body-content-wrapper">
                  <div className="dialog-form-container">
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
                            return `${patientNo ? `${patientNo} - ` : ''}${patientName}`;
                          }
                          return `${patientName}`;
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
                      <Label className="dialog-label-standard">Diagnosis</Label>
                      <Textarea
                        value={selectedAppointment.diagnosis || ''}
                        disabled
                        className="dialog-textarea-standard"
                        style={{ fontSize: '1.125rem' }}
                        rows={3}
                      />
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
                    <div className="dialog-form-field">
                      <Label className="dialog-label-standard">Prescriptions URL</Label>
                      <Input
                        type="url"
                        value={selectedAppointment.prescriptionsUrl || ''}
                        disabled
                        className="dialog-input-disabled"
                      />
                      <p className="dialog-helper-text">Folder URL - multiple prescriptions should be saved</p>
                    </div>
                    <div className="dialog-checkbox-container">
                      <input
                        type="checkbox"
                        id="view-toBeAdmitted"
                        aria-label="To Be Admitted (Yes - converted to IPD)"
                        checked={selectedAppointment.toBeAdmitted}
                        disabled
                        className="rounded"
                      />
                      <Label htmlFor="view-toBeAdmitted" className="dialog-checkbox-label-standard">To Be Admitted (Yes - converted to IPD)</Label>
                    </div>
                    <div className="dialog-checkbox-container">
                      <input
                        type="checkbox"
                        id="view-referToAnotherDoctor"
                        aria-label="Refer To Another Doctor"
                        checked={selectedAppointment.referToAnotherDoctor}
                        disabled
                        className="rounded"
                      />
                      <Label htmlFor="view-referToAnotherDoctor" className="dialog-checkbox-label-standard">Refer To Another Doctor</Label>
                    </div>
                    {selectedAppointment.referToAnotherDoctor && (
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">Referred Doctor *</Label>
                        <Input
                          value={(() => {
                            const referredDoctor = appointmentDoctors.find(d => d.id.toString() === selectedAppointment.referredDoctorId);
                            return referredDoctor ? `${referredDoctor.name} - ${referredDoctor.specialty}` : selectedAppointment.referredDoctorId || '';
                          })()}
                          disabled
                          className="dialog-input-disabled"
                        />
                        <p className="dialog-helper-text">Once this is made as Yes, Appointment created for this doctor id</p>
                      </div>
                    )}
                    <div className="dialog-checkbox-container">
                      <input
                        type="checkbox"
                        id="view-transferToIPDOTICU"
                        aria-label="Transfer to IPD/OT/ICU"
                        checked={selectedAppointment.transferToIPDOTICU}
                        disabled
                        className="rounded"
                      />
                      <Label htmlFor="view-transferToIPDOTICU" className="dialog-checkbox-label-standard">Transfer To IPD/OT/ICU</Label>
                    </div>
                    {selectedAppointment.transferToIPDOTICU && (
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">Transfer To *</Label>
                        <Input
                          value={selectedAppointment.transferTo || ''}
                          disabled
                          className="dialog-input-disabled"
                        />
                      </div>
                    )}
                    {selectedAppointment.transferToIPDOTICU && (
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">Transfer Details</Label>
                        <Textarea
                          value={selectedAppointment.transferDetails || ''}
                          disabled
                          className="dialog-textarea-standard"
                          style={{ fontSize: '1.125rem' }}
                          rows={2}
                        />
                      </div>
                    )}
                    <div className="dialog-form-field">
                      <Label className="dialog-label-standard">Bill ID</Label>
                      <Input
                        type="text"
                        value={selectedAppointment.billId || ''}
                        disabled
                        className="dialog-input-disabled"
                      />
                      <p className="dialog-helper-text">Foreign Key to BillId</p>
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
        <DialogContent className="p-0 gap-0 large-dialog bg-white">
          <div className="flex-1 overflow-y-auto dialog-content-scrollable min-h-0 bg-white">
            {selectedAppointment && (
              <>
                <DialogHeader className="px-6 pt-4 pb-3 bg-white">
                  <DialogTitle className="text-gray-700" style={{ fontSize: '1.25rem' }}>Edit Patient Appointment</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="appointment" className="px-6 pb-1">
                  <TabsList className="mb-4">
                    <TabsTrigger value="appointment">Appointment Details</TabsTrigger>
                    <TabsTrigger value="labtests">Lab Tests</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="appointment" className="mt-0">
                  <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-patientId" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Patient *</Label>
                      <Input
                        id="edit-patientId"
                        value={(() => {
                          const patient = patients.find(p => 
                            (p as any).patientId === editFormData.patientId || 
                            (p as any).PatientId === editFormData.patientId
                          );
                          if (patient) {
                            const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                            const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                            const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                            const lastName = (patient as any).lastName || (patient as any).LastName || '';
                            const fullName = `${patientName} ${lastName}`.trim();
                            return `${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`;
                          }
                          return `Unknown`;
                        })()}
                        disabled
                        className="bg-gray-50 text-gray-700"
                        style={{ fontSize: '1.125rem' }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-doctorId" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Doctor *</Label>
                      <Input
                        id="edit-doctorId"
                        value={(() => {
                          const doctor = appointmentDoctors.find(d => d.id.toString() === editFormData.doctorId);
                          if (doctor) {
                            return `${doctor.name} - ${doctor.specialty}`;
                          }
                          return editFormData.doctorId || 'Unknown';
                        })()}
                        disabled
                        className="bg-gray-50 text-gray-700"
                        style={{ fontSize: '1.125rem' }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-appointmentDate" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Appointment Date *</Label>
                      <Input
                        id="edit-appointmentDate"
                        type="text"
                        placeholder="dd-mm-yyyy"
                        value={editDateDisplay}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditDateDisplay(value);
                          const parsed = parseDateFromDisplay(value);
                          if (parsed) {
                            setEditFormData({ ...editFormData, appointmentDate: parsed });
                          }
                        }}
                        onBlur={(e) => {
                          const parsed = parseDateFromDisplay(e.target.value);
                          if (parsed) {
                            setEditDateDisplay(formatDateToDisplay(parsed));
                            setEditFormData({ ...editFormData, appointmentDate: parsed });
                          } else if (e.target.value) {
                            setEditDateDisplay('');
                          }
                        }}
                        className="text-gray-700 bg-gray-100"
                        style={{ fontSize: '1.125rem' }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-appointmentTime" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Appointment Time *</Label>
                      <Input
                        id="edit-appointmentTime"
                        type="text"
                        placeholder="hh:mm AM/PM"
                        value={editTimeDisplay}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditTimeDisplay(value);
                          const parsed = parseTimeFromDisplay(value);
                          if (parsed) {
                            setEditFormData({ ...editFormData, appointmentTime: parsed });
                          }
                        }}
                        onBlur={(e) => {
                          const parsed = parseTimeFromDisplay(e.target.value);
                          if (parsed) {
                            setEditTimeDisplay(formatTimeToDisplay(parsed));
                            setEditFormData({ ...editFormData, appointmentTime: parsed });
                          } else if (e.target.value) {
                            setEditTimeDisplay('');
                          }
                        }}
                        className="text-gray-700 bg-gray-100"
                        style={{ fontSize: '1.125rem' }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-consultationCharge" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Consultation Charge (₹) *</Label>
                    <Input
                      id="edit-consultationCharge"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 500"
                      value={editFormData.consultationCharge}
                      onChange={(e) => setEditFormData({ ...editFormData, consultationCharge: parseFloat(e.target.value) || 0 })}
                      className="text-gray-700 bg-gray-100"
                      style={{ fontSize: '1.125rem' }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-diagnosis" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Diagnosis</Label>
                    <Textarea
                      id="edit-diagnosis"
                      placeholder="Enter diagnosis..."
                      value={editFormData.diagnosis}
                      onChange={(e) => setEditFormData({ ...editFormData, diagnosis: e.target.value })}
                      rows={3}
                      className="text-gray-700 bg-gray-100"
                      style={{ fontSize: '1.125rem' }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-followUpDetails" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Follow Up Details</Label>
                    <Textarea
                      id="edit-followUpDetails"
                      placeholder="Enter follow up details..."
                      value={editFormData.followUpDetails}
                      onChange={(e) => setEditFormData({ ...editFormData, followUpDetails: e.target.value })}
                      rows={2}
                      className="text-gray-700 bg-gray-100"
                      style={{ fontSize: '1.125rem' }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-prescriptionsUrl" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Prescriptions URL</Label>
                    <Input
                      id="edit-prescriptionsUrl"
                      type="url"
                      placeholder="https://prescriptions.example.com/..."
                      value={editFormData.prescriptionsUrl}
                      onChange={(e) => setEditFormData({ ...editFormData, prescriptionsUrl: e.target.value })}
                      className="text-gray-700 bg-gray-100"
                      style={{ fontSize: '1.125rem' }}
                    />
                    <p className="text-xs text-gray-700 mt-1">Folder URL - multiple prescriptions should be saved</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit-toBeAdmitted"
                      aria-label="To Be Admitted (Yes - converted to IPD)"
                      checked={editFormData.toBeAdmitted}
                      onChange={(e) => setEditFormData({ ...editFormData, toBeAdmitted: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="edit-toBeAdmitted" className="cursor-pointer text-gray-600" style={{ fontSize: '1.125rem' }}>To Be Admitted (Yes - converted to IPD)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit-referToAnotherDoctor"
                      aria-label="Refer to Another Doctor"
                      checked={editFormData.referToAnotherDoctor}
                      onChange={(e) => setEditFormData({ 
                        ...editFormData, 
                        referToAnotherDoctor: e.target.checked, 
                        referredDoctorId: e.target.checked ? editFormData.referredDoctorId : '',
                        appointmentStatus: e.target.checked ? 'Completed' : editFormData.appointmentStatus
                      })}
                      className="rounded"
                    />
                    <Label htmlFor="edit-referToAnotherDoctor" className="cursor-pointer text-gray-600" style={{ fontSize: '1.125rem' }}>Refer To Another Doctor</Label>
                  </div>
                  {editFormData.referToAnotherDoctor && (
                    <div>
                      <Label htmlFor="edit-referredDoctorId" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Referred Doctor *</Label>
                      <select
                        id="edit-referredDoctorId"
                        aria-label="Referred Doctor"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-gray-700 bg-gray-100"
                        value={editFormData.referredDoctorId}
                        onChange={(e) => setEditFormData({ ...editFormData, referredDoctorId: e.target.value })}
                        style={{ fontSize: '1.125rem' }}
                      >
                        <option value="">Select Referred Doctor</option>
                        {appointmentDoctors.length > 0 ? (
                          appointmentDoctors.map(doctor => (
                            <option key={doctor.id} value={doctor.id.toString()}>
                              {doctor.name} - {doctor.specialty}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No doctors available</option>
                        )}
                      </select>
                      <p className="text-xs text-gray-700 mt-1">Once this is made as Yes, Appointment created for this doctor id</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit-transferToIPDOTICU"
                      aria-label="Transfer to IPD/OT/ICU"
                      checked={editFormData.transferToIPDOTICU}
                      onChange={(e) => setEditFormData({ ...editFormData, transferToIPDOTICU: e.target.checked, transferTo: e.target.checked ? editFormData.transferTo : undefined })}
                      className="rounded"
                    />
                    <Label htmlFor="edit-transferToIPDOTICU" className="cursor-pointer text-gray-600" style={{ fontSize: '1.125rem' }}>Transfer To IPD/OT/ICU</Label>
                  </div>
                  {editFormData.transferToIPDOTICU && (
                    <div>
                      <Label htmlFor="edit-transferTo" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Transfer To *</Label>
                      <select
                        id="edit-transferTo"
                        aria-label="Transfer To"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-gray-700 bg-gray-100"
                        value={editFormData.transferTo || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, transferTo: e.target.value as 'IPD Room Admission' | 'ICU' | 'OT' })}
                        style={{ fontSize: '1.125rem' }}
                      >
                        <option value="">Select Transfer Destination</option>
                        <option value="IPD Room Admission">IPD Room Admission</option>
                        <option value="ICU">ICU</option>
                        <option value="OT">OT</option>
                      </select>
                    </div>
                  )}
                  {editFormData.transferToIPDOTICU && (
                    <div>
                      <Label htmlFor="edit-transferDetails" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Transfer Details</Label>
                      <Textarea
                        id="edit-transferDetails"
                        placeholder="Enter transfer details..."
                        value={editFormData.transferDetails}
                        onChange={(e) => setEditFormData({ ...editFormData, transferDetails: e.target.value })}
                        rows={2}
                        className="text-gray-700 bg-gray-100"
                        style={{ fontSize: '1.125rem' }}
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="edit-billId" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Bill ID</Label>
                    <Input
                      id="edit-billId"
                      type="text"
                      placeholder="e.g., BILL001"
                      value={editFormData.billId}
                      onChange={(e) => setEditFormData({ ...editFormData, billId: e.target.value })}
                      className="text-gray-700 bg-gray-100"
                      style={{ fontSize: '1.125rem' }}
                    />
                    <p className="text-xs text-gray-700 mt-1">Foreign Key to BillId</p>
                  </div>
                  <div>
                    <Label htmlFor="edit-appointmentStatus" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Appointment Status</Label>
                    <select
                      id="edit-appointmentStatus"
                      aria-label="Appointment Status"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-gray-700 bg-gray-100"
                      value={editFormData.appointmentStatus}
                      onChange={(e) => setEditFormData({ ...editFormData, appointmentStatus: e.target.value as PatientAppointment['appointmentStatus'] })}
                      style={{ fontSize: '1.125rem' }}
                    >
                      <option value="Waiting">Waiting</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
                  </TabsContent>
                  
                  <TabsContent value="labtests" className="mt-0">
                    <div className="space-y-4 py-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Lab Tests for Appointment</h3>
                        <Button
                          onClick={() => setIsAddLabTestDialogOpen(true)}
                          className="dialog-manage-button flex items-center gap-2"
                        >
                          <Plus className="size-4" />
                          Add Lab Test
                        </Button>
                      </div>
                      
                      {labTestsLoading ? (
                        <p className="text-gray-500">Loading lab tests...</p>
                      ) : labTestsError ? (
                        <p className="text-red-600">Error: {labTestsError}</p>
                      ) : patientLabTests.length === 0 ? (
                        <p className="text-gray-500">No lab tests found for this appointment.</p>
                      ) : (
                        <div className="dialog-table-container">
                          <table className="dialog-table">
                            <thead>
                              <tr className="dialog-table-header-row">
                                <th className="dialog-table-header-cell">TestName</th>
                                <th className="dialog-table-header-cell">PatientType</th>
                                <th className="dialog-table-header-cell">DisplayTestId</th>
                                <th className="dialog-table-header-cell">TestCategory</th>
                                <th className="dialog-table-header-cell">Priority</th>
                                <th className="dialog-table-header-cell">LabTestDone</th>
                                <th className="dialog-table-header-cell">ReportsUrl</th>
                                <th className="dialog-table-header-cell">TestStatus</th>
                                <th className="dialog-table-header-cell">TestDoneDateTime</th>
                                <th className="dialog-table-header-cell">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="dialog-table-body">
                              {patientLabTests.map((test: any, index: number) => {
                                // Extract fields with multiple variations
                                const testName = extractField(test, [
                                  'TestName', 'testName', 'test_name', 'Test_Name',
                                  'LabTest.TestName', 'LabTest.testName', 'labTest.TestName', 'labTest.testName',
                                  'LabTest.Name', 'LabTest.name', 'labTest.Name', 'labTest.name'
                                ], 'N/A');
                                const patientType = extractField(test, [
                                  'PatientType', 'patientType', 'patient_type', 'Patient_Type'
                                ], 'N/A');
                                const displayTestId = extractField(test, [
                                  'DisplayTestId', 'displayTestId', 'display_test_id', 'Display_Test_Id',
                                  'LabTest.DisplayTestId', 'LabTest.displayTestId', 'labTest.DisplayTestId', 'labTest.displayTestId'
                                ], 'N/A');
                                const testCategory = extractField(test, [
                                  'TestCategory', 'testCategory', 'test_category', 'Test_Category',
                                  'LabTest.TestCategory', 'LabTest.testCategory', 'labTest.TestCategory', 'labTest.testCategory',
                                  'LabTest.Category', 'LabTest.category', 'labTest.Category', 'labTest.category'
                                ], 'N/A');
                                const priority = extractField(test, [
                                  'Priority', 'priority', 'testPriority', 'TestPriority'
                                ], 'Normal');
                                const labTestDone = extractField(test, [
                                  'LabTestDone', 'labTestDone', 'lab_test_done', 'Lab_Test_Done'
                                ], 'No');
                                const reportsUrl = extractField(test, [
                                  'ReportsUrl', 'reportsUrl', 'reports_url', 'Reports_Url'
                                ], null);
                                const testStatus = extractField(test, [
                                  'TestStatus', 'testStatus', 'test_status', 'Test_Status'
                                ], 'Pending');
                                const testDoneDateTime = extractField(test, [
                                  'TestDoneDateTime', 'testDoneDateTime', 'test_done_date_time', 'Test_Done_Date_Time'
                                ], null);
                                const status = extractField(test, [
                                  'Status', 'status'
                                ], 'Active');
                                const charges = extractField(test, [
                                  'LabTestCharges', 'labTestCharges', 'lab_test_charges', 'Lab_Test_Charges',
                                  'Charges', 'charges'
                                ], 0);
                                const createdDate = extractField(test, [
                                  'CreatedDate', 'createdDate', 'created_date', 'Created_Date'
                                ], null);
                                
                                return (
                                  <tr key={test.PatientLabTestsId || test.patientLabTestsId || index} className="dialog-table-body-row">
                                    <td className="dialog-table-body-cell dialog-table-body-cell-primary">{testName}</td>
                                    <td className="dialog-table-body-cell dialog-table-body-cell-secondary">
                                      <Badge variant="outline">{patientType}</Badge>
                                    </td>
                                    <td className="dialog-table-body-cell dialog-table-body-cell-secondary">{displayTestId}</td>
                                    <td className="dialog-table-body-cell dialog-table-body-cell-secondary">
                                      <Badge variant="outline">{testCategory}</Badge>
                                    </td>
                                    <td className="dialog-table-body-cell">
                                      <Badge variant={
                                        priority === 'Emergency' || priority === 'Urgent' ? 'destructive' :
                                        priority === 'Urgent' ? 'default' : 'secondary'
                                      }>
                                        {priority}
                                      </Badge>
                                    </td>
                                    <td className="dialog-table-body-cell dialog-table-body-cell-secondary">
                                      <Badge variant={labTestDone === 'Yes' || labTestDone === true ? 'default' : 'outline'}>
                                        {labTestDone === 'Yes' || labTestDone === true ? 'Yes' : 'No'}
                                      </Badge>
                                    </td>
                                    <td className="dialog-table-body-cell dialog-table-body-cell-secondary">
                                      {reportsUrl ? (
                                        <a href={reportsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                          View Report
                                        </a>
                                      ) : 'N/A'}
                                    </td>
                                    <td className="dialog-table-body-cell">
                                      <span className={`px-2 py-1 rounded-full text-xs ${
                                        testStatus === 'Completed' || testStatus === 'completed' ? 'bg-green-100 text-green-700' :
                                        testStatus === 'In Progress' || testStatus === 'InProgress' || testStatus === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                        'bg-orange-100 text-orange-700'
                                      }`}>
                                        {testStatus}
                                      </span>
                                    </td>
                                    <td className="dialog-table-body-cell dialog-table-body-cell-secondary">
                                      {testDoneDateTime ? formatDateTimeIST(testDoneDateTime) : 'N/A'}
                                    </td>
                                    <td className="dialog-table-body-cell">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="dialog-manage-button"
                                        onClick={() => {
                                          setSelectedLabTest(test);
                                          setManageLabTestFormData({
                                            patientLabTestsId: extractField(test, ['PatientLabTestsId', 'patientLabTestsId', 'id', 'Id'], null),
                                            priority: priority,
                                            testStatus: testStatus,
                                            labTestDone: labTestDone,
                                            reportsUrl: reportsUrl || '',
                                            testDoneDateTime: testDoneDateTime ? formatDateTimeForInput(testDoneDateTime) : '',
                                            status: status,
                                          });
                                          setIsManageLabTestDialogOpen(true);
                                        }}
                                        title="View & Edit Lab Test"
                                      >
                                        Manage
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="flex justify-end gap-2 px-6 py-2 border-t bg-white flex-shrink-0">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="py-1">Cancel</Button>
                  <Button 
                    onClick={async () => {
                      if (!selectedAppointment) return;
                      if (!editFormData.patientId || !editFormData.doctorId || !editFormData.appointmentDate || !editFormData.appointmentTime) {
                        alert('Please fill in all required fields.');
                        return;
                      }
                      if (editFormData.referToAnotherDoctor && !editFormData.referredDoctorId) {
                        alert('Please select a referred doctor when "Refer To Another Doctor" is checked.');
                        return;
                      }
                      if (editFormData.transferToIPDOTICU && !editFormData.transferTo) {
                        alert('Please select a transfer destination when "Transfer To IPD/OT/ICU" is checked.');
                        return;
                      }
                      try {
                        await updatePatientAppointment({
                          id: selectedAppointment.id,
                          patientId: editFormData.patientId,
                          doctorId: editFormData.doctorId,
                          appointmentDate: editFormData.appointmentDate,
                          appointmentTime: editFormData.appointmentTime,
                          appointmentStatus: editFormData.appointmentStatus,
                          consultationCharge: editFormData.consultationCharge,
                          diagnosis: editFormData.diagnosis.trim() || undefined,
                          followUpDetails: editFormData.followUpDetails || undefined,
                          prescriptionsUrl: editFormData.prescriptionsUrl || undefined,
                          toBeAdmitted: editFormData.toBeAdmitted,
                          referToAnotherDoctor: editFormData.referToAnotherDoctor,
                          referredDoctorId: editFormData.referToAnotherDoctor ? editFormData.referredDoctorId : undefined,
                          transferToIPDOTICU: editFormData.transferToIPDOTICU,
                          transferTo: editFormData.transferToIPDOTICU ? editFormData.transferTo : undefined,
                          transferDetails: editFormData.transferDetails || undefined,
                          billId: editFormData.billId || undefined,
                        });
                        await fetchPatientAppointments();
                        setIsEditDialogOpen(false);
                        setSelectedAppointment(null);
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
        </DialogContent>
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
                  <div className="relative">
                    <Input
                      id="add-labtest-labTestId"
                      className="dialog-input-standard"
                      placeholder="Search lab test by Display Test ID, name, or category..."
                      value={labTestSearchTerm}
                      onChange={(e) => {
                        setLabTestSearchTerm(e.target.value);
                        setShowLabTestList(true);
                      }}
                      onFocus={() => setShowLabTestList(true)}
                      autoComplete="off"
                    />
                    {showLabTestList && availableLabTests.length > 0 && (
                      <div className="dialog-dropdown-container absolute z-50 w-full mt-1 bg-white shadow-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="py-2 px-3 text-left text-xs font-medium text-gray-700">Display Test ID</th>
                              <th className="py-2 px-3 text-left text-xs font-medium text-gray-700">Test Name</th>
                              <th className="py-2 px-3 text-left text-xs font-medium text-gray-700">Category</th>
                            </tr>
                          </thead>
                          <tbody>
                            {availableLabTests.filter((test: any) => {
                              if (!labTestSearchTerm) return true;
                              const searchLower = labTestSearchTerm.toLowerCase();
                              const displayTestId = test.DisplayTestId || test.displayTestId || test.displayTestID || test.DisplayTestID || '';
                              const testName = test.TestName || test.testName || test.name || test.Name || '';
                              const category = test.TestCategory || test.testCategory || test.category || test.Category || '';
                              return displayTestId.toLowerCase().includes(searchLower) ||
                                     testName.toLowerCase().includes(searchLower) ||
                                     category.toLowerCase().includes(searchLower);
                            }).map((test: any) => {
                              const testId = test.LabTestsId || test.labTestsId || test.LabTestId || test.labTestId || test.id || 0;
                              const displayTestId = test.DisplayTestId || test.displayTestId || test.displayTestID || test.DisplayTestID || '';
                              const testName = test.TestName || test.testName || test.name || test.Name || '';
                              const category = test.TestCategory || test.testCategory || test.category || test.Category || '';
                              const isSelected = labTestFormData.labTestId === String(testId);
                              const displayText = `${displayTestId || ''}, ${testName || 'Unknown'} (${category || 'N/A'})`;
                              return (
                                <tr
                                  key={testId}
                                  onClick={() => {
                                    setLabTestFormData({ ...labTestFormData, labTestId: String(testId) });
                                    setLabTestSearchTerm(displayText);
                                    setShowLabTestList(false);
                                  }}
                                  className={`dialog-dropdown-row ${isSelected ? 'dialog-dropdown-row-selected' : ''}`}
                                >
                                  <td className="py-2 px-3 text-sm text-gray-900 font-mono">{displayTestId || '-'}</td>
                                  <td className="py-2 px-3 text-sm text-gray-900">{testName || '-'}</td>
                                  <td className="py-2 px-3 text-sm text-gray-600">{category || '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
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
                            onCheckedChange={(checked: boolean) => setManageLabTestFormData({ ...manageLabTestFormData, status: checked ? 'Active' : 'Inactive' })}
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
                      <p className="text-xs text-gray-500 mt-1">Format: dd-mm-yyyy, hh:mm (24-hour format, IST)</p>
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
  );
}

function AppointmentList({
  appointments,
  doctors,
  patients,
  formatDateToDisplay,
  formatTimeToDisplay,
  onManage
}: {
  appointments: PatientAppointment[];
  doctors: Doctor[];
  patients: Patient[];
  formatDateToDisplay: (dateStr: string) => string;
  formatTimeToDisplay: (timeStr: string) => string;
  onManage: (appointment: PatientAppointment) => void;
}) {
  const getStatusBadge = (status: PatientAppointment['appointmentStatus']) => {
    switch (status) {
      case 'Waiting':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300"><Clock className="size-3 mr-1" />Waiting</Badge>;
      case 'Consulting':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300"><Stethoscope className="size-3 mr-1" />Consulting</Badge>;
      case 'Completed':
        return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300"><CheckCircle2 className="size-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-0">
        <div className="overflow-x-auto border border-gray-200 rounded">
          <table className="w-full table-fixed">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 text-gray-700 bg-white whitespace-nowrap">Token #</th>
                <th className="text-left py-3 px-3 text-gray-700 bg-white">Patient Name</th>
                <th className="text-left py-3 px-3 text-gray-700 bg-white whitespace-nowrap">Phone</th>
                <th className="text-left py-3 px-3 text-gray-700 bg-white whitespace-nowrap">Doctor</th>
                <th className="text-left py-3 px-3 text-gray-700 bg-white whitespace-nowrap">Status</th>
                <th className="text-left py-3 px-3 text-gray-700 bg-white whitespace-nowrap">Appointment Date</th>
                <th className="text-left py-3 px-3 text-gray-700 bg-white whitespace-nowrap">Time</th>
                <th className="text-left py-3 px-3 text-gray-700 bg-white whitespace-nowrap">Transfer to IPD/OT/ICU</th>
                <th className="text-left py-3 px-3 text-gray-700 bg-white whitespace-nowrap">Refer to Another Doctor</th>
                <th className="text-left py-3 px-3 text-gray-700 bg-white whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    No appointments found
                  </td>
                </tr>
              ) : (
                <>
                  {appointments.map((appointment) => {
                    const patient = patients.find(p => 
                      (p as any).patientId === appointment.patientId || 
                      (p as any).PatientId === appointment.patientId
                    );
                    const doctor = doctors.find(d => d.id.toString() === appointment.doctorId);
                    const patientName = patient 
                      ? `${(patient as any).patientName || (patient as any).PatientName || ''} ${(patient as any).lastName || (patient as any).LastName || ''}`.trim() 
                      : appointment.patientId === '000000000001' 
                        ? 'Dummy Patient Name' 
                        : appointment.patientId;
                    const doctorName = doctor ? doctor.name : appointment.doctorId;
                    const patientPhone = patient 
                      ? (patient as any).PhoneNo || (patient as any).phoneNo || (patient as any).phone || '-'
                      : '-';
                    const patientId = patient 
                      ? (patient as any).PatientNo || (patient as any).patientNo || appointment.patientId.substring(0, 8)
                      : appointment.patientId.substring(0, 8);
                    
                    // Check if appointment is inactive
                    const statusValue = (appointment as any).Status || (appointment as any).status;
                    const isInactive = typeof statusValue === 'string' 
                      ? statusValue !== 'Active' 
                      : (statusValue !== true && statusValue !== 'true');
                    
                    return (
                      <tr key={appointment.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isInactive ? 'opacity-50 bg-gray-50' : ''}`}>
                        <td className={`py-3 px-3 whitespace-nowrap ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>{appointment.tokenNo}</td>
                        <td className={`py-3 px-3 break-words min-w-0 ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>{patientName}</td>
                        <td className={`py-3 px-3 whitespace-nowrap ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>{patientPhone}</td>
                        <td className={`py-3 px-3 whitespace-nowrap ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>{doctorName}</td>
                        <td className={`py-3 px-3 ${isInactive ? 'opacity-50' : ''}`}>{getStatusBadge(appointment.appointmentStatus)}</td>
                        <td className={`py-3 px-3 whitespace-nowrap ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>{formatDateToDisplay(appointment.appointmentDate)}</td>
                        <td className={`py-3 px-3 whitespace-nowrap ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>{formatTimeToDisplay(appointment.appointmentTime)}</td>
                        <td className="py-3 px-3">
                          {appointment.transferToIPDOTICU? (
                            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                              <Hospital className="size-3 mr-1" />Yes
                            </Badge>
                          ) : (
                            <span className="text-gray-600">No</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {appointment.referToAnotherDoctor? (
                            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                              <Hospital className="size-3 mr-1" />Yes
                            </Badge>
                          ) : (
                            <span className="text-gray-600">No</span>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onManage(appointment)}
                            className="dashboard-manage-button"
                            title="Manage Appointment"
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
