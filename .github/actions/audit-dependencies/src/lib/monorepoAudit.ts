import type { AdvisoryHit } from '../types'

import { parseAuditReport, toHits } from './auditReport'
import { runPnpm, type RunPnpm } from './runPnpm'

/**
 * Audits the whole workspace via `pnpm audit --prod` against the repo lockfile.
 * Every advisory is returned (allowlist filtering happens in the reporting layer)
 * so the allowlist can be re-reviewed for newly available fixes.
 */
export const runMonorepoAudit = async ({
  cwd,
  run = runPnpm,
}: {
  cwd: string
  run?: RunPnpm
}): Promise<AdvisoryHit[]> => {
  const result = await run({
    args: ['audit', '--prod', '--json', '--ignore-registry-errors'],
    cwd,
  })
  const report = parseAuditReport(result.stdout)
  return toHits({ originPackage: null, report })
}
