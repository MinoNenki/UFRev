import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { collectProMarketData } from '@/lib/market-connectors';
import { dispatchQueuedNotifications } from '@/lib/crm-delivery';
import { buildMarketWatchNotifications, buildWeeklyDigestNotification, getEnabledNotificationChannels } from '@/lib/notification-engine';
import { getNotificationSettings } from '@/lib/growth-config';
import { getAutomationSettings } from '@/lib/profit-config';
import { buildMarketWatchReport, buildWeeklyMarketDigest, getActiveMarketWatchlists, getRecentMarketWatchSnapshots, persistMarketWatchReport, type MarketWatchReport } from '@/lib/market-watch';

export const runtime = 'nodejs';

function parseCompetitorUrls(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter((item) => /^https?:\/\//i.test(item));
  }

  if (typeof value === 'string') {
    return value.split(/[\n,\s]+/).map((item) => item.trim()).filter((item) => /^https?:\/\//i.test(item));
  }

  return [] as string[];
}

async function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.MARKET_WATCH_CRON_SECRET || process.env.CRON_SECRET;
  const providedSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (cronSecret && providedSecret === cronSecret) return true;

  const { isAdmin } = await requireAdmin();
  return isAdmin;
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const limit = Math.max(1, Math.min(Number(body.limit || 25), 100));
    const weeklyDigest = body.weeklyDigest !== false;
    const dispatchNow = Boolean(body.dispatchNow);

    const [automationSettings, notificationSettings] = await Promise.all([
      getAutomationSettings(),
      getNotificationSettings(),
    ]);

    if (!automationSettings.autoCompetitorScans) {
      return NextResponse.json({ success: true, skipped: true, reason: 'Automatic competitor scans are disabled in settings.' });
    }

    const watchlists = await getActiveMarketWatchlists(limit);
    if (!watchlists.length) {
      return NextResponse.json({ success: true, processedCount: 0, alertsQueued: 0, digestsQueued: 0, processed: [] });
    }

    const groupedByUser = new Map<string, Array<{ label: string | null; report: MarketWatchReport }>>();
    const processed: Array<{ watchlist: string; status: string; changed: boolean; strongestMove: string }> = [];
    let alertsQueued = 0;

    for (const watchlist of watchlists) {
      const competitorUrls = parseCompetitorUrls(watchlist.competitor_urls);
      const marketData = await collectProMarketData({
        websiteUrl: watchlist.website_url,
        competitorUrls: competitorUrls.join('\n'),
      });

      const previousSnapshots = await getRecentMarketWatchSnapshots(watchlist.user_id, [watchlist.website_url, ...competitorUrls]);
      const report = buildMarketWatchReport({ marketData, previousSnapshots });

      await persistMarketWatchReport({
        userId: watchlist.user_id,
        websiteUrl: watchlist.website_url,
        competitorUrls,
        report,
        saveWatchlist: false,
      });

      if (notificationSettings.realtimeAlertsEnabled && automationSettings.autoMarketWatchAlerts && report.status !== 'watch') {
        const notification = buildMarketWatchNotifications({
          label: watchlist.label || watchlist.website_url,
          headline: report.headline,
          strongestMove: report.strongestMove,
          status: report.status,
        });

        await supabaseAdmin.from('notification_events').insert({
          user_id: watchlist.user_id,
          channel: 'in_app',
          title: notification.title,
          message: notification.message,
          status: 'queued',
        });
        alertsQueued += 1;
      }

      const bucket = groupedByUser.get(watchlist.user_id) || [];
      bucket.push({ label: watchlist.label || watchlist.website_url, report });
      groupedByUser.set(watchlist.user_id, bucket);

      processed.push({
        watchlist: watchlist.website_url,
        status: report.status,
        changed: report.changed,
        strongestMove: report.strongestMove,
      });
    }

    let digestsQueued = 0;
    if (weeklyDigest && automationSettings.weeklyMarketDigest && getEnabledNotificationChannels(notificationSettings).length > 0) {
      for (const [userId, reports] of groupedByUser.entries()) {
        const digest = buildWeeklyMarketDigest({
          label: reports.length === 1 ? reports[0].label : `${reports.length} market watchlists`,
          reports: reports.map((item) => item.report),
        });

        const notification = buildWeeklyDigestNotification({
          label: reports.length === 1 ? reports[0].label : `${reports.length} watchlists`,
          summary: digest.summary,
          highlights: digest.highlights,
          status: digest.status,
        });

        await supabaseAdmin.from('notification_events').insert({
          user_id: userId,
          channel: 'in_app',
          title: notification.title,
          message: notification.message,
          status: 'queued',
        });
        digestsQueued += 1;
      }
    }

    const dispatchResult = dispatchNow ? await dispatchQueuedNotifications(100) : null;

    return NextResponse.json({
      success: true,
      processedCount: processed.length,
      alertsQueued,
      digestsQueued,
      processed,
      dispatchResult,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
