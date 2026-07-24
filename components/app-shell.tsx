'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Clock,
  CalendarDays,
  FileBarChart,
  HardHat,
  ClipboardCheck,
  ChevronsUpDown,
  Check,
  Eye,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  { href: '/employees', label: 'Employees', icon: HardHat },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/time', label: 'Time Approvals', icon: ClipboardCheck },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/reports', label: 'Reports', icon: FileBarChart },
]

const EMPLOYEE_NAV: NavItem[] = [
  { href: '/', label: 'Work', icon: Clock },
  { href: '/jobs', label: 'My Jobs', icon: Briefcase },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/time', label: 'My Time', icon: FileBarChart },
]

function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const {
    employees,
    currentUser,
    authenticatedUser,
    isPreviewMode,
    canPreviewRoles,
    setCurrentUserId,
    exitPreview,
    cloudMode,
    signOut,
  } = useStore()
  const previewEmployees = employees.filter((employee) => employee.role === 'employee')
  const switchView = (employeeId: string) => {
    setCurrentUserId(employeeId)
    if (cloudMode) {
      window.location.assign(`${window.location.origin}/`)
    } else {
      router.push('/')
    }
  }
  const returnToAdmin = () => {
    exitPreview()
    if (cloudMode) {
      window.location.assign(`${window.location.origin}/`)
    } else {
      router.push('/')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className={cn(
              'flex items-center rounded-lg border border-sidebar-border bg-sidebar-accent/40 text-left transition-colors hover:bg-sidebar-accent',
              compact ? 'size-11 justify-center p-1.5' : 'w-full gap-3 p-2',
            )}
            aria-label="Switch role view"
          >
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>
            <div className={cn('min-w-0 flex-1', compact && 'hidden')}>
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {currentUser.name}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {currentUser.role === 'admin'
                  ? 'Admin'
                  : currentUser.role === 'manager'
                    ? 'Manager'
                    : 'Employee'}
                {isPreviewMode && ' preview'}
              </p>
            </div>
            {isPreviewMode && !compact && (
              <Badge className="hidden bg-primary/15 text-primary hover:bg-primary/15 lg:inline-flex">
                Preview
              </Badge>
            )}
            <ChevronsUpDown
              className={cn(
                'size-4 text-sidebar-foreground/60',
                compact && 'absolute translate-x-3 translate-y-3 rounded-full bg-sidebar p-0.5',
              )}
            />
          </button>
        }
      />
      <DropdownMenuContent
        align="end"
        className="w-[min(18rem,calc(100vw-1rem))]"
      >
        <DropdownMenuLabel>
          {cloudMode ? (
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-3.5" />
              Signed in as {authenticatedUser.name}
            </span>
          ) : 'Switch role view'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {cloudMode ? (
          <>
            {isPreviewMode && (
              <>
                <DropdownMenuItem onClick={returnToAdmin} className="gap-2 py-2">
                  <ShieldCheck className="size-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Return to admin view</p>
                    <p className="text-xs text-muted-foreground">
                      {authenticatedUser.name}
                    </p>
                  </div>
                  <Check className="size-4 text-primary" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {canPreviewRoles && (
              <>
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Eye className="size-3.5" />
                  Preview employee experience
                </DropdownMenuLabel>
                {previewEmployees.map((employee) => (
                  <DropdownMenuItem
                    key={employee.id}
                    onClick={() => switchView(employee.id)}
                    className="gap-2 py-2"
                  >
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[10px] font-semibold">
                        {employee.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{employee.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {employee.title}
                      </p>
                    </div>
                    {employee.id === currentUser.id && (
                      <Check className="size-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
                {!previewEmployees.length && (
                  <p className="px-2 py-2 text-xs text-muted-foreground">
                    Add an employee to preview the field experience.
                  </p>
                )}
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem onClick={signOut} className="gap-2">
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </>
        ) : employees.map((e) => (
          <DropdownMenuItem
            key={e.id}
            onClick={() => switchView(e.id)}
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
  const router = useRouter()
  const {
    isAdmin,
    isPreviewMode,
    currentUser,
    authenticatedUser,
    exitPreview,
  } = useStore()
  const items = isAdmin ? ADMIN_NAV : EMPLOYEE_NAV
  const adminViewLabel =
    authenticatedUser.role === 'manager' ? 'Manager View' : 'Admin View'
  const employeeRouteAllowed = EMPLOYEE_NAV.some((item) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
  )

  useEffect(() => {
    if (!isAdmin && !employeeRouteAllowed) router.replace('/')
  }, [employeeRouteAllowed, isAdmin, router])

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar md:flex">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-4">
          <Image
            src="/brand/south-current-mark.png"
            alt="South Current Electric"
            width={48}
            height={48}
            className="size-12 shrink-0 object-contain"
            priority
          />
          <div className="leading-tight">
            <p className="text-sm font-bold text-primary">
              South Current
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
              Electric Ops
            </p>
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
      <div className="fixed inset-x-0 top-0 z-30 flex min-h-16 items-center justify-between border-b border-sidebar-border bg-sidebar px-3 py-2 md:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/brand/south-current-mark.png"
            alt="South Current Electric"
            width={40}
            height={40}
            className="size-10 object-contain"
            priority
          />
          <div className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-bold text-primary">
              South Current
            </span>
            <span className="block text-[9px] uppercase tracking-[0.16em] text-sidebar-foreground/55">
              Electric Ops
            </span>
          </div>
        </div>
        <RoleSwitcher compact />
      </div>

      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <nav
          className={cn(
            'md:hidden',
            isAdmin
              ? 'sticky top-16 z-20 mt-16 flex w-full min-w-0 max-w-[100vw] gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
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
                    ? 'flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium'
                    : 'flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[11px] font-medium',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground',
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        {isPreviewMode && (
          <div className="sticky top-16 z-20 mt-16 border-b border-primary/25 bg-primary/10 px-4 py-3 backdrop-blur md:top-0 md:mt-0 md:px-8">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Eye className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    Employee Preview — {currentUser.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Time controls are read-only while previewing.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="bg-background"
                onClick={() => {
                  exitPreview()
                  window.location.assign(`${window.location.origin}/`)
                }}
              >
                <ShieldCheck />
                Return to {adminViewLabel}
              </Button>
            </div>
          </div>
        )}
        <main
          className={cn(
            'min-w-0 flex-1 px-3 py-5 sm:px-4 md:px-8 md:py-8',
            !isAdmin &&
              (isPreviewMode
                ? 'pb-24 pt-6 md:pb-8 md:pt-8'
                : 'pb-24 pt-24 md:pb-8 md:pt-8'),
          )}
        >
          {(isAdmin || employeeRouteAllowed) && children}
        </main>
      </div>
    </div>
  )
}
