import { Component, OnInit, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { UiLocaleService } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';

@Component({
    selector: 'app-not-found',
    imports: [RouterLink, UiTranslatePipe],
    templateUrl: './not-found.component.html',
    styleUrl: './not-found.component.scss'
})
export class NotFoundComponent implements OnInit {
  private readonly title = inject(Title);
  protected readonly ui = inject(UiLocaleService);

  ngOnInit(): void {
    this.title.setTitle(this.ui.translate('documentTitleNotFound'));
  }
}
