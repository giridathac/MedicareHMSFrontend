import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { ArrowLeft, Plus, Activity } from 'lucide-react';
import { admissionsApi, ICUNurseVisitVitals } from '../api/admissions';
import { apiRequest } from '../api/base';

export function ICUNurseVisitVitals() {
  console.log('========================================');
  console.log('ICUNurseVisitVitals component rendered/mounted');
  console.log('Current window.location.hash:', window.location.hash);
  console.log('========================================');
  
  const [icuNurseVisitId, setIcuNurseVisitId] = useState<string | null>(null);
  const [vitals, setVitals] = useState<ICUNurseVisitVitals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add Vitals Dialog State
  const [isAddVitalsDialogOpen, setIsAddVitalsDialogOpen] = useState(false);
  const [vitalsFormData, setVitalsFormData] = useState({
    heartRate: '',
    bloodPressure: '',
    temperature: '',
    oxygenSaturation: '',
    respiratoryRate: '',
    bloodSugar: '',
    recordedDateTime: '',
    notes: ''
  });
  const [vitalsSubmitting, setVitalsSubmitting] = useState(false);
  const [vitalsSubmitError, setVitalsSubmitError] = useState<string | null>(null);

  useEffect(() => {
    // Get icuNurseVisitId from URL hash parameters
    console.log('========================================');
    console.log('ICUNurseVisitVitals: useEffect triggered');
    console.log('Current window.location.hash:', window.location.hash);
    
    const hash = window.location.hash.slice(1);
    console.log('Hash after slice(1):', hash);
    
    const params = new URLSearchParams(hash.split('?')[1] || '');
    console.log('URL Parameters:', Object.fromEntries(params.entries()));
    
    const id = params.get('icuNurseVisitId') || params.get('id');
    console.log('Extracted icuNurseVisitId:', id);
    console.log('========================================');
    
    if (id) {
      setIcuNurseVisitId(id);
      fetchVitals(id);
    } else {
      console.error('ICU Nurse Visit ID is missing from URL');
      setError('ICU Nurse Visit ID is missing from URL');
      setLoading(false);
    }
  }, []);

  const fetchVitals = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('========================================');
      console.log('Fetching ICU nurse visit vitals for icuNurseVisitId:', id);
      console.log('API Endpoint:', `/icu-nurse-visits/${id}/vitals`);
      console.log('========================================');
      
      const vitalsData = await admissionsApi.getICUNurseVisitVitalsByICUNurseVisitsId(id);
      console.log('Fetched ICU nurse visit vitals:', vitalsData);
      setVitals(vitalsData);
    } catch (err) {
      console.error('Error fetching ICU nurse visit vitals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load vitals');
      setVitals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Navigate back to Manage ICU Case page
    // Extract patientICUAdmissionId from current URL or go back to ICU management
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const patientICUAdmissionId = params.get('patientICUAdmissionId');
    
    if (patientICUAdmissionId) {
      window.location.hash = `manageicucase?patientICUAdmissionId=${patientICUAdmissionId}`;
    } else {
      window.location.hash = 'icu';
    }
  };

  const handleOpenAddVitalsDialog = () => {
    setVitalsFormData({
      heartRate: '',
      bloodPressure: '',
      temperature: '',
      oxygenSaturation: '',
      respiratoryRate: '',
      bloodSugar: '',
      recordedDateTime: new Date().toISOString().slice(0, 16), // Current date/time in local format
      notes: ''
    });
    setVitalsSubmitError(null);
    setIsAddVitalsDialogOpen(true);
  };

  const handleSaveVitals = async () => {
    if (!icuNurseVisitId) {
      setVitalsSubmitError('ICU Nurse Visit ID is missing');
      return;
    }

    try {
      setVitalsSubmitting(true);
      setVitalsSubmitError(null);

      console.log('Saving ICU nurse visit vitals with data:', vitalsFormData);

      // Prepare the request payload
      const payload = {
        ICUNurseVisitId: String(icuNurseVisitId), // UUID string
        HeartRate: vitalsFormData.heartRate ? Number(vitalsFormData.heartRate) : null,
        BloodPressure: vitalsFormData.bloodPressure || null,
        Temperature: vitalsFormData.temperature ? Number(vitalsFormData.temperature) : null,
        OxygenSaturation: vitalsFormData.oxygenSaturation ? Number(vitalsFormData.oxygenSaturation) : null,
        RespiratoryRate: vitalsFormData.respiratoryRate ? Number(vitalsFormData.respiratoryRate) : null,
        BloodSugar: vitalsFormData.bloodSugar ? Number(vitalsFormData.bloodSugar) : null,
        RecordedDateTime: vitalsFormData.recordedDateTime,
        Notes: vitalsFormData.notes || null
      };

      console.log('API Payload:', payload);
      console.log('API Endpoint: /icu-nurse-visits/vitals');

      // Call the API to create the vitals record
      const response = await apiRequest<any>('/icu-nurse-visits/vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('ICU nurse visit vitals created successfully:', response);

      // Close dialog and refresh vitals list
      setIsAddVitalsDialogOpen(false);
      
      // Refresh the vitals list
      if (icuNurseVisitId) {
        await fetchVitals(icuNurseVisitId);
      }

      // Reset form
      setVitalsFormData({
        heartRate: '',
        bloodPressure: '',
        temperature: '',
        oxygenSaturation: '',
        respiratoryRate: '',
        bloodSugar: '',
        recordedDateTime: '',
        notes: ''
      });
    } catch (err) {
      console.error('Error saving ICU nurse visit vitals:', err);
      setVitalsSubmitError(
        err instanceof Error ? err.message : 'Failed to save vitals'
      );
    } finally {
      setVitalsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading vitals...</p>
        </div>
      </div>
    );
  }

  if (error && !icuNurseVisitId) {
    return (
      <div className="flex-1 bg-blue-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="size-4 mr-2" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-blue-100 flex flex-col overflow-hidden min-h-0">
      <div className="px-4 pt-4 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <div>
              <h1 className="text-gray-900 mb-0 text-xl">ICU Nurse Visit Vitals</h1>
              <p className="text-gray-500 text-sm">ICU Nurse Visit ID: {icuNurseVisitId}</p>
            </div>
          </div>
          <Button
            onClick={handleOpenAddVitalsDialog}
            className="gap-2"
          >
            <Plus className="size-4" />
            Add Vitals
          </Button>
        </div>
      </div>

      <div className="overflow-y-auto overflow-x-hidden px-4 pb-4" style={{ maxHeight: 'calc(100vh - 100px)', minHeight: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle>Vitals Records</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : vitals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No vitals records found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-700">Recorded Date & Time</th>
                      <th className="text-left py-3 px-4 text-gray-700">Heart Rate</th>
                      <th className="text-left py-3 px-4 text-gray-700">Blood Pressure</th>
                      <th className="text-left py-3 px-4 text-gray-700">Temperature</th>
                      <th className="text-left py-3 px-4 text-gray-700">O₂ Saturation</th>
                      <th className="text-left py-3 px-4 text-gray-700">Respiratory Rate</th>
                      <th className="text-left py-3 px-4 text-gray-700">Blood Sugar</th>
                      <th className="text-left py-3 px-4 text-gray-700">Recorded By</th>
                      <th className="text-left py-3 px-4 text-gray-700">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vitals.map((vital) => (
                      <tr key={vital.id || vital.icuNurseVisitVitalsId} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{vital.recordedDateTime || 'N/A'}</td>
                        <td className="py-3 px-4">{vital.heartRate ? `${vital.heartRate} bpm` : 'N/A'}</td>
                        <td className="py-3 px-4">{vital.bloodPressure || 'N/A'}</td>
                        <td className="py-3 px-4">{vital.temperature ? `${vital.temperature}°C` : 'N/A'}</td>
                        <td className="py-3 px-4">{vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : 'N/A'}</td>
                        <td className="py-3 px-4">{vital.respiratoryRate ? `${vital.respiratoryRate} /min` : 'N/A'}</td>
                        <td className="py-3 px-4">{vital.bloodSugar ? `${vital.bloodSugar} mg/dL` : 'N/A'}</td>
                        <td className="py-3 px-4">{vital.recordedBy || 'N/A'}</td>
                        <td className="py-3 px-4">{vital.notes || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Vitals Dialog */}
      <Dialog open={isAddVitalsDialogOpen} onOpenChange={setIsAddVitalsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Vitals</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {vitalsSubmitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {vitalsSubmitError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                <Input
                  id="heartRate"
                  type="number"
                  value={vitalsFormData.heartRate}
                  onChange={(e) => setVitalsFormData({ ...vitalsFormData, heartRate: e.target.value })}
                  placeholder="Enter heart rate"
                />
              </div>
              <div>
                <Label htmlFor="bloodPressure">Blood Pressure</Label>
                <Input
                  id="bloodPressure"
                  value={vitalsFormData.bloodPressure}
                  onChange={(e) => setVitalsFormData({ ...vitalsFormData, bloodPressure: e.target.value })}
                  placeholder="e.g., 120/80"
                />
              </div>
              <div>
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={vitalsFormData.temperature}
                  onChange={(e) => setVitalsFormData({ ...vitalsFormData, temperature: e.target.value })}
                  placeholder="Enter temperature"
                />
              </div>
              <div>
                <Label htmlFor="oxygenSaturation">O₂ Saturation (%)</Label>
                <Input
                  id="oxygenSaturation"
                  type="number"
                  value={vitalsFormData.oxygenSaturation}
                  onChange={(e) => setVitalsFormData({ ...vitalsFormData, oxygenSaturation: e.target.value })}
                  placeholder="Enter O₂ saturation"
                />
              </div>
              <div>
                <Label htmlFor="respiratoryRate">Respiratory Rate (/min)</Label>
                <Input
                  id="respiratoryRate"
                  type="number"
                  value={vitalsFormData.respiratoryRate}
                  onChange={(e) => setVitalsFormData({ ...vitalsFormData, respiratoryRate: e.target.value })}
                  placeholder="Enter respiratory rate"
                />
              </div>
              <div>
                <Label htmlFor="bloodSugar">Blood Sugar (mg/dL)</Label>
                <Input
                  id="bloodSugar"
                  type="number"
                  value={vitalsFormData.bloodSugar}
                  onChange={(e) => setVitalsFormData({ ...vitalsFormData, bloodSugar: e.target.value })}
                  placeholder="Enter blood sugar"
                />
              </div>
              <div>
                <Label htmlFor="recordedDateTime">Recorded Date & Time *</Label>
                <Input
                  id="recordedDateTime"
                  type="datetime-local"
                  value={vitalsFormData.recordedDateTime}
                  onChange={(e) => setVitalsFormData({ ...vitalsFormData, recordedDateTime: e.target.value })}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={vitalsFormData.notes}
                  onChange={(e) => setVitalsFormData({ ...vitalsFormData, notes: e.target.value })}
                  placeholder="Enter notes (optional)"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddVitalsDialogOpen(false)}
              disabled={vitalsSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveVitals}
              disabled={vitalsSubmitting}
            >
              {vitalsSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

