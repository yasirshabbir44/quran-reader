import { Pipe, PipeTransform, inject } from '@angular/core';
import { UiLocaleService } from './ui-locale.service';

@Pipe({
  name: 'uiTranslate',
  standalone: true,
  pure: false,
})
export class UiTranslatePipe implements PipeTransform {
  private readonly ui = inject(UiLocaleService);

  transform(key: string, params?: Record<string, string | number>): string {
    this.ui.locale();
    return this.ui.translate(key, params);
  }
}
