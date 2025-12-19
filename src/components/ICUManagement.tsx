import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { HeartPulse, Activity, Thermometer, Wind, Droplet, Brain } from 'lucide-react';

interface ICUPatient {
  id: number;
  bedNumber: string;
  patientName: string;
  age: number;
  gender: string;
  admissionDate: string;
  admissionTime: string;
  condition: string;
  severity: 'Critical' | 'Serious' | 'Stable';
  attendingDoctor: string;
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSaturation: number;
    respiratoryRate: number;
  };
  diagnosis: string;
  treatment: string;
  ventilatorSupport: boolean;
}

const mockICUPatients: ICUPatient[] = [
  {
    id: 1,
    bedNumber: 'ICU-01',
    patientName: 'Lisa Anderson',
    age: 41,
    gender: 'Female',
    admissionDate: '2025-11-13',
    admissionTime: '02:30 PM',
    condition: 'Post-Stroke Recovery',
    severity: 'Serious',
    attendingDoctor: 'Dr. James Miller',
    vitals: {
      heartRate: 88,
      bloodPressure: '130/85',
      temperature: 37.2,
      oxygenSaturation: 94,
      respiratoryRate: 18,
    },
    diagnosis: 'Ischemic Stroke',
    treatment: 'Thrombolytic therapy, monitoring',
    ventilatorSupport: false,
  },
  {
    id: 2,
    bedNumber: 'ICU-03',
    patientName: 'Michael Johnson',
    age: 62,
    gender: 'Male',
    admissionDate: '2025-11-12',
    admissionTime: '08:15 AM',
    condition: 'Post-Cardiac Surgery',
    severity: 'Critical',
    attendingDoctor: 'Dr. Sarah Johnson',
    vitals: {
      heartRate: 95,
      bloodPressure: '120/80',
      temperature: 36.8,
      oxygenSaturation: 92,
      respiratoryRate: 20,
    },
    diagnosis: 'Coronary Artery Disease',
    treatment: 'Post-CABG monitoring, pain management',
    ventilatorSupport: true,
  },
  {
    id: 3,
    bedNumber: 'ICU-05',
    patientName: 'David Martinez',
    age: 54,
    gender: 'Male',
    admissionDate: '2025-11-14',
    admissionTime: '11:00 AM',
    condition: 'Severe Pneumonia',
    severity: 'Critical',
    attendingDoctor: 'Dr. Emily Davis',
    vitals: {
      heartRate: 102,
      bloodPressure: '125/82',
      temperature: 38.5,
      oxygenSaturation: 89,
      respiratoryRate: 24,
    },
    diagnosis: 'Bilateral Pneumonia with Respiratory Distress',
    treatment: 'IV antibiotics, oxygen therapy',
    ventilatorSupport: true,
  },
  {
    id: 4,
    bedNumber: 'ICU-08',
    patientName: 'Jennifer White',
    age: 28,
    gender: 'Female',
    admissionDate: '2025-11-13',
    admissionTime: '11:30 AM',
    condition: 'Post C-Section Complications',
    severity: 'Stable',
    attendingDoctor: 'Dr. Maria Garcia',
    vitals: {
      heartRate: 78,
      bloodPressure: '118/75',
      temperature: 37.0,
      oxygenSaturation: 98,
      respiratoryRate: 16,
    },
    diagnosis: 'Post-operative bleeding, controlled',
    treatment: 'Blood transfusion, monitoring',
    ventilatorSupport: false,
  },
];

const icuBeds = Array.from({ length: 15 }, (_, i) => {
  const bedNumber = `ICU-${(i + 1).toString().padStart(2, '0')}`;
  const patient = mockICUPatients.find(p => p.bedNumber === bedNumber);
  return {
    bedNumber,
    status: patient ? 'Occupied' : 'Available',
    patient,
  };
});

export function ICUManagement() {
  const [patients] = useState<ICUPatient[]>(mockICUPatients);
  const [selectedBed, setSelectedBed] = useState<string | null>(null);

  const occupiedBeds = icuBeds.filter(bed => bed.status === 'Occupied').length;
  const availableBeds = icuBeds.filter(bed => bed.status === 'Available').length;
  const criticalPatients = patients.filter(p => p.severity === 'Critical').length;
  const onVentilator = patients.filter(p => p.ventilatorSupport).length;

  const selectedPatient = icuBeds.find(bed => bed.bedNumber === selectedBed)?.patient;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">ICU Management</h1>
        <p className="text-gray-500">Intensive Care Unit monitoring and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Total Patients</p>
              <HeartPulse className="size-5 text-red-600" />
            </div>
            <h3 className="text-gray-900">{occupiedBeds}/15</h3>
            <p className="text-xs text-gray-500">Occupied beds</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Critical Patients</p>
              <Badge variant="destructive">{criticalPatients}</Badge>
            </div>
            <h3 className="text-gray-900">{criticalPatients}</h3>
            <p className="text-xs text-gray-500">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">On Ventilator</p>
              <Wind className="size-5 text-blue-600" />
            </div>
            <h3 className="text-gray-900">{onVentilator}</h3>
            <p className="text-xs text-gray-500">Ventilator support</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Available Beds</p>
              <span className="text-green-600">●</span>
            </div>
            <h3 className="text-gray-900">{availableBeds}</h3>
            <p className="text-xs text-gray-500">Ready for admission</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ICU Bed Layout */}
        <Card>
          <CardHeader>
            <CardTitle>ICU Bed Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {icuBeds.map((bed) => (
                <button
                  key={bed.bedNumber}
                  onClick={() => setSelectedBed(bed.bedNumber)}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    selectedBed === bed.bedNumber
                      ? 'border-blue-500 bg-blue-50 scale-105'
                      : bed.status === 'Occupied'
                      ? bed.patient?.severity === 'Critical'
                        ? 'border-red-300 bg-red-50 hover:border-red-400'
                        : bed.patient?.severity === 'Serious'
                        ? 'border-orange-300 bg-orange-50 hover:border-orange-400'
                        : 'border-yellow-300 bg-yellow-50 hover:border-yellow-400'
                      : 'border-green-300 bg-green-50 hover:border-green-400'
                  }`}
                >
                  <p className="text-gray-900 mb-1">{bed.bedNumber}</p>
                  <div className="flex items-center justify-center gap-1">
                    <span className={`size-2 rounded-full ${
                      bed.status === 'Occupied'
                        ? bed.patient?.severity === 'Critical'
                          ? 'bg-red-500'
                          : bed.patient?.severity === 'Serious'
                          ? 'bg-orange-500'
                          : 'bg-yellow-500'
                        : 'bg-green-500'
                    }`} />
                    <span className="text-xs text-gray-600">
                      {bed.status === 'Occupied' ? bed.patient?.severity : 'Available'}
                    </span>
                  </div>
                  {bed.patient?.ventilatorSupport && (
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-xs">
                        <Wind className="size-3 mr-1" />
                        Ventilator
                      </Badge>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-red-500" />
                <span className="text-gray-600">Critical</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-orange-500" />
                <span className="text-gray-600">Serious</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-yellow-500" />
                <span className="text-gray-600">Stable</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-green-500" />
                <span className="text-gray-600">Available</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient Details */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPatient ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-gray-900 mb-1">{selectedPatient.patientName}</h3>
                    <p className="text-sm text-gray-600">{selectedPatient.age}Y / {selectedPatient.gender}</p>
                  </div>
                  <Badge variant={
                    selectedPatient.severity === 'Critical' ? 'destructive' :
                    selectedPatient.severity === 'Serious' ? 'default' : 'secondary'
                  }>
                    {selectedPatient.severity}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Bed Number</p>
                    <p className="text-gray-900">{selectedPatient.bedNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Admission</p>
                    <p className="text-gray-900">{selectedPatient.admissionDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Attending Doctor</p>
                    <p className="text-gray-900">{selectedPatient.attendingDoctor}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Ventilator</p>
                    <p className="text-gray-900">{selectedPatient.ventilatorSupport ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Condition</p>
                  <p className="text-gray-900">{selectedPatient.condition}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Diagnosis</p>
                  <p className="text-gray-900">{selectedPatient.diagnosis}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Treatment</p>
                  <p className="text-gray-900">{selectedPatient.treatment}</p>
                </div>

                {/* Vital Signs */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-gray-900 mb-3 flex items-center gap-2">
                    <Activity className="size-5 text-blue-600" />
                    Vital Signs
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <HeartPulse className="size-4 text-red-600" />
                        <p className="text-xs text-gray-500">Heart Rate</p>
                      </div>
                      <p className="text-lg text-gray-900">{selectedPatient.vitals.heartRate} bpm</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="size-4 text-blue-600" />
                        <p className="text-xs text-gray-500">Blood Pressure</p>
                      </div>
                      <p className="text-lg text-gray-900">{selectedPatient.vitals.bloodPressure}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Thermometer className="size-4 text-orange-600" />
                        <p className="text-xs text-gray-500">Temperature</p>
                      </div>
                      <p className="text-lg text-gray-900">{selectedPatient.vitals.temperature}°C</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Droplet className="size-4 text-cyan-600" />
                        <p className="text-xs text-gray-500">O₂ Saturation</p>
                      </div>
                      <p className="text-lg text-gray-900">{selectedPatient.vitals.oxygenSaturation}%</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Wind className="size-4 text-teal-600" />
                        <p className="text-xs text-gray-500">Respiratory Rate</p>
                      </div>
                      <p className="text-lg text-gray-900">{selectedPatient.vitals.respiratoryRate} /min</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">Update Vitals</Button>
                  <Button variant="outline" className="flex-1">View History</Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Select a bed to view patient details
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All ICU Patients List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All ICU Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">Bed</th>
                  <th className="text-left py-3 px-4 text-gray-700">Patient</th>
                  <th className="text-left py-3 px-4 text-gray-700">Condition</th>
                  <th className="text-left py-3 px-4 text-gray-700">Severity</th>
                  <th className="text-left py-3 px-4 text-gray-700">Doctor</th>
                  <th className="text-left py-3 px-4 text-gray-700">Ventilator</th>
                  <th className="text-left py-3 px-4 text-gray-700">Heart Rate</th>
                  <th className="text-left py-3 px-4 text-gray-700">O₂ Sat</th>
                  <th className="text-left py-3 px-4 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Badge>{patient.bedNumber}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-900">{patient.patientName}</p>
                      <p className="text-xs text-gray-500">{patient.age}Y / {patient.gender}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{patient.condition}</td>
                    <td className="py-3 px-4">
                      <Badge variant={
                        patient.severity === 'Critical' ? 'destructive' :
                        patient.severity === 'Serious' ? 'default' : 'secondary'
                      }>
                        {patient.severity}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{patient.attendingDoctor}</td>
                    <td className="py-3 px-4">
                      {patient.ventilatorSupport ? (
                        <Badge variant="secondary">
                          <Wind className="size-3 mr-1" />
                          Yes
                        </Badge>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-900">{patient.vitals.heartRate} bpm</td>
                    <td className="py-3 px-4">
                      <span className={patient.vitals.oxygenSaturation < 90 ? 'text-red-600' : 'text-gray-900'}>
                        {patient.vitals.oxygenSaturation}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBed(patient.bedNumber)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
