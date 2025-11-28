import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';

export default function TagFilter({ onFilterChange, projects }) {
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadAllTags();
  }, [projects]);

  const loadAllTags = async () => {
    try {
      // Собираем все теги из проектов через API
      const result = await window.electronAPI.getAllTags(projects);
      if (result.success) {
        setAllTags(result.tags);
      }
    } catch (error) {
      logger.error('Failed to load tags:', error);
    }
  };

  const toggleTag = (tag) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newSelectedTags);
    onFilterChange(newSelectedTags);
  };

  const clearAllTags = () => {
    setSelectedTags([]);
    onFilterChange([]);
  };

  if (allTags.length === 0) {
    return null; // Не показываем фильтр если нет тегов
  }

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          px-4 py-2 rounded-lg
          bg-gradient-to-r from-purple-500 to-purple-600
          hover:from-purple-600 hover:to-purple-700
          text-white font-medium
          shadow-lg transition-all duration-200
          flex items-center gap-2
        "
      >
        <span>🏷️</span>
        <span>Теги</span>
        {selectedTags.length > 0 && (
          <span className="
            px-2 py-0.5 rounded-full
            bg-white/20 text-xs font-bold
          ">
            {selectedTags.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="
          absolute top-full left-0 mt-2
          bg-gray-800 border border-gray-700 rounded-lg shadow-xl
          w-64 max-h-96 overflow-y-auto
          z-50
          animate-fade-in
        ">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
            <span className="text-sm font-medium text-white">
              Фильтр по тегам
            </span>
            {selectedTags.length > 0 && (
              <button
                onClick={clearAllTags}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Сбросить
              </button>
            )}
          </div>

          {/* Tags List */}
          <div className="p-2 space-y-1">
            {allTags.map(tag => {
        const isSelected = selectedTags.includes(tag);
        return (
          <button
            key={tag}
                  onClick={() => toggleTag(tag)}
            className={`
                    w-full px-3 py-2 rounded text-left text-sm
                    transition-all duration-200
                    flex items-center gap-2
              ${isSelected 
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
              }
            `}
          >
                  <span className="text-base">
                    {isSelected ? '✅' : '⬜'}
                  </span>
                  <span>{tag}</span>
          </button>
        );
      })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
            {allTags.length} {allTags.length === 1 ? 'тег' : 'тегов'} всего
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
