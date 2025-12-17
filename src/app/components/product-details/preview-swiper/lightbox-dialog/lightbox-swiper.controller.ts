import { NgZone } from '@angular/core';
import Swiper from 'swiper';
import { Navigation, Zoom } from 'swiper/modules';
import { SwiperOptions } from 'swiper/types';
import { isMobileDevice } from './lightbox-utils';

export class LightboxSwiperController {
  private swiper?: Swiper;

  constructor(private zone: NgZone) {}

  init(params: {
    host: HTMLElement;
    initialIndex: number;
    onIndexChange: (index: number) => void;
  }): void {
    const { host, initialIndex, onIndexChange } = params;

    const nextEl = host.querySelector('.swiper-button-next') as HTMLElement | null;
    const prevEl = host.querySelector('.swiper-button-prev') as HTMLElement | null;

    const mobile = isMobileDevice();

    const config: SwiperOptions = {
      modules: [Navigation, Zoom],
      loop: false,
      speed: mobile ? 180 : 300,
      slidesPerView: 1,
      navigation: { nextEl, prevEl },
      initialSlide: initialIndex,
      zoom: { maxRatio: 3, minRatio: 1 },
      resistanceRatio: 0.8,
      on: {
        slideChange: (swiper) => {
          this.zone.run(() => onIndexChange(swiper.activeIndex));
        },
      },
    };

    this.zone.runOutsideAngular(() => {
      this.swiper = new Swiper(host, config);
    });
  }

  destroy(): void {
    this.swiper?.destroy(true, true);
    this.swiper = undefined;
  }

  slideNext(): void {
    this.swiper?.slideNext();
  }

  slidePrev(): void {
    this.swiper?.slidePrev();
  }

  get activeIndex(): number {
    return this.swiper?.activeIndex ?? 0;
  }
}
