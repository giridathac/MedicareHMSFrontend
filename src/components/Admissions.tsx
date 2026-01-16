import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BedDouble, Plus, Search, Calendar, Scissors, X, FileText, FlaskConical, Stethoscope, Heart, Edit } from 'lucide-react';
import { useAdmissions } from '../hooks/useAdmissions';
import { Admission, RoomCapacityOverview, DashboardMetrics, PatientLabTest } from '../api/admissions';
import { admissionsApi } from '../api/admissions';
import { roomBedsApi } from '../api/roomBeds';
import { doctorsApi } from '../api/doctors';
import { apiRequest } from '../api/base';
import { labTestsApi } from '../api/labTests';
import { LabTest } from '../types';
import { Textarea } from './ui/textarea';
import { DialogFooter } from './ui/dialog';
import { Switch } from './ui/switch';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { formatDateTimeIST } from '../utils/timeUtils';
import { convertToIST } from '../utils/timeUtils';
import ISTDatePicker from './ui/ISTDatePicker';

// Fallback room capacity data (used when API data is not available)
const fallbackRoomCapacity: RoomCapacityOverview = {
  'Regular Ward': { total: 50, occupied: 35, available: 15 },
  'Special Shared Room': { total: 20, occupied: 14, available: 6 },
  'Special Room': { total: 15, occupied: 8, available: 7 },
};

export default function Admissions() {
  const { admissions, roomCapacity, dashboardMetrics, loading, capacityLoading, metricsLoading, fetchRoomCapacityOverview, fetchDashboardMetrics, updateAdmission, fetchAdmissions } = useAdmissions();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date filter state - default to today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [dateFilter, setDateFilter] = useState<Date | null>(today);
  const [dateFilterDisplay, setDateFilterDisplay] = useState<string>(() => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [schedulingOT, setSchedulingOT] = useState<number | null>(null); // Track which admission is being scheduled
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [managedAdmission, setManagedAdmission] = useState<Admission | null>(null);
  const [editingAdmission, setEditingAdmission] = useState<Admission | null>(null);
  const [isViewEditDialogOpen, setIsViewEditDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editAdmissionForm, setEditAdmissionForm] = useState({
    patientId: '',
    patientType: '',
    patientAppointmentId: '',
    emergencyBedSlotId: '',
    roomBedId: '',
    roomBedsId: '',
    roomType: '',
    admittedBy: '',
    admittedByDoctorId: '',
    doctorId: '',
    diagnosis: '',
    roomAllocationDate: '',
    admissionStatus: 'Active',
    status: 'Active',
    caseSheet: '',
    caseDetails: '',
    isLinkedToICU: 'No',
    patientNo: '',
    age: '',
    gender: '',
    patientName: '',
    bedNumber: '',
    appointmentTokenNo: '',
    appointmentDate: '',
    emergencyBedNo: '',
    eBedSlotNo: '',
    emergencyAdmissionDate: '',
    roomVacantDate: '',
    shiftToAnotherRoom: 'No',
    shiftedTo: '',
    shiftedToDetails: '',
    scheduleOT: 'No',
    otAdmissionId: '',
    icuAdmissionId: '',
    billId: '',
    estimatedStay: '',
    createdAt: '',
    createdDate: '',
    roomAdmissionId: ''
  });
  const [editPatientSearchTerm, setEditPatientSearchTerm] = useState('');
  const [editRoomBedSearchTerm, setEditRoomBedSearchTerm] = useState('');
  const [editDoctorSearchTerm, setEditDoctorSearchTerm] = useState('');
  const [editAvailableAppointments, setEditAvailableAppointments] = useState<any[]>([]);
  const [editAvailableEmergencyBedSlots, setEditAvailableEmergencyBedSlots] = useState<any[]>([]);
  const [editAvailableIPDAdmissions, setEditAvailableIPDAdmissions] = useState<any[]>([]);
  
  // Refs for Edit dialog search inputs and dropdowns
  const editPatientInputRef = useRef<HTMLInputElement>(null);
  const editRoomBedInputRef = useRef<HTMLInputElement>(null);
  const editDoctorInputRef = useRef<HTMLInputElement>(null);
  const editPatientDropdownRef = useRef<HTMLDivElement>(null);
  const editRoomBedDropdownRef = useRef<HTMLDivElement>(null);
  const editDoctorDropdownRef = useRef<HTMLDivElement>(null);
  
  // State for Edit dialog search filters (FrontDesk pattern)
  const [editPatientHighlightIndex, setEditPatientHighlightIndex] = useState(-1);
  const [editRoomBedHighlightIndex, setEditRoomBedHighlightIndex] = useState(-1);
  const [editDoctorHighlightIndex, setEditDoctorHighlightIndex] = useState(-1);
  const [showEditPatientDropdown, setShowEditPatientDropdown] = useState(false);
  const [showEditRoomBedDropdown, setShowEditRoomBedDropdown] = useState(false);
  const [showEditDoctorDropdown, setShowEditDoctorDropdown] = useState(false);
  const [editPatientVisibleCount, setEditPatientVisibleCount] = useState(10);
  const [editRoomBedVisibleCount, setEditRoomBedVisibleCount] = useState(10);
  const [editDoctorVisibleCount, setEditDoctorVisibleCount] = useState(10);
  const [editPatientLoadingMore, setEditPatientLoadingMore] = useState(false);
  const [editRoomBedLoadingMore, setEditRoomBedLoadingMore] = useState(false);
  const [editDoctorLoadingMore, setEditDoctorLoadingMore] = useState(false);
  const [editPatientDropdownPosition, setEditPatientDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [editRoomBedDropdownPosition, setEditRoomBedDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [editDoctorDropdownPosition, setEditDoctorDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  
  // Refs for Create dialog search inputs and dropdowns
  const addPatientInputRef = useRef<HTMLInputElement>(null);
  const addRoomBedInputRef = useRef<HTMLInputElement>(null);
  const addDoctorInputRef = useRef<HTMLInputElement>(null);
  const addPatientDropdownRef = useRef<HTMLDivElement>(null);
  const addRoomBedDropdownRef = useRef<HTMLDivElement>(null);
  const addDoctorDropdownRef = useRef<HTMLDivElement>(null);
  
  // State for Create dialog search filters (FrontDesk pattern)
  const [addPatientHighlightIndex, setAddPatientHighlightIndex] = useState(-1);
  const [addRoomBedHighlightIndex, setAddRoomBedHighlightIndex] = useState(-1);
  const [addDoctorHighlightIndex, setAddDoctorHighlightIndex] = useState(-1);
  const [showAddPatientDropdown, setShowAddPatientDropdown] = useState(false);
  const [showAddRoomBedDropdown, setShowAddRoomBedDropdown] = useState(false);
  const [showAddDoctorDropdown, setShowAddDoctorDropdown] = useState(false);
  const [addPatientVisibleCount, setAddPatientVisibleCount] = useState(10);
  const [addRoomBedVisibleCount, setAddRoomBedVisibleCount] = useState(10);
  const [addDoctorVisibleCount, setAddDoctorVisibleCount] = useState(10);
  const [addPatientLoadingMore, setAddPatientLoadingMore] = useState(false);
  const [addRoomBedLoadingMore, setAddRoomBedLoadingMore] = useState(false);
  const [addDoctorLoadingMore, setAddDoctorLoadingMore] = useState(false);
  const [addPatientDropdownPosition, setAddPatientDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [addRoomBedDropdownPosition, setAddRoomBedDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [addDoctorDropdownPosition, setAddDoctorDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  
  // New Lab Order Dialog State
  const [isNewLabOrderDialogOpen, setIsNewLabOrderDialogOpen] = useState(false);
  const [selectedAdmissionForLabOrder, setSelectedAdmissionForLabOrder] = useState<Admission | null>(null);
  const [labOrderFormData, setLabOrderFormData] = useState({
    patientId: '',
    roomAdmissionId: '',
    labTestId: '',
    priority: 'Normal',
    orderedDate: '',
    orderedBy: '',
    description: '',
    charges: '',
    patientType: 'IPD',
    appointmentId: '',
    emergencyBedSlotId: '',
    labTestDone: 'No',
    reportsUrl: '',
    testStatus: 'Pending',
    testDoneDateTime: ''
  });
  const [labOrderSubmitting, setLabOrderSubmitting] = useState(false);
  const [labOrderSubmitError, setLabOrderSubmitError] = useState<string | null>(null);
  const [availableLabTests, setAvailableLabTests] = useState<LabTest[]>([]);
  const [labTestSearchTerm, setLabTestSearchTerm] = useState('');
  const [showLabTestList, setShowLabTestList] = useState(false);
  
  // State for Add New Admission form
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [roomBedSearchTerm, setRoomBedSearchTerm] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [patientOptions, setPatientOptions] = useState<any[]>([]);
  const [roomBedOptions, setRoomBedOptions] = useState<any[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<any[]>([]);
  const [availableAppointments, setAvailableAppointments] = useState<any[]>([]);
  const [availableEmergencyBedSlots, setAvailableEmergencyBedSlots] = useState<any[]>([]);
  const [availableIPDAdmissions, setAvailableIPDAdmissions] = useState<any[]>([]);
  const [roomAllocationDate, setRoomAllocationDate] = useState<Date | null>(null);
  const [roomVacantDate, setRoomVacantDate] = useState<Date | null>(null);
  const [addAdmissionForm, setAddAdmissionForm] = useState({
    patientId: '',
    patientType: '',
    patientAppointmentId: '',
    emergencyBedSlotId: '',
    roomBedId: '',
    roomBedsId: '',
    roomType: '',
    admittedBy: '',
    admittedByDoctorId: '',
    doctorId: '',
    diagnosis: '',
    roomAllocationDate: '',
    admissionStatus: 'Active',
    status: 'Active',
    caseSheet: '',
    caseDetails: '',
    isLinkedToICU: 'No',
    patientNo: '',
    age: '',
    gender: '',
    patientName: '',
    bedNumber: '',
    appointmentTokenNo: '',
    appointmentDate: '',
    emergencyBedNo: '',
    eBedSlotNo: '',
    emergencyAdmissionDate: '',
    roomVacantDate: '',
        shiftToAnotherRoom: 'No',
        shiftedTo: '',
        shiftedToDetails: '',
        scheduleOT: 'No',
    otAdmissionId: '',
    icuAdmissionId: '',
    billId: '',
    estimatedStay: '',
    createdAt: '',
    createdDate: '',
  });
  const [savingAdmission, setSavingAdmission] = useState(false);
  const [admissionError, setAdmissionError] = useState<string | null>(null);
  // Validation error states for Add Admission dialog
  const [addPatientError, setAddPatientError] = useState('');
  const [addPatientTypeError, setAddPatientTypeError] = useState('');
  const [addRoomBedError, setAddRoomBedError] = useState('');
  const [addDoctorError, setAddDoctorError] = useState('');
  const [addRoomAllocationDateError, setAddRoomAllocationDateError] = useState('');
  const [addAdmissionStatusError, setAddAdmissionStatusError] = useState('');
  // Validation error states for Edit Admission dialog
  const [editPatientError, setEditPatientError] = useState('');
  const [editPatientTypeError, setEditPatientTypeError] = useState('');
  const [editRoomBedError, setEditRoomBedError] = useState('');
  const [editDoctorError, setEditDoctorError] = useState('');
  const [editRoomAllocationDateError, setEditRoomAllocationDateError] = useState('');
  const [editAdmissionStatusError, setEditAdmissionStatusError] = useState('');

  const navigate = useNavigate();
  
  const handleManageCase = (admission: Admission) => {
    const roomAdmissionId = admission.roomAdmissionId || admission.admissionId;
    if (roomAdmissionId) {
      navigate(`/manage-ipd-admission?roomAdmissionId=${roomAdmissionId}`);
    }
  };

  // Handler to open Edit dialog and pre-populate form
  const handleEditAdmission = async (admission: Admission) => {
    // Get roomAdmissionId from the admission
    const roomAdmissionId = admission.roomAdmissionId || admission.admissionId;
    
    if (!roomAdmissionId) {
      console.error('Cannot edit admission: Room Admission ID is missing');
      setAdmissionError('Cannot edit admission: Room Admission ID is missing');
      return;
    }

    try {
      setSavingAdmission(true);
      setAdmissionError(null);

      // Fetch admission details from API using roomAdmissionId
      console.log('Fetching admission with roomAdmissionId:', roomAdmissionId);
      const fetchedAdmission = await apiRequest<any>(`/room-admissions/${roomAdmissionId}`);
      console.log('Fetched admission response:', fetchedAdmission);
      const admissionData = fetchedAdmission?.data || fetchedAdmission;
      console.log('Admission data after extraction:', admissionData);
      
      if (!admissionData) {
        throw new Error(`Admission with id ${roomAdmissionId} not found`);
      }

      // Set the fetched admission as editingAdmission
      setEditingAdmission(admissionData as Admission);
      
      // Load patient, room bed, and doctor options
      let roomBedsList: any[] = [];
      try {
        const patientsList = await admissionsApi.getPatientRegistrations();
        setPatientOptions(patientsList || []);
        
        roomBedsList = await roomBedsApi.getAll();
        setRoomBedOptions(roomBedsList || []);
        
        const doctorsList = await doctorsApi.getAll();
        setDoctorOptions(doctorsList || []);
      } catch (err) {
        console.error('Error loading options for edit:', err);
      }

      // Pre-populate form with fetched admission data
      // Helper to extract field with multiple name variations
      const getField = (obj: any, ...variations: string[]) => {
        for (const variation of variations) {
          if (obj?.[variation] !== undefined && obj?.[variation] !== null && obj?.[variation] !== '') {
            return obj[variation];
          }
        }
        return '';
      };

      const admissionStatusValue = getField(admissionData, 'AdmissionStatus', 'admissionStatus') || 'Active';
      const normalizedAdmissionStatus = (admissionStatusValue === 'Discharged' || 
                                         admissionStatusValue === 'Moved to ICU' || 
                                         admissionStatusValue === 'Moved To ICU' ||
                                         admissionStatusValue === 'Surgery Scheduled' || 
                                         admissionStatusValue === 'Active') 
                                         ? admissionStatusValue 
                                         : 'Active';
      
      // Extract Status field separately (Active/Inactive)
      const statusValue = getField(admissionData, 'Status', 'status') || 'Active';
      const normalizedStatus = (statusValue === 'Active' || statusValue === 'Inactive') ? statusValue : 'Active';
      
      // Extract isLinkedToICU and convert to Yes/No
      const isLinkedToICUValue = getField(admissionData, 'IsLinkedToICU', 'isLinkedToICU');
      let isLinkedToICUString = 'No';
      if (isLinkedToICUValue !== undefined && isLinkedToICUValue !== null && isLinkedToICUValue !== '') {
        if (typeof isLinkedToICUValue === 'boolean') {
          isLinkedToICUString = isLinkedToICUValue ? 'Yes' : 'No';
        } else if (typeof isLinkedToICUValue === 'string') {
          const lower = String(isLinkedToICUValue).toLowerCase();
          isLinkedToICUString = (lower === 'true' || lower === 'yes' || lower === '1') ? 'Yes' : 'No';
        }
      }
      
      // Extract scheduleOT and convert to Yes/No
      const scheduleOTValue = getField(admissionData, 'ScheduleOT', 'scheduleOT');
      let scheduleOTString = 'No';
      if (scheduleOTValue !== undefined && scheduleOTValue !== null && scheduleOTValue !== '') {
        if (typeof scheduleOTValue === 'boolean') {
          scheduleOTString = scheduleOTValue ? 'Yes' : 'No';
        } else if (typeof scheduleOTValue === 'string') {
          const lower = String(scheduleOTValue).toLowerCase();
          scheduleOTString = (lower === 'true' || lower === 'yes' || lower === '1') ? 'Yes' : 'No';
        }
      }

      // Extract shiftToAnotherRoom and convert to Yes/No
      const shiftToAnotherRoomValue = getField(admissionData, 'ShiftToAnotherRoom', 'shiftToAnotherRoom');
      let shiftToAnotherRoomString = 'No';
      if (shiftToAnotherRoomValue !== undefined && shiftToAnotherRoomValue !== null && shiftToAnotherRoomValue !== '') {
        if (typeof shiftToAnotherRoomValue === 'boolean') {
          shiftToAnotherRoomString = shiftToAnotherRoomValue ? 'Yes' : 'No';
        } else if (typeof shiftToAnotherRoomValue === 'string') {
          const lower = String(shiftToAnotherRoomValue).toLowerCase();
          shiftToAnotherRoomString = (lower === 'true' || lower === 'yes' || lower === '1') ? 'Yes' : 'No';
        }
      }

      // Extract room bed IDs
      const roomBedsIdFromApi = String(getField(admissionData, 'RoomBedsId', 'roomBedsId', 'roomBedId', 'RoomBedId') || '');
      
      // Find the room bed by matching RoomBedsId or bedNumber with roomBedOptions
      let foundRoomBedId = '';
      let foundRoomBedsId = roomBedsIdFromApi;
      if (roomBedsList.length > 0) {
        const matchingBed = roomBedsList.find((bed: any) => {
          const bedId = String((bed as any).roomBedId || (bed as any).RoomBedsId || (bed as any).id || '');
          const bedNo = (bed as any).bedNo || (bed as any).BedNo || '';
          const apiBedNo = getField(admissionData, 'BedNo', 'bedNumber', 'bedNo');
          return bedId === roomBedsIdFromApi || bedNo === apiBedNo;
        });
        
        if (matchingBed) {
          foundRoomBedId = String(
            (matchingBed as any).roomBedId ||
            (matchingBed as any).RoomBedsId ||
            (matchingBed as any).id ||
            ''
          );
          foundRoomBedsId = String(
            (matchingBed as any).RoomBedsId ||
            (matchingBed as any).roomBedsId ||
            (matchingBed as any).roomBedId ||
            (matchingBed as any).id ||
            ''
          );
        }
      }

      // Resolve doctor ID from admission
      const resolvedDoctorId = String(getField(admissionData, 'AdmittingDoctorId', 'admittingDoctorId', 'doctorId', 'DoctorId', 'admittedByDoctorId', 'AdmittedByDoctorId') || '');

      // Extract patient type
      const patientType = getField(admissionData, 'PatientType', 'patientType') || '';
      const patientId = getField(admissionData, 'PatientId', 'patientId') || '';
      const patientName = getField(admissionData, 'PatientName', 'patientName') || '';
      const patientNo = getField(admissionData, 'PatientNo', 'patientNo') || '';
      const bedNumber = getField(admissionData, 'BedNo', 'bedNumber', 'bedNo') || '';
      const roomNo = getField(admissionData, 'RoomNo', 'roomNo', 'roomNumber') || '';
      const roomType = getField(admissionData, 'RoomType', 'roomType') || '';
      const admittedBy = getField(admissionData, 'AdmittingDoctorName', 'admittingDoctorName', 'admittedBy', 'AdmittedBy') || '';
      
      // Extract dates - use admission.admissionDate as source of truth (same as displayed in table)
      // The admission object already has the correct date in DD-MM-YYYY format
      let roomAllocationDate = '';
      
      // First, try to use the admission object's admissionDate (source of truth from table)
      const admissionDateFromTable = admission.admissionDate;
      if (admissionDateFromTable) {
        try {
          // Handle DD-MM-YYYY format (e.g., "11-01-2026" or "11-01-2026 00:00")
          let dateStr = String(admissionDateFromTable);
          if (dateStr.includes(' ')) {
            dateStr = dateStr.split(' ')[0]; // Extract date part if it has time
          }
          
          // Check if it's in DD-MM-YYYY format
          if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
            const [day, month, year] = dateStr.split('-').map(Number);
            // Format as YYYY-MM-DD for form state (no Date object creation to avoid timezone issues)
            roomAllocationDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          }
        } catch (e) {
          console.error('Error parsing admissionDate from table:', e);
        }
      }
      
      // Fallback to API data if admissionDate is not available
      if (!roomAllocationDate) {
        const roomAllocationDateRaw = getField(admissionData, 'RoomAllocationDate', 'roomAllocationDate', 'admissionDate', 'AdmissionDate');
        if (roomAllocationDateRaw) {
          try {
            // Handle DD-MM-YYYY format (e.g., "11-01-2026" or "11-01-2026 00:00")
            let dateStr = String(roomAllocationDateRaw);
            if (dateStr.includes(' ')) {
              dateStr = dateStr.split(' ')[0]; // Extract date part if it has time
            }
            
            // Check if it's in DD-MM-YYYY format
            if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
              const [day, month, year] = dateStr.split('-').map(Number);
              // Format as YYYY-MM-DD for form state (no Date object creation to avoid timezone issues)
              roomAllocationDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            } else {
              // Try parsing as standard date format
              const date = new Date(roomAllocationDateRaw);
              if (!isNaN(date.getTime())) {
                roomAllocationDate = date.toISOString().split('T')[0];
              }
            }
          } catch (e) {
            console.error('Error parsing roomAllocationDate from API:', e);
          }
        }
      }
      
      if (!roomAllocationDate) {
        roomAllocationDate = new Date().toISOString().split('T')[0];
      }

      const roomVacantDateRaw = getField(admissionData, 'RoomVacantDate', 'roomVacantDate');
      let roomVacantDate = '';
      if (roomVacantDateRaw) {
        try {
          // Handle DD-MM-YYYY format (e.g., "11-01-2026" or "11-01-2026 00:00")
          let dateStr = String(roomVacantDateRaw);
          if (dateStr.includes(' ')) {
            dateStr = dateStr.split(' ')[0]; // Extract date part if it has time
          }
          
          // Check if it's in DD-MM-YYYY format
          if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
            const [day, month, year] = dateStr.split('-').map(Number);
            // Format as YYYY-MM-DD for form state (no Date object creation to avoid timezone issues)
            roomVacantDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          } else if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
            // Already in YYYY-MM-DD format
            roomVacantDate = dateStr.split(' ')[0].split('T')[0];
          } else {
            // Try parsing as standard date format
            const date = new Date(roomVacantDateRaw);
            if (!isNaN(date.getTime())) {
              roomVacantDate = date.toISOString().split('T')[0];
            }
          }
        } catch (e) {
          console.error('Error parsing roomVacantDate:', e);
        }
      }

      setEditAdmissionForm({
        patientId: patientId,
        patientType: patientType,
        patientAppointmentId: String(getField(admissionData, 'PatientAppointmentId', 'patientAppointmentId', 'appointmentId', 'AppointmentId') || ''),
        emergencyBedSlotId: String(getField(admissionData, 'EmergencyAdmissionId', 'emergencyAdmissionId', 'emergencyBedSlotId', 'EmergencyBedSlotId') || ''),
        roomBedId: foundRoomBedId || foundRoomBedsId,
        roomBedsId: foundRoomBedsId,
        roomType: roomType,
        admittedBy: admittedBy,
        admittedByDoctorId: resolvedDoctorId,
        doctorId: resolvedDoctorId,
        diagnosis: getField(admissionData, 'Diagnosis', 'diagnosis') || '',
        roomAllocationDate: roomAllocationDate,
        admissionStatus: normalizedAdmissionStatus,
        caseSheet: getField(admissionData, 'CaseSheet', 'caseSheet') || '',
        caseDetails: getField(admissionData, 'CaseSheetDetails', 'caseSheetDetails', 'caseDetails') || '',
        isLinkedToICU: isLinkedToICUString,
        patientNo: patientNo,
        age: getField(admissionData, 'Age', 'age') ? String(getField(admissionData, 'Age', 'age')) : '',
        gender: getField(admissionData, 'Gender', 'gender') || '',
        patientName: patientName,
        bedNumber: bedNumber,
        appointmentTokenNo: String(getField(admissionData, 'AppointmentTokenNo', 'appointmentTokenNo') || ''),
        appointmentDate: getField(admissionData, 'AppointmentDate', 'appointmentDate') ? new Date(getField(admissionData, 'AppointmentDate', 'appointmentDate')).toISOString().split('T')[0] : '',
        emergencyBedNo: getField(admissionData, 'EmergencyBedNo', 'emergencyBedNo') || '',
        eBedSlotNo: getField(admissionData, 'EBedSlotNo', 'eBedSlotNo') || '',
        emergencyAdmissionDate: getField(admissionData, 'EmergencyAdmissionDate', 'emergencyAdmissionDate') ? new Date(getField(admissionData, 'EmergencyAdmissionDate', 'emergencyAdmissionDate')).toISOString().split('T')[0] : '',
        roomVacantDate: roomVacantDate,
        shiftToAnotherRoom: shiftToAnotherRoomString,
        shiftedTo: getField(admissionData, 'ShiftedTo', 'shiftedTo') || '',
        shiftedToDetails: getField(admissionData, 'ShiftedToDetails', 'shiftedToDetails') || '',
        scheduleOT: scheduleOTString,
        otAdmissionId: String(getField(admissionData, 'OTAdmissionId', 'otAdmissionId') || ''),
        icuAdmissionId: String(getField(admissionData, 'ICUAdmissionId', 'icuAdmissionId') || ''),
        billId: String(getField(admissionData, 'BillId', 'billId') || ''),
        estimatedStay: getField(admissionData, 'EstimatedStay', 'estimatedStay') || '',
        createdAt: getField(admissionData, 'CreatedAt', 'createdAt', 'AllocatedAt', 'allocatedAt') || '',
        createdDate: getField(admissionData, 'CreatedDate', 'createdDate') || '',
        roomAdmissionId: String(roomAdmissionId),
        status: normalizedStatus // This is the Status field (Active/Inactive), separate from AdmissionStatus
      });
      setEditPatientSearchTerm(patientName);
      setEditRoomBedSearchTerm(`${bedNumber}${roomType ? ` (${roomType})` : ''}${roomNo ? ` - ${roomNo}` : ''}`);
      setEditDoctorSearchTerm(admittedBy);
      
      // Fetch conditional data based on patient type
      if (patientType === 'OPD' && patientId) {
        const appointments = await fetchPatientAppointments(patientId);
        setEditAvailableAppointments(appointments || []);
      } else if (patientType === 'Emergency' && patientId) {
        const slots = await fetchPatientEmergencyBedSlots(patientId);
        setEditAvailableEmergencyBedSlots(slots || []);
      } else if (patientType === 'IPD' && patientId) {
        const ipdAdmissions = await fetchPatientIPDAdmissions(patientId);
        setEditAvailableIPDAdmissions(ipdAdmissions || []);
      }
      
      setIsEditDialogOpen(true);
    } catch (error: any) {
      console.error('Error fetching admission details:', error);
      setAdmissionError(error?.message || 'Failed to fetch admission details. Please try again.');
    } finally {
      setSavingAdmission(false);
    }
  };

  // Handle opening New Lab Order dialog
  const handleOpenNewLabOrderDialog = async (admission: Admission) => {
    setSelectedAdmissionForLabOrder(admission);
    
    // Fetch available lab tests
    try {
      const labTests = await labTestsApi.getAll();
      setAvailableLabTests(labTests);
    } catch (err) {
      console.error('Error fetching lab tests:', err);
    }
    
    // Extract PatientId with fallbacks
    const patientIdValue = (admission as any).patientId || 
                          (admission as any).PatientId || 
                          (admission as any).PatientID || 
                          (admission as any).patient_id || 
                          (admission as any).Patient_ID || 
                          '';
    
    // Extract RoomAdmissionId with fallbacks
    const roomAdmissionIdValue = admission.roomAdmissionId || 
                                admission.admissionId || 
                                (admission as any).RoomAdmissionId || 
                                (admission as any).room_admission_id || 
                                (admission as any).id || 
                                '';
    
    setLabOrderFormData({
      patientId: String(patientIdValue),
      roomAdmissionId: String(roomAdmissionIdValue),
      labTestId: '',
      priority: 'Normal',
      orderedDate: new Date().toISOString().split('T')[0],
      orderedBy: '',
      description: '',
      charges: '',
      patientType: 'IPD',
      appointmentId: '',
      emergencyBedSlotId: '',
      labTestDone: 'No',
      reportsUrl: '',
      testStatus: 'Pending',
      testDoneDateTime: ''
    });
    setLabTestSearchTerm('');
    setShowLabTestList(false);
    setLabOrderSubmitError(null);
    setIsNewLabOrderDialogOpen(true);
  };

  // Handle saving New Lab Order
  const handleSaveLabOrder = async () => {
    try {
      setLabOrderSubmitting(true);
      setLabOrderSubmitError(null);

      if (!selectedAdmissionForLabOrder) {
        throw new Error('Admission data is missing');
      }

      // Validate required fields
      if (!labOrderFormData.roomAdmissionId || labOrderFormData.roomAdmissionId === 'undefined' || labOrderFormData.roomAdmissionId === '') {
        throw new Error('Room Admission ID is required');
      }

      let patientIdValue = labOrderFormData.patientId;
      if (!patientIdValue || patientIdValue === 'undefined' || patientIdValue === '' || patientIdValue === 'null') {
        patientIdValue = (selectedAdmissionForLabOrder as any)?.patientId ||
                        (selectedAdmissionForLabOrder as any)?.PatientId ||
                        (selectedAdmissionForLabOrder as any)?.PatientID ||
                        (selectedAdmissionForLabOrder as any)?.patient_id ||
                        (selectedAdmissionForLabOrder as any)?.Patient_ID ||
                        '';
      }

      if (!patientIdValue || patientIdValue === 'undefined' || patientIdValue === '' || patientIdValue === 'null') {
        throw new Error('Patient ID is required');
      }

      if (!labOrderFormData.labTestId || labOrderFormData.labTestId === '') {
        throw new Error('Lab Test is required. Please select a lab test.');
      }

      if (!labOrderFormData.orderedDate) {
        throw new Error('Ordered Date is required');
      }

      if (!labOrderFormData.patientType || labOrderFormData.patientType === '') {
        throw new Error('Patient Type is required');
      }

      // Get selected lab test details
      const selectedLabTest = availableLabTests.find((lt: LabTest) => {
        const lid = (lt as any).labTestId || (lt as any).id || '';
        return String(lid) === labOrderFormData.labTestId;
      });
      if (!selectedLabTest) {
        throw new Error('Selected lab test details not found.');
      }

      // Prepare the request payload
      const payload: any = {
        RoomAdmissionId: Number(labOrderFormData.roomAdmissionId),
        PatientId: String(patientIdValue).trim(),
        LabTestId: Number(labOrderFormData.labTestId),
        Priority: labOrderFormData.priority || 'Normal',
        OrderedDate: labOrderFormData.orderedDate,
        PatientType: labOrderFormData.patientType,
        LabTestDone: labOrderFormData.labTestDone || 'No',
        TestStatus: labOrderFormData.testStatus || 'Pending',
      };

      // Add conditional fields based on PatientType
      if (labOrderFormData.patientType === 'OPD') {
        if (labOrderFormData.appointmentId && labOrderFormData.appointmentId.trim() !== '') {
          payload.AppointmentId = String(labOrderFormData.appointmentId).trim();
        }
      }
      if (labOrderFormData.patientType === 'IPD') {
        if (labOrderFormData.roomAdmissionId && labOrderFormData.roomAdmissionId.trim() !== '') {
          payload.RoomAdmissionId = Number(labOrderFormData.roomAdmissionId);
        }
      }
      if (labOrderFormData.patientType === 'Emergency') {
        if (labOrderFormData.emergencyBedSlotId && labOrderFormData.emergencyBedSlotId.trim() !== '') {
          payload.EmergencyBedSlotId = String(labOrderFormData.emergencyBedSlotId).trim();
        }
      }

      // Add optional fields
      if (labOrderFormData.orderedBy && labOrderFormData.orderedBy.trim() !== '') {
        payload.OrderedBy = labOrderFormData.orderedBy.trim();
      }
      if (labOrderFormData.description && labOrderFormData.description.trim() !== '') {
        payload.Description = labOrderFormData.description.trim();
      }
      if (labOrderFormData.charges && labOrderFormData.charges.trim() !== '') {
        payload.Charges = Number(labOrderFormData.charges);
      } else if ((selectedLabTest as any).charges) {
        payload.Charges = Number((selectedLabTest as any).charges);
      }
      if (labOrderFormData.reportsUrl && labOrderFormData.reportsUrl.trim() !== '') {
        payload.ReportsUrl = labOrderFormData.reportsUrl.trim();
      }
      if (labOrderFormData.testDoneDateTime && labOrderFormData.testDoneDateTime.trim() !== '') {
        try {
          const date = new Date(labOrderFormData.testDoneDateTime);
          if (!isNaN(date.getTime())) {
            payload.TestDoneDateTime = date.toISOString();
          } else {
            payload.TestDoneDateTime = labOrderFormData.testDoneDateTime;
          }
        } catch (e) {
          payload.TestDoneDateTime = labOrderFormData.testDoneDateTime;
        }
      }

      console.log('API Payload:', JSON.stringify(payload, null, 2));
      console.log('API Endpoint: POST /patient-lab-tests');

      // Call the API to create the patient lab test
      const response = await apiRequest<any>('/patient-lab-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log(`Lab order created for patient ${labOrderFormData.patientId}`);

      console.log('Lab order created successfully:', response);

      // Close dialog
      setIsNewLabOrderDialogOpen(false);
      setSelectedAdmissionForLabOrder(null);

      // Reset form
      setLabOrderFormData({
        patientId: '',
        roomAdmissionId: '',
        labTestId: '',
        priority: 'Normal',
        orderedDate: '',
        orderedBy: '',
        description: '',
        charges: '',
        patientType: 'IPD',
        appointmentId: '',
        emergencyBedSlotId: '',
        labTestDone: 'No',
        reportsUrl: '',
        testStatus: 'Pending',
        testDoneDateTime: ''
      });
      setLabTestSearchTerm('');
      setShowLabTestList(false);

      alert('Lab order created successfully!');
    } catch (err) {
      console.error('Error saving lab order:', err);
      setLabOrderSubmitError(err instanceof Error ? err.message : 'Failed to save lab order');
    } finally {
      setLabOrderSubmitting(false);
    }
  };


  // Fetch appointments for a specific patient
  const fetchPatientAppointments = async (patientId: string) => {
    if (!patientId) {
      setAvailableAppointments([]);
      return [];
    }
    
    try {
      console.log('Fetching appointments for patient:', patientId);
      const response = await apiRequest<any>(`/patient-appointments/patient/${patientId}`);
      console.log('Patient appointments API response:', response);
      
      // Handle different response structures
      let appointments: any[] = [];
      
      if (Array.isArray(response)) {
        appointments = response;
      } else if (response?.data && Array.isArray(response.data)) {
        appointments = response.data;
      } else if (response?.appointments && Array.isArray(response.appointments)) {
        appointments = response.appointments;
      } else if (response?.patientAppointments && Array.isArray(response.patientAppointments)) {
        appointments = response.patientAppointments;
      }
      
      console.log('Mapped appointments:', appointments);
      setAvailableAppointments(appointments);
      return appointments;
    } catch (err) {
      console.error('Error fetching patient appointments:', err);
      setAvailableAppointments([]);
      return [];
    }
  };

  // Fetch emergency bed slots for a specific patient
  const fetchPatientEmergencyBedSlots = async (patientId: string) => {
    if (!patientId) {
      setAvailableEmergencyBedSlots([]);
      return [];
    }
    
    try {
      console.log('Fetching emergency bed slots for patient:', patientId);
      const response = await apiRequest<any>(`/emergency-admissions/patient/${patientId}`);
      console.log('Emergency bed slots API response:', response);
      
      // Handle different response structures
      let emergencyBedSlots: any[] = [];
      
      if (Array.isArray(response)) {
        emergencyBedSlots = response;
      } else if (response?.data && Array.isArray(response.data)) {
        emergencyBedSlots = response.data;
      } else if (response?.admissions && Array.isArray(response.admissions)) {
        emergencyBedSlots = response.admissions;
      } else if (response?.emergencyAdmissions && Array.isArray(response.emergencyAdmissions)) {
        emergencyBedSlots = response.emergencyAdmissions;
      } else if (response?.emergencyBedSlots && Array.isArray(response.emergencyBedSlots)) {
        emergencyBedSlots = response.emergencyBedSlots;
      }
      
      console.log('Mapped emergency bed slots:', emergencyBedSlots);
      setAvailableEmergencyBedSlots(emergencyBedSlots);
      return emergencyBedSlots;
    } catch (err) {
      console.error('Error fetching emergency bed slots:', err);
      setAvailableEmergencyBedSlots([]);
      return [];
    }
  };

  // Fetch IPD admissions for a specific patient
  const fetchPatientIPDAdmissions = async (patientId: string) => {
    if (!patientId) {
      setAvailableIPDAdmissions([]);
      return [];
    }
    
    try {
      console.log('Fetching IPD admissions for patient:', patientId);
      const response = await apiRequest<any>(`/room-admissions/patient/${patientId}`);
      console.log('IPD admissions API response:', response);
      
      // Handle different response structures
      let ipdAdmissions: any[] = [];
      
      if (Array.isArray(response)) {
        ipdAdmissions = response;
      } else if (response?.data && Array.isArray(response.data)) {
        ipdAdmissions = response.data;
      } else if (response?.admissions && Array.isArray(response.admissions)) {
        ipdAdmissions = response.admissions;
      } else if (response?.roomAdmissions && Array.isArray(response.roomAdmissions)) {
        ipdAdmissions = response.roomAdmissions;
      }
      
      console.log('Mapped IPD admissions:', ipdAdmissions);
      setAvailableIPDAdmissions(ipdAdmissions);
      return ipdAdmissions;
    } catch (err) {
      console.error('Error fetching IPD admissions:', err);
      setAvailableIPDAdmissions([]);
      return [];
    }
  };

  // Handle Patient Type change - fetch conditional data
  const handlePatientTypeChange = async (patientType: string) => {
    setAddAdmissionForm({
      ...addAdmissionForm,
      patientType: patientType,
      patientAppointmentId: '',
      emergencyBedSlotId: '',
      roomAdmissionId: ''
    });

    // Clear search terms to prevent residual dropdowns
    setRoomBedSearchTerm('');
    setDoctorSearchTerm('');

    // Clear conditional data if no patient type selected
    if (!patientType) {
      setAvailableAppointments([]);
      setAvailableEmergencyBedSlots([]);
      setAvailableIPDAdmissions([]);
      return;
    }

    try {
      if (patientType === 'OPD') {
        // If patient is already selected, fetch their appointments
        if (addAdmissionForm.patientId) {
          await fetchPatientAppointments(addAdmissionForm.patientId);
        } else {
          setAvailableAppointments([]);
        }
        setAvailableEmergencyBedSlots([]);
        setAvailableIPDAdmissions([]);
      } else if (patientType === 'Emergency') {
        // If patient is already selected, fetch their emergency admissions
        if (addAdmissionForm.patientId) {
          await fetchPatientEmergencyBedSlots(addAdmissionForm.patientId);
        } else {
          setAvailableEmergencyBedSlots([]);
        }
        setAvailableAppointments([]);
        setAvailableIPDAdmissions([]);
      } else if (patientType === 'IPD') {
        // If patient is already selected, fetch their IPD admissions
        if (addAdmissionForm.patientId) {
          await fetchPatientIPDAdmissions(addAdmissionForm.patientId);
        } else {
          setAvailableIPDAdmissions([]);
        }
        setAvailableAppointments([]);
        setAvailableEmergencyBedSlots([]);
      } else if (patientType === 'Direct') {
        // Direct type doesn't need conditional fields, clear all
        setAvailableAppointments([]);
        setAvailableEmergencyBedSlots([]);
        setAvailableIPDAdmissions([]);
      }
    } catch (err) {
      console.error(`Error fetching ${patientType} data:`, err);
    }
  };

  // Handler to save new admission
  const handleSaveAdmission = async () => {
    try {
      setSavingAdmission(true);
      setAdmissionError(null);
      
      // Clear previous validation errors
      setAddPatientError('');
      setAddPatientTypeError('');
      setAddRoomBedError('');
      setAddDoctorError('');
      setAddRoomAllocationDateError('');
      setAddAdmissionStatusError('');

      // Validate required fields for new admissions
      let hasErrors = false;
      
      if (!addAdmissionForm.patientId) {
        setAddPatientError('Please select a patient from the list.');
        hasErrors = true;
      }
      
      if (!addAdmissionForm.patientType) {
        setAddPatientTypeError('Please select a patient type.');
        hasErrors = true;
      } else {
        if (addAdmissionForm.patientType === 'OPD' && !addAdmissionForm.patientAppointmentId) {
          setAddPatientTypeError('Patient Appointment ID is required for OPD patients.');
          hasErrors = true;
        }
        if (addAdmissionForm.patientType === 'IPD' && !(addAdmissionForm as any).roomAdmissionId) {
          setAddPatientTypeError('Patient IPD Admission ID is required for IPD patients.');
          hasErrors = true;
        }
        if (addAdmissionForm.patientType === 'Emergency' && !addAdmissionForm.emergencyBedSlotId) {
          setAddPatientTypeError('Emergency Admission Bed No is required for Emergency patients.');
          hasErrors = true;
        }
      }
      
      if (!addAdmissionForm.roomBedId) {
        setAddRoomBedError('Please select a room/bed.');
        hasErrors = true;
      }
      
      if (!addAdmissionForm.admittedByDoctorId && !addAdmissionForm.doctorId) {
        setAddDoctorError('Please select a doctor from the list.');
        hasErrors = true;
      }
      
      if (!addAdmissionForm.roomBedsId) {
        setAddRoomBedError('Room/Bed ID is required.');
        hasErrors = true;
      }
      
      if (!addAdmissionForm.roomAllocationDate) {
        setAddRoomAllocationDateError('Room Allocation Date is required.');
        hasErrors = true;
      }

      // Validate admissionStatus is one of the allowed values
      const allowedAdmissionStatuses = ['Active', 'Moved To ICU', 'Surgery Scheduled', 'Discharged'];
      if (!addAdmissionForm.admissionStatus || !allowedAdmissionStatuses.includes(addAdmissionForm.admissionStatus)) {
        setAddAdmissionStatusError('Admission Status must be one of: Active, Moved To ICU, Surgery Scheduled, Discharged.');
        hasErrors = true;
      }
      
      if (hasErrors) {
        setSavingAdmission(false);
        return;
      }

      // Get selected patient details
      const selectedPatient = patientOptions.find((p: any) => {
        const pid = (p as any).patientId || (p as any).PatientId || '';
        return pid === addAdmissionForm.patientId;
      });

      if (!selectedPatient) {
        throw new Error('Selected patient not found');
      }

      // Get selected room/bed details
      const selectedBed = roomBedOptions.find((b: any) => {
        const bid = (b as any).roomBedId || (b as any).RoomBedsId || (b as any).id || '';
        return String(bid) === addAdmissionForm.roomBedId;
      });

      if (!selectedBed) {
        throw new Error('Selected room/bed not found');
      }

      // Extract patient details
      const patientId = (selectedPatient as any).patientId || (selectedPatient as any).PatientId || '';
      const patientName = (selectedPatient as any).patientName || (selectedPatient as any).PatientName || '';
      const lastName = (selectedPatient as any).lastName || (selectedPatient as any).LastName || '';
      const fullName = `${patientName} ${lastName}`.trim() || patientName;
      const age = Number((selectedPatient as any).age || (selectedPatient as any).Age || 0);
      const gender = (selectedPatient as any).gender || (selectedPatient as any).Gender || 'Unknown';

      // Extract room/bed details
      const bedNumber = (selectedBed as any).bedNo || (selectedBed as any).BedNo || '';
      const roomType = (selectedBed as any).roomType || (selectedBed as any).RoomType || addAdmissionForm.roomType || 'Regular Ward';
      const roomBedsId = (selectedBed as any).RoomBedsId || (selectedBed as any).roomBedsId || (selectedBed as any).roomBedId || (selectedBed as any).id || '';

      // Get doctor name and ID
      const doctorName = addAdmissionForm.admittedBy || '';
      const doctorId = addAdmissionForm.doctorId || addAdmissionForm.admittedByDoctorId || '';
      
      if (!doctorId) {
        throw new Error('Doctor ID is required. Please select a doctor.');
      }

      console.log('Doctor selection details:', {
        doctorId: doctorId,
        admittedByDoctorId: addAdmissionForm.admittedByDoctorId,
        doctorIdField: addAdmissionForm.doctorId,
        doctorName: doctorName
      });

      // Check room bed availability before proceeding
      try {
        console.log('Checking room bed availability, RoomBedsId:', roomBedsId, 'AllocationDate:', addAdmissionForm.roomAllocationDate);
        
        // Validate required parameters
        if (!roomBedsId) {
          throw new Error('RoomBedsId is required for availability check');
        }
        if (!addAdmissionForm.roomAllocationDate) {
          throw new Error('Room Allocation Date is required for availability check');
        }
        
        // Convert date to DD-MM-YYYY format for availability check API
        let allocationDateForCheck = addAdmissionForm.roomAllocationDate;
        if (allocationDateForCheck && /^\d{4}-\d{2}-\d{2}$/.test(allocationDateForCheck)) {
          const [year, month, day] = allocationDateForCheck.split('-');
          allocationDateForCheck = `${day}-${month}-${year}`;
        }
        
        // Call the room admissions availability check API
        const checkResponse = await apiRequest<any>(`/room-admissions/check-availability?RoomBedsId=${roomBedsId}&AllocationDate=${allocationDateForCheck}`, {
          method: 'GET',
        });
        
        console.log('Room bed availability check response:', checkResponse);
        
        // Check if bed is available
        // API response structure: { data: { isAvailable: true/false, ... } }
        // Also handle direct response: { isAvailable: true/false }
        const responseData = checkResponse?.data || checkResponse;
        
        const isAvailable = 
          responseData?.isAvailable === true ||
          responseData?.IsAvailable === true ||
          responseData?.available === true ||
          responseData?.Available === true ||
          (responseData?.status !== undefined && String(responseData.status).toLowerCase() === 'available') ||
          (responseData?.Status !== undefined && String(responseData.Status).toLowerCase() === 'available');
        
        console.log('Room bed availability result:', { isAvailable, responseData, checkResponse });
        
        if (!isAvailable) {
          throw new Error('The selected room bed is not available for the selected allocation date. Please select another room bed or choose a different date.');
        }
      } catch (checkError: any) {
        // If it's our custom error message, throw it
        if (checkError?.message && (checkError.message.includes('not available') || checkError.message.includes('already occupied') || checkError.message.includes('required'))) {
          throw checkError;
        }
        // If the API returns an error indicating unavailability, throw it
        if (checkError?.response?.data?.message || checkError?.message) {
          const errorMessage = checkError.response?.data?.message || checkError.message;
          if (errorMessage.toLowerCase().includes('not available') || 
              errorMessage.toLowerCase().includes('occupied') ||
              errorMessage.toLowerCase().includes('unavailable')) {
            throw new Error(errorMessage || 'The selected room bed is not available for the selected allocation date.');
          }
        }
        // If it's a network error or other issue, throw it to prevent booking
        console.error('Room bed availability check failed:', checkError);
        throw new Error('Failed to verify room bed availability. Please try again or contact support.');
      }

      // Convert roomAllocationDate from YYYY-MM-DD to DD-MM-YYYY format for backend
      let roomAllocationDateFormatted = '';
      if (addAdmissionForm.roomAllocationDate) {
        const dateStr = addAdmissionForm.roomAllocationDate;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          // Convert YYYY-MM-DD to DD-MM-YYYY
          const [year, month, day] = dateStr.split('-');
          roomAllocationDateFormatted = `${day}-${month}-${year}`;
        } else {
          roomAllocationDateFormatted = addAdmissionForm.roomAllocationDate;
        }
      }

      // Prepare admission data
      const admissionData: any = {
        patientId: patientId,
        patientName: fullName,
        age: age,
        gender: gender,
        admissionDate: convertToIST(new Date()).toISOString().split('T')[0], // Today's date in IST
        roomType: roomType as 'Regular Ward' | 'Special Shared Room' | 'Special Room',
        bedNumber: bedNumber,
        admittedBy: doctorName,
        diagnosis: addAdmissionForm.diagnosis || '',
        status: addAdmissionForm.status || 'Active',
        admissionStatus: addAdmissionForm.admissionStatus || 'Active',
        patientType: addAdmissionForm.patientType || '',
        roomBedsId: roomBedsId ? String(roomBedsId) : undefined,
        doctorId: doctorId ? String(doctorId) : undefined,
        admittedByDoctorId: doctorId ? String(doctorId) : undefined, // Also include as admittedByDoctorId for API
        roomAllocationDate: roomAllocationDateFormatted,
        roomVacantDate: addAdmissionForm.roomVacantDate || '',
        caseSheet: addAdmissionForm.caseSheet || '',
        caseSheetDetails: addAdmissionForm.caseDetails || '',
        isLinkedToICU: addAdmissionForm.isLinkedToICU || 'No',
        shiftToAnotherRoom: addAdmissionForm.shiftToAnotherRoom || 'No',
        shiftedTo: addAdmissionForm.shiftedTo || '',
        shiftedToDetails: addAdmissionForm.shiftedToDetails || '',
        scheduleOT: addAdmissionForm.scheduleOT || 'No',
        otAdmissionId: addAdmissionForm.otAdmissionId || '',
        icuAdmissionId: addAdmissionForm.icuAdmissionId || '',
        billId: addAdmissionForm.billId || '',
        estimatedStay: addAdmissionForm.estimatedStay || '',
        patientNo: addAdmissionForm.patientNo || '',
      };

      // Add conditional fields based on PatientType
      if (addAdmissionForm.patientType === 'OPD' && addAdmissionForm.patientAppointmentId) {
        admissionData.patientAppointmentId = String(addAdmissionForm.patientAppointmentId);
        admissionData.appointmentId = String(addAdmissionForm.patientAppointmentId);
      }
      if (addAdmissionForm.patientType === 'IPD' && addAdmissionForm.roomAdmissionId) {
        // The roomAdmissionId field contains the RoomAdmissionId from the dropdown selection
        admissionData.roomAdmissionId = String(addAdmissionForm.roomAdmissionId);
        admissionData.previousRoomAdmissionId = String(addAdmissionForm.roomAdmissionId);
      }
      if (addAdmissionForm.patientType === 'Emergency' && addAdmissionForm.emergencyBedSlotId) {
        // The emergencyBedSlotId field contains the EmergencyAdmissionId from the dropdown selection
        admissionData.emergencyAdmissionId = String(addAdmissionForm.emergencyBedSlotId);
        admissionData.emergencyBedSlotId = String(addAdmissionForm.emergencyBedSlotId);
      } 

      console.log('Saving admission with data:', admissionData);
      console.log('PatientType in admissionData:', admissionData.patientType);
      if (addAdmissionForm.patientType === 'Emergency' && admissionData.emergencyAdmissionId) {
        console.log('EmergencyAdmissionId being sent:', admissionData.emergencyAdmissionId);
      }

      // Call the API to create admission
      const createdAdmission = await admissionsApi.create(admissionData);
      console.log('Admission created successfully');

      // Refresh the admissions list
      await fetchAdmissions();
        
        // Create PatientICUAdmission record if isLinkedToICU is Yes
        if (addAdmissionForm.isLinkedToICU === 'Yes') {
          try {
            // Get ICU bed layout to find available ICU beds
            const icuBedLayout = await admissionsApi.getICUBedLayout();
            console.log('ICU Bed Layout:', icuBedLayout);
            
            // Find first available ICU bed or use first bed if none available
            let selectedICUBed: any = null;
            let selectedICUId: string = '';
            
            if (icuBedLayout && icuBedLayout.length > 0) {
              // Try to find an available bed
              selectedICUBed = icuBedLayout.find((bed: any) => {
                const status = bed.status || bed.Status || '';
                return status.toLowerCase() === 'available' || status.toLowerCase() === 'vacant';
              });
              
              // If no available bed, use first bed
              if (!selectedICUBed) {
                selectedICUBed = icuBedLayout[0];
              }
              
              // Extract ICU and bed IDs
              selectedICUId = selectedICUBed.icuId || selectedICUBed.ICUId || selectedICUBed.ICU_ID || '';
              const icuBedId = selectedICUBed.icuBedId || selectedICUBed.ICUBedId || selectedICUBed.id || '';
              const icuBedNo = selectedICUBed.bedNumber || selectedICUBed.bedNo || selectedICUBed.icuBedNo || selectedICUBed.ICUBedNo || '';
              
              // Get RoomAdmissionId - prioritize newly created admission ID, then fall back to form value
              const roomAdmissionId = createdAdmission?.roomAdmissionId || createdAdmission?.admissionId || createdAdmission?.id || 
                                      (addAdmissionForm.patientType === 'IPD' ? addAdmissionForm.roomAdmissionId : '') || '';
              
              // Prepare ICU admission payload with all fields from admission form
              const icuAdmissionPayload: any = {
                PatientId: String(patientId).trim(),
                PatientType: addAdmissionForm.patientType || 'Direct',
                ICUId: String(selectedICUId),
                ICUBedId: String(icuBedId),
                ICUBedNo: icuBedNo,
                ICUPatientStatus: 'Critical', // Default status
                ICUAllocationFromDate: addAdmissionForm.roomAllocationDate || new Date().toISOString().split('T')[0],
                ICUAllocationToDate: '', // Can be left empty
                Diagnosis: addAdmissionForm.diagnosis || '',
                TreatementDetails: addAdmissionForm.caseDetails || addAdmissionForm.caseSheet || '',
                PatientCondition: addAdmissionForm.caseDetails || '',
                OnVentilator: 'No', // Default
                ICUAdmissionStatus: 'Occupied',
                
                // Add AttendingDoctorId/DoctorId from admission
                ...(admissionData.doctorId ? {
                  AttendingDoctorId: String(admissionData.doctorId),
                  DoctorId: String(admissionData.doctorId)
                } : {}),
                
                // Add RoomAdmissionId if available (prioritize newly created, then form value for IPD)
                ...(roomAdmissionId ? {
                  RoomAdmissionId: String(roomAdmissionId)
                } : {}),
                
                // Add conditional fields based on PatientType
                ...(addAdmissionForm.patientType === 'OPD' && addAdmissionForm.patientAppointmentId ? {
                  AppointmentId: String(addAdmissionForm.patientAppointmentId),
                  PatientAppointmentId: String(addAdmissionForm.patientAppointmentId)
                } : {}),
                ...(addAdmissionForm.patientType === 'Emergency' && addAdmissionForm.emergencyBedSlotId ? {
                  EmergencyBedSlotId: String(addAdmissionForm.emergencyBedSlotId),
                  EmergencyAdmissionId: String(addAdmissionForm.emergencyBedSlotId)
                } : {}),
              };
              
              console.log('Creating PatientICUAdmission with payload:', icuAdmissionPayload);
              const icuAdmissionResponse = await admissionsApi.createPatientICUAdmission(icuAdmissionPayload);
              console.log('PatientICUAdmission created successfully:', icuAdmissionResponse);
              
              // Update admission with ICU admission ID if returned
              if (icuAdmissionResponse?.data?.patientICUAdmissionId || icuAdmissionResponse?.patientICUAdmissionId) {
                const icuAdmissionId = icuAdmissionResponse?.data?.patientICUAdmissionId || icuAdmissionResponse?.patientICUAdmissionId;
                if (createdAdmission?.roomAdmissionId || createdAdmission?.admissionId) {
                  const roomAdmissionIdForUpdate = createdAdmission.roomAdmissionId || createdAdmission.admissionId;
                  await admissionsApi.update({
                    ...admissionData,
                    roomAdmissionId: Number(roomAdmissionIdForUpdate),
                    icuAdmissionId: String(icuAdmissionId)
                  });
                  console.log('Admission updated with ICU Admission ID:', icuAdmissionId);
                }
              }
            } else {
              console.warn('No ICU beds available. Cannot create ICU admission.');
            }
          } catch (icuError: any) {
            console.error('Error creating PatientICUAdmission:', icuError);
            // Don't fail the entire admission creation if ICU admission fails
            // Just log the error
            console.warn('Admission created but ICU admission creation failed:', icuError?.message || 'Unknown error');
          }
        }

      // Refresh admissions list
      await fetchAdmissions();
      
      // Refresh room capacity and metrics
      await fetchRoomCapacityOverview();
      await fetchDashboardMetrics();

      // Close dialog and reset form
      setIsDialogOpen(false);
      setPatientSearchTerm('');
      setRoomBedSearchTerm('');
      setDoctorSearchTerm('');
      setAddAdmissionForm({
        patientId: '',
        roomBedId: '',
        roomBedsId: '',
        patientType: '',
        patientAppointmentId: '',
        emergencyBedSlotId: '',
        roomType: '',
        admittedBy: '',
        admittedByDoctorId: '',
        doctorId: '',
        diagnosis: '',
        roomAllocationDate: '',
        admissionStatus: 'Active',
        caseSheet: '',
        caseDetails: '',
        isLinkedToICU: 'No',
        patientNo: '',
        age: '',
        gender: '',
        patientName: '',
        bedNumber: '',
        appointmentTokenNo: '',
        appointmentDate: '',
        emergencyBedNo: '',
        eBedSlotNo: '',
        emergencyAdmissionDate: '',
        roomVacantDate: '',
        shiftToAnotherRoom: '',
        shiftedTo: '',
        shiftedToDetails: '',
        scheduleOT: '',
        otAdmissionId: '',
        icuAdmissionId: '',
        billId: '',
        estimatedStay: '',
        createdAt: '',
        createdDate: '',
      });
      setAvailableAppointments([]);
      setAvailableEmergencyBedSlots([]);
      setAvailableIPDAdmissions([]);
      setAdmissionError(null);
    } catch (error: any) {
      console.error('Error saving admission:', error);
      setAdmissionError(error?.message || 'Failed to save admission. Please try again.');
    } finally {
      setSavingAdmission(false);
    }
  };

  // Fetch room capacity overview and dashboard metrics on component mount
  useEffect(() => {
    fetchRoomCapacityOverview();
    fetchDashboardMetrics();
  }, [fetchRoomCapacityOverview, fetchDashboardMetrics]);

  // Sync roomAllocationDate state with form data
  useEffect(() => {
    if (addAdmissionForm.roomAllocationDate) {
      try {
        const dateStr = addAdmissionForm.roomAllocationDate;
        // Handle YYYY-MM-DD format
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [year, month, day] = dateStr.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          if (!isNaN(date.getTime())) {
            setRoomAllocationDate(date);
          }
        }
      } catch {
        // If parsing fails, keep current state
      }
    } else {
      setRoomAllocationDate(null);
    }
  }, [addAdmissionForm.roomAllocationDate]);

  // Update Edit dialog dropdown positions when search terms change
  useEffect(() => {
    if (editPatientSearchTerm && isEditDialogOpen) {
      const timer = setTimeout(() => {
        if (editPatientInputRef.current) {
          const rect = editPatientInputRef.current.getBoundingClientRect();
          setEditPatientDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          });
        }
      }, 0);
      return () => clearTimeout(timer);
    } else {
      setEditPatientDropdownPosition(null);
    }
  }, [editPatientSearchTerm, isEditDialogOpen]);

  useEffect(() => {
    if (editRoomBedSearchTerm && isEditDialogOpen) {
      const timer = setTimeout(() => {
        if (editRoomBedInputRef.current) {
          const rect = editRoomBedInputRef.current.getBoundingClientRect();
          setEditRoomBedDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          });
        }
      }, 0);
      return () => clearTimeout(timer);
    } else {
      setEditRoomBedDropdownPosition(null);
    }
  }, [editRoomBedSearchTerm, isEditDialogOpen]);

  useEffect(() => {
    if (editDoctorSearchTerm && isEditDialogOpen) {
      const timer = setTimeout(() => {
        if (editDoctorInputRef.current) {
          const rect = editDoctorInputRef.current.getBoundingClientRect();
          setEditDoctorDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          });
        }
      }, 0);
      return () => clearTimeout(timer);
    } else {
      setEditDoctorDropdownPosition(null);
    }
  }, [editDoctorSearchTerm, isEditDialogOpen]);

  // Update Edit dialog dropdown positions on scroll/resize
  useEffect(() => {
    const updatePositions = () => {
      if (editPatientSearchTerm && editPatientInputRef.current) {
        const rect = editPatientInputRef.current.getBoundingClientRect();
        setEditPatientDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
      if (editRoomBedSearchTerm && editRoomBedInputRef.current) {
        const rect = editRoomBedInputRef.current.getBoundingClientRect();
        setEditRoomBedDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
      if (editDoctorSearchTerm && editDoctorInputRef.current) {
        const rect = editDoctorInputRef.current.getBoundingClientRect();
        setEditDoctorDropdownPosition({
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
  }, [editPatientSearchTerm, editRoomBedSearchTerm, editDoctorSearchTerm]);

  // Scroll highlighted items into view in Edit dialog
  useEffect(() => {
    if (editPatientHighlightIndex >= 0) {
      const element = document.querySelector(`#edit-patient-dropdown tbody tr:nth-child(${editPatientHighlightIndex + 1})`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [editPatientHighlightIndex]);

  useEffect(() => {
    if (editRoomBedHighlightIndex >= 0) {
      const element = document.querySelector(`#edit-room-bed-dropdown tbody tr:nth-child(${editRoomBedHighlightIndex + 1})`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [editRoomBedHighlightIndex]);

  useEffect(() => {
    if (editDoctorHighlightIndex >= 0) {
      const element = document.querySelector(`#edit-doctor-dropdown tbody tr:nth-child(${editDoctorHighlightIndex + 1})`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [editDoctorHighlightIndex]);

  // Update Create dialog dropdown positions when search terms change
  useEffect(() => {
    if (patientSearchTerm && isDialogOpen) {
      const timer = setTimeout(() => {
        if (addPatientInputRef.current) {
          const rect = addPatientInputRef.current.getBoundingClientRect();
          setAddPatientDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          });
        }
      }, 0);
      return () => clearTimeout(timer);
    } else {
      setAddPatientDropdownPosition(null);
    }
  }, [patientSearchTerm, isDialogOpen]);

  useEffect(() => {
    if (roomBedSearchTerm && isDialogOpen) {
      const timer = setTimeout(() => {
        if (addRoomBedInputRef.current) {
          const rect = addRoomBedInputRef.current.getBoundingClientRect();
          setAddRoomBedDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          });
        }
      }, 0);
      return () => clearTimeout(timer);
    } else {
      setAddRoomBedDropdownPosition(null);
    }
  }, [roomBedSearchTerm, isDialogOpen]);

  useEffect(() => {
    if (doctorSearchTerm && isDialogOpen) {
      const timer = setTimeout(() => {
        if (addDoctorInputRef.current) {
          const rect = addDoctorInputRef.current.getBoundingClientRect();
          setAddDoctorDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          });
        }
      }, 0);
      return () => clearTimeout(timer);
    } else {
      setAddDoctorDropdownPosition(null);
    }
  }, [doctorSearchTerm, isDialogOpen]);

  // Update Create dialog dropdown positions on scroll/resize
  useEffect(() => {
    const updatePositions = () => {
      if (patientSearchTerm && addPatientInputRef.current) {
        const rect = addPatientInputRef.current.getBoundingClientRect();
        setAddPatientDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
      if (roomBedSearchTerm && addRoomBedInputRef.current) {
        const rect = addRoomBedInputRef.current.getBoundingClientRect();
        setAddRoomBedDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
      if (doctorSearchTerm && addDoctorInputRef.current) {
        const rect = addDoctorInputRef.current.getBoundingClientRect();
        setAddDoctorDropdownPosition({
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
  }, [patientSearchTerm, roomBedSearchTerm, doctorSearchTerm]);

  // Scroll highlighted items into view in Create dialog
  useEffect(() => {
    if (addPatientHighlightIndex >= 0) {
      const element = document.querySelector(`#add-patient-dropdown tbody tr:nth-child(${addPatientHighlightIndex + 1})`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [addPatientHighlightIndex]);

  useEffect(() => {
    if (addRoomBedHighlightIndex >= 0) {
      const element = document.querySelector(`#add-room-bed-dropdown tbody tr:nth-child(${addRoomBedHighlightIndex + 1})`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [addRoomBedHighlightIndex]);

  useEffect(() => {
    if (addDoctorHighlightIndex >= 0) {
      const element = document.querySelector(`#add-doctor-dropdown tbody tr:nth-child(${addDoctorHighlightIndex + 1})`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [addDoctorHighlightIndex]);

  // Load patient, room bed, and doctor options when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      
      const loadOptions = async () => {
        try {
          // Load patients
          const patientsList = await admissionsApi.getPatientRegistrations();
          setPatientOptions(patientsList || []);
          
          // Load room beds
          const roomBedsList = await roomBedsApi.getAll();
          setRoomBedOptions(roomBedsList || []);
          
          // Load doctors
          const doctorsList = await doctorsApi.getAll();
          setDoctorOptions(doctorsList || []);
        } catch (error) {
          console.error('Error loading options for new admission:', error);
        }
      };
      loadOptions();
      // Reset form when dialog opens
      setPatientSearchTerm('');
      setRoomBedSearchTerm('');
      setDoctorSearchTerm('');
      setAdmissionError(null);
      setSavingAdmission(false);
      const today = new Date();
      setRoomAllocationDate(today);
      const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      setAddAdmissionForm({
        patientId: '',
        patientType: '',
        patientAppointmentId: '',
        emergencyBedSlotId: '',
        roomBedId: '',
        roomBedsId: '',
        roomType: '',
        admittedBy: '',
        admittedByDoctorId: '',
        doctorId: '',
        diagnosis: '',
        roomAllocationDate: todayStr,
        admissionStatus: 'Active',
        caseSheet: '',
        caseDetails: '',
        isLinkedToICU: 'No',
        patientNo: '',
        age: '',
        gender: '',
        patientName: '',
        bedNumber: '',
        appointmentTokenNo: '',
        appointmentDate: '',
        emergencyBedNo: '',
        eBedSlotNo: '',
        emergencyAdmissionDate: '',
        roomVacantDate: '',
        shiftToAnotherRoom: '',
        shiftedTo: '',
        shiftedToDetails: '',
        scheduleOT: '',
        otAdmissionId: '',
        icuAdmissionId: '',
        billId: '',
        estimatedStay: '',
        createdAt: '',
        createdDate: '',
      });
      setAvailableAppointments([]);
      setAvailableEmergencyBedSlots([]);
      setAvailableIPDAdmissions([]);
    }
  }, [isDialogOpen]);

  // Client-side date filtering - handle date format "11-01-2026 00:00" from API
  let dateFilterStr: string | null = null;
  if (dateFilter) {
    // Format filter date as DD-MM-YYYY to match API format
    const day = String(dateFilter.getDate()).padStart(2, '0');
    const month = String(dateFilter.getMonth() + 1).padStart(2, '0');
    const year = dateFilter.getFullYear();
    dateFilterStr = `${day}-${month}-${year}`;
  }
  
  const filterByDate = (admissionsList: Admission[]): Admission[] => {
    if (!dateFilterStr) return admissionsList;
    return admissionsList.filter(admission => {
      // Get date from RoomAllocationDate field (format: "11-01-2026 00:00")
      const roomAllocationDate = (admission as any).roomAllocationDate || 
                                 (admission as any).RoomAllocationDate || 
                                 admission.admissionDate;
      
      if (!roomAllocationDate) return false;
      
      // Handle the API date format "DD-MM-YYYY HH:mm" or "DD-MM-YYYY 00:00"
      let admissionDateStr: string = '';
      if (typeof roomAllocationDate === 'string') {
        // If it's in format "11-01-2026 00:00", extract just the date part
        if (roomAllocationDate.includes(' ')) {
          admissionDateStr = roomAllocationDate.split(' ')[0]; // Get "11-01-2026"
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(roomAllocationDate)) {
          // If it's in YYYY-MM-DD format, convert to DD-MM-YYYY
          const [year, month, day] = roomAllocationDate.split('-');
          admissionDateStr = `${day}-${month}-${year}`;
        } else if (roomAllocationDate.includes('T')) {
          // If it's an ISO datetime string, extract and convert
          const datePart = roomAllocationDate.split('T')[0];
          const [year, month, day] = datePart.split('-');
          admissionDateStr = `${day}-${month}-${year}`;
        } else {
          // Try to parse as date and format as DD-MM-YYYY
          try {
            const dateObj = new Date(roomAllocationDate);
            if (!isNaN(dateObj.getTime())) {
              const day = String(dateObj.getDate()).padStart(2, '0');
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const year = dateObj.getFullYear();
              admissionDateStr = `${day}-${month}-${year}`;
            } else {
              return false;
            }
          } catch {
            return false;
          }
        }
      } else if (roomAllocationDate instanceof Date) {
        const day = String(roomAllocationDate.getDate()).padStart(2, '0');
        const month = String(roomAllocationDate.getMonth() + 1).padStart(2, '0');
        const year = roomAllocationDate.getFullYear();
        admissionDateStr = `${day}-${month}-${year}`;
      }
      
      // Compare dates directly (both in DD-MM-YYYY format)
      return admissionDateStr === dateFilterStr;
    });
  };
  
  const filteredAdmissions = filterByDate(
    admissions.filter(admission =>
      // Text search filter
      admission.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admission.bedNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getAdmissionsByStatus = (status: string) => {
    // Filter by exact status match, using admissionStatus field from API
    return filteredAdmissions.filter(a => {
      const targetStatus = String(status || '').trim().toLowerCase();
      const admissionStatusValue = String(a.admissionStatus || '').trim().toLowerCase();
      
      // For "Surgery Scheduled", check if admissionStatus from API equals "Surgery Scheduled"
      if (targetStatus === 'surgery scheduled') {
        return admissionStatusValue === 'surgery scheduled' || 
               admissionStatusValue === 'surgeryscheduled' ||
               admissionStatusValue === 'surgery_scheduled' ||
               (admissionStatusValue.includes('surgery') && admissionStatusValue.includes('scheduled'));
      }
      
      // For "Moved To ICU", check if admissionStatus from API equals "Moved To ICU"
      if (targetStatus === 'moved to icu') {
        return admissionStatusValue === 'moved to icu' || 
               admissionStatusValue === 'movedtoicu' ||
               admissionStatusValue === 'moved_to_icu' ||
               admissionStatusValue === 'transferred to icu' ||
               admissionStatusValue === 'transferredtoicu' ||
               admissionStatusValue === 'transferred_to_icu' ||
               (admissionStatusValue.includes('moved') && admissionStatusValue.includes('icu')) ||
               (admissionStatusValue.includes('transferred') && admissionStatusValue.includes('icu'));
      }
      
      // For "Active", check if admissionStatus from API equals "Active" or use normalized status
      if (targetStatus === 'active') {
        return admissionStatusValue === 'active' || 
               admissionStatusValue === 'admitted' ||
               admissionStatusValue === 'inpatient' ||
               String(a.status || '').trim().toLowerCase() === 'active';
      }
      
      // For other statuses, use normalized status field as fallback
      const normalizedStatusValue = String(a.status || '').trim().toLowerCase();
      return normalizedStatusValue === targetStatus;
    });
  };

  // Use room capacity from API or fallback to default
  const currentRoomCapacity: RoomCapacityOverview = roomCapacity || fallbackRoomCapacity;
  
  // Use dashboard metrics from API if available, otherwise calculate from room capacity
  const totalAdmissions = dashboardMetrics?.totalAdmissions ?? admissions.length;
  const activePatients = dashboardMetrics?.activePatients ?? admissions.filter(a => a.status === 'Active').length;
  const bedOccupancy = dashboardMetrics?.bedOccupancy ?? (() => {
    const totalOccupied = dashboardMetrics?.totalOccupied ?? Object.values(currentRoomCapacity).reduce((sum, room) => sum + room.occupied, 0);
    const totalCapacity = dashboardMetrics?.totalCapacity ?? Object.values(currentRoomCapacity).reduce((sum, room) => sum + room.total, 0);
    return totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
  })();
  //const bedOccupancy1 = dashboardMetrics?.bedOccupancy1 ?? '0/0';
  const totalOccupied = dashboardMetrics?.totalOccupied ?? Object.values(currentRoomCapacity).reduce((sum, room) => sum + room.occupied, 0);
  const totalCapacity = dashboardMetrics?.totalCapacity ?? Object.values(currentRoomCapacity).reduce((sum, room) => sum + room.total, 0);
  const availableBeds = dashboardMetrics?.availableBeds ?? (totalCapacity - totalOccupied);
  const avgStay = dashboardMetrics?.avgStay ?? 0.0;

  const handleScheduleOT = async (admission: Admission) => {
    // Use roomAdmissionId as primary identifier
    if (!admission.roomAdmissionId) {
      console.error('Cannot schedule OT: Room Admission ID is missing');
      return;
    }

    try {
      setSchedulingOT(admission.roomAdmissionId);
      await updateAdmission({
        roomAdmissionId: admission.roomAdmissionId,
        scheduleOT: true, // or 'Yes' - the API will convert it
      });
      // Refresh the admissions list to show updated status
      await fetchAdmissions();
    } catch (error) {
      console.error('Failed to schedule OT:', error);
      alert(error instanceof Error ? error.message : 'Failed to schedule OT. Please try again.');
    } finally {
      setSchedulingOT(null);
    }
  };

  const handleAddAdmissionFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type, checked } = e.target;
    setAddAdmissionForm(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-scrollable-container">
        <div className="dashboard-header-section">
          <div className="dashboard-header-content">
          <div>
              <h1 className="dashboard-header">IPD Admissions Management</h1>
              <p className="dashboard-subheader">Manage in-patient admissions and bed allocation</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              New IPD Admission
            </Button>
          </DialogTrigger>
          <DialogContent className="p-0 gap-0 large-dialog max-w-4xl max-h-[90vh] bg-white">
            <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0 bg-white">
              <DialogTitle>Register New Admission</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0 bg-white">
            <div className="space-y-4 py-4">
              {/* Patient Selection - First Field */}
              <div className="relative">
                <Label htmlFor="patient-search">Patient *</Label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      ref={addPatientInputRef}
                      id="patient-search"
                      name="patient-search"
                      autoComplete="off"
                      placeholder="Search by Patient ID, Name, or Mobile Number..."
                      value={patientSearchTerm}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setPatientSearchTerm(newValue);
                        setAddPatientHighlightIndex(-1);
                        setShowAddPatientDropdown(true);
                        setAddPatientVisibleCount(10);
                        if (addAdmissionForm.patientId) {
                          setAddAdmissionForm({ ...addAdmissionForm, patientId: '' });
                        }
                        requestAnimationFrame(() => {
                          if (addPatientInputRef.current) {
                            const rect = addPatientInputRef.current.getBoundingClientRect();
                            setAddPatientDropdownPosition({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width
                            });
                          }
                        });
                      }}
                      onFocus={() => {
                        setShowAddPatientDropdown(true);
                        setAddPatientVisibleCount(10);
                        requestAnimationFrame(() => {
                          if (addPatientInputRef.current) {
                            const rect = addPatientInputRef.current.getBoundingClientRect();
                            setAddPatientDropdownPosition({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width
                            });
                          }
                        });
                      }}
                      onBlur={(e) => {
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (!relatedTarget || !relatedTarget.closest('#add-patient-dropdown')) {
                          setTimeout(() => setShowAddPatientDropdown(false), 200);
                        }
                      }}
                      onKeyDown={(e) => {
                        const filteredPatients = patientOptions.filter((patient: any) => {
                          const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                          if (patientId && patientId.toLowerCase().includes('8dd9786e')) {
                            return false;
                          }
                          if (!patientSearchTerm) return false;
                          const searchLower = patientSearchTerm.toLowerCase();
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
                          setAddPatientHighlightIndex(prev => 
                            prev < filteredPatients.length - 1 ? prev + 1 : prev
                          );
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setAddPatientHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                        } else if (e.key === 'Enter' && addPatientHighlightIndex >= 0 && filteredPatients[addPatientHighlightIndex]) {
                          e.preventDefault();
                          const patient = filteredPatients[addPatientHighlightIndex];
                          const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                          const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                          const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                          const lastName = (patient as any).lastName || (patient as any).LastName || '';
                          const fullName = `${patientName} ${lastName}`.trim();
                          const updatedForm = { ...addAdmissionForm, patientId };
                          setAddAdmissionForm(updatedForm);
                          setPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
                          setAddPatientHighlightIndex(-1);
                          setShowAddPatientDropdown(false);
                          if (updatedForm.patientType === 'OPD' && patientId) {
                            fetchPatientAppointments(patientId).then(setAvailableAppointments);
                          } else if (updatedForm.patientType === 'Emergency' && patientId) {
                            fetchPatientEmergencyBedSlots(patientId).then(setAvailableEmergencyBedSlots);
                          } else if (updatedForm.patientType === 'IPD' && patientId) {
                            fetchPatientIPDAdmissions(patientId).then(setAvailableIPDAdmissions);
                          }
                        }
                      }}
                      disabled={false} // Always editable
                      className="pl-10"
                    />
                  </div>
                  {showAddPatientDropdown && !addAdmissionForm.patientId && patientOptions.length > 0 && (
                    <div 
                      id="add-patient-dropdown"
                      ref={addPatientDropdownRef}
                      className="border border-gray-200 rounded-md max-h-60 overflow-y-auto bg-white shadow-lg"
                      style={{ backgroundColor: 'white', opacity: 1 }}
                      onScroll={(e) => {
                        const target = e.target as HTMLDivElement;
                        const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                        if (scrollBottom < 50 && !addPatientLoadingMore) {
                          const filteredPatients = patientSearchTerm 
                            ? patientOptions.filter((patient: any) => {
                                const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                                if (patientId && patientId.toLowerCase().includes('8dd9786e')) {
                                  return false;
                                }
                                const searchLower = patientSearchTerm.toLowerCase();
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
                            : patientOptions;
                          
                          if (addPatientVisibleCount < filteredPatients.length) {
                            setAddPatientLoadingMore(true);
                            setTimeout(() => {
                              setAddPatientVisibleCount(prev => Math.min(prev + 10, filteredPatients.length));
                              setAddPatientLoadingMore(false);
                            }, 500);
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
                            const filteredPatients = patientSearchTerm 
                              ? patientOptions.filter((patient: any) => {
                                  const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                                  if (patientId && patientId.toLowerCase().includes('8dd9786e')) {
                                    return false;
                                  }
                                  const searchLower = patientSearchTerm.toLowerCase();
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
                              : patientOptions;
                            
                            const visiblePatients = filteredPatients.slice(0, addPatientVisibleCount);
                            const hasMore = addPatientVisibleCount < filteredPatients.length;
                            
                            return visiblePatients.length > 0 ? (
                              <>
                                {visiblePatients.map((patient, index) => {
                                  const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                                  const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                                  const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                                  const lastName = (patient as any).lastName || (patient as any).LastName || '';
                                  const fullName = `${patientName} ${lastName}`.trim();
                                  const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                                  const isSelected = addAdmissionForm.patientId === patientId;
                                  const isHighlighted = addPatientHighlightIndex === index;
                                  return (
                                    <tr
                                      key={patientId}
                                      onClick={async () => {
                                        const updatedForm = { ...addAdmissionForm, patientId };
                                        setAddAdmissionForm(updatedForm);
                                        setPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
                                        setAddPatientHighlightIndex(-1);
                                        setShowAddPatientDropdown(false);
                                        if (updatedForm.patientType === 'OPD' && patientId) {
                                          const appointments = await fetchPatientAppointments(patientId);
                                          setAvailableAppointments(appointments || []);
                                        } else if (updatedForm.patientType === 'Emergency' && patientId) {
                                          const slots = await fetchPatientEmergencyBedSlots(patientId);
                                          setAvailableEmergencyBedSlots(slots || []);
                                        } else if (updatedForm.patientType === 'IPD' && patientId) {
                                          const ipdAdmissions = await fetchPatientIPDAdmissions(patientId);
                                          setAvailableIPDAdmissions(ipdAdmissions || []);
                                        }
                                      }}
                                      onMouseDown={(e) => {
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
                                      {addPatientLoadingMore ? (
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
                  {addPatientError && (
                    <p className="text-sm text-red-600 mt-1">{addPatientError}</p>
                  )}
                </div>

              {/* Patient Type */}
              <div className="relative">
                <Label htmlFor="patientType" className="dialog-label-standard">Patient Type *</Label>
                <select
                  id="patientType"
                  className="dialog-input-standard w-full"
                  value={addAdmissionForm.patientType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setAddAdmissionForm({ ...addAdmissionForm, patientType: newType });
                      setAddPatientTypeError('');
                      if (newType === 'OPD' && addAdmissionForm.patientId) {
                        fetchPatientAppointments(addAdmissionForm.patientId);
                      } else if (newType === 'Emergency' && addAdmissionForm.patientId) {
                        fetchPatientEmergencyBedSlots(addAdmissionForm.patientId);
                      } else if (newType === 'IPD' && addAdmissionForm.patientId) {
                        fetchPatientIPDAdmissions(addAdmissionForm.patientId);
                      } else {
                        // Clear arrays when patient type changes but no patient is selected
                        setAvailableAppointments([]);
                        setAvailableEmergencyBedSlots([]);
                        setAvailableIPDAdmissions([]);
                      }
                    }}
                  required
                >
                  <option value="">Select Patient Type</option>
                  <option value="OPD">OPD</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Direct">Direct</option>
                </select>
                {addPatientTypeError && (
                  <p className="text-sm text-red-600 mt-1">{addPatientTypeError}</p>
                )}
              </div>
            </div>

                {/* Conditional Fields based on PatientType */}
                {addAdmissionForm.patientType === 'OPD' && (
                  <div>
                    <Label htmlFor="patientAppointmentId">Patient Appointment ID *</Label>
                    <select
                      id="patientAppointmentId"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md"
                      value={addAdmissionForm.patientAppointmentId}
                      onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, patientAppointmentId: e.target.value })}
                      required
                    >
                      <option value="">Select Appointment</option>
                      {availableAppointments?.map((appointment: any) => {
                        const appointmentId = appointment.id || appointment.patientAppointmentId || appointment.PatientAppointmentId || '';
                        const tokenNo = appointment.tokenNo || appointment.TokenNo || '';
                        const appointmentDate = appointment.appointmentDate || appointment.AppointmentDate || '';
                        let formattedDate = '';
                        if (appointmentDate) {
                          try {
                            if (typeof appointmentDate === 'string') {
                              formattedDate = appointmentDate.split('T')[0];
                            } else {
                              formattedDate = new Date(appointmentDate).toISOString().split('T')[0];
                            }
                          } catch {
                            formattedDate = String(appointmentDate).split('T')[0] || 'N/A';
                          }
                        } else {
                          formattedDate = 'N/A';
                        }
                        return (
                          <option key={appointmentId} value={appointmentId}>
                            {tokenNo ? `Token: ${tokenNo} - ${formattedDate}` : `Appointment ID: ${appointmentId} - ${formattedDate}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {addAdmissionForm.patientType === 'IPD' && (
                  <div>
                    <Label htmlFor="roomAdmissionId">Patient IPD Admission ID *</Label>
                    <select
                      id="roomAdmissionId"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md"
                      value={addAdmissionForm.roomAdmissionId}
                      onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, roomAdmissionId: e.target.value })}
                      required
                    >
                      <option value="">Select Patient IPD Admission ID</option>
                      {availableIPDAdmissions?.map((admission: any) => {
                        // Extract RoomAdmissionId (prioritize this field)
                        const roomAdmissionId = admission.roomAdmissionId || admission.RoomAdmissionId || admission.admissionId || admission.id || '';
                        const bedNumber = admission.bedNumber || admission.BedNumber || admission.bedNo || admission.BedNo || '';
                        const roomType = admission.roomType || admission.RoomType || '';
                        const admissionDate = admission.roomAllocationDate || admission.RoomAllocationDate || admission.admissionDate || admission.AdmissionDate || '';
                        let formattedDate = '';
                        if (admissionDate) {
                          try {
                            if (typeof admissionDate === 'string') {
                              formattedDate = admissionDate.split('T')[0];
                            } else {
                              formattedDate = new Date(admissionDate).toISOString().split('T')[0];
                            }
                          } catch {
                            formattedDate = String(admissionDate).split('T')[0] || 'N/A';
                          }
                        } else {
                          formattedDate = 'N/A';
                        }
                        const status = admission.admissionStatus || admission.AdmissionStatus || admission.status || admission.Status || 'Active';
                        return (
                          <option key={roomAdmissionId} value={roomAdmissionId}>
                            {bedNumber ? `Bed: ${bedNumber} - ${roomType} - ${formattedDate} (${status})` : `ID: ${roomAdmissionId} - ${formattedDate} (${status})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {addAdmissionForm.patientType === 'Emergency' && (
                  <div>
                    <Label htmlFor="emergencyBedSlotId">Emergency Admission Bed No *</Label>
                    <select
                      id="emergencyBedSlotId"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md"
                      value={addAdmissionForm.emergencyBedSlotId}
                      onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, emergencyBedSlotId: e.target.value })}
                      required
                    >
                      <option value="">Select Emergency Admission Bed No</option>
                      {availableEmergencyBedSlots?.map((slot: any) => {
                        // Extract EmergencyAdmissionId (prioritize this field)
                        const emergencyAdmissionId = slot.emergencyAdmissionId || slot.EmergencyAdmissionId || slot.id || '';
                        // Fallback to other IDs if EmergencyAdmissionId is not available
                        const slotId = emergencyAdmissionId || slot.emergencyBedSlotId || slot.EmergencyBedSlotId || '';
                        const bedNo = slot.emergencyBedSlotNo || slot.EmergencyBedSlotNo || slot.bedNo || slot.BedNo || slot.emergencyBedNo || slot.EmergencyBedNo || '';
                        const status = slot.emergencyStatus || slot.EmergencyStatus || slot.status || slot.Status || '';
                        return (
                          <option key={slotId} value={emergencyAdmissionId || slotId}>
                            {bedNo ? `Bed: ${bedNo} - ${status}` : `ID: ${emergencyAdmissionId || slotId} - ${status}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Room/Bed Selection - Same pattern as Patient selection */}
                <div>
                  <Label htmlFor="room-bed-search">Room/Bed *</Label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      ref={addRoomBedInputRef}
                      id="room-bed-search"
                      name="room-bed-search"
                      autoComplete="off"
                      placeholder={addAdmissionForm.patientType ? "Search by Room No, Bed No, Room Type, or Category..." : "Please select Patient Type first"}
                      value={roomBedSearchTerm}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setRoomBedSearchTerm(newValue);
                        setAddRoomBedHighlightIndex(-1);
                        setShowAddRoomBedDropdown(true);
                        setAddRoomBedVisibleCount(10);
                        if (addAdmissionForm.roomBedId) {
                          setAddAdmissionForm({ ...addAdmissionForm, roomBedId: '', roomBedsId: '' });
                        }
                        requestAnimationFrame(() => {
                          if (addRoomBedInputRef.current) {
                            const rect = addRoomBedInputRef.current.getBoundingClientRect();
                            setAddRoomBedDropdownPosition({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width
                            });
                          }
                        });
                      }}
                      onFocus={() => {
                        setShowAddRoomBedDropdown(true);
                        setAddRoomBedVisibleCount(10);
                        requestAnimationFrame(() => {
                          if (addRoomBedInputRef.current) {
                            const rect = addRoomBedInputRef.current.getBoundingClientRect();
                            setAddRoomBedDropdownPosition({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width
                            });
                          }
                        });
                      }}
                      onBlur={(e) => {
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (!relatedTarget || !relatedTarget.closest('#add-room-bed-dropdown')) {
                          setTimeout(() => setShowAddRoomBedDropdown(false), 200);
                        }
                      }}
                      onKeyDown={(e) => {
                        const filteredBeds = roomBedOptions.filter((bed: any) => {
                          if (!roomBedSearchTerm) return false;
                          const searchLower = roomBedSearchTerm.toLowerCase();
                          const roomNo = (bed as any).roomNo || (bed as any).RoomNo || '';
                          const bedNo = (bed as any).bedNo || (bed as any).BedNo || '';
                          const roomType = (bed as any).roomType || (bed as any).RoomType || '';
                          const roomCategory = (bed as any).roomCategory || (bed as any).RoomCategory || '';
                          return (
                            roomNo.toLowerCase().includes(searchLower) ||
                            bedNo.toLowerCase().includes(searchLower) ||
                            roomType.toLowerCase().includes(searchLower) ||
                            roomCategory.toLowerCase().includes(searchLower)
                          );
                        });
                        
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setAddRoomBedHighlightIndex(prev => 
                            prev < filteredBeds.length - 1 ? prev + 1 : prev
                          );
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setAddRoomBedHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                        } else if (e.key === 'Enter' && addRoomBedHighlightIndex >= 0 && filteredBeds[addRoomBedHighlightIndex]) {
                          e.preventDefault();
                          const bed = filteredBeds[addRoomBedHighlightIndex];
                          const roomBedId = (bed as any).roomBedId || (bed as any).RoomBedsId || (bed as any).id || '';
                          const roomNo = (bed as any).roomNo || (bed as any).RoomNo || '';
                          const bedNo = (bed as any).bedNo || (bed as any).BedNo || '';
                          const roomType = (bed as any).roomType || (bed as any).RoomType || '';
                          const roomBedsId = (bed as any).RoomBedsId || (bed as any).roomBedsId || roomBedId;
                          setAddAdmissionForm({ 
                            ...addAdmissionForm, 
                            roomBedId: String(roomBedId),
                            roomBedsId: String(roomBedsId),
                            roomType: roomType
                          });
                          setRoomBedSearchTerm(`${roomNo} - ${bedNo} (${roomType})`);
                          setAddRoomBedHighlightIndex(-1);
                          setShowAddRoomBedDropdown(false);
                        }
                      }}
                      disabled={!addAdmissionForm.patientType}
                      className={`pl-10 ${!addAdmissionForm.patientType ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  {showAddRoomBedDropdown && !addAdmissionForm.roomBedId && addAdmissionForm.patientType && roomBedOptions.length > 0 && (
                    <div 
                      id="add-room-bed-dropdown"
                      ref={addRoomBedDropdownRef}
                      className="border border-gray-200 rounded-md max-h-60 overflow-y-auto bg-white shadow-lg"
                      style={{ backgroundColor: 'white', opacity: 1 }}
                      onScroll={(e) => {
                        const target = e.target as HTMLDivElement;
                        const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                        if (scrollBottom < 50 && !addRoomBedLoadingMore) {
                          const filteredBeds = roomBedSearchTerm
                            ? roomBedOptions.filter((bed: any) => {
                                const searchLower = roomBedSearchTerm.toLowerCase();
                                const roomNo = (bed as any).roomNo || (bed as any).RoomNo || '';
                                const bedNo = (bed as any).bedNo || (bed as any).BedNo || '';
                                const roomType = (bed as any).roomType || (bed as any).RoomType || '';
                                const roomCategory = (bed as any).roomCategory || (bed as any).RoomCategory || '';
                                return (
                                  roomNo.toLowerCase().includes(searchLower) ||
                                  bedNo.toLowerCase().includes(searchLower) ||
                                  roomType.toLowerCase().includes(searchLower) ||
                                  roomCategory.toLowerCase().includes(searchLower)
                                );
                              })
                            : roomBedOptions;
                          
                          if (addRoomBedVisibleCount < filteredBeds.length) {
                            setAddRoomBedLoadingMore(true);
                            setTimeout(() => {
                              setAddRoomBedVisibleCount(prev => Math.min(prev + 10, filteredBeds.length));
                              setAddRoomBedLoadingMore(false);
                            }, 500);
                          }
                        }
                      }}
                    >
                      <table className="w-full">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Room No</th>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Bed No</th>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Room Type</th>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Category</th>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filteredBeds = roomBedSearchTerm
                              ? roomBedOptions.filter((bed: any) => {
                                  const searchLower = roomBedSearchTerm.toLowerCase();
                                  const roomNo = (bed as any).roomNo || (bed as any).RoomNo || '';
                                  const bedNo = (bed as any).bedNo || (bed as any).BedNo || '';
                                  const roomType = (bed as any).roomType || (bed as any).RoomType || '';
                                  const roomCategory = (bed as any).roomCategory || (bed as any).RoomCategory || '';
                                  return (
                                    roomNo.toLowerCase().includes(searchLower) ||
                                    bedNo.toLowerCase().includes(searchLower) ||
                                    roomType.toLowerCase().includes(searchLower) ||
                                    roomCategory.toLowerCase().includes(searchLower)
                                  );
                                })
                              : roomBedOptions;
                            
                            const visibleBeds = filteredBeds.slice(0, addRoomBedVisibleCount);
                            const hasMore = addRoomBedVisibleCount < filteredBeds.length;
                            
                            return visibleBeds.length > 0 ? (
                              <>
                                {visibleBeds.map((bed, index) => {
                                  const roomBedId = (bed as any).roomBedId || (bed as any).RoomBedsId || (bed as any).id || '';
                                  const roomNo = (bed as any).roomNo || (bed as any).RoomNo || '';
                                  const bedNo = (bed as any).bedNo || (bed as any).BedNo || '';
                                  const roomType = (bed as any).roomType || (bed as any).RoomType || '';
                                  const roomCategory = (bed as any).roomCategory || (bed as any).RoomCategory || '';
                                  const status = (bed as any).status || (bed as any).Status || '';
                                  const isSelected = addAdmissionForm.roomBedId === String(roomBedId);
                                  const isHighlighted = addRoomBedHighlightIndex === index;
                                  return (
                                    <tr
                                      key={roomBedId}
                                      onClick={() => {
                                        const roomBedsId = (bed as any).RoomBedsId || (bed as any).roomBedsId || roomBedId;
                                        setAddAdmissionForm({ 
                                          ...addAdmissionForm, 
                                          roomBedId: String(roomBedId),
                                          roomBedsId: String(roomBedsId),
                                          roomType: roomType
                                        });
                                        setRoomBedSearchTerm(`${roomNo} - ${bedNo} (${roomType})`);
                                        setAddRoomBedHighlightIndex(-1);
                                        setShowAddRoomBedDropdown(false);
                                      }}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                      }}
                                      className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                    >
                                      <td className="py-2 px-3 text-sm text-gray-900 font-mono">{roomNo || '-'}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{bedNo || '-'}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{roomType || '-'}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{roomCategory || '-'}</td>
                                      <td className="py-2 px-3 text-sm">
                                        <Badge variant={status === 'Active' ? 'default' : 'outline'}>
                                          {status || 'N/A'}
                                        </Badge>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {hasMore && (
                                  <tr>
                                    <td colSpan={5} className="text-center py-3 text-sm text-gray-500">
                                      {addRoomBedLoadingMore ? (
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
                                <td colSpan={5} className="text-center py-8 text-sm text-gray-700">
                                  No room beds found. Try a different search term.
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {addRoomBedError && (
                    <p className="text-sm text-red-600 mt-1">{addRoomBedError}</p>
                  )}
                </div>

                {/* Doctor Selection - Same pattern as Patient selection */}
                <div>
                  <Label htmlFor="doctor-search">Admitted By (Doctor) *</Label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      ref={addDoctorInputRef}
                      id="doctor-search"
                      name="doctor-search"
                      autoComplete="off"
                      placeholder={addAdmissionForm.patientType ? "Search by Doctor Name, ID, or Specialty..." : "Please select Patient Type first"}
                      value={doctorSearchTerm}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setDoctorSearchTerm(newValue);
                        setAddDoctorHighlightIndex(-1);
                        setShowAddDoctorDropdown(true);
                        setAddDoctorVisibleCount(10);
                        if (addAdmissionForm.admittedByDoctorId) {
                          setAddAdmissionForm({ ...addAdmissionForm, admittedByDoctorId: '', doctorId: '' });
                        }
                        requestAnimationFrame(() => {
                          if (addDoctorInputRef.current) {
                            const rect = addDoctorInputRef.current.getBoundingClientRect();
                            setAddDoctorDropdownPosition({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width
                            });
                          }
                        });
                      }}
                      onFocus={() => {
                        setShowAddDoctorDropdown(true);
                        setAddDoctorVisibleCount(10);
                        requestAnimationFrame(() => {
                          if (addDoctorInputRef.current) {
                            const rect = addDoctorInputRef.current.getBoundingClientRect();
                            setAddDoctorDropdownPosition({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width
                            });
                          }
                        });
                      }}
                      onBlur={(e) => {
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (!relatedTarget || !relatedTarget.closest('#add-doctor-dropdown')) {
                          setTimeout(() => setShowAddDoctorDropdown(false), 200);
                        }
                      }}
                      onKeyDown={(e) => {
                        const filteredDoctors = doctorOptions.filter((doctor: any) => {
                          if (!doctorSearchTerm) return false;
                          const searchLower = doctorSearchTerm.toLowerCase();
                          const doctorId = String((doctor as any).id || (doctor as any).Id || (doctor as any).UserId || '');
                          const doctorName = (doctor as any).name || (doctor as any).Name || (doctor as any).UserName || '';
                          const specialty = (doctor as any).specialty || (doctor as any).Specialty || (doctor as any).DoctorDepartmentName || '';
                          return (
                            doctorId.toLowerCase().includes(searchLower) ||
                            doctorName.toLowerCase().includes(searchLower) ||
                            specialty.toLowerCase().includes(searchLower)
                          );
                        });
                        
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setAddDoctorHighlightIndex(prev => 
                            prev < filteredDoctors.length - 1 ? prev + 1 : prev
                          );
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setAddDoctorHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                        } else if (e.key === 'Enter' && addDoctorHighlightIndex >= 0 && filteredDoctors[addDoctorHighlightIndex]) {
                          e.preventDefault();
                          const doctor = filteredDoctors[addDoctorHighlightIndex];
                          const doctorId = String((doctor as any).id || (doctor as any).Id || (doctor as any).UserId || '');
                          const doctorName = (doctor as any).name || (doctor as any).Name || (doctor as any).UserName || '';
                          const specialty = (doctor as any).specialty || (doctor as any).Specialty || (doctor as any).DoctorDepartmentName || '';
                          setAddAdmissionForm({ 
                            ...addAdmissionForm, 
                            admittedByDoctorId: doctorId,
                            doctorId: doctorId,
                            admittedBy: doctorName
                          });
                          setDoctorSearchTerm(`${doctorName}${specialty ? ` - ${specialty}` : ''}`);
                          setAddDoctorHighlightIndex(-1);
                          setShowAddDoctorDropdown(false);
                        }
                      }}
                      disabled={!addAdmissionForm.patientType}
                      className={`pl-10 ${!addAdmissionForm.patientType ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  {showAddDoctorDropdown && !addAdmissionForm.admittedByDoctorId && addAdmissionForm.patientType && doctorOptions.length > 0 && (
                    <div 
                      id="add-doctor-dropdown"
                      ref={addDoctorDropdownRef}
                      className="border border-gray-200 rounded-md max-h-60 overflow-y-auto bg-white shadow-lg"
                      style={{ backgroundColor: 'white', opacity: 1 }}
                      onScroll={(e) => {
                        const target = e.target as HTMLDivElement;
                        const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                        if (scrollBottom < 50 && !addDoctorLoadingMore) {
                          const filteredDoctors = doctorSearchTerm
                            ? doctorOptions.filter((doctor: any) => {
                                const searchLower = doctorSearchTerm.toLowerCase();
                                const doctorId = String((doctor as any).id || (doctor as any).Id || (doctor as any).UserId || '');
                                const doctorName = (doctor as any).name || (doctor as any).Name || (doctor as any).UserName || '';
                                const specialty = (doctor as any).specialty || (doctor as any).Specialty || (doctor as any).DoctorDepartmentName || '';
                                return (
                                  doctorId.toLowerCase().includes(searchLower) ||
                                  doctorName.toLowerCase().includes(searchLower) ||
                                  specialty.toLowerCase().includes(searchLower)
                                );
                              })
                            : doctorOptions;
                          
                          if (addDoctorVisibleCount < filteredDoctors.length) {
                            setAddDoctorLoadingMore(true);
                            setTimeout(() => {
                              setAddDoctorVisibleCount(prev => Math.min(prev + 10, filteredDoctors.length));
                              setAddDoctorLoadingMore(false);
                            }, 500);
                          }
                        }
                      }}
                    >
                      <table className="w-full">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Doctor ID</th>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Specialty</th>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filteredDoctors = doctorSearchTerm
                              ? doctorOptions.filter((doctor: any) => {
                                  const searchLower = doctorSearchTerm.toLowerCase();
                                  const doctorId = String((doctor as any).id || (doctor as any).Id || (doctor as any).UserId || '');
                                  const doctorName = (doctor as any).name || (doctor as any).Name || (doctor as any).UserName || '';
                                  const specialty = (doctor as any).specialty || (doctor as any).Specialty || (doctor as any).DoctorDepartmentName || '';
                                  return (
                                    doctorId.toLowerCase().includes(searchLower) ||
                                    doctorName.toLowerCase().includes(searchLower) ||
                                    specialty.toLowerCase().includes(searchLower)
                                  );
                                })
                              : doctorOptions;
                            
                            const visibleDoctors = filteredDoctors.slice(0, addDoctorVisibleCount);
                            const hasMore = addDoctorVisibleCount < filteredDoctors.length;
                            
                            return visibleDoctors.length > 0 ? (
                              <>
                                {visibleDoctors.map((doctor, index) => {
                                  const doctorId = String((doctor as any).id || (doctor as any).Id || (doctor as any).UserId || '');
                                  const doctorName = (doctor as any).name || (doctor as any).Name || (doctor as any).UserName || '';
                                  const specialty = (doctor as any).specialty || (doctor as any).Specialty || (doctor as any).DoctorDepartmentName || '';
                                  const doctorType = (doctor as any).type || (doctor as any).Type || (doctor as any).DoctorType || '';
                                  const isSelected = addAdmissionForm.admittedByDoctorId === doctorId;
                                  const isHighlighted = addDoctorHighlightIndex === index;
                                  return (
                                    <tr
                                      key={doctorId}
                                      onClick={() => {
                                        setAddAdmissionForm({ 
                                          ...addAdmissionForm, 
                                          admittedByDoctorId: doctorId,
                                          doctorId: doctorId,
                                          admittedBy: doctorName
                                        });
                                        setDoctorSearchTerm(`${doctorName}${specialty ? ` - ${specialty}` : ''}`);
                                        setAddDoctorHighlightIndex(-1);
                                        setShowAddDoctorDropdown(false);
                                      }}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                      }}
                                      className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                    >
                                      <td className="py-2 px-3 text-sm text-gray-900 font-mono">{doctorId || '-'}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{doctorName || 'Unknown'}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{specialty || '-'}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">
                                        <Badge variant={doctorType === 'inhouse' ? 'default' : 'outline'}>
                                          {doctorType || 'N/A'}
                                        </Badge>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {hasMore && (
                                  <tr>
                                    <td colSpan={4} className="text-center py-3 text-sm text-gray-500">
                                      {addDoctorLoadingMore ? (
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
                                <td colSpan={4} className="text-center py-8 text-sm text-gray-700">
                                  No doctors found. Try a different search term.
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {addDoctorError && (
                    <p className="text-sm text-red-600 mt-1">{addDoctorError}</p>
                  )}
                </div>
              <div className="dialog-form-field">
                  <Label htmlFor="roomAllocationDate" className="dialog-label-standard">Room Allocation Date *</Label>
                  <DatePicker
                    id="roomAllocationDate"
                    selected={roomAllocationDate}
                    onChange={(date: Date | null) => {
                      setRoomAllocationDate(date);
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const dateStr = `${year}-${month}-${day}`;
                        setAddAdmissionForm({ ...addAdmissionForm, roomAllocationDate: dateStr });
                        setAddRoomAllocationDateError('');
                      } else {
                        setAddAdmissionForm({ ...addAdmissionForm, roomAllocationDate: '' });
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
                  <Label htmlFor="roomVacantDate" className="dialog-label-standard">Room Vacant Date</Label>
                  <DatePicker
                    id="roomVacantDate"
                    selected={roomVacantDate}
                    onChange={(date: Date | null) => {
                      setRoomVacantDate(date);
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const dateStr = `${day}-${month}-${year}`;
                        setAddAdmissionForm({ ...addAdmissionForm, roomVacantDate: dateStr });
                      } else {
                        setAddAdmissionForm({ ...addAdmissionForm, roomVacantDate: '' });
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
                  {addRoomAllocationDateError && (
                    <p className="text-sm text-red-600 mt-1">{addRoomAllocationDateError}</p>
                  )}
              </div>
                <div>
                  <Label htmlFor="admissionStatus">Admission Status *</Label>
                  <select
                    id="admissionStatus"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={addAdmissionForm.admissionStatus}
                    onChange={(e) => {
                      setAddAdmissionForm({ ...addAdmissionForm, admissionStatus: e.target.value });
                      setAddAdmissionStatusError('');
                    }}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Moved To ICU">Moved To ICU</option>
                    <option value="Surgery Scheduled">Surgery Scheduled</option>
                    <option value="Discharged">Discharged</option>
                  </select>
                  {addAdmissionStatusError && (
                    <p className="text-sm text-red-600 mt-1">{addAdmissionStatusError}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="caseSheet">Case Sheet</Label>
                  <Input 
                    id="caseSheet" 
                    placeholder="Enter case sheet" 
                    value={addAdmissionForm.caseSheet}
                    onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, caseSheet: e.target.value })}
                  />
              </div>

                <div className="col-span-2">
                  <Label htmlFor="caseDetails">Case Details</Label>
                  <Textarea 
                    id="caseDetails" 
                    placeholder="Enter case details" 
                    value={addAdmissionForm.caseDetails}
                    onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, caseDetails: e.target.value })}
                    rows={4}
                  />
            </div>

                <div>
                  <Label htmlFor="isLinkedToICU">Is Linked To ICU *</Label>
                  <select
                    id="isLinkedToICU"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={addAdmissionForm.isLinkedToICU}
                    onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, isLinkedToICU: e.target.value })}
                    required
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="scheduleOT">OT Scheduled *</Label>
                  <select
                    id="scheduleOT"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={addAdmissionForm.scheduleOT}
                    onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, scheduleOT: e.target.value })}
                    required
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

               
                <div>
                  <Label htmlFor="shiftToAnotherRoom">Shift to Another Room</Label>
                  <select
                    id="shiftToAnotherRoom"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={addAdmissionForm.shiftToAnotherRoom}
                    onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, shiftToAnotherRoom: e.target.value })}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="shiftedToDetails">Shifted Details</Label>
                  <Input
                    id="shiftedToDetails"
                    placeholder="Enter shifted details"
                    value={addAdmissionForm.shiftedToDetails}
                    onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, shiftedToDetails: e.target.value })}
                  />
                </div>
            </div>
            
            {admissionError && (
              <div className="px-6 pb-2 flex-shrink-0 bg-white">
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {admissionError}
                </div>
              </div>
            )}
            <DialogFooter className="px-6 py-3 flex-shrink-0 border-t bg-white">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={savingAdmission}>
                Cancel
              </Button>
              <Button onClick={handleSaveAdmission} disabled={savingAdmission}>
                {savingAdmission ? 'Adding...' : 'Add Admission'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Admission Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="p-0 gap-0 large-dialog max-w-4xl max-h-[90vh] bg-white">
            <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0 bg-white">
              <DialogTitle>Edit Admission</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0 bg-white">
            <div className="space-y-4 py-4">
                {/* Patient Selection - First Field */}
                <div className="relative">
                  <Label htmlFor="edit-patient-search">Patient *</Label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      ref={editPatientInputRef}
                      id="edit-patient-search"
                      name="edit-patient-search"
                      autoComplete="off"
                      placeholder="Search by Patient ID, Name, or Mobile Number..."
                      value={editPatientSearchTerm}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setEditPatientSearchTerm(newValue);
                        setEditPatientHighlightIndex(-1);
                        setShowEditPatientDropdown(true);
                        setEditPatientVisibleCount(10);
                        if (editAdmissionForm.patientId) {
                          setEditAdmissionForm({ ...editAdmissionForm, patientId: '' });
                        }
                        requestAnimationFrame(() => {
                          if (editPatientInputRef.current) {
                            const rect = editPatientInputRef.current.getBoundingClientRect();
                            setEditPatientDropdownPosition({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width
                            });
                          }
                        });
                      }}
                      onFocus={() => {
                        setShowEditPatientDropdown(true);
                        setEditPatientVisibleCount(10);
                        requestAnimationFrame(() => {
                          if (editPatientInputRef.current) {
                            const rect = editPatientInputRef.current.getBoundingClientRect();
                            setEditPatientDropdownPosition({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width
                            });
                          }
                        });
                      }}
                      onBlur={(e) => {
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (!relatedTarget || !relatedTarget.closest('#edit-patient-dropdown')) {
                          setTimeout(() => setShowEditPatientDropdown(false), 200);
                        }
                      }}
                      onKeyDown={(e) => {
                        const filteredPatients = patientOptions.filter((patient: any) => {
                          const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                          if (patientId && patientId.toLowerCase().includes('8dd9786e')) {
                            return false;
                          }
                          if (!editPatientSearchTerm) return false;
                          const searchLower = editPatientSearchTerm.toLowerCase();
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
                          const updatedForm = { ...editAdmissionForm, patientId };
                          setEditAdmissionForm(updatedForm);
                          setEditPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
                          setEditPatientHighlightIndex(-1);
                          setShowEditPatientDropdown(false);
                          if (updatedForm.patientType === 'OPD' && patientId) {
                            fetchPatientAppointments(patientId).then((appointments) => {
                              setEditAvailableAppointments(appointments || []);
                            }).catch(() => {
                              setEditAvailableAppointments([]);
                            });
                          } else if (updatedForm.patientType === 'Emergency' && patientId) {
                            fetchPatientEmergencyBedSlots(patientId).then((slots) => {
                              setEditAvailableEmergencyBedSlots(slots || []);
                            }).catch(() => {
                              setEditAvailableEmergencyBedSlots([]);
                            });
                          } else if (updatedForm.patientType === 'IPD' && patientId) {
                            fetchPatientIPDAdmissions(patientId).then((ipdAdmissions) => {
                              setEditAvailableIPDAdmissions(ipdAdmissions || []);
                            }).catch(() => {
                              setEditAvailableIPDAdmissions([]);
                            });
                          }
                        }
                      }}
                      disabled={false} // Always editable
                      className="dialog-input-standard w-full pl-10"
                    />
                  </div>
                  {showEditPatientDropdown && !editAdmissionForm.patientId && patientOptions.length > 0 && (
                    <div 
                      id="edit-patient-dropdown"
                      ref={editPatientDropdownRef}
                      className="border border-gray-200 rounded-md max-h-60 overflow-y-auto bg-white shadow-lg"
                      style={{ backgroundColor: 'white', opacity: 1 }}
                      onScroll={(e) => {
                        const target = e.target as HTMLDivElement;
                        const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                        if (scrollBottom < 50 && !editPatientLoadingMore) {
                          const filteredPatients = editPatientSearchTerm 
                            ? patientOptions.filter((patient: any) => {
                                const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                                if (patientId && patientId.toLowerCase().includes('8dd9786e')) {
                                  return false;
                                }
                                const searchLower = editPatientSearchTerm.toLowerCase();
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
                              })
                            : patientOptions;
                          
                          if (editPatientVisibleCount < filteredPatients.length) {
                            setEditPatientLoadingMore(true);
                            setTimeout(() => {
                              setEditPatientVisibleCount(prev => Math.min(prev + 10, filteredPatients.length));
                              setEditPatientLoadingMore(false);
                            }, 500);
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
                            const filteredPatients = editPatientSearchTerm 
                              ? patientOptions.filter((patient: any) => {
                                  const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                                  if (patientId && patientId.toLowerCase().includes('8dd9786e')) {
                                    return false;
                                  }
                                  const searchLower = editPatientSearchTerm.toLowerCase();
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
                                })
                              : patientOptions;
                            
                            const visiblePatients = filteredPatients.slice(0, editPatientVisibleCount);
                            const hasMore = editPatientVisibleCount < filteredPatients.length;
                            
                            return visiblePatients.length > 0 ? (
                              <>
                                {visiblePatients.map((patient, index) => {
                                  const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                                  const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                                  const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                                  const lastName = (patient as any).lastName || (patient as any).LastName || '';
                                  const fullName = `${patientName} ${lastName}`.trim();
                                  const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                                  const isSelected = editAdmissionForm.patientId === patientId;
                                  const isHighlighted = editPatientHighlightIndex === index;
                                  return (
                                    <tr
                                      key={patientId}
                                      onClick={async () => {
                                        const updatedForm = { ...editAdmissionForm, patientId };
                                        setEditAdmissionForm(updatedForm);
                                        setEditPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
                                        setEditPatientHighlightIndex(-1);
                                        setShowEditPatientDropdown(false);
                                        if (updatedForm.patientType === 'OPD' && patientId) {
                                          const appointments = await fetchPatientAppointments(patientId);
                                          setEditAvailableAppointments(appointments || []);
                                        } else if (updatedForm.patientType === 'Emergency' && patientId) {
                                          const slots = await fetchPatientEmergencyBedSlots(patientId);
                                          setEditAvailableEmergencyBedSlots(slots || []);
                                        } else if (updatedForm.patientType === 'IPD' && patientId) {
                                          const ipdAdmissions = await fetchPatientIPDAdmissions(patientId);
                                          setEditAvailableIPDAdmissions(ipdAdmissions || []);
                                        }
                                      }}
                                      onMouseDown={(e) => {
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
                                      {editPatientLoadingMore ? (
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
                  {editPatientError && (
                    <p className="text-sm text-red-600 mt-1">{editPatientError}</p>
                  )}
                </div>

                {/* Patient Type */}
                <div className="relative">
                  <Label htmlFor="edit-patientType" className="dialog-label-standard">Patient Type *</Label>
                  <select
                    id="edit-patientType"
                    className="dialog-input-standard w-full"
                    value={editAdmissionForm.patientType}
                    onChange={async (e) => {
                      const newType = e.target.value;
                      setEditAdmissionForm({ ...editAdmissionForm, patientType: newType });
                      setEditPatientTypeError('');
                      if (newType === 'OPD' && editAdmissionForm.patientId) {
                        try {
                          const appointments = await fetchPatientAppointments(editAdmissionForm.patientId);
                          setEditAvailableAppointments(appointments || []);
                        } catch {
                          setEditAvailableAppointments([]);
                        }
                      } else if (newType === 'Emergency' && editAdmissionForm.patientId) {
                        try {
                          const slots = await fetchPatientEmergencyBedSlots(editAdmissionForm.patientId);
                          setEditAvailableEmergencyBedSlots(slots || []);
                        } catch {
                          setEditAvailableEmergencyBedSlots([]);
                        }
                      } else if (newType === 'IPD' && editAdmissionForm.patientId) {
                        try {
                          const ipdAdmissions = await fetchPatientIPDAdmissions(editAdmissionForm.patientId);
                          setEditAvailableIPDAdmissions(ipdAdmissions || []);
                        } catch {
                          setEditAvailableIPDAdmissions([]);
                        }
                      } else {
                        // Clear arrays when patient type changes but no patient is selected
                        setEditAvailableAppointments([]);
                        setEditAvailableEmergencyBedSlots([]);
                        setEditAvailableIPDAdmissions([]);
                      }
                    }}
                    required
                  >
                    <option value="">Select Patient Type</option>
                    <option value="OPD">OPD</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Direct">Direct</option>
                  </select>
                  {editPatientTypeError && (
                    <p className="text-sm text-red-600 mt-1">{editPatientTypeError}</p>
                  )}
              </div>

                

                {/* Conditional Fields based on PatientType */}
                {editAdmissionForm.patientType === 'OPD' && (
                  <div className="relative">
                    <Label htmlFor="edit-patientAppointmentId" className="dialog-label-standard">Patient Appointment ID *</Label>
                    <select
                      id="edit-patientAppointmentId"
                      className="dialog-input-standard w-full"
                      value={editAdmissionForm.patientAppointmentId}
                      onChange={(e) => setEditAdmissionForm({ ...editAdmissionForm, patientAppointmentId: e.target.value })}
                      required
                    >
                      <option value="">Select Appointment</option>
                      {editAvailableAppointments?.map((appointment: any) => {
                        const appointmentId = appointment.id || appointment.patientAppointmentId || appointment.PatientAppointmentId || '';
                        const tokenNo = appointment.tokenNo || appointment.TokenNo || '';
                        const appointmentDate = appointment.appointmentDate || appointment.AppointmentDate || '';
                        let formattedDate = '';
                        if (appointmentDate) {
                          try {
                            if (typeof appointmentDate === 'string') {
                              formattedDate = appointmentDate.split('T')[0];
                            } else {
                              formattedDate = new Date(appointmentDate).toISOString().split('T')[0];
                            }
                          } catch {
                            formattedDate = String(appointmentDate).split('T')[0] || 'N/A';
                          }
                        } else {
                          formattedDate = 'N/A';
                        }
                        return (
                          <option key={appointmentId} value={appointmentId}>
                            {tokenNo ? `Token: ${tokenNo} - ${formattedDate}` : `Appointment ID: ${appointmentId} - ${formattedDate}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {editAdmissionForm.patientType === 'IPD' && (
                  <div className="relative">
                    <Label htmlFor="edit-roomAdmissionId" className="dialog-label-standard">Patient IPD Admission ID *</Label>
                    <select
                      id="edit-roomAdmissionId"
                      className="dialog-input-standard w-full"
                      value={editAdmissionForm.roomAdmissionId}
                      onChange={(e) => setEditAdmissionForm({ ...editAdmissionForm, roomAdmissionId: e.target.value })}
                      required
                    >
                      <option value="">Select Patient IPD Admission ID</option>
                      {editAvailableIPDAdmissions?.map((admission: any) => {
                        const roomAdmissionId = admission.roomAdmissionId || admission.RoomAdmissionId || admission.admissionId || admission.id || '';
                        const bedNumber = admission.bedNumber || admission.BedNumber || admission.bedNo || admission.BedNo || '';
                        const roomType = admission.roomType || admission.RoomType || '';
                        const admissionDate = admission.roomAllocationDate || admission.RoomAllocationDate || admission.admissionDate || admission.AdmissionDate || '';
                        let formattedDate = '';
                        if (admissionDate) {
                          try {
                            if (typeof admissionDate === 'string') {
                              formattedDate = admissionDate.split('T')[0];
                            } else {
                              formattedDate = new Date(admissionDate).toISOString().split('T')[0];
                            }
                          } catch {
                            formattedDate = String(admissionDate).split('T')[0] || 'N/A';
                          }
                        } else {
                          formattedDate = 'N/A';
                        }
                        const status = admission.admissionStatus || admission.AdmissionStatus || admission.status || admission.Status || 'Active';
                        return (
                          <option key={roomAdmissionId} value={roomAdmissionId}>
                            {bedNumber ? `Bed: ${bedNumber} - ${roomType} - ${formattedDate} (${status})` : `ID: ${roomAdmissionId} - ${formattedDate} (${status})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {editAdmissionForm.patientType === 'Emergency' && (
                  <div className="relative">
                    <Label htmlFor="edit-emergencyBedSlotId" className="dialog-label-standard">Emergency Admission Bed No *</Label>
                    <select
                      id="edit-emergencyBedSlotId"
                      className="dialog-input-standard w-full"
                      value={editAdmissionForm.emergencyBedSlotId}
                      onChange={(e) => setEditAdmissionForm({ ...editAdmissionForm, emergencyBedSlotId: e.target.value })}
                      required
                    >
                      <option value="">Select Emergency Admission Bed No</option>
                      {editAvailableEmergencyBedSlots?.map((slot: any) => {
                        const emergencyAdmissionId = slot.emergencyAdmissionId || slot.EmergencyAdmissionId || slot.id || '';
                        const slotId = emergencyAdmissionId || slot.emergencyBedSlotId || slot.EmergencyBedSlotId || '';
                        const bedNo = slot.emergencyBedSlotNo || slot.EmergencyBedSlotNo || slot.bedNo || slot.BedNo || slot.emergencyBedNo || slot.EmergencyBedNo || '';
                        const status = slot.emergencyStatus || slot.EmergencyStatus || slot.status || slot.Status || '';
                        return (
                          <option key={slotId} value={emergencyAdmissionId || slotId}>
                            {bedNo ? `Bed: ${bedNo} - ${status}` : `ID: ${emergencyAdmissionId || slotId} - ${status}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Room/Bed Selection */}
                <div className="relative">
                  <Label htmlFor="edit-room-bed-search" className="dialog-label-standard">Room/Bed *</Label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      ref={editRoomBedInputRef}
                      id="edit-room-bed-search"
                      name="edit-room-bed-search"
                      autoComplete="off"
                      placeholder={editAdmissionForm.patientType ? "Search by Room No, Bed No, Room Type, or Category..." : "Please select Patient Type first"}
                      value={editRoomBedSearchTerm}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setEditRoomBedSearchTerm(newValue);
                        setEditRoomBedHighlightIndex(-1);
                        setShowEditRoomBedDropdown(true);
                        setEditRoomBedVisibleCount(10);
                        if (editAdmissionForm.roomBedId) {
                          setEditAdmissionForm({ ...editAdmissionForm, roomBedId: '', roomBedsId: '' });
                        }
                        requestAnimationFrame(() => {
                          if (editRoomBedInputRef.current) {
                            const rect = editRoomBedInputRef.current.getBoundingClientRect();
                            setEditRoomBedDropdownPosition({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width
                            });
                          }
                        });
                      }}
                      onFocus={() => {
                        setShowEditRoomBedDropdown(true);
                        setEditRoomBedVisibleCount(10);
                        requestAnimationFrame(() => {
                          if (editRoomBedInputRef.current) {
                            const rect = editRoomBedInputRef.current.getBoundingClientRect();
                            setEditRoomBedDropdownPosition({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width
                            });
                          }
                        });
                      }}
                      onBlur={(e) => {
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (!relatedTarget || !relatedTarget.closest('#edit-room-bed-dropdown')) {
                          setTimeout(() => setShowEditRoomBedDropdown(false), 200);
                        }
                      }}
                      onKeyDown={(e) => {
                        const filteredBeds = roomBedOptions.filter((bed: any) => {
                          if (!editRoomBedSearchTerm) return false;
                          const searchLower = editRoomBedSearchTerm.toLowerCase();
                          const roomNo = (bed as any).roomNo || (bed as any).RoomNo || '';
                          const bedNo = (bed as any).bedNo || (bed as any).BedNo || '';
                          const roomType = (bed as any).roomType || (bed as any).RoomType || '';
                          const roomCategory = (bed as any).roomCategory || (bed as any).RoomCategory || '';
                          return (
                            roomNo.toLowerCase().includes(searchLower) ||
                            bedNo.toLowerCase().includes(searchLower) ||
                            roomType.toLowerCase().includes(searchLower) ||
                            roomCategory.toLowerCase().includes(searchLower)
                          );
                        });
                        
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setEditRoomBedHighlightIndex(prev => 
                            prev < filteredBeds.length - 1 ? prev + 1 : prev
                          );
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setEditRoomBedHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                        } else if (e.key === 'Enter' && editRoomBedHighlightIndex >= 0 && filteredBeds[editRoomBedHighlightIndex]) {
                          e.preventDefault();
                          const bed = filteredBeds[editRoomBedHighlightIndex];
                          const roomBedId = (bed as any).roomBedId || (bed as any).RoomBedsId || (bed as any).id || '';
                          const roomNo = (bed as any).roomNo || (bed as any).RoomNo || '';
                          const bedNo = (bed as any).bedNo || (bed as any).BedNo || '';
                          const roomType = (bed as any).roomType || (bed as any).RoomType || '';
                          const roomBedsId = (bed as any).RoomBedsId || (bed as any).roomBedsId || roomBedId;
                          setEditAdmissionForm({ 
                            ...editAdmissionForm, 
                            roomBedId: String(roomBedId),
                            roomBedsId: String(roomBedsId),
                            roomType: roomType
                          });
                          setEditRoomBedSearchTerm(`${roomNo} - ${bedNo} (${roomType})`);
                          setEditRoomBedHighlightIndex(-1);
                          setShowEditRoomBedDropdown(false);
                        }
                      }}
                      disabled={false}
                      className={`dialog-input-standard w-full pl-10 ${!editAdmissionForm.patientType ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  {showEditRoomBedDropdown && !editAdmissionForm.roomBedId && editAdmissionForm.patientType && roomBedOptions.length > 0 && (
                    <div 
                      id="edit-room-bed-dropdown"
                      ref={editRoomBedDropdownRef}
                      className="border border-gray-200 rounded-md max-h-60 overflow-y-auto bg-white shadow-lg"
                      style={{ backgroundColor: 'white', opacity: 1 }}
                      onScroll={(e) => {
                        const target = e.target as HTMLDivElement;
                        const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                        if (scrollBottom < 50 && !editRoomBedLoadingMore) {
                          const filteredBeds = editRoomBedSearchTerm
                            ? roomBedOptions.filter((bed: any) => {
                                const searchLower = editRoomBedSearchTerm.toLowerCase();
                                const roomNo = (bed as any).roomNo || (bed as any).RoomNo || '';
                                const bedNo = (bed as any).bedNo || (bed as any).BedNo || '';
                                const roomType = (bed as any).roomType || (bed as any).RoomType || '';
                                const roomCategory = (bed as any).roomCategory || (bed as any).RoomCategory || '';
                                return (
                                  roomNo.toLowerCase().includes(searchLower) ||
                                  bedNo.toLowerCase().includes(searchLower) ||
                                  roomType.toLowerCase().includes(searchLower) ||
                                  roomCategory.toLowerCase().includes(searchLower)
                                );
                              })
                            : roomBedOptions;
                          
                          if (editRoomBedVisibleCount < filteredBeds.length) {
                            setEditRoomBedLoadingMore(true);
                            setTimeout(() => {
                              setEditRoomBedVisibleCount(prev => Math.min(prev + 10, filteredBeds.length));
                              setEditRoomBedLoadingMore(false);
                            }, 500);
                          }
                        }
                      }}
                    >
                      <table className="w-full">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Room No</th>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Bed No</th>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Room Type</th>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Category</th>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filteredBeds = editRoomBedSearchTerm
                              ? roomBedOptions.filter((bed: any) => {
                                  const searchLower = editRoomBedSearchTerm.toLowerCase();
                                  const roomNo = (bed as any).roomNo || (bed as any).RoomNo || '';
                                  const bedNo = (bed as any).bedNo || (bed as any).BedNo || '';
                                  const roomType = (bed as any).roomType || (bed as any).RoomType || '';
                                  const roomCategory = (bed as any).roomCategory || (bed as any).RoomCategory || '';
                                  return (
                                    roomNo.toLowerCase().includes(searchLower) ||
                                    bedNo.toLowerCase().includes(searchLower) ||
                                    roomType.toLowerCase().includes(searchLower) ||
                                    roomCategory.toLowerCase().includes(searchLower)
                                  );
                                })
                              : roomBedOptions;
                            
                            const visibleBeds = filteredBeds.slice(0, editRoomBedVisibleCount);
                            const hasMore = editRoomBedVisibleCount < filteredBeds.length;
                            
                            return visibleBeds.length > 0 ? (
                              <>
                                {visibleBeds.map((bed, index) => {
                                  const roomBedId = (bed as any).roomBedId || (bed as any).RoomBedsId || (bed as any).id || '';
                                  const roomNo = (bed as any).roomNo || (bed as any).RoomNo || '';
                                  const bedNo = (bed as any).bedNo || (bed as any).BedNo || '';
                                  const roomType = (bed as any).roomType || (bed as any).RoomType || '';
                                  const roomCategory = (bed as any).roomCategory || (bed as any).RoomCategory || '';
                                  const status = (bed as any).status || (bed as any).Status || '';
                                  const isSelected = editAdmissionForm.roomBedId === String(roomBedId);
                                  const isHighlighted = editRoomBedHighlightIndex === index;
                                  return (
                                    <tr
                                      key={roomBedId}
                                      onClick={() => {
                                        const roomBedsId = (bed as any).RoomBedsId || (bed as any).roomBedsId || roomBedId;
                                        setEditAdmissionForm({ 
                                          ...editAdmissionForm, 
                                          roomBedId: String(roomBedId),
                                          roomBedsId: String(roomBedsId),
                                          roomType: roomType
                                        });
                                        setEditRoomBedSearchTerm(`${roomNo} - ${bedNo} (${roomType})`);
                                        setEditRoomBedHighlightIndex(-1);
                                        setShowEditRoomBedDropdown(false);
                                      }}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                      }}
                                      className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                    >
                                      <td className="py-2 px-3 text-sm text-gray-900 font-mono">{roomNo || '-'}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{bedNo || '-'}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{roomType || '-'}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{roomCategory || '-'}</td>
                                      <td className="py-2 px-3 text-sm">
                                        <Badge variant={status === 'Active' ? 'default' : 'outline'}>
                                          {status || 'N/A'}
                                        </Badge>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {hasMore && (
                                  <tr>
                                    <td colSpan={5} className="text-center py-3 text-sm text-gray-500">
                                      {editRoomBedLoadingMore ? (
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
                                <td colSpan={5} className="text-center py-8 text-sm text-gray-700">
                                  No room beds found. Try a different search term.
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {editRoomBedError && (
                    <p className="text-sm text-red-600 mt-1">{editRoomBedError}</p>
                  )}
                </div>

                {/* Doctor Selection */}
                <div className="relative">
                  <Label htmlFor="edit-doctor-search" className="dialog-label-standard">Admitted By (Doctor) *</Label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      ref={editDoctorInputRef}
                      id="edit-doctor-search"
                      name="edit-doctor-search"
                      autoComplete="off"
                      placeholder={editAdmissionForm.patientType ? "Search by Doctor Name, ID, or Specialty..." : "Please select Patient Type first"}
                      value={editDoctorSearchTerm}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setEditDoctorSearchTerm(newValue);
                        setEditDoctorHighlightIndex(-1);
                        setShowEditDoctorDropdown(true);
                        setEditDoctorVisibleCount(10);
                        if (editAdmissionForm.admittedByDoctorId) {
                          setEditAdmissionForm({ ...editAdmissionForm, admittedByDoctorId: '', doctorId: '' });
                        }
                        requestAnimationFrame(() => {
                          if (editDoctorInputRef.current) {
                            const rect = editDoctorInputRef.current.getBoundingClientRect();
                            setEditDoctorDropdownPosition({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width
                            });
                          }
                        });
                      }}
                      onFocus={() => {
                        setShowEditDoctorDropdown(true);
                        setEditDoctorVisibleCount(10);
                        requestAnimationFrame(() => {
                          if (editDoctorInputRef.current) {
                            const rect = editDoctorInputRef.current.getBoundingClientRect();
                            setEditDoctorDropdownPosition({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width
                            });
                          }
                        });
                      }}
                      onBlur={(e) => {
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (!relatedTarget || !relatedTarget.closest('#edit-doctor-dropdown')) {
                          setTimeout(() => setShowEditDoctorDropdown(false), 200);
                        }
                      }}
                      onKeyDown={(e) => {
                        const filteredDoctors = doctorOptions.filter((doctor: any) => {
                          if (!editDoctorSearchTerm) return false;
                          const searchLower = editDoctorSearchTerm.toLowerCase();
                          const doctorId = String((doctor as any).id || (doctor as any).Id || (doctor as any).UserId || '');
                          const doctorName = (doctor as any).name || (doctor as any).Name || (doctor as any).UserName || '';
                          const specialty = (doctor as any).specialty || (doctor as any).Specialty || (doctor as any).DoctorDepartmentName || '';
                          return (
                            doctorId.toLowerCase().includes(searchLower) ||
                            doctorName.toLowerCase().includes(searchLower) ||
                            specialty.toLowerCase().includes(searchLower)
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
                          const doctorId = String((doctor as any).id || (doctor as any).Id || (doctor as any).UserId || '');
                          const doctorName = (doctor as any).name || (doctor as any).Name || (doctor as any).UserName || '';
                          const specialty = (doctor as any).specialty || (doctor as any).Specialty || (doctor as any).DoctorDepartmentName || '';
                          setEditAdmissionForm({ 
                            ...editAdmissionForm, 
                            admittedByDoctorId: doctorId,
                            doctorId: doctorId
                          });
                          setEditDoctorSearchTerm(`${doctorName}${specialty ? ` - ${specialty}` : ''}`);
                          setEditDoctorHighlightIndex(-1);
                          setShowEditDoctorDropdown(false);
                        }
                      }}
                      disabled={!editAdmissionForm.patientType}
                      className={`dialog-input-standard w-full pl-10 ${!editAdmissionForm.patientType ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  {showEditDoctorDropdown && !editAdmissionForm.admittedByDoctorId && editAdmissionForm.patientType && doctorOptions.length > 0 && (
                    <div 
                      id="edit-doctor-dropdown"
                      ref={editDoctorDropdownRef}
                      className="border border-gray-200 rounded-md max-h-60 overflow-y-auto bg-white shadow-lg"
                      style={{ backgroundColor: 'white', opacity: 1 }}
                      onScroll={(e) => {
                        const target = e.target as HTMLDivElement;
                        const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
                        if (scrollBottom < 50 && !editDoctorLoadingMore) {
                          const filteredDoctors = editDoctorSearchTerm
                            ? doctorOptions.filter((doctor: any) => {
                                const searchLower = editDoctorSearchTerm.toLowerCase();
                                const doctorId = String((doctor as any).id || (doctor as any).Id || (doctor as any).UserId || '');
                                const doctorName = (doctor as any).name || (doctor as any).Name || (doctor as any).UserName || '';
                                const specialty = (doctor as any).specialty || (doctor as any).Specialty || (doctor as any).DoctorDepartmentName || '';
                                return (
                                  doctorId.toLowerCase().includes(searchLower) ||
                                  doctorName.toLowerCase().includes(searchLower) ||
                                  specialty.toLowerCase().includes(searchLower)
                                );
                              })
                            : doctorOptions;
                          
                          if (editDoctorVisibleCount < filteredDoctors.length) {
                            setEditDoctorLoadingMore(true);
                            setTimeout(() => {
                              setEditDoctorVisibleCount(prev => Math.min(prev + 10, filteredDoctors.length));
                              setEditDoctorLoadingMore(false);
                            }, 500);
                          }
                        }
                      }}
                    >
                      <table className="w-full">
                        <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Doctor ID</th>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Specialty</th>
                            <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filteredDoctors = editDoctorSearchTerm
                              ? doctorOptions.filter((doctor: any) => {
                                  const searchLower = editDoctorSearchTerm.toLowerCase();
                                  const doctorId = String((doctor as any).id || (doctor as any).Id || (doctor as any).UserId || '');
                                  const doctorName = (doctor as any).name || (doctor as any).Name || (doctor as any).UserName || '';
                                  const specialty = (doctor as any).specialty || (doctor as any).Specialty || (doctor as any).DoctorDepartmentName || '';
                                  return (
                                    doctorId.toLowerCase().includes(searchLower) ||
                                    doctorName.toLowerCase().includes(searchLower) ||
                                    specialty.toLowerCase().includes(searchLower)
                                  );
                                })
                              : doctorOptions;
                            
                            const visibleDoctors = filteredDoctors.slice(0, editDoctorVisibleCount);
                            const hasMore = editDoctorVisibleCount < filteredDoctors.length;
                            
                            return visibleDoctors.length > 0 ? (
                              <>
                                {visibleDoctors.map((doctor, index) => {
                                  const doctorId = String((doctor as any).id || (doctor as any).Id || (doctor as any).UserId || '');
                                  const doctorName = (doctor as any).name || (doctor as any).Name || (doctor as any).UserName || '';
                                  const specialty = (doctor as any).specialty || (doctor as any).Specialty || (doctor as any).DoctorDepartmentName || '';
                                  const doctorType = (doctor as any).type || (doctor as any).Type || (doctor as any).doctorType || '';
                                  const isSelected = editAdmissionForm.admittedByDoctorId === doctorId;
                                  const isHighlighted = editDoctorHighlightIndex === index;
                                  return (
                                    <tr
                                      key={doctorId}
                                      onClick={() => {
                                        setEditAdmissionForm({ 
                                          ...editAdmissionForm, 
                                          admittedByDoctorId: doctorId,
                                          doctorId: doctorId
                                        });
                                        setEditDoctorSearchTerm(`${doctorName}${specialty ? ` - ${specialty}` : ''}`);
                                        setEditDoctorHighlightIndex(-1);
                                        setShowEditDoctorDropdown(false);
                                      }}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                      }}
                                      className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
                                    >
                                      <td className="py-2 px-3 text-sm text-gray-900 font-mono">{doctorId || '-'}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{doctorName || '-'}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{specialty || '-'}</td>
                                      <td className="py-2 px-3 text-sm text-gray-600">{doctorType || '-'}</td>
                                    </tr>
                                  );
                                })}
                                {hasMore && (
                                  <tr>
                                    <td colSpan={4} className="text-center py-3 text-sm text-gray-500">
                                      {editDoctorLoadingMore ? (
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
                                <td colSpan={4} className="text-center py-8 text-sm text-gray-700">
                                  No doctors found. Try a different search term.
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {editDoctorError && (
                    <p className="text-sm text-red-600 mt-1">{editDoctorError}</p>
                  )}
                </div>

                {/* Room Allocation Date */}
                <div className="relative">
                  <Label htmlFor="edit-roomAllocationDate" className="dialog-label-standard">Room Allocation Date *</Label>
                  <ISTDatePicker
                    selected={editAdmissionForm.roomAllocationDate ? (() => {
                      // Parse YYYY-MM-DD format correctly (no timezone conversion)
                      const dateStr = editAdmissionForm.roomAllocationDate;
                      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                        const [year, month, day] = dateStr.split('-').map(Number);
                        return new Date(year, month - 1, day);
                      }
                      return null;
                    })() : null}
                    onChange={(dateStr: string | null, date: Date | null) => {
                      if (date) {
                        // Format as YYYY-MM-DD like FrontDesk (no timezone conversion)
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const formattedDate = `${year}-${month}-${day}`;
                        setEditAdmissionForm({ ...editAdmissionForm, roomAllocationDate: formattedDate });
                        setEditRoomAllocationDateError('');
                      } else {
                        setEditAdmissionForm({ ...editAdmissionForm, roomAllocationDate: '' });
                      }
                    }}
                    dateFormat="dd-MM-yyyy"
                    placeholderText="Select room allocation date"
                    className="dialog-input-standard w-full"
                    wrapperClassName="w-full"
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown
                  />
                  {editRoomAllocationDateError && (
                    <p className="text-sm text-red-600 mt-1">{editRoomAllocationDateError}</p>
                  )}
                </div>

                {/* Room Vacant Date */}
                <div className="relative">
                  <Label htmlFor="edit-roomVacantDate" className="dialog-label-standard">Room Vacant Date</Label>
                  <ISTDatePicker
                    selected={editAdmissionForm.roomVacantDate ? (() => {
                      // Parse YYYY-MM-DD format correctly (no timezone conversion)
                      const dateStr = editAdmissionForm.roomVacantDate;
                      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                        const [year, month, day] = dateStr.split('-').map(Number);
                        return new Date(year, month - 1, day);
                      }
                      return null;
                    })() : null}
                    onChange={(dateStr: string | null, date: Date | null) => {
                      if (date) {
                        // Format as YYYY-MM-DD (no timezone conversion)
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const formattedDate = `${year}-${month}-${day}`;
                        setEditAdmissionForm({ ...editAdmissionForm, roomVacantDate: formattedDate });
                      } else {
                        setEditAdmissionForm({ ...editAdmissionForm, roomVacantDate: '' });
                      }
                    }}
                    dateFormat="dd-MM-yyyy"
                    placeholderText="Select room vacant date"
                    className="dialog-input-standard w-full"
                    wrapperClassName="w-full"
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown
                  />
                </div>

                {/* Admission Status */}
                <div className="relative">
                  <Label htmlFor="edit-admissionStatus" className="dialog-label-standard">Admission Status *</Label>
                  <select
                    id="edit-admissionStatus"
                    className="dialog-input-standard w-full"
                    value={editAdmissionForm.admissionStatus}
                    onChange={(e) => {
                      setEditAdmissionForm({ ...editAdmissionForm, admissionStatus: e.target.value });
                      setEditAdmissionStatusError('');
                    }}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Moved To ICU">Moved To ICU</option>
                    <option value="Surgery Scheduled">Surgery Scheduled</option>
                    <option value="Discharged">Discharged</option>
                  </select>
                  {editAdmissionStatusError && (
                    <p className="text-sm text-red-600 mt-1">{editAdmissionStatusError}</p>
                  )}
                </div>

                {/* Case Sheet */}
                <div className="relative">
                  <Label htmlFor="edit-caseSheet" className="dialog-label-standard">Case Sheet</Label>
                  <Input
                    id="edit-caseSheet"
                    className="dialog-input-standard w-full"
                    placeholder="Enter case sheet"
                    value={editAdmissionForm.caseSheet}
                    onChange={(e) => setEditAdmissionForm({ ...editAdmissionForm, caseSheet: e.target.value })}
                  />
                </div>

                {/* Case Details */}
                <div className="relative">
                  <Label htmlFor="edit-caseDetails" className="dialog-label-standard">Case Details</Label>
                  <Textarea
                    id="edit-caseDetails"
                    className="dialog-input-standard w-full"
                    placeholder="Enter case details"
                    value={editAdmissionForm.caseDetails}
                    onChange={(e) => setEditAdmissionForm({ ...editAdmissionForm, caseDetails: e.target.value })}
                    rows={4}
                  />
                </div>

                {/* Is Linked To ICU */}
                <div className="relative">
                  <Label htmlFor="edit-isLinkedToICU" className="dialog-label-standard">Is Linked To ICU *</Label>
                  <select
                    id="edit-isLinkedToICU"
                    className="dialog-input-standard w-full"
                    value={editAdmissionForm.isLinkedToICU}
                    onChange={(e) => setEditAdmissionForm({ ...editAdmissionForm, isLinkedToICU: e.target.value })}
                    required
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {/* OT Scheduled */}
                <div className="relative">
                  <Label htmlFor="edit-scheduleOT" className="dialog-label-standard">OT Scheduled *</Label>
                  <select
                    id="edit-scheduleOT"
                    className="dialog-input-standard w-full"
                    value={editAdmissionForm.scheduleOT}
                    onChange={(e) => setEditAdmissionForm({ ...editAdmissionForm, scheduleOT: e.target.value })}
                    required
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {/* Shift to Another Room */}
                <div className="relative">
                  <Label htmlFor="edit-shiftToAnotherRoom" className="dialog-label-standard">Shift to Another Room</Label>
                  <select
                    id="edit-shiftToAnotherRoom"
                    className="dialog-input-standard w-full"
                    value={editAdmissionForm.shiftToAnotherRoom}
                    onChange={(e) => setEditAdmissionForm({ ...editAdmissionForm, shiftToAnotherRoom: e.target.value })}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                {/* Shifted To Details */}
                <div className="relative">
                  <Label htmlFor="edit-shiftedToDetails" className="dialog-label-standard">Shifted Details</Label>
                  <Input
                    id="edit-shiftedToDetails"
                    className="dialog-input-standard w-full"
                    placeholder="Enter shifted details"
                    value={editAdmissionForm.shiftedToDetails}
                    onChange={(e) => setEditAdmissionForm({ ...editAdmissionForm, shiftedToDetails: e.target.value })}
                  />
                </div>

                {/* Status Toggle - Last Row */}
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="edit-status" className="dialog-label-standard">Status</Label>
                    <div className="flex-shrink-0 relative" style={{ zIndex: 1 }}>
                      <Switch
                        id="edit-status"
                        checked={editAdmissionForm.status === 'Active'}
                        onCheckedChange={(checked) => {
                          setEditAdmissionForm({ 
                            ...editAdmissionForm, 
                            status: checked ? 'Active' : 'Inactive' 
                          });
                        }}
                        className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 [&_[data-slot=switch-thumb]]:!bg-white [&_[data-slot=switch-thumb]]:!border [&_[data-slot=switch-thumb]]:!border-gray-400 [&_[data-slot=switch-thumb]]:!shadow-sm"
                        style={{
                          width: '2.5rem',
                          height: '1.5rem',
                          minWidth: '2.5rem',
                          minHeight: '1.5rem',
                          display: 'inline-flex',
                          position: 'relative',
                          backgroundColor: editAdmissionForm.status === 'Active' ? '#2563eb' : '#d1d5db',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {admissionError && (
              <div className="px-6 pb-2 flex-shrink-0 bg-white">
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {admissionError}
                </div>
              </div>
            )}
            <DialogFooter className="px-6 py-3 flex-shrink-0 border-t bg-white">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={savingAdmission}>
                Cancel
              </Button>
              <Button onClick={async () => {
                setSavingAdmission(true);
                setAdmissionError(null);
                
                // Clear previous validation errors
                setEditPatientError('');
                setEditPatientTypeError('');
                setEditRoomBedError('');
                setEditDoctorError('');
                setEditRoomAllocationDateError('');
                setEditAdmissionStatusError('');
                
                // Validate required fields
                let hasErrors = false;
                
                if (!editAdmissionForm.patientId) {
                  setEditPatientError('Please select a patient from the list.');
                  hasErrors = true;
                }
                
                if (!editAdmissionForm.patientType) {
                  setEditPatientTypeError('Please select a patient type.');
                  hasErrors = true;
                } else {
                  if (editAdmissionForm.patientType === 'OPD' && !editAdmissionForm.patientAppointmentId) {
                    setEditPatientTypeError('Patient Appointment ID is required for OPD patients.');
                    hasErrors = true;
                  }
                  if (editAdmissionForm.patientType === 'IPD' && !(editAdmissionForm as any).roomAdmissionId) {
                    setEditPatientTypeError('Patient IPD Admission ID is required for IPD patients.');
                    hasErrors = true;
                  }
                  if (editAdmissionForm.patientType === 'Emergency' && !editAdmissionForm.emergencyBedSlotId) {
                    setEditPatientTypeError('Emergency Admission Bed No is required for Emergency patients.');
                    hasErrors = true;
                  }
                }
                
                if (!editAdmissionForm.roomBedId) {
                  setEditRoomBedError('Please select a room/bed.');
                  hasErrors = true;
                }
                
                if (!editAdmissionForm.admittedByDoctorId && !editAdmissionForm.doctorId) {
                  setEditDoctorError('Please select a doctor from the list.');
                  hasErrors = true;
                }
                
                if (!editAdmissionForm.roomAllocationDate) {
                  setEditRoomAllocationDateError('Room Allocation Date is required.');
                  hasErrors = true;
                }
                
                // Validate admissionStatus is one of the allowed values
                const allowedAdmissionStatuses = ['Active', 'Moved To ICU', 'Surgery Scheduled', 'Discharged'];
                if (!editAdmissionForm.admissionStatus || !allowedAdmissionStatuses.includes(editAdmissionForm.admissionStatus)) {
                  setEditAdmissionStatusError('Admission Status must be one of: Active, Moved To ICU, Surgery Scheduled, Discharged.');
                  hasErrors = true;
                }
                
                if (!editAdmissionForm.roomAdmissionId) {
                  setAdmissionError('Room Admission ID is required for updating');
                  hasErrors = true;
                }
                
                if (hasErrors) {
                  setSavingAdmission(false);
                  return;
                }
                
                try {

                  // Format request body according to API specification
                  // Convert roomAllocationDate from YYYY-MM-DD to DD-MM-YYYY format for backend
                  let roomAllocationDateFormatted = '';
                  if (editAdmissionForm.roomAllocationDate) {
                    const dateStr = editAdmissionForm.roomAllocationDate;
                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                      // Convert YYYY-MM-DD to DD-MM-YYYY
                      const [year, month, day] = dateStr.split('-');
                      roomAllocationDateFormatted = `${day}-${month}-${year}`;
                    } else {
                      roomAllocationDateFormatted = editAdmissionForm.roomAllocationDate;
                    }
                  }
                  
                  // Convert roomVacantDate from YYYY-MM-DD to DD-MM-YYYY format for backend
                  let roomVacantDateFormatted = null;
                  if (editAdmissionForm.roomVacantDate) {
                    const dateStr = editAdmissionForm.roomVacantDate;
                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                      // Convert YYYY-MM-DD to DD-MM-YYYY
                      const [year, month, day] = dateStr.split('-');
                      roomVacantDateFormatted = `${day}-${month}-${year}`;
                    } else {
                      roomVacantDateFormatted = editAdmissionForm.roomVacantDate;
                    }
                  }
                  
                  const updatePayload: any = {
                    PatientAppointmentId: editAdmissionForm.patientAppointmentId ? Number(editAdmissionForm.patientAppointmentId) : null,
                    EmergencyAdmissionId: editAdmissionForm.emergencyBedSlotId ? Number(editAdmissionForm.emergencyBedSlotId) : null,
                    PatientType: editAdmissionForm.patientType || null,
                    AdmittingDoctorId: editAdmissionForm.admittedByDoctorId ? Number(editAdmissionForm.admittedByDoctorId) : (editAdmissionForm.doctorId ? Number(editAdmissionForm.doctorId) : null),
                    PatientId: editAdmissionForm.patientId || '',
                    RoomBedsId: editAdmissionForm.roomBedsId ? Number(editAdmissionForm.roomBedsId) : null,
                    RoomAllocationDate: roomAllocationDateFormatted || '',
                    RoomVacantDate: roomVacantDateFormatted,
                    AdmissionStatus: editAdmissionForm.admissionStatus || 'Active',
                    CaseSheetDetails: editAdmissionForm.caseDetails || null,
                    CaseSheet: editAdmissionForm.caseSheet || null,
                    ShiftToAnotherRoom: editAdmissionForm.shiftToAnotherRoom || 'No',
                    ShiftedTo: editAdmissionForm.shiftedTo || null,
                    ShiftedToDetails: editAdmissionForm.shiftedToDetails || null,
                    ScheduleOT: editAdmissionForm.scheduleOT || 'No',
                    OTAdmissionId: editAdmissionForm.otAdmissionId ? Number(editAdmissionForm.otAdmissionId) : null,
                    IsLinkedToICU: editAdmissionForm.isLinkedToICU || 'No',
                    ICUAdmissionId: editAdmissionForm.icuAdmissionId || null,
                    BillId: editAdmissionForm.billId ? Number(editAdmissionForm.billId) : null,
                    AllocatedBy: null, // Can be set if needed
                    Status: editAdmissionForm.status || 'Active'
                  };

                  console.log('Updating admission with payload:', updatePayload);

                  // Call PUT /api/room-admissions/:id
                  await apiRequest<any>(`/room-admissions/${editAdmissionForm.roomAdmissionId}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatePayload),
                  });

                  console.log('Admission updated successfully');
                  
                  await fetchAdmissions();
                  await fetchRoomCapacityOverview();
                  await fetchDashboardMetrics();
                  setIsEditDialogOpen(false);
                  setEditingAdmission(null);
                } catch (error: any) {
                  console.error('Error updating admission:', error);
                  setAdmissionError(error?.message || 'Failed to update admission. Please try again.');
                } finally {
                  setSavingAdmission(false);
                }
              }} className="dialog-footer-button" disabled={savingAdmission}>
                {savingAdmission ? 'Updating...' : 'Update Admission'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View & Edit Admission Dialog */}
        <Dialog open={isViewEditDialogOpen} onOpenChange={setIsViewEditDialogOpen}>
          <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh] bg-white">
            <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
              <DialogTitle>{editingAdmission ? `Manage Admission - ${editingAdmission.patientName}` : 'Manage Admission'}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
              <div className="space-y-4 py-4">
                {admissionError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {admissionError}
        </div>
                )}

                {/* Edit Mode - Show form fields (always editable) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Patient Selection */}
                    <div className="md:col-span-2">
                      <Label htmlFor="patient-search-edit">Patient *</Label>
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                          id="patient-search-edit"
                          placeholder="Search by Patient ID, Name, or Mobile Number..."
                          value={patientSearchTerm}
                          onChange={(e) => setPatientSearchTerm(e.target.value)}
                          className="pl-10"
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
                              {patientOptions
                                .filter((patient: any) => {
                                  const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                                  // Exclude patient with ID 8dd9786e from inpatient dropdown
                                  if (patientId && patientId.toLowerCase().includes('8dd9786e')) {
                                    return false;
                                  }
                                  if (!patientSearchTerm) return false;
                                  const searchLower = patientSearchTerm.toLowerCase();
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
                                .map((patient: any) => {
                                  const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                                  const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                                  const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                                  const lastName = (patient as any).lastName || (patient as any).LastName || '';
                                  const fullName = `${patientName} ${lastName}`.trim();
                                  const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                                  const isSelected = addAdmissionForm.patientId === patientId;
                                  return (
                                    <tr
                                      key={patientId}
                                      onClick={async () => {
                                        const updatedForm = { ...addAdmissionForm, patientId };
                                        setAddAdmissionForm(updatedForm);
                                        setPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
                                        
                                        // If PatientType is already set, fetch conditional data
                                        if (updatedForm.patientType === 'OPD' && patientId) {
                                          await fetchPatientAppointments(patientId);
                                        } else if (updatedForm.patientType === 'Emergency' && patientId) {
                                          await fetchPatientEmergencyBedSlots(patientId);
                                        }
                                        // Keep dropdown open to allow selecting a different patient
                                      }}
                                      className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''}`}
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
                      )}
                    </div>

                    {/* Patient Type */}
                    <div>
                      <Label htmlFor="patientType-edit">Patient Type *</Label>
                      <Input
                        id="patientType-edit"
                        value={addAdmissionForm.patientType || 'N/A'}
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>

                    {/* Conditional Fields based on PatientType */}
                    {addAdmissionForm.patientType === 'OPD' && (
                      <div>
                        <Label htmlFor="patientAppointmentId-edit">Patient Appointment ID *</Label>
                        <Input
                          id="patientAppointmentId-edit"
                          value={(() => {
                            if (!addAdmissionForm.patientAppointmentId) return 'N/A';
                            const appointment = availableAppointments.find((a: any) => {
                              const appointmentId = a.id || a.patientAppointmentId || a.PatientAppointmentId || '';
                              return String(appointmentId) === String(addAdmissionForm.patientAppointmentId);
                            });
                            if (appointment) {
                              const tokenNo = appointment.tokenNo || appointment.TokenNo || '';
                              const appointmentDate = appointment.appointmentDate || appointment.AppointmentDate || '';
                              let formattedDate = '';
                              if (appointmentDate) {
                                try {
                                  if (typeof appointmentDate === 'string') {
                                    formattedDate = appointmentDate.split('T')[0];
                                  } else {
                                    formattedDate = new Date(appointmentDate).toISOString().split('T')[0];
                                  }
                                } catch {
                                  formattedDate = String(appointmentDate).split('T')[0] || 'N/A';
                                }
                              } else {
                                formattedDate = 'N/A';
                              }
                              return tokenNo ? `Token: ${tokenNo} - ${formattedDate}` : `Appointment ID: ${addAdmissionForm.patientAppointmentId} - ${formattedDate}`;
                            }
                            return addAdmissionForm.patientAppointmentId || 'N/A';
                          })()}
                          readOnly
                          className="bg-gray-100"
                        />
                      </div>
                    )}

                    {addAdmissionForm.patientType === 'Emergency' && (
                      <div>
                        <Label htmlFor="emergencyBedSlotId-edit">Emergency Bed Slot ID *</Label>
                        <Input
                          id="emergencyBedSlotId-edit"
                          value={(() => {
                            if (!addAdmissionForm.emergencyBedSlotId) return 'N/A';
                            const slot = availableEmergencyBedSlots.find((s: any) => {
                              const slotId = s.id || s.emergencyBedSlotId || s.EmergencyBedSlotId || '';
                              return String(slotId) === String(addAdmissionForm.emergencyBedSlotId);
                            });
                            if (slot) {
                              const bedNo = slot.bedNo || slot.BedNo || '';
                              const status = slot.status || slot.Status || '';
                              return bedNo ? `Bed: ${bedNo} - ${status}` : `Slot ID: ${addAdmissionForm.emergencyBedSlotId} - ${status}`;
                            }
                            return addAdmissionForm.emergencyBedSlotId || 'N/A';
                          })()}
                          readOnly
                          className="bg-gray-100"
                        />
                      </div>
                    )}

                    {/* Room/Bed Selection */}
                    <div className="md:col-span-2">
                      <Label htmlFor="room-bed-search-edit">Room/Bed *</Label>
                      <Input
                        id="room-bed-search-edit"
                        value={(() => {
                          // First try to find by roomBedId
                          let selectedBed = roomBedOptions.find((b: any) => {
                            const bid = (b as any).roomBedId || (b as any).RoomBedsId || (b as any).id || '';
                            return String(bid) === addAdmissionForm.roomBedId;
                          });
                          
                          // If not found, try to find by roomBedsId
                          if (!selectedBed && addAdmissionForm.roomBedsId) {
                            selectedBed = roomBedOptions.find((b: any) => {
                              const bids = (b as any).RoomBedsId || (b as any).roomBedsId || (b as any).roomBedId || (b as any).id || '';
                              return String(bids) === addAdmissionForm.roomBedsId;
                            });
                          }
                          
                          // If still not found, try to find by bedNumber
                          if (!selectedBed && addAdmissionForm.bedNumber) {
                            selectedBed = roomBedOptions.find((b: any) => {
                              const bedNo = (b as any).bedNo || (b as any).BedNo || '';
                              return bedNo === addAdmissionForm.bedNumber;
                            });
                          }
                          
                          if (selectedBed) {
                            const bedNo = (selectedBed as any).bedNo || (selectedBed as any).BedNo || '';
                            const roomBedsId = (selectedBed as any).RoomBedsId || (selectedBed as any).roomBedsId || (selectedBed as any).roomBedId || (selectedBed as any).id || '';
                            const roomNo = (selectedBed as any).roomNo || (selectedBed as any).RoomNo || '';
                            const roomType = (selectedBed as any).roomType || (selectedBed as any).RoomType || '';
                            return `Bed No: ${bedNo}, RoomBedsId: ${roomBedsId}${roomNo ? ` (${roomNo} - ${roomType})` : ''}`;
                          }
                          
                          // Fallback: show what we have
                          if (addAdmissionForm.bedNumber && addAdmissionForm.roomBedsId) {
                            return `Bed No: ${addAdmissionForm.bedNumber}, RoomBedsId: ${addAdmissionForm.roomBedsId}`;
                          }
                          if (addAdmissionForm.bedNumber) {
                            return `Bed No: ${addAdmissionForm.bedNumber}`;
                          }
                          if (addAdmissionForm.roomBedsId) {
                            return `RoomBedsId: ${addAdmissionForm.roomBedsId}`;
                          }
                          if (addAdmissionForm.roomBedId) {
                            return `Room Bed ID: ${addAdmissionForm.roomBedId}`;
                          }
                          return 'N/A';
                        })()}
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>

                    {/* Doctor Selection */}
                    <div className="md:col-span-2">
                      <Label htmlFor="doctor-search-edit">Admitted By (Doctor) *</Label>
                      <Input
                        id="doctor-search-edit"
                        value={(() => {
                          const selectedDoctor = doctorOptions.find((d: any) => {
                            const did = String((d as any).id || (d as any).Id || (d as any).UserId || '');
                            return did === addAdmissionForm.admittedByDoctorId;
                          });
                          if (selectedDoctor) {
                            const doctorName = (selectedDoctor as any).name || (selectedDoctor as any).Name || (selectedDoctor as any).UserName || '';
                            const specialty = (selectedDoctor as any).specialty || (selectedDoctor as any).Specialty || (selectedDoctor as any).DoctorDepartmentName || '';
                            return `${doctorName}${specialty ? ` - ${specialty}` : ''}`;
                          }
                          return addAdmissionForm.admittedBy || addAdmissionForm.admittedByDoctorId || 'N/A';
                        })()}
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>

                    <div>
                      <Label htmlFor="roomAllocationDate-edit">Room Allocation Date *</Label>
                      <Input 
                        id="roomAllocationDate-edit" 
                        type="date"
                        value={addAdmissionForm.roomAllocationDate}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, roomAllocationDate: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="admissionStatus-edit">Admission Status *</Label>
                      <select
                        id="admissionStatus-edit"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md"
                        value={addAdmissionForm.admissionStatus}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, admissionStatus: e.target.value })}
                        required
                      >
                        <option value="Active">Active</option>
                        <option value="Moved to ICU">Moved to ICU</option>
                        <option value="Surgery Scheduled">Surgery Scheduled</option>
                        <option value="Discharged">Discharged</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="caseSheet-edit">Case Sheet</Label>
                      <Input 
                        id="caseSheet-edit" 
                        placeholder="Enter case sheet" 
                        value={addAdmissionForm.caseSheet}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, caseSheet: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="caseDetails-edit">Case Details</Label>
                      <Textarea 
                        id="caseDetails-edit" 
                        placeholder="Enter case details" 
                        value={addAdmissionForm.caseDetails}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, caseDetails: e.target.value })}
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="isLinkedToICU-edit">Is Linked To ICU *</Label>
                      <select
                        id="isLinkedToICU-edit"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md"
                        value={addAdmissionForm.isLinkedToICU}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, isLinkedToICU: e.target.value })}
                        required
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    {/* Additional fields from API response */}
                    <div>
                      <Label htmlFor="patientNo-edit">Patient No</Label>
                      <Input 
                        id="patientNo-edit" 
                        value={addAdmissionForm.patientNo}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, patientNo: e.target.value })}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>

                    <div>
                      <Label htmlFor="age-edit">Age</Label>
                      <Input 
                        id="age-edit" 
                        type="number"
                        value={addAdmissionForm.age}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, age: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="gender-edit">Gender</Label>
                      <Input 
                        id="gender-edit" 
                        value={addAdmissionForm.gender}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, gender: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="bedNumber-edit">Bed Number</Label>
                      <Input 
                        id="bedNumber-edit" 
                        value={addAdmissionForm.bedNumber}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, bedNumber: e.target.value })}
                      />
                    </div>

                    {addAdmissionForm.patientType === 'OPD' && (
                      <>
                        <div>
                          <Label htmlFor="appointmentTokenNo-edit">Appointment Token No</Label>
                          <Input 
                            id="appointmentTokenNo-edit" 
                            value={addAdmissionForm.appointmentTokenNo}
                            onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, appointmentTokenNo: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="appointmentDate-edit">Appointment Date</Label>
                          <Input 
                            id="appointmentDate-edit" 
                            type="date"
                            value={addAdmissionForm.appointmentDate}
                            onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, appointmentDate: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    {addAdmissionForm.patientType === 'Emergency' && (
                      <>
                        <div>
                          <Label htmlFor="emergencyBedNo-edit">Emergency Bed No</Label>
                          <Input 
                            id="emergencyBedNo-edit" 
                            value={addAdmissionForm.emergencyBedNo}
                            onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, emergencyBedNo: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="eBedSlotNo-edit">E Bed Slot No</Label>
                          <Input 
                            id="eBedSlotNo-edit" 
                            value={addAdmissionForm.eBedSlotNo}
                            onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, eBedSlotNo: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="emergencyAdmissionDate-edit">Emergency Admission Date</Label>
                          <Input 
                            id="emergencyAdmissionDate-edit" 
                            type="date"
                            value={addAdmissionForm.emergencyAdmissionDate}
                            onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, emergencyAdmissionDate: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <Label htmlFor="roomVacantDate-edit">Room Vacant Date</Label>
                      <Input 
                        id="roomVacantDate-edit" 
                        type="date"
                        value={addAdmissionForm.roomVacantDate}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, roomVacantDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="shiftToAnotherRoom-edit">Shift To Another Room</Label>
                      <select
                        id="shiftToAnotherRoom-edit"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md"
                        value={addAdmissionForm.shiftToAnotherRoom}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, shiftToAnotherRoom: e.target.value })}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="shiftedTo-edit">Shifted To</Label>
                      <Input 
                        id="shiftedTo-edit" 
                        value={addAdmissionForm.shiftedTo}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, shiftedTo: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="shiftedToDetails-edit">Shifted To Details</Label>
                      <Textarea 
                        id="shiftedToDetails-edit" 
                        value={addAdmissionForm.shiftedToDetails}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, shiftedToDetails: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="scheduleOT-edit">Schedule OT</Label>
                      <select
                        id="scheduleOT-edit"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md"
                        value={addAdmissionForm.scheduleOT}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, scheduleOT: e.target.value })}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="otAdmissionId-edit">OT Admission ID</Label>
                      <Input 
                        id="otAdmissionId-edit" 
                        value={addAdmissionForm.otAdmissionId}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, otAdmissionId: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="icuAdmissionId-edit">ICU Admission ID</Label>
                      <Input 
                        id="icuAdmissionId-edit" 
                        value={addAdmissionForm.icuAdmissionId}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, icuAdmissionId: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="billId-edit">Bill ID</Label>
                      <Input 
                        id="billId-edit" 
                        value={addAdmissionForm.billId}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, billId: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="estimatedStay-edit">Estimated Stay</Label>
                      <Input 
                        id="estimatedStay-edit" 
                        value={addAdmissionForm.estimatedStay}
                        onChange={(e) => setAddAdmissionForm({ ...addAdmissionForm, estimatedStay: e.target.value })}
                        placeholder="e.g., 5 days"
                      />
                    </div>
                  </div>
              </div>
            </div>
            <DialogFooter className="px-6 py-3 flex-shrink-0 border-t bg-white">
              {admissionError && (
                <div className="w-full p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-2">
                  {admissionError}
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewEditDialogOpen(false);
                  setEditingAdmission(null);
                  setAdmissionError(null);
                }}
                disabled={savingAdmission}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAdmission}
                disabled={savingAdmission}
              >
                {savingAdmission ? 'Saving...' : 'Update Room Admission'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </div>
        </div>

        <div className="dashboard-main-content">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Admissions</p>
              <BedDouble className="size-5 text-blue-600" />
            </div>
            <h3 className="text-gray-900">{metricsLoading ? '...' : totalAdmissions}</h3>
            <p className="text-xs text-gray-500">Active patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Bed Occupancy</p>
              <Badge variant={bedOccupancy > 80 ? 'destructive' : 'default'}>{metricsLoading ? '...' : `${bedOccupancy}%`}</Badge>
            </div>
            <h3 className="text-gray-900">{metricsLoading ? '...' : (`${totalOccupied}/${totalCapacity}`)}</h3>
            <p className="text-xs text-gray-500">Occupied beds</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Available Beds</p>
              <span className="text-green-600">●</span>
            </div>
            <h3 className="text-gray-900">{metricsLoading ? '...' : availableBeds}</h3>
            <p className="text-xs text-gray-500">Ready for admission</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Avg. Stay</p>
              <Calendar className="size-5 text-purple-600" />
            </div>
            <h3 className="text-gray-900">{metricsLoading ? '...' : `${avgStay.toFixed(1)} days`}</h3>
            <p className="text-xs text-gray-500">Average duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Room Capacity */}
          <Card className="dashboard-table-card">
        <CardHeader>
          <CardTitle>Room Capacity Overview</CardTitle>
        </CardHeader>
            <CardContent className="dashboard-table-card-content">
          {capacityLoading ? (
            <div className="text-center py-8 text-gray-500">Loading room capacity...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(currentRoomCapacity).map(([type, capacity]) => {
              const occupancy = Math.round((capacity.occupied / capacity.total) * 100);
              return (
                <div key={type} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-gray-900">{type}</h4>
                    <Badge variant={occupancy > 80 ? 'destructive' : 'default'}>{occupancy}%</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Beds:</span>
                      <span className="text-gray-900">{capacity.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Occupied:</span>
                      <span className="text-gray-900">{capacity.occupied}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Available:</span>
                      <span className="text-green-600">{capacity.available}</span>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    {/* Dynamic width requires inline style - occupancy value is computed at runtime */}
                    {/* eslint-disable-next-line react/forbid-dom-props */}
                    <div
                      className={`h-2 rounded-full transition-all ${occupancy > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${occupancy}%` }}
                    />
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
          <Card className="dashboard-search-card">
            <CardContent className="dashboard-search-card-content">
              <div className="flex items-center gap-4">
                <div className="dashboard-search-input-wrapper flex-1">
                  <Search className="dashboard-search-icon" />
                  <Input
                    placeholder="Search by patient name or bed number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="dashboard-search-input"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="date-filter" className="whitespace-nowrap text-sm text-gray-700">Filter by Date:</Label>
                  <div className="flex-1 relative">
                    <ISTDatePicker
                      id="date-filter"
                      selected={dateFilter}
                      onChange={(date) => {
                        const normalizedDate = date ? convertToIST(date) : null;
                        setDateFilter(normalizedDate);
                        if (normalizedDate) {
                          const year = normalizedDate.getFullYear();
                          const month = String(normalizedDate.getMonth() + 1).padStart(2, '0');
                          const day = String(normalizedDate.getDate()).padStart(2, '0');
                          setDateFilterDisplay(`${day}-${month}-${year}`);
                        } else {
                          setDateFilterDisplay('');
                        }
                      }}
                      dateFormat="dd-MM-yyyy"
                      placeholderText="Select date"
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
                  Showing admissions for: <span className="font-medium">{dateFilterDisplay}</span>
                </div>
              )}
            </CardContent>
          </Card>

      {/* Admissions List */}
      {loading ? (
            <Card className="dashboard-table-card">
              <CardContent className="dashboard-table-card-content">
                <div className="dashboard-table-empty-cell">Loading admissions...</div>
          </CardContent>
        </Card>
      ) : (
            <Tabs defaultValue="all" className="dashboard-tabs">
          <TabsList>
            <TabsTrigger value="all">All Admissions ({filteredAdmissions.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({getAdmissionsByStatus('Active').length})</TabsTrigger>
            <TabsTrigger value="discharged">Discharged ({getAdmissionsByStatus('Discharged').length})</TabsTrigger>
            <TabsTrigger value="icu">Moved to ICU ({getAdmissionsByStatus('Moved to ICU').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <AdmissionsList
              admissions={filteredAdmissions}
              onScheduleOT={handleScheduleOT}
              onManage={(admission) => {
                setManagedAdmission(admission);
                setIsManageDialogOpen(true);
              }}
              onManageCase={handleManageCase}
              onNewLabOrder={handleOpenNewLabOrderDialog}
              onEdit={handleEditAdmission}
              schedulingOT={schedulingOT}
            />
          </TabsContent>
          <TabsContent value="active">
            <AdmissionsList
              admissions={getAdmissionsByStatus('Active')}
              onScheduleOT={handleScheduleOT}
              onManage={(admission) => {
                setManagedAdmission(admission);
                setIsManageDialogOpen(true);
              }}
              onManageCase={handleManageCase}
              onNewLabOrder={handleOpenNewLabOrderDialog}
              onEdit={handleEditAdmission}
              schedulingOT={schedulingOT}
            />
          </TabsContent>
          <TabsContent value="surgery">
            <AdmissionsList
              admissions={getAdmissionsByStatus('Surgery Scheduled')}
              onScheduleOT={handleScheduleOT}
              onManage={(admission) => {
                setManagedAdmission(admission);
                setIsManageDialogOpen(true);
              }}
              onManageCase={handleManageCase}
              onNewLabOrder={handleOpenNewLabOrderDialog}
              onEdit={handleEditAdmission}
              schedulingOT={schedulingOT}
            />
          </TabsContent>
          <TabsContent value="icu">
            <AdmissionsList
              admissions={getAdmissionsByStatus('Moved to ICU')}
              onScheduleOT={handleScheduleOT}
              onManage={(admission) => {
                setManagedAdmission(admission);
                setIsManageDialogOpen(true);
              }}
              onManageCase={handleManageCase}
              onNewLabOrder={handleOpenNewLabOrderDialog}
              onEdit={handleEditAdmission}
              schedulingOT={schedulingOT}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Manage Patient Admission Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Patient Admission</DialogTitle>
          </DialogHeader>
          {managedAdmission && (
            <PatientAdmissionManagement admission={managedAdmission} />
          )}
        </DialogContent>
      </Dialog>

      {/* New Lab Order Dialog */}
      <Dialog open={isNewLabOrderDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsNewLabOrderDialogOpen(false);
          setSelectedAdmissionForLabOrder(null);
        }
      }}>
        <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]">
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
            <DialogTitle>Add Lab Test</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
            <div className="space-y-4 py-4">
              {labOrderSubmitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {labOrderSubmitError}
      </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="labOrderRoomAdmissionId">Room Admission ID</Label>
                  <Input
                    id="labOrderRoomAdmissionId"
                    value={labOrderFormData.roomAdmissionId}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="labOrderPatientId">Patient ID</Label>
                  <Input
                    id="labOrderPatientId"
                    value={labOrderFormData.patientId}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="labOrderLabTestId">Lab Test *</Label>
                  <Input
                    id="labOrderLabTestId"
                    value={labTestSearchTerm}
                    onChange={(e) => {
                      setLabTestSearchTerm(e.target.value);
                      setShowLabTestList(true);
                    }}
                    onFocus={() => setShowLabTestList(true)}
                    placeholder="Search and select lab test..."
                    className="cursor-pointer"
                  />
                  {showLabTestList && (
                    <div className="mt-1 border border-gray-200 rounded-md max-h-48 overflow-y-auto bg-white z-50 relative">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left py-2 px-3 text-gray-700 font-semibold">Test ID</th>
                            <th className="text-left py-2 px-3 text-gray-700 font-semibold">Test Name</th>
                            <th className="text-left py-2 px-3 text-gray-700 font-semibold">Category</th>
                            <th className="text-left py-2 px-3 text-gray-700 font-semibold">Charges</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableLabTests
                            .filter((test) => {
                              if (!labTestSearchTerm) return true;
                              const searchLower = labTestSearchTerm.toLowerCase();
                              const name = (test.testName || '').toLowerCase();
                              const id = String(test.labTestId || test.id || '').toLowerCase();
                              const category = (test.testCategory || '').toLowerCase();
                              return name.includes(searchLower) || id.includes(searchLower) || category.includes(searchLower);
                            })
                            .map((test) => {
                              const testId = String(test.labTestId || test.id || '');
                              const isSelected = labOrderFormData.labTestId === testId;
                              return (
                                <tr
                                  key={test.labTestId || test.id}
                                  onClick={() => {
                                    setLabOrderFormData({ ...labOrderFormData, labTestId: testId });
                                    setLabTestSearchTerm(`${test.testName || 'Unknown'} (${test.testCategory || 'N/A'})`);
                                    setShowLabTestList(false);
                                  }}
                                  className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''}`}
                                >
                                  <td className="py-2 px-3 text-sm text-gray-900 font-mono">{test.displayTestId || testId}</td>
                                  <td className="py-2 px-3 text-sm text-gray-600">{test.testName || 'Unknown'}</td>
                                  <td className="py-2 px-3 text-sm text-gray-600">{test.testCategory || 'N/A'}</td>
                                  <td className="py-2 px-3 text-sm text-gray-600">₹{test.charges || 0}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                      {availableLabTests.filter((test) => {
                        if (!labTestSearchTerm) return true;
                        const searchLower = labTestSearchTerm.toLowerCase();
                        const name = (test.testName || '').toLowerCase();
                        const id = String(test.labTestId || test.id || '').toLowerCase();
                        const category = (test.testCategory || '').toLowerCase();
                        return name.includes(searchLower) || id.includes(searchLower) || category.includes(searchLower);
                      }).length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">No lab tests found</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="labOrderPriority">Priority *</Label>
                  <select
                    id="labOrderPriority"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={labOrderFormData.priority}
                    onChange={(e) => setLabOrderFormData({ ...labOrderFormData, priority: e.target.value })}
                    required
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="labOrderOrderedDate">Ordered Date *</Label>
                  <Input
                    id="labOrderOrderedDate"
                    type="date"
                    value={labOrderFormData.orderedDate}
                    onChange={(e) => setLabOrderFormData({ ...labOrderFormData, orderedDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="labOrderOrderedBy">Ordered By</Label>
                  <Input
                    id="labOrderOrderedBy"
                    value={labOrderFormData.orderedBy}
                    onChange={(e) => setLabOrderFormData({ ...labOrderFormData, orderedBy: e.target.value })}
                    placeholder="Enter name of person ordering"
                  />
                </div>
                <div>
                  <Label htmlFor="labOrderCharges">Charges</Label>
                  <Input
                    id="labOrderCharges"
                    type="number"
                    value={labOrderFormData.charges}
                    onChange={(e) => setLabOrderFormData({ ...labOrderFormData, charges: e.target.value })}
                    placeholder="Enter charges (optional)"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="labOrderDescription">Description</Label>
                  <Textarea
                    id="labOrderDescription"
                    value={labOrderFormData.description}
                    onChange={(e) => setLabOrderFormData({ ...labOrderFormData, description: e.target.value })}
                    placeholder="Enter description (optional)"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="labOrderPatientType">Patient Type *</Label>
                  <select
                    id="labOrderPatientType"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={labOrderFormData.patientType}
                    onChange={(e) => setLabOrderFormData({ ...labOrderFormData, patientType: e.target.value })}
                    required
                  >
                    <option value="OPD">OPD</option>
                    <option value="IPD">IPD</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                {labOrderFormData.patientType === 'OPD' && (
                  <div>
                    <Label htmlFor="labOrderAppointmentId">Appointment ID</Label>
                    <Input
                      id="labOrderAppointmentId"
                      value={labOrderFormData.appointmentId}
                      onChange={(e) => setLabOrderFormData({ ...labOrderFormData, appointmentId: e.target.value })}
                      placeholder="Enter appointment ID (optional)"
                    />
                  </div>
                )}
                {labOrderFormData.patientType === 'IPD' && (
                  <div>
                    <Label htmlFor="labOrderRoomAdmissionIdIPD">Room Admission ID</Label>
                    <Input
                      id="labOrderRoomAdmissionIdIPD"
                      value={labOrderFormData.roomAdmissionId}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                )}
                {labOrderFormData.patientType === 'Emergency' && (
                  <div>
                    <Label htmlFor="labOrderEmergencyBedSlotId">Emergency Bed Slot ID</Label>
                    <Input
                      id="labOrderEmergencyBedSlotId"
                      value={labOrderFormData.emergencyBedSlotId}
                      onChange={(e) => setLabOrderFormData({ ...labOrderFormData, emergencyBedSlotId: e.target.value })}
                      placeholder="Enter emergency bed slot ID (optional)"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="labOrderLabTestDone">Lab Test Done *</Label>
                  <select
                    id="labOrderLabTestDone"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={labOrderFormData.labTestDone}
                    onChange={(e) => setLabOrderFormData({ ...labOrderFormData, labTestDone: e.target.value })}
                    required
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="labOrderTestStatus">Test Status *</Label>
                  <select
                    id="labOrderTestStatus"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={labOrderFormData.testStatus}
                    onChange={(e) => setLabOrderFormData({ ...labOrderFormData, testStatus: e.target.value })}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="InProgress">InProgress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="labOrderReportsUrl">Reports URL</Label>
                  <Input
                    id="labOrderReportsUrl"
                    value={labOrderFormData.reportsUrl}
                    onChange={(e) => setLabOrderFormData({ ...labOrderFormData, reportsUrl: e.target.value })}
                    placeholder="Enter reports URL (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="labOrderTestDoneDateTime">Test Done Date & Time</Label>
                  <Input
                    id="labOrderTestDoneDateTime"
                    type="datetime-local"
                    value={labOrderFormData.testDoneDateTime}
                    onChange={(e) => setLabOrderFormData({ ...labOrderFormData, testDoneDateTime: e.target.value })}
                    placeholder="Enter test done date and time"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 py-3 flex-shrink-0 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsNewLabOrderDialogOpen(false);
                setSelectedAdmissionForLabOrder(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveLabOrder}
              disabled={labOrderSubmitting}
            >
              {labOrderSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
}

function AdmissionsList({
  admissions,
  onScheduleOT,
  onManage,
  onManageCase,
  onNewLabOrder,
  onEdit,
  schedulingOT
}: {
  admissions: Admission[];
  onScheduleOT: (admission: Admission) => void;
  onManage: (admission: Admission) => void;
  onManageCase: (admission: Admission) => void;
  onNewLabOrder: (admission: Admission) => void;
  onEdit: (admission: Admission) => void;
  schedulingOT: number | null;
}) {
  return (
    <Card className="dashboard-table-card">
      <CardContent className="dashboard-table-card-content">
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr className="dashboard-table-header-row">
                <th className="dashboard-table-header-cell">Bed #</th>
                <th className="dashboard-table-header-cell">Room No</th>
                <th className="dashboard-table-header-cell">Patient</th>
                <th className="dashboard-table-header-cell">Age/Gender</th>
                <th className="dashboard-table-header-cell">Room Type</th>
                <th className="dashboard-table-header-cell">Admission Date</th>
                <th className="dashboard-table-header-cell">AdmittingDoctorName</th>
                <th className="dashboard-table-header-cell">Patient Type</th>
                <th className="dashboard-table-header-cell">Admission Status</th>
                <th className="dashboard-table-header-cell">Schedule OT</th>
                <th className="dashboard-table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admissions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="dashboard-table-empty-cell">
                    No admissions found
                  </td>
                </tr>
              ) : (
                admissions.map((admission) => (
                  <tr key={admission.id} className="dashboard-table-body-row">
                    <td className="dashboard-table-body-cell">
                    <Badge>{admission.bedNumber}</Badge>
                  </td>
                    <td className="dashboard-table-body-cell dashboard-table-body-cell-secondary">
                      {admission.roomNo || admission.roomNumber || admission.RoomNo || 'N/A'}
                    </td>
                    <td className="dashboard-table-body-cell dashboard-table-body-cell-primary">{admission.patientName}</td>
                    <td className="dashboard-table-body-cell dashboard-table-body-cell-secondary">{admission.age}Y / {admission.gender}</td>
                    <td className="dashboard-table-body-cell dashboard-table-body-cell-secondary">{admission.roomType}</td>
                    <td className="dashboard-table-body-cell dashboard-table-body-cell-secondary">
                      {(() => {
                        // Display date only (no time) - handle DD-MM-YYYY format from API
                        const dateValue = admission.admissionDate || (admission as any).roomAllocationDate || (admission as any).RoomAllocationDate;
                        if (!dateValue) return 'N/A';
                        
                        // If it's already in DD-MM-YYYY format (with or without time), extract date part
                        if (typeof dateValue === 'string') {
                          if (dateValue.includes(' ')) {
                            return dateValue.split(' ')[0]; // Return "11-01-2026" from "11-01-2026 00:00"
                          }
                          if (/^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
                            return dateValue; // Already in DD-MM-YYYY format
                          }
                          // Try to parse and format
                          try {
                            const date = new Date(dateValue);
                            if (!isNaN(date.getTime())) {
                              const day = String(date.getDate()).padStart(2, '0');
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const year = date.getFullYear();
                              return `${day}-${month}-${year}`;
                            }
                          } catch {
                            return dateValue;
                          }
                        }
                        return dateValue;
                      })()}
                    </td>
                    <td className="dashboard-table-body-cell dashboard-table-body-cell-secondary">
                      {admission.admittingDoctorName || admission.admittedBy || 'N/A'}
                    </td>
                    <td className="dashboard-table-body-cell dashboard-table-body-cell-secondary">
                      <Badge variant="outline">
                        {admission.patientType || 'N/A'}
                      </Badge>
                    </td>
                    <td className="dashboard-table-body-cell">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      admission.status === 'Active' ? 'bg-green-100 text-green-700' :
                      admission.status === 'Surgery Scheduled' ? 'bg-orange-100 text-orange-700' :
                      admission.status === 'Moved to ICU' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {admission.admissionStatus || admission.status || 'N/A'}
                    </span>
                  </td>
                  <td className="dashboard-table-body-cell">
                    {(() => {
                      const scheduleOTValue = admission.scheduleOT;
                      if (!scheduleOTValue) {
                        return <span className="text-gray-400 text-sm">-</span>;
                      }
                      const isScheduled = String(scheduleOTValue).toLowerCase() === 'yes' || scheduleOTValue === true;
                      return (
                        <Badge variant={isScheduled ? 'default' : 'outline'} className={isScheduled ? 'bg-green-100 text-green-700 border-green-300' : ''}>
                          {isScheduled ? 'Yes' : String(scheduleOTValue)}
                        </Badge>
                      );
                    })()}
                  </td>
                  <td className="dashboard-table-body-cell">
                    <div className="dashboard-actions-container">
                      {admission.status === 'Active' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => onScheduleOT(admission)}
                            disabled={String(schedulingOT) === String(admission.roomAdmissionId || admission.admissionId)}
                          >
                            <Scissors className="size-3" />
                            {schedulingOT === (admission.roomAdmissionId || admission.admissionId) ? 'Scheduling...' : 'Schedule OT'}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => onEdit(admission)}
                          >
                            <Edit className="size-3" />
                            Edit Admission
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => onManageCase(admission)}
                          >
                            <FileText className="size-3" />
                            Manage Case
                          </Button>
                          
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Patient Admission Management Component
function PatientAdmissionManagement({ admission }: { admission: Admission }) {
  const [admissionDetails, setAdmissionDetails] = useState<Admission | null>(admission);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load admission details if needed
    if (admission.roomAdmissionId) {
      // You can fetch fresh details here if needed
      setAdmissionDetails(admission);
    }
  }, [admission]);

  return (
    <div className="space-y-6">
      {/* Room Admission Details */}
      <Card>
        <CardHeader>
          <CardTitle>Room Admission Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading admission details...</div>
          ) : admissionDetails ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <Label className="text-sm text-gray-500">Patient Name</Label>
                <p className="text-gray-900 font-medium mt-1">{admissionDetails.patientName}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Patient ID</Label>
                <p className="text-gray-900 font-medium mt-1">{admissionDetails.patientId || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Bed Number</Label>
                <p className="text-gray-900 font-medium mt-1">
                  <Badge variant="outline">{admissionDetails.bedNumber}</Badge>
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Room Type</Label>
                <p className="text-gray-900 font-medium mt-1">{admissionDetails.roomType}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Age</Label>
                <p className="text-gray-900 font-medium mt-1">{admissionDetails.age} years</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Gender</Label>
                <p className="text-gray-900 font-medium mt-1">{admissionDetails.gender}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Admission Date</Label>
                <p className="text-gray-900 font-medium mt-1">{admissionDetails.admissionDate}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Admitted By</Label>
                <p className="text-gray-900 font-medium mt-1">{admissionDetails.admittedBy}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-sm text-gray-500">Diagnosis</Label>
                <p className="text-gray-900 font-medium mt-1">{admissionDetails.diagnosis || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Admission Status</Label>
                <p className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs inline-block ${
                    admissionDetails.status === 'Active' ? 'bg-green-100 text-green-700' :
                    admissionDetails.status === 'Surgery Scheduled' ? 'bg-orange-100 text-orange-700' :
                    admissionDetails.status === 'Moved to ICU' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {admissionDetails.admissionStatus || admissionDetails.status}
                  </span>
                </p>
              </div>
              {admissionDetails.scheduleOT && (
                <div>
                  <Label className="text-sm text-gray-500">Schedule OT</Label>
                  <p className="mt-1">
                    <Badge variant={String(admissionDetails.scheduleOT).toLowerCase() === 'yes' ? 'default' : 'outline'}>
                      {String(admissionDetails.scheduleOT)}
                    </Badge>
                  </p>
                </div>
              )}
              {admissionDetails.patientType && (
                <div>
                  <Label className="text-sm text-gray-500">Patient Type</Label>
                  <p className="mt-1">
                    <Badge variant="outline">{admissionDetails.patientType}</Badge>
                  </p>
                </div>
              )}
              {admissionDetails.patientAppointmentId || admissionDetails.appointmentId ? (
                <div>
                  <Label className="text-sm text-gray-500">Patient Appointment ID</Label>
                  <p className="text-gray-900 font-medium mt-1">
                    {admissionDetails.patientAppointmentId || admissionDetails.appointmentId || 'N/A'}
                  </p>
                </div>
              ) : null}
              {admissionDetails.emergencyBedSlotId ? (
                <div>
                  <Label className="text-sm text-gray-500">Emergency Bed Slot ID</Label>
                  <p className="text-gray-900 font-medium mt-1">
                    {admissionDetails.emergencyBedSlotId || 'N/A'}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No admission details available</div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Case Details, Lab Tests, Doctor Visits, Nurse Visits */}
      <Tabs defaultValue="case-details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="case-details" className="gap-2">
            <FileText className="size-4" />
            Case Details
          </TabsTrigger>
          <TabsTrigger value="lab-tests" className="gap-2">
            <FlaskConical className="size-4" />
            Lab Tests
          </TabsTrigger>
          <TabsTrigger value="doctor-visits" className="gap-2">
            <Stethoscope className="size-4" />
            Doctor Visits
          </TabsTrigger>
          <TabsTrigger value="nurse-visits" className="gap-2">
            <Heart className="size-4" />
            Nurse Visits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="case-details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Case Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-500">Diagnosis</Label>
                  <p className="text-gray-900 font-medium mt-1">{admissionDetails?.diagnosis || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Admission Notes</Label>
                  <p className="text-gray-900 mt-1">Case details and notes will be displayed here.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lab-tests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Laboratory Management -</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Lab tests for this admission will be displayed here.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doctor-visits" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient's Doctor Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Doctor visit records for this admission will be displayed here.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nurse-visits" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Nurse Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Nurse visit records for this admission will be displayed here.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
