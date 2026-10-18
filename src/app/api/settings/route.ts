import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getUserSettings, updateUserSettings } from '@/lib/data-access/settings';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getUserSettings(user.id);
    return NextResponse.json({ settings });
  } catch (err: any) {
    console.error('Error fetching settings:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const settings = await updateUserSettings(user.id, body);
    return NextResponse.json({ settings });
  } catch (err: any) {
    console.error('Error updating settings:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
