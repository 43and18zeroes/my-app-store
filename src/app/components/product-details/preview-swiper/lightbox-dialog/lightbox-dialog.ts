import {
  Component,
  ElementRef,
  Inject,
  QueryList,
  ViewChild,
  ViewChildren,
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
  @ViewChildren('lbImg') lbImgs!: QueryList<ElementRef<HTMLImageElement>>;

  animating = false;
  private swiper?: Swiper;

  constructor(
    public dialogRef: MatDialogRef<LightboxDialog>,
    @Inject(MAT_DIALOG_DATA) public data: LightboxData
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

    // Prevent double-run
    if (this.animating) return;

    this.playOpenAnimation(imgEl, this.data.originRect);
  }

    private playOpenAnimation(targetImg: HTMLImageElement, originRect: DOMRect) {
    this.animating = true;

    const layer = this.animLayer.nativeElement;

    // Create clone
    const clone = targetImg.cloneNode(true) as HTMLImageElement;
    clone.classList.add('anim-clone');
    layer.appendChild(clone);

    // Position clone at origin
    Object.assign(clone.style, {
      position: 'fixed',
      top: `${originRect.top}px`,
      left: `${originRect.left}px`,
      width: `${originRect.width}px`,
      height: `${originRect.height}px`,
      transformOrigin: 'top left',
      borderRadius: '8px',
    });

    // Measure final rect
    const finalRect = targetImg.getBoundingClientRect();

    // Animate via Web Animations API (smooth & easy)
    const anim = clone.animate(
      [
        {
          top: `${originRect.top}px`,
          left: `${originRect.left}px`,
          width: `${originRect.width}px`,
          height: `${originRect.height}px`,
          borderRadius: '8px',
        },
        {
          top: `${finalRect.top}px`,
          left: `${finalRect.left}px`,
          width: `${finalRect.width}px`,
          height: `${finalRect.height}px`,
          borderRadius: '0px',
        },
      ],
      {
        duration: 500,
        easing: 'cubic-bezier(0.2, 0.0, 0.2, 1)',
        fill: 'forwards',
      }
    );

    anim.onfinish = () => {
      // reveal real image, remove clone
      this.animating = false;
      clone.remove();
    };
  }

  private initLightboxSwiper() {
    const host = this.swiperContainer.nativeElement;

    const nextEl = host.querySelector('.swiper-button-next') as HTMLElement | null;
    const prevEl = host.querySelector('.swiper-button-prev') as HTMLElement | null;

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

  // private initLightboxSwiper() {
  //   const host = this.swiperContainer.nativeElement;

  //   const nextEl = host.querySelector(
  //     '.swiper-button-next'
  //   ) as HTMLElement | null;
  //   const prevEl = host.querySelector(
  //     '.swiper-button-prev'
  //   ) as HTMLElement | null;

  //   const config: SwiperOptions = {
  //     modules: [Navigation, Zoom], // Wichtig: Zoom importieren
  //     loop: false,
  //     speed: 300,
  //     slidesPerView: 1,
  //     // Konfiguriere Navigation
  //     navigation: {
  //       nextEl: nextEl, // nextEl ist jetzt vom Typ HTMLElement | null
  //       prevEl: prevEl, // prevEl ist jetzt vom Typ HTMLElement | null
  //     },
  //     // Starte beim angeklickten Bild
  //     initialSlide: this.data.initialIndex,
  //     // Aktiviere Zoom für Pinch-Gesten
  //     zoom: {
  //       maxRatio: 3,
  //       minRatio: 1,
  //     },
  //     // Mache das Swipen flüssiger (für mobiles Feeling)
  //     resistanceRatio: 0.8,
  //   };

  //   new Swiper(host, config);
  // }
}
