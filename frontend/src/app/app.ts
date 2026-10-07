import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { SessionService } from './session.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-root',
  imports: [FormsModule, RouterOutlet],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly mode = signal<AuthMode>('login');
  protected readonly currentUser = this.session.user;
  protected readonly isPublicProfileRoute = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly feedback = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected username = '';
  protected email = '';
  protected password = '';

  constructor() {
    this.session.load();
    this.isPublicProfileRoute.set(this.router.url.startsWith('/u/'));
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)).subscribe((event) => {
      this.isPublicProfileRoute.set(event.urlAfterRedirects.startsWith('/u/'));
    });
  }

  protected selectMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.feedback.set(null);
    this.errorMessage.set(null);
  }

  protected submit(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.feedback.set(null);
    this.errorMessage.set(null);

    if (this.mode() === 'register') {
      this.authService.register({
        username: this.username,
        email: this.email,
        password: this.password,
      }).subscribe({
        next: () => {
          this.password = '';
          this.mode.set('login');
          this.feedback.set('Account created. Your next scene starts with a sign-in.');
          this.isSubmitting.set(false);
        },
        error: (error: unknown) => this.handleError(error, 'Could not create your account.'),
      });
      return;
    }

    this.authService.login({ email: this.email, password: this.password }).pipe(
      switchMap(() => this.session.signIn()),
    ).subscribe({
      next: (user) => {
        this.password = '';
        this.feedback.set(`Welcome back, ${user.username}.`);
        this.isSubmitting.set(false);
      },
      error: (error: unknown) => this.handleError(error, 'Could not sign you in.'),
    });
  }

  private handleError(error: unknown, fallback: string): void {
    const apiMessage = error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
      ? error.error.message
      : fallback;

    this.errorMessage.set(apiMessage);
    this.isSubmitting.set(false);
  }
}
