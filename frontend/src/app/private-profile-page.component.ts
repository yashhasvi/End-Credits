import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HomeNavigationComponent } from './home-navigation.component';
import { ProfileComponent } from './profile.component';
import { SessionService } from './session.service';

@Component({
  imports: [HomeNavigationComponent, ProfileComponent],
  template: `@if (session.user(); as user) { <main class="private-profile-page"><app-home-navigation [user]="user" [showShare]="true" (share)="openSharePanel()" (signOut)="signOut()"></app-home-navigation><app-profile [user]="user" [shareRequest]="shareRequests()"></app-profile></main> }`,
  styles: [`.private-profile-page{min-height:100svh;padding:clamp(28px,4vw,58px);background:radial-gradient(ellipse at 13% 30%,rgba(12,157,196,.14),transparent 32%),radial-gradient(ellipse at 89% 10%,rgba(137,73,227,.14),transparent 29%),#05070c;color:#f6fbff}.private-profile-page::before{content:"";position:fixed;inset:15px;border:1px solid rgba(198,232,250,.1);pointer-events:none}@media(max-width:700px){.private-profile-page{padding:25px 20px}}`],
})
export class PrivateProfilePageComponent {
  protected readonly session = inject(SessionService);
  private readonly router = inject(Router);
  protected readonly shareRequests = signal(0);

  protected openSharePanel(): void { this.shareRequests.update((request) => request + 1); }

  protected signOut(): void {
    this.session.signOut().subscribe({ next: () => this.router.navigateByUrl('/') });
  }
}
