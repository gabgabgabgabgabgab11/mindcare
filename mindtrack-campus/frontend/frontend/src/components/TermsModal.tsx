import { Button } from './Button';
import { Link } from 'react-router-dom';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
}

export const TermsModal = ({ isOpen, onClose, onAgree }: TermsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4" role="presentation">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl transition-colors" role="dialog" aria-modal="true" aria-labelledby="terms-title">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5">
          <h2 id="terms-title" className="text-xl font-bold text-slate-900 dark:text-white">MindCare Terms &amp; Conditions</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer" aria-label="Close terms">&times;</button>
        </div>
        <div className="overflow-y-auto px-6 py-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
          <p className="mb-5">By creating or using a MindCare account, you agree to follow these Terms &amp; Conditions. Continued use of the system constitutes acceptance of the applicable terms. Read the <Link to="/privacy-policy" className="font-bold text-brand-600 dark:text-brand-400 underline" onClick={onClose}>Privacy Policy</Link> alongside these terms.</p>
          <section className="space-y-4">
            <div><h3 className="font-bold text-slate-900 dark:text-white">Purpose of MindCare</h3><p>MindCare helps students monitor general wellness, complete screening questionnaires, record personal wellness information, maintain journal entries, view resources, monitor trends, and find available professional support information.</p></div>
            <div><h3 className="font-bold text-slate-900 dark:text-white">Non-Diagnostic System</h3><p>MindCare is not a diagnostic tool and does not replace a psychologist, counselor, physician, or other qualified mental health professional. Screening results and system-generated indicators are not medical or psychological diagnoses.</p></div>
            <div><h3 className="font-bold text-slate-900 dark:text-white">Screening Results</h3><p>PHQ-9 and GAD-7 are used for wellness screening purposes. The system does not independently establish a clinical diagnosis. Students experiencing significant distress should seek help from an appropriate qualified professional.</p></div>
            <div><h3 className="font-bold text-slate-900 dark:text-white">Journal and NLP Features</h3><p>Journal entries may be processed by the NLP component to identify general language-based indicators. NLP-generated indicators are informational system outputs and should not be interpreted as psychological diagnoses or definitive assessments of mental health.</p></div>
            <div><h3 className="font-bold text-slate-900 dark:text-white">User Responsibilities</h3><p>Users agree to provide accurate registration information, protect their credentials, use the system responsibly, respect other users, follow Freedom Wall guidelines, and avoid harmful, abusive, unlawful, or policy-violating content.</p></div>
            <div><h3 className="font-bold text-slate-900 dark:text-white">Freedom Wall</h3><p>Freedom Wall content may be moderated and safety-filtered. Do not post threats, harassment, hate speech, another person&apos;s personal information, intentionally harmful content, or content that violates university policies.</p></div>
            <div><h3 className="font-bold text-slate-900 dark:text-white">Professional Support</h3><p>MindCare may provide information about professional support. It is not an emergency response service. For urgent or emergency situations, contact appropriate emergency services or qualified professionals.</p></div>
            <div><h3 className="font-bold text-slate-900 dark:text-white">Account Security and Privacy</h3><p>Users are responsible for keeping credentials secure. Authentication, authorization, access controls, and audit logging may be used to protect system resources. Information is handled according to the MindCare Privacy Policy.</p></div>
            <div><h3 className="font-bold text-slate-900 dark:text-white">Changes</h3><p>MindCare administrators may update these Terms when necessary. Significant changes should be communicated appropriately.</p></div>
            <div><h3 className="font-bold text-slate-900 dark:text-white">Contact</h3><p>Official MindCare/PUPSMB contact details will be added after institutional confirmation. Do not rely on MindCare for emergency assistance.</p></div>
          </section>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold">Cancel</Button>
          <Button type="button" onClick={onAgree} className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 text-sm font-semibold">I Agree</Button>
        </div>
      </div>
    </div>
  );
};
