// Custom hook for departments management logic
import { useState, useEffect, useCallback } from 'react';
import { departmentsApi, CreateDepartmentDto, UpdateDepartmentDto } from '../api/departments';
import { Department, DepartmentCategory } from '../types/departments';

export function useDepartments(category?: DepartmentCategory) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always fetch fresh from network - no caching
  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = category 
        ? await departmentsApi.getByCategory(category)
        : await departmentsApi.getAll();
      setDepartments(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch departments';
      setError(errorMessage);
      setDepartments([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [category]);

  // No auto-fetch on mount - component must call fetchDepartments explicitly

  const createDepartment = useCallback(async (data: CreateDepartmentDto) => {
    try {
      setError(null);
      const newDepartment = await departmentsApi.create(data);
      // Don't update local state - always fetch fresh from network
      return newDepartment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create department';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateDepartment = useCallback(async (data: UpdateDepartmentDto) => {
    try {
      setError(null);
      const updatedDepartment = await departmentsApi.update(data);
      // Don't update local state - always fetch fresh from network
      return updatedDepartment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update department';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteDepartment = useCallback(async (id: number) => {
    try {
      setError(null);
      await departmentsApi.delete(id);
      // Don't update local state - always fetch fresh from network
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete department';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    departments,
    loading,
    error,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}

