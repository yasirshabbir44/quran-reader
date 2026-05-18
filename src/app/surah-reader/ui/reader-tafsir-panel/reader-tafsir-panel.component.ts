import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { ReaderDisplayVerse } from '../../models/reader-display-verse.model';
import { TAFSIR_BLOCK_LABEL_KEYS, type TafsirBlockType } from '../../../core/tafsir/tafsir-text';
import { UiLocaleService } from '../../../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../../../core/ui/ui-translate.pipe';
import { ReaderTafsirPanelService } from '../../services/panels/reader-tafsir-panel.service';

/** Presentational tafsir body; state lives in {@link ReaderTafsirPanelService}. */
@Component({
  selector: 'app-reader-tafsir-panel',
  imports: [FormsModule, UiTranslatePipe],
  templateUrl: './reader-tafsir-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReaderTafsirPanelComponent {
  protected readonly ui = inject(UiLocaleService);
  protected readonly tafsir = inject(ReaderTafsirPanelService);

  readonly verse = input.required<ReaderDisplayVerse>();
  readonly editionId = input.required<string>();
  readonly accordion = input(false);
  readonly formatUiNum = input.required<(n: number) => string>();

  protected tafsirBlockLabelKey(type: TafsirBlockType): string {
    return TAFSIR_BLOCK_LABEL_KEYS[type];
  }

  protected onEditionChange(slug: string): void {
    const v = this.verse();
    this.tafsir.onEditionChange(slug, { surah: v.surah, ayah: v.ayah });
  }

  protected retry(): void {
    const v = this.verse();
    this.tafsir.retry({ surah: v.surah, ayah: v.ayah });
  }
}
