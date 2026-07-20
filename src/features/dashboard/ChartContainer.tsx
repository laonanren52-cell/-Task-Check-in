import type { ReactNode } from 'react'

type ChartContainerProps = { title: string; question: string; empty: boolean; children: ReactNode; className?: string; summary?: ReactNode; legend?: ReactNode }

export function ChartContainer({ title, question, empty, children, className = '', summary, legend }: ChartContainerProps) {
  return <section className={`chart-container chart-card ${className}`}>
    <ChartHeader title={title} subtitle={question} summary={summary} />
    {legend && <div className="chart-legend">{legend}</div>}
    {empty ? <ChartEmptyState /> : <div className="chart-frame">{children}</div>}
  </section>
}

export function ChartHeader({ title, subtitle, summary }: { title: string; subtitle: string; summary?: ReactNode }) {
  return <header className="chart-header"><div><h2>{title}</h2><p>{subtitle}</p></div>{summary && <div className="chart-summary">{summary}</div>}</header>
}

export function ChartLegend({ items }: { items: Array<{ label: string; color: string }> }) {
  return <>{items.map(item => <span key={item.label}><i style={{ background: item.color }} />{item.label}</span>)}</>
}

export function ChartAnnotation({ label, value }: { label: string; value: string }) {
  return <span className="chart-annotation"><small>{label}</small><b>{value}</b></span>
}

export function ChartEmptyState() {
  return <div className="chart-empty-state"><i /><div><b>数据会在这里形成轨迹</b><span>开始记录真实任务后，图表会自动变得完整。</span></div></div>
}
