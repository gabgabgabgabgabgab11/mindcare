import { useEffect } from 'react';

/**
 * Attaches an IntersectionObserver to elements with the `.reveal-on-scroll` class.
 * Triggers a slower, buttery-smooth move-in and fade animation when elements scroll into view.
 */
export function useScrollReveal() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const elements = document.querySelectorAll<HTMLElement>('.reveal-on-scroll');
    if (!elements.length) return;

    if (prefersReducedMotion) {
      elements.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    elements.forEach((el) => {
      // If element is already in the upper half of screen on initial load, reveal it
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.6 && rect.bottom > 0) {
        // Small delay so initial load is noticeable and smooth
        setTimeout(() => el.classList.add('is-revealed'), 80);
      } else {
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);
}
