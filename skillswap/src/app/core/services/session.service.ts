import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Session, CreateSessionPayload, UpdateSessionPayload } from '../models/session.model';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly api = inject(ApiService);

  /** Schedule a new session for an accepted swap */
  createSession(payload: CreateSessionPayload): Observable<{ session: Session }> {
    return this.api.post<{ session: Session }>('/sessions', payload);
  }

  /** All sessions the current user participates in */
  getMySessions(params?: { status?: string; swapRequestId?: string }): Observable<{ data: Session[]; total: number }> {
    return this.api.get<{ data: Session[]; total: number }>('/sessions/my', params as any);
  }

  /** Single session */
  getSession(id: string): Observable<{ session: Session }> {
    return this.api.get<{ session: Session }>(`/sessions/${id}`);
  }

  /** Update title, time, link, notes, status */
  updateSession(id: string, payload: UpdateSessionPayload): Observable<{ session: Session }> {
    return this.api.patch<{ session: Session }>(`/sessions/${id}`, payload);
  }

  /** Cancel a session */
  cancelSession(id: string): Observable<{ message: string; session: Session }> {
    return this.api.delete<{ message: string; session: Session }>(`/sessions/${id}`);
  }

  /** Count of upcoming sessions for dashboard badge */
  getUpcomingCount(): Observable<{ count: number }> {
    return this.api.get<{ count: number }>('/sessions/upcoming-count');
  }
}
