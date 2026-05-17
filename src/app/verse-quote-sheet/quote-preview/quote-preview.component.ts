import { Component, input } from '@angular/core';
import type { QuoteImageFormat } from '../../core/verse-quote-image/quote-image.types';
import { UiTranslatePipe } from '../../core/ui/ui-translate.pipe';

@Component({
  selector: 'app-quote-preview',
  imports: [UiTranslatePipe],
  templateUrl: './quote-preview.component.html',
  styleUrl: './quote-preview.component.scss',
})
export class QuotePreviewComponent {
  readonly previewUrl = input<string | null>(null);
  readonly generating = input(false);
  readonly format = input.required<QuoteImageFormat>();
  readonly ayahLabel = input.required<string>();
}
