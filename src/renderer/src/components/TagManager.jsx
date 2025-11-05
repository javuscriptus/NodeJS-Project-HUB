import React, { useState, useEffect } from 'react';

const TAG_COLORS = [
  'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
  'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
  'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
  'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400',
  'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
  'from-pink-500/20 to-pink-600/20 border-pink-500/30 text-pink-400',
  'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30 text-indigo-400',
  'from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-400'
];

export default function TagManager({ project, onTagsChange }) {
  const [projectTags, setProjectTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);

  useEffect(() => {
    loadTags();
  }, [project]);

  const loadTags = async () => {
    try {
      const [projectTagsResult, availableTagsResult] = await Promise.all([
        window.electronAPI.getProjectTags(project.path),
        window.electronAPI.getAvailableTags()
      ]);

      if (projectTagsResult.success) {
        setProjectTags(projectTagsResult.tags);
      }

      if (availableTagsResult.success) {
        setAvailableTags(availableTagsResult.tags);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleAddTag = async (tag) => {
    try {
      const result = await window.electronAPI.addTag(project.path, tag);
      if (result.success) {
        await loadTags();
        setShowDropdown(false);
        if (onTagsChange) onTagsChange();
      }
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };

  const handleRemoveTag = async (tag) => {
    try {
      const result = await window.electronAPI.removeTag(project.path, tag);
      if (result.success) {
        await loadTags();
        if (onTagsChange) onTagsChange();
      }
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const handleCreateNewTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const result = await window.electronAPI.createTag(newTagName.trim());
      if (result.success) {
        await handleAddTag(newTagName.trim());
        setNewTagName('');
        setShowNewTagInput(false);
      }
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const getTagColor = (tag) => {
    const index = availableTags.indexOf(tag) % TAG_COLORS.length;
    return TAG_COLORS[index];
  };

  const getUnusedTags = () => {
    return availableTags.filter(tag => !projectTags.includes(tag));
  };

  return (
    <div className="relative inline-block">
      {/* Current Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        {projectTags.map(tag => (
          <span
            key={tag}
            className={`px-2 py-1 bg-gradient-to-r ${getTagColor(tag)} border rounded text-xs font-mono flex items-center gap-1`}
          >
            🏷️ {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="hover:opacity-70 ml-1"
              title="Удалить тег"
            >
              ✕
            </button>
          </span>
        ))}
        
        {/* Add Tag Button */}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded text-xs text-gray-300 transition-colors"
          title="Добавить тег"
        >
          + Тег
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
          {getUnusedTags().length > 0 ? (
            <div className="p-2">
              {getUnusedTags().map(tag => (
                <button
                  key={tag}
                  onClick={() => handleAddTag(tag)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded text-sm text-white transition-colors"
                >
                  🏷️ {tag}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-sm text-gray-400">
              Все теги уже добавлены
            </div>
          )}

          {/* Create New Tag */}
          <div className="border-t border-gray-700 p-2">
            {!showNewTagInput ? (
              <button
                onClick={() => setShowNewTagInput(true)}
                className="w-full px-3 py-2 text-left hover:bg-gray-700 rounded text-sm text-blue-400 transition-colors"
              >
                + Создать новый тег
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateNewTag()}
                  placeholder="Название тега"
                  className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleCreateNewTag}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setNewTagName('');
                    setShowNewTagInput(false);
                  }}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

