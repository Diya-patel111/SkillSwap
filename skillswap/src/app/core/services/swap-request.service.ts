import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  SwapRequest, CreateSwapPayload,
  MyRequestsResponse, DashboardStats, SwapStatus,
} from '../models/swap-request.model';

@Injectable({ providedIn: 'root' })
export class SwapRequestService {
  private readonly api = inject(ApiService);

  /**
   * GET /api/swaps/my-requests
   * Returns all swaps where the current user is sender OR receiver,
   * grouped as { data, sent, received, total }.
   * Optional: ?status=&role=sent|received
   */
  getMyRequests(opts?: { status?: SwapStatus; role?: 'sent' | 'received' }): Observable<MyRequestsResponse> {
    return this.api.get<MyRequestsResponse>('/swaps/my-requests', {
      status: opts?.status,
      role:   opts?.role,
    });
  }

  /**
   * POST /api/swaps/request
   * Sends a new swap request from the authenticated user.
   */
  createRequest(payload: CreateSwapPayload): Observable<SwapRequest> {
    return this.api.post<{ swap: SwapRequest }>('/swaps/request', payload).pipe(
      map(res => res.swap ?? (res as any))
    );
  }

  /**
   * PUT /api/swaps/:id/status
   * Transitions the swap to the given status.
   * Rules enforced server-side:
   *   accepted / rejected — receiver only, while pending
   *   cancelled           — sender only,   while pending
   *   completed           — either party,   while accepted
   */
  updateStatus(id: string, status: 'accepted' | 'rejected' | 'completed' | 'cancelled'): Observable<SwapRequest> {
    return this.api.put<{ swap: SwapRequest }>(`/swaps/${id}/status`, { status }).pipe(
      map(res => res.swap ?? (res as any))
    );
  }

  /** Convenience wrappers — delegate to updateStatus */
  acceptSwap(id: string):  Observable<SwapRequest> { return this.updateStatus(id, 'accepted');  }
  rejectSwap(id: string):  Observable<SwapRequest> { return this.updateStatus(id, 'rejected');  }
  cancelSwap(id: string):  Observable<SwapRequest> { return this.updateStatus(id, 'cancelled'); }
  completeSwap(id: string): Observable<SwapRequest> { return this.updateStatus(id, 'completed'); }

  /** GET /api/swaps/stats — dashboard counters */
  getDashboardStats(): Observable<DashboardStats> {
    return this.api.get<DashboardStats>('/swaps/stats');
  }
}
