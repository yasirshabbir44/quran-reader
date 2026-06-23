import { Routes } from '@angular/router';
import { juzNumberCanMatch } from './core/routing/juz-number.matcher';
import { legacySurahRedirect } from './core/routing/legacy-surah-redirect';
import { mushafPageCanMatch } from './core/routing/mushaf-page.matcher';
import { surahNumberCanMatch } from './core/routing/surah-number.matcher';
import { HomeLandingComponent } from './home-landing/home-landing.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { SurahReaderComponent } from './surah-reader/surah-reader.component';
import { ThemeDetailComponent } from './theme-detail/theme-detail.component';
import { ThemesExplorerComponent } from './themes-explorer/themes-explorer.component';
import { BlogExplorerComponent } from './blog-explorer/blog-explorer.component';
import { BlogDetailComponent } from './blog-detail/blog-detail.component';
import { AdhkarExplorerComponent } from './adhkar-explorer/adhkar-explorer.component';
import { AdhkarDetailComponent } from './adhkar-detail/adhkar-detail.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeLandingComponent },
  { path: 'blog', component: BlogExplorerComponent },
  { path: 'blog/:id', component: BlogDetailComponent },
  { path: 'adhkar', component: AdhkarExplorerComponent },
  { path: 'adhkar/:id', component: AdhkarDetailComponent },
  { path: 'themes', component: ThemesExplorerComponent },
  { path: 'themes/:id', component: ThemeDetailComponent },
  { path: 'surah/:n', redirectTo: legacySurahRedirect },
  {
    path: 'page/:p',
    component: SurahReaderComponent,
    canMatch: [mushafPageCanMatch],
  },
  {
    path: 'juz/:j',
    component: SurahReaderComponent,
    canMatch: [juzNumberCanMatch],
  },
  {
    path: ':n',
    component: SurahReaderComponent,
    canMatch: [surahNumberCanMatch],
  },
  { path: '**', component: NotFoundComponent },
];
