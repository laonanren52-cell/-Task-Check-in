import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from './Button'
import { isTauriRuntime } from '../../desktop/environment/platform'
export function PwaUpdate(){const{needRefresh:[needRefresh,setNeedRefresh],updateServiceWorker}=useRegisterSW();if(!needRefresh||isTauriRuntime())return null;return <aside className="update-prompt"><div><b>发现 Web/PWA 新版本</b><span>当前编辑内容保存完成后，可由你决定何时刷新。</span></div><Button onClick={()=>updateServiceWorker(true)}>立即更新</Button><button className="icon-button" onClick={()=>setNeedRefresh(false)} aria-label="稍后更新">×</button></aside>}
