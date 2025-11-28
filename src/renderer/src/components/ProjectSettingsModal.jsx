import React, { useState, useEffect } from 'react';
import TagInput from './TagInput';
import logger from '../utils/logger';

export default function ProjectSettingsModal({ project, isOpen, onClose, onSave }) {
  const [tags, setTags] = useState([]);
  const [aliases, setAliases] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [trackedBranches, setTrackedBranches] = useState([]);

  useEffect(() => {
    if (isOpen && project) {
      loadProjectMetadata();
    }
  }, [isOpen, project]);

  const loadProjectMetadata = async () => {
    if (!project) return;
    
    setIsLoading(true);
    try {
      const [metadataResult, branchesResult, trackedResult] = await Promise.all([
        window.electronAPI.getProjectMetadata(project.path),
        window.electronAPI.getBranches(project.path),
        window.electronAPI.getTrackedBranches(project.path)
      ]);

      if (metadataResult.success) {
        setTags(metadataResult.metadata.tags || []);
        setAliases((metadataResult.metadata.aliases || []).join(', '));
        setNotes(metadataResult.metadata.notes || '');
      }

      if (branchesResult.success) {
        setAvailableBranches(branchesResult.branches || []);
      }

      if (trackedResult.success) {
        setTrackedBranches(trackedResult.branches || ['dev', 'main']);
      }
    } catch (error) {
      logger.error('Failed to load project metadata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project) return;

    setIsLoading(true);
    try {
      // Парсим алиасы (разделяем по запятым)
      const aliasesArray = aliases
        .split(',')
        .map(alias => alias.trim())
        .filter(alias => alias.length > 0);

      // Сохраняем все метаданные
      await Promise.all([
        window.electronAPI.setProjectAliases(project.path, aliasesArray),
        window.electronAPI.setProjectNotes(project.path, notes),
        window.electronAPI.setTrackedBranches(project.path, trackedBranches)
      ]);

      // Теги уже сохранены через TagInput (если нужно отдельное сохранение)
      // Можно добавить API для setTags если нужно

      onSave();
      onClose();
    } catch (error) {
      logger.error('Failed to save project metadata:', error);
      alert('Ошибка при сохранении: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagsChange = (newTags) => {
    setTags(newTags);
  };

  const handleBranchToggle = (branch) => {
    if (trackedBranches.includes(branch)) {
      setTrackedBranches(trackedBranches.filter(b => b !== branch));
    } else {
      setTrackedBranches([...trackedBranches, branch]);
    }
  };

  logger.debug('ProjectSettingsModal render:', { isOpen, project });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            Настройки проекта
          </h2>
          {project && (
            <p className="text-sm text-gray-400 mt-1">{project.name}</p>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-2">Загрузка...</p>
            </div>
          ) : (
            <>
              {/* Теги */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Теги
                </label>
                <TagInput tags={tags} onTagsChange={handleTagsChange} />
                <p className="text-xs text-gray-500 mt-1">
                  Нажмите Enter чтобы добавить тег
                </p>
              </div>

              {/* Алиасы */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Алиасы (синонимы для поиска)
                </label>
                <input
                  type="text"
                  value={aliases}
                  onChange={(e) => setAliases(e.target.value)}
                  placeholder="Например: старое-название, проект-2023"
                  className="
                    w-full px-3 py-2
                    bg-gray-700 border border-gray-600 rounded
                    text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    placeholder-gray-500
                  "
                />
                <p className="text-xs text-gray-500 mt-1">
                  Разделяйте запятыми. Используется для поиска проекта по старым названиям.
                </p>
              </div>

              {/* Заметки */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Заметки
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Краткое описание проекта, стек технологий и т.д."
                  rows={4}
                  className="
                    w-full px-3 py-2
                    bg-gray-700 border border-gray-600 rounded
                    text-white text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    placeholder-gray-500
                    resize-none
                  "
                />
                <p className="text-xs text-gray-500 mt-1">
                  Заметки также учитываются при поиске
                </p>
              </div>

              {/* Отслеживаемые ветки для Git Remote Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  🌿 Отслеживаемые ветки
                </label>
                {availableBranches.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto bg-gray-700 p-3 rounded border border-gray-600">
                    {availableBranches.map(branch => (
                      <label key={branch} className="flex items-center gap-2 cursor-pointer hover:bg-gray-600 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={trackedBranches.includes(branch)}
                          onChange={() => handleBranchToggle(branch)}
                          className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-white">{branch}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Нет доступных веток</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Выберите ветки для проверки remote status (требуется интернет и VPN для GitLab)
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="
              px-4 py-2 rounded
              bg-gray-700 text-white
              hover:bg-gray-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="
              px-4 py-2 rounded
              bg-blue-600 text-white
              hover:bg-blue-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

