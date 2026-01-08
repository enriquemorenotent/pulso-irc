import { DEFAULT_GLOBALS, DEFAULT_PROFILE, DEFAULT_PROFILES } from './constants.js'

const PROFILES_KEY = 'pulso_profiles_v1'
const ACTIVE_PROFILE_KEY = 'pulso_profiles_active_v1'
const DEFAULTS_KEY = 'pulso_defaults_v1'

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const sanitizeSettings = (settings) => {
  const safe = {}

  const setIfDefined = (key, value) => {
    if (value !== undefined) {
      safe[key] = value
    }
  }

  setIfDefined('connId', settings.connId)
  setIfDefined('host', settings.host)
  setIfDefined('port', settings.port)
  setIfDefined('nick', settings.nick)
  setIfDefined('username', settings.username)
  setIfDefined('realname', settings.realname)
  setIfDefined('saslMethod', settings.saslMethod)
  setIfDefined('saslPassword', settings.saslPassword)
  setIfDefined('autoJoin', settings.autoJoin)

  if (settings.receiveRaw !== undefined) {
    safe.receiveRaw = Boolean(settings.receiveRaw)
  }

  return safe
}

const sanitizeDefaults = (defaults) => {
  const safe = {}

  const setIfDefined = (key, value) => {
    if (value !== undefined) {
      safe[key] = value
    }
  }

  setIfDefined('nick', defaults.nick)
  setIfDefined('username', defaults.username)
  setIfDefined('realname', defaults.realname)
  setIfDefined('port', defaults.port)
  if (defaults.showMediaPreviews !== undefined) {
    safe.showMediaPreviews = Boolean(defaults.showMediaPreviews)
  }

  return safe
}

const createProfile = (overrides = {}) => ({
  id: overrides.id || createId(),
  name: overrides.name || DEFAULT_PROFILE.name,
  settings: {
    ...DEFAULT_PROFILE.settings,
    ...sanitizeSettings(overrides.settings || {}),
  },
})

const createDefaultProfiles = () => {
  const templates = Array.isArray(DEFAULT_PROFILES) && DEFAULT_PROFILES.length
    ? DEFAULT_PROFILES
    : [DEFAULT_PROFILE]

  return templates.map((template) => createProfile(template))
}

const loadProfiles = () => {
  if (typeof window === 'undefined') {
    const profiles = createDefaultProfiles()
    return { profiles, activeProfileId: profiles[0].id }
  }

  try {
    const stored = window.localStorage.getItem(PROFILES_KEY)
    const activeId = window.localStorage.getItem(ACTIVE_PROFILE_KEY)

    if (!stored) {
      const profiles = createDefaultProfiles()
      return { profiles, activeProfileId: profiles[0].id }
    }

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const profiles = createDefaultProfiles()
      return { profiles, activeProfileId: profiles[0].id }
    }

    const profiles = parsed.map((profile) => createProfile(profile))
    const activeProfileId = profiles.find((profile) => profile.id === activeId)
      ? activeId
      : profiles[0].id

    return { profiles, activeProfileId }
  } catch {
    const profiles = createDefaultProfiles()
    return { profiles, activeProfileId: profiles[0].id }
  }
}

const loadDefaults = () => {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_GLOBALS }
  }

  try {
    const stored = window.localStorage.getItem(DEFAULTS_KEY)
    if (!stored) {
      return { ...DEFAULT_GLOBALS }
    }

    const parsed = JSON.parse(stored)
    return {
      ...DEFAULT_GLOBALS,
      ...sanitizeDefaults(parsed || {}),
    }
  } catch {
    return { ...DEFAULT_GLOBALS }
  }
}

const persistDefaults = (defaults) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(DEFAULTS_KEY, JSON.stringify(sanitizeDefaults(defaults)))
}

const persistProfiles = (profiles, activeProfileId) => {
  if (typeof window === 'undefined') {
    return
  }

  const safeProfiles = profiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    settings: sanitizeSettings(profile.settings),
  }))

  window.localStorage.setItem(PROFILES_KEY, JSON.stringify(safeProfiles))
  window.localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId)
}

export { createProfile, loadDefaults, loadProfiles, persistDefaults, persistProfiles }
