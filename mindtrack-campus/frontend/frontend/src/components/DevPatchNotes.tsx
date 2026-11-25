import { Sparkles } from 'lucide-react';
import patchNotes from '../content/dev-patch-notes.json';

export const DevPatchNotes = () => {
  if (!patchNotes.length) return null;
  return (
    <section aria-labelledby="patch-notes-heading" className="mt-8 rounded-2xl border border-white/15 bg-white/[0.06] p-5 shadow-lg backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 id="patch-notes-heading" className="flex items-center gap-2 text-sm font-bold text-white"><Sparkles className="h-4 w-4 text-teal-200" aria-hidden="true" />What’s new</h3>
        <span className="text-xs text-teal-200">From the developers</span>
      </div>
      <div tabIndex={0} role="region" aria-label="MindCare update history" className="max-h-48 overflow-y-auto overscroll-contain pr-3 focus-visible:outline-2 focus-visible:outline-teal-200">
        {patchNotes.map((note, index) => (
          <article key={`${note.date}-${note.version}`} className={index ? 'mt-5 border-t border-white/10 pt-5' : ''}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-teal-200">
              <span className="font-bold">{note.version}</span>
              <time dateTime={note.date}>{new Date(`${note.date}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
            </div>
            <h4 className="mt-2 text-sm font-bold text-white">{note.title}</h4>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-5 text-slate-200">
              {note.changes.map(change => <li key={change}>{change}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
};
