// Custom hook for staff management logic
import { useState, useEffect, useCallback } from 'react';
import { staffApi } from '../api/staff';
import { Staff, CreateUserDto, UpdateUserDto } from '../types/staff';

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await staffApi.getAll();
      setStaff(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const createStaff = useCallback(async (data: CreateUserDto) => {
    try {
      setError(null);
      const newStaff = await staffApi.create(data);
      setStaff(prev => [...prev, newStaff]);
      return newStaff;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create staff';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateStaff = useCallback(async (data: UpdateUserDto) => {
    try {
      setError(null);
      const updatedStaff = await staffApi.update(data);
      setStaff(prev => prev.map(s => s.UserId === data.UserId ? updatedStaff : s));
      return updatedStaff;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update staff';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteStaff = useCallback(async (id: number) => {
    try {
      setError(null);
      await staffApi.delete(id);
      setStaff(prev => prev.filter(s => s.UserId !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete staff';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    staff,
    loading,
    error,
    fetchStaff,
    createStaff,
    updateStaff,
    deleteStaff,
  };
}

