import * as React from "react"
import { Link, useLocation } from "wouter"
import { FileText, Layers, ShieldCheck, UserRoundCog, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePortalAuth } from "@/App"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const { user, logout } = usePortalAuth()
  const displayName = user?.name || user?.username || "Signed-in user"

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
               Drawing Library
            </h1>
             <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
               Drawing reviews
            </p>
             <p className="mt-1 truncate text-xs text-sidebar-foreground/70" title={displayName}>{displayName}</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Link href="/drawings" className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            location.startsWith("/drawings") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}>
            <FileText className="w-4 h-4" />
             <span>Library</span>
          </Link>
          <Link href="/assignments" className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            location.startsWith("/assignments") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}>
            <Users className="w-4 h-4" />
            <span>Assignments</span>
          </Link>
          <Link href="/users" className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            location.startsWith("/users") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}>
            <UserRoundCog className="w-4 h-4" />
            <span>Users</span>
          </Link>
          <Link href="/feed" className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            location.startsWith("/feed") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}>
            <FileText className="w-4 h-4" />
            <span>My Feed</span>
          </Link>
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
          <button type="button" onClick={() => void logout()} className="w-full rounded-md px-3 py-2 text-left text-xs text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
            Sign out
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

