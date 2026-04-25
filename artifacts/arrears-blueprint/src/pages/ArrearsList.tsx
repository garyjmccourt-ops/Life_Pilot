import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  useListArrears, getListArrearsQueryKey,
  useCreateArrears
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, PlusCircle, ArrowRight } from "lucide-react";
import { formatCurrency, formatFrequency } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";

export default function ArrearsList() {
  const { data: arrears, isLoading } = useListArrears();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (isLoading) return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
      </div>
    </div>
  );

  const totalWeekly = arrears?.reduce((sum, item) => sum + item.weeklyTotal, 0) || 0;
  const activeCount = arrears?.filter(a => a.status === 'active').length || 0;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
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
          <h3 className="font-serif text-lg font-medium">No arrears records</h3>
          <p className="text-sm text-muted-foreground mb-4">You have no recorded arrears.</p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline"><PlusCircle className="h-4 w-4 mr-2" /> Add Arrears</Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {arrears.map((item) => (
            <Link key={item.id} href={`/arrears/${item.id}`}>
              <Card className="relative group cursor-pointer hover:border-primary/50 transition-colors h-full flex flex-col">
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

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>{item.status}</Badge>
                    <div className="text-primary text-sm flex items-center font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Manage <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
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
