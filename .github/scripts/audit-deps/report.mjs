import { readFile } from 'node:fs/promises'

/**
 * Reads the audit report that the audit-dependencies action writes. A missing file, invalid
 * JSON and an unexpected shape all throw the same error, so no caller continues with a bad report.
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
