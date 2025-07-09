export const APP_NAME = 'NotesFlow';
export const APP_DESCRIPTION = 'Your thoughts and time, beautifully unified.';

export const ROUTES = {
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
  },
  DASHBOARD: {
    HOME: '/dashboard',
    NOTES: '/dashboard/notes',
    CALENDAR: '/dashboard/calendar',
    SETTINGS: '/dashboard/settings',
  },
  API: {
    AUTH: '/api/auth',
    NOTES: '/api/notes',
    TIME_BLOCKS: '/api/time-blocks',
    AI: '/api/ai',
  },
} as const;

export const LIMITS = {
  FREE: {
    NOTES: 10,
    FOLDERS: 3,
    DEVICES: 1,
  },
  PRO: {
    NOTES: Infinity,
    FOLDERS: Infinity,
    DEVICES: Infinity,
  },
} as const;

export const PRICING = {
  PRO: {
    MONTHLY: 8,
    YEARLY: 80,
  },
  LAUNCH_DISCOUNT: {
    MONTHLY: 4,
    PERCENTAGE: 50,
  },
} as const;
