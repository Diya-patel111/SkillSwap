export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';

export interface SessionParticipant {
  _id: string;
  name: string;
  avatar?: string;
  university?: string;
}

export interface Session {
  _id: string;
  swapRequestId: any;   // populated SwapRequest or just an ID
  participants: SessionParticipant[];
  title: string;
  scheduledAt: string;
  durationMins: number;
  meetLink?: string;
  location?: string;
  notes?: string;
  status: SessionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSessionPayload {
  swapRequestId: string;
  title: string;
  scheduledAt: string;   // ISO string
  durationMins?: number;
  meetLink?: string;
  location?: string;
  notes?: string;
}

export interface UpdateSessionPayload {
  title?: string;
  scheduledAt?: string;
  durationMins?: number;
  meetLink?: string;
  location?: string;
  notes?: string;
  status?: SessionStatus;
}
