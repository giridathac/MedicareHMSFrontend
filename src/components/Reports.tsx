import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, Download, FileText, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiRequest } from '../api/base';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DoctorStatistics {
  doctor: string;
  specialty?: string;
  opd: number;
  ipd: number;
  total: number;
}





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

interface WeeklyOPDEntry {
  date: string;
  patients: number;
  admissions: number;
}

interface DepartmentAdmission {
  department: string;
  count: number;
}

// Helper function to safely convert values to numbers
const safeNumber = (value: any, fallback = 0): number => {
  if (value === null || value === undefined || value === '') return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? fallback : num;
};

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

const defaultWeeklyOPD: WeeklyOPDEntry[] = [];

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
  const [totalICUBeds, setTotalICUBeds] = useState<number>(15);
  const [loadingICUBeds, setLoadingICUBeds] = useState(false);
  const [icuBedsError, setIcuBedsError] = useState<string | null>(null);
  const [activeICUBeds, setActiveICUBeds] = useState<number>(15);
  const [loadingActiveICUBeds, setLoadingActiveICUBeds] = useState(false);
  const [activeICUBedsError, setActiveICUBedsError] = useState<string | null>(null);
  const [totalOpdPatients, setTotalOpdPatients] = useState<number>(0);
  const [loadingOpdStats, setLoadingOpdStats] = useState(false);
  const [opdStatsError, setOpdStatsError] = useState<string | null>(null);
  const [peakHours, setPeakHours] = useState<string>('10 AM - 1 PM');
  const [weeklyOPD, setWeeklyOPD] = useState<WeeklyOPDEntry[]>([]);
  const [loadingWeeklyOPD, setLoadingWeeklyOPD] = useState(false);
  const [weeklyOPDError, setWeeklyOPDError] = useState<string | null>(null);
  const [departmentAdmissions, setDepartmentAdmissions] = useState<DepartmentAdmission[]>([]);
  const [loadingDepartmentAdmissions, setLoadingDepartmentAdmissions] = useState(false);
  const [departmentAdmissionsError, setDepartmentAdmissionsError] = useState<string | null>(null);

  // PDF Export function
  const exportToPDF = async () => {
    try {
      // Get the current tab content - target the visible TabsContent
      const activeTabContent = document.querySelector('[data-state="active"]')?.parentElement?.nextElementSibling as HTMLElement;
      const reportContent = activeTabContent || document.querySelector('.reports-scrollable') as HTMLElement;

      if (!reportContent) {
        console.error('Report content not found');
        alert('Report content not found. Please try again.');
        return;
      }

      // Show loading indicator
      const loadingAlert = document.createElement('div');
      loadingAlert.innerHTML = '<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999;">Generating PDF... Please wait.</div>';
      document.body.appendChild(loadingAlert);

      // Add a small delay to ensure content is fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create canvas from the report content with improved settings
      const canvas = await html2canvas(reportContent, {
        scale: 1.5, // Higher scale for better quality
        useCORS: true,
        allowTaint: true, // Enable to handle unsupported CSS
        backgroundColor: '#ffffff',
        width: reportContent.scrollWidth, // Use full width instead of limiting to 1200
        height: reportContent.scrollHeight,
        logging: false, // Disable logging for cleaner output
        imageTimeout: 20000, // Increase timeout for images
        removeContainer: true, // Clean up after rendering
        foreignObjectRendering: true, // Enable for better rendering
        // Less aggressive ignoreElements - only exclude truly problematic elements
        ignoreElements: (element) => {
          // Only skip elements that are known to cause canvas rendering issues
          return element.tagName === 'IFRAME' ||
                 element.tagName === 'VIDEO' ||
                 element.tagName === 'AUDIO' ||
                 (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'password') ||
                 element.classList.contains('pdf-ignore'); // Add this class to elements you want to exclude
        }
      });

      // Remove loading indicator
      document.body.removeChild(loadingAlert);

      // Check if canvas has content
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas capture resulted in empty image');
      }

      // Create PDF with better settings
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true // Enable compression
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95); // Use JPEG for smaller file size
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const totalPages = Math.ceil(imgHeight / pageHeight);

      // Add pages
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        const yPosition = -i * pageHeight;
        pdf.addImage(imgData, 'JPEG', 0, yPosition, imgWidth, imgHeight, undefined, 'FAST');
      }

      // Download the PDF
      const fileName = `Hospital_Report_${reportType}_${selectedDate}.pdf`;
      pdf.save(fileName);

      // Success message
      alert('PDF generated successfully!');

    } catch (error) {
      console.error('Error generating PDF:', error);

      // Remove loading indicator if it exists
      const loadingAlert = document.querySelector('div[style*="Generating PDF"]');
      if (loadingAlert) {
        document.body.removeChild(loadingAlert);
      }

      // Provide more specific error messages
      let errorMessage = 'Failed to generate PDF. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Canvas') || error.message.includes('empty image')) {
          errorMessage = 'Failed to capture report content. The report may be empty or not fully loaded.';
        } else if (error.message.includes('CORS') || error.message.includes('taint')) {
          errorMessage = 'Content security issue. Some elements cannot be exported to PDF.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'PDF generation timed out. Please try again with less content.';
        }
      }

      alert(errorMessage);
    }
  };

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
          } as DoctorStatistics;
        });

        console.log('Mapped doctor statistics:', mappedStats);
        setDoctorStatistics(mappedStats);
      } catch (err) {
        console.error('Error fetching doctor statistics:', err);
        setDoctorStatsError(err instanceof Error ? err.message : 'Failed to load doctor statistics');
        setDoctorStatistics([] as DoctorStatistics[]);
      } finally {
        setLoadingDoctorStats(false);
      }
    };

    fetchDoctorStatistics();
  }, [reportType, selectedDate]);

  // Fetch total OPD patients
  useEffect(() => {
    const fetchTotalOpdPatients = async () => {
      try {
        setLoadingOpdStats(true);
        setOpdStatsError(null);

        let apiUrl = '/reports/total-opd-patients-report';
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

        console.log('Fetching total OPD patients from:', apiUrl);
        const response = await apiRequest<any>(apiUrl, {
          method: 'GET',
        });

        console.log('Total OPD patients API response:', JSON.stringify(response, null, 2));

        // Handle different response structures
        let opdData: any = {};
        if (response && typeof response === 'object') {
          if (response.data && typeof response.data === 'object') {
            opdData = response.data;
          } else {
            opdData = response;
          }
        }

        console.log('Extracted OPD data:', JSON.stringify(opdData, null, 2));

        // Helper to extract with variations
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
              console.log(`OPD - Found nested value for field "${field}":`, nestedValue);
              return nestedValue;
            }
          }

          return defaultValue;
        };

        const safeNumber = (value: any, fallback = 0): number => {
          if (value === null || value === undefined || value === '') return fallback;
          const num = typeof value === 'string' ? parseFloat(value) : Number(value);
          return isNaN(num) ? fallback : num;
        };

        // Handle direct number response or extract from object
        let totalOpdCount = 0;
        if (typeof opdData === 'number') {
          totalOpdCount = safeNumber(opdData, 0);
        } else {
        // Extract total OPD patients count
        totalOpdCount = safeNumber(extractField(opdData, [
          'totalOPDPatients', 'TotalOPDPatients', 'totalOpdPatients', 'TotalOpdPatients',
          'total_opd_patients', 'Total_OPD_Patients', 'totalOPDPatients', 'TotalOPDPatients',
          'totalAppointments', 'TotalAppointments', 'total_appointments', 'Total_Appointments',
          'opdPatients', 'OPDPatients', 'opd_patients', 'OPD_Patients',
          'totalPatients', 'TotalPatients', 'total_patients', 'Total_Patients',
          'total', 'Total', 'count', 'Count', 'opdCount', 'OPDCount', 'opd_count', 'OPD_Count'
        ], 0));
        }

        console.log('Extracted total OPD patients count:', totalOpdCount);
        setTotalOpdPatients(totalOpdCount);

        // Extract peak hours
        let extractedPeakHours = '10 AM - 1 PM'; // default
        if (typeof opdData === 'object' && opdData !== null) {
          extractedPeakHours = extractField(opdData, [
            'peakHours', 'PeakHours', 'peak_hours', 'Peak_Hours',
            'peakTime', 'PeakTime', 'peak_time', 'Peak_Time',
            'busiestHours', 'BusiestHours', 'busiest_hours', 'Busiest_Hours',
            'busiestTime', 'BusiestTime', 'busiest_time', 'Busiest_Time',
            'peakPeriod', 'PeakPeriod', 'peak_period', 'Peak_Period'
          ], '10 AM - 1 PM');
        }

        // Handle case where API returns an object or array instead of string
        if (typeof extractedPeakHours === 'object' && extractedPeakHours !== null) {
          if (Array.isArray(extractedPeakHours) && extractedPeakHours.length > 0) {
            // If it's an array, find the peak hour (max patientCount)
            const peakHour = extractedPeakHours.reduce((max: any, current: any) =>
              (current.patientCount || 0) > (max.patientCount || 0) ? current : max
            );
            extractedPeakHours = peakHour.hourLabel || peakHour.hour || '10 AM - 1 PM';
          } else if ((extractedPeakHours as any).hourLabel) {
            // If it's an object with hourLabel
            extractedPeakHours = (extractedPeakHours as any).hourLabel || '10 AM - 1 PM';
          } else if ((extractedPeakHours as any).hour) {
            // Fallback to hour
            extractedPeakHours = (extractedPeakHours as any).hour || '10 AM - 1 PM';
          } else {
            // Unknown object format
            extractedPeakHours = '10 AM - 1 PM';
          }
        } else if (typeof extractedPeakHours !== 'string') {
          extractedPeakHours = '10 AM - 1 PM';
        }

        console.log('Extracted peak hours:', extractedPeakHours);
        setPeakHours(extractedPeakHours);
      } catch (err) {
        console.error('Error fetching total OPD patients:', err);
        setOpdStatsError(err instanceof Error ? err.message : 'Failed to load OPD statistics');
        setTotalOpdPatients(0);
        setPeakHours('10 AM - 1 PM');
      } finally {
        setLoadingOpdStats(false);
      }
    };

    fetchTotalOpdPatients();
  }, [reportType, selectedDate]);

  // Fetch weekly OPD patient flow
  useEffect(() => {
    const fetchWeeklyOPD = async () => {
      try {
        setLoadingWeeklyOPD(true);
        setWeeklyOPDError(null);

        let apiUrl = '/reports/opd-patient-flow-weekly-trend';
        const params = new URLSearchParams();

        // For weekly trend, always use weekly dates
        const weekDates = getWeekDates(selectedDate);
        params.append('startDate', weekDates.startDate);
        params.append('endDate', weekDates.endDate);

        if (params.toString()) {
          apiUrl += `?${params.toString()}`;
        }

        console.log('Fetching weekly OPD from:', apiUrl);
        const response = await apiRequest<any>(apiUrl, {
          method: 'GET',
        });

        console.log('Weekly OPD API response:', JSON.stringify(response, null, 2));

        // Handle different response structures
        let data: any[] = [];
        if (Array.isArray(response)) {
          data = response;
        } else if (response?.data && Array.isArray(response.data)) {
          data = response.data;
        } else if (response?.weeklyOPD && Array.isArray(response.weeklyOPD)) {
          data = response.weeklyOPD;
        } else if (response?.trend && Array.isArray(response.trend)) {
          data = response.trend;
        }

        // Map API response to WeeklyOPDEntry interface
        const mappedData: WeeklyOPDEntry[] = data.map((item: any): WeeklyOPDEntry => {
          // Helper to extract field with variations
          const extractField = (data: any, fieldVariations: string[], defaultValue: any = '') => {
            for (const field of fieldVariations) {
              const value = data?.[field];
              if (value !== undefined && value !== null && value !== '') {
                return value;
              }
            }
            return defaultValue;
          };

          const date = extractField(item, [
            'date', 'Date', 'day', 'Day', 'label', 'Label'
          ], '');

          const patients = Number(extractField(item, [
            'patients', 'Patients', 'opdPatients', 'OPDPatients', 'opdPatientCount', 'OPDPatientCount', 'opd', 'OPD', 'count', 'Count'
          ], 0)) || 0;

          const admissions = Number(extractField(item, [
            'admissions', 'Admissions', 'ipdAdmissions', 'IPDAdmissions', 'ipdAdmissionCount', 'IPDAdmissionCount', 'ipd', 'IPD', 'admissionCount', 'AdmissionCount'
          ], 0)) || 0;

          return {
            date,
            patients,
            admissions
          };
        });

        console.log('Mapped weekly OPD:', mappedData);
        setWeeklyOPD(mappedData);
      } catch (err) {
        console.error('Error fetching weekly OPD:', err);
        setWeeklyOPDError(err instanceof Error ? err.message : 'Failed to load weekly OPD data');
        setWeeklyOPD([]);
      } finally {
        setLoadingWeeklyOPD(false);
      }
    };

    fetchWeeklyOPD();
  }, [selectedDate]);

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

        // Helper function to extract count from object or direct value
        const extractCount = (data: any, fieldVariations: string[], defaultValue: any = 0) => {
          const extracted = extractField(data, fieldVariations, defaultValue);
          if (typeof extracted === 'object' && extracted !== null && 'count' in extracted) {
            return Number(extracted.count) || 0;
          }
          return Number(extracted) || 0;
        };

        // Map API response to IPDStatistics interface
        const totalAdmissions = Number(extractField(statsData, [
          'totalAdmissions', 'TotalAdmissions', 'total_admissions', 'Total_Admissions',
          'admissions', 'Admissions', 'totalAdmission', 'TotalAdmission',
          'totalAdmissionCount', 'TotalAdmissionCount'
        ], 0)) || 0;

        const regularWard = extractCount(statsData, [
          'regularWard', 'RegularWard', 'regular_ward', 'Regular_Ward',
          'regularWardCount', 'RegularWardCount', 'regularWardPatients', 'RegularWardPatients',
          'regularWardAdmissions', 'RegularWardAdmissions'
        ], 0);

        const specialShared = extractCount(statsData, [
          'specialShared', 'SpecialShared', 'special_shared', 'Special_Shared',
          'specialSharedRoom', 'SpecialSharedRoom', 'specialSharedCount', 'SpecialSharedCount',
          'specialSharedPatients', 'SpecialSharedPatients', 'specialSharedAdmissions', 'SpecialSharedAdmissions'
        ], 0);

        const specialRoom = extractCount(statsData, [
          'specialRoom', 'specialRooms', 'SpecialRoom', 'SpecialRooms',
          'special_room', 'Special_Room', 'special_rooms', 'Special_Rooms',
          'specialRoomCount', 'SpecialRoomCount', 'specialRoomPatients', 'SpecialRoomPatients',
          'specialRoomAdmissions', 'SpecialRoomAdmissions'
        ], 0);

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

        console.log('Extracted summaryData:', JSON.stringify(summaryData, null, 2));
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
        const dischargedTodayRaw = extractField(summaryData, [
          'dischargedToday', 'dischargedToday','dischargedToday', 'DischargedToday', 'discharged_today', 'Discharged_Today',
          'dischargedCount', 'DischargedCount', 'dischargesToday', 'DischargesToday',
          'todayDischarges', 'TodayDischarges', 'discharges', 'Discharges',
          'dischargedPatients', 'DischargedPatients', 'discharged', 'Discharged',
          'dischargeCount', 'DischargeCount', 'dischargeToday', 'DischargeToday',
          'dischargedTodayCount', 'DischargedTodayCount', 'todayDischarged', 'TodayDischarged',
          'dischargedPatientsToday', 'DischargedPatientsToday'
        ], 10);

        const dischargedToday = typeof dischargedTodayRaw === 'object' && dischargedTodayRaw !== null && 'count' in dischargedTodayRaw
          ? safeNumber(dischargedTodayRaw.count)
          : safeNumber(dischargedTodayRaw);

        const criticalPatientsRaw = extractField(summaryData, [
          'criticalPatients', 'CriticalPatients', 'criticalPatients','critical_patients', 'Critical_Patients',
          'criticalCount', 'CriticalCount', 'criticalPatientCount', 'CriticalPatientCount',
          'critical', 'Critical', 'criticalPatient', 'CriticalPatient',
          'criticalPatientsCount', 'CriticalPatientsCount',
          'criticalPatientCount', 'CriticalPatientCount', 'criticalPatientsNumber', 'CriticalPatientsNumber'
        ], 0);

        const criticalPatients = typeof criticalPatientsRaw === 'object' && criticalPatientsRaw !== null && 'count' in criticalPatientsRaw
          ? safeNumber(criticalPatientsRaw.count)
          : safeNumber(criticalPatientsRaw);

        const bedOccupancyRaw = extractField(summaryData, [
          'bedOccupancy', 'BedOccupancy', 'bed_occupancy', 'Bed_Occupancy',
          'occupancy', 'Occupancy', 'occupancyRate', 'OccupancyRate',
          'occupancy_rate', 'Occupancy_Rate', 'bedOccupancyRate', 'BedOccupancyRate',
          'bedOccupancyPercent', 'BedOccupancyPercent', 'occupancyPercent', 'OccupancyPercent',
          'bedOccupancyPercentage', 'BedOccupancyPercentage', 'occupancyPercentage', 'OccupancyPercentage',
          'bedOccupancyPct', 'BedOccupancyPct', 'occupancyPct', 'OccupancyPct',
          'bedOccupancyRatePercent', 'BedOccupancyRatePercent', 'occupancyRatePercent', 'OccupancyRatePercent'
        ], 0);

        const bedOccupancy = typeof bedOccupancyRaw === 'object' && bedOccupancyRaw !== null && 'occupancyPercentage' in bedOccupancyRaw
          ? safeNumber(bedOccupancyRaw.occupancyPercentage)
          : safeNumber(bedOccupancyRaw);
        console.log('Extracted IPD summary values: dischargedToday =', dischargedToday, ', criticalPatients =', criticalPatients, ', bedOccupancy =', bedOccupancy);

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

        // Normalize response payload - handle the specific API structure
        let otData: any = {};
        if (response && typeof response === 'object') {
          // Check for the expected structure with summary and data
          if (response.summary && response.data) {
            otData = {
              ...response.summary,
              schedule: response.data
            };
          } else if (Array.isArray(response.data)) {
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

        console.log('Mapped OT statistics:', mappedOt);
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

  // Fetch department-wise IPD admissions
  useEffect(() => {
    const fetchDepartmentAdmissions = async () => {
      try {
        setLoadingDepartmentAdmissions(true);
        setDepartmentAdmissionsError(null);

        let apiUrl = '/reports/department-wise-ipd-admissions';
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

        console.log('Fetching department admissions from:', apiUrl);
        const response = await apiRequest<any>(apiUrl, {
          method: 'GET',
        });

        console.log('Department admissions API response:', JSON.stringify(response, null, 2));

        // Handle different response structures
        let admissionsData: any[] = [];

        if (Array.isArray(response)) {
          admissionsData = response;
          console.log('Response is direct array, length:', admissionsData.length);
        } else if (response?.data && Array.isArray(response.data)) {
          admissionsData = response.data;
          console.log('Response.data is array, length:', admissionsData.length);
        } else if (response?.admissions && Array.isArray(response.admissions)) {
          admissionsData = response.admissions;
          console.log('Response.admissions is array, length:', admissionsData.length);
        } else if (response?.departmentAdmissions && Array.isArray(response.departmentAdmissions)) {
          admissionsData = response.departmentAdmissions;
          console.log('Response.departmentAdmissions is array, length:', admissionsData.length);
        } else if (response && typeof response === 'object' && !Array.isArray(response)) {
          // Check if response is an object with department names as keys and counts as values
          const keys = Object.keys(response);
          if (keys.length > 0) {
            const firstValue = response[keys[0]];
            if (typeof firstValue === 'number') {
              // Assume it's { "Cardiology": 5, "Neurology": 3 }
              admissionsData = keys.map(dept => ({ department: dept, count: response[dept] }));
              console.log('Response is object with department keys as numbers, converted to array, length:', admissionsData.length);
            } else if (typeof firstValue === 'object' && firstValue !== null) {
              // Check if nested data is the array
              if (Array.isArray(firstValue)) {
                admissionsData = firstValue;
                console.log('Response is object with array value, using array, length:', admissionsData.length);
              } else {
                // Try to find nested array
                const nestedKeys = Object.keys(firstValue);
                const nestedArray = nestedKeys.find(k => Array.isArray(firstValue[k]));
                if (nestedArray) {
                  admissionsData = firstValue[nestedArray];
                  console.log(`Response is object with nested array at ${nestedArray}, length:`, admissionsData.length);
                } else {
                  console.log('Response is object but no array found in nested structure');
                }
              }
            } else {
              console.log('Response is object but values are not numbers or objects');
            }
          } else {
            console.log('Response is empty object');
          }
        } else {
          console.log('No matching response structure found. Response type:', typeof response);
          console.log('Response keys:', Object.keys(response || {}));
        }

        // Map API response to DepartmentAdmission interface
        const mappedAdmissions: DepartmentAdmission[] = admissionsData
          .filter((item: any) => item && typeof item === 'object' && item.departmentName && typeof item.ipdAdmissionCount === 'number')
          .map((item: any) => ({
            department: item.departmentName || 'Unknown Department',
            count: Number(item.ipdAdmissionCount) || 0
          }));

        console.log('Mapped department admissions:', mappedAdmissions);
        setDepartmentAdmissions(mappedAdmissions);
      } catch (err) {
        console.error('Error fetching department admissions:', err);
        setDepartmentAdmissionsError(err instanceof Error ? err.message : 'Failed to load department admissions');
        setDepartmentAdmissions([]);
      } finally {
        setLoadingDepartmentAdmissions(false);
      }
    };

    fetchDepartmentAdmissions();
  }, [reportType, selectedDate]);

  // Fetch total ICU beds
  useEffect(() => {
    const fetchTotalICUBeds = async () => {
      try {
        setLoadingICUBeds(true);
        setIcuBedsError(null);

        const apiUrl = '/icu/active-count';
        console.log('Fetching total ICU beds from:', apiUrl);
        const response = await apiRequest<any>(apiUrl, {
          method: 'GET',
        });

        console.log('Total ICU beds API response:', JSON.stringify(response, null, 2));

        // Handle different response structures
        let bedsData: any = {};
        if (response && typeof response === 'object') {
          if (response.data && typeof response.data === 'object') {
            bedsData = response.data;
          } else {
            bedsData = response;
          }
        }

        // Helper to extract with variations
        const extractField = (data: any, fieldVariations: string[], defaultValue: any = 15) => {
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

          return defaultValue;
        };

        const safeNumber = (value: any, fallback = 15): number => {
          if (value === null || value === undefined || value === '') return fallback;
          const num = typeof value === 'string' ? parseFloat(value) : Number(value);
          return isNaN(num) ? fallback : num;
        };

        // Extract total ICU beds
        const totalBeds = safeNumber(extractField(bedsData, [
          'count','activeICUBedsCount','totalBeds', 'TotalBeds', 'total_beds', 'Total_Beds',
          'totalICUBeds', 'TotalICUBeds', 'total_icu_beds', 'Total_ICU_Beds',
          'icuBeds', 'ICUBeds', 'icu_beds', 'ICU_Beds',
          'beds', 'Beds', 'capacity', 'Capacity', 'total', 'Total'
        ], 0));

        console.log('Extracted total ICU beds:', totalBeds);
        setTotalICUBeds(totalBeds);
      } catch (err) {
        console.error('Error fetching total ICU beds:', err);
        setIcuBedsError(err instanceof Error ? err.message : 'Failed to load ICU beds data');
        setTotalICUBeds(0); // fallback to default
      } finally {
        setLoadingICUBeds(false);
      }
    };

    fetchTotalICUBeds();
  }, []);

  // Fetch active ICU beds
  useEffect(() => {
    const fetchActiveICUBeds = async () => {
      try {
        setLoadingActiveICUBeds(true);
        setActiveICUBedsError(null);

        const apiUrl = '/icu/active-count';
        console.log('Fetching active ICU beds from:', apiUrl);
        const response = await apiRequest<any>(apiUrl, {
          method: 'GET',
        });

        console.log('@@@@@@@@@@@@@@@@@@@@@@@@Active ICU beds API response:', JSON.stringify(response, null, 2));

        // Handle different response structures
        let bedsData: any = {};
        if (response && typeof response === 'object') {
          if (response.data && typeof response.data === 'object') {
            bedsData = response.data;
          } else {
            bedsData = response;
          }
        }

        // Helper to extract with variations
        const extractField = (data: any, fieldVariations: string[], defaultValue: any = 15) => {
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

          return defaultValue;
        };

        const safeNumber = (value: any, fallback = 15): number => {
          if (value === null || value === undefined || value === '') return fallback;
          const num = typeof value === 'string' ? parseFloat(value) : Number(value);
          return isNaN(num) ? fallback : num;
        };

        // Extract active ICU beds
        const activeBeds = safeNumber(extractField(bedsData, [
          'count','activeBeds', 'ActiveBeds', 'active_beds', 'Active_Beds',
          'activeICUBeds', 'ActiveICUBeds', 'active_icu_beds', 'Active_ICU_Beds',
          'availableBeds', 'AvailableBeds', 'available_beds', 'Available_Beds',
          'operationalBeds', 'OperationalBeds', 'operational_beds', 'Operational_Beds',
          'beds', 'Beds', 'capacity', 'Capacity', 'active', 'Active'
        ], 15));

        console.log('Extracted active ICU beds:', activeBeds);
        setActiveICUBeds(activeBeds);
      } catch (err) {
        console.error('Error fetching active ICU beds:', err);
        setActiveICUBedsError(err instanceof Error ? err.message : 'Failed to load active ICU beds data');
        setActiveICUBeds(15); // fallback to default
      } finally {
        setLoadingActiveICUBeds(false);
      }
    };

    fetchActiveICUBeds();
  }, []);

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
        let summaryData: any = {};
        let occupancyData: any[] = [];

        if (response && typeof response === 'object') {
          // Extract summary data
          if (response.summary && typeof response.summary === 'object') {
            summaryData = response.summary;
          } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
            summaryData = response.data;
          } else if (response.statistics && typeof response.statistics === 'object' && !Array.isArray(response.statistics)) {
            summaryData = response.statistics;
          } else if (response.icuStatistics && typeof response.icuStatistics === 'object' && !Array.isArray(response.icuStatistics)) {
            summaryData = response.icuStatistics;
          } else if (!Array.isArray(response)) {
            summaryData = response;
          }

          // Extract occupancy data
          if (response.data && Array.isArray(response.data)) {
            occupancyData = response.data;
          } else if (response.occupancy && Array.isArray(response.occupancy)) {
            occupancyData = response.occupancy;
          } else if (response.icuOccupancy && Array.isArray(response.icuOccupancy)) {
            occupancyData = response.icuOccupancy;
          }

          icuData = summaryData; // Use summary for stats extraction
        }

        console.log('Extracted icuData:', JSON.stringify(icuData, null, 2));
        console.log('icuData keys:', Object.keys(icuData || {}));

        // Helper to extract with variations (exact, case-insensitive, partial, nested)
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
              console.log(`ICU - Found nested value for field "${field}":`, nestedValue);
              return nestedValue;
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
          'totalICUPatients','totalPatients', 'TotalPatients', 'total_patients', 'Total_Patients',
          'total', 'Total', 'totalIcuPatients', 'TotalIcuPatients',
          'icuPatients', 'IcuPatients', 'patientCount', 'PatientCount'
        ], 0));

        const critical = safeNumber(extractField(icuData, [
          'totalCriticalPatients','critical', 'Critical', 'criticalPatients', 'CriticalPatients',
          'critical_patients', 'Critical_Patients', 'criticalCount', 'CriticalCount'
        ], 0));

        const onVentilator = safeNumber(extractField(icuData, [
          'totalOnVentilator','onVentilator', 'OnVentilator', 'on_ventilator', 'On_Ventilator',
          'ventilator', 'Ventilator', 'ventilatorPatients', 'VentilatorPatients',
          'ventilator_patients', 'Ventilator_Patients', 'ventilatorCount', 'VentilatorCount'
        ], 0));

        const avgStayDuration = safeNumber(extractField(icuData, [
          'averageStayDays','avgStayDuration', 'AvgStayDuration', 'avg_stay_duration', 'Avg_Stay_Duration',
          'averageStayDuration', 'AverageStayDuration', 'avgStay', 'AvgStay',
          'averageStay', 'AverageStay', 'avgDuration', 'AvgDuration'
        ], 0));

        // Extract occupancy trend data
        const occupancyRaw = extractField(icuData, [
          'periodCount','occupancy', 'Occupancy', 'occupancyTrend', 'OccupancyTrend',
          'trend', 'Trend', 'dailyOccupancy', 'DailyOccupancy',
          'occupancyData', 'OccupancyData', 'icuOccupancy', 'IcuOccupancy',
          'icu_occupancy', 'Icu_Occupancy', 'data', 'Data'
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
            ], totalICUBeds), totalICUBeds);

            return {
              date: dateLabel,
              occupied,
              total,
            };
          }).filter((entry: ICUOccupancyEntry) => entry.date);
        } else if (occupancyRaw && typeof occupancyRaw === 'object' && !Array.isArray(occupancyRaw)) {
          // If it's an object, try to extract as a single entry or convert to array
          const dateLabel = String(extractField(occupancyRaw, ['date', 'Date'], '')).trim() || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const occupied = safeNumber(extractField(occupancyRaw, ['occupied', 'Occupied'], 0), 0);
          const total = safeNumber(extractField(occupancyRaw, ['total', 'Total'], totalICUBeds), totalICUBeds);
          if (dateLabel) {
            mappedOccupancy = [{ date: dateLabel, occupied, total }];
          }
        }

        // If response itself is an array, treat it as occupancy data
        if (Array.isArray(response)) {
          mappedOccupancy = response.map((item: any) => {
            const dateLabel = String(extractField(item, ['date', 'Date', 'day', 'Day'], '')).trim() || '';
            const occupied = safeNumber(extractField(item, ['occupied', 'Occupied', 'count', 'Count'], 0), 0);
            const total = safeNumber(extractField(item, ['total', 'Total', 'capacity', 'Capacity'], totalICUBeds), totalICUBeds);
            return { date: dateLabel, occupied, total };
          }).filter(entry => entry.date);
        } else if (response?.data && Array.isArray(response.data)) {
          mappedOccupancy = response.data.map((item: any) => {
            const dateLabel = String(extractField(item, ['date', 'Date', 'day', 'Day'], '')).trim() || '';
            const occupied = safeNumber(extractField(item, [
              'occupied', 'Occupied', 'count', 'Count', 'totalICUPatients', 'totalICUPatients',
              'totalIcuPatients', 'total_icu_patients', 'icuPatients', 'icu_patients'
            ], 0), 0);
            const total = safeNumber(extractField(item, ['total', 'Total', 'capacity', 'Capacity'], totalICUBeds), totalICUBeds);
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
  }, [reportType, selectedDate, totalICUBeds]);

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
            <Button variant="outline" className="gap-2" onClick={exportToPDF}>
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
            {loadingOpdStats ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">Total OPD Patients</p>
                    <FileText className="size-5 text-blue-600" />
                  </div>
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading OPD statistics...</p>
                  </div>
                </CardContent>
              </Card>
            ) : opdStatsError ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">Total OPD Patients</p>
                    <FileText className="size-5 text-blue-600" />
                  </div>
                  <div className="text-center py-4">
                    <p className="text-sm text-red-600 mb-2">{opdStatsError}</p>
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">Total OPD Patients</p>
                    <FileText className="size-5 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {totalOpdPatients}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {reportType === 'daily' ? 'Today' : 'This week'}
                  </p>
                </CardContent>
              </Card>
            )}

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
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{peakHours}</h3>
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
              {loadingDepartmentAdmissions ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Loading department admissions...
                </div>
              ) : departmentAdmissionsError ? (
                <div className="text-center py-12 text-red-600">
                  <p className="mb-2">{departmentAdmissionsError}</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentAdmissions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
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
                    <h3 className="text-2xl font-bold text-gray-900">{icuStats.totalPatients}/{totalICUBeds}</h3>
                    <p className="text-xs text-gray-500">
                      {icuStats.totalPatients > 0 ? `${Math.round((icuStats.totalPatients / totalICUBeds) * 100)}% occupancy` : '0% occupancy'}
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
                  {(icuOccupancy && Array.isArray(icuOccupancy) && icuOccupancy.length > 0) ? (
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

