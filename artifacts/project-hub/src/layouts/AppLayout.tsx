import * as React from "react"
import { Link, useLocation } from "wouter"
import { FileText, LayoutDashboard, Settings, Layers, LogIn, LogOut } from "lucide-react"
import { Show, SignInButton, useClerk } from "@clerk/react"
import { cn } from "@/lib/utils"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const { signOut } = useClerk()

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
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button type="button" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
                <LogIn className="w-4 h-4" />
                <span>Sign in to upload</span>
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <button type="button" onClick={() => signOut({ redirectUrl: basePathOrRoot() })} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </Show>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col relative">
        {children}
      </main>
    </div>
  )
}

function basePathOrRoot() {
  return import.meta.env.BASE_URL || "/"
}
