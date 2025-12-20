// Custom hook for Admissions management logic
import { useState, useEffect, useCallback } from 'react';
import { admissionsApi, CreateAdmissionDto, UpdateAdmissionDto, Admission, RoomCapacityOverview, DashboardMetrics } from '../api/admissions';

export function useAdmissions() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [roomCapacity, setRoomCapacity] = useState<RoomCapacityOverview | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [capacityLoading, setCapacityLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const fetchAdmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await admissionsApi.getAll();
      setAdmissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  const createAdmission = useCallback(async (data: CreateAdmissionDto) => {
    try {
      setError(null);
      const newAdmission = await admissionsApi.create(data);
      setAdmissions(prev => [...prev, newAdmission]);
      return newAdmission;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create admission';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateAdmission = useCallback(async (data: UpdateAdmissionDto) => {
    try {
      setError(null);
      const updatedAdmission = await admissionsApi.update(data);
      // Match by roomAdmissionId
      setAdmissions(prev => prev.map(a => {
        return (a.roomAdmissionId === data.roomAdmissionId) ? updatedAdmission : a;
      }));
      return updatedAdmission;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update admission';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteAdmission = useCallback(async (admissionId: number) => {
    try {
      setError(null);
      await admissionsApi.delete(admissionId);
      setAdmissions(prev => prev.filter(a => a.admissionId !== admissionId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete admission';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const fetchRoomCapacityOverview = useCallback(async () => {
    try {
      setCapacityLoading(true);
      setCapacityError(null);
      const data = await admissionsApi.getRoomCapacityOverview();
      setRoomCapacity(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch room capacity overview';
      setCapacityError(errorMessage);
      throw err;
    } finally {
      setCapacityLoading(false);
    }
  }, []);

  const fetchDashboardMetrics = useCallback(async () => {
    try {
      setMetricsLoading(true);
      setMetricsError(null);
      const data = await admissionsApi.getDashboardMetrics();
      setDashboardMetrics(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard metrics';
      setMetricsError(errorMessage);
      throw err;
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  return {
    admissions,
    roomCapacity,
    dashboardMetrics,
    loading,
    capacityLoading,
    metricsLoading,
    error,
    capacityError,
    metricsError,
    fetchAdmissions,
    fetchRoomCapacityOverview,
    fetchDashboardMetrics,
    createAdmission,
    updateAdmission,
    deleteAdmission,
  };
}
