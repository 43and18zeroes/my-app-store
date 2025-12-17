export function getActiveLightboxImage(host: HTMLElement | null): HTMLImageElement | null {
  if (!host) return null;

  const activeSlide = host.querySelector('.swiper-slide.swiper-slide-active') as HTMLElement | null;
  if (!activeSlide) return null;

  return activeSlide.querySelector('img.lb-img') as HTMLImageElement | null;
}
