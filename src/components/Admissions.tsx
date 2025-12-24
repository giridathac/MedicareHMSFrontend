import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BedDouble, Plus, Search, User, Calendar, Scissors, X, FileText, FlaskConical, Stethoscope, Heart, Edit } from 'lucide-react';
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
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Fallback room capacity data (used when API data is not available)
const fallbackRoomCapacity: RoomCapacityOverview = {
  'Regular Ward': { total: 50, occupied: 35, available: 15 },
  'Special Shared Room': { total: 20, occupied: 14, available: 6 },
  'Special Room': { total: 15, occupied: 8, available: 7 },
};

export function Admissions() {
  const { admissions, roomCapacity, dashboardMetrics, loading, capacityLoading, metricsLoading, fetchRoomCapacityOverview, fetchDashboardMetrics, updateAdmission, fetchAdmissions } = useAdmissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [schedulingOT, setSchedulingOT] = useState<number | null>(null); // Track which admission is being scheduled
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [managedAdmission, setManagedAdmission] = useState<Admission | null>(null);
  const [editingAdmission, setEditingAdmission] = useState<Admission | null>(null);
  const [isViewEditDialogOpen, setIsViewEditDialogOpen] = useState(false);
  
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
  const [savingAdmission, setSavingAdmission] = useState(false);
  const [admissionError, setAdmissionError] = useState<string | null>(null);

  const navigate = useNavigate();
  
  const handleManageCase = (admission: Admission) => {
    const roomAdmissionId = admission.roomAdmissionId || admission.admissionId;
    if (roomAdmissionId) {
      navigate(`/manage-ipd-admission?roomAdmissionId=${roomAdmissionId}`);
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
      } else if (selectedLabTest.charges) {
        payload.Charges = selectedLabTest.charges;
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

  // Handler to view/edit admission
  const handleViewEditAdmission = async (admission: Admission) => {
    setEditingAdmission(admission);
    
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
      console.error('Error loading options for view/edit:', err);
    }

    // Pre-populate form with admission data
    // Extract admissionStatus - use status if admissionStatus is not available
    const admissionStatusValue = admission.admissionStatus || admission.status || 'Active';
    // Preserve all status values: Active, Moved to ICU, Surgery Scheduled, Discharged
    const normalizedStatus = (admissionStatusValue === 'Discharged' || 
                               admissionStatusValue === 'Moved to ICU' || 
                               admissionStatusValue === 'Surgery Scheduled' || 
                               admissionStatusValue === 'Active') 
                               ? admissionStatusValue 
                               : 'Active';
    
    // Extract isLinkedToICU and convert to Yes/No
    const isLinkedToICUValue = admission.isLinkedToICU;
    let isLinkedToICUString = 'No';
    if (isLinkedToICUValue !== undefined && isLinkedToICUValue !== null) {
      if (typeof isLinkedToICUValue === 'boolean') {
        isLinkedToICUString = isLinkedToICUValue ? 'Yes' : 'No';
      } else if (typeof isLinkedToICUValue === 'string') {
        const lower = String(isLinkedToICUValue).toLowerCase();
        isLinkedToICUString = (lower === 'true' || lower === 'yes' || lower === '1') ? 'Yes' : 'No';
      }
    }
    
    // Extract scheduleOT and convert to Yes/No
    const scheduleOTValue = admission.scheduleOT;
    let scheduleOTString = 'No';
    if (scheduleOTValue !== undefined && scheduleOTValue !== null) {
      if (typeof scheduleOTValue === 'boolean') {
        scheduleOTString = scheduleOTValue ? 'Yes' : 'No';
      } else if (typeof scheduleOTValue === 'string') {
        const lower = String(scheduleOTValue).toLowerCase();
        scheduleOTString = (lower === 'true' || lower === 'yes' || lower === '1') ? 'Yes' : 'No';
      }
    }

    // Extract shiftToAnotherRoom and convert to Yes/No
    const shiftToAnotherRoomValue = admission.shiftToAnotherRoom;
    let shiftToAnotherRoomString = 'No';
    if (shiftToAnotherRoomValue !== undefined && shiftToAnotherRoomValue !== null) {
      if (typeof shiftToAnotherRoomValue === 'boolean') {
        shiftToAnotherRoomString = shiftToAnotherRoomValue ? 'Yes' : 'No';
      } else if (typeof shiftToAnotherRoomValue === 'string') {
        const lower = String(shiftToAnotherRoomValue).toLowerCase();
        shiftToAnotherRoomString = (lower === 'true' || lower === 'yes' || lower === '1') ? 'Yes' : 'No';
      }
    }

    // Find the room bed by matching bedNumber with roomBedOptions
    let foundRoomBedId = '';
    let foundRoomBedsId = '';
    if (admission.bedNumber && roomBedsList.length > 0) {
      const matchingBed = roomBedsList.find((bed: any) => {
        const bedNo = (bed as any).bedNo || (bed as any).BedNo || '';
        return bedNo === admission.bedNumber;
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

    // Fallbacks from admission record if we couldn't resolve from roomBeds list
    if (!foundRoomBedId) {
      foundRoomBedId = String(
        (admission as any).roomBedId ||
        (admission as any).RoomBedId ||
        (admission as any).RoomBedsId ||
        (admission as any).roomBedsId ||
        ''
      );
    }
    if (!foundRoomBedsId) {
      foundRoomBedsId = String(
        (admission as any).roomBedsId ||
        (admission as any).RoomBedsId ||
        (admission as any).roomBedId ||
        (admission as any).RoomBedId ||
        ''
      );
    }

    // Resolve doctor ID from admission so validation passes even if user doesn't change it
    const resolvedDoctorId = String(
      (admission as any).doctorId ||
      (admission as any).DoctorId ||
      (admission as any).admittedByDoctorId ||
      (admission as any).AdmittedByDoctorId ||
      ''
    );

    setAddAdmissionForm({
      patientId: admission.patientId || '',
      patientType: admission.patientType || '',
      patientAppointmentId: admission.patientAppointmentId || admission.appointmentId || '',
      emergencyBedSlotId: admission.emergencyBedSlotId || '',
      roomBedId: foundRoomBedId,
      roomBedsId: foundRoomBedsId,
      roomType: admission.roomType || '',
      admittedBy: admission.admittedBy || '',
      admittedByDoctorId: resolvedDoctorId,
      doctorId: resolvedDoctorId,
      diagnosis: admission.diagnosis || '',
      roomAllocationDate: admission.admissionDate ? new Date(admission.admissionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      admissionStatus: normalizedStatus,
      caseSheet: admission.caseSheet || '',
      caseDetails: admission.caseSheetDetails || '',
      isLinkedToICU: isLinkedToICUString,
      patientNo: admission.patientNo || '',
      age: admission.age ? String(admission.age) : '',
      gender: admission.gender || '',
      patientName: admission.patientName || '',
      bedNumber: admission.bedNumber || '',
      appointmentTokenNo: admission.appointmentTokenNo || '',
      appointmentDate: admission.appointmentDate || '',
      emergencyBedNo: admission.emergencyBedNo || '',
      eBedSlotNo: admission.eBedSlotNo || '',
      emergencyAdmissionDate: admission.emergencyAdmissionDate || '',
      roomVacantDate: admission.roomVacantDate || '',
      shiftToAnotherRoom: shiftToAnotherRoomString,
      shiftedTo: admission.shiftedTo || '',
      shiftedToDetails: admission.shiftedToDetails || '',
      scheduleOT: scheduleOTString,
      otAdmissionId: admission.otAdmissionId ? String(admission.otAdmissionId) : '',
      icuAdmissionId: admission.icuAdmissionId ? String(admission.icuAdmissionId) : '',
      billId: admission.billId ? String(admission.billId) : '',
      estimatedStay: admission.estimatedStay || '',
      createdAt: admission.createdAt || '',
      createdDate: admission.createdDate || '',
    });
    setPatientSearchTerm(admission.patientName || '');
    setRoomBedSearchTerm(`${admission.bedNumber} (${admission.roomType})`);
    setDoctorSearchTerm(admission.admittedBy || '');
    
    // Fetch conditional data based on patient type
    if (admission.patientType === 'OPD' && admission.patientId) {
      await fetchPatientAppointments(admission.patientId);
    } else if (admission.patientType === 'Emergency' && admission.patientId) {
      await fetchPatientEmergencyBedSlots(admission.patientId);
    }
    
    setIsViewEditDialogOpen(true);
  };

  // Fetch appointments for a specific patient
  const fetchPatientAppointments = async (patientId: string) => {
    if (!patientId) {
      setAvailableAppointments([]);
      return;
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
    } catch (err) {
      console.error('Error fetching patient appointments:', err);
      setAvailableAppointments([]);
    }
  };

  // Fetch emergency bed slots for a specific patient
  const fetchPatientEmergencyBedSlots = async (patientId: string) => {
    if (!patientId) {
      setAvailableEmergencyBedSlots([]);
      return;
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
    } catch (err) {
      console.error('Error fetching emergency bed slots:', err);
      setAvailableEmergencyBedSlots([]);
    }
  };

  // Fetch IPD admissions for a specific patient
  const fetchPatientIPDAdmissions = async (patientId: string) => {
    if (!patientId) {
      setAvailableIPDAdmissions([]);
      return;
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
    } catch (err) {
      console.error('Error fetching IPD admissions:', err);
      setAvailableIPDAdmissions([]);
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

      // Validate required fields (stricter for new admissions than for edits)
      if (!addAdmissionForm.patientId && !editingAdmission) {
        throw new Error('Please select a patient');
      }
      if (!addAdmissionForm.patientType && !editingAdmission) {
        throw new Error('Please select a patient type');
      }
      if (!editingAdmission && addAdmissionForm.patientType === 'OPD' && !addAdmissionForm.patientAppointmentId) {
        throw new Error('Patient Appointment ID is required for OPD patients');
      }
      if (!editingAdmission && addAdmissionForm.patientType === 'IPD' && !(addAdmissionForm as any).roomAdmissionId) {
        throw new Error('Patient IPD Admission ID is required for IPD patients');
      }
      if (!editingAdmission && addAdmissionForm.patientType === 'Emergency' && !addAdmissionForm.emergencyBedSlotId) {
        throw new Error('Emergency Admission Bed No is required for Emergency patients');
      }
      if (!addAdmissionForm.roomBedId && !editingAdmission) {
        throw new Error('Please select a room/bed');
      }
      if (!editingAdmission && !addAdmissionForm.admittedByDoctorId && !addAdmissionForm.doctorId) {
        throw new Error('Please select a doctor');
      }
      if (!addAdmissionForm.roomBedsId && !editingAdmission) {
        throw new Error('Room/Bed ID is required');
      }
      if (!addAdmissionForm.roomAllocationDate) {
        throw new Error('Room Allocation Date is required');
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

      // Get doctor name and ID.
      // For new admissions we require a doctor; for edits we allow it to be missing so that
      // existing backend value is preserved if the API supports partial updates.
      const doctorName =
        addAdmissionForm.admittedBy ||
        (editingAdmission?.admittedBy ?? editingAdmission?.admittingDoctorName) ||
        '';
      const doctorId = addAdmissionForm.doctorId || addAdmissionForm.admittedByDoctorId || '';
      
      if (!doctorId && !editingAdmission) {
        throw new Error('Doctor ID is required. Please select a doctor.');
      }

      console.log('Doctor selection details:', {
        doctorId: doctorId,
        admittedByDoctorId: addAdmissionForm.admittedByDoctorId,
        doctorIdField: addAdmissionForm.doctorId,
        doctorName: doctorName
      });

      // Check room bed availability before proceeding (only for new admissions, not updates)
      if (!editingAdmission) {
        try {
          console.log('Checking room bed availability, RoomBedsId:', roomBedsId, 'AllocationDate:', addAdmissionForm.roomAllocationDate);
          
          // Validate required parameters
          if (!roomBedsId) {
            throw new Error('RoomBedsId is required for availability check');
          }
          if (!addAdmissionForm.roomAllocationDate) {
            throw new Error('Room Allocation Date is required for availability check');
          }
          
          // Call the room admissions availability check API
          const checkResponse = await apiRequest<any>(`/room-admissions/check-availability?RoomBedsId=${roomBedsId}&AllocationDate=${addAdmissionForm.roomAllocationDate}`, {
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
      }

      // Prepare admission data
      const admissionData: any = {
        patientId: patientId,
        patientName: fullName,
        age: age,
        gender: gender,
        admissionDate: new Date().toISOString().split('T')[0], // Today's date
        roomType: roomType as 'Regular Ward' | 'Special Shared Room' | 'Special Room',
        bedNumber: bedNumber,
        admittedBy: doctorName,
        diagnosis: addAdmissionForm.diagnosis || '',
        status: addAdmissionForm.status || 'Active' as const,
        admissionStatus: addAdmissionForm.admissionStatus || 'Active',
        AdmissionStatus: addAdmissionForm.admissionStatus || 'Active',
        patientType: addAdmissionForm.patientType || '',
        roomBedsId: roomBedsId ? String(roomBedsId) : undefined,
        doctorId: doctorId ? String(doctorId) : undefined,
        admittedByDoctorId: doctorId ? String(doctorId) : undefined, // Also include as admittedByDoctorId for API
        roomAllocationDate: addAdmissionForm.roomAllocationDate,
        caseSheet: addAdmissionForm.caseSheet || '',
        caseSheetDetails: addAdmissionForm.caseDetails || '',
        isLinkedToICU: addAdmissionForm.isLinkedToICU || 'No',
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

      // Call the API to create or update admission
      let createdAdmission: any = null;
      if (editingAdmission && (editingAdmission.roomAdmissionId || editingAdmission.admissionId)) {
        const roomAdmissionId = editingAdmission.roomAdmissionId || editingAdmission.admissionId;
        const updateData = {
          ...admissionData,
          roomAdmissionId: Number(roomAdmissionId)
        };
        createdAdmission = await admissionsApi.update(updateData);
        console.log('Admission updated successfully');
        // Close edit dialog after update
        setIsViewEditDialogOpen(false);
      } else {
        createdAdmission = await admissionsApi.create(admissionData);
        console.log('Admission created successfully');
        
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
      }

      // Refresh admissions list
      await fetchAdmissions();
      
      // Refresh room capacity and metrics
      await fetchRoomCapacityOverview();
      await fetchDashboardMetrics();

      // Close dialog and reset form
      if (isViewEditDialogOpen) {
        setIsViewEditDialogOpen(false);
      } else {
        setIsDialogOpen(false);
      }
      setEditingAdmission(null);
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

  const filteredAdmissions = admissions.filter(admission =>
    admission.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admission.bedNumber.toLowerCase().includes(searchTerm.toLowerCase())
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
  const totalOccupied = dashboardMetrics?.totalOccupied ?? Object.values(currentRoomCapacity).reduce((sum, room) => sum + room.occupied, 0);
  const totalCapacity = dashboardMetrics?.totalCapacity ?? Object.values(currentRoomCapacity).reduce((sum, room) => sum + room.total, 0);
  const availableBeds = dashboardMetrics?.availableBeds ?? (totalCapacity - totalOccupied);
  const avgStay = dashboardMetrics?.avgStay ?? 5.2;

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
              <DialogTitle>{editingAdmission ? 'Edit Admission' : 'Register New Admission'}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0 bg-white">
            <div className="space-y-4 py-4">
                {/* Patient Selection - Same pattern as Front Desk */}
                <div>
                  <Label htmlFor="patient-search">Patient *</Label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="patient-search"
                      placeholder="Search by Patient ID, Name, or Mobile Number..."
                      value={patientSearchTerm}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setPatientSearchTerm(newValue);
                        // Don't clear patient selection when user edits - allow them to search and replace
                      }}
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
                                    } else if (updatedForm.patientType === 'IPD' && patientId) {
                                      await fetchPatientIPDAdmissions(patientId);
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
                      {patientOptions.filter((patient: any) => {
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
                      }).length === 0 && !addAdmissionForm.patientId && (
                        <div className="text-center py-8 text-sm text-gray-700">
                          No patients found. Try a different search term.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Patient Type */}
                <div>
                  <Label htmlFor="patientType">Patient Type *</Label>
                  <select
                    id="patientType"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={addAdmissionForm.patientType}
                    onChange={(e) => handlePatientTypeChange(e.target.value)}
                    required
                  >
                    <option value="">Select Patient Type</option>
                    <option value="OPD">OPD</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Direct">Direct</option>
                  </select>
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
                      {availableAppointments.map((appointment: any) => {
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
                      {availableIPDAdmissions.map((admission: any) => {
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
                      {availableEmergencyBedSlots.map((slot: any) => {
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
                      id="room-bed-search"
                      placeholder="Search by Room No, Bed No, Room Type, or Category..."
                      value={roomBedSearchTerm}
                      onChange={(e) => setRoomBedSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                </div>
                  {roomBedSearchTerm && (
                    <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
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
                          {roomBedOptions
                            .filter((bed: any) => {
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
                            })
                            .map((bed: any) => {
                              const roomBedId = (bed as any).roomBedId || (bed as any).RoomBedsId || (bed as any).id || '';
                              const roomNo = (bed as any).roomNo || (bed as any).RoomNo || '';
                              const bedNo = (bed as any).bedNo || (bed as any).BedNo || '';
                              const roomType = (bed as any).roomType || (bed as any).RoomType || '';
                              const roomCategory = (bed as any).roomCategory || (bed as any).RoomCategory || '';
                              const status = (bed as any).status || (bed as any).Status || '';
                              const isSelected = addAdmissionForm.roomBedId === String(roomBedId);
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
                                  }}
                                  className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''}`}
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
                        </tbody>
                      </table>
                      {roomBedOptions.filter((bed: any) => {
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
                      }).length === 0 && (
                        <div className="text-center py-8 text-sm text-gray-700">
                          No room beds found. Try a different search term.
              </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Doctor Selection - Same pattern as Patient selection */}
              <div>
                  <Label htmlFor="doctor-search">Admitted By (Doctor) *</Label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="doctor-search"
                      placeholder="Search by Doctor Name, ID, or Specialty..."
                      value={doctorSearchTerm}
                      onChange={(e) => setDoctorSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {doctorSearchTerm && (
                    <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
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
                          {doctorOptions
                            .filter((doctor: any) => {
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
                            })
                            .map((doctor: any) => {
                              const doctorId = String((doctor as any).id || (doctor as any).Id || (doctor as any).UserId || '');
                              const doctorName = (doctor as any).name || (doctor as any).Name || (doctor as any).UserName || '';
                              const specialty = (doctor as any).specialty || (doctor as any).Specialty || (doctor as any).DoctorDepartmentName || 'General';
                              const doctorType = (doctor as any).type || (doctor as any).Type || (doctor as any).DoctorType || '';
                              const isSelected = addAdmissionForm.admittedByDoctorId === doctorId;
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
                                    setDoctorSearchTerm(`${doctorName} - ${specialty}`);
                                  }}
                                  className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''}`}
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
                        </tbody>
                      </table>
                      {doctorOptions.filter((doctor: any) => {
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
                      }).length === 0 && (
                        <div className="text-center py-8 text-sm text-gray-700">
                          No doctors found. Try a different search term.
                        </div>
                      )}
                    </div>
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
              <div>
                  <Label htmlFor="admissionStatus">Admission Status *</Label>
                  <select
                    id="admissionStatus"
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
                {savingAdmission ? 'Saving...' : editingAdmission ? 'Update Admission' : 'Admit Patient'}
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
            <h3 className="text-gray-900">{metricsLoading ? '...' : `${totalOccupied}/${totalCapacity}`}</h3>
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
              <div className="dashboard-search-input-wrapper">
                <Search className="dashboard-search-icon" />
            <Input
              placeholder="Search by patient name or bed number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                  className="dashboard-search-input"
            />
          </div>
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
              onEdit={handleViewEditAdmission}
              onManage={(admission) => {
                setManagedAdmission(admission);
                setIsManageDialogOpen(true);
              }}
              onManageCase={handleManageCase}
              schedulingOT={schedulingOT}
            />
          </TabsContent>
          <TabsContent value="active">
            <AdmissionsList 
              admissions={getAdmissionsByStatus('Active')} 
              onScheduleOT={handleScheduleOT}
              onEdit={handleViewEditAdmission}
              onManage={(admission) => {
                setManagedAdmission(admission);
                setIsManageDialogOpen(true);
              }}
              onManageCase={handleManageCase}
              schedulingOT={schedulingOT}
            />
          </TabsContent>
          <TabsContent value="surgery">
            <AdmissionsList 
              admissions={getAdmissionsByStatus('Surgery Scheduled')} 
              onScheduleOT={handleScheduleOT}
              onEdit={handleViewEditAdmission}
              onManage={(admission) => {
                setManagedAdmission(admission);
                setIsManageDialogOpen(true);
              }}
              onManageCase={handleManageCase}
              schedulingOT={schedulingOT}
            />
          </TabsContent>
          <TabsContent value="icu">
            <AdmissionsList 
              admissions={getAdmissionsByStatus('Moved to ICU')} 
              onScheduleOT={handleScheduleOT}
              onEdit={handleViewEditAdmission}
              onManage={(admission) => {
                setManagedAdmission(admission);
                setIsManageDialogOpen(true);
              }}
              onManageCase={handleManageCase}
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
            <DialogTitle>New Lab Order</DialogTitle>
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
  onEdit,
  schedulingOT 
}: { 
  admissions: Admission[]; 
  onScheduleOT: (admission: Admission) => void;
  onManage: (admission: Admission) => void;
  onManageCase: (admission: Admission) => void;
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
                    <td className="dashboard-table-body-cell dashboard-table-body-cell-secondary">{admission.admissionDate}</td>
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
                            disabled={schedulingOT === (admission.roomAdmissionId || admission.admissionId)}
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
