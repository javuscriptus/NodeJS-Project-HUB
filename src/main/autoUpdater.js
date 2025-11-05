const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

class AutoUpdater {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.updateCheckInterval = null;
    this.isChecking = false;
    
    // Настройка логирования
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    
    // Отключаем автоматическую загрузку
    autoUpdater.autoDownload = false;
    
    this.setupEventHandlers();
  }

  /**
   * Настройка обработчиков событий autoUpdater
   */
  setupEventHandlers() {
    // Проверка обновлений началась
    autoUpdater.on('checking-for-update', () => {
      this.isChecking = true;
      log.info('Checking for updates...');
      this.sendToRenderer('updater:checking');
    });

    // Обновление доступно
    autoUpdater.on('update-available', (info) => {
      this.isChecking = false;
      log.info('Update available:', info.version);
      this.sendToRenderer('updater:available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes
      });
    });

    // Обновление не найдено
    autoUpdater.on('update-not-available', (info) => {
      this.isChecking = false;
      log.info('Update not available. Current version:', info.version);
      this.sendToRenderer('updater:not-available');
    });

    // Прогресс загрузки
    autoUpdater.on('download-progress', (progressObj) => {
      const percent = Math.round(progressObj.percent);
      log.info(`Download progress: ${percent}%`);
      this.sendToRenderer('updater:progress', {
        percent,
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total
      });
    });

    // Обновление загружено
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info.version);
      this.sendToRenderer('updater:downloaded', {
        version: info.version
      });
    });

    // Ошибка
    autoUpdater.on('error', (error) => {
      this.isChecking = false;
      log.error('Update error:', error);
      this.sendToRenderer('updater:error', {
        message: error.message
      });
    });
  }

  /**
   * Отправляет сообщение в renderer process
   */
  sendToRenderer(channel, data = {}) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  /**
   * Проверяет обновления вручную
   */
  async checkForUpdates() {
    if (this.isChecking) {
      log.info('Update check already in progress');
      return;
    }

    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      log.error('Failed to check for updates:', error);
      this.sendToRenderer('updater:error', {
        message: 'Не удалось проверить обновления'
      });
    }
  }

  /**
   * Загружает доступное обновление
   */
  async downloadUpdate() {
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      log.error('Failed to download update:', error);
      this.sendToRenderer('updater:error', {
        message: 'Не удалось загрузить обновление'
      });
    }
  }

  /**
   * Устанавливает обновление и перезапускает приложение
   */
  quitAndInstall() {
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * Запускает автоматическую проверку обновлений при старте
   */
  async startAutoCheck() {
    // Проверяем сразу при запуске (через 10 секунд после старта)
    setTimeout(() => {
      this.checkForUpdates();
    }, 10000);

    // Затем проверяем каждые 4 часа
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, 4 * 60 * 60 * 1000);
  }

  /**
   * Останавливает автоматическую проверку
   */
  stopAutoCheck() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }
}

module.exports = { AutoUpdater };

