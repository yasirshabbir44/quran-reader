import { Routes } from '@angular/router';
import { HomeRedirectComponent } from './home-redirect.component';
import { SurahReaderComponent } from './surah-reader/surah-reader.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeRedirectComponent },
  { path: 'surah/:n', component: SurahReaderComponent },
  { path: '**', redirectTo: '' },
];
