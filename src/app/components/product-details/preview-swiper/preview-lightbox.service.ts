// preview-lightbox.service.ts
import { Injectable, Injector, ChangeDetectorRef } from '@angular/core';

type Rect = DOMRect;

export type PreviewLightboxParams = {
  host: HTMLElement;
  images: string[];
  initialIndex: number;
  imgBaseUrl: (file: string) => string;

  cdr: ChangeDetectorRef;
  setOpeningIndex: (v: number | null) => void;
  ev: Event;
};

type LightboxDeps = {
  dialog: any;
  LightboxDialog: any;
};

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

  private indexAnimator(params: PreviewLightboxParams) {
    return {
      set(idx: number | null) {
        params.setOpeningIndex(idx);
        params.cdr.markForCheck();
      },
      setOnNextFrame(idx: number | null) {
        requestAnimationFrame(() => {
          params.setOpeningIndex(idx);
          params.cdr.markForCheck();
        });
      },
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
      afterOpened: () => {
        requestAnimationFrame(() => {
          params.setOpeningIndex(params.initialIndex);
          params.cdr.markForCheck();
        });
      },
    };
  }

  private async loadDeps(): Promise<LightboxDeps> {
    const [{ MatDialog }, { LightboxDialog }] = await Promise.all([
      import('@angular/material/dialog'),
      import('./lightbox-dialog/lightbox-dialog'),
    ]);

    return {
      dialog: this.injector.get(MatDialog),
      LightboxDialog,
    };
  }

  private buildDialogConfig(params: PreviewLightboxParams, originRect: Rect, thumbRects: Rect[]) {
    const anim = this.indexAnimator(params);

    return {
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
        onIndexChange: anim.onIndexChange,
        onCloseComplete: anim.onCloseComplete,
      },
      __anim: anim,
    };
  }

  async open(params: PreviewLightboxParams) {
    const { dialog, LightboxDialog } = await this.loadDeps();

    const thumbRects = this.collectThumbRects(params.host);
    const originRect = this.originRectFromEvent(params.ev, thumbRects[params.initialIndex]);

    const cfg = this.buildDialogConfig(params, originRect, thumbRects);
    const { __anim, ...matCfg } = cfg as any;

    const ref = dialog.open(LightboxDialog, matCfg);

    ref.afterOpened().subscribe(() => __anim.afterOpened());

    return ref;
  }
}
