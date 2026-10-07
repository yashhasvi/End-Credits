import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MovieBrowseResult, MovieBrowseShelf, MovieSearchService } from './movie-search.service';

type ShelfLayout = 'rail' | 'ranked' | 'mosaic';
type ShelfState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-movie-shelf',
  template: `
    <section class="movie-shelf" [class]="'movie-shelf layout-' + layout" [attr.aria-labelledby]="headingId">
      <header class="shelf-heading">
        <p>{{ kicker }}</p>
        <h2 [id]="headingId">{{ title }}</h2>
        @if (state() === 'ready') { <span>{{ movies().length }} FILMS</span> }
      </header>

      @if (state() === 'loading') {
        <div class="shelf-skeleton" aria-label="Loading films"><i></i><i></i><i></i><i></i><i></i></div>
      } @else if (state() === 'error') {
        <div class="shelf-error" role="alert"><p>The reel is temporarily unavailable.</p><button type="button" (click)="load()">TRY AGAIN ↗</button></div>
      } @else if (movies().length) {
        <div class="shelf-reel">
          @for (movie of movies(); track movie.tmdbId; let index = $index) {
            <article class="shelf-film" [style.--order]="index">
              @if (layout === 'ranked') { <span class="shelf-rank" aria-hidden="true">0{{ index + 1 }}</span> }
              <button type="button" class="shelf-poster" (click)="openFilm(movie)" [attr.aria-label]="'Open ' + titleFor(movie)">
                @if (posterUrl(movie)) { <img [src]="posterUrl(movie)!" [alt]="'Poster for ' + titleFor(movie)" loading="lazy" /> }
                @else { <span class="shelf-no-poster">NO<br>POSTER</span> }
                <span class="shelf-enter">ENTER FILM ↗</span>
              </button>
              <div class="shelf-copy"><p>{{ yearFor(movie) }} @if (movie.originalLanguage) { <span>/ {{ movie.originalLanguage.toUpperCase() }}</span> }</p><h3>{{ titleFor(movie) }}</h3></div>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    :host{display:block;min-width:0}.movie-shelf{color:#f2fbff}.shelf-heading{display:grid;grid-template-columns:1fr auto;align-items:end;gap:15px;margin-bottom:clamp(24px,3vw,38px);border-top:1px solid rgba(203,237,248,.25);padding-top:16px}.shelf-heading p,.shelf-heading span{margin:0;color:#a9d5e3;font:800 .72rem/1.2 var(--body);letter-spacing:.1em}.shelf-heading h2{grid-column:1/-1;margin:0;color:#f7fcff;font:900 clamp(2.5rem,5vw,5.6rem)/.78 var(--display);letter-spacing:-.09em}.shelf-heading span{justify-self:end;color:#d6eff7}.shelf-reel{display:grid;grid-auto-flow:column;grid-auto-columns:clamp(155px,16.5vw,232px);gap:clamp(14px,2vw,28px);overflow-x:auto;overscroll-behavior-inline:contain;padding:5px 2px 22px;scroll-snap-type:x proximity;scrollbar-color:rgba(164,222,240,.4) transparent}.shelf-film{position:relative;min-width:0;scroll-snap-align:start;animation:shelf-reveal .58s both cubic-bezier(.2,.8,.25,1);animation-delay:calc(var(--order) * 60ms)}.shelf-poster{position:relative;display:block;width:100%;aspect-ratio:2/3;overflow:hidden;border:1px solid rgba(217,246,255,.15);padding:0;background:#102439;color:#f4fbff;cursor:pointer;box-shadow:0 16px 32px rgba(0,0,0,.28);transition:transform .35s cubic-bezier(.2,.8,.25,1),box-shadow .35s ease,border-color .35s}.shelf-poster img{width:100%;height:100%;object-fit:cover;filter:saturate(.82);transition:transform .55s ease,filter .35s}.shelf-poster::after{content:"";position:absolute;inset:7px;border:1px solid rgba(235,250,255,.32);opacity:0;transition:opacity .3s}.shelf-enter{position:absolute;right:10px;bottom:10px;left:10px;color:#f7fcff;font:800 .64rem/1 var(--body);letter-spacing:.08em;opacity:0;transform:translateY(5px);transition:opacity .25s,transform .25s;text-align:left}.shelf-film:hover .shelf-poster,.shelf-poster:focus-visible{border-color:#b8f2ff;transform:translateY(-7px);box-shadow:0 25px 44px rgba(0,0,0,.44);outline:none}.shelf-film:hover .shelf-poster img,.shelf-poster:focus-visible img{transform:scale(1.06);filter:saturate(1.04)}.shelf-film:hover .shelf-poster::after,.shelf-poster:focus-visible::after{opacity:1}.shelf-film:hover .shelf-enter,.shelf-poster:focus-visible .shelf-enter{opacity:1;transform:none}.shelf-no-poster{display:grid;place-items:center;height:100%;background:linear-gradient(145deg,#16415c,#17142d);color:#d7f3fb;font:900 1rem/.85 var(--display);letter-spacing:-.05em;text-align:center}.shelf-copy{padding:12px 2px 0}.shelf-copy p{margin:0 0 7px;color:#a9d2df;font:800 .68rem/1.2 var(--body);letter-spacing:.08em}.shelf-copy p span{color:#d8f5fc}.shelf-copy h3{margin:0;color:#f4fbff;font:900 clamp(1.05rem,1.45vw,1.45rem)/.95 var(--display);letter-spacing:-.055em}.shelf-rank{position:absolute;z-index:2;top:-12px;left:-7px;color:#c4f3ff;font:900 clamp(3rem,5vw,5.4rem)/.7 var(--display);letter-spacing:-.1em;mix-blend-mode:screen;pointer-events:none}.layout-ranked .shelf-film{padding-top:23px}.layout-mosaic .shelf-reel{display:grid;grid-template-columns:1.45fr .8fr .8fr;grid-template-rows:auto auto;grid-auto-flow:row;grid-auto-columns:auto;overflow:visible}.layout-mosaic .shelf-film:nth-child(1){grid-row:span 2}.layout-mosaic .shelf-film:nth-child(2),.layout-mosaic .shelf-film:nth-child(3){align-self:start}.layout-mosaic .shelf-film:nth-child(4){grid-column:2/span 2}.shelf-skeleton{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:clamp(14px,2vw,28px)}.shelf-skeleton i{display:block;aspect-ratio:2/3;background:linear-gradient(100deg,rgba(120,168,185,.08),rgba(183,236,249,.16),rgba(120,168,185,.08));background-size:200% 100%;animation:shelf-shimmer 1.4s ease-in-out infinite}.shelf-error{display:flex;align-items:center;justify-content:space-between;gap:20px;border-top:1px solid rgba(255,194,210,.35);padding:18px 0;color:#ffc8d6}.shelf-error p{margin:0;font:600 1rem/1.4 var(--body)}.shelf-error button{border:0;border-bottom:1px solid currentColor;padding:0 0 4px;background:transparent;color:#f8fbff;font:800 .7rem/1 var(--body);letter-spacing:.09em;white-space:nowrap;cursor:pointer}@keyframes shelf-reveal{from{opacity:0;transform:translateY(22px);clip-path:inset(10% 0 0)}to{opacity:1;transform:none;clip-path:inset(0)}}@keyframes shelf-shimmer{to{background-position:-200% 0}}@media(max-width:700px){.shelf-heading h2{font-size:clamp(2.55rem,12vw,4.5rem)}.shelf-reel{grid-auto-columns:minmax(148px,56vw);gap:15px}.layout-mosaic .shelf-reel{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.layout-mosaic .shelf-film:nth-child(1){grid-row:auto}.layout-mosaic .shelf-film:nth-child(4){grid-column:auto}.shelf-skeleton{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(prefers-reduced-motion:reduce){.shelf-film,.shelf-skeleton i,.shelf-poster,.shelf-poster img,.shelf-enter{animation:none;transition:none}}
  `],
})
export class MovieShelfComponent implements OnInit {
  private readonly moviesApi = inject(MovieSearchService);
  private readonly router = inject(Router);

  @Input({ required: true }) shelf!: MovieBrowseShelf;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) kicker!: string;
  @Input() layout: ShelfLayout = 'rail';

  protected readonly movies = signal<MovieBrowseResult[]>([]);
  protected readonly state = signal<ShelfState>('loading');

  get headingId(): string { return `shelf-${this.shelf}`; }

  ngOnInit(): void { this.load(); }

  protected load(): void {
    this.state.set('loading');
    this.moviesApi.browse(this.shelf).subscribe({
      next: (response) => { this.movies.set(response.results); this.state.set('ready'); },
      error: () => this.state.set('error'),
    });
  }

  protected posterUrl(movie: MovieBrowseResult): string | null { return this.moviesApi.posterUrl(movie.posterPath); }
  protected titleFor(movie: MovieBrowseResult): string { return movie.title || 'Untitled film'; }
  protected yearFor(movie: MovieBrowseResult): string { return movie.releaseDate?.slice(0, 4) || 'YEAR TBC'; }
  protected openFilm(movie: MovieBrowseResult): void { this.router.navigate(['/movie', movie.tmdbId]); }
}
