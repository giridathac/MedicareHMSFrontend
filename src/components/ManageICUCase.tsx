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
import { Stethoscope, Heart, ArrowLeft, FileText, Plus, Edit } from 'lucide-react';
import { PatientDoctorVisit } from '../api/admissions';
import { apiRequest } from '../api/base';
import { useStaff } from '../hooks/useStaff';
import { useRoles } from '../hooks/useRoles';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { doctorsApi } from '../api/doctors';
import '../styles/dashboard.css';

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
    if (!dateString || dateString === 'N/A' || dateString === '') return 'N/A';

    try {
      let date: Date;
      
      // Handle dd-MM-yyyy HH:mm format (e.g., "13-01-2026 17:12")
      if (typeof dateString === 'string' && /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}/.test(dateString)) {
        const parts = dateString.split(' ');
        const datePart = parts[0]; // "13-01-2026"
        const timePart = parts[1]; // "17:12"
        
        const [day, month, year] = datePart.split('-');
        const [hours24, minutes] = timePart.split(':');
        
        // Create date in ISO format: YYYY-MM-DDTHH:mm:ss
        const isoString = `${year}-${month}-${day}T${hours24}:${minutes}:00`;
        date = new Date(isoString);
      }
      // Handle YYYY-MM-DD HH:MM:SS format (space-separated)
      else if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateString)) {
        // Replace space with 'T' for ISO format
        const isoString = dateString.replace(' ', 'T');
        date = new Date(isoString);
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Invalid date format:', dateString);
        return 'N/A';
      }

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
      console.warn('Error formatting date:', error, dateString);
      return 'N/A';
    }
  };

  // Helper function to format date only in dd-mm-yyyy format
  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString || dateString === 'N/A') return 'N/A';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}-${month}-${year}`;
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
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [doctorVisitedDateTime, setDoctorVisitedDateTime] = useState<Date | null>(null);
  
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
  const [icuVitalsRecordedDateTime, setIcuVitalsRecordedDateTime] = useState<Date | null>(null);
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

  // Load doctors list
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const doctorsList = await doctorsApi.getAll();
        setAvailableDoctors(doctorsList || []);
      } catch (error) {
        console.error('Error loading doctors:', error);
      }
    };
    loadDoctors();
  }, []);

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
          doctorId: extractField(visit, ['doctorId', 'DoctorId', 'doctor_id', 'Doctor_ID', 'DoctorId', 'doctorId'], ''),
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
      console.log('ICU Visit Vitals API Response (RAW):', JSON.stringify(response, null, 2));
      const vitalsData = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      console.log('ICU Visit Vitals Data (extracted):', vitalsData);
      if (vitalsData.length > 0) {
        console.log('First vital raw object keys:', Object.keys(vitalsData[0]));
        console.log('First vital raw object:', vitalsData[0]);
      }

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
          recordedDateTime: extract(v, [
            'recordedDateTime', 'RecordedDateTime', 
            'recordedDate', 'RecordedDate', 
            'dateTime', 'DateTime', 'DateAndTime', 'dateAndTime',
            'recordedAt', 'RecordedAt', 'createdAt', 'CreatedAt',
            'visitDateTime', 'VisitDateTime', 'visitDate', 'VisitDate',
            'recordedDateAndTime', 'RecordedDateAndTime',
            'recorded_date_time', 'Recorded_Date_Time', 'RECORDED_DATE_TIME',
            'recorded_date', 'Recorded_Date', 'RECORDED_DATE'
          ]),
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
      // Debug: Log first vital to check recordedDateTime
      if (mapped.length > 0) {
        console.log('First ICU vital record (mapped):', mapped[0]);
        console.log('recordedDateTime value:', mapped[0].recordedDateTime);
        console.log('Raw API response (first item):', vitalsData[0]);
        console.log('All keys in raw response:', Object.keys(vitalsData[0] || {}));
      }
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
        recordedDateTime: '',
        recordedBy: '',
        dailyOrHourlyVitals: '',
        nurseId: '',
        nurseVisitsDetails: '',
        patientCondition: ''
      });
      setIcuVitalsRecordedDateTime(new Date());
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

      // Get ICUAdmissionId and PatientId from icuAdmission (not from form, as they're hidden)
      const icuAdmissionIdValue = icuAdmission?.patientICUAdmissionId || icuAdmission?.id || '';
      const patientIdValue = icuAdmission?.patientId || '';
      
      if (!icuAdmissionIdValue) {
        throw new Error('ICU Admission ID is required. Please ensure the ICU admission is loaded.');
      }
      
      if (!patientIdValue) {
        throw new Error('Patient ID is required. Please ensure the ICU admission has a valid patient ID.');
      }
      
      if (!icuVitalsRecordedDateTime) {
        throw new Error('Recorded Date & Time is required');
      }

      // Convert DatePicker date to YYYY-MM-DD HH:MM:SS format for backend
      let recordedDateTimeISO = '';
      if (icuVitalsRecordedDateTime) {
        const year = icuVitalsRecordedDateTime.getFullYear();
        const month = String(icuVitalsRecordedDateTime.getMonth() + 1).padStart(2, '0');
        const day = String(icuVitalsRecordedDateTime.getDate()).padStart(2, '0');
        const hours = String(icuVitalsRecordedDateTime.getHours()).padStart(2, '0');
        const minutes = String(icuVitalsRecordedDateTime.getMinutes()).padStart(2, '0');
        const seconds = String(icuVitalsRecordedDateTime.getSeconds()).padStart(2, '0');
        recordedDateTimeISO = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }

      // Prepare the request payload - only include fields that have values
      const payload: any = {
        ICUAdmissionId: String(icuAdmissionIdValue).trim(), // UUID string
        PatientId: String(patientIdValue).trim(), // UUID string - required
        RecordedDateTime: recordedDateTimeISO, // YYYY-MM-DD HH:MM:SS format
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
      setIcuVitalsRecordedDateTime(null);
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
        doctorId: '',
        doctorVisitedDateTime: '',
        visitsDetails: '',
        patientCondition: icuAdmission.condition || '',
        status: 'Active'
      });
      setDoctorVisitedDateTime(new Date());
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

    // Parse date for DatePicker - handle various date formats from API
    let dateTimeValue: Date | null = null;
    const rawDateTime = visit.visitDate || (visit as any).doctorVisitedDateTime || (visit as any).DoctorVisitedDateTime;
    
    if (rawDateTime) {
      try {
        // Try parsing as ISO string or date string
        const date = new Date(rawDateTime);
        if (!isNaN(date.getTime())) {
          dateTimeValue = date;
        }
      } catch (e) {
        console.warn('Error parsing date for DatePicker:', e);
      }
    }
    
    // If no valid date, use current date/time
    if (!dateTimeValue) {
      dateTimeValue = new Date();
    }

    // Extract doctorId from visit - check multiple possible field names
    const visitDoctorId = (visit as any).doctorId || (visit as any).DoctorId || 
                         (visit as any).doctor_id || (visit as any).Doctor_ID ||
                         visit.doctorId || '';
    
    // If we have doctorName but no doctorId, try to find the doctor in availableDoctors
    let finalDoctorId = String(visitDoctorId || '');
    if (!finalDoctorId && visit.doctorName && availableDoctors.length > 0) {
      const foundDoctor = availableDoctors.find((doc: any) => {
        const docName = doc.name || doc.Name || doc.UserName || '';
        return docName.toLowerCase() === String(visit.doctorName || '').toLowerCase();
      });
      if (foundDoctor) {
        finalDoctorId = String(foundDoctor.id || foundDoctor.Id || foundDoctor.UserId || '');
      }
    }

    const formData = {
      icuDoctorVisitId: String(icuDoctorVisitsId || visitId || ''),
      icuAdmissionId: String(icuAdmission.patientICUAdmissionId || icuAdmission.id || ''),
      patientId: String(icuAdmission.patientId || ''),
      doctorId: finalDoctorId,
      doctorVisitedDateTime: '', // Not used with DatePicker, but keep for compatibility
      visitsDetails: (visit as any).visitsDetails || visit.notes || visit.visitsRemarks || '',
      patientCondition: visit.patientCondition || '',
      status: visit.status || 'Active'
    };

    setDoctorVisitFormData(formData);
    setDoctorVisitedDateTime(dateTimeValue);
    setDoctorVisitSubmitError(null);

    setIsAddDoctorVisitDialogOpen(true);
  };

  // Handle saving ICU Doctor Visit (both create and update)
  const handleSaveDoctorVisit = async () => {
    try {
      setDoctorVisitSubmitting(true);
      setDoctorVisitSubmitError(null);

      // Validate required fields
      if (!doctorVisitFormData.icuAdmissionId || !doctorVisitFormData.patientId || !doctorVisitFormData.doctorId || !doctorVisitedDateTime) {
        throw new Error('ICU Admission ID, Patient ID, Doctor ID, and Doctor Visited Date & Time are required');
      }

      // Convert DatePicker date to ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS) for backend
      let doctorVisitedDateTimeISO = '';
      if (doctorVisitedDateTime) {
        const year = doctorVisitedDateTime.getFullYear();
        const month = String(doctorVisitedDateTime.getMonth() + 1).padStart(2, '0');
        const day = String(doctorVisitedDateTime.getDate()).padStart(2, '0');
        const hours = String(doctorVisitedDateTime.getHours()).padStart(2, '0');
        const minutes = String(doctorVisitedDateTime.getMinutes()).padStart(2, '0');
        const seconds = String(doctorVisitedDateTime.getSeconds()).padStart(2, '0');
        // Use ISO format: YYYY-MM-DD HH:MM:SS (backend accepts both YYYY-MM-DD HH:MM:SS and YYYY-MM-DDTHH:MM:SS)
        doctorVisitedDateTimeISO = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }

      // Prepare the request payload according to API signature
      const payload: any = {
        ICUAdmissionId: String(doctorVisitFormData.icuAdmissionId).trim(), // String UUID (required)
        PatientId: String(doctorVisitFormData.patientId).trim(), // String UUID (required)
        DoctorId: Number(doctorVisitFormData.doctorId), // Number (required)
        DoctorVisitedDateTime: doctorVisitedDateTimeISO, // String ISO format (required)
      };

      // Optional fields - only include if they have values
      if (doctorVisitFormData.visitsDetails && doctorVisitFormData.visitsDetails.trim() !== '') {
        payload.VisitsDetails = doctorVisitFormData.visitsDetails.trim();
      }
      if (doctorVisitFormData.patientCondition && doctorVisitFormData.patientCondition.trim() !== '') {
        payload.PatientCondition = doctorVisitFormData.patientCondition.trim();
      }
      if (staff?.id || staff?.userId) {
        payload.VisitCreatedBy = Number(staff.id || staff.userId);
      }
      // Status defaults to "Active" if not provided
      payload.Status = doctorVisitFormData.status || 'Active';

      let response;
      if (editingDoctorVisitId) {
        // Update existing visit - all fields are optional for PUT
        const updatePayload: any = {};
        
        // Only include fields that have values
        if (doctorVisitFormData.icuAdmissionId && doctorVisitFormData.icuAdmissionId.trim() !== '') {
          updatePayload.ICUAdmissionId = String(doctorVisitFormData.icuAdmissionId).trim();
        }
        if (doctorVisitFormData.patientId && doctorVisitFormData.patientId.trim() !== '') {
          updatePayload.PatientId = String(doctorVisitFormData.patientId).trim();
        }
        if (doctorVisitFormData.doctorId && doctorVisitFormData.doctorId.trim() !== '') {
          updatePayload.DoctorId = Number(doctorVisitFormData.doctorId);
        }
        if (doctorVisitedDateTimeISO) {
          updatePayload.DoctorVisitedDateTime = doctorVisitedDateTimeISO;
        }
        if (doctorVisitFormData.visitsDetails && doctorVisitFormData.visitsDetails.trim() !== '') {
          updatePayload.VisitsDetails = doctorVisitFormData.visitsDetails.trim();
        }
        if (doctorVisitFormData.patientCondition && doctorVisitFormData.patientCondition.trim() !== '') {
          updatePayload.PatientCondition = doctorVisitFormData.patientCondition.trim();
        }
        if (staff?.id || staff?.userId) {
          updatePayload.VisitCreatedBy = Number(staff.id || staff.userId);
        }
        if (doctorVisitFormData.status) {
          updatePayload.Status = doctorVisitFormData.status;
        }
        
        response = await apiRequest<any>(`/icu-doctor-visits/${editingDoctorVisitId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload),
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
                  <h1 className="dashboard-header">Manage ICU Case</h1>
                </div>
              </div>
            </div>
          </div>
          <div className="dashboard-main-content">
            <Card className="dashboard-table-card">
              <CardContent className="dashboard-table-card-content">
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{error || 'ICU admission not found'}</p>
                  <Button onClick={handleBack} variant="outline">
                    <ArrowLeft className="size-4 mr-2" />
                    Back to ICU Management
                  </Button>
                </div>
              </CardContent>
            </Card>
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
                <h1 className="dashboard-header">Manage ICU Case</h1>
                <p className="dashboard-subheader">Patient ICU Admission ID: {icuAdmission.patientICUAdmissionId || icuAdmission.id}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-main-content">
        {/* ICU Details Section */}
        <Card className="dashboard-table-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>ICU Details</CardTitle>
          </CardHeader>
          <CardContent className="dashboard-table-card-content">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <Label className="text-sm text-gray-500">Patient Name</Label>
                <p className="text-gray-900 font-medium mt-1">{icuAdmission.patientName || 'N/A'} </p>
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
                <p className="text-gray-900 font-medium mt-1">{formatDate(icuAdmission.icuAllocationToDate)}</p>
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
                  {(() => {
                    const severity = icuAdmission.severity || 'Stable';
                    const severityLower = String(severity).toLowerCase();
                    let bgColor = '';
                    
                    if (severityLower.includes('critical')) {
                      bgColor = 'bg-red-500';
                    } else if (severityLower.includes('serious')) {
                      bgColor = 'bg-orange-500';
                    } else {
                      bgColor = 'bg-green-500';
                    }
                    
                    return (
                      <Badge className={`${bgColor} text-white border-0`}>
                        {severity}
                      </Badge>
                    );
                  })()}
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
            <Card className="dashboard-table-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Diagnosis & Treatment Details</CardTitle>
              </CardHeader>
              <CardContent className="dashboard-table-card-content">
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
            <Card className="dashboard-table-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center justify-between w-full">
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
              <CardContent className="dashboard-table-card-content">
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
            <Card className="dashboard-table-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center justify-between w-full">
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
              <CardContent className="dashboard-table-card-content">
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
                          <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">Recorded Date & Time</th>
                          <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">HR</th>
                          <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">BP</th>
                          <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">Temp</th>
                          <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">SpO₂</th>
                          <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">RR</th>
                          <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">Blood Sugar</th>
                          <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">Daily/Hourly</th>
                          <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">Nurse</th>
                          <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">Patient Condition</th>
                          <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {icuVitalsList.map((vital) => (
                          <tr key={vital.icuVisitVitalsId || vital.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 whitespace-nowrap">
                              {formatDateTime(
                                vital.recordedDateTime || 
                                (vital as any).RecordedDateTime || 
                                (vital as any).recordedDate || 
                                (vital as any).RecordedDate ||
                                (vital as any).dateTime ||
                                (vital as any).DateTime ||
                                (vital as any).recordedAt ||
                                (vital as any).RecordedAt ||
                                (vital as any).visitDateTime ||
                                (vital as any).VisitDateTime
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">{vital.heartRate != null ? `${vital.heartRate} bpm` : 'N/A'}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{vital.bloodPressure || 'N/A'}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{vital.temperature != null ? `${vital.temperature}°C` : 'N/A'}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {vital.oxygenSaturation != null || (vital as any).O2Saturation != null || (vital as any).O2 != null || (vital as any).o2Saturation != null
                                ? `${vital.oxygenSaturation ?? (vital as any).O2Saturation ?? (vital as any).O2 ?? (vital as any).o2Saturation}%`
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">{vital.respiratoryRate != null ? `${vital.respiratoryRate}/min` : 'N/A'}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {vital.bloodSugar != null || (vital as any).BloodSugar != null || (vital as any).bloodGlucose != null || (vital as any).Glucose != null
                                ? `${vital.bloodSugar ?? (vital as any).BloodSugar ?? (vital as any).bloodGlucose ?? (vital as any).Glucose} mg/dL`
                                : 'N/A'}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">{vital.dailyOrHourlyVitals || 'N/A'}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{vital.nurseName || 'N/A'}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {vital.patientCondition || (vital as any).patientStatus || (vital as any).PatientStatus || (vital as any).PatientCondition || 'N/A'}
                            </td>
                            <td className="py-3 px-4 flex gap-2 items-center whitespace-nowrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingICUVitalsId(vital.icuVisitVitalsId);
                                  
                                  // Extract DailyOrHourlyVitals with fallbacks and normalize
                                  let dailyOrHourlyVitalsValue = vital.dailyOrHourlyVitals || (vital as any).DailyOrHourlyVitals || '';
                                  // Normalize the value to match select options (e.g., "Daily Vitals" -> "Daily", "Hourly Vitals" -> "Hourly")
                                  if (dailyOrHourlyVitalsValue) {
                                    const lowerValue = String(dailyOrHourlyVitalsValue).toLowerCase().trim();
                                    if (lowerValue.includes('daily') || lowerValue === 'daily') {
                                      dailyOrHourlyVitalsValue = 'Daily';
                                    } else if (lowerValue.includes('hourly') || lowerValue === 'hourly') {
                                      dailyOrHourlyVitalsValue = 'Hourly';
                                    }
                                    // If it's already "Daily" or "Hourly" (case-insensitive), use it as-is
                                    if (lowerValue === 'daily') {
                                      dailyOrHourlyVitalsValue = 'Daily';
                                    } else if (lowerValue === 'hourly') {
                                      dailyOrHourlyVitalsValue = 'Hourly';
                                    }
                                  }
                                  
                                  console.log('Edit ICU Vitals - Raw vital:', vital);
                                  console.log('Edit ICU Vitals - dailyOrHourlyVitalsValue:', dailyOrHourlyVitalsValue, 'from vital.dailyOrHourlyVitals:', vital.dailyOrHourlyVitals);
                                  
                                  // Parse recordedDateTime for DatePicker
                                  let recordedDateTimeValue: Date | null = null;
                                  const rawRecordedDateTime = vital.recordedDateTime || 
                                    (vital as any).RecordedDateTime || 
                                    (vital as any).recordedDate || 
                                    (vital as any).RecordedDate ||
                                    (vital as any).dateTime ||
                                    (vital as any).DateTime ||
                                    (vital as any).recordedAt ||
                                    (vital as any).RecordedAt ||
                                    (vital as any).visitDateTime ||
                                    (vital as any).VisitDateTime;
                                  
                                  if (rawRecordedDateTime) {
                                    try {
                                      let date: Date;
                                      
                                      // Handle dd-MM-yyyy HH:mm format (e.g., "13-01-2026 17:12")
                                      if (typeof rawRecordedDateTime === 'string' && /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}/.test(rawRecordedDateTime)) {
                                        const parts = rawRecordedDateTime.split(' ');
                                        const datePart = parts[0]; // "13-01-2026"
                                        const timePart = parts[1]; // "17:12"
                                        
                                        const [day, month, year] = datePart.split('-');
                                        const [hours24, minutes] = timePart.split(':');
                                        
                                        // Create date in ISO format: YYYY-MM-DDTHH:mm:ss
                                        const isoString = `${year}-${month}-${day}T${hours24}:${minutes}:00`;
                                        date = new Date(isoString);
                                      }
                                      // Handle YYYY-MM-DD HH:MM:SS format (space-separated)
                                      else if (typeof rawRecordedDateTime === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(rawRecordedDateTime)) {
                                        // Replace space with 'T' for ISO format
                                        const isoString = rawRecordedDateTime.replace(' ', 'T');
                                        date = new Date(isoString);
                                      } else {
                                        date = new Date(rawRecordedDateTime);
                                      }
                                      
                                      if (!isNaN(date.getTime())) {
                                        recordedDateTimeValue = date;
                                      } else {
                                        console.warn('Invalid date format for DatePicker:', rawRecordedDateTime);
                                      }
                                    } catch (e) {
                                      console.warn('Error parsing recordedDateTime for DatePicker:', e, rawRecordedDateTime);
                                    }
                                  }
                                  
                                  // Only fallback to current date if we couldn't parse the recorded date
                                  if (!recordedDateTimeValue) {
                                    console.warn('No valid recordedDateTime found, using current date/time as fallback');
                                    recordedDateTimeValue = new Date();
                                  }
                                  
                                  // Find nurse name by ID for display - use the same logic as View button
                                  const nurseIdValue = vital.nurseId || (vital as any).NurseId || '';
                                  let nurseNameForDisplay = '';
                                  
                                  // First, try to get nurse name from the vital object directly
                                  if (vital.nurseName || (vital as any).NurseName) {
                                    nurseNameForDisplay = vital.nurseName || (vital as any).NurseName || '';
                                  }
                                  
                                  // If we have a nurseId, try to find the nurse in the nurses list
                                  if (nurseIdValue && nurses.length > 0) {
                                    const foundNurse = nurses.find((n: any) => String(n.id) === String(nurseIdValue));
                                    if (foundNurse) {
                                      nurseNameForDisplay = foundNurse.name || 'Unknown';
                                    }
                                  }
                                  
                                  // If still no name but we have an ID, use the ID as fallback
                                  if (!nurseNameForDisplay && nurseIdValue) {
                                    nurseNameForDisplay = String(nurseIdValue);
                                  }
                                  
                                  console.log('Edit ICU Vitals - nurseIdValue:', nurseIdValue, 'nurseNameForDisplay:', nurseNameForDisplay, 'nurses.length:', nurses.length);
                                  console.log('Edit ICU Vitals - vital.nurseName:', vital.nurseName, 'vital.nurseId:', vital.nurseId);
                                  
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
                                    recordedDateTime: '',
                                    recordedBy: vital.recordedBy || '',
                                    dailyOrHourlyVitals: dailyOrHourlyVitalsValue,
                                    nurseId: nurseIdValue ? String(nurseIdValue) : '',
                                    nurseVisitsDetails: vital.nurseVisitsDetails || '',
                                    patientCondition: vital.patientCondition || ''
                                  });
                                  setIcuVitalsRecordedDateTime(recordedDateTimeValue);
                                  setNurseSearchTerm(nurseNameForDisplay);
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
                <div>
                  <Label htmlFor="doctorId">Doctor *</Label>
                  <select
                    id="doctorId"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-base md:text-sm"
                    value={doctorVisitFormData.doctorId}
                    onChange={(e) => setDoctorVisitFormData({ ...doctorVisitFormData, doctorId: e.target.value })}
                    required
                  >
                    <option value="">Select Doctor</option>
                    {availableDoctors.map((doctor) => (
                      <option key={doctor.id || doctor.Id || doctor.UserId} value={String(doctor.id || doctor.Id || doctor.UserId)}>
                        {doctor.name || doctor.Name || doctor.UserName || 'Unknown Doctor'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="doctorVisitedDateTime">Doctor Visited Date & Time *</Label>
                  <DatePicker
                    selected={doctorVisitedDateTime}
                    onChange={(date: Date | null) => setDoctorVisitedDateTime(date)}
                    showTimeSelect
                    timeIntervals={1}
                    dateFormat="dd-MM-yyyy hh:mm aa"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-base md:text-sm"
                    placeholderText="Select date and time"
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
                    <option value="Inactive">Inactive</option>
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
                    <DatePicker
                      selected={icuVitalsRecordedDateTime}
                      onChange={(date: Date | null) => setIcuVitalsRecordedDateTime(date)}
                      showTimeSelect
                      timeIntervals={1}
                      dateFormat="dd-MM-yyyy hh:mm aa"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-base md:text-sm"
                      placeholderText="Select date and time"
                      required
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
    </div>
  );
}

