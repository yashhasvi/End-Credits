import { Routes } from '@angular/router';
import { ForYouPageComponent } from './for-you-page.component';
import { PrivateProfilePageComponent } from './private-profile-page.component';
import { PublicProfilePageComponent } from './public-profile-page.component';
import { MovieDetailPageComponent } from './movie-detail-page.component';
import { DiscoverPageComponent } from './discover-page.component';

export const routes: Routes = [
  { path: '', component: ForYouPageComponent },
  { path: 'discover', component: DiscoverPageComponent },
  { path: 'profile', component: PrivateProfilePageComponent },
  { path: 'u/:username/movie/:tmdbId', component: MovieDetailPageComponent },
  { path: 'movie/:tmdbId', component: MovieDetailPageComponent },
  { path: 'u/:username', component: PublicProfilePageComponent },
  { path: '**', redirectTo: '' },
];
