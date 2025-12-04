import { useState, useEffect } from 'react';

/**
 * Хук для debounce значений
 * @template T
 * @param {T} value - Значение для debounce
 * @param {number} delay - Задержка в миллисекундах
 * @returns {T} Debounced значение
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
