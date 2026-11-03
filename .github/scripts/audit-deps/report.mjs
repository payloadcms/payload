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
