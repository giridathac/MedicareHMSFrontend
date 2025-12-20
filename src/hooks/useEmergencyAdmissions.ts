// Custom hook for emergency admissions management logic
import { useState, useEffect, useCallback } from 'react';
import { emergencyAdmissionsApi, CreateEmergencyAdmissionDto, UpdateEmergencyAdmissionDto } from '../api/emergencyAdmissions';
import { EmergencyAdmission } from '../types';

export function useEmergencyAdmissions() {
  const [emergencyAdmissions, setEmergencyAdmissions] = useState<EmergencyAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmergencyAdmissions = useCallback(async (status?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await emergencyAdmissionsApi.getAll(status);
      setEmergencyAdmissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch emergency admissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmergencyAdmissions();
  }, [fetchEmergencyAdmissions]);

  const createEmergencyAdmission = useCallback(async (data: CreateEmergencyAdmissionDto) => {
    try {
      setError(null);
      const newAdmission = await emergencyAdmissionsApi.create(data);
      setEmergencyAdmissions(prev => [...prev, newAdmission]);
      return newAdmission;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create emergency admission';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateEmergencyAdmission = useCallback(async (data: UpdateEmergencyAdmissionDto) => {
    try {
      setError(null);
      const updatedAdmission = await emergencyAdmissionsApi.update(data);
      setEmergencyAdmissions(prev => prev.map(a => a.emergencyAdmissionId === data.id ? updatedAdmission : a));
      return updatedAdmission;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update emergency admission';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteEmergencyAdmission = useCallback(async (id: number) => {
    try {
      setError(null);
      await emergencyAdmissionsApi.delete(id);
      setEmergencyAdmissions(prev => prev.filter(a => a.emergencyAdmissionId !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete emergency admission';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    emergencyAdmissions,
    loading,
    error,
    fetchEmergencyAdmissions,
    createEmergencyAdmission,
    updateEmergencyAdmission,
    deleteEmergencyAdmission,
  };
}
