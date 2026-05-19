import { useState, useMemo } from "react";
import {
  useListShoppingItems,
  useListShoppingLists,
  useCreateShoppingItem,
  useUpdateShoppingItem,
  useDeleteShoppingItem,
  useCreateShoppingList,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart, Plus, Pencil, Trash2, Package, List,
  Download, CheckCircle2, Circle, CalendarDays,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ShoppingItem = {
  id: number;
  item: string;
  category: string;
  quantitySize?: string | null;
  preferredStore: string;
  alternativeStore?: string | null;
  alternativeItem?: string | null;
  estimatedPrice?: number | null;
  actualPrice?: number | null;
  priority: "essential" | "normal" | "optional";
  usualFrequency: string;
  notes?: string | null;
  active: boolean;
};

// ── Store Groups ──────────────────────────────────────────────────────────────

const STORE_GROUPS = [
  "Aldi",
  "Woolworths",
  "Heart & Soul / Local",
  "Buy Where Best",
  "Household Supplies",
  "Other",
] as const;

type StoreGroup = typeof STORE_GROUPS[number];

function normaliseToGroup(store: string): StoreGroup {
  const s = (store ?? "").toLowerCase().trim();
  if (s.includes("aldi")) return "Aldi";
  if (s.includes("wool") || s.includes("woolies")) return "Woolworths";
  if (s.includes("heart") || s.includes("soul") || s.includes("local") || s.includes("deli")) return "Heart & Soul / Local";
  if (s.includes("any") || s.includes("best") || s.includes("wherever") || s.includes("cheap")) return "Buy Where Best";
  if (s.includes("hard") || s.includes("chemist") || s.includes("kmart") || s.includes("target") || s.includes("big w") || s.includes("bunning") || s.includes("supply") || s.includes("pharma")) return "Household Supplies";
  return "Other";
}

const GROUP_COLORS: Record<StoreGroup, string> = {
  "Aldi":                "bg-red-50 border-red-100 text-red-800",
  "Woolworths":          "bg-green-50 border-green-100 text-green-800",
  "Heart & Soul / Local":"bg-purple-50 border-purple-100 text-purple-800",
  "Buy Where Best":      "bg-blue-50 border-blue-100 text-blue-800",
  "Household Supplies":  "bg-amber-50 border-amber-100 text-amber-700",
  "Other":               "bg-gray-50 border-gray-100 text-gray-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  essential: "bg-red-100 text-red-700",
  normal:    "bg-blue-100 text-blue-700",
  optional:  "bg-gray-100 text-gray-600",
};

// ── Weekly checklist helpers ──────────────────────────────────────────────────

function getCurrentMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const m = new Date(now);
  m.setDate(diff);
  m.setHours(0, 0, 0, 0);
  const offset = m.getTimezoneOffset();
  return new Date(m.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

const WEEK_KEY = `lifepilot_shopping_${getCurrentMonday()}`;

interface WeeklyState {
  neededIds: number[];
  boughtIds: number[];
}

function loadWeeklyState(): WeeklyState {
  try {
    const saved = localStorage.getItem(WEEK_KEY);
    return saved ? JSON.parse(saved) : { neededIds: [], boughtIds: [] };
  } catch { return { neededIds: [], boughtIds: [] }; }
}

function saveWeeklyState(state: WeeklyState) {
  try { localStorage.setItem(WEEK_KEY, JSON.stringify(state)); } catch {}
}

// ── Default form ──────────────────────────────────────────────────────────────

const defaultForm = {
  item: "",
  category: "groceries",
  quantitySize: "",
  preferredStore: "Woolworths",
  alternativeStore: "",
  alternativeItem: "",
  estimatedPrice: "",
  priority: "normal" as "essential" | "normal" | "optional",
  usualFrequency: "weekly",
  notes: "",
  active: true,
};

// ── Main component ────────────────────────────────────────────────────────────

const BASE = import.meta.env.BASE_URL;

export default function Shopping() {
  const { data: items = [], isLoading: itemsLoading, refetch: refetchItems } = useListShoppingItems();
  const { data: lists = [], isLoading: listsLoading, refetch: refetchLists } = useListShoppingLists();
  const createItemMutation = useCreateShoppingItem();
  const updateItemMutation = useUpdateShoppingItem();
  const deleteItemMutation = useDeleteShoppingItem();
  const createListMutation = useCreateShoppingList();
  const { toast } = useToast();

  const [tab, setTab] = useState<"items" | "checklist" | "lists">("items");
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [newListName, setNewListName] = useState("");

  // Weekly checklist state
  const [weeklyState, setWeeklyState] = useState<WeeklyState>(loadWeeklyState);

  function toggleNeeded(id: number) {
    setWeeklyState(prev => {
      const next = prev.neededIds.includes(id)
        ? { ...prev, neededIds: prev.neededIds.filter(x => x !== id) }
        : { ...prev, neededIds: [...prev.neededIds, id] };
      saveWeeklyState(next);
      return next;
    });
  }

  function toggleBought(id: number) {
    setWeeklyState(prev => {
      const next = prev.boughtIds.includes(id)
        ? { ...prev, boughtIds: prev.boughtIds.filter(x => x !== id) }
        : { ...prev, boughtIds: [...prev.boughtIds, id] };
      saveWeeklyState(next);
      return next;
    });
  }

  function clearChecklist() {
    const cleared: WeeklyState = { neededIds: [], boughtIds: [] };
    setWeeklyState(cleared);
    saveWeeklyState(cleared);
  }

  function markAllNeededEssential() {
    const essential = activeItems.filter(i => i.priority === "essential").map(i => i.id);
    setWeeklyState(prev => {
      const next = { ...prev, neededIds: [...new Set([...prev.neededIds, ...essential])] };
      saveWeeklyState(next);
      return next;
    });
  }

  const activeItems = (items as ShoppingItem[]).filter(i => i.active);

  // Group items by store group for items tab
  const itemsByGroup = useMemo<Record<StoreGroup, ShoppingItem[]>>(() => {
    const grouped = {} as Record<StoreGroup, ShoppingItem[]>;
    STORE_GROUPS.forEach(g => { grouped[g] = []; });
    activeItems.forEach(item => {
      const g = normaliseToGroup(item.preferredStore);
      grouped[g].push(item);
    });
    return grouped;
  }, [activeItems]);

  // Checklist: items marked as needed, sorted by store group
  const neededItems = activeItems.filter(i => weeklyState.neededIds.includes(i.id));
  const neededByGroup = useMemo<Record<StoreGroup, ShoppingItem[]>>(() => {
    const grouped = {} as Record<StoreGroup, ShoppingItem[]>;
    STORE_GROUPS.forEach(g => { grouped[g] = []; });
    neededItems.forEach(item => {
      const g = normaliseToGroup(item.preferredStore);
      grouped[g].push(item);
    });
    return grouped;
  }, [neededItems]);

  const neededTotal = neededItems.reduce((s, i) => s + (i.estimatedPrice ?? 0), 0);
  const boughtItems = neededItems.filter(i => weeklyState.boughtIds.includes(i.id));
  const boughtTotal = boughtItems.reduce((s, i) => s + (i.estimatedPrice ?? 0), 0);

  function openCreateItem() {
    setForm({ ...defaultForm });
    setEditingId(null);
    setItemDialogOpen(true);
  }

  function openEditItem(item: ShoppingItem) {
    setForm({
      item: item.item,
      category: item.category,
      quantitySize: item.quantitySize ?? "",
      preferredStore: item.preferredStore,
      alternativeStore: item.alternativeStore ?? "",
      alternativeItem: item.alternativeItem ?? "",
      estimatedPrice: item.estimatedPrice != null ? String(item.estimatedPrice) : "",
      priority: item.priority,
      usualFrequency: item.usualFrequency,
      notes: item.notes ?? "",
      active: item.active,
    });
    setEditingId(item.id);
    setItemDialogOpen(true);
  }

  async function handleSaveItem() {
    if (!form.item.trim()) {
      toast({ title: "Item name required", variant: "destructive" });
      return;
    }
    const payload = {
      item: form.item,
      category: form.category,
      quantitySize: form.quantitySize || null,
      preferredStore: form.preferredStore || "any",
      alternativeStore: form.alternativeStore || null,
      alternativeItem: form.alternativeItem || null,
      estimatedPrice: form.estimatedPrice ? Number(form.estimatedPrice) : null,
      actualPrice: null,
      priority: form.priority,
      usualFrequency: form.usualFrequency,
      notes: form.notes || null,
      active: form.active,
    };
    try {
      if (editingId != null) {
        await updateItemMutation.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Item updated" });
      } else {
        await createItemMutation.mutateAsync({ data: payload });
        toast({ title: "Item added" });
      }
      setItemDialogOpen(false);
      refetchItems();
    } catch {
      toast({ title: "Error saving item", variant: "destructive" });
    }
  }

  async function handleDeleteItem(id: number) {
    if (!confirm("Delete this item?")) return;
    try {
      await deleteItemMutation.mutateAsync({ id });
      toast({ title: "Item deleted" });
      refetchItems();
    } catch {
      toast({ title: "Error deleting item", variant: "destructive" });
    }
  }

  async function handleCreateList() {
    if (!newListName.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      await createListMutation.mutateAsync({
        data: { name: newListName, weekStart: today, status: "draft", estimatedTotal: 0, actualTotal: 0 },
      });
      setNewListName("");
      toast({ title: "Shopping list created" });
      refetchLists();
    } catch {
      toast({ title: "Error creating list", variant: "destructive" });
    }
  }

  const fld = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold font-serif">Shopping</h1>
            <p className="text-xs text-muted-foreground">Grouped by store · Weekly checklist · Item master</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tab === "items" && (
            <>
              <a href={`${BASE}api/export/csv/shopping`} download>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> CSV
                </Button>
              </a>
              <Button onClick={openCreateItem} size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </>
          )}
          {tab === "checklist" && (
            <>
              <Button variant="outline" size="sm" onClick={markAllNeededEssential}>
                Mark Essentials Needed
              </Button>
              <Button variant="ghost" size="sm" onClick={clearChecklist}>
                Clear Checklist
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {[
          { key: "items", label: `Item Master (${activeItems.length})`, Icon: Package },
          { key: "checklist", label: `This Week (${neededItems.length} needed)`, Icon: CalendarDays },
          { key: "lists", label: `Shopping Lists (${lists.length})`, Icon: List },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {/* ── Item Master Tab ── */}
      {tab === "items" && (
        <div className="space-y-4">
          {itemsLoading ? (
            <p className="text-muted-foreground text-sm text-center py-4">Loading…</p>
          ) : activeItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No shopping items yet. Add items to build your master list.
              </CardContent>
            </Card>
          ) : (
            STORE_GROUPS.map(group => {
              const groupItems = itemsByGroup[group];
              if (groupItems.length === 0) return null;
              return (
                <Card key={group} className={`border ${GROUP_COLORS[group].split(" ").find(c => c.startsWith("border")) ?? ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${GROUP_COLORS[group]}`}>
                          {group}
                        </span>
                        <span className="text-muted-foreground font-normal">({groupItems.length} item{groupItems.length !== 1 ? "s" : ""})</span>
                      </CardTitle>
                      <Button
                        variant="ghost" size="sm" className="text-xs h-7"
                        onClick={() => {
                          setWeeklyState(prev => {
                            const ids = groupItems.map(i => i.id);
                            const next = { ...prev, neededIds: [...new Set([...prev.neededIds, ...ids])] };
                            saveWeeklyState(next);
                            return next;
                          });
                          toast({ title: `${group} added to this week's checklist` });
                        }}
                      >
                        + Add all to week
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-0">
                      {groupItems.map(item => (
                        <div key={item.id} className="flex items-center gap-2 py-2 border-b last:border-0">
                          {/* Need toggle */}
                          <button
                            onClick={() => toggleNeeded(item.id)}
                            className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                            title={weeklyState.neededIds.includes(item.id) ? "Remove from this week" : "Add to this week"}
                          >
                            {weeklyState.neededIds.includes(item.id)
                              ? <CheckCircle2 className="h-4 w-4 text-primary" />
                              : <Circle className="h-4 w-4" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{item.item}</span>
                              {item.quantitySize && <span className="text-xs text-muted-foreground">{item.quantitySize}</span>}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[item.priority]}`}>
                                {item.priority}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {item.preferredStore}
                              {item.estimatedPrice != null && ` · est. ${formatCurrency(item.estimatedPrice)}`}
                              {` · ${item.usualFrequency}`}
                              {item.alternativeStore && ` · alt: ${item.alternativeStore}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditItem(item)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteItem(item.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ── This Week Checklist Tab ── */}
      {tab === "checklist" && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-3 pb-3 text-center">
                <div className="text-lg font-bold">{neededItems.length}</div>
                <div className="text-xs text-muted-foreground">Items needed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3 text-center">
                <div className="text-lg font-bold text-emerald-600">{boughtItems.length}</div>
                <div className="text-xs text-muted-foreground">Bought</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3 text-center">
                <div className="text-lg font-bold">{formatCurrency(neededTotal)}</div>
                <div className="text-xs text-muted-foreground">Est. cost</div>
              </CardContent>
            </Card>
          </div>

          {neededItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarDays className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No items selected for this week. Go to Item Master and tick the circle next to items you need, or click "Add all to week" on a store group.
                </p>
              </CardContent>
            </Card>
          ) : (
            STORE_GROUPS.map(group => {
              const groupItems = neededByGroup[group];
              if (groupItems.length === 0) return null;
              const groupBought = groupItems.filter(i => weeklyState.boughtIds.includes(i.id));
              const groupTotal = groupItems.reduce((s, i) => s + (i.estimatedPrice ?? 0), 0);
              return (
                <Card key={group} className={`border ${GROUP_COLORS[group].split(" ").find(c => c.startsWith("border")) ?? ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${GROUP_COLORS[group]}`}>
                          {group}
                        </span>
                        <span className="text-xs text-muted-foreground">{groupBought.length}/{groupItems.length} bought</span>
                      </div>
                      {groupTotal > 0 && (
                        <span className="text-xs font-medium">{formatCurrency(groupTotal)}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-0">
                      {groupItems.map(item => {
                        const bought = weeklyState.boughtIds.includes(item.id);
                        return (
                          <div key={item.id} className={`flex items-center gap-3 py-2.5 border-b last:border-0 ${bought ? "opacity-50" : ""}`}>
                            <Checkbox
                              checked={bought}
                              onCheckedChange={() => toggleBought(item.id)}
                              className="flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-sm ${bought ? "line-through text-muted-foreground" : ""}`}>
                                {item.item}
                                {item.quantitySize && <span className="ml-1.5 text-xs text-muted-foreground font-normal">{item.quantitySize}</span>}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {item.preferredStore}
                                {item.estimatedPrice != null && ` · est. ${formatCurrency(item.estimatedPrice)}`}
                              </div>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${PRIORITY_COLORS[item.priority]}`}>
                              {item.priority}
                            </span>
                            <button
                              onClick={() => toggleNeeded(item.id)}
                              className="text-muted-foreground hover:text-destructive text-xs flex-shrink-0"
                              title="Remove from this week"
                            >✕</button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {neededItems.length > 0 && (
            <div className="text-xs text-muted-foreground text-center">
              Checklist is saved to this device for the current week ({getCurrentMonday()}).
              Resets automatically at the start of each new week.
            </div>
          )}
        </div>
      )}

      {/* ── Shopping Lists Tab ── */}
      {tab === "lists" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex gap-2">
                <Input
                  placeholder="New list name e.g. Week of 12 May"
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreateList()}
                />
                <Button onClick={handleCreateList} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Create
                </Button>
              </div>
            </CardContent>
          </Card>
          {listsLoading ? (
            <p className="text-muted-foreground text-sm text-center py-4">Loading…</p>
          ) : lists.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No shopping lists yet. Create one above.
              </CardContent>
            </Card>
          ) : (
            lists.map(list => (
              <Card key={list.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{list.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {list.weekStart ? `Week of ${list.weekStart}` : "No date set"} ·{" "}
                      Est. {formatCurrency(list.estimatedTotal)} · Actual {formatCurrency(list.actualTotal)}
                    </div>
                  </div>
                  <Badge variant={list.status === "complete" ? "default" : "secondary"} className="capitalize">
                    {list.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Item dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "Edit Item" : "Add Shopping Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Item Name</Label>
              <Input placeholder="e.g. Oat Milk" value={form.item} onChange={fld("item")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Input placeholder="groceries" value={form.category} onChange={fld("category")} />
              </div>
              <div>
                <Label>Qty / Size</Label>
                <Input placeholder="1L, 500g" value={form.quantitySize} onChange={fld("quantitySize")} />
              </div>
            </div>
            <div>
              <Label>Preferred Store</Label>
              <Select value={normaliseToGroup(form.preferredStore)} onValueChange={v => setForm(p => ({ ...p, preferredStore: v }))}>
                <SelectTrigger><SelectValue placeholder="Select store group" /></SelectTrigger>
                <SelectContent>
                  {STORE_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Alternative Store</Label>
                <Input placeholder="Coles" value={form.alternativeStore} onChange={fld("alternativeStore")} />
              </div>
              <div>
                <Label>Alternative Item</Label>
                <Input placeholder="Generic brand" value={form.alternativeItem} onChange={fld("alternativeItem")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Est. Price ($)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.estimatedPrice} onChange={fld("estimatedPrice")} />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essential">Essential</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Usual Frequency</Label>
              <Input placeholder="weekly, fortnightly, monthly" value={form.usualFrequency} onChange={fld("usualFrequency")} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} />
              <Label>Active (show in master list)</Label>
            </div>
            <div>
              <Label>Notes</Label>
              <Input placeholder="Optional notes" value={form.notes} onChange={fld("notes")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveItem}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
