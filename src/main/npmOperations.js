const path = require('path');
const { CommandExecutor } = require('./utils/commandExecutor');
const { ErrorHandler } = require('./utils/errorHandler');
const { getRunCommand } = require('./packageManagerDetector');
const { getTerminal, getNodeManager, loadConfig } = require('./config');
const { TerminalDetector } = require('./terminalDetector');
const { NodeVersionManager } = require('./nodeVersionManager');

// Whitelist разрешенных скриптов для безопасности
// Extended to include common npm scripts for better developer experience
const ALLOWED_SCRIPTS = [
  'browser:dev',
  'mobile:dev',
  'browser:build',
  'mobile:build',
  'dev',
  'start',
  'build',
  'test',
  'lint',
  'format'
];

/**
 * Получает доступные npm скрипты из package.json
 */
function getAvailableScripts(packageJson) {
  const scripts = packageJson.scripts || {};
  const available = {};
  
  ALLOWED_SCRIPTS.forEach(scriptName => {
    if (scripts[scriptName]) {
      available[scriptName] = true;
    }
  });
  
  return available;
}

/**
 * Генерирует команду для запуска скрипта в терминале
 * @param {string} runCommand - Команда запуска (npm run, yarn, pnpm)
 * @returns {string} Команда для терминала
 */
function generateTerminalCommand(runCommand) {
  return runCommand;
}

/**
 * Запускает npm/yarn/pnpm скрипт в новом окне терминала
 */
async function runScript(projectPath, scriptName, packageManager = 'npm') {
  try {
    // Валидация scriptName (whitelist)
    if (!ALLOWED_SCRIPTS.includes(scriptName)) {
      return {
        success: false,
        error: 'Invalid script name'
      };
    }
    
    // Получаем правильную команду для package manager
    let runCommand = getRunCommand(packageManager, scriptName);
    
    // Получаем настройки терминала из config
    const terminal = await getTerminal();
    
    // Определяем терминал
    let terminalPath, terminalType;
    if (terminal.path && terminal.type) {
      terminalPath = terminal.path;
      terminalType = terminal.type;
    } else {
      // Fallback: автоопределение терминала
      const detector = new TerminalDetector();
      const defaultTerminal = await detector.getDefaultTerminal();
      terminalPath = defaultTerminal.path;
      terminalType = defaultTerminal.type;
    }
    
    // === ИНТЕГРАЦИЯ NODE VERSION MANAGER ===
    // Получаем настройки Node.js версий
    const nodeVersionManager = new NodeVersionManager();
    const config = await loadConfig();
    
    // Определяем менеджер Node.js версий
    let nodeManager = await getNodeManager();
    if (nodeManager === 'auto') {
      nodeManager = await nodeVersionManager.detectNodeManager();
    }
    
    // Получаем требуемую версию Node.js для проекта
    const requiredVersion = await nodeVersionManager.getRequiredNodeVersion(projectPath, config);
    
    // Если есть менеджер версий - проверяем установлена ли версия
    if (nodeManager !== 'none') {
      const isInstalled = await nodeVersionManager.isVersionInstalled(requiredVersion, nodeManager);
      
      if (!isInstalled) {
        // Версия не установлена - вернуть ошибку
        return {
          success: false,
          error: `Node.js версия ${requiredVersion} не установлена. Установите ее через ${nodeManager}.`,
          needsInstall: true,
          version: requiredVersion,
          manager: nodeManager
        };
      }
      
      // Генерируем команду с правильной версией Node.js
      runCommand = nodeVersionManager.generateRunCommand(
        nodeManager,
        requiredVersion,
        runCommand,
        terminalType
      );
    }
    // === КОНЕЦ ИНТЕГРАЦИИ ===
    
    // Генерируем финальную команду для терминала
    const command = generateTerminalCommand(runCommand);
    
    // Выполнение команды через CommandExecutor
    const process = CommandExecutor.spawnInTerminal(terminalPath, command, projectPath);
    
    process.on('error', (error) => {
      ErrorHandler.warn('Failed to spawn terminal:', error);
    });
    
    process.unref();
    
    return { 
      success: true,
      nodeVersion: requiredVersion,
      nodeManager: nodeManager
    };
  } catch (error) {
    return ErrorHandler.handle(error, 'runScript');
  }
}

/**
 * Открывает папку проекта в системном файловом менеджере
 */
async function openFolder(folderPath) {
  try {
    // Валидация пути через CommandExecutor
    const normalizedPath = CommandExecutor.validatePath(folderPath);
    
    const { spawn } = require('child_process');
    let command, args;
    
    // Определяем команду в зависимости от платформы
    if (process.platform === 'win32') {
      command = 'explorer';
      args = [normalizedPath];
    } else if (process.platform === 'darwin') {
      command = 'open';
      args = [normalizedPath];
    } else {
      command = 'xdg-open';
      args = [normalizedPath];
    }
    
    const process = spawn(command, args, {
      detached: true,
      stdio: 'ignore'
    });
    
    process.unref();
    
    return { 
      success: true 
    };
  } catch (error) {
    return ErrorHandler.handle(error, 'openFolder');
  }
}

module.exports = {
  getAvailableScripts,
  runScript,
  openFolder,
  generateTerminalCommand,
  ALLOWED_SCRIPTS
};

