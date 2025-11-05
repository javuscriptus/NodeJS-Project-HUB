import { describe, it, expect } from 'vitest';
import { checkScripts } from '../src/main/projectScanner.js';

describe('projectScanner', () => {
  describe('checkScripts', () => {
    it('должен найти browser:dev скрипт', () => {
      const scripts = {
        'browser:dev': 'vite',
        'test': 'vitest',
        'lint': 'eslint'
      };
      
      const result = checkScripts(scripts);
      
      expect(result).toHaveProperty('browser:dev');
      expect(result['browser:dev']).toBe(true);
    });

    it('должен найти все поддерживаемые скрипты', () => {
      const scripts = {
        'browser:dev': 'vite',
        'mobile:dev': 'expo start',
        'browser:build': 'vite build',
        'mobile:build': 'expo build',
        'test': 'vitest'
      };
      
      const result = checkScripts(scripts);
      
      expect(Object.keys(result)).toHaveLength(4);
      expect(result['browser:dev']).toBe(true);
      expect(result['mobile:dev']).toBe(true);
      expect(result['browser:build']).toBe(true);
      expect(result['mobile:build']).toBe(true);
    });

    it('должен вернуть пустой объект если нет поддерживаемых скриптов', () => {
      const scripts = {
        'test': 'vitest',
        'lint': 'eslint',
        'start': 'node index.js'
      };
      
      const result = checkScripts(scripts);
      
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('должен обработать пустой объект скриптов', () => {
      const scripts = {};
      
      const result = checkScripts(scripts);
      
      expect(result).toEqual({});
    });
  });
});

