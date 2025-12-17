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
import { getHeroOriginRect } from './lightbox-utils';
import { LightboxSwiperController } from './lightbox-swiper.controller';
import { getActiveLightboxImage } from './lightbox-dom';
import { runCloseHero, runOpenHero } from './lightbox-hero.runner';

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

  private swiperCtrl: LightboxSwiperController;
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
    this.swiperCtrl = new LightboxSwiperController(zone);
  }

  ngAfterViewInit(): void {
    this.swiperCtrl.init({
      host: this.swiperContainer.nativeElement,
      initialIndex: this.currentIndex,
      onIndexChange: (idx) => {
        this.currentIndex = idx;
        this.data.onIndexChange?.(idx);
        this.cdr.markForCheck();
      },
    });

    this.hideOverlayButtons = false;

    if (!this.hasHeroRect()) this.hideInitialImage = false;

    requestAnimationFrame(() => {
      this.backgroundVisible = true;
      this.cdr.detectChanges();
    });

    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.swiperCtrl.destroy();
  }

  closeFromEvent(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.close();
  }

  onInitialImageLoad(index: number, event: Event): void {
    if (index !== this.currentIndex || this.openingAnimationRunning) return;

    const imgEl = event.target as HTMLImageElement | null;
    const originRect = this.getHeroRect(index);

    if (!imgEl || !originRect) {
      this.hideInitialImage = false;
      this.cdr.detectChanges();
      return;
    }

    const layer = this.animLayer?.nativeElement;
    if (!layer) {
      this.hideInitialImage = false;
      this.cdr.detectChanges();
      return;
    }

    requestAnimationFrame(() => {
      runOpenHero({
        targetImg: imgEl,
        originRect,
        animLayer: layer,
        zone: this.zone,
        cdr: this.cdr,
        setHideInitialImage: (v) => (this.hideInitialImage = v),
        setOpeningRunning: (v) => (this.openingAnimationRunning = v),
      });
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowRight':
      case 'Right':
        event.preventDefault();
        this.swiperCtrl.slideNext();
        break;
      case 'ArrowLeft':
      case 'Left':
        event.preventDefault();
        this.swiperCtrl.slidePrev();
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
    }
  }

  close(): void {
    if (this.closingAnimationRunning) return;
    this.closingAnimationRunning = true;

    this.hideOverlayButtons = true;
    this.backgroundVisible = false;
    this.cdr.detectChanges();

    const thumbRect = this.data.thumbRects?.[this.currentIndex];
    const host = this.swiperContainer?.nativeElement ?? null;
    const imgEl = getActiveLightboxImage(host);
    const layer = this.animLayer?.nativeElement;

    if (!thumbRect || !imgEl || !layer) {
      setTimeout(() => this.finishClose(), 300);
      return;
    }

    this.hideInitialImage = true;
    this.cdr.detectChanges();

    runCloseHero({
      targetImg: imgEl,
      targetRect: thumbRect,
      animLayer: layer,
      zone: this.zone,
      onDone: () => this.finishClose(),
    });
  }

  private finishClose(): void {
    this.closingAnimationRunning = false;
    this.data.onCloseComplete?.();
    this.dialogRef.close(this.currentIndex);
  }

  private hasHeroRect(): boolean {
    return !!this.getHeroRect(this.currentIndex);
  }

  private getHeroRect(index: number): DOMRect | undefined {
    return getHeroOriginRect(index, this.data.thumbRects, this.data.originRect);
  }
}
