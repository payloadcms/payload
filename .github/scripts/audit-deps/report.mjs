import { readFile } from 'node:fs/promises'

/**
 * Reads the audit report written by the audit-dependencies action.
 * Throws a single error for missing files, bad JSON, and wrong shape so callers fail closed.
 */
export async function readReport({ path }) {
  const invalidError = new Error(`audit report missing or invalid: ${path}`)

  let report
  try {
    report = JSON.parse(await readFile(path, 'utf8'))
  } catch {
    throw invalidError
  }

  if (!Array.isArray(report?.findings) || !Array.isArray(report?.plan?.actions)) {
    throw invalidError
  }

  return report
}

/** Advisories that an automated fix can clear; `relock` only counts for monorepo scope. */
export function selectFixableAdvisories({ report, scope }) {
  const fixableStatuses = scope === 'monorepo' ? ['fix', 'relock'] : ['fix']

  const advisories = report.findings
    .filter((finding) => finding.bumps.some((bump) => fixableStatuses.includes(bump.fix.status)))
    .map((finding) => finding.advisory)

  return sortedUnique({ values: advisories })
}

function sortedUnique({ values }) {
  return [...new Set(values)].sort()
}
