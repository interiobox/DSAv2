import * as React from "react"
import { useRoute, Link, useLocation } from "wouter"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle, Clock, Send, Archive, Trash2, Calendar, FileText, Upload, Download, Loader2, History, MessageSquare, Pencil, MoreHorizontal, FolderKanban } from "lucide-react"

import { useGetDrawing, useUpdateDrawing, useDeleteDrawing, useListProjects, useListDisciplines, getGetDrawingQueryKey, getListDrawingsQueryKey, getGetDashboardSummaryQueryKey, getListActivityQueryKey } from "@workspace/api-client-react"
import type { DrawingStatus } from "@workspace/api-client-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { usePortalAuth } from "@/App"

type DrawingUpload = {
  id: number
  drawingId: number
  filePath: string
  fileName: string
  fileSize: number
  contentType: string
  uploadedBy: string
  uploadedAt: string
}

type DrawingComment = {
  id: number
  drawingId: number
  comment: string
  author: string
  createdAt: string
}

type DrawingForm = {
  title: string
  discipline: string
  status: string
  projectName: string
}

const statusLabel = (status: string) => status === "superseded" ? "Archived" : status.replace("_", " ")

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
  const { data: projects, isLoading: projectsLoading } = useListProjects()
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploads, setUploads] = React.useState<DrawingUpload[]>([])
  const [comments, setComments] = React.useState<DrawingComment[]>([])
  const [commentText, setCommentText] = React.useState("")
  const [isSavingComment, setIsSavingComment] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [isSavingDrawing, setIsSavingDrawing] = React.useState(false)
  const [drawingForm, setDrawingForm] = React.useState<DrawingForm | null>(null)
  const { user } = usePortalAuth()
  const currentUserName = user?.name || user?.username || ""
  const isAdmin = user?.role === "admin"
  const { data: disciplines } = useListDisciplines()

  const loadUploads = React.useCallback(async () => {
    const response = await fetch(`/api/drawings/${id}/uploads`)
    if (response.ok) setUploads(await response.json() as DrawingUpload[])
  }, [id])

  const loadComments = React.useCallback(async () => {
    const response = await fetch(`/api/drawings/${id}/comments`)
    if (response.ok) setComments(await response.json() as DrawingComment[])
  }, [id])

  React.useEffect(() => {
    if (id > 0) {
      void loadUploads()
      void loadComments()
    }
  }, [id, loadUploads, loadComments])

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Failed to load drawing.</p>
          <Button variant="outline" onClick={() => setLocation("/drawings")}>Back to Library</Button>
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
        toast({ title: "Status updated", description: `Drawing is now ${statusLabel(status)}` })
      }
    })
  }

  const handleDelete = () => {
    if (!confirm(`Permanently delete “${drawing.title}”?`)) return
    deleteDrawing.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Drawing deleted" })
        queryClient.invalidateQueries({ queryKey: getListDrawingsQueryKey() })
        setLocation("/drawings")
      }
    })
  }

  const openDrawingEdit = () => {
    setDrawingForm({
      title: drawing.title,
      discipline: drawing.discipline,
      status: drawing.status,
      projectName: drawing.projectName,
    })
    setIsEditOpen(true)
  }

  const handleDrawingSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!drawingForm) return
    setIsSavingDrawing(true)
    try {
      const response = await fetch(`/api/drawings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...drawingForm,
        }),
      })
      if (!response.ok) throw new Error("The drawing could not be updated")
      const updated = await response.json()
      queryClient.setQueryData(getGetDrawingQueryKey(id), updated)
      queryClient.invalidateQueries({ queryKey: getListDrawingsQueryKey() })
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() })
      queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() })
      setIsEditOpen(false)
      toast({ title: "Drawing updated" })
    } catch (error) {
      toast({ title: "Update failed", description: error instanceof Error ? error.message : "The drawing could not be updated." })
    } finally {
      setIsSavingDrawing(false)
    }
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!currentUserName) return

    setIsUploading(true)
    try {
      const uploadRequest = await fetch("/api/storage/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      })
      if (!uploadRequest.ok) {
        const errorBody = await uploadRequest.json().catch(() => ({}))
        throw new Error(errorBody.error || "Unable to prepare the upload")
      }

      const upload = await uploadRequest.json() as {
        uploadURL: string
        objectPath: string
      }
      const uploadResponse = await fetch(upload.uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      })
      if (!uploadResponse.ok) throw new Error("The drawing file could not be uploaded")

      const recordResponse = await fetch(`/api/drawings/${id}/uploads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: upload.objectPath,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type || "application/octet-stream",
           uploadedBy: currentUserName,
        }),
      })
      if (!recordResponse.ok) throw new Error("The file uploaded but its history could not be recorded")

      await loadUploads()
      queryClient.invalidateQueries({ queryKey: getGetDrawingQueryKey(id) })
      queryClient.invalidateQueries({ queryKey: getListDrawingsQueryKey() })
      queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() })
       toast({ title: "Drawing file uploaded", description: `${file.name} recorded under ${currentUserName}.` })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "The drawing file could not be uploaded.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleCommentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const author = currentUserName
    const comment = commentText.trim()
    if (!author || !comment) return

    setIsSavingComment(true)
    try {
      const response = await fetch(`/api/drawings/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, comment }),
      })
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || "Unable to save the comment")
      }
      setCommentText("")
      await loadComments()
      queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() })
      toast({ title: "Comment added", description: "Your review note is now under this drawing." })
    } catch (error) {
      toast({
        title: "Comment failed",
        description: error instanceof Error ? error.message : "The comment could not be saved.",
      })
    } finally {
      setIsSavingComment(false)
    }
  }

  const handleUploadDelete = async (upload: DrawingUpload) => {
    if (!confirm(`Delete ${upload.fileName}? This also removes the stored file.`)) return
    try {
      const response = await fetch(`/api/drawings/${id}/uploads/${upload.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("The upload could not be deleted")
      await loadUploads()
      queryClient.invalidateQueries({ queryKey: getGetDrawingQueryKey(id) })
      queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() })
      toast({ title: "Upload deleted" })
    } catch (error) {
      toast({ title: "Delete failed", description: error instanceof Error ? error.message : "The upload could not be deleted." })
    }
  }

  const handleCommentEdit = async (item: DrawingComment) => {
    const comment = window.prompt("Edit comment", item.comment)
    if (comment === null || !comment.trim()) return
    const author = window.prompt("Edit reviewer name", item.author)
    if (author === null || !author.trim()) return
    try {
      const response = await fetch(`/api/drawings/${id}/comments/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: comment.trim(), author: author.trim() }),
      })
      if (!response.ok) throw new Error("The comment could not be updated")
      await loadComments()
      queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() })
      toast({ title: "Comment updated" })
    } catch (error) {
      toast({ title: "Update failed", description: error instanceof Error ? error.message : "The comment could not be updated." })
    }
  }

  const handleCommentDelete = async (item: DrawingComment) => {
    if (!confirm("Delete this review comment?")) return
    try {
      const response = await fetch(`/api/drawings/${id}/comments/${item.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("The comment could not be deleted")
      await loadComments()
      queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() })
      toast({ title: "Comment deleted" })
    } catch (error) {
      toast({ title: "Delete failed", description: error instanceof Error ? error.message : "The comment could not be deleted." })
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background/50 h-full overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b px-6 py-4 flex-none z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 sticky top-0 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/drawings" className="hover:text-foreground flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Library
            </Link>
            <span>/</span>
            <span>{drawing.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {drawing.title}
            </h1>
            <Badge variant={drawing.status} className="capitalize text-sm h-6 px-3">{statusLabel(drawing.status)}</Badge>
          </div>
          <p className="text-lg text-muted-foreground font-medium">{drawing.title}</p>
        </div>
        
          <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={openDrawingEdit}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
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
              <Archive className="w-4 h-4 mr-2" /> Archive
            </Button>
          )}
          {isAdmin && (
            <>
              <div className="w-px h-8 bg-border mx-1" />
              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete} title="Delete drawing">
                <Trash2 className="w-4 h-4" />
                <span className="sr-only">Delete drawing</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
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
                <dl className="grid grid-cols-1 divide-y border-b">
                  <div className="px-6 py-4">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Project</dt>
                    <dd className="font-medium text-foreground flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-muted-foreground" />
                      {drawing.projectName}
                    </dd>
                  </div>
                </dl>
                <dl className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
                  <div className="px-6 py-4">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Discipline</dt>
                    <dd className="font-medium text-foreground capitalize">{drawing.discipline}</dd>
                  </div>
                  <div className="px-6 py-4">
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Status</dt>
                    <dd className="font-medium text-foreground capitalize">{statusLabel(drawing.status)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Drawing File
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {drawing.attachmentPath && drawing.attachmentName ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-md border bg-muted/20 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{drawing.attachmentName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {drawing.attachmentSize ? `${(drawing.attachmentSize / 1024 / 1024).toFixed(2)} MB` : "File"} · {drawing.attachmentContentType || "Unknown type"}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0">
                      <a href={`/api/storage${drawing.attachmentPath.replace("/objects", "/objects")}`} target="_blank" rel="noreferrer">
                        <Download className="mr-2 h-4 w-4" /> Open file
                      </a>
                    </Button>
                  </div>
                ) : (
                  <p className="mb-4 text-sm text-muted-foreground">No drawing file attached yet. Upload a PDF or source file for this sheet.</p>
                )}
                <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50">
                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                  {isUploading ? "Uploading..." : "Upload drawing file"}
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.dwg,.dxf,.rvt,.ifc,image/*"
                    onChange={handleUpload}
                    disabled={isUploading}
                  />
                </label>
                <p className="mt-2 text-xs text-muted-foreground">Maximum file size: 25 MB. Uploads are automatically attributed to your account.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Upload History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {uploads.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No uploads recorded yet.</p>
                ) : (
                  <div className="divide-y">
                    {uploads.map((upload) => (
                      <div key={upload.id} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <a className="truncate font-medium text-primary hover:underline" href={`/api/storage${upload.filePath}`} target="_blank" rel="noreferrer">
                            {upload.fileName}
                          </a>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Uploaded by <span className="font-medium text-foreground">{upload.uploadedBy}</span> · {formatDate(upload.uploadedAt)} · {(upload.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{upload.contentType}</span>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => void handleUploadDelete(upload)} title={`Delete ${upload.fileName}`}>
                             <Trash2 className="h-4 w-4" />
                             <span className="sr-only">Delete upload</span>
                           </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Review comments
                  {comments.length > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{comments.length}</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                   <Input value={currentUserName} placeholder="Your name" aria-label="Your name" readOnly required />
                   <p className="text-xs text-muted-foreground">Commenting as <span className="font-medium text-foreground">{currentUserName}</span></p>
                  <Textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Leave a review comment about this drawing..."
                    aria-label="Review comment"
                    rows={3}
                    required
                  />
                  <Button type="submit" disabled={isSavingComment || !currentUserName || !commentText.trim()}>
                    {isSavingComment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                    {isSavingComment ? "Saving..." : "Add comment"}
                  </Button>
                </form>

                <div className="mt-6 space-y-4">
                  {comments.length === 0 ? (
                    <p className="border-t pt-4 text-sm text-muted-foreground">No comments yet. Add the first review note.</p>
                  ) : (
                    comments.map((item) => (
                      <div key={item.id} className="border-t pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <span className="font-medium text-foreground">{item.author}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Comment actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => void handleCommentEdit(item)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit comment
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => void handleCommentDelete(item)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete comment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{item.comment}</p>
                      </div>
                    ))
                  )}
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

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit drawing</DialogTitle>
            <DialogDescription>Update the drawing information used during review.</DialogDescription>
          </DialogHeader>
          {drawingForm && (
            <form onSubmit={handleDrawingSave} className="space-y-4">
              <Input value={drawingForm.title} onChange={(e) => setDrawingForm({ ...drawingForm, title: e.target.value })} placeholder="Drawing name" aria-label="Drawing name" required />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select value={drawingForm.status} onValueChange={(status) => setDrawingForm({ ...drawingForm, status })}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>{["draft", "in_review", "approved", "issued", "superseded"].map((status) => <SelectItem key={status} value={status} className="capitalize">{statusLabel(status)}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={drawingForm.discipline} onValueChange={(discipline) => setDrawingForm({ ...drawingForm, discipline })}>
                  <SelectTrigger><SelectValue placeholder="Discipline" /></SelectTrigger>
                  <SelectContent>{(disciplines ?? []).map((discipline) => <SelectItem key={discipline.id} value={discipline.name} className="capitalize">{discipline.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Select value={drawingForm.projectName} onValueChange={(projectName) => setDrawingForm({ ...drawingForm, projectName })}>
                <SelectTrigger>
                  <FolderKanban className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder={projectsLoading ? "Loading projects..." : "Choose a project"} />
                </SelectTrigger>
                <SelectContent>
                  {(projects ?? []).map((project) => <SelectItem key={project.id} value={project.name}>{project.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSavingDrawing}>{isSavingDrawing ? "Saving..." : "Save changes"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
