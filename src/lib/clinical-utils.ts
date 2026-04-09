/**
 * Standardizes risk score within 0-100 bounds.
 */
export function calculateNewRiskScore(current: number, delta: number): number {
  return Math.min(100, Math.max(0, current + delta))
}

/**
 * Determines patient monitoring status based on risk score thresholds.
 * Thresholds:
 * - 70+: Critical
 * - 30-69: Monitoring
 * - <30: Stable
 */
export function determinePatientStatus(score: number): 'critical' | 'monitoring' | 'stable' {
  if (score >= 70) return 'critical'
  if (score >= 30) return 'monitoring'
  return 'stable'
}
