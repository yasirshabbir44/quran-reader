import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../core/seo/seo.service';
import { UiLocaleService } from '../core/ui/ui-locale.service';
import { UiTranslatePipe } from '../core/ui/ui-translate.pipe';

@Component({
    selector: 'app-not-found',
    imports: [RouterLink, UiTranslatePipe],
    templateUrl: './not-found.component.html',
    styleUrl: './not-found.component.scss'
})
export class NotFoundComponent implements OnInit {
  private readonly seo = inject(SeoService);
  protected readonly ui = inject(UiLocaleService);

  ngOnInit(): void {
    this.seo.apply({
      title: this.ui.translate('documentTitleNotFound'),
      description: this.ui.translate('seoNotFoundDescription'),
      path: '/404',
      noindex: true,
    });
  }
}
