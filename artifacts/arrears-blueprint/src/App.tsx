// TODO: Auth is disabled for the current development phase.
// Clerk (or another provider) can be reintroduced here when multi-user
// or login support is needed. See the original ClerkProviderWithRoutes
// implementation in git history for reference.

import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Shell } from "@/components/layout/Shell";
import Home from "@/pages/Home";
import IncomeBills from "@/pages/IncomeBills";
import ArrearsList from "@/pages/ArrearsList";
import ArrearsDetail from "@/pages/ArrearsDetail";
import Tasks from "@/pages/Tasks";
import Comms from "@/pages/Comms";
import WeeklyTracker from "@/pages/WeeklyTracker";
import GigWork from "@/pages/GigWork";
import FamilyBudget from "@/pages/FamilyBudget";
import Shopping from "@/pages/Shopping";
import Scenarios from "@/pages/Scenarios";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AppRouter() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Home} />
        <Route path="/income-bills" component={IncomeBills} />
        <Route path="/arrears" component={ArrearsList} />
        <Route path="/arrears/:id" component={ArrearsDetail} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/comms" component={Comms} />
        <Route path="/weekly" component={WeeklyTracker} />
        <Route path="/gig-work" component={GigWork} />
        <Route path="/family-budget" component={FamilyBudget} />
        <Route path="/shopping" component={Shopping} />
        <Route path="/scenarios" component={Scenarios} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppRouter />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
