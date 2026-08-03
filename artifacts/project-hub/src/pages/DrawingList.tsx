import * as React from "react"
import {
  FileText, Plus, Search, MoreHorizontal,
  Pencil, Trash2, X, FolderKanban
} from "lucide-react"
import { Link, useLocation } from "wouter"
import { useQueryClient } from "@tanstack/react-query"

import {
  useListDrawings, useCreateDrawing, useDeleteDrawing,
  useListProjects, useCreateProject, useListCategories,
  getListDrawingsQueryKey, getGetDashboardSummaryQueryKey, getListActivityQueryKey,
  getListProjectsQueryKey
} from "@workspace/api-client-react"
import type { DrawingDiscipline, DrawingStatus } from "@workspace/api-client-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { formatDateShort } from "@/lib/utils"
import { usePortalAuth } from "@/App"

const statusOptions = ["draft", "in_review", "approved", "issued", "superseded"] as const
const statusLabel = (status: string) => status === "superseded" ? "Archived" : status.replace("_", " ")
export default function DrawingList() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user } = usePortalAuth()
  const isAdmin = user?.role === "admin"
  
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<DrawingDiscipline | "all">("all")
  const [statusFilter, setStatusFilter] = React.useState<DrawingStatus | "all">("all")
  const [projectFilter, setProjectFilter] = React.useState(() => new URLSearchParams(window.location.search).get("project") || "all")
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [isProjectOpen, setIsProjectOpen] = React.useState(false)
  const [selectedProject, setSelectedProject] = React.useState("")
  const [newProjectName, setNewProjectName] = React.useState("")
  const { data: drawings, isLoading } = useListDrawings({
    search: searchQuery || undefined,
    discipline: categoryFilter !== "all" ? categoryFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  }, { query: { queryKey: getListDrawingsQueryKey({ search: searchQuery || undefined, discipline: categoryFilter !== "all" ? categoryFilter : undefined, status: statusFilter !== "all" ? statusFilter : undefined }) }})

  const createDrawing = useCreateDrawing()
  const deleteDrawing = useDeleteDrawing()
  const { data: projects, isLoading: projectsLoading } = useListProjects()
  const { data: categories } = useListCategories()
  const createProject = useCreateProject()
  const projectOptions = React.useMemo(() => projects?.map((project) => project.name) ?? [], [projects])
  const visibleDrawings = React.useMemo(
    () => (drawings ?? []).filter((drawing) => projectFilter === "all" || drawing.projectName === projectFilter),
    [drawings, projectFilter],
  )
  const groupedDrawings = React.useMemo(() => {
    const groups = new Map<string, NonNullable<typeof drawings>[number][]>()
    for (const drawing of visibleDrawings) {
      const projectDrawings = groups.get(drawing.projectName) ?? []
      projectDrawings.push(drawing)
      groups.set(drawing.projectName, projectDrawings)
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [visibleDrawings])

  const [newDrawingName, setNewDrawingName] = React.useState("")

  function createBlankDrawing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newDrawingName.trim()
    if (!selectedProject || !title) return
    createDrawing.mutate(
      { data: { projectName: selectedProject, title } },
      {
        onSuccess: (newDrawing) => {
          queryClient.invalidateQueries({ queryKey: getListDrawingsQueryKey() })
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() })
          queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() })
          toast({ title: "Drawing created", description: "Add a file to start tracking this drawing." })
          setNewDrawingName("")
          setIsCreateOpen(false)
          setLocation(`/drawings/${newDrawing.id}`)
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Could not create drawing. Please try again.",
          })
        }
      }
    )
  }

  function handleCreateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = newProjectName.trim()
    if (!name) return
    createProject.mutate(
      { data: { name } },
      {
        onSuccess: (project) => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() })
          setNewProjectName("")
          setIsProjectOpen(false)
          setSelectedProject(project.name)
          toast({ title: "Project added", description: `${project.name} is ready for drawings.` })
        },
        onError: (error) => {
          toast({ title: "Project could not be added", description: error instanceof Error ? error.message : "A project with this name may already exist." })
        },
      },
    )
  }

  function handleDelete(id: number, title: string) {
    if (!confirm(`Are you sure you want to delete “${title}”?`)) return
    
    deleteDrawing.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDrawingsQueryKey() })
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() })
          toast({ title: "Drawing deleted" })
        }
      }
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="flex-none px-4 py-4 sm:px-6 sm:py-5 border-b bg-card z-10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Drawing Library</h1>
            <Badge variant="outline">{isLoading ? "Loading" : `${visibleDrawings.length} shown`}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">All project drawings in one place, grouped by project for quick scanning.</p>
        </div>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
           <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsProjectOpen(true)}>
             <FolderKanban className="mr-2 h-4 w-4" />
             Add Project
           </Button>
           <Button className="w-full sm:w-auto" onClick={() => setIsCreateOpen(true)} disabled={projectsLoading}>
            <Plus className="w-4 h-4 mr-2" />
             Create Drawing
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex-none p-3 sm:p-4 border-b bg-background flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
             placeholder="Search drawing names..."
             className="pl-9 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <FolderKanban className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projectOptions.map((project) => (
                <SelectItem key={project} value={project}>{project}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
               {(categories ?? []).map(category => (
                 <SelectItem key={category.id} value={category.name} className="capitalize">{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
                 <SelectItem value="all">All Statuses</SelectItem>
                 {statusOptions.map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{statusLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchQuery || categoryFilter !== "all" || statusFilter !== "all" || projectFilter !== "all") && (
            <Button variant="ghost" size="icon" onClick={() => { setSearchQuery(""); setCategoryFilter("all"); setStatusFilter("all"); setProjectFilter("all"); }} title="Clear filters">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground sm:self-center">
          {projectFilter !== "all" ? `Showing drawings in ${projectFilter}.` : "Use search and filters to narrow the register."}
        </p>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 bg-background/50">
        <div className="space-y-4 md:hidden">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-4 h-4 w-1/2" />
              </div>
            ))
          ) : visibleDrawings.length === 0 ? (
            <div className="rounded-lg border bg-card px-5 py-12 text-center text-muted-foreground">
              <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="font-medium text-foreground">No drawings found.</p>
              <p className="mt-1 text-xs">Try changing your search or filters, or create a new drawing.</p>
              <Button size="sm" className="mt-4" onClick={() => setIsCreateOpen(true)} disabled={projectsLoading}><Plus className="mr-2 h-4 w-4" />Create drawing</Button>
            </div>
          ) : (
            groupedDrawings.map(([project, projectDrawings]) => (
              <section key={project} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-foreground">{project}</h2>
                  <span className="text-xs text-muted-foreground">{projectDrawings.length} drawing{projectDrawings.length === 1 ? "" : "s"}</span>
                </div>
                {projectDrawings.map((drawing) => (
                  <div
                    key={drawing.id}
                    className="rounded-lg border bg-card p-4 text-left shadow-sm transition-colors active:bg-muted/50"
                    onClick={() => setLocation(`/drawings/${drawing.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-medium text-foreground">{drawing.title}</h3>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Badge variant={drawing.status} className="capitalize">{statusLabel(drawing.status)}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Drawing actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(event) => { event.stopPropagation(); setLocation(`/drawings/${drawing.id}`) }}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit drawing
                            </DropdownMenuItem>
                             {isAdmin && (
                               <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(event) => { event.stopPropagation(); handleDelete(drawing.id, drawing.title) }}>
                                 <Trash2 className="mr-2 h-4 w-4" /> Delete drawing
                               </DropdownMenuItem>
                             )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{drawing.discipline}</span>
                      <span>{formatDateShort(drawing.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </section>
            ))
          )}
        </div>

        <div className="hidden border rounded-md bg-card shadow-sm md:block">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-md">
              <TableRow>
                <TableHead>Title</TableHead>
              <TableHead className="w-[120px]">Category</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[120px]">Updated</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : visibleDrawings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                       <p className="font-medium text-foreground">No drawings found.</p>
                       <p className="text-xs">Adjust your filters or add a new drawing.</p>
                       <Button size="sm" variant="outline" className="mt-3" onClick={() => setIsCreateOpen(true)} disabled={projectsLoading}><Plus className="mr-2 h-4 w-4" />Create drawing</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                groupedDrawings.flatMap(([project, projectDrawings]) => [
                  <TableRow key={`project-${project}`} className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={5} className="py-3">
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        <FolderKanban className="h-4 w-4 text-primary" />
                        <span>{project}</span>
                        <span className="text-xs font-normal text-muted-foreground">{projectDrawings.length} drawing{projectDrawings.length === 1 ? "" : "s"}</span>
                      </div>
                    </TableCell>
                  </TableRow>,
                  ...projectDrawings.map((drawing) => (
                  <TableRow key={drawing.id} className="group cursor-pointer" onClick={() => setLocation(`/drawings/${drawing.id}`)}>
                    <TableCell className="font-medium">{drawing.title}</TableCell>
                    <TableCell className="capitalize text-muted-foreground text-sm">{drawing.discipline}</TableCell>
                    <TableCell>
                      <Badge variant={drawing.status}>{statusLabel(drawing.status)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateShort(drawing.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/drawings/${drawing.id}`)}}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit drawing
                          </DropdownMenuItem>
                           {isAdmin && (
                             <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(drawing.id, drawing.title)}} className="text-destructive focus:text-destructive">
                               <Trash2 className="mr-2 h-4 w-4" /> Delete
                             </DropdownMenuItem>
                           )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  )),
                ])
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create drawing</DialogTitle>
            <DialogDescription>Choose a project to start a new drawing record.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createBlankDrawing} className="space-y-4">
            <Input
              value={newDrawingName}
              onChange={(event) => setNewDrawingName(event.target.value)}
              placeholder="Drawing name"
              aria-label="Drawing name"
              autoFocus
              required
            />
            <Select value={selectedProject} onValueChange={setSelectedProject} required>
              <SelectTrigger>
                <FolderKanban className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder={projectsLoading ? "Loading projects..." : "Choose a project"} />
              </SelectTrigger>
              <SelectContent>
                {projectOptions.map((project) => <SelectItem key={project} value={project}>{project}</SelectItem>)}
              </SelectContent>
            </Select>
            {projectOptions.length === 0 && (
              <p className="text-sm text-muted-foreground">Add a project first before creating a drawing.</p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!selectedProject || !newDrawingName.trim() || createDrawing.isPending}>
                {createDrawing.isPending ? "Creating..." : "Create drawing"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isProjectOpen} onOpenChange={setIsProjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add project</DialogTitle>
            <DialogDescription>Create a project that can be selected for drawings.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <Input
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              placeholder="Project name"
              aria-label="Project name"
              autoFocus
              required
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProjectOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!newProjectName.trim() || createProject.isPending}>
                {createProject.isPending ? "Adding..." : "Add project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
