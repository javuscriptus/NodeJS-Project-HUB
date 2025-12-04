const { ErrorHandler } = require('./errorHandler');

/**
 * Утилита для retry логики при сетевых операциях
 */
class RetryHandler {
  /**
   * Выполняет операцию с повторными попытками
   * @param {Function} operation - Асинхронная операция
   * @param {Object} options - Опции retry
   * @returns {Promise<any>} Результат операции
   */
  static async withRetry(operation, options = {}) {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = 2,
      onRetry = null,
      shouldRetry = null
    } = options;

    let lastError;
    let currentDelay = delay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Проверяем, нужно ли делать retry
        if (shouldRetry && !shouldRetry(error, attempt)) {
          throw error;
        }

        // Если это последняя попытка - бросаем ошибку
        if (attempt === maxAttempts) {
          ErrorHandler.warn(`Operation failed after ${maxAttempts} attempts:`, error.message);
          throw error;
        }

        // Логируем retry
        ErrorHandler.info(`Retry attempt ${attempt}/${maxAttempts} after ${currentDelay}ms`);
        
        if (onRetry) {
          onRetry(error, attempt);
        }

        // Ждем перед следующей попыткой
        await this.sleep(currentDelay);
        
        // Увеличиваем delay для следующей попытки (exponential backoff)
        currentDelay *= backoff;
      }
    }

    throw lastError;
  }

  /**
   * Проверяет, является ли ошибка сетевой (подходит для retry)
   * @param {Error} error - Ошибка
   * @returns {boolean}
   */
  static isNetworkError(error) {
    const networkErrorCodes = [
      'ETIMEDOUT',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ENETUNREACH',
      'EAI_AGAIN'
    ];

    return networkErrorCodes.includes(error.code) ||
           error.message.includes('timeout') ||
           error.message.includes('network');
  }

  /**
   * Sleep утилита
   * @param {number} ms - Миллисекунды
   * @returns {Promise<void>}
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Создает retry wrapper для функции
   * @param {Function} fn - Функция для обертывания
   * @param {Object} options - Опции retry
   * @returns {Function} Обернутая функция
   */
  static wrap(fn, options = {}) {
    return async (...args) => {
      return this.withRetry(() => fn(...args), options);
    };
  }
}

module.exports = { RetryHandler };
