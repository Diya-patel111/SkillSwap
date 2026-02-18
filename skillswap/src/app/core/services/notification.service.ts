import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService }             from './api.service';
import { AppNotification, NotificationsResponse } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiService);

  /** Fetch paginated notifications + unread count. */
  getNotifications(page = 1, limit = 20): Observable<NotificationsResponse> {
    return this.api.get<NotificationsResponse>('/notifications', { page, limit });
  }

  /** Lightweight poll — returns { count: number }. */
  getUnreadCount(): Observable<{ count: number }> {
    return this.api.get<{ count: number }>('/notifications/unread-count');
  }

  /** Mark a single notification as read. */
  markRead(id: string): Observable<{ notification: AppNotification }> {
    return this.api.patch<{ notification: AppNotification }>(`/notifications/${id}/read`, {});
  }

  /** Mark all unread notifications as read. */
  markAllRead(): Observable<{ modifiedCount: number }> {
    return this.api.patch<{ modifiedCount: number }>('/notifications/read-all', {});
  }

  /** Delete a notification permanently. */
  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/notifications/${id}`);
  }
}
