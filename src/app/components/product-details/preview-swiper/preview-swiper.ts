import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
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
import { MatDialog } from '@angular/material/dialog';
import { LightboxDialog } from './lightbox-dialog/lightbox-dialog';

@Component({
  selector: 'app-preview-swiper',
  imports: [PortalModule, MatIconModule],
  templateUrl: './preview-swiper.html',
  styleUrl: './preview-swiper.scss',
})
export class PreviewSwiper {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

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
        this.cdr.detectChanges();

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

    const nextEl = host.querySelector<HTMLElement>('.swiper-button-next') ?? undefined;
    const prevEl = host.querySelector<HTMLElement>('.swiper-button-prev') ?? undefined;

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

  openLightbox(index: number, ev: Event) {
    this.openingIndex = index;

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

    const ref = this.dialog.open(LightboxDialog, {
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
          this.openingIndex = idx;
          this.cdr.markForCheck();
        },
        onCloseComplete: () => {
          this.openingIndex = null;
          this.cdr.markForCheck();
        },
      },
    });

    ref.afterClosed().subscribe(() => {
    });
  }
}
