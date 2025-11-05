const fs = require('fs').promises;
const path = require('path');

/**
 * Определяет package manager проекта (npm, yarn, pnpm)
 * @param {string} projectPath - путь к проекту
 * @returns {Promise<string>} - 'npm' | 'yarn' | 'pnpm'
 */
async function detectPackageManager(projectPath) {
  try {
    // Проверяем наличие lock-файлов
    const [hasYarnLock, hasPnpmLock] = await Promise.all([
      fileExists(path.join(projectPath, 'yarn.lock')),
      fileExists(path.join(projectPath, 'pnpm-lock.yaml'))
    ]);

    if (hasPnpmLock) {
      return 'pnpm';
    }
    
    if (hasYarnLock) {
      return 'yarn';
    }

    // По умолчанию npm
    return 'npm';
  } catch (error) {
    return 'npm';
  }
}

/**
 * Генерирует команду запуска для package manager
 * @param {string} packageManager - npm/yarn/pnpm
 * @param {string} script - название скрипта
 * @returns {string} - команда для выполнения
 */
function getRunCommand(packageManager, script) {
  switch (packageManager) {
    case 'yarn':
      return `yarn ${script}`;
    case 'pnpm':
      return `pnpm ${script}`;
    case 'npm':
    default:
      return `npm run ${script}`;
  }
}

/**
 * Проверяет существование файла
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  detectPackageManager,
  getRunCommand
};

