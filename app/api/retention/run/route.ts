import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getRetentionSettings, getNotificationSettings } from '@/lib/growth-config';
import { calculateChurnRisk } from '@/lib/churn-engine';
import { buildRealtimeNotifications } from '@/lib/notification-engine';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [retentionSettings, notificationSettings] = await Promise.all([
    getRetentionSettings(),
    getNotificationSettings(),
  ]);

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, plan_key, credits_balance, created_at')
    .limit(100);

  const processed: Array<{ userId: string; segment: string; churnRisk: number }> = [];

  for (const profile of profiles || []) {
    const { data: analyses } = await supabaseAdmin
      .from('analyses')
      .select('id, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const latest = analyses?.[0]?.created_at ? new Date(analyses[0].created_at) : new Date(profile.created_at);
    const daysSince = Math.max(0, Math.floor((Date.now() - latest.getTime()) / (1000 * 60 * 60 * 24)));
    const churn = calculateChurnRisk({
      daysSinceLastAnalysis: daysSince,
      analysesLast30d: (analyses || []).length,
      planKey: profile.plan_key,
      creditsBalance: profile.credits_balance,
    });

    await supabaseAdmin.from('retention_events').insert({
      user_id: profile.id,
      churn_risk: churn.churnRisk,
      segment: churn.segment,
      actions: churn.actions,
      metadata: { days_since_last_analysis: daysSince },
    });

    if (retentionSettings.crmEnabled) {
      await supabaseAdmin.from('crm_events').insert({
        user_id: profile.id,
        event_type: churn.segment === 'high' ? 'winback_sequence' : churn.segment === 'medium' ? 'activation_nudge' : 'upsell_sequence',
        payload: {
          churn_risk: churn.churnRisk,
          suggested_actions: churn.actions,
          winback_credit_bonus: retentionSettings.winbackCreditBonus,
          winback_discount_percent: retentionSettings.winbackDiscountPercent,
        },
      });
    }

    if (notificationSettings.inAppEnabled) {
      const notifications = buildRealtimeNotifications(churn.actions);
      await supabaseAdmin.from('notification_events').insert(
        notifications.map((item) => ({
          user_id: profile.id,
          channel: 'in_app',
          title: item.title,
          message: item.message,
          status: 'queued',
        }))
      );
    }

    processed.push({ userId: profile.id, segment: churn.segment, churnRisk: churn.churnRisk });
  }

  return NextResponse.json({ success: true, processedCount: processed.length, processed });
}
