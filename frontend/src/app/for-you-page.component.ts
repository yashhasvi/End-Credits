import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HomeComponent } from './home.component';
import { SessionService } from './session.service';

@Component({
  imports: [HomeComponent],
  template: `@if (session.user(); as user) { <app-home [user]="user" (signOut)="signOut()"></app-home> }`,
})
export class ForYouPageComponent {
  protected readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected signOut(): void {
    this.session.signOut().subscribe({ next: () => this.router.navigateByUrl('/') });
  }
}
