import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ReaderDisplayVerse } from '../../models/reader-display-verse.model';
import {
  TAFSIR_BLOCK_LABEL_KEYS,
  isHadithParagraph,
  type TafsirBlockType,
} from '../../../core/tafsir/tafsir-text';
import { UiLocaleService } from '../../../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../../../core/ui/ui-translate.pipe';
import {
  ReaderTafsirPanelService,
  type TafsirPanelTab,
} from '../../services/panels/reader-tafsir-panel.service';
import { HadithService } from '../../../core/hadith/hadith.service';
import type { TafsirLanguageCode } from '../../../core/tafsir/tafsir-editions';

/**
 * Rich, multifaceted Tafsir panel presenting classical scholarly commentary,
 * authentic related Hadiths, and Occasions of Revelation (Asbab al-Nuzul).
 */
@Component({
  selector: 'app-reader-tafsir-panel',
  imports: [FormsModule, UiTranslatePipe],
  templateUrl: './reader-tafsir-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReaderTafsirPanelComponent {
  protected readonly ui = inject(UiLocaleService);
  protected readonly tafsir = inject(ReaderTafsirPanelService);
  protected readonly hadithService = inject(HadithService);

  readonly verse = input.required<ReaderDisplayVerse>();
  readonly editionId = input.required<string>();
  readonly accordion = input(false);
  readonly formatUiNum = input.required<(n: number) => string>();

  readonly availableLanguages: readonly {
    code: TafsirLanguageCode;
    labelKey: string;
    flag: string;
  }[] = [
    { code: 'ur', labelKey: 'tafsirLangUrdu', flag: '🇵🇰' },
    { code: 'en', labelKey: 'tafsirLangEnglish', flag: '🇬🇧' },
    { code: 'ar', labelKey: 'tafsirLangArabic', flag: '🇸🇦' },
  ];

  protected tafsirBlockLabelKey(type: TafsirBlockType): string {
    return TAFSIR_BLOCK_LABEL_KEYS[type] ?? 'tafsirBlockMeaning';
  }

  protected tafsirBlockIcon(type: TafsirBlockType): string {
    switch (type) {
      case 'meaning':
        return '📖';
      case 'hadith':
        return '📜';
      case 'context':
        return '🏛️';
      case 'historical':
        return '⏳';
      case 'lessons':
        return '⚖️';
      case 'reflection':
        return '✨';
      default:
        return '📖';
    }
  }

  protected isHadith(text: string): boolean {
    return isHadithParagraph(text);
  }

  protected onLanguageChange(lang: TafsirLanguageCode): void {
    this.tafsir.setLanguage(lang);
  }

  protected onEditionChange(slug: string): void {
    const v = this.verse();
    this.tafsir.onEditionChange(slug, { surah: v.surah, ayah: v.ayah });
  }

  protected setTab(tab: TafsirPanelTab): void {
    this.tafsir.setTab(tab);
  }

  protected setFilter(filter: string): void {
    this.tafsir.setBlockFilter(filter);
  }

  protected increaseFont(): void {
    this.tafsir.increaseFontSize();
  }

  protected decreaseFont(): void {
    this.tafsir.decreaseFontSize();
  }

  protected copyText(): void {
    this.tafsir.copyTafsirText();
  }

  protected retry(): void {
    const v = this.verse();
    this.tafsir.retry({ surah: v.surah, ayah: v.ayah });
  }
}
