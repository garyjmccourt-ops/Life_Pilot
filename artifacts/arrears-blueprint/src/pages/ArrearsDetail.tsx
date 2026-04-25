import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  useGetArrears, getGetArrearsQueryKey,
  useUpdateArrears, useDeleteArrears,
  useListTasks,
  useListComms
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Check, Trash2, Save, CalendarDays, MessageSquare, AlertCircle, Circle, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";

export default function ArrearsDetail() {
  const [, params] = useRoute("/arrears/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: arrears, isLoading } = useGetArrears(id, {
    query: { enabled: !!id, queryKey: getGetArrearsQueryKey(id) }
  });

  const { data: tasks } = useListTasks();
  const { data: comms } = useListComms();

  const updateMutation = useUpdateArrears();
  const deleteMutation = useDeleteArrears();

  const [isEditingHeader, setIsEditingHeader] = useState(false);

  if (isLoading || !arrears) return <div className="p-8 max-w-5xl mx-auto space-y-6"><Skeleton className="h-32" /></div>;

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id,
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
        nextReviewDate: String(formData.get("nextReviewDate")) || null,
        accountRef: String(formData.get("accountRef")) || null,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetArrearsQueryKey(id) });
        toast({ title: "Updated successfully" });
        setIsEditingHeader(false);
      }
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Record deleted" });
          setLocation("/arrears");
        }
      });
    }
  };

  const relatedTasks = tasks?.filter(t => t.arrearsItemId === id) || [];
  const relatedComms = comms?.filter(c => c.arrearsItemId === id) || [];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <Link href="/arrears">
        <Button variant="ghost" size="sm" className="-ml-4 mb-4 text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Arrears
        </Button>
      </Link>

      <Card className="border-t-4 border-t-primary overflow-hidden">
        {isEditingHeader ? (
          <form onSubmit={handleUpdate} className="p-6 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg font-bold">Edit Core Details</h3>
              <div className="space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditingHeader(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Creditor</Label>
                <Input name="creditor" defaultValue={arrears.creditor} required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select name="category" defaultValue={arrears.category}>
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
              <div className="space-y-2">
                <Label>Balance</Label>
                <Input name="balance" type="number" step="0.01" defaultValue={arrears.balance} required />
              </div>
              <div className="space-y-2">
                <Label>Account Ref</Label>
                <Input name="accountRef" defaultValue={arrears.accountRef || ''} />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Ongoing Charge</Label>
                <Input name="ongoingCharge" type="number" step="0.01" defaultValue={arrears.ongoingCharge} required />
              </div>
              <div className="space-y-2">
                <Label>Ongoing Freq</Label>
                <Select name="ongoingFrequency" defaultValue={arrears.ongoingFrequency}>
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
              <div className="space-y-2">
                <Label>Arrears Repayment</Label>
                <Input name="arrearsPayment" type="number" step="0.01" defaultValue={arrears.arrearsPayment} required />
              </div>
              <div className="space-y-2">
                <Label>Arrears Freq</Label>
                <Select name="arrearsFrequency" defaultValue={arrears.arrearsFrequency}>
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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue={arrears.status}>
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
                <Label>Risk Level</Label>
                <Select name="riskLevel" defaultValue={arrears.riskLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Next Review Date</Label>
                <Input name="nextReviewDate" type="date" defaultValue={arrears.nextReviewDate ? arrears.nextReviewDate.slice(0,10) : ''} />
              </div>
            </div>
          </form>
        ) : (
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-serif font-bold text-foreground">{arrears.creditor}</h1>
                <p className="text-muted-foreground uppercase tracking-wider text-xs mt-2 font-medium">
                  {arrears.category} {arrears.accountRef ? `• Ref: ${arrears.accountRef}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditingHeader(true)}>Edit Header</Button>
                <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-border">
              <div>
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Total Balance</div>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(arrears.balance)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Commitment</div>
                <div className="text-lg font-bold text-foreground">{formatCurrency(arrears.weeklyTotal)}<span className="text-xs font-normal text-muted-foreground">/wk</span></div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Status</div>
                <div className="font-medium capitalize">{arrears.status}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Risk Level</div>
                <div className="font-medium capitalize text-primary">{arrears.riskLevel}</div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="internal" className="w-full">
            <TabsList className="mb-6 w-full max-w-[400px] grid grid-cols-2">
              <TabsTrigger value="internal">Internal Strategy</TabsTrigger>
              <TabsTrigger value="external">External Plan</TabsTrigger>
            </TabsList>
            
            <TabsContent value="internal">
              <InternalPlanForm arrears={arrears} />
            </TabsContent>
            
            <TabsContent value="external">
              <ExternalPlanForm arrears={arrears} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif flex justify-between items-center">
                <span>Related Tasks</span>
                <Badge variant="secondary">{relatedTasks.filter(t => t.status !== 'done').length} open</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!relatedTasks.length ? (
                <p className="text-sm text-muted-foreground italic">No tasks for this creditor.</p>
              ) : (
                <div className="space-y-3">
                  {relatedTasks.map(task => (
                    <div key={task.id} className="flex gap-2 items-start">
                      {task.status === 'done' ? (
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className={`text-sm ${task.status === 'done' ? 'text-muted-foreground line-through' : 'font-medium'}`}>
                          {task.title}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="capitalize">{task.bucket}</span>
                          {task.dueDate && <span>• {formatDate(task.dueDate)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif">Recent Comms</CardTitle>
            </CardHeader>
            <CardContent>
              {!relatedComms.length ? (
                <p className="text-sm text-muted-foreground italic">No communications logged.</p>
              ) : (
                <div className="space-y-4">
                  {relatedComms.map(entry => (
                    <div key={entry.id} className="text-sm border-l-2 border-muted pl-3">
                      <div className="font-semibold text-primary mb-1">{formatDate(entry.occurredAt)} • {entry.channel}</div>
                      <div className="text-muted-foreground text-xs bg-muted/30 p-2 rounded line-clamp-3">
                        {entry.outcome}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InternalPlanForm({ arrears }: { arrears: any }) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateArrears();
  const { toast } = useToast();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: arrears.id,
      data: {
        ...arrears, // Need full object based on generated schemas
        summary: String(formData.get("summary")),
        objective: String(formData.get("objective")),
        workingPlan: String(formData.get("workingPlan")),
        communicationPosition: String(formData.get("communicationPosition")),
        evidenceLinks: String(formData.get("evidenceLinks")),
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetArrearsQueryKey(arrears.id) });
        toast({ title: "Strategy saved" });
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-serif">Summary & Context</Label>
            <Textarea name="summary" defaultValue={arrears.summary || ''} rows={3} placeholder="How did this debt occur? What's the historical context?" />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-serif">Objective</Label>
            <Textarea name="objective" defaultValue={arrears.objective || ''} rows={2} placeholder="e.g. Hold off enforcement until next month, negotiate 50% settlement..." />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-serif">Working Plan</Label>
            <Textarea name="workingPlan" defaultValue={arrears.workingPlan || ''} rows={4} placeholder="Internal steps to manage this debt." />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-serif">Communication Position</Label>
            <Textarea name="communicationPosition" defaultValue={arrears.communicationPosition || ''} rows={3} placeholder="What we are telling them vs what we aren't." />
          </div>
          <div className="space-y-2">
            <Label className="text-base font-serif">Evidence Links</Label>
            <Textarea name="evidenceLinks" defaultValue={arrears.evidenceLinks || ''} rows={2} placeholder="URLs to bills, letters, portal logins." />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}><Save className="w-4 h-4 mr-2"/> Save Strategy</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function ExternalPlanForm({ arrears }: { arrears: any }) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateArrears();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: arrears.id,
      data: {
        ...arrears,
        externalAcknowledgement: String(formData.get("externalAcknowledgement")),
        externalPaymentIntent: String(formData.get("externalPaymentIntent")),
        externalStagedReduction: String(formData.get("externalStagedReduction")),
        externalReviewPoints: String(formData.get("externalReviewPoints")),
        externalChannel: String(formData.get("externalChannel")),
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetArrearsQueryKey(arrears.id) });
        toast({ title: "External plan saved" });
      }
    });
  };

  const handleCopy = () => {
    const text = `ACCOUNT: ${arrears.accountRef || 'N/A'}
CREDITOR: ${arrears.creditor}

ACKNOWLEDGEMENT
${arrears.externalAcknowledgement || 'None'}

PAYMENT INTENT
${arrears.externalPaymentIntent || 'None'}

STAGED REDUCTION
${arrears.externalStagedReduction || 'None'}

REVIEW POINTS
${arrears.externalReviewPoints || 'None'}

CHANNEL PREFERENCE
${arrears.externalChannel || 'None'}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-sidebar px-4 py-3 rounded-lg border border-sidebar-border">
        <p className="text-sm text-sidebar-foreground">This is the sanitised version of the plan you communicate to the creditor.</p>
        <Button variant="secondary" size="sm" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          Copy as Text
        </Button>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-base font-serif">Acknowledgement</Label>
              <Textarea name="externalAcknowledgement" defaultValue={arrears.externalAcknowledgement || ''} rows={2} placeholder="I am writing to acknowledge the outstanding balance..." />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-serif">Payment Intent</Label>
              <Textarea name="externalPaymentIntent" defaultValue={arrears.externalPaymentIntent || ''} rows={2} placeholder="I intend to clear this via..." />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-serif">Staged Reduction</Label>
              <Textarea name="externalStagedReduction" defaultValue={arrears.externalStagedReduction || ''} rows={3} placeholder="Schedule of proposed payments..." />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-serif">Review Points</Label>
              <Textarea name="externalReviewPoints" defaultValue={arrears.externalReviewPoints || ''} rows={2} placeholder="I will review this arrangement on..." />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-serif">Channel Preference</Label>
              <Textarea name="externalChannel" defaultValue={arrears.externalChannel || ''} rows={2} placeholder="Please communicate via email only to..." />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}><Save className="w-4 h-4 mr-2"/> Save Plan</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
