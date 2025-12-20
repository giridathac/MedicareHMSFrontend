// Custom hook for appointment management logic
import { useState, useEffect, useCallback } from 'react';
import { appointmentsApi, CreateAppointmentDto, UpdateAppointmentDto } from '../api';
import { Appointment } from '../types';

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await appointmentsApi.getAll();
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const createAppointment = useCallback(async (data: CreateAppointmentDto) => {
    try {
      setError(null);
      const newAppointment = await appointmentsApi.create(data);
      setAppointments(prev => [...prev, newAppointment]);
      return newAppointment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create appointment';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateAppointment = useCallback(async (data: UpdateAppointmentDto) => {
    try {
      setError(null);
      const updatedAppointment = await appointmentsApi.update(data);
      setAppointments(prev => prev.map(a => a.id === data.id ? updatedAppointment : a));
      return updatedAppointment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update appointment';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteAppointment = useCallback(async (id: number) => {
    try {
      setError(null);
      await appointmentsApi.delete(id);
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete appointment';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getAppointmentsByDate = useCallback((date: string) => {
    return appointments.filter(a => a.date === date);
  }, [appointments]);

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsByDate,
  };
}

