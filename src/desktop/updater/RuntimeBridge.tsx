import { useEffect } from 'react'
import { useAppStore } from '../../stores/appStore'
import { isTauriRuntime } from '../environment/platform'
import { useUpdateStore } from './store'

export function DesktopRuntimeBridge() {
  const autoCheckUpdates = useAppStore(state => state.settings.autoCheckUpdates)
  const initialize = useUpdateStore(state => state.initialize)
  const checkForUpdates = useUpdateStore(state => state.checkForUpdates)
  useEffect(() => { void initialize() }, [initialize])
  useEffect(() => {
    if (!isTauriRuntime() || import.meta.env.DEV || !autoCheckUpdates) return
    const timer = window.setTimeout(() => void checkForUpdates(false), 5_000)
    return () => window.clearTimeout(timer)
  }, [autoCheckUpdates, checkForUpdates])
  return null
}
