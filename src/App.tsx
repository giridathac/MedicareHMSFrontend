import { Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList,
  Stethoscope,
  BedDouble,
  Scissors,
  HeartPulse,
  TestTube,
  Siren,
  FileBarChart,
  Activity,
  Building2,
  UserPlus,
  Shield,
  Building,
  Users,
  Home
} from 'lucide-react';

// Lazy load all components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const FrontDesk = lazy(() => import('./components/FrontDesk').then(m => ({ default: m.FrontDesk })));
const DoctorConsultation = lazy(() => import('./components/DoctorConsultation').then(m => ({ default: m.DoctorConsultation })));
const ManageConsultation = lazy(() => import('./components/ManageConsultation').then(m => ({ default: m.ManageConsultation })));
const Admissions = lazy(() => import('./components/Admissions').then(m => ({ default: m.Admissions })));
const OTManagement = lazy(() => import('./components/OTManagement').then(m => ({ default: m.OTManagement })));
const OTRoomsManagement = lazy(() => import('./components/OTRoomsManagement').then(m => ({ default: m.OTRoomsManagement })));
const ICUManagement = lazy(() => import('./components/ICUManagement').then(m => ({ default: m.ICUManagement })));
const Laboratory = lazy(() => import('./components/Laboratory').then(m => ({ default: m.Laboratory })));
const Emergency = lazy(() => import('./components/Emergency').then(m => ({ default: m.Emergency })));
const Reports = lazy(() => import('./components/Reports').then(m => ({ default: m.Reports })));
const PatientRegistration = lazy(() => import('./components/PatientRegistration').then(m => ({ default: m.PatientRegistration })));
const Roles = lazy(() => import('./components/Roles').then(m => ({ default: m.Roles })));
const Departments = lazy(() => import('./components/Departments').then(m => ({ default: m.Departments })));
const StaffManagement = lazy(() => import('./components/Staff').then(m => ({ default: m.StaffManagement })));
const RoomBeds = lazy(() => import('./components/RoomBeds').then(m => ({ default: m.RoomBeds })));
const ICUBedsManagement = lazy(() => import('./components/ICUBedsManagement').then(m => ({ default: m.ICUBedsManagement })));
const EmergencyBedManagement = lazy(() => import('./components/EmergencyBedManagement').then(m => ({ default: m.EmergencyBedManagement })));

// Wrapper component to extract route params for ManageConsultation
function ManageConsultationRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  if (!id) {
    return <Navigate to="/consultation" replace />;
  }
  
  return <ManageConsultation appointmentId={parseInt(id, 10)} onBack={() => navigate('/consultation')} />;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/frontdesk', label: 'Front Desk', icon: ClipboardList },
    { path: '/patient-registration', label: 'Patient Registration', icon: UserPlus },
    { path: '/consultation', label: 'Doctor Consultation', icon: Stethoscope },
    { path: '/laboratory', label: 'Laboratory', icon: TestTube },
    { path: '/emergency', label: 'Emergency', icon: Siren },
    { path: '/admissions', label: 'Admissions (IPD)', icon: BedDouble },
    { path: '/ot', label: 'OT Management', icon: Scissors },
    { path: '/ot-rooms', label: 'OT Rooms Management', icon: Building2 },
    { path: '/icu', label: 'ICU Management', icon: HeartPulse },
    { path: '/reports', label: 'Reports', icon: FileBarChart },
    { path: '/roles', label: 'Roles', icon: Shield },
    { path: '/departments', label: 'Departments', icon: Building },
    { path: '/staff', label: 'Staff', icon: Users },
    { path: '/room-beds', label: 'IPD Beds & Rooms', icon: Home },
    { path: '/icu-beds', label: 'ICU Bed Management', icon: HeartPulse },
    { path: '/emergency-beds', label: 'Emergency Bed Management', icon: BedDouble },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Activity className="size-8 text-blue-600" />
            <div>
              <h1 className="text-gray-900">MediCare HMS</h1>
              <p className="text-sm text-gray-500">Hospital Management</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              // Check if current path matches or starts with the item path (for nested routes)
              const isActive = location.pathname === item.path || 
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'));
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    title={item.label}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="size-5 flex-shrink-0" />
                    <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="size-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700">AD</span>
            </div>
            <div>
              <p className="text-sm text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Suspense fallback={
          <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden min-h-0 dashboard-scrollable" style={{ maxHeight: '100vh', minHeight: 0 }}>
            <div className="overflow-y-auto overflow-x-hidden flex-1 flex flex-col min-h-0">
              <div className="px-6 pt-6 pb-0 flex-shrink-0">
                <div className="text-center py-12 text-gray-600">Loading...</div>
              </div>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/frontdesk" element={<FrontDesk />} />
            <Route path="/patient-registration" element={<PatientRegistration />} />
            <Route path="/consultation" element={<DoctorConsultation onManageAppointment={(id) => navigate(`/consultation/${id}`)} />} />
            <Route path="/consultation/:id" element={<ManageConsultationRoute />} />
            <Route path="/admissions" element={<Admissions />} />
            <Route path="/ot" element={<OTManagement />} />
            <Route path="/ot-rooms" element={<OTRoomsManagement />} />
            <Route path="/icu" element={<ICUManagement />} />
            <Route path="/laboratory" element={<Laboratory />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/staff" element={<StaffManagement />} />
            <Route path="/room-beds" element={<RoomBeds />} />
            <Route path="/icu-beds" element={<ICUBedsManagement />} />
            <Route path="/emergency-beds" element={<EmergencyBedManagement />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}