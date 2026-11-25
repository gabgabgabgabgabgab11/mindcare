// Values match the profile API and PostgreSQL profile.year_level strings.
export const YEAR_LEVEL_OPTIONS = [
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
];

export const yearLevelLabel = (value: string) =>
  YEAR_LEVEL_OPTIONS.find(option => option.value === value)?.label ?? value;
