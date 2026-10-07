import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MovieSearchResult, MovieSearchService } from './movie-search.service';

@Component({
  selector: 'app-movie-poster',
  template: `
    <article class="result" [style.--order]="index">
      <button class="result-poster" style="border:0;padding:0;text-align:inherit;width:100%" type="button" (click)="openMovie()" [attr.aria-label]="'Open ' + (movie.title || 'movie')">
        @if (posterUrl) { <img [src]="posterUrl" [alt]="movie.title ? 'Poster for ' + movie.title : 'Movie poster'" /> }
        @else { <div class="no-poster">NO<br>POSTER</div> }
        <span class="result-number">{{ index + 1 < 10 ? '0' : '' }}{{ index + 1 }}</span>
      </button>
      <div class="result-copy">
        <p>{{ releaseYear }} <span>/</span> TMDB ARCHIVE</p>
        <h3>{{ movie.title || 'Untitled film' }}</h3>
        @if (movie.overview) { <p class="overview">{{ movie.overview }}</p> }
        <button class="open-film" type="button" (click)="openMovie()">OPEN FILM ↗</button>
      </div>
    </article>
  `,
  styles: [`
    :host{display:block;min-width:0}.result{color:#f6fbff;animation:poster-reveal .7s both cubic-bezier(.2,.8,.25,1);animation-delay:calc(var(--order) * 80ms)}.result-poster{position:relative;aspect-ratio:2/3;overflow:hidden;background:linear-gradient(145deg,#123048,#16142d);box-shadow:0 18px 35px rgba(0,0,0,.3);transition:transform .45s cubic-bezier(.2,.8,.25,1),box-shadow .45s ease}.result-poster::before{content:"";position:absolute;z-index:1;inset:8px;border:1px solid rgba(246,252,255,.2);opacity:0;transition:opacity .35s}.result-poster::after{content:"";position:absolute;z-index:1;right:0;bottom:0;left:0;height:36%;background:linear-gradient(transparent,rgba(4,8,17,.68));opacity:0;transition:opacity .35s}.result-poster img{width:100%;height:100%;object-fit:cover;filter:saturate(.84);transition:transform .6s cubic-bezier(.2,.8,.25,1),filter .45s ease}.result:hover .result-poster{transform:translateY(-8px);box-shadow:0 26px 43px rgba(0,0,0,.46)}.result:hover img{transform:scale(1.065);filter:saturate(1.06)}.result:hover .result-poster::before,.result:hover .result-poster::after{opacity:1}.no-poster{display:grid;place-items:center;height:100%;background:radial-gradient(circle at 28% 20%,rgba(130,227,249,.25),transparent 30%),linear-gradient(145deg,#153e59,#171431);color:#d5effa;font:900 1rem/.85 var(--display);letter-spacing:-.05em;text-align:center}.result-number{position:absolute;z-index:2;right:14px;bottom:13px;color:#fff;font:800 .82rem/1 var(--body);letter-spacing:.08em;opacity:0;transform:translateY(6px);transition:opacity .3s,transform .3s}.result:hover .result-number{opacity:1;transform:none}.result-copy{min-width:0;padding-top:16px}.result-copy>p:first-child{margin:0 0 9px;color:#acd5e5;font:800 .78rem/1.2 var(--body);letter-spacing:.07em}.result-copy>p span{color:#e9b1ff}.result-copy h3{margin:0;font:900 clamp(1.25rem,1.7vw,1.75rem)/.96 var(--display);letter-spacing:-.055em}.overview{display:-webkit-box;overflow:hidden;margin:11px 0 0;color:#c8d8e1;font-size:.98rem;line-height:1.42;-webkit-box-orient:vertical;-webkit-line-clamp:2;opacity:.76;transition:opacity .3s}.result:hover .overview{opacity:1}.collection-action{display:grid;grid-template-columns:auto 1fr;gap:7px 11px;align-items:center;margin-top:19px;padding-top:13px;border-top:1px solid rgba(202,232,248,.2)}.collection-action label{color:#b8d8e4;font:800 .72rem/1 var(--body);letter-spacing:.08em}.collection-action select{min-width:0;border:0;border-bottom:1px solid rgba(202,232,248,.45);padding:4px 0;background:transparent;color:#f6fbff;font:800 .78rem/1.1 var(--body);letter-spacing:.05em;outline:none}.collection-action option{background:#101a29;color:#f6fbff}.bookmark-button{display:inline-flex;grid-column:1/-1;gap:8px;align-items:center;justify-self:start;border:0;border-bottom:1px solid rgba(206,239,250,.6);padding:8px 0 4px;background:transparent;color:#ecfaff;font:800 .78rem/1 var(--body);letter-spacing:.09em}.bookmark-button svg{width:12px;height:15px;fill:none;stroke:currentColor;stroke-width:1.35}.bookmark-button:hover:not(:disabled){color:#92eaff;border-color:#92eaff}.bookmark-button:hover:not(:disabled) svg{fill:currentColor}.bookmark-button:disabled{opacity:.6}.saved-rating{grid-column:1/-1;margin:0;color:#9fddef;font:800 .66rem/1.2 var(--body);letter-spacing:.08em}.collection-error{grid-column:1/-1;margin:0;color:#ffc7d7;font-size:.82rem;line-height:1.35}@keyframes poster-reveal{from{opacity:0;transform:translateY(30px);clip-path:inset(14% 0 0 0)}to{opacity:1;transform:none;clip-path:inset(0)}}@media(max-width:600px){.result-copy{padding-top:12px}.result-copy h3{font-size:clamp(1.18rem,5vw,1.55rem)}.result-copy>p:first-child{font-size:.7rem}.overview{font-size:.9rem}}@media(prefers-reduced-motion:reduce){.result,.result-poster,.result-poster img,.result-number,.overview{animation:none;transition:none}}
  `, `
    .open-film{margin-top:18px;border:0;border-bottom:1px solid rgba(206,239,250,.6);padding:7px 0 4px;background:transparent;color:#ecfaff;font:800 .75rem/1 var(--body);letter-spacing:.09em}.open-film:hover{color:#92eaff;border-color:#92eaff}
  `],
})
export class MoviePosterComponent {
  private readonly movieSearchService = inject(MovieSearchService);
  private readonly router = inject(Router);
  @Input({ required: true }) movie!: MovieSearchResult;
  @Input({ required: true }) index!: number;

  get posterUrl(): string | null { return this.movieSearchService.posterUrl(this.movie.posterPath); }
  get releaseYear(): string { return this.movie.releaseDate?.slice(0, 4) || 'YEAR TBC'; }

  protected openMovie(): void { this.router.navigate(['/movie', this.movie.tmdbId]); }
}
