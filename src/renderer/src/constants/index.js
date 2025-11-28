/**
 * Константы приложения
 * Централизованное хранение всех magic strings и numbers
 */

/**
 * Иконки для npm скриптов
 */
export const SCRIPT_ICONS = {
  'browser:dev': '🌐',
  'mobile:dev': '📱',
  'browser:build': '🔨',
  'mobile:build': '📦',
  'dev': '🚀',
  'start': '▶️',
  'build': '🔨',
  'test': '✅',
  'lint': '🔍'
};

/**
 * Иконки для package managers
 */
export const PACKAGE_MANAGER_ICONS = {
  'npm': '📦',
  'yarn': '🧶',
  'pnpm': '⚡'
};

/**
 * Статусы Git
 */
export const GIT_STATUS = {
  UP_TO_DATE: 'up-to-date',
  BEHIND: 'behind',
  AHEAD: 'ahead',
  DIVERGED: 'diverged',
  ERROR: 'error'
};

/**
 * Таймауты (в миллисекундах)
 */
export const TIMEOUTS = {
  GIT_OPERATION: 30000,     // 30 секунд
  FETCH_OPERATION: 10000,   // 10 секунд
  DEBOUNCE_SEARCH: 300,     // 300 мс
  NOTIFICATION_AUTO_HIDE: 5000  // 5 секунд
};

/**
 * Ключи localStorage
 */
export const STORAGE_KEYS = {
  THEME: 'app-theme',
  SIDEBAR_WIDTH: 'sidebar-width',
  LAST_OPENED_PROJECT: 'last-opened-project'
};

/**
 * Типы уведомлений
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Whitelist npm скриптов (безопасные для запуска)
 */
export const SAFE_SCRIPTS = [
  'browser:dev',
  'mobile:dev',
  'browser:build',
  'mobile:build',
  'dev',
  'start',
  'build',
  'test',
  'lint',
  'format'
];

/**
 * Максимальные значения
 */
export const LIMITS = {
  MAX_PROJECTS: 1000,
  MAX_TAGS: 50,
  MAX_NOTE_LENGTH: 5000,
  MAX_ALIAS_LENGTH: 100,
  MAX_SEARCH_RESULTS: 500
};

/**
 * Цвета для тегов (Tailwind классы)
 */
export const TAG_COLORS = [
  'bg-blue-500/20 border-blue-500/30 text-blue-400',
  'bg-green-500/20 border-green-500/30 text-green-400',
  'bg-purple-500/20 border-purple-500/30 text-purple-400',
  'bg-pink-500/20 border-pink-500/30 text-pink-400',
  'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
  'bg-red-500/20 border-red-500/30 text-red-400',
  'bg-indigo-500/20 border-indigo-500/30 text-indigo-400',
  'bg-teal-500/20 border-teal-500/30 text-teal-400'
];

/**
 * Регулярные выражения
 */
export const REGEX = {
  SEMANTIC_VERSION: /^\d+\.\d+\.\d+/,
  NODE_VERSION: /v?\d+\.\d+\.\d+/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

/**
 * URL'ы
 */
export const URLS = {
  GITHUB_REPO: 'https://github.com/javuscriptus/NodeJS-Project-HUB',
  ISSUES: 'https://github.com/javuscriptus/NodeJS-Project-HUB/issues',
  RELEASES: 'https://github.com/javuscriptus/NodeJS-Project-HUB/releases'
};
