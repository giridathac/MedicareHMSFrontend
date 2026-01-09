import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { BedDouble, Plus, Edit, Trash2, CheckCircle2, XCircle, ArrowLeft, Clock, Search, Users, ChevronUp, ChevronDown } from 'lucide-react';
import { Switch } from './ui/switch';
import { useEmergencyBeds } from '../hooks/useEmergencyBeds';
import { useEmergencyBedSlots } from '../hooks/useEmergencyBedSlots';
import { EmergencyBed, EmergencyBedSlot, EmergencyAdmission } from '../types';
import { emergencyAdmissionsApi } from '../api/emergencyAdmissions';

export function EmergencyBedManagement() {
  const { emergencyBeds, loading, error, createEmergencyBed, updateEmergencyBed, deleteEmergencyBed, fetchEmergencyBeds } = useEmergencyBeds();
  const { emergencyBedSlots } = useEmergencyBedSlots();
  const [emergencyAdmissions, setEmergencyAdmissions] = useState<EmergencyAdmission[]>([]);
  
  // Fetch data on mount - always from network
  useEffect(() => {
    fetchEmergencyBeds();
  }, [fetchEmergencyBeds]);

  // Fetch emergency admissions to determine bed occupancy
  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const admissions = await emergencyAdmissionsApi.getAll({ status: 'Active' });
        setEmergencyAdmissions(admissions);
      } catch (err) {
        console.error('Failed to fetch emergency admissions:', err);
        setEmergencyAdmissions([]);
      }
    };
    fetchAdmissions();
  }, []);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmergencyBed, setSelectedEmergencyBed] = useState<EmergencyBed | null>(null);
  const [selectedEmergencyBedId, setSelectedEmergencyBedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    emergencyBedNo: '',
    emergencyRoomNameNo: '',
    emergencyRoomDescription: '',
    chargesPerDay: '',
    createdBy: '1',
    status: 'active' as EmergencyBed['status'],
    bedStatus: 'Unoccupied' as 'Occupied' | 'Unoccupied',
  });

  const handleCreateEmergencyBed = async (data: {
    emergencyBedNo?: string;
    emergencyRoomNameNo?: string;
    emergencyRoomDescription?: string;
    chargesPerDay?: number;
    createdBy?: number;
    status?: 'active' | 'inactive';
  }) => {
    try {
      await createEmergencyBed(data);
    } catch (err) {
      console.error('Failed to create Emergency bed:', err);
      throw err;
    }
  };

  const handleUpdateEmergencyBed = async (id: number, data: Partial<{
    emergencyBedNo?: string;
    emergencyRoomNameNo?: string;
    emergencyRoomDescription?: string;
    chargesPerDay?: number;
    createdBy?: number;
    status?: 'active' | 'inactive';
  }>) => {
    try {
      await updateEmergencyBed({ id, ...data });
    } catch (err) {
      console.error('Failed to update Emergency bed:', err);
      throw err;
    }
  };

  const handleDelete = async (emergencyBedId: number) => {
    if (confirm('Are you sure you want to delete this Emergency bed? This action cannot be undone.')) {
      try {
        await deleteEmergencyBed(emergencyBedId);
      } catch (err) {
        console.error('Failed to delete Emergency bed:', err);
      }
    }
  };

  const handleAddSubmit = async () => {
    if (!formData.emergencyBedNo || !formData.chargesPerDay) {
      alert('Please fill in all required fields.');
      return;
    }
    try {
      await handleCreateEmergencyBed({
        emergencyBedNo: formData.emergencyBedNo || undefined,
        emergencyRoomNameNo: formData.emergencyRoomNameNo || undefined,
        emergencyRoomDescription: formData.emergencyRoomDescription || undefined,
        chargesPerDay: parseFloat(formData.chargesPerDay),
        status: formData.status,
      });
      setIsAddDialogOpen(false);
      setFormData({
        emergencyBedNo: '',
        emergencyRoomNameNo: '',
        emergencyRoomDescription: '',
        chargesPerDay: '',
        createdBy: '1',
        status: 'active',
        bedStatus: 'Unoccupied',
      });
    } catch (err) {
      // Error handled in parent
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedEmergencyBed) return;
    if (!formData.emergencyBedNo || !formData.chargesPerDay) {
      alert('Please fill in all required fields.');
      return;
    }
    try {
      // Parse chargesPerDay and validate
      const chargesPerDayNum = parseFloat(formData.chargesPerDay);
      if (isNaN(chargesPerDayNum) || chargesPerDayNum < 0) {
        alert('Charges Per Day must be a valid positive number.');
        return;
      }

      // Parse createdBy and validate
      let createdByNum: number | undefined = undefined;
      if (formData.createdBy && formData.createdBy.trim() !== '') {
        const parsed = parseInt(formData.createdBy.trim(), 10);
        if (!isNaN(parsed) && parsed > 0) {
          createdByNum = parsed;
        }
      }

      // Build update payload with proper values
      const updateData: Partial<{
        emergencyBedNo?: string;
        emergencyRoomNameNo?: string;
        emergencyRoomDescription?: string;
        chargesPerDay?: number;
        createdBy?: number;
        status?: 'active' | 'inactive';
      }> = {
        emergencyBedNo: formData.emergencyBedNo.trim() || undefined,
        chargesPerDay: chargesPerDayNum,
        status: formData.status || 'active',
      };

      // Add optional fields only if they have values
      if (formData.emergencyRoomNameNo && formData.emergencyRoomNameNo.trim() !== '') {
        updateData.emergencyRoomNameNo = formData.emergencyRoomNameNo.trim();
      }
      if (formData.emergencyRoomDescription && formData.emergencyRoomDescription.trim() !== '') {
        updateData.emergencyRoomDescription = formData.emergencyRoomDescription.trim();
      }
      if (createdByNum !== undefined) {
        updateData.createdBy = createdByNum;
      }

      console.log('Updating emergency bed with data:', updateData);
      await handleUpdateEmergencyBed(selectedEmergencyBed.id, updateData);
      setIsEditDialogOpen(false);
      setSelectedEmergencyBed(null);
      setFormData({
        emergencyBedNo: '',
        emergencyRoomNameNo: '',
        emergencyRoomDescription: '',
        chargesPerDay: '',
        createdBy: '1',
        status: 'active',
        bedStatus: 'Unoccupied',
      });
      // Refresh the list after update
      fetchEmergencyBeds();
    } catch (err) {
      console.error('Error updating emergency bed:', err);
      alert(err instanceof Error ? err.message : 'Failed to update emergency bed. Please check the console for details.');
    }
  };

  const handleEdit = (emergencyBed: EmergencyBed) => {
    setSelectedEmergencyBed(emergencyBed);
    const isOccupied = isBedOccupied(emergencyBed);
    setFormData({
      emergencyBedNo: emergencyBed.emergencyBedNo || '',
      emergencyRoomNameNo: emergencyBed.emergencyRoomNameNo || '',
      emergencyRoomDescription: emergencyBed.emergencyRoomDescription || '',
      chargesPerDay: emergencyBed.chargesPerDay ? emergencyBed.chargesPerDay.toString() : '',
      createdBy: emergencyBed.createdBy || '1',
      status: emergencyBed.status || 'active',
      bedStatus: isOccupied ? 'Occupied' : 'Unoccupied',
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: EmergencyBed['status']) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="size-3" />Active</span>;
      case 'inactive':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><XCircle className="size-3" />Inactive</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  // Helper function to check if a bed is occupied
  const isBedOccupied = (bed: EmergencyBed): boolean => {
    // Get all bed slots for this bed
    const bedSlots = emergencyBedSlots.filter(slot => slot.emergencyBedId === bed.id);
    
    // Check if any active admission is using any of these bed slots
    // Exclude Discharged and Movedout statuses as they release the slot
    return emergencyAdmissions.some(admission => {
      if (!admission.emergencyBedSlotId || admission.status !== 'Active') return false;
      if (admission.emergencyStatus === 'Discharged' || admission.emergencyStatus === 'Movedout') return false;
      return bedSlots.some(slot => slot.id === admission.emergencyBedSlotId);
    });
  };

  // Helper function to get bed status badge
  const getBedStatusBadge = (isOccupied: boolean) => {
    if (isOccupied) {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle className="size-3" />Occupied</span>;
    } else {
      return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="size-3" />Unoccupied</span>;
    }
  };

  // Filter emergency beds based on search term
  const filteredEmergencyBeds = emergencyBeds.filter(bed => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      bed.emergencyBedNo?.toLowerCase().includes(searchLower) ||
      bed.emergencyRoomNameNo?.toLowerCase().includes(searchLower) ||
      bed.emergencyRoomDescription?.toLowerCase().includes(searchLower) ||
      bed.emergencyBedId?.toString().includes(searchTerm) ||
      bed.createdBy?.toString().includes(searchTerm)
    );
  });

  // Calculate stats
  const totalBeds = emergencyBeds.length;
  const activeBeds = emergencyBeds.filter(bed => bed.status === 'active').length;
  const inactiveBeds = emergencyBeds.filter(bed => bed.status === 'inactive').length;

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h1 className="text-gray-900 mb-2 text-2xl">Emergency Bed Management</h1>
                <p className="text-gray-500 text-base">Manage emergency beds and their configurations</p>
              </div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-4 flex-1">
            <div className="text-center py-12 text-gray-600">Loading Emergency beds...</div>
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
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h1 className="text-gray-900 mb-2 text-2xl">Emergency Bed Management</h1>
                <p className="text-gray-500 text-base">Manage emergency beds and their configurations</p>
              </div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-4 flex-1">
            <div className="text-center py-12 text-red-500">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
      <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <h1 className="text-gray-900 mb-2 text-2xl">Emergency Bed Management</h1>
              <p className="text-gray-500 text-base">Manage emergency beds and their configurations</p>
            </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                Add Emergency Bed
              </Button>
            </DialogTrigger>
          <DialogContent className="p-0 gap-0 large-dialog dialog-content-standard">
            <div className="dialog-scrollable-wrapper dialog-content-scrollable">
              <DialogHeader className="dialog-header-standard">
                <DialogTitle className="dialog-title-standard">Add New Emergency Bed</DialogTitle>
              </DialogHeader>
              <div className="dialog-body-content-wrapper">
                <div className="dialog-form-container space-y-4">
                  <div className="dialog-form-field">
                    <Label htmlFor="emergencyBedNo" className="dialog-label-standard">Emergency Bed No *</Label>
                    <Input
                      id="emergencyBedNo"
                      placeholder="e.g., ER-001"
                      value={formData.emergencyBedNo}
                      onChange={(e) => setFormData({ ...formData, emergencyBedNo: e.target.value })}
                      required
                      className="dialog-input-standard"
                    />
                  </div>
                  <div className="dialog-form-field">
                    <Label htmlFor="emergencyRoomNameNo" className="dialog-label-standard">Emergency Room Name/No</Label>
                    <Input
                      id="emergencyRoomNameNo"
                      placeholder="e.g., ER-Room-101"
                      value={formData.emergencyRoomNameNo}
                      onChange={(e) => setFormData({ ...formData, emergencyRoomNameNo: e.target.value })}
                      className="dialog-input-standard"
                    />
                  </div>
                  <div className="dialog-form-field">
                    <Label htmlFor="emergencyRoomDescription" className="dialog-label-standard">Emergency Room Description</Label>
                    <Textarea
                      id="emergencyRoomDescription"
                      placeholder="Enter emergency room description..."
                      value={formData.emergencyRoomDescription}
                      onChange={(e) => setFormData({ ...formData, emergencyRoomDescription: e.target.value })}
                      rows={3}
                      className="dialog-textarea-standard"
                    />
                  </div>
                  <div className="dialog-form-field">
                    <Label htmlFor="chargesPerDay" className="dialog-label-standard">
                      Charges Per Day (₹) *
                    </Label>
                    <Input
                      id="chargesPerDay"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 2500"
                      value={formData.chargesPerDay}
                      onChange={(e) => setFormData({ ...formData, chargesPerDay: e.target.value })}
                      className="dialog-input-standard"
                    />
                  </div>
                  <div className="dialog-form-field">
                    <Label htmlFor="bedStatus" className="dialog-label-standard">Bed Status</Label>
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle2 className="size-3" />Unoccupied
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">New beds are always unoccupied</p>
                  </div>
                </div>
              </div>
              <div className="dialog-footer-standard">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="dialog-footer-button">Cancel</Button>
                <Button onClick={handleAddSubmit} className="dialog-footer-button">Add Emergency Bed</Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
            </div>
          </div>
        <div className="px-6 pt-4 pb-4 flex-1">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Beds</p>
                    <h3 className="text-gray-900">{totalBeds}</h3>
                  </div>
                  <BedDouble className="size-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Active Beds</p>
                    <h3 className="text-gray-900">{activeBeds}</h3>
                  </div>
                  <div className="size-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="size-5 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Inactive Beds</p>
                    <h3 className="text-gray-900">{inactiveBeds}</h3>
                  </div>
                  <div className="size-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <XCircle className="size-5 text-gray-700" />
                  </div>
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
                  placeholder="Search by bed no, room no, room description, bed ID, or created by..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Beds Table */}
          <Card>
            <CardContent className="p-6">
              <div className="overflow-x-auto" style={{ minWidth: '100%' }}>
                <table className="w-full" style={{ minWidth: '800px' }}>
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">Bed ID</th>
                      <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">Bed No</th>
                      <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">Room No</th>
                      <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">Room Description</th>
                      <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">Bed Status</th>
                      <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">Status</th>
                      <th className="text-left py-3 px-4 text-gray-700 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmergencyBeds.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-500">
                          {searchTerm ? 'No emergency beds found matching your search.' : 'No Emergency beds found. Add a new Emergency bed to get started.'}
                        </td>
                      </tr>
                    ) : (
                      filteredEmergencyBeds.map((emergencyBed) => {
                        const isOccupied = isBedOccupied(emergencyBed);
                        return (
                          <tr key={emergencyBed.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded">
                                {emergencyBed.emergencyBedId}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-900">
                              <a
                                href={`#emergencybeds?emergencyBedId=${emergencyBed.id}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedEmergencyBedId(emergencyBed.id);
                                }}
                                className="text-gray-900 hover:text-gray-800 hover:underline cursor-pointer"
                              >
                                {emergencyBed.emergencyBedNo}
                              </a>
                            </td>
                            <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{emergencyBed.emergencyRoomNameNo || '-'}</td>
                            <td className="py-3 px-4 text-gray-600">{emergencyBed.emergencyRoomDescription || '-'}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{getBedStatusBadge(isOccupied)}</td>
                            <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(emergencyBed.status)}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(emergencyBed)}
                                title="Manage Emergency Bed"
                                className="min-w-[80px]"
                              >
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
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="p-0 gap-0 large-dialog dialog-content-standard max-w-2xl">
          <div className="dialog-scrollable-wrapper dialog-content-scrollable">
            <DialogHeader className="dialog-header-standard">
              <DialogTitle className="dialog-title-standard">Edit Emergency Bed</DialogTitle>
            </DialogHeader>
            <div className="dialog-body-content-wrapper">
              <div className="dialog-form-container space-y-4">
                {selectedEmergencyBed && (
                  <div className="dialog-form-field">
                    <Label className="dialog-label-standard">Emergency Bed ID</Label>
                    <Input
                      value={selectedEmergencyBed.emergencyBedId}
                      disabled
                      className="dialog-input-standard dialog-input-disabled"
                    />
                    <p className="text-xs text-gray-500 mt-1">Emergency Bed ID is auto-generated and cannot be changed</p>
                  </div>
                )}
                <div className="dialog-form-field">
                  <Label htmlFor="edit-emergencyBedNo" className="dialog-label-standard">Emergency Bed No *</Label>
                  <Input
                    id="edit-emergencyBedNo"
                    placeholder="e.g., ER-001"
                    value={formData.emergencyBedNo}
                    onChange={(e) => setFormData({ ...formData, emergencyBedNo: e.target.value })}
                    required
                    className="dialog-input-standard"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="edit-emergencyRoomNameNo" className="dialog-label-standard">Emergency Room Name/No</Label>
                  <Input
                    id="edit-emergencyRoomNameNo"
                    placeholder="e.g., ER-Room-101"
                    value={formData.emergencyRoomNameNo}
                    onChange={(e) => setFormData({ ...formData, emergencyRoomNameNo: e.target.value })}
                    className="dialog-input-standard"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="edit-emergencyRoomDescription" className="dialog-label-standard">Emergency Room Description</Label>
                  <Textarea
                    id="edit-emergencyRoomDescription"
                    placeholder="Enter emergency room description..."
                    value={formData.emergencyRoomDescription}
                    onChange={(e) => setFormData({ ...formData, emergencyRoomDescription: e.target.value })}
                    rows={3}
                    className="dialog-textarea-standard"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="edit-chargesPerDay" className="dialog-label-standard">
                    Charges Per Day (₹) *
                  </Label>
                  <Input
                    id="edit-chargesPerDay"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 2500"
                    value={formData.chargesPerDay}
                    onChange={(e) => setFormData({ ...formData, chargesPerDay: e.target.value })}
                    className="dialog-input-standard"
                  />
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="edit-bedStatus" className="dialog-label-standard">Bed Status</Label>
                  <select
                    id="edit-bedStatus"
                    aria-label="Bed Status"
                    className="dialog-select-standard"
                    value={formData.bedStatus}
                    onChange={(e) => setFormData({ ...formData, bedStatus: e.target.value as 'Occupied' | 'Unoccupied' })}
                  >
                    <option value="Unoccupied">Unoccupied</option>
                    <option value="Occupied">Occupied</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Set the bed occupancy status</p>
                </div>
                <div className="dialog-form-field">
                  <Label htmlFor="edit-createdBy" className="dialog-label-standard">Created By (User ID) *</Label>
                  <Input
                    id="edit-createdBy"
                    type="text"
                    placeholder="e.g., 1"
                    value={formData.createdBy}
                    onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                    className="dialog-input-standard"
                  />
                  <p className="text-xs text-gray-500 mt-1">Foreign Key to UserId</p>
                </div>
                <div className="dialog-form-field">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="edit-status" className="dialog-label-standard">Status</Label>
                    <div className="flex-shrink-0 relative" style={{ zIndex: 1 }}>
                      <Switch
                        id="edit-status"
                        checked={formData.status === 'active'}
                        onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
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
            <div className="dialog-footer-standard">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="dialog-footer-button">Cancel</Button>
              <Button onClick={handleEditSubmit} className="dialog-footer-button">Update Emergency Bed</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Bed Slots Dialog */}
      {selectedEmergencyBedId !== null && (
        <EmergencyBedSlotsManagement 
          emergencyBedId={selectedEmergencyBedId}
          emergencyBed={emergencyBeds.find(b => b.id === selectedEmergencyBedId) || null}
          onClose={() => setSelectedEmergencyBedId(null)} 
        />
      )}
    </div>
  );
}

function EmergencyBedSlotsManagement({ emergencyBedId, emergencyBed, onClose }: { emergencyBedId: number; emergencyBed: EmergencyBed | null; onClose: () => void }) {
  const { emergencyBedSlots, loading, error, createEmergencyBedSlot, updateEmergencyBedSlot, deleteEmergencyBedSlot, fetchEmergencyBedSlots } = useEmergencyBedSlots(emergencyBedId);
  const [emergencyAdmissions, setEmergencyAdmissions] = useState<EmergencyAdmission[]>([]);
  const [isUnoccupiedSlotsExpanded, setIsUnoccupiedSlotsExpanded] = useState(false);
  
  // Fetch data on mount - always from network
  useEffect(() => {
    fetchEmergencyBedSlots();
  }, [fetchEmergencyBedSlots]);

  // Fetch emergency admissions to determine slot occupancy
  useEffect(() => {
    const fetchAdmissions = async () => {
      try {
        const { emergencyAdmissionsApi } = await import('../api/emergencyAdmissions');
        const admissions = await emergencyAdmissionsApi.getAll({ status: 'Active' });
        setEmergencyAdmissions(admissions);
      } catch (err) {
        console.error('Failed to fetch emergency admissions:', err);
        setEmergencyAdmissions([]);
      }
    };
    fetchAdmissions();
  }, []);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<EmergencyBedSlot | null>(null);
  const [formData, setFormData] = useState({
    eBedSlotNo: '',
    eSlotStartTime: '',
    eSlotEndTime: '',
    status: 'Active' as EmergencyBedSlot['status'],
  });

  const handleCreateSlot = async (data: {
    emergencyBedId: number;
    eSlotStartTime: string;
    eSlotEndTime: string;
    status?: 'Active' | 'Inactive';
  }) => {
    try {
      await createEmergencyBedSlot(data);
    } catch (err) {
      console.error('Failed to create emergency bed slot:', err);
      throw err;
    }
  };

  const handleUpdateSlot = async (id: number, data: Partial<{
    eSlotStartTime: string;
    eSlotEndTime: string;
    status?: 'Active' | 'Inactive';
  }>) => {
    try {
      await updateEmergencyBedSlot({ id, ...data });
    } catch (err) {
      console.error('Failed to update emergency bed slot:', err);
      throw err;
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this emergency bed slot? This action cannot be undone.')) {
      try {
        await deleteEmergencyBedSlot(id);
      } catch (err) {
        console.error('Failed to delete emergency bed slot:', err);
      }
    }
  };

  const handleAddSubmit = async () => {
    if (!formData.eSlotStartTime || !formData.eSlotEndTime) {
      alert('Please fill in all required fields.');
      return;
    }
    try {
      await handleCreateSlot({
        emergencyBedId: emergencyBedId,
        eSlotStartTime: formData.eSlotStartTime,
        eSlotEndTime: formData.eSlotEndTime,
        status: formData.status,
      });
      setIsAddDialogOpen(false);
      setFormData({
        eBedSlotNo: '',
        eSlotStartTime: '',
        eSlotEndTime: '',
        status: 'Active',
      });
    } catch (err) {
      // Error handled in parent
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedSlot) return;
    if (!formData.eSlotStartTime || !formData.eSlotEndTime) {
      alert('Please fill in all required fields.');
      return;
    }
    try {
      await handleUpdateSlot(selectedSlot.id, {
        eSlotStartTime: formData.eSlotStartTime,
        eSlotEndTime: formData.eSlotEndTime,
        status: formData.status,
      });
      setIsEditDialogOpen(false);
      setSelectedSlot(null);
      setFormData({
        eBedSlotNo: '',
        eSlotStartTime: '',
        eSlotEndTime: '',
        status: 'Active',
      });
    } catch (err) {
      // Error handled in parent
    }
  };

  const handleEdit = (slot: EmergencyBedSlot) => {
    setSelectedSlot(slot);
    setFormData({
      eBedSlotNo: slot.eBedSlotNo,
      eSlotStartTime: slot.eSlotStartTime,
      eSlotEndTime: slot.eSlotEndTime,
      status: slot.status,
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: EmergencyBedSlot['status']) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="size-3" />Active</span>;
      case 'Inactive':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><XCircle className="size-3" />Inactive</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  // Helper function to check if a slot is occupied
  const isSlotOccupied = useCallback((slotId: number): boolean => {
    return emergencyAdmissions.some(admission => 
      admission.emergencyBedSlotId === slotId && 
      admission.status === 'Active' &&
      admission.emergencyStatus !== 'Discharged' &&
      admission.emergencyStatus !== 'Movedout'
    );
  }, [emergencyAdmissions]);

  // Get patient info for occupied slot
  const getSlotPatientInfo = useCallback((slotId: number) => {
    const admission = emergencyAdmissions.find(a => 
      a.emergencyBedSlotId === slotId && 
      a.status === 'Active' &&
      a.emergencyStatus !== 'Discharged' &&
      a.emergencyStatus !== 'Movedout'
    );
    if (admission) {
      return {
        patientName: admission.patientName || 'Unknown',
        patientNo: admission.patientNo || '',
        emergencyStatus: admission.emergencyStatus,
      };
    }
    return null;
  }, [emergencyAdmissions]);

  // Separate slots into occupied and unoccupied
  const occupiedSlots = useMemo(() => {
    return emergencyBedSlots.filter(slot => 
      slot.status === 'Active' && isSlotOccupied(slot.id)
    );
  }, [emergencyBedSlots, isSlotOccupied]);

  const unoccupiedSlots = useMemo(() => {
    return emergencyBedSlots.filter(slot => 
      slot.status === 'Active' && !isSlotOccupied(slot.id)
    );
  }, [emergencyBedSlots, isSlotOccupied]);

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="p-0 gap-0 large-dialog max-w-4xl">
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                  <ArrowLeft className="size-4" />
                </Button>
                <DialogTitle>
                  {emergencyBed ? `Emergency Bed Slots for ${emergencyBed.emergencyBedNo}` : `Emergency Bed Slots`}
                </DialogTitle>
              </div>
              <Button className="gap-2" onClick={(e) => {
                e.stopPropagation();
                setIsAddDialogOpen(true);
              }}>
                <Plus className="size-4" />
                Add Slot
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
            <div className="text-center py-12 text-gray-600">Loading emergency bed slots...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="p-0 gap-0 large-dialog max-w-4xl">
        <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <ArrowLeft className="size-4" />
              </Button>
              <DialogTitle>
                {emergencyBed ? `Emergency Bed Room Slots Status - ${emergencyBed.emergencyBedNo}` : `Emergency Bed Room Slots Status`}
              </DialogTitle>
            </div>
            <Button className="gap-2" onClick={(e) => {
              e.stopPropagation();
              setIsAddDialogOpen(true);
            }}>
              <Plus className="size-4" />
              Add Slot
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
          <div className="space-y-4 py-4">
          {/* Show slots status only if no error and not loading */}
          {!error && !loading && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="size-5" />
                  Emergency Bed Room Slots Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {occupiedSlots.length === 0 && unoccupiedSlots.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No emergency bed slots found. Add a new slot to get started.
                  </div>
                ) : (
                  <>
                    {/* Occupied Slots Section */}
                    {occupiedSlots.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Occupied ({occupiedSlots.length})</h3>
                        <div className="grid grid-cols-4 gap-4">
                          {occupiedSlots.map((slot) => {
                            const patientInfo = getSlotPatientInfo(slot.id);
                            return (
                              <div
                                key={slot.id}
                                className="p-3 border-2 rounded-lg border-red-300 bg-red-50"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <h3 className="text-sm font-semibold text-gray-900">
                                      {emergencyBed?.emergencyRoomNameNo || emergencyBed?.emergencyBedNo || 'Emergency Bed'}
                                    </h3>
                                    {emergencyBed?.emergencyRoomDescription && (
                                      <p className="text-xs text-gray-500">
                                        {emergencyBed.emergencyRoomDescription}
                                      </p>
                                    )}
                                  </div>
                                  <span className="size-3 rounded-full bg-red-500" />
                                </div>
                                
                                {/* Slot Time */}
                                {slot.eSlotStartTime && slot.eSlotEndTime && (
                                  <div className="mb-2">
                                    <p className="text-xs text-gray-500 mb-0.5">
                                      {slot.eBedSlotNo || `Slot ${slot.id}`}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-xs">
                                      <Clock className="size-3 text-gray-600" />
                                      <span className="font-medium text-gray-700">
                                        {slot.eSlotStartTime} - {slot.eSlotEndTime}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Patient Information */}
                                {patientInfo && (
                                  <div className="mb-1.5">
                                    <p className="text-xs text-gray-500 mb-0.5">Patient</p>
                                    <p className="text-xs font-medium text-gray-900">{patientInfo.patientName}</p>
                                    {patientInfo.patientNo && (
                                      <p className="text-xs text-gray-500">No: {patientInfo.patientNo}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">Status: {patientInfo.emergencyStatus}</p>
                                  </div>
                                )}
                                
                                {/* Manage Button */}
                                <div className="mt-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(slot)}
                                    title="Manage Slot"
                                    className="w-full text-xs"
                                  >
                                    Manage
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Unoccupied Slots Section - Collapsible */}
                    {unoccupiedSlots.length > 0 && (
                      <div>
                        <button
                          onClick={() => setIsUnoccupiedSlotsExpanded(!isUnoccupiedSlotsExpanded)}
                          className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 hover:text-gray-900"
                        >
                          {isUnoccupiedSlotsExpanded ? (
                            <>
                              <ChevronUp className="size-4" />
                              Hide Unoccupied ({unoccupiedSlots.length})
                            </>
                          ) : (
                            <>
                              <Plus className="size-4" />
                              Show Unoccupied ({unoccupiedSlots.length})
                            </>
                          )}
                        </button>
                        {isUnoccupiedSlotsExpanded && (
                          <div className="grid grid-cols-4 gap-4 mb-4">
                            {unoccupiedSlots.map((slot) => {
                              return (
                                <div
                                  key={slot.id}
                                  className="p-3 border-2 rounded-lg border-green-300 bg-green-50"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <h3 className="text-sm font-semibold text-gray-900">
                                        {emergencyBed?.emergencyRoomNameNo || emergencyBed?.emergencyBedNo || 'Emergency Bed'}
                                      </h3>
                                      {emergencyBed?.emergencyRoomDescription && (
                                        <p className="text-xs text-gray-500">
                                          {emergencyBed.emergencyRoomDescription}
                                        </p>
                                      )}
                                    </div>
                                    <span className="size-3 rounded-full bg-green-500" />
                                  </div>
                                  
                                  {/* Slot Time */}
                                  {slot.eSlotStartTime && slot.eSlotEndTime && (
                                    <div className="mb-2">
                                      <p className="text-xs text-gray-500 mb-0.5">
                                        {slot.eBedSlotNo || `Slot ${slot.id}`}
                                      </p>
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <Clock className="size-3 text-gray-600" />
                                        <span className="font-medium text-gray-700">
                                          {slot.eSlotStartTime} - {slot.eSlotEndTime}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Manage Button */}
                                  <div className="mt-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEdit(slot)}
                                      title="Manage Slot"
                                      className="w-full text-xs"
                                    >
                                      Manage
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
          </div>
        </div>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="p-0 gap-0 large-dialog max-w-2xl">
            <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
              <DialogTitle>Add New Emergency Bed Slot</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eSlotStartTime" className="flex items-center gap-2">
                      <Clock className="size-4" />
                      ESlot Start Time *
                    </Label>
                    <Input
                      id="eSlotStartTime"
                      placeholder="e.g., 9:00 AM"
                      value={formData.eSlotStartTime}
                      onChange={(e) => setFormData({ ...formData, eSlotStartTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="eSlotEndTime" className="flex items-center gap-2">
                      <Clock className="size-4" />
                      ESlot End Time *
                    </Label>
                    <Input
                      id="eSlotEndTime"
                      placeholder="e.g., 10:00 AM"
                      value={formData.eSlotEndTime}
                      onChange={(e) => setFormData({ ...formData, eSlotEndTime: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    aria-label="Status"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EmergencyBedSlot['status'] })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-2 border-t bg-gray-50 flex-shrink-0">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="py-1">Cancel</Button>
              <Button onClick={handleAddSubmit} className="py-1">Add Slot</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="p-0 gap-0 large-dialog max-w-2xl">
            <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
              <DialogTitle>Edit Emergency Bed Slot</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
              <div className="space-y-4 py-4">
                {selectedSlot && (
                  <div>
                    <Label>Emergency Bed Slot ID</Label>
                    <Input
                      value={selectedSlot.emergencyBedSlotId}
                      disabled
                      className="bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Emergency Bed Slot ID is auto-generated and cannot be changed</p>
                  </div>
                )}
                {selectedSlot && (
                  <div>
                    <Label htmlFor="edit-eBedSlotNo">EBed Slot No</Label>
                    <Input
                      id="edit-eBedSlotNo"
                      value={selectedSlot.eBedSlotNo}
                      disabled
                      className="bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">EBed Slot No cannot be modified</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-eSlotStartTime" className="flex items-center gap-2">
                      <Clock className="size-4" />
                      ESlot Start Time *
                    </Label>
                    <Input
                      id="edit-eSlotStartTime"
                      placeholder="e.g., 9:00 AM"
                      value={formData.eSlotStartTime}
                      onChange={(e) => setFormData({ ...formData, eSlotStartTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-eSlotEndTime" className="flex items-center gap-2">
                      <Clock className="size-4" />
                      ESlot End Time *
                    </Label>
                    <Input
                      id="edit-eSlotEndTime"
                      placeholder="e.g., 10:00 AM"
                      value={formData.eSlotEndTime}
                      onChange={(e) => setFormData({ ...formData, eSlotEndTime: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <select
                    id="edit-status"
                    aria-label="Status"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EmergencyBedSlot['status'] })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-2 border-t bg-gray-50 flex-shrink-0">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="py-1">Cancel</Button>
              <Button onClick={handleEditSubmit} className="py-1">Update Slot</Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
