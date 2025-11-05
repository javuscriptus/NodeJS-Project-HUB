const fs = require('fs').promises;
const path = require('path');

class ReadmeParser {
  constructor() {
    this.cache = new Map(); // Кэш для README файлов
  }

  /**
   * Получает содержимое README.md проекта
   * @param {string} projectPath - Путь к проекту
   * @returns {Promise<{success: boolean, content?: string, error?: string}>}
   */
  async getReadme(projectPath) {
    try {
      // Проверяем кэш
      const cacheKey = projectPath;
      if (this.cache.has(cacheKey)) {
        return {
          success: true,
          content: this.cache.get(cacheKey)
        };
      }

      // Ищем README файл (разные варианты написания)
      const possibleNames = [
        'README.md',
        'readme.md',
        'Readme.md',
        'README.MD',
        'README'
      ];

      let readmePath = null;
      for (const name of possibleNames) {
        const filePath = path.join(projectPath, name);
        try {
          await fs.access(filePath);
          readmePath = filePath;
          break;
        } catch (error) {
          // Файл не найден, пробуем следующий
          continue;
        }
      }

      if (!readmePath) {
        return {
          success: false,
          error: 'README.md не найден'
        };
      }

      // Читаем содержимое
      const content = await fs.readFile(readmePath, 'utf-8');

      // Сохраняем в кэш
      this.cache.set(cacheKey, content);

      return {
        success: true,
        content
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Ошибка чтения README'
      };
    }
  }

  /**
   * Инвалидирует кэш для конкретного проекта
   * @param {string} projectPath - Путь к проекту
   */
  invalidateCache(projectPath) {
    this.cache.delete(projectPath);
  }

  /**
   * Очищает весь кэш
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Получает последние коммиты из git log
   * @param {string} projectPath - Путь к проекту
   * @param {number} limit - Количество коммитов (по умолчанию 10)
   * @returns {Promise<{success: boolean, commits?: Array, error?: string}>}
   */
  async getRecentCommits(projectPath, limit = 10) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execPromise = promisify(exec);

    try {
      const { stdout } = await execPromise(
        `git -C "${projectPath}" log -${limit} --pretty=format:"%H|%an|%ae|%ad|%s" --date=relative`,
        { timeout: 5000 }
      );

      if (!stdout.trim()) {
        return {
          success: true,
          commits: []
        };
      }

      const commits = stdout.trim().split('\n').map(line => {
        const [hash, author, email, date, message] = line.split('|');
        return {
          hash: hash.substring(0, 7), // Короткий hash
          author,
          email,
          date,
          message
        };
      });

      return {
        success: true,
        commits
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Ошибка получения коммитов',
        commits: []
      };
    }
  }

  /**
   * Получает информацию о package.json проекта
   * @param {string} projectPath - Путь к проекту
   * @returns {Promise<{success: boolean, packageInfo?: Object, error?: string}>}
   */
  async getPackageInfo(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      return {
        success: true,
        packageInfo: {
          name: packageJson.name,
          version: packageJson.version,
          description: packageJson.description,
          author: packageJson.author,
          license: packageJson.license,
          repository: packageJson.repository,
          homepage: packageJson.homepage,
          keywords: packageJson.keywords,
          engines: packageJson.engines,
          dependencies: packageJson.dependencies ? Object.keys(packageJson.dependencies).length : 0,
          devDependencies: packageJson.devDependencies ? Object.keys(packageJson.devDependencies).length : 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Ошибка чтения package.json'
      };
    }
  }
}

module.exports = { ReadmeParser };

