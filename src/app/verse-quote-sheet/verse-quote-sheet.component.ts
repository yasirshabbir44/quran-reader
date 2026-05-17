import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { QuranVerseRow } from '../core/quran/quran-data.service';
import { buildVerseDeepLink } from '../core/routing/verse-deep-link.util';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';
import { UiLocaleService } from '../core/ui/ui-locale.service';
import { normalizeVerseTranslations } from '../core/verse-presentation/verse-presentation.strategy';
import { QuoteImageService } from '../core/verse-quote-image/quote-image.service';
import {
  QUOTE_IMAGE_FORMATS,
  type QuoteImageContent,
  type QuoteImageFormat,
  type QuoteImageOptions,
} from '../core/verse-quote-image/quote-image.types';

@Component({
  selector: 'app-verse-quote-sheet',
  imports: [FormsModule, UiTranslatePipe],
  templateUrl: './verse-quote-sheet.component.html',
  styleUrl: './verse-quote-sheet.component.scss',
})
export class VerseQuoteSheetComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly quoteImages = inject(QuoteImageService);
  private readonly ui = inject(UiLocaleService);

  readonly verse = input.required<QuranVerseRow>();
  readonly surahNumber = input.required<number>();
  readonly surahNameAr = input.required<string>();
  readonly origin = input.required<string>();
  readonly showEnDefault = input(true);
  readonly showUrDefault = input(true);
  readonly formatUiNum = input.required<(n: number) => string>();

  readonly closed = output<void>();

  protected readonly formats = QUOTE_IMAGE_FORMATS;
  protected readonly format = signal<QuoteImageFormat>('instagram');
  protected readonly includeEn = signal(true);
  protected readonly includeUr = signal(true);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly generating = signal(false);
  protected readonly busy = signal(false);

  private renderGeneration = 0;
  private lastObjectUrl: string | null = null;

  constructor() {
    effect(() => {
      this.verse();
      this.includeEn.set(this.showEnDefault());
      this.includeUr.set(this.showUrDefault());
    });

    effect(() => {
      this.verse();
      this.surahNumber();
      this.format();
      this.includeEn();
      this.includeUr();
      this.ui.locale();
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      void this.refreshPreview();
    });

    this.destroyRef.onDestroy(() => this.revokePreviewUrl());
  }

  protected close(): void {
    this.closed.emit();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  protected setFormat(format: QuoteImageFormat): void {
    this.format.set(format);
  }

  protected onIncludeEnChange(checked: boolean): void {
    this.includeEn.set(checked);
    if (!checked && !this.includeUr()) {
      this.includeUr.set(true);
    }
  }

  protected onIncludeUrChange(checked: boolean): void {
    this.includeUr.set(checked);
    if (!checked && !this.includeEn()) {
      this.includeEn.set(true);
    }
  }

  protected async downloadImage(): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    try {
      await this.quoteImages.download(this.buildContent(), this.buildOptions());
    } finally {
      this.busy.set(false);
    }
  }

  protected async shareImage(): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    try {
      const ref = `${this.surahNameAr()} ${this.formatUiNum()(this.surahNumber())}:${this.formatUiNum()(this.verse().ayah)}`;
      await this.quoteImages.share(this.buildContent(), this.buildOptions(), ref);
    } finally {
      this.busy.set(false);
    }
  }

  private buildContent(): QuoteImageContent {
    const v = this.verse();
    const tr = normalizeVerseTranslations(v);
    return {
      arabic: v.ar,
      translationEn: tr.en,
      translationUr: tr.ur,
      surahNameAr: this.surahNameAr(),
      surahNumber: this.surahNumber(),
      ayah: v.ayah,
      siteLabel: this.ui.translate('documentTitle'),
      deepLink: buildVerseDeepLink(this.origin(), this.surahNumber(), v.ayah),
      formatUiNum: this.formatUiNum(),
    };
  }

  private buildOptions(): QuoteImageOptions {
    return {
      format: this.format(),
      includeEn: this.includeEn(),
      includeUr: this.includeUr(),
    };
  }

  private async refreshPreview(): Promise<void> {
    const generation = ++this.renderGeneration;
    this.generating.set(true);
    const url = await this.quoteImages.renderToObjectUrl(this.buildContent(), this.buildOptions());
    if (generation !== this.renderGeneration) {
      if (url) {
        URL.revokeObjectURL(url);
      }
      return;
    }
    this.revokePreviewUrl();
    this.lastObjectUrl = url;
    this.previewUrl.set(url);
    this.generating.set(false);
  }

  private revokePreviewUrl(): void {
    if (this.lastObjectUrl) {
      URL.revokeObjectURL(this.lastObjectUrl);
      this.lastObjectUrl = null;
    }
    this.previewUrl.set(null);
  }
}
