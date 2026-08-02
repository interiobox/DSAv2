import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { AppLayout } from '@/layouts/AppLayout';
import DrawingList from '@/pages/DrawingList';
import DrawingDetail from '@/pages/DrawingDetail';
import Assignments from '@/pages/Assignments';
import UsersPage from '@/pages/Users';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route>
        <AppLayout>
          <Switch>
            <Route path="/" component={DrawingList} />
            <Route path="/drawings" component={DrawingList} />
            <Route path="/drawings/:id" component={DrawingDetail} />
            <Route path="/assignments" component={Assignments} />
            <Route path="/users" component={UsersPage} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
