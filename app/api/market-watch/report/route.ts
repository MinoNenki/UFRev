import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { collectProMarketData } from '@/lib/market-connectors';
import { buildMarketWatchReport, getRecentMarketWatchDigest, getRecentMarketWatchSnapshots, persistMarketWatchReport } from '@/lib/market-watch';
import type { Language } from '@/lib/i18n';

export const runtime = 'nodejs';

function resolveLanguage(value: unknown): Language {
  return value === 'pl' ? 'pl' : 'en';
}

function parseUrlList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter((item) => /^https?:\/\//i.test(item));
  }

  return String(value || '')
    .split(/[\n,\s]+/)
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//i.test(item));
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const events = await getRecentMarketWatchDigest(user.id, 12);
    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
  const language = resolveLanguage(body.language);
    const websiteUrl = String(body.websiteUrl || '').trim();
    const competitorUrls = parseUrlList(body.competitorUrls);

    if (!websiteUrl && !competitorUrls.length) {
      return NextResponse.json({ error: 'Provide at least one product or competitor URL.' }, { status: 400 });
    }

    const marketData = await collectProMarketData({
      websiteUrl,
      competitorUrls: competitorUrls.join('\n'),
    });

    const previousSnapshots = await getRecentMarketWatchSnapshots(user.id, [websiteUrl, ...competitorUrls].filter(Boolean));
    const report = buildMarketWatchReport({ marketData, previousSnapshots, language });

    await persistMarketWatchReport({
      userId: user.id,
      websiteUrl,
      competitorUrls,
      report,
      saveWatchlist: Boolean(body.saveWatchlist),
    });

    const events = await getRecentMarketWatchDigest(user.id, 12);

    return NextResponse.json({
      success: true,
      report,
      events,
      savedWatchlist: Boolean(body.saveWatchlist),
      marketData: {
        competitorCount: marketData.competitors.length,
        sourceNotes: [...marketData.sourceNotes, ...marketData.connectorSignals.map((item) => item.note)],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
