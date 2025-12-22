import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ResizableDialogContent } from './ResizableDialogContent';
import { Badge } from './ui/badge';
import { TestTube, Search, FileText, Clock, CheckCircle, AlertCircle, Download, Edit, Upload, FolderOpen, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiRequest } from '../api/base';
import { PatientLabTest } from '../api/admissions';
import { patientsApi } from '../api/patients';
import { labTestsApi } from '../api/labTests';
import { doctorsApi } from '../api/doctors';
import { patientAppointmentsApi } from '../api/patientAppointments';
import { admissionsApi } from '../api/admissions';
import { emergencyBedSlotsApi } from '../api/emergencyBedSlots';
import { LabTest as LabTestType, Doctor } from '../types';
import { Textarea } from './ui/textarea';
import { DialogFooter } from './ui/dialog';
import { Switch } from './ui/switch';
import { convertToIST } from '../utils/timeUtils';

interface LabTest {
  id: number;
  testId: string;
  patientName: string;
  patientId: string;
  age: number;
  gender: string;
  testName: string;
  category: 'Blood Test' | 'Urine Test' | 'Imaging' | 'Pathology' | 'Radiology' | 'Other';
  orderedBy: string;
  orderedDate: string;
  orderedTime: string;
  priority: 'Routine' | 'Urgent' | 'Emergency';
  status: 'Pending' | 'Sample Collected' | 'In Progress' | 'Completed' | 'Reported';
  sampleCollectedBy?: string;
  technician?: string;
  result?: string;
  reportedDate?: string;
  reportedTime?: string;
}

const mockLabTests: LabTest[] = [
  ];

// Doctor-wise daily report data
const doctorWiseDailyTests = [
 ];

// Weekly trend data
const weeklyTestData = [
 ];

interface TestStatusCounts {
  pending?: number;
  inProgress?: number;
  in_progress?: number;
  completed?: number;
  sampleCollected?: number;
  sample_collected?: number;
  reported?: number;
  total?: number;
  [key: string]: number | undefined; // Allow for other status variations
}

export function Laboratory() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [showReportsDialog, setShowReportsDialog] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState<'daily' | 'weekly'>('daily');
  const [testStatusCounts, setTestStatusCounts] = useState<TestStatusCounts>({});
  const [countsLoading, setCountsLoading] = useState(false);
  const [countsError, setCountsError] = useState<string | null>(null);
  const [testsLoading, setTestsLoading] = useState(true);
  const [testsError, setTestsError] = useState<string | null>(null);
  
  // Daily Report state
  const [doctorWiseDailyTests, setDoctorWiseDailyTests] = useState<Array<{
    doctor: string;
    total: number;
    pending: number;
    completed: number;
  }>>([]);
  const [dailySummary, setDailySummary] = useState<{
    totalTests: number;
    pending: number;
    completed: number;
    avgTAT: number;
    avgTATFormatted: string;
  }>({
    totalTests: 0,
    pending: 0,
    completed: 0,
    avgTAT: 0,
    avgTATFormatted: 'N/A',
  });
  const [dailyReportLoading, setDailyReportLoading] = useState(false);
  const [dailyReportError, setDailyReportError] = useState<string | null>(null);
  
  // Weekly Report state
  const [weeklyTestData, setWeeklyTestData] = useState<Array<{
    date: string;
    tests: number;
    completed: number;
  }>>([]);
  const [weeklySummary, setWeeklySummary] = useState<{
    totalTests: number;
    completed: number;
    dailyAverage: number;
    completionRate: number;
  }>({
    totalTests: 0,
    completed: 0,
    dailyAverage: 0,
    completionRate: 0,
  });
  const [weekStartDate, setWeekStartDate] = useState<string>('');
  const [weekEndDate, setWeekEndDate] = useState<string>('');
  const [weeklyReportLoading, setWeeklyReportLoading] = useState(false);
  const [weeklyReportError, setWeeklyReportError] = useState<string | null>(null);
  
  // View and Edit PatientLabTest state
  const [viewingPatientLabTest, setViewingPatientLabTest] = useState<any>(null);
  const [isViewPatientLabTestDialogOpen, setIsViewPatientLabTestDialogOpen] = useState(false);
  const [editingPatientLabTest, setEditingPatientLabTest] = useState<any>(null);
  const [isEditPatientLabTestDialogOpen, setIsEditPatientLabTestDialogOpen] = useState(false);
  const [editPatientLabTestFormData, setEditPatientLabTestFormData] = useState<any>(null);
  const [editPatientLabTestSubmitting, setEditPatientLabTestSubmitting] = useState(false);
  const [editPatientLabTestSubmitError, setEditPatientLabTestSubmitError] = useState<string | null>(null);
  // File upload state for Edit ReportsUrl (similar to OT Documents)
  const [editSelectedFiles, setEditSelectedFiles] = useState<File[]>([]);
  const [editUploadedDocumentUrls, setEditUploadedDocumentUrls] = useState<string[]>([]);

  // New Lab Order Dialog State
  const [newLabOrderFormData, setNewLabOrderFormData] = useState({
    patientId: '',
    labTestId: '',
    patientType: '' as 'IPD' | 'OPD' | 'Emergency' | 'Direct' | '',
    roomAdmissionId: '',
    appointmentId: '',
    emergencyBedSlotId: '',
    priority: 'Normal' as 'Normal' | 'Urgent',
    testStatus: 'Pending' as 'Pending' | 'InProgress' | 'Completed',
    labTestDone: 'No' as 'Yes' | 'No',
    testDoneDate: '',
    reportsUrl: '',
    orderedByDoctorId: ''
  });
  const [newLabOrderSubmitting, setNewLabOrderSubmitting] = useState(false);
  const [newLabOrderSubmitError, setNewLabOrderSubmitError] = useState<string | null>(null);
  
  // Searchable dropdowns state
  const [availablePatients, setAvailablePatients] = useState<any[]>([]);
  const [availableLabTests, setAvailableLabTests] = useState<LabTestType[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [availableAppointments, setAvailableAppointments] = useState<any[]>([]);
  const [availableAdmissions, setAvailableAdmissions] = useState<any[]>([]);
  const [availableEmergencyBedSlots, setAvailableEmergencyBedSlots] = useState<any[]>([]);
  
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [labTestSearchTerm, setLabTestSearchTerm] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [showPatientList, setShowPatientList] = useState(false);
  const [showLabTestList, setShowLabTestList] = useState(false);
  const [showDoctorList, setShowDoctorList] = useState(false);
  
  // File upload state for ReportsUrl (multiple files like OT Documents)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Fetch test status counts from API
  useEffect(() => {
    const fetchTestStatusCounts = async () => {
      try {
        setCountsLoading(true);
        setCountsError(null);
        console.log('Fetching test status counts from /patient-lab-tests/count/test-status');
        const response = await apiRequest<any>('/patient-lab-tests/count/test-status');
        console.log('Test status counts API response:', JSON.stringify(response, null, 2));
        
        // Handle different response structures
        let countsData: any = {};
        
        if (response && typeof response === 'object') {
          // Check if response has a 'counts' object (new API structure)
          if (response.counts && typeof response.counts === 'object') {
            countsData = response.counts;
          }
          // Check if response has a 'data' object
          else if (response.data && typeof response.data === 'object') {
            // Check if data has a 'counts' object
            if (response.data.counts && typeof response.data.counts === 'object') {
              countsData = response.data.counts;
            } else {
              countsData = response.data;
            }
          }
          // Direct object response
          else {
            countsData = response;
          }
        }
        
        // Map the API response fields to normalized counts
        // API response structure: { counts: { TotalActiveCount, PendingCount, InProgressCount, CompletedCount, NullStatusCount } }
        const normalizedCounts: TestStatusCounts = {
          pending: countsData.PendingCount || countsData.pendingCount || countsData.pending || countsData.Pending || 0,
          inProgress: countsData.InProgressCount || countsData.inProgressCount || countsData.inProgress || countsData.InProgress || 
                     countsData.in_progress || countsData.In_Progress || 0,
          sampleCollected: countsData.SampleCollectedCount || countsData.sampleCollectedCount || 
                          countsData.sampleCollected || countsData.SampleCollected || 
                          countsData.sample_collected || countsData.Sample_Collected || 0,
          completed: countsData.CompletedCount || countsData.completedCount || countsData.completed || countsData.Completed || 0,
          reported: countsData.ReportedCount || countsData.reportedCount || countsData.reported || countsData.Reported || 0,
          total: countsData.TotalActiveCount || countsData.totalActiveCount || countsData.total || countsData.Total || 
                countsData.totalCount || countsData.TotalCount || 0
        };
        
        console.log('Normalized test status counts:', normalizedCounts);
        setTestStatusCounts(normalizedCounts);
      } catch (err) {
        console.error('Error fetching test status counts:', err);
        setCountsError(err instanceof Error ? err.message : 'Failed to load test status counts');
        // Fallback to calculated counts from loaded tests
        setTestStatusCounts({
          pending: tests.filter(t => t.status === 'Pending').length,
          inProgress: tests.filter(t => t.status === 'In Progress' || t.status === 'Sample Collected').length,
          completed: tests.filter(t => t.status === 'Completed' || t.status === 'Reported').length,
          total: tests.length
        });
      } finally {
        setCountsLoading(false);
      }
    };

    fetchTestStatusCounts();
  }, [tests]); // Include tests in dependency array to update counts when tests change

  // Fetch patient lab tests from API
  const fetchPatientLabTests = async () => {
    try {
      setTestsLoading(true);
      setTestsError(null);
      console.log('Fetching patient lab tests from /patient-lab-tests/with-details');
      const response = await apiRequest<any>('/patient-lab-tests/with-details');
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
        }
      } else if (response?.patientLabTests && Array.isArray(response.patientLabTests)) {
        labTestsData = response.patientLabTests;
      } else if (response?.labTests && Array.isArray(response.labTests)) {
        labTestsData = response.labTests;
      }
      
      if (!Array.isArray(labTestsData) || labTestsData.length === 0) {
        console.warn('Patient lab tests response is not an array or is empty:', response);
        setTests([]);
        return;
      }
      
      // Helper function to extract field with multiple variations and nested objects
      const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
        if (!data) return defaultValue;
        
        for (const field of fieldVariations) {
          // Handle nested objects (e.g., Patient.PatientName, LabTest.TestName)
          if (field.includes('.')) {
            const parts = field.split('.');
            let value = data;
            for (const part of parts) {
              if (value && typeof value === 'object') {
                value = value[part];
              } else {
                value = undefined;
                break;
              }
            }
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          } else {
            // Direct field access
            const value = data[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
        }
        
        // Try nested object access (e.g., Patient.PatientName, CreatedBy.CreatedByName)
        for (const field of fieldVariations) {
          if (data.Patient && data.Patient[field]) {
            const value = data.Patient[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          if (data.LabTest && data.LabTest[field]) {
            const value = data.LabTest[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          if (data.CreatedBy && data.CreatedBy[field]) {
            const value = data.CreatedBy[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          if (data.patient && data.patient[field]) {
            const value = data.patient[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          if (data.labTest && data.labTest[field]) {
            const value = data.labTest[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          if (data.createdBy && data.createdBy[field]) {
            const value = data.createdBy[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
        }
        
        return defaultValue;
      };
      
      
      // Map API response to LabTest interface
      const mappedTests: LabTest[] = labTestsData.map((labTest: any, index: number) => {
        const patientLabTestsId = extractField(labTest, [
          'patientLabTestsId', 'PatientLabTestsId', 'patient_lab_tests_id', 'Patient_Lab_Tests_Id',
          'patientLabTestId', 'PatientLabTestId', 'id', 'Id', 'ID'
        ], index + 1);
        
        const testId = extractField(labTest, [
          'displayTestId', 'DisplayTestId', 'display_test_id', 'Display_Test_Id',
          'testId', 'TestId', 'test_id', 'Test_ID',
          'patientLabTestsId', 'PatientLabTestsId', 'id', 'Id', 'ID'
        ], `LAB-${patientLabTestsId}`);
        
        const patientName = extractField(labTest, [
          'patientName', 'PatientName', 'patient_name', 'Patient_Name',
          'patientFullName', 'PatientFullName', 'Patient.PatientName', 'Patient.patientName',
          'Patient.Name', 'Patient.name', 'name', 'Name'
        ], 'Unknown Patient');
        
        const patientId = extractField(labTest, [
          'patientId', 'PatientId', 'patient_id', 'Patient_ID',
          'patientID', 'PatientID', 'Patient.PatientId', 'Patient.patientId',
          'Patient.Id', 'Patient.id'
        ], 'N/A');
        
        const patientNo = extractField(labTest, [
          'patientNo', 'PatientNo', 'patient_no', 'Patient_No',
          'patientNumber', 'PatientNumber', 'patient_number', 'Patient_Number',
          'Patient.PatientNo', 'Patient.patientNo', 'Patient.PatientNumber', 'Patient.patientNumber'
        ], undefined);
        
        const testName = extractField(labTest, [
          'testName', 'TestName', 'test_name', 'Test_Name',
          'labTestName', 'LabTestName', 'lab_test_name', 'Lab_Test_Name',
          'LabTest.TestName', 'LabTest.testName', 'LabTest.Name', 'LabTest.name',
          'name', 'Name'
        ], 'Unknown Test');
        
        const category = extractField(labTest, [
          'testCategory', 'TestCategory', 'test_category', 'Test_Category',
          'category', 'Category', 'labTestCategory', 'LabTestCategory',
          'LabTest.TestCategory', 'LabTest.testCategory', 'LabTest.Category', 'LabTest.category'
        ], 'Other');
        
        const orderedBy = extractField(labTest, [
          'orderedBy', 'OrderedBy', 'ordered_by', 'Ordered_By',
          'doctorName', 'DoctorName', 'doctor_name', 'Doctor_Name'
        ], 'N/A');
        
        const orderedDate = extractField(labTest, [
          'orderedDate', 'OrderedDate', 'ordered_date', 'Ordered_Date',
          'createdDate', 'CreatedDate', 'created_date', 'Created_Date',
          'date', 'Date'
        ], new Date().toISOString().split('T')[0]);
        
        const orderedTime = extractField(labTest, [
          'orderedTime', 'OrderedTime', 'ordered_time', 'Ordered_Time',
          'createdTime', 'CreatedTime', 'created_time', 'Created_Time',
          'time', 'Time'
        ], new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
        
        const priority = extractField(labTest, [
          'priority', 'Priority', 'testPriority', 'TestPriority'
        ], 'Routine');
        
        const testStatus = extractField(labTest, [
          'testStatus', 'TestStatus', 'test_status', 'Test_Status',
          'status', 'Status'
        ], 'Pending');
        
        // Map testStatus to LabTest status format
        let status: 'Pending' | 'Sample Collected' | 'In Progress' | 'Completed' | 'Reported' = 'Pending';
        if (testStatus) {
          const statusLower = String(testStatus).toLowerCase();
          if (statusLower === 'pending') {
            status = 'Pending';
          } else if (statusLower === 'sample collected' || statusLower === 'samplecollected') {
            status = 'Sample Collected';
          } else if (statusLower === 'in progress' || statusLower === 'inprogress' || statusLower === 'in_progress') {
            status = 'In Progress';
          } else if (statusLower === 'completed' || statusLower === 'done') {
            status = 'Completed';
          } else if (statusLower === 'reported') {
            status = 'Reported';
          }
        }
        
        const age = extractField(labTest, [
          'age', 'Age', 'patientAge', 'PatientAge'
        ], 0);
        
        const gender = extractField(labTest, [
          'gender', 'Gender', 'patientGender', 'PatientGender',
          'sex', 'Sex'
        ], 'N/A');
        
        const sampleCollectedBy = extractField(labTest, [
          'sampleCollectedBy', 'SampleCollectedBy', 'sample_collected_by', 'Sample_Collected_By',
          'collectedBy', 'CollectedBy', 'collected_by', 'Collected_By'
        ], undefined);
        
        const technician = extractField(labTest, [
          'technician', 'Technician', 'assignedTechnician', 'AssignedTechnician',
          'tech', 'Tech'
        ], undefined);
        
        const result = extractField(labTest, [
          'result', 'Result', 'testResult', 'TestResult',
          'report', 'Report'
        ], undefined);
        
        const reportedDate = extractField(labTest, [
          'reportedDate', 'ReportedDate', 'reported_date', 'Reported_Date',
          'resultDate', 'ResultDate', 'result_date', 'Result_Date'
        ], undefined);
        
        const reportedTime = extractField(labTest, [
          'reportedTime', 'ReportedTime', 'reported_time', 'Reported_Time',
          'resultTime', 'ResultTime', 'result_time', 'Result_Time'
        ], undefined);
        
        // Extract all PatientLabTest fields
        const patientType = extractField(labTest, [
          'patientType', 'PatientType', 'patient_type', 'Patient_Type'
        ], undefined);
        
        const labTestId = extractField(labTest, [
          'labTestId', 'LabTestId', 'lab_test_id', 'Lab_Test_Id',
          'LabTest.LabTestId', 'LabTest.labTestId', 'LabTest.Id', 'LabTest.id'
        ], undefined);
        
        const displayTestId = extractField(labTest, [
          'displayTestId', 'DisplayTestId', 'display_test_id', 'Display_Test_Id',
          'LabTest.DisplayTestId', 'LabTest.displayTestId', 'LabTest.DisplayTestID', 'LabTest.displayTestID'
        ], testId);
        
        const testCategory = extractField(labTest, [
          'testCategory', 'TestCategory', 'test_category', 'Test_Category',
          'category', 'Category', 'labTestCategory', 'LabTestCategory',
          'LabTest.TestCategory', 'LabTest.testCategory', 'LabTest.Category', 'LabTest.category'
        ], category);
        
        const roomAdmissionId = extractField(labTest, [
          'roomAdmissionId', 'RoomAdmissionId', 'room_admission_id', 'Room_Admission_Id'
        ], undefined);
        
        const emergencyBedSlotId = extractField(labTest, [
          'emergencyBedSlotId', 'EmergencyBedSlotId', 'emergency_bed_slot_id', 'Emergency_Bed_Slot_Id'
        ], undefined);
        
        const billId = extractField(labTest, [
          'billId', 'BillId', 'bill_id', 'Bill_Id'
        ], undefined);
        
        const labTestDone = extractField(labTest, [
          'labTestDone', 'LabTestDone', 'lab_test_done', 'Lab_Test_Done'
        ], false);
        
        const reportsUrl = extractField(labTest, [
          'reportsUrl', 'ReportsUrl', 'reports_url', 'Reports_Url'
        ], undefined);
        
        const testDoneDateTime = extractField(labTest, [
          'testDoneDateTime', 'TestDoneDateTime', 'TestDoneDateTime', 'test_done_date_time', 'Test_Done_Date_Time'
        ], undefined);
        
        const statusValue = extractField(labTest, [
          'status', 'Status'
        ], status);
        
        const charges = extractField(labTest, [
          'charges', 'Charges', 'testCharges', 'TestCharges'
        ], 0);
        
        const createdBy = extractField(labTest, [
          'createdBy', 'CreatedBy', 'created_by', 'Created_By'
        ], undefined);
        
        const createdByName = extractField(labTest, [
          'createdByName', 'CreatedByName', 'created_by_name', 'Created_By_Name',
          'CreatedBy.CreatedByName', 'CreatedBy.createdByName', 'createdBy.createdByName', 'createdBy.CreatedByName',
          'CreatedBy.Name', 'CreatedBy.name', 'createdBy.name', 'createdBy.Name',
          'CreatedBy.FullName', 'CreatedBy.fullName', 'createdBy.fullName', 'createdBy.FullName',
          'CreatedBy.UserName', 'CreatedBy.userName', 'createdBy.userName', 'CreatedBy.UserName'
        ], undefined);
        
        const createdDate = extractField(labTest, [
          'createdDate', 'CreatedDate', 'created_date', 'Created_Date'
        ], orderedDate);
        
        return {
          id: Number(patientLabTestsId) || index + 1,
          patientLabTestsId: Number(patientLabTestsId) || index + 1,
          testId: String(testId),
          patientName: String(patientName),
          patientId: String(patientId),
          patientNo: patientNo ? String(patientNo) : undefined,
          age: Number(age) || 0,
          gender: String(gender),
          testName: String(testName),
          category: (testCategory as 'Blood Test' | 'Urine Test' | 'Imaging' | 'Pathology' | 'Radiology' | 'Other') || 'Other',
          testCategory: String(testCategory),
          orderedBy: String(orderedBy),
          orderedDate: String(orderedDate),
          orderedTime: String(orderedTime),
          priority: (priority as 'Routine' | 'Urgent' | 'Emergency') || 'Routine',
          status: status,
          sampleCollectedBy: sampleCollectedBy ? String(sampleCollectedBy) : undefined,
          technician: technician ? String(technician) : undefined,
          result: result ? String(result) : undefined,
          reportedDate: reportedDate ? String(reportedDate) : undefined,
          reportedTime: reportedTime ? String(reportedTime) : undefined,
          // Additional PatientLabTest fields
          patientType: patientType ? String(patientType) : undefined,
          labTestId: labTestId ? Number(labTestId) : undefined,
          displayTestId: String(displayTestId),
          roomAdmissionId: roomAdmissionId ? Number(roomAdmissionId) : undefined,
          emergencyBedSlotId: emergencyBedSlotId ? (typeof emergencyBedSlotId === 'number' ? emergencyBedSlotId : String(emergencyBedSlotId)) : undefined,
          billId: billId ? (typeof billId === 'number' ? billId : String(billId)) : undefined,
          labTestDone: labTestDone === true || labTestDone === 'Yes' || labTestDone === 'yes' ? 'Yes' : 'No',
          reportsUrl: reportsUrl ? String(reportsUrl) : undefined,
          testStatus: String(testStatus),
          testDoneDateTime: testDoneDateTime ? String(testDoneDateTime) : undefined,
          statusValue: String(statusValue),
          charges: Number(charges) || 0,
          createdBy: createdBy ? (typeof createdBy === 'number' ? createdBy : String(createdBy)) : undefined,
          createdByName: createdByName ? String(createdByName) : undefined,
          createdDate: createdDate ? String(createdDate) : undefined
        } as any;
      });
      
      console.log('Mapped patient lab tests:', mappedTests);
      console.log('First mapped test:', mappedTests.length > 0 ? JSON.stringify(mappedTests[0], null, 2) : 'No mapped tests');
      setTests(mappedTests);
    } catch (err) {
      console.error('Error fetching patient lab tests:', err);
      setTestsError(err instanceof Error ? err.message : 'Failed to load patient lab tests');
      // Fallback to empty array or mock data
      setTests([]);
    } finally {
      setTestsLoading(false);
    }
  };

  // Fetch patient lab tests on mount
  useEffect(() => {
    fetchPatientLabTests();
  }, []); // Empty dependency array - fetch once on mount

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch lab test daily report
  const fetchLabTestDailyReport = async () => {
    try {
      setDailyReportLoading(true);
      setDailyReportError(null);
      
      const today = getTodayDate();
      console.log('Fetching lab test daily report for today:', today);
      
      const params = new URLSearchParams();
      params.append('date', today);
      
      const response = await apiRequest<any>(`/reports/lab-test-daily-report?${params.toString()}`);
      console.log('Lab test daily report API response (RAW):', JSON.stringify(response, null, 2));
      console.log('Response type:', typeof response);
      console.log('Response keys:', response && typeof response === 'object' ? Object.keys(response) : 'N/A');
      
      // Handle different response structures
      let reportData: any = null;
      
      if (response && typeof response === 'object') {
        // Check if response is directly an array
        if (Array.isArray(response)) {
          reportData = { doctorWiseTests: response };
          console.log('Response is directly an array, wrapping in doctorWiseTests');
        } else if (response.data && typeof response.data === 'object') {
          reportData = response.data;
          console.log('Using response.data');
        } else if (response.report && typeof response.report === 'object') {
          reportData = response.report;
          console.log('Using response.report');
        } else if (response.result && typeof response.result === 'object') {
          reportData = response.result;
          console.log('Using response.result');
        } else {
          reportData = response;
          console.log('Using response directly');
        }
      }
      
      if (!reportData) {
        console.warn('Lab test daily report response is empty:', response);
        setDoctorWiseDailyTests([]);
        setDailySummary({
          totalTests: 0,
          pending: 0,
          completed: 0,
          avgTAT: 0,
          avgTATFormatted: 'N/A',
        });
        return;
      }
      
      console.log('Report data structure:', {
        keys: Object.keys(reportData),
        hasDoctorWiseTests: !!reportData.doctorWiseTests,
        hasDoctorWiseDailyTests: !!reportData.doctorWiseDailyTests,
        hasDoctors: !!reportData.doctors,
        isArray: Array.isArray(reportData)
      });
      
      // Helper function to extract field with multiple variations
      const extractField = (data: any, fieldVariations: string[], defaultValue: any = 0) => {
        if (!data || typeof data !== 'object') return defaultValue;
        
        const checkNested = (obj: any, field: string, depth: number = 0): any => {
          if (depth > 3 || !obj || typeof obj !== 'object') return undefined;
          
          // Check direct property
          if (obj[field] !== undefined && obj[field] !== null && obj[field] !== '') {
            return obj[field];
          }
          
          // Check case-insensitive property
          const keys = Object.keys(obj);
          const lowerField = field.toLowerCase();
          const caseInsensitiveMatch = keys.find(k => k.toLowerCase() === lowerField);
          if (caseInsensitiveMatch) {
            const value = obj[caseInsensitiveMatch];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          
          // Check partial match
          const partialMatch = keys.find(k => k.toLowerCase().includes(lowerField) || lowerField.includes(k.toLowerCase()));
          if (partialMatch) {
            const value = obj[partialMatch];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          
          // Check nested objects
          for (const key in obj) {
            if (obj.hasOwnProperty(key) && typeof obj[key] === 'object' && obj[key] !== null) {
              const nestedValue = checkNested(obj[key], field, depth + 1);
              if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
                return nestedValue;
              }
            }
          }
          return undefined;
        };
        
        for (const field of fieldVariations) {
          const value = checkNested(data, field);
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
        return defaultValue;
      };
      
      const safeNumber = (value: any): number => {
        if (value === null || value === undefined || value === '') return 0;
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(num) ? 0 : num;
      };
      
      // Extract doctor-wise tests - check multiple possible locations
      let doctorTests: any[] = [];
      
      console.log('Report data structure:', Object.keys(reportData));
      
      // Try known field names first
      if (reportData.doctorWiseTests && Array.isArray(reportData.doctorWiseTests)) {
        doctorTests = reportData.doctorWiseTests;
        console.log('Found doctorWiseTests array:', doctorTests.length);
      } else if (reportData.doctorWiseDailyTests && Array.isArray(reportData.doctorWiseDailyTests)) {
        doctorTests = reportData.doctorWiseDailyTests;
        console.log('Found doctorWiseDailyTests array:', doctorTests.length);
      } else if (reportData.doctors && Array.isArray(reportData.doctors)) {
        doctorTests = reportData.doctors;
        console.log('Found doctors array:', doctorTests.length);
      } else if (reportData.doctorStatistics && Array.isArray(reportData.doctorStatistics)) {
        doctorTests = reportData.doctorStatistics;
        console.log('Found doctorStatistics array:', doctorTests.length);
      } else if (reportData.data && Array.isArray(reportData.data)) {
        doctorTests = reportData.data;
        console.log('Found data array:', doctorTests.length);
      } else if (Array.isArray(reportData)) {
        doctorTests = reportData;
        console.log('Report data is directly an array:', doctorTests.length);
      } else {
        // Fallback: search for any array in the response that might contain doctor data
        console.log('Searching for arrays in response...');
        for (const key in reportData) {
          if (Array.isArray(reportData[key]) && reportData[key].length > 0) {
            const firstItem = reportData[key][0];
            // Check if the array items look like doctor data (have doctor-related fields)
            if (firstItem && typeof firstItem === 'object') {
              const itemKeys = Object.keys(firstItem).map(k => k.toLowerCase());
              const hasDoctorField = itemKeys.some(k => k.includes('doctor') || k.includes('physician') || k.includes('name'));
              const hasTestField = itemKeys.some(k => k.includes('test') || k.includes('total') || k.includes('count') || k.includes('pending') || k.includes('completed'));
              
              if (hasDoctorField || hasTestField) {
                doctorTests = reportData[key];
                console.log(`Found potential doctor data array in key "${key}":`, doctorTests.length);
                break;
              }
            }
          }
        }
      }
      
      console.log('Doctor tests array length:', doctorTests.length);
      if (doctorTests.length > 0) {
        console.log('First doctor test item (raw):', JSON.stringify(doctorTests[0], null, 2));
        console.log('First doctor test item keys:', Object.keys(doctorTests[0]));
        console.log('First doctor test item values:', Object.entries(doctorTests[0]).map(([k, v]) => `${k}: ${v} (${typeof v})`));
      } else {
        console.warn('No doctor tests found in response!');
        console.log('Available keys in reportData:', Object.keys(reportData));
      }
      
      // Map doctor tests to our format
      const mappedDoctorTests = doctorTests.map((doc: any, index: number) => {
        // Try multiple field name variations for doctor name
        const doctorName = extractField(doc, [
          'doctorName', 'DoctorName', 'doctor_name',
          'doctor', 'Doctor', 'DoctorName',
          'orderedBy', 'OrderedBy', 'ordered_by',
          'doctorFullName', 'DoctorFullName', 'doctor_full_name',
          'name', 'Name', 'fullName', 'FullName',
          'physicianName', 'PhysicianName', 'physician_name'
        ], `Doctor ${index + 1}`);
        
        // Try multiple field name variations for total tests
        const total = safeNumber(extractField(doc, [
          'total', 'Total',
          'totalTests', 'TotalTests', 'total_tests',
          'totalTestCount', 'TotalTestCount', 'total_test_count',
          'count', 'Count', 'testCount', 'TestCount'
        ], 0));
        
        // Try multiple field name variations for pending
        const pending = safeNumber(extractField(doc, [
          'pending', 'Pending',
          'pendingTests', 'PendingTests', 'pending_tests',
          'pendingCount', 'PendingCount', 'pending_count',
          'pendingTestCount', 'PendingTestCount', 'pending_test_count'
        ], 0));
        
        // Try multiple field name variations for completed
        const completed = safeNumber(extractField(doc, [
          'completed', 'Completed',
          'completedTests', 'CompletedTests', 'completed_tests',
          'completedCount', 'CompletedCount', 'completed_count',
          'completedTestCount', 'CompletedTestCount', 'completed_test_count'
        ], 0));
        
        console.log(`Doctor ${index + 1} mapping:`, {
          raw: doc,
          mapped: { doctor: doctorName, total, pending, completed }
        });
        
        return {
          doctor: doctorName,
          total,
          pending,
          completed,
        };
      });
      
      console.log('Mapped doctor-wise tests:', mappedDoctorTests);
      
      if (mappedDoctorTests.length === 0 && doctorTests.length > 0) {
        console.error('Mapping failed! Original doctor tests:', doctorTests);
        console.error('This might indicate a field name mismatch. Please check the console logs above.');
      }
      
      setDoctorWiseDailyTests(mappedDoctorTests);
      
      // Extract daily summary
      const summary = reportData.dailySummary || reportData.summary || reportData;
      const totalTests = safeNumber(extractField(summary, ['totalTests', 'TotalTests', 'total_tests', 'total', 'Total'], 0));
      const pending = safeNumber(extractField(summary, ['pending', 'Pending', 'pendingTests', 'PendingTests', 'pending_tests'], 0));
      const completed = safeNumber(extractField(summary, ['completed', 'Completed', 'completedTests', 'CompletedTests', 'completed_tests'], 0));
      
      // Try to get formatted avgTAT first, then fallback to numeric avgTAT
      const avgTATFormattedRaw = extractField(summary, [
        'avgTATFormatted', 'avgTATFormatted', 'AvgTATFormatted', 'avg_tat_formatted',
        'averageTATFormatted', 'AverageTATFormatted',
        'avgTurnaroundTimeFormatted', 'AvgTurnaroundTimeFormatted'
      ], '');
      
      console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&AvgTATFormattedRaw:', avgTATFormattedRaw);
      let avgTATFormatted = 'N/A';
      if (avgTATFormattedRaw && typeof avgTATFormattedRaw === 'string' && avgTATFormattedRaw.trim() !== '') {
        avgTATFormatted = avgTATFormattedRaw;
      } else {
        // Fallback to numeric avgTAT and format it
        const avgTAT = safeNumber(extractField(summary, ['avgTAT', 'AvgTAT', 'avg_tat', 'averageTAT', 'AverageTAT', 'averageTurnaroundTime', 'avgTurnaroundTime'], 0));
        avgTATFormatted = avgTAT > 0 ? `${avgTAT.toFixed(1)}h` : 'N/A';
      }
      
      const avgTAT = safeNumber(extractField(summary, ['avgTAT','avgTAT', 'AvgTAT', 'avg_tat', 'averageTAT', 'AverageTAT', 'averageTurnaroundTime', 'avgTurnaroundTime'], 0));
      console.log('&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&setDailySummary:', setDailySummary.avgTAT, '++++++++', setDailySummary.avgTATFormatted);
      setDailySummary({
        totalTests,
        pending,
        completed,
        avgTAT,
        avgTATFormatted,
      });
      
      console.log('Mapped doctor-wise tests:', mappedDoctorTests);
      console.log('Mapped daily summary:', { totalTests, pending, completed, avgTAT, avgTATFormatted });
      
    } catch (err) {
      console.error('Error fetching lab test daily report:', err);
      setDailyReportError(err instanceof Error ? err.message : 'Failed to fetch lab test daily report');
      setDoctorWiseDailyTests([]);
      setDailySummary({
        totalTests: 0,
        pending: 0,
        completed: 0,
        avgTAT: 0,
        avgTATFormatted: 'N/A',
      });
    } finally {
      setDailyReportLoading(false);
    }
  };

  // Get current week start and end dates
  const getCurrentWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    const weekStart = new Date(today.setDate(diff));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const formatDateDisplay = (date: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = String(date.getDate()).padStart(2, '0');
      return `${month} ${day}`;
    };
    
    return {
      startDate: formatDate(weekStart),
      endDate: formatDate(weekEnd),
      startDateDisplay: formatDateDisplay(weekStart),
      endDateDisplay: formatDateDisplay(weekEnd),
    };
  };

  // Fetch lab test weekly report
  const fetchLabTestWeeklyReport = async () => {
    try {
      setWeeklyReportLoading(true);
      setWeeklyReportError(null);
      
      const weekDates = getCurrentWeekDates();
      setWeekStartDate(weekDates.startDateDisplay);
      setWeekEndDate(weekDates.endDateDisplay);
      
      console.log('Fetching lab test weekly report for week:', weekDates);
      
      const params = new URLSearchParams();
      params.append('startDate', weekDates.startDate);
      params.append('endDate', weekDates.endDate);
      
      const response = await apiRequest<any>(`/reports/lab-test-weekly-report?${params.toString()}`);
      console.log('Lab test weekly report API response:', JSON.stringify(response, null, 2));
      
      // Handle different response structures
      let reportData: any = null;
      
      if (response && typeof response === 'object') {
        if (response.data && typeof response.data === 'object') {
          reportData = response.data;
        } else if (response.report && typeof response.report === 'object') {
          reportData = response.report;
        } else {
          reportData = response;
        }
      }
      
      if (!reportData) {
        console.warn('Lab test weekly report response is empty:', response);
        setWeeklyTestData([]);
        setWeeklySummary({
          totalTests: 0,
          completed: 0,
          dailyAverage: 0,
          completionRate: 0,
        });
        return;
      }
      
      // Helper function to extract field with multiple variations
      const extractField = (data: any, fieldVariations: string[], defaultValue: any = 0) => {
        if (!data || typeof data !== 'object') return defaultValue;
        
        const checkNested = (obj: any, field: string, depth: number = 0): any => {
          if (depth > 3 || !obj || typeof obj !== 'object') return undefined;
          
          // Check direct property
          if (obj[field] !== undefined && obj[field] !== null && obj[field] !== '') {
            return obj[field];
          }
          
          // Check case-insensitive property
          const keys = Object.keys(obj);
          const lowerField = field.toLowerCase();
          const caseInsensitiveMatch = keys.find(k => k.toLowerCase() === lowerField);
          if (caseInsensitiveMatch) {
            const value = obj[caseInsensitiveMatch];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          
          // Check partial match
          const partialMatch = keys.find(k => k.toLowerCase().includes(lowerField) || lowerField.includes(k.toLowerCase()));
          if (partialMatch) {
            const value = obj[partialMatch];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }
          
          // Check nested objects
          for (const key in obj) {
            if (obj.hasOwnProperty(key) && typeof obj[key] === 'object' && obj[key] !== null) {
              const nestedValue = checkNested(obj[key], field, depth + 1);
              if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
                return nestedValue;
              }
            }
          }
          return undefined;
        };
        
        for (const field of fieldVariations) {
          const value = checkNested(data, field);
          if (value !== undefined && value !== null && value !== '') {
            return value;
          }
        }
        return defaultValue;
      };
      
      const safeNumber = (value: any): number => {
        if (value === null || value === undefined || value === '') return 0;
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(num) ? 0 : num;
      };
      
      // Extract weekly trend data (daily data for the week)
      let dailyData: any[] = [];
      
      if (reportData.dailyData && Array.isArray(reportData.dailyData)) {
        dailyData = reportData.dailyData;
      } else if (reportData.weeklyTrend && Array.isArray(reportData.weeklyTrend)) {
        dailyData = reportData.weeklyTrend;
      } else if (reportData.days && Array.isArray(reportData.days)) {
        dailyData = reportData.days;
      } else if (Array.isArray(reportData)) {
        dailyData = reportData;
      }
      
      // Map daily data to chart format
      const mappedDailyData = dailyData.map((day: any) => {
        const dateValue = extractField(day, ['date', 'Date', 'day', 'Day', 'testDate', 'TestDate'], '');
        const tests = safeNumber(extractField(day, ['tests', 'Tests', 'totalTests', 'TotalTests', 'total_tests', 'total'], 0));
        const completed = safeNumber(extractField(day, ['completed', 'Completed', 'completedTests', 'CompletedTests', 'completed_tests'], 0));
        
        // Format date for display (e.g., "Nov 08")
        let dateDisplay = dateValue;
        if (dateValue) {
          try {
            const dateObj = new Date(dateValue);
            if (!isNaN(dateObj.getTime())) {
              const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const month = months[dateObj.getMonth()];
              const day = String(dateObj.getDate()).padStart(2, '0');
              dateDisplay = `${month} ${day}`;
            }
          } catch (e) {
            // Keep original value if parsing fails
          }
        }
        
        return {
          date: dateDisplay || 'N/A',
          tests,
          completed,
        };
      });
      
      setWeeklyTestData(mappedDailyData);
      
      // Extract weekly summary
      const summary = reportData.weeklySummary || reportData.summary || reportData;
      const totalTests = safeNumber(extractField(summary, ['totalTests', 'TotalTests', 'total_tests', 'total', 'Total'], 0));
      const completed = safeNumber(extractField(summary, ['completed', 'Completed', 'completedTests', 'CompletedTests', 'completed_tests'], 0));
      const dailyAverage = mappedDailyData.length > 0 
        ? Math.round(mappedDailyData.reduce((sum, day) => sum + day.tests, 0) / mappedDailyData.length)
        : 0;
      const completionRate = totalTests > 0 
        ? Math.round((completed / totalTests) * 100)
        : 0;
      
      setWeeklySummary({
        totalTests,
        completed,
        dailyAverage,
        completionRate,
      });
      
      console.log('Mapped weekly test data:', mappedDailyData);
      console.log('Mapped weekly summary:', { totalTests, completed, dailyAverage, completionRate });
      
    } catch (err) {
      console.error('Error fetching lab test weekly report:', err);
      setWeeklyReportError(err instanceof Error ? err.message : 'Failed to fetch lab test weekly report');
      setWeeklyTestData([]);
      setWeeklySummary({
        totalTests: 0,
        completed: 0,
        dailyAverage: 0,
        completionRate: 0,
      });
    } finally {
      setWeeklyReportLoading(false);
    }
  };

  // Fetch daily report when reports dialog opens
  useEffect(() => {
    if (showReportsDialog) {
      setActiveReportTab('daily'); // Reset to daily tab when dialog opens
      fetchLabTestDailyReport();
      fetchLabTestWeeklyReport();
    }
  }, [showReportsDialog]);

  // Fetch room admissions when patient is selected and PatientType is IPD
  useEffect(() => {
    if (newLabOrderFormData.patientType === 'IPD' && newLabOrderFormData.patientId) {
      fetchPatientRoomAdmissions(newLabOrderFormData.patientId);
    }
  }, [newLabOrderFormData.patientId, newLabOrderFormData.patientType]);

  // Fetch emergency admissions when patient is selected and PatientType is Emergency
  useEffect(() => {
    if (newLabOrderFormData.patientType === 'Emergency' && newLabOrderFormData.patientId) {
      fetchPatientEmergencyAdmissions(newLabOrderFormData.patientId);
    }
  }, [newLabOrderFormData.patientId, newLabOrderFormData.patientType]);

  // Export Daily Report to CSV
  const exportDailyReport = () => {
    const today = getTodayDate();
    const filename = `Lab_Test_Daily_Report_${today}.csv`;
    
    // Create CSV header
    let csvContent = 'Laboratory Test Daily Report\n';
    csvContent += `Date: ${today}\n\n`;
    
    // Doctor-wise Lab Tests section
    csvContent += 'Doctor-wise Lab Tests - Today\n';
    csvContent += 'Doctor,Total Tests,Pending,Completed,Completion Rate (%)\n';
    
    doctorWiseDailyTests.forEach((doc) => {
      const completionRate = doc.total > 0 ? Math.round((doc.completed / doc.total) * 100) : 0;
      csvContent += `"${doc.doctor}",${doc.total},${doc.pending},${doc.completed},${completionRate}\n`;
    });
    
    csvContent += '\n';
    
    // Daily Summary section
    csvContent += 'Daily Summary\n';
    csvContent += `Total Tests,${dailySummary.totalTests}\n`;
    csvContent += `Pending,${dailySummary.pending}\n`;
    csvContent += `Completed,${dailySummary.completed}\n`;
    csvContent += `Avg. TAT,${dailySummary.avgTATFormatted}\n`;
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Weekly Report to CSV
  const exportWeeklyReport = () => {
    const weekDates = getCurrentWeekDates();
    const filename = `Lab_Test_Weekly_Report_${weekDates.startDate}_to_${weekDates.endDate}.csv`;
    
    // Create CSV header
    let csvContent = 'Laboratory Test Weekly Report\n';
    csvContent += `Week: ${weekDates.startDateDisplay} - ${weekDates.endDateDisplay}\n\n`;
    
    // Weekly Lab Test Trend section
    csvContent += 'Weekly Lab Test Trend\n';
    csvContent += 'Date,Total Tests,Completed\n';
    
    weeklyTestData.forEach((day) => {
      csvContent += `"${day.date}",${day.tests},${day.completed}\n`;
    });
    
    csvContent += '\n';
    
    // Weekly Summary section
    csvContent += 'Weekly Summary\n';
    csvContent += `Total Tests,${weeklySummary.totalTests}\n`;
    csvContent += `Completed,${weeklySummary.completed}\n`;
    csvContent += `Daily Average,${weeklySummary.dailyAverage}\n`;
    csvContent += `Completion Rate (%),${weeklySummary.completionRate}\n`;
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle export report based on active tab
  const handleExportReport = () => {
    if (activeReportTab === 'daily') {
      exportDailyReport();
    } else {
      exportWeeklyReport();
    }
  };

  // Handle viewing PatientLabTest
  const handleViewPatientLabTest = (test: any) => {
    setViewingPatientLabTest(test);
    setIsViewPatientLabTestDialogOpen(true);
  };

  // Handle editing PatientLabTest
  const handleEditPatientLabTest = (test: any) => {
    console.log('Edit Patient Lab Test - test object:', test);
    console.log('Edit Patient Lab Test - patientNo:', test.patientNo);
    console.log('Edit Patient Lab Test - testName:', test.testName);
    setEditingPatientLabTest(test);
    setEditPatientLabTestFormData({
      patientLabTestsId: test.patientLabTestsId || test.id,
      patientId: test.patientId || '',
      patientNo: test.patientNo || (test as any).PatientNo || (test as any).Patient?.PatientNo || '',
      labTestId: test.labTestId || '',
      testName: test.testName || test.labTestName || (test as any).TestName || (test as any).LabTest?.TestName || '',
      patientType: test.patientType || 'OPD',
      priority: test.priority || 'Normal',
      testStatus: test.testStatus || test.status || 'Pending',
      labTestDone: test.labTestDone === 'Yes' || test.labTestDone === true ? 'Yes' : 'No',
      reportsUrl: test.reportsUrl || '',
      testDoneDateTime: test.testDoneDateTime || '',
      roomAdmissionId: test.roomAdmissionId || '',
      emergencyBedSlotId: test.emergencyBedSlotId || '',
      billId: test.billId || '',
      status: (test as any).statusValue || test.status || 'Active',
      charges: test.charges || 0
    });
    
    // Parse existing documents from reportsUrl field (similar to OT Documents)
    let existingDocUrls: string[] = [];
    if (test.reportsUrl) {
      try {
        // Try parsing as JSON array first
        const parsed = JSON.parse(test.reportsUrl);
        if (Array.isArray(parsed)) {
          existingDocUrls = parsed;
        } else if (typeof parsed === 'string') {
          existingDocUrls = [parsed];
        }
      } catch {
        // If not JSON, treat as comma-separated string or single URL
        if (test.reportsUrl.includes(',')) {
          existingDocUrls = test.reportsUrl.split(',').map((url: string) => url.trim()).filter((url: string) => url);
        } else {
          existingDocUrls = [test.reportsUrl];
        }
      }
    }
    setEditUploadedDocumentUrls(existingDocUrls);
    setEditSelectedFiles([]);
    
    setIsEditPatientLabTestDialogOpen(true);
  };

  // Handle saving edited PatientLabTest
  const handleSaveEditPatientLabTest = async () => {
    if (!editPatientLabTestFormData || !editingPatientLabTest) {
      return;
    }

    try {
      setEditPatientLabTestSubmitting(true);
      setEditPatientLabTestSubmitError(null);

      const patientLabTestsId = editPatientLabTestFormData.patientLabTestsId;
      if (!patientLabTestsId) {
        throw new Error('Patient Lab Test ID is required');
      }

      const payload: any = {
        PatientLabTestsId: patientLabTestsId,
        PatientId: editPatientLabTestFormData.patientId,
        LabTestId: Number(editPatientLabTestFormData.labTestId),
        PatientType: editPatientLabTestFormData.patientType,
        Priority: editPatientLabTestFormData.priority,
        TestStatus: editPatientLabTestFormData.testStatus,
        LabTestDone: editPatientLabTestFormData.labTestDone,
        Status: editPatientLabTestFormData.status
      };

      // Upload new files first if any are selected (similar to OT Documents)
      let documentUrls: string[] = [...editUploadedDocumentUrls];
      if (editSelectedFiles.length > 0) {
        try {
          const newUrls = await uploadFiles(editSelectedFiles, editPatientLabTestFormData.patientId);
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
      if (editPatientLabTestFormData.testDoneDateTime) {
        payload.TestDoneDateTime = editPatientLabTestFormData.testDoneDateTime;
      }
      if (editPatientLabTestFormData.roomAdmissionId) {
        payload.RoomAdmissionId = Number(editPatientLabTestFormData.roomAdmissionId);
      }
      if (editPatientLabTestFormData.emergencyBedSlotId) {
        payload.EmergencyBedSlotId = Number(editPatientLabTestFormData.emergencyBedSlotId);
      }
      if (editPatientLabTestFormData.billId) {
        payload.BillId = Number(editPatientLabTestFormData.billId);
      }
      if (editPatientLabTestFormData.charges) {
        payload.Charges = Number(editPatientLabTestFormData.charges);
      }

      console.log('Updating PatientLabTest with payload:', payload);
      await apiRequest<any>(`/patient-lab-tests/${patientLabTestsId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Refresh the tests list by calling the main fetch function
      await fetchPatientLabTests();

      // Close dialog
      setIsEditPatientLabTestDialogOpen(false);
      setEditingPatientLabTest(null);
      setEditPatientLabTestFormData(null);
      setEditSelectedFiles([]);
      setEditUploadedDocumentUrls([]);
    } catch (err) {
      console.error('Error saving PatientLabTest:', err);
      setEditPatientLabTestSubmitError(err instanceof Error ? err.message : 'Failed to save patient lab test');
    } finally {
      setEditPatientLabTestSubmitting(false);
    }
  };

  const filteredTests = tests.filter(test =>
    test.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.testId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.testName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTestsByStatus = (status: string) => {
    return filteredTests.filter(t => t.status === status);
  };

  // Use API counts if available, otherwise fallback to calculated counts
  const pendingCount = testStatusCounts.pending !== undefined ? testStatusCounts.pending : tests.filter(t => t.status === 'Pending').length;
  const inProgressCount = testStatusCounts.inProgress !== undefined ? testStatusCounts.inProgress : 
                         (testStatusCounts.sampleCollected !== undefined ? testStatusCounts.sampleCollected : 0) +
                         tests.filter(t => t.status === 'In Progress' || t.status === 'Sample Collected').length;
  const completedCount = testStatusCounts.completed !== undefined ? testStatusCounts.completed : 
                        (testStatusCounts.reported !== undefined ? testStatusCounts.reported : 0) +
                        tests.filter(t => t.status === 'Completed' || t.status === 'Reported').length;
  const totalCount = testStatusCounts.total !== undefined ? testStatusCounts.total : tests.length;

  // Handle opening New Lab Order dialog
  const handleOpenNewLabOrderDialog = async () => {
    try {
      // Fetch all required data
      // Fetch all patients with large limit (similar to Patients list)
      const [patientsResponse, labTestsData, doctorsData] = await Promise.all([
        patientsApi.getAll(1, 1000), // Fetch all patients (page 1, limit 1000)
        labTestsApi.getAll(),
        doctorsApi.getAll()
      ]);
      
      // Handle paginated response - extract data array
      const patientsData = Array.isArray(patientsResponse) 
        ? patientsResponse 
        : (patientsResponse?.data || []);
      
      setAvailablePatients(patientsData);
      setAvailableLabTests(labTestsData);
      setAvailableDoctors(doctorsData);
      
      // Reset form
      setNewLabOrderFormData({
        patientId: '',
        labTestId: '',
        patientType: '',
        roomAdmissionId: '',
        appointmentId: '',
        emergencyBedSlotId: '',
        priority: 'Normal',
        testStatus: 'Pending',
        labTestDone: 'No',
        testDoneDate: '',
        reportsUrl: '',
        orderedByDoctorId: ''
      });
      
      setPatientSearchTerm('');
      setLabTestSearchTerm('');
      setDoctorSearchTerm('');
      setShowPatientList(false);
      setShowLabTestList(false);
      setShowDoctorList(false);
      setNewLabOrderSubmitError(null);
      
      // Reset file upload state
      setSelectedFiles([]);
    } catch (err) {
      console.error('Error fetching data for new lab order:', err);
    }
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

  // Fetch room admissions for a specific patient
  const fetchPatientRoomAdmissions = async (patientId: string) => {
    if (!patientId) {
      setAvailableAdmissions([]);
      return;
    }
    
    try {
      console.log('Fetching room admissions for patient:', patientId);
      const response = await apiRequest<any>(`/room-admissions/patient/${patientId}`);
      console.log('Room admissions API response:', response);
      
      // Handle different response structures
      let admissions: any[] = [];
      
      if (Array.isArray(response)) {
        admissions = response;
      } else if (response?.data && Array.isArray(response.data)) {
        admissions = response.data;
      } else if (response?.admissions && Array.isArray(response.admissions)) {
        admissions = response.admissions;
      } else if (response?.roomAdmissions && Array.isArray(response.roomAdmissions)) {
        admissions = response.roomAdmissions;
      }
      
      console.log('Mapped room admissions:', admissions);
      setAvailableAdmissions(admissions);
    } catch (err) {
      console.error('Error fetching room admissions:', err);
      setAvailableAdmissions([]);
    }
  };

  // Fetch emergency admissions for a specific patient
  const fetchPatientEmergencyAdmissions = async (patientId: string) => {
    if (!patientId) {
      setAvailableEmergencyBedSlots([]);
      return;
    }
    
    try {
      console.log('Fetching emergency admissions for patient:', patientId);
      const response = await apiRequest<any>(`/emergency-admissions/patient/${patientId}`);
      console.log('Emergency admissions API response:', response);
      
      // Handle different response structures
      let emergencyAdmissions: any[] = [];
      
      if (Array.isArray(response)) {
        emergencyAdmissions = response;
      } else if (response?.data && Array.isArray(response.data)) {
        emergencyAdmissions = response.data;
      } else if (response?.admissions && Array.isArray(response.admissions)) {
        emergencyAdmissions = response.admissions;
      } else if (response?.emergencyAdmissions && Array.isArray(response.emergencyAdmissions)) {
        emergencyAdmissions = response.emergencyAdmissions;
      } else if (response?.emergencyBedSlots && Array.isArray(response.emergencyBedSlots)) {
        emergencyAdmissions = response.emergencyBedSlots;
      }
      
      console.log('Mapped emergency admissions:', emergencyAdmissions);
      setAvailableEmergencyBedSlots(emergencyAdmissions);
    } catch (err) {
      console.error('Error fetching emergency admissions:', err);
      setAvailableEmergencyBedSlots([]);
    }
  };

  // Handle PatientType change - fetch conditional data
  const handlePatientTypeChange = async (patientType: 'IPD' | 'OPD' | 'Emergency' | 'Direct' | '') => {
    setNewLabOrderFormData({
      ...newLabOrderFormData,
      patientType: patientType as 'IPD' | 'OPD' | 'Emergency' | 'Direct',
      roomAdmissionId: '',
      appointmentId: '',
      emergencyBedSlotId: ''
    });

    // Clear conditional data if no patient type selected
    if (!patientType) {
      setAvailableAdmissions([]);
      setAvailableAppointments([]);
      setAvailableEmergencyBedSlots([]);
      return;
    }

    // Direct patient type doesn't require conditional fields
    if (patientType === 'Direct') {
      setAvailableAdmissions([]);
      setAvailableAppointments([]);
      setAvailableEmergencyBedSlots([]);
      return;
    }

    try {
      if (patientType === 'IPD') {
        // If patient is already selected, fetch their room admissions
        if (newLabOrderFormData.patientId) {
          await fetchPatientRoomAdmissions(newLabOrderFormData.patientId);
        } else {
          setAvailableAdmissions([]);
        }
      } else if (patientType === 'OPD') {
        // If patient is already selected, fetch their appointments
        if (newLabOrderFormData.patientId) {
          await fetchPatientAppointments(newLabOrderFormData.patientId);
        } else {
          setAvailableAppointments([]);
        }
      } else if (patientType === 'Emergency') {
        // If patient is already selected, fetch their emergency admissions
        if (newLabOrderFormData.patientId) {
          await fetchPatientEmergencyAdmissions(newLabOrderFormData.patientId);
        } else {
          setAvailableEmergencyBedSlots([]);
        }
      }
    } catch (err) {
      console.error(`Error fetching ${patientType} data:`, err);
    }
  };

  // Helper function to format date for file suffix
  const formatDateForFileSuffix = (): string => {
    const now = new Date();
    const istDate = convertToIST(now);
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const year = istDate.getUTCFullYear();
    return `${day}_${month}_${year}`;
  };

  // Helper function to add date suffix to filename
  const addDateSuffixToFileName = (fileName: string): string => {
    const dateSuffix = formatDateForFileSuffix();
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1) {
      // No extension
      return `${fileName}_${dateSuffix}`;
    }
    const nameWithoutExt = fileName.substring(0, lastDotIndex);
    const extension = fileName.substring(lastDotIndex);
    return `${nameWithoutExt}_${dateSuffix}${extension}`;
  };

  // Function to upload files (similar to OT Documents)
  const uploadFiles = async (files: File[], patientId: string): Promise<string[]> => {
    if (files.length === 0) return [];
    if (!patientId) {
      throw new Error('Patient ID is required for file upload');
    }
    
    const uploadedUrls: string[] = [];
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
    
    for (const file of files) {
      try {
        const formData = new FormData();
        // Add date suffix to filename before uploading
        const fileNameWithSuffix = addDateSuffixToFileName(file.name);
        // Append file with the exact field name 'file' that multer expects
        formData.append('file', file, fileNameWithSuffix);
        // Append folder parameter (required by backend) - must be in FormData
        formData.append('folder', 'lab-reports');
        // Append PatientId parameter (required by backend, must be UUID) - also in query as fallback
        formData.append('PatientId', patientId);
        
        // Debug: Log form data keys
        console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
        console.log('FormData entries:');
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
          } else {
            console.log(`  ${key}:`, value);
          }
        }
        
        // Send folder and PatientId as query parameters too (as fallback for multer async issue)
        // Construct URL properly - append /upload to the base URL
        const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
        const uploadUrlObj = new URL(`${baseUrl}/upload`);
        uploadUrlObj.searchParams.append('folder', 'lab-reports');
        uploadUrlObj.searchParams.append('PatientId', patientId);
        const uploadUrl = uploadUrlObj.toString();
        
        console.log('Constructed upload URL:', uploadUrl);
        console.log('File being sent:', { name: file.name, size: file.size, type: file.type });
        
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to upload ${file.name}`);
        }
        
        const result = await response.json();
        if (result.success && result.url) {
          uploadedUrls.push(result.url);
        } else {
          throw new Error(`Invalid response for ${file.name}: ${JSON.stringify(result)}`);
        }
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        throw error;
      }
    }
    
    return uploadedUrls;
  };

  // Handle saving New Lab Order
  const handleSaveNewLabOrder = async () => {
    try {
      setNewLabOrderSubmitting(true);
      setNewLabOrderSubmitError(null);

      // Validate required fields
      if (!newLabOrderFormData.patientId) {
        throw new Error('Patient is required');
      }
      if (!newLabOrderFormData.labTestId) {
        throw new Error('Lab Test is required');
      }
      if (!newLabOrderFormData.orderedByDoctorId) {
        throw new Error('Ordered By Doctor is required');
      }
      if (!newLabOrderFormData.patientType) {
        throw new Error('Patient Type is required');
      }

      // Validate conditional fields based on PatientType
      // Direct patient type doesn't require conditional fields
      if (newLabOrderFormData.patientType === 'IPD' && !newLabOrderFormData.roomAdmissionId) {
        throw new Error('Room Admission ID is required for IPD');
      }
      if (newLabOrderFormData.patientType === 'OPD' && !newLabOrderFormData.appointmentId) {
        throw new Error('Appointment ID is required for OPD');
      }
      if (newLabOrderFormData.patientType === 'Emergency' && !newLabOrderFormData.emergencyBedSlotId) {
        throw new Error('Emergency Bed Slot ID is required for Emergency');
      }

      // Construct payload
      const payload: any = {
        PatientId: newLabOrderFormData.patientId,
        LabTestId: Number(newLabOrderFormData.labTestId),
        PatientType: newLabOrderFormData.patientType as 'IPD' | 'OPD' | 'Emergency' | 'Direct',
        Priority: newLabOrderFormData.priority,
        TestStatus: newLabOrderFormData.testStatus,
        LabTestDone: newLabOrderFormData.labTestDone,
        OrderedByDoctorId: Number(newLabOrderFormData.orderedByDoctorId),
        OrderedDate: new Date().toISOString().split('T')[0]
      };

      // Add conditional fields based on PatientType
      // Direct patient type doesn't require conditional fields
      if (newLabOrderFormData.patientType === 'IPD' && newLabOrderFormData.roomAdmissionId) {
        payload.RoomAdmissionId = Number(newLabOrderFormData.roomAdmissionId);
      }
      if (newLabOrderFormData.patientType === 'OPD' && newLabOrderFormData.appointmentId) {
        payload.AppointmentId = Number(newLabOrderFormData.appointmentId);
      }
      if (newLabOrderFormData.patientType === 'Emergency' && newLabOrderFormData.emergencyBedSlotId) {
        payload.EmergencyBedSlotId = Number(newLabOrderFormData.emergencyBedSlotId);
      }
      // Direct patient type: no conditional fields needed

      // Upload files first if any are selected (now that we have patientId)
      let documentUrls: string[] = [];
      // Parse existing reportsUrl if it's a JSON array
      if (newLabOrderFormData.reportsUrl) {
        try {
          const parsed = JSON.parse(newLabOrderFormData.reportsUrl);
          if (Array.isArray(parsed)) {
            documentUrls = parsed;
          } else if (typeof parsed === 'string') {
            documentUrls = [parsed];
          }
        } catch {
          // If not JSON, treat as single URL string
          documentUrls = [newLabOrderFormData.reportsUrl];
        }
      }
      
      if (selectedFiles.length > 0) {
        try {
          const newUrls = await uploadFiles(selectedFiles, newLabOrderFormData.patientId);
          documentUrls = [...documentUrls, ...newUrls];
        } catch (error) {
          alert(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
      }
      
      // Combine all document URLs (JSON array)
      const combinedReportsUrl = documentUrls.length > 0 ? JSON.stringify(documentUrls) : null;

      // Add optional fields
      if (combinedReportsUrl) {
        payload.ReportsUrl = combinedReportsUrl;
      }
      
      if (newLabOrderFormData.testDoneDate) {
        // Convert date to ISO format with time (assuming time is 00:00:00 if not provided)
        const testDoneDateTime = new Date(newLabOrderFormData.testDoneDate + 'T00:00:00');
        payload.TestDoneDateTime = testDoneDateTime.toISOString();
      }

      console.log('Saving new lab order with payload:', payload);
      await apiRequest('/patient-lab-tests', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Close dialog and reset form
      setIsAddDialogOpen(false);
      setNewLabOrderFormData({
        patientId: '',
        labTestId: '',
        patientType: '',
        roomAdmissionId: '',
        appointmentId: '',
        emergencyBedSlotId: '',
        priority: 'Normal',
        testStatus: 'Pending',
        labTestDone: 'No',
        testDoneDate: '',
        reportsUrl: '',
        orderedByDoctorId: ''
      });
      setPatientSearchTerm('');
      setLabTestSearchTerm('');
      setDoctorSearchTerm('');
      setShowPatientList(false);
      setShowLabTestList(false);
      setShowDoctorList(false);
      
      // Reset file upload state
      setSelectedFiles([]);
      
      // Refresh the tests list by calling the fetch function
      window.location.reload(); // Simple refresh for now - could be optimized to refetch only
    } catch (err) {
      console.error('Error saving new lab order:', err);
      setNewLabOrderSubmitError(err instanceof Error ? err.message : 'Failed to save lab order');
    } finally {
      setNewLabOrderSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
      <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <h1 className="text-gray-900 mb-2">Laboratory Tests Management</h1>
              <p className="text-gray-500">Manage lab tests, samples, and reports</p>
            </div>
            <div className="flex items-center gap-4">
            <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowReportsDialog(true)}>
            <FileText className="size-4" />
            View Reports
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (open) {
              handleOpenNewLabOrderDialog();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="dialog-trigger-button" onClick={handleOpenNewLabOrderDialog}>
                <TestTube className="size-4" />
                New Lab Order
              </Button>
            </DialogTrigger>
            <ResizableDialogContent className="p-0 gap-0 large-dialog max-w-4xl dialog-content-standard">
              <div className="dialog-scrollable-wrapper dialog-content-scrollable">
                <DialogHeader className="dialog-header-standard">
                  <DialogTitle className="dialog-title-standard">New Lab Order</DialogTitle>
                </DialogHeader>
                <div className="dialog-body-content-wrapper">
                  <div className="dialog-form-container">
                  {/* Patient Selection - Searchable */}
                  <div className="dialog-form-field">
                    <Label htmlFor="patientId" className="dialog-label-standard">Patient *</Label>
                    <div className="relative">
                      <Input
                        id="patientId"
                        placeholder="Search patient by name, ID, or phone..."
                        value={patientSearchTerm}
                        onChange={(e) => {
                          setPatientSearchTerm(e.target.value);
                          setShowPatientList(true);
                        }}
                        onFocus={() => setShowPatientList(true)}
                        className="dialog-input-standard"
                      />
                      {showPatientList && availablePatients.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 dialog-dropdown-container shadow-lg max-h-60 overflow-y-auto">
                          <div className="dialog-table-container">
                            <table className="dialog-table">
                              <thead>
                                <tr className="dialog-table-header-row">
                                  <th className="dialog-table-header-cell">Patient No</th>
                                  <th className="dialog-table-header-cell">Name</th>
                                  <th className="dialog-table-header-cell">Phone</th>
                                </tr>
                              </thead>
                              <tbody className="dialog-table-body">
                                {availablePatients.filter((patient: any) => {
                                  if (!patientSearchTerm) return true;
                                  const searchLower = patientSearchTerm.toLowerCase();
                                  const patientId = (patient as any).patientId || (patient as any).PatientId || '';
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
                                }).map((patient: any) => {
                                  const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                                  const patientNo = (patient as any).patientNo || (patient as any).PatientNo || patientId.substring(0, 8);
                                  const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                                  const lastName = (patient as any).lastName || (patient as any).LastName || '';
                                  const fullName = `${patientName} ${lastName}`.trim();
                                  const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                                  const isSelected = newLabOrderFormData.patientId === patientId;
                                  return (
                                    <tr
                                      key={patientId}
                                      onClick={async () => {
                                        const updatedFormData = { ...newLabOrderFormData, patientId };
                                        setNewLabOrderFormData(updatedFormData);
                                        setPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
                                        setShowPatientList(false);
                                        
                                        // If PatientType is OPD, fetch appointments for this patient
                                        if (updatedFormData.patientType === 'OPD' && patientId) {
                                          await fetchPatientAppointments(patientId);
                                        }
                                        // If PatientType is IPD, fetch room admissions for this patient
                                        if (updatedFormData.patientType === 'IPD' && patientId) {
                                          await fetchPatientRoomAdmissions(patientId);
                                        }
                                        // If PatientType is Emergency, fetch emergency admissions for this patient
                                        if (updatedFormData.patientType === 'Emergency' && patientId) {
                                          await fetchPatientEmergencyAdmissions(patientId);
                                        }
                                      }}
                                      className={`dialog-table-body-row ${isSelected ? 'dialog-dropdown-row-selected' : ''}`}
                                    >
                                      <td className="dialog-table-body-cell dialog-table-body-cell-primary font-mono">{patientNo}</td>
                                      <td className="dialog-table-body-cell dialog-table-body-cell-secondary">{fullName || 'Unknown'}</td>
                                      <td className="dialog-table-body-cell dialog-table-body-cell-secondary">{phoneNo || '-'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lab Test Selection - Searchable */}
                  <div className="dialog-form-field">
                    <Label htmlFor="labTestId" className="dialog-label-standard">Lab Test *</Label>
                    <div className="relative">
                      <Input
                        id="labTestId"
                        placeholder="Search lab test by Display Test ID, name, or category..."
                        value={labTestSearchTerm}
                        onChange={(e) => {
                          setLabTestSearchTerm(e.target.value);
                          setShowLabTestList(true);
                        }}
                        onFocus={() => setShowLabTestList(true)}
                        className="dialog-input-standard"
                      />
                      {showLabTestList && availableLabTests.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 dialog-dropdown-container shadow-lg max-h-60 overflow-y-auto">
                          <div className="dialog-table-container">
                            <table className="dialog-table">
                              <thead>
                                <tr className="dialog-table-header-row">
                                  <th className="dialog-table-header-cell">Display Test ID</th>
                                  <th className="dialog-table-header-cell">Test Name</th>
                                  <th className="dialog-table-header-cell">Category</th>
                                </tr>
                              </thead>
                              <tbody className="dialog-table-body">
                                {availableLabTests.filter((test: any) => {
                                  if (!labTestSearchTerm) return true;
                                  const searchLower = labTestSearchTerm.toLowerCase();
                                  const displayTestId = test.displayTestId || test.DisplayTestId || test.displayTestID || test.DisplayTestID || '';
                                  const testName = test.testName || test.TestName || test.labTestName || test.LabTestName || test.name || test.Name || '';
                                  const category = test.testCategory || test.TestCategory || test.category || test.Category || '';
                                  return displayTestId.toLowerCase().includes(searchLower) ||
                                         testName.toLowerCase().includes(searchLower) ||
                                         category.toLowerCase().includes(searchLower);
                                }).map((test: any) => {
                                  const testId = test.labTestId || test.LabTestId || test.id || test.Id || '';
                                  const displayTestId = test.displayTestId || test.DisplayTestId || test.displayTestID || test.DisplayTestID || '';
                                  const testName = test.testName || test.TestName || test.labTestName || test.LabTestName || test.name || test.Name || '';
                                  const category = test.testCategory || test.TestCategory || test.category || test.Category || '';
                                  const isSelected = newLabOrderFormData.labTestId === String(testId);
                                  const displayText = `${displayTestId}, ${testName} (${category})`;
                                  return (
                                    <tr
                                      key={testId}
                                      onClick={() => {
                                        setNewLabOrderFormData({ ...newLabOrderFormData, labTestId: String(testId) });
                                        setLabTestSearchTerm(displayText);
                                        setShowLabTestList(false);
                                      }}
                                      className={`dialog-table-body-row ${isSelected ? 'dialog-dropdown-row-selected' : ''}`}
                                    >
                                      <td className="dialog-table-body-cell dialog-table-body-cell-primary font-mono">{displayTestId || '-'}</td>
                                      <td className="dialog-table-body-cell dialog-table-body-cell-primary">{testName || '-'}</td>
                                      <td className="dialog-table-body-cell dialog-table-body-cell-secondary">{category || '-'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Patient Type */}
                  <div className="dialog-form-field">
                    <Label htmlFor="patientType" className="dialog-label-standard">Patient Type *</Label>
                    <select
                      id="patientType"
                      className="dialog-select-standard"
                      value={newLabOrderFormData.patientType}
                      onChange={(e) => handlePatientTypeChange(e.target.value as 'IPD' | 'OPD' | 'Emergency' | 'Direct' | '')}
                    >
                      <option value="">Select Patient Type</option>
                      <option value="OPD">OPD</option>
                      <option value="IPD">IPD</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Direct">Direct</option>
                    </select>
                  </div>

                  {/* Conditional Fields based on PatientType */}
                  {newLabOrderFormData.patientType === 'IPD' && (
                    <div className="dialog-form-field">
                      <Label htmlFor="roomAdmissionId" className="dialog-label-standard">Room Admission ID (BedNo_RoomAllocationDate) *</Label>
                      <select
                        id="roomAdmissionId"
                        className="dialog-select-standard"
                        value={newLabOrderFormData.roomAdmissionId}
                        onChange={(e) => setNewLabOrderFormData({ ...newLabOrderFormData, roomAdmissionId: e.target.value })}
                      >
                        <option value="">Select Room Admission</option>
                        {availableAdmissions.map((admission: any) => {
                          const admissionId = admission.roomAdmissionId || admission.admissionId || admission.id || admission.RoomAdmissionId || '';
                          
                          // Extract room allocation date
                          const roomAllocationDate = admission.roomAllocationDate || 
                                                     admission.RoomAllocationDate || 
                                                     admission.room_allocation_date ||
                                                     admission.date ||
                                                     admission.Date || '';
                          
                          // Format date: Extract YYYY-MM-DD from date string or Date object
                          let formattedDate = '';
                          if (roomAllocationDate) {
                            try {
                              if (typeof roomAllocationDate === 'string') {
                                // If it's a string, extract date part (before 'T' if present)
                                formattedDate = roomAllocationDate.split('T')[0];
                              } else {
                                // If it's a Date object, convert to ISO string and extract date part
                                formattedDate = new Date(roomAllocationDate).toISOString().split('T')[0];
                              }
                            } catch {
                              formattedDate = String(roomAllocationDate).split('T')[0] || 'N/A';
                            }
                          } else {
                            formattedDate = 'N/A';
                          }
                          
                          // Build display text: RoomAdmissionId_RoomAllocationDate
                          const displayText = `${admissionId || 'N/A'}_${formattedDate}`;
                          
                          return (
                            <option key={admissionId} value={String(admissionId)}>
                              {displayText}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {newLabOrderFormData.patientType === 'OPD' && (
                    <div className="dialog-form-field">
                      <Label htmlFor="appointmentId" className="dialog-label-standard">Appointment ID (TokenNo_AppointmentDateTime) *</Label>
                      <select
                        id="appointmentId"
                        className="dialog-select-standard"
                        value={newLabOrderFormData.appointmentId}
                        onChange={(e) => setNewLabOrderFormData({ ...newLabOrderFormData, appointmentId: e.target.value })}
                      >
                        <option value="">Select Appointment</option>
                        {availableAppointments.map((appointment: any) => {
                          const appointmentId = appointment.id || appointment.patientAppointmentId || appointment.PatientAppointmentId || '';
                          const tokenNo = appointment.tokenNo || appointment.TokenNo || '';
                          
                          // Extract appointment date (handle both camelCase and PascalCase)
                          const appointmentDate = appointment.appointmentDate || appointment.AppointmentDate || '';
                          
                          // Extract appointment time (handle both camelCase and PascalCase)
                          const appointmentTime = appointment.appointmentTime || appointment.AppointmentTime || '';
                          
                          // Format date: Extract YYYY-MM-DD from date string or Date object
                          let formattedDate = '';
                          if (appointmentDate) {
                            try {
                              if (typeof appointmentDate === 'string') {
                                // If it's a string, extract date part (before 'T' if present)
                                formattedDate = appointmentDate.split('T')[0];
                              } else {
                                // If it's a Date object, convert to ISO string and extract date part
                                formattedDate = new Date(appointmentDate).toISOString().split('T')[0];
                              }
                            } catch {
                              formattedDate = String(appointmentDate).split('T')[0] || 'N/A';
                            }
                          } else {
                            formattedDate = 'N/A';
                          }
                          
                          // Format time: Extract HH:MM from time string
                          let formattedTime = '';
                          if (appointmentTime) {
                            try {
                              const timeStr = String(appointmentTime);
                              // If it's already in HH:MM:SS or HH:MM format, extract HH:MM
                              if (timeStr.match(/^\d{2}:\d{2}/)) {
                                formattedTime = timeStr.substring(0, 5); // HH:MM format
                              } else if (timeStr.includes('T')) {
                                // If it's a datetime string, extract time part
                                formattedTime = timeStr.split('T')[1]?.substring(0, 5) || '';
                              } else {
                                formattedTime = timeStr.substring(0, 5) || 'N/A';
                              }
                            } catch {
                              formattedTime = 'N/A';
                            }
                          } else {
                            formattedTime = 'N/A';
                          }
                          
                          // Build display text: TokenNo_AppointmentDate_AppointmentTime
                          const displayText = `${tokenNo || 'N/A'}_${formattedDate}_${formattedTime}`;
                          
                          return (
                            <option key={appointmentId} value={String(appointmentId)}>
                              {displayText}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {newLabOrderFormData.patientType === 'Emergency' && (
                    <div className="dialog-form-field">
                      <Label htmlFor="emergencyBedSlotId" className="dialog-label-standard"> (SlotNo_EmergencyAdmissionDateTime) *</Label>
                      <select
                        id="emergencyBedSlotId"
                        className="dialog-select-standard"
                        value={newLabOrderFormData.emergencyBedSlotId}
                        onChange={(e) => setNewLabOrderFormData({ ...newLabOrderFormData, emergencyBedSlotId: e.target.value })}
                      >
                        <option value="">Select Emergency Bed Slot</option>
                        {availableEmergencyBedSlots.map((admission: any) => {
                          // Extract emergency admission ID
                          const emergencyAdmissionId = admission.emergencyAdmissionId || 
                                                         admission.EmergencyAdmissionId || 
                                                         admission.emergency_admission_id ||
                                                         admission.id ||
                                                         admission.Id || '';
                          
                          // Extract emergency admission date
                          const emergencyAdmissionDate = admission.emergencyAdmissionDate || 
                                                          admission.EmergencyAdmissionDate || 
                                                          admission.emergency_admission_date ||
                                                          admission.date ||
                                                          admission.Date || '';
                          
                          // Format date: Extract YYYY-MM-DD from date string or Date object
                          let formattedDate = '';
                          if (emergencyAdmissionDate) {
                            try {
                              if (typeof emergencyAdmissionDate === 'string') {
                                // If it's a string, extract date part (before 'T' if present)
                                formattedDate = emergencyAdmissionDate.split('T')[0];
                              } else {
                                // If it's a Date object, convert to ISO string and extract date part
                                formattedDate = new Date(emergencyAdmissionDate).toISOString().split('T')[0];
                              }
                            } catch {
                              formattedDate = String(emergencyAdmissionDate).split('T')[0] || 'N/A';
                            }
                          } else {
                            formattedDate = 'N/A';
                          }
                          
                          // Build display text: EmergencyAdmissionId_EmergencyAdmissionDate
                          const displayText = `${emergencyAdmissionId || 'N/A'}_${formattedDate}`;
                          
                          // Use emergencyAdmissionId as the value, fallback to other IDs
                          const valueId = emergencyAdmissionId || 
                                         admission.emergencyBedSlotId || 
                                         admission.id || 
                                         admission.EmergencyBedSlotId || '';
                          
                          return (
                            <option key={valueId} value={String(valueId)}>
                              {displayText}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}

                  {/* Priority */}
                  <div className="dialog-form-field">
                    <Label htmlFor="priority" className="dialog-label-standard">Priority *</Label>
                    <select
                      id="priority"
                      className="dialog-select-standard"
                      value={newLabOrderFormData.priority}
                      onChange={(e) => setNewLabOrderFormData({ ...newLabOrderFormData, priority: e.target.value as 'Normal' | 'Urgent' })}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Test Status */}
                  <div className="dialog-form-field">
                    <Label htmlFor="testStatus" className="dialog-label-standard">Test Status *</Label>
                    <select
                      id="testStatus"
                      className="dialog-select-standard"
                      value={newLabOrderFormData.testStatus}
                      onChange={(e) => setNewLabOrderFormData({ ...newLabOrderFormData, testStatus: e.target.value as 'Pending' | 'InProgress' | 'Completed' })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="InProgress">InProgress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  {/* Lab Test Done */}
                  <div className="dialog-form-field">
                    <Label htmlFor="labTestDone" className="dialog-label-standard">Lab Test Done *</Label>
                    <select
                      id="labTestDone"
                      className="dialog-select-standard"
                      value={newLabOrderFormData.labTestDone}
                      onChange={(e) => setNewLabOrderFormData({ ...newLabOrderFormData, labTestDone: e.target.value as 'Yes' | 'No' })}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  {/* Test Done Date */}
                  <div className="dialog-form-field">
                    <Label htmlFor="testDoneDate" className="dialog-label-standard">Test Done Date</Label>
                    <Input
                      id="testDoneDate"
                      type="date"
                      className="dialog-input-standard"
                      value={newLabOrderFormData.testDoneDate}
                      onChange={(e) => setNewLabOrderFormData({ ...newLabOrderFormData, testDoneDate: e.target.value })}
                    />
                  </div>

                  {/* Reports URL with File Upload (similar to OT Documents) */}
                  <div className="dialog-form-field">
                    <Label htmlFor="add-reportsUrl" className="dialog-label-standard">Reports URL</Label>
                    <Input
                      id="add-reportsUrl"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setSelectedFiles(prev => [...prev, ...files]);
                      }}
                      className="dialog-input-standard"
                    />
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded">
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
                    <p className="text-xs text-gray-500 mt-1">Files will be uploaded when you click "Save Lab Order"</p>
                  </div>

                  {/* Ordered By Doctor - Searchable */}
                  <div className="dialog-form-field">
                    <Label htmlFor="orderedByDoctorId" className="dialog-label-standard">Ordered By Doctor *</Label>
                    <div className="relative">
                      <Input
                        id="orderedByDoctorId"
                        placeholder="Search doctor by name..."
                        value={doctorSearchTerm}
                        onChange={(e) => {
                          setDoctorSearchTerm(e.target.value);
                          setShowDoctorList(true);
                        }}
                        onFocus={() => setShowDoctorList(true)}
                        className="dialog-input-standard"
                      />
                      {showDoctorList && availableDoctors.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 dialog-dropdown-container shadow-lg max-h-60 overflow-y-auto">
                          <div className="dialog-table-container">
                            <table className="dialog-table">
                              <thead>
                                <tr className="dialog-table-header-row">
                                  <th className="dialog-table-header-cell">Doctor Name</th>
                                  <th className="dialog-table-header-cell">Specialization</th>
                                </tr>
                              </thead>
                              <tbody className="dialog-table-body">
                                {availableDoctors.filter((doctor: any) => {
                                  if (!doctorSearchTerm) return true;
                                  const searchLower = doctorSearchTerm.toLowerCase();
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
                                  const isSelected = newLabOrderFormData.orderedByDoctorId === String(doctorId);
                                  return (
                                    <tr
                                      key={doctorId}
                                      onClick={() => {
                                        setNewLabOrderFormData({ ...newLabOrderFormData, orderedByDoctorId: String(doctorId) });
                                        setDoctorSearchTerm(doctorName);
                                        setShowDoctorList(false);
                                      }}
                                      className={`dialog-table-body-row ${isSelected ? 'dialog-dropdown-row-selected' : ''}`}
                                    >
                                      <td className="dialog-table-body-cell dialog-table-body-cell-primary">{doctorName}</td>
                                      <td className="dialog-table-body-cell dialog-table-body-cell-secondary">{specialization || '-'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Error Message */}
                  {newLabOrderSubmitError && (
                    <div className="dialog-error-message">
                      {newLabOrderSubmitError}
                    </div>
                  )}
                  </div>
                </div>
                <DialogFooter className="dialog-footer-standard">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="dialog-footer-button">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveNewLabOrder} disabled={newLabOrderSubmitting} className="dialog-footer-button">
                    {newLabOrderSubmitting ? 'Saving...' : 'Save Lab Order'}
                  </Button>
                </DialogFooter>
              </div>
            </ResizableDialogContent>
          </Dialog>
            </div>
          </div>
        </div>
        <div className="px-6 pt-4 pb-4 flex-1">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="gap-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Tests Today</p>
                {countsLoading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                ) : (
                  <h3 className="text-gray-900">{totalCount}</h3>
                )}
              </div>
              <TestTube className="size-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending</p>
                {countsLoading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                ) : (
                  <h3 className="text-gray-900">{pendingCount}</h3>
                )}
              </div>
              <Clock className="size-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">In Progress</p>
                {countsLoading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                ) : (
                  <h3 className="text-gray-900">{inProgressCount}</h3>
                )}
              </div>
              <AlertCircle className="size-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Completed</p>
                {countsLoading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                ) : (
                  <h3 className="text-gray-900">{completedCount}</h3>
                )}
              </div>
              <CheckCircle className="size-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="dashboard-search-card">
        <CardContent className="dashboard-search-card-content">
          <div className="dashboard-search-input-wrapper">
            <Search className="dashboard-search-icon" />
            <Input
              placeholder="Search by patient name, test ID, or test name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dashboard-search-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tests List */}
      {testsLoading ? (
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500">Loading lab tests...</p>
            </div>
          </CardContent>
        </Card>
      ) : testsError ? (
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="text-center py-12">
              <p className="text-red-600 mb-2">{testsError}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Tests ({filteredTests.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({getTestsByStatus('Pending').length})</TabsTrigger>
            <TabsTrigger value="progress">In Progress ({getTestsByStatus('In Progress').length + getTestsByStatus('Sample Collected').length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({getTestsByStatus('Completed').length + getTestsByStatus('Reported').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <TestsList 
              tests={filteredTests} 
              onSelectTest={setSelectedTest}
              onEditTest={(test) => {
                setEditingPatientLabTest(test);
                setEditPatientLabTestFormData({
                  patientLabTestsId: test.patientLabTestsId || test.id,
                  patientId: test.patientId || '',
                  patientNo: test.patientNo || (test as any).PatientNo || (test as any).Patient?.PatientNo || '',
                  labTestId: test.labTestId || '',
                  testName: test.testName || test.labTestName || (test as any).TestName || (test as any).LabTest?.TestName || '',
                  patientType: test.patientType || 'OPD',
                  priority: test.priority || 'Normal',
                  testStatus: test.testStatus || test.status || 'Pending',
                  labTestDone: test.labTestDone === 'Yes' || test.labTestDone === true ? 'Yes' : 'No',
                  reportsUrl: test.reportsUrl || '',
                  testDoneDateTime: test.testDoneDateTime || '',
                  roomAdmissionId: test.roomAdmissionId || '',
                  emergencyBedSlotId: test.emergencyBedSlotId || '',
                  billId: test.billId || '',
                  status: (test as any).statusValue || test.status || 'Active',
                  charges: test.charges || 0
                });
                setIsEditPatientLabTestDialogOpen(true);
              }}
            />
          </TabsContent>
          <TabsContent value="pending">
            <TestsList 
              tests={getTestsByStatus('Pending')} 
              onSelectTest={setSelectedTest}
              onEditTest={handleEditPatientLabTest}
            />
          </TabsContent>
          <TabsContent value="progress">
            <TestsList 
              tests={[...getTestsByStatus('In Progress'), ...getTestsByStatus('Sample Collected')]} 
              onSelectTest={setSelectedTest}
              onEditTest={handleEditPatientLabTest}
            />
          </TabsContent>
          <TabsContent value="completed">
            <TestsList 
              tests={[...getTestsByStatus('Completed'), ...getTestsByStatus('Reported')]} 
              onSelectTest={setSelectedTest}
              onEditTest={handleEditPatientLabTest}
            />
          </TabsContent>
        </Tabs>
      )}
        </div>

      {/* Test Details Dialog */}
      <Dialog open={!!selectedTest} onOpenChange={() => setSelectedTest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lab Test Details</DialogTitle>
          </DialogHeader>
          {selectedTest && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h3 className="text-gray-900 mb-1">{selectedTest.testName}</h3>
                  <p className="text-sm text-gray-600">{selectedTest.testId}</p>
                </div>
                <Badge variant={
                  selectedTest.status === 'Completed' || selectedTest.status === 'Reported' ? 'default' :
                  selectedTest.status === 'In Progress' || selectedTest.status === 'Sample Collected' ? 'secondary' :
                  'outline'
                }>
                  {selectedTest.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Patient</p>
                  <p className="text-gray-900">{selectedTest.patientName}</p>
                  <p className="text-xs text-gray-500">{selectedTest.patientId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Age / Gender</p>
                  <p className="text-gray-900">{selectedTest.age}Y / {selectedTest.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="text-gray-900">{selectedTest.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <Badge variant={
                    selectedTest.priority === 'Emergency' ? 'destructive' :
                    selectedTest.priority === 'Urgent' ? 'default' : 'secondary'
                  }>
                    {selectedTest.priority}
                  </Badge>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Ordered By</p>
                    <p className="text-gray-900">{selectedTest.orderedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ordered Date/Time</p>
                    <p className="text-gray-900">{selectedTest.orderedDate} at {selectedTest.orderedTime}</p>
                  </div>
                </div>
              </div>

              {selectedTest.sampleCollectedBy && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-500">Sample Collected By</p>
                  <p className="text-gray-900">{selectedTest.sampleCollectedBy}</p>
                </div>
              )}

              {selectedTest.technician && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-500">Assigned Technician</p>
                  <p className="text-gray-900">{selectedTest.technician}</p>
                </div>
              )}

              {selectedTest.result && (
                <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Test Result</p>
                  <p className="text-gray-900">{selectedTest.result}</p>
                  {selectedTest.reportedDate && (
                    <p className="text-xs text-gray-500 mt-2">
                      Reported on {selectedTest.reportedDate} at {selectedTest.reportedTime}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {selectedTest.status === 'Pending' && (
                  <Button>Collect Sample</Button>
                )}
                {selectedTest.status === 'Sample Collected' && (
                  <Button>Start Processing</Button>
                )}
                {selectedTest.status === 'In Progress' && (
                  <Button>Upload Result</Button>
                )}
                {(selectedTest.status === 'Completed' || selectedTest.status === 'Reported') && (
                  <Button className="gap-2">
                    <Download className="size-4" />
                    Download Report
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reports Dialog */}
      <Dialog open={showReportsDialog} onOpenChange={setShowReportsDialog}>
        <DialogContent className="dialog-content-standard large-dialog max-w-6xl max-h-[90vh]">
          <div className="dialog-scrollable-wrapper dialog-content-scrollable">
            <DialogHeader className="dialog-header-standard">
              <DialogTitle className="dialog-title-standard-view">Laboratory Reports</DialogTitle>
            </DialogHeader>
            <div className="dialog-body-content-wrapper">
            <div className="space-y-6 py-4">
              <Tabs value={activeReportTab} onValueChange={(value) => setActiveReportTab(value as 'daily' | 'weekly')}>
                <TabsList>
                  <TabsTrigger value="daily">Daily Report</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly Report</TabsTrigger>
                </TabsList>

                <TabsContent value="daily" className="space-y-6">
                  {dailyReportLoading ? (
                    <Card>
                      <CardContent className="py-8">
                        <div className="text-center text-gray-600">Loading daily report data...</div>
                      </CardContent>
                    </Card>
                  ) : dailyReportError ? (
                    <Card>
                      <CardContent className="py-8">
                        <div className="text-center text-red-600">Error: {dailyReportError}</div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>Doctor-wise Lab Tests - Today</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="dialog-table-container">
                            <table className="dialog-table">
                              <thead>
                                <tr className="dialog-table-header-row">
                                  <th className="dialog-table-header-cell">Doctor</th>
                                  <th className="dialog-table-header-cell">Total Tests</th>
                                  <th className="dialog-table-header-cell">Pending</th>
                                  <th className="dialog-table-header-cell">Completed</th>
                                  <th className="dialog-table-header-cell">Completion Rate</th>
                                </tr>
                              </thead>
                              <tbody className="dialog-table-body">
                                {doctorWiseDailyTests.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="dialog-table-body-cell text-center">
                                      No data available for today
                                    </td>
                                  </tr>
                                ) : (
                                  doctorWiseDailyTests.map((doc, index) => {
                                    const completionRate = doc.total > 0 ? Math.round((doc.completed / doc.total) * 100) : 0;
                                    return (
                                      <tr key={index} className="dialog-table-body-row">
                                        <td className="dialog-table-body-cell dialog-table-body-cell-primary">{doc.doctor}</td>
                                        <td className="dialog-table-body-cell dialog-table-body-cell-primary">{doc.total}</td>
                                        <td className="dialog-table-body-cell">
                                          <Badge variant="outline">{doc.pending}</Badge>
                                        </td>
                                        <td className="dialog-table-body-cell">
                                          <Badge variant="default">{doc.completed}</Badge>
                                        </td>
                                        <td className="dialog-table-body-cell">
                                          <span className={completionRate >= 80 ? 'text-green-600' : 'text-orange-600'}>
                                            {completionRate}%
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Daily Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">Total Tests</p>
                              <p className="text-2xl text-gray-900">
                                {dailySummary.totalTests}
                              </p>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">Pending</p>
                              <p className="text-2xl text-gray-900">
                                {dailySummary.pending}
                              </p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">Completed</p>
                              <p className="text-2xl text-gray-900">
                                {dailySummary.completed}
                              </p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">Avg. TAT</p>
                              <p className="text-2xl text-gray-900">
                                {dailySummary.avgTATFormatted}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="weekly" className="space-y-6">
                  {weeklyReportLoading ? (
                    <Card>
                      <CardContent className="py-8">
                        <div className="text-center text-gray-600">Loading weekly report data...</div>
                      </CardContent>
                    </Card>
                  ) : weeklyReportError ? (
                    <Card>
                      <CardContent className="py-8">
                        <div className="text-center text-red-600">Error: {weeklyReportError}</div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle>Weekly Lab Test Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {weeklyTestData.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              No data available for this week
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={weeklyTestData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="tests" fill="#3b82f6" name="Total Tests" />
                                <Bar dataKey="completed" fill="#10b981" name="Completed" />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>
                            Weekly Summary {weekStartDate && weekEndDate ? `(${weekStartDate} - ${weekEndDate})` : ''}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">Total Tests</p>
                              <p className="text-2xl text-gray-900">
                                {weeklySummary.totalTests}
                              </p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">Completed</p>
                              <p className="text-2xl text-gray-900">
                                {weeklySummary.completed}
                              </p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">Daily Average</p>
                              <p className="text-2xl text-gray-900">
                                {weeklySummary.dailyAverage}
                              </p>
                            </div>
                            <div className="p-4 bg-orange-50 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">Completion Rate</p>
                              <p className="text-2xl text-gray-900">
                                {weeklySummary.completionRate}%
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            </div>
            <DialogFooter className="dialog-footer-standard">
              <Button variant="outline" className="dialog-footer-button" onClick={() => setShowReportsDialog(false)}>Close</Button>
              <Button className="dialog-footer-button gap-2" onClick={handleExportReport}>
                <Download className="size-4" />
                Export Report
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* View PatientLabTest Dialog */}
      <Dialog open={isViewPatientLabTestDialogOpen} onOpenChange={setIsViewPatientLabTestDialogOpen}>
        <DialogContent className="p-0 gap-0 large-dialog max-w-5xl max-h-[90vh]">
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Patient Lab Test Details
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
            {viewingPatientLabTest && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">PatientLabTestsId</Label>
                    <p className="text-gray-900">{viewingPatientLabTest.patientLabTestsId || viewingPatientLabTest.id || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">PatientId</Label>
                    <p className="text-gray-900">{viewingPatientLabTest.patientId || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">PatientName</Label>
                    <p className="text-gray-900">{viewingPatientLabTest.patientName || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">TestName</Label>
                    <p className="text-gray-900">{viewingPatientLabTest.testName || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">PatientType</Label>
                    <p className="text-gray-900">{viewingPatientLabTest.patientType || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">LabTestId</Label>
                    <p className="text-gray-900">{viewingPatientLabTest.labTestId || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">DisplayTestId</Label>
                    <p className="text-gray-900 font-mono">{viewingPatientLabTest.displayTestId || viewingPatientLabTest.testId || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">TestCategory</Label>
                    <p className="text-gray-900">{viewingPatientLabTest.testCategory || viewingPatientLabTest.category || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">RoomAdmissionId</Label>
                    <p className="text-gray-900">{viewingPatientLabTest.roomAdmissionId || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">EmergencyBedSlotId</Label>
                    <p className="text-gray-900">{viewingPatientLabTest.emergencyBedSlotId || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">BillId</Label>
                    <p className="text-gray-900">{viewingPatientLabTest.billId || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Priority</Label>
                    <p className="text-gray-900">{viewingPatientLabTest.priority || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">LabTestDone</Label>
                    <p className="text-gray-900">{viewingPatientLabTest.labTestDone === 'Yes' || viewingPatientLabTest.labTestDone === true ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">ReportsUrl</Label>
                    <p className="text-gray-900">
                      {viewingPatientLabTest.reportsUrl ? (
                        <a href={viewingPatientLabTest.reportsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {viewingPatientLabTest.reportsUrl}
                        </a>
                      ) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">TestStatus</Label>
                    <p className="text-gray-900">{viewingPatientLabTest.testStatus || viewingPatientLabTest.status || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">TestDoneDateTime</Label>
                    <p className="text-gray-900">
                      {viewingPatientLabTest.testDoneDateTime ? new Date(viewingPatientLabTest.testDoneDateTime).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Status</Label>
                    <p className="text-gray-900">{(viewingPatientLabTest as any).statusValue || viewingPatientLabTest.status || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Charges</Label>
                    <p className="text-gray-900">₹{viewingPatientLabTest.charges || 0}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">CreatedBy</Label>
                    <p className="text-gray-900">{viewingPatientLabTest.createdBy || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">CreatedDate</Label>
                    <p className="text-gray-900">
                      {viewingPatientLabTest.createdDate ? new Date(viewingPatientLabTest.createdDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="px-6 pb-4 flex-shrink-0">
            <Button variant="outline" onClick={() => setIsViewPatientLabTestDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit PatientLabTest Dialog */}
      <Dialog open={isEditPatientLabTestDialogOpen} onOpenChange={setIsEditPatientLabTestDialogOpen}>
        <ResizableDialogContent className="p-0 gap-0 large-dialog dialog-content-standard">
          <div className="dialog-scrollable-wrapper dialog-content-scrollable">
            <DialogHeader className="dialog-header-standard">
              <DialogTitle className="dialog-title-standard-view">Edit Patient Lab Test</DialogTitle>
            </DialogHeader>
            <div className="dialog-body-content-wrapper">
              {editPatientLabTestFormData && (
                <div className="dialog-form-container">
                  {editPatientLabTestSubmitError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                      {editPatientLabTestSubmitError}
                    </div>
                  )}
                  <div className="dialog-form-field-grid">
                    <div className="dialog-field-single-column">
                      <Label htmlFor="editPatientNo" className="dialog-label-standard">Patient No</Label>
                      <Input
                        id="editPatientNo"
                        value={editPatientLabTestFormData?.patientNo ? String(editPatientLabTestFormData.patientNo) : 'N/A'}
                        disabled
                        className="dialog-input-standard"
                        style={{ fontWeight: 'normal' }}
                      />
                    </div>
                    <div className="dialog-field-single-column">
                      <Label htmlFor="editTestName" className="dialog-label-standard">Lab Name</Label>
                      <Input
                        id="editTestName"
                        value={editPatientLabTestFormData?.testName ? String(editPatientLabTestFormData.testName) : 'N/A'}
                        disabled
                        className="dialog-input-standard"
                        style={{ fontWeight: 'normal' }}
                      />
                    </div>
                    <div className="dialog-field-single-column">
                      <Label htmlFor="editPatientType" className="dialog-label-standard">PatientType *</Label>
                      <select
                        id="editPatientType"
                        aria-label="PatientType"
                        className="dialog-select-standard"
                        value={editPatientLabTestFormData.patientType}
                        onChange={(e) => setEditPatientLabTestFormData({ ...editPatientLabTestFormData, patientType: e.target.value })}
                        disabled
                      >
                        <option value="OPD">OPD</option>
                        <option value="IPD">IPD</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Direct">Direct</option>
                      </select>
                    </div>
                    <div className="dialog-field-single-column">
                      <Label htmlFor="editPriority" className="dialog-label-standard">Priority *</Label>
                      <select
                        id="editPriority"
                        aria-label="Priority"
                        className="dialog-select-standard"
                        value={editPatientLabTestFormData.priority}
                        onChange={(e) => setEditPatientLabTestFormData({ ...editPatientLabTestFormData, priority: e.target.value })}
                      >
                        <option value="Normal">Normal</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="dialog-field-single-column">
                      <Label htmlFor="editTestStatus" className="dialog-label-standard">TestStatus *</Label>
                      <select
                        id="editTestStatus"
                        aria-label="TestStatus"
                        className="dialog-select-standard"
                        value={editPatientLabTestFormData.testStatus}
                        onChange={(e) => setEditPatientLabTestFormData({ ...editPatientLabTestFormData, testStatus: e.target.value })}
                      >
                        <option value="Pending">Pending</option>
                        <option value="InProgress">InProgress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div className="dialog-field-single-column">
                      <Label htmlFor="editLabTestDone" className="dialog-label-standard">LabTestDone *</Label>
                      <select
                        id="editLabTestDone"
                        aria-label="LabTestDone"
                        className="dialog-select-standard"
                        value={editPatientLabTestFormData.labTestDone}
                        onChange={(e) => setEditPatientLabTestFormData({ ...editPatientLabTestFormData, labTestDone: e.target.value })}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div className="dialog-field-single-column">
                      <Label htmlFor="edit-reportsUrl" className="dialog-label-standard">ReportsUrl</Label>
                      
                      {/* Display existing uploaded documents */}
                      {editUploadedDocumentUrls.length > 0 && (
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
                        id="edit-reportsUrl"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setEditSelectedFiles(prev => [...prev, ...files]);
                          // Reset the input so the same file can be selected again
                          e.target.value = '';
                        }}
                        className="dialog-input-standard"
                      />
                      {editSelectedFiles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600 font-medium">New Files to Upload:</p>
                          {editSelectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 p-2 rounded">
                              <span>{file.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Files will be uploaded when you click "Update"</p>
                    </div>
                    <div className="dialog-field-single-column">
                      <Label htmlFor="editTestDoneDateTime" className="dialog-label-standard">TestDoneDateTime</Label>
                      <Input
                        id="editTestDoneDateTime"
                        type="datetime-local"
                        value={editPatientLabTestFormData.testDoneDateTime ? new Date(editPatientLabTestFormData.testDoneDateTime).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setEditPatientLabTestFormData({ ...editPatientLabTestFormData, testDoneDateTime: e.target.value })}
                        className="dialog-input-standard"
                      />
                    </div>
                    <div className="dialog-field-single-column">
                      <div className="flex items-center gap-3">
                        <Label htmlFor="edit-status" className="dialog-label-standard">Status</Label>
                        <div className="flex-shrink-0 relative" style={{ zIndex: 1 }}>
                          <Switch
                            id="edit-status"
                            checked={editPatientLabTestFormData.status === 'Active' || editPatientLabTestFormData.status === 'active' || editPatientLabTestFormData.status === undefined}
                            onCheckedChange={(checked) => setEditPatientLabTestFormData({ ...editPatientLabTestFormData, status: checked ? 'Active' : 'Inactive' })}
                            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 [&_[data-slot=switch-thumb]]:!bg-white [&_[data-slot=switch-thumb]]:!border [&_[data-slot=switch-thumb]]:!border-gray-400 [&_[data-slot=switch-thumb]]:!shadow-sm"
                            style={{
                              width: '2.5rem',
                              height: '1.5rem',
                              minWidth: '2.5rem',
                              minHeight: '1.5rem',
                              display: 'inline-flex',
                              position: 'relative',
                              backgroundColor: (editPatientLabTestFormData.status === 'Active' || editPatientLabTestFormData.status === 'active' || editPatientLabTestFormData.status === undefined) ? '#2563eb' : '#d1d5db',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="dialog-footer-standard">
              <Button variant="outline" onClick={() => {
                setIsEditPatientLabTestDialogOpen(false);
                setEditSelectedFiles([]);
                setEditUploadedDocumentUrls([]);
              }} className="dialog-footer-button">
                Cancel
              </Button>
              <Button onClick={handleSaveEditPatientLabTest} disabled={editPatientLabTestSubmitting} className="dialog-footer-button">
                {editPatientLabTestSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </ResizableDialogContent>
      </Dialog>
      </div>
      </div>
    </div>
  );
}

function TestsList({ 
  tests, 
  onSelectTest,
  onEditTest
}: { 
  tests: LabTest[]; 
  onSelectTest: (test: LabTest) => void;
  onEditTest: (test: any) => void;
}) {
  return (
    <Card className="mb-4 bg-white border border-gray-200 shadow-sm rounded-lg">
      <CardContent className="p-0">
        <div className="overflow-x-auto border border-gray-200 rounded">
          <table className="w-full">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">PatientNo</th>
                <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">PatientName</th>
                <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">TestName</th>
                <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">PatientType</th>
                <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">DisplayTestId</th>
                <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">TestCategory</th>
                <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Priority</th>
                <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">LabTestDone</th>
                <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">ReportsUrl</th>
                <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">TestStatus</th>
                <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">TestDoneDateTime</th>
                <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Status</th>
                <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-8 text-gray-500">
                    No lab tests found
                  </td>
                </tr>
              ) : (
                <>
                  {tests.map((test: any) => (
                    <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 text-gray-600 whitespace-nowrap font-mono">{test.patientNo || 'N/A'}</td>
                      <td className="py-4 px-6 text-gray-600 break-words" style={{ maxWidth: '200px' }}>{test.patientName || 'N/A'}</td>
                      <td className="py-4 px-6 text-gray-600 break-words" style={{ maxWidth: '200px' }}>{test.testName || 'N/A'}</td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Badge variant="outline">{test.patientType || 'N/A'}</Badge>
                      </td>
                      <td className="py-4 px-6 text-gray-600 whitespace-nowrap font-mono">{test.displayTestId || test.testId || 'N/A'}</td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Badge variant="outline">{test.testCategory || test.category || 'N/A'}</Badge>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Badge variant={
                          test.priority === 'Emergency' || test.priority === 'Urgent' ? 'destructive' :
                          test.priority === 'Urgent' ? 'default' : 'secondary'
                        }>
                          {test.priority || 'N/A'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Badge variant={test.labTestDone === 'Yes' || test.labTestDone === true ? 'default' : 'outline'}>
                          {test.labTestDone === 'Yes' || test.labTestDone === true ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                        {test.reportsUrl ? (
                          <a href={test.reportsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Report
                          </a>
                        ) : 'N/A'}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          test.testStatus === 'Completed' || test.testStatus === 'completed' ? 'bg-green-100 text-green-700' :
                          test.testStatus === 'In Progress' || test.testStatus === 'InProgress' || test.testStatus === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {test.testStatus || test.status || 'N/A'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600 whitespace-nowrap">
                        {test.testDoneDateTime ? (() => {
                          try {
                            const date = new Date(test.testDoneDateTime);
                            return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
                          } catch (e) {
                            return 'N/A';
                          }
                        })() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Badge variant={(test as any).statusValue === 'Active' || (test as any).statusValue === 'active' ? 'default' : 'outline'}>
                          {(test as any).statusValue || test.status || 'N/A'}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditTest(test)}
                          title="Manage Patient Lab Test"
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
