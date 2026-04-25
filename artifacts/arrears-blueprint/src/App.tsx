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
import NotFound from "@/pages/not-found";

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
    <Shell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/income-bills" component={IncomeBills} />
        <Route path="/arrears" component={ArrearsList} />
        <Route path="/arrears/:id" component={ArrearsDetail} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/comms" component={Comms} />
        <Route path="/weekly" component={WeeklyTracker} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
