import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const Journal = () => {
  const [entry, setEntry] = useState('');
  
  // Modal States
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Journal Prompts
  const prompts = [
    "What made you feel good today?",
    "What has been challenging lately?",
    "What are you grateful for today?",
    "What is one small thing you accomplished?"
  ];

  // Smart Prompt Insertion
  const handlePromptClick = (prompt: string) => {
    if (entry.trim().length === 0) {
      setEntry(prompt + '\n\n');
    } else {
      // If they already started typing, append it to the bottom
      setEntry(prev => prev.trim() + '\n\n' + prompt + '\n\n');
    }
  };

  // Mock past entries
  const [pastEntries, setPastEntries] = useState([
    { id: '1', date: 'Sep 2, 2026', mood: 'Neutral', text: 'Today was a standard day. Attended my Web Dev classes, worked on the Lakbay prototype for a bit.' },
    { id: '2', date: 'Sep 1, 2026', mood: 'Positive', text: 'Today was better than yesterday. I managed to submit my paper on time and felt a huge relief...' },
  ]);

  const handleSaveClick = () => {
    if (entry.trim().length === 0) return;
    setShowPrivacyModal(true); // Step 1: Show Privacy Warning
  };

  const handleConfirmSave = () => {
    setShowPrivacyModal(false);
    setIsSaving(true);

    // Simulate saving and NLP analysis delay
    setTimeout(() => {
      setIsSaving(false);
      setShowInsightModal(true); // Step 2: Show Reflection Insight
    }, 1200);
  };

  const handleFinish = () => {
    setShowInsightModal(false);
    // Add the new entry to the top of the list
    setPastEntries([{ id: Date.now().toString(), date: 'Today', mood: 'Neutral', text: entry }, ...pastEntries]);
    setEntry(''); // Clear the text area
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full relative">
      
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <span className="text-purple-600">📔</span> Reflective Journal
        </h1>
        <p className="text-sm text-gray-500 mt-1">Take a moment to put your thoughts into words.</p>
      </div>

      <Card className="flex flex-col gap-4 p-5 md:p-6 shadow-sm border-gray-100 rounded-3xl bg-white">
        
        {/* INTERACTIVE PROMPTS WIDGET */}
        <div className="bg-purple-50 rounded-2xl p-4 mb-2 border border-purple-100">
          <p className="text-xs font-bold text-purple-900 mb-3 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
            Tap a prompt to begin:
          </p>
          <div className="flex flex-col gap-2">
            {prompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handlePromptClick(prompt)}
                className="text-left text-sm text-purple-700 bg-white/60 hover:bg-white border border-purple-200 hover:border-purple-400 rounded-xl p-3 transition-all shadow-sm hover:shadow-md flex items-center justify-between group"
              >
                <span>{prompt}</span>
                <svg className="w-4 h-4 text-purple-300 group-hover:text-purple-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea 
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="What's on your mind today?"
            className="w-full min-h-50 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400">{entry.length} characters</span>
            <div className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z"></path></svg>
              Private
            </div>
          </div>
          
          <Button 
            onClick={handleSaveClick}
            variant="primary" 
            disabled={entry.length === 0}
            className={`rounded-xl px-5 py-2.5 text-sm shadow-md border-none transition-colors ${entry.length === 0 ? 'bg-gray-200 text-gray-400' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
          >
            Save Journal Entry
          </Button>
        </div>
      </Card>

      {/* Past Entries */}
      <div className="mt-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Past entries</h2>
        <div className="flex flex-col gap-4">
          {pastEntries.map((item) => (
            <Card key={item.id} className="p-5 shadow-sm border-gray-100 rounded-2xl bg-white hover:border-purple-200 transition-colors cursor-pointer">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-gray-900">{item.date}</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                  item.mood === 'Positive' ? 'bg-green-50 text-green-700' : 
                  item.mood === 'Neutral' ? 'bg-purple-50 text-purple-700' : 
                  'bg-orange-50 text-orange-700'
                }`}>
                  {item.mood}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{item.text}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: PRIVACY NOTICE                                     */}
      {/* ========================================================= */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowPrivacyModal(false)}></div>
          
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl relative z-10 transform transition-all scale-100 opacity-100">
            <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z"></path></svg>
            </div>
            
            <h2 className="text-xl font-black text-gray-900 mb-2">Privacy notice</h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Your journal is <span className="font-bold">private and confidential</span>. Your entry is protected and is not intended to be used for diagnosis.
            </p>
            <p className="text-sm text-gray-600 mb-8 leading-relaxed">
              Your writing may be analyzed for general emotional tone to provide supplementary wellness insights.
            </p>

            <div className="flex gap-3">
              <Button onClick={() => setShowPrivacyModal(false)} variant="secondary" className="flex-1 bg-white border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleConfirmSave} variant="primary" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white border-none rounded-xl shadow-md">
                Save Privately
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: REFLECTION INSIGHT (NLP)                         */}
      {/* ========================================================= */}
      {(isSaving || showInsightModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"></div>
          
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl relative z-10 flex flex-col items-center text-center transform transition-all scale-100 opacity-100">
            
            {isSaving ? (
              <div className="py-10 flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-bold text-gray-500 animate-pulse">Analyzing reflection...</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                
                <h2 className="text-xl font-black text-gray-900 mb-1">Reflection Insight</h2>
                <p className="text-xs text-gray-500 mb-6">Based on the general emotional tone of your writing:</p>

                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 w-full flex flex-col items-center mb-6 shadow-inner">
                   <div className="text-3xl mb-1">☁️</div>
                   <h3 className="text-base font-bold text-gray-900">Neutral</h3>
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">emotional expression</span>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed mb-6 px-2">
                  Your entry contains mostly neutral emotional expressions. Writing is a healthy way to process your experiences.
                </p>

                <p className="text-[10px] text-gray-400 leading-relaxed mb-8 max-w-62.5">
                  This insight describes the general emotional tone of your writing. It is not a psychological diagnosis and should not be treated as one.
                </p>

                <div className="flex flex-col w-full gap-3">
                  <Button variant="secondary" className="w-full bg-white border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl">
                    Talk to a Counselor
                  </Button>
                  <Button onClick={handleFinish} variant="primary" className="w-full bg-purple-600 hover:bg-purple-700 text-white border-none rounded-xl shadow-md">
                    Continue
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};