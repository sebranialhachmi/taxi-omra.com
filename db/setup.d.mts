export function hashPassword(password: string): string;
export function setupDatabase(
  conn: { query: (sql: string, params?: any) => Promise<any> },
  opts?: {
    seedDir?: URL | string;
    adminEmail?: string;
    adminPassword?: string;
    resetAdmin?: boolean;
    log?: (message: string) => void;
  },
): Promise<void>;
