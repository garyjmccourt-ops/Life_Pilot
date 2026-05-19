import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  useListArrears, getListArrearsQueryKey,
  useCreateArrears, useUpdateArrears,
  useCreateTask, getListTasksQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, PlusCircle, ArrowRight, Banknote, ClipboardList } from "lucide-react";
import { formatCurrency, formatFrequency } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";

function QuickAddTaskButton({ item }: { item: any }) {
  const queryClient = useQueryClient();
  const createTask = useCreateTask();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createTask.mutate({
      data: {
        title: String(fd.get("title")),
        bucket: String(fd.get("bucket")) as any,
        priority: "p2" as any,
        status: "open",
        dueDate: null,
        creditorTag: item.creditor,
        arrearsItemId: item.id,
        notes: null,
        recurring: false,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        toast({ title: "Task added", description: item.creditor });
        setOpen(false);
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground">
          <ClipboardList className="h-3.5 w-3.5" /> Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Task — {item.creditor}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>What needs doing?</Label>
            <Input name="title" required placeholder="e.g. Call to confirm arrangement" autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Bucket</Label>
            <Select name="bucket" defaultValue="today">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="backlog">Backlog</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createTask.isPending}>Add Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RecordPaymentDialog({ item }: { item: any }) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateArrears();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payment = Number(formData.get("payment"));
    if (!payment || payment <= 0) {
      toast({ title: "Enter a valid payment amount", variant: "destructive" });
      return;
    }
    const newBalance = Math.max(0, item.balance - payment);
    updateMutation.mutate({
      id: item.id,
      data: {
        creditor: item.creditor,
        category: item.category,
        balance: newBalance,
        ongoingCharge: item.ongoingCharge,
        ongoingFrequency: item.ongoingFrequency,
        arrearsPayment: item.arrearsPayment,
        arrearsFrequency: item.arrearsFrequency,
        riskLevel: item.riskLevel,
        status: newBalance <= 0 ? "completed" : item.status,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListArrearsQueryKey() });
        toast({ title: `Payment of ${formatCurrency(payment)} recorded — new balance ${formatCurrency(newBalance)}` });
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={e => e.preventDefault()}
        >
          <Banknote className="h-3.5 w-3.5" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment — {item.creditor}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="flex justify-between text-sm bg-muted/50 rounded-lg p-3">
            <span className="text-muted-foreground">Current balance</span>
            <span className="font-bold">{formatCurrency(item.balance)}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment">Payment amount</Label>
            <Input
              id="payment"
              name="payment"
              type="number"
              step="0.01"
              min="0.01"
              max={item.balance}
              placeholder="0.00"
              inputMode="decimal"
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending}>Save Payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ArrearsList() {
  const { data: arrears, isLoading } = useListArrears();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (isLoading) return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
      </div>
    </div>
  );

  const totalWeekly = arrears?.reduce((sum, item) => sum + item.weeklyTotal, 0) || 0;
  const activeCount = arrears?.filter(a => a.status === 'active').length || 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Arrears</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {activeCount} active arrangements • {formatCurrency(totalWeekly)}/wk committed
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="h-4 w-4 mr-2" /> Add Arrears</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Arrears Item</DialogTitle>
            </DialogHeader>
            <ArrearsForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {!arrears?.length ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <AlertTriangle className="h-12 w-12 text-primary/20 mb-4" />
          <h3 className="font-serif text-lg font-medium">No debts recorded yet.</h3>
          <p className="text-sm text-muted-foreground mb-4">Add an arrears item when you have a debt or payment arrangement to track.</p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline"><PlusCircle className="h-4 w-4 mr-2" /> Add Arrears</Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {arrears.map((item) => (
            <Card key={item.id} className="relative group hover:border-primary/50 transition-colors h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{item.creditor}</CardTitle>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{item.category}</div>
                  </div>
                  <Badge variant={item.riskLevel === "high" ? "destructive" : "outline"} className={
                    item.riskLevel === "high" ? "bg-destructive text-destructive-foreground" :
                    item.riskLevel === "medium" ? "bg-primary/20 text-primary" :
                    "bg-secondary text-secondary-foreground"
                  }>
                    {item.riskLevel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Balance</div>
                    <div className="text-2xl font-bold">{formatCurrency(item.balance)}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                    <div>
                      <div className="text-muted-foreground text-xs">Ongoing</div>
                      <div className="font-medium">{formatCurrency(item.ongoingCharge)} <span className="text-xs font-normal">/{item.ongoingFrequency.slice(0,2)}</span></div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Arrears</div>
                      <div className="font-medium text-destructive">{formatCurrency(item.arrearsPayment)} <span className="text-xs font-normal text-muted-foreground">/{item.arrearsFrequency.slice(0,2)}</span></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border gap-2">
                  <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>{item.status}</Badge>
                  <div className="flex items-center gap-2">
                    <QuickAddTaskButton item={item} />
                    <RecordPaymentDialog item={item} />
                    <Link href={`/arrears/${item.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-primary">
                        Manage <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ArrearsForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createMutation = useCreateArrears();
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      data: {
        creditor: String(formData.get("creditor")),
        category: String(formData.get("category")) as any,
        balance: Number(formData.get("balance")),
        ongoingCharge: Number(formData.get("ongoingCharge")),
        ongoingFrequency: String(formData.get("ongoingFrequency")) as any,
        arrearsPayment: Number(formData.get("arrearsPayment")),
        arrearsFrequency: String(formData.get("arrearsFrequency")) as any,
        riskLevel: String(formData.get("riskLevel")) as any,
        status: String(formData.get("status")) as any,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListArrearsQueryKey() });
        toast({ title: "Arrears record created" });
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="creditor">Creditor</Label>
          <Input id="creditor" name="creditor" required placeholder="e.g. City Council" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue="utility">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="rent">Rent</SelectItem>
              <SelectItem value="utility">Utility</SelectItem>
              <SelectItem value="council">Council</SelectItem>
              <SelectItem value="fine">Fine</SelectItem>
              <SelectItem value="child-support">Child Support</SelectItem>
              <SelectItem value="personal-debt">Personal Debt</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="balance">Total Balance</Label>
        <Input id="balance" name="balance" type="number" step="0.01" min="0" required placeholder="0.00" />
      </div>

      <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Ongoing Charge</h4>
          <div className="space-y-2">
            <Label htmlFor="ongoingCharge">Amount</Label>
            <Input id="ongoingCharge" name="ongoingCharge" type="number" step="0.01" min="0" required defaultValue="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ongoingFrequency">Frequency</Label>
            <Select name="ongoingFrequency" defaultValue="monthly">
              <SelectTrigger><SelectValue /></SelectTrigger>
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

        <div className="space-y-4">
          <h4 className="font-medium text-sm">Arrears Repayment</h4>
          <div className="space-y-2">
            <Label htmlFor="arrearsPayment">Amount</Label>
            <Input id="arrearsPayment" name="arrearsPayment" type="number" step="0.01" min="0" required defaultValue="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="arrearsFrequency">Frequency</Label>
            <Select name="arrearsFrequency" defaultValue="weekly">
              <SelectTrigger><SelectValue /></SelectTrigger>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue="none">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="broken">Broken</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="riskLevel">Risk Level</Label>
          <Select name="riskLevel" defaultValue="medium">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>Create Record</Button>
      </DialogFooter>
    </form>
  );
}
