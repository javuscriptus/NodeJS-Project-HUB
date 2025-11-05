import React, { useState } from 'react';

export default function TagInput({ tags = [], onTagsChange }) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Удалить последний тег при Backspace если input пустой
      removeTag(tags[tags.length - 1]);
    }
  };

  const addTag = (tag) => {
    // Проверка на дубликат
    if (tags.includes(tag)) {
      return;
    }
    
    // Проверка на пустоту
    if (!tag) {
      return;
    }
    
    onTagsChange([...tags, tag]);
    setInputValue('');
  };

  const removeTag = (tagToRemove) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 border border-gray-600 rounded bg-gray-700">
      {tags.map(tag => (
        <span
          key={tag}
          className="
            inline-flex items-center gap-1 px-2 py-1
            bg-blue-600 text-white text-xs rounded
            hover:bg-blue-700 transition-colors
          "
        >
          {tag}
          <button
            onClick={() => removeTag(tag)}
            className="
              hover:text-red-300 transition-colors
              focus:outline-none
            "
            aria-label="Удалить тег"
          >
            ×
          </button>
        </span>
      ))}
      
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? "Добавить тег (Enter)" : ""}
        className="
          flex-1 min-w-[120px] px-2 py-1
          bg-transparent text-white text-sm
          focus:outline-none
          placeholder-gray-500
        "
      />
    </div>
  );
}

