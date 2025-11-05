const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

/**
 * Класс для управления версиями Node.js через менеджеры версий (nvm, volta, fnm)
 */
class NodeVersionManager {
  constructor() {
    this.cachedManager = null;
  }

  /**
   * Определяет установленный менеджер версий Node.js
   * @returns {Promise<string>} 'nvm', 'volta', 'fnm' или 'none'
   */
  async detectNodeManager() {
    // Если уже кэшировано - вернуть из кэша
    if (this.cachedManager) {
      return this.cachedManager;
    }

    try {
      // Проверка nvm (Windows - nvm-windows)
      try {
        await execAsync('nvm --version', { timeout: 3000 });
        this.cachedManager = 'nvm';
        return 'nvm';
      } catch (error) {
        // nvm не найден
      }

      // Проверка volta
      try {
        await execAsync('volta --version', { timeout: 3000 });
        this.cachedManager = 'volta';
        return 'volta';
      } catch (error) {
        // volta не найден
      }

      // Проверка fnm
      try {
        await execAsync('fnm --version', { timeout: 3000 });
        this.cachedManager = 'fnm';
        return 'fnm';
      } catch (error) {
        // fnm не найден
      }

      // Ни один менеджер не найден
      this.cachedManager = 'none';
      return 'none';
    } catch (error) {
      this.cachedManager = 'none';
      return 'none';
    }
  }

  /**
   * Получает требуемую версию Node.js для проекта
   * @param {string} projectPath - Путь к проекту
   * @param {Object} config - Конфигурация (может содержать ручную версию)
   * @returns {Promise<string>} Версия Node.js (например, '14.18.0')
   */
  async getRequiredNodeVersion(projectPath, config = {}) {
    try {
      // 1. Сначала проверить config проекта (если версия задана вручную)
      const projectName = path.basename(projectPath);
      if (config.projects && config.projects[projectName] && config.projects[projectName].nodeVersion) {
        return this.normalizeVersion(config.projects[projectName].nodeVersion);
      }

      // 2. Проверить наличие файла .nvmrc
      try {
        const nvmrcPath = path.join(projectPath, '.nvmrc');
        const nvmrcContent = await fs.readFile(nvmrcPath, 'utf-8');
        const version = nvmrcContent.trim();
        if (version) {
          return this.normalizeVersion(version);
        }
      } catch (error) {
        // .nvmrc не найден или ошибка чтения
      }

      // 3. Прочитать package.json и извлечь engines.node
      try {
        const packageJsonPath = path.join(projectPath, 'package.json');
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);
        
        if (packageJson.engines && packageJson.engines.node) {
          return this.normalizeVersion(packageJson.engines.node);
        }
      } catch (error) {
        // package.json не найден или ошибка чтения
      }

      // 4. Вернуть дефолт
      return '14.18.0';
    } catch (error) {
      return '14.18.0';
    }
  }

  /**
   * Нормализует версию (убирает ^, ~, >=, и другие символы)
   * @param {string} version - Версия из конфига
   * @returns {string} Нормализованная версия
   */
  normalizeVersion(version) {
    // Убираем пробелы
    let normalized = version.trim();
    
    // Убираем префиксы (^, ~, >=, >, =, v)
    normalized = normalized.replace(/^[\^~>=v]+/, '');
    
    // Извлекаем только версию (первая часть если есть ||)
    if (normalized.includes('||')) {
      normalized = normalized.split('||')[0].trim();
    }
    
    // Извлекаем диапазон (берем первую версию)
    if (normalized.includes(' ')) {
      normalized = normalized.split(' ')[0].trim();
    }
    
    return normalized;
  }

  /**
   * Проверяет установлена ли версия Node.js
   * @param {string} version - Версия для проверки
   * @param {string} manager - Менеджер версий ('nvm', 'volta', 'fnm')
   * @returns {Promise<boolean>} true если установлена
   */
  async isVersionInstalled(version, manager = null) {
    try {
      // Если менеджер не указан - определить автоматически
      if (!manager) {
        manager = await this.detectNodeManager();
      }

      if (manager === 'none') {
        // Если менеджера нет - проверить текущую версию node
        try {
          const { stdout } = await execAsync('node --version', { timeout: 3000 });
          const currentVersion = stdout.trim().replace('v', '');
          return currentVersion.startsWith(version);
        } catch {
          return false;
        }
      }

      switch (manager) {
        case 'nvm':
          return await this.isVersionInstalledNvm(version);
        case 'volta':
          return await this.isVersionInstalledVolta(version);
        case 'fnm':
          return await this.isVersionInstalledFnm(version);
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Проверяет установлена ли версия через nvm
   */
  async isVersionInstalledNvm(version) {
    try {
      const { stdout } = await execAsync('nvm list', { timeout: 5000 });
      // Парсим вывод nvm list
      // Пример вывода Windows:
      //   * 16.20.0 (Currently using 64-bit executable)
      //     14.18.0
      const lines = stdout.split('\n');
      for (const line of lines) {
        const cleaned = line.trim().replace(/[\*\s]+/, '');
        if (cleaned.startsWith(version) || cleaned.startsWith('v' + version)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Проверяет установлена ли версия через volta
   */
  async isVersionInstalledVolta(version) {
    try {
      // Volta не предоставляет команду для просмотра установленных версий
      // Поэтому просто попытаемся использовать версию
      await execAsync(`volta run --node ${version} node --version`, { timeout: 3000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Проверяет установлена ли версия через fnm
   */
  async isVersionInstalledFnm(version) {
    try {
      const { stdout } = await execAsync('fnm list', { timeout: 5000 });
      // Парсим вывод fnm list
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.includes(version) || line.includes('v' + version)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Генерирует команду запуска с правильной версией Node.js
   * @param {string} nodeManager - Менеджер версий
   * @param {string} version - Версия Node.js
   * @param {string} npmScript - npm команда (например, "npm run dev")
   * @param {string} terminalType - Тип терминала (bash, cmd, powershell)
   * @returns {string} Команда для запуска
   */
  generateRunCommand(nodeManager, version, npmScript, terminalType) {
    // Если менеджера нет - вернуть обычную команду
    if (nodeManager === 'none' || !nodeManager) {
      return npmScript;
    }

    switch (nodeManager) {
      case 'nvm':
        // nvm use работает по-разному в bash и cmd
        if (terminalType === 'bash') {
          // Git Bash: nvm use должен быть в том же shell
          return `nvm use ${version} && ${npmScript}`;
        } else {
          // CMD/PowerShell: nvm use тоже работает
          return `nvm use ${version} && ${npmScript}`;
        }

      case 'volta':
        // Volta: использовать volta run
        return `volta run --node ${version} ${npmScript}`;

      case 'fnm':
        // fnm: использовать fnm use
        if (terminalType === 'bash') {
          return `fnm use ${version} && ${npmScript}`;
        } else {
          return `fnm use ${version} && ${npmScript}`;
        }

      default:
        return npmScript;
    }
  }

  /**
   * Устанавливает версию Node.js через менеджер
   * @param {string} version - Версия для установки
   * @param {string} manager - Менеджер версий
   * @returns {Promise<Object>} { success, error? }
   */
  async installVersion(version, manager = null) {
    try {
      // Если менеджер не указан - определить автоматически
      if (!manager) {
        manager = await this.detectNodeManager();
      }

      if (manager === 'none') {
        return {
          success: false,
          error: 'Менеджер версий Node.js не установлен. Установите nvm-windows, volta или fnm.'
        };
      }

      let command;
      switch (manager) {
        case 'nvm':
          command = `nvm install ${version}`;
          break;
        case 'volta':
          command = `volta install node@${version}`;
          break;
        case 'fnm':
          command = `fnm install ${version}`;
          break;
        default:
          return { success: false, error: 'Неизвестный менеджер версий' };
      }

      await execAsync(command, { timeout: 120000 }); // 2 минуты timeout
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Очищает кэш менеджера
   */
  clearCache() {
    this.cachedManager = null;
  }
}

module.exports = { NodeVersionManager };

