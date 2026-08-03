import * as React from "react"
import { Link, useRoute } from "wouter"
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderKanban,
  History,
  Mail,
  UsersRound,
} from "lucide-react"

import {
  useListActivity,
  useListContacts,
  useListDrawings,
  useListProjectChecklists,
  useListProjects,
} from "@workspace/api-client-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ProjectNotesPanel } from "@/components/ProjectNotesPanel"
import { formatDateShort } from "@/lib/utils"

const statusLabel = (status: string) => status === "superseded" ? "Archived" : status.replace("_", " ")
const statusTone = (status: string) =>
  status === "approved" ? "bg-emerald-100 text-emerald-800" :
  status === "issued" ? "bg-blue-100 text-blue-800" :
  status === "in_review" ? "bg-amber-100 text-amber-800" :
  status === "superseded" ? "bg-slate-100 text-slate-700" : ""
const activityLabel = (type: string) => type.replace("drawing_", "").replace("_", " ")
const activityTone = (type: string) =>
  type.includes("issued") ? "bg-blue-100 text-blue-800" :
  type.includes("approved") ? "bg-emerald-100 text-emerald-800" :
  type.includes("assigned") ? "bg-violet-100 text-violet-800" :
  type.includes("uploaded") ? "bg-cyan-100 text-cyan-800" : "bg-muted text-muted-foreground"

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:projectName")
  const projectName = params?.projectName ? decodeURIComponent(params.projectName) : ""
  const { data: projects, isLoading: projectsLoading } = useListProjects()
  const { data: drawings, isLoading: drawingsLoading } = useListDrawings()
  const { data: contacts, isLoading: contactsLoading } = useListContacts(
    projectName ? { projectName } : undefined,
  )
  const { data: checklists, isLoading: checklistsLoading } = useListProjectChecklists(
    projectName ? { projectName } : undefined,
  )
  const { data: activities, isLoading: activitiesLoading } = useListActivity()

  const project = projects?.find((item) => item.name === projectName)
  const projectDrawings = (drawings ?? []).filter((drawing) => drawing.projectName === projectName)
  const activeDrawings = projectDrawings.filter((drawing) => drawing.status !== "issued" && drawing.status !== "superseded")
  const issuedDrawings = projectDrawings.filter((drawing) => drawing.status === "issued")
  const reviewDrawings = projectDrawings.filter((drawing) => drawing.status === "in_review")
  const dueDrawings = projectDrawings
    .filter((drawing): drawing is typeof drawing & { dueDate: string } => Boolean(drawing.dueDate))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4)
  const today = new Date().toISOString().slice(0, 10)
  const overdueDrawings = projectDrawings.filter(
    (drawing) => Boolean(drawing.dueDate) && drawing.dueDate! < today && drawing.status !== "issued" && drawing.status !== "superseded",
  )
  const unassignedDrawings = projectDrawings.filter((drawing) => !drawing.assignedTo)
  const projectDrawingIds = new Set(projectDrawings.map((drawing) => drawing.id))
  const projectActivities = (activities ?? []).filter(
    (activity) => activity.drawingId !== null && projectDrawingIds.has(activity.drawingId),
  )
  const drawingById = new Map(projectDrawings.map((drawing) => [drawing.id, drawing]))
  const completedChecklistItems = (checklists ?? []).reduce(
    (total, checklist) => total + checklist.items.filter((item) => item.completed).length,
    0,
  )
  const checklistItems = (checklists ?? []).reduce((total, checklist) => total + checklist.items.length, 0)
  const checklistProgress = checklistItems ? Math.round((completedChecklistItems / checklistItems) * 100) : 0
  const isLoading = projectsLoading || drawingsLoading
  const projectNeedsAttention = overdueDrawings.length > 0 || unassignedDrawings.length > 0

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <div className="border-b bg-card px-4 py-5 sm:px-6"><Skeleton className="h-8 w-72" /><Skeleton className="mt-2 h-4 w-96" /></div>
        <div className="flex-1 overflow-auto p-3 sm:p-6"><div className="mx-auto max-w-7xl space-y-5"><Skeleton className="h-32 w-full" /><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div></div></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-full flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="pt-8">
            <FolderKanban className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h1 className="text-xl font-semibold">Project not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">This project may have been renamed or is no longer available.</p>
            <Button asChild className="mt-6"><Link href="/projects"><ArrowLeft className="mr-2 h-4 w-4" />Back to projects</Link></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <header className="flex-none border-b bg-card px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="mx-auto max-w-7xl">
          <Link href="/projects" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> All projects
          </Link>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FolderKanban className="h-5 w-5" /></div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Project workspace</p>
                <h1 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">{project.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">A dedicated view of drawings, coordination, notes, and project progress.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild><Link href={`/drawings?project=${encodeURIComponent(project.name)}`}><FileText className="mr-2 h-4 w-4" />View all drawings</Link></Button>
              <Button asChild><Link href={`/contacts?project=${encodeURIComponent(project.name)}`}><UsersRound className="mr-2 h-4 w-4" />Project directory</Link></Button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Added {formatDateShort(project.createdAt)}</span>
            <span className="inline-flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />{projectDrawings.length} drawing{projectDrawings.length === 1 ? "" : "s"}</span>
            <span className="inline-flex items-center gap-1.5"><UsersRound className="h-3.5 w-3.5" />{contacts?.length ?? 0} partner{contacts?.length === 1 ? "" : "s"}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-5">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Active drawings", value: activeDrawings.length, detail: "Still in progress", icon: FileText },
              { label: "In review", value: reviewDrawings.length, detail: "Awaiting review or approval", icon: CheckCircle2 },
              { label: "Issued", value: issuedDrawings.length, detail: "Released for use", icon: ClipboardList },
              { label: "Checklist progress", value: `${checklistProgress}%`, detail: checklistItems ? `${completedChecklistItems} of ${checklistItems} items` : "No checklists applied", icon: CheckCircle2 },
            ].map(({ label, value, detail, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="flex items-start justify-between gap-3 p-5">
                  <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
                  <div className="rounded-md bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></div>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card className={projectNeedsAttention ? "border-amber-200 bg-amber-50/40" : "border-emerald-200 bg-emerald-50/30"}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className={`rounded-md p-2 ${projectNeedsAttention ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {projectNeedsAttention ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Project health</p>
                    <h2 className="mt-1 text-lg font-semibold">{projectNeedsAttention ? "Needs attention" : "On track"}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {projectNeedsAttention ? "Resolve the items below to keep project work moving." : "No overdue or unassigned drawing work is currently flagged."}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
                  <HealthMetric label="Overdue" value={overdueDrawings.length} warning={overdueDrawings.length > 0} />
                  <HealthMetric label="Unassigned" value={unassignedDrawings.length} warning={unassignedDrawings.length > 0} />
                  <HealthMetric label="In review" value={reviewDrawings.length} warning={reviewDrawings.length > 0} />
                  <HealthMetric label="Checklist" value={`${checklistProgress}%`} warning={checklistItems > 0 && checklistProgress < 100} />
                </div>
              </div>
              {projectNeedsAttention && (
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-amber-200/70 pt-4 text-xs">
                  {overdueDrawings.length > 0 && <Link className="font-medium text-amber-800 hover:underline" href={`/drawings?project=${encodeURIComponent(project.name)}`}>Review {overdueDrawings.length} overdue drawing{overdueDrawings.length === 1 ? "" : "s"} <ArrowRight className="ml-1 inline h-3 w-3" /></Link>}
                  {unassignedDrawings.length > 0 && <Link className="font-medium text-amber-800 hover:underline" href={`/drawings?project=${encodeURIComponent(project.name)}`}>Assign {unassignedDrawings.length} unassigned drawing{unassignedDrawings.length === 1 ? "" : "s"} <ArrowRight className="ml-1 inline h-3 w-3" /></Link>}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
            <div className="space-y-5">
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between gap-3">
                    <div><CardTitle className="text-base">Project drawings</CardTitle><CardDescription>{projectDrawings.length ? `Showing ${Math.min(projectDrawings.length, 8)} of ${projectDrawings.length} drawings.` : `No drawing work for ${project.name} yet.`}</CardDescription></div>
                    <Button variant="ghost" size="sm" asChild><Link href={`/drawings?project=${encodeURIComponent(project.name)}`}>Open library <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {projectDrawings.length === 0 ? <div className="px-6 py-12 text-center text-sm text-muted-foreground"><FileText className="mx-auto mb-3 h-8 w-8 opacity-40" />No drawings have been added to this project yet.</div> : (
                    <div className="divide-y">{projectDrawings.slice(0, 8).map((drawing) => (
                      <Link key={drawing.id} href={`/drawings/${drawing.id}`} className="flex flex-col gap-2 px-6 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0"><p className="truncate font-medium">{drawing.title}</p><p className="mt-1 text-xs text-muted-foreground">{drawing.drawingNumber} · {drawing.discipline} · Revision {drawing.revision}</p></div>
                        <div className="flex shrink-0 items-center gap-3"><Badge className={`capitalize ${statusTone(drawing.status)}`}>{statusLabel(drawing.status)}</Badge><span className="text-xs text-muted-foreground">{formatDateShort(drawing.updatedAt)}</span></div>
                      </Link>
                    ))}</div>
                  )}
                </CardContent>
              </Card>

              <ProjectNotesPanel projectName={project.name} />

              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4 text-primary" />Project activity</CardTitle>
                  <CardDescription>Recent drawing changes recorded for this project.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {activitiesLoading ? <div className="space-y-3 p-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : projectActivities.length === 0 ? (
                    <div className="px-6 py-10 text-center text-sm text-muted-foreground"><History className="mx-auto mb-3 h-8 w-8 opacity-40" />No project activity has been recorded yet.</div>
                  ) : (
                    <div className="divide-y">{projectActivities.slice(0, 8).map((activity) => {
                      const drawing = activity.drawingId ? drawingById.get(activity.drawingId) : undefined
                      return <div key={activity.id} className="flex gap-3 px-6 py-4">
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className={`text-[10px] capitalize ${activityTone(activity.type)}`}>{activityLabel(activity.type)}</Badge>
                            <p className="text-sm">{activity.message}</p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{activity.actor ?? "System"} · {formatDateShort(activity.createdAt)}{drawing ? <> · <Link className="text-primary hover:underline" href={`/drawings/${drawing.id}`}>{drawing.drawingNumber}</Link></> : null}</p>
                        </div>
                      </div>
                    })}</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-5">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4 text-primary" />Upcoming dates</CardTitle><CardDescription>Deadlines connected to this project.</CardDescription></CardHeader>
                <CardContent className="p-0">
                  {dueDrawings.length === 0 ? <p className="px-6 pb-6 text-sm text-muted-foreground">No drawing deadlines have been set.</p> : <div className="divide-y">{dueDrawings.map((drawing) => { const overdue = drawing.dueDate < today && drawing.status !== "issued" && drawing.status !== "superseded"; return <Link key={drawing.id} href={`/drawings/${drawing.id}`} className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-muted/40"><div className="min-w-0"><p className="truncate text-sm font-medium">{drawing.title}</p><p className="mt-1 text-xs text-muted-foreground">{drawing.drawingNumber}</p></div><span className={`shrink-0 text-right text-xs font-semibold ${overdue ? "text-destructive" : "text-foreground"}`}>{overdue ? "Overdue · " : ""}{formatDateShort(drawing.dueDate)}</span></Link> })}</div>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UsersRound className="h-4 w-4 text-primary" />Project directory</CardTitle><CardDescription>People and organizations linked to this project.</CardDescription></CardHeader>
                <CardContent className="p-0">
                  {contactsLoading ? <div className="space-y-3 p-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : !contacts?.length ? <p className="px-6 pb-6 text-sm text-muted-foreground">No project partners have been linked yet.</p> : <div className="divide-y">{contacts.slice(0, 5).map((contact) => <div key={contact.id} className="flex items-start gap-3 px-6 py-3"><div className="mt-0.5 rounded-full bg-muted p-2"><UsersRound className="h-3.5 w-3.5 text-muted-foreground" /></div><div className="min-w-0"><p className="truncate text-sm font-medium">{contact.companyName}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{contact.projects.find((item) => item.projectName === project.name)?.role ?? contact.type}{contact.contactName ? ` · ${contact.contactName}` : ""}</p>{contact.email && <a className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline" href={`mailto:${contact.email}`}><Mail className="h-3 w-3" />{contact.email}</a>}</div></div>)}</div>}
                  <div className="border-t p-4"><Button variant="outline" size="sm" className="w-full" asChild><Link href={`/contacts?project=${encodeURIComponent(project.name)}`}>Open directory <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4 text-primary" />Project checklists</CardTitle><CardDescription>Handover and readiness work for this project.</CardDescription></CardHeader>
                <CardContent>
                  {checklistsLoading ? <Skeleton className="h-10 w-full" /> : !checklists?.length ? <p className="text-sm text-muted-foreground">No checklists have been applied yet.</p> : <div className="space-y-4">{checklists.slice(0, 3).map((checklist) => { const complete = checklist.items.filter((item) => item.completed).length; const total = checklist.items.length; const progress = total ? Math.round((complete / total) * 100) : 0; return <div key={checklist.id}><div className="flex items-center justify-between gap-3 text-sm"><span className="truncate font-medium">{checklist.name}</span><Badge variant="outline" className="shrink-0">{progress}%</Badge></div><div className="mt-2 flex items-center gap-3"><Progress className="h-2 flex-1" value={progress} /><span className="shrink-0 text-[11px] text-muted-foreground">{complete}/{total}</span></div></div> })}</div>}
                  <Button variant="outline" size="sm" className="mt-5 w-full" asChild><Link href="/checklists">Manage checklists <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function HealthMetric({ label, value, warning }: { label: string; value: number | string; warning: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold ${warning ? "text-amber-700" : "text-foreground"}`}>{value}</p>
    </div>
  )
}