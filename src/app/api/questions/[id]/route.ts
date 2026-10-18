import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { updateQuestion, deleteQuestion, getQuestionById } from '@/lib/data-access/questions';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const question = await getQuestionById(user.id, id);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ question });
  } catch (err: any) {
    console.error('Error fetching question:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await updateQuestion(user.id, id, body);
    return NextResponse.json({ question: updated });
  } catch (err: any) {
    console.error('Error updating question:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update question' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const success = await deleteQuestion(user.id, id);
    if (!success) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting question:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete question' },
      { status: 500 }
    );
  }
}
