import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import * as fs from 'fs';
import * as path from 'path';
import * as schema from './schema';
import { INIT_SCHEMA_SQL } from './init';

type DrizzleDb = ReturnType<typeof drizzleNodePg<typeof schema>> | ReturnType<typeof drizzlePglite<typeof schema>>;

declare global {
  // eslint-disable-next-line no-var
  var __habitflow_db__: DrizzleDb | undefined;
  // eslint-disable-next-line no-var
  var __habitflow_initialized__: boolean | undefined;
}

let dbInstance: DrizzleDb;

function initDatabase(): DrizzleDb {
  if (global.__habitflow_db__) {
    return global.__habitflow_db__;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('sslmode=require') || databaseUrl.includes('neon.tech') 
        ? { rejectUnauthorized: false } 
        : undefined,
    });
    const db = drizzleNodePg(pool, { schema });

    if (!global.__habitflow_initialized__) {
      pool.query(INIT_SCHEMA_SQL).catch((err) => {
        console.error('Failed to initialize database tables on PostgreSQL:', err);
      });
      global.__habitflow_initialized__ = true;
    }

    dbInstance = db;
  } else {
    // Local embedded PGlite instance for zero-friction setup
    const isTest = process.env.NODE_ENV === 'test' || 
                   process.argv.includes('--test') || 
                   process.execArgv.includes('--test') ||
                   process.env.npm_lifecycle_event === 'test';

    let pglite: PGlite;
    if (isTest) {
      pglite = new PGlite();
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'habitflow_pg');
      fs.mkdirSync(dataDir, { recursive: true });
      pglite = new PGlite(dataDir);
    }
    const db = drizzlePglite(pglite, { schema });

    if (!global.__habitflow_initialized__ || isTest) {
      pglite.exec(INIT_SCHEMA_SQL).catch((err) => {
        console.error('Failed to initialize database tables on PGlite:', err);
      });
      global.__habitflow_initialized__ = true;
    }

    dbInstance = db;
  }

  if (process.env.NODE_ENV !== 'production') {
    global.__habitflow_db__ = dbInstance;
  }

  return dbInstance;
}

export const db = initDatabase();
export { schema };
