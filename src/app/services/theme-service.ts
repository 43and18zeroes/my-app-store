import { effect, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  darkMode = signal(false);

  initTheme() {
    document.documentElement.classList.add('no__transition');
    this.loadDarkModeFromStorageOrSystem();
    this.listenToSystemPreferenceChanges();
    setTimeout(() => {
      document.documentElement.classList.remove('no__transition');
    }, 100);
  }

  private loadDarkModeFromStorageOrSystem(): void {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      this.darkMode.set(saved === 'true');
    } else {
      const prefersDark = window.matchMedia?.(
        '(prefers-color-scheme: dark)'
      ).matches;
      this.darkMode.set(prefersDark);
    }
  }

  private listenToSystemPreferenceChanges(): void {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        const saved = localStorage.getItem('darkMode');
        if (saved === null) {
          this.darkMode.set(e.matches);
        }
      });
  }

  applyThemeEffect = effect(() => {
    const dark = this.darkMode();
    document.body.classList.toggle('darkMode', dark);
    document.body.classList.toggle('lightMode', !dark);
  });

  saveUserPreference(): void {
    localStorage.setItem('darkMode', this.darkMode().toString());
  }

  toggleTheme() {
    const current = this.darkMode();
    this.darkMode.set(!current);
    this.saveUserPreference();
  }
}
