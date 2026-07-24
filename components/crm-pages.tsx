'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import {
  ArrowLeftRight,
  ArrowRight,
  Briefcase,
  Coffee,
  ClipboardCheck,
  CheckCircle2,
  Clock3,
  DollarSign,
  HardHat,
  Mail,
  MapPin,
  MapPinOff,
  Pause,
  Phone,
  Play,
  Plus,
  Search,
  Square,
  Users,
  Zap,
} from 'lucide-react'
import { WeeklyHoursRings } from '@/components/hour-rings'
import { PageHeader } from '@/components/page-header'
import { CategoryBadge, ClientTypeBadge, StatusBadge } from '@/components/status-badges'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useNow } from '@/hooks/use-now'
import { useStore } from '@/lib/store'
import {
  activeBreakDurationMs,
  entryDurationMs,
  entryHours,
  formatClock,
  formatCurrency,
  formatDate,
  formatHours,
  formatStopwatch,
  getWeekDays,
  getWeekRange,
  toDateKey,
} from '@/lib/time-utils'
import {
  CATEGORY_LABEL,
  CLIENT_TYPE_LABEL,
  STATUS_LABEL,
  type ClientType,
  type JobStatus,
  type ServiceCategory,
} from '@/lib/types'

const fieldClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/30'

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  icon: typeof Zap
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardAction>
          <div className="rounded-lg bg-primary/15 p-2 text-primary">
            <Icon className="size-4" />
          </div>
        </CardAction>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{detail}</CardContent>
    </Card>
  )
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
        {message}
      </TableCell>
    </TableRow>
  )
}

export function DashboardPage() {
  const { isAdmin } = useStore()
  return isAdmin ? <AdminDashboardPage /> : <EmployeeHomePage />
}

function AdminDashboardPage() {
  const { jobs, clients, employees, timeEntries } = useStore()
  const now = useNow(1000)
  const { start, end } = getWeekRange()
  const weekEntries = timeEntries.filter((entry) => {
    const date = new Date(`${entry.date}T00:00:00`)
    return date >= start && date < end
  })
  const weekHours = weekEntries.reduce((sum, entry) => sum + entryHours(entry, now), 0)
  const activeEntries = timeEntries.filter((entry) => !entry.clockOut)
  const pendingApprovals = timeEntries.filter(
    (entry) => entry.status === 'submitted',
  )
  const recentJobs = [...jobs]
    .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))
    .slice(0, 5)

  return (
    <>
      <PageHeader
        title="Operations dashboard"
        description="Electrical work, crews, customers, and labour at a glance."
      >
        <Button render={<Link href="/jobs" />}>
          View jobs <ArrowRight />
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Open jobs"
          value={String(jobs.filter((job) => !['completed', 'invoiced'].includes(job.status)).length)}
          detail={`${jobs.filter((job) => job.status === 'in-progress').length} currently in progress`}
          icon={Briefcase}
        />
        <MetricCard
          label="Customers"
          value={String(clients.length)}
          detail="Residential, commercial, and agricultural"
          icon={Users}
        />
        <MetricCard
          label="Crew active now"
          value={String(activeEntries.length)}
          detail={`${activeEntries.filter((entry) => entry.breakStartedAt).length} currently on break`}
          icon={Zap}
        />
        <MetricCard
          label="Time approvals"
          value={String(pendingApprovals.length)}
          detail={`${formatHours(weekHours)} recorded this week`}
          icon={Clock3}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming and active jobs</CardTitle>
            <CardDescription>Current field schedule across every service line.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="font-medium">{job.title}</div>
                      <div className="text-xs text-muted-foreground">{job.code}</div>
                    </TableCell>
                    <TableCell><StatusBadge status={job.status} /></TableCell>
                    <TableCell><CategoryBadge category={job.category} /></TableCell>
                    <TableCell>{formatDate(job.scheduledDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crew right now</CardTitle>
            <CardDescription>Live timer status without GPS tracking.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {activeEntries.length === 0 && (
              <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
                No employees are clocked in.
              </div>
            )}
            {activeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div
                  className={`size-2.5 rounded-full ${
                    entry.breakStartedAt ? 'bg-chart-4' : 'bg-accent'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {employees.find((employee) => employee.id === entry.employeeId)?.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {entry.breakStartedAt
                      ? 'On break'
                      : jobs.find((job) => job.id === entry.jobId)?.title}
                  </p>
                </div>
                <span className="font-mono text-xs">
                  {formatStopwatch(entryDurationMs(entry, now))}
                </span>
              </div>
            ))}
            <Button className="mt-2 w-full" variant="outline" render={<Link href="/time" />}>
              Review time entries
            </Button>
            <div className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
              <MapPinOff className="size-4 shrink-0 text-accent" />
              Timer status only. Employee location is never collected.
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function EmployeeHomePage() {
  const {
    currentUser,
    jobs,
    clients,
    timeEntries,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    switchJob,
    isPreviewMode,
  } = useStore()
  const [jobPickerOpen, setJobPickerOpen] = useState(false)
  const now = useNow(1000)
  const activeEntry = timeEntries.find(
    (entry) => entry.employeeId === currentUser.id && !entry.clockOut,
  )
  const assignedJobs = jobs.filter(
    (job) =>
      job.assignedTo.includes(currentUser.id) &&
      !['completed', 'invoiced'].includes(job.status),
  )
  const todayKey = toDateKey(new Date())
  const todayEntries = timeEntries.filter(
    (entry) => entry.employeeId === currentUser.id && entry.date === todayKey,
  )
  const todayHours = todayEntries.reduce(
    (total, entry) => total + entryHours(entry, now),
    0,
  )
  const activeJob = jobs.find((job) => job.id === activeEntry?.jobId)
  const { start: weekStart, end: weekEnd } = getWeekRange()
  const weekHours = timeEntries
    .filter((entry) => {
      if (entry.employeeId !== currentUser.id) return false
      const date = new Date(`${entry.date}T00:00:00`)
      return date >= weekStart && date < weekEnd
    })
    .reduce((total, entry) => total + entryHours(entry, now), 0)

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-CA', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Hi {currentUser.name.split(' ')[0]}, here’s your workday.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clock, current electrical job, breaks, and assigned work in one place.
          </p>
        </div>
        <WeeklyHoursRings hours={weekHours} compact className="sm:-mt-2" />
      </div>

      <Card className="overflow-visible ring-2 ring-primary/25">
        <CardContent className="p-0">
          {activeEntry ? (
            <div>
              <div
                className={`rounded-t-xl p-5 text-sidebar-foreground sm:p-7 ${
                  activeEntry.breakStartedAt ? 'bg-chart-4' : 'bg-sidebar'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full bg-primary" />
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                        {activeEntry.breakStartedAt ? 'Break in progress' : 'Clocked in'}
                      </p>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold">
                      {activeEntry.breakStartedAt ? 'Take your break' : activeJob?.title}
                    </h2>
                    <p className="mt-1 text-sm opacity-70">
                      {activeEntry.breakStartedAt
                        ? `${activeJob?.code} · ${activeJob?.title}`
                        : `${activeJob?.code} · ${CATEGORY_LABEL[activeJob?.category ?? 'electrical']} · ${
                            clients.find((client) => client.id === activeJob?.clientId)?.name
                          }`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider opacity-60">
                      {activeEntry.breakStartedAt ? 'Break time' : 'Worked'}
                    </p>
                    <p className="mt-1 font-mono text-3xl font-semibold sm:text-4xl">
                      {formatStopwatch(
                        activeEntry.breakStartedAt
                          ? activeBreakDurationMs(activeEntry, now)
                          : entryDurationMs(activeEntry, now),
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {activeEntry.breakStartedAt ? (
                    <Button
                      size="lg"
                      className="h-12"
                      disabled={isPreviewMode}
                      onClick={() => endBreak(activeEntry.id)}
                    >
                      <Play /> Resume work
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="secondary"
                      className="h-12"
                      disabled={isPreviewMode}
                      onClick={() => startBreak(activeEntry.id)}
                    >
                      <Coffee /> Start break
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-12"
                    disabled={Boolean(activeEntry.breakStartedAt) || isPreviewMode}
                    onClick={() => setJobPickerOpen(true)}
                  >
                    <ArrowLeftRight /> Change job
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="col-span-2 h-12 border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white sm:col-span-1"
                    disabled={isPreviewMode}
                    onClick={() => clockOut(activeEntry.id)}
                  >
                    <Square /> Clock out
                  </Button>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Work location
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {activeJob?.address || 'Address not entered'}
                    </p>
                    <p className="text-xs text-muted-foreground">{activeJob?.city}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Scope
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm">
                      {activeJob?.description || 'No scope notes entered.'}
                    </p>
                  </div>
                </div>
                {activeEntry.breakStartedAt && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Resume work before switching jobs.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 sm:p-7">
              <div className="mx-auto max-w-xl text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Clock3 className="size-7" />
                </div>
                <h2 className="mt-4 text-xl font-semibold">What are you working on?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose an assigned electrical job and start your timer.
                </p>
                <Button
                  size="lg"
                  className="mt-4 h-12"
                  disabled={!assignedJobs.length || isPreviewMode}
                  onClick={() => setJobPickerOpen(true)}
                >
                  <Search /> Choose a job
                </Button>
              </div>
              {assignedJobs.length ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {assignedJobs.slice(0, 4).map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      disabled={isPreviewMode}
                      onClick={() => clockIn(currentUser.id, job.id)}
                      className="group rounded-xl border p-4 text-left transition hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:bg-transparent"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{job.code}</p>
                          <p className="mt-1 font-semibold">{job.title}</p>
                        </div>
                        <div className="rounded-lg bg-primary p-2 text-primary-foreground transition group-hover:scale-105">
                          <Play className="size-4" />
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {clients.find((client) => client.id === job.clientId)?.name} · {job.city}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed p-6 text-center">
                  <p className="font-medium">No jobs assigned</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ask a manager to assign your next job.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Worked today"
          value={formatHours(todayHours)}
          detail={`${todayEntries.length} job ${todayEntries.length === 1 ? 'entry' : 'entries'}`}
          icon={Clock3}
        />
        <MetricCard
          label="Assigned jobs"
          value={String(assignedJobs.length)}
          detail="Open work available to you"
          icon={Briefcase}
        />
        <MetricCard
          label="Awaiting approval"
          value={String(
            timeEntries.filter(
              (entry) =>
                entry.employeeId === currentUser.id && entry.status === 'submitted',
            ).length,
          )}
          detail="Submitted time entries"
          icon={CheckCircle2}
        />
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl border bg-card p-4">
        <MapPinOff className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <p className="font-medium">Your location stays private</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The app records the job and time you select. It does not collect GPS,
            geofencing, routes, or background location.
          </p>
        </div>
      </div>

      <ElectricalJobPicker
        open={jobPickerOpen}
        onOpenChange={setJobPickerOpen}
        activeEntryId={activeEntry?.id ?? null}
        currentJobId={activeEntry?.jobId ?? null}
        onBreak={Boolean(activeEntry?.breakStartedAt)}
      />
    </div>
  )
}

function ElectricalJobPicker({
  open,
  onOpenChange,
  activeEntryId,
  currentJobId,
  onBreak,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeEntryId: string | null
  currentJobId: string | null
  onBreak: boolean
}) {
  const {
    jobs,
    clients,
    currentUser,
    clockIn,
    switchJob,
    isPreviewMode,
  } = useStore()
  const [query, setQuery] = useState('')
  const assignedJobs = jobs.filter(
    (job) =>
      job.assignedTo.includes(currentUser.id) &&
      !['completed', 'invoiced'].includes(job.status),
  )
  const search = query.trim().toLowerCase()
  const matches = assignedJobs.filter((job) => {
    if (!search) return true
    const client = clients.find((item) => item.id === job.clientId)
    return [
      job.code,
      job.title,
      job.address,
      job.city,
      job.description,
      client?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search)
  })

  function selectJob(jobId: string) {
    if (isPreviewMode || onBreak || jobId === currentJobId) return
    if (activeEntryId) {
      switchJob(activeEntryId, jobId)
    } else {
      clockIn(currentUser.id, jobId)
    }
    setQuery('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>{activeEntryId ? 'Change electrical job' : 'Choose your job'}</DialogTitle>
          <DialogDescription>
            Assigned work appears first. Search by job number, customer, address, or scope.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search assigned jobs"
            className="h-11 pl-9"
          />
        </div>
        <div className="grid max-h-[55vh] gap-2 overflow-y-auto pr-1">
          {!matches.length && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No assigned jobs match your search.
            </div>
          )}
          {matches.map((job) => {
            const client = clients.find((item) => item.id === job.clientId)
            const current = job.id === currentJobId
            return (
              <button
                key={job.id}
                type="button"
                disabled={current || onBreak || isPreviewMode}
                onClick={() => selectJob(job.id)}
                className="rounded-xl border p-4 text-left transition hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-primary">{job.code}</span>
                      <CategoryBadge category={job.category} />
                      {current && <Badge variant="outline">Current job</Badge>}
                    </div>
                    <p className="mt-2 font-semibold">{job.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{client?.name}</p>
                  </div>
                  {!current && <Play className="mt-1 size-5 shrink-0 text-primary" />}
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  <span>{[job.address, job.city].filter(Boolean).join(', ')}</span>
                </div>
              </button>
            )
          })}
        </div>
        {onBreak && (
          <p className="text-xs text-muted-foreground">
            Resume work before changing jobs.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function ClientsPage() {
  const { clients, addClient, isAdmin } = useStore()
  const [showForm, setShowForm] = useState(false)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    addClient({
      name: String(data.get('name')),
      contact: String(data.get('contact')),
      type: String(data.get('type')) as ClientType,
      email: String(data.get('email')),
      phone: String(data.get('phone')),
      address: String(data.get('address')),
      city: String(data.get('city')),
      notes: String(data.get('notes')),
    })
    event.currentTarget.reset()
    setShowForm(false)
  }

  if (!isAdmin) return <AccessRestricted />

  return (
    <>
      <PageHeader title="Clients" description="Customer records and electrical service history.">
        <Button onClick={() => setShowForm((value) => !value)}>
          <Plus /> New client
        </Button>
      </PageHeader>

      {showForm && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>Add client</CardTitle>
            <CardDescription>Create a residential, commercial, or agricultural account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Company or household" name="name" required />
              <Field label="Primary contact" name="contact" required />
              <label className="grid gap-1.5 text-sm font-medium">
                Client type
                <select className={fieldClass} name="type" defaultValue="commercial">
                  {Object.entries(CLIENT_TYPE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <Field label="Email" name="email" type="email" />
              <Field label="Phone" name="phone" />
              <Field label="City" name="city" />
              <Field label="Address" name="address" className="lg:col-span-2" />
              <label className="grid gap-1.5 text-sm font-medium sm:col-span-2 lg:col-span-3">
                Notes
                <Textarea name="notes" />
              </label>
              <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit">Save client</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 && <EmptyRow colSpan={4} message="No clients yet." />}
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-xs text-muted-foreground">{client.email}</div>
                  </TableCell>
                  <TableCell><ClientTypeBadge type={client.type} /></TableCell>
                  <TableCell>
                    <div>{client.contact}</div>
                    <div className="text-xs text-muted-foreground">{client.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div>{client.city}</div>
                    <div className="text-xs text-muted-foreground">{client.address}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

export function EmployeesPage() {
  const { employees, jobs, timeEntries, isAdmin } = useStore()
  const [search, setSearch] = useState('')
  const now = useNow(1000)
  const { start, end } = getWeekRange()
  const query = search.trim().toLowerCase()
  const visibleEmployees = employees.filter((employee) =>
    [employee.name, employee.title, employee.email, employee.phone]
      .join(' ')
      .toLowerCase()
      .includes(query),
  )

  if (!isAdmin) return <AccessRestricted />

  return (
    <>
      <PageHeader
        title="Employees"
        description="Crew profiles, weekly hours, overtime, assignments, and live work status."
      />

      <div className="relative mb-5 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search employees"
          className="h-11 pl-9"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {!visibleEmployees.length && (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground xl:col-span-2">
            No employees match your search.
          </div>
        )}
        {visibleEmployees.map((employee) => {
          const weekEntries = timeEntries.filter((entry) => {
            if (entry.employeeId !== employee.id) return false
            const date = new Date(`${entry.date}T00:00:00`)
            return date >= start && date < end
          })
          const hours = weekEntries.reduce(
            (total, entry) => total + entryHours(entry, now),
            0,
          )
          const activeEntry = timeEntries.find(
            (entry) => entry.employeeId === employee.id && !entry.clockOut,
          )
          const activeJob = jobs.find((job) => job.id === activeEntry?.jobId)
          const assignedJobs = jobs.filter(
            (job) =>
              job.assignedTo.includes(employee.id) &&
              !['completed', 'invoiced'].includes(job.status),
          )
          const submitted = weekEntries.filter(
            (entry) => entry.status === 'submitted',
          ).length

          return (
            <Card key={employee.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-12">
                        <AvatarFallback className="bg-primary/15 font-semibold text-primary">
                          {employee.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-lg font-semibold">
                            {employee.name}
                          </h2>
                          <Badge variant="outline" className="capitalize">
                            {employee.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{employee.title}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="size-4 shrink-0" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="size-4 shrink-0" />
                        <span>{employee.phone || 'No phone entered'}</span>
                      </div>
                    </div>

                    <div
                      className={`mt-4 rounded-lg border p-3 ${
                        activeEntry
                          ? activeEntry.breakStartedAt
                            ? 'border-chart-4/40 bg-chart-4/10'
                            : 'border-primary/30 bg-primary/5'
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2.5 rounded-full ${
                            activeEntry
                              ? activeEntry.breakStartedAt
                                ? 'bg-chart-4'
                                : 'bg-primary'
                              : 'bg-muted-foreground/40'
                          }`}
                        />
                        <p className="text-xs font-semibold uppercase tracking-wide">
                          {activeEntry
                            ? activeEntry.breakStartedAt
                              ? 'On break'
                              : 'Working now'
                            : 'Clocked out'}
                        </p>
                      </div>
                      <p className="mt-2 truncate text-sm font-medium">
                        {activeJob
                          ? `${activeJob.code} — ${activeJob.title}`
                          : 'No active electrical job'}
                      </p>
                    </div>
                  </div>

                  <WeeklyHoursRings hours={hours} compact className="shrink-0" />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-4 text-center">
                  <div>
                    <p className="text-lg font-semibold">{assignedJobs.length}</p>
                    <p className="text-[11px] text-muted-foreground">Assigned jobs</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{weekEntries.length}</p>
                    <p className="text-[11px] text-muted-foreground">Time entries</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{submitted}</p>
                    <p className="text-[11px] text-muted-foreground">Needs review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl border bg-card p-4">
        <HardHat className="mt-0.5 size-5 shrink-0 text-primary" />
        <div>
          <p className="font-medium">How the hour circles work</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The regular circle fills from 0 to 40 hours each week. Once an
            employee passes 40 hours, the overtime circle begins filling in a
            10-hour band while always showing the exact overtime total.
          </p>
        </div>
      </div>
    </>
  )
}

export function JobsPage() {
  const {
    jobs,
    clients,
    employees,
    currentUser,
    timeEntries,
    addJob,
    clockIn,
    switchJob,
    isAdmin,
    isPreviewMode,
  } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [jobSearch, setJobSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all')
  const visibleJobs = isAdmin
    ? jobs
    : jobs.filter((job) => job.assignedTo.includes(currentUser.id))
  const activeEntry = timeEntries.find(
    (entry) => entry.employeeId === currentUser.id && !entry.clockOut,
  )
  const query = jobSearch.trim().toLowerCase()
  const filteredJobs = visibleJobs.filter((job) => {
    if (statusFilter !== 'all' && job.status !== statusFilter) return false
    if (!query) return true
    const client = clients.find((item) => item.id === job.clientId)
    return [
      job.code,
      job.title,
      job.address,
      job.city,
      job.description,
      client?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query)
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    addJob({
      title: String(data.get('title')),
      clientId: String(data.get('clientId')),
      status: String(data.get('status')) as JobStatus,
      category: String(data.get('category')) as ServiceCategory,
      address: String(data.get('address')),
      city: String(data.get('city')),
      assignedTo: data.get('assignedTo') ? [String(data.get('assignedTo'))] : [],
      scheduledDate: String(data.get('scheduledDate')),
      estimatedHours: Number(data.get('estimatedHours')) || 0,
      description: String(data.get('description')),
    })
    event.currentTarget.reset()
    setShowForm(false)
  }

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Jobs' : 'My jobs'}
        description={
          isAdmin
            ? 'Plan, assign, and follow electrical work from lead to invoice.'
            : 'The jobs currently assigned to you, with the details needed in the field.'
        }
      >
        {isAdmin && (
          <Button onClick={() => setShowForm((value) => !value)}>
            <Plus /> New job
          </Button>
        )}
      </PageHeader>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={jobSearch}
            onChange={(event) => setJobSearch(event.target.value)}
            placeholder={
              isAdmin
                ? 'Search job, customer, address, or scope'
                : 'Search your assigned jobs'
            }
            className="h-11 pl-9"
          />
        </div>
        <select
          className={`${fieldClass} h-11 sm:w-48`}
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as 'all' | JobStatus)
          }
          aria-label="Filter jobs by status"
        >
          <option value="all">All active statuses</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {showForm && isAdmin && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>Add job</CardTitle>
            <CardDescription>Schedule electrical, solar, or directional boring work.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Job title" name="title" required className="lg:col-span-2" />
              <label className="grid gap-1.5 text-sm font-medium">
                Client
                <select className={fieldClass} name="clientId" required>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Status
                <select className={fieldClass} name="status" defaultValue="scheduled">
                  {Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Service
                <select className={fieldClass} name="category" defaultValue="electrical">
                  {Object.entries(CATEGORY_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Assigned employee
                <select className={fieldClass} name="assignedTo" defaultValue="">
                  <option value="">Unassigned</option>
                  {employees.filter((employee) => employee.role === 'employee').map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </select>
              </label>
              <Field label="Scheduled date" name="scheduledDate" type="date" required />
              <Field label="Estimated hours" name="estimatedHours" type="number" />
              <Field label="City" name="city" />
              <Field label="Address" name="address" className="sm:col-span-2 lg:col-span-3" />
              <label className="grid gap-1.5 text-sm font-medium sm:col-span-2 lg:col-span-3">
                Scope of work
                <Textarea name="description" />
              </label>
              <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit">Save job</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isAdmin ? (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Crew</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 && (
                  <EmptyRow colSpan={5} message="No jobs match these filters." />
                )}
                {filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="font-medium">{job.title}</div>
                      <div className="mt-1 flex gap-2">
                        <span className="text-xs text-muted-foreground">{job.code}</span>
                        <CategoryBadge category={job.category} />
                      </div>
                    </TableCell>
                    <TableCell>{clients.find((client) => client.id === job.clientId)?.name ?? 'Unknown'}</TableCell>
                    <TableCell><StatusBadge status={job.status} /></TableCell>
                    <TableCell>
                      {job.assignedTo.length
                        ? job.assignedTo.map((id) => employees.find((employee) => employee.id === id)?.name).filter(Boolean).join(', ')
                        : <span className="text-muted-foreground">Unassigned</span>}
                    </TableCell>
                    <TableCell>{formatDate(job.scheduledDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {!filteredJobs.length && (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground lg:col-span-2">
              No assigned jobs match these filters.
            </div>
          )}
          {filteredJobs.map((job) => {
            const client = clients.find((item) => item.id === job.clientId)
            const current = activeEntry?.jobId === job.id
            return (
              <Card key={job.id} className={current ? 'ring-2 ring-primary/40' : ''}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-primary">{job.code}</span>
                    <CategoryBadge category={job.category} />
                    <StatusBadge status={job.status} />
                    {current && <Badge>Tracking now</Badge>}
                  </div>
                  <CardTitle className="mt-2">{job.title}</CardTitle>
                  <CardDescription>{client?.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span>{[job.address, job.city].filter(Boolean).join(', ')}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm">
                    {job.description || 'No scope notes entered.'}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground">
                      Scheduled {formatDate(job.scheduledDate)}
                    </span>
                    <Button
                      disabled={
                        current ||
                        Boolean(activeEntry?.breakStartedAt) ||
                        isPreviewMode
                      }
                      onClick={() => {
                        if (activeEntry) switchJob(activeEntry.id, job.id)
                        else clockIn(currentUser.id, job.id)
                      }}
                    >
                      {activeEntry ? <ArrowLeftRight /> : <Play />}
                      {current
                        ? 'Current job'
                        : activeEntry
                          ? 'Switch to job'
                          : 'Start job'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}

export function TimePage() {
  const { isAdmin } = useStore()
  return isAdmin ? <AdminTimePage /> : <EmployeeTimePage />
}

function EmployeeTimePage() {
  const { jobs, timeEntries, currentUser } = useStore()
  const now = useNow(1000)
  const entries = timeEntries.filter(
    (entry) => entry.employeeId === currentUser.id,
  )
  const { start, end } = getWeekRange()
  const weekEntries = entries.filter((entry) => {
    const date = new Date(`${entry.date}T00:00:00`)
    return date >= start && date < end
  })
  const weekHours = weekEntries.reduce(
    (total, entry) => total + entryHours(entry, now),
    0,
  )

  return (
    <>
      <PageHeader
        title="My time"
        description="Your recorded hours and approval status."
      >
        <Button render={<Link href="/" />}>
          <Clock3 /> Open clock
        </Button>
      </PageHeader>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="This week"
          value={formatHours(weekHours)}
          detail={`${weekEntries.length} time entries`}
          icon={Clock3}
        />
        <MetricCard
          label="Awaiting approval"
          value={String(entries.filter((entry) => entry.status === 'submitted').length)}
          detail="Submitted to your manager"
          icon={Pause}
        />
        <MetricCard
          label="Approved"
          value={String(entries.filter((entry) => entry.status === 'approved').length)}
          detail="Payroll-ready entries"
          icon={CheckCircle2}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent entries</CardTitle>
          <CardDescription>Break time is excluded from worked hours.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Clock</TableHead>
                <TableHead>Break</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 && <EmptyRow colSpan={6} message="No time entries yet." />}
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {jobs.find((job) => job.id === entry.jobId)?.title}
                  </TableCell>
                  <TableCell>{formatDate(entry.date)}</TableCell>
                  <TableCell>
                    {formatClock(entry.clockIn)}
                    {entry.clockOut ? `–${formatClock(entry.clockOut)}` : '–Now'}
                  </TableCell>
                  <TableCell>{entry.breakMinutes}m</TableCell>
                  <TableCell className="font-mono">
                    {formatHours(entryHours(entry, now))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={entry.status === 'approved' ? 'default' : 'outline'}
                      className="capitalize"
                    >
                      {entry.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

function AdminTimePage() {
  const {
    jobs,
    employees,
    timeEntries,
    reviewTimeEntry,
  } = useStore()
  const now = useNow(1000)
  const pending = timeEntries.filter((entry) => entry.status === 'submitted')
  const active = timeEntries.filter((entry) => entry.status === 'active')
  const approved = timeEntries.filter((entry) => entry.status === 'approved')

  return (
    <>
      <PageHeader
        title="Time approvals"
        description="Review submitted labour and see live crew status. No GPS data is collected."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Needs review"
          value={String(pending.length)}
          detail="Submitted employee entries"
          icon={ClipboardCheck}
        />
        <MetricCard
          label="Active now"
          value={String(active.length)}
          detail={`${active.filter((entry) => entry.breakStartedAt).length} on break`}
          icon={Clock3}
        />
        <MetricCard
          label="Approved"
          value={String(approved.length)}
          detail="Payroll-ready entries"
          icon={CheckCircle2}
        />
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Team entries</CardTitle>
            <CardDescription>Pending entries appear first for fast review.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Break</TableHead>
                  <TableHead className="text-right">Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeEntries.length === 0 && <EmptyRow colSpan={7} message="No time entries yet." />}
                {[...timeEntries]
                  .sort((a, b) => {
                    if (a.status === 'submitted' && b.status !== 'submitted') return -1
                    if (b.status === 'submitted' && a.status !== 'submitted') return 1
                    return b.clockIn.localeCompare(a.clockIn)
                  })
                  .map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{employees.find((employee) => employee.id === entry.employeeId)?.name}</TableCell>
                    <TableCell>{jobs.find((job) => job.id === entry.jobId)?.title}</TableCell>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell className="font-mono">{formatHours(entryHours(entry, now))}</TableCell>
                    <TableCell>
                      <Badge
                        variant={entry.status === 'approved' ? 'default' : 'outline'}
                        className="capitalize"
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.breakStartedAt ? 'On break' : `${entry.breakMinutes}m`}
                    </TableCell>
                    <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            disabled={entry.status !== 'submitted' && entry.status !== 'rejected'}
                            onClick={() => reviewTimeEntry(entry.id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={entry.status !== 'submitted'}
                            onClick={() => reviewTimeEntry(entry.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
      </Card>
    </>
  )
}

export function SchedulePage() {
  const { jobs, clients, employees, currentUser, isAdmin } = useStore()
  const days = getWeekDays()
  const visibleJobs = isAdmin
    ? jobs
    : jobs.filter((job) => job.assignedTo.includes(currentUser.id))

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Crew schedule' : 'My schedule'}
        description={
          isAdmin
            ? "This week's electrical jobs and assigned crews."
            : "Your assigned electrical work for the week."
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {days.map((day) => {
          const dateKey = toDateKey(day)
          const dayJobs = visibleJobs.filter((job) => job.scheduledDate === dateKey)
          return (
            <Card key={dateKey} className={dayJobs.length ? '' : 'opacity-70'}>
              <CardHeader>
                <CardTitle>{formatDate(dateKey)}</CardTitle>
                <CardDescription>{dayJobs.length} scheduled</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {dayJobs.length === 0 && <p className="text-sm text-muted-foreground">No work scheduled.</p>}
                {dayJobs.map((job) => (
                  <div key={job.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{job.title}</p>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {clients.find((client) => client.id === job.clientId)?.name}
                    </p>
                    <p className="mt-2 text-xs">
                      {job.assignedTo.map((id) => employees.find((employee) => employee.id === id)?.name).filter(Boolean).join(', ') || 'Unassigned'}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}

export function ReportsPage() {
  const { employees, jobs, timeEntries, isAdmin } = useStore()
  const now = Date.now()
  const { start, end } = getWeekRange()
  const weekEntries = timeEntries.filter((entry) => {
    const date = new Date(`${entry.date}T00:00:00`)
    return date >= start && date < end
  })
  const employeeTotals = employees.map((employee) => {
    const entries = weekEntries.filter((entry) => entry.employeeId === employee.id)
    const hours = entries.reduce((sum, entry) => sum + entryHours(entry, now), 0)
    return { employee, hours, payroll: hours * employee.hourlyRate }
  })

  if (!isAdmin) return <AccessRestricted />

  const labour = employeeTotals.reduce((sum, row) => sum + row.payroll, 0)

  return (
    <>
      <PageHeader title="Reports" description="Weekly labour, payroll estimates, and job costing visibility." />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Team hours" value={formatHours(employeeTotals.reduce((sum, row) => sum + row.hours, 0))} detail="Current work week" icon={Clock3} />
        <MetricCard label="Estimated payroll" value={formatCurrency(labour)} detail="Based on demo hourly rates" icon={DollarSign} />
        <MetricCard label="Completed jobs" value={String(jobs.filter((job) => ['completed', 'invoiced'].includes(job.status)).length)} detail="Ready for billing review" icon={CheckCircle2} />
      </div>
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Employee labour summary</CardTitle>
          <CardDescription>Current week, excluding unpaid break minutes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Estimated payroll</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeTotals.map(({ employee, hours, payroll }) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.title}</TableCell>
                  <TableCell className="font-mono">{formatHours(hours)}</TableCell>
                  <TableCell>{formatCurrency(payroll)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  className,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  className?: string
}) {
  return (
    <label className={`grid gap-1.5 text-sm font-medium ${className ?? ''}`}>
      {label}
      <Input name={name} type={type} required={required} />
    </label>
  )
}

function AccessRestricted() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
        <Users className="size-5" />
      </div>
      <h1 className="mt-4 text-xl font-semibold">Admin access required</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Switch to the demo administrator account to view this area.
      </p>
      <Button className="mt-5" variant="outline" render={<Link href="/" />}>
        Return to dashboard
      </Button>
    </div>
  )
}
