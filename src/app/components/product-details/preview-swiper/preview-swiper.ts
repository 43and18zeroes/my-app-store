import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  Output,
  ViewChild,
} from '@angular/core';
import { DeviceService } from '../../../services/device-service';
import { HttpClient } from '@angular/common/http';
import Swiper from 'swiper';
import { Navigation, FreeMode } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { NavigationOptions, SwiperOptions } from 'swiper/types';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { PortalModule, TemplatePortal } from '@angular/cdk/portal';
import { ViewContainerRef, TemplateRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-preview-swiper',
  imports: [PortalModule, MatIconModule],
  templateUrl: './preview-swiper.html',
  styleUrl: './preview-swiper.scss',
})
export class PreviewSwiper {
  private deviceService = inject(DeviceService);
  private http = inject(HttpClient);

  @Input() productPreviewsPath!: string;
  @Output() select = new EventEmitter<string>();

  @ViewChild('swiperContainer') swiperContainer!: ElementRef<HTMLElement>;
  @ViewChild('lbViewport') lbViewport?: ElementRef<HTMLElement>;
  @ViewChild('lbTrack') lbTrack?: ElementRef<HTMLElement>;
  @ViewChild('lightboxTpl') lightboxTpl!: TemplateRef<unknown>;

  private overlayRef?: OverlayRef;
  lightboxOpen = false;
  lightboxIndex = 0;

  constructor(
    private overlay: Overlay,
    private vcr: ViewContainerRef,
    private zone: NgZone
  ) {}

  desktopBreakpoints: SwiperOptions['breakpoints'] = {
    320: { spaceBetween: 20 },
    600: { spaceBetween: 20 },
    960: { spaceBetween: 20 },
    1440: { spaceBetween: 20 },
  };

  mobileBreakpoints: SwiperOptions['breakpoints'] = {
    320: { spaceBetween: 10 },
    600: { spaceBetween: 10 },
    960: { spaceBetween: 10 },
  };

  private swiper?: Swiper;

  get isMobileDevice() {
    return this.deviceService.isAndroid || this.deviceService.isiPhone;
  }

  images: string[] = [];

  private readonly base = '/img/applications/previews';

  ngOnInit() {
    const p = (this.productPreviewsPath || '').replace(/^\/+/, '');
    const url = `${this.base}/${p}/gallery.json`;

    this.http.get<string[]>(url).subscribe({
      next: (data) => (this.images = data ?? []),
      error: (err) => {
        console.error('gallery.json nicht gefunden:', url, err);
        this.images = [];
      },
    });
  }

  ngAfterViewInit(): void {
    this.initSwiper();
  }

  imgSrc(file: string) {
    const p = (this.productPreviewsPath || '').replace(/^\/+/, '');
    return `${this.base}/${p}/${file}`;
  }

  private initSwiper() {
    const host = this.swiperContainer?.nativeElement;
    if (!host) return;

    const isMobile = this.isMobileDevice;

    let nextEl: HTMLElement | null = null;
    let prevEl: HTMLElement | null = null;

    if (!isMobile) {
      nextEl = host.querySelector<HTMLElement>('.swiper-button-next');
      prevEl = host.querySelector<HTMLElement>('.swiper-button-prev');
    }

    const navigationCfg =
      nextEl && prevEl ? ({ nextEl, prevEl } as NavigationOptions) : undefined;

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
      speed: isMobile ? 200 : 500,
      breakpoints: isMobile ? this.mobileBreakpoints : this.desktopBreakpoints,
    };

    this.destroySwiper();
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

  onThumbClick(event: MouseEvent, index: number) {
    event.preventDefault();
    event.stopPropagation();
    this.select.emit(this.images[index]);
    this.openLightbox(index);
  }

  onClosePointerUp(e: PointerEvent) {
  e.stopPropagation();
  e.preventDefault();

  this.closeLightbox();
}

  closeLightbox(event?: Event) {
    event?.stopPropagation();
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
    this.lightboxOpen = false;
  }

  nextLightbox(event?: Event) {
    event?.stopPropagation();
    if (!this.images?.length) return;
    this.lightboxIndex = (this.lightboxIndex + 1) % this.images.length;
  }

  prevLightbox(event?: Event) {
    event?.stopPropagation();
    if (!this.images?.length) return;
    this.lightboxIndex =
      (this.lightboxIndex - 1 + this.images.length) % this.images.length;
  }

  onLightboxKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        this.closeLightbox();
        break;
      case 'ArrowRight':
        this.nextLightbox();
        break;
      case 'ArrowLeft':
        this.prevLightbox();
        break;
      default:
        break;
    }
  }

  private _swipe = {
    tracking: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    startTs: 0,
    justSwiped: false,
  };

  lbPointerDown(e: PointerEvent) {
    // nur Touch/Pen, Maus ignorieren
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
    this._swipe.tracking = true;
    this._swipe.pointerId = e.pointerId;
    this._swipe.startX = e.clientX;
    this._swipe.startY = e.clientY;
    this._swipe.deltaX = 0;
    this._swipe.deltaY = 0;
    this._swipe.startTs = performance.now();

    // verhindert, dass das Event in Click umgedeutet wird
    (e.target as Element)?.setPointerCapture?.(e.pointerId);
  }

  lbPointerMove(e: PointerEvent) {
    if (!this._swipe.tracking || e.pointerId !== this._swipe.pointerId) return;
    this._swipe.deltaX = e.clientX - this._swipe.startX;
    this._swipe.deltaY = e.clientY - this._swipe.startY;

    // Wenn horizontal deutlich dominiert, Standard verhindern (kein Scroll)
    if (Math.abs(this._swipe.deltaX) > Math.abs(this._swipe.deltaY)) {
      e.preventDefault();
    }
  }

  lbPointerUp(e: PointerEvent) {
    if (!this._swipe.tracking || e.pointerId !== this._swipe.pointerId) return;

    const dx = this._swipe.deltaX;
    const dy = this._swipe.deltaY;
    const dt = performance.now() - this._swipe.startTs;

    // Schwellenwerte
    const DIST_THRESHOLD = 40; // min. Weg in px
    const VELO_THRESHOLD = 0.2; // px/ms ~ 200px/s
    const H_DOMINATES = Math.abs(dx) > Math.abs(dy);

    let handled = false;
    if (
      H_DOMINATES &&
      (Math.abs(dx) > DIST_THRESHOLD || Math.abs(dx) / dt > VELO_THRESHOLD)
    ) {
      handled = true;
      if (dx < 0) this.nextLightbox(); // nach links wischen -> nächstes Bild
      else this.prevLightbox(); // nach rechts wischen -> vorheriges Bild
    }

    this._swipe.tracking = false;
    this._swipe.pointerId = -1;

    // Klick-zu-Schließen nach Swipe unterbinden (Tap-vs-Swipe)
    this._swipe.justSwiped = handled;
    if (handled) {
      setTimeout(() => (this._swipe.justSwiped = false), 80);
    }
  }

  lbPointerCancel(_e: PointerEvent) {
    this._swipe.tracking = false;
    this._swipe.pointerId = -1;
  }

  trackX = 0; // aktuelle Track-Position (px)
  trackTransition = ''; // z.B. 'transform 250ms ease'
  private viewportW = 0;
  private rafId = 0;
  private animX = 0; // aktuell gerenderte X-Position
  private targetX = 0; // Ziel beim Snap
  private snapping = false;
  private transitionMs = 250; // Snap-Dauer

  get prevIndex() {
    return (this.lightboxIndex - 1 + this.images.length) % this.images.length;
  }
  get nextIndex() {
    return (this.lightboxIndex + 1) % this.images.length;
  }

  private drag = {
    active: false,
    id: -1,
    startX: 0,
    startY: 0,
    dx: 0,
    dy: 0,
    lastX: 0,
    lastTs: 0,
    vx: 0,
  };

  private setX(x: number) {
    this.animX = x;
    this.lbTrack?.nativeElement.style.setProperty('--x', `${x}px`);
  }

  private measureViewport() {
    const el = this.lbViewport?.nativeElement;
    this.viewportW = el ? el.clientWidth : 0;
  }

  openLightbox(index: number) {
    if (!this.images?.length) return;
    this.lightboxIndex = Math.max(0, Math.min(index, this.images.length - 1));

    // Overlay-Konfiguration
    const overlayConfig = this.overlay
      .position()
      .global()
      .centerHorizontally()
      .centerVertically();

    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'lightbox-backdrop', // eigenes Darkening
      positionStrategy: overlayConfig,
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    // Backdrop klick -> schließen
    this.overlayRef.backdropClick().subscribe(() => this.closeLightbox());

    // Template anhängen
    const portal = new TemplatePortal(this.lightboxTpl, this.vcr);
    this.overlayRef.attach(portal);

    // Keydown (ESC/Arrows)
    this.overlayRef.keydownEvents().subscribe((e) => this.onLightboxKeydown(e));

    this.lightboxOpen = true;

    // nach Render messen
    queueMicrotask(() => this.measureViewport());
    // optional: bei Resize neu messen
    window.addEventListener('resize', this._onResize, { passive: true });
  }

  ngOnDestroy() {
    this.overlayRef?.dispose();
    this.destroySwiper();
    window.removeEventListener('resize', this._onResize);
  }

  private _onResize = () => this.measureViewport();

  /* ----- Drag-Handing mit sichtbarer Bewegung ----- */
  lbDragStart(e: PointerEvent) {
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;

    this.drag.active = true;
    this.drag.id = e.pointerId;
    this.drag.startX = this.drag.lastX = e.clientX;
    this.drag.startY = e.clientY;
    this.drag.dx = this.drag.dy = 0;
    this.drag.lastTs = performance.now();
    this.snapping = false;
    this.lbTrack?.nativeElement.classList.remove('is-snapping');
    (e.target as Element)?.setPointerCapture?.(e.pointerId);

    // Messung einmalig
    if (!this.viewportW) this.measureViewport();
  }

  lbDragMove(e: PointerEvent) {
    if (!this.drag.active || e.pointerId !== this.drag.id) return;
    const now = performance.now();

    this.drag.dx = e.clientX - this.drag.startX;
    this.drag.dy = e.clientY - this.drag.startY;

    // horizontale Dominanz -> Scroll blocken
    if (Math.abs(this.drag.dx) > Math.abs(this.drag.dy)) e.preventDefault();

    // Velocity (für Momentum): simple sample
    const ddx = e.clientX - this.drag.lastX;
    const dt = Math.max(1, now - this.drag.lastTs);
    this.drag.vx = ddx / dt; // px/ms

    this.drag.lastX = e.clientX;
    this.drag.lastTs = now;

    // Schreibe transform außerhalb Angular + mit rAF
    this.zone.runOutsideAngular(() => {
      cancelAnimationFrame(this.rafId);
      this.rafId = requestAnimationFrame(() => this.setX(this.drag.dx));
    });
  }

  lbDragEnd(e: PointerEvent) {
    if (!this.drag.active || e.pointerId !== this.drag.id) return;
    this.drag.active = false;

    const dx = this.drag.dx;
    const dy = this.drag.dy;
    const v = Math.abs(this.drag.vx); // px/ms

    const DIST = Math.max(40, this.viewportW * 0.18);
    const VEL = 0.25; // ~250px/s

    const horizontal = Math.abs(dx) > Math.abs(dy);
    let dir: 'next' | 'prev' | null = null;
    if (horizontal && (Math.abs(dx) > DIST || v > VEL)) {
      dir = dx < 0 ? 'next' : 'prev';
    }

    // Ziel setzen
    if (dir === 'next') {
      this.targetX = -this.viewportW;
    } else if (dir === 'prev') {
      this.targetX = this.viewportW;
    } else {
      this.targetX = 0;
    }

    // Snapping mit CSS-Transition (smooth) + Momentum-Boost
    // Dauer dynamisch je nach Restweg/Velocity
    const base = 220; // ms
    const extra = Math.min(180, Math.abs(this.targetX - this.animX) / 2);
    const dur = Math.max(160, base + extra - v * 300); // schnell -> kürzer

    const track = this.lbTrack?.nativeElement;
    if (!track) return;

    this.zone.runOutsideAngular(() => {
      track.style.transition = `transform ${dur}ms cubic-bezier(.22,.61,.36,1)`;
      track.classList.add('is-snapping');
      // CSS var -> transform updated by CSS, aber sicherheitshalber direkt setzen:
      // (wir nutzen hier die CSS-Variable weiter)
      requestAnimationFrame(() => this.setX(this.targetX));
    });
  }

  lbDragCancel(_: PointerEvent) {
    if (!this.drag.active) return;
    this.drag.active = false;
    this.zone.runOutsideAngular(() => {
      const track = this.lbTrack?.nativeElement;
      if (!track) return;
      track.style.transition = `transform 220ms cubic-bezier(.22,.61,.36,1)`;
      track.classList.add('is-snapping');
      requestAnimationFrame(() => this.setX(0));
    });
  }

  onTrackTransitionEnd() {
    const track = this.lbTrack?.nativeElement;
    if (!track) return;
    // Indexwechsel, wenn „aus dem Screen“ gesnappt:
    if (this.animX === -this.viewportW) {
      this.lightboxIndex = this.nextIndex;
    } else if (this.animX === this.viewportW) {
      this.lightboxIndex = this.prevIndex;
    } else {
      // nur zurückgeschnappt
    }
    // Reset
    track.style.transition = 'none';
    track.classList.remove('is-snapping');
    this.setX(0);
  }

  onLightboxContainerClick(e: MouseEvent) {
    // Wurde gerade geswiped? Dann NICHT schließen.
    if (this._swipe.justSwiped) {
      e.stopPropagation();
      return;
    }
    this.closeLightbox();
  }
}
