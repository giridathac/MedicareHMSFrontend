// Custom hook for departments management logic
import { useState, useEffect, useCallback } from 'react';
import { departmentsApi, CreateDepartmentDto, UpdateDepartmentDto } from '../api/departments';
import { Department, DepartmentCategory } from '../types/departments';

export function useDepartments(category?: DepartmentCategory) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = category 
        ? await departmentsApi.getByCategory(category)
        : await departmentsApi.getAll();
      setDepartments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const createDepartment = useCallback(async (data: CreateDepartmentDto) => {
    try {
      setError(null);
      const newDepartment = await departmentsApi.create(data);
      setDepartments(prev => [...prev, newDepartment]);
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
      setDepartments(prev => prev.map(d => d.id === data.id ? updatedDepartment : d));
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
      setDepartments(prev => prev.filter(d => d.id !== id));
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

