// Doctors Management Component - Fetch from /api/users and filter doctors/surgeons
import React, { useMemo, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Users, Stethoscope, Search, Building2, Scissors } from 'lucide-react';
import { useStaff } from '../hooks/useStaff';
import { useRoles } from '../hooks/useRoles';
import { useDepartments } from '../hooks/useDepartments';
import { Staff } from '../types/staff';

interface DoctorsViewProps {
  doctors: Staff[];
  roles: Array<{ id: string; name: string }>;
  departments: Array<{ id: number; name: string }>;
  selectedStatus: 'Active' | 'InActive' | 'all';
  onStatusFilterChange: (status: 'Active' | 'InActive' | 'all') => void;
}

export function Doctors() {
  const { staff, loading, error } = useStaff();
  const { roles } = useRoles();
  const { departments } = useDepartments();
  const [selectedStatus, setSelectedStatus] = useState<'Active' | 'InActive' | 'all'>('all');

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

  return (
    <DoctorsView
      doctors={doctors}
      allDoctors={allDoctors}
      roles={roles}
      departments={departments}
      selectedStatus={selectedStatus}
      onStatusFilterChange={setSelectedStatus}
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
}: DoctorsViewProps & { allDoctors: Staff[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role?.name || '-';
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId) return '-';
    const dept = departments.find(d => d.id.toString() === departmentId);
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

  // Filter doctors based on search term
  const filteredDoctors = useMemo(() => {
    if (!searchTerm) return doctors;
    const searchLower = searchTerm.toLowerCase();
    return doctors.filter(doctor => {
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
  }, [doctors, searchTerm, roles, departments]);

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
                    All ({allDoctors.length})
                  </TabsTrigger>
                  <TabsTrigger value="Active">
                    Active ({allDoctors.filter(d => d.Status === 'Active').length})
                  </TabsTrigger>
                  <TabsTrigger value="InActive">
                    InActive ({allDoctors.filter(d => d.Status === 'InActive').length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
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
                      <p className="text-sm text-gray-500 mb-1">Consulting Doctors</p>
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

            {/* Doctors Table */}
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
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDoctors.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-500">
                            {searchTerm ? 'No doctors found matching your search.' : 'No doctors found.'}
                          </td>
                        </tr>
                      ) : (
                        filteredDoctors.map((doctor) => (
                          <tr key={doctor.UserId || `doctor-${Math.random()}`} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Users className="size-4 text-blue-600" />
                                <span className="text-gray-900 font-medium">{doctor.UserName || '-'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{getRoleName(doctor.RoleId)}</td>
                            <td className="py-3 px-4 text-gray-600">{getDepartmentName(doctor.DoctorDepartmentId)}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs ${
                                doctor.DoctorType === 'INHOUSE' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : doctor.DoctorType === 'VISITING'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {doctor.DoctorType === 'INHOUSE' ? 'Inhouse' : doctor.DoctorType === 'VISITING' ? 'Visiting' : '-'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{doctor.PhoneNo || '-'}</td>
                            <td className="py-3 px-4 text-gray-600">{doctor.EmailId || '-'}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeColor(doctor.Status)}`}>
                                {doctor.Status || 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

