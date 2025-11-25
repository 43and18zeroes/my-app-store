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
  originRect?: DOMRect; // 👈 new
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

  animating = false;
  private swiper?: Swiper;

  constructor(
    public dialogRef: MatDialogRef<LightboxDialog>,
    @Inject(MAT_DIALOG_DATA) public data: LightboxData,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.initLightboxSwiper();
  }

  close(): void {
    this.dialogRef.close();
  }

  onInitialImageLoad(i: number, imgEl: HTMLImageElement) {
    if (i !== this.data.initialIndex) return;
    if (!this.data.originRect) return;
    if (this.animating) return;

    // 1 Frame für Layout + evtl. Swiper
    requestAnimationFrame(() => {
      // optional noch ein kleines Timeout, falls nötig:
      setTimeout(() => {
        this.playOpenAnimation(imgEl, this.data.originRect!);
      }, 0);
    });
  }

  private playOpenAnimation(targetImg: HTMLImageElement, originRect: DOMRect) {
    const layer = this.animLayer.nativeElement;

    // Clone zuerst erstellen …
    const clone = targetImg.cloneNode(true) as HTMLImageElement;
    clone.classList.add('anim-clone');
    layer.appendChild(clone);

    Object.assign(clone.style, {
      position: 'fixed',
      top: `${originRect.top}px`,
      left: `${originRect.left}px`,
      width: `${originRect.width}px`,
      height: `${originRect.height}px`,
      transformOrigin: 'top left',
      borderRadius: '8px',
    });

    // … dann erst das echte Bild ausblenden
    this.animating = true;
    this.cdr.detectChanges();

    // Final rect nach Layout
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
          borderRadius: '0px',
          opacity: 1,
        },
      ],
      {
        duration: 500,
        easing: 'cubic-bezier(0.2, 0.0, 0.2, 1)',
        fill: 'forwards',
      }
    );

    anim.onfinish = () => {
      // WICHTIG: zurück in Angular-Zone
      this.zone.run(() => {
        this.animating = false; // -> echtes Bild wird sichtbar
        clone.remove();
        this.cdr.detectChanges();
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
    };

    this.swiper = new Swiper(host, config);
  }
}
