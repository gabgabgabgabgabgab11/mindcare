import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Components & Pages
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { StudentDashboard } from './pages/StudentDashboard';
import { Assessments } from './pages/Assessments';
import { AdminDashboard } from './pages/AdminDashboard';
import { Journal } from './pages/Journal';
import { PrivacySettings } from './pages/PrivacySettings';
import { MantraWall } from './pages/MantraWall';
import { AdminModeration } from './pages/AdminModeration';
import { AdminResourceManagement } from './pages/AdminResourceManagement';
import { SystemInfo } from './pages/SystemInfo';
import { Resources } from './pages/Resources';
import { ProfessionalSupport } from './pages/ProfessionalSupport';
import { Profile } from './pages/Profile';
import { DailyCheckIn } from './pages/DailyCheckIn';
import { CreateAccount } from './pages/CreateAccount';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Notifications } from './pages/Notifications';
import { AuditLogs } from './pages/AuditLogs';
import { AdminAnalytics } from './pages/AdminAnalytics';
import { AboutUs } from './pages/AboutUs';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* ========================================== */}
            {/* FULL SCREEN PROTECTED ROUTES (No Layout)   */}
            {/* ========================================== */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/welcome" element={<Onboarding />} />
            </Route>

            {/* ========================================== */}
            {/* MAIN PROTECTED ROUTES (Wrapped in Layout)  */}
            {/* ========================================== */}
            <Route element={<Layout />}>
              
              {/* Student Only */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/check-in" element={<DailyCheckIn />} />
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/assessments" element={<Assessments />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/privacy" element={<PrivacySettings />} />
                <Route path="/mantra-wall" element={<MantraWall />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/support" element={<ProfessionalSupport />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/profile" element={<Profile />} />   
                <Route path="/profile/privacy" element={<PrivacySettings />} />
              </Route>

              {/* Admin Only */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/moderation" element={<AdminModeration />} />
                <Route path="/admin/resources" element={<AdminResourceManagement />} />
                <Route path="/admin/audit-logs" element={<AuditLogs />} />
                <Route path="/admin/system" element={<SystemInfo />} />
                <Route path="/admin/users" element={<Navigate to="/admin/system" replace />} />
              </Route>

            </Route>

            {/* Catch-All */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
