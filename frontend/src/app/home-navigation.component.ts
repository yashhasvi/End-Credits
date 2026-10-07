import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CurrentUser } from './auth/auth.service';

@Component({
  selector: 'app-home-navigation',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="navigation">
      <a class="wordmark" routerLink="/">END CREDITS</a>
      <nav aria-label="Primary navigation"><a routerLink="/" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">FOR YOU</a><a routerLink="/discover" routerLinkActive="is-active">DISCOVER</a><span title="Circles arrives in a future phase">CIRCLES</span><span title="Movie Passport arrives in a future phase">MOVIE PASSPORT</span><a routerLink="/profile" routerLinkActive="is-active">PROFILE</a></nav>
      <div class="member-tools"><span class="avatar" [title]="user.username">{{ user.username.slice(0, 1).toUpperCase() }}</span>@if (showShare) { <button class="share-button" type="button" (click)="share.emit()" aria-label="Open profile sharing and visibility controls" title="Share profile"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M5 9v10h10"/></svg><span>SHARE</span></button> }<button type="button" (click)="signOut.emit()">SIGN OUT</button></div>
    </header>
  `,
  styles: [`
    :host{display:block}.navigation{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:clamp(18px,2vw,30px);max-width:var(--content-max);margin:0 auto}.wordmark{color:#f5fbff;font:900 clamp(1.18rem,1.45vw,1.5rem)/1 var(--display);letter-spacing:-.07em;text-decoration:none}.navigation nav{display:flex;align-items:center;justify-content:center;gap:clamp(15px,1.8vw,28px)}.navigation nav a,.navigation nav span,.member-tools button{border:0;padding:0;background:transparent;color:#bacbd5;font:800 var(--type-meta)/1.1 var(--body);letter-spacing:.07em;text-decoration:none;white-space:nowrap}.navigation nav a{position:relative}.navigation nav a::after{content:"";position:absolute;right:0;bottom:-7px;left:0;height:1px;background:#bdefff;transform:scaleX(0);transform-origin:right;transition:transform .25s}.navigation nav a:hover,.navigation nav .is-active{color:#eefaff}.navigation nav a:hover::after,.navigation nav .is-active::after{transform:scaleX(1);transform-origin:left}.navigation nav span{opacity:.5}.member-tools{justify-self:end;display:flex;align-items:center;gap:13px}.avatar{display:grid;place-items:center;width:32px;height:32px;border:1px solid rgba(211,241,255,.55);border-radius:50%;background:linear-gradient(145deg,rgba(121,220,246,.45),rgba(136,90,228,.48));color:#f7fbff;font:800 .82rem/1 var(--body)}.member-tools button{color:#eefaff;border-bottom:1px solid rgba(215,243,255,.6);padding-bottom:3px;cursor:pointer}.member-tools button:hover{color:#97eaff;border-color:#97eaff}.member-tools .share-button{display:inline-flex;align-items:center;gap:6px;border-bottom:0;padding:6px;color:#d8f5ff}.share-button svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.6}.share-button:hover{background:rgba(165,225,244,.1)}@media(max-width:1100px){.navigation{grid-template-columns:1fr auto;row-gap:19px}.navigation nav{grid-column:1/-1;grid-row:2;justify-content:flex-start;overflow-x:auto;padding:2px 0 7px;scrollbar-width:thin}.navigation nav::-webkit-scrollbar{height:3px}.navigation nav::-webkit-scrollbar-thumb{background:rgba(189,239,255,.38)}}@media(max-width:600px){.navigation{gap:14px;row-gap:16px}.wordmark{font-size:1.18rem}.member-tools{gap:10px}.member-tools button{display:none}.member-tools .share-button{display:inline-flex;padding:5px}.share-button span{display:none}.navigation nav{gap:20px}.navigation nav a,.navigation nav span{font-size:.73rem}.avatar{width:30px;height:30px}}
  `],
})
export class HomeNavigationComponent {
  @Input({ required: true }) user!: CurrentUser;
  @Input() showShare = false;
  @Output() signOut = new EventEmitter<void>();
  @Output() share = new EventEmitter<void>();
}
