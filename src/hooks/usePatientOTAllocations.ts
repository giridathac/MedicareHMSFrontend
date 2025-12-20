// Custom hook for Patient OT Allocations management logic
import { useState, useEffect, useCallback } from 'react';
import { patientOTAllocationsApi, CreatePatientOTAllocationDto, UpdatePatientOTAllocationDto } from '../api/patientOTAllocations';
import { PatientOTAllocation } from '../types';

export function usePatientOTAllocations() {
  const [patientOTAllocations, setPatientOTAllocations] = useState<PatientOTAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatientOTAllocations = useCallback(async (status?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientOTAllocationsApi.getAll(status);
      setPatientOTAllocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient OT allocations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatientOTAllocations();
  }, [fetchPatientOTAllocations]);

  const createPatientOTAllocation = useCallback(async (data: CreatePatientOTAllocationDto) => {
    try {
      setError(null);
      const newAllocation = await patientOTAllocationsApi.create(data);
      setPatientOTAllocations(prev => [...prev, newAllocation]);
      return newAllocation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create patient OT allocation';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updatePatientOTAllocation = useCallback(async (data: UpdatePatientOTAllocationDto) => {
    try {
      setError(null);
      const updatedAllocation = await patientOTAllocationsApi.update(data);
      setPatientOTAllocations(prev => prev.map(a => a.id === data.id ? updatedAllocation : a));
      return updatedAllocation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update patient OT allocation';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deletePatientOTAllocation = useCallback(async (id: number) => {
    try {
      setError(null);
      await patientOTAllocationsApi.delete(id);
      setPatientOTAllocations(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete patient OT allocation';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    patientOTAllocations,
    loading,
    error,
    fetchPatientOTAllocations,
    createPatientOTAllocation,
    updatePatientOTAllocation,
    deletePatientOTAllocation,
  };
}
