import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, LayoutDashboard, Wallet, Bike, PieChart, AlertTriangle,
  ShoppingCart, CheckSquare, MessageSquare, CalendarDays, GitBranch,
  Settings2, ArrowRight, AlertCircle, Star, Shield, Zap, ListOrdered,
} from "lucide-react";

// ── Reusable building blocks ──────────────────────────────────────────────────

function SectionBadge({ children, color = "blue" }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border ${colors[color] ?? colors.blue}`}>
      {children}
    </span>
  );
}

function RuleBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-900">
      <Shield className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
      <div>{children}</div>
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2 mt-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function RelationChip({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href}>
      <span className="inline-flex items-center gap-1 text-xs bg-muted hover:bg-muted/80 border border-border rounded px-2 py-0.5 cursor-pointer transition-colors font-medium">
        {label} <ArrowRight className="h-3 w-3" />
      </span>
    </Link>
  );
}

function DocSection({
  icon: Icon,
  title,
  tagline,
  what,
  relations,
  rules,
  setup,
}: {
  icon: React.ElementType;
  title: string;
  tagline: string;
  what: React.ReactNode;
  relations: { label: string; href: string }[];
  rules: string[];
  setup: string[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground mt-1">{tagline}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* What it does */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> What it does
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">{what}</CardContent>
        </Card>

        {/* Connects to */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" /> Connects to
            </CardTitle>
          </CardHeader>
          <CardContent>
            {relations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Standalone — no direct cross-module links.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {relations.map(r => <RelationChip key={r.href} label={r.label} href={r.href} />)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Business rules */}
      {rules.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800">
              <Shield className="h-4 w-4 text-amber-600" /> Business Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rules.map((r, i) => (
              <RuleBlock key={i}>{r}</RuleBlock>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Setup procedure */}
      <Card className="border-green-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-green-800">
            <ListOrdered className="h-4 w-4 text-green-600" /> Recommended Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StepList steps={setup} />
        </CardContent>
      </Card>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab() {
  const modules = [
    { icon: Settings2,     label: "Settings",        href: "/settings",     desc: "Configure all dropdown values, defaults, and household people. Must be set up first.",        order: 1 },
    { icon: Wallet,        label: "Income & Bills",   href: "/income-bills", desc: "Record income sources, bills, and actual income received.",                                  order: 2 },
    { icon: PieChart,      label: "Family Budget",    href: "/family-budget",desc: "Set weekly spending targets per category group.",                                            order: 3 },
    { icon: Bike,          label: "Gig Work",         href: "/gig-work",     desc: "Track casual/gig income shifts per platform with automatic net calculation.",               order: 4 },
    { icon: AlertTriangle, label: "Arrears",          href: "/arrears",      desc: "Manage outstanding debts and payment arrangements with full strategy tracking.",            order: 5 },
    { icon: CheckSquare,   label: "Tasks",            href: "/tasks",        desc: "Action tasks organised by bucket (Today / This Week / Backlog / Waiting).",                order: 6 },
    { icon: MessageSquare, label: "Comms Log",        href: "/comms",        desc: "Record calls, emails, and letters to/from creditors and services.",                        order: 7 },
    { icon: CalendarDays,  label: "Weekly Tracker",   href: "/weekly",       desc: "Enter actual weekly income and spending to compare against budget.",                        order: 8 },
    { icon: ShoppingCart,  label: "Shopping",         href: "/shopping",     desc: "Manage recurring shopping items and build weekly lists.",                                   order: 9 },
    { icon: GitBranch,     label: "Scenarios",        href: "/scenarios",    desc: "Model what-if financial scenarios based on current data.",                                  order: 10 },
    { icon: LayoutDashboard,label:"Dashboard",        href: "/dashboard",    desc: "Single-screen overview of cashflow, arrears, upcoming bills, and open tasks.",             order: 11 },
  ];

  return (
    <div className="space-y-8">
      <div className="prose prose-sm max-w-none">
        <p className="text-muted-foreground leading-relaxed text-base">
          MYOH is a single-household financial management tool designed to give one household complete visibility
          and control over their income, expenses, debts, and daily financial actions. It is built around
          an <strong>Australian financial context</strong> — financial year starts 1 July, weeks begin Monday,
          and currency is AUD.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-primary" /> Recommended First-Time Setup Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StepList steps={[
            "Settings — configure household people, task buckets, bill categories, and gig platforms. Set defaults for each dropdown.",
            "Income & Bills — add all regular income sources and recurring bills.",
            "Family Budget — create category groups and set weekly spending targets.",
            "Gig Work — configure platforms and start recording shifts as they happen.",
            "Arrears — add any outstanding debts, set status and risk level, link tasks.",
            "Tasks — add any immediate action items. Use buckets to organise by urgency.",
            "Comms Log — start recording communications as they occur.",
            "Weekly Tracker — each week, enter actual income and spending figures.",
            "Dashboard — use daily as your financial snapshot.",
          ]} />
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {modules.sort((a, b) => a.order - b.order).map(m => {
          const Icon = m.icon;
          return (
            <Link key={m.href} href={m.href}>
              <Card className="cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors h-full">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-md bg-primary/10 flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{m.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{m.desc}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" /> Global Business Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-amber-900">
          <div className="flex gap-2"><Shield className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" /><span><strong>No deletion of in-use values.</strong> Any setting value referenced by an existing record is automatically deactivated instead of deleted. The record retains its value; the option simply disappears from new-form dropdowns.</span></div>
          <div className="flex gap-2"><Shield className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" /><span><strong>System values are protected.</strong> Values marked "system" in Settings cannot be deleted — only deactivated. They are part of the app's core logic.</span></div>
          <div className="flex gap-2"><Star className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-500" /><span><strong>One default per dropdown.</strong> Each settings namespace supports one starred default. Forms pre-select the default; if none is starred, the first active entry is used.</span></div>
          <div className="flex gap-2"><Shield className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" /><span><strong>Deactivated values stay on records.</strong> Existing data is never corrupted. Deactivated values show on existing records but cannot be selected for new ones.</span></div>
          <div className="flex gap-2"><Shield className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" /><span><strong>Single household.</strong> MYOH is designed for one household. All data is shared. Authentication is disabled in the current development phase.</span></div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Docs() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Documentation</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          How MYOH works — module by module. Business rules, relationships, and setup guidance.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex-wrap h-auto gap-1 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="income">Income & Bills</TabsTrigger>
          <TabsTrigger value="gig">Gig Work</TabsTrigger>
          <TabsTrigger value="budget">Family Budget</TabsTrigger>
          <TabsTrigger value="arrears">Arrears</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="comms">Comms Log</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Tracker</TabsTrigger>
          <TabsTrigger value="shopping">Shopping</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>

        <TabsContent value="settings">
          <DocSection
            icon={Settings2}
            title="Settings"
            tagline="The foundation of the app. Configure every dropdown, default value, and household person before entering real data."
            what={
              <span>
                Settings manages all <strong>controlled vocabulary</strong> — the options that appear in every dropdown
                across the app. This includes bill categories, gig platforms, task buckets, arrears statuses,
                risk levels, and more. It also manages household people (used for assigning tasks and gig shifts)
                and exposes a full audit log of every change made in the system.
              </span>
            }
            relations={[
              { label: "Income & Bills", href: "/income-bills" },
              { label: "Gig Work", href: "/gig-work" },
              { label: "Family Budget", href: "/family-budget" },
              { label: "Arrears", href: "/arrears" },
              { label: "Tasks", href: "/tasks" },
            ]}
            rules={[
              "System values (marked with the lock badge) cannot be deleted — only deactivated. They are the app's built-in defaults.",
              "Values in use by existing records cannot be deleted. The app automatically deactivates them instead, preserving data integrity. You will see a clear message telling you how many records are affected.",
              "Deactivated values remain on records that already use them, but disappear from new-form dropdowns. This prevents new data using retired values while preserving history.",
              "Each namespace supports exactly one default value (starred ★). Forms pre-select the starred option. If no default is set, the first active entry is used. Starring a new value automatically unstarred the previous one.",
              "The audit log records every create, update, deactivate, and delete action with a timestamp and before/after snapshot.",
            ]}
            setup={[
              "Open Settings > Household. Add the names of people in your household. These names appear in task assignment and gig shift dropdowns.",
              "Open Finance tab. Review bill categories and payment methods. Add any custom categories you need (e.g. a specific bank account as a payment method).",
              "Open Tasks tab. Review task buckets. The default buckets (Today, This Week, Backlog, Waiting) cover most workflows — customise if needed. Star the bucket you use most as your default.",
              "Open Gig Work tab. Add any platforms not already listed. Star the platform you use most.",
              "Open Arrears tab. Review statuses and risk levels — the defaults cover all standard scenarios.",
              "Open Audit Log anytime to review what changes have been made and by whom.",
            ]}
          />
        </TabsContent>

        <TabsContent value="income">
          <DocSection
            icon={Wallet}
            title="Income & Bills"
            tagline="The baseline of your cashflow — what comes in and what goes out regularly."
            what={
              <span>
                This tab has two sections. <strong>Income Sources</strong> are recurring sources of money —
                salary, Centrelink, rental income, etc. Each source has a frequency (weekly, fortnightly, monthly)
                and an expected amount. <strong>Bills</strong> are regular fixed outgoings — rent, utilities,
                insurance, phone. Both feed into the cashflow calculations on the Dashboard and Weekly Tracker.
                <br /><br />
                <strong>Actual Income Entries</strong> let you record money actually received against an income
                source on a specific date — tracking what you expected versus what arrived.
              </span>
            }
            relations={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Weekly Tracker", href: "/weekly" },
              { label: "Settings (bill_category)", href: "/settings" },
            ]}
            rules={[
              "Bill categories are controlled by Settings > Finance > Bill Categories. You cannot type a freeform category — you must select from the approved list or add a new one in Settings first.",
              "Income sources have a frequency — the app normalises all amounts to a weekly figure for cashflow calculations (monthly ÷ 4.33, fortnightly ÷ 2, annual ÷ 52).",
              "Actual income entries are dated records of money received. They link to an income source so you can compare expected vs actual over time.",
              "Bills marked 'autopay' are flagged on the Dashboard as not requiring manual action each cycle.",
            ]}
            setup={[
              "Add each regular income source with its correct frequency and expected amount.",
              "Add every regular bill — rent, utilities, phone, internet, insurance, subscriptions.",
              "Set bill categories. If a category is missing, go to Settings > Finance > Bill Categories and add it first.",
              "As money arrives, add an Actual Income Entry against the relevant income source.",
            ]}
          />
        </TabsContent>

        <TabsContent value="gig">
          <DocSection
            icon={Bike}
            title="Gig Work"
            tagline="Track every shift — gross earnings, platform fees, fuel costs, and net income — in one place."
            what={
              <span>
                Gig Work records individual work shifts for platforms like DoorDash, Uber Eats, Airtasker, or
                cash work. Each entry captures: start/end time, gross earnings, tips, platform fees, fuel cost
                (auto-calculated from kilometres), and net income. The tab shows period summaries (today, this
                week, this fortnight, this month) and an effective hourly rate.
                <br /><br />
                A <strong>receipt scanner</strong> (camera/upload) can pre-fill shift data via OCR — useful
                for quickly entering DoorDash or Uber Eats payment summaries.
              </span>
            }
            relations={[
              { label: "Income & Bills", href: "/income-bills" },
              { label: "Dashboard", href: "/dashboard" },
              { label: "Settings (gig_platform)", href: "/settings" },
            ]}
            rules={[
              "Platform options are controlled by Settings > Gig Work > Gig Platforms. To add a new platform (e.g. a new delivery app), add it in Settings first.",
              "Payment statuses (Pending, Fast-Paid, Deposited, Received) are controlled by Settings > Gig Work > Gig Payment Statuses.",
              "Fuel cost is auto-estimated from the kilometres entered, using the fuel rate set in Gig Work settings (litres per 100km × price per litre). Adjust these in the Settings panel within Gig Work.",
              "Net income = Gross + Tips − Fees − Fuel − Other Expenses. This is calculated automatically.",
              "Fast-Pay amounts are tracked separately from regular weekly deposits. The Dashboard shows total fast-pay balance outstanding.",
            ]}
            setup={[
              "Go to Settings > Gig Work. Confirm your platforms are listed. Add any missing ones. Star your main platform as default.",
              "In Gig Work, open the Settings panel (gear icon) and set your vehicle's fuel consumption (L/100km) and current fuel price.",
              "Add your first shift manually or use the receipt scanner to import from a screenshot.",
              "Set the payment status as money moves from Pending → Fast-Paid → Deposited → Received.",
            ]}
          />
        </TabsContent>

        <TabsContent value="budget">
          <DocSection
            icon={PieChart}
            title="Family Budget"
            tagline="Set weekly spending targets for every area of household life."
            what={
              <span>
                Family Budget lets you define <strong>budget categories</strong> — each with a group
                (Housing, Food, Transport, etc.) and a weekly or monthly spending target. These targets form
                the baseline for the Weekly Tracker, which compares actual spending against them.
                <br /><br />
                Categories are flexible: add as many as you need and group them logically. The total across
                all categories gives you your weekly household spending plan.
              </span>
            }
            relations={[
              { label: "Weekly Tracker", href: "/weekly" },
              { label: "Dashboard", href: "/dashboard" },
              { label: "Settings (budget_category_group)", href: "/settings" },
            ]}
            rules={[
              "Budget category groups are controlled by Settings > Budget > Budget Category Groups. You cannot create a freeform group name — select from the list or add a new group in Settings first.",
              "Each category has a single weekly target amount. Monthly targets are converted to weekly (÷ 4.33) for consistency.",
              "The Weekly Tracker uses these targets as its benchmark. If a category has no entry in a given week, it is assumed zero spent.",
            ]}
            setup={[
              "Go to Settings > Budget. Review the default groups (Housing, Food, Transport, etc.). Add any custom groups you need.",
              "In Family Budget, create categories within each group — e.g. 'Groceries' under Food, 'Fuel' under Transport.",
              "Set a realistic weekly target for each category based on your actual household spending patterns.",
              "Once set up, use the Weekly Tracker each week to record what you actually spent.",
            ]}
          />
        </TabsContent>

        <TabsContent value="arrears">
          <DocSection
            icon={AlertTriangle}
            title="Arrears"
            tagline="Full lifecycle management of outstanding debts — from first contact to resolution."
            what={
              <span>
                Each arrears item represents a debt or payment arrangement with a specific creditor. You record
                the total balance owed, the ongoing charge (current rent/repayment), and the arrears repayment
                component. The item tracks <strong>status</strong> (e.g. Negotiating, Payment Arrangement,
                Legal Action) and <strong>risk level</strong> (Low through Critical).
                <br /><br />
                Each arrears item has an internal strategy tab (your private working notes) and an external
                plan tab (what you've communicated to the creditor). Tasks and communications log entries
                can be linked directly to an arrears item.
              </span>
            }
            relations={[
              { label: "Tasks", href: "/tasks" },
              { label: "Comms Log", href: "/comms" },
              { label: "Dashboard", href: "/dashboard" },
              { label: "Settings (arrears_category / status / risk)", href: "/settings" },
            ]}
            rules={[
              "Arrears category, status, and risk level are all controlled by Settings > Arrears. Add custom values there if the defaults don't cover your situation.",
              "An arrears item cannot be partially deleted — the full record is kept as a historical audit trail. Use status 'Resolved' or 'Written Off' rather than deleting.",
              "Tasks created from an arrears item are automatically linked via arrearsItemId and creditorTag. They appear in the Related Tasks panel on the arrears detail page.",
              "The arrears matrix on the Dashboard shows total weekly commitment across all active arrangements (ongoing + arrears payments combined).",
              "Risk level is a manual classification — the app does not auto-escalate risk. Review and update regularly.",
            ]}
            setup={[
              "For each debt or arrears arrangement, create a new arrears item. Set the creditor name, category, and current balance.",
              "Set the ongoing charge (e.g. current weekly rent) and arrears payment (extra weekly amount to clear the debt).",
              "Set an accurate risk level and status. High/Critical risk items appear prominently on the Dashboard.",
              "Go to the item's detail page. Use the Internal Strategy section to document your plan. Use External Plan to record what you've communicated.",
              "Add tasks for immediate actions (e.g. 'Call to confirm arrangement', 'Send hardship letter').",
              "Log all calls and emails via the Comms Log tab on the detail page.",
            ]}
          />
        </TabsContent>

        <TabsContent value="tasks">
          <DocSection
            icon={CheckSquare}
            title="Tasks"
            tagline="Action tracking for every financial to-do — organised by urgency, not just by date."
            what={
              <span>
                Tasks are the action layer of MYOH. Each task has a <strong>bucket</strong> (Today, This Week,
                Backlog, Waiting), a <strong>priority</strong> (High / Medium / Low), and an optional due date.
                Tasks can be linked to a specific arrears creditor and/or arrears item, making it easy to see
                all outstanding actions for each debt.
                <br /><br />
                Tasks can be created from the Tasks page directly, or from any Arrears item's detail page
                (pre-filled with the creditor). The Arrears list also has a quick-add button per card.
              </span>
            }
            relations={[
              { label: "Arrears", href: "/arrears" },
              { label: "Dashboard", href: "/dashboard" },
              { label: "Settings (task_bucket)", href: "/settings" },
            ]}
            rules={[
              "Task buckets (Today, This Week, Backlog, Waiting) are controlled by Settings > Tasks > Task Buckets. Customise the bucket names to match your workflow. The bucket is your primary organisational tool — use it to represent urgency and timeframe, not just category.",
              "Task priority is stored as p1 (High), p2 (Medium), p3 (Low). This is intentionally separate from the Settings task_priority namespace to prevent data corruption from label changes.",
              "Marking a task 'done' from any screen (Tasks page, Arrears detail, Dashboard) instantly updates the count across all views.",
              "Tasks linked to an arrears item appear in the Related Tasks panel on that arrears item's detail page. The badge shows how many are still open.",
              "Tasks are not auto-created by the app — all tasks must be added manually.",
            ]}
            setup={[
              "Go to Settings > Tasks. Review the default buckets. Star your most-used bucket as the default so new tasks land there.",
              "Create tasks for any immediate financial actions — calling creditors, submitting documents, reviewing statements.",
              "For arrears-related tasks, create them from the Arrears item detail page so they are automatically linked.",
              "Work through Today tasks daily. Move items between buckets as urgency changes.",
              "Archive completed tasks by marking them done — they move out of the active view but are preserved.",
            ]}
          />
        </TabsContent>

        <TabsContent value="comms">
          <DocSection
            icon={MessageSquare}
            title="Comms Log"
            tagline="A dated record of every communication with creditors, services, and agencies."
            what={
              <span>
                The Comms Log records phone calls, emails, letters, and in-person meetings with creditors,
                Centrelink, legal services, and other parties. Each entry captures the date, contact method,
                direction (inbound/outbound), the party contacted, and a summary of what was discussed or agreed.
                <br /><br />
                Comms entries can be linked to a specific arrears item, making it easy to build a complete
                communication timeline for each debt.
              </span>
            }
            relations={[
              { label: "Arrears", href: "/arrears" },
            ]}
            rules={[
              "All communication records are permanent — there is no delete function on comms entries. They form a legal-quality record of what was said and agreed.",
              "Entries linked to an arrears item appear in the Recent Comms panel on that item's detail page.",
              "Log every significant communication promptly while details are fresh. Include reference numbers, staff names, and any commitments made by either party.",
            ]}
            setup={[
              "Each time you call a creditor, log the call: date, who you spoke to, what was agreed, any reference number given.",
              "For arrears items, log comms from the arrears detail page — they will be automatically linked.",
              "Include inbound communications too — letters received, calls from debt collectors, formal notices.",
              "Use the notes field to copy any key reference numbers, case IDs, or quoted amounts.",
            ]}
          />
        </TabsContent>

        <TabsContent value="weekly">
          <DocSection
            icon={CalendarDays}
            title="Weekly Tracker"
            tagline="What actually happened this week versus what the budget planned."
            what={
              <span>
                The Weekly Tracker is your weekly reconciliation tool. Each week (Monday to Sunday), you enter
                actual income received and actual spending per budget category. The tracker compares these
                against your income sources and budget targets, showing the variance.
                <br /><br />
                Weeks are displayed in Australian financial year order, starting 1 July. Week 1 is always the
                first Monday of July. All weeks start on Monday.
              </span>
            }
            relations={[
              { label: "Income & Bills", href: "/income-bills" },
              { label: "Family Budget", href: "/family-budget" },
              { label: "Dashboard", href: "/dashboard" },
            ]}
            rules={[
              "All weeks begin on Monday. The financial year begins 1 July. Week numbering resets each financial year.",
              "Actual amounts in the Weekly Tracker are independent of income source records — entering an actual here does not affect the income source expected amount.",
              "If a budget category has no actual entry for a week, it is treated as $0 spent — not as 'not tracked'. Enter zero explicitly if you spent nothing in a category.",
              "The weekly tracker does not auto-populate from bills or gig entries — all actuals must be entered manually.",
            ]}
            setup={[
              "Ensure Family Budget categories and targets are set up first — the tracker uses them as benchmarks.",
              "At the end of each week (or beginning of the next), review bank statements and enter actual amounts for each category.",
              "Enter actual income received, noting which income source it relates to.",
              "Review the variance column — categories significantly over-budget need attention.",
            ]}
          />
        </TabsContent>

        <TabsContent value="shopping">
          <DocSection
            icon={ShoppingCart}
            title="Shopping"
            tagline="Manage recurring grocery and household items — build lists fast."
            what={
              <span>
                Shopping manages a master list of <strong>items</strong> you regularly buy — groceries,
                toiletries, household supplies. Each item has a preferred store, category, usual frequency,
                and priority. From the master list, you can build <strong>shopping lists</strong> — one-off
                or recurring sets of items for a specific shopping run.
                <br /><br />
                Shopping is designed to reduce decision fatigue: set up your regular items once, then generate
                lists quickly without thinking about what you need.
              </span>
            }
            relations={[]}
            rules={[
              "Shopping items are standalone — they do not link directly to budget categories or weekly tracker entries. Budget the total grocery spend in Family Budget instead.",
              "Items can be marked active/inactive. Inactive items don't appear in new list suggestions but are preserved.",
              "Lists can be archived once completed, keeping the history without cluttering the active view.",
            ]}
            setup={[
              "Add your regular grocery and household items to the master items list.",
              "Set the preferred store, category, and usual frequency for each item — this helps with list suggestions.",
              "When you're ready to shop, create a new list and add items from the master list.",
              "Check items off as you shop. Archive the list when done.",
            ]}
          />
        </TabsContent>

        <TabsContent value="scenarios">
          <DocSection
            icon={GitBranch}
            title="Scenarios"
            tagline="Model 'what if' financial situations before they happen."
            what={
              <span>
                Scenarios let you create alternative financial projections based on changes to income, bills,
                or arrears payments. For example: "What if rent increases by $50/week?" or "What if I get
                an extra Centrelink payment?". Each scenario can be compared against the current baseline.
                <br /><br />
                Scenarios are modelling tools only — they do not affect any real data.
              </span>
            }
            relations={[
              { label: "Income & Bills", href: "/income-bills" },
              { label: "Arrears", href: "/arrears" },
              { label: "Dashboard", href: "/dashboard" },
            ]}
            rules={[
              "Scenarios are read-only projections. Saving a scenario does not change any income, bill, or arrears record.",
              "Scenarios use the current live data as their baseline. If income or bills change, re-run the scenario to see updated projections.",
              "Scenarios are for planning and conversation — use them when negotiating payment arrangements or applying for financial assistance.",
            ]}
            setup={[
              "Ensure your current income, bills, and arrears are accurately entered first — scenarios are only as good as the baseline data.",
              "Create a scenario by describing the change (e.g. income increase, new bill, reduced arrears payment).",
              "Review the projected cashflow difference versus the current baseline.",
              "Use scenarios to test payment arrangement proposals before agreeing to them with creditors.",
            ]}
          />
        </TabsContent>

        <TabsContent value="dashboard">
          <DocSection
            icon={LayoutDashboard}
            title="Dashboard"
            tagline="Your daily financial snapshot — everything that matters, at a glance."
            what={
              <span>
                The Dashboard aggregates data from every other module into a single-screen overview. It shows:
                <br /><br />
                <strong>Cashflow summary</strong> — weekly income versus weekly bills and arrears commitments,
                giving a net weekly position.<br />
                <strong>Arrears matrix</strong> — all active arrangements with their weekly commitment totals.<br />
                <strong>Upcoming bills</strong> — bills due in the next 14 days.<br />
                <strong>Open tasks</strong> — tasks in the Today and This Week buckets.<br />
                <strong>Exports</strong> — download any module's data as CSV or the full dataset as JSON.
              </span>
            }
            relations={[
              { label: "Income & Bills", href: "/income-bills" },
              { label: "Arrears", href: "/arrears" },
              { label: "Tasks", href: "/tasks" },
              { label: "Gig Work", href: "/gig-work" },
              { label: "Weekly Tracker", href: "/weekly" },
            ]}
            rules={[
              "The Dashboard is read-only — no data entry happens here. It reflects whatever is in the other modules.",
              "Cashflow figures are based on expected amounts (income sources and bills), not actuals. For actual cashflow, use the Weekly Tracker.",
              "The arrears matrix shows only 'active' arrears items. Resolved/written-off items are excluded.",
              "High and Critical risk arrears items are highlighted to draw immediate attention.",
              "Exports on the Dashboard are the primary way to share data externally (with financial counsellors, support workers, etc.).",
            ]}
            setup={[
              "The Dashboard requires no setup of its own — it shows data from other modules.",
              "For a useful Dashboard, ensure Income & Bills, Arrears, and Tasks are populated.",
              "Check the Dashboard daily as your first financial action of the day.",
              "Use the export function before meetings with financial counsellors or Centrelink.",
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
