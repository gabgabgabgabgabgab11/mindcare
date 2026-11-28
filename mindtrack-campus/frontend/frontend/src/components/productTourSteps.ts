export interface ProductTourStep {
  target: string;
  eyebrow: string;
  title: string;
  description: string;
}

export interface TourReplayRequest {
  page: ProductTourPage;
  id: number;
}

export const PRODUCT_TOURS = {
  dashboard: [
    {
      target: 'companion',
      eyebrow: 'YOUR WELLNESS BUDDY',
      title: 'Meet your Wellness Companion',
      description: 'Your campus buddy is here to cheer you on. Give them a tap to see how they react, or choose a companion that feels right for you.',
    },
    {
      target: 'navigation',
      eyebrow: 'YOUR CAMPUS TOOLKIT',
      title: 'Everything you need, in one place',
      description: 'Visit My Journal, explore Resources, share encouragement on the Freedom Wall, or update your Profile. On mobile, open the menu to find these spaces.',
    },
    {
      target: 'utilities',
      eyebrow: 'MAKE IT YOURS',
      title: 'A few handy controls',
      description: 'Check Notifications for updates, switch between light and dark themes, or replay this tour any time with the Help button.',
    },
    {
      target: 'mood-checkin',
      eyebrow: 'DAILY CHECK-IN',
      title: 'How are you feeling?',
      description: 'Choose the mood that fits today. Your check-ins help you notice patterns over time, and you can take it one day at a time.',
    },
    {
      target: 'journal-streak',
      eyebrow: 'SMALL STEPS ADD UP',
      title: 'Your Journal Streak',
      description: 'See your recent journaling activity and today’s prompt. A short reflection can be a good place to start.',
    },
    {
      target: 'assessment-phq9',
      eyebrow: 'SELF-REFLECTION',
      title: 'PHQ-9 mood check',
      description: 'This optional questionnaire helps you reflect on your mood over the past two weeks. You can start it whenever you feel ready.',
    },
    {
      target: 'assessment-gad7',
      eyebrow: 'SELF-REFLECTION',
      title: 'GAD-7 anxiety check',
      description: 'This optional check-in helps you reflect on anxiety and possible triggers. Your responses are here to support your own understanding.',
    },
  ],
  journal: [
    {
      target: 'journal-notebooks',
      eyebrow: 'YOUR NOTEBOOK SHELF',
      title: 'Make each notebook yours',
      description: 'Create notebooks with their own title, cover color, and optional cover image. Open a notebook cover to see the pages saved inside it.',
    },
    {
      target: 'journal-create',
      eyebrow: 'A PAGE THAT FEELS LIKE YOURS',
      title: 'Write and design a page',
      description: 'Start a full-screen page, choose a color and ruled, dotted, grid, or blank paper, then add stickers, tape, photos, or small GIFs inline with your writing.',
    },
    {
      target: 'journal-history',
      eyebrow: 'FIND YOUR PAGES AGAIN',
      title: 'Search, sort, and archive',
      description: 'Find a page by title or text, sort by date or title, and archive or restore entries whenever you like.',
    },
  ],
  resources: [
    {
      target: 'resources-search',
      eyebrow: 'FIND THE RIGHT RESOURCE',
      title: 'Search and filter',
      description: 'Search by keyword or choose a category to narrow the campus, hotline, external, and self-care resources.',
    },
    {
      target: 'resources-list',
      eyebrow: 'SUPPORT WHEN YOU NEED IT',
      title: 'Explore your resources',
      description: 'Open a resource card to learn more or visit its linked service. You can return here whenever you need a next step.',
    },
  ],
  freedomWall: [
    {
      target: 'freedom-compose',
      eyebrow: 'SHARE SOMETHING KIND',
      title: 'Post to the Freedom Wall',
      description: 'Share an affirmation, a moment of gratitude, or a small win. Choose a display name if you want one, then post when you’re ready.',
    },
    {
      target: 'freedom-feed',
      eyebrow: 'A LITTLE ENCOURAGEMENT',
      title: 'Read the community wall',
      description: 'Browse positive notes from other students. You can report a post if something does not feel appropriate.',
    },
  ],
  profile: [
    {
      target: 'profile-header',
      eyebrow: 'YOUR ACCOUNT',
      title: 'Your profile at a glance',
      description: 'Review your account details and the program information associated with your profile.',
    },
    {
      target: 'profile-companion',
      eyebrow: 'MAKE IT YOURS',
      title: 'Choose your companion',
      description: 'Pick a pet to cheer you on, give them a nickname, and save your choice here.',
    },
    {
      target: 'profile-consent',
      eyebrow: 'YOUR CHOICES MATTER',
      title: 'Wellness consent',
      description: 'Check the status of your consent for protected wellness features and review the current consent version.',
    },
    {
      target: 'profile-stats',
      eyebrow: 'YOUR ACTIVITY',
      title: 'A quick wellness snapshot',
      description: 'See your check-ins, journal entries, and consent status together.',
    },
    {
      target: 'profile-settings',
      eyebrow: 'ACCOUNT CONTROLS',
      title: 'Privacy and support settings',
      description: 'Open privacy and security options, manage notification preferences, or find help and support.',
    },
  ],
} satisfies Record<string, ProductTourStep[]>;

export type ProductTourPage = keyof typeof PRODUCT_TOURS;

const TOUR_ROUTES: Array<{ page: ProductTourPage; path: string }> = [
  { page: 'dashboard', path: '/dashboard' },
  { page: 'journal', path: '/journal' },
  { page: 'resources', path: '/resources' },
  { page: 'freedomWall', path: '/mantra-wall' },
  { page: 'profile', path: '/profile' },
];

export const getProductTourPage = (pathname: string): ProductTourPage | null => {
  const route = TOUR_ROUTES.find(({ path }) => pathname === path);
  return route?.page ?? null;
};
