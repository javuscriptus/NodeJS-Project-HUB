import React, { useState } from 'react';
import GitStatusIcon from './GitStatusIcon';
import logger from '../utils/logger';
import { SCRIPT_ICONS, PACKAGE_MANAGER_ICONS } from '../constants';

export default function ProjectRow({ project, onRunScript, onGitPull, onOpenFolder, note, onUpdateNote, onTagsChange, onMetadataUpdate, onViewDetails, onOpenSettings }) {
  const [loading, setLoading] = useState({
    script: null,
    pull: false
  });
  const [nodeVersion, setNodeVersion] = useState(null);

  // Загрузка Node.js версии для проекта
  React.useEffect(() => {
    const loadNodeVersion = async () => {
      try {
        const result = await window.electronAPI.getNodeVersion(project.path);
        if (result.success && result.version) {
          setNodeVersion(result.version);
        }
      } catch (error) {
        logger.error('Error loading Node version:', error);
      }
    };

    loadNodeVersion();
  }, [project.path]);

  const handleRunScript = async (script) => {
    setLoading({ ...loading, script });
    try {
      await onRunScript(project, script);
    } finally {
      setTimeout(() => setLoading({ ...loading, script: null }), 500);
    }
  };

  const handlePull = async () => {
    setLoading({ ...loading, pull: true });
    try {
      await onGitPull(project);
    } finally {
      setLoading({ ...loading, pull: false });
    }
  };

  const getGitStatusBadge = () => {
    if (!project.gitStatus) return null;
    
    const { hasChanges, changesCount, staged, unstaged, untracked } = project.gitStatus;
    
    if (!hasChanges) {
      return (
        <span 
          className="px-2 py-1 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 text-green-400 rounded text-xs font-mono"
          title="Нет изменений"
        >
          ✅ Clean
        </span>
      );
    }
    
    const tooltipText = `${staged} staged, ${unstaged} unstaged, ${untracked} untracked`;
    
    return (
      <span 
        className="px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 rounded text-xs font-mono"
        title={tooltipText}
      >
        🟡 {changesCount} changes
      </span>
    );
  };


  const renderScriptButton = (scriptName) => {
    if (!project.scripts[scriptName]) return null;

    const isLoading = loading.script === scriptName;
    const icon = SCRIPT_ICONS[scriptName];

    return (
      <button
        onClick={() => handleRunScript(scriptName)}
        disabled={isLoading}
        title={scriptName}
        className={`
          w-10 h-10 rounded-lg flex items-center justify-center text-xl
          ${isLoading 
            ? 'bg-gray-700 cursor-wait' 
            : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg'
          }
          transition-all duration-200 transform hover:scale-110
        `}
      >
        {isLoading ? '⏳' : icon}
      </button>
    );
  };

  return (
    <tr className="border-b border-gray-700 hover:bg-gray-800/50 transition-all duration-200 animate-fade-in">
      <td className="px-4 py-4">
        <div className="space-y-2">
          <div className="text-base font-semibold text-white">
            {project.name}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 text-purple-400 rounded text-xs font-mono">
              {project.branch}
            </span>
            <span 
              className="px-2 py-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 text-blue-400 rounded text-xs font-mono"
              title={`Package Manager: ${project.packageManager || 'npm'}`}
            >
              {PACKAGE_MANAGER_ICONS[project.packageManager || 'npm']} {project.packageManager || 'npm'}
            </span>
            {nodeVersion && (
              <span 
                className="px-2 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 rounded text-xs font-mono"
                title={`Node.js version: ${nodeVersion}`}
              >
                ⬢ Node {nodeVersion}
              </span>
            )}
            {getGitStatusBadge()}
            {/* Git Remote Status */}
            {project.gitRemoteStatus && (
              <div className="flex items-center gap-2">
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
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* NPM Scripts */}
          {renderScriptButton('browser:dev')}
          {renderScriptButton('mobile:dev')}
          {renderScriptButton('browser:build')}
          {renderScriptButton('mobile:build')}
          
          {/* Git Pull */}
          <button
            onClick={handlePull}
            disabled={loading.pull}
            title="Git Pull"
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center text-xl
              ${loading.pull 
                ? 'bg-gray-700 cursor-wait' 
                : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg'
              }
              transition-all duration-200 transform hover:scale-110
            `}
          >
            {loading.pull ? '⏳' : '🔄'}
          </button>
          
          {/* Open Folder */}
          <button
            onClick={() => onOpenFolder(project)}
            title="Открыть в Explorer"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 shadow-lg transition-all duration-200 transform hover:scale-110"
          >
            📁
          </button>

          {/* Project Settings */}
          <button
            onClick={() => {
              logger.info('Opening settings for project:', project.name);
              if (onOpenSettings) {
                onOpenSettings(project);
              }
            }}
            title="Настройки проекта (теги, алиасы, заметки)"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg transition-all duration-200 transform hover:scale-110"
          >
            ⚙️
          </button>

          {/* View Details */}
          <button
            onClick={() => onViewDetails && onViewDetails(project)}
            title="Подробная информация (README, коммиты)"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg transition-all duration-200 transform hover:scale-110"
          >
            📋
          </button>
        </div>
      </td>
    </tr>
  );
}

