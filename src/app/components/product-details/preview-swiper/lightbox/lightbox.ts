import { NgIf, NgStyle } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DeviceService } from '../../../../services/device-service';

const duration = '300ms';
const easing = 'ease-in-out';

@Component({
  selector: 'app-lightbox',
  imports: [NgIf, NgStyle, MatIconModule],
  templateUrl: './lightbox.html',
  styleUrl: './lightbox.scss',
})
export class Lightbox {
  private deviceService = inject(DeviceService);

  @Input({ required: true }) images: string[] = [];
  @Input() startIndex = 0;
  @Input() startRect?: DOMRect;

  @Output() closed = new EventEmitter<void>();

  currentIndex = 0;
  isVisible = false;

  zoomStyles: Record<string, string> = {};
  finalStyles: Record<string, string> = {};
  animateToFinal = false;

  get isMobileDevice() {
    return this.deviceService.isAndroid || this.deviceService.isiPhone;
  }

  ngOnInit() {
    this.currentIndex =
      this.startIndex >= 0 && this.startIndex < this.images.length
        ? this.startIndex
        : 0;

    if (this.startRect) {
      // Ausgangs-Rect (Thumbnail)
      const sr = this.startRect;

      this.zoomStyles = {
        position: 'fixed',
        left: sr.left + 'px',
        top: sr.top + 'px',
        width: sr.width + 'px',
        height: sr.height + 'px',
        transition: `all ${duration} ${easing}`,
      };

      // Ziel-Rect: in der Mitte, maximal 90% des Viewports, gleiches Seitenverhältnis
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const maxWidth = vw * 0.9;
      const maxHeight = vh * 0.9;

      const scale = Math.min(maxWidth / sr.width, maxHeight / sr.height);
      const finalWidth = sr.width * scale;
      const finalHeight = sr.height * scale;

      const finalLeft = vw / 2 - finalWidth / 2;
      const finalTop = vh / 2 - finalHeight / 2;

      this.finalStyles = {
        position: 'fixed',
        left: finalLeft + 'px',
        top: finalTop + 'px',
        width: finalWidth + 'px',
        height: finalHeight + 'px',
        transition: `all ${duration} ${easing}`,
      };
    } else {
      // Fallback: aus der Mitte heraus zoomen
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const finalWidth = vw * 0.9;
      const finalHeight = vh * 0.9;

      this.zoomStyles = {
        position: 'fixed',
        left: vw / 2 - finalWidth / 2 + 'px',
        top: vh / 2 - finalHeight / 2 + 'px',
        width: finalWidth + 'px',
        height: finalHeight + 'px',
        transform: 'scale(0.8)',
        transition: `all ${duration} ${easing}`,
      };

      this.finalStyles = {
        position: 'fixed',
        left: vw / 2 - finalWidth / 2 + 'px',
        top: vh / 2 - finalHeight / 2 + 'px',
        width: finalWidth + 'px',
        height: finalHeight + 'px',
        transform: 'scale(1)',
        transition: `all ${duration} ${easing}`,
      };
    }

    // Nächster Tick → Overlay + Bild animieren
    setTimeout(() => {
      this.isVisible = true;
      this.animateToFinal = true;
    }, 10);
  }

  get currentImage(): string | null {
    return this.images[this.currentIndex] ?? null;
  }

  next() {
    if (!this.images.length) return;
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  prev() {
    if (!this.images.length) return;
    this.currentIndex =
      (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  close() {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.close();
  }

  @HostListener('click', ['$event'])
  onBackdropClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('lightbox')) {
      this.close();
    }
  }
}
