import { isTauriRuntime } from '../environment/platform'

type SafeLogDetails = Record<string, string | number | boolean | null | undefined>

function serialize(details?: SafeLogDetails): string {
  if (!details) return ''
  return ` ${JSON.stringify(details)}`
}

export async function logInfo(event: string, details?: SafeLogDetails): Promise<void> {
  if (!isTauriRuntime()) return
  const { info } = await import('@tauri-apps/plugin-log')
  await info(`[${event}]${serialize(details)}`)
}

export async function logWarning(event: string, details?: SafeLogDetails): Promise<void> {
  if (!isTauriRuntime()) return
  const { warn } = await import('@tauri-apps/plugin-log')
  await warn(`[${event}]${serialize(details)}`)
}

export async function logError(event: string, error: unknown, details?: SafeLogDetails): Promise<void> {
  if (!isTauriRuntime()) return
  const { error: writeError } = await import('@tauri-apps/plugin-log')
  const message = error instanceof Error ? error.message : String(error)
  await writeError(`[${event}]${serialize({ ...details, message: message.slice(0, 500) })}`)
}
