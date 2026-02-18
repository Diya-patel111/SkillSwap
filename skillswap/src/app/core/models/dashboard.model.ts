import { SwapRequest } from './swap-request.model';
import { StudentProfile } from './skill.model';

/** Stats counters returned by the aggregator */
export interface DashboardStats {
  incomingRequests: number;
  sentRequests:     number;
  activeSwaps:      number;
}



/** Single entry in the recent-activity feed */
export interface ActivityItem {
  _id:           string;
  role:          'sent' | 'received';
  skill:         string;
  partnerName:   string;
  partnerAvatar: string | null;
  status:        string;
  time:          string;
}

/** Full response shape from GET /api/dashboard */
export interface DashboardData {
  stats:             DashboardStats;
  pendingRequests:   SwapRequest[];
  activeSwaps:       SwapRequest[];
  recommendedUsers: StudentProfile[];
  recentActivity:    ActivityItem[];
}
