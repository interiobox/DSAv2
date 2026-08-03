import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { KeyRound, Plus, Save, ShieldCheck, Trash2, Users } from "lucide-react"

import {
  getAdminListActivityQueryKey,
  getAdminListUsersQueryKey,
  useAdminCreateUser,
  useAdminDeleteUser,
  useAdminListActivity,
  useAdminListUsers,
  useAdminUpdateUser,
} from "@workspace/api-client-react"
import type { AdminUserInputRole, AdminUserUpdateRole, PortalUser } from "@workspace/api-client-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { usePortalAuth } from "@/App"
import { Redirect } from "wouter"

type DraftUser = { name: string; username: string; password: string; role: AdminUserUpdateRole; active: boolean }

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?"
}

export default function AdminPage() {
  const { user } = usePortalAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: users, isLoading: usersLoading } = useAdminListUsers()
  const { data: activity, isLoading: activityLoading } = useAdminListActivity()
  const createUser = useAdminCreateUser()
  const updateUser = useAdminUpdateUser()
  const deleteUser = useAdminDeleteUser()
  const [newUser, setNewUser] = React.useState<DraftUser>({ name: "", username: "", password: "", role: "user", active: true })
  const [userDrafts, setUserDrafts] = React.useState<Record<number, DraftUser>>({})

  if (user?.role !== "admin") return <Redirect to="/drawings" />

  function showError(title: string, error: unknown) {
    toast({ title, description: error instanceof Error ? error.message : "The change could not be saved." })
  }

  function invalidateUsers() {
    void queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() })
  }

  function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!newUser.name.trim() || !newUser.username.trim() || !newUser.password) return
    createUser.mutate({ data: { ...newUser, name: newUser.name.trim(), username: newUser.username.trim().toLowerCase() as string, password: newUser.password, role: newUser.role as AdminUserInputRole } }, {
      onSuccess: () => {
        setNewUser({ name: "", username: "", password: "", role: "user", active: true })
        void queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() })
        toast({ title: "Portal user created", description: "The user can now sign in with the assigned credentials." })
      },
      onError: (error) => showError("User could not be created", error),
    })
  }

  function draftFor(portalUser: PortalUser): DraftUser {
    return userDrafts[portalUser.id] ?? {
      name: portalUser.name,
      username: portalUser.username ?? "",
      password: "",
      role: portalUser.role,
      active: portalUser.active,
    }
  }

  function saveUser(portalUser: PortalUser) {
    const draft = draftFor(portalUser)
    updateUser.mutate({ id: portalUser.id, data: {
      name: draft.name.trim(),
      username: draft.username.trim().toLowerCase(),
      ...(draft.password ? { password: draft.password } : {}),
      role: draft.role,
      active: draft.active,
    } }, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() })
        toast({ title: "User updated", description: `${draft.name} account settings were saved.` })
        setUserDrafts((current) => ({ ...current, [portalUser.id]: { ...draft, password: "" } }))
      },
      onError: (error) => showError("User could not be updated", error),
    })
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="flex-none border-b bg-card px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage portal access and everything happening in the workspace.</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="flex items-center gap-3 p-5"><Users className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{users?.length ?? 0}</p><p className="text-xs text-muted-foreground">Portal users</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 p-5"><KeyRound className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{users?.filter((item) => item.role === "admin").length ?? 0}</p><p className="text-xs text-muted-foreground">Administrators</p></div></CardContent></Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(300px,380px)_1fr]">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-base">Add portal user</CardTitle>
                <CardDescription>Assign the username and password they will use to sign in.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-3">
                  <Input value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} placeholder="Full name" autoComplete="name" required />
                  <Input value={newUser.username} onChange={(event) => setNewUser({ ...newUser, username: event.target.value })} placeholder="Username" autoComplete="username" required />
                  <Input type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} placeholder="Temporary password" autoComplete="new-password" minLength={4} required />
                  <Select value={newUser.role} onValueChange={(role: AdminUserInputRole) => setNewUser({ ...newUser, role })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Administrator</SelectItem></SelectContent>
                  </Select>
                  <Button type="submit" className="w-full" disabled={createUser.isPending}><Plus className="mr-2 h-4 w-4" />{createUser.isPending ? "Creating..." : "Create account"}</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b"><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" />All portal accounts <Badge variant="outline">{users?.length ?? 0}</Badge></CardTitle></CardHeader>
              <CardContent className="p-0">
                {usersLoading ? <div className="space-y-3 p-6"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div> : (
                  <div className="divide-y">
                    {(users ?? []).map((portalUser) => {
                      const draft = draftFor(portalUser)
                      return <div key={portalUser.id} className="space-y-3 px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{initials(draft.name)}</span>
                          <div className="min-w-0"><p className="truncate font-medium">{portalUser.name}</p><p className="text-xs text-muted-foreground">{portalUser.username ? `@${portalUser.username}` : "Assignment-only directory record"}</p></div>
                          <Badge variant={portalUser.role === "admin" ? "default" : "outline"} className="ml-auto">{portalUser.role}</Badge>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input value={draft.name} onChange={(event) => setUserDrafts({ ...userDrafts, [portalUser.id]: { ...draft, name: event.target.value } })} placeholder="Name" />
                          <Input value={draft.username} onChange={(event) => setUserDrafts({ ...userDrafts, [portalUser.id]: { ...draft, username: event.target.value } })} placeholder="Username" />
                          <Input type="password" value={draft.password} onChange={(event) => setUserDrafts({ ...userDrafts, [portalUser.id]: { ...draft, password: event.target.value } })} placeholder="New password (optional)" autoComplete="new-password" />
                          <Select value={draft.role} onValueChange={(role: AdminUserUpdateRole) => setUserDrafts({ ...userDrafts, [portalUser.id]: { ...draft, role } })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Administrator</SelectItem></SelectContent></Select>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={draft.active} onChange={(event) => setUserDrafts({ ...userDrafts, [portalUser.id]: { ...draft, active: event.target.checked } })} /> Active account</label>
                          <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => saveUser(portalUser)} disabled={updateUser.isPending}><Save className="mr-1.5 h-3.5 w-3.5" />Save</Button><Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { if (window.confirm(`Delete ${portalUser.name}?`)) deleteUser.mutate({ id: portalUser.id }, { onSuccess: invalidateUsers, onError: (error) => showError("User could not be deleted", error) }) }}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Delete</Button></div>
                        </div>
                      </div>
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Everyone’s activity <Badge variant="outline">{activity?.length ?? 0}</Badge></CardTitle><CardDescription>Complete portal activity, not only your own actions.</CardDescription></CardHeader>
              <CardContent className="p-0">{activityLoading ? <div className="space-y-3 p-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : <div className="max-h-[460px] divide-y overflow-auto">{(activity ?? []).map((item) => <div key={item.id} className="px-6 py-3"><p className="text-sm">{item.message}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(item.createdAt)}</p></div>)}</div>}</CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}