import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { DeviceService } from '../../services/device-service';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { NavigationOptions, SwiperOptions } from 'swiper/types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo-swiper',
  imports: [CommonModule],
  templateUrl: './logo-swiper.html',
  styleUrl: './logo-swiper.scss',
})
export class LogoSwiper<
  T extends {
    productId: string | number;
    productLogoFilename: string;
    productLogoAltText?: string;
  }
> {
  private deviceService = inject(DeviceService);

  @Input({ required: true }) items: T[] = [];
  @Input({ required: true }) productPath!: string;
  @Input() speedDesktop = 500;
  @Input() speedMobile = 200;

  @Input() desktopBreakpoints: SwiperOptions['breakpoints'] = {
    320: { slidesPerView: 3, slidesPerGroup: 3, spaceBetween: 20 },
    600: { slidesPerView: 4, slidesPerGroup: 4, spaceBetween: 20 },
    960: { slidesPerView: 6, slidesPerGroup: 6, spaceBetween: 20 },
    1440: { slidesPerView: 8, slidesPerGroup: 8, spaceBetween: 20 },
  };
  @Input() mobileBreakpoints: SwiperOptions['breakpoints'] = {
    320: { slidesPerView: 3, slidesPerGroup: 3, spaceBetween: 10 },
    600: { slidesPerView: 5, slidesPerGroup: 5, spaceBetween: 10 },
    960: { slidesPerView: 8, slidesPerGroup: 8, spaceBetween: 10 },
  };

  @Output() select = new EventEmitter<T>();

  get isMobileDevice() {
    return this.deviceService.isAndroid || this.deviceService.isiPhone;
  }

  @ViewChild('swiperContainer') swiperContainer!: ElementRef<HTMLElement>;
  private swiper?: Swiper;

  ngAfterViewInit(): void {
    this.initSwiper();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items'] && this.swiper) {
      queueMicrotask(() => this.swiper?.update());
    }
  }

  ngOnDestroy(): void {
    this.destroySwiper();
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
      navigation: {
        nextEl: nextEl as HTMLElement,
        prevEl: prevEl as HTMLElement,
      } as NavigationOptions,
      speed: this.isMobileDevice ? this.speedMobile : this.speedDesktop,
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
