import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import * as fs from 'fs';
import * as path from 'path';
import * as schema from './schema';
import { SCHEMA_STATEMENTS } from './init';

type DrizzleDb = ReturnType<typeof drizzleNodePg<typeof schema>> | ReturnType<typeof drizzlePglite<typeof schema>>;

declare global {
  // eslint-disable-next-line no-var
  var __habitflow_db__: DrizzleDb | undefined;
  // eslint-disable-next-line no-var
  var __habitflow_pool__: Pool | undefined;
  // eslint-disable-next-line no-var
  var __habitflow_pglite__: PGlite | undefined;
  // eslint-disable-next-line no-var
  var __habitflow_initialized__: boolean | undefined;
  // eslint-disable-next-line no-var
  var __habitflow_init_promise__: Promise<void> | undefined;
}

let dbInstance: DrizzleDb;
let activePool: Pool | null = null;
let activePglite: PGlite | null = null;

function initDatabase(): DrizzleDb {
  if (global.__habitflow_db__) {
    activePool = global.__habitflow_pool__ || null;
    activePglite = global.__habitflow_pglite__ || null;
    return global.__habitflow_db__;
  }

  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.NEON_DATABASE_URL;

  if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
    const isSsl =
      databaseUrl.includes('sslmode=require') ||
      databaseUrl.includes('neon.tech') ||
      process.env.NODE_ENV === 'production';

    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
      max: process.env.NODE_ENV === 'production' ? 10 : 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    activePool = pool;
    global.__habitflow_pool__ = pool;

    const db = drizzleNodePg(pool, { schema });
    dbInstance = db;
  } else {
    // Local embedded PGlite instance for zero-friction setup
    const isVercel = Boolean(process.env.VERCEL);
    const isTest = process.env.NODE_ENV === 'test' || 
                   process.argv.includes('--test') || 
                   process.execArgv.includes('--test') ||
                   process.env.npm_lifecycle_event === 'test';

    let pglite: PGlite;
    if (isTest || isVercel) {
      pglite = new PGlite();
    } else {
      try {
        const dataDir = path.join(process.cwd(), 'data', 'habitflow_pg');
        fs.mkdirSync(dataDir, { recursive: true });
        pglite = new PGlite(dataDir);
      } catch {
        pglite = new PGlite();
      }
    }
    activePglite = pglite;
    global.__habitflow_pglite__ = pglite;

    const db = drizzlePglite(pglite, { schema });
    dbInstance = db;
  }

  if (process.env.NODE_ENV !== 'production') {
    global.__habitflow_db__ = dbInstance;
  }

  return dbInstance;
}

export async function ensureDbInitialized(): Promise<void> {
  if (global.__habitflow_initialized__) {
    return;
  }

  if (global.__habitflow_init_promise__) {
    return global.__habitflow_init_promise__;
  }

  const runInit = async () => {
    try {
      if (activePool) {
        for (const statement of SCHEMA_STATEMENTS) {
          await activePool.query(statement);
        }
      } else if (activePglite) {
        for (const statement of SCHEMA_STATEMENTS) {
          await activePglite.exec(statement);
        }
      }
      global.__habitflow_initialized__ = true;
    } catch (err) {
      console.error('Failed to initialize database tables:', err);
      global.__habitflow_init_promise__ = undefined;
      throw err;
    }
  };

  global.__habitflow_init_promise__ = runInit();
  return global.__habitflow_init_promise__;
}

export const db = initDatabase();

// Trigger background initialization at startup
ensureDbInitialized().catch(() => {});

export { schema };
