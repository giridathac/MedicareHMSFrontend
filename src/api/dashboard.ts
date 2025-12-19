// Dashboard API service
import { apiRequest } from './base';
import { DashboardStats, ChartData, DoctorQueue } from '../types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const stubStats: DashboardStats = {
  opdPatientsToday: 0, // Fallback value, will be replaced by API
  activeTokens: 0, // Fallback value, will be replaced by API
  ipdAdmissions: 0, // Fallback value, will be replaced by API
  otScheduled: 0, // Fallback value, will be replaced by API
  icuOccupied: '0/0', // Fallback value, will be replaced by API
  totalPatients: 0, // Fallback value, will be replaced by API
};

const stubOpdData: ChartData[] = [
  { day: 'Mon', patients: 98 },
  { day: 'Tue', patients: 112 },
  { day: 'Wed', patients: 95 },
  { day: 'Thu', patients: 124 },
  { day: 'Fri', patients: 108 },
  { day: 'Sat', patients: 87 },
  { day: 'Sun', patients: 45 },
];

const stubAdmissionData: ChartData[] = [
  { name: 'Regular Ward', value: 45, color: '#3b82f6' },
  { name: 'Special Room', value: 28, color: '#8b5cf6' },
  { name: 'Shared Room', value: 16, color: '#06b6d4' },
];

const stubDoctorQueue: DoctorQueue[] = [
  { doctor: 'Dr. Sarah Johnson', specialty: 'Cardiology', type: 'inhouse', waiting: 8, consulting: 1, completed: 15 },
  { doctor: 'Dr. Michael Chen', specialty: 'Orthopedics', type: 'inhouse', waiting: 12, consulting: 1, completed: 11 },
  { doctor: 'Dr. James Miller', specialty: 'Neurology', type: 'consulting', waiting: 6, consulting: 1, completed: 9 },
  { doctor: 'Dr. Emily Davis', specialty: 'General Medicine', type: 'inhouse', waiting: 15, consulting: 1, completed: 18 },
  { doctor: 'Dr. Robert Lee', specialty: 'Pediatrics', type: 'consulting', waiting: 6, consulting: 1, completed: 12 },
];

// Helper function to get default colors for pie chart
function getDefaultColor(index: number): string {
  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];
  return colors[index % colors.length];
}

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    try {
      // Fetch OPD Patients Today count, Active Tokens count, IPD Admissions count, OT Scheduled count, ICU Occupied count, Total ICU Beds count, and Total Patients count in parallel
      // Each endpoint has individual error handling to prevent one failure from breaking the entire dashboard
      const [opdCountResponse, activeTokensResponse, ipdCountResponse, otScheduledResponse, icuOccupiedResponse, icuTotalResponse, totalPatientsResponse] = await Promise.all([
        apiRequest<any>('/dashboard/count/today-opd').catch(err => {
          console.warn('Failed to fetch OPD count:', err);
          return null;
        }),
        apiRequest<any>('/dashboard/count/active-tokens').catch(err => {
          console.warn('Failed to fetch active tokens count:', err);
          return null;
        }),
        apiRequest<any>('/dashboard/count/today-ipd').catch(err => {
          console.warn('Failed to fetch IPD admissions count:', err);
          return null;
        }),
        apiRequest<any>('/dashboard/count/today-scheduled').catch(err => {
          console.warn('Failed to fetch OT scheduled count:', err);
          return null;
        }),
        apiRequest<any>('/dashboard/icu-occupied-count').catch(err => {
          console.warn('Failed to fetch ICU occupied count:', err);
          return null;
        }),
        apiRequest<any>('/dashboard/icu-total-count').catch(err => {
          console.warn('Failed to fetch ICU total count:', err);
          return null;
        }),
        apiRequest<any>('/dashboard/active-patients-count').catch(err => {
          console.warn('Failed to fetch total patients count:', err);
          return null;
        }),
      ]);
      
      console.log('OPD Patients Today count fetched from API:', opdCountResponse);
      console.log('Active Tokens count fetched from API:', activeTokensResponse);
      console.log('IPD Admissions count fetched from API:', ipdCountResponse);
      console.log('OT Scheduled count fetched from API:', otScheduledResponse);
      console.log('ICU Occupied count fetched from API:', icuOccupiedResponse);
      console.log('Total ICU Beds count fetched from API:', icuTotalResponse);
      console.log('Total Patients count fetched from API:', totalPatientsResponse);
      
      // Handle different response structures: { data: {...} } or direct object
      const opdCountData = opdCountResponse?.data || opdCountResponse;
      const activeTokensData = activeTokensResponse?.data || activeTokensResponse;
      const ipdCountData = ipdCountResponse?.data || ipdCountResponse;
      const otScheduledData = otScheduledResponse?.data || otScheduledResponse;
      const icuOccupiedData = icuOccupiedResponse?.data || icuOccupiedResponse;
      const icuTotalData = icuTotalResponse?.data || icuTotalResponse;
      const totalPatientsData = totalPatientsResponse?.data || totalPatientsResponse;
      
      // Extract OPD patients count from the response
      const opdPatientsCount = Number(
        opdCountData?.count || 
        opdCountData?.Count || 
        opdCountData?.opdPatientsToday || 
        opdCountData?.OpdPatientsToday || 
        opdCountData?.opdPatients || 
        opdCountData?.OpdPatients || 
        0
      );
      
      // Extract active tokens count from the response
      const activeTokensCount = Number(
        activeTokensData?.count || 
        activeTokensData?.Count || 
        activeTokensData?.activeTokens || 
        activeTokensData?.ActiveTokens || 
        activeTokensData?.tokens || 
        activeTokensData?.Tokens || 
        0
      );
      
      // Extract IPD admissions count from the response
      const ipdAdmissionsCount = Number(
        ipdCountData?.count || 
        ipdCountData?.Count || 
        ipdCountData?.ipdAdmissions || 
        ipdCountData?.IpdAdmissions || 
        ipdCountData?.ipd || 
        ipdCountData?.Ipd || 
        0
      );
      
      // Extract OT scheduled count from the response
      const otScheduledCount = Number(
        otScheduledData?.count || 
        otScheduledData?.Count || 
        otScheduledData?.otScheduled || 
        otScheduledData?.OtScheduled || 
        otScheduledData?.ot || 
        otScheduledData?.Ot || 
        0
      );
      
      // Extract ICU occupied count from the response
      const icuOccupiedCount = Number(
        icuOccupiedData?.count || 
        icuOccupiedData?.Count || 
        icuOccupiedData?.occupied || 
        icuOccupiedData?.Occupied || 
        icuOccupiedData?.icuOccupied || 
        icuOccupiedData?.IcuOccupied || 
        0
      );
      
      // Extract total ICU beds count from the response
      const icuTotalCount = Number(
        icuTotalData?.count || 
        icuTotalData?.Count || 
        icuTotalData?.total || 
        icuTotalData?.Total || 
        icuTotalData?.totalBeds || 
        icuTotalData?.TotalBeds || 
        icuTotalData?.totalICUBeds || 
        icuTotalData?.TotalICUBeds || 
        0
      );
      
      // Extract total patients count from the response
      const totalPatientsCount = Number(
        totalPatientsData?.count || 
        totalPatientsData?.Count || 
        totalPatientsData?.totalPatients || 
        totalPatientsData?.TotalPatients || 
        totalPatientsData?.activePatients || 
        totalPatientsData?.ActivePatients || 
        totalPatientsData?.total || 
        totalPatientsData?.Total || 
        0
      );
      
      // Format ICU occupied as "occupied/total"
      const icuOccupiedValue = `${icuOccupiedCount}/${icuTotalCount}`;
      
      // Return stats with all values from API
      const mappedStats: DashboardStats = {
        opdPatientsToday: opdPatientsCount,
        activeTokens: activeTokensCount,
        ipdAdmissions: ipdAdmissionsCount,
        otScheduled: otScheduledCount,
        icuOccupied: icuOccupiedValue,
        totalPatients: totalPatientsCount,
      };
      
      console.log('Mapped dashboard stats:', mappedStats);
      return mappedStats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback to stub data on error
      await delay(300);
      return Promise.resolve(stubStats);
    }
  },

  /**
   * Fetches OPD Patient Flow - Weekly data for the bar chart
   * 
   * EXPECTED API RESPONSE STRUCTURES:
   * 
   * Option 1: Direct Array (Preferred)
   * [
   *   { day: "Mon", patients: 98 },
   *   { day: "Tue", patients: 112 }
   * ]
   * 
   * Option 2: Object with 'data' property (Most Common)
   * {
   *   "success": true,
   *   "message": "OPD Patient Flow data retrieved successfully",
   *   "data": [
   *     { day: "Mon", patients: 98 },
   *     { day: "Tue", patients: 112 }
   *   ]
   * }
   * 
   * EXPECTED ITEM STRUCTURE (each object in the array):
   * 
   * For DAY (day of week):
   * - day, Day
   * - date, Date
   * - dayName, DayName
   * - weekday, Weekday
   * 
   * For PATIENTS (count):
   * - patients, Patients
   * - count, Count
   * - patientCount, PatientCount
   * - value, Value
   * - total, Total
   */
  async getOpdData(): Promise<ChartData[]> {
    try {
      console.log('Fetching OPD patient flow weekly from API: /opd-patient-flow-weekly');
      
      const response = await apiRequest<any>('/dashboard/opd-patient-flow-weekly');
      console.log('OPD patient flow weekly API response (raw):', JSON.stringify(response, null, 2));
      console.log('OPD patient flow weekly API response type:', typeof response);
      console.log('OPD patient flow weekly API response isArray:', Array.isArray(response));
      
      // Handle different response structures more robustly
      let opdFlowData: any[] = [];
      
      // Log all response keys for debugging
      if (response && typeof response === 'object') {
        console.log('All response keys:', Object.keys(response));
        console.log('Response structure:', {
          hasSuccess: 'success' in response,
          hasMessage: 'message' in response,
          hasData: 'data' in response,
          dataType: response.data ? typeof response.data : 'undefined',
          dataIsArray: Array.isArray(response.data),
        });
      }
      
      // Try multiple ways to extract the data array
      if (Array.isArray(response)) {
        // Response is directly an array
        opdFlowData = response;
        console.log('Extracted data: Response is direct array');
      } else if (response && typeof response === 'object') {
        // Response is an object, try to find the array
        // Check response.data first (most common structure)
        if (Array.isArray(response.data)) {
          opdFlowData = response.data;
          console.log('Extracted data from response.data');
        } 
        // Check other common property names
        else if (Array.isArray(response.opdFlow)) {
          opdFlowData = response.opdFlow;
          console.log('Extracted data from response.opdFlow');
        } else if (Array.isArray(response.weeklyData)) {
          opdFlowData = response.weeklyData;
          console.log('Extracted data from response.weeklyData');
        } else if (Array.isArray(response.flow)) {
          opdFlowData = response.flow;
          console.log('Extracted data from response.flow');
        } else if (Array.isArray(response.result)) {
          opdFlowData = response.result;
          console.log('Extracted data from response.result');
        } else if (Array.isArray(response.items)) {
          opdFlowData = response.items;
          console.log('Extracted data from response.items');
        } else if (Array.isArray(response.records)) {
          opdFlowData = response.records;
          console.log('Extracted data from response.records');
        } else {
          // Try to find any array property in the response (excluding common non-data properties)
          const excludeKeys = ['success', 'message', 'status', 'code', 'error', 'errors'];
          const arrayKeys = Object.keys(response).filter(
            key => !excludeKeys.includes(key.toLowerCase()) && Array.isArray(response[key])
          );
          
          if (arrayKeys.length > 0) {
            opdFlowData = response[arrayKeys[0]];
            console.log(`Extracted data from response.${arrayKeys[0]} (auto-detected array property)`);
            console.log(`Found ${arrayKeys.length} array properties:`, arrayKeys);
          } else {
            console.error('Unexpected OPD patient flow weekly response structure:', response);
            console.error('Response keys:', Object.keys(response || {}));
            console.error('Response values:', Object.values(response || {}).map(v => typeof v));
            console.error('Could not find array data in response, returning stub data');
            return [...stubOpdData];
          }
        }
      } else {
        console.warn('Unexpected OPD patient flow weekly response type:', typeof response);
        console.warn('Response:', response);
        return [...stubOpdData];
      }
      
      console.log(`OPD flow data length: ${opdFlowData.length}`);
      if (opdFlowData.length > 0) {
        console.log('First item in OPD flow data:', opdFlowData[0]);
        console.log('All keys in first item:', Object.keys(opdFlowData[0] || {}));
      }
      
      if (opdFlowData.length === 0) {
        console.warn('OPD patient flow weekly API returned empty array, returning stub data');
        return [...stubOpdData];
      }
      
      // Map backend response to ChartData interface for bar chart
      const mappedData: ChartData[] = opdFlowData
        .map((item: any, index: number) => {
          // Handle different field name variations for day
          const day = 
            item.day || item.Day || 
            item.date || item.Date ||
            item.dayName || item.DayName ||
            item.weekday || item.Weekday ||
            item.dayOfWeek || item.DayOfWeek ||
            `Day ${index + 1}`;
          
          // Handle different field name variations for patients count
          const patients = Number(
            item.patients || item.Patients || 
            item.count || item.Count || 
            item.patientCount || item.PatientCount || 
            item.value || item.Value || 
            item.total || item.Total ||
            item.opdPatients || item.OpdPatients ||
            0
          );
          
          const mappedItem: ChartData = {
            day,
            patients,
          };
          
          return mappedItem;
        })
        .filter((item: ChartData) => {
          // Filter out items with invalid values (NaN or null) but keep 0 values
          const hasValidValue = item.patients !== undefined && item.patients !== null && !isNaN(item.patients);
          const hasValidDay = item.day && item.day.trim() !== '';
          return hasValidValue && hasValidDay;
        });
      
      console.log(`Mapped ${mappedData.length} OPD patient flow weekly records (from ${opdFlowData.length} total)`);
      console.log('Final mapped OPD patient flow weekly data:', JSON.stringify(mappedData, null, 2));
      
      // Check if all values are 0
      const totalValue = mappedData.reduce((sum, item) => sum + (item.patients || 0), 0);
      console.log('Total patients value:', totalValue);
      
      if (totalValue === 0 && mappedData.length > 0) {
        console.warn('All OPD patient flow values are 0, chart may not display properly');
      }
      
      // Only return stub data if we truly have no valid data
      if (mappedData.length === 0) {
        console.warn('No valid OPD patient flow weekly data after mapping, using stub data');
        return [...stubOpdData];
      }
      
      // Return the mapped data from API
      console.log('Returning mapped API data (not stub data)');
      return mappedData;
    } catch (error) {
      console.error('Error fetching OPD patient flow weekly:', error);
      // Fallback to stub data on error
      await delay(200);
      return Promise.resolve([...stubOpdData]);
    }
  },

  /**
   * Fetches IPD Room Distribution data for the pie chart
   * 
   * EXPECTED API RESPONSE STRUCTURES:
   * 
   * Option 1: Direct Array (Preferred)
   * [
   *   { name: "Regular Ward", value: 45, color: "#3b82f6" },
   *   { name: "Special Room", value: 28, color: "#8b5cf6" }
   * ]
   * 
   * Option 2: Object with 'data' property (Most Common)
   * {
   *   "success": true,
   *   "message": "IPD Room Distribution data retrieved successfully",
   *   "data": [
   *     { name: "Regular Ward", value: 45, color: "#3b82f6" },
   *     { name: "Special Room", value: 28, color: "#8b5cf6" }
   *   ]
   * }
   * 
   * Option 3: Object with other array properties
   * - response.roomDistribution
   * - response.distribution
   * - response.rooms
   * - response.result
   * - response.items
   * - response.records
   * - Any other array property (auto-detected)
   * 
   * EXPECTED ITEM STRUCTURE (each object in the array):
   * 
   * Required Fields (at least one of each category):
   * 
   * For NAME (room category/type):
   * - name, Name
   * - roomType, RoomType
   * - wardName, WardName
   * - roomName, RoomName
   * - roomCategory, RoomCategory
   * - category, Category
   * - type, Type
   * - ward, Ward
   * - label, Label
   * 
   * For VALUE (count/number):
   * - value, Value
   * - count, Count
   * - occupancy, Occupancy
   * - patientCount, PatientCount
   * - admissions, Admissions
   * - totalPatients, TotalPatients
   * - occupied, Occupied
   * - beds, Beds
   * - total, Total
   * 
   * Optional Fields:
   * - color, Color (hex color code, e.g., "#3b82f6")
   *   If not provided, default colors will be assigned automatically
   * 
   * EXAMPLE VALID RESPONSES:
   * 
   * Example 1 (Simple):
   * {
   *   "success": true,
   *   "data": [
   *     { "name": "Regular Ward", "value": 45 },
   *     { "name": "Special Room", "value": 28 },
   *     { "name": "Shared Room", "value": 16 }
   *   ]
   * }
   * 
   * Example 2 (With different field names):
   * {
   *   "success": true,
   *   "data": [
   *     { "roomType": "Regular Ward", "count": 45, "color": "#3b82f6" },
   *     { "roomType": "Special Room", "count": 28, "color": "#8b5cf6" }
   *   ]
   * }
   * 
   * Example 3 (PascalCase):
   * {
   *   "success": true,
   *   "data": [
   *     { "RoomCategory": "Regular Ward", "PatientCount": 45 },
   *     { "RoomCategory": "Special Room", "PatientCount": 28 }
   *   ]
   * }
   */
  async getAdmissionData(): Promise<ChartData[]> {
    try {
      console.log('Fetching IPD room distribution from API: /dashboard/ipd-room-distribution');
      
      const response = await apiRequest<any>('/dashboard/ipd-room-distribution');
      console.log('IPD room distribution API response (raw):', JSON.stringify(response, null, 2));
      console.log('IPD room distribution API response type:', typeof response);
      console.log('IPD room distribution API response isArray:', Array.isArray(response));
      
      // Handle different response structures more robustly
      let distributionData: any[] = [];
      
      // Log all response keys for debugging
      if (response && typeof response === 'object') {
        console.log('All response keys:', Object.keys(response));
        console.log('Response structure:', {
          hasSuccess: 'success' in response,
          hasMessage: 'message' in response,
          hasData: 'data' in response,
          dataType: response.data ? typeof response.data : 'undefined',
          dataIsArray: Array.isArray(response.data),
        });
      }
      
      // Try multiple ways to extract the data array
      if (Array.isArray(response)) {
        // Response is directly an array
        distributionData = response;
        console.log('Extracted data: Response is direct array');
      } else if (response && typeof response === 'object') {
        // Response is an object, try to find the array
        // Check response.data first (most common structure)
        if (Array.isArray(response.data)) {
          distributionData = response.data;
          console.log('Extracted data from response.data');
        } 
        // Check other common property names
        else if (Array.isArray(response.roomDistribution)) {
          distributionData = response.roomDistribution;
          console.log('Extracted data from response.roomDistribution');
        } else if (Array.isArray(response.distribution)) {
          distributionData = response.distribution;
          console.log('Extracted data from response.distribution');
        } else if (Array.isArray(response.rooms)) {
          distributionData = response.rooms;
          console.log('Extracted data from response.rooms');
        } else if (Array.isArray(response.result)) {
          distributionData = response.result;
          console.log('Extracted data from response.result');
        } else if (Array.isArray(response.items)) {
          distributionData = response.items;
          console.log('Extracted data from response.items');
        } else if (Array.isArray(response.records)) {
          distributionData = response.records;
          console.log('Extracted data from response.records');
        } else {
          // Try to find any array property in the response (excluding common non-data properties)
          const excludeKeys = ['success', 'message', 'status', 'code', 'error', 'errors'];
          const arrayKeys = Object.keys(response).filter(
            key => !excludeKeys.includes(key.toLowerCase()) && Array.isArray(response[key])
          );
          
          if (arrayKeys.length > 0) {
            distributionData = response[arrayKeys[0]];
            console.log(`Extracted data from response.${arrayKeys[0]} (auto-detected array property)`);
            console.log(`Found ${arrayKeys.length} array properties:`, arrayKeys);
          } else {
            console.error('Unexpected IPD room distribution response structure:', response);
            console.error('Response keys:', Object.keys(response || {}));
            console.error('Response values:', Object.values(response || {}).map(v => typeof v));
            console.error('Could not find array data in response, returning stub data');
            return [...stubAdmissionData];
          }
        }
      } else {
        console.warn('Unexpected IPD room distribution response type:', typeof response);
        console.warn('Response:', response);
        return [...stubAdmissionData];
      }
      
      console.log(`Distribution data length: ${distributionData.length}`);
      if (distributionData.length > 0) {
        console.log('First item in distribution data:', distributionData[0]);
        console.log('All keys in first item:', Object.keys(distributionData[0] || {}));
      }
      
      if (distributionData.length === 0) {
        console.warn('IPD room distribution API returned empty array, returning stub data');
        return [...stubAdmissionData];
      }
      
      // Map backend response to ChartData interface for pie chart
      const mappedData: ChartData[] = distributionData
        .map((item: any, index: number) => {
          // Handle different field name variations (camelCase, PascalCase, etc.)
          // Try many possible field names for the room name/category
          const name = 
            item.name || item.Name || 
            item.roomType || item.RoomType || 
            item.wardName || item.WardName || 
            item.roomName || item.RoomName || 
            item.roomCategory || item.RoomCategory || 
            item.category || item.Category ||
            item.type || item.Type ||
            item.ward || item.Ward ||
            item.label || item.Label ||
            `Room ${index + 1}`;
          
          // Try many possible field names for the count/value
          const value = Number(
            item.value || item.Value || 
            item.count || item.Count || 
            item.occupancy || item.Occupancy || 
            item.patientCount || item.PatientCount || 
            item.admissions || item.Admissions || 
            item.totalPatients || item.TotalPatients ||
            item.occupied || item.Occupied ||
            item.beds || item.Beds ||
            item.total || item.Total ||
            0
          );
          
          // Use color from response or assign default colors
          const color = item.color || item.Color || getDefaultColor(index);
          
          const mappedItem: ChartData = {
            name,
            value,
            color,
          };
          
          return mappedItem;
        })
        .filter((item: ChartData) => {
          // Filter out items with invalid values (NaN or null) but keep 0 values
          const hasValidValue = item.value !== undefined && item.value !== null && !isNaN(item.value);
          const hasValidName = item.name && item.name.trim() !== '';
          return hasValidValue && hasValidName;
        });
      
      console.log(`***********************Mapped ${mappedData.length} IPD room distribution records (from ${distributionData.length} total)`);
      console.log('Final mapped IPD room distribution data:', JSON.stringify(mappedData, null, 2));
      
      // Check if all values are 0
      const totalValue = mappedData.reduce((sum, item) => sum + (item.value || 0), 0);
      console.log('Total value of all items:', totalValue);
      
      if (totalValue === 0 && mappedData.length > 0) {
        console.warn('All IPD room distribution values are 0, chart may not display properly');
      }
      
      // Only return stub data if we truly have no valid data
      if (mappedData.length === 0) {
        console.warn('No valid IPD room distribution data after mapping, using stub data');
        return [...stubAdmissionData];
      }
      
      // Return the mapped data from API
      console.log('Returning mapped API data (not stub data)');
      return mappedData;
    } catch (error) {
      console.error('Error fetching IPD room distribution:', error);
      // Fallback to stub data on error
      await delay(200);
      return Promise.resolve([...stubAdmissionData]);
    }
  },

  async getDoctorQueue(): Promise<DoctorQueue[]> {
    try {
      console.log('***********************Fetching doctor queue from API: /dashboard/doctor-wise-appointment-counts');
      
      const response = await apiRequest<any>('/dashboard/doctor-wise-appointment-counts');
      console.log('Doctor queue API response:', response);
      
      // Handle different response structures: { data: [...] } or direct array
      let queueData: any[] = [];
      
      if (response?.success && Array.isArray(response.data)) {
        queueData = response.data;
      } else if (Array.isArray(response?.data)) {
        queueData = response.data;
      } else if (Array.isArray(response)) {
        queueData = response;
      } else {
        console.warn('Unexpected doctor queue response structure:', response);
        return [...stubDoctorQueue];
      }
      
      if (queueData.length === 0) {
        console.log('Doctor queue API returned empty array');
        return [...stubDoctorQueue];
      }
      
      // Map backend response to DoctorQueue interface
      const mappedQueue: DoctorQueue[] = queueData.map((item: any) => {
        // Handle different field name variations (camelCase, PascalCase, etc.)
        const doctor = item.doctor || item.Doctor || item.doctorName || item.DoctorName || '';
        // Map Department Name to specialty field (prioritize departmentName over specialty)
        const specialty = item.departmentName || item.DepartmentName || item.department || item.Department || item.specialty || item.Specialty || item.specialization || item.Specialization || '';
        const type = (item.type || item.Type || item.doctorType || item.DoctorType || 'inhouse').toLowerCase() === 'consulting' ? 'consulting' : 'inhouse';
        const waiting = Number(item.waiting || item.Waiting || item.waitingCount || item.WaitingCount || 0);
        const consulting = Number(item.consulting || item.Consulting || item.consultingCount || item.ConsultingCount || 0);
        const completed = Number(item.completed || item.Completed || item.completedCount || item.CompletedCount || 0);
        
        return {
          doctor,
          specialty,
          type: type as 'inhouse' | 'consulting',
          waiting,
          consulting,
          completed,
        };
      });
      
      console.log(`Mapped ${mappedQueue.length} doctor queue records`);
      return mappedQueue;
    } catch (error) {
      console.error('Error fetching doctor queue:', error);
      // Fallback to stub data on error
      await delay(200);
      return Promise.resolve([...stubDoctorQueue]);
    }
  },
};

