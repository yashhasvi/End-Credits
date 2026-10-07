import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type ProfileVisibility = { profilePublic: boolean };

@Injectable({ providedIn: 'root' })
export class ProfileVisibilityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/profile/visibility';

  load(): Observable<ProfileVisibility> {
    return this.http.get<ProfileVisibility>(this.apiUrl);
  }

  update(profilePublic: boolean): Observable<ProfileVisibility> {
    return this.http.put<ProfileVisibility>(this.apiUrl, { profilePublic });
  }
}
