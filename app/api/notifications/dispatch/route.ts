import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { dispatchQueuedNotifications } from '@/lib/crm-delivery';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const result = await dispatchQueuedNotifications(50);
  return NextResponse.json({ success: true, ...result });
}
