import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { HeartPulse, Activity, Thermometer, Wind, Droplet, Brain, Plus, Edit, CheckCircle2, XCircle, Wrench, Clock, Search } from 'lucide-react';
import { admissionsApi } from '../api/admissions';
import { apiRequest } from '../api/base';
import { doctorsApi } from '../api/doctors';

interface ICUPatient {
  id: number | string;
  patientICUAdmissionId?: string | number; // UUID for API calls
  patientId?: string | number | null; // Patient ID
  patientNo?: string | null; // Patient Number
  patientType?: string | null; // Patient Type
  doctorId?: string | number | null; // Doctor ID
  icuBedId?: string | number; // ICU Bed ID (primary key)
  bedNumber: string;
  patientName: string;
  age: number;
  gender: string;
  admissionDate: string;
  admissionTime: string;
  condition: string;
  patientCondition?: string | null; // Patient Condition
  icuPatientStatus?: string | null; // ICU Patient Status
  icuAdmissionStatus?: string | null; // ICU Admission Status
  severity: 'Critical' | 'Serious' | 'Stable';
  attendingDoctor: string;
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSaturation: number;
    respiratoryRate: number;
  };
  diagnosis: string;
  treatment: string;
  ventilatorSupport: boolean;
}

const mockICUPatients: ICUPatient[] = [
  ];

export function ICUManagement() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<ICUPatient[]>(mockICUPatients);
  const [selectedICUBedId, setSelectedICUBedId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [occupancy, setOccupancy] = useState<{ totalPatients: number; occupiedBeds: number; totalBeds: number }>({
    totalPatients: 0,
    occupiedBeds: 0,
    totalBeds: 0,
  });
  const [criticalPatientsCount, setCriticalPatientsCount] = useState<number>(0);
  const [onVentilatorCount, setOnVentilatorCount] = useState<number>(0);
  const [availableBedsCount, setAvailableBedsCount] = useState<number>(0);
  const [icuBedLayout, setIcuBedLayout] = useState<any[]>([]);
  const [selectedBedDetails, setSelectedBedDetails] = useState<any | null>(null);
  const [loadingBedDetails, setLoadingBedDetails] = useState(false);
  const [showAddICUAdmission, setShowAddICUAdmission] = useState(false);
  const [savingICUAdmission, setSavingICUAdmission] = useState(false);
  const [addICUAdmissionError, setAddICUAdmissionError] = useState<string | null>(null);
  const [patientOptions, setPatientOptions] = useState<any[]>([]);
  const [icuBedOptions, setIcuBedOptions] = useState<any[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<any[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [icuBedSearchTerm, setIcuBedSearchTerm] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [availableAppointments, setAvailableAppointments] = useState<any[]>([]);
  const [availableEmergencyBedSlots, setAvailableEmergencyBedSlots] = useState<any[]>([]);
  const [availableIPDAdmissions, setAvailableIPDAdmissions] = useState<any[]>([]);
  const [vitalsData, setVitalsData] = useState<any | null>(null);
  const [loadingVitals, setLoadingVitals] = useState(false);
  const [showManageICUCase, setShowManageICUCase] = useState(false);
  const [editingICUCase, setEditingICUCase] = useState<ICUPatient | null>(null);
  const [loadingEditICUCase, setLoadingEditICUCase] = useState(false);
  const [updatingICUCase, setUpdatingICUCase] = useState(false);
  const [editICUCaseError, setEditICUCaseError] = useState<string | null>(null);
  const [editICUCaseForm, setEditICUCaseForm] = useState<{
    patientICUAdmissionId: string;
    patientId: string;
    patientType: string;
    patientAppointmentId: string;
    emergencyAdmissionId: string;
    roomAdmissionId: string;
    icuId: string;
    icuBedId: string;
    icuBedNo: string;
    icuPatientStatus: string;
    icuAllocationFromDate: string;
    icuAllocationToDate: string;
    diagnosis: string;
    treatmentDetails: string;
    patientCondition: string;
    onVentilator: string;
    icuAdmissionStatus: string;
    doctorId: string;
    admittedBy: string;
    admittedByDoctorId: string;
  }>({
    patientICUAdmissionId: '',
    patientId: '',
    patientType: '',
    patientAppointmentId: '',
    emergencyAdmissionId: '',
    roomAdmissionId: '',
    icuId: '',
    icuBedId: '',
    icuBedNo: '',
    icuPatientStatus: '',
    icuAllocationFromDate: '',
    icuAllocationToDate: '',
    diagnosis: '',
    treatmentDetails: '',
    patientCondition: '',
    onVentilator: 'No',
    icuAdmissionStatus: 'Occupied',
    doctorId: '',
    admittedBy: '',
    admittedByDoctorId: '',
  });
  const [addICUAdmissionForm, setAddICUAdmissionForm] = useState<{
    patientId: string;
    patientType: string;
    patientAppointmentId: string;
    emergencyAdmissionId: string;
    roomAdmissionId: string;
    icuId: string;
    icuBedId: string;
    icuBedNo: string;
    icuPatientStatus: string;
    icuAllocationFromDate: string;
    icuAllocationToDate: string;
    diagnosis: string;
    treatmentDetails: string;
    patientCondition: string;
    onVentilator: string;
    icuAdmissionStatus: string;
    doctorId: string;
    admittedBy: string;
    admittedByDoctorId: string;
  }>({
    patientId: '',
    patientType: '',
    patientAppointmentId: '',
    emergencyAdmissionId: '',
    roomAdmissionId: '',
    icuId: '',
    icuBedId: '',
    icuBedNo: '',
    icuPatientStatus: '',
    icuAllocationFromDate: '',
    icuAllocationToDate: '',
    diagnosis: '',
    treatmentDetails: '',
    patientCondition: '',
    onVentilator: 'No',
    icuAdmissionStatus: 'Occupied',
    doctorId: '',
    admittedBy: '',
    admittedByDoctorId: '',
  });

  // Load ICU patient admissions from API
  useEffect(() => {
    const loadICUPatients = async () => {
      try {
        setLoading(true);
        console.log('Loading ICU patients from API endpoint: /patient-icu-admissions/icu-management');
        const response = await apiRequest<any>('/patient-icu-admissions/icu-management');
        console.log('ICU patient admissions API response (RAW):', JSON.stringify(response, null, 2));
        
        // Handle different response structures: { data: [...] } or direct array
        const icuAdmissions = response?.data || response || [];
        console.log('ICU patient admissions data extracted:', icuAdmissions);
        
        if (!Array.isArray(icuAdmissions)) {
          console.warn('ICU patient admissions data is not an array:', typeof icuAdmissions);
          setPatients([]);
          return;
        }
        
        // Map API data to ICUPatient interface
        const mappedPatients: ICUPatient[] = icuAdmissions.map((admission: any, index: number) => {
          // Helper function to extract value with multiple field name variations (including nested objects)
          const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
            if (!data) return defaultValue;
            
            for (const field of fieldVariations) {
              // Check direct field
              let value = data?.[field];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
              
              // Check nested paths (e.g., Doctor.DoctorName, Doctor.name)
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
              
              // Check nested objects (Doctor, Patient, PatientICUAdmission, etc.)
              if (data?.Doctor?.[field]) {
                value = data.Doctor[field];
                if (value !== undefined && value !== null && value !== '') {
                  return value;
                }
              }
              if (data?.doctor?.[field]) {
                value = data.doctor[field];
                if (value !== undefined && value !== null && value !== '') {
                  return value;
                }
              }
              if (data?.AttendingDoctor?.[field]) {
                value = data.AttendingDoctor[field];
                if (value !== undefined && value !== null && value !== '') {
                  return value;
                }
              }
              if (data?.attendingDoctor?.[field]) {
                value = data.attendingDoctor[field];
                if (value !== undefined && value !== null && value !== '') {
                  return value;
                }
              }
              if (data?.PatientICUAdmission?.[field]) {
                value = data.PatientICUAdmission[field];
                if (value !== undefined && value !== null && value !== '') {
                  return value;
                }
              }
              if (data?.patientICUAdmission?.[field]) {
                value = data.patientICUAdmission[field];
                if (value !== undefined && value !== null && value !== '') {
                  return value;
                }
              }
            }
            return defaultValue;
          };

          // Extract bed number
          const bedNumber = extractField(admission, [
            'bedNumber', 'BedNumber', 'bed_number', 'Bed_Number',
            'bed', 'Bed', 'icuBedNo', 'ICUBedNo', 'icuBedNumber', 'ICUBedNumber'
          ], `ICU-${(index + 1).toString().padStart(2, '0')}`);

          // Extract patient name
          const patientName = extractField(admission, [
            'patientName', 'PatientName', 'patient_name', 'Patient_Name',
            'name', 'Name', 'fullName', 'FullName'
          ], 'Unknown Patient');

          // Extract age
          const age = Number(extractField(admission, [
            'age', 'Age', 'patientAge', 'PatientAge', 'patient_age', 'Patient_Age'
          ], 0)) || 0;

          // Extract gender
          const gender = extractField(admission, [
            'gender', 'Gender', 'sex', 'Sex', 'patientGender', 'PatientGender'
          ], 'Unknown');

          // Extract admission date
          const admissionDate = extractField(admission, [
            'admissionDate', 'AdmissionDate', 'admission_date', 'Admission_Date',
            'admitDate', 'AdmitDate', 'admit_date', 'Admit_Date'
          ], new Date().toISOString().split('T')[0]);

          // Extract admission time
          const admissionTime = extractField(admission, [
            'admissionTime', 'AdmissionTime', 'admission_time', 'Admission_Time',
            'admitTime', 'AdmitTime', 'admit_time', 'Admit_Time',
            'time', 'Time'
          ], new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));

          // Extract condition
          const condition = extractField(admission, [
            'condition', 'Condition', 'patientCondition', 'PatientCondition',
            'diagnosis', 'Diagnosis', 'diagnosisDescription', 'DiagnosisDescription'
          ], 'Not Specified');

          // Extract ICU Patient Status
          let icuPatientStatus = extractField(admission, [
            'icuPatientStatus', 'ICUPatientStatus', 'icu_patient_status', 'ICU_Patient_Status',
            'patientStatus', 'PatientStatus', 'patient_status', 'Patient_Status'
          ], null);
          
          // If not found, try to extract from nested structures
          if (!icuPatientStatus) {
            icuPatientStatus = extractField(admission, [
              'PatientICUAdmission.icuPatientStatus', 'PatientICUAdmission.ICUPatientStatus',
              'admission.icuPatientStatus', 'admission.ICUPatientStatus'
            ], null);
          }
          
          icuPatientStatus = icuPatientStatus || 'Stable';
          console.log(`Patient ${patientName} - ICU Patient Status extracted:`, icuPatientStatus);

          // Extract ICU Admission Status
          let icuAdmissionStatus = extractField(admission, [
            'icuAdmissionStatus', 'ICUAdmissionStatus', 'icu_admission_status', 'ICU_Admission_Status',
            'admissionStatus', 'AdmissionStatus', 'admission_status', 'Admission_Status'
          ], null);
          
          // If not found, try to extract from nested structures
          if (!icuAdmissionStatus) {
            icuAdmissionStatus = extractField(admission, [
              'PatientICUAdmission.icuAdmissionStatus', 'PatientICUAdmission.ICUAdmissionStatus',
              'admission.icuAdmissionStatus', 'admission.ICUAdmissionStatus'
            ], null);
          }
          
          icuAdmissionStatus = icuAdmissionStatus || 'Occupied';
          console.log(`Patient ${patientName} - ICU Admission Status extracted:`, icuAdmissionStatus);

          // Extract severity (normalize to Critical, Serious, or Stable)
          const severityRaw = extractField(admission, [
            'severity', 'Severity', 'patientSeverity', 'PatientSeverity',
            'status', 'Status', 'patientStatus', 'PatientStatus'
          ], 'Stable');
          const severity = (severityRaw === 'Critical' || severityRaw === 'critical' || severityRaw === 'CRITICAL') ? 'Critical' :
                          (severityRaw === 'Serious' || severityRaw === 'serious' || severityRaw === 'SERIOUS') ? 'Serious' : 'Stable';

          // Extract attending doctor with enhanced nested object support
          let attendingDoctor = extractField(admission, [
            'attendingDoctor', 'AttendingDoctor', 'attending_doctor', 'Attending_Doctor',
            'attendingDoctorName', 'AttendingDoctorName', 'attending_doctor_name', 'Attending_Doctor_Name',
            'doctor', 'Doctor', 'doctorName', 'DoctorName', 'admittedBy', 'AdmittedBy',
            'Doctor.DoctorName', 'Doctor.name', 'Doctor.Name', 'Doctor.UserName',
            'doctor.doctorName', 'doctor.name', 'doctor.Name', 'doctor.userName',
            'AttendingDoctor.DoctorName', 'AttendingDoctor.name', 'AttendingDoctor.Name',
            'attendingDoctor.doctorName', 'attendingDoctor.name', 'attendingDoctor.Name',
            'PatientICUAdmission.AttendingDoctor', 'PatientICUAdmission.attendingDoctor',
            'PatientICUAdmission.Doctor', 'PatientICUAdmission.doctor',
            'PatientICUAdmission.AttendingDoctor.DoctorName', 'PatientICUAdmission.AttendingDoctor.name',
            'PatientICUAdmission.Doctor.DoctorName', 'PatientICUAdmission.Doctor.name',
            'PatientICUAdmission.attendingDoctorName', 'PatientICUAdmission.AttendingDoctorName'
          ], null);
          
          // If we have doctorId but no name, try to look it up from doctorOptions
          if (!attendingDoctor) {
            const doctorId = extractField(admission, [
              'doctorId', 'DoctorId', 'doctor_id', 'Doctor_ID',
              'attendingDoctorId', 'AttendingDoctorId', 'attending_doctor_id', 'Attending_Doctor_ID',
              'PatientICUAdmission.doctorId', 'PatientICUAdmission.DoctorId',
              'PatientICUAdmission.attendingDoctorId', 'PatientICUAdmission.AttendingDoctorId'
            ], null);
            
            if (doctorId && doctorOptions.length > 0) {
              const doctor = doctorOptions.find((d: any) => {
                const dId = String((d as any).id || (d as any).Id || (d as any).UserId || '');
                return dId === String(doctorId);
              });
              if (doctor) {
                attendingDoctor = (doctor as any).name || (doctor as any).Name || (doctor as any).UserName || null;
              }
            }
          }
          
          attendingDoctor = attendingDoctor || 'Not Assigned';
          console.log(`Patient ${patientName} - Attending Doctor extracted:`, attendingDoctor);

          // Extract vitals
          const vitals = {
            heartRate: Number(extractField(admission, [
              'heartRate', 'HeartRate', 'heart_rate', 'Heart_Rate',
              'vitals.heartRate', 'vitals.HeartRate'
            ], 0)) ,
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
          };

          // Extract diagnosis
          const diagnosis = extractField(admission, [
            'diagnosis', 'Diagnosis', 'diagnosisDescription', 'DiagnosisDescription',
            'diagnosis_desc', 'Diagnosis_Desc'
          ], condition);

          // Extract treatment
          const treatment = extractField(admission, [
            'treatment', 'Treatment', 'treatmentPlan', 'TreatmentPlan',
            'treatment_plan', 'Treatment_Plan', 'medications', 'Medications'
          ], 'Not Specified');

          // Extract ventilator support
          const ventilatorSupportRaw = extractField(admission, [
            'ventilatorSupport', 'VentilatorSupport', 'ventilator_support', 'Ventilator_Support',
            'onVentilator', 'OnVentilator', 'isVentilatorAttached', 'IsVentilatorAttached',
            'ventilator', 'Ventilator',
            'PatientICUAdmission.ventilatorSupport', 'PatientICUAdmission.VentilatorSupport',
            'PatientICUAdmission.onVentilator', 'PatientICUAdmission.OnVentilator',
            'PatientICUAdmission.ventilator', 'PatientICUAdmission.Ventilator'
          ], false);
          const ventilatorSupport = typeof ventilatorSupportRaw === 'boolean' 
            ? ventilatorSupportRaw 
            : (String(ventilatorSupportRaw).toLowerCase() === 'true' || String(ventilatorSupportRaw).toLowerCase() === 'yes');

          // Extract patientICUAdmissionId (UUID) - this is the actual ID we need for API calls
          // Prioritize UUID fields, then fallback to other ID fields
          let patientICUAdmissionId = extractField(admission, [
            'patientICUAdmissionId', 'PatientICUAdmissionId', 'patient_icu_admission_id', 'Patient_ICU_Admission_Id'
          ], null);
          
          // If not found, try other ID fields but validate they look like UUIDs
          if (!patientICUAdmissionId) {
            const candidateId = extractField(admission, [
              'id', 'Id', 'admissionId', 'AdmissionId'
            ], null);
            
            // Only use if it looks like a UUID (string and length > 20)
            if (candidateId && typeof candidateId === 'string' && candidateId.length > 20) {
              patientICUAdmissionId = candidateId;
            }
          }
          
          console.log('Mapped patient ICU Admission ID:', patientICUAdmissionId, 'Type:', typeof patientICUAdmissionId, 'for patient:', extractField(admission, ['patientName', 'PatientName', 'name', 'Name'], 'Unknown'));

          // Extract PatientNo
          const patientNo = extractField(admission, [
            'patientNo', 'PatientNo', 'patient_no', 'Patient_No',
            'patientNumber', 'PatientNumber', 'patient_number', 'Patient_Number'
          ], null);

          // Extract PatientType
          const patientType = extractField(admission, [
            'patientType', 'PatientType', 'patient_type', 'Patient_Type',
            'PatientICUAdmission.patientType', 'PatientICUAdmission.PatientType',
            'PatientICUAdmission.patient_type', 'PatientICUAdmission.Patient_Type'
          ], null);

          return {
            id: patientICUAdmissionId || admission.id || admission.Id || admission.roomAdmissionId || admission.RoomAdmissionId || (index + 1),
            patientICUAdmissionId: patientICUAdmissionId, // Store the UUID separately
            patientNo: patientNo,
            patientType: patientType,
            bedNumber,
            patientName,
            age,
            gender,
            admissionDate,
            admissionTime,
            condition,
            icuPatientStatus: icuPatientStatus,
            icuAdmissionStatus: icuAdmissionStatus,
            severity,
            attendingDoctor,
            vitals,
            diagnosis,
            treatment,
            ventilatorSupport,
          };
        });

        setPatients(mappedPatients);
        console.log('Mapped ICU patients:', mappedPatients);
      } catch (error) {
        console.error('Error loading ICU patients:', error);
        // Keep mock data on error
      } finally {
        setLoading(false);
      }
    };

    // Load doctors on mount for doctor name lookup
    const loadDoctors = async () => {
      try {
        const doctorsList = await doctorsApi.getAll();
        setDoctorOptions(doctorsList || []);
      } catch (error) {
        console.error('Error loading doctors:', error);
      }
    };
    
    loadDoctors();
    loadICUPatients();
  }, []);

  // Load ICU occupancy data
  useEffect(() => {
    const loadICUOccupancy = async () => {
      try {
        console.log('Fetching ICU occupancy from API endpoint: /patient-icu-admissions/occupancy');
        const response = await apiRequest<any>('/patient-icu-admissions/occupancy');
        console.log('ICU occupancy API response (RAW):', JSON.stringify(response, null, 2));
        
        // Handle different response structures: { data: {...} } or direct object
        const occupancyData = response?.data || response || {};
        console.log('ICU occupancy data extracted:', occupancyData);
        
        // Helper function to extract numeric value with multiple field name variations
        const extractValue = (data: any, fieldVariations: string[], defaultValue: number = 0): number => {
          for (const field of fieldVariations) {
            const value = data?.[field];
            if (value !== undefined && value !== null) {
              const numValue = Number(value);
              if (!isNaN(numValue)) {
                return numValue;
              }
            }
          }
          return defaultValue;
        };
        
        // Extract occupancy field - this represents occupied beds from the API
        const occupancyValue = extractValue(occupancyData, [
          'occupancy', 'Occupancy', 'occupiedAdmissions', 'OccupiedAdmissions'
        ], -1); // Use -1 as sentinel value to check if occupancy field exists
        
        const hasOccupancyField = occupancyValue !== -1;
        
        // Extract total beds - this is the total capacity (e.g., 15)
        const totalBeds = extractValue(occupancyData, [
          'totalBeds', 'TotalBeds', 'total_beds', 'Total_Beds',
          'totalCapacity', 'TotalCapacity', 'total_capacity', 'Total_Capacity',
          'capacity', 'Capacity', 'totalBedCount', 'TotalBedCount',
          'bedCapacity', 'BedCapacity', 'bed_capacity', 'Bed_Capacity',
          'maxBeds', 'MaxBeds', 'max_beds', 'Max_Beds',
          'totalICUBeds', 'TotalICUBeds', 'total_icu_beds', 'Total_ICU_Beds'
        ], 15); // Default to 15 if not provided
        
        // Use occupancy field for occupied beds (this is the primary source)
        // If occupancy field is not available, fallback to other field names
        const occupiedBeds = hasOccupancyField 
          ? occupancyValue 
          : extractValue(occupancyData, [
              'occupiedBeds', 'OccupiedBeds', 'occupied_beds', 'Occupied_Beds',
              'occupied', 'Occupied', 'occupiedCount', 'OccupiedCount',
              'occupied_bed_count', 'Occupied_Bed_Count', 'occupiedBedCount', 'OccupiedBedCount',
              'totalOccupied', 'TotalOccupied', 'total_occupied', 'Total_Occupied',
              'occupiedPatients', 'OccupiedPatients', 'occupied_patients', 'Occupied_Patients'
            ], 0);
        
        // Ensure occupiedBeds doesn't exceed totalBeds
        const finalOccupiedBeds = Math.min(occupiedBeds, totalBeds);
        
        // Extract availableICUBeds field - this represents available beds from the API
        const availableICUBeds = extractValue(occupancyData, [
          'availableICUBeds', 'AvailableICUBeds', 'available_icu_beds', 'Available_ICU_Beds',
          'availableBeds', 'AvailableBeds', 'available_beds', 'Available_Beds',
          'availableBedCount', 'AvailableBedCount', 'available_bed_count', 'Available_Bed_Count',
          'available', 'Available', 'availableCount', 'AvailableCount',
          'freeBeds', 'FreeBeds', 'free_beds', 'Free_Beds',
          'vacantBeds', 'VacantBeds', 'vacant_beds', 'Vacant_Beds',
          'icuAvailableBeds', 'ICUAvailableBeds', 'icu_available_beds', 'ICU_Available_Beds'
        ], Math.max(0, totalBeds - finalOccupiedBeds)); // Calculate as totalBeds - occupiedBeds if not provided
        
        // For Total Patients display, use occupancy field (occupied beds) / total beds
        // The occupancy field represents the number of occupied beds
        const finalTotalPatients = finalOccupiedBeds; // Use occupied beds count for total patients display
        
        console.log('Mapped ICU occupancy:', { 
          occupancy: hasOccupancyField ? occupancyValue : null, // Raw occupancy field from API
          totalPatients: finalTotalPatients, 
          occupiedBeds: finalOccupiedBeds, 
          totalBeds,
          availableICUBeds: availableICUBeds,
          usingOccupancyField: hasOccupancyField
        });
        
        setOccupancy({
          totalPatients: finalTotalPatients,
          occupiedBeds: finalOccupiedBeds, // Use occupancy field value
          totalBeds: totalBeds,
        });
        
        // Set available beds count from availableICUBeds field
        setAvailableBedsCount(availableICUBeds);
        
        console.log('ICU occupancy loaded:', { 
          totalPatients: finalTotalPatients, 
          occupiedBeds: finalOccupiedBeds, 
          totalBeds,
          availableBeds: availableICUBeds
        });
      } catch (error) {
        console.error('Error loading ICU occupancy:', error);
        // Keep default values on error
      }
    };

    loadICUOccupancy();
  }, []);

  // Load ICU critical patients count
  useEffect(() => {
    const loadICUCriticalCount = async () => {
      try {
        const criticalCount = await admissionsApi.getICUCriticalCount();
        setCriticalPatientsCount(criticalCount);
        console.log('ICU critical patients count loaded:', criticalCount);
      } catch (error) {
        console.error('Error loading ICU critical count:', error);
        // Keep default value (0) on error
      }
    };

    loadICUCriticalCount();
  }, []);

  // Load ICU on-ventilator patients count
  useEffect(() => {
    const loadICUOnVentilatorCount = async () => {
      try {
        const ventilatorCount = await admissionsApi.getICUOnVentilatorCount();
        setOnVentilatorCount(ventilatorCount);
        console.log('ICU on-ventilator patients count loaded:', ventilatorCount);
      } catch (error) {
        console.error('Error loading ICU on-ventilator count:', error);
        // Keep default value (0) on error
      }
    };

    loadICUOnVentilatorCount();
  }, []);

  // Load ICU bed layout from API
  useEffect(() => {
    const loadICUBedLayout = async () => {
      try {
        console.log('Loading ICU bed layout from API endpoint: /patient-icu-admissions/icu-beds-details');
        const bedLayoutData = await admissionsApi.getICUBedLayout();
        console.log('ICU bed layout data received from API:', bedLayoutData);
        
        if (Array.isArray(bedLayoutData) && bedLayoutData.length > 0) {
          console.log(`Successfully loaded ${bedLayoutData.length} ICU beds from API`);
          // Store all the data from the API response
          setIcuBedLayout(bedLayoutData);
          console.log('ICU bed layout state updated with all data:', bedLayoutData);
        } else {
          console.warn('No ICU bed layout data found or data is not an array');
          setIcuBedLayout([]);
        }
      } catch (error) {
        console.error('Error loading ICU bed layout:', error);
        // Keep empty array on error, will fallback to calculated beds
        setIcuBedLayout([]);
      }
    };

    loadICUBedLayout();
  }, []);

  // Function to load ICU bed details by ID
  const loadICUBedDetails = async (icuBedId: string | number | null) => {
    if (!icuBedId) {
      console.warn('No ICU Bed ID provided, cannot load bed details');
      setSelectedBedDetails(null);
      return;
    }

    try {
      setLoadingBedDetails(true);
      console.log('Loading ICU bed details for icuBedId:', icuBedId);
      const bedDetails = await admissionsApi.getICUBedDetailsById(icuBedId);
      console.log('ICU bed details loaded:', bedDetails);
      setSelectedBedDetails(bedDetails);
    } catch (error) {
      console.error('Error loading ICU bed details:', error);
      setSelectedBedDetails(null);
    } finally {
      setLoadingBedDetails(false);
    }
  };

  // Fetch patient appointments for a specific patient
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
    setAddICUAdmissionForm({
      ...addICUAdmissionForm,
      patientType: patientType,
      patientAppointmentId: '',
      emergencyAdmissionId: '',
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
        if (addICUAdmissionForm.patientId) {
          await fetchPatientAppointments(addICUAdmissionForm.patientId);
        } else {
          setAvailableAppointments([]);
        }
        setAvailableEmergencyBedSlots([]);
        setAvailableIPDAdmissions([]);
      } else if (patientType === 'Emergency') {
        // If patient is already selected, fetch their emergency admissions
        if (addICUAdmissionForm.patientId) {
          await fetchPatientEmergencyBedSlots(addICUAdmissionForm.patientId);
        } else {
          setAvailableEmergencyBedSlots([]);
        }
        setAvailableAppointments([]);
        setAvailableIPDAdmissions([]);
      } else if (patientType === 'IPD') {
        // If patient is already selected, fetch their IPD admissions
        if (addICUAdmissionForm.patientId) {
          await fetchPatientIPDAdmissions(addICUAdmissionForm.patientId);
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

  const openAddICUAdmission = async () => {
    try {
      setShowAddICUAdmission(true);
      setAddICUAdmissionError(null);
      setPatientSearchTerm(''); // Reset search term when opening dialog
      setIcuBedSearchTerm(''); // Reset ICU bed search term when opening dialog
      setDoctorSearchTerm(''); // Reset doctor search term when opening dialog
      // Preload dropdowns
      const patientsList = await admissionsApi.getPatientRegistrations();
      setPatientOptions(patientsList || []);
      // Use existing ICU bed layout as options
      setIcuBedOptions(icuBedLayout || []);
      // Load doctors
      const doctorsList = await doctorsApi.getAll();
      setDoctorOptions(doctorsList || []);
      // Reset patient type related fields
      setAddICUAdmissionForm(prev => ({
        ...prev,
        patientType: '',
        patientAppointmentId: '',
        emergencyAdmissionId: '',
        doctorId: '',
        admittedBy: '',
        admittedByDoctorId: ''
      }));
      setAvailableAppointments([]);
      setAvailableEmergencyBedSlots([]);
    } catch (error: any) {
      console.error('Error loading data for new ICU admission:', error);
      setAddICUAdmissionError(error?.message || 'Failed to load data');
    }
  };

  const handleSaveICUAdmission = async () => {
    try {
      setSavingICUAdmission(true);
      setAddICUAdmissionError(null);

      // Ensure PatientId is a UUID string
      const patientId = addICUAdmissionForm.patientId;
      console.log('Saving ICU admission - patientId from form:', patientId);
      console.log('Full form state:', addICUAdmissionForm);
      
      if (!patientId || patientId === '' || patientId === 'undefined' || patientId === 'null') {
        console.error('Patient ID is missing, empty, or invalid:', patientId);
        throw new Error('Patient ID is required. Please select a patient from the list.');
      }
      
      // Validate that it looks like a UUID (string with length > 20)
      if (typeof patientId !== 'string' || patientId.length < 20) {
        console.warn('PatientId may not be a valid UUID:', patientId, 'Type:', typeof patientId, 'Length:', patientId?.length);
      }

      // Validate required fields for availability check
      if (!addICUAdmissionForm.icuId) {
        throw new Error('ICU ID is required. Please select an ICU.');
      }
      if (!addICUAdmissionForm.icuAllocationFromDate) {
        throw new Error('ICU Allocation From Date is required.');
      }

      // Check ICU occupancy before proceeding
      try {
        console.log('Checking ICU occupancy, ICUId:', addICUAdmissionForm.icuId, 'ICUAllocationFromDate:', addICUAdmissionForm.icuAllocationFromDate);
        
        // Call the ICU occupied check API
        const checkResponse = await apiRequest<any>(`/patient-icu-admissions/check-occupied?ICUId=${addICUAdmissionForm.icuId}&ICUAllocationFromDate=${addICUAdmissionForm.icuAllocationFromDate}`, {
          method: 'GET',
        });
        
        console.log('ICU occupied check response:', checkResponse);
        
        // Check if ICU is occupied
        // API might return: { isOccupied: true/false } or { occupied: true/false } or { status: 'occupied'/'available' }
        const isOccupied = checkResponse?.isOccupied === true ||
                          checkResponse?.occupied === true ||
                          checkResponse?.IsOccupied === true ||
                          checkResponse?.Occupied === true ||
                          (checkResponse?.status && String(checkResponse.status).toLowerCase() === 'occupied') ||
                          (checkResponse?.Status && String(checkResponse.Status).toLowerCase() === 'occupied');
        
        if (isOccupied) {
          throw new Error('The selected ICU is already occupied for the selected allocation date. Please select another ICU or choose a different date.');
        }
      } catch (checkError: any) {
        // If it's our custom error message, throw it
        if (checkError?.message && (checkError.message.includes('not available') || checkError.message.includes('already occupied') || checkError.message.includes('occupied'))) {
          throw checkError;
        }
        // If the API returns an error indicating occupancy, throw it
        if (checkError?.response?.data?.message || checkError?.message) {
          const errorMessage = checkError.response?.data?.message || checkError.message;
          if (errorMessage.toLowerCase().includes('not available') || 
              errorMessage.toLowerCase().includes('occupied') ||
              errorMessage.toLowerCase().includes('unavailable')) {
            throw new Error(errorMessage || 'The selected ICU is already occupied for the selected allocation date. Please select another ICU or choose a different date.');
          }
        }
        // Check for HTTP errors (404, 500, etc.)
        if (checkError?.response?.status) {
          const status = checkError.response.status;
          if (status === 404) {
            console.warn('ICU occupied check endpoint not found (404). The API endpoint may not be implemented yet.');
            // Continue without blocking - the backend might not have this endpoint yet
          } else if (status >= 500) {
            console.error('ICU occupied check server error:', status, checkError);
            throw new Error('Server error while checking ICU occupancy. Please try again later.');
          } else {
            console.warn('ICU occupied check failed with status:', status, checkError);
          }
        } else {
          // Network error or other issue
          console.warn('ICU occupied check failed:', checkError);
          // For network errors, we'll continue to allow the admission to proceed
          // You can change this to throw if you want to be more strict
        }
      }

      // Validate patient type and conditional fields
      if (!addICUAdmissionForm.patientType) {
        throw new Error('Patient Type is required');
      }
      
      if (addICUAdmissionForm.patientType === 'OPD' && !addICUAdmissionForm.patientAppointmentId) {
        throw new Error('Patient Appointment ID is required for OPD patients');
      }
      
      if (addICUAdmissionForm.patientType === 'IPD' && !addICUAdmissionForm.roomAdmissionId) {
        throw new Error('Patient IPD Admission ID is required for IPD patients');
      }
      
      if (addICUAdmissionForm.patientType === 'Emergency' && !addICUAdmissionForm.emergencyAdmissionId) {
        throw new Error('Emergency Admission Bed No is required for Emergency patients');
      }

      if (!addICUAdmissionForm.admittedByDoctorId && !addICUAdmissionForm.doctorId) {
        throw new Error('Please select a doctor');
      }

      const doctorId = addICUAdmissionForm.doctorId || addICUAdmissionForm.admittedByDoctorId || '';
      if (!doctorId) {
        throw new Error('Doctor ID is required. Please select a doctor.');
      }

      const payload: any = {
        PatientId: String(patientId).trim(), // Ensure it's a string UUID and trim whitespace
        PatientType: addICUAdmissionForm.patientType || 'Direct',
        ICUId: addICUAdmissionForm.icuId,
        ICUBedId: addICUAdmissionForm.icuBedId,
        ICUBedNo: addICUAdmissionForm.icuBedNo,
        ICUPatientStatus: addICUAdmissionForm.icuPatientStatus,
        ICUAllocationFromDate: addICUAdmissionForm.icuAllocationFromDate,
        ICUAllocationToDate: addICUAdmissionForm.icuAllocationToDate,
        Diagnosis: addICUAdmissionForm.diagnosis,
        TreatementDetails: addICUAdmissionForm.treatmentDetails,
        PatientCondition: addICUAdmissionForm.patientCondition,
        OnVentilator: addICUAdmissionForm.onVentilator,
        ICUAdmissionStatus: addICUAdmissionForm.icuAdmissionStatus,
        AttendingDoctorId: String(doctorId),
        DoctorId: String(doctorId),
        AdmittedBy: addICUAdmissionForm.admittedBy || '',
        
        // Add conditional fields based on PatientType
        ...(addICUAdmissionForm.patientType === 'OPD' && addICUAdmissionForm.patientAppointmentId ? {
          AppointmentId: addICUAdmissionForm.patientAppointmentId,
          PatientAppointmentId: addICUAdmissionForm.patientAppointmentId
        } : {}),
        ...(addICUAdmissionForm.patientType === 'IPD' && addICUAdmissionForm.roomAdmissionId ? {
          RoomAdmissionId: addICUAdmissionForm.roomAdmissionId
        } : {}),
        ...(addICUAdmissionForm.patientType === 'Emergency' && addICUAdmissionForm.emergencyAdmissionId ? {
          EmergencyAdmissionId: addICUAdmissionForm.emergencyAdmissionId,
          EmergencyBedSlotId: addICUAdmissionForm.emergencyAdmissionId
        } : {}),
      };

      console.log('Saving ICU admission with payload:', payload);
      const response = await apiRequest<any>('/patient-icu-admissions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      console.log('ICU admission created successfully:', response);
      setShowAddICUAdmission(false);
      // Reset form
      setAddICUAdmissionForm({
        patientId: '',
        patientType: '',
        patientAppointmentId: '',
        emergencyAdmissionId: '',
        roomAdmissionId: '',
        icuId: '',
        icuBedId: '',
        icuBedNo: '',
        icuPatientStatus: '',
        icuAllocationFromDate: '',
        icuAllocationToDate: '',
        diagnosis: '',
        treatmentDetails: '',
        patientCondition: '',
        onVentilator: 'No',
        icuAdmissionStatus: 'Occupied',
        doctorId: '',
        admittedBy: '',
        admittedByDoctorId: '',
      });
      setAvailableAppointments([]);
      setAvailableEmergencyBedSlots([]);
      setDoctorSearchTerm('');
      setPatientSearchTerm('');
      setIcuBedSearchTerm('');
      // Optionally trigger a manual refresh by reloading the page or re-fetching data
    } catch (error: any) {
      console.error('Error saving ICU admission:', error);
      setAddICUAdmissionError(error?.message || 'Failed to save ICU admission');
    } finally {
      setSavingICUAdmission(false);
    }
  };

  // Map ICU bed layout from API or calculate from patients
  const icuBeds = icuBedLayout.length > 0 
    ? icuBedLayout.map((bed: any) => {
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
        // Extract bedNumber first
        const bedNumber = extractField(bed, [
          'bedNumber', 'BedNumber', 'bed_number', 'Bed_Number',
          'bed', 'Bed', 'icuBedNo', 'ICUBedNo', 'icuBedNumber', 'ICUBedNumber',
          'bedId', 'BedId', 'bedID', 'BedID'
        ], '');

        // Extract ICUBedId (primary key) from bed data
        // Try multiple field name variations - the API might use different naming
        // Note: The API returns 'icuId' as the field name for the ICU Bed ID
        const icuBedId = extractField(bed, [
          'icuId', 'ICUId', 'icu_id', 'ICU_ID', 'ICUID', // Primary field name from API
          'icuBedId', 'ICUBedId', 'icu_bed_id', 'ICU_Bed_Id', 'ICUBedID', 'ICUBed_Id',
          'id', 'Id', 'ID', 
          'bedId', 'BedId', 'bedID', 'BedID', 'Bed_Id', 'bed_id',
          'ICUBedId', 'ICUBedID', 'icuBedID',
          // Also check nested structures
        ], null);
        
        // If still not found, check if there's a nested bed object
        let finalIcuBedId = icuBedId;
        if (!finalIcuBedId && bed.bed) {
          finalIcuBedId = extractField(bed.bed, [
            'icuBedId', 'ICUBedId', 'id', 'Id', 'ID'
          ], null);
        }
        if (!finalIcuBedId && bed.icuBed) {
          finalIcuBedId = extractField(bed.icuBed, [
            'icuBedId', 'ICUBedId', 'id', 'Id', 'ID'
          ], null);
        }
        

        const status = extractField(bed, [
          'status', 'Status', 'icuAdmissionStatus', 'ICUAdmissionStatus', 'bedStatus', 'BedStatus', 'bed_status', 'Bed_Status'
        ], 'Available');

        // Extract icuPatientStatus from bed level first, then patient data level
        // This field determines the bed status display (Critical, Serious, Available)
        let icuPatientStatusRaw = extractField(bed, [
          'icuPatientStatus', 'ICUPatientStatus', 'icu_patient_status', 'ICU_Patient_Status',
          'patientStatus', 'PatientStatus', 'patient_status', 'Patient_Status'
        ], null);

        // Map patient data if available
        let patient: ICUPatient | undefined = undefined;
        const patientData = bed.patient || bed.Patient || bed.patientData || bed.PatientData;
        if (patientData) {
          // If not found at bed level, extract from patient data
          if (!icuPatientStatusRaw) {
            icuPatientStatusRaw = extractField(patientData, [
              'icuPatientStatus', 'ICUPatientStatus', 'icu_patient_status', 'ICU_Patient_Status',
              'patientCondition', 'PatientCondition', 'patient_condition', 'Patient_Condition',
              'condition', 'Condition', 'patientStatus', 'PatientStatus',
              'status', 'Status', 'severity', 'Severity', 'patientSeverity', 'PatientSeverity'
            ], 'Stable');
          }
          
          // Map icuPatientStatus to severity (Critical, Serious, Stable)
          // Normalize the status value to determine severity
          const statusLower = String(icuPatientStatusRaw || 'Stable').toLowerCase().trim();
          let severity: 'Critical' | 'Serious' | 'Stable' = 'Stable';
          
          // Check for Critical status
          if (statusLower.includes('critical') || statusLower.includes('severe') || 
              statusLower.includes('emergency') || statusLower.includes('unstable') ||
              statusLower === 'critical' || statusLower === 'cr' || statusLower === 'c') {
            severity = 'Critical';
          }
          // Check for Serious status
          else if (statusLower.includes('serious') || statusLower.includes('moderate') ||
                   statusLower.includes('acute') || statusLower === 'serious' || 
                   statusLower === 'sr' || statusLower === 's') {
            severity = 'Serious';
          }
          // Default to Stable for other statuses (stable, improving, good, etc.)
          else {
            severity = 'Stable';
          }
          
          console.log('Bed', bedNumber, '- icuPatientStatus:', icuPatientStatusRaw, 'mapped to severity:', severity);

          const ventilatorSupportRaw = extractField(patientData, [
            'ventilatorSupport', 'VentilatorSupport', 'ventilator_support', 'Ventilator_Support',
            'onVentilator', 'OnVentilator', 'isVentilatorAttached', 'IsVentilatorAttached',
            'ventilator', 'Ventilator'
          ], false);
          const ventilatorSupport = typeof ventilatorSupportRaw === 'boolean' 
            ? ventilatorSupportRaw 
            : (String(ventilatorSupportRaw).toLowerCase() === 'true' || String(ventilatorSupportRaw).toLowerCase() === 'yes');

          // Extract patientICUAdmissionId (UUID) - this is the actual ID we need for API calls
          // First check bed level, then patient data level
          let patientICUAdmissionId = extractField(bed, [
            'patientICUAdmissionId', 'PatientICUAdmissionId', 'patient_icu_admission_id', 'Patient_ICU_Admission_Id',
            'icuAdmissionId', 'ICUAdmissionId', 'icu_admission_id', 'ICU_Admission_Id'
          ], null);
          
          // If not found at bed level, check patient data level
          if (!patientICUAdmissionId) {
            patientICUAdmissionId = extractField(patientData, [
              'patientICUAdmissionId', 'PatientICUAdmissionId', 'patient_icu_admission_id', 'Patient_ICU_Admission_Id',
              'id', 'Id', 'admissionId', 'AdmissionId'
            ], null);
          }
          
          // Validate UUID format (basic check - UUIDs are 36 characters with dashes)
          // If it's a number or doesn't look like a UUID, try to find the actual UUID field
          if (patientICUAdmissionId && typeof patientICUAdmissionId === 'number') {
            console.warn('patientICUAdmissionId is a number, not a UUID. Bed:', bedNumber, 'Value:', patientICUAdmissionId);
            // Try to find UUID in other fields
            const uuidCandidate = extractField(bed, [
              'patientICUAdmissionId', 'PatientICUAdmissionId', 'patient_icu_admission_id', 'Patient_ICU_Admission_Id',
              'icuAdmissionId', 'ICUAdmissionId', 'icu_admission_id', 'ICU_Admission_Id'
            ], null) || extractField(patientData, [
              'patientICUAdmissionId', 'PatientICUAdmissionId', 'patient_icu_admission_id', 'Patient_ICU_Admission_Id'
            ], null);
            
            if (uuidCandidate && typeof uuidCandidate === 'string' && uuidCandidate.length > 20) {
              patientICUAdmissionId = uuidCandidate;
            } else {
              // If we can't find a UUID, set to null so we don't try to navigate
              console.warn('No valid UUID found for bed:', bedNumber);
              patientICUAdmissionId = null;
            }
          }
          
          console.log('Extracted patientICUAdmissionId for bed', bedNumber, ':', patientICUAdmissionId, 'Type:', typeof patientICUAdmissionId);

          // Extract PatientId
          const patientId = extractField(patientData, [
            'patientId', 'PatientId', 'patient_id', 'Patient_ID',
            'id', 'Id', 'ID'
          ], null) || extractField(bed, [
            'patientId', 'PatientId', 'patient_id', 'Patient_ID'
          ], null);

          // Extract DoctorId
          const doctorId = extractField(bed, [
            'doctorId', 'DoctorId', 'doctor_id', 'Doctor_ID',
            'attendingDoctorId', 'AttendingDoctorId', 'attending_doctor_id', 'Attending_Doctor_ID'
          ], null) || extractField(patientData, [
            'doctorId', 'DoctorId', 'doctor_id', 'Doctor_ID',
            'attendingDoctorId', 'AttendingDoctorId', 'attending_doctor_id', 'Attending_Doctor_ID'
          ], null);

          // Extract PatientCondition (separate from condition)
          const patientCondition = extractField(bed, [
            'patientCondition', 'PatientCondition', 'patient_condition', 'Patient_Condition'
          ], null) || extractField(patientData, [
            'patientCondition', 'PatientCondition', 'patient_condition', 'Patient_Condition'
          ], null);

          patient = {
            id: patientICUAdmissionId || extractField(patientData, ['id', 'Id', 'patientId', 'PatientId'], 0),
            patientICUAdmissionId: patientICUAdmissionId, // Store the UUID separately
            patientId: patientId,
            doctorId: doctorId,
            icuBedId: icuBedId, // Store the ICU Bed ID (primary key)
            bedNumber: bedNumber,
            patientName: extractField(patientData, [
              'patientName', 'PatientName', 'patient_name', 'Patient_Name',
              'name', 'Name', 'fullName', 'FullName'
            ], 'Unknown Patient'),
            age: Number(extractField(patientData, [
              'age', 'Age', 'patientAge', 'PatientAge', 'patient_age', 'Patient_Age'
            ], 0)) || 0,
            gender: extractField(patientData, [
              'gender', 'Gender', 'sex', 'Sex', 'patientGender', 'PatientGender'
            ], 'Unknown'),
            admissionDate: extractField(patientData, [
              'admissionDate', 'AdmissionDate', 'admission_date', 'Admission_Date',
              'admitDate', 'AdmitDate', 'admit_date', 'Admit_Date'
            ], new Date().toISOString().split('T')[0]),
            admissionTime: extractField(patientData, [
              'admissionTime', 'AdmissionTime', 'admission_time', 'Admission_Time',
              'admitTime', 'AdmitTime', 'admit_time', 'Admit_Time',
              'time', 'Time'
            ], new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })),
            condition: extractField(patientData, [
              'condition', 'Condition', 'patientCondition', 'PatientCondition',
              'diagnosis', 'Diagnosis', 'diagnosisDescription', 'DiagnosisDescription'
            ], 'Not Specified'),
            patientCondition: patientCondition || null,
            icuPatientStatus: icuPatientStatusRaw || null,
            severity: severity,
            attendingDoctor: extractField(patientData, [
              'attendingDoctor', 'AttendingDoctor', 'attending_doctor', 'Attending_Doctor',
              'doctor', 'Doctor', 'doctorName', 'DoctorName', 'admittedBy', 'AdmittedBy'
            ], 'Not Assigned'),
    vitals: {
              heartRate: Number(extractField(patientData, [
                'heartRate', 'HeartRate', 'heart_rate', 'Heart_Rate',
                'vitals.heartRate', 'vitals.HeartRate'
              ], 0)) || 0,
              bloodPressure: extractField(patientData, [
                'bloodPressure', 'BloodPressure', 'blood_pressure', 'Blood_Pressure',
                'bp', 'BP', 'vitals.bloodPressure', 'vitals.BloodPressure'
              ], '0/0'),
              temperature: Number(extractField(patientData, [
                'temperature', 'Temperature', 'temp', 'Temp',
                'vitals.temperature', 'vitals.Temperature'
              ], 0)) || 0,
              oxygenSaturation: Number(extractField(patientData, [
                'oxygenSaturation', 'OxygenSaturation', 'oxygen_saturation', 'Oxygen_Saturation',
                'o2Sat', 'O2Sat', 'spo2', 'SpO2', 'vitals.oxygenSaturation', 'vitals.OxygenSaturation'
              ], 0)) || 0,
              respiratoryRate: Number(extractField(patientData, [
                'respiratoryRate', 'RespiratoryRate', 'respiratory_rate', 'Respiratory_Rate',
                'rr', 'RR', 'vitals.respiratoryRate', 'vitals.RespiratoryRate'
              ], 0)) || 0,
            },
            diagnosis: extractField(patientData, [
              'diagnosis', 'Diagnosis', 'diagnosisDescription', 'DiagnosisDescription',
              'diagnosis_desc', 'Diagnosis_Desc'
            ], 'Not Specified'),
            treatment: extractField(patientData, [
              'treatment', 'Treatment', 'treatmentPlan', 'TreatmentPlan',
              'treatment_plan', 'Treatment_Plan', 'medications', 'Medications'
            ], 'Not Specified'),
            ventilatorSupport: ventilatorSupport,
          };
        }
        
        // Extract ICUAdmissionStatus (Occupied/Discharged)
        const icuAdmissionStatus = extractField(bed, [
          'icuAdmissionStatus', 'ICUAdmissionStatus', 'icu_admission_status', 'ICU_Admission_Status',
          'admissionStatus', 'AdmissionStatus', 'admission_status', 'Admission_Status'
        ], 'Occupied');
        
        // If not found at bed level, check patient data
        let finalICUAdmissionStatus = icuAdmissionStatus;
        if (patientData && !finalICUAdmissionStatus) {
          finalICUAdmissionStatus = extractField(patientData, [
            'icuAdmissionStatus', 'ICUAdmissionStatus', 'icu_admission_status', 'ICU_Admission_Status',
            'admissionStatus', 'AdmissionStatus', 'admission_status', 'Admission_Status'
          ], 'Occupied');
        }
        
        // Determine bed status display based on ICUPatientStatus
        // Map ICUPatientStatus to: Critical (red) or else Green
        let bedStatusDisplay: 'Critical' | 'Green' = 'Green';
        if (icuPatientStatusRaw) {
          const statusLower = String(icuPatientStatusRaw).toLowerCase().trim();
          if (statusLower.includes('critical') || statusLower === 'critical' || statusLower === 'cr' || statusLower === 'c') {
            bedStatusDisplay = 'Critical';
          }
        }

        // finalIcuBedId is already declared above, just use it here
        
        return {
          bedNumber,
          icuBedId: finalIcuBedId, // Store ICU Bed ID in bed object (ensure it's always set if available)
          id: finalIcuBedId, // Also set id for compatibility
          status: status === 'Occupied' || patient ? 'Occupied' : 'Available',
          icuPatientStatus: bedStatusDisplay, // Store ICUPatientStatus for display (Critical or Green)
          icuAdmissionStatus: finalICUAdmissionStatus, // Store ICUAdmissionStatus (Occupied/Discharged)
          patient,
          // Store raw bed data for debugging
          _rawBedData: bed,
        };
      })
    : Array.from({ length: 15 }, (_, i) => {
        // Fallback to calculated beds if API data not available
  const bedNumber = `ICU-${(i + 1).toString().padStart(2, '0')}`;
        const patient = patients.find(p => p.bedNumber === bedNumber);
  return {
    bedNumber,
    status: patient ? 'Occupied' : 'Available',
    patient,
  };
});

  const occupiedBeds = icuBeds.filter(bed => bed.status === 'Occupied').length;
  const availableBeds = icuBeds.filter(bed => bed.status === 'Available').length;
  const criticalPatients = patients.filter(p => p.severity === 'Critical').length;
  const onVentilator = patients.filter(p => p.ventilatorSupport).length;

  // Helper function to map API bed details to ICUPatient
  const mapBedDetailsToPatient = (bedDetails: any): ICUPatient | null => {
    if (!bedDetails) {
      return null;
    }

    const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
      if (!data) return defaultValue;
      
      for (const field of fieldVariations) {
        // Check direct field
        let value = data?.[field];
        if (value !== undefined && value !== null && value !== '') {
          return value;
        }
        
        // Check nested paths (e.g., Doctor.DoctorName, Doctor.name)
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
        
        // Check nested objects (Doctor, Patient, etc.)
        if (data?.Doctor?.[field]) {
          value = data.Doctor[field];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
        if (data?.doctor?.[field]) {
          value = data.doctor[field];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
        if (data?.AttendingDoctor?.[field]) {
          value = data.AttendingDoctor[field];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
        if (data?.attendingDoctor?.[field]) {
          value = data.attendingDoctor[field];
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
        if (data?.Patient?.[field]) {
          value = data.Patient[field];
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
      }
      return defaultValue;
    };

    // Handle API response structure: data.admissions[0] contains patient data
    // The API returns: { success: true, data: { icuId: 5, icuBedNo: "B02", admissions: [...] } }
    let actualBedData = bedDetails;
    let patientData = null;
    
    // Check if response has a 'data' wrapper
    if (bedDetails.data) {
      actualBedData = bedDetails.data;
    }
    
    // Extract patient data from admissions array (most recent admission)
    if (actualBedData.admissions && Array.isArray(actualBedData.admissions) && actualBedData.admissions.length > 0) {
      patientData = actualBedData.admissions[0]; // Get the first/most recent admission
    } else if (bedDetails.admissions && Array.isArray(bedDetails.admissions) && bedDetails.admissions.length > 0) {
      patientData = bedDetails.admissions[0];
    } else {
      // Fallback to old structure
      patientData = bedDetails.patient || bedDetails.Patient || bedDetails.patientData || bedDetails.PatientData || bedDetails;
    }
    
    const bedData = actualBedData;

    // Extract icuPatientStatus and map to severity
    let icuPatientStatusRaw = extractField(bedData, [
      'icuPatientStatus', 'ICUPatientStatus', 'icu_patient_status', 'ICU_Patient_Status',
      'patientStatus', 'PatientStatus', 'patient_status', 'Patient_Status'
    ], null);

    if (!icuPatientStatusRaw) {
      icuPatientStatusRaw = extractField(patientData, [
        'icuPatientStatus', 'ICUPatientStatus', 'icu_patient_status', 'ICU_Patient_Status',
        'patientCondition', 'PatientCondition', 'patient_condition', 'Patient_Condition',
        'condition', 'Condition', 'patientStatus', 'PatientStatus',
        'status', 'Status', 'severity', 'Severity', 'patientSeverity', 'PatientSeverity'
      ], 'Stable');
    }

    const statusLower = String(icuPatientStatusRaw || 'Stable').toLowerCase().trim();
    let severity: 'Critical' | 'Serious' | 'Stable' = 'Stable';
    
    if (statusLower.includes('critical') || statusLower.includes('severe') || 
        statusLower.includes('emergency') || statusLower.includes('unstable') ||
        statusLower === 'critical' || statusLower === 'cr' || statusLower === 'c') {
      severity = 'Critical';
    } else if (statusLower.includes('serious') || statusLower.includes('moderate') ||
               statusLower.includes('acute') || statusLower === 'serious' || 
               statusLower === 'sr' || statusLower === 's') {
      severity = 'Serious';
    }

    const ventilatorSupportRaw = extractField(patientData, [
      'onVentilator', 'OnVentilator', 'on_ventilator', 'On_Ventilator', // Primary field name from API
      'ventilatorSupport', 'VentilatorSupport', 'ventilator_support', 'Ventilator_Support',
      'isVentilatorAttached', 'IsVentilatorAttached',
      'ventilator', 'Ventilator'
    ], false);
    const ventilatorSupport = typeof ventilatorSupportRaw === 'boolean' 
      ? ventilatorSupportRaw 
      : (String(ventilatorSupportRaw).toLowerCase() === 'true' || String(ventilatorSupportRaw).toLowerCase() === 'yes');

    // Extract patientICUAdmissionId from patientData (admission record)
    const patientICUAdmissionId = extractField(patientData, [
      'patientICUAdmissionId', 'PatientICUAdmissionId', 'patient_icu_admission_id', 'Patient_ICU_Admission_Id',
      'icuAdmissionId', 'ICUAdmissionId', 'icu_admission_id', 'ICU_Admission_Id',
      'id', 'Id', 'admissionId', 'AdmissionId'
    ], null) || extractField(bedData, [
      'patientICUAdmissionId', 'PatientICUAdmissionId', 'patient_icu_admission_id', 'Patient_ICU_Admission_Id',
      'icuAdmissionId', 'ICUAdmissionId', 'icu_admission_id', 'ICU_Admission_Id'
    ], null);

    // Extract icuBedId from bedData (icuId field)
    const icuBedId = extractField(bedData, [
      'icuId', 'ICUId', 'icu_id', 'ICU_ID', // Primary field name
      'icuBedId', 'ICUBedId', 'icu_bed_id', 'ICU_Bed_Id',
      'id', 'Id', 'ID', 'bedId', 'BedId', 'bedID', 'BedID'
    ], null);

    // Extract bedNumber from bedData
    const bedNumber = extractField(bedData, [
      'icuBedNo', 'ICUBedNo', 'icuBedNumber', 'ICUBedNumber', // Primary field name from API
      'bedNumber', 'BedNumber', 'bed_number', 'Bed_Number',
      'bed', 'Bed'
    ], '');

    // Extract PatientId from patientData (admission record)
    const patientId = extractField(patientData, [
      'patientId', 'PatientId', 'patient_id', 'Patient_ID',
      'id', 'Id', 'ID'
    ], null) || extractField(bedData, [
      'patientId', 'PatientId', 'patient_id', 'Patient_ID'
    ], null);

    // Extract PatientNo
    const patientNo = extractField(patientData, [
      'patientNo', 'PatientNo', 'patient_no', 'Patient_No',
      'patientNumber', 'PatientNumber', 'patient_number', 'Patient_Number'
    ], null) || extractField(bedData, [
      'patientNo', 'PatientNo', 'patient_no', 'Patient_No',
      'patientNumber', 'PatientNumber', 'patient_number', 'Patient_Number'
    ], null);

    // Extract DoctorId
    const doctorId = extractField(bedData, [
      'doctorId', 'DoctorId', 'doctor_id', 'Doctor_ID',
      'attendingDoctorId', 'AttendingDoctorId', 'attending_doctor_id', 'Attending_Doctor_ID'
    ], null) || extractField(patientData, [
      'doctorId', 'DoctorId', 'doctor_id', 'Doctor_ID',
      'attendingDoctorId', 'AttendingDoctorId', 'attending_doctor_id', 'Attending_Doctor_ID'
    ], null);

    // Extract PatientCondition (separate from condition)
    const patientCondition = extractField(bedData, [
      'patientCondition', 'PatientCondition', 'patient_condition', 'Patient_Condition'
    ], null) || extractField(patientData, [
      'patientCondition', 'PatientCondition', 'patient_condition', 'Patient_Condition'
    ], null);

    // Extract ICUAdmissionStatus (Occupied/Discharged)
    let icuAdmissionStatus = extractField(bedData, [
      'icuAdmissionStatus', 'ICUAdmissionStatus', 'icu_admission_status', 'ICU_Admission_Status',
      'admissionStatus', 'AdmissionStatus', 'admission_status', 'Admission_Status'
    ], null);
    
    if (!icuAdmissionStatus && patientData) {
      icuAdmissionStatus = extractField(patientData, [
        'icuAdmissionStatus', 'ICUAdmissionStatus', 'icu_admission_status', 'ICU_Admission_Status',
        'admissionStatus', 'AdmissionStatus', 'admission_status', 'Admission_Status'
      ], null);
    }
    
    // If still not found, check nested structures
    if (!icuAdmissionStatus && patientData) {
      icuAdmissionStatus = extractField(patientData, [
        'PatientICUAdmission.icuAdmissionStatus', 'PatientICUAdmission.ICUAdmissionStatus',
        'admission.icuAdmissionStatus', 'admission.ICUAdmissionStatus'
      ], null);
    }
    
    icuAdmissionStatus = icuAdmissionStatus || 'Occupied';

    return {
      id: patientICUAdmissionId || extractField(patientData, ['id', 'Id', 'patientId', 'PatientId'], 0),
      patientICUAdmissionId: patientICUAdmissionId,
      patientId: patientId,
      patientNo: patientNo,
      doctorId: doctorId,
      icuBedId: icuBedId,
      bedNumber: bedNumber,
      patientName: extractField(patientData, [
        'patientName', 'PatientName', 'patient_name', 'Patient_Name',
        'name', 'Name', 'fullName', 'FullName'
      ], 'Unknown Patient'),
      age: Number(extractField(patientData, [
        'patientAge', 'PatientAge', 'patient_age', 'Patient_Age', // Primary field name from API
        'age', 'Age'
      ], 0)) || 0,
      gender: extractField(patientData, [
        'patientGender', 'PatientGender', 'patient_gender', 'Patient_Gender', // Primary field name from API
        'gender', 'Gender', 'sex', 'Sex'
      ], 'Unknown'),
      admissionDate: extractField(patientData, [
        'icuAllocationFromDate', 'ICUAllocationFromDate', 'icu_allocation_from_date', // Primary field name from API
        'admissionDate', 'AdmissionDate', 'admission_date', 'Admission_Date',
        'admitDate', 'AdmitDate', 'admit_date', 'Admit_Date'
      ], new Date().toISOString().split('T')[0]),
      admissionTime: extractField(patientData, [
        'icuAllocationFromDate', 'ICUAllocationFromDate', // Extract time from date field
        'admissionTime', 'AdmissionTime', 'admission_time', 'Admission_Time',
        'admitTime', 'AdmitTime', 'admit_time', 'Admit_Time',
        'time', 'Time'
      ], new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })),
      condition: extractField(patientData, [
        'condition', 'Condition', 'patientCondition', 'PatientCondition',
        'diagnosis', 'Diagnosis', 'diagnosisDescription', 'DiagnosisDescription'
      ], 'Not Specified'),
      patientCondition: patientCondition || 'Not Specified',
      icuPatientStatus: icuPatientStatusRaw || 'Stable',
      icuAdmissionStatus: icuAdmissionStatus,
      severity: severity,
      attendingDoctor: (() => {
        // Try to extract doctor name from various locations
        let doctorName = extractField(patientData, [
          'attendingDoctor', 'AttendingDoctor', 'attending_doctor', 'Attending_Doctor',
          'doctor', 'Doctor', 'doctorName', 'DoctorName', 'admittedBy', 'AdmittedBy',
          'Doctor.DoctorName', 'Doctor.name', 'Doctor.Name', 'Doctor.UserName',
          'doctor.doctorName', 'doctor.name', 'doctor.Name', 'doctor.userName',
          'AttendingDoctor.DoctorName', 'AttendingDoctor.name', 'AttendingDoctor.Name',
          'attendingDoctor.doctorName', 'attendingDoctor.name', 'attendingDoctor.Name'
        ], null);
        
        // If not found in patientData, try bedData
        if (!doctorName) {
          doctorName = extractField(bedData, [
            'attendingDoctor', 'AttendingDoctor', 'attending_doctor', 'Attending_Doctor',
            'doctor', 'Doctor', 'doctorName', 'DoctorName', 'admittedBy', 'AdmittedBy',
            'Doctor.DoctorName', 'Doctor.name', 'Doctor.Name', 'Doctor.UserName',
            'doctor.doctorName', 'doctor.name', 'doctor.Name', 'doctor.userName'
          ], null);
        }
        
        // If we have doctorId but no name, try to look it up from doctorOptions
        if (!doctorName && doctorId && doctorOptions.length > 0) {
          const doctor = doctorOptions.find((d: any) => {
            const dId = String((d as any).id || (d as any).Id || (d as any).UserId || '');
            return dId === String(doctorId);
          });
          if (doctor) {
            doctorName = (doctor as any).name || (doctor as any).Name || (doctor as any).UserName || null;
          }
        }
        
        return doctorName || 'Not Assigned';
      })(),
      vitals: {
        heartRate: Number(extractField(patientData, [
          'heartRate', 'HeartRate', 'heart_rate', 'Heart_Rate',
          'vitals.heartRate', 'vitals.HeartRate'
        ], 0)) || 0,
        bloodPressure: extractField(patientData, [
          'bloodPressure', 'BloodPressure', 'blood_pressure', 'Blood_Pressure',
          'bp', 'BP', 'vitals.bloodPressure', 'vitals.BloodPressure'
        ], '0/0'),
        temperature: Number(extractField(patientData, [
          'temperature', 'Temperature', 'temp', 'Temp',
          'vitals.temperature', 'vitals.Temperature'
        ], 0)) || 0,
        oxygenSaturation: Number(extractField(patientData, [
          'oxygenSaturation', 'OxygenSaturation', 'oxygen_saturation', 'Oxygen_Saturation',
          'o2Sat', 'O2Sat', 'spo2', 'SpO2', 'vitals.oxygenSaturation', 'vitals.OxygenSaturation'
        ], 0)) || 0,
        respiratoryRate: Number(extractField(patientData, [
          'respiratoryRate', 'RespiratoryRate', 'respiratory_rate', 'Respiratory_Rate',
          'rr', 'RR', 'vitals.respiratoryRate', 'vitals.RespiratoryRate'
        ], 0)) || 0,
      },
      diagnosis: extractField(patientData, [
        'diagnosis', 'Diagnosis', 'diagnosisDescription', 'DiagnosisDescription',
        'diagnosis_desc', 'Diagnosis_Desc'
      ], 'Not Specified'),
      treatment: extractField(patientData, [
        'treatementDetails', 'TreatementDetails', 'treatmentDetails', 'TreatmentDetails', // Primary field name from API (note: typo in API)
        'treatment', 'Treatment', 'treatmentPlan', 'TreatmentPlan',
        'treatment_plan', 'Treatment_Plan', 'medications', 'Medications'
      ], 'Not Specified'),
      ventilatorSupport: ventilatorSupport,
    };
  };

  // Function to fetch ICU visit vitals for an ICU admission
  const fetchLatestVitals = async (icuAdmissionId: string | number | null | undefined) => {
    if (!icuAdmissionId) {
      setVitalsData(null);
      return;
    }

    try {
      setLoadingVitals(true);
      console.log('Fetching ICU visit vitals for ICU admission:', icuAdmissionId);
      const response = await apiRequest<any>(`/icu-visit-vitals/icu-admission/${icuAdmissionId}`);
      console.log('%%%%%%%%%%%%%%%%%%%%%ICU visit vitals API response:', response);
      
      // Handle different response structures: { data: [...] } or direct array or single object
      let vitals = null;
      
      if (Array.isArray(response)) {
        // If response is an array, get the latest/most recent vitals (last item or first item)
        vitals = response.length > 0 ? response[response.length - 1] : null;
      } else if (response?.data) {
        if (Array.isArray(response.data)) {
          vitals = response.data.length > 0 ? response.data[response.data.length - 1] : null;
        } else {
          vitals = response.data;
        }
      } else if (response) {
        vitals = response;
      }
      
      if (vitals) {
        console.log('ICU visit vitals data extracted:', vitals);
        setVitalsData(vitals);
      } else {
        console.warn('No vitals data found in API response');
        setVitalsData(null);
      }
    } catch (error) {
      console.error('Error fetching ICU visit vitals:', error);
      setVitalsData(null);
    } finally {
      setLoadingVitals(false);
    }
  };

  // Use API bed details if available, otherwise fall back to bed layout data
  const selectedPatient = selectedBedDetails 
    ? mapBedDetailsToPatient(selectedBedDetails)
    : icuBeds.find((bed: any) => (bed.icuBedId || bed.id) === selectedICUBedId)?.patient;

  // Fetch vitals when selectedPatient changes
  useEffect(() => {
    if (selectedPatient?.patientICUAdmissionId) {
      fetchLatestVitals(selectedPatient.patientICUAdmissionId);
    } else {
      setVitalsData(null);
    }
  }, [selectedPatient?.patientICUAdmissionId]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-scrollable-container">
        <div className="dashboard-header-section">
          <div className="dashboard-header-content">
          <div>
              <h1 className="dashboard-header">ICU Management</h1>
              <p className="dashboard-subheader">Intensive Care Unit monitoring and management</p>
          </div>
            <Button
              onClick={openAddICUAdmission}
              className="flex items-center gap-2"
            >
              <Plus className="size-4" />
              Add New ICU Admission
            </Button>
        </div>
      </div>
        <div className="dashboard-main-content">
      <Dialog open={showAddICUAdmission} onOpenChange={setShowAddICUAdmission}>
        <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]">
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
            <DialogTitle>Add New ICU Admission</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
            <div className="space-y-4 py-4">
            {addICUAdmissionError && (
              <div className="text-red-600 text-sm">{addICUAdmissionError}</div>
            )}
            <div className="space-y-4">
              <div className="w-full">
                <Label htmlFor="add-patient-search">Patient *</Label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="add-patient-search"
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
                            if (!patientSearchTerm) return false;
                            const searchLower = patientSearchTerm.toLowerCase();
                            // Extract patientId similar to FrontDesk pattern
                            const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                            const patientNo = patient.patientNo || patient.PatientNo || '';
                            const patientName = patient.patientName || patient.PatientName || '';
                            const lastName = patient.lastName || patient.LastName || '';
                            const fullName = `${patientName} ${lastName}`.trim();
                            const phoneNo = patient.phoneNo || patient.PhoneNo || patient.phone || '';
                            return (
                              String(patientId).toLowerCase().includes(searchLower) ||
                              String(patientNo).toLowerCase().includes(searchLower) ||
                              fullName.toLowerCase().includes(searchLower) ||
                              phoneNo.includes(patientSearchTerm)
                            );
                          })
                          .map((patient: any) => {
                            // Extract patientId similar to FrontDesk pattern
                            const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                            const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                            const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                            const lastName = (patient as any).lastName || (patient as any).LastName || '';
                            const fullName = `${patientName} ${lastName}`.trim();
                            const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                            const isSelected = addICUAdmissionForm.patientId === patientId;
                            
                            return (
                              <tr
                                key={patientId}
                                onClick={async () => {
                                  setAddICUAdmissionForm({ ...addICUAdmissionForm, patientId });
                                  setPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
                                  // If patient type is already selected, fetch conditional data
                                  if (addICUAdmissionForm.patientType === 'OPD') {
                                    await fetchPatientAppointments(patientId);
                                  } else if (addICUAdmissionForm.patientType === 'Emergency') {
                                    await fetchPatientEmergencyBedSlots(patientId);
                                  }
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
                      if (!patientSearchTerm) return false;
                      const searchLower = patientSearchTerm.toLowerCase();
                      // Prioritize UUID fields (PatientId is primary from API, then patientId, then id if UUID string)
                      const patientId = patient.PatientId || patient.patientId || 
                        patient.patient_id || patient.Patient_ID ||
                        (patient.id && typeof patient.id === 'string' && patient.id.length > 20 ? patient.id : '') || '';
                      const patientNo = patient.patientNo || patient.PatientNo || '';
                      const patientName = patient.patientName || patient.PatientName || '';
                      const lastName = patient.lastName || patient.LastName || '';
                      const fullName = `${patientName} ${lastName}`.trim();
                      const phoneNo = patient.phoneNo || patient.PhoneNo || patient.phone || '';
                      return (
                        String(patientId).toLowerCase().includes(searchLower) ||
                        String(patientNo).toLowerCase().includes(searchLower) ||
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
              {/* Patient Type */}
              <div>
                <Label htmlFor="patientType">Patient Type *</Label>
                <select
                  id="patientType"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md"
                  value={addICUAdmissionForm.patientType}
                  onChange={(e) => handlePatientTypeChange(e.target.value)}
                  required
                >
                  <option value="">Select Patient Type</option>
                  <option value="OPD">OPD</option>
                  <option value="IPD">IPD</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Direct">Direct</option>
                 
                </select>
              </div>

              {/* Conditional Fields based on PatientType */}
              {addICUAdmissionForm.patientType === 'OPD' && (
                <div>
                  <Label htmlFor="patientAppointmentId">Patient Appointment ID *</Label>
                  <select
                    id="patientAppointmentId"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={addICUAdmissionForm.patientAppointmentId}
                    onChange={(e) => setAddICUAdmissionForm({ ...addICUAdmissionForm, patientAppointmentId: e.target.value })}
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

              {addICUAdmissionForm.patientType === 'IPD' && (
                <div>
                  <Label htmlFor="roomAdmissionId">Patient IPD Admission ID *</Label>
                  <select
                    id="roomAdmissionId"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={addICUAdmissionForm.roomAdmissionId}
                    onChange={(e) => setAddICUAdmissionForm({ ...addICUAdmissionForm, roomAdmissionId: e.target.value })}
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

              {addICUAdmissionForm.patientType === 'Emergency' && (
                <div>
                  <Label htmlFor="emergencyAdmissionId">Emergency Admission Bed No *</Label>
                  <select
                    id="emergencyAdmissionId"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={addICUAdmissionForm.emergencyAdmissionId}
                    onChange={(e) => setAddICUAdmissionForm({ ...addICUAdmissionForm, emergencyAdmissionId: e.target.value })}
                    required
                  >
                    <option value="">Select Emergency Admission Bed No</option>
                    {availableEmergencyBedSlots.map((slot: any) => {
                      // Extract EmergencyAdmissionId (prioritize this field)
                      const emergencyAdmissionId = slot.emergencyAdmissionId || slot.EmergencyAdmissionId || slot.id || '';
                      // Fallback to other IDs if EmergencyAdmissionId is not available
                      const slotId = emergencyAdmissionId || slot.emergencyAdmissionId || slot.EmergencyAdmissionId || '';
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

              <div className="w-full">
                <Label htmlFor="add-icubed-search">ICU Bed *</Label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="add-icubed-search"
                    placeholder="Search by Bed Number, Bed ID, or Status..."
                    value={icuBedSearchTerm}
                    onChange={(e) => setIcuBedSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {icuBedSearchTerm && (
                  <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Bed Number</th>
                          <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Bed ID</th>
                          <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {icuBedOptions
                          .filter((bed: any) => {
                            if (!icuBedSearchTerm) return false;
                            const searchLower = icuBedSearchTerm.toLowerCase();
                            const bedNumber = bed.bedNumber || bed.icuBedNo || bed.bedNo || '';
                            const bedId = bed.icuBedId || bed.id || bed.bedId || '';
                            const status = bed.status || bed.Status || '';
                            return (
                              String(bedNumber).toLowerCase().includes(searchLower) ||
                              String(bedId).toLowerCase().includes(searchLower) ||
                              String(status).toLowerCase().includes(searchLower)
                            );
                          })
                          .map((bed: any, idx: number) => {
                            // Extract ICU bed ID and ICU ID similar to FrontDesk pattern
                            const bedId = (bed as any).icuBedId || (bed as any).ICUBedId || (bed as any).id || '';
                            const icuId = (bed as any).icuId || (bed as any).ICUId || (bed as any).ICU_ID || '';
                            const bedNumber = (bed as any).bedNumber || (bed as any).icuBedNo || (bed as any).ICUBedNo || (bed as any).bedNo || `Bed ${bed.id || idx}`;
                            const status = (bed as any).status || (bed as any).Status || 'Available';
                            const isSelected = addICUAdmissionForm.icuBedId === String(bedId);
                            return (
                              <tr
                                key={bedId || idx}
                                onClick={() => {
                                  setAddICUAdmissionForm({
                                    ...addICUAdmissionForm,
                                    icuBedId: String(bedId),
                                    icuId: String(icuId),
                                    icuBedNo: bedNumber,
                                  });
                                  setIcuBedSearchTerm(bedNumber);
                                }}
                                className={`border-b border-gray-100 cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''}`}
                              >
                                <td className="py-2 px-3 text-sm text-gray-900 font-mono">{bedNumber}</td>
                                <td className="py-2 px-3 text-sm text-gray-600">{String(bedId).substring(0, 8)}</td>
                                <td className="py-2 px-3 text-sm text-gray-600">
                                  <Badge variant={status === 'Occupied' ? 'destructive' : 'secondary'}>
                                    {status}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                    {icuBedOptions.filter((bed: any) => {
                      if (!icuBedSearchTerm) return false;
                      const searchLower = icuBedSearchTerm.toLowerCase();
                      const bedNumber = (bed as any).bedNumber || (bed as any).icuBedNo || (bed as any).ICUBedNo || (bed as any).bedNo || '';
                      const bedId = (bed as any).icuBedId || (bed as any).ICUBedId || (bed as any).id || '';
                      const status = (bed as any).status || (bed as any).Status || '';
                      return (
                        String(bedNumber).toLowerCase().includes(searchLower) ||
                        String(bedId).toLowerCase().includes(searchLower) ||
                        String(status).toLowerCase().includes(searchLower)
                      );
                    }).length === 0 && (
                      <div className="text-center py-8 text-sm text-gray-700">
                        No ICU beds found. Try a different search term.
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Doctor Selection - Same pattern as Admissions */}
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
                            const isSelected = addICUAdmissionForm.admittedByDoctorId === doctorId;
                            return (
                              <tr
                                key={doctorId}
                                onClick={() => {
                                  setAddICUAdmissionForm({ 
                                    ...addICUAdmissionForm, 
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ICU Patient Status</Label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={addICUAdmissionForm.icuPatientStatus || ''}
                    onChange={(e) => setAddICUAdmissionForm(prev => ({ ...prev, icuPatientStatus: e.target.value }))}
                  >
                    <option value="">Select ICU patient status</option>
                    <option value="Serious">Serious</option>
                    {/* <option value="Available">Available</option> */}
                    <option value="Critical">Critical</option>
                    <option value="Stable">Stable</option>
                  </select>
                </div>
                <div>
                <Label>ICU Allocation From Date</Label>
                <Input
                  type="date"
                  value={addICUAdmissionForm.icuAllocationFromDate}
                  onChange={(e) => setAddICUAdmissionForm(prev => ({ ...prev, icuAllocationFromDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>ICU Allocation To Date</Label>
                <Input
                  type="date"
                  value={addICUAdmissionForm.icuAllocationToDate}
                  onChange={(e) => setAddICUAdmissionForm(prev => ({ ...prev, icuAllocationToDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Diagnosis</Label>
                <Textarea
                  value={addICUAdmissionForm.diagnosis}
                  onChange={(e) => setAddICUAdmissionForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Enter diagnosis"
                />
              </div>
              <div>
                <Label>Treatment Details</Label>
                <Textarea
                  value={addICUAdmissionForm.treatmentDetails}
                  onChange={(e) => setAddICUAdmissionForm(prev => ({ ...prev, treatmentDetails: e.target.value }))}
                  placeholder="Enter treatment details"
                />
              </div>
              <div>
                <Label>Patient Condition</Label>
                <Input
                  value={addICUAdmissionForm.patientCondition}
                  onChange={(e) => setAddICUAdmissionForm(prev => ({ ...prev, patientCondition: e.target.value }))}
                  placeholder="Enter patient condition"
                />
              </div>
              <div>
                <Label>On Ventilator</Label>
                <Select
                  onValueChange={(val) => {
                    console.log('On Ventilator selected:', val);
                    setAddICUAdmissionForm(prev => ({ ...prev, onVentilator: val }));
                  }}
                  value={addICUAdmissionForm.onVentilator || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="z-[99999] !pointer-events-auto" position="popper">
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ICU Admission Status</Label>
                <Select
                  onValueChange={(val) => {
                    console.log('ICU Admission Status selected:', val);
                    setAddICUAdmissionForm(prev => ({ ...prev, icuAdmissionStatus: val }));
                  }}
                  value={addICUAdmissionForm.icuAdmissionStatus || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="z-[99999] !pointer-events-auto" position="popper">
                    <SelectItem value="Occupied">Occupied</SelectItem>
                    <SelectItem value="Discharged">Discharged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 pb-4 px-6 flex-shrink-0 border-t border-gray-200">
              <Button variant="outline" onClick={() => {
                setShowAddICUAdmission(false);
                setAddICUAdmissionForm({
                  patientId: '',
                  patientType: '',
                  patientAppointmentId: '',
                  emergencyAdmissionId: '',
                  roomAdmissionId: '',
                  icuId: '',
                  icuBedId: '',
                  icuBedNo: '',
                  icuPatientStatus: '',
                  icuAllocationFromDate: '',
                  icuAllocationToDate: '',
                  diagnosis: '',
                  treatmentDetails: '',
                  patientCondition: '',
                  onVentilator: 'No',
                  icuAdmissionStatus: 'Occupied',
                  doctorId: '',
                  admittedBy: '',
                  admittedByDoctorId: '',
                });
                setAvailableAppointments([]);
                setAvailableEmergencyBedSlots([]);
                setAvailableIPDAdmissions([]);
                setPatientSearchTerm('');
                setIcuBedSearchTerm('');
                setDoctorSearchTerm('');
              }} disabled={savingICUAdmission}>
                Cancel
              </Button>
              <Button onClick={handleSaveICUAdmission} disabled={savingICUAdmission}>
                {savingICUAdmission ? 'Saving...' : 'Save ICU Admission'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Tabs defaultValue="patients" className="space-y-6">
        <TabsList>
          <TabsTrigger value="patients">ICU Patient Management</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="dashboard-tabs">
          {/* Stats Grid */}
          <div className="dashboard-stats-grid">
            <Card className="dashboard-stats-card">
              <CardContent className="dashboard-stats-card-content">
                <div className="dashboard-stats-icon-container">
                  <HeartPulse className="size-7 text-white bg-red-500 p-4 rounded-lg shadow-sm" />
                  <span className="dashboard-stats-status-label">Occupied beds</span>
                </div>
                <h3 className="dashboard-stats-number">{occupancy.occupiedBeds}/{occupancy.totalBeds}</h3>
                <p className="dashboard-stats-label">Total Patients</p>
              </CardContent>
            </Card>

            <Card className="dashboard-stats-card">
              <CardContent className="dashboard-stats-card-content">
                <div className="dashboard-stats-icon-container">
                  <Badge variant="destructive">{criticalPatientsCount}</Badge>
                  <span className="dashboard-stats-status-label">Require immediate attention</span>
                </div>
                <h3 className="dashboard-stats-number">{criticalPatientsCount}</h3>
                <p className="dashboard-stats-label">Critical Patients</p>
              </CardContent>
            </Card>

            <Card className="dashboard-stats-card">
              <CardContent className="dashboard-stats-card-content">
                <div className="dashboard-stats-icon-container">
                  <Wind className="size-7 text-white bg-blue-500 p-4 rounded-lg shadow-sm" />
                  <span className="dashboard-stats-status-label">Ventilator support</span>
                </div>
                <h3 className="dashboard-stats-number">{onVentilatorCount}</h3>
                <p className="dashboard-stats-label">On Ventilator</p>
              </CardContent>
            </Card>

            <Card className="dashboard-stats-card">
              <CardContent className="dashboard-stats-card-content">
                <div className="dashboard-stats-icon-container">
                  <span className="text-green-600 text-2xl">●</span>
                  <span className="dashboard-stats-status-label">Ready for admission</span>
                </div>
                <h3 className="dashboard-stats-number">{availableBedsCount}</h3>
                <p className="dashboard-stats-label">Available Beds</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* ICU Bed Layout */}
            <Card className="dashboard-table-card">
              <CardHeader>
                <CardTitle>ICU Bed Layout and Status</CardTitle>
              </CardHeader>
              <CardContent className="dashboard-table-card-content">
                <div className="grid grid-cols-3 gap-3">
                  {icuBeds.map((bed, index) => {
                    // Ensure we have a valid icuBedId - try to extract it if missing
                    let bedId = bed.icuBedId || (bed as any).id || null;
                    
                    // If still no ID, try to extract from raw bed data
                    if (!bedId && (bed as any)._rawBedData) {
                      const rawBed = (bed as any)._rawBedData;
                      console.log('Trying to extract ID from raw bed data:', rawBed);
                      bedId = rawBed.icuBedId || rawBed.ICUBedId || rawBed.id || rawBed.Id || rawBed.ICUBedID || null;
                    }
                    
                    // Create click handler - using async/await properly
                    const handleBedClick = async (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Set selected bed ID first
                      setSelectedICUBedId(bedId);
                      
                      if (!bedId) {
                        alert(`No ICU Bed ID found for bed ${bed.bedNumber}. Please check the API response structure.`);
                        setSelectedBedDetails(null);
                        return;
                      }
                      
                      try {
                        await loadICUBedDetails(bedId);
                      } catch (error) {
                        console.error('Error loading ICU bed details:', error);
                        alert(`Failed to load bed details: ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    };
                    
                    // Check if bed has admission details (patient exists)
                    const hasAdmission = bed.patient !== undefined && bed.patient !== null;
                    
                    // Check if ICU Patient Status is Critical
                    const isCritical = bed.icuPatientStatus === 'Critical' || 
                                      (bed.patient?.icuPatientStatus && 
                                       String(bed.patient.icuPatientStatus).toLowerCase().includes('critical')) ||
                                      (bed.patient?.severity === 'Critical');
                    
                    return (
                    <div
                      key={bed.bedNumber}
                      onClick={handleBedClick}
                      className={`p-4 border-2 rounded-lg text-center transition-all cursor-pointer ${
                        selectedICUBedId === bedId
                          ? 'border-blue-500 bg-blue-50 scale-105'
                          : isCritical
                            ? 'border-red-600 bg-red-200 hover:border-red-700 hover:bg-red-300'
                          : hasAdmission
                            ? 'border-red-300 bg-red-50 hover:border-red-400'
                          : 'border-green-300 bg-green-50 hover:border-green-400'
                      }`}
                      style={{ 
                        position: 'relative',
                        zIndex: 10,
                        pointerEvents: 'auto',
                        userSelect: 'none',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleBedClick(e as any);
                        }
                      }}
                    >
                      <p className={`mb-1 font-medium ${isCritical ? 'text-red-900' : 'text-gray-900'}`}>{bed.bedNumber}</p>
                      <div className="flex items-center justify-center gap-1">
                        <span className={`size-2 rounded-full ${
                          isCritical
                            ? 'bg-red-600'
                          : hasAdmission
                              ? 'bg-red-500'
                            : 'bg-green-500'
                        }`} />
                        <span className={`text-xs ${isCritical ? 'text-red-900 font-semibold' : 'text-gray-600'}`}>
                          {hasAdmission ? (bed as any).icuAdmissionStatus || 'Occupied' : 'Available'}
                        </span>
                      </div>
                      {isCritical && (
                        <div className="mt-1">
                          <Badge variant="destructive" className="text-xs">
                            Critical
                          </Badge>
                        </div>
                      )}
                      {bed.patient?.ventilatorSupport && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-xs">
                            <Wind className="size-3 mr-1" />
                            Ventilator
                          </Badge>
                        </div>
                      )}
                      {!bedId && (
                        <div className="mt-1">
                          <span className="text-xs text-red-500">No ID</span>
                </div>
                      )}
                  </div>
                    );
                  })}
                  </div>
                <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-green-500" />
                    <span className="text-gray-600">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-red-500" />
                    <span className="text-gray-600">Occupied</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-red-600" />
                    <span className="text-gray-600 font-semibold text-red-700">Critical</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patient Details */}
            <Card className="dashboard-table-card">
              <CardHeader>
                <CardTitle>Patient Details</CardTitle>
              </CardHeader>
              <CardContent className="dashboard-table-card-content">
                {loadingBedDetails ? (
                  <div className="text-center py-12 text-gray-500">
                    Loading bed details...
                  </div>
                ) : selectedBedDetails && !selectedPatient ? (
                  <div className="space-y-4">
                    <div className="text-center py-8 text-yellow-600">
                      <p className="mb-2">Bed details loaded but patient data not found.</p>
                      <p className="text-sm text-gray-500">Check console for details.</p>
                      <details className="mt-4 text-left">
                        <summary className="cursor-pointer text-sm text-gray-600">View raw data</summary>
                        <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                          {JSON.stringify(selectedBedDetails, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                ) : selectedPatient ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="text-gray-900 mb-1">{selectedPatient.patientName}</h3>
                        <p className="text-sm text-gray-600">{selectedPatient.age}Y / {selectedPatient.gender}</p>
                      </div>
                      <Badge variant={
                        selectedPatient.severity === 'Critical' ? 'destructive' :
                        selectedPatient.severity === 'Serious' ? 'default' : 'secondary'
                      }>
                        {selectedPatient.severity}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Patient No</p>
                        <p className="text-gray-900 font-mono text-xs">{selectedPatient.patientNo || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Age</p>
                        <p className="text-gray-900">{selectedPatient.age}Y</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Gender</p>
                        <p className="text-gray-900">{selectedPatient.gender}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Doctor Name</p>
                        <p className="text-gray-900">{selectedPatient.attendingDoctor || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">OnVentilator</p>
                        <p className="text-gray-900">{selectedPatient.ventilatorSupport ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">PatientCondition</p>
                        <p className="text-gray-900">{selectedPatient.patientCondition || 'N/A'}</p>
                    </div>
                      <div>
                        <p className="text-gray-500">ICUPatientStatus</p>
                        <p className="text-gray-900">{selectedPatient.icuPatientStatus || 'N/A'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Diagnosis</p>
                      <p className="text-gray-900">{selectedPatient.diagnosis}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">Treatment</p>
                      <p className="text-gray-900">{selectedPatient.treatment}</p>
                    </div>

                    {/* Vital Signs */}
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-gray-900 mb-3 flex items-center gap-2">
                        <Activity className="size-5 text-blue-600" />
                        Vital Signs
                      </h4>
                      {loadingVitals ? (
                        <div className="text-center py-8 text-gray-500">
                          Loading vital signs...
                        </div>
                      ) : vitalsData ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <HeartPulse className="size-4 text-red-600" />
                              <p className="text-xs text-gray-500">Heart Rate</p>
                            </div>
                            <p className="text-lg text-gray-900">
                              {vitalsData.heartRate || vitalsData.HeartRate || vitalsData.hr || vitalsData.HR || vitalsData.heart_rate || 'N/A'} bpm
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Activity className="size-4 text-blue-600" />
                              <p className="text-xs text-gray-500">Blood Pressure</p>
                            </div>
                            <p className="text-lg text-gray-900">
                              {vitalsData.bloodPressure || vitalsData.BloodPressure || vitalsData.bp || vitalsData.BP || vitalsData.blood_pressure || 'N/A'}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Thermometer className="size-4 text-orange-600" />
                              <p className="text-xs text-gray-500">Temperature</p>
                            </div>
                            <p className="text-lg text-gray-900">
                              {vitalsData.temperature || vitalsData.Temperature || vitalsData.temp || vitalsData.Temp || vitalsData.temperature_c || 'N/A'}°C
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Droplet className="size-4 text-cyan-600" />
                              <p className="text-xs text-gray-500">O₂ Saturation</p>
                            </div>
                            <p className="text-lg text-gray-900">
                              {vitalsData.oxygenSaturation || vitalsData.OxygenSaturation || vitalsData.spo2 || vitalsData.SpO2 || vitalsData.o2Sat || vitalsData.oxygen_saturation || 'N/A'}%
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                            <div className="flex items-center gap-2 mb-1">
                              <Wind className="size-4 text-teal-600" />
                              <p className="text-xs text-gray-500">Respiratory Rate</p>
                            </div>
                            <p className="text-lg text-gray-900">
                              {vitalsData.respiratoryRate || vitalsData.RespiratoryRate || vitalsData.rr || vitalsData.RR || vitalsData.respiratory_rate || 'N/A'} /min
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No vital signs data available
                        </div>
                      )}
                    </div>

                    
                    {/*<div className="flex gap-2">
                      <Button variant="outline" className="flex-1">Update Vitals</Button>
                      <Button variant="outline" className="flex-1">View History</Button>
                    </div> */}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Select a bed to view patient details
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All ICU Patients List */}
          <Card className="dashboard-table-card">
            <CardHeader>
              <CardTitle>All ICU Patients</CardTitle>
            </CardHeader>
            <CardContent className="dashboard-table-card-content">
              {loading ? (
                <div className="dashboard-table-empty-cell">Loading ICU patients...</div>
              ) : (
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr className="dashboard-table-header-row">
                      <th className="dashboard-table-header-cell">Bed</th>
                      <th className="dashboard-table-header-cell">Patient</th>
                      <th className="dashboard-table-header-cell">Condition</th>
                      <th className="dashboard-table-header-cell">Doctor</th>
                      <th className="dashboard-table-header-cell">Ventilator</th>
                      <th className="dashboard-table-header-cell">Patient Type</th>
                      <th className="dashboard-table-header-cell">ICU Patient Status</th>
                      <th className="dashboard-table-header-cell">ICU Admission Status</th>
                      <th className="dashboard-table-header-cell">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                      {patients.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="dashboard-table-empty-cell">
                            No ICU patients found
                          </td>
                        </tr>
                      ) : (
                        patients.map((patient) => (
                      <tr key={patient.id} className="dashboard-table-body-row">
                        <td className="dashboard-table-body-cell">
                          <Badge>{patient.bedNumber}</Badge>
                        </td>
                        <td className="dashboard-table-body-cell">
                          <p className="dashboard-table-body-cell-primary">{patient.patientName}</p>
                          <p className="dashboard-table-body-cell-secondary text-xs">{patient.age}Y / {patient.gender}</p>
                        </td>
                        <td className="dashboard-table-body-cell dashboard-table-body-cell-secondary">{patient.condition}</td>
                        <td className="dashboard-table-body-cell dashboard-table-body-cell-secondary">{patient.attendingDoctor}</td>
                        <td className="dashboard-table-body-cell">
                          {patient.ventilatorSupport ? (
                            <Badge variant="secondary">
                              <Wind className="size-3 mr-1" />
                              Yes
                            </Badge>
                          ) : (
                            <span className="text-gray-500">No</span>
                          )}
                        </td>
                        <td className="dashboard-table-body-cell">
                          <Badge variant="outline">
                            {patient.patientType || 'N/A'}
                          </Badge>
                        </td>
                        <td className="dashboard-table-body-cell">
                          <Badge variant={
                            patient.icuPatientStatus === 'Critical' ? 'destructive' :
                            patient.icuPatientStatus === 'Serious' ? 'default' :
                            patient.icuPatientStatus === 'Stable' ? 'secondary' : 'outline'
                          }>
                            {patient.icuPatientStatus || 'N/A'}
                          </Badge>
                        </td>
                        <td className="dashboard-table-body-cell">
                          <Badge variant={
                            patient.icuAdmissionStatus === 'Occupied' ? 'default' :
                            patient.icuAdmissionStatus === 'Discharged' ? 'secondary' : 'outline'
                          }>
                            {patient.icuAdmissionStatus || 'N/A'}
                          </Badge>
                        </td>
                        <td className="dashboard-table-body-cell">
                          <Button
                            variant="outline"
                            size="sm"
                            className="dashboard-manage-button"
                            onClick={() => {
                              // Navigate to Manage ICU Case page with patient ICU admission ID (UUID)
                              // Prefer patientICUAdmissionId if available, otherwise use id
                              const patientICUAdmissionId = patient.patientICUAdmissionId || patient.id;
                              
                              if (patientICUAdmissionId) {
                                // Navigate using React Router
                                navigate(`/manage-icu-case?patientICUAdmissionId=${String(patientICUAdmissionId)}`);
                              } else {
                                console.error('Patient ICU Admission ID not found for navigation');
                                console.error('Available patient fields:', Object.keys(patient));
                                alert('Patient ICU Admission ID not found. Cannot navigate to Manage ICU Case.');
                              }
                            }}
                          >
                            Manage ICU Case
                          </Button>
                        </td>
                      </tr>
                        ))
                      )}
                  </tbody>
                </table>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
}
