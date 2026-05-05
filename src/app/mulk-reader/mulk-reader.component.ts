import { DOCUMENT, isPlatformBrowser, NgClass } from '@angular/common';
import {
  afterNextRender,
  Component,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, combineLatest, filter, finalize, map, of, tap } from 'rxjs';
import { UiLocaleService, type UiLocaleCode } from '../core/ui-locale.service';
import { UiTranslatePipe } from '../core/ui-translate.pipe';
import {
  QuranDataService,
  type QuranFullPayload,
  type QuranSurahPayload,
  type QuranVerseRow,
} from '../core/quran-data.service';
import { SURAH_MULK_META } from '../data/surah-mulk-meta';

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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly quranData = inject(QuranDataService);
  protected readonly ui = inject(UiLocaleService);

  protected readonly mulkMeta = SURAH_MULK_META;
  protected readonly corpusLoading = signal(true);
  protected readonly corpusError = signal(false);
  protected readonly surahNumber = signal(67);
  protected readonly surah = signal<QuranSurahPayload | null>(null);
  protected readonly surahList = signal<readonly { number: number; nameAr: string }[]>([]);

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
    const corpus$ = this.quranData.load().pipe(
      catchError(() => {
        this.corpusError.set(true);
        return of(null as QuranFullPayload | null);
      }),
      finalize(() => this.corpusLoading.set(false)),
    );

    combineLatest([corpus$, this.route.paramMap])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(([payload]) => {
          if (payload === null) {
            this.syncDocumentTitle();
          }
        }),
        filter(([payload]) => payload !== null),
        map(([payload, pm]) => ({ payload: payload as QuranFullPayload, pm })),
      )
      .subscribe(({ payload, pm }) => {
        this.surahList.set(payload.surahs.map((s) => ({ number: s.number, nameAr: s.nameAr })));
        const raw = Number(pm.get('n'));
        const n = Number.isFinite(raw) && raw >= 1 && raw <= 114 ? Math.floor(raw) : 67;
        if (n !== raw) {
          void this.router.navigate(['/surah', n], { replaceUrl: true });
          return;
        }
        this.applySurah(n, payload);
      });

    afterNextRender(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      this.bindAyahElements();
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

  protected isMulk(): boolean {
    return this.surahNumber() === 67;
  }

  protected verses(): readonly QuranVerseRow[] {
    return this.surah()?.verses ?? [];
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

  protected onSurahModelChange(value: string | number): void {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n) || n < 1 || n > 114 || n === this.surahNumber()) {
      return;
    }
    void this.router.navigate(['/surah', n]);
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

  protected verseTr(v: QuranVerseRow): { en: string; ur: string } {
    return {
      en: v.en.replace(/\s+-\s*$/, '').trim(),
      ur: v.ur.trim(),
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

  private applySurah(n: number, payload: { surahs: readonly QuranSurahPayload[] }): void {
    const s = payload.surahs[n - 1] ?? null;
    this.surahNumber.set(n);
    this.surah.set(s);
    this.activeAyah = 1;
    this.syncDocumentTitle();
    if (isPlatformBrowser(this.platformId)) {
      this.document.defaultView?.scrollTo({ top: 0, behavior: 'auto' });
    }
    queueMicrotask(() => this.bindAyahElements());
  }

  private bindAyahElements(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const list = this.verses();
    this.ayahElements = list.map((v) => this.document.getElementById(`ayah-${v.ayah}`));
    this.updateActiveAyah();
  }

  private updateActiveAyah(): void {
    const lineY = this.stickyHeaderVisible ? 200 : 168;
    let next = 1;
    const list = this.verses();
    const els = this.ayahElements;
    if (els?.length && els.length === list.length) {
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        const verse = list[i];
        if (el && verse && el.getBoundingClientRect().top <= lineY) {
          next = verse.ayah;
        }
      }
    } else {
      for (const v of list) {
        const el = this.document.getElementById(`ayah-${v.ayah}`);
        if (el && el.getBoundingClientRect().top <= lineY) {
          next = v.ayah;
        }
      }
    }
    this.activeAyah = next;
  }

  private syncDocumentTitle(): void {
    const s = this.surah();
    if (s) {
      this.title.setTitle(
        this.ui.translate('documentTitleSurah', { name: s.nameAr, num: this.formatUiNum(s.number) }),
      );
    } else if (this.corpusError()) {
      this.title.setTitle(this.ui.translate('documentTitleError'));
    } else {
      this.title.setTitle(this.ui.translate('documentTitle'));
    }
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
