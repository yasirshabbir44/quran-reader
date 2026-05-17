import { Routes } from '@angular/router';
import { legacySurahRedirect } from './core/routing/legacy-surah-redirect';
import { surahNumberCanMatch } from './core/routing/surah-number.matcher';
import { HomeLandingComponent } from './home-landing/home-landing.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { SurahReaderComponent } from './surah-reader/surah-reader.component';
import { ThemeDetailComponent } from './theme-detail/theme-detail.component';
import { ThemesExplorerComponent } from './themes-explorer/themes-explorer.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeLandingComponent },
  { path: 'themes', component: ThemesExplorerComponent },
  { path: 'themes/:id', component: ThemeDetailComponent },
  { path: 'surah/:n', redirectTo: legacySurahRedirect },
  {
    path: ':n',
    component: SurahReaderComponent,
    canMatch: [surahNumberCanMatch],
  },
  { path: '**', component: NotFoundComponent },
];
