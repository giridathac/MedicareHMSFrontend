// Custom hook for patient management logic
import { useState, useEffect, useCallback } from 'react';
import { patientsApi } from '../api';
import { Patient } from '../types';

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all patients by using a large limit (or fetch page by page)
      // For backward compatibility, we'll fetch the first page with a large limit
      const response = await patientsApi.getAll(1, 1000);
      // Handle both old array response and new paginated response
      const data = Array.isArray(response) ? response : response.data;
      setPatients(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch patients';
      setError(errorMessage);
      console.error('Error fetching patients:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const createPatient = useCallback(async (data: any) => {
    try {
      setError(null);
      const newPatient = await patientsApi.create(data);
      setPatients(prev => [...prev, newPatient]);
      return newPatient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create patient';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updatePatient = useCallback(async (data: any) => {
    try {
      setError(null);
      const updatedPatient = await patientsApi.update(data);
      setPatients(prev => prev.map(p => {
        const patientId = p.patientId || p.PatientId;
        const updatePatientId = data.PatientId || data.patientId;
        return patientId === updatePatientId ? updatedPatient : p;
      }));
      return updatedPatient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update patient';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deletePatient = useCallback(async (id: number) => {
    try {
      setError(null);
      await patientsApi.delete(id);
      setPatients(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete patient';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    patients,
    loading,
    error,
    fetchPatients,
    createPatient,
    updatePatient,
    deletePatient,
  };
}

