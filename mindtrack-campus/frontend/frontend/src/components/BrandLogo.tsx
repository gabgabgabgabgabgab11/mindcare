/** Scalable, transparent artwork redrawn from the team's supplied logo. */
export const BrandLogo = ({ className = '', decorative = true }: { className?: string; decorative?: boolean }) => (
  <img
    src="/brand/mindcare-logo.svg"
    width="704"
    height="824"
    alt={decorative ? '' : 'MindCare: two leaves forming a heart around a student'}
    aria-hidden={decorative || undefined}
    className={`shrink-0 object-contain ${className}`}
  />
);
