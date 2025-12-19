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
    try {
      setError(null);
      const newRoomBed = await roomBedsApi.create(data);
      // Don't update local state - always fetch fresh from network
      return newRoomBed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create room bed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateRoomBed = useCallback(async (data: UpdateRoomBedDto) => {
    try {
      setError(null);
      const updatedRoomBed = await roomBedsApi.update(data);
      // Don't update local state - always fetch fresh from network
      return updatedRoomBed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update room bed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteRoomBed = useCallback(async (roomBedId: number) => {
    try {
      setError(null);
      await roomBedsApi.delete(roomBedId);
      // Don't update local state - always fetch fresh from network
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete room bed';
      setError(errorMessage);
      throw err;
    }
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

