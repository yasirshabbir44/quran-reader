import { DOCUMENT, isPlatformBrowser, NgClass } from '@angular/common';
import { afterNextRender, Component, HostListener, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { UiLocaleService, type UiLocaleCode } from '../core/ui-locale.service';
import { UiTranslatePipe } from '../core/ui-translate.pipe';
import { SURAH_MULK_META } from '../data/surah-mulk-meta';
import { MULK_VERSE_TRANSLATION_BY_AYAH } from '../data/surah-mulk-translations';
import { SURAH_MULK_VERSES } from '../data/surah-mulk';

const LS_FONT = 'surah-reader-font';
const LS_LINE = 'surah-reader-line';
const LS_WIDTH = 'surah-reader-width';

type ReaderFont = 's' | 'm' | 'l' | 'xl';
type ReaderLine = 'normal' | 'relaxed' | 'loose';
type ReaderWidth = 'narrow' | 'medium' | 'wide';
type ReaderSetting = ReaderFont | ReaderLine | ReaderWidth;

const FONT_OPTIONS: readonly ReaderFont[] = ['s', 'm', 'l', 'xl'];
const LINE_OPTIONS: readonly ReaderLine[] = ['normal', 'relaxed', 'loose'];
const WIDTH_OPTIONS: readonly ReaderWidth[] = ['narrow', 'medium', 'wide'];

@Component({
  selector: 'app-surah-reader',
  standalone: true,
  imports: [NgClass, FormsModule, UiTranslatePipe],
  templateUrl: './mulk-reader.component.html',
  styleUrl: './mulk-reader.component.scss',
})
export class SurahReaderComponent implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly title = inject(Title);
  protected readonly ui = inject(UiLocaleService);

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
  private ayahElements: (HTMLElement | null)[] | null = null;

  constructor() {
    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      this.ayahElements = this.verses.map((v) => this.document.getElementById(`ayah-${v.ayah}`));
      this.updateActiveAyah();
    });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.font = this.readSetting(LS_FONT, FONT_OPTIONS, this.font);
    this.line = this.readSetting(LS_LINE, LINE_OPTIONS, this.line);
    this.width = this.readSetting(LS_WIDTH, WIDTH_OPTIONS, this.width);
    this.syncDocumentTitle();
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

  protected onLocaleModelChange(value: string): void {
    if (value === 'en' || value === 'ar' || value === 'ur') {
      this.ui.setLocale(value as UiLocaleCode);
      this.syncDocumentTitle();
    }
  }

  protected scrollToTop(): void {
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected formatUiNum(n: number): string {
    this.ui.locale();
    return n.toLocaleString(this.ui.numberLocaleTag());
  }

  private syncDocumentTitle(): void {
    this.title.setTitle(this.ui.translate('documentTitle'));
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

  protected verseTr(ayah: number): { en: string; ur: string } | undefined {
    const t = MULK_VERSE_TRANSLATION_BY_AYAH[ayah];
    if (!t) {
      return undefined;
    }
    return {
      en: t.en.replace(/\s+-\s*$/, '').trim(),
      ur: t.ur.trim(),
    };
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
        const el = els[i];
        const verse = this.verses[i];
        if (el && verse && el.getBoundingClientRect().top <= lineY) {
          next = verse.ayah;
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

  private readSetting<T extends ReaderSetting>(key: string, allowed: readonly T[], fallback: T): T {
    try {
      const value = localStorage.getItem(key);
      if (value && this.isAllowedOption(value, allowed)) {
        return value;
      }
    } catch {
      /* ignore localStorage access errors */
    }
    return fallback;
  }

  private isAllowedOption<T extends string>(value: string, allowed: readonly T[]): value is T {
    return allowed.includes(value as T);
  }
}
