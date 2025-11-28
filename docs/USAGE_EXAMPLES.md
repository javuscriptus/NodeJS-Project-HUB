# 📘 Примеры использования новых утилит

> Практические примеры использования улучшений, добавленных в проект

---

## 1. Error Boundary

### Использование в React компонентах

```jsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      {/* Все ваши компоненты */}
      <MainContent />
    </ErrorBoundary>
  );
}
```

### Вложенные Error Boundaries

```jsx
<ErrorBoundary>
  <Header />
  
  <ErrorBoundary>
    {/* Изолированная область - если здесь ошибка, Header продолжит работать */}
    <ProjectList />
  </ErrorBoundary>
  
  <ErrorBoundary>
    <DetailPanel />
  </ErrorBoundary>
  
  <Footer />
</ErrorBoundary>
```

---

## 2. Logger (Renderer Process)

### Базовое использование

```javascript
import { logger } from './utils/logger';

function MyComponent() {
  const handleClick = async () => {
    logger.info('Button clicked');
    
    try {
      const data = await fetchData();
      logger.debug('Data received:', data);
    } catch (error) {
      logger.error('Failed to fetch data:', error);
    }
  };
}
```

### Группировка логов

```javascript
import { logger } from './utils/logger';

async function scanAllProjects() {
  logger.group('Project Scanning', () => {
    logger.info('Starting scan...');
    logger.debug('Root path:', rootPath);
    logger.info('Found projects:', projects.length);
  });
}
```

### Замер времени

```javascript
import { logger } from './utils/logger';

async function heavyOperation() {
  logger.time('Heavy Operation');
  
  // Ваш код
  await doSomething();
  
  logger.timeEnd('Heavy Operation'); // Выведет: [TIME] Heavy Operation: 1234ms
}
```

### Перенос существующего кода

**Было:**
```javascript
console.log('Update available:', info);
console.error('Error loading config:', error);
```

**Стало:**
```javascript
import { logger } from './utils/logger';

logger.info('Update available:', info);
logger.error('Error loading config:', error);
```

---

## 3. ErrorHandler (Main Process)

### Оборачивание асинхронной функции

```javascript
const { ErrorHandler } = require('./utils/errorHandler');

async function scanProjects(rootPath) {
  return await ErrorHandler.wrap(
    async () => {
      // Ваша логика
      const projects = await scanFolder(rootPath);
      return { success: true, projects };
    },
    'scanProjects' // Контекст для логирования
  );
}

// Использование
const result = await scanProjects('C:\\Dev');
if (!result.success) {
  // Обработать ошибку
  console.error(result.error);
}
```

### Обработка синхронной функции

```javascript
const { ErrorHandler } = require('./utils/errorHandler');

function parseConfig(configPath) {
  return ErrorHandler.wrapSync(
    () => {
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    },
    'parseConfig'
  );
}
```

### Прямая обработка ошибки

```javascript
const { ErrorHandler } = require('./utils/errorHandler');

try {
  // Ваш код
  await someOperation();
} catch (error) {
  // Логирует ошибку и возвращает стандартный формат
  return ErrorHandler.handle(error, 'someOperation');
}
```

### Логирование без обработки ошибок

```javascript
const { ErrorHandler } = require('./utils/errorHandler');

// Информационное сообщение
ErrorHandler.info('Application started', { version: '2.0.0' });

// Предупреждение
ErrorHandler.warn('Config not found, using defaults');

// Отладка
ErrorHandler.debug('State:', currentState);
```

---

## 4. CommandExecutor (Main Process)

### Выполнение Git команд

```javascript
const { CommandExecutor } = require('./utils/commandExecutor');

async function gitPull(projectPath) {
  try {
    const { stdout, stderr } = await CommandExecutor.executeGit(
      projectPath,
      ['pull', 'origin', 'main']
    );
    
    return { success: true, message: stdout };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
```

### Выполнение npm/yarn/pnpm команд

```javascript
const { CommandExecutor } = require('./utils/commandExecutor');

async function installDependencies(projectPath, packageManager = 'npm') {
  try {
    const { stdout } = await CommandExecutor.executePackageManager(
      projectPath,
      packageManager, // 'npm', 'yarn', или 'pnpm'
      ['install']
    );
    
    return { success: true, output: stdout };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Запуск скрипта в терминале

```javascript
const { CommandExecutor } = require('./utils/commandExecutor');

function runScriptInTerminal(projectPath, script, terminal) {
  // Запускает процесс в отдельном окне терминала
  const child = CommandExecutor.spawnInTerminal(
    terminal,           // Путь к терминалу (bash.exe, powershell.exe, cmd.exe)
    `npm run ${script}`, // Команда для выполнения
    projectPath         // Рабочая директория
  );
  
  // Процесс отсоединен и работает независимо
  child.unref();
}
```

### Проверка доступности команды

```javascript
const { CommandExecutor } = require('./utils/commandExecutor');

async function checkGitAvailable() {
  const hasGit = await CommandExecutor.isCommandAvailable('git');
  
  if (!hasGit) {
    throw new Error('Git не установлен в системе');
  }
}
```

### Получение версии команды

```javascript
const { CommandExecutor } = require('./utils/commandExecutor');

async function getNodeVersion() {
  const version = await CommandExecutor.getCommandVersion('node', ['--version']);
  console.log('Node.js version:', version); // v18.16.0
}
```

### Рефакторинг существующего кода

**Было (небезопасно):**
```javascript
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

async function gitStatus(projectPath) {
  const { stdout } = await execPromise(
    `git -C "${projectPath}" status --porcelain`,
    { timeout: 5000 }
  );
  return stdout;
}
```

**Стало (безопасно):**
```javascript
const { CommandExecutor } = require('./utils/commandExecutor');

async function gitStatus(projectPath) {
  const { stdout } = await CommandExecutor.executeGit(
    projectPath,
    ['status', '--porcelain'],
    { timeout: 5000 }
  );
  return stdout;
}
```

---

## 5. Константы

### Использование в компонентах

```javascript
import { SCRIPT_ICONS, PACKAGE_MANAGER_ICONS, GIT_STATUS, TIMEOUTS } from '../constants';

function ProjectRow({ project }) {
  // Иконки для скриптов
  const icon = SCRIPT_ICONS['browser:dev']; // 🌐
  
  // Иконки для package managers
  const pmIcon = PACKAGE_MANAGER_ICONS[project.packageManager]; // 📦
  
  // Статусы Git
  if (project.gitStatus === GIT_STATUS.UP_TO_DATE) {
    // ...
  }
  
  // Таймауты
  setTimeout(() => {
    // ...
  }, TIMEOUTS.NOTIFICATION_AUTO_HIDE);
}
```

### Добавление новых констант

```javascript
// src/renderer/src/constants/index.js

// Добавить новую категорию
export const UI_COLORS = {
  PRIMARY: 'bg-blue-600',
  SECONDARY: 'bg-gray-600',
  SUCCESS: 'bg-green-600',
  ERROR: 'bg-red-600'
};

// Добавить в существующую категорию
export const SCRIPT_ICONS = {
  // ...существующие
  'deploy': '🚀',
  'migrate': '📦'
};
```

### Рефакторинг существующего кода

**Было:**
```javascript
const scriptIcons = {
  'browser:dev': '🌐',
  'mobile:dev': '📱',
  // ...
};

const packageManagerIcons = {
  'npm': '📦',
  'yarn': '🧶',
  // ...
};
```

**Стало:**
```javascript
import { SCRIPT_ICONS, PACKAGE_MANAGER_ICONS } from '../constants';

// Используем импортированные константы
const icon = SCRIPT_ICONS[scriptName];
const pmIcon = PACKAGE_MANAGER_ICONS[packageManager];
```

---

## 6. Комплексный пример: Обработка Git операции

### Старый код (небезопасный, без обработки ошибок)

```javascript
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

async function pullFromOrigin(projectPath) {
  try {
    const { stdout, stderr } = await execPromise(
      `git -C "${projectPath}" pull origin dev`,
      { timeout: 30000 }
    );
    
    const output = stdout + stderr;
    
    if (output.toLowerCase().includes('error:')) {
      return { success: false, message: output };
    }
    
    return { success: true, message: output };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
```

### Новый код (безопасный, с логированием и обработкой ошибок)

```javascript
const { CommandExecutor } = require('./utils/commandExecutor');
const { ErrorHandler } = require('./utils/errorHandler');
const { TIMEOUTS, GIT_STATUS } = require('../renderer/src/constants');

async function pullFromOrigin(projectPath) {
  return await ErrorHandler.wrap(
    async () => {
      ErrorHandler.info('Starting git pull', { projectPath });
      
      // Безопасное выполнение команды
      const { stdout, stderr } = await CommandExecutor.executeGit(
        projectPath,
        ['pull', 'origin', 'dev'],
        { timeout: TIMEOUTS.GIT_OPERATION }
      );
      
      const output = stdout + stderr;
      
      // Проверка на ошибки
      if (output.toLowerCase().includes('error:') || 
          output.toLowerCase().includes('fatal:')) {
        ErrorHandler.warn('Git pull completed with errors', { output });
        return {
          success: false,
          message: ErrorHandler.sanitizeErrorMessage(output)
        };
      }
      
      ErrorHandler.info('Git pull completed successfully');
      return {
        success: true,
        message: output.trim() || 'Already up to date.'
      };
    },
    'pullFromOrigin'
  );
}
```

**Преимущества нового подхода:**
- ✅ Защита от command injection
- ✅ Автоматическая валидация путей
- ✅ Централизованное логирование
- ✅ Стандартизированная обработка ошибок
- ✅ Использование констант вместо magic numbers
- ✅ Санитизация сообщений об ошибках

---

## 7. Полный пример компонента с всеми улучшениями

```jsx
import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { TIMEOUTS, SCRIPT_ICONS } from '../constants';

function ProjectRow({ project, onRunScript }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    logger.debug('ProjectRow mounted', { project: project.name });
    
    return () => {
      logger.debug('ProjectRow unmounted', { project: project.name });
    };
  }, [project.name]);

  const handleRunScript = async (script) => {
    logger.time(`Run ${script} in ${project.name}`);
    setLoading(true);
    
    try {
      logger.info('Running script', { project: project.name, script });
      await onRunScript(project, script);
      logger.info('Script completed successfully');
    } catch (error) {
      logger.error('Script failed', { 
        project: project.name, 
        script, 
        error: error.message 
      });
    } finally {
      setLoading(false);
      logger.timeEnd(`Run ${script} in ${project.name}`);
      
      // Используем константу для таймаута
      setTimeout(() => {
        setLoading(false);
      }, TIMEOUTS.DEBOUNCE_SEARCH);
    }
  };

  return (
    <div>
      <h3>{project.name}</h3>
      
      {Object.keys(SCRIPT_ICONS).map(script => (
        project.scripts[script] && (
          <button
            key={script}
            onClick={() => handleRunScript(script)}
            disabled={loading}
            title={script}
          >
            {loading ? '⏳' : SCRIPT_ICONS[script]}
          </button>
        )
      ))}
    </div>
  );
}

export default ProjectRow;
```

---

## 📚 Дополнительные ресурсы

- [IMPROVEMENTS.md](IMPROVEMENTS.md) - Полный список улучшений
- [IMPROVEMENTS_RU.md](IMPROVEMENTS_RU.md) - Русская версия
- [SUGGESTED_IMPROVEMENTS.md](../SUGGESTED_IMPROVEMENTS.md) - Краткий план действий

---

**Последнее обновление:** 2024  
**Статус:** ✅ Готово к использованию
