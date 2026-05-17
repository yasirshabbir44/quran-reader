import { Component, input, output } from '@angular/core';
import {
  QUOTE_IMAGE_FORMATS,
  type QuoteImageFormat,
} from '../../core/verse-quote-image/quote-image.types';
import { UiTranslatePipe } from '../../core/ui/ui-translate.pipe';

@Component({
  selector: 'app-quote-format-picker',
  imports: [UiTranslatePipe],
  templateUrl: './quote-format-picker.component.html',
  styleUrl: './quote-format-picker.component.scss',
})
export class QuoteFormatPickerComponent {
  readonly formats = QUOTE_IMAGE_FORMATS;
  readonly selected = input.required<QuoteImageFormat>();
  readonly selectedChange = output<QuoteImageFormat>();

  protected pick(format: QuoteImageFormat): void {
    this.selectedChange.emit(format);
  }
}
