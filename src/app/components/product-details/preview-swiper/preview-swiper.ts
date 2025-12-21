import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Swiper from 'swiper';
import { Navigation, FreeMode } from 'swiper/modules';
import { SwiperOptions } from 'swiper/types';
import { PortalModule } from '@angular/cdk/portal';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-preview-swiper',
  imports: [PortalModule, MatIconModule],
  templateUrl: './preview-swiper.html',
  styleUrl: './preview-swiper.scss',
})
export class PreviewSwiper {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private injector = inject(Injector);
  readonly stepSize = 3;

  @Input() productPreviewsPath!: string;
  @Output() select = new EventEmitter<string>();

  @ViewChild('swiperContainer') swiperContainer!: ElementRef<HTMLElement>;
  @ViewChild('lbViewport') lbViewport?: ElementRef<HTMLElement>;
  @ViewChild('lbTrack') lbTrack?: ElementRef<HTMLElement>;

  images: string[] = [];
  openingIndex: number | null = null;

  private swiper?: Swiper;
  private readonly base = '/img/applications/previews';

  ngOnInit() {
    const p = (this.productPreviewsPath || '').replace(/^\/+/, '');
    const url = `${this.base}/${p}/gallery.json`;

    this.http.get<string[]>(url).subscribe({
      next: (data) => {
        this.images = data ?? [];
        // Use markForCheck instead of detectChanges to be safer
        this.cdr.markForCheck();

        // Swiper needs the DOM to be rendered,
        // wrapping in setTimeout(0) is usually safer than requestAnimationFrame
        // when dealing with Angular's lifecycle.
        setTimeout(() => this.initSwiper(), 0);
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

    const nextEl =
      host.querySelector<HTMLElement>('.swiper-button-next') ?? undefined;
    const prevEl =
      host.querySelector<HTMLElement>('.swiper-button-prev') ?? undefined;

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
      speed: 500,
      breakpoints: {
        0: {
          spaceBetween: 10,
          speed: 200,
          navigation: {
            enabled: false,
          },
        },
        922: {
          spaceBetween: 20,
          speed: 500,
          navigation: {
            enabled: true,
          },
        },
      },
    };

    this.swiper = new Swiper(host, baseConfig);
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

  private destroySwiper() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = undefined;
    }
  }

  async openLightbox(index: number, ev: Event) {
    this.openingIndex = index;
    const [{ MatDialog }, { LightboxDialog }] = await Promise.all([
      import('@angular/material/dialog'),
      import('./lightbox-dialog/lightbox-dialog'),
    ]);

    const dialog = this.injector.get(MatDialog);
    const host = this.swiperContainer.nativeElement;
    const previewImgs = host.querySelectorAll(
      'img.preview-img'
    ) as NodeListOf<HTMLImageElement>;
    const thumbRects = Array.from(previewImgs).map((img) =>
      img.getBoundingClientRect()
    );

    const target = ev.currentTarget as HTMLElement | null;
    const imgEl = target?.querySelector('img') as HTMLImageElement | null;
    const originRect = imgEl?.getBoundingClientRect() ?? thumbRects[index];

    const ref = dialog.open(LightboxDialog, {
      panelClass: 'full-screen-lightbox',
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      hasBackdrop: false,
      disableClose: true,
      data: {
        images: this.images,
        initialIndex: index,
        imgBaseUrl: (file: string) => this.imgSrc(file),
        originRect,
        thumbRects,
        onIndexChange: (idx: number) => {
          setTimeout(() => {
            this.openingIndex = idx;
            this.cdr.markForCheck();
          });
        },
        onCloseComplete: () => {
          this.openingIndex = null;
          this.cdr.markForCheck();
        },
      },
    });
  }
}
