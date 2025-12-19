// Manage Consultation Component - Full page matching the design
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ArrowLeft, UserCheck, FileText, TestTube, Pill, BedDouble, Clock } from 'lucide-react';
import { apiRequest } from '../api/base';
import { patientsApi } from '../api/patients';
import { patientAppointmentsApi } from '../api/patientAppointments';

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
  const [currentPatient, setCurrentPatient] = useState<PatientData | null>(null);
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  
  // Consultation form states
  const [diagnosis, setDiagnosis] = useState('');
  const [labTests, setLabTests] = useState<Array<{ testName: string; labTestId: number; patientLabTestsId?: number }>>([]);
  const [prescribedLabTests, setPrescribedLabTests] = useState<Array<{ testName: string; labTestId: number; patientLabTestsId: number }>>([]);
  const [labTestsToDelete, setLabTestsToDelete] = useState<number[]>([]); // Track prescribed tests to delete on submission
  const [medicines, setMedicines] = useState<{ name: string; dosage: string; duration: string }[]>([]);
  const [followUp, setFollowUp] = useState('');
  const [admitAsIPD, setAdmitAsIPD] = useState(false);
  const [roomType, setRoomType] = useState('');
  const [newLabTest, setNewLabTest] = useState('');
  const [newMedicine, setNewMedicine] = useState({ name: '', dosage: '', duration: '' });
  
  // Available lab tests from API (store full objects to get LabTestId)
  const [availableLabTests, setAvailableLabTests] = useState<any[]>([]);
  const [labTestsLoading, setLabTestsLoading] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);

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
        }
      } catch (err) {
        console.error('Failed to fetch appointment:', err);
      }
    };
    
    fetchAppointment();
  }, [appointmentId]);

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
        const appointments = await patientAppointmentsApi.getAll({
          doctorId: Number(doctorId),
          appointmentStatus: 'Waiting',
        });

        // Exclude the current appointment and sort by appointment date and time (first-come-first-serve)
        const waitingAppointments = appointments
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
          });

        // Fetch patient details for each appointment
        const queuePatients: QueuePatient[] = await Promise.all(
          waitingAppointments.map(async (appointment) => {
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

  const addMedicine = () => {
    if (newMedicine.name && newMedicine.dosage && newMedicine.duration) {
      setMedicines([...medicines, newMedicine]);
      setNewMedicine({ name: '', dosage: '', duration: '' });
    }
  };

  const completeConsultation = async () => {
    if (!diagnosis) {
      alert('Please enter diagnosis');
      return;
    }

    if (admitAsIPD && !roomType) {
      alert('Please select room type for IPD admission');
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
          <h1 className="text-gray-900 mb-2">Doctor Consultation - Dr. Sarah Johnson</h1>
          <p className="text-gray-500">Cardiology Department</p>
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
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
                <TabsTrigger value="labtests">Lab Tests</TabsTrigger>
                <TabsTrigger value="medicines">Medicines</TabsTrigger>
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
                  <div>
                    <Label htmlFor="customTest">Or Add Custom Test</Label>
                    <div className="flex gap-2">
                      <Input
                        id="customTest"
                        placeholder="Enter test name"
                        value={newLabTest}
                        onChange={(e) => setNewLabTest(e.target.value)}
                      />
                      <Button onClick={async () => {
                        // For custom tests, we need to create them differently
                        // For now, just add to local state (you may want to handle this differently)
                        if (newLabTest && !labTests.some(lt => lt.testName === newLabTest)) {
                          // Note: Custom tests added this way won't have a PatientLabTestsId
                          // You may want to prevent this or handle it differently
                          alert('Custom test names need to be selected from the available tests above.');
                          setNewLabTest('');
                        }
                      }}>Add</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="medicines" className="space-y-4">
                <div>
                  <Label>Prescribed Medicines</Label>
                  {medicines.length > 0 && (
                    <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-4 text-sm text-gray-700">Medicine</th>
                            <th className="text-left py-2 px-4 text-sm text-gray-700">Dosage</th>
                            <th className="text-left py-2 px-4 text-sm text-gray-700">Duration</th>
                            <th className="text-left py-2 px-4 text-sm text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medicines.map((med, index) => (
                            <tr key={index} className="border-t border-gray-100">
                              <td className="py-2 px-4 text-sm">{med.name}</td>
                              <td className="py-2 px-4 text-sm">{med.dosage}</td>
                              <td className="py-2 px-4 text-sm">{med.duration}</td>
                              <td className="py-2 px-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setMedicines(medicines.filter((_, i) => i !== index))}
                                >
                                  Remove
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label htmlFor="medName">Medicine Name</Label>
                      <Input
                        id="medName"
                        placeholder="Medicine name"
                        value={newMedicine.name}
                        onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dosage">Dosage</Label>
                      <Input
                        id="dosage"
                        placeholder="e.g., 1-0-1"
                        value={newMedicine.dosage}
                        onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        placeholder="e.g., 7 days"
                        value={newMedicine.duration}
                        onChange={(e) => setNewMedicine({ ...newMedicine, duration: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={addMedicine}>
                    <Pill className="size-4 mr-2" />
                    Add Medicine
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="followup" className="space-y-4">
                <div>
                  <Label htmlFor="followup">Follow-up Instructions</Label>
                  <Textarea
                    id="followup"
                    placeholder="Enter follow-up instructions (e.g., Next visit after 1 week)"
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="checkbox"
                      id="admitIPD"
                      checked={admitAsIPD}
                      onChange={(e) => setAdmitAsIPD(e.target.checked)}
                      className="size-4"
                    />
                    <Label htmlFor="admitIPD" className="text-lg flex items-center gap-2">
                      <BedDouble className="size-5 text-purple-600" />
                      Admit as In-Patient (IPD)
                    </Label>
                  </div>

                  {admitAsIPD && (
                    <div className="ml-7 space-y-3">
                      <Label>Select Room Type</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <button
                          onClick={() => setRoomType('Regular Ward')}
                          className={`p-4 border-2 rounded-lg text-center transition-colors ${
                            roomType === 'Regular Ward'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="text-gray-900">Regular Ward</p>
                          <p className="text-sm text-gray-500">₹1,000/day</p>
                        </button>
                        <button
                          onClick={() => setRoomType('Special Shared Room')}
                          className={`p-4 border-2 rounded-lg text-center transition-colors ${
                            roomType === 'Special Shared Room'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="text-gray-900">Special Shared</p>
                          <p className="text-sm text-gray-500">₹2,500/day</p>
                        </button>
                        <button
                          onClick={() => setRoomType('Special Room')}
                          className={`p-4 border-2 rounded-lg text-center transition-colors ${
                            roomType === 'Special Room'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="text-gray-900">Special Room</p>
                          <p className="text-sm text-gray-500">₹5,000/day</p>
                        </button>
                      </div>
                    </div>
                  )}
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

            {medicines.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Medicines Prescribed</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-2 px-4">Medicine</th>
                        <th className="text-left py-2 px-4">Dosage</th>
                        <th className="text-left py-2 px-4">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.map((med, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="py-2 px-4">{med.name}</td>
                          <td className="py-2 px-4">{med.dosage}</td>
                          <td className="py-2 px-4">{med.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {followUp && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Follow-up Instructions</p>
                <p className="text-gray-900">{followUp}</p>
              </div>
            )}

            {admitAsIPD && (
              <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <p className="text-purple-900">✓ Patient will be admitted as In-Patient</p>
                <p className="text-sm text-purple-700">Room Type: {roomType}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>
              Edit
            </Button>
            <Button onClick={() => {
              alert('Consultation completed!');
              setShowPrescriptionDialog(false);
            }}>
              Confirm & Call Next Patient
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

