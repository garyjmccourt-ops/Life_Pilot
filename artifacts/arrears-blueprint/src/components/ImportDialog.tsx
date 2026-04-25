import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, AlertTriangle, FileJson, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Counts = Record<string, number>;

type Parsed = {
  data: {
    incomeSources?: unknown[];
    bills?: unknown[];
    arrearsItems?: unknown[];
    tasks?: unknown[];
    commsEntries?: unknown[];
    weeklyEntries?: unknown[];
  };
};

function previewCounts(text: string): Counts | null {
  try {
    const parsed = JSON.parse(text) as Parsed;
    if (!parsed?.data || typeof parsed.data !== "object") return null;
    return {
      "Income sources": parsed.data.incomeSources?.length ?? 0,
      "Bills": parsed.data.bills?.length ?? 0,
      "Arrears items": parsed.data.arrearsItems?.length ?? 0,
      "Tasks": parsed.data.tasks?.length ?? 0,
      "Comms entries": parsed.data.commsEntries?.length ?? 0,
      "Weekly entries": parsed.data.weeklyEntries?.length ?? 0,
    };
  } catch {
    return null;
  }
}

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultCounts, setResultCounts] = useState<Counts | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const counts = previewCounts(text);
  const isValidShape = counts !== null;

  function reset() {
    setText("");
    setResultCounts(null);
    setSubmitting(false);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
  }

  async function handleImport() {
    let parsed: Parsed & { mode?: string };
    try {
      parsed = JSON.parse(text);
    } catch {
      toast({
        title: "Invalid JSON",
        description: "Could not parse the input.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "replace", data: parsed.data }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      setResultCounts(body.counts as Counts);
      await queryClient.invalidateQueries();
      toast({
        title: "Import complete",
        description: "Your data has been replaced with the imported file.",
      });
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        onClick={() => {
          reset();
          setOpen(true);
        }}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Import JSON
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Import data from JSON</DialogTitle>
            <DialogDescription>
              Paste the JSON returned by ChatGPT (or upload the file). The current
              contents of every section will be replaced with the imported data.
            </DialogDescription>
          </DialogHeader>

          {!resultCounts && (
            <div className="space-y-4">
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={onFile}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => fileRef.current?.click()}
                >
                  <FileJson className="h-4 w-4" />
                  Choose file…
                </Button>
              </div>

              <div>
                <Label htmlFor="import-json" className="text-sm">
                  Or paste JSON below
                </Label>
                <Textarea
                  id="import-json"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder='{ "data": { "incomeSources": [...], "bills": [...] } }'
                  className="font-mono text-xs h-48 mt-2"
                />
              </div>

              {text && !isValidShape && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Cannot read this file</AlertTitle>
                  <AlertDescription>
                    Expected a JSON object with a top-level <code>data</code> key
                    matching the export format.
                  </AlertDescription>
                </Alert>
              )}

              {counts && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Replace everything?</AlertTitle>
                  <AlertDescription>
                    <div className="mt-1">
                      About to import:{" "}
                      {Object.entries(counts)
                        .filter(([, n]) => n > 0)
                        .map(([k, n]) => `${n} ${k.toLowerCase()}`)
                        .join(", ") || "(no rows)"}
                      .
                    </div>
                    <div className="mt-1">
                      All current rows in those sections will be deleted first.
                      Export your data first if you might want it back.
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {resultCounts && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertTitle>Import complete</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1 text-sm">
                  {Object.entries(resultCounts).map(([k, n]) => (
                    <li key={k}>
                      <span className="font-medium">{n}</span> {k}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            {!resultCounts ? (
              <>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!isValidShape || submitting}
                >
                  {submitting ? "Importing…" : "Replace data"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setOpen(false)}>Done</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
