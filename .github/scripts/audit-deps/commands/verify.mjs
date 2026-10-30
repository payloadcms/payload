import { applyBumps, UnsupportedSpecifierError } from '../apply-bumps.mjs'
import { findUnclearedBumps } from '../bumps.mjs'
import { findDisallowedChanges, listWorkingTreeChanges } from '../path-guard.mjs'
import { readReport } from '../report.mjs'
import { failWithReasons, findBump, parseBumpIds, readPlan, requireOption } from './shared.mjs'

/** `apply-bumps --plan --bump-ids --cwd`: edits manifests and the catalog only; runs no pnpm. */
export async function runApplyBumps({ options }) {
  const plan = await readPlan({ options })
  const bumps = parseBumpIds({ options }).map((bumpId) => findBump({ plan, bumpId }))

  try {
    const { changes } = await applyBumps({ bumps, cwd: options.cwd ?? process.cwd() })
    for (const { after, before, dependency, file } of changes) {
      process.stdout.write(`${file}: ${dependency} ${before} -> ${after}\n`)
    }
  } catch (error) {
    if (!(error instanceof UnsupportedSpecifierError)) {
      throw error
    }
    failWithReasons({ reasons: [error.message] })
  }
}

/** `check-cleared --plan --bump-ids --report`: exits 1 when a bump cleared none of its advisories. */
export async function runCheckCleared({ options }) {
  const plan = await readPlan({ options })
  const bumps = parseBumpIds({ options }).map((bumpId) => findBump({ plan, bumpId }))
  const report = await readReport({ path: requireOption({ name: 'report', options }) })
  const uncleared = findUnclearedBumps({ bumps, report })

  failWithReasons({
    reasons: uncleared.length > 0 ? [`bumps cleared nothing: ${uncleared.join(', ')}`] : [],
  })
}

/** `path-guard --cwd`: exits 1 for any change outside the manifest and lockfile allowlist. */
export async function runPathGuard({ options }) {
  const changes = await listWorkingTreeChanges({ cwd: options.cwd ?? process.cwd() })

  failWithReasons({ reasons: findDisallowedChanges({ changes }) })
}
