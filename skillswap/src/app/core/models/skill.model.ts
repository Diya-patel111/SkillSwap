// ── Skill ────────────────────────────────────────────────────────────────────

export type SkillCategory =
  | 'Coding'
  | 'Languages'
  | 'Music'
  | 'Design'
  | 'Marketing'
  | 'Writing'
  | 'Mathematics'
  | 'Science'
  | 'Other';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Skill {
  _id: string;
  title: string;
  slug?: string;
  category: SkillCategory;
  level: SkillLevel;
  description?: string;
  icon?: string;
  teacherCount?: number;
  learnerCount?: number;
  isApproved?: boolean;
  createdBy?: { _id: string; name: string; avatar?: string };
  createdAt?: string;
  updatedAt?: string;
}

export const SKILL_CATEGORIES: { label: SkillCategory; icon: string }[] = [
  { label: 'Coding',      icon: 'code'        },
  { label: 'Languages',   icon: 'translate'   },
  { label: 'Music',       icon: 'music_note'  },
  { label: 'Design',      icon: 'palette'     },
  { label: 'Marketing',   icon: 'trending_up' },
  { label: 'Writing',     icon: 'menu_book'   },
  { label: 'Mathematics', icon: 'calculate'   },
  { label: 'Science',     icon: 'science'     },
  { label: 'Other',       icon: 'category'    },
];

export const SKILL_LEVELS: { label: SkillLevel; icon: string }[] = [
  { label: 'beginner',     icon: 'counter_1'    },
  { label: 'intermediate', icon: 'counter_2'    },
  { label: 'advanced',     icon: 'workspace_premium' },
];

export interface StudentProfile {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  university?: string;
  major?: string;
  bio?: string;
  teaches: string[];
  wants: string[];
  rating: number;
  totalSwaps: number;
  isOnline?: boolean;
  level?: string;
}
