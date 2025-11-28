const { CommandExecutor } = require('./utils/commandExecutor');

const GIT_TIMEOUT = 30000; // 30 секунд

/**
 * Получает название текущей ветки
 */
async function getCurrentBranch(projectPath) {
  try {
    const { stdout, stderr } = await CommandExecutor.executeGit(
      projectPath,
      ['branch', '--show-current'],
      { timeout: GIT_TIMEOUT }
    );
    
    if (stderr && !stdout) {
      return null;
    }
    
    return stdout.trim() || 'unknown';
  } catch (error) {
    // Не git репозиторий или другая ошибка
    return null;
  }
}

/**
 * Выполняет git pull origin dev
 */
async function pullFromOrigin(projectPath) {
  try {
    const { stdout, stderr } = await CommandExecutor.executeGit(
      projectPath,
      ['pull', 'origin', 'dev'],
      { timeout: GIT_TIMEOUT }
    );
    
    // Git pull может писать в stderr даже при успехе
    const output = stdout + stderr;
    
    // Проверяем на ошибки
    if (output.toLowerCase().includes('error:') || 
        output.toLowerCase().includes('fatal:') ||
        output.toLowerCase().includes('conflict')) {
      return {
        success: false,
        message: output.trim()
      };
    }
    
    return {
      success: true,
      message: output.trim() || 'Already up to date.'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Git pull failed'
    };
  }
}

/**
 * Проверяет, является ли папка git репозиторием
 */
async function isGitRepository(projectPath) {
  try {
    await CommandExecutor.executeGit(
      projectPath,
      ['rev-parse', '--git-dir'],
      { timeout: 5000 }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Получает git статус проекта (uncommitted changes)
 * @returns {Promise<{hasChanges: boolean, changesCount: number, staged: number, unstaged: number, untracked: number}>}
 */
async function getGitStatus(projectPath) {
  try {
    const { stdout } = await CommandExecutor.executeGit(
      projectPath,
      ['status', '--porcelain'],
      { timeout: 5000 }
    );
    
    // Парсим вывод git status --porcelain
    const lines = stdout.trim().split('\n').filter(line => line.length > 0);
    
    let staged = 0;
    let unstaged = 0;
    let untracked = 0;
    
    lines.forEach(line => {
      const statusCode = line.substring(0, 2);
      
      // Первый символ - staged changes (index)
      if (statusCode[0] !== ' ' && statusCode[0] !== '?') {
        staged++;
      }
      
      // Второй символ - unstaged changes (working tree)
      if (statusCode[1] !== ' ' && statusCode[1] !== '?') {
        unstaged++;
      }
      
      // ?? - untracked files
      if (statusCode === '??') {
        untracked++;
      }
    });
    
    const totalChanges = staged + unstaged + untracked;
    
    return {
      hasChanges: totalChanges > 0,
      changesCount: totalChanges,
      staged,
      unstaged,
      untracked
    };
  } catch (error) {
    // Если ошибка, считаем что изменений нет
    return {
      hasChanges: false,
      changesCount: 0,
      staged: 0,
      unstaged: 0,
      untracked: 0
    };
  }
}

/**
 * Проверяет remote статус ветки (сколько коммитов отстает от origin)
 * @param {string} projectPath - Путь к проекту
 * @param {string} branch - Название ветки для проверки
 * @returns {Promise<{status: 'up-to-date'|'behind'|'error', branch: string, commitsCount?: number, error?: string}>}
 */
async function checkRemoteStatus(projectPath, branch) {
  try {
    // Сначала делаем fetch (с timeout для случая отсутствия VPN)
    try {
      await CommandExecutor.executeGit(
        projectPath,
        ['fetch', 'origin', branch],
        { timeout: 10000 } // 10 секунд на fetch
      );
    } catch (fetchError) {
      // Если fetch не удался (нет VPN, нет интернета и т.д.)
      return {
        status: 'error',
        branch,
        error: 'Cannot connect to remote (VPN required?)'
      };
    }

    // Получаем локальный SHA
    const { stdout: localSha } = await CommandExecutor.executeGit(
      projectPath,
      ['rev-parse', branch],
      { timeout: 5000 }
    );

    // Получаем удаленный SHA
    const { stdout: remoteSha } = await CommandExecutor.executeGit(
      projectPath,
      ['rev-parse', `origin/${branch}`],
      { timeout: 5000 }
    );

    // Сравниваем SHA
    if (localSha.trim() === remoteSha.trim()) {
      return {
        status: 'up-to-date',
        branch
      };
    }

    // Если SHA разные, считаем количество коммитов позади
    const { stdout: commitsBehind } = await CommandExecutor.executeGit(
      projectPath,
      ['rev-list', '--count', `${branch}..origin/${branch}`],
      { timeout: 5000 }
    );

    return {
      status: 'behind',
      branch,
      commitsCount: parseInt(commitsBehind.trim(), 10)
    };
  } catch (error) {
    return {
      status: 'error',
      branch,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Получает список всех веток (локальных и удаленных)
 * @param {string} projectPath - Путь к проекту
 * @returns {Promise<string[]>} Массив названий веток
 */
async function getAllBranches(projectPath) {
  try {
    const { stdout } = await CommandExecutor.executeGit(
      projectPath,
      ['branch', '-a'],
      { timeout: 5000 }
    );

    const branches = stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Убираем * (текущая ветка)
        line = line.replace(/^\*\s+/, '');
        // Убираем remotes/origin/
        line = line.replace(/^remotes\/origin\//, '');
        // Убираем HEAD -> origin/xxx
        if (line.includes('HEAD ->')) {
          return null;
        }
        return line;
      })
      .filter(line => line !== null);

    // Убираем дубликаты
    return [...new Set(branches)];
  } catch (error) {
    return [];
  }
}

/**
 * Проверяет статус всех веток оканчивающихся на -main
 * @param {string} projectPath - Путь к проекту
 * @returns {Promise<Array<{branch: string, status: string, commitsCount?: number}>>}
 */
async function checkAllMainBranches(projectPath) {
  try {
    const allBranches = await getAllBranches(projectPath);
    const mainBranches = allBranches.filter(branch => branch.endsWith('-main'));

    const statuses = await Promise.all(
      mainBranches.map(async (branch) => {
        const result = await checkRemoteStatus(projectPath, branch);
        return {
          branch,
          status: result.status,
          commitsCount: result.commitsCount
        };
      })
    );

    return statuses;
  } catch (error) {
    return [];
  }
}

/**
 * Переключает ветку
 * @param {string} projectPath - Путь к проекту
 * @param {string} branch - Название ветки
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function switchBranch(projectPath, branch) {
  try {
    const { stdout, stderr } = await CommandExecutor.executeGit(
      projectPath,
      ['checkout', branch],
      { timeout: 10000 }
    );

    const output = stdout + stderr;

    // Проверяем на ошибки
    if (output.toLowerCase().includes('error:') || 
        output.toLowerCase().includes('fatal:')) {
      return {
        success: false,
        message: output.trim()
      };
    }

    return {
      success: true,
      message: `Switched to branch '${branch}'`
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to switch branch'
    };
  }
}

module.exports = {
  getCurrentBranch,
  pullFromOrigin,
  isGitRepository,
  getGitStatus,
  checkRemoteStatus,
  getAllBranches,
  checkAllMainBranches,
  switchBranch
};

