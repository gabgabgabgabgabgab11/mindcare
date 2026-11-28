import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Check, X } from 'lucide-react';
import { PRODUCT_TOURS, type ProductTourPage, type TourReplayRequest } from './productTourSteps';
import './ProductTour.css';

type TourRect = { top: number; left: number; width: number; height: number };
type TourLayout = {
  target: TourRect;
  popover: { top: number; left: number; width: number };
  viewport: { width: number; height: number };
};
type Position = 'top' | 'right' | 'bottom' | 'left';
const SPOTLIGHT_PADDING = 8;
const POPOVER_GUTTER = 16;
const POPOVER_ESTIMATED_HEIGHT = 240;

const getTourStorageKey = (userId: string, page: ProductTourPage) => {
  const version = page === 'journal' ? 'v2' : 'v1';
  return `mindcare_tour_${version}:${userId}:${page}`;
};

const getVisibleTarget = (targetName: string) => {
  const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${targetName}"]`);
  return Array.from(candidates).find((candidate) => {
    const rect = candidate.getBoundingClientRect();
    const style = window.getComputedStyle(candidate);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  });
};

const getPopoverPosition = (rect: DOMRect, stepIndex: number, width: number) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const target = {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    right: rect.right + SPOTLIGHT_PADDING,
    bottom: rect.bottom + SPOTLIGHT_PADDING,
  };
  const positions: Position[] = stepIndex === 0
    ? ['left', 'right', 'bottom', 'top']
    : ['bottom', 'left', 'right', 'top'];
  const placements: Record<Position, { top: number; left: number; fits: boolean }> = {
    top: {
      top: target.top - POPOVER_ESTIMATED_HEIGHT - POPOVER_GUTTER,
      left: rect.left + rect.width / 2 - width / 2,
      fits: target.top - POPOVER_ESTIMATED_HEIGHT - POPOVER_GUTTER >= 12,
    },
    right: {
      top: rect.top + rect.height / 2 - POPOVER_ESTIMATED_HEIGHT / 2,
      left: target.right + POPOVER_GUTTER,
      fits: target.right + POPOVER_GUTTER + width <= viewportWidth - 12,
    },
    bottom: {
      top: target.bottom + POPOVER_GUTTER,
      left: rect.left + rect.width / 2 - width / 2,
      fits: target.bottom + POPOVER_GUTTER + POPOVER_ESTIMATED_HEIGHT <= viewportHeight - 12,
    },
    left: {
      top: rect.top + rect.height / 2 - POPOVER_ESTIMATED_HEIGHT / 2,
      left: target.left - width - POPOVER_GUTTER,
      fits: target.left - width - POPOVER_GUTTER >= 12,
    },
  };
  const placement = positions.map((position) => placements[position]).find((candidate) => candidate.fits)
    ?? placements.bottom;
  const maxLeft = Math.max(12, viewportWidth - width - 12);
  const maxTop = Math.max(12, viewportHeight - POPOVER_ESTIMATED_HEIGHT - 12);

  return {
    left: Math.min(maxLeft, Math.max(12, placement.left)),
    top: Math.min(maxTop, Math.max(12, placement.top)),
  };
};

interface ProductTourProps {
  page: ProductTourPage | null;
  userId?: string;
  replayRequest: TourReplayRequest | null;
}

export const ProductTour = ({ page, userId, replayRequest }: ProductTourProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [layout, setLayout] = useState<TourLayout | null>(null);
  const handledReplayId = useRef(0);
  const storageKey = page && userId ? getTourStorageKey(userId, page) : null;
  const steps = page ? PRODUCT_TOURS[page] : [];

  // Each page has its own first-visit flag, scoped to the signed-in user.
  useEffect(() => {
    setLayout(null);
    setStepIndex(0);
    if (!storageKey) {
      setIsOpen(false);
      return;
    }

    try {
      setIsOpen(window.localStorage.getItem(storageKey) !== 'complete');
    } catch {
      setIsOpen(true);
    }
  }, [storageKey]);

  // The Help button removes the current page's flag and starts it again immediately.
  useEffect(() => {
    if (!page || !replayRequest || replayRequest.page !== page || replayRequest.id === handledReplayId.current) return;
    handledReplayId.current = replayRequest.id;
    if (storageKey) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Replay still works for the current visit when browser storage is disabled.
      }
    }
    setStepIndex(0);
    setLayout(null);
    setIsOpen(true);
  }, [page, replayRequest, storageKey, userId]);

  const finishTour = useCallback(() => {
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, 'complete');
      } catch {
        // The tour still closes for this visit if storage is unavailable.
      }
    }
    setIsOpen(false);
    setLayout(null);
  }, [storageKey]);

  const advanceStep = useCallback(() => {
    if (stepIndex >= steps.length - 1) {
      finishTour();
      return;
    }
    setStepIndex((currentStep) => currentStep + 1);
  }, [finishTour, stepIndex, steps.length]);

  useEffect(() => {
    if (!isOpen || steps.length === 0) {
      setLayout(null);
      return;
    }

    let scrolledTarget: HTMLElement | null = null;
    const updateLayout = () => {
      const target = getVisibleTarget(steps[stepIndex].target);
      if (!target) return;
      if (target !== scrolledTarget) {
        scrolledTarget = target;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center', inline: 'nearest' });
      }

      const rect = target.getBoundingClientRect();
      const width = Math.max(1, Math.min(340, window.innerWidth - 24));
      const popover = getPopoverPosition(rect, stepIndex, width);
      const nextLayout: TourLayout = {
        target: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        popover: { ...popover, width },
        viewport: { width: window.innerWidth, height: window.innerHeight },
      };
      setLayout((current) => {
        if (
          current
          && current.target.top === nextLayout.target.top
          && current.target.left === nextLayout.target.left
          && current.target.width === nextLayout.target.width
          && current.target.height === nextLayout.target.height
          && current.popover.top === nextLayout.popover.top
          && current.popover.left === nextLayout.popover.left
          && current.popover.width === nextLayout.popover.width
          && current.viewport.width === nextLayout.viewport.width
          && current.viewport.height === nextLayout.viewport.height
        ) return current;
        return nextLayout;
      });
    };

    const frame = window.requestAnimationFrame(updateLayout);
    const retryTimer = window.setInterval(updateLayout, 300);
    window.addEventListener('resize', updateLayout);
    window.addEventListener('scroll', updateLayout, true);
    const target = getVisibleTarget(steps[stepIndex].target);
    const resizeObserver = target && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateLayout)
      : null;
    if (target) resizeObserver?.observe(target);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(retryTimer);
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('scroll', updateLayout, true);
      resizeObserver?.disconnect();
    };
  }, [isOpen, stepIndex, steps]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finishTour();
      if (event.key === 'ArrowRight') advanceStep();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advanceStep, finishTour, isOpen]);

  if (!isOpen || !layout || !page) return null;

  const step = steps[stepIndex];
  const spotlight = {
    top: layout.target.top - SPOTLIGHT_PADDING,
    left: layout.target.left - SPOTLIGHT_PADDING,
    width: layout.target.width + SPOTLIGHT_PADDING * 2,
    height: layout.target.height + SPOTLIGHT_PADDING * 2,
  };
  return createPortal(
    <div className="product-tour" aria-live="polite">
      <svg
        className="product-tour__backdrop"
        width="100%"
        height="100%"
        viewBox={`0 0 ${layout.viewport.width} ${layout.viewport.height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <mask id="product-tour-backdrop-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={layout.viewport.width} height={layout.viewport.height}>
            <rect x="0" y="0" width={layout.viewport.width} height={layout.viewport.height} fill="white" />
            <rect
              className="product-tour__mask-hole"
              x={spotlight.left}
              y={spotlight.top}
              width={spotlight.width}
              height={spotlight.height}
              rx="18"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width={layout.viewport.width}
          height={layout.viewport.height}
          fill="rgb(12 12 27 / 72%)"
          mask="url(#product-tour-backdrop-mask)"
          pointerEvents="all"
          onClick={advanceStep}
        />
      </svg>

      <button
        type="button"
        className="product-tour__spotlight"
        style={spotlight}
        onClick={advanceStep}
        aria-label={`Continue tour: ${step.title}`}
      />

      <section
        className="product-tour__popover"
        style={{ top: layout.popover.top, left: layout.popover.left, width: layout.popover.width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-tour-title"
        aria-describedby="product-tour-description"
      >
        <div className="product-tour__popover-topline">
          <span className="product-tour__eyebrow">{step.eyebrow}</span>
          <button type="button" className="product-tour__close" onClick={finishTour} aria-label="Skip tour">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <h2 id="product-tour-title" className="product-tour__title">{step.title}</h2>
        <p id="product-tour-description" className="product-tour__description">{step.description}</p>
        <div className="product-tour__footer">
          <div className="product-tour__progress" aria-label={`Step ${stepIndex + 1} of ${steps.length}`}>
            {steps.map((tourStep, index) => (
              <span
                key={tourStep.target}
                className={`product-tour__progress-dot${index === stepIndex ? ' is-active' : ''}${index < stepIndex ? ' is-complete' : ''}`}
              />
            ))}
            <span className="product-tour__step-count">{stepIndex + 1} of {steps.length}</span>
          </div>
          <button type="button" className="product-tour__next" onClick={advanceStep}>
            {stepIndex === steps.length - 1 ? (
              <><span>Done</span><Check size={15} aria-hidden="true" /></>
            ) : (
              <><span>Next</span><ArrowRight size={15} aria-hidden="true" /></>
            )}
          </button>
        </div>
        <span className="product-tour__hint">Click outside this card to continue</span>
      </section>
    </div>,
    document.body,
  );
};
