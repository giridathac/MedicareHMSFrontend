// Custom hook for lab tests management logic
import { useState, useEffect, useCallback } from 'react';
import { labTestsApi, CreateLabTestDto, UpdateLabTestDto } from '../api/labTests';
import { LabTest } from '../types';

export function useLabTests() {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLabTests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await labTestsApi.getAll();
      setLabTests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lab tests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabTests();
  }, [fetchLabTests]);

  const createLabTest = useCallback(async (data: CreateLabTestDto) => {
    try {
      setError(null);
      const newLabTest = await labTestsApi.create(data);
      setLabTests(prev => [...prev, newLabTest]);
      return newLabTest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create lab test';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateLabTest = useCallback(async (data: UpdateLabTestDto) => {
    try {
      setError(null);
      const updatedLabTest = await labTestsApi.update(data);
      setLabTests(prev => prev.map(t => t.labTestId === data.labTestId ? updatedLabTest : t));
      return updatedLabTest;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update lab test';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteLabTest = useCallback(async (labTestId: number) => {
    try {
      setError(null);
      await labTestsApi.delete(labTestId);
      setLabTests(prev => prev.filter(t => t.labTestId !== labTestId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete lab test';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    labTests,
    loading,
    error,
    fetchLabTests,
    createLabTest,
    updateLabTest,
    deleteLabTest,
  };
}
