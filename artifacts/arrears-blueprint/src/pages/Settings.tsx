import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Settings2, Lock, Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight, History, Star, Download, Upload, Info } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type LookupValue = {
  id: number;
  namespace: string;
  value: string;
  label: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
};

type AuditEntry = {
  id: number;
  entityType: string;
  entityId: string | null;
  action: string;
  actor: string;
  before: unknown;
  after: unknown;
  notes: string | null;
  createdAt: string;
};

// ── Fetch utilities ───────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL;

async function fetchLookup(namespace: string): Promise<LookupValue[]> {
  const res = await fetch(`${BASE}api/settings/lookup?namespace=${namespace}`);
  if (!res.ok) throw new Error("Failed to load");
  return res.json();
}

async function createLookup(body: {
  namespace: string;
  value: string;
  label: string;
  description?: string;
  sortOrder?: number;
  isDefault?: boolean;
}): Promise<LookupValue> {
  const res = await fetch(`${BASE}api/settings/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Failed to create");
  }
  return res.json();
}

async function updateLookup(
  id: number,
  body: Partial<{ label: string; description: string | null; isActive: boolean; isDefault: boolean; sortOrder: number }>,
): Promise<LookupValue> {
  const res = await fetch(`${BASE}api/settings/lookup/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Failed to update");
  }
  return res.json();
}

/** Returns { action: "deleted" | "deactivated", usageCount?: number } */
async function deleteLookup(id: number): Promise<{ action: "deleted" | "deactivated"; usageCount?: number }> {
  const res = await fetch(`${BASE}api/settings/lookup/${id}`, { method: "DELETE" });
  if (res.status === 204) return { action: "deleted" };
  if (res.status === 200) {
    const body = await res.json().catch(() => ({}));
    return { action: "deactivated", usageCount: body.usageCount };
  }
  const err = await res.json().catch(() => ({}));
  throw new Error((err as any).error ?? "Failed to delete");
}

async function fetchAuditLog(limit = 50): Promise<AuditEntry[]> {
  const res = await fetch(`${BASE}api/settings/audit-log?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to load");
  return res.json();
}

// ── LookupSection ─────────────────────────────────────────────────────────────

function LookupSection({
  namespace,
  title,
  hint,
  valuePrefix,
}: {
  namespace: string;
  title: string;
  hint?: string;
  valuePrefix?: string;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const qk = ["lookup", namespace];

  const { data: rows = [], isLoading } = useQuery({
    queryKey: qk,
    queryFn: () => fetchLookup(namespace),
  });

  const [addLabel, setAddLabel] = useState("");
  const [addValue, setAddValue] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [adding, setAdding] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDesc, setEditDesc] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addLabel.trim()) return;
    setAdding(true);
    const raw = addValue.trim() || addLabel.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const value = valuePrefix ? `${valuePrefix}_${raw}` : raw;
    try {
      await createLookup({
        namespace,
        value,
        label: addLabel.trim(),
        description: addDesc.trim() || undefined,
        sortOrder: rows.length + 1,
      });
      queryClient.invalidateQueries({ queryKey: qk });
      setAddLabel("");
      setAddValue("");
      setAddDesc("");
      toast({ title: "Added" });
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleActive(row: LookupValue) {
    try {
      await updateLookup(row.id, { isActive: !row.isActive });
      queryClient.invalidateQueries({ queryKey: qk });
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    }
  }

  async function handleSetDefault(row: LookupValue) {
    try {
      // Toggle off if already default; set on if not
      await updateLookup(row.id, { isDefault: !row.isDefault });
      queryClient.invalidateQueries({ queryKey: qk });
      toast({ title: row.isDefault ? "Default cleared" : `"${row.label}" set as default` });
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    }
  }

  async function handleSaveEdit(id: number) {
    try {
      await updateLookup(id, { label: editLabel, description: editDesc || null });
      queryClient.invalidateQueries({ queryKey: qk });
      setEditId(null);
      toast({ title: "Updated" });
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    }
  }

  async function handleDelete(row: LookupValue) {
    if (!confirm(`Remove "${row.label}"?\n\nIf this value is in use by existing records it will be deactivated instead of deleted.`)) return;
    try {
      const result = await deleteLookup(row.id);
      queryClient.invalidateQueries({ queryKey: qk });
      if (result.action === "deactivated") {
        toast({
          title: `"${row.label}" deactivated`,
          description: `In use by ${result.usageCount} record(s) — kept but hidden from new forms.`,
        });
      } else {
        toast({ title: "Deleted" });
      }
    } catch (err) {
      toast({ title: (err as Error).message, variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-serif">{title}</CardTitle>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add form */}
        <form onSubmit={handleAdd} className="flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <Label className="text-xs">Label</Label>
            <Input
              value={addLabel}
              onChange={e => setAddLabel(e.target.value)}
              placeholder="Display name"
              className="h-8 text-sm"
              required
            />
          </div>
          <div className="w-[130px]">
            <Label className="text-xs">Code (auto)</Label>
            <Input
              value={addValue}
              onChange={e => setAddValue(e.target.value)}
              placeholder="auto_generated"
              className="h-8 text-sm font-mono"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <Label className="text-xs">Description</Label>
            <Input
              value={addDesc}
              onChange={e => setAddDesc(e.target.value)}
              placeholder="Optional"
              className="h-8 text-sm"
            />
          </div>
          <Button type="submit" size="sm" disabled={adding || !addLabel.trim()} className="h-8">
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </form>

        {/* List */}
        {isLoading ? (
          <Skeleton className="h-20" />
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No values yet.</p>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b text-xs text-muted-foreground">
                  <th className="px-3 py-1.5 text-left font-medium w-6">#</th>
                  <th className="px-3 py-1.5 text-left font-medium">Label</th>
                  <th className="px-3 py-1.5 text-left font-medium hidden md:table-cell">Code</th>
                  <th className="px-3 py-1.5 text-left font-medium hidden lg:table-cell">Description</th>
                  <th className="px-3 py-1.5 text-center font-medium" title="Set as default for new forms">Default</th>
                  <th className="px-3 py-1.5 text-center font-medium">Active</th>
                  <th className="px-3 py-1.5 text-right font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr
                    key={row.id}
                    className={`border-b last:border-0 transition-colors ${row.isActive ? "hover:bg-muted/20" : "bg-muted/10 opacity-60 hover:bg-muted/20"}`}
                  >
                    <td className="px-3 py-1.5 text-muted-foreground text-xs">{row.sortOrder}</td>
                    <td className="px-3 py-1.5">
                      {editId === row.id ? (
                        <Input
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          className="h-7 text-sm py-0"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{row.label}</span>
                          {row.isSystem && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 gap-0.5">
                              <Lock className="h-2.5 w-2.5" /> system
                            </Badge>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-1.5 hidden md:table-cell">
                      <code className="text-xs text-muted-foreground bg-muted/50 px-1 rounded">{row.value}</code>
                    </td>
                    <td className="px-3 py-1.5 hidden lg:table-cell">
                      {editId === row.id ? (
                        <Input
                          value={editDesc}
                          onChange={e => setEditDesc(e.target.value)}
                          className="h-7 text-sm py-0"
                          placeholder="Optional"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">{row.description ?? "—"}</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleSetDefault(row)}
                        className={`transition-colors ${row.isDefault ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground/40 hover:text-amber-400"}`}
                        title={row.isDefault ? "Default for new forms — click to clear" : "Set as default for new forms"}
                        disabled={!row.isActive}
                      >
                        <Star className={`h-4 w-4 ${row.isDefault ? "fill-amber-500" : ""}`} />
                      </button>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(row)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title={row.isActive ? "Deactivate" : "Activate"}
                      >
                        {row.isActive
                          ? <ToggleRight className="h-4 w-4 text-primary" />
                          : <ToggleLeft className="h-4 w-4" />
                        }
                      </button>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      {editId === row.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleSaveEdit(row.id)}>
                            <Check className="h-3 w-3 text-primary" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditId(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon" variant="ghost" className="h-6 w-6"
                            onClick={() => { setEditId(row.id); setEditLabel(row.label); setEditDesc(row.description ?? ""); }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(row)}
                            disabled={row.isSystem}
                            title={row.isSystem ? "System values cannot be deleted" : "Remove (deactivates if in use)"}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── AuditLogSection ───────────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  deactivate: "bg-orange-100 text-orange-700",
  import: "bg-purple-100 text-purple-700",
  export: "bg-orange-100 text-orange-700",
};

function AuditLogSection() {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["audit-log"],
    queryFn: () => fetchAuditLog(100),
  });

  function fmt(d: string) {
    const date = new Date(d);
    return date.toLocaleString("en-AU", { dateStyle: "short", timeStyle: "short" });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base font-serif">Audit Log</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          All create, update, delete, import, and export actions. Actor: <code className="text-xs bg-muted/50 px-1 rounded">local-user</code>
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40" />
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No activity yet.</p>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b text-xs text-muted-foreground">
                  <th className="px-3 py-1.5 text-left font-medium">Time</th>
                  <th className="px-3 py-1.5 text-left font-medium">Action</th>
                  <th className="px-3 py-1.5 text-left font-medium">Entity</th>
                  <th className="px-3 py-1.5 text-left font-medium hidden md:table-cell">Actor</th>
                  <th className="px-3 py-1.5 text-left font-medium hidden lg:table-cell">Detail</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => {
                  const label = (e.after as any)?.label ?? (e.before as any)?.label ?? e.entityId ?? "—";
                  const ns = (e.after as any)?.namespace ?? (e.before as any)?.namespace ?? "";
                  return (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-1.5 text-xs text-muted-foreground whitespace-nowrap">{fmt(e.createdAt)}</td>
                      <td className="px-3 py-1.5">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[e.action] ?? "bg-gray-100 text-gray-600"}`}>
                          {e.action}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 font-medium text-xs">
                        {ns && <code className="text-muted-foreground mr-1 bg-muted/50 px-1 rounded">{ns}</code>}
                        {label}
                      </td>
                      <td className="px-3 py-1.5 text-xs text-muted-foreground hidden md:table-cell">{e.actor}</td>
                      <td className="px-3 py-1.5 hidden lg:table-cell">
                        {e.notes && <span className="text-xs text-muted-foreground italic">{e.notes}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── DataManagementSection ─────────────────────────────────────────────────────

function DataManagementSection() {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch(`${BASE}api/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Import failed");
      }
      const result = await res.json();
      toast({ title: "Import complete", description: `Imported ${result.imported ?? "?"} records.` });
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  const csvExports = [
    { label: "Income Entries", href: `${BASE}api/export/csv/income` },
    { label: "Bills", href: `${BASE}api/export/csv/bills` },
    { label: "Arrears", href: `${BASE}api/export/csv/arrears` },
    { label: "Tasks", href: `${BASE}api/export/csv/tasks` },
    { label: "Comms Log", href: `${BASE}api/export/csv/comms` },
    { label: "Gig Work", href: `${BASE}api/export/csv/gig` },
    { label: "Shopping Items", href: `${BASE}api/export/csv/shopping` },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Full Export — JSON</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Downloads all modules as a single JSON file. Use this for backups, sharing with financial counsellors, or migrating data.
          </p>
        </CardHeader>
        <CardContent>
          <a href={`${BASE}api/export`} download>
            <Button variant="default" className="gap-2">
              <Download className="h-4 w-4" /> Download Full Export (JSON)
            </Button>
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">Per-Table CSV Downloads</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Download individual modules as CSV for use in spreadsheets.</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {csvExports.map(({ label, href }) => (
              <a key={href} href={href} download>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> {label}
                </Button>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">Import Data — JSON</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Import a previously exported MYOH JSON file. This will add the records — it does not delete or overwrite existing data.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-md px-3 py-2 text-xs text-amber-700">
            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>Import adds new records. It will not delete existing data or handle duplicate detection — only import into a fresh install or after clearing data manually.</span>
          </div>
          <label className="cursor-pointer">
            <input type="file" accept=".json" className="sr-only" onChange={handleImport} disabled={importing} />
            <Button variant="outline" className="gap-2 pointer-events-none" disabled={importing} asChild={false}>
              <Upload className="h-4 w-4" /> {importing ? "Importing…" : "Choose JSON File to Import"}
            </Button>
          </label>
        </CardContent>
      </Card>
    </div>
  );
}

// ── BudgetDefaultsSection ─────────────────────────────────────────────────────

const DEFAULTS_KEY = "myoh_budget_defaults";

const DEFAULT_VALUES = {
  weekStartDay: "Monday",
  rentWeekly: "0",
  grocerySurvival: "150",
  groceryNormal: "220",
  fuelWeekly: "50",
  emergencyBuffer: "100",
  planningHorizonWeeks: "8",
};

function BudgetDefaultsSection() {
  const { toast } = useToast();

  const [defaults, setDefaults] = useState<typeof DEFAULT_VALUES>(() => {
    try {
      const saved = localStorage.getItem(DEFAULTS_KEY);
      return saved ? { ...DEFAULT_VALUES, ...JSON.parse(saved) } : { ...DEFAULT_VALUES };
    } catch { return { ...DEFAULT_VALUES }; }
  });

  function handleChange(key: keyof typeof DEFAULT_VALUES) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setDefaults(prev => ({ ...prev, [key]: e.target.value }));
  }

  function handleSave() {
    try {
      localStorage.setItem(DEFAULTS_KEY, JSON.stringify(defaults));
      toast({ title: "Defaults saved locally" });
    } catch {
      toast({ title: "Could not save defaults", variant: "destructive" });
    }
  }

  function handleReset() {
    setDefaults({ ...DEFAULT_VALUES });
    localStorage.removeItem(DEFAULTS_KEY);
    toast({ title: "Defaults reset" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
        <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-blue-600" />
        <span>
          These reference values are stored on this device only. They are used as planning aids in the Weekly Tracker and Scenarios pages.
          They do not affect bills, arrears, or income records.
        </span>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Budget Assumptions</CardTitle>
          <p className="text-xs text-muted-foreground">Default figures Gary and Sam use as weekly planning references.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Week Start Day</Label>
              <Input value={defaults.weekStartDay} onChange={handleChange("weekStartDay")} placeholder="Monday" />
            </div>
            <div>
              <Label>Planning Horizon (weeks)</Label>
              <Input type="number" value={defaults.planningHorizonWeeks} onChange={handleChange("planningHorizonWeeks")} />
            </div>
            <div>
              <Label>Rent Commitment (weekly, $)</Label>
              <Input type="number" step="0.01" value={defaults.rentWeekly} onChange={handleChange("rentWeekly")} />
              <p className="text-xs text-muted-foreground mt-1">Reference only — actual is tracked in Arrears.</p>
            </div>
            <div>
              <Label>Emergency Buffer (weekly, $)</Label>
              <Input type="number" step="0.01" value={defaults.emergencyBuffer} onChange={handleChange("emergencyBuffer")} />
            </div>
            <div>
              <Label>Grocery Budget — Normal ($)</Label>
              <Input type="number" step="0.01" value={defaults.groceryNormal} onChange={handleChange("groceryNormal")} />
            </div>
            <div>
              <Label>Grocery Budget — Survival Mode ($)</Label>
              <Input type="number" step="0.01" value={defaults.grocerySurvival} onChange={handleChange("grocerySurvival")} />
            </div>
            <div>
              <Label>Fuel Allowance (weekly, $)</Label>
              <Input type="number" step="0.01" value={defaults.fuelWeekly} onChange={handleChange("fuelWeekly")} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave}>Save Defaults</Button>
            <Button variant="outline" onClick={handleReset}>Reset to Defaults</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Settings() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Settings2 className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Settings</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Manage controlled dropdown values, household people, and system configuration.
        </p>
      </div>

      <Tabs defaultValue="household" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1 mb-6">
          <TabsTrigger value="household">Household</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="arrears">Arrears</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="gig">Gig Work</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="defaults">Defaults</TabsTrigger>
        </TabsList>

        {/* Household */}
        <TabsContent value="household" className="space-y-6">
          <LookupSection
            namespace="household_people"
            title="Household People"
            hint="People in the household — used for assigning tasks, income entries, gig shifts, and communications."
            valuePrefix="person"
          />
        </TabsContent>

        {/* Finance */}
        <TabsContent value="finance" className="space-y-6">
          <LookupSection
            namespace="income_source_type"
            title="Income Source Types"
            hint="Categories for income sources (salary, Centrelink, gig work, etc.)."
          />
          <LookupSection
            namespace="bill_category"
            title="Bill Categories"
            hint="Categories for regular bills and expenses."
          />
          <LookupSection
            namespace="payment_method"
            title="Payment Methods & Accounts"
            hint="Payment methods and bank accounts used for recording income received and bills paid."
            valuePrefix="pm"
          />
        </TabsContent>

        {/* Budget */}
        <TabsContent value="budget" className="space-y-6">
          <LookupSection
            namespace="budget_category_group"
            title="Budget Category Groups"
            hint="Top-level groupings for budget categories."
          />
        </TabsContent>

        {/* Arrears */}
        <TabsContent value="arrears" className="space-y-6">
          <LookupSection
            namespace="arrears_category"
            title="Arrears Categories"
            hint="Types of debts and arrears tracked."
          />
          <LookupSection
            namespace="arrears_status"
            title="Arrears Statuses"
            hint="Current status of an arrears item (payment arrangement, legal, resolved, etc.)."
          />
          <LookupSection
            namespace="arrears_risk_level"
            title="Risk Levels"
            hint="Risk level classification for arrears items."
          />
        </TabsContent>

        {/* Tasks */}
        <TabsContent value="tasks" className="space-y-6">
          <LookupSection
            namespace="task_bucket"
            title="Task Buckets"
            hint="Workflow buckets for organising tasks (Today, This Week, Backlog, etc.)."
          />
          <LookupSection
            namespace="task_status"
            title="Task Statuses"
            hint="Status values for task progress."
          />
          <LookupSection
            namespace="task_priority"
            title="Task Priorities"
            hint="Priority levels for tasks."
          />
        </TabsContent>

        {/* Gig Work */}
        <TabsContent value="gig" className="space-y-6">
          <LookupSection
            namespace="gig_platform"
            title="Gig Platforms"
            hint="Platforms used for gig work (DoorDash, Uber Eats, etc.)."
          />
          <LookupSection
            namespace="gig_payment_status"
            title="Gig Payment Statuses"
            hint="Payment status values for gig entries (pending, fast-paid, deposited, received)."
          />
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit">
          <AuditLogSection />
        </TabsContent>

        {/* Data import/export */}
        <TabsContent value="data" className="space-y-6">
          <DataManagementSection />
        </TabsContent>

        {/* Budget defaults */}
        <TabsContent value="defaults" className="space-y-6">
          <BudgetDefaultsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
