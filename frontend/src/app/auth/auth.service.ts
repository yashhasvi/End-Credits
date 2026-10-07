import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type CurrentUser = {
  id: number;
  username: string;
};

type MessageResponse = {
  message: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/auth';

  register(request: RegisterRequest): Observable<MessageResponse> {
    return this.loadCsrfToken().pipe(
      switchMap(() => this.http.post<MessageResponse>(`${this.apiUrl}/register`, request)),
    );
  }

  login(request: LoginRequest): Observable<MessageResponse> {
    return this.loadCsrfToken().pipe(
      switchMap(() => this.http.post<MessageResponse>(`${this.apiUrl}/login`, request)),
    );
  }

  logout(): Observable<void> {
    return this.loadCsrfToken().pipe(
      switchMap(() => this.http.post<void>(`${this.apiUrl}/logout`, null)),
      map(() => undefined),
    );
  }

  me(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.apiUrl}/me`);
  }

  private loadCsrfToken(): Observable<void> {
    return this.http.get<void>(`${this.apiUrl}/csrf`).pipe(
      map(() => undefined),
    );
  }
}
