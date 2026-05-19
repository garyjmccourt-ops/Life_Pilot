import { Link } from "wouter";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { 
  useGetDashboardSummary, 
  useGetArrearsMatrix,
  useGetUpcomingSchedule,
  useListTasks,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Wallet, TrendingUp, TrendingDown, ArrowRight, Circle, Download, ChevronDown, FileJson, FileSpreadsheet, Bike, ShoppingCart, LifeBuoy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImportDialog } from "@/components/ImportDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const BASE = import.meta.env.BASE_URL;

async function triggerDownload(path: string, fallbackName: string, toast: ReturnType<typeof useToast>["toast"]) {
  try {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const disposition = res.headers.get("content-disposition") ?? "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] ?? fallbackName;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Download ready", description: filename });
  } catch (err) {
    toast({ title: "Download failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
  }
}

const CSV_EXPORTS = [
  { label: "Gig Work Sessions",  path: "api/export/csv/gig",      file: "gig-entries.csv" },
  { label: "Income Received",    path: "api/export/csv/income",   file: "income-entries.csv" },
  { label: "Bills",              path: "api/export/csv/bills",    file: "bills.csv" },
  { label: "Arrears",            path: "api/export/csv/arrears",  file: "arrears.csv" },
  { label: "Tasks",              path: "api/export/csv/tasks",    file: "tasks.csv" },
  { label: "Communications",     path: "api/export/csv/comms",    file: "comms.csv" },
  { label: "Shopping Items",     path: "api/export/csv/shopping", file: "shopping.csv" },
];

function ExportDropdown() {
  const { toast } = useToast();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Downloads
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Full Export</DropdownMenuLabel>
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={() => triggerDownload(
            "api/export",
            `lifepilot-export-${new Date().toISOString().slice(0,10)}.json`,
            toast
          )}
        >
          <FileJson className="h-4 w-4 text-primary" />
          <div>
            <div className="font-medium">All Data (JSON)</div>
            <div className="text-xs text-muted-foreground">For ChatGPT / Claude</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Spreadsheet Downloads</DropdownMenuLabel>
        {CSV_EXPORTS.map(({ label, path, file }) => (
          <DropdownMenuItem
            key={path}
            className="gap-2 cursor-pointer"
            onClick={() => triggerDownload(path, file, toast)}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const LIFE_BUCKETS = [
  {
    label: "Money Life",
    desc: "Income, bills, budget and cashflow.",
    href: "/income-bills",
    icon: Wallet,
    color: "text-primary",
    bg: "bg-primary/8",
    border: "border-primary/20",
  },
  {
    label: "Work Life",
    desc: "Gig shifts, earnings and platforms.",
    href: "/gig-work",
    icon: Bike,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    label: "Home Life",
    desc: "Household budget and shopping.",
    href: "/family-budget",
    icon: ShoppingCart,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    label: "Support Life",
    desc: "Debts, tasks and communications.",
    href: "/arrears",
    icon: LifeBuoy,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
];

function LifeBuckets() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {LIFE_BUCKETS.map(({ label, desc, href, icon: Icon, color, bg, border }) => (
        <Link key={href} href={href}>
          <Card className={`cursor-pointer hover:shadow-md transition-shadow border ${border} h-full`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${bg} flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-semibold uppercase tracking-widest ${color} mb-0.5`}>{label}</div>
                  <div className="text-sm font-medium text-foreground leading-snug">{desc}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function SummaryCards() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Received This Week</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.actualIncomeThisWeek)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Forecast: {formatCurrency(summary.weeklyIncome)}/wk
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Weekly Outgoings</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.weeklyOut)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Bills: {formatCurrency(summary.weeklyBills)} | Arrears: {formatCurrency(summary.weeklyArrears)}
          </p>
        </CardContent>
      </Card>

      <Card className={summary.weeklySurplus >= 0 ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Weekly Surplus</CardTitle>
          <Wallet className={summary.weeklySurplus >= 0 ? "h-4 w-4 text-primary" : "h-4 w-4 text-destructive"} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${summary.weeklySurplus >= 0 ? "text-primary" : "text-destructive"}`}>
            {formatCurrency(summary.weeklySurplus)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Available buffer
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Arrears Health</CardTitle>
          <AlertCircle className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.arrearsCount} Active</div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(summary.totalArrearsBalance)} total balance
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ArrearsMatrix() {
  const { data: matrix, isLoading } = useGetArrearsMatrix();

  if (isLoading) return <Skeleton className="h-[300px]" />;
  if (!matrix?.length) return (
    <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
      <CheckCircle2 className="h-12 w-12 text-primary/20 mb-4" />
      <h3 className="font-serif text-lg font-medium">No active arrears</h3>
      <p className="text-sm text-muted-foreground">You are completely caught up.</p>
    </Card>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-serif">Arrears Matrix</CardTitle>
        <Link href="/arrears">
          <Button variant="ghost" size="sm" className="text-muted-foreground">View All</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Creditor</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Commitment</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matrix.slice(0, 5).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.creditor}</TableCell>
                <TableCell>{formatCurrency(row.balance)}</TableCell>
                <TableCell>{formatCurrency(row.weeklyTotal)}/wk</TableCell>
                <TableCell>
                  <Badge variant={
                    row.riskLevel === "critical" ? "destructive" :
                    row.riskLevel === "high"     ? "signal" :
                    row.riskLevel === "medium"   ? "active" :
                    "pending"
                  }>
                    {row.riskLevel}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/arrears/${row.id}`}>
                    <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function UpcomingPayments() {
  const { data: schedule, isLoading } = useGetUpcomingSchedule();
  
  if (isLoading) return <Skeleton className="h-[300px]" />;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-serif">Upcoming Next 14 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!schedule?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nothing scheduled in the next 14 days.</p>
          ) : (
            schedule.slice(0, 6).map((payment, i) => (
              <div key={i} className="flex justify-between items-center pb-3 border-b border-border last:border-0 last:pb-0">
                <div>
                  <div className="font-medium text-sm">{payment.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatDate(payment.date)} • <span className="capitalize">{payment.kind}</span></div>
                </div>
                <div className="font-bold text-destructive">
                  {formatCurrency(payment.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PriorityTasks() {
  const { data: tasks, isLoading } = useListTasks();
  
  if (isLoading) return <Skeleton className="h-[200px]" />;
  
  const highPriority = tasks?.filter(t => t.status !== 'done' && t.priority === 'p1').slice(0, 4) || [];
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-serif flex items-center"><AlertCircle className="w-5 h-5 text-destructive mr-2"/> Priority Tasks</CardTitle>
        <Link href="/tasks"><Button variant="ghost" size="sm">All Tasks</Button></Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {!highPriority.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">You're on top of it — no priority tasks right now.</p>
          ) : (
            highPriority.map(task => (
              <div key={task.id} className="flex gap-3 items-start border border-border p-3 rounded-lg bg-destructive/5">
                <Circle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-sm leading-tight">{task.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 capitalize">{task.bucket} {task.creditorTag ? `• ${task.creditorTag}` : ''}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-lg">Money, work, home, and support — all in one place.</p>
        </div>
        <div className="flex gap-2">
          <ImportDialog />
          <ExportDropdown />
        </div>
      </div>

      <LifeBuckets />

      <SummaryCards />
      
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <ArrearsMatrix />
          <PriorityTasks />
        </div>
        
        <div className="space-y-8">
          <UpcomingPayments />
        </div>
      </div>
    </div>
  );
}
