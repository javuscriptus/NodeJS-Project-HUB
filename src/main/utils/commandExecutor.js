const { execFile, spawn } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const { ErrorHandler } = require('./errorHandler');

const execFilePromise = promisify(execFile);

/**
 * Безопасное выполнение shell команд
 * Использует execFile вместо exec для защиты от command injection
 */
class CommandExecutor {
  /**
   * Выполняет Git команду
   * @param {string} projectPath - Путь к проекту
   * @param {string[]} args - Аргументы команды
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<{stdout: string, stderr: string}>}
   */
  static async executeGit(projectPath, args, options = {}) {
    const validatedPath = this.validatePath(projectPath);
    
    const defaultOptions = {
      timeout: 30000,
      windowsHide: true,
      maxBuffer: 1024 * 1024, // 1MB
      ...options
    };

    try {
      const { stdout, stderr } = await execFilePromise(
        'git',
        ['-C', validatedPath, ...args],
        defaultOptions
      );
      
      return { stdout, stderr };
    } catch (error) {
      ErrorHandler.warn('Git command failed:', { args, error: error.message });
      throw error;
    }
  }

  /**
   * Выполняет npm/yarn/pnpm команду
   * @param {string} projectPath - Путь к проекту
   * @param {string} packageManager - Менеджер пакетов (npm/yarn/pnpm)
   * @param {string[]} args - Аргументы команды
   * @param {Object} options - Дополнительные опции
   * @returns {Promise<{stdout: string, stderr: string}>}
   */
  static async executePackageManager(projectPath, packageManager, args, options = {}) {
    const validatedPath = this.validatePath(projectPath);
    
    // Разрешённые package managers
    const allowedManagers = ['npm', 'yarn', 'pnpm'];
    if (!allowedManagers.includes(packageManager)) {
      throw new Error(`Invalid package manager: ${packageManager}`);
    }

    const defaultOptions = {
      timeout: 300000, // 5 минут для npm операций
      windowsHide: true,
      cwd: validatedPath,
      maxBuffer: 1024 * 1024, // 1MB
      ...options
    };

    try {
      const { stdout, stderr } = await execFilePromise(
        packageManager,
        args,
        defaultOptions
      );
      
      return { stdout, stderr };
    } catch (error) {
      ErrorHandler.warn('Package manager command failed:', { 
        packageManager, 
        args, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Запускает процесс в отдельном окне терминала
   * @param {string} terminal - Путь к терминалу
   * @param {string} command - Команда для выполнения
   * @param {string} projectPath - Рабочая директория
   * @returns {ChildProcess}
   */
  static spawnInTerminal(terminal, command, projectPath) {
    const validatedPath = this.validatePath(projectPath);
    
    // Экранирование команды для безопасности
    const escapedCommand = this.escapeCommand(command);
    
    let terminalArgs = [];
    
    // Определяем аргументы для разных терминалов
    if (terminal.includes('bash.exe')) {
      // Git Bash
      terminalArgs = ['-c', escapedCommand];
    } else if (terminal.includes('powershell.exe') || terminal.includes('pwsh.exe')) {
      // PowerShell
      terminalArgs = ['-NoExit', '-Command', escapedCommand];
    } else if (terminal.includes('cmd.exe')) {
      // CMD
      terminalArgs = ['/K', escapedCommand];
    } else {
      // По умолчанию используем как bash
      terminalArgs = ['-c', escapedCommand];
    }

    return spawn(terminal, terminalArgs, {
      cwd: validatedPath,
      detached: true,
      stdio: 'ignore',
      windowsHide: false
    });
  }

  /**
   * Валидирует путь к проекту
   * @param {string} projectPath - Путь для валидации
   * @returns {string} Нормализованный путь
   * @throws {Error} Если путь невалидный
   */
  static validatePath(projectPath) {
    if (!projectPath || typeof projectPath !== 'string') {
      throw new Error('Invalid project path');
    }

    // Нормализуем путь
    const normalizedPath = path.normalize(projectPath);

    // Проверяем на опасные паттерны
    const dangerousPatterns = ['..', '~'];
    if (dangerousPatterns.some(pattern => normalizedPath.includes(pattern))) {
      throw new Error('Project path contains dangerous patterns');
    }

    return normalizedPath;
  }

  /**
   * Экранирует команду для безопасного выполнения
   * @param {string} command - Команда
   * @returns {string} Экранированная команда
   */
  static escapeCommand(command) {
    // Базовое экранирование специальных символов
    // Для более сложных случаев можно использовать библиотеку shell-escape
    return command
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`');
  }

  /**
   * Проверяет доступность команды в системе
   * @param {string} command - Название команды
   * @returns {Promise<boolean>} true если команда доступна
   */
  static async isCommandAvailable(command) {
    try {
      const { stdout } = await execFilePromise(
        process.platform === 'win32' ? 'where' : 'which',
        [command],
        { timeout: 5000 }
      );
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Получает версию команды
   * @param {string} command - Название команды
   * @param {string[]} versionArgs - Аргументы для получения версии (default: ['--version'])
   * @returns {Promise<string|null>} Версия или null
   */
  static async getCommandVersion(command, versionArgs = ['--version']) {
    try {
      const { stdout } = await execFilePromise(
        command,
        versionArgs,
        { timeout: 5000 }
      );
      return stdout.trim();
    } catch {
      return null;
    }
  }
}

module.exports = { CommandExecutor };
