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
import type { Client, Employee, Job, TimeEntry } from './types'

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
  setCurrentUserId: (id: string) => void
  addClient: (data: Omit<Client, 'id' | 'createdAt'>) => void
  updateClient: (id: string, data: Partial<Client>) => void
  addJob: (data: Omit<Job, 'id' | 'createdAt' | 'code'>) => void
  updateJob: (id: string, data: Partial<Job>) => void
  addTimeEntry: (data: Omit<TimeEntry, 'id'>) => void
  updateTimeEntry: (id: string, data: Partial<TimeEntry>) => void
  deleteTimeEntry: (id: string) => void
  clockIn: (employeeId: string, jobId: string) => void
  clockOut: (entryId: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [employees] = useState<Employee[]>(seedEmployees)
  const [clients, setClients] = useState<Client[]>(seedClients)
  const [jobs, setJobs] = useState<Job[]>(seedJobs)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(seedTimeEntries)
  const [currentUserId, setCurrentUserId] = useState<string>('emp-1')

  const currentUser = useMemo(
    () => employees.find((e) => e.id === currentUserId) ?? employees[0],
    [employees, currentUserId],
  )

  const addClient = useCallback((data: Omit<Client, 'id' | 'createdAt'>) => {
    setClients((prev) => [
      { ...data, id: uid('cl'), createdAt: new Date().toISOString().slice(0, 10) },
      ...prev,
    ])
  }, [])

  const updateClient = useCallback((id: string, data: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
  }, [])

  const addJob = useCallback((data: Omit<Job, 'id' | 'createdAt' | 'code'>) => {
    setJobs((prev) => {
      const nextNum = 1071 + prev.length
      return [
        {
          ...data,
          id: uid('job'),
          code: `SC-${nextNum}`,
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ]
    })
  }, [])

  const updateJob = useCallback((id: string, data: Partial<Job>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...data } : j)))
  }, [])

  const addTimeEntry = useCallback((data: Omit<TimeEntry, 'id'>) => {
    setTimeEntries((prev) => [{ ...data, id: uid('te') }, ...prev])
  }, [])

  const updateTimeEntry = useCallback((id: string, data: Partial<TimeEntry>) => {
    setTimeEntries((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)))
  }, [])

  const deleteTimeEntry = useCallback((id: string) => {
    setTimeEntries((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clockIn = useCallback((employeeId: string, jobId: string) => {
    const now = new Date()
    setTimeEntries((prev) => [
      {
        id: uid('te'),
        employeeId,
        jobId,
        date: now.toISOString().slice(0, 10),
        clockIn: now.toISOString(),
        clockOut: null,
        breakMinutes: 0,
        notes: '',
        manual: false,
      },
      ...prev,
    ])
  }, [])

  const clockOut = useCallback((entryId: string) => {
    setTimeEntries((prev) =>
      prev.map((t) =>
        t.id === entryId ? { ...t, clockOut: new Date().toISOString() } : t,
      ),
    )
  }, [])

  const value: StoreValue = {
    employees,
    clients,
    jobs,
    timeEntries,
    currentUserId,
    currentUser,
    isAdmin: currentUser.role === 'admin',
    setCurrentUserId,
    addClient,
    updateClient,
    addJob,
    updateJob,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    clockIn,
    clockOut,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

