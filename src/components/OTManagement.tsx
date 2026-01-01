import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CustomResizableDialog, CustomResizableDialogHeader, CustomResizableDialogTitle, CustomResizableDialogClose } from './CustomResizableDialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Scissors, Plus, Clock, CheckCircle, AlertCircle, Calendar as CalendarIcon, Calendar, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { otRoomsApi } from '../api/otRooms';
import { otSlotsApi } from '../api/otSlots';
import { patientOTAllocationsApi, CreatePatientOTAllocationDto } from '../api/patientOTAllocations';
import { formatDateToDDMMYYYY, formatDateIST, getTodayIST, formatDateDisplayIST, convertToIST, getPreviousDayIST, doesSlotSpanMidnight } from '../utils/timeUtils';
import { getTodayISTDate } from '../config/timezone';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Textarea } from './ui/textarea';
import { cn } from './ui/utils';
import { OTRoom, OTSlot, PatientOTAllocation, Patient, Doctor } from '../types';
import { usePatients } from '../hooks/usePatients';
import { useStaff } from '../hooks/useStaff';
import { useRoles } from '../hooks/useRoles';
import { useDepartments } from '../hooks/useDepartments';
import { patientsApi } from '../api/patients';
import { doctorsApi } from '../api/doctors';
import { patientAppointmentsApi } from '../api/patientAppointments';
import { admissionsApi, Admission } from '../api/admissions';
import { emergencyAdmissionsApi } from '../api/emergencyAdmissions';
import { PatientAppointment } from '../types';
import ISTDatePicker from './ui/ISTDatePicker';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface Surgery {
  id: number;
  patientName: string;
  age: number;
  surgeryType: string;
  surgeon: string;
  assistants: string[];
  otNumber: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Emergency' | 'High' | 'Normal';
  preOpNotes?: string;
  postOpStatus?: string;
}

const mockSurgeries: Surgery[] = [
  {
    id: 1,
    patientName: 'Robert Brown',
    age: 58,
    surgeryType: 'Knee Replacement Surgery',
    surgeon: 'Dr. Michael Chen',
    assistants: ['Dr. Emily Davis', 'Nurse Jane Smith'],
    otNumber: 'OT-1',
    scheduledDate: '2025-11-14',
    scheduledTime: '10:00 AM',
    duration: '3 hours',
    status: 'In Progress',
    priority: 'Normal',
    preOpNotes: 'Patient fasted, anesthesia administered'
  },
  {
    id: 2,
    patientName: 'Sarah Martinez',
    age: 42,
    surgeryType: 'Cardiac Bypass Surgery',
    surgeon: 'Dr. Sarah Johnson',
    assistants: ['Dr. Robert Lee', 'Dr. James Miller'],
    otNumber: 'OT-2',
    scheduledDate: '2025-11-14',
    scheduledTime: '02:00 PM',
    duration: '5 hours',
    status: 'Scheduled',
    priority: 'High',
    preOpNotes: 'ICU bed reserved post-surgery'
  },
  {
    id: 3,
    patientName: 'Michael Johnson',
    age: 35,
    surgeryType: 'Appendectomy',
    surgeon: 'Dr. Emily Davis',
    assistants: ['Dr. Robert Lee'],
    otNumber: 'OT-3',
    scheduledDate: '2025-11-14',
    scheduledTime: '11:00 AM',
    duration: '1.5 hours',
    status: 'Scheduled',
    priority: 'Emergency',
    preOpNotes: 'Emergency case, acute appendicitis'
  },
  {
    id: 4,
    patientName: 'Jennifer White',
    age: 28,
    surgeryType: 'C-Section Delivery',
    surgeon: 'Dr. Maria Garcia',
    assistants: ['Dr. Lisa Anderson', 'Nurse Mary Johnson'],
    otNumber: 'OT-4',
    scheduledDate: '2025-11-13',
    scheduledTime: '09:00 AM',
    duration: '2 hours',
    status: 'Completed',
    priority: 'Normal',
    postOpStatus: 'Mother and baby stable, moved to recovery'
  },
];

interface OTRoom {
  number: string;
  status: string;
  currentSurgery?: string | null;
}

interface OTRoomForDropdown {
  number: string;
  status: string;
  currentSurgery: string | null;
}

export function OTManagement() {
  const [surgeries, setSurgeries] = useState<Surgery[]>(mockSurgeries);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [otRooms, setOtRooms] = useState<OTRoom[]>([]);
  const [otRoomsForDropdown, setOtRoomsForDropdown] = useState<OTRoomForDropdown[]>([]);
  const [otSlotsByRoom, setOTSlotsByRoom] = useState<Map<number, OTSlot[]>>(new Map());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIST());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isUnoccupiedSlotsExpanded, setIsUnoccupiedSlotsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [otRoomsLoading, setOtRoomsLoading] = useState(false);
  const [surgeryDate, setSurgeryDate] = useState<Date | undefined>(undefined);
  const [surgeryDateDisplay, setSurgeryDateDisplay] = useState<string>('');
  const [patientOTAllocations, setPatientOTAllocations] = useState<PatientOTAllocation[]>([]);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [selectedOTId, setSelectedOTId] = useState<string>('');
  const [otSlots, setOTSlots] = useState<OTSlot[]>([]);
  const [addOtAllocationDate, setAddOtAllocationDate] = useState<Date | null>(null);
  const { patients, fetchPatients } = usePatients();
  const { staff, fetchStaff } = useStaff();
  const { roles, fetchRoles } = useRoles();
  const { departments, fetchDepartments } = useDepartments();
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientHighlightIndex, setPatientHighlightIndex] = useState(-1);
  const [leadSurgeonSearchTerm, setLeadSurgeonSearchTerm] = useState('');
  const [leadSurgeonHighlightIndex, setLeadSurgeonHighlightIndex] = useState(-1);
  const [assistantDoctorSearchTerm, setAssistantDoctorSearchTerm] = useState('');
  const [assistantDoctorHighlightIndex, setAssistantDoctorHighlightIndex] = useState(-1);
  const [anaesthetistSearchTerm, setAnaesthetistSearchTerm] = useState('');
  const [anaesthetistHighlightIndex, setAnaesthetistHighlightIndex] = useState(-1);
  const [nurseSearchTerm, setNurseSearchTerm] = useState('');
  const [nurseHighlightIndex, setNurseHighlightIndex] = useState(-1);
  const [patientAppointmentSearchTerm, setPatientAppointmentSearchTerm] = useState('');
  const [patientAppointmentHighlightIndex, setPatientAppointmentHighlightIndex] = useState(-1);
  const [roomAdmissionSearchTerm, setRoomAdmissionSearchTerm] = useState('');
  const [roomAdmissionHighlightIndex, setRoomAdmissionHighlightIndex] = useState(-1);
  const [emergencyBedSlotSearchTerm, setEmergencyBedSlotSearchTerm] = useState('');
  const [emergencyBedSlotHighlightIndex, setEmergencyBedSlotHighlightIndex] = useState(-1);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [availableNurses, setAvailableNurses] = useState<Array<{ id: number; name: string; department?: string }>>([]);
  const [availablePatientAppointments, setAvailablePatientAppointments] = useState<PatientAppointment[]>([]);
  const [availableRoomAdmissions, setAvailableRoomAdmissions] = useState<Admission[]>([]);
  const [availableEmergencyBedSlots, setAvailableEmergencyBedSlots] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    patientId: '',
    roomAdmissionId: '',
    patientAppointmentId: '',
    emergencyBedSlotId: '',
    otId: '',
    otSlotIds: [] as number[],
    surgeryId: '',
    leadSurgeonId: '',
    assistantDoctorId: '',
    anaesthetistId: '',
    nurseId: '',
    otAllocationDate: getTodayIST(),
    dateOfOperation: '',
    duration: '',
    otStartTime: '',
    otEndTime: '',
    otActualStartTime: '',
    otActualEndTime: '',
    operationDescription: '',
    operationStatus: 'Scheduled' as PatientOTAllocation['operationStatus'],
    preOperationNotes: '',
    postOperationNotes: '',
    otDocuments: '',
    billId: '',
    status: 'Active' as PatientOTAllocation['status'],
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedDocumentUrls, setUploadedDocumentUrls] = useState<string[]>([]);
  const [patientSourceType, setPatientSourceType] = useState<'IPD' | 'OPD' | 'EmergencyBed' | ''>('');
  // Store selected IDs for each source type to persist when switching
  const [savedPatientSourceIds, setSavedPatientSourceIds] = useState<{
    IPD?: string;
    OPD?: string;
    EmergencyBed?: string;
  }>({});

  // Sync date picker with form data
  useEffect(() => {
    if (formData.otAllocationDate) {
      try {
        const dateStr = formData.otAllocationDate;
        let date: Date;
        if (dateStr.includes('T')) {
          date = new Date(dateStr);
        } else {
          date = new Date(dateStr + 'T00:00:00');
        }
        if (!isNaN(date.getTime())) {
          setAddOtAllocationDate(date);
        } else {
          setAddOtAllocationDate(null);
        }
      } catch {
        setAddOtAllocationDate(null);
      }
    } else {
      setAddOtAllocationDate(null);
    }
  }, [formData.otAllocationDate]);

  // Convert string date (YYYY-MM-DD) to Date object
  const getDateFromString = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    try {
      const date = new Date(dateStr + 'T00:00:00+05:30'); // IST timezone
      if (isNaN(date.getTime())) return undefined;
      return date;
    } catch {
      return undefined;
    }
  };
  
  // Convert Date object to string (YYYY-MM-DD)
  const getStringFromDate = (date: Date | undefined): string => {
    if (!date) return getTodayIST();
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return getTodayIST();
    }
  };

  // Helper function to parse date from dd-mm-yyyy format
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
      // Validate the date
      const date = new Date(`${dateStr}T00:00:00+05:30`); // IST offset
      if (date.getDate() !== day || date.getMonth() !== month - 1) return '';
      return dateStr; // Return YYYY-MM-DD format
    } catch {
      return '';
    }
  };

  // Format date to DD-MM-YYYY for display (for slot status section)
  const formatDateToDDMMYYYYDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const istDate = formatDateIST(dateStr);
      if (!istDate) return '';
      const [year, month, day] = istDate.split('-');
      return `${day}-${month}-${year}`;
    } catch {
      return '';
    }
  };

  // Fetch OT rooms on component mount
  useEffect(() => {
    const fetchOTRooms = async () => {
      try {
        setLoading(true);
        const allOTRooms = await otRoomsApi.getAllLegacy();
        setOtRooms(allOTRooms);
        
        // Also set for dropdown
        const mappedRooms: OTRoomForDropdown[] = allOTRooms.map((ot) => {
          return {
            number: ot.otNo,
            status: ot.status === 'active' ? 'Active' : ot.status,
            currentSurgery: null,
          };
        });
        setOtRoomsForDropdown(mappedRooms);
      } catch (err) {
        console.error('Failed to fetch OT rooms:', err);
        setOtRooms([]);
        setOtRoomsForDropdown([]);
      } finally {
        setLoading(false);
        setOtRoomsLoading(false);
      }
    };
    fetchOTRooms();
  }, []);

  // Fetch OT slots for all rooms when date changes
  useEffect(() => {
    const fetchOTSlots = async () => {
      if (otRooms.length === 0) return;
      
      try {
        setLoadingSlots(true);
        const slotsMap = new Map<number, OTSlot[]>();
        
        // Fetch slots for each OT room
        const slotPromises = otRooms.map(async (room) => {
          try {
            const numericOtId = typeof room.otId === 'string' 
              ? parseInt(room.otId.replace('OT-', ''), 10)
              : room.id;
            
            if (isNaN(numericOtId)) return;
            
            // Pass selectedDate (YYYY-MM-DD) - API will convert to DD-MM-YYYY internally
            const slots = await otSlotsApi.getAll(undefined, numericOtId, selectedDate);
            slotsMap.set(numericOtId, slots);
          } catch (err) {
            console.error(`Failed to fetch slots for OT ${room.otId}:`, err);
          }
        });
        
        await Promise.all(slotPromises);
        setOTSlotsByRoom(slotsMap);
      } catch (err) {
        console.error('Failed to fetch OT slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    };
    
    fetchOTSlots();
  }, [selectedDate, otRooms]);

  // Fetch patient OT allocations
  useEffect(() => {
    const fetchPatientOTAllocations = async () => {
      try {
        setLoadingAllocations(true);
        const allocations = await patientOTAllocationsApi.getAll();
        setPatientOTAllocations(allocations);
        console.log('Fetched patient OT allocations:', allocations);
      } catch (err) {
        console.error('Failed to fetch patient OT allocations:', err);
        setPatientOTAllocations([]);
      } finally {
        setLoadingAllocations(false);
      }
    };
    
    fetchPatientOTAllocations();
  }, []);

  // Fetch staff, roles, and departments on mount
  useEffect(() => {
    fetchStaff();
    fetchRoles();
    fetchDepartments();
  }, [fetchStaff, fetchRoles, fetchDepartments]);

  // Fetch patient appointments, room admissions, and emergency bed slots on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch patient appointments
        const appointmentsResponse = await patientAppointmentsApi.getAll({ page: 1, limit: 1000 });
        const appointments = Array.isArray(appointmentsResponse) ? appointmentsResponse : (appointmentsResponse?.data || []);
        setAvailablePatientAppointments(appointments);

        // Fetch room admissions (filter for Active ones)
        const admissionsResponse = await admissionsApi.getAll();
        const allAdmissions = Array.isArray(admissionsResponse) ? admissionsResponse : (admissionsResponse?.data || []);
        const activeAdmissions = allAdmissions.filter((admission: Admission) => 
          admission.status === 'Active' || admission.admissionStatus === 'Active'
        );
        setAvailableRoomAdmissions(activeAdmissions);

        // Fetch emergency bed slots (Active emergency admissions)
        const emergencyResponse = await emergencyAdmissionsApi.getAll({ status: 'Active' });
        const emergencyAdmissions = Array.isArray(emergencyResponse) ? emergencyResponse : (emergencyResponse?.data || []);
        setAvailableEmergencyBedSlots(emergencyAdmissions);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setAvailablePatientAppointments([]);
        setAvailableRoomAdmissions([]);
        setAvailableEmergencyBedSlots([]);
      }
    };
    fetchAllData();
  }, []);

  // Filter to show only doctors and surgeons from staff with department information
  useEffect(() => {
    if (!staff || !roles || !departments || staff.length === 0 || roles.length === 0 || departments.length === 0) {
      setAvailableDoctors([]);
      return;
    }

    const doctors = staff
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

    setAvailableDoctors(doctors);
  }, [staff, roles, departments]);

  // Filter nurses from staff
  useEffect(() => {
    if (!staff || !roles || staff.length === 0 || roles.length === 0) {
      setAvailableNurses([]);
      return;
    }

    const nurses = staff
      .filter((member) => {
        if (!member.RoleId) return false;
        const role = roles.find(r => r.id === member.RoleId);
        if (!role || !role.name) return false;
        const roleNameLower = role.name.toLowerCase();
        return roleNameLower.includes('nurse');
      })
      .map((member) => ({
        id: member.UserId || 0,
        name: member.UserName || 'Unknown',
        department: undefined, // Nurses might not have departments
      }));

    setAvailableNurses(nurses);
  }, [staff, roles]);

  // Fetch OT slots when OT is selected in dialog
  useEffect(() => {
    const fetchOTSlotsForDialog = async () => {
      if (!selectedOTId) {
        setOTSlots([]);
        return;
      }
      
      try {
        const numericOtId = parseInt(selectedOTId, 10);
        if (isNaN(numericOtId)) {
          setOTSlots([]);
          return;
        }
        
        const slots = await otSlotsApi.getAll(undefined, numericOtId);
        setOTSlots(slots);
      } catch (err) {
        console.error('Failed to fetch OT slots for dialog:', err);
        setOTSlots([]);
      }
    };
    
    fetchOTSlotsForDialog();
  }, [selectedOTId]);

  // Helper function to format date for display (dd-mm-yyyy)
  const formatDateToDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const istDate = formatDateIST(dateStr);
      if (!istDate) return '';
      const [year, month, day] = istDate.split('-');
      return `${day}-${month}-${year}`;
    } catch {
      return '';
    }
  };

  // Helper function to format date as dd_mm_yyyy for file suffix
  const formatDateForFileSuffix = (): string => {
    const now = new Date();
    const istDate = convertToIST(now);
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const year = istDate.getUTCFullYear();
    return `${day}_${month}_${year}`;
  };

  // Helper function to add date suffix to filename
  const addDateSuffixToFileName = (fileName: string): string => {
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

  // Function to upload files (for main OTManagement component)
  const uploadFiles = async (files: File[], patientId: string): Promise<string[]> => {
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
        formData.append('folder', 'ot-documents');
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
        uploadUrlObj.searchParams.append('folder', 'ot-documents');
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

  // Handle form submission
  const handleAddOTAllocation = async () => {
    // Validate required fields
    if (!formData.otId || !formData.leadSurgeonId || !formData.otAllocationDate) {
      alert('Please fill in all required fields (OT, Lead Surgeon, Date).');
      return;
    }

    // Patient source is required - must come from one of the sources
    if (!patientSourceType) {
      alert('Please select a Patient Source.');
      return;
    }
    if (!formData.roomAdmissionId && !formData.patientAppointmentId && !formData.emergencyBedSlotId) {
      alert(`Please select a ${patientSourceType === 'IPD' ? 'Room Admission' : patientSourceType === 'OPD' ? 'Patient Appointment' : 'Emergency Bed Slot'}.`);
      return;
    }

    try {
      // Extract patientId from the selected patient source FIRST (needed for file upload)
      let patientId: string | undefined = undefined;
      
      if (formData.roomAdmissionId) {
        const admission = availableRoomAdmissions.find(a => 
          (a.roomAdmissionId?.toString() || a.id?.toString()) === formData.roomAdmissionId
        );
        patientId = admission?.patientId;
        console.log('Extracted patientId from room admission:', patientId, 'Admission:', admission);
      } else if (formData.patientAppointmentId) {
        const appointment = availablePatientAppointments.find(a => 
          a.id.toString() === formData.patientAppointmentId
        );
        patientId = appointment?.patientId;
        console.log('Extracted patientId from appointment:', patientId, 'Appointment:', appointment);
      } else if (formData.emergencyBedSlotId) {
        // For emergency bed slots, find the emergency admission
        // The formData.emergencyBedSlotId could be EmergencyAdmissionId or EmergencyBedSlotId
        const emergencyAdmission = availableEmergencyBedSlots.find(s => {
          // Check EmergencyAdmissionId first (most likely, since slot.id is EmergencyAdmissionId)
          const admissionId = s.EmergencyAdmissionId?.toString() || s.emergencyAdmissionId?.toString() || s.id?.toString() || '';
          // Also check EmergencyBedSlotId as fallback
          const bedSlotId = s.EmergencyBedSlotId?.toString() || s.emergencyBedSlotId?.toString() || '';
          return admissionId === formData.emergencyBedSlotId || bedSlotId === formData.emergencyBedSlotId;
        });
        // Try multiple field name variations for patientId
        patientId = emergencyAdmission?.PatientId || 
                    emergencyAdmission?.patientId || 
                    (emergencyAdmission as any)?.PatientId ||
                    (emergencyAdmission as any)?.patientId;
        console.log('Extracted patientId from emergency admission:', patientId, 'Emergency Admission:', emergencyAdmission);
      }

      if (!patientId) {
        console.error('Unable to extract patientId. Form data:', formData);
        console.error('Available room admissions:', availableRoomAdmissions);
        console.error('Available appointments:', availablePatientAppointments);
        console.error('Available emergency bed slots:', availableEmergencyBedSlots);
        alert('Unable to determine patient ID from selected source. Please try again.');
        return;
      }

      // Upload files first if any are selected (now that we have patientId)
      let documentUrls: string[] = [...uploadedDocumentUrls];
      if (selectedFiles.length > 0) {
        try {
          const newUrls = await uploadFiles(selectedFiles, patientId);
          documentUrls = [...documentUrls, ...newUrls];
        } catch (error) {
          alert(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      }
      
      // Combine all document URLs (JSON array)
      const combinedDocuments = documentUrls.length > 0 ? JSON.stringify(documentUrls) : undefined;

      const createData: CreatePatientOTAllocationDto = {
        patientId: patientId,
        roomAdmissionId: formData.roomAdmissionId ? Number(formData.roomAdmissionId) : undefined,
        patientAppointmentId: formData.patientAppointmentId ? Number(formData.patientAppointmentId) : undefined,
        emergencyBedSlotId: formData.emergencyBedSlotId ? Number(formData.emergencyBedSlotId) : undefined,
        otId: Number(formData.otId),
        otSlotIds: formData.otSlotIds || [],
        surgeryId: formData.surgeryId ? Number(formData.surgeryId) : undefined,
        leadSurgeonId: Number(formData.leadSurgeonId),
        assistantDoctorId: formData.assistantDoctorId ? Number(formData.assistantDoctorId) : undefined,
        anaesthetistId: formData.anaesthetistId ? Number(formData.anaesthetistId) : undefined,
        nurseId: formData.nurseId ? Number(formData.nurseId) : undefined,
        otAllocationDate: formData.otAllocationDate,
        dateOfOperation: formData.dateOfOperation || undefined,
        duration: formData.duration ? Number(formData.duration) : undefined,
        otStartTime: formData.otStartTime || undefined,
        otEndTime: formData.otEndTime || undefined,
        otActualStartTime: formData.otActualStartTime || undefined,
        otActualEndTime: formData.otActualEndTime || undefined,
        operationDescription: formData.operationDescription || undefined,
        operationStatus: formData.operationStatus === 'InProgress' ? 'In Progress' : formData.operationStatus,
        preOperationNotes: formData.preOperationNotes || undefined,
        postOperationNotes: formData.postOperationNotes || undefined,
        otDocuments: combinedDocuments,
        billId: formData.billId ? Number(formData.billId) : undefined,
        status: 'Active',
      };

      await patientOTAllocationsApi.create(createData);
      
      // Refresh allocations
      const allocations = await patientOTAllocationsApi.getAll();
      setPatientOTAllocations(allocations);
      
      // Reset form
      setPatientAppointmentSearchTerm('');
      setRoomAdmissionSearchTerm('');
      setEmergencyBedSlotSearchTerm('');
      setFormData({
        patientId: '',
        roomAdmissionId: '',
        patientAppointmentId: '',
        emergencyBedSlotId: '',
        otId: '',
        otSlotIds: [],
        surgeryId: '',
        leadSurgeonId: '',
        assistantDoctorId: '',
        anaesthetistId: '',
        nurseId: '',
        otAllocationDate: getTodayIST(),
        dateOfOperation: '',
        duration: '',
        otStartTime: '',
        otEndTime: '',
        otActualStartTime: '',
        otActualEndTime: '',
        operationDescription: '',
        operationStatus: 'Scheduled',
        preOperationNotes: '',
        postOperationNotes: '',
        otDocuments: '',
        billId: '',
        status: 'Active',
      });
      setSelectedFiles([]);
      setUploadedDocumentUrls([]);
      setPatientSourceType('');
      setSavedPatientSourceIds({});
      setPatientSearchTerm('');
      setPatientHighlightIndex(-1);
      setSelectedOTId('');
      setIsDialogOpen(false);
      setLeadSurgeonSearchTerm('');
      setLeadSurgeonHighlightIndex(-1);
      setAssistantDoctorSearchTerm('');
      setAssistantDoctorHighlightIndex(-1);
      setAnaesthetistSearchTerm('');
      setAnaesthetistHighlightIndex(-1);
      setNurseSearchTerm('');
      setNurseHighlightIndex(-1);
      setAssistantDoctorSearchTerm('');
      setAssistantDoctorHighlightIndex(-1);
      setAnaesthetistSearchTerm('');
      setAnaesthetistHighlightIndex(-1);
      setNurseSearchTerm('');
      setNurseHighlightIndex(-1);
      setAddOtAllocationDate(null);
      
      alert('OT Allocation created successfully!');
    } catch (err) {
      console.error('Failed to create OT allocation:', err);
      alert(`Failed to create OT allocation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Filter patient OT allocations by status
  const todayAllocations = patientOTAllocations.filter(a => {
    const allocationDate = formatDateIST(a.otAllocationDate);
    return allocationDate === getTodayIST();
  });
  const inProgress = patientOTAllocations.filter(a => a.operationStatus === 'InProgress');
  const scheduled = patientOTAllocations.filter(a => a.operationStatus === 'Scheduled');
  const completed = patientOTAllocations.filter(a => a.operationStatus === 'Completed');

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="text-center py-12 text-gray-600">Loading OT Management...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
      <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-gray-900 mb-2">Operation Theater Management</h1>
              <p className="text-gray-500">Schedule and monitor surgical procedures</p>
            </div>
            <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
              <Plus className="size-4" />
              Schedule Surgery
            </Button>
          </div>
        </div>
        <div className="px-6 pt-4 pb-4 flex-1">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Today's Surgeries</p>
              <Scissors className="size-5 text-blue-600" />
            </div>
            <h3 className="text-gray-900">{todayAllocations.length}</h3>
            <p className="text-xs text-gray-500">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">In Progress</p>
              <Badge variant="default">{inProgress.length}</Badge>
            </div>
            <h3 className="text-gray-900">{inProgress.length}</h3>
            <p className="text-xs text-gray-500">Currently in surgery</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Scheduled</p>
              <CalendarIcon className="size-5 text-green-600" />
            </div>
            <h3 className="text-gray-900">{scheduled.length}</h3>
            <p className="text-xs text-gray-500">Upcoming surgeries</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Completed</p>
              <CheckCircle className="size-5 text-blue-600" />
            </div>
            <h3 className="text-gray-900">{completed.length}</h3>
            <p className="text-xs text-gray-500">Finished today</p>
          </CardContent>
        </Card>
      </div>

      {/* OT Room Slot Status */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle>OT Room Slot Status</CardTitle>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-40 justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 size-4" />
                  {selectedDate ? formatDateToDDMMYYYYDisplay(selectedDate) : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start" style={{ opacity: 1 }}>
                <CalendarComponent
                  mode="single"
                  selected={getDateFromString(selectedDate)}
                  onSelect={(date) => {
                    if (date) {
                      const dateStr = getStringFromDate(date);
                      setSelectedDate(dateStr);
                      setDatePickerOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading OT rooms...</div>
          ) : loadingSlots ? (
            <div className="text-center py-8 text-gray-500">Loading slots...</div>
          ) : (
            (() => {
              // Collect all occupied and unoccupied slots from all rooms
              const allOccupiedSlots: Array<{ slot: OTSlot; room: OTRoom }> = [];
              const allUnoccupiedSlots: Array<{ slot: OTSlot; room: OTRoom }> = [];
              
              otRooms.forEach((ot) => {
                const numericOtId = typeof ot.otId === 'string' 
                  ? parseInt(ot.otId.replace('OT-', ''), 10)
                  : ot.id;
                const slots = otSlotsByRoom.get(numericOtId) || [];
                // Only consider a slot as occupied if it's actually not available for the selected date
                const occupiedSlots = slots.filter(s => s.isOccupied === true && s.isAvailable === false);
                const unoccupiedSlots = slots.filter(s => s.isAvailable === true || (s.isOccupied !== true && s.isAvailable !== false));
                
                occupiedSlots.forEach(slot => {
                  allOccupiedSlots.push({ slot, room: ot });
                });
                
                unoccupiedSlots.forEach(slot => {
                  allUnoccupiedSlots.push({ slot, room: ot });
                });
              });
              
              if (allOccupiedSlots.length === 0 && allUnoccupiedSlots.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    No slots found for the selected date
                  </div>
                );
              }
              
              return (
                <>
                  {/* Occupied Slots Section */}
                  {allOccupiedSlots.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Occupied ({allOccupiedSlots.length})</h3>
                      <div className="grid grid-cols-4 gap-4">
                        {allOccupiedSlots.map(({ slot, room }) => {
                    const operationStatus = slot.operationStatus;
                    const isCompleted = operationStatus === 'Completed';
                    const isScheduled = operationStatus === 'Scheduled';
                    const isInProgress = operationStatus === 'InProgress';
                    
                    return (
                            <div
                              key={`${room.id}-${slot.id}`}
                              className="p-3 border-2 rounded-lg border-red-300 bg-red-50"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="text-sm font-semibold text-gray-900">
                                    {room.otName || room.otNo || room.otId}
                                  </h3>
                                  {room.otType && (
                                    <p className="text-xs text-gray-500">
                                      {room.otType}
                                    </p>
                                  )}
                                </div>
                                <span className="size-3 rounded-full bg-red-500" />
                              </div>
                              
                              {/* Slot Time */}
                              {slot.slotStartTime && slot.slotEndTime && (
                                <div className="mb-2">
                                  <p className="text-xs text-gray-500 mb-0.5">
                                    {slot.otSlotNo || `Slot ${slot.id}`}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <Clock className="size-3 text-gray-600" />
                                    <span className="font-medium text-gray-700">
                                      {slot.slotStartTime} - {slot.slotEndTime}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Patient Information */}
                              {slot.patientName && (
                                <div className="mb-1.5">
                                  <p className="text-xs text-gray-500 mb-0.5">Patient</p>
                                  <p className="text-xs font-medium text-gray-900">{slot.patientName}</p>
                                  {slot.patientNo && (
                                    <p className="text-xs text-gray-500">No: {slot.patientNo}</p>
                                  )}
                                </div>
                              )}
                              
                              {/* Operation Status */}
                              {isInProgress && (
                                <div className="flex items-center gap-1.5 p-1.5 bg-red-50 rounded mb-1.5">
                                  <Scissors className="size-3 text-red-600" />
                                  <span className="text-xs font-medium text-red-900">In Progress</span>
                                </div>
                              )}
                              {isScheduled && (
                                <div className="flex items-center gap-1.5 p-1.5 bg-yellow-50 rounded mb-1.5">
                                  <Clock className="size-3 text-yellow-600" />
                                  <span className="text-xs font-medium text-yellow-900">Scheduled</span>
                                </div>
                              )}
                              {isCompleted && (
                                <div className="flex items-center gap-1.5 p-1.5 bg-blue-50 rounded mb-1.5">
                                  <CheckCircle className="size-3 text-blue-600" />
                                  <span className="text-xs font-medium text-blue-900">Completed</span>
                                </div>
                              )}
                            </div>
                          );
                  })}
                      </div>
                    </div>
                  )}
                  
                  {/* Unoccupied Slots Section - Collapsible */}
                  {allUnoccupiedSlots.length > 0 && (
                    <div>
                      <button
                        onClick={() => setIsUnoccupiedSlotsExpanded(!isUnoccupiedSlotsExpanded)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 hover:text-gray-900"
                      >
                        {isUnoccupiedSlotsExpanded ? (
                          <>
                            <ChevronUp className="size-4" />
                            Hide Unoccupied ({allUnoccupiedSlots.length})
                          </>
                        ) : (
                          <>
                            <Plus className="size-4" />
                            Show Unoccupied ({allUnoccupiedSlots.length})
                          </>
                        )}
                      </button>
                      {isUnoccupiedSlotsExpanded && (
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          {allUnoccupiedSlots.map(({ slot, room }) => {
                            return (
                              <div
                                key={`${room.id}-${slot.id}`}
                                className="p-3 border-2 rounded-lg border-green-300 bg-green-50"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <h3 className="text-sm font-semibold text-gray-900">
                                      {room.otName || room.otNo || room.otId}
                                    </h3>
                                    {room.otType && (
                                      <p className="text-xs text-gray-500">
                                        {room.otType}
                                      </p>
                                    )}
                                  </div>
                                  <span className="size-3 rounded-full bg-green-500" />
                                </div>
                                
                                {/* Slot Time */}
                                {slot.slotStartTime && slot.slotEndTime && (
                                  <div>
                                    <p className="text-xs text-gray-500 mb-0.5">
                                      {slot.otSlotNo || `Slot ${slot.id}`}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <Clock className="size-3 text-gray-600" />
                                      <span className="font-medium text-gray-700">
                                        {slot.slotStartTime} - {slot.slotEndTime}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()
          )}
        </CardContent>
      </Card>

      {/* Surgeries List */}
      <Tabs defaultValue="today" className="space-y-6">
        <TabsList>
          <TabsTrigger value="today">Today's Surgeries ({todayAllocations.length})</TabsTrigger>
          <TabsTrigger value="progress">In Progress ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({scheduled.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <AllocationList
            allocations={todayAllocations}
            otRooms={otRooms}
            otSlotsByRoom={otSlotsByRoom}
            onRefresh={async () => {
              try {
                await fetchAllocations();
              } catch (err) {
                console.error('Failed to refresh allocations:', err);
              }
            }}
            availableDoctors={availableDoctors}
            patients={patients}
            availableNurses={availableNurses}
            availablePatientAppointments={availablePatientAppointments}
            availableRoomAdmissions={availableRoomAdmissions}
            availableEmergencyBedSlots={availableEmergencyBedSlots}
          />
        </TabsContent>

        <TabsContent value="progress">
          <AllocationList
            allocations={inProgress}
            otRooms={otRooms}
            otSlotsByRoom={otSlotsByRoom}
            onRefresh={async () => {
              try {
                await fetchAllocations();
              } catch (err) {
                console.error('Failed to refresh allocations:', err);
              }
            }}
            availableDoctors={availableDoctors}
            patients={patients}
            availableNurses={availableNurses}
            availablePatientAppointments={availablePatientAppointments}
            availableRoomAdmissions={availableRoomAdmissions}
            availableEmergencyBedSlots={availableEmergencyBedSlots}
          />
        </TabsContent>

        <TabsContent value="scheduled">
          <AllocationList
            allocations={scheduled}
            otRooms={otRooms}
            otSlotsByRoom={otSlotsByRoom}
            onRefresh={async () => {
              try {
                await fetchAllocations();
              } catch (err) {
                console.error('Failed to refresh allocations:', err);
              }
            }}
            availableDoctors={availableDoctors}
            patients={patients}
            availableNurses={availableNurses}
            availablePatientAppointments={availablePatientAppointments}
            availableRoomAdmissions={availableRoomAdmissions}
            availableEmergencyBedSlots={availableEmergencyBedSlots}
          />
        </TabsContent>

        <TabsContent value="completed">
          <AllocationList
            allocations={completed}
            otRooms={otRooms}
            otSlotsByRoom={otSlotsByRoom}
            onRefresh={async () => {
              try {
                await fetchAllocations();
              } catch (err) {
                console.error('Failed to refresh allocations:', err);
              }
            }}
            availableDoctors={availableDoctors}
            patients={patients}
            availableNurses={availableNurses}
            availablePatientAppointments={availablePatientAppointments}
            availableRoomAdmissions={availableRoomAdmissions}
            availableEmergencyBedSlots={availableEmergencyBedSlots}
          />
        </TabsContent>
      </Tabs>
        </div>
      </div>
      <CustomResizableDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        className="p-0 gap-0"
        initialWidth={550}
        maxWidth={typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.95) : 1800}
      >
        <CustomResizableDialogClose onClick={() => setIsDialogOpen(false)} />
        <div className="dialog-scrollable-wrapper dialog-content-scrollable flex flex-col flex-1 min-h-0 overflow-y-auto">
          <CustomResizableDialogHeader className="dialog-header-standard flex-shrink-0">
            <CustomResizableDialogTitle className="dialog-title-standard">Add New Patient OT Allocation</CustomResizableDialogTitle>
          </CustomResizableDialogHeader>
          <div className="dialog-body-content-wrapper">
            <div className="dialog-form-container space-y-4">
              <div className="dialog-form-field">
                <Label htmlFor="add-patientSourceType" className="dialog-label-standard">Patient Source *</Label>
                <select
                  id="add-patientSourceType"
                  className="dialog-select-standard w-full"
                  value={patientSourceType}
                  onChange={(e) => {
                    const sourceType = e.target.value as 'IPD' | 'OPD' | 'EmergencyBed' | '';
                    // Save current selection before switching
                    if (patientSourceType) {
                      const currentId = patientSourceType === 'IPD' 
                        ? formData.roomAdmissionId 
                        : patientSourceType === 'OPD' 
                        ? formData.patientAppointmentId 
                        : formData.emergencyBedSlotId;
                      
                      if (currentId) {
                        setSavedPatientSourceIds(prev => ({
                          ...prev,
                          [patientSourceType]: currentId
                        }));
                      }
                    }
                    
                    setPatientSourceType(sourceType);
                    
                    // Restore saved selection if switching back to a previously selected source type
                    if (sourceType && savedPatientSourceIds[sourceType as keyof typeof savedPatientSourceIds]) {
                      const savedId = savedPatientSourceIds[sourceType as keyof typeof savedPatientSourceIds] || '';
                      if (sourceType === 'IPD') {
                        setFormData({ 
                          ...formData, 
                          roomAdmissionId: savedId, 
                          patientAppointmentId: '', 
                          emergencyBedSlotId: '' 
                        });
                        // Restore search term if we can find the admission
                        const admission = availableRoomAdmissions.find(a => 
                          (a.roomAdmissionId?.toString() || a.id?.toString()) === savedId
                        );
                        if (admission) {
                          setRoomAdmissionSearchTerm(`${admission.patientName} - ${admission.bedNumber}`);
                        }
                        setPatientAppointmentSearchTerm('');
                        setEmergencyBedSlotSearchTerm('');
                      } else if (sourceType === 'OPD') {
                        setFormData({ 
                          ...formData, 
                          patientAppointmentId: savedId, 
                          roomAdmissionId: '', 
                          emergencyBedSlotId: '' 
                        });
                        // Restore search term if we can find the appointment
                        const appointment = availablePatientAppointments.find(a => a.id.toString() === savedId);
                        if (appointment) {
                          const patient = patients.find(p => 
                            (p as any).patientId === appointment.patientId || 
                            (p as any).PatientId === appointment.patientId
                          );
                          const patientName = patient 
                            ? `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() 
                            : appointment.patientId || 'Unknown';
                          setPatientAppointmentSearchTerm(`${appointment.tokenNo} - ${patientName}`);
                        }
                        setRoomAdmissionSearchTerm('');
                        setEmergencyBedSlotSearchTerm('');
                      } else if (sourceType === 'EmergencyBed') {
                        setFormData({ 
                          ...formData, 
                          emergencyBedSlotId: savedId, 
                          roomAdmissionId: '', 
                          patientAppointmentId: '' 
                        });
                        // Restore search term if we can find the slot
                        const slot = availableEmergencyBedSlots.find(s => {
                          const slotId = s.EmergencyBedSlotId?.toString() || s.emergencyBedSlotId?.toString() || s.id?.toString() || '';
                          return slotId === savedId;
                        });
                        if (slot) {
                          const patientName = slot.PatientName || slot.patientName || 'Unknown';
                          const bedSlotNo = slot.EmergencyBedSlotNo || slot.emergencyBedSlotNo || slot.eBedSlotNo || '';
                          setEmergencyBedSlotSearchTerm(`${patientName} - ${bedSlotNo}`);
                        }
                        setRoomAdmissionSearchTerm('');
                        setPatientAppointmentSearchTerm('');
                      }
                    } else {
                      // Clear all patient source selections when switching to a new source type
                      setFormData({ 
                        ...formData, 
                        roomAdmissionId: '', 
                        patientAppointmentId: '', 
                        emergencyBedSlotId: '' 
                      });
                      setRoomAdmissionSearchTerm('');
                      setPatientAppointmentSearchTerm('');
                      setEmergencyBedSlotSearchTerm('');
                    }
                  }}
                >
                  <option value="">Select Patient Source</option>
                  <option value="IPD">IPD (Room Admission Number)</option>
                  <option value="OPD">OPD (Patient Appointment Number)</option>
                  <option value="EmergencyBed">EmergencyBed (Emergency Bed Number)</option>
                </select>
              </div>

              {patientSourceType === 'IPD' && (
                  <div className="dialog-form-field">
                    <Label htmlFor="add-roomAdmissionId" className="dialog-label-standard">Room Admission (IPD) *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="add-roomAdmissionId"
                        autoComplete="off"
                        placeholder="Search by Patient Name, Bed Number, or Room Type..."
                        value={roomAdmissionSearchTerm}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setRoomAdmissionSearchTerm(newValue);
                          setRoomAdmissionHighlightIndex(-1);
                          // Clear admission selection if user edits the search term
                          if (formData.roomAdmissionId) {
                            setFormData({ ...formData, roomAdmissionId: '', patientAppointmentId: '', emergencyBedSlotId: '' });
                            setPatientAppointmentSearchTerm('');
                            setEmergencyBedSlotSearchTerm('');
                          }
                        }}
                        onKeyDown={(e) => {
                          const filteredAdmissions = availableRoomAdmissions.filter(admission => {
                            if (!roomAdmissionSearchTerm) return false;
                            const searchLower = roomAdmissionSearchTerm.toLowerCase();
                            const patientName = admission.patientName || '';
                            const bedNumber = admission.bedNumber || '';
                            const roomType = admission.roomType || '';
                            const admissionId = admission.roomAdmissionId?.toString() || admission.id?.toString() || '';
                            return (
                              patientName.toLowerCase().includes(searchLower) ||
                              bedNumber.toLowerCase().includes(searchLower) ||
                              roomType.toLowerCase().includes(searchLower) ||
                              admissionId.includes(searchLower)
                            );
                          });
                          
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setRoomAdmissionHighlightIndex(prev => 
                              prev < filteredAdmissions.length - 1 ? prev + 1 : prev
                            );
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setRoomAdmissionHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                          } else if (e.key === 'Enter' && roomAdmissionHighlightIndex >= 0 && filteredAdmissions[roomAdmissionHighlightIndex]) {
                            e.preventDefault();
                            const admission = filteredAdmissions[roomAdmissionHighlightIndex];
                            const admissionId = admission.roomAdmissionId?.toString() || admission.id?.toString() || '';
                            setFormData({ ...formData, roomAdmissionId: admissionId, patientAppointmentId: '', emergencyBedSlotId: '' });
                            // Save the selected ID for persistence
                            setSavedPatientSourceIds(prev => ({ ...prev, IPD: admissionId }));
                            setRoomAdmissionSearchTerm(`${admission.patientName} - ${admission.bedNumber}`);
                            setRoomAdmissionHighlightIndex(-1);
                            setPatientAppointmentSearchTerm('');
                            setEmergencyBedSlotSearchTerm('');
                          }
                        }}
                        className="pl-10"
                      />
                    </div>
                    {roomAdmissionSearchTerm && (() => {
                      const filteredAdmissions = availableRoomAdmissions.filter(admission => {
                        if (!roomAdmissionSearchTerm) return false;
                        const searchLower = roomAdmissionSearchTerm.toLowerCase();
                        const patientName = admission.patientName || '';
                        const bedNumber = admission.bedNumber || '';
                        const roomType = admission.roomType || '';
                        const admissionId = admission.roomAdmissionId?.toString() || admission.id?.toString() || '';
                        return (
                          patientName.toLowerCase().includes(searchLower) ||
                          bedNumber.toLowerCase().includes(searchLower) ||
                          roomType.toLowerCase().includes(searchLower) ||
                          admissionId.includes(searchLower)
                        );
                      });
                      
                      return filteredAdmissions.length > 0 ? (
                        <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto mt-1" id="add-roomAdmission-dropdown">
                          <table className="w-full">
                            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Patient</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Bed Number</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Room Type</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Admission Date</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredAdmissions.map((admission, index) => {
                                const isSelected = formData.roomAdmissionId === (admission.roomAdmissionId?.toString() || admission.id?.toString() || '');
                                const isHighlighted = roomAdmissionHighlightIndex === index;
                                const formattedDate = admission.admissionDate ? formatDateDisplayIST(admission.admissionDate) : 'N/A';
                                return (
                                  <tr
                                    key={admission.roomAdmissionId || admission.id}
                                    onClick={() => {
                                      const admissionId = admission.roomAdmissionId?.toString() || admission.id?.toString() || '';
                                      setFormData({ ...formData, roomAdmissionId: admissionId, patientAppointmentId: '', emergencyBedSlotId: '' });
                                      // Save the selected ID for persistence
                                      setSavedPatientSourceIds(prev => ({ ...prev, IPD: admissionId }));
                                      setRoomAdmissionSearchTerm(`${admission.patientName} - ${admission.bedNumber}`);
                                      setRoomAdmissionHighlightIndex(-1);
                                      setPatientAppointmentSearchTerm('');
                                      setEmergencyBedSlotSearchTerm('');
                                    }}
                                    onMouseDown={(e) => {
                                      // Prevent input from losing focus when clicking on dropdown
                                      e.preventDefault();
                                    }}
                                    className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                  >
                                    <td className="py-2 px-3 text-sm text-gray-900">{admission.patientName || 'Unknown'}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600 font-mono">{admission.bedNumber || '-'}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{admission.roomType || '-'}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{formattedDate}</td>
                                    <td className="py-2 px-3 text-sm">
                                      <span className={`px-2 py-0.5 rounded text-xs ${
                                        admission.status === 'Active' 
                                          ? 'bg-green-100 text-green-700' 
                                          : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {admission.status || 'Active'}
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
                  )}

                  {patientSourceType === 'OPD' && (
                  <div className="dialog-form-field">
                    <Label htmlFor="add-patientAppointmentId" className="dialog-label-standard">Patient Appointment (OPD) *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="add-patientAppointmentId"
                        autoComplete="off"
                        placeholder="Search by Token No, Patient Name, or Doctor Name..."
                        value={patientAppointmentSearchTerm}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setPatientAppointmentSearchTerm(newValue);
                          setPatientAppointmentHighlightIndex(-1);
                          // Clear appointment selection if user edits the search term
                          if (formData.patientAppointmentId) {
                            setFormData({ ...formData, patientAppointmentId: '', roomAdmissionId: '', emergencyBedSlotId: '' });
                          }
                        }}
                        onKeyDown={(e) => {
                          const filteredAppointments = availablePatientAppointments.filter(appointment => {
                            if (!patientAppointmentSearchTerm) return false;
                            const searchLower = patientAppointmentSearchTerm.toLowerCase();
                            const tokenNo = appointment.tokenNo || '';
                            const patient = patients.find(p => 
                              (p as any).patientId === appointment.patientId || 
                              (p as any).PatientId === appointment.patientId
                            );
                            const patientName = patient 
                              ? `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() 
                              : '';
                            const doctorName = availableDoctors.find(d => d.id.toString() === appointment.doctorId)?.name || '';
                            return (
                              tokenNo.toLowerCase().includes(searchLower) ||
                              patientName.toLowerCase().includes(searchLower) ||
                              doctorName.toLowerCase().includes(searchLower)
                            );
                          });
                          
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setPatientAppointmentHighlightIndex(prev => 
                              prev < filteredAppointments.length - 1 ? prev + 1 : prev
                            );
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setPatientAppointmentHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                          } else if (e.key === 'Enter' && patientAppointmentHighlightIndex >= 0 && filteredAppointments[patientAppointmentHighlightIndex]) {
                            e.preventDefault();
                            const appointment = filteredAppointments[patientAppointmentHighlightIndex];
                            setFormData({ ...formData, patientAppointmentId: appointment.id.toString(), roomAdmissionId: '', emergencyBedSlotId: '' });
                            // Save the selected ID for persistence
                            setSavedPatientSourceIds(prev => ({ ...prev, OPD: appointment.id.toString() }));
                            const patient = patients.find(p => 
                              (p as any).patientId === appointment.patientId || 
                              (p as any).PatientId === appointment.patientId
                            );
                            const patientName = patient 
                              ? `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() 
                              : appointment.patientId || 'Unknown';
                            setPatientAppointmentSearchTerm(`${appointment.tokenNo} - ${patientName}`);
                            setPatientAppointmentHighlightIndex(-1);
                          }
                        }}
                        className="pl-10"
                      />
                    </div>
                    {patientAppointmentSearchTerm && (() => {
                      const filteredAppointments = availablePatientAppointments.filter(appointment => {
                        if (!patientAppointmentSearchTerm) return false;
                        const searchLower = patientAppointmentSearchTerm.toLowerCase();
                        const tokenNo = appointment.tokenNo || '';
                        const patient = patients.find(p => 
                          (p as any).patientId === appointment.patientId || 
                          (p as any).PatientId === appointment.patientId
                        );
                        const patientName = patient 
                          ? `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() 
                          : '';
                        const doctorName = availableDoctors.find(d => d.id.toString() === appointment.doctorId)?.name || '';
                        return (
                          tokenNo.toLowerCase().includes(searchLower) ||
                          patientName.toLowerCase().includes(searchLower) ||
                          doctorName.toLowerCase().includes(searchLower)
                        );
                      });
                      
                      return filteredAppointments.length > 0 ? (
                        <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto mt-1" id="add-patientAppointment-dropdown">
                          <table className="w-full">
                            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Token No</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Patient</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Doctor</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Date</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Time</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredAppointments.map((appointment, index) => {
                                const isSelected = formData.patientAppointmentId === appointment.id.toString();
                                const isHighlighted = patientAppointmentHighlightIndex === index;
                                const patient = patients.find(p => 
                                  (p as any).patientId === appointment.patientId || 
                                  (p as any).PatientId === appointment.patientId
                                );
                                const patientName = patient 
                                  ? `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() 
                                  : appointment.patientId || 'Unknown';
                                const doctorName = availableDoctors.find(d => d.id.toString() === appointment.doctorId)?.name || 'Unknown';
                                const formattedDate = appointment.appointmentDate ? formatDateDisplayIST(appointment.appointmentDate) : 'N/A';
                                return (
                                  <tr
                                    key={appointment.id}
                                    onClick={() => {
                                      setFormData({ ...formData, patientAppointmentId: appointment.id.toString(), roomAdmissionId: '', emergencyBedSlotId: '' });
                                      // Save the selected ID for persistence
                                      setSavedPatientSourceIds(prev => ({ ...prev, OPD: appointment.id.toString() }));
                                      setPatientAppointmentSearchTerm(`${appointment.tokenNo} - ${patientName}`);
                                      setPatientAppointmentHighlightIndex(-1);
                                    }}
                                    onMouseDown={(e) => {
                                      // Prevent input from losing focus when clicking on dropdown
                                      e.preventDefault();
                                    }}
                                    className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                  >
                                    <td className="py-2 px-3 text-sm text-gray-900 font-mono">{appointment.tokenNo || '-'}</td>
                                    <td className="py-2 px-3 text-sm text-gray-900">{patientName}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{doctorName}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{formattedDate}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{appointment.appointmentTime || '-'}</td>
                                    <td className="py-2 px-3 text-sm">
                                      <span className={`px-2 py-0.5 rounded text-xs ${
                                        appointment.appointmentStatus === 'Completed' 
                                          ? 'bg-green-100 text-green-700' 
                                          : appointment.appointmentStatus === 'Consulting'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {appointment.appointmentStatus || 'Waiting'}
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
                  )}

                  {patientSourceType === 'EmergencyBed' && (
                  <div className="dialog-form-field">
                    <Label htmlFor="add-emergencyBedSlotId" className="dialog-label-standard">Emergency Bed Slot *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="add-emergencyBedSlotId"
                        autoComplete="off"
                        placeholder="Search by Patient Name, Bed Slot No, or Bed No..."
                        value={emergencyBedSlotSearchTerm}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setEmergencyBedSlotSearchTerm(newValue);
                          setEmergencyBedSlotHighlightIndex(-1);
                          // Clear emergency bed slot selection if user edits the search term
                          if (formData.emergencyBedSlotId) {
                            setFormData({ ...formData, emergencyBedSlotId: '', roomAdmissionId: '', patientAppointmentId: '' });
                            setPatientAppointmentSearchTerm('');
                            setRoomAdmissionSearchTerm('');
                          }
                        }}
                        onKeyDown={(e) => {
                          const filteredSlots = availableEmergencyBedSlots.filter(slot => {
                            if (!emergencyBedSlotSearchTerm) return false;
                            const searchLower = emergencyBedSlotSearchTerm.toLowerCase();
                            const patientName = slot.PatientName || slot.patientName || '';
                            const bedSlotNo = slot.EmergencyBedSlotNo || slot.emergencyBedSlotNo || slot.eBedSlotNo || '';
                            const bedNo = slot.EmergencyBedNo || slot.emergencyBedNo || '';
                            const slotId = slot.EmergencyBedSlotId?.toString() || slot.emergencyBedSlotId?.toString() || slot.id?.toString() || '';
                            return (
                              patientName.toLowerCase().includes(searchLower) ||
                              bedSlotNo.toLowerCase().includes(searchLower) ||
                              bedNo.toLowerCase().includes(searchLower) ||
                              slotId.includes(searchLower)
                            );
                          });
                          
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setEmergencyBedSlotHighlightIndex(prev => 
                              prev < filteredSlots.length - 1 ? prev + 1 : prev
                            );
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setEmergencyBedSlotHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                          } else if (e.key === 'Enter' && emergencyBedSlotHighlightIndex >= 0 && filteredSlots[emergencyBedSlotHighlightIndex]) {
                            e.preventDefault();
                            const slot = filteredSlots[emergencyBedSlotHighlightIndex];
                            const slotId = slot.EmergencyBedSlotId?.toString() || slot.emergencyBedSlotId?.toString() || slot.id?.toString() || '';
                            setFormData({ ...formData, emergencyBedSlotId: slotId, roomAdmissionId: '', patientAppointmentId: '' });
                            // Save the selected ID for persistence
                            setSavedPatientSourceIds(prev => ({ ...prev, EmergencyBed: slotId }));
                            const patientName = slot.PatientName || slot.patientName || 'Unknown';
                            const bedSlotNo = slot.EmergencyBedSlotNo || slot.emergencyBedSlotNo || slot.eBedSlotNo || '';
                            setEmergencyBedSlotSearchTerm(`${patientName} - ${bedSlotNo}`);
                            setEmergencyBedSlotHighlightIndex(-1);
                            setPatientAppointmentSearchTerm('');
                            setRoomAdmissionSearchTerm('');
                          }
                        }}
                        className="pl-10"
                      />
                    </div>
                    {emergencyBedSlotSearchTerm && (() => {
                      const filteredSlots = availableEmergencyBedSlots.filter(slot => {
                        if (!emergencyBedSlotSearchTerm) return false;
                        const searchLower = emergencyBedSlotSearchTerm.toLowerCase();
                        const patientName = slot.PatientName || slot.patientName || '';
                        const bedSlotNo = slot.EmergencyBedSlotNo || slot.emergencyBedSlotNo || slot.eBedSlotNo || '';
                        const bedNo = slot.EmergencyBedNo || slot.emergencyBedNo || '';
                        const slotId = slot.EmergencyBedSlotId?.toString() || slot.emergencyBedSlotId?.toString() || slot.id?.toString() || '';
                        return (
                          patientName.toLowerCase().includes(searchLower) ||
                          bedSlotNo.toLowerCase().includes(searchLower) ||
                          bedNo.toLowerCase().includes(searchLower) ||
                          slotId.includes(searchLower)
                        );
                      });
                      
                      return filteredSlots.length > 0 ? (
                        <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto mt-1" id="add-emergencyBedSlot-dropdown">
                          <table className="w-full">
                            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Patient</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Bed Slot No</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Bed No</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Admission Date</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredSlots.map((slot, index) => {
                                const slotId = slot.EmergencyBedSlotId?.toString() || slot.emergencyBedSlotId?.toString() || slot.id?.toString() || '';
                                const isSelected = formData.emergencyBedSlotId === slotId;
                                const isHighlighted = emergencyBedSlotHighlightIndex === index;
                                const patientName = slot.PatientName || slot.patientName || 'Unknown';
                                const bedSlotNo = slot.EmergencyBedSlotNo || slot.emergencyBedSlotNo || slot.eBedSlotNo || '-';
                                const bedNo = slot.EmergencyBedNo || slot.emergencyBedNo || '-';
                                const admissionDate = slot.EmergencyAdmissionDate || slot.emergencyAdmissionDate || '';
                                const formattedDate = admissionDate ? formatDateDisplayIST(typeof admissionDate === 'string' ? admissionDate : admissionDate.toString()) : 'N/A';
                                const status = slot.Status || slot.status || 'Active';
                                return (
                                  <tr
                                    key={slotId}
                                    onClick={() => {
                                      setFormData({ ...formData, emergencyBedSlotId: slotId, roomAdmissionId: '', patientAppointmentId: '' });
                                      // Save the selected ID for persistence
                                      setSavedPatientSourceIds(prev => ({ ...prev, EmergencyBed: slotId }));
                                      setEmergencyBedSlotSearchTerm(`${patientName} - ${bedSlotNo}`);
                                      setEmergencyBedSlotHighlightIndex(-1);
                                      setPatientAppointmentSearchTerm('');
                                      setRoomAdmissionSearchTerm('');
                                    }}
                                    onMouseDown={(e) => {
                                      // Prevent input from losing focus when clicking on dropdown
                                      e.preventDefault();
                                    }}
                                    className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                  >
                                    <td className="py-2 px-3 text-sm text-gray-900">{patientName}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600 font-mono">{bedSlotNo}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600 font-mono">{bedNo}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{formattedDate}</td>
                                    <td className="py-2 px-3 text-sm">
                                      <span className={`px-2 py-0.5 rounded text-xs ${
                                        status === 'Active' 
                                          ? 'bg-green-100 text-green-700' 
                                          : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {status}
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
                  )}

                  <div className="dialog-form-field">
                    <Label htmlFor="add-otAllocationDate" className="dialog-label-standard">OT Allocation Date *</Label>
                    <DatePicker
                      id="add-otAllocationDate"
                      selected={addOtAllocationDate}
                      onChange={(date: Date | null) => {
                        setAddOtAllocationDate(date);
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const dateStr = `${year}-${month}-${day}`;
                          setFormData({ ...formData, otAllocationDate: dateStr });
                        } else {
                          setFormData({ ...formData, otAllocationDate: '' });
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
                    />
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="add-otId" className="dialog-label-standard">OT *</Label>
                    <select
                      id="add-otId"
                      className="dialog-select-standard"
                      value={formData.otId}
                      onChange={(e) => {
                        setSelectedOTId(e.target.value);
                        setFormData({ ...formData, otId: e.target.value, otSlotIds: [] });
                      }}
                    >
                      <option value="">Select OT</option>
                      {otRooms.map(ot => (
                        <option key={ot.id} value={ot.id.toString()}>
                          {ot.otNo} - {ot.otName} ({ot.otType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="dialog-form-field">
                    <Label className="dialog-label-standard">OT Slots</Label>
                    <div className="border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto mt-1">
                      {!formData.otId ? (
                        <p className="text-sm text-gray-500">Please select an OT first</p>
                      ) : otSlots.length === 0 ? (
                        <p className="text-sm text-gray-500">No slots available for this OT</p>
                      ) : (
                        otSlots.map(slot => {
                          const isSlotOccupied = slot.isOccupied === true;
                          return (
                            <label 
                              key={slot.id} 
                              className={`flex items-center gap-2 py-1 rounded px-2 ${
                                isSlotOccupied 
                                  ? 'cursor-not-allowed opacity-40 bg-gray-100' 
                                  : 'cursor-pointer hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={(formData.otSlotIds || []).includes(slot.id)}
                                onChange={(e) => {
                                  const currentSlotIds = formData.otSlotIds || [];
                                  let newSlotIds: number[];
                                  if (e.target.checked) {
                                    newSlotIds = [...currentSlotIds, slot.id];
                                  } else {
                                    newSlotIds = currentSlotIds.filter(id => id !== slot.id);
                                  }
                                  setFormData({ ...formData, otSlotIds: newSlotIds });
                                }}
                                disabled={isSlotOccupied}
                                className="rounded border-gray-300"
                              />
                              <span className={`text-sm ${
                                isSlotOccupied 
                                  ? 'text-gray-400 line-through' 
                                  : 'text-gray-700'
                              }`}>
                                {slot.otSlotNo} - {slot.slotStartTime} to {slot.slotEndTime}
                                {isSlotOccupied && <span className="ml-2 text-xs text-red-500">(Occupied)</span>}
                                {slot.isAvailable && !isSlotOccupied && <span className="ml-2 text-xs text-green-600">(Available)</span>}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                    {formData.otSlotIds && formData.otSlotIds.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">Selected: {formData.otSlotIds.length} slot(s)</p>
                    )}
                  </div>

                  <div className="dialog-form-field-grid">
                    <div className="dialog-field-single-column">
                      <Label htmlFor="add-leadSurgeonId" className="dialog-label-standard">Lead Surgeon *</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          id="add-leadSurgeonId"
                          autoComplete="off"
                          placeholder="Search by Doctor Name or Specialty..."
                          value={leadSurgeonSearchTerm}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setLeadSurgeonSearchTerm(newValue);
                            setLeadSurgeonHighlightIndex(-1);
                            // Clear doctor selection if user edits the search term
                            if (formData.leadSurgeonId) {
                              setFormData({ ...formData, leadSurgeonId: '' });
                            }
                          }}
                          onKeyDown={(e) => {
                            const filteredDoctors = availableDoctors.filter(doctor => {
                              if (!leadSurgeonSearchTerm) return false;
                              const searchLower = leadSurgeonSearchTerm.toLowerCase();
                              const doctorName = doctor.name || '';
                              const specialty = doctor.specialty || '';
                              return (
                                doctorName.toLowerCase().includes(searchLower) ||
                                specialty.toLowerCase().includes(searchLower)
                              );
                            });
                            
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setLeadSurgeonHighlightIndex(prev => 
                                prev < filteredDoctors.length - 1 ? prev + 1 : prev
                              );
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setLeadSurgeonHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                            } else if (e.key === 'Enter' && leadSurgeonHighlightIndex >= 0 && filteredDoctors[leadSurgeonHighlightIndex]) {
                              e.preventDefault();
                              const doctor = filteredDoctors[leadSurgeonHighlightIndex];
                              setFormData({ ...formData, leadSurgeonId: doctor.id.toString() });
                              setLeadSurgeonSearchTerm(`${doctor.name} - ${doctor.specialty}`);
                              setLeadSurgeonHighlightIndex(-1);
                            }
                          }}
                          className="dialog-input-standard pl-10"
                        />
                      </div>
                      {leadSurgeonSearchTerm && (() => {
                        const filteredDoctors = availableDoctors.filter(doctor => {
                          if (!leadSurgeonSearchTerm) return false;
                          const searchLower = leadSurgeonSearchTerm.toLowerCase();
                          const doctorName = doctor.name || '';
                          const specialty = doctor.specialty || '';
                          return (
                            doctorName.toLowerCase().includes(searchLower) ||
                            specialty.toLowerCase().includes(searchLower)
                          );
                        });
                        
                        return filteredDoctors.length > 0 ? (
                          <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto mt-1" style={{ zIndex: 1000 }}>
                            <table className="w-full">
                              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Department</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredDoctors.map((doctor, index) => {
                                  const isSelected = formData.leadSurgeonId === doctor.id.toString();
                                  const isHighlighted = leadSurgeonHighlightIndex === index;
                                  return (
                                    <tr
                                      key={doctor.id}
                                      onClick={() => {
                                        setFormData({ ...formData, leadSurgeonId: doctor.id.toString() });
                                        setLeadSurgeonSearchTerm(`${doctor.name} - ${doctor.specialty}`);
                                        setLeadSurgeonHighlightIndex(-1);
                                      }}
                                      onMouseDown={(e) => {
                                        // Prevent input from losing focus when clicking on dropdown
                                        e.preventDefault();
                                      }}
                                      className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                    >
                                      <td className="py-2 px-3 text-sm text-gray-900">{doctor.name}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{doctor.specialty}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div className="dialog-field-single-column">
                      <Label htmlFor="add-assistantDoctorId" className="dialog-label-standard">Assistant Doctor</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          id="add-assistantDoctorId"
                          autoComplete="off"
                          placeholder="Search by Doctor Name or Department..."
                          value={assistantDoctorSearchTerm}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setAssistantDoctorSearchTerm(newValue);
                            setAssistantDoctorHighlightIndex(-1);
                            // Clear doctor selection if user edits the search term
                            if (formData.assistantDoctorId) {
                              setFormData({ ...formData, assistantDoctorId: '' });
                            }
                          }}
                          onKeyDown={(e) => {
                            const filteredDoctors = availableDoctors.filter(doctor => {
                              if (!assistantDoctorSearchTerm) return false;
                              const searchLower = assistantDoctorSearchTerm.toLowerCase();
                              const doctorName = doctor.name || '';
                              const specialty = doctor.specialty || '';
                              return (
                                doctorName.toLowerCase().includes(searchLower) ||
                                specialty.toLowerCase().includes(searchLower)
                              );
                            });
                            
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setAssistantDoctorHighlightIndex(prev => 
                                prev < filteredDoctors.length - 1 ? prev + 1 : prev
                              );
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setAssistantDoctorHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                            } else if (e.key === 'Enter' && assistantDoctorHighlightIndex >= 0 && filteredDoctors[assistantDoctorHighlightIndex]) {
                              e.preventDefault();
                              const doctor = filteredDoctors[assistantDoctorHighlightIndex];
                              setFormData({ ...formData, assistantDoctorId: doctor.id.toString() });
                              setAssistantDoctorSearchTerm(`${doctor.name} - ${doctor.specialty}`);
                              setAssistantDoctorHighlightIndex(-1);
                            }
                          }}
                          className="dialog-input-standard pl-10"
                        />
                      </div>
                      {assistantDoctorSearchTerm && (() => {
                        const filteredDoctors = availableDoctors.filter(doctor => {
                          if (!assistantDoctorSearchTerm) return false;
                          const searchLower = assistantDoctorSearchTerm.toLowerCase();
                          const doctorName = doctor.name || '';
                          const specialty = doctor.specialty || '';
                          return (
                            doctorName.toLowerCase().includes(searchLower) ||
                            specialty.toLowerCase().includes(searchLower)
                          );
                        });
                        
                        return filteredDoctors.length > 0 ? (
                          <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto mt-1" style={{ zIndex: 1000 }}>
                            <table className="w-full">
                              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Department</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredDoctors.map((doctor, index) => {
                                  const isSelected = formData.assistantDoctorId === doctor.id.toString();
                                  const isHighlighted = assistantDoctorHighlightIndex === index;
                                  return (
                                    <tr
                                      key={doctor.id}
                                      onClick={() => {
                                        setFormData({ ...formData, assistantDoctorId: doctor.id.toString() });
                                        setAssistantDoctorSearchTerm(`${doctor.name} - ${doctor.specialty}`);
                                        setAssistantDoctorHighlightIndex(-1);
                                      }}
                                      onMouseDown={(e) => {
                                        // Prevent input from losing focus when clicking on dropdown
                                        e.preventDefault();
                                      }}
                                      className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                    >
                                      <td className="py-2 px-3 text-sm text-gray-900">{doctor.name}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{doctor.specialty}</td>
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

                  <div className="dialog-form-field-grid">
                    <div className="dialog-field-single-column">
                      <Label htmlFor="add-anaesthetistId" className="dialog-label-standard">Anaesthetist</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          id="add-anaesthetistId"
                          autoComplete="off"
                          placeholder="Search by Doctor Name or Department..."
                          value={anaesthetistSearchTerm}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setAnaesthetistSearchTerm(newValue);
                            setAnaesthetistHighlightIndex(-1);
                            // Clear doctor selection if user edits the search term
                            if (formData.anaesthetistId) {
                              setFormData({ ...formData, anaesthetistId: '' });
                            }
                          }}
                          onKeyDown={(e) => {
                            const filteredDoctors = availableDoctors.filter(doctor => {
                              if (!anaesthetistSearchTerm) return false;
                              const searchLower = anaesthetistSearchTerm.toLowerCase();
                              const doctorName = doctor.name || '';
                              const specialty = doctor.specialty || '';
                              return (
                                doctorName.toLowerCase().includes(searchLower) ||
                                specialty.toLowerCase().includes(searchLower)
                              );
                            });
                            
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setAnaesthetistHighlightIndex(prev => 
                                prev < filteredDoctors.length - 1 ? prev + 1 : prev
                              );
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setAnaesthetistHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                            } else if (e.key === 'Enter' && anaesthetistHighlightIndex >= 0 && filteredDoctors[anaesthetistHighlightIndex]) {
                              e.preventDefault();
                              const doctor = filteredDoctors[anaesthetistHighlightIndex];
                              setFormData({ ...formData, anaesthetistId: doctor.id.toString() });
                              setAnaesthetistSearchTerm(`${doctor.name} - ${doctor.specialty}`);
                              setAnaesthetistHighlightIndex(-1);
                            }
                          }}
                          className="dialog-input-standard pl-10"
                        />
                      </div>
                      {anaesthetistSearchTerm && (() => {
                        const filteredDoctors = availableDoctors.filter(doctor => {
                          if (!anaesthetistSearchTerm) return false;
                          const searchLower = anaesthetistSearchTerm.toLowerCase();
                          const doctorName = doctor.name || '';
                          const specialty = doctor.specialty || '';
                          return (
                            doctorName.toLowerCase().includes(searchLower) ||
                            specialty.toLowerCase().includes(searchLower)
                          );
                        });
                        
                        return filteredDoctors.length > 0 ? (
                          <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto mt-1" style={{ zIndex: 1000 }}>
                            <table className="w-full">
                              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Department</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredDoctors.map((doctor, index) => {
                                  const isSelected = formData.anaesthetistId === doctor.id.toString();
                                  const isHighlighted = anaesthetistHighlightIndex === index;
                                  return (
                                    <tr
                                      key={doctor.id}
                                      onClick={() => {
                                        setFormData({ ...formData, anaesthetistId: doctor.id.toString() });
                                        setAnaesthetistSearchTerm(`${doctor.name} - ${doctor.specialty}`);
                                        setAnaesthetistHighlightIndex(-1);
                                      }}
                                      onMouseDown={(e) => {
                                        // Prevent input from losing focus when clicking on dropdown
                                        e.preventDefault();
                                      }}
                                      className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                    >
                                      <td className="py-2 px-3 text-sm text-gray-900">{doctor.name}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{doctor.specialty}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div className="dialog-field-single-column">
                      <Label htmlFor="add-nurseId" className="dialog-label-standard">Nurse</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          id="add-nurseId"
                          autoComplete="off"
                          placeholder="Search by Nurse Name..."
                          value={nurseSearchTerm}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setNurseSearchTerm(newValue);
                            setNurseHighlightIndex(-1);
                            // Clear nurse selection if user edits the search term
                            if (formData.nurseId) {
                              setFormData({ ...formData, nurseId: '' });
                            }
                          }}
                          onKeyDown={(e) => {
                            const filteredNurses = availableNurses.filter(nurse => {
                              if (!nurseSearchTerm) return false;
                              const searchLower = nurseSearchTerm.toLowerCase();
                              const nurseName = nurse.name || '';
                              return nurseName.toLowerCase().includes(searchLower);
                            });
                            
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setNurseHighlightIndex(prev => 
                                prev < filteredNurses.length - 1 ? prev + 1 : prev
                              );
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setNurseHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                            } else if (e.key === 'Enter' && nurseHighlightIndex >= 0 && filteredNurses[nurseHighlightIndex]) {
                              e.preventDefault();
                              const nurse = filteredNurses[nurseHighlightIndex];
                              setFormData({ ...formData, nurseId: nurse.id.toString() });
                              setNurseSearchTerm(nurse.name);
                              setNurseHighlightIndex(-1);
                            }
                          }}
                          className="dialog-input-standard pl-10"
                        />
                      </div>
                      {nurseSearchTerm && !formData.nurseId && (() => {
                        const filteredNurses = availableNurses.filter(nurse => {
                          if (!nurseSearchTerm) return false;
                          const searchLower = nurseSearchTerm.toLowerCase();
                          const nurseName = nurse.name || '';
                          return nurseName.toLowerCase().includes(searchLower);
                        });
                        
                        return filteredNurses.length > 0 ? (
                          <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto mt-1" style={{ zIndex: 1000 }}>
                            <table className="w-full">
                              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredNurses.map((nurse, index) => {
                                  const isSelected = formData.nurseId === nurse.id.toString();
                                  const isHighlighted = nurseHighlightIndex === index;
                                  return (
                                    <tr
                                      key={nurse.id}
                                      onClick={() => {
                                        setFormData({ ...formData, nurseId: nurse.id.toString() });
                                        setNurseSearchTerm(nurse.name);
                                        setNurseHighlightIndex(-1);
                                      }}
                                      onMouseDown={(e) => {
                                        // Prevent input from losing focus when clicking on dropdown
                                        e.preventDefault();
                                      }}
                                      className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                    >
                                      <td className="py-2 px-3 text-sm text-gray-900">{nurse.name}</td>
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

                  <div className="dialog-form-field">
                    <Label htmlFor="add-duration" className="dialog-label-standard">Duration (in minutes)</Label>
                    <Input
                      id="add-duration"
                      type="number"
                      placeholder="e.g., 120"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="dialog-input-standard"
                    />
                  </div>

                  <div className="dialog-form-field-grid">
                    <div className="dialog-field-single-column">
                      <Label htmlFor="add-otActualStartTime" className="dialog-label-standard">OT Actual Start Time</Label>
                      <Input
                        id="add-otActualStartTime"
                        type="time"
                        value={formData.otActualStartTime}
                        onChange={(e) => setFormData({ ...formData, otActualStartTime: e.target.value })}
                        className="dialog-input-standard"
                      />
                    </div>
                    <div className="dialog-field-single-column">
                      <Label htmlFor="add-otActualEndTime" className="dialog-label-standard">OT Actual End Time</Label>
                      <Input
                        id="add-otActualEndTime"
                        type="time"
                        value={formData.otActualEndTime}
                        onChange={(e) => setFormData({ ...formData, otActualEndTime: e.target.value })}
                        className="dialog-input-standard"
                      />
                    </div>
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="add-operationDescription" className="dialog-label-standard">Operation Description</Label>
                    <Textarea
                      id="add-operationDescription"
                      placeholder="Enter operation description..."
                      value={formData.operationDescription}
                      onChange={(e) => setFormData({ ...formData, operationDescription: e.target.value })}
                      rows={3}
                      className="dialog-textarea-standard"
                    />
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="add-operationStatus" className="dialog-label-standard">Operation Status</Label>
                    <select
                      id="add-operationStatus"
                      className="dialog-select-standard"
                      value={formData.operationStatus}
                      onChange={(e) => setFormData({ ...formData, operationStatus: e.target.value as PatientOTAllocation['operationStatus'] })}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="InProgress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Postponed">Postponed</option>
                    </select>
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="add-preOperationNotes" className="dialog-label-standard">Pre Operation Notes</Label>
                    <Textarea
                      id="add-preOperationNotes"
                      placeholder="e.g., ICU bed reserved post-surgery"
                      value={formData.preOperationNotes}
                      onChange={(e) => setFormData({ ...formData, preOperationNotes: e.target.value })}
                      rows={2}
                      className="dialog-textarea-standard"
                    />
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="add-postOperationNotes" className="dialog-label-standard">Post Operation Notes</Label>
                    <Textarea
                      id="add-postOperationNotes"
                      placeholder="Enter post operation notes..."
                      value={formData.postOperationNotes}
                      onChange={(e) => setFormData({ ...formData, postOperationNotes: e.target.value })}
                      rows={2}
                      className="dialog-textarea-standard"
                    />
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="add-otDocuments" className="dialog-label-standard">OT Documents</Label>
                    <Input
                      id="add-otDocuments"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setSelectedFiles(prev => [...prev, ...files]);
                      }}
                      className="dialog-input-standard"
                    />
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <span>{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Files will be uploaded when you click "Add OT Allocation"</p>
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="add-billId" className="dialog-label-standard">Bill ID</Label>
                    <Input
                      id="add-billId"
                      type="number"
                      placeholder="Enter Bill ID"
                      value={formData.billId}
                      onChange={(e) => setFormData({ ...formData, billId: e.target.value })}
                      className="dialog-input-standard"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 px-6">
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setLeadSurgeonSearchTerm('');
                  setLeadSurgeonHighlightIndex(-1);
                  setAssistantDoctorSearchTerm('');
                  setAssistantDoctorHighlightIndex(-1);
                  setAnaesthetistSearchTerm('');
                  setAnaesthetistHighlightIndex(-1);
                  setNurseSearchTerm('');
                  setNurseHighlightIndex(-1);
                  setSelectedFiles([]);
                  setUploadedDocumentUrls([]);
                }} className="dialog-footer-button">Cancel</Button>
                <Button onClick={handleAddOTAllocation} className="dialog-footer-button">Add OT Allocation</Button>
              </div>
            </div>
        </CustomResizableDialog>
    </div>
  );
}

function AllocationList({ allocations, otRooms, otSlotsByRoom, onRefresh, availableDoctors, patients, availableNurses, availablePatientAppointments, availableRoomAdmissions, availableEmergencyBedSlots }: { allocations: PatientOTAllocation[]; otRooms: OTRoom[]; otSlotsByRoom: Map<number, OTSlot[]>; onRefresh?: () => void; availableDoctors?: Doctor[]; patients?: Patient[]; availableNurses?: Array<{ id: number; name: string; department?: string }>; availablePatientAppointments?: PatientAppointment[]; availableRoomAdmissions?: Admission[]; availableEmergencyBedSlots?: any[] }) {
  const [fetchedPatients, setFetchedPatients] = useState<Map<string, Patient>>(new Map());
  const fetchingRef = useRef<Set<string>>(new Set());
  const [fetchedDoctors, setFetchedDoctors] = useState<Map<number, Doctor>>(new Map());
  const fetchingDoctorsRef = useRef<Set<number>>(new Set());
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<PatientOTAllocation | null>(null);
  const [editFormData, setEditFormData] = useState({
    patientId: '',
    roomAdmissionId: '',
    patientAppointmentId: '',
    emergencyBedSlotId: '',
    otId: '',
    otSlotIds: [] as number[],
    surgeryId: '',
    leadSurgeonId: '',
    assistantDoctorId: '',
    anaesthetistId: '',
    nurseId: '',
    otAllocationDate: '',
    duration: '',
    otActualStartTime: '',
    otActualEndTime: '',
    operationDescription: '',
    operationStatus: 'Scheduled' as PatientOTAllocation['operationStatus'],
    preOperationNotes: '',
    postOperationNotes: '',
    otDocuments: '',
    billId: '',
    status: 'Active' as PatientOTAllocation['status'],
  });
  const [editSelectedFiles, setEditSelectedFiles] = useState<File[]>([]);
  const [editUploadedDocumentUrls, setEditUploadedDocumentUrls] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isStartSurgeryDialogOpen, setIsStartSurgeryDialogOpen] = useState(false);
  const [isCompleteSurgeryDialogOpen, setIsCompleteSurgeryDialogOpen] = useState(false);
  const [startSurgeryTime, setStartSurgeryTime] = useState('');
  const [completeSurgeryTime, setCompleteSurgeryTime] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editLeadSurgeonSearchTerm, setEditLeadSurgeonSearchTerm] = useState('');
  const [editLeadSurgeonHighlightIndex, setEditLeadSurgeonHighlightIndex] = useState(-1);
  const [editAssistantDoctorSearchTerm, setEditAssistantDoctorSearchTerm] = useState('');
  const [editAssistantDoctorHighlightIndex, setEditAssistantDoctorHighlightIndex] = useState(-1);
  const [editAnaesthetistSearchTerm, setEditAnaesthetistSearchTerm] = useState('');
  const [editAnaesthetistHighlightIndex, setEditAnaesthetistHighlightIndex] = useState(-1);
  const [editNurseSearchTerm, setEditNurseSearchTerm] = useState('');
  const [editNurseHighlightIndex, setEditNurseHighlightIndex] = useState(-1);
  const [editRoomAdmissionSearchTerm, setEditRoomAdmissionSearchTerm] = useState('');
  const [editRoomAdmissionHighlightIndex, setEditRoomAdmissionHighlightIndex] = useState(-1);
  const [editPatientAppointmentSearchTerm, setEditPatientAppointmentSearchTerm] = useState('');
  const [editPatientAppointmentHighlightIndex, setEditPatientAppointmentHighlightIndex] = useState(-1);
  const [editEmergencyBedSlotSearchTerm, setEditEmergencyBedSlotSearchTerm] = useState('');
  const [editEmergencyBedSlotHighlightIndex, setEditEmergencyBedSlotHighlightIndex] = useState(-1);
  const [editPatientSourceType, setEditPatientSourceType] = useState<'IPD' | 'OPD' | 'EmergencyBed' | ''>('');
  // Store selected IDs for each source type to persist when switching
  const [editSavedPatientSourceIds, setEditSavedPatientSourceIds] = useState<{
    IPD?: string;
    OPD?: string;
    EmergencyBed?: string;
  }>({});
  const [editOtAllocationDate, setEditOtAllocationDate] = useState<Date | null>(null);
  const [editOtSlots, setEditOtSlots] = useState<OTSlot[]>([]);
  const [editSelectedOTId, setEditSelectedOTId] = useState<string>('');
  const [fetchedAppointment, setFetchedAppointment] = useState<PatientAppointment | null>(null);
  const [fetchedAllocation, setFetchedAllocation] = useState<PatientOTAllocation | null>(null);

  // Handler to start surgery
  const handleStartSurgery = async () => {
    if (!selectedAllocation || !startSurgeryTime) {
      alert('Please enter the actual start time.');
      return;
    }

    setIsUpdating(true);
    try {
      await patientOTAllocationsApi.update({
        id: selectedAllocation.id,
        otActualStartTime: startSurgeryTime,
        operationStatus: 'InProgress',
      });
      
      alert('Surgery started successfully!');
      setIsStartSurgeryDialogOpen(false);
      setStartSurgeryTime('');
      setSelectedAllocation(null);
      
      // Refresh allocations
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to start surgery:', err);
      alert(`Failed to start surgery: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper function to format date as dd_mm_yyyy for file suffix
  const formatDateForFileSuffix = (): string => {
    const now = new Date();
    const istDate = convertToIST(now);
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const year = istDate.getUTCFullYear();
    return `${day}_${month}_${year}`;
  };

  // Helper function to add date suffix to filename
  const addDateSuffixToFileName = (fileName: string): string => {
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

  // Function to upload files (for AllocationList component)
  const uploadFiles = async (files: File[], patientId: string): Promise<string[]> => {
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
        formData.append('folder', 'ot-documents');
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
        uploadUrlObj.searchParams.append('folder', 'ot-documents');
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

  // Function to delete a file manually (optional - backend handles automatic deletion on update)
  const deleteFile = async (fileUrl: string): Promise<void> => {
    try {
      // Extract folder, patientIdentifier (could be patientNo or PatientId), and filename from URL
      // Example formats:
      // - http://localhost:4000/uploads/ot-documents/P2025_12_0001/document_1234567890_987654321.pdf (patientNo format)
      // - http://localhost:4000/uploads/ot-documents/PAT-2025-0018/document_1234567890_987654321.pdf (PatientId format)
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/').filter(p => p);
      // pathParts: ['uploads', 'ot-documents', 'PAT-2025-0018' or 'P2025_12_0001', 'document_1234567890_987654321.pdf']
      
      console.log('Deleting file, URL:', fileUrl);
      console.log('Path parts:', pathParts);
      
      if (pathParts.length < 4 || pathParts[0] !== 'uploads') {
        throw new Error('Invalid file URL format');
      }
      
      const folder = pathParts[1]; // 'ot-docs' or 'ot-documents'
      const patientIdentifier = pathParts[2]; // Could be 'P2025_12_0001' (patientNo) or 'PAT-2025-0018' (PatientId)
      const filename = pathParts.slice(3).join('/'); // 'document_1234567890_987654321.pdf'
      
      console.log('Extracted from URL - folder:', folder, 'patientIdentifier:', patientIdentifier, 'filename:', filename);
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
      const response = await fetch(`${API_BASE_URL}/upload/${folder}/${patientIdentifier}/${filename}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };

  // Fetch slots when OT is selected in edit dialog
  useEffect(() => {
    const fetchEditSlots = async () => {
      if (!editSelectedOTId || !editFormData.otAllocationDate) {
        setEditOtSlots([]);
        return;
      }
      
      try {
        const numericOtId = parseInt(editSelectedOTId.replace('OT-', ''), 10);
        if (isNaN(numericOtId)) {
          setEditOtSlots([]);
          return;
        }
        
        const slots = await otSlotsApi.getAll(undefined, numericOtId, editFormData.otAllocationDate);
        setEditOtSlots(slots);
      } catch (err) {
        console.error('Failed to fetch slots for edit:', err);
        setEditOtSlots([]);
      }
    };
    
    fetchEditSlots();
  }, [editSelectedOTId, editFormData.otAllocationDate]);

  // Fetch full allocation record from database when manage dialog opens
  useEffect(() => {
    const fetchAllocationFromDB = async () => {
      if (!isManageDialogOpen || !selectedAllocation?.id) {
        setFetchedAllocation(null);
        return;
      }
      
      try {
        console.log('=== Fetching Allocation from Database ===');
        console.log('Allocation ID:', selectedAllocation.id);
        const allocation = await patientOTAllocationsApi.getById(selectedAllocation.id);
        setFetchedAllocation(allocation);
        console.log('Fetched Allocation Record:', JSON.stringify(allocation, null, 2));
        console.log('Allocation patientAppointmentId:', allocation.patientAppointmentId);
        console.log('Allocation patientId:', allocation.patientId);
        console.log('Allocation roomAdmissionId:', allocation.roomAdmissionId);
        console.log('Allocation emergencyBedSlotId:', allocation.emergencyBedSlotId);
        
        // Update form data with fetched allocation (this ensures we have the latest data)
        // Convert patientAppointmentId to string since form fields use strings
        setEditFormData(prev => ({
          ...prev,
          patientAppointmentId: allocation.patientAppointmentId?.toString() || prev.patientAppointmentId,
          roomAdmissionId: allocation.roomAdmissionId?.toString() || prev.roomAdmissionId,
          emergencyBedSlotId: allocation.emergencyBedSlotId?.toString() || prev.emergencyBedSlotId,
        }));
        
        // Set patient source type based on fetched allocation
        if (allocation.roomAdmissionId) {
          setEditPatientSourceType('IPD');
        } else if (allocation.patientAppointmentId) {
          setEditPatientSourceType('OPD');
        } else if (allocation.emergencyBedSlotId) {
          setEditPatientSourceType('EmergencyBed');
        }
      } catch (err) {
        console.error('Failed to fetch allocation from database:', err);
        setFetchedAllocation(null);
      }
    };
    
    fetchAllocationFromDB();
  }, [isManageDialogOpen, selectedAllocation?.id]);

  // Update documents when fetchedAllocation is updated (after save, fresh data from DB)
  useEffect(() => {
    if (fetchedAllocation && isManageDialogOpen) {
      // Parse existing documents from otDocuments field
      let existingDocUrls: string[] = [];
      if (fetchedAllocation.otDocuments) {
        try {
          // Try parsing as JSON array first
          const parsed = JSON.parse(fetchedAllocation.otDocuments);
          if (Array.isArray(parsed)) {
            existingDocUrls = parsed;
          } else if (typeof parsed === 'string') {
            existingDocUrls = [parsed];
          }
        } catch {
          // If not JSON, treat as comma-separated string or single URL
          if (fetchedAllocation.otDocuments.includes(',')) {
            existingDocUrls = fetchedAllocation.otDocuments.split(',').map(url => url.trim()).filter(url => url);
          } else {
            existingDocUrls = [fetchedAllocation.otDocuments];
          }
        }
      }
      setEditUploadedDocumentUrls(existingDocUrls);
    }
  }, [fetchedAllocation, isManageDialogOpen]);

  // Fetch appointment details when manage dialog opens with OPD patient source
  useEffect(() => {
    const fetchAppointmentAndPatient = async () => {
      if (!isManageDialogOpen) {
        setFetchedAppointment(null);
        return;
      }
      
      // If user has explicitly cleared the patientAppointmentId (empty string), don't repopulate from fetchedAllocation
      // Only use fetchedAllocation if editFormData.patientAppointmentId is not explicitly set to empty string
      const appointmentIdToFetch = editFormData.patientAppointmentId || (editFormData.patientAppointmentId !== '' ? fetchedAllocation?.patientAppointmentId : null);
      
      // Check if this is an OPD source (either from editPatientSourceType or from fetchedAllocation)
      const isOPDSource = editPatientSourceType === 'OPD' || (fetchedAllocation?.patientAppointmentId && !fetchedAllocation?.roomAdmissionId && !fetchedAllocation?.emergencyBedSlotId);
      
      if (!appointmentIdToFetch || !isOPDSource) {
        setFetchedAppointment(null);
        // If user cleared the field, also clear the search term
        if (editFormData.patientAppointmentId === '' && editPatientAppointmentSearchTerm) {
          setEditPatientAppointmentSearchTerm('');
        }
        return;
      }
      
      // Check if appointment is already in available list
      const existingAppointment = availablePatientAppointments?.find(a => a.id.toString() === appointmentIdToFetch);
      if (existingAppointment) {
        console.log('=== Appointment Found in Available List ===');
        console.log('Appointment ID:', existingAppointment.id);
        console.log('Appointment TokenNo (OPD Number):', existingAppointment.tokenNo);
        console.log('Appointment Record:', JSON.stringify(existingAppointment, null, 2));
        setFetchedAppointment(existingAppointment);
        // Fetch patient if not already in fetchedPatients
        const patientId = existingAppointment.patientId;
        if (patientId && !fetchedPatients.has(patientId) && !fetchingRef.current.has(patientId)) {
          fetchingRef.current.add(patientId);
          try {
            console.log('=== Fetching Patient from Database (from available appointment) ===');
            console.log('Patient ID:', patientId);
            const patient = await patientsApi.getById(patientId);
            setFetchedPatients(prev => {
              const newMap = new Map(prev);
              newMap.set(patientId, patient);
              return newMap;
            });
            console.log('Fetched Patient Record:', JSON.stringify(patient, null, 2));
            console.log('Patient Name:', (patient as any).PatientName || (patient as any).patientName);
            console.log('Patient No:', (patient as any).PatientNo || (patient as any).patientNo);
            // Update search term with patient name only if patientAppointmentId is set (not cleared by user)
            if (editFormData.patientAppointmentId) {
              const patientName = `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() || patientId;
              if (!editPatientAppointmentSearchTerm) {
                setEditPatientAppointmentSearchTerm(`${existingAppointment.tokenNo} - ${patientName}`);
              }
            }
          } catch (err) {
            console.error(`Error fetching patient ${patientId}:`, err);
          } finally {
            fetchingRef.current.delete(patientId);
          }
        } else if (patientId && fetchedPatients.has(patientId)) {
          // Patient already fetched, update search term if needed
          const patient = fetchedPatients.get(patientId);
          console.log('=== Patient Already Fetched (from cache, available appointment) ===');
          console.log('Using patientId:', patientId, '(from allocation:', fetchedAllocation?.patientId, ', from appointment:', existingAppointment.patientId, ')');
          console.log('Patient Record:', JSON.stringify(patient, null, 2));
          console.log('=== Summary of All Fetched Records ===');
          console.log('1. Allocation:', {
            id: fetchedAllocation?.id,
            patientAppointmentId: fetchedAllocation?.patientAppointmentId,
            patientId: fetchedAllocation?.patientId,
          });
          console.log('2. Appointment (from available list):', {
            id: existingAppointment.id,
            tokenNo: existingAppointment.tokenNo,
            patientId: existingAppointment.patientId,
          });
          console.log('3. Patient (from cache):', {
            patientId: patient?.patientId || (patient as any)?.PatientId,
            patientNo: (patient as any)?.PatientNo || (patient as any)?.patientNo,
            patientName: (patient as any)?.PatientName || (patient as any)?.patientName,
          });
          console.log('=== OPD Number (TokenNo) from Available List ===', existingAppointment.tokenNo);
          // Only update search term if patientAppointmentId is set (not cleared by user)
          if (patient && editFormData.patientAppointmentId && !editPatientAppointmentSearchTerm) {
            const patientName = `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() || patientId;
            setEditPatientAppointmentSearchTerm(`${existingAppointment.tokenNo} - ${patientName}`);
          }
        }
        return;
      }
      
      // Fetch from database if not in available list
      try {
        const appointmentId = parseInt(appointmentIdToFetch, 10);
        if (!isNaN(appointmentId)) {
          console.log('=== Fetching Appointment from Database ===');
          console.log('Appointment ID:', appointmentId);
          const appointment = await patientAppointmentsApi.getById(appointmentId);
          setFetchedAppointment(appointment);
          console.log('Fetched Appointment Record:', JSON.stringify(appointment, null, 2));
          console.log('Appointment TokenNo (OPD Number):', appointment.tokenNo);
          console.log('Appointment patientId:', appointment.patientId);
          
          // Fetch patient - prioritize allocation's patientId over appointment's patientId
          const patientId = fetchedAllocation?.patientId || appointment.patientId;
          console.log('Using patientId for fetch:', patientId, '(from allocation:', fetchedAllocation?.patientId, ', from appointment:', appointment.patientId, ')');
          if (patientId) {
            // Check if patient is already fetched
            if (!fetchedPatients.has(patientId) && !fetchingRef.current.has(patientId)) {
              fetchingRef.current.add(patientId);
              try {
                console.log('=== Fetching Patient from Database ===');
                console.log('Patient ID:', patientId);
                const patient = await patientsApi.getById(patientId);
                setFetchedPatients(prev => {
                  const newMap = new Map(prev);
                  newMap.set(patientId, patient);
                  return newMap;
                });
                console.log('Fetched Patient Record:', JSON.stringify(patient, null, 2));
                console.log('Patient Name:', (patient as any).PatientName || (patient as any).patientName);
                console.log('Patient No:', (patient as any).PatientNo || (patient as any).patientNo);
                console.log('=== Summary of All Fetched Records ===');
                console.log('1. Allocation:', {
                  id: allocation.id,
                  patientAppointmentId: allocation.patientAppointmentId,
                  patientId: allocation.patientId,
                });
                console.log('2. Appointment:', {
                  id: appointment.id,
                  tokenNo: appointment.tokenNo,
                  patientId: appointment.patientId,
                });
                console.log('3. Patient:', {
                  patientId: patient.patientId || (patient as any).PatientId,
                  patientNo: (patient as any).PatientNo || (patient as any).patientNo,
                  patientName: (patient as any).PatientName || (patient as any).patientName,
                });
                console.log('=== OPD Number (TokenNo) from Database ===', appointment.tokenNo);
                // Update search term with fetched patient details only if patientAppointmentId is set (not cleared by user)
                if (appointment.tokenNo && editFormData.patientAppointmentId && !editPatientAppointmentSearchTerm) {
                  const patientName = `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() || patientId;
                  setEditPatientAppointmentSearchTerm(`${appointment.tokenNo} - ${patientName}`);
                }
              } catch (err) {
                console.error(`Error fetching patient ${patientId}:`, err);
                // Fallback: use patientId if patient fetch fails, only if patientAppointmentId is set (not cleared by user)
                if (appointment.tokenNo && editFormData.patientAppointmentId && !editPatientAppointmentSearchTerm) {
                  setEditPatientAppointmentSearchTerm(`${appointment.tokenNo} - ${patientId}`);
                }
              } finally {
                fetchingRef.current.delete(patientId);
              }
            } else if (fetchedPatients.has(patientId)) {
              // Patient already fetched, update search term if needed
              const patient = fetchedPatients.get(patientId);
              console.log('=== Patient Already Fetched (from cache) ===');
              console.log('Using patientId:', patientId, '(from allocation:', fetchedAllocation?.patientId, ', from appointment:', appointment.patientId, ')');
              console.log('Patient Record:', JSON.stringify(patient, null, 2));
              console.log('=== Summary of All Fetched Records ===');
              console.log('1. Allocation:', {
                id: fetchedAllocation?.id,
                patientAppointmentId: fetchedAllocation?.patientAppointmentId,
                patientId: fetchedAllocation?.patientId,
              });
              console.log('2. Appointment:', {
                id: appointment.id,
                tokenNo: appointment.tokenNo,
                patientId: appointment.patientId,
              });
              console.log('3. Patient (from cache):', {
                patientId: patient?.patientId || (patient as any)?.PatientId,
                patientNo: (patient as any)?.PatientNo || (patient as any)?.patientNo,
                patientName: (patient as any)?.PatientName || (patient as any)?.patientName,
              });
              console.log('=== OPD Number (TokenNo) from Database ===', appointment.tokenNo);
              // Only update search term if patientAppointmentId is set (not cleared by user)
              if (patient && appointment.tokenNo && editFormData.patientAppointmentId && !editPatientAppointmentSearchTerm) {
                const patientName = `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() || patientId;
                setEditPatientAppointmentSearchTerm(`${appointment.tokenNo} - ${patientName}`);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch appointment:', err);
        setFetchedAppointment(null);
      }
    };
    
    fetchAppointmentAndPatient();
  }, [isManageDialogOpen, editFormData.patientAppointmentId, editPatientSourceType, availablePatientAppointments, fetchedAllocation]);

  // Handler to save edited allocation
  const handleSaveAllocation = async () => {
    if (!selectedAllocation) return;

    if (!editFormData.otId || !editFormData.leadSurgeonId || !editFormData.otAllocationDate) {
      alert('Please fill in all required fields (OT, Lead Surgeon, Date).');
      return;
    }

    // Patient source is required - must come from one of the sources
    if (!editPatientSourceType) {
      alert('Please select a Patient Source.');
      return;
    }
    if (!editFormData.roomAdmissionId && !editFormData.patientAppointmentId && !editFormData.emergencyBedSlotId) {
      alert(`Please select a ${editPatientSourceType === 'IPD' ? 'Room Admission' : editPatientSourceType === 'OPD' ? 'Patient Appointment' : 'Emergency Bed Slot'}.`);
      return;
    }

    setIsSaving(true);
    try {
      // Extract patientId from the selected patient source
      let patientId: string | undefined = undefined;

      if (editFormData.roomAdmissionId) {
        const admission = availableRoomAdmissions?.find(a =>
          (a.roomAdmissionId?.toString() || a.id?.toString()) === editFormData.roomAdmissionId
        );
        patientId = admission?.patientId;
      } else if (editFormData.patientAppointmentId) {
        const appointment = availablePatientAppointments?.find(a =>
          a.id.toString() === editFormData.patientAppointmentId
        );
        patientId = appointment?.patientId;
      } else if (editFormData.emergencyBedSlotId) {
        const emergencyAdmission = availableEmergencyBedSlots?.find(s => {
          const admissionId = s.EmergencyAdmissionId?.toString() || s.emergencyAdmissionId?.toString() || s.id?.toString() || '';
          const bedSlotId = s.EmergencyBedSlotId?.toString() || s.emergencyBedSlotId?.toString() || '';
          return admissionId === editFormData.emergencyBedSlotId || bedSlotId === editFormData.emergencyBedSlotId;
        });
        patientId = emergencyAdmission?.PatientId ||
                    emergencyAdmission?.patientId ||
                    (emergencyAdmission as any)?.PatientId ||
                    (emergencyAdmission as any)?.patientId;
      } else if (editFormData.patientId) {
        patientId = editFormData.patientId;
      }

      if (!patientId) {
        alert('Unable to determine patient ID from selected source. Please select a patient source.');
        setIsSaving(false);
        return;
      }

      const updateData: any = {
        id: selectedAllocation.id,
        patientId: patientId,
        otId: parseInt(editFormData.otId),
        leadSurgeonId: parseInt(editFormData.leadSurgeonId),
        otAllocationDate: editFormData.otAllocationDate,
      };

      if (editFormData.roomAdmissionId) {
        updateData.roomAdmissionId = parseInt(editFormData.roomAdmissionId);
      }
      if (editFormData.patientAppointmentId) {
        // Convert to integer since PatientAppointmentId is an integer in the database
        updateData.patientAppointmentId = parseInt(editFormData.patientAppointmentId, 10);
      }
      if (editFormData.emergencyBedSlotId) {
        updateData.emergencyBedSlotId = parseInt(editFormData.emergencyBedSlotId);
      }
      if (editFormData.otSlotIds && editFormData.otSlotIds.length > 0) {
        updateData.otSlotIds = editFormData.otSlotIds;
      }
      if (editFormData.surgeryId) {
        updateData.surgeryId = parseInt(editFormData.surgeryId);
      }
      if (editFormData.assistantDoctorId) {
        updateData.assistantDoctorId = parseInt(editFormData.assistantDoctorId);
      }
      if (editFormData.anaesthetistId) {
        updateData.anaesthetistId = parseInt(editFormData.anaesthetistId);
      }
      if (editFormData.nurseId) {
        updateData.nurseId = parseInt(editFormData.nurseId);
      }
      if (editFormData.duration) {
        updateData.duration = editFormData.duration;
      }
      if (editFormData.otActualStartTime) {
        updateData.otActualStartTime = editFormData.otActualStartTime;
      }
      if (editFormData.otActualEndTime) {
        updateData.otActualEndTime = editFormData.otActualEndTime;
      }
      if (editFormData.operationDescription) {
        updateData.operationDescription = editFormData.operationDescription;
      }
      if (editFormData.operationStatus) {
        updateData.operationStatus = editFormData.operationStatus;
        
        // Release slots when status is Cancelled or Postponed
        if (editFormData.operationStatus === 'Cancelled' || editFormData.operationStatus === 'Postponed') {
          updateData.otSlotIds = [];
          console.log('Releasing OT slots for cancelled/postponed allocation:', selectedAllocation.id);
        }
      }
      if (editFormData.preOperationNotes) {
        updateData.preOperationNotes = editFormData.preOperationNotes;
      }
      if (editFormData.postOperationNotes) {
        updateData.postOperationNotes = editFormData.postOperationNotes;
      }
      // Step 1: Upload new files if any are selected
      const uploadedUrls: string[] = [];
      if (editSelectedFiles.length > 0) {
        try {
          const newUrls = await uploadFiles(editSelectedFiles, patientId);
          uploadedUrls.push(...newUrls);
        } catch (error) {
          alert(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsSaving(false);
          return;
        }
      }

      // Step 2: Get existing OTDocuments from the allocation (following the example pattern)
      let existingDocs: string[] = [];
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
        const allocationResponse = await fetch(`${API_BASE_URL}/patient-ot-allocations/${selectedAllocation.id}`);
        const allocationResult = await allocationResponse.json();
        
        if (allocationResult.success && allocationResult.data && allocationResult.data.OTDocuments) {
          try {
            // Try parsing as JSON array
            existingDocs = JSON.parse(allocationResult.data.OTDocuments);
          } catch (e) {
            // Handle comma-separated format
            existingDocs = allocationResult.data.OTDocuments.split(',').map((url: string) => url.trim()).filter((url: string) => url);
          }
        }
      } catch (error) {
        console.error('Error fetching existing allocation:', error);
        // Fallback to using editUploadedDocumentUrls if fetch fails
        existingDocs = [...editUploadedDocumentUrls];
      }

      // Step 3: Merge existing documents with newly uploaded URLs
      // editUploadedDocumentUrls contains the documents the user wants to keep (after removing some)
      // So we use that instead of existingDocs to respect user's removals
      const allUrls = [...editUploadedDocumentUrls, ...uploadedUrls];
      
      // Step 4: Update with merged URLs (backend will auto-delete removed files)
      if (allUrls.length > 0) {
        updateData.otDocuments = JSON.stringify(allUrls);
      } else {
        updateData.otDocuments = undefined;
      }
      if (editFormData.billId) {
        updateData.billId = parseInt(editFormData.billId);
      }

      await patientOTAllocationsApi.update(updateData);
      
      alert('OT Allocation updated successfully!');
      setIsManageDialogOpen(false);
      setEditFormData({
        patientId: '',
        roomAdmissionId: '',
        patientAppointmentId: '',
        emergencyBedSlotId: '',
        otId: '',
        otSlotIds: [],
        surgeryId: '',
        leadSurgeonId: '',
        assistantDoctorId: '',
        anaesthetistId: '',
        nurseId: '',
        otAllocationDate: '',
        duration: '',
        otActualStartTime: '',
        otActualEndTime: '',
        operationDescription: '',
        operationStatus: 'Scheduled',
        preOperationNotes: '',
        postOperationNotes: '',
        otDocuments: '',
        billId: '',
        status: 'Active',
      });
      setEditSelectedFiles([]);
      setEditUploadedDocumentUrls([]);
      setEditLeadSurgeonSearchTerm('');
      setEditLeadSurgeonHighlightIndex(-1);
      setEditAssistantDoctorSearchTerm('');
      setEditAssistantDoctorHighlightIndex(-1);
      setEditAnaesthetistSearchTerm('');
      setEditAnaesthetistHighlightIndex(-1);
      setEditNurseSearchTerm('');
      setEditNurseHighlightIndex(-1);
      setEditRoomAdmissionSearchTerm('');
      setEditRoomAdmissionHighlightIndex(-1);
      setEditPatientAppointmentSearchTerm('');
      setEditPatientAppointmentHighlightIndex(-1);
      setEditEmergencyBedSlotSearchTerm('');
      setEditEmergencyBedSlotHighlightIndex(-1);
      setEditOtAllocationDate(null);
      setEditOtSlots([]);
      setEditSelectedOTId('');
      setEditSelectedFiles([]);
      setEditUploadedDocumentUrls([]);
      setSelectedAllocation(null);
      
      // Refresh allocations
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to update allocation:', err);
      alert(`Failed to update allocation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler to complete surgery
  const handleCompleteSurgery = async () => {
    if (!selectedAllocation || !completeSurgeryTime) {
      alert('Please enter the actual end time.');
      return;
    }

    setIsUpdating(true);
    try {
      await patientOTAllocationsApi.update({
        id: selectedAllocation.id,
        otActualEndTime: completeSurgeryTime,
        operationStatus: 'Completed',
      });
      
      alert('Surgery completed successfully!');
      setIsCompleteSurgeryDialogOpen(false);
      setCompleteSurgeryTime('');
      setSelectedAllocation(null);
      
      // Refresh allocations
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to complete surgery:', err);
      alert(`Failed to complete surgery: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Fetch patients for each unique patientId in allocations
  useEffect(() => {
    if (!allocations || allocations.length === 0) return;

    const uniquePatientIds = new Set<string>();
    allocations.forEach(allocation => {
      if (allocation?.patientId) {
        uniquePatientIds.add(allocation.patientId);
      }
    });

    // Fetch patients that we don't already have
    uniquePatientIds.forEach(patientId => {
      // Check if we already have this patient or are currently fetching it
      setFetchedPatients(prev => {
        if (prev.has(patientId) || fetchingRef.current.has(patientId)) {
          return prev; // Already fetched or fetching
        }
        
        // Mark as fetching
        fetchingRef.current.add(patientId);
        
        // Fetch patient
        patientsApi.getById(patientId)
          .then(patient => {
            setFetchedPatients(prevPatients => {
              const newMap = new Map(prevPatients);
              newMap.set(patientId, patient);
              return newMap;
            });
          })
          .catch(error => {
            console.error(`Error fetching patient ${patientId}:`, error);
          })
          .finally(() => {
            fetchingRef.current.delete(patientId);
          });
        
        return prev;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allocations]);

  // Fetch doctors for each unique leadSurgeonId in allocations
  useEffect(() => {
    if (!allocations || allocations.length === 0) return;

    const uniqueSurgeonIds = new Set<number>();
    allocations.forEach(allocation => {
      if (allocation?.leadSurgeonId && typeof allocation.leadSurgeonId === 'number') {
        uniqueSurgeonIds.add(allocation.leadSurgeonId);
      }
    });

    // Fetch doctors that we don't already have
    uniqueSurgeonIds.forEach(surgeonId => {
      // Check if we already have this doctor or are currently fetching it
      setFetchedDoctors(prev => {
        if (prev.has(surgeonId) || fetchingDoctorsRef.current.has(surgeonId)) {
          return prev; // Already fetched or fetching
        }
        
        // Mark as fetching
        fetchingDoctorsRef.current.add(surgeonId);
        
        // Fetch doctor
        doctorsApi.getById(surgeonId)
          .then(doctor => {
            setFetchedDoctors(prevDoctors => {
              const newMap = new Map(prevDoctors);
              newMap.set(surgeonId, doctor);
              return newMap;
            });
          })
          .catch(error => {
            console.error(`Error fetching doctor ${surgeonId}:`, error);
          })
          .finally(() => {
            fetchingDoctorsRef.current.delete(surgeonId);
          });
        
        return prev;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allocations]);

  const getStatusBadge = (status: PatientOTAllocation['operationStatus']) => {
    const statusMap = {
      'Scheduled': { bg: 'bg-orange-100', text: 'text-orange-700' },
      'InProgress': { bg: 'bg-blue-100', text: 'text-blue-700' },
      'Completed': { bg: 'bg-green-100', text: 'text-green-700' },
      'Cancelled': { bg: 'bg-red-100', text: 'text-red-700' },
      'Postponed': { bg: 'bg-gray-100', text: 'text-gray-700' },
    };
    const statusStyle = statusMap[status] || statusMap['Scheduled'];
    return (
      <span className={`px-3 py-1 rounded-full text-xs ${statusStyle.bg} ${statusStyle.text}`}>
        {status === 'InProgress' ? 'In Progress' : status}
      </span>
    );
  };

  // Helper function to format slot numbers
  const formatSlotNumbers = (allocation: PatientOTAllocation, otId: number): string => {
    try {
      if (!allocation || !allocation.otSlotIds || allocation.otSlotIds.length === 0) {
        return '';
      }

      if (!otSlotsByRoom || !otId) {
        return '';
      }

      const slots = otSlotsByRoom.get(otId) || [];
      if (!slots || slots.length === 0) {
        return '';
      }

      const allocationSlots = slots.filter(slot => slot && allocation.otSlotIds?.includes(slot.id));
      
      if (allocationSlots.length === 0) {
        return '';
      }

      // Sort slots by slot number for consistent display
      const sortedSlots = [...allocationSlots].sort((a, b) => {
        const slotNoA = (a?.otSlotNo || '').toString();
        const slotNoB = (b?.otSlotNo || '').toString();
        return slotNoA.localeCompare(slotNoB);
      });

      // Display slot numbers with "slots:" prefix and no spaces after commas
      const slotNumbers = sortedSlots.map(slot => {
        return slot?.otSlotNo || `Slot ${slot?.id || ''}`;
      }).filter(Boolean).join(',');
      
      return slotNumbers ? `slots: ${slotNumbers}` : '';
    } catch (error) {
      console.error('Error formatting slot numbers:', error);
      return '';
    }
  };

  // Helper function to find longest contiguous time range from slots
  const getLongestContiguousTimeRange = (allocation: PatientOTAllocation, otId: number): string => {
    try {
      if (!allocation || !allocation.otSlotIds || allocation.otSlotIds.length === 0) {
        return '';
      }

      if (!otSlotsByRoom || !otId) {
        return '';
      }

      const slots = otSlotsByRoom.get(otId) || [];
      if (!slots || slots.length === 0) {
        return '';
      }

      const allocationSlots = slots.filter(slot => slot && allocation.otSlotIds?.includes(slot.id));
      
      if (allocationSlots.length === 0) {
        return '';
      }

      // Sort slots by start time
      const sortedSlots = [...allocationSlots].sort((a, b) => {
        const timeA = a?.slotStartTime || '';
        const timeB = b?.slotStartTime || '';
        return timeA.localeCompare(timeB);
      });

      // Find all contiguous ranges
      const contiguousRanges: Array<{ start: string; end: string; length: number }> = [];
      let currentRange: { start: string; end: string; slots: typeof sortedSlots } | null = null;

      for (let i = 0; i < sortedSlots.length; i++) {
        const slot = sortedSlots[i];
        if (!slot?.slotStartTime || !slot?.slotEndTime) continue;

        if (!currentRange) {
          // Start a new range
          currentRange = {
            start: slot.slotStartTime,
            end: slot.slotEndTime,
            slots: [slot]
          };
        } else {
          // Check if this slot is contiguous with the current range
          if (currentRange.end === slot.slotStartTime) {
            // Contiguous - extend the range
            currentRange.end = slot.slotEndTime;
            currentRange.slots.push(slot);
          } else {
            // Not contiguous - save current range and start a new one
            contiguousRanges.push({
              start: currentRange.start,
              end: currentRange.end,
              length: currentRange.slots.length
            });
            currentRange = {
              start: slot.slotStartTime,
              end: slot.slotEndTime,
              slots: [slot]
            };
          }
        }
      }

      // Don't forget to add the last range
      if (currentRange) {
        contiguousRanges.push({
          start: currentRange.start,
          end: currentRange.end,
          length: currentRange.slots.length
        });
      }

      if (contiguousRanges.length === 0) {
        return '';
      }

      // Find the longest contiguous range
      const longestRange = contiguousRanges.reduce((longest, current) => {
        return current.length > longest.length ? current : longest;
      }, contiguousRanges[0]);

      return `${longestRange.start} - ${longestRange.end}`;
    } catch (error) {
      console.error('Error calculating contiguous time range:', error);
      return '';
    }
  };

  // Helper function to calculate duration from time range
  const calculateDurationFromTimeRange = (timeRange: string): string => {
    try {
      if (!timeRange || !timeRange.includes(' - ')) {
        return '';
      }

      const [startTime, endTime] = timeRange.split(' - ');
      if (!startTime || !endTime) {
        return '';
      }

      // Parse time strings (format: HH:MM or HH:MM:SS)
      const parseTime = (timeStr: string): number => {
        const parts = timeStr.trim().split(':');
        if (parts.length < 2) return 0;
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        return hours * 60 + minutes; // Convert to total minutes
      };

      const startMinutes = parseTime(startTime);
      const endMinutes = parseTime(endTime);

      if (startMinutes === 0 && endMinutes === 0) {
        return '';
      }

      // Handle case where end time is next day (e.g., 23:00 - 01:00)
      let durationMinutes = endMinutes - startMinutes;
      if (durationMinutes < 0) {
        // Assume it wraps to next day
        durationMinutes = (24 * 60) + durationMinutes;
      }

      if (durationMinutes === 0) {
        return '';
      }

      // Format duration
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else {
        return `${minutes}m`;
      }
    } catch (error) {
      console.error('Error calculating duration from time range:', error);
      return '';
    }
  };

  if (!allocations || !Array.isArray(allocations)) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            No allocations available
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allocations.map((allocation, index) => {
        if (!allocation) return null;
        
        // Log first allocation ID for debugging
        if (index === 0) {
          console.log('First allocation ID:', allocation.id, 'Full allocation:', allocation);
        }
        
        const otRoom = otRooms?.find(ot => ot && ot.id === allocation.otId);
        // Look up patient by patientId from fetched patients
        const patient = allocation.patientId ? fetchedPatients.get(allocation.patientId) : null;
        const patientName = patient 
          ? `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() 
          : (allocation as any)?.PatientName || '';
        const patientNo = patient 
          ? (patient as any).PatientNo || (patient as any).patientNo || ''
          : (allocation as any)?.PatientNo || '';
        const surgeon = allocation.leadSurgeonId && typeof allocation.leadSurgeonId === 'number' 
          ? fetchedDoctors.get(allocation.leadSurgeonId) 
          : null;
        const surgeonName = surgeon?.name || (allocation as any)?.LeadSurgeonName || '';
        const otNumber = otRoom?.otNo || `OT-${allocation.otId || ''}`;
        const operationDescription = allocation.operationDescription || 'Operation';
        const allocationDate = allocation.otAllocationDate ? formatDateDisplayIST(allocation.otAllocationDate, 'numeric') : '';
        const allocationTime = allocation.otActualStartTime || allocation.otStartTime || '';
        const slotNumbers = formatSlotNumbers(allocation, allocation.otId || 0);
        const contiguousTimeRange = getLongestContiguousTimeRange(allocation, allocation.otId || 0);
        const calculatedDuration = contiguousTimeRange ? calculateDurationFromTimeRange(contiguousTimeRange) : '';
        const duration = calculatedDuration || (allocation.duration ? `${allocation.duration} minutes` : '-');

        return (
          <Card key={allocation.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex flex-col">
                      <Badge className="text-base">{otNumber}</Badge>
                      {slotNumbers && (
                        <p className="text-xs text-gray-500 mt-1">{slotNumbers}</p>
                      )}
                    </div>
                    <h3 className="text-gray-900">{operationDescription}</h3>
                    {getStatusBadge(allocation.operationStatus)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Patient</p>
                      <p className="text-gray-900">
                        {patientName || patientNo || '-'}
                        {patientNo && <span className="text-gray-500"> ({patientNo})</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Lead Surgeon</p>
                      <p className="text-gray-900">{surgeonName || (allocation.leadSurgeonId ? `ID: ${allocation.leadSurgeonId}` : '-')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="text-gray-900">
                        {allocationDate}
                        {allocationTime && ` at ${allocationTime}`}
                      </p>
                      {contiguousTimeRange && (
                        <p className="text-xs text-gray-600 mt-1">{contiguousTimeRange}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="text-gray-900">{duration}</p>
                      {calculatedDuration && (
                        <p className="text-xs text-gray-600 mt-1">(from slots)</p>
                      )}
                    </div>
                  </div>
                  {allocation.preOperationNotes && (
                    <div className="p-3 bg-gray-50 rounded-lg mb-3">
                      <p className="text-sm text-gray-500 mb-1">Pre-Op Notes</p>
                      <p className="text-sm text-gray-900">{allocation.preOperationNotes}</p>
                    </div>
                  )}
                  {allocation.postOperationNotes && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700 mb-1">Post-Op Status</p>
                      <p className="text-sm text-green-900">{allocation.postOperationNotes}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedAllocation(allocation);
                      // Initialize form data with current allocation values
                      // Get current patient info
                      const currentPatient = allocation.patientId ? fetchedPatients.get(allocation.patientId) : null;
                      const currentPatientName = currentPatient 
                        ? `${(currentPatient as any).PatientName || (currentPatient as any).patientName || ''} ${(currentPatient as any).LastName || (currentPatient as any).lastName || ''}`.trim() 
                        : (allocation as any)?.PatientName || '';
                      const currentPatientNo = currentPatient 
                        ? (currentPatient as any).PatientNo || (currentPatient as any).patientNo || ''
                        : (allocation as any)?.PatientNo || '';
                      
                      // Get current surgeon info
                      const currentSurgeon = allocation.leadSurgeonId && typeof allocation.leadSurgeonId === 'number' 
                        ? fetchedDoctors.get(allocation.leadSurgeonId) 
                        : null;
                      const currentSurgeonName = currentSurgeon?.name || (allocation as any)?.LeadSurgeonName || '';
                      const currentSurgeonId = allocation.leadSurgeonId;
                      
                      // Handle otAllocationDate - convert to Date object for DatePicker
                      let otAllocationDateObj: Date | null = null;
                      if (allocation.otAllocationDate) {
                        try {
                          // Try parsing as YYYY-MM-DD
                          if (allocation.otAllocationDate.includes('-') && allocation.otAllocationDate.split('-')[0].length === 4) {
                            otAllocationDateObj = new Date(allocation.otAllocationDate);
                          } else if (allocation.otAllocationDate.includes('-')) {
                            // Try DD-MM-YYYY format
                            const parts = allocation.otAllocationDate.split('-');
                            if (parts.length === 3 && parts[0].length === 2) {
                              otAllocationDateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                            }
                          } else {
                            otAllocationDateObj = new Date(allocation.otAllocationDate);
                          }
                          if (isNaN(otAllocationDateObj.getTime())) {
                            otAllocationDateObj = null;
                          }
                        } catch {
                          otAllocationDateObj = null;
                        }
                      }
                      
                      // Get assistant doctor, anaesthetist, nurse info
                      const assistantDoctor = allocation.assistantDoctorId && typeof allocation.assistantDoctorId === 'number' 
                        ? fetchedDoctors.get(allocation.assistantDoctorId) 
                        : null;
                      const anaesthetist = allocation.anaesthetistId && typeof allocation.anaesthetistId === 'number' 
                        ? fetchedDoctors.get(allocation.anaesthetistId) 
                        : null;
                      
                      setEditFormData({
                        patientId: allocation.patientId || '',
                        roomAdmissionId: allocation.roomAdmissionId?.toString() || '',
                        patientAppointmentId: allocation.patientAppointmentId || '',
                        emergencyBedSlotId: allocation.emergencyBedSlotId?.toString() || '',
                        otId: allocation.otId?.toString() || '',
                        otSlotIds: allocation.otSlotIds || [],
                        surgeryId: allocation.surgeryId?.toString() || '',
                        leadSurgeonId: currentSurgeonId?.toString() || '',
                        assistantDoctorId: allocation.assistantDoctorId?.toString() || '',
                        anaesthetistId: allocation.anaesthetistId?.toString() || '',
                        nurseId: allocation.nurseId?.toString() || '',
                        otAllocationDate: allocation.otAllocationDate || '',
                        duration: allocation.duration || '',
                        otActualStartTime: allocation.otActualStartTime || '',
                        otActualEndTime: allocation.otActualEndTime || '',
                        operationDescription: allocation.operationDescription || '',
                        operationStatus: allocation.operationStatus,
                        preOperationNotes: allocation.preOperationNotes || '',
                        postOperationNotes: allocation.postOperationNotes || '',
                        otDocuments: allocation.otDocuments || '',
                        billId: allocation.billId?.toString() || '',
                        status: allocation.status || 'Active',
                      });
                      
                      // Set search terms for dropdowns
                      if (currentSurgeon) {
                        setEditLeadSurgeonSearchTerm(`${currentSurgeon.name} - ${currentSurgeon.specialty}`);
                      } else if (currentSurgeonId) {
                        setEditLeadSurgeonSearchTerm(`ID: ${currentSurgeonId}`);
                      } else {
                        setEditLeadSurgeonSearchTerm('');
                      }
                      
                      if (assistantDoctor) {
                        setEditAssistantDoctorSearchTerm(`${assistantDoctor.name} - ${assistantDoctor.specialty}`);
                      } else {
                        setEditAssistantDoctorSearchTerm('');
                      }
                      
                      if (anaesthetist) {
                        setEditAnaesthetistSearchTerm(`${anaesthetist.name} - ${anaesthetist.specialty}`);
                      } else {
                        setEditAnaesthetistSearchTerm('');
                      }
                      
                      // Set nurse search term
                      if (allocation.nurseId) {
                        const nurse = availableNurses?.find(n => n.id.toString() === allocation.nurseId?.toString());
                        if (nurse) {
                          setEditNurseSearchTerm(nurse.name);
                        } else {
                          setEditNurseSearchTerm('');
                        }
                      } else {
                        setEditNurseSearchTerm('');
                      }
                      
                      // Set patient source type and search terms based on which source is used
                      if (allocation.roomAdmissionId) {
                        setEditPatientSourceType('IPD');
                        const admission = availableRoomAdmissions?.find(a => 
                          (a.roomAdmissionId?.toString() || a.id?.toString()) === allocation.roomAdmissionId?.toString()
                        );
                        if (admission) {
                          setEditRoomAdmissionSearchTerm(`${admission.patientName} - ${admission.bedNumber}`);
                          setEditSavedPatientSourceIds({ IPD: allocation.roomAdmissionId?.toString() || '' });
                        }
                      } else if (allocation.patientAppointmentId) {
                        setEditPatientSourceType('OPD');
                        // Convert to string for comparison since allocation.patientAppointmentId is an integer
                        const appointment = availablePatientAppointments?.find(a => a.id.toString() === allocation.patientAppointmentId?.toString());
                        if (appointment) {
                          const patient = patients?.find(p => 
                            (p as any).patientId === appointment.patientId || 
                            (p as any).PatientId === appointment.patientId
                          );
                          const patientName = patient 
                            ? `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() 
                            : appointment.patientId || 'Unknown';
                          setEditPatientAppointmentSearchTerm(`${appointment.tokenNo} - ${patientName}`);
                          setEditSavedPatientSourceIds({ OPD: allocation.patientAppointmentId?.toString() || '' });
                        }
                      } else if (allocation.emergencyBedSlotId) {
                        setEditPatientSourceType('EmergencyBed');
                        const slot = availableEmergencyBedSlots?.find(s => {
                          const slotId = s.EmergencyBedSlotId?.toString() || s.emergencyBedSlotId?.toString() || s.id?.toString() || '';
                          return slotId === allocation.emergencyBedSlotId?.toString();
                        });
                        if (slot) {
                          const patientName = slot.PatientName || slot.patientName || 'Unknown';
                          const bedSlotNo = slot.EmergencyBedSlotNo || slot.emergencyBedSlotNo || slot.eBedSlotNo || '';
                          setEditEmergencyBedSlotSearchTerm(`${patientName} - ${bedSlotNo}`);
                          setEditSavedPatientSourceIds({ EmergencyBed: allocation.emergencyBedSlotId?.toString() || '' });
                        }
                      } else {
                        setEditPatientSourceType('');
                        setEditSavedPatientSourceIds({});
                      }
                      
                      // Set date picker value
                      setEditOtAllocationDate(otAllocationDateObj);
                      setEditSelectedOTId(allocation.otId?.toString() || '');
                      
                      // Parse existing documents from otDocuments field
                      let existingDocUrls: string[] = [];
                      if (allocation.otDocuments) {
                        try {
                          // Try parsing as JSON array first
                          const parsed = JSON.parse(allocation.otDocuments);
                          if (Array.isArray(parsed)) {
                            existingDocUrls = parsed;
                          } else if (typeof parsed === 'string') {
                            existingDocUrls = [parsed];
                          }
                        } catch {
                          // If not JSON, treat as comma-separated string or single URL
                          if (allocation.otDocuments.includes(',')) {
                            existingDocUrls = allocation.otDocuments.split(',').map(url => url.trim()).filter(url => url);
                          } else {
                            existingDocUrls = [allocation.otDocuments];
                          }
                        }
                      }
                      setEditUploadedDocumentUrls(existingDocUrls);
                      setEditSelectedFiles([]);
                      
                      // Fetch slots for the OT
                      const fetchEditSlots = async () => {
                        if (allocation.otId) {
                          try {
                            const numericOtId = typeof allocation.otId === 'number' ? allocation.otId : parseInt(String(allocation.otId).replace('OT-', ''), 10);
                            if (!isNaN(numericOtId)) {
                              const slots = await otSlotsApi.getAll(undefined, numericOtId, allocation.otAllocationDate);
                              setEditOtSlots(slots);
                            } else {
                              setEditOtSlots([]);
                            }
                          } catch (err) {
                            console.error('Failed to fetch slots for edit:', err);
                            setEditOtSlots([]);
                          }
                        } else {
                          setEditOtSlots([]);
                        }
                      };
                      fetchEditSlots();
                      
                      setIsManageDialogOpen(true);
                    }}
                  >
                    Manage
                  </Button>
                  {allocation.operationStatus === 'Scheduled' && (
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => {
                        setSelectedAllocation(allocation);
                        // Set current time as default
                        const now = new Date();
                        const hours = String(now.getHours()).padStart(2, '0');
                        const minutes = String(now.getMinutes()).padStart(2, '0');
                        setStartSurgeryTime(`${hours}:${minutes}`);
                        setIsStartSurgeryDialogOpen(true);
                      }}
                    >
                      Start Surgery
                    </Button>
                  )}
                  {allocation.operationStatus === 'InProgress' && (
                    <Button 
                      size="sm" 
                      variant="default" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setSelectedAllocation(allocation);
                        // Set current time as default
                        const now = new Date();
                        const hours = String(now.getHours()).padStart(2, '0');
                        const minutes = String(now.getMinutes()).padStart(2, '0');
                        setCompleteSurgeryTime(`${hours}:${minutes}`);
                        setIsCompleteSurgeryDialogOpen(true);
                      }}
                    >
                      Complete Surgery
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {allocations.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            No allocations found
          </CardContent>
        </Card>
      )}

      {/* Manage Dialog */}
      <CustomResizableDialog 
        open={isManageDialogOpen} 
        onOpenChange={setIsManageDialogOpen}
        className="p-0 gap-0"
        initialWidth={550}
        maxWidth={typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.95) : 1800}
      >
        <CustomResizableDialogClose onClick={() => setIsManageDialogOpen(false)} />
        <div className="dialog-scrollable-wrapper dialog-content-scrollable flex flex-col flex-1 min-h-0 overflow-y-auto">
          <CustomResizableDialogHeader className="dialog-header-standard flex-shrink-0">
            <CustomResizableDialogTitle className="dialog-title-standard">Manage OT Allocation</CustomResizableDialogTitle>
          </CustomResizableDialogHeader>
            <div className="dialog-body-content-wrapper">
              <div className="dialog-form-container space-y-4">
                  <div className="dialog-form-field">
                    <Label htmlFor="edit-patientSourceType" className="dialog-label-standard">Patient Source *</Label>
                    <select
                      id="edit-patientSourceType"
                      className="dialog-select-standard w-full"
                      value={editPatientSourceType}
                      onChange={(e) => {
                        const sourceType = e.target.value as 'IPD' | 'OPD' | 'EmergencyBed' | '';
                        // Save current selection before switching
                        if (editPatientSourceType) {
                          const currentId = editPatientSourceType === 'IPD' 
                            ? editFormData.roomAdmissionId 
                            : editPatientSourceType === 'OPD' 
                            ? editFormData.patientAppointmentId 
                            : editFormData.emergencyBedSlotId;
                          
                          if (currentId) {
                            setEditSavedPatientSourceIds(prev => ({
                              ...prev,
                              [editPatientSourceType]: currentId
                            }));
                          }
                        }
                        
                        setEditPatientSourceType(sourceType);
                        
                        // Restore saved selection if switching back to a previously selected source type
                        if (sourceType && editSavedPatientSourceIds[sourceType as keyof typeof editSavedPatientSourceIds]) {
                          const savedId = editSavedPatientSourceIds[sourceType as keyof typeof editSavedPatientSourceIds] || '';
                          if (sourceType === 'IPD') {
                            setEditFormData({ 
                              ...editFormData, 
                              roomAdmissionId: savedId, 
                              patientAppointmentId: '', 
                              emergencyBedSlotId: '' 
                            });
                            // Restore search term if we can find the admission
                            const admission = availableRoomAdmissions?.find(a => 
                              (a.roomAdmissionId?.toString() || a.id?.toString()) === savedId
                            );
                            if (admission) {
                              setEditRoomAdmissionSearchTerm(`${admission.patientName} - ${admission.bedNumber}`);
                            }
                            setEditPatientAppointmentSearchTerm('');
                            setEditEmergencyBedSlotSearchTerm('');
                          } else if (sourceType === 'OPD') {
                            setEditFormData({ 
                              ...editFormData, 
                              patientAppointmentId: savedId, 
                              roomAdmissionId: '', 
                              emergencyBedSlotId: '' 
                            });
                            // Restore search term if we can find the appointment
                            const appointment = availablePatientAppointments?.find(a => a.id.toString() === savedId);
                            if (appointment) {
                              const patient = patients?.find(p => 
                                (p as any).patientId === appointment.patientId || 
                                (p as any).PatientId === appointment.patientId
                              );
                              const patientName = patient 
                                ? `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() 
                                : appointment.patientId || 'Unknown';
                              setEditPatientAppointmentSearchTerm(`${appointment.tokenNo} - ${patientName}`);
                            }
                            setEditRoomAdmissionSearchTerm('');
                            setEditEmergencyBedSlotSearchTerm('');
                          } else if (sourceType === 'EmergencyBed') {
                            setEditFormData({ 
                              ...editFormData, 
                              emergencyBedSlotId: savedId, 
                              roomAdmissionId: '', 
                              patientAppointmentId: '' 
                            });
                            // Restore search term if we can find the slot
                            const slot = availableEmergencyBedSlots?.find(s => {
                              const slotId = s.EmergencyBedSlotId?.toString() || s.emergencyBedSlotId?.toString() || s.id?.toString() || '';
                              return slotId === savedId;
                            });
                            if (slot) {
                              const patientName = slot.PatientName || slot.patientName || 'Unknown';
                              const bedSlotNo = slot.EmergencyBedSlotNo || slot.emergencyBedSlotNo || slot.eBedSlotNo || '';
                              setEditEmergencyBedSlotSearchTerm(`${patientName} - ${bedSlotNo}`);
                            }
                            setEditRoomAdmissionSearchTerm('');
                            setEditPatientAppointmentSearchTerm('');
                          }
                        } else {
                          // Clear all patient source selections when switching to a new source type
                          setEditFormData({ 
                            ...editFormData, 
                            roomAdmissionId: '', 
                            patientAppointmentId: '', 
                            emergencyBedSlotId: '' 
                          });
                          setEditRoomAdmissionSearchTerm('');
                          setEditPatientAppointmentSearchTerm('');
                          setEditEmergencyBedSlotSearchTerm('');
                        }
                      }}
                    >
                      <option value="">Select Patient Source</option>
                      <option value="IPD">IPD (Room Admission Number)</option>
                      <option value="OPD">OPD (Patient Appointment Number)</option>
                      <option value="EmergencyBed">EmergencyBed (Emergency Bed Number)</option>
                    </select>
                  </div>

                  {editPatientSourceType === 'IPD' && (
                  <div className="dialog-form-field">
                    <Label htmlFor="edit-roomAdmissionId" className="dialog-label-standard">Room Admission (IPD) *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="edit-roomAdmissionId"
                        autoComplete="off"
                        placeholder="Search by Patient Name, Bed Number, or Room Type..."
                        value={editRoomAdmissionSearchTerm}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setEditRoomAdmissionSearchTerm(newValue);
                          setEditRoomAdmissionHighlightIndex(-1);
                          if (editFormData.roomAdmissionId) {
                            setEditFormData({ ...editFormData, roomAdmissionId: '', patientAppointmentId: '', emergencyBedSlotId: '' });
                            setEditPatientAppointmentSearchTerm('');
                            setEditEmergencyBedSlotSearchTerm('');
                          }
                        }}
                        onKeyDown={(e) => {
                          const filteredAdmissions = (availableRoomAdmissions || []).filter(admission => {
                            if (!editRoomAdmissionSearchTerm) return false;
                            const searchLower = editRoomAdmissionSearchTerm.toLowerCase();
                            const patientName = admission.patientName || '';
                            const bedNumber = admission.bedNumber || '';
                            const roomType = admission.roomType || '';
                            const admissionId = admission.roomAdmissionId?.toString() || admission.id?.toString() || '';
                            return (
                              patientName.toLowerCase().includes(searchLower) ||
                              bedNumber.toLowerCase().includes(searchLower) ||
                              roomType.toLowerCase().includes(searchLower) ||
                              admissionId.includes(searchLower)
                            );
                          });
                          
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setEditRoomAdmissionHighlightIndex(prev => 
                              prev < filteredAdmissions.length - 1 ? prev + 1 : prev
                            );
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setEditRoomAdmissionHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                          } else if (e.key === 'Enter' && editRoomAdmissionHighlightIndex >= 0 && filteredAdmissions[editRoomAdmissionHighlightIndex]) {
                            e.preventDefault();
                            const admission = filteredAdmissions[editRoomAdmissionHighlightIndex];
                            const admissionId = admission.roomAdmissionId?.toString() || admission.id?.toString() || '';
                            setEditFormData({ ...editFormData, roomAdmissionId: admissionId, patientAppointmentId: '', emergencyBedSlotId: '' });
                            // Save the selected ID for persistence
                            setEditSavedPatientSourceIds(prev => ({ ...prev, IPD: admissionId }));
                            setEditRoomAdmissionSearchTerm(`${admission.patientName} - ${admission.bedNumber}`);
                            setEditRoomAdmissionHighlightIndex(-1);
                            setEditPatientAppointmentSearchTerm('');
                            setEditEmergencyBedSlotSearchTerm('');
                          }
                        }}
                        className="pl-10 dialog-input-standard"
                      />
                    </div>
                    {editRoomAdmissionSearchTerm && (() => {
                      const filteredAdmissions = (availableRoomAdmissions || []).filter(admission => {
                        if (!editRoomAdmissionSearchTerm) return false;
                        const searchLower = editRoomAdmissionSearchTerm.toLowerCase();
                        const patientName = admission.patientName || '';
                        const bedNumber = admission.bedNumber || '';
                        const roomType = admission.roomType || '';
                        const admissionId = admission.roomAdmissionId?.toString() || admission.id?.toString() || '';
                        return (
                          patientName.toLowerCase().includes(searchLower) ||
                          bedNumber.toLowerCase().includes(searchLower) ||
                          roomType.toLowerCase().includes(searchLower) ||
                          admissionId.includes(searchLower)
                        );
                      });
                      
                      return filteredAdmissions.length > 0 ? (
                        <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto mt-1" id="edit-roomAdmission-dropdown">
                          <table className="w-full">
                            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Patient</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Bed Number</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Room Type</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Admission Date</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredAdmissions.map((admission, index) => {
                                const isSelected = editFormData.roomAdmissionId === (admission.roomAdmissionId?.toString() || admission.id?.toString() || '');
                                const isHighlighted = editRoomAdmissionHighlightIndex === index;
                                const formattedDate = admission.admissionDate ? formatDateDisplayIST(admission.admissionDate) : 'N/A';
                                return (
                                  <tr
                                    key={admission.roomAdmissionId || admission.id}
                                    onClick={() => {
                                      const admissionId = admission.roomAdmissionId?.toString() || admission.id?.toString() || '';
                                      setEditFormData({ ...editFormData, roomAdmissionId: admissionId, patientAppointmentId: '', emergencyBedSlotId: '' });
                                      // Save the selected ID for persistence
                                      setEditSavedPatientSourceIds(prev => ({ ...prev, IPD: admissionId }));
                                      setEditRoomAdmissionSearchTerm(`${admission.patientName} - ${admission.bedNumber}`);
                                      setEditRoomAdmissionHighlightIndex(-1);
                                      setEditPatientAppointmentSearchTerm('');
                                      setEditEmergencyBedSlotSearchTerm('');
                                    }}
                                    onMouseDown={(e) => e.preventDefault()}
                                    className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                  >
                                    <td className="py-2 px-3 text-sm text-gray-900">{admission.patientName || 'Unknown'}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600 font-mono">{admission.bedNumber || '-'}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{admission.roomType || '-'}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{formattedDate}</td>
                                    <td className="py-2 px-3 text-sm">
                                      <span className={`px-2 py-0.5 rounded text-xs ${
                                        admission.status === 'Active' 
                                          ? 'bg-green-100 text-green-700' 
                                          : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {admission.status || 'Active'}
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
                  )}

                  {editPatientSourceType === 'OPD' && (
                  <div className="dialog-form-field">
                    <Label htmlFor="edit-patientAppointmentId" className="dialog-label-standard">Patient Appointment (OPD) *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="edit-patientAppointmentId"
                        autoComplete="off"
                        placeholder="Search by Token No, Patient Name, or Doctor Name..."
                        value={editPatientAppointmentSearchTerm}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setEditPatientAppointmentSearchTerm(newValue);
                          setEditPatientAppointmentHighlightIndex(-1);
                          // Clear appointment selection if user edits the search term
                          if (editFormData.patientAppointmentId) {
                            setEditFormData({ ...editFormData, patientAppointmentId: '', roomAdmissionId: '', emergencyBedSlotId: '' });
                          }
                        }}
                        onKeyDown={(e) => {
                          const filteredAppointments = (availablePatientAppointments || []).filter(appointment => {
                            if (!editPatientAppointmentSearchTerm) return false;
                            const searchLower = editPatientAppointmentSearchTerm.toLowerCase();
                            const tokenNo = appointment.tokenNo || '';
                            const patient = (patients || []).find(p => 
                              (p as any).patientId === appointment.patientId || 
                              (p as any).PatientId === appointment.patientId
                            );
                            const patientName = patient 
                              ? `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() 
                              : '';
                            const doctorName = (availableDoctors || []).find(d => d.id.toString() === appointment.doctorId)?.name || '';
                            return (
                              tokenNo.toLowerCase().includes(searchLower) ||
                              patientName.toLowerCase().includes(searchLower) ||
                              doctorName.toLowerCase().includes(searchLower)
                            );
                          });
                          
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setEditPatientAppointmentHighlightIndex(prev => 
                              prev < filteredAppointments.length - 1 ? prev + 1 : prev
                            );
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setEditPatientAppointmentHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                          } else if (e.key === 'Enter' && editPatientAppointmentHighlightIndex >= 0 && filteredAppointments[editPatientAppointmentHighlightIndex]) {
                            e.preventDefault();
                            const appointment = filteredAppointments[editPatientAppointmentHighlightIndex];
                            setEditFormData({ ...editFormData, patientAppointmentId: appointment.id.toString(), roomAdmissionId: '', emergencyBedSlotId: '' });
                            // Save the selected ID for persistence
                            setEditSavedPatientSourceIds(prev => ({ ...prev, OPD: appointment.id.toString() }));
                            const patient = (patients || []).find(p => 
                              (p as any).patientId === appointment.patientId || 
                              (p as any).PatientId === appointment.patientId
                            );
                            const patientName = patient 
                              ? `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() 
                              : appointment.patientId || 'Unknown';
                            setEditPatientAppointmentSearchTerm(`${appointment.tokenNo} - ${patientName}`);
                            setEditPatientAppointmentHighlightIndex(-1);
                          }
                        }}
                        className="pl-10"
                      />
                    </div>
                    {editPatientAppointmentSearchTerm && (() => {
                      const filteredAppointments = (availablePatientAppointments || []).filter(appointment => {
                        if (!editPatientAppointmentSearchTerm) return false;
                        const searchLower = editPatientAppointmentSearchTerm.toLowerCase();
                        const tokenNo = appointment.tokenNo || '';
                        const patient = (patients || []).find(p => 
                          (p as any).patientId === appointment.patientId || 
                          (p as any).PatientId === appointment.patientId
                        );
                        const patientName = patient 
                          ? `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() 
                          : '';
                        const doctorName = (availableDoctors || []).find(d => d.id.toString() === appointment.doctorId)?.name || '';
                        return (
                          tokenNo.toLowerCase().includes(searchLower) ||
                          patientName.toLowerCase().includes(searchLower) ||
                          doctorName.toLowerCase().includes(searchLower)
                        );
                      });
                      
                      return filteredAppointments.length > 0 ? (
                        <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto mt-1" id="edit-patientAppointment-dropdown">
                          <table className="w-full">
                            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Token No</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Patient</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Doctor</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Date</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Time</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredAppointments.map((appointment, index) => {
                                const isSelected = editFormData.patientAppointmentId === appointment.id.toString();
                                const isHighlighted = editPatientAppointmentHighlightIndex === index;
                                const patient = (patients || []).find(p => 
                                  (p as any).patientId === appointment.patientId || 
                                  (p as any).PatientId === appointment.patientId
                                );
                                const patientName = patient 
                                  ? `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() 
                                  : appointment.patientId || 'Unknown';
                                const doctorName = (availableDoctors || []).find(d => d.id.toString() === appointment.doctorId)?.name || 'Unknown';
                                const formattedDate = appointment.appointmentDate ? formatDateDisplayIST(appointment.appointmentDate) : 'N/A';
                                return (
                                  <tr
                                    key={appointment.id}
                                    onClick={() => {
                                      setEditFormData({ ...editFormData, patientAppointmentId: appointment.id.toString(), roomAdmissionId: '', emergencyBedSlotId: '' });
                                      // Save the selected ID for persistence
                                      setEditSavedPatientSourceIds(prev => ({ ...prev, OPD: appointment.id.toString() }));
                                      setEditPatientAppointmentSearchTerm(`${appointment.tokenNo} - ${patientName}`);
                                      setEditPatientAppointmentHighlightIndex(-1);
                                    }}
                                    onMouseDown={(e) => e.preventDefault()}
                                    className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                  >
                                    <td className="py-2 px-3 text-sm text-gray-900 font-mono">{appointment.tokenNo || '-'}</td>
                                    <td className="py-2 px-3 text-sm text-gray-900">{patientName}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{doctorName}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{formattedDate}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{appointment.appointmentTime || '-'}</td>
                                    <td className="py-2 px-3 text-sm">
                                      <span className={`px-2 py-0.5 rounded text-xs ${
                                        appointment.appointmentStatus === 'Completed' 
                                          ? 'bg-green-100 text-green-700' 
                                          : appointment.appointmentStatus === 'Consulting'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {appointment.appointmentStatus || 'Waiting'}
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
                  )}

                  {editPatientSourceType === 'EmergencyBed' && (
                  <div className="dialog-form-field">
                    <Label htmlFor="edit-emergencyBedSlotId" className="dialog-label-standard">Emergency Bed Slot *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="edit-emergencyBedSlotId"
                        autoComplete="off"
                        placeholder="Search by Patient Name, Bed Slot No, or Bed No..."
                        value={editEmergencyBedSlotSearchTerm}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setEditEmergencyBedSlotSearchTerm(newValue);
                          setEditEmergencyBedSlotHighlightIndex(-1);
                          if (editFormData.emergencyBedSlotId) {
                            setEditFormData({ ...editFormData, emergencyBedSlotId: '', roomAdmissionId: '', patientAppointmentId: '' });
                            setEditPatientAppointmentSearchTerm('');
                            setEditRoomAdmissionSearchTerm('');
                          }
                        }}
                        onKeyDown={(e) => {
                          const filteredSlots = (availableEmergencyBedSlots || []).filter(slot => {
                            if (!editEmergencyBedSlotSearchTerm) return false;
                            const searchLower = editEmergencyBedSlotSearchTerm.toLowerCase();
                            const patientName = slot.PatientName || slot.patientName || '';
                            const bedSlotNo = slot.EmergencyBedSlotNo || slot.emergencyBedSlotNo || slot.eBedSlotNo || '';
                            const bedNo = slot.EmergencyBedNo || slot.emergencyBedNo || '';
                            const slotId = slot.EmergencyBedSlotId?.toString() || slot.emergencyBedSlotId?.toString() || slot.id?.toString() || '';
                            return (
                              patientName.toLowerCase().includes(searchLower) ||
                              bedSlotNo.toLowerCase().includes(searchLower) ||
                              bedNo.toLowerCase().includes(searchLower) ||
                              slotId.includes(searchLower)
                            );
                          });
                          
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setEditEmergencyBedSlotHighlightIndex(prev => 
                              prev < filteredSlots.length - 1 ? prev + 1 : prev
                            );
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setEditEmergencyBedSlotHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                          } else if (e.key === 'Enter' && editEmergencyBedSlotHighlightIndex >= 0 && filteredSlots[editEmergencyBedSlotHighlightIndex]) {
                            e.preventDefault();
                            const slot = filteredSlots[editEmergencyBedSlotHighlightIndex];
                            const slotId = slot.EmergencyBedSlotId?.toString() || slot.emergencyBedSlotId?.toString() || slot.id?.toString() || '';
                            setEditFormData({ ...editFormData, emergencyBedSlotId: slotId, roomAdmissionId: '', patientAppointmentId: '' });
                            // Save the selected ID for persistence
                            setEditSavedPatientSourceIds(prev => ({ ...prev, EmergencyBed: slotId }));
                            const patientName = slot.PatientName || slot.patientName || 'Unknown';
                            const bedSlotNo = slot.EmergencyBedSlotNo || slot.emergencyBedSlotNo || slot.eBedSlotNo || '';
                            setEditEmergencyBedSlotSearchTerm(`${patientName} - ${bedSlotNo}`);
                            setEditEmergencyBedSlotHighlightIndex(-1);
                            setEditPatientAppointmentSearchTerm('');
                            setEditRoomAdmissionSearchTerm('');
                          }
                        }}
                        className="pl-10 dialog-input-standard"
                      />
                    </div>
                    {editEmergencyBedSlotSearchTerm && (() => {
                      const filteredSlots = (availableEmergencyBedSlots || []).filter(slot => {
                        if (!editEmergencyBedSlotSearchTerm) return false;
                        const searchLower = editEmergencyBedSlotSearchTerm.toLowerCase();
                        const patientName = slot.PatientName || slot.patientName || '';
                        const bedSlotNo = slot.EmergencyBedSlotNo || slot.emergencyBedSlotNo || slot.eBedSlotNo || '';
                        const bedNo = slot.EmergencyBedNo || slot.emergencyBedNo || '';
                        const slotId = slot.EmergencyBedSlotId?.toString() || slot.emergencyBedSlotId?.toString() || slot.id?.toString() || '';
                        return (
                          patientName.toLowerCase().includes(searchLower) ||
                          bedSlotNo.toLowerCase().includes(searchLower) ||
                          bedNo.toLowerCase().includes(searchLower) ||
                          slotId.includes(searchLower)
                        );
                      });
                      
                      return filteredSlots.length > 0 ? (
                        <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto mt-1" id="edit-emergencyBedSlot-dropdown">
                          <table className="w-full">
                            <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Patient</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Bed Slot No</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Bed No</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Admission Date</th>
                                <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredSlots.map((slot, index) => {
                                const slotId = slot.EmergencyBedSlotId?.toString() || slot.emergencyBedSlotId?.toString() || slot.id?.toString() || '';
                                const isSelected = editFormData.emergencyBedSlotId === slotId;
                                const isHighlighted = editEmergencyBedSlotHighlightIndex === index;
                                const patientName = slot.PatientName || slot.patientName || 'Unknown';
                                const bedSlotNo = slot.EmergencyBedSlotNo || slot.emergencyBedSlotNo || slot.eBedSlotNo || '-';
                                const bedNo = slot.EmergencyBedNo || slot.emergencyBedNo || '-';
                                const admissionDate = slot.EmergencyAdmissionDate || slot.emergencyAdmissionDate || '';
                                const formattedDate = admissionDate ? formatDateDisplayIST(typeof admissionDate === 'string' ? admissionDate : admissionDate.toString()) : 'N/A';
                                const status = slot.Status || slot.status || 'Active';
                                return (
                                  <tr
                                    key={slotId}
                                    onClick={() => {
                                      setEditFormData({ ...editFormData, emergencyBedSlotId: slotId, roomAdmissionId: '', patientAppointmentId: '' });
                                      // Save the selected ID for persistence
                                      setEditSavedPatientSourceIds(prev => ({ ...prev, EmergencyBed: slotId }));
                                      setEditEmergencyBedSlotSearchTerm(`${patientName} - ${bedSlotNo}`);
                                      setEditEmergencyBedSlotHighlightIndex(-1);
                                      setEditPatientAppointmentSearchTerm('');
                                      setEditRoomAdmissionSearchTerm('');
                                    }}
                                    onMouseDown={(e) => e.preventDefault()}
                                    className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                  >
                                    <td className="py-2 px-3 text-sm text-gray-900">{patientName}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600 font-mono">{bedSlotNo}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600 font-mono">{bedNo}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{formattedDate}</td>
                                    <td className="py-2 px-3 text-sm">
                                      <span className={`px-2 py-0.5 rounded text-xs ${
                                        status === 'Active' 
                                          ? 'bg-green-100 text-green-700' 
                                          : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {status}
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
                  )}

                  <div className="dialog-form-field">
                    <Label htmlFor="edit-otAllocationDate" className="dialog-label-standard">OT Allocation Date *</Label>
                    <ISTDatePicker
                      id="edit-otAllocationDate"
                      selected={editFormData.otAllocationDate || null}
                      onChange={(dateStr, date) => {
                        setEditOtAllocationDate(date);
                        setEditFormData({ ...editFormData, otAllocationDate: dateStr || '' });
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
                    />
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="edit-otId" className="dialog-label-standard">OT *</Label>
                    <select
                      id="edit-otId"
                      className="dialog-select-standard"
                      value={editFormData.otId}
                      onChange={(e) => {
                        setEditSelectedOTId(e.target.value);
                        setEditFormData({ ...editFormData, otId: e.target.value, otSlotIds: [] });
                      }}
                    >
                      <option value="">Select OT</option>
                      {otRooms.map(ot => (
                        <option key={ot.id} value={ot.id.toString()}>
                          {ot.otNo} - {ot.otName} ({ot.otType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="dialog-form-field">
                    <Label className="dialog-label-standard">OT Slots</Label>
                    <div className="border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto mt-1">
                      {!editFormData.otId ? (
                        <p className="text-sm text-gray-500">Please select an OT first</p>
                      ) : editOtSlots.length === 0 ? (
                        <p className="text-sm text-gray-500">No slots available for this OT</p>
                      ) : (
                        editOtSlots.map(slot => {
                          // Check if this slot is part of the current allocation's selected slots
                          const isSlotInCurrentAllocation = (editFormData.otSlotIds || []).includes(slot.id) || 
                            (selectedAllocation?.otSlotIds || []).includes(slot.id);
                          
                          // Check if slot is occupied by this surgery
                          // Compare with both id and patientOTAllocationId, and also check if it's in the allocation's slot list
                          const currentAllocationId = selectedAllocation?.id || selectedAllocation?.patientOTAllocationId;
                          const slotAllocationId = slot.patientOTAllocationId;
                          const isSlotOccupiedByThis = isSlotInCurrentAllocation || 
                            (slot.isOccupied === true && 
                             slotAllocationId !== null && 
                             slotAllocationId !== undefined &&
                             (slotAllocationId === selectedAllocation?.id || 
                              slotAllocationId === selectedAllocation?.patientOTAllocationId ||
                              slotAllocationId === currentAllocationId));
                          
                          // Slot is occupied by another surgery (not this one)
                          const isSlotOccupiedByOther = slot.isOccupied === true && !isSlotOccupiedByThis;
                          
                          return (
                            <label 
                              key={slot.id} 
                              className={`flex items-center gap-2 py-1 rounded px-2 ${
                                isSlotOccupiedByOther 
                                  ? 'cursor-not-allowed opacity-40 bg-gray-100' 
                                  : 'cursor-pointer hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={(editFormData.otSlotIds || []).includes(slot.id)}
                                onChange={(e) => {
                                  const currentSlotIds = editFormData.otSlotIds || [];
                                  let newSlotIds: number[];
                                  if (e.target.checked) {
                                    newSlotIds = [...currentSlotIds, slot.id];
                                  } else {
                                    newSlotIds = currentSlotIds.filter(id => id !== slot.id);
                                  }
                                  setEditFormData({ ...editFormData, otSlotIds: newSlotIds });
                                }}
                                disabled={isSlotOccupiedByOther}
                                className="rounded border-gray-300"
                              />
                              <span className={`text-sm ${
                                isSlotOccupiedByOther 
                                  ? 'text-gray-400 line-through' 
                                  : 'text-gray-700'
                              }`}>
                                {slot.otSlotNo} - {slot.slotStartTime} to {slot.slotEndTime}
                                {isSlotOccupiedByOther && <span className="ml-2 text-xs text-red-500">(Occupied)</span>}
                                {!isSlotOccupiedByOther && !isSlotOccupiedByThis && slot.isAvailable && <span className="ml-2 text-xs text-green-600">(Available)</span>}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                    {editFormData.otSlotIds && editFormData.otSlotIds.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">Selected: {editFormData.otSlotIds.length} slot(s)</p>
                    )}
                  </div>

                  <div className="dialog-form-field-grid">
                    <div className="dialog-field-single-column">
                      <Label htmlFor="edit-leadSurgeonId" className="dialog-label-standard">Lead Surgeon *</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          id="edit-leadSurgeonId"
                          autoComplete="off"
                          placeholder="Search by Doctor Name or Specialty..."
                          value={editLeadSurgeonSearchTerm}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setEditLeadSurgeonSearchTerm(newValue);
                            setEditLeadSurgeonHighlightIndex(-1);
                            if (editFormData.leadSurgeonId) {
                              setEditFormData({ ...editFormData, leadSurgeonId: '' });
                            }
                          }}
                          onKeyDown={(e) => {
                            const filteredDoctors = (availableDoctors || []).filter(doctor => {
                              if (!editLeadSurgeonSearchTerm) return false;
                              const searchLower = editLeadSurgeonSearchTerm.toLowerCase();
                              const doctorName = doctor.name || '';
                              const specialty = doctor.specialty || '';
                              return (
                                doctorName.toLowerCase().includes(searchLower) ||
                                specialty.toLowerCase().includes(searchLower)
                              );
                            });
                            
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setEditLeadSurgeonHighlightIndex(prev => 
                                prev < filteredDoctors.length - 1 ? prev + 1 : prev
                              );
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setEditLeadSurgeonHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                            } else if (e.key === 'Enter' && editLeadSurgeonHighlightIndex >= 0 && filteredDoctors[editLeadSurgeonHighlightIndex]) {
                              e.preventDefault();
                              const doctor = filteredDoctors[editLeadSurgeonHighlightIndex];
                              setEditFormData({ ...editFormData, leadSurgeonId: doctor.id.toString() });
                              setEditLeadSurgeonSearchTerm(`${doctor.name} - ${doctor.specialty}`);
                              setEditLeadSurgeonHighlightIndex(-1);
                            }
                          }}
                          className="dialog-input-standard pl-10"
                        />
                      </div>
                      {editLeadSurgeonSearchTerm && (() => {
                        const filteredDoctors = (availableDoctors || []).filter(doctor => {
                          if (!editLeadSurgeonSearchTerm) return false;
                          const searchLower = editLeadSurgeonSearchTerm.toLowerCase();
                          const doctorName = doctor.name || '';
                          const specialty = doctor.specialty || '';
                          return (
                            doctorName.toLowerCase().includes(searchLower) ||
                            specialty.toLowerCase().includes(searchLower)
                          );
                        });
                        
                        return filteredDoctors.length > 0 ? (
                          <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto mt-1" style={{ zIndex: 1000 }}>
                            <table className="w-full">
                              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Department</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredDoctors.map((doctor, index) => {
                                  const isSelected = editFormData.leadSurgeonId === doctor.id.toString();
                                  const isHighlighted = editLeadSurgeonHighlightIndex === index;
                                  return (
                                    <tr
                                      key={doctor.id}
                                      onClick={() => {
                                        setEditFormData({ ...editFormData, leadSurgeonId: doctor.id.toString() });
                                        setEditLeadSurgeonSearchTerm(`${doctor.name} - ${doctor.specialty}`);
                                        setEditLeadSurgeonHighlightIndex(-1);
                                      }}
                                      onMouseDown={(e) => e.preventDefault()}
                                      className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                    >
                                      <td className="py-2 px-3 text-sm text-gray-900">{doctor.name}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{doctor.specialty}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div className="dialog-field-single-column">
                      <Label htmlFor="edit-assistantDoctorId" className="dialog-label-standard">Assistant Doctor</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          id="edit-assistantDoctorId"
                          autoComplete="off"
                          placeholder="Search by Doctor Name or Department..."
                          value={editAssistantDoctorSearchTerm}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setEditAssistantDoctorSearchTerm(newValue);
                            setEditAssistantDoctorHighlightIndex(-1);
                            if (editFormData.assistantDoctorId) {
                              setEditFormData({ ...editFormData, assistantDoctorId: '' });
                            }
                          }}
                          onKeyDown={(e) => {
                            const filteredDoctors = (availableDoctors || []).filter(doctor => {
                              if (!editAssistantDoctorSearchTerm) return false;
                              const searchLower = editAssistantDoctorSearchTerm.toLowerCase();
                              const doctorName = doctor.name || '';
                              const specialty = doctor.specialty || '';
                              return (
                                doctorName.toLowerCase().includes(searchLower) ||
                                specialty.toLowerCase().includes(searchLower)
                              );
                            });
                            
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setEditAssistantDoctorHighlightIndex(prev => 
                                prev < filteredDoctors.length - 1 ? prev + 1 : prev
                              );
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setEditAssistantDoctorHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                            } else if (e.key === 'Enter' && editAssistantDoctorHighlightIndex >= 0 && filteredDoctors[editAssistantDoctorHighlightIndex]) {
                              e.preventDefault();
                              const doctor = filteredDoctors[editAssistantDoctorHighlightIndex];
                              setEditFormData({ ...editFormData, assistantDoctorId: doctor.id.toString() });
                              setEditAssistantDoctorSearchTerm(`${doctor.name} - ${doctor.specialty}`);
                              setEditAssistantDoctorHighlightIndex(-1);
                            }
                          }}
                          className="dialog-input-standard pl-10"
                        />
                      </div>
                      {editAssistantDoctorSearchTerm && (() => {
                        const filteredDoctors = (availableDoctors || []).filter(doctor => {
                          if (!editAssistantDoctorSearchTerm) return false;
                          const searchLower = editAssistantDoctorSearchTerm.toLowerCase();
                          const doctorName = doctor.name || '';
                          const specialty = doctor.specialty || '';
                          return (
                            doctorName.toLowerCase().includes(searchLower) ||
                            specialty.toLowerCase().includes(searchLower)
                          );
                        });
                        
                        return filteredDoctors.length > 0 ? (
                          <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto mt-1" style={{ zIndex: 1000 }}>
                            <table className="w-full">
                              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Department</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredDoctors.map((doctor, index) => {
                                  const isSelected = editFormData.assistantDoctorId === doctor.id.toString();
                                  const isHighlighted = editAssistantDoctorHighlightIndex === index;
                                  return (
                                    <tr
                                      key={doctor.id}
                                      onClick={() => {
                                        setEditFormData({ ...editFormData, assistantDoctorId: doctor.id.toString() });
                                        setEditAssistantDoctorSearchTerm(`${doctor.name} - ${doctor.specialty}`);
                                        setEditAssistantDoctorHighlightIndex(-1);
                                      }}
                                      onMouseDown={(e) => e.preventDefault()}
                                      className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                    >
                                      <td className="py-2 px-3 text-sm text-gray-900">{doctor.name}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{doctor.specialty}</td>
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

                  <div className="dialog-form-field-grid">
                    <div className="dialog-field-single-column">
                      <Label htmlFor="edit-anaesthetistId" className="dialog-label-standard">Anaesthetist</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          id="edit-anaesthetistId"
                          autoComplete="off"
                          placeholder="Search by Doctor Name or Department..."
                          value={editAnaesthetistSearchTerm}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setEditAnaesthetistSearchTerm(newValue);
                            setEditAnaesthetistHighlightIndex(-1);
                            if (editFormData.anaesthetistId) {
                              setEditFormData({ ...editFormData, anaesthetistId: '' });
                            }
                          }}
                          onKeyDown={(e) => {
                            const filteredDoctors = (availableDoctors || []).filter(doctor => {
                              if (!editAnaesthetistSearchTerm) return false;
                              const searchLower = editAnaesthetistSearchTerm.toLowerCase();
                              const doctorName = doctor.name || '';
                              const specialty = doctor.specialty || '';
                              return (
                                doctorName.toLowerCase().includes(searchLower) ||
                                specialty.toLowerCase().includes(searchLower)
                              );
                            });
                            
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setEditAnaesthetistHighlightIndex(prev => 
                                prev < filteredDoctors.length - 1 ? prev + 1 : prev
                              );
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setEditAnaesthetistHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                            } else if (e.key === 'Enter' && editAnaesthetistHighlightIndex >= 0 && filteredDoctors[editAnaesthetistHighlightIndex]) {
                              e.preventDefault();
                              const doctor = filteredDoctors[editAnaesthetistHighlightIndex];
                              setEditFormData({ ...editFormData, anaesthetistId: doctor.id.toString() });
                              setEditAnaesthetistSearchTerm(`${doctor.name} - ${doctor.specialty}`);
                              setEditAnaesthetistHighlightIndex(-1);
                            }
                          }}
                          className="dialog-input-standard pl-10"
                        />
                      </div>
                      {editAnaesthetistSearchTerm && (() => {
                        const filteredDoctors = (availableDoctors || []).filter(doctor => {
                          if (!editAnaesthetistSearchTerm) return false;
                          const searchLower = editAnaesthetistSearchTerm.toLowerCase();
                          const doctorName = doctor.name || '';
                          const specialty = doctor.specialty || '';
                          return (
                            doctorName.toLowerCase().includes(searchLower) ||
                            specialty.toLowerCase().includes(searchLower)
                          );
                        });
                        
                        return filteredDoctors.length > 0 ? (
                          <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto mt-1" style={{ zIndex: 1000 }}>
                            <table className="w-full">
                              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Department</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredDoctors.map((doctor, index) => {
                                  const isSelected = editFormData.anaesthetistId === doctor.id.toString();
                                  const isHighlighted = editAnaesthetistHighlightIndex === index;
                                  return (
                                    <tr
                                      key={doctor.id}
                                      onClick={() => {
                                        setEditFormData({ ...editFormData, anaesthetistId: doctor.id.toString() });
                                        setEditAnaesthetistSearchTerm(`${doctor.name} - ${doctor.specialty}`);
                                        setEditAnaesthetistHighlightIndex(-1);
                                      }}
                                      onMouseDown={(e) => e.preventDefault()}
                                      className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                    >
                                      <td className="py-2 px-3 text-sm text-gray-900">{doctor.name}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{doctor.specialty}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div className="dialog-field-single-column">
                      <Label htmlFor="edit-nurseId" className="dialog-label-standard">Nurse</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          id="edit-nurseId"
                          autoComplete="off"
                          placeholder="Search by Nurse Name..."
                          value={editNurseSearchTerm}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setEditNurseSearchTerm(newValue);
                            setEditNurseHighlightIndex(-1);
                            if (editFormData.nurseId) {
                              setEditFormData({ ...editFormData, nurseId: '' });
                            }
                          }}
                          onKeyDown={(e) => {
                            const filteredNurses = (availableNurses || []).filter(nurse => {
                              if (!editNurseSearchTerm) return false;
                              const searchLower = editNurseSearchTerm.toLowerCase();
                              const nurseName = nurse.name || '';
                              return nurseName.toLowerCase().includes(searchLower);
                            });
                            
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setEditNurseHighlightIndex(prev => 
                                prev < filteredNurses.length - 1 ? prev + 1 : prev
                              );
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setEditNurseHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                            } else if (e.key === 'Enter' && editNurseHighlightIndex >= 0 && filteredNurses[editNurseHighlightIndex]) {
                              e.preventDefault();
                              const nurse = filteredNurses[editNurseHighlightIndex];
                              setEditFormData({ ...editFormData, nurseId: nurse.id.toString() });
                              setEditNurseSearchTerm(nurse.name);
                              setEditNurseHighlightIndex(-1);
                            }
                          }}
                          className="dialog-input-standard pl-10"
                        />
                      </div>
                      {editNurseSearchTerm && !editFormData.nurseId && (() => {
                        const filteredNurses = (availableNurses || []).filter(nurse => {
                          if (!editNurseSearchTerm) return false;
                          const searchLower = editNurseSearchTerm.toLowerCase();
                          const nurseName = nurse.name || '';
                          return nurseName.toLowerCase().includes(searchLower);
                        });
                        
                        return filteredNurses.length > 0 ? (
                          <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto mt-1" style={{ zIndex: 1000 }}>
                            <table className="w-full">
                              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredNurses.map((nurse, index) => {
                                  const isSelected = editFormData.nurseId === nurse.id.toString();
                                  const isHighlighted = editNurseHighlightIndex === index;
                                  return (
                                    <tr
                                      key={nurse.id}
                                      onClick={() => {
                                        setEditFormData({ ...editFormData, nurseId: nurse.id.toString() });
                                        setEditNurseSearchTerm(nurse.name);
                                        setEditNurseHighlightIndex(-1);
                                      }}
                                      onMouseDown={(e) => e.preventDefault()}
                                      className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                    >
                                      <td className="py-2 px-3 text-sm text-gray-900">{nurse.name}</td>
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

                  <div className="dialog-form-field">
                    <Label htmlFor="edit-duration" className="dialog-label-standard">Duration (in minutes)</Label>
                    <Input
                      id="edit-duration"
                      type="number"
                      placeholder="e.g., 120"
                      value={editFormData.duration}
                      onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                      className="dialog-input-standard"
                    />
                  </div>

                  <div className="dialog-form-field-grid">
                    <div className="dialog-field-single-column">
                      <Label htmlFor="edit-otActualStartTime" className="dialog-label-standard">OT Actual Start Time</Label>
                      <Input
                        id="edit-otActualStartTime"
                        type="time"
                        value={editFormData.otActualStartTime}
                        onChange={(e) => setEditFormData({ ...editFormData, otActualStartTime: e.target.value })}
                        className="dialog-input-standard"
                      />
                    </div>
                    <div className="dialog-field-single-column">
                      <Label htmlFor="edit-otActualEndTime" className="dialog-label-standard">OT Actual End Time</Label>
                      <Input
                        id="edit-otActualEndTime"
                        type="time"
                        value={editFormData.otActualEndTime}
                        onChange={(e) => setEditFormData({ ...editFormData, otActualEndTime: e.target.value })}
                        className="dialog-input-standard"
                      />
                    </div>
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="edit-operationDescription" className="dialog-label-standard">Operation Description</Label>
                    <Textarea
                      id="edit-operationDescription"
                      placeholder="Enter operation description..."
                      value={editFormData.operationDescription}
                      onChange={(e) => setEditFormData({ ...editFormData, operationDescription: e.target.value })}
                      rows={3}
                      className="dialog-textarea-standard"
                    />
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="edit-preOperationNotes" className="dialog-label-standard">Pre Operation Notes</Label>
                    <Textarea
                      id="edit-preOperationNotes"
                      placeholder="e.g., ICU bed reserved post-surgery"
                      value={editFormData.preOperationNotes}
                      onChange={(e) => setEditFormData({ ...editFormData, preOperationNotes: e.target.value })}
                      rows={2}
                      className="dialog-textarea-standard"
                    />
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="edit-postOperationNotes" className="dialog-label-standard">Post Operation Notes</Label>
                    <Textarea
                      id="edit-postOperationNotes"
                      placeholder="Enter post operation notes..."
                      value={editFormData.postOperationNotes}
                      onChange={(e) => setEditFormData({ ...editFormData, postOperationNotes: e.target.value })}
                      rows={2}
                      className="dialog-textarea-standard"
                    />
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="edit-billId" className="dialog-label-standard">Bill ID</Label>
                    <Input
                      id="edit-billId"
                      type="number"
                      placeholder="Enter Bill ID"
                      value={editFormData.billId}
                      onChange={(e) => setEditFormData({ ...editFormData, billId: e.target.value })}
                      className="dialog-input-standard"
                    />
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="edit-operationStatus" className="dialog-label-standard">Operation Status</Label>
                    <select
                      id="edit-operationStatus"
                      className="dialog-select-standard"
                      value={editFormData.operationStatus}
                      onChange={(e) => setEditFormData({ ...editFormData, operationStatus: e.target.value as PatientOTAllocation['operationStatus'] })}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="InProgress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Postponed">Postponed</option>
                    </select>
                  </div>

                    <div className="dialog-form-field">
                      <Label htmlFor="edit-duration" className="dialog-label-standard">Duration (minutes)</Label>
                      <Input
                        id="edit-duration"
                        type="number"
                        value={editFormData.duration !== undefined ? editFormData.duration : (selectedAllocation.duration || '')}
                        onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                        className="dialog-input-standard"
                        placeholder="Enter duration in minutes"
                      />
                    </div>

                    <div className="dialog-form-field-grid">
                      <div className="dialog-form-field">
                        <Label htmlFor="edit-otActualStartTime" className="dialog-label-standard">Actual Start Time</Label>
                        <Input
                          id="edit-otActualStartTime"
                          type="time"
                          value={editFormData.otActualStartTime !== undefined ? editFormData.otActualStartTime : (selectedAllocation.otActualStartTime || '')}
                          onChange={(e) => setEditFormData({ ...editFormData, otActualStartTime: e.target.value })}
                          className="dialog-input-standard"
                        />
                      </div>
                      <div className="dialog-form-field">
                        <Label htmlFor="edit-otActualEndTime" className="dialog-label-standard">Actual End Time</Label>
                        <Input
                          id="edit-otActualEndTime"
                          type="time"
                          value={editFormData.otActualEndTime !== undefined ? editFormData.otActualEndTime : (selectedAllocation.otActualEndTime || '')}
                          onChange={(e) => setEditFormData({ ...editFormData, otActualEndTime: e.target.value })}
                          className="dialog-input-standard"
                        />
                      </div>
                    </div>

                    <div className="dialog-form-field">
                      <Label htmlFor="edit-preOperationNotes" className="dialog-label-standard">Pre-Operation Notes</Label>
                      <Textarea
                        id="edit-preOperationNotes"
                        value={editFormData.preOperationNotes !== undefined ? editFormData.preOperationNotes : (selectedAllocation.preOperationNotes || '')}
                        onChange={(e) => setEditFormData({ ...editFormData, preOperationNotes: e.target.value })}
                        rows={4}
                        className="dialog-textarea-standard"
                        placeholder="Enter pre-operation notes"
                      />
                    </div>

                    <div className="dialog-form-field">
                      <Label htmlFor="edit-postOperationNotes" className="dialog-label-standard">Post-Operation Notes</Label>
                      <Textarea
                        id="edit-postOperationNotes"
                        value={editFormData.postOperationNotes !== undefined ? editFormData.postOperationNotes : (selectedAllocation.postOperationNotes || '')}
                        onChange={(e) => setEditFormData({ ...editFormData, postOperationNotes: e.target.value })}
                        rows={4}
                        className="dialog-textarea-standard"
                        placeholder="Enter post-operation notes"
                      />
                    </div>

                    <div className="dialog-form-field">
                      <Label htmlFor="edit-otDocuments" className="dialog-label-standard">OT Documents</Label>
                      
                      {/* Display existing uploaded documents */}
                      {editUploadedDocumentUrls.length > 0 && (
                        <div className="mb-3 space-y-2">
                          <p className="text-sm text-gray-600 font-medium">Uploaded Documents:</p>
                          <div className="space-y-1">
                            {editUploadedDocumentUrls.map((url, index) => {
                              const fileName = url.split('/').pop() || `Document ${index + 1}`;
                              return (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2"
                                  >
                                    <span>{fileName}</span>
                                    <span className="text-xs text-gray-500">(opens in new tab)</span>
                                  </a>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Remove from UI - backend will auto-delete when Update is clicked
                                      setEditUploadedDocumentUrls(prev => prev.filter((_, i) => i !== index));
                                    }}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                    title="Remove file (will be deleted when you click Update)"
                                  >
                                    ×
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* File input for adding more documents */}
                      <Input
                        id="edit-otDocuments"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setEditSelectedFiles(prev => [...prev, ...files]);
                          // Reset the input so the same file can be selected again
                          e.target.value = '';
                        }}
                        className="dialog-input-standard"
                      />
                      {editSelectedFiles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600 font-medium">New Files to Upload:</p>
                          {editSelectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 p-2 rounded">
                              <span>{file.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Files will be uploaded when you click "Update"</p>
                    </div>

                    <div className="dialog-form-field">
                      <Label htmlFor="edit-billId" className="dialog-label-standard">Bill ID</Label>
                      <Input
                        id="edit-billId"
                        type="number"
                        placeholder="Enter Bill ID"
                        value={editFormData.billId}
                        onChange={(e) => setEditFormData({ ...editFormData, billId: e.target.value })}
                        className="dialog-input-standard"
                      />
                    </div>

              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 px-6">
              <Button variant="outline" onClick={() => {
                setIsManageDialogOpen(false);
                setEditFormData({
                  patientId: '',
                  roomAdmissionId: '',
                  patientAppointmentId: '',
                  emergencyBedSlotId: '',
                  otId: '',
                  otSlotIds: [],
                  surgeryId: '',
                  leadSurgeonId: '',
                  assistantDoctorId: '',
                  anaesthetistId: '',
                  nurseId: '',
                  otAllocationDate: '',
                  duration: '',
                  otActualStartTime: '',
                  otActualEndTime: '',
                  operationDescription: '',
                  operationStatus: 'Scheduled',
                  preOperationNotes: '',
                  postOperationNotes: '',
                  otDocuments: '',
                  billId: '',
                  status: 'Active',
                });
                setEditLeadSurgeonSearchTerm('');
                setEditLeadSurgeonHighlightIndex(-1);
                setEditAssistantDoctorSearchTerm('');
                setEditAssistantDoctorHighlightIndex(-1);
                setEditAnaesthetistSearchTerm('');
                setEditAnaesthetistHighlightIndex(-1);
                setEditNurseSearchTerm('');
                setEditNurseHighlightIndex(-1);
                setEditRoomAdmissionSearchTerm('');
                setEditRoomAdmissionHighlightIndex(-1);
                setEditPatientAppointmentSearchTerm('');
                setEditPatientAppointmentHighlightIndex(-1);
                setEditEmergencyBedSlotSearchTerm('');
                setEditEmergencyBedSlotHighlightIndex(-1);
                setEditOtAllocationDate(null);
                setEditOtSlots([]);
                setEditSelectedOTId('');
                setEditSelectedFiles([]);
                setEditUploadedDocumentUrls([]);
                setSelectedAllocation(null);
                setFetchedAppointment(null);
              }} className="dialog-footer-button" disabled={isSaving}>Cancel</Button>
              <Button onClick={handleSaveAllocation} className="dialog-footer-button" disabled={isSaving}>
                {isSaving ? 'Updating...' : 'Update'}
              </Button>
            </div>
            </div>
        </CustomResizableDialog>

      {/* Start Surgery Dialog */}
      <CustomResizableDialog 
        open={isStartSurgeryDialogOpen} 
        onOpenChange={setIsStartSurgeryDialogOpen}
        className="p-0 gap-0"
        initialWidth={550}
        maxWidth={typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.95) : 1800}
      >
        <CustomResizableDialogClose onClick={() => setIsStartSurgeryDialogOpen(false)} />
        <div className="dialog-scrollable-wrapper dialog-content-scrollable flex flex-col flex-1 min-h-0 overflow-y-auto">
          <CustomResizableDialogHeader className="dialog-header-standard flex-shrink-0">
            <CustomResizableDialogTitle className="dialog-title-standard">Start Surgery</CustomResizableDialogTitle>
          </CustomResizableDialogHeader>
            <div className="dialog-body-content-wrapper">
              {selectedAllocation && (
                <div className="dialog-form-container space-y-4">
                  <div className="dialog-form-field">
                    <Label className="dialog-label-standard">Patient</Label>
                    <Input
                      value={(() => {
                        const patient = selectedAllocation.patientId ? fetchedPatients.get(selectedAllocation.patientId) : null;
                        const patientName = patient 
                          ? `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() 
                          : (selectedAllocation as any)?.PatientName || 'Unknown';
                        return patientName;
                      })()}
                      disabled
                      className="dialog-input-standard dialog-input-disabled"
                    />
                  </div>
                  <div className="dialog-form-field">
                    <Label className="dialog-label-standard">Operation Description</Label>
                    <Input
                      value={selectedAllocation.operationDescription || '-'}
                      disabled
                      className="dialog-input-standard dialog-input-disabled"
                    />
                  </div>
                  <div className="dialog-form-field">
                    <Label htmlFor="start-surgery-time" className="dialog-label-standard">Actual Start Time *</Label>
                    <Input
                      id="start-surgery-time"
                      type="time"
                      value={startSurgeryTime}
                      onChange={(e) => setStartSurgeryTime(e.target.value)}
                      className="dialog-input-standard"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsStartSurgeryDialogOpen(false);
                        setStartSurgeryTime('');
                        setSelectedAllocation(null);
                      }}
                      className="dialog-footer-button"
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="default"
                      onClick={handleStartSurgery}
                      className="dialog-footer-button"
                      disabled={isUpdating || !startSurgeryTime}
                    >
                      {isUpdating ? 'Starting...' : 'Start Surgery'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CustomResizableDialog>

      {/* Complete Surgery Dialog */}
      <CustomResizableDialog 
        open={isCompleteSurgeryDialogOpen} 
        onOpenChange={setIsCompleteSurgeryDialogOpen}
        className="p-0 gap-0"
        initialWidth={550}
        maxWidth={typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.95) : 1800}
      >
        <CustomResizableDialogClose onClick={() => setIsCompleteSurgeryDialogOpen(false)} />
        <div className="dialog-scrollable-wrapper dialog-content-scrollable flex flex-col flex-1 min-h-0 overflow-y-auto">
          <CustomResizableDialogHeader className="dialog-header-standard flex-shrink-0">
            <CustomResizableDialogTitle className="dialog-title-standard">Complete Surgery</CustomResizableDialogTitle>
          </CustomResizableDialogHeader>
            <div className="dialog-body-content-wrapper">
              {selectedAllocation && (
                <div className="dialog-form-container space-y-4">
                  <div className="dialog-form-field">
                    <Label className="dialog-label-standard">Patient</Label>
                    <Input
                      value={(() => {
                        const patient = selectedAllocation.patientId ? fetchedPatients.get(selectedAllocation.patientId) : null;
                        const patientName = patient 
                          ? `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() 
                          : (selectedAllocation as any)?.PatientName || 'Unknown';
                        return patientName;
                      })()}
                      disabled
                      className="dialog-input-standard dialog-input-disabled"
                    />
                  </div>
                  <div className="dialog-form-field">
                    <Label className="dialog-label-standard">Operation Description</Label>
                    <Input
                      value={selectedAllocation.operationDescription || '-'}
                      disabled
                      className="dialog-input-standard dialog-input-disabled"
                    />
                  </div>
                  {selectedAllocation.otActualStartTime && (
                    <div className="dialog-form-field">
                      <Label className="dialog-label-standard">Actual Start Time</Label>
                      <Input
                        value={selectedAllocation.otActualStartTime}
                        disabled
                        className="dialog-input-standard dialog-input-disabled"
                      />
                    </div>
                  )}
                  <div className="dialog-form-field">
                    <Label htmlFor="complete-surgery-time" className="dialog-label-standard">Actual End Time *</Label>
                    <Input
                      id="complete-surgery-time"
                      type="time"
                      value={completeSurgeryTime}
                      onChange={(e) => setCompleteSurgeryTime(e.target.value)}
                      className="dialog-input-standard"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsCompleteSurgeryDialogOpen(false);
                        setCompleteSurgeryTime('');
                        setSelectedAllocation(null);
                      }}
                      className="dialog-footer-button"
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="default"
                      onClick={handleCompleteSurgery}
                      className="dialog-footer-button bg-green-600 hover:bg-green-700"
                      disabled={isUpdating || !completeSurgeryTime}
                    >
                      {isUpdating ? 'Completing...' : 'Complete Surgery'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CustomResizableDialog>
    </div>
  );
}
