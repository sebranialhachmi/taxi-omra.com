export const RELEASE_INTERVAL_DAYS = 3;
export const RELEASE_CHECKS = ["facts", "prices", "unique", "bilingual", "images", "links", "competitors"] as const;
export type ReleaseCheck = (typeof RELEASE_CHECKS)[number];
export type ReviewChecks = Record<ReleaseCheck, boolean>;
export const EMPTY_CHECKS: ReviewChecks = { facts: false, prices: false, unique: false, bilingual: false, images: false, links: false, competitors: false };
export function reviewComplete(checks: Partial<ReviewChecks>, competitors: string[], advantage: string) {
  return RELEASE_CHECKS.every((key) => checks[key] === true)
    && competitors.length >= 2 && competitors.every((url) => /^https:\/\//.test(url))
    && advantage.trim().length >= 40;
}
export function canRelease(status: string, paused: boolean, now: Date, due: Date, revisionMatches: boolean) {
  return status === "ready" && !paused && revisionMatches && now.getTime() >= due.getTime();
}
export function nextReleaseDate(last: Date) {
  return new Date(last.getTime() + RELEASE_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
}