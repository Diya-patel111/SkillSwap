export interface ReviewerSummary {
  _id: string;
  name: string;
  avatar?: string;
  university?: string;
}

export interface Review {
  _id: string;
  reviewer: ReviewerSummary;
  reviewee:  { _id: string; name: string; avatar?: string };
  swapRequest: string;
  rating: number;
  comment: string;
  skillTaught: string;
  createdAt: string;
}

export interface StarDistribution {
  star: number;
  count: number;
}

export interface ReviewSummary {
  average: number;
  total: number;
  distribution: StarDistribution[];
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  pages: number;
  summary: ReviewSummary;
}

export interface CreateReviewPayload {
  swapRequestId: string;
  rating: number;
  comment?: string;
}
