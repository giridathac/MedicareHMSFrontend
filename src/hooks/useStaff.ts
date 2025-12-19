// Custom hook for staff management logic
import { useState, useEffect, useCallback } from 'react';
import { staffApi } from '../api/staff';
import { Staff, CreateUserDto, UpdateUserDto } from '../types/staff';

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always fetch fresh from network - no caching
  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await staffApi.getAll();
      setStaff(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch staff';
      setError(errorMessage);
      setStaff([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // No auto-fetch on mount - component must call fetchStaff explicitly

  const createStaff = useCallback(async (data: CreateUserDto) => {
    try {
      setError(null);
      const newStaff = await staffApi.create(data);
      // Don't update local state - always fetch fresh from network
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
      // Don't update local state - always fetch fresh from network
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
      // Don't update local state - always fetch fresh from network
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

