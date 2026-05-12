import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
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

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

// Only pass proxyUrl in production — dev instances can't serve the Clerk CDN
const clerkProxyUrl =
  import.meta.env.VITE_CLERK_PROXY_URL || undefined;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#2D6A4F",
    colorForeground: "#1a2e1f",
    colorMutedForeground: "#5a7a6a",
    colorDanger: "#dc2626",
    colorBackground: "#f8faf9",
    colorInput: "#ffffff",
    colorInputForeground: "#1a2e1f",
    colorNeutral: "#d1e0d8",
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl shadow-emerald-900/10",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#1a2e1f] font-semibold",
    headerSubtitle: "text-[#5a7a6a]",
    socialButtonsBlockButtonText: "text-[#1a2e1f]",
    formFieldLabel: "text-[#1a2e1f]",
    footerActionLink: "text-[#2D6A4F] hover:text-[#1a4030]",
    footerActionText: "text-[#5a7a6a]",
    dividerText: "text-[#5a7a6a]",
    identityPreviewEditButton: "text-[#2D6A4F]",
    formFieldSuccessText: "text-[#2D6A4F]",
    alertText: "text-[#1a2e1f]",
    logoBox: "mb-2",
    logoImage: "w-12 h-12",
    socialButtonsBlockButton: "border-[#d1e0d8] hover:bg-[#f0f7f3]",
    formButtonPrimary: "bg-[#2D6A4F] hover:bg-[#1a4030]",
    formFieldInput: "border-[#d1e0d8] focus:border-[#2D6A4F]",
    footerAction: "bg-[#f0f7f3]",
    dividerLine: "bg-[#d1e0d8]",
    alert: "bg-[#f0f7f3] border-[#d1e0d8]",
    otpCodeFieldInput: "border-[#d1e0d8]",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AppRouter() {
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
        <Route path="/gig-work" component={GigWork} />
        <Route path="/family-budget" component={FamilyBudget} />
        <Route path="/shopping" component={Shopping} />
        <Route path="/scenarios" component={Scenarios} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function HomeRoute() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function DashboardRoute() {
  return (
    <>
      <Show when="signed-in">
        <AppRouter />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function LandingPage() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <img src={`${basePath}/logo.svg`} alt="Logo" className="w-16 h-16" />
        <h1 className="text-3xl font-bold text-foreground font-serif">Manage Your Own Household</h1>
        <p className="text-xs font-semibold tracking-widest uppercase text-primary/70 -mt-1">MYOH</p>
        <p className="text-muted-foreground max-w-xs text-sm text-center leading-relaxed">
          Your household budget, bills, arrears, income, tasks, shopping, gig work, and weekly plan in one place.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setLocation("/sign-in")}
          className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          Sign In
        </button>
        <button
          onClick={() => setLocation("/sign-up")}
          className="px-6 py-2 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-accent transition-colors"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to Manage Your Own Household",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Get started with Manage Your Own Household",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRoute} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/dashboard/*?" component={DashboardRoute} />
            <Route path="/income-bills" component={DashboardRoute} />
            <Route path="/arrears/*?" component={DashboardRoute} />
            <Route path="/tasks" component={DashboardRoute} />
            <Route path="/comms" component={DashboardRoute} />
            <Route path="/weekly" component={DashboardRoute} />
            <Route path="/gig-work" component={DashboardRoute} />
            <Route path="/family-budget" component={DashboardRoute} />
            <Route path="/shopping" component={DashboardRoute} />
            <Route path="/scenarios" component={DashboardRoute} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
