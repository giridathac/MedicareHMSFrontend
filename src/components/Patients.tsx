import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Search, Plus, Eye, Edit, Trash2 } from 'lucide-react';

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  bloodType: string;
  lastVisit: string;
  condition: string;
}

const mockPatients: Patient[] = [
  { id: 1, name: 'John Smith', age: 45, gender: 'Male', phone: '555-0101', email: 'john.smith@email.com', bloodType: 'O+', lastVisit: '2025-11-08', condition: 'Hypertension' },
  { id: 2, name: 'Emma Wilson', age: 32, gender: 'Female', phone: '555-0102', email: 'emma.wilson@email.com', bloodType: 'A+', lastVisit: '2025-11-10', condition: 'Diabetes' },
  { id: 3, name: 'Robert Brown', age: 58, gender: 'Male', phone: '555-0103', email: 'robert.brown@email.com', bloodType: 'B+', lastVisit: '2025-11-05', condition: 'Asthma' },
  { id: 4, name: 'Lisa Anderson', age: 41, gender: 'Female', phone: '555-0104', email: 'lisa.anderson@email.com', bloodType: 'AB+', lastVisit: '2025-11-09', condition: 'Migraine' },
  { id: 5, name: 'David Taylor', age: 29, gender: 'Male', phone: '555-0105', email: 'david.taylor@email.com', bloodType: 'O-', lastVisit: '2025-11-11', condition: 'Back Pain' },
  { id: 6, name: 'Sarah Martinez', age: 36, gender: 'Female', phone: '555-0106', email: 'sarah.martinez@email.com', bloodType: 'A-', lastVisit: '2025-11-07', condition: 'Allergies' },
];

export function Patients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-gray-900 mb-2">Patients</h1>
          <p className="text-gray-500">Manage patient records and information</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Enter full name" />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" placeholder="Enter age" />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Input id="gender" placeholder="Enter gender" />
              </div>
              <div>
                <Label htmlFor="bloodType">Blood Type</Label>
                <Input id="bloodType" placeholder="e.g., O+" />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="Enter phone number" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter email" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="condition">Medical Condition</Label>
                <Input id="condition" placeholder="Enter medical condition" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsAddDialogOpen(false)}>Add Patient</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search patients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">Patient Name</th>
                  <th className="text-left py-3 px-4 text-gray-700">Age</th>
                  <th className="text-left py-3 px-4 text-gray-700">Gender</th>
                  <th className="text-left py-3 px-4 text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 text-gray-700">Blood Type</th>
                  <th className="text-left py-3 px-4 text-gray-700">Last Visit</th>
                  <th className="text-left py-3 px-4 text-gray-700">Condition</th>
                  <th className="text-left py-3 px-4 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{patient.name}</td>
                    <td className="py-3 px-4 text-gray-600">{patient.age}</td>
                    <td className="py-3 px-4 text-gray-600">{patient.gender}</td>
                    <td className="py-3 px-4 text-gray-600">{patient.phone}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                        {patient.bloodType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{patient.lastVisit}</td>
                    <td className="py-3 px-4 text-gray-600">{patient.condition}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="size-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPatients.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No patients found matching your search.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
