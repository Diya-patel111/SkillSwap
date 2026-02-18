import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { User, ProfileUpdatePayload } from '../models/user.model';
import { StudentProfile } from '../models/skill.model';
import { UserStateService } from './user-state.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api       = inject(ApiService);
  private readonly userState = inject(UserStateService);

  // ── GET /api/users/me ────────────────────────────────────────────────────
  /** Fetch the full profile of the currently logged-in user. */
  getMyProfile(): Observable<User> {
    return this.api.get<{ user: User }>('/users/me').pipe(
      map(res => res.user ?? (res as unknown as User)),
      tap(user => this.userState.set(user)),   // keep UserStateService in sync
    );
  }

  // ── GET /api/users/:id ───────────────────────────────────────────────────
  /** Fetch any student's public profile. */
  getProfileById(id: string): Observable<StudentProfile> {
    return this.api.get<{ user: StudentProfile }>(`/users/${id}`).pipe(
      map(res => res.user ?? (res as unknown as StudentProfile)),
    );
  }

  // ── PUT /api/users/update ────────────────────────────────────────────────
  /**
   * Update the current user's profile.
   *
   * If `profileImage` is provided the request is sent as multipart/form-data
   * so multer on the server can parse the file.  Array fields (skillsOffered,
   * skillsWanted) are JSON-serialised into the FormData payload so they
   * survive the multipart encoding.
   *
   * Without an image the request is a plain JSON PUT — faster and simpler.
   */
  updateProfile(payload: ProfileUpdatePayload, profileImage?: File): Observable<User> {
    if (profileImage) {
      const formData = new FormData();

      // Append scalar text fields
      const TEXT_FIELDS: (keyof ProfileUpdatePayload)[] = ['name', 'bio', 'university', 'major', 'level'];
      TEXT_FIELDS.forEach(k => {
        if (payload[k] !== undefined) {
          formData.append(k, String(payload[k]));
        }
      });

      // Append array fields as JSON strings (multer delivers them as text)
      if (payload.skillsOffered !== undefined) {
        formData.append('skillsOffered', JSON.stringify(payload.skillsOffered));
      }
      if (payload.skillsWanted !== undefined) {
        formData.append('skillsWanted', JSON.stringify(payload.skillsWanted));
      }

      // Append the image — the backend multer instance expects the field name "profileImage"
      formData.append('profileImage', profileImage, profileImage.name);

      return this.api.uploadPut<{ user: User }>('/users/update', formData).pipe(
        map(res => res.user ?? (res as unknown as User)),
        tap(user => this.userState.update(user)),
      );
    }

    // ── Plain JSON update (no image) ────────────────────────────────────
    return this.api.put<{ user: User }>('/users/update', payload).pipe(
      map(res => res.user ?? (res as unknown as User)),
      tap(user => this.userState.update(user)),
    );
  }

  // ── Convenience: upload avatar only (delegates to updateProfile) ─────────
  /**
   * Shorthand to upload just a profile image without touching other fields.
   * Returns the updated user so callers can react to the new avatar URL.
   */
  uploadAvatar(file: File): Observable<User> {
    return this.updateProfile({}, file);
  }
}
