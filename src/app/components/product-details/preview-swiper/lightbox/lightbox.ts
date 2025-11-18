import { NgIf, NgStyle } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-lightbox',
  imports: [NgIf, NgStyle, MatIconModule],
  templateUrl: './lightbox.html',
  styleUrl: './lightbox.scss',
})
export class Lightbox {
  @Input({ required: true }) images: string[] = [];
  @Input() startIndex = 0;
  @Input() startRect?: DOMRect;

  @Output() closed = new EventEmitter<void>();

  currentIndex = 0;
  isVisible = false;
  zoomStyles: Record<string, string> = {};
  animateToFinal = false;

  ngOnInit() {
    this.currentIndex =
      this.startIndex >= 0 && this.startIndex < this.images.length
        ? this.startIndex
        : 0;

    if (this.startRect) {
      this.zoomStyles = {
        position: 'fixed',
        left: this.startRect.left + 'px',
        top: this.startRect.top + 'px',
        width: this.startRect.width + 'px',
        height: this.startRect.height + 'px',
        transform: 'none',
        transition: 'all 300ms ease-out',
      };
    } else {
      // Fallback: aus der Mitte leicht vergrößern
      this.zoomStyles = {
        position: 'fixed',
        left: '50%',
        top: '50%',
        width: '40vw',
        height: 'auto',
        transform: 'translate(-50%, -50%) scale(0.8)',
        transition: 'all 300ms ease-out',
      };
    }

    // 2. Nächster Tick → Overlay + Bild in Endposition animieren
    setTimeout(() => {
      this.isVisible = true; // 👈 macht Overlay dunkel
      this.animateToFinal = true; // 👈 triggert Zoom zu finalStyles
    }, 10);
  }

  get currentImage(): string | null {
    return this.images[this.currentIndex] ?? null;
  }

  get finalStyles(): Record<string, string> {
    return {
      position: 'fixed',
      left: '50%',
      top: '50%',
      width: '90vw',
      height: 'auto',
      transform: 'translate(-50%, -50%)',
      transition: 'all 300ms ease-out',
    };
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
