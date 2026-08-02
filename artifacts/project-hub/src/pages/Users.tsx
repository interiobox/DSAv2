import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { UserPlus, Users } from "lucide-react"

import {
  getListUsersQueryKey,
  useCreateUser,
  useListUsers,
} from "@workspace/api-client-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?"
}

export default function UsersPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: users, isLoading } = useListUsers()
  const createUser = useCreateUser()
  const [name, setName] = React.useState("")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    createUser.mutate(
      { data: { name: trimmedName } },
      {
        onSuccess: (user) => {
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() })
          setName("")
          toast({ title: "User added", description: `${user.name} can now be assigned drawings.` })
        },
        onError: (error) => {
          toast({
            title: "User could not be added",
            description: error instanceof Error ? error.message : "A user with this name may already exist.",
          })
        },
      },
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      <div className="flex-none border-b bg-card px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage the people who can be assigned drawings.</p>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserPlus className="h-4 w-4 text-primary" />
                Add a new user
              </CardTitle>
              <CardDescription>
                Added users will appear as options in the Assignments tab.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <label htmlFor="new-user-name" className="text-sm font-medium">Full name</label>
                <Input
                  id="new-user-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Alex Morgan"
                  autoComplete="name"
                />
                <Button type="submit" className="w-full" disabled={createUser.isPending || !name.trim()}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {createUser.isPending ? "Adding user..." : "Add user"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                All users
                <Badge variant="outline">{users?.length ?? 0}</Badge>
              </CardTitle>
              <CardDescription>Everyone listed here can receive drawing assignments.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-3 p-6">
                  {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
                </div>
              ) : users?.length ? (
                <div className="divide-y">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 px-6 py-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {initials(user.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">Available for assignment</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-muted-foreground">
                  <Users className="mb-3 h-9 w-9 opacity-50" />
                  <p className="font-medium text-foreground">No users yet</p>
                  <p className="mt-1 text-sm">Add the first user to start assigning drawings.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}