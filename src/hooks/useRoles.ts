// Custom hook for role management logic
import { useState, useEffect, useCallback } from 'react';
import { rolesApi, CreateRoleDto, UpdateRoleDto } from '../api/roles';
import { Role } from '../types/roles';

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rolesApi.getAll();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const createRole = useCallback(async (data: CreateRoleDto) => {
    try {
      setError(null);
      const newRole = await rolesApi.create(data);
      // Refresh the roles list after creation
      await fetchRoles();
      return newRole;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role';
      setError(errorMessage);
      throw err;
    }
  }, [fetchRoles]);

  const updateRole = useCallback(async (data: UpdateRoleDto) => {
    try {
      setError(null);
      const updatedRole = await rolesApi.update(data);
      setRoles(prev => prev.map(r => r.id === data.id ? updatedRole : r));
      return updatedRole;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteRole = useCallback(async (id: string) => {
    try {
      setError(null);
      await rolesApi.delete(id);
      setRoles(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    roles,
    loading,
    error,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
  };
}

