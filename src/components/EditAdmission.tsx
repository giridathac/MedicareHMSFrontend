import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import { BedDouble, Search, User, Calendar, Edit, ArrowLeft } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';

import { useAdmissions } from '../hooks/useAdmissions';

import { Admission } from '../api/admissions';
import { admissionsApi } from '../api/admissions';
import { roomBedsApi } from '../api/roomBeds';
import { doctorsApi } from '../api/doctors';
import { apiRequest } from '../api/base';

import { formatDateTimeIST } from '../utils/timeUtils';

export default function EditAdmission() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateAdmission } = useAdmissions();

  const [editingAdmission, setEditingAdmission] = useState<Admission | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [roomBedSearchTerm, setRoomBedSearchTerm] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [patientOptions, setPatientOptions] = useState<any[]>([]);
  const [roomBedOptions, setRoomBedOptions] = useState<any[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<any[]>([]);
  const [availableAppointments, setAvailableAppointments] = useState<any[]>([]);
  const [availableEmergencyBedSlots, setAvailableEmergencyBedSlots] = useState<any[]>([]);
  const [availableIPDAdmissions, setAvailableIPDAdmissions] = useState<any[]>([]);
  const [roomAllocationDate, setRoomAllocationDate] = useState<Date | null>(null);
  const [addAdmissionForm, setAddAdmissionForm] = useState({
    patientId: '',
    patientType: '',
    patientAppointmentId: '',
    emergencyBedSlotId: '',
    roomBedId: '',
    roomBedsId: '',
    roomType: '',
    admittedBy: '',
    admittedByDoctorId: '',
    doctorId: '',
    diagnosis: '',
    roomAllocationDate: '',
    admissionStatus: 'Active',
    caseSheet: '',
    caseDetails: '',
    isLinkedToICU: 'No',
    patientNo: '',
    age: '',
    gender: '',
    patientName: '',
    bedNumber: '',
    appointmentTokenNo: '',
    appointmentDate: '',
    emergencyBedNo: '',
    eBedSlotNo: '',
    emergencyAdmissionDate: '',
    roomVacantDate: '',
    shiftToAnotherRoom: '',
    shiftedTo: '',
    shiftedToDetails: '',
    scheduleOT: '',
    otAdmissionId: '',
    icuAdmissionId: '',
    billId: '',
    estimatedStay: '',
    createdAt: '',
    createdDate: '',
  });
  const [savingAdmission, setSavingAdmission] = useState(false);
  const [admissionError, setAdmissionError] = useState<string | null>(null);

  // Load admission data based on roomAdmissionId from URL params
  useEffect(() => {
    const roomAdmissionId = searchParams.get('roomAdmissionId');
    if (roomAdmissionId) {
      loadAdmissionData(roomAdmissionId);
    }
  }, [searchParams]);

  const loadAdmissionData = async (roomAdmissionId: string) => {
    try {
      // Fetch admission details
      const admissions = await admissionsApi.getAll();
      const admission = admissions.find((a: Admission) => a.roomAdmissionId === roomAdmissionId || a.admissionId === roomAdmissionId);
      if (!admission) {
        setAdmissionError('Admission not found');
        return;
      }
      setEditingAdmission(admission);

      // Load patient, room bed, and doctor options
      let roomBedsList: any[] = [];
      try {
        const patientsList = await admissionsApi.getPatientRegistrations();
        setPatientOptions(patientsList || []);

        roomBedsList = await roomBedsApi.getAll();
        setRoomBedOptions(roomBedsList || []);

        const doctorsList = await doctorsApi.getAll();
        setDoctorOptions(doctorsList || []);
      } catch (err) {
        console.error('Error loading options for edit:', err);
      }

      // Pre-populate form with admission data
      const admissionStatusValue = admission.admissionStatus || admission.status || 'Active';
      const normalizedStatus = (admissionStatusValue === 'Discharged' ||
                               admissionStatusValue === 'Moved to ICU' ||
                               admissionStatusValue === 'Surgery Scheduled' ||
                               admissionStatusValue === 'Active')
                               ? admissionStatusValue
                               : 'Active';

      const isLinkedToICUValue = admission.isLinkedToICU;
      let isLinkedToICUString = 'No';
      if (isLinkedToICUValue !== undefined && isLinkedToICUValue !== null) {
        if (typeof isLinkedToICUValue === 'boolean') {
          isLinkedToICUString = isLinkedToICUValue ? 'Yes' : 'No';
        } else if (typeof isLinkedToICUValue === 'string') {
          const lower = String(isLinkedToICUValue).toLowerCase();
          isLinkedToICUString = (lower === 'true' || lower === 'yes' || lower === '1') ? 'Yes' : 'No';
        }
      }

      const scheduleOTValue = admission.scheduleOT;
      let scheduleOTString = 'No';
      if (scheduleOTValue !== undefined && scheduleOTValue !== null) {
        if (typeof scheduleOTValue === 'boolean') {
          scheduleOTString = scheduleOTValue ? 'Yes' : 'No';
        } else if (typeof scheduleOTValue === 'string') {
          const lower = String(scheduleOTValue).toLowerCase();
          scheduleOTString = (lower === 'true' || lower === 'yes' || lower === '1') ? 'Yes' : 'No';
        }
      }

      const shiftToAnotherRoomValue = admission.shiftToAnotherRoom;
      let shiftToAnotherRoomString = 'No';
      if (shiftToAnotherRoomValue !== undefined && shiftToAnotherRoomValue !== null) {
        if (typeof shiftToAnotherRoomValue === 'boolean') {
          shiftToAnotherRoomString = shiftToAnotherRoomValue ? 'Yes' : 'No';
        } else if (typeof shiftToAnotherRoomValue === 'string') {
          const lower = String(shiftToAnotherRoomValue).toLowerCase();
          shiftToAnotherRoomString = (lower === 'true' || lower === 'yes' || lower === '1') ? 'Yes' : 'No';
        }
      }

      let foundRoomBedId = '';
      let foundRoomBedsId = '';
      if (admission.bedNumber && roomBedsList.length > 0) {
        const matchingBed = roomBedsList.find((bed: any) => {
          const bedNo = (bed as any).bedNo || (bed as any).BedNo || '';
          return bedNo === admission.bedNumber;
        });

        if (matchingBed) {
          foundRoomBedId = String(
            (matchingBed as any).roomBedId ||
            (matchingBed as any).RoomBedsId ||
            (matchingBed as any).id ||
            ''
          );
          foundRoomBedsId = String(
            (matchingBed as any).RoomBedsId ||
            (matchingBed as any).roomBedsId ||
            (matchingBed as any).roomBedId ||
            (matchingBed as any).id ||
            ''
          );
        }
      }

      if (!foundRoomBedId) {
        foundRoomBedId = String(
          (admission as any).roomBedId ||
          (admission as any).RoomBedId ||
          (admission as any).RoomBedsId ||
          (admission as any).roomBedsId ||
          ''
        );
      }
      if (!foundRoomBedsId) {
        foundRoomBedsId = String(
          (admission as any).roomBedsId ||
          (admission as any).RoomBedsId ||
          (admission as any).roomBedId ||
          (admission as any).RoomBedId ||
          ''
        );
      }

      const resolvedDoctorId = String(
        (admission as any).doctorId ||
        (admission as any).DoctorId ||
        (admission as any).admittedByDoctorId ||
        (admission as any).AdmittedByDoctorId ||
        ''
      );

      setAddAdmissionForm({
        patientId: admission.patientId || '',
        patientType: admission.patientType || '',
        patientAppointmentId: admission.patientAppointmentId || admission.appointmentId || '',
        emergencyBedSlotId: admission.emergencyBedSlotId || '',
        roomBedId: foundRoomBedId,
        roomBedsId: foundRoomBedsId,
        roomType: admission.roomType || '',
        admittedBy: admission.admittedBy || '',
        admittedByDoctorId: resolvedDoctorId,
        doctorId: resolvedDoctorId,
        diagnosis: admission.diagnosis || '',
        roomAllocationDate: admission.admissionDate ? new Date(admission.admissionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        admissionStatus: normalizedStatus,
        caseSheet: admission.caseSheet || '',
        caseDetails: admission.caseSheetDetails || '',
        isLinkedToICU: isLinkedToICUString,
        patientNo: admission.patientNo || '',
        age: admission.age ? String(admission.age) : '',
        gender: admission.gender || '',
        patientName: admission.patientName || '',
        bedNumber: admission.bedNumber || '',
        appointmentTokenNo: admission.appointmentTokenNo || '',
        appointmentDate: admission.appointmentDate || '',
        emergencyBedNo: admission.emergencyBedNo || '',
        eBedSlotNo: admission.eBedSlotNo || '',
        emergencyAdmissionDate: admission.emergencyAdmissionDate || '',
        roomVacantDate: admission.roomVacantDate || '',
        shiftToAnotherRoom: shiftToAnotherRoomString,
        shiftedTo: admission.shiftedTo || '',
        shiftedToDetails: admission.shiftedToDetails || '',
        scheduleOT: scheduleOTString,
        otAdmissionId: admission.otAdmissionId ? String(admission.otAdmissionId) : '',
        icuAdmissionId: admission.icuAdmissionId ? String(admission.icuAdmissionId) : '',
        billId: admission.billId ? String(admission.billId) : '',
        estimatedStay: admission.estimatedStay || '',
        createdAt: admission.createdAt || '',
        createdDate: admission.createdDate || '',
      });
      setPatientSearchTerm(admission.patientName || '');
      setRoomBedSearchTerm(`${admission.bedNumber} (${admission.roomType})`);
      setDoctorSearchTerm(admission.admittedBy || '');

      // Fetch conditional data based on patient type
      if (admission.patientType === 'OPD' && admission.patientId) {
        await fetchPatientAppointments(admission.patientId);
      } else if (admission.patientType === 'Emergency' && admission.patientId) {
        await fetchPatientEmergencyBedSlots(admission.patientId);
      }
    } catch (error) {
      console.error('Error loading admission data:', error);
      setAdmissionError('Failed to load admission data');
    }
  };

  const fetchPatientAppointments = async (patientId: string) => {
    // Similar to Admissions.tsx
    // Implementation here
  };

  const fetchPatientEmergencyBedSlots = async (patientId: string) => {
    // Similar to Admissions.tsx
    // Implementation here
  };

  const handleSaveAdmission = async () => {
    // Similar to Admissions.tsx handleSaveAdmission
    // Implementation here
  };

  if (!editingAdmission) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-scrollable-container">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading admission details...</p>
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
            <Button
              variant="outline"
              onClick={() => navigate('/admissions')}
              className="gap-2 mb-4"
            >
              <ArrowLeft className="size-4" />
              Back to Admissions
            </Button>
            <h1 className="dashboard-header">Edit Admission</h1>
            <p className="dashboard-subheader">Edit admission details for {editingAdmission.patientName}</p>
          </div>
        </div>

        <div className="dashboard-main-content">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Edit Admission Details</CardTitle>
            </CardHeader>
            <CardContent>
              {admissionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-4">
                  {admissionError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Form fields similar to the edit dialog in Admissions.tsx */}
                {/* Patient Selection */}
                <div className="md:col-span-2">
                  <Label htmlFor="patient-search-edit">Patient *</Label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="patient-search-edit"
                      placeholder="Search by Patient ID, Name, or Mobile Number..."
                      value={patientSearchTerm}
                      onChange={(e) => setPatientSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {/* Patient options dropdown - similar to Admissions.tsx */}
                </div>

                {/* Other form fields - copy from Admissions.tsx edit dialog */}
                {/* ... */}
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={() => navigate('/admissions')}
                  disabled={savingAdmission}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAdmission}
                  disabled={savingAdmission}
                >
                  {savingAdmission ? 'Saving...' : 'Update Admission'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
