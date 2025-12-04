import { useEffect } from 'react';

/**
 * Хук для обработки keyboard shortcuts
 * @param {Object.<string, Function>} shortcuts - Объект с shortcuts { 'ctrl+s': handler }
 */
export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = [];
      
      if (event.ctrlKey) key.push('ctrl');
      if (event.shiftKey) key.push('shift');
      if (event.altKey) key.push('alt');
      if (event.metaKey) key.push('meta');
      
      key.push(event.key.toLowerCase());
      
      const combo = key.join('+');
      
      if (shortcuts[combo]) {
        event.preventDefault();
        shortcuts[combo](event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

export default useKeyboardShortcuts;
