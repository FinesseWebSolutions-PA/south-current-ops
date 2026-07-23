import 'server-only'

import type { AppData, Client, Employee, Job, TimeEntry } from '@/lib/types'
import { createClient } from './server'

type Row = Record<string, unknown>

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function mapEmployee(row: Row): Employee {
  const name = asString(row.full_name, 'Employee')
  return {
    id: asString(row.id),
    name,
    role: row.role === 'admin' || row.role === 'manager' ? row.role : 'employee',
    title: asString(row.title, 'Electrician'),
    email: asString(row.email),
    phone: asString(row.phone),
    hourlyRate: Number(row.hourly_rate ?? 0),
    initials: name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase(),
  }
}

function mapClient(row: Row): Client {
  return {
    id: asString(row.id),
    name: asString(row.name),
    contact: asString(row.contact_name),
    type:
      row.client_type === 'residential' || row.client_type === 'agricultural'
        ? row.client_type
        : 'commercial',
    email: asString(row.email),
    phone: asString(row.phone),
    address: asString(row.address),
    city: asString(row.city),
    notes: asString(row.notes),
    createdAt: asString(row.created_at).slice(0, 10),
  }
}

function mapJob(row: Row): Job {
  const assignments = Array.isArray(row.job_assignments)
    ? (row.job_assignments as Row[]).map((assignment) =>
        asString(assignment.employee_id),
      )
    : []

  return {
    id: asString(row.id),
    code: asString(row.job_number),
    title: asString(row.title),
    clientId: asString(row.client_id),
    status:
      row.status === 'scheduled' ||
      row.status === 'in-progress' ||
      row.status === 'completed' ||
      row.status === 'invoiced'
        ? row.status
        : 'lead',
    category:
      row.category === 'solar' || row.category === 'boring'
        ? row.category
        : 'electrical',
    address: asString(row.address),
    city: asString(row.city),
    assignedTo: assignments,
    scheduledDate: asString(row.scheduled_date),
    estimatedHours: Number(row.estimated_hours ?? 0),
    description: asString(row.description),
    createdAt: asString(row.created_at).slice(0, 10),
  }
}

function mapTimeEntry(row: Row): TimeEntry {
  const clockIn = asString(row.clock_in)
  return {
    id: asString(row.id),
    employeeId: asString(row.employee_id),
    jobId: asString(row.job_id),
    date: asString(row.work_date, clockIn.slice(0, 10)),
    clockIn,
    clockOut: typeof row.clock_out === 'string' ? row.clock_out : null,
    breakMinutes: Number(row.break_minutes ?? 0),
    notes: asString(row.notes),
    manual: Boolean(row.manual),
    status:
      row.status === 'active' ||
      row.status === 'approved' ||
      row.status === 'rejected'
        ? row.status
        : 'submitted',
    approvedBy:
      typeof row.approved_by === 'string' ? row.approved_by : null,
    approvedAt:
      typeof row.approved_at === 'string' ? row.approved_at : null,
  }
}

export async function loadCloudData(): Promise<AppData | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [profileResult, employeesResult, clientsResult, jobsResult, timeResult] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('profiles').select('*').eq('active', true).order('full_name'),
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase
        .from('jobs')
        .select('*, job_assignments(employee_id)')
        .order('scheduled_date', { ascending: true }),
      supabase
        .from('time_entries')
        .select('*')
        .order('clock_in', { ascending: false }),
    ])

  if (profileResult.error) {
    throw new Error(`Employee profile unavailable: ${profileResult.error.message}`)
  }

  const profile = profileResult.data as Row

  return {
    organizationId: asString(profile.organization_id),
    currentUserId: user.id,
    employees: ((employeesResult.data ?? []) as Row[]).map(mapEmployee),
    clients: ((clientsResult.data ?? []) as Row[]).map(mapClient),
    jobs: ((jobsResult.data ?? []) as Row[]).map(mapJob),
    timeEntries: ((timeResult.data ?? []) as Row[]).map(mapTimeEntry),
  }
}
