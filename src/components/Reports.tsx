import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, Download, FileText, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiRequest } from '../api/base';

interface DoctorStatistics {
  doctor: string;
  specialty?: string;
  opd: number;
  ipd: number;
  total: number;
}

const weeklyOPD = [
  { date: 'Nov 08', patients: 98, admissions: 8 },
  { date: 'Nov 09', patients: 102, admissions: 6 },
  { date: 'Nov 10', patients: 95, admissions: 10 },
  { date: 'Nov 11', patients: 124, admissions: 12 },
  { date: 'Nov 12', patients: 108, admissions: 9 },
  { date: 'Nov 13', patients: 87, admissions: 7 },
  { date: 'Nov 14', patients: 115, admissions: 11 },
];

const dailyAdmissions = [
  { department: 'Cardiology', count: 3 },
  { department: 'Orthopedics', count: 5 },
  { department: 'Neurology', count: 2 },
  { department: 'General Medicine', count: 1 },
  { department: 'Gynecology', count: 4 },
];

const defaultOtSchedule = [
  { date: 'Nov 11', surgeries: 6, completed: 6 },
  { date: 'Nov 12', surgeries: 5, completed: 5 },
  { date: 'Nov 13', surgeries: 7, completed: 7 },
  { date: 'Nov 14', surgeries: 8, completed: 3 },
];

const icuOccupancy = [
  { date: 'Nov 08', occupied: 10, total: 15 },
  { date: 'Nov 09', occupied: 11, total: 15 },
  { date: 'Nov 10', occupied: 9, total: 15 },
  { date: 'Nov 11', occupied: 12, total: 15 },
  { date: 'Nov 12', occupied: 12, total: 15 },
  { date: 'Nov 13', occupied: 11, total: 15 },
  { date: 'Nov 14', occupied: 12, total: 15 },
];

interface IPDStatistics {
  totalAdmissions: number;
  regularWard: number;
  specialShared: number;
  specialRoom: number;
  avgStayDuration: number;
  dischargedToday: number;
  criticalPatients: number;
}

interface IPDSummary {
  dischargedToday: number;
  criticalPatients: number;
  bedOccupancy: number; // Percentage
}

interface OTStatistics {
  totalSurgeries: number;
  completed: number;
  emergency: number;
  avgDuration: string;
}

interface OTScheduleEntry {
  date: string;
  surgeries: number;
  completed: number;
}

interface ICUStatistics {
  totalPatients: number;
  critical: number;
  onVentilator: number;
  avgStayDuration: number;
}

interface ICUOccupancyEntry {
  date: string;
  occupied: number;
  total: number;
}

const defaultIpdStats: IPDStatistics = {
  totalAdmissions: 0,
  regularWard: 0,
  specialShared: 0,
  specialRoom: 0,
  avgStayDuration: 0,
  dischargedToday: 0,
  criticalPatients: 0,
};

const defaultOtStats: OTStatistics = {
  totalSurgeries: 0,
  completed: 0,
  emergency: 0,
  avgDuration: 'N/A',
};

const defaultIcuStats: ICUStatistics = {
  totalPatients: 0,
  critical: 0,
  onVentilator: 0,
  avgStayDuration: 0,
};

const defaultIcuOccupancy: ICUOccupancyEntry[] = [];

export function Reports() {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [doctorStatistics, setDoctorStatistics] = useState<DoctorStatistics[]>([]);
  const [loadingDoctorStats, setLoadingDoctorStats] = useState(false);
  const [doctorStatsError, setDoctorStatsError] = useState<string | null>(null);
  const [ipdStats, setIpdStats] = useState<IPDStatistics>(defaultIpdStats);
  const [loadingIpdStats, setLoadingIpdStats] = useState(false);
  const [ipdStatsError, setIpdStatsError] = useState<string | null>(null);
  const [ipdSummary, setIpdSummary] = useState<IPDSummary>({
    dischargedToday: 0,
    criticalPatients: 0,
    bedOccupancy: 0,
  });
  const [loadingIpdSummary, setLoadingIpdSummary] = useState(false);
  const [ipdSummaryError, setIpdSummaryError] = useState<string | null>(null);
  const [otStats, setOtStats] = useState<OTStatistics>(defaultOtStats);
  const [loadingOtStats, setLoadingOtStats] = useState(false);
  const [otStatsError, setOtStatsError] = useState<string | null>(null);
  const [otSchedule, setOtSchedule] = useState<OTScheduleEntry[]>(defaultOtSchedule);
  const [icuStats, setIcuStats] = useState<ICUStatistics>(defaultIcuStats);
  const [loadingIcuStats, setLoadingIcuStats] = useState(false);
  const [icuStatsError, setIcuStatsError] = useState<string | null>(null);
  const [icuOccupancy, setIcuOccupancy] = useState<ICUOccupancyEntry[]>(defaultIcuOccupancy);

  // Calculate week start and end dates for weekly reports
  const getWeekDates = (date: string) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0]
    };
  };

  // Fetch doctor-wise patient statistics
  useEffect(() => {
    const fetchDoctorStatistics = async () => {
      try {
        setLoadingDoctorStats(true);
        setDoctorStatsError(null);

        let apiUrl = '/reports/doctor-wise-patient-statistics';
        const params = new URLSearchParams();

        if (reportType === 'daily') {
          params.append('date', selectedDate);
        } else {
          const weekDates = getWeekDates(selectedDate);
          params.append('startDate', weekDates.startDate);
          params.append('endDate', weekDates.endDate);
        }

        if (params.toString()) {
          apiUrl += `?${params.toString()}`;
        }

        console.log('Fetching doctor statistics from:', apiUrl);
        const response = await apiRequest<any>(apiUrl, {
          method: 'GET',
        });

        console.log('Doctor statistics API response:', JSON.stringify(response, null, 2));

        // Handle different response structures
        let statsData: any[] = [];
        
        if (Array.isArray(response)) {
          statsData = response;
        } else if (response?.data) {
          if (Array.isArray(response.data)) {
            statsData = response.data;
          } else if (response.data.doctorStatistics && Array.isArray(response.data.doctorStatistics)) {
            statsData = response.data.doctorStatistics;
          } else if (response.data.statistics && Array.isArray(response.data.statistics)) {
            statsData = response.data.statistics;
          }
        } else if (response?.doctorStatistics && Array.isArray(response.doctorStatistics)) {
          statsData = response.doctorStatistics;
        } else if (response?.statistics && Array.isArray(response.statistics)) {
          statsData = response.statistics;
        }

        // Map API response to DoctorStatistics interface
        const mappedStats: DoctorStatistics[] = statsData.map((item: any) => {
          // Helper function to extract field with multiple variations
          const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
            for (const field of fieldVariations) {
              const value = data?.[field];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
            }
            return defaultValue;
          };

          const doctor = extractField(item, [
            'doctor', 'Doctor', 'doctorName', 'DoctorName', 'name', 'Name',
            'doctor_name', 'Doctor_Name', 'doctorName', 'DoctorName'
          ], 'Unknown Doctor');

          const specialty = extractField(item, [
            'specialty', 'Specialty', 'specialization', 'Specialization',
            'speciality', 'Speciality', 'specialtyName', 'SpecialtyName'
          ], '');

          const opd = Number(extractField(item, [
            'opd', 'OPD', 'opdPatients', 'opdPatientCount', 'OPDPatients', 'opdCount', 'OPDCount',
            'opd_patients', 'OPD_Patients', 'opd_count', 'OPD_Count'
          ], 0)) || 0;

          const ipd = Number(extractField(item, [
            'ipd', 'IPD', 'ipdPatients', 'IPDPatients','ipdPatientCount', 'ipdCount', 'IPDCount',
            'ipd_patients', 'IPD_Patients', 'ipd_count', 'IPD_Count'
          ], 0)) || 0;

          const total = Number(extractField(item, [
            'total', 'Total', 'totalPatients', 'totalPatientCount','TotalPatients', 'totalCount', 'TotalCount',
            'total_patients', 'Total_Patients', 'total_count', 'Total_Count'
          ], opd + ipd)) || (opd + ipd);

          return {
            doctor,
            specialty,
            opd,
            ipd,
            total
          };
        });

        console.log('Mapped doctor statistics:', mappedStats);
        setDoctorStatistics(mappedStats);
      } catch (err) {
        console.error('Error fetching doctor statistics:', err);
        setDoctorStatsError(err instanceof Error ? err.message : 'Failed to load doctor statistics');
        setDoctorStatistics([]);
      } finally {
        setLoadingDoctorStats(false);
      }
    };

    fetchDoctorStatistics();
  }, [reportType, selectedDate]);

  // Fetch IPD statistics
  useEffect(() => {
    const fetchIPDStatistics = async () => {
      try {
        setLoadingIpdStats(true);
        setIpdStatsError(null);

        let apiUrl = '/reports/ipd-statistics';
        const params = new URLSearchParams();

        if (reportType === 'daily') {
          params.append('date', selectedDate);
        } else {
          const weekDates = getWeekDates(selectedDate);
          params.append('startDate', weekDates.startDate);
          params.append('endDate', weekDates.endDate);
        }

        if (params.toString()) {
          apiUrl += `?${params.toString()}`;
        }

        console.log('Fetching IPD statistics from:', apiUrl);
        const response = await apiRequest<any>(apiUrl, {
          method: 'GET',
        });

        console.log('IPD statistics API response (RAW):', JSON.stringify(response, null, 2));

        // Handle different response structures
        let statsData: any = {};
        
        if (response && typeof response === 'object') {
          // Check for nested data structures
          if (response.data && typeof response.data === 'object') {
            statsData = response.data;
          } else if (response.statistics && typeof response.statistics === 'object') {
            statsData = response.statistics;
          } else if (response.ipdStatistics && typeof response.ipdStatistics === 'object') {
            statsData = response.ipdStatistics;
          } else {
            statsData = response;
          }
        }

        console.log('Extracted statsData:', JSON.stringify(statsData, null, 2));
        console.log('StatsData keys:', Object.keys(statsData || {}));

        // Helper function to extract field with multiple variations
        const extractField = (data: any, fieldVariations: string[], defaultValue: any = 0) => {
          if (!data || typeof data !== 'object') {
            console.log('extractField: data is not an object, returning default:', defaultValue);
            return defaultValue;
          }

          for (const field of fieldVariations) {
            const value = data[field];
            if (value !== undefined && value !== null && value !== '') {
              console.log(`extractField: Found value for field "${field}":`, value);
              return value;
            }
          }
          console.log(`extractField: No value found for fields:`, fieldVariations, 'returning default:', defaultValue);
          return defaultValue;
        };

        // Map API response to IPDStatistics interface
        const totalAdmissions = Number(extractField(statsData, [
          'totalAdmissions', 'TotalAdmissions', 'total_admissions', 'Total_Admissions',
          'admissions', 'Admissions', 'totalAdmission', 'TotalAdmission',
          'totalAdmissionCount', 'TotalAdmissionCount'
        ], 0)) || 0;

        const regularWard = Number(extractField(statsData, [
          'regularWard', 'RegularWard', 'regular_ward', 'Regular_Ward',
          'regularWardCount', 'RegularWardCount', 'regularWardPatients', 'RegularWardPatients',
          'regularWardAdmissions', 'RegularWardAdmissions'
        ], 0)) || 0;

        const specialShared = Number(extractField(statsData, [
          'specialShared', 'SpecialShared', 'special_shared', 'Special_Shared',
          'specialSharedRoom', 'SpecialSharedRoom', 'specialSharedCount', 'SpecialSharedCount',
          'specialSharedPatients', 'SpecialSharedPatients', 'specialSharedAdmissions', 'SpecialSharedAdmissions'
        ], 0)) || 0;

        const specialRoom = Number(extractField(statsData, [
          'specialRoom', 'specialRooms', 'SpecialRoom', 'SpecialRooms',
          'special_room', 'Special_Room', 'special_rooms', 'Special_Rooms',
          'specialRoomCount', 'SpecialRoomCount', 'specialRoomPatients', 'SpecialRoomPatients',
          'specialRoomAdmissions', 'SpecialRoomAdmissions'
        ], 0)) || 0;

        const avgStayDuration = Number(extractField(statsData, [
          'avgStayDuration', 'avgStayDurationDays', 'AvgStayDuration', 'AvgStayDurationDays',
          'avg_stay_duration', 'Avg_Stay_Duration', 'averageStayDuration', 'AverageStayDuration',
          'avgStay', 'AvgStay', 'averageStay', 'AverageStay', 'avgDuration', 'AvgDuration',
          'averageStayDays', 'AverageStayDays'
        ], 0)) || 0;

        const dischargedToday = Number(extractField(statsData, [
          'dischargedToday', 'DischargedToday', 'discharged_today', 'Discharged_Today',
          'dischargedCount', 'DischargedCount', 'dischargesToday', 'DischargesToday',
          'todayDischarges', 'TodayDischarges', 'discharges', 'Discharges'
        ], 0)) || 0;

        const criticalPatients = Number(extractField(statsData, [
          'criticalPatients', 'CriticalPatients', 'critical_patients', 'Critical_Patients',
          'criticalCount', 'CriticalCount', 'criticalPatientCount', 'CriticalPatientCount',
          'critical', 'Critical'
        ], 0)) || 0;

        // Bed occupancy might also be returned with statistics response
        const bedOccupancy = Number(extractField(statsData, [
          'bedOccupancy', 'BedOccupancy', 'bed_occupancy', 'Bed_Occupancy',
          'occupancy', 'Occupancy', 'occupancyRate', 'OccupancyRate',
          'occupancy_rate', 'Occupancy_Rate', 'bedOccupancyRate', 'BedOccupancyRate',
          'bedOccupancyPercent', 'BedOccupancyPercent', 'occupancyPercent', 'OccupancyPercent',
          'bedOccupancyPercentage', 'BedOccupancyPercentage', 'occupancyPercentage', 'OccupancyPercentage',
          'bedOccupancyPct', 'BedOccupancyPct', 'occupancyPct', 'OccupancyPct',
          'bedOccupancyRatePercent', 'BedOccupancyRatePercent', 'occupancyRatePercent', 'OccupancyRatePercent'
        ], 0)) || 0;

        const mappedStats: IPDStatistics = {
          totalAdmissions,
          regularWard,
          specialShared,
          specialRoom,
          avgStayDuration,
          dischargedToday,
          criticalPatients,
        };

        console.log('Mapped IPD statistics:', JSON.stringify(mappedStats, null, 2));
        console.log('Setting IPD stats state with:', mappedStats);
        setIpdStats(mappedStats);

        // Also populate IPD Summary from the same response so the cards render
        setIpdSummary({
          dischargedToday,
          criticalPatients,
          bedOccupancy,
        });
      } catch (err) {
        console.error('Error fetching IPD statistics:', err);
        setIpdStatsError(err instanceof Error ? err.message : 'Failed to load IPD statistics');
        setIpdStats(defaultIpdStats);
      } finally {
        setLoadingIpdStats(false);
      }
    };

    fetchIPDStatistics();
  }, [reportType, selectedDate]);

  // Fetch IPD summary
  useEffect(() => {
    const fetchIPDSummary = async () => {
      try {
        setLoadingIpdSummary(true);
        setIpdSummaryError(null);

        let apiUrl = '/reports/ipd-summary';
        const params = new URLSearchParams();

        if (reportType === 'daily') {
          params.append('date', selectedDate);
        } else {
          const weekDates = getWeekDates(selectedDate);
          params.append('startDate', weekDates.startDate);
          params.append('endDate', weekDates.endDate);
        }

        if (params.toString()) {
          apiUrl += `?${params.toString()}`;
        }

        console.log('Fetching IPD summary from:', apiUrl);
        const response = await apiRequest<any>(apiUrl, {
          method: 'GET',
        });

        console.log('IPD summary API response (RAW):', JSON.stringify(response, null, 2));

        // Handle different response structures - try multiple paths
        let summaryData: any = {};
        
        if (response && typeof response === 'object') {
          // Try common response structures
          if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
            summaryData = response.data;
          } else if (response.summary && typeof response.summary === 'object' && !Array.isArray(response.summary)) {
            summaryData = response.summary;
          } else if (response.ipdSummary && typeof response.ipdSummary === 'object' && !Array.isArray(response.ipdSummary)) {
            summaryData = response.ipdSummary;
          } else if (response.result && typeof response.result === 'object' && !Array.isArray(response.result)) {
            summaryData = response.result;
          } else {
            // Use response directly if it's an object (not array)
            if (!Array.isArray(response)) {
              summaryData = response;
            }
          }
        }

        console.log('&&&&&&&&&&&&&&&&&&&&&&&&Extracted summaryData:', JSON.stringify(summaryData, null, 2));
        console.log('SummaryData keys:', Object.keys(summaryData || {}));
        console.log('SummaryData type:', typeof summaryData);
        console.log('SummaryData is array?', Array.isArray(summaryData));

        // Helper function to extract field with case-insensitive and multiple variations
        const extractField = (data: any, fieldVariations: string[], defaultValue: any = 0) => {
          if (!data || typeof data !== 'object' || Array.isArray(data)) {
            console.log('extractField: data is not a valid object, returning default:', defaultValue);
            return defaultValue;
          }

          // First, try exact matches (case-sensitive)
          for (const field of fieldVariations) {
            if (data.hasOwnProperty(field)) {
              const value = data[field];
              if (value !== undefined && value !== null && value !== '') {
                console.log(`IPD Summary - Found exact match for field "${field}":`, value);
                return value;
              }
            }
          }

          // Then try case-insensitive matching
          const dataKeys = Object.keys(data);
          for (const field of fieldVariations) {
            const lowerField = field.toLowerCase();
            for (const key of dataKeys) {
              if (key.toLowerCase() === lowerField) {
                const value = data[key];
                if (value !== undefined && value !== null && value !== '') {
                  console.log(`IPD Summary - Found case-insensitive match for field "${field}" (actual key: "${key}"):`, value);
                  return value;
                }
              }
            }
          }

          // Also check nested objects recursively
          const checkNested = (obj: any, field: string, depth: number = 0): any => {
            if (depth > 3 || !obj || typeof obj !== 'object' || Array.isArray(obj)) {
              return undefined;
            }

            // Check direct property (case-sensitive)
            if (obj.hasOwnProperty(field)) {
              const value = obj[field];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
            }

            // Check case-insensitive
            const lowerField = field.toLowerCase();
            for (const key in obj) {
              if (obj.hasOwnProperty(key) && key.toLowerCase() === lowerField) {
                const value = obj[key];
                if (value !== undefined && value !== null && value !== '') {
                  return value;
                }
              }
            }

            // Recursively check nested objects
            for (const key in obj) {
              if (obj.hasOwnProperty(key) && typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                const nestedValue = checkNested(obj[key], field, depth + 1);
                if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
                  return nestedValue;
                }
              }
            }
            return undefined;
          };

          // Try nested search for each field variation
          for (const field of fieldVariations) {
            const nestedValue = checkNested(data, field);
            if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
              console.log(`IPD Summary - Found nested value for field "${field}":`, nestedValue);
              return nestedValue;
            }
          }

          // Last resort: try partial matching on all keys
          const allKeys = Object.keys(data);
          for (const field of fieldVariations) {
            const fieldLower = field.toLowerCase();
            // Try to find keys that contain the field name
            for (const key of allKeys) {
              const keyLower = key.toLowerCase();
              if (keyLower.includes(fieldLower) || fieldLower.includes(keyLower)) {
                const value = data[key];
                if (value !== undefined && value !== null && value !== '') {
                  console.log(`IPD Summary - Found partial match for field "${field}" (key: "${key}"):`, value);
                  return value;
                }
              }
            }
          }

          console.log(`IPD Summary - No value found for fields:`, fieldVariations, 'returning default:', defaultValue);
          console.log('Available keys in data:', Object.keys(data));
          console.log('Sample values:', Object.keys(data).slice(0, 5).map(k => `${k}: ${data[k]}`));
          return defaultValue;
        };

        // Helper to safely convert to number
        const safeNumber = (value: any): number => {
          if (value === null || value === undefined || value === '') {
            return 0;
          }
          const num = typeof value === 'string' ? parseFloat(value) : Number(value);
          return isNaN(num) ? 0 : num;
        };

        // Map API response to IPDSummary interface
        // Try all possible field name variations
        const dischargedToday = safeNumber(extractField(summaryData, [
          'dischargedToday', 'dischargedToday','dischargedToday', 'DischargedToday', 'discharged_today', 'Discharged_Today',
          'dischargedCount', 'DischargedCount', 'dischargesToday', 'DischargesToday',
          'todayDischarges', 'TodayDischarges', 'discharges', 'Discharges',
          'dischargedPatients', 'DischargedPatients', 'discharged', 'Discharged',
          'dischargeCount', 'DischargeCount', 'dischargeToday', 'DischargeToday',
          'dischargedTodayCount', 'DischargedTodayCount', 'todayDischarged', 'TodayDischarged',
          'dischargedPatientsToday', 'DischargedPatientsToday'
        ], 10));

        const criticalPatients = safeNumber(extractField(summaryData, [
          'criticalPatients', 'CriticalPatients', 'criticalPatients','critical_patients', 'Critical_Patients',
          'criticalCount', 'CriticalCount', 'criticalPatientCount', 'CriticalPatientCount',
          'critical', 'Critical', 'criticalPatient', 'CriticalPatient',
          'criticalPatientsCount', 'CriticalPatientsCount',
          'criticalPatientCount', 'CriticalPatientCount', 'criticalPatientsNumber', 'CriticalPatientsNumber'
        ], 0));

        const bedOccupancy = safeNumber(extractField(summaryData, [
          'bedOccupancy', 'BedOccupancy', 'bed_occupancy', 'Bed_Occupancy',
          'occupancy', 'Occupancy', 'occupancyRate', 'OccupancyRate',
          'occupancy_rate', 'Occupancy_Rate', 'bedOccupancyRate', 'BedOccupancyRate',
          'bedOccupancyPercent', 'BedOccupancyPercent', 'occupancyPercent', 'OccupancyPercent',
          'bedOccupancyPercentage', 'BedOccupancyPercentage', 'occupancyPercentage', 'OccupancyPercentage',
          'bedOccupancyPct', 'BedOccupancyPct', 'occupancyPct', 'OccupancyPct',
          'bedOccupancyRatePercent', 'BedOccupancyRatePercent', 'occupancyRatePercent', 'OccupancyRatePercent'
        ], 0));

        const mappedSummary: IPDSummary = {
          dischargedToday,
          criticalPatients,
          bedOccupancy,
        };

        console.log('========================================');
        console.log('Mapped IPD summary values:');
        console.log('  dischargedToday:', dischargedToday, '(type:', typeof dischargedToday, ')');
        console.log('  criticalPatients:', criticalPatients, '(type:', typeof criticalPatients, ')');
        console.log('  bedOccupancy:', bedOccupancy, '(type:', typeof bedOccupancy, ')');
        console.log('Full mapped summary object:', JSON.stringify(mappedSummary, null, 2));
        console.log('========================================');
        
        setIpdSummary(mappedSummary);
        
        // Verify state was set
        setTimeout(() => {
          console.log('State after setting - ipdSummary:', ipdSummary);
        }, 100);
      } catch (err) {
        console.error('Error fetching IPD summary:', err);
        setIpdSummaryError(err instanceof Error ? err.message : 'Failed to load IPD summary');
        setIpdSummary({
          dischargedToday: 0,
          criticalPatients: 0,
          bedOccupancy: 0,
        });
      } finally {
        setLoadingIpdSummary(false);
      }
    };

    fetchIPDSummary();
  }, [reportType, selectedDate]);

  // Fetch OT statistics
  useEffect(() => {
    const fetchOTStatistics = async () => {
      try {
        setLoadingOtStats(true);
        setOtStatsError(null);

        let apiUrl = '/reports/ot-statistics';
        const params = new URLSearchParams();

        if (reportType === 'daily') {
          params.append('date', selectedDate);
        } else {
          const weekDates = getWeekDates(selectedDate);
          params.append('startDate', weekDates.startDate);
          params.append('endDate', weekDates.endDate);
        }

        if (params.toString()) {
          apiUrl += `?${params.toString()}`;
        }

        console.log('Fetching OT statistics from:', apiUrl);
        const response = await apiRequest<any>(apiUrl, {
          method: 'GET',
        });

        console.log('OT statistics API response (RAW):', JSON.stringify(response, null, 2));

        // Normalize response payload
        let otData: any = {};
        if (Array.isArray(response)) {
          // Response is already a schedule list; wrap so we can pick it up
          otData = { schedule: response };
        } else if (response && typeof response === 'object') {
          if (Array.isArray(response.data)) {
            // data is an array; treat as schedule
            otData = { schedule: response.data };
          } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
            otData = response.data;
          } else if (response.statistics && typeof response.statistics === 'object' && !Array.isArray(response.statistics)) {
            otData = response.statistics;
          } else if (response.otStatistics && typeof response.otStatistics === 'object' && !Array.isArray(response.otStatistics)) {
            otData = response.otStatistics;
          } else {
            otData = response;
          }
        }

        console.log('Extracted otData:', JSON.stringify(otData, null, 2));
        console.log('otData keys:', Object.keys(otData || {}));

        // Helper to extract with variations (exact, case-insensitive, partial)
        const extractField = (data: any, fieldVariations: string[], defaultValue: any = 0) => {
          if (!data || typeof data !== 'object') {
            return defaultValue;
          }

          // Exact match
          for (const field of fieldVariations) {
            const value = (data as any)[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }

          // Case-insensitive
          const keys = Object.keys(data);
          for (const field of fieldVariations) {
            const lower = field.toLowerCase();
            const matchKey = keys.find(k => k.toLowerCase() === lower);
            if (matchKey) {
              const value = (data as any)[matchKey];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
            }
          }

          // Partial match
          for (const field of fieldVariations) {
            const lower = field.toLowerCase();
            const matchKey = keys.find(k => k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase()));
            if (matchKey) {
              const value = (data as any)[matchKey];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
            }
          }

          return defaultValue;
        };

        const safeNumber = (value: any, fallback = 0): number => {
          if (value === null || value === undefined || value === '') return fallback;
          const num = typeof value === 'string' ? parseFloat(value) : Number(value);
          return isNaN(num) ? fallback : num;
        };

        const safeString = (value: any, fallback = 'N/A'): string => {
          if (value === null || value === undefined || value === '') return fallback;
          const str = String(value).trim();
          return str || fallback;
        };

        const totalSurgeries = safeNumber(extractField(otData, [
          'totalSurgeries', 'TotalSurgeries', 'total_surgeries', 'Total_Surgeries',
          'surgeries', 'Surgeries', 'total', 'Total'
        ], 0));

        const completed = safeNumber(extractField(otData, [
          'completed', 'Completed', 'completedSurgeries', 'CompletedSurgeries',
          'completed_surgeries', 'Completed_Surgeries', 'done', 'Done'
        ], 0));

        const emergency = safeNumber(extractField(otData, [
          'emergency', 'Emergency', 'emergencySurgeries', 'EmergencySurgeries',
          'emergency_surgeries', 'Emergency_Surgeries', 'urgent', 'Urgent'
        ], 0));

        const avgDurationRaw = extractField(otData, [
          'avgDuration', 'AvgDuration', 'averageDuration', 'AverageDuration',
          'avg_duration', 'Avg_Duration', 'average_duration', 'Average_Duration',
          'avgSurgeryDuration', 'AvgSurgeryDuration', 'averageSurgeryDuration', 'AverageSurgeryDuration',
          'avgTime', 'AvgTime', 'averageTime', 'AverageTime'
        ], 'N/A');

        let avgDuration: string;
        const numericAvg = safeNumber(avgDurationRaw, NaN);
        if (!isNaN(numericAvg) && numericAvg > 0) {
          avgDuration = `${numericAvg} hours`;
        } else {
          avgDuration = safeString(avgDurationRaw, 'N/A');
        }

        let scheduleRaw = extractField(otData, [
          'schedule', 'Schedule', 'dailySchedule', 'DailySchedule',
          'surgerySchedule', 'SurgerySchedule', 'otSchedule', 'OTSchedule', 'ot_schedule',
          'surgeries', 'Surgeries', 'surgeryList', 'SurgeryList'
        ], []);

        // If still empty and original response was an array, use that
        if ((!scheduleRaw || (Array.isArray(scheduleRaw) && scheduleRaw.length === 0)) && Array.isArray(response)) {
          scheduleRaw = response;
        }

        let mappedSchedule: OTScheduleEntry[] = [];
        if (Array.isArray(scheduleRaw)) {
          mappedSchedule = scheduleRaw.map((item: any) => {
            const dateLabel = safeString(extractField(item, [
              'date', 'Date', 'day', 'Day', 'label', 'Label', 'slot', 'Slot', 'time', 'Time'
            ], ''), '');

            const surgeriesCount = safeNumber(extractField(item, [
              'surgeries', 'Surgeries', 'scheduled', 'Scheduled', 'total', 'Total', 'count', 'Count', 'planned', 'Planned'
            ], 0), 0);

            const completedCount = safeNumber(extractField(item, [
              'completed', 'Completed', 'done', 'Done', 'finished', 'Finished',
              'performed', 'Performed', 'completedSurgeries', 'CompletedSurgeries', 'completedCount', 'CompletedCount'
            ], 0), 0);

            return {
              date: dateLabel || 'N/A',
              surgeries: surgeriesCount,
              completed: completedCount,
            };
          }).filter(entry => entry.date);
        }

        const mappedOt: OTStatistics = {
          totalSurgeries,
          completed,
          emergency,
          avgDuration,
        };

        setOtStats(mappedOt);
        setOtSchedule(mappedSchedule.length ? mappedSchedule : defaultOtSchedule);
      } catch (err) {
        console.error('Error fetching OT statistics:', err);
        setOtStatsError(err instanceof Error ? err.message : 'Failed to load OT statistics');
        setOtStats(defaultOtStats);
        setOtSchedule(defaultOtSchedule);
      } finally {
        setLoadingOtStats(false);
      }
    };

    fetchOTStatistics();
  }, [reportType, selectedDate]);

  // Fetch ICU statistics
  useEffect(() => {
    const fetchICUStatistics = async () => {
      try {
        setLoadingIcuStats(true);
        setIcuStatsError(null);

        let apiUrl = '/reports/icu-statistics';
        const params = new URLSearchParams();

        if (reportType === 'daily') {
          params.append('date', selectedDate);
        } else {
          const weekDates = getWeekDates(selectedDate);
          params.append('startDate', weekDates.startDate);
          params.append('endDate', weekDates.endDate);
        }

        if (params.toString()) {
          apiUrl += `?${params.toString()}`;
        }

        console.log('Fetching ICU statistics from:', apiUrl);
        const response = await apiRequest<any>(apiUrl, {
          method: 'GET',
        });

        console.log('ICU statistics API response (RAW):', JSON.stringify(response, null, 2));

        // Handle different response structures
        let icuData: any = {};
        
        if (response && typeof response === 'object') {
          if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
            icuData = response.data;
          } else if (response.statistics && typeof response.statistics === 'object' && !Array.isArray(response.statistics)) {
            icuData = response.statistics;
          } else if (response.icuStatistics && typeof response.icuStatistics === 'object' && !Array.isArray(response.icuStatistics)) {
            icuData = response.icuStatistics;
          } else if (!Array.isArray(response)) {
            icuData = response;
          }
        }

        console.log('Extracted icuData:', JSON.stringify(icuData, null, 2));
        console.log('icuData keys:', Object.keys(icuData || {}));

        // Helper to extract with variations (exact, case-insensitive, partial)
        const extractField = (data: any, fieldVariations: string[], defaultValue: any = 0) => {
          if (!data || typeof data !== 'object') {
            return defaultValue;
          }

          // Exact match
          for (const field of fieldVariations) {
            const value = data[field];
            if (value !== undefined && value !== null && value !== '') {
              return value;
            }
          }

          // Case-insensitive
          const keys = Object.keys(data);
          for (const field of fieldVariations) {
            const lower = field.toLowerCase();
            const matchKey = keys.find(k => k.toLowerCase() === lower);
            if (matchKey) {
              const value = data[matchKey];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
            }
          }

          // Partial match
          for (const field of fieldVariations) {
            const lower = field.toLowerCase();
            const matchKey = keys.find(k => k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase()));
            if (matchKey) {
              const value = data[matchKey];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
            }
          }

          return defaultValue;
        };

        const safeNumber = (value: any, fallback = 0): number => {
          if (value === null || value === undefined || value === '') return fallback;
          const num = typeof value === 'string' ? parseFloat(value) : Number(value);
          return isNaN(num) ? fallback : num;
        };

        // Extract ICU statistics
        const totalPatients = safeNumber(extractField(icuData, [
          'totalPatients', 'TotalPatients', 'total_patients', 'Total_Patients',
          'total', 'Total', 'totalIcuPatients', 'TotalIcuPatients',
          'icuPatients', 'IcuPatients', 'patientCount', 'PatientCount'
        ], 0));

        const critical = safeNumber(extractField(icuData, [
          'critical', 'Critical', 'criticalPatients', 'CriticalPatients',
          'critical_patients', 'Critical_Patients', 'criticalCount', 'CriticalCount'
        ], 0));

        const onVentilator = safeNumber(extractField(icuData, [
          'onVentilator', 'OnVentilator', 'on_ventilator', 'On_Ventilator',
          'ventilator', 'Ventilator', 'ventilatorPatients', 'VentilatorPatients',
          'ventilator_patients', 'Ventilator_Patients', 'ventilatorCount', 'VentilatorCount'
        ], 0));

        const avgStayDuration = safeNumber(extractField(icuData, [
          'avgStayDuration', 'AvgStayDuration', 'avg_stay_duration', 'Avg_Stay_Duration',
          'averageStayDuration', 'AverageStayDuration', 'avgStay', 'AvgStay',
          'averageStay', 'AverageStay', 'avgDuration', 'AvgDuration'
        ], 0));

        // Extract occupancy trend data
        const occupancyRaw = extractField(icuData, [
          'occupancy', 'Occupancy', 'occupancyTrend', 'OccupancyTrend',
          'trend', 'Trend', 'dailyOccupancy', 'DailyOccupancy',
          'occupancyData', 'OccupancyData', 'icuOccupancy', 'IcuOccupancy'
        ], []);

        let mappedOccupancy: ICUOccupancyEntry[] = [];
        if (Array.isArray(occupancyRaw)) {
          mappedOccupancy = occupancyRaw.map((item: any) => {
            const dateLabel = String(extractField(item, [
              'date', 'Date', 'day', 'Day', 'label', 'Label', 'slot', 'Slot'
            ], '')).trim() || '';

            const occupied = safeNumber(extractField(item, [
              'occupied', 'Occupied', 'occupiedBeds', 'OccupiedBeds',
              'occupied_beds', 'Occupied_Beds', 'count', 'Count'
            ], 0), 0);

            const total = safeNumber(extractField(item, [
              'total', 'Total', 'totalBeds', 'TotalBeds',
              'total_beds', 'Total_Beds', 'capacity', 'Capacity'
            ], 15), 15);

            return {
              date: dateLabel,
              occupied,
              total,
            };
          }).filter(entry => entry.date);
        } else if (occupancyRaw && typeof occupancyRaw === 'object' && !Array.isArray(occupancyRaw)) {
          // If it's an object, try to extract as a single entry or convert to array
          const dateLabel = String(extractField(occupancyRaw, ['date', 'Date'], '')).trim() || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const occupied = safeNumber(extractField(occupancyRaw, ['occupied', 'Occupied'], 0), 0);
          const total = safeNumber(extractField(occupancyRaw, ['total', 'Total'], 15), 15);
          if (dateLabel) {
            mappedOccupancy = [{ date: dateLabel, occupied, total }];
          }
        }

        // If response itself is an array, treat it as occupancy data
        if (Array.isArray(response)) {
          mappedOccupancy = response.map((item: any) => {
            const dateLabel = String(extractField(item, ['date', 'Date', 'day', 'Day'], '')).trim() || '';
            const occupied = safeNumber(extractField(item, ['occupied', 'Occupied', 'count', 'Count'], 0), 0);
            const total = safeNumber(extractField(item, ['total', 'Total', 'capacity', 'Capacity'], 15), 15);
            return { date: dateLabel, occupied, total };
          }).filter(entry => entry.date);
        } else if (response?.data && Array.isArray(response.data)) {
          mappedOccupancy = response.data.map((item: any) => {
            const dateLabel = String(extractField(item, ['date', 'Date', 'day', 'Day'], '')).trim() || '';
            const occupied = safeNumber(extractField(item, ['occupied', 'Occupied', 'count', 'Count'], 0), 0);
            const total = safeNumber(extractField(item, ['total', 'Total', 'capacity', 'Capacity'], 15), 15);
            return { date: dateLabel, occupied, total };
          }).filter(entry => entry.date);
        }

        const mappedIcu: ICUStatistics = {
          totalPatients,
          critical,
          onVentilator,
          avgStayDuration,
        };

        console.log('Mapped ICU statistics:', mappedIcu);
        console.log('Mapped ICU occupancy:', mappedOccupancy);
        
        setIcuStats(mappedIcu);
        setIcuOccupancy(mappedOccupancy.length > 0 ? mappedOccupancy : defaultIcuOccupancy);
      } catch (err) {
        console.error('Error fetching ICU statistics:', err);
        setIcuStatsError(err instanceof Error ? err.message : 'Failed to load ICU statistics');
        setIcuStats(defaultIcuStats);
        setIcuOccupancy(defaultIcuOccupancy);
      } finally {
        setLoadingIcuStats(false);
      }
    };

    fetchICUStatistics();
  }, [reportType, selectedDate]);

  return (
    <div className="px-4 pt-4 pb-4 bg-blue-100 h-screen flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2">Reports & Analytics</h1>
            <p className="text-gray-500">Comprehensive hospital performance reports</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={reportType === 'daily' ? 'default' : 'outline'}
              onClick={() => setReportType('daily')}
            >
              Daily Report
            </Button>
            <Button
              variant={reportType === 'weekly' ? 'default' : 'outline'}
              onClick={() => setReportType('weekly')}
            >
              Weekly Report
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="size-4" />
              Export PDF
            </Button>
          </div>
        </div>

        <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {reportType === 'daily' ? 'Daily Report' : 'Weekly Report'}
              </h2>
              <p className="text-sm text-gray-500">
                {reportType === 'daily' ? `For ${selectedDate}` : (() => {
                  const weekDates = getWeekDates(selectedDate);
                  return `${weekDates.startDate} - ${weekDates.endDate}`;
                })()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Calendar className="size-5 text-blue-600" />
              <input
                type="date"
                aria-label="Select date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      <div className="overflow-y-auto overflow-x-hidden px-4 pb-4 reports-scrollable" style={{ maxHeight: 'calc(100vh - 60px)', minHeight: 0 }}>
      <Tabs defaultValue="doctorwise" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="doctorwise">Doctor-wise</TabsTrigger>
          <TabsTrigger value="opd">OPD</TabsTrigger>
          <TabsTrigger value="ipd">IPD</TabsTrigger>
          <TabsTrigger value="ot">OT</TabsTrigger>
          <TabsTrigger value="icu">ICU</TabsTrigger>
        </TabsList>

        <TabsContent value="doctorwise" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Doctor-wise Patient Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDoctorStats ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading doctor statistics...
                </div>
              ) : doctorStatsError ? (
                <div className="text-center py-12 text-red-600">
                  <p className="mb-2">{doctorStatsError}</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-gray-700 font-medium">Doctor</th>
                        <th className="text-left py-3 px-4 text-gray-700 font-medium">Specialty</th>
                        <th className="text-left py-3 px-4 text-gray-700 font-medium">OPD Patients</th>
                        <th className="text-left py-3 px-4 text-gray-700 font-medium">IPD Patients</th>
                        <th className="text-left py-3 px-4 text-gray-700 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctorStatistics.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500">
                            No doctor statistics found for the selected {reportType === 'daily' ? 'date' : 'week'}.
                          </td>
                        </tr>
                      ) : (
                        <>
                          {doctorStatistics.map((doc, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-900">{doc.doctor}</td>
                              <td className="py-3 px-4 text-gray-600">{doc.specialty || '-'}</td>
                              <td className="py-3 px-4 text-gray-900">{doc.opd}</td>
                              <td className="py-3 px-4 text-gray-900">{doc.ipd}</td>
                              <td className="py-3 px-4 text-gray-900 font-medium">{doc.total}</td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-gray-300 font-semibold">
                            <td className="py-3 px-4 text-gray-900">Total</td>
                            <td className="py-3 px-4"></td>
                            <td className="py-3 px-4 text-gray-900">
                              {doctorStatistics.reduce((sum, doc) => sum + doc.opd, 0)}
                            </td>
                            <td className="py-3 px-4 text-gray-900">
                              {doctorStatistics.reduce((sum, doc) => sum + doc.ipd, 0)}
                            </td>
                            <td className="py-3 px-4 text-gray-900">
                              {doctorStatistics.reduce((sum, doc) => sum + doc.total, 0)}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Doctor Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={doctorStatistics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="doctor" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="opd" fill="#3b82f6" name="OPD Patients" />
                  <Bar dataKey="ipd" fill="#8b5cf6" name="IPD Patients" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opd" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Total OPD Patients</p>
                  <FileText className="size-5 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {reportType === 'daily' ? '115' : '729'}
                </h3>
                <p className="text-xs text-gray-500">
                  {reportType === 'daily' ? 'Today' : 'This week'}
                </p>
              </CardContent>
            </Card>

          {/*  <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Avg. Wait Time</p>
                  <TrendingUp className="size-5 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">23 min</h3>
                <p className="text-xs text-green-600">-5 min from last week</p>
              </CardContent>
            </Card>*/}

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Peak Hours</p>
                  <Calendar className="size-5 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">10 AM - 1 PM</h3>
                <p className="text-xs text-gray-500">Busiest period</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>OPD Patient Flow - Weekly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={weeklyOPD}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={2} name="OPD Patients" />
                  <Line type="monotone" dataKey="admissions" stroke="#8b5cf6" strokeWidth={2} name="Admissions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ipd" className="space-y-6">
          {loadingIpdStats ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading IPD statistics...
                </div>
              </CardContent>
            </Card>
          ) : ipdStatsError ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12 text-red-600">
                  <p className="mb-2">{ipdStatsError}</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-500 mb-1">Total Admissions</p>
                    <h3 className="text-2xl font-bold text-gray-900">{ipdStats.totalAdmissions}</h3>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-500 mb-1">Regular Ward</p>
                    <h3 className="text-2xl font-bold text-gray-900">{ipdStats.regularWard}</h3>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-500 mb-1">Special Rooms</p>
                    <h3 className="text-2xl font-bold text-gray-900">{ipdStats.specialShared + ipdStats.specialRoom}</h3>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-500 mb-1">Avg. Stay Duration</p>
                    <h3 className="text-2xl font-bold text-gray-900">{ipdStats.avgStayDuration.toFixed(1)} days</h3>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Department-wise Admissions (Today)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyAdmissions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="mb-4">
            <CardHeader>
              <CardTitle>IPD Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingIpdSummary ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading IPD summary...
                </div>
              ) : ipdSummaryError ? (
                <div className="text-center py-12 text-red-600">
                  <p className="mb-2">{ipdSummaryError}</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Discharged Today</p>
                    <p className="text-xl font-semibold text-gray-900">{ipdSummary.dischargedToday}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700 mb-1">Critical Patients</p>
                    <p className="text-xl font-semibold text-red-900">{ipdSummary.criticalPatients}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 mb-1">Bed Occupancy</p>
                    <p className="text-xl font-semibold text-blue-900">
                      {ipdSummary.bedOccupancy > 0 ? `${ipdSummary.bedOccupancy}%` : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ot" className="space-y-6">
          {loadingOtStats ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading OT statistics...
                </div>
              </CardContent>
            </Card>
          ) : otStatsError ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12 text-red-600">
                  <p className="mb-2">{otStatsError}</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-500 mb-1">Total Surgeries</p>
                    <h3 className="text-2xl font-bold text-gray-900">{otStats.totalSurgeries}</h3>
                    <p className="text-xs text-gray-500">{reportType === 'daily' ? 'Today' : 'This week'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-500 mb-1">Completed</p>
                    <h3 className="text-2xl font-bold text-gray-900">{otStats.completed}</h3>
                    <p className="text-xs text-green-600">Successfully</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-500 mb-1">Emergency</p>
                    <h3 className="text-2xl font-bold text-gray-900">{otStats.emergency}</h3>
                    <p className="text-xs text-red-600">Urgent cases</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-500 mb-1">Avg. Duration</p>
                    <h3 className="text-2xl font-bold text-gray-900">{otStats.avgDuration}</h3>
                  </CardContent>
                </Card>
              </div>

              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Daily Surgery Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={otSchedule}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="surgeries" fill="#f97316" name="Scheduled" />
                      <Bar dataKey="completed" fill="#10b981" name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="icu" className="space-y-6">
          {loadingIcuStats ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading ICU statistics...
                </div>
              </CardContent>
            </Card>
          ) : icuStatsError ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12 text-red-600">
                  <p className="mb-2">{icuStatsError}</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-500 mb-1">Total ICU Patients</p>
                    <h3 className="text-2xl font-bold text-gray-900">{icuStats.totalPatients}/15</h3>
                    <p className="text-xs text-gray-500">
                      {icuStats.totalPatients > 0 ? `${Math.round((icuStats.totalPatients / 15) * 100)}% occupancy` : '0% occupancy'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-500 mb-1">Critical</p>
                    <h3 className="text-2xl font-bold text-red-900">{icuStats.critical}</h3>
                    <p className="text-xs text-red-600">Requires attention</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-500 mb-1">On Ventilator</p>
                    <h3 className="text-2xl font-bold text-gray-900">{icuStats.onVentilator}</h3>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-500 mb-1">Avg. Stay</p>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {icuStats.avgStayDuration > 0 ? `${icuStats.avgStayDuration.toFixed(1)} days` : 'N/A'}
                    </h3>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>ICU Occupancy Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {icuOccupancy.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={icuOccupancy}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="occupied" stroke="#ef4444" strokeWidth={2} name="Occupied Beds" />
                        <Line type="monotone" dataKey="total" stroke="#94a3b8" strokeWidth={2} name="Total Beds" strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No occupancy data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/*
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Patient Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <p className="text-sm text-red-700 mb-1">Critical</p>
                  <p className="text-2xl font-bold text-red-900">{icuStats.critical}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <p className="text-sm text-orange-700 mb-1">Serious</p>
                  <p className="text-2xl font-bold text-orange-900">{icuStats.serious}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-sm text-green-700 mb-1">Stable</p>
                  <p className="text-2xl font-bold text-green-900">{icuStats.stable}</p>
                </div>
              </div>
            </CardContent>
          </Card> */}  
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

