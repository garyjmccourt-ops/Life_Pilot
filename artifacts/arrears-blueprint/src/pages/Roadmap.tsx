import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Compass, Filter, Layers, ListChecks, AlertTriangle } from "lucide-react";

const BASE = import.meta.env.BASE_URL;
const ALL = "All";

interface RoadmapItem {
  id: number;
  name: string;
  layer: string;
  status: string;
  description: string;
  whyItMatters: string;
  validationNeeded?: string | null;
  riskNotes?: string | null;
  buildPriority: string;
  notes?: string | null;
}

function useRoadmap() {
  return useQuery<RoadmapItem[]>({
    queryKey: ["roadmap"],
    queryFn: async () => {
      const response = await fetch(`${BASE}api/roadmap`);
      if (!response.ok) throw new Error("Roadmap could not be loaded");
      return response.json();
    },
  });
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function countBy(items: RoadmapItem[], key: keyof RoadmapItem) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = String(item[key] ?? "Unknown");
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function InfoBlock({ label, value, attention = false }: { label: string; value?: string | null; attention?: boolean }) {
  if (!value) return null;
  return (
    <div className={attention ? "rounded-xl border border-orange-200 bg-orange-50 px-3 py-2" : "rounded-xl border border-border bg-card px-3 py-2"}>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">{label}</div>
      <p className="text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

export default function Roadmap() {
  const { data = [], isLoading, isError } = useRoadmap();
  const [layerFilter, setLayerFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const layers = useMemo(() => unique(data.map((item) => item.layer)), [data]);
  const statuses = useMemo(() => unique(data.map((item) => item.status)), [data]);
  const statusCounts = useMemo(() => countBy(data, "status"), [data]);

  const filteredItems = useMemo(() => {
    return data.filter((item) => {
      const layerMatch = layerFilter === ALL || item.layer === layerFilter;
      const statusMatch = statusFilter === ALL || item.status === statusFilter;
      return layerMatch && statusMatch;
    });
  }, [data, layerFilter, statusFilter]);

  const selectedItem = useMemo(() => {
    if (!filteredItems.length) return null;
    return filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0];
  }, [filteredItems, selectedId]);

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#17313C] p-4 md:p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FBFAF7] border border-[#DDD8CF] px-3 py-1 text-xs font-medium text-[#436F70] mb-3">
              <Compass className="h-3.5 w-3.5" /> Internal working direction
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">Product Roadmap</h1>
            <p className="text-sm md:text-base text-[#5C7885] max-w-2xl mt-2">
              A lightweight internal layer for preserving product architecture, activated layers, companion apps, validation needs and parked ideas.
            </p>
          </div>
          <Card className="bg-[#FBFAF7] border-[#DDD8CF] md:w-72">
            <CardContent className="pt-4">
              <div className="text-xs uppercase tracking-wide text-[#5C7885] font-semibold">Current guardrail</div>
              <p className="text-sm mt-1 leading-relaxed">
                This is not public community, voting, partner dashboards, investor portal or support-worker functionality.
              </p>
            </CardContent>
          </Card>
        </header>

        {isError && (
          <Card className="bg-[#FFF2E6] border-orange-200">
            <CardContent className="py-4 flex gap-3 text-sm">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div>
                <div className="font-semibold">This needs attention</div>
                <p>Roadmap data could not be loaded. Check that the roadmap_items table has been pushed before using this page.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Card key={status} className="bg-[#FBFAF7] border-[#DDD8CF]">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-[#5C7885] mb-1">{status}</div>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          ))}
          {!data.length && (
            <Card className="bg-[#FBFAF7] border-[#DDD8CF]">
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-[#5C7885] mb-1">Roadmap items</div>
                <div className="text-2xl font-bold">{isLoading ? "…" : 0}</div>
              </CardContent>
            </Card>
          )}
        </section>

        <Card className="bg-[#FBFAF7] border-[#DDD8CF]">
          <CardContent className="pt-4 flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-[#436F70]">
              <Filter className="h-4 w-4" /> Filters
            </div>
            <Select value={layerFilter} onValueChange={setLayerFilter}>
              <SelectTrigger className="md:w-64 bg-white"><SelectValue placeholder="Layer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All layers</SelectItem>
                {layers.map((layer) => <SelectItem key={layer} value={layer}>{layer}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="md:w-64 bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <section className="grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] gap-4">
          <Card className="bg-[#FBFAF7] border-[#DDD8CF]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><ListChecks className="h-5 w-5 text-[#436F70]" /> Roadmap items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading && <p className="text-sm text-[#5C7885] py-6 text-center">Loading roadmap…</p>}
              {!isLoading && filteredItems.length === 0 && <p className="text-sm text-[#5C7885] py-6 text-center">No roadmap items match these filters.</p>}
              {filteredItems.map((item) => {
                const active = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition ${active ? "border-[#436F70] bg-[#F8F6F0]" : "border-[#DDD8CF] bg-white hover:bg-[#F8F6F0]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-xs text-[#5C7885] mt-1">{item.layer}</div>
                      </div>
                      <Badge variant="outline" className="border-[#DDD8CF] text-[#17313C] bg-[#FBFAF7]">{item.status}</Badge>
                    </div>
                    <p className="text-sm text-[#5C7885] mt-2 line-clamp-2">{item.description}</p>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-[#FBFAF7] border-[#DDD8CF] lg:sticky lg:top-4 self-start">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Layers className="h-5 w-5 text-[#436F70]" /> Detail view</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedItem ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold">{selectedItem.name}</h2>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge className="bg-[#436F70] text-white">{selectedItem.layer}</Badge>
                      <Badge variant="outline" className="border-[#DDD8CF]">{selectedItem.status}</Badge>
                      <Badge variant="outline" className="border-[#ED7628] text-[#A85016] bg-[#FFF2E6]">{selectedItem.buildPriority}</Badge>
                    </div>
                  </div>
                  <InfoBlock label="Description" value={selectedItem.description} />
                  <InfoBlock label="Why it matters" value={selectedItem.whyItMatters} />
                  <InfoBlock label="Validation needed" value={selectedItem.validationNeeded} />
                  <InfoBlock label="Risk notes" value={selectedItem.riskNotes} attention />
                  <InfoBlock label="Notes" value={selectedItem.notes} />
                  <Button variant="outline" className="w-full border-[#DDD8CF]" onClick={() => setSelectedId(null)}>Show first filtered item</Button>
                </div>
              ) : (
                <p className="text-sm text-[#5C7885]">Select a roadmap item to see its details.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
