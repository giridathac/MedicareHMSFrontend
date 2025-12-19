import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BedDouble, Plus, Search, User, Calendar, Scissors } from 'lucide-react';

interface Admission {
  id: number;
  patientName: string;
  age: number;
  gender: string;
  admissionDate: string;
  roomType: 'Regular Ward' | 'Special Shared Room' | 'Special Room';
  bedNumber: string;
  admittedBy: string;
  diagnosis: string;
  status: 'Active' | 'Discharged' | 'Moved to ICU' | 'Surgery Scheduled';
  estimatedStay: string;
}

const mockAdmissions: Admission[] = [
  { id: 1, patientName: 'John Smith', age: 45, gender: 'Male', admissionDate: '2025-11-10', roomType: 'Special Room', bedNumber: 'SR-101', admittedBy: 'Dr. Sarah Johnson', diagnosis: 'Cardiac Arrhythmia', status: 'Active', estimatedStay: '3 days' },
  { id: 2, patientName: 'Emma Wilson', age: 32, gender: 'Female', admissionDate: '2025-11-14', roomType: 'Special Shared Room', bedNumber: 'SS-205', admittedBy: 'Dr. Sarah Johnson', diagnosis: 'Post-Angioplasty Care', status: 'Active', estimatedStay: '2 days' },
  { id: 3, patientName: 'Robert Brown', age: 58, gender: 'Male', admissionDate: '2025-11-12', roomType: 'Regular Ward', bedNumber: 'RW-312', admittedBy: 'Dr. Michael Chen', diagnosis: 'Knee Surgery Recovery', status: 'Surgery Scheduled', estimatedStay: '5 days' },
  { id: 4, patientName: 'Lisa Anderson', age: 41, gender: 'Female', admissionDate: '2025-11-13', roomType: 'Special Room', bedNumber: 'SR-103', admittedBy: 'Dr. James Miller', diagnosis: 'Stroke Recovery', status: 'Moved to ICU', estimatedStay: '7 days' },
  { id: 5, patientName: 'David Taylor', age: 29, gender: 'Male', admissionDate: '2025-11-11', roomType: 'Special Shared Room', bedNumber: 'SS-208', admittedBy: 'Dr. Emily Davis', diagnosis: 'Spinal Injury', status: 'Active', estimatedStay: '10 days' },
];

const roomCapacity = {
  'Regular Ward': { total: 50, occupied: 35, available: 15 },
  'Special Shared Room': { total: 20, occupied: 14, available: 6 },
  'Special Room': { total: 15, occupied: 8, available: 7 },
};

export function Admissions() {
  const [admissions, setAdmissions] = useState<Admission[]>(mockAdmissions);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredAdmissions = admissions.filter(admission =>
    admission.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admission.bedNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAdmissionsByStatus = (status: string) => {
    return filteredAdmissions.filter(a => a.status === status);
  };

  const totalOccupied = Object.values(roomCapacity).reduce((sum, room) => sum + room.occupied, 0);
  const totalCapacity = Object.values(roomCapacity).reduce((sum, room) => sum + room.total, 0);
  const occupancyRate = Math.round((totalOccupied / totalCapacity) * 100);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-gray-900 mb-2">IPD Admissions Management</h1>
          <p className="text-gray-500">Manage in-patient admissions and bed allocation</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              New Admission
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Admission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input id="patientName" placeholder="Enter patient name" />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" placeholder="Age" />
                </div>
              </div>
              <div>
                <Label htmlFor="admittedBy">Admitted By (Doctor)</Label>
                <Input id="admittedBy" placeholder="Doctor name" />
              </div>
              <div>
                <Label htmlFor="diagnosis">Diagnosis</Label>
                <Input id="diagnosis" placeholder="Enter diagnosis" />
              </div>
              <div>
                <Label>Room Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 text-center">
                    <p className="text-sm">Regular Ward</p>
                    <p className="text-xs text-gray-500">{roomCapacity['Regular Ward'].available} available</p>
                  </button>
                  <button className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 text-center">
                    <p className="text-sm">Special Shared</p>
                    <p className="text-xs text-gray-500">{roomCapacity['Special Shared Room'].available} available</p>
                  </button>
                  <button className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 text-center">
                    <p className="text-sm">Special Room</p>
                    <p className="text-xs text-gray-500">{roomCapacity['Special Room'].available} available</p>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsDialogOpen(false)}>Admit Patient</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Admissions</p>
              <BedDouble className="size-5 text-blue-600" />
            </div>
            <h3 className="text-gray-900">{admissions.length}</h3>
            <p className="text-xs text-gray-500">Active patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Bed Occupancy</p>
              <Badge variant={occupancyRate > 80 ? 'destructive' : 'default'}>{occupancyRate}%</Badge>
            </div>
            <h3 className="text-gray-900">{totalOccupied}/{totalCapacity}</h3>
            <p className="text-xs text-gray-500">Occupied beds</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Available Beds</p>
              <span className="text-green-600">●</span>
            </div>
            <h3 className="text-gray-900">{totalCapacity - totalOccupied}</h3>
            <p className="text-xs text-gray-500">Ready for admission</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Avg. Stay</p>
              <Calendar className="size-5 text-purple-600" />
            </div>
            <h3 className="text-gray-900">5.2 days</h3>
            <p className="text-xs text-gray-500">Average duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Room Capacity */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Room Capacity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(roomCapacity).map(([type, capacity]) => {
              const occupancy = Math.round((capacity.occupied / capacity.total) * 100);
              return (
                <div key={type} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-gray-900">{type}</h4>
                    <Badge variant={occupancy > 80 ? 'destructive' : 'default'}>{occupancy}%</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Beds:</span>
                      <span className="text-gray-900">{capacity.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Occupied:</span>
                      <span className="text-gray-900">{capacity.occupied}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Available:</span>
                      <span className="text-green-600">{capacity.available}</span>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${occupancy > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${occupancy}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Search by patient name or bed number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Admissions List */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Admissions ({filteredAdmissions.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({getAdmissionsByStatus('Active').length})</TabsTrigger>
          <TabsTrigger value="surgery">Surgery Scheduled ({getAdmissionsByStatus('Surgery Scheduled').length})</TabsTrigger>
          <TabsTrigger value="icu">Moved to ICU ({getAdmissionsByStatus('Moved to ICU').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <AdmissionsList admissions={filteredAdmissions} />
        </TabsContent>
        <TabsContent value="active">
          <AdmissionsList admissions={getAdmissionsByStatus('Active')} />
        </TabsContent>
        <TabsContent value="surgery">
          <AdmissionsList admissions={getAdmissionsByStatus('Surgery Scheduled')} />
        </TabsContent>
        <TabsContent value="icu">
          <AdmissionsList admissions={getAdmissionsByStatus('Moved to ICU')} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdmissionsList({ admissions }: { admissions: Admission[] }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700">Bed #</th>
                <th className="text-left py-3 px-4 text-gray-700">Patient</th>
                <th className="text-left py-3 px-4 text-gray-700">Age/Gender</th>
                <th className="text-left py-3 px-4 text-gray-700">Room Type</th>
                <th className="text-left py-3 px-4 text-gray-700">Admission Date</th>
                <th className="text-left py-3 px-4 text-gray-700">Admitted By</th>
                <th className="text-left py-3 px-4 text-gray-700">Diagnosis</th>
                <th className="text-left py-3 px-4 text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admissions.map((admission) => (
                <tr key={admission.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Badge>{admission.bedNumber}</Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{admission.patientName}</td>
                  <td className="py-3 px-4 text-gray-600">{admission.age}Y / {admission.gender}</td>
                  <td className="py-3 px-4 text-gray-600">{admission.roomType}</td>
                  <td className="py-3 px-4 text-gray-600">{admission.admissionDate}</td>
                  <td className="py-3 px-4 text-gray-600">{admission.admittedBy}</td>
                  <td className="py-3 px-4 text-gray-600">{admission.diagnosis}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      admission.status === 'Active' ? 'bg-green-100 text-green-700' :
                      admission.status === 'Surgery Scheduled' ? 'bg-orange-100 text-orange-700' :
                      admission.status === 'Moved to ICU' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {admission.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View</Button>
                      {admission.status === 'Active' && (
                        <Button variant="outline" size="sm" className="gap-1">
                          <Scissors className="size-3" />
                          Schedule OT
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {admissions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No admissions found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
