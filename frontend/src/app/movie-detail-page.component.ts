import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CollectionMovie, CollectionService, WatchStatus } from './collection.service';
import { MovieDetails, MovieSearchResult, MovieSearchService } from './movie-search.service';
import { PublicProfile, PublicProfileMovie, PublicProfileService } from './public-profile.service';
import { TakeService } from './take.service';

@Component({
  imports: [FormsModule, RouterLink],
  template: `
    <main class="movie-detail-page">
      <a class="detail-back" [routerLink]="isPublicEdition() ? ['/u', publicUsername() ?? ''] : ['/profile']">← {{ isPublicEdition() ? 'BACK TO PUBLIC CINEMA' : 'BACK TO YOUR CINEMA' }}</a>
      @if (loading()) { <p class="detail-state">LOADING THE FILM…</p> }
      @if (loadError()) { <section class="detail-state error"><h1>THE FILM COULDN'T BE OPENED.</h1><p>TMDB details are unavailable right now. Try again shortly.</p><a routerLink="/">RETURN TO DISCOVER ↗</a></section> }
      @if (movie(); as film) {
        <div class="detail-backdrop" [style.background-image]="backdropUrl(film) ? 'url(' + backdropUrl(film) + ')' : null" aria-hidden="true"></div>
        <section class="movie-detail" aria-labelledby="movie-title">
          <div class="detail-poster">@if (posterUrl(film)) { <img [src]="posterUrl(film)!" [alt]="'Poster for ' + displayTitle(film)" /> } @else { <div>NO<br>POSTER</div> }</div>
          <div class="detail-copy">
            <p class="detail-kicker">TMDB / {{ film.tmdbId }} @if (savedMovie()) { <span> / IN YOUR CINEMA</span> }</p>
            <h1 id="movie-title">{{ displayTitle(film) }}</h1>
            @if (film.originalTitle && film.originalTitle !== film.title) { <p class="original-title">{{ film.originalTitle }}</p> }
            <p class="metadata">{{ releaseYear(film) }} @if (film.runtime) { <i>·</i> {{ film.runtime }} MIN } @if (film.originalLanguage) { <i>·</i> {{ film.originalLanguage.toUpperCase() }} } @if (film.country) { <i>·</i> {{ film.country }} }</p>
            @if (film.genres.length) { <p class="genres">{{ film.genres.join(' / ') }}</p> }
            @if (film.overview) { <p class="overview">{{ film.overview }}</p> }
            <dl class="credits">@if (film.director) { <div><dt>DIRECTED BY</dt><dd>{{ film.director }}</dd></div> } @if (film.cast.length) { <div><dt>CAST</dt><dd>{{ film.cast.join(', ') }}</dd></div> }</dl>

            @if (isPublicEdition()) {
              <section class="my-movie public-relationship" aria-labelledby="my-movie-title">
                <p class="detail-kicker">PUBLIC CINEMA</p>
                <h2 id="my-movie-title">IN {{ publicName().toUpperCase() }}’S CINEMA</h2>
                @if (publicMovie(); as saved) {
                  <div class="library-control"><div><strong>{{ statusLabel(saved.status) }}</strong><small>This film is part of this public cinema.</small></div></div>
                  @if (saved.rating) { <p class="public-rating">RATED <b>{{ saved.rating }} / 10</b></p> }
                  @if (publicTake(); as take) { <blockquote class="public-take">“{{ take.body }}”</blockquote> }
                } @else { <p class="take-gate">This film is not currently in the public library.</p> }
              </section>
            } @else {
            <section class="my-movie" aria-labelledby="my-movie-title">
              <p class="detail-kicker">PERSONAL CINEMA</p>
              <h2 id="my-movie-title">MY MOVIE</h2>
              <div class="library-control">
                <div><strong>{{ savedMovie() ? 'IN YOUR LIBRARY' : 'SAVE TO YOUR LIBRARY' }}</strong><small>{{ savedMovie() ? statusLabel(savedMovie()!.status) : 'Choose where this film belongs.' }}</small></div>
                <button class="bookmark" type="button" [class.is-saved]="savedMovie()" (click)="toggleLibraryMenu()" [disabled]="isSaving() || isRemoving()" [attr.aria-label]="savedMovie() ? 'Change library settings' : 'Choose a status and save this film'">
                  <svg viewBox="0 0 16 20" aria-hidden="true"><path d="M2.5 1.5h11v17l-5.5-3.4-5.5 3.4z"/></svg>
                </button>
              </div>
              @if (libraryMenuOpen()) { <div class="library-menu"><p>SET STATUS</p><div>@for (status of statuses; track status) { <button type="button" [class.is-current]="savedMovie()?.status === status" (click)="setStatus(status)">{{ statusLabel(status) }}</button> }</div>@if (savedMovie()) { <button class="remove-film" type="button" (click)="remove()">REMOVE FROM LIBRARY</button> }</div> }
              @if (savedMovie()) {
                @if (savedMovie()!.status === 'FINISHED') { <div class="rewatch-control"><span>{{ savedMovie()!.watchCount }} {{ savedMovie()!.watchCount === 1 ? 'WATCH RECORDED' : 'WATCHES RECORDED' }}</span><button type="button" (click)="logRewatch()" [disabled]="isLoggingRewatch()">{{ isLoggingRewatch() ? 'RECORDING…' : 'LOG REWATCH →' }}</button></div> }
                <fieldset class="detail-rating" [disabled]="ratingMovieId() === film.tmdbId"><legend>MY RATING <b>{{ ratingLabel() }}</b></legend><div>@for (value of ratings; track value) { <button type="button" [class.is-rated]="isRatingFilled(value)" (mouseenter)="ratingHover.set(value)" (mouseleave)="ratingHover.set(null)" (focus)="ratingHover.set(value)" (blur)="ratingHover.set(null)" (click)="rate(value)" [attr.aria-label]="'Rate ' + displayTitle(film) + ' ' + value + ' out of 10'">★</button> }</div>@if (savedMovie()?.rating) { <button class="clear-rating" type="button" (click)="clearRating()">CLEAR RATING</button> }</fieldset>
                <form class="take-editor" (ngSubmit)="saveTake()"><label>YOUR TAKE<textarea [(ngModel)]="takeBody" name="takeBody" maxlength="1200" placeholder="What stayed with you?"></textarea></label><div><small>{{ existingTake() ? 'YOUR EXISTING TAKE — EDIT WHEN IT CHANGES.' : 'YOUR TAKE BELONGS TO THIS FILM.' }}</small><span class="take-actions">@if (existingTake()) { <button class="remove-take" type="button" (click)="removeTake()" [disabled]="isRemovingTake()">{{ isRemovingTake() ? 'REMOVING…' : 'REMOVE TAKE' }}</button> }<button class="detail-publish" type="submit" [disabled]="isSavingTake() || !takeBody.trim()">{{ isSavingTake() ? 'SAVING…' : existingTake() ? 'SAVE TAKE →' : 'PUBLISH TAKE →' }}</button></span></div></form>
              } @else { <p class="take-gate">Save the film first to rate it or leave a Take.</p> }
            </section>
            }
          </div>
        </section>
      }
    </main>
  `,
  styles: [`
    :host{display:block}.movie-detail-page{position:relative;min-height:100svh;overflow:hidden;padding:clamp(28px,4vw,58px);background:#05070c;color:#eef9ff}.detail-backdrop{position:fixed;z-index:0;inset:0;background-position:center;background-size:cover;opacity:.18;filter:saturate(.6) blur(3px);transform:scale(1.05)}.detail-backdrop::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#05070c 10%,rgba(5,7,12,.8) 43%,rgba(5,7,12,.9)),linear-gradient(0deg,#05070c,transparent 48%,#05070c)}.detail-back,.movie-detail,.detail-state{position:relative;z-index:1;max-width:var(--content-max);margin-inline:auto}.detail-back{display:inline-block;margin-bottom:clamp(34px,5vw,72px);border-bottom:1px solid rgba(214,245,252,.55);padding-bottom:4px;color:#dff8ff;font:800 .72rem/1 var(--body);letter-spacing:.09em;text-decoration:none}.movie-detail{display:grid;grid-template-columns:minmax(250px,.62fr) minmax(0,1.3fr);gap:clamp(34px,7vw,110px);align-items:start}.detail-poster{position:sticky;top:30px;aspect-ratio:2/3;overflow:hidden;background:#112136;box-shadow:0 28px 65px rgba(0,0,0,.5)}.detail-poster img{width:100%;height:100%;object-fit:cover;display:block}.detail-poster>div{display:grid;place-items:center;height:100%;color:#bce9f7;font:900 1.4rem/.86 var(--display);text-align:center}.detail-kicker{margin:0;color:#a6dceb;font:800 .68rem/1 var(--body);letter-spacing:.11em}.detail-copy h1{max-width:800px;margin:18px 0 0;color:#f6fcff;font:900 clamp(3.3rem,7vw,7.8rem)/.77 var(--display);letter-spacing:-.1em}.original-title{margin:13px 0 0;color:#bdd1da;font:600 1rem/1.2 var(--body)}.metadata,.genres{margin:20px 0 0;color:#cce1e9;font:700 .88rem/1.35 var(--body);letter-spacing:.045em}.metadata i{margin:0 .32rem;color:#9ee7fa;font-style:normal}.genres{color:#8fe4f7;font-size:.72rem;letter-spacing:.09em}.overview{max-width:720px;margin:32px 0 0;color:#e0edf2;font:500 clamp(1rem,1.3vw,1.17rem)/1.63 var(--body)}.credits{display:grid;gap:14px;margin:30px 0 0;border-top:1px solid rgba(203,237,247,.24);padding-top:20px}.credits div{display:grid;grid-template-columns:120px 1fr;gap:18px}.credits dt{color:#9fcede;font:800 .68rem/1.25 var(--body);letter-spacing:.09em}.credits dd{margin:0;color:#e7f5f9;font:600 .94rem/1.35 var(--body)}.my-movie{max-width:720px;margin-top:clamp(50px,7vw,90px);border-top:1px solid rgba(207,241,250,.42);padding-top:23px}.my-movie h2{margin:11px 0 24px;color:#f3fbff;font:900 clamp(2.2rem,4vw,4rem)/.8 var(--display);letter-spacing:-.08em}.library-control{display:flex;align-items:center;justify-content:space-between;gap:24px;border-top:1px solid rgba(202,237,247,.23);border-bottom:1px solid rgba(202,237,247,.23);padding:15px 0}.library-control strong{display:block;color:#f1fbff;font:800 .78rem/1.2 var(--body);letter-spacing:.08em}.library-control small{display:block;margin-top:5px;color:#b3cbd6;font:500 .9rem/1.3 var(--body)}.bookmark{display:grid;place-items:center;width:43px;height:43px;border:1px solid rgba(207,241,250,.52);border-radius:50%;background:transparent;color:#e4faff}.bookmark svg{width:15px;height:19px;fill:none;stroke:currentColor;stroke-width:1.4}.bookmark.is-saved{background:#c9f2fc;color:#061018}.bookmark.is-saved svg{fill:currentColor}.library-menu{margin-top:12px;border-left:1px solid rgba(198,237,249,.48);padding:13px 0 0 18px}.library-menu p{margin:0 0 10px;color:#a8dce9;font:800 .65rem/1 var(--body);letter-spacing:.1em}.library-menu div{display:flex;flex-wrap:wrap;gap:8px}.library-menu button{border:1px solid rgba(203,238,249,.3);padding:8px 10px;background:transparent;color:#e9f9fd;font:800 .67rem/1 var(--body);letter-spacing:.07em}.library-menu button.is-current{border-color:#a8efff;background:rgba(126,216,240,.15)}.library-menu .remove-film{margin-top:13px;border-color:rgba(255,189,203,.42);color:#ffc6d3}.rewatch-control{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:18px;border-bottom:1px solid rgba(202,237,247,.23);padding:0 0 17px}.rewatch-control span{color:#aacdda;font:800 .7rem/1.2 var(--body);letter-spacing:.09em}.rewatch-control button{border:0;border-bottom:1px solid rgba(220,246,252,.7);padding:0 0 4px;background:transparent;color:#e6f9fd;font:800 .72rem/1 var(--body);letter-spacing:.09em;cursor:pointer}.rewatch-control button:disabled{opacity:.52;cursor:wait}.detail-rating{border:0;margin:29px 0 0;padding:0}.detail-rating legend{color:#cbe9f1;font:800 .72rem/1 var(--body);letter-spacing:.09em}.detail-rating legend b{margin-left:8px;color:#fff}.detail-rating>div{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.detail-rating button{width:25px;height:29px;border:0;background:transparent;color:#5b7580;font-size:1.35rem;line-height:1;cursor:pointer}.detail-rating button:hover,.detail-rating button.is-rated{color:#b6f0ff}.take-editor{margin-top:32px;border-top:1px solid rgba(203,238,248,.24);padding-top:23px}.take-editor label{display:grid;gap:10px;color:#dff7ff;font:800 .7rem/1 var(--body);letter-spacing:.09em}.take-editor textarea{min-height:120px;border:0;border-bottom:1px solid rgba(206,239,250,.55);padding:9px 0;background:transparent;color:#fff;font:500 1rem/1.48 var(--body);outline:none;resize:vertical}.take-editor>div{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-top:17px}.take-editor small{max-width:220px;color:#a8c3ce;font:700 .63rem/1.4 var(--body);letter-spacing:.07em}.detail-publish{border:0;padding:13px 16px;background:#e2f8ff;color:#061018;font:800 .7rem/1 var(--body);letter-spacing:.08em}.take-gate{margin:26px 0 0;color:#aec8d2;font:600 .94rem/1.45 var(--body)}.detail-state{padding-top:20vh;color:#eafaff;font:800 .85rem/1.4 var(--body);letter-spacing:.08em}.detail-state h1{font:900 clamp(3rem,7vw,7rem)/.8 var(--display);letter-spacing:-.09em}.detail-state.error p{max-width:450px;color:#c5d9e1;font-weight:500;letter-spacing:0}.detail-state.error a{color:#dff8ff;font-size:.75rem}@media(max-width:760px){.movie-detail-page{padding:25px 20px 70px}.detail-back{margin-bottom:30px}.movie-detail{grid-template-columns:1fr;gap:25px}.detail-poster{position:relative;top:auto;justify-self:center;width:min(72vw,340px)}.detail-copy h1{font-size:clamp(3.2rem,14vw,5.5rem)}.credits div{grid-template-columns:1fr;gap:5px}.rewatch-control{align-items:start;flex-direction:column}.take-editor>div{display:grid;gap:17px}.detail-publish{justify-self:start}.detail-backdrop{opacity:.13}}@media(prefers-reduced-motion:reduce){.detail-backdrop{transform:none}}
  `, `
    .public-relationship .library-control{justify-content:flex-start}.public-rating{margin:28px 0 0;color:#a8dce9;font:800 .72rem/1 var(--body);letter-spacing:.1em}.public-rating b{margin-left:9px;color:#f3fbff}.public-take{margin:28px 0 0;border-top:1px solid rgba(203,238,248,.24);padding-top:23px;color:#ecf8fc;font:800 clamp(1.6rem,3vw,3.2rem)/.95 var(--display);letter-spacing:-.06em}
  `, `
    .clear-rating,.remove-take{border:0;border-bottom:1px solid currentColor;padding:0 0 3px;background:transparent;color:#a9c7d1;font:800 .65rem/1 var(--body);letter-spacing:.09em;cursor:pointer}.clear-rating{margin-top:14px}.remove-take{color:#ffbdca}.take-actions{display:flex;align-items:center;justify-content:flex-end;gap:19px}.remove-take:disabled{opacity:.5;cursor:wait}.detail-rating button.is-rated{color:#a8efff;text-shadow:0 0 12px rgba(150,234,255,.35);transform:scale(1.08)}.detail-rating button{transition:color .18s ease,transform .18s ease}@media(max-width:760px){.take-actions{justify-content:flex-start;flex-wrap:wrap}}
  `],
})
export class MovieDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly movieSearchService = inject(MovieSearchService);
  private readonly collectionService = inject(CollectionService);
  private readonly takeService = inject(TakeService);
  private readonly publicProfileService = inject(PublicProfileService);
  protected readonly movie = signal<MovieDetails | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isRemoving = signal(false);
  protected readonly isLoggingRewatch = signal(false);
  protected readonly isSavingTake = signal(false);
  protected readonly isRemovingTake = signal(false);
  protected readonly ratingMovieId = signal<number | null>(null);
  protected readonly ratingHover = signal<number | null>(null);
  protected readonly libraryMenuOpen = signal(false);
  protected readonly publicProfile = signal<PublicProfile | null>(null);
  protected readonly publicUsername = signal<string | null>(null);
  protected readonly statuses: WatchStatus[] = ['WATCHLIST', 'WATCHING', 'FINISHED'];
  protected readonly ratings = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  protected takeBody = '';
  protected readonly savedMovie = computed(() => {
    const film = this.movie();
    return film ? this.collectionService.movies()?.find((item) => item.tmdbId === film.tmdbId) ?? null : null;
  });
  protected readonly existingTake = computed(() => {
    const film = this.movie();
    return film ? this.takeService.takes()?.find((take) => take.tmdbId === film.tmdbId) ?? null : null;
  });
  protected readonly isPublicEdition = computed(() => this.publicUsername() !== null);
  protected readonly publicMovie = computed(() => {
    const profile = this.publicProfile();
    const film = this.movie();
    return profile && film ? profile.movies.find((item) => item.tmdbId === film.tmdbId) ?? null : null;
  });
  protected readonly publicTake = computed(() => {
    const profile = this.publicProfile();
    const film = this.movie();
    return profile && film ? profile.takes.find((take) => take.tmdbId === film.tmdbId) ?? null : null;
  });

  ngOnInit(): void {
    const tmdbId = Number(this.route.snapshot.paramMap.get('tmdbId'));
    if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) { this.router.navigateByUrl('/'); return; }
    const username = this.route.snapshot.paramMap.get('username');
    if (username) {
      this.publicUsername.set(username);
      this.publicProfileService.load(username).subscribe({
        next: (profile) => this.publicProfile.set(profile),
        error: () => { this.loadError.set(true); this.loading.set(false); },
      });
    } else if (this.collectionService.movies() === null) this.collectionService.load().subscribe({ error: () => undefined });
    if (!username && this.takeService.takes() === null) this.takeService.load().subscribe({
      next: (takes) => {
        const film = this.movie();
        if (film) this.takeBody = takes.find((take) => take.tmdbId === film.tmdbId)?.body ?? '';
      },
      error: () => undefined,
    });
    this.movieSearchService.detail(tmdbId).subscribe({
      next: (movie) => { this.movie.set(movie); this.takeBody = this.takeService.takes()?.find((take) => take.tmdbId === movie.tmdbId)?.body ?? ''; this.loading.set(false); },
      error: () => { this.loadError.set(true); this.loading.set(false); },
    });
  }

  protected posterUrl(movie: MovieDetails): string | null { return this.movieSearchService.posterUrl(movie.posterPath); }
  protected backdropUrl(movie: MovieDetails): string | null { return this.movieSearchService.backdropUrl(movie.backdropPath); }
  protected displayTitle(movie: MovieDetails): string { return movie.title || movie.originalTitle || 'Untitled film'; }
  protected releaseYear(movie: MovieDetails): string { return movie.releaseDate?.slice(0, 4) || 'YEAR TBC'; }
  protected statusLabel(status: WatchStatus): string { return status === 'FINISHED' ? 'WATCHED' : status; }
  protected ratingLabel(): string {
    const rating = this.ratingHover() ?? this.savedMovie()?.rating;
    return rating ? `${rating} / 10` : 'NOT RATED';
  }
  protected isRatingFilled(value: number): boolean {
    const rating = this.ratingHover() ?? this.savedMovie()?.rating ?? 0;
    return value <= rating;
  }
  protected publicName(): string { return this.publicProfile()?.username ?? this.publicUsername() ?? 'THIS'; }
  protected toggleLibraryMenu(): void { this.libraryMenuOpen.update((open) => !open); }

  protected save(status: WatchStatus): void {
    const film = this.movie();
    if (!film || this.isSaving()) return;
    this.isSaving.set(true);
    this.collectionService.save(this.asSearchResult(film), status).subscribe({ next: () => { this.libraryMenuOpen.set(false); this.isSaving.set(false); }, error: () => this.isSaving.set(false) });
  }

  protected setStatus(status: WatchStatus): void {
    const saved = this.savedMovie();
    if (!saved) { this.save(status); return; }
    this.collectionService.updateStatus(saved.tmdbId, status).subscribe({ next: () => this.libraryMenuOpen.set(false) });
  }

  protected remove(): void {
    const saved = this.savedMovie();
    if (!saved || this.isRemoving()) return;
    if (!window.confirm(`Remove ${saved.title} from your cinema? This also removes its Take and saved rating.`)) return;
    this.isRemoving.set(true);
    this.collectionService.remove(saved.tmdbId).subscribe({ next: () => { this.libraryMenuOpen.set(false); this.isRemoving.set(false); }, error: () => this.isRemoving.set(false) });
  }

  protected logRewatch(): void {
    const saved = this.savedMovie();
    if (!saved || saved.status !== 'FINISHED' || this.isLoggingRewatch()) return;
    this.isLoggingRewatch.set(true);
    this.collectionService.logRewatch(saved.tmdbId).subscribe({
      next: () => this.isLoggingRewatch.set(false),
      error: () => this.isLoggingRewatch.set(false),
    });
  }

  protected rate(rating: number): void {
    const saved = this.savedMovie();
    if (!saved) return;
    this.ratingMovieId.set(saved.tmdbId);
    this.collectionService.updateRating(saved.tmdbId, rating).subscribe({ next: () => { this.ratingHover.set(null); this.ratingMovieId.set(null); }, error: () => this.ratingMovieId.set(null) });
  }

  protected clearRating(): void {
    const saved = this.savedMovie();
    if (!saved || !saved.rating || this.ratingMovieId() === saved.tmdbId) return;
    this.ratingMovieId.set(saved.tmdbId);
    this.collectionService.clearRating(saved.tmdbId).subscribe({
      next: () => this.ratingMovieId.set(null),
      error: () => this.ratingMovieId.set(null),
    });
  }

  protected saveTake(): void {
    const saved = this.savedMovie();
    if (!saved || !this.takeBody.trim()) return;
    this.isSavingTake.set(true);
    this.takeService.save(saved.tmdbId, this.takeBody.trim()).subscribe({ next: () => this.isSavingTake.set(false), error: () => this.isSavingTake.set(false) });
  }

  protected removeTake(): void {
    const saved = this.savedMovie();
    if (!saved || !this.existingTake() || this.isRemovingTake()) return;
    if (!window.confirm(`Remove your Take for ${saved.title}?`)) return;
    this.isRemovingTake.set(true);
    this.takeService.remove(saved.tmdbId).subscribe({
      next: () => { this.takeBody = ''; this.isRemovingTake.set(false); },
      error: () => this.isRemovingTake.set(false),
    });
  }

  private asSearchResult(movie: MovieDetails): MovieSearchResult {
    return { tmdbId: movie.tmdbId, title: this.displayTitle(movie), releaseDate: movie.releaseDate, posterPath: movie.posterPath, overview: movie.overview };
  }
}
