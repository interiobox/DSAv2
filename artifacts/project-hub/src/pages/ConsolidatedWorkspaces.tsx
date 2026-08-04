import * as React from "react"
import { Link, useLocation } from "wouter"
import { CalendarDays, CheckCircle2, FileText, FolderOpen, UsersRound } from "lucide-react"

import { useListDrawings, useListUsers } from "@workspace/api-client-react"

import DrawingList from "@/pages/DrawingList"
import { Deadlines, ReviewQueue } from "@/pages/WorkspaceViews"
import { Files } from "@/pages/ManagementViews"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const drawingTabs = [
  { key: "library", label: "Library", icon: FileText },
  { key: "review", label: "Review queue", icon: CheckCircle2 },
  { key: "deadlines", label: "Deadlines", icon: CalendarDays },
  { key: "files", label: "Files", icon: FolderOpen },
] as const

type DrawingTab = typeof drawingTabs[number]["key"]

function currentDrawingTab(location: string): DrawingTab {
  const value = new URLSearchParams(location.split("?")[1] ?? "").get("view")
  return drawingTabs.some((tab) => tab.key === value) ? value as DrawingTab : "library"
}

export function DrawingWorkspace() {
  const [location] = useLocation()
  const activeTab = currentDrawingTab(location)

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-none border-b border-border/80 bg-background px-4 py-3 shadow-sm sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-primary">Drawing workspace</p>
            <p className="mt-1 text-sm text-muted-foreground">Manage drawings, reviews, deadlines, and uploaded files from one place.</p>
          </div>
          <nav aria-label="Drawing workspace sections" className="flex max-w-full gap-1 overflow-x-auto rounded-sm border border-border/60 bg-muted/30 p-1">
            {drawingTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <Link
                  key={tab.key}
                  href={tab.key === "library" ? "/drawings" : `/drawings?view=${tab.key}`}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-sm px-3 py-2 text-xs font-semibold transition-colors ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-background hover:text-foreground"}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === "review" ? <ReviewQueue /> : activeTab === "deadlines" ? <Deadlines /> : activeTab === "files" ? <Files /> : <DrawingList />}
      </div>
    </div>
  )
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?"
}

export function PeopleWorkspace() {
  const { data: users, isLoading } = useListUsers()
  const { data: drawings } = useListDrawings()
  const assigned = new Map<string, number>()
  for (const drawing of drawings ?? []) {
    if (drawing.assignedTo) assigned.set(drawing.assignedTo, (assigned.get(drawing.assignedTo) ?? 0) + 1)
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex-none border-b bg-card px-4 py-5 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-6xl items-start gap-3">
          <UsersRound className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">People</h1>
            <p className="mt-1 text-sm text-muted-foreground">One directory for assignment contacts and portal users.</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <UsersRound className="h-4 w-4 text-primary" />
                Team directory
                <Badge variant="outline">{users?.length ?? 0}</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">Everyone listed here can receive drawing assignments. Portal account settings are managed in Admin.</p>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6">
                  {[1, 2, 3].map((item) => <Skeleton key={item} className="h-14 w-full" />)}
                </div>
              ) : users?.length ? (
                <div className="divide-y">
                  {users.map((person) => (
                    <div key={person.id} className="flex items-center justify-between gap-4 px-6 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{initials(person.name)}</span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{person.name}</p>
                          <p className="text-xs text-muted-foreground">{person.username ? `@${person.username}` : "Assignment directory record"}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0">{assigned.get(person.name) ?? 0} assigned</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-16 text-center text-muted-foreground">
                  <UsersRound className="mx-auto mb-3 h-9 w-9 opacity-50" />
                  <p className="font-medium text-foreground">No people yet</p>
                  <p className="mt-1 text-sm">Add a portal user from Admin to start assigning drawings.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}