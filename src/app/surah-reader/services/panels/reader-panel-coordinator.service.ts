import { Injectable, inject, signal } from '@angular/core';
import { ReaderMushafNavService } from './reader-mushaf-nav.service';
import { ReaderSurahNavService } from './reader-surah-nav.service';

@Injectable()
export class ReaderPanelCoordinatorService {
  private readonly surahNav = inject(ReaderSurahNavService);
  private readonly mushafNav = inject(ReaderMushafNavService);

  readonly settingsOpen = signal(false);

  toggleSettings(): void {
    this.settingsOpen.update((open) => !open);
    if (this.settingsOpen()) {
      this.surahNav.close();
      this.mushafNav.close();
    }
  }

  openSettings(): void {
    this.settingsOpen.set(true);
    this.surahNav.close();
    this.mushafNav.close();
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
    this.mushafNav.close();
    this.surahNav.openPanel();
  }

  toggleMushafNav(kind: 'page' | 'juz'): void {
    if (this.mushafNav.open() && this.mushafNav.kind() === kind) {
      this.mushafNav.close();
      return;
    }
    this.settingsOpen.set(false);
    this.surahNav.close();
    this.mushafNav.openPanel(kind);
  }

  anyOverlayOpen(): boolean {
    return this.settingsOpen() || this.surahNav.open() || this.mushafNav.open();
  }

  closeAllOverlays(): void {
    this.closeSettings();
    this.surahNav.close();
    this.mushafNav.close();
  }
}
