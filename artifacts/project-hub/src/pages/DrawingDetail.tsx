import * as React from "react"
import { useRoute, Link, useLocation } from "wouter"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Edit2, CheckCircle, Clock, Send, Archive, Trash2, Calendar, User, FileText } from "lucide-react"

import { useGetDrawing, useUpdateDrawing, useDeleteDrawing, getGetDrawingQueryKey, getListDrawingsQueryKey, getGetDashboardSummaryQueryKey, getListActivityQueryKey } from "@workspace/api-client-react"
import type { DrawingStatus } from "@workspace/api-client-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"

export default function DrawingDetail() {
  const [, params] = useRoute("/drawings/:id")
  const id = params?.id ? parseInt(params.id, 10) : 0
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: drawing, isLoading, isError } = useGetDrawing(id, {
    query: {
      enabled: id > 0,
      queryKey: getGetDrawingQueryKey(id)
    }
  })

  const updateDrawing = useUpdateDrawing()
  const deleteDrawing = useDeleteDrawing()

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Failed to load drawing.</p>
          <Button variant="outline" onClick={() => setLocation("/drawings")}>Back to Register</Button>
        </div>
      </div>
    )
  }

  if (isLoading || !drawing) {
    return (
      <div className="flex-1 p-6 space-y-6 bg-background">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  const handleStatusChange = (status: DrawingStatus) => {
    updateDrawing.mutate({
      id,
      data: { status }
    }, {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetDrawingQueryKey(id), updated)
        queryClient.invalidateQueries({ queryKey: getListDrawingsQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() })
        queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() })
        toast({ title: "Status updated", description: `Drawing is now ${status.replace('_', ' ')}` })
      }
    })
  }

  const handleDelete = () => {
    if (!confirm(`Permanently delete drawing ${drawing.drawingNumber}?`)) return
    deleteDrawing.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Drawing deleted" })
        queryClient.invalidateQueries({ queryKey: getListDrawingsQueryKey() })
        setLocation("/drawings")
      }
    })
  }

  return (
    <div className="flex-1 flex flex-col bg-background/50 h-full overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b px-6 py-4 flex-none z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 sticky top-0 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/drawings" className="hover:text-foreground flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Register
            </Link>
            <span>/</span>
            <span className="font-mono uppercase">{drawing.drawingNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono uppercase">
              {drawing.drawingNumber}
            </h1>
            <Badge variant="outline" className="text-sm px-2 py-0 h-6 font-mono">Rev {drawing.revision}</Badge>
            <Badge variant={drawing.status} className="capitalize text-sm h-6 px-3">{drawing.status.replace('_', ' ')}</Badge>
          </div>
          <p className="text-lg text-muted-foreground font-medium">{drawing.title}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {drawing.status === 'draft' && (
            <Button variant="outline" size="sm" onClick={() => handleStatusChange('in_review')}>
              <Clock className="w-4 h-4 mr-2" /> Request Review
            </Button>
          )}
          {drawing.status === 'in_review' && (
            <Button variant="outline" size="sm" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200" onClick={() => handleStatusChange('approved')}>
              <CheckCircle className="w-4 h-4 mr-2" /> Approve
            </Button>
          )}
          {drawing.status === 'approved' && (
            <Button size="sm" onClick={() => handleStatusChange('issued')}>
              <Send className="w-4 h-4 mr-2" /> Issue Drawing
            </Button>
          )}
          {(drawing.status === 'issued' || drawing.status === 'approved') && (
            <Button variant="outline" size="sm" onClick={() => handleStatusChange('superseded')}>
              <Archive className="w-4 h-4 mr-2" /> Supersede
            </Button>
          )}
          <div className="w-px h-8 bg-border mx-1" />
          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Drawing Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <dl className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-b">
                  <div className="px-6 py-4">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Project</dt>
                    <dd className="font-medium text-foreground">{drawing.projectName}</dd>
                  </div>
                  <div className="px-6 py-4">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Discipline</dt>
                    <dd className="font-medium text-foreground capitalize">{drawing.discipline}</dd>
                  </div>
                </dl>
                <dl className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-b">
                  <div className="px-6 py-4">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Sheet Size</dt>
                    <dd className="font-medium text-foreground font-mono">{drawing.sheetSize}</dd>
                  </div>
                  <div className="px-6 py-4">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Author</dt>
                    <dd className="font-medium text-foreground flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {drawing.author}
                    </dd>
                  </div>
                </dl>
                <div className="px-6 py-4">
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Description / Notes</dt>
                  <dd className="text-sm text-foreground/80 leading-relaxed min-h-[60px]">
                    {drawing.description || <span className="italic text-muted-foreground">No description provided.</span>}
                  </dd>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y">
                <div className="px-6 py-3 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm font-medium">{formatDate(drawing.createdAt)}</span>
                </div>
                <div className="px-6 py-3 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm font-medium">{formatDate(drawing.updatedAt)}</span>
                </div>
                <div className="px-6 py-3 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Due Date</span>
                  <span className="text-sm font-medium">{drawing.dueDate ? formatDate(drawing.dueDate) : '-'}</span>
                </div>
                <div className="px-6 py-3 flex justify-between items-center bg-muted/20">
                  <span className="text-sm font-medium">Issued Date</span>
                  <span className="text-sm font-bold text-primary">{drawing.issuedDate ? formatDate(drawing.issuedDate) : '-'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Mock preview area just to add visual texture to the layout */}
            <div className="rounded-lg border bg-card p-2 shadow-sm overflow-hidden group">
              <div className="aspect-[4/3] bg-muted relative overflow-hidden rounded-md border border-dashed border-border/60 flex items-center justify-center">
                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:10px_10px]" />
                <div className="text-center text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-mono font-medium tracking-widest uppercase opacity-50">Sheet Preview</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
