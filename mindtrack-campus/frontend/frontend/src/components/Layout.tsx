import { useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Leaf,
  Menu,
  X,
  LayoutDashboard,
  BarChart3,
  ShieldAlert,
  BookOpen,
  ScrollText,
  Settings,
  LogOut,
  ChevronRight,
  BookMarked,
  MessageSquareHeart,
  Bell,
  User,
  Moon,
  Clock,
  CircleHelp,
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { Button } from './Button';
import { DesktopNavLink } from './DesktopNavLink';
import { SidebarLink } from './SidebarLink';
import { ThemeToggle } from './ThemeToggle';
import { ProductTour } from './ProductTour';
import { getProductTourPage, type TourReplayRequest } from './productTourSteps';

export const Layout = () => {
  const { role, session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tourReplayRequest, setTourReplayRequest] = useState<TourReplayRequest | null>(null);
  const tourReplaySequence = useRef(0);
  const tourPage = getProductTourPage(location.pathname);

  const replayPageTour = () => {
    if (!tourPage) return;
    tourReplaySequence.current += 1;
    setTourReplayRequest({ page: tourPage, id: tourReplaySequence.current });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // The About page has its own standalone header and footer layout.
  if (location.pathname === '/about') {
    return (
      <div className="min-h-screen w-full bg-white dark:bg-slate-950">
        <Outlet />
      </div>
    );
  }

  const adminNavItems = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    { to: '/admin/analytics', label: 'Wellness Analytics', icon: BarChart3, exact: false },
    { to: '/admin/moderation', label: 'Moderation Queue', icon: ShieldAlert },
    { to: '/admin/resources', label: 'Resources', icon: BookOpen },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
    { to: '/admin/system', label: 'System Information', icon: Settings },
  ];

  // Admin surface layout: desktop sidebar + top status bar + content
  if (role === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">MindCare Ops</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle variant="icon" className="p-1.5 rounded-lg" />
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold rounded">
              Admin
            </span>
          </div>
        </header>

        {/* Mobile Drawer Overlay */}
        <div
          className={`fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity duration-200 md:hidden ${
            isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Mobile Drawer */}
        <aside
          className={`fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-slate-900 z-50 shadow-xl border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 ease-in-out flex flex-col md:hidden ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">MindCare Console</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="p-3 border-t border-brand-100 dark:border-slate-800 bg-brand-50/70 dark:bg-slate-900/80">
            <div className="mb-2 px-2 text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
              {session?.user?.email || 'admin@mindcare.internal'}
            </div>
            <ThemeToggle variant="sidebar" className="mb-2" />
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-brand-200 dark:border-slate-700 rounded-lg hover:bg-white/90 dark:hover:bg-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out
            </button>
          </div>
        </aside>

        {/* Desktop Sidebar (Persistent) */}
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-0 h-screen shrink-0 z-20">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">MindCare Console</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Admin Operations</p>
            </div>
          </div>

          <div className="px-4 pt-4 pb-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Navigation</span>
          </div>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-brand-100 dark:border-slate-800 bg-brand-50/70 dark:bg-slate-900/80">
            <div className="mb-2.5 px-1">
              <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                {session?.user?.email || 'admin@mindcare.internal'}
              </div>
              <div className="text-[10px] text-brand-700 dark:text-brand-400 font-medium">Authenticated Administrator</div>
            </div>
            <ThemeToggle variant="sidebar" className="mb-2.5" />
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-brand-200/80 dark:border-slate-700 rounded-lg hover:bg-white/90 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Log Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pt-14 md:pt-0">
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  // Student surface layout
  return (
    <div className="min-h-screen bg-[#F8F9FE] dark:bg-slate-950 flex flex-col text-gray-900 dark:text-slate-100 transition-colors duration-200">
      <ProductTour
        page={tourPage}
        userId={role === 'student' ? session?.user.id : undefined}
        replayRequest={tourReplayRequest}
      />
      {/* 1. TOP HEADER */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center sticky top-0 z-30 shadow-xs">
        {/* LEFT: Burger Menu (Mobile) & Logo */}
        <div className="flex items-center gap-3 md:w-1/4">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            data-tour="navigation"
            className="md:hidden p-2 -ml-2 text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-brand-900 dark:text-brand-300 tracking-tight flex items-center gap-2">
              <Leaf className="w-5 h-5 text-brand-600 dark:text-brand-400 hidden sm:block" /> MindCare
            </h1>
            <span className="px-2 py-0.5 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800/40 text-[10px] font-bold rounded-full uppercase tracking-wider hidden sm:block">
              Student
            </span>
          </div>
        </div>

        {/* CENTER: Desktop Nav Links */}
        <nav data-tour="navigation" className="hidden md:flex flex-1 justify-center items-center gap-8 mt-1">
          <DesktopNavLink to="/dashboard" label="Dashboard" />
          <DesktopNavLink to="/journal" label="My Journal" />
          <DesktopNavLink to="/resources" label="Resources" />
          <DesktopNavLink to="/mantra-wall" label="Freedom Wall" />
          <DesktopNavLink to="/profile" label="Profile" />
        </nav>

        {/* RIGHT: Notification, Theme Toggle & Logout Button */}
        <div className="flex items-center justify-end gap-3 md:w-1/4">
          <div data-tour="utilities" className="flex items-center gap-3">
            <NavLink
              to="/notifications"
              aria-label="Notifications"
              title="Notifications"
              className={({ isActive }) =>
                `p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center shadow-xs ${
                  isActive
                    ? 'bg-brand-50 border-brand-200 text-brand-600 dark:bg-brand-950/40 dark:border-brand-800 dark:text-brand-300'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-brand-300'
                }`
              }
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
            </NavLink>
            <ThemeToggle variant="icon" />
            {tourPage && (
              <button
                type="button"
                onClick={replayPageTour}
                className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 shadow-xs transition-all duration-200 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-brand-300"
                aria-label="Replay this page's tutorial"
                title="Replay tutorial"
              >
                <CircleHelp className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="hidden md:block">
            <Button
              variant="secondary"
              onClick={handleLogout}
              className="py-1.5 px-4 text-xs border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 shadow-2xs"
            >
              Log Out
            </Button>
          </div>
        </div>
      </header>

      {/* 2. MOBILE SIDEBAR OVERLAY & MENU */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 z-50 shadow-2xl border-r border-gray-100 dark:border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
          <h1 className="text-2xl font-black text-brand-900 dark:text-brand-300 tracking-tight flex items-center gap-2">
            <Leaf className="w-6 h-6 text-brand-600 dark:text-brand-400" /> MindCare
          </h1>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col" onClick={() => setIsMobileMenuOpen(false)}>
          <SidebarLink
            to="/dashboard"
            label="Dashboard"
            icon={<LayoutDashboard className="w-5 h-5" />}
          />
          <div className="px-6 mt-4 mb-2">
            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Assessments</span>
          </div>
          <SidebarLink
            to="/assessments"
            state={{ type: 'PHQ-9' }}
            label="PHQ-9 Screening"
            icon={<Moon className="w-5 h-5" />}
          />
          <SidebarLink
            to="/assessments"
            state={{ type: 'GAD-7' }}
            label="GAD-7 Screening"
            icon={<Clock className="w-5 h-5" />}
          />
          <div className="px-6 mt-4 mb-2">
            <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Your Space</span>
          </div>
          <SidebarLink
            to="/journal"
            label="My Journal"
            icon={<BookMarked className="w-5 h-5" />}
          />
          <SidebarLink
            to="/mantra-wall"
            label="Freedom Wall"
            icon={<MessageSquareHeart className="w-5 h-5" />}
          />
          <SidebarLink
            to="/resources"
            label="Resources"
            icon={<BookOpen className="w-5 h-5" />}
          />
          <SidebarLink
            to="/notifications"
            label="Notifications"
            icon={<Bell className="w-5 h-5" />}
          />
          <SidebarLink
            to="/profile"
            label="Profile"
            icon={<User className="w-5 h-5" />}
          />
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/90 flex flex-col gap-2.5">
          <ThemeToggle variant="sidebar" />
          <Button variant="secondary" onClick={handleLogout} className="w-full text-xs py-2 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200">
            Log Out
          </Button>
        </div>
      </aside>

      {/* 3. MAIN CONTENT AREA */}
      <main className="flex-1 w-full mx-auto p-4 md:p-8 max-w-md md:max-w-4xl pb-8">
        <Outlet />
      </main>
    </div>
  );
};
