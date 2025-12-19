import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Users, ClipboardList, BedDouble, Scissors, HeartPulse, Activity, Building2, Stethoscope, Edit, Trash2, Siren } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useDashboard } from '../hooks';
import { patientsApi } from '../api/patients';
import { ChartData, DoctorQueue, EmergencyAdmission, Patient } from '../types';
import { Department, DepartmentCategory } from '../types/departments';

const statConfig = [
  { title: 'OPD Patients Today', key: 'opdPatientsToday' as const, change: '+12', icon: Users, color: 'bg-blue-500' },
  { title: 'Active Tokens', key: 'activeTokens' as const, change: 'Live', icon: ClipboardList, color: 'bg-green-500' },
  { title: 'IPD Admissions', key: 'ipdAdmissions' as const, change: '15 Available', icon: BedDouble, color: 'bg-purple-500' },
  { title: 'OT Scheduled', key: 'otScheduled' as const, change: '3 Ongoing', icon: Scissors, color: 'bg-orange-500' },
  { title: 'ICU Occupied', key: 'icuOccupied' as const, change: '80%', icon: HeartPulse, color: 'bg-red-500' },
  { title: 'Total Patients', key: 'totalPatients' as const, change: 'Today', icon: Activity, color: 'bg-teal-500' },
];

const categoryOptions: DepartmentCategory[] = ['Clinical', 'Surgical', 'Diagnostic', 'Support', 'Administrative'];

export function Dashboard() {
  // Only fetch essential dashboard data on mount
  const { stats, opdData, admissionData, doctorQueue, loading } = useDashboard();
  
  // Deferred data - only fetch when needed
  const [emergencyAdmissions, setEmergencyAdmissions] = useState<EmergencyAdmission[]>([]);
  const [emergencyAdmissionsLoading, setEmergencyAdmissionsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Clinical' as DepartmentCategory,
    description: '',
    specialisationDetails: '',
    noOfDoctors: 0,
    status: 'active' as 'active' | 'inactive',
  });

  // Lazy load emergency admissions when Emergency Admissions section is visible
  useEffect(() => {
    const loadEmergencyAdmissions = async () => {
      if (emergencyAdmissions.length === 0 && !emergencyAdmissionsLoading) {
        setEmergencyAdmissionsLoading(true);
        try {
          const { emergencyAdmissionsApi } = await import('../api/emergencyAdmissions');
          const data = await emergencyAdmissionsApi.getAll();
          setEmergencyAdmissions(data);
        } catch (err) {
          console.error('Failed to fetch emergency admissions:', err);
          setEmergencyAdmissions([]);
        } finally {
          setEmergencyAdmissionsLoading(false);
        }
      }
    };
    loadEmergencyAdmissions();
  }, []);

  // Lazy load departments when Departments section is visible
  useEffect(() => {
    const loadDepartments = async () => {
      if (departments.length === 0 && !departmentsLoading) {
        setDepartmentsLoading(true);
        try {
          const { departmentsApi } = await import('../api/departments');
          const data = await departmentsApi.getAll();
          setDepartments(data);
        } catch (err) {
          console.error('Failed to fetch departments:', err);
          setDepartments([]);
        } finally {
          setDepartmentsLoading(false);
        }
      }
    };
    loadDepartments();
  }, []);

  // Lazy load staff and roles when needed for doctor/patient name lookups
  useEffect(() => {
    const loadStaffAndRoles = async () => {
      if (staff.length === 0 || roles.length === 0) {
        try {
          const [{ staffApi }, { rolesApi }] = await Promise.all([
            import('../api/staff'),
            import('../api/roles')
          ]);
          const [staffData, rolesData] = await Promise.all([
            staffApi.getAll(),
            rolesApi.getAll()
          ]);
          setStaff(staffData);
          setRoles(rolesData);
        } catch (err) {
          console.error('Failed to fetch staff/roles:', err);
        }
      }
    };
    // Only load if we have emergency admissions that need doctor names
    if (emergencyAdmissions.length > 0) {
      loadStaffAndRoles();
    }
  }, [emergencyAdmissions.length]);

  // Lazy load patients when needed for patient name lookups
  useEffect(() => {
    const loadPatients = async () => {
      if (patients.length === 0) {
        try {
          const response = await patientsApi.getAll(1, 1000);
          const patientsList = response.data || [];
          setPatients(patientsList);
        } catch (err) {
          console.error('Failed to fetch patients:', err);
          setPatients([]);
        }
      }
    };
    // Only load if we have emergency admissions that need patient names
    if (emergencyAdmissions.length > 0) {
      loadPatients();
    }
  }, [emergencyAdmissions.length]);

  // Filter staff to get doctors
  const doctors = useMemo(() => {
    if (!staff || !roles || staff.length === 0 || roles.length === 0) return [];
    return staff
      .filter((member) => {
        if (!member.RoleId) return false;
        const role = roles.find(r => r.id === member.RoleId);
        if (!role || !role.name) return false;
        const roleNameLower = role.name.toLowerCase();
        return roleNameLower.includes('doctor') || roleNameLower.includes('surgeon');
      })
      .map((member) => ({
        id: member.UserId || 0,
        name: member.UserName || 'Unknown',
        role: roles.find(r => r.id === member.RoleId)?.name || 'Unknown',
      }));
  }, [staff, roles]);

  // Helper function to get patient name
  const getPatientName = (admission: EmergencyAdmission): string => {
    if (admission.patientName) {
      return `${admission.patientName}${admission.patientNo ? ` (${admission.patientNo})` : ''}`;
    }
    if (patients.length === 0) return 'Loading...';
    const patient = patients.find(p => {
      const pid = (p as any).patientId || (p as any).PatientId || '';
      return pid === admission.patientId;
    });
    if (patient) {
      const patientName = (patient as any).patientName || (patient as any).PatientName || '';
      const lastName = (patient as any).lastName || (patient as any).LastName || '';
      const fullName = `${patientName} ${lastName}`.trim();
      const patientNo = (patient as any).patientNo || (patient as any).PatientNo || '';
      return `${fullName || 'Unknown'}${patientNo ? ` (${patientNo})` : ''}`;
    }
    return 'Unknown';
  };

  // Helper function to get doctor name
  const getDoctorName = (admission: EmergencyAdmission): string => {
    if (admission.doctorName) {
      return admission.doctorName;
    }
    if (doctors.length === 0) return 'Loading...';
    const doctor = doctors.find(d => d.id === admission.doctorId);
    return doctor ? doctor.name : 'Unknown';
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      category: department.category,
      description: department.description || '',
      specialisationDetails: department.specialisationDetails || '',
      noOfDoctors: department.noOfDoctors || 0,
      status: department.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedDepartment) return;
    try {
      await updateDepartment({
        id: selectedDepartment.id,
        name: formData.name,
        category: formData.category,
        description: formData.description || undefined,
        specialisationDetails: formData.specialisationDetails || undefined,
        noOfDoctors: formData.noOfDoctors || undefined,
        status: formData.status,
      });
      setIsEditDialogOpen(false);
      setSelectedDepartment(null);
      await fetchDepartments();
    } catch (err) {
      console.error('Failed to update department:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      try {
        await deleteDepartment(id);
        await fetchDepartments();
      } catch (err) {
        console.error('Failed to delete department:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-blue-600">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-500">Real-time hospital operations monitoring</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statConfig.map((config) => {
          const Icon = config.icon;
          const value = stats?.[config.key]?.toString() || '0';
          return (
            <Card key={config.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${config.color} p-3 rounded-lg`}>
                    <Icon className="size-6 text-white" />
                  </div>
                  <span className="text-sm text-gray-600">{config.change}</span>
                </div>
                <h3 className="text-gray-900 mb-1">{value}</h3>
                <p className="text-sm text-gray-500">{config.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>OPD Patient Flow - Weekly</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={opdData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="patients" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IPD Room Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {(!admissionData || admissionData.length === 0) ? (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <p>No IPD room distribution data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={admissionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {admissionData.map((entry, index) => {
                      const defaultColors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];
                      const fillColor = entry.color || defaultColors[index % defaultColors.length] || '#8884d8';
                      return <Cell key={`cell-${index}`} fill={fillColor} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value: any) => value} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Doctor Queue Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Doctor Queue Status - Live</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">Doctor</th>
                  <th className="text-left py-3 px-4 text-gray-700">Department Name</th>
                  <th className="text-left py-3 px-4 text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-gray-700">Waiting</th>
                  <th className="text-left py-3 px-4 text-gray-700">Consulting</th>
                  <th className="text-left py-3 px-4 text-gray-700">Completed Today</th>
                  <th className="text-left py-3 px-4 text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {(doctorQueue || []).map((doc, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{doc.doctor}</td>
                    <td className="py-3 px-4 text-gray-600">{doc.specialty}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        doc.type === 'inhouse' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {doc.type === 'inhouse' ? 'Inhouse' : 'Consulting'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                        {doc.waiting}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {doc.consulting}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{doc.completed}</td>
                    <td className="py-3 px-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Admissions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Siren className="size-5" />
            Emergency Admissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">ID</th>
                  <th className="text-left py-3 px-4 text-gray-700">Patient</th>
                  <th className="text-left py-3 px-4 text-gray-700">Doctor</th>
                  <th className="text-left py-3 px-4 text-gray-700">Admission Date</th>
                  <th className="text-left py-3 px-4 text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-gray-700">Condition</th>
                  <th className="text-left py-3 px-4 text-gray-700">Bed Slot</th>
                </tr>
              </thead>
              <tbody>
                {(!emergencyAdmissions || emergencyAdmissions.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No emergency admissions found
                    </td>
                  </tr>
                ) : (
                  emergencyAdmissions.slice(0, 10).map((admission) => (
                    <tr key={admission.emergencyAdmissionId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-mono">{admission.emergencyAdmissionId}</td>
                      <td className="py-3 px-4 text-gray-900">{getPatientName(admission)}</td>
                      <td className="py-3 px-4 text-gray-900">{getDoctorName(admission)}</td>
                      <td className="py-3 px-4 text-gray-600">{admission.emergencyAdmissionDate}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          admission.emergencyStatus === 'Admitted' ? 'bg-blue-100 text-blue-700' :
                          admission.emergencyStatus === 'IPD' ? 'bg-green-100 text-green-700' :
                          admission.emergencyStatus === 'OT' ? 'bg-purple-100 text-purple-700' :
                          admission.emergencyStatus === 'ICU' ? 'bg-orange-100 text-orange-700' :
                          admission.emergencyStatus === 'Discharged' ? 'bg-gray-100 text-gray-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {admission.emergencyStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          admission.patientCondition === 'Critical' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {admission.patientCondition}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{admission.emergencyBedSlotNo || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {emergencyAdmissions && emergencyAdmissions.length > 10 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Showing 10 of {emergencyAdmissions.length} emergency admissions
            </div>
          )}
        </CardContent>
      </Card>

      {/* Departments Overview */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Departments Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(departments || []).slice(0, 6).map((dept) => (
              <Card key={dept.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-gray-900 font-semibold mb-1">{dept.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        dept.category === 'Clinical' ? 'bg-blue-100 text-blue-700' :
                        dept.category === 'Surgical' ? 'bg-red-100 text-red-700' :
                        dept.category === 'Diagnostic' ? 'bg-green-100 text-green-700' :
                        dept.category === 'Support' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {dept.category}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(dept)}>
                        <Edit className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(dept.id)}>
                        <Trash2 className="size-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
                    <p className="text-sm text-gray-600">{dept.description || 'No description available'}</p>
                  </div>
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex items-start gap-2 text-gray-600">
                      <Stethoscope className="size-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-xs font-medium text-gray-700">Specialisation: </span>
                        <span className="text-xs">{dept.specialisationDetails || 'Not specified'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="size-4" />
                      <span>{dept.noOfDoctors !== undefined ? `${dept.noOfDoctors} Doctor${dept.noOfDoctors !== 1 ? 's' : ''}` : '0 Doctors'}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className={`px-2 py-1 rounded text-xs ${
                      dept.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {dept.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {(!departments || departments.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              No departments found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Department Name</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., Medicine"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <select
                  id="edit-category"
                  aria-label="Category"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as DepartmentCategory })}
                >
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Enter department description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-specialisationDetails">Specialisation Details</Label>
              <Textarea
                id="edit-specialisationDetails"
                placeholder="e.g., Cardiology, Interventional Cardiology, Cardiac Rehabilitation"
                value={formData.specialisationDetails}
                onChange={(e) => setFormData({ ...formData, specialisationDetails: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-noOfDoctors">Number of Doctors</Label>
              <Input
                id="edit-noOfDoctors"
                type="number"
                min="0"
                placeholder="Enter number of doctors"
                value={formData.noOfDoctors}
                onChange={(e) => setFormData({ ...formData, noOfDoctors: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                aria-label="Status"
                className="w-full px-3 py-2 border border-gray-200 rounded-md"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit}>Update Department</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
