import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Inject,
  NgZone,
  OnDestroy,
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
  onCloseComplete?: () => void;
}

@Component({
  selector: 'app-lightbox-dialog',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './lightbox-dialog.html',
  styleUrls: ['./lightbox-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LightboxDialog implements AfterViewInit, OnDestroy {
  @ViewChild('lightboxSwiper') private swiperContainer!: ElementRef<HTMLElement>;
  @ViewChild('animLayer') private animLayer!: ElementRef<HTMLElement>;

  hideInitialImage = true;

  backgroundVisible = false;

  hideOverlayButtons = true;

  currentIndex: number;

  private swiper?: Swiper;
  private openingAnimationRunning = false;
  private closingAnimationRunning = false;

  constructor(
    public readonly dialogRef: MatDialogRef<LightboxDialog, number>,
    @Inject(MAT_DIALOG_DATA) public readonly data: LightboxData,
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef
  ) {
    const maxIndex = Math.max(data.images.length - 1, 0);
    this.currentIndex = Math.min(Math.max(data.initialIndex ?? 0, 0), maxIndex);
  }

  ngAfterViewInit(): void {
    this.initLightboxSwiper();

    if (!this.hasHeroAnimationRect()) {
      this.hideInitialImage = false;
      this.cdr.detectChanges();
    }

    requestAnimationFrame(() => {
      this.backgroundVisible = true;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = undefined;
    }
  }

  onCloseClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.close();
  }

  onCloseTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.close();
  }

  onInitialImageLoad(index: number, event: Event): void {
    if (index !== this.currentIndex || this.openingAnimationRunning) {
      return;
    }

    const imgEl = event.target as HTMLImageElement | null;
    if (!imgEl) {
      this.hideInitialImage = false;
      this.cdr.detectChanges();
      return;
    }

    const originRect = this.getHeroOriginRect(index);
    if (!originRect) {
      this.hideInitialImage = false;
      this.cdr.detectChanges();
      return;
    }

    requestAnimationFrame(() => {
      this.playOpenAnimation(imgEl, originRect);
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.swiper) return;

    switch (event.key) {
      case 'ArrowRight':
      case 'Right':
        event.preventDefault();
        this.swiper.slideNext();
        break;

      case 'ArrowLeft':
      case 'Left':
        event.preventDefault();
        this.swiper.slidePrev();
        break;

      case 'Escape':
        event.preventDefault();
        this.close();
        break;
    }
  }

  close(): void {
    if (this.closingAnimationRunning) return;

    this.hideOverlayButtons = true;
    this.cdr.markForCheck();

    const thumbRect = this.data.thumbRects?.[this.currentIndex];

    if (!thumbRect) {
      this.backgroundVisible = false;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.data.onCloseComplete?.();
        this.dialogRef.close(this.currentIndex);
      }, 300);

      return;
    }

    this.backgroundVisible = false;
    this.cdr.detectChanges();

    const imgEl = this.getActiveImageElement();
    if (!imgEl) {
      setTimeout(() => {
        this.data.onCloseComplete?.();
        this.dialogRef.close(this.currentIndex);
      }, 300);
      return;
    }

    this.hideInitialImage = true;
    this.cdr.detectChanges();

    this.playCloseAnimation(imgEl, thumbRect);
  }

  private playOpenAnimation(targetImg: HTMLImageElement, originRect: DOMRect): void {
    this.openingAnimationRunning = true;

    const layer = this.animLayer?.nativeElement;
    if (!layer) {
      this.openingAnimationRunning = false;
      this.hideInitialImage = false;
      this.cdr.detectChanges();
      return;
    }

    const clone = targetImg.cloneNode(true) as HTMLImageElement;
    clone.classList.add('anim-clone');
    layer.appendChild(clone);

    const finalRect = targetImg.getBoundingClientRect();

    Object.assign(clone.style, {
      position: 'fixed',
      top: `${originRect.top}px`,
      left: `${originRect.left}px`,
      width: `${originRect.width}px`,
      height: `${originRect.height}px`,
      transformOrigin: 'top left',
      borderRadius: '4px',
    });

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
        duration: 280,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        fill: 'forwards',
        composite: 'replace',
      }
    );

    anim.onfinish = () => {
      this.zone.run(() => {
        clone.remove();
        this.hideInitialImage = false;
        this.openingAnimationRunning = false;
        this.cdr.detectChanges();
      });
    };
  }

  private playCloseAnimation(targetImg: HTMLImageElement, targetRect: DOMRect): void {
    this.closingAnimationRunning = true;

    const layer = this.animLayer?.nativeElement;
    const startRect = targetImg.getBoundingClientRect();

    const clone = targetImg.cloneNode(true) as HTMLImageElement;
    clone.classList.add('anim-clone');
    layer.appendChild(clone);

    Object.assign(clone.style, {
      position: 'fixed',
      top: `${startRect.top}px`,
      left: `${startRect.left}px`,
      width: `${startRect.width}px`,
      height: `${startRect.height}px`,
      transformOrigin: 'top left',
      borderRadius: '16px',
      zIndex: '9999',
    });

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
        duration: 280,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        fill: 'forwards',
        composite: 'replace',
      }
    );

    anim.onfinish = () => {
      this.zone.run(() => {
        clone.remove();
        this.closingAnimationRunning = false;
        this.data.onCloseComplete?.();
        this.dialogRef.close(this.currentIndex);
      });
    };
  }
  private initLightboxSwiper(): void {
    const host = this.swiperContainer.nativeElement;

    const nextEl = host.querySelector('.swiper-button-next') as HTMLElement | null;
    const prevEl = host.querySelector('.swiper-button-prev') as HTMLElement | null;

    const isMobile = this.isMobileDevice();

    const config: SwiperOptions = {
      modules: [Navigation, Zoom],
      loop: false,
      speed: isMobile ? 180 : 300,
      slidesPerView: 1,
      navigation: { nextEl, prevEl },
      initialSlide: this.currentIndex,
      zoom: { maxRatio: 3, minRatio: 1 },
      resistanceRatio: 0.8,
      on: {
        slideChange: (swiper) => {
          this.zone.run(() => {
            this.currentIndex = swiper.activeIndex;
            this.data.onIndexChange?.(this.currentIndex);
            this.cdr.markForCheck();
          });
        },
      },
    };

    this.zone.runOutsideAngular(() => {
      this.swiper = new Swiper(host, config);
    });

    this.hideOverlayButtons = false;
    this.cdr.markForCheck();
  }

  private isMobileDevice(): boolean {
    return window.matchMedia?.('(pointer: coarse)').matches ?? false;
  }

  private hasHeroAnimationRect(): boolean {
    return !!this.getHeroOriginRect(this.currentIndex);
  }

  private getHeroOriginRect(index: number): DOMRect | undefined {
    return this.data.thumbRects?.[index] ?? this.data.originRect;
  }

  private getActiveImageElement(): HTMLImageElement | null {
    const host = this.swiperContainer?.nativeElement;
    if (!host) return null;

    const activeSlide = host.querySelector(
      '.swiper-slide.swiper-slide-active'
    ) as HTMLElement | null;

    if (!activeSlide) return null;

    return activeSlide.querySelector('img.lb-img') as HTMLImageElement | null;
  }
}
