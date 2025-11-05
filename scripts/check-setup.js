#!/usr/bin/env node

/**
 * Скрипт для проверки окружения и настройки проекта
 * Проверяет наличие всех необходимых инструментов и зависимостей
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка окружения для Project Hub...\n');

let hasErrors = false;

// Проверка Node.js
function checkNode() {
  try {
    const version = execSync('node --version', { encoding: 'utf-8' }).trim();
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    
    if (majorVersion >= 18) {
      console.log('✅ Node.js:', version);
    } else {
      console.log('⚠️  Node.js:', version, '(рекомендуется >= 18.0.0)');
    }
  } catch (error) {
    console.log('❌ Node.js не установлен');
    hasErrors = true;
  }
}

// Проверка npm
function checkNpm() {
  try {
    const version = execSync('npm --version', { encoding: 'utf-8' }).trim();
    console.log('✅ npm:', version);
  } catch (error) {
    console.log('❌ npm не установлен');
    hasErrors = true;
  }
}

// Проверка Git
function checkGit() {
  try {
    const version = execSync('git --version', { encoding: 'utf-8' }).trim();
    console.log('✅ Git:', version);
  } catch (error) {
    console.log('⚠️  Git не установлен (необходим для git операций в приложении)');
  }
}

// Проверка зависимостей
function checkDependencies() {
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  
  if (fs.existsSync(nodeModulesPath)) {
    console.log('✅ node_modules существует');
    
    const packageJson = require('../package.json');
    const requiredDeps = [
      'electron',
      'react',
      'react-dom',
      'vite',
      'tailwindcss'
    ];
    
    const missingDeps = requiredDeps.filter(dep => {
      const depPath = path.join(nodeModulesPath, dep);
      return !fs.existsSync(depPath);
    });
    
    if (missingDeps.length > 0) {
      console.log('⚠️  Отсутствуют зависимости:', missingDeps.join(', '));
      console.log('   Запустите: npm install');
    } else {
      console.log('✅ Все основные зависимости установлены');
    }
  } else {
    console.log('❌ node_modules не найден');
    console.log('   Запустите: npm install');
    hasErrors = true;
  }
}

// Проверка структуры проекта
function checkProjectStructure() {
  const requiredPaths = [
    'src/main/index.js',
    'src/preload/index.js',
    'src/renderer/index.html',
    'src/renderer/src/App.jsx',
    'package.json',
    'vite.config.js'
  ];
  
  const missingPaths = requiredPaths.filter(p => {
    const fullPath = path.join(__dirname, '..', p);
    return !fs.existsSync(fullPath);
  });
  
  if (missingPaths.length === 0) {
    console.log('✅ Структура проекта корректна');
  } else {
    console.log('❌ Отсутствуют файлы:', missingPaths.join(', '));
    hasErrors = true;
  }
}

// Проверка конфигурационных файлов
function checkConfigFiles() {
  const configFiles = [
    'package.json',
    'vite.config.js',
    'tailwind.config.js',
    'electron-builder.yml'
  ];
  
  configFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} существует`);
    } else {
      console.log(`❌ ${file} отсутствует`);
      hasErrors = true;
    }
  });
}

// Проверка иконки
function checkIcon() {
  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  if (fs.existsSync(iconPath)) {
    console.log('✅ icon.ico найдена');
  } else {
    console.log('⚠️  icon.ico не найдена (необходима для сборки installer)');
    console.log('   Создайте иконку 256x256px и сохраните как build/icon.ico');
  }
}

// Запуск всех проверок
console.log('📦 Проверка инструментов:\n');
checkNode();
checkNpm();
checkGit();

console.log('\n📁 Проверка проекта:\n');
checkDependencies();
checkProjectStructure();

console.log('\n⚙️  Проверка конфигурации:\n');
checkConfigFiles();

console.log('\n🎨 Проверка ресурсов:\n');
checkIcon();

// Итоги
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('❌ Обнаружены проблемы. Исправьте их перед запуском.');
  process.exit(1);
} else {
  console.log('✅ Все проверки пройдены! Проект готов к работе.');
  console.log('\nДля запуска:');
  console.log('  1. npm run dev    (в первом терминале)');
  console.log('  2. npm start      (во втором терминале)');
}
console.log('='.repeat(60) + '\n');

