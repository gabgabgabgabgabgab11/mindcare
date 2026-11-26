import { BrandLogo } from '../components/BrandLogo';
import { LogoStory } from '../components/LogoStory';
import {
  ArrowLeft,
  CircleCheck,
  Eye,
  Heart,
  HeartHandshake,
  Mail,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../contexts/useAuth';
import { ScrollCompanion } from '../components/ScrollCompanion';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { PETS } from '../constants/pets';

// Keep portrait paths and profile URLs together for quick edits.
const PROFILE_PHOTOS = {
  emmanuel: '/team/emman.jpg',
  aldrin: '/team/aldrin.jpg',
  aira: '/team/aira.png',
  kevin: '/team/kevin.jpg',
  ella: '/team/ella.png',
  marjon: '/team/marjon.png',
  bryan: '/team/bryan.png',
};

const LINKEDIN_PROFILE_URLS = {
  emmanuel: 'https://www.linkedin.com/in/lasdoce-emmanuel-gabriel-r-a874a3277',
  aldrin: 'https://www.linkedin.com/in/aldrin-cantiga-424187412',
  aira: 'https://www.linkedin.com/in/aira-joy-dela-cruz-a1053340b',
  kevin: 'https://www.linkedin.com/in/kevin-de-jesus-607a72295',
};

const TEAM_MEMBERS = [
  {
    name: 'Emmanuel Gabriel R. Lasdoce',
    title: 'CEO & FOUNDER',
    role: 'Full Stack Developer',
    description: 'Contribution details to be provided.',
    photo: PROFILE_PHOTOS.emmanuel,
    linkedin: LINKEDIN_PROFILE_URLS.emmanuel,
    email: 'aldrincantiga30@gmail.com',
    bubble: 'Emmanuel · Full Stack Lead 💻',
  },
  {
    name: 'Aldrin C. Cantiga',
    title: 'CO-FOUNDER',
    role: 'Frontend Developer',
    description: 'Contribution details to be provided.',
    photo: PROFILE_PHOTOS.aldrin,
    linkedin: LINKEDIN_PROFILE_URLS.aldrin,
    email: 'aldrincantiga30@gmail.com',
    bubble: 'Aldrin · Frontend Specialist 🎨',
  },
  {
    name: 'Aira Joy L. Dela Cruz',
    title: 'CO-FOUNDER',
    role: 'Data Analyst',
    description: 'Contribution details to be provided.',
    photo: PROFILE_PHOTOS.aira,
    linkedin: LINKEDIN_PROFILE_URLS.aira,
    email: 'airajoydelaCruz30@gmail.com',
    bubble: 'Aira · Data Analyst 📊',
  },
  {
    name: 'Kevin S. De Jesus',
    title: 'CO-FOUNDER',
    role: 'QA Tester',
    description: 'Contribution details to be provided.',
    photo: PROFILE_PHOTOS.kevin,
    linkedin: LINKEDIN_PROFILE_URLS.kevin,
    email: 'dejesus.kevinkevin2004@gmail.com',
    bubble: 'Kevin · QA Tester 🔍',
  },
];

const CORE_VALUES = [
  {
    title: 'Empathy',
    description: "Understanding and respecting students' experiences.",
    Icon: Heart,
  },
  {
    title: 'Privacy',
    description: 'Protecting sensitive personal and wellness information.',
    Icon: ShieldCheck,
  },
  {
    title: 'Accessibility',
    description: 'Making wellness support tools approachable and easy to use.',
    Icon: Sparkles,
  },
  {
    title: 'Respect',
    description: 'Promoting a safe, inclusive, and nonjudgmental environment.',
    Icon: UsersRound,
  },
  {
    title: 'Responsibility',
    description: 'Encouraging appropriate support and responsible use of wellness information.',
    Icon: CircleCheck,
  },
];

const VALIDATORS = [
  {
    role: 'PSYCHOLOGY CONSULTANT / LICENSED PSYCHOLOGIST',
    name: 'Dr. Ella Faith Torres',
    subtitle: ' RPm, RPsy, PhD',
    scope: 'Reviewed MindCare’s psychological components, including the PHQ-9 and GAD-7 screening tool implementation, mental wellness safeguards, informed consent and risk disclosures, peer-support features, and visual design for psychological appropriateness',
    photo: PROFILE_PHOTOS.ella,
    bubble: 'Dr. Torres · Licensed Psychologist 🧠',
  },
  {
    role: 'IT PROFESSIONAL VALIDATOR',
    name: 'Mr. Marjon M. Alarcon, MIT',
    subtitle: 'Master in Information Technology · Senior Python Developer',
    scope: 'Reviewed the ISO/IEC 25010-based System Quality Evaluation questionnaire for its suitability in assessing the software quality of MindCare web-based system.',
    photo: PROFILE_PHOTOS.marjon,
    bubble: 'Mr. Alarcon · IT Professional 🛠️',
  },
  {
    role: 'PROJECT ADVISER',
    name: 'Mr. Bryan Lawrence Asistin',
    subtitle: 'Capstone Adviser',
    scope: 'Provided academic guidance and recommendations on MindCare’s research, system development, documentation, and alignment with the project objectives.',
    photo: PROFILE_PHOTOS.bryan,
    bubble: 'Mr. Asistin · Capstone Adviser 🎓',
  },
];

const linkedinSearchUrl = (name: string) =>
  `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(name)}`;


export const AboutUs = () => {
  useScrollReveal();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="about-page min-h-screen w-full overflow-x-hidden bg-[#f8fcfa] text-slate-800 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      {/* The Single MindCare Guide Companion - travels across the page following sections */}
      <ScrollCompanion />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-emerald-100/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-2 gap-y-3 px-3 py-4 sm:gap-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-5">
            <Link
              to="/"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:px-3.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white dark:focus:ring-offset-slate-900"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5" aria-label="MindCare home">
              <BrandLogo className="h-11 w-11" />
              <span className="min-w-0">
                <span className="mindcare-wordmark block truncate text-base font-black leading-tight tracking-tight text-slate-900 dark:text-white sm:text-lg">MindCare</span>
              </span>
            </Link>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-800 ring-1 ring-inset ring-emerald-100 sm:px-4 sm:py-2 sm:text-sm dark:bg-emerald-950/70 dark:text-emerald-200 dark:ring-emerald-900">
              About Us
            </span>
            <ThemeToggle variant="icon" />
            {isAuthenticated ? (
              <Button
                variant="secondary"
                type="button"
                onClick={handleLogout}
                className="py-1.5 px-2 sm:px-4 text-xs border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 shadow-2xs"
              >
                Log Out
              </Button>
            ) : (
              <Link
                to="/login"
                className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 sm:px-4 sm:text-sm"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section with 2-Column Showcase, Living Orbs, & Docked Companion Scene */}
        <section className="about-hero relative isolate min-h-[720px] overflow-hidden bg-gradient-to-b from-emerald-50 via-emerald-50/45 to-white px-5 pb-20 pt-12 sm:px-8 sm:pb-24 sm:pt-16 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
          {/* Living, bouncing ambient circles that move like they're alive */}
          <div className="alive-orb alive-orb-1 -left-20 top-12 h-80 w-80 bg-emerald-400/35 dark:bg-emerald-600/25" aria-hidden="true" />
          <div className="alive-orb alive-orb-2 -right-24 top-20 h-96 w-96 bg-sky-400/35 dark:bg-sky-600/25" aria-hidden="true" />
          <div className="alive-orb alive-orb-3 -bottom-10 left-1/3 h-80 w-80 bg-amber-300/35 dark:bg-teal-600/25" aria-hidden="true" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-8">
            {/* Left Column: About Copy & Origin Card with Smooth Entrance */}
            <div className="pt-4 text-center lg:text-left">
              <div className="hero-fade-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/85 px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-200">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
                  Student wellness, thoughtfully supported
                </span>
              </div>

              <h1 className="hero-fade-2 mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
                About MindCare
              </h1>

              <p className="hero-fade-3 mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
                MindCare is a compassionate, web-based mental wellness monitoring and peer support system designed to help PUP Santa Maria students reflect on their well-being, build healthy routines, and access supportive resources—without pressure or judgment.
              </p>

              {/* Our Origin Card */}
              <div
                data-companion-anchor="true"
                data-companion-bubble="Rooted in student care 💚"
                className="hero-fade-4 mt-8 flex max-w-2xl items-start gap-4 rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-[0_12px_40px_-24px_rgba(6,95,70,0.35)] backdrop-blur-md transition hover:-translate-y-1 hover:shadow-xl sm:p-6 dark:border-slate-800 dark:bg-slate-900/90"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <HeartHandshake className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Our Origin</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">
                    MindCare was developed as a student capstone project to support mental wellness awareness, self-reflection, and access to peer support in academic institutions.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Scene with Pet Friends & Capybara in its Default Place */}
            <div className="landing-scene relative mx-auto h-[440px] w-full max-w-xl sm:h-[500px] lg:h-[580px]">
              <div className="absolute inset-x-[8%] bottom-[7%] h-[30%] rounded-[50%] bg-emerald-200/55 blur-2xl dark:bg-emerald-900/30" />

              {/* The Capybara sits in its default place inside the card */}
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
                <span>Thoughtfully designed.</span>
              </div>
              <div className="landing-note landing-note-bottom">
                <Heart className="h-4 w-4 fill-rose-400 text-rose-400" />
                <span>Built by students, for students.</span>
              </div>
              <span className="landing-star landing-star-one">✦</span>
              <span className="landing-star landing-star-two">✦</span>
              <span className="landing-star landing-star-three">♥</span>
            </div>
          </div>

          {/* Scroll Cue */}
          <a
            href="#purpose-heading"
            className="landing-scroll-cue absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 sm:flex dark:text-emerald-300"
          >
            <span>Scroll to explore</span>
            <i />
          </a>
        </section>

        <LogoStory />

        {/* Purpose / Mission / Vision Section */}
        <section aria-labelledby="purpose-heading" className="about-section relative isolate overflow-hidden mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="alive-orb alive-orb-3 right-0 top-1/2 h-80 w-80 bg-emerald-300/30 dark:bg-emerald-950/25" aria-hidden="true" />
          <div className="alive-orb alive-orb-4 -left-10 bottom-10 h-80 w-80 bg-teal-300/30 dark:bg-teal-950/25" aria-hidden="true" />

          <SectionHeading
            label="WHAT GUIDES US"
            title="Purpose built around student care"
            description="Our direction centers on approachable support, thoughtful self-reflection, and responsible use of wellness information."
            id="purpose-heading"
            bubble="Guided by empathy ✨"
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article
              data-companion-anchor="true"
              data-companion-bubble="Our Mission: Empower students 🎓"
              className="reveal-on-scroll delay-100 rounded-3xl bg-emerald-600 p-8 text-white shadow-xl shadow-emerald-900/15 hover:-translate-y-1.5 hover:shadow-2xl dark:bg-emerald-700"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-inset ring-white/20">
                <Heart className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-2xl font-extrabold tracking-tight">Our Mission</h3>
              <p className="mt-3 text-base leading-7 text-emerald-50">
                To provide students with accessible tools for wellness monitoring, self-reflection, and peer support while encouraging awareness of mental wellness in academic institutions.
              </p>
            </article>

            <article
              data-companion-anchor="true"
              data-companion-bubble="Our Vision: Inclusive community 🌟"
              className="reveal-on-scroll delay-200 rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm hover:-translate-y-1.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900">
                <Eye className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Our Vision</h3>
              <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
                To contribute to a more supportive, inclusive, and mental-health-aware academic community where students are encouraged to care for their well-being and seek appropriate support when needed.
              </p>
            </article>
          </div>

          {/* Core Values */}
          <div className="mt-16">
            <div
              data-companion-anchor="true"
              data-companion-bubble="Our Core Values 💫"
              className="reveal-on-scroll"
            >
              <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Our Core Values</h3>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {CORE_VALUES.map(({ title, description, Icon }, index) => (
                <article
                  key={title}
                  className={`reveal-on-scroll delay-${(index + 1) * 100} rounded-2xl border border-emerald-100/80 bg-white p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h4 className="mt-4 font-bold text-slate-900 dark:text-slate-100">{title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section with Living Mint Glow */}
        <section aria-labelledby="team-heading" className="about-section relative isolate overflow-hidden bg-emerald-50/55 py-16 sm:py-24 dark:bg-slate-900/70">
          <div className="alive-orb alive-orb-4 -left-20 top-1/3 h-96 w-96 bg-teal-300/30 dark:bg-teal-950/30" aria-hidden="true" />
          <div className="alive-orb alive-orb-1 -right-20 bottom-10 h-96 w-96 bg-emerald-300/30 dark:bg-emerald-950/30" aria-hidden="true" />

          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <SectionHeading
              label="THE PROPONENTS"
              title="Meet the team"
              description="The student founders and developers behind the MindCare capstone project."
              id="team-heading"
              bubble="Meet the creators! 👥"
            />

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
              {TEAM_MEMBERS.map((member, index) => {
                const linkedinUrl = member.linkedin || linkedinSearchUrl(member.name);

                return (
                  <article
                    key={member.name}
                    data-companion-anchor="true"
                    data-companion-bubble={member.bubble}
                    className={`reveal-on-scroll delay-${(index % 2 + 1) * 150} group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm hover:-translate-y-1.5 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900`}
                  >
                    <div className="flex justify-center bg-linear-to-br from-emerald-600 to-teal-900 p-6">
                      <img
                        src={member.photo}
                        alt={`${member.name} portrait placeholder`}
                        loading="lazy"
                        className="h-44 w-44 rounded-2xl border-4 border-white/20 object-cover shadow-lg transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6 sm:p-8">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-extrabold tracking-[0.15em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        {member.title}
                      </span>
                      <h3 className="mt-3 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">{member.name}</h3>
                      <p className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">{member.role}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">{member.description}</p>
                      <div className="my-5 border-t border-slate-100 dark:border-slate-800" />
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 dark:hover:bg-emerald-900 dark:focus:ring-offset-slate-900"
                          aria-label={`Find ${member.name} on LinkedIn`}
                        >
                          LinkedIn ↗
                        </a>
                        <span aria-disabled="true" className="inline-flex cursor-not-allowed items-center rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
                          GitHub pending
                        </span>
                        {member.email ? (
                          <a
                            href={`mailto:${member.email}`}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-800 dark:hover:bg-slate-700 dark:hover:text-emerald-200 dark:focus:ring-offset-slate-900"
                            aria-label={`Email ${member.name}`}
                          >
                            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                            Email
                          </a>
                        ) : (
                          <span aria-disabled="true" className="inline-flex cursor-not-allowed items-center rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
                            Email pending
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Validators Section */}
        <section aria-labelledby="validators-heading" className="about-section relative isolate overflow-hidden mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="alive-orb alive-orb-3 -right-20 top-1/4 h-80 w-80 bg-emerald-300/30 dark:bg-emerald-950/20" aria-hidden="true" />

          <SectionHeading
            label="INDEPENDENT GUIDANCE"
            title="Consultants and Professional Validators"
            description="These roles are presented separately from the MindCare system developers to clearly represent their specific review or advisory scope."
            id="validators-heading"
            bubble="Reviewed with diligence 🛡️"
          />

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {VALIDATORS.map((validator, index) => (
              <article
                key={validator.name}
                data-companion-anchor="true"
                data-companion-bubble={validator.bubble}
                className={`reveal-on-scroll delay-${(index + 1) * 150} overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm hover:-translate-y-1.5 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900`}
              >
                <div className="flex h-48 items-center justify-center bg-emerald-50/70 p-6 dark:bg-slate-800">
                  {validator.photo ? (
                    <img
                      src={validator.photo}
                      alt={`${validator.name} portrait placeholder`}
                      loading="lazy"
                      className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-sm transition duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md ring-8 ring-emerald-100 dark:bg-emerald-700 dark:ring-slate-700">
                      <UsersRound className="h-11 w-11" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <span className="text-[10px] font-extrabold leading-5 tracking-[0.13em] text-slate-500 dark:text-slate-400">{validator.role}</span>
                  <h3 className="mt-2 text-lg font-extrabold leading-snug text-slate-900 dark:text-white">{validator.name}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-emerald-700 dark:text-emerald-300">{validator.subtitle}</p>
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                    <p className="text-[10px] font-extrabold tracking-[0.15em] text-slate-500 dark:text-slate-400">REVIEW / GUIDANCE SCOPE</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{validator.scope}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Validation Section with Living Aurora Background */}
        <section aria-labelledby="validation-heading" className="about-section relative isolate overflow-hidden bg-[#0f242a] px-5 py-16 text-white sm:px-8 sm:py-20">
          <div className="alive-orb alive-orb-2 -right-20 top-0 h-96 w-96 bg-emerald-400/30 blur-3xl" aria-hidden="true" />
          <div className="alive-orb alive-orb-1 -left-20 bottom-0 h-80 w-80 bg-teal-400/25 blur-3xl" aria-hidden="true" />

          <div className="relative mx-auto max-w-7xl">
            <SectionHeading
              label="TRANSPARENT ATTRIBUTION"
              title="Validation Information"
              description="Only the specific component and scope supplied for this project are shown. This information does not imply clinical validation or certification of the entire MindCare system."
              id="validation-heading"
              dark
              bubble="Safe & transparent 🤍"
            />

            <dl className="mt-10 grid gap-5 md:grid-cols-3">
              <div className="reveal-on-scroll delay-100">
                <InfoItem label="COMPONENT REVIEWED">
                  System Quality Evaluation questionnaire based on ISO/IEC 25010
                </InfoItem>
              </div>
              <div className="reveal-on-scroll delay-200">
                <InfoItem label="VALIDATOR">
                  Mr. Marjon M. Alarcon, MIT — IT Professional Validator
                </InfoItem>
              </div>
              <div className="reveal-on-scroll delay-300">
                <InfoItem label="VALIDATION DATE">October 16, 2026</InfoItem>
              </div>
            </dl>

            <div className="reveal-on-scroll delay-400 mt-6 flex items-start gap-4 rounded-3xl border border-white/10 bg-white/[0.07] p-6 backdrop-blur-md transition hover:bg-white/[0.09] sm:p-7">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-emerald-200">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="text-sm leading-7 text-slate-200 sm:text-base">
                <strong className="font-bold text-white">Mental Wellness Disclaimer:</strong> MindCare is a non-diagnostic mental wellness support tool. It does not replace professional counseling, therapy, medical advice, or treatment. Users are encouraged to seek qualified professional assistance when needed.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="reveal-on-scroll mx-auto grid max-w-7xl gap-9 px-5 py-10 sm:px-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div className="flex items-start gap-3">
            <BrandLogo className="h-11 w-11" />
            <div>
              <p className="mindcare-wordmark text-base font-black tracking-tight text-slate-900 dark:text-white">MindCare</p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Supporting student wellness through self-reflection and peer support. A student-developed capstone project at PUP Santa Maria Campus.
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 px-5 py-4 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:px-8">
          © 2026 MindCare. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

function SectionHeading({
  label,
  title,
  description,
  id,
  dark = false,
  bubble,
}: {
  label: string;
  title: string;
  description: string;
  id: string;
  dark?: boolean;
  bubble?: string;
}) {
  return (
    <div
      data-companion-anchor={bubble ? 'true' : undefined}
      data-companion-bubble={bubble}
      className="reveal-on-scroll max-w-3xl"
    >
      <p className={`text-xs font-extrabold tracking-[0.2em] ${dark ? 'text-emerald-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{label}</p>
      <h2 id={id} className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${dark ? 'text-white' : 'text-slate-950 dark:text-slate-100'}`}>
        {title}
      </h2>
      <p className={`mt-3 text-sm leading-7 sm:text-base ${dark ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>{description}</p>
    </div>
  );
}

function InfoItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/4 p-6 transition hover:bg-white/[0.07] dark:border-white/10 dark:bg-white/4">
      <dt className="text-[10px] font-extrabold tracking-[0.16em] text-emerald-300">{label}</dt>
      <dd className="mt-3 text-sm font-semibold leading-6 text-white">{children}</dd>
    </div>
  );
}
