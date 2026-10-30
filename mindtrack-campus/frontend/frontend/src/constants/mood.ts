import type { MoodScore } from '../types';

export interface MoodOption {
  score: MoodScore;
  label: string;
  emoji: string;
  // Soft tones only - no red. See the psychologist review notes.
  tone: string;
}

// The single source of truth for the 1-5 mood scale. The backend stores the
// integer; students only ever see the face and the word.
export const MOOD_OPTIONS: MoodOption[] = [
  { score: 1, label: 'Very Low', emoji: '\u{1F614}', tone: 'bg-sky-50 border-sky-100 text-sky-900' },
  { score: 2, label: 'Low', emoji: '\u{1F641}', tone: 'bg-blue-50 border-blue-100 text-blue-900' },
  { score: 3, label: 'Neutral', emoji: '\u{1F610}', tone: 'bg-amber-50 border-amber-100 text-amber-900' },
  { score: 4, label: 'Good', emoji: '\u{1F642}', tone: 'bg-teal-50 border-teal-100 text-teal-900' },
  { score: 5, label: 'Very Good', emoji: '\u{1F604}', tone: 'bg-emerald-50 border-emerald-100 text-emerald-900' },
];

export const moodOptionFor = (score: MoodScore): MoodOption | undefined =>
  MOOD_OPTIONS.find((option) => option.score === score);

