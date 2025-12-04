const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const log = require('electron-log');

const { AutoUpdater } = require('./autoUpdater');
const { registerAllHandlers, getCacheStats } = require('./ipcHandlers');
const { ErrorHandler } = require('./utils/errorHandler');

// Настройка логирования
log.transports.file.resolvePathFn = () => {
  return path.join(app.getPath('appData'), 'BettingsProjectHub', 'logs', 'main.log');
};
log.transports.file.level = 'info';

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
 * IPC Handlers - Регистрируем все обработчики через централизованную систему
 */

// Регистрируем все IPC handlers из ipcHandlers.js
registerAllHandlers();

// Диалог выбора папки (специальный handler - не переносим в ipcHandlers)
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

// === Автообновления (специальные handlers с использованием updater instance) ===
ipcMain.handle('check-for-updates', async () => {
  try {
    log.info('Manual update check requested');
    if (!updater) {
      return { success: false, error: 'Updater not initialized' };
    }
    const result = await updater.checkForUpdates();
    return { success: true, updateInfo: result?.updateInfo };
  } catch (error) {
    ErrorHandler.warn('Check for updates error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    log.info('Download update requested');
    if (!updater) {
      return { success: false, error: 'Updater not initialized' };
    }
    await updater.downloadUpdate();
    return { success: true };
  } catch (error) {
    ErrorHandler.warn('Download update error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('install-update', () => {
  try {
    log.info('Install update requested');
    if (updater) {
      updater.quitAndInstall(false, true);
      return { success: true };
    }
    return { success: false, error: 'Updater not initialized' };
  } catch (error) {
    ErrorHandler.warn('Install update error:', error);
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
