import { Component, EventEmitter, Input, OnInit, Output, forwardRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CurrentUser } from './auth/auth.service';
import { HomeNavigationComponent } from './home-navigation.component';
import { MovieSearchComponent } from './movie-search.component';
import { MovieBrowseResult, MovieSearchService } from './movie-search.service';
import { MovieShelfComponent } from './movie-shelf.component';
import { SessionService } from './session.service';

@Component({
  imports: [forwardRef(() => DiscoverComponent)],
  template: `
    @if (session.user(); as user) {
      <app-discover [user]="user" (signOut)="signOut()"></app-discover>
    }
  `,
})
export class DiscoverPageComponent {
  protected readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected signOut(): void {
    this.session.signOut().subscribe({ next: () => this.router.navigateByUrl('/') });
  }
}

@Component({
  selector: 'app-discover',
  imports: [HomeNavigationComponent, MovieSearchComponent, MovieShelfComponent],
  template: `
    <main class="discover-page">
      <div class="discover-grain" aria-hidden="true"></div>
      <app-home-navigation [user]="user" (signOut)="signOut.emit()"></app-home-navigation>

      <section class="discover-opening" aria-labelledby="discover-title">
        <div class="discover-copy">
          <p class="opening-index">THE END CREDITS ARCHIVE / 001</p>
          <h1 id="discover-title">DISCOVER</h1>
          <p class="discover-lede">A considered way through the films moving through cinema now.</p>
        </div>
        <div class="discover-search">
          <p class="search-index">FIND A FILM</p>
          <app-movie-search></app-movie-search>
        </div>
      </section>

      <section class="discover-feature-section" aria-labelledby="featured-heading">
        <header class="section-marker">
          <p id="featured-heading">01 / FEATURED THIS WEEK</p>
          <span>FROM THE POPULAR REEL</span>
        </header>

        @if (feature(); as film) {
          <article class="discover-feature" [style.background-image]="backdropUrl(film) ? 'url(' + backdropUrl(film) + ')' : null">
            <div class="feature-falloff" aria-hidden="true"></div>
            <div class="feature-copy">
              <p class="feature-label">THE OPENING FRAME</p>
              <h2>{{ titleFor(film) }}</h2>
              <p class="feature-facts">{{ yearFor(film) }} @if (film.originalLanguage) { <span>·</span> {{ film.originalLanguage.toUpperCase() }} }</p>
              @if (film.overview) { <p class="feature-overview">{{ film.overview }}</p> }
              <button type="button" (click)="openFilm(film)">ENTER FILM <span aria-hidden="true">↗</span></button>
            </div>
          </article>
        } @else {
          <div class="discover-feature feature-loading" aria-live="polite"><p>LOADING THE OPENING FRAME…</p></div>
        }
      </section>

      <section class="discover-program" aria-label="Browse cinema">
        <app-movie-shelf shelf="now-playing" title="NEW RELEASES" kicker="02 / CURRENT RELEASES" layout="rail"></app-movie-shelf>
        <app-movie-shelf shelf="trending" title="TRENDING NOW" kicker="03 / FILMS IN MOTION" layout="rail"></app-movie-shelf>
        <app-movie-shelf shelf="indian-cinema" title="INDIAN CINEMA" kicker="04 / HINDI · TAMIL · TELUGU · MALAYALAM · KANNADA · BENGALI" layout="rail"></app-movie-shelf>
        <app-movie-shelf shelf="world-cinema" title="WORLD CINEMA" kicker="05 / KOREAN · JAPANESE · FRENCH · SPANISH · ITALIAN · GERMAN" layout="rail"></app-movie-shelf>
        <app-movie-shelf shelf="horror" title="BY GENRE / HORROR" kicker="06 / AFTER DARK" layout="rail"></app-movie-shelf>
      </section>

      <section class="discover-closing" aria-label="End of this discovery edition">
        <p>THE ARCHIVE KEEPS ROLLING.</p>
        <span>MORE CINEMA ARRIVES WITH EACH NEW FRAME.</span>
      </section>

      <footer class="discover-footer"><span>END CREDITS / DISCOVER EDITION</span><span>MOVIE DATA &amp; ARTWORK / TMDB</span><span>ROLL 006</span></footer>
    </main>
  `,
  styles: [`
    :host{display:block}.discover-page{position:relative;isolation:isolate;min-height:100svh;overflow:hidden;padding:var(--screen-gutter);background:#05070c;color:#f4f7f6}.discover-page::before{content:"";position:absolute;z-index:-2;inset:0;background:radial-gradient(ellipse at 79% 5%,rgba(100,134,160,.12),transparent 27%),radial-gradient(ellipse at 8% 42%,rgba(89,127,147,.09),transparent 25%),#05070c}.discover-page::after{content:"";position:absolute;z-index:-1;inset:15px;border:1px solid rgba(219,235,239,.1);pointer-events:none}.discover-grain{position:absolute;z-index:-1;inset:0;opacity:.1;pointer-events:none;background-image:repeating-radial-gradient(circle at 23% 47%,rgba(238,249,250,.55) 0 .45px,transparent .75px 2.8px);mix-blend-mode:soft-light}.discover-opening,.discover-feature-section,.discover-program,.discover-closing,.discover-footer{position:relative;max-width:var(--content-max);margin-inline:auto}.discover-opening{display:grid;grid-template-columns:minmax(280px,.88fr) minmax(360px,.9fr);gap:clamp(48px,9vw,164px);align-items:end;padding:clamp(74px,10vw,142px) clamp(0px,4vw,68px) clamp(70px,8vw,110px);border-bottom:1px solid rgba(207,226,230,.24)}.opening-index,.search-index,.section-marker p,.section-marker span,.feature-label{margin:0;color:#abc0c5;font:800 var(--type-meta)/1.2 var(--body);letter-spacing:.105em}.discover-copy h1{margin:22px 0 0;color:#f5f7f6;font:900 clamp(4.65rem,9.8vw,10.8rem)/.71 var(--display);letter-spacing:-.115em}.discover-lede{max-width:430px;margin:28px 0 0;color:#c3d0d1;font:600 var(--type-lede)/1.46 var(--body)}.discover-search{align-self:end;padding-left:clamp(24px,4vw,58px);border-left:1px solid rgba(202,225,229,.25)}.search-index{margin-bottom:17px;color:#d5e4e6}.discover-feature-section{padding:clamp(72px,10vw,140px) clamp(0px,4vw,68px) 0}.section-marker{display:flex;justify-content:space-between;gap:22px;align-items:center;border-top:1px solid rgba(207,226,230,.32);padding-top:15px}.section-marker p{color:#e2ebeb}.section-marker span{color:#92abb1;text-align:right}.discover-feature{position:relative;display:flex;min-height:clamp(450px,51vw,700px);align-items:end;overflow:hidden;margin-top:clamp(22px,3.5vw,42px);background-color:#111c24;background-position:center;background-size:cover;box-shadow:0 34px 78px rgba(0,0,0,.36)}.discover-feature::after{content:"";position:absolute;z-index:1;inset:10px;border:1px solid rgba(232,241,241,.22);pointer-events:none}.feature-falloff{position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,8,13,.94) 2%,rgba(4,8,13,.66) 48%,rgba(4,8,13,.18) 100%),linear-gradient(0deg,rgba(4,8,13,.91),transparent 62%)}.feature-copy{position:relative;z-index:2;max-width:min(650px,90%);padding:clamp(31px,6vw,84px)}.feature-label{color:#c2e1e3}.feature-copy h2{max-width:790px;margin:18px 0 0;color:#fff;font:900 clamp(3.2rem,7.25vw,8.3rem)/.73 var(--display);letter-spacing:-.11em}.feature-facts{margin:20px 0 0;color:#c8d6d7;font:800 .75rem/1.25 var(--body);letter-spacing:.1em}.feature-facts span{margin:0 .34rem;color:#b8e8ee}.feature-overview{max-width:520px;margin:24px 0 0;color:#e0e8e7;font:500 1.04rem/1.55 var(--body)}.feature-copy button{margin-top:29px;border:0;border-bottom:1px solid rgba(237,246,245,.72);padding:0 0 6px;background:transparent;color:#f6fbfa;font:800 .77rem/1 var(--body);letter-spacing:.1em;cursor:pointer;transition:color .22s,border-color .22s,transform .22s}.feature-copy button:hover{border-color:#bdebf1;color:#bdebf1;transform:translateX(4px)}.feature-loading{display:grid;place-items:center;background:linear-gradient(120deg,#101b24,#0b1118);color:#c8d9dc;font:800 .75rem/1 var(--body);letter-spacing:.1em}.discover-program{display:grid;gap:clamp(82px,11vw,154px);padding:clamp(84px,11vw,154px) clamp(0px,4vw,68px) clamp(80px,11vw,150px)}.discover-closing{display:grid;justify-items:center;gap:14px;border-top:1px solid rgba(207,226,230,.22);padding:clamp(75px,12vw,158px) clamp(20px,4vw,68px);text-align:center}.discover-closing p{max-width:760px;margin:0;color:#edf4f2;font:900 clamp(2.35rem,5vw,5.5rem)/.78 var(--display);letter-spacing:-.1em}.discover-closing span{color:#afc1c4;font:700 .82rem/1.35 var(--body);letter-spacing:.09em}.discover-footer{position:relative;z-index:1;display:flex;justify-content:space-between;border-top:1px solid rgba(207,226,230,.18);padding:17px clamp(0px,4vw,68px) 0;color:#aabdc1;font:700 .69rem/1.2 var(--body);letter-spacing:.08em}.discover-footer span:nth-child(2){color:#d7e2e1}@media(max-width:900px){.discover-opening{grid-template-columns:1fr;gap:48px}.discover-search{padding:24px 0 0;border-top:1px solid rgba(202,225,229,.25);border-left:0}}@media(max-width:720px){.discover-page{padding:22px 18px}.discover-page::after{inset:8px}.discover-opening{gap:38px;padding:62px 0 73px}.discover-copy h1{font-size:clamp(4.2rem,18vw,7.5rem)}.discover-lede{max-width:500px;margin-top:23px}.discover-feature-section{padding:77px 0 0}.section-marker{align-items:flex-start}.section-marker span{max-width:43%;font-size:.65rem;line-height:1.35}.discover-feature{min-height:540px;margin-top:21px}.feature-copy{max-width:100%;padding:29px 24px}.feature-copy h2{font-size:clamp(3.25rem,14vw,5.7rem)}.feature-overview{font-size:.98rem}.discover-program{gap:79px;padding:84px 0 78px}.discover-closing{padding:82px 18px}.discover-closing p{font-size:clamp(2.55rem,12vw,4.45rem)}.discover-closing span{font-size:.71rem}.discover-footer{padding:15px 0 0;font-size:.6rem}.discover-footer span:nth-child(2){display:none}}@media(max-width:430px){.opening-index,.search-index,.section-marker p,.feature-label{font-size:.68rem}.discover-copy h1{font-size:clamp(4rem,18.4vw,6.7rem)}.section-marker{gap:15px}.feature-copy h2{font-size:clamp(3rem,14.4vw,4.65rem)}}@media(prefers-reduced-motion:reduce){.feature-copy button{transition:none}}
  `],
})
export class DiscoverComponent implements OnInit {
  private readonly moviesApi = inject(MovieSearchService);
  private readonly router = inject(Router);

  @Input({ required: true }) user!: CurrentUser;
  @Output() signOut = new EventEmitter<void>();
  protected readonly feature = signal<MovieBrowseResult | null>(null);

  ngOnInit(): void {
    this.moviesApi.browse('popular').subscribe({ next: (response) => this.feature.set(response.results[0] ?? null) });
  }

  protected backdropUrl(movie: MovieBrowseResult): string | null {
    return this.moviesApi.backdropUrl(movie.backdropPath);
  }

  protected titleFor(movie: MovieBrowseResult): string {
    return movie.title || 'Untitled film';
  }

  protected yearFor(movie: MovieBrowseResult): string {
    return movie.releaseDate?.slice(0, 4) || 'YEAR TBC';
  }

  protected openFilm(movie: MovieBrowseResult): void {
    this.router.navigate(['/movie', movie.tmdbId]);
  }
}
