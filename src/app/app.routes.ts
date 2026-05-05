import { Routes } from '@angular/router';
import { SurahReaderComponent } from './mulk-reader/mulk-reader.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'surah/67' },
  { path: 'surah/:n', component: SurahReaderComponent },
  { path: '**', redirectTo: 'surah/67' },
];
