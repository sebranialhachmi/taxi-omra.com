import { describe, it, expect } from "vitest";
import { canRelease, EMPTY_CHECKS, nextReleaseDate, reviewComplete } from "./seo-release-rules";
import { isIndexedBlog, isIndexedCms } from "./index-policy";

describe("reviewed release rules", () => {
  it("spaces releases by three complete days", () => {
    expect(nextReleaseDate(new Date("2026-10-15T06:00:00Z")).toISOString()).toBe("2026-10-18T06:00:00.000Z");
  });
  it("never releases unreviewed content", () => {
    expect(canRelease("pending", false, new Date("2026-10-16"), new Date("2026-10-15"), true)).toBe(false);
    expect(canRelease("ready", false, new Date("2026-10-16"), new Date("2026-10-15"), true)).toBe(true);
  });
  it("requires all quality checks and an evidenced competitor advantage", () => {
    expect(reviewComplete(EMPTY_CHECKS, ["https://one.example", "https://two.example"], "Verified distinction with corrected route-specific fare data.")).toBe(false);
    expect(reviewComplete(Object.fromEntries(Object.keys(EMPTY_CHECKS).map(k => [k, true])), ["https://one.example", "https://two.example"], "Verified distinction with corrected route-specific fare data.")).toBe(true);
  });
  it("respects pause", () => {
    expect(canRelease("ready", true, new Date("2026-10-16"), new Date("2026-10-15"), true)).toBe(false);
  });
  it("does not release before the due date", () => {
    expect(canRelease("ready", false, new Date("2026-10-14"), new Date("2026-10-15"), true)).toBe(false);
  });
  it("requires renewed review after content changes", () => {
    expect(canRelease("ready", false, new Date("2026-10-16"), new Date("2026-10-15"), false)).toBe(false);
  });
  it("keeps unreleased hidden pages excluded and releases approved additions", () => {
    expect(isIndexedBlog("jeddah-to-taif-transfer", false)).toBe(false);
    expect(isIndexedBlog("jeddah-to-taif-transfer", true)).toBe(true);
    expect(isIndexedCms("city-abha", false)).toBe(false);
    expect(isIndexedCms("city-abha", true)).toBe(true);
  });
});