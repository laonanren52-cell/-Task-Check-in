import { AlertTriangle, LoaderCircle, Orbit } from 'lucide-react'
export const LoadingState=()=> <div className="state"><LoaderCircle className="spin"/><strong>正在打开学习空间</strong><span>读取当前设备中的 IndexedDB 数据</span></div>
export const ErrorState=({message}:{message:string})=> <div className="state state--error"><AlertTriangle/><strong>数据读取失败</strong><span>{message}</span></div>
export const EmptyState=({title,description,action}:{title:string;description:string;action?:React.ReactNode})=> <div className="state"><Orbit/><strong>{title}</strong><span>{description}</span>{action}</div>
