import { useEffect, useRef, useState } from 'react';
import { PETS } from '../constants/pets';

interface AnchorTarget {
  element: HTMLElement;
  rect: DOMRect;
  bubble: string;
}

/**
 * Intelligent single companion guide that follows the user as they scroll.
 * - Perfectly synchronized with the hero card Capybara.
 * - Starts at the exact screen position of the hero card.
 * - When scrolling, glides to words with speech bubbles that are NEVER mirrored or cut off.
 */
export const ScrollCompanion = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bubbleText, setBubbleText] = useState('Welcome to MindCare 🌿');
  const [isActive, setIsActive] = useState(false);
  const [isFacingLeft, setIsFacingLeft] = useState(false);

  useEffect(() => {
    let frameId = 0;
    let lastActiveEl: HTMLElement | null = null;

    const updatePosition = () => {
      frameId = 0;
      const container = containerRef.current;
      if (!container) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobile = viewportWidth < 768;
      const compW = isMobile ? 64 : 76;
      const compH = isMobile ? 64 : 76;

      // Locate the hero scene and hero pet image
      const heroPetImg = document.querySelector<HTMLElement>('.landing-pet-main img');
      const heroScene = document.querySelector<HTMLElement>('.landing-scene');

      let inHeroZone = false;
      if (heroScene) {
        const heroSceneRect = heroScene.getBoundingClientRect();
        if (heroSceneRect.bottom > 120 && heroSceneRect.top < viewportHeight - 100) {
          inHeroZone = true;
        }
      } else if (window.scrollY < 100) {
        inHeroZone = true;
      }

      if (inHeroZone && heroPetImg) {
        const heroRect = heroPetImg.getBoundingClientRect();
        const targetX = heroRect.left + (heroRect.width - compW) / 2;
        const targetY = heroRect.top + (heroRect.height - compH) / 2;

        container.style.setProperty('--companion-x', `${targetX}px`);
        container.style.setProperty('--companion-y', `${targetY}px`);
        container.style.setProperty('--companion-scale', `${heroRect.width / compW}`);
        container.style.setProperty('--companion-dir', '1');

        setIsFacingLeft(false);
        setIsActive(false);
        return;
      }

      // Past the hero section: companion travels to active text anchors
      const anchorEls = Array.from(
        document.querySelectorAll<HTMLElement>('[data-companion-anchor]')
      ).filter((el) => el.getAttribute('data-companion-hero') !== 'true');

      if (anchorEls.length === 0) {
        setIsActive(false);
        return;
      }

      const sweetSpot = viewportHeight * 0.38;
      let bestAnchor: AnchorTarget | null = null;
      let minDistance = Infinity;

      for (const el of anchorEls) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -40 || rect.top > viewportHeight - 40) continue;

        const elCenterY = rect.top + Math.min(rect.height / 2, 40);
        const distance = Math.abs(elCenterY - sweetSpot);

        if (distance < minDistance) {
          minDistance = distance;
          bestAnchor = {
            element: el,
            rect,
            bubble: el.getAttribute('data-companion-bubble') || 'You’ve got this ✦',
          };
        }
      }

      if (!bestAnchor) {
        let closest: AnchorTarget | null = null;
        let closestDist = Infinity;
        for (const el of anchorEls) {
          const rect = el.getBoundingClientRect();
          const dist = Math.abs(rect.top - 120);
          if (dist < closestDist) {
            closestDist = dist;
            closest = {
              element: el,
              rect,
              bubble: el.getAttribute('data-companion-bubble') || 'Small steps count 🌟',
            };
          }
        }
        bestAnchor = closest;
      }

      if (!bestAnchor) {
        setIsActive(false);
        return;
      }

      setIsActive(true);

      if (bestAnchor.element !== lastActiveEl) {
        lastActiveEl = bestAnchor.element;
        setBubbleText(bestAnchor.bubble);
      }

      const rect = bestAnchor.rect;
      let targetX: number;
      let targetY: number;
      let direction = 1;

      if (!isMobile) {
        // Desktop: sit to the left of the text / card
        const idealLeft = rect.left - compW - 16;
        if (idealLeft >= 16) {
          targetX = idealLeft;
          targetY = rect.top + Math.min(rect.height / 2, 28) - compH / 2;
          direction = 1;
        } else {
          targetX = Math.max(16, rect.left);
          targetY = rect.top - compH - 8;
          direction = 1;
        }
        setIsFacingLeft(false);
      } else {
        // Mobile: dock on the right side of the screen looking at the words
        targetX = Math.max(12, viewportWidth - compW - 14);
        targetY = Math.max(76, Math.min(viewportHeight - compH - 24, rect.top + 6));
        direction = -1; // Pet faces left toward text
        setIsFacingLeft(true);
      }

      targetX = Math.max(10, Math.min(viewportWidth - compW - 10, targetX));
      targetY = Math.max(70, Math.min(viewportHeight - compH - 20, targetY));

      container.style.setProperty('--companion-x', `${targetX}px`);
      container.style.setProperty('--companion-y', `${targetY}px`);
      container.style.setProperty('--companion-scale', isMobile ? '0.82' : '0.9');
      container.style.setProperty('--companion-dir', `${direction}`);
    };

    const requestUpdate = () => {
      if (!frameId) frameId = window.requestAnimationFrame(updatePosition);
    };

    updatePosition();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    const timer = setTimeout(updatePosition, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`scroll-companion ${isActive ? 'is-active' : 'is-docked'} ${
        isFacingLeft ? 'is-facing-left' : ''
      }`}
      aria-hidden="true"
    >
      {/* Speech bubble is outside of the flipped pet container, so text is NEVER inverted */}
      <span className="scroll-companion-bubble">
        {bubbleText}
      </span>
      {/* Only the pet image gets flipped horizontally with direction */}
      <div className="scroll-companion-pet">
        <img
          src={PETS.capybara.images.happy}
          alt="MindCare Capybara Companion"
          className="scroll-companion-img"
        />
      </div>
    </div>
  );
};
