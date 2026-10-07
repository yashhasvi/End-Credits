import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { WatchStatus } from './collection.service';

export type PublicProfileMovie = {
  tmdbId: number;
  title: string;
  releaseDate: string | null;
  posterPath: string | null;
  status: WatchStatus;
  rating: number | null;
};

export type PublicProfileTake = {
  tmdbId: number;
  movieTitle: string;
  body: string;
  updatedAt: string;
};

export type PublicProfile = {
  username: string;
  movies: PublicProfileMovie[];
  myFive: PublicProfileMovie[];
  takes: PublicProfileTake[];
};

@Injectable({ providedIn: 'root' })
export class PublicProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/public/profiles';

  load(username: string): Observable<PublicProfile> {
    return this.http.get<PublicProfile>(`${this.apiUrl}/${encodeURIComponent(username)}`);
  }
}
