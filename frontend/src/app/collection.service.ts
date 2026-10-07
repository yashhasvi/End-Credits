import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { MovieSearchResult } from './movie-search.service';

export type WatchStatus = 'WATCHLIST' | 'WATCHING' | 'FINISHED';

export type CollectionMovie = {
  tmdbId: number;
  title: string;
  releaseDate: string | null;
  posterPath: string | null;
  status: WatchStatus;
  rating: number | null;
  watchCount: number;
};

@Injectable({ providedIn: 'root' })
export class CollectionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/collection';
  private readonly myFiveUrl = 'http://localhost:8080/api/profile/my-five';
  readonly movies = signal<CollectionMovie[] | null>(null);
  readonly myFive = signal<CollectionMovie[] | null>(null);

  load(): Observable<CollectionMovie[]> {
    return this.http.get<CollectionMovie[]>(this.apiUrl).pipe(
      tap((movies) => this.movies.set(movies)),
    );
  }

  loadMyFive(): Observable<CollectionMovie[]> {
    return this.http.get<CollectionMovie[]>(this.myFiveUrl).pipe(
      tap((movies) => this.myFive.set(movies)),
    );
  }

  saveMyFive(tmdbIds: number[]): Observable<CollectionMovie[]> {
    return this.http.put<CollectionMovie[]>(this.myFiveUrl, { tmdbIds }).pipe(
      tap((movies) => this.myFive.set(movies)),
    );
  }

  save(movie: MovieSearchResult, status: WatchStatus): Observable<CollectionMovie> {
    return this.http.post<CollectionMovie>(this.apiUrl, {
      tmdbId: movie.tmdbId,
      title: movie.title || 'Untitled film',
      releaseDate: movie.releaseDate,
      posterPath: movie.posterPath,
      status,
    }).pipe(tap((saved) => this.upsert(saved)));
  }

  updateStatus(tmdbId: number, status: WatchStatus): Observable<CollectionMovie> {
    return this.http.post<CollectionMovie>(`${this.apiUrl}/${tmdbId}/status`, { status }).pipe(
      tap((saved) => this.upsert(saved)),
    );
  }

  updateRating(tmdbId: number, rating: number): Observable<CollectionMovie> {
    return this.http.put<CollectionMovie>(`${this.apiUrl}/${tmdbId}/rating`, { rating }).pipe(
      tap((saved) => this.upsert(saved)),
    );
  }

  clearRating(tmdbId: number): Observable<CollectionMovie> {
    return this.http.delete<CollectionMovie>(`${this.apiUrl}/${tmdbId}/rating`).pipe(
      tap((saved) => this.upsert(saved)),
    );
  }

  remove(tmdbId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tmdbId}`).pipe(
      tap(() => {
        this.movies.update((movies) => movies?.filter((movie) => movie.tmdbId !== tmdbId) ?? null);
        this.myFive.update((movies) => movies?.filter((movie) => movie.tmdbId !== tmdbId) ?? null);
      }),
    );
  }

  logRewatch(tmdbId: number): Observable<{ tmdbId: number; watchCount: number }> {
    return this.http.post<{ tmdbId: number; watchCount: number }>(`${this.apiUrl}/${tmdbId}/watch-events`, {}).pipe(
      tap(({ tmdbId: savedTmdbId, watchCount }) => this.movies.update((movies) => movies?.map((movie) =>
        movie.tmdbId === savedTmdbId ? { ...movie, status: 'FINISHED', watchCount } : movie) ?? null)),
    );
  }

  private upsert(saved: CollectionMovie): void {
    this.movies.update((movies) => {
      if (!movies) return [saved];
      const exists = movies.some((movie) => movie.tmdbId === saved.tmdbId);
      return exists
        ? movies.map((movie) => movie.tmdbId === saved.tmdbId ? saved : movie)
        : [saved, ...movies];
    });
  }
}
