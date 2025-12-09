const { ErrorHandler } = require('./errorHandler');

/**
 * Менеджер кеширования с TTL и LRU стратегией
 */
class CacheManager {
  constructor(options = {}) {
    const {
      maxSize = 100,
      defaultTTL = 5 * 60 * 1000, // 5 минут по умолчанию
      cleanupInterval = 60 * 1000 // Очистка каждую минуту
    } = options;

    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // Запускаем периодическую очистку устаревших записей
    this.cleanupTimer = setInterval(() => this.cleanup(), cleanupInterval);
  }

  /**
   * Получает значение из кеша
   * @param {string} key - Ключ
   * @returns {any|null} Значение или null если не найдено/истекло
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Проверяем TTL
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Обновляем время последнего доступа (для LRU)
    entry.lastAccessed = Date.now();
    
    return entry.value;
  }

  /**
   * Сохраняет значение в кеш
   * @param {string} key - Ключ
   * @param {any} value - Значение
   * @param {number} ttl - Time to live в миллисекундах
   */
  set(key, value, ttl = this.defaultTTL) {
    // Если кеш полон, удаляем самую старую запись (LRU)
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      lastAccessed: Date.now()
    });
  }

  /**
   * Проверяет наличие ключа в кеше
   * @param {string} key - Ключ
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Удаляет значение из кеша
   * @param {string} key - Ключ
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Очищает весь кеш
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Инвалидирует записи по паттерну
   * @param {string|RegExp} pattern - Паттерн для поиска ключей
   */
  invalidate(pattern) {
    const regex = typeof pattern === 'string' 
      ? new RegExp(pattern.replace(/\*/g, '.*'))
      : pattern;

    const keysToDelete = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    ErrorHandler.info(`Invalidated ${keysToDelete.length} cache entries`);
  }

  /**
   * Удаляет устаревшие записи
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      ErrorHandler.debug(`Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * Удаляет самую давно использованную запись (LRU)
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      ErrorHandler.debug(`Evicted LRU cache entry: ${oldestKey}`);
    }
  }

  /**
   * Возвращает статистику кеша
   * @returns {Object} Статистика
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate()
    };
  }

  /**
   * Вычисляет hit rate кеша (если трекались обращения)
   * @returns {number} Hit rate от 0 до 1
   */
  calculateHitRate() {
    // Простая реализация без детального трекинга
    return this.cache.size / this.maxSize;
  }

  /**
   * Уничтожает кеш менеджер
   */
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }

  /**
   * Создает wrapper для функции с кешированием результатов
   * @param {Function} fn - Функция для обертывания
   * @param {Object} options - Опции кеширования
   * @returns {Function} Обернутая функция
   */
  memoize(fn, options = {}) {
    const {
      keyGenerator = (...args) => JSON.stringify(args),
      ttl = this.defaultTTL
    } = options;

    return async (...args) => {
      const key = keyGenerator(...args);
      
      // Проверяем кеш
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Выполняем функцию и кешируем результат
      const result = await fn(...args);
      this.set(key, result, ttl);
      
      return result;
    };
  }
}

module.exports = { CacheManager };
