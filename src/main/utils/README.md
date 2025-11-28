# Main Process Utilities

> Security and error handling utilities for Electron main process

## 📁 Files

### `errorHandler.js`
Centralized error handling for main process operations.

**Key Features:**
- Automatic error logging with context
- Error sanitization for user-facing messages
- Async and sync function wrappers
- Integration with electron-log

**Usage:**
```javascript
const { ErrorHandler } = require('./utils/errorHandler');

// Wrap async function
const result = await ErrorHandler.wrap(
  async () => await someOperation(),
  'operationContext'
);

// Direct error handling
try {
  // code
} catch (error) {
  return ErrorHandler.handle(error, 'context');
}
```

### `commandExecutor.js`
Secure shell command execution with protection against command injection.

**Key Features:**
- Uses `execFile` instead of `exec` for security
- Path validation and normalization
- Command argument escaping
- Specialized methods for Git and package managers
- Terminal spawning for interactive scripts

**Usage:**
```javascript
const { CommandExecutor } = require('./utils/commandExecutor');

// Execute Git command
const { stdout } = await CommandExecutor.executeGit(
  projectPath,
  ['status', '--porcelain']
);

// Execute npm/yarn/pnpm
await CommandExecutor.executePackageManager(
  projectPath,
  'npm',
  ['install']
);

// Spawn in terminal
const child = CommandExecutor.spawnInTerminal(
  terminal,
  'npm run dev',
  projectPath
);
```

## 🔒 Security

These utilities implement security best practices:

1. **Command Injection Prevention**
   - Uses `execFile` with separate arguments array
   - No shell interpolation of user input
   - Automatic argument escaping

2. **Path Validation**
   - Normalizes all paths
   - Checks for dangerous patterns (.., ~, $)
   - Prevents directory traversal attacks

3. **Timeouts**
   - All operations have configurable timeouts
   - Prevents hanging processes
   - Default: 30s for Git, 5min for package managers

4. **Error Sanitization**
   - Removes sensitive paths from error messages
   - User-friendly error text
   - Preserves debugging info in logs

## 📚 Documentation

Full documentation and examples:
- [Usage Examples](../../../docs/USAGE_EXAMPLES.md)
- [Improvements Guide](../../../docs/IMPROVEMENTS.md)
- [Quick Start](../../../SUGGESTED_IMPROVEMENTS.md)

## 🧪 Testing

Test these utilities:
```bash
npm test -- src/main/utils
```

## 🤝 Contributing

When modifying these utilities:
1. Maintain backward compatibility
2. Add JSDoc comments
3. Write unit tests
4. Update usage examples
5. Test on Windows, Linux, and macOS

---

**Last Updated:** 2024  
**Status:** ✅ Production Ready
