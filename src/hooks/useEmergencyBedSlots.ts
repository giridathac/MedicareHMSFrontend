// Custom hook for Emergency Bed Slots management logic
import { useState, useEffect, useCallback } from 'react';
import { emergencyBedSlotsApi, CreateEmergencyBedSlotDto, UpdateEmergencyBedSlotDto } from '../api/emergencyBedSlots';
import { EmergencyBedSlot } from '../types';

export function useEmergencyBedSlots(emergencyBedId?: number) {
  const [emergencyBedSlots, setEmergencyBedSlots] = useState<EmergencyBedSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always fetch fresh from network - no caching
  const fetchEmergencyBedSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = emergencyBedId !== undefined
        ? await emergencyBedSlotsApi.getByEmergencyBedId(emergencyBedId)
        : await emergencyBedSlotsApi.getAll();
      setEmergencyBedSlots(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch emergency bed slots';
      setError(errorMessage);
      setEmergencyBedSlots([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [emergencyBedId]);

  // No auto-fetch on mount - component must call fetchEmergencyBedSlots explicitly

  const createEmergencyBedSlot = useCallback(async (data: CreateEmergencyBedSlotDto) => {
    try {
      setError(null);
      const newSlot = await emergencyBedSlotsApi.create(data);
      // Don't update local state - always fetch fresh from network
      return newSlot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create emergency bed slot';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateEmergencyBedSlot = useCallback(async (data: UpdateEmergencyBedSlotDto) => {
    try {
      setError(null);
      const updatedSlot = await emergencyBedSlotsApi.update(data);
      // Don't update local state - always fetch fresh from network
      return updatedSlot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update emergency bed slot';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteEmergencyBedSlot = useCallback(async (id: number) => {
    try {
      setError(null);
      await emergencyBedSlotsApi.delete(id);
      // Don't update local state - always fetch fresh from network
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete emergency bed slot';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    emergencyBedSlots,
    loading,
    error,
    fetchEmergencyBedSlots,
    createEmergencyBedSlot,
    updateEmergencyBedSlot,
    deleteEmergencyBedSlot,
  };
}
