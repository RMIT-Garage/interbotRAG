import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border bg-background py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-50/35">
        <Icon className="h-6 w-6 text-brand-500 dark:text-brand-900" />
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        {description && <p className="text-zinc-500 text-sm mt-1">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
