import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  useListIncome, getListIncomeQueryKey,
  useListBills, getListBillsQueryKey,
  useCreateIncome, useUpdateIncome, useDeleteIncome,
  useCreateBill, useUpdateBill, useDeleteBill
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Trash2, Wallet, Receipt, RefreshCw, CreditCard, Building, ArrowRight } from "lucide-react";
import { formatCurrency, formatFrequency } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

function IncomeList() {
  const { data: income, isLoading } = useListIncome();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (isLoading) return <Skeleton className="h-[300px]" />;

  const totalWeekly = income?.reduce((sum, item) => sum + item.weeklyEquivalent, 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold">Income Sources</h2>
          <p className="text-sm text-muted-foreground">{income?.length || 0} sources • {formatCurrency(totalWeekly)}/wk forecast</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/weekly">
            <Button variant="outline" size="sm">
              Record actual income received <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="h-4 w-4 mr-2" /> Add Income</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Income Source</DialogTitle>
              </DialogHeader>
              <IncomeForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!income?.length ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
          <Wallet className="h-12 w-12 text-primary/20 mb-4" />
          <h3 className="font-serif text-lg font-medium">No income sources</h3>
          <p className="text-sm text-muted-foreground mb-4">Add your salary, benefits, or other regular income.</p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline"><PlusCircle className="h-4 w-4 mr-2" /> Add Income</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {income.map((item) => (
            <Card key={item.id} className="relative group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {formatFrequency(item.frequency)}
                    </div>
                  </div>
                  <IncomeActions id={item.id} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(item.amount)}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  equiv. {formatCurrency(item.weeklyEquivalent)} / wk
                </div>
                {item.notes && <p className="text-xs mt-3 text-muted-foreground/80">{item.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function IncomeActions({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteIncome();
  const { toast } = useToast();

  const handleDelete = () => {
    if (confirm("Delete this income source?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListIncomeQueryKey() });
          toast({ title: "Income source deleted" });
        }
      });
    }
  };

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleDelete} disabled={deleteMutation.isPending}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function IncomeForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createMutation = useCreateIncome();
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    
    if (amount < 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      data: {
        name: String(formData.get("name")),
        amount,
        frequency: String(formData.get("frequency")) as any,
        notes: String(formData.get("notes")) || null,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListIncomeQueryKey() });
        toast({ title: "Income added" });
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Source Name</Label>
        <Input id="name" name="name" required placeholder="e.g. Salary, Benefits" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0" required placeholder="0.00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Select name="frequency" defaultValue="monthly">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="fortnightly">Fortnightly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
              <SelectItem value="one-off">One-off</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input id="notes" name="notes" />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>Save Income</Button>
      </DialogFooter>
    </form>
  );
}

// Bills List similar structure
function BillsList() {
  const { data: bills, isLoading } = useListBills();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (isLoading) return <Skeleton className="h-[300px]" />;

  const totalWeekly = bills?.reduce((sum, item) => sum + item.weeklyEquivalent, 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold">Recurring Bills</h2>
          <p className="text-sm text-muted-foreground">{bills?.length || 0} bills • {formatCurrency(totalWeekly)}/wk total</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="h-4 w-4 mr-2" /> Add Bill</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bill</DialogTitle>
            </DialogHeader>
            <BillForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {!bills?.length ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed">
          <Receipt className="h-12 w-12 text-primary/20 mb-4" />
          <h3 className="font-serif text-lg font-medium">No recurring bills</h3>
          <p className="text-sm text-muted-foreground mb-4">Add your rent, utilities, subscriptions, etc.</p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline"><PlusCircle className="h-4 w-4 mr-2" /> Add Bill</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bills.map((item) => (
            <Card key={item.id} className="relative group">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{item.provider}</CardTitle>
                    <div className="flex items-center text-xs text-muted-foreground gap-2">
                      <span className="flex items-center"><Building className="h-3 w-3 mr-1" />{item.category}</span>
                      <span className="flex items-center"><RefreshCw className="h-3 w-3 mr-1" />{formatFrequency(item.frequency)}</span>
                    </div>
                  </div>
                  <BillActions id={item.id} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">{formatCurrency(item.amount)}</div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm text-muted-foreground">
                    equiv. {formatCurrency(item.weeklyEquivalent)} / wk
                  </div>
                  {item.dueDate ? (
                    <div className="text-xs bg-secondary px-2 py-1 rounded">
                      Due: {item.dueDate}
                    </div>
                  ) : item.dueDay ? (
                    <div className="text-xs bg-secondary px-2 py-1 rounded">
                      Due: {item.dueDay}{[1,21,31].includes(item.dueDay)?'st':[2,22].includes(item.dueDay)?'nd':[3,23].includes(item.dueDay)?'rd':'th'}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BillActions({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteBill();
  const { toast } = useToast();

  const handleDelete = () => {
    if (confirm("Delete this bill?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
          toast({ title: "Bill deleted" });
        }
      });
    }
  };

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleDelete} disabled={deleteMutation.isPending}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function BillForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createMutation = useCreateBill();
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const dueDayStr = formData.get("dueDay");
    const dueDateStr = formData.get("dueDate");
    
    if (amount < 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      data: {
        provider: String(formData.get("provider")),
        category: String(formData.get("category")),
        amount,
        frequency: String(formData.get("frequency")) as any,
        dueDay: dueDayStr ? Number(dueDayStr) : null,
        dueDate: dueDateStr ? String(dueDateStr) : null,
        accountRef: String(formData.get("accountRef")) || null,
        autopay: formData.get("autopay") === "true",
        notes: String(formData.get("notes")) || null,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListBillsQueryKey() });
        toast({ title: "Bill added" });
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Input id="provider" name="provider" required placeholder="e.g. Energy Co" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" required placeholder="e.g. Utilities" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0" required placeholder="0.00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Select name="frequency" defaultValue="monthly">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="fortnightly">Fortnightly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
              <SelectItem value="one-off">One-off</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Exact Due Date</Label>
          <Input id="dueDate" name="dueDate" type="date" placeholder="Optional" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDay">Recurring Due Day (1-31)</Label>
          <Input id="dueDay" name="dueDay" type="number" min="1" max="31" placeholder="Optional" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2" />
        <div className="space-y-2">
          <Label htmlFor="autopay">Auto-pay</Label>
          <Select name="autopay" defaultValue="false">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>Save Bill</Button>
      </DialogFooter>
    </form>
  );
}


export default function IncomeBills() {
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Income & Bills</h1>
        <p className="text-muted-foreground mt-2 text-lg">Manage your regular cash flow.</p>
      </div>

      <Tabs defaultValue="income" className="w-full">
        <TabsList className="mb-6 w-full max-w-[400px] grid grid-cols-2">
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
        </TabsList>
        <TabsContent value="income" className="mt-0">
          <IncomeList />
        </TabsContent>
        <TabsContent value="bills" className="mt-0">
          <BillsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
