// Custom hook for role management logic
import { useState, useEffect, useCallback } from 'react';
import { rolesApi, CreateRoleDto, UpdateRoleDto } from '../api/roles';
import { Role } from '../types/roles';

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always fetch fresh from network - no caching
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rolesApi.getAll();
      setRoles(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roles';
      setError(errorMessage);
      setRoles([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // No auto-fetch on mount - component must call fetchRoles explicitly

  const createRole = useCallback(async (data: CreateRoleDto) => {
    try {
      setError(null);
      const newRole = await rolesApi.create(data);
      // Don't update local state - always fetch fresh from network
      return newRole;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateRole = useCallback(async (data: UpdateRoleDto) => {
    try {
      setError(null);
      const updatedRole = await rolesApi.update(data);
      // Don't update local state - always fetch fresh from network
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
      // Don't update local state - always fetch fresh from network
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

