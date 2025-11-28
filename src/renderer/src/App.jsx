import React, { useState, useEffect, useMemo } from 'react';
import ProjectTable from './components/ProjectTable';
import SearchBar from './components/SearchBar';
import SettingsModal from './components/SettingsModal';
import TagFilter from './components/TagFilter';
import ProjectDetailPanel from './components/ProjectDetailPanel';
import ProjectSettingsModal from './components/ProjectSettingsModal';
import UpdateNotification from './components/UpdateNotification';
import logger from './utils/logger';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rootPath, setRootPath] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [notification, setNotification] = useState(null);
  const [projectNotes, setProjectNotes] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);
  const [projectTags, setProjectTags] = useState({}); // { projectPath: [tags] }
  const [selectedProject, setSelectedProject] = useState(null); // Для detail panel
  const [selectedProjectForSettings, setSelectedProjectForSettings] = useState(null); // Для settings modal
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  // Загрузка конфига при монтировании
  useEffect(() => {
    loadConfig();
    setupUpdateListeners();
  }, []);

  const setupUpdateListeners = () => {
    window.electronAPI.onUpdateAvailable(info => {
      logger.info('Update available:', info);
      setUpdateInfo(info);
    });

    window.electronAPI.onDownloadProgress(progress => {
      logger.info('Download progress:', progress);
      setDownloadProgress(progress);
    });

    window.electronAPI.onUpdateDownloaded(info => {
      logger.info('Update downloaded:', info);
      setDownloadProgress(null);
      setUpdateDownloaded(true);
    });

    window.electronAPI.onUpdateError(error => {
      logger.error('Update error:', error);
      showNotification('Ошибка обновления: ' + error, 'error');
      setUpdateInfo(null);
      setDownloadProgress(null);
    });

    window.electronAPI.onUpdateNotAvailable(() => {
      logger.info('No updates available');
    });
  };

  const loadConfig = async () => {
    try {
      const config = await window.electronAPI.getConfig();
      if (config.rootPath) {
        setRootPath(config.rootPath);
      } else {
        // Если конфига нет, показываем настройки
        setShowSettings(true);
      }
      // Загружаем заметки
      if (config.projectNotes) {
        setProjectNotes(config.projectNotes);
      }
    } catch (error) {
      logger.error('Error loading config:', error);
    }
  };

  const handleUpdateNote = async (projectPath, note) => {
    const newNotes = { ...projectNotes, [projectPath]: note };
    setProjectNotes(newNotes);

    try {
      await window.electronAPI.saveConfig({
        rootPath,
        projectNotes: newNotes,
      });
    } catch (error) {
      logger.error('Error saving note:', error);
    }
  };

  const handleScan = async () => {
    if (!rootPath) {
      setError('Выберите корневую папку в настройках');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.scanProjects(rootPath);

      if (result.success) {
        setProjects(result.projects);
        if (result.projects.length === 0) {
          setError('Не найдено проектов в указанной папке');
        } else {
          // Запускаем загрузку тегов и git remote статусов в фоне
          loadProjectTags(result.projects);
          checkGitRemoteStatusForProjects(result.projects);
        }
      } else {
        setError(result.error || 'Ошибка сканирования');
      }
    } catch (error) {
      setError('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectTags = async projectsList => {
    const tagsMap = {};

    for (const project of projectsList) {
      try {
        const result = await window.electronAPI.getProjectTags(project.path);
        if (result.success) {
          tagsMap[project.path] = result.tags;
        }
      } catch (error) {
        logger.error('Error loading tags for', project.name, error);
      }
    }

    setProjectTags(tagsMap);
  };

  const checkGitRemoteStatusForProjects = async projectsList => {
    // Проверяем, включена ли проверка Git Remote Status
    try {
      const result = await window.electronAPI.getGitRemoteCheckEnabled();
      if (!result.success || !result.enabled) {
        logger.info('Git Remote Status check is disabled');
        return; // Не проверяем если выключено
      }
    } catch (error) {
      logger.error('Error checking git remote setting:', error);
      return;
    }

    // Проверяем remote статус для отслеживаемых веток каждого проекта
    const updatedProjects = [...projectsList];

    for (let i = 0; i < updatedProjects.length; i++) {
      const project = updatedProjects[i];
      try {
        // Получаем список отслеживаемых веток для этого проекта
        const branchesResult = await window.electronAPI.getTrackedBranches(project.path);
        const trackedBranches = branchesResult.success ? branchesResult.branches : ['dev', 'main'];

        // Проверяем все отслеживаемые ветки параллельно
        const statusChecks = trackedBranches.map(branch =>
          window.electronAPI.checkRemoteStatus(project.path, branch)
        );
        const statuses = await Promise.all(statusChecks);

        // Создаём объект со статусами { branch: status }
        const gitRemoteStatus = {};
        trackedBranches.forEach((branch, index) => {
          gitRemoteStatus[branch] = statuses[index];
        });

        updatedProjects[i] = {
          ...project,
          gitRemoteStatus,
        };

        // Обновляем state после каждой проверки для постепенного отображения
        setProjects([...updatedProjects]);
      } catch (error) {
        logger.error('Error checking git remote status for', project.name, error);
      }
    }
  };

  const handleRunScript = async (project, script) => {
    try {
      const result = await window.electronAPI.runNpmScript(
        project.path,
        script,
        project.packageManager || 'npm'
      );
      if (!result.success) {
        showNotification(`Ошибка запуска: ${result.error}`, 'error');
      }
    } catch (error) {
      showNotification(`Ошибка: ${error.message}`, 'error');
    }
  };

  const handleGitPull = async project => {
    try {
      const result = await window.electronAPI.gitPull(project.path);

      if (result.success) {
        showNotification(`✓ ${project.name} обновлен`, 'success');
        // Перезагрузить проекты для обновления данных
        setTimeout(handleScan, 1000);
      } else {
        showNotification(`Ошибка git pull: ${result.message}`, 'error');
      }
    } catch (error) {
      showNotification(`Ошибка: ${error.message}`, 'error');
    }
  };

  const handleOpenFolder = async project => {
    try {
      await window.electronAPI.openFolder(project.path);
    } catch (error) {
      showNotification(`Ошибка открытия папки: ${error.message}`, 'error');
    }
  };

  const handleSaveSettings = async newRootPath => {
    try {
      const result = await window.electronAPI.saveConfig({ rootPath: newRootPath });

      if (result.success) {
        setRootPath(newRootPath);
        setShowSettings(false);
        showNotification('Настройки сохранены', 'success');
      } else {
        showNotification('Ошибка сохранения настроек', 'error');
      }
    } catch (error) {
      showNotification('Ошибка: ' + error.message, 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCheckForUpdates = async () => {
    try {
      showNotification('Проверка обновлений...', 'info');
      await window.updater.check();
    } catch (error) {
      showNotification('Ошибка проверки обновлений: ' + error.message, 'error');
    }
  };

  // Фильтрация проектов с использованием умного поиска (транслитерация, теги, алиасы)
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Фильтрация по тегам (клиентская сторона)
    if (selectedTags.length > 0) {
      filtered = filtered.filter(project => {
        const tags = projectTags[project.path] || [];
        return selectedTags.some(tag => tags.includes(tag));
      });
    }

    // Фильтрация по поисковому запросу (используем SearchEngine с backend)
    // Этот запрос будет обрабатываться асинхронно через useEffect

    return filtered;
  }, [projects, selectedTags, projectTags]);

  // Асинхронная фильтрация через SearchEngine
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults(filteredProjects);
        return;
      }

      setIsSearching(true);
      try {
        const result = await window.electronAPI.searchProjects(searchQuery, filteredProjects);
        setSearchResults(result.success ? result.projects : filteredProjects);
      } catch (error) {
        logger.error('Search error:', error);
        setSearchResults(filteredProjects);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [searchQuery, filteredProjects]);

  // Финальный список для отображения
  const displayProjects = searchQuery.trim() ? searchResults : filteredProjects;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              nodejs project hub
            </span>
          </h1>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              {rootPath && (
                <span className="flex items-center gap-2">
                  📁 <span className="font-mono text-xs">{rootPath}</span>
                </span>
              )}
            </div>
            <button
              onClick={handleCheckForUpdates}
              className="p-2 hover:bg-gray-700 rounded transition-all duration-200 transform hover:scale-110"
              title="Проверить обновления"
            >
              🔄
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-700 rounded transition-all duration-200 transform hover:scale-110"
              title="Настройки"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4">
            <button
              onClick={handleScan}
              disabled={loading || !rootPath}
              className={`
                px-6 py-2 rounded-lg font-medium
                ${
                  loading || !rootPath
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg'
                }
                transition-all duration-200 transform hover:scale-105
              `}
            >
              {loading ? '⏳ Сканирование...' : '🔍 Сканировать'}
            </button>

            <div className="flex-1">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
          </div>

          {/* Tag Filter */}
          <TagFilter onFilterChange={setSelectedTags} projects={projects} />
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg animate-fade-in">
            <p className="text-red-400 text-sm">⚠️ {error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-6xl mb-4 animate-bounce">📂</div>
            <h2 className="text-xl font-semibold text-gray-300 mb-2">
              Нет проектов для отображения
            </h2>
            <p className="text-gray-500 mb-6">
              {rootPath
                ? 'Нажмите "Сканировать" чтобы найти проекты'
                : 'Выберите корневую папку в настройках'}
            </p>
            {!rootPath && (
              <button
                onClick={() => setShowSettings(true)}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105"
              >
                Выбрать папку
              </button>
            )}
          </div>
        )}

        {/* No Search Results */}
        {!loading && projects.length > 0 && displayProjects.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-gray-300 mb-2">Ничего не найдено</h2>
            <p className="text-gray-500 mb-2">
              {searchQuery && `По запросу "${searchQuery}" ничего не найдено.`}
              {selectedTags.length > 0 && ` С тегами: ${selectedTags.join(', ')}`}
            </p>
            <p className="text-xs text-gray-600">
              Попробуйте изменить поисковый запрос или сбросить фильтры
            </p>
          </div>
        )}

        {/* Projects Table */}
        {!loading && displayProjects.length > 0 && (
          <>
            {isSearching && (
              <div className="mb-2 text-sm text-blue-400 flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Поиск...
              </div>
            )}
            <ProjectTable
              projects={displayProjects}
              onRunScript={handleRunScript}
              onGitPull={handleGitPull}
              onOpenFolder={handleOpenFolder}
              projectNotes={projectNotes}
              onUpdateNote={handleUpdateNote}
              onTagsChange={() => loadProjectTags(projects)}
              onMetadataUpdate={() => {
                // Перезагружаем проекты после обновления метаданных
                handleScan();
              }}
              onViewDetails={project => setSelectedProject(project)}
              onOpenSettings={project => setSelectedProjectForSettings(project)}
            />

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <div>
                Найдено: {displayProjects.length}{' '}
                {displayProjects.length === 1 ? 'проект' : 'проектов'}
                {(searchQuery || selectedTags.length > 0) &&
                  projects.length !== displayProjects.length &&
                  ` (из ${projects.length})`}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>v2.0.0</span>
                <span>•</span>
                <span>nodejs project hub</span>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        currentPath={rootPath}
      />

      {/* Notification */}
      {notification && (
        <div
          className={`
            fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg
            ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}
            text-white font-medium
            animate-fade-in
          `}
        >
          {notification.message}
        </div>
      )}

      {/* Project Detail Panel */}
      {selectedProject && (
        <ProjectDetailPanel project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}

      {/* Project Settings Modal */}
      {selectedProjectForSettings && (
        <ProjectSettingsModal
          project={selectedProjectForSettings}
          isOpen={!!selectedProjectForSettings}
          onClose={() => setSelectedProjectForSettings(null)}
          onSave={() => {
            setSelectedProjectForSettings(null);
            handleScan(); // Перезагружаем проекты
          }}
        />
      )}

      {/* Update Notification */}
      <UpdateNotification />
    </div>
  );
}
