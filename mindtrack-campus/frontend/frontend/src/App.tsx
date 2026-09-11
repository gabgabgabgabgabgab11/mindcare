import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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
import { Resources } from './pages/Resources';
import { ProfessionalSupport } from './pages/ProfessionalSupport';
import { Profile } from './pages/Profile';
import { DailyCheckIn } from './pages/DailyCheckIn';
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          
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
              <Route path="/support" element={<ProfessionalSupport />} />
              <Route path="/profile" element={<Profile />} />   
              <Route path="/profile/privacy" element={<PrivacySettings />} />
            </Route>

            {/* Admin Only */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/moderation" element={<AdminModeration />} />
              <Route path="/admin/resources" element={<AdminResourceManagement />} />
            </Route>

          </Route>

          {/* Catch-All */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
