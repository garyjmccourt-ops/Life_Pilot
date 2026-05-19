import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTasks, getListTasksQueryKey,
  useCreateTask, useUpdateTask, useDeleteTask,
  useListArrears,
} from "@workspace/api-client-react";
import { useLookup, getDefaultValue } from "@/hooks/use-lookup";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Circle, Clock, PauseCircle, CheckCircle2, SkipForward, XCircle,
  Plus, Pencil, Trash2, CalendarDays, AlertCircle, User, Tag,
  ChevronDown, ChevronUp, Filter,
} from "lucide-react";

// ── Status / Priority config ──────────────────────────────────────────────────

type TaskStatus = "open" | "in-progress" | "waiting" | "done" | "deferred" | "cancelled";
type TaskPriority = "critical" | "p1" | "p2" | "p3";

const STATUS_CONFIG: Record<TaskStatus, {
  label: string; icon: React.ElementType; iconClass: string; badgeClass: string;
}> = {
  "open":        { label: "Not Started", icon: Circle,       iconClass: "text-slate-400",  badgeClass: "bg-slate-100 text-slate-600 border-slate-200" },
  "in-progress": { label: "In Progress", icon: Clock,        iconClass: "text-blue-500",   badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  "waiting":     { label: "Waiting",     icon: PauseCircle,  iconClass: "text-amber-500",  badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  "done":        { label: "Done",        icon: CheckCircle2, iconClass: "text-green-500",  badgeClass: "bg-green-50 text-green-700 border-green-200" },
  "deferred":    { label: "Deferred",    icon: SkipForward,  iconClass: "text-slate-400",  badgeClass: "bg-slate-50 text-slate-500 border-slate-200" },
  "cancelled":   { label: "Cancelled",   icon: XCircle,      iconClass: "text-rose-400",   badgeClass: "bg-rose-50 text-rose-500 border-rose-200" },
};

const PRIORITY_CONFIG: Record<TaskPriority, {
  label: string; borderClass: string; badgeClass: string; show: boolean;
}> = {
  "critical": { label: "Critical", borderClass: "border-l-rose-600",   badgeClass: "bg-rose-100 text-rose-700 border-rose-200",   show: true },
  "p1":       { label: "High",     borderClass: "border-l-orange-400", badgeClass: "bg-orange-100 text-orange-700 border-orange-200", show: true },
  "p2":       { label: "Medium",   borderClass: "border-l-amber-300",  badgeClass: "bg-amber-50 text-amber-700 border-amber-200",  show: false },
  "p3":       { label: "Low",      borderClass: "border-l-slate-200",  badgeClass: "bg-slate-50 text-slate-500 border-slate-200",  show: false },
};

const ACTIVE_STATUSES: TaskStatus[] = ["open", "in-progress", "waiting"];
const TERMINAL_STATUSES: TaskStatus[] = ["done", "deferred", "cancelled"];
const STATUS_CYCLE: TaskStatus[] = ["open", "in-progress", "waiting", "done"];

const PRIORITY_ORDER: Record<string, number> = { critical: 0, p1: 1, p2: 2, p3: 3 };

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().slice(0, 10); }

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday: monday.toISOString().slice(0, 10), sunday: sunday.toISOString().slice(0, 10) };
}

function dueDateStr(d: any): string | null {
  if (!d) return null;
  if (typeof d === "string") return d.slice(0, 10);
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return null;
}

function isOverdue(task: any) {
  const d = dueDateStr(task.dueDate);
  return !!d && d < todayStr() && ACTIVE_STATUSES.includes(task.status as TaskStatus);
}

// ── Sort ──────────────────────────────────────────────────────────────────────

function sortTasks(tasks: any[]) {
  return [...tasks].sort((a, b) => {
    const po = (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4);
    if (po !== 0) return po;
    // overdue first
    const aOver = isOverdue(a) ? 0 : 1;
    const bOver = isOverdue(b) ? 0 : 1;
    if (aOver !== bOver) return aOver - bOver;
    // then by due date ascending
    const da = dueDateStr(a.dueDate) ?? "9999";
    const db_ = dueDateStr(b.dueDate) ?? "9999";
    if (da !== db_) return da < db_ ? -1 : 1;
    return a.id - b.id;
  });
}

// ── Quick-filter type ─────────────────────────────────────────────────────────

type QuickFilter = "active" | "today" | "this-week" | "overdue";

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Tasks() {
  const { data: allTasks = [], isLoading } = useListTasks();
  const { data: bucketLookup = [] } = useLookup("task_bucket");
  const { data: peopleLookup = [] } = useLookup("household_people");

  const [quickFilter, setQuickFilter] = useState<QuickFilter>("active");
  const [bucketFilter, setBucketFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [personFilter, setPersonFilter] = useState<string>("all");
  const [showTerminal, setShowTerminal] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<any | null>(null);

  const buckets = bucketLookup.filter(b => b.value !== "").map(b => ({ value: b.value, label: b.label }));

  const today = todayStr();
  const { monday, sunday } = getWeekBounds();

  // Split active vs terminal
  const activeTasks = (allTasks as any[]).filter(t => ACTIVE_STATUSES.includes(t.status));
  const terminalTasks = (allTasks as any[]).filter(t => TERMINAL_STATUSES.includes(t.status));

  // Apply quick filter
  const quickFiltered = useMemo(() => {
    switch (quickFilter) {
      case "today":
        return activeTasks.filter(t => {
          const d = dueDateStr(t.dueDate);
          return d === today;
        });
      case "this-week":
        return activeTasks.filter(t => {
          const d = dueDateStr(t.dueDate);
          return !!d && d >= monday && d <= sunday;
        });
      case "overdue":
        return activeTasks.filter(isOverdue);
      default:
        return activeTasks;
    }
  }, [allTasks, quickFilter, today, monday, sunday]);

  // Apply secondary filters
  const filtered = useMemo(() => {
    return quickFiltered.filter(t => {
      if (bucketFilter !== "all" && t.bucket !== bucketFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (personFilter !== "all" && t.assignedPerson !== personFilter) return false;
      return true;
    });
  }, [quickFiltered, bucketFilter, statusFilter, personFilter]);

  const sorted = sortTasks(filtered);
  const sortedTerminal = sortTasks(terminalTasks);

  // Quick-filter counts
  const counts = {
    active: activeTasks.length,
    today: activeTasks.filter(t => dueDateStr(t.dueDate) === today).length,
    "this-week": activeTasks.filter(t => { const d = dueDateStr(t.dueDate); return !!d && d >= monday && d <= sunday; }).length,
    overdue: activeTasks.filter(isOverdue).length,
  };

  const quickTabs: { key: QuickFilter; label: string; count: number; urgentClass?: string }[] = [
    { key: "active",    label: "All Active",  count: counts.active },
    { key: "today",     label: "Today",       count: counts.today,     urgentClass: counts.today > 0 ? "text-blue-600" : "" },
    { key: "this-week", label: "This Week",   count: counts["this-week"] },
    { key: "overdue",   label: "Overdue",     count: counts.overdue,   urgentClass: counts.overdue > 0 ? "text-rose-600" : "" },
  ];

  if (isLoading) return <div className="p-8"><Skeleton className="h-64" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Action Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {sorted.length} task{sorted.length !== 1 ? "s" : ""} in this view
            {counts.overdue > 0 && (
              <span className="ml-2 text-rose-600 font-medium">· {counts.overdue} overdue</span>
            )}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Task
        </Button>
      </div>

      {/* Quick filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {quickTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setQuickFilter(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border
              ${quickFilter === tab.key
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                quickFilter === tab.key
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : tab.urgentClass || "bg-muted text-muted-foreground"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bucket pills */}
      {buckets.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setBucketFilter("all")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors border whitespace-nowrap
              ${bucketFilter === "all" ? "bg-secondary text-secondary-foreground border-secondary" : "bg-background text-muted-foreground border-border hover:bg-muted"}`}
          >
            All Buckets
          </button>
          {buckets.map(b => (
            <button
              key={b.value}
              onClick={() => setBucketFilter(bucketFilter === b.value ? "all" : b.value)}
              className={`px-3 py-1 rounded text-xs font-medium uppercase tracking-wide transition-colors border whitespace-nowrap
                ${bucketFilter === b.value ? "bg-primary/10 text-primary border-primary/30" : "bg-background text-muted-foreground border-border hover:bg-muted"}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}

      {/* Secondary filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(STATUS_CONFIG) as [TaskStatus, any][])
              .filter(([k]) => ACTIVE_STATUSES.includes(k))
              .map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))
            }
          </SelectContent>
        </Select>

        {peopleLookup.filter(p => p.value !== "" && p.label !== "").length > 0 && (
          <Select value={personFilter} onValueChange={setPersonFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[130px] text-xs">
              <SelectValue placeholder="Person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All People</SelectItem>
              {peopleLookup.filter(p => p.value !== "" && p.label !== "").map(p => (
                <SelectItem key={p.value} value={p.label}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {(bucketFilter !== "all" || statusFilter !== "all" || personFilter !== "all") && (
          <button
            onClick={() => { setBucketFilter("all"); setStatusFilter("all"); setPersonFilter("all"); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Task list */}
      {sorted.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground border border-dashed rounded-lg">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nothing here right now.</p>
          <p className="text-sm mt-1">
            {quickFilter !== "active" ? "Try switching to All Active" : "Create a task to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(task => (
            <TaskRow key={task.id} task={task} onEdit={() => setEditTask(task)} />
          ))}
        </div>
      )}

      {/* Terminal tasks (done / deferred / cancelled) */}
      {terminalTasks.length > 0 && (
        <div className="pt-4 border-t border-border">
          <button
            onClick={() => setShowTerminal(v => !v)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            {showTerminal ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Completed / Deferred / Cancelled ({terminalTasks.length})
          </button>
          {showTerminal && (
            <div className="space-y-2 opacity-70 hover:opacity-100 transition-opacity">
              {sortedTerminal.map(task => (
                <TaskRow key={task.id} task={task} onEdit={() => setEditTask(task)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <TaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
      />
      {editTask && (
        <TaskDialog
          open={!!editTask}
          onOpenChange={open => { if (!open) setEditTask(null); }}
          mode="edit"
          task={editTask}
        />
      )}
    </div>
  );
}

// ── Task Row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, onEdit }: { task: any; onEdit: () => void }) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const { toast } = useToast();

  const status = (task.status || "open") as TaskStatus;
  const priority = (task.priority || "p2") as TaskPriority;
  const overdue = isOverdue(task);
  const dueStr = dueDateStr(task.dueDate);
  const sc = STATUS_CONFIG[status] ?? STATUS_CONFIG["open"];
  const pc = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG["p2"];
  const StatusIcon = sc.icon;

  function cycleStatus() {
    const idx = STATUS_CYCLE.indexOf(status);
    const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    const updates: any = { ...task, status: nextStatus };
    if (nextStatus === "done") updates.completedAt = todayStr();
    updateMutation.mutate({ id: task.id, data: updates }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        toast({ title: `Task marked ${STATUS_CONFIG[nextStatus as TaskStatus]?.label ?? nextStatus}` });
      },
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${task.title}"?`)) return;
    deleteMutation.mutate({ id: task.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        toast({ title: "Task deleted" });
      },
    });
  }

  const isTerminal = TERMINAL_STATUSES.includes(status);

  return (
    <Card className={`group border-l-4 transition-all ${pc.borderClass} ${isTerminal ? "opacity-60 hover:opacity-100" : ""}`}>
      <CardContent className="p-3 flex items-start gap-3">
        {/* Status toggle */}
        <button
          onClick={cycleStatus}
          className={`flex-shrink-0 mt-0.5 transition-colors ${sc.iconClass} hover:scale-110`}
          title={`${sc.label} — click to advance`}
        >
          <StatusIcon className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm leading-snug ${isTerminal ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {task.title}
          </p>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
            {/* Status badge */}
            <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded border font-medium ${sc.badgeClass}`}>
              {sc.label}
            </span>

            {/* Priority badge — only show for critical/high */}
            {pc.show && (
              <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded border font-medium ${pc.badgeClass}`}>
                {priority === "critical" && <AlertCircle className="h-3 w-3 mr-1" />}
                {pc.label}
              </span>
            )}

            {/* Bucket */}
            {task.bucket && (
              <span className="text-xs font-medium uppercase tracking-wide text-primary/60">
                {task.bucket}
              </span>
            )}

            {/* Assigned person */}
            {task.assignedPerson && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                {task.assignedPerson}
              </span>
            )}

            {/* Creditor tag */}
            {task.creditorTag && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Tag className="h-3 w-3" />
                {task.creditorTag}
              </span>
            )}

            {/* Due date */}
            {dueStr && (
              <span className={`flex items-center gap-1 text-xs font-medium ${overdue ? "text-rose-600" : "text-muted-foreground"}`}>
                <CalendarDays className="h-3 w-3" />
                {overdue ? "OVERDUE · " : ""}
                {formatDate(dueStr)}
              </span>
            )}
          </div>

          {/* Notes preview */}
          {task.notes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">{task.notes}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Task Dialog (create + edit) ───────────────────────────────────────────────

type DialogMode = "create" | "edit";

function TaskDialog({
  open, onOpenChange, mode, task,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  task?: any;
}) {
  const queryClient = useQueryClient();
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const { toast } = useToast();
  const { data: arrears } = useListArrears();
  const { data: bucketLookup = [] } = useLookup("task_bucket");
  const { data: peopleLookup = [] } = useLookup("household_people");

  const buckets = bucketLookup.filter(b => b.value !== "").map(b => ({ value: b.value, label: b.label }));
  const people = peopleLookup.filter(p => p.value !== "" && p.label !== "");
  const defaultBucket = getDefaultValue(bucketLookup) ?? buckets[0]?.value ?? "pay";

  const [form, setForm] = useState(() => ({
    title: task?.title ?? "",
    description: task?.description ?? "",
    bucket: task?.bucket ?? defaultBucket,
    status: (task?.status ?? "open") as TaskStatus,
    priority: (task?.priority ?? "p2") as TaskPriority,
    dueDate: dueDateStr(task?.dueDate) ?? "",
    assignedPerson: task?.assignedPerson ?? "",
    creditorTag: task?.creditorTag ?? "",
    arrearsItemId: task?.arrearsItemId ? String(task.arrearsItemId) : "none",
    notes: task?.notes ?? "",
  }));

  const sf = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  function buildPayload() {
    return {
      title: form.title,
      description: form.description || null,
      bucket: form.bucket,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      assignedPerson: form.assignedPerson || null,
      creditorTag: form.creditorTag || null,
      arrearsItemId: form.arrearsItemId !== "none" ? Number(form.arrearsItemId) : null,
      notes: form.notes || null,
      recurring: false,
      completedAt: form.status === "done" ? (dueDateStr(task?.completedAt) ?? todayStr()) : null,
    } as any;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({ data: buildPayload() });
        toast({ title: "Task created" });
      } else {
        await updateMutation.mutateAsync({ id: task.id, data: buildPayload() });
        toast({ title: "Task saved" });
      }
      queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      onOpenChange(false);
    } catch {
      toast({ title: "Error saving task", variant: "destructive" });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Task" : "Edit Task"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input
              value={form.title}
              onChange={sf("title")}
              placeholder="What needs doing?"
              required
              autoFocus
            />
          </div>

          {/* Bucket + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Bucket</Label>
              <Select value={form.bucket} onValueChange={v => setForm(p => ({ ...p, bucket: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {buckets.length > 0
                    ? buckets.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)
                    : ["pay","contact","file","review","negotiate","watch"].map(v => (
                        <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v as TaskPriority }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">🔴 Critical</SelectItem>
                  <SelectItem value="p1">🟠 High</SelectItem>
                  <SelectItem value="p2">🟡 Medium</SelectItem>
                  <SelectItem value="p3">⚪ Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as TaskStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="deferred">Deferred</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={sf("dueDate")} />
            </div>
          </div>

          {/* Assigned Person + Creditor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              {people.length > 0 ? (
                <Select value={form.assignedPerson || "__none__"} onValueChange={v => setForm(p => ({ ...p, assignedPerson: v === "__none__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Anyone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Anyone —</SelectItem>
                    {people.map(p => <SelectItem key={p.value} value={p.label}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={form.assignedPerson} onChange={sf("assignedPerson")} placeholder="e.g. Gary" />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Creditor / Tag</Label>
              <Input value={form.creditorTag} onChange={sf("creditorTag")} placeholder="e.g. SA Water" />
            </div>
          </div>

          {/* Link to Arrears */}
          <div className="space-y-1.5">
            <Label>Link to Arrears (optional)</Label>
            <Select value={form.arrearsItemId} onValueChange={v => setForm(p => ({ ...p, arrearsItemId: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {(arrears ?? []).map((a: any) => (
                  <SelectItem key={a.id} value={String(a.id)}>{a.creditor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={sf("notes")}
              placeholder="Additional context, reference numbers, next steps…"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : mode === "create" ? "Create Task" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
