import { NgZone, ChangeDetectorRef } from '@angular/core';
import { playOpenHeroAnimation, playCloseHeroAnimation } from './lightbox-hero-animation';

export function runOpenHero(params: {
  targetImg: HTMLImageElement;
  originRect: DOMRect;
  animLayer: HTMLElement;
  zone: NgZone;
  cdr: ChangeDetectorRef;
  setHideInitialImage: (v: boolean) => void;
  setOpeningRunning: (v: boolean) => void;
}) {
  const { targetImg, originRect, animLayer, zone, cdr, setHideInitialImage, setOpeningRunning } = params;

  setOpeningRunning(true);

  return playOpenHeroAnimation({ targetImg, originRect, animLayer }).then(() => {
    zone.run(() => {
      setHideInitialImage(false);
      setOpeningRunning(false);
      cdr.detectChanges();
    });
  });
}

export function runCloseHero(params: {
  targetImg: HTMLImageElement;
  targetRect: DOMRect;
  animLayer: HTMLElement;
  zone: NgZone;
  onDone: () => void;
}) {
  const { targetImg, targetRect, animLayer, zone, onDone } = params;

  return playCloseHeroAnimation({ targetImg, targetRect, animLayer }).then(() => {
    zone.run(() => onDone());
  });
}
