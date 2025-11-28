import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CustomSidenav } from './components/custom-sidenav/custom-sidenav';
import { ThemeService } from './services/theme-service';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
// import { DeviceService } from './services/device-service';
import { fromEvent, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatIconModule,
    MatSidenavModule,
    MatButtonModule,
    MatSlideToggleModule,
    CustomSidenav,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Angular Material Darkmode');
  // deviceService = inject(DeviceService);
  themeService = inject(ThemeService);
  collapsed = signal(true);
  isDesktop = signal(true);
  // private breakpointSub?: Subscription;
  private resizeSub?: Subscription;

  constructor(private breakpointObserver: BreakpointObserver) {
    // effect(() => {
    //   console.log('app resize');
    //   // const _width = this.deviceService.viewportWidth();
    //   this.collapsed.set(true);
    // });
  }

  ngOnInit() {
    this.themeService.initTheme();
    // this.breakpointSub = this.breakpointObserver
    //   .observe([Breakpoints.Handset])
    //   .subscribe((result) => {
    //     this.isDesktop.set(!result.matches);
    //     this.collapsed.set(true);
    //   });
    this.resizeSub = fromEvent(window, 'resize').subscribe(() => {
      this.collapsed.set(true);
      // optional: nur zum Debuggen
      // console.log('resize, collapsed -> true');
    });
  }

  sidenavWidth = computed(() => (this.collapsed() ? '81px' : '250px'));
  contentMarginLeft = computed(() => {
    return '81px';
  });

  collapseSidenav() {
    this.collapsed.set(true);
  }

  // ngOnDestroy() {
  //   this.breakpointSub?.unsubscribe();
  // }
}
