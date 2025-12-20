// RoomBeds Management Component - Separated UI from logic
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Edit, BedDouble, Home, Tag, CheckCircle2, XCircle, Wrench, User, Search } from 'lucide-react';
import { useRoomBeds } from '../hooks/useRoomBeds';
import { roomBedsApi } from '../api/roomBeds';
import { RoomBed } from '../types';

interface RoomBedsViewProps {
  roomBeds: RoomBed[];
  onCreateRoomBed: (data: {
    bedNo: string;
    roomNo: string;
    roomCategory: string;
    roomType: string;
    numberOfBeds: number;
    chargesPerDay: number;
    status?: 'Active' | 'Inactive';
    createdBy: number;
  }) => Promise<void>;
  onUpdateRoomBed: (roomBedId: number, data: Partial<{
    bedNo: string;
    roomNo: string;
    roomCategory: string;
    roomType: string;
    numberOfBeds: number;
    chargesPerDay: number;
    status?: 'Active' | 'Inactive';
  }>) => Promise<void>;
  onDeleteRoomBed: (roomBedId: number) => Promise<void>;
}

const roomCategoryOptions = ['AC', 'Non AC'];
const roomTypeOptions = ['Special', 'Special Shared', 'Regular'];
const statusOptions: RoomBed['status'][] = ['Active', 'Inactive'];

export function RoomBeds() {
  const { roomBeds, loading, error, createRoomBed, updateRoomBed, deleteRoomBed } = useRoomBeds();

  const handleCreateRoomBed = async (data: {
    bedNo: string;
    roomNo: string;
    roomCategory: string;
    roomType: string;
    numberOfBeds: number;
    chargesPerDay: number;
    status?: 'Active' | 'Inactive';
    createdBy: number;
  }) => {
    try {
      await createRoomBed(data);
    } catch (err) {
      console.error('Failed to create room bed:', err);
      throw err;
    }
  };

  const handleUpdateRoomBed = async (roomBedId: number, data: Partial<{
    bedNo: string;
    roomNo: string;
    roomCategory: string;
    roomType: string;
    numberOfBeds: number;
    chargesPerDay: number;
    status?: 'Active' | 'Inactive';
  }>) => {
    try {
      await updateRoomBed({ roomBedId, ...data });
    } catch (err) {
      console.error('Failed to update room bed:', err);
      throw err;
    }
  };

  const handleDelete = async (roomBedId: number) => {
    if (confirm('Are you sure you want to delete this room bed? This action cannot be undone.')) {
      try {
        await deleteRoomBed(roomBedId);
      } catch (err) {
        console.error('Failed to delete room bed:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Loading room beds...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <RoomBedsView
      roomBeds={roomBeds}
      onCreateRoomBed={handleCreateRoomBed}
      onUpdateRoomBed={handleUpdateRoomBed}
      onDeleteRoomBed={handleDelete}
    />
  );
}

function RoomBedsView({
  roomBeds,
  onCreateRoomBed,
  onUpdateRoomBed,
  onDeleteRoomBed,
}: RoomBedsViewProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRoomBed, setSelectedRoomBed] = useState<RoomBed | null>(null);
  const [loadingEditData, setLoadingEditData] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    bedNo: '',
    roomNo: '',
    roomCategory: 'AC',
    roomType: 'Regular',
    chargesPerDay: 0,
    status: 'Active' as RoomBed['status'],
  });

  // Filter room beds based on search term
  const filteredRoomBeds = useMemo(() => {
    if (!searchTerm) return roomBeds;
    const searchLower = searchTerm.toLowerCase();
    return roomBeds.filter(roomBed => {
      const bedNo = (roomBed.bedNo || '').toLowerCase();
      const roomNo = (roomBed.roomNo || '').toLowerCase();
      const roomCategory = (roomBed.roomCategory || '').toLowerCase();
      const roomType = (roomBed.roomType || '').toLowerCase();
      const status = (roomBed.status || '').toLowerCase();
      const chargesPerDay = String(roomBed.chargesPerDay || 0).toLowerCase();
      
      return bedNo.includes(searchLower) ||
             roomNo.includes(searchLower) ||
             roomCategory.includes(searchLower) ||
             roomType.includes(searchLower) ||
             status.includes(searchLower) ||
             chargesPerDay.includes(searchLower);
    });
  }, [roomBeds, searchTerm]);

  const handleAddSubmit = async () => {
    setSubmitError(null);
    
    if (!formData.bedNo || !formData.roomNo || formData.chargesPerDay < 0) {
      setSubmitError('Please fill in all required fields with valid values.');
      return;
    }
    
    try {
      await onCreateRoomBed({
        bedNo: formData.bedNo.trim(),
        roomNo: formData.roomNo.trim(),
        roomCategory: formData.roomCategory,
        roomType: formData.roomType,
        numberOfBeds: 1,
        chargesPerDay: formData.chargesPerDay,
        status: formData.status,
        createdBy: 1, // Default to user ID 1 (should be replaced with actual logged-in user ID)
      });
      setIsAddDialogOpen(false);
      setSubmitError(null);
      setFormData({
        bedNo: '',
        roomNo: '',
        roomCategory: 'AC',
        roomType: 'Regular',
        chargesPerDay: 0,
        status: 'Active',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room bed. Please try again.';
      setSubmitError(errorMessage);
      console.error('Failed to create room bed:', err);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedRoomBed) return;
    if (!formData.bedNo || !formData.roomNo || formData.chargesPerDay < 0) {
      setSubmitError('Please fill in all required fields with valid values.');
      return;
    }
    
    // Validate roomBedId before attempting update
    if (!selectedRoomBed.roomBedId || selectedRoomBed.roomBedId <= 0) {
      setSubmitError('Cannot update: This room bed has an invalid roomBedId. The room bed may need to be recreated in the database.');
      return;
    }
    
    try {
      setSubmitError(null);
      await onUpdateRoomBed(selectedRoomBed.roomBedId, {
        bedNo: formData.bedNo,
        roomNo: formData.roomNo,
        roomCategory: formData.roomCategory,
        roomType: formData.roomType,
        numberOfBeds: selectedRoomBed.numberOfBeds,
        chargesPerDay: formData.chargesPerDay,
        status: formData.status,
      });
      setIsEditDialogOpen(false);
      setSelectedRoomBed(null);
      setFormData({
        bedNo: '',
        roomNo: '',
        roomCategory: 'AC',
        roomType: 'Regular',
        chargesPerDay: 0,
        status: 'Active',
      });
    } catch (err) {
      console.error('Failed to update room bed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update room bed. Please try again.';
      setSubmitError(errorMessage);
    }
  };

  const handleEdit = async (roomBed: RoomBed) => {
    try {
      setLoadingEditData(true);
      setSubmitError(null);
      setIsEditDialogOpen(true);
      
      // Validate roomBedId before calling API
      if (!roomBed.roomBedId || roomBed.roomBedId <= 0) {
        // If roomBedId is invalid, use the existing room bed data directly
        console.warn('Invalid room bed roomBedId, using existing data (cannot fetch from API):', {
          roomBedId: roomBed.roomBedId,
          bedNo: roomBed.bedNo,
          roomNo: roomBed.roomNo
        });
        setSelectedRoomBed(roomBed);
        setFormData({
          bedNo: roomBed.bedNo || '',
          roomNo: roomBed.roomNo || '',
          roomCategory: roomBed.roomCategory || 'AC',
          roomType: roomBed.roomType || 'Regular',
          chargesPerDay: roomBed.chargesPerDay || 0,
          status: roomBed.status || 'Active',
        });
        // Show a warning message to the user
        setSubmitError('Warning: This room bed has an invalid roomBedId. Changes may not be saved correctly. Please contact support.');
        return;
      }
      
      // Call API to get the latest room bed data using roomBedId (integer primary key)
      const roomBedData = await roomBedsApi.getById(roomBed.roomBedId);
      
      setSelectedRoomBed(roomBedData);
      setFormData({
        bedNo: roomBedData.bedNo || '',
        roomNo: roomBedData.roomNo || '',
        roomCategory: roomBedData.roomCategory || 'AC',
        roomType: roomBedData.roomType || 'Regular',
        chargesPerDay: roomBedData.chargesPerDay || 0,
        status: roomBedData.status || 'Active',
      });
    } catch (err) {
      console.error('Failed to load room bed for editing:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load room bed data. Please try again.';
      setSubmitError(errorMessage);
      // Don't close the dialog on error, let user see the error message
      // But use existing data as fallback
      if (roomBed) {
        setSelectedRoomBed(roomBed);
        setFormData({
          bedNo: roomBed.bedNo || '',
          roomNo: roomBed.roomNo || '',
          roomCategory: roomBed.roomCategory || 'AC',
          roomType: roomBed.roomType || 'Regular',
          chargesPerDay: roomBed.chargesPerDay || 0,
          status: roomBed.status || 'Active',
        });
      } else {
        setIsEditDialogOpen(false);
        setSelectedRoomBed(null);
      }
    } finally {
      setLoadingEditData(false);
    }
  };

  const getStatusBadge = (status: RoomBed['status']) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="size-3" />Active</span>;
      case 'Inactive':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><XCircle className="size-3" />Inactive</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
      <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <h1 className="text-gray-900 mb-2">IPD Room & Beds Management</h1>
              <p className="text-gray-500">Manage hospital rooms and beds</p>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="size-4" />
                    Add New Room Bed
                  </Button>
                </DialogTrigger>
          <DialogContent className="p-0 gap-0 large-dialog bg-white">
            <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0 bg-white">
              <DialogTitle className="text-gray-700" style={{ fontSize: '1.25rem' }}>Add New Room Bed</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0 bg-white">
              <div className="space-y-4 py-4">
                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {submitError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bedNo" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Bed No</Label>
                    <Input
                      id="bedNo"
                      placeholder="e.g., B101"
                      value={formData.bedNo}
                      onChange={(e) => setFormData({ ...formData, bedNo: e.target.value })}
                      className="text-gray-700 bg-gray-100"
                      style={{ fontSize: '1.125rem' }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="roomNo" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Room No</Label>
                    <Input
                      id="roomNo"
                      placeholder="e.g., R101"
                      value={formData.roomNo}
                      onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                      className="text-gray-700 bg-gray-100"
                      style={{ fontSize: '1.125rem' }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="roomCategory" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Room Category</Label>
                    <select
                      id="roomCategory"
                      aria-label="Room Category"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-gray-700 bg-gray-100"
                      value={formData.roomCategory}
                      onChange={(e) => setFormData({ ...formData, roomCategory: e.target.value })}
                      style={{ fontSize: '1.125rem' }}
                    >
                      {roomCategoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="roomType" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Room Type</Label>
                    <select
                      id="roomType"
                      aria-label="Room Type"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md text-gray-700 bg-gray-100"
                      value={formData.roomType}
                      onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                      style={{ fontSize: '1.125rem' }}
                    >
                      {roomTypeOptions.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="chargesPerDay" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Charges Per Day (₹)</Label>
                  <Input
                    id="chargesPerDay"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 1500"
                    value={formData.chargesPerDay}
                    onChange={(e) => setFormData({ ...formData, chargesPerDay: parseFloat(e.target.value) || 0 })}
                    className="text-gray-700 bg-gray-100"
                    style={{ fontSize: '1.125rem' }}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t bg-white px-6 pb-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddSubmit}>Add Room Bed</Button>
            </div>
          </DialogContent>
        </Dialog>
              </div>
            </div>
          {/* Search */}
          <Card className="mb-6 bg-white">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="Search by bed number, room number, category, type, status, or charges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Room Beds Table */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-lg mb-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700" colSpan={8}>
                    <div className="flex items-center gap-2">
                      <BedDouble className="size-5" />
                      <span>Room Beds List ({filteredRoomBeds.length}{searchTerm ? ` of ${roomBeds.length}` : ''})</span>
                    </div>
                  </th>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Bed No</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Room No</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Charges/Day</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Created At</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoomBeds.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No room beds found matching your search.' : 'No room beds found. Add a new room bed to get started.'}
                    </td>
                  </tr>
                ) : (
                  filteredRoomBeds.map((roomBed) => (
                    <tr key={roomBed.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium">{roomBed.bedNo || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{roomBed.roomNo || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{roomBed.roomCategory || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{roomBed.roomType || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {roomBed.chargesPerDay !== undefined && roomBed.chargesPerDay !== null 
                          ? `₹${Number(roomBed.chargesPerDay).toLocaleString()}` 
                          : '₹0'}
                      </td>
                      <td className="py-3 px-4 text-sm">{getStatusBadge(roomBed.status || 'Active')}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {roomBed.createdAt 
                          ? new Date(roomBed.createdAt).toLocaleDateString() 
                          : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => handleEdit(roomBed)}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="p-0 gap-0 large-dialog bg-white">
          <div className="flex-1 overflow-y-auto dialog-content-scrollable min-h-0 bg-white">
            {selectedRoomBed && (
              <>
                <DialogHeader className="px-6 pt-4 pb-3 bg-white">
                  <DialogTitle className="text-gray-700" style={{ fontSize: '1.25rem' }}>Edit Room Bed</DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-1">
                  <div className="space-y-4 py-4">
                    {submitError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        {submitError}
                      </div>
                    )}
                    {loadingEditData ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-blue-600">Loading room bed data...</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label className="text-gray-600" style={{ fontSize: '1.125rem' }}>Room Bed ID</Label>
                          <Input
                            value={selectedRoomBed.roomBedId || '-'}
                            disabled
                            className="bg-gray-50 text-gray-700"
                            style={{ fontSize: '1.125rem' }}
                          />
                          <p className="text-xs text-gray-700 mt-1">Room Bed ID is auto-generated and cannot be changed</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-bedNo" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Bed No</Label>
                            <Input
                              id="edit-bedNo"
                              placeholder="e.g., B101"
                              value={formData.bedNo}
                              onChange={(e) => setFormData({ ...formData, bedNo: e.target.value })}
                              className="text-gray-700 bg-gray-100"
                              style={{ fontSize: '1.125rem' }}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-roomNo" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Room No</Label>
                            <Input
                              id="edit-roomNo"
                              placeholder="e.g., R101"
                              value={formData.roomNo}
                              onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                              className="text-gray-700 bg-gray-100"
                              style={{ fontSize: '1.125rem' }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="edit-roomCategory" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Room Category</Label>
                            <select
                              id="edit-roomCategory"
                              aria-label="Room Category"
                              className="w-full px-3 py-2 border border-gray-200 rounded-md text-gray-700 bg-gray-100"
                              value={formData.roomCategory}
                              onChange={(e) => setFormData({ ...formData, roomCategory: e.target.value })}
                              style={{ fontSize: '1.125rem' }}
                            >
                              {roomCategoryOptions.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="edit-roomType" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Room Type</Label>
                            <select
                              id="edit-roomType"
                              aria-label="Room Type"
                              className="w-full px-3 py-2 border border-gray-200 rounded-md text-gray-700 bg-gray-100"
                              value={formData.roomType}
                              onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                              style={{ fontSize: '1.125rem' }}
                            >
                              {roomTypeOptions.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="edit-chargesPerDay" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Charges Per Day (₹)</Label>
                          <Input
                            id="edit-chargesPerDay"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="e.g., 1500"
                            value={formData.chargesPerDay}
                            onChange={(e) => setFormData({ ...formData, chargesPerDay: parseFloat(e.target.value) || 0 })}
                            className="text-gray-700 bg-gray-100"
                            style={{ fontSize: '1.125rem' }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-status" className="text-gray-600" style={{ fontSize: '1.125rem' }}>Status</Label>
                          <select
                            id="edit-status"
                            aria-label="Status"
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-gray-700 bg-gray-100"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as RoomBed['status'] })}
                            style={{ fontSize: '1.125rem' }}
                          >
                            {statusOptions.map(status => (
                              <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handleEditSubmit}>Update Room Bed</Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
}

