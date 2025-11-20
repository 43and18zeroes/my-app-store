import { CommonModule } from '@angular/common';
import { Component, computed, model, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';

export type MenuItem = {
  icon: string;
  label: string;
  route: string;
};

@Component({
  selector: 'app-custom-sidenav',
  imports: [CommonModule, MatListModule, MatIconModule, RouterModule],
  templateUrl: './custom-sidenav.html',
  styleUrl: './custom-sidenav.scss',
})
export class CustomSidenav {
  sideNavCollapsed = signal(false);

  collapsed = model.required<boolean>();

  iconMargin = computed(() => (this.collapsed() ? '12px' : '16px'));

  menuItems = signal<MenuItem[]>([
    {
      icon: 'apps',
      label: 'Apps',
      route: '/',
    },
    {
      icon: 'info',
      label: 'Info',
      route: '/info',
    },
    {
      icon: 'lock',
      label: 'Privacy Policy',
      route: '/privacy-policy',
    },
    {
      icon: 'article',
      label: 'Imprint',
      route: '/imprint',
    },
  ]);
}
