import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
interface ToastItem{id:number;message:string;kind:'success'|'error'}
const Context=createContext<(message:string,kind?:ToastItem['kind'])=>void>(()=>undefined)
export function ToastProvider({children}:{children:ReactNode}){const[items,setItems]=useState<ToastItem[]>([]);const notify=useCallback((message:string,kind:ToastItem['kind']='success')=>{const id=Date.now();setItems(x=>[...x,{id,message,kind}]);setTimeout(()=>setItems(x=>x.filter(item=>item.id!==id)),2600)},[]);return <Context.Provider value={notify}>{children}<div className="toast-region" aria-live="polite">{items.map(item=><div className={`toast toast--${item.kind}`} key={item.id}>{item.message}</div>)}</div></Context.Provider>}
export const useToast=()=>useContext(Context)
