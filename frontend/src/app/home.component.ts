import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrentUser } from './auth/auth.service';
import { CollectionMovie, CollectionService } from './collection.service';
import { HomeNavigationComponent } from './home-navigation.component';
import { MovieBrowseResult, MovieBrowseShelf, MovieDetails, MovieSearchService } from './movie-search.service';
import { VibeId, VibeTableComponent, VibeTableSelection } from './vibe-table.component';

type HomeFilm = Pick<MovieBrowseResult, 'tmdbId' | 'title' | 'releaseDate' | 'posterPath'>;

/**
 * Vibe Table V1 is deliberately transparent: every conceptual selection maps
 * to a fixed, allowlisted TMDB genre shelf. It is not an AI recommendation model.
 */
const VIBE_SHELF: Record<VibeId, MovieBrowseShelf> = {
  comfort: 'comedy',
  devastating: 'drama',
  chaos: 'action',
  love: 'romance',
  strange: 'science-fiction',
  escape: 'fantasy',
  nostalgia: 'animation',
  adrenaline: 'action',
  quiet: 'drama',
};

@Component({
  selector: 'app-home',
  imports: [HomeNavigationComponent, RouterLink, VibeTableComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  private readonly collection = inject(CollectionService);
  private readonly moviesApi = inject(MovieSearchService);
  private readonly router = inject(Router);

  @Input({ required: true }) user!: CurrentUser;
  @Output() signOut = new EventEmitter<void>();

  protected readonly outsideFilms = signal<MovieBrowseResult[]>([]);
  protected readonly outsideLoadFailed = signal(false);
  protected readonly vibeFilms = signal<MovieBrowseResult[]>([]);
  protected readonly watchingFilm = signal<MovieDetails | null>(null);
  protected readonly activeVibe = signal('STRANGE');
  protected readonly vibeNote = signal('TMDB science-fiction genre shelf');
  ngOnInit(): void {
    if (this.collection.movies() === null) {
      this.collection.load().subscribe({ next: (movies) => this.initialisePersonalCinema(movies) });
    } else {
      this.initialisePersonalCinema(this.collection.movies() ?? []);
    }
    this.moviesApi.browse('world-cinema').subscribe({
      next: (response) => this.outsideFilms.set(response.results.slice(0, 10)),
      error: () => this.outsideLoadFailed.set(true),
    });
    this.loadVibe('strange', 'STRANGE', 'TMDB science-fiction genre shelf');
  }

  protected chooseVibe(selection: VibeTableSelection): void {
    this.loadVibe(selection.id, selection.label, 'TMDB genre signals / ' + selection.tmdbGenreIds.join(', '));
  }

  protected posterUrl(film: HomeFilm): string | null {
    return this.moviesApi.posterUrl(film.posterPath);
  }

  protected backdropUrl(film: Pick<MovieBrowseResult, 'backdropPath'> | MovieDetails): string | null {
    return this.moviesApi.backdropUrl(film.backdropPath);
  }

  /** A saved film always has a poster; use it when TMDB has no wide backdrop. */
  protected screeningImageUrl(film: MovieDetails): string | null {
    return this.backdropUrl(film) ?? this.moviesApi.posterUrl(film.posterPath);
  }

  protected titleFor(film: HomeFilm | MovieDetails): string {
    return film.title || ('originalTitle' in film ? film.originalTitle : null) || 'Untitled film';
  }

  protected yearFor(film: Pick<MovieBrowseResult, 'releaseDate'>): string {
    return film.releaseDate?.slice(0, 4) || 'YEAR TBC';
  }

  protected genresFor(film: MovieDetails): string {
    return film.genres.slice(0, 2).join(' / ');
  }

  protected openFilm(film: HomeFilm | MovieDetails): void {
    this.router.navigate(['/movie', film.tmdbId]);
  }

  private loadVibe(id: VibeId, label: string, note: string): void {
    this.activeVibe.set(label);
    this.vibeNote.set(note);
    this.moviesApi.browse(VIBE_SHELF[id]).subscribe({
      next: (response) => this.vibeFilms.set(response.results.slice(0, 9)),
      error: () => this.vibeFilms.set([]),
    });
  }

  private initialisePersonalCinema(movies: CollectionMovie[]): void {
    const watching = movies.find((movie) => movie.status === 'WATCHING');
    if (watching) this.loadWatchingFilm(watching);
  }

  private loadWatchingFilm(film: CollectionMovie): void {
    this.moviesApi.detail(film.tmdbId).subscribe({
      next: (details) => this.watchingFilm.set(details),
      error: () => this.watchingFilm.set(null),
    });
  }
}
