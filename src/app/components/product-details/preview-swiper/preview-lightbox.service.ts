// preview-lightbox.service.ts
import { Injectable, Injector, ChangeDetectorRef } from '@angular/core';

type Rect = DOMRect;

@Injectable({ providedIn: 'root' })
export class PreviewLightboxService {
  constructor(private injector: Injector) {}

  private collectThumbRects(host: HTMLElement) {
    const previewImgs = host.querySelectorAll('img.preview-img') as NodeListOf<HTMLImageElement>;
    return Array.from(previewImgs).map((img) => img.getBoundingClientRect());
  }

  private originRectFromEvent(ev: Event, fallback: Rect) {
    const target = ev.currentTarget as HTMLElement | null;
    const imgEl = target?.querySelector('img') as HTMLImageElement | null;
    return imgEl?.getBoundingClientRect() ?? fallback;
  }

  async open(params: {
    host: HTMLElement;
    images: string[];
    initialIndex: number;
    imgBaseUrl: (file: string) => string;

    cdr: ChangeDetectorRef;
    setOpeningIndex: (v: number | null) => void;
    ev: Event;
  }) {
    const [{ MatDialog }, { LightboxDialog }] = await Promise.all([
      import('@angular/material/dialog'),
      import('./lightbox-dialog/lightbox-dialog'),
    ]);

    const dialog = this.injector.get(MatDialog);

    const thumbRects = this.collectThumbRects(params.host);
    const originRect = this.originRectFromEvent(params.ev, thumbRects[params.initialIndex]);

    const ref = dialog.open(LightboxDialog, {
      panelClass: 'full-screen-lightbox',
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      hasBackdrop: false,
      disableClose: true,
      data: {
        images: params.images,
        initialIndex: params.initialIndex,
        imgBaseUrl: params.imgBaseUrl,
        originRect,
        thumbRects,
        onIndexChange: (idx: number) => {
          params.setOpeningIndex(null);
          params.cdr.markForCheck();
          requestAnimationFrame(() => {
            params.setOpeningIndex(idx);
            params.cdr.markForCheck();
          });
        },
        onCloseComplete: () => {
          params.setOpeningIndex(null);
          params.cdr.markForCheck();
        },
      },
    });

    ref.afterOpened().subscribe(() => {
      requestAnimationFrame(() => {
        params.setOpeningIndex(params.initialIndex);
        params.cdr.markForCheck();
      });
    });

    return ref;
  }
}
