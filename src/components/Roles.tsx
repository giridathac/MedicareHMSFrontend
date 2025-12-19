// Role Management Component - Separated UI from logic
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Trash2, Edit, Shield, Search, Eye, CheckCircle2, XCircle } from 'lucide-react';
import { useRoles } from '../hooks/useRoles';
import { Role } from '../types/roles';

interface RolesViewProps {
  roles: Role[];
  onCreateRole: (data: {
    RoleName: string;
    RoleDescription?: string;
    CreatedBy?: number;
  }) => Promise<void>;
  onUpdateRole: (id: number, data: Partial<{
    RoleName?: string;
    RoleDescription?: string;
  }>) => Promise<void>;
  onDeleteRole: (id: string) => Promise<void>;
}


export function Roles() {
  const { roles, loading, error, createRole, updateRole, deleteRole, fetchRoles } = useRoles();
  
  // Fetch data on mount - always from network
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreateRole = async (data: {
    RoleName: string;
    RoleDescription?: string;
    CreatedBy?: number;
  }) => {
    try {
      await createRole(data);
    } catch (err) {
      console.error('Failed to create role:', err);
      throw err;
    }
  };

  const handleUpdateRole = async (id: string, data: Partial<{
    RoleName?: string;
    RoleDescription?: string;
  }>) => {
    try {
      await updateRole({ id, ...data });
    } catch (err) {
      console.error('Failed to update role:', err);
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      try {
        await deleteRole(id);
      } catch (err) {
        console.error('Failed to delete role:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="text-center py-12 text-gray-600">Loading roles...</div>
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
    <RolesView
      roles={roles}
      onCreateRole={handleCreateRole}
      onUpdateRole={handleUpdateRole}
      onDeleteRole={handleDelete}
    />
  );
}

function RolesView({
  roles,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
}: RolesViewProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    RoleName: '',
    RoleDescription: '',
    permissions: [] as string[],
  });
  const [newPermission, setNewPermission] = useState('');

  // Filter roles based on search term
  const filteredRoles = useMemo(() => {
    if (!searchTerm) return roles;
    const searchLower = searchTerm.toLowerCase();
    return roles.filter(role => {
      const name = (role.name || '').toLowerCase();
      const description = (role.description || '').toLowerCase();
      const permissions = (role.permissions || []).join(' ').toLowerCase();
      
      return name.includes(searchLower) ||
             description.includes(searchLower) ||
             permissions.includes(searchLower);
    });
  }, [roles, searchTerm]);

  const handleAddSubmit = async () => {
    try {
      await onCreateRole({
        RoleName: formData.RoleName,
        RoleDescription: formData.RoleDescription || undefined,
        // CreatedBy can be added later from auth context if needed
        // Permissions will be filled in later, not sent during creation
      });
      setIsAddDialogOpen(false);
      setFormData({
        RoleName: '',
        RoleDescription: '',
        permissions: [],
      });
      setNewPermission('');
    } catch (err) {
      // Error handled in parent
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedRole) return;
    try {
      await onUpdateRole(selectedRole.id, {
        RoleName: formData.RoleName,
        RoleDescription: formData.RoleDescription || undefined,
        // Permissions will be handled separately, not in update for now
      });
      setIsEditDialogOpen(false);
      setSelectedRole(null);
      setFormData({
        RoleName: '',
        RoleDescription: '',
        permissions: [],
      });
      setNewPermission('');
    } catch (err) {
      // Error handled in parent
    }
  };

  const handleViewEdit = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      RoleName: role.name,
      RoleDescription: role.description || '',
      permissions: role.permissions || [],
    });
    setIsEditDialogOpen(true);
  };

  const addPermission = () => {
    if (newPermission.trim() && !formData.permissions.includes(newPermission.trim())) {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, newPermission.trim()],
      });
      setNewPermission('');
    }
  };

  const removePermission = (permission: string) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.filter(p => p !== permission),
    });
  };

  const getStatusBadge = (status?: 'Active' | 'InActive' | string) => {
    const roleStatus = status || 'Active';
    if (roleStatus === 'Active' || roleStatus === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle2 className="size-3" />
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          <XCircle className="size-3" />
          Inactive
        </span>
      );
    }
  };

  return (
    <>
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h1 className="text-gray-900 mb-2 text-2xl">Role Management</h1>
                <p className="text-gray-500 text-base">Manage user roles and permissions</p>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="size-4" />
                    Add New Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-0 gap-0 large-dialog bg-white">
                  <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0 bg-white">
                    <DialogTitle className="text-gray-700">Add New Role</DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0 bg-white">
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="name" className="text-gray-600">Role Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter role name (e.g., Superadmin, Doctor, Nurse)"
                          value={formData.RoleName}
                          onChange={(e) => setFormData({ ...formData, RoleName: e.target.value })}
                          className="bg-gray-50 text-gray-900"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description" className="text-gray-600">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Enter role description..."
                          value={formData.RoleDescription}
                          onChange={(e) => setFormData({ ...formData, RoleDescription: e.target.value })}
                          rows={3}
                          className="bg-gray-50 text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t bg-white px-6 pb-4">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddSubmit}>Add Role</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="px-6 pt-4 pb-4 flex-1">
            {/* Search */}
            <Card className="mb-6 bg-white">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    placeholder="Search by role name, description, or permissions..."
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
                        <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Role Name</th>
                        <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Description</th>
                        <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Status</th>
                        <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Created</th>
                        <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoles.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            {searchTerm ? 'No roles found matching your search.' : 'No roles found.'}
                          </td>
                        </tr>
                      ) : (
                        filteredRoles.map((role) => (
                          <tr key={role.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <Shield className="size-4 text-blue-600" />
                                <span className="text-gray-900 font-medium">{role.name}</span>
                                {role.isSuperAdmin && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                    Super Admin
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-gray-600">
                              {role.description || (
                                <span className="text-gray-400 italic">No description</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              {getStatusBadge((role as any).status || 'Active')}
                            </td>
                            <td className="py-4 px-6 text-gray-600 text-sm">
                              {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-1"
                                  onClick={() => handleViewEdit(role)}
                                >
                                  <Edit className="size-3" />
                                  View & Edit
                                </Button>
                              </div>
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

      {/* View & Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="p-0 gap-0 large-dialog bg-white">
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0 bg-white">
            <DialogTitle className="text-gray-700">View &Edit Role</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0 bg-white">
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name" className="text-gray-600">Role Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter role name (e.g., Superadmin, Doctor, Nurse)"
                  value={formData.RoleName}
                  onChange={(e) => setFormData({ ...formData, RoleName: e.target.value })}
                  className="bg-gray-50 text-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-gray-600">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter role description..."
                  value={formData.RoleDescription}
                  onChange={(e) => setFormData({ ...formData, RoleDescription: e.target.value })}
                  rows={3}
                  className="bg-gray-50 text-gray-900"
                />
              </div>
              {selectedRole && (
                <div>
                  <Label className="text-gray-600">Created At</Label>
                  <Input
                    value={selectedRole.createdAt ? new Date(selectedRole.createdAt).toLocaleString() : '-'}
                    disabled
                    className="bg-gray-50 text-gray-700"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t bg-white px-6 pb-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit}>Update Role</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

