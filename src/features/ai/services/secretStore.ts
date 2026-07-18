import { appLocalDataDir } from '@tauri-apps/api/path'
import { Stronghold } from '@tauri-apps/plugin-stronghold'
import { isTauriRuntime } from '../../../desktop/environment/platform'
import { logInfo } from '../../../desktop/logging/logger'

const PREFIX = 'summerflow.ai.secret.'
const encoder = new TextEncoder()
const decoder = new TextDecoder()
const desktopPassword = 'summerflow-ai-local-vault-v1'
let desktopStore: Promise<Awaited<ReturnType<typeof getDesktopStore>>> | undefined
const SECRET_STORE_TIMEOUT_MS = 10_000
const debugSecretStore = (event: string, details: Record<string, unknown>) => {
  if (import.meta.env.DEV) console.debug(`[SummerFlow AI secret-store] ${event}`, details)
  if (isTauriRuntime()) void logInfo(`ai.secret-store.${event}`, {
    id: typeof details.id === 'string' ? details.id : undefined,
    runtime: typeof details.runtime === 'string' ? details.runtime : undefined,
    found: typeof details.found === 'boolean' ? details.found : undefined,
    error: typeof details.error === 'string' ? details.error.slice(0, 300) : undefined,
  })
}

async function getDesktopStore() {
  // Keep the vault beside Stronghold's Argon2 salt. Mixing appDataDir and
  // appLocalDataDir makes an existing vault impossible to decrypt on Windows.
  const vaultPath = `${await appLocalDataDir()}summerflow-ai.hold`
  const stronghold = await Stronghold.load(vaultPath, desktopPassword)
  let client
  try { client = await stronghold.loadClient('summerflow-ai') } catch { client = await stronghold.createClient('summerflow-ai') }
  return { stronghold, store: client.getStore() }
}
async function storeForDesktop() { return desktopStore ??= getDesktopStore() }
async function withinSecretStoreTimeout<T>(operation: Promise<T>, stage: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => { timeout = setTimeout(() => reject(new Error(`AI 安全密钥${stage}超时，请在设置中重新保存该 AI 配置后重试。`)), SECRET_STORE_TIMEOUT_MS) }),
    ])
  } finally { if (timeout) clearTimeout(timeout) }
}

export async function setAISecret(id: string, value: string) {
  debugSecretStore('write-start', { id, runtime:isTauriRuntime() ? 'tauri' : 'web' })
  if (isTauriRuntime()) {
    try {
      const { stronghold, store } = await withinSecretStoreTimeout(storeForDesktop(), '仓库加载')
      await withinSecretStoreTimeout(store.insert(id, Array.from(encoder.encode(value))), '写入')
      await withinSecretStoreTimeout(stronghold.save(), '保存')
      debugSecretStore('write-complete', { id })
      return
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      debugSecretStore('write-failed', { id, error:message })
      throw new Error(`无法保存 AI API Key：${message}`)
    }
  }
  localStorage.setItem(`${PREFIX}${id}`, value)
  debugSecretStore('write-complete', { id })
}
export async function getAISecret(id: string): Promise<string | undefined> {
  debugSecretStore('read-start', { id, runtime:isTauriRuntime() ? 'tauri' : 'web' })
  if (isTauriRuntime()) {
    try {
      const { store } = await withinSecretStoreTimeout(storeForDesktop(), '仓库加载'); const value = await withinSecretStoreTimeout(store.get(id), '读取')
      debugSecretStore('read-complete', { id, found:Boolean(value) })
      return value ? decoder.decode(value) : undefined
    } catch (error) {
      debugSecretStore('read-failed', { id, error:error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }
  const value = localStorage.getItem(`${PREFIX}${id}`) ?? undefined
  debugSecretStore('read-complete', { id, found:Boolean(value) })
  return value
}
export async function clearAISecrets(id?: string) {
  if (isTauriRuntime()) { if (!id) return; const { stronghold, store } = await storeForDesktop(); await store.remove(id); await stronghold.save(); return }
  if (id) localStorage.removeItem(`${PREFIX}${id}`)
  else Object.keys(localStorage).filter(key => key.startsWith(PREFIX)).forEach(key => localStorage.removeItem(key))
}
