import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { FileText, FlaskConical, Stethoscope, Heart, ArrowLeft, Plus, Search, Eye, Edit, Settings, Sliders } from 'lucide-react';
import { CustomResizableDialog, CustomResizableDialogHeader, CustomResizableDialogTitle, CustomResizableDialogClose } from './CustomResizableDialog';
import { admissionsApi } from '../api/admissions';
import { Admission, PatientLabTest, PatientDoctorVisit, PatientNurseVisit } from '../api/admissions';
import { labTestsApi } from '../api/labTests';
import { LabTest } from '../types';
import { apiRequest } from '../api/base';
import { doctorsApi } from '../api/doctors';
import { Doctor } from '../types';
import { staffApi } from '../api/staff';
import { PatientAdmitVisitVitals } from '../api/admissions';
import { convertToIST, formatDateIST, getTodayIST, formatDateTimeIST } from '../utils/timeUtils';
import { uploadFiles as uploadFilesUtil } from '../utils/fileUpload';
import { getCurrentIST } from '../config/timezone';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import '../styles/dashboard.css';

export function ManageIPDAdmission() {
  // Helper function to format raw date string to dd-mm-yyyy format (no timezone conversion, date-only)
  const formatRawDate = (date: string | undefined | null): string => {
    if (!date || date === 'N/A') return 'N/A';
    
    try {
      const dateStr = String(date);
      
      // If it's already in DD-MM-YYYY format, return as-is
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        return dateStr;
      }
      // If it's YYYY-MM-DD format, convert to DD-MM-YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
      }
      // If it has time component, extract just the date part
      if (dateStr.includes(' ')) {
        const datePart = dateStr.split(' ')[0];
        // If date part is YYYY-MM-DD, convert to DD-MM-YYYY
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          const [year, month, day] = datePart.split('-');
          return `${day}-${month}-${year}`;
        }
        // If date part is DD-MM-YYYY, return as-is
        if (/^\d{2}-\d{2}-\d{4}$/.test(datePart)) {
          return datePart;
        }
      }
      // If it has T separator (ISO format), extract date part
      if (dateStr.includes('T')) {
        const datePart = dateStr.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          const [year, month, day] = datePart.split('-');
          return `${day}-${month}-${year}`;
        }
      }
      // Fallback: return as-is
      return dateStr;
    } catch {
      return date || 'N/A';
    }
  };

  // Helper function to format raw datetime string to dd-mm-yyyy, hh:mm AM/PM format (no timezone conversion)
  const formatRawDateTime = (dateTime: string | undefined | null): string => {
    if (!dateTime || dateTime === 'N/A') return 'N/A';
    
    try {
      const dateStr = String(dateTime);
      
      // If it's "YYYY-MM-DD HH:mm:ss" format (space-separated, may include microseconds)
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateStr)) {
        const [datePart, timePart] = dateStr.split(' ');
        const [year, month, day] = datePart.split('-');
        // Strip microseconds if present (e.g., "22:04:07.811211" -> "22:04:07")
        const timeOnly = timePart.split('.')[0];
        const [hours24, minutes] = timeOnly.split(':');
        const hours = parseInt(hours24, 10);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${day}-${month}-${year}, ${String(displayHour).padStart(2, '0')}:${minutes} ${period}`;
      }
      // If it's "YYYY-MM-DDTHH:mm:ss" or "YYYY-MM-DDTHH:mm" format (ISO)
      else if (dateStr.includes('T')) {
        const [datePart, timePart] = dateStr.split('T');
        const [year, month, day] = datePart.split('-');
        const timeOnly = timePart.split('.')[0].split('+')[0].split('Z')[0];
        const [hours24, minutes] = timeOnly.split(':');
        const hours = parseInt(hours24, 10);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${day}-${month}-${year}, ${String(displayHour).padStart(2, '0')}:${minutes} ${period}`;
      }
      // If it's "DD-MM-YYYY HH:mm" format
      else if (/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}/.test(dateStr)) {
        const [datePart, timePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('-');
        const [hours24, minutes] = timePart.split(':');
        const hours = parseInt(hours24, 10);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${day}-${month}-${year}, ${String(displayHour).padStart(2, '0')}:${minutes} ${period}`;
      }
      // If it's date-only format, use formatRawDate
      else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || /^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        return formatRawDate(dateStr);
      }
      // Fallback: return as-is
      return dateStr;
    } catch {
      return dateTime || 'N/A';
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

  // Helper function to format datetime to dd-mm-yyyy, hh:mm AM/PM format in IST
  const formatDateTimeForInputWithAMPM = (dateTime: string | Date | undefined): string => {
    if (!dateTime) return '';
    try {
      // Use convertToIST to properly convert to IST
      const istDate = convertToIST(dateTime);

      // Get date components in IST
      const day = String(istDate.getUTCDate()).padStart(2, '0');
      const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
      const year = String(istDate.getUTCFullYear());
      const hours24 = istDate.getUTCHours();
      const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');

      // Convert to 12-hour format with AM/PM
      const period = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;

      return `${day}-${month}-${year}, ${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
    } catch {
      return '';
    }
  };

  // Helper function to parse datetime from dd-mm-yyyy, hh:mm format (assumed to be in IST)
  const parseDateTimeFromInput = (inputStr: string): string => {
    if (!inputStr) return '';
    try {
      // Match dd-mm-yyyy, hh:mm format (24-hour) or dd-mm-yyyy, hh:mm AM/PM format
      const match24 = inputStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4}),\s*(\d{1,2}):(\d{2})$/);
      const match12 = inputStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4}),\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      
      let day: number, month: number, year: number, hours: number, minutes: number;
      
      if (match12) {
        // 12-hour format with AM/PM
        day = parseInt(match12[1], 10);
        month = parseInt(match12[2], 10);
        year = parseInt(match12[3], 10);
        let hours12 = parseInt(match12[4], 10);
        minutes = parseInt(match12[5], 10);
        const period = match12[6].toUpperCase();
        
        // Convert to 24-hour format
        if (period === 'AM') {
          hours = hours12 === 12 ? 0 : hours12;
        } else { // PM
          hours = hours12 === 12 ? 12 : hours12 + 12;
        }
      } else if (match24) {
        // 24-hour format
        day = parseInt(match24[1], 10);
        month = parseInt(match24[2], 10);
        year = parseInt(match24[3], 10);
        hours = parseInt(match24[4], 10);
        minutes = parseInt(match24[5], 10);
      } else {
        return '';
      }
      
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
  const [editingVisitVitalsId, setEditingVisitVitalsId] = useState<string | number | null>(null);

  // Add IPD Lab Test Dialog State
  const [isAddIPDLabTestDialogOpen, setIsAddIPDLabTestDialogOpen] = useState(false);
  const [isViewIPDLabTestDialogOpen, setIsViewIPDLabTestDialogOpen] = useState(false);
  const [isEditIPDLabTestDialogOpen, setIsEditIPDLabTestDialogOpen] = useState(false);
  const [isCustomizeIPDLabTestDialogOpen, setIsCustomizeIPDLabTestDialogOpen] = useState(false);
  const [viewingLabTest, setViewingLabTest] = useState<PatientLabTest | null>(null);
  const [editingLabTestId, setEditingLabTestId] = useState<string | number | null>(null);
  const [customizingLabTest, setCustomizingLabTest] = useState<PatientLabTest | null>(null);
  const [customizingLabTestId, setCustomizingLabTestId] = useState<string | number | null>(null);
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
  // File upload state for ReportsUrl (similar to OT Documents)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [editUploadedDocumentUrls, setEditUploadedDocumentUrls] = useState<string[]>([]);
  // Customize dialog form data
  const [customizeLabTestFormData, setCustomizeLabTestFormData] = useState({
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
  const [customizeLabTestSearchTerm, setCustomizeLabTestSearchTerm] = useState('');
  const [showCustomizeLabTestList, setShowCustomizeLabTestList] = useState(false);
  const [customizeDoctorSearchTerm, setCustomizeDoctorSearchTerm] = useState('');
  const [showCustomizeDoctorList, setShowCustomizeDoctorList] = useState(false);
  const [customizeSelectedFiles, setCustomizeSelectedFiles] = useState<File[]>([]);
  const [customizeUploadedDocumentUrls, setCustomizeUploadedDocumentUrls] = useState<string[]>([]);
  const [customizeLabTestSubmitting, setCustomizeLabTestSubmitting] = useState(false);
  const [customizeLabTestSubmitError, setCustomizeLabTestSubmitError] = useState<string | null>(null);

  // Manage Doctor Visit Dialog State
  const [isCustomizeDoctorVisitDialogOpen, setIsCustomizeDoctorVisitDialogOpen] = useState(false);
  const [customizingDoctorVisit, setCustomizingDoctorVisit] = useState<PatientDoctorVisit | null>(null);
  const [isCustomizeVisitVitalsDialogOpen, setIsCustomizeVisitVitalsDialogOpen] = useState(false);
  const [customizingVisitVitals, setCustomizingVisitVitals] = useState<PatientAdmitVisitVitals | null>(null);
  const [customizingVisitVitalsId, setCustomizingVisitVitalsId] = useState<string | number | null>(null);
  const [customizeVisitVitalsFormData, setCustomizeVisitVitalsFormData] = useState({
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
  const [customizeVisitVitalsNurseSearchTerm, setCustomizeVisitVitalsNurseSearchTerm] = useState('');
  const [showCustomizeVisitVitalsNurseList, setShowCustomizeVisitVitalsNurseList] = useState(false);
  const [customizeVisitVitalsRecordedDateTime, setCustomizeVisitVitalsRecordedDateTime] = useState<Date | null>(null);
  const [customizeVisitVitalsCreatedAt, setCustomizeVisitVitalsCreatedAt] = useState<Date | null>(null);
  const [customizeDoctorVisitFormData, setCustomizeDoctorVisitFormData] = useState({
    patientId: '',
    doctorId: '',
    doctorVisitedDateTime: '',
    visitsRemarks: '',
    patientCondition: '',
    status: 'Active',
    visitCreatedAt: ''
  });
  const [customizeDoctorVisitDoctorSearchTerm, setCustomizeDoctorVisitDoctorSearchTerm] = useState('');
  const [showCustomizeDoctorVisitDoctorList, setShowCustomizeDoctorVisitDoctorList] = useState(false);
  const [customizeDoctorVisitDateTime, setCustomizeDoctorVisitDateTime] = useState<Date | null>(null);
  const [customizeDoctorVisitCreatedAt, setCustomizeDoctorVisitCreatedAt] = useState<Date | null>(null);
  const [addDoctorVisitDateTime, setAddDoctorVisitDateTime] = useState<Date | null>(null);
  const [customizeOrderedDate, setCustomizeOrderedDate] = useState<Date | null>(null);
  const [customizeTestDoneDateTime, setCustomizeTestDoneDateTime] = useState<Date | null>(null);
  const [addVisitVitalsRecordedDateTime, setAddVisitVitalsRecordedDateTime] = useState<Date | null>(null);

  // Doctor Visit Dialog State
  const [isAddDoctorVisitDialogOpen, setIsAddDoctorVisitDialogOpen] = useState(false);
  const [isEditDoctorVisitDialogOpen, setIsEditDoctorVisitDialogOpen] = useState(false);
  const [isViewDoctorVisitDialogOpen, setIsViewDoctorVisitDialogOpen] = useState(false);
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

      // Fetch basic admission data
      const admissionData = await admissionsApi.getById(roomAdmissionId);
      
      console.log('Fetched basic admission data:', {
        age: admissionData.age,
        gender: admissionData.gender,
        admittedBy: admissionData.admittedBy,
        diagnosis: admissionData.diagnosis,
        patientName: admissionData.patientName,
        bedNumber: admissionData.bedNumber,
        roomType: admissionData.roomType,
        full: admissionData
      });

      // Fetch additional admission details from /room-admissions/data/id endpoint
      let additionalData = {};
      try {
        const additionalEndpoint = `/api/room-admissions/data/${roomAdmissionId}`;
        console.log('Fetching additional admission data from:', additionalEndpoint);
        const additionalResponse = await apiRequest<any>(`/room-admissions/data/${roomAdmissionId}`);
        console.log('Fetched additional admission data (RAW):', {
          endpoint: additionalEndpoint,
          response: additionalResponse
        });

        // Handle different response structures
        let additionalDataObj: any = null;

        if (additionalResponse && typeof additionalResponse === 'object' && !Array.isArray(additionalResponse)) {
          // Check if data is wrapped in a data property
          if (additionalResponse.data) {
            additionalDataObj = additionalResponse.data;
          } else {
            // Direct object
            additionalDataObj = additionalResponse;
          }
        }

        console.log('Processed additional data object:', additionalDataObj);

        // Enhanced helper function to extract field with multiple variations (including nested objects)
        const extractField = (data: any, fieldVariations: string[], defaultValue: any = undefined) => {
          for (const field of fieldVariations) {
            // Check direct field
            let value = data?.[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }

            // Check nested paths (e.g., Room.RoomVacantDate)
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

            // Check nested objects (Room, Admission, etc.)
            if (data?.Room?.[field]) {
              value = data.Room[field];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
            }
            if (data?.Admission?.[field]) {
              value = data.Admission[field];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
            }
            if (data?.room?.[field]) {
              value = data.room[field];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
            }
            if (data?.admission?.[field]) {
              value = data.admission[field];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
            }
          }
          return defaultValue;
        };

        // Extract the additional fields with multiple name variations
        if (additionalDataObj) {
          // Extract AllocatedAt and use it as createdAt
          const allocatedAt = extractField(additionalDataObj, [
            'AllocatedAt', 'allocatedAt', 'allocated_at', 'Allocated_At'
          ]);
          
          additionalData = {
            shiftToAnotherRoom: extractField(additionalDataObj, [
              'shiftToAnotherRoom', 'ShiftToAnotherRoom', 'shift_to_another_room', 'Shift_To_Another_Room',
              'shiftToAnotherRoom', 'shiftedToAnotherRoom', 'ShiftedToAnotherRoom'
            ]),
            shifted: extractField(additionalDataObj, [
              'shifted', 'Shifted', 'shifted', 'Shifted'
            ]),
            shiftedToDetails: extractField(additionalDataObj, [
              'shiftedToDetails', 'ShiftedToDetails', 'shifted_to_details', 'Shifted_To_Details',
              'shiftDetails', 'ShiftDetails', 'shift_details', 'Shift_Details',
              'shiftedToRoomDetails', 'ShiftedToRoomDetails'
            ]),
            roomVacantDate: extractField(additionalDataObj, [
              'roomVacantDate', 'RoomVacantDate', 'room_vacant_date', 'Room_Vacant_Date',
              'vacantDate', 'VacantDate', 'vacant_date', 'Vacant_Date',
              'roomVacantDateTime', 'RoomVacantDateTime'
            ]),
            // Use AllocatedAt as createdAt if available
            ...(allocatedAt && { createdAt: allocatedAt })
          };
        }

        console.log('Extracted additional data:', additionalData);
      
      } catch (additionalErr) {
        console.warn('Error fetching additional admission data:', additionalErr);
        // Continue with basic data if additional data fetch fails
      }

      // Merge the data
      const mergedAdmissionData = {
        ...admissionData,
        ...additionalData
      };

      console.log('Merged admission data:', mergedAdmissionData);
      setAdmission(mergedAdmissionData);

      // Fetch patient lab tests, doctor visits, nurse visits, and visit vitals after admission is loaded
      fetchPatientLabTests(roomAdmissionId);
      fetchPatientDoctorVisits(roomAdmissionId);
      //fetchPatientNurseVisits(roomAdmissionId);
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
      const endpoint = `/api/patient-lab-tests/with-details/room-admission/${roomAdmissionId}`;
      console.log('Fetching patient lab tests for roomAdmissionId:', roomAdmissionId);
      console.log('Endpoint:', endpoint);
      const labTests = await admissionsApi.getPatientLabTests(roomAdmissionId);
      
      // Dump raw date data for debugging
      console.log('=== RAW LAB TEST DATE DATA ===');
      console.log('Endpoint:', endpoint);
      labTests.forEach((labTest, index) => {
        console.log(`Lab Test ${index + 1}:`, {
          endpoint: endpoint,
          testName: labTest.testName || labTest.labTestName,
          testDoneDateTime: labTest.testDoneDateTime || (labTest as any).TestDoneDateTime || (labTest as any).test_done_date_time,
          testDoneDateTimeType: typeof (labTest.testDoneDateTime || (labTest as any).TestDoneDateTime),
          createdDate: labTest.createdDate || (labTest as any).CreatedDate || (labTest as any).created_date,
          createdDateType: typeof (labTest.createdDate || (labTest as any).CreatedDate),
          fullLabTest: labTest
        });
      });
      console.log('=== END RAW DATE DATA ===');
      
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
      const doctorVisits = await admissionsApi.getPatientDoctorVisits(roomAdmissionId);
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

 
  // Fetch Patient Admit Visit Vitals
  const fetchPatientAdmitVisitVitals = async (roomAdmissionId: number) => {
    try {
      setVisitVitalsLoading(true);
      setVisitVitalsError(null);
      const endpoint = `/api/patient-admit-visit-vitals/room-admission/${roomAdmissionId}`;
      console.log('Fetching patient admit visit vitals for roomAdmissionId:', roomAdmissionId);
      console.log('Endpoint:', endpoint);
      const response = await apiRequest<any>(`/patient-admit-visit-vitals/room-admission/${roomAdmissionId}`);
      console.log('Patient admit visit vitals API response (RAW):', {
        endpoint: endpoint,
        response: JSON.stringify(response, null, 2)
      });
      
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
      const mappedVitals: PatientAdmitVisitVitals[] = vitalsData.map((vital: any, index: number) => {
        // Log the first vital to see the structure
        if (index === 0) {
          console.log('=== RAW VITAL OBJECT FROM API ===');
          console.log('All keys:', Object.keys(vital));
          console.log('Full object:', JSON.stringify(vital, null, 2));
        }
        
        // Try to extract ID with more field name variations (including UUID strings)
        let patientAdmitVisitVitalsId: string | number | null = extractField(vital, [
          'PatientAdmitVisitVitalsId', 'patientAdmitVisitVitalsId', 
          'Patient_Admit_Visit_Vitals_Id', 'patient_admit_visit_vitals_id',
          'PatientAdmitVisitVitalsID', 'PATIENT_ADMIT_VISIT_VITALS_ID',
          'id', 'Id', 'ID', '_id', 'Id_', 'ID_',
          'uuid', 'UUID', 'Uuid', 'patientAdmitVisitVitalsUuid', 'PatientAdmitVisitVitalsUuid'
        ], null);
        
        // If still null, try direct access to common field names
        if (!patientAdmitVisitVitalsId || patientAdmitVisitVitalsId === null || patientAdmitVisitVitalsId === undefined) {
          patientAdmitVisitVitalsId = vital?.PatientAdmitVisitVitalsId || 
                                      vital?.patientAdmitVisitVitalsId ||
                                      vital?.id ||
                                      vital?.Id ||
                                      vital?.ID ||
                                      vital?.uuid ||
                                      vital?.UUID ||
                                      null;
        }
        
        // Keep as string if it's a UUID, otherwise convert to number
        if (patientAdmitVisitVitalsId !== null && patientAdmitVisitVitalsId !== undefined && patientAdmitVisitVitalsId !== '') {
          // Check if it's a UUID string (contains hyphens)
          if (typeof patientAdmitVisitVitalsId === 'string' && patientAdmitVisitVitalsId.includes('-')) {
            // Keep as string (UUID)
            console.log('Found UUID ID:', patientAdmitVisitVitalsId);
          } else {
            // Try to convert to number
            const numId = Number(patientAdmitVisitVitalsId);
            patientAdmitVisitVitalsId = isNaN(numId) ? patientAdmitVisitVitalsId : numId;
          }
        } else {
          patientAdmitVisitVitalsId = null;
        }
        
        // Log if ID is still null for debugging
        if (!patientAdmitVisitVitalsId) {
          console.warn(`Visit Vitals ID not found for vital ${index}. Available fields:`, Object.keys(vital));
          console.warn('Raw vital object:', JSON.stringify(vital, null, 2));
        } else {
          console.log(`Visit Vitals ID found for vital ${index}:`, patientAdmitVisitVitalsId, 'Type:', typeof patientAdmitVisitVitalsId);
        }
        
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
          id: patientAdmitVisitVitalsId !== null ? (typeof patientAdmitVisitVitalsId === 'string' ? patientAdmitVisitVitalsId : patientAdmitVisitVitalsId) : undefined,
          patientAdmitVisitVitalsId: patientAdmitVisitVitalsId !== null ? (typeof patientAdmitVisitVitalsId === 'number' ? patientAdmitVisitVitalsId : undefined) : undefined,
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
      orderedDate: labTest.orderedDate || getTodayIST(),
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

    // Parse existing documents from reportsUrl field
    let existingDocUrls: string[] = [];
    if (labTest.reportsUrl) {
      try {
        // Try parsing as JSON array first
        const parsed = JSON.parse(labTest.reportsUrl);
        if (Array.isArray(parsed)) {
          existingDocUrls = parsed;
        } else if (typeof parsed === 'string') {
          existingDocUrls = [parsed];
        }
      } catch {
        // If not JSON, treat as comma-separated string or single URL
        if (labTest.reportsUrl.includes(',')) {
          existingDocUrls = labTest.reportsUrl.split(',').map((url: string) => url.trim()).filter((url: string) => url);
        } else {
          existingDocUrls = [labTest.reportsUrl];
        }
      }
    }
    setEditUploadedDocumentUrls(existingDocUrls);
    setSelectedFiles([]);

    setLabTestSearchTerm(selectedLabTest ? `${selectedLabTest.testName || 'Unknown'} (${selectedLabTest.testCategory || 'N/A'})` : '');
    setShowLabTestList(false);
    setIpdLabTestDoctorSearchTerm(selectedDoctor ? (selectedDoctor.name || selectedDoctor.doctorName || '') : '');
    setShowIpdLabTestDoctorList(false);
    setIpdLabTestSubmitError(null);
    setIsEditIPDLabTestDialogOpen(true);
  };

  // Handle opening Manage IPD Lab Test dialog
  const handleOpenCustomizeIPDLabTestDialog = async (labTest: PatientLabTest) => {
    console.log('Opening Manage IPD Lab Test dialog for:', labTest);
    
    // First, explicitly close all other dialogs to prevent conflicts
    setIsAddDoctorVisitDialogOpen(false);
    setIsAddIPDLabTestDialogOpen(false);
    setIsEditIPDLabTestDialogOpen(false);
    setIsViewIPDLabTestDialogOpen(false);
    
    // Fetch available lab tests
    let labTestsList: LabTest[] = [];
    try {
      labTestsList = await labTestsApi.getAll();
      setAvailableLabTests(labTestsList);
    } catch (err) {
      console.error('Error fetching lab tests:', err);
    }

    // Fetch available doctors
    let doctorsList: Doctor[] = [];
    try {
      doctorsList = await doctorsApi.getAll();
      setAvailableDoctors(doctorsList);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }

    setCustomizingLabTest(labTest);

    // Find the selected lab test to populate the search term (use labTestsList from the fetch, not availableLabTests state)
    const selectedLabTest = labTestsList.find((lt: LabTest) => {
      const lid = (lt as any).labTestId || (lt as any).id || '';
      return String(lid) === String(labTest.labTestId);
    });

    // Extract orderedByDoctorId with various field name variations
    let orderedByDoctorId = (labTest as any).orderedByDoctorId || 
                            (labTest as any).OrderedByDoctorId || 
                            (labTest as any).ordered_by_doctor_id ||
                            (labTest as any).Ordered_By_Doctor_Id ||
                            '';

    // If no doctor ID from lab test, fetch latest data from GET /api/patient-lab-tests/:id
    const patientLabTestsId = labTest.patientLabTestsId || labTest.patientLabTestId || labTest.id;
    if (!orderedByDoctorId && patientLabTestsId) {
      try {
        const getEndpoint = `/api/patient-lab-tests/${patientLabTestsId}`;
        console.log('Fetching latest lab test data from:', getEndpoint);
        const getResponse = await apiRequest<any>(`/patient-lab-tests/${patientLabTestsId}`);
        console.log('Fetched latest lab test (RAW):', {
          endpoint: getEndpoint,
          response: getResponse
        });
        
        // Handle different response structures
        const labTestData = getResponse?.data || getResponse;
        if (labTestData) {
          // Extract orderedByDoctorId from the GET response with all variations
          const fetchedDoctorId = labTestData.OrderedByDoctorId || 
                                  labTestData.orderedByDoctorId || 
                                  labTestData.Ordered_By_Doctor_Id ||
                                  labTestData.ordered_by_doctor_id ||
                                  (labTestData.OrderedByDoctor?.DoctorId || labTestData.OrderedByDoctor?.doctorId || 
                                   labTestData.orderedByDoctor?.DoctorId || labTestData.orderedByDoctor?.doctorId ||
                                   labTestData.OrderedByDoctor?.Id || labTestData.OrderedByDoctor?.id) ||
                                  '';
          if (fetchedDoctorId) {
            orderedByDoctorId = String(fetchedDoctorId);
          }
        }
      } catch (fetchErr) {
        console.error('Error fetching latest lab test, continuing with provided data:', fetchErr);
      }
    }

    // If still no doctor ID, try to get from admission
    if (!orderedByDoctorId && admission) {
      // Try to get doctor ID from admission
      orderedByDoctorId = (admission as any).admittingDoctorId || 
                          (admission as any).AdmittingDoctorId || 
                          (admission as any).admittedByDoctorId || 
                          (admission as any).AdmittedByDoctorId ||
                          (admission as any).doctorId || 
                          (admission as any).DoctorId ||
                          '';
      
      // If still no doctor ID, try to find by doctor name from admission
      if (!orderedByDoctorId) {
        const admissionDoctorName = admission.admittingDoctorName || admission.admittedBy || '';
        if (admissionDoctorName) {
          const doctorByName = doctorsList.find((doc: Doctor) => {
            const docName = doc.name || doc.doctorName || '';
            return docName.toLowerCase().includes(admissionDoctorName.toLowerCase()) || 
                   admissionDoctorName.toLowerCase().includes(docName.toLowerCase());
          });
          if (doctorByName) {
            orderedByDoctorId = String(doctorByName.id || (doctorByName as any).Id || '');
          }
        }
      }
    }

    // Find the selected doctor to populate the search term (use doctorsList from the fetch, not availableDoctors state)
    const selectedDoctor = doctorsList.find((doc: Doctor) => {
      const docId = doc.id || (doc as any).Id || '';
      return String(docId) === String(orderedByDoctorId);
    });

    // Set Ordered Date for DatePicker
    let orderedDateValue: Date | null = null;
    if (labTest.orderedDate) {
      try {
        // orderedDate is in YYYY-MM-DD format, convert to Date object
        const dateObj = new Date(labTest.orderedDate + 'T00:00:00');
        if (!isNaN(dateObj.getTime())) {
          orderedDateValue = dateObj;
        }
      } catch {
        orderedDateValue = null;
      }
    }
    if (!orderedDateValue) {
      // Use today's date in IST
      orderedDateValue = convertToIST(new Date());
      // Set to midnight for date-only picker
      orderedDateValue.setUTCHours(0, 0, 0, 0);
    }
    setCustomizeOrderedDate(orderedDateValue);

    setCustomizeLabTestFormData({
      roomAdmissionId: String(labTest.roomAdmissionId || admission?.roomAdmissionId || admission?.admissionId || ''),
      patientId: String(labTest.patientId || admission?.patientId || ''),
      labTestId: String(labTest.labTestId || ''),
      priority: labTest.priority || 'Normal',
      orderedDate: labTest.orderedDate || getTodayIST(),
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
      testDoneDateTime: (() => {
        // Parse testDoneDateTime the same way the dashboard table does
        // Use the raw value from backend without timezone conversion
        const rawTestDoneDateTime = labTest.testDoneDateTime || (labTest as any).TestDoneDateTime || (labTest as any).test_done_date_time;
        if (!rawTestDoneDateTime) return '';
        
        if (typeof rawTestDoneDateTime === 'string') {
          // If it's in DD-MM-YYYY HH:mm format (e.g., "11-01-2026 00:00")
          if (/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}/.test(rawTestDoneDateTime)) {
            const [datePart, timePart] = rawTestDoneDateTime.split(' ');
            const [day, month, year] = datePart.split('-');
            const [hours, minutes] = timePart.split(':');
            // Convert to YYYY-MM-DDTHH:mm format for datetime-local input
            return `${year}-${month}-${day}T${hours}:${minutes}`;
          }
          // If it's ISO format (e.g., "2026-01-11T00:00:00" or "2026-01-11T00:00:00Z")
          if (rawTestDoneDateTime.includes('T')) {
            const [datePart, timePart] = rawTestDoneDateTime.split('T');
            const timeOnly = timePart.split('.')[0].split('+')[0].split('Z')[0];
            // Extract just HH:mm from HH:mm:ss
            const [hours, minutes] = timeOnly.split(':');
            return `${datePart}T${hours}:${minutes}`;
          }
        }
        // Fallback: try to parse as Date (but this should be avoided if possible)
        try {
          const dateObj = new Date(rawTestDoneDateTime);
          if (!isNaN(dateObj.getTime())) {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
          }
        } catch {
          return '';
        }
        return '';
      })()
    });

    // Set Test Done Date & Time for DatePicker
    // Parse the same way as the form data to ensure consistency
    let testDoneDateTimeValue: Date | null = null;
    const rawTestDoneDateTime = labTest.testDoneDateTime || (labTest as any).TestDoneDateTime || (labTest as any).test_done_date_time;
    if (rawTestDoneDateTime) {
      try {
        if (typeof rawTestDoneDateTime === 'string') {
          // If it's in DD-MM-YYYY HH:mm format (e.g., "11-01-2026 00:00")
          if (/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}/.test(rawTestDoneDateTime)) {
            const [datePart, timePart] = rawTestDoneDateTime.split(' ');
            const [day, month, year] = datePart.split('-');
            const [hours, minutes] = timePart.split(':');
            // Create Date object using local time (no timezone conversion)
            testDoneDateTimeValue = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
          }
          // If it's ISO format, parse it carefully
          else if (rawTestDoneDateTime.includes('T')) {
            const [datePart, timePart] = rawTestDoneDateTime.split('T');
            const [year, month, day] = datePart.split('-');
            const timeOnly = timePart.split('.')[0].split('+')[0].split('Z')[0];
            const [hours, minutes] = timeOnly.split(':');
            // Create Date object using local time (no timezone conversion)
            testDoneDateTimeValue = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
          }
          // Fallback: try standard Date parsing
          else {
            const dateObj = new Date(rawTestDoneDateTime);
            if (!isNaN(dateObj.getTime())) {
              // Use local components to avoid timezone shift
              testDoneDateTimeValue = new Date(
                dateObj.getFullYear(),
                dateObj.getMonth(),
                dateObj.getDate(),
                dateObj.getHours(),
                dateObj.getMinutes()
              );
            }
          }
        }
      } catch {
        testDoneDateTimeValue = null;
      }
    }
    setCustomizeTestDoneDateTime(testDoneDateTimeValue);

    // Parse existing documents from reportsUrl field
    let existingDocUrls: string[] = [];
    if (labTest.reportsUrl) {
      try {
        // Try parsing as JSON array first
        const parsed = JSON.parse(labTest.reportsUrl);
        if (Array.isArray(parsed)) {
          existingDocUrls = parsed;
        } else if (typeof parsed === 'string') {
          existingDocUrls = [parsed];
        }
      } catch {
        // If not JSON, treat as comma-separated string or single URL
        if (labTest.reportsUrl.includes(',')) {
          existingDocUrls = labTest.reportsUrl.split(',').map((url: string) => url.trim()).filter((url: string) => url);
        } else {
          existingDocUrls = [labTest.reportsUrl];
        }
      }
    }
    setCustomizeUploadedDocumentUrls(existingDocUrls);
    setCustomizeSelectedFiles([]);

    setCustomizeLabTestSearchTerm(selectedLabTest ? `${selectedLabTest.testName || 'Unknown'} (${selectedLabTest.testCategory || 'N/A'})` : '');
    setShowCustomizeLabTestList(false);
    setCustomizeDoctorSearchTerm(selectedDoctor ? (selectedDoctor.name || selectedDoctor.doctorName || '') : '');
    setShowCustomizeDoctorList(false);
    
    // Open the Manage IPD Lab Test dialog
    setIsCustomizeIPDLabTestDialogOpen(true);
    console.log('Set isCustomizeIPDLabTestDialogOpen to true');
    
    // Double-check other dialogs are closed (defensive)
    setTimeout(() => {
      setIsAddDoctorVisitDialogOpen(false);
      setIsEditDoctorVisitDialogOpen(false);
      setIsAddIPDLabTestDialogOpen(false);
      setIsEditIPDLabTestDialogOpen(false);
      setIsViewIPDLabTestDialogOpen(false);
      console.log('Ensured all other dialogs are closed');
    }, 0);
  };

  // Handle opening Manage Doctor Visit dialog
  const handleOpenCustomizeDoctorVisitDialog = async (visit: PatientDoctorVisit) => {
    
    // First, explicitly close all other dialogs to prevent conflicts
    setIsAddDoctorVisitDialogOpen(false);
    setIsAddIPDLabTestDialogOpen(false);
    setIsEditIPDLabTestDialogOpen(false);
    setIsViewIPDLabTestDialogOpen(false);
    setIsCustomizeIPDLabTestDialogOpen(false);
    
    // Fetch available doctors
    let doctorsList: Doctor[] = [];
    try {
      doctorsList = await doctorsApi.getAll();
      setAvailableDoctors(doctorsList);
    } catch (err) {
      console.error('Error fetching doctors:', err);
    }

    setCustomizingDoctorVisit(visit);

    // Find the selected doctor to populate the search term (use doctorsList from the fetch, not availableDoctors state)
    const selectedDoctor = doctorsList.find((doc: Doctor) => {
      const did = doc.id || 0;
      return String(did) === String(visit.doctorId);
    });

    // Get the raw value from backend - use as-is without IST conversion
    const rawDoctorVisitedDateTime = visit.doctorVisitedDateTime || (visit as any).DoctorVisitedDateTime || (visit as any).doctor_visited_date_time;
    
    // Parse raw backend value directly - no IST conversion
    // Backend sends "2026-01-11 23:50:00" format
    let dateTimeFormValue = '';
    let dateTimeValue: Date | null = null;
    
    if (rawDoctorVisitedDateTime) {
      try {
        const dateStr = String(rawDoctorVisitedDateTime);
        
        // If it's "YYYY-MM-DD HH:mm:ss" format, convert to "YYYY-MM-DDTHH:mm" for datetime-local input
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateStr)) {
          const [datePart, timePart] = dateStr.split(' ');
          const [hours, minutes] = timePart.split(':');
          // Format as YYYY-MM-DDTHH:mm for datetime-local input (no seconds, no timezone)
          dateTimeFormValue = `${datePart}T${hours}:${minutes}`;
          
          // Create Date object from raw components (no timezone conversion)
          const [year, month, day] = datePart.split('-').map(Number);
          dateTimeValue = new Date(year, month - 1, day, parseInt(hours, 10), parseInt(minutes, 10));
        } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateStr)) {
          // If it's already in ISO format, use as-is
          const timeOnly = dateStr.split('T')[1].split(':');
          dateTimeFormValue = `${dateStr.split('T')[0]}T${timeOnly[0]}:${timeOnly[1]}`;
          
          // Parse ISO format
          const [datePart, timePart] = dateStr.split('T');
          const [year, month, day] = datePart.split('-').map(Number);
          const [hours, minutes] = timePart.split(':').map(Number);
          dateTimeValue = new Date(year, month - 1, day, hours, minutes);
        } else {
          // Fallback: try to parse as Date
          const dateObj = new Date(dateStr);
          if (!isNaN(dateObj.getTime())) {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            dateTimeFormValue = `${year}-${month}-${day}T${hours}:${minutes}`;
            dateTimeValue = dateObj;
          }
        }
      } catch (error) {
        console.error('Error parsing doctorVisitedDateTime:', error, rawDoctorVisitedDateTime);
        dateTimeValue = getCurrentIST();
        const year = dateTimeValue.getFullYear();
        const month = String(dateTimeValue.getMonth() + 1).padStart(2, '0');
        const day = String(dateTimeValue.getDate()).padStart(2, '0');
        const hours = String(dateTimeValue.getHours()).padStart(2, '0');
        const minutes = String(dateTimeValue.getMinutes()).padStart(2, '0');
        dateTimeFormValue = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    } else {
      dateTimeValue = getCurrentIST();
      const year = dateTimeValue.getFullYear();
      const month = String(dateTimeValue.getMonth() + 1).padStart(2, '0');
      const day = String(dateTimeValue.getDate()).padStart(2, '0');
      const hours = String(dateTimeValue.getHours()).padStart(2, '0');
      const minutes = String(dateTimeValue.getMinutes()).padStart(2, '0');
      dateTimeFormValue = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    setCustomizeDoctorVisitFormData({
      patientId: String(visit.patientId || admission?.patientId || ''),
      doctorId: String(visit.doctorId || ''),
      doctorVisitedDateTime: dateTimeFormValue,
      visitsRemarks: visit.visitsRemarks || '',
      patientCondition: visit.patientCondition || '',
      status: visit.status || 'Active',
      visitCreatedAt: visit.visitCreatedAt || ''
    });

    // Set DatePicker value - use the raw date/time components directly (no IST conversion)
    setCustomizeDoctorVisitDateTime(dateTimeValue);

    // Set Visit Created At DatePicker value - use raw values without timezone conversion
    let createdAtValue: Date | null = null;
    if (visit.visitCreatedAt) {
      try {
        const dateStr = String(visit.visitCreatedAt);
        // If it's "YYYY-MM-DD HH:mm:ss" format, parse directly
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateStr)) {
          const [datePart, timePart] = dateStr.split(' ');
          const [year, month, day] = datePart.split('-').map(Number);
          const [hours, minutes] = timePart.split(':').map(Number);
          createdAtValue = new Date(year, month - 1, day, hours, minutes);
        } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateStr)) {
          // If it's ISO format, parse directly
          const [datePart, timePart] = dateStr.split('T');
          const [year, month, day] = datePart.split('-').map(Number);
          const timeOnly = timePart.split('.')[0].split('+')[0].split('Z')[0];
          const [hours, minutes] = timeOnly.split(':').map(Number);
          createdAtValue = new Date(year, month - 1, day, hours, minutes);
        } else {
          // Fallback: try standard parsing
          const dateObj = new Date(dateStr);
          if (!isNaN(dateObj.getTime())) {
            createdAtValue = dateObj;
          }
        }
      } catch {
        createdAtValue = null;
      }
    }
    setCustomizeDoctorVisitCreatedAt(createdAtValue);

    setCustomizeDoctorVisitDoctorSearchTerm(selectedDoctor ? `${selectedDoctor.name || 'Unknown'} (${selectedDoctor.specialty || 'N/A'})` : String(visit.doctorId || ''));
    setShowCustomizeDoctorVisitDoctorList(false);
    
    // Open the Manage Doctor Visit dialog
    setIsCustomizeDoctorVisitDialogOpen(true);
    
    // Double-check other dialogs are closed (defensive)
    setTimeout(() => {
      setIsAddDoctorVisitDialogOpen(false);
      setIsEditDoctorVisitDialogOpen(false);
      setIsAddIPDLabTestDialogOpen(false);
      setIsEditIPDLabTestDialogOpen(false);
      setIsViewIPDLabTestDialogOpen(false);
      setIsViewDoctorVisitDialogOpen(false);
      setIsCustomizeIPDLabTestDialogOpen(false);
      console.log('Ensured all other dialogs are closed');
    }, 0);
  };

  // Update documents when editing lab test dialog opens or when form data changes
  useEffect(() => {
    if (isEditIPDLabTestDialogOpen && editingLabTestId && ipdLabTestFormData.reportsUrl) {
      // Parse existing documents from reportsUrl field
      let existingDocUrls: string[] = [];
      if (ipdLabTestFormData.reportsUrl) {
        try {
          // Try parsing as JSON array first
          const parsed = JSON.parse(ipdLabTestFormData.reportsUrl);
          if (Array.isArray(parsed)) {
            existingDocUrls = parsed;
          } else if (typeof parsed === 'string') {
            existingDocUrls = [parsed];
          }
        } catch {
          // If not JSON, treat as comma-separated string or single URL
          if (ipdLabTestFormData.reportsUrl.includes(',')) {
            existingDocUrls = ipdLabTestFormData.reportsUrl.split(',').map((url: string) => url.trim()).filter((url: string) => url);
          } else {
            existingDocUrls = [ipdLabTestFormData.reportsUrl];
          }
        }
      }
      setEditUploadedDocumentUrls(existingDocUrls);
    }
  }, [isEditIPDLabTestDialogOpen, editingLabTestId, ipdLabTestFormData.reportsUrl]);

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
        orderedDate: getTodayIST(), // Today's date in IST
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
      setSelectedFiles([]);
      setIsAddIPDLabTestDialogOpen(true);
    } else {
      setIpdLabTestSubmitError('Admission data is not loaded. Please wait and try again.');
    }
  };

  // Function to upload files (using shared utility)
  const uploadFiles = async (files: File[], patientId: string): Promise<string[]> => {
    return uploadFilesUtil(files, patientId, 'lab-reports');
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
      // Upload files first if any are selected (now that we have patientId)
      // Start with existing uploaded documents (for edit mode)
      let documentUrls: string[] = editingLabTestId ? [...editUploadedDocumentUrls] : [];
      
      // If not in edit mode, parse existing reportsUrl if it's a JSON array
      if (!editingLabTestId && ipdLabTestFormData.reportsUrl && ipdLabTestFormData.reportsUrl.trim() !== '') {
        try {
          const parsed = JSON.parse(ipdLabTestFormData.reportsUrl);
          if (Array.isArray(parsed)) {
            documentUrls = parsed;
          } else if (typeof parsed === 'string') {
            documentUrls = [parsed];
          }
        } catch {
          // If not JSON, treat as single URL string
          documentUrls = [ipdLabTestFormData.reportsUrl.trim()];
        }
      }

      if (selectedFiles.length > 0) {
        try {
          const newUrls = await uploadFiles(selectedFiles, String(patientIdValue).trim());
          documentUrls = [...documentUrls, ...newUrls];
        } catch (error) {
          alert(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      }
      
      // Combine all document URLs (JSON array)
      const combinedReportsUrl = documentUrls.length > 0 ? JSON.stringify(documentUrls) : null;
      
      if (combinedReportsUrl) {
        payload.ReportsUrl = combinedReportsUrl;
      }
      if (ipdLabTestFormData.testDoneDateTime && ipdLabTestFormData.testDoneDateTime.trim() !== '') {
        // Send as non-timezone format (YYYY-MM-DDTHH:mm:ss)
        let testDoneDateTime = ipdLabTestFormData.testDoneDateTime.trim();
        // If it's in YYYY-MM-DDTHH:mm format, append :00 for seconds
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(testDoneDateTime)) {
          payload.TestDoneDateTime = testDoneDateTime + ':00';
        } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(testDoneDateTime)) {
          // Already has seconds, use as-is
          payload.TestDoneDateTime = testDoneDateTime;
        } else {
          // Try to parse and format without timezone
          try {
            const date = new Date(testDoneDateTime);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              const seconds = String(date.getSeconds()).padStart(2, '0');
              payload.TestDoneDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
            } else {
              payload.TestDoneDateTime = testDoneDateTime;
            }
          } catch {
            payload.TestDoneDateTime = testDoneDateTime;
          }
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
      setSelectedFiles([]);
      setEditUploadedDocumentUrls([]);
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
      
      // Get current date/time without timezone conversion
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const doctorVisitedDateTimeStr = `${year}-${month}-${day}T${hours}:${minutes}`;
      const doctorVisitedDateTimeDate = new Date(year, now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
      
      setDoctorVisitFormData({
        patientId: String(patientIdValue),
        doctorId: '',
        doctorVisitedDateTime: doctorVisitedDateTimeStr,
        visitsRemarks: '',
        patientCondition: '',
        status: 'Active',
        visitCreatedAt: getCurrentIST().toISOString()
      });
      setAddDoctorVisitDateTime(doctorVisitedDateTimeDate);
      setDoctorSearchTerm('');
      setShowDoctorList(false);
      setDoctorVisitSubmitError(null);
      setIsAddDoctorVisitDialogOpen(true);
    } else {
      setDoctorVisitSubmitError('Admission data is not loaded. Please wait and try again.');
    }
  };


  // Handle saving Doctor Visit
  const handleSaveDoctorVisit = async () => {
    try {
      setDoctorVisitSubmitting(true);
      setDoctorVisitSubmitError(null);

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
        DoctorVisitedDateTime: (() => {
          // Send as non-timezone format (YYYY-MM-DDTHH:mm:ss)
          if (!doctorVisitFormData.doctorVisitedDateTime || doctorVisitFormData.doctorVisitedDateTime.trim() === '') {
            return '';
          }
          let dateTime = doctorVisitFormData.doctorVisitedDateTime.trim();
          // If it's in YYYY-MM-DDTHH:mm format, append :00 for seconds
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateTime)) {
            return dateTime + ':00';
          } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateTime)) {
            // Already has seconds, use as-is
            return dateTime;
          } else {
            // Try to parse and format without timezone
            try {
              const date = new Date(dateTime);
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
              }
            } catch {
              return dateTime;
            }
            return dateTime;
          }
        })(),
        VisitsRemarks: doctorVisitFormData.visitsRemarks || '',
        PatientCondition: doctorVisitFormData.patientCondition || '',
        Status: doctorVisitFormData.status || 'Active',
      };

      // Add optional fields
      if (doctorVisitFormData.visitCreatedAt && doctorVisitFormData.visitCreatedAt.trim() !== '') {
        // Send as non-timezone format (YYYY-MM-DDTHH:mm:ss)
        let visitCreatedAt = doctorVisitFormData.visitCreatedAt.trim();
        try {
          const date = new Date(visitCreatedAt);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            payload.VisitCreatedAt = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
          } else {
            payload.VisitCreatedAt = visitCreatedAt;
          }
        } catch {
          payload.VisitCreatedAt = visitCreatedAt;
        }
      }

      // Call the API to create the doctor visit
      const response = await apiRequest<any>('/patient-admit-doctor-visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      // The response should contain the generated ID (UUID string)
      // POST response has "PatientAdmitDoctorVisitsId" - this ID will be used when updating the visit later
      const createdVisitId = response?.data?.PatientAdmitDoctorVisitsId ||
                            response?.data?.patientAdmitDoctorVisitsId ||
                            response?.PatientAdmitDoctorVisitsId ||
                            response?.patientAdmitDoctorVisitsId ||
                            response?.data?.patientDoctorVisitId || 
                            response?.data?.PatientDoctorVisitId ||
                            response?.data?.id ||
                            response?.data?.Id ||
                            response?.patientDoctorVisitId ||
                            response?.PatientDoctorVisitId ||
                            response?.id ||
                            response?.Id ||
                            '';

      // Close dialog
      setIsAddDoctorVisitDialogOpen(false);
      
      // Refresh the doctor visits list (this will fetch the visit with its ID)
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
      setAddDoctorVisitDateTime(null);
      setDoctorSearchTerm('');
      setShowDoctorList(false);
    } catch (err) {
      console.error('Error saving doctor visit:', err);
      setDoctorVisitSubmitError(err instanceof Error ? err.message : 'Failed to save doctor visit');
    } finally {
      setDoctorVisitSubmitting(false);
    }
  };

  // Handle saving Manage Doctor Visit (PUT request)
  const handleSaveCustomizeDoctorVisit = async () => {
    try {
      setCustomizeLabTestSubmitting(true); // Reuse this state for now, or create a new one
      setCustomizeLabTestSubmitError(null);

      // Validate required fields
      if (!admission?.roomAdmissionId) {
        throw new Error('Room Admission ID is required');
      }

      if (!customizingDoctorVisit) {
        throw new Error('Doctor Visit data is required');
      }

      // Get the visit ID (UUID string) - check all possible field variations
      // The ID from POST response is "PatientAdmitDoctorVisitsId" (UUID string)
      const visitId = (customizingDoctorVisit as any).PatientAdmitDoctorVisitsId ||
                      (customizingDoctorVisit as any).patientAdmitDoctorVisitsId ||
                      (customizingDoctorVisit as any).PatientAdmitDoctorVisitId ||
                      (customizingDoctorVisit as any).patientAdmitDoctorVisitId ||
                      (customizingDoctorVisit as any).patient_admit_doctor_visits_id ||
                      (customizingDoctorVisit as any).Patient_Admit_Doctor_Visits_Id ||
                      customizingDoctorVisit.patientDoctorVisitId || 
                      customizingDoctorVisit.id || 
                      (customizingDoctorVisit as any).PatientDoctorVisitId ||
                      (customizingDoctorVisit as any).Id ||
                      (customizingDoctorVisit as any).ID ||
                      (customizingDoctorVisit as any).patient_doctor_visit_id ||
                      (customizingDoctorVisit as any).Patient_Doctor_Visit_Id ||
                      (customizingDoctorVisit as any).patientDoctorVisitID ||
                      (customizingDoctorVisit as any).PatientDoctorVisitID ||
                      '';
      
      // Convert to string if it's a number (UUID should be string, but handle both)
      const visitIdString = visitId ? String(visitId) : '';
      
      if (!visitIdString || visitIdString === '0' || visitIdString === '' || visitIdString === 'undefined' || visitIdString === 'null') {
        throw new Error('Doctor Visit ID is required for updating. The visit ID was not found in the visit data. Please refresh the page and try again.');
      }

      let patientIdValue = customizeDoctorVisitFormData.patientId;
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

      if (!customizeDoctorVisitFormData.doctorId || customizeDoctorVisitFormData.doctorId === '') {
        throw new Error('Doctor is required. Please select a doctor.');
      }

      if (!customizeDoctorVisitFormData.doctorVisitedDateTime || customizeDoctorVisitFormData.doctorVisitedDateTime.trim() === '') {
        throw new Error('Doctor Visited Date & Time is required');
      }

      // Prepare the request payload
      // Ensure DoctorId is a number (integer), not a UUID string
      let doctorIdNumber: number | null = null;
      if (customizeDoctorVisitFormData.doctorId) {
        const doctorIdStr = String(customizeDoctorVisitFormData.doctorId).trim();
        // Check if it's a valid number (not a UUID)
        if (/^\d+$/.test(doctorIdStr)) {
          doctorIdNumber = Number(doctorIdStr);
        } else {
          // If it's not a number, try to find the doctor by ID and get the numeric ID
          const selectedDoctor = availableDoctors.find((doc: Doctor) => {
            const docId = String(doc.id || '');
            return docId === doctorIdStr;
          });
          if (selectedDoctor && selectedDoctor.id) {
            doctorIdNumber = Number(selectedDoctor.id);
          } else {
            throw new Error('Invalid Doctor ID. Please select a valid doctor.');
          }
        }
      }
      
      if (!doctorIdNumber || isNaN(doctorIdNumber)) {
        throw new Error('Doctor ID must be a valid number. Please select a doctor.');
      }

      const payload: any = {
        RoomAdmissionId: admission.roomAdmissionId ? Number(admission.roomAdmissionId) : null,
        PatientId: String(patientIdValue).trim(),
        DoctorId: doctorIdNumber, // Ensure it's a number (integer)
        VisitsRemarks: customizeDoctorVisitFormData.visitsRemarks || null,
        PatientCondition: customizeDoctorVisitFormData.patientCondition || null,
        Status: customizeDoctorVisitFormData.status || 'Active',
      };

      // Handle DoctorVisitedDateTime - send as-is without timezone conversion
      if (customizeDoctorVisitFormData.doctorVisitedDateTime && customizeDoctorVisitFormData.doctorVisitedDateTime.trim() !== '') {
        let doctorVisitedDateTime = customizeDoctorVisitFormData.doctorVisitedDateTime.trim();
        // If it's in YYYY-MM-DDTHH:mm format, append :00 for seconds
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(doctorVisitedDateTime)) {
          payload.DoctorVisitedDateTime = doctorVisitedDateTime + ':00';
        } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(doctorVisitedDateTime)) {
          // Already has seconds, use as-is
          payload.DoctorVisitedDateTime = doctorVisitedDateTime;
        } else {
          // Use as-is if format is different
          payload.DoctorVisitedDateTime = doctorVisitedDateTime;
        }
      }

      // Add optional VisitCreatedBy if available
      if (customizeDoctorVisitFormData.visitCreatedAt && customizeDoctorVisitFormData.visitCreatedAt.trim() !== '') {
        // VisitCreatedBy can be extracted from visit if available
        const visitCreatedBy = customizingDoctorVisit.visitCreatedBy || (customizingDoctorVisit as any).VisitCreatedBy || null;
        if (visitCreatedBy) {
          payload.VisitCreatedBy = Number(visitCreatedBy);
        }
      }

      console.log('API Payload:', JSON.stringify(payload, null, 2));
      console.log('DoctorVisitedDateTime being sent:', payload.DoctorVisitedDateTime);

      // Call the API to update the doctor visit
      console.log('API Endpoint: PUT /patient-admit-doctor-visits/' + visitIdString);
      const response = await apiRequest<any>(`/patient-admit-doctor-visits/${visitIdString}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      console.log('Doctor visit updated successfully:', response);

      // Close dialog
      setIsCustomizeDoctorVisitDialogOpen(false);
      setCustomizingDoctorVisit(null);
      setCustomizeDoctorVisitDateTime(null);
      setCustomizeDoctorVisitCreatedAt(null);

      // Refresh the doctor visits list
      if (admission?.roomAdmissionId) {
        await fetchPatientDoctorVisits(admission.roomAdmissionId);
      }

      // Reset form
      setCustomizeDoctorVisitFormData({
        patientId: '',
        doctorId: '',
        doctorVisitedDateTime: '',
        visitsRemarks: '',
        patientCondition: '',
        status: 'Active',
        visitCreatedAt: ''
      });
      setCustomizeDoctorVisitDoctorSearchTerm('');
      setShowCustomizeDoctorVisitDoctorList(false);
    } catch (err) {
      console.error('Error saving doctor visit:', err);
      setCustomizeLabTestSubmitError(err instanceof Error ? err.message : 'Failed to save doctor visit');
    } finally {
      setCustomizeLabTestSubmitting(false);
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
      
      // Get current date/time without timezone conversion
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const recordedDateTimeStr = `${year}-${month}-${day}T${hours}:${minutes}`;
      const recordedDateTimeDate = new Date(year, now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
      
      setVisitVitalsFormData({
        patientId: String(patientIdValue),
        nurseId: '',
        patientStatus: 'Stable',
        recordedDateTime: recordedDateTimeStr,
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
      // Set DatePicker to current local time (no timezone conversion)
      setAddVisitVitalsRecordedDateTime(recordedDateTimeDate);
      setNurseSearchTerm('');
      setShowNurseList(false);
      setVisitVitalsSubmitError(null);
      setIsAddVisitVitalsDialogOpen(true);
    } else {
      setVisitVitalsSubmitError('Admission data is not loaded. Please wait and try again.');
    }
  };


  // Handle opening Manage Visit Vitals dialog
  const handleOpenCustomizeVisitVitalsDialog = async (vitals: PatientAdmitVisitVitals) => {
    console.log('Opening Manage Visit Vitals dialog for:', vitals);
    
    // First, explicitly close all other dialogs to prevent conflicts
    setIsAddDoctorVisitDialogOpen(false);
    setIsAddIPDLabTestDialogOpen(false);
    setIsEditIPDLabTestDialogOpen(false);
    setIsViewIPDLabTestDialogOpen(false);
    setIsCustomizeIPDLabTestDialogOpen(false);
    setIsAddVisitVitalsDialogOpen(false);
    
    // Fetch available nurses
    let nursesList: any[] = [];
    try {
      const staff = await staffApi.getAll();
      nursesList = staff.filter((member: any) => {
        const roleName = member.RoleName || member.roleName || '';
        return roleName.toLowerCase().includes('nurse');
      });
      setAvailableNurses(nursesList);
    } catch (err) {
      console.error('Error fetching nurses:', err);
    }

    setCustomizingVisitVitals(vitals);
    
    // Extract and store the vitals ID explicitly as a backup
    const vitalsId = (vitals as any)?.PatientAdmitVisitVitalsId || 
                     (vitals as any)?.patientAdmitVisitVitalsId ||
                     (vitals as any)?.Patient_Admit_Visit_Vitals_Id ||
                     (vitals as any)?.patient_admit_visit_vitals_id ||
                     vitals?.id ||
                     (vitals as any)?.Id ||
                     (vitals as any)?.ID ||
                     (vitals as any)?.vitalsId ||
                     (vitals as any)?.VitalsId;
    setCustomizingVisitVitalsId(vitalsId || null);
    console.log('Stored vitals ID when opening dialog:', vitalsId, 'from vitals object:', vitals);

    // Find the selected nurse to populate the search term
    const selectedNurse = nursesList.find((nurse: any) => {
      const nid = nurse.UserId || nurse.id || 0;
      return String(nid) === String(vitals.nurseId);
    });

    // Parse vitalsCreatedAt and use it for recordedDateTime
    // Use raw values without timezone conversion
    let recordedDateTimeFormValue = '';
    let recordedDateTimeValue: Date | null = null;
    
    // Get vitalsCreatedAt value (try multiple field name variations)
    const vitalsCreatedAtValue = vitals.vitalsCreatedAt || (vitals as any).VitalsCreatedAt || (vitals as any).vitals_created_at || (vitals as any).Vitals_Created_At;
    
    if (vitalsCreatedAtValue) {
      try {
        const dateStr = String(vitalsCreatedAtValue).trim();
        console.log('Parsing vitalsCreatedAt for recordedDateTime:', dateStr, 'Type:', typeof vitalsCreatedAtValue);
        
        let year: number, month: number, day: number, hours: number, minutes: number;
        
        // If it's "YYYY-MM-DD HH:mm:ss" format (space-separated), parse directly
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateStr)) {
          const [datePart, timePart] = dateStr.split(' ');
          [year, month, day] = datePart.split('-').map(Number);
          // Strip seconds if present
          const timeOnly = timePart.split('.')[0];
          [hours, minutes] = timeOnly.split(':').map(Number);
        } 
        // If it's "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss" format (ISO), parse directly
        else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateStr)) {
          const [datePart, timePart] = dateStr.split('T');
          [year, month, day] = datePart.split('-').map(Number);
          // Strip timezone, milliseconds, and seconds if present
          const timeOnly = timePart.split('.')[0].split('+')[0].split('Z')[0];
          [hours, minutes] = timeOnly.split(':').map(Number);
        }
        // If it's "DD-MM-YYYY HH:mm" format
        else if (/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}/.test(dateStr)) {
          const [datePart, timePart] = dateStr.split(' ');
          [day, month, year] = datePart.split('-').map(Number);
          [hours, minutes] = timePart.split(':').map(Number);
        }
        // Try to extract components from any date string using regex patterns
        else {
          // Try to match YYYY-MM-DD or DD-MM-YYYY pattern
          const dateMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/) || dateStr.match(/(\d{2})-(\d{2})-(\d{4})/);
          const timeMatch = dateStr.match(/(\d{1,2}):(\d{2})/);
          
          if (dateMatch && timeMatch) {
            // Check if it's YYYY-MM-DD or DD-MM-YYYY format
            if (dateMatch[1].length === 4) {
              // YYYY-MM-DD format
              year = parseInt(dateMatch[1], 10);
              month = parseInt(dateMatch[2], 10);
              day = parseInt(dateMatch[3], 10);
            } else {
              // DD-MM-YYYY format
              day = parseInt(dateMatch[1], 10);
              month = parseInt(dateMatch[2], 10);
              year = parseInt(dateMatch[3], 10);
            }
            hours = parseInt(timeMatch[1], 10);
            minutes = parseInt(timeMatch[2], 10);
          } else {
            // Last resort: try to parse as Date and extract UTC components to avoid timezone shift
            // This is only used if all pattern matching fails
            const dateObj = new Date(dateStr);
            if (!isNaN(dateObj.getTime())) {
              // Use UTC methods to get the raw components without timezone conversion
              year = dateObj.getUTCFullYear();
              month = dateObj.getUTCMonth() + 1;
              day = dateObj.getUTCDate();
              hours = dateObj.getUTCHours();
              minutes = dateObj.getUTCMinutes();
              console.log('Used UTC parsing fallback for vitalsCreatedAt:', { year, month, day, hours, minutes });
            } else {
              throw new Error(`Invalid date format: ${dateStr}`);
            }
          }
        }
        
        // Validate extracted values
        if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
          throw new Error(`Invalid date components: year=${year}, month=${month}, day=${day}, hours=${hours}, minutes=${minutes}`);
        }
        
        // Format as YYYY-MM-DDTHH:mm for form data (no timezone conversion)
        recordedDateTimeFormValue = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        // Create Date object for DatePicker using local components (no timezone conversion)
        recordedDateTimeValue = new Date(year, month - 1, day, hours, minutes);
        console.log('Successfully parsed vitalsCreatedAt for recordedDateTime:', { original: dateStr, formatted: recordedDateTimeFormValue, dateValue: recordedDateTimeValue });
      } catch (error) {
        console.error('Error parsing vitalsCreatedAt:', error, 'Raw value:', vitalsCreatedAtValue, 'Type:', typeof vitalsCreatedAtValue);
        // Fallback to current time if parsing fails
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        recordedDateTimeFormValue = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        recordedDateTimeValue = new Date(year, month - 1, day, hours, minutes);
        console.log('Using fallback current time for recordedDateTime:', recordedDateTimeFormValue);
      }
    } else {
      // No vitalsCreatedAt, use current time
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      recordedDateTimeFormValue = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      recordedDateTimeValue = new Date(year, month - 1, day, hours, minutes);
    }

    setCustomizeVisitVitalsFormData({
      patientId: String(vitals.patientId || admission?.patientId || ''),
      nurseId: String(vitals.nurseId || ''),
      patientStatus: vitals.patientStatus || 'Stable',
      recordedDateTime: recordedDateTimeFormValue,
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
      status: (vitals.status === 'Active' || vitals.status === 'Inactive') ? vitals.status : 'Active'
    });

    // Set DatePicker value
    setCustomizeVisitVitalsRecordedDateTime(recordedDateTimeValue);

    // Set Vitals Created At DatePicker value - use raw values without timezone conversion
    let createdAtValue: Date | null = null;
    if (vitals.vitalsCreatedAt) {
      try {
        const dateStr = String(vitals.vitalsCreatedAt);
        // If it's "YYYY-MM-DD HH:mm:ss" format, parse directly
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateStr)) {
          const [datePart, timePart] = dateStr.split(' ');
          const [year, month, day] = datePart.split('-').map(Number);
          const [hours, minutes] = timePart.split(':').map(Number);
          createdAtValue = new Date(year, month - 1, day, hours, minutes);
        } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateStr)) {
          // If it's ISO format, parse directly
          const [datePart, timePart] = dateStr.split('T');
          const [year, month, day] = datePart.split('-').map(Number);
          const timeOnly = timePart.split('.')[0].split('+')[0].split('Z')[0];
          const [hours, minutes] = timeOnly.split(':').map(Number);
          createdAtValue = new Date(year, month - 1, day, hours, minutes);
        } else {
          // Fallback: try standard parsing
          const dateObj = new Date(dateStr);
          if (!isNaN(dateObj.getTime())) {
            createdAtValue = dateObj;
          }
        }
      } catch {
        createdAtValue = null;
      }
    }
    setCustomizeVisitVitalsCreatedAt(createdAtValue);

    setCustomizeVisitVitalsNurseSearchTerm(selectedNurse ? (selectedNurse.UserName || selectedNurse.name || 'Unknown') : '');
    setShowCustomizeVisitVitalsNurseList(false);
    
    // Open the Manage Visit Vitals dialog
    setIsCustomizeVisitVitalsDialogOpen(true);
    console.log('Set isCustomizeVisitVitalsDialogOpen to true');
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
      recordedDateTime: (() => {
        // Parse raw backend value without timezone conversion
        if (!vitals.recordedDateTime) return '';
        const dateStr = String(vitals.recordedDateTime);
        // If it's "YYYY-MM-DD HH:mm:ss" format, convert to "YYYY-MM-DDTHH:mm"
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateStr)) {
          const [datePart, timePart] = dateStr.split(' ');
          const [hours, minutes] = timePart.split(':');
          return `${datePart}T${hours}:${minutes}`;
        } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateStr)) {
          // If it's ISO format, extract just date and time (no seconds)
          const [datePart, timePart] = dateStr.split('T');
          const [hours, minutes] = timePart.split(':');
          return `${datePart}T${hours}:${minutes}`;
        }
        return dateStr;
      })(),
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

  // Handle saving Customize IPD Lab Test
  const handleSaveCustomizeIPDLabTest = async () => {
    try {
      setCustomizeLabTestSubmitting(true);
      setCustomizeLabTestSubmitError(null);

      console.log('Saving Customize IPD Lab Test with data:', customizeLabTestFormData);

      // Validate required fields
      if (!customizeLabTestFormData.roomAdmissionId || customizeLabTestFormData.roomAdmissionId === 'undefined' || customizeLabTestFormData.roomAdmissionId === '') {
        throw new Error('Room Admission ID is required');
      }

      // Extract PatientId with fallbacks for different field name variations
      let patientIdValue = customizeLabTestFormData.patientId;
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

      if (!customizeLabTestFormData.labTestId || customizeLabTestFormData.labTestId === '') {
        throw new Error('Lab Test is required. Please select a lab test.');
      }

      if (!customizeLabTestFormData.orderedDate) {
        throw new Error('Ordered Date is required');
      }

      if (!customizeLabTestFormData.orderedByDoctorId) {
        throw new Error('Ordered By Doctor is required');
      }

      if (!customizeLabTestFormData.patientType || customizeLabTestFormData.patientType === '') {
        throw new Error('Patient Type is required.');
      }

      // Get selected lab test details
      const selectedLabTest = availableLabTests.find((lt: LabTest) => {
        const lid = (lt as any).labTestId || (lt as any).id || '';
        return String(lid) === customizeLabTestFormData.labTestId;
      });
      if (!selectedLabTest) {
        throw new Error('Selected lab test details not found.');
      }

      // Prepare the request payload
      const payload: any = {
        RoomAdmissionId: Number(customizeLabTestFormData.roomAdmissionId),
        PatientId: String(patientIdValue).trim(),
        LabTestId: Number(customizeLabTestFormData.labTestId),
        Priority: customizeLabTestFormData.priority || 'Normal',
        OrderedDate: customizeLabTestFormData.orderedDate,
        PatientType: customizeLabTestFormData.patientType,
        LabTestDone: customizeLabTestFormData.labTestDone || 'No',
        TestStatus: customizeLabTestFormData.testStatus || 'Pending',
      };

      // Add conditional fields based on PatientType (only if they have values)
      if (customizeLabTestFormData.patientType === 'OPD') {
        if (customizeLabTestFormData.appointmentId && customizeLabTestFormData.appointmentId.trim() !== '') {
          payload.AppointmentId = String(customizeLabTestFormData.appointmentId).trim();
        }
      }
      if (customizeLabTestFormData.patientType === 'IPD') {
        if (customizeLabTestFormData.roomAdmissionId && customizeLabTestFormData.roomAdmissionId.trim() !== '') {
          payload.RoomAdmissionId = Number(customizeLabTestFormData.roomAdmissionId);
        }
      }
      if (customizeLabTestFormData.patientType === 'Emergency') {
        if (customizeLabTestFormData.emergencyBedSlotId && customizeLabTestFormData.emergencyBedSlotId.trim() !== '') {
          payload.EmergencyBedSlotId = String(customizeLabTestFormData.emergencyBedSlotId).trim();
        }
      }

      // Add OrderedByDoctorId (required)
      if (customizeLabTestFormData.orderedByDoctorId && customizeLabTestFormData.orderedByDoctorId.trim() !== '') {
        payload.OrderedByDoctorId = Number(customizeLabTestFormData.orderedByDoctorId);
      }

      // Add optional fields
      if (customizeLabTestFormData.orderedBy && customizeLabTestFormData.orderedBy.trim() !== '') {
        payload.OrderedBy = customizeLabTestFormData.orderedBy.trim();
      }
      if (customizeLabTestFormData.description && customizeLabTestFormData.description.trim() !== '') {
        payload.Description = customizeLabTestFormData.description.trim();
      }
      if (customizeLabTestFormData.charges && customizeLabTestFormData.charges.trim() !== '') {
        payload.Charges = Number(customizeLabTestFormData.charges);
      } else if (selectedLabTest.charges) {
        payload.Charges = selectedLabTest.charges;
      }

      // Upload files first if any are selected (now that we have patientId)
      // Start with existing uploaded documents (for customize mode)
      let documentUrls: string[] = [...customizeUploadedDocumentUrls];

      if (customizeSelectedFiles.length > 0) {
        try {
          const newUrls = await uploadFiles(customizeSelectedFiles, String(patientIdValue).trim());
          documentUrls = [...documentUrls, ...newUrls];
        } catch (error) {
          alert(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      }

      // Combine all document URLs (JSON array)
      const combinedReportsUrl = documentUrls.length > 0 ? JSON.stringify(documentUrls) : null;

      if (combinedReportsUrl) {
        payload.ReportsUrl = combinedReportsUrl;
      }
      if (customizeLabTestFormData.testDoneDateTime && customizeLabTestFormData.testDoneDateTime.trim() !== '') {
        // Send datetime as-is without any conversion (datetime-local format is YYYY-MM-DDTHH:mm)
        // Just append :00 for seconds if not present
        let testDoneDateTime = customizeLabTestFormData.testDoneDateTime.trim();
        // If it's in YYYY-MM-DDTHH:mm format, append :00 for seconds
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(testDoneDateTime)) {
          payload.TestDoneDateTime = testDoneDateTime + ':00';
        } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(testDoneDateTime)) {
          // Already has seconds, use as-is
          payload.TestDoneDateTime = testDoneDateTime;
        } else {
          // Use as-is if format is different
          payload.TestDoneDateTime = testDoneDateTime;
        }
      }

      console.log('API Payload:', JSON.stringify(payload, null, 2));

      // Call the API to update the patient lab test
      const patientLabTestsId = customizingLabTest?.patientLabTestsId || customizingLabTest?.patientLabTestId || customizingLabTest?.id;
      if (!patientLabTestsId) {
        throw new Error('Patient Lab Test ID is required for updating');
      }

      console.log('API Endpoint: PUT /patient-lab-tests/' + patientLabTestsId);
      const response = await apiRequest<any>(`/patient-lab-tests/${patientLabTestsId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      console.log('Customize IPD Lab test updated successfully:', response);

      // Close dialog
      setIsCustomizeIPDLabTestDialogOpen(false);
      setCustomizingLabTest(null);
      setCustomizeSelectedFiles([]);
      setCustomizeUploadedDocumentUrls([]);
      setCustomizeOrderedDate(null);
      setCustomizeTestDoneDateTime(null);

      // Refresh the lab tests list
      if (admission?.roomAdmissionId) {
        await fetchPatientLabTests(admission.roomAdmissionId);
      }

      // Reset form
      setCustomizeLabTestFormData({
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
      setCustomizeLabTestSearchTerm('');
      setShowCustomizeLabTestList(false);
      setCustomizeDoctorSearchTerm('');
      setShowCustomizeDoctorList(false);
    } catch (err) {
      console.error('Error saving Customize IPD Lab Test:', err);
      setCustomizeLabTestSubmitError(
        err instanceof Error ? err.message : 'Failed to save Customize IPD Lab Test'
      );
    } finally {
      setCustomizeLabTestSubmitting(false);
    }
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
        RecordedDateTime: (() => {
          // Send as non-timezone format (YYYY-MM-DDTHH:mm:ss)
          if (!visitVitalsFormData.recordedDateTime || visitVitalsFormData.recordedDateTime.trim() === '') {
            return '';
          }
          let dateTime = visitVitalsFormData.recordedDateTime.trim();
          // If it's in YYYY-MM-DDTHH:mm format, append :00 for seconds
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateTime)) {
            return dateTime + ':00';
          } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateTime)) {
            // Already has seconds, use as-is
            return dateTime;
          } else {
            // Try to parse and format without timezone
            try {
              const date = new Date(dateTime);
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
              }
            } catch {
              return dateTime;
            }
            return dateTime;
          }
        })(),
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

      // Call the API to create the visit vitals
      console.log('API Endpoint: POST /patient-admit-visit-vitals');
      const response = await apiRequest<any>('/patient-admit-visit-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      console.log('Visit vitals created successfully:', response);

      // Close dialog
      setIsAddVisitVitalsDialogOpen(false);
      setAddVisitVitalsRecordedDateTime(null);

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

  // Handle saving Customize Visit Vitals
  const handleSaveCustomizeVisitVitals = async () => {
    try {
      setVisitVitalsSubmitting(true);
      setVisitVitalsSubmitError(null);

      console.log('Saving Customize Visit Vitals with data:', customizeVisitVitalsFormData);
      console.log('Customizing Visit Vitals object:', customizingVisitVitals);

      if (!customizingVisitVitals) {
        console.error('customizingVisitVitals is null or undefined');
        throw new Error('Visit Vitals data is missing. Please close and reopen the dialog.');
      }

      // Get the vitals ID for updating - try stored ID first, then multiple field name variations
      // Accept both string (UUID) and number IDs
      let vitalsId: string | number | null = customizingVisitVitalsId || 
                     (customizingVisitVitals as any)?.PatientAdmitVisitVitalsId || 
                     (customizingVisitVitals as any)?.patientAdmitVisitVitalsId ||
                     (customizingVisitVitals as any)?.Patient_Admit_Visit_Vitals_Id ||
                     (customizingVisitVitals as any)?.patient_admit_visit_vitals_id ||
                     (customizingVisitVitals as any)?.PatientAdmitVisitVitalsID ||
                     (customizingVisitVitals as any)?.PATIENT_ADMIT_VISIT_VITALS_ID ||
                     customizingVisitVitals?.id ||
                     (customizingVisitVitals as any)?.Id ||
                     (customizingVisitVitals as any)?.ID ||
                     (customizingVisitVitals as any)?.uuid ||
                     (customizingVisitVitals as any)?.UUID ||
                     (customizingVisitVitals as any)?.vitalsId ||
                     (customizingVisitVitals as any)?.VitalsId ||
                     (customizingVisitVitals as any)?.VITALS_ID;
      
      console.log('Extracted vitals ID:', vitalsId, 'Type:', typeof vitalsId);
      console.log('Stored customizingVisitVitalsId:', customizingVisitVitalsId);
      console.log('All available keys in customizingVisitVitals:', Object.keys(customizingVisitVitals || {}));
      
      if (!vitalsId || vitalsId === 'undefined' || vitalsId === 'null' || vitalsId === 0 || vitalsId === '0') {
        console.error('Visit Vitals ID not found. Available fields:', Object.keys(customizingVisitVitals || {}));
        console.error('Full customizingVisitVitals object:', JSON.stringify(customizingVisitVitals, null, 2));
        throw new Error('Visit Vitals ID is required for updating. Please close and reopen the dialog.');
      }
      
      // Convert to string for URL (UUID string)
      const vitalsIdString = String(vitalsId);

      // Prepare the request payload - all fields are optional per API spec
      const payload: any = {};

      // Optional fields - only include if they have values
      if (admission?.roomAdmissionId) {
        payload.RoomAdmissionId = Number(admission.roomAdmissionId);
      }

      let patientIdValue = customizeVisitVitalsFormData.patientId;
      if (!patientIdValue || patientIdValue === 'undefined' || patientIdValue === '' || patientIdValue === 'null') {
        patientIdValue = (admission as any)?.patientId ||
                        (admission as any)?.PatientId ||
                        (admission as any)?.PatientID ||
                        (admission as any)?.patient_id ||
                        (admission as any)?.Patient_ID ||
                        '';
      }
      if (patientIdValue && patientIdValue !== 'undefined' && patientIdValue !== '' && patientIdValue !== 'null') {
        payload.PatientId = String(patientIdValue).trim();
      }

      if (customizeVisitVitalsFormData.nurseId && customizeVisitVitalsFormData.nurseId.trim() !== '') {
        payload.NurseId = Number(customizeVisitVitalsFormData.nurseId);
      }

      if (customizeVisitVitalsFormData.patientStatus && customizeVisitVitalsFormData.patientStatus.trim() !== '') {
        payload.PatientStatus = customizeVisitVitalsFormData.patientStatus.trim();
      }

      if (customizeVisitVitalsFormData.recordedDateTime && customizeVisitVitalsFormData.recordedDateTime.trim() !== '') {
        // Format RecordedDateTime as ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)
        let dateTime = customizeVisitVitalsFormData.recordedDateTime.trim();
        // If it's in YYYY-MM-DDTHH:mm format, append :00 for seconds
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateTime)) {
          payload.RecordedDateTime = dateTime + ':00';
        } 
        // If it's already in YYYY-MM-DDTHH:mm:ss format, use as-is
        else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateTime)) {
          payload.RecordedDateTime = dateTime;
        }
        // If it's in YYYY-MM-DD HH:mm:ss format (space-separated), use as-is
        else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateTime)) {
          payload.RecordedDateTime = dateTime;
        }
        // Try to parse and format
        else {
          try {
            const date = new Date(dateTime);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              const seconds = String(date.getSeconds()).padStart(2, '0');
              // Use space-separated format: YYYY-MM-DD HH:MM:SS
              payload.RecordedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            } else {
              payload.RecordedDateTime = dateTime;
            }
          } catch {
            payload.RecordedDateTime = dateTime;
          }
        }
      }

      if (customizeVisitVitalsFormData.visitRemarks && customizeVisitVitalsFormData.visitRemarks.trim() !== '') {
        payload.VisitRemarks = customizeVisitVitalsFormData.visitRemarks.trim();
      }

      if (customizeVisitVitalsFormData.dailyOrHourlyVitals && customizeVisitVitalsFormData.dailyOrHourlyVitals.trim() !== '') {
        payload.DailyOrHourlyVitals = customizeVisitVitalsFormData.dailyOrHourlyVitals.trim();
      }

      if (customizeVisitVitalsFormData.heartRate && customizeVisitVitalsFormData.heartRate.trim() !== '') {
        payload.HeartRate = Math.floor(Number(customizeVisitVitalsFormData.heartRate)); // Integer
      }

      if (customizeVisitVitalsFormData.bloodPressure && customizeVisitVitalsFormData.bloodPressure.trim() !== '') {
        payload.BloodPressure = customizeVisitVitalsFormData.bloodPressure.trim();
      }

      if (customizeVisitVitalsFormData.temperature && customizeVisitVitalsFormData.temperature.trim() !== '') {
        payload.Temperature = Math.floor(Number(customizeVisitVitalsFormData.temperature)); // Integer
      }

      if (customizeVisitVitalsFormData.o2Saturation && customizeVisitVitalsFormData.o2Saturation.trim() !== '') {
        payload.O2Saturation = Math.floor(Number(customizeVisitVitalsFormData.o2Saturation)); // Integer
      }

      if (customizeVisitVitalsFormData.respiratoryRate && customizeVisitVitalsFormData.respiratoryRate.trim() !== '') {
        payload.RespiratoryRate = Math.floor(Number(customizeVisitVitalsFormData.respiratoryRate)); // Integer
      }

      if (customizeVisitVitalsFormData.pulseRate && customizeVisitVitalsFormData.pulseRate.trim() !== '') {
        payload.PulseRate = Math.floor(Number(customizeVisitVitalsFormData.pulseRate)); // Integer
      }

      if (customizeVisitVitalsFormData.vitalsStatus && customizeVisitVitalsFormData.vitalsStatus.trim() !== '') {
        payload.VitalsStatus = customizeVisitVitalsFormData.vitalsStatus.trim();
      }

      if (customizeVisitVitalsFormData.vitalsRemarks && customizeVisitVitalsFormData.vitalsRemarks.trim() !== '') {
        payload.VitalsRemarks = customizeVisitVitalsFormData.vitalsRemarks.trim();
      }

      if (customizeVisitVitalsFormData.vitalsCreatedBy && customizeVisitVitalsFormData.vitalsCreatedBy.trim() !== '') {
        payload.VitalsCreatedBy = Math.floor(Number(customizeVisitVitalsFormData.vitalsCreatedBy)); // Integer
      }

      if (customizeVisitVitalsFormData.status && customizeVisitVitalsFormData.status.trim() !== '') {
        payload.Status = customizeVisitVitalsFormData.status.trim();
      }

      console.log('API Payload:', JSON.stringify(payload, null, 2));

      // Call the API to update the visit vitals
      console.log('API Endpoint: PUT /api/patient-admit-visit-vitals/' + vitalsIdString);
      console.log('Visit Vitals ID:', vitalsIdString);
      const response = await apiRequest<any>(`/patient-admit-visit-vitals/${vitalsIdString}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      console.log('Visit vitals updated successfully:', response);

      // Close dialog
      setIsCustomizeVisitVitalsDialogOpen(false);
      setCustomizingVisitVitals(null);
      setCustomizingVisitVitalsId(null);
      setCustomizeVisitVitalsRecordedDateTime(null);
      setCustomizeVisitVitalsCreatedAt(null);

      // Refresh the visit vitals list
      if (admission?.roomAdmissionId) {
        await fetchPatientAdmitVisitVitals(admission.roomAdmissionId);
      }

      // Reset form
      setCustomizeVisitVitalsFormData({
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
      setCustomizeVisitVitalsNurseSearchTerm('');
      setShowCustomizeVisitVitalsNurseList(false);
    } catch (err) {
      console.error('Error saving customize visit vitals:', err);
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Room Admission Details</CardTitle>
            <div className="flex items-center gap-2">
            </div>
          </CardHeader>
          <CardContent className="dashboard-table-card-content">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <Label className="text-sm text-gray-500" htmlFor="patientNo">Patient No</Label>
                <p className="text-gray-900 font-medium mt-1">{admission.patientNo || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Patient Name</Label>
                <p className="text-gray-900 font-medium mt-1">{admission.patientName}</p>
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
                <p className="text-gray-900 font-medium mt-1">{formatRawDate(admission.admissionDate)}</p>
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
              {admission.estimatedStay && (
                <div>
                  <Label className="text-sm text-gray-500">Estimated Stay</Label>
                  <p className="text-gray-900 font-medium mt-1">{admission.estimatedStay}</p>
                </div>
              )}
              {admission.createdAt && (
                <div>
                  <Label className="text-sm text-gray-500">Created At</Label>
                  <p className="text-gray-900 font-medium mt-1">{formatRawDateTime(admission.createdAt)}</p>
                </div>
              )}
              <div>
                <Label className="text-sm text-gray-500">Room Vacant Date</Label>
                <p className="text-gray-900 font-medium mt-1 break-words">{formatRawDate((admission as any).roomVacantDate)}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Shift To Another Room</Label>
                <p className="mt-1">
                  <Badge variant={(admission as any).shiftToAnotherRoom ? 'default' : 'outline'}>
                    {(admission as any).shiftToAnotherRoom || 'N/A'}
                  </Badge>
                </p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Shifted To Details</Label>
                <p className="text-gray-900 font-medium mt-1 break-words">{(admission as any).shiftedToDetails || 'N/A'}</p>
              </div>
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
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">TestStatus</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">TestDoneDateTime</th>
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
                            <td className="py-3 px-4">
                              <Badge variant={
                                labTest.testStatus?.toLowerCase() === 'completed' || labTest.testStatus?.toLowerCase() === 'done' ? 'default' :
                                labTest.testStatus?.toLowerCase() === 'pending' || labTest.testStatus?.toLowerCase() === 'in progress' ? 'outline' :
                                'outline'
                              }>
                                {labTest.testStatus || labTest.status || 'N/A'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {(() => {
                                // Display TestDoneDateTime in dd-mm-yyyy hh:mm AM/PM format
                                const rawTestDoneDateTime = labTest.testDoneDateTime || (labTest as any).TestDoneDateTime || (labTest as any).test_done_date_time;
                                if (!rawTestDoneDateTime) return 'N/A';
                                
                                try {
                                  // If it's already in DD-MM-YYYY HH:mm format, convert to AM/PM
                                  if (typeof rawTestDoneDateTime === 'string') {
                                    if (/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}/.test(rawTestDoneDateTime)) {
                                      const [datePart, timePart] = rawTestDoneDateTime.split(' ');
                                      const [hours, minutes] = timePart.split(':');
                                      const hours24 = parseInt(hours, 10);
                                      const period = hours24 >= 12 ? 'PM' : 'AM';
                                      const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
                                      return `${datePart}, ${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
                                    }
                                    // If it's ISO format, parse and format
                                    if (rawTestDoneDateTime.includes('T')) {
                                      const [datePart, timePart] = rawTestDoneDateTime.split('T');
                                      const [year, month, day] = datePart.split('-');
                                      const [hours, minutes] = (timePart.split('.')[0].split('+')[0].split('Z')[0]).split(':');
                                      const hours24 = parseInt(hours, 10);
                                      const period = hours24 >= 12 ? 'PM' : 'AM';
                                      const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
                                      return `${day}-${month}-${year}, ${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
                                    }
                                  }
                                  // Fallback: use formatRawDateTime
                                  return formatRawDateTime(rawTestDoneDateTime);
                                } catch {
                                  return String(rawTestDoneDateTime);
                                }
                              })()}
                            </td>
                              <td className="py-3 px-4 text-gray-600">
                                {formatRawDateTime(labTest.createdDate || (labTest as any).CreatedDate || (labTest as any).created_date || (labTest as any).createdAt)}
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleOpenCustomizeIPDLabTestDialog(labTest);
                                  }}
                                  className="gap-1"
                                >
                                  <Sliders className="size-3" />
                                  Manage
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
                        {patientDoctorVisits.map((visit, index) => {
                          // Use raw backend value - no IST conversion
                          // Backend sends "2026-01-11 23:50:00" format - display as-is or format for display only
                          const rawDateTime = visit.doctorVisitedDateTime || (visit as any).DoctorVisitedDateTime || (visit as any).doctor_visited_date_time;
                          let displayDateTime = 'N/A';
                          
                          if (rawDateTime) {
                            const dateStr = String(rawDateTime);
                            // If it's "YYYY-MM-DD HH:mm:ss" format, convert to "DD-MM-YYYY, HH:mm AM/PM" for display
                            if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateStr)) {
                              const [datePart, timePart] = dateStr.split(' ');
                              const [year, month, day] = datePart.split('-');
                              const [hours24, minutes] = timePart.split(':');
                              const hours = parseInt(hours24, 10);
                              const period = hours >= 12 ? 'PM' : 'AM';
                              const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                              displayDateTime = `${day}-${month}-${year}, ${String(displayHour).padStart(2, '0')}:${minutes} ${period}`;
                            } else {
                              // Use as-is for other formats
                              displayDateTime = dateStr;
                            }
                          }
                          
                          return (
                            <tr key={visit.patientDoctorVisitId || visit.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-900 font-medium">{visit.doctorName || 'N/A'}</td>
                              <td className="py-3 px-4 text-gray-600">
                                {displayDateTime}
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleOpenCustomizeDoctorVisitDialog(visit);
                                  }}
                                  className="gap-1"
                                >
                                  <Settings className="size-3" />
                                  Manage
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
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Recorded Date & Time</th>
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
                              {formatRawDateTime(vital.recordedDateTime)}
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
                              {formatRawDateTime(vital.vitalsCreatedAt)}
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
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOpenCustomizeVisitVitalsDialog(vital);
                                }}
                                className="gap-1"
                              >
                                <Settings className="size-3" />
                                Manage
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
          setSelectedFiles([]);
          setEditUploadedDocumentUrls([]);
        }
      }}>
        <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]" aria-describedby={undefined}>
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
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setIpdLabTestFormData({ ...ipdLabTestFormData, priority: e.target.value })}
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
                  <Label htmlFor="add-ipdReportsUrl">Reports URL</Label>
                  
                  {/* Display existing uploaded documents */}
                  {isEditIPDLabTestDialogOpen && editUploadedDocumentUrls.length > 0 && (
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
                    id="add-ipdReportsUrl"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedFiles(prev => [...prev, ...files]);
                      // Reset the input so the same file can be selected again
                      e.target.value = '';
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600 font-medium">New Files to Upload:</p>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 p-2 rounded">
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
                  <p className="text-xs text-gray-500 mt-1">Files will be uploaded when you click "Save"</p>
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
                setSelectedFiles([]);
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
        <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]" aria-describedby={undefined}>
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
                      {(() => {
                        // Display orderedDate the same way as Manage IPD Lab Test dialog
                        // Parse YYYY-MM-DD format and display as DD-MM-YYYY without timezone conversion
                        const rawOrderedDate = viewingLabTest.orderedDate || (viewingLabTest as any).OrderedDate || (viewingLabTest as any).ordered_date;
                        if (!rawOrderedDate) return 'N/A';
                        
                        if (typeof rawOrderedDate === 'string') {
                          // If it's already in YYYY-MM-DD format, convert to DD-MM-YYYY
                          if (/^\d{4}-\d{2}-\d{2}/.test(rawOrderedDate)) {
                            const [year, month, day] = rawOrderedDate.split('-');
                            return `${day}-${month}-${year}`;
                          }
                          // If it's in DD-MM-YYYY format, use as-is
                          if (/^\d{2}-\d{2}-\d{4}/.test(rawOrderedDate)) {
                            return rawOrderedDate;
                          }
                        }
                        // Fallback: try to parse and format
                        try {
                          const dateObj = new Date(rawOrderedDate);
                          if (!isNaN(dateObj.getTime())) {
                            const day = String(dateObj.getDate()).padStart(2, '0');
                            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const year = dateObj.getFullYear();
                            return `${day}-${month}-${year}`;
                          }
                        } catch {
                          return String(rawOrderedDate);
                        }
                        return String(rawOrderedDate);
                      })()}
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
                      {(() => {
                        // Display TestDoneDateTime in dd-mm-yyyy hh:mm AM/PM format
                        const rawTestDoneDateTime = viewingLabTest.testDoneDateTime;
                        if (!rawTestDoneDateTime) return 'N/A';
                        
                        try {
                          // If it's already in DD-MM-YYYY HH:mm format, convert to AM/PM
                          if (typeof rawTestDoneDateTime === 'string') {
                            if (/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}/.test(rawTestDoneDateTime)) {
                              const [datePart, timePart] = rawTestDoneDateTime.split(' ');
                              const [hours, minutes] = timePart.split(':');
                              const hours24 = parseInt(hours, 10);
                              const period = hours24 >= 12 ? 'PM' : 'AM';
                              const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
                              return `${datePart}, ${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
                            }
                            // If it's ISO format, parse and format
                            if (rawTestDoneDateTime.includes('T')) {
                              const [datePart, timePart] = rawTestDoneDateTime.split('T');
                              const [year, month, day] = datePart.split('-');
                              const [hours, minutes] = (timePart.split('.')[0].split('+')[0].split('Z')[0]).split(':');
                              const hours24 = parseInt(hours, 10);
                              const period = hours24 >= 12 ? 'PM' : 'AM';
                              const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
                              return `${day}-${month}-${year}, ${String(hours12).padStart(2, '0')}:${minutes} ${period}`;
                            }
                          }
                          // Fallback: use formatRawDateTime
                          return formatRawDateTime(rawTestDoneDateTime);
                        } catch {
                          return String(rawTestDoneDateTime);
                        }
                      })()}
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
                      {formatRawDateTime(viewingLabTest.createdDate || (viewingLabTest as any).CreatedDate || (viewingLabTest as any).created_date || (viewingLabTest as any).createdAt)}
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
                  handleOpenCustomizeIPDLabTestDialog(viewingLabTest);
                }}
              >
                <Sliders className="h-4 w-4 mr-2" />
                Manage
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage IPD Lab Test Dialog */}
        <CustomResizableDialog
        open={isCustomizeIPDLabTestDialogOpen} 
        onOpenChange={(open) => {
          setIsCustomizeIPDLabTestDialogOpen(open);
          if (!open) {
            setCustomizeOrderedDate(null);
            setCustomizeTestDoneDateTime(null);
          }
        }}
        className="p-0 gap-0"
        initialWidth={550}
        maxWidth={typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.95) : 1800}
      >
        <CustomResizableDialogClose onClick={() => {
          setIsCustomizeIPDLabTestDialogOpen(false);
          setCustomizeOrderedDate(null);
          setCustomizeTestDoneDateTime(null);
        }} />
        <div className="dialog-scrollable-wrapper dialog-content-scrollable flex flex-col flex-1 min-h-0 overflow-y-auto">
          <CustomResizableDialogHeader className="dialog-header-standard flex-shrink-0">
            <CustomResizableDialogTitle className="dialog-title-standard">Manage IPD Lab Test</CustomResizableDialogTitle>
          </CustomResizableDialogHeader>
          <div className="dialog-body-content-wrapper">
            <div className="dialog-form-container space-y-4">
              <div className="dialog-form-field-grid">
                <div className="dialog-form-field">
                  <Label htmlFor="customizeRoomAdmissionId" className="dialog-label-standard">Room Admission ID</Label>
                  <Input
                    id="customizeRoomAdmissionId"
                    value={customizeLabTestFormData.roomAdmissionId}
                    disabled
                    className="dialog-input-disabled"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizePatientId" className="dialog-label-standard">Patient ID</Label>
                  <Input
                    id="customizePatientId"
                    value={admission?.patientId || customizeLabTestFormData.patientId || ''}
                    disabled
                    className="dialog-input-disabled"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizePatientNo" className="dialog-label-standard">Patient No</Label>
                  <Input
                    id="customizePatientNo"
                    value={admission?.patientNo || 'N/A'}
                    disabled
                    className="dialog-input-disabled"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeLabTestId" className="dialog-label-standard">Lab Test *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="customizeLabTestId"
                      value={customizeLabTestSearchTerm}
                      onChange={(e) => {
                        setCustomizeLabTestSearchTerm(e.target.value);
                        setShowCustomizeLabTestList(true);
                      }}
                      onFocus={() => setShowCustomizeLabTestList(true)}
                      placeholder="Search by Display Test ID, name, or category..."
                      className="pl-10 dialog-input-standard"
                    />
                    {showCustomizeLabTestList && (
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
                                if (!customizeLabTestSearchTerm) return true;
                                const searchLower = customizeLabTestSearchTerm.toLowerCase();
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
                                const isSelected = customizeLabTestFormData.labTestId === testId;
                                return (
                                  <tr
                                    key={test.labTestId || test.id}
                                    onClick={() => {
                                      setCustomizeLabTestFormData({ ...customizeLabTestFormData, labTestId: testId });
                                      setCustomizeLabTestSearchTerm(displayText);
                                      setShowCustomizeLabTestList(false);
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
                          if (!customizeLabTestSearchTerm) return true;
                          const searchLower = customizeLabTestSearchTerm.toLowerCase();
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
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizePriority" className="dialog-label-standard">Priority *</Label>
                  <select
                    id="customizePriority"
                    className="dialog-select-standard"
                    value={customizeLabTestFormData.priority}
                    onChange={(e) => setCustomizeLabTestFormData({ ...customizeLabTestFormData, priority: e.target.value })}
                    required
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeOrderedDate" className="dialog-label-standard">Ordered Date *</Label>
                  <DatePicker
                    id="customizeOrderedDate"
                    selected={customizeOrderedDate}
                    onChange={(date: Date | null) => {
                      setCustomizeOrderedDate(date);
                      if (date) {
                        // Convert to YYYY-MM-DD format for form data
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const dateStr = `${year}-${month}-${day}`;
                        setCustomizeLabTestFormData({ ...customizeLabTestFormData, orderedDate: dateStr });
                      } else {
                        setCustomizeLabTestFormData({ ...customizeLabTestFormData, orderedDate: '' });
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
                  <Label htmlFor="customizeOrderedByDoctorId" className="dialog-label-standard">Ordered By Doctor *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="customizeOrderedByDoctorId"
                      placeholder="Search doctor by name..."
                      value={customizeDoctorSearchTerm}
                      onChange={(e) => {
                        setCustomizeDoctorSearchTerm(e.target.value);
                        setShowCustomizeDoctorList(true);
                      }}
                      onFocus={() => setShowCustomizeDoctorList(true)}
                      className="pl-10 dialog-input-standard"
                    />
                    {showCustomizeDoctorList && availableDoctors.length > 0 && (
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
                              if (!customizeDoctorSearchTerm) return true;
                              const searchLower = customizeDoctorSearchTerm.toLowerCase();
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
                              const isSelected = customizeLabTestFormData.orderedByDoctorId === String(doctorId);
                              return (
                                <tr
                                  key={doctorId}
                                  onClick={() => {
                                    setCustomizeLabTestFormData({ ...customizeLabTestFormData, orderedByDoctorId: String(doctorId) });
                                    setCustomizeDoctorSearchTerm(doctorName);
                                    setShowCustomizeDoctorList(false);
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
                {customizeLabTestFormData.patientType === 'OPD' && (
                  <div className="dialog-form-field">
                    <Label htmlFor="customizeAppointmentId" className="dialog-label-standard">Appointment ID</Label>
                    <Input
                      id="customizeAppointmentId"
                      value={customizeLabTestFormData.appointmentId}
                      onChange={(e) => setCustomizeLabTestFormData({ ...customizeLabTestFormData, appointmentId: e.target.value })}
                      placeholder="Enter Appointment ID (optional)"
                      className="dialog-input-standard"
                    />
                  </div>
                )}
                {customizeLabTestFormData.patientType === 'Emergency' && (
                  <div className="dialog-form-field">
                    <Label htmlFor="customizeEmergencyBedSlotId" className="dialog-label-standard">Emergency Bed Slot ID</Label>
                    <Input
                      id="customizeEmergencyBedSlotId"
                      value={customizeLabTestFormData.emergencyBedSlotId}
                      onChange={(e) => setCustomizeLabTestFormData({ ...customizeLabTestFormData, emergencyBedSlotId: e.target.value })}
                      placeholder="Enter Emergency Bed Slot ID (optional)"
                      className="dialog-input-standard"
                    />
                  </div>
                )}
                <div className="dialog-form-field">
                  <Label htmlFor="customizeLabTestDone" className="dialog-label-standard">Lab Test Done *</Label>
                  <select
                    id="customizeLabTestDone"
                    className="dialog-select-standard"
                    value={customizeLabTestFormData.labTestDone}
                    onChange={(e) => setCustomizeLabTestFormData({ ...customizeLabTestFormData, labTestDone: e.target.value })}
                    required
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeTestStatus" className="dialog-label-standard">Test Status *</Label>
                  <select
                    id="customizeTestStatus"
                    className="dialog-select-standard"
                    value={customizeLabTestFormData.testStatus}
                    onChange={(e) => setCustomizeLabTestFormData({ ...customizeLabTestFormData, testStatus: e.target.value })}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="InProgress">InProgress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeReportsUrl" className="dialog-label-standard">Reports URL</Label>
                  
                  {/* Display existing uploaded documents */}
                  {customizeUploadedDocumentUrls.length > 0 && (
                    <div className="mb-3 space-y-2">
                      <p className="text-sm text-gray-600 font-medium">Uploaded Documents:</p>
                      <div className="space-y-1">
                        {customizeUploadedDocumentUrls.map((url, index) => {
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
                                  setCustomizeUploadedDocumentUrls(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                title="Remove file"
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
                    id="customizeReportsUrl"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setCustomizeSelectedFiles(prev => [...prev, ...files]);
                      e.target.value = '';
                    }}
                    className="dialog-input-standard"
                  />
                  {customizeSelectedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600 font-medium">New Files to Upload:</p>
                      {customizeSelectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 p-2 rounded">
                          <span>{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCustomizeSelectedFiles(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Files will be uploaded when you click "Save"</p>
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeTestDoneDateTime" className="dialog-label-standard">Test Done Date & Time</Label>
                  <DatePicker
                    id="customizeTestDoneDateTime"
                    selected={customizeTestDoneDateTime}
                    onChange={(date: Date | null) => {
                      setCustomizeTestDoneDateTime(date);
                      if (date) {
                        // Extract date/time components directly without timezone conversion
                        // Format as YYYY-MM-DDTHH:mm (no timezone, no conversion)
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        const dateTimeStr = `${year}-${month}-${day}T${hours}:${minutes}`;
                        setCustomizeLabTestFormData({ ...customizeLabTestFormData, testDoneDateTime: dateTimeStr });
                      } else {
                        setCustomizeLabTestFormData({ ...customizeLabTestFormData, testDoneDateTime: '' });
                      }
                    }}
                    showTimeSelect
                    timeIntervals={1}
                    timeCaption="Time"
                    timeFormat="hh:mm aa"
                    dateFormat="dd-MM-yyyy hh:mm aa"
                    placeholderText="dd-mm-yyyy HH:MM AM/PM"
                    className="dialog-input-standard w-full"
                    wrapperClassName="w-full"
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="dialog-footer-buttons px-6 pb-4 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsCustomizeIPDLabTestDialogOpen(false);
                setCustomizingLabTest(null);
                setCustomizeSelectedFiles([]);
                setCustomizeOrderedDate(null);
                setCustomizeTestDoneDateTime(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCustomizeIPDLabTest}
              disabled={customizeLabTestSubmitting}
            >
              {customizeLabTestSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CustomResizableDialog>

      {/* Manage Doctor Visit Dialog */}
      <CustomResizableDialog 
        open={isCustomizeDoctorVisitDialogOpen} 
        onOpenChange={setIsCustomizeDoctorVisitDialogOpen}
        className="p-0 gap-0"
        initialWidth={550}
        maxWidth={typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.95) : 1800}
      >
        <CustomResizableDialogClose onClick={() => setIsCustomizeDoctorVisitDialogOpen(false)} />
        <div className="dialog-scrollable-wrapper dialog-content-scrollable flex flex-col flex-1 min-h-0 overflow-y-auto">
          <CustomResizableDialogHeader className="dialog-header-standard flex-shrink-0">
            <CustomResizableDialogTitle className="dialog-title-standard">Manage New Doctor Visit</CustomResizableDialogTitle>
          </CustomResizableDialogHeader>
          <div className="dialog-body-content-wrapper">
            <div className="dialog-form-container space-y-4">
              <div className="dialog-form-field-grid">
                <div className="dialog-form-field">
                  <Label htmlFor="customizeDoctorVisitPatientId" className="dialog-label-standard">Patient ID *</Label>
                  <Input
                    id="customizeDoctorVisitPatientId"
                    value={customizeDoctorVisitFormData.patientId}
                    disabled
                    className="dialog-input-disabled"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeDoctorVisitDoctorId" className="dialog-label-standard">Doctor *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="customizeDoctorVisitDoctorId"
                      value={customizeDoctorVisitDoctorSearchTerm}
                      onChange={(e) => {
                        setCustomizeDoctorVisitDoctorSearchTerm(e.target.value);
                        setShowCustomizeDoctorVisitDoctorList(true);
                      }}
                      onFocus={() => setShowCustomizeDoctorVisitDoctorList(true)}
                      placeholder="Search and select doctor..."
                      className="pl-10 dialog-input-standard"
                      required
                    />
                    {showCustomizeDoctorVisitDoctorList && (
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
                                if (!customizeDoctorVisitDoctorSearchTerm) return true;
                                const searchLower = customizeDoctorVisitDoctorSearchTerm.toLowerCase();
                                const name = (doctor.name || '').toLowerCase();
                                const id = String(doctor.id || '').toLowerCase();
                                const specialty = (doctor.specialty || '').toLowerCase();
                                return name.includes(searchLower) || id.includes(searchLower) || specialty.includes(searchLower);
                              })
                              .map((doctor) => {
                                const doctorId = String(doctor.id || '');
                                const isSelected = customizeDoctorVisitFormData.doctorId === doctorId;
                                return (
                                  <tr
                                    key={doctor.id}
                                    onClick={() => {
                                      setCustomizeDoctorVisitFormData({ ...customizeDoctorVisitFormData, doctorId: doctorId });
                                      setCustomizeDoctorVisitDoctorSearchTerm(`${doctor.name || 'Unknown'} (${doctor.specialty || 'N/A'})`);
                                      setShowCustomizeDoctorVisitDoctorList(false);
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
                          if (!customizeDoctorVisitDoctorSearchTerm) return true;
                          const searchLower = customizeDoctorVisitDoctorSearchTerm.toLowerCase();
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
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeDoctorVisitDateTime" className="dialog-label-standard">Doctor Visited Date & Time *</Label>
                  <DatePicker
                    id="customizeDoctorVisitDateTime"
                    selected={customizeDoctorVisitDateTime}
                    onChange={(date: Date | null) => {
                      setCustomizeDoctorVisitDateTime(date);
                      if (date) {
                        // Extract date/time components directly without timezone conversion
                        // Format as YYYY-MM-DDTHH:mm (no timezone, no conversion)
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        const dateTimeStr = `${year}-${month}-${day}T${hours}:${minutes}`;
                        setCustomizeDoctorVisitFormData({ ...customizeDoctorVisitFormData, doctorVisitedDateTime: dateTimeStr });
                      } else {
                        setCustomizeDoctorVisitFormData({ ...customizeDoctorVisitFormData, doctorVisitedDateTime: '' });
                      }
                    }}
                    showTimeSelect
                    timeIntervals={1}
                    timeCaption="Time"
                    timeFormat="hh:mm aa"
                    dateFormat="dd-MM-yyyy hh:mm aa"
                    placeholderText="dd-mm-yyyy HH:MM AM/PM"
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
                  <Label htmlFor="customizeDoctorVisitStatus" className="dialog-label-standard">Status *</Label>
                  <select
                    id="customizeDoctorVisitStatus"
                    className="dialog-select-standard"
                    value={customizeDoctorVisitFormData.status}
                    onChange={(e) => setCustomizeDoctorVisitFormData({ ...customizeDoctorVisitFormData, status: e.target.value })}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeDoctorVisitPatientCondition" className="dialog-label-standard">Patient Condition</Label>
                  <Input
                    id="customizeDoctorVisitPatientCondition"
                    value={customizeDoctorVisitFormData.patientCondition}
                    onChange={(e) => setCustomizeDoctorVisitFormData({ ...customizeDoctorVisitFormData, patientCondition: e.target.value })}
                    placeholder="Enter patient condition (optional)"
                    className="dialog-input-standard"
                  />
                </div>
                <div className="dialog-form-field col-span-2">
                  <Label htmlFor="customizeDoctorVisitRemarks" className="dialog-label-standard">Visits Remarks</Label>
                  <Textarea
                    id="customizeDoctorVisitRemarks"
                    value={customizeDoctorVisitFormData.visitsRemarks}
                    onChange={(e) => setCustomizeDoctorVisitFormData({ ...customizeDoctorVisitFormData, visitsRemarks: e.target.value })}
                    placeholder="Enter visit remarks (optional)"
                    rows={4}
                    className="dialog-input-standard"
                  />
                </div>
              </div>
              {customizeLabTestSubmitError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{customizeLabTestSubmitError}</p>
                </div>
              )}
            </div>
          </div>
          <div className="dialog-footer-buttons px-6 pb-4 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsCustomizeDoctorVisitDialogOpen(false);
                setCustomizingDoctorVisit(null);
                setCustomizeDoctorVisitDateTime(null);
                setCustomizeDoctorVisitCreatedAt(null);
                setCustomizeLabTestSubmitError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCustomizeDoctorVisit}
              disabled={customizeLabTestSubmitting}
            >
              {customizeLabTestSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CustomResizableDialog>

      {/* Add/Edit Doctor Visit Dialog */}
      <Dialog open={isAddDoctorVisitDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDoctorVisitDialogOpen(false);
          setAddDoctorVisitDateTime(null);
        }
      }}>
        <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]" aria-describedby={undefined}>
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
            <DialogTitle>Add New Doctor Visit</DialogTitle>
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
                  <DatePicker
                    id="doctorVisitDateTime"
                    selected={addDoctorVisitDateTime}
                    onChange={(date: Date | null) => {
                      setAddDoctorVisitDateTime(date);
                      if (date) {
                        // Extract local date/time components without timezone conversion
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        // Format as YYYY-MM-DDTHH:mm for form data (no timezone conversion)
                        const dateTimeStr = `${year}-${month}-${day}T${hours}:${minutes}`;
                        setDoctorVisitFormData({ ...doctorVisitFormData, doctorVisitedDateTime: dateTimeStr });
                      } else {
                        setDoctorVisitFormData({ ...doctorVisitFormData, doctorVisitedDateTime: '' });
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
                setAddDoctorVisitDateTime(null);
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


      {/* Add/Edit Visit Vitals Dialog */}
      <Dialog open={isAddVisitVitalsDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddVisitVitalsDialogOpen(false);
          setAddVisitVitalsRecordedDateTime(null);
        }
      }}>
        <DialogContent className="p-0 gap-0 large-dialog max-h-[90vh]" aria-describedby={undefined}>
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
            <DialogTitle>Add Visit Vitals</DialogTitle>
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
                  <DatePicker
                    id="visitVitalsRecordedDateTime"
                    selected={addVisitVitalsRecordedDateTime}
                    onChange={(date: Date | null) => {
                      setAddVisitVitalsRecordedDateTime(date);
                      if (date) {
                        // Extract local date/time components without timezone conversion
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        // Format as YYYY-MM-DDTHH:mm for form data (no timezone conversion)
                        const dateTimeStr = `${year}-${month}-${day}T${hours}:${minutes}`;
                        setVisitVitalsFormData({ ...visitVitalsFormData, recordedDateTime: dateTimeStr });
                      } else {
                        setVisitVitalsFormData({ ...visitVitalsFormData, recordedDateTime: '' });
                      }
                    }}
                    showTimeSelect
                    timeIntervals={1}
                    timeCaption="Time"
                    timeFormat="hh:mm aa"
                    dateFormat="dd-MM-yyyy hh:mm aa"
                    placeholderText="dd-mm-yyyy HH:MM AM/PM"
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
                <div className="col-span-2">
                  <Label htmlFor="visitVitalsRemarks">Vitals Remarks</Label>
                  <Textarea
                    id="visitVitalsRemarks"
                    value={visitVitalsFormData.vitalsRemarks}
                    onChange={(e) => setVisitVitalsFormData({ ...visitVitalsFormData, vitalsRemarks: e.target.value })}
                    placeholder="Enter vitals remarks (optional)"
                    rows={3}
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
                
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 py-3 flex-shrink-0 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddVisitVitalsDialogOpen(false);
                setAddVisitVitalsRecordedDateTime(null);
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


      {/* Manage Visit Vitals Dialog */}
      <CustomResizableDialog 
        open={isCustomizeVisitVitalsDialogOpen} 
        onOpenChange={(open) => {
          setIsCustomizeVisitVitalsDialogOpen(open);
          if (!open) {
            setCustomizeVisitVitalsRecordedDateTime(null);
            setCustomizeVisitVitalsCreatedAt(null);
          }
        }}
        className="p-0 gap-0"
        initialWidth={550}
        maxWidth={typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.95) : 1800}
      >
        <CustomResizableDialogClose onClick={() => {
          setIsCustomizeVisitVitalsDialogOpen(false);
          setCustomizeVisitVitalsRecordedDateTime(null);
          setCustomizeVisitVitalsCreatedAt(null);
        }} />
        <div className="dialog-scrollable-wrapper dialog-content-scrollable flex flex-col flex-1 min-h-0 overflow-y-auto">
          <CustomResizableDialogHeader className="dialog-header-standard flex-shrink-0">
            <CustomResizableDialogTitle className="dialog-title-standard">Manage Visit Vitals</CustomResizableDialogTitle>
          </CustomResizableDialogHeader>
          <div className="dialog-body-content-wrapper">
            {visitVitalsSubmitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                {visitVitalsSubmitError}
              </div>
            )}
            <div className="dialog-form-container space-y-4">
              <div className="dialog-form-field-grid">
                <div className="dialog-form-field">
                  <Label htmlFor="customizeVisitVitalsPatientId" className="dialog-label-standard">Patient ID *</Label>
                  <Input
                    id="customizeVisitVitalsPatientId"
                    value={customizeVisitVitalsFormData.patientId}
                    disabled
                    className="dialog-input-disabled"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeVisitVitalsRoomAdmissionId" className="dialog-label-standard">Room Admission ID</Label>
                  <Input
                    id="customizeVisitVitalsRoomAdmissionId"
                    value={admission?.roomAdmissionId || ''}
                    disabled
                    className="dialog-input-disabled"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeVisitVitalsNurseId" className="dialog-label-standard">Nurse *</Label>
                  <div className="relative">
                    <Input
                      id="customizeVisitVitalsNurseId"
                      value={customizeVisitVitalsNurseSearchTerm}
                      onChange={(e) => {
                        setCustomizeVisitVitalsNurseSearchTerm(e.target.value);
                        setShowCustomizeVisitVitalsNurseList(true);
                      }}
                      onFocus={() => setShowCustomizeVisitVitalsNurseList(true)}
                      placeholder="Search and select nurse..."
                      className="dialog-input-standard cursor-pointer"
                      required
                    />
                    {showCustomizeVisitVitalsNurseList && (
                      <div className="absolute z-50 mt-1 border border-gray-200 rounded-md max-h-48 overflow-y-auto bg-white w-full shadow-lg">
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
                                if (!customizeVisitVitalsNurseSearchTerm) return true;
                                const searchLower = customizeVisitVitalsNurseSearchTerm.toLowerCase();
                                const name = (nurse.UserName || nurse.name || '').toLowerCase();
                                const id = String(nurse.UserId || nurse.id || '').toLowerCase();
                                return name.includes(searchLower) || id.includes(searchLower);
                              })
                              .map((nurse) => {
                                const nurseId = String(nurse.UserId || nurse.id || '');
                                const isSelected = customizeVisitVitalsFormData.nurseId === nurseId;
                                return (
                                  <tr
                                    key={nurse.UserId || nurse.id}
                                    onClick={() => {
                                      setCustomizeVisitVitalsFormData({ ...customizeVisitVitalsFormData, nurseId: nurseId });
                                      setCustomizeVisitVitalsNurseSearchTerm(nurse.UserName || nurse.name || 'Unknown');
                                      setShowCustomizeVisitVitalsNurseList(false);
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
                          if (!customizeVisitVitalsNurseSearchTerm) return true;
                          const searchLower = customizeVisitVitalsNurseSearchTerm.toLowerCase();
                          const name = (nurse.UserName || nurse.name || '').toLowerCase();
                          const id = String(nurse.UserId || nurse.id || '').toLowerCase();
                          return name.includes(searchLower) || id.includes(searchLower);
                        }).length === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm">No nurses found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeVisitVitalsRecordedDateTime" className="dialog-label-standard">Recorded Date & Time *</Label>
                  <DatePicker
                    id="customizeVisitVitalsRecordedDateTime"
                    selected={customizeVisitVitalsRecordedDateTime}
                    onChange={(date: Date | null) => {
                      setCustomizeVisitVitalsRecordedDateTime(date);
                      if (date) {
                        // Extract local date/time components without timezone conversion
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        // Format as YYYY-MM-DDTHH:mm for form data (no timezone conversion)
                        const dateTimeStr = `${year}-${month}-${day}T${hours}:${minutes}`;
                        setCustomizeVisitVitalsFormData({ ...customizeVisitVitalsFormData, recordedDateTime: dateTimeStr });
                      } else {
                        setCustomizeVisitVitalsFormData({ ...customizeVisitVitalsFormData, recordedDateTime: '' });
                      }
                    }}
                    showTimeSelect
                    timeIntervals={1}
                    timeCaption="Time"
                    timeFormat="hh:mm aa"
                    dateFormat="dd-MM-yyyy hh:mm aa"
                    placeholderText="dd-mm-yyyy HH:MM AM/PM"
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
                  <Label htmlFor="customizeVisitVitalsDailyOrHourlyVitals" className="dialog-label-standard">Daily/Hourly Vitals *</Label>
                  <select
                    id="customizeVisitVitalsDailyOrHourlyVitals"
                    className="dialog-select-standard"
                    value={customizeVisitVitalsFormData.dailyOrHourlyVitals}
                    onChange={(e) => setCustomizeVisitVitalsFormData({ ...customizeVisitVitalsFormData, dailyOrHourlyVitals: e.target.value })}
                    required
                  >
                    <option value="Daily">Daily</option>
                    <option value="Hourly">Hourly</option>
                  </select>
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeVisitVitalsPatientStatus" className="dialog-label-standard">Patient Status *</Label>
                  <select
                    id="customizeVisitVitalsPatientStatus"
                    className="dialog-select-standard"
                    value={customizeVisitVitalsFormData.patientStatus}
                    onChange={(e) => setCustomizeVisitVitalsFormData({ ...customizeVisitVitalsFormData, patientStatus: e.target.value })}
                    required
                  >
                    <option value="Stable">Stable</option>
                    <option value="Notstable">Notstable</option>
                  </select>
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeVisitVitalsHeartRate" className="dialog-label-standard">Heart Rate</Label>
                  <Input
                    id="customizeVisitVitalsHeartRate"
                    type="number"
                    value={customizeVisitVitalsFormData.heartRate}
                    onChange={(e) => setCustomizeVisitVitalsFormData({ ...customizeVisitVitalsFormData, heartRate: e.target.value })}
                    placeholder="Enter heart rate (optional)"
                    className="dialog-input-standard"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeVisitVitalsBloodPressure" className="dialog-label-standard">Blood Pressure</Label>
                  <Input
                    id="customizeVisitVitalsBloodPressure"
                    value={customizeVisitVitalsFormData.bloodPressure}
                    onChange={(e) => setCustomizeVisitVitalsFormData({ ...customizeVisitVitalsFormData, bloodPressure: e.target.value })}
                    placeholder="e.g., 120/80 (optional)"
                    className="dialog-input-standard"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeVisitVitalsTemperature" className="dialog-label-standard">Temperature</Label>
                  <Input
                    id="customizeVisitVitalsTemperature"
                    type="number"
                    step="0.1"
                    value={customizeVisitVitalsFormData.temperature}
                    onChange={(e) => setCustomizeVisitVitalsFormData({ ...customizeVisitVitalsFormData, temperature: e.target.value })}
                    placeholder="Enter temperature (optional)"
                    className="dialog-input-standard"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeVisitVitalsO2Saturation" className="dialog-label-standard">O2 Saturation</Label>
                  <Input
                    id="customizeVisitVitalsO2Saturation"
                    type="number"
                    value={customizeVisitVitalsFormData.o2Saturation}
                    onChange={(e) => setCustomizeVisitVitalsFormData({ ...customizeVisitVitalsFormData, o2Saturation: e.target.value })}
                    placeholder="Enter O2 saturation (optional)"
                    className="dialog-input-standard"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeVisitVitalsRespiratoryRate" className="dialog-label-standard">Respiratory Rate</Label>
                  <Input
                    id="customizeVisitVitalsRespiratoryRate"
                    type="number"
                    value={customizeVisitVitalsFormData.respiratoryRate}
                    onChange={(e) => setCustomizeVisitVitalsFormData({ ...customizeVisitVitalsFormData, respiratoryRate: e.target.value })}
                    placeholder="Enter respiratory rate (optional)"
                    className="dialog-input-standard"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeVisitVitalsPulseRate" className="dialog-label-standard">Pulse Rate</Label>
                  <Input
                    id="customizeVisitVitalsPulseRate"
                    type="number"
                    value={customizeVisitVitalsFormData.pulseRate}
                    onChange={(e) => setCustomizeVisitVitalsFormData({ ...customizeVisitVitalsFormData, pulseRate: e.target.value })}
                    placeholder="Enter pulse rate (optional)"
                    className="dialog-input-standard"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeVisitVitalsVitalsStatus" className="dialog-label-standard">Vitals Status</Label>
                  <select
                    id="customizeVisitVitalsVitalsStatus"
                    className="dialog-select-standard"
                    value={customizeVisitVitalsFormData.vitalsStatus}
                    onChange={(e) => setCustomizeVisitVitalsFormData({ ...customizeVisitVitalsFormData, vitalsStatus: e.target.value })}
                    required
                  >
                    <option value="">Select Vitals Status</option>
                    <option value="Stable">Stable</option>
                    <option value="Critical">Critical</option>
                    <option value="Improving">Improving</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="customizeVisitVitalsStatus" className="dialog-label-standard">Status *</Label>
                  <select
                    id="customizeVisitVitalsStatus"
                    className="dialog-select-standard"
                    value={customizeVisitVitalsFormData.status}
                    onChange={(e) => setCustomizeVisitVitalsFormData({ ...customizeVisitVitalsFormData, status: e.target.value })}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
               
                <div className="dialog-form-field col-span-2">
                  <Label htmlFor="customizeVisitVitalsVitalsRemarks" className="dialog-label-standard">Vitals Remarks</Label>
                  <Textarea
                    id="customizeVisitVitalsVitalsRemarks"
                    value={customizeVisitVitalsFormData.vitalsRemarks}
                    onChange={(e) => setCustomizeVisitVitalsFormData({ ...customizeVisitVitalsFormData, vitalsRemarks: e.target.value })}
                    placeholder="Enter vitals remarks (optional)"
                    rows={4}
                    className="dialog-input-standard"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="dialog-footer-buttons px-6 pb-4 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsCustomizeVisitVitalsDialogOpen(false);
                setCustomizingVisitVitals(null);
                setCustomizingVisitVitalsId(null);
                setCustomizeVisitVitalsRecordedDateTime(null);
                setCustomizeVisitVitalsCreatedAt(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCustomizeVisitVitals}
              disabled={visitVitalsSubmitting}
            >
              {visitVitalsSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CustomResizableDialog>
      </div>
    </div>
  );
}
