import React, { useState, useEffect, useRef } from 'react';

export default function SearchBar({ value, onChange, debounceMs = 300 }) {
  const [localValue, setLocalValue] = useState(value);
  const debounceTimeout = useRef(null);

  // Синхронизация с внешним value при изменении извне
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue) => {
    setLocalValue(newValue);

    // Очищаем предыдущий таймер
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Устанавливаем новый таймер
    debounceTimeout.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  };

  const handleClear = () => {
    setLocalValue('');
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    onChange('');
  };

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-gray-500 text-xl">🔍</span>
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Поиск по названию, тегам, алиасам, заметкам... (поддержка кириллицы/латиницы)"
        className="
          w-full pl-10 pr-10 py-3
          bg-gray-800 border border-gray-700 rounded-lg
          text-white placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-all duration-200
        "
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="
            absolute inset-y-0 right-0 pr-3 
            flex items-center text-gray-500 hover:text-gray-300
            transition-colors duration-200
          "
          title="Очистить поиск"
        >
          ✕
        </button>
      )}
    </div>
  );
}

