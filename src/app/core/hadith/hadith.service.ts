import { Injectable, inject } from '@angular/core';
import { UiLocaleService, type UiLocaleCode } from '../ui/ui-locale.service';
import type { RelatedHadith, LocalizedString } from './hadith.types';
import { RELATED_HADITHS } from './related-hadiths.data';

@Injectable({ providedIn: 'root' })
export class HadithService {
  private readonly ui = inject(UiLocaleService);

  /**
   * Retrieves related hadiths specifically for a verse, or surah-level virtues.
   */
  getHadithsForVerse(surah: number, ayah?: number): readonly RelatedHadith[] {
    const list = RELATED_HADITHS.filter((h) => {
      if (h.surah !== surah) {
        return false;
      }
      if (ayah == null) {
        return true;
      }
      if (h.ayah == null) {
        return true;
      }
      if (h.ayahEnd != null) {
        return ayah >= h.ayah && ayah <= h.ayahEnd;
      }
      return h.ayah === ayah;
    });

    if (list.length > 0) {
      return list;
    }

    // Fallback: Check if there are any general virtues for this surah
    return RELATED_HADITHS.filter((h) => h.surah === surah);
  }

  /**
   * Gets all hadiths for a given surah.
   */
  getHadithsForSurah(surah: number): readonly RelatedHadith[] {
    return RELATED_HADITHS.filter((h) => h.surah === surah);
  }

  /**
   * Count of hadiths for a verse.
   */
  getHadithCountForVerse(surah: number, ayah: number): number {
    return this.getHadithsForVerse(surah, ayah).length;
  }

  pickLocalized(text: LocalizedString, locale?: UiLocaleCode): string {
    const code = locale ?? this.ui.locale();
    if (code === 'ur') {
      return text.ur || text.en;
    }
    if (code === 'ar') {
      return text.ar || text.en;
    }
    return text.en;
  }
}
