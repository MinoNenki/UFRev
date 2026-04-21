import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

function checked(formData: FormData, key: string) {
  return formData.get(key) === 'on';
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(req: NextRequest) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.redirect(new URL('/auth/login', req.url));

  const formData = await req.formData();
  const alertEmailAddress = readString(formData, 'alertEmailAddress');
  const telegramChatId = readString(formData, 'telegramChatId');
  const discordWebhookUrl = readString(formData, 'discordWebhookUrl');

  if (alertEmailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(alertEmailAddress)) {
    return NextResponse.redirect(new URL('/admin/automations?deliveryError=1', req.url));
  }

  if (discordWebhookUrl && !/^https?:\/\//i.test(discordWebhookUrl)) {
    return NextResponse.redirect(new URL('/admin/automations?deliveryError=1', req.url));
  }

  await supabaseAdmin.from('app_config').upsert({
    key: 'notification_settings',
    value_json: {
      in_app_enabled: checked(formData, 'inAppEnabled'),
      email_enabled: checked(formData, 'emailEnabled'),
      telegram_enabled: checked(formData, 'telegramEnabled'),
      discord_enabled: checked(formData, 'discordEnabled'),
      push_enabled: checked(formData, 'pushEnabled'),
      realtime_alerts_enabled: checked(formData, 'realtimeAlertsEnabled'),
      alert_email_address: alertEmailAddress,
      telegram_chat_id: telegramChatId,
      discord_webhook_url: discordWebhookUrl,
    },
    updated_at: new Date().toISOString(),
  });

  return NextResponse.redirect(new URL('/admin/automations?deliveryUpdated=1', req.url));
}
