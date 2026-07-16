import type { ReactNode } from 'react'
import { EmptyState } from '../../components/ui/States'
export function ChartContainer({title,question,empty,children,className=''}:{title:string;question:string;empty:boolean;children:ReactNode;className?:string}){return <section className={`chart-container ${className}`}><header><div><h2>{title}</h2><p>{question}</p></div></header>{empty?<EmptyState title="还没有足够的数据" description="开始记录真实任务后，这里会自动生成趋势。"/>:children}</section>}
