// Custom hook for OT Slots management logic
import { useState, useEffect, useCallback } from 'react';
import { otSlotsApi, CreateOTSlotDto, UpdateOTSlotDto } from '../api/otSlots';
import { OTSlot } from '../types';

export function useOTSlots(otId?: string) {
  const [otSlots, setOTSlots] = useState<OTSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOTSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = otId 
        ? await otSlotsApi.getByOTId(otId)
        : await otSlotsApi.getAll();
      setOTSlots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch OT slots');
    } finally {
      setLoading(false);
    }
  }, [otId]);

  useEffect(() => {
    fetchOTSlots();
  }, [fetchOTSlots]);

  const createOTSlot = useCallback(async (data: CreateOTSlotDto) => {
    try {
      setError(null);
      const newOTSlot = await otSlotsApi.create(data);
      setOTSlots(prev => [...prev, newOTSlot]);
      return newOTSlot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create OT slot';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateOTSlot = useCallback(async (data: UpdateOTSlotDto) => {
    try {
      setError(null);
      const updatedOTSlot = await otSlotsApi.update(data);
      setOTSlots(prev => prev.map(s => s.id === data.id ? updatedOTSlot : s));
      return updatedOTSlot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update OT slot';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteOTSlot = useCallback(async (id: number) => {
    try {
      setError(null);
      await otSlotsApi.delete(id);
      setOTSlots(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete OT slot';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    otSlots,
    loading,
    error,
    fetchOTSlots,
    createOTSlot,
    updateOTSlot,
    deleteOTSlot,
  };
}

