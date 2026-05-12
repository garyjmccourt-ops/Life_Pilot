import { useState } from "react";
import {
  useListShoppingItems,
  useCreateShoppingItem,
  useUpdateShoppingItem,
  useDeleteShoppingItem,
  useListShoppingLists,
  useCreateShoppingList,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Plus, Pencil, Trash2, Package, List } from "lucide-react";

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
  priority: string;
  usualFrequency: string;
  lastPurchasedDate?: string | null;
  notes?: string | null;
  active: boolean;
};

type ShoppingList = {
  id: number;
  name: string;
  weekStart?: string | null;
  status: string;
  estimatedTotal: number;
  actualTotal: number;
};

const defaultItemForm = {
  item: "",
  category: "groceries",
  quantitySize: "",
  preferredStore: "",
  alternativeStore: "",
  alternativeItem: "",
  estimatedPrice: "",
  priority: "normal" as const,
  usualFrequency: "weekly",
  notes: "",
  active: true,
};

const PRIORITY_COLORS: Record<string, string> = {
  essential: "bg-red-100 text-red-700",
  normal: "bg-blue-100 text-blue-700",
  optional: "bg-gray-100 text-gray-600",
};

export default function Shopping() {
  const { data: items = [], isLoading: itemsLoading, refetch: refetchItems } = useListShoppingItems();
  const { data: lists = [], isLoading: listsLoading, refetch: refetchLists } = useListShoppingLists();
  const createItemMutation = useCreateShoppingItem();
  const updateItemMutation = useUpdateShoppingItem();
  const deleteItemMutation = useDeleteShoppingItem();
  const createListMutation = useCreateShoppingList();
  const { toast } = useToast();

  const [tab, setTab] = useState<"items" | "lists">("items");
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...defaultItemForm });
  const [newListName, setNewListName] = useState("");

  const activeItems = items.filter((i) => i.active);
  const categories = [...new Set(activeItems.map((i) => i.category))].sort();

  function openCreateItem() {
    setForm({ ...defaultItemForm });
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
      priority: item.priority as typeof defaultItemForm.priority,
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
        data: {
          name: newListName,
          weekStart: today,
          status: "draft",
          estimatedTotal: 0,
          actualTotal: 0,
        },
      });
      setNewListName("");
      toast({ title: "Shopping list created" });
      refetchLists();
    } catch {
      toast({ title: "Error creating list", variant: "destructive" });
    }
  }

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Shopping</h1>
        </div>
        <div className="flex gap-2">
          {tab === "items" && (
            <Button onClick={openCreateItem} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab("items")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "items" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Package className="h-3.5 w-3.5 inline mr-1.5" />
          Item Master ({activeItems.length})
        </button>
        <button
          onClick={() => setTab("lists")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "lists" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <List className="h-3.5 w-3.5 inline mr-1.5" />
          Shopping Lists ({lists.length})
        </button>
      </div>

      {tab === "items" && (
        <div className="space-y-4">
          {itemsLoading ? (
            <p className="text-muted-foreground text-sm text-center py-4">Loading...</p>
          ) : activeItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No shopping items yet. Add items to build your master list.
              </CardContent>
            </Card>
          ) : (
            categories.map((cat) => {
              const catItems = activeItems.filter((i) => i.category === cat);
              return (
                <Card key={cat}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm capitalize">{cat} ({catItems.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {catItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 py-1.5 border-b last:border-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{item.item}</span>
                              {item.quantitySize && (
                                <span className="text-xs text-muted-foreground">{item.quantitySize}</span>
                              )}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[item.priority]}`}>
                                {item.priority}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {item.preferredStore}
                              {item.estimatedPrice != null && ` · est. ${formatCurrency(item.estimatedPrice)}`}
                              {` · ${item.usualFrequency}`}
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

      {tab === "lists" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex gap-2">
                <Input
                  placeholder="New list name e.g. Week of 12 May"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                />
                <Button onClick={handleCreateList} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Create
                </Button>
              </div>
            </CardContent>
          </Card>
          {listsLoading ? (
            <p className="text-muted-foreground text-sm text-center py-4">Loading...</p>
          ) : lists.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                No shopping lists yet. Create one above.
              </CardContent>
            </Card>
          ) : (
            lists.map((list) => (
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId != null ? "Edit Item" : "Add Shopping Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Item Name</Label>
              <Input placeholder="e.g. Oat Milk" value={form.item} onChange={f("item")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Input placeholder="groceries" value={form.category} onChange={f("category")} />
              </div>
              <div>
                <Label>Qty / Size</Label>
                <Input placeholder="1L, 500g" value={form.quantitySize} onChange={f("quantitySize")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preferred Store</Label>
                <Input placeholder="Woolworths" value={form.preferredStore} onChange={f("preferredStore")} />
              </div>
              <div>
                <Label>Alt. Store</Label>
                <Input placeholder="Coles" value={form.alternativeStore} onChange={f("alternativeStore")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Est. Price ($)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.estimatedPrice} onChange={f("estimatedPrice")} />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v as typeof defaultItemForm.priority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essential">Essential</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Frequency</Label>
                <Input placeholder="weekly, fortnightly" value={form.usualFrequency} onChange={f("usualFrequency")} />
              </div>
              <div>
                <Label>Alt. Item</Label>
                <Input placeholder="Generic brand" value={form.alternativeItem} onChange={f("alternativeItem")} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm((p) => ({ ...p, active: v }))} />
              <Label>Active</Label>
            </div>
            <div>
              <Label>Notes</Label>
              <Input placeholder="Optional notes" value={form.notes} onChange={f("notes")} />
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
