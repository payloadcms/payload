import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { AdvisoryHit } from '../types'
import type { ConsumerPackage } from './packages'

import { mergeHits, parseAuditReport, toHits } from './auditReport'
import { runPnpm, type RunPnpm } from './runPnpm'

const DEFAULT_CONCURRENCY = 4

/**
 * Audits the consumer-facing surface by, for each published package, resolving
 * its production dependencies fresh in a temp dir (`pnpm install --lockfile-only`
 * — no node_modules, no repo lockfile) and auditing that. Results merge by GHSA.
 *
 * Allowlisted advisories are not suppressed here: pnpm returns every advisory so
 * the reporting layer can both filter actionable findings and re-review the
 * allowlist for newly available fixes.
 */
export const runConsumerAudit = async ({
  concurrency = DEFAULT_CONCURRENCY,
  packages,
  run = runPnpm,
}: {
  concurrency?: number
  packages: ConsumerPackage[]
  run?: RunPnpm
}): Promise<AdvisoryHit[]> => {
  const perPackage = await mapWithConcurrency(packages, concurrency, (pkg) =>
    auditPackage({ pkg, run }),
  )
  return mergeHits(perPackage.flat())
}

const auditPackage = async ({
  pkg,
  run,
}: {
  pkg: ConsumerPackage
  run: RunPnpm
}): Promise<AdvisoryHit[]> => {
  if (Object.keys(pkg.dependencies).length === 0) {
    return []
  }

  const dir = await mkdtemp(join(tmpdir(), `audit-${pkg.shortName}-`))
  try {
    const manifest = {
      dependencies: pkg.dependencies,
      name: `audit-${pkg.shortName}`,
      private: true,
      version: '0.0.0',
    }
    await writeFile(join(dir, 'package.json'), JSON.stringify(manifest, null, 2))

    const install = await run({
      // auto-install-peers is on by default in pnpm; disabling it keeps peer deps
      // (e.g. a consumer's own `next`) out of the resolve, matching what a consumer
      // actually receives from this package's `dependencies` alone.
      args: [
        'install',
        '--lockfile-only',
        '--prod',
        '--config.auto-install-peers=false',
        '--reporter=silent',
      ],
      cwd: dir,
    })
    if (install.code !== 0) {
      // A failed resolve would otherwise yield an empty (falsely clean) audit.
      console.warn(
        `Warning: could not resolve dependencies for ${pkg.name}; its audit was skipped.` +
          (install.stderr ? `\n${install.stderr.trim()}` : ''),
      )
      return []
    }

    const result = await run({
      args: ['audit', '--prod', '--json', '--ignore-registry-errors'],
      cwd: dir,
    })
    const report = parseAuditReport(result.stdout)
    return toHits({ originPackage: pkg.shortName, report })
  } finally {
    await rm(dir, { force: true, recursive: true })
  }
}

/** Runs `task` over `items` with a bounded number of concurrent workers. */
const mapWithConcurrency = async <Item, Result>(
  items: Item[],
  limit: number,
  task: (item: Item) => Promise<Result>,
): Promise<Result[]> => {
  const results: Result[] = new Array(items.length)
  let cursor = 0

  const worker = async (): Promise<void> => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await task(items[index])
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}
