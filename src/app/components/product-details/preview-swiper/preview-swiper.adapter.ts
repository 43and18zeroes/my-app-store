// preview-swiper.adapter.ts
import Swiper from 'swiper';
import { Navigation, FreeMode } from 'swiper/modules';
import { SwiperOptions } from 'swiper/types';

export class PreviewSwiperAdapter {
  private swiper?: Swiper;

  constructor(private stepSize = 3) {}

  init(host: HTMLElement) {
    this.destroy();
    this.swiper = new Swiper(host, this.buildConfig(host));
  }

  private buildConfig(host: HTMLElement): SwiperOptions {
    return {
      modules: [Navigation, FreeMode],
      loop: false,
      freeMode: this.freeModeCfg(),
      slidesPerView: 'auto',
      navigation: this.navigationCfg(host),
      speed: 500,
      breakpoints: this.breakpointsCfg(),
    };
  }

  private navigationCfg(host: HTMLElement): SwiperOptions['navigation'] | false {
    const nextEl = host.querySelector<HTMLElement>('.swiper-button-next') ?? undefined;
    const prevEl = host.querySelector<HTMLElement>('.swiper-button-prev') ?? undefined;
    return nextEl && prevEl ? { nextEl, prevEl } : false;
  }

  private freeModeCfg(): NonNullable<SwiperOptions['freeMode']> {
    return {
      enabled: true,
      momentumRatio: 0.5,
      momentumVelocityRatio: 0.5,
      momentumBounce: true,
      momentumBounceRatio: 1,
      sticky: false,
    };
  }

  private breakpointsCfg(): NonNullable<SwiperOptions['breakpoints']> {
    return {
      0: { spaceBetween: 10, speed: 200, navigation: { enabled: false } },
      922: { spaceBetween: 20, speed: 500, navigation: { enabled: true } },
    };
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