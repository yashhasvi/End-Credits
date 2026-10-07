import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { MovieSearchService } from './movie-search.service';
import { PublicProfile, PublicProfileMovie, PublicProfileService } from './public-profile.service';

@Component({
  imports: [DatePipe, RouterLink],
  template: `
    <main class="public-profile-page">
      <header class="public-navigation"><a routerLink="/">END CREDITS</a><span>PUBLIC CINEMA PROFILE</span></header>

      @if (isLoading()) {
        <section class="public-loading"><p>OPENING THE ARCHIVE…</p></section>
      } @else if (profile(); as profile) {
        <section class="public-hero" aria-labelledby="public-profile-title">
          <div class="public-hero-top"><p>EC / CINEMA IDENTITY</p><span>PUBLIC EDITION / 2026</span></div>
          <div class="public-identity"><h1 id="public-profile-title">{{ profile.username.toUpperCase() }}</h1><p>FILMS THAT<br>STAYED<br>WITH ME.</p></div>
          <div class="public-hero-bottom"><p>AN END CREDITS<br>CINEMA PUBLICATION.</p><div class="public-counts" aria-label="Cinema totals"><p><strong>{{ watched().length }}</strong><span>WATCHED</span></p><p><strong>{{ watching().length }}</strong><span>NOW PLAYING</span></p><p><strong>{{ watchlist().length }}</strong><span>WATCHLIST</span></p></div><p class="public-enter">ENTER THE ARCHIVE <span>↓</span></p></div>
        </section>

        @if (profile.myFive.length) {
          <section class="public-section public-my-five" aria-labelledby="public-my-five-title">
            <header><p>FIVE FILMS / ONE CINEMA IDENTITY</p><h2 id="public-my-five-title">MY FIVE</h2><span>{{ profile.myFive.length }} FILMS</span></header>
            <p class="public-my-five-intro">THE FIVE FILMS<br>I'D LEAVE BEHIND.</p>
            <div class="public-my-five-reel" aria-label="{{ profile.username }}'s five defining films"><div class="public-reel-track">@for (movie of profile.myFive; track movie.tmdbId; let index = $index) { <article class="public-reel-frame" [style.--order]="index"><span>FRAME / 0{{ index + 1 }}</span><button type="button" class="public-poster" (click)="openMovie(movie)" [attr.aria-label]="'Open ' + movie.title">@if (posterUrl(movie)) { <img [src]="posterUrl(movie)!" [alt]="'Poster for ' + movie.title" loading="lazy" /> } @else { <div>NO<br>POSTER</div> }</button><div class="public-movie-detail"><p>{{ releaseYear(movie) }}</p><h3>{{ movie.title }}</h3>@if (movie.rating) { <small>RATED / {{ movie.rating }} OF 10</small> }</div></article> }</div><p class="public-reel-hint">01—05 <span>SCROLL REEL →</span></p></div>
          </section>
        }

        <section class="public-section public-now-playing" aria-labelledby="public-now-playing-title">
          <header><p>CURRENTLY IN {{ profile.username.toUpperCase() }}'S CINEMA</p><h2 id="public-now-playing-title">NOW PLAYING</h2><span>{{ watching().length }} FILMS</span></header>
          @if (watching().length) { <div class="public-featured-rail" [class.is-solo]="watching().length === 1">@for (movie of watching(); track movie.tmdbId; let index = $index) { <article [style.--order]="index"><button type="button" class="public-poster" (click)="openMovie(movie)" [attr.aria-label]="'Open ' + movie.title">@if (posterUrl(movie)) { <img [src]="posterUrl(movie)!" [alt]="'Poster for ' + movie.title" loading="lazy" /> } @else { <div>NO<br>POSTER</div> }</button><div class="public-movie-detail"><p>{{ releaseYear(movie) }} / NOW PLAYING</p><h3>{{ movie.title }}</h3></div></article> }</div> }
          @else { <p class="public-empty"><strong>Nothing playing right now.</strong> The next screening is still unwritten.</p> }
        </section>

        <section class="public-section" aria-labelledby="public-watchlist-title">
          <header><p>MOVIES SAVED FOR LATER</p><h2 id="public-watchlist-title">WATCHLIST</h2><span>{{ watchlist().length }} FILMS</span></header>
          @if (watchlist().length) { <div class="public-rail">@for (movie of watchlist(); track movie.tmdbId; let index = $index) { <article [style.--order]="index"><button type="button" class="public-poster" (click)="openMovie(movie)" [attr.aria-label]="'Open ' + movie.title">@if (posterUrl(movie)) { <img [src]="posterUrl(movie)!" [alt]="'Poster for ' + movie.title" loading="lazy" /> } @else { <div>NO<br>POSTER</div> }</button><div class="public-movie-detail"><p>{{ releaseYear(movie) }} / WATCHLIST</p><h3>{{ movie.title }}</h3></div></article> }</div> }
          @else { <p class="public-empty"><strong>The watchlist is waiting.</strong> Nothing has been saved for later yet.</p> }
        </section>

        <section class="public-section public-archive" aria-labelledby="public-archive-title">
          <header><p>WHAT HAS STAYED</p><h2 id="public-archive-title">THE ARCHIVE</h2><span>{{ watched().length }} FILMS</span></header>
          @if (watched().length) { <div class="public-archive-grid">@for (movie of watched(); track movie.tmdbId; let index = $index) { <article [style.--order]="index"><button type="button" class="public-poster" (click)="openMovie(movie)" [attr.aria-label]="'Open ' + movie.title">@if (posterUrl(movie)) { <img [src]="posterUrl(movie)!" [alt]="'Poster for ' + movie.title" loading="lazy" /> } @else { <div>NO<br>POSTER</div> }</button><div class="public-movie-detail"><p>{{ releaseYear(movie) }} / WATCHED</p><h3>{{ movie.title }}</h3></div></article> }</div> }
          @else { <p class="public-empty"><strong>The archive begins with the first film.</strong></p> }
        </section>

        @if (profile.takes.length) {
          <section class="public-section public-takes" aria-labelledby="public-takes-title">
            <header><p>IN {{ profile.username.toUpperCase() }}'S OWN WORDS</p><h2 id="public-takes-title">YOUR TAKES</h2><span>{{ profile.takes.length }} TAKES</span></header>
            <div class="public-take-list">@for (take of profile.takes; track take.tmdbId; let index = $index) { <article [style.--order]="index"><p>{{ take.movieTitle.toUpperCase() }}</p><blockquote>“{{ take.body }}”</blockquote><div class="public-take-footer"><span>TAKE / {{ take.updatedAt | date:'yyyy' }}</span><button type="button" (click)="openMovieId(take.tmdbId)" [attr.aria-label]="'Read film details for ' + take.movieTitle">READ FILM ↗</button></div></article> }</div>
          </section>
        }
      } @else {
        <section class="public-loading public-not-found"><p>{{ errorMessage() }}</p><a routerLink="/">RETURN TO END CREDITS ↗</a></section>
      }
    </main>
  `,
  styles: [`
    :host{display:block}.public-profile-page{min-height:100svh;padding:clamp(28px,4vw,58px);overflow:hidden;background:radial-gradient(ellipse at 11% 32%,rgba(7,153,195,.17),transparent 29%),radial-gradient(ellipse at 92% 12%,rgba(132,73,225,.15),transparent 27%),#05070c;color:#f6fbff}.public-profile-page::before{content:"";position:fixed;inset:15px;border:1px solid rgba(198,232,250,.1);pointer-events:none}.public-navigation{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:center;gap:18px}.public-navigation a{color:#f5fbff;font:900 clamp(1.25rem,1.8vw,1.7rem)/1 var(--display);letter-spacing:-.075em;text-decoration:none}.public-navigation span,.public-hero-top,.public-section header>p,.public-section header>span{color:#a8d5e5;font:800 .84rem/1.2 var(--body);letter-spacing:.095em}.public-hero{display:flex;min-height:calc(100svh - clamp(120px,15vw,210px));max-width:1440px;margin:0 auto;flex-direction:column;justify-content:space-between;gap:clamp(42px,7vw,100px);padding:clamp(70px,10vw,140px) clamp(4px,5vw,88px) clamp(42px,6vw,78px)}.public-hero-top{display:flex;justify-content:space-between;gap:20px}.public-hero-top p,.public-hero-top span{margin:0}.public-identity{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr);align-items:end;gap:clamp(30px,7vw,120px)}.public-identity h1{margin:0;color:#effaff;font:900 clamp(4.5rem,10vw,12.8rem)/.73 var(--display);letter-spacing:-.105em;animation:public-reveal .8s both cubic-bezier(.2,.85,.25,1)}.public-identity>p{margin:0;color:#c2eefa;font:900 clamp(3.1rem,5.2vw,7.1rem)/.79 var(--display);letter-spacing:-.09em}.public-hero-bottom{display:grid;grid-template-columns:minmax(190px,.7fr) minmax(290px,1.05fr);align-items:end;gap:clamp(26px,6vw,100px)}.public-hero-bottom>p:first-child{margin:0;color:#e9faff;font:800 1rem/1.35 var(--body);letter-spacing:.07em}.public-counts{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(12px,2vw,28px)}.public-counts p{display:grid;gap:7px;margin:0}.public-counts strong{color:#f5fbff;font:900 clamp(2.55rem,4.3vw,5.1rem)/.8 var(--display);letter-spacing:-.09em}.public-counts span{color:#b9d4df;font:800 .75rem/1.2 var(--body);letter-spacing:.085em}.public-enter{grid-column:1/-1;margin:clamp(8px,2vw,24px) 0 0!important;color:#a7dbe9!important;font:800 .78rem/1 var(--body)!important;letter-spacing:.1em}.public-enter span{display:inline-block;margin-left:6px;font-size:1.2rem;animation:public-pulse 1.8s ease-in-out infinite}.public-section{max-width:1440px;margin:0 auto;padding:clamp(70px,10vw,140px) clamp(4px,5vw,88px);border-top:1px solid rgba(202,232,248,.2)}.public-section header{display:grid;grid-template-columns:1fr auto;align-items:end;gap:16px;margin-bottom:31px}.public-section header p{margin:0}.public-section h2{grid-column:1/-1;margin:0;color:#f6fbff;font:900 clamp(3.3rem,7vw,8rem)/.76 var(--display);letter-spacing:-.1em}.public-section header>span{justify-self:end;color:#d8edf5}.public-my-five-intro{margin:0 0 clamp(42px,7vw,90px);color:#c8f0fa;font:900 clamp(2.7rem,5vw,6.5rem)/.78 var(--display);letter-spacing:-.09em}.public-my-five-grid{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));align-items:start;gap:clamp(10px,1.6vw,23px)}.public-my-five-grid article{position:relative;min-width:0}.public-my-five-grid article>span{position:absolute;z-index:1;top:10px;left:10px;color:#fff;font:900 1rem/1 var(--body);text-shadow:0 1px 8px #070a10}.public-my-five-grid article:nth-child(1){grid-column:1/span 3}.public-my-five-grid article:nth-child(2){grid-column:4/span 2;margin-top:30%}.public-my-five-grid article:nth-child(3){grid-column:6/span 3;margin-top:-13%}.public-my-five-grid article:nth-child(4){grid-column:3/span 2;margin-top:-18%}.public-my-five-grid article:nth-child(5){grid-column:7/span 2;margin-top:12%}.public-empty{max-width:450px;margin:0;color:#b4cad4;font:600 1.12rem/1.5 var(--body)}.public-empty strong{display:block;margin-bottom:4px;color:#f2fbff;font-weight:800}.public-rail,.public-featured-rail{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(185px,22%);gap:clamp(17px,2vw,31px);overflow-x:auto;padding:8px 2px 19px;scroll-snap-type:x proximity;scrollbar-color:rgba(163,226,245,.42) transparent}.public-featured-rail{grid-auto-columns:minmax(260px,30%)}.public-featured-rail.is-solo{grid-auto-columns:minmax(290px,38%);justify-content:start}.public-featured-rail.is-solo article{display:grid;grid-template-columns:minmax(250px,1fr) minmax(260px,.72fr);align-items:end;gap:clamp(22px,4vw,65px);max-width:min(900px,100%)}.public-featured-rail.is-solo .public-movie-detail{padding-bottom:clamp(8px,2vw,25px)}.public-section article{min-width:0;scroll-snap-align:start;animation:poster-reveal .65s both cubic-bezier(.2,.8,.25,1);animation-delay:calc(var(--order) * 80ms)}.public-poster{position:relative;aspect-ratio:2/3;overflow:hidden;background:linear-gradient(145deg,#153e59,#171431);box-shadow:0 15px 29px rgba(0,0,0,.3);transition:transform .4s cubic-bezier(.2,.8,.25,1),box-shadow .4s ease}.public-poster::after{content:"";position:absolute;inset:8px;border:1px solid rgba(239,251,255,.2);opacity:0;transition:opacity .3s}.public-poster img{width:100%;height:100%;object-fit:cover;filter:saturate(.84);transition:transform .55s ease,filter .4s ease}.public-section article:hover .public-poster{transform:translateY(-7px);box-shadow:0 23px 38px rgba(0,0,0,.44)}.public-section article:hover .public-poster::after{opacity:1}.public-section article:hover img{transform:scale(1.06);filter:saturate(1.05)}.public-poster>div{display:grid;place-items:center;height:100%;color:#d5effa;font:900 1rem/.85 var(--display);letter-spacing:-.05em;text-align:center}.public-movie-detail{padding:15px 2px 0}.public-movie-detail p{margin:0 0 8px;color:#a8ccda;font:800 .76rem/1.2 var(--body);letter-spacing:.07em}.public-movie-detail h3{margin:0;color:#f7fbff;font:900 clamp(1.2rem,1.8vw,1.85rem)/.97 var(--display);letter-spacing:-.055em}.public-archive-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:clamp(12px,1.6vw,23px)}.public-archive-grid .public-movie-detail{padding-top:11px}.public-archive-grid .public-movie-detail h3{font-size:clamp(1rem,1.25vw,1.35rem)}.public-archive-grid .public-movie-detail p{font-size:.68rem}.public-loading{display:grid;min-height:75svh;place-content:center;gap:20px;text-align:center;color:#bce5f0;font:800 1rem/1.3 var(--body);letter-spacing:.1em}.public-not-found a{color:#effaff;font:800 .9rem/1.2 var(--body);letter-spacing:.08em;text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:4px}@keyframes public-reveal{from{opacity:0;transform:translateY(35px)}to{opacity:1;transform:none}}@keyframes poster-reveal{from{opacity:0;transform:translateY(24px);clip-path:inset(12% 0 0)}to{opacity:1;transform:none;clip-path:inset(0)}}@keyframes public-pulse{50%{transform:translateY(8px)}}@media(max-width:1000px){.public-hero-bottom{grid-template-columns:1fr 1fr}.public-counts{grid-column:1/-1;max-width:600px}.public-archive-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}@media(max-width:700px){.public-profile-page{padding:25px 20px}.public-profile-page::before{inset:9px}.public-navigation span,.public-hero-top span{display:none}.public-hero{min-height:calc(100svh - 100px);gap:clamp(45px,10vh,80px);padding:70px 0 38px}.public-hero-top{font-size:.72rem}.public-identity{grid-template-columns:1fr;gap:27px}.public-identity h1{font-size:clamp(3.8rem,16.5vw,7rem);line-height:.72}.public-identity>p{font-size:clamp(3.25rem,14vw,5.6rem);line-height:.78}.public-hero-bottom{grid-template-columns:1fr;gap:19px}.public-counts{grid-column:auto;gap:13px;width:100%}.public-counts strong{font-size:clamp(2.4rem,10.5vw,4rem)}.public-counts span{font-size:.65rem}.public-section{padding:70px 0}.public-section h2{font-size:clamp(3rem,13vw,5.2rem)}.public-my-five-grid{display:flex;gap:15px;overflow-x:auto;padding:8px 2px 20px;scroll-snap-type:x proximity}.public-my-five-grid article,.public-my-five-grid article:nth-child(n){min-width:58%;margin-top:0;scroll-snap-align:start}.public-featured-rail.is-solo{grid-auto-columns:100%}.public-featured-rail.is-solo article{grid-template-columns:minmax(0,1fr) minmax(0,.78fr);gap:16px}.public-featured-rail.is-solo .public-movie-detail{padding-bottom:0}.public-rail{grid-auto-columns:minmax(166px,58%);gap:17px}.public-archive-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:15px 10px}.public-archive-grid .public-movie-detail h3{font-size:1rem}.public-archive-grid .public-movie-detail p{font-size:.62rem}}@media(prefers-reduced-motion:reduce){.public-identity h1,.public-section article,.public-poster,.public-poster img,.public-enter span{animation:none;transition:none}}
  `, `
    .public-takes{padding-bottom:clamp(100px,15vw,200px)}.public-take-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(28px,5vw,90px)}.public-take-list article{min-width:0;padding:clamp(20px,3vw,38px) 0;border-top:1px solid rgba(202,232,248,.25)}.public-take-list article:nth-child(even){margin-top:clamp(45px,8vw,130px)}.public-take-list p,.public-take-list span{margin:0;color:#abd4e2;font:800 .82rem/1.2 var(--body);letter-spacing:.085em}.public-take-list blockquote{margin:clamp(16px,2vw,25px) 0 clamp(20px,3vw,34px);color:#e8f4f8;font:800 clamp(1.8rem,3.2vw,4.35rem)/.94 var(--display);letter-spacing:-.07em}.public-take-footer{display:flex;justify-content:space-between;align-items:center;gap:18px}.public-take-footer button{border:0;padding:0;color:#e5f9ff;background:transparent;font:800 .75rem/1 var(--body);letter-spacing:.1em;cursor:pointer;border-bottom:1px solid rgba(229,249,255,.65);padding-bottom:4px;transition:color .25s,border-color .25s}.public-take-footer button:hover,.public-take-footer button:focus-visible{color:#9eeeff;border-color:#9eeeff;outline:none}@media(max-width:700px){.public-take-list{grid-template-columns:1fr;gap:35px}.public-take-list article:nth-child(even){margin-top:0}.public-take-list blockquote{font-size:clamp(2rem,9.5vw,3.3rem)}}
  `, `
    .public-poster{border:0;padding:0;width:100%;text-align:inherit;color:inherit;cursor:pointer}.public-poster:focus-visible{outline:2px solid #b8f2ff;outline-offset:5px}
  `, `
    .public-my-five-reel{position:relative;overflow-x:auto;padding:clamp(25px,4vw,52px) 0 clamp(38px,5vw,66px);background:linear-gradient(90deg,rgba(110,205,231,.08),rgba(116,87,218,.1) 52%,rgba(5,7,12,0));scroll-snap-type:x proximity;scrollbar-width:none;cursor:grab}.public-my-five-reel::-webkit-scrollbar{display:none}.public-reel-track{display:flex;align-items:flex-start;gap:clamp(14px,2.2vw,34px);width:max-content;padding:0 clamp(20px,3vw,48px)}.public-reel-frame{position:relative;width:clamp(175px,16.5vw,258px);scroll-snap-align:start}.public-reel-frame:nth-child(even){margin-top:clamp(24px,4vw,64px)}.public-reel-frame>span{display:block;margin:0 0 10px;color:#b9e9f6;font:800 .72rem/1 var(--body);letter-spacing:.11em}.public-reel-frame .public-poster{display:block;border:1px solid rgba(208,242,253,.2);box-shadow:0 23px 46px rgba(0,0,0,.37)}.public-reel-frame .public-poster::after{inset:7px}.public-reel-frame .public-movie-detail{padding:13px 2px 0}.public-reel-frame .public-movie-detail small{display:block;margin-top:9px;color:#c3ebf5;font:800 .67rem/1.2 var(--body);letter-spacing:.085em}.public-reel-hint{display:flex;justify-content:space-between;gap:28px;margin:clamp(24px,3vw,42px) clamp(20px,3vw,48px) 0;color:#99c9d8;font:800 .7rem/1 var(--body);letter-spacing:.11em}.public-reel-hint span{color:#ddf7ff}@media(max-width:700px){.public-my-five-reel{overflow:visible;padding:8px 0 0;background:transparent;cursor:default}.public-reel-track{display:grid;width:auto;padding:0;gap:27px}.public-reel-frame,.public-reel-frame:nth-child(even){width:min(78vw,310px);margin:0 auto}.public-reel-frame>span{margin-bottom:11px}.public-reel-hint{display:none}}@media(prefers-reduced-motion:reduce){.public-my-five-reel{scroll-behavior:auto}}
  `],
})
export class PublicProfilePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly publicProfileService = inject(PublicProfileService);
  private readonly movieSearchService = inject(MovieSearchService);

  protected readonly profile = signal<PublicProfile | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('This cinema profile could not be found.');
  protected readonly watching = computed(() => this.profile()?.movies.filter((movie) => movie.status === 'WATCHING') ?? []);
  protected readonly watchlist = computed(() => this.profile()?.movies.filter((movie) => movie.status === 'WATCHLIST') ?? []);
  protected readonly watched = computed(() => this.profile()?.movies.filter((movie) => movie.status === 'FINISHED') ?? []);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      map((params) => params.get('username') ?? ''),
      switchMap((username) => this.publicProfileService.load(username)),
    ).subscribe({
      next: (profile) => { this.profile.set(profile); this.isLoading.set(false); },
      error: (error: unknown) => {
        this.errorMessage.set(error instanceof HttpErrorResponse && error.status === 404
          ? 'This cinema profile could not be found.'
          : 'This cinema profile is unavailable right now.');
        this.isLoading.set(false);
      },
    });
  }

  protected posterUrl(movie: PublicProfileMovie): string | null { return this.movieSearchService.posterUrl(movie.posterPath); }
  protected releaseYear(movie: PublicProfileMovie): string { return movie.releaseDate?.slice(0, 4) || 'YEAR TBC'; }
  protected openMovie(movie: PublicProfileMovie): void {
    this.openMovieId(movie.tmdbId);
  }
  protected openMovieId(tmdbId: number): void {
    const username = this.profile()?.username;
    if (username) this.router.navigate(['/u', username, 'movie', tmdbId]);
  }
}
