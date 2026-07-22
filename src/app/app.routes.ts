import { Routes } from '@angular/router';
import { juzNumberCanMatch } from './core/routing/juz-number.matcher';
import { legacySurahRedirect } from './core/routing/legacy-surah-redirect';
import { mushafPageCanMatch } from './core/routing/mushaf-page.matcher';
import { surahNumberCanMatch } from './core/routing/surah-number.matcher';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./home-landing/home-landing.component').then((m) => m.HomeLandingComponent),
  },
  {
    path: 'blog',
    loadComponent: () =>
      import('./blog-explorer/blog-explorer.component').then((m) => m.BlogExplorerComponent),
  },
  {
    path: 'blog/:id',
    loadComponent: () =>
      import('./blog-detail/blog-detail.component').then((m) => m.BlogDetailComponent),
  },
  {
    path: 'adhkar',
    loadComponent: () =>
      import('./adhkar-explorer/adhkar-explorer.component').then((m) => m.AdhkarExplorerComponent),
  },
  {
    path: 'adhkar/:id',
    loadComponent: () =>
      import('./adhkar-detail/adhkar-detail.component').then((m) => m.AdhkarDetailComponent),
  },
  {
    path: 'learn',
    loadComponent: () =>
      import('./learner-hub/learner-hub.component').then((m) => m.LearnerHubComponent),
  },
  {
    path: 'learn/:id',
    loadComponent: () =>
      import('./learner-lesson/learner-lesson.component').then((m) => m.LearnerLessonComponent),
  },
  {
    path: 'themes',
    loadComponent: () =>
      import('./themes-explorer/themes-explorer.component').then((m) => m.ThemesExplorerComponent),
  },
  {
    path: 'themes/:id',
    loadComponent: () =>
      import('./theme-detail/theme-detail.component').then((m) => m.ThemeDetailComponent),
  },
  { path: 'surah/:n', redirectTo: legacySurahRedirect },
  {
    path: 'page/:p',
    loadComponent: () =>
      import('./surah-reader/surah-reader.component').then((m) => m.SurahReaderComponent),
    canMatch: [mushafPageCanMatch],
  },
  {
    path: 'juz/:j',
    loadComponent: () =>
      import('./surah-reader/surah-reader.component').then((m) => m.SurahReaderComponent),
    canMatch: [juzNumberCanMatch],
  },
  {
    path: ':n',
    loadComponent: () =>
      import('./surah-reader/surah-reader.component').then((m) => m.SurahReaderComponent),
    canMatch: [surahNumberCanMatch],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
