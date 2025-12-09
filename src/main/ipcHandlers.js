/**
 * Централизованные IPC handlers с использованием IpcHandler middleware
 * Улучшенная версия с валидацией, кешированием и retry механизмом
 */

const { scanFolder } = require('./projectScanner');
const {
  pullFromOrigin,
  checkRemoteStatus,
  getAllBranches,
  checkAllMainBranches,
  switchBranch,
} = require('./gitOperations');
const { runScript, openFolder } = require('./npmOperations');
const {
  loadConfig,
  saveConfig,
  addTagToProject,
  removeTagFromProject,
  getAvailableTags,
  createTag,
  getProjectTags,
  getProjectAliases,
  setProjectAliases,
  getProjectNotes,
  setProjectNotes,
  getProjectMetadata,
  getAllProjectsMetadata,
  getTerminal,
  setTerminal,
  getNodeManager,
  setNodeManager,
  getProjectNodeVersion,
  setProjectNodeVersion,
  getGitRemoteCheckEnabled,
  setGitRemoteCheckEnabled,
  getTrackedBranches,
  setTrackedBranches,
  getDefaultTrackedBranches,
  setDefaultTrackedBranches,
} = require('./config');
const { TerminalDetector } = require('./terminalDetector');
const { NodeVersionManager } = require('./nodeVersionManager');
const { SearchEngine } = require('./searchEngine');
const { ReadmeParser } = require('./readmeParser');
const { IpcHandler } = require('./utils/ipcHandler');
const { CacheManager } = require('./utils/cacheManager');
const { RetryHandler } = require('./utils/retryHandler');
const { ErrorHandler } = require('./utils/errorHandler');

// Инициализируем глобальные сервисы
const searchEngine = new SearchEngine();
const readmeParser = new ReadmeParser();
const gitCache = new CacheManager({ maxSize: 50, defaultTTL: 2 * 60 * 1000 }); // 2 минуты для git операций
const projectCache = new CacheManager({ maxSize: 100, defaultTTL: 5 * 60 * 1000 }); // 5 минут для проектов

/**
 * Регистрирует все IPC handlers
 */
function registerAllHandlers() {
  IpcHandler.handleMultiple({
    // === Проекты ===
    'scan-projects': {
      handler: async (event, { rootPath }) => {
        ErrorHandler.info('Scanning projects in:', rootPath);
        const result = await scanFolder(rootPath);
        
        // Кешируем результат сканирования
        projectCache.set(`scan:${rootPath}`, result);
        
        ErrorHandler.info('Scan complete:', result.projects.length, 'projects found');
        return result;
      },
      options: {
        timeout: 60000, // 1 минута для сканирования
        validateInput: IpcHandler.createValidator({
          0: {
            required: true,
            type: 'object',
            custom: (arg) => {
              if (!arg.rootPath || typeof arg.rootPath !== 'string') {
                throw new Error('rootPath is required and must be a string');
              }
            }
          }
        })
      }
    },

    'run-npm-script': {
      handler: async (event, { projectPath, script, packageManager }) => {
        ErrorHandler.info('Running script:', script, 'in', projectPath, 'with', packageManager || 'npm');
        const result = await runScript(projectPath, script, packageManager);
        return result;
      },
      options: {
        validateInput: IpcHandler.createValidator({
          0: {
            required: true,
            type: 'object',
            custom: (arg) => {
              if (!arg.projectPath || !arg.script) {
                throw new Error('projectPath and script are required');
              }
            }
          }
        })
      }
    },

    'open-folder': {
      handler: async (event, { path: folderPath }) => {
        ErrorHandler.info('Opening folder:', folderPath);
        const result = await openFolder(folderPath);
        return result;
      }
    },

    // === Git Operations (с retry механизмом) ===
    'git-pull': {
      handler: async (event, { projectPath }) => {
        ErrorHandler.info('Git pull in:', projectPath);
        
        // Используем retry для git pull
        const result = await RetryHandler.withRetry(
          () => pullFromOrigin(projectPath),
          {
            maxAttempts: 2,
            shouldRetry: (error) => RetryHandler.isNetworkError(error)
          }
        );
        
        // Инвалидируем кеш после pull
        gitCache.invalidate(`git:${projectPath}:*`);
        
        ErrorHandler.info('Git pull result:', result.success ? 'success' : 'failed');
        return result;
      }
    },

    'git:check-remote-status': {
      handler: async (event, projectPath, branch) => {
        ErrorHandler.info('Checking remote status for:', projectPath, branch);
        
        // Проверяем кеш
        const cacheKey = `git:${projectPath}:status:${branch}`;
        const cached = gitCache.get(cacheKey);
        if (cached) {
          ErrorHandler.info('Returning cached git status');
          return cached;
        }
        
        // Используем retry для сетевой операции
        const result = await RetryHandler.withRetry(
          () => checkRemoteStatus(projectPath, branch),
          {
            maxAttempts: 2,
            delay: 500,
            shouldRetry: (error) => RetryHandler.isNetworkError(error)
          }
        );
        
        // Кешируем результат
        gitCache.set(cacheKey, result);
        
        return result;
      }
    },

    'git:get-branches': {
      handler: async (event, projectPath) => {
        ErrorHandler.info('Getting branches for:', projectPath);
        
        // Проверяем кеш
        const cacheKey = `git:${projectPath}:branches`;
        const cached = gitCache.get(cacheKey);
        if (cached) {
          return { success: true, branches: cached };
        }
        
        const branches = await getAllBranches(projectPath);
        
        // Кешируем результат
        gitCache.set(cacheKey, branches);
        
        return { success: true, branches };
      }
    },

    'git:check-all-main-branches': {
      handler: async (event, projectPath) => {
        ErrorHandler.info('Checking all main branches for:', projectPath);
        const statuses = await checkAllMainBranches(projectPath);
        return { success: true, statuses };
      }
    },

    'git:switch-branch': {
      handler: async (event, projectPath, branch) => {
        ErrorHandler.info('Switching branch:', projectPath, branch);
        const result = await switchBranch(projectPath, branch);
        
        // Инвалидируем кеш после переключения ветки
        gitCache.invalidate(`git:${projectPath}:*`);
        
        return result;
      }
    },

    // === README и детали проекта ===
    'readme:get': {
      handler: async (event, projectPath) => {
        ErrorHandler.info('Getting README for:', projectPath);
        
        // Кешируем README
        const cacheKey = `readme:${projectPath}`;
        const cached = projectCache.get(cacheKey);
        if (cached) {
          return cached;
        }
        
        const result = await readmeParser.getReadme(projectPath);
        projectCache.set(cacheKey, result);
        
        return result;
      }
    },

    'project:get-recent-commits': {
      handler: async (event, projectPath, limit) => {
        ErrorHandler.info('Getting recent commits for:', projectPath);
        const result = await readmeParser.getRecentCommits(projectPath, limit);
        return result;
      }
    },

    'project:get-package-info': {
      handler: async (event, projectPath) => {
        ErrorHandler.info('Getting package info for:', projectPath);
        const result = await readmeParser.getPackageInfo(projectPath);
        return result;
      }
    },

    // === Конфигурация ===
    'get-config': {
      handler: async () => {
        const config = await loadConfig();
        ErrorHandler.info('Config loaded');
        return config;
      }
    },

    'save-config': {
      handler: async (event, config) => {
        ErrorHandler.info('Saving config');
        const result = await saveConfig(config);
        
        // Очищаем кеши после изменения конфига
        projectCache.clear();
        gitCache.clear();
        
        return result;
      }
    },

    // === Теги ===
    'add-tag': {
      handler: async (event, { projectPath, tag }) => {
        ErrorHandler.info('Adding tag:', tag, 'to', projectPath);
        const result = await addTagToProject(projectPath, tag);
        return result;
      }
    },

    'remove-tag': {
      handler: async (event, { projectPath, tag }) => {
        ErrorHandler.info('Removing tag:', tag, 'from', projectPath);
        const result = await removeTagFromProject(projectPath, tag);
        return result;
      }
    },

    'get-available-tags': {
      handler: async () => {
        const tags = await getAvailableTags();
        return { success: true, tags };
      }
    },

    'create-tag': {
      handler: async (event, { tag }) => {
        ErrorHandler.info('Creating new tag:', tag);
        const result = await createTag(tag);
        return result;
      }
    },

    'get-project-tags': {
      handler: async (event, { projectPath }) => {
        const tags = await getProjectTags(projectPath);
        return { success: true, tags };
      }
    },

    // === Алиасы и заметки ===
    'get-project-aliases': {
      handler: async (event, { projectPath }) => {
        const aliases = await getProjectAliases(projectPath);
        return { success: true, aliases };
      }
    },

    'set-project-aliases': {
      handler: async (event, { projectPath, aliases }) => {
        ErrorHandler.info('Setting aliases for project:', projectPath);
        const result = await setProjectAliases(projectPath, aliases);
        searchEngine.invalidateProject(projectPath);
        return result;
      }
    },

    'get-project-notes': {
      handler: async (event, { projectPath }) => {
        const notes = await getProjectNotes(projectPath);
        return { success: true, notes };
      }
    },

    'set-project-notes': {
      handler: async (event, { projectPath, notes }) => {
        ErrorHandler.info('Setting notes for project:', projectPath);
        const result = await setProjectNotes(projectPath, notes);
        searchEngine.invalidateProject(projectPath);
        return result;
      }
    },

    'get-project-metadata': {
      handler: async (event, { projectPath }) => {
        const metadata = await getProjectMetadata(projectPath);
        return { success: true, metadata };
      }
    },

    // === Поиск ===
    'search-projects': {
      handler: async (event, { query, projects }) => {
        ErrorHandler.info('Searching projects with query:', query);
        
        const metadataMap = await getAllProjectsMetadata();
        const results = searchEngine.search(query, projects, metadataMap);
        
        ErrorHandler.info('Search results:', results.length, 'projects found');
        return { success: true, projects: results };
      }
    },

    'filter-by-tag': {
      handler: async (event, { tag, projects }) => {
        ErrorHandler.info('Filtering projects by tag:', tag);
        
        const metadataMap = await getAllProjectsMetadata();
        const results = searchEngine.filterByTag(tag, projects, metadataMap);
        
        return { success: true, projects: results };
      }
    },

    'get-all-tags': {
      handler: async (event, { projects }) => {
        const metadataMap = await getAllProjectsMetadata();
        const tags = searchEngine.getAllTags(projects, metadataMap);
        return { success: true, tags };
      }
    },

    // === Терминал ===
    'terminal:detect': {
      handler: async () => {
        const detector = new TerminalDetector();
        const terminals = await detector.detectAvailableTerminals();
        ErrorHandler.info('Detected terminals:', terminals.length);
        return { success: true, terminals };
      }
    },

    'terminal:get-default': {
      handler: async () => {
        const detector = new TerminalDetector();
        const terminal = await detector.getDefaultTerminal();
        ErrorHandler.info('Default terminal:', terminal.name);
        return { success: true, terminal };
      }
    },

    'terminal:get': {
      handler: async () => {
        const terminal = await getTerminal();
        return { success: true, terminal };
      }
    },

    'terminal:set': {
      handler: async (event, { path, name, type }) => {
        ErrorHandler.info('Setting terminal:', name, path);
        const result = await setTerminal(path, name, type);
        return result;
      }
    },

    'terminal:validate': {
      handler: async (event, { path }) => {
        const detector = new TerminalDetector();
        const isValid = await detector.validateTerminalPath(path);
        return { success: true, isValid };
      }
    },

    // === Node.js Version Manager ===
    'node:detect-manager': {
      handler: async () => {
        const manager = new NodeVersionManager();
        const detected = await manager.detectNodeManager();
        ErrorHandler.info('Detected Node manager:', detected);
        return { success: true, manager: detected };
      }
    },

    'node:get-manager': {
      handler: async () => {
        const manager = await getNodeManager();
        return { success: true, manager };
      }
    },

    'node:set-manager': {
      handler: async (event, { manager }) => {
        ErrorHandler.info('Setting Node manager:', manager);
        const result = await setNodeManager(manager);
        return result;
      }
    },

    'node:get-version': {
      handler: async (event, { projectPath }) => {
        const manager = new NodeVersionManager();
        const config = await loadConfig();
        const version = await manager.getRequiredNodeVersion(projectPath, config);
        ErrorHandler.info('Node version for project:', projectPath, '=', version);
        return { success: true, version };
      }
    },

    'node:set-version': {
      handler: async (event, { projectName, version }) => {
        ErrorHandler.info('Setting Node version for project:', projectName, '=', version);
        const result = await setProjectNodeVersion(projectName, version);
        return result;
      }
    },

    'node:check-installed': {
      handler: async (event, { version, manager }) => {
        const nodeManager = new NodeVersionManager();
        const isInstalled = await nodeManager.isVersionInstalled(version, manager);
        return { success: true, isInstalled };
      }
    },

    'node:install': {
      handler: async (event, { version, manager }) => {
        ErrorHandler.info('Installing Node version:', version, 'via', manager);
        const nodeManager = new NodeVersionManager();
        const result = await nodeManager.installVersion(version, manager);
        return result;
      },
      options: {
        timeout: 300000 // 5 минут для установки Node.js
      }
    },

    // === Git Remote Check Settings ===
    'git:get-remote-check-enabled': {
      handler: async () => {
        const enabled = await getGitRemoteCheckEnabled();
        return { success: true, enabled };
      }
    },

    'git:set-remote-check-enabled': {
      handler: async (event, { enabled }) => {
        ErrorHandler.info('Setting git remote check enabled:', enabled);
        const result = await setGitRemoteCheckEnabled(enabled);
        return result;
      }
    },

    'git:get-tracked-branches': {
      handler: async (event, projectPath) => {
        const branches = await getTrackedBranches(projectPath);
        return { success: true, branches };
      }
    },

    'git:set-tracked-branches': {
      handler: async (event, { projectPath, branches }) => {
        ErrorHandler.info('Setting tracked branches for:', projectPath, branches);
        const result = await setTrackedBranches(projectPath, branches);
        return result;
      }
    },

    'git:get-default-tracked-branches': {
      handler: async () => {
        const branches = await getDefaultTrackedBranches();
        return { success: true, branches };
      }
    },

    'git:set-default-tracked-branches': {
      handler: async (event, { branches }) => {
        ErrorHandler.info('Setting default tracked branches:', branches);
        const result = await setDefaultTrackedBranches(branches);
        return result;
      }
    },
  });
}

/**
 * Очищает все кеши
 */
function clearAllCaches() {
  gitCache.clear();
  projectCache.clear();
  ErrorHandler.info('All caches cleared');
}

/**
 * Получает статистику кешей
 */
function getCacheStats() {
  return {
    git: gitCache.getStats(),
    project: projectCache.getStats(),
  };
}

module.exports = {
  registerAllHandlers,
  clearAllCaches,
  getCacheStats,
  searchEngine,
  readmeParser,
};
