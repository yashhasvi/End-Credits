import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes),
      ],
    })
      .compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('renders the End Credits admission experience for a signed-out visitor', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const sessionRequest = httpTesting.expectOne('http://localhost:8080/api/auth/me');
    expect(sessionRequest.request.method).toBe('GET');
    sessionRequest.flush({ message: 'Not signed in' }, { status: 401, statusText: 'Unauthorized' });

    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('END CREDITS');
    expect(compiled.textContent).toContain('For the films that stayed.');
  });
});
