import { describe, it, expect } from 'vitest';

// Import the module to test its exports
const gitOperations = require('../src/main/gitOperations.js');

describe('gitOperations', () => {
  describe('module exports', () => {
    it('should export getCurrentBranch function', () => {
      expect(typeof gitOperations.getCurrentBranch).toBe('function');
    });

    it('should export pullFromOrigin function', () => {
      expect(typeof gitOperations.pullFromOrigin).toBe('function');
    });

    it('should export isGitRepository function', () => {
      expect(typeof gitOperations.isGitRepository).toBe('function');
    });

    it('should export getGitStatus function', () => {
      expect(typeof gitOperations.getGitStatus).toBe('function');
    });

    it('should export checkRemoteStatus function', () => {
      expect(typeof gitOperations.checkRemoteStatus).toBe('function');
    });

    it('should export getAllBranches function', () => {
      expect(typeof gitOperations.getAllBranches).toBe('function');
    });

    it('should export checkAllMainBranches function', () => {
      expect(typeof gitOperations.checkAllMainBranches).toBe('function');
    });

    it('should export switchBranch function', () => {
      expect(typeof gitOperations.switchBranch).toBe('function');
    });
  });

  describe('function signatures', () => {
    it('getCurrentBranch should accept projectPath parameter', async () => {
      // Test with invalid path to verify it handles errors gracefully
      const result = await gitOperations.getCurrentBranch('/nonexistent/path');
      expect(result).toBeNull(); // Returns null on error
    });

    it('pullFromOrigin should accept projectPath parameter', async () => {
      // Test with invalid path to verify it handles errors gracefully
      const result = await gitOperations.pullFromOrigin('/nonexistent/path');
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('message');
    });

    it('isGitRepository should accept projectPath parameter', async () => {
      // Test with invalid path to verify it handles errors gracefully
      const result = await gitOperations.isGitRepository('/nonexistent/path');
      expect(result).toBe(false);
    });

    it('getGitStatus should accept projectPath parameter', async () => {
      // Test with invalid path to verify it handles errors gracefully
      const result = await gitOperations.getGitStatus('/nonexistent/path');
      expect(result).toEqual({
        hasChanges: false,
        changesCount: 0,
        staged: 0,
        unstaged: 0,
        untracked: 0
      });
    });

    it('checkRemoteStatus should accept projectPath and branch parameters', async () => {
      // Test with invalid path to verify it handles errors gracefully
      const result = await gitOperations.checkRemoteStatus('/nonexistent/path', 'main');
      expect(result).toHaveProperty('status', 'error');
      expect(result).toHaveProperty('branch', 'main');
    });

    it('getAllBranches should accept projectPath parameter', async () => {
      // Test with invalid path to verify it handles errors gracefully
      const result = await gitOperations.getAllBranches('/nonexistent/path');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('checkAllMainBranches should accept projectPath parameter', async () => {
      // Test with invalid path to verify it handles errors gracefully
      const result = await gitOperations.checkAllMainBranches('/nonexistent/path');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('switchBranch should accept projectPath and branch parameters', async () => {
      // Test with invalid path to verify it handles errors gracefully
      const result = await gitOperations.switchBranch('/nonexistent/path', 'main');
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('message');
    });
  });

  describe('error handling', () => {
    it('getCurrentBranch should return null for invalid repository', async () => {
      const result = await gitOperations.getCurrentBranch('/tmp/not-a-repo-123456');
      expect(result).toBeNull();
    });

    it('pullFromOrigin should return error object for invalid repository', async () => {
      const result = await gitOperations.pullFromOrigin('/tmp/not-a-repo-123456');
      expect(result.success).toBe(false);
      expect(typeof result.message).toBe('string');
    });

    it('isGitRepository should return false for non-git directory', async () => {
      const result = await gitOperations.isGitRepository('/tmp');
      expect(result).toBe(false);
    });

    it('getGitStatus should return default status for invalid repository', async () => {
      const result = await gitOperations.getGitStatus('/tmp/not-a-repo-123456');
      expect(result.hasChanges).toBe(false);
      expect(result.changesCount).toBe(0);
    });

    it('getAllBranches should return empty array for invalid repository', async () => {
      const result = await gitOperations.getAllBranches('/tmp/not-a-repo-123456');
      expect(result).toEqual([]);
    });

    it('switchBranch should return error for invalid repository', async () => {
      const result = await gitOperations.switchBranch('/tmp/not-a-repo-123456', 'main');
      expect(result.success).toBe(false);
    });
  });
});
