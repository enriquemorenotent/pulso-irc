const BACKUP_VERSION = 1;
const STORAGE_PREFIX = 'pulso_';

const canUseStorage = () =>
  typeof window !== 'undefined' && Boolean(window.localStorage);

const getStorageKeys = () => {
  if (!canUseStorage()) {
    return [];
  }

  return Object.keys(window.localStorage).filter((key) =>
    key.startsWith(STORAGE_PREFIX)
  );
};

const createBackup = () => {
  const storage = {};
  const keys = getStorageKeys();

  keys.forEach((key) => {
    storage[key] = window.localStorage.getItem(key);
  });

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    storage,
  };
};

const downloadBackup = (backup) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `pulso-backup-${timestamp}.json`;
  const payload = JSON.stringify(backup, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);

  return fileName;
};

const exportBackup = () => {
  if (!canUseStorage()) {
    return { ok: false, error: 'Storage is not available.' };
  }

  const backup = createBackup();
  const fileName = downloadBackup(backup);

  return { ok: true, fileName };
};

const parseBackup = (raw) => {
  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'Invalid JSON file.' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Invalid backup format.' };
  }

  if (!parsed.storage || typeof parsed.storage !== 'object') {
    return { ok: false, error: 'Backup file is missing data.' };
  }

  return {
    ok: true,
    backup: {
      version: parsed.version || BACKUP_VERSION,
      storage: parsed.storage || {},
    },
  };
};

const applyBackup = (backup) => {
  if (!canUseStorage()) {
    return { ok: false, error: 'Storage is not available.' };
  }

  if (!backup || typeof backup.storage !== 'object') {
    return { ok: false, error: 'Backup data is invalid.' };
  }

  const storage = backup.storage || {};
  const existingKeys = getStorageKeys();

  existingKeys.forEach((key) => {
    if (!(key in storage)) {
      window.localStorage.removeItem(key);
    }
  });

  Object.entries(storage).forEach(([key, value]) => {
    if (!key.startsWith(STORAGE_PREFIX)) {
      return;
    }

    if (value === null || value === undefined) {
      window.localStorage.removeItem(key);
      return;
    }

    const normalized = typeof value === 'string' ? value : JSON.stringify(value);
    window.localStorage.setItem(key, normalized);
  });

  return { ok: true };
};

export { exportBackup, parseBackup, applyBackup };
