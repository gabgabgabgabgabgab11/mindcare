import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './Button';

export const Layout = () => {
  const { role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper for Sidebar Links
  const SidebarLink = ({ to, label, icon, state }: { to: string; label: string; icon: React.ReactNode; state?: any }) => {
    // Check if active (including state checks for the assessments)
    const isActive = location.pathname === to && (!state || location.state?.type === state.type);
    
    return (
      <Link 
        to={to} 
        state={state}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-4 px-6 py-3.5 transition-colors ${isActive ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-600' : 'text-gray-500 hover:bg-gray-50 hover:text-purple-600'}`}
      >
        <div className={isActive ? 'text-purple-600' : 'text-gray-400'}>{icon}</div>
        <span className="text-sm font-bold">{label}</span>
      </Link>
    );
  };

  // Helper for Desktop Top Nav
  const DesktopNavLink = ({ to, label }: { to: string; label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={`text-sm font-bold transition-all ${isActive ? 'text-purple-600 border-b-2 border-purple-600 pb-1' : 'text-gray-500 hover:text-purple-600'}`}>
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FE] flex flex-col">
      
      {/* 1. TOP HEADER */}
      <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        
        {/* LEFT: Burger Menu (Mobile) & Logo */}
        <div className="flex items-center gap-3 md:w-1/4">
          {role === 'student' && (
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          )}
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-purple-900 tracking-tight flex items-center gap-2">
              <span className="text-purple-600 hidden sm:block">🌿</span> MindCare
            </h1>
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full uppercase tracking-wider hidden sm:block">
              {role === 'oss_admin' ? 'Admin' : 'Student'}
            </span>
          </div>
        </div>

        {/* CENTER: Desktop Nav Links */}
        <nav className="hidden md:flex flex-1 justify-center items-center gap-8 mt-1">
          {role === 'student' && (
            <>
              <DesktopNavLink to="/dashboard" label="Dashboard" />
              <DesktopNavLink to="/journal" label="My Journal" />
              <DesktopNavLink to="/small-wins" label="Small Wins" />
              <DesktopNavLink to="/resources" label="Resources" />
              <DesktopNavLink to="/wall" label="Freedom Wall" />
              <DesktopNavLink to="/profile" label="Profile" />
            </>
          )}
          {role === 'oss_admin' && (
            <>
              <DesktopNavLink to="/admin" label="Dashboard" />
              <DesktopNavLink to="/admin/moderation" label="Moderation Queue" />
              <DesktopNavLink to="/admin/users" label="Users" />
              <DesktopNavLink to="/admin/resources" label="Resources" />
            </>
          )}
        </nav>

        {/* RIGHT: Logout Button (Desktop) */}
        <div className="flex items-center justify-end gap-4 md:w-1/4">
          <div className="hidden md:block">
            <Button variant="secondary" onClick={handleLogout} className="py-1.5 px-4 text-xs border-gray-200 bg-white hover:bg-gray-50 text-gray-700">
              Log Out
            </Button>
          </div>
        </div>
      </header>

      {/* 2. MOBILE SIDEBAR OVERLAY & MENU */}
      {role === 'student' && (
        <>
          {/* Dark Overlay Background */}
          <div 
            className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sliding Sidebar */}
          <aside className={`fixed top-0 left-0 h-full w-70 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            
            {/* Sidebar Header */}
            <div className="p-6 flex items-center justify-between border-b border-gray-100">
              <h1 className="text-2xl font-black text-purple-900 tracking-tight flex items-center gap-2">
                <span className="text-purple-600">🌿</span> MindCare
              </h1>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Sidebar Links */}
            <div className="flex-1 overflow-y-auto py-4 flex flex-col">
              <SidebarLink to="/dashboard" label="Dashboard" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>} />
              
              <div className="px-6 mt-4 mb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assessments</span>
              </div>
              <SidebarLink to="/assessments" state={{ type: 'PHQ-9' }} label="PHQ-9 Screening" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>} />
              <SidebarLink to="/assessments" state={{ type: 'GAD-7' }} label="GAD-7 Screening" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} />
              
              <div className="px-6 mt-4 mb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Space</span>
              </div>
              <SidebarLink to="/journal" label="My Journal" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>} />
              <SidebarLink to="/small-wins" label="Small Wins" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>} />
              <SidebarLink to="/wall" label="Freedom Wall" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path></svg>} />
              <SidebarLink to="/resources" label="Resources" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>} />
              <SidebarLink to="/profile" label="Profile" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>} />
            </div>

            {/* Sidebar Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-400 font-bold text-center uppercase tracking-widest">
              PUP Santa Maria Campus<br/>Wellness Program 2026
            </div>
          </aside>
        </>
      )}

      {/* 3. MAIN CONTENT AREA */}
      <main className={`flex-1 w-full mx-auto p-4 md:p-8 ${role === 'student' ? 'max-w-md md:max-w-4xl pb-8' : 'max-w-7xl'}`}>
        <Outlet />
      </main>

    </div>
  );
};