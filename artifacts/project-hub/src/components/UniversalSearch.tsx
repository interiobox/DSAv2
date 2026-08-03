import * as React from "react"
import { useLocation } from "wouter"
import { Activity, Bell, BookOpen, CalendarDays, CheckSquare, FileText, FolderKanban, LayoutDashboard, MessageSquare, Search, Settings, Users } from "lucide-react"
import {
  useListActivity,
  useListCategories,
  useListDrawings,
  useListProjects,
  useListUsers,
} from "@workspace/api-client-react"

import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { usePortalAuth } from "@/App"

type SearchResult = {
  id: string
  label: string
  detail?: string
  group: string
  icon: React.ElementType
  href: string
}

export function UniversalSearch() {
  const { user } = usePortalAuth()
  const [, setLocation] = useLocation()
  const [open, setOpen] = React.useState(false)
  const { data: drawings } = useListDrawings()
  const { data: projects } = useListProjects()
  const { data: categories } = useListCategories()
  const { data: users } = useListUsers()
  const { data: activity } = useListActivity()

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const results = React.useMemo<SearchResult[]>(() => {
    const navigationResults = [
      { label: "Dashboard", detail: "Overview and drawing status", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Drawing Library", detail: "Browse and manage drawings", icon: FileText, href: "/drawings" },
      { label: "Projects", detail: "Project-level drawing register", icon: FolderKanban, href: "/projects" },
      { label: "Assignments", detail: "Assigned drawing workload", icon: Users, href: "/assignments" },
      { label: "Review Queue", detail: "Drawings waiting for review", icon: CheckSquare, href: "/review-queue" },
      { label: "Deadlines", detail: "Upcoming drawing deadlines", icon: CalendarDays, href: "/deadlines" },
      { label: "My Feed", detail: "Your assigned work and activity", icon: FileText, href: "/feed" },
      { label: "Team Chat", detail: "Project coordination conversations", icon: MessageSquare, href: "/chat" },
      { label: "Notifications", detail: "Your unread updates", icon: Bell, href: "/notifications" },
      { label: "Activity", detail: "Full drawing activity history", icon: Activity, href: "/activity" },
      { label: "Settings", detail: "Personal preferences and categories", icon: Settings, href: "/settings" },
    ].map((item) => ({
      ...item,
      id: `navigation-${item.href}`,
      group: "Navigation",
    }))
    const drawingResults = (drawings ?? []).map((drawing) => ({
      id: `drawing-${drawing.id}`,
      label: drawing.title,
      detail: `${drawing.drawingNumber} · ${drawing.projectName} · ${drawing.status.replace("_", " ")}`,
      group: "Drawings",
      icon: FileText,
      href: `/drawings/${drawing.id}`,
    }))
    const projectResults = (projects ?? []).map((project) => ({
      id: `project-${project.id}`,
      label: project.name,
      detail: "Project drawing register",
      group: "Projects",
      icon: FolderKanban,
      href: "/projects",
    }))
    const categoryResults = (categories ?? []).map((category) => ({
      id: `category-${category.id}`,
      label: category.name,
      detail: "Drawing category",
      group: "Categories",
      icon: BookOpen,
      href: "/settings",
    }))
    const userResults = (users ?? []).map((person) => ({
      id: `user-${person.id}`,
      label: person.name,
      detail: "Available for drawing assignments",
      group: "People",
      icon: Users,
      href: user?.role === "admin" ? "/users" : "/assignments",
    }))
    const activityResults = (activity ?? []).slice(0, 20).map((item) => ({
      id: `activity-${item.id}`,
      label: item.message,
      detail: item.actor ? `${item.actor} · ${new Date(item.createdAt).toLocaleDateString()}` : new Date(item.createdAt).toLocaleDateString(),
      group: "Activity",
      icon: Activity,
      href: item.drawingId ? `/drawings/${item.drawingId}` : "/activity",
    }))
    return [...navigationResults, ...drawingResults, ...projectResults, ...categoryResults, ...userResults, ...activityResults]
  }, [activity, categories, drawings, projects, user?.role, users])

  const groupedResults = React.useMemo(() => {
    const groups = new Map<string, SearchResult[]>()
    for (const result of results) {
      const current = groups.get(result.group) ?? []
      current.push(result)
      groups.set(result.group, current)
    }
    return groups
  }, [results])

  function selectResult(href: string) {
    setOpen(false)
    setLocation(href)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-9 w-full justify-between border-sidebar-border/70 bg-sidebar-accent/30 px-3 text-sidebar-foreground/70 shadow-none hover:bg-sidebar-accent hover:text-sidebar-foreground"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span>Search library...</span>
        </span>
        <CommandShortcut className="rounded border border-sidebar-border/70 px-1.5 py-0.5 text-[10px]">⌘K</CommandShortcut>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search drawings, projects, people, categories..." />
        <CommandList className="max-h-[min(65vh,520px)]">
          <CommandEmpty>No matching records found.</CommandEmpty>
          {Array.from(groupedResults.entries()).map(([group, groupResults]) => (
            <CommandGroup key={group} heading={group}>
              {groupResults.map((result) => {
                const Icon = result.icon
                return (
                  <CommandItem
                    key={result.id}
                    value={`${result.label} ${result.detail ?? ""}`}
                    onSelect={() => selectResult(result.href)}
                  >
                    <Icon className="text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{result.label}</span>
                      {result.detail && <span className="block truncate text-xs text-muted-foreground">{result.detail}</span>}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}