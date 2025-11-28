const log = require('electron-log');

/**
 * Централизованная обработка ошибок для Main Process
 */
class ErrorHandler {
  /**
   * Обрабатывает ошибку и логирует её
   * @param {Error} error - Ошибка для обработки
   * @param {string} context - Контекст, в котором произошла ошибка
   * @returns {{success: false, error: string}} Объект с информацией об ошибке
   */
  static handle(error, context = '') {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      code: error.code,
      context,
      timestamp: new Date().toISOString()
    };

    log.error('Error occurred:', errorInfo);
    
    return {
      success: false,
      error: this.sanitizeErrorMessage(error.message)
    };
  }

  /**
   * Оборачивает асинхронную функцию в try-catch с автоматической обработкой ошибок
   * @param {Function} fn - Асинхронная функция для выполнения
   * @param {string} context - Контекст операции
   * @returns {Promise<any>} Результат выполнения или объект с ошибкой
   */
  static async wrap(fn, context = '') {
    try {
      return await fn();
    } catch (error) {
      return this.handle(error, context);
    }
  }

  /**
   * Оборачивает синхронную функцию в try-catch
   * @param {Function} fn - Функция для выполнения
   * @param {string} context - Контекст операции
   * @returns {any} Результат выполнения или объект с ошибкой
   */
  static wrapSync(fn, context = '') {
    try {
      return fn();
    } catch (error) {
      return this.handle(error, context);
    }
  }

  /**
   * Санитизирует сообщение об ошибке для отображения пользователю
   * (убирает технические детали, пути к файлам и т.д.)
   * @param {string} message - Исходное сообщение
   * @returns {string} Санитизированное сообщение
   */
  static sanitizeErrorMessage(message) {
    if (!message) return 'Неизвестная ошибка';
    
    // Убираем абсолютные пути
    message = message.replace(/[A-Z]:\\[^\s]*/g, '<path>');
    message = message.replace(/\/[^\s]*/g, '<path>');
    
    return message;
  }

  /**
   * Проверяет, является ли ошибка "ожидаемой" (не критической)
   * @param {Error} error - Ошибка для проверки
   * @returns {boolean} true если ошибка ожидаемая
   */
  static isExpectedError(error) {
    const expectedCodes = [
      'ENOENT',      // Файл не найден
      'EACCES',      // Нет доступа
      'ETIMEDOUT',   // Таймаут
      'ENOTDIR'      // Не директория
    ];
    
    return expectedCodes.includes(error.code);
  }

  /**
   * Создаёт пользовательское сообщение об ошибке на основе кода
   * @param {Error} error - Ошибка
   * @returns {string} Пользовательское сообщение
   */
  static getUserFriendlyMessage(error) {
    const messages = {
      'ENOENT': 'Файл или папка не найдены',
      'EACCES': 'Нет прав доступа к файлу',
      'EPERM': 'Операция не разрешена',
      'ETIMEDOUT': 'Превышено время ожидания операции',
      'ENOTDIR': 'Указанный путь не является директорией',
      'EEXIST': 'Файл уже существует'
    };

    return messages[error.code] || error.message || 'Произошла ошибка';
  }

  /**
   * Логирует предупреждение
   * @param {string} message - Сообщение
   * @param {any} data - Дополнительные данные
   */
  static warn(message, data = null) {
    log.warn(message, data);
  }

  /**
   * Логирует информационное сообщение
   * @param {string} message - Сообщение
   * @param {any} data - Дополнительные данные
   */
  static info(message, data = null) {
    log.info(message, data);
  }

  /**
   * Логирует отладочную информацию
   * @param {string} message - Сообщение
   * @param {any} data - Дополнительные данные
   */
  static debug(message, data = null) {
    log.debug(message, data);
  }
}

module.exports = { ErrorHandler };
