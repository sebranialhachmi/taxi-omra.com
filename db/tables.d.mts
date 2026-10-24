export type ColType = "s" | "u" | "t" | "m" | "i" | "f" | "b" | "j" | "d";
export interface TableDef {
  stamps?: boolean;
  noId?: boolean;
  key?: string;
  unique?: string[];
  cols: Record<string, ColType>;
}
export const TABLES: Record<string, TableDef>;
export function createSql(): string[];
