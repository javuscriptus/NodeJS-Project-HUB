# Renderer Process Utilities

> Logging and helper utilities for React renderer process

## 📁 Files

### `logger.js`
Centralized logging system for renderer process.

**Key Features:**
- Development-only logging (except errors)
- Automatic timestamps
- Log grouping and timing
- Ready for error tracking integration (Sentry, LogRocket)

**Usage:**
```javascript
import { logger } from './logger';

// Info (dev only)
logger.info('Application started');

// Warning (dev only)
logger.warn('Config not found');

// Error (always logged)
logger.error('Failed to load data', error);

// Debug (dev only)
logger.debug('State:', currentState);

// Grouping
logger.group('Operation', () => {
  logger.info('Step 1');
  logger.info('Step 2');
});

// Timing
logger.time('Heavy Operation');
// ... code ...
logger.timeEnd('Heavy Operation');
```

**Environment:**
- In development: All logs visible in console
- In production: Only errors are logged

### `api.js`
IPC API wrapper (existing file).

## 🎯 Best Practices

### When to Use Each Log Level

**`logger.info()`**
- Application state changes
- User actions
- Successful operations
```javascript
logger.info('Project scanned', { count: projects.length });
```

**`logger.warn()`**
- Recoverable errors
- Deprecated feature usage
- Fallback scenarios
```javascript
logger.warn('Config not found, using defaults');
```

**`logger.error()`**
- Unrecoverable errors
- Failed operations
- Exception handling
```javascript
logger.error('Failed to save config', error);
```

**`logger.debug()`**
- Detailed debugging info
- State dumps
- Verbose operation logs
```javascript
logger.debug('Current state:', { projects, filters, settings });
```

### Migration from console.*

Replace all `console.*` calls with `logger.*`:

```javascript
// ❌ Before
console.log('Update available:', info);
console.error('Error loading config:', error);

// ✅ After
import { logger } from './utils/logger';

logger.info('Update available:', info);
logger.error('Error loading config:', error);
```

## 🔄 Integration with Error Tracking

To add Sentry or LogRocket:

```javascript
// logger.js
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  error: (...args) => {
    console.error('[ERROR]', new Date().toISOString(), ...args);
    
    // Send to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(args[0]);
    }
  },
  // ...
};
```

## 📊 Performance

The logger has minimal performance impact:
- In production: Only errors are processed
- In development: Console API is native browser code
- No string interpolation unless needed

## 🧪 Testing

When writing tests, you can mock the logger:

```javascript
import { logger } from './logger';

// In your test
jest.spyOn(logger, 'error');
// ... test code ...
expect(logger.error).toHaveBeenCalledWith('Expected error');
```

## 📚 Documentation

Full documentation:
- [Usage Examples](../../../../docs/USAGE_EXAMPLES.md)
- [Improvements Guide](../../../../docs/IMPROVEMENTS.md)

---

**Last Updated:** 2024  
**Status:** ✅ Production Ready
