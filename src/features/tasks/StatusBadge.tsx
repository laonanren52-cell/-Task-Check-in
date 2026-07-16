import type { Priority, TaskStatus } from '../../types'

export const statusLabels: Record<TaskStatus, string> = {
  todo: '待开始',
  doing: '进行中',
  done: '已完成',
  missed: '未完成',
  cancelled: '已取消',
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`badge badge--${status}`}>{statusLabels[status]}</span>
}

export function PriorityIndicator({ priority }: { priority: Priority }) {
  return <span className={`priority priority--${priority.toLowerCase()}`}>{priority}</span>
}
