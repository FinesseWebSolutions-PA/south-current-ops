export type Role = 'admin' | 'manager' | 'employee'

export type ServiceCategory = 'electrical' | 'solar' | 'boring'

export type JobStatus =
  | 'lead'
  | 'scheduled'
  | 'in-progress'
  | 'completed'
  | 'invoiced'

export type ClientType = 'residential' | 'commercial' | 'agricultural'

export interface Employee {
  id: string
  name: string
  role: Role
  title: string
  email: string
  phone: string
  hourlyRate: number
  initials: string
}

export interface Client {
  id: string
  name: string
  contact: string
  type: ClientType
  email: string
  phone: string
  address: string
  city: string
  notes: string
  createdAt: string
}

export interface Job {
  id: string
  code: string
  title: string
  clientId: string
  status: JobStatus
  category: ServiceCategory
  address: string
  city: string
  assignedTo: string[]
  scheduledDate: string
  estimatedHours: number
  description: string
  createdAt: string
}

export interface TimeEntry {
  id: string
  employeeId: string
  jobId: string
  date: string
  /** ISO timestamps */
  clockIn: string
  clockOut: string | null
  breakMinutes: number
  notes: string
  manual: boolean
  status: 'active' | 'submitted' | 'approved' | 'rejected'
  approvedBy?: string | null
  approvedAt?: string | null
}

export interface AppData {
  organizationId: string
  currentUserId: string
  employees: Employee[]
  clients: Client[]
  jobs: Job[]
  timeEntries: TimeEntry[]
}

export const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  electrical: 'Electrical',
  solar: 'Solar',
  boring: 'Directional Boring',
}

export const STATUS_LABEL: Record<JobStatus, string> = {
  lead: 'Lead',
  scheduled: 'Scheduled',
  'in-progress': 'In Progress',
  completed: 'Completed',
  invoiced: 'Invoiced',
}

export const CLIENT_TYPE_LABEL: Record<ClientType, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  agricultural: 'Agricultural',
}
