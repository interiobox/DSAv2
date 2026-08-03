import * as React from "react"
import { Link } from "wouter"
import { CheckCircle2, Clock3, FileText, History, ListTodo } from "lucide-react"

import { useListActivity, useListDrawings } from "@workspace/api-client-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { usePortalAuth } from "@/App"

const progressForStatus = (status: string) => {
  if (status === "in_review") return 40
  if (status === "approved") return 70
  if (status === "issued" || status === "superseded") return 100
  return 0
}

const statusLabel = (status: string) => status === "superseded" ? "Archived" : status.replace("_", " ")

export default function MyFeed() {
  const { user } = usePortalAuth()
  const { data: drawings, isLoading: drawingsLoading } = useListDrawings()
  const { data: activities, isLoading: activitiesLoading } = useListActivity()
  const displayName = user?.name || user?.username || "Signed-in user"
  const userId = user ? String(user.id) : undefined
  const assignedDrawings = (drawings ?? []).filter((drawing) => drawing.assignedTo === displayName)
  const activeDrawings = assignedDrawings.filter((drawing) => drawing.status !== "issued" && drawing.status !== "superseded")
  const completedDrawings = assignedDrawings.filter((drawing) => drawing.status === "issued" || drawing.status === "superseded")
  const myActivities = (activities ?? []).filter((activity) => activity.actor === userId)

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="flex-none border-b bg-card px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Feed</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your assigned work, completed work, and recent actions.</p>
      </div>
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-primary-foreground/75">Signed in as</p>
                <p className="mt-1 text-xl font-semibold">{displayName}</p>
              </div>
              <div className="min-w-[190px]">
                <div className="flex justify-between text-xs text-primary-foreground/80">
                  <span>My active work</span>
                  <span>{activeDrawings.length} drawing{activeDrawings.length === 1 ? "" : "s"}</span>
                </div>
                <Progress value={assignedDrawings.length ? Math.round((completedDrawings.length / assignedDrawings.length) * 100) : 0} className="mt-2 bg-primary-foreground/25 [&>div]:bg-primary-foreground" />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base"><ListTodo className="h-4 w-4 text-primary" />Need to do <Badge variant="outline">{activeDrawings.length}</Badge></CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {drawingsLoading ? <div className="space-y-3 p-6"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div> : activeDrawings.length ? (
                  <div className="divide-y">
                    {activeDrawings.map((drawing) => (
                      <Link key={drawing.id} href={`/drawings/${drawing.id}`} className="block px-6 py-4 transition-colors hover:bg-muted/40">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{drawing.title}</p>
                          <Badge variant={drawing.status} className="capitalize">{statusLabel(drawing.status)}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{drawing.projectName} · {progressForStatus(drawing.status)}% complete</p>
                      </Link>
                    ))}
                  </div>
                ) : <p className="p-6 text-sm text-muted-foreground">You have no active drawings assigned.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Done <Badge variant="outline">{completedDrawings.length}</Badge></CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {completedDrawings.length ? (
                  <div className="divide-y">
                    {completedDrawings.map((drawing) => (
                      <Link key={drawing.id} href={`/drawings/${drawing.id}`} className="block px-6 py-4 transition-colors hover:bg-muted/40">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{drawing.title}</p>
                          <Badge variant={drawing.status} className="capitalize">{statusLabel(drawing.status)}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{drawing.projectName} · Complete</p>
                      </Link>
                    ))}
                  </div>
                ) : <p className="p-6 text-sm text-muted-foreground">Completed assignments will appear here.</p>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4 text-primary" />What I did <Badge variant="outline">{myActivities.length}</Badge></CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activitiesLoading ? <div className="space-y-3 p-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : myActivities.length ? (
                <div className="divide-y">
                  {myActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 px-6 py-4">
                      {activity.type === "drawing_uploaded" ? <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                      <div className="min-w-0">
                        <p className="text-sm">{activity.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(activity.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="p-6 text-sm text-muted-foreground">Your recent uploads, comments, assignments, and updates will appear here.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}