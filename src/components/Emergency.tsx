import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ResizableDialogContent } from './ResizableDialogContent';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Siren, Plus, Ambulance, AlertTriangle, BedDouble, ArrowRight, Clock, Search, Calendar, ChevronUp } from 'lucide-react';
import { patientsApi } from '../api/patients';
import { Patient, EmergencyAdmission } from '../types';
import { useEmergencyBedSlots } from '../hooks/useEmergencyBedSlots';
import { useEmergencyBeds } from '../hooks/useEmergencyBeds';
import { useStaff } from '../hooks/useStaff';
import { useRoles } from '../hooks/useRoles';
import { emergencyAdmissionsApi, CreateEmergencyAdmissionDto, UpdateEmergencyAdmissionDto } from '../api/emergencyAdmissions';
import { emergencyBedsApi } from '../api/emergencyBeds';

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
  const [addDatePickerOpen, setAddDatePickerOpen] = useState(false);
  const [editDatePickerOpen, setEditDatePickerOpen] = useState(false);
  const [isUnoccupiedBedsExpanded, setIsUnoccupiedBedsExpanded] = useState(false);
  
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
    transferTo: undefined as 'IPD Room Admission' | 'ICU' | 'OT' | undefined,
    transferDetails: '',
    status: 'Active' as EmergencyAdmission['status'],
  });

  // Form data for Edit Emergency Admission
  const [editFormData, setEditFormData] = useState({
    id: 0,
    doctorId: '',
    patientId: '',
    emergencyBedId: '',
    emergencyAdmissionDate: new Date().toISOString().split('T')[0],
    emergencyStatus: 'Admitted' as EmergencyAdmission['emergencyStatus'],
    numberOfDays: null as number | null,
    diagnosis: '',
    treatmentDetails: '',
    patientCondition: 'Stable' as EmergencyAdmission['patientCondition'],
    priority: 'Medium',
    transferToIPDOTICU: false,
    transferTo: undefined as 'IPD Room Admission' | 'ICU' | 'OT' | undefined,
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

  // Helper function to convert Date object to DD-MM-YYYY
  const getDDMMYYYYFromDate = useCallback((date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }, []);

  
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
      let bedId = fullAdmission.emergencyBedId;
      if (!bedId && fullAdmission.emergencyBedSlotId) {
        // Fallback: find bed ID from slot (for backward compatibility)
        const slot = emergencyBedSlots.find(s => s.id === fullAdmission.emergencyBedSlotId);
        bedId = slot?.emergencyBedId;
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
        emergencyAdmissionDate: formattedDate || new Date().toISOString().split('T')[0],
        emergencyStatus: fullAdmission.emergencyStatus,
        numberOfDays: null, // TODO: Add to EmergencyAdmission type if available from API
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
        // Check if bed is occupied by status or by admission
        const admission = emergencyAdmissions.find(a => 
          a.emergencyBedId === bed.id && 
          a.emergencyStatus === 'Admitted' &&
          a.status === 'Active'
        );
        
        if (bed.status === 'occupied' || admission) {
          occupied.push(bed);
        } else {
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-red-600 hover:bg-red-700">
              <Plus className="size-4" />
              Register Emergency Patient
            </Button>
          </DialogTrigger>
          <ResizableDialogContent className="p-0 gap-0 large-dialog dialog-content-standard">
            <div className="dialog-scrollable-wrapper dialog-content-scrollable">
              <DialogHeader className="dialog-header-standard">
                <DialogTitle className="dialog-title-standard">Add New Emergency Admission</DialogTitle>
                {emergencyFormData.patientId && (
                  <div className="mt-2 text-sm font-semibold text-gray-700">
                    Patient: {(() => {
                      const selectedPatient = availablePatients.find(p => {
                        const pid = (p as any).patientId || (p as any).PatientId || '';
                        return pid === emergencyFormData.patientId;
                      });
                      if (selectedPatient) {
                        const patientNo = (selectedPatient as any).patientNo || (selectedPatient as any).PatientNo || '';
                        const patientName = (selectedPatient as any).patientName || (selectedPatient as any).PatientName || '';
                        const lastName = (selectedPatient as any).lastName || (selectedPatient as any).LastName || '';
                        const fullName = `${patientName} ${lastName}`.trim();
                        return `${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`;
                      }
                      return 'Unknown';
                    })()}
                  </div>
                )}
              </DialogHeader>
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
                        onChange={(e) => setDoctorSearchTerm(e.target.value)}
                        className="dialog-input-standard pl-10"
                      />
                    </div>
                    {doctorSearchTerm && (
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
                        }).length === 0 && (
                          <div className="text-center py-8 text-sm text-gray-700">
                            No doctors found. Try a different search term.
                          </div>
                        )}
                      </div>
                    )}
                    {emergencyFormData.doctorId && (
                      <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                        Selected: {(() => {
                          const selectedDoctor = (doctors || []).find(d => d && d.id && d.id.toString() === emergencyFormData.doctorId);
                          return selectedDoctor ? `${selectedDoctor.name} - ${selectedDoctor.role}` : 'Unknown';
                        })()}
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
                          setShowPatientDropdown(true);
                          // Clear patient selection if user edits the search term
                          if (selectedPatientId) {
                            setSelectedPatientId('');
                            setEmergencyFormData({
                              ...emergencyFormData,
                              patientId: '',
                            });
                          }
                          // Clear error when user starts typing
                          if (patientError) {
                            setPatientError('');
                          }
                        }}
                        onFocus={() => {
                          // Show dropdown when input is focused
                          if (availablePatients.length > 0) {
                            updateDropdownPosition();
                            setShowPatientDropdown(true);
                          }
                        }}
                        onBlur={(e) => {
                          // Don't close if clicking on dropdown
                          const relatedTarget = e.relatedTarget as HTMLElement;
                          if (!relatedTarget || !relatedTarget.closest('#emergency-patient-dropdown')) {
                            // Delay closing to allow click events to fire
                            setTimeout(() => {
                              setShowPatientDropdown(false);
                            }, 200);
                          }
                        }}
                        onKeyDown={(e) => {
                          const filteredPatients = availablePatients.filter(patient => {
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
                            setSelectedPatientId(patientId);
                            setPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
                            setEmergencyFormData({
                              ...emergencyFormData,
                              patientId,
                            });
                            setPatientError('');
                            setPatientHighlightIndex(-1);
                            setShowPatientDropdown(false);
                          }
                        }}
                        className="dialog-input-standard pl-10"
                      />
                    </div>
                    {patientSearchTerm && (
                      <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                        <table className="w-full">
                          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Patient ID</th>
                              <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                              <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Mobile</th>
                            </tr>
                          </thead>
                          <tbody>
                            {availablePatients
                              .filter(patient => {
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
                              })
                              .map(patient => {
                                const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                                const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                                const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                                const lastName = (patient as any).lastName || (patient as any).LastName || '';
                                const fullName = `${patientName} ${lastName}`.trim();
                                const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                                const isSelected = emergencyFormData.patientId === patientId;
                                return (
                                  <tr
                                    key={patientId}
                                    onClick={() => {
                                      setSelectedPatientId(patientId);
                                      setEmergencyFormData({ ...emergencyFormData, patientId });
                                      setPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
                                      setPatientError('');
                                      setShowPatientDropdown(false);
                                    }}
                                    className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-gray-100' : ''}`}
                                  >
                                    <td className="py-2 px-3 text-sm text-gray-900 font-mono">{patientNo || patientId.substring(0, 8)}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{fullName || 'Unknown'}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{phoneNo || '-'}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                        {availablePatients.filter(patient => {
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
                        }).length === 0 && (
                          <div className="text-center py-8 text-sm text-gray-700">
                            No patients found. Try a different search term.
                          </div>
                        )}
                      </div>
                    )}
                    {emergencyFormData.patientId && (
                      <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                        Selected: {(() => {
                          const selectedPatient = availablePatients.find(p => {
                            const pid = (p as any).patientId || (p as any).PatientId || '';
                            return pid === emergencyFormData.patientId;
                          });
                          if (selectedPatient) {
                            const patientId = (selectedPatient as any).patientId || (selectedPatient as any).PatientId || '';
                            const patientNo = (selectedPatient as any).patientNo || (selectedPatient as any).PatientNo || '';
                            const patientName = (selectedPatient as any).patientName || (selectedPatient as any).PatientName || '';
                            const lastName = (selectedPatient as any).lastName || (selectedPatient as any).LastName || '';
                            const fullName = `${patientName} ${lastName}`.trim();
                            return `${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'} (ID: ${patientId.substring(0, 8)})`;
                          }
                          return `Unknown (ID: ${emergencyFormData.patientId.substring(0, 8)})`;
                        })()}
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
                      {emergencyBeds
                        .filter(bed => bed.status === 'active') // Only show active beds
                        .map(bed => (
                          <option key={bed.id} value={bed.id.toString()}>
                            {bed.emergencyBedNo} {bed.emergencyRoomNameNo ? `(${bed.emergencyRoomNameNo})` : ''}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="dialog-form-field">
                    <Label htmlFor="add-emergencyAdmissionDate" className="dialog-label-standard">Emergency Admission Date * (DD-MM-YYYY)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="add-emergencyAdmissionDate"
                        type="text"
                        placeholder="DD-MM-YYYY"
                        value={emergencyFormData.emergencyAdmissionDate}
                        onChange={(e) => {
                          let value = e.target.value;
                          // Allow only digits and dashes
                          value = value.replace(/[^\d-]/g, '');
                          // Auto-format as user types: DD-MM-YYYY
                          if (value.length <= 10) {
                            // Remove existing dashes and add them at correct positions
                            const digits = value.replace(/-/g, '');
                            let formatted = '';
                            for (let i = 0; i < digits.length; i++) {
                              if (i === 2 || i === 4) {
                                formatted += '-';
                              }
                              formatted += digits[i];
                            }
                            setEmergencyFormData({ ...emergencyFormData, emergencyAdmissionDate: formatted });
                          }
                        }}
                        onBlur={(e) => {
                          // Validate and format on blur
                          const value = e.target.value;
                          const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
                          if (dateRegex.test(value)) {
                            const [, day, month, year] = value.match(dateRegex)!;
                            const dayNum = parseInt(day, 10);
                            const monthNum = parseInt(month, 10);
                            const yearNum = parseInt(year, 10);
                            // Validate date
                            if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
                              const date = new Date(yearNum, monthNum - 1, dayNum);
                              if (date.getDate() === dayNum && date.getMonth() === monthNum - 1 && date.getFullYear() === yearNum) {
                                // Valid date, keep as is
                                return;
                              }
                            }
                          }
                          // If invalid, show error or reset
                        }}
                        className="dialog-input-standard flex-1"
                        maxLength={10}
                      />
                      <Popover open={addDatePickerOpen} onOpenChange={setAddDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="px-3"
                          >
                            <Calendar className="size-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={getDateFromDDMMYYYY(emergencyFormData.emergencyAdmissionDate)}
                            onSelect={(date) => {
                              if (date) {
                                const formattedDate = getDDMMYYYYFromDate(date);
                                setEmergencyFormData({ ...emergencyFormData, emergencyAdmissionDate: formattedDate });
                                setAddDatePickerOpen(false);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
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
                          onChange={(e) => setEmergencyFormData({ ...emergencyFormData, transferTo: e.target.value as 'IPD Room Admission' | 'ICU' | 'OT' })}
                        >
                          <option value="">Select Transfer Destination</option>
                          <option value="IPD Room Admission">IPD Room Admission</option>
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
                        // Validate date format DD-MM-YYYY
                        const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
                        if (!emergencyFormData.emergencyAdmissionDate || !dateRegex.test(emergencyFormData.emergencyAdmissionDate)) {
                          setSubmitError('Please enter a valid emergency admission date in DD-MM-YYYY format');
                          return;
                        }
                        // Validate the date is actually valid
                        const [, day, month, year] = emergencyFormData.emergencyAdmissionDate.match(dateRegex)!;
                        const dayNum = parseInt(day, 10);
                        const monthNum = parseInt(month, 10);
                        const yearNum = parseInt(year, 10);
                        const date = new Date(yearNum, monthNum - 1, dayNum);
                        if (date.getDate() !== dayNum || date.getMonth() !== monthNum - 1 || date.getFullYear() !== yearNum) {
                          setSubmitError('Please enter a valid emergency admission date');
                          return;
                        }

                        setIsSubmitting(true);
                        setSubmitError(null);
                        setSubmitSuccess(false);
                        setPatientError('');

                        try {
                          // Map transferToIPDOTICU checkbox to individual transfer fields
                          const transferToIPD = emergencyFormData.transferToIPDOTICU && emergencyFormData.transferTo === 'IPD Room Admission' ? 'Yes' : 'No';
                          const transferToOT = emergencyFormData.transferToIPDOTICU && emergencyFormData.transferTo === 'OT' ? 'Yes' : 'No';
                          const transferToICU = emergencyFormData.transferToIPDOTICU && emergencyFormData.transferTo === 'ICU' ? 'Yes' : 'No';

                          // Convert date from DD-MM-YYYY to YYYY-MM-DD for API
                          let apiDate = emergencyFormData.emergencyAdmissionDate;
                          const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
                          if (dateRegex.test(apiDate)) {
                            const [, day, month, year] = apiDate.match(dateRegex)!;
                            apiDate = `${year}-${month}-${day}`;
                          }

                          // Prepare the DTO
                          const createDto: CreateEmergencyAdmissionDto = {
                            doctorId: parseInt(emergencyFormData.doctorId),
                            patientId: emergencyFormData.patientId,
                            emergencyBedId: parseInt(emergencyFormData.emergencyBedId),
                            emergencyAdmissionDate: apiDate,
                            emergencyStatus: emergencyFormData.emergencyStatus,
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
                          
                          // Update bed status to occupied
                          try {
                            await emergencyBedsApi.update({
                              id: parseInt(emergencyFormData.emergencyBedId),
                              status: 'occupied'
                            });
                            // Refresh beds to reflect updated status
                            await fetchEmergencyBeds();
                          } catch (bedUpdateError) {
                            console.error('Failed to update bed status:', bedUpdateError);
                            // Don't fail the admission creation if bed update fails
                          }
                          
                          // Refresh emergency admissions to update slot availability
                          const updatedAdmissions = await emergencyAdmissionsApi.getAll();
                          setEmergencyAdmissions(updatedAdmissions);
                          
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
                            emergencyAdmissionDate: new Date().toISOString().split('T')[0],
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
          </ResizableDialogContent>
        </Dialog>
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
                        // Find admission for this bed where patient is admitted
                        const admission = emergencyAdmissions.find(a => 
                          a.emergencyBedId === bed.id && 
                          a.emergencyStatus === 'Admitted' &&
                          a.status === 'Active'
                        );
                        
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
                              }
                            }}
                            className={`p-4 border-2 rounded-lg text-center transition-all ${colors.border} ${colors.bg} ${colors.hover}`}
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
                  a.emergencyStatus !== 'Discharged' && 
                  a.emergencyStatus !== 'Movedout' &&
                  (a.emergencyStatus === 'Admitted' || a.emergencyStatus === 'IPD'))
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
                      className={`p-3 border-2 rounded-lg ${colors.border} ${colors.bg}`}
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
                a.emergencyStatus !== 'Discharged' && 
                a.emergencyStatus !== 'Movedout' &&
                (a.emergencyStatus === 'Admitted' || a.emergencyStatus === 'IPD')).length === 0 && (
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
              {editFormData.patientId && (
                <div className="mt-2 text-sm font-semibold text-gray-700">
                  Patient: {(() => {
                    const selectedPatient = availablePatients.find(p => {
                      const pid = (p as any).patientId || (p as any).PatientId || '';
                      return pid === editFormData.patientId;
                    });
                    if (selectedPatient) {
                      const patientNo = (selectedPatient as any).patientNo || (selectedPatient as any).PatientNo || '';
                      const patientName = (selectedPatient as any).patientName || (selectedPatient as any).PatientName || '';
                      const lastName = (selectedPatient as any).lastName || (selectedPatient as any).LastName || '';
                      const fullName = `${patientName} ${lastName}`.trim();
                      return `${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`;
                    }
                    return 'Unknown';
                  })()}
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
              <div className="dialog-form-container space-y-4">
                <div className="dialog-form-field">
                  <Label htmlFor="edit-doctor-search" className="dialog-label-standard">Doctor *</Label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="edit-doctor-search"
                      placeholder="Search by Doctor Name or Specialty..."
                      value={editDoctorSearchTerm}
                      onChange={(e) => setEditDoctorSearchTerm(e.target.value)}
                      className="dialog-input-standard pl-10"
                    />
                  </div>
                  {editDoctorSearchTerm && (
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
                      }).length === 0 && (
                        <div className="text-center py-8 text-sm text-gray-700">
                          No doctors found. Try a different search term.
                        </div>
                      )}
                    </div>
                  )}
                  {editFormData.doctorId && (
                    <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                      Selected: {(() => {
                        const selectedDoctor = (doctors || []).find(d => d && d.id && d.id.toString() === editFormData.doctorId);
                        return selectedDoctor ? `${selectedDoctor.name} - ${selectedDoctor.role}` : 'Unknown';
                      })()}
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
                      .map(bed => (
                        <option key={bed.id} value={bed.id.toString()}>
                          {bed.emergencyBedNo} {bed.emergencyRoomNameNo ? `(${bed.emergencyRoomNameNo})` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="dialog-form-field">
                  <Label htmlFor="edit-emergencyAdmissionDate" className="dialog-label-standard">Emergency Admission Date * (DD-MM-YYYY)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-emergencyAdmissionDate"
                      type="text"
                      placeholder="DD-MM-YYYY"
                      value={editFormData.emergencyAdmissionDate}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Allow only digits and dashes
                        value = value.replace(/[^\d-]/g, '');
                        // Auto-format as user types: DD-MM-YYYY
                        if (value.length <= 10) {
                          // Remove existing dashes and add them at correct positions
                          const digits = value.replace(/-/g, '');
                          let formatted = '';
                          for (let i = 0; i < digits.length; i++) {
                            if (i === 2 || i === 4) {
                              formatted += '-';
                            }
                            formatted += digits[i];
                          }
                          setEditFormData({ ...editFormData, emergencyAdmissionDate: formatted });
                        }
                      }}
                      onBlur={(e) => {
                        // Validate and format on blur
                        const value = e.target.value;
                        const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
                        if (dateRegex.test(value)) {
                          const [, day, month, year] = value.match(dateRegex)!;
                          const dayNum = parseInt(day, 10);
                          const monthNum = parseInt(month, 10);
                          const yearNum = parseInt(year, 10);
                          // Validate date
                          if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
                            const date = new Date(yearNum, monthNum - 1, dayNum);
                            if (date.getDate() === dayNum && date.getMonth() === monthNum - 1 && date.getFullYear() === yearNum) {
                              // Valid date, keep as is
                              return;
                            }
                          }
                        }
                        // If invalid, show error or reset
                      }}
                      className="dialog-input-standard flex-1"
                      maxLength={10}
                    />
                    <Popover open={editDatePickerOpen} onOpenChange={setEditDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="px-3"
                        >
                          <Calendar className="size-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={getDateFromDDMMYYYY(editFormData.emergencyAdmissionDate)}
                          onSelect={(date) => {
                            if (date) {
                              const formattedDate = getDDMMYYYYFromDate(date);
                              setEditFormData({ ...editFormData, emergencyAdmissionDate: formattedDate });
                              setEditDatePickerOpen(false);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
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
                        onChange={(e) => setEditFormData({ ...editFormData, transferTo: e.target.value as 'IPD Room Admission' | 'ICU' | 'OT' })}
                      >
                        <option value="">Select Transfer Destination</option>
                        <option value="IPD Room Admission">IPD Room Admission</option>
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

                <div className="dialog-form-field">
                  <Label htmlFor="edit-status" className="dialog-label-standard">Status</Label>
                  <select
                    id="edit-status"
                    aria-label="Status"
                    className="dialog-select-standard"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as EmergencyAdmission['status'] })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
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
                      // Validate date format DD-MM-YYYY
                      const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
                      if (!editFormData.emergencyAdmissionDate || !dateRegex.test(editFormData.emergencyAdmissionDate)) {
                        setUpdateError('Please enter a valid emergency admission date in DD-MM-YYYY format');
                        return;
                      }
                      // Validate the date is actually valid
                      const [, day, month, year] = editFormData.emergencyAdmissionDate.match(dateRegex)!;
                      const dayNum = parseInt(day, 10);
                      const monthNum = parseInt(month, 10);
                      const yearNum = parseInt(year, 10);
                      const date = new Date(yearNum, monthNum - 1, dayNum);
                      if (date.getDate() !== dayNum || date.getMonth() !== monthNum - 1 || date.getFullYear() !== yearNum) {
                        setUpdateError('Please enter a valid emergency admission date');
                        return;
                      }

                      setIsUpdating(true);
                      setUpdateError(null);
                      setUpdateSuccess(false);

                      try {
                        // Map transferToIPDOTICU checkbox to individual transfer fields
                        const transferToIPD = editFormData.transferToIPDOTICU && editFormData.transferTo === 'IPD Room Admission' ? 'Yes' : 'No';
                        const transferToOT = editFormData.transferToIPDOTICU && editFormData.transferTo === 'OT' ? 'Yes' : 'No';
                        const transferToICU = editFormData.transferToIPDOTICU && editFormData.transferTo === 'ICU' ? 'Yes' : 'No';

                        // Convert date from DD-MM-YYYY to YYYY-MM-DD for API
                        let apiDate = editFormData.emergencyAdmissionDate;
                        const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
                        if (dateRegex.test(apiDate)) {
                          const [, day, month, year] = apiDate.match(dateRegex)!;
                          apiDate = `${year}-${month}-${day}`;
                        }

                        // Prepare the DTO
                        const updateDto: UpdateEmergencyAdmissionDto = {
                          id: editFormData.id,
                          doctorId: parseInt(editFormData.doctorId),
                          emergencyBedId: parseInt(editFormData.emergencyBedId),
                          emergencyAdmissionDate: apiDate,
                          emergencyStatus: editFormData.emergencyStatus,
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

                        // Get the previous admission to check for bed changes
                        const previousAdmission = emergencyAdmissions.find(a => a.emergencyAdmissionId === editFormData.id);
                        const previousBedId = previousAdmission?.emergencyBedId;
                        const previousStatus = previousAdmission?.emergencyStatus;
                        const newBedId = parseInt(editFormData.emergencyBedId);
                        const newStatus = editFormData.emergencyStatus;
                        
                        // Call the API
                        await emergencyAdmissionsApi.update(updateDto);
                        
                        // Update bed status based on admission status and bed changes
                        try {
                          // If bed changed, mark old bed as active (available)
                          if (previousBedId && previousBedId !== newBedId) {
                            await emergencyBedsApi.update({
                              id: previousBedId,
                              status: 'active'
                            });
                          }
                          
                          // Update new bed status based on emergency status
                          if (newStatus === 'Discharged' || newStatus === 'Movedout' || newStatus === 'IPD' || newStatus === 'OT' || newStatus === 'ICU') {
                            // Patient is discharged or transferred, mark bed as active (available)
                            await emergencyBedsApi.update({
                              id: newBedId,
                              status: 'active'
                            });
                          } else if (newStatus === 'Admitted') {
                            // Patient is admitted, mark bed as occupied
                            await emergencyBedsApi.update({
                              id: newBedId,
                              status: 'occupied'
                            });
                          }
                          
                          // Refresh beds to reflect updated status
                          await fetchEmergencyBeds();
                        } catch (bedUpdateError) {
                          console.error('Failed to update bed status:', bedUpdateError);
                          // Don't fail the admission update if bed update fails
                        }
                        
                        // Refresh emergency admissions to update slot availability
                        const updatedAdmissions = await emergencyAdmissionsApi.getAll();
                        setEmergencyAdmissions(updatedAdmissions);
                        
                        setUpdateSuccess(true);
                        
                        // Reset form and close dialog after a short delay
                        setTimeout(() => {
                          setIsEditDialogOpen(false);
                          setEditPatientSearchTerm('');
                          setEditDoctorSearchTerm('');
                          setEditSelectedPatientId('');
                          setEditPatientError('');
                          setEditPatientHighlightIndex(-1);
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
              )}
            </div>
          </div>
        </ResizableDialogContent>
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
                  <td colSpan={9} className="text-center py-8 text-gray-500 text-sm">
                    No emergency admissions found.
                  </td>
                </tr>
              ) : (
                admissions.map((admission) => {
                  const isDischargedOrTransferredStatus = isDischargedOrTransferred(admission);
                  
                  return (
                    <tr 
                      key={admission.emergencyAdmissionId} 
                      className={`border-b border-gray-100 ${isDischargedOrTransferredStatus ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="py-3 px-4">
                        <span className={`text-sm ${isDischargedOrTransferredStatus ? 'text-gray-400' : 'text-gray-900'}`}>
                          {admission.emergencyAdmissionId || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className={isDischargedOrTransferredStatus ? 'text-gray-400' : 'text-gray-900'}>
                          {getPatientName(admission)}
                        </p>
                      </td>
                      <td className="py-3 px-4">
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
                      <td className={`py-3 px-4 max-w-xs truncate ${isDischargedOrTransferredStatus ? 'text-gray-400' : 'text-gray-600'}`}>
                        {admission.diagnosis || admission.treatmentDetails || '-'}
                      </td>
                      <td className={`py-3 px-4 ${isDischargedOrTransferredStatus ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatDateToDDMMYYYY(admission.emergencyAdmissionDate)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={isDischargedOrTransferredStatus ? 'text-gray-400' : 'text-gray-900'}>
                          {getRoomNameFromBedId(admission)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={isDischargedOrTransferredStatus ? 'opacity-50' : ''}>
                          {admission.emergencyBedNo || getBedNumber(admission) || '-'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className={isDischargedOrTransferredStatus ? 'opacity-50' : ''}>
                          {getStatusBadge(admission.emergencyStatus)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="outline" size="sm" onClick={() => onEdit(admission)}>
                          Modify
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
