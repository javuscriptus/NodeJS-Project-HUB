const { ipcMain } = require('electron');
const { ErrorHandler } = require('./errorHandler');

/**
 * Wrapper для IPC handlers с автоматической обработкой ошибок и логированием
 */
class IpcHandler {
  /**
   * Регистрирует IPC handler с автоматической обработкой ошибок
   * @param {string} channel - Название канала
   * @param {Function} handler - Обработчик
   * @param {Object} options - Опции
   */
  static handle(channel, handler, options = {}) {
    const {
      timeout = 30000,
      logInput = true,
      logOutput = false,
      validateInput = null
    } = options;

    ipcMain.handle(channel, async (event, ...args) => {
      const startTime = Date.now();
      
      if (logInput) {
        ErrorHandler.info(`IPC [${channel}] called with args:`, args);
      }

      // Валидация входных данных
      if (validateInput) {
        try {
          validateInput(...args);
        } catch (validationError) {
          ErrorHandler.warn(`IPC [${channel}] validation failed:`, validationError.message);
          return {
            success: false,
            error: validationError.message
          };
        }
      }

      // Создаем promise с timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), timeout);
      });

      try {
        const result = await Promise.race([
          handler(event, ...args),
          timeoutPromise
        ]);

        const duration = Date.now() - startTime;
        
        if (logOutput) {
          ErrorHandler.info(`IPC [${channel}] completed in ${duration}ms:`, result);
        } else {
          ErrorHandler.info(`IPC [${channel}] completed in ${duration}ms`);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        ErrorHandler.warn(`IPC [${channel}] failed after ${duration}ms:`, error.message);
        
        return {
          success: false,
          error: ErrorHandler.getUserFriendlyMessage(error)
        };
      }
    });
  }

  /**
   * Регистрирует несколько handlers одновременно
   * @param {Object.<string, {handler: Function, options?: Object}>} handlers
   */
  static handleMultiple(handlers) {
    Object.entries(handlers).forEach(([channel, config]) => {
      const handler = typeof config === 'function' ? config : config.handler;
      const options = typeof config === 'object' ? config.options || {} : {};
      this.handle(channel, handler, options);
    });
  }

  /**
   * Создает validator для входных данных
   * @param {Object} schema - Схема валидации
   * @returns {Function} Validator функция
   */
  static createValidator(schema) {
    return (...args) => {
      Object.entries(schema).forEach(([argIndex, rules]) => {
        const value = args[argIndex];
        
        if (rules.required && (value === undefined || value === null)) {
          throw new Error(`Argument ${argIndex} is required`);
        }

        if (rules.type && typeof value !== rules.type) {
          throw new Error(`Argument ${argIndex} must be of type ${rules.type}`);
        }

        if (rules.minLength && value.length < rules.minLength) {
          throw new Error(`Argument ${argIndex} must be at least ${rules.minLength} characters`);
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          throw new Error(`Argument ${argIndex} must be at most ${rules.maxLength} characters`);
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          throw new Error(`Argument ${argIndex} has invalid format`);
        }

        if (rules.custom) {
          rules.custom(value);
        }
      });
    };
  }
}

module.exports = { IpcHandler };
