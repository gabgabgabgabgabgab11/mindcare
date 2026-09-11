import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const Profile = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Mock User Data
  const user = {
    name: 'Iskolar ng Bayan',
    email: 'student@iskolar.pup.edu.ph',
    course: 'BS Information Technology',
    campus: 'PUP Santa Maria Bulacan',
    initials: 'IB'
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full pb-6">
      
      {/* 1. Profile Banner & Avatar */}
      <div className="relative rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden mt-2">
        {/* Gradient Background */}
        <div className="h-32 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-600"></div>
        
        {/* Avatar (Overlapping) */}
        <div className="absolute top-16 left-6">
          <div className="w-24 h-24 bg-white rounded-full p-1.5 shadow-md">
            <div className="w-full h-full bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-3xl font-black">
              {user.initials}
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className="pt-12 pb-6 px-6">
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-sm text-gray-500 font-medium mb-3">{user.email}</p>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-3 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded-full">
              {user.course}
            </span>
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
              {user.campus}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Wellness Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="flex flex-col items-center justify-center p-4 shadow-sm border border-gray-100 rounded-3xl bg-white text-center">
          <span className="text-2xl mb-1">🔥</span>
          <span className="text-xl font-black text-gray-900">12</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Day Streak</span>
        </Card>
        <Card className="flex flex-col items-center justify-center p-4 shadow-sm border border-gray-100 rounded-3xl bg-white text-center">
          <span className="text-2xl mb-1">📔</span>
          <span className="text-xl font-black text-gray-900">45</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Entries</span>
        </Card>
        <Card className="flex flex-col items-center justify-center p-4 shadow-sm border border-gray-100 rounded-3xl bg-white text-center">
          <span className="text-2xl mb-1">🫂</span>
          <span className="text-xl font-black text-gray-900">128</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hugs Sent</span>
        </Card>
      </div>

      {/* 3. Settings Menu */}
      <Card className="flex flex-col p-0 overflow-hidden shadow-sm border border-gray-100 rounded-3xl bg-white">
        
        <button 
          onClick={() => navigate('/profile/privacy')}
          className="flex items-center gap-4 p-5 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left w-full"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z"></path></svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm">Privacy & Security</h3>
            <p className="text-xs text-gray-500 mt-0.5">Control your data and anonymity</p>
          </div>
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>

        <button className="flex items-center gap-4 p-5 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left w-full">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
            <p className="text-xs text-gray-500 mt-0.5">Reminders for check-ins and journals</p>
          </div>
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>

        <button className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left w-full">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm">Help & Support</h3>
            <p className="text-xs text-gray-500 mt-0.5">App guides and OSS contact info</p>
          </div>
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
        </button>

      </Card>

      {/* 4. Emergency SOS Card */}
      <Card className="flex items-center justify-between p-5 shadow-sm border border-red-100 bg-red-50 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
          </div>
          <div>
            <h3 className="font-bold text-red-900 text-sm">Crisis Resources</h3>
            <p className="text-xs text-red-700 mt-0.5 font-medium">Get immediate help 24/7</p>
          </div>
        </div>
        <Button variant="secondary" className="bg-white border-red-200 text-red-700 hover:bg-red-50 text-xs px-4 rounded-full">
          View
        </Button>
      </Card>

      {/* 5. Logout Button (Now visible on all screen sizes!) */}
      <div className="mt-2">
        <Button 
          variant="secondary" 
          onClick={handleLogout}
          className="w-full bg-white border-gray-200 text-gray-700 hover:bg-gray-50 py-3.5 rounded-xl shadow-sm"
        >
          Log Out
        </Button>
      </div>

    </div>
  );
};