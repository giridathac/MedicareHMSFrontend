// Custom hook for dashboard data logic
import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../api';
import { emergencyAdmissionsApi } from '../api/emergencyAdmissions';
import { DashboardStats, ChartData, DoctorQueue } from '../types';
import { EmergencyAdmission } from '../types';

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [opdData, setOpdData] = useState<ChartData[]>([]);
  const [admissionData, setAdmissionData] = useState<ChartData[]>([]);
  const [doctorQueue, setDoctorQueue] = useState<DoctorQueue[]>([]);
  const [emergencyAdmissions, setEmergencyAdmissions] = useState<EmergencyAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Only fetch essential dashboard data - defer emergency admissions
      const [statsData, opdDataResult, admissionDataResult, queueData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getOpdData(),
        dashboardApi.getAdmissionData(),
        dashboardApi.getDoctorQueue(),
      ]);
      setStats(statsData);
      setOpdData(opdDataResult);
      setAdmissionData(admissionDataResult);
      setDoctorQueue(queueData);
      // Emergency admissions will be loaded lazily by Dashboard component
      setEmergencyAdmissions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    opdData,
    admissionData,
    doctorQueue,
    emergencyAdmissions,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}

