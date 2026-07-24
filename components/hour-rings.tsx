'use client'

import { cn } from '@/lib/utils'

function HourRing({
  hours,
  maxHours,
  label,
  tone = 'regular',
  size = 'default',
}: {
  hours: number
  maxHours: number
  label: string
  tone?: 'regular' | 'overtime'
  size?: 'default' | 'compact'
}) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(hours / maxHours, 0), 1)
  const offset = circumference * (1 - progress)

  return (
    <div className="grid justify-items-center gap-1">
      <div
        className={cn(
          'relative',
          size === 'compact' ? 'size-20' : 'size-24',
        )}
      >
        <svg
          className="size-full -rotate-90"
          viewBox="0 0 80 80"
          role="img"
          aria-label={`${label}: ${hours.toFixed(1)} of ${maxHours} hours`}
        >
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            className="text-muted"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              'transition-[stroke-dashoffset] duration-500',
              tone === 'overtime' ? 'text-chart-4' : 'text-primary',
            )}
          />
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <span
            className={cn(
              'font-mono font-semibold leading-none',
              size === 'compact' ? 'text-base' : 'text-lg',
            )}
          >
            {hours.toFixed(1)}
          </span>
          <span className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">
            hours
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-[10px] text-muted-foreground">
          {tone === 'overtime' ? `Next ${maxHours}h` : `${maxHours}h target`}
        </p>
      </div>
    </div>
  )
}

export function WeeklyHoursRings({
  hours,
  compact = false,
  className,
}: {
  hours: number
  compact?: boolean
  className?: string
}) {
  const regularHours = Math.min(hours, 40)
  const overtimeHours = Math.max(0, hours - 40)

  return (
    <div
      className={cn('flex items-start justify-center gap-3', className)}
      aria-label={`${hours.toFixed(1)} total hours this week`}
    >
      <HourRing
        hours={regularHours}
        maxHours={40}
        label="Regular"
        size={compact ? 'compact' : 'default'}
      />
      <HourRing
        hours={overtimeHours}
        maxHours={10}
        label="Overtime"
        tone="overtime"
        size={compact ? 'compact' : 'default'}
      />
    </div>
  )
}
