const { spawn } = require('child_process');
const http = require('http');
const https = require('https');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const frontendDir = path.join(rootDir, 'renderer');
const devServerUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:4317';

const waitForServer = (url, timeoutMs = 20000) =>
  new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const target = new URL(url);
    const client = target.protocol === 'https:' ? https : http;

    const attempt = () => {
      const req = client.get(url, (res) => {
        res.resume();
        resolve();
      });

      req.on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error(`Dev server did not start within ${timeoutMs}ms.`));
          return;
        }

        setTimeout(attempt, 300);
      });
    };

    attempt();
  });

const start = async () => {
  const vite = spawn(
    'npm',
    ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4317'],
    {
      cwd: frontendDir,
      stdio: 'inherit',
      shell: true,
    }
  );

  try {
    await waitForServer(devServerUrl);
  } catch (error) {
    vite.kill();
    throw error;
  }

  const electron = spawn('npx', ['electron', 'src/main.js'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      ELECTRON_RENDERER_URL: devServerUrl,
    },
  });

  const shutdown = () => {
    vite.kill();
    electron.kill();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  electron.on('exit', (code) => {
    vite.kill();
    process.exit(code ?? 0);
  });
};

start().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
