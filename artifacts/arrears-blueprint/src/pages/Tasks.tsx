import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  useListTasks, getListTasksQueryKey,
  useCreateTask, useUpdateTask, useDeleteTask,
  useListArrears
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { PlusCircle, CheckCircle2, Circle, AlertCircle, Clock, Trash2, CalendarDays } from "lucide-react";
import { formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";

const BUCKETS = ["pay", "contact", "file", "review", "negotiate", "watch"];
const PRIORITIES = { p1: "High", p2: "Medium", p3: "Low" };

export default function Tasks() {
  const { data: tasks, isLoading } = useListTasks();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterBucket, setFilterBucket] = useState<string>("all");
  
  if (isLoading) return <div className="p-8"><Skeleton className="h-64" /></div>;

  const openTasks = tasks?.filter(t => t.status !== "done") || [];
  const doneTasks = tasks?.filter(t => t.status === "done") || [];

  const filteredTasks = filterBucket === "all" ? openTasks : openTasks.filter(t => t.bucket === filterBucket);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Action Tasks</h1>
          <p className="text-muted-foreground mt-2 text-lg">{openTasks.length} open tasks needing your attention.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="h-4 w-4 mr-2" /> New Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Task</DialogTitle>
            </DialogHeader>
            <TaskForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button variant={filterBucket === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterBucket("all")} className="rounded-full">All</Button>
        {BUCKETS.map(bucket => (
          <Button key={bucket} variant={filterBucket === bucket ? "default" : "outline"} size="sm" onClick={() => setFilterBucket(bucket)} className="rounded-full capitalize">
            {bucket}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {!filteredTasks.length ? (
          <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
            No open tasks in this view.
          </div>
        ) : (
          filteredTasks.map(task => <TaskRow key={task.id} task={task} />)
        )}
      </div>

      {doneTasks.length > 0 && (
        <div className="mt-12 pt-8 border-t border-border">
          <h3 className="font-serif text-lg font-medium mb-4 text-muted-foreground">Completed</h3>
          <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
            {doneTasks.slice(0, 10).map(task => <TaskRow key={task.id} task={task} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: any }) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const { toast } = useToast();

  const toggleStatus = () => {
    const newStatus = task.status === "done" ? "open" : "done";
    updateMutation.mutate({
      id: task.id,
      data: { ...task, status: newStatus }
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() })
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: task.id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() })
    });
  };

  return (
    <Card className={`group transition-all ${task.status === 'done' ? 'bg-muted/30 border-transparent shadow-none' : ''}`}>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button onClick={toggleStatus} className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
            {task.status === "done" ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <Circle className="h-6 w-6" />}
          </button>
          
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
              {task.priority === 'p1' && <span className="flex items-center text-destructive font-medium"><AlertCircle className="h-3 w-3 mr-1"/> High Priority</span>}
              <span className="uppercase tracking-wider font-medium text-primary/70">{task.bucket}</span>
              {task.creditorTag && <span>• {task.creditorTag}</span>}
              {task.dueDate && <span className="flex items-center"><CalendarDays className="h-3 w-3 mr-1"/> {formatDate(task.dueDate)}</span>}
            </div>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={handleDelete} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function TaskForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const createMutation = useCreateTask();
  const { data: arrears } = useListArrears();
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const arrearsIdStr = formData.get("arrearsItemId") as string;
    
    createMutation.mutate({
      data: {
        title: String(formData.get("title")),
        bucket: String(formData.get("bucket")) as any,
        status: "open",
        priority: String(formData.get("priority")) as any,
        dueDate: String(formData.get("dueDate")) || null,
        creditorTag: String(formData.get("creditorTag")) || null,
        arrearsItemId: arrearsIdStr && arrearsIdStr !== "none" ? Number(arrearsIdStr) : null,
        notes: String(formData.get("notes")) || null,
        recurring: false,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        toast({ title: "Task added" });
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input name="title" required placeholder="What needs doing?" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category / Bucket</Label>
          <Select name="bucket" defaultValue="contact">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {BUCKETS.map(b => <SelectItem key={b} value={b} className="capitalize">{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select name="priority" defaultValue="p2">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="p1">High</SelectItem>
              <SelectItem value="p2">Medium</SelectItem>
              <SelectItem value="p3">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input name="dueDate" type="date" />
        </div>
        <div className="space-y-2">
          <Label>Creditor Tag</Label>
          <Input name="creditorTag" placeholder="e.g. Energy Co" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Link to Arrears Record (Optional)</Label>
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

      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>Add Task</Button>
      </DialogFooter>
    </form>
  );
}
