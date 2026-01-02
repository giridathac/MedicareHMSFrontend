import { Suspense, lazy, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
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
  Home,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

// Lazy load all components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const FrontDesk = lazy(() => import('./components/FrontDesk').then(m => ({ default: m.FrontDesk })));
const DoctorConsultation = lazy(() => import('./components/DoctorConsultation').then(m => ({ default: m.DoctorConsultation })));
const ManageConsultation = lazy(() => import('./components/ManageConsultation').then(m => ({ default: m.ManageConsultation })));
const Admissions = lazy(() => import('./components/Admissions').then(m => ({ default: m.default })));
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
const Doctors = lazy(() => import('./components/Doctors').then(m => ({ default: m.Doctors })));
const RoomBeds = lazy(() => import('./components/RoomBeds').then(m => ({ default: m.RoomBeds })));
const LabTests = lazy(() => import('./components/LabTests').then(m => ({ default: m.LabTests })));
const ICUBedsManagement = lazy(() => import('./components/ICUBedsManagement').then(m => ({ default: m.ICUBedsManagement })));
const EmergencyBedManagement = lazy(() => import('./components/EmergencyBedManagement').then(m => ({ default: m.EmergencyBedManagement })));
const ManageIPDAdmission = lazy(() => import('./components/ManageIPDAdmission').then(m => ({ default: m.ManageIPDAdmission })));
const ManageICUCase = lazy(() => import('./components/ManageICUCase').then(m => ({ default: m.ManageICUCase })));
const ICUNurseVisitVitals = lazy(() => import('./components/ICUNurseVisitVitals').then(m => ({ default: m.ICUNurseVisitVitals })));
const EditAdmission = lazy(() => import('./components/EditAdmission').then(m => ({ default: m.EditAdmission })));
const Login = lazy(() => import('./components/Login').then(m => ({ default: m.Login })));
const ResetPassword = lazy(() => import('./components/ResetPassword').then(m => ({ default: m.ResetPassword })));

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
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  const allNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/frontdesk', label: 'Front Desk', icon: ClipboardList },
    { path: '/patient-registration', label: 'Patient Registration', icon: UserPlus },
    { path: '/consultation', label: 'Doctor Consultation', icon: Stethoscope },
    { path: '/doctors', label: 'Doctors', icon: Stethoscope },
    { path: '/laboratory', label: 'Laboratory Tests Management', icon: TestTube },
    { path: '/admissions', label: 'Admissions (IPD)', icon: BedDouble },
    { path: '/emergency', label: 'Emergency', icon: Siren },
    { path: '/ot', label: 'OT Management', icon: Scissors },
    { path: '/icu', label: 'ICU Management', icon: HeartPulse },
    { path: '/roles', label: 'Roles', icon: Shield },
    { path: '/departments', label: 'Departments', icon: Building },
    { path: '/staff', label: 'Staff', icon: Users },
    { path: '/room-beds', label: 'IPD Beds & Rooms', icon: Home },
    { path: '/lab-tests', label: 'Laboratory Management - Tests Catalog', icon: TestTube },
    { path: '/icu-beds', label: 'ICU Bed Management', icon: HeartPulse },
    { path: '/ot-rooms', label: 'OT Rooms Management', icon: Building2 },
    { path: '/emergency-beds', label: 'Emergency Bed Management', icon: BedDouble },
    { path: '/reports', label: 'Reports', icon: FileBarChart },
  ];

  // Get user role from JWT token
  const getUserRoleFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const decoded: any = jwtDecode(token);
      console.log('Decoded token:', decoded);

      // Try different possible field names for role
      // Check if role is directly on decoded object
      if (decoded.role) return decoded.role;
      if (decoded.roleName) return decoded.roleName;
      if (decoded.RoleName) return decoded.RoleName; // Capital R and N
      if (decoded.userRole) return decoded.userRole;

      // Check if role is nested in data object
      if (decoded.data && decoded.data.role) return decoded.data.role;
      if (decoded.data && decoded.data.roleName) return decoded.data.roleName;
      if (decoded.data && decoded.data.RoleName) return decoded.data.RoleName;
      if (decoded.data && decoded.data.userRole) return decoded.data.userRole;

      console.warn('No role found in decoded token');
      return null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const userRole = getUserRoleFromToken();

  // Get user info from JWT token
  const getUserInfoFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { userName: 'Admin User', roleName: 'Administrator' };

      const decoded: any = jwtDecode(token);
      return {
        userName: decoded.userName || 'Admin User',
        roleName: decoded.RoleName || 'Administrator'
      };
    } catch (error) {
      console.error('Error decoding token for user info:', error);
      return { userName: 'Admin User', roleName: 'Administrator' };
    }
  };

  const userInfo = getUserInfoFromToken();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item => {
    const trimmedRole = userRole?.trim();
    
    if (trimmedRole === 'LabAdmin') {
      // Show only laboratory related menus for LabAdmin
      // return item.path === '/laboratory' || item.path === '/lab-tests';
      return item.path === '/laboratory';
    } else if (trimmedRole === 'OTAdmin') {
      // Show only OT related menus for OTAdmin
      // return item.path === '/ot' || item.path === '/ot-rooms';
      return item.path === '/ot';
    } else if (trimmedRole === 'ICUAdmin') {
      // Show only ICU related menus for ICUAdmin
      // return item.path === '/icu' || item.path === '/icu-beds';
      return item.path === '/icu';
    } else if (trimmedRole === 'IPDAdmin') {
      // Show only IPD related menus for IPDAdmin
      // return item.path === '/admissions' || item.path === '/room-beds' || item.path === '/manage-ipd-admission';
      return item.path === '/admissions' || item.path === '/manage-ipd-admission';
    } else if (trimmedRole === 'EmergencyAdmin') {
      // Show only Emergency related menus for EmergencyAdmin
      return item.path === '/emergency';
    } else if (trimmedRole === 'FrontDesk') {
      // Show only FrontDesk related menus for FrontDesk
      return item.path === '/frontdesk' || item.path === '/patient-registration' || item.path === '/consultation' || item.path === '/dashboard';
    } else if (trimmedRole === 'Doctor') {
      // Show only Doctor Consultation menu for Doctor
      return item.path === '/consultation';
    } else {
      // Show all menus for SuperAdmin and other roles
      return true;
    }
  });

  const isLoginPage = location.pathname === '/login' || location.pathname === '/reset-password';

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Sidebar - Hide on login page */}
      {!isLoginPage && (
        <aside className={`${isSidebarMinimized ? 'w-0' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 relative`} style={{ overflow: 'visible' }}>
          {!isSidebarMinimized && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Activity className="size-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h1 className="text-gray-900">MediCare HMS</h1>
                  <p className="text-sm text-gray-500">Hospital Management</p>
                </div>
              </div>
            </div>
          )}

          {!isSidebarMinimized && (
            <nav className="flex-1 p-4 overflow-y-auto relative">
              {/* Toggle Button - Left of Dashboard, at left edge of window (more visible) - Round circle (large) */}
              <button
                onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
                className="fixed left-0 z-50 hover:scale-110 transition-all cursor-pointer"
                title="Minimize sidebar"
                style={{
                  left: '0px',
                  transform: 'translateX(-28px)',
                  top: 'calc(6rem + 1rem)',
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '2px solid #d1d5db',
                  borderRadius: '50%',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              />

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
          )}


        
        

        {!isSidebarMinimized && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="size-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-700">{userInfo.userName.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm text-gray-900">{userInfo.userName}</p>
                <p className="text-xs text-gray-500">{userInfo.roleName}</p>                
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-500 hover:text-red-500 mt-1"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        )}
        </aside>
      )}

      {/* Toggle Button - When minimized, show at left edge - Round circle to expand (large, more visible) */}
      {!isLoginPage && isSidebarMinimized && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsSidebarMinimized(false);
          }}
          className="fixed left-0 z-[9999] hover:scale-110 transition-all cursor-pointer"
          title="Click to expand sidebar"
          style={{ 
            left: '0px',
            transform: 'translateX(-28px)', // Move 70% of 40px to the left, showing 30% (more than quarter)
            top: 'calc(6rem + 1rem)',
            pointerEvents: 'auto',
            width: '40px',
            height: '40px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '2px solid #d1d5db',
            borderRadius: '50%',
            outline: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        />
      )}

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
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/frontdesk" element={<FrontDesk />} />
            <Route path="/patient-registration" element={<PatientRegistration />} />
            <Route path="/consultation" element={<DoctorConsultation onManageAppointment={(id) => navigate(`/consultation/${id}`)} />} />
            <Route path="/consultation/:id" element={<ManageConsultationRoute />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/laboratory" element={<Laboratory />} />
            <Route path="/admissions" element={<Admissions />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/ot" element={<OTManagement />} />
            <Route path="/ot-rooms" element={<OTRoomsManagement />} />
            <Route path="/icu" element={<ICUManagement />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/staff" element={<StaffManagement />} />
            <Route path="/room-beds" element={<RoomBeds />} />
            <Route path="/lab-tests" element={<LabTests />} />
            <Route path="/icu-beds" element={<ICUBedsManagement />} />
            <Route path="/emergency-beds" element={<EmergencyBedManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/manage-ipd-admission" element={<ManageIPDAdmission />} />
            <Route path="/manage-icu-case" element={<ManageICUCase />} />
            <Route path="/icu-nurse-visit-vitals" element={<ICUNurseVisitVitals />} />
            <Route path="/edit-admission" element={<EditAdmission />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}