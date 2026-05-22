import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, XCircle, CheckCheck, Info, RefreshCw, ExternalLink } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type GigImport = {
  id: number;
  receivedAt: string;
  sourceSystem: string;
  sourceRef: string;
  entryDate: string;
  platform: string;
  person: string;
  grossEarnings: string;
  netIncome: string;
  tips: string;
  fees: string;
  fuelEstimate: string;
  hoursWorked: string | null;
  deliveriesCount: number | null;
  paymentStatus: string;
  notes: string | null;
  reviewStatus: "pending" | "approved" | "rejected" | "duplicate";
  promotedGigEntryId: number | null;
  promotedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  warnings: string[];
};

function formatCurrency(v: string | number | null | undefined) {
  const n = parseFloat(String(v ?? 0));
  return isNaN(n) ? "—" : `$${n.toFixed(2)}`;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return d.slice(0, 10);
}

function StatusBadge({ status }: { status: GigImport["reviewStatus"] }) {
  const map = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    duplicate: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${map[status]}`}>
      {status}
    </span>
  );
}

export default function GigImportQueue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAll, setShowAll] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: imports = [], isLoading, refetch } = useQuery<GigImport[]>({
    queryKey: ["gig-imports", showAll],
    queryFn: async () => {
      const res = await fetch(`${BASE}api/gig-imports${showAll ? "?all=true" : ""}`);
      if (!res.ok) throw new Error("Failed to load staged imports");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${BASE}api/gig-imports/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Approve failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Record approved and promoted",
        description: `Moved to Gig Work (entry #${data.gigEntry?.id}). Weekly rollup updated for week ending ${data.weeklyIncome?.weekEnding ?? "—"}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["gig-imports"] });
      queryClient.invalidateQueries({ queryKey: ["gig"] });
      queryClient.invalidateQueries({ queryKey: ["income-entries"] });
    },
    onError: (err: Error) => {
      toast({ title: "Approve failed", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await fetch(`${BASE}api/gig-imports/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Reject failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Record rejected", description: "The staged import has been rejected." });
      queryClient.invalidateQueries({ queryKey: ["gig-imports"] });
      setRejectingId(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({ title: "Reject failed", variant: "destructive" });
    },
  });

  const pending = imports.filter((r) => r.reviewStatus === "pending");
  const nonPending = imports.filter((r) => r.reviewStatus !== "pending");

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold">Gig Import Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Staged DoorDash / Gig_Pilot records awaiting review. No data has been written to live income records.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 flex-shrink-0">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Notice banner */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-md px-4 py-3 text-sm text-blue-800">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Packet 1 — Staging only.</strong> Approve is visible but disabled. Promotion to Gig Work records will be enabled in a later packet once reviewed and explicitly approved.
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Pending", count: imports.filter(r => r.reviewStatus === "pending").length, color: "text-yellow-700" },
          { label: "Approved", count: imports.filter(r => r.reviewStatus === "approved").length, color: "text-green-700" },
          { label: "Rejected", count: imports.filter(r => r.reviewStatus === "rejected").length, color: "text-red-700" },
          { label: "Duplicate", count: imports.filter(r => r.reviewStatus === "duplicate").length, color: "text-gray-500" },
        ].map(({ label, count, color }) => (
          <Card key={label} className="py-3 px-4">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{count}</div>
          </Card>
        ))}
      </div>

      {/* Show all toggle */}
      <div className="flex items-center gap-2">
        <Switch id="show-all" checked={showAll} onCheckedChange={setShowAll} />
        <Label htmlFor="show-all" className="text-sm cursor-pointer">Show approved and rejected records</Label>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {showAll ? "All staged imports" : "Pending review"} — {imports.length} record{imports.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
          ) : imports.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No staged imports found. Records will appear here when Gig_Pilot sends data to <code className="text-xs bg-muted px-1 rounded">POST /api/gig-imports</code>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Platform</th>
                    <th className="px-4 py-2 text-left">Person</th>
                    <th className="px-4 py-2 text-right">Gross</th>
                    <th className="px-4 py-2 text-right">Net</th>
                    <th className="px-4 py-2 text-left">Pay Status</th>
                    <th className="px-4 py-2 text-left">Review</th>
                    <th className="px-4 py-2 text-left">Source Ref</th>
                    <th className="px-4 py-2 text-left">Received</th>
                    <th className="px-4 py-2 text-left">Warnings</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {imports.map((row) => (
                    <tr key={row.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-2.5 tabular-nums">{formatDate(row.entryDate)}</td>
                      <td className="px-4 py-2.5 capitalize">{row.platform}</td>
                      <td className="px-4 py-2.5">{row.person}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(row.grossEarnings)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(row.netIncome)}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="text-xs capitalize">{row.paymentStatus}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={row.reviewStatus} />
                        {row.rejectionReason && (
                          <div className="text-[11px] text-muted-foreground mt-0.5 max-w-[160px] truncate" title={row.rejectionReason}>
                            {row.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs text-muted-foreground">{row.sourceRef}</span>
                        <div className="text-[10px] text-muted-foreground/60">{row.sourceSystem}</div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatDate(row.receivedAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        {row.warnings && row.warnings.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {row.warnings.map((w, i) => (
                              <div key={i} className="flex items-start gap-1 text-[11px] text-amber-700">
                                <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                <span>{w}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {row.reviewStatus === "pending" && (
                          <div className="flex flex-col gap-1.5">
                            <div className="text-[11px] text-muted-foreground leading-tight">
                              Approving moves this record into live Gig Work and updates the weekly income rollup.
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 text-red-700 border-red-200 hover:bg-red-50"
                                onClick={() => { setRejectingId(row.id); setRejectionReason(""); }}
                                disabled={approveMutation.isPending}
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-xs gap-1 bg-green-700 hover:bg-green-800 text-white"
                                onClick={() => approveMutation.mutate(row.id)}
                                disabled={approveMutation.isPending}
                                title="Approve and move to Gig Work"
                              >
                                <CheckCheck className="h-3.5 w-3.5" /> Approve
                              </Button>
                            </div>
                          </div>
                        )}
                        {row.reviewStatus === "rejected" && (
                          <span className="text-xs text-muted-foreground">Rejected</span>
                        )}
                        {row.reviewStatus === "approved" && (
                          <span className="text-xs text-green-700">Promoted</span>
                        )}
                        {row.reviewStatus === "duplicate" && (
                          <span className="text-xs text-muted-foreground">Duplicate</span>
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

      {/* Reject dialog */}
      <Dialog open={rejectingId !== null} onOpenChange={(o) => { if (!o) { setRejectingId(null); setRejectionReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject staged import</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              The staged row will be marked as rejected and kept for audit purposes. It will not be deleted.
            </p>
            <div className="space-y-1">
              <Label className="text-sm">Reason (optional)</Label>
              <Input
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. duplicate entry, wrong week, incorrect amount"
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectingId(null); setRejectionReason(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => rejectingId !== null && rejectMutation.mutate({ id: rejectingId, reason: rejectionReason })}
              disabled={rejectMutation.isPending}
            >
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
