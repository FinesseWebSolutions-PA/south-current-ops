import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  CATEGORY_LABEL,
  CLIENT_TYPE_LABEL,
  STATUS_LABEL,
  type ClientType,
  type JobStatus,
  type ServiceCategory,
} from '@/lib/types'

const STATUS_CLASS: Record<JobStatus, string> = {
  lead: 'bg-muted text-muted-foreground',
  scheduled: 'bg-primary/18 text-foreground',
  'in-progress': 'bg-accent text-accent-foreground',
  completed: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400',
  invoiced: 'bg-secondary text-secondary-foreground',
}

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <Badge className={cn('border-transparent', STATUS_CLASS[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}

export function CategoryBadge({ category }: { category: ServiceCategory }) {
  return (
    <Badge variant="outline" className="font-normal">
      {CATEGORY_LABEL[category]}
    </Badge>
  )
}

export function ClientTypeBadge({ type }: { type: ClientType }) {
  return (
    <Badge variant="outline" className="font-normal">
      {CLIENT_TYPE_LABEL[type]}
    </Badge>
  )
}
