import { Component, inject, Input } from '@angular/core';
import { DeviceService } from '../../../services/device-service';
import { HttpClient } from '@angular/common/http';
import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { NavigationOptions, SwiperOptions } from 'swiper/types';

@Component({
  selector: 'app-preview-swiper',
  imports: [],
  templateUrl: './preview-swiper.html',
  styleUrl: './preview-swiper.scss',
})
export class PreviewSwiper {
  private deviceService = inject(DeviceService);

  @Input() productPreviewsPath!: string;

  get isMobileDevice() {
    return this.deviceService.isAndroid || this.deviceService.isiPhone;
  }

  images: string[] = [];

  // constructor(private http: HttpClient) {}

  ngOnInit() {
    // this.http.get<string[]>('assets/gallery/gallery.json').subscribe((data) => {
    //   this.images = data;
    // });
  }

  onClick(image: string) {
    console.log('image', image);
  }
}
