import { useAppInfo } from './useAppInfo'

export function DesktopVersion() {
  const info = useAppInfo()
  return <small>Version {info?.version ?? __APP_VERSION__}{info?.development ? ' · DEV' : ''}</small>
}
