import * as React from "react"
import { Link, useLocation } from "wouter"
import { useGetDashboardSummary, useListActivity } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowRight, CheckCircle, Clock, FileText, FolderKanban, Plus, Send, Activity as ActivityIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateShort } from "@/lib/utils"

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: activity, isLoading: isActivityLoading } = useListActivity();

  return (
    <div className="flex-1 overflow-auto bg-background/50 p-4 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Live register</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">A quick read on drawing progress across every project.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setLocation("/projects")} className="shrink-0">
              <FolderKanban className="mr-2 h-4 w-4" /> Browse projects
            </Button>
            <Button onClick={() => setLocation('/drawings?create=true')} className="shrink-0 group">
            <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            New Drawing
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Drawings"
            value={summary?.totalDrawings}
            icon={<FileText className="w-4 h-4 text-primary" />}
            loading={isSummaryLoading}
          />
          <StatCard
            title="In Review"
            value={summary?.inReview}
            icon={<Clock className="w-4 h-4 text-amber-500" />}
            loading={isSummaryLoading}
          />
          <StatCard
            title="Approved"
            value={summary?.approved}
            icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
            loading={isSummaryLoading}
          />
          <StatCard
            title="Issued"
            value={summary?.issued}
            icon={<Send className="w-4 h-4 text-blue-500" />}
            loading={isSummaryLoading}
          />
        </div>

        <Card className="border-primary/15 bg-primary/[0.03]">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Register pulse</p>
              <p className="mt-1 text-sm font-medium">Keep review work moving toward issue.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary?.totalDrawings ? `${Math.round(((summary.issued ?? 0) / summary.totalDrawings) * 100)}% of drawings are issued.` : "Add a drawing to start tracking project progress."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild><Link href="/review-queue">Open review queue <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
              <Button size="sm" variant="ghost" asChild><Link href="/deadlines">View deadlines <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>By Category</CardTitle>
              <CardDescription>Distribution of drawings across categories</CardDescription>
            </CardHeader>
            <CardContent>
              {isSummaryLoading ? (
                <div className="space-y-4">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {summary && Object.entries(summary.byCategory).map(([category, count]) => {
                    const percentage = (count / summary.totalDrawings) * 100;
                    return (
                      <div key={category} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium capitalize text-foreground/80">{category}</span>
                          <span className="text-muted-foreground font-mono">{count}</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {(!summary || Object.keys(summary.byCategory).length === 0) && (
                    <div className="py-6 text-center">
                      <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No drawings recorded yet.</p>
                      <Button size="sm" variant="link" className="mt-1" onClick={() => setLocation("/drawings?create=true")}>Create the first drawing <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                <ActivityIcon className="w-4 h-4 text-muted-foreground" />
                Recent Activity
                </CardTitle>
                <CardDescription className="mt-1">Latest changes across the library</CardDescription>
              </div>
              <Link href="/activity" className="shrink-0 text-xs font-medium text-primary hover:underline">View all</Link>
            </CardHeader>
            <CardContent className="p-0">
              {isActivityLoading ? (
                <div className="space-y-3 p-6">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-11 w-full" />)}
                </div>
              ) : (
                <div className="divide-y">
                  {activity?.slice(0, 6).map((item) => {
                    const content = (
                      <div className="flex min-w-0 items-start gap-3 px-6 py-3.5 transition-colors hover:bg-muted/40">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm leading-5 text-foreground">{item.message}</p>
                          <time className="mt-1 block text-[11px] text-muted-foreground">{formatDateShort(item.createdAt)}</time>
                        </div>
                      </div>
                    )
                    return item.drawingId ? <Link key={item.id} href={`/drawings/${item.drawingId}`}>{content}</Link> : <div key={item.id}>{content}</div>
                  })}
                  {(!activity || activity.length === 0) && (
                    <p className="px-6 py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}

function StatCard({ title, value, icon, loading }: { title: string, value?: number, icon: React.ReactNode, loading: boolean }) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground leading-none">{title}</p>
          {loading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <h2 className="text-2xl font-bold tracking-tight font-mono">{value ?? 0}</h2>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
