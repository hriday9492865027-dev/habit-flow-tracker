import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getQuestionsForUser, createQuestion } from '@/lib/data-access/questions';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const questions = await getQuestionsForUser(user.id, includeArchived);
    return NextResponse.json({ questions });
  } catch (err: any) {
    console.error('Error fetching questions:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (!body.text || typeof body.text !== 'string' || body.text.trim().length === 0) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }

    const question = await createQuestion(user.id, body);
    return NextResponse.json({ question }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating question:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create question' },
      { status: 500 }
    );
  }
}
