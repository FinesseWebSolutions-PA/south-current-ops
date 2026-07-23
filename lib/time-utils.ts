import type { TimeEntry } from './types'

/** Worked milliseconds for an entry, using `now` for still-running entries. */
export function entryDurationMs(entry: TimeEntry, now: number = Date.now()) {
  const start = new Date(entry.clockIn).getTime()
  const end = entry.clockOut ? new Date(entry.clockOut).getTime() : now
  const gross = Math.max(0, end - start)
  const activeBreak = entry.breakStartedAt
    ? Math.max(0, now - new Date(entry.breakStartedAt).getTime())
    : 0
  return Math.max(0, gross - entry.breakMinutes * 60_000 - activeBreak)
}

export function activeBreakDurationMs(
  entry: TimeEntry,
  now: number = Date.now(),
) {
  if (!entry.breakStartedAt) return 0
  return Math.max(0, now - new Date(entry.breakStartedAt).getTime())
}

/** Worked hours (decimal) for an entry. */
export function entryHours(entry: TimeEntry, now: number = Date.now()) {
  return entryDurationMs(entry, now) / 3_600_000
}

/** Format decimal hours like "8.5h". */
export function formatHours(hours: number) {
  return `${hours.toFixed(1)}h`
}

/** Format a duration in ms as H:MM:SS (used for the live timer). */
export function formatStopwatch(ms: number) {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDate(input: string) {
  const d = input.length <= 10 ? new Date(`${input}T00:00:00`) : new Date(input)
  return d.toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateLong(input: string) {
  const d = input.length <= 10 ? new Date(`${input}T00:00:00`) : new Date(input)
  return d.toLocaleDateString('en-CA', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Monday 00:00 of the week containing `ref`, plus the exclusive end (next Monday). */
export function getWeekRange(ref: Date = new Date()) {
  const d = new Date(ref)
  d.setHours(0, 0, 0, 0)
  const day = (d.getDay() + 6) % 7 // 0 = Monday
  const start = new Date(d)
  start.setDate(d.getDate() - day)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return { start, end }
}

/** The 7 Date objects (Mon..Sun) for the week containing `ref`. */
export function getWeekDays(ref: Date = new Date()) {
  const { start } = getWeekRange(ref)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(amount)
}
