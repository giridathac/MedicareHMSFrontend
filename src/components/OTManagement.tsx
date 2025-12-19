import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ResizableDialogContent } from './ResizableDialogContent';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Scissors, Plus, Clock, CheckCircle, AlertCircle, Calendar as CalendarIcon, Calendar, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { otRoomsApi } from '../api/otRooms';
import { otSlotsApi } from '../api/otSlots';
import { patientOTAllocationsApi, CreatePatientOTAllocationDto } from '../api/patientOTAllocations';
import { formatDateToDDMMYYYY, formatDateIST, getTodayIST, formatDateDisplayIST } from '../utils/timeUtils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Textarea } from './ui/textarea';
import { cn } from './ui/utils';
import { OTRoom, OTSlot, PatientOTAllocation, Patient, Doctor } from '../types';
import { usePatients } from '../hooks/usePatients';
import { patientsApi } from '../api/patients';
import { doctorsApi } from '../api/doctors';

interface Surgery {
  id: number;
  patientName: string;
  age: number;
  surgeryType: string;
  surgeon: string;
  assistants: string[];
  otNumber: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: string;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: 'Emergency' | 'High' | 'Normal';
  preOpNotes?: string;
  postOpStatus?: string;
}

const mockSurgeries: Surgery[] = [
  {
    id: 1,
    patientName: 'Robert Brown',
    age: 58,
    surgeryType: 'Knee Replacement Surgery',
    surgeon: 'Dr. Michael Chen',
    assistants: ['Dr. Emily Davis', 'Nurse Jane Smith'],
    otNumber: 'OT-1',
    scheduledDate: '2025-11-14',
    scheduledTime: '10:00 AM',
    duration: '3 hours',
    status: 'In Progress',
    priority: 'Normal',
    preOpNotes: 'Patient fasted, anesthesia administered'
  },
  {
    id: 2,
    patientName: 'Sarah Martinez',
    age: 42,
    surgeryType: 'Cardiac Bypass Surgery',
    surgeon: 'Dr. Sarah Johnson',
    assistants: ['Dr. Robert Lee', 'Dr. James Miller'],
    otNumber: 'OT-2',
    scheduledDate: '2025-11-14',
    scheduledTime: '02:00 PM',
    duration: '5 hours',
    status: 'Scheduled',
    priority: 'High',
    preOpNotes: 'ICU bed reserved post-surgery'
  },
  {
    id: 3,
    patientName: 'Michael Johnson',
    age: 35,
    surgeryType: 'Appendectomy',
    surgeon: 'Dr. Emily Davis',
    assistants: ['Dr. Robert Lee'],
    otNumber: 'OT-3',
    scheduledDate: '2025-11-14',
    scheduledTime: '11:00 AM',
    duration: '1.5 hours',
    status: 'Scheduled',
    priority: 'Emergency',
    preOpNotes: 'Emergency case, acute appendicitis'
  },
  {
    id: 4,
    patientName: 'Jennifer White',
    age: 28,
    surgeryType: 'C-Section Delivery',
    surgeon: 'Dr. Maria Garcia',
    assistants: ['Dr. Lisa Anderson', 'Nurse Mary Johnson'],
    otNumber: 'OT-4',
    scheduledDate: '2025-11-13',
    scheduledTime: '09:00 AM',
    duration: '2 hours',
    status: 'Completed',
    priority: 'Normal',
    postOpStatus: 'Mother and baby stable, moved to recovery'
  },
];

interface OTRoom {
  number: string;
  status: string;
  currentSurgery?: string | null;
}

interface OTRoomForDropdown {
  number: string;
  status: string;
  currentSurgery: string | null;
}

export function OTManagement() {
  const [surgeries, setSurgeries] = useState<Surgery[]>(mockSurgeries);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [otRooms, setOtRooms] = useState<OTRoom[]>([]);
  const [otRoomsForDropdown, setOtRoomsForDropdown] = useState<OTRoomForDropdown[]>([]);
  const [otSlotsByRoom, setOTSlotsByRoom] = useState<Map<number, OTSlot[]>>(new Map());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIST());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isUnoccupiedSlotsExpanded, setIsUnoccupiedSlotsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [otRoomsLoading, setOtRoomsLoading] = useState(false);
  const [surgeryDate, setSurgeryDate] = useState<Date | undefined>(undefined);
  const [surgeryDateDisplay, setSurgeryDateDisplay] = useState<string>('');
  const [patientOTAllocations, setPatientOTAllocations] = useState<PatientOTAllocation[]>([]);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [selectedOTId, setSelectedOTId] = useState<string>('');
  const [otSlots, setOTSlots] = useState<OTSlot[]>([]);
  const [addOtAllocationDatePickerOpen, setAddOtAllocationDatePickerOpen] = useState(false);
  const [addOtAllocationDateDisplay, setAddOtAllocationDateDisplay] = useState('');
  const { patients, fetchPatients } = usePatients();
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientHighlightIndex, setPatientHighlightIndex] = useState(-1);
  const [formData, setFormData] = useState({
    patientId: '',
    roomAdmissionId: '',
    patientAppointmentId: '',
    emergencyBedSlotId: '',
    otId: '',
    otSlotIds: [] as number[],
    surgeryId: '',
    leadSurgeonId: '',
    assistantDoctorId: '',
    anaesthetistId: '',
    nurseId: '',
    otAllocationDate: getTodayIST(),
    dateOfOperation: '',
    duration: '',
    otStartTime: '',
    otEndTime: '',
    otActualStartTime: '',
    otActualEndTime: '',
    operationDescription: '',
    operationStatus: 'Scheduled' as PatientOTAllocation['operationStatus'],
    preOperationNotes: '',
    postOperationNotes: '',
    otDocuments: '',
    billId: '',
    status: 'Active' as PatientOTAllocation['status'],
  });

  // Convert string date (YYYY-MM-DD) to Date object
  const getDateFromString = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    try {
      const date = new Date(dateStr + 'T00:00:00+05:30'); // IST timezone
      if (isNaN(date.getTime())) return undefined;
      return date;
    } catch {
      return undefined;
    }
  };
  
  // Convert Date object to string (YYYY-MM-DD)
  const getStringFromDate = (date: Date | undefined): string => {
    if (!date) return getTodayIST();
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return getTodayIST();
    }
  };

  // Helper function to parse date from dd-mm-yyyy format
  const parseDateFromDisplay = (displayStr: string): string => {
    if (!displayStr) return '';
    // Remove any non-digit characters except dashes
    const cleaned = displayStr.replace(/[^\d-]/g, '');
    // Match dd-mm-yyyy or dd-mm-yy format
    const match = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
    if (!match) return '';
    
    let day = parseInt(match[1], 10);
    let month = parseInt(match[2], 10);
    let year = parseInt(match[3], 10);
    
    // Handle 2-digit year (for backward compatibility)
    if (year < 100) {
      year += 2000;
    }
    
    if (day < 1 || day > 31 || month < 1 || month > 12) return '';
    
    try {
      // Create date string in YYYY-MM-DD format
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      // Validate the date
      const date = new Date(`${dateStr}T00:00:00+05:30`); // IST offset
      if (date.getDate() !== day || date.getMonth() !== month - 1) return '';
      return dateStr; // Return YYYY-MM-DD format
    } catch {
      return '';
    }
  };

  // Format date to DD-MM-YYYY for display (for slot status section)
  const formatDateToDDMMYYYYDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const istDate = formatDateIST(dateStr);
      if (!istDate) return '';
      const [year, month, day] = istDate.split('-');
      return `${day}-${month}-${year}`;
    } catch {
      return '';
    }
  };

  // Fetch OT rooms on component mount
  useEffect(() => {
    const fetchOTRooms = async () => {
      try {
        setLoading(true);
        const allOTRooms = await otRoomsApi.getAllLegacy();
        setOtRooms(allOTRooms);
        
        // Also set for dropdown
        const mappedRooms: OTRoomForDropdown[] = allOTRooms.map((ot) => {
          return {
            number: ot.otNo,
            status: ot.status === 'active' ? 'Active' : ot.status,
            currentSurgery: null,
          };
        });
        setOtRoomsForDropdown(mappedRooms);
      } catch (err) {
        console.error('Failed to fetch OT rooms:', err);
        setOtRooms([]);
        setOtRoomsForDropdown([]);
      } finally {
        setLoading(false);
        setOtRoomsLoading(false);
      }
    };
    fetchOTRooms();
  }, []);

  // Fetch OT slots for all rooms when date changes
  useEffect(() => {
    const fetchOTSlots = async () => {
      if (otRooms.length === 0) return;
      
      try {
        setLoadingSlots(true);
        const slotsMap = new Map<number, OTSlot[]>();
        
        // Fetch slots for each OT room
        const slotPromises = otRooms.map(async (room) => {
          try {
            const numericOtId = typeof room.otId === 'string' 
              ? parseInt(room.otId.replace('OT-', ''), 10)
              : room.id;
            
            if (isNaN(numericOtId)) return;
            
            // Pass selectedDate (YYYY-MM-DD) - API will convert to DD-MM-YYYY internally
            const slots = await otSlotsApi.getAll(undefined, numericOtId, selectedDate);
            slotsMap.set(numericOtId, slots);
          } catch (err) {
            console.error(`Failed to fetch slots for OT ${room.otId}:`, err);
          }
        });
        
        await Promise.all(slotPromises);
        setOTSlotsByRoom(slotsMap);
      } catch (err) {
        console.error('Failed to fetch OT slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    };
    
    fetchOTSlots();
  }, [selectedDate, otRooms]);

  // Fetch patient OT allocations
  useEffect(() => {
    const fetchPatientOTAllocations = async () => {
      try {
        setLoadingAllocations(true);
        const allocations = await patientOTAllocationsApi.getAll();
        setPatientOTAllocations(allocations);
        console.log('Fetched patient OT allocations:', allocations);
      } catch (err) {
        console.error('Failed to fetch patient OT allocations:', err);
        setPatientOTAllocations([]);
      } finally {
        setLoadingAllocations(false);
      }
    };
    
    fetchPatientOTAllocations();
  }, []);

  // Fetch OT slots when OT is selected in dialog
  useEffect(() => {
    const fetchOTSlotsForDialog = async () => {
      if (!selectedOTId) {
        setOTSlots([]);
        return;
      }
      
      try {
        const numericOtId = parseInt(selectedOTId, 10);
        if (isNaN(numericOtId)) {
          setOTSlots([]);
          return;
        }
        
        const slots = await otSlotsApi.getAll(undefined, numericOtId);
        setOTSlots(slots);
      } catch (err) {
        console.error('Failed to fetch OT slots for dialog:', err);
        setOTSlots([]);
      }
    };
    
    fetchOTSlotsForDialog();
  }, [selectedOTId]);

  // Helper function to format date for display (dd-mm-yyyy)
  const formatDateToDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const istDate = formatDateIST(dateStr);
      if (!istDate) return '';
      const [year, month, day] = istDate.split('-');
      return `${day}-${month}-${year}`;
    } catch {
      return '';
    }
  };

  // Handle form submission
  const handleAddOTAllocation = async () => {
    // Validate required fields
    if (!formData.otId || !formData.leadSurgeonId || !formData.otAllocationDate) {
      alert('Please fill in all required fields (OT, Lead Surgeon, Date).');
      return;
    }

    // PatientId is required - must come from one of the sources
    if (!formData.patientId && !formData.roomAdmissionId && !formData.patientAppointmentId && !formData.emergencyBedSlotId) {
      alert('Please select a patient source (Patient, Room Admission, Patient Appointment, or Emergency Bed Slot).');
      return;
    }

    // For now, we'll use patientId if available, otherwise we need to fetch it from the selected source
    // This is a simplified version - in production, you'd need to fetch patientId from the selected source
    if (!formData.patientId) {
      alert('Please enter a Patient ID. Patient ID is required.');
      return;
    }

    try {
      const createData: CreatePatientOTAllocationDto = {
        patientId: formData.patientId,
        roomAdmissionId: formData.roomAdmissionId ? Number(formData.roomAdmissionId) : null,
        patientAppointmentId: formData.patientAppointmentId ? Number(formData.patientAppointmentId) : null,
        emergencyBedSlotId: formData.emergencyBedSlotId ? Number(formData.emergencyBedSlotId) : null,
        otId: Number(formData.otId),
        otSlotIds: formData.otSlotIds || [],
        surgeryId: formData.surgeryId ? Number(formData.surgeryId) : null,
        leadSurgeonId: Number(formData.leadSurgeonId),
        assistantDoctorId: formData.assistantDoctorId ? Number(formData.assistantDoctorId) : null,
        anaesthetistId: formData.anaesthetistId ? Number(formData.anaesthetistId) : null,
        nurseId: formData.nurseId ? Number(formData.nurseId) : null,
        otAllocationDate: formData.otAllocationDate,
        dateOfOperation: formData.dateOfOperation || null,
        duration: formData.duration ? Number(formData.duration) : null,
        otStartTime: formData.otStartTime || null,
        otEndTime: formData.otEndTime || null,
        otActualStartTime: formData.otActualStartTime || null,
        otActualEndTime: formData.otActualEndTime || null,
        operationDescription: formData.operationDescription || null,
        operationStatus: formData.operationStatus === 'InProgress' ? 'In Progress' : formData.operationStatus,
        preOperationNotes: formData.preOperationNotes || null,
        postOperationNotes: formData.postOperationNotes || null,
        otDocuments: formData.otDocuments || null,
        billId: formData.billId ? Number(formData.billId) : null,
        status: 'Active',
      };

      await patientOTAllocationsApi.create(createData);
      
      // Refresh allocations
      const allocations = await patientOTAllocationsApi.getAll();
      setPatientOTAllocations(allocations);
      
      // Reset form
      setFormData({
        patientId: '',
        roomAdmissionId: '',
        patientAppointmentId: '',
        emergencyBedSlotId: '',
        otId: '',
        otSlotIds: [],
        surgeryId: '',
        leadSurgeonId: '',
        assistantDoctorId: '',
        anaesthetistId: '',
        nurseId: '',
        otAllocationDate: getTodayIST(),
        dateOfOperation: '',
        duration: '',
        otStartTime: '',
        otEndTime: '',
        otActualStartTime: '',
        otActualEndTime: '',
        operationDescription: '',
        operationStatus: 'Scheduled',
        preOperationNotes: '',
        postOperationNotes: '',
        otDocuments: '',
        billId: '',
        status: 'Active',
      });
      setPatientSearchTerm('');
      setPatientHighlightIndex(-1);
      setSelectedOTId('');
      setAddOtAllocationDateDisplay('');
      setIsDialogOpen(false);
      
      alert('OT Allocation created successfully!');
    } catch (err) {
      console.error('Failed to create OT allocation:', err);
      alert(`Failed to create OT allocation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Filter patient OT allocations by status
  const todayAllocations = patientOTAllocations.filter(a => {
    const allocationDate = formatDateIST(a.otAllocationDate);
    return allocationDate === getTodayIST();
  });
  const inProgress = patientOTAllocations.filter(a => a.operationStatus === 'InProgress');
  const scheduled = patientOTAllocations.filter(a => a.operationStatus === 'Scheduled');
  const completed = patientOTAllocations.filter(a => a.operationStatus === 'Completed');

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="text-center py-12 text-gray-600">Loading OT Management...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
      <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-6 pb-0 flex-shrink-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-gray-900 mb-2">Operation Theater Management</h1>
          <p className="text-gray-500">Schedule and monitor surgical procedures</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Schedule Surgery
            </Button>
          </DialogTrigger>
          <DialogContent className="p-0 gap-0 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
              <DialogTitle>Add New Patient OT Allocation</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 px-6 pb-4 space-y-4">
                <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="font-medium mb-1">Patient Source (Select one):</p>
                  <p className="text-xs">Choose either Patient (Direct OT), Room Admission (IPD), Patient Appointment (OPD), or Emergency Bed</p>
                </div>
                
                <div>
                  <Label htmlFor="add-patientId" className="text-sm font-medium text-gray-700">Patient (Direct OT - Optional)</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="add-patientId"
                      autoComplete="off"
                      placeholder="Search by Patient Name, Patient No, Phone, or Patient ID..."
                      value={patientSearchTerm}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setPatientSearchTerm(newValue);
                        setPatientHighlightIndex(-1);
                        // Clear patient selection if user edits the search term
                        if (formData.patientId) {
                          setFormData({ ...formData, patientId: '', roomAdmissionId: '', patientAppointmentId: '', emergencyBedSlotId: '' });
                        }
                      }}
                      onKeyDown={(e) => {
                        const filteredPatients = patients.filter(patient => {
                          if (!patientSearchTerm) return false;
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
                        });
                        
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setPatientHighlightIndex(prev => 
                            prev < filteredPatients.length - 1 ? prev + 1 : prev
                          );
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setPatientHighlightIndex(prev => prev > 0 ? prev - 1 : -1);
                        } else if (e.key === 'Enter' && patientHighlightIndex >= 0 && filteredPatients[patientHighlightIndex]) {
                          e.preventDefault();
                          const patient = filteredPatients[patientHighlightIndex];
                          const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                          const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                          const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                          const lastName = (patient as any).lastName || (patient as any).LastName || '';
                          const fullName = `${patientName} ${lastName}`.trim();
                          
                          setFormData({ ...formData, patientId, roomAdmissionId: '', patientAppointmentId: '', emergencyBedSlotId: '' });
                          setPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
                          setPatientHighlightIndex(-1);
                        }
                      }}
                      className="pl-10 mt-1"
                    />
                  </div>
                  {patientSearchTerm && (() => {
                    const filteredPatients = patients.filter(patient => {
                      if (!patientSearchTerm) return false;
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
                    });
                    
                    return filteredPatients.length > 0 ? (
                      <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto mt-1" style={{ zIndex: 1000 }}>
                        <table className="w-full">
                          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Patient ID</th>
                              <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Name</th>
                              <th className="text-left py-2 px-3 text-xs text-gray-700 font-bold">Mobile</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPatients.map((patient, index) => {
                              const patientId = (patient as any).patientId || (patient as any).PatientId || '';
                              const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
                              const patientName = (patient as any).patientName || (patient as any).PatientName || '';
                              const lastName = (patient as any).lastName || (patient as any).LastName || '';
                              const fullName = `${patientName} ${lastName}`.trim();
                              const phoneNo = (patient as any).phoneNo || (patient as any).PhoneNo || (patient as any).phone || '';
                              const isSelected = formData.patientId === patientId;
                              const isHighlighted = patientHighlightIndex === index;
                              return (
                                <tr
                                  key={patientId}
                                  onClick={() => {
                                    setFormData({ ...formData, patientId, roomAdmissionId: '', patientAppointmentId: '', emergencyBedSlotId: '' });
                                    setPatientSearchTerm(`${patientNo ? `${patientNo} - ` : ''}${fullName || 'Unknown'}`);
                                    setPatientHighlightIndex(-1);
                                  }}
                                  onMouseDown={(e) => {
                                    // Prevent input from losing focus when clicking on dropdown
                                    e.preventDefault();
                                  }}
                                  className={`cursor-pointer hover:bg-gray-100 ${isSelected ? 'bg-blue-50' : ''} ${isHighlighted ? 'bg-gray-50' : ''}`}
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
                    ) : null;
                  })()}
                  {formData.patientId && (
                    <p className="text-xs text-gray-500 mt-1">Selected Patient ID: {formData.patientId}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="add-roomAdmissionId" className="text-sm font-medium text-gray-700">Room Admission (IPD - Optional)</Label>
                  <Input
                    id="add-roomAdmissionId"
                    placeholder="Enter Room Admission ID"
                    value={formData.roomAdmissionId}
                    onChange={(e) => setFormData({ ...formData, roomAdmissionId: e.target.value, patientId: '', patientAppointmentId: '', emergencyBedSlotId: '' })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="add-patientAppointmentId" className="text-sm font-medium text-gray-700">Patient Appointment (OPD - Optional)</Label>
                  <Input
                    id="add-patientAppointmentId"
                    placeholder="Enter Patient Appointment ID"
                    value={formData.patientAppointmentId}
                    onChange={(e) => setFormData({ ...formData, patientAppointmentId: e.target.value, patientId: '', roomAdmissionId: '', emergencyBedSlotId: '' })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="add-emergencyBedSlotId" className="text-sm font-medium text-gray-700">Emergency Bed Slot (Optional)</Label>
                  <Input
                    id="add-emergencyBedSlotId"
                    type="number"
                    placeholder="Enter Emergency Bed Slot ID"
                    value={formData.emergencyBedSlotId}
                    onChange={(e) => setFormData({ ...formData, emergencyBedSlotId: e.target.value, patientId: '', roomAdmissionId: '', patientAppointmentId: '' })}
                    className="mt-1"
                  />
                </div>

                <div className="border-t pt-4">
                  <div>
                    <Label htmlFor="add-otAllocationDate" className="text-sm font-medium text-gray-700">OT Allocation Date *</Label>
                    <Popover open={addOtAllocationDatePickerOpen} onOpenChange={setAddOtAllocationDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal mt-1"
                        >
                          <Calendar className="mr-2 size-4" />
                          {formData.otAllocationDate ? formatDateToDisplay(formData.otAllocationDate) : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={getDateFromString(formData.otAllocationDate)}
                          onSelect={(date) => {
                            if (date) {
                              const dateStr = getStringFromDate(date);
                              setFormData({ ...formData, otAllocationDate: dateStr });
                              setAddOtAllocationDateDisplay(formatDateToDisplay(dateStr));
                              setAddOtAllocationDatePickerOpen(false);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="add-otId" className="text-sm font-medium text-gray-700">OT *</Label>
                    <select
                      id="add-otId"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md mt-1"
                      value={formData.otId}
                      onChange={(e) => {
                        setSelectedOTId(e.target.value);
                        setFormData({ ...formData, otId: e.target.value, otSlotIds: [] });
                      }}
                    >
                      <option value="">Select OT</option>
                      {otRooms.map(ot => (
                        <option key={ot.id} value={ot.id.toString()}>
                          {ot.otNo} - {ot.otName} ({ot.otType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-700">OT Slots (Optional)</Label>
                    <div className="border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto mt-1">
                      {!formData.otId ? (
                        <p className="text-sm text-gray-500">Please select an OT first</p>
                      ) : otSlots.length === 0 ? (
                        <p className="text-sm text-gray-500">No slots available for this OT</p>
                      ) : (
                        otSlots.map(slot => {
                          const isSlotOccupied = slot.isOccupied === true;
                          return (
                            <label 
                              key={slot.id} 
                              className="flex items-center gap-2 py-1 rounded px-2 cursor-pointer hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                checked={(formData.otSlotIds || []).includes(slot.id)}
                                onChange={(e) => {
                                  const currentSlotIds = formData.otSlotIds || [];
                                  let newSlotIds: number[];
                                  if (e.target.checked) {
                                    newSlotIds = [...currentSlotIds, slot.id];
                                  } else {
                                    newSlotIds = currentSlotIds.filter(id => id !== slot.id);
                                  }
                                  setFormData({ ...formData, otSlotIds: newSlotIds });
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm text-gray-700">
                                {slot.otSlotNo} - {slot.slotStartTime} to {slot.slotEndTime}
                                {isSlotOccupied && <span className="ml-2 text-xs text-red-600">(Occupied)</span>}
                                {slot.isAvailable && !isSlotOccupied && <span className="ml-2 text-xs text-green-600">(Available)</span>}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                    {formData.otSlotIds && formData.otSlotIds.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">Selected: {formData.otSlotIds.length} slot(s)</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="add-leadSurgeonId" className="text-sm font-medium text-gray-700">Lead Surgeon *</Label>
                    <Input
                      id="add-leadSurgeonId"
                      type="number"
                      placeholder="Enter Lead Surgeon ID"
                      value={formData.leadSurgeonId}
                      onChange={(e) => setFormData({ ...formData, leadSurgeonId: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-assistantDoctorId" className="text-sm font-medium text-gray-700">Assistant Doctor (Optional)</Label>
                    <Input
                      id="add-assistantDoctorId"
                      type="number"
                      placeholder="Enter Assistant Doctor ID"
                      value={formData.assistantDoctorId}
                      onChange={(e) => setFormData({ ...formData, assistantDoctorId: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="add-anaesthetistId" className="text-sm font-medium text-gray-700">Anaesthetist (Optional)</Label>
                    <Input
                      id="add-anaesthetistId"
                      type="number"
                      placeholder="Enter Anaesthetist ID"
                      value={formData.anaesthetistId}
                      onChange={(e) => setFormData({ ...formData, anaesthetistId: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-nurseId" className="text-sm font-medium text-gray-700">Nurse (Optional)</Label>
                    <Input
                      id="add-nurseId"
                      type="number"
                      placeholder="Enter Nurse ID"
                      value={formData.nurseId}
                      onChange={(e) => setFormData({ ...formData, nurseId: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="add-duration" className="text-sm font-medium text-gray-700">Duration (Optional, in minutes)</Label>
                  <Input
                    id="add-duration"
                    type="number"
                    placeholder="e.g., 120"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="add-otActualStartTime" className="text-sm font-medium text-gray-700">OT Actual Start Time (Optional)</Label>
                    <Input
                      id="add-otActualStartTime"
                      type="time"
                      value={formData.otActualStartTime}
                      onChange={(e) => setFormData({ ...formData, otActualStartTime: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-otActualEndTime" className="text-sm font-medium text-gray-700">OT Actual End Time (Optional)</Label>
                    <Input
                      id="add-otActualEndTime"
                      type="time"
                      value={formData.otActualEndTime}
                      onChange={(e) => setFormData({ ...formData, otActualEndTime: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="add-operationDescription" className="text-sm font-medium text-gray-700">Operation Description (Optional)</Label>
                  <Textarea
                    id="add-operationDescription"
                    placeholder="Enter operation description..."
                    value={formData.operationDescription}
                    onChange={(e) => setFormData({ ...formData, operationDescription: e.target.value })}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="add-operationStatus" className="text-sm font-medium text-gray-700">Operation Status</Label>
                  <select
                    id="add-operationStatus"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md mt-1"
                    value={formData.operationStatus}
                    onChange={(e) => setFormData({ ...formData, operationStatus: e.target.value as PatientOTAllocation['operationStatus'] })}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Postponed">Postponed</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="add-preOperationNotes" className="text-sm font-medium text-gray-700">Pre Operation Notes (Optional)</Label>
                  <Textarea
                    id="add-preOperationNotes"
                    placeholder="e.g., ICU bed reserved post-surgery"
                    value={formData.preOperationNotes}
                    onChange={(e) => setFormData({ ...formData, preOperationNotes: e.target.value })}
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="add-postOperationNotes" className="text-sm font-medium text-gray-700">Post Operation Notes (Optional)</Label>
                  <Textarea
                    id="add-postOperationNotes"
                    placeholder="Enter post operation notes..."
                    value={formData.postOperationNotes}
                    onChange={(e) => setFormData({ ...formData, postOperationNotes: e.target.value })}
                    rows={2}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="add-otDocuments" className="text-sm font-medium text-gray-700">OT Documents URL (Optional)</Label>
                  <Input
                    id="add-otDocuments"
                    type="url"
                    placeholder="https://documents.example.com/..."
                    value={formData.otDocuments}
                    onChange={(e) => setFormData({ ...formData, otDocuments: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="add-billId" className="text-sm font-medium text-gray-700">Bill ID (Optional)</Label>
                  <Input
                    id="add-billId"
                    type="number"
                    placeholder="Enter Bill ID"
                    value={formData.billId}
                    onChange={(e) => setFormData({ ...formData, billId: e.target.value })}
                    className="mt-1"
                  />
                </div>
            </div>
            <div className="flex justify-end gap-2 px-6 pb-4 pt-4 border-t flex-shrink-0">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddOTAllocation}>Add OT Allocation</Button>
            </div>
          </DialogContent>
        </Dialog>
          </div>
        </div>
        <div className="px-6 pt-4 pb-4 flex-1">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Today's Surgeries</p>
              <Scissors className="size-5 text-blue-600" />
            </div>
            <h3 className="text-gray-900">{todayAllocations.length}</h3>
            <p className="text-xs text-gray-500">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">In Progress</p>
              <Badge variant="default">{inProgress.length}</Badge>
            </div>
            <h3 className="text-gray-900">{inProgress.length}</h3>
            <p className="text-xs text-gray-500">Currently ongoing</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Scheduled</p>
              <Clock className="size-5 text-orange-600" />
            </div>
            <h3 className="text-gray-900">{scheduled.length}</h3>
            <p className="text-xs text-gray-500">Upcoming surgeries</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Completed</p>
              <CheckCircle className="size-5 text-green-600" />
            </div>
            <h3 className="text-gray-900">{completed.length}</h3>
            <p className="text-xs text-gray-500">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* OT Room Slot Status */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle>OT Room Slot Status</CardTitle>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-40 justify-start text-left font-normal"
                >
                  <Calendar className="mr-2 size-4" />
                  {selectedDate ? formatDateToDDMMYYYYDisplay(selectedDate) : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="start" style={{ opacity: 1 }}>
                <CalendarComponent
                  mode="single"
                  selected={getDateFromString(selectedDate)}
                  onSelect={(date) => {
                    if (date) {
                      const dateStr = getStringFromDate(date);
                      setSelectedDate(dateStr);
                      setDatePickerOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading OT rooms...</div>
          ) : loadingSlots ? (
            <div className="text-center py-8 text-gray-500">Loading slots...</div>
          ) : (
            (() => {
              // Collect all occupied and unoccupied slots from all rooms
              const allOccupiedSlots: Array<{ slot: OTSlot; room: OTRoom }> = [];
              const allUnoccupiedSlots: Array<{ slot: OTSlot; room: OTRoom }> = [];
              
              otRooms.forEach((ot) => {
                const numericOtId = typeof ot.otId === 'string' 
                  ? parseInt(ot.otId.replace('OT-', ''), 10)
                  : ot.id;
                const slots = otSlotsByRoom.get(numericOtId) || [];
                // Only consider a slot as occupied if it's actually not available for the selected date
                const occupiedSlots = slots.filter(s => s.isOccupied === true && s.isAvailable === false);
                const unoccupiedSlots = slots.filter(s => s.isAvailable === true || (s.isOccupied !== true && s.isAvailable !== false));
                
                occupiedSlots.forEach(slot => {
                  allOccupiedSlots.push({ slot, room: ot });
                });
                
                unoccupiedSlots.forEach(slot => {
                  allUnoccupiedSlots.push({ slot, room: ot });
                });
              });
              
              if (allOccupiedSlots.length === 0 && allUnoccupiedSlots.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    No slots found for the selected date
                  </div>
                );
              }
              
              return (
                <>
                  {/* Occupied Slots Section */}
                  {allOccupiedSlots.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Occupied ({allOccupiedSlots.length})</h3>
                      <div className="grid grid-cols-4 gap-4">
                        {allOccupiedSlots.map(({ slot, room }) => {
                    const operationStatus = slot.operationStatus;
                    const isCompleted = operationStatus === 'Completed';
                    const isScheduled = operationStatus === 'Scheduled';
                    const isInProgress = operationStatus === 'InProgress';
                    
                    return (
                            <div
                              key={`${room.id}-${slot.id}`}
                              className="p-3 border-2 rounded-lg border-red-300 bg-red-50"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="text-sm font-semibold text-gray-900">
                                    {room.otName || room.otNo || room.otId}
                                  </h3>
                                  {room.otType && (
                                    <p className="text-xs text-gray-500">
                                      {room.otType}
                                    </p>
                                  )}
                                </div>
                                <span className="size-3 rounded-full bg-red-500" />
                              </div>
                              
                              {/* Slot Time */}
                              {slot.slotStartTime && slot.slotEndTime && (
                                <div className="mb-2">
                                  <p className="text-xs text-gray-500 mb-0.5">
                                    {slot.otSlotNo || `Slot ${slot.id}`}
                                  </p>
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <Clock className="size-3 text-gray-600" />
                                    <span className="font-medium text-gray-700">
                                      {slot.slotStartTime} - {slot.slotEndTime}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Patient Information */}
                              {slot.patientName && (
                                <div className="mb-1.5">
                                  <p className="text-xs text-gray-500 mb-0.5">Patient</p>
                                  <p className="text-xs font-medium text-gray-900">{slot.patientName}</p>
                                  {slot.patientNo && (
                                    <p className="text-xs text-gray-500">No: {slot.patientNo}</p>
                                  )}
                                </div>
                              )}
                              
                              {/* Operation Status */}
                              {isInProgress && (
                                <div className="flex items-center gap-1.5 p-1.5 bg-red-50 rounded mb-1.5">
                                  <Scissors className="size-3 text-red-600" />
                                  <span className="text-xs font-medium text-red-900">In Progress</span>
                                </div>
                              )}
                              {isScheduled && (
                                <div className="flex items-center gap-1.5 p-1.5 bg-yellow-50 rounded mb-1.5">
                                  <Clock className="size-3 text-yellow-600" />
                                  <span className="text-xs font-medium text-yellow-900">Scheduled</span>
                                </div>
                              )}
                              {isCompleted && (
                                <div className="flex items-center gap-1.5 p-1.5 bg-blue-50 rounded mb-1.5">
                                  <CheckCircle className="size-3 text-blue-600" />
                                  <span className="text-xs font-medium text-blue-900">Completed</span>
                                </div>
                              )}
                            </div>
                          );
                  })}
                      </div>
                    </div>
                  )}
                  
                  {/* Unoccupied Slots Section - Collapsible */}
                  {allUnoccupiedSlots.length > 0 && (
                    <div>
                      <button
                        onClick={() => setIsUnoccupiedSlotsExpanded(!isUnoccupiedSlotsExpanded)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 hover:text-gray-900"
                      >
                        {isUnoccupiedSlotsExpanded ? (
                          <>
                            <ChevronUp className="size-4" />
                            Hide Unoccupied ({allUnoccupiedSlots.length})
                          </>
                        ) : (
                          <>
                            <Plus className="size-4" />
                            Show Unoccupied ({allUnoccupiedSlots.length})
                          </>
                        )}
                      </button>
                      {isUnoccupiedSlotsExpanded && (
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          {allUnoccupiedSlots.map(({ slot, room }) => {
                            return (
                              <div
                                key={`${room.id}-${slot.id}`}
                                className="p-3 border-2 rounded-lg border-green-300 bg-green-50"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <h3 className="text-sm font-semibold text-gray-900">
                                      {room.otName || room.otNo || room.otId}
                                    </h3>
                                    {room.otType && (
                                      <p className="text-xs text-gray-500">
                                        {room.otType}
                                      </p>
                                    )}
                                  </div>
                                  <span className="size-3 rounded-full bg-green-500" />
                                </div>
                                
                                {/* Slot Time */}
                                {slot.slotStartTime && slot.slotEndTime && (
                                  <div>
                                    <p className="text-xs text-gray-500 mb-0.5">
                                      {slot.otSlotNo || `Slot ${slot.id}`}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <Clock className="size-3 text-gray-600" />
                                      <span className="font-medium text-gray-700">
                                        {slot.slotStartTime} - {slot.slotEndTime}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()
          )}
        </CardContent>
      </Card>

      {/* Surgeries List */}
      <Tabs defaultValue="today" className="space-y-6">
        <TabsList>
          <TabsTrigger value="today">Today's Surgeries ({todayAllocations.length})</TabsTrigger>
          <TabsTrigger value="progress">In Progress ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({scheduled.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <AllocationList allocations={todayAllocations} otRooms={otRooms} otSlotsByRoom={otSlotsByRoom} />
        </TabsContent>
        <TabsContent value="progress">
          <AllocationList allocations={inProgress} otRooms={otRooms} otSlotsByRoom={otSlotsByRoom} />
        </TabsContent>
        <TabsContent value="scheduled">
          <AllocationList allocations={scheduled} otRooms={otRooms} otSlotsByRoom={otSlotsByRoom} />
        </TabsContent>
        <TabsContent value="completed">
          <AllocationList allocations={completed} otRooms={otRooms} otSlotsByRoom={otSlotsByRoom} />
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
}

function AllocationList({ allocations, otRooms, otSlotsByRoom }: { allocations: PatientOTAllocation[]; otRooms: OTRoom[]; otSlotsByRoom: Map<number, OTSlot[]> }) {
  const [fetchedPatients, setFetchedPatients] = useState<Map<string, Patient>>(new Map());
  const fetchingRef = useRef<Set<string>>(new Set());
  const [fetchedDoctors, setFetchedDoctors] = useState<Map<number, Doctor>>(new Map());
  const fetchingDoctorsRef = useRef<Set<number>>(new Set());
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<PatientOTAllocation | null>(null);

  // Fetch patients for each unique patientId in allocations
  useEffect(() => {
    if (!allocations || allocations.length === 0) return;

    const uniquePatientIds = new Set<string>();
    allocations.forEach(allocation => {
      if (allocation?.patientId) {
        uniquePatientIds.add(allocation.patientId);
      }
    });

    // Fetch patients that we don't already have
    uniquePatientIds.forEach(patientId => {
      // Check if we already have this patient or are currently fetching it
      setFetchedPatients(prev => {
        if (prev.has(patientId) || fetchingRef.current.has(patientId)) {
          return prev; // Already fetched or fetching
        }
        
        // Mark as fetching
        fetchingRef.current.add(patientId);
        
        // Fetch patient
        patientsApi.getById(patientId)
          .then(patient => {
            setFetchedPatients(prevPatients => {
              const newMap = new Map(prevPatients);
              newMap.set(patientId, patient);
              return newMap;
            });
          })
          .catch(error => {
            console.error(`Error fetching patient ${patientId}:`, error);
          })
          .finally(() => {
            fetchingRef.current.delete(patientId);
          });
        
        return prev;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allocations]);

  // Fetch doctors for each unique leadSurgeonId in allocations
  useEffect(() => {
    if (!allocations || allocations.length === 0) return;

    const uniqueSurgeonIds = new Set<number>();
    allocations.forEach(allocation => {
      if (allocation?.leadSurgeonId && typeof allocation.leadSurgeonId === 'number') {
        uniqueSurgeonIds.add(allocation.leadSurgeonId);
      }
    });

    // Fetch doctors that we don't already have
    uniqueSurgeonIds.forEach(surgeonId => {
      // Check if we already have this doctor or are currently fetching it
      setFetchedDoctors(prev => {
        if (prev.has(surgeonId) || fetchingDoctorsRef.current.has(surgeonId)) {
          return prev; // Already fetched or fetching
        }
        
        // Mark as fetching
        fetchingDoctorsRef.current.add(surgeonId);
        
        // Fetch doctor
        doctorsApi.getById(surgeonId)
          .then(doctor => {
            setFetchedDoctors(prevDoctors => {
              const newMap = new Map(prevDoctors);
              newMap.set(surgeonId, doctor);
              return newMap;
            });
          })
          .catch(error => {
            console.error(`Error fetching doctor ${surgeonId}:`, error);
          })
          .finally(() => {
            fetchingDoctorsRef.current.delete(surgeonId);
          });
        
        return prev;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allocations]);

  const getStatusBadge = (status: PatientOTAllocation['operationStatus']) => {
    const statusMap = {
      'Scheduled': { bg: 'bg-orange-100', text: 'text-orange-700' },
      'InProgress': { bg: 'bg-blue-100', text: 'text-blue-700' },
      'Completed': { bg: 'bg-green-100', text: 'text-green-700' },
      'Cancelled': { bg: 'bg-red-100', text: 'text-red-700' },
      'Postponed': { bg: 'bg-gray-100', text: 'text-gray-700' },
    };
    const statusStyle = statusMap[status] || statusMap['Scheduled'];
    return (
      <span className={`px-3 py-1 rounded-full text-xs ${statusStyle.bg} ${statusStyle.text}`}>
        {status === 'InProgress' ? 'In Progress' : status}
      </span>
    );
  };

  // Helper function to format slot numbers
  const formatSlotNumbers = (allocation: PatientOTAllocation, otId: number): string => {
    try {
      if (!allocation || !allocation.otSlotIds || allocation.otSlotIds.length === 0) {
        return '';
      }

      if (!otSlotsByRoom || !otId) {
        return '';
      }

      const slots = otSlotsByRoom.get(otId) || [];
      if (!slots || slots.length === 0) {
        return '';
      }

      const allocationSlots = slots.filter(slot => slot && allocation.otSlotIds?.includes(slot.id));
      
      if (allocationSlots.length === 0) {
        return '';
      }

      // Sort slots by slot number for consistent display
      const sortedSlots = [...allocationSlots].sort((a, b) => {
        const slotNoA = (a?.otSlotNo || '').toString();
        const slotNoB = (b?.otSlotNo || '').toString();
        return slotNoA.localeCompare(slotNoB);
      });

      // Display slot numbers with "slots:" prefix and no spaces after commas
      const slotNumbers = sortedSlots.map(slot => {
        return slot?.otSlotNo || `Slot ${slot?.id || ''}`;
      }).filter(Boolean).join(',');
      
      return slotNumbers ? `slots: ${slotNumbers}` : '';
    } catch (error) {
      console.error('Error formatting slot numbers:', error);
      return '';
    }
  };

  // Helper function to find longest contiguous time range from slots
  const getLongestContiguousTimeRange = (allocation: PatientOTAllocation, otId: number): string => {
    try {
      if (!allocation || !allocation.otSlotIds || allocation.otSlotIds.length === 0) {
        return '';
      }

      if (!otSlotsByRoom || !otId) {
        return '';
      }

      const slots = otSlotsByRoom.get(otId) || [];
      if (!slots || slots.length === 0) {
        return '';
      }

      const allocationSlots = slots.filter(slot => slot && allocation.otSlotIds?.includes(slot.id));
      
      if (allocationSlots.length === 0) {
        return '';
      }

      // Sort slots by start time
      const sortedSlots = [...allocationSlots].sort((a, b) => {
        const timeA = a?.slotStartTime || '';
        const timeB = b?.slotStartTime || '';
        return timeA.localeCompare(timeB);
      });

      // Find all contiguous ranges
      const contiguousRanges: Array<{ start: string; end: string; length: number }> = [];
      let currentRange: { start: string; end: string; slots: typeof sortedSlots } | null = null;

      for (let i = 0; i < sortedSlots.length; i++) {
        const slot = sortedSlots[i];
        if (!slot?.slotStartTime || !slot?.slotEndTime) continue;

        if (!currentRange) {
          // Start a new range
          currentRange = {
            start: slot.slotStartTime,
            end: slot.slotEndTime,
            slots: [slot]
          };
        } else {
          // Check if this slot is contiguous with the current range
          if (currentRange.end === slot.slotStartTime) {
            // Contiguous - extend the range
            currentRange.end = slot.slotEndTime;
            currentRange.slots.push(slot);
          } else {
            // Not contiguous - save current range and start a new one
            contiguousRanges.push({
              start: currentRange.start,
              end: currentRange.end,
              length: currentRange.slots.length
            });
            currentRange = {
              start: slot.slotStartTime,
              end: slot.slotEndTime,
              slots: [slot]
            };
          }
        }
      }

      // Don't forget to add the last range
      if (currentRange) {
        contiguousRanges.push({
          start: currentRange.start,
          end: currentRange.end,
          length: currentRange.slots.length
        });
      }

      if (contiguousRanges.length === 0) {
        return '';
      }

      // Find the longest contiguous range
      const longestRange = contiguousRanges.reduce((longest, current) => {
        return current.length > longest.length ? current : longest;
      }, contiguousRanges[0]);

      return `${longestRange.start} - ${longestRange.end}`;
    } catch (error) {
      console.error('Error calculating contiguous time range:', error);
      return '';
    }
  };

  // Helper function to calculate duration from time range
  const calculateDurationFromTimeRange = (timeRange: string): string => {
    try {
      if (!timeRange || !timeRange.includes(' - ')) {
        return '';
      }

      const [startTime, endTime] = timeRange.split(' - ');
      if (!startTime || !endTime) {
        return '';
      }

      // Parse time strings (format: HH:MM or HH:MM:SS)
      const parseTime = (timeStr: string): number => {
        const parts = timeStr.trim().split(':');
        if (parts.length < 2) return 0;
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        return hours * 60 + minutes; // Convert to total minutes
      };

      const startMinutes = parseTime(startTime);
      const endMinutes = parseTime(endTime);

      if (startMinutes === 0 && endMinutes === 0) {
        return '';
      }

      // Handle case where end time is next day (e.g., 23:00 - 01:00)
      let durationMinutes = endMinutes - startMinutes;
      if (durationMinutes < 0) {
        // Assume it wraps to next day
        durationMinutes = (24 * 60) + durationMinutes;
      }

      if (durationMinutes === 0) {
        return '';
      }

      // Format duration
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else {
        return `${minutes}m`;
      }
    } catch (error) {
      console.error('Error calculating duration from time range:', error);
      return '';
    }
  };

  if (!allocations || !Array.isArray(allocations)) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            No allocations available
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allocations.map((allocation) => {
        if (!allocation) return null;
        
        const otRoom = otRooms?.find(ot => ot && ot.id === allocation.otId);
        // Look up patient by patientId from fetched patients
        const patient = allocation.patientId ? fetchedPatients.get(allocation.patientId) : null;
        const patientName = patient 
          ? `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() 
          : (allocation as any)?.PatientName || '';
        const patientNo = patient 
          ? (patient as any).PatientNo || (patient as any).patientNo || ''
          : (allocation as any)?.PatientNo || '';
        const surgeon = allocation.leadSurgeonId && typeof allocation.leadSurgeonId === 'number' 
          ? fetchedDoctors.get(allocation.leadSurgeonId) 
          : null;
        const surgeonName = surgeon?.name || (allocation as any)?.LeadSurgeonName || '';
        const otNumber = otRoom?.otNo || `OT-${allocation.otId || ''}`;
        const operationDescription = allocation.operationDescription || 'Operation';
        const allocationDate = allocation.otAllocationDate ? formatDateDisplayIST(allocation.otAllocationDate, 'numeric') : '';
        const allocationTime = allocation.otActualStartTime || allocation.otStartTime || '';
        const slotNumbers = formatSlotNumbers(allocation, allocation.otId || 0);
        const contiguousTimeRange = getLongestContiguousTimeRange(allocation, allocation.otId || 0);
        const calculatedDuration = contiguousTimeRange ? calculateDurationFromTimeRange(contiguousTimeRange) : '';
        const duration = calculatedDuration || (allocation.duration ? `${allocation.duration} minutes` : '-');

        return (
          <Card key={allocation.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex flex-col">
                      <Badge className="text-base">{otNumber}</Badge>
                      {slotNumbers && (
                        <p className="text-xs text-gray-500 mt-1">{slotNumbers}</p>
                      )}
                    </div>
                    <h3 className="text-gray-900">{operationDescription}</h3>
                    {getStatusBadge(allocation.operationStatus)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Patient</p>
                      <p className="text-gray-900">
                        {patientName || patientNo || '-'}
                        {patientNo && <span className="text-gray-500"> ({patientNo})</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Lead Surgeon</p>
                      <p className="text-gray-900">{surgeonName || (allocation.leadSurgeonId ? `ID: ${allocation.leadSurgeonId}` : '-')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="text-gray-900">
                        {allocationDate}
                        {allocationTime && ` at ${allocationTime}`}
                      </p>
                      {contiguousTimeRange && (
                        <p className="text-xs text-gray-600 mt-1">{contiguousTimeRange}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="text-gray-900">{duration}</p>
                      {calculatedDuration && (
                        <p className="text-xs text-gray-600 mt-1">(from slots)</p>
                      )}
                    </div>
                  </div>
                  {allocation.preOperationNotes && (
                    <div className="p-3 bg-gray-50 rounded-lg mb-3">
                      <p className="text-sm text-gray-500 mb-1">Pre-Op Notes</p>
                      <p className="text-sm text-gray-900">{allocation.preOperationNotes}</p>
                    </div>
                  )}
                  {allocation.postOperationNotes && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700 mb-1">Post-Op Status</p>
                      <p className="text-sm text-green-900">{allocation.postOperationNotes}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedAllocation(allocation);
                      setIsViewDetailsDialogOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                  {allocation.operationStatus === 'Scheduled' && (
                    <Button size="sm" variant="default">Start Surgery</Button>
                  )}
                  {allocation.operationStatus === 'InProgress' && (
                    <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                      Complete Surgery
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {allocations.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            No allocations found
          </CardContent>
        </Card>
      )}

      {/* View Details Dialog */}
      <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
        <ResizableDialogContent className="p-0 gap-0 large-dialog dialog-content-standard">
          <div className="dialog-scrollable-wrapper dialog-content-scrollable">
            <DialogHeader className="dialog-header-standard">
              <DialogTitle className="dialog-title-standard">Operation Details</DialogTitle>
            </DialogHeader>
            <div className="dialog-body-content-wrapper">
              {selectedAllocation && (() => {
                const otRoom = otRooms?.find(ot => ot && ot.id === selectedAllocation.otId);
                const patient = selectedAllocation.patientId ? fetchedPatients.get(selectedAllocation.patientId) : null;
                const patientName = patient 
                  ? `${(patient as any).PatientName || (patient as any).patientName || ''} ${(patient as any).LastName || (patient as any).lastName || ''}`.trim() 
                  : (selectedAllocation as any)?.PatientName || '';
                const patientNo = patient 
                  ? (patient as any).PatientNo || (patient as any).patientNo || ''
                  : (selectedAllocation as any)?.PatientNo || '';
                const surgeon = selectedAllocation.leadSurgeonId && typeof selectedAllocation.leadSurgeonId === 'number' 
                  ? fetchedDoctors.get(selectedAllocation.leadSurgeonId) 
                  : null;
                const surgeonName = surgeon?.name || (selectedAllocation as any)?.LeadSurgeonName || '';
                const otNumber = otRoom?.otNo || `OT-${selectedAllocation.otId || ''}`;
                const operationDescription = selectedAllocation.operationDescription || 'Operation';
                const allocationDate = selectedAllocation.otAllocationDate ? formatDateDisplayIST(selectedAllocation.otAllocationDate, 'numeric') : '';
                const allocationTime = selectedAllocation.otActualStartTime || selectedAllocation.otStartTime || '';
                const slotNumbers = formatSlotNumbers(selectedAllocation, selectedAllocation.otId || 0);
                const contiguousTimeRange = getLongestContiguousTimeRange(selectedAllocation, selectedAllocation.otId || 0);
                const calculatedDuration = contiguousTimeRange ? calculateDurationFromTimeRange(contiguousTimeRange) : '';
                const duration = calculatedDuration || (selectedAllocation.duration ? `${selectedAllocation.duration} minutes` : '-');

                return (
                  <div className="dialog-form-container space-y-4">
                    <div className="dialog-form-field-grid">
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">OT Number</Label>
                        <Input
                          value={otNumber}
                          disabled
                          className="dialog-input-standard dialog-input-disabled"
                        />
                      </div>
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">Operation Status</Label>
                        <div className="mt-1">
                          {getStatusBadge(selectedAllocation.operationStatus)}
                        </div>
                      </div>
                    </div>

                    <div className="dialog-form-field">
                      <Label className="dialog-label-standard">Operation Description</Label>
                      <Input
                        value={operationDescription}
                        disabled
                        className="dialog-input-standard dialog-input-disabled"
                      />
                    </div>

                    <div className="dialog-form-field-grid">
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">Patient Name</Label>
                        <Input
                          value={patientName || '-'}
                          disabled
                          className="dialog-input-standard dialog-input-disabled"
                        />
                      </div>
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">Patient No</Label>
                        <Input
                          value={patientNo || '-'}
                          disabled
                          className="dialog-input-standard dialog-input-disabled"
                        />
                      </div>
                    </div>

                    <div className="dialog-form-field">
                      <Label className="dialog-label-standard">Lead Surgeon</Label>
                      <Input
                        value={surgeonName || (selectedAllocation.leadSurgeonId ? `ID: ${selectedAllocation.leadSurgeonId}` : '-')}
                        disabled
                        className="dialog-input-standard dialog-input-disabled"
                      />
                    </div>

                    <div className="dialog-form-field-grid">
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">OT Allocation Date</Label>
                        <Input
                          value={allocationDate || '-'}
                          disabled
                          className="dialog-input-standard dialog-input-disabled"
                        />
                      </div>
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">Date of Operation</Label>
                        <Input
                          value={selectedAllocation.dateOfOperation ? formatDateDisplayIST(selectedAllocation.dateOfOperation, 'numeric') : '-'}
                          disabled
                          className="dialog-input-standard dialog-input-disabled"
                        />
                      </div>
                    </div>

                    <div className="dialog-form-field-grid">
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">Start Time</Label>
                        <Input
                          value={selectedAllocation.otStartTime || '-'}
                          disabled
                          className="dialog-input-standard dialog-input-disabled"
                        />
                      </div>
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">End Time</Label>
                        <Input
                          value={selectedAllocation.otEndTime || '-'}
                          disabled
                          className="dialog-input-standard dialog-input-disabled"
                        />
                      </div>
                    </div>

                    {selectedAllocation.otActualStartTime && (
                      <div className="dialog-form-field-grid">
                        <div className="dialog-form-field">
                          <Label className="dialog-label-standard">Actual Start Time</Label>
                          <Input
                            value={selectedAllocation.otActualStartTime}
                            disabled
                            className="dialog-input-standard dialog-input-disabled"
                          />
                        </div>
                        <div className="dialog-form-field">
                          <Label className="dialog-label-standard">Actual End Time</Label>
                          <Input
                            value={selectedAllocation.otActualEndTime || '-'}
                            disabled
                            className="dialog-input-standard dialog-input-disabled"
                          />
                        </div>
                      </div>
                    )}

                    {slotNumbers && (
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">OT Slots</Label>
                        <Input
                          value={slotNumbers}
                          disabled
                          className="dialog-input-standard dialog-input-disabled"
                        />
                      </div>
                    )}

                    {contiguousTimeRange && (
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">Time Range</Label>
                        <Input
                          value={contiguousTimeRange}
                          disabled
                          className="dialog-input-standard dialog-input-disabled"
                        />
                      </div>
                    )}

                    <div className="dialog-form-field">
                      <Label className="dialog-label-standard">Duration</Label>
                      <Input
                        value={duration}
                        disabled
                        className="dialog-input-standard dialog-input-disabled"
                      />
                    </div>

                    {selectedAllocation.preOperationNotes && (
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">Pre-Operation Notes</Label>
                        <Textarea
                          value={selectedAllocation.preOperationNotes}
                          disabled
                          rows={4}
                          className="dialog-textarea-standard dialog-input-disabled"
                        />
                      </div>
                    )}

                    {selectedAllocation.postOperationNotes && (
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">Post-Operation Notes</Label>
                        <Textarea
                          value={selectedAllocation.postOperationNotes}
                          disabled
                          rows={4}
                          className="dialog-textarea-standard dialog-input-disabled"
                        />
                      </div>
                    )}

                    {selectedAllocation.otDocuments && (
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">OT Documents URL</Label>
                        <Input
                          value={selectedAllocation.otDocuments}
                          disabled
                          className="dialog-input-standard dialog-input-disabled"
                        />
                      </div>
                    )}

                    {selectedAllocation.billId && (
                      <div className="dialog-form-field">
                        <Label className="dialog-label-standard">Bill ID</Label>
                        <Input
                          value={selectedAllocation.billId}
                          disabled
                          className="dialog-input-standard dialog-input-disabled"
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsViewDetailsDialogOpen(false)}
                        className="dialog-footer-button"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </ResizableDialogContent>
      </Dialog>
    </div>
  );
}
