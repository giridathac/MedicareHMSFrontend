// Departments Management Component - Separated UI from logic
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Switch } from './ui/switch';
import { Plus, Edit, Search } from 'lucide-react';
import { useDepartments } from '../hooks/useDepartments';
import { Department, DepartmentCategory } from '../types/departments';

interface DepartmentsViewProps {
  departments: Department[];
  selectedCategory: DepartmentCategory | undefined;
  onCategoryChange: (category: DepartmentCategory | undefined) => void;
  onCreateDepartment: (data: {
    name: string;
    category: DepartmentCategory;
    description?: string;
    specialisationDetails?: string;
    noOfDoctors?: number;
    status?: 'active' | 'inactive';
  }) => Promise<void>;
  onUpdateDepartment: (id: number, data: Partial<{
    name: string;
    category: DepartmentCategory;
    description?: string;
    specialisationDetails?: string;
    noOfDoctors?: number;
    status?: 'active' | 'inactive';
  }>) => Promise<void>;
  onDeleteDepartment: (id: number) => Promise<void>;
}

const categoryOptions: DepartmentCategory[] = ['Clinical', 'Surgical', 'Diagnostic', 'Support', 'Administrative'];

export function Departments() {
  const [selectedCategory, setSelectedCategory] = useState<DepartmentCategory | undefined>(undefined);
  // Always fetch all departments, filter client-side
  const { departments, loading, error, createDepartment, updateDepartment, deleteDepartment, fetchDepartments } = useDepartments();
  
  // Fetch data on mount - always from network
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleCreateDepartment = async (data: {
    name: string;
    category: DepartmentCategory;
    description?: string;
    specialisationDetails?: string;
    noOfDoctors?: number;
    status?: 'active' | 'inactive';
  }) => {
    try {
      await createDepartment(data);
    } catch (err) {
      console.error('Failed to create department:', err);
      throw err;
    }
  };

  const handleUpdateDepartment = async (id: number, data: Partial<{
    name: string;
    category: DepartmentCategory;
    description?: string;
    specialisationDetails?: string;
    noOfDoctors?: number;
    status?: 'active' | 'inactive';
  }>) => {
    try {
      await updateDepartment({ id, ...data });
    } catch (err) {
      console.error('Failed to update department:', err);
      throw err;
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      try {
        await deleteDepartment(id);
      } catch (err) {
        console.error('Failed to delete department:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="text-center py-12 text-gray-600">Loading departments...</div>
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
    <DepartmentsView
      departments={departments}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      onCreateDepartment={handleCreateDepartment}
      onUpdateDepartment={handleUpdateDepartment}
      onDeleteDepartment={handleDelete}
    />
  );
}

function DepartmentsView({
  departments,
  selectedCategory,
  onCategoryChange,
  onCreateDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
}: DepartmentsViewProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: 'Clinical' as DepartmentCategory,
    description: '',
    specialisationDetails: '',
    noOfDoctors: 0,
    status: 'active' as 'active' | 'inactive',
  });

  const handleAddSubmit = async () => {
    try {
      await onCreateDepartment({
        name: formData.name,
        category: formData.category,
        description: formData.description || undefined,
        specialisationDetails: formData.specialisationDetails || undefined,
        noOfDoctors: formData.noOfDoctors || undefined,
        status: formData.status,
      });
      setIsAddDialogOpen(false);
      setFormData({
        name: '',
        category: 'Clinical',
        description: '',
        specialisationDetails: '',
        noOfDoctors: 0,
        status: 'active',
      });
    } catch (err) {
      // Error handled in parent
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedDepartment) return;
    try {
      console.log('handleEditSubmit - formData:', formData);
      console.log('handleEditSubmit - description value:', formData.description);
      console.log('handleEditSubmit - description type:', typeof formData.description);
      await onUpdateDepartment(selectedDepartment.id, {
        name: formData.name,
        category: formData.category,
        description: formData.description !== undefined ? formData.description : '', // Always include explicitly
        specialisationDetails: formData.specialisationDetails || undefined,
        noOfDoctors: formData.noOfDoctors || undefined,
        status: formData.status,
      });
      setIsEditDialogOpen(false);
      setSelectedDepartment(null);
      setFormData({
        name: '',
        category: 'Clinical',
        description: '',
        specialisationDetails: '',
        noOfDoctors: 0,
        status: 'active',
      });
    } catch (err) {
      // Error handled in parent
    }
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

  const getCategoryColor = (category: DepartmentCategory) => {
    switch (category) {
      case 'Clinical':
        return 'bg-blue-100 text-blue-700';
      case 'Surgical':
        return 'bg-red-100 text-red-700';
      case 'Diagnostic':
        return 'bg-green-100 text-green-700';
      case 'Support':
        return 'bg-yellow-100 text-yellow-700';
      case 'Administrative':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Filter departments based on category and search term
  const filteredDepartments = useMemo(() => {
    let filtered = departments;
    
    // First filter by category
    if (selectedCategory) {
      filtered = filtered.filter(dept => dept.category === selectedCategory);
    }
    
    // Then filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(dept => {
        const name = (dept.name || '').toLowerCase();
        const category = (dept.category || '').toLowerCase();
        const description = (dept.description || '').toLowerCase();
        const specialisation = (dept.specialisationDetails || '').toLowerCase();
        
        return name.includes(searchLower) ||
               category.includes(searchLower) ||
               description.includes(searchLower) ||
               specialisation.includes(searchLower);
      });
    }
    
    return filtered;
  }, [departments, selectedCategory, searchTerm]);

  return (
    <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
      <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <h1 className="text-gray-900 mb-2 text-2xl">Departments Management</h1>
              <p className="text-gray-500 text-base">Manage hospital departments by category</p>
            </div>
            <div className="flex items-center gap-4">
            <select
              id="categoryFilter"
              aria-label="Filter by Category"
              className="px-4 py-2 border border-gray-200 rounded-md min-w-[200px] text-sm bg-white"
              value={selectedCategory || ''}
              onChange={(e) => {
                const value = e.target.value;
                onCategoryChange(value ? value as DepartmentCategory : undefined);
              }}
            >
              <option value="">All Categories</option>
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="size-4" />
                  Add Department
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 gap-0 large-dialog bg-white">
                <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0 bg-white">
                  <DialogTitle className="text-gray-700">Add New Department</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0 bg-white">
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-gray-600">Department Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Medicine"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="bg-gray-50 text-gray-900"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category" className="text-gray-600">Category</Label>
                        <select
                          id="category"
                          aria-label="Category"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
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
                      <Label htmlFor="description" className="text-gray-600">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter department description..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="bg-gray-50 text-gray-900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="specialisationDetails" className="text-gray-600">Specialisation Details</Label>
                      <Textarea
                        id="specialisationDetails"
                        placeholder="e.g., Cardiology, Interventional Cardiology, Cardiac Rehabilitation"
                        value={formData.specialisationDetails}
                        onChange={(e) => setFormData({ ...formData, specialisationDetails: e.target.value })}
                        rows={3}
                        className="bg-gray-50 text-gray-900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="noOfDoctors" className="text-gray-600">Number of Doctors</Label>
                      <Input
                        id="noOfDoctors"
                        type="number"
                        min="0"
                        placeholder="Enter number of doctors"
                        value={formData.noOfDoctors}
                        onChange={(e) => setFormData({ ...formData, noOfDoctors: parseInt(e.target.value) || 0 })}
                        className="bg-gray-50 text-gray-900"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t bg-white px-6 pb-4">
                  <Button variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    setFormData({
                      name: '',
                      category: 'Clinical',
                      description: '',
                      specialisationDetails: '',
                      noOfDoctors: 0,
                      status: 'active',
                    });
                  }}>Cancel</Button>
                  <Button onClick={handleAddSubmit}>Add Department</Button>
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
                  placeholder="Search by department name, category, description, or specialisation..."
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
                      <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Department Name</th>
                      <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Category</th>
                      <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Description</th>
                      <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">No. of Doctors</th>
                      <th className="text-left py-4 px-6 text-gray-700 bg-white whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">
                          {searchTerm 
                            ? 'No departments found matching your search.'
                            : selectedCategory 
                              ? `No departments found in ${selectedCategory} category`
                              : 'No departments found'
                          }
                        </td>
                      </tr>
                    ) : (
                      filteredDepartments.map((dept) => (
                        <tr key={dept.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-6 text-gray-900 font-medium">{dept.name}</td>
                          <td className="py-4 px-6 text-gray-600">{dept.category}</td>
                          <td className="py-4 px-6 text-gray-600">{dept.specialisationDetails || '-'}</td>
                          <td className="py-4 px-6 text-gray-600">{dept.noOfDoctors !== undefined ? dept.noOfDoctors : 0}</td>
                          <td className="py-4 px-6">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(dept)}
                              >
                                Manage
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="p-0 gap-0 large-dialog bg-white">
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0 bg-white">
            <DialogTitle className="text-gray-700">Edit Department</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0 bg-white">
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name" className="text-gray-600">Department Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="e.g., Medicine"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-gray-50 text-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category" className="text-gray-600">Category</Label>
                  <select
                    id="edit-category"
                    aria-label="Category"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
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
                <Label htmlFor="edit-description" className="text-gray-600">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter department description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="bg-gray-50 text-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="edit-specialisationDetails" className="text-gray-600">Specialisation Details</Label>
                <Textarea
                  id="edit-specialisationDetails"
                  placeholder="e.g., Cardiology, Interventional Cardiology, Cardiac Rehabilitation"
                  value={formData.specialisationDetails}
                  onChange={(e) => setFormData({ ...formData, specialisationDetails: e.target.value })}
                  rows={3}
                  className="bg-gray-50 text-gray-900"
                />
              </div>
              <div>
                <Label htmlFor="edit-noOfDoctors" className="text-gray-600">Number of Doctors</Label>
                <Input
                  id="edit-noOfDoctors"
                  type="number"
                  min="0"
                  placeholder="Enter number of doctors"
                  value={formData.noOfDoctors}
                  onChange={(e) => setFormData({ ...formData, noOfDoctors: parseInt(e.target.value) || 0 })}
                  className="bg-gray-50 text-gray-900"
                />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="edit-status" className="text-gray-600">Status</Label>
                  <div className="flex-shrink-0 relative" style={{ zIndex: 1 }}>
                    <Switch
                      id="edit-status"
                      checked={formData.status === 'active'}
                      onCheckedChange={(checked: boolean) => {
                        setFormData({ ...formData, status: checked ? 'active' : 'inactive' });
                      }}
                      className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300 [&_[data-slot=switch-thumb]]:!bg-white [&_[data-slot=switch-thumb]]:!border [&_[data-slot=switch-thumb]]:!border-gray-400 [&_[data-slot=switch-thumb]]:!shadow-sm"
                      style={{
                        width: '2.5rem',
                        height: '1.5rem',
                        minWidth: '2.5rem',
                        minHeight: '1.5rem',
                        display: 'inline-flex',
                        position: 'relative',
                        backgroundColor: formData.status === 'active' ? '#2563eb' : '#d1d5db',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t bg-white px-6 pb-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit}>Update Department</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
