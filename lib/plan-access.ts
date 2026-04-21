import { normalizePlanKey, type PlanKey } from '@/lib/plans';

const PLAN_RANK: Record<PlanKey, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  scale: 3,
};

export function hasPlanAccess(planKey: string | null | undefined, minimumPlan: PlanKey) {
  return PLAN_RANK[normalizePlanKey(planKey)] >= PLAN_RANK[minimumPlan];
}

export function getAutomationAccess(planKey: string | null | undefined) {
  const normalized = normalizePlanKey(planKey);

  return {
    planKey: normalized,
    hasAutomationWorkspace: hasPlanAccess(normalized, 'pro'),
    hasMarketWatch: hasPlanAccess(normalized, 'scale'),
    hasAlertRouting: hasPlanAccess(normalized, 'scale'),
  };
}

export function getIntegrationAccess(planKey: string | null | undefined) {
  const normalized = normalizePlanKey(planKey);

  return {
    planKey: normalized,
    hasIntegrationWorkspace: hasPlanAccess(normalized, 'pro'),
    hasMarketplaceExpansion: hasPlanAccess(normalized, 'scale'),
    hasSocialDemandLayer: hasPlanAccess(normalized, 'scale'),
  };
}