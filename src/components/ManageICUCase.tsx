import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FlaskConical, Stethoscope, Heart, ArrowLeft, Activity, FileText, Plus, Eye, Edit } from 'lucide-react';
import { admissionsApi } from '../api/admissions';
import { PatientLabTest, PatientDoctorVisit, PatientNurseVisit } from '../api/admissions';
import { apiRequest } from '../api/base';
import { useStaff } from '../hooks/useStaff';
import { useRoles } from '../hooks/useRoles';
import { labTestsApi } from '../api/labTests';
import { LabTest } from '../types';

interface ICUAdmission {
  id?: number | string;
  patientICUAdmissionId?: number | string; // UUID string
  patientId?: string; // UUID string
  patientName?: string;
  age?: number;
  gender?: string;
  bedNumber?: string;
  admissionDate?: string;
  admissionTime?: string;
  condition?: string;
  severity?: string;
  attendingDoctor?: string;
  diagnosis?: string;
  treatment?: string;
  ventilatorSupport?: boolean;
  vitals?: {
    heartRate?: number;
    bloodPressure?: string;
    temperature?: number;
    oxygenSaturation?: number;
    respiratoryRate?: number;
  };
}

export function ManageICUCase() {
  console.log('========================================');
  console.log('ManageICUCase component rendered/mounted');
  console.log('Current window.location.hash:', window.location.hash);
  console.log('========================================');
  
  const { staff } = useStaff();
  const { roles } = useRoles();
  
  const [icuAdmission, setIcuAdmission] = useState<ICUAdmission | null>(null);
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
  
  // Add/Edit ICU Doctor Visit Dialog State
  const [isAddDoctorVisitDialogOpen, setIsAddDoctorVisitDialogOpen] = useState(false);
  const [editingDoctorVisitId, setEditingDoctorVisitId] = useState<string | number | null>(null);
  const [doctorVisitFormData, setDoctorVisitFormData] = useState({
    icuDoctorVisitId: '',
    icuAdmissionId: '',
    patientId: '',
    doctorId: '',
    doctorVisitedDateTime: '',
    visitsDetails: '',
    patientCondition: '',
    status: ''
  });
  const [doctorVisitSubmitting, setDoctorVisitSubmitting] = useState(false);
  const [doctorVisitSubmitError, setDoctorVisitSubmitError] = useState<string | null>(null);
  
  // Add ICU Nurse Visit Dialog State
  const [isAddNurseVisitDialogOpen, setIsAddNurseVisitDialogOpen] = useState(false);
  const [nurseVisitFormData, setNurseVisitFormData] = useState({
    icuAdmissionId: '',
    patientId: '',
    nurseId: '',
    nurseVisitedDateTime: '',
    nurseVisitsDetails: '',
    patientCondition: ''
  });
  const [nurseVisitSubmitting, setNurseVisitSubmitting] = useState(false);
  const [nurseVisitSubmitError, setNurseVisitSubmitError] = useState<string | null>(null);
  
  // Add ICU Vitals Dialog State
  const [isAddICUVitalsDialogOpen, setIsAddICUVitalsDialogOpen] = useState(false);
  const [icuVitalsFormData, setIcuVitalsFormData] = useState({
    icuVisitVitalsId: '',
    icuAdmissionId: '',
    patientId: '',
    heartRate: '',
    bloodPressure: '',
    temperature: '',
    oxygenSaturation: '',
    respiratoryRate: '',
    bloodSugar: '',
    recordedDateTime: '',
    recordedBy: '',
    dailyOrHourlyVitals: '',
    nurseId: '',
    nurseVisitsDetails: '',
    patientCondition: ''
  });
  const [icuVitalsSubmitting, setIcuVitalsSubmitting] = useState(false);
  const [icuVitalsSubmitError, setIcuVitalsSubmitError] = useState<string | null>(null);
  const [nurseSearchTerm, setNurseSearchTerm] = useState('');
  const [showNurseList, setShowNurseList] = useState(false);
  const [icuVitalsList, setIcuVitalsList] = useState<any[]>([]);
  const [icuVitalsLoading, setIcuVitalsLoading] = useState(false);
  const [icuVitalsError, setIcuVitalsError] = useState<string | null>(null);
  const [editingICUVitalsId, setEditingICUVitalsId] = useState<string | number | null>(null);
  
  // Add Patient Lab Test Dialog State
  const [isAddLabTestDialogOpen, setIsAddLabTestDialogOpen] = useState(false);
  const [editingLabTestId, setEditingLabTestId] = useState<string | number | null>(null);
  const [viewingLabTest, setViewingLabTest] = useState<PatientLabTest | null>(null);
  const [isViewLabTestDialogOpen, setIsViewLabTestDialogOpen] = useState(false);
  const [labTestFormData, setLabTestFormData] = useState({
    icuAdmissionId: '',
    patientId: '',
    labTestId: '',
    priority: 'Normal',
    orderedDate: '',
    orderedBy: '',
    description: '',
    charges: '',
    patientType: '',
    appointmentId: '',
    roomAdmissionId: '',
    emergencyBedSlotId: '',
    labTestDone: 'No',
    reportsUrl: '',
    testStatus: 'Pending',
    testDoneDateTime: ''
  });
  const [labTestSubmitting, setLabTestSubmitting] = useState(false);
  const [labTestSubmitError, setLabTestSubmitError] = useState<string | null>(null);
  const [availableLabTests, setAvailableLabTests] = useState<LabTest[]>([]);
  const [labTestSearchTerm, setLabTestSearchTerm] = useState('');
  const [showLabTestList, setShowLabTestList] = useState(false);
  
  // Filter nurses from staff
  const nurses = useMemo(() => {
    if (!staff || !roles) return [];
    return staff
      .filter((member) => {
        if (!member.RoleId) return false;
        const role = roles.find(r => r.id === member.RoleId);
        if (!role || !role.name) return false;
        return role.name.toLowerCase().includes('nurse');
      })
      .map((member) => ({
        id: member.UserId || 0,
        name: member.UserName || 'Unknown',
      }));
  }, [staff, roles]);

  useEffect(() => {
    // Get patientICUAdmissionId from URL hash parameters (should be a UUID string)
    console.log('========================================');
    console.log('ManageICUCase: useEffect triggered');
    console.log('Component mounted/updated');
    console.log('Current window.location.hash:', window.location.hash);
    console.log('Current window.location.href:', window.location.href);
    
    const hash = window.location.hash.slice(1);
    console.log('Hash after slice(1):', hash);
    
    const params = new URLSearchParams(hash.split('?')[1] || '');
    console.log('URL Parameters:', Object.fromEntries(params.entries()));
    
    const patientICUAdmissionId = params.get('patientICUAdmissionId') || params.get('id');
    console.log('Extracted patientICUAdmissionId:', patientICUAdmissionId);
    console.log('========================================');
    
    if (patientICUAdmissionId) {
      // Pass as string (UUID) - don't convert to number
      console.log('Calling fetchICUAdmissionDetails with ID:', patientICUAdmissionId);
      fetchICUAdmissionDetails(patientICUAdmissionId);
    } else {
      console.error('Patient ICU Admission ID is missing from URL');
      console.error('Hash:', hash);
      console.error('Params:', Object.fromEntries(params.entries()));
      setError('Patient ICU Admission ID is missing from URL');
      setLoading(false);
    }
  }, []);
  
  // Also listen for hash changes in case the component is already mounted
  useEffect(() => {
    const handleHashChange = () => {
      console.log('========================================');
      console.log('ManageICUCase: Hash change detected');
      console.log('New window.location.hash:', window.location.hash);
      
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const patientICUAdmissionId = params.get('patientICUAdmissionId') || params.get('id');
      
      console.log('Extracted patientICUAdmissionId from hash change:', patientICUAdmissionId);
      
      if (patientICUAdmissionId && patientICUAdmissionId !== icuAdmission?.patientICUAdmissionId) {
        console.log('Hash change: Calling fetchICUAdmissionDetails with ID:', patientICUAdmissionId);
        fetchICUAdmissionDetails(patientICUAdmissionId);
      }
      console.log('========================================');
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [icuAdmission?.patientICUAdmissionId]);

  const fetchICUAdmissionDetails = async (patientICUAdmissionId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('========================================');
      console.log('ManageICUCase: fetchICUAdmissionDetails called');
      console.log('Patient ICU Admission ID (UUID):', patientICUAdmissionId);
      console.log('API Endpoint:', `/patient-icu-admissions/icu-management/${patientICUAdmissionId}`);
      console.log('========================================');
      
      let admission: any = null;
      
      // Try to fetch from the specific endpoint first
      try {
        console.log('========================================');
        console.log('Making API request to:', `/patient-icu-admissions/icu-management/${patientICUAdmissionId}`);
        const apiUrl = `/patient-icu-admissions/icu-management/${patientICUAdmissionId}`;
        console.log('Full API URL:', apiUrl);
        console.log('About to call apiRequest...');
        console.log('This should trigger a network request in the browser DevTools');
        console.log('========================================');
        
        const response = await apiRequest<any>(apiUrl);
        console.log('API request completed');
        console.log('ICU admission details API response received');
        console.log('Response type:', typeof response);
        console.log('Response (RAW):', JSON.stringify(response, null, 2));
        
        // Handle different response structures: { data: {...} } or direct object
        admission = response?.data || response;
        
        // Log patientId extraction for debugging
        if (admission) {
          console.log('Extracted admission object:', admission);
          console.log('PatientId fields in response:', {
            patientId: admission.patientId,
            PatientId: admission.PatientId,
            patient_id: admission.patient_id,
            Patient_ID: admission.Patient_ID,
            'patient.id': admission.patient?.id,
            'Patient.Id': admission.Patient?.Id,
            patient: admission.patient,
            Patient: admission.Patient
          });
        }
        
        if (!admission) {
          throw new Error('ICU admission not found in response');
        }
      } catch (endpointError: any) {
        console.warn('Error fetching from specific endpoint, trying fallback method:', endpointError);
        
        // Fallback: Fetch all ICU admissions and find the matching one
        try {
          console.log('Fallback: Fetching all ICU admissions from /patient-icu-admissions/icu-management');
          const allAdmissionsResponse = await apiRequest<any>('/patient-icu-admissions/icu-management');
          console.log('Fallback API response:', allAdmissionsResponse);
          const allAdmissions = allAdmissionsResponse?.data || allAdmissionsResponse || [];
          
          if (Array.isArray(allAdmissions)) {
            admission = allAdmissions.find((adm: any) => 
              adm.id === patientICUAdmissionId || 
              adm.patientICUAdmissionId === patientICUAdmissionId ||
              adm.PatientICUAdmissionId === patientICUAdmissionId ||
              String(adm.id) === String(patientICUAdmissionId) ||
              String(adm.patientICUAdmissionId) === String(patientICUAdmissionId)
            );
          }
          
          if (!admission) {
            throw new Error(`ICU admission with ID ${patientICUAdmissionId} not found. The backend API may have an issue (column p.EmailId does not exist).`);
          }
        } catch (fallbackError: any) {
          console.error('Fallback method also failed:', fallbackError);
          throw new Error(
            `Failed to load ICU admission details. ` +
            `Backend error: ${endpointError?.message || endpointError || 'Unknown error'}. ` +
            `Please contact the system administrator.`
          );
        }
      }
      
      if (!admission) {
        throw new Error('ICU admission not found');
      }
      
      console.log('ICU admission data extracted:', admission);

      // Helper function to extract value with multiple field name variations
      const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
        for (const field of fieldVariations) {
          const value = data?.[field];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
        return defaultValue;
      };

      const mappedAdmission: ICUAdmission = {
        id: admission.id || admission.Id || patientICUAdmissionId,
        patientICUAdmissionId: extractField(admission, [
          'patientICUAdmissionId', 'PatientICUAdmissionId', 'patient_icu_admission_id', 'Patient_ICU_Admission_Id',
          'id', 'Id', 'admissionId', 'AdmissionId'
        ], patientICUAdmissionId),
        patientId: extractField(admission, [
          'patientId', 'PatientId', 'patient_id', 'Patient_ID', 
          'PatientID', 'patientID', 'patientID', 'PATIENT_ID',
          'patient.id', 'Patient.Id', 'patient', 'Patient'
        ], ''),
        patientName: extractField(admission, [
          'patientName', 'PatientName', 'patient_name', 'Patient_Name',
          'name', 'Name', 'fullName', 'FullName'
        ], 'Unknown Patient'),
        age: Number(extractField(admission, [
          'age', 'Age', 'patientAge', 'PatientAge', 'patient_age', 'Patient_Age'
        ], 0)) || 0,
        gender: extractField(admission, [
          'gender', 'Gender', 'sex', 'Sex', 'patientGender', 'PatientGender'
        ], 'Unknown'),
        bedNumber: extractField(admission, [
          'bedNumber', 'BedNumber', 'bed_number', 'Bed_Number',
          'bed', 'Bed', 'icuBedNo', 'ICUBedNo', 'icuBedNumber', 'ICUBedNumber'
        ], ''),
        admissionDate: extractField(admission, [
          'admissionDate', 'AdmissionDate', 'admission_date', 'Admission_Date',
          'admitDate', 'AdmitDate', 'admit_date', 'Admit_Date'
        ], ''),
        admissionTime: extractField(admission, [
          'admissionTime', 'AdmissionTime', 'admission_time', 'Admission_Time',
          'admitTime', 'AdmitTime', 'admit_time', 'Admit_Time',
          'time', 'Time'
        ], ''),
        condition: extractField(admission, [
          'condition', 'Condition', 'patientCondition', 'PatientCondition',
          'diagnosis', 'Diagnosis', 'diagnosisDescription', 'DiagnosisDescription'
        ], 'Not Specified'),
        severity: extractField(admission, [
          'severity', 'Severity', 'patientSeverity', 'PatientSeverity',
          'icuPatientStatus', 'ICUPatientStatus', 'icu_patient_status', 'ICU_Patient_Status',
          'status', 'Status', 'patientStatus', 'PatientStatus'
        ], 'Stable'),
        attendingDoctor: extractField(admission, [
          'attendingDoctor', 'AttendingDoctor', 'attending_doctor', 'Attending_Doctor',
          'doctor', 'Doctor', 'doctorName', 'DoctorName', 'admittedBy', 'AdmittedBy'
        ], 'Not Assigned'),
        diagnosis: extractField(admission, [
          'diagnosis', 'Diagnosis', 'diagnosisDescription', 'DiagnosisDescription',
          'diagnosis_desc', 'Diagnosis_Desc'
        ], 'Not Specified'),
        treatment: extractField(admission, [
          'treatment', 'Treatment', 'treatmentPlan', 'TreatmentPlan',
          'treatment_plan', 'Treatment_Plan', 'medications', 'Medications'
        ], 'Not Specified'),
        ventilatorSupport: extractField(admission, [
          'ventilatorSupport', 'VentilatorSupport', 'ventilator_support', 'Ventilator_Support',
          'onVentilator', 'OnVentilator', 'isVentilatorAttached', 'IsVentilatorAttached',
          'ventilator', 'Ventilator'
        ], false),
        vitals: {
          heartRate: Number(extractField(admission, [
            'heartRate', 'HeartRate', 'heart_rate', 'Heart_Rate',
            'vitals.heartRate', 'vitals.HeartRate'
          ], 0)) || 0,
          bloodPressure: extractField(admission, [
            'bloodPressure', 'BloodPressure', 'blood_pressure', 'Blood_Pressure',
            'bp', 'BP', 'vitals.bloodPressure', 'vitals.BloodPressure'
          ], '0/0'),
          temperature: Number(extractField(admission, [
            'temperature', 'Temperature', 'temp', 'Temp',
            'vitals.temperature', 'vitals.Temperature'
          ], 0)) || 0,
          oxygenSaturation: Number(extractField(admission, [
            'oxygenSaturation', 'OxygenSaturation', 'oxygen_saturation', 'Oxygen_Saturation',
            'o2Sat', 'O2Sat', 'spo2', 'SpO2', 'vitals.oxygenSaturation', 'vitals.OxygenSaturation'
          ], 0)) || 0,
          respiratoryRate: Number(extractField(admission, [
            'respiratoryRate', 'RespiratoryRate', 'respiratory_rate', 'Respiratory_Rate',
            'rr', 'RR', 'vitals.respiratoryRate', 'vitals.RespiratoryRate'
          ], 0)) || 0,
        },
      };

      console.log('Fetched ICU admission data:', mappedAdmission);
      setIcuAdmission(mappedAdmission);
      
      // Fetch patient lab tests, doctor visits, and nurse visits after admission is loaded
      // Use patientICUAdmissionId (UUID string) for API calls
      const patientICUAdmissionIdForAPI = mappedAdmission.patientICUAdmissionId || patientICUAdmissionId;
      if (patientICUAdmissionIdForAPI) {
        // Use the UUID string directly for doctor visits and nurse visits APIs
        console.log('Fetching doctor visits with patientICUAdmissionId (UUID):', patientICUAdmissionIdForAPI);
        fetchPatientDoctorVisits(String(patientICUAdmissionIdForAPI));
        console.log('Fetching nurse visits with patientICUAdmissionId (UUID):', patientICUAdmissionIdForAPI);
        fetchPatientNurseVisits(String(patientICUAdmissionIdForAPI));
        console.log('Fetching ICU visit vitals with patientICUAdmissionId (UUID):', patientICUAdmissionIdForAPI);
        fetchICUVitalsList(String(patientICUAdmissionIdForAPI));
        
        // Fetch lab tests using ICU admission ID (can be string UUID or number)
        fetchPatientLabTests(String(patientICUAdmissionIdForAPI));
      }
    } catch (err) {
      console.error('Error fetching ICU admission details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ICU admission details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientLabTests = async (patientICUAdmissionId: string | number) => {
    try {
      setLabTestsLoading(true);
      setLabTestsError(null);
      console.log('Fetching patient lab tests for patientICUAdmissionId:', patientICUAdmissionId);
      console.log('API Endpoint: /patient-lab-tests');
      
      // Call /patient-lab-tests API with ICUAdmissionId as query parameter
      const response = await apiRequest<any>(`/patient-lab-tests?ICUAdmissionId=${patientICUAdmissionId}`);
      console.log('Patient lab tests API response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures
      let labTestsData: any[] = [];
      
      if (Array.isArray(response)) {
        labTestsData = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          labTestsData = response.data;
        } else if (response.data.patientLabTests && Array.isArray(response.data.patientLabTests)) {
          labTestsData = response.data.patientLabTests;
        } else if (response.data.labTests && Array.isArray(response.data.labTests)) {
          labTestsData = response.data.labTests;
        } else if (response.data.PatientLabTests && Array.isArray(response.data.PatientLabTests)) {
          labTestsData = response.data.PatientLabTests;
        }
      } else if (response?.patientLabTests && Array.isArray(response.patientLabTests)) {
        labTestsData = response.patientLabTests;
      } else if (response?.labTests && Array.isArray(response.labTests)) {
        labTestsData = response.labTests;
      } else if (response?.PatientLabTests && Array.isArray(response.PatientLabTests)) {
        labTestsData = response.PatientLabTests;
      }
      
      if (!Array.isArray(labTestsData) || labTestsData.length === 0) {
        console.warn('Patient lab tests response is not an array or is empty:', response);
        setPatientLabTests([]);
        return;
      }
      
      // Map the response to PatientLabTest format
      const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
        for (const field of fieldVariations) {
          const value = data?.[field];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
        return defaultValue;
      };
      
      const mappedLabTests: PatientLabTest[] = labTestsData.map((test: any) => ({
        id: extractField(test, ['id', 'Id', 'patientLabTestId', 'PatientLabTestId', 'patientLabTestsId', 'PatientLabTestsId'], 0),
        patientLabTestId: extractField(test, ['patientLabTestId', 'PatientLabTestId', 'patientLabTestsId', 'PatientLabTestsId', 'id', 'Id'], 0),
        patientId: extractField(test, ['patientId', 'PatientId'], ''),
        labTestId: extractField(test, ['labTestId', 'LabTestId'], null),
        patientType: extractField(test, ['patientType', 'PatientType'], ''),
        priority: extractField(test, ['priority', 'Priority'], 'Normal'),
        labTestDone: extractField(test, ['labTestDone', 'LabTestDone'], false),
        reportsUrl: extractField(test, ['reportsUrl', 'ReportsUrl'], ''),
        testStatus: extractField(test, ['testStatus', 'TestStatus', 'status', 'Status'], 'Pending'),
        testDoneDateTime: extractField(test, ['testDoneDateTime', 'TestDoneDateTime'], ''),
        status: extractField(test, ['status', 'Status', 'testStatus', 'TestStatus'], 'Pending'),
        roomAdmissionId: extractField(test, ['roomAdmissionId', 'RoomAdmissionId'], null),
        labTestName: extractField(test, ['labTestName', 'LabTestName', 'testName', 'TestName'], ''),
        testName: extractField(test, ['testName', 'TestName', 'labTestName', 'LabTestName'], ''),
        testCategory: extractField(test, ['testCategory', 'TestCategory'], ''),
        displayTestId: extractField(test, ['displayTestId', 'DisplayTestId'], ''),
        description: extractField(test, ['description', 'Description'], ''),
        orderedDate: extractField(test, ['orderedDate', 'OrderedDate'], ''),
        orderedBy: extractField(test, ['orderedBy', 'OrderedBy'], ''),
        result: extractField(test, ['result', 'Result'], ''),
        reportedDate: extractField(test, ['reportedDate', 'ReportedDate'], ''),
        charges: extractField(test, ['charges', 'Charges'], 0),
      }));
      
      console.log('Fetched and mapped patient lab tests:', mappedLabTests);
      setPatientLabTests(mappedLabTests);
    } catch (err) {
      console.error('Error fetching patient lab tests:', err);
      setLabTestsError(err instanceof Error ? err.message : 'Failed to load patient lab tests');
      setPatientLabTests([]);
    } finally {
      setLabTestsLoading(false);
    }
  };

  const fetchPatientDoctorVisits = async (patientICUAdmissionId: string) => {
    try {
      setDoctorVisitsLoading(true);
      setDoctorVisitsError(null);
      console.log('========================================');
      console.log('Fetching ICU doctor visits for patientICUAdmissionId (UUID):', patientICUAdmissionId);
      console.log('API Endpoint:', `/icu-doctor-visits/${patientICUAdmissionId}`);
      console.log('========================================');
      
      // Call the new ICU doctor visits API endpoint
      const response = await apiRequest<any>(`/icu-doctor-visits/icu-admission/${patientICUAdmissionId}`);
      
      console.log('ICU doctor visits API response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures
      let doctorVisitsData: any[] = [];
      
      if (Array.isArray(response)) {
        doctorVisitsData = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          doctorVisitsData = response.data;
        } else if (response.data.doctorVisits && Array.isArray(response.data.doctorVisits)) {
          doctorVisitsData = response.data.doctorVisits;
        } else if (response.data.icuDoctorVisits && Array.isArray(response.data.icuDoctorVisits)) {
          doctorVisitsData = response.data.icuDoctorVisits;
        }
      } else if (response?.doctorVisits && Array.isArray(response.doctorVisits)) {
        doctorVisitsData = response.doctorVisits;
      } else if (response?.icuDoctorVisits && Array.isArray(response.icuDoctorVisits)) {
        doctorVisitsData = response.icuDoctorVisits;
      }
      
      if (!Array.isArray(doctorVisitsData) || doctorVisitsData.length === 0) {
        console.warn('ICU doctor visits response is not an array or is empty:', response);
        setPatientDoctorVisits([]);
        return;
      }
      
      // Map the response to PatientDoctorVisit format
      const mappedDoctorVisits: PatientDoctorVisit[] = doctorVisitsData.map((visit: any) => {
        const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
          for (const field of fieldVariations) {
            const value = data?.[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          return defaultValue;
        };
        
        return {
          icuDoctorVisitsId: extractField(visit, ['icuDoctorVisitsId', 'ICUDoctorVisitsId', 'iCUDoctorVisitsId', 'ICUDOCTORVISITSID', 'icuDoctorVisitId', 'ICUDoctorVisitId', 'iCUDoctorVisitId', 'patientDoctorVisitId', 'PatientDoctorVisitId', 'id', 'Id'], 0),
          iCUDoctorVisitId: extractField(visit, ['icuDoctorVisitsId', 'ICUDoctorVisitsId', 'iCUDoctorVisitsId', 'ICUDOCTORVISITSID', 'icuDoctorVisitId', 'ICUDoctorVisitId', 'iCUDoctorVisitId', 'patientDoctorVisitId', 'PatientDoctorVisitId', 'id', 'Id'], 0), // Legacy support
          patientDoctorVisitId: extractField(visit, ['patientDoctorVisitId', 'PatientDoctorVisitId', 'id', 'Id'], 0),
          doctorName: extractField(visit, ['doctorName', 'DoctorName', 'doctor_name', 'Doctor_Name', 'doctor', 'Doctor'], ''),
          visitDate: extractField(visit, ['visitDate', 'VisitDate', 'visit_date', 'Visit_Date', 'doctorVisitedDateTime', 'DoctorVisitedDateTime'], ''),
          visitTime: extractField(visit, ['visitTime', 'VisitTime', 'visit_time', 'Visit_Time'], ''),
          visitType: extractField(visit, ['visitType', 'VisitType', 'visit_type', 'Visit_Type'], ''),
          diagnosis: extractField(visit, ['diagnosis', 'Diagnosis'], ''),
          notes: extractField(visit, ['notes', 'Notes'], ''),
          visitsDetails: extractField(visit, ['visitsDetails', 'VisitsDetails', 'visitDetails', 'VisitDetails'], ''),
          patientCondition: extractField(visit, ['patientCondition', 'PatientCondition', 'condition', 'Condition'], ''),
          status: extractField(visit, ['status', 'Status'], 'Active'), // Map Status to Status
          prescribedMedications: extractField(visit, ['prescribedMedications', 'PrescribedMedications', 'medications', 'Medications'], ''),
        };
      });
      
      console.log('Fetched and mapped ICU doctor visits:', mappedDoctorVisits);
      setPatientDoctorVisits(mappedDoctorVisits);
    } catch (err) {
      console.error('Error fetching ICU doctor visits:', err);
      setDoctorVisitsError(err instanceof Error ? err.message : 'Failed to load ICU doctor visits');
      setPatientDoctorVisits([]);
    } finally {
      setDoctorVisitsLoading(false);
    }
  };

  const fetchPatientNurseVisits = async (patientICUAdmissionId: string) => {
    try {
      setNurseVisitsLoading(true);
      setNurseVisitsError(null);
      console.log('========================================');
      console.log('Fetching ICU nurse visits for patientICUAdmissionId (UUID):', patientICUAdmissionId);
      console.log('API Endpoint:', `/icu-nurse-visits/icu-admission/${patientICUAdmissionId}`);
      console.log('========================================');
      
      // Call the new ICU nurse visits API endpoint
      const response = await apiRequest<any>(`/icu-nurse-visits/icu-admission/${patientICUAdmissionId}`);
      console.log('ICU nurse visits API response (RAW):', JSON.stringify(response, null, 2));
      
      // Handle different response structures
      let nurseVisitsData: any[] = [];
      
      if (Array.isArray(response)) {
        nurseVisitsData = response;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          nurseVisitsData = response.data;
        } else if (response.data.nurseVisits && Array.isArray(response.data.nurseVisits)) {
          nurseVisitsData = response.data.nurseVisits;
        } else if (response.data.icuNurseVisits && Array.isArray(response.data.icuNurseVisits)) {
          nurseVisitsData = response.data.icuNurseVisits;
        }
      } else if (response?.nurseVisits && Array.isArray(response.nurseVisits)) {
        nurseVisitsData = response.nurseVisits;
      } else if (response?.icuNurseVisits && Array.isArray(response.icuNurseVisits)) {
        nurseVisitsData = response.icuNurseVisits;
      }
      
      if (!Array.isArray(nurseVisitsData) || nurseVisitsData.length === 0) {
        console.warn('ICU nurse visits response is not an array or is empty:', response);
        setPatientNurseVisits([]);
        return;
      }
      
      // Map the response to PatientNurseVisit format
      const mappedNurseVisits: PatientNurseVisit[] = nurseVisitsData.map((visit: any) => {
        const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
          for (const field of fieldVariations) {
            const value = data?.[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          return defaultValue;
        };
        
        return {
          patientNurseVisitId: extractField(visit, ['patientNurseVisitId', 'PatientNurseVisitId', 'id', 'Id'], 0),
          icuNurseVisitsId: extractField(visit, [
            'icuNurseVisitsId', 'ICUNurseVisitsId', 'icu_nurse_visits_id', 'ICU_Nurse_Visits_Id',
            'icuNurseVisitId', 'ICUNurseVisitId', 'icu_nurse_visit_id', 'ICU_Nurse_Visit_Id',
            'id', 'Id', 'ID'
          ], null),
          nurseName: extractField(visit, ['nurseName', 'NurseName', 'nurse_name', 'Nurse_Name', 'nurse', 'Nurse'], ''),
          visitDate: extractField(visit, ['visitDate', 'VisitDate', 'visit_date', 'Visit_Date', 'nurseVisitedDateTime', 'NurseVisitedDateTime'], ''),
          visitTime: extractField(visit, ['visitTime', 'VisitTime', 'visit_time', 'Visit_Time'], ''),
          visitType: extractField(visit, ['visitType', 'VisitType', 'visit_type', 'Visit_Type'], ''),
          vitalSigns: extractField(visit, ['vitalSigns', 'VitalSigns', 'vital_signs', 'Vital_Signs'], ''),
          notes: extractField(visit, ['notes', 'Notes'], ''),
          nurseVisitsDetails: extractField(visit, ['nurseVisitsDetails', 'NurseVisitsDetails', 'visitDetails', 'VisitDetails'], ''),
          medicationsAdministered: extractField(visit, ['medicationsAdministered', 'MedicationsAdministered', 'medications', 'Medications'], ''),
          patientStatus: extractField(visit, ['patientStatus', 'PatientStatus', 'patientCondition', 'PatientCondition', 'condition', 'Condition'], ''),
        };
      });
      
      console.log('Fetched and mapped ICU nurse visits:', mappedNurseVisits);
      setPatientNurseVisits(mappedNurseVisits);
    } catch (err) {
      console.error('Error fetching ICU nurse visits:', err);
      setNurseVisitsError(err instanceof Error ? err.message : 'Failed to load ICU nurse visits');
      setPatientNurseVisits([]);
    } finally {
      setNurseVisitsLoading(false);
    }
  };

  // Fetch ICU visit vitals for the current ICU admission
  const fetchICUVitalsList = async (patientICUAdmissionId: string) => {
    try {
      setIcuVitalsLoading(true);
      setIcuVitalsError(null);

      console.log('Fetching ICU visit vitals for ICU Admission:', patientICUAdmissionId);
      const endpoint = `/icu-visit-vitals${patientICUAdmissionId ? `?ICUAdmissionId=${encodeURIComponent(patientICUAdmissionId)}` : ''}`;
      const response = await apiRequest<any>(endpoint);
      const vitalsData = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];

      const mapVitals = (v: any) => {
        const extract = (data: any, keys: string[], def: any = '') => {
          for (const k of keys) {
            if (data && data[k] !== undefined && data[k] !== null && data[k] !== '') return data[k];
          }
          return def;
        };
        return {
          icuVisitVitalsId: extract(v, ['icuVisitVitalsId', 'ICUVisitVitalsId', 'icuNurseVisitVitalsId', 'ICUNurseVisitVitalsId', 'id', 'Id']),
          icuAdmissionId: extract(v, ['icuAdmissionId', 'ICUAdmissionId']),
          patientId: extract(v, ['patientId', 'PatientId']),
          heartRate: extract(v, ['heartRate', 'HeartRate']),
          bloodPressure: extract(v, ['bloodPressure', 'BloodPressure']),
          temperature: extract(v, ['temperature', 'Temperature']),
          oxygenSaturation: extract(v, [
            'oxygenSaturation', 'OxygenSaturation', 'O2Saturation', 'o2Saturation',
            'O2', 'o2', 'O2Sat', 'o2Sat', 'SpO2', 'spo2', 'spO2',
            'oxygenSaturationLevel', 'OxygenSaturationLevel'
          ]),
          respiratoryRate: extract(v, ['respiratoryRate', 'RespiratoryRate']),
          bloodSugar: extract(v, [
            'bloodSugar', 'BloodSugar', 'bloodGlucose', 'BloodGlucose',
            'glucose', 'Glucose', 'BS', 'bs', 'bloodSugarLevel', 'BloodSugarLevel'
          ]),
          recordedDateTime: extract(v, ['recordedDateTime', 'RecordedDateTime']),
          recordedBy: extract(v, ['recordedBy', 'RecordedBy']),
          dailyOrHourlyVitals: extract(v, ['dailyOrHourlyVitals', 'DailyOrHourlyVitals']),
          nurseId: extract(v, ['nurseId', 'NurseId']),
          nurseVisitsDetails: extract(v, ['nurseVisitsDetails', 'NurseVisitsDetails', 'visitsDetails', 'VisitsDetails']),
          patientCondition: extract(v, [
            'patientCondition', 'PatientCondition', 'patientStatus', 'PatientStatus',
            'condition', 'Condition', 'status', 'Status'
          ]),
        };
      };

      const mapped = vitalsData.map(mapVitals);
      console.log('Mapped ICU visit vitals:', mapped);
      setIcuVitalsList(mapped);
    } catch (err) {
      console.error('Error fetching ICU visit vitals:', err);
      setIcuVitalsError(err instanceof Error ? err.message : 'Failed to load ICU visit vitals');
      setIcuVitalsList([]);
    } finally {
      setIcuVitalsLoading(false);
    }
  };

  const handleBack = () => {
    window.location.hash = 'icu';
  };

  // Handle opening Add Patient Lab Test dialog
  const handleOpenAddLabTestDialog = async () => {
    if (icuAdmission) {
      // Fetch available lab tests
      try {
        const labTests = await labTestsApi.getAll();
        setAvailableLabTests(labTests);
      } catch (err) {
        console.error('Error fetching lab tests:', err);
      }
      
      setLabTestFormData({
        icuAdmissionId: String(icuAdmission.patientICUAdmissionId || icuAdmission.id || ''),
        patientId: String(icuAdmission.patientId || ''),
        labTestId: '',
        priority: 'Normal',
        orderedDate: new Date().toISOString().split('T')[0], // Today's date
        orderedBy: '',
        description: '',
        charges: '',
        patientType: '',
        appointmentId: '',
        roomAdmissionId: '',
        emergencyBedSlotId: '',
        labTestDone: 'No',
        reportsUrl: '',
        testStatus: 'Pending',
        testDoneDateTime: ''
      });
      setLabTestSearchTerm('');
      setShowLabTestList(false);
      setLabTestSubmitError(null);
      setIsAddLabTestDialogOpen(true);
    } else {
      setLabTestSubmitError('ICU Admission data is not loaded. Please wait and try again.');
    }
  };

  // Handle opening Edit Patient Lab Test dialog
  const handleOpenEditLabTestDialog = async (test: PatientLabTest) => {
    if (icuAdmission) {
      // Fetch available lab tests
      try {
        const labTests = await labTestsApi.getAll();
        setAvailableLabTests(labTests);
      } catch (err) {
        console.error('Error fetching lab tests:', err);
      }
      
      const testId = test.patientLabTestId || test.id;
      setEditingLabTestId(testId);
      
      // Find the lab test name for display
      const selectedLabTest = availableLabTests.find((lt: LabTest) => {
        const lid = (lt as any).labTestId || (lt as any).id || '';
        return String(lid) === String(test.labTestId || '');
      });
      
      setLabTestFormData({
        icuAdmissionId: String(icuAdmission.patientICUAdmissionId || icuAdmission.id || ''),
        patientId: String((test as any).patientId || icuAdmission.patientId || ''),
        labTestId: String(test.labTestId || ''),
        priority: test.priority || 'Normal',
        orderedDate: test.orderedDate || new Date().toISOString().split('T')[0],
        orderedBy: test.orderedBy || '',
        description: test.description || '',
        charges: test.charges ? String(test.charges) : '',
        patientType: (test as any).patientType || '',
        appointmentId: (test as any).appointmentId || '',
        roomAdmissionId: test.roomAdmissionId ? String(test.roomAdmissionId) : '',
        emergencyBedSlotId: (test as any).emergencyBedSlotId || '',
        labTestDone: test.labTestDone === true || test.labTestDone === 'Yes' ? 'Yes' : 'No',
        reportsUrl: test.reportsUrl || '',
        testStatus: test.testStatus || test.status || 'Pending',
        testDoneDateTime: test.testDoneDateTime ? new Date(test.testDoneDateTime).toISOString().slice(0, 16) : ''
      });
      setLabTestSearchTerm(selectedLabTest ? `${selectedLabTest.testName || 'Unknown'} (${selectedLabTest.testCategory || 'N/A'})` : '');
      setShowLabTestList(false);
      setLabTestSubmitError(null);
      setIsAddLabTestDialogOpen(true);
    } else {
      setLabTestSubmitError('ICU Admission data is not loaded. Please wait and try again.');
    }
  };

  // Handle saving Patient Lab Test
  const handleSaveLabTest = async () => {
    try {
      setLabTestSubmitting(true);
      setLabTestSubmitError(null);

      console.log('Saving Patient Lab Test with data:', labTestFormData);

      // Validate required fields
      if (!labTestFormData.icuAdmissionId || labTestFormData.icuAdmissionId === 'undefined' || labTestFormData.icuAdmissionId === '') {
        throw new Error('ICU Admission ID is required');
      }
      
      let patientIdValue = labTestFormData.patientId;
      if (!patientIdValue || patientIdValue === 'undefined' || patientIdValue === '') {
        patientIdValue = icuAdmission?.patientId ? String(icuAdmission.patientId) : '';
        console.log('PatientId from form was empty, trying from icuAdmission:', patientIdValue);
      }
      
      if (!patientIdValue || patientIdValue === 'undefined' || patientIdValue === '') {
        throw new Error('Patient ID is required. Please ensure the ICU admission has a valid patient ID.');
      }
      
      if (!labTestFormData.labTestId || labTestFormData.labTestId === '') {
        throw new Error('Lab Test is required. Please select a lab test.');
      }
      
      if (!labTestFormData.orderedDate) {
        throw new Error('Ordered Date is required');
      }

      if (!labTestFormData.patientType || labTestFormData.patientType === '') {
        throw new Error('Patient Type is required. Please select OPD, IPD, or Emergency.');
      }

      // Get selected lab test details
      const selectedLabTest = availableLabTests.find((lt: LabTest) => {
        const lid = (lt as any).labTestId || (lt as any).id || '';
        return String(lid) === labTestFormData.labTestId;
      });
      if (!selectedLabTest) {
        throw new Error('Selected lab test details not found.');
      }

      // Prepare the request payload
      const payload: any = {
        ICUAdmissionId: String(labTestFormData.icuAdmissionId).trim(),
        PatientId: String(patientIdValue).trim(),
        LabTestId: Number(labTestFormData.labTestId),
        Priority: labTestFormData.priority || 'Normal',
        OrderedDate: labTestFormData.orderedDate,
        PatientType: labTestFormData.patientType,
        LabTestDone: labTestFormData.labTestDone || 'No',
        TestStatus: labTestFormData.testStatus || 'Pending',
      };

      // Add conditional fields based on PatientType (only if they have values)
      if (labTestFormData.patientType === 'OPD') {
        if (labTestFormData.appointmentId && labTestFormData.appointmentId.trim() !== '') {
          payload.AppointmentId = String(labTestFormData.appointmentId).trim();
        }
      }
      if (labTestFormData.patientType === 'IPD') {
        if (labTestFormData.roomAdmissionId && labTestFormData.roomAdmissionId.trim() !== '') {
          payload.RoomAdmissionId = String(labTestFormData.roomAdmissionId).trim();
        }
      }
      if (labTestFormData.patientType === 'Emergency') {
        if (labTestFormData.emergencyBedSlotId && labTestFormData.emergencyBedSlotId.trim() !== '') {
          payload.EmergencyBedSlotId = String(labTestFormData.emergencyBedSlotId).trim();
        }
      }

      // Add optional fields
      if (labTestFormData.orderedBy && labTestFormData.orderedBy.trim() !== '') {
        payload.OrderedBy = labTestFormData.orderedBy.trim();
      }
      if (labTestFormData.description && labTestFormData.description.trim() !== '') {
        payload.Description = labTestFormData.description.trim();
      }
      if (labTestFormData.charges && labTestFormData.charges.trim() !== '') {
        payload.Charges = Number(labTestFormData.charges);
      } else if (selectedLabTest.charges) {
        payload.Charges = selectedLabTest.charges;
      }
      if (labTestFormData.reportsUrl && labTestFormData.reportsUrl.trim() !== '') {
        payload.ReportsUrl = labTestFormData.reportsUrl.trim();
      }
      if (labTestFormData.testDoneDateTime && labTestFormData.testDoneDateTime.trim() !== '') {
        // Convert datetime-local to ISO 8601 format
        try {
          const date = new Date(labTestFormData.testDoneDateTime);
          if (!isNaN(date.getTime())) {
            payload.TestDoneDateTime = date.toISOString();
          } else {
            payload.TestDoneDateTime = labTestFormData.testDoneDateTime;
          }
        } catch (e) {
          payload.TestDoneDateTime = labTestFormData.testDoneDateTime;
        }
      }

      // Add ID for update
      const isEditing = !!editingLabTestId;
      if (isEditing && editingLabTestId) {
        payload.PatientLabTestId = String(editingLabTestId);
      }

      console.log('API Payload:', JSON.stringify(payload, null, 2));
      console.log('API Endpoint:', isEditing ? `/patient-lab-tests/${editingLabTestId}` : '/patient-lab-tests');

      // Call the API to create or update the patient lab test
      let response;
      if (isEditing && editingLabTestId) {
        response = await apiRequest<any>(`/patient-lab-tests/${editingLabTestId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        console.log('Patient lab test updated successfully:', response);
      } else {
        response = await apiRequest<any>('/patient-lab-tests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        console.log('Patient lab test created successfully:', response);
      }

      // Close dialog
      setIsAddLabTestDialogOpen(false);
      
      // Refresh the lab tests list
      if (icuAdmission?.patientICUAdmissionId) {
        await fetchPatientLabTests(String(icuAdmission.patientICUAdmissionId));
      }

      // Reset form
      setLabTestFormData({
        icuAdmissionId: '',
        patientId: '',
        labTestId: '',
        priority: 'Normal',
        orderedDate: '',
        orderedBy: '',
        description: '',
        charges: '',
        patientType: '',
        appointmentId: '',
        roomAdmissionId: '',
        emergencyBedSlotId: '',
        labTestDone: 'No',
        reportsUrl: '',
        testStatus: 'Pending',
        testDoneDateTime: ''
      });
      setLabTestSearchTerm('');
      setShowLabTestList(false);
    } catch (err) {
      console.error('Error saving Patient Lab Test:', err);
      setLabTestSubmitError(
        err instanceof Error ? err.message : 'Failed to save Patient Lab Test'
      );
    } finally {
      setLabTestSubmitting(false);
    }
  };

  // Handle opening Add ICU Nurse Visit dialog
  const handleOpenAddNurseVisitDialog = () => {
    if (icuAdmission) {
      setNurseVisitFormData({
        icuAdmissionId: String(icuAdmission.patientICUAdmissionId || icuAdmission.id || ''),
        patientId: String(icuAdmission.patientId || ''),
        nurseId: '',
        nurseVisitedDateTime: new Date().toISOString().slice(0, 16), // Current date/time in local format
        nurseVisitsDetails: '',
        patientCondition: icuAdmission.condition || ''
      });
      setNurseVisitSubmitError(null);
      setIsAddNurseVisitDialogOpen(true);
    }
  };

  // Handle opening Add ICU Vitals dialog
  const handleOpenAddICUVitalsDialog = () => {
    if (icuAdmission) {
      const patientId = String(icuAdmission.patientId || '');
      const icuAdmissionId = String(icuAdmission.patientICUAdmissionId || icuAdmission.id || '');
      
      console.log('Opening Add ICU Vitals Dialog');
      console.log('ICU Admission:', icuAdmission);
      console.log('Extracted patientId:', patientId);
      console.log('Extracted icuAdmissionId:', icuAdmissionId);
      
      if (!patientId || patientId === 'undefined' || patientId === '') {
        console.error('PatientId is missing or empty!');
        console.error('ICU Admission object:', JSON.stringify(icuAdmission, null, 2));
        setIcuVitalsSubmitError('Patient ID is missing. Please ensure the ICU admission has a valid patient ID.');
        return;
      }
      
      setEditingICUVitalsId(null);
      setIcuVitalsFormData({
        icuVisitVitalsId: '',
        icuAdmissionId: icuAdmissionId,
        patientId: patientId,
        heartRate: '',
        bloodPressure: '',
        temperature: '',
        oxygenSaturation: '',
        respiratoryRate: '',
        bloodSugar: '',
        recordedDateTime: new Date().toISOString().slice(0, 16), // Current date/time in local format
        recordedBy: '',
        dailyOrHourlyVitals: '',
        nurseId: '',
        nurseVisitsDetails: '',
        patientCondition: ''
      });
      setNurseSearchTerm('');
      setShowNurseList(false);
      setIcuVitalsSubmitError(null);
      setIsAddICUVitalsDialogOpen(true);
    } else {
      setIcuVitalsSubmitError('ICU Admission data is not loaded. Please wait and try again.');
    }
  };

  // Handle saving ICU Vitals
  const handleSaveICUVitals = async () => {
    try {
      setIcuVitalsSubmitting(true);
      setIcuVitalsSubmitError(null);

      console.log('Saving ICU Visit Vitals with data:', icuVitalsFormData);
      console.log('ICU Admission:', icuAdmission);
      console.log('Form patientId:', icuVitalsFormData.patientId);
      console.log('Form icuAdmissionId:', icuVitalsFormData.icuAdmissionId);

      // Validate required fields
      if (!icuVitalsFormData.icuAdmissionId || icuVitalsFormData.icuAdmissionId === 'undefined' || icuVitalsFormData.icuAdmissionId === '') {
        throw new Error('ICU Admission ID is required');
      }
      
      // Get patientId from form or fallback to icuAdmission
      let patientIdValue = icuVitalsFormData.patientId;
      if (!patientIdValue || patientIdValue === 'undefined' || patientIdValue === '') {
        // Try to get from icuAdmission if form doesn't have it
        patientIdValue = icuAdmission?.patientId ? String(icuAdmission.patientId) : '';
        console.log('PatientId from form was empty, trying from icuAdmission:', patientIdValue);
      }
      
      if (!patientIdValue || patientIdValue === 'undefined' || patientIdValue === '') {
        console.error('PatientId is still empty after fallback!');
        console.error('ICU Admission:', JSON.stringify(icuAdmission, null, 2));
        throw new Error('Patient ID is required. Please ensure the ICU admission has a valid patient ID.');
      }
      
      if (!icuVitalsFormData.recordedDateTime) {
        throw new Error('Recorded Date & Time is required');
      }

      // Convert datetime-local to ISO 8601 format
      let recordedDateTimeISO = '';
      if (icuVitalsFormData.recordedDateTime) {
        try {
          // datetime-local format is YYYY-MM-DDTHH:mm, convert to ISO 8601
          const date = new Date(icuVitalsFormData.recordedDateTime);
          if (!isNaN(date.getTime())) {
            recordedDateTimeISO = date.toISOString();
          } else {
            // If parsing fails, try to use as-is
            recordedDateTimeISO = icuVitalsFormData.recordedDateTime;
          }
        } catch (e) {
          console.warn('Error converting date:', e);
          recordedDateTimeISO = icuVitalsFormData.recordedDateTime;
        }
      }

      // Prepare the request payload - only include fields that have values
      const payload: any = {
        ICUAdmissionId: String(icuVitalsFormData.icuAdmissionId).trim(), // UUID string
        PatientId: String(patientIdValue).trim(), // UUID string - required
        RecordedDateTime: recordedDateTimeISO || icuVitalsFormData.recordedDateTime, // ISO 8601 format
      };

      // Add optional numeric fields only if they have values
      if (icuVitalsFormData.heartRate && icuVitalsFormData.heartRate.trim() !== '') {
        payload.HeartRate = Number(icuVitalsFormData.heartRate);
      }
      if (icuVitalsFormData.temperature && icuVitalsFormData.temperature.trim() !== '') {
        payload.Temperature = Number(icuVitalsFormData.temperature);
      }
      // Oxygen saturation / O2
      if (icuVitalsFormData.oxygenSaturation && icuVitalsFormData.oxygenSaturation.trim() !== '') {
        const o2Val = Number(icuVitalsFormData.oxygenSaturation);
        payload.OxygenSaturation = o2Val;
        payload.O2 = o2Val; // send alias in case backend expects O2
      } else {
        payload.OxygenSaturation = null;
        payload.O2 = null;
      }
      if (icuVitalsFormData.respiratoryRate && icuVitalsFormData.respiratoryRate.trim() !== '') {
        payload.RespiratoryRate = Number(icuVitalsFormData.respiratoryRate);
      }
      if (icuVitalsFormData.bloodSugar && icuVitalsFormData.bloodSugar.trim() !== '') {
        payload.BloodSugar = Number(icuVitalsFormData.bloodSugar);
      } else {
        payload.BloodSugar = null;
      }

      // Add optional string fields only if they have values
      if (icuVitalsFormData.bloodPressure && icuVitalsFormData.bloodPressure.trim() !== '') {
        payload.BloodPressure = icuVitalsFormData.bloodPressure.trim();
      }
      if (icuVitalsFormData.recordedBy && icuVitalsFormData.recordedBy.trim() !== '') {
        payload.RecordedBy = icuVitalsFormData.recordedBy.trim();
      }
      if (icuVitalsFormData.dailyOrHourlyVitals && icuVitalsFormData.dailyOrHourlyVitals.trim() !== '') {
        payload.DailyOrHourlyVitals = icuVitalsFormData.dailyOrHourlyVitals.trim();
      }
      if (icuVitalsFormData.nurseId && icuVitalsFormData.nurseId.trim() !== '') {
        payload.NurseId = String(icuVitalsFormData.nurseId).trim();
      }
      if (icuVitalsFormData.nurseVisitsDetails && icuVitalsFormData.nurseVisitsDetails.trim() !== '') {
        payload.NurseVisitsDetails = icuVitalsFormData.nurseVisitsDetails.trim();
      }
      if (icuVitalsFormData.patientCondition && icuVitalsFormData.patientCondition.trim() !== '') {
        payload.PatientCondition = icuVitalsFormData.patientCondition.trim();
      } else {
        payload.PatientCondition = null;
      }

      console.log('API Payload (formatted):', JSON.stringify(payload, null, 2));
      console.log('API Endpoint: /icu-visit-vitals');

      // Add ID for update
      const isEditing = !!editingICUVitalsId;
      if (isEditing && editingICUVitalsId) {
        payload.ICUVisitVitalsId = String(editingICUVitalsId);
      }

      // Call the API to create/update the ICU visit vitals
      if (isEditing && editingICUVitalsId) {
        const response = await apiRequest<any>(`/icu-visit-vitals/${editingICUVitalsId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        console.log('ICU visit vitals updated successfully:', response);
      } else {
        const response = await apiRequest<any>('/icu-visit-vitals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        console.log('ICU visit vitals created successfully:', response);
      }

      // Close dialog
      setIsAddICUVitalsDialogOpen(false);
      
      // Refresh vitals and nurse visits
      if (icuAdmission?.patientICUAdmissionId) {
        await fetchICUVitalsList(String(icuAdmission.patientICUAdmissionId));
        await fetchPatientNurseVisits(String(icuAdmission.patientICUAdmissionId));
      }

      // Reset form
      setIcuVitalsFormData({
        icuVisitVitalsId: '',
        icuAdmissionId: '',
        patientId: '',
        heartRate: '',
        bloodPressure: '',
        temperature: '',
        oxygenSaturation: '',
        respiratoryRate: '',
        bloodSugar: '',
        recordedDateTime: '',
        recordedBy: '',
        dailyOrHourlyVitals: '',
        nurseId: '',
        nurseVisitsDetails: '',
        patientCondition: ''
      });
      setNurseSearchTerm('');
      setShowNurseList(false);
      setEditingICUVitalsId(null);
    } catch (err) {
      console.error('Error saving ICU Visit Vitals:', err);
      setIcuVitalsSubmitError(
        err instanceof Error ? err.message : 'Failed to save ICU Visit Vitals'
      );
    } finally {
      setIcuVitalsSubmitting(false);
    }
  };

  // Handle saving ICU Nurse Visit
  const handleSaveNurseVisit = async () => {
    try {
      setNurseVisitSubmitting(true);
      setNurseVisitSubmitError(null);

      console.log('Saving ICU Nurse Visit with data:', nurseVisitFormData);

      // Prepare the request payload
      // Ensure all UUID fields are sent as strings
      const payload = {
        ICUAdmissionId: String(nurseVisitFormData.icuAdmissionId), // UUID string
        PatientId: String(nurseVisitFormData.patientId), // UUID string
        NurseId: String(nurseVisitFormData.nurseId),
        NurseVisitedDateTime: nurseVisitFormData.nurseVisitedDateTime,
        NurseVisitsDetails: nurseVisitFormData.nurseVisitsDetails,
        PatientCondition: nurseVisitFormData.patientCondition
      };

      console.log('API Payload:', payload);
      console.log('API Endpoint: /icu-nurse-visits');

      // Call the API to create the ICU nurse visit
      const response = await apiRequest<any>('/icu-nurse-visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('ICU nurse visit created successfully:', response);

      // Close dialog and refresh nurse visits list
      setIsAddNurseVisitDialogOpen(false);
      
      // Refresh the nurse visits list
      if (icuAdmission?.patientICUAdmissionId) {
        await fetchPatientNurseVisits(String(icuAdmission.patientICUAdmissionId));
      }

      // Reset form
      setNurseVisitFormData({
        icuAdmissionId: '',
        patientId: '',
        nurseId: '',
        nurseVisitedDateTime: '',
        nurseVisitsDetails: '',
        patientCondition: ''
      });
    } catch (err) {
      console.error('Error saving ICU Nurse Visit:', err);
      setNurseVisitSubmitError(
        err instanceof Error ? err.message : 'Failed to save ICU Nurse Visit'
      );
    } finally {
      setNurseVisitSubmitting(false);
    }
  };

  // Handle opening Add ICU Doctor Visit dialog
  const handleOpenAddDoctorVisitDialog = () => {
    if (icuAdmission) {
      setEditingDoctorVisitId(null);
      setDoctorVisitFormData({
        icuAdmissionId: String(icuAdmission.patientICUAdmissionId || icuAdmission.id || ''),
        patientId: String(icuAdmission.patientId || ''),
        doctorId: '', // Will need to be set from attendingDoctor or fetched
        doctorVisitedDateTime: new Date().toISOString().slice(0, 16), // Current date/time in local format
        visitsDetails: '',
        patientCondition: icuAdmission.condition || '',
        status: 'Active'
      });
      setDoctorVisitSubmitError(null);
      setIsAddDoctorVisitDialogOpen(true);
    }
  };

  // Handle opening Edit ICU Doctor Visit dialog
  const handleOpenEditDoctorVisitDialog = (visit: PatientDoctorVisit) => {
    console.log('========================================');
    console.log('Opening edit dialog for doctor visit');
    console.log('Visit object:', visit);
    console.log('Visit ID (patientDoctorVisitId):', visit.patientDoctorVisitId);
    console.log('Visit ID (id):', visit.id);
    console.log('ICU Admission:', icuAdmission);
    console.log('========================================');
    
    // Extract ICU Doctor Visit ID (primary key for ICU Doctor Visits)
    // Prioritize icuDoctorVisitsId (plural) as the primary key
    const icuDoctorVisitsId = visit.icuDoctorVisitsId || (visit as any).icuDoctorVisitsId || 
                              (visit as any).ICUDoctorVisitsId || (visit as any).iCUDoctorVisitsId || 
                              (visit as any).icuDoctorVisitId || (visit as any).ICUDoctorVisitId || 
                              (visit as any).iCUDoctorVisitId || visit.patientDoctorVisitId || visit.id;
    const visitId = visit.patientDoctorVisitId || visit.id;
    console.log('Extracted icuDoctorVisitsId (primary key):', icuDoctorVisitsId);
    console.log('Extracted visitId (fallback):', visitId);
    
    if (!icuDoctorVisitsId && !visitId) {
      console.error('No visit ID found! Visit object:', visit);
      alert('Error: Cannot edit visit - Visit ID not found');
      return;
    }
    
    if (!icuAdmission) {
      console.error('ICU Admission not loaded!');
      alert('Error: ICU Admission details not loaded. Please wait and try again.');
      return;
    }
    
    const finalVisitId = icuDoctorVisitsId || visitId;
    console.log('Setting editingDoctorVisitId to:', finalVisitId);
    setEditingDoctorVisitId(finalVisitId);
    
    // Format datetime for datetime-local input (YYYY-MM-DDTHH:mm)
    let formattedDateTime = '';
    if (visit.visitDate) {
      try {
        const date = new Date(visit.visitDate);
        if (!isNaN(date.getTime())) {
          // Format to YYYY-MM-DDTHH:mm
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
          console.log('Formatted datetime:', formattedDateTime);
        }
      } catch (e) {
        console.warn('Error formatting date:', e);
      }
    }
    
    const formData = {
      icuDoctorVisitId: String(icuDoctorVisitsId || visitId || ''),
      icuAdmissionId: String(icuAdmission.patientICUAdmissionId || icuAdmission.id || ''),
      patientId: String(icuAdmission.patientId || ''),
      doctorId: String(visit.doctorId || visit.doctorName || ''),
      doctorVisitedDateTime: formattedDateTime || new Date().toISOString().slice(0, 16),
      visitsDetails: (visit as any).visitsDetails || visit.notes || visit.visitsRemarks || '',
      patientCondition: visit.patientCondition || '',
      status: visit.status || 'Active' // Map Status to Status
    };
    
    console.log('Setting form data:', formData);
    setDoctorVisitFormData(formData);
    setDoctorVisitSubmitError(null);
    
    console.log('Opening dialog...');
    setIsAddDoctorVisitDialogOpen(true);
    console.log('Dialog should now be open. isAddDoctorVisitDialogOpen state will be updated.');
  };

  // Handle saving ICU Doctor Visit (both create and update)
  const handleSaveDoctorVisit = async () => {
    try {
      setDoctorVisitSubmitting(true);
      setDoctorVisitSubmitError(null);

      console.log('Saving ICU Doctor Visit with data:', doctorVisitFormData);
      console.log('Is editing:', editingDoctorVisitId !== null, 'Visit ID:', editingDoctorVisitId);

      // Prepare the request payload
      // Ensure all UUID fields are sent as strings
      const payload: any = {
        ICUAdmissionId: String(doctorVisitFormData.icuAdmissionId), // UUID string
        PatientId: String(doctorVisitFormData.patientId), // UUID string
        DoctorId: String(doctorVisitFormData.doctorId),
        DoctorVisitedDateTime: doctorVisitFormData.doctorVisitedDateTime,
        VisitsDetails: doctorVisitFormData.visitsDetails,
        PatientCondition: doctorVisitFormData.patientCondition, // Keep PatientCondition separate
        Status: doctorVisitFormData.status // Map Status to Status in API payload
      };

      // Include ICUDoctorVisitId when editing
      if (editingDoctorVisitId && doctorVisitFormData.icuDoctorVisitId) {
        payload.ICUDoctorVisitId = String(doctorVisitFormData.icuDoctorVisitId);
        console.log('Including ICUDoctorVisitId in payload:', payload.ICUDoctorVisitId);
      }

      console.log('API Payload:', payload);

      let response;
      if (editingDoctorVisitId) {
        // Update existing visit
        console.log('API Endpoint: PUT /icu-doctor-visits/' + editingDoctorVisitId);
        response = await apiRequest<any>(`/icu-doctor-visits/${editingDoctorVisitId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        console.log('Doctor visit updated successfully:', response);
      } else {
        // Create new visit
        console.log('API Endpoint: POST /icu-doctor-visits');
        response = await apiRequest<any>('/icu-doctor-visits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        console.log('Doctor visit created successfully:', response);
      }

      // Close dialog and refresh doctor visits list
      setIsAddDoctorVisitDialogOpen(false);
      setEditingDoctorVisitId(null);
      
      // Refresh the doctor visits list
      if (icuAdmission?.patientICUAdmissionId) {
        await fetchPatientDoctorVisits(String(icuAdmission.patientICUAdmissionId));
      }

      // Reset form
      setDoctorVisitFormData({
        icuDoctorVisitId: '',
        icuAdmissionId: '',
        patientId: '',
        doctorId: '',
        doctorVisitedDateTime: '',
        visitsDetails: '',
        patientCondition: '',
        status: ''
      });
    } catch (err) {
      console.error('Error saving ICU Doctor Visit:', err);
      setDoctorVisitSubmitError(
        err instanceof Error ? err.message : 'Failed to save ICU Doctor Visit'
      );
    } finally {
      setDoctorVisitSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading ICU case details...</p>
        </div>
      </div>
    );
  }

  if (error || !icuAdmission) {
    return (
      <div className="flex-1 bg-blue-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'ICU admission not found'}</p>
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="size-4 mr-2" />
                Back to ICU Management
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-blue-100 flex flex-col overflow-hidden min-h-0">
      <div className="px-4 pt-4 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <div>
              <h1 className="text-gray-900 mb-0 text-xl">Manage ICU Case</h1>
              <p className="text-gray-500 text-sm">Patient ICU Admission ID: {icuAdmission.patientICUAdmissionId || icuAdmission.id}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto overflow-x-hidden px-4 pb-4" style={{ maxHeight: 'calc(100vh - 100px)', minHeight: 0 }}>
        {/* ICU Details Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>ICU Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <Label className="text-sm text-gray-500">Patient Name</Label>
                <p className="text-gray-900 font-medium mt-1">{icuAdmission.patientName || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Patient ID</Label>
                <p className="text-gray-900 font-medium mt-1">{icuAdmission.patientId || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Bed Number</Label>
                <p className="text-gray-900 font-medium mt-1">
                  <Badge variant="outline">{icuAdmission.bedNumber || 'N/A'}</Badge>
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Age</Label>
                <p className="text-gray-900 font-medium mt-1">{icuAdmission.age && icuAdmission.age > 0 ? `${icuAdmission.age} years` : 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Gender</Label>
                <p className="text-gray-900 font-medium mt-1">{icuAdmission.gender || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Admission Date and Time</Label>
                <p className="text-gray-900 font-medium mt-1">{icuAdmission.admissionDate || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Admission Time</Label>
                <p className="text-gray-900 font-medium mt-1">{icuAdmission.admissionTime || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Attending Doctor</Label>
                <p className="text-gray-900 font-medium mt-1">{icuAdmission.attendingDoctor || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Condition</Label>
                <p className="text-gray-900 font-medium mt-1">{icuAdmission.condition || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Severity</Label>
                <p className="mt-1">
                  <Badge variant={
                    icuAdmission.severity === 'Critical' ? 'destructive' :
                    icuAdmission.severity === 'Serious' ? 'default' : 'secondary'
                  }>
                    {icuAdmission.severity || 'Stable'}
                  </Badge>
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Ventilator Support</Label>
                <p className="mt-1">
                  <Badge variant={icuAdmission.ventilatorSupport ? 'default' : 'outline'}>
                    {icuAdmission.ventilatorSupport ? 'Yes' : 'No'}
                  </Badge>
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Diagnosis</Label>
                <p className="text-gray-900 font-medium mt-1">{icuAdmission.diagnosis || 'N/A'}</p>
              </div>
              
              {icuAdmission.treatment && (
                <div className="col-span-2">
                  <Label className="text-sm text-gray-500">Treatment</Label>
                  <p className="text-gray-900 font-medium mt-1">{icuAdmission.treatment}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Diagnosis & Treatment, Lab Tests, Doctor Visits, ICU Nurse Visits */}
        <Tabs defaultValue="diagnosis-treatment" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="diagnosis-treatment" className="gap-2">
              <FileText className="size-4" />
              Diagnosis & Treatment
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
              ICU Nurse Visits & Vitals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diagnosis-treatment" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Diagnosis & Treatment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Diagnosis Section */}
                  <div>
                    <Label className="text-base font-semibold text-gray-700 mb-3 block">Diagnosis</Label>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {icuAdmission.diagnosis && icuAdmission.diagnosis !== 'Not Specified' 
                          ? icuAdmission.diagnosis 
                          : icuAdmission.condition && icuAdmission.condition !== 'Not Specified'
                          ? icuAdmission.condition
                          : 'No diagnosis information available.'}
                      </p>
                    </div>
                  </div>

                  {/* Treatment Details Section */}
                  <div>
                    <Label className="text-base font-semibold text-gray-700 mb-3 block">Treatment Details</Label>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {icuAdmission.treatment && icuAdmission.treatment !== 'Not Specified' 
                          ? icuAdmission.treatment 
                          : 'No treatment details available.'}
                      </p>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {icuAdmission.condition && icuAdmission.condition !== 'Not Specified' && (
                      <div>
                        <Label className="text-sm text-gray-500">Patient Condition</Label>
                        <p className="text-gray-900 font-medium mt-1">{icuAdmission.condition}</p>
                      </div>
                    )}
                    {icuAdmission.severity && (
                      <div>
                        <Label className="text-sm text-gray-500">Severity Status</Label>
                        <p className="mt-1">
                          <Badge variant={
                            icuAdmission.severity === 'Critical' ? 'destructive' :
                            icuAdmission.severity === 'Serious' ? 'default' : 'secondary'
                          }>
                            {icuAdmission.severity}
                          </Badge>
                        </p>
                      </div>
                    )}
                    {icuAdmission.attendingDoctor && icuAdmission.attendingDoctor !== 'Not Assigned' && (
                      <div>
                        <Label className="text-sm text-gray-500">Attending Doctor</Label>
                        <p className="text-gray-900 font-medium mt-1">{icuAdmission.attendingDoctor}</p>
                      </div>
                    )}
                    {icuAdmission.ventilatorSupport !== undefined && (
                      <div>
                        <Label className="text-sm text-gray-500">Ventilator Support</Label>
                        <p className="mt-1">
                          <Badge variant={icuAdmission.ventilatorSupport ? 'default' : 'outline'}>
                            {icuAdmission.ventilatorSupport ? 'Yes' : 'No'}
                          </Badge>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lab-tests" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Lab Tests</CardTitle>
                  <Button
                    onClick={handleOpenAddLabTestDialog}
                    className="gap-2"
                  >
                    <Plus className="size-4" />
                    Add New Lab Tests Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {labTestsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading lab tests...</div>
                ) : labTestsError ? (
                  <div className="text-center py-8 text-red-500">{labTestsError}</div>
                ) : patientLabTests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No lab tests found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-gray-700">PatientLabTestsId</th>
                          <th className="text-left py-3 px-4 text-gray-700">PatientType</th>
                          <th className="text-left py-3 px-4 text-gray-700">PatientId</th>
                          <th className="text-left py-3 px-4 text-gray-700">LabTestId</th>
                          <th className="text-left py-3 px-4 text-gray-700">Priority</th>
                          <th className="text-left py-3 px-4 text-gray-700">LabTestDone</th>
                          <th className="text-left py-3 px-4 text-gray-700">ReportsUrl</th>
                          <th className="text-left py-3 px-4 text-gray-700">TestStatus</th>
                          <th className="text-left py-3 px-4 text-gray-700">TestDoneDateTime</th>
                          <th className="text-left py-3 px-4 text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientLabTests.map((test) => (
                          <tr key={test.patientLabTestId || test.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-mono text-xs">{test.patientLabTestId || test.id || 'N/A'}</td>
                            <td className="py-3 px-4">{(test as any).patientType || 'N/A'}</td>
                            <td className="py-3 px-4 font-mono text-xs">{(test as any).patientId || 'N/A'}</td>
                            <td className="py-3 px-4">{test.labTestId || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <Badge variant={test.priority === 'High' ? 'destructive' : test.priority === 'Urgent' ? 'default' : 'outline'}>
                                {test.priority || 'Normal'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={test.labTestDone === true || test.labTestDone === 'Yes' ? 'default' : 'secondary'}>
                                {test.labTestDone === true || test.labTestDone === 'Yes' ? 'Yes' : 'No'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              {test.reportsUrl ? (
                                <a href={test.reportsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                  View Report
                                </a>
                              ) : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={test.testStatus === 'Completed' ? 'default' : test.testStatus === 'InProgress' ? 'secondary' : 'outline'}>
                                {test.testStatus || test.status || 'N/A'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">{test.testDoneDateTime || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <Badge variant={test.status === 'Active' ? 'default' : 'secondary'}>
                                {test.status || 'N/A'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setViewingLabTest(test);
                                  setIsViewLabTestDialogOpen(true);
                                }}
                                className="gap-2"
                              >
                                <Eye className="size-4" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  handleOpenEditLabTestDialog(test);
                                }}
                                className="gap-2"
                              >
                                <Edit className="size-4" />
                                Edit
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

          <TabsContent value="doctor-visits" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Doctor Visits</CardTitle>
                  <Button
                    onClick={handleOpenAddDoctorVisitDialog}
                    className="gap-2"
                  >
                    <Plus className="size-4" />
                    Add ICU Doctor Visit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {doctorVisitsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading doctor visits...</div>
                ) : doctorVisitsError ? (
                  <div className="text-center py-8 text-red-500">{doctorVisitsError}</div>
                ) : patientDoctorVisits.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No doctor visits found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-gray-700">Doctor Visit ID</th>
                          <th className="text-left py-3 px-4 text-gray-700">Doctor</th>
                          <th className="text-left py-3 px-4 text-gray-700">Visit Date</th>
                          <th className="text-left py-3 px-4 text-gray-700">Visit Details</th>
                          <th className="text-left py-3 px-4 text-gray-700">Patient Condition</th>
                          <th className="text-left py-3 px-4 text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientDoctorVisits.map((visit) => (
                          <tr key={visit.icuDoctorVisitsId || (visit as any).iCUDoctorVisitId || visit.patientDoctorVisitId || visit.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">{visit.icuDoctorVisitsId || (visit as any).iCUDoctorVisitId || visit.patientDoctorVisitId || visit.id || 'N/A'}</td>
                            <td className="py-3 px-4">{visit.doctorName || 'N/A'}</td>
                            <td className="py-3 px-4">{visit.visitDate || 'N/A'}</td>
                            <td className="py-3 px-4">{(visit as any).visitsDetails || visit.notes || visit.visitsRemarks || 'N/A'}</td>
                            <td className="py-3 px-4">{visit.patientCondition || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <Badge variant={visit.status === 'Active' ? 'default' : visit.status === 'Completed' ? 'secondary' : 'destructive'}>
                                {visit.status || 'N/A'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Edit button clicked for visit:', visit);
                                  handleOpenEditDoctorVisitDialog(visit);
                                }}
                                className="gap-2"
                              >
                                <Edit className="size-4" />
                                Edit
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

          <TabsContent value="nurse-visits" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>ICU Nurse Visits & Vitals</CardTitle>
                  <Button
                    onClick={handleOpenAddICUVitalsDialog}
                    className="gap-2"
                  >
                    <Plus className="size-4" />
                    Add New ICU Vitals
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {icuVitalsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading ICU visit vitals...</div>
                ) : icuVitalsError ? (
                  <div className="text-center py-8 text-red-500">{icuVitalsError}</div>
                ) : icuVitalsList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No ICU visit vitals found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-gray-700">Vitals ID</th>
                          <th className="text-left py-3 px-4 text-gray-700">Recorded Date & Time</th>
                          <th className="text-left py-3 px-4 text-gray-700">HR</th>
                          <th className="text-left py-3 px-4 text-gray-700">BP</th>
                          <th className="text-left py-3 px-4 text-gray-700">Temp</th>
                          <th className="text-left py-3 px-4 text-gray-700">SpO₂</th>
                          <th className="text-left py-3 px-4 text-gray-700">RR</th>
                          <th className="text-left py-3 px-4 text-gray-700">Blood Sugar</th>
                          <th className="text-left py-3 px-4 text-gray-700">Daily/Hourly</th>
                          <th className="text-left py-3 px-4 text-gray-700">Nurse</th>
                          <th className="text-left py-3 px-4 text-gray-700">Patient Condition</th>
                          <th className="text-left py-3 px-4 text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {icuVitalsList.map((vital) => (
                          <tr key={vital.icuVisitVitalsId || vital.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">{vital.icuVisitVitalsId || 'N/A'}</td>
                            <td className="py-3 px-4">{vital.recordedDateTime || 'N/A'}</td>
                            <td className="py-3 px-4">{vital.heartRate ? `${vital.heartRate} bpm` : 'N/A'}</td>
                            <td className="py-3 px-4">{vital.bloodPressure || 'N/A'}</td>
                            <td className="py-3 px-4">{vital.temperature ? `${vital.temperature}°C` : 'N/A'}</td>
                            <td className="py-3 px-4">
                              {vital.oxygenSaturation || (vital as any).O2Saturation || (vital as any).O2 || (vital as any).o2Saturation 
                                ? `${vital.oxygenSaturation || (vital as any).O2Saturation || (vital as any).O2 || (vital as any).o2Saturation}%` 
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-4">{vital.respiratoryRate ? `${vital.respiratoryRate}/min` : 'N/A'}</td>
                            <td className="py-3 px-4">
                              {vital.bloodSugar || (vital as any).BloodSugar || (vital as any).bloodGlucose || (vital as any).Glucose
                                ? `${vital.bloodSugar || (vital as any).BloodSugar || (vital as any).bloodGlucose || (vital as any).Glucose} mg/dL` 
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-4">{vital.dailyOrHourlyVitals || 'N/A'}</td>
                            <td className="py-3 px-4">{vital.nurseId || 'N/A'}</td>
                            <td className="py-3 px-4">
                              {vital.patientCondition || (vital as any).patientStatus || (vital as any).PatientStatus || (vital as any).PatientCondition || 'N/A'}
                            </td>
                            <td className="py-3 px-4 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingICUVitalsId(vital.icuVisitVitalsId);
                                  // Extract O2Saturation with fallbacks
                                  const o2Value = vital.oxygenSaturation || (vital as any).O2Saturation || (vital as any).O2 || (vital as any).o2Saturation;
                                  // Extract BloodSugar with fallbacks
                                  const bloodSugarValue = vital.bloodSugar || (vital as any).BloodSugar || (vital as any).bloodGlucose || (vital as any).Glucose;
                                  // Extract PatientCondition/PatientStatus with fallbacks
                                  const patientConditionValue = vital.patientCondition || (vital as any).patientStatus || (vital as any).PatientStatus || (vital as any).PatientCondition || '';
                                  
                                  setIcuVitalsFormData({
                                    icuVisitVitalsId: String(vital.icuVisitVitalsId || ''),
                                    icuAdmissionId: String(vital.icuAdmissionId || icuAdmission?.patientICUAdmissionId || ''),
                                    patientId: String(vital.patientId || icuAdmission?.patientId || ''),
                                    heartRate: vital.heartRate ? String(vital.heartRate) : '',
                                    bloodPressure: vital.bloodPressure || '',
                                    temperature: vital.temperature ? String(vital.temperature) : '',
                                    oxygenSaturation: o2Value ? String(o2Value) : '',
                                    respiratoryRate: vital.respiratoryRate ? String(vital.respiratoryRate) : '',
                                    bloodSugar: bloodSugarValue ? String(bloodSugarValue) : '',
                                    recordedDateTime: vital.recordedDateTime ? vital.recordedDateTime.slice(0, 16) : '',
                                    recordedBy: vital.recordedBy || '',
                                    dailyOrHourlyVitals: vital.dailyOrHourlyVitals || '',
                                    nurseId: vital.nurseId ? String(vital.nurseId) : '',
                                    nurseVisitsDetails: vital.nurseVisitsDetails || '',
                                    patientCondition: patientConditionValue
                                  });
                                  setNurseSearchTerm(vital.nurseId ? String(vital.nurseId) : '');
                                  setShowNurseList(false);
                                  setIcuVitalsSubmitError(null);
                                  setIsAddICUVitalsDialogOpen(true);
                                }}
                                className="gap-2"
                              >
                                <Eye className="size-4" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingICUVitalsId(vital.icuVisitVitalsId);
                                  setIcuVitalsFormData({
                                    icuVisitVitalsId: String(vital.icuVisitVitalsId || ''),
                                    icuAdmissionId: String(vital.icuAdmissionId || icuAdmission?.patientICUAdmissionId || ''),
                                    patientId: String(vital.patientId || icuAdmission?.patientId || ''),
                                    heartRate: vital.heartRate ? String(vital.heartRate) : '',
                                    bloodPressure: vital.bloodPressure || '',
                                    temperature: vital.temperature ? String(vital.temperature) : '',
                                    oxygenSaturation: vital.oxygenSaturation ? String(vital.oxygenSaturation) : '',
                                    respiratoryRate: vital.respiratoryRate ? String(vital.respiratoryRate) : '',
                                    bloodSugar: vital.bloodSugar ? String(vital.bloodSugar) : '',
                                    recordedDateTime: vital.recordedDateTime ? vital.recordedDateTime.slice(0, 16) : '',
                                    recordedBy: vital.recordedBy || '',
                                    dailyOrHourlyVitals: vital.dailyOrHourlyVitals || '',
                                    nurseId: vital.nurseId ? String(vital.nurseId) : '',
                                    nurseVisitsDetails: vital.nurseVisitsDetails || '',
                                    patientCondition: vital.patientCondition || ''
                                  });
                                  setNurseSearchTerm(vital.nurseId ? String(vital.nurseId) : '');
                                  setShowNurseList(false);
                                  setIcuVitalsSubmitError(null);
                                  setIsAddICUVitalsDialogOpen(true);
                                }}
                                className="gap-2"
                              >
                                <Edit className="size-4" />
                                Edit
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

        {/* Add/Edit ICU Doctor Visit Dialog */}
        <Dialog open={isAddDoctorVisitDialogOpen} onOpenChange={setIsAddDoctorVisitDialogOpen}>
          <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]">
            <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
              <DialogTitle>{editingDoctorVisitId ? 'Edit ICU Doctor Visit' : 'Add ICU Doctor Visit'}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
              <div className="space-y-4 py-4">
                {doctorVisitSubmitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {doctorVisitSubmitError}
                  </div>
                )}

              <div className="grid grid-cols-2 gap-4">
                {editingDoctorVisitId && (
                  <div>
                    <Label htmlFor="icuDoctorVisitId">ICU Doctor Visit ID</Label>
                    <Input
                      id="icuDoctorVisitId"
                      value={doctorVisitFormData.icuDoctorVisitId}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="icuAdmissionId">ICU Admission ID</Label>
                  <Input
                    id="icuAdmissionId"
                    value={doctorVisitFormData.icuAdmissionId}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="patientId">Patient ID</Label>
                  <Input
                    id="patientId"
                    value={doctorVisitFormData.patientId}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="doctorId">Doctor ID *</Label>
                  <Input
                    id="doctorId"
                    value={doctorVisitFormData.doctorId}
                    onChange={(e) => setDoctorVisitFormData({ ...doctorVisitFormData, doctorId: e.target.value })}
                    placeholder="Enter Doctor ID"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="doctorVisitedDateTime">Doctor Visited Date & Time *</Label>
                  <Input
                    id="doctorVisitedDateTime"
                    type="datetime-local"
                    value={doctorVisitFormData.doctorVisitedDateTime}
                    onChange={(e) => setDoctorVisitFormData({ ...doctorVisitFormData, doctorVisitedDateTime: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="visitsDetails">Visit Details *</Label>
                  <Textarea
                    id="visitsDetails"
                    value={doctorVisitFormData.visitsDetails}
                    onChange={(e) => setDoctorVisitFormData({ ...doctorVisitFormData, visitsDetails: e.target.value })}
                    placeholder="Enter visit details..."
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="patientCondition">Patient Condition *</Label>
                  <Input
                    id="patientCondition"
                    value={doctorVisitFormData.patientCondition}
                    onChange={(e) => setDoctorVisitFormData({ ...doctorVisitFormData, patientCondition: e.target.value })}
                    placeholder="Enter patient condition"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={doctorVisitFormData.status}
                    onChange={(e) => setDoctorVisitFormData({ ...doctorVisitFormData, status: e.target.value })}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              </div>
            </div>
            <DialogFooter className="px-6 pb-4 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDoctorVisitDialogOpen(false);
                  setEditingDoctorVisitId(null);
                }}
                disabled={doctorVisitSubmitting}
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

        {/* Add ICU Nurse Visit Dialog */}
        <Dialog open={isAddNurseVisitDialogOpen} onOpenChange={setIsAddNurseVisitDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add ICU Nurse Visit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {nurseVisitSubmitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {nurseVisitSubmitError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nurseIcuAdmissionId">ICU Admission ID</Label>
                  <Input
                    id="nurseIcuAdmissionId"
                    value={nurseVisitFormData.icuAdmissionId}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="nursePatientId">Patient ID</Label>
                  <Input
                    id="nursePatientId"
                    value={nurseVisitFormData.patientId}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="nurseId">Nurse ID *</Label>
                  <Input
                    id="nurseId"
                    value={nurseVisitFormData.nurseId}
                    onChange={(e) => setNurseVisitFormData({ ...nurseVisitFormData, nurseId: e.target.value })}
                    placeholder="Enter Nurse ID"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nurseVisitedDateTime">Nurse Visited Date & Time *</Label>
                  <Input
                    id="nurseVisitedDateTime"
                    type="datetime-local"
                    value={nurseVisitFormData.nurseVisitedDateTime}
                    onChange={(e) => setNurseVisitFormData({ ...nurseVisitFormData, nurseVisitedDateTime: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="nurseVisitsDetails">Nurse Visits Details *</Label>
                  <Textarea
                    id="nurseVisitsDetails"
                    value={nurseVisitFormData.nurseVisitsDetails}
                    onChange={(e) => setNurseVisitFormData({ ...nurseVisitFormData, nurseVisitsDetails: e.target.value })}
                    placeholder="Enter nurse visit details..."
                    rows={4}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="nursePatientCondition">Patient Condition *</Label>
                  <Input
                    id="nursePatientCondition"
                    value={nurseVisitFormData.patientCondition}
                    onChange={(e) => setNurseVisitFormData({ ...nurseVisitFormData, patientCondition: e.target.value })}
                    placeholder="Enter patient condition"
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddNurseVisitDialogOpen(false)}
                disabled={nurseVisitSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveNurseVisit}
                disabled={nurseVisitSubmitting}
              >
                {nurseVisitSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add ICU Vitals Dialog */}
        <Dialog open={isAddICUVitalsDialogOpen} onOpenChange={setIsAddICUVitalsDialogOpen}>
          <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]">
            <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
              <DialogTitle>{editingICUVitalsId ? 'Edit ICU Visit Vitals' : 'Add ICU Visit Vitals'}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
              <div className="space-y-4 py-4">
                {icuVitalsSubmitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {icuVitalsSubmitError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vitalsIcuAdmissionId">ICU Admission ID</Label>
                    <Input
                      id="vitalsIcuAdmissionId"
                      value={icuVitalsFormData.icuAdmissionId}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vitalsPatientId">Patient ID</Label>
                    <Input
                      id="vitalsPatientId"
                      value={icuVitalsFormData.patientId}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                    <Input
                      id="heartRate"
                      type="number"
                      value={icuVitalsFormData.heartRate}
                      onChange={(e) => setIcuVitalsFormData({ ...icuVitalsFormData, heartRate: e.target.value })}
                      placeholder="Enter heart rate"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bloodPressure">Blood Pressure</Label>
                    <Input
                      id="bloodPressure"
                      value={icuVitalsFormData.bloodPressure}
                      onChange={(e) => setIcuVitalsFormData({ ...icuVitalsFormData, bloodPressure: e.target.value })}
                      placeholder="e.g., 120/80"
                    />
                  </div>
                  <div>
                    <Label htmlFor="temperature">Temperature (°C)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      value={icuVitalsFormData.temperature}
                      onChange={(e) => setIcuVitalsFormData({ ...icuVitalsFormData, temperature: e.target.value })}
                      placeholder="Enter temperature"
                    />
                  </div>
                  <div>
                    <Label htmlFor="oxygenSaturation">O₂ Saturation (%)</Label>
                    <Input
                      id="oxygenSaturation"
                      type="number"
                      value={icuVitalsFormData.oxygenSaturation}
                      onChange={(e) => setIcuVitalsFormData({ ...icuVitalsFormData, oxygenSaturation: e.target.value })}
                      placeholder="Enter O₂ saturation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="respiratoryRate">Respiratory Rate (/min)</Label>
                    <Input
                      id="respiratoryRate"
                      type="number"
                      value={icuVitalsFormData.respiratoryRate}
                      onChange={(e) => setIcuVitalsFormData({ ...icuVitalsFormData, respiratoryRate: e.target.value })}
                      placeholder="Enter respiratory rate"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bloodSugar">Blood Sugar (mg/dL)</Label>
                    <Input
                      id="bloodSugar"
                      type="number"
                      value={icuVitalsFormData.bloodSugar}
                      onChange={(e) => setIcuVitalsFormData({ ...icuVitalsFormData, bloodSugar: e.target.value })}
                      placeholder="Enter blood sugar"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recordedDateTime">Recorded Date & Time *</Label>
                    <Input
                      id="recordedDateTime"
                      type="datetime-local"
                      value={icuVitalsFormData.recordedDateTime}
                      onChange={(e) => setIcuVitalsFormData({ ...icuVitalsFormData, recordedDateTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="recordedBy">Recorded By</Label>
                    <Input
                      id="recordedBy"
                      value={icuVitalsFormData.recordedBy}
                      onChange={(e) => setIcuVitalsFormData({ ...icuVitalsFormData, recordedBy: e.target.value })}
                      placeholder="Enter name of person recording"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dailyOrHourlyVitals">Daily/Hourly Vitals *</Label>
                    <select
                      id="dailyOrHourlyVitals"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md"
                      value={icuVitalsFormData.dailyOrHourlyVitals}
                      onChange={(e) => setIcuVitalsFormData({ ...icuVitalsFormData, dailyOrHourlyVitals: e.target.value })}
                      required
                    >
                      <option value="">Select...</option>
                      <option value="Daily">Daily</option>
                      <option value="Hourly">Hourly</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="nurseId">Nurse *</Label>
                    <Input
                      id="nurseId"
                      value={nurseSearchTerm}
                      onChange={(e) => {
                        setNurseSearchTerm(e.target.value);
                        setShowNurseList(true);
                      }}
                      onFocus={() => setShowNurseList(true)}
                      placeholder="Search and select nurse..."
                      className="cursor-pointer"
                    />
                    {showNurseList && (
                      <div className="mt-1 border border-gray-200 rounded-md max-h-48 overflow-y-auto bg-white z-50 relative">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="text-left py-2 px-3 text-gray-700 font-semibold">ID</th>
                              <th className="text-left py-2 px-3 text-gray-700 font-semibold">Name</th>
                            </tr>
                          </thead>
                          <tbody>
                            {nurses
                              .filter((nurse) => {
                                if (!nurseSearchTerm) return true;
                                const searchLower = nurseSearchTerm.toLowerCase();
                                const name = (nurse.name || '').toLowerCase();
                                const id = String(nurse.id || '').toLowerCase();
                                return name.includes(searchLower) || id.includes(searchLower);
                              })
                              .map((nurse) => {
                                const isSelected = icuVitalsFormData.nurseId === String(nurse.id);
                                return (
                                  <tr
                                    key={nurse.id}
                                    onClick={() => {
                                      setIcuVitalsFormData({ ...icuVitalsFormData, nurseId: String(nurse.id) });
                                      setNurseSearchTerm(nurse.name || 'Unknown');
                                      setShowNurseList(false);
                                    }}
                                    className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''}`}
                                  >
                                    <td className="py-2 px-3 text-sm text-gray-900 font-mono">{nurse.id}</td>
                                    <td className="py-2 px-3 text-sm text-gray-600">{nurse.name || 'Unknown'}</td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                        {nurses.filter((nurse) => {
                          if (!nurseSearchTerm) return true;
                          const searchLower = nurseSearchTerm.toLowerCase();
                          const name = (nurse.name || '').toLowerCase();
                          const id = String(nurse.id || '').toLowerCase();
                          return name.includes(searchLower) || id.includes(searchLower);
                        }).length === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm">No nurses found</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="nurseVisitsDetails">Nurse Visits Details</Label>
                    <Textarea
                      id="nurseVisitsDetails"
                      value={icuVitalsFormData.nurseVisitsDetails}
                      onChange={(e) => setIcuVitalsFormData({ ...icuVitalsFormData, nurseVisitsDetails: e.target.value })}
                      placeholder="Enter nurse visit details..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="patientCondition">Patient Condition *</Label>
                    <select
                      id="patientCondition"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md"
                      value={icuVitalsFormData.patientCondition}
                      onChange={(e) => setIcuVitalsFormData({ ...icuVitalsFormData, patientCondition: e.target.value })}
                      required
                    >
                      <option value="">Select...</option>
                      <option value="Stable">Stable</option>
                      <option value="Notstable">Notstable</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="px-6 pb-4 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsAddICUVitalsDialogOpen(false)}
                disabled={icuVitalsSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveICUVitals}
                disabled={icuVitalsSubmitting}
              >
                {icuVitalsSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Patient Lab Test Dialog */}
        <Dialog open={isAddLabTestDialogOpen} onOpenChange={setIsAddLabTestDialogOpen}>
          <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]">
            <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
              <DialogTitle>{editingLabTestId ? 'Edit Lab Test Details' : 'Add New Lab Tests Details'}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
              <div className="space-y-4 py-4">
                {labTestSubmitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {labTestSubmitError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {editingLabTestId && (
                    <div>
                      <Label htmlFor="patientLabTestId">Patient Lab Test ID</Label>
                      <Input
                        id="patientLabTestId"
                        value={String(editingLabTestId)}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="labTestIcuAdmissionId">ICU Admission ID</Label>
                    <Input
                      id="labTestIcuAdmissionId"
                      value={labTestFormData.icuAdmissionId}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="labTestPatientId">Patient ID</Label>
                    <Input
                      id="labTestPatientId"
                      value={labTestFormData.patientId}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="labTestId">Lab Test *</Label>
                    <Input
                      id="labTestId"
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
                                const isSelected = labTestFormData.labTestId === testId;
                                return (
                                  <tr
                                    key={test.labTestId || test.id}
                                    onClick={() => {
                                      setLabTestFormData({ ...labTestFormData, labTestId: testId });
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
                    <Label htmlFor="priority">Priority *</Label>
                    <select
                      id="priority"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md"
                      value={labTestFormData.priority}
                      onChange={(e) => setLabTestFormData({ ...labTestFormData, priority: e.target.value })}
                      required
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="orderedDate">Ordered Date *</Label>
                    <Input
                      id="orderedDate"
                      type="date"
                      value={labTestFormData.orderedDate}
                      onChange={(e) => setLabTestFormData({ ...labTestFormData, orderedDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="orderedBy">Ordered By</Label>
                    <Input
                      id="orderedBy"
                      value={labTestFormData.orderedBy}
                      onChange={(e) => setLabTestFormData({ ...labTestFormData, orderedBy: e.target.value })}
                      placeholder="Enter name of person ordering"
                    />
                  </div>
                  <div>
                    <Label htmlFor="charges">Charges</Label>
                    <Input
                      id="charges"
                      type="number"
                      value={labTestFormData.charges}
                      onChange={(e) => setLabTestFormData({ ...labTestFormData, charges: e.target.value })}
                      placeholder="Enter charges (optional)"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={labTestFormData.description}
                      onChange={(e) => setLabTestFormData({ ...labTestFormData, description: e.target.value })}
                      placeholder="Enter description (optional)"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="patientType">Patient Type *</Label>
                    <select
                      id="patientType"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md"
                      value={labTestFormData.patientType}
                      onChange={(e) => {
                        setLabTestFormData({ 
                          ...labTestFormData, 
                          patientType: e.target.value,
                          appointmentId: '', // Reset conditional fields when type changes
                          roomAdmissionId: '',
                          emergencyBedSlotId: ''
                        });
                      }}
                      required
                    >
                      <option value="">Select...</option>
                      <option value="OPD">OPD</option>
                      <option value="IPD">IPD</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                  {labTestFormData.patientType === 'OPD' && (
                    <div>
                      <Label htmlFor="appointmentId">Appointment ID</Label>
                      <Input
                        id="appointmentId"
                        value={labTestFormData.appointmentId}
                        onChange={(e) => setLabTestFormData({ ...labTestFormData, appointmentId: e.target.value })}
                        placeholder="Enter Appointment ID (optional)"
                      />
                    </div>
                  )}
                  {labTestFormData.patientType === 'IPD' && (
                    <div>
                      <Label htmlFor="roomAdmissionId">Room Admission ID</Label>
                      <Input
                        id="roomAdmissionId"
                        value={labTestFormData.roomAdmissionId}
                        onChange={(e) => setLabTestFormData({ ...labTestFormData, roomAdmissionId: e.target.value })}
                        placeholder="Enter Room Admission ID (optional)"
                      />
                    </div>
                  )}
                  {labTestFormData.patientType === 'Emergency' && (
                    <div>
                      <Label htmlFor="emergencyBedSlotId">Emergency Bed Slot ID</Label>
                      <Input
                        id="emergencyBedSlotId"
                        value={labTestFormData.emergencyBedSlotId}
                        onChange={(e) => setLabTestFormData({ ...labTestFormData, emergencyBedSlotId: e.target.value })}
                        placeholder="Enter Emergency Bed Slot ID (optional)"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="labTestDone">Lab Test Done *</Label>
                    <select
                      id="labTestDone"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md"
                      value={labTestFormData.labTestDone}
                      onChange={(e) => setLabTestFormData({ ...labTestFormData, labTestDone: e.target.value })}
                      required
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="testStatus">Test Status *</Label>
                    <select
                      id="testStatus"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md"
                      value={labTestFormData.testStatus}
                      onChange={(e) => setLabTestFormData({ ...labTestFormData, testStatus: e.target.value })}
                      required
                    >
                      <option value="Pending">Pending</option>
                      <option value="InProgress">InProgress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="reportsUrl">Reports URL</Label>
                    <Input
                      id="reportsUrl"
                      value={labTestFormData.reportsUrl}
                      onChange={(e) => setLabTestFormData({ ...labTestFormData, reportsUrl: e.target.value })}
                      placeholder="Enter reports URL (optional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="testDoneDateTime">Test Done Date & Time</Label>
                    <Input
                      id="testDoneDateTime"
                      type="datetime-local"
                      value={labTestFormData.testDoneDateTime}
                      onChange={(e) => setLabTestFormData({ ...labTestFormData, testDoneDateTime: e.target.value })}
                      placeholder="Enter test done date and time"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="px-6 pb-4 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsAddLabTestDialogOpen(false)}
                disabled={labTestSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveLabTest}
                disabled={labTestSubmitting}
              >
                {labTestSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Patient Lab Test Dialog */}
        <Dialog open={isViewLabTestDialogOpen} onOpenChange={setIsViewLabTestDialogOpen}>
          <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]">
            <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
              <DialogTitle>View Lab Test Details</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
              <div className="space-y-4 py-4">
                {viewingLabTest && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">PatientLabTestsId</Label>
                      <p className="text-gray-900 font-medium mt-1 font-mono">{viewingLabTest.patientLabTestId || viewingLabTest.id || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">PatientType</Label>
                      <p className="text-gray-900 font-medium mt-1">{(viewingLabTest as any).patientType || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">PatientId</Label>
                      <p className="text-gray-900 font-medium mt-1 font-mono">{(viewingLabTest as any).patientId || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">LabTestId</Label>
                      <p className="text-gray-900 font-medium mt-1">{viewingLabTest.labTestId || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Priority</Label>
                      <p className="mt-1">
                        <Badge variant={viewingLabTest.priority === 'High' ? 'destructive' : 'outline'}>
                          {viewingLabTest.priority || 'Normal'}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">LabTestDone</Label>
                      <p className="mt-1">
                        <Badge variant={viewingLabTest.labTestDone === true || viewingLabTest.labTestDone === 'Yes' ? 'default' : 'secondary'}>
                          {viewingLabTest.labTestDone === true || viewingLabTest.labTestDone === 'Yes' ? 'Yes' : 'No'}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">ReportsUrl</Label>
                      <p className="text-gray-900 font-medium mt-1">
                        {viewingLabTest.reportsUrl ? (
                          <a href={viewingLabTest.reportsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {viewingLabTest.reportsUrl}
                          </a>
                        ) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">TestStatus</Label>
                      <p className="mt-1">
                        <Badge variant={viewingLabTest.testStatus === 'Completed' ? 'default' : viewingLabTest.testStatus === 'InProgress' ? 'secondary' : 'outline'}>
                          {viewingLabTest.testStatus || viewingLabTest.status || 'N/A'}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">TestDoneDateTime</Label>
                      <p className="text-gray-900 font-medium mt-1">{viewingLabTest.testDoneDateTime || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Status</Label>
                      <p className="mt-1">
                        <Badge variant={viewingLabTest.status === 'Active' ? 'default' : 'secondary'}>
                          {viewingLabTest.status || 'N/A'}
                        </Badge>
                      </p>
                    </div>
                    {viewingLabTest.description && (
                      <div className="col-span-2">
                        <Label className="text-sm text-gray-500">Description</Label>
                        <p className="text-gray-900 font-medium mt-1 whitespace-pre-wrap">{viewingLabTest.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="px-6 pb-4 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setIsViewLabTestDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

