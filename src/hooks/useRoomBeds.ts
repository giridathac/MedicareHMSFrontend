// Custom hook for room beds management logic
import { useState, useEffect, useCallback } from 'react';
import { roomBedsApi, CreateRoomBedDto, UpdateRoomBedDto } from '../api/roomBeds';
import { RoomBed } from '../types';

export function useRoomBeds() {
  const [roomBeds, setRoomBeds] = useState<RoomBed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always fetch fresh from network - no caching
  const fetchRoomBeds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await roomBedsApi.getAll();
      setRoomBeds(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch room beds';
      setError(errorMessage);
      setRoomBeds([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // No auto-fetch on mount - component must call fetchRoomBeds explicitly

  const createRoomBed = useCallback(async (data: CreateRoomBedDto) => {
    // Don't set global error state for create operations - let caller handle errors
    const newRoomBed = await roomBedsApi.create(data);
    // Don't update local state - always fetch fresh from network
    return newRoomBed;
  }, []);

  const updateRoomBed = useCallback(async (data: UpdateRoomBedDto) => {
    // Don't set global error state for update operations - let caller handle errors
    const updatedRoomBed = await roomBedsApi.update(data);
    // Don't update local state - always fetch fresh from network
    return updatedRoomBed;
  }, []);

  const deleteRoomBed = useCallback(async (roomBedId: number) => {
    // Don't set global error state for delete operations - let caller handle errors
    await roomBedsApi.delete(roomBedId);
    // Don't update local state - always fetch fresh from network
  }, []);

  return {
    roomBeds,
    loading,
    error,
    fetchRoomBeds,
    createRoomBed,
    updateRoomBed,
    deleteRoomBed,
  };
}

