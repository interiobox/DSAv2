import * as React from "react"
import { useRoute, Link, useLocation } from "wouter"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle, Clock, Send, Archive, Trash2, Calendar, User, FileText, Upload, Download, Loader2, History, MessageSquare } from "lucide-react"

import { useGetDrawing, useUpdateDrawing, useDeleteDrawing, getGetDrawingQueryKey, getListDrawingsQueryKey, getGetDashboardSummaryQueryKey, getListActivityQueryKey } from "@workspace/api-client-react"
import type { DrawingStatus } from "@workspace/api-client-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"

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
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploads, setUploads] = React.useState<DrawingUpload[]>([])
  const [comments, setComments] = React.useState<DrawingComment[]>([])
  const [reviewerName, setReviewerName] = React.useState(() => localStorage.getItem("drawing-reviewer-name") ?? "")
  const [commentText, setCommentText] = React.useState("")
  const [isSavingComment, setIsSavingComment] = React.useState(false)

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

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const uploadedBy = window.prompt("Who is uploading this file?")
    if (!uploadedBy?.trim()) return

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
          uploadedBy: uploadedBy.trim(),
        }),
      })
      if (!recordResponse.ok) throw new Error("The file uploaded but its history could not be recorded")

      await loadUploads()
      queryClient.invalidateQueries({ queryKey: getGetDrawingQueryKey(id) })
      queryClient.invalidateQueries({ queryKey: getListDrawingsQueryKey() })
      queryClient.invalidateQueries({ queryKey: getListActivityQueryKey() })
      toast({ title: "Drawing file uploaded", description: `${file.name} recorded under ${uploadedBy.trim()}.` })
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
    const author = reviewerName.trim()
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
      localStorage.setItem("drawing-reviewer-name", author)
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
                <p className="mt-2 text-xs text-muted-foreground">Maximum file size: 25 MB. You will be asked for the uploader name.</p>
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
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">{upload.contentType}</span>
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
                  <Input
                    value={reviewerName}
                    onChange={(event) => setReviewerName(event.target.value)}
                    placeholder="Your name"
                    aria-label="Your name"
                    required
                  />
                  <Textarea
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Leave a review comment about this drawing..."
                    aria-label="Review comment"
                    rows={3}
                    required
                  />
                  <Button type="submit" disabled={isSavingComment || !reviewerName.trim() || !commentText.trim()}>
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
                          <span className="font-medium text-foreground">{item.author}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
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
