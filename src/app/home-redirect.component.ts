import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { READING_BOOKMARK_REPOSITORY } from './core/bookmark/reading-bookmark.repository';

@Component({
  selector: 'app-home-redirect',
  standalone: true,
  template: '',
})
export class HomeRedirectComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly bookmark = inject(READING_BOOKMARK_REPOSITORY);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      void this.router.navigate(['/surah', 67], { replaceUrl: true });
      return;
    }
    const b = this.bookmark.read();
    if (b) {
      void this.router.navigate(['/surah', b.surah], {
        queryParams: { startingVerse: b.ayah },
        replaceUrl: true,
      });
      return;
    }
    void this.router.navigate(['/surah', 67], { replaceUrl: true });
  }
}
