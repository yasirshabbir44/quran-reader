import { Routes } from '@angular/router';
import { HomeRedirectComponent } from './home-redirect.component';
import { SurahReaderComponent } from './mulk-reader/mulk-reader.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeRedirectComponent },
  { path: 'surah/:n', component: SurahReaderComponent },
  { path: '**', redirectTo: '' },
];
