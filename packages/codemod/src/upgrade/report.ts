import type { TransformRunResult } from '../runner.js'

export type VersionReportRow = {
  name: string
  ok: boolean
  resolved?: string
  wrote: string
}

export type ReportModel = {
  nextTarget: null | string
  overridesRemoved: string[]
  runbookPath: string
  transforms: TransformRunResult[]
  versions: VersionReportRow[]
}

/** Build the honest end-of-run report string. Pure — the caller prints it. */
export function renderReport(model: ReportModel): string {
  const lines: string[] = []
  lines.push('Payload v4 upgrade — mechanical steps complete', '')

  lines.push('Versions written -> resolved')
  for (const v of model.versions) {
    const resolved = v.resolved ?? '(unresolved)'
    lines.push(`  ${v.name}  ${v.wrote} -> ${resolved}  ${v.ok ? 'ok' : 'MISMATCH'}`)
  }
  const anyMismatch = model.versions.some((v) => !v.ok)
  if (anyMismatch) {
    lines.push('  ! Resolution mismatch — tree is NOT confirmed v4. Investigate before continuing.')
  }
  lines.push('')

  if (model.overridesRemoved.length > 0) {
    lines.push(`Overrides removed: ${model.overridesRemoved.join(', ')}`, '')
  }

  lines.push('Transforms')
  for (const r of model.transforms) {
    if (r.error) {
      lines.push(`  [FAIL] ${r.name} — ${r.error.message}`)
      continue
    }
    lines.push(`  [ok] ${r.name} — ${r.filesChanged.length} file(s) changed`)
    for (const note of r.notes ?? []) {
      lines.push(`      note: ${note}`)
    }
  }
  lines.push('')

  lines.push('Next.js: not upgraded by this command')
  lines.push(
    `  Target Next version: ${model.nextTarget ?? '(see @payloadcms/next peer range)'} (>=16.2.6 <17).`,
  )
  lines.push(
    '  The unmet @payloadcms/next peer is expected until you upgrade Next — that is the immediate next step.',
  )
  lines.push('')

  lines.push('Not done by this command — see the runbook for the remaining steps:')
  lines.push(`  ${model.runbookPath}`)

  return lines.join('\n')
}
