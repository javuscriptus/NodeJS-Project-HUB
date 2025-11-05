const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Project Hub in development mode...\n');

// Запуск Vite dev server
console.log('📦 Starting Vite dev server...');
const vite = spawn('npm', ['run', 'dev'], {
  shell: true,
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..')
});

// Ждём пока Vite запустится (3 секунды)
setTimeout(() => {
  console.log('\n⚡ Starting Electron...\n');
  const electron = spawn('npm', ['start'], {
    shell: true,
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });

  electron.on('close', (code) => {
    console.log('Electron closed, stopping Vite...');
    vite.kill();
    process.exit(code);
  });
}, 3000);

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\nStopping...');
  vite.kill();
  process.exit(0);
});
