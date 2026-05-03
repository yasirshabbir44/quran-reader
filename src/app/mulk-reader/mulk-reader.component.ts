import { Component, HostListener } from '@angular/core';
import { SURAH_MULK_VERSES } from '../data/surah-mulk';

@Component({
  selector: 'app-mulk-reader',
  standalone: true,
  imports: [],
  templateUrl: './mulk-reader.component.html',
  styleUrl: './mulk-reader.component.scss',
})
export class MulkReaderComponent {
  protected readonly verses = SURAH_MULK_VERSES;

  protected scrollProgress = 0;
  protected stickyHeaderVisible = false;
  protected scrollTopVisible = false;

  private scrollRaf = 0;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.scrollRaf) {
      return;
    }
    this.scrollRaf = requestAnimationFrame(() => {
      this.scrollRaf = 0;
      const root = document.documentElement;
      const y = window.scrollY;
      const max = root.scrollHeight - root.clientHeight;
      this.scrollProgress = max > 0 ? Math.min(100, Math.round((y / max) * 100)) : 0;
      this.stickyHeaderVisible = y > 100;
      this.scrollTopVisible = y > 360;
    });
  }

  protected scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
