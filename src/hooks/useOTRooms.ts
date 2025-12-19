// Custom hook for OT rooms management logic
import { useState, useEffect, useCallback } from 'react';
import { otRoomsApi, CreateOTRoomDto, UpdateOTRoomDto } from '../api/otRooms';
import { OTRoom } from '../types';

export function useOTRooms(initialLimit: number = 10) {
  const [otRooms, setOTRooms] = useState<OTRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchOTRooms = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      console.log('fetchOTRooms called', { pageNum, initialLimit, reset });
      const response = await otRoomsApi.getAll(pageNum, initialLimit);
      console.log('fetchOTRooms response', { 
        dataLength: response.data.length, 
        page: response.page, 
        hasMore: response.hasMore, 
        total: response.total 
      });
      
      if (reset) {
        setOTRooms(response.data);
      } else {
        setOTRooms(prev => {
          const newRooms = [...prev, ...response.data];
          console.log('Updated rooms count:', newRooms.length);
          return newRooms;
        });
      }
      
      setPage(response.page);
      setHasMore(response.hasMore);
      setTotal(response.total);
    } catch (err) {
      console.error('fetchOTRooms error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch OT rooms');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [initialLimit]);

  const loadMore = useCallback(async () => {
    console.log('loadMore called', { hasMore, loadingMore, page, total });
    if (!hasMore || loadingMore) {
      console.log('loadMore aborted', { hasMore, loadingMore });
      return;
    }
    console.log('Fetching next page:', page + 1);
    await fetchOTRooms(page + 1, false);
  }, [page, hasMore, loadingMore, fetchOTRooms, total]);

  useEffect(() => {
    fetchOTRooms(1, true);
  }, [fetchOTRooms]);

  const createOTRoom = useCallback(async (data: CreateOTRoomDto) => {
    try {
      setError(null);
      const newOTRoom = await otRoomsApi.create(data);
      setOTRooms(prev => [...prev, newOTRoom]);
      setTotal(prev => prev + 1);
      // Update hasMore if we're on the last page and it was full
      if (!hasMore && otRooms.length % initialLimit === 0) {
        setHasMore(true);
      }
      return newOTRoom;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create OT room';
      setError(errorMessage);
      throw err;
    }
  }, [hasMore, otRooms.length, initialLimit]);

  const updateOTRoom = useCallback(async (data: UpdateOTRoomDto) => {
    try {
      setError(null);
      const updatedOTRoom = await otRoomsApi.update(data);
      setOTRooms(prev => prev.map(r => r.id === data.id ? updatedOTRoom : r));
      return updatedOTRoom;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update OT room';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteOTRoom = useCallback(async (id: number) => {
    try {
      setError(null);
      await otRoomsApi.delete(id);
      setOTRooms(prev => prev.filter(r => r.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete OT room';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    otRooms,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    page,
    fetchOTRooms,
    loadMore,
    createOTRoom,
    updateOTRoom,
    deleteOTRoom,
  };
}

