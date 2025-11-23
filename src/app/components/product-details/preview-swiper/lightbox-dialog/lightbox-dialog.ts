import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swiper from 'swiper';
import { Navigation, Zoom } from 'swiper/modules';
import { SwiperOptions } from 'swiper/types';

export interface LightboxData {
  images: string[]; // URLs der Bilder
  initialIndex: number; // Index des angeklickten Bildes
  imgBaseUrl: (file: string) => string; // Funktion zur Erstellung der vollständigen URL
}

@Component({
  selector: 'app-lightbox-dialog',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './lightbox-dialog.html',
  styleUrl: './lightbox-dialog.scss',
})
export class LightboxDialog {
  @ViewChild('lightboxSwiper') swiperContainer!: ElementRef<HTMLElement>;

  constructor(
    public dialogRef: MatDialogRef<LightboxDialog>,
    @Inject(MAT_DIALOG_DATA) public data: LightboxData
  ) {}

  ngAfterViewInit(): void {
    this.initLightboxSwiper();
  }

  close(): void {
    this.dialogRef.close();
  }

  private initLightboxSwiper() {
    const host = this.swiperContainer.nativeElement;

    const nextEl = host.querySelector(
      '.swiper-button-next'
    ) as HTMLElement | null;
    const prevEl = host.querySelector(
      '.swiper-button-prev'
    ) as HTMLElement | null;

    const config: SwiperOptions = {
      modules: [Navigation, Zoom], // Wichtig: Zoom importieren
      loop: false,
      speed: 300,
      slidesPerView: 1,
      // Konfiguriere Navigation
      navigation: {
        nextEl: nextEl, // nextEl ist jetzt vom Typ HTMLElement | null
        prevEl: prevEl, // prevEl ist jetzt vom Typ HTMLElement | null
      },
      // Starte beim angeklickten Bild
      initialSlide: this.data.initialIndex,
      // Aktiviere Zoom für Pinch-Gesten
      zoom: {
        maxRatio: 3,
        minRatio: 1,
      },
      // Mache das Swipen flüssiger (für mobiles Feeling)
      resistanceRatio: 0.8,
    };

    new Swiper(host, config);
  }
}
