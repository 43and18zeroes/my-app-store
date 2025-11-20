import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { DeviceService } from '../../../services/device-service';
import { HttpClient } from '@angular/common/http';
import Swiper from 'swiper';
import { Navigation, FreeMode } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { NavigationOptions, SwiperOptions } from 'swiper/types';
import { PortalModule } from '@angular/cdk/portal';
import { TemplateRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { LightboxService } from './lightbox/lightbox-service';

@Component({
  selector: 'app-preview-swiper',
  imports: [PortalModule, MatIconModule],
  templateUrl: './preview-swiper.html',
  styleUrl: './preview-swiper.scss',
})
export class PreviewSwiper {
  private deviceService = inject(DeviceService);
  private http = inject(HttpClient);
  private lightbox = inject(LightboxService);
  private cdr = inject(ChangeDetectorRef);

  @Input() productPreviewsPath!: string;
  @Output() select = new EventEmitter<string>();

  @ViewChild('swiperContainer') swiperContainer!: ElementRef<HTMLElement>;
  @ViewChild('lbViewport') lbViewport?: ElementRef<HTMLElement>;
  @ViewChild('lbTrack') lbTrack?: ElementRef<HTMLElement>;
  @ViewChild('lightboxTpl') lightboxTpl!: TemplateRef<unknown>;

  constructor() {}

  desktopBreakpoints: SwiperOptions['breakpoints'] = {
    320: { spaceBetween: 20 },
    600: { spaceBetween: 20 },
    960: { spaceBetween: 20 },
    1440: { spaceBetween: 20 },
  };

  mobileBreakpoints: SwiperOptions['breakpoints'] = {
    320: { spaceBetween: 10 },
    600: { spaceBetween: 10 },
    960: { spaceBetween: 10 },
  };

  private swiper?: Swiper;

  get isMobileDevice() {
    return this.deviceService.isAndroid || this.deviceService.isiPhone;
  }

  images: string[] = [];

  private readonly base = '/img/applications/previews';

  ngOnInit() {
    const p = (this.productPreviewsPath || '').replace(/^\/+/, '');
    const url = `${this.base}/${p}/gallery.json`;

    this.http.get<string[]>(url).subscribe({
      next: (data) => {
        this.images = data ?? [];

        // 3. Manually trigger change detection to ensure images are in the DOM
        this.cdr.detectChanges();

        // 4. Initialize Swiper AFTER the DOM has updated
        requestAnimationFrame(() => {
          this.initSwiper();
        });
      },
      error: (err) => {
        console.error('gallery.json nicht gefunden:', url, err);
        this.images = [];
      },
    });
  }

  imgSrc(file: string) {
    const p = (this.productPreviewsPath || '').replace(/^\/+/, '');
    return `${this.base}/${p}/${file}`;
  }

  private initSwiper() {
    if (this.swiper) this.destroySwiper();

    const host = this.swiperContainer?.nativeElement;
    if (!host) return;

    const isMobile = this.isMobileDevice;

    let nextEl: HTMLElement | null = null;
    let prevEl: HTMLElement | null = null;

    if (!isMobile) {
      nextEl = host.querySelector<HTMLElement>('.swiper-button-next');
      prevEl = host.querySelector<HTMLElement>('.swiper-button-prev');
    }

    const navigationCfg = nextEl && prevEl ? { nextEl, prevEl } : false;

    const freeModeCfg: NonNullable<SwiperOptions['freeMode']> | false = {
      enabled: true,
      momentumRatio: 0.5,
      momentumVelocityRatio: 0.5,
      momentumBounce: true,
      momentumBounceRatio: 1,
      sticky: false,
    };

    const baseConfig: SwiperOptions = {
      modules: [Navigation, FreeMode],
      loop: false,
      freeMode: freeModeCfg,
      slidesPerView: 'auto',
      navigation: navigationCfg,
      speed: isMobile ? 200 : 500,
      breakpoints: isMobile ? this.mobileBreakpoints : this.desktopBreakpoints,
    };

    this.destroySwiper();
    this.swiper = new Swiper(host, baseConfig);
  }

  nextN(n = 1) {
    if (!this.swiper) return;
    this.swiper.slideTo(
      Math.min(
        this.swiper.activeIndex + n,
        (this.swiper.slides?.length ?? 1) - 1
      )
    );
  }

  prevN(n = 1) {
    if (!this.swiper) return;
    this.swiper.slideTo(Math.max(this.swiper.activeIndex - n, 0));
  }

  private destroySwiper() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = undefined;
    }
  }

  // Lightbox
  lightboxOpen = false;
  lightboxIndex = 0;
  lightboxStartRect?: DOMRect;

  get lightboxImages(): string[] {
    return this.images.map((img) => this.imgSrc(img));
  }

  // openLightbox(index: number, event: MouseEvent) {
  //   const target = event.currentTarget as HTMLElement;
  //   const img = target.querySelector('img');

  //   if (img) {
  //     const rect = img.getBoundingClientRect();
  //     this.lightboxStartRect = rect;
  //   }

  //   this.lightboxIndex = index;
  //   this.lightboxOpen = true;
  // }

  openLightbox(index: number, event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const img = target.querySelector('img');
    const rect = img?.getBoundingClientRect() ?? null;

    this.lightbox.show(this.lightboxImages, index, rect);
  }

  closeLightbox() {
    this.lightboxOpen = false;
  }
}
