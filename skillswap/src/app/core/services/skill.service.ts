import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Skill, StudentProfile, SkillCategory, SkillLevel } from '../models/skill.model';
import { PaginatedResponse } from '../models/api-response.model';

export interface SkillsQuery {
  search?:   string;
  category?: SkillCategory;
  level?:    SkillLevel;
  page?:     number;
  limit?:    number;
}

@Injectable({ providedIn: 'root' })
export class SkillService {
  private readonly api = inject(ApiService);

  /**
   * Fetch a paginated list of skills from GET /api/skills.
   * Supports search (debounced by caller), category, and level filters.
   */
  getSkillsList(q: SkillsQuery = {}): Observable<PaginatedResponse<Skill>> {
    return this.api.get<PaginatedResponse<Skill>>('/skills', {
      search:   q.search   || undefined,
      category: q.category || undefined,
      level:    q.level    || undefined,
      page:     q.page  ?? 1,
      limit:    q.limit ?? 12,
    });
  }

  /** Legacy — returns raw data array (used by earlier components) */
  getSkills(category?: SkillCategory, search?: string): Observable<Skill[]> {
    return this.api.get<{ data: Skill[] }>('/skills', { category, search }).pipe(
      map(res => res.data ?? (res as any))
    );
  }

  getStudents(
    category?: SkillCategory,
    search?: string,
    page = 1,
    limit = 12
  ): Observable<PaginatedResponse<StudentProfile>> {
    return this.api.get<PaginatedResponse<StudentProfile>>('/users', {
      category,
      search,
      page,
      limit,
    });
  }

  getStudentById(id: string): Observable<StudentProfile> {
    return this.api.get<{ user: StudentProfile }>(`/users/${id}`).pipe(
      map(res => res.user ?? (res as any))
    );
  }

  getSuggestedMatches(): Observable<StudentProfile[]> {
    return this.api.get<{ data: StudentProfile[] }>('/users/me/matches').pipe(
      map(res => res.data ?? (res as any))
    );
  }

  updateMySkills(skillsOffered: string[], skillsWanted: string[]): Observable<StudentProfile> {
    return this.api.patch<{ user: StudentProfile }>('/users/me', { skillsOffered, skillsWanted }).pipe(
      map(res => res.user ?? (res as any))
    );
  }
}
