import React, { useState } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

/**
 * Компонент справки по горячим клавишам
 */
export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { keys: ['Ctrl', 'F'], description: 'Фокус на поиске' },
    { keys: ['Ctrl', 'R'], description: 'Обновить список проектов' },
    { keys: ['Ctrl', ','], description: 'Открыть настройки' },
    { keys: ['Esc'], description: 'Закрыть модальные окна' },
    { keys: ['Ctrl', 'K'], description: 'Показать команды' },
    { keys: ['?'], description: 'Показать эту справку' },
  ];

  useKeyboardShortcuts({
    '?': () => setIsOpen(true),
    'escape': () => setIsOpen(false),
  });

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-colors z-50"
        title="Горячие клавиши (нажмите ?)"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
      <div
        className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 shadow-2xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Горячие клавиши</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 bg-gray-700/30 rounded-lg"
            >
              <span className="text-gray-300">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <React.Fragment key={keyIndex}>
                    {keyIndex > 0 && <span className="text-gray-500 mx-1">+</span>}
                    <kbd className="px-2 py-1 text-sm font-semibold text-white bg-gray-900 rounded shadow">
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          Нажмите <kbd className="px-2 py-1 bg-gray-900 rounded">Esc</kbd> чтобы закрыть
        </div>
      </div>
    </div>
  );
}
