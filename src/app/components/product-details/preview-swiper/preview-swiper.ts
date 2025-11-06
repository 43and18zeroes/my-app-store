import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { DeviceService } from '../../../services/device-service';
import { HttpClient } from '@angular/common/http';
import Swiper from 'swiper';
import { Navigation, FreeMode } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { NavigationOptions, SwiperOptions } from 'swiper/types';

@Component({
  selector: 'app-preview-swiper',
  imports: [],
  templateUrl: './preview-swiper.html',
  styleUrl: './preview-swiper.scss',
})
export class PreviewSwiper {
  private deviceService = inject(DeviceService);
  private http = inject(HttpClient);

  @Input() productPreviewsPath!: string;

  @ViewChild('swiperContainer') swiperContainer!: ElementRef<HTMLElement>;

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
      next: (data) => (this.images = data ?? []),
      error: (err) => {
        console.error('gallery.json nicht gefunden:', url, err);
        this.images = [];
      },
    });
  }

  ngAfterViewInit(): void {
    this.initSwiper();
  }

  imgSrc(file: string) {
    const p = (this.productPreviewsPath || '').replace(/^\/+/, '');
    return `${this.base}/${p}/${file}`;
  }

  onClick(image: string, ev?: MouseEvent) {
    ev?.stopPropagation();
    console.log('image', image);
  }

  private initSwiper() {
    const host = this.swiperContainer?.nativeElement;
    if (!host) return;

    let nextEl: HTMLElement | undefined;
    let prevEl: HTMLElement | undefined;

    if (!this.isMobileDevice) {
      nextEl =
        host.querySelector<HTMLElement>('.swiper-button-next') ?? undefined;
      prevEl =
        host.querySelector<HTMLElement>('.swiper-button-prev') ?? undefined;
    }

    const baseConfig: SwiperOptions = {
      modules: [Navigation],
      loop: false,
      freeMode: {
        enabled: true,
        momentum: true,
        momentumRatio: 1.0,
        momentumBounce: false,
        sticky: false,
      },
      slidesPerView: 'auto',
      navigation: {
        nextEl: nextEl as HTMLElement,
        prevEl: prevEl as HTMLElement,
      } as NavigationOptions,
      speed: this.isMobileDevice ? 200 : 500,
      breakpoints: this.isMobileDevice
        ? this.mobileBreakpoints
        : this.desktopBreakpoints,
    };

    this.destroySwiper();
    this.swiper = new Swiper(host, baseConfig);
  }

  private destroySwiper() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = undefined;
    }
  }
}
