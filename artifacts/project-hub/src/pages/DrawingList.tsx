import * as React from "react"
import {
  FileText, Plus, Search, Filter, MoreHorizontal, ArrowRight,
  Pencil, Trash2, X
} from "lucide-react"
import { Link, useLocation } from "wouter"
import { useQueryClient } from "@tanstack/react-query"

import {
  useListDrawings, useCreateDrawing, useDeleteDrawing,
  getListDrawingsQueryKey, getGetDashboardSummaryQueryKey, getListActivityQueryKey
} from "@workspace/api-client-react"
import type { DrawingDiscipline, DrawingStatus } from "@workspace/api-client-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { formatDateShort } from "@/lib/utils"

const disciplineOptions = ["architectural", "structural", "mechanical", "electrical", "plumbing", "landscape", "interiors"] as const
const statusOptions = ["draft", "in_review", "approved", "issued", "superseded"] as const
const sheetSizeOptions = ["A0", "A1", "A2", "A3", "A4"] as const

export default function DrawingList() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [searchQuery, setSearchQuery] = React.useState("")
  const [disciplineFilter, setDisciplineFilter] = React.useState<DrawingDiscipline | "all">("all")
  const [statusFilter, setStatusFilter] = React.useState<DrawingStatus | "all">("all")
  const { data: drawings, isLoading } = useListDrawings({
    search: searchQuery || undefined,
    discipline: disciplineFilter !== "all" ? disciplineFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  }, { query: { queryKey: getListDrawingsQueryKey({ search: searchQuery || undefined, discipline: disciplineFilter !== "all" ? disciplineFilter : undefined, status: statusFilter !== "all" ? statusFilter : undefined }) }})

  const createDrawing = useCreateDrawing()
  const deleteDrawing = useDeleteDrawing()

  function createBlankDrawing() {
    createDrawing.mutate(
      { data: {} },
      {
        onSuccess: (newDrawing) => {
          queryClient.invalidateQueries({ queryKey: getListDrawingsQueryKey() })
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() })
          queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() })
          toast({ title: "Drawing created", description: "Add a file to start tracking this drawing." })
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

  function handleDelete(id: number, drawingNumber: string) {
    if (!confirm(`Are you sure you want to delete ${drawingNumber}?`)) return
    
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
      <div className="flex-none px-6 py-5 border-b bg-card z-10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Drawing Register</h1>
          <p className="text-sm text-muted-foreground mt-1">Master index of all project drawings and sheets.</p>
        </div>
         <div className="flex items-center gap-3">
          <Button onClick={createBlankDrawing} disabled={createDrawing.isPending}>
            <Plus className="w-4 h-4 mr-2" />
            {createDrawing.isPending ? "Creating..." : "Create Drawing"}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex-none p-4 border-b bg-background flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search numbers or titles..." 
            className="pl-9 font-mono text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={disciplineFilter} onValueChange={(v: any) => setDisciplineFilter(v)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Discipline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Disciplines</SelectItem>
               {disciplineOptions.map(d => (
                <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
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
                <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchQuery || disciplineFilter !== "all" || statusFilter !== "all") && (
            <Button variant="ghost" size="icon" onClick={() => { setSearchQuery(""); setDisciplineFilter("all"); setStatusFilter("all"); }} title="Clear filters">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 bg-background/50">
        <div className="space-y-3 md:hidden">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-4 h-4 w-1/2" />
              </div>
            ))
          ) : drawings?.length === 0 ? (
            <div className="rounded-lg border bg-card px-5 py-12 text-center text-muted-foreground">
              <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>No drawings found.</p>
              <p className="mt-1 text-xs">Try changing your search or filters.</p>
            </div>
          ) : (
            drawings?.map((drawing) => (
              <button
                type="button"
                key={drawing.id}
                className="w-full rounded-lg border bg-card p-4 text-left shadow-sm transition-colors active:bg-muted/50"
                onClick={() => setLocation(`/drawings/${drawing.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-primary">{drawing.drawingNumber}</p>
                    <h2 className="mt-1 truncate font-medium text-foreground">{drawing.title}</h2>
                  </div>
                  <Badge variant={drawing.status} className="shrink-0 capitalize">{drawing.status.replace('_', ' ')}</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{drawing.discipline} · Rev {drawing.revision}</span>
                  <span>{formatDateShort(drawing.updatedAt)}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="hidden border rounded-md bg-card shadow-sm md:block">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-md">
              <TableRow>
                <TableHead className="w-[140px]">Drawing No.</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[80px] text-center">Rev</TableHead>
                <TableHead className="w-[120px]">Discipline</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[120px]">Updated</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : drawings?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p>No drawings found.</p>
                      <p className="text-xs">Adjust your filters or add a new drawing.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                drawings?.map((drawing) => (
                  <TableRow key={drawing.id} className="group cursor-pointer" onClick={() => setLocation(`/drawings/${drawing.id}`)}>
                    <TableCell className="font-mono font-medium text-foreground">{drawing.drawingNumber}</TableCell>
                    <TableCell className="font-medium">{drawing.title}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono rounded-sm px-1.5 py-0 min-w-[2ch]">{drawing.revision}</Badge>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground text-sm">{drawing.discipline}</TableCell>
                    <TableCell>
                      <Badge variant={drawing.status}>{drawing.status.replace('_', ' ')}</Badge>
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
                            <ArrowRight className="mr-2 h-4 w-4" /> Open Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(drawing.id, drawing.drawingNumber)}} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

    </div>
  )
}
