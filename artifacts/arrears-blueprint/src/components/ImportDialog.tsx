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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  AlertTriangle,
  FileJson,
  CheckCircle2,
  Download,
  ShieldAlert,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ImportMode = "merge" | "add-only" | "replace";

const ALL_SECTIONS = [
  { key: "incomeSources",    label: "Income Sources" },
  { key: "incomeEntries",    label: "Income Entries" },
  { key: "bills",            label: "Bills" },
  { key: "arrearsItems",     label: "Arrears Items" },
  { key: "tasks",            label: "Tasks" },
  { key: "commsEntries",     label: "Comms Log" },
  { key: "weeklyEntries",    label: "Weekly Entries" },
  { key: "gigEntries",       label: "Gig Entries" },
  { key: "budgetCategories", label: "Budget Categories" },
  { key: "scenarios",        label: "Scenarios" },
] as const;

type SectionKey = (typeof ALL_SECTIONS)[number]["key"];

type ParsedFile = {
  mode?: string;
  data?: Partial<Record<SectionKey, unknown[]>>;
};

function parseSectionCounts(text: string): Partial<Record<SectionKey, number>> | null {
  try {
    const parsed = JSON.parse(text) as ParsedFile;
    if (!parsed?.data || typeof parsed.data !== "object") return null;
    const counts: Partial<Record<SectionKey, number>> = {};
    for (const { key } of ALL_SECTIONS) {
      const arr = parsed.data[key];
      if (Array.isArray(arr)) counts[key] = arr.length;
    }
    return counts;
  } catch {
    return null;
  }
}

const MODE_OPTIONS: { value: ImportMode; label: string; description: string; destructive?: boolean }[] = [
  {
    value: "merge",
    label: "Merge (recommended)",
    description: "Add new records and update existing ones by name. Safe to run repeatedly — no deletions.",
  },
  {
    value: "add-only",
    label: "Add new only",
    description: "Skip any record whose name or provider already exists. Existing data is never changed.",
  },
  {
    value: "replace",
    label: "Replace selected sections ⚠️",
    description: "Delete everything in the chosen sections first, then import. Cannot be undone.",
    destructive: true,
  },
];

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<ImportMode>("merge");
  const [selected, setSelected] = useState<Set<SectionKey>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [resultCounts, setResultCounts] = useState<Record<string, number> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const counts = parseSectionCounts(text);
  const isValidShape = counts !== null;
  const detectedSections = ALL_SECTIONS.filter(({ key }) => (counts?.[key] ?? 0) > 0);
  const hasSections = detectedSections.length > 0;

  function reset() {
    setText("");
    setMode("merge");
    setSelected(new Set());
    setResultCounts(null);
    setSubmitting(false);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
    const c = parseSectionCounts(content);
    if (c) {
      setSelected(new Set(ALL_SECTIONS.filter(({ key }) => (c[key] ?? 0) > 0).map(({ key }) => key)));
    }
  }

  function toggleSection(key: SectionKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === detectedSections.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(detectedSections.map(({ key }) => key)));
    }
  }

  async function downloadTemplate() {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/export/template`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "myoh-template.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Could not download template", variant: "destructive" });
    }
  }

  async function handleImport() {
    let parsed: ParsedFile;
    try {
      parsed = JSON.parse(text);
    } catch {
      toast({ title: "Invalid JSON", description: "Could not parse the input.", variant: "destructive" });
      return;
    }

    const filteredData: Partial<Record<SectionKey, unknown[]>> = {};
    for (const key of selected) {
      const arr = parsed.data?.[key];
      if (Array.isArray(arr)) filteredData[key] = arr;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, data: filteredData }),
      });
      const body = await res.json() as { counts?: Record<string, number>; error?: string; issues?: { path: string; message: string }[] };
      if (!res.ok) {
        const detail = body.issues
          ? body.issues.map((i) => `${i.path}: ${i.message}`).join("\n")
          : body.error ?? `HTTP ${res.status}`;
        throw new Error(detail);
      }
      setResultCounts(body.counts ?? {});
      await queryClient.invalidateQueries();
      toast({ title: "Import complete" });
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

  const sectionLabel = (key: SectionKey) =>
    ALL_SECTIONS.find((s) => s.key === key)?.label ?? key;

  return (
    <>
      <Button
        onClick={() => { reset(); setOpen(true); }}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Import JSON
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Import household data</DialogTitle>
            <DialogDescription>
              Load a MYOH export or template JSON, choose what to import, and pick a mode.
            </DialogDescription>
          </DialogHeader>

          {!resultCounts ? (
            <div className="space-y-5">
              {/* File / paste input */}
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground"
                    onClick={downloadTemplate}
                  >
                    <Download className="h-4 w-4" />
                    Download template
                  </Button>
                </div>
                <div>
                  <Label htmlFor="import-json" className="text-sm">
                    Or paste JSON below
                  </Label>
                  <Textarea
                    id="import-json"
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      const c = parseSectionCounts(e.target.value);
                      if (c) setSelected(new Set(ALL_SECTIONS.filter(({ key }) => (c[key] ?? 0) > 0).map(({ key }) => key)));
                    }}
                    placeholder='{ "data": { "incomeSources": [...], "bills": [...] } }'
                    className="font-mono text-xs h-32 mt-2"
                  />
                </div>
              </div>

              {/* Invalid shape error */}
              {text && !isValidShape && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Cannot read this file</AlertTitle>
                  <AlertDescription>
                    Expected a JSON object with a top-level <code>data</code> key matching the export format.
                  </AlertDescription>
                </Alert>
              )}

              {/* Section selector */}
              {hasSections && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Sections detected</Label>
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                    >
                      {selected.size === detectedSections.length ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {detectedSections.map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 rounded-md border border-border p-2 cursor-pointer hover:bg-muted/40 text-sm"
                      >
                        <Checkbox
                          checked={selected.has(key)}
                          onCheckedChange={() => toggleSection(key)}
                        />
                        <span>{label}</span>
                        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                          {counts?.[key] ?? 0}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode selector */}
              {hasSections && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Import mode</Label>
                  <div className="space-y-2">
                    {MODE_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                          mode === opt.value
                            ? opt.destructive
                              ? "border-destructive bg-destructive/5"
                              : "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="import-mode"
                          value={opt.value}
                          checked={mode === opt.value}
                          onChange={() => setMode(opt.value)}
                          className="mt-0.5 accent-current"
                        />
                        <div>
                          <div className={`text-sm font-medium ${opt.destructive ? "text-destructive" : ""}`}>
                            {opt.label}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Replace warning */}
              {mode === "replace" && selected.size > 0 && (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>This will delete existing data</AlertTitle>
                  <AlertDescription>
                    All current rows in{" "}
                    {[...selected].map((k) => sectionLabel(k)).join(", ")} will be
                    permanently removed before importing. Export first if you may need it back.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertTitle>Import complete</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1 text-sm">
                  {Object.entries(resultCounts)
                    .filter(([, n]) => n > 0)
                    .map(([k, n]) => (
                      <li key={k}>
                        <span className="font-medium">{n}</span>{" "}
                        {sectionLabel(k as SectionKey)}
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
                  disabled={!isValidShape || selected.size === 0 || submitting}
                  variant={mode === "replace" ? "destructive" : "default"}
                >
                  {submitting
                    ? "Importing…"
                    : mode === "replace"
                    ? `Replace ${selected.size} section${selected.size !== 1 ? "s" : ""}`
                    : `Import ${selected.size} section${selected.size !== 1 ? "s" : ""}`}
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
