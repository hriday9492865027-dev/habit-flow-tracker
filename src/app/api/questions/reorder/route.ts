import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { reorderQuestions } from '@/lib/data-access/questions';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (!Array.isArray(body.questionIds)) {
      return NextResponse.json({ error: 'questionIds must be an array' }, { status: 400 });
    }

    await reorderQuestions(user.id, body.questionIds);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error reordering questions:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to reorder questions' },
      { status: 500 }
    );
  }
}
