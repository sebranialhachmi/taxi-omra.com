export const THRESHOLDS: Record<"posts" | "pages", { words_ar: number; words_en: number }>;
export function checkReadiness(row: Record<string, any>, kind: "posts" | "pages"): { ready: boolean; problems: string[] };
export function priorityFor(row: Record<string, any>, kind: "posts" | "pages"): number;
