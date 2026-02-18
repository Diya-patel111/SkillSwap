import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DashboardData } from '../models/dashboard.model';

/**
 * DashboardService
 *
 * Thin wrapper that calls the single aggregator endpoint.
 * One API call replaces three separate calls (stats + requests + matches).
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  /** GET /api/dashboard — returns all data needed for the dashboard in one round-trip */
  getData(): Observable<DashboardData> {
    return this.api.get<DashboardData>('/dashboard');
  }
}
