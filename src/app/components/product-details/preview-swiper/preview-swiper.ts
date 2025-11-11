import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
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

@Component({
  selector: 'app-preview-swiper',
  imports: [PortalModule],
  templateUrl: './preview-swiper.html',
  styleUrl: './preview-swiper.scss',
})
export class PreviewSwiper {
  private deviceService = inject(DeviceService);
  private http = inject(HttpClient);

  @Input() productPreviewsPath!: string;
  @Output() select = new EventEmitter<string>();

  @ViewChild('swiperContainer') swiperContainer!: ElementRef<HTMLElement>;

  private overlayRef?: OverlayRef;
  lightboxOpen = false;
  lightboxIndex = 0;

  constructor(private overlay: Overlay, private vcr: ViewContainerRef) {}

  @ViewChild('lightboxTpl') lightboxTpl!: TemplateRef<unknown>;

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

  @ViewChild('lbViewport') lbViewport?: ElementRef<HTMLElement>;

  trackX = 0; // aktuelle Track-Position (px)
  trackTransition = ''; // z.B. 'transform 250ms ease'
  private viewportW = 0; // Breite des Viewports (px)
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
    startTs: 0,
    swiped: false,
  };

  private measureViewport() {
    const el = this.lbViewport?.nativeElement;
    if (!el) return;
    this.viewportW = el.clientWidth || 0;
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
    this.drag.startX = e.clientX;
    this.drag.startY = e.clientY;
    this.drag.dx = 0;
    this.drag.dy = 0;
    this.drag.startTs = performance.now();
    this.drag.swiped = false;
    this.trackTransition = ''; // Transition aus -> direkte Folgebewegung
    (e.target as Element)?.setPointerCapture?.(e.pointerId);
  }

  lbDragMove(e: PointerEvent) {
    if (!this.drag.active || e.pointerId !== this.drag.id) return;
    this.drag.dx = e.clientX - this.drag.startX;
    this.drag.dy = e.clientY - this.drag.startY;

    // horizontale Dominanz -> Seite nicht scrollen
    if (Math.abs(this.drag.dx) > Math.abs(this.drag.dy)) e.preventDefault();

    // Track live verschieben: Mitte (= aktuelles Bild) ist 0,
    // links ist prev, rechts ist next -> wir schieben nur um dx
    this.trackX = this.drag.dx;
  }

  lbDragEnd(e: PointerEvent) {
    if (!this.drag.active || e.pointerId !== this.drag.id) return;

    const dx = this.drag.dx;
    const dy = this.drag.dy;
    const dt = performance.now() - this.drag.startTs;
    const v = Math.abs(dx) / Math.max(dt, 1); // px/ms

    const DIST = Math.max(40, this.viewportW * 0.18); // Strecke
    const VEL = 0.25; // ~250px/s

    const horizontal = Math.abs(dx) > Math.abs(dy);
    let direction: 'next' | 'prev' | null = null;

    if (horizontal && (Math.abs(dx) > DIST || v > VEL)) {
      direction = dx < 0 ? 'next' : 'prev';
    }

    this.trackTransition = `transform ${this.transitionMs}ms ease`;

    if (direction === 'next') {
      // animiere zur linken Seite (-viewportW), dann Index++ und reset
      this.trackX = -this.viewportW;
      this.drag.swiped = true;
    } else if (direction === 'prev') {
      this.trackX = this.viewportW;
      this.drag.swiped = true;
    } else {
      // zurück in die Mitte snappen
      this.trackX = 0;
    }

    this.drag.active = false;
    this.drag.id = -1;
  }

  lbDragCancel(_e: PointerEvent) {
    if (!this.drag.active) return;
    this.drag.active = false;
    this.trackTransition = `transform ${this.transitionMs}ms ease`;
    this.trackX = 0;
  }

  onTrackTransitionEnd() {
    // Wenn wir „aus dem Screen“ animiert haben, Index anpassen und Track resetten
    if (this.trackX === -this.viewportW) {
      this.lightboxIndex = this.nextIndex;
    } else if (this.trackX === this.viewportW) {
      this.lightboxIndex = this.prevIndex;
    } else {
      return; // nur Rücksnap, nichts zu tun
    }

    // Nach dem Indexwechsel: Track ohne Transition auf 0 setzen,
    // damit das neue Set (prev/current/next) wieder mittig steht.
    this.trackTransition = '';
    this.trackX = 0;
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
