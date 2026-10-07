import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';

/**
 * The deliberately small movie contract keeps the table reusable on Home,
 * Discover, or a future dedicated vibe-search page.
 */
export type VibeTableMovie = {
  tmdbId: number;
  title: string | null;
  releaseDate: string | null;
  posterPath: string | null;
};

export type VibeId =
  | 'comfort'
  | 'devastating'
  | 'chaos'
  | 'love'
  | 'strange'
  | 'escape'
  | 'nostalgia'
  | 'adrenaline'
  | 'quiet';

/**
 * These are explicit V1 genre signals, not an implied AI taste model. A parent
 * can use tmdbGenreIds to make a real TMDB discovery request after selection.
 */
export type VibeTableSelection = {
  id: VibeId;
  label: string;
  note: string;
  tmdbGenreIds: readonly number[];
};

type VibeCell = VibeTableSelection & {
  column: number;
  row: number;
};

const VIBES: readonly VibeCell[] = [
  { id: 'comfort', label: 'COMFORT', note: 'Warm, familiar genre signals.', tmdbGenreIds: [35, 10751, 16], column: 1, row: 1 },
  { id: 'devastating', label: 'DEVASTATING', note: 'Drama-led selections.', tmdbGenreIds: [18], column: 2, row: 1 },
  { id: 'chaos', label: 'CHAOS', note: 'Action and thriller signals.', tmdbGenreIds: [28, 53], column: 3, row: 1 },
  { id: 'love', label: 'LOVE', note: 'Romance-led selections.', tmdbGenreIds: [10749], column: 1, row: 2 },
  { id: 'strange', label: 'STRANGE', note: 'Fantasy, science fiction, and mystery.', tmdbGenreIds: [14, 878, 9648], column: 2, row: 2 },
  { id: 'escape', label: 'ESCAPE', note: 'Adventure and fantasy signals.', tmdbGenreIds: [12, 14], column: 3, row: 2 },
  { id: 'nostalgia', label: 'NOSTALGIA', note: 'Animation, family, and drama signals.', tmdbGenreIds: [16, 10751, 18], column: 1, row: 3 },
  { id: 'adrenaline', label: 'ADRENALINE', note: 'Action, crime, and thriller signals.', tmdbGenreIds: [28, 80, 53], column: 2, row: 3 },
  { id: 'quiet', label: 'QUIET', note: 'Drama and documentary signals.', tmdbGenreIds: [18, 99], column: 3, row: 3 },
];

@Component({
  selector: 'app-vibe-table',
  template: `
    <section class="vibe-section" [attr.aria-labelledby]="headingId">
      <header class="vibe-heading">
        <p>{{ kicker }}</p>
        <h2 [id]="headingId">{{ title }}</h2>
        <span>CHOOSE A MOOD. OPEN A FILM.</span>
      </header>

      <div class="vibe-table" role="group" aria-label="Choose a cinema mood" [attr.data-active-vibe]="activeVibe().id">
        <span
          class="vibe-cursor"
          aria-hidden="true"
          [style.left]="cursorLeft()"
          [style.top]="cursorTop()"
        ></span>

        <div class="vibe-grid">
          @for (vibe of vibes; track vibe.id; let index = $index) {
            <article class="vibe-cell" [class.is-selected]="selectedVibeId() === vibe.id">
              <button
                type="button"
                class="vibe-choice"
                [id]="tileId(index)"
                [attr.aria-pressed]="selectedVibeId() === vibe.id"
                [attr.aria-describedby]="descriptionId(vibe)"
                (click)="selectVibe(vibe)"
                (mouseenter)="previewVibe(vibe.id)"
                (mouseleave)="clearPreview()"
                (focus)="previewVibe(vibe.id)"
                (blur)="clearPreview()"
                (keydown)="moveFocus($event, index)"
              >
                <span class="cell-number">{{ cellNumber(index) }}</span>
                <strong>{{ vibe.label }}</strong>
                <span class="cell-arrow" aria-hidden="true">↗</span>
              </button>

              <span class="visually-hidden" [id]="descriptionId(vibe)">{{ vibe.note }}</span>

              @if (movieFor(index); as movie) {
                <button
                  type="button"
                  class="vibe-film"
                  (click)="selectMovie(movie, vibe, $event)"
                  [attr.aria-label]="'Open ' + movieTitle(movie) + ' from the ' + vibe.label.toLowerCase() + ' selection'"
                >
                  @if (posterUrl(movie); as poster) {
                    <img [src]="poster" [alt]="''" loading="lazy" />
                  } @else {
                    <span class="film-fallback" aria-hidden="true">EC</span>
                  }
                </button>
              }
            </article>
          }
        </div>
      </div>

      <aside class="vibe-readout" aria-live="polite">
        <div>
          <p>SELECTED / {{ activeVibe().label }}</p>
          <span>{{ activeVibe().note }}</span>
        </div>
        @if (activeMovie(); as movie) {
          <button
            type="button"
            class="active-film"
            (click)="selectMovie(movie, activeVibe(), $event)"
            [attr.aria-label]="'Open ' + movieTitle(movie)"
          >
            @if (posterUrl(movie); as poster) {
              <img [src]="poster" [alt]="''" loading="lazy" />
            } @else {
              <span class="active-film-fallback" aria-hidden="true">EC</span>
            }
            <span><small>FROM THE CURRENT REEL</small>{{ movieTitle(movie) }} <em>{{ movieYear(movie) }}</em></span>
            <b aria-hidden="true">↗</b>
          </button>
        }
        <small>FIXED TMDB GENRE SIGNALS · NOT AN AI TASTE CLAIM</small>
      </aside>
    </section>
  `,
  styles: [`
    :host{display:block;min-width:0}.vibe-section{width:min(100%,31.5rem);color:#edf5f7}.vibe-heading{display:grid;grid-template-columns:1fr auto;gap:6px 14px;align-items:end;margin:0 0 13px}.vibe-heading p,.vibe-heading>span{margin:0;color:rgba(201,220,225,.75);font:800 .61rem/1.2 var(--body,Arial,sans-serif);letter-spacing:.105em}.vibe-heading h2{grid-column:1/-1;margin:0;color:#f1f7f8;font:900 clamp(1.6rem,3.2vw,2.5rem)/.85 var(--display,Arial,sans-serif);letter-spacing:-.072em}.vibe-heading>span{justify-self:end;color:rgba(221,239,242,.72);font-size:.54rem;text-align:right}.vibe-table{position:relative;overflow:hidden;border:1px solid rgba(220,237,240,.34);padding:7px;background:linear-gradient(135deg,rgba(25,35,44,.64),rgba(5,9,14,.72));box-shadow:inset 0 1px 0 rgba(244,254,255,.06),0 16px 35px rgba(0,0,0,.15)}.vibe-table::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 32% 12%,rgba(168,211,222,.075),transparent 39%),linear-gradient(100deg,transparent 0 49.7%,rgba(229,244,246,.045) 49.8% 50.2%,transparent 50.3%);pointer-events:none}.vibe-grid{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid rgba(223,239,242,.27);border-left:1px solid rgba(223,239,242,.27)}.vibe-cell{position:relative;isolation:isolate;min-width:0;min-height:clamp(4.95rem,8.2vw,6.85rem);border-right:1px solid rgba(223,239,242,.27);border-bottom:1px solid rgba(223,239,242,.27);background:rgba(7,12,18,.14);transition:background .32s ease,box-shadow .32s ease}.vibe-cell::after{content:"";position:absolute;z-index:-1;inset:4px;border:1px solid transparent;pointer-events:none;transition:border-color .25s ease,background .25s ease}.vibe-cell:hover,.vibe-cell:focus-within,.vibe-cell.is-selected{background:rgba(129,168,178,.095);box-shadow:inset 0 0 26px rgba(157,212,224,.045)}.vibe-cell:hover::after,.vibe-cell:focus-within::after,.vibe-cell.is-selected::after{border-color:rgba(211,239,244,.19);background:linear-gradient(135deg,rgba(188,230,239,.025),transparent 58%)}.vibe-choice{position:relative;z-index:1;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:start;gap:6px;width:100%;height:100%;min-height:inherit;border:0;padding:12px 49px 10px 11px;background:transparent;color:#eff7f8;text-align:left;cursor:pointer}.vibe-choice:focus-visible{outline:2px solid #c4edf5;outline-offset:-4px}.cell-number{color:rgba(169,197,204,.7);font:800 .52rem/1.15 var(--body,Arial,sans-serif);letter-spacing:.08em}.vibe-choice strong{overflow:hidden;font:900 clamp(.67rem,1.2vw,.85rem)/.9 var(--display,Arial,sans-serif);letter-spacing:-.035em;text-overflow:ellipsis}.cell-arrow{color:#c9f1f7;font:800 .78rem/1 var(--body,Arial,sans-serif);opacity:0;transform:translate(-3px,3px);transition:opacity .2s ease,transform .2s ease}.vibe-cell:hover .cell-arrow,.vibe-cell:focus-within .cell-arrow,.vibe-cell.is-selected .cell-arrow{opacity:.95;transform:none}.vibe-film{position:absolute;z-index:2;right:9px;bottom:9px;display:block;width:27px;height:39px;border:1px solid rgba(227,246,249,.25);padding:0;background:#1a2b35;box-shadow:0 5px 12px rgba(0,0,0,.22);cursor:pointer;transition:transform .24s ease,border-color .24s ease,box-shadow .24s ease}.vibe-film:focus-visible{outline:2px solid #c4edf5;outline-offset:3px}.vibe-film img,.film-fallback{display:block;width:100%;height:100%;object-fit:cover}.vibe-film img{filter:saturate(.72) contrast(1.04);opacity:.78}.film-fallback{display:grid;place-items:center;color:#cfedf2;font:900 .43rem/1 var(--display,Arial,sans-serif)}.vibe-cell:hover .vibe-film,.vibe-cell:focus-within .vibe-film,.vibe-cell.is-selected .vibe-film{border-color:rgba(212,243,249,.65);box-shadow:0 7px 15px rgba(0,0,0,.32);transform:translateY(-2px)}.vibe-cell:hover .vibe-film img,.vibe-cell:focus-within .vibe-film img,.vibe-cell.is-selected .vibe-film img{filter:saturate(.9) contrast(1.07);opacity:1}.vibe-cursor{position:absolute;z-index:0;width:8px;aspect-ratio:1;border:1px solid rgba(239,253,255,.8);border-radius:50%;background:#d8f8fd;box-shadow:0 0 0 4px rgba(191,235,244,.075),0 0 13px rgba(181,231,242,.45),0 0 31px rgba(128,202,219,.2);opacity:.88;pointer-events:none;transform:translate(-50%,-50%);transition:left .45s cubic-bezier(.22,.78,.28,1),top .45s cubic-bezier(.22,.78,.28,1),opacity .22s ease}.vibe-readout{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px 14px;align-items:center;margin-top:10px;border-top:1px solid rgba(220,238,241,.23);padding-top:9px}.vibe-readout p,.vibe-readout small{margin:0;color:#9db8c0;font:800 .52rem/1.25 var(--body,Arial,sans-serif);letter-spacing:.09em}.vibe-readout>div>span{display:block;margin-top:3px;color:#c8d9dd;font:600 .7rem/1.3 var(--body,Arial,sans-serif)}.vibe-readout>small{grid-column:1/-1;color:#829ba3;font-size:.47rem}.active-film{display:grid;grid-template-columns:25px minmax(0,1fr) auto;align-items:center;gap:7px;max-width:12rem;border:0;padding:0;background:transparent;color:#e8f4f5;text-align:left;cursor:pointer}.active-film:focus-visible{outline:2px solid #c4edf5;outline-offset:3px}.active-film img,.active-film-fallback{display:block;width:25px;height:35px;object-fit:cover;background:#1b2d3a}.active-film-fallback{display:grid;place-items:center;color:#cfedf2;font:900 .43rem/1 var(--display,Arial,sans-serif)}.active-film>span{overflow:hidden;font:800 .66rem/1.13 var(--body,Arial,sans-serif);text-overflow:ellipsis;white-space:nowrap}.active-film small{display:block;margin-bottom:3px;color:#8facb5;font-size:.45rem}.active-film em{margin-left:2px;color:#aac3ca;font-style:normal}.active-film b{color:#c9f0f6;font:800 .77rem/1 var(--body,Arial,sans-serif)}.active-film:hover>span,.active-film:focus-visible>span{color:#d6f6fb}.visually-hidden{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}@media(max-width:760px){.vibe-section{width:100%}.vibe-heading{margin-bottom:11px}.vibe-heading h2{font-size:clamp(1.55rem,8.2vw,2.15rem)}.vibe-table{padding:5px}.vibe-cell{min-height:clamp(4.45rem,24vw,5.7rem)}.vibe-choice{padding:9px 38px 7px 8px;gap:4px}.vibe-choice strong{font-size:clamp(.56rem,2.7vw,.72rem);line-height:.94}.cell-number{font-size:.45rem}.vibe-film{right:7px;bottom:7px;width:22px;height:32px}.vibe-readout{grid-template-columns:minmax(0,1fr) auto;gap:8px}.active-film{max-width:9.8rem;grid-template-columns:21px minmax(0,1fr) auto}.active-film img,.active-film-fallback{width:21px;height:30px}.active-film>span{font-size:.57rem}.active-film small{font-size:.4rem}.vibe-readout>div>span{font-size:.65rem}.vibe-heading>span{font-size:.48rem}}@media(max-width:390px){.vibe-heading>span{display:none}.vibe-cell{min-height:4.2rem}.vibe-choice{padding-right:33px}.vibe-film{right:5px;bottom:5px;width:19px;height:28px}.vibe-readout{grid-template-columns:1fr}.active-film{max-width:100%}}@media(prefers-reduced-motion:reduce){.vibe-cell,.vibe-cell::after,.cell-arrow,.vibe-film,.vibe-cursor{transition:none}}
  `],
})
export class VibeTableComponent {
  private static nextInstanceId = 0;
  private readonly instanceId = ++VibeTableComponent.nextInstanceId;
  /** Unique per instance so the section's accessible name remains valid if reused. */
  protected readonly headingId = `vibe-table-heading-${this.instanceId}`;

  /** Films are displayed in supplied order; the component does not claim they are personalised matches. */
  @Input() movies: readonly VibeTableMovie[] = [];
  @Input() kicker = 'YOUR CINEMA / 01';
  @Input() title = 'CHOOSE YOUR VIBE.';

  /** Emits the selected explicit genre mapping for the host to fetch from TMDB. */
  @Output() readonly vibeSelected = new EventEmitter<VibeTableSelection>();
  /** Emits a real movie when its small in-table film control is activated. */
  @Output() readonly movieSelected = new EventEmitter<VibeTableMovie>();

  protected readonly vibes = VIBES;
  protected readonly selectedVibeId = signal<VibeId>('strange');
  private readonly previewVibeId = signal<VibeId | null>(null);
  protected readonly activeVibe = computed(() => this.vibeFor(this.previewVibeId() ?? this.selectedVibeId()));

  protected selectVibe(vibe: VibeCell): void {
    this.selectedVibeId.set(vibe.id);
    this.previewVibeId.set(null);
    this.vibeSelected.emit(vibe);
  }

  protected previewVibe(id: VibeId): void {
    this.previewVibeId.set(id);
  }

  protected clearPreview(): void {
    this.previewVibeId.set(null);
  }

  protected selectMovie(movie: VibeTableMovie, vibe: VibeCell, event: Event): void {
    event.stopPropagation();
    this.selectVibe(vibe);
    this.movieSelected.emit(movie);
  }

  protected moveFocus(event: KeyboardEvent, index: number): void {
    const column = index % 3;
    const row = Math.floor(index / 3);
    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight': nextIndex = row * 3 + ((column + 1) % 3); break;
      case 'ArrowLeft': nextIndex = row * 3 + ((column + 2) % 3); break;
      case 'ArrowDown': nextIndex = ((row + 1) % 3) * 3 + column; break;
      case 'ArrowUp': nextIndex = ((row + 2) % 3) * 3 + column; break;
      default: return;
    }

    event.preventDefault();
    const next = this.vibes[nextIndex];
    this.previewVibe(next.id);
    document.getElementById(this.tileId(nextIndex))?.focus();
  }

  protected movieFor(index: number): VibeTableMovie | null {
    return this.movies[index] ?? null;
  }

  protected activeMovie(): VibeTableMovie | null {
    return this.movieFor(this.vibeIndex(this.activeVibe().id));
  }

  protected posterUrl(movie: VibeTableMovie): string | null {
    if (!movie.posterPath) return null;
    return movie.posterPath.startsWith('http') ? movie.posterPath : `https://image.tmdb.org/t/p/w342${movie.posterPath}`;
  }

  protected movieTitle(movie: VibeTableMovie): string {
    return movie.title || 'Untitled film';
  }

  protected movieYear(movie: VibeTableMovie): string {
    return movie.releaseDate?.slice(0, 4) || '—';
  }

  protected cursorLeft(): string {
    return `${((this.activeVibe().column - .5) / 3) * 100}%`;
  }

  protected cursorTop(): string {
    return `${((this.activeVibe().row - .5) / 3) * 100}%`;
  }

  protected tileId(index: number): string {
    return `vibe-table-${this.instanceId}-tile-${index}`;
  }

  protected descriptionId(vibe: VibeCell): string {
    return `vibe-table-${this.instanceId}-description-${vibe.id}`;
  }

  protected cellNumber(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  private vibeIndex(id: VibeId): number {
    return VIBES.findIndex((vibe) => vibe.id === id);
  }

  private vibeFor(id: VibeId): VibeCell {
    return VIBES.find((vibe) => vibe.id === id) ?? VIBES[4];
  }
}
