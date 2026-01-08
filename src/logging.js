const fs = require('fs')
const path = require('path')

const ensureDir = (dir) => fs.promises.mkdir(dir, { recursive: true })
const MAX_LOG_BYTES = 2 * 1024 * 1024

const REDACT_KEYS = new Set([
  'token',
  'password',
  'clientKey',
  'clientCert',
  'sasl',
])

const redactValue = (value) => {
  if (!value || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item))
  }

  const clean = {}
  Object.entries(value).forEach(([key, val]) => {
    if (REDACT_KEYS.has(key)) {
      clean[key] = '[redacted]'
      return
    }
    clean[key] = redactValue(val)
  })
  return clean
}

const safeStringify = (value) => {
  try {
    return JSON.stringify(redactValue(value))
  } catch {
    return '"[unserializable]"'
  }
}

const formatError = (error) => {
  if (!error) {
    return { message: 'Unknown error' }
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  if (typeof error === 'string') {
    return { message: error }
  }

  return redactValue(error)
}

const createFileLogger = (logDir, fileName = 'main.log') => {
  const filePath = path.join(logDir, fileName)

  const rotateIfNeeded = async () => {
    try {
      const stats = await fs.promises.stat(filePath)
      if (stats.size < MAX_LOG_BYTES) {
        return
      }
      const rotatedPath = `${filePath}.1`
      await fs.promises.rm(rotatedPath, { force: true })
      await fs.promises.rename(filePath, rotatedPath)
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        // Ignore rotation errors
      }
    }
  }

  const write = async (entry) => {
    try {
      await ensureDir(logDir)
      await rotateIfNeeded()
      await fs.promises.appendFile(filePath, `${entry}\n`, 'utf8')
    } catch {
      // Avoid crashing on logging failures
    }
  }

  const log = (level, event, meta = {}) => {
    const payload = {
      level,
      event,
      time: new Date().toISOString(),
      meta: redactValue(meta),
    }
    const serialized = JSON.stringify(payload)
    const capped = serialized.length > 8000
      ? `${serialized.slice(0, 8000)}...`
      : serialized
    write(capped)
  }

  const logError = (event, error) => {
    log('error', event, formatError(error))
  }

  return {
    log,
    logError,
    filePath,
  }
}

module.exports = {
  createFileLogger,
}
