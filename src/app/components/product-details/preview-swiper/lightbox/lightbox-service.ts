import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LightboxService {
  open = signal(false);
  images = signal<string[]>([]);
  startIndex = signal(0);
  startRect = signal<DOMRect | null>(null);

  show(images: string[], index: number, rect?: DOMRect | null) {
    this.images.set(images);
    this.startIndex.set(index);
    this.startRect.set(rect ?? null);
    this.open.set(true);
  }

  close() {
    this.open.set(false);
  }
}
