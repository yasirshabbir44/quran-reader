import { Routes } from '@angular/router';
import { legacySurahRedirect } from './core/routing/legacy-surah-redirect';
import { surahNumberCanMatch } from './core/routing/surah-number.matcher';
import { HomeRedirectComponent } from './home-redirect.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { SurahReaderComponent } from './surah-reader/surah-reader.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeRedirectComponent },
  { path: 'surah/:n', redirectTo: legacySurahRedirect },
  {
    path: ':n',
    component: SurahReaderComponent,
    canMatch: [surahNumberCanMatch],
  },
  { path: '**', component: NotFoundComponent },
];
