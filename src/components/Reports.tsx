import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, Download, FileText, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Mock data for reports
const doctorWiseOPD = [
  { doctor: 'Dr. Sarah Johnson', specialty: 'Cardiology', opd: 15, ipd: 3, total: 18 },
  { doctor: 'Dr. Michael Chen', specialty: 'Orthopedics', opd: 12, ipd: 5, total: 17 },
  { doctor: 'Dr. James Miller', specialty: 'Neurology', opd: 9, ipd: 2, total: 11 },
  { doctor: 'Dr. Emily Davis', specialty: 'General Medicine', opd: 18, ipd: 1, total: 19 },
  { doctor: 'Dr. Robert Lee', specialty: 'Pediatrics', opd: 12, ipd: 0, total: 12 },
  { doctor: 'Dr. Maria Garcia', specialty: 'Gynecology', opd: 8, ipd: 4, total: 12 },
];

const weeklyOPD = [
  { date: 'Nov 08', patients: 98, admissions: 8 },
  { date: 'Nov 09', patients: 102, admissions: 6 },
  { date: 'Nov 10', patients: 95, admissions: 10 },
  { date: 'Nov 11', patients: 124, admissions: 12 },
  { date: 'Nov 12', patients: 108, admissions: 9 },
  { date: 'Nov 13', patients: 87, admissions: 7 },
  { date: 'Nov 14', patients: 115, admissions: 11 },
];

const dailyAdmissions = [
  { department: 'Cardiology', count: 3 },
  { department: 'Orthopedics', count: 5 },
  { department: 'Neurology', count: 2 },
  { department: 'General Medicine', count: 1 },
  { department: 'Gynecology', count: 4 },
];

const otSchedule = [
  { date: 'Nov 11', surgeries: 6, completed: 6 },
  { date: 'Nov 12', surgeries: 5, completed: 5 },
  { date: 'Nov 13', surgeries: 7, completed: 7 },
  { date: 'Nov 14', surgeries: 8, completed: 3 },
];

const icuOccupancy = [
  { date: 'Nov 08', occupied: 10, total: 15 },
  { date: 'Nov 09', occupied: 11, total: 15 },
  { date: 'Nov 10', occupied: 9, total: 15 },
  { date: 'Nov 11', occupied: 12, total: 15 },
  { date: 'Nov 12', occupied: 12, total: 15 },
  { date: 'Nov 13', occupied: 11, total: 15 },
  { date: 'Nov 14', occupied: 12, total: 15 },
];

const ipdStats = {
  totalAdmissions: 89,
  regularWard: 45,
  specialShared: 28,
  specialRoom: 16,
  avgStayDuration: 5.2,
  dischargedToday: 8,
  criticalPatients: 12,
};

const otStats = {
  totalSurgeries: 32,
  completed: 27,
  scheduled: 5,
  emergency: 4,
  avgDuration: '2.8 hours',
};

const icuStats = {
  totalPatients: 12,
  critical: 3,
  serious: 5,
  stable: 4,
  onVentilator: 2,
  avgStayDuration: 3.5,
};

export function Reports() {
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState('2025-11-14');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-500">Comprehensive hospital performance reports</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={reportType === 'daily' ? 'default' : 'outline'}
            onClick={() => setReportType('daily')}
          >
            Daily Report
          </Button>
          <Button
            variant={reportType === 'weekly' ? 'default' : 'outline'}
            onClick={() => setReportType('weekly')}
          >
            Weekly Report
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {reportType === 'daily' ? 'Daily Report' : 'Weekly Report'}
              </h2>
              <p className="text-sm text-gray-500">
                {reportType === 'daily' ? `For ${selectedDate}` : 'Nov 08 - Nov 14, 2025'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Calendar className="size-5 text-blue-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="doctorwise" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="doctorwise">Doctor-wise</TabsTrigger>
          <TabsTrigger value="opd">OPD</TabsTrigger>
          <TabsTrigger value="ipd">IPD</TabsTrigger>
          <TabsTrigger value="ot">OT</TabsTrigger>
          <TabsTrigger value="icu">ICU</TabsTrigger>
        </TabsList>

        <TabsContent value="doctorwise" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Doctor-wise Patient Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-700 font-medium">Doctor</th>
                      <th className="text-left py-3 px-4 text-gray-700 font-medium">Specialty</th>
                      <th className="text-left py-3 px-4 text-gray-700 font-medium">OPD Patients</th>
                      <th className="text-left py-3 px-4 text-gray-700 font-medium">IPD Patients</th>
                      <th className="text-left py-3 px-4 text-gray-700 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorWiseOPD.map((doc, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-900">{doc.doctor}</td>
                        <td className="py-3 px-4 text-gray-600">{doc.specialty}</td>
                        <td className="py-3 px-4 text-gray-900">{doc.opd}</td>
                        <td className="py-3 px-4 text-gray-900">{doc.ipd}</td>
                        <td className="py-3 px-4 text-gray-900 font-medium">{doc.total}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-300 font-semibold">
                      <td className="py-3 px-4 text-gray-900">Total</td>
                      <td className="py-3 px-4"></td>
                      <td className="py-3 px-4 text-gray-900">
                        {doctorWiseOPD.reduce((sum, doc) => sum + doc.opd, 0)}
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {doctorWiseOPD.reduce((sum, doc) => sum + doc.ipd, 0)}
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {doctorWiseOPD.reduce((sum, doc) => sum + doc.total, 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Doctor Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={doctorWiseOPD}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="doctor" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="opd" fill="#3b82f6" name="OPD Patients" />
                  <Bar dataKey="ipd" fill="#8b5cf6" name="IPD Patients" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opd" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Total OPD Patients</p>
                  <FileText className="size-5 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {reportType === 'daily' ? '115' : '729'}
                </h3>
                <p className="text-xs text-gray-500">
                  {reportType === 'daily' ? 'Today' : 'This week'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Avg. Wait Time</p>
                  <TrendingUp className="size-5 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">23 min</h3>
                <p className="text-xs text-green-600">-5 min from last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Peak Hours</p>
                  <Calendar className="size-5 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">10 AM - 1 PM</h3>
                <p className="text-xs text-gray-500">Busiest period</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>OPD Patient Flow - Weekly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={weeklyOPD}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={2} name="OPD Patients" />
                  <Line type="monotone" dataKey="admissions" stroke="#8b5cf6" strokeWidth={2} name="Admissions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ipd" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">Total Admissions</p>
                <h3 className="text-2xl font-bold text-gray-900">{ipdStats.totalAdmissions}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">Regular Ward</p>
                <h3 className="text-2xl font-bold text-gray-900">{ipdStats.regularWard}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">Special Rooms</p>
                <h3 className="text-2xl font-bold text-gray-900">{ipdStats.specialShared + ipdStats.specialRoom}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">Avg. Stay Duration</p>
                <h3 className="text-2xl font-bold text-gray-900">{ipdStats.avgStayDuration} days</h3>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Department-wise Admissions (Today)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyAdmissions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>IPD Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Discharged Today</p>
                  <p className="text-xl font-semibold text-gray-900">{ipdStats.dischargedToday}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700 mb-1">Critical Patients</p>
                  <p className="text-xl font-semibold text-red-900">{ipdStats.criticalPatients}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 mb-1">Bed Occupancy</p>
                  <p className="text-xl font-semibold text-blue-900">87%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ot" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">Total Surgeries</p>
                <h3 className="text-2xl font-bold text-gray-900">{otStats.totalSurgeries}</h3>
                <p className="text-xs text-gray-500">This week</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">Completed</p>
                <h3 className="text-2xl font-bold text-gray-900">{otStats.completed}</h3>
                <p className="text-xs text-green-600">Successfully</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">Emergency</p>
                <h3 className="text-2xl font-bold text-gray-900">{otStats.emergency}</h3>
                <p className="text-xs text-red-600">Urgent cases</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">Avg. Duration</p>
                <h3 className="text-2xl font-bold text-gray-900">{otStats.avgDuration}</h3>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Surgery Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={otSchedule}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="surgeries" fill="#f97316" name="Scheduled" />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="icu" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">Total ICU Patients</p>
                <h3 className="text-2xl font-bold text-gray-900">{icuStats.totalPatients}/15</h3>
                <p className="text-xs text-gray-500">80% occupancy</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">Critical</p>
                <h3 className="text-2xl font-bold text-red-900">{icuStats.critical}</h3>
                <p className="text-xs text-red-600">Requires attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">On Ventilator</p>
                <h3 className="text-2xl font-bold text-gray-900">{icuStats.onVentilator}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-500 mb-1">Avg. Stay</p>
                <h3 className="text-2xl font-bold text-gray-900">{icuStats.avgStayDuration} days</h3>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ICU Occupancy Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={icuOccupancy}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="occupied" stroke="#ef4444" strokeWidth={2} name="Occupied Beds" />
                  <Line type="monotone" dataKey="total" stroke="#94a3b8" strokeWidth={2} name="Total Beds" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patient Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <p className="text-sm text-red-700 mb-1">Critical</p>
                  <p className="text-2xl font-bold text-red-900">{icuStats.critical}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <p className="text-sm text-orange-700 mb-1">Serious</p>
                  <p className="text-2xl font-bold text-orange-900">{icuStats.serious}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-sm text-green-700 mb-1">Stable</p>
                  <p className="text-2xl font-bold text-green-900">{icuStats.stable}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
