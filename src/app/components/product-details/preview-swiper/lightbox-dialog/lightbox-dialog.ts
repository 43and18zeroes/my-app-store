import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  NgZone,
  ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swiper from 'swiper';
import { Navigation, Zoom } from 'swiper/modules';
import { SwiperOptions } from 'swiper/types';

export interface LightboxData {
  images: string[];
  initialIndex: number;
  imgBaseUrl: (file: string) => string;
  originRect?: DOMRect;
  thumbRects?: DOMRect[];
  onIndexChange?: (index: number) => void;
  onCloseComplete?: () => void; // 👈 neu
}

@Component({
  selector: 'app-lightbox-dialog',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './lightbox-dialog.html',
  styleUrl: './lightbox-dialog.scss',
})
export class LightboxDialog {
  @ViewChild('lightboxSwiper') swiperContainer!: ElementRef<HTMLElement>;
  @ViewChild('animLayer') animLayer!: ElementRef<HTMLElement>;

  hideInitialImage = true;
  private openingAnimationRunning = false;
  backgroundVisible = false;

  private swiper?: Swiper;

  currentIndex: number;
  private closingAnimationRunning = false;

  constructor(
    public dialogRef: MatDialogRef<LightboxDialog>,
    @Inject(MAT_DIALOG_DATA) public data: LightboxData,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.currentIndex = data.initialIndex;
  }

  ngAfterViewInit(): void {
    this.initLightboxSwiper();

    // Wenn keine Hero-Animation möglich → Bild direkt anzeigen
    if (!this.data.originRect && !this.data.thumbRects) {
      this.hideInitialImage = false;
      this.cdr.detectChanges();
    }

    requestAnimationFrame(() => {
      this.backgroundVisible = true;
      this.cdr.detectChanges();
    });
  }

  close(): void {
    if (this.closingAnimationRunning) return;

    const thumbRects = this.data.thumbRects;

    // Kein Thumbnail-Rect? → nur Fade-Out + Close
    if (!thumbRects || !thumbRects[this.currentIndex]) {
      this.backgroundVisible = false;
      this.cdr.detectChanges();
      setTimeout(() => this.dialogRef.close(), 300);
      return;
    }

    const targetRect = thumbRects[this.currentIndex];

    // Hintergrund zeitgleich ausfaden
    this.backgroundVisible = false;
    this.cdr.detectChanges();

    const host = this.swiperContainer.nativeElement;
    const activeSlide = host.querySelector(
      '.swiper-slide.swiper-slide-active'
    ) as HTMLElement | null;
    const imgEl = activeSlide?.querySelector(
      'img.lb-img'
    ) as HTMLImageElement | null;

    if (!imgEl) {
      setTimeout(() => this.dialogRef.close(), 300);
      return;
    }

    // 👇 WICHTIG: Lightbox-Bild direkt zum Start verstecken
    this.hideInitialImage = true;
    this.cdr.detectChanges();

    this.playCloseAnimation(imgEl, targetRect);
  }

  onInitialImageLoad(i: number, imgEl: HTMLImageElement) {
    if (i !== this.data.initialIndex) return;
    if (this.openingAnimationRunning) return;

    // Origin bevorzugt aus thumbRects, sonst originRect
    const originRect = this.data.thumbRects?.[i] ?? this.data.originRect;

    if (!originRect) {
      // kein Rect → keine Hero-Animation, Bild einfach anzeigen
      this.hideInitialImage = false;
      this.cdr.detectChanges();
      return;
    }

    requestAnimationFrame(() => {
      setTimeout(() => {
        this.playOpenAnimation(imgEl, originRect);
      }, 0);
    });
  }

  private playOpenAnimation(targetImg: HTMLImageElement, originRect: DOMRect) {
    this.openingAnimationRunning = true;

    const layer = this.animLayer.nativeElement;

    // Clone erstellen
    const clone = targetImg.cloneNode(true) as HTMLImageElement;
    clone.classList.add('anim-clone');
    layer.appendChild(clone);

    // Ausgangsposition = Thumbnail-Rect
    Object.assign(clone.style, {
      position: 'fixed',
      top: `${originRect.top}px`,
      left: `${originRect.left}px`,
      width: `${originRect.width}px`,
      height: `${originRect.height}px`,
      transformOrigin: 'top left',
      borderRadius: '8px',
    });

    // Zielposition = echtes Lightbox-Bild
    const finalRect = targetImg.getBoundingClientRect();

    const anim = clone.animate(
      [
        {
          top: `${originRect.top}px`,
          left: `${originRect.left}px`,
          width: `${originRect.width}px`,
          height: `${originRect.height}px`,
          borderRadius: '8px',
          opacity: 1,
        },
        {
          top: `${finalRect.top}px`,
          left: `${finalRect.left}px`,
          width: `${finalRect.width}px`,
          height: `${finalRect.height}px`,
          borderRadius: '8px',
          opacity: 1,
        },
      ],
      {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        fill: 'forwards',
      }
    );

    anim.onfinish = () => {
      this.zone.run(() => {
        // Clone weg, echtes Bild jetzt anzeigen
        clone.remove();
        this.hideInitialImage = false;
        this.openingAnimationRunning = false;
        this.cdr.detectChanges();
      });
    };
  }

  private playCloseAnimation(targetImg: HTMLImageElement, targetRect: DOMRect) {
    this.closingAnimationRunning = true;

    const startRect = targetImg.getBoundingClientRect();

    const clone = targetImg.cloneNode(true) as HTMLImageElement;
    clone.classList.add('anim-clone');
    document.body.appendChild(clone); // oder animLayer, wie du es aktuell machst

    Object.assign(clone.style, {
      position: 'fixed',
      top: `${startRect.top}px`,
      left: `${startRect.left}px`,
      width: `${startRect.width}px`,
      height: `${startRect.height}px`,
      transformOrigin: 'top left',
      borderRadius: '8px',
      zIndex: '9999',
    });

    const anim = clone.animate(
      [
        {
          top: `${startRect.top}px`,
          left: `${startRect.left}px`,
          width: `${startRect.width}px`,
          height: `${startRect.height}px`,
          borderRadius: '8px',
          opacity: 1,
        },
        {
          top: `${targetRect.top}px`,
          left: `${targetRect.left}px`,
          width: `${targetRect.width}px`,
          height: `${targetRect.height}px`,
          borderRadius: '8px',
          opacity: 1,
        },
      ],
      {
        duration: 300,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        fill: 'forwards',
      }
    );

    anim.onfinish = () => {
      this.zone.run(() => {
        clone.remove();
        this.closingAnimationRunning = false;

        // 👇 HIER: Vorschaubild wieder einblenden
        this.data.onCloseComplete?.();

        // 👇 DANN erst Dialog schließen
        this.dialogRef.close(this.currentIndex);
      });
    };
  }

  private initLightboxSwiper() {
    const host = this.swiperContainer.nativeElement;

    const nextEl = host.querySelector(
      '.swiper-button-next'
    ) as HTMLElement | null;
    const prevEl = host.querySelector(
      '.swiper-button-prev'
    ) as HTMLElement | null;

    const config: SwiperOptions = {
      modules: [Navigation, Zoom],
      loop: false,
      speed: 300,
      slidesPerView: 1,
      navigation: { nextEl, prevEl },
      initialSlide: this.data.initialIndex,
      zoom: { maxRatio: 3, minRatio: 1 },
      resistanceRatio: 0.8,
      on: {
        slideChange: (swiper) => {
          this.zone.run(() => {
            this.currentIndex = swiper.activeIndex;

            // 👇 Preview-Swiper informieren
            this.data.onIndexChange?.(this.currentIndex);

            this.cdr.markForCheck();
          });
        },
      },
    };

    this.swiper = new Swiper(host, config);
  }
}
