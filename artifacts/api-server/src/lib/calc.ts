export type Frequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "annual"
  | "one-off";

const FACTORS: Record<Frequency, number> = {
  weekly: 1,
  fortnightly: 1 / 2,
  monthly: 12 / 52,
  quarterly: 4 / 52,
  annual: 1 / 52,
  "one-off": 0,
};

export function toWeekly(amount: number, frequency: string): number {
  const f = FACTORS[frequency as Frequency] ?? 0;
  return Math.round(amount * f * 100) / 100;
}

export function n(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}
