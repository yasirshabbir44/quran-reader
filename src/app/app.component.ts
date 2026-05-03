import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Analytics } from "@vercel/analytics/next"

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {}
