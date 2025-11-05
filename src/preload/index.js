const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script - создает безопасный мост между Main и Renderer процессами
 * Использует contextBridge для изоляции контекста
 */

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Сканирует корневую папку на наличие проектов
   * @param {string} rootPath - путь к корневой папке
   * @returns {Promise<{success: boolean, projects: Array, error?: string}>}
   */
  scanProjects: (rootPath) => {
    return ipcRenderer.invoke('scan-projects', { rootPath });
  },

  /**
   * Запускает npm/yarn/pnpm скрипт в новом терминале
   * @param {string} projectPath - путь к проекту
   * @param {string} script - название скрипта
   * @param {string} packageManager - package manager (npm/yarn/pnpm)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  runNpmScript: (projectPath, script, packageManager) => {
    return ipcRenderer.invoke('run-npm-script', { projectPath, script, packageManager });
  },

  /**
   * Выполняет git pull origin dev
   * @param {string} projectPath - путь к проекту
   * @returns {Promise<{success: boolean, message: string}>}
   */
  gitPull: (projectPath) => {
    return ipcRenderer.invoke('git-pull', { projectPath });
  },

  /**
   * Проверяет remote статус ветки
   * @param {string} projectPath - путь к проекту
   * @param {string} branch - название ветки
   * @returns {Promise<{status: 'up-to-date'|'behind'|'error', branch: string, commitsCount?: number, error?: string}>}
   */
  checkRemoteStatus: (projectPath, branch) => {
    return ipcRenderer.invoke('git:check-remote-status', projectPath, branch);
  },

  /**
   * Получает все ветки проекта
   * @param {string} projectPath - путь к проекту
   * @returns {Promise<{success: boolean, branches: string[], error?: string}>}
   */
  getBranches: (projectPath) => {
    return ipcRenderer.invoke('git:get-branches', projectPath);
  },

  /**
   * Проверяет статус всех main веток
   * @param {string} projectPath - путь к проекту
   * @returns {Promise<{success: boolean, statuses: Array<{branch: string, status: string, commitsCount?: number}>, error?: string}>}
   */
  checkAllMainBranches: (projectPath) => {
    return ipcRenderer.invoke('git:check-all-main-branches', projectPath);
  },

  /**
   * Переключает ветку
   * @param {string} projectPath - путь к проекту
   * @param {string} branch - название ветки
   * @returns {Promise<{success: boolean, message: string}>}
   */
  switchBranch: (projectPath, branch) => {
    return ipcRenderer.invoke('git:switch-branch', projectPath, branch);
  },

  /**
   * Открывает папку в Windows Explorer
   * @param {string} path - путь к папке
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  openFolder: (path) => {
    return ipcRenderer.invoke('open-folder', { path });
  },

  /**
   * Получает сохраненную конфигурацию
   * @returns {Promise<{rootPath?: string}>}
   */
  getConfig: () => {
    return ipcRenderer.invoke('get-config');
  },

  /**
   * Сохраняет конфигурацию
   * @param {Object} config - объект конфигурации
   * @returns {Promise<{success: boolean}>}
   */
  saveConfig: (config) => {
    return ipcRenderer.invoke('save-config', config);
  },

  /**
   * Открывает диалог выбора папки
   * @returns {Promise<{canceled: boolean, filePaths: string[]}>}
   */
  selectFolder: () => {
    return ipcRenderer.invoke('select-folder');
  },

  /**
   * Добавляет тег к проекту
   * @param {string} projectPath - путь к проекту
   * @param {string} tag - название тега
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  addTag: (projectPath, tag) => {
    return ipcRenderer.invoke('add-tag', { projectPath, tag });
  },

  /**
   * Удаляет тег у проекта
   * @param {string} projectPath - путь к проекту
   * @param {string} tag - название тега
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  removeTag: (projectPath, tag) => {
    return ipcRenderer.invoke('remove-tag', { projectPath, tag });
  },

  /**
   * Получает все доступные теги
   * @returns {Promise<{success: boolean, tags: string[], error?: string}>}
   */
  getAvailableTags: () => {
    return ipcRenderer.invoke('get-available-tags');
  },

  /**
   * Создает новый тег
   * @param {string} tag - название тега
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  createTag: (tag) => {
    return ipcRenderer.invoke('create-tag', { tag });
  },

  /**
   * Получает теги проекта
   * @param {string} projectPath - путь к проекту
   * @returns {Promise<{success: boolean, tags: string[], error?: string}>}
   */
  getProjectTags: (projectPath) => {
    return ipcRenderer.invoke('get-project-tags', { projectPath });
  },

  /**
   * Проверяет наличие обновлений
   * @returns {Promise<{success: boolean, updateInfo?: object, error?: string}>}
   */
  checkForUpdates: () => {
    return ipcRenderer.invoke('check-for-updates');
  },

  /**
   * Скачивает обновление
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  downloadUpdate: () => {
    return ipcRenderer.invoke('download-update');
  },

  /**
   * Устанавливает обновление и перезапускает приложение
   */
  installUpdate: () => {
    return ipcRenderer.invoke('install-update');
  },

  /**
   * Подписка на события обновлений
   */
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => callback(info));
  },

  onUpdateNotAvailable: (callback) => {
    ipcRenderer.on('update-not-available', (event, info) => callback(info));
  },

  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (event, error) => callback(error));
  },

  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, progress) => callback(progress));
  },

  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, info) => callback(info));
  },

  /**
   * Определяет доступные терминалы
   * @returns {Promise<{success: boolean, terminals: Array, error?: string}>}
   */
  detectTerminals: () => {
    return ipcRenderer.invoke('terminal:detect');
  },

  /**
   * Получает дефолтный терминал
   * @returns {Promise<{success: boolean, terminal: Object, error?: string}>}
   */
  getDefaultTerminal: () => {
    return ipcRenderer.invoke('terminal:get-default');
  },

  /**
   * Получает текущий терминал из конфига
   * @returns {Promise<{success: boolean, terminal: Object, error?: string}>}
   */
  getTerminal: () => {
    return ipcRenderer.invoke('terminal:get');
  },

  /**
   * Устанавливает терминал
   * @param {string} path - путь к терминалу
   * @param {string} name - название терминала
   * @param {string} type - тип терминала (bash, powershell, cmd)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  setTerminal: (path, name, type) => {
    return ipcRenderer.invoke('terminal:set', { path, name, type });
  },

  /**
   * Проверяет валидность терминала
   * @param {string} path - путь к терминалу
   * @returns {Promise<{success: boolean, isValid: boolean, error?: string}>}
   */
  validateTerminal: (path) => {
    return ipcRenderer.invoke('terminal:validate', { path });
  },

  /**
   * Определяет установленный менеджер Node.js версий
   * @returns {Promise<{success: boolean, manager: string, error?: string}>}
   */
  detectNodeManager: () => {
    return ipcRenderer.invoke('node:detect-manager');
  },

  /**
   * Получает настройку менеджера Node.js из конфига
   * @returns {Promise<{success: boolean, manager: string, error?: string}>}
   */
  getNodeManager: () => {
    return ipcRenderer.invoke('node:get-manager');
  },

  /**
   * Устанавливает менеджер Node.js
   * @param {string} manager - 'auto', 'nvm', 'volta', 'fnm'
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  setNodeManager: (manager) => {
    return ipcRenderer.invoke('node:set-manager', { manager });
  },

  /**
   * Получает версию Node.js для проекта
   * @param {string} projectPath - путь к проекту
   * @returns {Promise<{success: boolean, version: string, error?: string}>}
   */
  getNodeVersion: (projectPath) => {
    return ipcRenderer.invoke('node:get-version', { projectPath });
  },

  /**
   * Устанавливает версию Node.js для проекта вручную
   * @param {string} projectName - название проекта
   * @param {string} version - версия Node.js
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  setNodeVersion: (projectName, version) => {
    return ipcRenderer.invoke('node:set-version', { projectName, version });
  },

  /**
   * Проверяет установлена ли версия Node.js
   * @param {string} version - версия для проверки
   * @param {string} manager - менеджер версий
   * @returns {Promise<{success: boolean, isInstalled: boolean, error?: string}>}
   */
  checkNodeInstalled: (version, manager) => {
    return ipcRenderer.invoke('node:check-installed', { version, manager });
  },

  /**
   * Устанавливает версию Node.js через менеджер
   * @param {string} version - версия для установки
   * @param {string} manager - менеджер версий
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  installNodeVersion: (version, manager) => {
    return ipcRenderer.invoke('node:install', { version, manager });
  },

  /**
   * Получает алиасы проекта
   * @param {string} projectPath - путь к проекту
   * @returns {Promise<{success: boolean, aliases: Array, error?: string}>}
   */
  getProjectAliases: (projectPath) => {
    return ipcRenderer.invoke('get-project-aliases', { projectPath });
  },

  /**
   * Устанавливает алиасы проекта
   * @param {string} projectPath - путь к проекту
   * @param {Array} aliases - массив алиасов
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  setProjectAliases: (projectPath, aliases) => {
    return ipcRenderer.invoke('set-project-aliases', { projectPath, aliases });
  },

  /**
   * Получает заметки проекта
   * @param {string} projectPath - путь к проекту
   * @returns {Promise<{success: boolean, notes: string, error?: string}>}
   */
  getProjectNotes: (projectPath) => {
    return ipcRenderer.invoke('get-project-notes', { projectPath });
  },

  /**
   * Устанавливает заметки проекта
   * @param {string} projectPath - путь к проекту
   * @param {string} notes - заметки
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  setProjectNotes: (projectPath, notes) => {
    return ipcRenderer.invoke('set-project-notes', { projectPath, notes });
  },

  /**
   * Получает все метаданные проекта (tags, aliases, notes)
   * @param {string} projectPath - путь к проекту
   * @returns {Promise<{success: boolean, metadata: Object, error?: string}>}
   */
  getProjectMetadata: (projectPath) => {
    return ipcRenderer.invoke('get-project-metadata', { projectPath });
  },

  /**
   * Поиск проектов по запросу (с транслитерацией)
   * @param {string} query - поисковый запрос
   * @param {Array} projects - список проектов для поиска
   * @returns {Promise<{success: boolean, projects: Array, error?: string}>}
   */
  searchProjects: (query, projects) => {
    return ipcRenderer.invoke('search-projects', { query, projects });
  },

  /**
   * Фильтрация проектов по тегу
   * @param {string} tag - тег для фильтрации
   * @param {Array} projects - список проектов для фильтрации
   * @returns {Promise<{success: boolean, projects: Array, error?: string}>}
   */
  filterByTag: (tag, projects) => {
    return ipcRenderer.invoke('filter-by-tag', { tag, projects });
  },

  /**
   * Получает все теги из проектов
   * @param {Array} projects - список проектов
   * @returns {Promise<{success: boolean, tags: Array, error?: string}>}
   */
  getAllTags: (projects) => {
    return ipcRenderer.invoke('get-all-tags', { projects });
  },

  /**
   * Получает README проекта
   * @param {string} projectPath - путь к проекту
   * @returns {Promise<{success: boolean, content?: string, error?: string}>}
   */
  getReadme: (projectPath) => {
    return ipcRenderer.invoke('readme:get', projectPath);
  },

  /**
   * Получает последние коммиты проекта
   * @param {string} projectPath - путь к проекту
   * @param {number} limit - количество коммитов (по умолчанию 10)
   * @returns {Promise<{success: boolean, commits?: Array, error?: string}>}
   */
  getRecentCommits: (projectPath, limit = 10) => {
    return ipcRenderer.invoke('project:get-recent-commits', projectPath, limit);
  },

  /**
   * Получает информацию из package.json
   * @param {string} projectPath - путь к проекту
   * @returns {Promise<{success: boolean, packageInfo?: Object, error?: string}>}
   */
  getPackageInfo: (projectPath) => {
    return ipcRenderer.invoke('project:get-package-info', projectPath);
  },

  /**
   * Получает настройку проверки Git Remote Status
   * @returns {Promise<{success: boolean, enabled: boolean, error?: string}>}
   */
  getGitRemoteCheckEnabled: () => {
    return ipcRenderer.invoke('git:get-remote-check-enabled');
  },

  /**
   * Устанавливает настройку проверки Git Remote Status
   * @param {boolean} enabled - включить или выключить
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  setGitRemoteCheckEnabled: (enabled) => {
    return ipcRenderer.invoke('git:set-remote-check-enabled', { enabled });
  }
});

// ================== Auto-Updater API ==================

contextBridge.exposeInMainWorld('updater', {
  /**
   * Проверить наличие обновлений
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  check: () => {
    return ipcRenderer.invoke('updater:check');
  },

  /**
   * Начать загрузку обновления
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  download: () => {
    return ipcRenderer.invoke('updater:download');
  },

  /**
   * Установить обновление и перезапустить приложение
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  install: () => {
    return ipcRenderer.invoke('updater:install');
  },

  /**
   * Получить текущую версию приложения
   * @returns {Promise<{success: boolean, version?: string, error?: string}>}
   */
  getVersion: () => {
    return ipcRenderer.invoke('app:get-version');
  },

  /**
   * Подписаться на событие "Проверка обновлений"
   * @param {Function} callback
   */
  onChecking: (callback) => {
    ipcRenderer.on('updater:checking', () => callback());
  },

  /**
   * Подписаться на событие "Обновление доступно"
   * @param {Function} callback
   */
  onAvailable: (callback) => {
    ipcRenderer.on('updater:available', (event, data) => callback(data));
  },

  /**
   * Подписаться на событие "Обновление недоступно"
   * @param {Function} callback
   */
  onNotAvailable: (callback) => {
    ipcRenderer.on('updater:not-available', () => callback());
  },

  /**
   * Подписаться на событие "Прогресс загрузки"
   * @param {Function} callback
   */
  onProgress: (callback) => {
    ipcRenderer.on('updater:progress', (event, data) => callback(data));
  },

  /**
   * Подписаться на событие "Обновление загружено"
   * @param {Function} callback
   */
  onDownloaded: (callback) => {
    ipcRenderer.on('updater:downloaded', (event, data) => callback(data));
  },

  /**
   * Подписаться на событие "Ошибка обновления"
   * @param {Function} callback
   */
  onError: (callback) => {
    ipcRenderer.on('updater:error', (event, data) => callback(data));
  }
});

