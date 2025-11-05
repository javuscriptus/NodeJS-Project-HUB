const fs = require('fs').promises;
const path = require('path');
const { getCurrentBranch, getGitStatus } = require('./gitOperations');
const { detectPackageManager } = require('./packageManagerDetector');

// Кэш проектов в памяти
const projectCache = new Map();

/**
 * Сканирует корневую папку на наличие проектов
 * Проект = папка с package.json + .git
 */
async function scanFolder(rootPath) {
  try {
    const startTime = Date.now();
    const projects = [];
    
    // Получить список всех подпапок (1 уровень)
    const entries = await fs.readdir(rootPath, { withFileTypes: true });
    const folders = entries.filter(entry => entry.isDirectory());
    
    // Сканируем папки параллельно
    const scanPromises = folders.map(folder => 
      scanProject(path.join(rootPath, folder.name))
    );
    
    const results = await Promise.all(scanPromises);
    
    // Фильтруем null значения (не проекты)
    results.forEach(project => {
      if (project) projects.push(project);
    });
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      projects,
      scannedFolders: folders.length,
      duration
    };
  } catch (error) {
    return {
      success: false,
      projects: [],
      error: error.message
    };
  }
}

/**
 * Сканирует отдельный проект
 */
async function scanProject(projectPath) {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const gitPath = path.join(projectPath, '.git');
    
    // Проверяем наличие package.json и .git
    const [hasPackage, hasGit] = await Promise.all([
      fileExists(packageJsonPath),
      fileExists(gitPath)
    ]);
    
    if (!hasPackage || !hasGit) {
      return null;
    }
    
    // Проверяем кэш
    const cached = await checkCache(projectPath, packageJsonPath);
    if (cached) {
      return cached;
    }
    
    // Полное сканирование
    const packageData = await parsePackageJson(packageJsonPath);
    if (!packageData) {
      return null;
    }
    
    const [branch, packageManager, gitStatus] = await Promise.all([
      getCurrentBranch(projectPath),
      detectPackageManager(projectPath),
      getGitStatus(projectPath)
    ]);
    const scripts = checkScripts(packageData.scripts || {});
    
    const project = {
      name: path.basename(projectPath), // Всегда берем название из папки
      version: packageData.version || '0.0.0',
      path: projectPath,
      branch: branch || 'unknown',
      packageManager: packageManager,
      gitStatus: gitStatus,
      scripts
    };
    
    // Сохраняем в кэш
    const stats = await fs.stat(packageJsonPath);
    projectCache.set(projectPath, {
      project,
      mtime: stats.mtimeMs,
      cachedAt: Date.now()
    });
    
    return project;
  } catch (error) {
    return null;
  }
}

/**
 * Проверяет кэш проекта
 */
async function checkCache(projectPath, packageJsonPath) {
  if (!projectCache.has(projectPath)) {
    return null;
  }
  
  try {
    const stats = await fs.stat(packageJsonPath);
    const cached = projectCache.get(projectPath);
    
    // Если mtime не изменился, вернуть из кэша
    if (stats.mtimeMs === cached.mtime) {
      return cached.project;
    }
    
    // mtime изменился, нужно пересканировать
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Проверяет существование файла/папки
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Парсит package.json
 */
async function parsePackageJson(packageJsonPath) {
  try {
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const data = JSON.parse(content);
    
    return {
      name: data.name,
      version: data.version,
      scripts: data.scripts || {}
    };
  } catch (error) {
    // Невалидный JSON или ошибка чтения
    return null;
  }
}

/**
 * Проверяет наличие нужных npm скриптов
 */
function checkScripts(scripts) {
  const targetScripts = ['browser:dev', 'mobile:dev', 'browser:build', 'mobile:build'];
  const result = {};
  
  targetScripts.forEach(scriptName => {
    if (scripts[scriptName]) {
      result[scriptName] = true;
    }
  });
  
  return result;
}

/**
 * Очищает кэш (для тестирования)
 */
function clearCache() {
  projectCache.clear();
}

module.exports = {
  scanFolder,
  parsePackageJson,
  checkScripts,
  clearCache
};

