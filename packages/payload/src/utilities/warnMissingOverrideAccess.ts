import type { Payload } from '../index.js'

/**
 * Operations already warned about, so a hot path logs one line rather than one
 * per call. Process-wide and never cleared outside tests — the warning exists to
 * be noticed once, not to be counted.
 */
const warnedOperations = new Set<string>()

/**
 * Warns that a Local API call omitted `overrideAccess`.
 *
 * TypeScript makes the property required, so this only fires for callers the
 * compiler cannot reach: JavaScript projects, `as any` casts, and third-party
 * plugins whose JavaScript was compiled against Payload 3. For them this is the
 * only signal that behaviour changed.
 *
 * Always on, including production. A missing value now enforces access control
 * where it used to skip it, which can look like documents disappearing; the
 * warning is what connects that symptom to its cause.
 */
export const warnMissingOverrideAccess = ({
  operation,
  payload,
}: {
  operation: string
  payload: Payload
}): void => {
  if (warnedOperations.has(operation)) {
    return
  }

  warnedOperations.add(operation)

  payload.logger.warn(
    `${operation} was called without \`overrideAccess\`. The property is required as of Payload 4, and a missing value is treated as \`false\`, which enforces access control. Payload 3 defaulted it to \`true\`, which skipped access control, so this call may now return fewer documents than before. Pass \`overrideAccess: true\` to keep the previous behaviour, or \`overrideAccess: false\` and a \`user\` when the operation acts on behalf of someone. This warning is logged once per operation.`,
  )
}

/**
 * Clears the record of which operations have warned. For tests only.
 */
export const resetOverrideAccessWarnings = (): void => {
  warnedOperations.clear()
}
