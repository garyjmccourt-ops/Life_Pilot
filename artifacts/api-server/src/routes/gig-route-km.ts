import { Router, type IRouter } from "express";
import { z } from "zod";

const router: IRouter = Router();

const RouteKmBody = z.object({
  routeChain: z.string().min(1),
});

async function geocode(query: string, token: string): Promise<{ lng: number; lat: number }> {
  const url =
    "https://api.mapbox.com/search/geocode/v6/forward?" +
    "q=" + encodeURIComponent(query + ", South Australia, Australia") +
    "&country=AU&limit=1&autocomplete=false&access_token=" + encodeURIComponent(token);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocode failed for "${query}" HTTP ${res.status}`);
  const json = await res.json() as { features?: Array<{ geometry: { coordinates: [number, number] } }> };
  if (!json.features?.length) throw new Error(`No geocode result for "${query}"`);
  const [lng, lat] = json.features[0].geometry.coordinates;
  return { lng, lat };
}

async function directions(coords: Array<{ lng: number; lat: number }>, token: string): Promise<{ distance: number; duration: number }> {
  if (coords.length > 25) throw new Error("Max 25 stops per route.");
  const coordStr = coords.map((c) => `${c.lng},${c.lat}`).join(";");
  const url =
    "https://api.mapbox.com/directions/v5/mapbox/driving/" +
    coordStr +
    "?overview=false&steps=false&access_token=" + encodeURIComponent(token);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Directions failed HTTP ${res.status}`);
  const json = await res.json() as { routes?: Array<{ distance: number; duration: number }> };
  if (!json.routes?.length) throw new Error("No route returned.");
  return json.routes[0];
}

router.post("/gig/route-km", async (req, res): Promise<void> => {
  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    res.status(503).json({ error: "MAPBOX_TOKEN not configured. Add it to your secrets to enable route KM calculation." });
    return;
  }

  const parsed = RouteKmBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "routeChain is required" });
    return;
  }

  const stops = parsed.data.routeChain
    .split("->")
    .map((s) => s.trim())
    .filter(Boolean);

  if (stops.length < 2) {
    res.status(400).json({ error: "Route needs at least 2 stops separated by ' -> '." });
    return;
  }

  try {
    const coords = await Promise.all(stops.map((s) => geocode(s, token)));
    const route = await directions(coords, token);
    const km = route.distance / 1000;
    const minutes = Math.round(route.duration / 60);
    res.json({
      km: Math.round(km * 1000) / 1000,
      minutes,
      stops: stops.length,
      notes: `Mapbox route: ${km.toFixed(2)} km, ${minutes} min. Stops: ${stops.length}`,
    });
  } catch (err) {
    res.status(422).json({ error: err instanceof Error ? err.message : "Route calculation failed." });
  }
});

export default router;
