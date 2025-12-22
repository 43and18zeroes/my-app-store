import { Routes } from '@angular/router';
import { PRODUCT_PATH } from './pages/applications/applications.data';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'My App Store',
    loadComponent: () =>
      import('./pages/applications/applications').then((m) => m.Applications),
  },
  {
    path: 'start',
    pathMatch: 'full',
    redirectTo: '',
  },
  {
    path: 'info',
    title: 'Info - My App Store',
    loadComponent: () => import('./pages/info/info').then((m) => m.Info),
  },
  {
    path: 'privacy-policy',
    title: 'Privacy Policy - My App Store',
    loadComponent: () =>
      import('./pages/privacy-policy/privacy-policy').then(
        (m) => m.PrivacyPolicy
      ),
  },
  {
    path: 'imprint',
    title: 'Imprint - My App Store',
    loadComponent: () =>
      import('./pages/imprint/imprint').then((m) => m.Imprint),
  },
  {
    path: `${PRODUCT_PATH}/:productId`,
    title: 'Product Details - My App Store',
    loadComponent: () =>
      import('./components/product-details/product-details').then(
        (m) => m.ProductDetails
      ),
  },
  {
    path: '**',
    title: '404 - Page not found - My App Store',
    loadComponent: () =>
      import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];
