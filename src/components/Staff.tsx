// Staff Management Component - Separated UI from logic
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Plus, Trash2, Edit, Users, Search } from 'lucide-react';
import { useStaff } from '../hooks/useStaff';
import { useDepartments } from '../hooks/useDepartments';
import { useRoles } from '../hooks/useRoles';
import { Staff, CreateUserDto } from '../types/staff';
import { Role } from '../types/roles';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface StaffViewProps {
  staff: Staff[];
  roles: Role[];
  departments: Array<{ id: number; name: string; category: string }>;
  onCreateStaff: (data: CreateUserDto) => Promise<void>;
  onUpdateStaff: (data: { UserId: number } & Partial<CreateUserDto>) => Promise<void>;
  onDeleteStaff: (id: number) => Promise<void>;
}

export function StaffManagement() {
  const { staff: allStaff, loading, error, createStaff, updateStaff, deleteStaff, fetchStaff } = useStaff();
  const { departments, loading: departmentsLoading, error: departmentsError, fetchDepartments } = useDepartments();
  const { roles, fetchRoles } = useRoles();
  
  // Fetch data on mount - always from network
  useEffect(() => {
    fetchStaff();
    fetchDepartments();
    fetchRoles();
  }, [fetchStaff, fetchDepartments, fetchRoles]);
  const [selectedStatus, setSelectedStatus] = useState<'Active' | 'InActive' | 'all'>('all');
  
  const staff = allStaff.filter(s => {
    const statusMatch = selectedStatus === 'all' || s.Status === selectedStatus;
    return statusMatch;
  });

  const handleCreateStaff = async (data: CreateUserDto) => {
    try {
      await createStaff(data);
    } catch (err) {
      console.error('Failed to create staff:', err);
      throw err;
    }
  };

  const handleUpdateStaff = async (data: { UserId: number } & Partial<CreateUserDto>) => {
    try {
      await updateStaff(data);
    } catch (err) {
      console.error('Failed to update staff:', err);
      throw err;
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      try {
        await deleteStaff(id);
      } catch (err) {
        console.error('Failed to delete staff:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0">
        <div className="px-6 pt-6 pb-0 flex-shrink-0">
          <div className="text-center py-12 text-gray-600">Loading staff...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0">
        <div className="px-6 pt-6 pb-0 flex-shrink-0">
          <div className="text-center py-12 text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }
  
  if (departmentsError) {
    console.error('Departments fetch error:', departmentsError);
  }

  return (
    <StaffView
      staff={allStaff}
      roles={roles}
      departments={departments}
      selectedStatus={selectedStatus}
      onStatusFilterChange={setSelectedStatus}
      onCreateStaff={handleCreateStaff}
      onUpdateStaff={handleUpdateStaff}
      onDeleteStaff={handleDelete}
    />
  );
}

function StaffView({
  staff,
  roles,
  departments,
  selectedStatus,
  onStatusFilterChange,
  onCreateStaff,
  onUpdateStaff,
  onDeleteStaff,
}: StaffViewProps & { 
  selectedStatus: 'Active' | 'InActive' | 'all';
  onStatusFilterChange: (status: 'Active' | 'InActive' | 'all') => void;
}) {
  console.log('[StaffView] Rendering with departments:', departments);
  console.log('[StaffView] Departments length:', departments?.length);
  console.log('[StaffView] Departments type:', typeof departments);
  const allStaff = staff; // staff prop now contains all staff (unfiltered)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Check if selected role is a doctor role
  const isDoctorRole = (roleId: string): boolean => {
    if (!roleId || !roles || roles.length === 0) return false;
    const role = roles.find(r => r && r.id === roleId);
    if (!role || !role.name) return false;
    const roleNameLower = role.name.toLowerCase();
    return roleNameLower.includes('doctor') || roleNameLower.includes('surgeon');
  };

  const selectedRoleIsDoctor = formData.RoleId ? isDoctorRole(formData.RoleId) : false;
  console.log('[Add Dialog] selectedRoleIsDoctor:', selectedRoleIsDoctor, 'RoleId:', formData.RoleId);
  console.log('[Add Dialog] Departments available:', departments, 'Length:', departments?.length);

  const handleAddSubmit = async () => {
    try {
      const submitData: CreateUserDto = {
        RoleId: formData.RoleId,
        UserName: formData.UserName,
        Password: formData.Password,
        PhoneNo: formData.PhoneNo || undefined,
        EmailId: formData.EmailId || undefined,
        Status: formData.Status || 'Active',
      };

      // Only include doctor fields if role is doctor
      if (selectedRoleIsDoctor) {
        submitData.DoctorDepartmentId = formData.DoctorDepartmentId || undefined;
        submitData.DoctorQualification = formData.DoctorQualification || undefined;
        submitData.DoctorType = formData.DoctorType;
        submitData.DoctorOPDCharge = formData.DoctorOPDCharge;
        submitData.DoctorSurgeryCharge = formData.DoctorSurgeryCharge;
        submitData.OPDConsultation = formData.OPDConsultation;
        submitData.IPDVisit = formData.IPDVisit;
        submitData.OTHandle = formData.OTHandle;
        submitData.ICUVisits = formData.ICUVisits;
      }

      await onCreateStaff(submitData);
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
    } catch (err) {
      // Error handled in parent
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedStaff || !selectedStaff.UserId) return;
    try {
      const submitData: Partial<CreateUserDto> = {
        RoleId: formData.RoleId,
        UserName: formData.UserName,
        PhoneNo: formData.PhoneNo || undefined,
        EmailId: formData.EmailId || undefined,
        Status: formData.Status || 'Active',
      };

      // Only include doctor fields if role is doctor
      if (selectedRoleIsDoctor) {
        submitData.DoctorDepartmentId = formData.DoctorDepartmentId || undefined;
        submitData.DoctorQualification = formData.DoctorQualification || undefined;
        submitData.DoctorType = formData.DoctorType;
        submitData.DoctorOPDCharge = formData.DoctorOPDCharge;
        submitData.DoctorSurgeryCharge = formData.DoctorSurgeryCharge;
        submitData.OPDConsultation = formData.OPDConsultation;
        submitData.IPDVisit = formData.IPDVisit;
        submitData.OTHandle = formData.OTHandle;
        submitData.ICUVisits = formData.ICUVisits;
      }

      await onUpdateStaff({ UserId: selectedStaff.UserId, ...submitData });
      setIsEditDialogOpen(false);
      setSelectedStaff(null);
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
    } catch (err) {
      // Error handled in parent
    }
  };

  const handleEdit = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    const roleIsDoctor = staffMember.RoleId ? isDoctorRole(staffMember.RoleId) : false;
    setFormData({
      RoleId: staffMember.RoleId,
      UserName: staffMember.UserName,
      Password: '', // Don't populate password
      PhoneNo: staffMember.PhoneNo || '',
      EmailId: staffMember.EmailId || '',
      DoctorDepartmentId: staffMember.DoctorDepartmentId || '',
      DoctorQualification: staffMember.DoctorQualification || '',
      DoctorType: staffMember.DoctorType,
      DoctorOPDCharge: staffMember.DoctorOPDCharge,
      DoctorSurgeryCharge: staffMember.DoctorSurgeryCharge,
      OPDConsultation: staffMember.OPDConsultation,
      IPDVisit: staffMember.IPDVisit,
      OTHandle: staffMember.OTHandle,
      ICUVisits: staffMember.ICUVisits,
      Status: staffMember.Status || 'Active',
    });
    setIsEditDialogOpen(true);
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

  // Filter staff based on selected status and search term
  const filteredStaff = useMemo(() => {
    let filtered = allStaff;
    
    // First filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(s => s.Status === selectedStatus);
    }
    
    // Then filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(s => {
        const userName = (s.UserName || '').toLowerCase();
        const phone = (s.PhoneNo || '').toLowerCase();
        const email = (s.EmailId || '').toLowerCase();
        const status = (s.Status || '').toLowerCase();
        const role = roles.find(r => r.id === s.RoleId);
        const roleName = (role?.name || '').toLowerCase();
        const department = s.DoctorDepartmentId && departments.length > 0
          ? departments.find(d => {
              if (!d || d.id === undefined || d.id === null) return false;
              return String(d.id) === String(s.DoctorDepartmentId) || 
                     d.id === Number(s.DoctorDepartmentId);
            })
          : null;
        const departmentName = (department?.name || '').toLowerCase();
        
        return userName.includes(searchLower) ||
               phone.includes(searchLower) ||
               email.includes(searchLower) ||
               status.includes(searchLower) ||
               roleName.includes(searchLower) ||
               departmentName.includes(searchLower);
      });
    }
    
    return filtered;
  }, [allStaff, selectedStatus, searchTerm, roles, departments]);

  const headerActions = (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Add Staff
        </Button>
      </DialogTrigger>
        <DialogContent className="p-0 gap-0 large-dialog dialog-content-standard">
          <div className="dialog-scrollable-wrapper dialog-content-scrollable">
            <DialogHeader className="dialog-header-standard">
              <DialogTitle className="dialog-title-standard-view">Add New Staff Member</DialogTitle>
            </DialogHeader>
            <div className="dialog-body-content-wrapper">
              <div className="dialog-form-container">
                <div className="dialog-form-field-grid">
                  <div className="dialog-field-single-column">
                    <Label htmlFor="roleId" className="dialog-label-standard">Role *</Label>
                    <select
                      id="roleId"
                      aria-label="Role"
                      className="dialog-select-standard"
                  value={formData.RoleId}
                  onChange={(e) => {
                    const newRoleId = e.target.value;
                    setFormData({ 
                      ...formData, 
                      RoleId: newRoleId,
                      // Clear doctor fields if role changes from doctor to non-doctor
                      ...(newRoleId && !isDoctorRole(newRoleId) ? {
                        DoctorDepartmentId: '',
                        DoctorQualification: '',
                        DoctorType: undefined,
                        DoctorOPDCharge: undefined,
                        DoctorSurgeryCharge: undefined,
                        OPDConsultation: undefined,
                        IPDVisit: undefined,
                        OTHandle: undefined,
                        ICUVisits: undefined,
                      } : {})
                    });
                  }}
                  required
                >
                  <option value="">Select a role</option>
                  {roles.filter(r => r && r.id && r.name).map(role => (
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
                    <Label htmlFor="phoneNo" className="dialog-label-standard">Phone Number</Label>
                    <Input
                      id="phoneNo"
                      placeholder="Enter phone number"
                      value={formData.PhoneNo}
                      onChange={(e) => setFormData({ ...formData, PhoneNo: e.target.value })}
                      className="dialog-input-standard"
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

                {/* Doctor-specific fields */}
                {selectedRoleIsDoctor && (
                  <>
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
                </>
              )}
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
              <Button onClick={handleAddSubmit} className="dialog-footer-button">Add Staff</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );

  return (
    <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0">
      <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <h1 className="text-gray-900 mb-2 text-2xl">Staff Management</h1>
              <p className="text-gray-500 text-base">Manage hospital staff members</p>
            </div>
            {headerActions && <div className="flex-shrink-0">{headerActions}</div>}
          </div>

          {/* Status Filter Tabs */}
          <div className="mb-4 flex-shrink-0">
            <Tabs 
              value={selectedStatus} 
              onValueChange={(value) => onStatusFilterChange(value as 'Active' | 'InActive' | 'all')}
              className="w-full"
            >
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="all">
                  All ({allStaff.length})
                </TabsTrigger>
                <TabsTrigger value="Active">
                  Active ({allStaff.filter(s => s.Status === 'Active').length})
                </TabsTrigger>
                <TabsTrigger value="InActive">
                  InActive ({allStaff.filter(s => s.Status === 'InActive').length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        <div className="px-6 pt-4 pb-4 flex-1">
          {/* Search */}
          <Card className="mb-6 bg-white">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="Search by user name, role, phone, email, department, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50"
                />
              </div>
            </CardContent>
          </Card>

            <Card className="bg-white border border-gray-200 shadow-sm rounded-lg mb-4">
          <CardContent className="p-0 flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="overflow-x-auto overflow-y-scroll border border-gray-200 rounded flex-1 min-h-0 doctors-scrollable h-full">
              <table className="w-full">
          <thead className="sticky top-0 bg-white z-10 shadow-sm">
            <tr className="border-b border-gray-200">
              <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">User Name</th>
              <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Role</th>
              <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Phone</th>
              <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Department</th>
              <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Status</th>
              <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((member) => {
              const role = roles.find(r => r.id === member.RoleId);
              const department = member.DoctorDepartmentId && departments.length > 0
                ? departments.find(d => {
                    if (!d || d.id === undefined || d.id === null) return false;
                    // Try both string and number comparison since DoctorDepartmentId might be UUID string or number
                    return String(d.id) === String(member.DoctorDepartmentId) || 
                           d.id === Number(member.DoctorDepartmentId);
                  })
                : null;
              return (
                <tr key={member.UserId || `staff-${member.UserName}`} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-gray-600" />
                      <span className="text-gray-900 font-medium">{member.UserName || '-'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{role?.name || '-'}</td>
                  <td className="py-4 px-6 text-gray-600">{member.PhoneNo || '-'}</td>
                  <td className="py-4 px-6 text-gray-600">{department?.name || '-'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeColor(member.Status)}`}>
                      {member.Status || 'Active'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="dashboard-actions-container">
                      <Button
                        size="sm"
                        onClick={() => handleEdit(member)}
                        className="dashboard-manage-button"
                        title="Manage Staff"
                      >
                        Manage
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredStaff.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchTerm 
              ? 'No staff members found matching your search.'
              : 'No staff members found'
            }
          </div>
        )}
            </div>
          </CardContent>
        </Card>
          </div>
        </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="p-0 gap-0 large-dialog dialog-content-standard">
          <div className="dialog-scrollable-wrapper dialog-content-scrollable">
            <DialogHeader className="dialog-header-standard">
              <DialogTitle className="dialog-title-standard-view">Edit Staff Member</DialogTitle>
            </DialogHeader>
            <div className="dialog-body-content-wrapper">
              <div className="dialog-form-container">
                <div className="dialog-form-field-grid">
                  <div className="dialog-field-single-column">
                    <Label htmlFor="edit-roleId" className="dialog-label-standard">Role *</Label>
                    <select
                      id="edit-roleId"
                      aria-label="Role"
                      className="dialog-select-standard"
                  value={formData.RoleId}
                  onChange={(e) => {
                    const newRoleId = e.target.value;
                    setFormData({ 
                      ...formData, 
                      RoleId: newRoleId,
                      // Clear doctor fields if role changes from doctor to non-doctor
                      ...(newRoleId && !isDoctorRole(newRoleId) ? {
                        DoctorDepartmentId: '',
                        DoctorQualification: '',
                        DoctorType: undefined,
                        DoctorOPDCharge: undefined,
                        DoctorSurgeryCharge: undefined,
                        OPDConsultation: undefined,
                        IPDVisit: undefined,
                        OTHandle: undefined,
                        ICUVisits: undefined,
                      } : {})
                    });
                  }}
                  required
                >
                  <option value="">Select a role</option>
                  {roles.filter(r => r && r.id && r.name).map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                    </select>
                  </div>
                  <div className="dialog-field-single-column">
                    <Label htmlFor="edit-userName" className="dialog-label-standard">User Name *</Label>
                    <Input
                      id="edit-userName"
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
                    <Label htmlFor="edit-phoneNo" className="dialog-label-standard">Phone Number</Label>
                    <Input
                      id="edit-phoneNo"
                      placeholder="Enter phone number"
                      value={formData.PhoneNo}
                      onChange={(e) => setFormData({ ...formData, PhoneNo: e.target.value })}
                      className="dialog-input-standard"
                    />
                  </div>
                  <div className="dialog-field-single-column">
                    <Label htmlFor="edit-emailId" className="dialog-label-standard">Email</Label>
                    <Input
                      id="edit-emailId"
                      type="email"
                      placeholder="Enter email"
                      value={formData.EmailId}
                      onChange={(e) => setFormData({ ...formData, EmailId: e.target.value })}
                      className="dialog-input-standard"
                    />
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

                {/* Doctor-specific fields */}
                {selectedRoleIsDoctor && (
                  <>
                    <div className="dialog-form-field">
                      <h3 className="text-sm font-semibold mb-4 text-gray-700">Doctor Information</h3>
                    </div>
                    <div className="dialog-form-field-grid">
                      <div className="dialog-field-single-column">
                        <Label htmlFor="edit-doctorDepartmentId" className="dialog-label-standard">Department</Label>
                        <select
                          id="edit-doctorDepartmentId"
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
                      <Label htmlFor="edit-doctorQualification" className="dialog-label-standard">Qualification</Label>
                      <Input
                        id="edit-doctorQualification"
                        placeholder="e.g., MBBS, MD"
                        value={formData.DoctorQualification}
                        onChange={(e) => setFormData({ ...formData, DoctorQualification: e.target.value })}
                        className="dialog-input-standard"
                      />
                    </div>
                  </div>
                    <div className="dialog-form-field-grid">
                      <div className="dialog-field-single-column">
                        <Label htmlFor="edit-doctorType" className="dialog-label-standard">Doctor Type</Label>
                        <select
                          id="edit-doctorType"
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
                      <Label htmlFor="edit-doctorOPDCharge" className="dialog-label-standard">OPD Charge</Label>
                      <Input
                        id="edit-doctorOPDCharge"
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
                      <Label htmlFor="edit-doctorSurgeryCharge" className="dialog-label-standard">Surgery Charge</Label>
                      <Input
                        id="edit-doctorSurgeryCharge"
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
                      <Label htmlFor="edit-opdConsultation" className="dialog-label-standard">OPD Consultation</Label>
                      <select
                        id="edit-opdConsultation"
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
                  <div>
                      <Label htmlFor="edit-ipdVisit" className="dialog-label-standard">IPD Visit</Label>
                      <select
                        id="edit-ipdVisit"
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <Label htmlFor="edit-otHandle" className="dialog-label-standard">OT Handle</Label>
                      <select
                        id="edit-otHandle"
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
                  <div>
                      <Label htmlFor="edit-icuVisits" className="dialog-label-standard">ICU Visits</Label>
                      <select
                        id="edit-icuVisits"
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
                </>
              )}
              </div>
            </div>
            <div className="dialog-footer-standard">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="dialog-footer-button">Cancel</Button>
              <Button onClick={handleEditSubmit} className="dialog-footer-button">Update Staff</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

