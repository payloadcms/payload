import { readFile } from 'node:fs/promises'

import { buildBumps, buildPrs, listNoFix } from './bumps.mjs'

/**
 * @typedef {object} Plan
 * @property {import('./bumps.mjs').Bump[]} bumps
 * @property {import('./bumps.mjs').PlannedPr[]} prs every PR names at least one bump in `bumps`
 * @property {import('./bumps.mjs').NoFix[]} noFix
 * @property {Record<string, string[]>} originDirs bump ID to the `packages/` folder names that
 *   declare its dependency and get its advisories through it
 */

/**
 * Builds the bump and PR plan for `ref` from its audit report.
 * @returns {Plan}
 */
export function buildPlan({ ref, report, scope }) {
  const bumps = buildBumps({ report })

  return {
    bumps,
    prs: buildPrs({ bumps, ref }),
    noFix: listNoFix({ report, scope }),
    originDirs: Object.fromEntries(bumps.map((bump) => [bump.id, originDirsFor({ bump, report })])),
  }
}

/**
 * Reads a plan file. A missing file, invalid JSON, a missing list and a PR with no bump or an
 * unknown bump all throw, so no step continues with a bad plan.
 * @returns {Promise<Plan>}
 */
export async function readPlan({ path }) {
  let plan
  try {
    plan = JSON.parse(await readFile(path, 'utf8'))
  } catch {
    throw invalidPlanError({ path, reason: 'not readable JSON' })
  }

  const reason = findPlanProblem({ plan })
  if (reason) {
    throw invalidPlanError({ path, reason })
  }

  return plan
}

export function findPr({ plan, prId }) {
  const pr = plan.prs.find((candidate) => candidate.id === prId)
  if (!pr) {
    throw new Error(`unknown PR: ${prId}`)
  }

  return pr
}

/** @returns {import('./bumps.mjs').Bump[]} the bumps of `pr`, in its order */
export function bumpsOfPr({ plan, pr }) {
  const bumpsById = new Map(plan.bumps.map((bump) => [bump.id, bump]))

  return pr.bumpIds.map((bumpId) => {
    const bump = bumpsById.get(bumpId)
    if (!bump) {
      throw new Error(`unknown bump: ${bumpId}`)
    }
    return bump
  })
}

// An advisory can reach different origin packages through different dependencies, so each bump
// takes only the origin packages that declare its own dependency.
function originDirsFor({ bump, report }) {
  const dirs = report.findings
    .filter((finding) => bump.advisories.includes(finding.advisory))
    .flatMap((finding) => {
      const origins = new Set(finding.originPackages ?? [])
      return finding.bumps
        .filter((entry) => entry.dependency === bump.dependency)
        .flatMap((entry) => (entry.workspacePackages ?? []).filter((dir) => origins.has(dir)))
    })

  return [...new Set(dirs)].sort()
}

function findPlanProblem({ plan }) {
  if (!Array.isArray(plan?.bumps) || !Array.isArray(plan.prs) || !Array.isArray(plan.noFix)) {
    return 'missing bumps, prs or noFix'
  }
  if (typeof plan.originDirs !== 'object' || plan.originDirs === null) {
    return 'missing originDirs'
  }

  const bumpIds = new Set(plan.bumps.map((bump) => bump.id))
  for (const pr of plan.prs) {
    if (!Array.isArray(pr?.bumpIds) || pr.bumpIds.length === 0) {
      return `PR ${pr?.id} has no bumps`
    }
    const unknown = pr.bumpIds.find((bumpId) => !bumpIds.has(bumpId))
    if (unknown !== undefined) {
      return `PR ${pr.id} names an unknown bump ${unknown}`
    }
  }

  return null
}

function invalidPlanError({ path, reason }) {
  return new Error(`audit plan missing or invalid: ${path}: ${reason}`)
}
