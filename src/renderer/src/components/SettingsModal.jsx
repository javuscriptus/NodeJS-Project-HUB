import React, { useState, useEffect } from 'react';

export default function SettingsModal({ isOpen, onClose, onSave, currentPath }) {
  const [selectedPath, setSelectedPath] = useState(currentPath || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Terminal settings
  const [availableTerminals, setAvailableTerminals] = useState([]);
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [currentTerminal, setCurrentTerminal] = useState(null);
  const [terminalStatus, setTerminalStatus] = useState('loading'); // loading, success, error

  // Node.js settings
  const [nodeManager, setNodeManager] = useState('auto');
  const [detectedNodeManager, setDetectedNodeManager] = useState('none');
  const [nodeStatus, setNodeStatus] = useState('loading'); // loading, success, error

  // Auto-updater settings
  const [currentVersion, setCurrentVersion] = useState('');
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  // Git Remote Check settings
  const [gitRemoteCheckEnabled, setGitRemoteCheckEnabled] = useState(false);

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTerminalSettings();
      loadNodeSettings();
      loadAppVersion();
      loadGitSettings();
    }
  }, [isOpen]);

  const loadTerminalSettings = async () => {
    try {
      setTerminalStatus('loading');
      
      // Detect available terminals
      const detectResult = await window.electronAPI.detectTerminals();
      if (detectResult.success && detectResult.terminals) {
        setAvailableTerminals(detectResult.terminals);
      }
      
      // Get current terminal from config
      const terminalResult = await window.electronAPI.getTerminal();
      if (terminalResult.success && terminalResult.terminal) {
        setCurrentTerminal(terminalResult.terminal);
        // If terminal is set, use it as selected
        if (terminalResult.terminal.path) {
          setSelectedTerminal(terminalResult.terminal);
        } else {
          // Otherwise, use default terminal
          const defaultResult = await window.electronAPI.getDefaultTerminal();
          if (defaultResult.success && defaultResult.terminal) {
            setSelectedTerminal(defaultResult.terminal);
          }
        }
      }
      
      setTerminalStatus('success');
    } catch (error) {
      console.error('Error loading terminal settings:', error);
      setTerminalStatus('error');
    }
  };

  const handleTerminalChange = (terminal) => {
    setSelectedTerminal(terminal);
  };

  const loadNodeSettings = async () => {
    try {
      setNodeStatus('loading');
      
      // Detect Node manager
      const detectResult = await window.electronAPI.detectNodeManager();
      if (detectResult.success) {
        setDetectedNodeManager(detectResult.manager);
      }
      
      // Get current setting from config
      const managerResult = await window.electronAPI.getNodeManager();
      if (managerResult.success) {
        setNodeManager(managerResult.manager);
      }
      
      setNodeStatus('success');
    } catch (error) {
      console.error('Error loading Node settings:', error);
      setNodeStatus('error');
    }
  };

  const handleNodeManagerChange = (manager) => {
    setNodeManager(manager);
  };

  const loadAppVersion = async () => {
    try {
      const result = await window.updater.getVersion();
      if (result.success && result.version) {
        setCurrentVersion(result.version);
      }
    } catch (error) {
      console.error('Error loading app version:', error);
    }
  };

  const handleCheckForUpdates = async () => {
    try {
      setIsCheckingUpdates(true);
      await window.updater.check();
      // Результат будет показан через UpdateNotification компонент
      setTimeout(() => setIsCheckingUpdates(false), 2000);
    } catch (error) {
      console.error('Error checking for updates:', error);
      setIsCheckingUpdates(false);
    }
  };

  const loadGitSettings = async () => {
    try {
      const result = await window.electronAPI.getGitRemoteCheckEnabled();
      if (result.success) {
        setGitRemoteCheckEnabled(result.enabled);
      }
    } catch (error) {
      console.error('Error loading git settings:', error);
    }
  };

  const handleGitRemoteCheckChange = async (enabled) => {
    try {
      setGitRemoteCheckEnabled(enabled);
      await window.electronAPI.setGitRemoteCheckEnabled(enabled);
    } catch (error) {
      console.error('Error saving git remote check setting:', error);
    }
  };

  if (!isOpen) return null;

  const handleSelectFolder = async () => {
    try {
      const result = await window.electronAPI.selectFolder();
      if (!result.canceled && result.filePaths.length > 0) {
        setSelectedPath(result.filePaths[0]);
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedPath) return;
    
    setIsSaving(true);
    try {
      // Save root path
      await onSave(selectedPath);
      
      // Save terminal settings if changed
      if (selectedTerminal && selectedTerminal.path) {
        await window.electronAPI.setTerminal(
          selectedTerminal.path,
          selectedTerminal.name,
          selectedTerminal.type
        );
      }
      
      // Save Node.js manager setting
      if (nodeManager) {
        await window.electronAPI.setNodeManager(nodeManager);
      }
      
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-6 w-full max-w-md animate-scale-in">
        <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
          ⚙️ Настройки
        </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Корневая папка с проектами
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={selectedPath}
              readOnly
              placeholder="Не выбрана"
              className="
                flex-1 px-3 py-2 
                border border-gray-600 rounded
                bg-gray-700 text-white text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
            />
            <button
              onClick={handleSelectFolder}
              className="
                px-4 py-2 
                bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                text-white text-sm rounded shadow-lg
                transition-all duration-200 transform hover:scale-105
              "
            >
              📁 Выбрать
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Выберите папку, в которой находятся все ваши проекты
          </p>
        </div>

        {/* Terminal Settings Section */}
        <div className="mb-4 pt-4 border-t border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            💻 Терминал
          </label>
          
          {terminalStatus === 'loading' && (
            <div className="text-sm text-gray-400">Загрузка...</div>
          )}
          
          {terminalStatus === 'error' && (
            <div className="text-sm text-red-400">Ошибка загрузки настроек терминала</div>
          )}
          
          {terminalStatus === 'success' && (
            <>
              <select
                value={selectedTerminal?.path || ''}
                onChange={(e) => {
                  const terminal = availableTerminals.find(t => t.path === e.target.value);
                  handleTerminalChange(terminal);
                }}
                className="
                  w-full px-3 py-2 
                  border border-gray-600 rounded
                  bg-gray-700 text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                "
              >
                {availableTerminals.map(terminal => (
                  <option key={terminal.path} value={terminal.path}>
                    {terminal.name} {terminal.priority === 3 ? '⭐' : ''}
                  </option>
                ))}
              </select>
              
              <div className="mt-2 flex items-center gap-2">
                {selectedTerminal && (
                  <>
                    <span className="text-xs text-green-400">✓ Доступен</span>
                    <span className="text-xs text-gray-500">
                      {selectedTerminal.type === 'bash' && '(Git Bash)'}
                      {selectedTerminal.type === 'powershell' && '(PowerShell)'}
                      {selectedTerminal.type === 'cmd' && '(Command Prompt)'}
                    </span>
                  </>
                )}
              </div>
              
              <p className="mt-2 text-xs text-gray-400">
                Терминал будет использоваться для запуска npm скриптов
              </p>
            </>
          )}
        </div>

        {/* Node.js Version Manager Section */}
        <div className="mb-4 pt-4 border-t border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🟢 Node.js Version Manager
          </label>
          
          {nodeStatus === 'loading' && (
            <div className="text-sm text-gray-400">Загрузка...</div>
          )}
          
          {nodeStatus === 'error' && (
            <div className="text-sm text-red-400">Ошибка загрузки настроек Node.js</div>
          )}
          
          {nodeStatus === 'success' && (
            <>
              <select
                value={nodeManager}
                onChange={(e) => handleNodeManagerChange(e.target.value)}
                className="
                  w-full px-3 py-2 
                  border border-gray-600 rounded
                  bg-gray-700 text-white text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                "
              >
                <option value="auto">Auto-detect (Рекомендуется)</option>
                <option value="nvm">nvm (Node Version Manager)</option>
                <option value="volta">Volta</option>
                <option value="fnm">fnm (Fast Node Manager)</option>
              </select>
              
              <div className="mt-2 flex items-center gap-2">
                {detectedNodeManager !== 'none' && (
                  <>
                    <span className="text-xs text-green-400">
                      ✓ Обнаружен: {detectedNodeManager}
                    </span>
                  </>
                )}
                {detectedNodeManager === 'none' && (
                  <span className="text-xs text-yellow-400">
                    ⚠️ Менеджер версий не найден
                  </span>
                )}
              </div>
              
              <p className="mt-2 text-xs text-gray-400">
                Используется для автоматического переключения версий Node.js
              </p>
              
              {detectedNodeManager === 'none' && (
                <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-700 rounded text-xs text-yellow-300">
                  💡 Установите nvm-windows для автоматического управления версиями Node.js
                  <br />
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('https://github.com/coreybutler/nvm-windows/releases', '_blank');
                    }}
                    className="underline hover:text-yellow-200"
                  >
                    Скачать nvm-windows →
                  </a>
                </div>
              )}
            </>
          )}
        </div>

        {/* Git Settings Section */}
        <div className="mb-4 pt-4 border-t border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            🌿 Настройки Git
          </label>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition-colors">
              <div className="flex-1">
                <div className="text-sm text-white font-medium">Проверять Remote статус</div>
                <div className="text-xs text-gray-400 mt-1">
                  Проверять наличие новых коммитов в GitLab/GitHub (требует аутентификацию)
                </div>
              </div>
              <input
                type="checkbox"
                checked={gitRemoteCheckEnabled}
                onChange={(e) => handleGitRemoteCheckChange(e.target.checked)}
                className="
                  w-5 h-5 ml-3
                  text-blue-600 bg-gray-600 border-gray-500 rounded
                  focus:ring-blue-500 focus:ring-2
                  cursor-pointer
                "
              />
            </label>
            
            {!gitRemoteCheckEnabled && (
              <div className="p-3 bg-yellow-900/20 border border-yellow-600/30 rounded text-xs text-yellow-400">
                ℹ️ Remote статус отключен. Индикаторы ⚠️ dev/main не будут отображаться.
              </div>
            )}
            
            {gitRemoteCheckEnabled && (
              <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded text-xs text-blue-400">
                💡 Совет: Настройте Git Credential Manager чтобы пароль запрашивался один раз:
                <code className="block mt-1 bg-gray-800 p-2 rounded font-mono text-xs">
                  git config --global credential.helper manager
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Auto-Updates Section */}
        <div className="mb-4 pt-4 border-t border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🔄 Автоматические обновления
          </label>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
              <div>
                <div className="text-sm text-white font-medium">Текущая версия</div>
                <div className="text-xs text-gray-400 font-mono">
                  v{currentVersion || 'Загрузка...'}
                </div>
              </div>
              <button
                onClick={handleCheckForUpdates}
                disabled={isCheckingUpdates}
                className="
                  px-4 py-2 
                  bg-blue-600 hover:bg-blue-700 
                  text-white text-sm rounded
                  transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-2
                "
              >
                {isCheckingUpdates ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Проверка...
                  </>
                ) : (
                  <>🔍 Проверить обновления</>
                )}
              </button>
            </div>
            
            <p className="text-xs text-gray-400">
              Приложение автоматически проверяет обновления при запуске и каждые 4 часа.
              Вы также можете проверить обновления вручную в любое время.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="
              px-4 py-2 
              border border-gray-600 
              text-gray-300 text-sm rounded
              hover:bg-gray-700
              transition-colors duration-200
              disabled:opacity-50
            "
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedPath || isSaving}
            className="
              px-4 py-2 
              bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
              text-white text-sm rounded shadow-lg
              transition-all duration-200 transform hover:scale-105
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isSaving ? '⏳ Сохранение...' : '✓ Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

