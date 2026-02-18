export type SwapStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

/** Mirrors the populated SwapRequest document returned by the backend */
export interface SwapRequest {
  _id?: string;
  /** Populated sender User (from senderId) */
  senderId: {
    _id: string;
    name: string;
    avatar?: string;
    university?: string;
  };
  /** Populated receiver User (from receiverId) */
  receiverId: {
    _id: string;
    name: string;
    avatar?: string;
    university?: string;
  };
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
