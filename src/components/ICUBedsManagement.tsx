import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { HeartPulse, Plus, Edit, CheckCircle2, XCircle, Search } from 'lucide-react';
import { useICUBeds } from '../hooks/useICUBeds';
import { ICUBed } from '../types';

const icuTypeOptions = ['Medical', 'Surgical', 'Pediatric', 'Cardiac', 'Neurological', 'Trauma'];
const statusOptions: ICUBed['status'][] = ['active', 'inactive'];

export function ICUBedsManagement() {
  const { icuBeds, loading, error, createICUBed, updateICUBed } = useICUBeds();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedICUBed, setSelectedICUBed] = useState<ICUBed | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    icuBedNo: '',
    icuType: 'Medical',
    icuRoomNameNo: '',
    icuDescription: '',
    isVentilatorAttached: false,
    status: 'active' as ICUBed['status'],
  });

  const handleCreateICUBed = async (data: {
    icuBedNo: string;
    icuType: string;
    icuRoomNameNo: string;
    icuDescription?: string;
    isVentilatorAttached: boolean;
    status?: 'active' | 'inactive';
  }) => {
    try {
      await createICUBed(data);
    } catch (err) {
      console.error('Failed to create ICU bed:', err);
      throw err;
    }
  };

  const handleUpdateICUBed = async (icuId: number, data: Partial<{
    icuBedNo: string;
    icuType: string;
    icuRoomNameNo: string;
    icuDescription?: string;
    isVentilatorAttached: boolean;
    status?: 'active' | 'inactive';
  }>) => {
    try {
      await updateICUBed({ icuId, ...data });
    } catch (err) {
      console.error('Failed to update ICU bed:', err);
      throw err;
    }
  };

  const handleAddSubmit = async () => {
    if (!formData.icuBedNo || !formData.icuRoomNameNo) {
      alert('Please fill in all required fields.');
      return;
    }
    try {
      // Explicitly ensure boolean value is correctly set
      const isVentilatorAttached = formData.isVentilatorAttached === true;
      console.log('Add ICU Bed - isVentilatorAttached value:', isVentilatorAttached, 'from formData:', formData.isVentilatorAttached);
      await handleCreateICUBed({
        icuBedNo: formData.icuBedNo,
        icuType: formData.icuType,
        icuRoomNameNo: formData.icuRoomNameNo,
        icuDescription: formData.icuDescription || undefined,
        isVentilatorAttached: isVentilatorAttached,
        status: formData.status,
      });
      setIsAddDialogOpen(false);
      setFormData({
        icuBedNo: '',
        icuType: 'Medical',
        icuRoomNameNo: '',
        icuDescription: '',
        isVentilatorAttached: false,
        status: 'active',
      });
    } catch (err) {
      // Error handled in parent
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedICUBed) return;
    if (!formData.icuBedNo || !formData.icuRoomNameNo) {
      alert('Please fill in all required fields.');
      return;
    }
    // Validate icuId before attempting update
    if (!selectedICUBed.icuId || selectedICUBed.icuId <= 0) {
      console.error('Invalid ICU ID:', selectedICUBed.icuId, 'Full ICU bed data:', selectedICUBed);
      alert('Invalid ICU ID. Cannot update this record.');
      return;
    }
    try {
      // Explicitly ensure boolean value is correctly set
      const isVentilatorAttachedValue = formData.isVentilatorAttached === true;
      console.log('Update ICU Bed - isVentilatorAttached value:', isVentilatorAttachedValue, 'from formData:', formData.isVentilatorAttached);
      await handleUpdateICUBed(selectedICUBed.icuId, {
        icuBedNo: formData.icuBedNo,
        icuType: formData.icuType,
        icuRoomNameNo: formData.icuRoomNameNo,
        icuDescription: formData.icuDescription || undefined,
        isVentilatorAttached: isVentilatorAttachedValue,
        status: formData.status,
      });
      setIsEditDialogOpen(false);
      setSelectedICUBed(null);
      setFormData({
        icuBedNo: '',
        icuType: 'Medical',
        icuRoomNameNo: '',
        icuDescription: '',
        isVentilatorAttached: false,
        status: 'active',
      });
    } catch (err) {
      console.error('Error updating ICU bed:', err);
      alert(err instanceof Error ? err.message : 'Failed to update ICU bed. Please check the console for details.');
    }
  };

  const handleEdit = (icuBed: ICUBed) => {
    // Validate icuId before allowing edit
    if (!icuBed.icuId || icuBed.icuId <= 0) {
      console.error('Invalid ICU ID for edit:', icuBed.icuId, 'Full ICU bed data:', icuBed);
      alert('Invalid ICU ID. Cannot edit this record.');
      return;
    }
    setSelectedICUBed(icuBed);
    setFormData({
      icuBedNo: icuBed.icuBedNo,
      icuType: icuBed.icuType,
      icuRoomNameNo: icuBed.icuRoomNameNo,
      icuDescription: icuBed.icuDescription || '',
      isVentilatorAttached: icuBed.isVentilatorAttached,
      status: icuBed.status,
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: ICUBed['status']) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle2 className="size-3" />Active</span>;
      case 'inactive':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"><XCircle className="size-3" />Inactive</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="px-4 pt-4 pb-0 bg-white h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-gray-900 mb-0 text-xl">ICU Bed Management</h1>
            <p className="text-gray-500 text-sm">Manage ICU beds and their configurations</p>
          </div>
        </div>
        <div className="p-8">
          <div className="text-center py-12 text-blue-600">Loading ICU beds...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pt-4 pb-0 bg-white h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-gray-900 mb-0 text-xl">ICU Bed Management</h1>
            <p className="text-gray-500 text-sm">Manage ICU beds and their configurations</p>
          </div>
        </div>
        <div className="p-8">
          <div className="text-center py-12 text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-4 bg-white h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-gray-900 mb-0 text-xl">ICU Bed Management</h1>
            <p className="text-gray-500 text-sm">Manage ICU beds and their configurations</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                Add ICU Bed
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 gap-0 large-dialog">
              <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
                <DialogTitle>Add New ICU Bed</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="icuBedNo">ICU Bed No</Label>
                      <Input
                        id="icuBedNo"
                        placeholder="e.g., B01"
                        value={formData.icuBedNo}
                        onChange={(e) => setFormData({ ...formData, icuBedNo: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="icuType">ICU Type</Label>
                      <select
                        id="icuType"
                        aria-label="ICU Type"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md"
                        value={formData.icuType}
                        onChange={(e) => setFormData({ ...formData, icuType: e.target.value })}
                      >
                        {icuTypeOptions.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="icuRoomNameNo">ICU Room Name/No</Label>
                    <Input
                      id="icuRoomNameNo"
                      placeholder="e.g., R101"
                      value={formData.icuRoomNameNo}
                      onChange={(e) => setFormData({ ...formData, icuRoomNameNo: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="icuDescription">ICU Description</Label>
                    <Textarea
                      id="icuDescription"
                      placeholder="Enter ICU bed description..."
                      value={formData.icuDescription}
                      onChange={(e) => setFormData({ ...formData, icuDescription: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="isVentilatorAttached">Is Ventilator Attached</Label>
                      <select
                        id="isVentilatorAttached"
                        aria-label="Is Ventilator Attached"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md"
                        value={formData.isVentilatorAttached ? 'Yes' : 'No'}
                        onChange={(e) => setFormData({ ...formData, isVentilatorAttached: e.target.value === 'Yes' })}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        aria-label="Status"
                        className="w-full px-3 py-2 border border-gray-200 rounded-md"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as ICUBed['status'] })}
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-6 py-2 border-t bg-gray-50 flex-shrink-0">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="py-1">Cancel</Button>
                <Button onClick={handleAddSubmit} className="py-1">Add ICU Bed</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Search Bar */}
        <Card className="mb-4 bg-white">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by ICU Bed No, ICU Type, Room Name/No, or Description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* ICU Beds Table */}
        <Card className="flex-1 flex flex-col overflow-hidden min-h-0 mb-4 bg-white">
          <CardContent className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-white">
            <div className="overflow-x-auto overflow-y-scroll border border-gray-200 rounded flex-1 min-h-0 icu-beds-scrollable doctors-scrollable bg-white" style={{ maxHeight: 'calc(100vh - 240px)' }}>
              <table className="w-full bg-white">
                <thead>
                  <tr className="border-b border-gray-200 bg-white">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700" colSpan={8}>
                      <div className="flex items-center gap-2">
                        <HeartPulse className="size-5" />
                        <span>ICU Beds List ({(() => {
                          if (!searchTerm) return icuBeds.length;
                          const filtered = icuBeds.filter(bed => {
                            const searchLower = searchTerm.toLowerCase();
                            return (
                              bed.icuBedNo?.toLowerCase().includes(searchLower) ||
                              bed.icuType?.toLowerCase().includes(searchLower) ||
                              bed.icuRoomNameNo?.toLowerCase().includes(searchLower) ||
                              bed.icuDescription?.toLowerCase().includes(searchLower)
                            );
                          });
                          return filtered.length;
                        })()})</span>
                      </div>
                    </th>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">ICU Bed No</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">ICU Type</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">ICU Room Name/No</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">ICU Description</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Is Ventilator Attached</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Created At</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filteredBeds = searchTerm
                      ? icuBeds.filter(bed => {
                          const searchLower = searchTerm.toLowerCase();
                          return (
                            bed.icuBedNo?.toLowerCase().includes(searchLower) ||
                            bed.icuType?.toLowerCase().includes(searchLower) ||
                            bed.icuRoomNameNo?.toLowerCase().includes(searchLower) ||
                            bed.icuDescription?.toLowerCase().includes(searchLower)
                          );
                        })
                      : icuBeds;

                    if (filteredBeds.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-gray-500">
                            {searchTerm ? 'No ICU beds found matching your search.' : 'No ICU beds found. Add a new ICU bed to get started.'}
                          </td>
                        </tr>
                      );
                    }

                    return filteredBeds.map((icuBed) => (
                      <tr key={icuBed.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-900 font-medium">{icuBed.icuBedNo}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{icuBed.icuType}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{icuBed.icuRoomNameNo}</td>
                        <td className="py-3 px-4 text-sm text-gray-700 max-w-xs break-words whitespace-normal">{icuBed.icuDescription || '-'}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{icuBed.isVentilatorAttached ? 'Yes' : 'No'}</td>
                        <td className="py-3 px-4 text-sm">{getStatusBadge(icuBed.status)}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{new Date(icuBed.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                            <Button
                            variant="outline"
                              size="sm"
                              onClick={() => handleEdit(icuBed)}
                            className="gap-1"
                            >
                            <Edit className="size-3" />
                            View & Edit
                            </Button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="p-0 gap-0 large-dialog">
          <DialogHeader className="px-6 pt-4 pb-3 flex-shrink-0">
            <DialogTitle>Edit ICU Bed</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-1 patient-list-scrollable min-h-0">
            <div className="space-y-4 py-4">
              {selectedICUBed && (
                <div>
                  <Label>ICU ID</Label>
                  <Input
                    value={selectedICUBed.icuId}
                    disabled
                    className="bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">ICU ID is auto-generated and cannot be changed</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-icuBedNo">ICU Bed No</Label>
                  <Input
                    id="edit-icuBedNo"
                    placeholder="e.g., B01"
                    value={formData.icuBedNo}
                    onChange={(e) => setFormData({ ...formData, icuBedNo: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-icuType">ICU Type</Label>
                  <select
                    id="edit-icuType"
                    aria-label="ICU Type"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={formData.icuType}
                    onChange={(e) => setFormData({ ...formData, icuType: e.target.value })}
                  >
                    {icuTypeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-icuRoomNameNo">ICU Room Name/No</Label>
                <Input
                  id="edit-icuRoomNameNo"
                  placeholder="e.g., R101"
                  value={formData.icuRoomNameNo}
                  onChange={(e) => setFormData({ ...formData, icuRoomNameNo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-icuDescription">ICU Description</Label>
                <Textarea
                  id="edit-icuDescription"
                  placeholder="Enter ICU bed description..."
                  value={formData.icuDescription}
                  onChange={(e) => setFormData({ ...formData, icuDescription: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-isVentilatorAttached">Is Ventilator Attached</Label>
                  <select
                    id="edit-isVentilatorAttached"
                    aria-label="Is Ventilator Attached"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={formData.isVentilatorAttached ? 'Yes' : 'No'}
                    onChange={(e) => setFormData({ ...formData, isVentilatorAttached: e.target.value === 'Yes' })}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <select
                    id="edit-status"
                    aria-label="Status"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ICUBed['status'] })}
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-6 py-2 border-t bg-gray-50 flex-shrink-0">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="py-1">Cancel</Button>
            <Button onClick={handleEditSubmit} className="py-1">Update ICU Bed</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

