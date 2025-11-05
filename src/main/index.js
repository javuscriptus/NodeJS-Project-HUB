const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const log = require('electron-log');

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
const { AutoUpdater } = require('./autoUpdater');

// Настройка логирования
log.transports.file.resolvePathFn = () => {
  return path.join(app.getPath('appData'), 'BettingsProjectHub', 'logs', 'main.log');
};
log.transports.file.level = 'info';

// Инициализация поискового движка
const searchEngine = new SearchEngine();

// Инициализация парсера README
const readmeParser = new ReadmeParser();

let mainWindow;
let updater;

/**
 * Создание главного окна приложения
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'nodejs project hub',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    icon: path.join(__dirname, '../../build/icon.ico'),
  });

  // В разработке загружаем Vite dev server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // В продакшене загружаем собранный HTML
    const htmlPath = path.join(__dirname, '../../dist/renderer/index.html');
    log.info('Loading HTML from:', htmlPath);
    log.info('__dirname:', __dirname);
    mainWindow.loadFile(htmlPath).catch(err => {
      log.error('Failed to load HTML:', err);
    });

    // Открываем DevTools для отладки
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Логируем ошибки загрузки
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    log.info('Console:', message);
  });

  log.info('Main window created');
}

/**
 * IPC Handlers
 */

// Сканирование проектов
ipcMain.handle('scan-projects', async (event, { rootPath }) => {
  try {
    log.info('Scanning projects in:', rootPath);
    const result = await scanFolder(rootPath);
    log.info('Scan complete:', result.projects.length, 'projects found');
    return result;
  } catch (error) {
    log.error('Scan error:', error);
    return {
      success: false,
      projects: [],
      error: error.message,
    };
  }
});

// Запуск npm/yarn/pnpm скрипта
ipcMain.handle('run-npm-script', async (event, { projectPath, script, packageManager }) => {
  try {
    log.info('Running script:', script, 'in', projectPath, 'with', packageManager || 'npm');
    const result = await runScript(projectPath, script, packageManager);
    return result;
  } catch (error) {
    log.error('Run script error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// Git pull
ipcMain.handle('git-pull', async (event, { projectPath }) => {
  try {
    log.info('Git pull in:', projectPath);
    const result = await pullFromOrigin(projectPath);
    log.info('Git pull result:', result.success ? 'success' : 'failed');
    return result;
  } catch (error) {
    log.error('Git pull error:', error);
    return {
      success: false,
      message: error.message,
    };
  }
});

// Git: проверка remote статуса ветки
ipcMain.handle('git:check-remote-status', async (event, projectPath, branch) => {
  try {
    log.info('Checking remote status for:', projectPath, branch);
    const result = await checkRemoteStatus(projectPath, branch);
    return result;
  } catch (error) {
    log.error('Check remote status error:', error);
    return {
      status: 'error',
      branch,
      error: error.message,
    };
  }
});

// Git: получить все ветки
ipcMain.handle('git:get-branches', async (event, projectPath) => {
  try {
    log.info('Getting branches for:', projectPath);
    const branches = await getAllBranches(projectPath);
    return { success: true, branches };
  } catch (error) {
    log.error('Get branches error:', error);
    return {
      success: false,
      error: error.message,
      branches: [],
    };
  }
});

// Git: проверка статуса всех main веток
ipcMain.handle('git:check-all-main-branches', async (event, projectPath) => {
  try {
    log.info('Checking all main branches for:', projectPath);
    const statuses = await checkAllMainBranches(projectPath);
    return { success: true, statuses };
  } catch (error) {
    log.error('Check all main branches error:', error);
    return {
      success: false,
      error: error.message,
      statuses: [],
    };
  }
});

// Git: переключение ветки
ipcMain.handle('git:switch-branch', async (event, projectPath, branch) => {
  try {
    log.info('Switching branch:', projectPath, branch);
    const result = await switchBranch(projectPath, branch);
    return result;
  } catch (error) {
    log.error('Switch branch error:', error);
    return {
      success: false,
      message: error.message,
    };
  }
});

// README и детали проекта
ipcMain.handle('readme:get', async (event, projectPath) => {
  try {
    log.info('Getting README for:', projectPath);
    const result = await readmeParser.getReadme(projectPath);
    return result;
  } catch (error) {
    log.error('Get README error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle('project:get-recent-commits', async (event, projectPath, limit) => {
  try {
    log.info('Getting recent commits for:', projectPath);
    const result = await readmeParser.getRecentCommits(projectPath, limit);
    return result;
  } catch (error) {
    log.error('Get recent commits error:', error);
    return {
      success: false,
      error: error.message,
      commits: [],
    };
  }
});

ipcMain.handle('project:get-package-info', async (event, projectPath) => {
  try {
    log.info('Getting package info for:', projectPath);
    const result = await readmeParser.getPackageInfo(projectPath);
    return result;
  } catch (error) {
    log.error('Get package info error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// Открытие папки в Explorer
ipcMain.handle('open-folder', async (event, { path: folderPath }) => {
  try {
    log.info('Opening folder:', folderPath);
    const result = await openFolder(folderPath);
    return result;
  } catch (error) {
    log.error('Open folder error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// Загрузка конфигурации
ipcMain.handle('get-config', async () => {
  try {
    const config = await loadConfig();
    log.info('Config loaded');
    return config;
  } catch (error) {
    log.error('Load config error:', error);
    return {};
  }
});

// Сохранение конфигурации
ipcMain.handle('save-config', async (event, config) => {
  try {
    log.info('Saving config:', config);
    const result = await saveConfig(config);
    return result;
  } catch (error) {
    log.error('Save config error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// Диалог выбора папки
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Выберите корневую папку с проектами',
    });

    log.info('Folder selection:', result.canceled ? 'canceled' : result.filePaths[0]);
    return result;
  } catch (error) {
    log.error('Select folder error:', error);
    return {
      canceled: true,
      filePaths: [],
    };
  }
});

// Управление тегами
ipcMain.handle('add-tag', async (event, { projectPath, tag }) => {
  try {
    log.info('Adding tag:', tag, 'to', projectPath);
    const result = await addTagToProject(projectPath, tag);
    return result;
  } catch (error) {
    log.error('Add tag error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-tag', async (event, { projectPath, tag }) => {
  try {
    log.info('Removing tag:', tag, 'from', projectPath);
    const result = await removeTagFromProject(projectPath, tag);
    return result;
  } catch (error) {
    log.error('Remove tag error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-available-tags', async () => {
  try {
    const tags = await getAvailableTags();
    return { success: true, tags };
  } catch (error) {
    log.error('Get available tags error:', error);
    return { success: false, tags: [], error: error.message };
  }
});

ipcMain.handle('create-tag', async (event, { tag }) => {
  try {
    log.info('Creating new tag:', tag);
    const result = await createTag(tag);
    return result;
  } catch (error) {
    log.error('Create tag error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-project-tags', async (event, { projectPath }) => {
  try {
    const tags = await getProjectTags(projectPath);
    return { success: true, tags };
  } catch (error) {
    log.error('Get project tags error:', error);
    return { success: false, tags: [], error: error.message };
  }
});

// Получить алиасы проекта
ipcMain.handle('get-project-aliases', async (event, { projectPath }) => {
  try {
    const aliases = await getProjectAliases(projectPath);
    return { success: true, aliases };
  } catch (error) {
    log.error('Get project aliases error:', error);
    return { success: false, aliases: [], error: error.message };
  }
});

// Установить алиасы проекта
ipcMain.handle('set-project-aliases', async (event, { projectPath, aliases }) => {
  try {
    log.info('Setting aliases for project:', projectPath);
    const result = await setProjectAliases(projectPath, aliases);

    // Инвалидировать кэш поиска для этого проекта
    searchEngine.invalidateProject(projectPath);

    return result;
  } catch (error) {
    log.error('Set project aliases error:', error);
    return { success: false, error: error.message };
  }
});

// Получить заметки проекта
ipcMain.handle('get-project-notes', async (event, { projectPath }) => {
  try {
    const notes = await getProjectNotes(projectPath);
    return { success: true, notes };
  } catch (error) {
    log.error('Get project notes error:', error);
    return { success: false, notes: '', error: error.message };
  }
});

// Установить заметки проекта
ipcMain.handle('set-project-notes', async (event, { projectPath, notes }) => {
  try {
    log.info('Setting notes for project:', projectPath);
    const result = await setProjectNotes(projectPath, notes);

    // Инвалидировать кэш поиска для этого проекта
    searchEngine.invalidateProject(projectPath);

    return result;
  } catch (error) {
    log.error('Set project notes error:', error);
    return { success: false, error: error.message };
  }
});

// Получить все метаданные проекта
ipcMain.handle('get-project-metadata', async (event, { projectPath }) => {
  try {
    const metadata = await getProjectMetadata(projectPath);
    return { success: true, metadata };
  } catch (error) {
    log.error('Get project metadata error:', error);
    return { success: false, metadata: { tags: [], aliases: [], notes: '' }, error: error.message };
  }
});

// Поиск проектов
ipcMain.handle('search-projects', async (event, { query, projects }) => {
  try {
    log.info('Searching projects with query:', query);

    // Получаем метаданные всех проектов
    const metadataMap = await getAllProjectsMetadata();

    // Выполняем поиск
    const results = searchEngine.search(query, projects, metadataMap);

    log.info('Search results:', results.length, 'projects found');
    return { success: true, projects: results };
  } catch (error) {
    log.error('Search projects error:', error);
    return { success: false, projects: [], error: error.message };
  }
});

// Фильтрация по тегу
ipcMain.handle('filter-by-tag', async (event, { tag, projects }) => {
  try {
    log.info('Filtering projects by tag:', tag);

    // Получаем метаданные всех проектов
    const metadataMap = await getAllProjectsMetadata();

    // Выполняем фильтрацию
    const results = searchEngine.filterByTag(tag, projects, metadataMap);

    return { success: true, projects: results };
  } catch (error) {
    log.error('Filter by tag error:', error);
    return { success: false, projects: [], error: error.message };
  }
});

// Получить все теги
ipcMain.handle('get-all-tags', async (event, { projects }) => {
  try {
    // Получаем метаданные всех проектов
    const metadataMap = await getAllProjectsMetadata();

    // Получаем все теги
    const tags = searchEngine.getAllTags(projects, metadataMap);

    return { success: true, tags };
  } catch (error) {
    log.error('Get all tags error:', error);
    return { success: false, tags: [], error: error.message };
  }
});

// Автообновления
ipcMain.handle('check-for-updates', async () => {
  try {
    log.info('Manual update check requested');
    const result = await autoUpdater.checkForUpdates();
    return { success: true, updateInfo: result?.updateInfo };
  } catch (error) {
    log.error('Check for updates error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    log.info('Download update requested');
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    log.error('Download update error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('install-update', () => {
  log.info('Install update requested');
  autoUpdater.quitAndInstall(false, true);
});

// Определение доступных терминалов
ipcMain.handle('terminal:detect', async () => {
  try {
    const detector = new TerminalDetector();
    const terminals = await detector.detectAvailableTerminals();
    log.info('Detected terminals:', terminals.length);
    return { success: true, terminals };
  } catch (error) {
    log.error('Detect terminals error:', error);
    return { success: false, error: error.message, terminals: [] };
  }
});

// Получить дефолтный терминал
ipcMain.handle('terminal:get-default', async () => {
  try {
    const detector = new TerminalDetector();
    const terminal = await detector.getDefaultTerminal();
    log.info('Default terminal:', terminal.name);
    return { success: true, terminal };
  } catch (error) {
    log.error('Get default terminal error:', error);
    return { success: false, error: error.message, terminal: null };
  }
});

// Получить текущий терминал из конфига
ipcMain.handle('terminal:get', async () => {
  try {
    const terminal = await getTerminal();
    return { success: true, terminal };
  } catch (error) {
    log.error('Get terminal error:', error);
    return { success: false, error: error.message, terminal: null };
  }
});

// Установить терминал
ipcMain.handle('terminal:set', async (event, { path, name, type }) => {
  try {
    log.info('Setting terminal:', name, path);
    const result = await setTerminal(path, name, type);
    return result;
  } catch (error) {
    log.error('Set terminal error:', error);
    return { success: false, error: error.message };
  }
});

// Проверить валидность терминала
ipcMain.handle('terminal:validate', async (event, { path }) => {
  try {
    const detector = new TerminalDetector();
    const isValid = await detector.validateTerminalPath(path);
    return { success: true, isValid };
  } catch (error) {
    log.error('Validate terminal error:', error);
    return { success: false, isValid: false, error: error.message };
  }
});

// Определить менеджер Node.js версий
ipcMain.handle('node:detect-manager', async () => {
  try {
    const manager = new NodeVersionManager();
    const detected = await manager.detectNodeManager();
    log.info('Detected Node manager:', detected);
    return { success: true, manager: detected };
  } catch (error) {
    log.error('Detect Node manager error:', error);
    return { success: false, manager: 'none', error: error.message };
  }
});

// Получить настройку менеджера Node.js из конфига
ipcMain.handle('node:get-manager', async () => {
  try {
    const manager = await getNodeManager();
    return { success: true, manager };
  } catch (error) {
    log.error('Get Node manager error:', error);
    return { success: false, manager: 'auto', error: error.message };
  }
});

// Установить менеджер Node.js
ipcMain.handle('node:set-manager', async (event, { manager }) => {
  try {
    log.info('Setting Node manager:', manager);
    const result = await setNodeManager(manager);
    return result;
  } catch (error) {
    log.error('Set Node manager error:', error);
    return { success: false, error: error.message };
  }
});

// Получить версию Node.js для проекта
ipcMain.handle('node:get-version', async (event, { projectPath }) => {
  try {
    const manager = new NodeVersionManager();
    const config = await loadConfig();
    const version = await manager.getRequiredNodeVersion(projectPath, config);
    log.info('Node version for project:', projectPath, '=', version);
    return { success: true, version };
  } catch (error) {
    log.error('Get Node version error:', error);
    return { success: false, version: '14.18.0', error: error.message };
  }
});

// Установить версию Node.js для проекта (вручную)
ipcMain.handle('node:set-version', async (event, { projectName, version }) => {
  try {
    log.info('Setting Node version for project:', projectName, '=', version);
    const result = await setProjectNodeVersion(projectName, version);
    return result;
  } catch (error) {
    log.error('Set Node version error:', error);
    return { success: false, error: error.message };
  }
});

// Проверить установлена ли версия Node.js
ipcMain.handle('node:check-installed', async (event, { version, manager }) => {
  try {
    const nodeManager = new NodeVersionManager();
    const isInstalled = await nodeManager.isVersionInstalled(version, manager);
    return { success: true, isInstalled };
  } catch (error) {
    log.error('Check Node version installed error:', error);
    return { success: false, isInstalled: false, error: error.message };
  }
});

// Установить версию Node.js
ipcMain.handle('node:install', async (event, { version, manager }) => {
  try {
    log.info('Installing Node version:', version, 'via', manager);
    const nodeManager = new NodeVersionManager();
    const result = await nodeManager.installVersion(version, manager);
    return result;
  } catch (error) {
    log.error('Install Node version error:', error);
    return { success: false, error: error.message };
  }
});

// ================== Git Remote Check Settings ==================

// Получить настройку проверки Git Remote Status
ipcMain.handle('git:get-remote-check-enabled', async () => {
  try {
    const enabled = await getGitRemoteCheckEnabled();
    return { success: true, enabled };
  } catch (error) {
    log.error('Get git remote check enabled error:', error);
    return { success: false, enabled: false, error: error.message };
  }
});

// Установить настройку проверки Git Remote Status
ipcMain.handle('git:set-remote-check-enabled', async (event, { enabled }) => {
  try {
    log.info('Setting git remote check enabled:', enabled);
    const result = await setGitRemoteCheckEnabled(enabled);
    return result;
  } catch (error) {
    log.error('Set git remote check enabled error:', error);
    return { success: false, error: error.message };
  }
});

// Получить список отслеживаемых веток для проекта
ipcMain.handle('git:get-tracked-branches', async (event, projectPath) => {
  try {
    const branches = await getTrackedBranches(projectPath);
    return { success: true, branches };
  } catch (error) {
    log.error('Get tracked branches error:', error);
    return { success: false, branches: ['dev', 'main'], error: error.message };
  }
});

// Установить список отслеживаемых веток для проекта
ipcMain.handle('git:set-tracked-branches', async (event, { projectPath, branches }) => {
  try {
    log.info('Setting tracked branches for:', projectPath, branches);
    const result = await setTrackedBranches(projectPath, branches);
    return result;
  } catch (error) {
    log.error('Set tracked branches error:', error);
    return { success: false, error: error.message };
  }
});

// Получить глобальный список отслеживаемых веток (по умолчанию)
ipcMain.handle('git:get-default-tracked-branches', async () => {
  try {
    const branches = await getDefaultTrackedBranches();
    return { success: true, branches };
  } catch (error) {
    log.error('Get default tracked branches error:', error);
    return { success: false, branches: ['dev', 'main'], error: error.message };
  }
});

// Установить глобальный список отслеживаемых веток (по умолчанию)
ipcMain.handle('git:set-default-tracked-branches', async (event, { branches }) => {
  try {
    log.info('Setting default tracked branches:', branches);
    const result = await setDefaultTrackedBranches(branches);
    return result;
  } catch (error) {
    log.error('Set default tracked branches error:', error);
    return { success: false, error: error.message };
  }
});

// ================== Auto-Updater IPC Handlers ==================

// Проверить обновления вручную
ipcMain.handle('updater:check', async () => {
  try {
    log.info('Manual update check requested');
    if (updater) {
      await updater.checkForUpdates();
      return { success: true };
    }
    return { success: false, error: 'Updater not initialized' };
  } catch (error) {
    log.error('Check updates error:', error);
    return { success: false, error: error.message };
  }
});

// Начать загрузку обновления
ipcMain.handle('updater:download', async () => {
  try {
    log.info('Update download requested');
    if (updater) {
      await updater.downloadUpdate();
      return { success: true };
    }
    return { success: false, error: 'Updater not initialized' };
  } catch (error) {
    log.error('Download update error:', error);
    return { success: false, error: error.message };
  }
});

// Установить обновление и перезапустить
ipcMain.handle('updater:install', async () => {
  try {
    log.info('Update install requested');
    if (updater) {
      updater.quitAndInstall();
      return { success: true };
    }
    return { success: false, error: 'Updater not initialized' };
  } catch (error) {
    log.error('Install update error:', error);
    return { success: false, error: error.message };
  }
});

// Получить текущую версию приложения
ipcMain.handle('app:get-version', async () => {
  try {
    const version = app.getVersion();
    return { success: true, version };
  } catch (error) {
    log.error('Get version error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Lifecycle events
 */

app.whenReady().then(() => {
  createWindow();

  log.info('App ready. Version:', app.getVersion());

  // Инициализация автообновлений
  updater = new AutoUpdater(mainWindow);

  // Запуск автоматической проверки обновлений (только в продакшене)
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    updater.startAutoCheck();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Останавливаем автоматическую проверку обновлений
  if (updater) {
    updater.stopAutoCheck();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  log.info('App quitting');
});
