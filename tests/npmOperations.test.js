import { describe, it, expect } from 'vitest';
import { getAvailableScripts, ALLOWED_SCRIPTS } from '../src/main/npmOperations.js';

describe('npmOperations', () => {
  describe('getAvailableScripts', () => {
    it('should filter only allowed scripts from package.json', () => {
      const packageJson = {
        scripts: {
          'browser:dev': 'vite',
          'mobile:dev': 'expo start',
          'dev': 'vite',
          'test': 'vitest',
          'custom-script': 'echo test'
        }
      };
      
      const result = getAvailableScripts(packageJson);
      
      expect(result['browser:dev']).toBe(true);
      expect(result['mobile:dev']).toBe(true);
      expect(result['dev']).toBe(true);
      expect(result['test']).toBe(true);
      expect(result['custom-script']).toBeUndefined();
    });

    it('should return empty object if no allowed scripts exist', () => {
      const packageJson = {
        scripts: {
          'custom-script': 'echo test',
          'another-script': 'echo hello'
        }
      };
      
      const result = getAvailableScripts(packageJson);
      
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should handle missing scripts section', () => {
      const packageJson = {};
      
      const result = getAvailableScripts(packageJson);
      
      expect(result).toEqual({});
    });
  });

  describe('ALLOWED_SCRIPTS', () => {
    it('should contain all allowed scripts including common npm scripts', () => {
      expect(ALLOWED_SCRIPTS).toHaveLength(10);
      // Original scripts
      expect(ALLOWED_SCRIPTS).toContain('browser:dev');
      expect(ALLOWED_SCRIPTS).toContain('mobile:dev');
      expect(ALLOWED_SCRIPTS).toContain('browser:build');
      expect(ALLOWED_SCRIPTS).toContain('mobile:build');
      // Extended common scripts
      expect(ALLOWED_SCRIPTS).toContain('dev');
      expect(ALLOWED_SCRIPTS).toContain('start');
      expect(ALLOWED_SCRIPTS).toContain('build');
      expect(ALLOWED_SCRIPTS).toContain('test');
      expect(ALLOWED_SCRIPTS).toContain('lint');
      expect(ALLOWED_SCRIPTS).toContain('format');
    });
  });

  describe('getAvailableScripts with extended scripts', () => {
    it('should find common npm scripts (dev, start, build, test)', () => {
      const packageJson = {
        scripts: {
          'dev': 'vite',
          'start': 'node index.js',
          'build': 'vite build',
          'test': 'vitest',
          'lint': 'eslint src',
          'format': 'prettier --write src'
        }
      };
      
      const result = getAvailableScripts(packageJson);
      
      expect(result['dev']).toBe(true);
      expect(result['start']).toBe(true);
      expect(result['build']).toBe(true);
      expect(result['test']).toBe(true);
      expect(result['lint']).toBe(true);
      expect(result['format']).toBe(true);
    });

    it('should find mixed scripts (browser:dev + dev)', () => {
      const packageJson = {
        scripts: {
          'browser:dev': 'vite --browser',
          'dev': 'vite',
          'custom': 'echo custom'
        }
      };
      
      const result = getAvailableScripts(packageJson);
      
      expect(result['browser:dev']).toBe(true);
      expect(result['dev']).toBe(true);
      expect(result['custom']).toBeUndefined();
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should find all allowed scripts when all are present', () => {
      const packageJson = {
        scripts: {
          'browser:dev': 'vite --browser',
          'mobile:dev': 'expo start',
          'browser:build': 'vite build --browser',
          'mobile:build': 'expo build',
          'dev': 'vite',
          'start': 'node index.js',
          'build': 'vite build',
          'test': 'vitest',
          'lint': 'eslint src',
          'format': 'prettier --write src'
        }
      };
      
      const result = getAvailableScripts(packageJson);
      
      expect(Object.keys(result)).toHaveLength(10);
    });
  });
});
