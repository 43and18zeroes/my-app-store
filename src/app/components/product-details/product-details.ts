import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  SECTION,
  SectionItem,
} from '../../pages/applications/applications.data';
import { CommonModule } from '@angular/common';
import { PreviewSwiper } from './preview-swiper/preview-swiper';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, PreviewSwiper],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetails {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly productId = signal<string>(
    this.route.snapshot.paramMap.get('productId') ?? ''
  );

  readonly productBasePath = (() => {
    const path = this.router.url.split('?')[0];
    const segments = path.split('/').filter(Boolean);
    return segments[0] ?? '';
  })();

  private readonly navState = this.router.getCurrentNavigation()?.extras
    .state as SectionItem | undefined;

  readonly item = computed<SectionItem | undefined>(() => {
    if (this.navState && this.navState.productId === this.productId())
      return this.navState;
    return SECTION.find((s) => s.productId === this.productId());
  });
}
