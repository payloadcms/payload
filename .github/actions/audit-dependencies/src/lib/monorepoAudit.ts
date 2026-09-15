import type { AdvisoryHit } from '../types'

import { parseAuditReport, toHits } from './auditReport'
import { ignoreArgs, runPnpm, type RunPnpm } from './runPnpm'

/** Audits the whole workspace via `pnpm audit --prod` against the repo lockfile. */
export const runMonorepoAudit = async ({
  cwd,
  ignoreGhsas,
  run = runPnpm,
}: {
  cwd: string
  ignoreGhsas: string[]
  run?: RunPnpm
}): Promise<AdvisoryHit[]> => {
  const result = await run({
    args: ['audit', '--prod', '--json', '--ignore-registry-errors', ...ignoreArgs(ignoreGhsas)],
    cwd,
  })
  const report = parseAuditReport(result.stdout)
  return toHits({ originPackage: null, report })
}
