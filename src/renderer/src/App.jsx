import { useState, useEffect, useMemo, useCallback } from 'react';
import ProjectTable from './components/ProjectTable';
import SearchBar from './components/SearchBar';
import SettingsModal from './components/SettingsModal';
import TagFilter from './components/TagFilter';
import ProjectDetailPanel from './components/ProjectDetailPanel';
import ProjectSettingsModal from './components/ProjectSettingsModal';
import UpdateNotification from './components/UpdateNotification';
import SkeletonLoader from './components/SkeletonLoader';
import ThemeToggle from './components/ThemeToggle';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import { useToast } from './components/Toast';
import { useDebounce } from './hooks/useDebounce';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import logger from './utils/logger';
import { TIMEOUTS } from './constants';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rootPath, setRootPath] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [projectNotes, setProjectNotes] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);
  const [projectTags, setProjectTags] = useState({}); // { projectPath: [tags] }
  const [selectedProject, setSelectedProject] = useState(null); // Для detail panel
  const [selectedProjectForSettings, setSelectedProjectForSettings] = useState(null); // Для settings modal
  
  // Update state
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  
  // Используем новый Toast система
  const toast = useToast();
  
  // Debounced search query для оптимизации
  const debouncedSearchQuery = useDebounce(searchQuery, TIMEOUTS.DEBOUNCE_SEARCH);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+f': () => {
      const searchInput = document.querySelector('input[type="text"]');
      if (searchInput) searchInput.focus();
    },
    'ctrl+r': () => handleScan(),
    'ctrl+,': () => setShowSettings(true),
    'escape': () => {
      setShowSettings(false);
      setSelectedProject(null);
      setSelectedProjectForSettings(null);
    },
  });

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
      toast.error('Ошибка обновления: ' + error);
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

  const handleScan = useCallback(async () => {
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
  }, [rootPath]);

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

  const handleRunScript = useCallback(async (project, script) => {
    try {
      const result = await window.electronAPI.runNpmScript(
        project.path,
        script,
        project.packageManager || 'npm'
      );
      if (!result.success) {
        toast.error(`Ошибка запуска: ${result.error}`);
      }
    } catch (error) {
      toast.error(`Ошибка: ${error.message}`);
    }
  }, [toast]);

  const handleGitPull = useCallback(async (project) => {
    try {
      const result = await window.electronAPI.gitPull(project.path);

      if (result.success) {
        toast.success(`✓ ${project.name} обновлен`);
        // Перезагрузить проекты для обновления данных
        setTimeout(handleScan, 1000);
      } else {
        toast.error(`Ошибка git pull: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Ошибка: ${error.message}`);
    }
  }, [toast, handleScan]);

  const handleOpenFolder = useCallback(async (project) => {
    try {
      await window.electronAPI.openFolder(project.path);
    } catch (error) {
      toast.error(`Ошибка открытия папки: ${error.message}`);
    }
  }, [toast]);

  const handleSaveSettings = useCallback(async (newRootPath) => {
    try {
      const result = await window.electronAPI.saveConfig({ rootPath: newRootPath });

      if (result.success) {
        setRootPath(newRootPath);
        setShowSettings(false);
        toast.success('Настройки сохранены');
      } else {
        toast.error('Ошибка сохранения настроек');
      }
    } catch (error) {
      toast.error('Ошибка: ' + error.message);
    }
  }, [toast]);

  const handleCheckForUpdates = useCallback(async () => {
    try {
      toast.info('Проверка обновлений...');
      await window.updater.check();
    } catch (error) {
      toast.error('Ошибка проверки обновлений: ' + error.message);
    }
  }, [toast]);

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
      if (!debouncedSearchQuery) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        // Используем SearchEngine с backend для продвинутого поиска
        const result = await window.electronAPI.searchProjects(
          debouncedSearchQuery,
          filteredProjects
        );

        if (result.success) {
          setSearchResults(result.projects);
        }
      } catch (error) {
        logger.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery, filteredProjects]);

  // Получаем финальный список для отображения
  const displayProjects = useMemo(() => {
    return debouncedSearchQuery ? searchResults : filteredProjects;
  }, [debouncedSearchQuery, searchResults, filteredProjects]);

  // Обработчик тегов
  const handleTagsChange = async newTags => {
    setSelectedTags(newTags);
  };

  const handleShowProjectSettings = project => {
    setSelectedProjectForSettings(project);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <toast.ToastContainer />
      
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                nodejs project hub
              </h1>
              <ThemeToggle />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCheckForUpdates}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                🔄 Проверить обновления
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                ⚙️ Настройки
              </button>
              <button
                onClick={handleScan}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                {loading ? '⏳ Сканирование...' : '🔍 Сканировать'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <TagFilter
            projects={projects}
            projectTags={projectTags}
            selectedTags={selectedTags}
            onTagsChange={handleTagsChange}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Projects Table or Skeleton */}
        {loading ? (
          <SkeletonLoader type="table" count={8} />
        ) : (
          <ProjectTable
            projects={displayProjects}
            onRunScript={handleRunScript}
            onGitPull={handleGitPull}
            onOpenFolder={handleOpenFolder}
            onShowDetail={setSelectedProject}
            onShowSettings={handleShowProjectSettings}
            projectNotes={projectNotes}
            onUpdateNote={handleUpdateNote}
            projectTags={projectTags}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
        currentPath={rootPath}
      />

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

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp />
    </div>
  );
}
