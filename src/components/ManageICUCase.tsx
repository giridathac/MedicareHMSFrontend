import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Stethoscope, Heart, ArrowLeft, FileText, Plus, Eye, Edit } from 'lucide-react';
import { PatientDoctorVisit } from '../api/admissions';
import { apiRequest } from '../api/base';
import { useStaff } from '../hooks/useStaff';
import { useRoles } from '../hooks/useRoles';

interface ICUAdmission {
  id?: number | string;
  patientICUAdmissionId?: number | string; // UUID string
  patientId?: string; // UUID string
  patientNo?: string;
  patientName?: string;
  age?: number;
  gender?: string;
  bedNumber?: string;
  admissionDate?: string;
  admissionTime?: string;
  icuAllocationFromDate?: string;
  icuAllocationToDate?: string;
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { staff } = useStaff();
  const { roles } = useRoles();

  // Helper function to format date and time in dd-mm-yyyy hh:mm AM/PM format
  const formatDateTime = (dateString: string | undefined | null): string => {
    if (!dateString || dateString === 'N/A') return 'N/A';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';

      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const hoursStr = String(hours).padStart(2, '0');

      return `${day}-${month}-${year} ${hoursStr}:${minutes} ${ampm}`;
    } catch (error) {
      return 'N/A';
    }
  };
  
  const [icuAdmission, setIcuAdmission] = useState<ICUAdmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  const [patientDoctorVisits, setPatientDoctorVisits] = useState<PatientDoctorVisit[]>([]);
  const [doctorVisitsLoading, setDoctorVisitsLoading] = useState(false);
  const [doctorVisitsError, setDoctorVisitsError] = useState<string | null>(null);

  const [patientNurseVisits, setPatientNurseVisits] = useState<any[]>([]);
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
    // Get patientICUAdmissionId from URL search parameters (should be a UUID string)
    const patientICUAdmissionId = searchParams.get('patientICUAdmissionId') || searchParams.get('id');

    if (patientICUAdmissionId) {
      // Pass as string (UUID) - don't convert to number
      fetchICUAdmissionDetails(patientICUAdmissionId);
    } else {
      setError('Patient ICU Admission ID is missing from URL');
      setLoading(false);
    }
  }, [searchParams]);
  
  // Also listen for hash changes in case the component is already mounted
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash.split('?')[1] || '');
      const patientICUAdmissionId = params.get('patientICUAdmissionId') || params.get('id');
      
      if (patientICUAdmissionId && patientICUAdmissionId !== icuAdmission?.patientICUAdmissionId) {
        fetchICUAdmissionDetails(patientICUAdmissionId);
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [icuAdmission?.patientICUAdmissionId]);

  const fetchICUAdmissionDetails = async (patientICUAdmissionId: string) => {
    try {
      setLoading(true);
      setError(null);
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
        
        //console.log('*******************', apiurl);

        const response = await apiRequest<any>(apiUrl);

  
        console.log('API request completed');
        console.log('ICU admission details API response received');
        console.log('Response type:', typeof response);
        console.log('Response (RAW):', JSON.stringify(response, null, 2));
        
        // Handle different response structures: { data: {...} } or direct object
        admission = response?.data || response;

        console.log('admissssssssssssssssssion',admission);
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

          // Log all keys in the admission object to see what fields are actually present
          console.log('All keys in admission object:', Object.keys(admission));
          console.log('Full admission object structure:', JSON.stringify(admission, null, 2));

          // Check for bed number fields
          console.log('Bed number fields in response:', {
            bedNumber: admission.bedNumber,
            BedNumber: admission.BedNumber,
            bed_number: admission.bed_number,
            Bed_Number: admission.Bed_Number,
            bed: admission.bed,
            Bed: admission.Bed,
            icuBedNo: admission.icuBedNo,
            ICUBedNo: admission.ICUBedNo,
            icuBedNumber: admission.icuBedNumber,
            ICUBedNumber: admission.ICUBedNumber
          });
        }
        
        if (!admission) {
          throw new Error('ICU admission not found in response');
        }
      } catch (endpointError: any) {
        console.warn('Error fetching from specific endpoint, trying fallback method:', endpointError);
        
        // Fallback: Fetch all ICU admissions and find the matching one
        try {
          const allAdmissionsResponse = await apiRequest<any>('/patient-icu-admissions/icu-management');
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

      // Helper function to extract value with multiple field name variations
      const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
        for (const field of fieldVariations) {
          let value = data;
          const keys = field.split('.');
          for (const key of keys) {
            value = value?.[key];
            if (value === undefined || value === null) break;
          }
          if (value !== undefined && value !== null && value !== '' && typeof value !== 'object') {
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
        patientId: String(extractField(admission, [
          'patientId', 'PatientId', 'patient_id', 'Patient_ID',
          'PatientID', 'patientID', 'patientID', 'PATIENT_ID',
          'patient.id', 'Patient.Id', 'patient', 'Patient',
          'id', 'Id', 'admission.patientId', 'admission.PatientId',
          'admission.patient_id', 'admission.Patient_ID'
        ], '')) || '',
         patientNo: String(extractField(admission, [
          'patient.patientNo'], '')) || '',
        patientName: String(extractField(admission, [
          'patientName', 'PatientName', 'patient_name', 'Patient_Name',
          'name', 'Name', 'fullName', 'FullName',
          'patient.name', 'Patient.Name', 'patient.fullName', 'Patient.FullName',
          'patient.patientName', 'Patient.PatientName',
          'patient.patientName', 'Patient.patientName'
        ], 'Unknown Patient')) || 'Unknown Patient',
        age: Number(extractField(admission, [
          'age', 'Age', 'patientAge', 'PatientAge', 'patient_age', 'Patient_Age',
          'patient.age', 'Patient.age', 'patient_age', 'Patient_Age'
        ], 0)) || 0,
        gender: String(extractField(admission, [
          'gender', 'Gender', 'sex', 'Sex', 'patientGender', 'PatientGender',
          'patient.gender', 'Patient.gender', 'patient_gender', 'Patient_Gender'
        ], 'Unknown')) || 'Unknown',
        bedNumber: String(extractField(admission, [
          'icu.icuBedNo','icuBedNo','bedNumber', 'BedNumber', 'bed_number', 'Bed_Number',
          'bed', 'Bed', 'icuBedNo', 'ICUBedNo', 'icuBedNumber', 'ICUBedNumber',
          'bedNo', 'BedNo', 'bed_no', 'Bed_No', 'icu_bed_no', 'ICU_Bed_No',
          'icuBed', 'ICUBed', 'bedId', 'BedId', 'bed_id', 'Bed_Id',
          'icuBedId', 'ICUBedId', 'icu_bed_id', 'ICU_Bed_Id',
          'bed.number', 'Bed.Number', 'bed_number', 'Bed_Number',
          'icu.bedNo', 'ICU.BedNo', 'icu.bedNumber', 'ICU.BedNumber',
          'bedInfo.number', 'bedInfo.Number', 'bedInfo.bedNumber', 'bedInfo.BedNumber',
          'allocation.bedNumber', 'allocation.BedNumber', 'allocation.bed', 'allocation.Bed'
        ], '')) || '',
        admissionDate: String(extractField(admission, [
          'admissionDate', 'AdmissionDate', 'admission_date', 'Admission_Date',
          'admitDate', 'AdmitDate', 'admit_date', 'Admit_Date'
        ], '')) || '',
        admissionTime: String(extractField(admission, [
          'admissionTime', 'AdmissionTime', 'admission_time', 'Admission_Time',
          'admitTime', 'AdmitTime', 'admit_time', 'Admit_Time',
          'time', 'Time'
        ], '')) || '',
        icuAllocationFromDate: String(extractField(admission, [
          'admission.icuAllocationFromDate', 'ICUAllocationFromDate', 'icu_allocation_from_date', 'ICU_Allocation_From_Date',
          'allocationFromDate', 'AllocationFromDate', 'allocation_from_date', 'Allocation_From_Date'
        ], '')) || '',
        icuAllocationToDate: String(extractField(admission, [
          'admission.icuAllocationToDate', 'ICUAllocationToDate', 'icu_allocation_to_date', 'ICU_Allocation_To_Date',
          'allocationToDate', 'AllocationToDate', 'allocation_to_date', 'Allocation_To_Date'
        ], '')) || '',
        condition: String(extractField(admission, [
          'condition', 'Condition', 'patientCondition', 'PatientCondition',
          'diagnosis', 'Diagnosis', 'diagnosisDescription', 'DiagnosisDescription'
        ], 'Not Specified')) || 'Not Specified',
        severity: String(extractField(admission, [
          'severity', 'Severity', 'patientSeverity', 'PatientSeverity',
          'admission.icuPatientStatus', 'ICUPatientStatus', 'icu_patient_status', 'ICU_Patient_Status',
          'status', 'Status', 'patientStatus', 'PatientStatus'
        ], 'Stable')) || 'Stable',
        attendingDoctor: String(extractField(admission, [
          'attendingDoctorName','attendingDoctor.userName', 'AttendingDoctor', 'attending_doctor', 'Attending_Doctor',
          'doctor', 'Doctor', 'doctorName', 'DoctorName', 'admittedBy', 'AdmittedBy'
        ], 'Not Assigned')) || 'Not Assigned',
        diagnosis: String(extractField(admission, [
          'admission.diagnosis', 'Diagnosis', 'diagnosisDescription', 'DiagnosisDescription',
          'diagnosis_desc', 'Diagnosis_Desc'
        ], 'Not Specified')) || 'Not Specified',
        treatment: String(extractField(admission, [
          'admission.treatementDetails','treatment', 'Treatment', 'treatmentPlan', 'TreatmentPlan',
          'treatment_plan', 'Treatment_Plan', 'medications', 'Medications'
        ], 'Not Specified')) || 'Not Specified',
        ventilatorSupport: extractField(admission, [
          'ventilatorSupport', 'VentilatorSupport', 'ventilator_support', 'Ventilator_Support',
          'admission.onVentilator', 'OnVentilator', 'isVentilatorAttached', 'IsVentilatorAttached',
          'ventilator', 'Ventilator'
        ], false),
        vitals: {
          heartRate: Number(extractField(admission, [
            'heartRate', 'HeartRate', 'heart_rate', 'Heart_Rate',
            'vitals.heartRate', 'vitals.HeartRate'
          ], 0)) || 0,
          bloodPressure: String(extractField(admission, [
            'bloodPressure', 'BloodPressure', 'blood_pressure', 'Blood_Pressure',
            'bp', 'BP', 'vitals.bloodPressure', 'vitals.BloodPressure'
          ], '0/0')) || '0/0',
          temperature: Number(extractField(admission, [
            'temperature', 'Temperature', 'temp', 'Temp',
            'vitals.temperature', 'vitals.Temperature'
          ], 0)) || 0,
          oxygenSaturation: Number(extractField(admission, [
            'oxygenSaturation','oxygenSaturation', 'OxygenSaturation', 'oxygen_saturation', 'Oxygen_Saturation',
            'o2Sat', 'O2Sat', 'spo2', 'SpO2', 'vitals.oxygenSaturation', 'vitals.OxygenSaturation'
          ], 0)) || 0,
          respiratoryRate: Number(extractField(admission, [
            'respiratoryRate', 'RespiratoryRate', 'respiratory_rate', 'Respiratory_Rate',
            'rr', 'RR', 'vitals.respiratoryRate', 'vitals.RespiratoryRate'
          ], 0)) || 0,
        },
      };

      setIcuAdmission(mappedAdmission);
      
      // Fetch patient lab tests, doctor visits, and nurse visits after admission is loaded
      // Use patientICUAdmissionId (UUID string) for API calls
      const patientICUAdmissionIdForAPI = mappedAdmission.patientICUAdmissionId || patientICUAdmissionId;
      if (patientICUAdmissionIdForAPI) {
        // Use the UUID string directly for doctor visits and nurse visits APIs
        fetchPatientDoctorVisits(String(patientICUAdmissionIdForAPI));
        //fetchPatientNurseVisits(String(patientICUAdmissionIdForAPI));
        fetchICUVitalsList(String(patientICUAdmissionIdForAPI));
        
        // Fetch lab tests using ICU admission ID (can be string UUID or number)
        //fetchPatientLabTests(String(patientICUAdmissionIdForAPI));
      }
    } catch (err) {
      console.error('Error fetching ICU admission details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ICU admission details');
    } finally {
      setLoading(false);
    }
  };

  

  const fetchPatientDoctorVisits = async (patientICUAdmissionId: string) => {
    try {
      setDoctorVisitsLoading(true);
      setDoctorVisitsError(null);
      // Call the new ICU doctor visits API endpoint
      const response = await apiRequest<any>(`/icu-doctor-visits/icu-admission/${patientICUAdmissionId}`);

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
      
      setPatientDoctorVisits(mappedDoctorVisits);
    } catch (err) {
      console.error('Error fetching ICU doctor visits:', err);
      setDoctorVisitsError(err instanceof Error ? err.message : 'Failed to load ICU doctor visits');
      setPatientDoctorVisits([]);
    } finally {
      setDoctorVisitsLoading(false);
    }
  };

  

  // Fetch ICU visit vitals for the current ICU admission
  const fetchICUVitalsList = async (patientICUAdmissionId: string) => {
    try {
      setIcuVitalsLoading(true);
      setIcuVitalsError(null);
      const endpoint = `/icu-visit-vitals/icu-admission/${encodeURIComponent(patientICUAdmissionId)}`;
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
            'O2Saturation','oxygenSaturation', 'OxygenSaturation', 'O2Saturation', 'o2Saturation',
            'O2', 'o2', 'O2Sat', 'o2Sat', 'SpO2', 'spo2', 'spO2',
            'oxygenSaturationLevel', 'OxygenSaturationLevel',
            'o2_saturation', 'O2_Saturation', 'oxygen_saturation', 'Oxygen_Saturation',
            'o2sat', 'O2sat', 'o2Saturation', 'O2Saturation',
            'saturation', 'Saturation', 'o2_level', 'O2_Level'
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
          nurseName: extract(v,['nurseName', 'NurseName']),
          nurseVisitsDetails: extract(v, ['nurseVisitsDetails', 'NurseVisitsDetails', 'visitsDetails', 'VisitsDetails']),
          patientCondition: extract(v, [
            'patientCondition', 'PatientCondition', 'patientStatus', 'PatientStatus',
            'condition', 'Condition', 'status', 'Status'
          ]),
        };
      };

      const mapped = vitalsData.map(mapVitals);
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
    navigate('/icu');
  };

 
  

  

  

  // Handle opening Add ICU Vitals dialog
  const handleOpenAddICUVitalsDialog = () => {
    if (icuAdmission) {
      const patientId = String(icuAdmission.patientId || '');
      const icuAdmissionId = String(icuAdmission.patientICUAdmissionId || icuAdmission.id || '');
      
      if (!patientId || patientId === 'undefined' || patientId === '') {
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
        payload.O2Saturation = o2Val; // send O2Saturation as backend field
        payload.O2 = o2Val; // send alias in case backend expects O2
        payload.SpO2 = o2Val; // send SpO2 as another possible alias
      } else {
        payload.OxygenSaturation = null;
        payload.O2Saturation = null;
        payload.O2 = null;
        payload.SpO2 = null;
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
      } else {
        const response = await apiRequest<any>('/icu-visit-vitals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      // Close dialog
      setIsAddICUVitalsDialogOpen(false);
      
      // Refresh vitals and nurse visits
      if (icuAdmission?.patientICUAdmissionId) {
        await fetchICUVitalsList(String(icuAdmission.patientICUAdmissionId));
        //await fetchPatientNurseVisits(String(icuAdmission.patientICUAdmissionId));
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

      // Call the API to create the ICU nurse visit
      const response = await apiRequest<any>('/icu-nurse-visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Close dialog and refresh nurse visits list
      setIsAddNurseVisitDialogOpen(false);
      
      // Refresh the nurse visits list
      if (icuAdmission?.patientICUAdmissionId) {
        //await fetchPatientNurseVisits(String(icuAdmission.patientICUAdmissionId));
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
        icuDoctorVisitId: '',
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
    // Extract ICU Doctor Visit ID (primary key for ICU Doctor Visits)
    // Prioritize icuDoctorVisitsId (plural) as the primary key
    const icuDoctorVisitsId = visit.icuDoctorVisitsId || (visit as any).icuDoctorVisitsId ||
                              (visit as any).ICUDoctorVisitsId || (visit as any).iCUDoctorVisitsId ||
                              (visit as any).icuDoctorVisitId || (visit as any).ICUDoctorVisitId ||
                              (visit as any).iCUDoctorVisitId || visit.patientDoctorVisitId || visit.id;
    const visitId = visit.patientDoctorVisitId || visit.id;

    if (!icuDoctorVisitsId && !visitId) {
      alert('Error: Cannot edit visit - Visit ID not found');
      return;
    }

    if (!icuAdmission) {
      alert('Error: ICU Admission details not loaded. Please wait and try again.');
      return;
    }

    const finalVisitId = icuDoctorVisitsId || visitId;
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

    setDoctorVisitFormData(formData);
    setDoctorVisitSubmitError(null);

    setIsAddDoctorVisitDialogOpen(true);
  };

  // Handle saving ICU Doctor Visit (both create and update)
  const handleSaveDoctorVisit = async () => {
    try {
      setDoctorVisitSubmitting(true);
      setDoctorVisitSubmitError(null);

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

      let response;
      if (editingDoctorVisitId) {
        // Update existing visit
        response = await apiRequest<any>(`/icu-doctor-visits/${editingDoctorVisitId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new visit
        response = await apiRequest<any>('/icu-doctor-visits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
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
              <div className="text-gray-500 text-sm space-y-1">
                <p>Patient ICU Admission ID: {icuAdmission.patientICUAdmissionId || icuAdmission.id}</p>
               
                
               
              </div>
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
                <p className="text-gray-900 font-medium mt-1">{icuAdmission.patientName || 'N/A'} </p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Patient ID</Label>
                <p className="text-gray-900 font-medium mt-1">{icuAdmission.patientId || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Patient No</Label>
                <p className="text-gray-900 font-medium mt-1">{icuAdmission.patientNo || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Bed Number</Label>
                <p className="text-gray-900 font-medium mt-1">{icuAdmission.bedNumber || 'N/A'}</p>
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
                <Label className="text-sm text-gray-500">ICU Allocation From Date</Label>
                <p className="text-gray-900 font-medium mt-1">{formatDateTime(icuAdmission.icuAllocationFromDate)}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">ICU Allocation To Date</Label>
                <p className="text-gray-900 font-medium mt-1">{formatDateTime(icuAdmission.icuAllocationToDate)}</p>
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
              <div>
                <Label className="text-sm text-gray-500">Treatment</Label>
                <p className="text-gray-900 font-medium mt-1">{icuAdmission.treatment || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Diagnosis & Treatment, Lab Tests, Doctor Visits, ICU Nurse Visits */}
        <Tabs defaultValue="diagnosis-treatment" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="diagnosis-treatment" className="gap-2">
              <FileText className="size-4" />
              Diagnosis & Treatment
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
                   
                  </div>
                </div>
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
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
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
                            <td className="py-3 px-4">{vital.heartRate != null ? `${vital.heartRate} bpm` : 'N/A'}</td>
                            <td className="py-3 px-4">{vital.bloodPressure || 'N/A'}</td>
                            <td className="py-3 px-4">{vital.temperature != null ? `${vital.temperature}°C` : 'N/A'}</td>
                            <td className="py-3 px-4">
                              {vital.oxygenSaturation != null || (vital as any).O2Saturation != null || (vital as any).O2 != null || (vital as any).o2Saturation != null
                                ? `${vital.oxygenSaturation ?? (vital as any).O2Saturation ?? (vital as any).O2 ?? (vital as any).o2Saturation}%`
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-4">{vital.respiratoryRate != null ? `${vital.respiratoryRate}/min` : 'N/A'}</td>
                            <td className="py-3 px-4">
                              {vital.bloodSugar != null || (vital as any).BloodSugar != null || (vital as any).bloodGlucose != null || (vital as any).Glucose != null
                                ? `${vital.bloodSugar ?? (vital as any).BloodSugar ?? (vital as any).bloodGlucose ?? (vital as any).Glucose} mg/dL`
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-4">{vital.dailyOrHourlyVitals || 'N/A'}</td>
                            <td className="py-3 px-4">{vital.nurseName || 'N/A'}</td>
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
                      <option value="Unstable">Unstable</option>
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

       
      </div>
    </div>
  );
}

