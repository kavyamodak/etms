import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import TranzoEnterpriseLanding from './components/TranzoEnterpriseLanding';
import TranzoSignupPage from './components/TranzoSignupPage';
import EmailSignUp from './components/EmailSignUp';
import EmployeeDetailsForm from './components/EmployeeDetailsForm';
import DriverDetailsForm from './components/DriverDetailsForm';
import TranzoLoginPage from './components/TranzoLoginPage';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import DriverDashboard from './components/DriverDashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import TranzoEmployeeManagement from './components/TranzoEmployeeManagement';
import DriverManagement from './components/DriverManagement';
import VehicleManagement from './components/VehicleManagement';
import RoutesManagement from './components/RoutesManagement';
import TripsManagement from './components/TripsManagement';
import AddVehicleForm from './components/AddVehicleForm';
import UserTripsManagement from './components/UserTripsManagement';
import RouteMap from './components/RouteMap';
import ReportsPage from './components/ReportsPage';
import NotificationContainer from './components/NotificationContainer';
import PaymentsPage from './components/PaymentsPage';
import TransportDetails from './components/TransportDetails';
import RequestTransport from './components/RequestTransport';
import MapFullView from './components/MapFullView';
import FeedbackPage from './components/FeedbackPage';
import ProfilePage from './components/ProfilePage';
import DriverVehicleDetails from './components/DriverVehicleDetails';
import DriverAttendance from './components/DriverAttendance';
import DriverFeedback from './components/DriverFeedback';
import DriverRoutes from './components/DriverRoutes';
import LiveTracking from './components/LiveTracking';
import SOSButton from './components/SOSButton';
import EmergencyAlertCard from './components/EmergencyAlertCard';
import DriverPayments from './components/DriverPayments';

// ✅ FIXED ProtectedRoute
function ProtectedRoute({
  element,
}: {
  element: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl mb-6">
            <div className="w-8 h-8 text-white animate-spin">⏳</div>
            <h1 className="text-2xl text-white">TRANZO</h1>
          </div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{element}</>;
}

export default function App() {
  const { isLoading, user } = useAuth();
  const needsOnboarding = sessionStorage.getItem('needsOnboarding') === '1';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl mb-6">
            <div className="w-8 h-8 text-white animate-spin">⏳</div>
            <h1 className="text-2xl text-white">TRANZO</h1>
          </div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<TranzoEnterpriseLanding />} />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate
                to={
                  user.role === 'admin'
                    ? '/admin'
                    : needsOnboarding
                      ? (user.role === 'driver' ? '/driver-details' : '/employee-details')
                      : user.role === 'driver'
                        ? '/driver'
                        : '/user'
                }
                replace
              />
            ) : (
              <TranzoLoginPage />
            )
          }
        />
        <Route
          path="/signup"
          element={
            user ? (
              <Navigate
                to={
                  user.role === 'admin'
                    ? '/admin'
                    : needsOnboarding
                      ? (user.role === 'driver' ? '/driver-details' : '/employee-details')
                      : user.role === 'driver'
                        ? '/driver'
                        : '/user'
                }
                replace
              />
            ) : (
              <TranzoSignupPage />
            )
          }
        />
        <Route path="/employee-details" element={<ProtectedRoute element={<EmployeeDetailsForm />} />} />
        <Route path="/driver-details" element={<ProtectedRoute element={<DriverDetailsForm />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} />} />
        <Route path="/admin/users" element={<ProtectedRoute element={<TranzoEmployeeManagement />} />} />
        <Route path="/admin/drivers" element={<ProtectedRoute element={<DriverManagement />} />} />
        <Route path="/admin/drivers/:id" element={<ProtectedRoute element={<DriverDetailsForm />} />} />
        <Route path="/admin/vehicles" element={<ProtectedRoute element={<VehicleManagement />} />} />
        <Route path="/admin/vehicles/new" element={<ProtectedRoute element={<AddVehicleForm />} />} />
        <Route path="/admin/routes" element={<ProtectedRoute element={<RoutesManagement />} />} />
        <Route path="/admin/trips" element={<ProtectedRoute element={<TripsManagement />} />} />
        <Route path="/admin/tracking" element={<ProtectedRoute element={<LiveTracking />} />} />
        <Route path="/admin/payments" element={<ProtectedRoute element={<PaymentsPage />} />} />
        <Route path="/admin/reports" element={<ProtectedRoute element={<ReportsPage />} />} />

        {/* User Routes */}
        <Route path="/user" element={<ProtectedRoute element={<UserDashboard />} />} />
        <Route path="/user/trips" element={<ProtectedRoute element={<UserTripsManagement />} />} />
        <Route path="/user/request" element={<ProtectedRoute element={<RequestTransport />} />} />
        <Route path="/user/maps" element={<ProtectedRoute element={<RouteMap />} />} />
        <Route path="/user/feedback" element={<ProtectedRoute element={<FeedbackPage />} />} />
        <Route path="/user/transport-details/:id" element={<ProtectedRoute element={<TransportDetails />} />} />

        {/* Driver Routes */}
        <Route path="/driver" element={<ProtectedRoute element={<DriverDashboard />} />} />
        <Route path="/driver/routes" element={<ProtectedRoute element={<DriverRoutes />} />} />
        <Route path="/driver/vehicle-details" element={<ProtectedRoute element={<DriverVehicleDetails />} />} />
        <Route path="/driver/attendance" element={<ProtectedRoute element={<DriverAttendance />} />} />
        <Route path="/driver/feedback" element={<ProtectedRoute element={<DriverFeedback />} />} />
        <Route path="/driver/payments" element={<ProtectedRoute element={<DriverPayments />} />} />
        <Route path="/driver/transport-details/:id" element={<ProtectedRoute element={<TransportDetails />} />} />

        {/* Role-based redirect */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              element={
                user?.role === 'admin'
                  ? <AdminDashboard />
                  : user?.role === 'driver'
                    ? <DriverDashboard />
                    : <UserDashboard />
              }
            />
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Global SOS Emergency Button - Visible on all pages except admin */}
      <SOSButton />

      {/* Admin Emergency Alert Cards - Visible on admin pages */}
      <EmergencyAlertCard />

      {/* Global Notification Container */}
      <NotificationContainer />
    </Router>
  );
}