import { BrandLogo } from './BrandLogo';

const meanings = [
  { number: '01', title: 'The mind', description: 'The student is at the center. Every mood check-in and journal entry starts here—with how you feel today.', highlight: 'mind' },
  { number: '02', title: 'Two leaves, leaning in', description: 'Peers holding each other up—the spirit of kapwa, and of the Mantra Wall where students share affirmations and small wins.', highlight: 'leaves' },
  { number: '03', title: 'One heart', description: 'Together, the leaves form a heart: a private, gentle space to reflect without pressure or judgment.', highlight: 'heart' },
  { number: '04', title: 'New growth', description: 'Where the two leaves overlap, a new leaf appears—growth that comes from support. Small steps count.', highlight: 'growth' },
];

function LogoDetail({ highlight }: { highlight: string }) {
  return (
    <svg viewBox="160 100 704 824" className="h-20 w-20" fill="none" aria-hidden="true">
      <circle cx="512" cy="205" r="85" fill={highlight === 'mind' ? '#0D6955' : 'currentColor'} className="text-slate-200 dark:text-slate-700" />
      <path d="M512 367C438 288 323 289 247 363C169 439 170 551 246 630L512 904L778 630C854 551 855 439 777 363C701 289 586 288 512 367Z" fill={highlight === 'leaves' || highlight === 'heart' ? '#10A478' : 'currentColor'} className="text-slate-200 dark:text-slate-700" />
      {highlight === 'leaves' && <path d="M512 367C586 288 701 289 777 363C855 439 854 551 778 630L512 904C486 731 461 550 461 496C461 445 479 402 512 367Z" fill="#5CC5DF" />}
      {(highlight === 'leaves' || highlight === 'growth') && <path d="M512 367C545 402 563 445 563 496C563 550 538 731 512 904C486 731 461 550 461 496C461 445 479 402 512 367Z" fill="#0D6955" />}
    </svg>
  );
}

export const LogoStory = () => (
  <section aria-labelledby="logo-story-heading" className="border-y border-emerald-100 bg-white px-5 py-16 sm:px-8 sm:py-24 dark:border-slate-800 dark:bg-slate-900/50">
    <div className="mx-auto max-w-7xl">
      <div className="grid items-center gap-8 md:grid-cols-[.7fr_1.3fr] md:gap-16">
        <div className="flex items-center justify-center rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-sky-50 p-10 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
          <BrandLogo className="h-44 w-44 sm:h-56 sm:w-56" decorative={false} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-700 dark:text-emerald-300">Our identity</p>
          <h2 id="logo-story-heading" className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl dark:text-white">A small symbol of care, connection, and growth.</h2>
          <p className="mt-5 font-editorial text-base leading-8 text-slate-600 dark:text-slate-300">Our logo brings the student, two supporting leaves, and one heart together. It reflects what MindCare stands for: mental wellness and peer support, one small step at a time.</p>
        </div>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {meanings.map(item => (
          <article key={item.number} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 sm:p-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between rounded-xl bg-emerald-50/80 p-4 dark:bg-slate-800">
              <LogoDetail highlight={item.highlight} />
              <span className="self-start text-xs font-bold tracking-widest text-emerald-700 dark:text-emerald-300">{item.number}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
          </article>
        ))}
      </div>
      <ul aria-label="Our logo colors" className="mt-8 flex flex-wrap gap-x-8 gap-y-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
        <li className="flex items-center gap-2.5"><span className="h-3 w-3 shrink-0 rounded-full bg-[#10A478]" aria-hidden="true" /><span><strong className="text-slate-900 dark:text-white">Green</strong> — mental health awareness</span></li>
        <li className="flex items-center gap-2.5"><span className="h-3 w-3 shrink-0 rounded-full bg-[#5CC5DF]" aria-hidden="true" /><span><strong className="text-slate-900 dark:text-white">Sky blue</strong> — calm and openness</span></li>
        <li className="flex items-center gap-2.5"><span className="h-3 w-3 shrink-0 rounded-full bg-[#0D6955] ring-1 ring-white/20" aria-hidden="true" /><span><strong className="text-slate-900 dark:text-white">Deep leaf</strong> — steadiness and trust</span></li>
      </ul>
    </div>
  </section>
);
