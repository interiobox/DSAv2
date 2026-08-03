import * as React from "react"
import { useLocation } from "wouter"
import { useGetDashboardSummary, useListActivity } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, Clock, CheckCircle, Send, Plus, Activity as ActivityIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateShort } from "@/lib/utils"

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: activity, isLoading: isActivityLoading } = useListActivity();

  return (
    <div className="flex-1 overflow-auto bg-background/50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
            <p className="text-muted-foreground mt-1 text-sm">Status summary of all project drawings.</p>
          </div>
          <Button onClick={() => setLocation('/drawings?create=true')} className="shrink-0 group">
            <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            New Drawing
          </Button>
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
                    <p className="text-sm text-muted-foreground py-4 text-center">No drawings recorded yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ActivityIcon className="w-4 h-4 text-muted-foreground" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isActivityLoading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {activity?.slice(0, 8).map((item) => (
                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border bg-background shrink-0 text-muted-foreground z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] pl-3 md:pl-0 md:group-odd:pr-3 md:group-even:pl-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{item.message}</span>
                          <time className="text-[11px] text-muted-foreground font-mono">{formatDateShort(item.createdAt)}</time>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!activity || activity.length === 0) && (
                    <p className="text-sm text-muted-foreground py-4 text-center">No recent activity.</p>
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
