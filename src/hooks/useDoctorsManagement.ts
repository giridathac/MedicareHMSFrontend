// Custom hook for doctors management logic
import { useState, useEffect, useCallback } from 'react';
import { doctorsApi, CreateDoctorDto, UpdateDoctorDto, CreateAttendanceDto, AttendanceRecord } from '../api/doctors';
import { Doctor } from '../types';

export function useDoctorsManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await doctorsApi.getAll();
      setDoctors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAttendance = useCallback(async (doctorId?: number, date?: string) => {
    try {
      setError(null);
      const data = await doctorsApi.getAttendance(doctorId, date);
      setAttendance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance');
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
    fetchAttendance(undefined, new Date().toISOString().split('T')[0]);
  }, [fetchDoctors, fetchAttendance]);

  const createDoctor = useCallback(async (data: CreateDoctorDto) => {
    try {
      setError(null);
      const newDoctor = await doctorsApi.create(data);
      setDoctors(prev => [...prev, newDoctor]);
      return newDoctor;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create doctor';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateDoctor = useCallback(async (data: UpdateDoctorDto) => {
    try {
      setError(null);
      const updatedDoctor = await doctorsApi.update(data);
      setDoctors(prev => prev.map(d => d.id === data.id ? updatedDoctor : d));
      return updatedDoctor;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update doctor';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteDoctor = useCallback(async (id: number) => {
    try {
      setError(null);
      await doctorsApi.delete(id);
      setDoctors(prev => prev.filter(d => d.id !== id));
      setAttendance(prev => prev.filter(a => a.doctorId !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete doctor';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const createAttendanceRecord = useCallback(async (data: CreateAttendanceDto) => {
    try {
      setError(null);
      const newRecord = await doctorsApi.createAttendance(data);
      setAttendance(prev => [...prev, newRecord]);
      return newRecord;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create attendance record';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateAttendanceRecord = useCallback(async (id: number, data: Partial<CreateAttendanceDto>) => {
    try {
      setError(null);
      const updatedRecord = await doctorsApi.updateAttendance(id, data);
      setAttendance(prev => prev.map(a => a.id === id ? updatedRecord : a));
      return updatedRecord;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update attendance record';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    doctors,
    attendance,
    loading,
    error,
    fetchDoctors,
    fetchAttendance,
    createDoctor,
    updateDoctor,
    deleteDoctor,
    createAttendanceRecord,
    updateAttendanceRecord,
  };
}

