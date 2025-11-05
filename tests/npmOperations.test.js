import { describe, it, expect } from 'vitest';
import { getAvailableScripts, ALLOWED_SCRIPTS } from '../src/main/npmOperations.js';

describe('npmOperations', () => {
  describe('getAvailableScripts', () => {
    it('должен фильтровать только разрешенные скрипты', () => {
      const packageJson = {
        scripts: {
          'browser:dev': 'vite',
          'mobile:dev': 'expo start',
          'test': 'vitest',
          'custom-script': 'echo test'
        }
      };
      
      const result = getAvailableScripts(packageJson);
      
      expect(result['browser:dev']).toBe(true);
      expect(result['mobile:dev']).toBe(true);
      expect(result['test']).toBeUndefined();
      expect(result['custom-script']).toBeUndefined();
    });

    it('должен вернуть пустой объект если нет разрешенных скриптов', () => {
      const packageJson = {
        scripts: {
          'test': 'vitest',
          'lint': 'eslint'
        }
      };
      
      const result = getAvailableScripts(packageJson);
      
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('должен обработать отсутствие секции scripts', () => {
      const packageJson = {};
      
      const result = getAvailableScripts(packageJson);
      
      expect(result).toEqual({});
    });
  });

  describe('ALLOWED_SCRIPTS', () => {
    it('должен содержать только 4 разрешенных скрипта', () => {
      expect(ALLOWED_SCRIPTS).toHaveLength(4);
      expect(ALLOWED_SCRIPTS).toContain('browser:dev');
      expect(ALLOWED_SCRIPTS).toContain('mobile:dev');
      expect(ALLOWED_SCRIPTS).toContain('browser:build');
      expect(ALLOWED_SCRIPTS).toContain('mobile:build');
    });
  });
});

