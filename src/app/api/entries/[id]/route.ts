import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { deleteHourlyEntry } from '@/lib/data-access/entries';

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
    const success = await deleteHourlyEntry(user.id, id);
    if (!success) {
      return NextResponse.json({ error: 'Entry not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting entry:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete entry' },
      { status: 500 }
    );
  }
}
