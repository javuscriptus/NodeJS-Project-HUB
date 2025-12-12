import { describe, it, expect } from 'vitest';
const { CommandExecutor } = require('../src/main/utils/commandExecutor.js');

describe('CommandExecutor', () => {
  describe('validatePath', () => {
    it('should normalize valid paths', () => {
      const result = CommandExecutor.validatePath('/home/user/project');
      expect(result).toBe('/home/user/project');
    });

    it('should throw error for empty path', () => {
      expect(() => CommandExecutor.validatePath('')).toThrow('Invalid project path');
    });

    it('should throw error for null path', () => {
      expect(() => CommandExecutor.validatePath(null)).toThrow('Invalid project path');
    });

    it('should throw error for non-string path', () => {
      expect(() => CommandExecutor.validatePath(123)).toThrow('Invalid project path');
    });

    it('should throw error for path with ~ home reference', () => {
      expect(() => CommandExecutor.validatePath('~/projects')).toThrow('Project path contains dangerous patterns');
    });

    it('should throw error for path containing .. pattern', () => {
      // Note: path.normalize resolves .. before check, so use a pattern that keeps ..
      expect(() => CommandExecutor.validatePath('../../../etc/passwd')).toThrow('Project path contains dangerous patterns');
    });

    it('should normalize Windows paths', () => {
      const result = CommandExecutor.validatePath('C:\\Users\\test\\project');
      expect(result).toBe('C:\\Users\\test\\project');
    });
  });

  describe('escapeCommand', () => {
    it('should escape backslashes', () => {
      const result = CommandExecutor.escapeCommand('path\\to\\file');
      expect(result).toBe('path\\\\to\\\\file');
    });

    it('should escape double quotes', () => {
      const result = CommandExecutor.escapeCommand('echo "hello"');
      expect(result).toBe('echo \\"hello\\"');
    });

    it('should escape dollar signs', () => {
      const result = CommandExecutor.escapeCommand('echo $HOME');
      expect(result).toBe('echo \\$HOME');
    });

    it('should escape backticks', () => {
      const result = CommandExecutor.escapeCommand('echo `date`');
      expect(result).toBe('echo \\`date\\`');
    });

    it('should escape multiple special characters', () => {
      const result = CommandExecutor.escapeCommand('$USER\\home\\`test`');
      expect(result).toBe('\\$USER\\\\home\\\\\\`test\\`');
    });

    it('should handle command without special characters', () => {
      const result = CommandExecutor.escapeCommand('npm run dev');
      expect(result).toBe('npm run dev');
    });

    it('should handle empty command string', () => {
      const result = CommandExecutor.escapeCommand('');
      expect(result).toBe('');
    });
  });

  describe('static methods exist', () => {
    it('should have executeGit method', () => {
      expect(typeof CommandExecutor.executeGit).toBe('function');
    });

    it('should have executePackageManager method', () => {
      expect(typeof CommandExecutor.executePackageManager).toBe('function');
    });

    it('should have spawnInTerminal method', () => {
      expect(typeof CommandExecutor.spawnInTerminal).toBe('function');
    });

    it('should have isCommandAvailable method', () => {
      expect(typeof CommandExecutor.isCommandAvailable).toBe('function');
    });

    it('should have getCommandVersion method', () => {
      expect(typeof CommandExecutor.getCommandVersion).toBe('function');
    });
  });
});
