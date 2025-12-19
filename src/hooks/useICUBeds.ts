// Custom hook for ICU beds management logic
import { useState, useEffect, useCallback } from 'react';
import { icuBedsApi, CreateICUBedDto, UpdateICUBedDto } from '../api/icuBeds';
import { ICUBed } from '../types';

export function useICUBeds() {
  const [icuBeds, setIcuBeds] = useState<ICUBed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always fetch fresh from network - no caching
  const fetchICUBeds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await icuBedsApi.getAll();
      setIcuBeds(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ICU beds';
      setError(errorMessage);
      setIcuBeds([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // No auto-fetch on mount - component must call fetchICUBeds explicitly

  const createICUBed = useCallback(async (data: CreateICUBedDto) => {
    try {
      setError(null);
      const newICUBed = await icuBedsApi.create(data);
      // Don't update local state - always fetch fresh from network
      return newICUBed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create ICU bed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateICUBed = useCallback(async (data: UpdateICUBedDto) => {
    try {
      setError(null);
      const updatedICUBed = await icuBedsApi.update(data);
      // Don't update local state - always fetch fresh from network
      return updatedICUBed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update ICU bed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteICUBed = useCallback(async (icuBedId: number) => {
    try {
      setError(null);
      await icuBedsApi.delete(icuBedId);
      // Don't update local state - always fetch fresh from network
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete ICU bed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    icuBeds,
    loading,
    error,
    fetchICUBeds,
    createICUBed,
    updateICUBed,
    deleteICUBed,
  };
}

