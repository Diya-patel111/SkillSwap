export interface User {
  _id?: string;
  name: string;
  email: string;
  university?: string;
  major?: string;
  year?: string;
  bio?: string;
  avatar?: string;
  /** Path to the uploaded profile image (same as avatar, returned by PUT /users/update). */
  profileImage?: string;
  skillsOffered: string[];
  skillsWanted: string[];
  /** Skill level: 'beginner' | 'intermediate' | 'advanced' */
  level?: 'beginner' | 'intermediate' | 'advanced';
  rating?: number;
  totalSwaps?: number;
  totalHours?: number;
  createdAt?: string;
}

/** Fields that can be sent to PUT /api/users/update */
export interface ProfileUpdatePayload {
  name?: string;
  bio?: string;
  university?: string;
  major?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  skillsOffered?: string[];
  skillsWanted?: string[];
}

export interface AuthUser {
  token: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  major?: string;
}
