import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const AdminDashboard = () => {
  const navigate = useNavigate();

  // Mock data for the admin dashboard
  const stats = {
    totalStudents: 1245,
    avgMood: 'Okay',
    pendingModeration: 8,
    activeAlerts: 2,
  };

  const recentAlerts = [
    { id: '1', type: 'crisis', student: 'Student A.', details: 'Scored 21 (Severe) on PHQ-9', time: '10 mins ago' },
    { id: '2', type: 'report', student: 'Anonymous', details: 'Freedom Wall post flagged for self-harm keywords', time: '1 hour ago' },
    { id: '3', type: 'crisis', student: 'Student B.', details: 'Requested immediate OSS appointment', time: '3 hours ago' },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OSS Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">Campus overview for PUP Santa Maria</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="bg-white border-gray-200 text-gray-700 text-xs px-4 py-2 rounded-xl shadow-sm">
            Export Report
          </Button>
          <Button variant="primary" onClick={() => navigate('/admin/moderation')} className="bg-indigo-900 hover:bg-indigo-800 border-none text-xs px-4 py-2 rounded-xl shadow-sm">
            Review Queue ({stats.pendingModeration})
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Students */}
        <Card className="p-5 shadow-sm border border-gray-100 rounded-3xl bg-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Students</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900">{stats.totalStudents.toLocaleString()}</h2>
          <p className="text-[10px] text-green-600 font-bold mt-1">+12 this week</p>
        </Card>

        {/* Avg Mood */}
        <Card className="p-5 shadow-sm border border-gray-100 rounded-3xl bg-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10h.01M15 10h.01M9 15h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Mood</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900">{stats.avgMood}</h2>
          <p className="text-[10px] text-gray-400 font-bold mt-1">Based on 450 check-ins</p>
        </Card>

        {/* Moderation Queue */}
        <Card className="p-5 shadow-sm border border-yellow-200 rounded-3xl bg-yellow-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <span className="text-xs font-bold text-yellow-800 uppercase tracking-wider">To Review</span>
          </div>
          <h2 className="text-2xl font-black text-yellow-900">{stats.pendingModeration}</h2>
          <p className="text-[10px] text-yellow-700 font-bold mt-1">Posts & Comments</p>
        </Card>

        {/* Crisis Alerts (Highlighted) */}
        <Card className="p-5 shadow-sm border border-red-200 rounded-3xl bg-red-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-100 rounded-bl-full z-0"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center animate-pulse">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
              <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Alerts</span>
            </div>
            <h2 className="text-2xl font-black text-red-900">{stats.activeAlerts}</h2>
            <p className="text-[10px] text-red-700 font-bold mt-1">Requires immediate action</p>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
        
        {/* Left Column: Alerts Feed (Takes up 2/3 space on desktop) */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Needs Attention</h2>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">View All</button>
          </div>
          
          <Card className="p-0 overflow-hidden rounded-3xl border-gray-100 shadow-sm bg-white">
            {recentAlerts.map((alert, index) => (
              <div key={alert.id} className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-gray-50 ${index !== recentAlerts.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${alert.type === 'crisis' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {alert.type === 'crisis' 
                      ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
                    }
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{alert.student}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{alert.details}</p>
                    <span className="text-[10px] font-bold text-gray-400 mt-2 block">{alert.time}</span>
                  </div>
                </div>
                <Button variant="secondary" className="text-xs px-4 py-1.5 bg-white border-gray-200 hover:bg-gray-100 shadow-sm shrink-0">
                  Review
                </Button>
              </div>
            ))}
          </Card>
        </div>

        {/* Right Column: Quick Actions & Campus Analytics */}
        <div className="flex flex-col gap-6">
          
          {/* Quick Actions */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate('/admin/resources')} className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl transition-colors border border-indigo-100 gap-2">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                <span className="text-xs font-bold">Add Resource</span>
              </button>
              <button onClick={() => navigate('/admin/users')} className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl transition-colors border border-blue-100 gap-2">
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                <span className="text-xs font-bold">Manage Users</span>
              </button>
            </div>
          </div>

          {/* Placeholder for Analytics Chart */}
          <div className="flex flex-col gap-4 mt-2">
            <h2 className="text-lg font-bold text-gray-900">Campus Mood Trend</h2>
            <Card className="p-6 border-gray-100 shadow-sm rounded-3xl bg-white h-48 flex items-center justify-center">
              <div className="text-center flex flex-col items-center">
                <svg className="w-10 h-10 text-indigo-100 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chart Visualization</p>
                <p className="text-[10px] text-gray-300 mt-1">(Requires Chart.js or Recharts)</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};