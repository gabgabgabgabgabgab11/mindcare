import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

type ResourceType = 'all' | 'article' | 'exercise' | 'contact';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  icon: string;
  actionText: string;
  theme: string;
}

const MOCK_RESOURCES: Resource[] = [
  {
    id: '1',
    title: 'PUP OSS Counseling',
    description: 'Schedule a free, confidential in-person counseling session right here on campus.',
    type: 'contact',
    icon: '🏫',
    actionText: 'Book Session',
    theme: 'bg-blue-50 border-blue-100 text-blue-900',
  },
  {
    id: '2',
    title: 'NCMH Crisis Hotline',
    description: '24/7 National Center for Mental Health crisis hotline. You are not alone.',
    type: 'contact',
    icon: '📞',
    actionText: 'Call Now',
    theme: 'bg-red-50 border-red-100 text-red-900',
  },
  {
    id: '3',
    title: 'Beating Academic Burnout',
    description: 'Practical tips to manage thesis stress, exam anxiety, and heavy workloads.',
    type: 'article',
    icon: '📚',
    actionText: 'Read Article',
    theme: 'bg-indigo-50 border-indigo-100 text-indigo-900',
  },
  {
    id: '4',
    title: '5-Minute Box Breathing',
    description: 'A simple technique to quickly lower your heart rate and center your focus.',
    type: 'exercise',
    icon: '🫁',
    actionText: 'Start Exercise',
    theme: 'bg-teal-50 border-teal-100 text-teal-900',
  },
  {
    id: '5',
    title: 'Sleep Hygiene 101',
    description: 'Learn how to fix your sleep schedule for better mental clarity and energy.',
    type: 'article',
    icon: '🌙',
    actionText: 'Read Article',
    theme: 'bg-purple-50 border-purple-100 text-purple-900',
  }
];

export const Resources = () => {
  const [activeFilter, setActiveFilter] = useState<ResourceType>('all');
  
  // Modal States
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const filteredResources = MOCK_RESOURCES.filter(resource => 
    activeFilter === 'all' ? true : resource.type === activeFilter
  );

  const handleResourceClick = (resource: Resource) => {
    // If they click the OSS Counseling card, open the booking modal!
    if (resource.id === '1') {
      setShowBookingModal(true);
      setBookingSuccess(false);
    } else {
      // For external links like NCMH or Articles, we'd route them or open a new tab.
      // For now, we'll just show a native alert for the prototype.
      alert(`Routing to: ${resource.title}`);
    }
  };

  const handleBookSession = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate sending the booking request to the backend
    setTimeout(() => {
      setIsSubmitting(false);
      setBookingSuccess(true);
    }, 1500);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    // Reset success state after the modal finishes animating out
    setTimeout(() => setBookingSuccess(false), 300);
  };

  return (
    <div className="flex flex-col gap-6 relative">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <span className="text-purple-600">📚</span> Wellness Resources
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Tools, guides, and professional support at your fingertips.
        </p>
      </div>

      {/* Featured Quick Relief Widget */}
      <Card className="relative overflow-hidden bg-linear-to-br from-teal-500 to-emerald-600 p-6 md:p-8 rounded-3xl shadow-sm border-none">
        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-20%] left-[10%] w-32 h-32 bg-black/10 rounded-full blur-xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🌿</span>
              <span className="text-xs font-bold uppercase tracking-widest text-teal-100">Quick Relief</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-1">Guided Grounding</h2>
            <p className="text-sm text-teal-50 max-w-sm leading-relaxed">
              Feeling overwhelmed right now? Take 60 seconds to reset your nervous system with our guided breathing tool.
            </p>
          </div>
          <Button variant="secondary" className="bg-white text-teal-700 hover:text-teal-800 hover:bg-teal-50 border-none rounded-xl font-bold whitespace-nowrap mt-2 md:mt-0 shadow-md transition-colors">
            Start Breathing
          </Button>
        </div>
      </Card>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 mt-2">
        <button 
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeFilter === 'all' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
        >
          All Resources
        </button>
        <button 
          onClick={() => setActiveFilter('contact')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeFilter === 'contact' ? 'bg-red-100 text-red-800 border border-red-200 shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
        >
          <span>🆘</span> Contacts
        </button>
        <button 
          onClick={() => setActiveFilter('article')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeFilter === 'article' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
        >
          <span>📚</span> Articles
        </button>
        <button 
          onClick={() => setActiveFilter('exercise')}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeFilter === 'exercise' ? 'bg-teal-100 text-teal-800 border border-teal-200 shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
        >
          <span>🧘‍♀️</span> Exercises
        </button>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredResources.map((resource) => (
          <button 
            key={resource.id} 
            onClick={() => handleResourceClick(resource)}
            className={`flex flex-col h-full justify-between p-5 rounded-3xl border shadow-sm transition-all hover:-translate-y-1 hover:shadow-md text-left ${resource.theme}`}
          >
            <div>
              <div className="w-12 h-12 bg-white/60 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl shadow-sm mb-4">
                {resource.icon}
              </div>
              <h3 className="font-bold text-lg mb-1.5 leading-tight">{resource.title}</h3>
              <p className="text-sm opacity-80 leading-relaxed mb-6">
                {resource.description}
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-90 group-hover:opacity-100 transition-opacity">
              {resource.actionText}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </div>
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* BOOKING MODAL (PUP OSS)                                   */}
      {/* ========================================================= */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={closeBookingModal}></div>
          
          {/* Modal Box */}
          <div className="bg-white rounded-4xl p-6 md:p-8 w-full max-w-md shadow-2xl relative z-10 transform transition-all scale-100 opacity-100 overflow-hidden">
            
            {!bookingSuccess ? (
              <form onSubmit={handleBookSession} className="flex flex-col gap-4">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                    <span className="text-2xl">🏫</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Book OSS Session</h2>
                    <p className="text-xs text-gray-500">PUP Santa Maria Campus</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed mb-2">
                  Request a confidential, in-person counseling session. Our OSS staff will reach out to your Webmail to confirm the exact time.
                </p>

                {/* Form Fields */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Preferred Date</label>
                  <input type="date" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Preferred Time</label>
                  <select required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="" disabled selected>Select a time window</option>
                    <option value="morning">Morning (9:00 AM - 12:00 PM)</option>
                    <option value="afternoon">Afternoon (1:00 PM - 4:00 PM)</option>
                    <option value="late">Late Afternoon (4:00 PM - 6:00 PM)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">What would you like to discuss? (Optional)</label>
                  <textarea 
                    placeholder="e.g., Academic stress, personal matters..."
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-20"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  <Button type="button" onClick={closeBookingModal} variant="secondary" className="flex-1 bg-white border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={isSubmitting} className="flex-2 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-xl shadow-md">
                    Request Appointment
                  </Button>
                </div>
              </form>
            ) : (
              
              /* Success State */
              <div className="flex flex-col items-center text-center py-6 animate-fade-in-up">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Request Sent!</h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-8 max-w-65">
                  Your appointment request has been securely sent to the OSS team. Please check your <span className="font-bold">PUP Webmail</span> within 24 hours for confirmation.
                </p>
                <Button onClick={closeBookingModal} variant="primary" className="w-full bg-gray-900 hover:bg-gray-800 text-white border-none rounded-xl shadow-md py-3.5">
                  Done
                </Button>
              </div>

            )}
          </div>
        </div>
      )}

    </div>
  );
};