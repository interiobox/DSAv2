import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation } from "wouter";

import type { PortalUser } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/layouts/AppLayout";
import AdminPage from "@/pages/Admin";
import Assignments from "@/pages/Assignments";
import DrawingDetail from "@/pages/DrawingDetail";
import DrawingList from "@/pages/DrawingList";
import MyFeed from "@/pages/MyFeed";
import NotFound from "@/pages/not-found";
import UsersPage from "@/pages/Users";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

type AuthContextValue = {
  user: PortalUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<PortalUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function usePortalAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("usePortalAuth must be used inside AuthProvider");
  return context;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<PortalUser>;
      })
      .then((currentUser) => {
        if (mounted) setUser(currentUser);
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    async login(username, password) {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | PortalUser | null;
      if (!response.ok) throw new Error(payload && "error" in payload ? payload.error : "Unable to sign in");
      setUser(payload as PortalUser);
      queryClient.clear();
      return payload as PortalUser;
    },
    async logout() {
      try {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      } finally {
        setUser(null);
        queryClient.clear();
      }
    },
  }), [isLoading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function AuthLanding() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded bg-primary">
          <span className="text-xl font-bold text-primary-foreground">▱</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Drawing Library</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to manage drawings, assignments, reviews, and your personal feed.</p>
        <div className="mt-6">
          <ButtonLink href="/sign-in">Sign in</ButtonLink>
        </div>
      </div>
    </div>
  );
}

function ButtonLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
      {children}
    </Link>
  );
}

function SignInPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading, login } = usePortalAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isLoading && user) return <Redirect to={user.role === "admin" ? "/admin" : "/drawings"} />;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const signedInUser = await login(username, password);
      setLocation(signedInUser.role === "admin" ? "/admin" : "/drawings");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded bg-primary">
          <span className="text-xl font-bold text-primary-foreground">▱</span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to access the Drawing Library.</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium">Username</label>
            <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" required />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Password</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" required />
          </div>
          {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-muted-foreground">Accounts are created and managed by an administrator.</p>
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { user, isLoading } = usePortalAuth();
  if (isLoading) return <LoadingScreen />;
  return user ? <Redirect to={user.role === "admin" ? "/admin" : "/drawings"} /> : <AuthLanding />;
}

function LoadingScreen() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background text-sm text-muted-foreground">Loading your account...</div>;
}

function AdminUsersRoute() {
  const { user } = usePortalAuth();
  return user?.role === "admin" ? <UsersPage /> : <Redirect to="/drawings" />;
}

function ProtectedRoutes() {
  const { user, isLoading } = usePortalAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect to="/sign-in" />;
  return (
    <AppLayout>
      <Switch>
        <Route path="/drawings" component={DrawingList} />
        <Route path="/drawings/:id" component={DrawingDetail} />
        <Route path="/assignments" component={Assignments} />
        <Route path="/users" component={AdminUsersRoute} />
        <Route path="/feed" component={MyFeed} />
        <Route path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignInPage} />
      <Route component={ProtectedRoutes} />
    </Switch>
  );
}

export default function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </WouterRouter>
  );
}