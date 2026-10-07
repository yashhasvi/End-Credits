import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type MovieSearchResult = {
  tmdbId: number;
  title: string | null;
  releaseDate: string | null;
  posterPath: string | null;
  overview: string | null;
};

export type MovieDetails = {
  tmdbId: number;
  title: string | null;
  originalTitle: string | null;
  releaseDate: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string | null;
  runtime: number | null;
  originalLanguage: string | null;
  country: string | null;
  genres: string[];
  director: string | null;
  cast: string[];
};

type MovieSearchResponse = { results: MovieSearchResult[]; };

export type MovieBrowseShelf =
  | 'trending'
  | 'now-playing'
  | 'popular'
  | 'indian-cinema'
  | 'world-cinema'
  | 'horror'
  | 'romance'
  | 'drama'
  | 'action'
  | 'science-fiction'
  | 'comedy'
  | 'animation'
  | 'mystery'
  | 'fantasy';

export type MovieBrowseResult = MovieSearchResult & {
  backdropPath: string | null;
  genreIds: number[];
  originalLanguage: string | null;
};

export type MovieBrowseResponse = { label: string; results: MovieBrowseResult[]; };
export type MovieRecommendationResponse = { originTmdbId: number; results: MovieBrowseResult[]; };

@Injectable({ providedIn: 'root' })
export class MovieSearchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/movies/search';
  private readonly detailsUrl = 'http://localhost:8080/api/movies';

  search(query: string): Observable<MovieSearchResponse> {
    return this.http.get<MovieSearchResponse>(this.apiUrl, {
      params: new HttpParams().set('query', query),
    });
  }

  detail(tmdbId: number): Observable<MovieDetails> {
    return this.http.get<MovieDetails>(`${this.detailsUrl}/${tmdbId}`);
  }

  browse(shelf: MovieBrowseShelf): Observable<MovieBrowseResponse> {
    return this.http.get<MovieBrowseResponse>(`${this.detailsUrl}/browse/${shelf}`);
  }

  recommendations(tmdbId: number): Observable<MovieRecommendationResponse> {
    return this.http.get<MovieRecommendationResponse>(`${this.detailsUrl}/${tmdbId}/recommendations`);
  }

  posterUrl(posterPath: string | null): string | null {
    return posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;
  }

  backdropUrl(backdropPath: string | null): string | null {
    return backdropPath ? `https://image.tmdb.org/t/p/w1280${backdropPath}` : null;
  }
}
