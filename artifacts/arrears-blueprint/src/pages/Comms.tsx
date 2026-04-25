import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  useListComms, getListCommsQueryKey,
  useCreateComms, useDeleteComms,
  useListArrears
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { PlusCircle, Phone, Mail, FileText, MessageSquare, User, Globe, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";

const CHANNEL_ICONS: Record<string, any> = {
  phone: Phone,
  email: Mail,
  letter: FileText,
  sms: MessageSquare,
  "in-person": User,
  portal: Globe
};

export default function Comms() {
  const { data: comms, isLoading } = useListComms();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  if (isLoading) return <div className="p-8"><Skeleton className="h-64" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Communications Log</h1>
          <p className="text-muted-foreground mt-2 text-lg">A chronological record of who said what.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="h-4 w-4 mr-2" /> Log Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Communication</DialogTitle>
            </DialogHeader>
            <CommsForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative border-l-2 border-muted ml-4 pl-6 space-y-8 py-4">
        {!comms?.length ? (
          <div className="py-8 text-muted-foreground italic">No communications logged yet.</div>
        ) : (
          comms.map((entry) => (
            <CommsEntryRow key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}

function CommsEntryRow({ entry }: { entry: any }) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteComms();
  const { toast } = useToast();
  const Icon = CHANNEL_ICONS[entry.channel] || MessageSquare;

  const handleDelete = () => {
    if (confirm("Delete this log entry?")) {
      deleteMutation.mutate({ id: entry.id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCommsQueryKey() })
      });
    }
  };

  return (
    <div className="relative group">
      {/* Timeline dot */}
      <div className="absolute -left-[35px] top-1 h-6 w-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
        <Icon className="h-3 w-3 text-primary" />
      </div>

      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="font-medium text-base">{entry.creditor}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                <span className="font-semibold text-primary">{formatDate(entry.occurredAt)}</span>
                <span>•</span>
                <span className="capitalize">{entry.channel}</span>
                {entry.who && <><span>•</span><span>Spoke to: {entry.who}</span></>}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="bg-muted/30 p-3 rounded text-sm text-foreground mb-3 border border-border whitespace-pre-wrap">
            {entry.outcome}
          </div>

          {entry.nextStep && (
            <div className="text-sm font-medium flex items-center gap-2 text-primary">
              <span className="uppercase text-[10px] tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">Next Step</span>
              {entry.nextStep}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CommsForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createMutation = useCreateComms();
  const { data: arrears } = useListArrears();
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const arrearsIdStr = formData.get("arrearsItemId") as string;
    
    createMutation.mutate({
      data: {
        occurredAt: String(formData.get("occurredAt")),
        channel: String(formData.get("channel")) as any,
        creditor: String(formData.get("creditor")),
        arrearsItemId: arrearsIdStr && arrearsIdStr !== "none" ? Number(arrearsIdStr) : null,
        who: String(formData.get("who")) || null,
        outcome: String(formData.get("outcome")),
        nextStep: String(formData.get("nextStep")) || null,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCommsQueryKey() });
        toast({ title: "Communication logged" });
        onSuccess();
      }
    });
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input name="occurredAt" type="date" required defaultValue={today} />
        </div>
        <div className="space-y-2">
          <Label>Channel</Label>
          <Select name="channel" defaultValue="phone">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="letter">Letter</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="portal">Portal / Online</SelectItem>
              <SelectItem value="in-person">In Person</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Creditor Name</Label>
          <Input name="creditor" required placeholder="Who did you contact?" />
        </div>
        <div className="space-y-2">
          <Label>Link to Arrears Record</Label>
          <Select name="arrearsItemId" defaultValue="none">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {arrears?.map(a => (
                <SelectItem key={a.id} value={a.id.toString()}>{a.creditor}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Who did you speak to? (Optional)</Label>
        <Input name="who" placeholder="Name, department, or reference number" />
      </div>

      <div className="space-y-2">
        <Label>Outcome / Notes</Label>
        <Textarea name="outcome" required rows={3} placeholder="What was agreed? What did they say?" />
      </div>

      <div className="space-y-2">
        <Label>Next Step (Optional)</Label>
        <Input name="nextStep" placeholder="What needs to happen next?" />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>Save Entry</Button>
      </DialogFooter>
    </form>
  );
}
