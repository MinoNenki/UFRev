export function splitResult(result: any) {
  return {
    public: {
      verdict: result.verdict,
      confidence: result.confidence,
      summary: result.summary,
      nextStep: result.nextStep,
    },
    premium: {
      warnings: result.warnings,
      hiddenOpportunity: result.hiddenOpportunity,
    },
  };
}