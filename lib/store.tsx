'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clients as seedClients,
  employees as seedEmployees,
  jobs as seedJobs,
  timeEntries as seedTimeEntries,
} from './demo-data'
import { toast } from 'sonner'
import { createClient as createSupabaseClient } from './supabase/client'
import type { AppData, Client, Employee, Job, TimeEntry } from './types'

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

interface StoreValue {
  employees: Employee[]
  clients: Client[]
  jobs: Job[]
  timeEntries: TimeEntry[]
  currentUserId: string
  currentUser: Employee
  isAdmin: boolean
  cloudMode: boolean
  setCurrentUserId: (id: string) => void
  signOut: () => void
  addClient: (data: Omit<Client, 'id' | 'createdAt'>) => void
  updateClient: (id: string, data: Partial<Client>) => void
  addJob: (data: Omit<Job, 'id' | 'createdAt' | 'code'>) => void
  updateJob: (id: string, data: Partial<Job>) => void
  addTimeEntry: (data: Omit<TimeEntry, 'id'>) => void
  updateTimeEntry: (id: string, data: Partial<TimeEntry>) => void
  deleteTimeEntry: (id: string) => void
  clockIn: (employeeId: string, jobId: string) => void
  clockOut: (entryId: string) => void
  reviewTimeEntry: (entryId: string, decision: 'approved' | 'rejected') => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({
  children,
  initialData,
  cloudMode = false,
}: {
  children: ReactNode
  initialData?: AppData | null
  cloudMode?: boolean
}) {
  const [employees] = useState<Employee[]>(
    initialData?.employees ?? seedEmployees,
  )
  const [clients, setClients] = useState<Client[]>(
    initialData?.clients ?? seedClients,
  )
  const [jobs, setJobs] = useState<Job[]>(initialData?.jobs ?? seedJobs)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(
    initialData?.timeEntries ?? seedTimeEntries,
  )
  const [currentUserId, setCurrentUserIdState] = useState<string>(
    initialData?.currentUserId ?? 'emp-1',
  )
  const organizationId = initialData?.organizationId ?? 'demo-organization'

  const currentUser = useMemo(
    () => employees.find((e) => e.id === currentUserId) ?? employees[0],
    [employees, currentUserId],
  )

  const handleCloudError = useCallback((message: string) => {
    toast.error(message)
    window.setTimeout(() => window.location.reload(), 1200)
  }, [])

  const runCloud = useCallback(
    (operation: () => PromiseLike<{ error: { message: string } | null }>) => {
      if (!cloudMode) return
      void operation().then(({ error }) => {
        if (error) handleCloudError(error.message)
      })
    },
    [cloudMode, handleCloudError],
  )

  const setCurrentUserId = useCallback(
    (id: string) => {
      if (!cloudMode) setCurrentUserIdState(id)
    },
    [cloudMode],
  )

  const signOut = useCallback(() => {
    if (!cloudMode) return
    void createSupabaseClient()
      .auth.signOut()
      .then(() => {
        window.location.href = '/login'
      })
  }, [cloudMode])

  const addClient = useCallback((data: Omit<Client, 'id' | 'createdAt'>) => {
    const client = {
      ...data,
      id: cloudMode ? crypto.randomUUID() : uid('cl'),
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setClients((prev) => [
      client,
      ...prev,
    ])
    runCloud(() =>
      createSupabaseClient().from('clients').insert({
        id: client.id,
        organization_id: organizationId,
        name: client.name,
        contact_name: client.contact,
        client_type: client.type,
        email: client.email || null,
        phone: client.phone || null,
        address: client.address || null,
        city: client.city || null,
        notes: client.notes || null,
        created_by: currentUserId,
      }),
    )
  }, [cloudMode, currentUserId, organizationId, runCloud])

  const updateClient = useCallback((id: string, data: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
    const update: Record<string, unknown> = {}
    if (data.name !== undefined) update.name = data.name
    if (data.contact !== undefined) update.contact_name = data.contact
    if (data.type !== undefined) update.client_type = data.type
    if (data.email !== undefined) update.email = data.email || null
    if (data.phone !== undefined) update.phone = data.phone || null
    if (data.address !== undefined) update.address = data.address || null
    if (data.city !== undefined) update.city = data.city || null
    if (data.notes !== undefined) update.notes = data.notes || null
    runCloud(() =>
      createSupabaseClient().from('clients').update(update).eq('id', id),
    )
  }, [runCloud])

  const addJob = useCallback((data: Omit<Job, 'id' | 'createdAt' | 'code'>) => {
    const job = {
      ...data,
      id: cloudMode ? crypto.randomUUID() : uid('job'),
      code: `SC-${new Date().getFullYear().toString().slice(-2)}${String(jobs.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setJobs((prev) => [job, ...prev])
    if (cloudMode) {
      void (async () => {
        const supabase = createSupabaseClient()
        const { error } = await supabase.from('jobs').insert({
          id: job.id,
          organization_id: organizationId,
          client_id: job.clientId,
          job_number: job.code,
          title: job.title,
          status: job.status,
          category: job.category,
          address: job.address || null,
          city: job.city || null,
          scheduled_date: job.scheduledDate,
          estimated_hours: job.estimatedHours,
          description: job.description || null,
          created_by: currentUserId,
        })
        if (error) return handleCloudError(error.message)
        if (job.assignedTo.length) {
          const assignmentResult = await supabase.from('job_assignments').insert(
            job.assignedTo.map((employeeId) => ({
              job_id: job.id,
              employee_id: employeeId,
            })),
          )
          if (assignmentResult.error) handleCloudError(assignmentResult.error.message)
        }
      })()
    }
  }, [cloudMode, currentUserId, handleCloudError, jobs.length, organizationId])

  const updateJob = useCallback((id: string, data: Partial<Job>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...data } : j)))
    if (!cloudMode) return
    void (async () => {
      const supabase = createSupabaseClient()
      const update: Record<string, unknown> = {}
      if (data.clientId !== undefined) update.client_id = data.clientId
      if (data.title !== undefined) update.title = data.title
      if (data.status !== undefined) update.status = data.status
      if (data.category !== undefined) update.category = data.category
      if (data.address !== undefined) update.address = data.address || null
      if (data.city !== undefined) update.city = data.city || null
      if (data.scheduledDate !== undefined) update.scheduled_date = data.scheduledDate
      if (data.estimatedHours !== undefined) update.estimated_hours = data.estimatedHours
      if (data.description !== undefined) update.description = data.description || null
      const { error } = await supabase.from('jobs').update(update).eq('id', id)
      if (error) return handleCloudError(error.message)
      if (data.assignedTo) {
        const removal = await supabase.from('job_assignments').delete().eq('job_id', id)
        if (removal.error) return handleCloudError(removal.error.message)
        if (data.assignedTo.length) {
          const addition = await supabase.from('job_assignments').insert(
            data.assignedTo.map((employeeId) => ({
              job_id: id,
              employee_id: employeeId,
            })),
          )
          if (addition.error) handleCloudError(addition.error.message)
        }
      }
    })()
  }, [cloudMode, handleCloudError])

  const addTimeEntry = useCallback((data: Omit<TimeEntry, 'id'>) => {
    const entry = {
      ...data,
      id: cloudMode ? crypto.randomUUID() : uid('te'),
    }
    setTimeEntries((prev) => [entry, ...prev])
    runCloud(() =>
      createSupabaseClient().from('time_entries').insert({
        id: entry.id,
        organization_id: organizationId,
        employee_id: entry.employeeId,
        job_id: entry.jobId,
        work_date: entry.date,
        clock_in: entry.clockIn,
        clock_out: entry.clockOut,
        break_minutes: entry.breakMinutes,
        notes: entry.notes || null,
        manual: entry.manual,
        status: entry.status,
      }),
    )
  }, [cloudMode, organizationId, runCloud])

  const updateTimeEntry = useCallback((id: string, data: Partial<TimeEntry>) => {
    setTimeEntries((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)))
    const update: Record<string, unknown> = {}
    if (data.jobId !== undefined) update.job_id = data.jobId
    if (data.date !== undefined) update.work_date = data.date
    if (data.clockIn !== undefined) update.clock_in = data.clockIn
    if (data.clockOut !== undefined) update.clock_out = data.clockOut
    if (data.breakMinutes !== undefined) update.break_minutes = data.breakMinutes
    if (data.notes !== undefined) update.notes = data.notes || null
    if (data.status !== undefined) update.status = data.status
    runCloud(() =>
      createSupabaseClient().from('time_entries').update(update).eq('id', id),
    )
  }, [runCloud])

  const deleteTimeEntry = useCallback((id: string) => {
    setTimeEntries((prev) => prev.filter((t) => t.id !== id))
    runCloud(() =>
      createSupabaseClient().from('time_entries').delete().eq('id', id),
    )
  }, [runCloud])

  const clockIn = useCallback((employeeId: string, jobId: string) => {
    const now = new Date()
    const entry: TimeEntry = {
      id: cloudMode ? crypto.randomUUID() : uid('te'),
      employeeId,
      jobId,
      date: now.toISOString().slice(0, 10),
      clockIn: now.toISOString(),
      clockOut: null,
      breakMinutes: 0,
      notes: '',
      manual: false,
      status: 'active',
    }
    setTimeEntries((prev) => [
      entry,
      ...prev,
    ])
    runCloud(() =>
      createSupabaseClient().from('time_entries').insert({
        id: entry.id,
        organization_id: organizationId,
        employee_id: employeeId,
        job_id: jobId,
        work_date: entry.date,
        clock_in: entry.clockIn,
        break_minutes: 0,
        notes: null,
        manual: false,
        status: 'active',
      }),
    )
  }, [cloudMode, organizationId, runCloud])

  const clockOut = useCallback((entryId: string) => {
    const clockOutAt = new Date().toISOString()
    setTimeEntries((prev) =>
      prev.map((t) =>
        t.id === entryId ? { ...t, clockOut: clockOutAt, status: 'submitted' } : t,
      ),
    )
    runCloud(() =>
      createSupabaseClient()
        .from('time_entries')
        .update({ clock_out: clockOutAt, status: 'submitted' })
        .eq('id', entryId),
    )
  }, [runCloud])

  const reviewTimeEntry = useCallback(
    (entryId: string, decision: 'approved' | 'rejected') => {
      const reviewedAt = decision === 'approved' ? new Date().toISOString() : null
      setTimeEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                status: decision,
                approvedBy: decision === 'approved' ? currentUserId : null,
                approvedAt: reviewedAt,
              }
            : entry,
        ),
      )
      runCloud(() =>
        createSupabaseClient().rpc('review_time_entry', {
          entry_id: entryId,
          decision,
        }),
      )
    },
    [currentUserId, runCloud],
  )

  const value: StoreValue = {
    employees,
    clients,
    jobs,
    timeEntries,
    currentUserId,
    currentUser,
    isAdmin: currentUser.role === 'admin' || currentUser.role === 'manager',
    cloudMode,
    setCurrentUserId,
    signOut,
    addClient,
    updateClient,
    addJob,
    updateJob,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    clockIn,
    clockOut,
    reviewTimeEntry,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
