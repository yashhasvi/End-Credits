import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CurrentUser } from './auth/auth.service';
import { CollectionMovie, CollectionService, WatchStatus } from './collection.service';
import { MovieSearchService } from './movie-search.service';
import { ProfileVisibilityService } from './profile-visibility.service';
import { MovieTake, TakeService } from './take.service';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  styles: [`
    .my-five-reel{overflow-x:auto;overscroll-behavior-inline:contain;scroll-snap-type:inline proximity;scrollbar-width:none;cursor:grab}.my-five-reel:active{cursor:grabbing}.my-five-reel::-webkit-scrollbar{display:none}.reel-track{padding-right:clamp(44px,6vw,90px)}.reel-frame{scroll-snap-align:start;cursor:pointer}.reel-frame:focus-visible{outline:2px solid #b8f2ff;outline-offset:5px}.reel-scroll-hint{position:sticky;right:0;bottom:17px;z-index:4;float:right;margin:0 17px 0 0;padding:6px 8px;background:rgba(5,10,18,.7);color:#b9e5f1;font:800 .6rem/1 var(--body);letter-spacing:.08em;pointer-events:none}.reel-scroll-hint span{margin-left:8px;color:#f0fbff}.open-film-link{border:0;border-bottom:1px solid rgba(211,243,251,.58);padding:5px 0 3px;background:transparent;color:#e9fbff;font:800 .67rem/1 var(--body);letter-spacing:.08em}.open-film-link:hover{color:#92eaff;border-color:#92eaff}@media(max-width:720px){.my-five-reel{overflow:visible;margin-inline:0;padding:18px 0;background:transparent;cursor:default}.my-five-reel::before,.my-five-reel::after{display:none}.reel-track{display:grid;width:auto;gap:24px;padding:0}.reel-frame,.reel-frame:nth-child(even){display:block;width:min(78vw,310px);margin:0 auto;padding:14px;background:linear-gradient(135deg,rgba(19,37,56,.88),rgba(9,16,27,.96))}.reel-frame .poster-shell{aspect-ratio:2/3}.reel-frame .my-five-caption{display:grid;grid-template-columns:1fr auto;align-items:end;gap:8px}.reel-frame .my-five-caption h3{font-size:clamp(1.5rem,7vw,2.2rem)}.reel-frame .my-five-caption p{margin:0}.reel-frame .film-rating{grid-column:1/-1}.reel-scroll-hint{display:none}}
  `, `
    .take-entry{display:grid!important;grid-template-columns:minmax(92px,.42fr) minmax(0,1fr);gap:clamp(18px,3vw,34px);align-items:start}.take-film-image{aspect-ratio:2/3;border:0;padding:0;overflow:hidden;background:#122237;box-shadow:0 15px 30px rgba(0,0,0,.3)}.take-film-image img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.82);transition:transform .4s ease,filter .3s ease}.take-film-image:hover img{transform:scale(1.05);filter:saturate(1.05)}.take-film-image span{display:grid;place-items:center;height:100%;color:#c4edf8;font:900 .8rem/.85 var(--display);text-align:center}.take-entry-copy>span{color:#a8dbe9;font:800 .7rem/1 var(--body);letter-spacing:.1em}.take-entry-copy blockquote{margin:16px 0 22px}.take-entry-copy>div{display:flex;align-items:center;flex-wrap:wrap;gap:8px 13px}.take-entry-copy>div p{margin:0;color:#edfaff}.take-entry-copy>div small{color:#a5dce9;font:800 .64rem/1 var(--body);letter-spacing:.08em}.take-entry-copy>div button,.all-takes-toggle{border:0;border-bottom:1px solid rgba(214,243,251,.58);padding:4px 0;background:transparent;color:#eafaff;font:800 .68rem/1 var(--body);letter-spacing:.08em}.take-entry-copy>div button{margin-left:auto}.all-takes-toggle{display:block;margin:clamp(32px,5vw,64px) auto 0}.take-entry-copy>div button:hover,.all-takes-toggle:hover{color:#92eaff;border-color:#92eaff}@media(max-width:620px){.take-entry{grid-template-columns:92px minmax(0,1fr);gap:15px}.take-entry-copy blockquote{margin:12px 0 17px;font-size:clamp(1.55rem,7vw,2.25rem)}.take-entry-copy>div{display:grid;gap:7px}.take-entry-copy>div button{justify-self:start;margin-left:0}}
  `],
})
export class ProfileComponent implements OnInit {
  private readonly collectionService = inject(CollectionService);
  private readonly movieSearchService = inject(MovieSearchService);
  private readonly takeService = inject(TakeService);
  private readonly profileVisibilityService = inject(ProfileVisibilityService);
  private readonly router = inject(Router);
  @Input({ required: true }) user!: CurrentUser;
  private lastShareRequest = 0;
  @Input() set shareRequest(request: number) {
    if (request > this.lastShareRequest) this.sharePanelOpen.set(true);
    this.lastShareRequest = request;
  }
  protected readonly movies = this.collectionService.movies;
  protected readonly myFive = this.collectionService.myFive;
  protected readonly takes = this.takeService.takes;
  protected readonly loadError = signal(false);
  protected readonly editingMyFive = signal(false);
  protected readonly myFiveSelection = signal<number[]>([]);
  protected readonly isSavingMyFive = signal(false);
  protected readonly myFiveError = signal(false);
  protected readonly rewatchingId = signal<number | null>(null);
  protected readonly statusError = signal<string | null>(null);
  protected readonly shareMessage = signal<string | null>(null);
  protected readonly sharePanelOpen = signal(false);
  protected readonly profilePublic = signal<boolean | null>(null);
  protected readonly isUpdatingVisibility = signal(false);
  protected readonly takeMovie = signal<CollectionMovie | null>(null);
  protected readonly isSavingTake = signal(false);
  protected readonly ratingMovieId = signal<number | null>(null);
  protected readonly showingAllTakes = signal(false);
  protected takeBody = '';
  protected readonly watching = computed(() => (this.movies() ?? []).filter((movie) => movie.status === 'WATCHING'));
  protected readonly watchlist = computed(() => (this.movies() ?? []).filter((movie) => movie.status === 'WATCHLIST'));
  protected readonly watched = computed(() => (this.movies() ?? []).filter((movie) => movie.status === 'FINISHED'));
  protected readonly heroFilms = computed(() => {
    const five = this.myFive() ?? [];
    return (five.length ? five : [...this.watching(), ...this.watched(), ...this.watchlist()]).slice(0, 3);
  });
  protected readonly visibleTakes = computed(() => {
    const takes = this.takes() ?? [];
    return this.showingAllTakes() ? takes : takes.slice(0, 6);
  });

  ngOnInit(): void {
    if (this.movies() === null) this.collectionService.load().subscribe({ error: () => this.loadError.set(true) });
    if (this.myFive() === null) this.collectionService.loadMyFive().subscribe({ error: () => this.loadError.set(true) });
    if (this.takes() === null) this.takeService.load().subscribe({ error: () => this.loadError.set(true) });
    this.profileVisibilityService.load().subscribe({
      next: ({ profilePublic }) => this.profilePublic.set(profilePublic),
      error: () => this.statusError.set('Profile visibility could not be loaded.'),
    });
  }

  protected posterUrl(movie: CollectionMovie): string | null { return this.movieSearchService.posterUrl(movie.posterPath); }
  protected releaseYear(movie: CollectionMovie): string { return movie.releaseDate?.slice(0, 4) || 'YEAR TBC'; }
  protected takeFor(tmdbId: number): MovieTake | undefined { return this.takes()?.find((take) => take.tmdbId === tmdbId); }
  protected movieFor(tmdbId: number): CollectionMovie | undefined { return this.movies()?.find((movie) => movie.tmdbId === tmdbId); }
  protected openMovie(movie: CollectionMovie): void { this.router.navigate(['/movie', movie.tmdbId]); }
  protected toggleAllTakes(): void { this.showingAllTakes.update((showing) => !showing); }

  protected closeSharePanel(): void { this.sharePanelOpen.set(false); }

  protected async shareProfile(): Promise<void> {
    if (!this.profilePublic()) { this.shareMessage.set('Make your profile public before sharing its link.'); return; }
    const url = `${window.location.origin}/u/${encodeURIComponent(this.user.username)}`;
    this.shareMessage.set(null);
    try {
      if (navigator.share) { await navigator.share({ title: `${this.user.username}'s End Credits`, url }); this.shareMessage.set('Your public cinema profile is ready to share.'); return; }
      await navigator.clipboard.writeText(url); this.shareMessage.set('Public profile link copied.');
    } catch { this.shareMessage.set('Sharing was cancelled or is unavailable on this browser.'); }
  }

  protected async copyProfileLink(): Promise<void> {
    if (!this.profilePublic()) { this.shareMessage.set('Make the profile public before copying its link.'); return; }
    const url = `${window.location.origin}/u/${encodeURIComponent(this.user.username)}`;
    try {
      await navigator.clipboard.writeText(url);
      this.shareMessage.set('Public profile link copied.');
    } catch { this.shareMessage.set('Copying is unavailable in this browser.'); }
  }

  protected toggleProfileVisibility(): void {
    const nextVisibility = !this.profilePublic();
    this.isUpdatingVisibility.set(true); this.statusError.set(null);
    this.profileVisibilityService.update(nextVisibility).subscribe({
      next: ({ profilePublic }) => { this.profilePublic.set(profilePublic); this.shareMessage.set(profilePublic ? 'Your cinema profile is public and ready to share.' : 'Your cinema profile is now private. Existing public links no longer open it.'); this.isUpdatingVisibility.set(false); },
      error: () => { this.statusError.set('Profile visibility could not be updated.'); this.isUpdatingVisibility.set(false); },
    });
  }

  protected changeStatus(tmdbId: number, status: WatchStatus): void {
    this.statusError.set(null);
    this.collectionService.updateStatus(tmdbId, status).subscribe({ error: () => this.statusError.set('The status could not be updated. Your saved film has not moved.') });
  }

  protected logRewatch(tmdbId: number): void {
    this.rewatchingId.set(tmdbId); this.statusError.set(null);
    this.collectionService.logRewatch(tmdbId).subscribe({ complete: () => this.rewatchingId.set(null), error: () => { this.rewatchingId.set(null); this.statusError.set('The rewatch could not be recorded. Please try again.'); } });
  }

  protected openMyFiveEditor(): void { this.editingMyFive.update((editing) => !editing); this.myFiveSelection.set((this.myFive() ?? []).map((movie) => movie.tmdbId)); this.myFiveError.set(false); }
  protected isMyFiveSelected(tmdbId: number): boolean { return this.myFiveSelection().includes(tmdbId); }
  protected toggleMyFive(tmdbId: number): void { this.myFiveSelection.update((ids) => ids.includes(tmdbId) ? ids.filter((id) => id !== tmdbId) : [...ids, tmdbId]); }
  protected saveMyFive(): void {
    this.isSavingMyFive.set(true); this.myFiveError.set(false);
    this.collectionService.saveMyFive(this.myFiveSelection()).subscribe({ next: () => { this.editingMyFive.set(false); this.isSavingMyFive.set(false); }, error: () => { this.myFiveError.set(true); this.isSavingMyFive.set(false); } });
  }

  protected openTakeComposer(movie: CollectionMovie): void { this.takeMovie.set(movie); this.takeBody = this.takeFor(movie.tmdbId)?.body ?? ''; }
  protected closeTakeComposer(): void { this.takeMovie.set(null); this.takeBody = ''; }
  protected saveTake(): void {
    const movie = this.takeMovie();
    if (!movie || !this.takeBody.trim()) return;
    this.isSavingTake.set(true);
    this.takeService.save(movie.tmdbId, this.takeBody.trim()).subscribe({ next: () => { this.closeTakeComposer(); this.isSavingTake.set(false); }, error: () => this.isSavingTake.set(false) });
  }

  protected rate(movie: CollectionMovie, rating: number): void {
    this.ratingMovieId.set(movie.tmdbId);
    this.collectionService.updateRating(movie.tmdbId, rating).subscribe({
      next: (saved) => {
        if (this.takeMovie()?.tmdbId === saved.tmdbId) this.takeMovie.set(saved);
        this.ratingMovieId.set(null);
      },
      error: () => {
        this.ratingMovieId.set(null);
        this.statusError.set('Your rating could not be saved. Please try again.');
      },
    });
  }
}
