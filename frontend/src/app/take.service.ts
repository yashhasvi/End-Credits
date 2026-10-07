import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

export type MovieTake = { tmdbId: number; body: string; updatedAt: string };

@Injectable({ providedIn: 'root' })
export class TakeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/takes';
  readonly takes = signal<MovieTake[] | null>(null);

  load(): Observable<MovieTake[]> { return this.http.get<MovieTake[]>(this.apiUrl).pipe(tap((takes) => this.takes.set(takes))); }
  save(tmdbId: number, body: string): Observable<MovieTake> {
    return this.http.put<MovieTake>(`${this.apiUrl}/${tmdbId}`, { body }).pipe(tap((take) => this.takes.update((takes) => {
      if (!takes) return [take];
      return [take, ...takes.filter((current) => current.tmdbId !== take.tmdbId)];
    })));
  }

  remove(tmdbId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${tmdbId}`).pipe(
      tap(() => this.takes.update((takes) => takes?.filter((take) => take.tmdbId !== tmdbId) ?? null)),
    );
  }
}
