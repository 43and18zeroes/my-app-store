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
import { PortalModule } from '@angular/cdk/portal';
import { MatIconModule } from '@angular/material/icon';
import { PreviewGalleryService } from './preview-gallery.service';
import { PreviewLightboxService } from './preview-lightbox.service';
import { PreviewSwiperAdapter } from './preview-swiper.adapter';

@Component({
  selector: 'app-preview-swiper',
  imports: [PortalModule, MatIconModule],
  templateUrl: './preview-swiper.html',
  styleUrl: './preview-swiper.scss',
})
export class PreviewSwiper {
  private cdr = inject(ChangeDetectorRef);
  private gallery = inject(PreviewGalleryService);
  private lightbox = inject(PreviewLightboxService);

  readonly stepSize = 3;
  private swiper = new PreviewSwiperAdapter(this.stepSize);

  @Input() productPreviewsPath!: string;
  @Output() select = new EventEmitter<string>();

  @ViewChild('swiperContainer') swiperContainer!: ElementRef<HTMLElement>;

  images: string[] = [];
  openingIndex: number | null = null;

  ngOnInit() {
    this.gallery.loadImages(this.productPreviewsPath).subscribe((imgs) => {
      this.images = imgs;
      this.cdr.markForCheck();
      queueMicrotask(() => this.initSwiper()); // statt setTimeout(0)
    });
  }

  imgSrc(file: string) {
    return this.gallery.imageUrl(this.productPreviewsPath, file);
  }

  private initSwiper() {
    const host = this.swiperContainer?.nativeElement;
    if (!host) return;
    this.swiper.init(host);
  }

  ngOnDestroy() {
    this.swiper.destroy();
  }

  nextN() {
    this.swiper.nextN();
  }

  prevN() {
    this.swiper.prevN();
  }

  openLightbox(index: number, ev: Event) {
    return this.lightbox.open({
      host: this.swiperContainer.nativeElement,
      images: this.images,
      initialIndex: index,
      imgBaseUrl: (file) => this.imgSrc(file),
      cdr: this.cdr,
      setOpeningIndex: (v) => (this.openingIndex = v),
      ev,
    });
  }
}