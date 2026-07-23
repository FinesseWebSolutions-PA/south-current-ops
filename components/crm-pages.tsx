'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  DollarSign,
  MapPinOff,
  Plus,
  Users,
  Zap,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { CategoryBadge, ClientTypeBadge, StatusBadge } from '@/components/status-badges'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  const { jobs, clients, employees, timeEntries, currentUser } = useStore()
  const now = useNow(1000)
  const { start, end } = getWeekRange()
  const weekEntries = timeEntries.filter((entry) => {
    const date = new Date(`${entry.date}T00:00:00`)
    return date >= start && date < end
  })
  const weekHours = weekEntries.reduce((sum, entry) => sum + entryHours(entry, now), 0)
  const activeEntry = timeEntries.find(
    (entry) => entry.employeeId === currentUser.id && !entry.clockOut,
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
          label="Crew members"
          value={String(employees.length)}
          detail="Admin and field employees"
          icon={Zap}
        />
        <MetricCard
          label="Hours this week"
          value={formatHours(weekHours)}
          detail={`${weekEntries.length} time entries`}
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
            <CardTitle>{activeEntry ? 'Clocked in' : 'Ready to work'}</CardTitle>
            <CardDescription>
              {activeEntry
                ? jobs.find((job) => job.id === activeEntry.jobId)?.title
                : `Signed in as ${currentUser.name}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-sidebar p-5 text-sidebar-foreground">
              <p className="text-xs uppercase tracking-[0.18em] text-sidebar-foreground/60">
                Current timer
              </p>
              <p className="mt-2 font-mono text-3xl font-semibold">
                {activeEntry ? formatStopwatch(entryDurationMs(activeEntry, now)) : '0:00:00'}
              </p>
              <Button className="mt-5 w-full" render={<Link href="/time" />}>
                {activeEntry ? 'Open time tracker' : 'Clock in'}
              </Button>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-lg border p-3">
              <MapPinOff className="mt-0.5 size-4 shrink-0 text-accent" />
              <div>
                <p className="font-medium">No GPS tracking</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  South Current records job time only—never employee location.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
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

export function JobsPage() {
  const { jobs, clients, employees, addJob, isAdmin } = useStore()
  const [showForm, setShowForm] = useState(false)

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
      <PageHeader title="Jobs" description="Plan, assign, and follow electrical work from lead to invoice.">
        {isAdmin && (
          <Button onClick={() => setShowForm((value) => !value)}>
            <Plus /> New job
          </Button>
        )}
      </PageHeader>

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
              {jobs.length === 0 && <EmptyRow colSpan={5} message="No jobs yet." />}
              {jobs.map((job) => (
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
    </>
  )
}

export function TimePage() {
  const { jobs, employees, timeEntries, currentUser, isAdmin, clockIn, clockOut } = useStore()
  const now = useNow(1000)
  const [jobId, setJobId] = useState(
    jobs.find((job) => !['completed', 'invoiced'].includes(job.status))?.id ?? '',
  )
  const activeEntry = timeEntries.find(
    (entry) => entry.employeeId === currentUser.id && !entry.clockOut,
  )
  const visibleEntries = isAdmin
    ? timeEntries
    : timeEntries.filter((entry) => entry.employeeId === currentUser.id)

  return (
    <>
      <PageHeader title="Time tracking" description="Job-based time records with no GPS or location monitoring." />

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>{activeEntry ? 'Shift in progress' : 'Start a job timer'}</CardTitle>
            <CardDescription>{currentUser.name}</CardDescription>
          </CardHeader>
          <CardContent>
            {activeEntry ? (
              <div className="rounded-xl bg-sidebar p-5 text-sidebar-foreground">
                <p className="text-sm text-sidebar-foreground/70">
                  {jobs.find((job) => job.id === activeEntry.jobId)?.title}
                </p>
                <p className="mt-2 font-mono text-4xl font-semibold">
                  {formatStopwatch(entryDurationMs(activeEntry, now))}
                </p>
                <p className="mt-2 text-xs text-sidebar-foreground/60">
                  Started {formatClock(activeEntry.clockIn)}
                </p>
                <Button className="mt-5 w-full" onClick={() => clockOut(activeEntry.id)}>
                  Clock out
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                <Label htmlFor="timer-job">Choose a job</Label>
                <select
                  id="timer-job"
                  className={fieldClass}
                  value={jobId}
                  onChange={(event) => setJobId(event.target.value)}
                >
                  {jobs.filter((job) => !['completed', 'invoiced'].includes(job.status)).map((job) => (
                    <option key={job.id} value={job.id}>{job.code} — {job.title}</option>
                  ))}
                </select>
                <Button disabled={!jobId} onClick={() => clockIn(currentUser.id, jobId)}>
                  <Clock3 /> Clock in
                </Button>
              </div>
            )}
            <div className="mt-4 flex gap-3 rounded-lg border p-3">
              <MapPinOff className="mt-0.5 size-4 shrink-0 text-accent" />
              <p className="text-xs text-muted-foreground">
                No GPS, geofencing, route history, or background location collection.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isAdmin ? 'Team entries' : 'My entries'}</CardTitle>
            <CardDescription>Recent labour recorded against jobs.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && <TableHead>Employee</TableHead>}
                  <TableHead>Job</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleEntries.length === 0 && <EmptyRow colSpan={isAdmin ? 4 : 3} message="No time entries yet." />}
                {visibleEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    {isAdmin && <TableCell>{employees.find((employee) => employee.id === entry.employeeId)?.name}</TableCell>}
                    <TableCell>{jobs.find((job) => job.id === entry.jobId)?.title}</TableCell>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell className="font-mono">{formatHours(entryHours(entry, now))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export function SchedulePage() {
  const { jobs, clients, employees } = useStore()
  const days = getWeekDays()

  return (
    <>
      <PageHeader title="Schedule" description="This week's electrical jobs and assigned crews." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {days.map((day) => {
          const dateKey = toDateKey(day)
          const dayJobs = jobs.filter((job) => job.scheduledDate === dateKey)
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
