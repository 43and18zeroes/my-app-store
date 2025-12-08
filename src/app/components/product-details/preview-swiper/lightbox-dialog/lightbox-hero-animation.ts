// lightbox-hero-animation.ts
export interface HeroOpenParams {
  targetImg: HTMLImageElement;
  originRect: DOMRect;
  animLayer: HTMLElement;
  duration?: number;
}

export interface HeroCloseParams {
  targetImg: HTMLImageElement;
  targetRect: DOMRect;
  animLayer: HTMLElement;
  duration?: number;
}

export function playOpenHeroAnimation({
  targetImg,
  originRect,
  animLayer,
  duration = 280,
}: HeroOpenParams): Promise<void> {
  return new Promise<void>((resolve) => {
    const clone = targetImg.cloneNode(true) as HTMLImageElement;
    clone.classList.add('anim-clone');
    animLayer.appendChild(clone);

    const finalRect = targetImg.getBoundingClientRect();

    Object.assign(clone.style, {
      position: 'fixed',
      top: `${originRect.top}px`,
      left: `${originRect.left}px`,
      width: `${originRect.width}px`,
      height: `${originRect.height}px`,
      transformOrigin: 'top left',
      borderRadius: '4px',
    } as CSSStyleDeclaration);

    const dx = finalRect.left - originRect.left;
    const dy = finalRect.top - originRect.top;
    const scaleX = finalRect.width / originRect.width;
    const scaleY = finalRect.height / originRect.height;

    const anim = clone.animate(
      [
        {
          transform: 'translate3d(0, 0, 0) scale(1, 1)',
          opacity: 1,
        },
        {
          transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY})`,
          opacity: 1,
        },
      ],
      {
        duration,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        fill: 'forwards',
        composite: 'replace',
      }
    );

    anim.onfinish = () => {
      clone.remove();
      resolve();
    };
  });
}

export function playCloseHeroAnimation({
  targetImg,
  targetRect,
  animLayer,
  duration = 280,
}: HeroCloseParams): Promise<void> {
  return new Promise<void>((resolve) => {
    const startRect = targetImg.getBoundingClientRect();

    const clone = targetImg.cloneNode(true) as HTMLImageElement;
    clone.classList.add('anim-clone');
    animLayer.appendChild(clone);

    Object.assign(clone.style, {
      position: 'fixed',
      top: `${startRect.top}px`,
      left: `${startRect.left}px`,
      width: `${startRect.width}px`,
      height: `${startRect.height}px`,
      transformOrigin: 'top left',
      borderRadius: '16px',
      zIndex: '9999',
    } as CSSStyleDeclaration);

    const dx = targetRect.left - startRect.left;
    const dy = targetRect.top - startRect.top;
    const scaleX = targetRect.width / startRect.width;
    const scaleY = targetRect.height / startRect.height;

    const anim = clone.animate(
      [
        {
          transform: 'translate3d(0, 0, 0) scale(1, 1)',
          opacity: 1,
        },
        {
          transform: `translate3d(${dx}px, ${dy}px, 0) scale(${scaleX}, ${scaleY})`,
          opacity: 1,
        },
      ],
      {
        duration,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        fill: 'forwards',
        composite: 'replace',
      }
    );

    anim.onfinish = () => {
      clone.remove();
      resolve();
    };
  });
}
