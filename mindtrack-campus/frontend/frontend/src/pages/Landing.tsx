import { ArrowRight, BookHeart, Heart, HeartHandshake, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PETS } from '../constants/pets';
import { ThemeToggle } from '../components/ThemeToggle';
import { ScrollCompanion } from '../components/ScrollCompanion';
import { useScrollReveal } from '../hooks/useScrollReveal';

const gentleSteps = [
  {
    Icon: Heart,
    title: 'Check in with yourself',
    text: 'Make space for how you feel, one small moment at a time.',
    bubble: 'Notice how you feel 💛',
  },
  {
    Icon: BookHeart,
    title: 'Reflect with care',
    text: 'Use private journaling and gentle wellness tools at your own pace.',
    bubble: 'At your own gentle pace 📖',
  },
  {
    Icon: HeartHandshake,
    title: 'Find support',
    text: 'Explore campus resources when you need an extra hand.',
    bubble: 'Always here for you 🤝',
  },
];

export const Landing = () => {
  useScrollReveal();

  return (
    <main className="landing-page min-h-screen overflow-x-hidden bg-[#f8fcfa] text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      {/* The Single MindCare Guide Companion - guides you across the page as you scroll */}
      <ScrollCompanion />

      {/* Navigation Bar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-emerald-100/70 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
        <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="MindCare home">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-700/20">
              <Heart className="h-5 w-5 fill-current" />
            </span>
            <span>
              <strong className="block text-lg leading-5 tracking-tight text-slate-900 dark:text-white">MindCare</strong>
              <small className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">PUP Santa Maria</small>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/about" className="hidden text-sm font-bold text-slate-600 transition hover:text-emerald-700 sm:block dark:text-slate-300 dark:hover:text-emerald-300">
              About us
            </Link>
            <ThemeToggle variant="icon" />
            <Link to="/login" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-700">
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section with Living Background Orbs */}
      <section className="relative isolate min-h-[780px] overflow-hidden px-5 pb-20 pt-34 sm:px-8 lg:min-h-[820px]">
        {/* Living, bouncing ambient circles that move and bounce like they're alive */}
        <div className="alive-orb alive-orb-1 top-12 -left-20 h-80 w-80 bg-emerald-400/35 dark:bg-emerald-600/25" aria-hidden="true" />
        <div className="alive-orb alive-orb-2 top-24 -right-24 h-96 w-96 bg-sky-400/35 dark:bg-sky-600/25" aria-hidden="true" />
        <div className="alive-orb alive-orb-3 -bottom-10 left-1/4 h-80 w-80 bg-amber-300/35 dark:bg-teal-600/25" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-8">
          {/* Left Column: Hero Copy with Buttery-Smooth Entrance */}
          <div className="pt-10 text-center lg:pt-18 lg:text-left">
            <div className="hero-fade-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm dark:border-emerald-900 dark:bg-slate-900/80 dark:text-emerald-200">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                A gentle space for student wellness
              </span>
            </div>

            <h1 className="hero-fade-2 mt-7 max-w-3xl text-5xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl dark:text-white">
              Your wellbeing<br />
              <span className="text-emerald-600 dark:text-emerald-400">deserves a pause.</span>
            </h1>

            <p className="hero-fade-3 mx-auto mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg lg:mx-0 dark:text-slate-300">
              MindCare is a compassionate digital space for PUP Santa Maria students to reflect, build healthy routines, and find supportive resources—without pressure or judgment.
            </p>

            <div className="hero-fade-4 mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link to="/login" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-extrabold text-white shadow-xl shadow-emerald-700/20 transition hover:-translate-y-1 hover:bg-emerald-700">
                Begin your gentle journey <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <a href="#discover" className="inline-flex items-center justify-center rounded-2xl border border-emerald-100 bg-white/80 px-6 py-4 text-sm font-extrabold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-200">
                Discover MindCare
              </a>
            </div>

            <div className="hero-fade-5 mt-10 flex justify-center gap-6 text-left lg:justify-start">
              <div>
                <strong className="block text-xl text-emerald-700 dark:text-emerald-300">Private</strong>
                <span className="text-xs text-slate-500 dark:text-slate-400">Your space, your pace</span>
              </div>
              <div className="border-l border-emerald-200 pl-6 dark:border-slate-700">
                <strong className="block text-xl text-emerald-700 dark:text-emerald-300">Supportive</strong>
                <span className="text-xs text-slate-500 dark:text-slate-400">Here when needed</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Scene with Pet Friends & Default Capybara Sitting in its Card */}
          <div className="landing-scene relative mx-auto h-[440px] w-full max-w-xl sm:h-[500px] lg:h-[610px]">
            <div className="absolute inset-x-[8%] bottom-[7%] h-[30%] rounded-[50%] bg-emerald-200/55 blur-2xl dark:bg-emerald-900/30" />
            
            {/* The Capybara sits natively in its default place inside the hero card */}
            <div className="landing-pet landing-pet-main border border-emerald-100/60 dark:border-emerald-900/40">
              <img
                src={PETS.capybara.images.happy}
                alt="A happy capybara companion"
              />
            </div>

            {/* Accompanying Pet Friends */}
            <div className="landing-pet landing-pet-rabbit">
              <img src={PETS.rabbit.images.idle} alt="A rabbit companion" />
            </div>
            <div className="landing-pet landing-pet-cat">
              <img src={PETS.cat.images.idle} alt="A cat companion" />
            </div>
            <div className="landing-pet landing-pet-otter">
              <img src={PETS.otter.images.happy} alt="An otter companion" />
            </div>

            {/* Floating Notes & Stars */}
            <div className="landing-note landing-note-top">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>You are doing enough.</span>
            </div>
            <div className="landing-note landing-note-bottom">
              <Heart className="h-4 w-4 fill-rose-400 text-rose-400" />
              <span>Small steps count.</span>
            </div>
            <span className="landing-star landing-star-one">✦</span>
            <span className="landing-star landing-star-two">✦</span>
            <span className="landing-star landing-star-three">♥</span>
          </div>
        </div>

        {/* Scroll Cue */}
        <a href="#discover" className="landing-scroll-cue absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 sm:flex dark:text-emerald-300">
          <span>Scroll to breathe</span>
          <i />
        </a>
      </section>

      {/* Section 2: Discover MindCare with Living Atmosphere and Words Anchoring */}
      <section id="discover" className="relative isolate overflow-hidden bg-white px-5 py-24 dark:bg-slate-900 sm:px-8">
        {/* Living background circles */}
        <div className="alive-orb alive-orb-3 top-10 -right-20 h-96 w-96 bg-emerald-300/30 dark:bg-emerald-950/30" aria-hidden="true" />
        <div className="alive-orb alive-orb-4 bottom-10 -left-20 h-96 w-96 bg-teal-300/30 dark:bg-teal-950/30" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl">
          {/* Section Heading: Companion follows the start of these words */}
          <div
            data-companion-anchor="true"
            data-companion-bubble="Take a gentle breath 🌿"
            className="reveal-on-scroll mx-auto max-w-2xl text-center"
          >
            <span className="text-xs font-black tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              A KINDER WAY FORWARD
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl dark:text-white">
              Wellness support that feels human.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">
              No one has to have everything figured out. MindCare gives you a quiet place to notice, reflect, and take the next helpful step.
            </p>
          </div>

          {/* Gentle Steps Cards: Companion follows across to each card title */}
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {gentleSteps.map(({ Icon, title, text, bubble }, index) => (
              <article
                key={title}
                data-companion-anchor="true"
                data-companion-bubble={bubble}
                className={`reveal-on-scroll delay-${(index + 1) * 100} rounded-3xl border border-emerald-100 bg-[#fbfefc] p-8 shadow-sm hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-xl font-extrabold text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Community & Call-to-Action with Living Emerald Aurora */}
      <section className="relative isolate overflow-hidden bg-emerald-700 px-5 py-24 text-white sm:px-8">
        <div className="alive-orb alive-orb-1 -right-24 -top-24 h-96 w-96 bg-emerald-400/40 blur-3xl" aria-hidden="true" />
        <div className="alive-orb alive-orb-2 -left-20 bottom-0 h-80 w-80 bg-teal-300/35 blur-3xl" aria-hidden="true" />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-9 text-center">
          {/* Companion glides over to the start of this CTA title */}
          <div
            data-companion-anchor="true"
            data-companion-bubble="Small steps count 🌟"
            className="reveal-on-scroll"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/20">
              <UsersRound className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-5xl">
              A little support can go a long way.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-emerald-50 sm:text-lg">
              Made with care for the PUP Santa Maria community—because every student deserves room to feel seen.
            </p>
          </div>

          <div className="reveal-on-scroll delay-200 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-extrabold text-emerald-800 shadow-xl transition hover:-translate-y-1 hover:bg-emerald-50"
            >
              Sign in to MindCare <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 px-6 py-4 text-sm font-extrabold text-white transition hover:bg-white/10"
            >
              Meet the team
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 px-5 py-8 text-center text-sm text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <span>© 2026 MindCare · PUP Santa Maria</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Built around care, privacy, and respect.
          </span>
        </div>
      </footer>
    </main>
  );
};
