import * as React from "react"
import { BellRing, Settings as SettingsIcon, SunMoon } from "lucide-react"

import { usePortalAuth } from "@/App"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

const STORAGE_KEY = "drawing-library-settings"
type SettingsState = { emailUpdates: boolean; deadlineAlerts: boolean; compactMode: boolean }
const defaults: SettingsState = { emailUpdates: true, deadlineAlerts: true, compactMode: false }

export default function Settings() {
  const { user } = usePortalAuth()
  const { toast } = useToast()
  const [settings, setSettings] = React.useState<SettingsState>(() => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") } } catch { return defaults }
  })
  const [displayName, setDisplayName] = React.useState(user?.name ?? "")
  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    const next = { ...settings, [key]: value }
    setSettings(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    toast({ title: "Preference saved" })
  }
  return <div className="flex h-full flex-1 flex-col overflow-hidden"><div className="flex-none border-b bg-card px-6 py-5 shadow-sm"><div className="flex items-center gap-3"><SettingsIcon className="h-6 w-6 text-primary" /><div><h1 className="text-2xl font-bold tracking-tight">Settings</h1><p className="mt-1 text-sm text-muted-foreground">Personal preferences for the Drawing Library.</p></div></div></div><div className="flex-1 overflow-auto p-4 sm:p-6"><div className="mx-auto max-w-3xl space-y-6">
    <Card><CardHeader className="border-b"><CardTitle className="text-base">Profile</CardTitle><CardDescription>Your portal account details.</CardDescription></CardHeader><CardContent className="space-y-4 pt-5"><div><Label htmlFor="settings-name">Display name</Label><Input id="settings-name" className="mt-2 max-w-md" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></div><div className="flex items-center gap-2"><Badge variant="outline">{user?.role ?? "user"}</Badge><span className="text-sm text-muted-foreground">{user?.username ?? "Local account"}</span></div><Button variant="outline" onClick={() => toast({ title: "Profile changes are managed by an administrator" })}>Save profile</Button></CardContent></Card>
    <Card><CardHeader className="border-b"><CardTitle className="flex items-center gap-2 text-base"><BellRing className="h-4 w-4 text-primary" />Notifications</CardTitle><CardDescription>Choose which reminders appear in your workspace.</CardDescription></CardHeader><CardContent className="space-y-5 pt-5">{[["emailUpdates", "Activity updates", "Show recent drawing activity in Notifications."], ["deadlineAlerts", "Deadline alerts", "Highlight upcoming and overdue assigned drawings."]].map(([key, label, description]) => <div className="flex items-center justify-between gap-4" key={key}><div><p className="font-medium">{label}</p><p className="text-sm text-muted-foreground">{description}</p></div><Switch checked={settings[key as keyof SettingsState] as boolean} onCheckedChange={(value) => update(key as keyof SettingsState, value)} /></div>)}</CardContent></Card>
    <Card><CardHeader className="border-b"><CardTitle className="flex items-center gap-2 text-base"><SunMoon className="h-4 w-4 text-primary" />Display</CardTitle></CardHeader><CardContent className="pt-5"><div className="flex items-center justify-between gap-4"><div><p className="font-medium">Compact mode</p><p className="text-sm text-muted-foreground">Use tighter spacing on list-heavy pages.</p></div><Switch checked={settings.compactMode} onCheckedChange={(value) => update("compactMode", value)} /></div></CardContent></Card>
  </div></div></div>
}