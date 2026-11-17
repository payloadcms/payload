import type { Severity } from '../types'

const SEVERITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  info: 0,
  low: 1,
  moderate: 2,
}

export const severityRank = (severity: string): number => SEVERITY_ORDER[severity] ?? 0

/** True when the advisory's severity is at or above the reporting threshold. */
export const meetsThreshold = ({
  advisorySeverity,
  threshold,
}: {
  advisorySeverity: string
  threshold: Severity
}): boolean => severityRank(advisorySeverity) >= severityRank(threshold)

/** `<0.0.0` is pnpm's sentinel for "no fix exists yet" — nothing to act on. */
export const isFixable = (patchedVersions: string): boolean => patchedVersions !== '<0.0.0'
