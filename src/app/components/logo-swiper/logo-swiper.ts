import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { SwiperOptions } from 'swiper/types';
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
  @Input({ required: true }) items: T[] = [];
  @Input({ required: true }) productPath!: string;
  @Input() speedDesktop = 500;
  @Input() speedMobile = 200;

  @Output() select = new EventEmitter<T>();

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

    const nextEl =
      host.querySelector<HTMLElement>('.swiper-button-next') ?? undefined;
    const prevEl =
      host.querySelector<HTMLElement>('.swiper-button-prev') ?? undefined;

    const baseConfig: SwiperOptions = {
      modules: [Navigation],
      loop: false,
      navigation: {
        nextEl: nextEl as HTMLElement,
        prevEl: prevEl as HTMLElement,
      },

      speed: this.speedDesktop,

      breakpoints: {
        0: {
          slidesPerView: 3,
          slidesPerGroup: 3,
          spaceBetween: 10,
          speed: this.speedMobile,
          navigation: {
            enabled: false,
          },
        },
        450: {
          slidesPerView: 5,
          slidesPerGroup: 5,
          spaceBetween: 10,
          speed: this.speedMobile,
          navigation: {
            enabled: false,
          },
        },
        600: {
          slidesPerView: 5,
          slidesPerGroup: 5,
          spaceBetween: 10,
          speed: this.speedMobile,
          navigation: {
            enabled: false,
          },
        },
        800: {
          slidesPerView: 6,
          slidesPerGroup: 6,
          spaceBetween: 20,
          speed: this.speedDesktop,
          navigation: {
            enabled: true,
          },
        },
        1200: {
          slidesPerView: 8,
          slidesPerGroup: 8,
          spaceBetween: 20,
          speed: this.speedDesktop,
          navigation: {
            enabled: true,
          },
        },
      },
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
