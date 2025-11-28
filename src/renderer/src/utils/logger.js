/**
 * Централизованная система логирования для renderer process
 * В production режиме логирует только ошибки
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Информационное сообщение (только в dev режиме)
   */
  info: (...args) => {
    if (isDev) {
      console.log('[INFO]', new Date().toISOString(), ...args);
    }
  },

  /**
   * Предупреждение (только в dev режиме)
   */
  warn: (...args) => {
    if (isDev) {
      console.warn('[WARN]', new Date().toISOString(), ...args);
    }
  },

  /**
   * Ошибка (логируется всегда)
   */
  error: (...args) => {
    console.error('[ERROR]', new Date().toISOString(), ...args);
    // Здесь можно добавить отправку в сервис мониторинга ошибок
    // например, Sentry, LogRocket, или собственный backend
  },

  /**
   * Отладочная информация (только в dev режиме)
   */
  debug: (...args) => {
    if (isDev) {
      console.debug('[DEBUG]', new Date().toISOString(), ...args);
    }
  },

  /**
   * Группа логов (только в dev режиме)
   */
  group: (label, callback) => {
    if (isDev) {
      console.group(`[GROUP] ${label}`);
      try {
        callback();
      } finally {
        console.groupEnd();
      }
    }
  },

  /**
   * Замер времени выполнения (только в dev режиме)
   */
  time: (label) => {
    if (isDev) {
      console.time(`[TIME] ${label}`);
    }
  },

  timeEnd: (label) => {
    if (isDev) {
      console.timeEnd(`[TIME] ${label}`);
    }
  }
};

export default logger;
