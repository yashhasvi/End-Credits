import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthService, CurrentUser } from './auth/auth.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly authService = inject(AuthService);
  readonly user = signal<CurrentUser | null>(null);

  load(): void {
    this.authService.me().subscribe({ next: (user) => this.user.set(user), error: () => this.user.set(null) });
  }

  signIn(): Observable<CurrentUser> {
    return this.authService.me().pipe(tap((user) => this.user.set(user)));
  }

  signOut(): Observable<void> {
    return this.authService.logout().pipe(tap(() => this.user.set(null)));
  }
}
