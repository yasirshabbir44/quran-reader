import { DOCUMENT, isPlatformBrowser, NgClass } from '@angular/common';
import {
  afterNextRender,
  Component,
  HostListener,
  inject,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { SURAH_MULK_VERSES } from '../data/surah-mulk';
import { SURAH_MULK_META } from '../data/surah-mulk-meta';

const LS_FONT = 'mulk-reader-font';
const LS_LINE = 'mulk-reader-line';
const LS_WIDTH = 'mulk-reader-width';

type ReaderFont = 's' | 'm' | 'l' | 'xl';
type ReaderLine = 'normal' | 'relaxed' | 'loose';
type ReaderWidth = 'narrow' | 'medium' | 'wide';

@Component({
  selector: 'app-mulk-reader',
  standalone: true,
  imports: [NgClass],
  templateUrl: './mulk-reader.component.html',
  styleUrl: './mulk-reader.component.scss',
})
export class MulkReaderComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly verses = SURAH_MULK_VERSES;
  protected readonly meta = SURAH_MULK_META;

  protected font: ReaderFont = 'm';
  protected line: ReaderLine = 'normal';
  protected width: ReaderWidth = 'medium';

  protected scrollProgress = 0;
  protected stickyHeaderVisible = false;
  protected scrollTopVisible = false;
  protected activeAyah = 1;

  private scrollRaf = 0;
  private ayahElements: HTMLElement[] | null = null;

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      this.ayahElements = this.verses
        .map((v) => this.document.getElementById(`ayah-${v.ayah}`))
        .filter((el): el is HTMLElement => !!el);
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      const f = localStorage.getItem(LS_FONT) as ReaderFont | null;
      const l = localStorage.getItem(LS_LINE) as ReaderLine | null;
      const w = localStorage.getItem(LS_WIDTH) as ReaderWidth | null;
      if (f && ['s', 'm', 'l', 'xl'].includes(f)) {
        this.font = f;
      }
      if (l && ['normal', 'relaxed', 'loose'].includes(l)) {
        this.line = l;
      }
      if (w && ['narrow', 'medium', 'wide'].includes(w)) {
        this.width = w;
      }
    } catch {
      /* ignore */
    }
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.scrollRaf) {
      return;
    }
    this.scrollRaf = requestAnimationFrame(() => {
      this.scrollRaf = 0;
      const root = this.document.documentElement;
      const y = this.document.defaultView?.scrollY ?? 0;
      const max = root.scrollHeight - root.clientHeight;
      this.scrollProgress = max > 0 ? Math.min(100, Math.round((y / max) * 100)) : 0;
      this.stickyHeaderVisible = y > 100;
      this.scrollTopVisible = y > 360;
      this.updateActiveAyah();
    });
  }

  protected scrollToTop(): void {
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected formatArNum(n: number): string {
    return n.toLocaleString('ar-u-nu-arab');
  }

  protected setFont(f: ReaderFont): void {
    this.font = f;
    this.persist(LS_FONT, f);
  }

  protected setLine(l: ReaderLine): void {
    this.line = l;
    this.persist(LS_LINE, l);
  }

  protected setWidth(w: ReaderWidth): void {
    this.width = w;
    this.persist(LS_WIDTH, w);
  }

  protected jumpToAyah(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const n = Number(select.value);
    if (!n || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.document.getElementById(`ayah-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    select.value = '';
  }

  private updateActiveAyah(): void {
    const lineY = this.stickyHeaderVisible ? 200 : 168;
    let next = 1;
    const els = this.ayahElements;
    if (els?.length) {
      for (let i = 0; i < els.length; i++) {
        if (els[i].getBoundingClientRect().top <= lineY) {
          next = i + 1;
        }
      }
    } else {
      for (const v of this.verses) {
        const el = this.document.getElementById(`ayah-${v.ayah}`);
        if (el && el.getBoundingClientRect().top <= lineY) {
          next = v.ayah;
        }
      }
    }
    this.activeAyah = next;
  }

  private persist(key: string, value: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode / quota */
    }
  }
}
