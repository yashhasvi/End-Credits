import { Component, EventEmitter, OnDestroy, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subject, Subscription, catchError, debounceTime, switchMap, tap } from 'rxjs';
import { MoviePosterComponent } from './movie-poster.component';
import { MovieSearchResult, MovieSearchService } from './movie-search.service';

type SearchState = 'idle' | 'loading' | 'results' | 'empty' | 'error';

@Component({
  selector: 'app-movie-search',
  imports: [FormsModule, MoviePosterComponent],
  template: `
    <section class="archive-search" [class.results-active]="results().length > 0" id="discover" aria-labelledby="search-title">
      <header><h2 id="search-title">SEARCH THE ARCHIVE <span>↗</span></h2><p>Search real movie metadata, then choose what stays with you.</p></header>
      <label class="search-input" [class.search-active]="state() !== 'idle' || query.length > 0">
        <input [(ngModel)]="query" (ngModelChange)="queueSearch($event)" type="search" autocomplete="off" placeholder="Search movies…" aria-label="Search movies" />
        <button type="button" (click)="searchNow()" aria-label="Search">SEARCH</button>
      </label>
      @if (state() === 'idle') { <p class="search-prompt">Enter at least two characters to start.</p> }
      @if (state() === 'loading') { <p class="search-state loading" role="status"><span></span> SEARCHING THE ARCHIVE</p> }
      @if (state() === 'empty') { <p class="search-state"><strong>Nothing surfaced.</strong> Try another title or a broader search.</p> }
      @if (state() === 'error') { <p class="search-state error" role="alert"><strong>The archive is momentarily out of focus.</strong><button type="button" (click)="searchNow()">TRY AGAIN ↗</button></p> }
      @if (state() === 'results') {
        <div class="result-title"><p>SEARCH RESULTS / {{ results().length }} FOUND</p><span>{{ lastSuccessfulQuery() }}</span></div>
        <div class="result-list">@for (movie of results(); track movie.tmdbId; let index = $index) { <app-movie-poster [movie]="movie" [index]="index"></app-movie-poster> }</div>
        <p class="tmdb-credit">Movie metadata and artwork provided by TMDB.</p>
      }
    </section>
  `,
  styles: [`
    :host{display:block;min-width:0}.archive-search{align-self:center;min-height:0;padding:clamp(8px,1vw,16px) 0;transition:padding .5s ease}.archive-search header{padding-bottom:20px;border-bottom:1px solid rgba(204,235,250,.28)}.archive-search header h2{margin:0;color:#f5fbff;font:900 clamp(1.75rem,2.25vw,2.35rem)/.96 var(--display);letter-spacing:-.055em}.archive-search header h2 span{color:#a7e9ff}.archive-search header p{max-width:355px;margin:13px 0 0;color:#cfdee5;font:500 var(--type-lede)/1.46 var(--body)}.search-input{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:16px;min-height:58px;margin-top:28px;border:0;border-bottom:1px solid rgba(203,233,246,.42);padding:0 2px;background:transparent;transition:border-color .25s,background .25s,margin .45s ease}.search-input:focus-within,.search-active{border-color:#c2f3ff}.search-input input{min-width:0;border:0;outline:0;background:transparent;color:#f8fbff;font:600 1.06rem/1.2 var(--body)}.search-input input::placeholder{color:#a8bec9;opacity:1}.search-input button{min-height:40px;border:0;border-left:1px solid rgba(203,233,246,.32);padding:0 0 0 16px;background:transparent;color:#e6faff;font:800 var(--type-meta)/1 var(--body);letter-spacing:.1em;transition:transform .2s,color .2s}.search-input button:hover{color:#97eaff;transform:translateX(4px)}.search-prompt{margin:13px 0 0;color:#b4cbd5;font-size:.92rem;line-height:1.4}.search-state{margin:22px 0 0;padding:16px 0;border-top:1px solid rgba(203,233,246,.22);color:#d2e0e7;font-size:.98rem;line-height:1.45}.search-state strong{color:#f6fbff}.search-state.error{color:#ffd0df}.search-state button{display:block;margin-top:12px;border:0;border-bottom:1px solid currentColor;padding:0 0 3px;background:transparent;color:#fff;font:800 var(--type-meta)/1 var(--body);letter-spacing:.08em}.loading{display:flex;align-items:center;gap:10px;color:#c9f2ff;font:800 var(--type-meta)/1 var(--body);letter-spacing:.08em}.loading span{width:20px;height:20px;border:2px solid rgba(186,237,255,.23);border-top-color:#c9f7ff;border-radius:50%;animation:spin .75s linear infinite}.result-title{display:flex;align-items:baseline;justify-content:space-between;gap:18px;margin:clamp(34px,4vw,54px) 0 0;padding:0 0 14px;border-bottom:1px solid rgba(203,233,246,.35)}.result-title p,.tmdb-credit{margin:0;color:#b9e0ef;font:800 var(--type-meta)/1.2 var(--body);letter-spacing:.09em}.result-title span{max-width:45%;overflow:hidden;color:#edf9ff;font:700 .94rem/1.2 var(--body);text-overflow:ellipsis;white-space:nowrap}.result-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(16px,2vw,28px);margin-top:22px}.tmdb-credit{margin-top:22px;color:#9bb2bd;font-size:.74rem}.archive-search.results-active{display:grid;grid-template-columns:minmax(0,.85fr) minmax(320px,1.15fr);column-gap:clamp(28px,5vw,76px);align-items:center;min-height:0;padding:0;background:none}.results-active header{padding-bottom:0;border-bottom:0}.results-active header p{display:none}.results-active .search-input{min-height:54px;margin:0}.results-active .result-title,.results-active .result-list,.results-active .tmdb-credit,.results-active .search-state{grid-column:1/-1}.results-active .result-title{margin-top:20px;padding-bottom:11px}.results-active .result-list{margin-top:17px}.results-active .search-state{margin-top:18px}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:1120px){.result-list{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:780px){.archive-search{padding:0}.archive-search header p{max-width:500px}.search-input{margin-top:24px}.archive-search.results-active{display:grid;grid-template-columns:1fr;gap:20px;padding:0}.result-list{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.result-title{margin-top:36px}.results-active .result-title{margin-top:8px}}@media(max-width:470px){.search-input{gap:12px;min-height:56px}.search-input button{padding-left:12px;font-size:.72rem}.result-list{gap:14px}.result-title p{font-size:.7rem}.result-title span{font-size:.86rem}}@media(prefers-reduced-motion:reduce){.loading span,.search-input,.search-input button,.archive-search{animation:none;transition:none}}
  `],
})
export class MovieSearchComponent implements OnDestroy {
  private readonly movieSearchService = inject(MovieSearchService);
  private readonly searchTerms = new Subject<string>();
  private readonly searchSubscription: Subscription;
  protected query = '';
  protected readonly state = signal<SearchState>('idle');
  protected readonly results = signal<MovieSearchResult[]>([]);
  protected readonly lastSuccessfulQuery = signal('');
  @Output() resultsChanged = new EventEmitter<boolean>();

  constructor() {
    this.searchSubscription = this.searchTerms.pipe(
      debounceTime(320),
      switchMap((query) => {
        if (query.length < 2) { this.setResultsActive(false); this.state.set('idle'); this.results.set([]); return EMPTY; }
        this.setResultsActive(this.results().length > 0); this.state.set('loading');
        return this.movieSearchService.search(query).pipe(
          tap({ next: (response) => { this.results.set(response.results); this.lastSuccessfulQuery.set(query); this.setResultsActive(response.results.length > 0); this.state.set(response.results.length ? 'results' : 'empty'); }, error: () => { this.setResultsActive(this.results().length > 0); this.state.set('error'); } }),
          catchError(() => EMPTY),
        );
      }),
    ).subscribe();
  }

  protected queueSearch(value: string): void { const query = value.trim(); if (query.length < 2) { this.setResultsActive(false); this.state.set('idle'); this.results.set([]); } this.searchTerms.next(query); }
  protected searchNow(): void { const query = this.query.trim(); if (query.length >= 2) { this.searchTerms.next(query); } }
  ngOnDestroy(): void { this.searchSubscription.unsubscribe(); }
  private setResultsActive(active: boolean): void { this.resultsChanged.emit(active); }
}
