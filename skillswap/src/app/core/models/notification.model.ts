export type NotifType =
  | 'swap_request'
  | 'swap_accepted'
  | 'swap_rejected'
  | 'session_scheduled'
  | 'session_reminder'
  | 'review_received';

export interface AppNotification {
  _id:       string;
  type:      NotifType;
  title:     string;
  message:   string;
  link:      string;
  isRead:    boolean;
  createdAt: string;
  refId?:    string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  total:         number;
  unreadCount:   number;
  page:          number;
  limit:         number;
}
