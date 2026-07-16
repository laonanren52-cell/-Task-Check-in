import { useEffect, useState } from 'react'
import { getAppRuntimeInfo, type AppRuntimeInfo } from './appInfo'

export function useAppInfo(): AppRuntimeInfo | undefined {
  const [info, setInfo] = useState<AppRuntimeInfo>()
  useEffect(() => { void getAppRuntimeInfo().then(setInfo) }, [])
  return info
}
