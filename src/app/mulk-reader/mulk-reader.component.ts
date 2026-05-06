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
type ReaderMode = 'verse-by-verse' | 'reading';

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

  protected readonly font = signal<ReaderFont>('m');
  protected readonly line = signal<ReaderLine>('normal');
  protected readonly width = signal<ReaderWidth>('medium');
  protected readonly readingMode = signal<ReaderMode>('verse-by-verse');
  protected readonly showTranslationEn = signal(true);
  protected readonly showTranslationUr = signal(true);
  protected settingsOpen = false;

  protected scrollProgress = 0;
  protected stickyHeaderVisible = false;
  protected scrollTopVisible = false;
  protected activeAyah = 1;
  protected jumpAyahModel = '';
  protected copiedAyah: number | null = null;

  private scrollRaf = 0;
  private ayahElements: (HTMLElement | null)[] | null = null;
  private pendingStartAyah: number | null = 1;

  constructor() {
    const corpus$ = this.quranData.load().pipe(
      catchError(() => {
        this.corpusError.set(true);
        return of(null as QuranFullPayload | null);
      }),
      finalize(() => this.corpusLoading.set(false)),
    );

    combineLatest([corpus$, this.route.paramMap, this.route.queryParamMap])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(([payload]) => {
          if (payload === null) {
            this.syncDocumentTitle();
          }
        }),
        filter(([payload]) => payload !== null),
        map(([payload, pm, qm]) => ({ payload: payload as QuranFullPayload, pm, qm })),
      )
      .subscribe(({ payload, pm, qm }) => {
        this.surahList.set(payload.surahs.map((s) => ({ number: s.number, nameAr: s.nameAr })));
        const raw = Number(pm.get('n'));
        const n = Number.isFinite(raw) && raw >= 1 && raw <= 114 ? Math.floor(raw) : 67;
        const startingVerseRaw = Number(qm.get('startingVerse'));
        this.pendingStartAyah =
          Number.isFinite(startingVerseRaw) && startingVerseRaw >= 1 ? Math.floor(startingVerseRaw) : 1;
        const queryMode = qm.get('readingMode') === 'reading' ? 'reading' : 'verse-by-verse';
        this.readingMode.set(queryMode);
        const translationState = this.parseTranslationSelection(qm.get('translations'));
        this.showTranslationEn.set(translationState.en);
        this.showTranslationUr.set(translationState.ur);
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
    this.font.set(this.readSetting(LS_FONT, FONT_OPTIONS, this.font()));
    this.line.set(this.readSetting(LS_LINE, LINE_OPTIONS, this.line()));
    this.width.set(this.readSetting(LS_WIDTH, WIDTH_OPTIONS, this.width()));
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

  protected toggleSettingsPanel(): void {
    this.settingsOpen = !this.settingsOpen;
  }

  protected closeSettingsPanel(): void {
    this.settingsOpen = false;
  }

  protected setReadingMode(mode: ReaderMode): void {
    this.readingMode.set(mode);
    this.updateReaderQueryParams();
  }

  protected onTranslationToggle(key: 'en' | 'ur', checked: boolean): void {
    if (key === 'en') {
      this.showTranslationEn.set(checked);
    } else {
      this.showTranslationUr.set(checked);
    }
    if (!this.showTranslationEn() && !this.showTranslationUr()) {
      if (key === 'en') {
        this.showTranslationUr.set(true);
      } else {
        this.showTranslationEn.set(true);
      }
    }
    this.updateReaderQueryParams();
  }

  protected showTranslations(): boolean {
    return this.readingMode() === 'verse-by-verse' && (this.showTranslationEn() || this.showTranslationUr());
  }

  protected resetReaderViewSettings(): void {
    this.readingMode.set('verse-by-verse');
    this.showTranslationEn.set(true);
    this.showTranslationUr.set(true);
    this.updateReaderQueryParams();
  }

  protected setFont(f: ReaderFont): void {
    this.font.set(f);
    this.persist(LS_FONT, f);
  }

  protected setLine(l: ReaderLine): void {
    this.line.set(l);
    this.persist(LS_LINE, l);
  }

  protected setWidth(w: ReaderWidth): void {
    this.width.set(w);
    this.persist(LS_WIDTH, w);
  }

  protected verseTr(v: QuranVerseRow): { en: string; ur: string } {
    return {
      en: v.en.replace(/\s+-\s*$/, '').trim(),
      ur: v.ur.trim(),
    };
  }

  protected introSummary(): string {
    const s = this.surah();
    if (!s) {
      return '';
    }
    if (this.isMulk()) {
      return this.mulkMeta.themes;
    }
    return this.ui.translate('surahIntroGeneric', {
      name: s.nameAr,
      translit: s.nameTranslit,
      num: this.formatUiNum(s.number),
      verses: this.formatUiNum(s.versesCount),
      type: this.ui.translate(s.revelationType === 'meccan' ? 'factTypeMeccan' : 'factTypeMedinan'),
    });
  }

  protected jumpToAyah(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const n = Number(select.value || this.jumpAyahModel);
    if (!n || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.scrollToAyah(n);
    this.jumpAyahModel = '';
    select.value = '';
  }

  protected copyAyah(v: QuranVerseRow): void {
    if (!isPlatformBrowser(this.platformId) || !navigator.clipboard?.writeText) {
      return;
    }
    const text = `${v.ar}\n\n${this.verseTr(v).en}\n\n${this.verseTr(v).ur}\n\n${this.surah()?.nameAr ?? ''} ${this.formatUiNum(this.surahNumber())}:${this.formatUiNum(v.ayah)}`;
    void navigator.clipboard.writeText(text).then(() => {
      this.copiedAyah = v.ayah;
      setTimeout(() => {
        if (this.copiedAyah === v.ayah) {
          this.copiedAyah = null;
        }
      }, 1600);
    });
  }

  protected shareAyah(v: QuranVerseRow): void {
    if (!isPlatformBrowser(this.platformId) || !('share' in navigator)) {
      return;
    }
    const sharePayload = {
      title: `${this.surah()?.nameAr ?? 'Quran'} ${v.ayah}`,
      text: `${v.ar}\n\n${this.verseTr(v).en}\n\n${this.surah()?.nameAr ?? ''} ${this.formatUiNum(this.surahNumber())}:${this.formatUiNum(v.ayah)}`,
      url: `${this.document.location.origin}/surah/${this.surahNumber()}?startingVerse=${v.ayah}`,
    };
    void (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share(sharePayload);
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
    if (this.pendingStartAyah !== null) {
      const safeAyah = Math.min(Math.max(this.pendingStartAyah, 1), list.length || 1);
      this.scrollToAyah(safeAyah, false);
      this.activeAyah = safeAyah;
      this.pendingStartAyah = null;
    }
    this.updateActiveAyah();
  }

  private scrollToAyah(ayah: number, smooth = true): void {
    this.document.getElementById(`ayah-${ayah}`)?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'start',
    });
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

  private parseTranslationSelection(raw: string | null): { en: boolean; ur: boolean } {
    if (!raw) {
      return { en: true, ur: true };
    }
    const tokens = raw
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    if (!tokens.length) {
      return { en: true, ur: true };
    }
    const en = tokens.includes('131') || tokens.includes('en');
    const ur = tokens.includes('95') || tokens.includes('ur');
    if (!en && !ur) {
      return { en: true, ur: true };
    }
    return { en, ur };
  }

  private updateReaderQueryParams(): void {
    const translations: string[] = [];
    if (this.showTranslationEn()) {
      translations.push('131');
    }
    if (this.showTranslationUr()) {
      translations.push('95');
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        readingMode: this.readingMode(),
        translations: translations.join(','),
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
