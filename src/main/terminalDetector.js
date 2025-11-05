const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Класс для определения доступных терминалов в системе
 */
class TerminalDetector {
  constructor() {
    this.cachedTerminals = null;
  }

  /**
   * Определяет все доступные терминалы в Windows
   * @returns {Promise<Array>} Массив объектов { name, path, priority }
   */
  async detectAvailableTerminals() {
    // Если уже кэшировано - вернуть из кэша
    if (this.cachedTerminals) {
      return this.cachedTerminals;
    }

    const terminals = [];

    // 1. Git Bash (высокий приоритет)
    const gitBashPaths = [
      'C:\\Program Files\\Git\\bin\\bash.exe',
      'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
      path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Git', 'bin', 'bash.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Git', 'bin', 'bash.exe')
    ];

    for (const gitBashPath of gitBashPaths) {
      if (await this.fileExists(gitBashPath)) {
        terminals.push({
          name: 'Git Bash',
          path: gitBashPath,
          priority: 3,
          type: 'bash'
        });
        break; // Найден первый - не ищем дальше
      }
    }

    // 2. PowerShell (средний приоритет)
    const powershellPath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
    if (await this.fileExists(powershellPath)) {
      terminals.push({
        name: 'PowerShell',
        path: powershellPath,
        priority: 2,
        type: 'powershell'
      });
    }

    // 3. CMD (низкий приоритет - всегда доступен)
    terminals.push({
      name: 'Command Prompt',
      path: 'C:\\Windows\\System32\\cmd.exe',
      priority: 1,
      type: 'cmd'
    });

    // Сортировка по приоритету (высокий -> низкий)
    terminals.sort((a, b) => b.priority - a.priority);

    // Кэшировать результат
    this.cachedTerminals = terminals;

    return terminals;
  }

  /**
   * Получает терминал по умолчанию (с наивысшим приоритетом)
   * @returns {Promise<Object>} Объект терминала
   */
  async getDefaultTerminal() {
    const terminals = await this.detectAvailableTerminals();
    return terminals[0]; // Первый в списке (наивысший приоритет)
  }

  /**
   * Проверяет валидность пути к терминалу
   * @param {string} terminalPath - Путь к exe файлу
   * @returns {Promise<boolean>} true если терминал работает
   */
  async validateTerminalPath(terminalPath) {
    try {
      // Проверка существования файла
      if (!await this.fileExists(terminalPath)) {
        return false;
      }

      // Попытка запустить тестовую команду
      const testCommand = `"${terminalPath}" ${this.getTestCommandArgs(terminalPath)}`;
      await execAsync(testCommand, { timeout: 3000 });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Генерирует аргументы для тестовой команды
   * @param {string} terminalPath - Путь к терминалу
   * @returns {string} Аргументы команды
   */
  getTestCommandArgs(terminalPath) {
    const lowerPath = terminalPath.toLowerCase();
    
    if (lowerPath.includes('bash.exe')) {
      return '-c "exit 0"';
    } else if (lowerPath.includes('powershell.exe')) {
      return '-Command "exit 0"';
    } else if (lowerPath.includes('cmd.exe')) {
      return '/c "exit 0"';
    }
    
    return '/c "exit 0"'; // По умолчанию CMD синтаксис
  }

  /**
   * Определяет тип терминала по пути
   * @param {string} terminalPath - Путь к терминалу
   * @returns {string} Тип: 'bash', 'powershell', 'cmd'
   */
  getTerminalType(terminalPath) {
    const lowerPath = terminalPath.toLowerCase();
    
    if (lowerPath.includes('bash.exe')) {
      return 'bash';
    } else if (lowerPath.includes('powershell.exe')) {
      return 'powershell';
    } else if (lowerPath.includes('cmd.exe')) {
      return 'cmd';
    }
    
    return 'cmd'; // По умолчанию
  }

  /**
   * Проверяет существование файла
   * @param {string} filePath - Путь к файлу
   * @returns {Promise<boolean>}
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Очищает кэш обнаруженных терминалов
   */
  clearCache() {
    this.cachedTerminals = null;
  }
}

module.exports = { TerminalDetector };

