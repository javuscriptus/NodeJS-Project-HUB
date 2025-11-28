# ✅ Implementation Checklist

> Step-by-step guide to apply all improvements

---

## Phase 1: Setup (5-10 minutes)

### Step 1.1: Install Dependencies
```bash
npm install --save-dev eslint-plugin-react eslint-plugin-react-hooks prettier
```

**Verify:**
```bash
npm list eslint-plugin-react eslint-plugin-react-hooks prettier
```

### Step 1.2: Run Initial Lint
```bash
npm run lint
```

**Expected:** ESLint runs and shows issues (will fix in next phases)

---

## Phase 2: Apply Security Improvements (2-3 hours)

### Step 2.1: Update gitOperations.js

**File:** `src/main/gitOperations.js`

**Changes needed:**
1. Import CommandExecutor at the top
2. Replace all `execPromise()` calls with `CommandExecutor.executeGit()`

**Example:**
```javascript
// Add import
const { CommandExecutor } = require('./utils/commandExecutor');

// Replace
// OLD:
const { stdout, stderr } = await execPromise(
  `git -C "${projectPath}" pull origin dev`,
  { timeout: GIT_TIMEOUT }
);

// NEW:
const { stdout, stderr } = await CommandExecutor.executeGit(
  projectPath,
  ['pull', 'origin', 'dev'],
  { timeout: GIT_TIMEOUT }
);
```

**Checklist:**
- [ ] Import CommandExecutor
- [ ] Replace getCurrentBranch
- [ ] Replace pullFromOrigin
- [ ] Replace getGitStatus
- [ ] Replace checkRemoteStatus
- [ ] Replace getAllBranches
- [ ] Replace switchBranch
- [ ] Test Git operations still work

### Step 2.2: Update npmOperations.js

**File:** `src/main/npmOperations.js`

**Changes needed:**
1. Import CommandExecutor
2. Replace spawn calls with CommandExecutor.spawnInTerminal

**Checklist:**
- [ ] Import CommandExecutor
- [ ] Replace runScript implementation
- [ ] Test npm script execution works

### Step 2.3: Test Security Improvements

**Manual tests:**
- [ ] Try running git pull
- [ ] Try running npm scripts
- [ ] Try with path containing spaces
- [ ] Verify no crashes with invalid paths

---

## Phase 3: Apply Logging (1 hour)

### Step 3.1: Update App.jsx

**File:** `src/renderer/src/App.jsx`

**Changes needed:**
```javascript
// Add import at top
import { logger } from './utils/logger';

// Replace all console.* calls
// OLD: console.log('Update available:', info);
// NEW: logger.info('Update available:', info);

// OLD: console.error('Error loading config:', error);
// NEW: logger.error('Error loading config:', error);
```

**Checklist:**
- [ ] Import logger
- [ ] Replace console.log → logger.info
- [ ] Replace console.error → logger.error
- [ ] Replace console.warn → logger.warn
- [ ] Test logs appear in dev mode

### Step 3.2: Update Other Components

**Files to update:**
- [ ] `src/renderer/src/components/ProjectRow.jsx`
- [ ] `src/renderer/src/components/ProjectDetailPanel.jsx`
- [ ] `src/renderer/src/components/ProjectSettingsModal.jsx`
- [ ] `src/renderer/src/components/SettingsModal.jsx`
- [ ] `src/renderer/src/components/TagFilter.jsx`
- [ ] `src/renderer/src/components/TagManager.jsx`
- [ ] `src/renderer/src/components/UpdateNotification.jsx`

**For each file:**
1. Import logger
2. Replace console.* calls
3. Test component still works

---

## Phase 4: Apply Constants (30 minutes)

### Step 4.1: Update ProjectRow.jsx

**File:** `src/renderer/src/components/ProjectRow.jsx`

**Changes needed:**
```javascript
// Add import
import { SCRIPT_ICONS, PACKAGE_MANAGER_ICONS } from '../constants';

// Remove local definitions
// DELETE:
// const scriptIcons = { ... };
// const packageManagerIcons = { ... };

// Use imported constants
const icon = SCRIPT_ICONS[scriptName];
const pmIcon = PACKAGE_MANAGER_ICONS[packageManager];
```

**Checklist:**
- [ ] Import constants
- [ ] Remove local scriptIcons definition
- [ ] Remove local packageManagerIcons definition
- [ ] Use SCRIPT_ICONS from import
- [ ] Use PACKAGE_MANAGER_ICONS from import
- [ ] Test icons display correctly

### Step 4.2: Update Other Components (if needed)

**Search for magic values:**
```bash
grep -r "30000\|5000\|300" src/renderer/src/
```

**Replace with constants from:**
`src/renderer/src/constants/index.js`

---

## Phase 5: Error Handling (Already done!)

### Step 5.1: Error Boundary
- [x] ErrorBoundary component created
- [x] Wrapped App in ErrorBoundary
- [ ] Test error boundary catches errors

**Test:**
Add temporary error in App.jsx:
```javascript
if (Math.random() > 0.5) throw new Error('Test error');
```

**Expected:** Error UI displays instead of white screen

### Step 5.2: Main Process Error Handler

**Optional:** Update IPC handlers to use ErrorHandler.wrap()

**Example in main/index.js:**
```javascript
const { ErrorHandler } = require('./utils/errorHandler');

ipcMain.handle('scan-projects', async (event, rootPath) => {
  return await ErrorHandler.wrap(
    async () => {
      const projects = await scanFolder(rootPath);
      return { success: true, projects };
    },
    'scan-projects'
  );
});
```

---

## Phase 6: Code Quality (30 minutes)

### Step 6.1: Run Linter
```bash
npm run lint
```

### Step 6.2: Auto-fix Issues
```bash
npm run lint:fix
```

### Step 6.3: Format Code
```bash
npm run format
```

### Step 6.4: Review Warnings

**Check output and fix remaining issues manually**

---

## Phase 7: Testing (1-2 hours)

### Step 7.1: Manual Testing
- [ ] Application starts without errors
- [ ] Scan projects works
- [ ] Run npm scripts works
- [ ] Git pull works
- [ ] Settings save/load works
- [ ] Tags work
- [ ] Search works
- [ ] Detail panel works

### Step 7.2: Test Error Scenarios
- [ ] Invalid project path
- [ ] Git not available
- [ ] Network offline (git remote check)
- [ ] React component error (error boundary)

### Step 7.3: Test on Multiple Platforms
- [ ] Windows
- [ ] Linux (if applicable)
- [ ] macOS (if applicable)

---

## Phase 8: Documentation Review (15 minutes)

### Step 8.1: Update CHANGELOG
Add entry about improvements to main CHANGELOG.md

### Step 8.2: Verify Documentation Links
- [ ] README.md links work
- [ ] All documentation files accessible
- [ ] No broken internal links

---

## Phase 9: Pre-commit Hooks (Optional, 30 minutes)

### Step 9.1: Install Husky
```bash
npm install --save-dev husky lint-staged
npx husky init
```

### Step 9.2: Configure lint-staged

**Add to package.json:**
```json
{
  "lint-staged": {
    "*.{js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### Step 9.3: Create pre-commit hook

**File:** `.husky/pre-commit`
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

### Step 9.4: Test
```bash
git add .
git commit -m "test: pre-commit hook"
```

**Expected:** Linter runs before commit

---

## Phase 10: Final Verification (15 minutes)

### Step 10.1: Clean Build
```bash
npm run build
```

**Expected:** Build completes without errors

### Step 10.2: Production Test
```bash
npm run start
```

**Expected:** Application runs from built files

### Step 10.3: Review Checklist

**All phases complete:**
- [ ] Phase 1: Setup
- [ ] Phase 2: Security improvements
- [ ] Phase 3: Logging
- [ ] Phase 4: Constants
- [ ] Phase 5: Error handling
- [ ] Phase 6: Code quality
- [ ] Phase 7: Testing
- [ ] Phase 8: Documentation
- [ ] Phase 9: Pre-commit hooks (optional)
- [ ] Phase 10: Final verification

---

## 📊 Progress Tracking

**Time estimates:**
- Phase 1: 10 min ⏱️
- Phase 2: 3 hours ⏱️⏱️⏱️
- Phase 3: 1 hour ⏱️
- Phase 4: 30 min ⏱️
- Phase 5: Already done! ✅
- Phase 6: 30 min ⏱️
- Phase 7: 2 hours ⏱️⏱️
- Phase 8: 15 min ⏱️
- Phase 9: 30 min ⏱️
- Phase 10: 15 min ⏱️

**Total: ~8 hours of work**

---

## 🆘 Troubleshooting

### ESLint errors after adding plugins
**Solution:** Run `npm run lint:fix` to auto-fix most issues

### Tests failing
**Solution:** Make sure vitest is in devDependencies (it is)

### Git operations not working
**Solution:** Verify CommandExecutor is imported correctly

### Console logs not appearing
**Solution:** Check NODE_ENV is 'development'

---

## 📚 Need Help?

- [Usage Examples](docs/USAGE_EXAMPLES.md)
- [Full Improvements Guide](docs/IMPROVEMENTS.md)
- [Russian Guide](docs/IMPROVEMENTS_RU.md)

---

**Last Updated:** 2024  
**Status:** Ready to use
