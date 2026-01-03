// Manage Consultation Component - Full page matching the design
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ArrowLeft, UserCheck, FileText, TestTube, Clock } from 'lucide-react';
import { apiRequest } from '../api/base';
import { patientsApi } from '../api/patients';
import { patientAppointmentsApi } from '../api/patientAppointments';
import { doctorsApi } from '../api/doctors';
import { formatDateToDDMMYYYY } from '../utils/timeUtils';
import { uploadFiles } from '../utils/fileUpload';

interface ManageConsultationProps {
  appointmentId: number;
  onBack: () => void;
}

interface QueuePatient {
  tokenNumber: string;
  name: string;
  complaint: string;
}

interface PatientData {
  tokenNumber: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  complaint: string;
}

export function ManageConsultation({ appointmentId, onBack }: ManageConsultationProps) {
  const navigate = useNavigate();
  const [currentPatient, setCurrentPatient] = useState<PatientData | null>(null);
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [waitingAppointments, setWaitingAppointments] = useState<any[]>([]); // Store full appointment objects with IDs
  const [queueLoading, setQueueLoading] = useState(false);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  
  // Consultation form states
  const [diagnosis, setDiagnosis] = useState('');
  const [consultationCharge, setConsultationCharge] = useState<number>(0);
  const [labTests, setLabTests] = useState<Array<{ testName: string; labTestId: number; patientLabTestsId?: number }>>([]);
  const [prescribedLabTests, setPrescribedLabTests] = useState<Array<{ testName: string; labTestId: number; patientLabTestsId: number }>>([]);
  const [labTestsToDelete, setLabTestsToDelete] = useState<number[]>([]); // Track prescribed tests to delete on submission
  const [prescriptionsUrl, setPrescriptionsUrl] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [newLabTest, setNewLabTest] = useState('');
  const [referToAnotherDoctor, setReferToAnotherDoctor] = useState(false);
  const [referredDoctorId, setReferredDoctorId] = useState<string>('');
  const [transferToIPDOTICU, setTransferToIPDOTICU] = useState(false);
  const [transferTo, setTransferTo] = useState<'IPD Room Admission' | 'ICU' | 'OT' | undefined>(undefined);
  const [transferDetails, setTransferDetails] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [doctorDetailsMap, setDoctorDetailsMap] = useState<Map<number, any>>(new Map());
  
  // Available lab tests from API (store full objects to get LabTestId)
  const [availableLabTests, setAvailableLabTests] = useState<any[]>([]);
  const [labTestsLoading, setLabTestsLoading] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  const [doctorData, setDoctorData] = useState<{ name: string; specialty: string } | null>(null);
  
  // File upload state for prescriptions
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedDocumentUrls, setUploadedDocumentUrls] = useState<string[]>([]);

  // Track object URLs to properly clean them up
  const fileObjectUrlsRef = useRef<string[]>([]);

  // Create object URLs for selected files (for preview)
  const fileObjectUrls = useMemo(() => {
    // Revoke old URLs before creating new ones
    fileObjectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    // Create new URLs for current files
    const newUrls = selectedFiles.map(file => URL.createObjectURL(file));
    fileObjectUrlsRef.current = newUrls;
    return newUrls;
  }, [selectedFiles]);

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all object URLs when component unmounts
      fileObjectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      fileObjectUrlsRef.current = [];
    };
  }, []);

  // Fetch appointment data to get patientId
  useEffect(() => {
    const fetchAppointment = async () => {
      if (!appointmentId) return;
      try {
        const response = await apiRequest<any>(`/patient-appointments/${appointmentId}`);
        const appointment = response?.data || response;
        
        // Normalize the appointment data to handle both PascalCase and camelCase
        if (appointment) {
          setAppointmentData({
            ...appointment,
            patientId: appointment.patientId || appointment.PatientId || '',
          });
          // Initialize diagnosis from appointment data
          setDiagnosis(appointment.diagnosis || appointment.Diagnosis || '');
          // Initialize prescriptionsUrl from appointment data
          const prescriptionsUrlValue = appointment.prescriptionsUrl || appointment.PrescriptionsUrl || '';
          setPrescriptionsUrl(prescriptionsUrlValue);
          // If prescriptionsUrl exists and contains file URLs, parse them
          if (prescriptionsUrlValue) {
            // If it's a comma-separated list of URLs, split them
            if (prescriptionsUrlValue.includes(',')) {
              setUploadedDocumentUrls(prescriptionsUrlValue.split(',').map(u => u.trim()).filter(u => u));
            } else if (prescriptionsUrlValue) {
              setUploadedDocumentUrls([prescriptionsUrlValue]);
            }
          }
          // Initialize followUp from appointment data
          setFollowUp(appointment.followUpDetails || appointment.FollowUpDetails || '');
          // Initialize consultationCharge from appointment data
          setConsultationCharge(appointment.consultationCharge || appointment.ConsultationCharge || 0);
          // Initialize followup options from appointment data
          setReferToAnotherDoctor(appointment.referToAnotherDoctor || appointment.ReferToAnotherDoctor === 'Yes' || false);
          setReferredDoctorId(appointment.referredDoctorId || appointment.ReferredDoctorId || '');
          setTransferToIPDOTICU(appointment.transferToIPDOTICU || appointment.TransferToIPDOTICU === 'Yes' || false);
          setTransferTo(appointment.transferTo || appointment.TransferTo);
          setTransferDetails(appointment.transferDetails || appointment.TransferDetails || '');
        }
      } catch (err) {
        console.error('Failed to fetch appointment:', err);
      }
    };
    
    fetchAppointment();
  }, [appointmentId]);

  // Fetch doctor data when appointment data is available
  useEffect(() => {
    const fetchDoctor = async () => {
      if (!appointmentData) return;
      
      const doctorId = appointmentData.doctorId || appointmentData.DoctorId;
      if (!doctorId) {
        console.warn('No doctorId found in appointment data');
        return;
      }

      try {
        const doctor = await doctorsApi.getById(Number(doctorId));
        setDoctorData({
          name: doctor.name || 'Unknown Doctor',
          specialty: doctor.specialty || 'General Medicine',
        });
      } catch (err) {
        console.error('Failed to fetch doctor:', err);
        setDoctorData({
          name: 'Unknown Doctor',
          specialty: 'General Medicine',
        });
      }
    };
    
    fetchDoctor();
  }, [appointmentData]);

  // Fetch patient data when appointment data is available
  useEffect(() => {
    const fetchPatient = async () => {
      if (!appointmentData) return;
      
      const patientId = appointmentData.patientId || appointmentData.PatientId;
      if (!patientId) {
        console.warn('No patientId found in appointment data');
        return;
      }

      try {
        const patient = await patientsApi.getById(patientId);
        
        // Extract token number from appointment
        const tokenNumber = appointmentData.tokenNo || appointmentData.TokenNo || 'N/A';
        
        // Extract patient details
        const patientName = patient.PatientName || patient.patientName || patient.name || 'N/A';
        const age = patient.Age || patient.age || 0;
        const gender = patient.Gender || patient.gender || 'N/A';
        const phone = patient.PhoneNo || patient.phoneNo || patient.phone || 'N/A';
        const chiefComplaint = patient.ChiefComplaint || patient.chiefComplaint || appointmentData.ChiefComplaint || appointmentData.chiefComplaint || 'N/A';
        
        const patientData: PatientData = {
          tokenNumber,
          name: patientName,
          age,
          gender,
          phone,
          complaint: chiefComplaint,
        };
        
        setCurrentPatient(patientData);
        
        // Console log all patient details
        console.log('=== Patient Record Details ===');
        console.log('Patient ID:', patientId);
        console.log('Token Number:', tokenNumber);
        console.log('Patient Name:', patientName);
        console.log('Age:', age);
        console.log('Gender:', gender);
        console.log('Phone:', phone);
        console.log('Chief Complaint:', chiefComplaint);
        console.log('Full Patient Record:', patient);
        console.log('Full Appointment Data:', appointmentData);
        console.log('================================');
      } catch (err) {
        console.error('Failed to fetch patient:', err);
      }
    };
    
    fetchPatient();
  }, [appointmentData]);

  // Fetch waiting queue for the same doctor
  useEffect(() => {
    const fetchWaitingQueue = async () => {
      if (!appointmentData) return;
      
      const doctorId = appointmentData.doctorId || appointmentData.DoctorId;
      if (!doctorId) {
        console.warn('No doctorId found in appointment data');
        return;
      }

      try {
        setQueueLoading(true);
        // Fetch all appointments for the same doctor with "Waiting" status
        const response = await patientAppointmentsApi.getAll({
          doctorId: Number(doctorId),
          appointmentStatus: 'Waiting',
          page: 1,
          limit: 100, // Get enough appointments to find the next 3
        });

        console.log('Waiting queue API response:', response);

        // Extract the data array from the paginated response
        const appointments = response?.data || [];
        console.log('Extracted appointments array:', appointments);

        // Exclude the current appointment and sort by appointment date and time (first-come-first-serve)
        const sortedWaitingAppointments = appointments
          .filter(apt => apt.id !== appointmentId)
          .sort((a, b) => {
            // First sort by appointment date (YYYY-MM-DD format)
            const dateA = a.appointmentDate || '';
            const dateB = b.appointmentDate || '';
            const dateCompare = dateA.localeCompare(dateB);
            
            if (dateCompare !== 0) {
              return dateCompare; // Different dates, sort by date
            }
            
            // Same date, sort by appointment time (HH:mm format) - first-come-first-serve
            const timeA = a.appointmentTime || '';
            const timeB = b.appointmentTime || '';
            return timeA.localeCompare(timeB);
          })
          .slice(0, 3); // Limit to next 3 people

        console.log('Filtered and sorted waiting appointments (next 3):', sortedWaitingAppointments);
        
        // Store the full appointment objects for navigation
        setWaitingAppointments(sortedWaitingAppointments);

        // Fetch patient details for each appointment
        const queuePatients: QueuePatient[] = await Promise.all(
          sortedWaitingAppointments.map(async (appointment) => {
            try {
              const patient = await patientsApi.getById(appointment.patientId);
              const tokenNumber = appointment.tokenNo || 'N/A';
              const patientName = patient.PatientName || patient.patientName || patient.name || 'N/A';
              const chiefComplaint = patient.ChiefComplaint || patient.chiefComplaint || 'N/A';
              
              return {
                tokenNumber,
                name: patientName,
                complaint: chiefComplaint,
              };
            } catch (err) {
              console.error('Failed to fetch patient for queue:', err);
              return {
                tokenNumber: appointment.tokenNo || 'N/A',
                name: 'Unknown',
                complaint: 'N/A',
              };
            }
          })
        );

        setQueue(queuePatients);
        console.log('Waiting queue loaded:', queuePatients);
      } catch (err) {
        console.error('Failed to fetch waiting queue:', err);
        setQueue([]);
      } finally {
        setQueueLoading(false);
      }
    };

    fetchWaitingQueue();
  }, [appointmentData, appointmentId]);

  // Helper function to extract field from object with multiple variations
  const extractField = (obj: any, fieldNames: string[], defaultValue: any = null): any => {
    if (!obj) return defaultValue;
    
    for (const fieldName of fieldNames) {
      // Handle nested paths like 'LabTest.TestName'
      if (fieldName.includes('.')) {
        const parts = fieldName.split('.');
        let value = obj;
        for (const part of parts) {
          if (value && typeof value === 'object' && (part in value)) {
            value = value[part];
          } else {
            value = null;
            break;
          }
        }
        if (value !== null && value !== undefined) {
          return value;
        }
      } else {
        // Handle direct field access
        if (fieldName in obj && obj[fieldName] !== null && obj[fieldName] !== undefined) {
          return obj[fieldName];
        }
      }
    }
    
    return defaultValue;
  };

  // Fetch prescribed lab tests for this appointment
  useEffect(() => {
    const fetchPrescribedLabTests = async () => {
      if (!appointmentId) return;
      
      try {
        setLabTestsLoading(true);
        const response = await apiRequest<any>(`/patient-lab-tests/with-details?appointmentId=${appointmentId}`);
        
        console.log('ManageConsultation - Prescribed Lab Tests API Response:', JSON.stringify(response, null, 2));
        
        // Handle different response structures
        let labTestsData: any[] = [];
        if (Array.isArray(response)) {
          labTestsData = response;
        } else if (response?.data && Array.isArray(response.data)) {
          labTestsData = response.data;
        } else if (response?.data?.data && Array.isArray(response.data.data)) {
          labTestsData = response.data.data;
        }
        
        console.log('ManageConsultation - Extracted Prescribed Lab Tests Data:', JSON.stringify(labTestsData, null, 2));
        
        // Extract TestName from LabTest object, LabTestId, and PatientLabTestsId using extractField helper
        const prescribedTests = labTestsData.map((item: any) => {
          // Extract TestName from LabTest object (handle nested paths)
          const testName = extractField(item, [
            'LabTest.TestName', 'LabTest.testName', 'labTest.TestName', 'labTest.testName',
            'LabTest.Name', 'LabTest.name', 'labTest.Name', 'labTest.name',
            'TestName', 'testName', 'name', 'Name'
          ], '');
          
          // Extract LabTestId (could be in LabTest object or directly in item)
          const labTestId = extractField(item, [
            'LabTest.LabTestsId', 'LabTest.labTestsId', 'labTest.LabTestsId', 'labTest.labTestsId',
            'LabTest.LabTestId', 'LabTest.labTestId', 'labTest.LabTestId', 'labTest.labTestId',
            'LabTest.id', 'labTest.id',
            'LabTestId', 'labTestId', 'LabTestsId', 'labTestsId', 'id', 'Id'
          ], 0);
          
          // Extract PatientLabTestsId (for deletion)
          const patientLabTestsId = extractField(item, [
            'PatientLabTestsId', 'patientLabTestsId', 'PatientLabTestId', 'patientLabTestId',
            'Id', 'id'
          ], null);
          
          return {
            testName,
            labTestId: Number(labTestId),
            patientLabTestsId: patientLabTestsId ? Number(patientLabTestsId) : undefined,
          };
        }).filter((test: any) => test.testName !== '' && test.labTestId > 0); // Filter out invalid tests
        
        console.log('ManageConsultation - Mapped Prescribed Lab Tests:', prescribedTests);
        // Store prescribed tests separately (not in labTests array)
        setPrescribedLabTests(prescribedTests.filter((test: any) => test.patientLabTestsId !== undefined));
      } catch (err) {
        console.error('Failed to fetch prescribed lab tests:', err);
        setPrescribedLabTests([]);
      } finally {
        setLabTestsLoading(false);
      }
    };
    
    fetchPrescribedLabTests();
  }, [appointmentId]);

  // Fetch available lab tests from API (for adding new tests)
  useEffect(() => {
    const fetchLabTests = async () => {
      try {
        const response = await apiRequest<any>('/lab-tests');
        const labTestsData = response?.data || response || [];
        
        // Store full test objects with normalized TestName
        const normalizedTests = Array.isArray(labTestsData) 
          ? labTestsData
              .map((test: any) => ({
                ...test,
                TestName: test.TestName || test.testName || test.name || test.Name || '',
                LabTestsId: test.LabTestsId || test.labTestsId || test.LabTestId || test.labTestId || test.id || 0,
              }))
              .filter((test: any) => test.TestName !== '') // Remove tests without names
          : [];
        
        setAvailableLabTests(normalizedTests);
      } catch (err) {
        console.error('Failed to fetch lab tests:', err);
        setAvailableLabTests([]);
      }
    };
    
    fetchLabTests();
  }, []);

  // Fetch available doctors for referral
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const doctors = await doctorsApi.getAll();
        setAvailableDoctors(doctors);
        
        // Fetch department details for each doctor
        const detailsMap = new Map<number, any>();
        const fetchPromises = doctors.map(async (doctor) => {
          try {
            const response = await apiRequest<any>(`/users/${doctor.id}/doctor-details`);
            console.log(`Doctor ${doctor.id} details response:`, response);
            
            // Handle different response structures: { data: {...} } or direct object
            const doctorDetails = response?.data || response;
            console.log(`Doctor ${doctor.id} extracted details:`, doctorDetails);
            
            if (doctorDetails) {
              detailsMap.set(doctor.id, doctorDetails);
            // Log department extraction for debugging
            const department = doctorDetails.DepartmentName || 
                              doctorDetails.departmentName || 
                              doctorDetails.DoctorDepartmentName ||
                              doctorDetails.Department?.DepartmentName ||
                              doctorDetails.Department?.name ||
                              doctorDetails.department?.name ||
                              doctorDetails.department;
            console.log(`Doctor ${doctor.id} department extracted:`, department);
            console.log(`Doctor ${doctor.id} full details object:`, JSON.stringify(doctorDetails, null, 2));
            }
          } catch (err) {
            console.error(`Failed to fetch doctor details for doctor ${doctor.id}:`, err);
          }
        });
        
        await Promise.all(fetchPromises);
        console.log('Doctor details map:', detailsMap);
        setDoctorDetailsMap(detailsMap);
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
        setAvailableDoctors([]);
      }
    };
    
    fetchDoctors();
  }, []);

  const addLabTest = (test: any) => {
    const testName = test.TestName || test.testName || test.name || test.Name || '';
    
    // Check if test already exists in newly selected tests or prescribed tests
    if (!testName || 
        labTests.some(lt => lt.testName === testName) || 
        prescribedLabTests.some(lt => lt.testName === testName)) {
      return;
    }

    const labTestId = test.LabTestsId || test.labTestsId || test.LabTestId || test.labTestId || test.id;
    
    if (!labTestId) {
      alert('Lab test ID not found.');
      return;
    }

    // Add to local state (in-memory array) - no API call yet
    setLabTests([...labTests, { testName, labTestId: Number(labTestId) }]);
  };

  const removeLabTest = (index: number) => {
    // Remove from local state (newly selected tests only - not yet saved to API)
    setLabTests(labTests.filter((_, i) => i !== index));
  };

  const removePrescribedLabTest = (patientLabTestsId: number, index: number) => {
    // Remove from prescribed lab tests state and add to deletion queue (will be deleted on form submission)
    setPrescribedLabTests(prescribedLabTests.filter((_, i) => i !== index));
    setLabTestsToDelete([...labTestsToDelete, patientLabTestsId]);
  };

  const completeConsultation = async () => {
    if (!diagnosis) {
      alert('Please enter diagnosis');
      return;
    }


    // Submit all lab test operations (adds and deletes) before showing prescription dialog
    if (labTests.length > 0 || labTestsToDelete.length > 0) {
      if (!appointmentId) {
        alert('No appointment ID available.');
        return;
      }

      const patientId = appointmentData?.patientId || appointmentData?.PatientId;
      
      if (!patientId) {
        alert('Patient information not available. Please wait for appointment data to load.');
        return;
      }

      try {
        // Delete prescribed lab tests that were marked for deletion
        if (labTestsToDelete.length > 0) {
          const deletePromises = labTestsToDelete.map(async (patientLabTestsId) => {
            return apiRequest(`/patient-lab-tests/${patientLabTestsId}`, {
              method: 'DELETE',
            });
          });
          await Promise.all(deletePromises);
          console.log('Deleted prescribed lab tests:', labTestsToDelete);
        }

        // Submit all newly selected lab tests
        if (labTests.length > 0) {
          const labTestPromises = labTests.map(async (labTest) => {
            const payload = {
              PatientType: 'OPD',
              PatientId: patientId,
              LabTestId: labTest.labTestId,
              AppointmentId: appointmentId,
              RoomAdmissionId: null,
              EmergencyBedSlotId: null,
              BillId: null,
              Priority: null,
              LabTestDone: 'No',
              ReportsUrl: null,
              TestStatus: null,
              TestDoneDateTime: null,
              Status: 'Active',
              CreatedBy: null,
            };
            
            return apiRequest('/patient-lab-tests', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
          });

          await Promise.all(labTestPromises);
          console.log('Added new lab tests:', labTests);
        }
      } catch (err) {
        console.error('Failed to submit lab test operations:', err);
        alert('Failed to submit lab test operations. Please try again.');
        return;
      }
    }

    // Upload prescription documents if any files are selected
    let finalPrescriptionsUrl = prescriptionsUrl;
    let documentUrls: string[] = [...uploadedDocumentUrls];
    
    if (selectedFiles.length > 0) {
      try {
        const patientId = appointmentData?.patientId || appointmentData?.PatientId;
        if (!patientId) {
          throw new Error('Patient ID is required for file upload');
        }
        const newUrls = await uploadFiles(selectedFiles, patientId, 'prescriptions');
        documentUrls = [...documentUrls, ...newUrls];
        // Update prescriptionsUrl with the folder URL or concatenated URLs
        if (newUrls.length > 0) {
          // If backend returns a folder URL, use it; otherwise use comma-separated URLs
          const folderUrl = newUrls[0].substring(0, newUrls[0].lastIndexOf('/'));
          finalPrescriptionsUrl = documentUrls.length > 1 ? documentUrls.join(',') : (folderUrl || documentUrls[0]);
        }
        setUploadedDocumentUrls(documentUrls);
        setSelectedFiles([]); // Clear selected files after upload
      } catch (error) {
        console.error('Error uploading files:', error);
        alert(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return; // Don't proceed with saving if upload fails
      }
    }

    // Update appointment with diagnosis, consultationCharge, followUp, prescriptionsUrl, etc.
    try {
      await patientAppointmentsApi.update({
        id: appointmentId,
        diagnosis: diagnosis || undefined,
        consultationCharge: consultationCharge || undefined,
        followUpDetails: followUp || undefined,
        prescriptionsUrl: finalPrescriptionsUrl || undefined,
        referToAnotherDoctor: referToAnotherDoctor,
        referredDoctorId: referToAnotherDoctor && referredDoctorId ? referredDoctorId : undefined,
        transferToIPDOTICU: transferToIPDOTICU,
        transferTo: transferToIPDOTICU && transferTo ? transferTo : undefined,
        transferDetails: transferToIPDOTICU && transferDetails ? transferDetails : undefined,
        appointmentStatus: 'Completed',
      });
      console.log('Updated appointment with consultation details');
    } catch (err) {
      console.error('Failed to update appointment:', err);
      alert('Failed to update appointment. Please try again.');
      return;
    }

    setShowPrescriptionDialog(true);
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div>
          <h1 className="text-gray-900 mb-2">
            Doctor Consultation - {doctorData ? doctorData.name : 'Loading...'}
          </h1>
          <p className="text-gray-500">
            {doctorData ? doctorData.specialty : 'Loading...'} Department
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Current Patient */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="size-5 text-blue-600" />
              Current Patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentPatient ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="text-lg">{currentPatient.tokenNumber}</Badge>
                      <h3 className="text-gray-900">{currentPatient.name}</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Age</p>
                        <p className="text-gray-900">{currentPatient.age}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Gender</p>
                        <p className="text-gray-900">{currentPatient.gender}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Phone</p>
                        <p className="text-gray-900">{currentPatient.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  {appointmentData && (
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Appointment Date</p>
                          <p className="text-gray-900">
                            {formatDateToDDMMYYYY(
                              appointmentData.appointmentDate || appointmentData.AppointmentDate
                            ) || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Appointment Time</p>
                          <p className="text-gray-900">
                            {appointmentData.appointmentTime || appointmentData.AppointmentTime || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mb-1">Chief Complaint</p>
                  <p className="text-gray-900">{currentPatient.complaint}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No patient currently consulting
              </div>
            )}
          </CardContent>
        </Card>

        {/* Waiting Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-orange-600" />
              Waiting Queue ({queue.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queueLoading ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Loading queue...
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((patient, index) => (
                  <div key={`${patient.tokenNumber}-${index}`} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500">#{index + 1}</span>
                      <Badge variant="outline">{patient.tokenNumber}</Badge>
                    </div>
                    <p className="text-sm text-gray-900">{patient.name}</p>
                    <p className="text-xs text-gray-500">{patient.complaint}</p>
                  </div>
                ))}
                {queue.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No patients waiting
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consultation Form */}
      {currentPatient && (
        <Card>
          <CardHeader>
            <CardTitle>Consultation Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="diagnosis" className="space-y-6">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
                <TabsTrigger value="labtests">Lab Tests</TabsTrigger>
                <TabsTrigger value="medicines">Medicines</TabsTrigger>
                <TabsTrigger value="consultationcharge">Consultation Charge</TabsTrigger>
                <TabsTrigger value="followup">Follow-up & Admission</TabsTrigger>
              </TabsList>

              <TabsContent value="diagnosis" className="space-y-4">
                <div>
                  <Label htmlFor="diagnosis">Diagnosis</Label>
                  <Textarea
                    id="diagnosis"
                    placeholder="Enter diagnosis details..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="labtests" className="space-y-4">
                <div>
                  <Label>Prescribed Lab Tests (from database)</Label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {prescribedLabTests.length > 0 ? (
                      prescribedLabTests.map((labTest, index) => (
                        <Badge key={`prescribed-${labTest.patientLabTestsId}-${index}`} variant="secondary" className="gap-2">
                          {labTest.testName}
                          <button onClick={() => removePrescribedLabTest(labTest.patientLabTestsId, index)}>×</button>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No prescribed lab tests</p>
                    )}
                  </div>
                  <Label>Newly Selected Lab Tests</Label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {labTests.length > 0 ? (
                      labTests.map((labTest, index) => (
                        <Badge key={`new-${labTest.labTestId}-${index}`} variant="outline" className="gap-2">
                          {labTest.testName}
                          <button onClick={() => removeLabTest(index)}>×</button>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No newly selected tests</p>
                    )}
                  </div>
                  <Label>Select Common Tests</Label>
                  {labTestsLoading ? (
                    <p className="text-gray-500 text-sm mb-4">Loading lab tests...</p>
                  ) : availableLabTests.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                      {availableLabTests.map((test) => {
                        const testName = test.TestName || test.testName || test.name || test.Name || '';
                        return (
                          <Button
                            key={test.LabTestsId || test.labTestsId || test.LabTestId || test.labTestId || test.id || testName}
                            variant="outline"
                            size="sm"
                            onClick={() => addLabTest(test)}
                            disabled={labTests.some(lt => lt.testName === testName) || prescribedLabTests.some(lt => lt.testName === testName)}
                          >
                            <TestTube className="size-4 mr-2" />
                            {testName}
                          </Button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm mb-4">No lab tests available</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="medicines" className="space-y-4">
                <div>
                  <Label htmlFor="prescriptionsUrl">Prescriptions URL</Label>
                  <Input
                    id="prescriptionsUrl"
                    type="url"
                    placeholder="Enter prescriptions folder URL"
                    value={prescriptionsUrl}
                    onChange={(e) => setPrescriptionsUrl(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Folder URL - multiple prescriptions should be saved</p>
                </div>
                
                <div>
                  <Label htmlFor="prescriptionsDocuments">Upload Prescription Documents</Label>
                  <Input
                    id="prescriptionsDocuments"
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedFiles(prev => [...prev, ...files]);
                      // Reset the input so the same file can be selected again
                      e.target.value = '';
                    }}
                    className="mt-1"
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600 font-medium">New Files to Upload:</p>
                      {selectedFiles.map((file, index) => {
                        const fileUrl = fileObjectUrls[index];
                        return (
                          <div key={index} className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 p-2 rounded">
                            <div className="flex items-center gap-2">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                title="Click to view file"
                              >
                                <FileText className="size-3" />
                                {file.name}
                              </a>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Remove file - useMemo will handle URL cleanup
                                setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
                  )}
                  {uploadedDocumentUrls.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600 font-medium">Uploaded Documents:</p>
                      {uploadedDocumentUrls.map((url, index) => {
                        const fileName = url.split('/').pop() || `Document ${index + 1}`;
                        return (
                          <div key={index} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {fileName}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Files will be uploaded when you click "Save Consultation"</p>
                </div>
              </TabsContent>

              <TabsContent value="consultationcharge" className="space-y-4">
                <div>
                  <Label htmlFor="consultationCharge">Consultation Charge (₹) *</Label>
                  <Input
                    id="consultationCharge"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 500"
                    value={consultationCharge}
                    onChange={(e) => setConsultationCharge(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="followup" className="space-y-4">
                <div>
                  <Label htmlFor="followup">Follow Up Details</Label>
                  <Textarea
                    id="followup"
                    placeholder="Enter follow up details..."
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <Label className="mb-4 block">Followup option</Label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="referToDoctor"
                        name="followupOption"
                        checked={referToAnotherDoctor && !transferToIPDOTICU}
                        onChange={() => {
                          setReferToAnotherDoctor(true);
                          setTransferToIPDOTICU(false);
                          setTransferTo(undefined);
                          setTransferDetails('');
                        }}
                        className="size-4"
                      />
                      <Label htmlFor="referToDoctor" className="cursor-pointer">Refer to Another Doctor</Label>
                    </div>
                    {referToAnotherDoctor && !transferToIPDOTICU && (
                      <div className="ml-7 space-y-2">
                        <Label htmlFor="doctorSearch">Select Doctor</Label>
                        <div className="relative">
                          <Input
                            id="doctorSearch"
                            type="text"
                            placeholder="Search doctor by name or specialty..."
                            value={doctorSearchTerm}
                            onChange={(e) => {
                              setDoctorSearchTerm(e.target.value);
                              // Clear selection if user edits the search term
                              const selectedDoctor = availableDoctors.find(d => String(d.id) === referredDoctorId);
                              if (selectedDoctor && e.target.value !== selectedDoctor.name) {
                                setReferredDoctorId('');
                              }
                            }}
                            onFocus={() => setDoctorSearchTerm(doctorSearchTerm || '')}
                            autoComplete="off"
                          />
                          {doctorSearchTerm && !referredDoctorId && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              <table className="w-full">
                                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                                  <tr>
                                    <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                                    <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Department</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {availableDoctors
                                    .filter((doctor) => {
                                      if (!doctorSearchTerm) return false;
                                      const searchLower = doctorSearchTerm.toLowerCase();
                                      const doctorName = doctor.name || '';
                                      const specialty = doctor.specialty || '';
                                      // Get department from doctor-details endpoint
                                      const doctorDetails = doctorDetailsMap.get(doctor.id);
                                      const department = doctorDetails?.DepartmentName || 
                                                        doctorDetails?.departmentName || 
                                                        doctorDetails?.DoctorDepartmentName ||
                                                        doctorDetails?.Department?.DepartmentName ||
                                                        doctorDetails?.Department?.name ||
                                                        doctorDetails?.department?.name ||
                                                        doctorDetails?.department ||
                                                        '';
                                      return (
                                        doctorName.toLowerCase().includes(searchLower) ||
                                        specialty.toLowerCase().includes(searchLower) ||
                                        department.toLowerCase().includes(searchLower)
                                      );
                                    })
                                    .map((doctor) => {
                                      const doctorIdStr = String(doctor.id || '');
                                      const isSelected = referredDoctorId === doctorIdStr;
                                      const doctorDetails = doctorDetailsMap.get(doctor.id);
                                      // Extract department from doctor-details endpoint response
                                      const department = doctorDetails?.DepartmentName || 
                                                        doctorDetails?.departmentName || 
                                                        doctorDetails?.DoctorDepartmentName ||
                                                        doctorDetails?.Department?.DepartmentName ||
                                                        doctorDetails?.Department?.name ||
                                                        doctorDetails?.department?.name ||
                                                        doctorDetails?.department ||
                                                        'N/A';
                                      return (
                                        <tr
                                          key={doctor.id}
                                          onClick={() => {
                                            setReferredDoctorId(doctorIdStr);
                                            // Keep the doctor name in the search box
                                            setDoctorSearchTerm(doctor.name || '');
                                          }}
                                          className={`cursor-pointer hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''}`}
                                        >
                                          <td className="py-2 px-3 text-sm">{doctor.name}</td>
                                          <td className="py-2 px-3 text-sm">{department}</td>
                                        </tr>
                                      );
                                    })}
                                  {doctorSearchTerm && availableDoctors.filter((doctor) => {
                                    const searchLower = doctorSearchTerm.toLowerCase();
                                    const doctorName = doctor.name || '';
                                    const specialty = doctor.specialty || '';
                                    const doctorDetails = doctorDetailsMap.get(doctor.id);
                                    // Extract department from doctor-details endpoint response only
                                    const department = doctorDetails?.DepartmentName || 
                                                      doctorDetails?.departmentName || 
                                                      doctorDetails?.DoctorDepartmentName ||
                                                      doctorDetails?.Department?.DepartmentName ||
                                                      doctorDetails?.Department?.name ||
                                                      doctorDetails?.department?.name ||
                                                      doctorDetails?.department ||
                                                      '';
                                    return (
                                      doctorName.toLowerCase().includes(searchLower) ||
                                      specialty.toLowerCase().includes(searchLower) ||
                                      department.toLowerCase().includes(searchLower)
                                    );
                                  }).length === 0 && (
                                    <tr>
                                      <td colSpan={2} className="py-2 px-3 text-sm text-gray-500 text-center">
                                        No doctors found. Try a different search term.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                        {referredDoctorId && (
                          <div className="flex items-center justify-end p-2 bg-blue-50 rounded-md">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReferredDoctorId('');
                                // Keep the doctor name in search box, user can edit it
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              Clear Selection
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="transferToIPDOTICU"
                        name="followupOption"
                        checked={transferToIPDOTICU && !referToAnotherDoctor}
                        onChange={() => {
                          setTransferToIPDOTICU(true);
                          setReferToAnotherDoctor(false);
                          setReferredDoctorId('');
                          setDoctorSearchTerm('');
                          // Don't clear transferTo and transferDetails when selecting this option
                        }}
                        className="size-4"
                      />
                      <Label htmlFor="transferToIPDOTICU" className="cursor-pointer">Transfer to IPD/OT/ICU</Label>
                    </div>
                    {transferToIPDOTICU && !referToAnotherDoctor && (
                      <div className="ml-7 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="transferTo">Transfer Destination</Label>
                          <select
                            id="transferTo"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md"
                            value={transferTo || ''}
                            onChange={(e) => setTransferTo(e.target.value as 'IPD Room Admission' | 'ICU' | 'OT' | undefined)}
                          >
                            <option value="">Select Transfer Destination</option>
                            <option value="IPD Room Admission">IPD</option>
                            <option value="ICU">ICU</option>
                            <option value="OT">OT</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="transferDetails">Transfer Details</Label>
                          <Textarea
                            id="transferDetails"
                            placeholder="Enter transfer details..."
                            value={transferDetails}
                            onChange={(e) => setTransferDetails(e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
              <Button variant="outline" onClick={onBack}>
                Cancel
              </Button>
              <Button onClick={completeConsultation} className="gap-2">
                <FileText className="size-4" />
                Complete Consultation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescription Summary Dialog */}
      <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Consultation Summary</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500">Patient</p>
              <p className="text-gray-900">{currentPatient?.name} ({currentPatient?.tokenNumber})</p>
            </div>

            {diagnosis && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Diagnosis</p>
                <p className="text-gray-900">{diagnosis}</p>
              </div>
            )}

            {labTests.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Lab Tests Prescribed</p>
                <div className="flex flex-wrap gap-2">
                  {labTests.map((labTest, index) => (
                    <Badge key={`${labTest.labTestId}-${index}`} variant="secondary">{labTest.testName}</Badge>
                  ))}
                </div>
              </div>
            )}

            {followUp && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Follow Up Details</p>
                <p className="text-gray-900">{followUp}</p>
              </div>
            )}

          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>
              Edit
            </Button>
            <Button onClick={() => {
              setShowPrescriptionDialog(false);
              
              // Find the next waiting patient
              if (waitingAppointments.length > 0) {
                const nextAppointment = waitingAppointments[0]; // First in queue (already sorted)
                if (nextAppointment && nextAppointment.id) {
                  // Navigate to the next patient's consultation
                  navigate(`/consultation/${nextAppointment.id}`);
                } else {
                  // No more patients waiting, go back to consultation list
                  alert('Consultation completed! No more patients waiting.');
                  onBack();
                }
              } else {
                // No more patients waiting, go back to consultation list
                alert('Consultation completed! No more patients waiting.');
                onBack();
              }
            }}>
              Confirm & Call Next Patient
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

