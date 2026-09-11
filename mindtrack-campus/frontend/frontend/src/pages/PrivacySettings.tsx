import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const PrivacySettings = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // State to track privacy toggles
  const [settings, setSettings] = useState({
    counselorAccess: true,
    anonymousWall: true,
    shareAnalytics: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    // Hide the success message if they start making new changes
    if (showSuccess) setShowSuccess(false);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setShowSuccess(false);

    // Simulate saving to the database
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true); // Trigger the success message
      
      // NOTE: Notice there is NO navigate('/profile') here!
      // The user stays right on this page. The success message will just fade away after 3 seconds.
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }, 800);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      
      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/profile')}
          className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Privacy Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Control how your data is handled.</p>
        </div>
      </div>

      <form onSubmit={handleSavePreferences} className="flex flex-col gap-5">
        
        <Card className="flex flex-col gap-0 p-0 overflow-hidden shadow-sm border border-gray-100 rounded-3xl">
          
          {/* Setting 1 */}
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
            <div className="pr-4">
              <h3 className="font-bold text-gray-900 text-sm">Counselor Data Access</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Allow OSS Counselors to view your PHQ-9 and GAD-7 scores to provide better support. Journal entries remain private.
              </p>
            </div>
            <button 
              type="button"
              onClick={() => handleToggle('counselorAccess')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${settings.counselorAccess ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.counselorAccess ? 'translate-x-7' : 'translate-x-1'}`}></div>
            </button>
          </div>

          {/* Setting 2 */}
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
            <div className="pr-4">
              <h3 className="font-bold text-gray-900 text-sm">Strict Anonymity on Wall</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Ensure your Student ID is entirely decoupled from your Freedom Wall posts in the database.
              </p>
            </div>
            <button 
              type="button"
              onClick={() => handleToggle('anonymousWall')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${settings.anonymousWall ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.anonymousWall ? 'translate-x-7' : 'translate-x-1'}`}></div>
            </button>
          </div>

          {/* Setting 3 */}
          <div className="p-5 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
            <div className="pr-4">
              <h3 className="font-bold text-gray-900 text-sm">Share App Analytics</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Share anonymous usage data to help us improve the MindCare application experience.
              </p>
            </div>
            <button 
              type="button"
              onClick={() => handleToggle('shareAnalytics')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${settings.shareAnalytics ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.shareAnalytics ? 'translate-x-7' : 'translate-x-1'}`}></div>
            </button>
          </div>
        </Card>

        {/* Animated Success Message */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden flex justify-center ${showSuccess ? 'max-h-12 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
          <div className="bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            Preferences Saved Successfully!
          </div>
        </div>

        <div className="mt-2">
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-3.5 shadow-md border-none"
            isLoading={isSaving}
          >
            Save Preferences
          </Button>
        </div>

      </form>
    </div>
  );
};