import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { buildQuranStudyLinks } from '../../../core/word-study/quran-study-links.util';
import type { ReaderDisplayVerse } from '../../models/reader-display-verse.model';
import { UiTranslatePipe } from '../../../core/ui/ui-translate.pipe';
import { ReaderWordStudyPanelService } from '../../services/panels/reader-word-study-panel.service';

/** Word-by-word breakdown and links to external grammar tools. */
@Component({
  selector: 'app-reader-word-study-panel',
  imports: [UiTranslatePipe],
  templateUrl: './reader-word-study-panel.component.html',
  styleUrl: './reader-word-study-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.verses__word-study-panel--sheet]': 'presentation() === "sheet"',
  },
})
export class ReaderWordStudyPanelComponent {
  protected readonly wordStudy = inject(ReaderWordStudyPanelService);

  readonly verse = input.required<ReaderDisplayVerse>();
  readonly formatUiNum = input.required<(n: number) => string>();
  readonly presentation = input<'inline' | 'sheet'>('inline');

  protected readonly links = computed(() => {
    const v = this.verse();
    return buildQuranStudyLinks(v.surah, v.ayah);
  });

  protected retry(): void {
    const v = this.verse();
    this.wordStudy.retry({ surah: v.surah, ayah: v.ayah });
  }
}
