const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');

// Путь к файлу конфигурации
function getConfigPath() {
  const userDataPath = app.getPath('appData');
  return path.join(userDataPath, 'BettingsProjectHub', 'config.json');
}

// Путь к папке конфигурации
function getConfigDir() {
  const userDataPath = app.getPath('appData');
  return path.join(userDataPath, 'BettingsProjectHub');
}

/**
 * Загружает конфигурацию из AppData
 */
async function loadConfig() {
  try {
    const configPath = getConfigPath();
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    
    return config;
  } catch (error) {
    // Файл не существует или невалидный JSON
    // Возвращаем пустой объект
    return {};
  }
}

/**
 * Сохраняет конфигурацию в AppData
 */
async function saveConfig(config) {
  try {
    const configDir = getConfigDir();
    const configPath = getConfigPath();
    
    // Создать папку, если не существует
    try {
      await fs.mkdir(configDir, { recursive: true });
    } catch (error) {
      // Папка уже существует или нет прав
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
    
    // Сохранить конфиг
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Валидация конфигурации
 */
function validateConfig(config) {
  // Базовая валидация
  if (!config || typeof config !== 'object') {
    return false;
  }
  
  // Если есть rootPath, проверить что это строка
  if (config.rootPath && typeof config.rootPath !== 'string') {
    return false;
  }
  
  return true;
}

/**
 * Добавляет тег к проекту
 */
async function addTagToProject(projectPath, tag) {
  try {
    const config = await loadConfig();
    
    if (!config.projectTags) {
      config.projectTags = {};
    }
    
    if (!config.projectTags[projectPath]) {
      config.projectTags[projectPath] = [];
    }
    
    // Проверяем, что тег еще не добавлен
    if (!config.projectTags[projectPath].includes(tag)) {
      config.projectTags[projectPath].push(tag);
      
      // Добавляем тег в список доступных
      if (!config.availableTags) {
        config.availableTags = [];
      }
      if (!config.availableTags.includes(tag)) {
        config.availableTags.push(tag);
      }
      
      await saveConfig(config);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Удаляет тег у проекта
 */
async function removeTagFromProject(projectPath, tag) {
  try {
    const config = await loadConfig();
    
    if (config.projectTags && config.projectTags[projectPath]) {
      config.projectTags[projectPath] = config.projectTags[projectPath].filter(t => t !== tag);
      
      // Если у проекта больше нет тегов, удаляем запись
      if (config.projectTags[projectPath].length === 0) {
        delete config.projectTags[projectPath];
      }
      
      await saveConfig(config);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Получает все доступные теги
 */
async function getAvailableTags() {
  try {
    const config = await loadConfig();
    return config.availableTags || [];
  } catch (error) {
    return [];
  }
}

/**
 * Создает новый тег
 */
async function createTag(tag) {
  try {
    const config = await loadConfig();
    
    if (!config.availableTags) {
      config.availableTags = [];
    }
    
    if (!config.availableTags.includes(tag)) {
      config.availableTags.push(tag);
      await saveConfig(config);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Получает теги проекта
 */
async function getProjectTags(projectPath) {
  try {
    const config = await loadConfig();
    return config.projectTags?.[projectPath] || [];
  } catch (error) {
    return [];
  }
}

/**
 * Получает алиасы проекта
 * @param {string} projectPath - Путь к проекту
 * @returns {Promise<Array>} Массив алиасов
 */
async function getProjectAliases(projectPath) {
  try {
    const config = await loadConfig();
    return config.projectAliases?.[projectPath] || [];
  } catch (error) {
    return [];
  }
}

/**
 * Устанавливает алиасы для проекта
 * @param {string} projectPath - Путь к проекту
 * @param {Array} aliases - Массив алиасов
 * @returns {Promise<Object>} { success, error? }
 */
async function setProjectAliases(projectPath, aliases) {
  try {
    const config = await loadConfig();
    
    if (!config.projectAliases) {
      config.projectAliases = {};
    }
    
    config.projectAliases[projectPath] = aliases;
    
    await saveConfig(config);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Получает заметки проекта
 * @param {string} projectPath - Путь к проекту
 * @returns {Promise<string>} Заметки
 */
async function getProjectNotes(projectPath) {
  try {
    const config = await loadConfig();
    return config.projectNotes?.[projectPath] || '';
  } catch (error) {
    return '';
  }
}

/**
 * Устанавливает заметки для проекта
 * @param {string} projectPath - Путь к проекту
 * @param {string} notes - Заметки
 * @returns {Promise<Object>} { success, error? }
 */
async function setProjectNotes(projectPath, notes) {
  try {
    const config = await loadConfig();
    
    if (!config.projectNotes) {
      config.projectNotes = {};
    }
    
    config.projectNotes[projectPath] = notes;
    
    await saveConfig(config);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Получает все метаданные проекта (tags, aliases, notes)
 * @param {string} projectPath - Путь к проекту
 * @returns {Promise<Object>} { tags, aliases, notes }
 */
async function getProjectMetadata(projectPath) {
  try {
    const config = await loadConfig();
    return {
      tags: config.projectTags?.[projectPath] || [],
      aliases: config.projectAliases?.[projectPath] || [],
      notes: config.projectNotes?.[projectPath] || ''
    };
  } catch (error) {
    return { tags: [], aliases: [], notes: '' };
  }
}

/**
 * Получает метаданные всех проектов
 * @returns {Promise<Object>} Map { projectPath: metadata }
 */
async function getAllProjectsMetadata() {
  try {
    const config = await loadConfig();
    const allPaths = new Set([
      ...Object.keys(config.projectTags || {}),
      ...Object.keys(config.projectAliases || {}),
      ...Object.keys(config.projectNotes || {})
    ]);
    
    const metadataMap = {};
    for (const path of allPaths) {
      metadataMap[path] = {
        tags: config.projectTags?.[path] || [],
        aliases: config.projectAliases?.[path] || [],
        notes: config.projectNotes?.[path] || ''
      };
    }
    
    return metadataMap;
  } catch (error) {
    return {};
  }
}

/**
 * Получает настройки терминала
 * @returns {Promise<Object>} { path, name, type }
 */
async function getTerminal() {
  try {
    const config = await loadConfig();
    return {
      path: config.terminalPath || null,
      name: config.terminalName || null,
      type: config.terminalType || null
    };
  } catch (error) {
    return { path: null, name: null, type: null };
  }
}

/**
 * Устанавливает настройки терминала
 * @param {string} terminalPath - Путь к терминалу
 * @param {string} terminalName - Название терминала
 * @param {string} terminalType - Тип терминала (bash, powershell, cmd)
 * @returns {Promise<Object>} { success, error? }
 */
async function setTerminal(terminalPath, terminalName, terminalType) {
  try {
    const config = await loadConfig();
    
    config.terminalPath = terminalPath;
    config.terminalName = terminalName;
    config.terminalType = terminalType;
    
    await saveConfig(config);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Получает настройку менеджера Node.js
 * @returns {Promise<string>} 'auto', 'nvm', 'volta', 'fnm'
 */
async function getNodeManager() {
  try {
    const config = await loadConfig();
    return config.nodeManager || 'auto';
  } catch (error) {
    return 'auto';
  }
}

/**
 * Устанавливает менеджер Node.js
 * @param {string} manager - 'auto', 'nvm', 'volta', 'fnm'
 * @returns {Promise<Object>} { success, error? }
 */
async function setNodeManager(manager) {
  try {
    const config = await loadConfig();
    config.nodeManager = manager;
    await saveConfig(config);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Получает версию Node.js для проекта
 * @param {string} projectName - Название проекта
 * @returns {Promise<string|null>} Версия или null
 */
async function getProjectNodeVersion(projectName) {
  try {
    const config = await loadConfig();
    if (!config.projects) {
      return null;
    }
    return config.projects[projectName]?.nodeVersion || null;
  } catch (error) {
    return null;
  }
}

/**
 * Устанавливает версию Node.js для проекта
 * @param {string} projectName - Название проекта
 * @param {string} version - Версия Node.js
 * @returns {Promise<Object>} { success, error? }
 */
async function setProjectNodeVersion(projectName, version) {
  try {
    const config = await loadConfig();
    
    if (!config.projects) {
      config.projects = {};
    }
    
    if (!config.projects[projectName]) {
      config.projects[projectName] = {};
    }
    
    config.projects[projectName].nodeVersion = version;
    
    await saveConfig(config);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Получить настройку проверки Git Remote Status
 */
async function getGitRemoteCheckEnabled() {
  try {
    const config = await loadConfig();
    // По умолчанию ВЫКЛЮЧЕНО чтобы не запрашивать пароли
    return config.enableGitRemoteCheck === true;
  } catch (error) {
    return false;
  }
}

/**
 * Установить настройку проверки Git Remote Status
 */
async function setGitRemoteCheckEnabled(enabled) {
  try {
    const config = await loadConfig();
    config.enableGitRemoteCheck = enabled;
    await saveConfig(config);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Получить список отслеживаемых веток для проекта
 * @param {string} projectPath - Путь к проекту
 * @returns {Promise<string[]>} Массив названий веток
 */
async function getTrackedBranches(projectPath) {
  try {
    const config = await loadConfig();
    if (!config.trackedBranches || !config.trackedBranches[projectPath]) {
      // По умолчанию отслеживаем dev и main
      return ['dev', 'main'];
    }
    return config.trackedBranches[projectPath];
  } catch (error) {
    return ['dev', 'main'];
  }
}

/**
 * Установить список отслеживаемых веток для проекта
 * @param {string} projectPath - Путь к проекту
 * @param {string[]} branches - Массив названий веток
 * @returns {Promise<Object>} { success, error? }
 */
async function setTrackedBranches(projectPath, branches) {
  try {
    const config = await loadConfig();
    
    if (!config.trackedBranches) {
      config.trackedBranches = {};
    }
    
    config.trackedBranches[projectPath] = branches;
    await saveConfig(config);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Получить глобальный список отслеживаемых веток (по умолчанию для новых проектов)
 * @returns {Promise<string[]>} Массив названий веток
 */
async function getDefaultTrackedBranches() {
  try {
    const config = await loadConfig();
    return config.defaultTrackedBranches || ['dev', 'main'];
  } catch (error) {
    return ['dev', 'main'];
  }
}

/**
 * Установить глобальный список отслеживаемых веток
 * @param {string[]} branches - Массив названий веток
 * @returns {Promise<Object>} { success, error? }
 */
async function setDefaultTrackedBranches(branches) {
  try {
    const config = await loadConfig();
    config.defaultTrackedBranches = branches;
    await saveConfig(config);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  loadConfig,
  saveConfig,
  validateConfig,
  getConfigPath,
  getConfigDir,
  addTagToProject,
  removeTagFromProject,
  getAvailableTags,
  createTag,
  getProjectTags,
  getProjectAliases,
  setProjectAliases,
  getProjectNotes,
  setProjectNotes,
  getProjectMetadata,
  getAllProjectsMetadata,
  getTerminal,
  setTerminal,
  getNodeManager,
  setNodeManager,
  getProjectNodeVersion,
  setProjectNodeVersion,
  getGitRemoteCheckEnabled,
  setGitRemoteCheckEnabled,
  getTrackedBranches,
  setTrackedBranches,
  getDefaultTrackedBranches,
  setDefaultTrackedBranches
};

