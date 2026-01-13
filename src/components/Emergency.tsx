import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ResizableDialogContent } from './ResizableDialogContent';
import { CustomResizableDialog, CustomResizableDialogHeader, CustomResizableDialogTitle, CustomResizableDialogClose } from './CustomResizableDialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Siren, Plus, Ambulance, AlertTriangle, BedDouble, ArrowRight, Clock, Search, Calendar, ChevronUp, Edit, Trash2, Eye } from 'lucide-react';
import { Switch } from './ui/switch';
import ISTDatePicker from './ui/ISTDatePicker';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { patientsApi } from '../api/patients';
import { Patient, EmergencyAdmission, EmergencyAdmissionVitals } from '../types';
import { useEmergencyBedSlots } from '../hooks/useEmergencyBedSlots';
import { useEmergencyBeds } from '../hooks/useEmergencyBeds';
import { useStaff } from '../hooks/useStaff';
import { useRoles } from '../hooks/useRoles';
import { emergencyAdmissionsApi, CreateEmergencyAdmissionDto, UpdateEmergencyAdmissionDto, emergencyAdmissionVitalsApi, CreateEmergencyAdmissionVitalsDto, UpdateEmergencyAdmissionVitalsDto } from '../api/emergencyAdmissions';
import { formatDateTimeIST, convertToIST, getTodayIST } from '../utils/timeUtils';
import { getCurrentIST, getCurrentDateIST } from '../config/timezone';

interface EmergencyPatient {
  id: number;
  emergencyId: string;
  patientName: string;
  age: number;
  gender: string;
  phone: string;
  arrivalTime: string;
  arrivalMode: 'Walk-in' | 'Ambulance' | 'Referred';
  chiefComplaint: string;
  triageLevel: 'Red' | 'Yellow' | 'Green';
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    oxygenSaturation: number;
  };
  status: 'Waiting' | 'Under Treatment' | 'Admitted' | 'Discharged' | 'Transferred';
  assignedDoctor?: string;
  bedNumber?: string;
  admittedTo?: string;
  notes?: string;
}

const mockEmergencyPatients: EmergencyPatient[] = [
  {
    id: 1,
    emergencyId: 'ER-2025-001',
    patientName: 'Michael Rodriguez',
    age: 52,
    gender: 'Male',
    phone: '555-9001',
    arrivalTime: '08:15 AM',
    arrivalMode: 'Ambulance',
    chiefComplaint: 'Severe chest pain, difficulty breathing',
    triageLevel: 'Red',
    vitalSigns: {
      bloodPressure: '160/100',
      heartRate: 105,
      temperature: 37.2,
      oxygenSaturation: 91,
    },
    status: 'Under Treatment',
    assignedDoctor: 'Dr. Sarah Johnson',
    bedNumber: 'ER-01',
    notes: 'Suspected cardiac emergency, ECG ordered',
  },
  {
    id: 2,
    emergencyId: 'ER-2025-002',
    patientName: 'Sarah Williams',
    age: 28,
    gender: 'Female',
    phone: '555-9002',
    arrivalTime: '09:30 AM',
    arrivalMode: 'Walk-in',
    chiefComplaint: 'Severe abdominal pain',
    triageLevel: 'Yellow',
    vitalSigns: {
      bloodPressure: '125/80',
      heartRate: 88,
      temperature: 37.8,
      oxygenSaturation: 97,
    },
    status: 'Waiting',
    bedNumber: 'ER-03',
  },
  {
    id: 3,
    emergencyId: 'ER-2025-003',
    patientName: 'James Patterson',
    age: 35,
    gender: 'Male',
    phone: '555-9003',
    arrivalTime: '10:00 AM',
    arrivalMode: 'Ambulance',
    chiefComplaint: 'Motor vehicle accident - multiple injuries',
    triageLevel: 'Red',
    vitalSigns: {
      bloodPressure: '110/70',
      heartRate: 110,
      temperature: 36.9,
      oxygenSaturation: 94,
    },
    status: 'Under Treatment',
    assignedDoctor: 'Dr. Michael Chen',
    bedNumber: 'ER-02',
    notes: 'Trauma case, orthopedic consult requested',
  },
  {
    id: 4,
    emergencyId: 'ER-2025-004',
    patientName: 'Emily Thompson',
    age: 6,
    gender: 'Female',
    phone: '555-9004',
    arrivalTime: '10:45 AM',
    arrivalMode: 'Walk-in',
    chiefComplaint: 'High fever, difficulty breathing',
    triageLevel: 'Yellow',
    vitalSigns: {
      bloodPressure: '90/60',
      heartRate: 120,
      temperature: 39.5,
      oxygenSaturation: 93,
    },
    status: 'Under Treatment',
    assignedDoctor: 'Dr. Robert Lee',
    bedNumber: 'ER-05',
  },
  {
    id: 5,
    emergencyId: 'ER-2025-005',
    patientName: 'Robert Chang',
    age: 42,
    gender: 'Male',
    phone: '555-9005',
    arrivalTime: '11:15 AM',
    arrivalMode: 'Walk-in',
    chiefComplaint: 'Minor cut on hand',
    triageLevel: 'Green',
    vitalSigns: {
      bloodPressure: '120/75',
      heartRate: 75,
      temperature: 36.8,
      oxygenSaturation: 98,
    },
    status: 'Waiting',
    bedNumber: 'ER-08',
  },
];

const emergencyBeds = Array.from({ length: 10 }, (_, i) => {
  const bedNumber = `ER-${(i + 1).toString().padStart(2, '0')}`;
  const patient = mockEmergencyPatients.find(p => p.bedNumber === bedNumber);
  return {
    bedNumber,
    status: patient ? 'Occupied' : 'Available',
    patient,
  };
});

export function Emergency() {
  // Helper function to get current IST datetime in format for datetime-local input (YYYY-MM-DDTHH:mm)
  const getCurrentISTDateTimeLocal = (): string => {
    const istDate = getCurrentIST();
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    const hours = String(istDate.getUTCHours()).padStart(2, '0');
    const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  // Helper function to convert a datetime string to IST format for datetime-local input
  const convertToISTDateTimeLocal = (dateTime: string | Date): string => {
    try {
      const istDate = convertToIST(dateTime);
      const year = istDate.getUTCFullYear();
      const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(istDate.getUTCDate()).padStart(2, '0');
      const hours = String(istDate.getUTCHours()).padStart(2, '0');
      const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return getCurrentISTDateTimeLocal();
    }
  };

  // Helper function to format datetime to IST timestamp format (dd-mm-yyyy hh:mm am/pm)
  const formatISTTimestamp = (dateTime: string | Date | undefined): string => {
    if (!dateTime) return '';
    try {
      // Use convertToIST to properly convert to IST
      const istDate = convertToIST(dateTime);
      
      // Extract date components
      const year = istDate.getUTCFullYear();
      const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(istDate.getUTCDate()).padStart(2, '0');
      
      // Extract time components
      const hours = istDate.getUTCHours();
      const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
      
      // Convert to 12-hour format with lowercase am/pm
      const period = hours >= 12 ? 'pm' : 'am';
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      
      return `${day}-${month}-${year} ${String(displayHour).padStart(2, '0')}:${minutes} ${period}`;
    } catch {
      return '';
    }
  };

  // Helper function to format datetime to dd-mm-yyyy, hh:mm format in IST
  const formatDateTimeForInput = (dateTime: string | Date | undefined): string => {
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
  };

  // Helper function to parse datetime from dd-mm-yyyy, hh:mm format (assumed to be in IST)
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
  };
  
  const [patients, setPatients] = useState<EmergencyPatient[]>(mockEmergencyPatients);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<EmergencyPatient | null>(null);
  const [selectedAdmissionForEdit, setSelectedAdmissionForEdit] = useState<EmergencyAdmission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFetchingAdmission, setIsFetchingAdmission] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [addEmergencyAdmissionDateTime, setAddEmergencyAdmissionDateTime] = useState<Date | null>(null);
  const [editEmergencyAdmissionDate, setEditEmergencyAdmissionDate] = useState<Date | null>(null);
  const [editEmergencyAdmissionDateTime, setEditEmergencyAdmissionDateTime] = useState<Date | null>(null);
  const [editEmergencyAdmissionDateTimeDisplay, setEditEmergencyAdmissionDateTimeDisplay] = useState('');
  const [isUnoccupiedBedsExpanded, setIsUnoccupiedBedsExpanded] = useState(false);
  
  // Vitals management state
  const [vitals, setVitals] = useState<EmergencyAdmissionVitals[]>([]);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [isAddVitalsDialogOpen, setIsAddVitalsDialogOpen] = useState(false);
  const [isManageVitalsDialogOpen, setIsManageVitalsDialogOpen] = useState(false);
  const [selectedVitals, setSelectedVitals] = useState<EmergencyAdmissionVitals | null>(null);
  const [addVitalsRecordedDateTime, setAddVitalsRecordedDateTime] = useState<Date | null>(new Date());
  const [manageVitalsRecordedDateTime, setManageVitalsRecordedDateTime] = useState<Date | null>(null);
  const [vitalsFormData, setVitalsFormData] = useState<CreateEmergencyAdmissionVitalsDto>({
    emergencyAdmissionId: 0,
    nurseId: 0,
    recordedDateTime: '',
    heartRate: undefined,
    bloodPressure: '',
    temperature: undefined,
    o2Saturation: undefined,
    respiratoryRate: undefined,
    pulseRate: undefined,
    vitalsStatus: 'Stable',
    vitalsRemarks: '',
    status: 'Active',
  });
  
  // Hooks for emergency admission data
  const { emergencyBedSlots, fetchEmergencyBedSlots } = useEmergencyBedSlots();
  const { emergencyBeds, fetchEmergencyBeds } = useEmergencyBeds();
  const { staff, fetchStaff } = useStaff();
  const { roles, fetchRoles } = useRoles();
  
  // Emergency admissions data
  const [emergencyAdmissions, setEmergencyAdmissions] = useState<EmergencyAdmission[]>([]);
  const [emergencyAdmissionsLoading, setEmergencyAdmissionsLoading] = useState(true);
  const [emergencyAdmissionsError, setEmergencyAdmissionsError] = useState<string | null>(null);
  
  // Patient search state for Register Emergency Patient dialog
  const [availablePatients, setAvailablePatients] = useState<Patient[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [editPatientSearchTerm, setEditPatientSearchTerm] = useState('');
  const [patientHighlightIndex, setPatientHighlightIndex] = useState(-1);
  const [editPatientHighlightIndex, setEditPatientHighlightIndex] = useState(-1);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [editSelectedPatientId, setEditSelectedPatientId] = useState<string>('');
  const [patientError, setPatientError] = useState('');
  const [editPatientError, setEditPatientError] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showEditPatientDropdown, setShowEditPatientDropdown] = useState(false);
  const patientInputRef = useRef<HTMLDivElement>(null);
  const editPatientInputRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [editDropdownPosition, setEditDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  
  // Doctor search state
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [editDoctorSearchTerm, setEditDoctorSearchTerm] = useState('');
  
  // Filter staff to get doctors
  const doctors = useMemo(() => {
    try {
      if (!staff || !Array.isArray(staff) || !roles || !Array.isArray(roles) || staff.length === 0 || roles.length === 0) {
        return [];
      }
      return staff
        .filter((member) => {
          if (!member || !member.RoleId) return false;
          const role = roles.find(r => r && r.id === member.RoleId);
          if (!role || !role.name) return false;
          const roleNameLower = role.name.toLowerCase();
          return roleNameLower.includes('doctor') || roleNameLower.includes('surgeon');
        })
        .map((member) => {
          if (!member) return null;
          const role = roles.find(r => r && r.id === member.RoleId);
          const memberId = member.UserId;
          if (!memberId) return null;
          return {
            id: memberId,
            name: member.UserName || 'Unknown',
            role: role?.name || 'Unknown',
          };
        })
        .filter((doctor): doctor is { id: number | string; name: string; role: string } => doctor !== null);
    } catch (error) {
      console.error('Error filtering doctors:', error);
      return [];
    }
  }, [staff, roles]);
  
  // Form data for Register Emergency Patient (Emergency Admission)
  const [emergencyFormData, setEmergencyFormData] = useState({
    doctorId: '',
    patientId: '',
    emergencyBedId: '',
    emergencyAdmissionDate: (() => {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      return `${day}-${month}-${year}`;
    })(),
    emergencyStatus: 'Admitted' as EmergencyAdmission['emergencyStatus'],
    numberOfDays: null as number | null,
    diagnosis: '',
    treatmentDetails: '',
    patientCondition: 'Stable' as EmergencyAdmission['patientCondition'],
    priority: 'Medium',
    transferToIPDOTICU: false,
    transferTo: undefined as 'IPD' | 'ICU' | 'OT' | undefined,
    transferDetails: '',
    status: 'Active' as EmergencyAdmission['status'],
  });

  // Form data for Edit Emergency Admission
  const [editFormData, setEditFormData] = useState({
    id: 0,
    doctorId: '',
    patientId: '',
    emergencyBedId: '',
    emergencyAdmissionDate: getCurrentDateIST(),
    emergencyStatus: 'Admitted' as EmergencyAdmission['emergencyStatus'],
    numberOfDays: null as number | null,
    diagnosis: '',
    treatmentDetails: '',
    patientCondition: 'Stable' as EmergencyAdmission['patientCondition'],
    priority: 'Medium',
    transferToIPDOTICU: false,
    transferTo: undefined as 'IPD' | 'ICU' | 'OT' | undefined,
    transferDetails: '',
    status: 'Active' as EmergencyAdmission['status'],
  });
  
  // Fetch all required data on mount - always go to network
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setEmergencyAdmissionsLoading(true);
        setEmergencyAdmissionsError(null);
        
        // Fetch all data in parallel - always from network
        await Promise.all([
          emergencyAdmissionsApi.getAll().then(data => setEmergencyAdmissions(data)),
          fetchEmergencyBedSlots(),
          fetchEmergencyBeds(),
          fetchStaff(),
          fetchRoles(),
        ]);
      } catch (err) {
        console.error('Failed to fetch emergency data:', err);
        setEmergencyAdmissionsError(err instanceof Error ? err.message : 'Failed to fetch emergency admissions');
        setEmergencyAdmissions([]);
      } finally {
        setEmergencyAdmissionsLoading(false);
      }
    };
    fetchAllData();
  }, [fetchEmergencyBedSlots, fetchEmergencyBeds, fetchStaff, fetchRoles]);
  
  // Fetch patients for search - always from network
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await patientsApi.getAll(1, 1000);
        // patientsApi.getAll returns PaginatedResponse<Patient> with a 'data' property
        const patientsList = response.data || [];
        setAvailablePatients(patientsList);
      } catch (err) {
        console.error('Failed to fetch patients:', err);
        setAvailablePatients([]);
      }
    };
    fetchPatients();
  }, []);
  
  // Update dropdown position when input position changes
  const updateDropdownPosition = useCallback(() => {
    if (patientInputRef.current) {
      const rect = patientInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, []);

  // Update position on scroll/resize
  useEffect(() => {
    if (showPatientDropdown && patientInputRef.current) {
      updateDropdownPosition();
      const handleScroll = () => {
        if (patientInputRef.current) {
          updateDropdownPosition();
        }
      };
      const handleResize = () => {
        if (patientInputRef.current) {
          updateDropdownPosition();
        }
      };
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showPatientDropdown, updateDropdownPosition]);

  // Close patient dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showPatientDropdown && !target.closest('.dialog-dropdown-container') && !target.closest('#emergency-patient-search') && !target.closest('#emergency-patient-dropdown')) {
        setShowPatientDropdown(false);
      }
    };
    if (showPatientDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPatientDropdown]);

  // Sort admissions: Critical first, then Stable, then by date (newest first)
  const sortedAdmissions = useMemo(() => {
    return [...emergencyAdmissions].sort((a, b) => {
      // First sort by condition: Critical comes before Stable
      const conditionOrder = { 'Critical': 0, 'Stable': 1 };
      const conditionDiff = (conditionOrder[a.patientCondition] ?? 2) - (conditionOrder[b.patientCondition] ?? 2);
      if (conditionDiff !== 0) return conditionDiff;
      
      // Then sort by date (newest first)
      const dateA = new Date(a.emergencyAdmissionDate).getTime();
      const dateB = new Date(b.emergencyAdmissionDate).getTime();
      return dateB - dateA; // Newest first
    });
  }, [emergencyAdmissions]);
  
  // Helper function to get patient name
  const getPatientName = useCallback((admission: EmergencyAdmission): string => {
    if (admission.patientName) {
      return `${admission.patientName}${admission.patientNo ? ` (${admission.patientNo})` : ''}`;
    }
    const patient = availablePatients.find(p => {
      const pid = (p as any).patientId || (p as any).PatientId || '';
      return pid === admission.patientId;
    });
    if (patient) {
      const patientName = (patient as any).patientName || (patient as any).PatientName || '';
      const lastName = (patient as any).lastName || (patient as any).LastName || '';
      const fullName = `${patientName} ${lastName}`.trim();
      const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
      return `${fullName || 'Unknown'}${patientNo ? ` (${patientNo})` : ''}`;
    }
    return 'Unknown';
  }, [availablePatients]);
  
  // Helper function to get doctor name
  const getDoctorName = useCallback((admission: EmergencyAdmission): string => {
    if (admission.doctorName) {
      return admission.doctorName;
    }
    const doctor = doctors.find(d => d.id === admission.doctorId);
    if (doctor) {
      return doctor.name;
    }
    return 'Unknown';
  }, [doctors]);
  
  // Helper function to format date/time in dd-mm-yy hh:mm format
  const formatDateTime = useCallback((dateTimeString: string): string => {
    if (!dateTimeString) return '-';
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) return dateTimeString;
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    } catch (error) {
      return dateTimeString;
    }
  }, []);
  
  // Helper function to get room ID (emergency room name/number) from bed
  const getRoomId = useCallback((admission: EmergencyAdmission): string => {
    if (!admission.emergencyBedSlotId) return '-';
    
    // Find bed through slot (for backward compatibility with existing data)
    const slot = emergencyBedSlots.find(s => s.id === admission.emergencyBedSlotId);
    if (slot) {
      const bed = emergencyBeds.find(b => b.id === slot.emergencyBedId);
      return bed?.emergencyRoomNameNo || '-';
    }
    return '-';
  }, [emergencyBedSlots, emergencyBeds]);

  // Helper function to get room name from EmergencyBedId
  const getRoomNameFromBedId = useCallback((admission: EmergencyAdmission): string => {
    if (!admission.emergencyBedId) return '-';
    
    // Find bed directly using emergencyBedId
    const bed = emergencyBeds.find(b => b.id === admission.emergencyBedId);
    return bed?.emergencyRoomNameNo || '-';
  }, [emergencyBeds]);
  
  // Helper function to get bed number
  const getBedNumber = useCallback((admission: EmergencyAdmission): string => {
    if (!admission.emergencyBedSlotId) return '-';
    
    // Find bed through slot (for backward compatibility with existing data)
    const slot = emergencyBedSlots.find(s => s.id === admission.emergencyBedSlotId);
    if (slot) {
      const bed = emergencyBeds.find(b => b.id === slot.emergencyBedId);
      return bed?.emergencyBedNo || '-';
    }
    return '-';
  }, [emergencyBedSlots, emergencyBeds]);

  // Helper function to format date to DD-MM-YYYY
  const formatDateToDDMMYYYY = useCallback((dateString: string): string => {
    if (!dateString) return '-';
    
    // Check if already in DD-MM-YYYY format
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      return dateString;
    }
    
    // Check if in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}-${month}-${year}`;
    }
    
    // Try to parse as Date object
    const dateObj = new Date(dateString);
    if (!isNaN(dateObj.getTime())) {
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    return dateString; // Return as-is if can't parse
  }, []);

  // Helper function to convert DD-MM-YYYY to Date object
  const getDateFromDDMMYYYY = useCallback((dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (dateRegex.test(dateString)) {
      const [, day, month, year] = dateString.match(dateRegex)!;
      return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    }
    return undefined;
  }, []);

  // Helper function to convert Date object to DD-MM-YYYY (using IST)
  const getDDMMYYYYFromDate = useCallback((date: Date): string => {
    // Convert to IST before formatting
    const istDate = convertToIST(date);
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const year = istDate.getUTCFullYear();
    return `${day}-${month}-${year}`;
  }, []);

  // Sync DatePicker with form data for Add dialog
  useEffect(() => {
    if (emergencyFormData.emergencyAdmissionDate) {
      const dateObj = getDateFromDDMMYYYY(emergencyFormData.emergencyAdmissionDate);
      setAddEmergencyAdmissionDateTime(dateObj || null);
    } else {
      setAddEmergencyAdmissionDateTime(null);
    }
  }, [emergencyFormData.emergencyAdmissionDate, getDateFromDDMMYYYY]);

  // Sync DatePicker with form data for Edit dialog
  useEffect(() => {
    if (editFormData.emergencyAdmissionDate) {
      const dateObj = getDateFromDDMMYYYY(editFormData.emergencyAdmissionDate);
      setEditEmergencyAdmissionDate(dateObj || null);
    } else {
      setEditEmergencyAdmissionDate(null);
    }
  }, [editFormData.emergencyAdmissionDate, getDateFromDDMMYYYY]);

  // Set default date/time when Add dialog opens (using current date/time)
  useEffect(() => {
    if (isAddDialogOpen) {
      // Set current date and time
      const now = new Date();
      setAddEmergencyAdmissionDateTime(now);
      // Also set in form data for compatibility
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      setEmergencyFormData(prev => ({
        ...prev,
        emergencyAdmissionDate: formattedDate,
      }));
    }
  }, [isAddDialogOpen]);

  
  const getStatusBadge = useCallback((status: EmergencyAdmission['emergencyStatus']) => {
    switch (status) {
      case 'Admitted':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-sm">Admitted</Badge>;
      case 'IPD':
        return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-sm">IPD</Badge>;
      case 'OT':
        return <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300 text-sm">OT</Badge>;
      case 'ICU':
        return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-sm">ICU</Badge>;
      case 'Discharged':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-sm">Discharged</Badge>;
      case 'Movedout':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-sm">Movedout</Badge>;
      default:
        return <Badge variant="outline" className="text-sm">{status}</Badge>;
    }
  }, []);
  
  const getConditionBadge = useCallback((condition: EmergencyAdmission['patientCondition']) => {
    switch (condition) {
      case 'Critical':
        return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-sm">Critical</Badge>;
      case 'Stable':
        return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-sm">Stable</Badge>;
      default:
        return <Badge variant="outline" className="text-sm">{condition}</Badge>;
    }
  }, []);

  // Function to open edit dialog and populate form
  const handleEditAdmission = useCallback(async (admission: EmergencyAdmission) => {
    setIsFetchingAdmission(true);
    setUpdateError(null);
    try {
      // Ensure emergency beds are loaded before fetching admission details
      if (emergencyBeds.length === 0) {
        await fetchEmergencyBeds();
      }
      
      // Fetch the full admission details from the API
      const fullAdmission = await emergencyAdmissionsApi.getById(admission.emergencyAdmissionId);
      setSelectedAdmissionForEdit(fullAdmission);
      
      // Find patient to populate search term
      const patient = availablePatients.find(p => {
        const pid = (p as any).patientId || (p as any).PatientId || '';
        return pid === fullAdmission.patientId;
      });
      if (patient) {
        const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
        const patientName = (patient as any).patientName || (patient as any).PatientName || '';
        const lastName = (patient as any).lastName || (patient as any).LastName || '';
        const fullName = `${patientName} ${lastName}`.trim();
        setEditPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
        setEditSelectedPatientId(fullAdmission.patientId);
      } else {
        setEditPatientSearchTerm(getPatientName(fullAdmission));
        setEditSelectedPatientId(fullAdmission.patientId);
      }
      
      // Find doctor to populate search term
      const doctor = doctors.find(d => d.id === fullAdmission.doctorId);
      if (doctor) {
        setEditDoctorSearchTerm(`${doctor.name} - ${doctor.role}`);
      } else {
        setEditDoctorSearchTerm(getDoctorName(fullAdmission));
      }
      
      // Populate form data
      // Use emergencyBedId directly from the API response, or fallback to finding it from slot
      let bedId: number | undefined = fullAdmission.emergencyBedId;
      if (!bedId && fullAdmission.emergencyBedSlotId) {
        // Fallback: find bed ID from slot (for backward compatibility)
        const slot = emergencyBedSlots.find(s => s.id === fullAdmission.emergencyBedSlotId);
        bedId = slot?.emergencyBedId;
      }
      
      // Ensure bed exists in emergencyBeds array before setting it
      // If bedId is set but doesn't exist in the beds list, try to find it by matching bed number
      if (bedId) {
        const bedExists = emergencyBeds.some(b => b.id === bedId);
        if (!bedExists) {
          // Try to find bed by matching the emergencyBedNo from the admission
          const bedNo = fullAdmission.emergencyBedNo;
          if (bedNo) {
            const matchingBed = emergencyBeds.find(b => b.emergencyBedNo === bedNo);
            if (matchingBed) {
              bedId = matchingBed.id;
            } else {
              console.warn(`Emergency bed with ID ${bedId} or number ${bedNo} not found in emergencyBeds list`);
              bedId = undefined;
            }
          } else {
            console.warn(`Emergency bed with ID ${bedId} not found in emergencyBeds list`);
            bedId = undefined;
          }
        }
      }
      
      // Convert date to DD-MM-YYYY format for display
      let formattedDate = fullAdmission.emergencyAdmissionDate;
      if (formattedDate) {
        // Parse the date and convert to DD-MM-YYYY
        let dateObj: Date;
        if (typeof formattedDate === 'string') {
          // Check if it's in YYYY-MM-DD format
          if (/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
            const [year, month, day] = formattedDate.split('-');
            formattedDate = `${day}-${month}-${year}`;
          } else if (/^\d{2}-\d{2}-\d{4}$/.test(formattedDate)) {
            // Already in DD-MM-YYYY format
            formattedDate = formattedDate;
          } else {
            // Try to parse as Date object
            dateObj = new Date(formattedDate);
            if (!isNaN(dateObj.getTime())) {
              const day = String(dateObj.getDate()).padStart(2, '0');
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const year = dateObj.getFullYear();
              formattedDate = `${day}-${month}-${year}`;
            } else {
              // If date parsing fails, use current date as fallback
              const today = new Date();
              const day = String(today.getDate()).padStart(2, '0');
              const month = String(today.getMonth() + 1).padStart(2, '0');
              const year = today.getFullYear();
              formattedDate = `${day}-${month}-${year}`;
            }
          }
        } else {
          // If it's a Date object
          dateObj = new Date(formattedDate);
          if (!isNaN(dateObj.getTime())) {
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            formattedDate = `${day}-${month}-${year}`;
          } else {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            formattedDate = `${day}-${month}-${year}`;
          }
        }
      } else {
        // If no date, use current date as fallback
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        formattedDate = `${day}-${month}-${year}`;
      }
      
      setEditFormData({
        id: fullAdmission.emergencyAdmissionId,
        doctorId: fullAdmission.doctorId.toString(),
        patientId: fullAdmission.patientId,
        emergencyBedId: bedId ? bedId.toString() : '',
        emergencyAdmissionDate: formattedDate || getCurrentDateIST(),
        emergencyStatus: fullAdmission.emergencyStatus,
        numberOfDays: fullAdmission.numberOfDays ?? null,
        diagnosis: fullAdmission.diagnosis || '',
        treatmentDetails: fullAdmission.treatmentDetails || '',
        patientCondition: fullAdmission.patientCondition,
        priority: fullAdmission.priority || 'Medium',
        transferToIPDOTICU: fullAdmission.transferToIPDOTICU,
        transferTo: fullAdmission.transferTo,
        transferDetails: fullAdmission.transferDetails || '',
        status: fullAdmission.status,
      });
      
      setIsEditDialogOpen(true);
      setUpdateError(null);
      setUpdateSuccess(false);
      
      // Set DatePicker state for edit (for backward compatibility)
      if (formattedDate) {
        const dateObj = getDateFromDDMMYYYY(formattedDate);
        setEditEmergencyAdmissionDate(dateObj || null);
      } else {
        setEditEmergencyAdmissionDate(null);
      }
      
      // Set datetime value for edit dialog DatePicker
      // Parse date/time from backend string in format "dd-mm-yyyy hh:mm AM/PM"
      let dateTimeValue: Date | null = null;
      if (fullAdmission.emergencyAdmissionDate) {
        try {
          const dateStr = typeof fullAdmission.emergencyAdmissionDate === 'string' 
            ? fullAdmission.emergencyAdmissionDate 
            : String(fullAdmission.emergencyAdmissionDate);
          
          // Try to parse "dd-mm-yyyy hh:mm AM/PM" format
          const dateTimeRegex = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/i;
          const match = dateStr.match(dateTimeRegex);
          
          if (match) {
            const [, day, month, year, hourStr, minute, ampm] = match;
            let hours = parseInt(hourStr, 10);
            if (ampm.toUpperCase() === 'PM' && hours !== 12) {
              hours += 12;
            } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
              hours = 0;
            }
            dateTimeValue = new Date(
              parseInt(year, 10),
              parseInt(month, 10) - 1,
              parseInt(day, 10),
              hours,
              parseInt(minute, 10)
            );
          } else {
            // Fallback: try standard Date parsing
            const dateObj = new Date(dateStr);
            if (!isNaN(dateObj.getTime())) {
              dateTimeValue = dateObj;
            } else {
              // Fallback to current date/time if parsing fails
              dateTimeValue = new Date();
            }
          }
        } catch {
          // Fallback to current date/time
          dateTimeValue = new Date();
        }
      } else {
        // No date, use current date/time
        dateTimeValue = new Date();
      }
      setEditEmergencyAdmissionDateTime(dateTimeValue);
      // Format date/time for display
      if (dateTimeValue) {
        const day = String(dateTimeValue.getDate()).padStart(2, '0');
        const month = String(dateTimeValue.getMonth() + 1).padStart(2, '0');
        const year = dateTimeValue.getFullYear();
        const hours = dateTimeValue.getHours();
        const minutes = String(dateTimeValue.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        const hoursStr = String(hours12).padStart(2, '0');
        setEditEmergencyAdmissionDateTimeDisplay(`${day}-${month}-${year}, ${hoursStr}:${minutes} ${ampm}`);
      } else {
        setEditEmergencyAdmissionDateTimeDisplay('');
      }
      
      // Fetch vitals for this admission
      fetchVitals(fullAdmission.emergencyAdmissionId);
    } catch (error) {
      console.error('Error fetching admission details:', error);
      setUpdateError(error instanceof Error ? error.message : 'Failed to fetch admission details. Please try again.');
      // Still open the dialog with the existing data as fallback
      setSelectedAdmissionForEdit(admission);
      setIsEditDialogOpen(true);
    } finally {
      setIsFetchingAdmission(false);
    }
  }, [availablePatients, doctors, emergencyBedSlots, getPatientName, getDoctorName]);
  
  // Fetch vitals for an emergency admission
  const fetchVitals = async (emergencyAdmissionId: number) => {
    setVitalsLoading(true);
    try {
      const vitalsData = await emergencyAdmissionVitalsApi.getAll(emergencyAdmissionId);
      setVitals(vitalsData);
    } catch (err) {
      console.error('Error fetching vitals:', err);
      setVitals([]);
    } finally {
      setVitalsLoading(false);
    }
  };
  
  const redPatients = patients.filter(p => p.triageLevel === 'Red');
  const yellowPatients = patients.filter(p => p.triageLevel === 'Yellow');
  const greenPatients = patients.filter(p => p.triageLevel === 'Green');
  const occupiedBedsCount = emergencyBeds.filter(b => b.status === 'occupied').length;
  const ambulanceArrivals = patients.filter(p => p.arrivalMode === 'Ambulance').length;
  
  // Helper function to check if admission is discharged or transferred
  const isDischargedOrTransferred = useCallback((admission: EmergencyAdmission): boolean => {
    return admission.emergencyStatus === 'Discharged' || 
           admission.emergencyStatus === 'Movedout' ||
           admission.emergencyStatus === 'IPD' ||
           admission.emergencyStatus === 'OT' ||
           admission.emergencyStatus === 'ICU';
  }, []);

  // Priority-based counts from emergency admissions (exclude discharged/transferred)
  const criticalPriorityAdmissions = emergencyAdmissions.filter(a => 
    a.priority === 'Critical' && 
    a.status === 'Active' && 
    !isDischargedOrTransferred(a)
  ).length;
  const highPriorityAdmissions = emergencyAdmissions.filter(a => 
    a.priority === 'High' && 
    a.status === 'Active' && 
    !isDischargedOrTransferred(a)
  ).length;
  const mediumPriorityAdmissions = emergencyAdmissions.filter(a => 
    a.priority === 'Medium' && 
    a.status === 'Active' && 
    !isDischargedOrTransferred(a)
  ).length;
  const lowPriorityAdmissions = emergencyAdmissions.filter(a => 
    a.priority === 'Low' && 
    a.status === 'Active' && 
    !isDischargedOrTransferred(a)
  ).length;
  const totalActiveAdmissions = emergencyAdmissions.filter(a => 
    a.status === 'Active' && 
    !isDischargedOrTransferred(a)
  ).length;

  // Separate beds into occupied and unoccupied
  const { occupiedBedsList, unoccupiedBedsList } = useMemo(() => {
    const occupied: typeof emergencyBeds = [];
    const unoccupied: typeof emergencyBeds = [];
    
    emergencyBeds
      .filter(bed => bed.status === 'active' || bed.status === 'occupied')
      .forEach(bed => {
        // Check if bed is occupied by admission
        const admission = emergencyAdmissions.find(a => 
          a.emergencyBedId === bed.id && 
          a.status === 'Active'
        );
        
        // Check if patient is transferred or discharged
        // When transferred, emergencyStatus should be 'Movedout' (set automatically on save)
        // Keep checks for 'IPD', 'OT', 'ICU' as fallback for existing records
        const isDischargedOrMoved = admission?.emergencyStatus === 'Discharged' || 
                                    admission?.emergencyStatus === 'Movedout' ||
                                    admission?.emergencyStatus === 'IPD' ||
                                    admission?.emergencyStatus === 'OT' ||
                                    admission?.emergencyStatus === 'ICU';
        
        // Bed is occupied if:
        // 1. Bed status is 'occupied' (regardless of admission record - backend marks it as occupied), OR
        // 2. There's an active admission with 'Admitted' status (not transferred/discharged/moved)
        const bedStatus = bed.status?.toLowerCase();
        if (bedStatus === 'occupied') {
          // Bed marked as occupied in database - always show as occupied
          occupied.push(bed);
        } else if (admission && 
                   admission.emergencyStatus === 'Admitted' && 
                   !isDischargedOrMoved) {
          // Bed has active admission with 'Admitted' status - show as occupied
          occupied.push(bed);
        } else {
          // Bed is unoccupied if:
          // - Bed status is 'active' (mapped from 'Unoccupied' in API) AND no active admission, OR
          // - Admission exists but patient is transferred/discharged/moved (emergencyStatus is 'Movedout', 'Discharged', etc.)
          //   The record still exists but bed is available
          unoccupied.push(bed);
        }
      });
    
    return { occupiedBedsList: occupied, unoccupiedBedsList: unoccupied };
  }, [emergencyBeds, emergencyAdmissions]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-lg">
            <Siren className="size-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-gray-900 mb-1">Emergency Department</h1>
            <p className="text-gray-500">Manage emergency cases and triage</p>
          </div>
        </div>
        <Button 
          className="gap-2 bg-red-600 hover:bg-red-700"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="size-4" />
          Register Emergency Patient
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
              <CustomResizableDialogTitle className="dialog-title-standard">Add New Emergency Admission</CustomResizableDialogTitle>
            </CustomResizableDialogHeader>
              <div className="dialog-body-content-wrapper">
                <div className="dialog-form-container space-y-4">
                  <div className="dialog-form-field">
                    <Label htmlFor="add-doctor-search" className="dialog-label-standard">Doctor *</Label>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input
                        id="add-doctor-search"
                        placeholder="Search by Doctor Name or Specialty..."
                        value={doctorSearchTerm}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setDoctorSearchTerm(newValue);
                          // Clear doctor selection when user edits the search term to allow re-selection
                          if (emergencyFormData.doctorId) {
                            setEmergencyFormData({ ...emergencyFormData, doctorId: '' });
                          }
                        }}
                        className="dialog-input-standard pl-10"
                      />
                    </div>
                    {doctorSearchTerm && !emergencyFormData.doctorId && (
                      <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                        <table className="w-full">
                          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                              <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Role</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(doctors || [])
                              .filter(doctor => {
                                if (!doctorSearchTerm) return false;
                                if (!doctor || !doctor.name || !doctor.role) return false;
                                const searchLower = doctorSearchTerm.toLowerCase();
                                return (
                                  doctor.name.toLowerCase().includes(searchLower) ||
                                  doctor.role.toLowerCase().includes(searchLower)
                                );
                              })
                              .filter(doctor => doctor && doctor.id)
                              .map(doctor => {
                                const doctorIdStr = doctor.id.toString();
                                const isSelected = emergencyFormData.doctorId === doctorIdStr;
                                return (
                                  <tr
                                    key={doctor.id}
                                    onClick={() => {
                                      setEmergencyFormData({ ...emergencyFormData, doctorId: doctorIdStr });
                                      setDoctorSearchTerm(`${doctor.name} - ${doctor.role}`);
                                    }}
                                    className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-gray-100' : ''}`}
                                  >
                                    <td className="py-2 px-3 text-sm text-gray-900">{doctor.name}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{doctor.role}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                        {doctors.filter(doctor => {
                          if (!doctorSearchTerm) return false;
                          const searchLower = doctorSearchTerm.toLowerCase();
                          return (
                            doctor.name.toLowerCase().includes(searchLower) ||
                            doctor.role.toLowerCase().includes(searchLower)
                          );
                        }).length === 0 && !emergencyFormData.doctorId && (
                          <div className="text-center py-8 text-sm text-gray-700">
                            No doctors found. Try a different search term.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="emergency-patient-search" className="dialog-label-standard">Patient *</Label>
                    <div className="relative mb-2" ref={patientInputRef}>
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 z-10" />
                      <Input
                        id="emergency-patient-search"
                        autoComplete="off"
                        placeholder="Search patient by name, ID, phone, or patient number..."
                        value={patientSearchTerm}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setPatientSearchTerm(newValue);
                          setPatientHighlightIndex(-1);
                          // Clear patient selection when user edits the search term
                          if (emergencyFormData.patientId) {
                            setEmergencyFormData({ ...emergencyFormData, patientId: '' });
                            setSelectedPatientId('');
                          }
                          // Clear error when user starts typing
                          if (patientError) {
                            setPatientError('');
                          }
                        }}
                        className="dialog-input-standard pl-10"
                      />
                    </div>
                    {patientSearchTerm && !emergencyFormData.patientId && (
                      <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                        <table className="w-full">
                          <tbody>
                            {availablePatients
                              .filter((patient: any) => {
                                if (!patientSearchTerm) return false;
                                const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                                const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                                const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                                const lastName = (patient as any).lastName || (patient as any).LastName || '';
                                const fullName = `${patientName} ${lastName}`.trim();
                                const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                                const searchLower = patientSearchTerm.toLowerCase();
                                return (
                                  patientId.toLowerCase().includes(searchLower) ||
                                  patientNo.toLowerCase().includes(searchLower) ||
                                  fullName.toLowerCase().includes(searchLower) ||
                                  phoneNo.includes(patientSearchTerm)
                                );
                              })
                              .map((patient: any) => {
                                const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                                const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                                const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                                const lastName = (patient as any).lastName || (patient as any).LastName || '';
                                const fullName = `${patientName} ${lastName}`.trim();
                                const isSelected = emergencyFormData.patientId === patientId;
                                return (
                                  <tr
                                    key={patientId}
                                    onClick={() => {
                                      setEmergencyFormData({ ...emergencyFormData, patientId });
                                      setSelectedPatientId(patientId);
                                      // Set patient name in search box similar to doctor search
                                      const displayName = patientNo ? `${patientNo} - ${fullName}` : fullName;
                                      setPatientSearchTerm(displayName || 'Unknown');
                                    }}
                                    className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-gray-100' : ''}`}
                                  >
                                    <td className="py-2 px-3 text-sm text-gray-900">
                                      {patientNo ? `${patientNo} - ` : ''}{fullName || 'Unknown'}
                                    </td>
                                    <td className="py-2 px-3 text-sm text-gray-600 font-mono text-xs">
                                      ID: {patientId.substring(0, 8)}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                        {availablePatients.filter((patient: any) => {
                          if (!patientSearchTerm) return false;
                          const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                          const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                          const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                          const lastName = (patient as any).lastName || (patient as any).LastName || '';
                          const fullName = `${patientName} ${lastName}`.trim();
                          const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                          const searchLower = patientSearchTerm.toLowerCase();
                          return (
                            patientId.toLowerCase().includes(searchLower) ||
                            patientNo.toLowerCase().includes(searchLower) ||
                            fullName.toLowerCase().includes(searchLower) ||
                            phoneNo.includes(patientSearchTerm)
                          );
                        }).length === 0 && (
                          <div className="text-center py-8 text-sm text-gray-700">
                            No patients found. Try a different search term.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="add-emergencyBedId" className="dialog-label-standard">Emergency Bed *</Label>
                    <select
                      id="add-emergencyBedId"
                      aria-label="Emergency Bed"
                      className="dialog-select-standard"
                      value={emergencyFormData.emergencyBedId}
                      onChange={(e) => setEmergencyFormData({ ...emergencyFormData, emergencyBedId: e.target.value })}
                    >
                      <option value="">Select Emergency Bed *</option>
                      {unoccupiedBedsList.length > 0 ? (
                        unoccupiedBedsList.map(bed => (
                          <option key={bed.id} value={bed.id.toString()}>
                            {bed.emergencyBedNo} {bed.emergencyRoomNameNo ? `(${bed.emergencyRoomNameNo})` : ''}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No unoccupied beds available</option>
                      )}
                    </select>
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="add-emergencyAdmissionDateTime" className="dialog-label-standard">Emergency Admission Date & Time *</Label>
                    <DatePicker
                      id="add-emergencyAdmissionDateTime"
                      selected={addEmergencyAdmissionDateTime}
                      onChange={(date: Date | null) => {
                        setAddEmergencyAdmissionDateTime(date);
                        if (date) {
                          // Also store in DD-MM-YYYY format for display compatibility
                          const day = String(date.getDate()).padStart(2, '0');
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const year = date.getFullYear();
                          const displayDate = `${day}-${month}-${year}`;
                          setEmergencyFormData({ ...emergencyFormData, emergencyAdmissionDate: displayDate });
                        } else {
                          setEmergencyFormData({ ...emergencyFormData, emergencyAdmissionDate: '' });
                        }
                      }}
                      showTimeSelect
                      timeIntervals={1}
                      timeCaption="Time"
                      timeFormat="hh:mm aa"
                      dateFormat="dd-MM-yyyy hh:mm aa"
                      placeholderText="dd-mm-yyyy hh:mm AM/PM"
                      className="dialog-input-standard w-full"
                      wrapperClassName="w-full"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      yearDropdownItemNumber={100}
                      scrollableYearDropdown
                      isClearable
                    />
                    <p className="text-xs text-gray-500 mt-1">Select date and time for emergency admission</p>
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="add-numberOfDays" className="dialog-label-standard">Number of Days</Label>
                    <Input
                      id="add-numberOfDays"
                      type="number"
                      placeholder="Enter number of days"
                      value={emergencyFormData.numberOfDays || ''}
                      onChange={(e) => setEmergencyFormData({ ...emergencyFormData, numberOfDays: e.target.value ? parseInt(e.target.value) : null })}
                      className="dialog-input-standard"
                      min="0"
                    />
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="add-emergencyStatus" className="dialog-label-standard">Emergency Status</Label>
                    <select
                      id="add-emergencyStatus"
                      aria-label="Emergency Status"
                      className="dialog-select-standard"
                      value={emergencyFormData.emergencyStatus}
                      onChange={(e) => setEmergencyFormData({ ...emergencyFormData, emergencyStatus: e.target.value as EmergencyAdmission['emergencyStatus'] })}
                    >
                      <option value="Admitted">Admitted</option>
                      <option value="Discharged">Discharged</option>
                      <option value="Movedout">Movedout</option>
                    </select>
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="add-diagnosis" className="dialog-label-standard">Diagnosis</Label>
                    <Textarea
                      id="add-diagnosis"
                      placeholder="Enter diagnosis..."
                      value={emergencyFormData.diagnosis}
                      onChange={(e) => setEmergencyFormData({ ...emergencyFormData, diagnosis: e.target.value })}
                      rows={3}
                      className="dialog-textarea-standard"
                    />
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="add-treatmentDetails" className="dialog-label-standard">Treatment Details</Label>
                    <Textarea
                      id="add-treatmentDetails"
                      placeholder="Enter treatment details..."
                      value={emergencyFormData.treatmentDetails}
                      onChange={(e) => setEmergencyFormData({ ...emergencyFormData, treatmentDetails: e.target.value })}
                      rows={3}
                      className="dialog-textarea-standard"
                    />
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="add-patientCondition" className="dialog-label-standard">Patient Condition</Label>
                    <select
                      id="add-patientCondition"
                      aria-label="Patient Condition"
                      className="dialog-select-standard"
                      value={emergencyFormData.patientCondition}
                      onChange={(e) => setEmergencyFormData({ ...emergencyFormData, patientCondition: e.target.value as EmergencyAdmission['patientCondition'] })}
                    >
                      <option value="Stable">Stable</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="add-priority" className="dialog-label-standard">Priority</Label>
                    <select
                      id="add-priority"
                      aria-label="Priority"
                      className="dialog-select-standard"
                      value={emergencyFormData.priority}
                      onChange={(e) => setEmergencyFormData({ ...emergencyFormData, priority: e.target.value })}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div className="dialog-form-field">
                    <div className="dialog-checkbox-container">
                      <input
                        type="checkbox"
                        id="add-transferToIPDOTICU"
                        aria-label="Transfer To IPD/OT/ICU"
                        checked={emergencyFormData.transferToIPDOTICU}
                        onChange={(e) => setEmergencyFormData({ ...emergencyFormData, transferToIPDOTICU: e.target.checked, transferTo: e.target.checked ? emergencyFormData.transferTo : undefined })}
                        className="rounded"
                      />
                      <Label htmlFor="add-transferToIPDOTICU" className="dialog-label-standard cursor-pointer">Transfer To IPD/OT/ICU</Label>
                    </div>
                  </div>

                  {emergencyFormData.transferToIPDOTICU && (
                    <>
                      <div className="dialog-form-field">
                        <Label htmlFor="add-transferTo" className="dialog-label-standard">Transfer To *</Label>
                        <select
                          id="add-transferTo"
                          aria-label="Transfer To"
                          className="dialog-select-standard"
                          value={emergencyFormData.transferTo || ''}
                          onChange={(e) => setEmergencyFormData({ ...emergencyFormData, transferTo: e.target.value as 'IPD' | 'ICU' | 'OT' })}
                        >
                          <option value="">Select Transfer Destination</option>
                          <option value="IPD">IPD</option>
                          <option value="ICU">ICU</option>
                          <option value="OT">OT</option>
                        </select>
                      </div>
                      <div className="dialog-form-field">
                        <Label htmlFor="add-transferDetails" className="dialog-label-standard">Transfer Details</Label>
                        <Textarea
                          id="add-transferDetails"
                          placeholder="Enter transfer details..."
                          value={emergencyFormData.transferDetails}
                          onChange={(e) => setEmergencyFormData({ ...emergencyFormData, transferDetails: e.target.value })}
                          rows={2}
                          className="dialog-textarea-standard"
                        />
                      </div>
                    </>
                  )}

                  {submitError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {submitError}
                    </div>
                  )}

                  {submitSuccess && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      Emergency admission created successfully!
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setPatientSearchTerm('');
                        setDoctorSearchTerm('');
                        setSelectedPatientId('');
                        setPatientError('');
                        setPatientHighlightIndex(-1);
                        setShowPatientDropdown(false);
                        setEmergencyFormData({
                          doctorId: '',
                          patientId: '',
                          emergencyBedId: '',
                          emergencyAdmissionDate: (() => {
                            const today = new Date();
                            const day = String(today.getDate()).padStart(2, '0');
                            const month = String(today.getMonth() + 1).padStart(2, '0');
                            const year = today.getFullYear();
                            return `${day}-${month}-${year}`;
                          })(),
                          emergencyStatus: 'Admitted' as EmergencyAdmission['emergencyStatus'],
                          numberOfDays: null,
                          diagnosis: '',
                          treatmentDetails: '',
                          patientCondition: 'Stable' as EmergencyAdmission['patientCondition'],
                          priority: 'Medium',
                          transferToIPDOTICU: false,
                          transferTo: undefined,
                          transferDetails: '',
                          status: 'Active' as EmergencyAdmission['status'],
                        });
                      }} 
                      className="dialog-footer-button"
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-red-600 hover:bg-red-700 dialog-footer-button" 
                      disabled={isSubmitting}
                      onClick={async () => {
                        // Validation
                        if (!emergencyFormData.doctorId) {
                          setSubmitError('Please select a doctor');
                          return;
                        }
                        if (!emergencyFormData.patientId) {
                          setPatientError('Please select a patient from the search results');
                          setSubmitError('Please select a patient');
                          return;
                        }
                        if (!emergencyFormData.emergencyBedId) {
                          setSubmitError('Please select an emergency bed');
                          return;
                        }
                        // Validate date/time is selected
                        if (!addEmergencyAdmissionDateTime) {
                          setSubmitError('Please select emergency admission date and time');
                          return;
                        }

                        setIsSubmitting(true);
                        setSubmitError(null);
                        setSubmitSuccess(false);
                        setPatientError('');

                        try {
                          // Map transferToIPDOTICU checkbox to individual transfer fields
                          const transferToIPD = emergencyFormData.transferToIPDOTICU && emergencyFormData.transferTo === 'IPD' ? 'Yes' : 'No';
                          const transferToOT = emergencyFormData.transferToIPDOTICU && emergencyFormData.transferTo === 'OT' ? 'Yes' : 'No';
                          const transferToICU = emergencyFormData.transferToIPDOTICU && emergencyFormData.transferTo === 'ICU' ? 'Yes' : 'No';

                          // If patient is being transferred, automatically set emergencyStatus to 'Movedout'
                          // This marks the bed as unoccupied while keeping the record
                          const finalEmergencyStatus = (emergencyFormData.transferToIPDOTICU && emergencyFormData.transferTo) 
                            ? 'Movedout' 
                            : emergencyFormData.emergencyStatus;

                          // Format date/time as dd-mm-yyyy hh:mm AM/PM for API
                          const day = String(addEmergencyAdmissionDateTime.getDate()).padStart(2, '0');
                          const month = String(addEmergencyAdmissionDateTime.getMonth() + 1).padStart(2, '0');
                          const year = addEmergencyAdmissionDateTime.getFullYear();
                          const hours = addEmergencyAdmissionDateTime.getHours();
                          const minutes = String(addEmergencyAdmissionDateTime.getMinutes()).padStart(2, '0');
                          const ampm = hours >= 12 ? 'PM' : 'AM';
                          const hours12 = hours % 12 || 12;
                          const hoursStr = String(hours12).padStart(2, '0');
                          const apiDateTime = `${day}-${month}-${year} ${hoursStr}:${minutes} ${ampm}`;

                          // Prepare the DTO
                          const createDto: CreateEmergencyAdmissionDto = {
                            doctorId: parseInt(emergencyFormData.doctorId),
                            patientId: emergencyFormData.patientId,
                            emergencyBedId: parseInt(emergencyFormData.emergencyBedId),
                            emergencyAdmissionDate: apiDateTime,
                            emergencyStatus: finalEmergencyStatus,
                            numberOfDays: emergencyFormData.numberOfDays || null,
                            diagnosis: emergencyFormData.diagnosis || null,
                            treatmentDetails: emergencyFormData.treatmentDetails || null,
                            patientCondition: emergencyFormData.patientCondition,
                            priority: emergencyFormData.priority || null,
                            transferToIPD: transferToIPD as 'Yes' | 'No',
                            transferToOT: transferToOT as 'Yes' | 'No',
                            transferToICU: transferToICU as 'Yes' | 'No',
                            transferTo: emergencyFormData.transferTo || null,
                            transferDetails: emergencyFormData.transferDetails || null,
                            status: emergencyFormData.status,
                          };

                          // Call the API
                          const admission = await emergencyAdmissionsApi.create(createDto);
                          
                          // BACKEND TODO: When creating an emergency admission, the backend should:
                          // - Mark the emergency bed (emergencyBedId) as 'occupied'
                          // - Update bed status based on the admission status
                          
                          // Refresh emergency admissions and beds to reflect updated status
                          const updatedAdmissions = await emergencyAdmissionsApi.getAll();
                          setEmergencyAdmissions(updatedAdmissions);
                          await fetchEmergencyBeds();
                          
                          setSubmitSuccess(true);
                          
                          // Reset form and close dialog after a short delay
                          setTimeout(() => {
                            setIsAddDialogOpen(false);
                            setPatientSearchTerm('');
                            setDoctorSearchTerm('');
                            setSelectedPatientId('');
                            setPatientError('');
                            setPatientHighlightIndex(-1);
                            setShowPatientDropdown(false);
                            setSubmitError(null);
                            setSubmitSuccess(false);
                            setEmergencyFormData({
                              doctorId: '',
                              patientId: '',
                            emergencyBedId: '',
                            emergencyAdmissionDate: getCurrentDateIST(),
                            emergencyStatus: 'Admitted' as EmergencyAdmission['emergencyStatus'],
                            numberOfDays: null,
                            diagnosis: '',
                              treatmentDetails: '',
                              patientCondition: 'Stable' as EmergencyAdmission['patientCondition'],
                              priority: 'Medium',
                              transferToIPDOTICU: false,
                              transferTo: undefined,
                              transferDetails: '',
                              status: 'Active' as EmergencyAdmission['status'],
                            });
                            setAddEmergencyAdmissionDateTime(null);
                          }, 1500);
                        } catch (error) {
                          console.error('Error creating emergency admission:', error);
                          setSubmitError(error instanceof Error ? error.message : 'Failed to create emergency admission. Please try again.');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Emergency Admission'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CustomResizableDialog>
      </div>
      

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Patients</p>
              <Badge>{totalActiveAdmissions || patients.length}</Badge>
            </div>
            <h3 className="text-gray-900">{totalActiveAdmissions || patients.length}</h3>
            <p className="text-xs text-gray-500">Currently in ER</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Critical Priority</p>
              <div className="size-3 bg-red-600 rounded-full" />
            </div>
            <h3 className="text-red-900">{criticalPriorityAdmissions}</h3>
            <p className="text-xs text-red-600">Immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">High Priority</p>
              <div className="size-3 bg-orange-500 rounded-full" />
            </div>
            <h3 className="text-orange-900">{highPriorityAdmissions}</h3>
            <p className="text-xs text-orange-600">Urgent care needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Medium Priority</p>
              <div className="size-3 bg-yellow-600 rounded-full" />
            </div>
            <h3 className="text-yellow-900">{mediumPriorityAdmissions}</h3>
            <p className="text-xs text-yellow-600">Standard care</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Low Priority</p>
              <div className="size-3 bg-green-600 rounded-full" />
            </div>
            <h3 className="text-green-900">{lowPriorityAdmissions}</h3>
            <p className="text-xs text-green-600">Routine care</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* ER Bed Layout */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Emergency Room Bed Status</CardTitle>
          </CardHeader>
          <CardContent>
            {occupiedBedsList.length === 0 && unoccupiedBedsList.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                No emergency beds available.
              </div>
            ) : (
              <>
                {/* Occupied Beds - Always Visible */}
                {occupiedBedsList.length > 0 && (
                  <div className="mb-4">
                    <div className="grid grid-cols-5 gap-3">
                      {occupiedBedsList.map((bed) => {
                        // Find admission for this bed - try strict match first, then fallback to any match by bed ID
                        let admission = emergencyAdmissions.find(a => 
                          a.emergencyBedId === bed.id && 
                          a.emergencyStatus === 'Admitted' &&
                          a.status === 'Active' &&
                          !(a.transferToIPDOTICU && a.transferTo)
                        );
                        
                        // Fallback: if strict match fails, try to find any active admission for this bed
                        if (!admission) {
                          admission = emergencyAdmissions.find(a => 
                            a.emergencyBedId === bed.id && 
                            a.status === 'Active'
                          );
                        }
                        
                        const priority = admission?.priority || 'Medium';
                        const patientName = admission?.patientName || '';
                        
                        // Get priority-based colors
                        const getPriorityColors = (priority: string) => {
                          switch (priority) {
                            case 'Critical':
                              return {
                                border: 'border-red-300',
                                bg: 'bg-red-50',
                                hover: 'hover:border-red-400',
                                dot: 'bg-red-600'
                              };
                            case 'High':
                              return {
                                border: 'border-orange-300',
                                bg: 'bg-orange-50',
                                hover: 'hover:border-orange-400',
                                dot: 'bg-orange-600'
                              };
                            case 'Medium':
                              return {
                                border: 'border-yellow-300',
                                bg: 'bg-yellow-50',
                                hover: 'hover:border-yellow-400',
                                dot: 'bg-yellow-600'
                              };
                            case 'Low':
                              return {
                                border: 'border-green-300',
                                bg: 'bg-green-50',
                                hover: 'hover:border-green-400',
                                dot: 'bg-green-600'
                              };
                            default:
                              return {
                                border: 'border-gray-200',
                                bg: 'bg-gray-50',
                                hover: 'hover:border-gray-300',
                                dot: 'bg-gray-300'
                              };
                          }
                        };
                        
                        const colors = getPriorityColors(priority);
                        
                        return (
                          <button
                            key={bed.id}
                            onClick={() => {
                              if (admission) {
                                handleEditAdmission(admission);
                              } else {
                                // If no admission found but bed is occupied, show a message
                                console.warn(`No admission found for bed ${bed.emergencyBedNo} (ID: ${bed.id})`);
                                alert(`No active admission found for bed ${bed.emergencyBedNo}. The bed may be marked as occupied but has no associated admission record.`);
                              }
                            }}
                            className={`p-4 border-2 rounded-lg text-center transition-all ${colors.border} ${colors.bg} ${colors.hover} ${!admission ? 'opacity-75' : ''}`}
                          >
                            <p className="text-sm text-gray-900 mb-1">{bed.emergencyBedNo}</p>
                            <div className="flex items-center justify-center gap-1">
                              <span className={`size-2 rounded-full ${colors.dot}`} />
                            </div>
                            {patientName && (
                              <p className="text-xs text-gray-600 mt-1 truncate">{patientName}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{priority} Priority</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Unoccupied Beds - Collapsible */}
                {unoccupiedBedsList.length > 0 && (
                  <div>
                    <button
                      onClick={() => setIsUnoccupiedBedsExpanded(!isUnoccupiedBedsExpanded)}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 hover:text-gray-900"
                    >
                      {isUnoccupiedBedsExpanded ? (
                        <>
                          <ChevronUp className="size-4" />
                          Hide Unoccupied ({unoccupiedBedsList.length})
                        </>
                      ) : (
                        <>
                          <Plus className="size-4" />
                          Show Unoccupied ({unoccupiedBedsList.length})
                        </>
                      )}
                    </button>
                    {isUnoccupiedBedsExpanded && (
                      <div className="grid grid-cols-5 gap-3">
                        {unoccupiedBedsList.map((bed) => {
                          const colors = {
                            border: 'border-gray-200',
                            bg: 'bg-gray-50',
                            hover: 'hover:border-gray-300',
                            dot: 'bg-gray-300'
                          };
                          
                          return (
                            <button
                              key={bed.id}
                              className={`p-4 border-2 rounded-lg text-center transition-all ${colors.border} ${colors.bg} ${colors.hover}`}
                            >
                              <p className="text-sm text-gray-900 mb-1">{bed.emergencyBedNo}</p>
                              <div className="flex items-center justify-center gap-1">
                                <span className={`size-2 rounded-full ${colors.dot}`} />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Available</p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <div className="mt-6 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-red-600" />
                <span className="text-gray-600">Critical</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-orange-500" />
                <span className="text-gray-600">High</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-yellow-600" />
                <span className="text-gray-600">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-green-600" />
                <span className="text-gray-600">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-gray-300" />
                <span className="text-gray-600">Available</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-orange-600" />
              Priority Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedAdmissions
                .filter(a => a.status === 'Active' && 
                  a.emergencyStatus === 'Admitted')
                .sort((a, b) => {
                  const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
                  const priorityA = (a.priority || 'Medium') as keyof typeof priorityOrder;
                  const priorityB = (b.priority || 'Medium') as keyof typeof priorityOrder;
                  return (priorityOrder[priorityA] ?? 2) - (priorityOrder[priorityB] ?? 2);
                })
                .map((admission, index) => {
                  const priority = admission.priority || 'Medium';
                  const getPriorityColor = (p: string) => {
                    switch (p) {
                      case 'Critical': return { border: 'border-red-300', bg: 'bg-red-50', dot: 'bg-red-600' };
                      case 'High': return { border: 'border-orange-300', bg: 'bg-orange-50', dot: 'bg-orange-500' };
                      case 'Medium': return { border: 'border-yellow-300', bg: 'bg-yellow-50', dot: 'bg-yellow-600' };
                      case 'Low': return { border: 'border-green-300', bg: 'bg-green-50', dot: 'bg-green-600' };
                      default: return { border: 'border-gray-300', bg: 'bg-gray-50', dot: 'bg-gray-600' };
                    }
                  };
                  const colors = getPriorityColor(priority);
                  return (
                    <div
                      key={admission.emergencyAdmissionId}
                      onClick={() => handleEditAdmission(admission)}
                      className={`p-3 border-2 rounded-lg cursor-pointer hover:shadow-md transition-shadow ${colors.border} ${colors.bg}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">#{index + 1}</span>
                        <div className={`size-2 rounded-full ${colors.dot}`} />
                        <Badge variant="outline" className="text-xs">{admission.emergencyBedNo || getBedNumber(admission) || '-'}</Badge>
                      </div>
                      <p className="text-sm text-gray-900 mb-1">{getPatientName(admission)}</p>
                      <p className="text-xs text-gray-600">{admission.diagnosis || admission.treatmentDetails || 'No diagnosis'}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <Clock className="size-3" />
                        <span>{getRoomId(admission)}</span>
                      </div>
                    </div>
                  );
                })}
              {sortedAdmissions.filter(a => a.status === 'Active' && 
                a.emergencyStatus === 'Admitted').length === 0 && (
                <div className="text-center py-8 text-sm text-gray-500">
                  No active emergency admissions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Emergency Admission Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <ResizableDialogContent className="p-0 gap-0 large-dialog dialog-content-standard">
          <div className="dialog-scrollable-wrapper dialog-content-scrollable">
            <DialogHeader className="dialog-header-standard">
              <DialogTitle className="dialog-title-standard">
                {isFetchingAdmission ? 'Loading Admission Details...' : 'Edit Emergency Admission'}
              </DialogTitle>
              {isFetchingAdmission && (
                <div className="mt-2 text-sm text-gray-500">
                  Fetching admission details from server...
                </div>
              )}
            </DialogHeader>
            <div className="dialog-body-content-wrapper">
              {isFetchingAdmission ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-4 text-sm text-gray-600">Loading admission details...</p>
                  </div>
                </div>
              ) : (
              <Tabs defaultValue="admission" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="admission">Admission Details</TabsTrigger>
                  <TabsTrigger value="vitals">Vitals</TabsTrigger>
                </TabsList>
                
                <TabsContent value="admission" className="space-y-4">
              <div className="dialog-form-container space-y-4">
                <div className="dialog-form-field">
                  <Label htmlFor="edit-doctor-search" className="dialog-label-standard">Doctor *</Label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="edit-doctor-search"
                      placeholder="Search by Doctor Name or Specialty..."
                      value={editDoctorSearchTerm}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setEditDoctorSearchTerm(newValue);
                        // Clear doctor selection when user edits the search term to allow re-selection
                        if (editFormData.doctorId) {
                          setEditFormData({ ...editFormData, doctorId: '' });
                        }
                      }}
                      className="dialog-input-standard pl-10"
                    />
                  </div>
                  {editDoctorSearchTerm && !editFormData.doctorId && (
                    <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(doctors || [])
                            .filter(doctor => {
                              if (!editDoctorSearchTerm) return false;
                              if (!doctor || !doctor.name || !doctor.role) return false;
                              const searchLower = editDoctorSearchTerm.toLowerCase();
                              return (
                                doctor.name.toLowerCase().includes(searchLower) ||
                                doctor.role.toLowerCase().includes(searchLower)
                              );
                            })
                            .filter(doctor => doctor && doctor.id)
                            .map(doctor => {
                              const doctorIdStr = doctor.id.toString();
                              const isSelected = editFormData.doctorId === doctorIdStr;
                              return (
                                <tr
                                  key={doctor.id}
                                  onClick={() => {
                                    setEditFormData({ ...editFormData, doctorId: doctorIdStr });
                                    setEditDoctorSearchTerm(`${doctor.name} - ${doctor.role}`);
                                  }}
                                  className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-gray-100' : ''}`}
                                >
                                  <td className="py-2 px-3 text-sm text-gray-900">{doctor.name}</td>
                                  <td className="py-2 px-3 text-sm text-gray-600">{doctor.role}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                      {doctors.filter(doctor => {
                        if (!editDoctorSearchTerm) return false;
                        const searchLower = editDoctorSearchTerm.toLowerCase();
                        return (
                          doctor.name.toLowerCase().includes(searchLower) ||
                          doctor.role.toLowerCase().includes(searchLower)
                        );
                      }).length === 0 && !editFormData.doctorId && (
                        <div className="text-center py-8 text-sm text-gray-700">
                          No doctors found. Try a different search term.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="dialog-form-field">
                  <Label htmlFor="edit-emergency-patient-search" className="dialog-label-standard">Patient *</Label>
                  <div className="relative mb-2" ref={editPatientInputRef}>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 z-10" />
                    <Input
                      id="edit-emergency-patient-search"
                      autoComplete="off"
                      placeholder="Search patient by name, ID, phone, or patient number..."
                      value={editPatientSearchTerm}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setEditPatientSearchTerm(newValue);
                        setEditPatientHighlightIndex(-1);
                        // Clear patient selection when user edits the search term
                        if (editFormData.patientId) {
                          setEditFormData({ ...editFormData, patientId: '' });
                          setEditSelectedPatientId('');
                        }
                        // Clear error when user starts typing
                        if (editPatientError) {
                          setEditPatientError('');
                        }
                      }}
                      className="dialog-input-standard pl-10"
                    />
                  </div>
                  {editPatientSearchTerm && !editFormData.patientId && (
                    <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                      <table className="w-full">
                        <tbody>
                          {availablePatients
                            .filter((patient: any) => {
                              if (!editPatientSearchTerm) return false;
                              const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                              const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                              const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                              const lastName = (patient as any).lastName || (patient as any).LastName || '';
                              const fullName = `${patientName} ${lastName}`.trim();
                              const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                              const searchLower = editPatientSearchTerm.toLowerCase();
                              return (
                                patientId.toLowerCase().includes(searchLower) ||
                                patientNo.toLowerCase().includes(searchLower) ||
                                fullName.toLowerCase().includes(searchLower) ||
                                phoneNo.includes(editPatientSearchTerm)
                              );
                            })
                            .map((patient: any) => {
                              const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                              const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                              const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                              const lastName = (patient as any).lastName || (patient as any).LastName || '';
                              const fullName = `${patientName} ${lastName}`.trim();
                              const isSelected = editFormData.patientId === patientId;
                              return (
                                <tr
                                  key={patientId}
                                  onClick={() => {
                                    setEditFormData({ ...editFormData, patientId });
                                    setEditSelectedPatientId(patientId);
                                    // Set patient name in search box similar to doctor search
                                    const displayName = patientNo ? `${patientNo} - ${fullName}` : fullName;
                                    setEditPatientSearchTerm(displayName || 'Unknown');
                                  }}
                                  className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-gray-100' : ''}`}
                                >
                                  <td className="py-2 px-3 text-sm text-gray-900">
                                    {patientNo ? `${patientNo} - ` : ''}{fullName || 'Unknown'}
                                  </td>
                                  <td className="py-2 px-3 text-sm text-gray-600 font-mono text-xs">
                                    ID: {patientId.substring(0, 8)}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                      {availablePatients.filter((patient: any) => {
                        if (!editPatientSearchTerm) return false;
                        const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                        const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                        const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                        const lastName = (patient as any).lastName || (patient as any).LastName || '';
                        const fullName = `${patientName} ${lastName}`.trim();
                        const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                        const searchLower = editPatientSearchTerm.toLowerCase();
                        return (
                          patientId.toLowerCase().includes(searchLower) ||
                          patientNo.toLowerCase().includes(searchLower) ||
                          fullName.toLowerCase().includes(searchLower) ||
                          phoneNo.includes(editPatientSearchTerm)
                        );
                      }).length === 0 && (
                        <div className="text-center py-8 text-sm text-gray-700">
                          No patients found. Try a different search term.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="dialog-form-field">
                  <Label htmlFor="edit-emergencyBedId" className="dialog-label-standard">Emergency Bed *</Label>
                  <select
                    id="edit-emergencyBedId"
                    aria-label="Emergency Bed"
                    className="dialog-select-standard"
                    value={editFormData.emergencyBedId}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyBedId: e.target.value })}
                  >
                    <option value="">Select Emergency Bed *</option>
                    {emergencyBeds
                      .filter(bed => bed.status === 'active')
                      .map(bed => {
                        // Check against the original admission's bed ID from backend, not the form's current state
                        const originalBedId = selectedAdmissionForEdit?.emergencyBedId;
                        const isCurrentlyAssigned = originalBedId && bed.id === originalBedId;
                        return (
                          <option key={bed.id} value={bed.id.toString()}>
                            {bed.emergencyBedNo} {bed.emergencyRoomNameNo ? `(${bed.emergencyRoomNameNo})` : ''}{isCurrentlyAssigned ? ' (currently assigned)' : ''}
                          </option>
                        );
                      })}
                    {/* Include inactive beds if the current selection is inactive */}
                    {selectedAdmissionForEdit?.emergencyBedId && !emergencyBeds.some(bed => bed.id === selectedAdmissionForEdit.emergencyBedId && bed.status === 'active') && (
                      emergencyBeds
                        .filter(bed => bed.id === selectedAdmissionForEdit.emergencyBedId && bed.status !== 'active')
                        .map(bed => (
                          <option key={bed.id} value={bed.id.toString()}>
                            {bed.emergencyBedNo} {bed.emergencyRoomNameNo ? `(${bed.emergencyRoomNameNo})` : ''} (currently assigned)
                          </option>
                        ))
                    )}
                  </select>
                  {editFormData.emergencyBedId && !emergencyBeds.some(bed => bed.id.toString() === editFormData.emergencyBedId) && (
                    <p className="mt-1 text-xs text-amber-600">
                      Note: Selected bed may not be in the current beds list
                    </p>
                  )}
                </div>

                <div className="dialog-form-field">
                  <Label htmlFor="edit-emergencyAdmissionDateTime" className="dialog-label-standard">Emergency Admission Date & Time *</Label>
                  <DatePicker
                    id="edit-emergencyAdmissionDateTime"
                    selected={editEmergencyAdmissionDateTime}
                    onChange={(date: Date | null) => {
                      setEditEmergencyAdmissionDateTime(date);
                      if (date) {
                        // Also store in DD-MM-YYYY format for display compatibility
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        const hours = date.getHours();
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        const hours12 = hours % 12 || 12;
                        const hoursStr = String(hours12).padStart(2, '0');
                        const displayDate = `${day}-${month}-${year}`;
                        setEditFormData({ ...editFormData, emergencyAdmissionDate: displayDate });
                        setEditEmergencyAdmissionDateTimeDisplay(`${day}-${month}-${year}, ${hoursStr}:${minutes} ${ampm}`);
                      } else {
                        setEditEmergencyAdmissionDateTime(null);
                        setEditEmergencyAdmissionDateTimeDisplay('');
                        setEditFormData({ ...editFormData, emergencyAdmissionDate: '' });
                      }
                    }}
                    showTimeSelect
                    timeIntervals={1}
                    timeCaption="Time"
                    timeFormat="hh:mm aa"
                    dateFormat="dd-MM-yyyy hh:mm aa"
                    placeholderText="dd-mm-yyyy hh:mm AM/PM"
                    className="dialog-input-standard w-full"
                    wrapperClassName="w-full"
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown
                    isClearable
                  />
                  <p className="text-xs text-gray-500 mt-1">Select date and time for emergency admission</p>
                </div>

                <div className="dialog-form-field">
                  <Label htmlFor="edit-numberOfDays" className="dialog-label-standard">Number of Days</Label>
                  <Input
                    id="edit-numberOfDays"
                    type="number"
                    placeholder="Enter number of days"
                    value={editFormData.numberOfDays || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, numberOfDays: e.target.value ? parseInt(e.target.value) : null })}
                    className="dialog-input-standard"
                    min="0"
                  />
                </div>

                <div className="dialog-form-field">
                  <Label htmlFor="edit-emergencyStatus" className="dialog-label-standard">Emergency Status</Label>
                  <select
                    id="edit-emergencyStatus"
                    aria-label="Emergency Status"
                    className="dialog-select-standard"
                    value={editFormData.emergencyStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyStatus: e.target.value as EmergencyAdmission['emergencyStatus'] })}
                  >
                    <option value="Admitted">Admitted</option>
                    <option value="Discharged">Discharged</option>
                    <option value="Movedout">Movedout</option>
                  </select>
                </div>

                <div className="dialog-form-field">
                  <Label htmlFor="edit-diagnosis" className="dialog-label-standard">Diagnosis</Label>
                  <Textarea
                    id="edit-diagnosis"
                    placeholder="Enter diagnosis..."
                    value={editFormData.diagnosis}
                    onChange={(e) => setEditFormData({ ...editFormData, diagnosis: e.target.value })}
                    rows={3}
                    className="dialog-textarea-standard"
                  />
                </div>

                <div className="dialog-form-field">
                  <Label htmlFor="edit-treatmentDetails" className="dialog-label-standard">Treatment Details</Label>
                  <Textarea
                    id="edit-treatmentDetails"
                    placeholder="Enter treatment details..."
                    value={editFormData.treatmentDetails}
                    onChange={(e) => setEditFormData({ ...editFormData, treatmentDetails: e.target.value })}
                    rows={3}
                    className="dialog-textarea-standard"
                  />
                </div>

                <div className="dialog-form-field">
                  <Label htmlFor="edit-patientCondition" className="dialog-label-standard">Patient Condition</Label>
                  <select
                    id="edit-patientCondition"
                    aria-label="Patient Condition"
                    className="dialog-select-standard"
                    value={editFormData.patientCondition}
                    onChange={(e) => setEditFormData({ ...editFormData, patientCondition: e.target.value as EmergencyAdmission['patientCondition'] })}
                  >
                    <option value="Stable">Stable</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="dialog-form-field">
                  <Label htmlFor="edit-priority" className="dialog-label-standard">Priority</Label>
                  <select
                    id="edit-priority"
                    aria-label="Priority"
                    className="dialog-select-standard"
                    value={editFormData.priority}
                    onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="dialog-form-field">
                  <div className="dialog-checkbox-container">
                    <input
                      type="checkbox"
                      id="edit-transferToIPDOTICU"
                      aria-label="Transfer To IPD/OT/ICU"
                      checked={editFormData.transferToIPDOTICU}
                      onChange={(e) => setEditFormData({ ...editFormData, transferToIPDOTICU: e.target.checked, transferTo: e.target.checked ? editFormData.transferTo : undefined })}
                      className="rounded"
                    />
                    <Label htmlFor="edit-transferToIPDOTICU" className="dialog-label-standard cursor-pointer">Transfer To IPD/OT/ICU</Label>
                  </div>
                </div>

                {editFormData.transferToIPDOTICU && (
                  <>
                    <div className="dialog-form-field">
                      <Label htmlFor="edit-transferTo" className="dialog-label-standard">Transfer To *</Label>
                      <select
                        id="edit-transferTo"
                        aria-label="Transfer To"
                        className="dialog-select-standard"
                        value={editFormData.transferTo || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, transferTo: e.target.value as 'IPD' | 'ICU' | 'OT' })}
                      >
                        <option value="">Select Transfer Destination</option>
                        <option value="IPD">IPD</option>
                        <option value="ICU">ICU</option>
                        <option value="OT">OT</option>
                      </select>
                    </div>
                    <div className="dialog-form-field">
                      <Label htmlFor="edit-transferDetails" className="dialog-label-standard">Transfer Details</Label>
                      <Textarea
                        id="edit-transferDetails"
                        placeholder="Enter transfer details..."
                        value={editFormData.transferDetails}
                        onChange={(e) => setEditFormData({ ...editFormData, transferDetails: e.target.value })}
                        rows={2}
                        className="dialog-textarea-standard"
                      />
                    </div>
                  </>
                )}

                {/* Latest Vitals Record Display */}
                {(() => {
                  const latestVital = vitals.length > 0 
                    ? [...vitals].sort((a, b) => new Date(b.recordedDateTime).getTime() - new Date(a.recordedDateTime).getTime())[0]
                    : null;
                  
                  if (!latestVital) return null;
                  
                  return (
                    <div className="dialog-form-field">
                      <Label className="dialog-label-standard">Latest Vitals Record</Label>
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={latestVital.vitalsStatus === 'Critical' ? 'destructive' : 'default'}>
                              {latestVital.vitalsStatus}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {formatDateTimeIST(latestVital.recordedDateTime)}
                            </span>
                            {latestVital.nurseName && (
                              <span className="text-sm text-gray-500">by {latestVital.nurseName}</span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          {latestVital.heartRate !== undefined && (
                            <div className="p-2 bg-white rounded">
                              <span className="text-gray-600 font-medium">HR:</span> <span className="text-gray-900">{latestVital.heartRate} bpm</span>
                            </div>
                          )}
                          {latestVital.bloodPressure && (
                            <div className="p-2 bg-white rounded">
                              <span className="text-gray-600 font-medium">BP:</span> <span className="text-gray-900">{latestVital.bloodPressure}</span>
                            </div>
                          )}
                          {latestVital.temperature !== undefined && (
                            <div className="p-2 bg-white rounded">
                              <span className="text-gray-600 font-medium">Temp:</span> <span className="text-gray-900">{latestVital.temperature}°C</span>
                            </div>
                          )}
                          {latestVital.o2Saturation !== undefined && (
                            <div className="p-2 bg-white rounded">
                              <span className="text-gray-600 font-medium">O2 Sat:</span> <span className="text-gray-900">{latestVital.o2Saturation}%</span>
                            </div>
                          )}
                          {latestVital.respiratoryRate !== undefined && (
                            <div className="p-2 bg-white rounded">
                              <span className="text-gray-600 font-medium">RR:</span> <span className="text-gray-900">{latestVital.respiratoryRate}</span>
                            </div>
                          )}
                          {latestVital.pulseRate !== undefined && (
                            <div className="p-2 bg-white rounded">
                              <span className="text-gray-600 font-medium">Pulse:</span> <span className="text-gray-900">{latestVital.pulseRate} bpm</span>
                            </div>
                          )}
                        </div>
                        {latestVital.vitalsRemarks && (
                          <div className="text-sm text-gray-600 pt-2 border-t border-gray-200">
                            <span className="font-medium">Remarks:</span> {latestVital.vitalsRemarks}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="dialog-form-field">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="edit-status" className="dialog-label-standard">Status</Label>
                    <div className="flex-shrink-0 relative" style={{ zIndex: 1 }}>
                      <Switch
                        id="edit-status"
                        checked={editFormData.status === 'Active'}
                        onCheckedChange={(checked) => {
                          setEditFormData({ ...editFormData, status: checked ? 'Active' : 'Inactive' });
                        }}
                        className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 [&_[data-slot=switch-thumb]]:!bg-white [&_[data-slot=switch-thumb]]:!border [&_[data-slot=switch-thumb]]:!border-gray-400 [&_[data-slot=switch-thumb]]:!shadow-sm"
                        style={{
                          width: '2.5rem',
                          height: '1.5rem',
                          minWidth: '2.5rem',
                          minHeight: '1.5rem',
                          display: 'inline-flex',
                          position: 'relative',
                          backgroundColor: editFormData.status === 'Active' ? '#2563eb' : '#d1d5db',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {updateError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {updateError}
                  </div>
                )}

                {updateSuccess && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    Emergency admission updated successfully!
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditPatientSearchTerm('');
                      setEditDoctorSearchTerm('');
                      setEditSelectedPatientId('');
                      setEditPatientError('');
                      setEditPatientHighlightIndex(-1);
                      setEditEmergencyAdmissionDateTime(null);
                      setEditEmergencyAdmissionDateTimeDisplay('');
                      setShowEditPatientDropdown(false);
                      setSelectedAdmissionForEdit(null);
                    }} 
                    className="dialog-footer-button"
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-red-600 hover:bg-red-700 dialog-footer-button" 
                    disabled={isUpdating}
                    onClick={async () => {
                      // Validation
                      if (!editFormData.doctorId) {
                        setUpdateError('Please select a doctor');
                        return;
                      }
                      if (!editFormData.emergencyBedId) {
                        setUpdateError('Please select an emergency bed');
                        return;
                      }
                      // Validate datetime
                      if (!editEmergencyAdmissionDateTime) {
                        setUpdateError('Please select emergency admission date and time');
                        return;
                      }

                      setIsUpdating(true);
                      setUpdateError(null);
                      setUpdateSuccess(false);

                      try {
                        // Map transferToIPDOTICU checkbox to individual transfer fields
                        const transferToIPD = editFormData.transferToIPDOTICU && editFormData.transferTo === 'IPD' ? 'Yes' : 'No';
                        const transferToOT = editFormData.transferToIPDOTICU && editFormData.transferTo === 'OT' ? 'Yes' : 'No';
                        const transferToICU = editFormData.transferToIPDOTICU && editFormData.transferTo === 'ICU' ? 'Yes' : 'No';

                        // If patient is being transferred, automatically set emergencyStatus to 'Movedout'
                        // This marks the bed as unoccupied while keeping the record
                        const finalEmergencyStatus = (editFormData.transferToIPDOTICU && editFormData.transferTo) 
                          ? 'Movedout' 
                          : editFormData.emergencyStatus;

                        // Format date/time as dd-mm-yyyy hh:mm AM/PM for API
                        const day = String(editEmergencyAdmissionDateTime.getDate()).padStart(2, '0');
                        const month = String(editEmergencyAdmissionDateTime.getMonth() + 1).padStart(2, '0');
                        const year = editEmergencyAdmissionDateTime.getFullYear();
                        const hours = editEmergencyAdmissionDateTime.getHours();
                        const minutes = String(editEmergencyAdmissionDateTime.getMinutes()).padStart(2, '0');
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        const hours12 = hours % 12 || 12;
                        const hoursStr = String(hours12).padStart(2, '0');
                        const apiDateTime = `${day}-${month}-${year} ${hoursStr}:${minutes} ${ampm}`;

                        // Prepare the DTO
                        const updateDto: UpdateEmergencyAdmissionDto = {
                          id: editFormData.id,
                          doctorId: parseInt(editFormData.doctorId),
                          emergencyBedId: parseInt(editFormData.emergencyBedId),
                          emergencyAdmissionDate: apiDateTime,
                          emergencyStatus: finalEmergencyStatus,
                          numberOfDays: editFormData.numberOfDays || null,
                          diagnosis: editFormData.diagnosis || null,
                          treatmentDetails: editFormData.treatmentDetails || null,
                          patientCondition: editFormData.patientCondition,
                          priority: editFormData.priority || null,
                          transferToIPD: transferToIPD as 'Yes' | 'No',
                          transferToOT: transferToOT as 'Yes' | 'No',
                          transferToICU: transferToICU as 'Yes' | 'No',
                          transferTo: editFormData.transferTo || null,
                          transferDetails: editFormData.transferDetails || null,
                          status: editFormData.status,
                        };

                        // DEBUG: Log all values being sent
                        console.log('=== EMERGENCY ADMISSION UPDATE DEBUG ===');
                        console.log('API Method: PUT');
                        console.log('API Endpoint: /emergency-admissions/' + editFormData.id);
                        console.log('Update DTO (Frontend):', JSON.stringify(updateDto, null, 2));
                        console.log('emergencyStatus value:', finalEmergencyStatus);
                        console.log('emergencyStatus type:', typeof finalEmergencyStatus);
                        console.log('transferToIPDOTICU:', editFormData.transferToIPDOTICU);
                        console.log('transferTo:', editFormData.transferTo);
                        console.log('Original emergencyStatus from form:', editFormData.emergencyStatus);
                        console.log('==========================================');

                        // Call the API
                        await emergencyAdmissionsApi.update(updateDto);
                        
                        // BACKEND TODO: When updating an emergency admission, the backend should handle bed status updates:
                        // 1. If the bed changed (previousBedId !== newBedId):
                        //    - Mark the old bed (previousBedId) as 'active' (unoccupied)
                        // 2. For the new/current bed (emergencyBedId):
                        //    - If transferToIPDOTICU is enabled AND transferTo is set (IPD/OT/ICU):
                        //      → Mark bed as 'active' (unoccupied) - patient is being transferred
                        //    - If emergencyStatus is 'Discharged', 'Movedout', 'IPD', 'OT', or 'ICU':
                        //      → Mark bed as 'active' (unoccupied) - patient is no longer in ER
                        //    - If emergencyStatus is 'Admitted' and transfer is NOT enabled:
                        //      → Mark bed as 'occupied' - patient is still in ER
                        // 3. Priority: Transfer status should take precedence over emergency status
                        
                        // Refresh emergency admissions and beds to reflect updated status
                        const updatedAdmissions = await emergencyAdmissionsApi.getAll();
                        setEmergencyAdmissions(updatedAdmissions);
                        await fetchEmergencyBeds();
                        
                        setUpdateSuccess(true);
                        
                        // Reset form and close dialog after a short delay
                        setTimeout(() => {
                          setIsEditDialogOpen(false);
                          setEditPatientSearchTerm('');
                          setEditDoctorSearchTerm('');
                          setEditSelectedPatientId('');
                          setEditPatientError('');
                          setEditPatientHighlightIndex(-1);
                          setEditEmergencyAdmissionDateTime(null);
                          setEditEmergencyAdmissionDateTimeDisplay('');
                          setShowEditPatientDropdown(false);
                          setSelectedAdmissionForEdit(null);
                          setUpdateError(null);
                          setUpdateSuccess(false);
                        }, 1500);
                      } catch (error) {
                        console.error('Error updating emergency admission:', error);
                        setUpdateError(error instanceof Error ? error.message : 'Failed to update emergency admission. Please try again.');
                      } finally {
                        setIsUpdating(false);
                      }
                    }}
                  >
                    {isUpdating ? 'Updating...' : 'Update Emergency Admission'}
                  </Button>
                </div>
              </div>
                </TabsContent>
                
                <TabsContent value="vitals" className="space-y-4 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Vitals Records</h3>
                    <Button 
                      onClick={() => {
                        if (selectedAdmissionForEdit) {
                          setVitalsFormData({
                            emergencyAdmissionId: selectedAdmissionForEdit.emergencyAdmissionId,
                            nurseId: 0,
                            recordedDateTime: '',
                            heartRate: undefined,
                            bloodPressure: '',
                            temperature: undefined,
                            o2Saturation: undefined,
                            respiratoryRate: undefined,
                            pulseRate: undefined,
                            vitalsStatus: 'Stable',
                            vitalsRemarks: '',
                            status: 'Active',
                          });
                          setAddVitalsRecordedDateTime(new Date());
                          setIsAddVitalsDialogOpen(true);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="size-4" />
                      Add Vitals
                    </Button>
                  </div>
                  
                  {vitalsLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading vitals...</div>
                  ) : vitals.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No vitals records found. Click "Add Vitals" to create one.</div>
                  ) : (
                    <div className="space-y-2">
                      {vitals.map((vital) => (
                        <Card key={vital.emergencyAdmissionVitalsId} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={vital.vitalsStatus === 'Critical' ? 'destructive' : 'default'}>
                                  {vital.vitalsStatus}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {formatISTTimestamp(vital.recordedDateTime)}
                                </span>
                                {vital.nurseName && (
                                  <span className="text-sm text-gray-500">by {vital.nurseName}</span>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                {vital.heartRate !== undefined && (
                                  <div><span className="text-gray-600">HR:</span> {vital.heartRate} bpm</div>
                                )}
                                {vital.bloodPressure && (
                                  <div><span className="text-gray-600">BP:</span> {vital.bloodPressure}</div>
                                )}
                                {vital.temperature !== undefined && (
                                  <div><span className="text-gray-600">Temp:</span> {vital.temperature}°C</div>
                                )}
                                {vital.o2Saturation !== undefined && (
                                  <div><span className="text-gray-600">O2 Sat:</span> {vital.o2Saturation}%</div>
                                )}
                                {vital.respiratoryRate !== undefined && (
                                  <div><span className="text-gray-600">RR:</span> {vital.respiratoryRate}</div>
                                )}
                                {vital.pulseRate !== undefined && (
                                  <div><span className="text-gray-600">Pulse:</span> {vital.pulseRate} bpm</div>
                                )}
                              </div>
                              {vital.vitalsRemarks && (
                                <div className="mt-2 text-sm text-gray-600">
                                  <span className="font-medium">Remarks:</span> {vital.vitalsRemarks}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedVitals(vital);
                                  
                                  // Parse recordedDateTime for DatePicker
                                  let parsedDate: Date | null = null;
                                  try {
                                    if (vital.recordedDateTime) {
                                      // Try to parse various date formats
                                      const dateStr = typeof vital.recordedDateTime === 'string' 
                                        ? vital.recordedDateTime 
                                        : vital.recordedDateTime.toString();
                                      
                                      // Handle YYYY-MM-DD HH:mm:ss format
                                      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateStr)) {
                                        const [datePart, timePart] = dateStr.split(' ');
                                        const [year, month, day] = datePart.split('-').map(Number);
                                        const [hours, minutes] = timePart.split(':').map(Number);
                                        parsedDate = new Date(year, month - 1, day, hours, minutes);
                                      }
                                      // Handle YYYY-MM-DDTHH:mm format
                                      else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateStr)) {
                                        parsedDate = new Date(dateStr);
                                      }
                                      // Handle DD-MM-YYYY HH:mm format
                                      else if (/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}/.test(dateStr)) {
                                        const [datePart, timePart] = dateStr.split(' ');
                                        const [day, month, year] = datePart.split('-').map(Number);
                                        const [hours, minutes] = timePart.split(':').map(Number);
                                        parsedDate = new Date(year, month - 1, day, hours, minutes);
                                      }
                                      // Fallback to Date constructor
                                      else {
                                        parsedDate = new Date(dateStr);
                                      }
                                      
                                      // Validate the date
                                      if (isNaN(parsedDate.getTime())) {
                                        parsedDate = new Date();
                                      }
                                    } else {
                                      parsedDate = new Date();
                                    }
                                  } catch {
                                    parsedDate = new Date();
                                  }
                                  
                                  setManageVitalsRecordedDateTime(parsedDate);
                                  
                                  // Format for API (YYYY-MM-DD HH:MM:SS)
                                  const formatForAPI = (date: Date): string => {
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const hours = String(date.getHours()).padStart(2, '0');
                                    const minutes = String(date.getMinutes()).padStart(2, '0');
                                    return `${year}-${month}-${day} ${hours}:${minutes}:00`;
                                  };
                                  
                                  setVitalsFormData({
                                    emergencyAdmissionId: vital.emergencyAdmissionId,
                                    nurseId: vital.nurseId,
                                    recordedDateTime: parsedDate ? formatForAPI(parsedDate) : '',
                                    heartRate: vital.heartRate,
                                    bloodPressure: vital.bloodPressure || '',
                                    temperature: vital.temperature,
                                    o2Saturation: vital.o2Saturation,
                                    respiratoryRate: vital.respiratoryRate,
                                    pulseRate: vital.pulseRate,
                                    vitalsStatus: vital.vitalsStatus,
                                    vitalsRemarks: vital.vitalsRemarks || '',
                                    status: vital.status || 'Active',
                                  });
                                  setIsManageVitalsDialogOpen(true);
                                }}
                              >
                                Manage
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              )}
            </div>
          </div>
        </ResizableDialogContent>
      </Dialog>

      {/* Add Vitals Dialog */}
      <Dialog open={isAddVitalsDialogOpen} onOpenChange={setIsAddVitalsDialogOpen}>
        <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]">
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
            <DialogTitle>Add Vitals Record</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="add-nurseId">Nurse *</Label>
                <select
                  id="add-nurseId"
                  aria-label="Nurse"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md"
                  value={vitalsFormData.nurseId}
                  onChange={(e) => setVitalsFormData({ ...vitalsFormData, nurseId: Number(e.target.value) })}
                >
                  <option value="0">Select Nurse</option>
                  {staff
                    .filter(s => {
                      if (!s || !s.RoleId) return false;
                      const role = roles.find(r => r && r.id === s.RoleId);
                      if (!role || !role.name) return false;
                      const roleNameLower = role.name.toLowerCase();
                      return roleNameLower.includes('nurse');
                    })
                    .map(nurse => {
                      const role = roles.find(r => r && r.id === nurse.RoleId);
                      return (
                        <option key={nurse.UserId} value={nurse.UserId}>
                          {nurse.UserName} - {role?.name || ''}
                        </option>
                      );
                    })}
                </select>
              </div>
              
              <div>
                <Label htmlFor="add-recordedDateTime">Recorded Date & Time *</Label>
                <DatePicker
                  id="add-recordedDateTime"
                  selected={addVitalsRecordedDateTime}
                  onChange={(date: Date | null) => {
                    setAddVitalsRecordedDateTime(date);
                    if (date) {
                      // Extract local date/time components without timezone conversion
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      const hours = String(date.getHours()).padStart(2, '0');
                      const minutes = String(date.getMinutes()).padStart(2, '0');
                      const seconds = '00';
                      // Format as YYYY-MM-DD HH:MM:SS for API (no timezone conversion)
                      const dateTimeStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                      setVitalsFormData({ ...vitalsFormData, recordedDateTime: dateTimeStr });
                    } else {
                      setVitalsFormData({ ...vitalsFormData, recordedDateTime: '' });
                    }
                  }}
                  showTimeSelect
                  timeIntervals={1}
                  timeCaption="Time"
                  timeFormat="hh:mm aa"
                  dateFormat="dd-MM-yyyy hh:mm aa"
                  placeholderText="dd-mm-yyyy hh:mm am/pm"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md"
                  wrapperClassName="w-full"
                  showYearDropdown
                  showMonthDropdown
                  dropdownMode="select"
                  yearDropdownItemNumber={100}
                  scrollableYearDropdown
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="add-heartRate">Heart Rate (bpm)</Label>
                  <Input
                    id="add-heartRate"
                    type="number"
                    placeholder="e.g., 72"
                    value={vitalsFormData.heartRate || ''}
                    onChange={(e) => setVitalsFormData({ ...vitalsFormData, heartRate: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="add-bloodPressure">Blood Pressure</Label>
                  <Input
                    id="add-bloodPressure"
                    placeholder="e.g., 120/80"
                    value={vitalsFormData.bloodPressure}
                    onChange={(e) => setVitalsFormData({ ...vitalsFormData, bloodPressure: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="add-temperature">Temperature (°C)</Label>
                  <Input
                    id="add-temperature"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 36.5"
                    value={vitalsFormData.temperature || ''}
                    onChange={(e) => setVitalsFormData({ ...vitalsFormData, temperature: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="add-o2Saturation">O2 Saturation (%)</Label>
                  <Input
                    id="add-o2Saturation"
                    type="number"
                    placeholder="e.g., 98"
                    value={vitalsFormData.o2Saturation || ''}
                    onChange={(e) => setVitalsFormData({ ...vitalsFormData, o2Saturation: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="add-respiratoryRate">Respiratory Rate</Label>
                  <Input
                    id="add-respiratoryRate"
                    type="number"
                    placeholder="e.g., 16"
                    value={vitalsFormData.respiratoryRate || ''}
                    onChange={(e) => setVitalsFormData({ ...vitalsFormData, respiratoryRate: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="add-pulseRate">Pulse Rate (bpm)</Label>
                  <Input
                    id="add-pulseRate"
                    type="number"
                    placeholder="e.g., 72"
                    value={vitalsFormData.pulseRate || ''}
                    onChange={(e) => setVitalsFormData({ ...vitalsFormData, pulseRate: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="add-vitalsStatus">Vitals Status *</Label>
                <select
                  id="add-vitalsStatus"
                  aria-label="Vitals Status"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md"
                  value={vitalsFormData.vitalsStatus}
                  onChange={(e) => setVitalsFormData({ ...vitalsFormData, vitalsStatus: e.target.value as 'Critical' | 'Stable' })}
                >
                  <option value="Stable">Stable</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <Label htmlFor="add-vitalsRemarks">Remarks</Label>
                <Textarea
                  id="add-vitalsRemarks"
                  placeholder="Enter any remarks or notes..."
                  value={vitalsFormData.vitalsRemarks}
                  onChange={(e) => setVitalsFormData({ ...vitalsFormData, vitalsRemarks: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-2 border-t bg-gray-50 flex-shrink-0">
            <Button variant="outline" onClick={() => setIsAddVitalsDialogOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!vitalsFormData.nurseId || !vitalsFormData.recordedDateTime) {
                alert('Please fill in all required fields (Nurse, Recorded Date & Time).');
                return;
              }
              try {
                if (selectedAdmissionForEdit) {
                  await emergencyAdmissionVitalsApi.create(selectedAdmissionForEdit.emergencyAdmissionId, vitalsFormData);
                  await fetchVitals(selectedAdmissionForEdit.emergencyAdmissionId);
                  setIsAddVitalsDialogOpen(false);
                  setVitalsFormData({
                    emergencyAdmissionId: 0,
                    nurseId: 0,
                    recordedDateTime: '',
                    heartRate: undefined,
                    bloodPressure: '',
                    temperature: undefined,
                    o2Saturation: undefined,
                    respiratoryRate: undefined,
                    pulseRate: undefined,
                    vitalsStatus: 'Stable',
                    vitalsRemarks: '',
                    status: 'Active',
                  });
                  setAddVitalsRecordedDateTime(new Date());
                }
              } catch (err) {
                console.error('Error creating vitals:', err);
                alert('Failed to create vitals record. Please try again.');
              }
            }}>Create Vitals Record</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Vitals Dialog */}
      <Dialog open={isManageVitalsDialogOpen} onOpenChange={setIsManageVitalsDialogOpen}>
        <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]">
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
            <DialogTitle>Manage Vitals Record</DialogTitle>
          </DialogHeader>
          {selectedVitals && (
            <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
              <div className="space-y-4 py-4">
                <div>
                  <Label>Vitals ID</Label>
                  <Input value={selectedVitals.emergencyAdmissionVitalsId} disabled className="bg-gray-50 text-gray-700" />
                </div>
                
                <div>
                  <Label htmlFor="manage-vitals-nurseId">Nurse *</Label>
                  <select
                    id="manage-vitals-nurseId"
                    aria-label="Nurse"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={vitalsFormData.nurseId}
                    onChange={(e) => setVitalsFormData({ ...vitalsFormData, nurseId: Number(e.target.value) })}
                  >
                    <option value="0">Select Nurse</option>
                    {staff
                      .filter(s => {
                        if (!s || !s.RoleId) return false;
                        const role = roles.find(r => r && r.id === s.RoleId);
                        if (!role || !role.name) return false;
                        const roleNameLower = role.name.toLowerCase();
                        return roleNameLower.includes('nurse');
                      })
                      .map(nurse => {
                        const role = roles.find(r => r && r.id === nurse.RoleId);
                        return (
                          <option key={nurse.UserId} value={nurse.UserId}>
                            {nurse.UserName} - {role?.name || ''}
                          </option>
                        );
                      })}
                  </select>
                </div>
              
                <div>
                  <Label htmlFor="manage-vitals-recordedDateTime">Recorded Date & Time *</Label>
                  <DatePicker
                    id="manage-vitals-recordedDateTime"
                    selected={manageVitalsRecordedDateTime}
                    onChange={(date: Date | null) => {
                      setManageVitalsRecordedDateTime(date);
                      if (date) {
                        // Extract local date/time components without timezone conversion
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        const seconds = '00';
                        // Format as YYYY-MM-DD HH:MM:SS for API (no timezone conversion)
                        const dateTimeStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                        setVitalsFormData({ ...vitalsFormData, recordedDateTime: dateTimeStr });
                      } else {
                        setVitalsFormData({ ...vitalsFormData, recordedDateTime: '' });
                      }
                    }}
                    showTimeSelect
                    timeIntervals={1}
                    timeCaption="Time"
                    timeFormat="hh:mm aa"
                    dateFormat="dd-MM-yyyy hh:mm aa"
                    placeholderText="dd-mm-yyyy hh:mm am/pm"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    wrapperClassName="w-full"
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manage-vitals-heartRate">Heart Rate (bpm)</Label>
                    <Input
                      id="manage-vitals-heartRate"
                      type="number"
                      placeholder="e.g., 72"
                      value={vitalsFormData.heartRate || ''}
                      onChange={(e) => setVitalsFormData({ ...vitalsFormData, heartRate: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="manage-vitals-bloodPressure">Blood Pressure</Label>
                    <Input
                      id="manage-vitals-bloodPressure"
                      placeholder="e.g., 120/80"
                      value={vitalsFormData.bloodPressure}
                      onChange={(e) => setVitalsFormData({ ...vitalsFormData, bloodPressure: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manage-vitals-temperature">Temperature (°C)</Label>
                    <Input
                      id="manage-vitals-temperature"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 36.5"
                      value={vitalsFormData.temperature || ''}
                      onChange={(e) => setVitalsFormData({ ...vitalsFormData, temperature: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="manage-vitals-o2Saturation">O2 Saturation (%)</Label>
                    <Input
                      id="manage-vitals-o2Saturation"
                      type="number"
                      placeholder="e.g., 98"
                      value={vitalsFormData.o2Saturation || ''}
                      onChange={(e) => setVitalsFormData({ ...vitalsFormData, o2Saturation: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manage-vitals-respiratoryRate">Respiratory Rate</Label>
                    <Input
                      id="manage-vitals-respiratoryRate"
                      type="number"
                      placeholder="e.g., 16"
                      value={vitalsFormData.respiratoryRate || ''}
                      onChange={(e) => setVitalsFormData({ ...vitalsFormData, respiratoryRate: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="manage-vitals-pulseRate">Pulse Rate (bpm)</Label>
                    <Input
                      id="manage-vitals-pulseRate"
                      type="number"
                      placeholder="e.g., 72"
                      value={vitalsFormData.pulseRate || ''}
                      onChange={(e) => setVitalsFormData({ ...vitalsFormData, pulseRate: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="manage-vitals-status">Vitals Status *</Label>
                  <select
                    id="manage-vitals-status"
                    aria-label="Vitals Status"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={vitalsFormData.vitalsStatus}
                    onChange={(e) => setVitalsFormData({ ...vitalsFormData, vitalsStatus: e.target.value as 'Critical' | 'Stable' })}
                  >
                    <option value="Stable">Stable</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="manage-vitals-remarks">Remarks</Label>
                  <Textarea
                    id="manage-vitals-remarks"
                    placeholder="Enter any remarks or notes..."
                    value={vitalsFormData.vitalsRemarks}
                    onChange={(e) => setVitalsFormData({ ...vitalsFormData, vitalsRemarks: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="dialog-form-field">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="manage-vitals-status-field" className="dialog-label-standard">Status</Label>
                    <div className="flex-shrink-0 relative" style={{ zIndex: 1 }}>
                      <Switch
                        id="manage-vitals-status-field"
                        checked={vitalsFormData.status === 'Active'}
                        onCheckedChange={(checked) => {
                          setVitalsFormData({ ...vitalsFormData, status: checked ? 'Active' : 'Inactive' });
                        }}
                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300 [&_[data-slot=switch-thumb]]:!bg-white [&_[data-slot=switch-thumb]]:!border [&_[data-slot=switch-thumb]]:!border-gray-400 [&_[data-slot=switch-thumb]]:!shadow-sm"
                        style={{
                          width: '2.5rem',
                          height: '1.5rem',
                          minWidth: '2.5rem',
                          minHeight: '1.5rem',
                          display: 'inline-flex',
                          position: 'relative',
                          backgroundColor: vitalsFormData.status === 'Active' ? '#16a34a' : '#d1d5db',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {selectedVitals.vitalsCreatedAt && (
                  <div>
                    <Label>Created At</Label>
                    <Input
                      value={formatDateTimeIST(selectedVitals.vitalsCreatedAt)}
                      disabled
                      className="bg-gray-50 text-gray-700"
                    />
                  </div>
                )}

                {selectedVitals.createdByName && (
                  <div>
                    <Label>Created By</Label>
                    <Input value={selectedVitals.createdByName} disabled className="bg-gray-50 text-gray-700" />
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 px-6 py-2 border-t bg-gray-50 flex-shrink-0">
            <Button variant="outline" onClick={() => {
              setIsManageVitalsDialogOpen(false);
              setSelectedVitals(null);
            }}>Cancel</Button>
            <Button onClick={async () => {
              if (!vitalsFormData.nurseId || !vitalsFormData.recordedDateTime) {
                alert('Please fill in all required fields (Nurse, Recorded Date & Time).');
                return;
              }
              try {
                if (selectedAdmissionForEdit && selectedVitals) {
                  const updateData: UpdateEmergencyAdmissionVitalsDto = {
                    nurseId: vitalsFormData.nurseId,
                    recordedDateTime: vitalsFormData.recordedDateTime,
                    heartRate: vitalsFormData.heartRate,
                    bloodPressure: vitalsFormData.bloodPressure || undefined,
                    temperature: vitalsFormData.temperature,
                    o2Saturation: vitalsFormData.o2Saturation,
                    respiratoryRate: vitalsFormData.respiratoryRate,
                    pulseRate: vitalsFormData.pulseRate,
                    vitalsStatus: vitalsFormData.vitalsStatus,
                    vitalsRemarks: vitalsFormData.vitalsRemarks || undefined,
                    status: vitalsFormData.status,
                  };
                  await emergencyAdmissionVitalsApi.update(selectedVitals.emergencyAdmissionVitalsId, updateData);
                  await fetchVitals(selectedAdmissionForEdit.emergencyAdmissionId);
                  setIsManageVitalsDialogOpen(false);
                  setSelectedVitals(null);
                }
              } catch (err) {
                console.error('Error updating vitals:', err);
                alert('Failed to update vitals record. Please try again.');
              }
            }}>Update Vitals Record</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Admissions List */}
      {emergencyAdmissionsLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12 text-gray-600">Loading emergency admissions...</div>
          </CardContent>
        </Card>
      ) : emergencyAdmissionsError ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12 text-red-500">Error: {emergencyAdmissionsError}</div>
          </CardContent>
        </Card>
      ) : (
        <EmergencyAdmissionsList 
          admissions={sortedAdmissions}
          getPatientName={getPatientName}
          getRoomId={getRoomId}
          getRoomNameFromBedId={getRoomNameFromBedId}
          getBedNumber={getBedNumber}
          formatDateToDDMMYYYY={formatDateToDDMMYYYY}
          getStatusBadge={getStatusBadge}
          isDischargedOrTransferred={isDischargedOrTransferred}
          onEdit={handleEditAdmission}
        />
      )}

      {/* Patient Details Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Emergency Patient Details</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4 py-4">
              <div className={`flex items-center justify-between p-4 rounded-lg ${
                selectedPatient.triageLevel === 'Red' ? 'bg-red-50 border-2 border-red-200' :
                selectedPatient.triageLevel === 'Yellow' ? 'bg-yellow-50 border-2 border-yellow-200' :
                'bg-green-50 border-2 border-green-200'
              }`}>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`size-3 rounded-full ${
                      selectedPatient.triageLevel === 'Red' ? 'bg-red-600' :
                      selectedPatient.triageLevel === 'Yellow' ? 'bg-yellow-600' : 'bg-green-600'
                    }`} />
                    <h3 className="text-gray-900">{selectedPatient.patientName}</h3>
                    <Badge>{selectedPatient.emergencyId}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{selectedPatient.age}Y / {selectedPatient.gender}</p>
                </div>
                <Badge variant={
                  selectedPatient.triageLevel === 'Red' ? 'destructive' :
                  selectedPatient.triageLevel === 'Yellow' ? 'default' : 'secondary'
                }>
                  {selectedPatient.triageLevel} - {
                    selectedPatient.triageLevel === 'Red' ? 'Life Threatening' :
                    selectedPatient.triageLevel === 'Yellow' ? 'Urgent' : 'Non-Urgent'
                  }
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Arrival Time</p>
                  <p className="text-gray-900">{selectedPatient.arrivalTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Arrival Mode</p>
                  <Badge variant="outline">{selectedPatient.arrivalMode}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bed Number</p>
                  <p className="text-gray-900">{selectedPatient.bedNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge>{selectedPatient.status}</Badge>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Chief Complaint</p>
                <p className="text-gray-900">{selectedPatient.chiefComplaint}</p>
              </div>

              {selectedPatient.assignedDoctor && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-500">Assigned Doctor</p>
                  <p className="text-gray-900">{selectedPatient.assignedDoctor}</p>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-gray-900 mb-3">Vital Signs</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Blood Pressure</p>
                    <p className="text-gray-900">{selectedPatient.vitalSigns.bloodPressure}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Heart Rate</p>
                    <p className="text-gray-900">{selectedPatient.vitalSigns.heartRate} bpm</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Temperature</p>
                    <p className="text-gray-900">{selectedPatient.vitalSigns.temperature}°C</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">O₂ Saturation</p>
                    <p className="text-gray-900">{selectedPatient.vitalSigns.oxygenSaturation}%</p>
                  </div>
                </div>
              </div>

              {selectedPatient.notes && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-500 mb-1">Clinical Notes</p>
                  <p className="text-gray-900">{selectedPatient.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {selectedPatient.status === 'Waiting' && (
                  <Button>Assign Doctor</Button>
                )}
                {selectedPatient.status === 'Under Treatment' && (
                  <Button className="gap-2">
                    <ArrowRight className="size-4" />
                    Admit to IPD
                  </Button>
                )}
                <Button variant="outline">Update Vitals</Button>
                <Button variant="outline">Discharge</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmergencyAdmissionsList({ 
  admissions,
  getPatientName,
  getRoomId,
  getRoomNameFromBedId,
  getBedNumber,
  formatDateToDDMMYYYY,
  getStatusBadge,
  isDischargedOrTransferred,
  onEdit
}: { 
  admissions: EmergencyAdmission[];
  getPatientName: (admission: EmergencyAdmission) => string;
  getRoomId: (admission: EmergencyAdmission) => string;
  getRoomNameFromBedId: (admission: EmergencyAdmission) => string;
  getBedNumber: (admission: EmergencyAdmission) => string;
  formatDateToDDMMYYYY: (dateString: string) => string;
  getStatusBadge: (status: EmergencyAdmission['emergencyStatus']) => React.ReactNode;
  isDischargedOrTransferred: (admission: EmergencyAdmission) => boolean;
  onEdit: (admission: EmergencyAdmission) => void;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">ER ID</th>
                <th className="text-left py-3 px-4 text-gray-700">Patient</th>
                <th className="text-left py-3 px-4 text-gray-700">Triage</th>
                <th className="text-left py-3 px-4 text-gray-700">Complaint</th>
                <th className="text-left py-3 px-4 text-gray-700">Arrival</th>
                <th className="text-left py-3 px-4 text-gray-700">Room</th>
                <th className="text-left py-3 px-4 text-gray-700">Bed</th>
                <th className="text-left py-3 px-4 text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    No emergency admissions found
                  </td>
                </tr>
              ) : (
                admissions.map((admission) => {
                  const isDischargedOrTransferredStatus = isDischargedOrTransferred(admission);
                  
                  return (
                    <tr 
                      key={admission.emergencyAdmissionId} 
                      className={`border-b border-gray-100 hover:bg-gray-50 ${isDischargedOrTransferredStatus ? 'opacity-50 bg-gray-50' : ''}`}
                    >
                      <td className={`py-3 px-4 ${isDischargedOrTransferredStatus ? 'text-gray-400' : 'text-gray-900'}`}>
                        {admission.emergencyAdmissionId || '-'}
                      </td>
                      <td className={`py-3 px-4 ${isDischargedOrTransferredStatus ? 'text-gray-400' : 'text-gray-900'}`}>
                        {getPatientName(admission)}
                      </td>
                      <td className={`py-3 px-4 ${isDischargedOrTransferredStatus ? 'text-gray-400' : ''}`}>
                        {(() => {
                          const priority = admission.priority || 'Medium';
                          const getTriageBadge = (p: string) => {
                            switch (p) {
                              case 'Critical': return { 
                                label: 'Critical', 
                                className: isDischargedOrTransferredStatus 
                                  ? 'bg-gray-100 text-gray-600 border-gray-300' 
                                  : 'bg-red-100 text-red-700 border-red-300'
                              };
                              case 'High': return { 
                                label: 'High', 
                                className: isDischargedOrTransferredStatus 
                                  ? 'bg-gray-100 text-gray-600 border-gray-300' 
                                  : 'bg-orange-100 text-orange-700 border-orange-300'
                              };
                              case 'Medium': return { 
                                label: 'Medium', 
                                className: isDischargedOrTransferredStatus 
                                  ? 'bg-gray-100 text-gray-600 border-gray-300' 
                                  : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                              };
                              case 'Low': return { 
                                label: 'Low', 
                                className: isDischargedOrTransferredStatus 
                                  ? 'bg-gray-100 text-gray-600 border-gray-300' 
                                  : 'bg-green-100 text-green-700 border-green-300'
                              };
                              default: return { 
                                label: 'Medium', 
                                className: 'bg-gray-100 text-gray-600 border-gray-300'
                              };
                            }
                          };
                          const triageBadge = getTriageBadge(priority);
                          return (
                            <Badge variant="outline" className={triageBadge.className}>
                              {triageBadge.label}
                            </Badge>
                          );
                        })()}
                      </td>
                      <td className={`py-3 px-4 ${isDischargedOrTransferredStatus ? 'text-gray-400' : 'text-gray-600'}`}>
                        {admission.diagnosis || admission.treatmentDetails || '-'}
                      </td>
                      <td className={`py-3 px-4 ${isDischargedOrTransferredStatus ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatDateToDDMMYYYY(admission.emergencyAdmissionDate)}
                      </td>
                      <td className={`py-3 px-4 ${isDischargedOrTransferredStatus ? 'text-gray-400' : 'text-gray-900'}`}>
                        {getRoomNameFromBedId(admission)}
                      </td>
                      <td className={`py-3 px-4 ${isDischargedOrTransferredStatus ? 'text-gray-400' : ''}`}>
                        <Badge className={isDischargedOrTransferredStatus ? 'opacity-50' : ''}>
                          {admission.emergencyBedNo || getBedNumber(admission) || '-'}
                        </Badge>
                      </td>
                      <td className={`py-3 px-4 ${isDischargedOrTransferredStatus ? 'text-gray-400' : ''}`}>
                        {getStatusBadge(admission.emergencyStatus)}
                      </td>
                      <td className={`py-3 px-4 ${isDischargedOrTransferredStatus ? 'text-gray-400' : ''}`}>
                        <Button variant="outline" size="sm" onClick={() => onEdit(admission)}>
                          Manage
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
