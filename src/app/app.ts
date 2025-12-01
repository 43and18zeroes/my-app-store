import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CustomSidenav } from './components/custom-sidenav/custom-sidenav';
import { ThemeService } from './services/theme-service';
import { RouterOutlet } from '@angular/router';
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
  themeService = inject(ThemeService);
  collapsed = signal(true);
  viewportWidth = signal(window.innerWidth);
  private resizeSub?: Subscription;

  constructor() {}

  ngOnInit() {
    this.themeService.initTheme();
    this.resizeSub = fromEvent(window, 'resize').subscribe(() => {
      this.viewportWidth.set(window.innerWidth);
      this.collapsed.set(true);
    });
  }

  collapseSidenav() {
    this.collapsed.set(true);
  }

  ngOnDestroy() {
    this.resizeSub?.unsubscribe();
  }
}
