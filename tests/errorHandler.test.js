import { describe, it, expect, vi } from 'vitest';
const { ErrorHandler } = require('../src/main/utils/errorHandler.js');

describe('ErrorHandler', () => {
  describe('handle', () => {
    it('should return error object with success: false', () => {
      const error = new Error('Test error');
      const result = ErrorHandler.handle(error, 'testContext');

      expect(result).toEqual({
        success: false,
        error: 'Test error'
      });
    });

    it('should sanitize error message before returning', () => {
      const error = new Error('Failed at C:\\Users\\test\\project\\file.js');
      const result = ErrorHandler.handle(error);

      expect(result.error).not.toContain('C:\\Users\\test\\project\\file.js');
      expect(result.error).toContain('<path>');
    });

    it('should handle error without code', () => {
      const error = new Error('Simple error');
      const result = ErrorHandler.handle(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Simple error');
    });
  });

  describe('wrap', () => {
    it('should return function result on success', async () => {
      const mockFn = vi.fn().mockResolvedValue({ success: true, data: 'test' });
      
      const result = await ErrorHandler.wrap(mockFn, 'testContext');

      expect(result).toEqual({ success: true, data: 'test' });
      expect(mockFn).toHaveBeenCalled();
    });

    it('should catch and handle errors', async () => {
      const error = new Error('Async error');
      const mockFn = vi.fn().mockRejectedValue(error);
      
      const result = await ErrorHandler.wrap(mockFn, 'testContext');

      expect(result).toEqual({
        success: false,
        error: 'Async error'
      });
    });
  });

  describe('wrapSync', () => {
    it('should return function result on success', () => {
      const mockFn = vi.fn().mockReturnValue({ success: true, data: 'test' });
      
      const result = ErrorHandler.wrapSync(mockFn, 'testContext');

      expect(result).toEqual({ success: true, data: 'test' });
      expect(mockFn).toHaveBeenCalled();
    });

    it('should catch and handle sync errors', () => {
      const mockFn = vi.fn().mockImplementation(() => {
        throw new Error('Sync error');
      });
      
      const result = ErrorHandler.wrapSync(mockFn, 'testContext');

      expect(result).toEqual({
        success: false,
        error: 'Sync error'
      });
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should remove Windows absolute paths', () => {
      const message = 'Error at C:\\Users\\test\\project\\file.js';
      const result = ErrorHandler.sanitizeErrorMessage(message);

      expect(result).not.toContain('C:\\Users\\test\\project\\file.js');
      expect(result).toContain('<path>');
    });

    it('should remove Unix absolute paths', () => {
      const message = 'Error at /home/user/project/file.js';
      const result = ErrorHandler.sanitizeErrorMessage(message);

      expect(result).not.toContain('/home/user/project/file.js');
      expect(result).toContain('<path>');
    });

    it('should return default message for null/undefined', () => {
      expect(ErrorHandler.sanitizeErrorMessage(null)).toBe('Неизвестная ошибка');
      expect(ErrorHandler.sanitizeErrorMessage(undefined)).toBe('Неизвестная ошибка');
    });

    it('should return default message for empty string', () => {
      expect(ErrorHandler.sanitizeErrorMessage('')).toBe('Неизвестная ошибка');
    });

    it('should preserve message without paths', () => {
      const message = 'Connection timeout';
      const result = ErrorHandler.sanitizeErrorMessage(message);

      expect(result).toBe('Connection timeout');
    });
  });

  describe('isExpectedError', () => {
    it('should return true for ENOENT', () => {
      const error = new Error('File not found');
      error.code = 'ENOENT';
      
      expect(ErrorHandler.isExpectedError(error)).toBe(true);
    });

    it('should return true for EACCES', () => {
      const error = new Error('Permission denied');
      error.code = 'EACCES';
      
      expect(ErrorHandler.isExpectedError(error)).toBe(true);
    });

    it('should return true for ETIMEDOUT', () => {
      const error = new Error('Connection timed out');
      error.code = 'ETIMEDOUT';
      
      expect(ErrorHandler.isExpectedError(error)).toBe(true);
    });

    it('should return true for ENOTDIR', () => {
      const error = new Error('Not a directory');
      error.code = 'ENOTDIR';
      
      expect(ErrorHandler.isExpectedError(error)).toBe(true);
    });

    it('should return false for unknown error codes', () => {
      const error = new Error('Unknown error');
      error.code = 'UNKNOWN';
      
      expect(ErrorHandler.isExpectedError(error)).toBe(false);
    });

    it('should return false for errors without code', () => {
      const error = new Error('Error without code');
      
      expect(ErrorHandler.isExpectedError(error)).toBe(false);
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return user-friendly message for ENOENT', () => {
      const error = new Error('Technical error');
      error.code = 'ENOENT';
      
      expect(ErrorHandler.getUserFriendlyMessage(error)).toBe('Файл или папка не найдены');
    });

    it('should return user-friendly message for EACCES', () => {
      const error = new Error('Technical error');
      error.code = 'EACCES';
      
      expect(ErrorHandler.getUserFriendlyMessage(error)).toBe('Нет прав доступа к файлу');
    });

    it('should return user-friendly message for EPERM', () => {
      const error = new Error('Technical error');
      error.code = 'EPERM';
      
      expect(ErrorHandler.getUserFriendlyMessage(error)).toBe('Операция не разрешена');
    });

    it('should return user-friendly message for ETIMEDOUT', () => {
      const error = new Error('Technical error');
      error.code = 'ETIMEDOUT';
      
      expect(ErrorHandler.getUserFriendlyMessage(error)).toBe('Превышено время ожидания операции');
    });

    it('should return user-friendly message for ENOTDIR', () => {
      const error = new Error('Technical error');
      error.code = 'ENOTDIR';
      
      expect(ErrorHandler.getUserFriendlyMessage(error)).toBe('Указанный путь не является директорией');
    });

    it('should return user-friendly message for EEXIST', () => {
      const error = new Error('Technical error');
      error.code = 'EEXIST';
      
      expect(ErrorHandler.getUserFriendlyMessage(error)).toBe('Файл уже существует');
    });

    it('should return original message for unknown error codes', () => {
      const error = new Error('Original message');
      error.code = 'UNKNOWN';
      
      expect(ErrorHandler.getUserFriendlyMessage(error)).toBe('Original message');
    });

    it('should return default message for error without message', () => {
      const error = new Error();
      error.code = 'UNKNOWN';
      
      expect(ErrorHandler.getUserFriendlyMessage(error)).toBe('Произошла ошибка');
    });
  });

  describe('static methods exist', () => {
    it('should have warn method', () => {
      expect(typeof ErrorHandler.warn).toBe('function');
    });

    it('should have info method', () => {
      expect(typeof ErrorHandler.info).toBe('function');
    });

    it('should have debug method', () => {
      expect(typeof ErrorHandler.debug).toBe('function');
    });
  });
});
