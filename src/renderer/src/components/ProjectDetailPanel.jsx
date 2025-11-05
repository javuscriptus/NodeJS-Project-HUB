import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import GitStatusIcon from './GitStatusIcon';

export default function ProjectDetailPanel({ project, onClose }) {
  const [readme, setReadme] = useState(null);
  const [commits, setCommits] = useState([]);
  const [packageInfo, setPackageInfo] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('readme'); // readme, commits, info

  useEffect(() => {
    if (project) {
      loadProjectDetails();
    }
  }, [project]);

  const loadProjectDetails = async () => {
    setLoading(true);
    try {
      // Загружаем все данные параллельно
      const [readmeResult, commitsResult, packageResult, branchesResult] = await Promise.all([
        window.electronAPI.getReadme(project.path),
        window.electronAPI.getRecentCommits(project.path, 10),
        window.electronAPI.getPackageInfo(project.path),
        window.electronAPI.getBranches(project.path)
      ]);

      if (readmeResult.success) {
        setReadme(readmeResult.content);
      }

      if (commitsResult.success) {
        setCommits(commitsResult.commits);
      }

      if (packageResult.success) {
        setPackageInfo(packageResult.packageInfo);
      }

      if (branchesResult.success) {
        setBranches(branchesResult.branches);
      }
    } catch (error) {
      console.error('Error loading project details:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderReadme = () => {
    if (!readme) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">📄</p>
          <p>README.md не найден</p>
        </div>
      );
    }

    // Парсим markdown и санитизируем HTML
    const htmlContent = DOMPurify.sanitize(marked(readme));

    return (
      <div
        className="prose prose-invert prose-sm max-w-none p-4 overflow-y-auto"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  };

  const renderCommits = () => {
    if (commits.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">📝</p>
          <p>Нет коммитов</p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-3">
        {commits.map((commit, index) => (
          <div
            key={index}
            className="bg-gray-700/50 p-3 rounded border border-gray-600 hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start gap-2 mb-1">
              <span className="text-xs font-mono text-blue-400">{commit.hash}</span>
              <span className="text-xs text-gray-500">{commit.date}</span>
            </div>
            <p className="text-sm text-white mb-1">{commit.message}</p>
            <p className="text-xs text-gray-400">by {commit.author}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderProjectInfo = () => {
    if (!packageInfo) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">📦</p>
          <p>package.json не найден</p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4">
        {/* Basic Info */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
            Основная информация
          </h3>
          <InfoRow label="Название" value={packageInfo.name} />
          <InfoRow label="Версия" value={packageInfo.version} />
          <InfoRow label="Описание" value={packageInfo.description} />
          <InfoRow label="Автор" value={packageInfo.author} />
          <InfoRow label="Лицензия" value={packageInfo.license} />
        </div>

        {/* Dependencies */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
            Зависимости
          </h3>
          <InfoRow label="Dependencies" value={packageInfo.dependencies} />
          <InfoRow label="DevDependencies" value={packageInfo.devDependencies} />
        </div>

        {/* Git Branches */}
        {branches.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Git Ветки
            </h3>
            <div className="space-y-1">
              {branches.slice(0, 10).map((branch, index) => (
                <div
                  key={index}
                  className="text-sm text-gray-300 px-2 py-1 bg-gray-700/30 rounded"
                >
                  {branch}
                </div>
              ))}
              {branches.length > 10 && (
                <p className="text-xs text-gray-500 mt-2">
                  ...и еще {branches.length - 10} веток
                </p>
              )}
            </div>
          </div>
        )}

        {/* Git Remote Status */}
        {project.gitRemoteStatus && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">
              Git Remote Статус
            </h3>
            <div className="flex gap-2">
              <GitStatusIcon
                status={project.gitRemoteStatus.dev.status}
                commitsCount={project.gitRemoteStatus.dev.commitsCount}
                branch="dev"
                error={project.gitRemoteStatus.dev.error}
              />
              <GitStatusIcon
                status={project.gitRemoteStatus.main.status}
                commitsCount={project.gitRemoteStatus.main.commitsCount}
                branch="main"
                error={project.gitRemoteStatus.main.error}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!project) {
    return null;
  }

  return (
    <div className="fixed right-0 top-0 h-full w-[600px] bg-gray-800 border-l border-gray-700 shadow-2xl z-50 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gray-900">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white truncate">{project.name}</h2>
          <p className="text-sm text-gray-400 truncate">{project.path}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 p-2 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
          title="Закрыть"
        >
          <span className="text-2xl">✕</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 bg-gray-900">
        <button
          onClick={() => setActiveTab('readme')}
          className={`
            flex-1 px-4 py-3 text-sm font-medium transition-colors
            ${activeTab === 'readme'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }
          `}
        >
          📄 README
        </button>
        <button
          onClick={() => setActiveTab('commits')}
          className={`
            flex-1 px-4 py-3 text-sm font-medium transition-colors
            ${activeTab === 'commits'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }
          `}
        >
          📝 Коммиты
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`
            flex-1 px-4 py-3 text-sm font-medium transition-colors
            ${activeTab === 'info'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }
          `}
        >
          ℹ️ Инфо
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Загрузка...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'readme' && renderReadme()}
            {activeTab === 'commits' && renderCommits()}
            {activeTab === 'info' && renderProjectInfo()}
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;

  return (
    <div className="flex justify-between items-start text-sm">
      <span className="text-gray-400 font-medium">{label}:</span>
      <span className="text-white ml-2 text-right flex-1">{value}</span>
    </div>
  );
}

