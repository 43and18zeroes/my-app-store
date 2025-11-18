import { NgIf } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-lightbox',
  imports: [NgIf, MatIconModule],
  templateUrl: './lightbox.html',
  styleUrl: './lightbox.scss',
})
export class Lightbox {
  @Input({ required: true }) images: string[] = [];
  @Input() startIndex = 0;

  @Output() closed = new EventEmitter<void>();

  currentIndex = 0;
  isVisible = false;

  ngOnInit() {
    this.currentIndex =
      this.startIndex >= 0 && this.startIndex < this.images.length
        ? this.startIndex
        : 0;

    // Nächster Tick → CSS-Transition kann von "hidden" nach "visible" animieren
    setTimeout(() => {
      this.isVisible = true;
    }, 0);
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
