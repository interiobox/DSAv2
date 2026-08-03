import * as React from "react"
import { Link, useLocation } from "wouter"
import { Archive as ArchiveIcon, ArrowRight, CalendarDays, CheckCircle2, Clock3, FileText, FolderKanban, History, Search, SlidersHorizontal } from "lucide-react"

import { useListActivity, useListDrawings, useListProjects } from "@workspace/api-client-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, formatDateShort } from "@/lib/utils"
import { ProjectNotesPanel } from "@/components/ProjectNotesPanel"

const statusLabel = (status: string) => status === "superseded" ? "Archived" : status.replace("_", " ")
const statusTone = (status: string) => status === "approved" ? "bg-emerald-100 text-emerald-800" : status === "issued" ? "bg-blue-100 text-blue-800" : status === "in_review" ? "bg-amber-100 text-amber-800" : status === "superseded" ? "bg-slate-100 text-slate-700" : ""

function PageHeader({ icon: Icon, title, description, children }: { icon: React.ElementType; title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="flex-none border-b bg-card px-4 py-4 shadow-sm sm:px-6 sm:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary sm:h-6 sm:w-6" />
          <div className="min-w-0"><h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
        </div>
        {children}
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-muted-foreground"><Icon className="mb-3 h-9 w-9 opacity-50" /><p>{message}</p></div>
}

export function Projects() {
  const [, setLocation] = useLocation()
  const { data: projects, isLoading: projectsLoading } = useListProjects()
  const { data: drawings, isLoading: drawingsLoading } = useListDrawings()
  const [search, setSearch] = React.useState("")
  const visibleProjects = (projects ?? []).filter((project) => project.name.toLowerCase().includes(search.toLowerCase()))
  const loading = projectsLoading || drawingsLoading
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <PageHeader icon={FolderKanban} title="Projects" description="Project-level view of the drawing register." />
      <div className="flex-1 overflow-auto p-3 sm:p-6"><div className="mx-auto max-w-6xl space-y-5">
        <div className="relative max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search projects" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        {loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <Skeleton className="h-40" key={item} />)}</div> : visibleProjects.length === 0 ? <Card><EmptyState icon={FolderKanban} message="No projects match your search." /></Card> : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleProjects.map((project) => {
            const projectDrawings = (drawings ?? []).filter((drawing) => drawing.projectName === project.name)
            const active = projectDrawings.filter((drawing) => drawing.status !== "issued" && drawing.status !== "superseded").length
            const review = projectDrawings.filter((drawing) => drawing.status === "in_review").length
            return <div key={project.id} role="link" tabIndex={0} onClick={() => setLocation(`/drawings?project=${encodeURIComponent(project.name)}`)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setLocation(`/drawings?project=${encodeURIComponent(project.name)}`) } }} className="group block h-full cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:shadow-md">
                <CardHeader className="border-b pb-4"><CardTitle className="flex items-center justify-between gap-3 text-base"><span className="truncate">{project.name}</span><Badge variant="outline">{projectDrawings.length}</Badge></CardTitle><CardDescription>Added {formatDateShort(project.createdAt)}</CardDescription></CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-3 text-center text-sm"><div><p className="font-semibold">{active}</p><p className="text-xs text-muted-foreground">Active</p></div><div><p className="font-semibold">{review}</p><p className="text-xs text-muted-foreground">In review</p></div><div><p className="font-semibold">{projectDrawings.filter((drawing) => drawing.status === "issued").length}</p><p className="text-xs text-muted-foreground">Issued</p></div></div>
                   <ProjectNotesPanel projectName={project.name} />
                   <div className="mt-5 flex items-center justify-between border-t pt-3 text-xs font-medium"><span className="flex items-center gap-2 text-primary"><span>View project drawings</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span><Link href={`/contacts?project=${encodeURIComponent(project.name)}`} onClick={(event) => event.stopPropagation()} className="text-muted-foreground hover:text-primary hover:underline">Directory</Link></div>
                </CardContent>
              </Card>
             </div>
          })}</div>
        )}
      </div></div>
    </div>
  )
}

export function ReviewQueue() {
  const { data: drawings, isLoading } = useListDrawings()
  const [project, setProject] = React.useState("all")
  const [search, setSearch] = React.useState("")
  const projects = Array.from(new Set((drawings ?? []).map((drawing) => drawing.projectName))).sort()
  const queue = (drawings ?? []).filter((drawing) => (drawing.status === "in_review" || drawing.status === "approved") && (project === "all" || drawing.projectName === project) && `${drawing.title} ${drawing.drawingNumber} ${drawing.assignedTo ?? ""}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"))
  return <div className="flex h-full flex-1 flex-col overflow-hidden">
    <PageHeader icon={CheckCircle2} title="Review Queue" description="Drawings waiting for review, approval, or issue." />
    <div className="flex-1 overflow-auto p-3 sm:p-6"><div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1 sm:max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search the queue" value={search} onChange={(event) => setSearch(event.target.value)} /></div><Select value={project} onValueChange={setProject}><SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="All projects" /></SelectTrigger><SelectContent><SelectItem value="all">All projects</SelectItem>{projects.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <Card><CardHeader className="border-b"><CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4 text-primary" />Active review items <Badge variant="outline">{queue.length}</Badge></CardTitle><CardDescription>Prioritized by due date, with the oldest deadline first.</CardDescription></CardHeader><CardContent className="p-0">{isLoading ? <div className="space-y-3 p-6"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div> : queue.length === 0 ? <EmptyState icon={CheckCircle2} message="The review queue is clear." /> : <div className="divide-y">{queue.map((drawing) => <Link href={`/drawings/${drawing.id}`} key={drawing.id} className="flex flex-col gap-3 px-6 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-medium">{drawing.title}</p><p className="mt-1 text-xs text-muted-foreground">{drawing.drawingNumber} · {drawing.projectName} · Category: {drawing.discipline}</p></div><div className="flex shrink-0 items-center gap-3"><Badge className={`capitalize ${statusTone(drawing.status)}`}>{statusLabel(drawing.status)}</Badge><span className="text-xs text-muted-foreground">{drawing.dueDate ? `Due ${formatDateShort(drawing.dueDate)}` : "No due date"}</span></div></Link>)}</div>}</CardContent></Card>
    </div></div>
  </div>
}

export function Activity() {
  const { data: activities, isLoading } = useListActivity()
  const { data: drawings } = useListDrawings()
  const [filter, setFilter] = React.useState("all")
  const [search, setSearch] = React.useState("")
  const types = Array.from(new Set((activities ?? []).map((activity) => activity.type))).sort()
  const drawingById = new Map((drawings ?? []).map((drawing) => [drawing.id, drawing]))
  const visible = (activities ?? []).filter((item) => (filter === "all" || item.type === filter) && item.message.toLowerCase().includes(search.toLowerCase()))
  return <div className="flex h-full flex-1 flex-col overflow-hidden">
    <PageHeader icon={History} title="Activity" description="The shared audit trail for drawing-library changes." />
    <div className="flex-1 overflow-auto p-3 sm:p-6"><div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1 sm:max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search activity" value={search} onChange={(event) => setSearch(event.target.value)} /></div><Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-full sm:w-[220px]"><SlidersHorizontal className="mr-2 h-4 w-4" /><SelectValue placeholder="All activity" /></SelectTrigger><SelectContent><SelectItem value="all">All activity</SelectItem>{types.map((type) => <SelectItem key={type} value={type}>{type.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select></div>
      <Card><CardContent className="p-0">{isLoading ? <div className="space-y-3 p-6"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div> : visible.length === 0 ? <EmptyState icon={History} message="No activity matches these filters." /> : <div className="divide-y">{visible.map((item) => <div key={item.id} className="flex gap-4 px-6 py-4"><div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" /><div className="min-w-0"><p className="text-sm">{item.message}</p><p className="mt-1 text-xs text-muted-foreground">{item.actor ? `User ${item.actor}` : "System"} · {formatDate(item.createdAt)}{item.drawingId && drawingById.has(item.drawingId) ? <span> · <Link className="text-primary hover:underline" href={`/drawings/${item.drawingId}`}>{drawingById.get(item.drawingId)?.drawingNumber}</Link></span> : null}</p></div></div>)}</div>}</CardContent></Card>
    </div></div>
  </div>
}

export function Deadlines() {
  const { data: drawings, isLoading } = useListDrawings()
  const [scope, setScope] = React.useState("upcoming")
  const today = new Date().toISOString().slice(0, 10)
  const items = (drawings ?? []).filter((drawing): drawing is typeof drawing & { dueDate: string } => Boolean(drawing.dueDate) && (scope === "all" || (scope === "overdue" ? drawing.dueDate! < today : drawing.dueDate! >= today))).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  return <div className="flex h-full flex-1 flex-col overflow-hidden">
    <PageHeader icon={CalendarDays} title="Deadlines" description="Upcoming due dates and issue milestones across the register." />
    <div className="flex-1 overflow-auto p-3 sm:p-6"><div className="mx-auto max-w-5xl space-y-5">
      <div className="flex gap-2"><Button size="sm" variant={scope === "upcoming" ? "default" : "outline"} onClick={() => setScope("upcoming")}>Upcoming</Button><Button size="sm" variant={scope === "overdue" ? "default" : "outline"} onClick={() => setScope("overdue")}>Overdue</Button><Button size="sm" variant={scope === "all" ? "default" : "outline"} onClick={() => setScope("all")}>All deadlines</Button></div>
      <Card><CardContent className="p-0">{isLoading ? <div className="space-y-3 p-6"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div> : items.length === 0 ? <EmptyState icon={CalendarDays} message={scope === "overdue" ? "No overdue drawings." : "No deadlines in this view."} /> : <div className="divide-y">{items.map((drawing) => <Link href={`/drawings/${drawing.id}`} key={drawing.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/40"><div className="min-w-0"><p className="truncate font-medium">{drawing.title}</p><p className="mt-1 text-xs text-muted-foreground">{drawing.projectName} · {drawing.assignedTo ?? "Unassigned"}</p></div><div className="text-right"><p className={`text-sm font-semibold ${drawing.dueDate < today ? "text-destructive" : ""}`}>{formatDateShort(drawing.dueDate)}</p><Badge variant="outline" className="mt-1 capitalize">{statusLabel(drawing.status)}</Badge></div></Link>)}</div>}</CardContent></Card>
    </div></div>
  </div>
}

export function Archive() {
  const { data: drawings, isLoading } = useListDrawings({ status: "superseded" })
  return <div className="flex h-full flex-1 flex-col overflow-hidden">
    <PageHeader icon={ArchiveIcon} title="Archive" description="Superseded drawings retained for reference and audit." />
    <div className="flex-1 overflow-auto p-3 sm:p-6"><div className="mx-auto max-w-5xl"><Card><CardContent className="p-0">{isLoading ? <div className="space-y-3 p-6"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div> : !drawings?.length ? <EmptyState icon={ArchiveIcon} message="No archived drawings yet." /> : <div className="divide-y">{drawings.map((drawing) => <Link href={`/drawings/${drawing.id}`} key={drawing.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/40"><div className="min-w-0"><p className="truncate font-medium">{drawing.title}</p><p className="mt-1 text-xs text-muted-foreground">{drawing.drawingNumber} · {drawing.projectName} · Revision {drawing.revision}</p></div><span className="text-right text-xs text-muted-foreground">Updated {formatDateShort(drawing.updatedAt)}</span></Link>)}</div>}</CardContent></Card></div></div>
  </div>
}