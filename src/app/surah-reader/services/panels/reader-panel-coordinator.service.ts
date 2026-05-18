import { Injectable, inject, signal } from '@angular/core';
import { ReaderSurahNavService } from './reader-surah-nav.service';

@Injectable()
export class ReaderPanelCoordinatorService {
  private readonly surahNav = inject(ReaderSurahNavService);

  readonly settingsOpen = signal(false);

  toggleSettings(): void {
    this.settingsOpen.update((open) => !open);
    if (this.settingsOpen()) {
      this.surahNav.close();
    }
  }

  openSettings(): void {
    this.settingsOpen.set(true);
    this.surahNav.close();
  }

  closeSettings(): void {
    this.settingsOpen.set(false);
  }

  toggleSurahNav(): void {
    if (this.surahNav.open()) {
      this.surahNav.close();
      return;
    }
    this.settingsOpen.set(false);
    this.surahNav.openPanel();
  }

  anyOverlayOpen(): boolean {
    return this.settingsOpen() || this.surahNav.open();
  }
}
