// Custom hook for Emergency beds management logic
import { useState, useEffect, useCallback } from 'react';
import { emergencyBedsApi, CreateEmergencyBedDto, UpdateEmergencyBedDto } from '../api/emergencyBeds';
import { EmergencyBed } from '../types';

export function useEmergencyBeds() {
  const [emergencyBeds, setEmergencyBeds] = useState<EmergencyBed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always fetch fresh from network - no caching
  const fetchEmergencyBeds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await emergencyBedsApi.getAll();
      setEmergencyBeds(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Emergency beds';
      setError(errorMessage);
      setEmergencyBeds([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // No auto-fetch on mount - component must call fetchEmergencyBeds explicitly

  const createEmergencyBed = useCallback(async (data: CreateEmergencyBedDto) => {
    try {
      setError(null);
      const newEmergencyBed = await emergencyBedsApi.create(data);
      // Don't update local state - always fetch fresh from network
      return newEmergencyBed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create Emergency bed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateEmergencyBed = useCallback(async (data: UpdateEmergencyBedDto) => {
    try {
      setError(null);
      const updatedEmergencyBed = await emergencyBedsApi.update(data);
      // Don't update local state - always fetch fresh from network
      return updatedEmergencyBed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update Emergency bed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteEmergencyBed = useCallback(async (emergencyBedId: number) => {
    try {
      setError(null);
      await emergencyBedsApi.delete(emergencyBedId);
      // Don't update local state - always fetch fresh from network
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete Emergency bed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    emergencyBeds,
    loading,
    error,
    fetchEmergencyBeds,
    createEmergencyBed,
    updateEmergencyBed,
    deleteEmergencyBed,
  };
}
