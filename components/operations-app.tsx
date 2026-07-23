"use client";

import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FileClock,
  Gauge,
  LayoutDashboard,
  ListFilter,
  LogOut,
  Menu,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  TimerReset,
  Users,
  X,
  Zap,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import type {
  AppData,
  Client,
  ClientStatus,
  Job,
  JobStatus,
  TimeEntry,
} from "@/lib/types";

type Section = "overview" | "customers" | "jobs" | "time" | "team" | "reports";
type Modal = "client" | "job" | "time" | null;

const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "customers", label: "Customers", icon: Building2 },
  { id: "jobs", label: "Jobs", icon: BriefcaseBusiness },
  { id: "time", label: "Time", icon: Clock3 },
  { id: "team", label: "Team", icon: Users },
  { id: "reports", label: "Reports", icon: Gauge },
];

const sectionCopy: Record<Section, { title: string; subtitle: string }> = {
  overview: { title: "Good afternoon", subtitle: "Here’s what’s moving across South Current today." },
  customers: { title: "Customers", subtitle: "Leads, active customers, and every important contact detail." },
  jobs: { title: "Jobs", subtitle: "Plan the work, assign priorities, and follow progress to completion." },
  time: { title: "Time & approvals", subtitle: "Accurate job hours without location tracking." },
  team: { title: "Team", subtitle: "Roles, availability, and current field activity." },
  reports: { title: "Reports", subtitle: "Labour visibility and payroll-ready exports." },
};

const statusLabels: Record<string, string> = {
  lead: "Lead",
  active: "Active",
  inactive: "Inactive",
  quoted: "Quoted",
  scheduled: "Scheduled",
  in_progress: "In progress",
  complete: "Complete",
  cancelled: "Cancelled",
  submitted: "Needs approval",
  approved: "Approved",
  rejected: "Rejected",
};

function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    ...options,
  }).format(new Date(value));
}

function formatTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-CA", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function hoursForEntry(entry: TimeEntry, now = new Date()) {
  const start = new Date(entry.start_time).getTime();
  const end = entry.end_time ? new Date(entry.end_time).getTime() : now.getTime();
  return Math.max(0, (end - start) / 3_600_000 - entry.break_minutes / 60);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function OperationsApp({
  initialData,
  demoMode,
}: {
  initialData: AppData;
  demoMode: boolean;
}) {
  const [section, setSection] = useState<Section>("overview");
  const [data, setData] = useState(initialData);
  const [modal, setModal] = useState<Modal>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const activeTimer = data.timeEntries.find(
    (entry) => entry.employee_id === data.profile.id && entry.status === "active",
  );

  const pendingEntries = data.timeEntries.filter((entry) => entry.status === "submitted");
  const activeJobs = data.jobs.filter((job) =>
    ["scheduled", "in_progress"].includes(job.status),
  );
  const weekHours = data.timeEntries.reduce(
    (total, entry) => total + hoursForEntry(entry, now),
    0,
  );

  const filteredClients = data.clients.filter((client) =>
    `${client.company_name} ${client.contact_name} ${client.city}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const filteredJobs = data.jobs.filter((job) =>
    `${job.job_number} ${job.title} ${job.city} ${job.service_type}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  function clientName(clientId: string) {
    return data.clients.find((client) => client.id === clientId)?.company_name ?? "Unknown customer";
  }

  function profileName(profileId: string) {
    return data.profiles.find((profile) => profile.id === profileId)?.full_name ?? "Unknown team member";
  }

  function jobName(jobId: string) {
    return data.jobs.find((job) => job.id === jobId)?.job_number ?? "Unknown job";
  }

  async function persistInsert<T>(
    table: string,
    record: Record<string, unknown>,
    fallback: T,
  ): Promise<T> {
    if (demoMode) return fallback;
    const supabase = createSupabaseClient();
    const { data: created, error } = await supabase.from(table).insert(record).select().single();
    if (error) throw error;
    return created as T;
  }

  async function addClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record = {
      organization_id: data.profile.organization_id,
      company_name: String(form.get("company_name")),
      contact_name: String(form.get("contact_name")),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      city: String(form.get("city") || ""),
      status: String(form.get("status")) as ClientStatus,
      source: String(form.get("source") || ""),
    };
    const fallback: Client = {
      id: newId("client"),
      created_at: new Date().toISOString(),
      ...record,
    };

    try {
      const created = await persistInsert<Client>("clients", record, fallback);
      setData((current) => ({ ...current, clients: [created, ...current.clients] }));
      setModal(null);
      setNotice("Customer added");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not add customer");
    }
  }

  async function addJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record = {
      organization_id: data.profile.organization_id,
      client_id: String(form.get("client_id")),
      job_number: String(form.get("job_number")),
      title: String(form.get("title")),
      service_type: String(form.get("service_type")),
      status: String(form.get("status")) as JobStatus,
      priority: String(form.get("priority")),
      city: String(form.get("city") || ""),
      scheduled_start: form.get("scheduled_start")
        ? new Date(String(form.get("scheduled_start"))).toISOString()
        : null,
      budget_hours: Number(form.get("budget_hours") || 0),
      notes: String(form.get("notes") || ""),
    };
    const fallback: Job = {
      id: newId("job"),
      created_at: new Date().toISOString(),
      ...record,
      priority: record.priority as Job["priority"],
    };

    try {
      const created = await persistInsert<Job>("jobs", record, fallback);
      setData((current) => ({ ...current, jobs: [created, ...current.jobs] }));
      setModal(null);
      setNotice("Job created");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not create job");
    }
  }

  async function addManualTime(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record = {
      organization_id: data.profile.organization_id,
      employee_id: data.profile.id,
      job_id: String(form.get("job_id")),
      start_time: new Date(String(form.get("start_time"))).toISOString(),
      end_time: new Date(String(form.get("end_time"))).toISOString(),
      break_minutes: Number(form.get("break_minutes") || 0),
      notes: String(form.get("notes") || ""),
      status: "submitted" as const,
    };
    const fallback: TimeEntry = { id: newId("time"), ...record };

    try {
      const created = await persistInsert<TimeEntry>("time_entries", record, fallback);
      setData((current) => ({
        ...current,
        timeEntries: [created, ...current.timeEntries],
      }));
      setModal(null);
      setNotice("Time submitted");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save time");
    }
  }

  async function startTimer(jobId: string) {
    if (!jobId || activeTimer) return;
    const record = {
      organization_id: data.profile.organization_id,
      employee_id: data.profile.id,
      job_id: jobId,
      start_time: new Date().toISOString(),
      break_minutes: 0,
      status: "active" as const,
    };
    const fallback: TimeEntry = { id: newId("time"), ...record };

    try {
      const created = await persistInsert<TimeEntry>("time_entries", record, fallback);
      setData((current) => ({
        ...current,
        timeEntries: [created, ...current.timeEntries],
      }));
      setNotice(`Clocked in to ${jobName(jobId)}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not start timer");
    }
  }

  async function stopTimer() {
    if (!activeTimer) return;
    const updates = { end_time: new Date().toISOString(), status: "submitted" as const };
    try {
      if (!demoMode) {
        const supabase = createSupabaseClient();
        const { error } = await supabase
          .from("time_entries")
          .update(updates)
          .eq("id", activeTimer.id);
        if (error) throw error;
      }
      setData((current) => ({
        ...current,
        timeEntries: current.timeEntries.map((entry) =>
          entry.id === activeTimer.id ? { ...entry, ...updates } : entry,
        ),
      }));
      setNotice("Time submitted for approval");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not stop timer");
    }
  }

  async function approveEntry(entryId: string) {
    const updates = {
      status: "approved" as const,
      approved_by: data.profile.id,
      approved_at: new Date().toISOString(),
    };
    try {
      if (!demoMode) {
        const supabase = createSupabaseClient();
        const { error } = await supabase
          .from("time_entries")
          .update(updates)
          .eq("id", entryId);
        if (error) throw error;
      }
      setData((current) => ({
        ...current,
        timeEntries: current.timeEntries.map((entry) =>
          entry.id === entryId ? { ...entry, ...updates } : entry,
        ),
      }));
      setNotice("Time entry approved");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not approve entry");
    }
  }

  function exportCsv() {
    const rows = [
      ["Employee", "Job", "Start", "End", "Break minutes", "Hours", "Status"],
      ...data.timeEntries.map((entry) => [
        profileName(entry.employee_id),
        jobName(entry.job_id),
        entry.start_time,
        entry.end_time ?? "",
        String(entry.break_minutes),
        hoursForEntry(entry).toFixed(2),
        entry.status,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `south-current-timesheets-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Timesheet CSV downloaded");
  }

  async function signOut() {
    if (demoMode) {
      setNotice("Demo mode has no active account");
      return;
    }
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const content = {
    overview: (
      <Overview
        data={data}
        now={now}
        activeJobs={activeJobs}
        pendingEntries={pendingEntries}
        weekHours={weekHours}
        clientName={clientName}
        profileName={profileName}
        jobName={jobName}
        activeTimer={activeTimer}
        startTimer={startTimer}
        stopTimer={stopTimer}
        goTo={setSection}
      />
    ),
    customers: (
      <Customers
        clients={filteredClients}
        jobs={data.jobs}
        search={search}
        setSearch={setSearch}
        openModal={() => setModal("client")}
      />
    ),
    jobs: (
      <Jobs
        jobs={filteredJobs}
        clients={data.clients}
        timeEntries={data.timeEntries}
        search={search}
        setSearch={setSearch}
        openModal={() => setModal("job")}
        clientName={clientName}
      />
    ),
    time: (
      <TimePage
        entries={data.timeEntries}
        pendingEntries={pendingEntries}
        profileName={profileName}
        jobName={jobName}
        approveEntry={approveEntry}
        openModal={() => setModal("time")}
        exportCsv={exportCsv}
        canApprove={data.profile.role !== "employee"}
      />
    ),
    team: <Team profiles={data.profiles} entries={data.timeEntries} jobName={jobName} />,
    reports: (
      <Reports
        entries={data.timeEntries}
        jobs={data.jobs}
        profiles={data.profiles}
        weekHours={weekHours}
        exportCsv={exportCsv}
      />
    ),
  }[section];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="logo-lockup">
            <span className="logo-symbol">
              <Zap size={21} strokeWidth={2.6} />
            </span>
            <span>
              <strong>South Current</strong>
              <small>OPERATIONS</small>
            </span>
          </div>
          <button className="icon-button mobile-close" onClick={() => setMobileNav(false)}>
            <X size={20} />
          </button>
        </div>
        <nav>
          <p className="nav-label">WORKSPACE</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={section === item.id ? "active" : ""}
                onClick={() => {
                  setSection(item.id);
                  setMobileNav(false);
                }}
              >
                <Icon size={19} />
                {item.label}
                {item.id === "time" && pendingEntries.length > 0 && (
                  <span className="nav-count">{pendingEntries.length}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <button>
            <Settings size={18} />
            Settings
          </button>
          <div className="profile-card">
            <span className="avatar">{initials(data.profile.full_name)}</span>
            <span className="profile-copy">
              <strong>{data.profile.full_name}</strong>
              <small>{data.profile.role}</small>
            </span>
            <button className="logout-button" onClick={signOut} title="Sign out">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {mobileNav && <button className="nav-scrim" onClick={() => setMobileNav(false)} />}

      <main className="main-content">
        <header className="topbar">
          <div className="page-heading">
            <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)}>
              <Menu size={22} />
            </button>
            <div>
              <h1>
                {section === "overview"
                  ? `${sectionCopy[section].title}, ${data.profile.full_name.split(" ")[0]}`
                  : sectionCopy[section].title}
              </h1>
              <p>{sectionCopy[section].subtitle}</p>
            </div>
          </div>
          <div className="top-actions">
            {demoMode && (
              <span className="demo-pill">
                <Activity size={14} />
                Live demo
              </span>
            )}
            <button className="secondary-button" onClick={() => setModal("time")}>
              <Clock3 size={17} />
              Add time
            </button>
            <button className="primary-button" onClick={() => setModal("job")}>
              <Plus size={18} />
              New job
            </button>
          </div>
        </header>
        <div className="page-body">{content}</div>
      </main>

      {modal && (
        <div className="modal-backdrop" onMouseDown={() => setModal(null)}>
          <section className="modal-card" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setModal(null)}>
              <X size={20} />
            </button>
            {modal === "client" && <ClientForm onSubmit={addClient} />}
            {modal === "job" && <JobForm clients={data.clients} onSubmit={addJob} />}
            {modal === "time" && <TimeForm jobs={activeJobs} onSubmit={addManualTime} />}
          </section>
        </div>
      )}

      {notice && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {notice}
        </div>
      )}
    </div>
  );
}

function Overview({
  data,
  now,
  activeJobs,
  pendingEntries,
  weekHours,
  clientName,
  profileName,
  jobName,
  activeTimer,
  startTimer,
  stopTimer,
  goTo,
}: {
  data: AppData;
  now: Date;
  activeJobs: Job[];
  pendingEntries: TimeEntry[];
  weekHours: number;
  clientName: (id: string) => string;
  profileName: (id: string) => string;
  jobName: (id: string) => string;
  activeTimer?: TimeEntry;
  startTimer: (jobId: string) => void;
  stopTimer: () => void;
  goTo: (section: Section) => void;
}) {
  const [selectedJob, setSelectedJob] = useState(activeJobs[0]?.id ?? "");
  const todayEntries = data.timeEntries.filter(
    (entry) => new Date(entry.start_time).toDateString() === now.toDateString(),
  );
  const approvedHours = data.timeEntries
    .filter((entry) => entry.status === "approved")
    .reduce((total, entry) => total + hoursForEntry(entry, now), 0);

  return (
    <>
      <section className="metric-grid">
        <MetricCard
          label="Active jobs"
          value={String(activeJobs.length)}
          note={`${data.jobs.filter((job) => job.status === "scheduled").length} scheduled next`}
          icon={BriefcaseBusiness}
          tone="teal"
        />
        <MetricCard
          label="Hours this week"
          value={weekHours.toFixed(1)}
          note={`${approvedHours.toFixed(1)} approved`}
          icon={Clock3}
          tone="blue"
        />
        <MetricCard
          label="Needs approval"
          value={String(pendingEntries.length)}
          note={`${pendingEntries.reduce((sum, entry) => sum + hoursForEntry(entry), 0).toFixed(1)} hours pending`}
          icon={ClipboardCheck}
          tone="amber"
        />
        <MetricCard
          label="Open leads"
          value={String(data.clients.filter((client) => client.status === "lead").length)}
          note={`${data.jobs.filter((job) => job.status === "quoted").length} quote awaiting decision`}
          icon={CircleDollarSign}
          tone="violet"
        />
      </section>

      <section className="dashboard-grid">
        <div className="panel schedule-panel">
          <PanelHeader
            eyebrow="TODAY · JULY 23"
            title="Field schedule"
            action="View jobs"
            onAction={() => goTo("jobs")}
          />
          <div className="timeline-list">
            {activeJobs.slice(0, 3).map((job, index) => (
              <div className="timeline-row" key={job.id}>
                <div className="timeline-time">
                  <strong>{formatTime(job.scheduled_start)}</strong>
                  <span>{index === 0 ? "Now" : formatDate(job.scheduled_start)}</span>
                </div>
                <span className={`timeline-dot dot-${index + 1}`} />
                <div className="timeline-job">
                  <div>
                    <span className="job-number">{job.job_number}</span>
                    <h3>{job.title}</h3>
                    <p>
                      {clientName(job.client_id)} · {job.city}
                    </p>
                  </div>
                  <span className={`status status-${job.status}`}>
                    {statusLabels[job.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`panel timer-panel ${activeTimer ? "timer-active" : ""}`}>
          <div className="timer-top">
            <div>
              <p className="eyebrow">{activeTimer ? "YOU’RE CLOCKED IN" : "QUICK CLOCK"}</p>
              <h2>{activeTimer ? jobName(activeTimer.job_id) : "Start your timer"}</h2>
            </div>
            <span className="timer-icon"><TimerReset size={24} /></span>
          </div>
          {activeTimer ? (
            <>
              <div className="timer-display">
                {Math.floor(hoursForEntry(activeTimer, now))
                  .toString()
                  .padStart(2, "0")}
                <span>:</span>
                {Math.floor((hoursForEntry(activeTimer, now) % 1) * 60)
                  .toString()
                  .padStart(2, "0")}
                <span>:</span>
                {Math.floor((hoursForEntry(activeTimer, now) * 3600) % 60)
                  .toString()
                  .padStart(2, "0")}
              </div>
              <p className="timer-meta">Started at {formatTime(activeTimer.start_time)} · No GPS collected</p>
              <button className="stop-button" onClick={stopTimer}>
                <Pause size={18} fill="currentColor" />
                Stop & submit
              </button>
            </>
          ) : (
            <>
              <label className="timer-select">
                Job
                <select value={selectedJob} onChange={(event) => setSelectedJob(event.target.value)}>
                  {activeJobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.job_number} · {job.title}
                    </option>
                  ))}
                </select>
              </label>
              <button className="clock-button" onClick={() => startTimer(selectedJob)}>
                <Play size={18} fill="currentColor" />
                Clock in
              </button>
              <p className="privacy-note"><ShieldCheck size={15} /> Timestamp only · location is never recorded</p>
            </>
          )}
        </div>
      </section>

      <section className="dashboard-grid lower-grid">
        <div className="panel">
          <PanelHeader
            eyebrow="TEAM ACTIVITY"
            title="Today in the field"
            action="View team"
            onAction={() => goTo("team")}
          />
          <div className="activity-list">
            {todayEntries.length ? (
              todayEntries.slice(0, 4).map((entry) => (
                <div className="activity-row" key={entry.id}>
                  <span className="avatar small">{initials(profileName(entry.employee_id))}</span>
                  <div>
                    <strong>{profileName(entry.employee_id)}</strong>
                    <p>{jobName(entry.job_id)} · {hoursForEntry(entry, now).toFixed(1)}h</p>
                  </div>
                  <span className={`status status-${entry.status}`}>
                    {entry.status === "active" ? "Clocked in" : statusLabels[entry.status]}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState icon={Clock3} text="No time has been entered today." />
            )}
          </div>
        </div>
        <div className="panel">
          <PanelHeader
            eyebrow="FOLLOW-UP"
            title="Sales pipeline"
            action="View customers"
            onAction={() => goTo("customers")}
          />
          <div className="pipeline">
            {[
              ["New leads", data.clients.filter((client) => client.status === "lead").length, 26],
              ["Quotes sent", data.jobs.filter((job) => job.status === "quoted").length, 48],
              ["Scheduled", data.jobs.filter((job) => job.status === "scheduled").length, 74],
            ].map(([label, value, width]) => (
              <div className="pipeline-row" key={String(label)}>
                <span>{label}</span>
                <div className="progress"><i style={{ width: `${width}%` }} /></div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Customers({
  clients,
  jobs,
  search,
  setSearch,
  openModal,
}: {
  clients: Client[];
  jobs: Job[];
  search: string;
  setSearch: (value: string) => void;
  openModal: () => void;
}) {
  return (
    <section className="panel table-panel">
      <div className="table-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customers…"
          />
        </div>
        <div className="toolbar-actions">
          <button className="secondary-button"><ListFilter size={17} /> Filter</button>
          <button className="primary-button" onClick={openModal}><Plus size={18} /> Add customer</button>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Status</th>
              <th>Jobs</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>
                  <div className="customer-cell">
                    <span className="company-icon">{initials(client.company_name)}</span>
                    <div><strong>{client.company_name}</strong><small>Added {formatDate(client.created_at)}</small></div>
                  </div>
                </td>
                <td><strong className="table-main">{client.contact_name}</strong><small>{client.email || client.phone}</small></td>
                <td>{client.city || "—"}</td>
                <td><span className={`status status-${client.status}`}>{statusLabels[client.status]}</span></td>
                <td>{jobs.filter((job) => job.client_id === client.id).length}</td>
                <td><button className="row-menu"><MoreHorizontal size={19} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Jobs({
  jobs,
  clients,
  timeEntries,
  search,
  setSearch,
  openModal,
  clientName,
}: {
  jobs: Job[];
  clients: Client[];
  timeEntries: TimeEntry[];
  search: string;
  setSearch: (value: string) => void;
  openModal: () => void;
  clientName: (id: string) => string;
}) {
  return (
    <>
      <section className="filter-summary">
        {(["lead", "quoted", "scheduled", "in_progress", "complete"] as JobStatus[]).map((status) => (
          <div key={status}><span className={`status-dot status-${status}`} /><strong>{jobs.filter((job) => job.status === status).length}</strong><small>{statusLabels[status]}</small></div>
        ))}
      </section>
      <section className="panel table-panel">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search jobs…" />
          </div>
          <button className="primary-button" onClick={openModal}><Plus size={18} /> New job</button>
        </div>
        <div className="job-card-grid">
          {jobs.map((job) => {
            const actualHours = timeEntries
              .filter((entry) => entry.job_id === job.id)
              .reduce((total, entry) => total + hoursForEntry(entry), 0);
            const client = clients.find((item) => item.id === job.client_id);
            return (
              <article className="job-card" key={job.id}>
                <div className="job-card-top">
                  <span className="job-number">{job.job_number}</span>
                  <span className={`status status-${job.status}`}>{statusLabels[job.status]}</span>
                </div>
                <h3>{job.title}</h3>
                <p>{clientName(job.client_id)}</p>
                <div className="job-meta">
                  <span><Building2 size={15} /> {client?.city || job.city || "No location"}</span>
                  <span><CalendarDays size={15} /> {formatDate(job.scheduled_start)}</span>
                </div>
                <div className="hours-row">
                  <div><small>Actual hours</small><strong>{actualHours.toFixed(1)}</strong></div>
                  <div><small>Budget</small><strong>{job.budget_hours || 0}h</strong></div>
                  <div className="mini-progress"><i style={{ width: `${Math.min(100, (actualHours / (job.budget_hours || 1)) * 100)}%` }} /></div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

function TimePage({
  entries,
  pendingEntries,
  profileName,
  jobName,
  approveEntry,
  openModal,
  exportCsv,
  canApprove,
}: {
  entries: TimeEntry[];
  pendingEntries: TimeEntry[];
  profileName: (id: string) => string;
  jobName: (id: string) => string;
  approveEntry: (id: string) => void;
  openModal: () => void;
  exportCsv: () => void;
  canApprove: boolean;
}) {
  const approved = entries.filter((entry) => entry.status === "approved");
  return (
    <>
      <section className="metric-grid compact">
        <MetricCard label="Submitted" value={String(pendingEntries.length)} note={`${pendingEntries.reduce((sum, entry) => sum + hoursForEntry(entry), 0).toFixed(1)} hours`} icon={FileClock} tone="amber" />
        <MetricCard label="Approved" value={String(approved.length)} note={`${approved.reduce((sum, entry) => sum + hoursForEntry(entry), 0).toFixed(1)} hours`} icon={CheckCircle2} tone="teal" />
        <MetricCard label="This pay period" value={`${entries.reduce((sum, entry) => sum + hoursForEntry(entry), 0).toFixed(1)}h`} note="All team members" icon={Clock3} tone="blue" />
      </section>
      <section className="panel table-panel">
        <div className="table-toolbar">
          <div><p className="eyebrow">CURRENT PAY PERIOD</p><h2>Timesheets</h2></div>
          <div className="toolbar-actions">
            <button className="secondary-button" onClick={exportCsv}><ArrowDownToLine size={17} /> Export CSV</button>
            <button className="primary-button" onClick={openModal}><Plus size={18} /> Add time</button>
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Employee</th><th>Job</th><th>Date</th><th>Time</th><th>Hours</th><th>Status</th><th /></tr></thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td><div className="person-cell"><span className="avatar tiny">{initials(profileName(entry.employee_id))}</span><strong>{profileName(entry.employee_id)}</strong></div></td>
                  <td><strong className="table-main">{jobName(entry.job_id)}</strong><small>{entry.notes || "No notes"}</small></td>
                  <td>{formatDate(entry.start_time)}</td>
                  <td>{formatTime(entry.start_time)} – {formatTime(entry.end_time)}</td>
                  <td><strong>{hoursForEntry(entry).toFixed(2)}</strong></td>
                  <td><span className={`status status-${entry.status}`}>{entry.status === "active" ? "Clocked in" : statusLabels[entry.status]}</span></td>
                  <td>
                    {canApprove && entry.status === "submitted" ? (
                      <button className="approve-button" onClick={() => approveEntry(entry.id)}><Check size={16} /> Approve</button>
                    ) : <button className="row-menu"><MoreHorizontal size={19} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Team({
  profiles,
  entries,
  jobName,
}: {
  profiles: AppData["profiles"];
  entries: TimeEntry[];
  jobName: (id: string) => string;
}) {
  return (
    <section className="team-grid">
      {profiles.map((profile) => {
        const active = entries.find((entry) => entry.employee_id === profile.id && entry.status === "active");
        const total = entries.filter((entry) => entry.employee_id === profile.id).reduce((sum, entry) => sum + hoursForEntry(entry), 0);
        return (
          <article className="panel team-card" key={profile.id}>
            <div className="team-card-top">
              <span className="avatar large">{initials(profile.full_name)}</span>
              <span className={`availability ${active ? "working" : ""}`}>{active ? "On the clock" : "Available"}</span>
            </div>
            <h3>{profile.full_name}</h3>
            <p>{profile.role}</p>
            <div className="team-details">
              <span><Clock3 size={16} /><strong>{total.toFixed(1)}h</strong> recorded</span>
              <span><BriefcaseBusiness size={16} />{active ? jobName(active.job_id) : "No active timer"}</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function Reports({
  entries,
  jobs,
  profiles,
  weekHours,
  exportCsv,
}: {
  entries: TimeEntry[];
  jobs: Job[];
  profiles: AppData["profiles"];
  weekHours: number;
  exportCsv: () => void;
}) {
  const maxHours = Math.max(
    1,
    ...profiles.map((profile) =>
      entries.filter((entry) => entry.employee_id === profile.id).reduce((sum, entry) => sum + hoursForEntry(entry), 0),
    ),
  );
  return (
    <>
      <section className="report-hero panel">
        <div><p className="eyebrow">LABOUR SNAPSHOT</p><h2>{weekHours.toFixed(1)} team hours</h2><p>Recorded across {new Set(entries.map((entry) => entry.job_id)).size} active jobs this pay period.</p></div>
        <button className="primary-button" onClick={exportCsv}><ArrowDownToLine size={17} /> Payroll CSV</button>
      </section>
      <section className="dashboard-grid report-grid">
        <div className="panel">
          <PanelHeader eyebrow="BY EMPLOYEE" title="Recorded hours" />
          <div className="bar-list">
            {profiles.map((profile) => {
              const total = entries.filter((entry) => entry.employee_id === profile.id).reduce((sum, entry) => sum + hoursForEntry(entry), 0);
              return (
                <div className="bar-row" key={profile.id}>
                  <span className="avatar tiny">{initials(profile.full_name)}</span>
                  <span>{profile.full_name}</span>
                  <div className="bar-track"><i style={{ width: `${(total / maxHours) * 100}%` }} /></div>
                  <strong>{total.toFixed(1)}h</strong>
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel">
          <PanelHeader eyebrow="JOB HEALTH" title="Budget utilization" />
          <div className="utilization-list">
            {jobs.filter((job) => job.budget_hours).slice(0, 5).map((job) => {
              const actual = entries.filter((entry) => entry.job_id === job.id).reduce((sum, entry) => sum + hoursForEntry(entry), 0);
              const percent = Math.round((actual / (job.budget_hours || 1)) * 100);
              return (
                <div key={job.id}>
                  <div><span>{job.job_number}</span><strong>{percent}%</strong></div>
                  <div className="progress"><i style={{ width: `${Math.min(percent, 100)}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Clock3;
  tone: string;
}) {
  return (
    <article className="metric-card">
      <div><p>{label}</p><strong>{value}</strong><span>{note}</span></div>
      <span className={`metric-icon ${tone}`}><Icon size={21} /></span>
    </article>
  );
}

function PanelHeader({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="panel-header">
      <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
      {action && <button onClick={onAction}>{action}<ArrowUpRight size={16} /></button>}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Clock3; text: string }) {
  return <div className="empty-state"><Icon size={25} /><p>{text}</p></div>;
}

function ClientForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="entry-form" onSubmit={onSubmit}>
      <p className="eyebrow">NEW CRM RECORD</p><h2>Add a customer</h2><p className="form-intro">Capture the essentials now. Notes and jobs can be added afterward.</p>
      <div className="form-grid">
        <label className="span-2">Company or household name<input name="company_name" required autoFocus /></label>
        <label>Primary contact<input name="contact_name" required /></label>
        <label>Status<select name="status" defaultValue="lead"><option value="lead">Lead</option><option value="active">Active customer</option><option value="inactive">Inactive</option></select></label>
        <label>Email<input name="email" type="email" /></label>
        <label>Phone<input name="phone" type="tel" /></label>
        <label>City or town<input name="city" /></label>
        <label>Lead source<select name="source"><option>Referral</option><option>Website</option><option>Google</option><option>Existing customer</option><option>Other</option></select></label>
      </div>
      <button className="primary-button full-button">Add customer<ArrowUpRight size={18} /></button>
    </form>
  );
}

function JobForm({
  clients,
  onSubmit,
}: {
  clients: Client[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="entry-form" onSubmit={onSubmit}>
      <p className="eyebrow">NEW WORK ORDER</p><h2>Create a job</h2><p className="form-intro">Set the scope and schedule. Crew assignments can follow.</p>
      <div className="form-grid">
        <label>Job number<input name="job_number" placeholder="SC-26083" required /></label>
        <label>Customer<select name="client_id" required>{clients.map((client) => <option key={client.id} value={client.id}>{client.company_name}</option>)}</select></label>
        <label className="span-2">Job title<input name="title" required autoFocus /></label>
        <label>Service<select name="service_type"><option>Residential</option><option>Commercial</option><option>Solar</option><option>LED Lighting</option><option>Generator</option><option>Data / Voice</option><option>Directional Boring</option><option>Service Call</option></select></label>
        <label>Status<select name="status" defaultValue="scheduled"><option value="lead">Lead</option><option value="quoted">Quoted</option><option value="scheduled">Scheduled</option><option value="in_progress">In progress</option></select></label>
        <label>Priority<select name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
        <label>Budget hours<input name="budget_hours" type="number" min="0" step="0.5" /></label>
        <label>City or town<input name="city" /></label>
        <label>Scheduled start<input name="scheduled_start" type="datetime-local" /></label>
        <label className="span-2">Scope notes<textarea name="notes" rows={3} /></label>
      </div>
      <button className="primary-button full-button">Create job<ArrowUpRight size={18} /></button>
    </form>
  );
}

function TimeForm({
  jobs,
  onSubmit,
}: {
  jobs: Job[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="entry-form" onSubmit={onSubmit}>
      <p className="eyebrow">MANUAL ENTRY</p><h2>Add job time</h2><p className="form-intro">Enter worked time for review. Location information is never requested.</p>
      <div className="form-grid">
        <label className="span-2">Job<select name="job_id" required>{jobs.map((job) => <option key={job.id} value={job.id}>{job.job_number} · {job.title}</option>)}</select></label>
        <label>Started<input name="start_time" type="datetime-local" required /></label>
        <label>Finished<input name="end_time" type="datetime-local" required /></label>
        <label>Unpaid break (minutes)<input name="break_minutes" type="number" min="0" step="5" defaultValue="0" /></label>
        <label className="span-2">Work notes<textarea name="notes" rows={3} placeholder="What did you complete?" /></label>
      </div>
      <div className="privacy-callout"><ShieldCheck size={18} /><span><strong>Privacy first</strong>No GPS or background location collection.</span></div>
      <button className="primary-button full-button">Submit time<ArrowUpRight size={18} /></button>
    </form>
  );
}
