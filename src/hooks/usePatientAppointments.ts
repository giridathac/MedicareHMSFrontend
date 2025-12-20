// Custom hook for patient appointment management logic
import { useState, useEffect, useCallback } from 'react';
import { patientAppointmentsApi, CreatePatientAppointmentDto, UpdatePatientAppointmentDto } from '../api/patientAppointments';
import { PatientAppointment } from '../types';

export function usePatientAppointments() {
  const [patientAppointments, setPatientAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatientAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientAppointmentsApi.getAll();
      setPatientAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatientAppointments();
  }, [fetchPatientAppointments]);

  const createPatientAppointment = useCallback(async (data: CreatePatientAppointmentDto, doctorName: string) => {
    try {
      setError(null);
      const newAppointment = await patientAppointmentsApi.create(data, doctorName);
      setPatientAppointments(prev => [...prev, newAppointment]);
      return newAppointment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create patient appointment';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updatePatientAppointment = useCallback(async (data: UpdatePatientAppointmentDto) => {
    try {
      setError(null);
      const updatedAppointment = await patientAppointmentsApi.update(data);
      setPatientAppointments(prev => prev.map(a => a.id === data.id ? updatedAppointment : a));
      return updatedAppointment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update patient appointment';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deletePatientAppointment = useCallback(async (id: number) => {
    try {
      setError(null);
      await patientAppointmentsApi.delete(id);
      setPatientAppointments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete patient appointment';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getByPatientId = useCallback(async (patientId: string) => {
    try {
      setError(null);
      return await patientAppointmentsApi.getByPatientId(patientId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch patient appointments';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getByDoctorId = useCallback(async (doctorId: string) => {
    try {
      setError(null);
      return await patientAppointmentsApi.getByDoctorId(doctorId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch patient appointments';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    patientAppointments,
    loading,
    error,
    fetchPatientAppointments,
    createPatientAppointment,
    updatePatientAppointment,
    deletePatientAppointment,
    getByPatientId,
    getByDoctorId,
  };
}

