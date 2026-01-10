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
import { Search, Plus, Pencil, Calendar, X } from 'lucide-react';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { usePatients } from '../hooks';
import { usePatientsPaginated } from '../hooks/usePatientsPaginated';
import { patientsApi } from '../api';
import { Patient } from '../types';
import { formatDateToDDMMYYYY } from '../utils/timeUtils';
import { ScrollableDialog, StickySectionHeader } from './ScrollableDialog';
import { ResizableDialogContent } from './ResizableDialogContent';
import { CustomResizableDialog, CustomResizableDialogHeader, CustomResizableDialogTitle, CustomResizableDialogClose } from './CustomResizableDialog';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

export function PatientRegistration() {
  // Use paginated hook for table, but keep regular hook for search/forms
  const { patients: allPatients, createPatient, loading: allLoading, error: allError, fetchPatients } = usePatients();
  const { patients, loading, loadingMore, error, hasMore, total, loadMore, refresh: refreshPaginatedPatients } = usePatientsPaginated(1000);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  // Initialize date filter with today's date
  const [dateFilter, setDateFilter] = useState<Date | null>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [dateFilterDisplay, setDateFilterDisplay] = useState(() => {
    // Format today's date for display (dd-mm-yyyy)
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [adhaarError, setAdhaarError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [patientNameError, setPatientNameError] = useState('');
  const [genderError, setGenderError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [panCardError, setPanCardError] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [loadingEditPatient, setLoadingEditPatient] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [updatingPatient, setUpdatingPatient] = useState(false);
  const [editAdhaarError, setEditAdhaarError] = useState('');
  const [editPhoneError, setEditPhoneError] = useState('');
  const [editPatientNameError, setEditPatientNameError] = useState('');
  const [editGenderError, setEditGenderError] = useState('');
  const [editAgeError, setEditAgeError] = useState('');
  const [editPanCardError, setEditPanCardError] = useState('');
  const [formData, setFormData] = useState({
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
  const [addRegisteredDate, setAddRegisteredDate] = useState<Date | null>(null);
  const [editRegisteredDate, setEditRegisteredDate] = useState<Date | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientHighlightIndex, setPatientHighlightIndex] = useState(-1);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  useEffect(() => {
    fetchPatients().catch((err) => {
      console.error('Error fetching patients in PatientRegistration:', err);
    });
  }, [fetchPatients]);

  // Clear errors when Add dialog closes
  useEffect(() => {
    if (!isAddDialogOpen) {
      setPatientNameError('');
      setPhoneError('');
      setGenderError('');
      setAgeError('');
      setAdhaarError('');
      setPanCardError('');
    }
  }, [isAddDialogOpen]);

  // Clear errors when Edit dialog closes
  useEffect(() => {
    if (!isEditDialogOpen) {
      setEditPatientNameError('');
      setEditPhoneError('');
      setEditGenderError('');
      setEditAgeError('');
      setEditAdhaarError('');
      setEditPanCardError('');
    }
  }, [isEditDialogOpen]);

  // Sync DatePicker with formData.registeredDate for Add dialog
  useEffect(() => {
    if (formData.registeredDate) {
      try {
        const dateStr = formData.registeredDate;
        let date: Date;
        if (dateStr.includes('T')) {
          date = new Date(dateStr);
        } else {
          date = new Date(dateStr + 'T00:00:00');
        }
        if (!isNaN(date.getTime())) {
          setAddRegisteredDate(date);
        } else {
          setAddRegisteredDate(null);
        }
      } catch {
        setAddRegisteredDate(null);
      }
    } else {
      setAddRegisteredDate(null);
    }
  }, [formData.registeredDate]);

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
    
    // Clear any previous errors when user starts typing
    if (limitedValue.length === 0) {
      setAdhaarError('');
    } else if (limitedValue.length !== 12) {
      setAdhaarError('Aadhaar ID must be exactly 12 digits');
    } else {
      // Check if Aadhaar ID already exists (only if exactly 12 digits)
      const existingPatient = allPatients.find((patient: any) => {
        const patientAdhaarId = (patient as any).AdhaarId || (patient as any).adhaarID || (patient as any).AdhaarID || patient.AdhaarId || '';
        return patientAdhaarId && patientAdhaarId.toString() === limitedValue;
      });
      
      if (existingPatient) {
        setAdhaarError('Aadhaar ID already exists for another patient');
      } else {
        setAdhaarError('');
      }
    }
  };

  const handlePhoneChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const limitedValue = numericValue.slice(0, 10);
    
    setFormData({ ...formData, phoneNo: limitedValue });
    
    if (limitedValue && limitedValue.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setPatientNameError('');
    setPhoneError('');
    setGenderError('');
    setAgeError('');
    setAdhaarError('');
    setPanCardError('');
    
    // Validate mandatory fields
    let hasError = false;
    
    if (!formData.patientName || formData.patientName.trim() === '') {
      setPatientNameError('Patient Name is required');
      hasError = true;
    }
    
    if (!formData.phoneNo || formData.phoneNo.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits');
      hasError = true;
    }
    
    if (!formData.gender || formData.gender.trim() === '') {
      setGenderError('Gender is required');
      hasError = true;
    }
    
    const ageStr = formData.age ? String(formData.age) : '';
    if (!ageStr || ageStr.trim() === '' || parseInt(ageStr) <= 0) {
      setAgeError('Age is required and must be greater than 0');
      hasError = true;
    }
    
    if (formData.adhaarID && formData.adhaarID.length !== 12) {
      setAdhaarError('Aadhaar ID must be exactly 12 digits');
      hasError = true;
    }
    
    // Check if Aadhaar ID already exists (only if provided)
    if (formData.adhaarID && formData.adhaarID.length === 12) {
      const existingPatient = allPatients.find((patient: any) => {
        const patientAdhaarId = (patient as any).AdhaarId || (patient as any).adhaarID || (patient as any).AdhaarID || patient.AdhaarId || '';
        return patientAdhaarId && patientAdhaarId.toString() === formData.adhaarID;
      });
      
      if (existingPatient) {
        setAdhaarError('Aadhaar ID already exists for another patient');
        hasError = true;
      }
    }
    
    // Check if PAN Card already exists (only if provided)
    if (formData.panCard && formData.panCard.trim() !== '') {
      const existingPatient = allPatients.find((patient: any) => {
        const patientPanCard = (patient as any).PANCard || (patient as any).panCard || (patient as any).PanCard || '';
        return patientPanCard && patientPanCard.toString().toUpperCase() === formData.panCard.toUpperCase();
      });
      
      if (existingPatient) {
        setPanCardError('PAN Card already exists for another patient');
        hasError = true;
      }
    }
    
    if (hasError) {
      return;
    }
    
    try {
      await createPatient({
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
      // Refresh paginated table to show the new patient
      await refreshPaginatedPatients();
      setTimeout(() => {
        setFormData({
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
        setAddRegisteredDate(null);
        setAdhaarError('');
        setPhoneError('');
        setPatientNameError('');
        setGenderError('');
        setAgeError('');
        setPanCardError('');
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
        age: mappedPatient.age ? String(mappedPatient.age) : '',
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
        try {
          // Handle YYYY-MM-DD format
          const dateStr = mappedPatient.registeredDate;
          let date: Date;
          if (dateStr.includes('T')) {
            // Already has time info
            date = new Date(dateStr);
          } else {
            // Just date, add time for proper parsing
            date = new Date(dateStr + 'T00:00:00');
          }
          // Check if date is valid
          if (!isNaN(date.getTime())) {
            setEditRegisteredDate(date);
          } else {
            setEditRegisteredDate(null);
          }
        } catch {
          setEditRegisteredDate(null);
        }
      } else {
        setEditRegisteredDate(null);
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
    setEditRegisteredDate(null);
    setEditAdhaarError('');
    setEditPhoneError('');
    setEditPatientNameError('');
    setEditGenderError('');
    setEditAgeError('');
    setEditPanCardError('');
  };

  const handleEditPhoneChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const limitedValue = numericValue.slice(0, 10);
    
    setEditFormData({ ...editFormData, phoneNo: limitedValue });
    
    if (limitedValue && limitedValue.length !== 10) {
      setEditPhoneError('Phone number must be exactly 10 digits');
    } else {
      setEditPhoneError('');
    }
  };

  const handleUpdatePatient = async () => {
    const patientId = editingPatient?.patientId || editingPatient?.PatientId;
    
    if (!patientId || !editFormData) {
      alert('Patient ID or form data is missing.');
      console.error('Update failed - missing PatientId or form data:', { patientId, editFormData });
      return;
    }

    // Clear previous errors
    setEditPatientNameError('');
    setEditPhoneError('');
    setEditGenderError('');
    setEditAgeError('');
    setEditAdhaarError('');
    setEditPanCardError('');
    
    // Validate mandatory fields
    let hasError = false;
    
    if (!editFormData.patientName || editFormData.patientName.trim() === '') {
      setEditPatientNameError('Patient Name is required');
      hasError = true;
    }
    
    if (!editFormData.phoneNo || editFormData.phoneNo.length !== 10) {
      setEditPhoneError('Phone number must be exactly 10 digits');
      hasError = true;
    }
    
    if (!editFormData.gender || editFormData.gender.trim() === '') {
      setEditGenderError('Gender is required');
      hasError = true;
    }
    
    const ageStr = editFormData.age ? String(editFormData.age) : '';
    if (!ageStr || ageStr.trim() === '' || parseInt(ageStr) <= 0) {
      setEditAgeError('Age is required and must be greater than 0');
      hasError = true;
    }
    
    if (editFormData.adhaarID && editFormData.adhaarID.length !== 12) {
      setEditAdhaarError('Aadhaar ID must be exactly 12 digits');
      hasError = true;
    }
    
    // Check if Aadhaar ID already exists for a different patient (only if provided and different from current)
    if (editFormData.adhaarID && editFormData.adhaarID.length === 12) {
      const currentPatientId = editingPatient?.patientId || editingPatient?.PatientId || editingPatient?.id;
      const existingPatient = allPatients.find((patient: any) => {
        const patientAdhaarId = (patient as any).AdhaarId || (patient as any).adhaarID || (patient as any).AdhaarID || patient.AdhaarId || '';
        const patientId = (patient as any).PatientId || (patient as any).patientId || (patient as any).id;
        // Check if Aadhaar ID matches and it's not the current patient being edited
        return patientAdhaarId && 
               patientAdhaarId.toString() === editFormData.adhaarID &&
               patientId !== currentPatientId;
      });
      
      if (existingPatient) {
        setEditAdhaarError('Aadhaar ID already exists for another patient');
        hasError = true;
      }
    }
    
    // Check if PAN Card already exists for a different patient (only if provided)
    if (editFormData.panCard && editFormData.panCard.trim() !== '') {
      const currentPatientId = editingPatient?.patientId || editingPatient?.PatientId || editingPatient?.id;
      const existingPatient = allPatients.find((patient: any) => {
        const patientPanCard = (patient as any).PANCard || (patient as any).panCard || (patient as any).PanCard || '';
        const patientId = (patient as any).PatientId || (patient as any).patientId || (patient as any).id;
        // Check if PAN Card matches and it's not the current patient being edited
        return patientPanCard && 
               patientPanCard.toString().toUpperCase() === editFormData.panCard.toUpperCase() &&
               patientId !== currentPatientId;
      });
      
      if (existingPatient) {
        setEditPanCardError('PAN Card already exists for another patient');
        hasError = true;
      }
    }
    
    if (hasError) {
      return;
    }

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
      // Refresh paginated table to show updated patient
      await refreshPaginatedPatients();
      
      setIsEditDialogOpen(false);
      setEditingPatient(null);
      setEditFormData(null);
      setEditRegisteredDate(null);
      setEditAdhaarError('');
      setEditPhoneError('');
      setEditPatientNameError('');
      setEditGenderError('');
      setEditAgeError('');
      setEditPanCardError('');
      
      alert('Patient details updated successfully!');
    } catch (err) {
      console.error('Error updating patient:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to update patient: ${errorMessage}`);
    } finally {
      setUpdatingPatient(false);
    }
  };

  // Separate active and inactive patients, and filter based on search term and date
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
    
    // Apply date filter if set
    let dateFilterStr: string | null = null;
    if (dateFilter) {
      // Extract date directly from Date object
      const year = dateFilter.getFullYear();
      const month = String(dateFilter.getMonth() + 1).padStart(2, '0');
      const day = String(dateFilter.getDate()).padStart(2, '0');
      dateFilterStr = `${year}-${month}-${day}`;
    }
    
    const filterByDate = (patientList: Patient[]): Patient[] => {
      if (!dateFilterStr) return patientList;
      return patientList.filter(patient => {
        const registeredDate = (patient as any).RegisteredDate || (patient as any).registeredDate;
        if (!registeredDate) return false;
        
        // Handle different date formats
        let patientDateStr: string = '';
        if (typeof registeredDate === 'string') {
          // If it's already in YYYY-MM-DD format
          if (/^\d{4}-\d{2}-\d{2}$/.test(registeredDate)) {
            patientDateStr = registeredDate;
          } else if (registeredDate.includes('T')) {
            // If it's a datetime string, extract date part
            patientDateStr = registeredDate.split('T')[0];
          } else {
            // Try to parse as date
            try {
              const dateObj = new Date(registeredDate);
              const year = dateObj.getFullYear();
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const day = String(dateObj.getDate()).padStart(2, '0');
              patientDateStr = `${year}-${month}-${day}`;
            } catch {
              return false;
            }
          }
        } else if (registeredDate instanceof Date) {
          const year = registeredDate.getFullYear();
          const month = String(registeredDate.getMonth() + 1).padStart(2, '0');
          const day = String(registeredDate.getDate()).padStart(2, '0');
          patientDateStr = `${year}-${month}-${day}`;
        }
        
        // Compare dates directly (both in YYYY-MM-DD format)
        return patientDateStr === dateFilterStr;
      });
    };
    
    const activeFilteredByDate = filterByDate(active);
    const inactiveFilteredByDate = filterByDate(inactive);
    
    // Filter active patients by search term (exclude inactive from search)
    let filtered: Patient[] = [];
    if (!searchTerm) {
      filtered = activeFilteredByDate;
    } else {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = activeFilteredByDate.filter(patient => {
        // Get patient name - check multiple possible field names
        const firstName = (patient.PatientName || (patient as any).patientName || '').toLowerCase();
        const lastName = (patient.LastName || (patient as any).lastName || '').toLowerCase();
        const patientName = `${firstName} ${lastName}`.trim().toLowerCase();
        
        // Get patient number - check multiple possible field names
        const patientNo = ((patient as any).patientNo || patient.PatientNo || '').toLowerCase();
        
        // Get phone number
        const phoneNo = ((patient as any).phoneNo || patient.PhoneNo || '').toLowerCase();
        
        // Get aadhaar ID
        const aadhaarId = ((patient as any).AdhaarId || (patient as any).adhaarID || (patient as any).AdhaarID || patient.AdhaarId || '').toLowerCase();
        
        // Search in all fields
        return patientName.includes(searchLower) ||
               firstName.includes(searchLower) ||
               lastName.includes(searchLower) ||
               patientNo.includes(searchLower) ||
               phoneNo.includes(searchLower) ||
               aadhaarId.includes(searchLower);
      });
    }
    
    return { activePatients: activeFilteredByDate, inactivePatients: inactiveFilteredByDate, filteredActivePatients: filtered };
  }, [patients, searchTerm, dateFilter]);

  // Calculate total patients count for "All" tab (always shows all patients)
  const allPatientsCount = useMemo(() => {
    return filteredActivePatients.length + inactivePatients.length;
  }, [filteredActivePatients.length, inactivePatients.length]);
  
  // Filter patients based on activeTab
  const filteredPatients = useMemo(() => {
    if (activeTab === 'all') {
      return [...filteredActivePatients, ...inactivePatients];
    } else if (activeTab === 'active') {
      return filteredActivePatients;
    } else if (activeTab === 'inactive') {
      return inactivePatients;
    }
    return filteredActivePatients;
  }, [activeTab, filteredActivePatients, inactivePatients]);
  
  // Calculate pagination for filtered patients
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex);
  
  // Reset to page 1 when search term, date filter, or activeTab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, activeTab]);
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Helper function to render patient row
  const renderPatientRow = (patient: Patient, isInactive: boolean = false) => {
    const uniqueKey = (patient as any).patientId || patient.PatientId || (patient as any).id || `patient-${Math.random()}`;
    const patientNo = (patient as any).patientNo || patient.PatientNo || '-';
    const patientName = (patient as any).patientName || patient.PatientName || '';
    const lastName = (patient as any).lastName || patient.LastName || '';
    const phoneNo = (patient as any).phoneNo || patient.PhoneNo || '-';
    const aadhaarId = (patient as any).adhaarID || (patient as any).AdhaarId || (patient as any).AdhaarID || patient.AdhaarId || '-';
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
        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : 'text-gray-600'} whitespace-nowrap`}>
          {phoneNo}
        </td>
        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : 'text-gray-600'} whitespace-nowrap`}>
          {aadhaarId}
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
  const renderPatientsTable = (patientsToRender: Patient[], includeInactive: boolean = false) => {
    // Determine if a patient is inactive
    const isPatientInactive = (patient: Patient): boolean => {
      const statusValue = (patient as any).Status || (patient as any).status;
      const isActive = typeof statusValue === 'string' 
        ? statusValue === 'Active' 
        : (statusValue === true || statusValue === 'true' || statusValue === undefined || statusValue === null);
      return !isActive;
    };
    
    return (
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">Patient No</th>
                  <th className="text-left py-3 px-4 text-gray-700">Patient Name</th>
                  <th className="text-left py-3 px-4 text-gray-700">Phone No</th>
                  <th className="text-left py-3 px-4 text-gray-700">Aadhaar ID</th>
                  <th className="text-left py-3 px-4 text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-gray-700">Age</th>
                  <th className="text-left py-3 px-4 text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-gray-700">Registered Date</th>
                  <th className="text-left py-3 px-4 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const tabStartIndex = (currentPage - 1) * itemsPerPage;
                  const tabEndIndex = tabStartIndex + itemsPerPage;
                  const tabPaginatedPatients = patientsToRender.slice(tabStartIndex, tabEndIndex);
                  
                  return patientsToRender.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-500">
                        {searchTerm ? 'No patients found matching your search.' : 'No patients found. Click "Add New Patient" to register a new patient.'}
                      </td>
                    </tr>
                  ) : (
                    <>
                      {tabPaginatedPatients.map((patient) => renderPatientRow(patient, isPatientInactive(patient)))}
                    </>
                  );
                })()}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {(() => {
              const tabTotalPages = Math.ceil(patientsToRender.length / itemsPerPage);
              const tabStartIndex = (currentPage - 1) * itemsPerPage;
              const tabEndIndex = tabStartIndex + itemsPerPage;
              const tabPaginatedPatients = patientsToRender.slice(tabStartIndex, tabEndIndex);
              
              // Generate page numbers for this tab
              const getTabPageNumbers = () => {
                const pages: (number | string)[] = [];
                const maxVisiblePages = 7;
                
                if (tabTotalPages <= maxVisiblePages) {
                  for (let i = 1; i <= tabTotalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  pages.push(1);
                  
                  if (currentPage > 3) {
                    pages.push('...');
                  }
                  
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(tabTotalPages - 1, currentPage + 1);
                  
                  for (let i = start; i <= end; i++) {
                    pages.push(i);
                  }
                  
                  if (currentPage < tabTotalPages - 2) {
                    pages.push('...');
                  }
                  
                  pages.push(tabTotalPages);
                }
                
                return pages;
              };
              
              return patientsToRender.length > itemsPerPage ? (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {tabStartIndex + 1} to {Math.min(tabEndIndex, patientsToRender.length)} of {patientsToRender.length} patients
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {getTabPageNumbers().map((page, index) => {
                        if (page === '...') {
                          return (
                            <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                              ...
                            </span>
                          );
                        }
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page as number)}
                            className={currentPage === page ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(tabTotalPages, prev + 1))}
                      disabled={currentPage === tabTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null;
            })()}
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
                <Button 
                  className="dialog-trigger-button"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="size-4" />
                  Add New Patient
                </Button>
                
                <CustomResizableDialog 
                  open={isAddDialogOpen} 
                  onOpenChange={setIsAddDialogOpen}
                  className="p-0 gap-0"
                  initialWidth={550}
                  maxWidth={typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.95) : 1800}
                >
                  <CustomResizableDialogClose onClick={() => setIsAddDialogOpen(false)} />
                  <div className="dialog-scrollable-wrapper dialog-content-scrollable flex flex-col flex-1 min-h-0 overflow-y-auto">
                    <CustomResizableDialogHeader className="dialog-header-standard flex-shrink-0">
                      <CustomResizableDialogTitle className="dialog-title-standard">Add New Patient</CustomResizableDialogTitle>
                    </CustomResizableDialogHeader>
                      <div className="dialog-body-content-wrapper">
                        <form onSubmit={handleSubmit} className="dialog-form-container space-y-2" autoComplete="off">
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
                              onChange={(e) => {
                                setFormData({ ...formData, patientName: e.target.value });
                                if (patientNameError) {
                                  setPatientNameError('');
                                }
                              }}
                              placeholder="Enter patient's first name"
                              className={`dialog-input-standard ${patientNameError ? 'border-red-500' : ''}`}
                            />
                            {patientNameError && (
                              <p className="text-sm text-red-600 mt-1">{patientNameError}</p>
                            )}
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
                                <option value="Direct">Direct</option>
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
                              <Label htmlFor="adhaarID" className="dialog-label-standard dialog-label-with-icon">
                                Adhaar ID
                                <span className="dialog-label-important">(Important)</span>
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
                                className={`dialog-input-standard ${adhaarError ? 'dialog-input-error' : ''}`}
                              />
                              {adhaarError && (
                                <p className="dialog-error-text">{adhaarError}</p>
                              )}
                            </div>
                            <div className="dialog-form-field">
                              <Label htmlFor="panCard" className="dialog-label-standard">PAN Card</Label>
                              <Input
                                id="panCard"
                                value={formData.panCard}
                                onChange={(e) => {
                                  const upperValue = e.target.value.toUpperCase();
                                  setFormData({ ...formData, panCard: upperValue });
                                  
                                  // Clear any previous errors when user starts typing
                                  if (upperValue.length === 0) {
                                    setPanCardError('');
                                  } else {
                                    // Check if PAN Card already exists (only if provided)
                                    const existingPatient = allPatients.find((patient: any) => {
                                      const patientPanCard = (patient as any).PANCard || (patient as any).panCard || (patient as any).PanCard || '';
                                      return patientPanCard && patientPanCard.toString().toUpperCase() === upperValue;
                                    });
                                    
                                    if (existingPatient) {
                                      setPanCardError('PAN Card already exists for another patient');
                                    } else {
                                      setPanCardError('');
                                    }
                                  }
                                }}
                                placeholder="Enter PAN number"
                                maxLength={10}
                                className={`dialog-input-standard ${panCardError ? 'border-red-500' : ''}`}
                              />
                              {panCardError && (
                                <p className="text-sm text-red-600 mt-1">{panCardError}</p>
                              )}
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
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                placeholder="Enter 10-digit phone number"
                                className={`dialog-input-standard ${phoneError ? 'border-red-500' : ''}`}
                              />
                              {phoneError && (
                                <p className="text-sm text-red-600 mt-1">{phoneError}</p>
                              )}
                            </div>
                            <div className="dialog-form-field">
                              <Label htmlFor="gender" className="dialog-label-standard">Gender *</Label>
                              <select
                                id="gender"
                                aria-label="Gender"
                                required
                                className={`dialog-select-standard ${genderError ? 'border-red-500' : ''}`}
                                value={formData.gender}
                                onChange={(e) => {
                                  setFormData({ ...formData, gender: e.target.value });
                                  if (genderError) {
                                    setGenderError('');
                                  }
                                }}
                              >
                                <option value="">Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                              {genderError && (
                                <p className="text-sm text-red-600 mt-1">{genderError}</p>
                              )}
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
                                onChange={(e) => {
                                  setFormData({ ...formData, age: e.target.value });
                                  if (ageError) {
                                    setAgeError('');
                                  }
                                }}
                                placeholder="Enter age"
                                className={`dialog-input-standard ${ageError ? 'border-red-500' : ''}`}
                              />
                              {ageError && (
                                <p className="text-sm text-red-600 mt-1">{ageError}</p>
                              )}
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
                           
                          </div>
                          <div className="dialog-footer-buttons">
                            <Button 
                              type="button"
                              variant="outline" 
                              onClick={() => {
                                setIsAddDialogOpen(false);
                                setFormData({
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
                                setPhoneError('');
                                setPatientNameError('');
                                setGenderError('');
                                setAgeError('');
                                setPanCardError('');
                                setPatientSearchTerm('');
                                setSelectedPatientId('');
                                setPatientHighlightIndex(-1);
                                setAddRegisteredDate(null);
                                setRegisteredDateDisplay('');
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
                  </CustomResizableDialog>
              </div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-4 flex-1">
            {/* Search and Date Filter */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      placeholder="Search by patient name, patient number, phone number, or aadhaar ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="date-filter" className="whitespace-nowrap text-sm text-gray-700">Filter by Date:</Label>
                    <div className="relative" style={{ minWidth: '200px' }}>
                      <DatePicker
                        id="date-filter"
                        selected={dateFilter}
                        onChange={(date: Date | null) => {
                          setDateFilter(date);
                          if (date) {
                            // Extract date directly and format as dd-mm-yyyy for display
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            setDateFilterDisplay(`${day}-${month}-${year}`);
                          } else {
                            // Clear date filter to show all records
                            setDateFilterDisplay('');
                          }
                        }}
                        dateFormat="dd-MM-yyyy"
                        placeholderText="Select date (dd-mm-yyyy)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                        wrapperClassName="w-full"
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        yearDropdownItemNumber={100}
                        scrollableYearDropdown
                        isClearable
                        clearButtonTitle="Clear date filter"
                      />
                    </div>
                    {dateFilterDisplay && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Clear date filter to show all records
                          setDateFilter(null);
                          setDateFilterDisplay('');
                        }}
                        className="text-gray-500 hover:text-gray-700"
                        title="Clear date filter to show all records"
                      >
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patients Table with Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList>
                <TabsTrigger value="all">All Patients ({allPatientsCount})</TabsTrigger>
                <TabsTrigger value="active">Active ({filteredActivePatients.length})</TabsTrigger>
                <TabsTrigger value="inactive">Inactive ({inactivePatients.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                {renderPatientsTable(filteredPatients, true)}
              </TabsContent>

              <TabsContent value="active">
                {renderPatientsTable(filteredActivePatients, false)}
              </TabsContent>

              <TabsContent value="inactive">
                {renderPatientsTable(inactivePatients, true)}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Edit Patient Details Dialog */}
      <CustomResizableDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        className="p-0 gap-0"
        initialWidth={550}
        maxWidth={typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.95) : 1800}
      >
        <CustomResizableDialogClose onClick={() => setIsEditDialogOpen(false)} />
        <div className="dialog-scrollable-wrapper dialog-content-scrollable flex flex-col flex-1 min-h-0 overflow-y-auto">
          <CustomResizableDialogHeader className="dialog-header-standard flex-shrink-0">
            <CustomResizableDialogTitle className="dialog-title-standard">
              <Pencil className="size-5 mr-2" />
              Edit Patient Details
            </CustomResizableDialogTitle>
          </CustomResizableDialogHeader>
            <div className="dialog-body-content-wrapper">
              {loadingEditPatient ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-blue-600">Loading patient details...</p>
                  </div>
                </div>
              ) : editingPatient && editFormData ? (
                <form onSubmit={(e) => { e.preventDefault(); handleUpdatePatient(); }} className="dialog-form-container space-y-2" autoComplete="off">
                  <div className="dialog-form-field">
                    <Label htmlFor="editPatientName" className="dialog-label-standard">Patient Name *</Label>
                    <Input
                      id="editPatientName"
                      required
                      value={editFormData.patientName}
                      onChange={(e) => {
                        setEditFormData({ ...editFormData, patientName: e.target.value });
                        if (editPatientNameError) {
                          setEditPatientNameError('');
                        }
                      }}
                      placeholder="Enter patient's first name"
                      className={`dialog-input-standard ${editPatientNameError ? 'border-red-500' : ''}`}
                    />
                    {editPatientNameError && (
                      <p className="text-sm text-red-600 mt-1">{editPatientNameError}</p>
                    )}
                  </div>
                  <div className="dialog-form-field">
                    <Label htmlFor="editPatientNo" className="dialog-label-standard">Patient No</Label>
                    <Input
                      id="editPatientNo"
                      value={editFormData.patientNo || '-'}
                      readOnly
                      disabled
                      className="dialog-input-standard bg-gray-50 cursor-not-allowed"
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
                          
                          // Clear any previous errors when user starts typing
                          if (limitedValue.length === 0) {
                            setEditAdhaarError('');
                          } else if (limitedValue.length !== 12) {
                            setEditAdhaarError('Aadhaar ID must be exactly 12 digits');
                          } else {
                            // Check if Aadhaar ID already exists for a different patient (only if exactly 12 digits)
                            const currentPatientId = editingPatient?.patientId || editingPatient?.PatientId || editingPatient?.id;
                            const existingPatient = allPatients.find((patient: any) => {
                              const patientAdhaarId = (patient as any).AdhaarId || (patient as any).adhaarID || (patient as any).AdhaarID || patient.AdhaarId || '';
                              const patientId = (patient as any).PatientId || (patient as any).patientId || (patient as any).id;
                              // Check if Aadhaar ID matches and it's not the current patient being edited
                              return patientAdhaarId && 
                                     patientAdhaarId.toString() === limitedValue &&
                                     patientId !== currentPatientId;
                            });
                            
                            if (existingPatient) {
                              setEditAdhaarError('Aadhaar ID already exists for another patient');
                            } else {
                              setEditAdhaarError('');
                            }
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
                        onChange={(e) => {
                          const upperValue = e.target.value.toUpperCase();
                          setEditFormData({ ...editFormData, panCard: upperValue });
                          
                          // Clear any previous errors when user starts typing
                          if (upperValue.length === 0) {
                            setEditPanCardError('');
                          } else {
                            // Check if PAN Card already exists for a different patient (only if provided)
                            const currentPatientId = editingPatient?.patientId || editingPatient?.PatientId || editingPatient?.id;
                            const existingPatient = allPatients.find((patient: any) => {
                              const patientPanCard = (patient as any).PANCard || (patient as any).panCard || (patient as any).PanCard || '';
                              const patientId = (patient as any).PatientId || (patient as any).patientId || (patient as any).id;
                              // Check if PAN Card matches and it's not the current patient being edited
                              return patientPanCard && 
                                     patientPanCard.toString().toUpperCase() === upperValue &&
                                     patientId !== currentPatientId;
                            });
                            
                            if (existingPatient) {
                              setEditPanCardError('PAN Card already exists for another patient');
                            } else {
                              setEditPanCardError('');
                            }
                          }
                        }}
                        placeholder="Enter PAN number"
                        maxLength={10}
                        className={`dialog-input-standard ${editPanCardError ? 'border-red-500' : ''}`}
                      />
                      {editPanCardError && (
                        <p className="text-sm text-red-600 mt-1">{editPanCardError}</p>
                      )}
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
                        onChange={(e) => handleEditPhoneChange(e.target.value)}
                        placeholder="Enter 10-digit phone number"
                        className={`dialog-input-standard ${editPhoneError ? 'border-red-500' : ''}`}
                      />
                      {editPhoneError && (
                        <p className="text-sm text-red-600 mt-1">{editPhoneError}</p>
                      )}
                    </div>
                    <div className="dialog-form-field">
                      <Label htmlFor="editGender" className="dialog-label-standard">Gender *</Label>
                      <select
                        id="editGender"
                        aria-label="Gender"
                        required
                        className={`dialog-select-standard ${editGenderError ? 'border-red-500' : ''}`}
                        value={editFormData.gender}
                        onChange={(e) => {
                          setEditFormData({ ...editFormData, gender: e.target.value });
                          if (editGenderError) {
                            setEditGenderError('');
                          }
                        }}
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {editGenderError && (
                        <p className="text-sm text-red-600 mt-1">{editGenderError}</p>
                      )}
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
                        onChange={(e) => {
                          setEditFormData({ ...editFormData, age: e.target.value });
                          if (editAgeError) {
                            setEditAgeError('');
                          }
                        }}
                        placeholder="Enter age"
                        className={`dialog-input-standard ${editAgeError ? 'border-red-500' : ''}`}
                      />
                      {editAgeError && (
                        <p className="text-sm text-red-600 mt-1">{editAgeError}</p>
                      )}
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
                  <div className="dialog-footer-buttons">
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
      </CustomResizableDialog>
    </>
  );
}
