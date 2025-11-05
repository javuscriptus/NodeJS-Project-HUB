/**
 * API обертки для IPC вызовов
 * Предоставляет удобный интерфейс для взаимодействия с Main процессом
 */

/**
 * Сканирует корневую папку на наличие проектов
 * @param {string} rootPath - путь к корневой папке
 * @returns {Promise<{success: boolean, projects: Array, error?: string}>}
 */
export async function scanProjects(rootPath) {
  return await window.electronAPI.scanProjects(rootPath);
}

/**
 * Запускает npm скрипт в новом терминале
 * @param {string} projectPath - путь к проекту
 * @param {string} script - название скрипта
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function runNpmScript(projectPath, script) {
  return await window.electronAPI.runNpmScript(projectPath, script);
}

/**
 * Выполняет git pull origin dev
 * @param {string} projectPath - путь к проекту
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function gitPull(projectPath) {
  return await window.electronAPI.gitPull(projectPath);
}

/**
 * Открывает папку в Windows Explorer
 * @param {string} path - путь к папке
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function openFolder(path) {
  return await window.electronAPI.openFolder(path);
}

/**
 * Получает сохраненную конфигурацию
 * @returns {Promise<{rootPath?: string}>}
 */
export async function getConfig() {
  return await window.electronAPI.getConfig();
}

/**
 * Сохраняет конфигурацию
 * @param {Object} config - объект конфигурации
 * @returns {Promise<{success: boolean}>}
 */
export async function saveConfig(config) {
  return await window.electronAPI.saveConfig(config);
}

/**
 * Открывает диалог выбора папки
 * @returns {Promise<{canceled: boolean, filePaths: string[]}>}
 */
export async function selectFolder() {
  return await window.electronAPI.selectFolder();
}

