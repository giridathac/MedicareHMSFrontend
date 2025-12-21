// Custom hook for ICU beds management logic
import { useState, useEffect, useCallback } from 'react';
import { icuBedsApi, CreateICUBedDto, UpdateICUBedDto } from '../api/icuBeds';
import { ICUBed } from '../types';

export function useICUBeds() {
  const [icuBeds, setIcuBeds] = useState<ICUBed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchICUBeds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await icuBedsApi.getAll();
      setIcuBeds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ICU beds');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchICUBeds();
  }, [fetchICUBeds]);

  const createICUBed = useCallback(async (data: CreateICUBedDto) => {
    try {
      setError(null);
      const newICUBed = await icuBedsApi.create(data);
      setIcuBeds(prev => [...prev, newICUBed]);
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
      setIcuBeds(prev => prev.map(b => b.icuId === data.icuId ? updatedICUBed : b));
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
      setIcuBeds(prev => prev.filter(b => b.icuBedId !== icuBedId));
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

