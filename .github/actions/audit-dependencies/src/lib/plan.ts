import type { FixResult, Plan, PlanAction, ReportedFinding, Scope } from '../types'

/**
 * Builds a machine-readable remediation plan from the reported findings, grouping
 * each direct-dependency bump into the concrete action an agent can apply: refresh
 * the lockfile, edit a manifest, or escalate for a human decision.
 */
export const buildPlan = ({
  findings,
  scope,
}: {
  findings: ReportedFinding[]
  scope: Scope
}): Plan => {
  const relock = new Map<string, Extract<PlanAction, { type: 'relock' }>>()
  const bump = new Map<string, Extract<PlanAction, { type: 'bump' }>>()
  const manual: Array<Extract<PlanAction, { type: 'manual' }>> = []

  for (const finding of findings) {
    for (const { dependency, fix, workspacePackages } of finding.bumps) {
      if (fix.status === 'relock') {
        relock.set(finding.package, {
          command: `pnpm update ${finding.package}`,
          module: finding.package,
          type: 'relock',
        })
        continue
      }
      if (fix.status === 'fix') {
        addBump({ bump, dependency, fix, workspacePackages })
        continue
      }
      manual.push({
        advisory: finding.advisory,
        dependency,
        module: finding.package,
        reason: manualReason(fix),
        type: 'manual',
      })
    }
  }

  const actions: PlanAction[] = [
    ...[...relock.values()].sort((a, b) => a.module.localeCompare(b.module)),
    ...[...bump.values()].sort(
      (a, b) => a.dependency.localeCompare(b.dependency) || a.toRange.localeCompare(b.toRange),
    ),
    ...manual.sort(
      (a, b) => a.advisory.localeCompare(b.advisory) || a.dependency.localeCompare(b.dependency),
    ),
  ]

  return { actions, scope, verify: verifyCommand(scope) }
}

const addBump = ({
  bump,
  dependency,
  fix,
  workspacePackages,
}: {
  bump: Map<string, Extract<PlanAction, { type: 'bump' }>>
  dependency: string
  fix: Extract<FixResult, { status: 'fix' }>
  workspacePackages: string[]
}): void => {
  const toRange = `>=${fix.version}`
  const key = `${dependency}\t${toRange}`
  const manifests = workspacePackages.map(manifestPath)
  const existing = bump.get(key)
  if (!existing) {
    bump.set(key, { crossesMajor: fix.crossesMajor, dependency, manifests, toRange, type: 'bump' })
    return
  }
  for (const manifest of manifests) {
    if (!existing.manifests.includes(manifest)) {
      existing.manifests.push(manifest)
    }
  }
}

/** Maps a workspace owner label to its package.json path. */
const manifestPath = (workspacePackage: string): string =>
  workspacePackage.includes('/')
    ? `${workspacePackage}/package.json`
    : `packages/${workspacePackage}/package.json`

const manualReason = (fix: Extract<FixResult, { status: 'none' | 'unknown' }>): string => {
  if (fix.status === 'none') {
    return 'no published version clears the vulnerability; allowlist or escalate'
  }
  return fix.reason === 'registry'
    ? 'registry unreachable; retry before deciding'
    : 'current version undeclared in scanned workspaces; determine the owner manually'
}

const verifyCommand = (scope: Scope): string =>
  scope === 'monorepo' ? 'pnpm script:audit:deps:monorepo' : 'pnpm script:audit:deps:consumer'
