// Custom hook for paginated patients management
import { useState, useEffect, useCallback, useRef } from 'react';
import { patientsApi, PaginatedResponse } from '../api/patients';
import { Patient } from '../types';

export function usePatientsPaginated(initialLimit: number = 10) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  // Store all fetched data for client-side pagination when backend doesn't support it
  const allPatientsRef = useRef<Patient[]>([]);

  const fetchPatients = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        allPatientsRef.current = []; // Clear stored data on reset
      } else {
        setLoadingMore(true);
      }
      setError(null);
      console.log('fetchPatients called', { pageNum, initialLimit, reset, storedDataLength: allPatientsRef.current.length });
      
      // Check if we already have all data stored (backend doesn't support pagination)
      // If we have stored data and are loading more, use client-side pagination without API call
      if (!reset && allPatientsRef.current.length > 0 && pageNum > 1) {
        // Use functional update to get current patients length
        setPatients(prev => {
          const currentDisplayed = prev.length;
          const totalStored = allPatientsRef.current.length;
          
          // If we have stored data, use client-side pagination (no API call needed)
          if (totalStored > currentDisplayed) {
            const startIndex = currentDisplayed;
            const endIndex = Math.min(startIndex + initialLimit, totalStored);
            const paginatedData = allPatientsRef.current.slice(startIndex, endIndex);
            setHasMore(endIndex < totalStored);
            setTotal(totalStored);
            setPage(pageNum);
            console.log('Client-side pagination - loading more from stored data (no API call)', { 
              startIndex, 
              endIndex, 
              total: totalStored,
              showing: endIndex 
            });
            return [...prev, ...paginatedData];
          }
          return prev;
        });
        
        // If we updated patients above, return early
        if (allPatientsRef.current.length > 0) {
          setLoading(false);
          setLoadingMore(false);
          return;
        }
      }
      
      // Fetch from API (first load or backend supports pagination)
      const response: PaginatedResponse<Patient> = await patientsApi.getAll(pageNum, initialLimit);
      console.log('fetchPatients response', { 
        dataLength: response.data.length, 
        page: response.page, 
        hasMore: response.hasMore, 
        total: response.total 
      });
      
      // Detect if backend supports pagination:
      // If we got all data (data.length === total) on first page, backend doesn't support pagination
      const isBackendPaginated = (pageNum === 1 && response.data.length < response.total) || 
                                  (response.data.length === initialLimit && response.hasMore && response.total > initialLimit);
      
      if (reset || allPatientsRef.current.length === 0) {
        // First load or reset
        if (!isBackendPaginated && response.data.length === response.total && pageNum === 1) {
          // Backend doesn't support pagination - we got all data, store it
          allPatientsRef.current = response.data;
          // Apply client-side pagination for first page
          const startIndex = 0;
          const endIndex = initialLimit;
          setPatients(response.data.slice(startIndex, endIndex));
          setHasMore(response.data.length > initialLimit);
          setTotal(response.data.length);
          console.log('Backend does not support pagination - stored all data, showing first page', { 
            total: response.data.length, 
            showing: Math.min(initialLimit, response.data.length) 
          });
        } else {
          // Backend supports pagination
          setPatients(response.data);
          setHasMore(response.hasMore);
          setTotal(response.total);
          console.log('Backend supports pagination - showing page', { 
            page: pageNum,
            total: response.total, 
            showing: response.data.length 
          });
        }
      } else {
        // Loading more pages - backend supports pagination
        if (response.data.length > 0) {
          setPatients(prev => {
            const existingIds = new Set(prev.map(p => p.PatientId || p.patientId || p.id));
            const newPatients = response.data.filter(p => {
              const id = p.PatientId || p.patientId || p.id;
              return !existingIds.has(id);
            });
            const updated = [...prev, ...newPatients];
            console.log('Updated patients count:', updated.length, { newCount: newPatients.length });
            return updated;
          });
        }
        setHasMore(response.hasMore);
        setTotal(response.total);
      }
      
      setPage(pageNum);
    } catch (err) {
      console.error('fetchPatients error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch patients';
      setError(errorMessage);
      setPatients([]);
      setHasMore(false);
      setTotal(0);
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
    await fetchPatients(page + 1, false);
  }, [hasMore, loadingMore, page, total, fetchPatients]);

  useEffect(() => {
    fetchPatients(1, true);
  }, [fetchPatients]);

  return {
    patients,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    loadMore,
    refresh: () => fetchPatients(1, true),
  };
}
