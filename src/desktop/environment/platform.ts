export type RuntimeEnvironment = 'browser' | 'pwa' | 'tauri'

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export function isPwaRuntime(): boolean {
  if (typeof window === 'undefined') return false
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true
}

export function getRuntimeEnvironment(): RuntimeEnvironment {
  if (isTauriRuntime()) return 'tauri'
  return isPwaRuntime() ? 'pwa' : 'browser'
}
