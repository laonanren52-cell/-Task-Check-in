import { appDataDir } from '@tauri-apps/api/path'
import { Stronghold } from '@tauri-apps/plugin-stronghold'
import { isTauriRuntime } from '../../../desktop/environment/platform'

const PREFIX = 'summerflow.ai.secret.'
const encoder = new TextEncoder()
const decoder = new TextDecoder()
const desktopPassword = 'summerflow-ai-local-vault-v1'
let desktopStore: Promise<Awaited<ReturnType<typeof getDesktopStore>>> | undefined

async function getDesktopStore() {
  const vaultPath = `${await appDataDir()}summerflow-ai.hold`
  const stronghold = await Stronghold.load(vaultPath, desktopPassword)
  let client
  try { client = await stronghold.loadClient('summerflow-ai') } catch { client = await stronghold.createClient('summerflow-ai') }
  return { stronghold, store: client.getStore() }
}
async function storeForDesktop() { return desktopStore ??= getDesktopStore() }

export async function setAISecret(id: string, value: string) {
  if (isTauriRuntime()) { const { stronghold, store } = await storeForDesktop(); await store.insert(id, Array.from(encoder.encode(value))); await stronghold.save(); return }
  localStorage.setItem(`${PREFIX}${id}`, value)
}
export async function getAISecret(id: string): Promise<string | undefined> {
  if (isTauriRuntime()) { const { store } = await storeForDesktop(); const value = await store.get(id); return value ? decoder.decode(value) : undefined }
  return localStorage.getItem(`${PREFIX}${id}`) ?? undefined
}
export async function clearAISecrets(id?: string) {
  if (isTauriRuntime()) { if (!id) return; const { stronghold, store } = await storeForDesktop(); await store.remove(id); await stronghold.save(); return }
  if (id) localStorage.removeItem(`${PREFIX}${id}`)
  else Object.keys(localStorage).filter(key => key.startsWith(PREFIX)).forEach(key => localStorage.removeItem(key))
}
