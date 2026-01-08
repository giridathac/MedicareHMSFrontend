// Lab Tests Management Component - Separated UI from logic
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ResizableDialogContent } from './ResizableDialogContent';
import { Plus, Trash2, Edit, TestTube, Tag, CheckCircle2, XCircle, FileText, Search } from 'lucide-react';
import { useLabTests } from '../hooks/useLabTests';
import { LabTest } from '../types';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface LabTestsViewProps {
  labTests: LabTest[];
  onCreateLabTest: (data: {
    testName: string;
    testCategory: string;
    description?: string;
    charges: number;
    status?: 'active' | 'inactive';
  }) => Promise<void>;
  onUpdateLabTest: (labTestId: number, data: Partial<{
    testName: string;
    testCategory: string;
    description?: string;
    charges: number;
    status?: 'active' | 'inactive';
  }>) => Promise<void>;
  onDeleteLabTest: (labTestId: number) => Promise<void>;
}

const testCategoryOptions = ['BloodTest', 'Imaging', 'Radiology', 'UrineTest', 'Ultrasound'];
const statusOptions: LabTest['status'][] = ['active', 'inactive'];

export function LabTests() {
  const { labTests, loading, error, createLabTest, updateLabTest, deleteLabTest } = useLabTests();

  const handleCreateLabTest = async (data: {
    testName: string;
    testCategory: string;
    description?: string;
    charges: number;
    status?: 'active' | 'inactive';
  }) => {
    try {
      await createLabTest(data);
    } catch (err) {
      console.error('Failed to create lab test:', err);
      throw err;
    }
  };

  const handleUpdateLabTest = async (labTestId: number, data: Partial<{
    testName: string;
    testCategory: string;
    description?: string;
    charges: number;
    status?: 'active' | 'inactive';
  }>) => {
    try {
      await updateLabTest({ labTestId, ...data });
    } catch (err) {
      console.error('Failed to update lab test:', err);
      throw err;
    }
  };

  const handleDelete = async (labTestId: number) => {
    if (confirm('Are you sure you want to delete this lab test? This action cannot be undone.')) {
      try {
        await deleteLabTest(labTestId);
      } catch (err) {
        console.error('Failed to delete lab test:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-white flex flex-col overflow-hidden min-h-0">
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="text-center py-12 text-gray-600">Loading lab tests...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-white flex flex-col overflow-hidden min-h-0">
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="text-center py-12 text-red-600">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LabTestsView
      labTests={labTests}
      onCreateLabTest={handleCreateLabTest}
      onUpdateLabTest={handleUpdateLabTest}
      onDeleteLabTest={handleDelete}
    />
  );
}

function LabTestsView({
  labTests,
  onCreateLabTest,
  onUpdateLabTest,
  onDeleteLabTest,
}: LabTestsViewProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLabTest, setSelectedLabTest] = useState<LabTest | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    testName: '',
    testCategory: 'BloodTest',
    description: '',
    charges: 0,
    status: 'active' as LabTest['status'],
  });

  const handleAddSubmit = async () => {
    setSubmitError(null);
    if (!formData.testName || formData.charges < 0) {
      setSubmitError('Please fill in all required fields with valid values.');
      return;
    }
    try {
      await onCreateLabTest({
        testName: formData.testName,
        testCategory: formData.testCategory,
        description: formData.description || undefined,
        charges: formData.charges,
        status: formData.status,
      });
      setIsAddDialogOpen(false);
      setSubmitError(null);
      setFormData({
        testName: '',
        testCategory: 'BloodTest',
        description: '',
        charges: 0,
        status: 'active',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create lab test. Please try again.';
      setSubmitError(errorMessage);
      console.error('Failed to create lab test:', err);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedLabTest) return;
    setSubmitError(null);
    if (!formData.testName || formData.charges < 0) {
      setSubmitError('Please fill in all required fields with valid values.');
      return;
    }
    try {
      await onUpdateLabTest(selectedLabTest.labTestId, {
        testName: formData.testName,
        testCategory: formData.testCategory,
        description: formData.description || undefined,
        charges: formData.charges,
        status: formData.status,
      });
      setIsEditDialogOpen(false);
      setSelectedLabTest(null);
      setSubmitError(null);
      setFormData({
        testName: '',
        testCategory: 'BloodTest',
        description: '',
        charges: 0,
        status: 'active',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update lab test. Please try again.';
      setSubmitError(errorMessage);
      console.error('Failed to update lab test:', err);
    }
  };

  const handleEdit = (labTest: LabTest) => {
    setSelectedLabTest(labTest);
    setSubmitError(null);
    setFormData({
      testName: labTest.testName,
      testCategory: labTest.testCategory,
      description: labTest.description || '',
      charges: labTest.charges,
      status: labTest.status,
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: LabTest['status']) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="size-3" />Active</span>;
      case 'inactive':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><XCircle className="size-3" />Inactive</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      'BloodTest': 'bg-red-100 text-red-700',
      'Imaging': 'bg-blue-100 text-blue-700',
      'Radiology': 'bg-purple-100 text-purple-700',
      'UrineTest': 'bg-yellow-100 text-yellow-700',
      'Ultrasound': 'bg-green-100 text-green-700',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors[category] || 'bg-gray-100 text-gray-700'}`}>
        <Tag className="size-3" />
        {category}
      </span>
    );
  };

  // Filter lab tests based on search term
  const filteredLabTests = labTests.filter(labTest => {
    const searchLower = searchTerm.toLowerCase();
    const testName = (labTest.testName || '').toLowerCase();
    const displayTestId = (labTest.displayTestId || '').toLowerCase();
    const testCategory = (labTest.testCategory || '').toLowerCase();
    const description = (labTest.description || '').toLowerCase();
    
    return testName.includes(searchLower) ||
           displayTestId.includes(searchLower) ||
           testCategory.includes(searchLower) ||
           description.includes(searchLower);
  });

  return (
    <div className="flex-1 bg-white flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
      <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <h1 className="dashboard-header">Laboratory Management - Tests Catalog</h1>
              <p className="dashboard-subheader">Manage laboratory test catalog</p>
            </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Add New Lab Test
            </Button>
          </DialogTrigger>
          <ResizableDialogContent className="p-0 gap-0 large-dialog dialog-content-standard">
            <div className="dialog-scrollable-wrapper dialog-content-scrollable">
              <DialogHeader className="dialog-header-standard">
                <DialogTitle className="dialog-title-standard">Add New Lab Test</DialogTitle>
              </DialogHeader>
              <div className="dialog-body-content-wrapper">
                <div className="dialog-form-container">
                  {submitError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                      {submitError}
                    </div>
                  )}
                  <div className="dialog-form-field">
                    <Label htmlFor="testName" className="dialog-label-standard">Test Name</Label>
                    <Input
                      id="testName"
                      placeholder="e.g., Complete Blood Count, ECG, Blood Sugar"
                      value={formData.testName}
                      onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                      className="dialog-input-standard"
                    />
                  </div>
                  <div className="dialog-form-field-grid">
                    <div className="dialog-field-single-column">
                      <Label htmlFor="testCategory" className="dialog-label-standard">Test Category</Label>
                      <select
                        id="testCategory"
                        aria-label="Test Category"
                        className="dialog-select-standard"
                        value={formData.testCategory}
                        onChange={(e) => setFormData({ ...formData, testCategory: e.target.value })}
                      >
                        {testCategoryOptions.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="dialog-field-single-column">
                      <Label htmlFor="charges" className="dialog-label-standard">Charges (₹)</Label>
                      <Input
                        id="charges"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g., 500"
                        value={formData.charges}
                        onChange={(e) => setFormData({ ...formData, charges: parseFloat(e.target.value) || 0 })}
                        className="dialog-input-standard"
                      />
                    </div>
                  </div>
                  <div className="dialog-form-field">
                    <Label htmlFor="description" className="dialog-label-standard">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter test description..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="dialog-textarea-standard"
                    />
                  </div>
                </div>
              </div>
              <div className="dialog-footer-standard">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="dialog-footer-button">Cancel</Button>
                <Button onClick={handleAddSubmit} className="dialog-footer-button">Add Lab Test</Button>
              </div>
            </div>
          </ResizableDialogContent>
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
                  placeholder="Search by test name, test ID, category, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Lab Tests Table */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-lg mb-4">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-700">Test Name</th>
                      <th className="text-left py-3 px-4 text-gray-700">Category</th>
                      <th className="text-left py-3 px-4 text-gray-700">Description</th>
                      <th className="text-left py-3 px-4 text-gray-700">Charges</th>
                      <th className="text-left py-3 px-4 text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-gray-700">Actions</th>
                    </tr>
                  </thead>
                <tbody>
                  {filteredLabTests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-500">
                        {searchTerm ? `No lab tests found matching "${searchTerm}"` : 'No lab tests found. Add a new lab test to get started.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLabTests.map((labTest) => (
                      <tr key={labTest.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900 font-medium whitespace-nowrap">{labTest.testName}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{getCategoryBadge(labTest.testCategory)}</td>
                        <td className="py-3 px-4 text-gray-600 max-w-xs break-words whitespace-normal">{labTest.description || '-'}</td>
                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">₹{labTest.charges.toLocaleString()}</td>
                        <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(labTest.status)}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="dashboard-actions-container">
                            <Button 
                              size="sm"
                              onClick={() => handleEdit(labTest)}
                              className="dashboard-manage-button"
                              title="Manage Lab Test"
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <ResizableDialogContent className="p-0 gap-0 large-dialog dialog-content-standard">
          <div className="dialog-scrollable-wrapper dialog-content-scrollable">
            <DialogHeader className="dialog-header-standard">
              <DialogTitle className="dialog-title-standard">Edit Lab Test</DialogTitle>
            </DialogHeader>
            <div className="dialog-body-content-wrapper">
              <div className="dialog-form-container">
                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                    {submitError}
                  </div>
                )}
                <div className="dialog-form-field">
                  <Label htmlFor="edit-testName" className="dialog-label-standard">Test Name</Label>
                  <Input
                    id="edit-testName"
                    placeholder="e.g., Complete Blood Count, ECG, Blood Sugar"
                    value={formData.testName}
                    onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                    className="dialog-input-standard"
                  />
                </div>
                <div className="dialog-form-field-grid">
                  <div className="dialog-field-single-column">
                    <Label htmlFor="edit-testCategory" className="dialog-label-standard">Test Category</Label>
                    <select
                      id="edit-testCategory"
                      aria-label="Test Category"
                      className="dialog-select-standard"
                      value={formData.testCategory}
                      onChange={(e) => setFormData({ ...formData, testCategory: e.target.value })}
                    >
                      {testCategoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="dialog-field-single-column">
                    <Label htmlFor="edit-charges" className="dialog-label-standard">Charges (₹)</Label>
                    <Input
                      id="edit-charges"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 500"
                      value={formData.charges}
                      onChange={(e) => setFormData({ ...formData, charges: parseFloat(e.target.value) || 0 })}
                      className="dialog-input-standard"
                    />
                  </div>
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="edit-description" className="dialog-label-standard">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Enter test description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="dialog-textarea-standard"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="edit-status" className="dialog-label-standard">Status</Label>
                  <select
                    id="edit-status"
                    aria-label="Status"
                    className="dialog-select-standard"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as LabTest['status'] })}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="dialog-footer-standard">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="dialog-footer-button">Cancel</Button>
              <Button onClick={handleEditSubmit} className="dialog-footer-button">Update Lab Test</Button>
            </div>
          </div>
        </ResizableDialogContent>
      </Dialog>
      </div>
    </div>
  );
}
