import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Check,
  ChevronRight,
  EyeOff,
  FileText,
  Info,
  Scale,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CompanionHeader } from '../components/CompanionHeader';
import { getPrivacySettings, updatePrivacySettings } from '../services/studentApi';

type Settings = {
  anonymousWall: boolean;
  shareAnalytics: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  anonymousWall: true,
  shareAnalytics: false,
};

const PRIVACY_CONTROLS: {
  key: keyof Settings;
  title: string;
  description: string;
  Icon: LucideIcon;
  enabledStatus: string;
  disabledStatus: string;
  note?: string;
}[] = [
  {
    key: 'anonymousWall',
    title: 'Anonymize My Activity',
    description: 'Hide your name and specific dates where applicable. Overall wellness information is shared only according to system privacy rules.',
    Icon: EyeOff,
    enabledStatus: 'Protected',
    disabledStatus: 'Not protected',
  },
  {
    key: 'shareAnalytics',
    title: 'Allow Activity Tracking',
    description: 'Allows MindCare to record selected activity information needed to provide wellness monitoring and progress features.',
    Icon: Activity,
    enabledStatus: 'Active',
    disabledStatus: 'Paused',
    note: 'When activity tracking is off, streak tracking and mood-trend summaries will not update.',
  },
];

const LEGAL_DOCUMENTS = {
  privacy: {
    title: 'MindCare Privacy Policy',
    introduction: 'This summary explains how MindCare handles student information for the PUP Santa Maria campus community.',
    sections: [
      {
        title: 'Information and wellness activity',
        text: 'MindCare may process account information, wellness check-ins, PHQ-9 and GAD-7 screening responses, selected activity information, and content you choose to share through its features. Information is used to provide wellness monitoring, progress tools, resources, and authorized support workflows.',
      },
      {
        title: 'Private journals',
        text: 'Private journal entries are encrypted and are not visible to other students. Journal content may be processed by MindCare features to provide the services you use. Authorized access follows system roles and applicable campus confidentiality requirements.',
      },
      {
        title: 'Screenings are not diagnoses',
        text: 'PHQ-9 and GAD-7 are non-diagnostic wellness screenings. Their scores and any system-generated indicators do not replace an assessment, diagnosis, or advice from a qualified professional.',
      },
      {
        title: 'Campus confidentiality and access',
        text: 'MindCare is intended for the PUP Santa Maria campus community. Student information is handled according to MindCare privacy settings, access controls, and applicable campus confidentiality requirements. Access is limited to authorized roles for their assigned responsibilities.',
      },
      {
        title: 'Freedom Wall',
        text: 'Freedom Wall posts can be shared anonymously. Public or shared posts are different from private journal entries and may be moderated under the system’s community guidelines.',
      },
      {
        title: 'Support and urgent needs',
        text: 'MindCare is a non-diagnostic wellness tool, not an emergency response service. If you need professional or urgent support, contact a qualified provider or appropriate campus or emergency service.',
      },
    ],
  },
  terms: {
    title: 'MindCare Terms & Conditions',
    introduction: 'By using MindCare, you agree to use its student wellness and peer-support features responsibly and with respect for other members of the PUP Santa Maria campus community.',
    sections: [
      {
        title: 'Purpose and limits',
        text: 'MindCare provides tools for wellness reflection, progress monitoring, and access to supportive resources. It is a non-diagnostic wellness tool and does not replace counseling, therapy, medical advice, or treatment.',
      },
      {
        title: 'PHQ-9 and GAD-7 screenings',
        text: 'PHQ-9 and GAD-7 are used for non-diagnostic wellness screening. Results are informational and are not a clinical diagnosis. Seek a qualified professional for evaluation or care.',
      },
      {
        title: 'Private information',
        text: 'Private journal entries are encrypted and are not visible to other students. Do not share your account credentials. Information is handled through MindCare access rules and applicable PUP Santa Maria campus confidentiality requirements.',
      },
      {
        title: 'Community features',
        text: 'Freedom Wall posts can be shared anonymously, but must follow community guidelines. Harassment, threats, hate speech, harmful content, or another person’s private information may be removed or referred for moderation.',
      },
      {
        title: 'Responsible use and support',
        text: 'Use MindCare lawfully and respectfully. The system is not an emergency service; for urgent needs, contact an appropriate professional or emergency service.',
      },
      {
        title: 'Updates',
        text: 'These terms may be updated when system features or institutional requirements change. Applicable campus policies and approved privacy requirements continue to apply.',
      },
    ],
  },
} as const;

type LegalDocument = keyof typeof LEGAL_DOCUMENTS;

export const PrivacySettings = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeDocument, setActiveDocument] = useState<LegalDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    getPrivacySettings()
      .then((data) => {
        const loadedSettings = {
          anonymousWall: data.anonymize_activity,
          shareAnalytics: data.allow_activity_tracking,
        };
        setSettings(loadedSettings);
        setSavedSettings(loadedSettings);
      })
      .catch(() => setError('Privacy settings could not be loaded.'))
      .finally(() => setIsLoading(false));
  }, []);

  const hasUnsavedChanges =
    settings.anonymousWall !== savedSettings.anonymousWall ||
    settings.shareAnalytics !== savedSettings.shareAnalytics;

  const handleToggle = (key: keyof Settings) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
    setShowSuccess(false);
    setError(null);
  };

  const handleSavePreferences = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasUnsavedChanges || isSaving) return;

    const preferencesToSave = { ...settings };
    setIsSaving(true);
    setShowSuccess(false);
    setError(null);

    try {
      await updatePrivacySettings({
        allow_activity_tracking: preferencesToSave.shareAnalytics,
        anonymize_activity: preferencesToSave.anonymousWall,
      });
      setSavedSettings(preferencesToSave);
      setShowSuccess(true);
      window.setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      setError('Privacy settings could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <CompanionHeader
        title="Privacy Settings"
        description="Manage your data collection preferences, activity tracking, and transparency settings."
        backButton={() => navigate('/profile')}
      />

      <div className="flex items-start gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/35">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Data Transparency &amp; Protection Summary</h2>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600 dark:text-slate-300 sm:text-sm">
            <li>Private journal entries are encrypted and never visible to other students.</li>
            <li>Freedom Wall posts can always be shared anonymously.</li>
            <li>MindCare is a non-diagnostic wellness tool.</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSavePreferences} className="flex flex-col gap-5">
        {isLoading ? (
          <Card className="animate-pulse space-y-5 rounded-3xl border-slate-100 p-6 dark:border-slate-800">
            {[0, 1].map((row) => (
              <div key={row} className={`flex items-center justify-between gap-4 ${row ? 'border-t border-slate-100 pt-5 dark:border-slate-800' : ''}`}>
                <div className="flex w-3/4 items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                  <div className="w-full space-y-2">
                    <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-5/6 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                </div>
                <div className="h-6 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </Card>
        ) : (
          <Card className="overflow-hidden rounded-3xl border-slate-100 p-0 shadow-sm dark:border-slate-800">
            {PRIVACY_CONTROLS.map(({ key, title, description, Icon, enabledStatus, disabledStatus, note }, index) => {
              const checked = settings[key];
              const titleId = `privacy-setting-${key}`;
              const descriptionId = `privacy-description-${key}`;

              return (
                <div
                  key={key}
                  className={`flex items-start justify-between gap-4 bg-white p-5 transition-colors duration-200 hover:bg-slate-50/70 dark:bg-slate-900 dark:hover:bg-slate-800/70 sm:p-6 ${index ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}
                >
                  <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${checked ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 id={titleId} className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${checked ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {checked ? enabledStatus : disabledStatus}
                        </span>
                      </div>
                      <p id={descriptionId} className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:text-sm">{description}</p>
                      {note && (
                        <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
                          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                          <span>{note}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-labelledby={titleId}
                    aria-describedby={descriptionId}
                    disabled={isSaving}
                    onClick={() => handleToggle(key)}
                    title={checked ? `Turn off ${title}` : `Turn on ${title}`}
                    className={`relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 disabled:cursor-wait disabled:opacity-60 ${checked ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform duration-200 ease-in-out"
                      style={{ transform: `translateX(${checked ? 20 : 0}px)` }}
                    />
                  </button>
                </div>
              );
            })}
          </Card>
        )}

        <Card className="rounded-3xl border-slate-100 p-6 shadow-sm dark:border-slate-800 sm:p-7">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Privacy &amp; Legal</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Review the documents that explain how MindCare works and how student information is handled.</p>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setActiveDocument('privacy')}
              className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-900 dark:text-white">View Privacy Policy</span>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">How student information is handled</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-700 dark:text-slate-500 dark:group-hover:text-emerald-300" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setActiveDocument('terms')}
              className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors duration-200 hover:border-emerald-200 hover:bg-emerald-50/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Scale className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-900 dark:text-white">View Terms &amp; Conditions</span>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Guidelines for using MindCare</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-700 dark:text-slate-500 dark:group-hover:text-emerald-300" aria-hidden="true" />
            </button>
          </div>
        </Card>

        {error && <p role="alert" className="text-center text-sm font-bold text-red-600 dark:text-red-400">{error}</p>}

        <div className="mt-1">
          {showSuccess && (
            <div role="status" className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              Preferences saved successfully
            </div>
          )}
          <Button
            type="submit"
            variant="primary"
            className={`w-full rounded-xl border-none py-3.5 shadow-md focus:ring-emerald-500 ${hasUnsavedChanges ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700' : 'bg-slate-200 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'}`}
            isLoading={isSaving}
            disabled={!hasUnsavedChanges || isLoading || isSaving}
            aria-busy={isSaving}
          >
            Save Preferences
          </Button>
        </div>
      </form>

      {activeDocument && (
        <LegalDocumentModal document={activeDocument} onClose={() => setActiveDocument(null)} />
      )}
    </div>
  );
};

function LegalDocumentModal({ document, onClose }: { document: LegalDocument; onClose: () => void }) {
  const content = LEGAL_DOCUMENTS[document];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-legal-modal-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6 sm:py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">MindCare</p>
            <h2 id="privacy-legal-modal-title" className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white sm:text-xl">{content.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close document"
            className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:px-6">
          <p className="mb-6 rounded-2xl bg-emerald-50/70 p-4 text-slate-700 dark:bg-emerald-950/35 dark:text-slate-200">{content.introduction}</p>
          <div className="space-y-6">
            {content.sections.map((section) => (
              <section key={section.title}>
                <h3 className="mb-1 font-bold text-slate-900 dark:text-white">{section.title}</h3>
                <p>{section.text}</p>
              </section>
            ))}
          </div>
        </div>
        <footer className="flex justify-end border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl px-5 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
            Close
          </Button>
        </footer>
      </section>
    </div>
  );
}
