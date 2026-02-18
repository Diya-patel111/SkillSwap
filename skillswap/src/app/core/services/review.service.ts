import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  CreateReviewPayload,
  Review,
  ReviewsResponse,
} from '../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly api = inject(ApiService);

  /** POST /api/reviews — submit a review for a swap */
  createReview(payload: CreateReviewPayload): Observable<{ review: Review }> {
    return this.api.post<{ review: Review }>('/reviews', payload);
  }

  /** GET /api/reviews/user/:userId — paginated reviews for a user */
  getReviewsForUser(
    userId: string,
    page = 1,
    limit = 10,
  ): Observable<ReviewsResponse> {
    return this.api.get<ReviewsResponse>(`/reviews/user/${userId}`, {
      page,
      limit,
    });
  }

  /** GET /api/reviews/me — all reviews received by the current user */
  getMyReviews(): Observable<{ reviews: Review[] }> {
    return this.api.get<{ reviews: Review[] }>('/reviews/me');
  }

  /** DELETE /api/reviews/:id */
  deleteReview(id: string): Observable<void> {
    return this.api.delete<void>(`/reviews/${id}`);
  }
}
