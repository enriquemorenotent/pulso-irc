import { useEffect, useMemo, useState } from 'react'
import {
  createProfile,
  loadDefaults,
  loadProfiles,
  persistDefaults,
  persistProfiles,
} from '../irc/storage.js'
import { resolveValue } from '../irc/resolve.js'

const useProfiles = ({ onEffectiveNickChange, initialProfilesState, initialDefaults } = {}) => {
  const [{ profiles, activeProfileId }, setProfilesState] = useState(() => (
    initialProfilesState || loadProfiles()
  ))
  const [defaults, setDefaults] = useState(() => initialDefaults || loadDefaults())

  const activeProfile = useMemo(() => (
    profiles.find((profile) => profile.id === activeProfileId) || profiles[0]
  ), [profiles, activeProfileId])

  const settings = activeProfile.settings

  useEffect(() => {
    persistProfiles(profiles, activeProfileId)
  }, [profiles, activeProfileId])

  useEffect(() => {
    persistDefaults(defaults)
  }, [defaults])

  const notifyNick = (nextSettings, nextDefaults) => {
    if (!onEffectiveNickChange) {
      return
    }

    const nextNick = resolveValue(nextSettings.nick, nextDefaults.nick)
    onEffectiveNickChange(nextNick)
  }

  const effectiveSettings = useMemo(() => {
    const host = settings.host || ''
    const connId = resolveValue(settings.connId, host || activeProfile.id)

    return {
      host,
      connId,
      port: resolveValue(settings.port, defaults.port),
      nick: resolveValue(settings.nick, defaults.nick),
      username: resolveValue(settings.username, defaults.username),
      realname: resolveValue(settings.realname, defaults.realname),
      saslMethod: settings.saslMethod || '',
      saslPassword: settings.saslPassword || '',
      autoJoin: settings.autoJoin || '',
      receiveRaw: Boolean(settings.receiveRaw),
    }
  }, [settings, defaults, activeProfile.id])

  const updateDefaults = (updates) => {
    const nextDefaults = { ...defaults, ...updates }
    setDefaults(nextDefaults)
    notifyNick(settings, nextDefaults)
    return nextDefaults
  }

  const updateProfile = (updates) => {
    const nextSettings = { ...settings, ...updates }

    setProfilesState((prev) => ({
      ...prev,
      profiles: prev.profiles.map((profile) => (
        profile.id === activeProfileId
          ? { ...profile, settings: { ...profile.settings, ...updates } }
          : profile
      )),
    }))

    if (Object.prototype.hasOwnProperty.call(updates, 'nick')) {
      notifyNick(nextSettings, defaults)
    }

    return nextSettings
  }

  const updateProfileById = (profileId, updates) => {
    if (!profileId) {
      return null
    }

    let nextSettings = null

    setProfilesState((prev) => {
      const target = prev.profiles.find((profile) => profile.id === profileId)
      if (!target) {
        return prev
      }

      nextSettings = { ...target.settings, ...updates }

      return {
        ...prev,
        profiles: prev.profiles.map((profile) => (
          profile.id === profileId
            ? { ...profile, settings: { ...profile.settings, ...updates } }
            : profile
        )),
      }
    })

    if (profileId === activeProfileId && Object.prototype.hasOwnProperty.call(updates, 'nick')) {
      notifyNick({ ...settings, ...updates }, defaults)
    }

    return nextSettings
  }

  const updateProfileName = (name) => {
    setProfilesState((prev) => ({
      ...prev,
      profiles: prev.profiles.map((profile) => (
        profile.id === activeProfileId
          ? { ...profile, name }
          : profile
      )),
    }))
  }

  const addProfile = () => {
    const nextProfile = createProfile({
      name: `Profile ${profiles.length + 1}`,
    })

    setProfilesState((prev) => ({
      profiles: [...prev.profiles, nextProfile],
      activeProfileId: nextProfile.id,
    }))

    return nextProfile
  }

  const switchProfile = (profileId) => {
    if (profileId === activeProfileId) {
      return activeProfile
    }

    const nextProfile = profiles.find((profile) => profile.id === profileId) || profiles[0]

    setProfilesState((prev) => ({
      ...prev,
      activeProfileId: profileId,
    }))

    return nextProfile
  }

  return {
    profiles,
    activeProfileId,
    activeProfile,
    defaults,
    settings,
    effectiveSettings,
    updateDefaults,
    updateProfile,
    updateProfileById,
    updateProfileName,
    addProfile,
    switchProfile,
  }
}

export { useProfiles }
