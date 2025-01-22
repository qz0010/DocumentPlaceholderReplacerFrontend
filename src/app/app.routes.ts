import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/document/document.component').then(m => m.DocumentComponent),
  }
];
