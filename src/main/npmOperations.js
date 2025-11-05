const { exec } = require('child_process');
const path = require('path');
const { getRunCommand } = require('./packageManagerDetector');
const { getTerminal, getNodeManager, loadConfig } = require('./config');
const { TerminalDetector } = require('./terminalDetector');
const { NodeVersionManager } = require('./nodeVersionManager');

// Whitelist разрешенных скриптов для безопасности
const ALLOWED_SCRIPTS = [
  'browser:dev',
  'mobile:dev',
  'browser:build',
  'mobile:build'
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
 * @param {string} terminalPath - Путь к терминалу
 * @param {string} terminalType - Тип терминала (bash, cmd, powershell)
 * @param {string} projectPath - Путь к проекту
 * @param {string} runCommand - Команда запуска (npm run, yarn, pnpm)
 * @returns {string} Команда для exec
 */
function generateTerminalCommand(terminalPath, terminalType, projectPath, runCommand) {
  const safePath = projectPath.replace(/"/g, '\\"');
  
  switch (terminalType) {
    case 'bash':
      // Git Bash синтаксис
      // Преобразуем Windows путь в UNIX стиль для bash
      const unixPath = projectPath.replace(/\\/g, '/').replace(/^([A-Z]):/, (match, drive) => {
        return `/${drive.toLowerCase()}`;
      });
      return `start "" "${terminalPath}" --login -i -c "cd '${unixPath}' && ${runCommand}; exec bash"`;
      
    case 'powershell':
      // PowerShell синтаксис
      return `start "" "${terminalPath}" -NoExit -Command "cd '${safePath}'; ${runCommand}"`;
      
    case 'cmd':
    default:
      // CMD синтаксис (по умолчанию)
      return `start cmd /k "cd /d "${safePath}" && ${runCommand}"`;
  }
}

/**
 * Запускает npm/yarn/pnpm скрипт в новом окне терминала
 */
async function runScript(projectPath, scriptName, packageManager = 'npm') {
  return new Promise(async (resolve, reject) => {
    try {
    // Валидация scriptName (whitelist)
    if (!ALLOWED_SCRIPTS.includes(scriptName)) {
      return reject(new Error('Invalid script name'));
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
          return resolve({
            success: false,
            error: `Node.js версия ${requiredVersion} не установлена. Установите ее через ${nodeManager}.`,
            needsInstall: true,
            version: requiredVersion,
            manager: nodeManager
          });
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
      const command = generateTerminalCommand(
        terminalPath,
        terminalType,
        projectPath,
        runCommand
      );
    
    // Выполнение команды
    exec(command, (error) => {
      if (error) {
        resolve({ 
          success: false, 
          error: error.message 
        });
      } else {
        resolve({ 
            success: true,
            nodeVersion: requiredVersion,
            nodeManager: nodeManager
        });
      }
    });
    } catch (error) {
      resolve({ 
        success: false, 
        error: error.message 
      });
    }
  });
}

/**
 * Открывает папку проекта в Windows Explorer
 */
async function openFolder(folderPath) {
  return new Promise((resolve, reject) => {
    // Валидация пути
    const normalizedPath = path.normalize(folderPath);
    
    // Команда для Windows Explorer
    exec(`explorer "${normalizedPath}"`, (error) => {
      if (error) {
        resolve({ 
          success: false, 
          error: error.message 
        });
      } else {
        resolve({ 
          success: true 
        });
      }
    });
  });
}

module.exports = {
  getAvailableScripts,
  runScript,
  openFolder,
  generateTerminalCommand,
  ALLOWED_SCRIPTS
};

