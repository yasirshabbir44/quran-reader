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
import type { QuranVerseRow } from '../core/quran/quran-data.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';
import { UiLocaleService } from '../core/ui/ui-locale.service';
import { QuoteImageContentBuilder } from '../core/verse-quote-image/quote-image-content.builder';
import { QuoteImageService } from '../core/verse-quote-image/quote-image.service';
import type { QuoteImageFormat, QuoteImageOptions } from '../core/verse-quote-image/quote-image.types';
import { QuoteExportActionsComponent } from './quote-export-actions/quote-export-actions.component';
import { QuoteFormatPickerComponent } from './quote-format-picker/quote-format-picker.component';
import { QuotePreviewComponent } from './quote-preview/quote-preview.component';
import { QuotePreviewService } from './quote-preview.service';
import { QuoteTranslationOptionsComponent } from './quote-translation-options/quote-translation-options.component';

@Component({
  selector: 'app-verse-quote-sheet',
  imports: [
    UiTranslatePipe,
    QuotePreviewComponent,
    QuoteFormatPickerComponent,
    QuoteTranslationOptionsComponent,
    QuoteExportActionsComponent,
  ],
  providers: [QuotePreviewService],
  templateUrl: './verse-quote-sheet.component.html',
  styleUrl: './verse-quote-sheet.component.scss',
})
export class VerseQuoteSheetComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly quoteImages = inject(QuoteImageService);
  private readonly contentBuilder = inject(QuoteImageContentBuilder);
  protected readonly preview = inject(QuotePreviewService);
  private readonly ui = inject(UiLocaleService);

  readonly verse = input.required<QuranVerseRow>();
  readonly surahNumber = input.required<number>();
  readonly surahNameAr = input.required<string>();
  readonly origin = input.required<string>();
  readonly showEnDefault = input(true);
  readonly showUrDefault = input(true);
  readonly formatUiNum = input.required<(n: number) => string>();

  readonly closed = output<void>();

  protected readonly format = signal<QuoteImageFormat>('instagram');
  protected readonly includeEn = signal(true);
  protected readonly includeUr = signal(true);
  protected readonly busy = signal(false);

  constructor() {
    effect(() => {
      this.verse();
      this.includeEn.set(this.showEnDefault());
      this.includeUr.set(this.showUrDefault());
    });

    effect(() => {
      this.verse();
      this.surahNumber();
      this.surahNameAr();
      this.origin();
      this.format();
      this.includeEn();
      this.includeUr();
      this.ui.locale();
      this.formatUiNum();
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      void this.preview.refresh(this.buildContent(), this.buildOptions());
    });

    this.destroyRef.onDestroy(() => this.preview.revoke());
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

  protected onIncludeEnChange(value: boolean): void {
    this.includeEn.set(value);
  }

  protected onIncludeUrChange(value: boolean): void {
    this.includeUr.set(value);
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

  protected ayahLabel(): string {
    return this.formatUiNum()(this.verse().ayah);
  }

  private buildContent() {
    return this.contentBuilder.build({
      verse: this.verse(),
      surahNumber: this.surahNumber(),
      surahNameAr: this.surahNameAr(),
      origin: this.origin(),
      formatUiNum: this.formatUiNum(),
    });
  }

  private buildOptions(): QuoteImageOptions {
    return {
      format: this.format(),
      includeEn: this.includeEn(),
      includeUr: this.includeUr(),
    };
  }
}
