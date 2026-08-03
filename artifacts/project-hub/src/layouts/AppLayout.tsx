import * as React from "react"
import { Link, useLocation } from "wouter"
import { Archive, Bell, BookOpen, CalendarDays, FileText, FolderKanban, FolderOpen, Layers, ListChecks, LogOut, MessageSquare, ClipboardCheck, Settings, ShieldCheck, Users, UserRoundCog, FileWarning, LayoutDashboard } from "lucide-react"
import { getListNotificationsQueryKey, useListNotifications } from "@workspace/api-client-react"
import { cn } from "@/lib/utils"
import { usePortalAuth } from "@/App"
import { UniversalSearch } from "@/components/UniversalSearch"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const { user, logout } = usePortalAuth()
  const displayName = user?.name || user?.username || "Signed-in user"
  const notificationsQuery = useListNotifications({
    query: {
      queryKey: getListNotificationsQueryKey(),
      refetchInterval: 5000,
    },
  })
  const unreadNotifications = (notificationsQuery.data ?? []).filter((notification) => !notification.readAt).length

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background w-full">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r bg-sidebar shrink-0 flex flex-col">
        <div className="p-4 border-b border-sidebar-border/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
            <Layers className="text-primary-foreground w-4 h-4" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-sidebar-foreground">
               Design Sense Architects
            </h1>
             <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
               Drawing Library
            </p>
             <p className="mt-1 truncate text-xs text-sidebar-foreground/70" title={displayName}>{displayName}</p>
          </div>
        </div>
        <div className="border-b border-sidebar-border/50 p-3">
          <UniversalSearch />
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <Link href="/dashboard" className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", location.startsWith("/dashboard") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
            <LayoutDashboard className="h-4 w-4" /><span>Dashboard</span>
          </Link>
          <Link href="/drawings" className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            location.startsWith("/drawings") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}>
            <FileText className="w-4 h-4" />
            <span>Drawing Library</span>
          </Link>
          <Link href="/projects" className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", location.startsWith("/projects") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
            <FolderKanban className="h-4 w-4" /><span>Projects</span>
          </Link>
          <Link href="/assignments" className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            location.startsWith("/assignments") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}>
            <Users className="w-4 h-4" />
            <span>Assignments</span>
          </Link>
          <Link href="/review-queue" className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", location.startsWith("/review-queue") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
            <ClipboardCheck className="h-4 w-4" /><span>Review Queue</span>
          </Link>
          <Link href="/deadlines" className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", location.startsWith("/deadlines") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
            <CalendarDays className="h-4 w-4" /><span>Deadlines</span>
          </Link>
          <Link href="/feed" className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            location.startsWith("/feed") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}>
            <FileText className="w-4 h-4" />
            <span>My Feed</span>
          </Link>
          <div className="px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">Coordination</div>
          <Link href="/checklists" className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            location.startsWith("/checklists") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}>
            <ListChecks className="w-4 h-4" />
            <span>Checklists</span>
          </Link>
          <Link href="/chat" className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            location.startsWith("/chat") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}>
            <MessageSquare className="w-4 h-4" />
            <span>Team Chat</span>
          </Link>
          <Link href="/notifications" className={cn("flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", location.startsWith("/notifications") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
            <span className="flex items-center gap-3"><Bell className="h-4 w-4" /><span>Notifications</span></span>
            {unreadNotifications > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}
          </Link>
          <Link href="/activity" className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", location.startsWith("/activity") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
            <Layers className="h-4 w-4" /><span>Activity</span>
          </Link>
          <div className="px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">Reference</div>
          <Link href="/standards" className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", location.startsWith("/standards") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
            <BookOpen className="h-4 w-4" /><span>Standards</span>
          </Link>
          <Link href="/issues" className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", location.startsWith("/issues") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
            <FileWarning className="h-4 w-4" /><span>Issue Register</span>
          </Link>
          <Link href="/files" className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", location.startsWith("/files") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
            <FolderOpen className="h-4 w-4" /><span>Files</span>
          </Link>
          <Link href="/archive" className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", location.startsWith("/archive") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
            <Archive className="h-4 w-4" /><span>Archive</span>
          </Link>
          <div className="px-3 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">Account</div>
          <Link href="/settings" className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", location.startsWith("/settings") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
            <Settings className="h-4 w-4" /><span>Settings</span>
          </Link>
          {user?.role === "admin" && (
            <Link href="/users" className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              location.startsWith("/users") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}>
              <UserRoundCog className="w-4 h-4" />
              <span>Users</span>
            </Link>
          )}
          {user?.role === "admin" && (
            <Link href="/admin" className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              location.startsWith("/admin") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}>
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          )}
        </nav>
        <div className="border-t border-sidebar-border/50 p-3">
          <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-2 rounded-md border border-sidebar-border/70 px-3 py-2 text-left text-xs font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col relative">
        {children}
      </main>
    </div>
  )
}

