import { Routes } from '@angular/router';
import { MulkReaderComponent } from './mulk-reader/mulk-reader.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'surah/67' },
  { path: 'surah/:n', component: MulkReaderComponent },
  { path: '**', redirectTo: 'surah/67' },
];
