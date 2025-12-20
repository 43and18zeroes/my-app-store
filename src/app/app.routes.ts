import { Routes } from '@angular/router';
import { PRODUCT_PATH } from './pages/applications/applications.data';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/applications/applications').then((m) => m.Applications),
  },
  {
    path: 'info',
    loadComponent: () => import('./pages/info/info').then((m) => m.Info),
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./pages/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicy),
  },
  {
    path: 'imprint',
    loadComponent: () => import('./pages/imprint/imprint').then((m) => m.Imprint),
  },
  {
    path: 'start',
    pathMatch: 'full',
    redirectTo: '',
  },
  { 
    path: `${PRODUCT_PATH}/:productId`, 
    loadComponent: () => import('./components/product-details/product-details').then(m => m.ProductDetails) 
  },
  { path: '**', redirectTo: '' },
];
