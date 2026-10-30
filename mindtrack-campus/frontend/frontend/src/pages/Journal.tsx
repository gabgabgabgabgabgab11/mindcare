import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CompanionHeader } from '../components/CompanionHeader';
import { createJournalEntry, getJournalAnalysis, listJournalEntries, listWellnessCheckIns } from '../services/studentApi';
import { studentCache } from '../services/studentCache';
import { getActivityStreak, queueStreakCelebration } from '../utils/activityStreak';
import type { JournalAnalysis, JournalEntry, WellnessCheckInResponse } from '../types';

export const Journal = () => {
  const navigate = useNavigate();
  const [entry, setEntry] = useState('');
  
  // Modal States
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
  const [analysis, setAnalysis] = useState<JournalAnalysis | null>(null);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    listJournalEntries()
      .then(setPastEntries)
      .catch(() => setSaveError('Journal entries could not be loaded.'))
      .finally(() => setIsLoadingEntries(false));
  }, []);

  const handleSaveClick = () => {
    if (entry.trim().length === 0) return;
    setShowPrivacyModal(true); // Step 1: Show Privacy Warning
  };

  const handleConfirmSave = async () => {
    setShowPrivacyModal(false);
    setIsSaving(true);
    setSaveError(null);

    try {
      let previousEntries: JournalEntry[] = studentCache.dashboard?.journalEntries ?? pastEntries;
      let previousCheckIns: WellnessCheckInResponse[] = studentCache.dashboard?.checkIns ?? [];
      if (!studentCache.dashboard) {
        try {
          [previousEntries, previousCheckIns] = await Promise.all([listJournalEntries(), listWellnessCheckIns()]);
        } catch {
          // A history refresh should not prevent saving a journal entry.
        }
      }
      const previousStreak = getActivityStreak(previousEntries, previousCheckIns);
      const createdEntry = await createJournalEntry({ content: entry.trim() });
      const nextEntries = [createdEntry, ...previousEntries.filter((item) => item.id !== createdEntry.id)];
      const nextStreak = getActivityStreak(nextEntries, previousCheckIns);
      setPastEntries(current => [createdEntry, ...current]);
      if (studentCache.dashboard) {
        studentCache.dashboard.journalEntries = [
          createdEntry,
          ...studentCache.dashboard.journalEntries.filter((item) => item.id !== createdEntry.id),
        ];
      }
      if (nextStreak > previousStreak) queueStreakCelebration();
      try {
        setAnalysis(await getJournalAnalysis(createdEntry.id));
      } catch {
        setAnalysis(null);
      }
      setShowInsightModal(true);
    } catch {
      setSaveError('Your journal entry could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinish = () => {
    setShowInsightModal(false);
    setEntry(''); // Clear the text area
    setAnalysis(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full relative">
      
      <CompanionHeader
        title="Reflective Journal"
        description="Take a moment to put your thoughts into words. I'm right here with you!"
        petSize="phone"
      />

      <Card data-tour="journal-editor" className="flex flex-col gap-4 p-5 md:p-6 shadow-sm border-gray-100 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">

        {/* Text Area */}
        <div className="relative">
          <textarea 
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="What's on your mind today?"
            className="w-full min-h-50 p-4 bg-gray-50 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all resize-none leading-relaxed"
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 dark:text-slate-400">{entry.length} characters</span>
            <div className="flex items-center gap-1 text-xs font-bold text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-1 rounded-md">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z"></path></svg>
              Private
            </div>
          </div>
          
          <Button 
            onClick={handleSaveClick}
            variant="primary" 
            disabled={entry.length === 0}
            className={`rounded-xl px-5 py-2.5 text-sm shadow-md border-none transition-colors ${entry.length === 0 ? 'bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-slate-500' : 'bg-brand-600 hover:bg-brand-700 text-white'}`}
          >
            Save Journal Entry
          </Button>
        </div>
      </Card>

      {/* Past Entries */}
      <div data-tour="journal-history" className="mt-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Past entries</h2>
        <div className="flex flex-col gap-4">
          {isLoadingEntries ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24 mb-3"></div>
                  <div className="h-3 bg-gray-100 dark:bg-slate-800/60 rounded w-full mb-1.5"></div>
                  <div className="h-3 bg-gray-100 dark:bg-slate-800/60 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : pastEntries.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 p-5">
              No journal entries yet. Write your first reflection above when you are ready.
            </p>
          ) : pastEntries.map((item) => (
            <Card key={item.id} className="p-5 shadow-sm border-gray-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed line-clamp-2">{item.content}</p>
            </Card>
          ))}
          {saveError && <p className="mt-3 text-sm font-bold text-red-600 dark:text-red-400">{saveError}</p>}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: PRIVACY NOTICE                                     */}
      {/* ========================================================= */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowPrivacyModal(false)}></div>
          
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl relative z-10 transform transition-all scale-100 opacity-100">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/40 text-orange-500 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z"></path></svg>
            </div>
            
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Privacy notice</h2>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-4 leading-relaxed">
              Your journal is <span className="font-bold">private and confidential</span>. Your entry is protected and is not intended to be used for diagnosis.
            </p>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-8 leading-relaxed">
              Your writing may be analyzed for general emotional tone to provide supplementary wellness insights.
            </p>

            <div className="flex gap-3">
              <Button onClick={() => setShowPrivacyModal(false)} variant="secondary" className="flex-1 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer">
                Cancel
              </Button>
              <Button onClick={handleConfirmSave} variant="primary" className="flex-1 bg-brand-600 hover:bg-brand-700 text-white border-none rounded-xl shadow-md cursor-pointer">
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>
          
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl relative z-10 flex flex-col items-center text-center transform transition-all scale-100 opacity-100">
            
            {isSaving ? (
              <div className="py-10 flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-brand-200 dark:border-brand-800 border-t-brand-600 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-bold text-gray-500 dark:text-slate-400 animate-pulse">Analyzing reflection...</p>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">Reflection Insight</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">Based on the general emotional tone of your writing:</p>

                <div className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 w-full flex flex-col items-center mb-6 shadow-inner">
                   <div className="text-3xl mb-1">☁️</div>
                   <h3 className="text-base font-bold text-gray-900 dark:text-white">{analysis?.sentiment_label ?? 'Pending'}</h3>
                   <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest mt-0.5">emotional expression</span>
                </div>

                <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed mb-6 px-2">
                  {analysis?.disclaimer ?? 'Your entry was saved. Writing is a healthy way to process your experiences.'}
                </p>

                <p className="text-[10px] text-gray-400 dark:text-slate-400 leading-relaxed mb-8 max-w-62.5">
                  This insight describes the general emotional tone of your writing. It is not a psychological diagnosis and should not be treated as one.
                </p>

                <div className="flex flex-col w-full gap-3">
                  <Button
                    onClick={() => navigate('/support')}
                    variant="secondary"
                    className="w-full bg-white dark:bg-slate-800 border-brand-200 dark:border-slate-700 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
                  >
                    Talk to a Counselor
                  </Button>
                  <Button onClick={handleFinish} variant="primary" className="w-full bg-brand-600 hover:bg-brand-700 text-white border-none rounded-xl shadow-md cursor-pointer">
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
