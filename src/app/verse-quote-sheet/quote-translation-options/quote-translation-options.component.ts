import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiTranslatePipe } from '../../core/ui/ui-translate.pipe';

@Component({
  selector: 'app-quote-translation-options',
  imports: [FormsModule, UiTranslatePipe],
  templateUrl: './quote-translation-options.component.html',
  styleUrl: './quote-translation-options.component.scss',
})
export class QuoteTranslationOptionsComponent {
  readonly includeEn = input(true);
  readonly includeUr = input(true);
  readonly includeEnChange = output<boolean>();
  readonly includeUrChange = output<boolean>();

  protected onIncludeEnChange(checked: boolean): void {
    this.includeEnChange.emit(checked);
    if (!checked && !this.includeUr()) {
      this.includeUrChange.emit(true);
    }
  }

  protected onIncludeUrChange(checked: boolean): void {
    this.includeUrChange.emit(checked);
    if (!checked && !this.includeEn()) {
      this.includeEnChange.emit(true);
    }
  }
}
