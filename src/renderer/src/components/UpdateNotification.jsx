import { useState, useEffect } from 'react';
import logger from '../utils/logger';

/**
 * Компонент уведомления об обновлении приложения
 */
function UpdateNotification() {
  const [updateState, setUpdateState] = useState('idle'); // idle, checking, available, downloading, downloaded, error
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [skippedVersion, setSkippedVersion] = useState(null);

  useEffect(() => {
    // Загружаем пропущенную версию из localStorage
    const skipped = localStorage.getItem('skipped-update-version');
    if (skipped) {
      setSkippedVersion(skipped);
    }

    // Подписываемся на события обновлений
    window.updater.onChecking(() => {
      setUpdateState('checking');
      setIsVisible(true);
    });

    window.updater.onAvailable((data) => {
      // Если пользователь пропустил эту версию, не показываем уведомление
      if (data.version === skippedVersion) {
        setIsVisible(false);
        return;
      }

      setUpdateState('available');
      setUpdateInfo(data);
      setIsVisible(true);
    });

    window.updater.onNotAvailable(() => {
      setUpdateState('idle');
      // Скрываем через 2 секунды если проверка была вручную
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    });

    window.updater.onProgress((data) => {
      setUpdateState('downloading');
      setDownloadProgress(data.percent);
      setIsVisible(true);
    });

    window.updater.onDownloaded((data) => {
      setUpdateState('downloaded');
      setUpdateInfo(data);
      setIsVisible(true);
    });

    window.updater.onError((data) => {
      setUpdateState('error');
      setError(data.message);
      setIsVisible(true);
    });
  }, [skippedVersion]);

  const handleDownloadAndInstall = async () => {
    try {
      await window.updater.download();
    } catch (error) {
      logger.error('Failed to download update:', error);
      setError(error.message);
      setUpdateState('error');
    }
  };

  const handleInstall = async () => {
    try {
      await window.updater.install();
    } catch (error) {
      logger.error('Failed to install update:', error);
      setError(error.message);
      setUpdateState('error');
    }
  };

  const handleRemindLater = () => {
    setIsVisible(false);
  };

  const handleSkipVersion = () => {
    if (updateInfo && updateInfo.version) {
      localStorage.setItem('skipped-update-version', updateInfo.version);
      setSkippedVersion(updateInfo.version);
    }
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  // Проверка обновлений
  if (updateState === 'checking') {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-md z-50 border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <span>Проверка обновлений...</span>
        </div>
      </div>
    );
  }

  // Обновление доступно
  if (updateState === 'available') {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-md z-50 border border-gray-700">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="font-semibold">Доступно обновление</div>
              <div className="text-sm text-gray-400">Версия {updateInfo?.version}</div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {updateInfo?.releaseNotes && (
          <div className="mb-3 text-sm text-gray-300 max-h-24 overflow-y-auto">
            {updateInfo.releaseNotes}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={handleDownloadAndInstall}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Скачать и установить
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleRemindLater}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm transition-colors"
            >
              Напомнить позже
            </button>
            <button
              onClick={handleSkipVersion}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm transition-colors"
            >
              Пропустить версию
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Загрузка обновления
  if (updateState === 'downloading') {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-md z-50 border border-gray-700">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⬇️</span>
            <div>
              <div className="font-semibold">Загрузка обновления</div>
              <div className="text-sm text-gray-400">{downloadProgress}%</div>
            </div>
          </div>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${downloadProgress}%` }}
          ></div>
        </div>
      </div>
    );
  }

  // Обновление загружено
  if (updateState === 'downloaded') {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-md z-50 border border-gray-700">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-semibold">Готово к установке</div>
              <div className="text-sm text-gray-400">Версия {updateInfo?.version}</div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="text-sm text-gray-300 mb-3">
          Обновление загружено. Перезапустите приложение для установки.
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Перезапустить сейчас
          </button>
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            Позже
          </button>
        </div>
      </div>
    );
  }

  // Ошибка
  if (updateState === 'error') {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-md z-50 border border-red-700">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <div className="font-semibold">Ошибка обновления</div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="text-sm text-gray-300 mb-3">{error}</div>

        <button
          onClick={handleClose}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
        >
          Закрыть
        </button>
      </div>
    );
  }

  return null;
}

export default UpdateNotification;

