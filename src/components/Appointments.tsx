import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Calendar, Plus, Clock } from 'lucide-react';

interface Appointment {
  id: number;
  patient: string;
  doctor: string;
  date: string;
  time: string;
  department: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled' | 'Completed';
}

const mockAppointments: Appointment[] = [
  { id: 1, patient: 'John Smith', doctor: 'Dr. Sarah Johnson', date: '2025-11-11', time: '09:00 AM', department: 'Cardiology', status: 'Confirmed' },
  { id: 2, patient: 'Emma Wilson', doctor: 'Dr. Michael Chen', date: '2025-11-11', time: '10:30 AM', department: 'Endocrinology', status: 'Confirmed' },
  { id: 3, patient: 'Robert Brown', doctor: 'Dr. Sarah Johnson', date: '2025-11-11', time: '11:00 AM', department: 'Cardiology', status: 'Pending' },
  { id: 4, patient: 'Lisa Anderson', doctor: 'Dr. James Miller', date: '2025-11-11', time: '02:00 PM', department: 'Neurology', status: 'Confirmed' },
  { id: 5, patient: 'David Taylor', doctor: 'Dr. Emily Davis', date: '2025-11-12', time: '09:30 AM', department: 'Orthopedics', status: 'Confirmed' },
  { id: 6, patient: 'Sarah Martinez', doctor: 'Dr. Robert Lee', date: '2025-11-12', time: '11:00 AM', department: 'Dermatology', status: 'Pending' },
  { id: 7, patient: 'Michael Johnson', doctor: 'Dr. Sarah Johnson', date: '2025-11-13', time: '10:00 AM', department: 'Cardiology', status: 'Confirmed' },
];

export function Appointments() {
  const [appointments] = useState<Appointment[]>(mockAppointments);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2025-11-11');

  const filteredAppointments = appointments.filter(apt => apt.date === selectedDate);

  const uniqueDates = Array.from(new Set(appointments.map(apt => apt.date))).sort();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-gray-900 mb-2">Appointments</h1>
          <p className="text-gray-500">Schedule and manage patient appointments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="patient">Patient Name</Label>
                <Input id="patient" placeholder="Enter patient name" />
              </div>
              <div>
                <Label htmlFor="doctor">Doctor</Label>
                <Input id="doctor" placeholder="Select doctor" />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input id="department" placeholder="Select department" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" type="time" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => setIsAddDialogOpen(false)}>Schedule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Date Selector */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="size-5 text-blue-600" />
              <h3 className="text-gray-900">Select Date</h3>
            </div>
            <div className="space-y-2">
              {uniqueDates.map(date => {
                const dateObj = new Date(date);
                const formattedDate = dateObj.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                });
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedDate === date
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <p className={selectedDate === date ? 'text-blue-700' : 'text-gray-900'}>
                      {formattedDate}
                    </p>
                    <p className="text-sm text-gray-500">
                      {appointments.filter(apt => apt.date === date).length} appointments
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900">
                Appointments for {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="size-4" />
                <span className="text-sm">{filteredAppointments.length} appointments</span>
              </div>
            </div>

            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-gray-900">{appointment.patient}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          appointment.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                          appointment.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          appointment.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Doctor</p>
                          <p className="text-gray-900">{appointment.doctor}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Department</p>
                          <p className="text-gray-900">{appointment.department}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Time</p>
                          <p className="text-gray-900">{appointment.time}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View</Button>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredAppointments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No appointments scheduled for this date.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
