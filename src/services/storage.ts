import type { Course, Note, Bookmark, UserProgress, GamificationState, UserSettings } from '../types';

const COURSES_KEY = 'courseforge_courses_v2';
const NOTES_KEY = 'courseforge_notes_v1';
const BOOKMARKS_KEY = 'courseforge_bookmarks_v1';
const PROGRESS_KEY = 'courseforge_progress_v1';
const GAMIFICATION_KEY = 'courseforge_gamification_v1';
const SETTINGS_KEY = 'courseforge_settings_v1';

export const INITIAL_GAMIFICATION: GamificationState = {
  xp: 450,
  level: 3,
  streakDays: 5,
  lastStreakDate: new Date().toISOString().split('T')[0],
  weeklyGoalMinutes: 180,
  weeklyMinutesStudied: 125,
  unlockedBadges: [
    {
      id: 'b-1',
      name: 'First Steps',
      description: 'Created your first CourseForge learning roadmap',
      icon: '🚀',
      unlockedAt: '2026-07-20',
      category: 'creation',
    },
    {
      id: 'b-2',
      name: 'Flame Keeper',
      description: 'Maintained a 5-day learning streak',
      icon: '🔥',
      unlockedAt: '2026-07-25',
      category: 'streak',
    },
    {
      id: 'b-3',
      name: 'Scholar',
      description: 'Saved 10+ timestamped smart notes',
      icon: '✍️',
      unlockedAt: '2026-07-27',
      category: 'notes',
    },
  ],
};

export const INITIAL_PROGRESS: UserProgress = {
  totalHoursStudied: 14.5,
  videosCompletedCount: 18,
  coursesCompletedCount: 1,
  streakCount: 5,
  lastActiveDate: new Date().toISOString().split('T')[0],
  dailyHistory: {
    '2026-07-22': 3600,
    '2026-07-23': 5400,
    '2026-07-24': 4200,
    '2026-07-25': 7200,
    '2026-07-26': 6000,
    '2026-07-27': 8100,
    '2026-07-28': 7500,
  },
};

export const INITIAL_SETTINGS: UserSettings = {
  darkMode: true,
  themeColor: 'orange',
  defaultPlaybackSpeed: 1,
  autoAdvanceNextVideo: true,
  dailyGoalMinutes: 30,
  syncWithSupabase: false,
};

export const SAMPLE_COURSES: Course[] = [
  {
    id: 'course-web-dev',
    title: 'Full-Stack Modern Web Engineering Mastery',
    description: 'Master HTML, CSS Flexbox & Grid, JavaScript Async/DOM, React 19, and Full Stack Architecture.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    channelName: 'CourseForge Academy',
    category: 'Web Development',
    tags: ['React', 'JavaScript', 'HTML/CSS', 'Frontend'],
    createdAt: '2026-07-15T10:00:00Z',
    updatedAt: '2026-07-28T10:00:00Z',
    lastOpenedAt: new Date().toISOString(),
    targetDays: 30,
    isFavorite: true,
    authorName: 'Alex Rivers',
    modules: [
      {
        id: 'mod-html',
        title: 'HTML & Semantic Web Architecture',
        description: 'Semantic elements, forms, accessibility, and SEO foundations.',
        order: 1,
      },
      {
        id: 'mod-css',
        title: 'Modern CSS, Flexbox & Grid Systems',
        description: 'Responsive layout architecture, animations, and custom variables.',
        order: 2,
      },
      {
        id: 'mod-js',
        title: 'JavaScript Async, DOM & ES6+',
        description: 'Promises, Async/Await, Event Loop, and DOM manipulation.',
        order: 3,
      },
    ],
    videos: [
      {
        id: 'v-html-1',
        youtubeId: 'kUMe1FH4CHE',
        title: 'HTML5 Essentials & Semantic Elements',
        duration: 900,
        durationFormatted: '15:00',
        thumbnailUrl: 'https://img.youtube.com/vi/kUMe1FH4CHE/hqdefault.jpg',
        channelName: 'FreeCodeCamp',
        description: 'Learn why semantic HTML matters for accessibility and structural clarity.',
        isCompleted: true,
        completedAt: '2026-07-20T14:00:00Z',
        order: 1,
        moduleId: 'mod-html',
      },
      {
        id: 'v-html-2',
        youtubeId: 'fNcJuPIZ2WE',
        title: 'HTML Forms, Inputs & Accessibility',
        duration: 1200,
        durationFormatted: '20:00',
        thumbnailUrl: 'https://img.youtube.com/vi/fNcJuPIZ2WE/hqdefault.jpg',
        channelName: 'Traversy Media',
        description: 'Building interactive accessible forms with modern HTML tags.',
        isCompleted: true,
        completedAt: '2026-07-21T16:00:00Z',
        order: 2,
        moduleId: 'mod-html',
      },
      {
        id: 'v-css-1',
        youtubeId: '3YL4j-QupgA',
        title: 'Complete CSS Flexbox Deep Dive',
        duration: 1500,
        durationFormatted: '25:00',
        thumbnailUrl: 'https://img.youtube.com/vi/3YL4j-QupgA/hqdefault.jpg',
        channelName: 'Kevin Powell',
        description: 'Understand main-axis, cross-axis alignment, and flex-grow properties.',
        isCompleted: true,
        completedAt: '2026-07-24T11:00:00Z',
        order: 3,
        moduleId: 'mod-css',
      },
      {
        id: 'v-css-2',
        youtubeId: 'rg7Fvvl3taU',
        title: 'Modern CSS Grid Layout Mastery',
        duration: 1800,
        durationFormatted: '30:00',
        thumbnailUrl: 'https://img.youtube.com/vi/rg7Fvvl3taU/hqdefault.jpg',
        channelName: 'Fireship',
        description: 'Grid template areas, minmax, auto-fit, and responsive layouts without media queries.',
        isCompleted: false,
        order: 4,
        moduleId: 'mod-css',
      },
      {
        id: 'v-js-1',
        youtubeId: 'W6NZfCO5SIk',
        title: 'JavaScript Event Loop & Async Execution',
        duration: 1600,
        durationFormatted: '26:40',
        thumbnailUrl: 'https://img.youtube.com/vi/W6NZfCO5SIk/hqdefault.jpg',
        channelName: 'JS Conf',
        description: 'How call stack, microtask queue, and Web APIs interact in JS runtime.',
        isCompleted: false,
        order: 5,
        moduleId: 'mod-js',
      },
    ],
  },
];

export function getLocalCourses(): Course[] {
  if (typeof window === 'undefined') return SAMPLE_COURSES;
  const stored = localStorage.getItem(COURSES_KEY);
  if (!stored) {
    localStorage.setItem(COURSES_KEY, JSON.stringify(SAMPLE_COURSES));
    return SAMPLE_COURSES;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return SAMPLE_COURSES;
  }
}

export function saveLocalCourses(courses: Course[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}

export function getLocalNotes(): Note[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(NOTES_KEY);
  if (!stored) {
    const sampleNotes: Note[] = [
      {
        id: 'n-1',
        courseId: 'course-web-dev',
        videoId: 'v-css-1',
        timestamp: 210,
        timestampFormatted: '03:30',
        title: 'Flexbox Main Axis vs Cross Axis',
        content: `### Flexbox Alignment Principles\n- **flex-direction: row** sets Main Axis horizontally.\n- **justify-content** aligns items along Main Axis.\n- **align-items** aligns items along Cross Axis.\n\n\`\`\`css\n.container {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n\`\`\``,
        tags: ['CSS', 'Flexbox', 'Layout'],
        createdAt: '2026-07-24T11:15:00Z',
        updatedAt: '2026-07-24T11:15:00Z',
        isFavorite: true,
      },
    ];
    localStorage.setItem(NOTES_KEY, JSON.stringify(sampleNotes));
    return sampleNotes;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveLocalNotes(notes: Note[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function getLocalBookmarks(): Bookmark[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(BOOKMARKS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveLocalBookmarks(bookmarks: Bookmark[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

export function getLocalGamification(): GamificationState {
  if (typeof window === 'undefined') return INITIAL_GAMIFICATION;
  const stored = localStorage.getItem(GAMIFICATION_KEY);
  if (!stored) {
    localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(INITIAL_GAMIFICATION));
    return INITIAL_GAMIFICATION;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_GAMIFICATION;
  }
}

export function saveLocalGamification(gamification: GamificationState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(gamification));
}

export function getLocalProgress(): UserProgress {
  if (typeof window === 'undefined') return INITIAL_PROGRESS;
  const stored = localStorage.getItem(PROGRESS_KEY);
  if (!stored) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(INITIAL_PROGRESS));
    return INITIAL_PROGRESS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_PROGRESS;
  }
}

export function saveLocalProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function getLocalSettings(): UserSettings {
  if (typeof window === 'undefined') return INITIAL_SETTINGS;
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
    return INITIAL_SETTINGS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_SETTINGS;
  }
}

export function saveLocalSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
