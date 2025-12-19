import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Search, Plus, Pencil } from 'lucide-react';
import { Switch } from './ui/switch';
import { usePatients } from '../hooks';
import { usePatientsPaginated } from '../hooks/usePatientsPaginated';
import { patientsApi } from '../api';
import { Patient } from '../types';
import { formatDateToDDMMYYYY } from '../utils/timeUtils';
import { ScrollableDialog, StickySectionHeader } from './ScrollableDialog';
import { ResizableDialogContent } from './ResizableDialogContent';

export function PatientRegistration() {
  // Use paginated hook for table, but keep regular hook for search/forms
  const { patients: allPatients, createPatient, loading: allLoading, error: allError, fetchPatients } = usePatients();
  const { patients, loading, loadingMore, error, hasMore, total, loadMore } = usePatientsPaginated(10);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [adhaarError, setAdhaarError] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [loadingEditPatient, setLoadingEditPatient] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [updatingPatient, setUpdatingPatient] = useState(false);
  const [editAdhaarError, setEditAdhaarError] = useState('');
  const [formData, setFormData] = useState({
    patientNo: '',
    patientName: '',
    patientType: '',
    lastName: '',
    adhaarID: '',
    panCard: '',
    phoneNo: '',
    gender: '',
    age: '',
    address: '',
    chiefComplaint: '',
    description: '',
    registeredDate: '',
    registeredBy: '',
  });
  const [registeredDateDisplay, setRegisteredDateDisplay] = useState('');
  const [editRegisteredDateDisplay, setEditRegisteredDateDisplay] = useState('');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientHighlightIndex, setPatientHighlightIndex] = useState(-1);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  useEffect(() => {
    fetchPatients().catch((err) => {
      console.error('Error fetching patients in PatientRegistration:', err);
    });
  }, [fetchPatients]);

  // Helper function to format date to dd-mm-yyyy
  const formatDateToDisplay = (dateStr: string | Date | undefined): string => {
    if (!dateStr) return '-';
    return formatDateToDDMMYYYY(dateStr) || '-';
  };

  const parseDateFromDisplay = (displayStr: string): string => {
    if (!displayStr) return '';
    const cleaned = displayStr.replace(/[^\d-]/g, '');
    const match = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
    if (!match) return '';
    
    let day = parseInt(match[1], 10);
    let month = parseInt(match[2], 10);
    let year = parseInt(match[3], 10);
    
    if (year < 100) {
      year += 2000;
    }
    
    if (day < 1 || day > 31 || month < 1 || month > 12) return '';
    
    try {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const date = new Date(`${dateStr}T00:00:00+05:30`);
      if (date.getDate() !== day || date.getMonth() !== month - 1) return '';
      return dateStr;
    } catch {
      return '';
    }
  };

  const handleAdhaarChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const limitedValue = numericValue.slice(0, 12);
    
    setFormData({ ...formData, adhaarID: limitedValue });
    
    if (limitedValue && limitedValue.length !== 12) {
      setAdhaarError('Aadhaar ID must be exactly 12 digits');
    } else {
      setAdhaarError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.adhaarID && formData.adhaarID.length !== 12) {
      setAdhaarError('Aadhaar ID must be exactly 12 digits');
      return;
    }
    
    try {
      await createPatient({
        patientNo: formData.patientNo || undefined,
        patientName: formData.patientName,
        patientType: formData.patientType || undefined,
        lastName: formData.lastName || undefined,
        adhaarID: formData.adhaarID || undefined,
        panCard: formData.panCard || undefined,
        phoneNo: formData.phoneNo,
        gender: formData.gender,
        age: parseInt(formData.age) || 0,
        address: formData.address || undefined,
        chiefComplaint: formData.chiefComplaint || undefined,
        description: formData.description || undefined,
        registeredDate: formData.registeredDate || undefined,
        status: 'Active',
      } as any);
      setIsSubmitted(true);
      await fetchPatients();
      setTimeout(() => {
        setFormData({
          patientNo: '',
          patientName: '',
          patientType: '',
          lastName: '',
          adhaarID: '',
          panCard: '',
          phoneNo: '',
          gender: '',
          age: '',
          address: '',
          chiefComplaint: '',
          description: '',
          registeredDate: '',
          registeredBy: '',
        });
        setRegisteredDateDisplay('');
        setAdhaarError('');
        setIsSubmitted(false);
        setIsAddDialogOpen(false);
        setPatientSearchTerm('');
        setSelectedPatientId('');
        setPatientHighlightIndex(-1);
      }, 2000);
    } catch (err) {
      console.error('Failed to register patient:', err);
    }
  };

  const handleEditPatient = async (patientId: string) => {
    try {
      setLoadingEditPatient(true);
      setIsEditDialogOpen(true);
      console.log('Fetching patient for edit with PatientId:', patientId);
      
      const patient = await patientsApi.getById(patientId);
      console.log('Received patient data for edit:', patient);
      
      const patientData = (patient as any)?.data || patient;
      
      const mappedPatient = {
        id: patientData.id,
        patientId: patientData.PatientId || patientData.patientId,
        patientNo: patientData.PatientNo || patientData.patientNo,
        patientName: patientData.PatientName || patientData.patientName,
        lastName: patientData.LastName || patientData.lastName,
        patientType: patientData.PatientType || patientData.patientType,
        age: patientData.Age || patientData.age,
        gender: patientData.Gender || patientData.gender,
        phoneNo: patientData.PhoneNo || patientData.phoneNo,
        adhaarID: patientData.AdhaarId || patientData.adhaarID || patientData.AdhaarID,
        panCard: patientData.PANCard || patientData.panCard,
        address: patientData.Address || patientData.address,
        chiefComplaint: patientData.ChiefComplaint || patientData.chiefComplaint,
        description: patientData.Description || patientData.description,
        status: patientData.Status || patientData.status,
        registeredBy: patientData.RegisteredBy || patientData.registeredBy,
        registeredDate: patientData.RegisteredDate || patientData.registeredDate,
      };
      
      console.log('Mapped patient for edit:', mappedPatient);
      setEditingPatient(mappedPatient);
      setEditFormData({
        patientNo: mappedPatient.patientNo || '',
        patientName: mappedPatient.patientName || '',
        patientType: mappedPatient.patientType || '',
        lastName: mappedPatient.lastName || '',
        adhaarID: mappedPatient.adhaarID || '',
        panCard: mappedPatient.panCard || '',
        phoneNo: mappedPatient.phoneNo || '',
        gender: mappedPatient.gender || '',
        age: mappedPatient.age || '',
        address: mappedPatient.address || '',
        chiefComplaint: mappedPatient.chiefComplaint || '',
        description: mappedPatient.description || '',
        status: (() => {
          const statusValue = mappedPatient.status || 'Active';
          return typeof statusValue === 'string' 
            ? statusValue === 'Active' 
            : (statusValue === true || statusValue === 'true');
        })(),
        registeredBy: mappedPatient.registeredBy || '',
        registeredDate: mappedPatient.registeredDate || '',
      });
      if (mappedPatient.registeredDate) {
        setEditRegisteredDateDisplay(formatDateToDisplay(mappedPatient.registeredDate));
      } else {
        setEditRegisteredDateDisplay('');
      }
    } catch (err) {
      console.error('Error fetching patient for edit:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to load patient for editing: ${errorMessage}`);
      setIsEditDialogOpen(false);
      setEditingPatient(null);
      setEditFormData(null);
    } finally {
      setLoadingEditPatient(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingPatient(null);
    setEditFormData(null);
    setEditRegisteredDateDisplay('');
    setEditAdhaarError('');
  };

  const handleUpdatePatient = async () => {
    const patientId = editingPatient?.patientId || editingPatient?.PatientId;
    
    if (!patientId || !editFormData) {
      alert('Patient ID or form data is missing.');
      console.error('Update failed - missing PatientId or form data:', { patientId, editFormData });
      return;
    }

    if (!editFormData.patientName || !editFormData.phoneNo || !editFormData.gender || !editFormData.age) {
      alert('Please fill all required fields: Patient Name, Phone No, Gender, Age.');
      return;
    }

    if (editFormData.adhaarID && editFormData.adhaarID.length !== 12) {
      setEditAdhaarError('Aadhaar ID must be exactly 12 digits');
      return;
    }
    setEditAdhaarError('');

    try {
      setUpdatingPatient(true);
      
      const updateData = {
        PatientId: patientId,
        patientNo: editFormData.patientNo || undefined,
        patientName: editFormData.patientName,
        patientType: editFormData.patientType || undefined,
        lastName: editFormData.lastName || undefined,
        adhaarID: editFormData.adhaarID || undefined,
        panCard: editFormData.panCard || undefined,
        phoneNo: editFormData.phoneNo,
        gender: editFormData.gender,
        age: parseInt(editFormData.age) || 0,
        address: editFormData.address || undefined,
        chiefComplaint: editFormData.chiefComplaint || undefined,
        description: editFormData.description || undefined,
        status: editFormData.status !== undefined ? (editFormData.status ? 'Active' : 'Inactive') : undefined,
        registeredBy: editFormData.registeredBy || undefined,
        registeredDate: editFormData.registeredDate || undefined,
      };

      console.log('Updating patient with PatientId:', patientId);
      console.log('Update data being sent:', updateData);
      
      await patientsApi.update(updateData);
      
      console.log('Patient updated successfully for PatientId:', patientId);

      await fetchPatients();
      
      setIsEditDialogOpen(false);
      setEditingPatient(null);
      setEditFormData(null);
      
      alert('Patient details updated successfully!');
    } catch (err) {
      console.error('Error updating patient:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to update patient: ${errorMessage}`);
    } finally {
      setUpdatingPatient(false);
    }
  };

  // Separate active and inactive patients, and filter based on search term
  // Use paginated patients for table display
  const { activePatients, inactivePatients, filteredActivePatients } = useMemo(() => {
    // Use paginated patients for the table
    const patientsToUse = patients || [];
    
    if (patientsToUse.length === 0) {
      return { activePatients: [], inactivePatients: [], filteredActivePatients: [] };
    }
    
    // Separate active and inactive patients
    const active: Patient[] = [];
    const inactive: Patient[] = [];
    
    patientsToUse.forEach(patient => {
      const statusValue = (patient as any).Status || (patient as any).status;
      const isActive = typeof statusValue === 'string' 
        ? statusValue === 'Active' 
        : (statusValue === true || statusValue === 'true' || statusValue === undefined || statusValue === null);
      
      if (isActive) {
        active.push(patient);
      } else {
        inactive.push(patient);
      }
    });
    
    // Filter active patients by search term (exclude inactive from search)
    let filtered: Patient[] = [];
    if (!searchTerm) {
      filtered = active;
    } else {
      const searchLower = searchTerm.toLowerCase();
      filtered = active.filter(patient => {
        const patientName = `${patient.PatientName || ''} ${patient.LastName || ''}`.toLowerCase();
        const patientNo = (patient.PatientNo || '').toLowerCase();
        const phoneNo = (patient.PhoneNo || '').toLowerCase();
        const patientId = (patient.PatientId || '').toLowerCase();
        const patientType = (patient.PatientType || '').toLowerCase();
        
        return patientName.includes(searchLower) ||
               patientNo.includes(searchLower) ||
               phoneNo.includes(searchLower) ||
               patientId.includes(searchLower) ||
               patientType.includes(searchLower);
      });
    }
    
    return { activePatients: active, inactivePatients: inactive, filteredActivePatients: filtered };
  }, [patients, searchTerm]);

  // For backward compatibility, use filteredActivePatients
  const filteredPatients = filteredActivePatients;

  // Helper function to render patient row
  const renderPatientRow = (patient: Patient, isInactive: boolean = false) => {
    const uniqueKey = (patient as any).patientId || patient.PatientId || (patient as any).id || `patient-${Math.random()}`;
    const patientNo = (patient as any).patientNo || patient.PatientNo || '-';
    const patientName = (patient as any).patientName || patient.PatientName || '';
    const lastName = (patient as any).lastName || patient.LastName || '';
    const patientType = (patient as any).patientType || patient.PatientType || 'N/A';
    const age = (patient as any).age || patient.Age || '-';
    const status = (patient as any).status || (patient as any).Status || 'Active';
    const registeredDate = (patient as any).registeredDate || (patient as any).RegisteredDate;
    
    return (
      <tr 
        key={uniqueKey} 
        className={`border-b border-gray-100 hover:bg-gray-50 ${isInactive ? 'opacity-50 bg-gray-50' : ''}`}
      >
        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : ''} whitespace-nowrap`}>
          <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded">
            {patientNo}
          </span>
        </td>
        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : 'text-gray-600'} whitespace-nowrap min-w-[120px]`}>
          {patientName} {lastName || ''}
        </td>
        <td className={`py-3 px-4 whitespace-nowrap ${isInactive ? 'text-gray-400' : ''}`}>
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${isInactive ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-700'}`}>
            {patientType}
          </span>
        </td>
        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : 'text-gray-600'} whitespace-nowrap`}>
          {age}
        </td>
        <td className={`py-3 px-4 whitespace-nowrap ${isInactive ? 'text-gray-400' : ''}`}>
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
            status === 'Active' ? (isInactive ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700') :
            status === 'Inactive' ? 'bg-gray-100 text-gray-700' :
            'bg-red-100 text-red-700'
          }`}>
            {status || 'Active'}
          </span>
        </td>
        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : 'text-gray-600'} whitespace-nowrap`}>
          {formatDateToDisplay(registeredDate)}
        </td>
        <td className={`py-3 px-4 whitespace-nowrap ${isInactive ? 'text-gray-400' : ''}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const patientId = (patient as any).patientId || patient.PatientId;
              if (!patientId) {
                console.error('PatientId not found for patient:', patient);
                alert('Patient ID not available');
                return;
              }
              console.log('Managing patient with PatientId:', patientId);
              handleEditPatient(patientId);
            }}
            title="Manage Patient"
          >
            Manage
          </Button>
        </td>
      </tr>
    );
  };

  // Helper function to render patients table
  const renderPatientsTable = (patients: Patient[]) => {
    const showInactive = !searchTerm && inactivePatients.length > 0;
    
    return (
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">Patient No</th>
                  <th className="text-left py-3 px-4 text-gray-700">Patient Name</th>
                  <th className="text-left py-3 px-4 text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-gray-700">Age</th>
                  <th className="text-left py-3 px-4 text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-gray-700">Registered Date</th>
                  <th className="text-left py-3 px-4 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 && (!searchTerm ? inactivePatients.length === 0 : true) ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-500">
                      {searchTerm ? 'No patients found matching your search.' : 'No patients found. Click "Add New Patient" to register a new patient.'}
                    </td>
                  </tr>
                ) : (
                  <>
                    {patients.map((patient) => renderPatientRow(patient, false))}
                    {showInactive && inactivePatients.map((patient) => renderPatientRow(patient, true))}
                  </>
                )}
              </tbody>
            </table>
            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-4 text-center">
                {loadingMore ? (
                  <div className="text-blue-600">Loading more patients...</div>
                ) : (
                  <div className="text-gray-400 text-sm">Scroll for more</div>
                )}
              </div>
            )}
            {!hasMore && patients.length > 0 && (
              <div className="py-4 text-center text-gray-500 text-sm">
                All {total} patients loaded
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && patients.length === 0) {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="text-center py-12 text-gray-600">Loading patients...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="text-center py-12 text-red-600">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h1 className="text-gray-900 mb-2">Patient Registration</h1>
                <p className="text-gray-500">Register and manage patient information</p>
              </div>
              <div className="flex items-center gap-4">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="size-4" />
                      Add New Patient
                    </Button>
                  </DialogTrigger>
                  <ResizableDialogContent className="p-0 gap-0 large-dialog dialog-content-standard">
                    <div className="dialog-scrollable-wrapper dialog-content-scrollable">
                      <DialogHeader className="dialog-header-standard">
                        <DialogTitle className="dialog-title-standard">Add New Patient</DialogTitle>
                      </DialogHeader>
                      <div className="dialog-body-content-wrapper">
                        <form onSubmit={handleSubmit} className="dialog-form-container space-y-2">
                          {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                              {error}
                            </div>
                          )}
                          <div className="dialog-form-field">
                            <Label htmlFor="patientName" className="dialog-label-standard">Patient Name *</Label>
                            <Input
                              id="patientName"
                              required
                              value={formData.patientName}
                              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                              placeholder="Enter patient's first name"
                              className="dialog-input-standard"
                            />
                          </div>
                          <div className="dialog-form-field">
                            <Label htmlFor="patientNo" className="dialog-label-standard">Patient No (Optional)</Label>
                            <Input
                              id="patientNo"
                              value={formData.patientNo}
                              onChange={(e) => setFormData({ ...formData, patientNo: e.target.value })}
                              placeholder="Optional manual patient number"
                              className="dialog-input-standard"
                            />
                          </div>
                          <div className="dialog-form-field-grid">
                            <div className="dialog-form-field">
                              <Label htmlFor="patientType" className="dialog-label-standard">Patient Type</Label>
                              <select
                                id="patientType"
                                aria-label="Patient Type"
                                className="dialog-select-standard"
                                value={formData.patientType}
                                onChange={(e) => setFormData({ ...formData, patientType: e.target.value })}
                              >
                                <option value="">Select type</option>
                                <option value="OPD">OPD</option>
                                <option value="IPD">IPD</option>
                                <option value="Emergency">Emergency</option>
                              </select>
                            </div>
                            <div className="dialog-form-field">
                              <Label htmlFor="lastName" className="dialog-label-standard">Last Name</Label>
                              <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                placeholder="Enter patient's last name"
                                className="dialog-input-standard"
                              />
                            </div>
                          </div>
                          <div className="dialog-form-field-grid">
                            <div className="dialog-form-field">
                              <Label htmlFor="adhaarID" className="dialog-label-standard flex items-center gap-2">
                                Adhaar ID
                                <span className="text-xs text-orange-500">(Important)</span>
                              </Label>
                              <Input
                                id="adhaarID"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={formData.adhaarID}
                                onChange={(e) => handleAdhaarChange(e.target.value)}
                                placeholder="Enter 12-digit Aadhaar number"
                                maxLength={12}
                                className={`dialog-input-standard ${adhaarError ? 'border-red-300' : ''}`}
                              />
                              {adhaarError && (
                                <p className="text-sm text-red-600 mt-1">{adhaarError}</p>
                              )}
                            </div>
                            <div className="dialog-form-field">
                              <Label htmlFor="panCard" className="dialog-label-standard">PAN Card</Label>
                              <Input
                                id="panCard"
                                value={formData.panCard}
                                onChange={(e) => setFormData({ ...formData, panCard: e.target.value.toUpperCase() })}
                                placeholder="Enter PAN number"
                                maxLength={10}
                                className="dialog-input-standard"
                              />
                            </div>
                          </div>
                          <div className="dialog-form-field-grid">
                            <div className="dialog-form-field">
                              <Label htmlFor="phoneNo" className="dialog-label-standard">Phone No *</Label>
                              <Input
                                id="phoneNo"
                                required
                                type="tel"
                                value={formData.phoneNo}
                                onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                                placeholder="Enter phone number"
                                className="dialog-input-standard"
                              />
                            </div>
                            <div className="dialog-form-field">
                              <Label htmlFor="gender" className="dialog-label-standard">Gender *</Label>
                              <select
                                id="gender"
                                aria-label="Gender"
                                required
                                className="dialog-select-standard"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                              >
                                <option value="">Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          </div>
                          <div className="dialog-form-field-grid">
                            <div className="dialog-form-field">
                              <Label htmlFor="age" className="dialog-label-standard">Age *</Label>
                              <Input
                                id="age"
                                required
                                type="number"
                                min="0"
                                max="150"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                placeholder="Enter age"
                                className="dialog-input-standard"
                              />
                            </div>
                            <div className="dialog-form-field">
                              <Label htmlFor="address" className="dialog-label-standard">Address</Label>
                              <Input
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Enter address"
                                className="dialog-input-standard"
                              />
                            </div>
                          </div>
                          <div className="dialog-form-field">
                            <Label htmlFor="chiefComplaint" className="dialog-label-standard">Chief Complaint</Label>
                            <Input
                              id="chiefComplaint"
                              value={formData.chiefComplaint}
                              onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                              placeholder="Enter chief complaint"
                              className="dialog-input-standard"
                            />
                          </div>
                          <div className="dialog-form-field">
                            <Label htmlFor="description" className="dialog-label-standard">Description</Label>
                            <textarea
                              id="description"
                              rows={4}
                              className="dialog-textarea-standard"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              placeholder="Enter additional description or notes"
                            />
                          </div>
                          <div className="dialog-form-field-grid">
                            <div className="dialog-form-field">
                              <Label htmlFor="registeredBy" className="dialog-label-standard">Registered By</Label>
                              <Input
                                id="registeredBy"
                                value={formData.registeredBy}
                                onChange={(e) => setFormData({ ...formData, registeredBy: e.target.value })}
                                placeholder="Registered by"
                                className="dialog-input-standard"
                              />
                            </div>
                            <div className="dialog-form-field">
                              <Label htmlFor="registeredDate" className="dialog-label-standard">Registered Date</Label>
                              <Input
                                id="registeredDate"
                                type="text"
                                placeholder="dd-mm-yyyy"
                                value={registeredDateDisplay}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setRegisteredDateDisplay(value);
                                  const parsed = parseDateFromDisplay(value);
                                  if (parsed) {
                                    setFormData({ ...formData, registeredDate: parsed });
                                  }
                                }}
                                onBlur={(e) => {
                                  const parsed = parseDateFromDisplay(e.target.value);
                                  if (parsed) {
                                    setRegisteredDateDisplay(formatDateToDisplay(parsed));
                                    setFormData({ ...formData, registeredDate: parsed });
                                  } else if (e.target.value) {
                                    setRegisteredDateDisplay('');
                                  }
                                }}
                                className="dialog-input-standard"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <Button 
                              type="button"
                              variant="outline" 
                              onClick={() => {
                                setIsAddDialogOpen(false);
                                setFormData({
                                  patientNo: '',
                                  patientName: '',
                                  patientType: '',
                                  lastName: '',
                                  adhaarID: '',
                                  panCard: '',
                                  phoneNo: '',
                                  gender: '',
                                  age: '',
                                  address: '',
                                  chiefComplaint: '',
                                  description: '',
                                  registeredDate: '',
                                  registeredBy: '',
                                });
                                setAdhaarError('');
                                setPatientSearchTerm('');
                                setSelectedPatientId('');
                                setPatientHighlightIndex(-1);
                              }}
                              className="dialog-footer-button"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit"
                              disabled={loading} 
                              className="dialog-footer-button"
                            >
                              {loading ? 'Registering...' : 'Register Patient'}
                            </Button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </ResizableDialogContent>
                </Dialog>
              </div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-4 flex-1">
            {/* Search */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    placeholder="Search by patient name, patient number, phone number, patient ID, or patient type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Patients Table */}
            {renderPatientsTable(filteredPatients)}
          </div>
        </div>
      </div>

      {/* Edit Patient Details Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <ResizableDialogContent className="p-0 gap-0 large-dialog dialog-content-standard">
          <div className="dialog-scrollable-wrapper dialog-content-scrollable">
            <DialogHeader className="dialog-header-standard">
              <DialogTitle className="dialog-title-standard flex items-center gap-2">
                <Pencil className="size-5" />
                Edit Patient Details
              </DialogTitle>
            </DialogHeader>
            <div className="dialog-body-content-wrapper">
              {loadingEditPatient ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-blue-600">Loading patient details...</p>
                  </div>
                </div>
              ) : editingPatient && editFormData ? (
                <form onSubmit={(e) => { e.preventDefault(); handleUpdatePatient(); }} className="dialog-form-container space-y-2">
                  <div className="dialog-form-field">
                    <Label htmlFor="editPatientName" className="dialog-label-standard">Patient Name *</Label>
                    <Input
                      id="editPatientName"
                      required
                      value={editFormData.patientName}
                      onChange={(e) => setEditFormData({ ...editFormData, patientName: e.target.value })}
                      placeholder="Enter patient's first name"
                      className="dialog-input-standard"
                    />
                  </div>
                  <div className="dialog-form-field">
                    <Label htmlFor="editPatientNo" className="dialog-label-standard">Patient No (Optional)</Label>
                    <Input
                      id="editPatientNo"
                      value={editFormData.patientNo}
                      onChange={(e) => setEditFormData({ ...editFormData, patientNo: e.target.value })}
                      placeholder="Optional manual patient number"
                      className="dialog-input-standard"
                    />
                  </div>
                  <div className="dialog-form-field-grid">
                    <div className="dialog-form-field">
                      <Label htmlFor="editPatientType" className="dialog-label-standard">Patient Type</Label>
                      <select
                        id="editPatientType"
                        aria-label="Patient Type"
                        className="dialog-select-standard"
                        value={editFormData.patientType}
                        onChange={(e) => setEditFormData({ ...editFormData, patientType: e.target.value })}
                      >
                        <option value="">Select type</option>
                        <option value="OPD">OPD</option>
                        <option value="IPD">IPD</option>
                        <option value="Emergency">Emergency</option>
                      </select>
                    </div>
                    <div className="dialog-form-field">
                      <Label htmlFor="editLastName" className="dialog-label-standard">Last Name</Label>
                      <Input
                        id="editLastName"
                        value={editFormData.lastName}
                        onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                        placeholder="Enter patient's last name"
                        className="dialog-input-standard"
                      />
                    </div>
                  </div>
                  <div className="dialog-form-field-grid">
                    <div className="dialog-form-field">
                      <Label htmlFor="editAdhaarID" className="dialog-label-standard flex items-center gap-2">
                        Adhaar ID
                        <span className="text-xs text-orange-500">(Important)</span>
                      </Label>
                      <Input
                        id="editAdhaarID"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={editFormData.adhaarID}
                        onChange={(e) => {
                          const numericValue = e.target.value.replace(/\D/g, '');
                          const limitedValue = numericValue.slice(0, 12);
                          setEditFormData({ ...editFormData, adhaarID: limitedValue });
                          if (limitedValue && limitedValue.length !== 12) {
                            setEditAdhaarError('Aadhaar ID must be exactly 12 digits');
                          } else {
                            setEditAdhaarError('');
                          }
                        }}
                        placeholder="Enter 12-digit Aadhaar number"
                        maxLength={12}
                        className={`dialog-input-standard bg-orange-50 border-orange-200 ${editAdhaarError ? 'border-red-300' : ''}`}
                      />
                      {editAdhaarError && (
                        <p className="text-sm text-red-600 mt-1">{editAdhaarError}</p>
                      )}
                    </div>
                    <div className="dialog-form-field">
                      <Label htmlFor="editPANCard" className="dialog-label-standard">PAN Card</Label>
                      <Input
                        id="editPANCard"
                        value={editFormData.panCard}
                        onChange={(e) => setEditFormData({ ...editFormData, panCard: e.target.value.toUpperCase() })}
                        placeholder="Enter PAN number"
                        maxLength={10}
                        className="dialog-input-standard"
                      />
                    </div>
                  </div>
                  <div className="dialog-form-field-grid">
                    <div className="dialog-form-field">
                      <Label htmlFor="editPhoneNo" className="dialog-label-standard">Phone No *</Label>
                      <Input
                        id="editPhoneNo"
                        required
                        type="tel"
                        value={editFormData.phoneNo}
                        onChange={(e) => setEditFormData({ ...editFormData, phoneNo: e.target.value })}
                        placeholder="Enter phone number"
                        className="dialog-input-standard"
                      />
                    </div>
                    <div className="dialog-form-field">
                      <Label htmlFor="editGender" className="dialog-label-standard">Gender *</Label>
                      <select
                        id="editGender"
                        aria-label="Gender"
                        required
                        className="dialog-select-standard"
                        value={editFormData.gender}
                        onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="dialog-form-field-grid">
                    <div className="dialog-form-field">
                      <Label htmlFor="editAge" className="dialog-label-standard">Age *</Label>
                      <Input
                        id="editAge"
                        required
                        type="number"
                        min="0"
                        max="150"
                        value={editFormData.age}
                        onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                        placeholder="Enter age"
                        className="dialog-input-standard"
                      />
                    </div>
                    <div className="dialog-form-field">
                      <Label htmlFor="editAddress" className="dialog-label-standard">Address</Label>
                      <Input
                        id="editAddress"
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        placeholder="Enter address"
                        className="dialog-input-standard"
                      />
                    </div>
                  </div>
                  <div className="dialog-form-field">
                    <Label htmlFor="editChiefComplaint" className="dialog-label-standard">Chief Complaint</Label>
                    <Input
                      id="editChiefComplaint"
                      value={editFormData.chiefComplaint}
                      onChange={(e) => setEditFormData({ ...editFormData, chiefComplaint: e.target.value })}
                      placeholder="Enter chief complaint"
                      className="dialog-input-standard"
                    />
                  </div>
                  <div className="dialog-form-field">
                    <Label htmlFor="editDescription" className="dialog-label-standard">Description</Label>
                    <textarea
                      id="editDescription"
                      rows={4}
                      className="dialog-textarea-standard"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      placeholder="Enter additional description or notes"
                    />
                  </div>
                  <div className="dialog-form-field">
                    <div className="flex items-center gap-3">
                      <Label htmlFor="edit-status" className="dialog-label-standard">Status</Label>
                      <div className="flex-shrink-0 relative" style={{ zIndex: 1 }}>
                        <Switch
                          id="edit-status"
                          checked={editFormData.status !== undefined ? editFormData.status : true}
                          onCheckedChange={(checked) => setEditFormData({ ...editFormData, status: checked })}
                          className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 [&_[data-slot=switch-thumb]]:!bg-white [&_[data-slot=switch-thumb]]:!border [&_[data-slot=switch-thumb]]:!border-gray-400 [&_[data-slot=switch-thumb]]:!shadow-sm"
                          style={{
                            width: '2.5rem',
                            height: '1.5rem',
                            minWidth: '2.5rem',
                            minHeight: '1.5rem',
                            display: 'inline-flex',
                            position: 'relative',
                            backgroundColor: editFormData.status !== undefined && editFormData.status ? '#2563eb' : '#d1d5db',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="dialog-form-field">
                    <Label htmlFor="editRegisteredDate" className="dialog-label-standard">Registered Date</Label>
                    <Input
                      id="editRegisteredDate"
                      type="text"
                      placeholder="dd-mm-yyyy"
                      value={editRegisteredDateDisplay}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditRegisteredDateDisplay(value);
                        const parsed = parseDateFromDisplay(value);
                        if (parsed) {
                          setEditFormData({ ...editFormData, registeredDate: parsed });
                        }
                      }}
                      onBlur={(e) => {
                        const parsed = parseDateFromDisplay(e.target.value);
                        if (parsed) {
                          setEditRegisteredDateDisplay(formatDateToDisplay(parsed));
                          setEditFormData({ ...editFormData, registeredDate: parsed });
                        } else if (e.target.value) {
                          setEditRegisteredDateDisplay('');
                        }
                      }}
                      className="dialog-input-standard"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={handleCancelEdit}
                      disabled={updatingPatient}
                      className="dialog-footer-button"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updatingPatient} 
                      className="dialog-footer-button"
                    >
                      {updatingPatient ? 'Updating...' : 'Update Patient'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No patient data available for editing</p>
                </div>
              )}
            </div>
          </div>
        </ResizableDialogContent>
      </Dialog>
    </>
  );
}
