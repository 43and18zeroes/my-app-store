// preview-swiper.adapter.ts
import Swiper from 'swiper';
import { Navigation, FreeMode } from 'swiper/modules';
import { SwiperOptions } from 'swiper/types';

export class PreviewSwiperAdapter {
  private swiper?: Swiper;

  constructor(private stepSize = 3) {}

  init(host: HTMLElement) {
    this.destroy();

    const nextEl = host.querySelector<HTMLElement>('.swiper-button-next') ?? undefined;
    const prevEl = host.querySelector<HTMLElement>('.swiper-button-prev') ?? undefined;

    const navigationCfg = nextEl && prevEl ? { nextEl, prevEl } : false;

    const freeModeCfg: NonNullable<SwiperOptions['freeMode']> = {
      enabled: true,
      momentumRatio: 0.5,
      momentumVelocityRatio: 0.5,
      momentumBounce: true,
      momentumBounceRatio: 1,
      sticky: false,
    };

    const config: SwiperOptions = {
      modules: [Navigation, FreeMode],
      loop: false,
      freeMode: freeModeCfg,
      slidesPerView: 'auto',
      navigation: navigationCfg,
      speed: 500,
      breakpoints: {
        0: { spaceBetween: 10, speed: 200, navigation: { enabled: false } },
        922: { spaceBetween: 20, speed: 500, navigation: { enabled: true } },
      },
    };

    this.swiper = new Swiper(host, config);
  }

  nextN() {
    if (!this.swiper) return;
    this.swiper.slideTo(
      Math.min(
        this.swiper.activeIndex + this.stepSize,
        (this.swiper.slides?.length ?? 1) - 1
      )
    );
  }

  prevN() {
    if (!this.swiper) return;
    this.swiper.slideTo(Math.max(this.swiper.activeIndex - this.stepSize, 0));
  }

  destroy() {
    this.swiper?.destroy(true, true);
    this.swiper = undefined;
  }
}
