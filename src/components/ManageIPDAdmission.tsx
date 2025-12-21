import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FileText, FlaskConical, Stethoscope, Heart, ArrowLeft, Plus, Search, Eye, Edit, Settings } from 'lucide-react';
import { admissionsApi } from '../api/admissions';
import { Admission, PatientLabTest, PatientDoctorVisit, PatientNurseVisit } from '../api/admissions';
import { labTestsApi } from '../api/labTests';
import { LabTest } from '../types';
import { apiRequest } from '../api/base';
import { doctorsApi } from '../api/doctors';
import { Doctor } from '../types';
import { staffApi } from '../api/staff';
import { PatientAdmitVisitVitals } from '../api/admissions';
import '../styles/dashboard.css';

export function ManageIPDAdmission() {
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientLabTests, setPatientLabTests] = useState<PatientLabTest[]>([]);
  const [labTestsLoading, setLabTestsLoading] = useState(false);
  const [labTestsError, setLabTestsError] = useState<string | null>(null);
  const [patientDoctorVisits, setPatientDoctorVisits] = useState<PatientDoctorVisit[]>([]);
  const [doctorVisitsLoading, setDoctorVisitsLoading] = useState(false);
  const [doctorVisitsError, setDoctorVisitsError] = useState<string | null>(null);
  const [patientNurseVisits, setPatientNurseVisits] = useState<PatientNurseVisit[]>([]);
  const [nurseVisitsLoading, setNurseVisitsLoading] = useState(false);
  const [nurseVisitsError, setNurseVisitsError] = useState<string | null>(null);

  // Add IPD Lab Test Dialog State
  const [isAddIPDLabTestDialogOpen, setIsAddIPDLabTestDialogOpen] = useState(false);
  const [isViewIPDLabTestDialogOpen, setIsViewIPDLabTestDialogOpen] = useState(false);
  const [isEditIPDLabTestDialogOpen, setIsEditIPDLabTestDialogOpen] = useState(false);
  const [viewingLabTest, setViewingLabTest] = useState<PatientLabTest | null>(null);
  const [editingLabTestId, setEditingLabTestId] = useState<string | number | null>(null);
  const [ipdLabTestFormData, setIpdLabTestFormData] = useState({
    roomAdmissionId: '',
    patientId: '',
    labTestId: '',
    priority: 'Normal',
    orderedDate: '',
    orderedBy: '',
    orderedByDoctorId: '',
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
  const [ipdLabTestSubmitting, setIpdLabTestSubmitting] = useState(false);
  const [ipdLabTestSubmitError, setIpdLabTestSubmitError] = useState<string | null>(null);
  const [availableLabTests, setAvailableLabTests] = useState<LabTest[]>([]);
  const [labTestSearchTerm, setLabTestSearchTerm] = useState('');
  const [showLabTestList, setShowLabTestList] = useState(false);
  const [ipdLabTestDoctorSearchTerm, setIpdLabTestDoctorSearchTerm] = useState('');
  const [showIpdLabTestDoctorList, setShowIpdLabTestDoctorList] = useState(false);

  // Doctor Visit Dialog State
  const [isAddDoctorVisitDialogOpen, setIsAddDoctorVisitDialogOpen] = useState(false);
  const [isViewDoctorVisitDialogOpen, setIsViewDoctorVisitDialogOpen] = useState(false);
  const [isEditDoctorVisitDialogOpen, setIsEditDoctorVisitDialogOpen] = useState(false);
  const [viewingDoctorVisit, setViewingDoctorVisit] = useState<PatientDoctorVisit | null>(null);
  const [editingDoctorVisitId, setEditingDoctorVisitId] = useState<string | number | null>(null);
  const [doctorVisitFormData, setDoctorVisitFormData] = useState({
    patientId: '',
    doctorId: '',
    doctorVisitedDateTime: '',
    visitsRemarks: '',
    patientCondition: '',
    status: 'Active',
    visitCreatedAt: ''
  });
  const [doctorVisitSubmitting, setDoctorVisitSubmitting] = useState(false);
  const [doctorVisitSubmitError, setDoctorVisitSubmitError] = useState<string | null>(null);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [showDoctorList, setShowDoctorList] = useState(false);

  // Visit Vitals Dialog State
  const [patientAdmitVisitVitals, setPatientAdmitVisitVitals] = useState<PatientAdmitVisitVitals[]>([]);
  const [visitVitalsLoading, setVisitVitalsLoading] = useState(false);
  const [visitVitalsError, setVisitVitalsError] = useState<string | null>(null);
  const [isAddVisitVitalsDialogOpen, setIsAddVisitVitalsDialogOpen] = useState(false);
  const [isViewVisitVitalsDialogOpen, setIsViewVisitVitalsDialogOpen] = useState(false);
  const [isEditVisitVitalsDialogOpen, setIsEditVisitVitalsDialogOpen] = useState(false);
  const [viewingVisitVitals, setViewingVisitVitals] = useState<PatientAdmitVisitVitals | null>(null);
  const [editingVisitVitalsId, setEditingVisitVitalsId] = useState<string | number | null>(null);
  const [visitVitalsFormData, setVisitVitalsFormData] = useState({
    patientId: '',
    nurseId: '',
    patientStatus: '',
    recordedDateTime: '',
    visitRemarks: '',
    dailyOrHourlyVitals: 'Daily',
    heartRate: '',
    bloodPressure: '',
    temperature: '',
    o2Saturation: '',
    respiratoryRate: '',
    pulseRate: '',
    vitalsStatus: 'Stable',
    vitalsRemarks: '',
    vitalsCreatedBy: '',
    status: 'Active'
  });
  const [visitVitalsSubmitting, setVisitVitalsSubmitting] = useState(false);
  const [visitVitalsSubmitError, setVisitVitalsSubmitError] = useState<string | null>(null);
  const [availableNurses, setAvailableNurses] = useState<any[]>([]);
  const [nurseSearchTerm, setNurseSearchTerm] = useState('');
  const [showNurseList, setShowNurseList] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Get roomAdmissionId from URL search parameters
    const roomAdmissionId = searchParams.get('roomAdmissionId');
    
    if (roomAdmissionId) {
      fetchAdmissionDetails(Number(roomAdmissionId));
    } else {
      setError('Room Admission ID is missing from URL');
      setLoading(false);
    }
  }, [searchParams]);

  const fetchAdmissionDetails = async (roomAdmissionId: number) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching admission details for roomAdmissionId:', roomAdmissionId);
      const admissionData = await admissionsApi.getById(roomAdmissionId);
      console.log('Fetched admission data:', {
        age: admissionData.age,
        gender: admissionData.gender,
        admittedBy: admissionData.admittedBy,
        diagnosis: admissionData.diagnosis,
        patientName: admissionData.patientName,
        bedNumber: admissionData.bedNumber,
        roomType: admissionData.roomType,
        full: admissionData
      });
      setAdmission(admissionData);
      
      // Fetch patient lab tests, doctor visits, nurse visits, and visit vitals after admission is loaded
      fetchPatientLabTests(roomAdmissionId);
      fetchPatientDoctorVisits(roomAdmissionId);
      fetchPatientNurseVisits(roomAdmissionId);
      fetchPatientAdmitVisitVitals(roomAdmissionId);
    } catch (err) {
      console.error('Error fetching admission details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load admission details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientLabTests = async (roomAdmissionId: number) => {
    try {
      setLabTestsLoading(true);
      setLabTestsError(null);
      console.log('Fetching patient lab tests for roomAdmissionId:', roomAdmissionId);
      const labTests = await admissionsApi.getPatientLabTests(roomAdmissionId);
      console.log('Fetched patient lab tests:', labTests);
      setPatientLabTests(labTests);
    } catch (err) {
      console.error('Error fetching patient lab tests:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load patient lab tests';
      
      // Check if the error indicates "no records found" - treat as empty state, not error
      if (errorMessage.toLowerCase().includes('no patient lab tests found') || 
          errorMessage.toLowerCase().includes('no lab tests found') ||
          errorMessage.toLowerCase().includes('not found') ||
          errorMessage.toLowerCase().includes('no records')) {
      setPatientLabTests([]);
        setLabTestsError(null); // Clear error to show empty state message
      } else {
        setLabTestsError(errorMessage);
        setPatientLabTests([]);
      }
    } finally {
      setLabTestsLoading(false);
    }
  };

  const fetchPatientDoctorVisits = async (roomAdmissionId: number) => {
    try {
      setDoctorVisitsLoading(true);
      setDoctorVisitsError(null);
      console.log('Fetching patient doctor visits for roomAdmissionId:', roomAdmissionId);
      const doctorVisits = await admissionsApi.getPatientDoctorVisits(roomAdmissionId);
      console.log('Fetched patient doctor visits:', doctorVisits);
      setPatientDoctorVisits(doctorVisits);
    } catch (err) {
      console.error('Error fetching patient doctor visits:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load patient doctor visits';
      
      // Check if the error indicates "no records found" - treat as empty state, not error
      if (errorMessage.toLowerCase().includes('no doctor visits found') || 
          errorMessage.toLowerCase().includes('not found') ||
          errorMessage.toLowerCase().includes('no records')) {
      setPatientDoctorVisits([]);
        setDoctorVisitsError(null); // Clear error to show empty state message
      } else {
        setDoctorVisitsError(errorMessage);
        setPatientDoctorVisits([]);
      }
    } finally {
      setDoctorVisitsLoading(false);
    }
  };

  const fetchPatientNurseVisits = async (roomAdmissionId: number) => {
    try {
      setNurseVisitsLoading(true);
      setNurseVisitsError(null);
      console.log('Fetching patient nurse visits for roomAdmissionId:', roomAdmissionId);
      const nurseVisits = await admissionsApi.getPatientNurseVisits(roomAdmissionId);
      console.log('Fetched patient nurse visits:', nurseVisits);
      setPatientNurseVisits(nurseVisits);
    } catch (err) {
      console.error('Error fetching patient nurse visits:', err);
      setNurseVisitsError(err instanceof Error ? err.message : 'Failed to load patient nurse visits');
      setPatientNurseVisits([]);
    } finally {
      setNurseVisitsLoading(false);
    }
  };

  // Fetch Patient Admit Visit Vitals
  const fetchPatientAdmitVisitVitals = async (roomAdmissionId: number) => {
    try {
      setVisitVitalsLoading(true);
      setVisitVitalsError(null);
      console.log('Fetching patient admit visit vitals for roomAdmissionId:', roomAdmissionId);
      const response = await apiRequest<any>(`/patient-admit-visit-vitals/room-admission/${roomAdmissionId}`);
      console.log('Patient admit visit vitals API response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures
      let vitalsData: any[] = [];
      
      if (Array.isArray(response)) {
        vitalsData = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          vitalsData = response.data;
        } else if (response.data.patientAdmitVisitVitals && Array.isArray(response.data.patientAdmitVisitVitals)) {
          vitalsData = response.data.patientAdmitVisitVitals;
        } else if (response.data.visitVitals && Array.isArray(response.data.visitVitals)) {
          vitalsData = response.data.visitVitals;
        }
      } else if (response?.patientAdmitVisitVitals && Array.isArray(response.patientAdmitVisitVitals)) {
        vitalsData = response.patientAdmitVisitVitals;
      } else if (response?.visitVitals && Array.isArray(response.visitVitals)) {
        vitalsData = response.visitVitals;
      }
      
      if (!Array.isArray(vitalsData) || vitalsData.length === 0) {
        console.warn('Patient admit visit vitals response is not an array or is empty:', response);
        setPatientAdmitVisitVitals([]);
        return;
      }
      
      // Helper function to extract field with multiple variations (including nested objects)
      const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
        for (const field of fieldVariations) {
          // Check direct field
          let value = data?.[field];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
          
          // Check nested paths (e.g., Patient.PatientId, Nurse.NurseId)
          if (field.includes('.')) {
            const parts = field.split('.');
            let nestedValue = data;
            for (const part of parts) {
              nestedValue = nestedValue?.[part];
              if (nestedValue === undefined || nestedValue === null) break;
            }
            if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
              return nestedValue;
            }
          }
          
          // Check nested objects (Patient, Nurse, etc.)
          if (data?.Patient?.[field]) {
            value = data.Patient[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          if (data?.Nurse?.[field]) {
            value = data.Nurse[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          if (data?.patient?.[field]) {
            value = data.patient[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          if (data?.nurse?.[field]) {
            value = data.nurse[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
        }
        return defaultValue;
      };
      
      // Fetch all staff/nurses to map nurseId to nurseName if needed
      let allStaff: any[] = [];
      try {
        allStaff = await staffApi.getAll();
        console.log('Fetched staff for nurse name mapping:', allStaff.length);
      } catch (err) {
        console.warn('Error fetching staff for nurse name mapping:', err);
      }
      
      // Map the response to PatientAdmitVisitVitals interface
      const mappedVitals: PatientAdmitVisitVitals[] = vitalsData.map((vital: any) => {
        const patientAdmitVisitVitalsId = Number(extractField(vital, [
          'patientAdmitVisitVitalsId', 'PatientAdmitVisitVitalsId', 'patient_admit_visit_vitals_id', 'Patient_Admit_Visit_Vitals_Id',
          'id', 'Id', 'ID'
        ], 0));
        
        const roomAdmissionIdValue = Number(extractField(vital, [
          'roomAdmissionId', 'RoomAdmissionId', 'room_admission_id', 'Room_Admission_Id',
          'admissionId', 'AdmissionId', 'admission_id', 'Admission_Id'
        ], roomAdmissionId));
        
        const patientIdValue = String(extractField(vital, [
          'patientId', 'PatientId', 'patient_id', 'Patient_ID',
          'patientID', 'PatientID', 'Patient.patientId', 'Patient.PatientId'
        ], ''));
        
        const nurseIdValue = Number(extractField(vital, [
          'nurseId', 'NurseId', 'nurse_id', 'Nurse_Id',
          'nurseID', 'NurseID', 'Nurse.nurseId', 'Nurse.NurseId'
        ], 0)) || undefined;
        
        // Extract Nurse Name with multiple variations, including nested objects
        let nurseNameValue = extractField(vital, [
          'nurseName', 'NurseName', 'nurse_name', 'Nurse_Name',
          'nurseFullName', 'NurseFullName', 'nurse_full_name', 'Nurse_Full_Name'
        ], '');
        
        // If not found, try nested Nurse object with various field names
        if (!nurseNameValue || nurseNameValue === '') {
          const nurseObj = vital?.Nurse || vital?.nurse;
          if (nurseObj) {
            nurseNameValue = nurseObj.UserName || 
                            nurseObj.userName || 
                            nurseObj.name || 
                            nurseObj.Name || 
                            nurseObj.fullName || 
                            nurseObj.FullName ||
                            nurseObj.nurseName ||
                            nurseObj.NurseName || '';
          }
        }
        
        // Also check for direct nested path variations
        if (!nurseNameValue || nurseNameValue === '') {
          nurseNameValue = extractField(vital, [
            'Nurse.UserName', 'Nurse.name', 'Nurse.Name', 'Nurse.fullName', 'Nurse.FullName',
            'nurse.UserName', 'nurse.name', 'nurse.Name', 'nurse.fullName', 'nurse.FullName'
          ], '');
        }
        
        // If still not found and we have a nurseId, try to find the nurse in the staff list
        if ((!nurseNameValue || nurseNameValue === '') && nurseIdValue && allStaff.length > 0) {
          const foundNurse = allStaff.find((staff: any) => {
            const staffId = staff.UserId || staff.userId || staff.id || staff.Id;
            return staffId && Number(staffId) === Number(nurseIdValue);
          });
          if (foundNurse) {
            nurseNameValue = foundNurse.UserName || foundNurse.userName || foundNurse.name || foundNurse.Name || '';
            console.log(`Found nurse name from staff list: ${nurseNameValue} for nurseId: ${nurseIdValue}`);
          }
        }
        
        // Log for debugging
        if (!nurseNameValue || nurseNameValue === '') {
          console.log('Nurse name not found for vital:', {
            vitalId: patientAdmitVisitVitalsId,
            nurseId: nurseIdValue,
            vitalKeys: Object.keys(vital),
            hasNurseObj: !!(vital?.Nurse || vital?.nurse),
            nurseObjKeys: vital?.Nurse ? Object.keys(vital.Nurse) : vital?.nurse ? Object.keys(vital.nurse) : []
          });
        }
        
        const patientStatusValue = extractField(vital, [
          'patientStatus', 'PatientStatus', 'patient_status', 'Patient_Status',
          'status', 'Status'
        ], '');
        
        const recordedDateTimeValue = extractField(vital, [
          'recordedDateTime', 'RecordedDateTime', 'recorded_date_time', 'Recorded_Date_Time',
          'recordedAt', 'RecordedAt', 'recorded_at', 'Recorded_At'
        ], '');
        
        const visitRemarksValue = extractField(vital, [
          'visitRemarks', 'VisitRemarks', 'visit_remarks', 'Visit_Remarks',
          'remarks', 'Remarks', 'visitNotes', 'VisitNotes'
        ], '');
        
        const dailyOrHourlyVitalsValue = extractField(vital, [
          'dailyOrHourlyVitals', 'DailyOrHourlyVitals', 'daily_or_hourly_vitals', 'Daily_Or_Hourly_Vitals',
          'vitalsType', 'VitalsType', 'vitals_type', 'Vitals_Type'
        ], '');
        
        const heartRateValue = Number(extractField(vital, [
          'heartRate', 'HeartRate', 'heart_rate', 'Heart_Rate',
          'hr', 'HR', 'heartrate', 'Heartrate'
        ], 0)) || undefined;
        
        const bloodPressureValue = extractField(vital, [
          'bloodPressure', 'BloodPressure', 'blood_pressure', 'Blood_Pressure',
          'bp', 'BP', 'bloodpressure', 'Bloodpressure'
        ], '');
        
        const temperatureValue = Number(extractField(vital, [
          'temperature', 'Temperature', 'temp', 'Temp',
          'bodyTemperature', 'BodyTemperature', 'body_temperature', 'Body_Temperature'
        ], 0)) || undefined;
        
        const o2SaturationValue = Number(extractField(vital, [
          'o2Saturation', 'O2Saturation', 'o2_saturation', 'O2_Saturation',
          'oxygenSaturation', 'OxygenSaturation', 'oxygen_saturation', 'Oxygen_Saturation',
          'spo2', 'SpO2', 'SPO2', 'o2Sat', 'O2Sat'
        ], 0)) || undefined;
        
        const respiratoryRateValue = Number(extractField(vital, [
          'respiratoryRate', 'RespiratoryRate', 'respiratory_rate', 'Respiratory_Rate',
          'rr', 'RR', 'respirationRate', 'RespirationRate'
        ], 0)) || undefined;
        
        const pulseRateValue = Number(extractField(vital, [
          'pulseRate', 'PulseRate', 'pulse_rate', 'Pulse_Rate',
          'pr', 'PR', 'pulse', 'Pulse'
        ], 0)) || undefined;
        
        const vitalsStatusValue = extractField(vital, [
          'vitalsStatus', 'VitalsStatus', 'vitals_status', 'Vitals_Status',
          'status', 'Status'
        ], '');
        
        const vitalsRemarksValue = extractField(vital, [
          'vitalsRemarks', 'VitalsRemarks', 'vitals_remarks', 'Vitals_Remarks',
          'remarks', 'Remarks', 'vitalsNotes', 'VitalsNotes'
        ], '');
        
        const vitalsCreatedByValue = extractField(vital, [
          'vitalsCreatedBy', 'VitalsCreatedBy', 'vitals_created_by', 'Vitals_Created_By',
          'createdBy', 'CreatedBy', 'created_by', 'Created_By'
        ], undefined);
        
        const vitalsCreatedAtValue = extractField(vital, [
          'vitalsCreatedAt', 'VitalsCreatedAt', 'vitals_created_at', 'Vitals_Created_At',
          'createdAt', 'CreatedAt', 'created_at', 'Created_At',
          'createdDate', 'CreatedDate', 'created_date', 'Created_Date'
        ], '');
        
        const statusValue = extractField(vital, [
          'status', 'Status', 'recordStatus', 'RecordStatus',
          'record_status', 'Record_Status'
        ], '');
        
        return {
          id: patientAdmitVisitVitalsId,
          patientAdmitVisitVitalsId: patientAdmitVisitVitalsId,
          roomAdmissionId: roomAdmissionIdValue,
          patientId: (patientIdValue && patientIdValue !== '') ? patientIdValue : undefined,
          nurseId: nurseIdValue,
          nurseName: (nurseNameValue && nurseNameValue !== '') ? nurseNameValue : undefined,
          patientStatus: (patientStatusValue && patientStatusValue !== '') ? patientStatusValue : undefined,
          recordedDateTime: (recordedDateTimeValue && recordedDateTimeValue !== '') ? recordedDateTimeValue : undefined,
          visitRemarks: (visitRemarksValue && visitRemarksValue !== '') ? visitRemarksValue : undefined,
          dailyOrHourlyVitals: (dailyOrHourlyVitalsValue && dailyOrHourlyVitalsValue !== '') ? dailyOrHourlyVitalsValue : undefined,
          heartRate: heartRateValue,
          bloodPressure: (bloodPressureValue && bloodPressureValue !== '') ? bloodPressureValue : undefined,
          temperature: temperatureValue,
          o2Saturation: o2SaturationValue,
          respiratoryRate: respiratoryRateValue,
          pulseRate: pulseRateValue,
          vitalsStatus: (vitalsStatusValue && vitalsStatusValue !== '') ? vitalsStatusValue : undefined,
          vitalsRemarks: (vitalsRemarksValue && vitalsRemarksValue !== '') ? vitalsRemarksValue : undefined,
          vitalsCreatedBy: vitalsCreatedByValue !== undefined && vitalsCreatedByValue !== null && vitalsCreatedByValue !== '' ? vitalsCreatedByValue : undefined,
          vitalsCreatedAt: (vitalsCreatedAtValue && vitalsCreatedAtValue !== '') ? vitalsCreatedAtValue : undefined,
          status: (statusValue && statusValue !== '') ? statusValue : undefined
        };
      });
      
      console.log('Mapped patient admit visit vitals:', mappedVitals);
      setPatientAdmitVisitVitals(mappedVitals);
    } catch (err) {
      console.error('Error fetching patient admit visit vitals:', err);
      setVisitVitalsError(err instanceof Error ? err.message : 'Failed to load patient admit visit vitals');
      setPatientAdmitVisitVitals([]);
    } finally {
      setVisitVitalsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admissions');
  };

  // Handle viewing IPD Lab Test
  const handleViewIPDLabTest = (labTest: PatientLabTest) => {
    setViewingLabTest(labTest);
    setIsViewIPDLabTestDialogOpen(true);
  };

  // Handle opening Edit IPD Lab Test dialog
  const handleOpenEditIPDLabTestDialog = async (labTest: PatientLabTest) => {
    // Fetch available lab tests
    try {
      const labTests = await labTestsApi.getAll();
      setAvailableLabTests(labTests);
    } catch (err) {
      console.error('Error fetching lab tests:', err);
    }

    // Fetch available doctors
    try {
      const doctors = await doctorsApi.getAll();
      setAvailableDoctors(doctors);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }

    const patientLabTestsId = labTest.patientLabTestsId || labTest.patientLabTestId || labTest.id;
    setEditingLabTestId(patientLabTestsId || null);

    // Find the selected lab test to populate the search term
    const selectedLabTest = availableLabTests.find((lt: LabTest) => {
      const lid = (lt as any).labTestId || (lt as any).id || '';
      return String(lid) === String(labTest.labTestId);
    });

    // Extract orderedByDoctorId with various field name variations
    const orderedByDoctorId = (labTest as any).orderedByDoctorId || 
                              (labTest as any).OrderedByDoctorId || 
                              (labTest as any).ordered_by_doctor_id ||
                              (labTest as any).Ordered_By_Doctor_Id ||
                              '';

    // Find the selected doctor to populate the search term
    const selectedDoctor = availableDoctors.find((doc: Doctor) => {
      const docId = doc.id || (doc as any).Id || '';
      return String(docId) === String(orderedByDoctorId);
    });

    setIpdLabTestFormData({
      roomAdmissionId: String(labTest.roomAdmissionId || admission?.roomAdmissionId || admission?.admissionId || ''),
      patientId: String(labTest.patientId || admission?.patientId || ''),
      labTestId: String(labTest.labTestId || ''),
      priority: labTest.priority || 'Normal',
      orderedDate: labTest.orderedDate || new Date().toISOString().split('T')[0],
      orderedBy: labTest.orderedBy || '',
      orderedByDoctorId: String(orderedByDoctorId || ''),
      description: labTest.description || '',
      charges: labTest.charges ? String(labTest.charges) : '',
      patientType: (labTest.patientType as string) || 'IPD',
      appointmentId: (labTest as any).appointmentId || '',
      emergencyBedSlotId: String(labTest.emergencyBedSlotId || ''),
      labTestDone: labTest.labTestDone === true || String(labTest.labTestDone).toLowerCase() === 'true' || String(labTest.labTestDone).toLowerCase() === 'yes' ? 'Yes' : 'No',
      reportsUrl: labTest.reportsUrl || '',
      testStatus: labTest.testStatus || 'Pending',
      testDoneDateTime: labTest.testDoneDateTime ? new Date(labTest.testDoneDateTime).toISOString().slice(0, 16) : ''
    });

    setLabTestSearchTerm(selectedLabTest ? `${selectedLabTest.testName || 'Unknown'} (${selectedLabTest.testCategory || 'N/A'})` : '');
    setShowLabTestList(false);
    setIpdLabTestDoctorSearchTerm(selectedDoctor ? (selectedDoctor.name || selectedDoctor.doctorName || '') : '');
    setShowIpdLabTestDoctorList(false);
    setIpdLabTestSubmitError(null);
    setIsEditIPDLabTestDialogOpen(true);
  };

  // Handle opening Add IPD Lab Test dialog
  const handleOpenAddIPDLabTestDialog = async () => {
    if (admission) {
      // Fetch available lab tests
      try {
        const labTests = await labTestsApi.getAll();
        setAvailableLabTests(labTests);
      } catch (err) {
        console.error('Error fetching lab tests:', err);
      }
      
      // Fetch available doctors
      try {
        const doctors = await doctorsApi.getAll();
        setAvailableDoctors(doctors);
      } catch (err) {
        console.error('Error fetching doctors:', err);
      }
      
      // Extract PatientId with fallbacks for different field name variations
      const patientIdValue = (admission as any).patientId || 
                            (admission as any).PatientId || 
                            (admission as any).PatientID || 
                            (admission as any).patient_id || 
                            (admission as any).Patient_ID || 
                            admission?.patientId ||
                            '';
      
      // Extract RoomAdmissionId with fallbacks
      const roomAdmissionIdValue = admission.roomAdmissionId || 
                                  admission.admissionId || 
                                  (admission as any).RoomAdmissionId || 
                                  (admission as any).room_admission_id || 
                                  (admission as any).id || 
                                  '';
      
      console.log('Initializing IPD Lab Test form:', {
        roomAdmissionId: roomAdmissionIdValue,
        patientId: patientIdValue,
        admission: admission,
        admissionPatientId: admission?.patientId
      });
      
      setIpdLabTestFormData({
        roomAdmissionId: String(roomAdmissionIdValue || ''),
        patientId: String(patientIdValue || admission?.patientId || ''),
        labTestId: '',
        priority: 'Normal',
        orderedDate: new Date().toISOString().split('T')[0], // Today's date
        orderedBy: '',
        orderedByDoctorId: '',
        description: '',
        charges: '',
        patientType: 'IPD', // Default to IPD
        appointmentId: '',
        emergencyBedSlotId: '',
        labTestDone: 'No',
        reportsUrl: '',
        testStatus: 'Pending',
        testDoneDateTime: ''
      });
      setLabTestSearchTerm('');
      setShowLabTestList(false);
      setIpdLabTestDoctorSearchTerm('');
      setShowIpdLabTestDoctorList(false);
      setIpdLabTestSubmitError(null);
      setIsAddIPDLabTestDialogOpen(true);
    } else {
      setIpdLabTestSubmitError('Admission data is not loaded. Please wait and try again.');
    }
  };

  // Handle saving IPD Lab Test
  const handleSaveIPDLabTest = async () => {
    try {
      setIpdLabTestSubmitting(true);
      setIpdLabTestSubmitError(null);

      console.log('Saving IPD Lab Test with data:', ipdLabTestFormData);

      // Validate required fields
      if (!ipdLabTestFormData.roomAdmissionId || ipdLabTestFormData.roomAdmissionId === 'undefined' || ipdLabTestFormData.roomAdmissionId === '') {
        throw new Error('Room Admission ID is required');
      }
      
      // Extract PatientId with fallbacks for different field name variations
      let patientIdValue = ipdLabTestFormData.patientId;
      if (!patientIdValue || patientIdValue === 'undefined' || patientIdValue === '' || patientIdValue === 'null') {
        // Try to get from admission with multiple field name variations
        patientIdValue = (admission as any)?.patientId || 
                        (admission as any)?.PatientId || 
                        (admission as any)?.PatientID || 
                        (admission as any)?.patient_id || 
                        (admission as any)?.Patient_ID || 
                        '';
        console.log('PatientId from form was empty, trying from admission:', patientIdValue);
      }
      
      if (!patientIdValue || patientIdValue === 'undefined' || patientIdValue === '' || patientIdValue === 'null') {
        throw new Error('Patient ID is required. Please ensure the admission has a valid patient ID.');
      }
      
      if (!ipdLabTestFormData.labTestId || ipdLabTestFormData.labTestId === '') {
        throw new Error('Lab Test is required. Please select a lab test.');
      }
      
      if (!ipdLabTestFormData.orderedDate) {
        throw new Error('Ordered Date is required');
      }

      if (!ipdLabTestFormData.orderedByDoctorId) {
        throw new Error('Ordered By Doctor is required');
      }

      if (!ipdLabTestFormData.patientType || ipdLabTestFormData.patientType === '') {
        throw new Error('Patient Type is required.');
      }

      // Get selected lab test details
      const selectedLabTest = availableLabTests.find((lt: LabTest) => {
        const lid = (lt as any).labTestId || (lt as any).id || '';
        return String(lid) === ipdLabTestFormData.labTestId;
      });
      if (!selectedLabTest) {
        throw new Error('Selected lab test details not found.');
      }

      // Prepare the request payload
      const payload: any = {
        RoomAdmissionId: Number(ipdLabTestFormData.roomAdmissionId),
        PatientId: String(patientIdValue).trim(),
        LabTestId: Number(ipdLabTestFormData.labTestId),
        Priority: ipdLabTestFormData.priority || 'Normal',
        OrderedDate: ipdLabTestFormData.orderedDate,
        PatientType: ipdLabTestFormData.patientType,
        LabTestDone: ipdLabTestFormData.labTestDone || 'No',
        TestStatus: ipdLabTestFormData.testStatus || 'Pending',
      };

      // Add conditional fields based on PatientType (only if they have values)
      if (ipdLabTestFormData.patientType === 'OPD') {
        if (ipdLabTestFormData.appointmentId && ipdLabTestFormData.appointmentId.trim() !== '') {
          payload.AppointmentId = String(ipdLabTestFormData.appointmentId).trim();
        }
      }
      if (ipdLabTestFormData.patientType === 'IPD') {
        if (ipdLabTestFormData.roomAdmissionId && ipdLabTestFormData.roomAdmissionId.trim() !== '') {
          payload.RoomAdmissionId = Number(ipdLabTestFormData.roomAdmissionId);
        }
      }
      if (ipdLabTestFormData.patientType === 'Emergency') {
        if (ipdLabTestFormData.emergencyBedSlotId && ipdLabTestFormData.emergencyBedSlotId.trim() !== '') {
          payload.EmergencyBedSlotId = String(ipdLabTestFormData.emergencyBedSlotId).trim();
        }
      }

      // Add OrderedByDoctorId (required)
      if (ipdLabTestFormData.orderedByDoctorId && ipdLabTestFormData.orderedByDoctorId.trim() !== '') {
        payload.OrderedByDoctorId = Number(ipdLabTestFormData.orderedByDoctorId);
      }
      
      // Add optional fields
      if (ipdLabTestFormData.orderedBy && ipdLabTestFormData.orderedBy.trim() !== '') {
        payload.OrderedBy = ipdLabTestFormData.orderedBy.trim();
      }
      if (ipdLabTestFormData.description && ipdLabTestFormData.description.trim() !== '') {
        payload.Description = ipdLabTestFormData.description.trim();
      }
      if (ipdLabTestFormData.charges && ipdLabTestFormData.charges.trim() !== '') {
        payload.Charges = Number(ipdLabTestFormData.charges);
      } else if (selectedLabTest.charges) {
        payload.Charges = selectedLabTest.charges;
      }
      if (ipdLabTestFormData.reportsUrl && ipdLabTestFormData.reportsUrl.trim() !== '') {
        payload.ReportsUrl = ipdLabTestFormData.reportsUrl.trim();
      }
      if (ipdLabTestFormData.testDoneDateTime && ipdLabTestFormData.testDoneDateTime.trim() !== '') {
        // Convert datetime-local to ISO 8601 format
        try {
          const date = new Date(ipdLabTestFormData.testDoneDateTime);
          if (!isNaN(date.getTime())) {
            payload.TestDoneDateTime = date.toISOString();
          } else {
            payload.TestDoneDateTime = ipdLabTestFormData.testDoneDateTime;
          }
        } catch (e) {
          payload.TestDoneDateTime = ipdLabTestFormData.testDoneDateTime;
        }
      }

      console.log('API Payload:', JSON.stringify(payload, null, 2));

      // Call the API to create or update the patient lab test
      let response;
      if (editingLabTestId) {
        // Update existing lab test
        const patientLabTestsId = editingLabTestId;
        console.log('API Endpoint: PUT /patient-lab-tests/' + patientLabTestsId);
        response = await apiRequest<any>(`/patient-lab-tests/${patientLabTestsId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        console.log('IPD Lab test updated successfully:', response);
      } else {
        // Create new lab test
        console.log('API Endpoint: POST /patient-lab-tests');
        response = await apiRequest<any>('/patient-lab-tests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        console.log('IPD Lab test created successfully:', response);
      }

      // Close dialog
      setIsAddIPDLabTestDialogOpen(false);
      setIsEditIPDLabTestDialogOpen(false);
      setEditingLabTestId(null);
      setIsEditIPDLabTestDialogOpen(false);
      setEditingLabTestId(null);
      
      // Refresh the lab tests list
      if (admission?.roomAdmissionId) {
        await fetchPatientLabTests(admission.roomAdmissionId);
      }

      // Reset form
      setIpdLabTestFormData({
        roomAdmissionId: '',
        patientId: '',
        labTestId: '',
        priority: 'Normal',
        orderedDate: '',
        orderedBy: '',
        orderedByDoctorId: '',
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
      setIpdLabTestDoctorSearchTerm('');
      setShowIpdLabTestDoctorList(false);
    } catch (err) {
      console.error('Error saving IPD Lab Test:', err);
      setIpdLabTestSubmitError(
        err instanceof Error ? err.message : 'Failed to save IPD Lab Test'
      );
    } finally {
      setIpdLabTestSubmitting(false);
    }
  };

  // Handle opening Add Doctor Visit dialog
  const handleOpenAddDoctorVisitDialog = async () => {
    if (admission) {
      // Fetch available doctors
      try {
        const doctors = await doctorsApi.getAll();
        setAvailableDoctors(doctors);
      } catch (err) {
        console.error('Error fetching doctors:', err);
      }
      
      // Extract PatientId with fallbacks
      const patientIdValue = (admission as any).patientId || 
                            (admission as any).PatientId || 
                            (admission as any).PatientID || 
                            (admission as any).patient_id || 
                            (admission as any).Patient_ID || 
                            '';
      
      setDoctorVisitFormData({
        patientId: String(patientIdValue),
        doctorId: '',
        doctorVisitedDateTime: new Date().toISOString().slice(0, 16), // Current date and time
        visitsRemarks: '',
        patientCondition: '',
        status: 'Active',
        visitCreatedAt: new Date().toISOString()
      });
      setDoctorSearchTerm('');
      setShowDoctorList(false);
      setDoctorVisitSubmitError(null);
      setIsAddDoctorVisitDialogOpen(true);
    } else {
      setDoctorVisitSubmitError('Admission data is not loaded. Please wait and try again.');
    }
  };

  // Handle viewing Doctor Visit
  const handleViewDoctorVisit = (visit: PatientDoctorVisit) => {
    setViewingDoctorVisit(visit);
    setIsViewDoctorVisitDialogOpen(true);
  };

  // Handle opening Edit Doctor Visit dialog
  const handleOpenEditDoctorVisitDialog = async (visit: PatientDoctorVisit) => {
    // Fetch available doctors first
    let doctorsList: Doctor[] = [];
    try {
      doctorsList = await doctorsApi.getAll();
      setAvailableDoctors(doctorsList);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }

    const patientDoctorVisitId = visit.patientDoctorVisitId || visit.id;
    setEditingDoctorVisitId(patientDoctorVisitId || null);

    // Find the selected doctor to populate the search term (use doctorsList from the fetch, not availableDoctors state)
    const selectedDoctor = doctorsList.find((doc: Doctor) => {
      const did = doc.id || 0;
      return String(did) === String(visit.doctorId);
    });

    setDoctorVisitFormData({
      patientId: String(visit.patientId || admission?.patientId || ''),
      doctorId: String(visit.doctorId || ''),
      doctorVisitedDateTime: visit.doctorVisitedDateTime ? new Date(visit.doctorVisitedDateTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      visitsRemarks: visit.visitsRemarks || '',
      patientCondition: visit.patientCondition || '',
      status: visit.status || 'Active',
      visitCreatedAt: visit.visitCreatedAt ? (typeof visit.visitCreatedAt === 'string' ? new Date(visit.visitCreatedAt).toISOString().slice(0, 16) : new Date(visit.visitCreatedAt).toISOString().slice(0, 16)) : ''
    });

    setDoctorSearchTerm(selectedDoctor ? `${selectedDoctor.name || 'Unknown'} (${selectedDoctor.specialty || 'N/A'})` : String(visit.doctorId || ''));
    setShowDoctorList(false);
    setDoctorVisitSubmitError(null);
    setIsEditDoctorVisitDialogOpen(true);
    setIsAddDoctorVisitDialogOpen(false); // Ensure add dialog is closed
  };

  // Handle saving Doctor Visit
  const handleSaveDoctorVisit = async () => {
    try {
      setDoctorVisitSubmitting(true);
      setDoctorVisitSubmitError(null);

      console.log('Saving Doctor Visit with data:', doctorVisitFormData);

      // Validate required fields
      if (!admission?.roomAdmissionId) {
        throw new Error('Room Admission ID is required');
      }
      
      let patientIdValue = doctorVisitFormData.patientId;
      if (!patientIdValue || patientIdValue === 'undefined' || patientIdValue === '' || patientIdValue === 'null') {
        patientIdValue = (admission as any)?.patientId || 
                        (admission as any)?.PatientId || 
                        (admission as any)?.PatientID || 
                        (admission as any)?.patient_id || 
                        (admission as any)?.Patient_ID || 
                        '';
      }
      
      if (!patientIdValue || patientIdValue === 'undefined' || patientIdValue === '' || patientIdValue === 'null') {
        throw new Error('Patient ID is required. Please ensure the admission has a valid patient ID.');
      }
      
      if (!doctorVisitFormData.doctorId || doctorVisitFormData.doctorId === '') {
        throw new Error('Doctor is required. Please select a doctor.');
      }
      
      if (!doctorVisitFormData.doctorVisitedDateTime) {
        throw new Error('Doctor Visited Date & Time is required');
      }

      // Prepare the request payload
      const payload: any = {
        RoomAdmissionId: Number(admission.roomAdmissionId),
        PatientId: String(patientIdValue).trim(),
        DoctorId: Number(doctorVisitFormData.doctorId),
        DoctorVisitedDateTime: new Date(doctorVisitFormData.doctorVisitedDateTime).toISOString(),
        VisitsRemarks: doctorVisitFormData.visitsRemarks || '',
        PatientCondition: doctorVisitFormData.patientCondition || '',
        Status: doctorVisitFormData.status || 'Active',
      };

      // Add optional fields
      if (doctorVisitFormData.visitCreatedAt && doctorVisitFormData.visitCreatedAt.trim() !== '') {
        payload.VisitCreatedAt = new Date(doctorVisitFormData.visitCreatedAt).toISOString();
      }

      console.log('API Payload:', JSON.stringify(payload, null, 2));

      // Call the API to create or update the doctor visit
      let response;
      if (editingDoctorVisitId) {
        // Update existing doctor visit
        console.log('API Endpoint: PUT /patient-admit-doctor-visits/' + editingDoctorVisitId);
        response = await apiRequest<any>(`/patient-admit-doctor-visits/${editingDoctorVisitId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        console.log('Doctor visit updated successfully:', response);
      } else {
        // Create new doctor visit
        console.log('API Endpoint: POST /patient-admit-doctor-visits');
        response = await apiRequest<any>('/patient-admit-doctor-visits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        console.log('Doctor visit created successfully:', response);
      }

      // Close dialog
      setIsAddDoctorVisitDialogOpen(false);
      setIsEditDoctorVisitDialogOpen(false);
      setEditingDoctorVisitId(null);
      
      // Refresh the doctor visits list
      if (admission?.roomAdmissionId) {
        await fetchPatientDoctorVisits(admission.roomAdmissionId);
      }
      
      // Reset form
      setDoctorVisitFormData({
        patientId: '',
        doctorId: '',
        doctorVisitedDateTime: '',
        visitsRemarks: '',
        patientCondition: '',
        status: 'Active',
        visitCreatedAt: ''
      });
      setDoctorSearchTerm('');
      setShowDoctorList(false);
    } catch (err) {
      console.error('Error saving doctor visit:', err);
      setDoctorVisitSubmitError(err instanceof Error ? err.message : 'Failed to save doctor visit');
    } finally {
      setDoctorVisitSubmitting(false);
    }
  };

  // Handle opening Add Visit Vitals dialog
  const handleOpenAddVisitVitalsDialog = async () => {
    if (admission) {
      // Fetch available nurses
      try {
        const staff = await staffApi.getAll();
        const nurses = staff.filter((member: any) => {
          const roleName = member.RoleName || member.roleName || '';
          return roleName.toLowerCase().includes('nurse');
        });
        setAvailableNurses(nurses);
      } catch (err) {
        console.error('Error fetching nurses:', err);
      }
      
      // Extract PatientId with fallbacks
      const patientIdValue = (admission as any).patientId || 
                            (admission as any).PatientId || 
                            (admission as any).PatientID || 
                            (admission as any).patient_id || 
                            (admission as any).Patient_ID || 
                            '';
      
      setVisitVitalsFormData({
        patientId: String(patientIdValue),
        nurseId: '',
        patientStatus: 'Stable',
        recordedDateTime: new Date().toISOString().slice(0, 16),
        visitRemarks: '',
        dailyOrHourlyVitals: 'Daily',
        heartRate: '',
        bloodPressure: '',
        temperature: '',
        o2Saturation: '',
        respiratoryRate: '',
        pulseRate: '',
        vitalsStatus: 'Stable',
        vitalsRemarks: '',
        vitalsCreatedBy: '',
        status: 'Active'
      });
      setNurseSearchTerm('');
      setShowNurseList(false);
      setVisitVitalsSubmitError(null);
      setIsAddVisitVitalsDialogOpen(true);
    } else {
      setVisitVitalsSubmitError('Admission data is not loaded. Please wait and try again.');
    }
  };

  // Handle viewing Visit Vitals
  const handleViewVisitVitals = (vitals: PatientAdmitVisitVitals) => {
    setViewingVisitVitals(vitals);
    setIsViewVisitVitalsDialogOpen(true);
  };

  // Handle opening Edit Visit Vitals dialog
  const handleOpenEditVisitVitalsDialog = async (vitals: PatientAdmitVisitVitals) => {
    // Fetch available nurses
    try {
      const staff = await staffApi.getAll();
      const nurses = staff.filter((member: any) => {
        const roleName = member.RoleName || member.roleName || '';
        return roleName.toLowerCase().includes('nurse');
      });
      setAvailableNurses(nurses);
    } catch (err) {
      console.error('Error fetching nurses:', err);
    }

    const patientAdmitVisitVitalsId = vitals.patientAdmitVisitVitalsId || vitals.id;
    setEditingVisitVitalsId(patientAdmitVisitVitalsId || null);

    // Find the selected nurse to populate the search term
    const selectedNurse = availableNurses.find((nurse: any) => {
      const nid = nurse.UserId || nurse.id || 0;
      return String(nid) === String(vitals.nurseId);
    });

    setVisitVitalsFormData({
      patientId: String(vitals.patientId || admission?.patientId || ''),
      nurseId: String(vitals.nurseId || ''),
      patientStatus: vitals.patientStatus || '',
      recordedDateTime: vitals.recordedDateTime ? new Date(vitals.recordedDateTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      visitRemarks: vitals.visitRemarks || '',
      dailyOrHourlyVitals: vitals.dailyOrHourlyVitals || 'Daily',
      heartRate: vitals.heartRate ? String(vitals.heartRate) : '',
      bloodPressure: vitals.bloodPressure || '',
      temperature: vitals.temperature ? String(vitals.temperature) : '',
      o2Saturation: vitals.o2Saturation ? String(vitals.o2Saturation) : '',
      respiratoryRate: vitals.respiratoryRate ? String(vitals.respiratoryRate) : '',
      pulseRate: vitals.pulseRate ? String(vitals.pulseRate) : '',
      vitalsStatus: vitals.vitalsStatus || 'Stable',
      vitalsRemarks: vitals.vitalsRemarks || '',
      vitalsCreatedBy: String(vitals.vitalsCreatedBy || ''),
      status: vitals.status || 'Active'
    });

    setNurseSearchTerm(selectedNurse ? `${selectedNurse.UserName || selectedNurse.name || 'Unknown'}` : '');
    setShowNurseList(false);
    setVisitVitalsSubmitError(null);
    setIsEditVisitVitalsDialogOpen(true);
  };

  // Handle saving Visit Vitals
  const handleSaveVisitVitals = async () => {
    try {
      setVisitVitalsSubmitting(true);
      setVisitVitalsSubmitError(null);

      console.log('Saving Visit Vitals with data:', visitVitalsFormData);

      // Validate required fields
      if (!admission?.roomAdmissionId) {
        throw new Error('Room Admission ID is required');
      }
      
      let patientIdValue = visitVitalsFormData.patientId;
      if (!patientIdValue || patientIdValue === 'undefined' || patientIdValue === '' || patientIdValue === 'null') {
        patientIdValue = (admission as any)?.patientId || 
                        (admission as any)?.PatientId || 
                        (admission as any)?.PatientID || 
                        (admission as any)?.patient_id || 
                        (admission as any)?.Patient_ID || 
                        '';
      }
      
      if (!patientIdValue || patientIdValue === 'undefined' || patientIdValue === '' || patientIdValue === 'null') {
        throw new Error('Patient ID is required. Please ensure the admission has a valid patient ID.');
      }
      
      if (!visitVitalsFormData.nurseId || visitVitalsFormData.nurseId === '') {
        throw new Error('Nurse is required. Please select a nurse.');
      }
      
      if (!visitVitalsFormData.recordedDateTime) {
        throw new Error('Recorded Date & Time is required');
      }

      // Prepare the request payload
      const payload: any = {
        RoomAdmissionId: Number(admission.roomAdmissionId),
        PatientId: String(patientIdValue).trim(),
        NurseId: Number(visitVitalsFormData.nurseId),
        RecordedDateTime: new Date(visitVitalsFormData.recordedDateTime).toISOString(),
        DailyOrHourlyVitals: visitVitalsFormData.dailyOrHourlyVitals || 'Daily',
        Status: visitVitalsFormData.status || 'Active',
      };

      // Add required/optional fields
      // Patient Status is required
      payload.PatientStatus = visitVitalsFormData.patientStatus.trim() || 'Stable';
      if (visitVitalsFormData.visitRemarks && visitVitalsFormData.visitRemarks.trim() !== '') {
        payload.VisitRemarks = visitVitalsFormData.visitRemarks.trim();
      }
      if (visitVitalsFormData.heartRate && visitVitalsFormData.heartRate.trim() !== '') {
        payload.HeartRate = Number(visitVitalsFormData.heartRate);
      }
      if (visitVitalsFormData.bloodPressure && visitVitalsFormData.bloodPressure.trim() !== '') {
        payload.BloodPressure = visitVitalsFormData.bloodPressure.trim();
      }
      if (visitVitalsFormData.temperature && visitVitalsFormData.temperature.trim() !== '') {
        payload.Temperature = Number(visitVitalsFormData.temperature);
      }
      if (visitVitalsFormData.o2Saturation && visitVitalsFormData.o2Saturation.trim() !== '') {
        payload.O2Saturation = Number(visitVitalsFormData.o2Saturation);
      }
      if (visitVitalsFormData.respiratoryRate && visitVitalsFormData.respiratoryRate.trim() !== '') {
        payload.RespiratoryRate = Number(visitVitalsFormData.respiratoryRate);
      }
      if (visitVitalsFormData.pulseRate && visitVitalsFormData.pulseRate.trim() !== '') {
        payload.PulseRate = Number(visitVitalsFormData.pulseRate);
      }
      if (visitVitalsFormData.vitalsStatus && visitVitalsFormData.vitalsStatus.trim() !== '') {
        payload.VitalsStatus = visitVitalsFormData.vitalsStatus.trim();
      }
      if (visitVitalsFormData.vitalsRemarks && visitVitalsFormData.vitalsRemarks.trim() !== '') {
        payload.VitalsRemarks = visitVitalsFormData.vitalsRemarks.trim();
      }
      if (visitVitalsFormData.vitalsCreatedBy && visitVitalsFormData.vitalsCreatedBy.trim() !== '') {
        payload.VitalsCreatedBy = visitVitalsFormData.vitalsCreatedBy.trim();
      }

      console.log('API Payload:', JSON.stringify(payload, null, 2));

      // Call the API to create or update the visit vitals
      let response;
      if (editingVisitVitalsId) {
        // Update existing visit vitals
        console.log('API Endpoint: PUT /patient-admit-visit-vitals/' + editingVisitVitalsId);
        response = await apiRequest<any>(`/patient-admit-visit-vitals/${editingVisitVitalsId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        console.log('Visit vitals updated successfully:', response);
      } else {
        // Create new visit vitals
        console.log('API Endpoint: POST /patient-admit-visit-vitals');
        response = await apiRequest<any>('/patient-admit-visit-vitals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        console.log('Visit vitals created successfully:', response);
      }

      // Close dialog
      setIsAddVisitVitalsDialogOpen(false);
      setIsEditVisitVitalsDialogOpen(false);
      setEditingVisitVitalsId(null);
      
      // Refresh the visit vitals list
      if (admission?.roomAdmissionId) {
        await fetchPatientAdmitVisitVitals(admission.roomAdmissionId);
      }
      
      // Reset form
      setVisitVitalsFormData({
        patientId: '',
        nurseId: '',
        patientStatus: 'Stable',
        recordedDateTime: '',
        visitRemarks: '',
        dailyOrHourlyVitals: 'Daily',
        heartRate: '',
        bloodPressure: '',
        temperature: '',
        o2Saturation: '',
        respiratoryRate: '',
        pulseRate: '',
        vitalsStatus: 'Stable',
        vitalsRemarks: '',
        vitalsCreatedBy: '',
        status: 'Active'
      });
      setNurseSearchTerm('');
      setShowNurseList(false);
    } catch (err) {
      console.error('Error saving visit vitals:', err);
      setVisitVitalsSubmitError(err instanceof Error ? err.message : 'Failed to save visit vitals');
    } finally {
      setVisitVitalsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading admission details...</p>
        </div>
      </div>
    );
  }

  if (error || !admission) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-scrollable-container">
          <div className="dashboard-main-content">
            <div className="flex items-center justify-center min-h-[60vh]">
              <Card className="max-w-md">
                <CardContent className="p-6">
                  <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Admission not found'}</p>
                    <Button onClick={handleBack} variant="outline">
                      <ArrowLeft className="size-4 mr-2" />
                      Back to Admissions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-scrollable-container">
        <div className="dashboard-header-section">
          <div className="dashboard-header-content">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <div>
                <h1 className="dashboard-header">Manage IPD Case</h1>
                <p className="dashboard-subheader">Room Admission ID: {admission.roomAdmissionId || admission.admissionId} | Patient ID: {admission.patientId || admission.patient_id}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-main-content">
        {/* Room Admission Details */}
        <Card className="dashboard-table-card">
          <CardHeader>
            <CardTitle>Room Admission Details</CardTitle>
          </CardHeader>
          <CardContent className="dashboard-table-card-content">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <Label className="text-sm text-gray-500">Patient Name</Label>
                <p className="text-gray-900 font-medium mt-1">{admission.patientName}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Patient No</Label>
                <p className="text-gray-900 font-medium mt-1">{admission.patientNo || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Bed Number</Label>
                <p className="text-gray-900 font-medium mt-1">
                  <Badge variant="outline">{admission.bedNumber}</Badge>
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Room Type</Label>
                <p className="text-gray-900 font-medium mt-1">{admission.roomType}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Age</Label>
                <p className="text-gray-900 font-medium mt-1">{admission.age > 0 ? `${admission.age} years` : 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Gender</Label>
                <p className="text-gray-900 font-medium mt-1">{admission.gender || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Admission Date</Label>
                <p className="text-gray-900 font-medium mt-1">{admission.admissionDate || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Admitted By</Label>
                <p className="text-gray-900 font-medium mt-1">{admission.admittedBy || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Admitting Doctor Name</Label>
                <p className="text-gray-900 font-medium mt-1">{admission.admittingDoctorName || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Admission Status</Label>
                <p className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs inline-block ${
                    admission.status === 'Active' ? 'bg-green-100 text-green-700' :
                    admission.status === 'Surgery Scheduled' ? 'bg-orange-100 text-orange-700' :
                    admission.status === 'Moved to ICU' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {admission.admissionStatus || admission.status}
                  </span>
                </p>
              </div>
              {admission.scheduleOT && (
                <div>
                  <Label className="text-sm text-gray-500">Schedule OT</Label>
                  <p className="mt-1">
                    <Badge variant={String(admission.scheduleOT).toLowerCase() === 'yes' ? 'default' : 'outline'}>
                      {String(admission.scheduleOT)}
                    </Badge>
                  </p>
                </div>
              )}
              {admission.isLinkedToICU !== undefined && (
                <div>
                  <Label className="text-sm text-gray-500">Linked to ICU</Label>
                  <p className="mt-1">
                    <Badge variant={admission.isLinkedToICU ? 'default' : 'outline'}>
                      {admission.isLinkedToICU ? 'Yes' : 'No'}
                    </Badge>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Case Details, Lab Tests, Doctor Visits, Nurse Visits and Vitals */}
        <Tabs defaultValue="case-details" className="dashboard-tabs">
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
              Nurse Visits and Vitals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="case-details" className="mt-4">
            <Card className="dashboard-table-card">
              <CardHeader>
                <CardTitle>Case Details</CardTitle>
              </CardHeader>
              <CardContent className="dashboard-table-card-content">
                <div className="space-y-4">
                  {admission.caseSheetDetails && (
                    <div>
                      <Label className="text-sm text-gray-500">Case Sheet Details</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md border border-gray-200">
                        <p className="text-gray-900 whitespace-pre-wrap">{admission.caseSheetDetails}</p>
                      </div>
                    </div>
                  )}
                  {admission.caseSheet && (
                    <div>
                      <Label className="text-sm text-gray-500">Case Sheet</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md border border-gray-200">
                        <p className="text-gray-900 whitespace-pre-wrap">{admission.caseSheet}</p>
                      </div>
                    </div>
                  )}
                  {admission.estimatedStay && (
                    <div>
                      <Label className="text-sm text-gray-500">Estimated Stay</Label>
                      <p className="text-gray-900 font-medium mt-1">{admission.estimatedStay}</p>
                    </div>
                  )}
                  {admission.createdAt && (
                    <div>
                      <Label className="text-sm text-gray-500">Created At</Label>
                      <p className="text-gray-900 font-medium mt-1">{new Date(admission.createdAt).toLocaleString()}</p>
                    </div>
                  )}
                  {!admission.caseSheetDetails && !admission.caseSheet && (
                    <div>
                      <Label className="text-sm text-gray-500">Admission Notes</Label>
                      <p className="text-gray-900 mt-1">Case details and notes will be displayed here.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lab-tests" className="mt-4">
            <Card className="dashboard-table-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                <CardTitle>Patient's Lab Tests</CardTitle>
                  <Button
                    onClick={handleOpenAddIPDLabTestDialog}
                    className="gap-2"
                  >
                    <Plus className="size-4" />
                    Add New IPD Lab Test
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="dashboard-table-card-content">
                {labTestsLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500">Loading lab tests...</p>
                  </div>
                )}
                
                {labTestsError && (
                  <div className="text-center py-8">
                    <p className="text-red-600">{labTestsError}</p>
                  </div>
                )}
                
                {!labTestsLoading && !labTestsError && patientLabTests.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No lab tests found for this admission.
                  </div>
                )}
                
                {!labTestsLoading && !labTestsError && patientLabTests.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">PatientName</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">TestName</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">PatientType</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Priority</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">LabTestDone</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">ReportsUrl</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">TestStatus</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">TestDoneDateTime</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">CreatedDate</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientLabTests.map((labTest, index) => {
                          // Helper function to extract field with multiple variations
                          const extract = (obj: any, fields: string[]) => {
                            for (const field of fields) {
                              if (obj?.[field] !== undefined && obj?.[field] !== null && obj?.[field] !== '') {
                                return obj[field];
                              }
                            }
                            return undefined;
                          };
                          
                          const patientLabTestsId = labTest.patientLabTestsId || labTest.patientLabTestId || labTest.id;
                          const patientName = labTest.patientName || (labTest as any).PatientName || (labTest as any).patient_name;
                          const testName = labTest.testName || labTest.labTestName || (labTest as any).TestName;
                          const patientType = labTest.patientType || (labTest as any).PatientType || (labTest as any).patient_type;
                          const labTestId = labTest.labTestId || (labTest as any).LabTestId || (labTest as any).lab_test_id;
                          const createdBy = labTest.createdBy || (labTest as any).CreatedBy || (labTest as any).created_by;
                          const createdDate = labTest.createdDate || (labTest as any).CreatedDate || (labTest as any).created_date || (labTest as any).createdAt;
                          
                          return (
                            <tr key={patientLabTestsId || index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-900">{patientName || 'N/A'}</td>
                              <td className="py-3 px-4 text-gray-900">{testName || 'N/A'}</td>
                              <td className="py-3 px-4">
                                <Badge variant="outline">{patientType || 'N/A'}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={
                                labTest.priority?.toLowerCase() === 'urgent' || labTest.priority?.toLowerCase() === 'high' ? 'destructive' :
                                labTest.priority?.toLowerCase() === 'normal' || labTest.priority?.toLowerCase() === 'medium' ? 'default' :
                                'outline'
                              }>
                                {labTest.priority || 'N/A'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={
                                labTest.labTestDone === true || String(labTest.labTestDone).toLowerCase() === 'true' || String(labTest.labTestDone).toLowerCase() === 'yes' ? 'default' :
                                'outline'
                              }>
                                {labTest.labTestDone === true || String(labTest.labTestDone).toLowerCase() === 'true' || String(labTest.labTestDone).toLowerCase() === 'yes' ? 'Yes' : 
                                 labTest.labTestDone === false || String(labTest.labTestDone).toLowerCase() === 'false' || String(labTest.labTestDone).toLowerCase() === 'no' ? 'No' : 'N/A'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {labTest.reportsUrl ? (
                                <a href={labTest.reportsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  View Report
                                </a>
                              ) : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={
                                labTest.testStatus?.toLowerCase() === 'completed' || labTest.testStatus?.toLowerCase() === 'done' ? 'default' :
                                labTest.testStatus?.toLowerCase() === 'pending' || labTest.testStatus?.toLowerCase() === 'in progress' ? 'outline' :
                                'outline'
                              }>
                                {labTest.testStatus || labTest.status || 'N/A'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{labTest.testDoneDateTime || 'N/A'}</td>
                              <td className="py-3 px-4">
                                <Badge variant={
                                  labTest.status?.toLowerCase() === 'active' || labTest.status?.toLowerCase() === 'completed' ? 'default' :
                                  labTest.status?.toLowerCase() === 'pending' || labTest.status?.toLowerCase() === 'in progress' ? 'outline' :
                                  'outline'
                                }>
                                  {labTest.status || 'N/A'}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {createdDate ? (typeof createdDate === 'string' ? new Date(createdDate).toLocaleString() : String(createdDate)) : 'N/A'}
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEditIPDLabTestDialog(labTest)}
                                  className="gap-1"
                                >
                                  <Edit className="size-3" />
                                  View & Edit
                                </Button>
                              </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doctor-visits" className="mt-4">
            <Card className="dashboard-table-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                <CardTitle>Patient's Doctor Visits</CardTitle>
                  <Button
                    onClick={handleOpenAddDoctorVisitDialog}
                    className="gap-2"
                  >
                    <Plus className="size-4" />
                    Add New Doctor Visit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="dashboard-table-card-content">
                {doctorVisitsLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500">Loading doctor visits...</p>
                  </div>
                )}
                
                {doctorVisitsError && (
                  <div className="text-center py-8">
                    <p className="text-red-600">{doctorVisitsError}</p>
                  </div>
                )}
                
                {!doctorVisitsLoading && !doctorVisitsError && patientDoctorVisits.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No Doctor visits found for this admission.
                  </div>
                )}
                
                {!doctorVisitsLoading && !doctorVisitsError && patientDoctorVisits.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Doctor Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Doctor Visited DateTime</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Visits Remarks</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Patient Condition</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientDoctorVisits.map((visit, index) => (
                          <tr key={visit.patientDoctorVisitId || visit.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-900 font-medium">{visit.doctorName || 'N/A'}</td>
                            <td className="py-3 px-4 text-gray-600">
                              {visit.doctorVisitedDateTime ? new Date(visit.doctorVisitedDateTime).toLocaleString() : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-gray-600">{visit.visitsRemarks || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <Badge variant={
                                visit.patientCondition?.toLowerCase() === 'stable' || visit.patientCondition?.toLowerCase() === 'good' ? 'default' :
                                visit.patientCondition?.toLowerCase() === 'critical' || visit.patientCondition?.toLowerCase() === 'serious' ? 'destructive' :
                                'outline'
                              }>
                                {visit.patientCondition || 'N/A'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={
                                visit.status?.toLowerCase() === 'active' ? 'default' :
                                visit.status?.toLowerCase() === 'completed' ? 'default' :
                                'outline'
                              }>
                                {visit.status || 'N/A'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEditDoctorVisitDialog(visit)}
                                  className="gap-1"
                                >
                                  <Edit className="size-3" />
                                  View & Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEditDoctorVisitDialog(visit)}
                                  className="gap-1"
                                >
                                  <Settings className="size-3" />
                                  Manage
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nurse-visits" className="mt-4">
            <Card className="dashboard-table-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Patient's Nurse Visits and Vitals</CardTitle>
                  <Button
                    onClick={handleOpenAddVisitVitalsDialog}
                    className="gap-2"
                  >
                    <Plus className="size-4" />
                    Add Visit Vitals
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="dashboard-table-card-content">
                {visitVitalsLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500">Loading visit vitals...</p>
                  </div>
                )}
                
                {visitVitalsError && (
                  <div className="text-center py-8">
                    <p className="text-red-600">{visitVitalsError}</p>
                  </div>
                )}
                
                {!visitVitalsLoading && !visitVitalsError && patientAdmitVisitVitals.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No visit vitals found for this admission.
                  </div>
                )}
                
                {!visitVitalsLoading && !visitVitalsError && patientAdmitVisitVitals.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">PatientStatus</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Nurse Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">RecordedDateTime</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">DailyOrHourlyVitals</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">HeartRate</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">BloodPressure</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Temperature</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">O2Saturation</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">RespiratoryRate</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">PulseRate</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">VitalsStatus</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">VitalsRemarks</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">VitalsCreatedAt</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientAdmitVisitVitals.map((vital, index) => (
                          <tr key={vital.patientAdmitVisitVitalsId || vital.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <Badge variant={
                                vital.patientStatus?.toLowerCase() === 'stable' || vital.patientStatus?.toLowerCase() === 'good' ? 'default' :
                                vital.patientStatus?.toLowerCase() === 'notstable' || vital.patientStatus?.toLowerCase() === 'critical' || vital.patientStatus?.toLowerCase() === 'serious' ? 'destructive' :
                                'outline'
                              }>
                                {vital.patientStatus || 'N/A'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-600 font-medium">
                              {vital.nurseName || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {vital.recordedDateTime ? new Date(vital.recordedDateTime).toLocaleString() : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{vital.dailyOrHourlyVitals || 'N/A'}</Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{vital.heartRate || 'N/A'}</td>
                            <td className="py-3 px-4 text-gray-600">{vital.bloodPressure || 'N/A'}</td>
                            <td className="py-3 px-4 text-gray-600">{vital.temperature || 'N/A'}</td>
                            <td className="py-3 px-4 text-gray-600">{vital.o2Saturation || 'N/A'}</td>
                            <td className="py-3 px-4 text-gray-600">{vital.respiratoryRate || 'N/A'}</td>
                            <td className="py-3 px-4 text-gray-600">{vital.pulseRate || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <Badge variant={
                                vital.vitalsStatus?.toLowerCase() === 'normal' || vital.vitalsStatus?.toLowerCase() === 'stable' || vital.vitalsStatus?.toLowerCase() === 'improving' ? 'default' :
                                vital.vitalsStatus?.toLowerCase() === 'critical' ? 'destructive' :
                                'outline'
                              }>
                                {vital.vitalsStatus || 'N/A'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{vital.vitalsRemarks || 'N/A'}</td>
                            <td className="py-3 px-4 text-gray-600">
                              {vital.vitalsCreatedAt ? (typeof vital.vitalsCreatedAt === 'string' ? new Date(vital.vitalsCreatedAt).toLocaleString() : String(vital.vitalsCreatedAt)) : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={
                                vital.status?.toLowerCase() === 'active' ? 'default' :
                                'outline'
                              }>
                                {vital.status || 'N/A'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditVisitVitalsDialog(vital)}
                                className="gap-1"
                              >
                                <Edit className="size-3" />
                                View & Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit IPD Lab Test Dialog */}
      <Dialog open={isAddIPDLabTestDialogOpen || isEditIPDLabTestDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddIPDLabTestDialogOpen(false);
          setIsEditIPDLabTestDialogOpen(false);
          setEditingLabTestId(null);
        }
      }}>
        <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]">
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
            <DialogTitle>{editingLabTestId ? 'Edit IPD Lab Test' : 'Add New IPD Lab Test'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
            <div className="space-y-4 py-4">
              {ipdLabTestSubmitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {ipdLabTestSubmitError}
    </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ipdLabTestRoomAdmissionId">Room Admission ID</Label>
                  <Input
                    id="ipdLabTestRoomAdmissionId"
                    value={ipdLabTestFormData.roomAdmissionId}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="ipdLabTestPatientId">Patient ID</Label>
                  <Input
                    id="ipdLabTestPatientId"
                    value={admission?.patientId || ipdLabTestFormData.patientId || ''}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="ipdLabTestPatientNo">Patient No</Label>
                  <Input
                    id="ipdLabTestPatientNo"
                    value={admission?.patientNo || 'N/A'}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="ipdLabTestId">Lab Test *</Label>
                  <Input
                    id="ipdLabTestId"
                    value={labTestSearchTerm}
                    onChange={(e) => {
                      setLabTestSearchTerm(e.target.value);
                      setShowLabTestList(true);
                    }}
                    onFocus={() => setShowLabTestList(true)}
                    placeholder="Search by Display Test ID, name, or category..."
                    className="cursor-pointer"
                  />
                  {showLabTestList && (
                    <div className="mt-1 border border-gray-200 rounded-md max-h-48 overflow-y-auto bg-white z-50 relative">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left py-2 px-3 text-gray-700 font-semibold">Display Test ID</th>
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
                              const displayTestId = (test.displayTestId || test.DisplayTestId || test.displayTestID || test.DisplayTestID || '').toLowerCase();
                              const name = (test.testName || test.TestName || '').toLowerCase();
                              const category = (test.testCategory || test.TestCategory || '').toLowerCase();
                              return displayTestId.includes(searchLower) || name.includes(searchLower) || category.includes(searchLower);
                            })
                            .map((test) => {
                              const testId = String(test.labTestId || test.LabTestId || test.id || '');
                              const displayTestId = test.displayTestId || test.DisplayTestId || test.displayTestID || test.DisplayTestID || '';
                              const testName = test.testName || test.TestName || 'Unknown';
                              const category = test.testCategory || test.TestCategory || 'N/A';
                              const displayText = `${displayTestId}, ${testName} (${category})`;
                              const isSelected = ipdLabTestFormData.labTestId === testId;
                              return (
                                <tr
                                  key={test.labTestId || test.id}
                                  onClick={() => {
                                    setIpdLabTestFormData({ ...ipdLabTestFormData, labTestId: testId });
                                    setLabTestSearchTerm(displayText);
                                    setShowLabTestList(false);
                                  }}
                                  className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''}`}
                                >
                                  <td className="py-2 px-3 text-sm text-gray-900 font-mono">{displayTestId || '-'}</td>
                                  <td className="py-2 px-3 text-sm text-gray-600">{testName}</td>
                                  <td className="py-2 px-3 text-sm text-gray-600">{category}</td>
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
                  <Label htmlFor="ipdPriority">Priority *</Label>
                  <select
                    id="ipdPriority"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={ipdLabTestFormData.priority}
                    onChange={(e) => setIpdLabTestFormData({ ...ipdLabTestFormData, priority: e.target.value })}
                    required
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="ipdOrderedDate">Ordered Date *</Label>
                  <Input
                    id="ipdOrderedDate"
                    type="date"
                    value={ipdLabTestFormData.orderedDate}
                    onChange={(e) => setIpdLabTestFormData({ ...ipdLabTestFormData, orderedDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ipdOrderedByDoctorId">Ordered By Doctor *</Label>
                  <div className="relative">
                    <Input
                      id="ipdOrderedByDoctorId"
                      placeholder="Search doctor by name..."
                      value={ipdLabTestDoctorSearchTerm}
                      onChange={(e) => {
                        setIpdLabTestDoctorSearchTerm(e.target.value);
                        setShowIpdLabTestDoctorList(true);
                      }}
                      onFocus={() => setShowIpdLabTestDoctorList(true)}
                    />
                    {showIpdLabTestDoctorList && availableDoctors.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="py-2 px-3 text-left text-xs font-medium text-gray-700">Doctor Name</th>
                              <th className="py-2 px-3 text-left text-xs font-medium text-gray-700">Specialization</th>
                            </tr>
                          </thead>
                          <tbody>
                            {availableDoctors.filter((doctor: any) => {
                              if (!ipdLabTestDoctorSearchTerm) return true;
                              const searchLower = ipdLabTestDoctorSearchTerm.toLowerCase();
                              const doctorName = doctor.name || doctor.Name || doctor.doctorName || doctor.DoctorName || '';
                              const specialization = doctor.specialization || doctor.Specialization || doctor.speciality || doctor.Speciality || '';
                              return (
                                doctorName.toLowerCase().includes(searchLower) ||
                                specialization.toLowerCase().includes(searchLower)
                              );
                            }).map((doctor: any) => {
                              const doctorId = doctor.id || doctor.Id || doctor.doctorId || doctor.DoctorId || '';
                              const doctorName = doctor.name || doctor.Name || doctor.doctorName || doctor.DoctorName || '';
                              const specialization = doctor.specialization || doctor.Specialization || doctor.speciality || doctor.Speciality || '';
                              const isSelected = ipdLabTestFormData.orderedByDoctorId === String(doctorId);
                              return (
                                <tr
                                  key={doctorId}
                                  onClick={() => {
                                    setIpdLabTestFormData({ ...ipdLabTestFormData, orderedByDoctorId: String(doctorId) });
                                    setIpdLabTestDoctorSearchTerm(doctorName);
                                    setShowIpdLabTestDoctorList(false);
                                  }}
                                  className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''}`}
                                >
                                  <td className="py-2 px-3 text-sm text-gray-900">{doctorName}</td>
                                  <td className="py-2 px-3 text-sm text-gray-600">{specialization || '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
                {ipdLabTestFormData.patientType === 'OPD' && (
                  <div>
                    <Label htmlFor="ipdAppointmentId">Appointment ID</Label>
                    <Input
                      id="ipdAppointmentId"
                      value={ipdLabTestFormData.appointmentId}
                      onChange={(e) => setIpdLabTestFormData({ ...ipdLabTestFormData, appointmentId: e.target.value })}
                      placeholder="Enter Appointment ID (optional)"
                    />
                  </div>
                )}
                {ipdLabTestFormData.patientType === 'Emergency' && (
                  <div>
                    <Label htmlFor="ipdEmergencyBedSlotId">Emergency Bed Slot ID</Label>
                    <Input
                      id="ipdEmergencyBedSlotId"
                      value={ipdLabTestFormData.emergencyBedSlotId}
                      onChange={(e) => setIpdLabTestFormData({ ...ipdLabTestFormData, emergencyBedSlotId: e.target.value })}
                      placeholder="Enter Emergency Bed Slot ID (optional)"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="ipdLabTestDone">Lab Test Done *</Label>
                  <select
                    id="ipdLabTestDone"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={ipdLabTestFormData.labTestDone}
                    onChange={(e) => setIpdLabTestFormData({ ...ipdLabTestFormData, labTestDone: e.target.value })}
                    required
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="ipdTestStatus">Test Status *</Label>
                  <select
                    id="ipdTestStatus"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={ipdLabTestFormData.testStatus}
                    onChange={(e) => setIpdLabTestFormData({ ...ipdLabTestFormData, testStatus: e.target.value })}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="InProgress">InProgress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="ipdReportsUrl">Reports URL</Label>
                  <Input
                    id="ipdReportsUrl"
                    value={ipdLabTestFormData.reportsUrl}
                    onChange={(e) => setIpdLabTestFormData({ ...ipdLabTestFormData, reportsUrl: e.target.value })}
                    placeholder="Enter reports URL (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="ipdTestDoneDateTime">Test Done Date & Time</Label>
                  <Input
                    id="ipdTestDoneDateTime"
                    type="datetime-local"
                    value={ipdLabTestFormData.testDoneDateTime}
                    onChange={(e) => setIpdLabTestFormData({ ...ipdLabTestFormData, testDoneDateTime: e.target.value })}
                    placeholder="Enter test done date and time"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 pb-4 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddIPDLabTestDialogOpen(false);
                setIsEditIPDLabTestDialogOpen(false);
                setEditingLabTestId(null);
                setIpdLabTestSubmitError(null);
              }}
              disabled={ipdLabTestSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveIPDLabTest}
              disabled={ipdLabTestSubmitting}
            >
              {ipdLabTestSubmitting 
                ? (editingLabTestId ? 'Updating...' : 'Saving...') 
                : (editingLabTestId ? "Update Patient's Lab test" : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View IPD Lab Test Dialog */}
      <Dialog open={isViewIPDLabTestDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsViewIPDLabTestDialogOpen(false);
          setViewingLabTest(null);
        }
      }}>
        <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]">
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
            <DialogTitle>View IPD Lab Test Details</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
            {viewingLabTest && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Patient Lab Tests ID</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingLabTest.patientLabTestsId || viewingLabTest.patientLabTestId || viewingLabTest.id || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Patient ID</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingLabTest.patientId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Patient Name</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingLabTest.patientName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Test Name</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingLabTest.testName || viewingLabTest.labTestName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Patient Type</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      <Badge variant="outline">{viewingLabTest.patientType || 'N/A'}</Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Lab Test ID</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingLabTest.labTestId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Room Admission ID</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingLabTest.roomAdmissionId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Emergency Bed Slot ID</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingLabTest.emergencyBedSlotId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Bill ID</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingLabTest.billId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Priority</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      <Badge variant={
                        viewingLabTest.priority?.toLowerCase() === 'urgent' || viewingLabTest.priority?.toLowerCase() === 'high' ? 'destructive' :
                        viewingLabTest.priority?.toLowerCase() === 'normal' || viewingLabTest.priority?.toLowerCase() === 'medium' ? 'default' :
                        'outline'
                      }>
                        {viewingLabTest.priority || 'N/A'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Lab Test Done</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      <Badge variant={
                        viewingLabTest.labTestDone === true || String(viewingLabTest.labTestDone).toLowerCase() === 'true' || String(viewingLabTest.labTestDone).toLowerCase() === 'yes' ? 'default' :
                        'outline'
                      }>
                        {viewingLabTest.labTestDone === true || String(viewingLabTest.labTestDone).toLowerCase() === 'true' || String(viewingLabTest.labTestDone).toLowerCase() === 'yes' ? 'Yes' : 
                         viewingLabTest.labTestDone === false || String(viewingLabTest.labTestDone).toLowerCase() === 'false' || String(viewingLabTest.labTestDone).toLowerCase() === 'no' ? 'No' : 'N/A'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Test Status</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      <Badge variant={
                        viewingLabTest.testStatus?.toLowerCase() === 'completed' || viewingLabTest.testStatus?.toLowerCase() === 'done' ? 'default' :
                        viewingLabTest.testStatus?.toLowerCase() === 'pending' || viewingLabTest.testStatus?.toLowerCase() === 'in progress' ? 'outline' :
                        'outline'
                      }>
                        {viewingLabTest.testStatus || viewingLabTest.status || 'N/A'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Status</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      <Badge variant={
                        viewingLabTest.status?.toLowerCase() === 'active' || viewingLabTest.status?.toLowerCase() === 'completed' ? 'default' :
                        viewingLabTest.status?.toLowerCase() === 'pending' || viewingLabTest.status?.toLowerCase() === 'in progress' ? 'outline' :
                        'outline'
                      }>
                        {viewingLabTest.status || 'N/A'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Ordered Date</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingLabTest.orderedDate ? new Date(viewingLabTest.orderedDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Ordered By</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingLabTest.orderedBy || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Test Done Date & Time</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingLabTest.testDoneDateTime ? new Date(viewingLabTest.testDoneDateTime).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Charges</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingLabTest.charges ? `₹${viewingLabTest.charges}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Created By</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingLabTest.createdBy || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Created Date</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingLabTest.createdDate ? (typeof viewingLabTest.createdDate === 'string' ? new Date(viewingLabTest.createdDate).toLocaleString() : String(viewingLabTest.createdDate)) : 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm text-gray-500">Reports URL</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingLabTest.reportsUrl ? (
                        <a href={viewingLabTest.reportsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {viewingLabTest.reportsUrl}
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>
                  {viewingLabTest.description && (
                    <div className="col-span-2">
                      <Label className="text-sm text-gray-500">Description</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md border border-gray-200">
                        <p className="text-gray-900 whitespace-pre-wrap">{viewingLabTest.description}</p>
                      </div>
                    </div>
                  )}
                  {(viewingLabTest as any).appointmentId && (
                    <div>
                      <Label className="text-sm text-gray-500">Appointment ID</Label>
                      <p className="text-gray-900 font-medium mt-1">
                        {(viewingLabTest as any).appointmentId || 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-3 flex-shrink-0 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsViewIPDLabTestDialogOpen(false);
                setViewingLabTest(null);
              }}
            >
              Close
            </Button>
            {viewingLabTest && (
              <Button
                onClick={() => {
                  setIsViewIPDLabTestDialogOpen(false);
                  handleOpenEditIPDLabTestDialog(viewingLabTest);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Doctor Visit Dialog */}
      <Dialog open={isAddDoctorVisitDialogOpen || isEditDoctorVisitDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDoctorVisitDialogOpen(false);
          setIsEditDoctorVisitDialogOpen(false);
          setEditingDoctorVisitId(null);
        }
      }}>
        <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]">
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
            <DialogTitle>{editingDoctorVisitId ? 'Edit Doctor Visit' : 'Add New Doctor Visit'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
            <div className="space-y-4 py-4">
              {doctorVisitSubmitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {doctorVisitSubmitError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="doctorVisitPatientId">Patient ID *</Label>
                  <Input
                    id="doctorVisitPatientId"
                    value={doctorVisitFormData.patientId}
                    onChange={(e) => setDoctorVisitFormData({ ...doctorVisitFormData, patientId: e.target.value })}
                    placeholder="Enter Patient ID"
                    required
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="doctorVisitDoctorId">Doctor *</Label>
                  <Input
                    id="doctorVisitDoctorId"
                    value={doctorSearchTerm}
                    onChange={(e) => {
                      setDoctorSearchTerm(e.target.value);
                      setShowDoctorList(true);
                    }}
                    onFocus={() => setShowDoctorList(true)}
                    placeholder="Search and select doctor..."
                    className="cursor-pointer"
                    required
                  />
                  {showDoctorList && (
                    <div className="mt-1 border border-gray-200 rounded-md max-h-48 overflow-y-auto bg-white z-50 relative">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left py-2 px-3 text-gray-700 font-semibold">Doctor ID</th>
                            <th className="text-left py-2 px-3 text-gray-700 font-semibold">Name</th>
                            <th className="text-left py-2 px-3 text-gray-700 font-semibold">Specialty</th>
                            <th className="text-left py-2 px-3 text-gray-700 font-semibold">Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableDoctors
                            .filter((doctor) => {
                              if (!doctorSearchTerm) return true;
                              const searchLower = doctorSearchTerm.toLowerCase();
                              const name = (doctor.name || '').toLowerCase();
                              const id = String(doctor.id || '').toLowerCase();
                              const specialty = (doctor.specialty || '').toLowerCase();
                              return name.includes(searchLower) || id.includes(searchLower) || specialty.includes(searchLower);
                            })
                            .map((doctor) => {
                              const doctorId = String(doctor.id || '');
                              const isSelected = doctorVisitFormData.doctorId === doctorId;
                              return (
                                <tr
                                  key={doctor.id}
                                  onClick={() => {
                                    setDoctorVisitFormData({ ...doctorVisitFormData, doctorId: doctorId });
                                    setDoctorSearchTerm(`${doctor.name || 'Unknown'} (${doctor.specialty || 'N/A'})`);
                                    setShowDoctorList(false);
                                  }}
                                  className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''}`}
                                >
                                  <td className="py-2 px-3 text-sm text-gray-900 font-mono">{doctor.id}</td>
                                  <td className="py-2 px-3 text-sm text-gray-600">{doctor.name || 'Unknown'}</td>
                                  <td className="py-2 px-3 text-sm text-gray-600">{doctor.specialty || 'N/A'}</td>
                                  <td className="py-2 px-3 text-sm text-gray-600">{doctor.type || 'N/A'}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                      {availableDoctors.filter((doctor) => {
                        if (!doctorSearchTerm) return true;
                        const searchLower = doctorSearchTerm.toLowerCase();
                        const name = (doctor.name || '').toLowerCase();
                        const id = String(doctor.id || '').toLowerCase();
                        const specialty = (doctor.specialty || '').toLowerCase();
                        return name.includes(searchLower) || id.includes(searchLower) || specialty.includes(searchLower);
                      }).length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">No doctors found</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="doctorVisitDateTime">Doctor Visited Date & Time *</Label>
                  <Input
                    id="doctorVisitDateTime"
                    type="datetime-local"
                    value={doctorVisitFormData.doctorVisitedDateTime}
                    onChange={(e) => setDoctorVisitFormData({ ...doctorVisitFormData, doctorVisitedDateTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="doctorVisitStatus">Status *</Label>
                  <select
                    id="doctorVisitStatus"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={doctorVisitFormData.status}
                    onChange={(e) => setDoctorVisitFormData({ ...doctorVisitFormData, status: e.target.value })}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="doctorVisitPatientCondition">Patient Condition</Label>
                  <Input
                    id="doctorVisitPatientCondition"
                    value={doctorVisitFormData.patientCondition}
                    onChange={(e) => setDoctorVisitFormData({ ...doctorVisitFormData, patientCondition: e.target.value })}
                    placeholder="Enter patient condition (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="doctorVisitCreatedAt">Visit Created At</Label>
                  <Input
                    id="doctorVisitCreatedAt"
                    type="datetime-local"
                    value={doctorVisitFormData.visitCreatedAt ? new Date(doctorVisitFormData.visitCreatedAt).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setDoctorVisitFormData({ ...doctorVisitFormData, visitCreatedAt: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                    placeholder="Enter creation date (optional)"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="doctorVisitRemarks">Visits Remarks</Label>
                  <Textarea
                    id="doctorVisitRemarks"
                    value={doctorVisitFormData.visitsRemarks}
                    onChange={(e) => setDoctorVisitFormData({ ...doctorVisitFormData, visitsRemarks: e.target.value })}
                    placeholder="Enter visit remarks (optional)"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 py-3 flex-shrink-0 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDoctorVisitDialogOpen(false);
                setIsEditDoctorVisitDialogOpen(false);
                setEditingDoctorVisitId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDoctorVisit}
              disabled={doctorVisitSubmitting}
            >
              {doctorVisitSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Doctor Visit Dialog */}
      <Dialog open={isViewDoctorVisitDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsViewDoctorVisitDialogOpen(false);
          setViewingDoctorVisit(null);
        }
      }}>
        <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]">
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
            <DialogTitle>View Doctor Visit Details</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
            {viewingDoctorVisit && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Patient ID</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingDoctorVisit.patientId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Doctor ID</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingDoctorVisit.doctorId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Doctor Name</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingDoctorVisit.doctorName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Doctor Visited Date & Time</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingDoctorVisit.doctorVisitedDateTime ? new Date(viewingDoctorVisit.doctorVisitedDateTime).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Patient Condition</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      <Badge variant={
                        viewingDoctorVisit.patientCondition?.toLowerCase() === 'stable' || viewingDoctorVisit.patientCondition?.toLowerCase() === 'good' ? 'default' :
                        viewingDoctorVisit.patientCondition?.toLowerCase() === 'critical' || viewingDoctorVisit.patientCondition?.toLowerCase() === 'serious' ? 'destructive' :
                        'outline'
                      }>
                        {viewingDoctorVisit.patientCondition || 'N/A'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Status</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      <Badge variant={
                        viewingDoctorVisit.status?.toLowerCase() === 'active' ? 'default' :
                        viewingDoctorVisit.status?.toLowerCase() === 'completed' ? 'default' :
                        'outline'
                      }>
                        {viewingDoctorVisit.status || 'N/A'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Visit Created By</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingDoctorVisit.visitCreatedBy || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Visit Created At</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingDoctorVisit.visitCreatedAt ? (typeof viewingDoctorVisit.visitCreatedAt === 'string' ? new Date(viewingDoctorVisit.visitCreatedAt).toLocaleString() : String(viewingDoctorVisit.visitCreatedAt)) : 'N/A'}
                    </p>
                  </div>
                  {viewingDoctorVisit.visitsRemarks && (
                    <div className="col-span-2">
                      <Label className="text-sm text-gray-500">Visits Remarks</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md border border-gray-200">
                        <p className="text-gray-900 whitespace-pre-wrap">{viewingDoctorVisit.visitsRemarks}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-3 flex-shrink-0 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsViewDoctorVisitDialogOpen(false);
                setViewingDoctorVisit(null);
              }}
            >
              Close
            </Button>
            {viewingDoctorVisit && (
              <Button
                onClick={() => {
                  setIsViewDoctorVisitDialogOpen(false);
                  handleOpenEditDoctorVisitDialog(viewingDoctorVisit);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Visit Vitals Dialog */}
      <Dialog open={isAddVisitVitalsDialogOpen || isEditVisitVitalsDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddVisitVitalsDialogOpen(false);
          setIsEditVisitVitalsDialogOpen(false);
          setEditingVisitVitalsId(null);
        }
      }}>
        <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]">
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
            <DialogTitle>{editingVisitVitalsId ? 'Edit Visit Vitals' : 'Add Visit Vitals'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
            <div className="space-y-4 py-4">
              {visitVitalsSubmitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {visitVitalsSubmitError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="visitVitalsPatientId">Patient ID *</Label>
                  <Input
                    id="visitVitalsPatientId"
                    value={visitVitalsFormData.patientId}
                    onChange={(e) => setVisitVitalsFormData({ ...visitVitalsFormData, patientId: e.target.value })}
                    placeholder="Enter Patient ID"
                    required
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="visitVitalsNurseId">Nurse *</Label>
                  <Input
                    id="visitVitalsNurseId"
                    value={nurseSearchTerm}
                    onChange={(e) => {
                      setNurseSearchTerm(e.target.value);
                      setShowNurseList(true);
                    }}
                    onFocus={() => setShowNurseList(true)}
                    placeholder="Search and select nurse..."
                    className="cursor-pointer"
                    required
                  />
                  {showNurseList && (
                    <div className="mt-1 border border-gray-200 rounded-md max-h-48 overflow-y-auto bg-white z-50 relative">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left py-2 px-3 text-gray-700 font-semibold">Nurse ID</th>
                            <th className="text-left py-2 px-3 text-gray-700 font-semibold">Name</th>
                            <th className="text-left py-2 px-3 text-gray-700 font-semibold">Department</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableNurses
                            .filter((nurse) => {
                              if (!nurseSearchTerm) return true;
                              const searchLower = nurseSearchTerm.toLowerCase();
                              const name = (nurse.UserName || nurse.name || '').toLowerCase();
                              const id = String(nurse.UserId || nurse.id || '').toLowerCase();
                              return name.includes(searchLower) || id.includes(searchLower);
                            })
                            .map((nurse) => {
                              const nurseId = String(nurse.UserId || nurse.id || '');
                              const isSelected = visitVitalsFormData.nurseId === nurseId;
                              return (
                                <tr
                                  key={nurse.UserId || nurse.id}
                                  onClick={() => {
                                    setVisitVitalsFormData({ ...visitVitalsFormData, nurseId: nurseId });
                                    setNurseSearchTerm(nurse.UserName || nurse.name || 'Unknown');
                                    setShowNurseList(false);
                                  }}
                                  className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''}`}
                                >
                                  <td className="py-2 px-3 text-sm text-gray-900 font-mono">{nurse.UserId || nurse.id}</td>
                                  <td className="py-2 px-3 text-sm text-gray-600">{nurse.UserName || nurse.name || 'Unknown'}</td>
                                  <td className="py-2 px-3 text-sm text-gray-600">{nurse.DepartmentName || nurse.department || 'N/A'}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                      {availableNurses.filter((nurse) => {
                        if (!nurseSearchTerm) return true;
                        const searchLower = nurseSearchTerm.toLowerCase();
                        const name = (nurse.UserName || nurse.name || '').toLowerCase();
                        const id = String(nurse.UserId || nurse.id || '').toLowerCase();
                        return name.includes(searchLower) || id.includes(searchLower);
                      }).length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">No nurses found</div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="visitVitalsRecordedDateTime">Recorded Date & Time *</Label>
                  <Input
                    id="visitVitalsRecordedDateTime"
                    type="datetime-local"
                    value={visitVitalsFormData.recordedDateTime}
                    onChange={(e) => setVisitVitalsFormData({ ...visitVitalsFormData, recordedDateTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="visitVitalsDailyOrHourlyVitals">Daily/Hourly Vitals *</Label>
                  <select
                    id="visitVitalsDailyOrHourlyVitals"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={visitVitalsFormData.dailyOrHourlyVitals}
                    onChange={(e) => setVisitVitalsFormData({ ...visitVitalsFormData, dailyOrHourlyVitals: e.target.value })}
                    required
                  >
                    <option value="Daily">Daily</option>
                    <option value="Hourly">Hourly</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="visitVitalsPatientStatus">Patient Status *</Label>
                  <select
                    id="visitVitalsPatientStatus"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={visitVitalsFormData.patientStatus}
                    onChange={(e) => setVisitVitalsFormData({ ...visitVitalsFormData, patientStatus: e.target.value })}
                    required
                  >
                    <option value="Stable">Stable</option>
                    <option value="Notstable">Notstable</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="visitVitalsHeartRate">Heart Rate</Label>
                  <Input
                    id="visitVitalsHeartRate"
                    type="number"
                    value={visitVitalsFormData.heartRate}
                    onChange={(e) => setVisitVitalsFormData({ ...visitVitalsFormData, heartRate: e.target.value })}
                    placeholder="Enter heart rate (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="visitVitalsBloodPressure">Blood Pressure</Label>
                  <Input
                    id="visitVitalsBloodPressure"
                    value={visitVitalsFormData.bloodPressure}
                    onChange={(e) => setVisitVitalsFormData({ ...visitVitalsFormData, bloodPressure: e.target.value })}
                    placeholder="e.g., 120/80 (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="visitVitalsTemperature">Temperature</Label>
                  <Input
                    id="visitVitalsTemperature"
                    type="number"
                    step="0.1"
                    value={visitVitalsFormData.temperature}
                    onChange={(e) => setVisitVitalsFormData({ ...visitVitalsFormData, temperature: e.target.value })}
                    placeholder="Enter temperature (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="visitVitalsO2Saturation">O2 Saturation</Label>
                  <Input
                    id="visitVitalsO2Saturation"
                    type="number"
                    value={visitVitalsFormData.o2Saturation}
                    onChange={(e) => setVisitVitalsFormData({ ...visitVitalsFormData, o2Saturation: e.target.value })}
                    placeholder="Enter O2 saturation (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="visitVitalsRespiratoryRate">Respiratory Rate</Label>
                  <Input
                    id="visitVitalsRespiratoryRate"
                    type="number"
                    value={visitVitalsFormData.respiratoryRate}
                    onChange={(e) => setVisitVitalsFormData({ ...visitVitalsFormData, respiratoryRate: e.target.value })}
                    placeholder="Enter respiratory rate (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="visitVitalsPulseRate">Pulse Rate</Label>
                  <Input
                    id="visitVitalsPulseRate"
                    type="number"
                    value={visitVitalsFormData.pulseRate}
                    onChange={(e) => setVisitVitalsFormData({ ...visitVitalsFormData, pulseRate: e.target.value })}
                    placeholder="Enter pulse rate (optional)"
                  />
                </div>
                <div>
                  <Label htmlFor="visitVitalsVitalsStatus">Vitals Status</Label>
                  <select
                    id="visitVitalsVitalsStatus"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={visitVitalsFormData.vitalsStatus}
                    onChange={(e) => setVisitVitalsFormData({ ...visitVitalsFormData, vitalsStatus: e.target.value })}
                    required
                  >
                    <option value="">Select Vitals Status</option>
                    <option value="Stable">Stable</option>
                    <option value="Critical">Critical</option>
                    <option value="Improving">Improving</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="visitVitalsVitalsRemarks">Vitals Remarks</Label>
                  <Textarea
                    id="visitVitalsVitalsRemarks"
                    value={visitVitalsFormData.vitalsRemarks}
                    onChange={(e) => setVisitVitalsFormData({ ...visitVitalsFormData, vitalsRemarks: e.target.value })}
                    placeholder="Enter vitals remarks (optional)"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 py-3 flex-shrink-0 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddVisitVitalsDialogOpen(false);
                setIsEditVisitVitalsDialogOpen(false);
                setEditingVisitVitalsId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveVisitVitals}
              disabled={visitVitalsSubmitting}
            >
              {visitVitalsSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Visit Vitals Dialog */}
      <Dialog open={isViewVisitVitalsDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsViewVisitVitalsDialogOpen(false);
          setViewingVisitVitals(null);
        }
      }}>
        <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]">
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
            <DialogTitle>View Visit Vitals Details</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
            {viewingVisitVitals && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Patient Admit Visit Vitals ID</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingVisitVitals.patientAdmitVisitVitalsId || viewingVisitVitals.id || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Room Admission ID</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingVisitVitals.roomAdmissionId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Patient ID</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingVisitVitals.patientId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Nurse ID</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingVisitVitals.nurseId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Patient Status</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      <Badge variant={
                        viewingVisitVitals.patientStatus?.toLowerCase() === 'stable' || viewingVisitVitals.patientStatus?.toLowerCase() === 'good' ? 'default' :
                        viewingVisitVitals.patientStatus?.toLowerCase() === 'notstable' || viewingVisitVitals.patientStatus?.toLowerCase() === 'critical' || viewingVisitVitals.patientStatus?.toLowerCase() === 'serious' ? 'destructive' :
                        'outline'
                      }>
                        {viewingVisitVitals.patientStatus || 'N/A'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Recorded Date & Time</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingVisitVitals.recordedDateTime ? new Date(viewingVisitVitals.recordedDateTime).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Daily/Hourly Vitals</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      <Badge variant="outline">{viewingVisitVitals.dailyOrHourlyVitals || 'N/A'}</Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Heart Rate</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingVisitVitals.heartRate || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Blood Pressure</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingVisitVitals.bloodPressure || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Temperature</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingVisitVitals.temperature || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">O2 Saturation</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingVisitVitals.o2Saturation || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Respiratory Rate</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingVisitVitals.respiratoryRate || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Pulse Rate</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingVisitVitals.pulseRate || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Vitals Status</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      <Badge variant={
                        viewingVisitVitals.vitalsStatus?.toLowerCase() === 'normal' || viewingVisitVitals.vitalsStatus?.toLowerCase() === 'stable' || viewingVisitVitals.vitalsStatus?.toLowerCase() === 'improving' ? 'default' :
                        viewingVisitVitals.vitalsStatus?.toLowerCase() === 'critical' ? 'destructive' :
                        'outline'
                      }>
                        {viewingVisitVitals.vitalsStatus || 'N/A'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Status</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      <Badge variant={
                        viewingVisitVitals.status?.toLowerCase() === 'active' ? 'default' :
                        'outline'
                      }>
                        {viewingVisitVitals.status || 'N/A'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Vitals Created By</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingVisitVitals.vitalsCreatedBy || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Vitals Created At</Label>
                    <p className="text-gray-900 font-medium mt-1">
                      {viewingVisitVitals.vitalsCreatedAt ? (typeof viewingVisitVitals.vitalsCreatedAt === 'string' ? new Date(viewingVisitVitals.vitalsCreatedAt).toLocaleString() : String(viewingVisitVitals.vitalsCreatedAt)) : 'N/A'}
                    </p>
                  </div>
                  {viewingVisitVitals.visitRemarks && (
                    <div className="col-span-2">
                      <Label className="text-sm text-gray-500">Visit Remarks</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md border border-gray-200">
                        <p className="text-gray-900 whitespace-pre-wrap">{viewingVisitVitals.visitRemarks}</p>
                      </div>
                    </div>
                  )}
                  {viewingVisitVitals.vitalsRemarks && (
                    <div className="col-span-2">
                      <Label className="text-sm text-gray-500">Vitals Remarks</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md border border-gray-200">
                        <p className="text-gray-900 whitespace-pre-wrap">{viewingVisitVitals.vitalsRemarks}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-3 flex-shrink-0 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsViewVisitVitalsDialogOpen(false);
                setViewingVisitVitals(null);
              }}
            >
              Close
            </Button>
            {viewingVisitVitals && (
              <Button
                onClick={() => {
                  setIsViewVisitVitalsDialogOpen(false);
                  handleOpenEditVisitVitalsDialog(viewingVisitVitals);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
