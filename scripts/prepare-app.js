const fs = require('fs');
const path = require('path');

const exists = (target) => fs.existsSync(target);

const ensureDir = (dir) => fs.promises.mkdir(dir, { recursive: true });

const copyDir = async (from, to) => {
  await ensureDir(to);
  await fs.promises.cp(from, to, { recursive: true });
};

const copyFile = async (from, to) => {
  await ensureDir(path.dirname(to));
  await fs.promises.copyFile(from, to);
};

const main = async () => {
  const root = path.join(__dirname, '..');
  const appDir = path.join(root, 'app');
  const frontendDist = path.join(root, 'renderer', 'dist');
  const mainSource = path.join(root, 'src', 'main.js');
  const mainModulesSource = path.join(root, 'src', 'main');
  const preloadSource = path.join(root, 'src', 'preload.js');
  const gatewaySource = path.join(root, 'src', 'gateway');

  if (!exists(frontendDist)) {
    throw new Error('Missing frontend build output. Run "npm --prefix ./renderer run build" first.');
  }

  if (!exists(mainSource)) {
    throw new Error('Missing Electron main source file.');
  }

  if (!exists(preloadSource)) {
    throw new Error('Missing Electron preload source file.');
  }

  if (!exists(gatewaySource)) {
    throw new Error('Missing gateway source directory.');
  }

  await fs.promises.rm(appDir, { recursive: true, force: true });
  await ensureDir(appDir);

  await copyFile(mainSource, path.join(appDir, 'main.js'));
  if (exists(mainModulesSource)) {
    await copyDir(mainModulesSource, path.join(appDir, 'main'));
  }
  await copyFile(preloadSource, path.join(appDir, 'preload.js'));
  await copyDir(gatewaySource, path.join(appDir, 'gateway'));
  await copyDir(frontendDist, path.join(appDir, 'renderer'));
};

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
