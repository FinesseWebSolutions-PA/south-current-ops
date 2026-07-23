'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Clock,
  CalendarDays,
  FileBarChart,
  ClipboardCheck,
  Zap,
  ChevronsUpDown,
  Check,
  LogOut,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
}

const ADMIN_NAV: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/time', label: 'Time Approvals', icon: ClipboardCheck },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/reports', label: 'Reports', icon: FileBarChart },
]

const EMPLOYEE_NAV: NavItem[] = [
  { href: '/', label: 'My Day', icon: Clock },
  { href: '/jobs', label: 'My Jobs', icon: Briefcase },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/time', label: 'My Time', icon: FileBarChart },
]

function RoleSwitcher() {
  const { employees, currentUser, setCurrentUserId, cloudMode, signOut } = useStore()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2 text-left transition-colors hover:bg-sidebar-accent">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {currentUser.name}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {currentUser.role === 'admin'
                  ? 'Admin'
                  : currentUser.role === 'manager'
                    ? 'Manager'
                    : 'Employee'}
              </p>
            </div>
            <ChevronsUpDown className="size-4 text-sidebar-foreground/60" />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>
          {cloudMode ? 'Signed-in account' : 'Switch user (demo)'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {cloudMode ? (
          <DropdownMenuItem onClick={signOut} className="gap-2">
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        ) : employees.map((e) => (
          <DropdownMenuItem
            key={e.id}
            onClick={() => setCurrentUserId(e.id)}
            className="gap-2"
          >
            <Avatar className="size-7">
              <AvatarFallback className="text-[10px] font-semibold">
                {e.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{e.name}</p>
              <p className="truncate text-xs text-muted-foreground">{e.title}</p>
            </div>
            {e.id === currentUser.id && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isAdmin } = useStore()
  const items = isAdmin ? ADMIN_NAV : EMPLOYEE_NAV

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
            <Zap className="size-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-sidebar-foreground">
              South Current
            </p>
            <p className="text-xs text-sidebar-foreground/60">Operations</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {items.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                )}
              >
                <Icon className="size-4.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <RoleSwitcher />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="size-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground">
            South Current
          </span>
        </div>
        <RoleSwitcher />
      </div>

      <div className="flex flex-1 flex-col md:pl-64">
        <nav
          className={cn(
            'md:hidden',
            isAdmin
              ? 'mt-16 flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2'
              : 'fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-card px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-lg',
          )}
        >
          {items.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  isAdmin
                    ? 'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium'
                    : 'flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[11px] font-medium',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {!isAdmin && <Icon className="size-4" />}
                {item.label}
              </Link>
            )
          })}
        </nav>
        <main
          className={cn(
            'flex-1 px-4 py-6 md:px-8 md:py-8',
            !isAdmin && 'pb-24 pt-24 md:pb-8 md:pt-8',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
