import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getEntriesForDate, getEntriesDateRange, saveHourlyEntry } from '@/lib/data-access/entries';
import { getTodayString } from '@/lib/calculations';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (startDate && endDate) {
      const entries = await getEntriesDateRange(user.id, startDate, endDate);
      return NextResponse.json({ entries });
    }

    const targetDate = date || getTodayString();
    const entries = await getEntriesForDate(user.id, targetDate);
    return NextResponse.json({ entries, date: targetDate });
  } catch (err: any) {
    console.error('Error fetching entries:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch entries' },
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
    const { questionId, value, date, timeSlot, outcomeSnapshot, optionId, notes } = body;

    if (!questionId || !value || !date || !timeSlot || !outcomeSnapshot) {
      return NextResponse.json(
        { error: 'questionId, value, date, timeSlot, and outcomeSnapshot are required' },
        { status: 400 }
      );
    }

    const entry = await saveHourlyEntry(user.id, {
      questionId,
      optionId,
      value,
      date,
      timeSlot,
      outcomeSnapshot,
      notes,
    });

    return NextResponse.json({ entry }, { status: 200 });
  } catch (err: any) {
    console.error('Error saving entry:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to save entry' },
      { status: 500 }
    );
  }
}
