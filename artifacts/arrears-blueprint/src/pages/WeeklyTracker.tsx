import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  useListWeeks, getListWeeksQueryKey,
  useUpsertWeek
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { Check, Edit2 } from "lucide-react";

// Generate last 2 weeks and next 10 weeks as Monday dates
function generateWeeksList(): string[] {
  const dates = [];
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const currentMonday = new Date(now.setDate(diff));
  currentMonday.setHours(0,0,0,0);
  
  for (let i = -2; i <= 10; i++) {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + (i * 7));
    // Format to YYYY-MM-DD keeping local timezone
    const offset = d.getTimezoneOffset()
    const finalDate = new Date(d.getTime() - (offset*60*1000))
    dates.push(finalDate.toISOString().split('T')[0]);
  }
  return dates;
}

export default function WeeklyTracker() {
  const { data: records, isLoading } = useListWeeks();
  const weeks = generateWeeksList();
  
  if (isLoading) return <div className="p-8"><Skeleton className="h-[400px]" /></div>;

  const recordsMap = new Map(records?.map(r => [r.weekStart.slice(0,10), r]));

  // Find the closest Monday to today to highlight
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const currentMondayStr = new Date(now.setDate(diff)).toISOString().slice(0, 10);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Weekly Tracker</h1>
        <p className="text-muted-foreground mt-2 text-lg">Compare your planned budget against actuals week by week.</p>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[180px] font-serif font-bold text-foreground">Week Commencing</TableHead>
                <TableHead className="text-right">Planned In</TableHead>
                <TableHead className="text-right">Actual In</TableHead>
                <TableHead className="text-right">Planned Out</TableHead>
                <TableHead className="text-right">Actual Out</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeks.map(weekDate => {
                const record = recordsMap.get(weekDate);
                const isCurrent = weekDate === currentMondayStr;
                return (
                  <WeekRow 
                    key={weekDate} 
                    dateStr={weekDate} 
                    record={record} 
                    isCurrent={isCurrent}
                  />
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function WeekRow({ dateStr, record, isCurrent }: { dateStr: string, record: any, isCurrent: boolean }) {
  const [isEditing, setIsEditing] = useState(!record && isCurrent);
  const queryClient = useQueryClient();
  const upsertMutation = useUpsertWeek();
  const { toast } = useToast();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    upsertMutation.mutate({
      data: {
        weekStart: dateStr,
        plannedIn: Number(formData.get("plannedIn")),
        actualIn: Number(formData.get("actualIn")),
        plannedOut: Number(formData.get("plannedOut")),
        actualOut: Number(formData.get("actualOut")),
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListWeeksQueryKey() });
        setIsEditing(false);
        toast({ title: "Week updated" });
      }
    });
  };

  const variance = record ? (record.actualIn - record.actualOut) - (record.plannedIn - record.plannedOut) : 0;

  if (isEditing) {
    return (
      <TableRow className={isCurrent ? "bg-primary/5" : ""}>
        <TableCell className="font-medium align-top pt-4">
          {formatDate(dateStr)}
          {isCurrent && <div className="text-[10px] uppercase tracking-wider text-primary font-bold mt-1">Current Week</div>}
        </TableCell>
        <TableCell colSpan={6} className="p-0">
          <form onSubmit={handleSave} className="flex items-center w-full py-2 pr-2">
            <div className="flex-1 grid grid-cols-4 gap-2 px-4">
              <Input name="plannedIn" type="number" step="0.01" defaultValue={record?.plannedIn || 0} className="h-8 text-right" />
              <Input name="actualIn" type="number" step="0.01" defaultValue={record?.actualIn || 0} className="h-8 text-right" />
              <Input name="plannedOut" type="number" step="0.01" defaultValue={record?.plannedOut || 0} className="h-8 text-right" />
              <Input name="actualOut" type="number" step="0.01" defaultValue={record?.actualOut || 0} className="h-8 text-right" />
            </div>
            <div className="w-[180px] flex justify-end gap-2 pr-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-8">Cancel</Button>
              <Button type="submit" size="sm" disabled={upsertMutation.isPending} className="h-8">Save</Button>
            </div>
          </form>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className={isCurrent ? "bg-primary/5 hover:bg-primary/10" : ""}>
      <TableCell className="font-medium">
        {formatDate(dateStr)}
        {isCurrent && <div className="text-[10px] uppercase tracking-wider text-primary font-bold mt-1">Current Week</div>}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">{record ? formatCurrency(record.plannedIn) : '—'}</TableCell>
      <TableCell className="text-right font-medium">{record ? formatCurrency(record.actualIn) : '—'}</TableCell>
      <TableCell className="text-right text-muted-foreground">{record ? formatCurrency(record.plannedOut) : '—'}</TableCell>
      <TableCell className="text-right font-medium">{record ? formatCurrency(record.actualOut) : '—'}</TableCell>
      <TableCell className={`text-right font-bold ${variance > 0 ? 'text-primary' : variance < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
        {record ? (variance > 0 ? '+' : '') + formatCurrency(variance) : '—'}
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsEditing(true)}>
          <Edit2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
