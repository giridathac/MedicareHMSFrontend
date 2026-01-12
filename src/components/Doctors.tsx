// Doctors Management Component - Fetch from /api/users and filter doctors/surgeons
import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

import { CustomResizableDialog, CustomResizableDialogHeader, CustomResizableDialogTitle, CustomResizableDialogClose } from './CustomResizableDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Users, Stethoscope, Search, Building2, Scissors, Plus, Edit } from 'lucide-react';
import { Switch } from './ui/switch';
import { useStaff } from '../hooks/useStaff';
import { useRoles } from '../hooks/useRoles';
import { useDepartments } from '../hooks/useDepartments';
import { Staff, CreateUserDto } from '../types/staff';
import { dialogConfig } from '../config/dialogConfig';

interface DoctorsViewProps {
  doctors: Staff[];
  roles: Array<{ id: string; name: string }>;
  departments: Array<{ id: number; name: string }>;
  selectedStatus: 'Active' | 'InActive' | 'all';
  onStatusFilterChange: (status: 'Active' | 'InActive' | 'all') => void;
  onCreateDoctor: (data: CreateUserDto) => Promise<void>;
  onUpdateDoctor: (data: { UserId: number } & Partial<CreateUserDto>) => Promise<void>;
}

export function Doctors() {
  const { staff, loading, error, createStaff, updateStaff, fetchStaff } = useStaff();
  const { roles } = useRoles();
  const { departments } = useDepartments();
  const [selectedStatus, setSelectedStatus] = useState<'Active' | 'InActive' | 'all'>('all');

  // Fetch staff on mount
  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Filter to show only doctors and surgeons
  const allDoctors = useMemo(() => {
    if (!staff || !roles) return [];
    
    return staff.filter((member) => {
      if (!member.RoleId) return false;
      const role = roles.find(r => r.id === member.RoleId);
      if (!role || !role.name) return false;
      const roleNameLower = role.name.toLowerCase();
      return roleNameLower.includes('doctor') || roleNameLower.includes('surgeon');
    });
  }, [staff, roles]);

  // Filter by status
  const doctors = useMemo(() => {
    return allDoctors.filter(d => {
      const statusMatch = selectedStatus === 'all' || d.Status === selectedStatus;
      return statusMatch;
    });
  }, [allDoctors, selectedStatus]);

  if (loading) {
    return (
      <div className="p-8 bg-blue-100 min-h-full">
        <div className="text-center py-12 text-blue-600">Loading doctors...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-blue-100 min-h-full">
        <div className="text-center py-12 text-red-500">Error: {error}</div>
      </div>
    );
  }

  const handleCreateDoctor = async (data: CreateUserDto) => {
    try {
      await createStaff(data);
    } catch (err) {
      console.error('Failed to create doctor:', err);
      throw err;
    }
  };

  const handleUpdateDoctor = async (data: { UserId: number } & Partial<CreateUserDto>) => {
    try {
      await updateStaff(data);
    } catch (err) {
      console.error('Failed to update doctor:', err);
      throw err;
    }
  };

  return (
    <DoctorsView
      doctors={doctors}
      allDoctors={allDoctors}
      roles={roles}
      departments={departments}
      selectedStatus={selectedStatus}
      onStatusFilterChange={setSelectedStatus}
      onCreateDoctor={handleCreateDoctor}
      onUpdateDoctor={handleUpdateDoctor}
    />
  );
}

function DoctorsView({
  doctors,
  allDoctors,
  roles,
  departments,
  selectedStatus,
  onStatusFilterChange,
  onCreateDoctor,
  onUpdateDoctor,
}: DoctorsViewProps & { allDoctors: Staff[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<CreateUserDto>({
    RoleId: '',
    UserName: '',
    Password: '',
    PhoneNo: '',
    EmailId: '',
    DoctorDepartmentId: '',
    DoctorQualification: '',
    DoctorType: undefined,
    DoctorOPDCharge: undefined,
    DoctorSurgeryCharge: undefined,
    OPDConsultation: undefined,
    IPDVisit: undefined,
    OTHandle: undefined,
    ICUVisits: undefined,
    Status: 'Active',
  });

  // Filter roles to only show doctor/surgeon roles
  const doctorRoles = useMemo(() => {
    if (!roles) return [];
    return roles.filter(role => {
      if (!role || !role.name) return false;
      const roleNameLower = role.name.toLowerCase();
      return roleNameLower.includes('doctor') || roleNameLower.includes('surgeon');
    });
  }, [roles]);

  // All roles in this component are doctors/surgeons, so doctor fields are always shown

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || '-';
  };

  const getDepartmentName = (departmentId?: string | number) => {
    if (departmentId === null || departmentId === undefined || departmentId === '') return '-';
    const deptIdStr = String(departmentId);
    const deptIdNum = Number(departmentId);
    const dept = departments.find(d => d.id.toString() === deptIdStr || d.id === deptIdNum);
    return dept?.name || '-';
  };
  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700';
      case 'InActive':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAddSubmit = async () => {
    // Validate phone number (must be exactly 10 digits)
    if (formData.PhoneNo && formData.PhoneNo.trim() !== '') {
      const phoneDigits = formData.PhoneNo.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        alert('Phone number must be exactly 10 digits');
        return;
      }
    }

    try {
      const submitData: CreateUserDto = {
        RoleId: formData.RoleId,
        UserName: formData.UserName,
        Password: formData.Password,
        PhoneNo: formData.PhoneNo ? formData.PhoneNo.replace(/\D/g, '') : undefined,
        EmailId: formData.EmailId || undefined,
        Status: formData.Status || 'Active',
        // Always include doctor fields since we're only working with doctors/surgeons
        DoctorDepartmentId: formData.DoctorDepartmentId || undefined,
        DoctorQualification: formData.DoctorQualification || undefined,
        DoctorType: formData.DoctorType,
        DoctorOPDCharge: formData.DoctorOPDCharge,
        DoctorSurgeryCharge: formData.DoctorSurgeryCharge,
        OPDConsultation: formData.OPDConsultation,
        IPDVisit: formData.IPDVisit,
        OTHandle: formData.OTHandle,
        ICUVisits: formData.ICUVisits,
      };

      await onCreateDoctor(submitData);
      setIsAddDialogOpen(false);
      setFormData({
        RoleId: '',
        UserName: '',
        Password: '',
        PhoneNo: '',
        EmailId: '',
        DoctorDepartmentId: '',
        DoctorQualification: '',
        DoctorType: undefined,
        DoctorOPDCharge: undefined,
        DoctorSurgeryCharge: undefined,
        OPDConsultation: undefined,
        IPDVisit: undefined,
        OTHandle: undefined,
        ICUVisits: undefined,
        Status: 'Active',
      });
      alert('Doctor added successfully!');
    } catch (err) {
      alert('Failed to add doctor. Please try again.');
    }
  };

  const handleEdit = (doctor: Staff) => {
    setSelectedDoctor(doctor);
    setFormData({
      RoleId: doctor.RoleId,
      UserName: doctor.UserName,
      Password: '', // Don't populate password
      PhoneNo: doctor.PhoneNo || '',
      EmailId: doctor.EmailId || '',
      DoctorDepartmentId: doctor.DoctorDepartmentId || '',
      DoctorQualification: doctor.DoctorQualification || '',
      DoctorType: doctor.DoctorType,
      DoctorOPDCharge: doctor.DoctorOPDCharge,
      DoctorSurgeryCharge: doctor.DoctorSurgeryCharge,
      OPDConsultation: doctor.OPDConsultation,
      IPDVisit: doctor.IPDVisit,
      OTHandle: doctor.OTHandle,
      ICUVisits: doctor.ICUVisits,
      Status: doctor.Status || 'Active',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedDoctor || !selectedDoctor.UserId) return;
    
    // Validate phone number (must be exactly 10 digits)
    if (formData.PhoneNo && formData.PhoneNo.trim() !== '') {
      const phoneDigits = formData.PhoneNo.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        alert('Phone number must be exactly 10 digits');
        return;
      }
    }

    try {
      const submitData: Partial<CreateUserDto> = {
        RoleId: formData.RoleId,
        UserName: formData.UserName,
        PhoneNo: formData.PhoneNo ? formData.PhoneNo.replace(/\D/g, '') : undefined,
        EmailId: formData.EmailId || undefined,
        Status: formData.Status || 'Active',
        // Always include doctor fields since we're only working with doctors/surgeons
        DoctorDepartmentId: formData.DoctorDepartmentId || undefined,
        DoctorQualification: formData.DoctorQualification || undefined,
        DoctorType: formData.DoctorType,
        DoctorOPDCharge: formData.DoctorOPDCharge,
        DoctorSurgeryCharge: formData.DoctorSurgeryCharge,
        OPDConsultation: formData.OPDConsultation,
        IPDVisit: formData.IPDVisit,
        OTHandle: formData.OTHandle,
        ICUVisits: formData.ICUVisits,
      };

      await onUpdateDoctor({ UserId: selectedDoctor.UserId, ...submitData });
      setIsEditDialogOpen(false);
      setSelectedDoctor(null);
      setFormData({
        RoleId: '',
        UserName: '',
        Password: '',
        PhoneNo: '',
        EmailId: '',
        DoctorDepartmentId: '',
        DoctorQualification: '',
        DoctorType: undefined,
        DoctorOPDCharge: undefined,
        DoctorSurgeryCharge: undefined,
        OPDConsultation: undefined,
        IPDVisit: undefined,
        OTHandle: undefined,
        ICUVisits: undefined,
        Status: 'Active',
      });
      alert('Doctor updated successfully!');
    } catch (err) {
      alert('Failed to update doctor. Please try again.');
    }
  };


  // Calculate doctor type counts
  const doctorStats = useMemo(() => {
    const inhouse = allDoctors.filter(d => d.DoctorType === 'INHOUSE').length;
    const consulting = allDoctors.filter(d => d.DoctorType === 'VISITING').length;
    const surgeons = allDoctors.filter(d => {
      const role = roles.find(r => r.id === d.RoleId);
      return role?.name?.toLowerCase().includes('surgeon') || false;
    }).length;
    return { inhouse, consulting, surgeons };
  }, [allDoctors, roles]);

  // Separate active and inactive doctors
  const { activeDoctors, inactiveDoctors } = useMemo(() => {
    const active: Staff[] = [];
    const inactive: Staff[] = [];
    
    doctors.forEach(doctor => {
      if (doctor.Status === 'Active') {
        active.push(doctor);
      } else {
        inactive.push(doctor);
      }
    });
    
    return { activeDoctors: active, inactiveDoctors: inactive };
  }, [doctors]);

  // Filter doctors based on search term
  const filterBySearch = (doctorList: Staff[]): Staff[] => {
    if (!searchTerm) return doctorList;
    const searchLower = searchTerm.toLowerCase();
    return doctorList.filter(doctor => {
      const userName = (doctor.UserName || '').toLowerCase();
      const roleName = getRoleName(doctor.RoleId).toLowerCase();
      const departmentName = getDepartmentName(doctor.DoctorDepartmentId).toLowerCase();
      const phone = (doctor.PhoneNo || '').toLowerCase();
      const email = (doctor.EmailId || '').toLowerCase();
      
      return userName.includes(searchLower) ||
             roleName.includes(searchLower) ||
             departmentName.includes(searchLower) ||
             phone.includes(searchLower) ||
             email.includes(searchLower);
    });
  };

  const filteredActiveDoctors = useMemo(() => filterBySearch(activeDoctors), [activeDoctors, searchTerm, roles, departments]);
  const filteredInactiveDoctors = useMemo(() => filterBySearch(inactiveDoctors), [inactiveDoctors, searchTerm, roles, departments]);
  const filteredAllDoctors = useMemo(() => [...filteredActiveDoctors, ...filteredInactiveDoctors], [filteredActiveDoctors, filteredInactiveDoctors]);

  // Helper function to render doctors table
  const renderDoctorsTable = (doctorsToRender: Staff[], includeInactive: boolean = false) => {
    const isDoctorInactive = (doctor: Staff): boolean => {
      return doctor.Status === 'InActive';
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">User Name</th>
                  <th className="text-left py-3 px-4 text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 text-gray-700">Department</th>
                  <th className="text-left py-3 px-4 text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctorsToRender.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No doctors found matching your search.' : 'No doctors found.'}
                    </td>
                  </tr>
                ) : (
                  doctorsToRender.map((doctor) => {
                    const isInactive = isDoctorInactive(doctor);
                    return (
                      <tr 
                        key={doctor.UserId || `doctor-${Math.random()}`} 
                        className={`border-b border-gray-100 hover:bg-gray-50 ${isInactive ? 'opacity-50 bg-gray-50' : ''}`}
                      >
                        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : ''}`}>
                          <div className="flex items-center gap-2">
                            <Users className="size-4 text-blue-600" />
                            <span className={`${isInactive ? 'text-gray-400' : 'text-gray-900'} font-medium`}>{doctor.UserName || '-'}</span>
                          </div>
                        </td>
                        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>{getRoleName(doctor.RoleId)}</td>
                        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>{getDepartmentName(doctor.DoctorDepartmentId)}</td>
                        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : ''}`}>
                          <span className={`px-2 py-1 rounded text-xs ${
                            doctor.DoctorType === 'INHOUSE' 
                              ? isInactive ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-700'
                              : doctor.DoctorType === 'VISITING'
                              ? isInactive ? 'bg-gray-100 text-gray-400' : 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {doctor.DoctorType === 'INHOUSE' ? 'Inhouse' : doctor.DoctorType === 'VISITING' ? 'Visiting' : '-'}
                          </span>
                        </td>
                        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>{doctor.PhoneNo || '-'}</td>
                        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : 'text-gray-600'}`}>{doctor.EmailId || '-'}</td>
                        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : ''}`}>
                          <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeColor(doctor.Status)}`}>
                            {doctor.Status || 'Active'}
                          </span>
                        </td>
                        <td className={`py-3 px-4 ${isInactive ? 'text-gray-400' : ''}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(doctor)}
                            className="gap-2"
                          >
                            <Edit className="size-3" />
                            Manage
                          </Button>
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
    );
  };

  return (
    <>
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h1 className="text-gray-900 mb-2 text-2xl">Doctors Management</h1>
                <p className="text-gray-500 text-base">Manage doctors</p>
              </div>
              <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="size-4" />
                Add Doctor
              </Button>
              <CustomResizableDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                initialWidth={dialogConfig.doctorDialog.initialWidth}
                initialHeight={dialogConfig.doctorDialog.initialHeight}
                minWidth={dialogConfig.doctorDialog.minWidth}
                minHeight={dialogConfig.doctorDialog.minHeight}
                closeOnOutsideClick={dialogConfig.doctorDialog.closeOnOutsideClick}
              >
                <CustomResizableDialogHeader className="dialog-header-standard">
                  <CustomResizableDialogTitle className="dialog-title-standard-view">Add New Doctor</CustomResizableDialogTitle>
                  <CustomResizableDialogClose onClick={() => setIsAddDialogOpen(false)} />
                </CustomResizableDialogHeader>
                <div className="dialog-body-content-wrapper">
                  <div className="dialog-form-container space-y-4">
                        <div className="dialog-form-field-grid">
                          <div className="dialog-field-single-column">
                            <Label htmlFor="roleId" className="dialog-label-standard">Role *</Label>
                            <select
                              id="roleId"
                              aria-label="Role"
                              className="dialog-select-standard"
                              value={formData.RoleId}
                              onChange={(e) => setFormData({ ...formData, RoleId: e.target.value })}
                              required
                            >
                              <option value="">Select a role</option>
                              {doctorRoles.filter(r => r && r.id && r.name).map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="dialog-field-single-column">
                            <Label htmlFor="userName" className="dialog-label-standard">User Name *</Label>
                            <Input
                              id="userName"
                              placeholder="Enter user name"
                              value={formData.UserName}
                              onChange={(e) => setFormData({ ...formData, UserName: e.target.value })}
                              className="dialog-input-standard"
                              required
                            />
                          </div>
                        </div>
                        <div className="dialog-form-field-grid">
                          <div className="dialog-field-single-column">
                            <Label htmlFor="password" className="dialog-label-standard">Password *</Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Enter password"
                              value={formData.Password}
                              onChange={(e) => setFormData({ ...formData, Password: e.target.value })}
                              className="dialog-input-standard"
                              required
                            />
                          </div>
                          <div className="dialog-field-single-column">
                            <Label htmlFor="phoneNo" className="dialog-label-standard">Phone Number *</Label>
                            <Input
                              id="phoneNo"
                              placeholder="Enter 10-digit phone number"
                              value={formData.PhoneNo}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                                if (value.length <= 10) {
                                  setFormData({ ...formData, PhoneNo: value });
                                }
                              }}
                              className="dialog-input-standard"
                              maxLength={10}
                              required
                            />
                          </div>
                        </div>
                        <div className="dialog-form-field">
                          <Label htmlFor="emailId" className="dialog-label-standard">Email</Label>
                          <Input
                            id="emailId"
                            type="email"
                            placeholder="Enter email"
                            value={formData.EmailId}
                            onChange={(e) => setFormData({ ...formData, EmailId: e.target.value })}
                            className="dialog-input-standard"
                          />
                        </div>

                        {/* Doctor-specific fields - Always shown since we only work with doctors/surgeons */}
                        <div className="dialog-form-field">
                          <h3 className="text-sm font-semibold mb-4 text-gray-700">Doctor Information</h3>
                        </div>
                            <div className="dialog-form-field-grid">
                              <div className="dialog-field-single-column">
                                <Label htmlFor="doctorDepartmentId" className="dialog-label-standard">Department</Label>
                                <select
                                  id="doctorDepartmentId"
                                  aria-label="Department"
                                  className="dialog-select-standard"
                                  value={formData.DoctorDepartmentId}
                                  onChange={(e) => setFormData({ ...formData, DoctorDepartmentId: e.target.value })}
                                >
                                  <option value="">Select a department</option>
                                  {departments && departments.length > 0 ? (
                                    departments.filter(d => d && d.id !== undefined && d.id !== null).map(dept => (
                                      <option key={dept.id} value={String(dept.id)}>
                                        {dept.name}
                                      </option>
                                    ))
                                  ) : (
                                    <option value="" disabled>Loading departments...</option>
                                  )}
                                </select>
                              </div>
                              <div className="dialog-field-single-column">
                                <Label htmlFor="doctorQualification" className="dialog-label-standard">Qualification</Label>
                                <Input
                                  id="doctorQualification"
                                  placeholder="e.g., MBBS, MD"
                                  value={formData.DoctorQualification}
                                  onChange={(e) => setFormData({ ...formData, DoctorQualification: e.target.value })}
                                  className="dialog-input-standard"
                                />
                              </div>
                            </div>
                            <div className="dialog-form-field-grid">
                              <div className="dialog-field-single-column">
                                <Label htmlFor="doctorType" className="dialog-label-standard">Doctor Type</Label>
                                <select
                                  id="doctorType"
                                  aria-label="Doctor Type"
                                  className="dialog-select-standard"
                                  value={formData.DoctorType || ''}
                                  onChange={(e) => setFormData({ ...formData, DoctorType: e.target.value as 'INHOUSE' | 'VISITING' || undefined })}
                                >
                                  <option value="">Select type</option>
                                  <option value="INHOUSE">INHOUSE</option>
                                  <option value="VISITING">VISITING</option>
                                </select>
                              </div>
                              <div className="dialog-field-single-column">
                                <Label htmlFor="doctorOPDCharge" className="dialog-label-standard">OPD Charge</Label>
                                <Input
                                  id="doctorOPDCharge"
                                  type="number"
                                  placeholder="Enter OPD charge"
                                  value={formData.DoctorOPDCharge || ''}
                                  onChange={(e) => setFormData({ ...formData, DoctorOPDCharge: e.target.value ? Number(e.target.value) : undefined })}
                                  className="dialog-input-standard"
                                />
                              </div>
                            </div>
                            <div className="dialog-form-field-grid">
                              <div className="dialog-field-single-column">
                                <Label htmlFor="doctorSurgeryCharge" className="dialog-label-standard">Surgery Charge</Label>
                                <Input
                                  id="doctorSurgeryCharge"
                                  type="number"
                                  placeholder="Enter surgery charge"
                                  value={formData.DoctorSurgeryCharge || ''}
                                  onChange={(e) => setFormData({ ...formData, DoctorSurgeryCharge: e.target.value ? Number(e.target.value) : undefined })}
                                  className="dialog-input-standard"
                                />
                              </div>
                            </div>
                            <div className="dialog-form-field-grid">
                              <div className="dialog-field-single-column">
                                <Label htmlFor="opdConsultation" className="dialog-label-standard">OPD Consultation</Label>
                                <select
                                  id="opdConsultation"
                                  aria-label="OPD Consultation"
                                  className="dialog-select-standard"
                                  value={formData.OPDConsultation || ''}
                                  onChange={(e) => setFormData({ ...formData, OPDConsultation: e.target.value as 'Yes' | 'No' || undefined })}
                                >
                                  <option value="">Select</option>
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                              <div className="dialog-field-single-column">
                                <Label htmlFor="ipdVisit" className="dialog-label-standard">IPD Visit</Label>
                                <select
                                  id="ipdVisit"
                                  aria-label="IPD Visit"
                                  className="dialog-select-standard"
                                  value={formData.IPDVisit || ''}
                                  onChange={(e) => setFormData({ ...formData, IPDVisit: e.target.value as 'Yes' | 'No' || undefined })}
                                >
                                  <option value="">Select</option>
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                            </div>
                            <div className="dialog-form-field-grid">
                              <div className="dialog-field-single-column">
                                <Label htmlFor="otHandle" className="dialog-label-standard">OT Handle</Label>
                                <select
                                  id="otHandle"
                                  aria-label="OT Handle"
                                  className="dialog-select-standard"
                                  value={formData.OTHandle || ''}
                                  onChange={(e) => setFormData({ ...formData, OTHandle: e.target.value as 'Yes' | 'No' || undefined })}
                                >
                                  <option value="">Select</option>
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                              <div className="dialog-field-single-column">
                                <Label htmlFor="icuVisits" className="dialog-label-standard">ICU Visits</Label>
                                <select
                                  id="icuVisits"
                                  aria-label="ICU Visits"
                                  className="dialog-select-standard"
                                  value={formData.ICUVisits || ''}
                                  onChange={(e) => setFormData({ ...formData, ICUVisits: e.target.value as 'Yes' | 'No' || undefined })}
                                >
                                  <option value="">Select</option>
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                            </div>
                      </div>
                    </div>
                    <div className="dialog-footer-standard">
                      <Button variant="outline" onClick={() => {
                        setIsAddDialogOpen(false);
                        setFormData({
                          RoleId: '',
                          UserName: '',
                          Password: '',
                          PhoneNo: '',
                          EmailId: '',
                          DoctorDepartmentId: '',
                          DoctorQualification: '',
                          DoctorType: undefined,
                          DoctorOPDCharge: undefined,
                          DoctorSurgeryCharge: undefined,
                          OPDConsultation: undefined,
                          IPDVisit: undefined,
                          OTHandle: undefined,
                          ICUVisits: undefined,
                          Status: 'Active',
                        });
                      }} className="dialog-footer-button">Cancel</Button>
                      <Button onClick={handleAddSubmit} className="dialog-footer-button">Add Doctor</Button>
                    </div>
                </CustomResizableDialog>
              <CustomResizableDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                initialWidth={dialogConfig.doctorDialog.initialWidth}
                initialHeight={dialogConfig.doctorDialog.initialHeight}
                minWidth={dialogConfig.doctorDialog.minWidth}
                minHeight={dialogConfig.doctorDialog.minHeight}
                closeOnOutsideClick={dialogConfig.doctorDialog.closeOnOutsideClick}
              >
                <CustomResizableDialogHeader className="dialog-header-standard">
                  <CustomResizableDialogTitle className="dialog-title-standard-view">Edit Doctor</CustomResizableDialogTitle>
                  <CustomResizableDialogClose onClick={() => setIsEditDialogOpen(false)} />
                </CustomResizableDialogHeader>
                <div className="dialog-body-content-wrapper">
                  <div className="dialog-form-container space-y-4">
                        <div className="dialog-form-field-grid">
                          <div className="dialog-field-single-column">
                            <Label htmlFor="editRoleId" className="dialog-label-standard">Role *</Label>
                            <select
                              id="editRoleId"
                              aria-label="Role"
                              className="dialog-select-standard"
                              value={formData.RoleId}
                              onChange={(e) => setFormData({ ...formData, RoleId: e.target.value })}
                              required
                            >
                              <option value="">Select a role</option>
                              {doctorRoles.filter(r => r && r.id && r.name).map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="dialog-field-single-column">
                            <Label htmlFor="editUserName" className="dialog-label-standard">User Name *</Label>
                            <Input
                              id="editUserName"
                              placeholder="Enter user name"
                              value={formData.UserName}
                              onChange={(e) => setFormData({ ...formData, UserName: e.target.value })}
                              className="dialog-input-standard"
                              required
                            />
                          </div>
                        </div>
                        <div className="dialog-form-field-grid">
                          <div className="dialog-field-single-column">
                            <Label htmlFor="editPhoneNo" className="dialog-label-standard">Phone Number *</Label>
                            <Input
                              id="editPhoneNo"
                              placeholder="Enter 10-digit phone number"
                              value={formData.PhoneNo}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                                if (value.length <= 10) {
                                  setFormData({ ...formData, PhoneNo: value });
                                }
                              }}
                              className="dialog-input-standard"
                              maxLength={10}
                              required
                            />
                          </div>
                          <div className="dialog-field-single-column">
                            <Label htmlFor="editEmailId" className="dialog-label-standard">Email</Label>
                            <Input
                              id="editEmailId"
                              type="email"
                              placeholder="Enter email"
                              value={formData.EmailId}
                              onChange={(e) => setFormData({ ...formData, EmailId: e.target.value })}
                              className="dialog-input-standard"
                            />
                          </div>
                        </div>

                        {/* Doctor-specific fields - Always shown since we only work with doctors/surgeons */}
                        <div className="dialog-form-field">
                          <h3 className="text-sm font-semibold mb-4 text-gray-700">Doctor Information</h3>
                        </div>
                            <div className="dialog-form-field-grid">
                              <div className="dialog-field-single-column">
                                <Label htmlFor="editDoctorDepartmentId" className="dialog-label-standard">Department</Label>
                                <select
                                  id="editDoctorDepartmentId"
                                  aria-label="Department"
                                  className="dialog-select-standard"
                                  value={formData.DoctorDepartmentId}
                                  onChange={(e) => setFormData({ ...formData, DoctorDepartmentId: e.target.value })}
                                >
                                  <option value="">Select a department</option>
                                  {departments && departments.length > 0 ? (
                                    departments.filter(d => d && d.id !== undefined && d.id !== null).map(dept => (
                                      <option key={dept.id} value={String(dept.id)}>
                                        {dept.name}
                                      </option>
                                    ))
                                  ) : (
                                    <option value="" disabled>Loading departments...</option>
                                  )}
                                </select>
                              </div>
                              <div className="dialog-field-single-column">
                                <Label htmlFor="editDoctorQualification" className="dialog-label-standard">Qualification</Label>
                                <Input
                                  id="editDoctorQualification"
                                  placeholder="e.g., MBBS, MD"
                                  value={formData.DoctorQualification}
                                  onChange={(e) => setFormData({ ...formData, DoctorQualification: e.target.value })}
                                  className="dialog-input-standard"
                                />
                              </div>
                            </div>
                            <div className="dialog-form-field-grid">
                              <div className="dialog-field-single-column">
                                <Label htmlFor="editDoctorType" className="dialog-label-standard">Doctor Type</Label>
                                <select
                                  id="editDoctorType"
                                  aria-label="Doctor Type"
                                  className="dialog-select-standard"
                                  value={formData.DoctorType || ''}
                                  onChange={(e) => setFormData({ ...formData, DoctorType: e.target.value as 'INHOUSE' | 'VISITING' || undefined })}
                                >
                                  <option value="">Select type</option>
                                  <option value="INHOUSE">INHOUSE</option>
                                  <option value="VISITING">VISITING</option>
                                </select>
                              </div>
                              <div className="dialog-field-single-column">
                                <Label htmlFor="editDoctorOPDCharge" className="dialog-label-standard">OPD Charge</Label>
                                <Input
                                  id="editDoctorOPDCharge"
                                  type="number"
                                  placeholder="Enter OPD charge"
                                  value={formData.DoctorOPDCharge || ''}
                                  onChange={(e) => setFormData({ ...formData, DoctorOPDCharge: e.target.value ? Number(e.target.value) : undefined })}
                                  className="dialog-input-standard"
                                />
                              </div>
                            </div>
                            <div className="dialog-form-field-grid">
                              <div className="dialog-field-single-column">
                                <Label htmlFor="editDoctorSurgeryCharge" className="dialog-label-standard">Surgery Charge</Label>
                                <Input
                                  id="editDoctorSurgeryCharge"
                                  type="number"
                                  placeholder="Enter surgery charge"
                                  value={formData.DoctorSurgeryCharge || ''}
                                  onChange={(e) => setFormData({ ...formData, DoctorSurgeryCharge: e.target.value ? Number(e.target.value) : undefined })}
                                  className="dialog-input-standard"
                                />
                              </div>
                            </div>
                            <div className="dialog-form-field-grid">
                              <div className="dialog-field-single-column">
                                <Label htmlFor="editOpdConsultation" className="dialog-label-standard">OPD Consultation</Label>
                                <select
                                  id="editOpdConsultation"
                                  aria-label="OPD Consultation"
                                  className="dialog-select-standard"
                                  value={formData.OPDConsultation || ''}
                                  onChange={(e) => setFormData({ ...formData, OPDConsultation: e.target.value as 'Yes' | 'No' || undefined })}
                                >
                                  <option value="">Select</option>
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                              <div className="dialog-field-single-column">
                                <Label htmlFor="editIpdVisit" className="dialog-label-standard">IPD Visit</Label>
                                <select
                                  id="editIpdVisit"
                                  aria-label="IPD Visit"
                                  className="dialog-select-standard"
                                  value={formData.IPDVisit || ''}
                                  onChange={(e) => setFormData({ ...formData, IPDVisit: e.target.value as 'Yes' | 'No' || undefined })}
                                >
                                  <option value="">Select</option>
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                            </div>
                            <div className="dialog-form-field-grid">
                              <div className="dialog-field-single-column">
                                <Label htmlFor="editOtHandle" className="dialog-label-standard">OT Handle</Label>
                                <select
                                  id="editOtHandle"
                                  aria-label="OT Handle"
                                  className="dialog-select-standard"
                                  value={formData.OTHandle || ''}
                                  onChange={(e) => setFormData({ ...formData, OTHandle: e.target.value as 'Yes' | 'No' || undefined })}
                                >
                                  <option value="">Select</option>
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                              <div className="dialog-field-single-column">
                                <Label htmlFor="editIcuVisits" className="dialog-label-standard">ICU Visits</Label>
                                <select
                                  id="editIcuVisits"
                                  aria-label="ICU Visits"
                                  className="dialog-select-standard"
                                  value={formData.ICUVisits || ''}
                                  onChange={(e) => setFormData({ ...formData, ICUVisits: e.target.value as 'Yes' | 'No' || undefined })}
                                >
                                  <option value="">Select</option>
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </div>
                            </div>
                        <div className="dialog-form-field">
                          <div className="flex items-center gap-3">
                            <Label htmlFor="edit-status" className="dialog-label-standard">Status</Label>
                            <div className="flex-shrink-0 relative" style={{ zIndex: 1 }}>
                              <Switch
                                id="edit-status"
                                checked={formData.Status === 'Active'}
                                onCheckedChange={(checked) => {
                                  setFormData({ ...formData, Status: checked ? 'Active' : 'InActive' });
                                }}
                                className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 [&_[data-slot=switch-thumb]]:!bg-white [&_[data-slot=switch-thumb]]:!border [&_[data-slot=switch-thumb]]:!border-gray-400 [&_[data-slot=switch-thumb]]:!shadow-sm"
                                style={{
                                  width: '2.5rem',
                                  height: '1.5rem',
                                  minWidth: '2.5rem',
                                  minHeight: '1.5rem',
                                  display: 'inline-flex',
                                  position: 'relative',
                                  backgroundColor: formData.Status === 'Active' ? '#2563eb' : '#d1d5db',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="dialog-footer-standard">
                      <Button variant="outline" onClick={() => {
                        setIsEditDialogOpen(false);
                        setSelectedDoctor(null);
                        setFormData({
                          RoleId: '',
                          UserName: '',
                          Password: '',
                          PhoneNo: '',
                          EmailId: '',
                          DoctorDepartmentId: '',
                          DoctorQualification: '',
                          DoctorType: undefined,
                          DoctorOPDCharge: undefined,
                          DoctorSurgeryCharge: undefined,
                          OPDConsultation: undefined,
                          IPDVisit: undefined,
                          OTHandle: undefined,
                          ICUVisits: undefined,
                          Status: 'Active',
                        });
                      }} className="dialog-footer-button">Cancel</Button>
                      <Button onClick={handleEditSubmit} className="dialog-footer-button">Update Doctor</Button>
                    </div>
                </CustomResizableDialog>
            </div>

          </div>

          <div className="px-6 pt-4 pb-4 flex-1">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Inhouse Doctors</p>
                      <h3 className="text-gray-900">{doctorStats.inhouse}</h3>
                    </div>
                    <Building2 className="size-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Visiting / Consulting Doctors</p>
                      <h3 className="text-gray-900">{doctorStats.consulting}</h3>
                    </div>
                    <Stethoscope className="size-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Surgeons</p>
                      <h3 className="text-gray-900">{doctorStats.surgeons}</h3>
                    </div>
                    <Scissors className="size-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, role, department, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status Filter Tabs and Doctors Table */}
            <Tabs 
              value={selectedStatus} 
              onValueChange={(value) => onStatusFilterChange(value as 'Active' | 'InActive' | 'all')}
              className="space-y-6"
            >
              <div className="mb-4 flex-shrink-0">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="all">
                    All ({filteredAllDoctors.length})
                  </TabsTrigger>
                  <TabsTrigger value="Active">
                    Active ({filteredActiveDoctors.length})
                  </TabsTrigger>
                  <TabsTrigger value="InActive">
                    InActive ({filteredInactiveDoctors.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all">
                {renderDoctorsTable(filteredAllDoctors, true)}
              </TabsContent>

              <TabsContent value="Active">
                {renderDoctorsTable(filteredActiveDoctors, false)}
              </TabsContent>

              <TabsContent value="InActive">
                {renderDoctorsTable(filteredInactiveDoctors, true)}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}

