export type SwapStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

/** Shape of a populated User reference inside a SwapRequest */
export interface SwapParticipant {
  _id: string;
  name: string;
  avatar?: string;
  university?: string;
}

/** Mirrors the populated SwapRequest document returned by the backend */
export interface SwapRequest {
  _id?: string;
  /**
   * Populated sender — null when the originating user account has been deleted.
   * Always guard with `?.` before accessing sub-fields.
   */
  senderId: SwapParticipant | null;
  /**
   * Populated receiver — null when the target user account has been deleted.
   * Always guard with `?.` before accessing sub-fields.
   */
  receiverId: SwapParticipant | null;
  offeredSkill:   string;   // skill the sender offers to teach
  requestedSkill: string;   // skill the sender wants to learn
  message?: string;
  status: SwapStatus;
  createdAt?: string;
  updatedAt?: string;
  /** Client-side flag set after the current user submits a review for this swap */
  reviewed?: boolean;
}

/** Payload for POST /api/swaps/request */
export interface CreateSwapPayload {
  receiverId:     string;
  offeredSkill:   string;
  requestedSkill: string;
  message?:       string;
}

/** Shape of GET /api/swaps/my-requests response */
export interface MyRequestsResponse {
  data:     SwapRequest[];
  sent:     SwapRequest[];
  received: SwapRequest[];
  total:    number;
}

export interface DashboardStats {
  incomingRequests: number;
  sentRequests:     number;
  activeSwaps:      number;
}
