export type Role = "admin" | "manager" | "employee";
export type ClientStatus = "lead" | "active" | "inactive";
export type JobStatus =
  | "lead"
  | "quoted"
  | "scheduled"
  | "in_progress"
  | "complete"
  | "cancelled";
export type TimeStatus = "active" | "submitted" | "approved" | "rejected";

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: Role;
  hourly_rate?: number | null;
  active: boolean;
}

export interface Client {
  id: string;
  organization_id: string;
  company_name: string;
  contact_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  status: ClientStatus;
  source?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  organization_id: string;
  client_id: string;
  job_number: string;
  title: string;
  service_type: string;
  status: JobStatus;
  priority: "low" | "normal" | "high" | "urgent";
  address?: string | null;
  city?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  budget_hours?: number | null;
  notes?: string | null;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  organization_id: string;
  employee_id: string;
  job_id: string;
  start_time: string;
  end_time?: string | null;
  break_minutes: number;
  notes?: string | null;
  status: TimeStatus;
  approved_by?: string | null;
  approved_at?: string | null;
}

export interface AppData {
  profile: Profile;
  profiles: Profile[];
  clients: Client[];
  jobs: Job[];
  timeEntries: TimeEntry[];
}
