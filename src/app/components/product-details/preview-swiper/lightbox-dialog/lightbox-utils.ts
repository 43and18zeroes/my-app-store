export function isMobileDevice(): boolean {
  return window.matchMedia?.('(pointer: coarse)').matches ?? false;
}

export function getHeroOriginRect(
  index: number,
  thumbRects?: DOMRect[],
  originRect?: DOMRect
): DOMRect | undefined {
  return thumbRects?.[index] ?? originRect;
}