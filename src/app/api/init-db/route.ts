import { NextResponse } from 'next/server';
import { ensureDbInitialized, db, schema } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureDbInitialized();
    const count = await (db as any).select().from(schema.users).limit(1);
    return NextResponse.json({
      success: true,
      message: 'Neon database tables initialized and verified successfully!',
      sampleCheck: 'users table is ready',
      rowCount: count.length,
    });
  } catch (err: any) {
    console.error('Failed to initialize database via /api/init-db:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Database initialization error',
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}
