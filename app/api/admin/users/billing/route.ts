import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizePlanKey, PLANS } from '@/lib/plans';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return NextResponse.redirect(new URL('/auth/login', req.url));
  const formData = await req.formData();
  const id = String(formData.get('id') || '');
  const requestedPlanKey = String(formData.get('planKey') || 'free');
  const planKey = normalizePlanKey(requestedPlanKey);
  const creditsBalance = Number(formData.get('creditsBalance') || 0);
  if (!id || !(planKey in PLANS) || creditsBalance < 0) return NextResponse.redirect(new URL('/admin/users?error=1', req.url));
  const selectedPlan = PLANS[planKey];
  await supabaseAdmin.from('profiles').update({ plan_key: planKey, credits_balance: creditsBalance, monthly_analysis_limit: selectedPlan.monthlyAnalyses }).eq('id', id);
  return NextResponse.redirect(new URL('/admin/users?updated=1', req.url));
}
