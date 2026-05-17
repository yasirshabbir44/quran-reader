import { Component, input, output } from '@angular/core';
import { UiTranslatePipe } from '../../core/ui/ui-translate.pipe';

@Component({
  selector: 'app-quote-export-actions',
  imports: [UiTranslatePipe],
  templateUrl: './quote-export-actions.component.html',
  styleUrl: './quote-export-actions.component.scss',
})
export class QuoteExportActionsComponent {
  readonly busy = input(false);
  readonly disabled = input(false);
  readonly download = output<void>();
  readonly share = output<void>();
}
