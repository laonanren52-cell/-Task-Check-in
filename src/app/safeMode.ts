export function isSafeMode(search = window.location.search): boolean {
  return new URLSearchParams(search).get('safeMode') === '1'
}

export function safeModeTodayUrl(): string {
  return `${window.location.origin}/today?safeMode=1`
}
