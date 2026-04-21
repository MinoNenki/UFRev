export function normalizeResult(raw: any) {
  return {
    verdict: raw.verdict || "TEST",
    confidence: Math.min(100, Math.max(0, raw.confidence || 50)),
    riskLevel: raw.riskLevel || "MEDIUM",
    summary: raw.summary || "",
    nextStep: raw.nextStep || "",
    warnings: raw.warnings || [],
    hiddenOpportunity: raw.hiddenOpportunity || "",
  };
}