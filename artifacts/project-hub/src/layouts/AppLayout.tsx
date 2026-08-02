import * as React from "react"
import { Link, useLocation } from "wouter"
import { FileText, LayoutDashboard, Settings, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()

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
              Drawing Register
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
              Project Hub
            </p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Link href="/" className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            location === "/" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <Link href="/drawings" className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            location.startsWith("/drawings") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          )}>
            <FileText className="w-4 h-4" />
            <span>Register</span>
          </Link>
        </nav>
        <div className="p-3 mt-auto border-t border-sidebar-border/50">
          <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-sidebar-foreground/60">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col relative">
        {children}
      </main>
    </div>
  )
}

