import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-preview-swiper',
  imports: [],
  templateUrl: './preview-swiper.html',
  styleUrl: './preview-swiper.scss',
})
export class PreviewSwiper {
  @Input() productPreviewsPath!: string;
}
